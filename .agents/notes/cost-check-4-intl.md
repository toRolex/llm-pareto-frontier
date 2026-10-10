# Cost 核查报告 4/4 — 国际其它厂商块 + 全局单位一致性

核查人：herdr/cost-check-intl（并行 worker 4）
日期：2026-10-09
数据源：`prototype-4d-3d.html` ROWS_RAW（265 行，本块 112 行）+ `SUBSCRIPTION_PRICING_RUNTIME` + `scripts/pricing-model.mjs` DEFAULT_MIX
范围：Google (Gemini/Gemma)、xAI (SpaceXAI)、Meta、Mistral、Amazon Nova、NVIDIA Nemotron、IBM Granite、Cohere、LG EXAONE、Upstage、SKT、Trillion、ServiceNow、AI21、Reka、TII、Inception、Microsoft Phi、Sarvam、Apodex、Thinking Machines、Multiverse、Motif、KT、Naver。OpenAI / Anthropic / 中国厂商不在本块。
方法：anysearch / curl 抓取各厂商官方定价页；无法核实者明确标注，未编造来源。

---

## 一、有价格数据可核的模型（37 行、去重后 23 个定价点）

### 1. Google — Gemini 3.8 Flash (high/medium/low)
- 页面现值：pin 0.75 / pout 3.75 / pcache 0.075 / pcacheWrite 0.75（估算=input）
- 核查值：官方 Paid Tier $0.75 / $3.75 / cache $0.075（**促销价，2026-12-31 止**；2027-01-01 起翻倍为 $1.50/$7.50/$0.15）
- 来源：https://ai.google.dev/gemini-api/docs/pricing（抓取于 2026-10-09）
- 判定：**正确**（快照落在促销窗口内；建议页面标注「2027-01-01 起价格翻倍」避免过期）

### 2. Google — Gemini 3.1 Pro Preview
- 页面现值：2 / 12 / 0.2 / 2（估算）
- 核查值：官方 ≤200k prompt $2.00 / $12.00 / cache $0.20（>200k 为 $4/$18/$0.4）
- 来源：https://ai.google.dev/gemini-api/docs/pricing（2026-10-09）
- 判定：**正确**（取的是 ≤200k 档，与全表口径一致）

### 3. Google — Gemini 3.5 Flash-Lite
- 页面现值：0.3 / 2.5 / 0.03 / 0.3（估算）
- 核查值：官方 $0.30 / $2.50 / cache $0.03
- 来源：https://ai.google.dev/gemini-api/docs/pricing（2026-10-09）
- 判定：**正确**

### 4. Google — Gemini 4 Argon (high)
- 页面现值：2 / 10 / 0.1 / 2（估算）
- 核查值：官方导入价 $2 / $10，cached input 95% 折扣 = $0.10；标准价 $4/$20（导入期后）
- 来源：https://blog.google/innovation-and-ai/models-and-research/gemini-models/gemini-4-argon/ ；https://x.com/ArtificialAnlys/status/2105392625788637299 ；https://neuraltrust.ai/blog/gemini-4-argon（2026-10-09 检索）
- 判定：**正确**（导入期价；该价有时限，建议标注）

### 5. Google — Gemma 4 26B A4B（及 non-reasoning 变体）
- 页面现值：0.1 / 0.37 / 0.06 / 0.1（估算）
- 核查值：Google 官方 Gemini API 定价页 Gemma 4 Paid Tier 标 **"Not available"**（免费层提供）；第三方价：OpenRouter $0.042/$0.22/cache $0.021；DeepInfra/Inworld $0.07/$0.34
- 来源：https://ai.google.dev/gemini-api/docs/pricing ；https://openrouter.ai/google/gemma-4-26b-a4b-it ；https://deepinfra.com/blog/gemma-4-pricing-benchmarks-cost-scenarios（2026-10-09）
- 判定：**错误（疑似）**——页面无官方价可依，且 0.1/0.37 高于所有第三方托管价。更正建议：标注来源托管商；若按 DeepInfra 应为 0.07 / 0.34 / 0.007。

