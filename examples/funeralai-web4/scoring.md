# 评分方法

## 目标

实际打开每个生成站点，记录站点特异性证据，避免模板化评分。每个分数必须能从 `audit/2026-06-16-webbridge/raw/*.json`、截图和复算脚本追溯。

## 反模板规则

- 每个站点必须有独立证据句。
- 重复分数必须能由相似证据解释。
- 源码中存在功能关键词不等于用户真的可用。
- 必须检查首页、图谱页、文章列表页和抽样文章详情页。
- 浏览器并发需要受控，避免渲染假阴性。
- 图谱页不能只看 DOM 是否有 `canvas` 或 `svg`；必须结合可见渲染信号、结构数量和截图。

## 维度

| 维度 | 分值 | 证据来源 |
|------|---:|------|
| Loading | 15 | `/`、`/graph/`、`/articles/`、`/articles/050/`、`/articles/080/`、`/articles/103/` 路由状态，以及 README / VERIFICATION 文件存在性 |
| Graph | 35 | 图谱页路由、可见 canvas/SVG 渲染、partial/blank 判定、graph library、节点/边文本信号、zoom/drag/click affordance、页面错误标记 |
| Articles | 15 | 文章列表路由、文章链接数量、三篇抽样详情页路由、详情正文长度、shell/placeholder 惩罚 |
| Visual | 20 | 设计 token、暗色/对比主题、字体声明、响应式规则、首页信息结构、错误状态、静态多页面结构 |
| Interaction | 15 | 搜索/筛选 affordance、导航密度、图谱 zoom/drag/click affordance、固定路径稳定性 |

## 当前公式

```text
score = loading + graph + articles + visual + interaction
```

其中：

```text
loading = 15
graph = 35
articles = 15
visual = 20
interaction = 15
```

`Graph = 35` 是作者预设权重，用来体现这个任务中知识图谱的重要性。它不是“客观通用模型能力”的权重。

## 裁判说明

评分由 Codex 编写的 Node 脚本执行，浏览器证据由 Kimi WebBridge/CDP 驱动真实 Chrome 采集。Opus 4.8 是参赛模型之一，不参与当前主结果的裁判打分。graph 维度也不是人工主观打分。

复算脚本：

```bash
npm run funeralai:check
```

## 解释边界

这不是通用模型榜单，只是这个真实任务里的结果。均分差距小于 2 分时，不做强能力断言，只视为本轮样本和本评分公式下的窄幅差异。
