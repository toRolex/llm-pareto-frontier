# Cost 核查报告 2：Anthropic 块（Claude Opus 5.5 / Sonnet 5.5 / Fable 5.1 / 4.5 Haiku）

核查人：独立 worker 2（Anthropic 块）。只读核查，未修改任何数据文件。
核查日期：2026-10-08（本机会话日期）。
核查对象：`prototype-4d-3d.html` 的 `ROWS_RAW` 与 `SUBSCRIPTION_PRICING_RUNTIME` Anthropic 块（约 1253-1269 行）、`scripts/pricing-model.mjs`。

来源清单（本次实际抓取/搜索）：
- Anthropic 官方：https://www.anthropic.com/claude-opus-5-5 （2026-09-22 发布，含完整价目表）
- Anthropic 官方：https://www.anthropic.com/claude-sonnet-5-5 （2026-09-28 发布，含完整价目表）
- Anthropic 官方：https://www.anthropic.com/claude-fable-and-mythos-5-1 （搜索摘要）
- SemiAnalysis：https://newsletter.semianalysis.com/p/anthropic-subscriptions-offer-5x （全文抓取；倍率表主体为图片，正文含关键数字）
- OrcaRouter 转述（引用 SemiAnalysis 2026-10-05 表格的完整数字）：https://www.orcarouter.ai/blog/claude-opus-5-5-vs-gpt-6-1-sol-subscription-value （2026-10-06）
- 第三方佐证：caylent.com（2025-10-15）、doit.com（2026-05-12）、omidsaffari.com（2026-09-02）、cloudzero.com（2026-09-11）、ayautomate.com

---

## 1. Claude Opus 5.5（max / xhigh / high / medium / low，全 effort）

页面现值（ROWS_RAW，5 个 effort 变体全部一致）：pin=$4、pout=$20、pcache=$0.20、pcacheWrite=$5；pblend=$0.3994/M tok。

核查值（Anthropic 官方 Opus 5.5 发布页价目表）：Cache reads $0.20、Input $4、Output $20、Cache writes $5。官方原文："Input and output tokens are $4 and $20 per million, 20% less than Opus 5. Cache reads … are $0.20 per million tokens, 60% less than Opus 5."

来源：https://www.anthropic.com/claude-opus-5-5 （2026-09-22）。

判定：**正确**。四项单价逐一吻合；cacheWrite 恰为 1.25×input，与页面折算规则声明一致。pblend 复算：4×0.004 + 0.20×0.967 + 5×0.026 + 20×0.003 = 0.3994，与 DEFAULT_MIX 自洽。

effort 一致性：5 档 effort 单价完全相同。判定正确（官方定价不随 effort 变化）。

## 2. Claude Sonnet 5.5（max / xhigh / high / medium / low，全 effort）

页面现值：pin=$2、pout=$10、pcache=$0.20、pcacheWrite=$2.50；pblend=$0.2964/M tok。

核查值（Anthropic 官方 Sonnet 5.5 发布页价目表）：Cache reads $0.20、Cache writes $2.50、Input $2、Output $10。官方原文："Sonnet 5.5 is priced the same as Sonnet 5 at $2 per million input tokens, $10 per million output tokens, and $0.20 per million tokens for cache reads."

来源：https://www.anthropic.com/claude-sonnet-5-5 （2026-09-28）。
旁注：OpenRouter 与 AWS Bedrock 页显示 "Starting October 7, Sonnet 5.5 cache read pricing is reduced by 50%"（即 10 月 7 日起 cache read 降至 $0.10）。页面取的是发布时官方价 $0.20，与 sourceDate 2026-09-29 快照口径一致，不算错，但属时效性风险。

判定：**正确**。pblend 复算 = 0.2964，自洽。

effort 一致性：5 档 effort 单价完全相同。判定正确。

## 3. Claude Fable 5.1（max / xhigh / high / medium / low，全 effort）

页面现值：pin=$10、pout=$50、pcache=$0.25、pcacheWrite=$12.50；pblend=$0.75675/M tok。

