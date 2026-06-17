# FuneralAI Web4 Refactor Prompt (Redacted)

Original SHA-256: `db10431344850b44bb044ecfdf749716fb62c097b389c2d0406f5cb32dbb7ea7`

Only local filesystem paths were redacted. Task requirements, data-file names, expected routes, and scoring-relevant counts are preserved.

```text
你是一名前端开发专家。请基于本地完整数据源，重构「葬AI Web4」网站（https://funeralai.cc）。

## 源材料（必须使用这些本地文件，不要依赖网络抓取）

参考站点：`<SOURCE_WORKDIR>/site/out/`（已构建好的静态站，可直接预览）。

数据文件：
1. `<SOURCE_WORKDIR>/web-data/leaderboards.json` — 四分类排行榜（products / founders / vcs / companies），72 个实体。
2. `<SOURCE_WORKDIR>/web-data/articles/*.json` — 103 篇文章。每篇包含 id、title、date、author、permalink、raw_markdown。
3. `<SOURCE_WORKDIR>/data/graph/canonical_corrected.json` — 完整知识图谱，600 个节点、1546 条边。字段：nodes.id/name/type/description/degree/...，links.source/target/type/...。
4. `<SOURCE_WORKDIR>/site/src/` — 原站 Next.js 源码，可参考但鼓励重新设计。

## 必须保留的功能

1. **首页**：品牌「葬AI Web4」、站点简介、核心统计（103 文章 / 600 节点 / 1546 关系）、导航入口（图谱、文章）。
2. **知识图谱页 /graph/**：
   - 展示完整 600 节点 + 1546 条边的交互式网络图（可缩放、拖拽、点击节点查看详情）。
   - 使用 leaderboards.json 渲染 products / founders / vcs / companies 四个排行榜。
   - 节点按 product / founder / vc / company 四类着色。
3. **文章列表页 /articles/**：列出全部 103 篇文章，包含标题、日期、作者，支持搜索或分类筛选。
4. **文章详情页 /articles/NNN/**：103 篇独立详情页，必须渲染每篇文章的原始 markdown 正文，保留标题、日期、作者、导航链接。
5. **全局导航**：首页、图谱、文章列表、文章详情之间可互相跳转。

## 设计要求

- 你可以自由重新设计视觉风格、配色、排版、动效、交互细节。
- 必须保持「葬AI Web4」品牌调性：中文 AI 行业评论媒体、独立、尖锐、有态度。
- 鼓励使用纯静态 HTML/CSS/JS（单页或多页均可），以便零构建即可本地预览。
- 如使用 React/Vue/Next.js 等框架，必须提供构建后的静态产物和明确的启动命令。
- 产物在本地直接用浏览器打开 index.html 或 `python3 -m http.server` 即可正常浏览。

## 输出要求

- 所有产物写入当前工作目录。
- 必须包含 `index.html`、完整的 `/graph/` 页面、完整的 `/articles/` 列表、全部 103 篇 `/articles/NNN/` 详情页。
- 写入 `README.md`，说明：技术栈、文件结构、本地预览命令。
- 完成后立即执行本地验证：`python3 -m http.server` 启动，curl 或浏览器检查以下路径返回 200 且内容正确：
  - `/` 首页
  - `/graph/` 知识图谱页
  - `/articles/` 文章列表页
  - `/articles/103/`、`/articles/080/`、`/articles/050/` 三篇详情页
- 把验证命令和结果写入 `VERIFICATION.md`。

不要向用户询问确认，直接开始创建文件。

```