### 6. Google — Gemma 4 31B（及 non-reasoning 变体）
- 页面现值：0.165 / 0.4 / **0.14** / 0.165（估算）
- 核查值：官方 Gemini API 为 "Not available"；OpenRouter $0.09/$0.34/cache $0.05；DigitalOcean/Parasail blended ≈ $0.11；Sarvam 托管 gemma4 ₹36.6/₹13.73/₹91.5（≈$0.42/0.16/1.05）
- 来源：同上 + https://docs.sarvam.ai/api/getting-started/pricing（2026-10-09）
- 判定：**错误（疑似）**——cache read 0.14 ≈ 85%×input，违背所有厂商缓存定价惯例（通常 5%–25%×input），与任一来源均不吻合；input/output 亦高于常见第三方价。更正建议：OpenRouter 口径 0.09 / 0.34 / 0.05。

### 7. xAI (SpaceXAI) — Grok 4.7 (xhigh/high/low)
- 页面现值：2 / 6 / 0.5 / 2（估算）
- 核查值：官方短上下文（<200k）$2.00 / cached $0.50 / $6.00；长上下文（≥200k）$4/$1/$12
- 来源：https://docs.x.ai/developers/pricing 、https://docs.x.ai/docs/models（抓取于 2026-10-09）
- 判定：**正确**（取短上下文档）

### 8. Meta — Muse Spark 1.3 (max/xhigh)
- 页面现值：1.25 / 4.25 / 0.15 / 1.25（估算）
- 核查值：官方 muse-spark-1.3：$1.25 / cached $0.15 / $4.25（contributor 变体另有 $0.10/$0.002/$0.20）
- 来源：https://dev.meta.ai/models/muse-spark（抓取于 2026-10-09）
- 判定：**正确**

### 9. Meta — Muse Glimmer (high)
- 页面现值：0.325 / 1.35 / 0.04 / 0.325（估算）
- 核查值：无单一官方一手价页（dev.meta.ai Muse Glimmer 页未列价）；第三方：Fireworks $0.35/$1.50/cache $0.04；其他 $0.25–0.35 / $1.05–1.50
- 来源：https://dev.meta.ai/models/muse-glimmer（无价格） ；https://www.requesty.ai/models/fireworks/muse-glimmer-30b ；https://computeprices.com/providers/fireworks-ai/models/muse-glimmer（2026-10-09）
- 判定：**无法完全核实**——数值落在第三方报价区间内，cache 0.04 与 Fireworks 一致；但与任一单一来源均不完全相等。

### 10. Meta — Llama 4 Maverick
- 页面现值：0.25 / 0.87 / **0.24** / 0.25（估算）
- 核查值：Meta Model API 已停 Llama API（2026-07-06 退役），无官方单价页；第三方 input $0.15–0.27 / output $0.60–0.87（DeepInfra $0.20、Amazon Bedrock $0.24、Together $0.27/$0.85 等）
- 来源：https://artificialanalysis.ai/models/llama-4-maverick/providers ；https://pricepertoken.com/pricing-page/model/meta-llama-llama-4-maverick（2026-10-09）
- 判定：**无法核实（cache 疑似错误）**——0.25/0.87 落在第三方区间但非任何一家确切报价；cache read 0.24 ≈ 96%×input 异常（缓存价通常远低于 input），建议修正或标注来源。

### 11. Mistral — Mistral Large 3
- 页面现值：0.5 / 1.5 / 0.05 / 0.5（估算）
- 核查值：官方 $0.5 / cached $0.05 / $1.5
- 来源：https://docs.mistral.ai/inference/pricing（抓取于 2026-10-09）
- 判定：**正确**

