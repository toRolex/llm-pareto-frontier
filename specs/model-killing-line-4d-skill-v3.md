# Spec — 斩杀线 skill v3：4D 原型升格为唯一标准产出（删高性价比区 · 前沿发光线 · effort 连线 hover · 性能归一化切换）

Status: ready-for-agent（无 issue tracker，本文件即 spec 源）
日期：2026-09-27
对象：`.agents/skills/model-killing-line/`（`prototype-4d-3d.html` + `scripts/` + `SKILL.md`）
前置：`specs/model-killing-line-4d-prototype-v2.md`（已交付；本 spec 建立在其产物之上）

---

## Problem Statement

用户已把 skill 改造成 4D 多维度原型（v2 交付），但 skill 的**标准产出仍是旧 2D 静态页**：跑完管线生成的是 `index.html`（三榜 SVG + 表格），4D 原型反而是游离在核心循环之外的"额外产物"。用户的目标是反过来——**以后使用这个 skill 就应该生成 4D 多维度版本**，2D 版本退役。

在此过程中还暴露四项具体问题：

1. **高性价比区显示不对**。原型 3D 里那块「cost < $1 且当前指标 ≥ 中位数」的 `#8caa5e` 半透明平面，阈值是拍脑袋的硬编码，与 Pareto 前沿体系的语义重复且容易误导读者——去掉。
2. **2D 视角的帕累托前沿虚线不够明显**。`#888` 灰虚线（dashSize 0.22 / gapSize 0.18）在白底上存在感太弱，读者扫一眼抓不到"斩杀线"在哪——换一种更醒目的画法。
3. **同模型不同 effort 档的连线没有交互**。原型已按 baseKey 分组画了品牌色连线，但鼠标移到组内任何一个点上，连线毫无反应——用户希望 hover 时该模型的整条 effort 连线变粗、从背景里跳出来，从而看清"同一模型各档位的性价比走势"。
4. **性能轴只有绝对值一种读法**。x 轴（Cost）和 z 轴（Tok）都有 `log ↔ 线性` 切换按钮，但纵轴（性能指标）没有对应切换；用户想让性能数值可以在**正常（绝对值）和归一化（以最强者为 100）**之间切换，以便横向比较各指标的相对差距。

## Solution

把 skill 的核心循环整体切换到 4D 链路：`fetch-aa → fetch-metrics → fetch-arena → build-proto → open`，2D 静态图表管线（`gen-html.mjs` 及其依赖）删除，SKILL.md 重写为 4D 版叙事。原型上做四处改进：高性价比区整体移除；2D 前沿连线换成双层发光线；effort 连线接入 hover 高亮（本组变粗提亮、他组淡出）；底栏新增第三颗轴切换按钮 `Perf: 绝对值 ↔ 归一`（归一 = 该指标当前可见行的最大值记 100）。解读环节保留——4D 页面新增解读区，SKILL.md 保留「LLM 每次现看现写」流程与撰写原则。

## User Stories

### 产出形态（skill 行为）

1. 作为 skill 使用者，我想跑一遍 skill 管线后直接得到 4D 多维度交互页面，以便不再需要辨认两套产物的关系。
2. 作为 skill 使用者，我想管线自动打开浏览器展示 4D 页面，以便少敲一次命令。
3. 作为 skill 维护者，我想旧 2D 管线脚本从仓库里删干净，以便后人不会误用已退役的链路。
4. 作为 skill 维护者，我想 SKILL.md 与实际管线一一对应（命令序列、产物、阈值、交互说明），以便 agent 下次调用时不被过时文档误导。
5. 作为 skill 维护者，我想 SKILL.md 保留「解读由 LLM 现看现写」的流程与撰写原则，以便每次生成的页面都有新鲜解读而非模板复用。
6. 作为 skill 用户，我想在 4D 页面上读到本次数据的解读（📌 太长不看开头 + 各维度分析），以便打开页面即获得结论。

### 高性价比区移除

7. 作为读者，我想 3D 视角里不再出现那块 `#8caa5e` 半透明"高性价比区"平面（含描边和角标文字），以便不被一个拍脑袋阈值干扰对 Pareto 前沿的注意力。
8. 作为读者，我想切到 2D 视角时也不残留该区域的任何痕迹，以便任何视角下"又便宜又好"的唯一判据都是前沿本身。
9. 作为读者，我想图例里不再出现高性价比区相关条目（v2 图例本就没有它，保持不再新增），以便图例与图面一致。

### 2D 前沿连线（双层发光线）

