# Cost 核查报告 3：中国厂商块（cost-check-3-cn）

- 核查人：herdr/cost-check-cn（4 并行 worker 之一）
- 日期：2026-10-09
- 对象：`/tmp/llm-pareto-label-scale-fix/.agents/skills/llm-pareto-frontier/prototype-4d-3d.html`（ROWS_RAW 第 1219 行；SUBSCRIPTION_PRICING_RUNTIME 第 1222–1375 行）+ `scripts/pricing-model.mjs`
- 方法：anysearch 检索 + extract 抓取各厂商官方定价页原文（z.ai docs、api-docs.deepseek.com、platform.kimi.ai、mimo.mi.com、platform.minimax.io、alibabacloud.com model-pricing、platform.stepfun.ai、longcat.chat、hy.tencent.com），交叉比对第三方聚合站（OpenRouter、AA、pricepertoken 等）。只读核查，未改任何文件。

## 数据面总览

ROWS_RAW 共 265 行，中国系（Z AI / DeepSeek / Kimi / Alibaba / Xiaomi / StepFun / Tencent / MiniMax / InclusionAI / LongCat / ByteDance Seed / Baidu / China Mobile / KwaiKAT / AI9Stars / Nex AGI / OpenBMB / Nanbeige / Trillion Labs）共 73 行。其中 22 行有价格（pin/pout/pcache），其余 51 行（Qwen3.8 Max (0902)、Qwen3.5/3.6 全系、JT 系列、G9、Nanbeige、Tri-21B、ERNIE 4.5/5.0、Doubao Seed Code、Step3 VL、Kimi Linear、Ring-2.6、LongCat Flash Lite 等）**四价全 null，页面已按规则排除出图，无值可核**。

单位核查：全部为 $/M tok，与官方口径一致，无「每千 token」混用。但**折扣口径不一致**（DeepSeek 用 peak 价、LongCat 用限时折扣价、MiniMax 用 5 折促销价），见错误清单第 7 条。

---

## 逐模型核查

### GLM-5.3（max / low）— Z AI
- 页面现值：pin 1.4 / pout 4.4 / pcache 0.26
- 核查值：官方 docs.z.ai Pricing：$1.4 in / $0.26 cached / $4.4 out
- 来源：https://docs.z.ai/guides/overview/pricing（2026-10-09 抓取）；https://venturebeat.com/technology/glm-5-3-hits-the-api-at-1-4-4-4-per-million-tokens（2026-08-18）
- 判定：**正确**

### GLM-5.3-Flash — Z AI
- 页面现值：pin 0.15 / pout 0.5 / pcache 0.026
- 核查值：官方 $0.15 / **$0.03** / $0.50。缓存价错误。
- 来源：https://docs.z.ai/guides/overview/pricing；https://x.com/Zai_org/status/2092616209426493766（2026-09，官方推文同价）
- 判定：**错误**（pcache 更正 0.026 → 0.03）。input/output 正确。

### DeepSeek V4.1 Flash（max / non-reasoning）— DeepSeek
- 页面现值：pin 0.3 / pout 1.2 / pcache 0.006
- 核查值：官方 peak：cache hit $0.006 / miss $0.30 / out $1.20（off-peak 减半 0.003/0.15/0.6）
- 来源：https://api-docs.deepseek.com/quick_start/pricing（2026-10-09 抓取）
- 判定：**正确**（取 peak 档，口径一致）

### DeepSeek V4 Pro 0813（max）— DeepSeek
- 页面现值：pin 1.32 / pout 3.96 / pcache 0.044
- 核查值：官方 peak：cache hit $0.044 / miss $1.32 / out $3.96
- 来源：https://api-docs.deepseek.com/quick_start/pricing（2026-10-09）
- 判定：**正确**

### DeepSeek V4 Flash Vision（max）— DeepSeek
- 页面现值：pin 0.44 / pout 1.32 / pcache 0.014
- 核查值：官方已将 `deepseek-v4-flash-vision-exp` 等 legacy 名下线，请求由 DeepSeek-V4.1-Flash 承接并**按 Flash 价计费**（0.3/1.2/0.006 peak）。页面 0.44/1.32/0.014 恰为旧 V4-Flash off-peak 价（0.22/0.66/0.007）的 2 倍，即旧 peak 价快照，未随 2026-08-17 调价更新。
- 来源：https://api-docs.deepseek.com/quick_start/pricing（2026-10-09）；旧价旁证 https://www.eesel.ai/blog/deepseek-v4-flash-vision-exp
- 判定：**错误（过时快照）**，更正 0.44/1.32/0.014 → 0.3/1.2/0.006

