<p align="center">
  <img src="https://raw.githubusercontent.com/FrichXi/funeralai/main/assets/logo.png" alt="葬AI" width="400">
</p>

<p align="center">
  <a href="README.md">English</a> | <strong>中文</strong>
</p>

# Personal Work Benchmark

把你的真实工作变成可重复的个人 benchmark：同一份输入、同一份任务 prompt、同一套 runner 契约、多轮模型运行，以及有证据支撑的评分。

这个仓库是一个可复用模板和小型 CLI，不是通用模型排行榜。真实的 FuneralAI Web4 大型案例可以在这里浏览：
[FuneralAI Web4 测试榜单](https://funeralai.cc/test/)。

## 5 分钟跑通 Demo

默认配置运行一个完全自包含的 tiny web task，不需要 API key，也不需要私有数据。

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

你会得到：

```text
runs/tiny-web-task/
examples/tiny-web-task/results/scores.csv
examples/tiny-web-task/results/leaderboard.json
examples/tiny-web-task/results/leaderboard.md
```

## 30 分钟建立自己的 Benchmark

先从模板创建一个新任务：

```bash
node scripts/pwb.mjs init my-benchmark
```

然后编辑：

- `benchmarks/my-benchmark/benchmark.yaml`：任务范围和评分维度。
- `benchmarks/my-benchmark/task-prompt.md`：真正要模型完成的工作请求。
- `benchmarks/my-benchmark/fixtures/`：稳定的本地输入。
- `benchmarks/my-benchmark/models.yaml`：模型和 provider。
- `benchmarks/my-benchmark/runners.yaml`：执行每轮任务的命令。

使用显式配置路径跑同一条流程：

```bash
node scripts/pwb.mjs validate --benchmark benchmarks/my-benchmark/benchmark.yaml --models benchmarks/my-benchmark/models.yaml --runners benchmarks/my-benchmark/runners.yaml
node scripts/pwb.mjs prepare --benchmark benchmarks/my-benchmark/benchmark.yaml --models benchmarks/my-benchmark/models.yaml --runners benchmarks/my-benchmark/runners.yaml
node scripts/pwb.mjs run --benchmark benchmarks/my-benchmark/benchmark.yaml --models benchmarks/my-benchmark/models.yaml --runners benchmarks/my-benchmark/runners.yaml --runner custom-command
node scripts/pwb.mjs score --benchmark benchmarks/my-benchmark/benchmark.yaml --models benchmarks/my-benchmark/models.yaml --runners benchmarks/my-benchmark/runners.yaml --input benchmarks/my-benchmark/manual-scores.csv --out benchmarks/my-benchmark/results
node scripts/pwb.mjs aggregate --benchmark benchmarks/my-benchmark/benchmark.yaml --models benchmarks/my-benchmark/models.yaml --runners benchmarks/my-benchmark/runners.yaml --input benchmarks/my-benchmark/results/scores.csv --out benchmarks/my-benchmark/results
```

更多说明：

- [建立自己的 benchmark](docs/build-your-own.md)
- [Runner 契约](docs/runner-contract.md)
- [Scoring 契约](docs/scoring-contract.md)

## CLI

```text
pwb init <task-id>
pwb validate
pwb prepare --runner custom-command
pwb run --runner custom-command [--dry-run] [--limit n]
pwb score --input manual-scores.csv --out results
pwb aggregate --input results/scores.csv --out results [--generated-at ISO_TIME]
```

`pwb prepare` 会为每个 task / runner / model / round 创建一个 run 目录，并复制 `TASK.md` 和 `input/`。`pwb run` 会在每个 run 目录里执行 runner，并写入 `stdout.log`、`stderr.log` 和 `status.json`。

`pwb score` 用来校验人工或外部 audit 生成的 CSV，不会替你主观打分。每一行评分都必须包含 `round`、`model`、`runner`、`score`、各个评分维度列，以及针对具体产物的 `evidence`。

## 核心原则

| 原则 | 含义 |
|---|---|
| 真实任务 | 从你真的需要完成的工作出发。 |
| 多轮重复 | 每个模型跑多轮，观察平均质量和低尾风险。 |
| 变量拆开 | 明确区分 model、provider 和 runner。 |
| Runner 可替换 | `opencode`、Claude Code 或任意 shell 命令都可以作为执行外壳。 |
| 证据优先 | 分数需要截图、DOM、日志、测试或人工审查记录支撑。 |
| 不外推 | 只报告当前任务能支持的结论。 |

## FuneralAI Web4 大型案例

`examples/funeralai-web4/` 包含第一份真实大型任务快照：重构一个复杂个人网站，包括首页、知识图谱页、文章列表和文章详情页。

公开结果页：
[FuneralAI Web4 测试榜单](https://funeralai.cc/test/)。

方法说明页：
[https://funeralai.cc/test/methodology/](https://funeralai.cc/test/methodology/)

仓库只保留可复用、可审计的部分：

- 任务 prompt
- 评分方法
- CSV / JSON / Markdown 结果摘要
- 代表性截图

仓库不包含完整私有工作目录、全部生成站点、API key、本地 provider 配置或体积较大的中间产物。

## 可复现聚合

重新生成需要提交的 leaderboard 时，可以固定时间戳：

```bash
node scripts/pwb.mjs aggregate --generated-at 2026-01-01T00:00:00.000Z
SOURCE_DATE_EPOCH=1767225600 node scripts/pwb.mjs aggregate
```

## License

[MIT](LICENSE)
