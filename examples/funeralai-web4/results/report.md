# Graph-Weighted Recheck With Opus 4.8

Weights: loading 15, graph/25*35, articles/25*15, visual 20, interaction 15. Opus 4.8 rows were collected through Playwright direct browser loads on ports 8351-8360 after CDP localhost access was confirmed invalid.

## Model Averages

| Rank | Model | Sites | Avg | Min-Max | Loading | Graph/25 | Articles/25 | Visual | Interaction |
|---:|---|---:|---:|---|---:|---:|---:|---:|---:|
| 1 | GLM | 10 | 85.5 | 72.8-93.8 | 15.0 | 15.9 | 25.0 | 18.4 | 14.8 |
| 2 | Opus 4.8 | 10 | 85.2 | 57.8-98 | 15.0 | 18.6 | 24.6 | 16.0 | 13.4 |
| 3 | Qwen | 10 | 82.4 | 66.2-93.8 | 14.4 | 19.8 | 24.1 | 13.4 | 12.4 |
| 4 | Kimi | 10 | 80.3 | 51.6-93.8 | 14.6 | 15.9 | 24.1 | 15.4 | 13.6 |
| 5 | MiniMax | 10 | 77.4 | 52.6-95.8 | 14.4 | 11.9 | 23.3 | 18.8 | 13.6 |
| 6 | DeepSeek | 10 | 67.1 | 39.2-96 | 14.6 | 11.7 | 24.1 | 9.8 | 11.9 |

## Site Scores

