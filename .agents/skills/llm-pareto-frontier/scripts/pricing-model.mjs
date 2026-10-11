export const DEFAULT_MIX = Object.freeze({ input: 0.4, cacheRead: 96.7, cacheWrite: 2.6, output: 0.3 });

const model = (multiplier, provenance = "snapshot", note = "") => ({ multiplier, provenance, note });
const plan = (id, label, monthlyUsd, models, extra = {}) => ({ id, label, monthlyUsd, models, ...extra });
const channel = (label, kind, vendors, group) => ({ label, kind, vendors, ...(group ? { group } : {}) });

// Cursor 官方把 Grok 4.7/4.6/4.5 与 Composer 2.5 归入同一个共享 "Cursor models" 池；
// 下表倍率来自用户截图估值（非官方、未经证实），是池级份额，不是每模型独立额度。
const cursorPool = (multiplier, note) => Object.fromEntries(
  ["Grok 4.7", "Grok 4.6", "Grok 4.5", "Composer 2.5"].map(name => [name, model(multiplier, "estimated", note)]));

export const SUBSCRIPTION_REGISTRY = Object.freeze({
  OpenAI: {
    source: "Astra and GPT-6.1 Sol plan-equivalent estimates supplied in the task; agentic full-quota estimates, not an official guarantee.",
    sourceDate: "2026-09-29",
    sourceUrl: "https://newsletter.semianalysis.com/p/anthropic-subscriptions-offer-5x",
    channel: channel("OpenAI", "vendor", ["OpenAI"]),
    plans: [
      plan("plus", "Plus · $20/mo", 20, {
        "GPT-6 Astra": model(8.1), "GPT-6.1 Sol": model(10.6),
      }),
      plan("pro100", "Pro · $100/mo", 100, {
        "GPT-6 Astra": model(13.2), "GPT-6.1 Sol": model(10.6),
      }),
      plan("pro200", "Pro · $200/mo", 200, {
        "GPT-6 Astra": model(14.5), "GPT-6.1 Sol": model(10.4),
      }),
      plan("pro500", "Pro · $500/mo", 500, {
        "GPT-6 Astra": model(13.9), "GPT-6.1 Sol": model(5386 / 500),
      }),
    ],
    inheritedMultiplier: { from: "GPT-6.1 Sol", provenance: "inherited" },
  },
  Anthropic: {
    source: "SemiAnalysis newsletter and 2026-09-29 snapshot; estimated agentic full-quota usage, not official guarantees.",
    sourceDate: "2026-09-29",
    sourceUrl: "https://newsletter.semianalysis.com/p/anthropic-subscriptions-offer-5x",
    channel: channel("Anthropic", "vendor", ["Anthropic"]),
    plans: [
      plan("pro20", "Pro · $20/mo", 20, {
        "Claude Opus 5.5": model(58.9),
        "Claude Sonnet 5.5": model(62.6 * 58.9 / 58.6, "fitted", "Fitted from Max20x multiplier ratio."),
      }),
      plan("max5x100", "Max 5x · $100/mo", 100, {
        "Claude Opus 5.5": model(57.3),
        "Claude Sonnet 5.5": model(62.6 * 57.3 / 58.6, "fitted", "Fitted from Max20x multiplier ratio."),
        "Claude Fable 5.1": model(12.7),
      }),
      plan("max20x200", "Max 20x · $200/mo", 200, {
        "Claude Opus 5.5": model(58.6),
        "Claude Sonnet 5.5": model(62.6),
        "Claude Fable 5.1": model(12.4),
      }),
    ],
    quotaNote: "Claude Fable 5.1 uses at most half the plan quota.",
  },
  "Z AI": {
    source: "Task-provided GLM plan estimates; subscription access does not imply official per-token rates.",
    sourceDate: "2026-09-29",
    channel: channel("Z AI", "vendor", ["Z AI"]),
    plans: [
      plan("lite18", "Lite · $18/mo", 18, { "GLM-5.3": model(7.7), "GLM-5.3-Flash": model(1.3) }),
      plan("pro80", "Pro · $80/mo", 80, { "GLM-5.3": model(10.4), "GLM-5.3-Flash": model(1.8) }),
      plan("max168", "Max · $168/mo", 168, { "GLM-5.3": model(11.6), "GLM-5.3-Flash": model(2.0) }),
    ],
  },
  MiniMax: {
    source: "Task-provided MiniMax plan estimates.", sourceDate: "2026-09-29",
    channel: channel("MiniMax", "vendor", ["MiniMax"]),
    plans: [
      plan("plus22", "Plus · $22/mo", 22, { "MiniMax-M3": model(19.4) }),
      plan("max55", "Max · $55/mo", 55, { "MiniMax-M3": model(23.7) }),
      plan("ultra132", "Ultra · $132/mo", 132, { "MiniMax-M3": model(23.4) }),
    ],
  },
  Kimi: {
    source: "Task-provided Kimi plan estimates.", sourceDate: "2026-09-29",
    channel: channel("Kimi", "vendor", ["Kimi"]),
    plans: [
      plan("plus19", "Plus · $19/mo", 19, { "Kimi K3": model(2.5) }),
      plan("pro39", "Pro · $39/mo", 39, { "Kimi K3": model(5.4) }),
      plan("max99", "Max · $99/mo", 99, { "Kimi K3": model(6.5) }),
      plan("ultra199", "Ultra · $199/mo", 199, { "Kimi K3": model(6.7) }),
    ],
  },
  Meta: {
    source: "Task-provided Meta plan estimate.", sourceDate: "2026-09-29",
    channel: channel("Meta", "vendor", ["Meta"]),
    plans: [plan("power50", "PowerUsage · $50/mo", 50, { "Muse Spark 1.3": model(51.3) })],
  },
  SpaceXAI: {
    source: "xAI SuperGrok official plan page plus the task-provided Heavy full-quota estimate.",
    sourceDate: "2026-10-11",
    sourceUrl: "https://x.ai/pricing",
    channel: channel("xAI · SuperGrok", "vendor", ["SpaceXAI"], "grok"),
    plans: [
      plan("supergrok30", "SuperGrok · $30/mo", 30, {
        "Grok 4.6": model(null, "unknown", "官方页确认包含 Grok 4.6，但未公布可折算额度；仅渲染访问权，按 API 原价。"),
      }, {
        source: "xAI 官方定价页：SuperGrok $30/mo，明确列出 Grok 4.6。",
        sourceDate: "2026-10-11",
        sourceUrl: "https://x.ai/pricing",
        quotaNote: "官方 FAQ：Chat/Imagine/Voice/Build 共享一份每周额度，以百分比显示、按产品消耗算力。用户截图情景 $80/周 → $80×52/12÷30 ≈ 11.6× 为估算，未采用；倍率保持未知。",
      }),
      plan("heavy300", "SuperGrok Heavy · $300/mo", 300, {
        "Grok 4.7": model(19.4, "snapshot", "任务提供的 Heavy 满额估算，沿用原值。"),
      }, {
        source: "任务提供的 Heavy $300 满额估算（非官方）。",
        sourceDate: "2026-09-29",
        quotaNote: "Heavy 官方页未展示价格；$300 与 19.4× 均为任务快照估算。",
      }),
    ],
  },
  Cursor: {
    source: "Cursor 官方模型与定价文档：Pro/Pro Plus/Ultra 共用 'Cursor models' 池（Grok 4.7/4.6/4.5、Composer 2.5）。下表倍率为用户截图估值，非官方额度。",
    sourceDate: "2026-10-11",
    sourceUrl: "https://cursor.com/docs/models-and-pricing",
    channel: channel("Cursor", "reseller", ["Cursor", "SpaceXAI"], "grok"),
    plans: [
      plan("cursor-pro20", "Cursor Pro · $20/mo", 20, cursorPool(450 / 20, "用户截图估值：Pro 共享池 ≈ $450/月 ÷ $20。非官方、未经证实；共享池，非每模型独立额度。"), {
        source: "用户截图估值：Pro 共享池 ≈ $450/月。Cursor 官方未公布数值额度。",
        sourceDate: "2026-10-11",
        sourceUrl: "https://cursor.com/docs/models-and-pricing",
        quotaNote: "共享池（Grok 4.7/4.6/4.5 + Composer 2.5 共吃一份），非每模型独立额度；用户估算，非官方。",
      }),
      plan("cursor-proplus60", "Cursor Pro Plus · $60/mo", 60, cursorPool(1200 / 60, "用户截图估值：Pro Plus 共享池 ≈ $1200/月 ÷ $60。非官方、未经证实；共享池，非每模型独立额度。"), {
        source: "用户截图估值：Pro Plus 共享池 ≈ $1200/月。Cursor 官方未公布数值额度。",
        sourceDate: "2026-10-11",
        sourceUrl: "https://cursor.com/docs/models-and-pricing",
        quotaNote: "共享池，非每模型独立额度；用户估算，非官方。",
      }),
      plan("ultra200", "Cursor Ultra · $200/mo", 200, cursorPool(3000 / 200, "原 Composer 2.5 单独估值 15.2× 与用户截图 Ultra 共享池 $3000/200=15× 冲突；此处按共享池 15×，偏差 -0.2×，作为偏离记录。"), {
        source: "用户截图估值：Ultra 共享池 ≈ $3000/月。Cursor 官方未公布数值额度。",
        sourceDate: "2026-10-11",
        sourceUrl: "https://cursor.com/docs/models-and-pricing",
        quotaNote: "共享池，非每模型独立额度；用户估算，非官方。原 Composer 2.5 单独估值 15.2× 已并入共享池 15×（见倍率明细）。",
      }),
    ],
  },
  OpenCode: {
    source: "OpenCode 官方 Go 文档：Go $10/mo、Go Plus $40/mo；限额定为美元金额，按模型给出月度上限；费率与 Go/Go Plus 相同。",
    sourceDate: "2026-10-11",
    sourceUrl: "https://opencode.ai/docs/go/",
    channel: channel("OpenCode Go", "aggregator", ["SpaceXAI"]),
    plans: [
      plan("go10", "OpenCode Go · $10/mo", 10, {
        "Grok 4.7": model(15 / 10, "snapshot", "$15 模型额度 ÷ $10 月费；OpenCode 显示计量上限比，非现金 API 额度、非计划级通用倍率。"),
        "Grok 4.6": model(15 / 10, "snapshot", "$15 模型额度 ÷ $10 月费；仅 4.6/4.7 已证实，其余模型不适用。"),
        "GLM-5.3": model(15 / 10, "snapshot", "$15 模型月额 ÷ $10 月费；官方 input/cache-read/output 三费率与图内一致，官方未单列 cache write。"),
        "Kimi K3": model(15 / 10, "snapshot", "$15 模型月额 ÷ $10 月费；官方三费率与图内一致，官方未单列 cache write。"),
        "MiniMax-M3": model(60 / 10, "snapshot", "官方列名 MiniMax M3（标点归一）；$60 模型月额 ÷ $10 月费；官方三费率与图内一致。"),
        "GPT-6 Luna": model(15 / 10, "estimated", "$15 模型月额 ÷ $10 月费；官方 cache write $0.125 与图内估算 $0.10 不同，四字段非全一致，按估算标注。"),
        "LongCat 2.0": model(60 / 10, "snapshot", "$60 模型月额 ÷ $10 月费；官方三费率与图内一致。"),
        "MiMo-V2.6-Flash": model(60 / 10, "snapshot", "官方列名 MiMo-V2.6-Flash；$60 模型月额 ÷ $10 月费；官方三费率与图内一致。"),
        "DeepSeek V4.1 Flash": model(null, "unknown", "官方费率分峰/谷时段，图内为峰值价，不设固定倍率；仅渲染访问权按 API 原价。条件上限比（仅峰段费率下）：Go 60/10=6×、Go Plus 120/40=3×。"),
      }, {
        source: "OpenCode Go 官方文档：限额定为美元金额，滚动 5 小时为月额 20%、每周 50%。已证实映射：Grok 4.7/4.6、GLM-5.3、Kimi K3、MiniMax M3、GPT 6 Luna（估算）、LongCat 2.0、MiMo-V2.6-Flash；DeepSeek V4.1 Flash 分时段，仅记录条件上限比。",
        sourceDate: "2026-10-11",
        sourceUrl: "https://opencode.ai/docs/go/",
        quotaNote: "计量上限比，非现金额度；窗口受限；仅逐模型已证实项适用。GLM-5.3-Flash 官方费率与图内不一致、Claude Haiku 5.5 是另一代模型（严禁映射 Claude 4.5 Haiku）、MiMo-V2.6-Pro cache-read 差 $0.000025/M、其余官方在售模型（GLM-5.3 FlashX、Qwen3.8 系、DeepSeek V4 系、Hy3、GPT-6 Astra/Sol 等）名称或费率不匹配，均不建映射、保持 API 原价。",
      }),
      plan("goPlus40", "OpenCode Go Plus · $40/mo", 40, {
        "Grok 4.7": model(60 / 40, "snapshot", "$60 模型额度 ÷ $40 月费；与 Go 同费率、额度更高。"),
        "Grok 4.6": model(60 / 40, "snapshot", "$60 模型额度 ÷ $40 月费；与 Go 同费率、额度更高。"),
        "GLM-5.3": model(120 / 40, "snapshot", "$120 模型月额 ÷ $40 月费；官方三费率与图内一致。"),
        "Kimi K3": model(60 / 40, "snapshot", "$60 模型月额 ÷ $40 月费；官方三费率与图内一致。"),
        "MiniMax-M3": model(180 / 40, "snapshot", "官方列名 MiniMax M3；$180 模型月额 ÷ $40 月费；官方三费率与图内一致。"),
        "GPT-6 Luna": model(60 / 40, "estimated", "$60 模型月额 ÷ $40 月费；官方 cache write $0.125 与图内估算 $0.10 不同，四字段非全一致，按估算标注。"),
        "LongCat 2.0": model(240 / 40, "snapshot", "$240 模型月额 ÷ $40 月费；官方三费率与图内一致。"),
        "MiMo-V2.6-Flash": model(120 / 40, "snapshot", "$120 模型月额 ÷ $40 月费；官方三费率与图内一致。"),
        "DeepSeek V4.1 Flash": model(null, "unknown", "官方费率分峰/谷时段，不设固定倍率；条件上限比（仅峰段）：Go Plus 120/40=3×。"),
      }, {
        source: "OpenCode Go Plus $40/mo：费率与 Go 相同、各模型月额更高；滚动窗口规则同 Go。已证实映射集同 go10（比例按各自月额 ÷ $40）。",
        sourceDate: "2026-10-11",
        sourceUrl: "https://opencode.ai/docs/go/",
        quotaNote: "计量上限比，非现金额度；窗口受限；不适用/不匹配模型同 go10 备注，保持 API 原价。",
      }),
    ],
  },
  CommandCode: {
    source: "Command Code 官方 GOAT 文档：GOAT $10/mo；按模型行列出月度额度与费率。",
    sourceDate: "2026-10-11",
    sourceUrl: "https://commandcode.ai/docs/plans/goat",
    channel: channel("Command Code GOAT", "aggregator", ["SpaceXAI"]),
    plans: [
      plan("goat10", "Command Code GOAT · $10/mo", 10, {
        "Grok 4.7": model(20 / 10, "snapshot", "$20 模型行额度 ÷ $10 月费；按模型行，不可与计划级 7× 混用。"),
        "Grok 4.6": model(20 / 10, "snapshot", "$20 模型行额度 ÷ $10 月费；与 4.7 同一规则。"),
        "Grok 4.5": model(null, "unknown", "官方表列 $20，但缓存价与 xAI 当前 API 不一致，未证实；仅渲染访问权，按 API 原价。"),
        "GLM-5.3": model(20 / 10, "snapshot", "$20 模型行额度 ÷ $10 月费；官方三费率与图内一致。"),
        "Kimi K3": model(20 / 10, "snapshot", "$20 模型行额度 ÷ $10 月费；官方三费率与图内一致。"),
        "MiniMax-M3": model(47 / 10, "conditional", "官方行列名 'MiniMax M3-50%'：仅在其 50% 折扣价带（$0.30/$0.06/$1.20，与图内一致）下 $47 ÷ $10 成立；全额价带 $0.60/$0.12/$2.40 下不成立。"),
        "LongCat 2.0": model(50 / 10, "snapshot", "$50 模型行额度 ÷ $10 月费；官方三费率与图内一致。"),
        "Step 5 Preview": model(20 / 10, "snapshot", "$20 模型行额度 ÷ $10 月费；GOAT 费率与图内一致；OpenCode 同名行为临时免费，不适用。"),
        "MiMo-V2.6-Flash": model(20 / 10, "snapshot", "官方列名 MiMo V2.6 Flash（标点归一）；$20 ÷ $10；费率与图内一致。"),
        "MiMo-V2.6-Pro": model(20 / 10, "snapshot", "官方列名 MiMo V2.6 Pro；$20 ÷ $10；GOAT cache-read $0.0036 与图内一致（OpenCode 同模型 cache-read 差 $0.000025/M，故 Go/Go Plus 无比例）。"),
        "Qwen3.7 Plus": model(33 / 10, "estimated", "官方列名 Qwen 3.7 Plus；$33 ÷ $10；官方 cache write $0.50 与图内估算 $0.40 不同，四字段非全一致，按估算标注。OpenCode 同模型 cache-read $0.04 与图内 $0.08 不一致，故 Go/Go Plus 无比例。"),
        "Muse Spark 1.3": model(20 / 10, "snapshot", "$20 模型行额度 ÷ $10 月费；GOAT 费率与图内一致；OpenCode 同名行为 Contributor 变体（费率不同），不适用。"),
        "GPT-6 Luna": model(20 / 10, "estimated", "$20 模型行额度 ÷ $10 月费；官方 cache write $0.125 与图内估算 $0.10 不同，四字段非全一致，按估算标注。"),
        "DeepSeek V4.1 Flash": model(null, "unknown", "官方费率分峰/谷时段，不设固定倍率；条件上限比（仅峰段）：GOAT 60/10=6×。"),
      }, {
        source: "Command Code GOAT 官方文档：$10 购买最高 $70 额度；按模型行月度额度；共享窗口 $14/5h、$35/周、$70/月。已证实映射：Grok 4.7/4.6、GLM-5.3、Kimi K3、LongCat 2.0、Step 5 Preview、MiMo V2.6 Flash/Pro、Muse Spark 1.3；MiniMax M3 仅 50% 价带（条件）；GPT 6 Luna、Qwen 3.7 Plus 为估算；DeepSeek V4.1 Flash 分时段仅记录条件上限比。",
        sourceDate: "2026-10-11",
        sourceUrl: "https://commandcode.ai/docs/plans/goat",
        quotaNote: "按模型行额度上限比，非计划级 7×；模型行不叠加；共享窗口受限。GLM-5.3 Flash（图内 cache-read $0.026 与官方 $0.03 不一致）、Claude Haiku 5.5（另一代模型，严禁映射 Claude 4.5 Haiku）、GLM-5.3 FlashX、DeepSeek V4 Pro/V4 Flash/Fast/Vision、Hy3、Qwen 3.8 27B/Max、GPT-6 Astra/Sol 等名称或费率不匹配，不建映射、保持 API 原价。",
      }),
    ],
  },
});

