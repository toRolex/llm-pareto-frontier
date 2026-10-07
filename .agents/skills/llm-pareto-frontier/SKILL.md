---
name: llm-pareto-frontier
description: 斩杀线 4D：抓 AA + Arena 榜，产出单文件 4D 交互页（3D/2D 视角、11 指标切换、Pareto 前沿三角面/发光线、effort 连线 hover、性能归一化），解读由 LLM 每次现看现写
---

# llm-pareto-frontier

Zero-argument skill。抓取 Artificial Analysis 模型榜（AA 详情页 6 指标）与
arena.ai 榜（text + agent 4 榜），构建出单文件 4D 交互页面
`prototype-4d-3d.html`（three.js，构建时数据内联，运行时零网络，双击
file:// 可开）。四个维度：Metric（11 指标可切换）↑ · Cost/Task ↓ ·
Output Tokens/Task ↓ · Tokens/s ↑。前沿语义 = 4D Pareto 前沿三角面（3D 视角）
+ 2D 视角双层发光前沿线。解读由 LLM 每次现看现写。

## 核心循环

本 skill 目录可能是 `.claude/skills/llm-pareto-frontier`（symlink）或
`.agents/skills/llm-pareto-frontier`——以下 `<SKILL>` 代指实际路径。所有命令以
skill 目录为 cwd，只需要 node stdlib，无参数（阈值写在脚本里）：

```bash
cd <SKILL>  # 例如 .agents/skills/llm-pareto-frontier/
node scripts/fetch-aa.mjs      # → $TMPDIR/model-killing-line/aa-data.json（榜单行；无硬门槛，只求可解析）
node scripts/fetch-catalog.mjs # → $TMPDIR/model-killing-line/aa-catalog.json（单个详情页内嵌全目录：6指标+tok+价，一次 curl）
node scripts/fetch-metrics.mjs # → $TMPDIR/model-killing-line/aa-metrics.json（目录优先，逐页兜底；增量；失败 exitCode = 2）
node scripts/fetch-arena.mjs   # → $TMPDIR/model-killing-line/arena-data.json (arena.ai text + agent 4 榜；走 curl 子进程绕 403)
node scripts/fetch-prices.mjs  # → $TMPDIR/model-killing-line/aa-prices.json（必须在 build 前）
node scripts/build-proto.mjs   # 原地内联 JSON、logo、定价引擎与 three.js（幂等，可重跑）
node scripts/open.mjs          # 用系统默认浏览器打开 prototype-4d-3d.html
```

产 = `prototype-4d-3d.html`（skill 根目录，单文件自足）。中间 JSON 全部进
OS temp dir（`os.tmpdir()/model-killing-line/`，可用 `MKL_DIR` env 覆盖），
不进仓库。解读/分析只在本轮对话里给，不注入页面（曾经的 #obs 解读区已移除：
遮挡画面、维护成本高，用户明确废弃）。

## 数据流（v7）

- **核心发现：任意一个 AA 模型详情页都内嵌全目录**（~925 slug：~686 模型 ×
  6 指标 + ~418 tok + ~530 挂牌价）。fetch-catalog.mjs 一次 curl 拿全库；
  fetch-metrics / fetch-prices 目录优先（byName 直查 + slugOf 反查 bySlug），
  只对目录缺失项逐页兜底。
- **fetch-aa 无硬门槛**：Index 过滤已废除（Intelligence Index 只是 11 指标
  之一，不作入选标准）；Cost per Task 过滤也已退役（页面 Cost 轴用挂牌价
  pblend）。可见性由数据完整性（tok/价格）自然淘汰。
- **slug 解析**：目录映射（含去 "(based on ...)" 后缀别名）→ slugOf 反查
  bySlug → SLUG_OVERRIDE / 剥括号规则，逐层兜底。榜单名截断目录名时靠别名兜住。
- **AA 占位 tok 检测**：目录对象里未实测档 tok 为 null（诚实）；own-page
  currentModel 会给这些档填占位常量（观测值 54642.77172835717）——检测到
  ≥3 变体精确同值即置 null，绝不冒充真值。
- **详情页抓取全走 curl 子进程**：AA 对 node fetch 高频请求限连
  （UND_ERR_CONNECT_TIMEOUT），所有抓取脚本均用 curl（--max-time 120）；
  单页可能 40s+，回退多时耐心等。