| Rank | Site | Port | Total | Grade | Old Total | Load | Graph/25 | Article/25 | Visual | Interact | Evidence |
|---:|---|---:|---:|---|---:|---:|---:|---:|---:|---:|---|
| 1 | r1 Opus 4.8 | 8351 | 98 | A | 98 | 15 | 25 | 25 | 18 | 15 | core routes load; graph rendered (1 canvas, 0 rich svg); article list and sampled full text pass; visual signals: cssVars=20, purple=no, mobileOverflow=no. |
| 2 | r5 DeepSeek | 8316 | 96 | A | 96 | 15 | 25 | 25 | 16 | 15 | core routes load; graph rendered (0 canvas, 1 rich svg); article list and sampled full text pass; visual signals: cssVars=17, purple=no, mobileOverflow=no. |
| 3 | r4 MiniMax | 8344 | 95.8 | A | 97 | 15 | 22 | 25 | 20 | 15 | core routes load; graph rendered (0 canvas, 1 rich svg); article list and sampled full text pass; visual signals: cssVars=26, purple=yes, overflow=no. |
| 4 | r9 Opus 4.8 | 8359 | 94.6 | A | 95 | 15 | 24 | 25 | 18 | 13 | core routes load; graph rendered (1 canvas, 0 rich svg); article list and sampled full text pass; visual signals: cssVars=12, purple=yes, mobileOverflow=no. |
| 5 | r2 Kimi | 8305 | 93.8 | A | 95 | 15 | 22 | 25 | 18 | 15 | core routes load; graph rendered (0 canvas, 1 rich svg); article list and sampled full text pass; visual signals: cssVars=16, purple=yes, mobileOverflow=no. |
| 6 | r4 Qwen | 8314 | 93.8 | A | 95 | 15 | 22 | 25 | 18 | 15 | core routes load; graph rendered (0 canvas, 1 rich svg); article list and sampled full text pass; visual signals: cssVars=21, purple=yes, mobileOverflow=no. |
| 7 | r5 Qwen | 8318 | 93.8 | A | 95 | 15 | 22 | 25 | 18 | 15 | core routes load; graph rendered (0 canvas, 1 rich svg); article list and sampled full text pass; visual signals: cssVars=16, purple=yes, mobileOverflow=no. |
| 8 | r7 Kimi | 8325 | 93.8 | A | 95 | 15 | 22 | 25 | 18 | 15 | core routes load; graph rendered (0 canvas, 1 rich svg); article list and sampled full text pass; visual signals: cssVars=15, purple=yes, mobileOverflow=no. |
| 9 | r7 Qwen | 8326 | 93.8 | A | 95 | 15 | 22 | 25 | 18 | 15 | core routes load; graph rendered (0 canvas, 1 rich svg); article list and sampled full text pass; visual signals: cssVars=21, purple=yes, mobileOverflow=no. |
| 10 | r9 Qwen | 8334 | 93.8 | A | 95 | 15 | 22 | 25 | 18 | 15 | core routes load; graph rendered (0 canvas, 1 rich svg); article list and sampled full text pass; visual signals: cssVars=13, purple=no, mobileOverflow=no. |
| 11 | r10 GLM | 8339 | 93.8 | A | 95 | 15 | 22 | 25 | 18 | 15 | core routes load; graph rendered (1 canvas, 0 rich svg); article list and sampled full text pass; visual signals: cssVars=20, purple=no, mobileOverflow=no. |
| 12 | r2 MiniMax | 8342 | 93.8 | A | 95 | 15 | 22 | 25 | 18 | 15 | core routes load; graph rendered (1 canvas, 0 rich svg); article list and sampled full text pass; visual signals: cssVars=20, purple=no, overflow=no. |
| 13 | r4 Opus 4.8 | 8354 | 93.8 | A | 95 | 15 | 22 | 25 | 18 | 15 | core routes load; graph rendered (0 canvas, 1 rich svg); article list and sampled full text pass; visual signals: cssVars=17, purple=no, mobileOverflow=no. |
| 14 | r4 GLM | 8315 | 93 | A | 95 | 15 | 20 | 25 | 20 | 15 | core routes load; graph rendered (1 canvas, 0 rich svg); article list and sampled full text pass; visual signals: cssVars=19, purple=yes, mobileOverflow=no. |
| 15 | r6 GLM | 8323 | 93 | A | 95 | 15 | 20 | 25 | 20 | 15 | core routes load; graph rendered (1 canvas, 0 rich svg); article list and sampled full text pass; visual signals: cssVars=24, purple=yes, mobileOverflow=no. |
| 16 | r5 GLM | 8319 | 91 | A- | 93 | 15 | 20 | 25 | 18 | 15 | core routes load; graph rendered (1 canvas, 0 rich svg); article list and sampled full text pass; visual signals: cssVars=21, purple=yes, mobileOverflow=no. |
| 17 | r9 GLM | 8335 | 91 | A- | 93 | 15 | 20 | 25 | 18 | 15 | core routes load; graph rendered (1 canvas, 0 rich svg); article list and sampled full text pass; visual signals: cssVars=22, purple=yes, mobileOverflow=no. |
| 18 | r2 Opus 4.8 | 8352 | 91 | A- | 93 | 15 | 20 | 25 | 18 | 15 | core routes load; graph rendered (1 canvas, 0 rich svg); article list and sampled full text pass; visual signals: cssVars=21, purple=no, mobileOverflow=no. |
| 19 | r7 Opus 4.8 | 8357 | 91 | A- | 93 | 15 | 20 | 25 | 18 | 15 | core routes load; graph rendered (1 canvas, 0 rich svg); article list and sampled full text pass; visual signals: cssVars=15, purple=no, mobileOverflow=no. |
| 20 | r10 Opus 4.8 | 8360 | 91 | A- | 93 | 15 | 20 | 25 | 18 | 15 | core routes load; graph rendered (1 canvas, 0 rich svg); article list and sampled full text pass; visual signals: cssVars=18, purple=no, mobileOverflow=no. |
| 21 | r8 Opus 4.8 | 8358 | 89.4 | A- | 89 | 15 | 22 | 21 | 18 | 13 | core routes load; graph rendered (0 canvas, 1 rich svg); article weakness: 1 links, detail text 2181/2181; visual signals: cssVars=20, purple=no, mobileOverflow=no. |
| 22 | r3 GLM | 8311 | 89 | A- | 91 | 15 | 20 | 25 | 16 | 15 | core routes load; graph rendered (1 canvas, 0 rich svg); article list and sampled full text pass; visual signals: cssVars=21, purple=no, mobileOverflow=no. |
| 23 | r8 Kimi | 8329 | 89 | A- | 91 | 15 | 20 | 25 | 16 | 15 | core routes load; graph rendered (0 canvas, 1 rich svg); article list and sampled full text pass; visual signals: cssVars=17, purple=no, mobileOverflow=no. |
| 24 | r9 Kimi | 8333 | 89 | A- | 91 | 15 | 20 | 25 | 16 | 15 | core routes load; graph rendered (1 canvas, 0 rich svg); article list and sampled full text pass; visual signals: cssVars=15, purple=no, mobileOverflow=no. |
| 25 | r1 Kimi | 8301 | 86.8 | B+ | 90 | 15 | 17 | 25 | 18 | 15 | core routes load; graph rendered (0 canvas, 1 rich svg); article list and sampled full text pass; visual signals: cssVars=19, purple=no, mobileOverflow=no. |
| 26 | r2 DeepSeek | 8304 | 86.4 | B+ | 88 | 15 | 21 | 25 | 18 | 9 | core routes load; graph rendered (1 canvas, 0 rich svg); article list and sampled full text pass; visual signals: cssVars=14, purple=no, mobileOverflow=no. |
| 27 | r2 Qwen | 8306 | 82.4 | B+ | 80 | 11 | 22 | 16 | 18 | 13 | core routes load; graph rendered (0 canvas, 1 rich svg); article weakness: 104 links, detail text 139/154; visual signals: cssVars=14, purple=yes, mobileOverflow=no. |
| 28 | r10 Kimi | 8337 | 82.4 | B+ | 80 | 11 | 22 | 16 | 18 | 13 | core routes load; graph rendered (0 canvas, 1 rich svg); article weakness: 104 links, detail text 120/134; visual signals: cssVars=17, purple=no, mobileOverflow=no. |
| 29 | r3 Kimi | 8309 | 82.2 | B+ | 85 | 15 | 18 | 25 | 18 | 9 | core routes load; graph rendered (0 canvas, 1 rich svg); article list and sampled full text pass; visual signals: cssVars=18, purple=no, mobileOverflow=no. |
| 30 | r6 Qwen | 8322 | 80 | B | 82 | 15 | 20 | 25 | 7 | 15 | core routes load; graph rendered (0 canvas, 1 rich svg); article list and sampled full text pass; visual signals: cssVars=0, purple=no, mobileOverflow=no. |
| 31 | r1 MiniMax | 8341 | 79 | B | 85 | 15 | 10 | 25 | 20 | 15 | core routes load; graph shell only (0 canvas, 0 rich svg); article list and sampled full text pass; visual signals: cssVars=21, purple=yes, overflow=no. |
| 32 | r5 MiniMax | 8345 | 79 | B | 85 | 15 | 10 | 25 | 20 | 15 | core routes load; graph shell only (0 canvas, 0 rich svg); article list and sampled full text pass; visual signals: cssVars=22, purple=yes, overflow=no. |
| 33 | r7 MiniMax | 8347 | 79 | B | 85 | 15 | 10 | 25 | 20 | 15 | core routes load; graph shell only (0 canvas, 0 rich svg); article list and sampled full text pass; visual signals: cssVars=37, purple=yes, overflow=no. |
| 34 | r1 GLM | 8303 | 77 | B | 83 | 15 | 10 | 25 | 18 | 15 | core routes load; graph shell only (0 canvas, 0 rich svg); article list and sampled full text pass; visual signals: cssVars=24, purple=yes, mobileOverflow=no. |
| 35 | r2 GLM | 8307 | 77 | B | 83 | 15 | 10 | 25 | 18 | 15 | core routes load; graph shell only (0 canvas, 0 rich svg); article list and sampled full text pass; visual signals: cssVars=23, purple=no, mobileOverflow=no. |
| 36 | r8 GLM | 8331 | 77 | B | 83 | 15 | 10 | 25 | 18 | 15 | core routes load; graph shell only (0 canvas, 0 rich svg); article list and sampled full text pass; visual signals: cssVars=20, purple=yes, mobileOverflow=no. |
| 37 | r6 MiniMax | 8346 | 77 | B | 83 | 15 | 10 | 25 | 18 | 15 | core routes load; graph shell only (0 canvas, 0 rich svg); article list and sampled full text pass; visual signals: cssVars=19, purple=no, overflow=no. |
| 38 | r8 MiniMax | 8348 | 77 | B | 83 | 15 | 10 | 25 | 20 | 13 | core routes load; graph shell only (0 canvas, 0 rich svg); article list and sampled full text pass; visual signals: cssVars=28, purple=yes, overflow=no. |
| 39 | r3 Qwen | 8310 | 76.2 | B | 79 | 13 | 18 | 25 | 14 | 9 | core routes load; graph rendered (0 canvas, 1 rich svg); article list and sampled full text pass; visual signals: cssVars=9, purple=yes, mobileOverflow=no. |
| 40 | r10 Qwen | 8338 | 75.4 | B | 77 | 15 | 21 | 25 | 7 | 9 | core routes load; graph rendered (0 canvas, 1 rich svg); article list and sampled full text pass; visual signals: cssVars=0, purple=no, mobileOverflow=no. |
| 41 | r5 Opus 4.8 | 8355 | 75 | B | 81 | 15 | 10 | 25 | 16 | 15 | core routes load; graph shell only (0 canvas, 0 rich svg); article list and sampled full text pass; visual signals: cssVars=12, purple=no, mobileOverflow=no. |
| 42 | r6 DeepSeek | 8320 | 74.4 | C+ | 78 | 15 | 16 | 25 | 9 | 13 | core routes load; graph rendered (0 canvas, 1 rich svg); article list and sampled full text pass; visual signals: cssVars=0, purple=no, mobileOverflow=no. |
| 43 | r10 MiniMax | 8350 | 73 | C+ | 79 | 15 | 10 | 25 | 16 | 13 | core routes load; graph shell only (0 canvas, 0 rich svg); article list and sampled full text pass; visual signals: cssVars=22, purple=no, overflow=no. |
| 44 | r7 GLM | 8327 | 72.8 | C+ | 80 | 15 | 7 | 25 | 20 | 13 | core routes load; graph shell only (0 canvas, 0 rich svg); article list and sampled full text pass; visual signals: cssVars=19, purple=yes, mobileOverflow=no. |
| 45 | r6 Opus 4.8 | 8356 | 70.4 | C+ | 74 | 15 | 16 | 25 | 9 | 9 | core routes load; graph rendered (1 canvas, 0 rich svg); article list and sampled full text pass; visual signals: cssVars=0, purple=no, mobileOverflow=no. |
| 46 | r5 Kimi | 8317 | 68.6 | C+ | 77 | 15 | 4 | 25 | 18 | 15 | core routes load; no graph render (0 canvas, 0 rich svg); article list and sampled full text pass; visual signals: cssVars=12, purple=yes, mobileOverflow=no. |
| 47 | r8 Qwen | 8330 | 68.4 | C+ | 72 | 15 | 16 | 25 | 7 | 9 | core routes load; graph rendered (0 canvas, 1 rich svg); article list and sampled full text pass; visual signals: cssVars=0, purple=no, mobileOverflow=no. |
| 48 | r9 MiniMax | 8349 | 68.2 | C+ | 75 | 15 | 8 | 25 | 18 | 9 | core routes load; graph shell only (0 canvas, 0 rich svg); article list and sampled full text pass; visual signals: cssVars=34, purple=yes, overflow=no. |
| 49 | r1 Qwen | 8302 | 66.2 | C | 71 | 15 | 13 | 25 | 9 | 9 | core routes load; graph rendered (0 canvas, 1 rich svg); article list and sampled full text pass; visual signals: cssVars=0, purple=no, mobileOverflow=no. |
| 50 | r6 Kimi | 8321 | 66 | C | 79 | 15 | 10 | 25 | 7 | 15 | core routes load; graph rendered (0 canvas, 1 rich svg); article list and sampled full text pass; visual signals: cssVars=0, purple=no, mobileOverflow=no. visible-graph audit: online graph did not visibly render; Graph capped at shell score. |
| 51 | r4 DeepSeek | 8312 | 64.6 | C | 71 | 15 | 9 | 25 | 7 | 15 | core routes load; graph shell only (0 canvas, 0 rich svg); article list and sampled full text pass; visual signals: cssVars=0, purple=no, mobileOverflow=no. |
| 52 | r7 DeepSeek | 8324 | 64.6 | C | 71 | 15 | 9 | 25 | 7 | 15 | core routes load; graph shell only (0 canvas, 0 rich svg); article list and sampled full text pass; visual signals: cssVars=0, purple=no, mobileOverflow=no. |
| 53 | r8 DeepSeek | 8328 | 64.2 | C | 69 | 15 | 13 | 25 | 7 | 9 | core routes load; graph rendered (1 canvas, 0 rich svg); article list and sampled full text pass; visual signals: cssVars=0, purple=no, mobileOverflow=no. |
| 54 | r9 DeepSeek | 8332 | 62.4 | C | 70 | 15 | 6 | 25 | 9 | 15 | core routes load; no graph render (0 canvas, 0 rich svg); article list and sampled full text pass; visual signals: cssVars=0, purple=no, mobileOverflow=no. |
| 55 | r10 DeepSeek | 8336 | 61.8 | C | 69 | 15 | 7 | 25 | 7 | 15 | core routes load; no graph render (0 canvas, 0 rich svg); article list and sampled full text pass; visual signals: cssVars=0, purple=no, mobileOverflow=no. |
| 56 | r3 DeepSeek | 8308 | 57.8 | D | 65 | 15 | 7 | 25 | 9 | 9 | core routes load; graph shell only (0 canvas, 0 rich svg); article list and sampled full text pass; visual signals: cssVars=0, purple=no, mobileOverflow=no. |
| 57 | r3 Opus 4.8 | 8353 | 57.8 | D | 65 | 15 | 7 | 25 | 9 | 9 | core routes load; graph shell only (0 canvas, 0 rich svg); article list and sampled full text pass; visual signals: cssVars=0, purple=no, mobileOverflow=no. |
| 58 | r3 MiniMax | 8343 | 52.6 | D | 53 | 9 | 7 | 8 | 18 | 11 | core routes load; no graph render (0 canvas, 0 rich svg); article weakness: 0 links, detail text ; visual signals: cssVars=32, purple=yes, overflow=no. |
| 59 | r4 Kimi | 8313 | 51.6 | D | 60 | 15 | 4 | 25 | 7 | 9 | core routes load; no graph render (0 canvas, 0 rich svg); article list and sampled full text pass; visual signals: cssVars=0, purple=no, mobileOverflow=no. |
| 60 | r1 DeepSeek | 8300 | 39.2 | D | 44 | 11 | 4 | 16 | 9 | 4 | core routes load; no graph render (0 canvas, 0 rich svg); article weakness: 104 links, detail text 136/144; visual signals: cssVars=0, purple=no, mobileOverflow=no. |
