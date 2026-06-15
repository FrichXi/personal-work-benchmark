#!/usr/bin/env node
import path from "node:path";
import { aggregateFile } from "../src/aggregate.mjs";
import { loadSuite } from "../src/config.mjs";
import { buildRunPlan, executeRun } from "../src/runner.mjs";

const DEFAULTS = {
  benchmark: "configs/benchmark.yaml",
  models: "configs/models.yaml",
  runners: "configs/runners.yaml",
};

async function main() {
  const [command = "help", ...rest] = process.argv.slice(2);
  const args = parseArgs(rest);
  const paths = {
    benchmark: args.benchmark || DEFAULTS.benchmark,
    models: args.models || DEFAULTS.models,
    runners: args.runners || DEFAULTS.runners,
  };

  if (command === "help" || args.help) {
    printHelp();
    return;
  }

  const suite = await loadSuite(paths);

  if (command === "validate") {
    console.log(`ok: ${paths.benchmark}`);
    console.log(`ok: ${paths.models}`);
    console.log(`ok: ${paths.runners}`);
    return;
  }

  if (command === "aggregate") {
    const input = args.input || "examples/funeralai-web4/results/scores.csv";
    const outDir = args.out || path.dirname(input);
    const result = await aggregateFile({ input, outDir, benchmark: suite.benchmark });
    console.log(`wrote ${path.join(outDir, "leaderboard.json")}`);
    console.log(`models: ${result.leaderboard.length}`);
    return;
  }

  if (command === "run") {
    const runs = buildRunPlan({
      ...suite,
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
  pwb validate
  pwb aggregate --input results/scores.csv --out results
  pwb run --runner custom-command --dry-run --limit 3

Config:
  --benchmark configs/benchmark.yaml
  --models configs/models.yaml
  --runners configs/runners.yaml
`);
}

main().catch((error) => {
  console.error(error.stack || error.message || error);
  process.exit(1);
});