export function cacheWriteQuote(input, creator) {
  if (!Number.isFinite(input) || input < 0) return { rate: null, source: null };
  return creator === "Anthropic"
    ? { rate: input * 1.25, source: "官方规则折算：5-minute cache write = 1.25×input；https://platform.claude.com/docs/en/about-claude/pricing" }
    : { rate: input, source: "估算：cache write = input；未获独立写入报价，非实测。" };
}

const channelKey = creator => creator === "xAI" ? "SpaceXAI" : creator;

function hasOfficialSubscription(registry, creator, base) {
  const key = channelKey(creator);
  return Object.values(registry).some(config => {
    if (config.channel?.kind !== "vendor") return false;
    if (config.plans.some(item => Object.hasOwn(item.models, base))) return true;
    const inherited = config.inheritedMultiplier;
    return !!(inherited && config.channel.vendors.includes(key)
      && config.plans.some(item => Object.hasOwn(item.models, inherited.from)));
  });
}

export function channelBars(registry = SUBSCRIPTION_REGISTRY, resolveCreator = null) {
  const grouped = new Map();
  const bars = [];
  for (const [id, config] of Object.entries(registry)) {
    if (config.channel?.kind === "aggregator") continue;
    const meta = config.channel;
    const group = meta?.group;
    let bar = group ? grouped.get(group) : null;
    if (!bar) {
      bar = { id, label: "", kind: meta?.kind ?? "vendor", vendors: [], channels: [], plans: [] };
      if (group) grouped.set(group, bar);
      bars.push(bar);
    }
    bar.channels.push({ id, label: meta?.label ?? id, kind: meta?.kind ?? "vendor", config });
    for (const item of config.plans) bar.plans.push({ ...item, channelId: id, channelLabel: meta?.label ?? id });
  }
  for (const bar of bars) {
    bar.label = bar.channels.map(ch => ch.label).join(" / ");
    bar.vendors = [...new Set(bar.channels.flatMap(ch => ch.config.channel?.vendors ?? [ch.id]))];
  }
  for (const [id, config] of Object.entries(registry)) {
    if (config.channel?.kind !== "aggregator") continue;
    const label = config.channel.label ?? id;
    const plans = config.plans.map(item => ({ ...item, channelId: id, channelLabel: label,
      servedModels: Object.keys(item.models).filter(base => !hasOfficialSubscription(registry, resolveCreator?.(base), base)),
    }));
    const servedModels = [...new Set(plans.flatMap(item => item.servedModels))];
    bars.push({ id, label, kind: "aggregator", vendors: [], plans,
      channels: [{ id, label, kind: "aggregator", config, servedModels }],
    });
  }
  return bars;
}

