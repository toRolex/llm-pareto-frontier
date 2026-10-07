# llm-pareto-frontier · 斩杀线 4D

LLM 性价比 Pareto 前沿交互页 —— 一个 [Agent Skill](https://agentskills.io)。

抓取 Artificial Analysis 模型榜（6 指标 + 价格）与 arena.ai 榜（text + agent 4 榜），
构建出单文件 4D 交互页面 `prototype-4d-3d.html`（three.js，构建时数据内联，
**运行时零网络**，双击 file:// 可开）。

四个维度：**Metric（11 指标可切换）↑ · Cost/Task ↓ · Output Tokens/Task ↓ · Tokens/s ↑**
前沿语义 = 4D Pareto 前沿三角面（3D 视角）+ 2D 视角双层发光前沿线。
解读由 LLM 每次现看现写。

## 安装（Claude Code）

```text
/plugin marketplace add toRolex/llm-pareto-frontier
/plugin install llm-pareto-frontier@llm-pareto-frontier
```

装好后直接说「用 llm-pareto-frontier 重建斩杀线页面」，
或 `/llm-pareto-frontier:llm-pareto-frontier`（plugin skill 带 namespace）。

也可以不用 marketplace，直接把 `.agents/skills/llm-pareto-frontier/` 复制到
`~/.claude/skills/llm-pareto-frontier/`，用 `/llm-pareto-frontier` 调用。

## 使用

进入 skill 后按 `SKILL.md` 的核心循环执行（全部 node stdlib，无外部依赖）：

```bash
cd <SKILL>
node scripts/fetch-aa.mjs      # AA 榜单行
node scripts/fetch-catalog.mjs # AA 单页内嵌全目录（6 指标 + tok + 价格）
node scripts/fetch-metrics.mjs # 目录优先生成 per-effort 指标
node scripts/fetch-arena.mjs   # arena.ai text + agent 4 榜
node scripts/fetch-prices.mjs  # AA 挂牌价（build 前必须）
node scripts/build-proto.mjs   # 内联数据/logo/定价引擎 → prototype-4d-3d.html（幂等）
node scripts/open.mjs          # 系统浏览器打开成品
```

数据默认读写 `$TMPDIR/model-killing-line/`，可用 `MKL_DIR` 覆盖。

## 回归

```bash
node scripts/test-pricing.mjs              # 定价行为 CLI 回归
node scripts/verify-pricing-browser.mjs    # 真浏览器定价持久化/双 reset
node scripts/test-redesign-browser.mjs     # 真浏览器 38 项 UI/前沿/标签回归（需 TaskSpace）
```

## 仓库结构

```
.agents/skills/llm-pareto-frontier/  # skill 本体（SKILL.md + scripts + 成品页 + 规格）
specs/                               # 业务规格 v3/v5/v6（定价语义权威来源）
.claude-plugin/marketplace.json      # Claude Code plugin marketplace 清单
```

定价业务引擎 `scripts/pricing-model.mjs` 为不改红线：四比例 100% 才应用、
无效输入保留上次有效结果、固定倍率估算、每家可 API/套餐混合、两个 reset 独立、
同模型 effort 共倍率、OpenAI 按套餐继承、其他厂商严格版本、cacheWrite 估算标识。

## 致谢

本项目基于 [orionpax1997/model-killing-line](https://github.com/orionpax1997/model-killing-line)
开发。感谢原项目作者提供的 skill、榜单抓取与 Pareto 可视化基础；
本仓库以 `llm-pareto-frontier` 为 skill 名称继续维护。

## License

[MIT](./LICENSE)
