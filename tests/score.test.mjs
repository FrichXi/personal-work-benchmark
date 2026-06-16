import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { normalizeScoreRows, scoreFile } from "../src/score.mjs";

const benchmark = {
  scoring: {
    dimensions: [
      { id: "loading", points: 20, source: "loading" },
      { id: "graph", points: 25, source: "graph" },
    ],
  },
};

test("score validation requires runner, evidence, and dimension columns", () => {
  assert.throws(() => normalizeScoreRows([
    { round: "r1", model: "A", score: "90", loading: "20" },
  ], benchmark), /runner, evidence, graph/);
});

test("score writes standardized scores.csv", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "pwb-score-"));
  const input = path.join(root, "manual.csv");
  const outDir = path.join(root, "results");
  await writeFile(input, [
    "round,model,runner,score,loading,graph,evidence",
    "r1,A,custom,90,20,22,artifact-specific evidence",
    "",
  ].join("\n"));

  const result = await scoreFile({ input, outDir, benchmark });
  const output = await readFile(path.join(outDir, "scores.csv"), "utf8");

  assert.equal(result.rows.length, 1);
  assert.match(output, /round,model,runner/);
  assert.match(output, /artifact-specific evidence/);
});
