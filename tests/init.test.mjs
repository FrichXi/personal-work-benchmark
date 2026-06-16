import test from "node:test";
import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { initBenchmark } from "../src/init.mjs";

test("init copies template and replaces task id", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "pwb-init-"));
  const template = path.join(root, "template");
  const outRoot = path.join(root, "benchmarks");
  await mkdir(template);
  await writeFile(path.join(template, "benchmark.yaml"), "task:\n  id: basic-web-task\n");

  const result = await initBenchmark({
    taskId: "my-task",
    templateDir: template,
    outRoot,
  });

  assert.equal(result.destination, path.join(outRoot, "my-task"));
  assert.equal(await readFile(path.join(result.destination, "benchmark.yaml"), "utf8"), "task:\n  id: my-task\n");
});
