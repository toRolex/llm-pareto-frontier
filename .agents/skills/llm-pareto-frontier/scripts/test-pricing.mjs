import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { createPricingEngine, validateMix, cacheWriteQuote, channelBars, resolveSelection, normalizeSelections, SUBSCRIPTION_REGISTRY } from './pricing-model.mjs';
const engine = createPricingEngine();
const close = (value, expected) => assert.ok(Math.abs(value - expected) < 1e-10, `${value} != ${expected}`);
close(engine.rateFor(104, 'OpenAI', 'GPT-6.1 Sol (max)', 'pro200').rate, 10);
close(engine.rateFor(104, 'OpenAI', 'GPT-6 Luna (low)', 'pro200').rate, 10);
close(engine.rateFor(104, 'OpenAI', 'GPT-6 Luna (xhigh)', 'pro200').rate, 10);
close(engine.rateFor(5386, 'OpenAI', 'GPT-6 Sol', 'pro500').rate, 500);
close(engine.rateFor(81, 'OpenAI', 'GPT-6 Astra (high)', 'plus').rate, 10);
close(engine.rateFor(626, 'Anthropic', 'Claude Sonnet 5.5 (max)', 'pro20').rate, 9.949066213921902);
close(engine.rateFor(626, 'Anthropic', 'Claude Sonnet 5.5 (low)', 'max5x100').rate, 10.226876090750435);
assert.equal(engine.rateFor(10, 'Anthropic', 'Claude Fable 5.1', 'pro20').rate, 10);
close(engine.rateFor(127, 'Anthropic', 'Claude Fable 5.1 (max)', 'max5x100').rate, 10);
assert.equal(engine.rateFor(20, 'Anthropic', 'Claude Sonnet 5.4 (max)', 'max20x200').rate, 20);
assert.equal(engine.rateFor(20, 'Kimi', 'Kimi K2.7 Code', 'ultra199').rate, 20);
for (const [creator, name, plan, api] of [
  ['Z AI','GLM-5.3','pro80',104], ['Z AI','GLM-5.3-Flash','max168',20],
  ['MiniMax','MiniMax-M3','ultra132',234], ['Kimi','Kimi K3','ultra199',67],
  ['Meta','Muse Spark 1.3 (max)','power50',513], ['xAI','Grok 4.7 (high)','heavy300',194],
  ['Cursor','Composer 2.5','ultra200',150],
]) close(engine.rateFor(api,creator,name,plan).rate,10);
close(engine.mixedRate({ input: 10, cacheRead: 1, cacheWrite: 12.5, output: 30 }, { input: 0.4, cacheRead: 96.7, cacheWrite: 2.6, output: 0.3 }), 1.422);
assert.equal(engine.rateFor(0,'OpenAI','GPT-6 Luna','pro200').rate,0);
assert.equal(engine.mixedRate({ input: 0 }, { input: 100, cacheRead: 0, cacheWrite: 0, output: 0 }),0);
assert.equal(engine.mixedRate({ input: 2 }, { input: 100, cacheRead: 0, cacheWrite: 0, output: 0 }),2);
assert.equal(engine.mixedRate({ input: 2 }, { input: 99, cacheRead: 1, cacheWrite: 0, output: 0 }),null);
assert.equal(validateMix({ input: 10, cacheRead: 90, cacheWrite: 0, output: 0 }).valid,true);
assert.equal(validateMix({ input: 10, cacheRead: 89, cacheWrite: 0, output: 0 }).valid,false);
assert.equal(validateMix({ input: -1, cacheRead: 101, cacheWrite: 0, output: 0 }).valid,false);
assert.equal(validateMix({ input: NaN, cacheRead: 100, cacheWrite: 0, output: 0 }).valid,false);
assert.equal(cacheWriteQuote(10,'Anthropic').rate,12.5);
assert.equal(cacheWriteQuote(10,'Kimi').rate,10);

