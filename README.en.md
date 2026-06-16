<p align="center">
  <img src="https://raw.githubusercontent.com/FrichXi/funeralai/main/assets/logo.png" alt="葬AI" width="400">
</p>

<p align="center">
  <a href="README.md">中文</a> | <strong>English</strong>
</p>

# Personal Work Benchmark

Turn your real work into a repeatable personal benchmark: same inputs, same
task prompt, same runner contract, repeated model runs, and evidence-backed
scoring.

This repository is a reusable template plus a small CLI. It is not a universal
model leaderboard. The real FuneralAI Web4 case study is browsable here:
[FuneralAI Web4 测试榜单](https://funeralai.cc/test/).

## 5-Minute Demo

The default config runs a tiny self-contained web task. It does not require API
keys or private data.

```bash
git clone https://github.com/FrichXi/personal-work-benchmark.git
cd personal-work-benchmark
npm install
npm run validate
npm run demo:prepare
npm run demo:run
npm run demo:score
npm run demo:aggregate
```

You will get:

```text
runs/tiny-web-task/
examples/tiny-web-task/results/scores.csv
examples/tiny-web-task/results/leaderboard.json
examples/tiny-web-task/results/leaderboard.md
```

## 30-Minute Own Benchmark

Create a new task from the template:

```bash
node scripts/pwb.mjs init my-benchmark
```

Then edit:

- `benchmarks/my-benchmark/benchmark.yaml` for task scope and scoring dimensions.
- `benchmarks/my-benchmark/task-prompt.md` for the actual work request.
- `benchmarks/my-benchmark/fixtures/` for stable local inputs.
- `benchmarks/my-benchmark/models.yaml` for models/providers.
- `benchmarks/my-benchmark/runners.yaml` for the command that executes each run.

Run the same loop with explicit config paths:

```bash
node scripts/pwb.mjs validate --benchmark benchmarks/my-benchmark/benchmark.yaml --models benchmarks/my-benchmark/models.yaml --runners benchmarks/my-benchmark/runners.yaml
node scripts/pwb.mjs prepare --benchmark benchmarks/my-benchmark/benchmark.yaml --models benchmarks/my-benchmark/models.yaml --runners benchmarks/my-benchmark/runners.yaml
node scripts/pwb.mjs run --benchmark benchmarks/my-benchmark/benchmark.yaml --models benchmarks/my-benchmark/models.yaml --runners benchmarks/my-benchmark/runners.yaml --runner custom-command
node scripts/pwb.mjs score --benchmark benchmarks/my-benchmark/benchmark.yaml --models benchmarks/my-benchmark/models.yaml --runners benchmarks/my-benchmark/runners.yaml --input benchmarks/my-benchmark/manual-scores.csv --out benchmarks/my-benchmark/results
node scripts/pwb.mjs aggregate --benchmark benchmarks/my-benchmark/benchmark.yaml --models benchmarks/my-benchmark/models.yaml --runners benchmarks/my-benchmark/runners.yaml --input benchmarks/my-benchmark/results/scores.csv --out benchmarks/my-benchmark/results
```

More detail:

- [Build your own benchmark](docs/build-your-own.md)
- [Runner contract](docs/runner-contract.md)
- [Scoring contract](docs/scoring-contract.md)

## CLI

```text
pwb init <task-id>
pwb validate
pwb prepare --runner custom-command
pwb run --runner custom-command [--dry-run] [--limit n]
pwb score --input manual-scores.csv --out results
pwb aggregate --input results/scores.csv --out results [--generated-at ISO_TIME]
```

`pwb prepare` creates one run directory per task / runner / model / round and
copies `TASK.md` plus `input/`. `pwb run` executes the runner inside each run
directory and writes `stdout.log`, `stderr.log`, and `status.json`.

`pwb score` validates a human or external-audit CSV. It does not assign scores
for you. Each score row must include `round`, `model`, `runner`, `score`,
dimension columns, and artifact-specific `evidence`.

## Core Principles

| Principle | Meaning |
|---|---|
| Real task | Start from work you actually need to do. |
| Repeated runs | Run each model multiple times to see average quality and low-tail risk. |
| Separated variables | Keep model, provider, and runner explicit. |
| Replaceable runner | `opencode`, Claude Code, or any shell command can be the execution wrapper. |
| Evidence first | Scores need screenshots, DOM, logs, tests, or human review notes. |
| No overclaiming | Report only what this task supports. |

## FuneralAI Web4 Case Study

`examples/funeralai-web4/` contains the first real large task snapshot: rebuilding
a complex personal website with a home page, graph page, article list, and
article detail pages.

Open the public results here:
[FuneralAI Web4 测试榜单](https://funeralai.cc/test/).

Methodology page:
[https://funeralai.cc/test/methodology/](https://funeralai.cc/test/methodology/)

The repository keeps only the reusable and auditable parts:

- task prompt
- scoring method
- CSV / JSON / Markdown result summaries
- representative screenshots

It does not include the full private work directory, all generated sites, API
keys, local provider settings, or large intermediate artifacts.

## Reproducible Aggregates

Use a fixed timestamp when regenerating committed leaderboards:

```bash
node scripts/pwb.mjs aggregate --generated-at 2026-01-01T00:00:00.000Z
SOURCE_DATE_EPOCH=1767225600 node scripts/pwb.mjs aggregate
```

## License

[MIT](LICENSE)
