import test from "node:test";
import assert from "node:assert/strict";
import { loadSuite } from "../src/config.mjs";

test("default configs are valid", async () => {
  const suite = await loadSuite({
    benchmark: "configs/benchmark.yaml",
    models: "configs/models.yaml",
    runners: "configs/runners.yaml",
  });

  assert.equal(suite.benchmark.task.id, "funeralai-web4");
  assert.equal(suite.models.models.length, 6);
  assert.equal(suite.runners.runners.length, 3);
});