10. 作为读者，我想 2D 视角下的帕累托前沿是一条一眼可见的醒目连线（底层半透明光晕 + 上层实线的双层结构，墨绿 `#487265` 系），以便不用找就能锁定斩杀线走向。
11. 作为读者，我想 cost 视角与 tok 视角的两条前沿线都用同样的双层发光样式，以便两个 2D 视角视觉语言一致。
12. 作为读者，我想图例里的前沿连线样例同步换成新样式，以便图例与图面一致。
13. 作为读者，我想 3D 视角下仍隐藏 2D 前沿连线（维持现状），以便 3D 里由三角面承担前沿语义、不重复。

### effort 连线 hover 交互

14. 作为分析者，我想鼠标移到某模型组内任一点（含前沿与非前沿 sprite）时，该模型整条 effort 连线变粗且不透明度升到 1，以便立刻看清这个模型各 effort 档的性价比走势。
15. 作为分析者，我想 hover 时其他模型的连线淡出到接近消失（约 0.15 不透明度），以便视觉焦点只留在当前模型组。
16. 作为分析者，我想鼠标移出后所有连线恢复默认态（品牌色、原不透明度），以便反复对比不同模型。
17. 作为分析者，我想 hover 连线高亮与现有 tooltip（logo + 模型名 + 指标 + cost/tok + 🔪 前沿标记）同时工作互不干扰，以便读数与看线一举两得。
18. 作为演示者，我想在 2D 视角下 hover 高亮同样生效，以便 2D 演示时也能逐模型讲解。
19. 作为读者，我想单点模型（组内只有一档、无连线）hover 时不受影响，以便不出现悬空的高亮状态。

### 性能轴归一化切换

20. 作为分析者，我想底栏有一颗 `Perf: 绝对值 ↔ Perf: 归一` 按钮（与 Cost/Tok 切换并排同风格），以便三根轴的读法都能按需切换。
21. 作为读者，我想页面打开时性能轴默认是绝对值（原始分：Index 0–100、Arena Elo ~1500 等），以便先看到熟悉的原始量纲。
22. 作为分析者，我想切到归一化时，当前指标下最强模型记 100、其余按 `value / max × 100` 线性缩放，以便一眼看出"离最强还差几成"。
23. 作为分析者，我想归一化按**每个指标独立**计算（切到 Arena-Text 归一的是 Elo 最大值，切到 TBench 归一的是 Accuracy 最大值），以便跨指标切换时语义始终正确。
24. 作为分析者，我想归一化的 max 取当前**可见行**的最大值（受筛选影响），以便筛选到子集后相对差距仍然可读。
25. 作为读者，我想切归一化后 y 轴刻度、轴标题、图面点位同步重投影（相机保持不动，沿用 v2 的 keepCamera 规则），以便切换过程无眩晕。
26. 作为读者，我想 tooltip 里同时显示原始值与归一化值（归一态下），以便看相对位置时不忘绝对水平。
27. 作为分析者，我想归一化切换不改变 Pareto 前沿的判定结果（线性单调变换不改变支配关系），以便 4D 三角面、2D 连线、🔪 标记在两种读法下完全一致。
28. 作为读者，我想切归一化后 y 轴标题注明"归一"字样（如 `Intelligence Index ↑（归一，最强=100）`），以免误读刻度。

### 数据管线

29. 作为 skill 维护者，我想保留 `fetch-aa.mjs`（它产出的变体名单是 `fetch-metrics.mjs` 的输入），以便新链路依赖完整。
30. 作为 skill 维护者，我想退役脚本的删除不影响 `build-proto.mjs` 的幂等注入行为，以便重跑构建始终可复现。

## Implementation Decisions

### 产出形态与管线（seam 确认）

- **唯一 seam 沿用 v2 已确立的两处，不新建 seam**：
  1. **构建期数据 seam**：`$TMPDIR/model-killing-line/` 下的中间 JSON（`aa-data.json` / `aa-metrics.json` / `arena-data.json`）→ `build-proto.mjs` 幂等内联进 `prototype-4d-3d.html` 的 `METRICS_DATA` / `ARENA_DATA` / `LOGOS` 常量。
  2. **运行时指标 seam**：原型内已有的 `METRICS` 表（`{ key, label, dir, unit, get(m) }`）——性能归一化切换的所有取值路径都收敛到这张表，不另开旁路。