### 12. Mistral — Mistral Medium 3.5
- 页面现值：1.5 / 7.5 / 0.15 / 1.5（估算）
- 核查值：官方 $1.5 / cached $0.15 / $7.5
- 来源：https://docs.mistral.ai/inference/pricing（2026-10-09）
- 判定：**正确**

### 13. Mistral — Mistral Small 4（及 non-reasoning）
- 页面现值：0.15 / 0.6 / 0.015 / 0.15（估算）
- 核查值：官方 $0.15 / cached $0.015 / $0.6
- 来源：https://docs.mistral.ai/inference/pricing（2026-10-09）
- 判定：**正确**

### 14–16. Mistral — Ministral 3 14B / 8B / 3B
- 页面现值：0.2/0.2/0.02；0.15/0.15/0.015；0.1/0.1/0.01（write 均为估算=input）
- 核查值：官方 14B $0.2/cached $0.02/$0.2；8B $0.15/$0.015/$0.15；3B $0.1/$0.01/$0.1
- 来源：https://docs.mistral.ai/inference/pricing（2026-10-09）
- 判定：全部**正确**

### 17. NVIDIA — Nemotron 3 Ultra
- 页面现值：0.6 / 2.5 / 0.16 / 0.6（估算）
- 核查值：NVIDIA 官方 build.nvidia.com serverless：**$0.90 / $1.70** per 1M（open-weight，第三方托管价分散）
- 来源：https://build.nvidia.com/nvidia/nemotron-3-ultra-550b-a55b（serverless 报价，2026-10-09 检索）
- 判定：**错误**——与 NVIDIA 官方 serverless 价不吻合（input 低 33%、output 高 47%）。更正建议：0.9 / 1.7（或标注所用第三方托管商）。

### 18. NVIDIA — Nemotron 3.5 Lightning
- 页面现值：0.06 / 0.2 / **0.05** / 0.06（估算）
- 核查值：无官方统一价；DeepInfra $0.05/$0.20；RunInfra $0.05/$0.01 cache/$0.15；OpenRouter $0.039/$0.18/cache $0.0195
- 来源：https://deepinfra.com/blog/nvidia-nemotron-3.5-lightning-release ；https://openrouter.ai/nvidia/nemotron-3.5-lightning ；https://runinfra.ai/inference-api/nemotron-3-5-lightning-30b（2026-10-09）
- 判定：input/output 落在第三方区间；**cache read 0.05 疑似错误**——高于 input 的 83%，远超任何托管商 cache 报价（$0.004–0.02 量级）。更正建议：0.006–0.0195 一档。

### 19. NVIDIA — Nemotron 3 Nano Omni 30B A3B
- 页面现值：0.3 / 0.9 / 0.1 / 0.3（估算）
- 核查值：NVIDIA 官方 serverless（build.nvidia.com）：**$0.10 / $0.25**
- 来源：https://build.nvidia.com/nvidia/nemotron-3-nano-omni-30b-a3b-reasoning（2026-10-09 检索）
- 判定：**错误**——input/output 均约为官方 serverless 价 3 倍。更正建议：0.10 / 0.25（cache 按惯例约 $0.01–0.025）。

### 20. Amazon — Nova Micro
- 页面现值：0.035 / 0.14 / **0.00875** / 0.035（write 估算=input）
- 核查值：Bedrock 官方 on-demand $0.035/$0.14（✓）；但 Bedrock 平台缓存规则：**cache read = 0.1×input = $0.0035，cache write = 1.25×input = $0.04375**
- 来源：https://aws.amazon.com/bedrock/pricing/ ；https://www.cloudzero.com/blog/amazon-bedrock-pricing/ ；缓存倍率 https://medium.com/@niklas-palm/prompt-caching-with-bedrock-and-anthropic-models-demystified-72261d269845 等（2026-10-09）
- 判定：input/output **正确**；**cache read 错误**（0.00875 = 0.25×input，应为 0.0035）；cache write 的「=input」估算也不符合 Bedrock 1.25× 规则（应为 0.04375）。该错误被 DEFAULT_MIX 放大：cacheRead 权重 96.7%，pblend 0.00993 → 按官方规则应为 ≈0.00508，虚高约 95%。