export function resolveSelection(bars, selection, creator, modelName) {
  const key = channelKey(creator);
  const base = String(modelName).replace(/\s*\([^)]*\)\s*$/, "").trim();
  for (const bar of bars) {
    if (bar.kind === "aggregator") {
      const selectedPlan = bar.plans.find(item => item.id === selection?.[bar.id]);
      if (selectedPlan?.servedModels.includes(base)) {
        return { barId: bar.id, channelId: selectedPlan.channelId, planId: selectedPlan.id };
      }
      continue;
    }
    if (!bar.vendors.includes(key)) continue;
    const stored = selection?.[bar.id] ?? bar.channels.map(ch => selection?.[ch.id]).find(Boolean);
    if (!stored) continue;
    const owner = bar.channels.find(ch => ch.config.plans.some(item => item.id === stored));
    if (!owner) continue;
    const selectedPlan = owner.config.plans.find(item => item.id === stored);
    const inherited = owner.config.inheritedMultiplier;
    const applies = selectedPlan.models[base] || (inherited && selectedPlan.models[inherited.from]);
    if (!applies) continue;
    return { barId: bar.id, channelId: owner.id, planId: selectedPlan.id };
  }
  return null;
}

export function normalizeSelections(bars, selection) {
  const out = {};
  const claimed = new Set();
  let aggregatorSelected = false;
  for (const bar of bars) {
    const aggregator = bar.kind === "aggregator";
    if (aggregator ? aggregatorSelected : bar.vendors.some(vendor => claimed.has(vendor))) continue;
    const memberStored = aggregator ? null : bar.channels.map(ch => selection?.[ch.id]).find(Boolean);
    const stored = selection?.[bar.id] ?? memberStored;
    if (!stored || !bar.plans.some(item => item.id === stored)) continue;
    out[bar.id] = stored;
    if (aggregator) aggregatorSelected = true;
    else bar.vendors.forEach(vendor => claimed.add(vendor));
  }
  return out;
}

