import { cp, mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { buildRunPlan } from "./runner.mjs";

export async function prepareRuns({ benchmark, models, runners, benchmarkPath, runnerName = null }) {
  const runs = buildRunPlan({ benchmark, models, runners, benchmarkPath, runnerName });
  const benchmarkDir = benchmarkPath ? path.dirname(path.resolve(benchmarkPath)) : process.cwd();
  const promptSource = resolveInputPath(benchmark.inputs.prompt, benchmarkDir);
  const fixtureSource = benchmark.inputs.fixture
    ? resolveInputPath(benchmark.inputs.fixture, benchmarkDir)
    : null;

  for (const run of runs) {
    await mkdir(run.dir, { recursive: true });
    await cp(promptSource, path.join(run.dir, "TASK.md"));

    if (fixtureSource) {
      await rm(path.join(run.dir, "input"), { recursive: true, force: true });
      await cp(fixtureSource, path.join(run.dir, "input"), { recursive: true, force: true });
    }

    await writeFile(path.join(run.dir, "manifest.json"), `${JSON.stringify(manifestFor(run), null, 2)}\n`);
  }

  return runs;
}

function manifestFor(run) {
  return {
    task: run.taskId,
    model: run.model,
    modelSlug: run.modelSlug,
    runner: run.runner,
    round: run.round,
    command: run.command,
    inputs: {
      prompt: "TASK.md",
      fixture: "input",
    },
    outputs: {
      stdout: "stdout.log",
      stderr: "stderr.log",
      status: "status.json",
    },
  };
}

function resolveInputPath(value, benchmarkDir) {
  if (path.isAbsolute(value)) {
    return value;
  }

  return path.resolve(benchmarkDir, value);
}
