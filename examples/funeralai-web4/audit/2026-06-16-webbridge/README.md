# 2026-06-16 WebBridge Audit Package

This directory contains the submitted evidence package for the FuneralAI Web4 60-site recheck.

## What It Contains

- `method-lock.md`: scope, browser channel, concurrency, fixed pages, and scoring formula.
- `manifest.json`: frozen list of 60 generated sites.
- `webbridge-score.mjs`: redacted copy of the original browser audit script used locally.
- `generate-manifest.mjs`: redacted copy of the original manifest generator.
- `raw/*.json`: route, DOM, canvas/SVG, text-length, and screenshot-path evidence for every site.
- `screenshots/*.png`: home, graph, and articles screenshots for every site.
- `server-logs/*.log`: local static-server logs.
- `site-scores.csv`: per-site scores regenerated from submitted raw evidence.
- `final-results.json`: model summary, duplicate-score audit, and per-site score records.
- `graph-contact-sheet.jpg`: visual contact sheet for graph-page inspection.

## Recompute

From the repository root:

```bash
npm run funeralai:check
```

To regenerate the derived result files:

```bash
npm run funeralai:recompute
```

## Privacy Redaction

Local filesystem paths were replaced with placeholders such as `<BENCHMARK_WORKDIR>`, `<SOURCE_WORKDIR>`, and `<AUDIT_DIR>`. Screenshot paths inside raw JSON are relative to this audit directory.

## Scoring Channel

The scoring channel is Codex-authored Node code operating on evidence collected through Kimi WebBridge/CDP real-browser automation. Opus 4.8 is one of the contestants, not the judge for this submitted result set.