核查值：官方发布页与多方第三方一致：input $10、output $50（与 Fable 5 持平）；cache read 降 75% 至 $0.25（= 2.5% input 价，Anthropic 文档定价页原文确认："On Claude Fable 5.1 and Claude Mythos 5.1, a cache hit costs 2.5% of the standard input price ($0.25 USD per million tokens)"）；5-minute cache write $12.50（omidsaffari 2026-09-02、cloudzero 2026-09-11、ayautomate 均确认；且 = 1.25×input，符合通用规则）。

来源：https://www.anthropic.com/claude-fable-and-mythos-5-1 ；https://platform.claude.com/docs/en/about-claude/pricing （抓取被地区墙拦截，改经搜索摘要 + 3 个独立第三方交叉验证）。

判定：**正确**。pblend 复算 = 0.75675，自洽。

effort 一致性：5 档 effort 单价完全相同。判定正确。

## 4. Claude 4.5 Haiku（含 non-reasoning 变体）

页面现值：pin=$1、pout=$5、pcache=$0.10、pcacheWrite=$1.25；pblend=$0.1482/M tok。

核查值：Haiku 4.5 官方定价 $1 / $5 per 1M input/output；cache write $1.25（1.25×）、cache read $0.10。多个独立来源确认（Caylent 2025-10-15："Prompt caching costs $1.25 per million tokens for writes and $0.10 per million tokens for reads"；doit.com 价目表同值）。

来源：https://caylent.com/blog/claude-haiku-4-5-deep-dive-cost-capabilities-and-the-multi-agent-opportunity （2025-10-15）；https://www.doit.com/blog/anthropic-api-pricing （2026-05-12）；https://www.anthropic.com/claude/haiku。

判定：**正确**。这是四者中唯一 2025 年即存在的真实模型，四价全部吻合。

## 5. 订阅倍率（SUBSCRIPTION_PRICING_RUNTIME / pricing-model.mjs）

倍率定义（与 SemiAnalysis 口径一致）：multiplier = 满额使用下计划可换算的一手 API 等价价值 ÷ 月费；订阅有效单价 = API 单价 ÷ multiplier。

### Opus 5.5
| 计划 | 页面值 | 核查值（SemiAnalysis 2026-10-05 表，经 OrcaRouter 转述为美元值） | 判定 |
|---|---|---|---|
| Pro $20 | 58.9 | $1,178 ÷ $20 = 58.9 | **正确** |
| Max 5x $100 | 57.3 | $5,725 ÷ $100 = 57.25 → 57.3 | **正确** |
| Max 20x $200 | 58.6 | $11,726 ÷ $200 = 58.63 → 58.6 | **正确** |

来源：https://newsletter.semianalysis.com/p/anthropic-subscriptions-offer-5x （原文倍率表为图片，正文不可直读）；数字经 https://www.orcarouter.ai/blog/claude-opus-5-5-vs-gpt-6-1-sol-subscription-value （2026-10-06）完整转述核对，三档美元值均给出。

### Sonnet 5.5（fitted）
- Max 20x：62.6（页面标 snapshot）。核查：SemiAnalysis 正文仅定性（"The drop off is small between Sonnet 5.5 and Opus 5.5"，即 Sonnet 略高于 Opus，62.6 > 58.6 方向吻合）；精确值 62.6 在文章图片表格中，文本抓取无法直读 → **无法核实精确值**（搜索了 SemiAnalysis 全文与 6 组引用该表的二手来源，仅 OrcaRouter 转述了 Opus/Astra/Sol 的数字，未转述 Sonnet 档）。
- Pro $20：62.6 × 58.9 ÷ 58.6 = 62.9205。算术复算正确，"fitted" 标注与 note（"Fitted from Max20x multiplier ratio."）自洽。
- Max 5x：62.6 × 57.3 ÷ 58.6 = 61.2113。算术复算正确，标注自洽。
- 判定：**算术自洽（通过）；基准值 62.6 无法核实**。方法假设（Sonnet/Opus 倍率比在各档恒定）未见于 SemiAnalysis 原文，属页面自担的拟合假设，且已如实标注 provenance="fitted"，处理方式诚实。

### Fable 5.1
- Max 20x：12.4。核查：SemiAnalysis 正文原句 "your $200 ANT plan would still have 50% left after consuming $2,485 worth of Fable 5.1"，即 Fable 满额（受限额一半封顶）API 等价价值 $2,485 ÷ $200 = 12.425 → 12.4。**正确**。
- Max 5x：12.7。核查：正文与二手转述均未给出 $100 档 Fable 数字 → **无法核实**（量级合理，与 12.4 相近）。
- Pro $20：页面未列 Fable。无法核实是否正确（正文提到 "for models like Fable, its own weekly limit"，未明确 Pro 是否可用）。