- **目录已确认无价的 base 跳过逐页兜底**（own-page 价格同为 null，纯浪费时间）。
- `build-proto.mjs` 的行清单以 `aa-data.json` 为准重建（HTML 只是输出，
  绝不从 HTML 旧 ROWS_RAW 读行——否则 AA 新增模型永远进不了页面，
  Sonnet 5.5 事件即此因）。tok/价格在重建后的行上打补丁。
- `fetch-metrics.mjs` 依赖 `aa-data.json` 先行（从中取变体名单），各 fetch
  按上面顺序跑，不能并行。
- build 输出 `prices patched + missing` 之和必须等于行数；不等 = 行清单
  有问题（如仍在从 HTML 读旧行）。

## 定价与套餐

- API 挂牌价由 AA catalog / 详情页供给。构建仍以 `aa-data.json` 为行清单，不以 HTML 旧快照当生产源。
- 默认四比例为 input 0.4%、cacheRead 96.7%、cacheWrite 2.6%、output 0.3%。只在非负有限数合计 100% 时应用。无效草稿显示提示，保留上次有效图与比例。缺价且该项占比为零时不阻塞混合；合法零价可用。
- cache-write 若 AA 提供则保留报价来源。缺报价时 Anthropic 按官方 5-minute 写入规则 `1.25 × input` 折算，依据 https://platform.claude.com/docs/en/about-claude/pricing 。其他厂商 `write = input` 明确标估算，非实测。
- `scripts/pricing-model.mjs` 是套餐 registry 与纯计算的唯一来源。所有倍率按用户提供的 SemiAnalysis 文章截图快照 2026-09-29，来源 https://newsletter.semianalysis.com/p/anthropic-subscriptions-offer-5x 。满额使用下固定倍率估算，非官方承诺；调整四比例不会重拟合倍率。
- 每厂商独立选择 API / 套餐，默认 API，无总开关。有效单价为 `API ÷ 套餐倍率`，所有 effort 同倍率。OpenAI 除 Astra 外全部继承 Sol，含 Luna；其他厂商严格模型版本，不覆盖则保留 API。Sonnet Pro / Max5x 标拟合，Fable Pro 不含，Max 套餐最多半额度。Cursor 暂无 benchmark 点但保留选择器。
- localStorage 仅保存有效四比例和套餐。恢复默认比例不重置套餐；所有厂商恢复 API 不重置比例。所有模式、$/task、3D/2D 前沿共用有效价格入口。tooltip 显示 API 原价、折算价、倍率、来源日期、拟合或继承、cache-write provenance。
- 验证命令 `node scripts/test-pricing.mjs`。从项目根运行 `ego-browser nodejs < .agents/skills/llm-pareto-frontier/scripts/verify-pricing-browser.mjs` 做真实 file:// 浏览器验收，结果写 `/tmp/mkl-subscription-evidence/`。临时 HTML 提取 fixture 仅供离线回归，不称实时抓取数据。

## 解读：只在对话里写，不进页面

1. **Intelligence Index 只是 11 指标之一，不作主锚**（用户明确认为该指标
   蛮烂：加权口径不透明）。推荐解读以 GDPval（真实经济工作任务）与
   Terminal-Bench 4.0（agentic 实机任务）为主锚，Index 仅供参考；
   Arena 榜作为“已实测档”的补充佐证。
2. **缺测 ≠ 短板**。Arena 榜对 AA 行是严格 effort 级对齐，覆盖不全（各榜
   覆盖率看 state 栏），未覆盖档直接隐藏。某档未覆盖应理解为"按 AA 实测 +
   代际推测的候选"：解读里点出"对应的上一代"并给推测涨幅。
3. **措辞用"未实测（按代际推测 ≥ 前代 X）"**。硬禁词：`暂缺` / `待更新` /
   `短板` / `缺测 = 不推荐`。
4. **流量信号独立成段**。生产侧采用度（如 OpenRouter 周用量）远超
   benchmark 覆盖的模型是"benchmark 滞后于生产采用"的典型，单独成段提及。

## 页面交互速查

- **视角**：3D（拖拽旋转/滚轮缩放）/ Cost–Metric 2D / Token–Metric 2D
  （滚轮缩放/拖拽平移），摄像机 0.8s 飞行。2D 视角由双层发光线（墨绿
  `#487265`）画该视角两维重算的 Pareto 前沿；3D 里前沿语义交给三角面。