### MiMo-V2.6-Pro — 小米
- 页面现值：pin 0.435 / pout 0.87 / pcache 0.0036
- 核查值：官方 mimo.mi.com：$0.435 in / $0.87 out；cache hit $0.0036（99% 折扣，cache write 暂免）
- 来源：https://mimo.mi.com/models/en-US/mimo-v2.6-pro、https://mimo.mi.com/docs/price/pay-as-you-go、https://www.litellm.ai/blog?post=mimo_v2_6（2026-09-22）
- 判定：**正确**

### MiMo-V2.6-Flash — 小米
- 页面现值：pin 0.14 / pout 0.28 / pcache 0.0028
- 核查值：官方：cache hit $0.0028 / in $0.14 / out $0.28
- 来源：https://mimo.xiaomi.com/mimo-v2-6（2026-09-22）
- 判定：**正确**

### Step 5 Preview — 阶跃 StepFun
- 页面现值：pin 1 / pout 2.7 / pcache 0.05
- 核查值：官方 step-5-preview：$1.00 in（cache miss）/ $0.05 cache hit / $2.70 out
- 来源：https://platform.stepfun.ai/docs/en/guides/pricing/details（2026-10-09）
- 判定：**正确**

### Kimi K3（max / low）— Moonshot
- 页面现值：pin 3 / pout 15 / pcache 0.3
- 核查值：官方 kimi-k3：$3.00 in / $0.30 cached input / $15.00 out（cache write 5min $3.00 / 1h $6.00 单列）
- 来源：https://platform.kimi.ai/docs/pricing/chat（2026-10-09）；https://www.eesel.ai/blog/kimi-k3-pricing
- 判定：**正确**

### Kimi K2.7 Code — Moonshot
- 页面现值：pin 0.95 / pout 4 / pcache 0.19
- 核查值：官方口径 $0.95 / $0.19 cached / $4.00
- 来源：https://platform.kimi.ai/docs/pricing/chat（K2 系列）；https://www.kimi.ai/resources/kimi-k2-7-code（cache hit $0.19 vs miss $0.95）
- 判定：**正确**

### MiniMax-M3
- 页面现值：pin 0.3 / pout 1.2 / pcache 0.06
- 核查值：官方 ≤512k 输入档限时 5 折：$0.30 in / $1.20 out / $0.06 cache（原价 0.60/2.40/0.12）
- 来源：https://platform.minimax.io/docs/guides/pricing-paygo（2026-10-09）
- 判定：**正确**（取促销价；>512k 档另有价格，页面未区分）

### Hy3（腾讯）
- 页面现值：pin 0.136 / pout 0.555 / pcache 0.034
- 核查值：官方人民币价 ¥1 / ¥4 / ¥0.25（每百万 tok），按 ~7.3 汇率折算即 $0.137 / $0.548 / $0.034；第三方 USD 报价 $0.13–0.15 / $0.53–0.58 / $0.033–0.04 与之吻合。腾讯英文新闻稿的「$0.18 起」为发布初期价，2026-09/30–10/01 官方已降价。
- 来源：https://hy.tencent.com/research/hy3（¥1/¥4/¥0.25，2026-04-30）；https://www.writeworks.ai/ai-updates/tencent/pricing（2026-10-01 降价记录）；https://openrouter.ai/tencent/hy3
- 判定：**正确**（官方人民币价折算；注意汇率折算带来 ±5% 漂移）

### Doubao Seed Code — 字节
- 页面现值：四价全 null（未入图）
- 判定：**无法核实（页面无值）**。未查火山引擎定价页。

### ERNIE 4.5 / ERNIE 5.0 Thinking Preview — 百度
- 页面现值：四价全 null
- 判定：**无法核实（页面无值）**

### Qwen3.8 2.4T A95B — 阿里
- 页面现值：pin 2 / pout 6 / pcache 0.25
- 核查值：官方国际站（Singapore/International 档）$2 / $6 ✓；cache 未在主表列出，官方规则为「cache hit 按 input 价 10% 计」→ 推算 $0.20，页面 0.25 偏高。中国大陆档为 $1.65/$4.951，页面取国际档合理。
- 来源：https://www.alibabacloud.com/help/en/model-studio/model-pricing（2026-10-09 抓取）；cache 10% 规则见同页 Note
- 判定：input/output **正确**；pcache **疑似错误**（按官方 10% 规则应为 0.20；该规则为页内举例、各模型折扣率可不同，故不定为硬错误）

