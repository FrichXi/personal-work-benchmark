# 60-Site Recheck Method Lock

Date: 2026-06-16

## Scope

This recheck includes exactly 60 generated websites: `r1-r10` times six model directories:

- `deepseek-v4-pro`
- `kimi-k2.7-code`
- `qwen3.7-max`
- `glm-x-preview`
- `minimax-m3`
- `claude-opus-4-8`

Excluded from the ranking: `r11/claude-opus-4`, `archive/`, older reports, and prior mixed-channel scores.

## Browser Channel

All browser work uses the same real-browser path through Kimi WebBridge at `http://127.0.0.1:10086/command`.

The health check at the start of this run showed:

- `running: true`
- `extension_connected: true`
- daemon version `v1.9.17`
- extension version `1.9.13`

The previous Playwright-first direction was abandoned before scoring. No score in this run uses Playwright.

## Concurrency Lock

Maximum allowed open browser pages: 6.

The default runner opens one site session at a time. Within a site, it navigates the same session through the fixed page list, then closes the session before moving to the next site. If a WebBridge implementation opens a fresh tab per navigation, the fixed page list still caps a site at six pages before `close_session`.

## Manifest Rules

The frozen manifest is `manifest.json`; it must contain exactly 60 entries and each model must appear exactly 10 times.

Entry selection:

1. Prefer `<source_dir>/index.html` and serve from `<source_dir>`.
2. If root `index.html` is missing but `<source_dir>/site/index.html` exists, serve from `<source_dir>/site`.
3. If neither exists, serve from `<source_dir>` and record `entry_rule: root-missing-index`.

Each site receives a unique local port in the `8500-8559` range. Servers are started and stopped per site; ports are used to make the evidence stable and traceable, not to keep all 60 sites open at once.

## Fixed Pages

Each site is checked with the same page list:

- `/`
- `/graph/`
- `/articles/`
- `/articles/050/`
- `/articles/080/`
- `/articles/103/`

For each page the runner records route status, title, body text length, link counts, article-link counts, visible error markers, and selected DOM graph signals. Screenshots are saved through the Kimi WebBridge screenshot action. With the current daemon, screenshot calls return a saved file path and do not return base64 into the agent context.

## Scoring Formula

Total: 100 points.

| Dimension | Points |
|---|---:|
| Loading and routes | 15 |
| Graph quality | 35 |
| Article completeness | 15 |
| Visual and information architecture | 20 |
| Interaction and stability | 15 |

The graph score requires visible rendering evidence. A `canvas` or `svg` element alone is not enough for full credit; the runner checks canvas pixel variance or SVG primitive counts. Article scores require clickable/list evidence and non-shell detail text, not just file presence.

Repeated totals are allowed only when the per-site evidence sentence is distinct and explains the observed similarity.

## Reporting

The final report must include:

- one row per site with dimension scores, total, and evidence sentence
- one summary row per model with mean, median, min, max, standard deviation, graph-success count, and common failure types
- a duplicate-score audit
- the caveat that model-average gaps under 2 points are not strong capability claims
