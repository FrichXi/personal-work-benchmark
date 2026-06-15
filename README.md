<p align="center">
  <img src="https://raw.githubusercontent.com/FrichXi/funeralai/main/assets/logo.png" alt="葬AI" width="400">
</p>

# Personal Work Benchmark / 葬AI Benchmark

```bash
git clone https://github.com/FrichXi/personal-work-benchmark.git
cd personal-work-benchmark
npm install
npm run validate
npm run aggregate
```

`personal-work-benchmark` 是一套开源的个人真实任务评测方法。

它不试图发明一个放之四海皆准的 benchmark，而是把你日常真正会做的工作抽象成一个可重复任务：同一份输入、同一份任务说明、同一套输出要求，让不同模型和不同 coding agent runner 多轮独立完成，再用浏览器或领域检查器留下可审计证据。

## 这是什么

现在很多榜单的问题是：任务离真实工作太远，或者所有人都被迫相信同一套题能代表所有需求。

这套方法换一个角度：

- 如果你做复杂个人网站，就评测模型重构复杂个人网站的能力
- 如果你做本地客户端，就评测模型完成客户端任务的能力
- 如果你写 C++，就评测模型在你的 C++ 任务里的表现
- 如果你写文章、做数据分析、维护脚本，也可以把那些工作变成自己的小型 benchmark

重点不是得出“全世界最强模型”，而是得出“对我的真实工作最有用的模型”。

## 核心原则

| 原则 | 含义 |
|------|------|
| 真实任务 | 任务来自实际工作，不是为了榜单临时编题 |
| 多轮重复 | 每个模型跑 5-10 轮，观察平均质量和低尾风险 |
| 变量拆开 | 模型是被测对象，provider 是 API 来源，runner 是执行外壳 |
| Runner 可替换 | `opencode`、Claude Code、派或任意命令都只是执行器 |
| 证据优先 | 评分必须有截图、DOM、日志、测试或人工证据支撑 |
| 不外推 | 只说明这个任务里的表现，不包装成通用能力排名 |

## 快速开始

### 1. 校验配置

```bash
npm run validate
```

默认会读取：

```text
configs/benchmark.yaml
configs/models.yaml
configs/runners.yaml
```

### 2. 聚合示例结果

```bash
npm run aggregate
```

输出：

```text
examples/funeralai-web4/results/leaderboard.json
examples/funeralai-web4/results/leaderboard.md
```

### 3. 查看 dry-run 命令

```bash
node scripts/pwb.mjs run --dry-run --runner custom-command
```

这会打印每一轮应该执行的命令，不会真的调用模型。

## 配置文件

### `benchmark.yaml`

定义任务本身：输入材料、输出要求、轮数、需要检查的页面或场景，以及评分维度。

### `models.yaml`

定义被测模型：模型名、版本、provider、需要的环境变量名。这里不保存 API key。

### `runners.yaml`

定义执行外壳：`opencode`、`claude-code`、`custom-command`。同一个模型可以通过不同 runner 执行，只要最终产物遵守同一输出目录规则。

## Pipeline

```text
benchmark.yaml + models.yaml + runners.yaml
        |
        v
runs/{task}/{runner}/{model}/{round}/
        |
        v
browser / domain audit
        |
        v
evidence/*.json + screenshots/
        |
        v
results/scores.csv
        |
        v
results/leaderboard.json + leaderboard.md
```

标准输出目录建议为：

```text
runs/{task}/{runner}/{model}/{round}/
evidence/{task}/
results/{task}/scores.csv
results/{task}/leaderboard.json
```

## 葬AI Web4 示例

`examples/funeralai-web4/` 是第一份真实任务样例：让模型读取同一份本地数据，独立重构一个复杂个人网站，包括首页、知识图谱、文章列表和文章详情。

这个示例包含：

- 任务 prompt
- 评分方法
- 60 个站点的 CSV / JSON / Markdown 摘要
- 少量代表截图
- 与线上排行榜对应的数据快照

线上结果页：

```text
https://funeralai.cc/test/
```

方法说明页：

```text
https://funeralai.cc/test/methodology/
```

## 开源范围

这个仓库只包含可复用、可审计、体积可控的部分：

- 方法说明
- 配置模板
- runner 适配器
- 聚合脚本
- 评分表和结果摘要
- 少量代表截图

以下内容不放进仓库：

- 完整 qwen 实验目录
- 全量 60 个生成站点
- API key、本地 provider 配置、私有日志
- 体积过大的中间产物

全量产物可以作为网站静态资源、release artifact 或外部归档保存。

## License

[MIT](LICENSE)