// xAI merged bar (SuperGrok + Cursor): Cursor Ultra shared pool 15x = $3000/200, applied to Grok rows.
close(engine.rateFor(19.4 * 3, 'SpaceXAI', 'Grok 4.7 (high)', 'heavy300', 'SpaceXAI').rate, 3);
close(engine.rateFor(150, 'SpaceXAI', 'Grok 4.7 (xhigh)', 'ultra200', 'Cursor').rate, 10);
close(engine.rateFor(150, 'xAI', 'Grok 4.7 (low)', 'ultra200', 'Cursor').rate, 10);
close(engine.rateFor(225, 'SpaceXAI', 'Grok 4.6', 'cursor-pro20', 'Cursor').rate, 10);
close(engine.rateFor(200, 'SpaceXAI', 'Grok 4.6 (high)', 'cursor-proplus60', 'Cursor').rate, 10);
assert.equal(engine.rateFor(150, 'Cursor', 'Composer 2.5', 'ultra200', 'Cursor').rate, 10);
// Aggregator cap ratios derive as numerator (official model monthly cap) ÷ plan.monthlyUsd, written as
// literal expressions in both catalog and tests so a wrong plan fee can never be baked in (Plus caps
// divide by the $40 fee, never by the $10 Go fee). Caps checked 2026-10-10/11 against opencode.ai/docs/go
// and commandcode.ai/docs/plans/goat.
const go = SUBSCRIPTION_REGISTRY.OpenCode.plans.find(p => p.id === 'go10');
const goPlus = SUBSCRIPTION_REGISTRY.OpenCode.plans.find(p => p.id === 'goPlus40');
const goat = SUBSCRIPTION_REGISTRY.CommandCode.plans.find(p => p.id === 'goat10');
assert.equal(go.monthlyUsd, 10);
assert.equal(goPlus.monthlyUsd, 40);
assert.equal(goat.monthlyUsd, 10);
for (const [planRef, name, numerator] of [
  [go, 'GLM-5.3', 15], [goPlus, 'GLM-5.3', 120], [goat, 'GLM-5.3', 20],
  [go, 'Kimi K3', 15], [goPlus, 'Kimi K3', 60], [goat, 'Kimi K3', 20],
  [go, 'MiniMax-M3', 60], [goPlus, 'MiniMax-M3', 180], [goat, 'MiniMax-M3', 47],
  [go, 'LongCat 2.0', 60], [goPlus, 'LongCat 2.0', 240], [goat, 'LongCat 2.0', 50],
  [go, 'MiMo-V2.6-Flash', 60], [goPlus, 'MiMo-V2.6-Flash', 120], [goat, 'MiMo-V2.6-Flash', 20],
  [go, 'GPT-6 Luna', 15], [goPlus, 'GPT-6 Luna', 60], [goat, 'GPT-6 Luna', 20],
  [go, 'Grok 4.7', 15], [goPlus, 'Grok 4.7', 60], [go, 'Grok 4.6', 15], [goPlus, 'Grok 4.6', 60],
  [goat, 'Grok 4.7', 20], [goat, 'Grok 4.6', 20],
  [goat, 'MiMo-V2.6-Pro', 20], [goat, 'Qwen3.7 Plus', 33], [goat, 'Muse Spark 1.3', 20], [goat, 'Step 5 Preview', 20],
]) assert.equal(planRef.models[name].multiplier, numerator / planRef.monthlyUsd, `${planRef.id}:${name}`);
// Guards against the erroneous supplement ratios that divided Plus caps by the $10 Go fee.
assert.equal(goPlus.models['MiniMax-M3'].multiplier, 180 / 40); assert.notEqual(goPlus.models['MiniMax-M3'].multiplier, 18);
assert.equal(goPlus.models['Kimi K3'].multiplier, 60 / 40); assert.notEqual(goPlus.models['Kimi K3'].multiplier, 6);
assert.equal(goPlus.models['GPT-6 Luna'].multiplier, 60 / 40); assert.notEqual(goPlus.models['GPT-6 Luna'].multiplier, 6);
assert.equal(goPlus.models['GLM-5.3'].multiplier, 120 / 40); assert.notEqual(goPlus.models['GLM-5.3'].multiplier, 12);
assert.equal(goPlus.models['LongCat 2.0'].multiplier, 240 / 40);
assert.equal(goPlus.models['MiMo-V2.6-Flash'].multiplier, 120 / 40);
assert.equal(go.models['Grok 4.7'].multiplier, 15 / 10);
assert.equal(goat.models['Grok 4.7'].multiplier, 20 / 10);
close(engine.rateFor(36, 'LongCat', 'LongCat 2.0', 'goPlus40', 'OpenCode').rate, 36 / (240 / 40));
close(engine.rateFor(20, 'Xiaomi', 'MiMo-V2.6-Flash', 'go10', 'OpenCode').rate, 20 / (60 / 10));
close(engine.rateFor(20, 'Xiaomi', 'MiMo-V2.6-Pro', 'goat10', 'CommandCode').rate, 20 / (20 / 10));
close(engine.rateFor(30, 'StepFun', 'Step 5 Preview', 'goat10', 'CommandCode').rate, 30 / (20 / 10));
close(engine.rateFor(20, 'Alibaba', 'Qwen3.7 Plus', 'goat10', 'CommandCode').rate, 20 / (33 / 10));
// Estimated provenance: official cacheWrite differs from the plotted estimate (Luna 0.125 vs 0.1, Qwen 0.5 vs 0.4),
// so the four-field comparison is not exact and must not be labeled as a verified match.
assert.equal(go.models['GPT-6 Luna'].provenance, 'estimated');
assert.equal(goPlus.models['GPT-6 Luna'].provenance, 'estimated');
assert.equal(goat.models['GPT-6 Luna'].provenance, 'estimated');
assert.equal(goat.models['Qwen3.7 Plus'].provenance, 'estimated');
assert.match(goat.models['Qwen3.7 Plus'].note, /0\.50/);
// Conditional MiniMax GOAT ratio is tied to the officially shown M3-50% discount band, labeled at use site.
assert.equal(goat.models['MiniMax-M3'].provenance, 'conditional');
assert.match(goat.models['MiniMax-M3'].note, /50% 折扣价带/);
// Time-dependent DeepSeek and unverified Grok 4.5 carry no fixed multiplier (access-only); conditional
// peak-rate caps are recorded in the note only.
for (const [planRef, name] of [[go, 'DeepSeek V4.1 Flash'], [goPlus, 'DeepSeek V4.1 Flash'], [goat, 'DeepSeek V4.1 Flash'], [goat, 'Grok 4.5']]) {
  const m = planRef.models[name];
  assert.equal(m.multiplier, null);
  assert.equal(m.provenance, 'unknown');
}
assert.match(go.models['DeepSeek V4.1 Flash'].note, /60\/10=6/);
assert.match(goPlus.models['DeepSeek V4.1 Flash'].note, /120\/40=3/);
assert.match(goat.models['DeepSeek V4.1 Flash'].note, /60\/10=6/);
assert.match(goat.models['Grok 4.5'].note, /不一致/);
// Mismatched or aliasing names never map: strict model keys, no generation aliases.
assert.equal(go.models['GLM-5.3-Flash'], undefined);
assert.equal(goat.models['GLM-5.3-Flash'], undefined);
assert.equal(go.models['Claude Haiku 5.5'], undefined);
assert.equal(goat.models['Claude Haiku 5.5'], undefined);
assert.equal(engine.rateFor(999, 'SpaceXAI', 'Grok 4.5', 'go10', 'OpenCode').rate, 999);
assert.equal(engine.rateFor(999, 'SpaceXAI', 'Grok 4.5', 'goat10', 'CommandCode').rate, 999);
assert.equal(engine.rateFor(30, 'Z AI', 'GLM-5.3-Flash', 'go10', 'OpenCode').rate, 30);
assert.equal(engine.rateFor(30, 'Z AI', 'GLM-5.3-Flash', 'go10', 'OpenCode').mapping, null);
assert.equal(engine.rateFor(999, 'SpaceXAI', 'Grok 4.6', 'go10', 'OpenCode').mapping, null);
assert.equal(engine.rateFor(999, 'SpaceXAI', 'Mystery Model', 'go10', 'OpenCode').rate, 999);
assert.equal(engine.rateFor(999, 'SpaceXAI', 'Mystery Model', 'go10', 'OpenCode').mapping, null);
const supergrok = engine.rateFor(150, 'SpaceXAI', 'Grok 4.6', 'supergrok30', 'SpaceXAI');
assert.equal(supergrok.rate, 150);
assert.ok(supergrok.mapping && supergrok.mapping.multiplier === null && supergrok.mapping.provenance === 'unknown');

