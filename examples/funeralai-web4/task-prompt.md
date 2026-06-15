# 葬AI Web4 重构任务 Prompt

你是一名前端开发专家。请基于本地完整数据源，重构「葬AI Web4」网站。

## 源材料

请使用任务工作目录中的本地数据，不要依赖网络抓取：

1. `web-data/leaderboards.json` — 四分类排行榜。
2. `web-data/articles/*.json` — 文章数据，包含 id、title、date、author、permalink、raw_markdown。
3. `data/graph/canonical_corrected.json` — 知识图谱，包含 nodes 和 links。
4. `reference-site/` — 已构建好的参考站点，可参考但鼓励重新设计。

## 必须保留的功能

1. 首页：品牌、站点简介、核心统计、导航入口。
2. `/graph/`：展示完整交互式网络图，可缩放、拖拽、点击节点查看详情，并渲染四类排行榜。
3. `/articles/`：列出全部文章，包含标题、日期、作者，支持搜索或筛选。
4. `/articles/NNN/`：每篇独立详情页，渲染原始 markdown 正文。
5. 全局导航：首页、图谱、文章列表、文章详情之间可互相跳转。

## 设计要求

- 可以自由重新设计视觉风格、配色、排版、动效和交互。
- 必须保持中文 AI 行业评论媒体的品牌调性：独立、尖锐、有态度。
- 鼓励使用纯静态 HTML/CSS/JS，以便零构建本地预览。
- 如使用框架，必须提供构建后的静态产物和明确启动命令。

## 输出要求

- 所有产物写入当前工作目录。
- 必须包含 `index.html`、完整的 `/graph/` 页面、完整的 `/articles/` 列表、全部 `/articles/NNN/` 详情页。
- 写入 `README.md`，说明技术栈、文件结构、本地预览命令。
- 写入 `VERIFICATION.md`，记录本地验证命令和结果。

不要询问确认，直接开始创建文件。
