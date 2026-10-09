export const DEFAULT_MIX = Object.freeze({ input: 0.4, cacheRead: 96.7, cacheWrite: 2.6, output: 0.3 });

const model = (multiplier, provenance = "snapshot", note = "") => ({ multiplier, provenance, note });
const plan = (id, label, monthlyUsd, models) => ({ id, label, monthlyUsd, models });

export const SUBSCRIPTION_REGISTRY = Object.freeze({
  OpenAI: {
    source: "Astra and GPT-6.1 Sol plan-equivalent estimates supplied in the task; agentic full-quota estimates, not an official guarantee.",
    sourceDate: "2026-09-29",
    sourceUrl: "https://newsletter.semianalysis.com/p/anthropic-subscriptions-offer-5x",
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
    plans: [
      plan("lite18", "Lite · $18/mo", 18, { "GLM-5.3": model(7.7), "GLM-5.3-Flash": model(1.3) }),
      plan("pro80", "Pro · $80/mo", 80, { "GLM-5.3": model(10.4), "GLM-5.3-Flash": model(1.8) }),
      plan("max168", "Max · $168/mo", 168, { "GLM-5.3": model(11.6), "GLM-5.3-Flash": model(2.0) }),
    ],
  },
  MiniMax: {
    source: "Task-provided MiniMax plan estimates.", sourceDate: "2026-09-29",
    plans: [
      plan("plus22", "Plus · $22/mo", 22, { "MiniMax-M3": model(19.4) }),
      plan("max55", "Max · $55/mo", 55, { "MiniMax-M3": model(23.7) }),
      plan("ultra132", "Ultra · $132/mo", 132, { "MiniMax-M3": model(23.4) }),
    ],
  },
  Kimi: {
    source: "Task-provided Kimi plan estimates.", sourceDate: "2026-09-29",
    plans: [
      plan("plus19", "Plus · $19/mo", 19, { "Kimi K3": model(2.5) }),
      plan("pro39", "Pro · $39/mo", 39, { "Kimi K3": model(5.4) }),
      plan("max99", "Max · $99/mo", 99, { "Kimi K3": model(6.5) }),
      plan("ultra199", "Ultra · $199/mo", 199, { "Kimi K3": model(6.7) }),
    ],
  },
  Meta: {
    source: "Task-provided Meta plan estimate.", sourceDate: "2026-09-29",
    plans: [plan("power50", "PowerUsage · $50/mo", 50, { "Muse Spark 1.3": model(51.3) })],
  },
  SpaceXAI: {
    source: "Task-provided xAI plan estimate.", sourceDate: "2026-09-29",
    plans: [plan("heavy300", "SuperGrok Heavy · $300/mo", 300, { "Grok 4.7": model(19.4) })],
  },
  Cursor: {
    source: "Task-provided Cursor plan estimate.", sourceDate: "2026-09-29",
    plans: [plan("ultra200", "Ultra · $200/mo", 200, { "Composer 2.5": model(15.2) })],
  },
});

// 各 provider 自带 source/sourceDate（OpenAI/Anthropic 另有 sourceUrl）；不得用循环统一覆盖。

export function cacheWriteQuote(input, creator) {
  if (!Number.isFinite(input) || input < 0) return { rate: null, source: null };
  return creator === "Anthropic"
    ? { rate: input * 1.25, source: "官方规则折算：5-minute cache write = 1.25×input；https://platform.claude.com/docs/en/about-claude/pricing" }
    : { rate: input, source: "估算：cache write = input；未获独立写入报价，非实测。" };
}

export function createPricingEngine(registry = SUBSCRIPTION_REGISTRY) {
  function mappingFor(creator, modelName, planId) {
    const provider = registry[creator === "xAI" ? "SpaceXAI" : creator];
    const selectedPlan = provider?.plans.find(item => item.id === planId);
    if (!provider || !selectedPlan) return null;
    const base = String(modelName).replace(/\s*\([^)]*\)\s*$/, "").trim();
    const direct = selectedPlan.models[base];
    if (direct) return { ...direct, base, plan: selectedPlan, provider };
    const inherited = provider.inheritedMultiplier;
    if (!inherited) return null;
    const fromPlanModel = selectedPlan.models[inherited.from];
    if (!fromPlanModel) return null;
    return { multiplier: fromPlanModel.multiplier, provenance: inherited.provenance, note: `Inherited from ${inherited.from}.`, base, plan: selectedPlan, provider };
  }

  function rateFor(apiRate, creator, modelName, planId) {
    if (!Number.isFinite(apiRate) || apiRate < 0) return null;
    const mapping = mappingFor(creator, modelName, planId);
    return { apiRate, rate: mapping ? apiRate / mapping.multiplier : apiRate, mapping };
  }

  function effectiveRates(rates, creator, modelName, planId) {
    return Object.fromEntries(Object.entries(rates).map(([key, item]) => {
      const apiRate = typeof item === "number" ? item : item?.rate;
      const source = typeof item === "number" ? "observed" : item?.source ?? "observed";
      const priced = rateFor(apiRate, creator, modelName, planId);
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
