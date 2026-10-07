# Spec — 斩杀线 4D Prototype v2（风格对齐 + 指标切换 + DeepSWE 筛选）

Status: ready-for-agent（无 issue tracker，本文件即 spec 源）
日期：2026-09-27
对象：`.agents/skills/model-killing-line/prototype-4d-3d.html`（单文件 Three.js 原型，数据内联）

---

## Problem Statement

用户把 prototype 当作"斩杀线"叙事工具在浏览器里操作，遇到一组 bug 和能力缺失：

1. 切到 2D 视角时，连线仍是 3D 前沿的投影，不是当前视角两维下的帕累托前沿。
2. 图标（logo 圆点）大小不一：前沿 0.42 / 普通 0.3 两档，视觉杂乱，且无法调整整体大小。
3. 模型筛选只能整模型开关，无法单独勾选某个 effort 档；筛选或切 log/linear 后 3D 相机被重置回默认位置，丢失用户视角。
4. 3D 里两条水平轴（cost 轴、output-tokens 轴）渲染长度不一致。
5. 纵轴被 AA Intelligence Index 绑死——它不是唯一、甚至不是最好的性能指标；用户想要客观 benchmark（AA 各单项）与主观双盲（Arena 各榜）都能当纵轴。
6. 整体视觉风格与参考仓库 [orionpax1997/model-killing-line](https://github.com/orionpax1997/model-killing-line)（其 `render-aa.mjs` / `gen-html.mjs` 的静态 SVG 页）不一致。

## Solution

对 prototype 做一轮"修复 + 功能 + 风格"三合一改造：

- 2D 视角只画**该视角两维重新计算的 2D 帕累托前沿连线**（参考 repo 的 `#888` 灰虚线 polyline 样式）；点仍全部显示。
- 所有 logo 圆点**统一大小**，新增底栏 **slider（0.5x–3x，默认 1x）** 实时调整。
- 筛选面板改造成 **DeepSWE（deepswe.datacurve.ai）式 popover**：每模型一行（三态 checkbox + 模型名 + 已选档数 n/m），行内 effort chips（LOW/MEDIUM/HIGH/XHIGH/MAX…）单独增减，底部 Select all / Clear，底栏按钮实时显示 `Configs (n/m)`。
- **任何筛选、log/linear 切换、纵轴指标切换都不重置相机**（3D 保留 OrbitControls 位姿；2D 保留 orthoZoom/pan）。
- 两条横轴**渲染长度相等**（刻度仍各按自身数据域分布）。
- 新增**纵轴指标切换器**（底栏 pill 按钮组，共 11 个指标：6 个 AA 客观 + 5 个 Arena 主观）。切换后 4D 前沿、3D 面、2D 连线、tooltip、计数全部按新指标重算；该指标缺失的模型直接隐藏。
- 全部品牌相关元素（logo 圈色、effort 连线色、图例）改用**厂商品牌主色**，2D/3D 统一。
- 视觉 token 对齐参考仓库；参考仓库有而原型没有的元素（深色 tooltip、高性价比区标注、pill 按钮等）补齐；原型独有而参考没有的（3D 前沿三角面）保留并换色为 `#487265`。
- 补齐缺失 logo（Multiverse/Quasar、修 Nemotron 未内联 bug）；**Apodex 1.1 保留，不删任何模型**。

## User Stories

1. 作为数据可视化读者，我想切到 2D 视角时看到的是当前两维下重新计算的帕累托前沿连线，以便"斩杀线"在 2D 下语义正确。
2. 作为数据可视化读者，我想所有模型图标大小一致，以便图面不因大小差异产生误读。
3. 作为演示者，我想用底栏 slider 实时调大/调小所有图标，以便在不同投影/截图场景下都清晰。
4. 作为分析者，我想在筛选面板里单独勾选某模型的某个 effort 档，以便对比同模型不同推理档位的性价比。
5. 作为分析者，我想用行首三态 checkbox 一次全选/半选/全不选某模型的所有档位，以便快速按厂家粗筛。
6. 作为分析者，我想点 Select all / Clear 一键恢复全选或清空，以便从极端状态快速回位。
7. 作为分析者，我想底栏 Configs 按钮实时显示已选档数/总档数，以便不开面板也知道当前筛选规模。
8. 作为演示者，我想筛选、切 log/linear、切纵轴指标时相机保持原地不动，以便给观众演示时视角不跳。
9. 作为 2D 用户，我想 2D 下滚轮缩放、拖拽平移的状态在筛选后被保留，以便持续聚焦关心的区域。
10. 作为读者，我想 3D 两条横轴长度一致，以便不因轴长差异误判两维数据跨度。
11. 作为分析者，我想把纵轴换成 GDPval-AA、Terminal-Bench 4.0、SciCode、HLE、Omniscience 等客观 benchmark，以便从不同能力维度看斩杀线。
12. 作为分析者，我想把纵轴换成 Arena 的 Agent(Overall/Code/Chat/Work) 或 Text Elo，以便用人类偏好双盲结果对照客观评测。
13. 作为读者，我想切指标后图例、tooltip、前沿计数同步更新，以便数字与图形一致。
14. 作为读者，我想某模型在当前指标下缺数据时直接从图中消失，以免留下无法定位的点。
15. 作为读者，我想看任何模型时 tooltip 是深色底白字、含 logo、模型名、四维数值、当前指标值与前沿标记，以便快速读数。
16. 作为读者，我想 Claude 的点/线是 Claude 橙、DeepSeek 是 DeepSeek 蓝——每家一个品牌色且 2D/3D 一致，以便一眼按厂家分组。
17. 作为读者，我想前沿三角面（3D）是墨绿 `#487265` 半透明面，以便与白底、logo 圈风格协调。
18. 作为读者，我想 2D 连线是 `#888` 灰虚线、图例写 "Pareto frontier"，以便与参考仓库视觉语言一致。
19. 作为读者，我想看到"高性价比区"式的区域标注（参考 repo 的 value zone），以便快速定位又便宜又好的模型群。
20. 作为读者，我想图例区分前沿/被斩仅靠连线与面（不靠圈色与大小），以便圈色完全让位给品牌色。
21. 作为读者，我想 Quasar 438B 显示 Multiverse 红色 logo 而非字母兜底，以便图表完整覆盖所有有官方 logo 的模型。
22. 作为读者，我想 Nemotron 3 Ultra 显示 NVIDIA logo（修复当前映射了文件但未内联的 bug），以便数据完整。
23. 作为读者，我想 Apodex 1.1 保留在图中（按 AA 官方榜单来，不删模型），以便与官方榜单口径一致。
24. 作为演示者，我想 tooltip 的 hover 判定在 2D 正交相机下也准确，以便 2D 下也能读数。
25. 作为读者，我想轴/网格/刻度样式与参考仓库一致（轴 `#444`、网格 `#ececec`、白底 `#fafafa`），以便两个产物放在一起像一家人。
26. 作为开发者/后续维护者，我想数据抓取脚本扩展后仍输出 `$TMPDIR/model-killing-line/` 下的中间 JSON，以便重跑构建可复现。

## Implementation Decisions

### 数据层（构建时内联，运行时零网络）

- **模型池**：维持现有 75 行（35 个 base 模型 × effort 档），来源 `artificialanalysis.ai/leaderboards/models` SSR（`scripts/fetch-aa.mjs`）。**不删 Apodex 1.1**，不扩池。
- **每模型新增指标列**（抓取自各模型详情页 SSR 的 `currentModel` 数据块，已验证键名与覆盖）：
  - 客观 6：`intelligenceIndex`（已有）、`gdpvalNormalized`、`terminalBench40`、`scicode`、`hle`、`omniscience`（0–100）。
  - 抓取器：新建 `scripts/fetch-metrics.mjs`，输入 35 个 base slug，输出 `$TMPDIR/model-killing-line/aa-metrics.json`；构建脚本将其中联进 ROWS_RAW。
- **Arena 数据**（抓取自 `arena.ai/leaderboard` SSR，已验证解析方式）：
  - Text 榜（Elo，36 条目，键 `modelKey` + `rating`，条目本身是 effort 级：`claude-opus-5-max-text` 等）。
  - Agent 榜 4 个 category（Overall/Code/Chat/Work，metric = Net Improvement，0–1；条目键 `contenderName` + `score`）。
  - **对齐规则：严格 effort 级对齐**——Arena 条目剥 `-text/-agent` 后缀与 AA 行的 (base, effort) 对齐；对不上的行该指标视为缺失（隐藏），**不做 base 模糊匹配**（避免张冠李戴）。
  - 抓取器：新建 `scripts/fetch-arena.mjs`，输出 `$TMPDIR/model-killing-line/arena-data.json`。
- **指标缺失处理**：切到某指标时，该值为 `null/undefined` 的行直接隐藏（图上、计数、筛选面板计数联动）。
- **logo**：从参考仓库 `logos/` 重取缺失项，新增 Multiverse（`multiversecomputing.svg`，已下载验证）；修复 Nemotron→`nvidialogo.png` 映射了但未内联的 bug。全部 logo 继续 base64 内联，保持双击 file:// 可开。

### 指标切换器（新 seam：`METRICS` 表）

- 底栏 pill 按钮组，11 个指标，当前高亮：
  `Index | GDPval | TBench-4.0 | SciCode | HLE | Omniscience | Arena-Text | Arena-Agent(Overall) | Arena-Agent(Code) | Arena-Agent(Chat) | Arena-Agent(Work)`
- 每个指标项：`{ key, label, dir: +1, unit, get(m) }`；纵轴归一化 `xn.idx`、4D 前沿的 index 维、`killFront` 的 D4 数组全部改为引用 `S.metric` 对应的 getter。
- 切换指标 = `rebuild({keepCamera:true})` + 重算 `DOM.idxMin/idxMax`（按当前指标值域）+ 刷新轴标题/图例/tooltip/state 文案。**相机不动**。
- x/z 轴（cost、tok）不变；speed 轴语义不变（4D 的第四维仍是 tok/s）。

### 前沿与连线

- **3D 前沿**：`killFront` 逻辑不变（4D Pareto ∧ ∈两2D前沿之一），但 index 维用当前指标。三角面颜色 `#1a7f37` → `#487265`（半透明面 + 同色描边）。
- **2D 连线**：废弃现有绿色阶梯线（stair）。改为按视角两维**重算 2D Pareto 前沿**（cost 视角 = cost↓×metric↑；tok 视角 = tok↓×metric↑），画成**直线 polyline + `#888` 灰虚线**（参考 repo connector 样式，dash 5,4）。连线在 3D 视角不显示。
- **前沿/被斩的视觉区分**：圈色、圈粗细、图标大小全部不再编码前沿语义（前沿与被斩圈都是品牌色、大小一致）；区分仅靠 3D 三角面与 2D 前沿连线（"帕累托最优已经连成线/面"）。

### 图标与 slider

- sprite 创建统一 `scale.set(k, k, 1)`，`k = BASE * slider`，`BASE` 为统一基准（原 0.3 档即可），**不再分前沿/普通两档**。
- 底栏新增 `<input type="range" min="0.5" max="3" step="0.05" value="1">`，输入时实时遍历 sprites 更新 scale（不重建世界）。
- slider 只改显示大小，不改 hover 命中（raycaster 对 sprite 命中按当前 scale 自然工作）。

### 筛选面板（DeepSWE 形态）

- 数据结构：`selected` 从 `Set<baseKey>` 改为 `Map<baseKey, Set<effort>>`（或等效）。
- UI：底栏 `⚙ Configs (n/m)` 按钮 → 点击弹 popover（绝对定位在按钮上方）：
  - 每行：三态 checkbox（全选 ✓ / 部分 − / 全不选 空，点击循环）+ 模型名 + 右侧 `n/m`。
  - 行内 effort chips：该模型出现的档位（如 LOW MEDIUM HIGH XHIGH MAX），选中 = 深色实心、未选 = 描边空心；点击单独 toggle。
  - 底部 `Select all` / `Clear`。
  - 任何勾选变化 → `rebuild({keepCamera:true})`。
- 左上角旧 `#cfg` 面板删除。

### 相机保持（统一规则）

- `rebuild({keepCamera:true})` 用于：effort 筛选变化、log/linear 切换、指标切换。
- 3D：不 touch `camera` / `controls`；2D：不 touch `orthoZoom/panX/panY`。
- 只有显式点视角按钮（3D / Cost / Token）才 `applyView`（带飞行动画）。

### 轴等长

- `W = { w: 10, h: 10, d: 5 }`（x 与 z 域宽一致）；`frame2D` 的 `horiz` 相应适配。刻度定位仍按各自 `xn.cost/xn.tok` 归一化，数值标注不变。

### 品牌（1 品牌 1 色，2D/3D 一致）

| 厂商 | 色 | 来源 |
|---|---|---|
| Anthropic | `#D97757` | 官网 CSS（确认） |
| OpenAI | `#10A37F` | 人为指定（官方黑白，取 ChatGPT 绿） |
| Google | `#4285F4` | DeepMind 页 logo fill |
| xAI | `#555555` | 人为指定（官方黑白） |
| DeepSeek | `#4D6BFE` | AA logo fill（用户指定"DeepSeek 蓝"） |
| Qwen/Alibaba | `#615CED` | qwen 官网 theme-color |
| Z.ai/GLM | `#1F63EC` | 人为指定（官方黑白，取其 logo 库内定义色） |
| Kimi | `#72b7b2` | 人为指定（官方黑白） |
| Xiaomi | `#FF6900` | AA logo fill |
| Tencent | `#0052D9` | AA logo fill |
| Meta | `#0668E1` | 官方品牌色 |
| StepFun | `#00A9FF` | 官网 CSS `--color-signal-blue` |
| NVIDIA | `#76B900` | AA logo fill |
| MiniMax | `#E2167E` | AA logo fill（渐变品红端，避让小米橙） |
| Multiverse | `#F01438` | 官方 logo SVG fill |
| Apodex | `#7428ED` | 官网 hero 词标渐变（置信中，官方 CSS 主色 `#355070` 备选） |
| Thinking Machines | `#9d7660` | 参考 repo CREATOR_COLORS 兜底 |

- 应用范围：sprite 圈描边色、effort 连线色（原米色 `#b0a48a` 整条废弃）、图例、tooltip logo 描边。撞色（六蓝紫系）按已确认决策接受真色。

### 风格 token（对齐参考 repo）

- 背景 `#fafafa`（页面）/ `#ffffff`（卡）；轴/刻度字 `#444`/`#555`；网格 `#ececec`；tooltip 深色 `rgba(20,20,28,.95)` 圆角白字（含 logo 32px 圆 + 名称 + 指标行）；底栏按钮改 pill 圆角样式（参考 `.tab`：radius 20px、border `#ddd`、hover 淡底）；选中态用 `#2f9e44` 类绿或品牌绿。
- 图例样式对齐参考（小圆点 + 22px 线段样例 + 10px 灰字）。
- "高性价比区"：3D 底面画 `#8caa5e` 10% 半透明矩形 + 虚线描边 + 角标文字（阈值按当前指标定：cost < $1 且 metric ≥ 中位数，构建时算出），2D 对应视角同样叠加。
- 保留原型独有：3D 三角面、飞行过渡、正交 2D 相机。

### Testing Decisions

- **外部行为验证，全部走浏览器实测**（复用 handoff 里的流程：`npx http-server -p 8931` + `playwright-cli`，禁 file://）：
  1. 视角矩阵：3D / cost-2D / tok-2D 各截图，检查 2D 只出现本视角前沿连线（灰虚线）、无第三轴、图标等大。
  2. 相机不变性：3D 下手动转一个角度 → 开筛选面板勾掉一个 effort → 截图对比相机未动；2D 下 pan+zoom 后切 log/linear → 取景不变。
  3. 指标切换：依次点 11 个 pill，每个截图检查轴标题、计数、前沿变化；抽查 GDPval 与 Arena-Text 的隐藏模型数与预期一致。
  4. 筛选面板：三态 checkbox 循环、chip 单独增减、Select all/Clear、`Configs (n/m)` 计数与 DeepSWE 行为一致（对照其截图）。
  5. 轴等长：3D 截图量测两条横轴像素长度一致。
  6. 品牌：抽查 Claude 橙 / DeepSeek 蓝 / Multiverse 红的圈与连线颜色；Quasar、Nemotron、Apodex logo 渲染正确。
  7. 每步后查 `window.__errs2` 无 JS 错误。
- 无单元测试设施；以截图对照（参考 repo SVG、DeepSWE 面板截图）为验收基线。

### Out of Scope

- 模型池扩展（AA 全量 673 或 OpenRouter Top 30）。
- 单 benchmark 细分切换器（MMMU-Pro、TAU2-Banking、ITBench 等，数据覆盖不全）。
- Arena WebDev 榜、Image/Video 榜。
- `gen-html.mjs` 静态图表产物同步改造（本次只动 prototype）。
- 移动端适配。
- 任何数据持久化（URL hash、localStorage）。

### Further Notes

- **logp**：用户提到"logp 在 AA 官网是有的"。已在 AA `models` 页（60 个 tab 全枚举）与模型详情页数据块（约 60 个指标键全枚举）中检索，**未发现 logp / Log Probability 指标**；最接近的是价格图 "Intelligence Index vs. Price (Log, Inverted)" 的对数轴与各 benchmark 的 Elo。若用户指认具体页面，可将该指标追加为第 12 个切换项（`METRICS` 表加一行即可）。
- DeepSWE 面板行为已实测为对齐基线：chip 点击实时改 `Configs (57/70)→(56/70)` 计数、图表联动、checkbox 三态。
- 撞色已知：DeepSeek/Google/Meta/Tencent/StepFun/Qwen 六家蓝紫系；按用户决策保持官方真色。
- 图例不再需要"前沿绿/被斩灰"两行（语义改由面/线承担），但保留"effort 连线"与"2D Pareto frontier"两行，改品牌中性灰。
- 参考仓库 anchor 文件：`render-aa.mjs`（connector 画法 L143-144、CREATOR_COLORS L74-79、高效区 L121-123、logo 圈 LOGO_RING `#487265` L87）、`gen-html.mjs`（tooltip 深色 L233-259、pill `.tab` L289、EFFORT_COLOR L174）。
- 构建流程：`fetch-metrics.mjs` / `fetch-arena.mjs` 产出中间 JSON 后，由一个小型内联脚本（或手工一次性）合并进 HTML 的 `ROWS_RAW`/新增 `METRICS_DATA` 常量；重跑可复现，产物双击 file:// 仍可直接打开。