- 新核心循环：`fetch-aa.mjs → fetch-metrics.mjs → fetch-arena.mjs → build-proto.mjs → open.mjs`。
- **退役删除名单**：`gen-html.mjs`、`render.mjs`、`render-aa.mjs`、`render-tb.mjs`、`fetch.mjs`、`fetch-tb.mjs`、`fetch-openrouter.mjs`、`find-top-missing.mjs`、`fuse.mjs`、`openrouter.mjs`、`logos.mjs`。原型不依赖其中任何一个（原型有自己的 `logoOf` + 内联 `LOGOS`）。
- **保留**：`fetch-aa.mjs`（`fetch-metrics.mjs` 依赖其 `aa-data.json` 的 model 列作变体名单输入）、`fetch-metrics.mjs`、`fetch-arena.mjs`、`build-proto.mjs`、`open.mjs`。
- `open.mjs` 改为打开 `prototype-4d-3d.html`（当前只认 `$TMPDIR/model-killing-line/index.html`，该文件随 2D 管线消失；不存在时给出"先跑 build-proto"的提示文案同步更新）。

### 原型改动一：高性价比区整体移除

- 删除 `buildWorld()` 内高性价比区块：中位数阈值计算、`#8caa5e` 半透明平面 Mesh、同色描边 Line、角标 textSprite（含 `userData.axis = "both"`）。
- 无图例项、无其他视角残留——该区块是唯一实现，删除即净。

### 原型改动二：2D 前沿连线换双层发光线

- 替换现有单条 `LineDashedMaterial`（`#888`，dashSize 0.22 / gapSize 0.18）为**每条线两个 Line 对象**：
  - 底层光晕：同路径实线，宽的等效实现（见下），低不透明度（≈0.2）浅色（`#487265` 的淡色变体）；
  - 上层芯线：同路径实线，`#487265`，全不透明度。
- WebGL 下 `linewidth` 在多数平台恒为 1，"粗"用**同路径双线偏移**（沿屏幕空间法线复制两条错位线）或引入 `Line2`/`LineMaterial`（three.js examples 的 fat-line）实现——实现期按原型现有 three.js 引入方式（`prototype-assets/` 本地文件）择一，优先不新增依赖则用偏移方案。
- 现两条前沿线共用同一材质实例——改为每线独立材质（clone），避免改样式互相污染。
- 可见性规则不变：`S.view` 为 cost/tok 2D 时显示对应线，3D 隐藏（`applyView` / `rebuild` 的现有开关逻辑）。
- 图例「Pareto frontier（2D 前沿连线）」行的线样例样式同步更新。

### 原型改动三：effort 连线 hover 高亮

- 连线创建时保留引用：`world.effortLines = Map<baseKey, THREE.Line[]>`（每组的双层/偏移线都收进去），每条线 `userData.baseKey`。
- 现有 Raycaster hover（只测 `world.sprites`）扩展：命中 sprite 时取 `baseKey(m.model)`，遍历 `world.effortLines`：
  - 命中组：不透明度 → 1，粗细档位升一档（偏移线间距或 Line2 宽度调大）；
  - 其他组：不透明度 → 0.15；
  - 无命中 / 移出：全部恢复默认（品牌色 0.55）。
- "变粗"的实现与前沿线同方案（偏移或 fat-line），不依赖不可靠的 `linewidth`。
- tooltip 逻辑、定位（屏幕坐标 + 边界收敛）完全复用，不改。

### 原型改动四：性能归一化切换

- 状态：`S` 增加一个字段（如 `perfScale: "abs" | "norm"`），默认 `"abs"`。
- 底栏第三颗切换按钮，样式与 Cost/Tok 按钮同构：点击翻转状态、更新按钮文案（`Perf: 绝对值` ↔ `Perf: 归一`）、`rebuild({ keepCamera: true })`。
- 归一化定义：`norm(v) = v / max(可见行该指标值) × 100`；max 在每次 rebuild 时按当前筛选后的可见行现算，**每个 metric 独立**。
- 收敛到 `METRICS` 表实现：表的每项 `get(m)` 返回原始值不变，新增统一的归一化应用层——y 轴值域计算（`DOM.idxMin/idxMax`）、`xn.idx`、`toWorld` 的纵轴投影、tooltip 显示全部经由该层；`xn.cost` / `xn.tok` 不受影响。
- Arena 指标（`arenaOf`，不经 `metricsOf`）与直取的 `m.index` 同样过归一化层——三条取值路径（`metricsOf` scale / `arenaOf` / `index` 直取）一个都不漏。
- Pareto/前沿判定（`killFront`、`pareto`）继续用原始 `val` 比较——线性归一不改支配关系，判定结果与按钮状态无关（代码上也不让它们耦合）。
- 轴标题追加归一标注；tooltip 在归一态显示「原始值 + 归一值」双读数，绝对态维持现状。

### SKILL.md 重写