### 21. IBM — Granite 4.2 30B / 8B / 3B
- 页面现值：0.16/0.65/0.04；0.06/0.25/0.015；0.03/0.12/0.0075（write 均估算=input）
- 核查值：IBM 无统一官方 API 单价页（watsonx 按容量+token 计价）；第三方：30B $0.16/$0.65（ArtificialAnalysis 中位数）；8B DeepInfra $0.06/$0.25/cache $0.015（完全一致）；3B DeepInfra blended ≈$0.02，与 0.03/0.12/0.0075 在 AA 7:2:1 口径下吻合（0.023）
- 来源：https://artificialanalysis.ai/models/granite-4-2-30b ；https://deepinfra.com/ibm-granite/granite-4.2-8b ；https://artificialanalysis.ai/models/granite-4-2-3b/providers ；https://www.ibm.com/products/watsonx-ai/pricing（2026-10-09）
- 判定：**与第三方托管价一致（推断 DeepInfra 口径）**，30B/8B 基本正确，3B 一致性验证通过；建议页面标注托管商来源。

### 22. Inception — Mercury 2.5
- 页面现值：0.25 / 0.75 / 0.025 / 0.25（估算）
- 核查值：Inception 官方 docs：Mercury 2.5 list **$0.20 input / $0.02 cached / $0.75 output**（当前促销 $0.04/$0.004/$0.15）。页面 0.25/0.75 实为 **Mercury 2** 的定价。
- 来源：https://docs.inceptionlabs.ai/get-started/models ；https://www.inceptionlabs.ai/models ；https://openrouter.ai/inception/mercury-2（2026-10-09）
- 判定：**错误**——张冠李戴。更正：pin 0.20 / pcache 0.02 / pout 0.75（如取促销价则 0.04/0.004/0.15，需标注）。

### 23. Sarvam — Sarvam 105B (high)
- 页面现值：0.042 / 0.17 / 0.026 / 0.042（估算）
- 核查值：Sarvam 官方（₹/1M）：₹29.28 / cached ₹10.98 / ₹73.2；按 USD/INR ≈ 96.79（2026-10-08）折算 ≈ **$0.30 / $0.11 / $0.76**
- 来源：https://docs.sarvam.ai/api/getting-started/pricing ；汇率 https://wise.com/us/currency-converter/usd-to-inr-rate/history（2026-10-09）
- 判定：**错误（严重）**——input 低约 7 倍、output 低约 4.4 倍、cache 低约 4 倍。更正：0.30 / 0.11 / 0.76。

### 24. Sarvam — Sarvam 30B (high)
- 页面现值：0.026 / 0.11 / 0.016 / 0.026（估算）
- 核查值：Sarvam 官方定价页仅列 Sarvam 105B / 105B Chat（及托管的 Gemma 4 31B、GLM-5.3、DeepSeek V4 Flash），**无 Sarvam 30B**
- 来源：https://docs.sarvam.ai/api/getting-started/pricing（2026-10-09）
- 判定：**无法核实**（官方价目表无此模型名；数值模式与 105B 行同样偏低，存疑）。

### 25. Apodex — Apodex 1.1
- 页面现值：0.3 / 3 / 0.03 / 0.3（估算）
- 核查值：官方 $0.30 input / $0.03 cached / $3.00 output（>200k 请求 2× 计价）
- 来源：https://platform.apodex.ai/docs/pricing（抓取于 2026-10-09）
- 判定：**正确**

