#!/usr/bin/env node
import path from "node:path";
import { fileURLToPath } from "node:url";
import { aggregateFile } from "../src/aggregate.mjs";
import { loadSuite } from "../src/config.mjs";
import { initBenchmark } from "../src/init.mjs";
import { prepareRuns } from "../src/prepare.mjs";
import { buildRunPlan, executeRun } from "../src/runner.mjs";
import { scoreFile } from "../src/score.mjs";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const DEFAULTS = {
  benchmark: "configs/benchmark.yaml",
  models: "configs/models.yaml",
  runners: "configs/runners.yaml",
  scores: "examples/tiny-web-task/results/scores.csv",
};

async function main() {
  const [command = "help", ...rest] = process.argv.slice(2);
  const args = parseArgs(rest);
  const positional = rest.filter((token) => !token.startsWith("--"));
  const paths = {
    benchmark: args.benchmark || DEFAULTS.benchmark,
    models: args.models || DEFAULTS.models,
    runners: args.runners || DEFAULTS.runners,
  };

  if (command === "help" || args.help) {
    printHelp();
    return;
  }

  if (command === "init") {
    const taskId = positional[0];
    const result = await initBenchmark({
      taskId,
      templateDir: path.join(REPO_ROOT, "templates/basic-web-task"),
    });
    console.log(`created ${result.destination}`);
    return;
  }

  const suite = await loadSuite(paths);

  if (command === "validate") {
    console.log(`ok: ${paths.benchmark}`);
    console.log(`ok: ${paths.models}`);
    console.log(`ok: ${paths.runners}`);
    return;
  }

  if (command === "prepare") {
    const runs = await prepareRuns({
      ...suite,
      benchmarkPath: paths.benchmark,
      runnerName: args.runner || null,
    });
    console.log(`prepared ${runs.length} runs`);
    return;
  }

  if (command === "aggregate") {
    const input = args.input || DEFAULTS.scores;
    const outDir = args.out || path.dirname(input);
    const result = await aggregateFile({
      input,
      outDir,
      benchmark: suite.benchmark,
      generatedAt: args["generated-at"] || null,
    });
    console.log(`wrote ${path.join(outDir, "leaderboard.json")}`);
    console.log(`models: ${result.leaderboard.length}`);
    return;
  }

  if (command === "score") {
    if (!args.input) {
      throw new Error("score requires --input");
    }

    const outDir = args.out || path.dirname(args.input);
    const result = await scoreFile({ input: args.input, outDir, benchmark: suite.benchmark });
    console.log(`wrote ${path.join(outDir, "scores.csv")}`);
    console.log(`rows: ${result.rows.length}`);
    return;
  }

  if (command === "run") {
    const runs = buildRunPlan({
      ...suite,
      benchmarkPath: paths.benchmark,
      runnerName: args.runner || null,
    });
    const limit = Number(args.limit || runs.length);

    for (const run of runs.slice(0, limit)) {
      console.log(`[${run.runner}] ${run.model} r${run.round}: ${run.command}`);
      await executeRun(run, { dryRun: Boolean(args["dry-run"]) });
    }

    return;
  }

  throw new Error(`Unknown command: ${command}`);
}

function parseArgs(tokens) {
  const args = {};

  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];

    if (!token.startsWith("--")) {
      continue;
    }

    const key = token.slice(2);
    const next = tokens[index + 1];

    if (!next || next.startsWith("--")) {
      args[key] = true;
      continue;
    }

    args[key] = next;
    index += 1;
  }

  return args;
}

function printHelp() {
  console.log(`personal-work-benchmark

Usage:
  pwb init my-benchmark
  pwb validate
  pwb prepare --runner custom-command
  pwb run --runner custom-command --dry-run --limit 3
  pwb score --input manual-scores.csv --out results
  pwb aggregate --input results/scores.csv --out results

Config:
  --benchmark configs/benchmark.yaml
  --models configs/models.yaml
  --runners configs/runners.yaml

Reproducible aggregate:
  pwb aggregate --generated-at 2026-01-01T00:00:00.000Z
  SOURCE_DATE_EPOCH=1767225600 pwb aggregate
`);
}

main().catch((error) => {
  console.error(error.stack || error.message || error);
  process.exit(1);
});