### Qwen3.8 27B（xhigh / medium / low / non-reasoning）— 阿里
- 页面现值：pin 0.5 / pout 3 / pcache 0.1
- 核查值：官方国际站 $0.5 / $3 ✓；按 10% 规则 cache 应为 $0.05，页面 0.1 为其 2 倍
- 来源：https://www.alibabacloud.com/help/en/model-studio/model-pricing（2026-10-09）
- 判定：input/output **正确**；pcache **疑似错误**（更正参考 0.05）

### Qwen3.8-Flash-Next — 阿里
- 页面现值：pin 0.15 / pout 0.47 / pcache 0.016
- 核查值：官方 Qwen 博客 $0.15 / $0.47；cache read：OpenRouter $0.016，10% 规则推算 $0.015，页面 0.016 在两者之间
- 来源：https://qwen.ai/blog?id=qwen3.8-flash-next（2026-08-26）；https://openrouter.ai/qwen/qwen3.8-flash
- 判定：**正确**（pcache 与 10% 规则差 0.001，在舍入范围内）

### Qwen3.7 Plus — 阿里
- 页面现值：pin 0.4 / pout 1.6 / pcache 0.08
- 核查值：官方国际站 ≤256K 档 $0.4 / $1.6 ✓；按 10% 规则 cache 应为 $0.04，页面 0.08 为其 2 倍
- 来源：https://www.alibabacloud.com/help/en/model-studio/model-pricing（2026-10-09）
- 判定：input/output **正确**；pcache **疑似错误**（更正参考 0.04）

### Qwen3 Coder Next — 阿里
- 页面现值：pin 0.35 / pout 1.2 / pcache 0.35
- 核查值：官方国际站分档：≤32K $0.3/$1.5；32–128K $0.5/$2.5；128–256K $0.8/$4。页面 0.35/1.2 **不匹配任何官方档位**（input 高 17%、output 低 20%，疑为两档混拼）。pcache 0.35 甚至**高于 input 0.3**，与「context caching discount」直接矛盾，10% 规则下应为 $0.03。
- 来源：https://www.alibabacloud.com/help/en/model-studio/model-pricing（2026-10-09 抓取原文）
- 判定：**错误**。更正（≤32K 国际档）：0.35/1.2/0.35 → 0.3/1.5/0.03。**本块最严重错误**。

### Qwen3 系列（Qwen3.5 / 3.6 / Next 80B / Omni 30B 等）
- 页面现值：全部四价 null（未入图）
- 判定：**无法核实（页面无值）**

### Ling 3.1 Flash — InclusionAI（蚂蚁）
- 页面现值：pin 0.3 / pout 0.9 / pcache 0.06
- 核查值：与 AA 记录一致（$0.30/$0.90）；但官方一手价未能独立找到——AI Weekly（2026-09-30）称 Ling-3.1-flash 上线时标注沿用 $0.075/$0.22 且 API「marked unavailable」，与 0.3/0.9 矛盾。3.1（560B/25B）比 3.0（124B/5.1B）贵 4 倍在量级上并非不可能，但缺官方定价页佐证。
- 来源：https://artificialanalysis.ai/models/ling-3-1-flash（$0.30/$0.90）；https://aiweekly.co/alerts/ants-inclusionai-ships-ling-31-flash-with-560b-parameters（2026-09-30）
- 判定：**无法核实**（与 AA 一致，但无官方一手来源；存在与 3.0 同价报道的矛盾）

### Ling-3.0-flash / Ling-3.0-flash-VL / Ling-3.0-flash-Fin — InclusionAI
- 页面现值：pin 0.075 / pout 0.22 / pcache 0.015（三行同价）
- 核查值：官方一手 API $0.075 in / $0.22 out（AA 官推转述 InclusionAI 一手价）
- 来源：https://x.com/ArtificialAnlys/status/2085878147782939064（约 2026-08）；https://artificialanalysis.ai/models/ling-3-0-flash/providers
- 判定：input/output **正确**；pcache 0.015 无法核实（官方未列 cache 价）

### Ling 3.0 Tiny — InclusionAI
- 页面现值：四价 null。**无法核实（页面无值）**

### Ring-2.6-1T / Ring-flash-2.0 — InclusionAI
- 页面现值：四价 null。**无法核实（页面无值）**

