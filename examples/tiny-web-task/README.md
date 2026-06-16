# Tiny Web Task Demo

This is the self-contained demo for `personal-work-benchmark`.

It asks a runner to build a tiny static site from local JSON fixtures:

- `fixtures/articles.json`
- `fixtures/graph.json`
- `task-prompt.md`

The demo is intentionally small. It proves the benchmark loop without requiring
API keys, private data, or a real model provider.

## Quick Loop

```bash
npm run validate
npm run demo:prepare
npm run demo:run
npm run demo:score
npm run demo:aggregate
```

Outputs are written under:

```text
runs/tiny-web-task/
examples/tiny-web-task/results/
```
