import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { buildRunPlan, executeRun, interpolate } from "../src/runner.mjs";

test("interpolates nested context", () => {
  assert.equal(
    interpolate("{model.name} -> {run.dir}", {
      model: { name: "Qwen" },
      run: { dir: "runs/task/qwen/r1" },
    }),
    "Qwen -> runs/task/qwen/r1"
  );
});

test("builds runner/model/round matrix", () => {
  const runs = buildRunPlan({
    benchmark: {
      task: { id: "demo", rounds: 2 },
      inputs: { prompt: "prompt.md", fixture: "fixtures" },
      outputs: { root: "runs/{task}/{runner}/{model}/{round}" },
    },
    models: { models: [{ name: "Qwen", slug: "qwen", version: "qwen-max" }] },
    runners: {
      runners: [{ name: "custom", type: "custom-command", command: "echo {model.name} {round.id}" }],
    },
  });

  assert.equal(runs.length, 2);
  assert.equal(runs[0].dir, "runs/demo/custom/qwen/r1");
  assert.equal(runs[1].command, "echo Qwen r2");
  assert.equal(runs[0].taskId, "demo");
  assert.equal(runs[0].modelSlug, "qwen");
});

test("run dry-run returns without writing logs", async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), "pwb-dry-run-"));
  const result = await executeRun({
    dir,
    command: "node -e \"console.log('hello')\"",
    retries: 0,
    timeoutMinutes: 1,
  }, { dryRun: true });

  assert.equal(result.status, "dry-run");
});

test("run writes stdout, stderr, and status", async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), "pwb-run-"));
  const result = await executeRun({
    dir,
    command: "node -e \"console.log('hello'); console.error('warn')\"",
    retries: 0,
    timeoutMinutes: 1,
  });

  assert.equal(result.status, "ok");
  assert.match(await readFile(path.join(dir, "stdout.log"), "utf8"), /hello/);
  assert.match(await readFile(path.join(dir, "stderr.log"), "utf8"), /warn/);
  assert.equal(JSON.parse(await readFile(path.join(dir, "status.json"), "utf8")).status, "ok");
});