- **指标切换**：底栏 11 pill（Index / GDPval / TBench-4.0 / SciCode / HLE /
  Omniscience / Arena-Text / Arena-Agent×4）。
- **轴读法**：`Cost: log↔线性`、`Tok: log↔线性`、`Perf: 绝对值↔归一` 三颗
  按钮正交可任意组合。轴反向（原点=最差，最远=0）。归一 = 当前指标可见行
  最大值记 100（每指标独立、随筛选重算；tooltip 同时给原始值与归一值）。
- **筛选**：⚙ Configs popover 按 baseKey 分组勾选 effort 档（带搜索框，按模型名/厂商过滤），前沿实时重算。
- **批代默认**：默认只勾每家最新一批（build-proto 打 batch/latest 标，最新批 = 可显示行里 max(Index) 的 batch；旧批行名标「·上一批」，Configs 勾回，Select all 全开）。
- **hover**：任一 sprite 显示 tooltip（logo + 模型名 + 当前指标 + cost/tok +
  🔪 前沿标记），同时该模型整条 effort 连线变粗提亮、其他组淡出。
- **解读**：无页内解读区（已废弃）；分析与推荐由 LLM 在对话里现看现写。

## Completion criteria

- `fetch-aa.mjs` prints `trs: ~266, kept(可解析): ~266`。`kept` 漂移说明表格
  markup 或筛选 yield 变了——先检查再继续。无硬门槛：Index / Cost per Task 过滤
  已废除，且 index 解析不出（未实测档显示 `----`）的行保留为 `index: null`，
  不再丢行（Sonnet 5.5 low 事件：丧行导致页面缺 low 档）。无 JSON API exists
  for the leaderboard table — SSR HTML is the only source.
- `fetch-metrics.mjs` 增量跑印 `ok=N (catalog X + cached Y + fetched Z) err=W`，
  量级 `metrics: ~266 variants`；目录 tok 为 null 即 AA 未实测。目录条目只要
  有任一非空字段就采用（部分实测档如 low：index=null 但 tok 为真值，别整条
  丢弃去 own-page 拿占位 tok）。数目大变说明 AA 结构变了；失败时 exitCode = 2。
  改目录提取逻辑后必须 `--force` 重跑一次，否则污染缓存被复用。
- **⚠️ fetch-catalog.mjs 的 slug 提取必须选「窗口内 shortName 最近」的出现点**，
  绝不能取首次出现。同一 base slug 在 HTML 里出现多次：嵌套引用（variant 对象
  里的 `release:{slug:...}`、creator/provider 列表）常排在真对象前面，首次出现
  的 9000 字符窗口会读进邻近对象（往往是 medium 档）的指标——max 档（base 页
  即 max）整行错成 medium/Non-reasoning 数据（Sonnet 5.5 max、DeepSeek V4.1
  Flash max 事件，2026-09-30，113/925 slug 受影响）。真对象以自带 shortName
  为标志。验证锚点：`claude-sonnet-5-5` 目录 idx≈55.98/tok≈192838；
  `deepseek-v4-1-flash` idx≈39.46/tok≈88574。
- `fetch-arena.mjs` prints text + agent 4 榜的条数。走 curl 子进程绕 403，
  若 403 复现则检查 curl header。
- `build-proto.mjs` prints
  `metrics: N variants; arena boards: text,agentOverall,agentCode,agentChat,agentWork; tok patched: N; logos added: …`
  ——重复运行幂等（logo 键存在即跳过）。`tok patched: 0` 且数据无更新属正常。
- **一致性自检**：同 base 多档的 tok 逐档全等 = 数据源坏（唯一合法例外：
  Qwen3 Next 80B A3B——AA 目录里 base slug 对象本身就是 Reasoning 变体的
  重复别名，非我们的 bug）；tok 随 effort 档单调上升为常态。
- 浏览器验收必须用真实控件验证四比例、套餐、恢复、刷新保持、价格模式、$/task、3D/2D 与前沿更新。直接打开 file://，检查 `window.__errs2` 为空及 resource 请求为空；截图必须来自实际页面，不能只以构建成功代替验收。
- `logos/` 与 `prototype-assets/logos/` 随 skill 提交，构建时 base64 内联，
  无 sidecar。新厂商进 `prototype-4d-3d.html` 的 `logoOf()`。