export function createPricingEngine(registry = SUBSCRIPTION_REGISTRY) {
  // channelId 显式给出时只在该渠道内匹配；缺省时退回 creator 自身渠道（旧调用兼容）。非 aggregator
  // 渠道须在 channel.vendors 内含该 creator（xAI 归一到 SpaceXAI），拒绝用别的 creator 的渠道重定价。
  function mappingFor(creator, modelName, planId, channelId) {
    const repoKey = channelKey(channelId ?? creator);
    const provider = registry[repoKey];
    const selectedPlan = provider?.plans.find(item => item.id === planId);
    if (!provider || !selectedPlan) return null;
    if (channelId && provider.channel?.kind !== "aggregator"
      && !(provider.channel?.vendors ?? []).includes(channelKey(creator))) return null;
    const base = String(modelName).replace(/\s*\([^)]*\)\s*$/, "").trim();
    if (provider.channel?.kind === "aggregator" && hasOfficialSubscription(registry, creator, base)) return null;
    const direct = selectedPlan.models[base];
    if (direct) return { ...direct, base, plan: selectedPlan, provider, channelId: repoKey };
    const inherited = provider.inheritedMultiplier;
    if (!inherited) return null;
    const fromPlanModel = selectedPlan.models[inherited.from];
    if (!fromPlanModel) return null;
    return { multiplier: fromPlanModel.multiplier, provenance: inherited.provenance, note: `Inherited from ${inherited.from}.`, base, plan: selectedPlan, provider, channelId: repoKey };
  }

  function rateFor(apiRate, creator, modelName, planId, channelId) {
    if (!Number.isFinite(apiRate) || apiRate < 0) return null;
    const mapping = mappingFor(creator, modelName, planId, channelId);
    const multiplier = mapping && Number.isFinite(mapping.multiplier) && mapping.multiplier > 0 ? mapping.multiplier : null;
    return { apiRate, rate: multiplier ? apiRate / multiplier : apiRate, mapping };
  }

  function effectiveRates(rates, creator, modelName, planId, channelId) {
    return Object.fromEntries(Object.entries(rates).map(([key, item]) => {
      const apiRate = typeof item === "number" ? item : item?.rate;
      const source = typeof item === "number" ? "observed" : item?.source ?? "observed";
      const priced = rateFor(apiRate, creator, modelName, planId, channelId);
      return [key, priced ? { ...priced, key, apiSource: source } : null];
    }));
  }

  function mixedRate(rates, mix) {
    if (!isValidMix(mix)) return null;
    const fields = ["input", "cacheRead", "cacheWrite", "output"];
    if (!fields.every(key => mix[key] === 0 || (Number.isFinite(rates[key]) && rates[key] >= 0))) return null;
    return fields.reduce((sum, key) => sum + (mix[key] === 0 ? 0 : rates[key] * mix[key] / 100), 0);
  }

  return { mappingFor, rateFor, effectiveRates, mixedRate };
}

export function validateMix(mix) {
  const fields = ["input", "cacheRead", "cacheWrite", "output"];
  if (!mix || !fields.every(key => Number.isFinite(mix[key]) && mix[key] >= 0)) return { valid: false, total: NaN, message: "请输入四项非负数字。" };
  const total = fields.reduce((sum, key) => sum + mix[key], 0);
  if (Math.abs(total - 100) > 1e-6) return { valid: false, total, message: `合计须为 100%，当前为 ${Number.isFinite(total) ? total.toFixed(2) : "无效"}%。` };
  return { valid: true, total, message: "" };
}

const isValidMix = mix => validateMix(mix).valid;
