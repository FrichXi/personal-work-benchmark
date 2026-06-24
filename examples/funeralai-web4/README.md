# 葬AI Web4 复杂个人网站重构测试

这是 `personal-work-benchmark` 的第一份真实任务样例，也是一个大型 Case Study。

任务目标：让不同模型在同一份本地数据、同一份 prompt、同一类 runner 约束下，多轮独立重构 `funeralai.cc` 的静态网站版本。测试目标不是通用模型排名，而是回答一个窄问题：哪个模型在这个真实网站重构任务里更稳定地交付可浏览、可用、图谱真实渲染的静态站点。

可浏览结果：[FuneralAI Web4 测试榜单](https://funeralai.cc/test/)

## 输入

- 文章数据：葬AI文章 JSON
- 图谱数据：节点与关系 JSON
- 排行榜数据：products / founders / vcs / companies
- 任务说明：[`task-prompt.md`](task-prompt.md)
- 实际运行 prompt：[`prompts/refactor-prompt.redacted.md`](prompts/refactor-prompt.redacted.md)

公开仓库不包含完整私有工作目录、API key、本地 provider 配置或完整生成站点。它公开的是可审计部分：脱敏 prompt、运行元数据、浏览器审计脚本、raw browser evidence、截图、评分结果和从 raw evidence 复算结果的脚本。

## 评分

当前公开榜单来自 `2026-06-23` 的 graph-weighted 追加结果：

```text
旧 60 站结果 + Doubao/Step 追加 20 站 = 80 generated websites
```

Doubao Seed 2.1 Pro 和 Step 3.7 Flash 在 2026-06-23 用同一冻结数据快照、同一任务 prompt、同一产物结构和同一 graph-weighted 评分脚本追加进榜。旧 60 站 WebBridge/CDP 审计仍作为历史证据包保留。分数由脚本根据浏览器证据计算，不是 Opus 4.8 裁判，也不是人工给 graph 打分。

公式：

```text
loading 15 + graph 35 + articles 15 + visual 20 + interaction-affordance/stability 15
```

graph 35% 权重是作者对这个网站重构任务的预设偏好：如果文章页基本完整但知识图谱只是空壳，不应拿到过高分。它不是通用模型能力权重。

详细维度见 [`scoring.md`](scoring.md)。

## 结果

- [`results/2026-06-23-graphweighted-append/`](results/2026-06-23-graphweighted-append/)：当前公开 80 站结果、模型日志分析和性价比横向表。
- [`results/leaderboard.md`](results/leaderboard.md)
- [`results/leaderboard.json`](results/leaderboard.json)
- [`results/scores.csv`](results/scores.csv)
- [`results/scores.json`](results/scores.json)
- [`results/report.md`](results/report.md)

当前公开主榜按每个模型 10 轮平均分排序，并新增性价比榜解释现金/等价成本、缓存、耗时、调用数和可见 token 负载。均分差距小于 2 分时，只视为本任务和本公式下的窄幅差异，不做强通用能力断言。

## 可审计证据

旧 60 站历史证据包位于 [`audit/2026-06-16-webbridge/`](audit/2026-06-16-webbridge/)：

- `method-lock.md`：样本、浏览器通道、并发、固定页面、公式和报告规则。
- `manifest.json`：冻结的 60 站清单。
- `webbridge-score.mjs`：原始本地审计脚本的脱敏版本。
- `generate-manifest.mjs`：原始 manifest 生成脚本的脱敏版本。
- `raw/*.json`：每站原始浏览器/DOM/路由证据。
- `screenshots/*.png`：每站首页、图谱页、文章列表页截图，共 180 张。
- `server-logs/*.log`：本地静态服务器日志。
- `site-scores.csv`、`final-results.json`：从 raw evidence 复算的结构化结果。

运行元数据：

- [`run-metadata.csv`](run-metadata.csv)
- [`run-metadata.json`](run-metadata.json)

复算命令：

```bash
npm run funeralai:check
```

重新生成结果：

```bash
npm run funeralai:recompute
```

## Historical Notes

旧版报告标题曾写作 `Graph-Weighted Recheck With Opus 4.8`。这个标题容易让人误解为 Opus 4.8 既参赛又当裁判。当前主结果已经替换为统一 WebBridge/CDP 复评；旧报告只作为历史上下文，不作为当前主榜口径。

## 边界

这个结果只代表“葬AI Web4 复杂个人网站重构任务”里的表现，不代表通用模型能力排名。因为原始私有工作目录没有公开，外部读者不能从零完整复跑生成阶段；但可以审计公开的 prompt、运行元数据、历史浏览器 raw evidence、截图、当前 80 站结果、汇总日志分析和分数复算流程。原始账单 PDF、控制台截图、XLSX/PDF 导出、完整 OpenCode 本地数据库和完整私有生成目录不公开。
