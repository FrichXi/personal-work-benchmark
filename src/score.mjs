import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { parseCsv, stringifyCsv } from "./csv.mjs";

const REQUIRED_BASE_COLUMNS = ["round", "model", "runner", "score", "evidence"];

export async function scoreFile({ input, outDir, benchmark }) {
  const raw = await readFile(input, "utf8");
  const rows = parseCsv(raw);
  const scoredRows = normalizeScoreRows(rows, benchmark);
  const headers = scoreHeaders(benchmark);

  await mkdir(outDir, { recursive: true });
  await writeFile(path.join(outDir, "scores.csv"), stringifyCsv(scoredRows, headers));

  return { rows: scoredRows, headers };
}

export function normalizeScoreRows(rows, benchmark) {
  if (!rows.length) {
    throw new Error("score input must contain at least one row");
  }

  const headers = Object.keys(rows[0]);
  const missing = requiredColumns(benchmark).filter((column) => !headers.includes(column));

  if (missing.length) {
    throw new Error(`score input is missing required columns: ${missing.join(", ")}`);
  }

  return rows.map((row, index) => normalizeScoreRow(row, benchmark, index));
}

export function requiredColumns(benchmark) {
  return [
    ...REQUIRED_BASE_COLUMNS,
    ...benchmark.scoring.dimensions.map((dimension) => dimension.source ?? dimension.id),
  ];
}

function scoreHeaders(benchmark) {
  return [
    "rank",
    ...REQUIRED_BASE_COLUMNS.slice(0, 3),
    "port",
    "score",
    "grade",
    "old_total",
    ...benchmark.scoring.dimensions.map((dimension) => dimension.source ?? dimension.id),
    "evidence",
  ];
}

function normalizeScoreRow(row, benchmark, index) {
  const normalized = {
    rank: row.rank || String(index + 1),
    round: row.round,
    model: row.model,
    runner: row.runner,
    port: row.port || "",
    score: normalizeNumber(row.score, `row ${index + 1} score`),
    grade: row.grade || "",
    old_total: row.old_total || "",
    evidence: row.evidence,
  };

  if (!normalized.evidence.trim()) {
    throw new Error(`row ${index + 1} evidence must be a site- or artifact-specific sentence`);
  }

  for (const dimension of benchmark.scoring.dimensions) {
    const column = dimension.source ?? dimension.id;
    normalized[column] = normalizeNumber(row[column], `row ${index + 1} ${column}`);
  }

  return normalized;
}

function normalizeNumber(value, label) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    throw new Error(`${label} must be numeric`);
  }

  return Number(number.toFixed(2));
}
