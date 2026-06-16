# 葬AI Web4 复杂个人网站重构测试

这是 `personal-work-benchmark` 的第一份真实任务样例，也是一个大型 Case Study。

任务目标：让不同模型在同一份数据、同一份 prompt、同一类 runner 约束下，多轮独立重构 `funeralai.cc` 的静态网站版本。

可浏览结果：[FuneralAI Web4 测试榜单](https://funeralai.cc/test/)

## 输入

- 文章数据：葬AI文章 JSON
- 图谱数据：节点与关系 JSON
- 排行榜数据：products / founders / vcs / companies
- 任务说明：[`task-prompt.md`](task-prompt.md)

公开仓库不包含完整私有工作目录，只保留可复用说明、评分方法和结果摘要。因此这个目录是历史结果快照，不是从零可复跑的完整实验包。

## 评分

最终榜单使用 graph-weighted 公式：

```text
loading 15 + graph/25*35 + articles/25*15 + visual 20 + interaction 15
```

这样做是为了避免“文章页基本完整、但图谱只是空壳”的产物拿到过高分。

## 结果

- [`results/scores.csv`](results/scores.csv)
- [`results/scores.json`](results/scores.json)
- [`results/report.md`](results/report.md)
- [`results/leaderboard.json`](results/leaderboard.json)
- [`results/leaderboard.md`](results/leaderboard.md)

线上可浏览版本：[FuneralAI Web4 测试榜单](https://funeralai.cc/test/)

方法说明页：[https://funeralai.cc/test/methodology/](https://funeralai.cc/test/methodology/)

## 边界

这个结果只代表“葬AI Web4 复杂个人网站重构任务”里的表现，不代表通用模型能力排名。
