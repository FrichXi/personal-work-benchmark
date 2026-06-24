# 2026-06-23 graph-weighted append

This directory is the public evidence bundle for the current FuneralAI Web4 leaderboard:

```text
60 historical generated sites + 20 appended Doubao/Step sites = 80 scored sites
```

The appended runs use the same frozen Web4 data snapshot, task prompt, output shape, and Playwright graph-weighted scoring formula as the historical leaderboard:

```text
loading 15 + graph/25*35 + articles/25*15 + visual 20 + interaction 15
```

## Files

- `scores.csv` / `scores.json`: 80 scored generated sites.
- `report.md`: graph-weighted recheck report for the 80-site public leaderboard.
- `model-log-analysis.md`: public model-call, cost, cache, runtime, and Doubao/Step analysis.
- `cross-model-comparison.csv`: cross-model quality/cost/runtime comparison used by the public efficiency leaderboard.

## Public Boundary

The raw bills, provider-console screenshot, XLSX/PDF exports, full OpenCode local databases, and complete private generated-site work directories are not published here. This directory keeps the auditable public summaries and derived result tables only.

## Historical Context

The older 60-site WebBridge/CDP evidence pack remains available under `examples/funeralai-web4/audit/2026-06-16-webbridge/`. Treat that as the historical evidence bundle for the pre-append leaderboard, and this directory as the current public 80-site result bundle.
