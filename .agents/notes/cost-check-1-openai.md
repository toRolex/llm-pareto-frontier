# Cost 核查报告 1/4 — OpenAI 系块（GPT-6 Astra / GPT-6.1 Sol / GPT-6 Luna / GPT-5.6 Terra / GPT-5.5 Instant / o3 / gpt-oss）

- 核查人：herdr/cost-check-openai（并行 worker 1/4，只读核查，未修改任何源文件）
- 核查日期基准：2026-10（搜索时间线）
- 页面：`prototype-4d-3d.html` 的 `ROWS_RAW`（$ /M tok）与 `SUBSCRIPTION_REGISTRY` OpenAI 块（~1228-1249 行）；`scripts/pricing-model.mjs` 同步核对。
- 方法：anysearch 检索 OpenAI 官方 pricing 页 / 官方发布博客 / 第三方定价站（CloudZero、OpenRouter、economize.cloud、the-decoder 等）；订阅倍率对照 SemiAnalysis 原文（正文数字与陈述；付费 dashboard 图表无法读取）。

## 1. GPT-6 Astra（max/xhigh/high/medium/low 五个 effort 行，价格全部相同）

| 维度 | 页面现值 | 核查值 |
|---|---|---|
| input | $10 | $10.00 |
| output | $50 | $50.00 |
| cache read | $1 | $1.00 |
| cache write | $10（标注"估算：cache write = input"） | **$12.50**（官方 = 1.25×input） |

- 来源：https://developers.openai.com/api/docs/models/gpt-6-astra （官方，"Input $10.00 / Cached input $1.00 / Cache writes $12.50 / Output $50.00"）；https://www.truefoundry.com/blog/gpt-6-astra （2026-09-23，同一组数）；https://www.yottalabs.ai/post/gpt-6-astra-pricing-api-cost-2026 （2026-10-01）。
- effort 一致性：五档 effort 单价相同，与 OpenAI 按档位不加价、AA 按 effort 变体同价采集的做法一致。未发现任何来源对 Astra 不同 effort 报不同 API 单价。
- 判定：pin/pout/pcache **正确**；pcacheWrite **错误**，应为 **$12.50/M**（现值 $10，低 20%）。

## 2. GPT-6.1 Sol（max/xhigh/high/medium/low 五行，价格相同）

| 维度 | 页面现值 | 核查值 |
|---|---|---|
| input | $2 | $2.00 |
| output | $10 | $10.00 |
| cache read | $0.10 | $0.10（官方发布文原文 "$0.10 per million cached input tokens"，为 input 的 1/20，比 GPT-6 Sol 再降 50%） |
| cache write | $2（估算=input） | 官方同代规则 1.25×input = **$2.50**（requesty.ai 明确给出 GPT-6 Sol cache write $2.50；6.1 Sol 未单独取到写入报价，标为高置信推断） |

- 来源：https://openai.com/index/introducing-gpt-6-1-sol/ （官方发布博客，三价原文齐备）；https://www.lindy.ai/blog/gpt-6-1-sol （同数）；https://x.com/OpenAIDevs/status/2104993035507712318 （"API pricing is $2 in / $10 out. Cached input is just $0.10"）。
- cache read 1/20 的比例曾在本任务前置怀疑为"内部不一致"，实为官方定价（cache read 降半），**正确**。
- 判定：pin/pout/pcache **正确**；pcacheWrite **错误/低估**，应约为 **$2.50/M**。

## 3. GPT-6 Luna（max/xhigh/high/medium/low + non-reasoning 六行，价格相同）

| 维度 | 页面现值 | 核查值 |
|---|---|---|
| input | $0.10 | $0.10 |
| output | $0.50 | $0.50 |
| cache read | $0.01 | $0.01 |
| cache write | $0.10（估算=input） | **$0.125**（官方 1.25×input；requesty.ai 与 stob.ai 均给出 Luna cache write $0.125） |