const html = readFileSync(new URL('../prototype-4d-3d.html', import.meta.url), 'utf8');
const rows = JSON.parse(html.match(/const ROWS_RAW = (.*?\]);\n/s)[1]);
const rowBase = name => String(name).replace(/\s*\([^)]*\)\s*$/, '').trim();
const creators = new Map(rows.map(row => [rowBase(row.model), row.creator]));
assert.equal(creators.get('GPT-6 Luna'), 'OpenAI');
const bars = channelBars(SUBSCRIPTION_REGISTRY, base => creators.get(base));
assert.deepEqual(bars.map(bar => bar.id), ['OpenAI', 'Anthropic', 'Z AI', 'MiniMax', 'Kimi', 'Meta', 'SpaceXAI', 'OpenCode', 'CommandCode']);
assert.deepEqual(bars.find(bar => bar.id === 'SpaceXAI').channels.map(ch => ch.id), ['SpaceXAI', 'Cursor']);
for (const bar of bars.filter(bar => bar.kind !== 'aggregator')) {
  assert.ok(bar.channels.every(ch => ch.kind !== 'aggregator'));
}
const expectedGo = ['LongCat 2.0', 'MiMo-V2.6-Flash', 'DeepSeek V4.1 Flash'];
const expectedGoat = ['Grok 4.5', 'LongCat 2.0', 'Step 5 Preview', 'MiMo-V2.6-Flash', 'MiMo-V2.6-Pro', 'Qwen3.7 Plus', 'DeepSeek V4.1 Flash'];
for (const [id, expected] of [['OpenCode', expectedGo], ['CommandCode', expectedGoat]]) {
  const bar = bars.find(item => item.id === id);
  assert.equal(bar.kind, 'aggregator');
  assert.deepEqual(bar.vendors, []);
  assert.deepEqual(bar.channels[0].servedModels, expected);
  for (const item of bar.plans) {
    assert.deepEqual(item.servedModels, expected);
    for (const base of Object.keys(item.models)) {
      const mapping = engine.mappingFor(creators.get(base), base, item.id, id);
      assert.equal(!!mapping, expected.includes(base), `${id}:${item.id}:${base} projection matches engine`);
      const resolved = resolveSelection(bars, { [id]: item.id }, creators.get(base), `${base} (high)`);
      assert.equal(!!resolved, expected.includes(base), `${id}:${item.id}:${base} projection matches resolver`);
    }
  }
}
for (const [creator, base] of [['OpenAI', 'GPT-6 Luna'], ['xAI', 'Grok 4.6'], ['SpaceXAI', 'Grok 4.7'], ['Kimi', 'Kimi K3'], ['Z AI', 'GLM-5.3'], ['MiniMax', 'MiniMax-M3'], ['Meta', 'Muse Spark 1.3']]) {
  for (const [id, config] of Object.entries(SUBSCRIPTION_REGISTRY).filter(([, config]) => config.channel.kind === 'aggregator')) {
    for (const item of config.plans) {
      const priced = engine.rateFor(120, creator, `${base} (xhigh)`, item.id, id);
      assert.equal(priced.mapping, null, `${id} rejects official ${base}`);
      assert.equal(priced.rate, 120);
    }
  }
}
assert.equal(engine.mappingFor('OpenAI', 'GPT-6 Luna (low)', 'go10', 'OpenCode'), null, 'bare engine rejects inherited Luna with real creator');
assert.equal(engine.mappingFor('Unknown', 'Grok 4.6', 'go10', 'OpenCode'), null, 'direct official key coverage does not require creator attribution');
assert.equal(engine.mappingFor('Unknown', 'Mystery Model', 'go10', 'OpenCode'), null);
assert.equal(channelBars().find(bar => bar.id === 'OpenCode').plans[0].servedModels.includes('Grok 4.6'), false);
assert.equal(channelBars().find(bar => bar.id === 'OpenCode').plans[0].servedModels.includes('GPT-6 Luna'), true, 'missing attribution cannot infer OpenAI inheritance');
assert.ok(engine.mappingFor('xAI', 'Grok 4.5 (high)', 'goat10', 'CommandCode'), 'reseller does not confer official coverage');
assert.equal(engine.rateFor(120, 'xAI', 'Grok 4.5 (high)', 'goat10', 'CommandCode').rate, 120);
assert.equal(engine.mappingFor('DeepSeek', 'DeepSeek V4.1 Flash', 'go10', 'OpenCode').multiplier, null);
assert.equal(engine.rateFor(90, 'DeepSeek', 'DeepSeek V4.1 Flash (max)', 'go10', 'OpenCode').rate, 90);
assert.deepEqual(resolveSelection(bars, { OpenCode: 'go10' }, 'LongCat', 'LongCat 2.0'), { barId: 'OpenCode', channelId: 'OpenCode', planId: 'go10' });
assert.equal(resolveSelection(bars, { OpenCode: 'go10' }, 'OpenAI', 'GPT-6 Luna (low)'), null);
assert.equal(resolveSelection(bars, { OpenCode: 'go10' }, 'Xiaomi', 'MiMo-V2.6-Pro'), null, 'selected plan projection only');
assert.deepEqual(resolveSelection(bars, { CommandCode: 'goat10' }, 'Xiaomi', 'MiMo-V2.6-Pro'), { barId: 'CommandCode', channelId: 'CommandCode', planId: 'goat10' });
assert.deepEqual(resolveSelection(bars, { OpenAI: 'pro200', OpenCode: 'go10' }, 'OpenAI', 'GPT-6 Luna (low)'), { barId: 'OpenAI', channelId: 'OpenAI', planId: 'pro200' });
assert.deepEqual(resolveSelection(bars, { Cursor: 'ultra200', CommandCode: 'goat10' }, 'xAI', 'Grok 4.5 (high)'), { barId: 'SpaceXAI', channelId: 'Cursor', planId: 'ultra200' }, 'reseller keeps vendor-first priority');
assert.deepEqual(normalizeSelections(bars, { OpenCode: 'goPlus40' }), { OpenCode: 'goPlus40' });
assert.deepEqual(normalizeSelections(bars, { CommandCode: 'goat10' }), { CommandCode: 'goat10' });
assert.deepEqual(normalizeSelections(bars, { CommandCode: 'goat10', OpenCode: 'go10' }), { OpenCode: 'go10' }, 'bar order, not storage insertion order');
assert.deepEqual(normalizeSelections(bars, { SpaceXAI: 'heavy300', Cursor: 'ultra200', OpenCode: 'go10', Nope: 'x' }), { SpaceXAI: 'heavy300', OpenCode: 'go10' });
assert.deepEqual(normalizeSelections(bars, { Cursor: 'ultra200', CommandCode: 'goat10' }), { SpaceXAI: 'ultra200', CommandCode: 'goat10' });
assert.deepEqual(normalizeSelections(bars, { OpenAI: 'pro200', Anthropic: 'max20x200', OpenCode: 'go10' }), { OpenAI: 'pro200', Anthropic: 'max20x200', OpenCode: 'go10' });
for (const selection of [{ OpenAI: 'go10' }, { SpaceXAI: 'goat10' }, { Cursor: 'go10' }, { LongCat: 'go10' }, { Kimi: 'go10' }, { OpenCode: 'nope' }, { Nope: 'go10' }]) {
  assert.deepEqual(normalizeSelections(bars, selection), {}, 'legacy embedded or invalid keys discarded without scope widening');
}
for (const selection of [{ Cursor: 'ultra200', OpenCode: 'go10', CommandCode: 'goat10' }, { OpenAI: 'go10', LongCat: 'go10', CommandCode: 'goat10' }, { SpaceXAI: 'heavy300', Cursor: 'ultra200' }]) {
  const once = normalizeSelections(bars, selection);
  assert.deepEqual(normalizeSelections(bars, once), once);
}

