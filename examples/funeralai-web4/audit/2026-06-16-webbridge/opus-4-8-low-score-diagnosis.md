# Opus 4.8 Low Score Diagnosis

Date: 2026-06-16

## Conclusion

The reported Opus 4.8 mean score of `84.1` is not reliable. It was pushed down by a graph-rendering detection bug in `webbridge-score.mjs`, not by the screenshots themselves.

The bug: the first graph detector sampled only the top-left patch of each `<canvas>`. Several Opus graph pages render the graph in the center or lower part of the canvas, so the detector saw a blank patch and classified the graph as `partial-or-blank`.

## Evidence

Screenshots show visible graph rendering for these Opus 4.8 rounds:

- `r1-claude-opus-4-8`: visible dense canvas graph, but raw score marked graph partial.
- `r2-claude-opus-4-8`: visible canvas graph lower on the page, but raw score marked graph partial.
- `r5-claude-opus-4-8`: visible but small clustered graph, not a blank page.
- `r6-claude-opus-4-8`: visible dense graph, but raw score marked graph partial.
- `r7-claude-opus-4-8`: visible graph, but raw score marked graph partial.
- `r9-claude-opus-4-8`: visible sparse graph, but raw score marked graph partial.
- `r10-claude-opus-4-8`: visible canvas graph, but raw score marked graph partial.

`r3-claude-opus-4-8` appears genuinely weak/blank in the screenshot, and `r8-claude-opus-4-8` already received graph credit but was penalized for article-list links.

## Approximate Corrected Opus Score

Using the same 100-point formula and only correcting the seven screenshot-visible graph false negatives by restoring the missing graph-render credit:

| Round | Original Total | Visual Correction | Approx Corrected |
|---|---:|---:|---:|
| r1 | 89.0 | +9.0 | 98.0 |
| r2 | 85.0 | +9.0 | 94.0 |
| r3 | 67.0 | +0.0 | 67.0 |
| r4 | 98.0 | +0.0 | 98.0 |
| r5 | 82.5 | +9.0 | 91.5 |
| r6 | 67.0 | +9.0 | 76.0 |
| r7 | 85.0 | +9.0 | 94.0 |
| r8 | 96.0 | +0.0 | 96.0 |
| r9 | 86.0 | +9.0 | 95.0 |
| r10 | 85.0 | +9.0 | 94.0 |

Approx corrected mean: `90.4`.

This is not yet a full corrected leaderboard, because the same screenshot-based graph correction should be applied to all 60 sites before publishing a replacement ranking.
