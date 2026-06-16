import test from "node:test";
import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { prepareRuns } from "../src/prepare.mjs";

test("prepare creates run directories, input copies, and manifests", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "pwb-prepare-"));
  const fixture = path.join(root, "fixtures");
  await mkdir(fixture);
  await writeFile(path.join(root, "task-prompt.md"), "# Prompt\n");
  await writeFile(path.join(fixture, "data.json"), "{\"ok\":true}\n");

  const benchmarkPath = path.join(root, "benchmark.yaml");
  const runRoot = path.join(root, "runs/{task}/{runner}/{model}/{round}");
  const benchmark = {
    task: { id: "demo", rounds: 1 },
    inputs: { prompt: "task-prompt.md", fixture: "fixtures" },
    outputs: { root: runRoot },
  };

  const runs = await prepareRuns({
    benchmark,
    benchmarkPath,
    models: { models: [{ name: "Model A", slug: "model-a", version: "a", provider: "local" }] },
    runners: { runners: [{ name: "custom", type: "custom-command", command: "echo {run.prompt}" }] },
  });

  assert.equal(runs.length, 1);
  assert.equal(await readFile(path.join(runs[0].dir, "TASK.md"), "utf8"), "# Prompt\n");
  assert.equal(await readFile(path.join(runs[0].dir, "input", "data.json"), "utf8"), "{\"ok\":true}\n");

  const manifest = JSON.parse(await readFile(path.join(runs[0].dir, "manifest.json"), "utf8"));
  assert.equal(manifest.inputs.prompt, "TASK.md");
  assert.equal(manifest.modelSlug, "model-a");
});