- 来源：https://www.economize.cloud/resources/open-ai/pricing/gpt-6-luna/ （2026-09-28，"$0.10 in / $0.01 cached / $0.50 out, Batch $0.05/$0.25"）；https://stob.ai/blog/openai-model-pricing-comparison-2026 （2026-07-31，含 cache write $0.125）；https://www.requesty.ai/blog/gpt-6-sol-luna-pricing-release-api （2026-09-25，cache write $0.125）；官方 pricing 页快照（developers.openai.com/api/docs/pricing，"gpt-6-luna $0.10 $0.01"）。
- 判定：pin/pout/pcache **正确**；pcacheWrite **错误**，应为 **$0.125/M**。

## 4. GPT-5.6 Terra（max/xhigh/high/medium/low + non-reasoning 六行，价格相同）

| 维度 | 页面现值 | 核查值 |
|---|---|---|
| input | $2 | $2.00（2026-07-30 降价后；发布时 $2.50） |
| output | $12 | $12.00（同上；发布时 $15） |
| cache read | $0.20 | $0.20 |
| cache write | $2（估算=input） | **$2.50**（OpenRouter 与 coursiv 均给出；= 1.25×新 input 价） |

- 来源：https://www.cloudzero.com/blog/gpt-5-6-pricing/ 与 https://www.cloudzero.com/blog/openai-pricing/ （"GPT-5.6 comes in three tiers: Sol at $5/$30, Terra at $2/$12, and Luna at $0.20/$1.20, following OpenAI's July 30, 2026 price cut"）；https://openrouter.ai/openai/gpt-5.6-terra （"$2.00 in / $12.00 out, Cache Read $0.20, Cache Write $2.50"）；https://openai.com/index/gpt-5-6/ （2026-07-09 发布价 $2.50/$15，已被 7-30 降价取代）。
- 判定：pin/pout/pcache **正确**（与当前降价后官方价一致）；pcacheWrite **错误**，应为 **$2.50/M**。

## 5. GPT-5.5 Instant (June 2026)

| 维度 | 页面现值 | 核查值 |
|---|---|---|
| input | $5 | $5.00（= gpt-5.5） |
| output | $30 | $30.00（= gpt-5.5） |
| cache read | $0.50 | $0.50（OpenRouter gpt-5.5 Cache Read $0.50） |
| cache write | $5（估算=input） | 未获官方独立写入报价；o3/5.5 代模型写入按 input 计的假设未被来源反驳 |

- 来源：https://openai.com/index/introducing-gpt-5-5/ （2026-04-23，"$5 per 1M input / $30 per 1M output"）；https://openrouter.ai/openai/gpt-5.5 （cache read $0.50）；https://community.openai.com/t/gpt-5-5-instant-on-api-just-via-chat-latest-pricing/1380410 （2026-05-06："There isn't a separate gpt-5.5 instant pricing"——Instant 是 ChatGPT 默认模型，无独立 API 价）。
- 说明：Instant 无独立官方 API 报价，页面按 gpt-5.5 同价录入（$5/$30/$0.5）与现有来源不冲突；AA 确有 `gpt-5-5-instant-06-26` 录价条目（fetch-prices.mjs 的 SLUG_OVERRIDE 佐证）。
- 判定：**正确（按同 gpt-5.5 价处理合理；无法100%核实 AA 该条目现值，属低风险）**。

## 6. o3

| 维度 | 页面现值 | 核查值 |
|---|---|---|
| input | $2 | $2.00 |
| output | $8 | $8.00 |
| cache read | $0.50 | $0.50 |
| cache write | $2（估算=input） | o3 为旧代模型，未检索到独立写入价；按 input 计未被反驳 |

- 来源：https://www.metacto.com/blogs/unlocking-the-true-cost-of-openai-api-a-deep-dive-into-usage-integration-and-maintenance （o3 表：$2.00 / $0.50 cached / $8.00）；https://amnic.com/blogs/openai-api-pricing （同表）；CloudZero（"o3 at $2.00/$8.00"）。多源一致。
- 判定：pin/pout/pcache **正确**。

## 7. gpt-oss 系列