### 26–27. Thinking Machines — Inkling (xhigh) / Inkling Small
- 页面现值：xhigh 1 / 4.05 / 0.17；Small 0.3 / 1.2 / 0.06（write 均估算=input）
- 核查值：Inkling xhigh $1/$4.05 多源一致；cache 无一手官方页，但 AA blended 口径（70% cache hit / 20% input / 10% output）下：0.7×0.17+0.2×1+0.1×4.05 = $0.724 ≈ AA 报的 $0.72 ✓；Small 同法 0.7×0.06+0.2×0.3+0.1×1.2 = $0.222 ≈ AA 报的 $0.22 ✓（OpenRouter 的第三方 input $0.45 与页面不一致，疑为不同 provider）
- 来源：https://tryaii.com/benchmarks/thinkingmachines%2Finkling ；https://artificialanalysis.ai/providers/thinking-machines ；https://openrouter.ai/thinkingmachines/inkling-small（2026-10-09）
- 判定：**正确（间接验证通过）**；cache 单价建议补一手来源。

---

## 二、无价格数据行（本块 75 行，无可核对象）

Cohere（Command A+、Command A、North Mini Code、Tiny Aya Global）、LG AI Research（EXAONE 全系、K-EXAONE 2.0）、Upstage（Solar 全系）、SK Telecom A.X-K2、Trillion Labs Tri-21B-Think、ServiceNow Apriel-v1.6-15B-Thinker、AI21（Jamba 1.7 Large/Mini、Jamba Reasoning 3B）、Reka Flash 3、TII Falcon-H1R-7B、Microsoft（Phi-4、Phi-4 Mini、Phi-4 Multimodal）、Naver HyperCLOVA X SEED Think、Korea Telecom Mi:dm K 2.5 Pro、Multiverse Computing（Quasar 438B、HyperNova 60B）、Motif（Motif 3、Motif-2-12.7B）、Amazon Nova 2.0 全系/Nova Premier、NVIDIA 其余（Nemotron 3 Super/Nano/Cascade、Llama Nemotron Ultra、Nano 9B/12B VL）、Google Gemma 4 12B/E2B/E4B/DiffusionGemma/270M、Gemini 3 Deep Think、Meta 其余 Llama 3.x/4 Scout 等 —— pin/pout/pcache/pcacheWrite 全为 null，页面本身即「缺价」状态，无需核对，无错误。

---

## 三、DEFAULT_MIX 权重与加权价算术

1. **权重**：DEFAULT_MIX = input 0.4 / cacheRead 96.7 / cacheWrite 2.6 / output 0.3，合计 **100.0** ✓（`validateMix` 亦强制合计=100）。
2. **合理性**：cacheRead 占 96.7% 是极端 agentic 长上下文口径（与 SemiAnalysis 订阅满额分析同源），数学上自洽。注意：该口径下有效价 ≈ 0.967×pcache，**对 cache read 单价误差放大 ~97 倍权重**——上表 Nova Micro、Gemma 4 31B、Nemotron Lightning、Llama 4 Maverick 的 cache 误差会主导其混合价。
3. **pblend 逐行验算**：对全部 37 行含价数据重算 `0.4×pin/100 + 96.7×pcache/100 + 2.6×pcacheWrite/100 + 0.3×pout/100`，与页面 pblend 全部一致（<1e-9）✓。抽样：Grok 4.7 = 0.5615 ✓；Gemini 3.1 Pro = 0.2894 ✓；Nemotron 3.5 Lightning = 0.05075 ✓。
4. **cacheWrite 引用规则**：非 Anthropic 一律「cache write = input」估算并带 `pcacheWriteSource` 标注。对 Bedrock（1.25×）等有明确写入倍率的厂商是系统性近似，页内已自我声明为估算，不算隐藏错误，但 Nova Micro 的 read 价仍应按 0.1× 修正。

## 四、全局单位一致性

