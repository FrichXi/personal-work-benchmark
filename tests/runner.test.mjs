import test from "node:test";
import assert from "node:assert/strict";
import { buildRunPlan, interpolate } from "../src/runner.mjs";

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
});