### LongCat 2.0 — LongCat（美团）
- 页面现值：pin 0.3 / pout 1.2 / pcache 0.006
- 核查值：官方定价页两档并列：标准 $0.75/$2.95/缓存 $0.015；**限时折扣** $0.30/$1.20/**$0.006**。页面取的是折扣档，数值本身有官方出处。
- 来源：https://longcat.chat/platform/docs/pricing/long-cat-2.0（2026-10-09）；https://venturebeat.com/technology/meituan-open-sources-longcat-2-0-...（2026-06-29）
- 判定：**正确（但取的是限时折扣价）**——与 DeepSeek 用 peak 标准价、MiniMax 用促销价的口径不一致，页面未标注，混图对比时会低估 LongCat 成本 2.5 倍。建议统一口径或加注。

### LongCat Flash Lite
- 页面现值：四价 null。**无法核实（页面无值）**

### KAT-Coder-Pro V2 — KwaiKAT（快手）
- 页面现值：pin 0.3 / pout 1.2 / pcache 0.06
- 核查值：第三方 pricepertoken $0.30/$1.20 ✓（注意：7 月发布的 V2.5 为 $0.74/$2.96，勿混淆）；官方一手定价页未检索到，cache 0.06 无来源
- 来源：https://pricepertoken.com/pricing-page/model/kwaipilot-kat-coder-pro-v2；https://tokencost.app/blog/kat-coder-v2-5-pricing
- 判定：**基本正确（第三方来源）**；pcache 无法核实

### JT 系列（JT-4.1 Flash 236B、JT-35B-Flash、JT-MINI）— 中国移动
- 页面现值：四价全 null。**无法核实（页面无值）**

### G9（G9v3-39A5B / G9v3-3B）— AI9Stars
- 页面现值：四价全 null。**无法核实（页面无值）**

### Nanbeige4.1-3B — Nanbeige
- 页面现值：四价 null。**无法核实（页面无值）**

### Tri-21B-Think — Trillion Labs
- 页面现值：四价 null。**无法核实（页面无值）**

### Nex-N2-Pro — Nex AGI、MiniCPM5 系列 — OpenBMB
- 页面现值：四价 null。**无法核实（页面无值）**

---

## Z AI 订阅倍率块（SUBSCRIPTION_PRICING_RUNTIME，HTML 1222–1375 行 / pricing-model.mjs 同构）

**块内声明本身**：Z AI 条目 source 写明 "Task-provided GLM plan estimates; subscription access does not imply official per-token rates"——这个定性（非官方、任务方提供的估算）是诚实的。倍率数值（Lite 7.7 / Pro 10.4 / Max 11.6；Flash 1.3/1.8/2.0）无官方来源可核，**无法核实**（与声明一致，属设计内）。

**计划月费可核部分**：
- Z AI GLM Coding Plan：Lite $18 / Pro $80 / Max $168，与 glm-ai.chat（2026-08-18）完全一致；aipricing.guru 记为 18/72/160（口径分歧，或为折扣前/后差异）。**基本正确**。
- MiniMax Token Plan：$22/$55/$132，与官方 platform.minimax.io/docs/token-plan/intro 完全一致。**正确**。
- Kimi：$19/$39/$99/$199，与第三方报道（lindy.ai、omidsaffari：Kimi 会员 $19–$199/月）范围一致。**基本正确**。

**发现的来源声明自洽性错误**：`SUBSCRIPTION_REGISTRY` 定义之后有一个 for 循环：

```js
for (const provider of Object.values(SUBSCRIPTION_REGISTRY)) {
  provider.source = "SemiAnalysis 文章截图快照；满额使用下的固定倍率估算，非官方承诺。";
  provider.sourceUrl = "https://newsletter.semianalysis.com/p/anthropic-subscriptions-offer-5x";
}
```

它把 **包括 Z AI / MiniMax / Kimi 在内的所有 provider 的 source/sourceUrl 无差别覆盖**为 SemiAnalysis 的 **Anthropic Claude 订阅**文章。于是页面实际展示时，Z AI 的 GLM 计划倍率来源会标注为「SemiAnalysis 文章截图快照」——但该文章不可能包含 GLM/Kimi/MiniMax 计划数据，前面各条目自己写的「Task-provided estimates」声明被整体抹掉。`pricing-model.mjs`（第 66–70 行）存在同一 bug。**判定：错误**——数据结构里正确写了来源，又被尾部循环覆盖成张冠李戴的引用。

**次要疑点（不定性为错误）**：
1. 同一 Lite 计划内 GLM-5.3-Flash 倍率（1.3）低于 GLM-5.3（7.7）。倍率 ≈ 计划内可用量 × API 折算，Flash API 更便宜、同额度下倍率理应更高；现值方向可疑，但倍率本为任务方估算，无官方基准可判。
2. MiniMax Ultra（23.4）< Max（23.7），顶档倒挂，同样无源可核。

---

## 单位与口径一致性

1. 全部四价均为 $/M tok，官方页无每千 token 混用问题。✓
2. 缓存口径：DeepSeek/Kimi/StepFun/MiMo/z.ai 用官方 cache-hit 价；阿里系页面未公布各模型 cache 单价，页面值与官方「cache hit = input 10%」规则普遍不符（见上）。⚠️
3. 折扣档混用：DeepSeek=peak 标准价、MiniMax=5 折促销、LongCat=限时折扣、阿里=国际站标准价。混图对比时同一模型会因口径不同产生 2–2.5 倍偏差。⚠️
4. DEFAULT_MIX 中 cacheRead 权重 96.7%，故 pcache 的错误会被混合成本放大约 30 倍权重地放大——Qwen3 Coder Next 的 pcache 0.35（高于 input）在混合价里影响显著。

---

## 发现的错误清单

1. **Qwen3 Coder Next（最严重）**：页面 0.35/1.2/0.35，官方国际站 ≤32K 档为 **$0.3/$1.5**，cache 按 10% 规则应为 $0.03；页面 output 低 20%、pcache（0.35）反高于 input（0.3），自相矛盾。来源：alibabacloud.com/help/en/model-studio/model-pricing。
2. **DeepSeek V4 Flash Vision（max）**：页面 0.44/1.32/0.014 为已下线旧模型的旧 peak 价快照；官方现行为按 deepseek-flash 计费 **0.3/1.2/0.006**（peak）。来源：api-docs.deepseek.com/quick_start/pricing。
3. **GLM-5.3-Flash**：pcache 0.026 → 官方 **0.03**（input/output 正确）。来源：docs.z.ai/guides/overview/pricing、@Zai_org 官推。
4. **订阅块来源覆盖 bug**（HTML 1352–1356 行 + pricing-model.mjs 66–70 行）：for 循环把所有 provider（Z AI/MiniMax/Kimi/Meta/SpaceXAI/Cursor）的 source/sourceUrl 覆盖为 SemiAnalysis Anthropic 文章，抹掉了各条目自带的「Task-provided estimates」声明，来源标注张冠李戴、不自洽。
5. **阿里系 pcache 疑似系统性偏高约 2 倍**：Qwen3.8 2.4T（0.25，规则推算 0.20）、Qwen3.8 27B（0.1 vs 0.05）、Qwen3.7 Plus（0.08 vs 0.04）。官方规则「cache hit 按 input 价 10%」（页内举例，非逐模型硬性），标「疑似错误」。
6. **LongCat 2.0 取限时折扣价**（0.3/1.2/0.006）而标准价为 0.75/2.95/0.015，与块内其他模型（DeepSeek peak、阿里标准价）口径不一致，页面无标注。
7. **Ling 3.1 Flash 无法核实**：0.3/0.9 与 AA 一致，但 AI Weekly 报道上线路 $0.075/$0.22 且 API 不可用，缺官方一手定价页佐证。
8. **提示性疑点（非定价错误）**：Z AI Lite 内 GLM-5.3-Flash 倍率（1.3）低于 GLM-5.3（7.7）、MiniMax Ultra（23.4）< Max（23.7）倒挂；均为任务方估算、无官方基准，建议复核。
9. 中国系 51 行（含任务点名的 Doubao Seed Code、ERNIE 4.5/5.0、JT 系列、G9、Nanbeige、Tri-21B、Qwen3.5/3.6、Kimi Linear、Step3 VL、Ring、LongCat Flash Lite）页面四价全 null，已按设计排除出图，无从核查。

**核对无误（本次全对）**：GLM-5.3、DeepSeek V4.1 Flash、DeepSeek V4 Pro 0813、MiMo-V2.6-Pro、MiMo-V2.6-Flash、Step 5 Preview、Kimi K3、Kimi K2.7 Code、MiniMax-M3、Hy3、Qwen3.8 2.4T A95B（in/out）、Qwen3.8 27B（in/out）、Qwen3.8-Flash-Next、Qwen3.7 Plus（in/out）、Ling 3.0-flash（含 VL/Fin）、KAT-Coder-Pro V2（in/out）。
