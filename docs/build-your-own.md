# Build Your Own Benchmark

Use `personal-work-benchmark` when you want to compare models on work that is
actually yours: the same input, the same prompt, the same runner contract, and
the same scoring rubric across repeated runs.

## 1. Create a Task

```bash
node scripts/pwb.mjs init my-benchmark
```

This creates:

```text
benchmarks/my-benchmark/
  benchmark.yaml
  models.yaml
  runners.yaml
  task-prompt.md
  fixtures/
  manual-scores.csv
```

## 2. Edit the Task

- Put stable input data in `fixtures/`.
- Write the exact task request in `task-prompt.md`.
- Define required outputs and scoring dimensions in `benchmark.yaml`.
- Define model/provider entries in `models.yaml`.
- Define one or more execution wrappers in `runners.yaml`.

## 3. Run the Loop

```bash
node scripts/pwb.mjs validate --benchmark benchmarks/my-benchmark/benchmark.yaml --models benchmarks/my-benchmark/models.yaml --runners benchmarks/my-benchmark/runners.yaml
node scripts/pwb.mjs prepare --benchmark benchmarks/my-benchmark/benchmark.yaml --models benchmarks/my-benchmark/models.yaml --runners benchmarks/my-benchmark/runners.yaml
node scripts/pwb.mjs run --benchmark benchmarks/my-benchmark/benchmark.yaml --models benchmarks/my-benchmark/models.yaml --runners benchmarks/my-benchmark/runners.yaml --runner custom-command
node scripts/pwb.mjs score --benchmark benchmarks/my-benchmark/benchmark.yaml --models benchmarks/my-benchmark/models.yaml --runners benchmarks/my-benchmark/runners.yaml --input benchmarks/my-benchmark/manual-scores.csv --out benchmarks/my-benchmark/results
node scripts/pwb.mjs aggregate --benchmark benchmarks/my-benchmark/benchmark.yaml --models benchmarks/my-benchmark/models.yaml --runners benchmarks/my-benchmark/runners.yaml --input benchmarks/my-benchmark/results/scores.csv --out benchmarks/my-benchmark/results
```

## 4. Interpret Narrowly

Only claim what the task supports. A personal benchmark can say which model was
more useful for this task under this runner and scoring method. It should not be
presented as a universal model ranking.