### gpt-oss-120b（high/low 两行，价格相同）

| 维度 | 页面现值 | 核查值 |
|---|---|---|
| input | $0.15 | $0.15（AA 页面口径） |
| output | $0.595 | $0.59–$0.60（AA 口径；OpenAI 官方参考价 $0.60） |
| cache read | $0.125 | AA 录价口径内合理；未获 OpenAI 官方独立数字（OpenAI 不直接托管该模型 API，AA 取第三方托管中位/参考价） |

- 来源：https://artificialanalysis.ai/models/gpt-oss-120b （"$0.15 per 1M input… $0.59 per 1M output"——与页面声明数据源 AA 一致）；https://openrouter.ai/openai/gpt-oss-120b （当前聚合市场价 $0.03/$0.17，显著低于 AA 参考口径）。
- 判定：**与页面声明数据源（AA）一致 → 正确**。注意：市场实际成交价已远低于此（OpenRouter $0.03/$0.17），属"AA 参考价 vs 市场价"的口径问题，不是录值错误；如页面想表达市场价则偏低，但页面数据管线明确以 AA 为源，判正确。

### gpt-oss-20b（high/low 两行）

- 页面现值：pin/pout/pcache 全部 null（因四价缺测被排除出 cost 轴）。
- 核查值：AA/OpenRouter/pricepertoken 均有价（OpenRouter 2026-10 现价 $0.018 in / $0.09 out / $0.009 cache read；anotherwrapper 2026-08-21 口径 $0.05/$0.20）。
- 判定：**错误（缺价）**——AA 有该模型价格，抓取管线漏采。更正值建议按 AA 现值录入（约 $0.05/$0.20 或市场口径 $0.018/$0.09，需以 AA 详情页为准）。

## 8. 订阅计划倍率（SUBSCRIPTION_REGISTRY OpenAI 块 / pricing-model.mjs 同源）

页面声明：sourceDate 2026-09-29，sourceUrl = https://newsletter.semianalysis.com/p/anthropic-subscriptions-offer-5x ，"满额使用下的固定倍率估算，非官方承诺"。

来源核实：该 SemiAnalysis 文章真实存在（《Anthropic Subscriptions Offer 5x+ More Value Than OpenAI》，2026-09 末发布），并确认了页面背景事实：OpenAI 上周将 $200 档等效价值砍半并新推出 $500 档；$200 档满额可用约 $2,897 的 Astra。

逐档核对：

| 档位 | 页面倍率（Astra / Sol） | 核查结果 |
|---|---|---|
| Plus $20 | 8.1 / 10.6 | 无正数硬数字（数值在付费 dashboard 图表内）。文章定性："Plus 在 Sol 上与 Pro 相当、在 Astra 上明显更差"——与 8.1 < 13.2~14.5、10.6 ≈ 10.4~10.8 方向一致。**方向正确，数值无法精确核实** |
| Pro $100 | 13.2 / 10.6 | 文章明言"降价后 Pro 100/200/500 对每个模型提供相同的每美元 token"，即三档倍率应相等；Pro 200 Astra 有硬数字 2897/200 = 14.49 ≈ 14.5。若三档相等，13.2 与 14.5 矛盾（差 ~9%）。**存疑/疑似错误**，可能应统一 ≈14.5（Astra） |
| Pro $200 | 14.5 / 10.4 | Astra 14.5 与文章唯一硬数字 $2,897/$200 精确吻合 → **正确**。Sol 10.4 无法精确核实 |
| Pro $500 | 13.9 / 5386/500 = 10.772 | 同上"三档应相等"矛盾（13.9 ≠ 14.5）。$5,386 为图表读数，无法核实。**存疑/疑似错误** |
| inheritedMultiplier（其余 OpenAI 模型继承 Sol 倍率） | — | 机制自洽；GPT-6 Luna / GPT-5.x / o3 等不在订阅可选项内，继承假设本身无来源，页面已声明为估算 |

