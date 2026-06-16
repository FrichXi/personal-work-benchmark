# basic-web-task

This benchmark template is copied by:

```bash
node scripts/pwb.mjs init my-task
```

After copying, edit:

- `benchmark.yaml` for task scope, required outputs, and scoring dimensions.
- `models.yaml` for the models or providers you want to compare.
- `runners.yaml` for the command that runs each model.
- `task-prompt.md` for the actual work request.
- `manual-scores.csv` after you review each generated artifact.

Suggested loop:

```bash
node scripts/pwb.mjs validate --benchmark benchmarks/basic-web-task/benchmark.yaml --models benchmarks/basic-web-task/models.yaml --runners benchmarks/basic-web-task/runners.yaml
node scripts/pwb.mjs prepare --benchmark benchmarks/basic-web-task/benchmark.yaml --models benchmarks/basic-web-task/models.yaml --runners benchmarks/basic-web-task/runners.yaml
node scripts/pwb.mjs run --benchmark benchmarks/basic-web-task/benchmark.yaml --models benchmarks/basic-web-task/models.yaml --runners benchmarks/basic-web-task/runners.yaml --runner custom-command
node scripts/pwb.mjs score --benchmark benchmarks/basic-web-task/benchmark.yaml --models benchmarks/basic-web-task/models.yaml --runners benchmarks/basic-web-task/runners.yaml --input benchmarks/basic-web-task/manual-scores.csv --out benchmarks/basic-web-task/results
node scripts/pwb.mjs aggregate --benchmark benchmarks/basic-web-task/benchmark.yaml --models benchmarks/basic-web-task/models.yaml --runners benchmarks/basic-web-task/runners.yaml --input benchmarks/basic-web-task/results/scores.csv --out benchmarks/basic-web-task/results
```
