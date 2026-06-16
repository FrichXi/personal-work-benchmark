import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { parseCsv } from "./csv.mjs";

export async function aggregateFile({ input, outDir, benchmark, generatedAt = null }) {
  const raw = await readFile(input, "utf8");
  const rows = parseCsv(raw);
  const entries = rows.map((row) => normalizeRow(row, benchmark));
  const leaderboard = aggregateEntries(entries);
  const result = {
    task: benchmark.task.id,
    generatedAt: resolveGeneratedAt(generatedAt),
    scoring: benchmark.scoring,
    entries,
    leaderboard,
  };

  await mkdir(outDir, { recursive: true });
  await writeFile(path.join(outDir, "leaderboard.json"), `${JSON.stringify(result, null, 2)}\n`);
  await writeFile(path.join(outDir, "leaderboard.md"), renderLeaderboardMarkdown(result));

  return result;
}

export function normalizeRow(row, benchmark) {
  const dimensions = {};

  for (const dimension of benchmark.scoring.dimensions) {
    const raw = Number(row[dimension.source ?? dimension.id]);
    const value = Number.isFinite(raw)
      ? dimension.scale_from
        ? (raw / Number(dimension.scale_from)) * Number(dimension.points)
        : raw
      : 0;
    dimensions[dimension.id] = Number(value.toFixed(2));
  }

  const computed = Object.values(dimensions).reduce((sum, value) => sum + value, 0);
  const score = Number.isFinite(Number(row.score)) ? Number(row.score) : computed;

  return {
    rank: numberOrNull(row.rank),
    round: row.round,
    model: row.model,
    runner: row.runner || "unspecified",
    score: Number(score.toFixed(2)),
    grade: row.grade || gradeForScore(score),
    dimensions,
    evidence: row.evidence || "",
  };
}

export function aggregateEntries(entries) {
  const groups = new Map();

  for (const entry of entries) {
    const key = `${entry.runner}:${entry.model}`;
    const group = groups.get(key) || {
      model: entry.model,
      runner: entry.runner,
      count: 0,
      avg: 0,
      min: Infinity,
      max: -Infinity,
      dimensions: {},
    };

    group.count += 1;
    group.avg += entry.score;
    group.min = Math.min(group.min, entry.score);
    group.max = Math.max(group.max, entry.score);

    for (const [dimension, value] of Object.entries(entry.dimensions)) {
      group.dimensions[dimension] = (group.dimensions[dimension] || 0) + value;
    }

    groups.set(key, group);
  }

  return Array.from(groups.values())
    .map((group) => ({
      ...group,
      avg: Number((group.avg / group.count).toFixed(2)),
      min: Number(group.min.toFixed(2)),
      max: Number(group.max.toFixed(2)),
      dimensions: Object.fromEntries(
        Object.entries(group.dimensions).map(([key, value]) => [
          key,
          Number((value / group.count).toFixed(2)),
        ])
      ),
    }))
    .sort((a, b) => b.avg - a.avg || a.model.localeCompare(b.model))
    .map((group, index) => ({ rank: index + 1, ...group }));
}

export function renderLeaderboardMarkdown(result) {
  const lines = [
    `# ${result.task} leaderboard`,
    "",
    `Generated at: ${result.generatedAt}`,
    "",
    "| Rank | Model | Runner | Count | Avg | Min-Max |",
    "|---:|---|---|---:|---:|---|",
  ];

  for (const row of result.leaderboard) {
    lines.push(
      `| ${row.rank} | ${row.model} | ${row.runner} | ${row.count} | ${row.avg} | ${row.min}-${row.max} |`
    );
  }

  lines.push("");
  lines.push("> Scores are scoped to this task only. They are not general model rankings.");
  lines.push("");

  return lines.join("\n");
}

function numberOrNull(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function gradeForScore(score) {
  if (score >= 92) return "A";
  if (score >= 88) return "A-";
  if (score >= 82) return "B+";
  if (score >= 75) return "B";
  if (score >= 68) return "C+";
  if (score >= 60) return "C";
  return "D";
}

function resolveGeneratedAt(value) {
  if (value) {
    return normalizeTimestamp(value);
  }

  if (process.env.SOURCE_DATE_EPOCH) {
    return new Date(Number(process.env.SOURCE_DATE_EPOCH) * 1000).toISOString();
  }

  return new Date().toISOString();
}

function normalizeTimestamp(value) {
  if (/^\d+$/.test(String(value))) {
    return new Date(Number(value) * 1000).toISOString();
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid generatedAt timestamp: ${value}`);
  }

  return date.toISOString();
}
