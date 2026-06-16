# Runner Contract

A runner is a command template in `runners.yaml`. It is responsible for turning
one prepared run directory into one artifact to evaluate.

## Prepared Directory

`pwb prepare` creates one directory per task / runner / model / round:

```text
runs/{task}/{runner}/{model}/{round}/
  TASK.md
  input/
  manifest.json
```

The runner command is executed with that run directory as its current working
directory.

## Available Template Variables

- `{model.name}`, `{model.slug}`, `{model.version}`, `{model.provider}`
- `{runner.name}`, `{runner.type}`
- `{round.number}`, `{round.id}`
- `{task.id}`, `{task.title}`, `{task.prompt}`, `{task.fixture}`
- `{run.dir}`, `{run.prompt}`, `{run.input}`

For prepared runs, prefer `{run.prompt}` and `{run.input}` because they point to
files inside the current working directory.

## Required Behavior

- Write all generated output into the current run directory.
- Do not mutate other run directories.
- Exit with `0` only when the artifact is ready to score.
- Leave enough local files for a reviewer or audit tool to inspect.

`pwb run` records:

```text
stdout.log
stderr.log
status.json
```
