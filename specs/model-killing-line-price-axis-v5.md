# model-killing-line 4D 视觉 v5 — token 价格轴 + 刻度修复 + hover 辅助线

## Problem Statement

用户在 4D 模型杀线图上无法回答"这个模型到底花多少钱"的问题：

1. cost 轴当前用的是 AA 的 **Cost per Task（$/任务）**，这不是用户想要的价格语义。用户关心的是 **token 单价**（$/M tokens）：输入价、输出价、缓存命中价。榜单页面抓取的数据里根本没有这些字段。
2. log 坐标轴刻度是硬编码候选数组过滤，密度过稀：tok 轴 20k 以下完全没有刻度，20k 以上只有零星几个，轴上限落在候选间隙时高位也空。
3. hover 某个模型时，只能靠 tooltip 读数，图上没有视觉辅助把点的坐标"投影"到轴上，读不出该点在各轴的位置。

## Solution

1. 新增价格抓取管线：从 AA `/models` 列表页 SSR flight 数据提取三价（`price1mInputTokens` / `price1mOutputTokens` / `cacheHitPrice`，均 $/M tok），列表页缺失的模型回退抓单模型详情页。三价内联进页面 `ROWS_RAW`。
2. cost 轴改为四模式可切换：**综合 / 输入 / 输出 / 缓存命中**，底部 bar 新增四个独立 pill，与指标切换器同款交互。切换后 cost 维整体替换（点、4D 主前沿、2D cost×metric 虚线、轴标题、tooltip 全部联动重算），tok / perf 轴不动。
3. 全部 log 轴刻度改为程序化 1-2-5 生成，轴 domain 上限取整到下一个 1-2-5 刻度。
4. hover 模型时绘制辅助虚线：2D 单根垂直虚线指向当前视图横轴；3D 三根虚线 = 三面垂足（floor + 两墙投影）；同模型全部 effort 点成组各画各的。

## User Stories

1. 作为模型选型者，我想让 cost 轴显示 token 单价（$/M tok）而非 cost per task，以便价格与我的实际用量结构对齐。
2. 作为模型选型者，我想看**综合价格**（按 token 构成加权：4.3% 输入 + 0.7% 输出 + 95% 缓存命中），以便用贴近真实 Agent 工作负载的价格比较模型。
3. 作为重度缓存用户，我想把 cost 轴切到**缓存命中价**，以便比较各家缓存读价的差距。
4. 作为 API 直连用户，我想切到**输入价**或**输出价**，以便按单侧流量结构比较。
5. 作为页面使用者，我想通过底部 bar 的四个 pill 在四种价格模式间一键切换，以便快速往返对比。
6. 作为页面使用者，我想在切换价格模式后看到 Pareto 前沿按新价格重算，以便前沿结论始终与当前价格口径一致。
7. 作为页面使用者，我想在 tooltip 里看到当前模式价格 + 三价明细，以便核对单个模型的价格构成。
8. 作为页面使用者，我想让 cost 轴标题随模式改名（如 `Cost ($/M tok · 综合)`），以便任何时候都明确当前口径。
9. 作为页面使用者，我想让 log 轴刻度自动铺满数据域，以便低价位模型（$0.01 量级）也有可读的刻度。
10. 作为页面使用者，我想让 tok 轴上限取整到下一个整刻度，以便刻度不被截在轴顶。
11. 作为页面使用者，我想在 hover 模型时看到垂直虚线把点投影到当前横轴（cost 或 tok，跟随 2D 视图），以便目测读出该点的横坐标。
12. 作为 3D 视图使用者，我想在 hover 时看到三根虚线指向三个投影面（三面垂足），以便目测读出三个坐标。
13. 作为页面使用者，我想让同模型各 effort 档的点都有各自的辅助线（成组），以便与 effort 连线的成组语义一致。
14. 作为页面使用者，我想让辅助线在移开后消失、恢复默认视图，以便不打扰浏览。
15. 作为页面使用者，我想让辅助线使用该模型自己的品牌色，以便一眼对应是哪个模型的投影。

## Implementation Decisions