// P2: an explicit non-aggregator channelId cannot reprice outside its creator boundary (channel.vendors).
assert.equal(engine.rateFor(104, 'Kimi', 'Kimi K3', 'pro200', 'OpenAI').rate, 104);
assert.equal(engine.rateFor(104, 'Kimi', 'Kimi K3', 'pro200', 'OpenAI').mapping, null);
assert.equal(engine.rateFor(104, 'xAI', 'Grok 4.7', 'pro200', 'OpenAI').rate, 104);
assert.equal(engine.rateFor(104, 'xAI', 'Grok 4.7', 'pro200', 'OpenAI').mapping, null);
close(engine.rateFor(150, 'xAI', 'Grok 4.7', 'ultra200', 'Cursor').rate, 10);
close(engine.rateFor(26, 'Kimi', 'Kimi K3', 'max99').rate, 26 / 6.5);

const runtime = html.match(/\/\/ SUBSCRIPTION_PRICING_RUNTIME\n([\s\S]*?)\/\/ END_SUBSCRIPTION_PRICING_RUNTIME/);
assert.ok(runtime, 'embedded pricing runtime exists');
const moduleSource = readFileSync(new URL('./pricing-model.mjs', import.meta.url), 'utf8');
assert.ok(runtime[1].includes(moduleSource.replace(/^export /gm, '')), 'builder injects current pricing module');
const selectionFunctions = html.slice(html.indexOf('function clearBarSelection('), html.indexOf('function renderPricingPanel('));
const uiState = { subscriptionPlans: { OpenAI: 'pro200', SpaceXAI: 'ultra200' } };
const ui = vm.createContext({ S: uiState, CHANNEL_BARS: bars });
vm.runInContext(selectionFunctions, ui);
const selectBar = (id, planId) => {
  ui.bar = bars.find(bar => bar.id === id);
  ui.planId = planId;
  vm.runInContext('applyBarSelection(bar, planId)', ui);
};
selectBar('OpenCode', 'go10');
assert.deepEqual(uiState.subscriptionPlans, { OpenAI: 'pro200', SpaceXAI: 'ultra200', OpenCode: 'go10' });
selectBar('CommandCode', 'goat10');
assert.deepEqual(uiState.subscriptionPlans, { OpenAI: 'pro200', SpaceXAI: 'ultra200', CommandCode: 'goat10' });
selectBar('OpenCode', 'goPlus40');
assert.deepEqual(uiState.subscriptionPlans, { OpenAI: 'pro200', SpaceXAI: 'ultra200', OpenCode: 'goPlus40' });
selectBar('CommandCode', '');
assert.equal(uiState.subscriptionPlans.OpenCode, 'goPlus40', 'API only clears own aggregator');
selectBar('SpaceXAI', 'heavy300');
assert.equal(uiState.subscriptionPlans.OpenCode, 'goPlus40', 'official selection preserves aggregator');
selectBar('SpaceXAI', '');
assert.equal(uiState.subscriptionPlans.OpenCode, 'goPlus40', 'official API preserves aggregator');
selectBar('OpenCode', '');
assert.deepEqual(uiState.subscriptionPlans, { OpenAI: 'pro200' });
const projectedRegistry = {
  Official: { channel: { kind: 'vendor', vendors: ['Official'] }, plans: [{ id: 'official', models: { Covered: { multiplier: null }, Anchor: { multiplier: 2 } } }], inheritedMultiplier: { from: 'Anchor' } },
  Reseller: { channel: { kind: 'reseller', vendors: ['Other'] }, plans: [{ id: 'resold', models: { Resold: { multiplier: 2 } } }] },
  Aggregate: { channel: { kind: 'aggregator', label: 'Aggregate', vendors: [] }, plans: [
    { id: 'one', models: { Covered: { multiplier: 2 }, Inherited: { multiplier: 2 }, First: { multiplier: 3 }, Resold: { multiplier: null } } },
    { id: 'two', models: { Second: { multiplier: 4 } } },
  ] },
};
const projectedBars = channelBars(projectedRegistry, base => base === 'Inherited' ? 'Official' : 'Other');
const aggregate = projectedBars.find(bar => bar.id === 'Aggregate');
assert.deepEqual(aggregate.plans.map(item => item.servedModels), [['First', 'Resold'], ['Second']]);
assert.deepEqual(aggregate.channels[0].servedModels, ['First', 'Resold', 'Second']);
assert.equal(resolveSelection(projectedBars, { Aggregate: 'one' }, 'Other', 'Second'), null, 'no raw-model or channel-union fallback');
assert.equal(createPricingEngine(projectedRegistry).mappingFor('Official', 'Inherited', 'one', 'Aggregate'), null);
console.log('Pricing behavior passed. Standalone projections 3/3/7, official coverage guards, resolver priority and deterministic storage verified. Browser acceptance remains parent-owned.');
