# Scoring Contract

`pwb score` does not judge artifacts for you. It validates and standardizes a
CSV created by an explicitly named source: a human reviewer, a browser audit
script, or another external audit tool. The source should be documented next to
the result files so readers can tell whether a score came from manual review,
deterministic checks, model-assisted review, or a mixed process.

## Required Columns

Every scoring CSV must include:

```text
round,model,runner,score,evidence
```

It must also include one column for each scoring dimension source in
`benchmark.yaml`.

For the default tiny demo, the required dimension columns are:

```text
loading,graph,articles,visual,interaction
```

## Evidence Rule

Each row needs an artifact-specific evidence sentence. Do not use model-level
template language. If two rows have the same score, the evidence should explain
why the artifacts are actually similar.

For browser-based audits, prefer evidence that names route status, DOM/text
metrics, visible render signals, screenshots, logs, or test outputs. Avoid
phrases like "looks good" unless they are backed by a visible artifact.

Good evidence:

```text
all required routes generated; graph page lists demo-founder to demo-product; article 001 detail includes full source text.
```

Weak evidence:

```text
good output
```

## Output

`pwb score --input manual-scores.csv --out results` writes:

```text
results/scores.csv
```

Then run:

```bash
node scripts/pwb.mjs aggregate --input results/scores.csv --out results
```