### 「half the plan quota」声明（维度 3）
页面 quotaNote："Claude Fable 5.1 uses at most half the plan quota."
SemiAnalysis 正文原句："Fable can only be used for 50% of your limit. In other words, your $200 ANT plan would still have 50% left after consuming $2,485 worth of Fable 5.1."
两者完全对应，且 50% 封顶 × Fable 满额价值 ≈ 12.4 的算术链闭合：**一致，正确**。代码层面（pricing-model.mjs）该声明仅作为 tooltip 文本透出（HTML 1611 行），不参与倍率计算——12.4/12.7 本身已是「含 50% 封顶」的实测结果，不重复打折，无双重计入问题。

### 来源日期小瑕疵
页面 Anthropic 块 sourceDate 标 "2026-09-29"，但 SemiAnalysis 文章发布于 2026-10-05（OrcaRouter 明确 "published by SemiAnalysis on October 5, 2026"）。倍率数值（58.9/57.3/58.6、12.4）晚于所标快照日期。API 单价部分 2026-09-29 口径无误。判定：**日期标注不一致（小错）**，建议 sourceDate 改为 2026-10-05 或拆分标注（API 价 2026-09-29 / 倍率 2026-10-05）。

### 附带观察（非 Anthropic 块数字错误）
- pricing-model.mjs `DEFAULT_MIX = {input:0.4, cacheRead:96.7, cacheWrite:2.6, output:0.3}`，SemiAnalysis 口径为 0.4/96.6/2.6/0.3（合计 99.9）。页面取 96.7 应为凑整 100%，差异 0.1pp，对四款模型 pblend 影响 < $0.001/M tok，可忽略，但与引用源存在 0.1 偏差。
- build-proto.mjs 内注释 "综合价 = 0.043×input + 0.0007×output + 0.95×cacheHit" 与实际使用的 DEFAULT_MIX 不符，是过期注释（HTML 实际 pblend 按 DEFAULT_MIX 计算且复算全部吻合），建议清理。

---

## 发现的错误清单

1. **[小错·元数据] Anthropic 块 sourceDate 标注不一致**：`SUBSCRIPTION_PRICING_RUNTIME`（HTML ~1254 行）与 `pricing-model.mjs` 均标 sourceDate "2026-09-29"，但所引 SemiAnalysis 文章及其倍率表（58.9 / 57.3 / 58.6 / 12.4）发布于 2026-10-05。更正：倍率部分 sourceDate 应为 2026-10-05（或拆分标注 API 价 2026-09-29、倍率 2026-10-05）。
2. **[小错·文档] build-proto.mjs 过期注释**：第 97 行附近注释写混合权重为 "0.043×input + 0.0007×output + 0.95×cacheHit"，与实际生效的 `DEFAULT_MIX`（0.4/96.7/2.6/0.3，含 cacheWrite）矛盾。不影响运行结果（HTML 内 pblend 复算全部吻合），仅误导读者。
3. **[可忽略偏差] DEFAULT_MIX cacheRead 96.7 vs SemiAnalysis 96.6**：疑为凑整 100% 所致，对 Anthropic 四款模型综合价影响 <$0.001/M tok。如需严格对齐引用源可改回 96.6 并把 0.1 分配到其他桶。
4. **[无法核实，非错误] Sonnet 5.5 Max20x 倍率 62.6 与 Fable 5.1 Max5x 倍率 12.7 的精确值**：SemiAnalysis 倍率表为图片，文本不可直读；已搜索原文全文与多个二手转述，Opus 三档与 Fable $200 档均可复核，唯此两值无文本来源。页面已如实标 provenance="fitted"/"snapshot"，量级与方向（Sonnet 略高于 Opus；Fable 远低且受 50% 封顶）均与正文定性描述一致。

未发现任何 API 单价、cache read/write 价、pblend 算术或 effort 间一致性的实质错误。四款模型 16 项单价（4 模型 × input/output/cacheRead/cacheWrite）全部与官方来源吻合。
