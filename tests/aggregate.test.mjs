import test from "node:test";
import assert from "node:assert/strict";
import { aggregateEntries, normalizeRow } from "../src/aggregate.mjs";

const benchmark = {
  scoring: {
    dimensions: [
      { id: "loading", points: 15, source: "loading" },
      { id: "graph", points: 35, source: "graph_old25", scale_from: 25 },
      { id: "articles", points: 15, source: "articles_old25", scale_from: 25 },
      { id: "visual", points: 20, source: "visual" },
      { id: "interaction", points: 15, source: "interaction" },
    ],
  },
};

test("normalizes graph-weighted rows", () => {
  const row = normalizeRow({
    round: "r1",
    model: "Qwen",
    loading: "15",
    graph_old25: "20",
    articles_old25: "25",
    visual: "18",
    interaction: "15",
  }, benchmark);

  assert.equal(row.score, 91);
  assert.equal(row.dimensions.graph, 28);
  assert.equal(row.dimensions.articles, 15);
});

test("aggregates by model and runner", () => {
  const rows = [
    { model: "A", runner: "opencode", score: 90, dimensions: { loading: 15 } },
    { model: "A", runner: "opencode", score: 80, dimensions: { loading: 13 } },
    { model: "B", runner: "opencode", score: 88, dimensions: { loading: 15 } },
  ];
  const leaderboard = aggregateEntries(rows);

  assert.equal(leaderboard[0].model, "B");
  assert.equal(leaderboard[1].avg, 85);
  assert.equal(leaderboard[1].dimensions.loading, 14);
});