- **价格数据源**：AA `/models` 列表页（Next.js SSR，RSC flight 数据 `self.__next_f.push` 内嵌 JSON），键 `price1mInputTokens` / `price1mOutputTokens` / `cacheHitPrice`（均 $/M tok），另有 `cacheHitDiscountPercent`（交叉验证用，不落数据）。无公开 JSON API，SSR HTML 是唯一来源。
- **同模型各 effort 价格相同**（用户确认）：价格按 slug（剥 effort 后缀）归一，不做 slug+effort 匹配。
- **综合价公式**（用户指定权重）：`blended = 0.043×input + 0.0007×output + 0.95×cache_hit`。
- **管线**：新增 fetch-prices 脚本（与 fetch-aa 同款 SSR 抓取手法，温和限速），产物 `aa-prices.json`：`{ "<base slug>": {input, output, cacheHit}, ... }`；build-proto 按 slug 归一把三价 + blended 写进 `ROWS_RAW` 每行（字段建议 `pin`/`pout`/`pcache`/`pblend`）。变体全名 → slug 复用 fetch-metrics 的 slugOf 规则再剥 effort。
- **原 cost per task 字段**：`ROWS_RAW.cost` 数据字段与管线解析保留不动，但 UI 全部改用当前价格模式值；tooltip 不再显示 `/task`。MODELS 过滤条件中的 `m.cost > 0` 相应改为对当前价格维的正值校验（价格缺失行隐藏，与 tok 缺测同策略）。
- **价格模式状态**：`S.priceMode ∈ {blend, in, out, cache}`，默认 `blend`。
- **cost 维取值**：新增 `costOf(m) = S.priceMode 对应字段`，替换所有原 `m.cost` 取值点：值域 DOM（costMax/costMin）、log/linear 投影 xn.cost、toWorld、killFront 的 4D 与 2D 前沿判定、effort 连线排序、tooltip。切换 → `rebuild({keepCamera:true})`。
- **切换控件**：底部 bar 指标 pill 组前插入 `sep` + 四 pill：`综合`/`输入`/`输出`/`缓存`，`mkBtn` + `data-price` + `.on` 高亮，复用指标切换器的 toggle 模式。
- **轴标题**：cost 轴标题改为 `` Cost $/M tok · {综合|输入|输出|缓存} ← log/线性（原点最贵 → 远端 $0） ``。
- **tooltip**：价格行显示当前模式价 + 三价明细（`in $x · out $y · cache $z $/M tok`），替代原 `${fmtCost(m.cost)}/task`。
- **log 刻度程序化**：新函数 `logTicks(min, max)`：在覆盖 [min, max] 的 decade 内生成 1-2-5×10^k 序列，过滤到值域内。替换 cost/tok 两个硬编码候选数组（线性分支保持现状逻辑）。同时应用于其他 log 轴若后续新增。
- **domain 上限取整**：tok 值域 tokMax 取整到下一个 1-2-5 刻度（如 27.2k → 30k）；costMax 同规则。costMin/tokMin 的 headroom 规则不变。
- **hover 辅助线**：
  - 数据：`buildWorld` 返回值新增 `helperLines`（一个 `THREE.Group`，初始不可见）。
  - 触发：mousemove 命中 sprite 时重建辅助线内容并显示；未命中时隐藏。与 highlightEffort 同生命周期。
  - 2D：从命中点世界坐标画垂直虚线到 x=0 平面（cost 视图到 cost 轴、tok 视图到 tok 轴），颜色 = `creatorColor(m.creator)`，`LineDashedMaterial` + `computeLineDistances`。
  - 3D：三根虚线，从点 (x,y,z) 分别到 (0,y,z)、(x,0,z)、(x,y,0) 三个垂足面——即投影到 cost 轴、tok 轴、metric 轴三个刻度面。
  - 成组：同模型（baseKey 相同）全部 effort 点各画各的辅助线。
  - hover 虚化联动：辅助线加入命中组语义（保持原 opacity，不参与压暗）。
- **tick 数字格式**：log 新刻度复用 `fmtCost`/`fmtTok`。

## Testing Decisions

- 本原型无自动化测试设施；测试 = 管线冒烟 + playwright-cli 浏览器实测（有头 persistent，本地 http-server）。
- 管线测试：fetch-prices 真跑，验证 74 变体全部拿到三价（缺失清单打印）；build-proto 后 grep ROWS_RAW 首行含四价字段。
- 浏览器断言（全局变量 `S`/`world`/`MODELS` 可 eval）：
  - 四 pill 存在，点击后 `S.priceMode` 变化、`world.rows` 点位 x 坐标变化、前沿集合重算（`world.front.length` 变化或节点变化）。
  - 综合价数值抽查：某模型 `pblend ≈ 0.043×pin + 0.0007×pout + 0.95×pcache`。
  - log 刻度：tok 轴 sprite 数量 ≥ 5 且覆盖 20k 以下 decade；上限为 1-2-5 整刻度。
  - hover：eval `highlightEffort(baseKey)` 后 helper group visible=true 且 2D 有 1 根线 / 3D 有 3 根 × effort 数；移出后 visible=false。
  - console error 仅 favicon 404。
- 回归点（v4 已修，勿破坏）：tok 缺测置 null 行为、归一化纵轴 0–100、hover 虚化 baseOp 捕获、刻度防裁剪。

## Out of Scope

- cost per task 模式不保留 UI 切换入口（数据字段保留在管线中）。
- 价格历史/多价格源（OpenRouter、LiteLLM 等）——AA 单一数据源。
- cache write 价、图片价等未列入四模式的价格维度。
- 3D/2D 之外的辅助线（如 1D 图例视图）。
- 轴 scale 切换按钮的表驱动重构（v3 遗留低优先项）。

## Further Notes

- 非 git 仓库：改动直接落工作区，无法提交。
- build-proto 原地改写 HTML：mock 数据测试后必须真数据重跑（v4 教训）。
- flight 解析无版本保证：正则提取失败时按 fetch-aa 惯例抛错重查 markup，不做静默兜底。
- 列表页只内嵌 ~25 个带价模型对象，74 变体中缺的逐个回退抓详情页（同结构 flight 数据），已验证详情页含三价。
