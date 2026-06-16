import { mkdir, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import path from "node:path";

export function buildRunPlan({ benchmark, models, runners, runnerName = null, benchmarkPath = null }) {
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
          task: {
            ...benchmark.task,
            prompt: resolveInputPath(benchmark.inputs?.prompt, benchmarkPath),
            fixture: resolveInputPath(benchmark.inputs?.fixture, benchmarkPath),
          },
          model,
          runner,
          round: { number: round, id: `r${round}` },
          run: {
            dir: runDir,
            prompt: "TASK.md",
            input: "input",
          },
        };

        runs.push({
          taskId: benchmark.task.id,
          runner: runner.name,
          runnerType: runner.type,
          model: model.name,
          modelSlug: model.slug,
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
  const stdout = [];
  const stderr = [];
  const attempts = [];

  for (let attempt = 0; attempt <= run.retries; attempt += 1) {
    const result = await shell(run.command, {
      cwd: run.dir,
      timeoutMs: run.timeoutMinutes * 60 * 1000,
      stdout,
      stderr,
    });
    attempts.push({ attempt, ...result });

    if (result.code === 0) {
      const status = { ...run, status: "ok", attempt, attempts, finishedAt: new Date().toISOString() };
      await writeRunLogs(run.dir, stdout, stderr, status);
      return status;
    }
  }

  const status = { ...run, status: "failed", attempts, finishedAt: new Date().toISOString() };
  await writeRunLogs(run.dir, stdout, stderr, status);
  return status;
}

export function interpolate(template, context) {
  return String(template).replace(/\{([a-zA-Z0-9_.]+)\}/g, (_, key) => {
    const value = key.split(".").reduce((current, part) => current?.[part], context);
    return value === undefined || value === null ? "" : String(value);
  });
}

function resolveInputPath(value, benchmarkPath) {
  if (!value) return "";
  if (path.isAbsolute(value)) return value;
  if (!benchmarkPath) return value;
  return path.resolve(path.dirname(path.resolve(benchmarkPath)), value);
}

async function writeRunLogs(dir, stdout, stderr, status) {
  await writeFile(path.join(dir, "stdout.log"), stdout.join(""));
  await writeFile(path.join(dir, "stderr.log"), stderr.join(""));
  await writeFile(path.join(dir, "status.json"), `${JSON.stringify(status, null, 2)}\n`);
}

function shell(command, { cwd, timeoutMs, stdout, stderr }) {
  return new Promise((resolve) => {
    const child = spawn(command, {
      cwd,
      shell: true,
      stdio: ["ignore", "pipe", "pipe"],
      timeout: timeoutMs,
    });

    child.stdout.on("data", (chunk) => {
      process.stdout.write(chunk);
      stdout.push(String(chunk));
    });

    child.stderr.on("data", (chunk) => {
      process.stderr.write(chunk);
      stderr.push(String(chunk));
    });

    child.on("close", (code, signal) => {
      resolve({ code, signal });
    });
  });
}