- 全文按 `/writing-for-agents` 规范重写（skill 文档写给未来的 agent 读：零参数、命令即接口、失败信号显式）。
- 2D 管线章节（①②③三榜阈值句、fetch/render/gen-html/find-top-missing/fuse/openrouter/logos 的逐脚本说明、旧 Thresholds、旧 Completion criteria）**随脚本删除而删除，不恢复其中被污染的阈值数字**（污染点：`cost < Tokens`、`per.5`、注入 URL 乱文、`Task还有Output.3k`——均属退役章节，无需修复）。
- 4D 章节扩写为完整核心循环：新命令序列、产物路径、11 指标切换、视角矩阵、高性价比区（已删除，不再提）、2D 发光前沿线、effort 连线 hover、性能归一化切换、解读区。
- 「解读：LLM 实时撰写」章节整体保留（撰写原则四条原样迁移），补一句解读区在 4D 页面中的位置说明。

### 页面解读区

- 4D 页面新增解读容器（canvas 下方或侧栏，随实现取更协调者），构建时留空位；SKILL.md 流程约定 LLM 写好 HTML 片段后经 build-proto 或直接编辑注入（注入方式实现期定，保持产物单文件、双击 file:// 可开）。

## Testing Decisions

- **全部走浏览器实测**（沿用 v2 的既定流程：本地起 http-server + playwright-cli 有头模式，禁 file:// 直测），每步后查 `window.__errs2` 无 JS 错误：
  1. **高性价比区移除**：3D / cost-2D / tok-2D 三视角截图，确认 `#8caa5e` 平面、描边、角标在任一视角都不出现。
  2. **前沿发光线**：两个 2D 视角截图，确认双层发光线可见且明显强于旧灰虚线；图例样例同步；3D 下不显示。
  3. **effort 连线 hover**：hover 多档模型（如 Astra 组）任一 sprite 截图——本组线变粗提亮、他组线淡出；移出恢复；hover 单点模型无异常；tooltip 与高亮并存。
  4. **归一化切换**：默认绝对值打开 → 点按钮切归一 → 截图对比 y 轴刻度（顶部应为 100 = 最强者）、按钮文案、轴标题；抽查两个指标的 max 模型归一值 ≈ 100；筛选掉最强模型后 max 应重算；切回绝对值恢复原始刻度；相机在整个过程中不动。
  5. **回归**：视角切换、指标切换、筛选面板、icon slider 等 v2 已交付行为抽查不回归。
  6. **管线端到端**：跑完整命令序列 → 产物双击 file:// 可直接打开（单文件自足）→ `open.mjs` 打开的是 4D 页面。
- 无单元测试设施；以截图对照 + 控制台零错误为验收基线（与 v2 相同）。

## Out of Scope

- 4D 前沿三角面、effort 连线本身的分组/配色逻辑重构（v2 已定品牌色方案，本次只加交互不改语义）。
- 3D 视角下前沿的"发光化"（三角面已承担 3D 前沿语义，本次只动 2D 连线）。
- 解读内容自动生成（解读永远由 LLM 每次现看现写，脚本不写文案）。
- 移动端适配、数据持久化（URL hash / localStorage）。
- 模型池扩展、单 benchmark 细分切换器、Arena 其他榜（v2 的 Out of Scope 原样延续）。
- 被删 2D 管线的历史语义修复（被污染的 SKILL.md 阈值数字随章节一起退役，不做抢救性恢复）。

## Further Notes

- 退役名单中 `logos.mjs` 曾在探查时被标为"可能复用"，已核实**原型不依赖它**（原型用自带的 `logoOf()` + 内联 `LOGOS`，文件名体系与 `logos.mjs` 的 `PREFIX_LOGO` 不通用）——放心删。
- `fetch-metrics.mjs` 限速 300ms、失败 `exitCode = 2`；`fetch-arena.mjs` 走 curl 子进程绕 403——这些既有限制说明在重写 SKILL.md 时原样保留进 4D 章节。
- 归一化与 log 切换的关系：归一化作用于 y 轴数值语义，Cost/Tok 的 log/linear 作用于 x/z 轴刻度分布，三者正交、可任意组合（如 `Cost: log + Tok: 线性 + Perf: 归一` 是合法状态）。
- 参考仓库 anchor：`render-aa.mjs` 的 connector 画法与 `LOGO_RING #487265`（发光线配色锚点）、`gen-html.mjs` 的 tooltip 结构（hover 改动不复用其代码，仅风格参照）。
- v2 spec（`model-killing-line-4d-prototype-v2.md`）已交付完毕，其中"高性价比区"一条（其 user story 19）由本 spec 显式推翻——以本 spec 为准。