1. **单价单位**：全部 pin/pout/pcache/pcacheWrite 为 $/M tok，数量级与各官方页逐一吻合（$0.01–$7.5 区间），无混入 per-1K 或 ₹ 未折算条目（Sarvam 页面值与 ₹ 直接当 $ 用也不符，见其判定为错误）。
2. **per-task 换算**：`costOf`（L1617–1623）在 perTask 时 = `rate × m.tok / 1e6`，抽样验算 3 个模型：
   - Grok 4.7 (xhigh)：0.5615 × 80561.36 / 1e6 = **0.045235 $/task** ✓
   - Gemini 3.1 Pro Preview：0.2894 × 18112.30 / 1e6 = **0.005242 $/task** ✓
   - Granite 4.2 8B：0.017055 × 33398.71 / 1e6 = **0.000570 $/task** ✓
3. **ROWS_RAW 的 `cost` 字段**：为基准实测成本，不参与 costOf（costOf 实时由单价计算），故「cost 与 pblend×tok/1e6 不等」不是单位错误。轴标题双量纲提示（$/M tok ↔ $/task）与实现一致。
4. **订阅倍率**：SUBSCRIPTION_PRICING_RUNTIME 中 Meta（Muse Spark 1.3 ×51.3）、SpaceXAI（Grok 4.7 ×19.4）仅影响订阅视图价格，倍率为任务给定估算值，无官方承诺，代码已标注 provenance=「Task-provided」。无法核实倍率本身，未见算术错误。

---

## 五、发现的错误清单

1. **Sarvam 105B（严重）**：页面 0.042/0.17/0.026 → 官方折算应为 **0.30/0.11/0.76**（input 低 ~7×，output 低 ~4.4×）。来源 docs.sarvam.ai + USD/INR 96.79。
2. **Mercury 2.5（张冠李戴）**：页面 0.25/0.75/0.025 是 Mercury 2 的价；Mercury 2.5 官方应为 **0.20/0.02/0.75**（促销期 0.04/0.004/0.15）。
3. **Nemotron 3 Ultra**：页面 0.6/2.5 → NVIDIA 官方 serverless **0.90/1.70**。
4. **Nemotron 3 Nano Omni 30B A3B**：页面 0.3/0.9 → NVIDIA 官方 serverless **0.10/0.25**（高估 3 倍）。
5. **Nova Micro cache read**：页面 0.00875 → Bedrock 规则 0.1×input = **0.0035**（cache write 亦应为 1.25×input = 0.04375，而非估算的 =input）。在 96.7% cacheRead 权重下该错使 Nova Micro 混合价虚高约 95%。
6. **Gemma 4 31B（cache 异常）**：cache read 0.14 ≈ 85%×input，无任何厂商此惯例；官方 API 无价，第三方口径 0.09/0.34/0.05。input/output 也偏高。
7. **Gemma 4 26B A4B（疑似偏高）**：页面 0.1/0.37 高于全部第三方托管价（0.042–0.07 / 0.22–0.34），官方无价。
8. **Nemotron 3.5 Lightning cache read**：0.05 ≈ 83%×input，各托管商 cache 报价 $0.004–0.02，疑似错误。
9. **Llama 4 Maverick cache read**：0.24 ≈ 96%×input，无官方源，疑似错误（第三方区间 $0.15–0.27 / $0.60–0.87）。
10. **Sarvam 30B**：官方价目表无此模型，页面值无法核实，与 105B 同模式偏低，存疑。
11. **时限性标注缺失（非数值错误）**：Gemini 3.8 Flash（促销至 2026-12-31，之后翻倍）与 Gemini 4 Argon（导入期 $2/$10，标准 $4/$20）建议在页面标注价格有效期，否则 2027-01 起整表系统性偏低。

正确核实清单（供对照）：Gemini 3.8 Flash / 3.1 Pro Preview / 3.5 Flash-Lite / 4 Argon、Grok 4.7、Muse Spark 1.3、Mistral Large 3 / Medium 3.5 / Small 4 / Ministral 3 全系、Nova Micro input+output、Granite 4.2 30B/8B（3B 一致性通过）、Apodex 1.1、Inkling xhigh/Small（间接验证）。Muse Glimmer 数值在第三方区间内、无单一官方源。