- 单位一致性：倍率按 rate = apiRate / multiplier 统一除到各 token 类型，与文章"（plan, model, token type）三维定价"的模型是简化（把负载加权值折成单一除数），页面已在 tooltip 声明是估算，判定为口径声明自洽。
- 日期自洽：sourceDate 2026-09-29 与文章发布时间（搜索显示约 2026-09-29/30）一致；文章所述"上周降价"对应 2026-09 下旬的 $200 档减半 + $500 档上线，与页面档位集合（含 pro500）自洽。**自洽**。

## 9. 其他一致性观察（辅助，非定价证明）

- fetch-prices.mjs 头注"同模型各 effort 价格相同，已确认"：OpenAI 官方无按 effort 差价，AA 采集口径同价，与页面五档 effort 同价一致。**一致**。
- DEFAULT_MIX（input 0.4 / cacheRead 96.7 / cacheWrite 2.6 / output 0.3）：cacheWrite 占比 2.6%，pcacheWrite 低估 20% 对混合价影响约 +0.13×单价×0.026 ≈ 0.3%，量级小但方向性偏低。
- 价格日期自洽：Terra 用降价后价（7-30 cut）、Sol 用 6.1 发布价、订阅用 9-29 快照，三者均为各自最新态，无新旧混用。

---

## 发现的错误清单

1. **[错误] 全部 OpenAI 系模型的 cache write 单价低估 20%**：页面按"cache write = input"估算，但 OpenAI 官方现为 1.25×input（Astra $12.50 vs 页面 $10；GPT-5.6 Terra $2.50 vs $2；GPT-6 Luna $0.125 vs $0.10；GPT-6.1 Sol 约 $2.50 vs $2）。来源：developers.openai.com 官方模型页（Astra 明示 Cache writes $12.50）、OpenRouter、requesty、stob。页面虽标注"估算"，但官方独立写入报价已存在，估算前提失效。DEFAULT_MIX 下影响约 -0.3% 混合价，方向性偏低。
2. **[疑似错误] 订阅 Pro $100 / $500 档 Astra 倍率互相矛盾且与来源冲突**：页面 13.2 / 14.5 / 13.9，但 SemiAnalysis 原文明确"降价后 Pro 100/200/500 每美元 token 相同"，且 Pro 200 = 14.5 有硬数字（$2,897/$200）。Pro $100 与 $500 疑似应同为 ≈14.5（除非原始图表确有差异，但该图表无法核实）。
3. **[错误-缺价] gpt-oss-20b 四价全空**：AA 与 OpenRouter 均有该模型报价（约 $0.05/$0.20 AA 口径，$0.018/$0.09 市场口径），页面抓取管线漏采，导致该模型被排除在 cost 轴外。
4. **[无法精确核实] 订阅 Plus 档倍率数值（Astra 8.1 / Sol 10.6）与 Pro 各档 Sol 倍率（10.6/10.4/10.772）**：来源正文仅有定性陈述与一个硬数字，其余数值疑为图表读数；方向与文章一致（Plus 在 Sol 上与 Pro 相当、在 Astra 上更差），数值无法独立验证。
5. **[口径提示，非错误] gpt-oss-120b 用 AA 参考价 $0.15/$0.595**：与页面声明数据源一致、判定正确，但当前市场聚合价约 $0.03/$0.17（OpenRouter），如需表达"实际可用最低价"则显著偏高。

### 已确认正确的值（避免误伤）

- GPT-6 Astra：$10 / $50 / $1（官方三价全对）。
- GPT-6.1 Sol：$2 / $10 / $0.10（官方发布文三价全对；1/20 缓存读比例是官方定价，非笔误）。
- GPT-6 Luna：$0.10 / $0.50 / $0.01（全对）。
- GPT-5.6 Terra：$2 / $12 / $0.20（7-30 降价后现价，全对）。
- GPT-5.5 Instant：$5 / $30 / $0.5（= gpt-5.5 官方价，Instant 无独立 API 价，处理合理）。
- o3：$2 / $8 / $0.5（全对）。
- 订阅 Pro $200 Astra 倍率 14.5（与文章硬数字精确吻合）。
