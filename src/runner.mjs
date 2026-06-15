import { mkdir } from "node:fs/promises";
import { spawn } from "node:child_process";

export function buildRunPlan({ benchmark, models, runners, runnerName = null }) {
  const selectedRunners = runnerName
    ? runners.runners.filter((runner) => runner.name === runnerName)
    : runners.runners;

  if (!selectedRunners.length) {
    throw new Error(`No runner matched: ${runnerName}`);
  }

  const runs = [];

  for (const runner of selectedRunners) {
    for (const model of models.models) {
      for (let round = 1; round <= benchmark.task.rounds; round += 1) {
        const runDir = interpolate(benchmark.outputs.root, {
          task: benchmark.task.id,
          runner: runner.name,
          model: model.slug,
          round: `r${round}`,
        });

        const context = {
          task: benchmark.task,
          model,
          runner,
          round: { number: round, id: `r${round}` },
          run: { dir: runDir },
        };

        runs.push({
          runner: runner.name,
          runnerType: runner.type,
          model: model.name,
          round,
          dir: runDir,
          command: interpolate(runner.command, context),
          timeoutMinutes: runner.timeout_minutes ?? 90,
          retries: runner.retries ?? 0,
        });
      }
    }
  }

  return runs;
}

export async function executeRun(run, { dryRun = false } = {}) {
  if (dryRun) {
    return { ...run, status: "dry-run" };
  }

  await mkdir(run.dir, { recursive: true });

  for (let attempt = 0; attempt <= run.retries; attempt += 1) {
    const result = await shell(run.command, {
      cwd: run.dir,
      timeoutMs: run.timeoutMinutes * 60 * 1000,
    });

    if (result.code === 0) {
      return { ...run, status: "ok", attempt };
    }
  }

  return { ...run, status: "failed" };
}

export function interpolate(template, context) {
  return String(template).replace(/\{([a-zA-Z0-9_.]+)\}/g, (_, key) => {
    const value = key.split(".").reduce((current, part) => current?.[part], context);
    return value === undefined || value === null ? "" : String(value);
  });
}

function shell(command, { cwd, timeoutMs }) {
  return new Promise((resolve) => {
    const child = spawn(command, {
      cwd,
      shell: true,
      stdio: "inherit",
      timeout: timeoutMs,
    });

    child.on("close", (code, signal) => {
      resolve({ code, signal });
    });
  });
}
