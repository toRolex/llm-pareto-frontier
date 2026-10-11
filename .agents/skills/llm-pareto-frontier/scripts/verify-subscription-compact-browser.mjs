// Parent-owned browser acceptance. Reuses an existing space and page; never creates or finishes a space.
// Ego nodejs env must be injected explicitly when its runtime does not inherit shell env.
// { printf 'process.env.MKL_BROWSER_SPACE="13";process.env.MKL_BROWSER_URL="file:///private/tmp/llm-pf-main/.agents/skills/llm-pareto-frontier/prototype-4d-3d.html";\n'; cat scripts/verify-subscription-compact-browser.mjs; } | ego-browser nodejs
const fs = await import('node:fs/promises');
const assert = (await import('node:assert/strict')).default;
const spaceId = Number(process.env.MKL_BROWSER_SPACE || process.env.MKL_SPACE_ID);
assert.ok(Number.isInteger(spaceId) && spaceId > 0, 'MKL_SPACE_ID must name the existing TaskSpace');
const task = await taskSpace(spaceId);
const page = task.page(process.env.MKL_BROWSER_PAGE || 'p1');
const url = process.env.MKL_BROWSER_URL;
assert.ok(url, 'MKL_BROWSER_URL must name the target artifact');
const report = { spaceId, url, checks: [], passed: false };
const runtimeErrors = [];
const checkErrors = async () => {
  runtimeErrors.push(...await page.evaluate(() => window.__errs2));
  assert.deepEqual(runtimeErrors, [], 'no runtime errors across subscription interactions and reloads');
};
const check = (name, evidence) => { report.checks.push({ name, evidence }); console.log('ok -', name); };
const ready = async () => {
  await page.waitForFunction(() => typeof world !== 'undefined' && world && typeof CHANNEL_BARS !== 'undefined');
  await page.waitForFunction(() => !flight && (!Motion || sampleMotion(Motion, performance.now()).done));
};
const settle = async () => {
  await page.waitForFunction(() => !flight && (!Motion || sampleMotion(Motion, performance.now()).done));
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
};
const openMix = () => page.evaluate(() => { const d = document.getElementById('mix-details'); if (d) d.open = true; });
const rowCost = model => page.evaluate(m => costOf(MODELS.find(row => row.model === m)), model);
const plans = () => page.evaluate(() => ({ ...S.subscriptionPlans }));
const geometry = () => page.evaluate(() => {
  const chart = document.getElementById('chart').getBoundingClientRect();
  const dock = document.getElementById('pricing-panel').getBoundingClientRect();
  const sidebar = document.getElementById('sidebar').getBoundingClientRect();
  const close = document.getElementById('pricing-close').getBoundingClientRect();
  return { chart: { y: chart.y, h: chart.height, bottom: chart.bottom, right: chart.right },
    dock: { y: dock.y, h: dock.height, top: dock.top, right: dock.right },
    sidebarX: sidebar.x, closeTop: close.top, closeBottom: close.bottom, innerH: innerHeight,
    dockHeightVar: getComputedStyle(document.documentElement).getPropertyValue('--dock-height').trim() };
});
const setViewport = async (width, height) => {
  await page.cdp('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 2, mobile: false });
  await settle();
};

await page.goto(url);
await ready();
const savedStorage = await page.evaluate(() => Object.fromEntries(Object.keys(localStorage).map(key => [key, localStorage.getItem(key)])));
const savedViewport = await page.evaluate(() => ({ width: innerWidth, height: innerHeight, deviceScaleFactor: devicePixelRatio }));
try {
await setViewport(1470, 837);
await page.evaluate(() => { S.subscriptionPlans = {}; S.mix = { ...PRICING.DEFAULT_MIX }; S.priceMode = 'blend'; S.perTask = false; persistPricingState(); renderPricingPanel(); updatePricing(); });
await settle();

const dockClosed = await page.evaluate(() => document.getElementById('pricing-panel').classList.contains('hidden'));
assert.equal(dockClosed, true, 'dock starts closed');
const apiGrok = await rowCost('Grok 4.7 (high)');
const apiKimi = await rowCost('Kimi K3 (low)');
const apiGlm = await rowCost('GLM-5.3 (max)');
const apiMiniMax = await rowCost('MiniMax-M3');
const apiLuna = await rowCost('GPT-6 Luna (low)');
const apiMuse = await rowCost('Muse Spark 1.3 (max)');
for (const [name, value] of [['grok', apiGrok], ['kimi', apiKimi], ['glm', apiGlm], ['minimax', apiMiniMax], ['luna', apiLuna], ['muse', apiMuse]]) {
  assert.ok(Number.isFinite(value) && value > 0, `API baseline finite for ${name}`);
}

await page.click('#sub-entry', { label: 'Open subscription dock' });
await settle();
const openGeo = await geometry();
assert.ok(openGeo.dock.h > 0 && openGeo.dock.h <= 216.5, `dock bounded to compact height at 1470x837 (${openGeo.dock.h})`);
assert.ok(openGeo.chart.h >= 340, `chart keeps its >=340px target at 1470x837 (${openGeo.chart.h})`);
assert.ok(openGeo.chart.bottom <= openGeo.dock.top + 1, `chart must not overlap dock (${openGeo.chart.bottom} <= ${openGeo.dock.top})`);
assert.ok(openGeo.dock.right <= openGeo.sidebarX + 1, 'dock must not intrude into the reserved right sidebar rail');
assert.ok(openGeo.dockHeightVar.endsWith('px') && parseFloat(openGeo.dockHeightVar) > 0, '--dock-height mirrors the open dock');
const mixCollapsed = await page.evaluate(() => { const d = document.getElementById('mix-details'); return d && !d.open; });
assert.equal(mixCollapsed, true, 'Token mix details collapsed by default');
const plansFirst = await page.evaluate(() => {
  const panel = document.getElementById('pricing-panel');
  const grid = panel.querySelector('.plan-grid');
  const mix = document.getElementById('mix-details');
  return !!(grid && mix && grid.compareDocumentPosition(mix) & Node.DOCUMENT_POSITION_FOLLOWING);
});
assert.equal(plansFirst, true, 'compact plan rows render before the collapsed token mix');
await page.screenshot({ path: '/tmp/llm-pf-subscription-desktop-dock.png' });
check('compact dock: bounded height, chart >=340, mix collapsed, plans first (1470x837)', openGeo);

await setViewport(1280, 800);
const geo1280 = await geometry();
assert.ok(geo1280.dock.h > 0 && geo1280.dock.h <= 216.5, `dock bounded at 1280x800 (${geo1280.dock.h})`);
assert.ok(geo1280.chart.h >= 340, `chart keeps its >=340px target at 1280x800 (${geo1280.chart.h})`);
assert.ok(geo1280.closeTop >= 0 && geo1280.closeBottom <= geo1280.innerH, 'dock close control stays within the viewport');
await page.screenshot({ path: '/tmp/llm-pf-subscription-desktop-1280.png' });
check('desktop 1280x800: dock compact, chart >=340, close control in viewport', geo1280);

await setViewport(1280, 720);
const geoShort = await geometry();
assert.ok(geoShort.chart.bottom <= geoShort.dock.top + 1, `short desktop: no chart/dock overlap (${geoShort.chart.bottom} <= ${geoShort.dock.top})`);
assert.ok(geoShort.dock.h >= 159 && geoShort.dock.h <= 216.5, `short desktop: dock respects the 160px floor and compact budget (${geoShort.dock.h})`);
assert.ok(geoShort.chart.h >= 200, `short desktop: chart stays usable (${geoShort.chart.h})`);
assert.ok(geoShort.closeTop >= 0 && geoShort.closeBottom <= geoShort.innerH, 'short desktop: close control in viewport');
check('short desktop 1280x720: floor-bounded dock, non-overlap, controls reachable', geoShort);

await setViewport(1470, 837);
await page.evaluate(() => { document.querySelectorAll('#pricing-panel details').forEach(d => { d.open = true; }); });
await settle();
const expanded = await geometry();
assert.ok(expanded.chart.bottom <= expanded.dock.top + 1 && expanded.chart.h >= 340, `expanded details scroll internally, chart intact (${expanded.chart.h})`);
await page.evaluate(() => { document.querySelectorAll('#pricing-panel details').forEach(d => { if (d.id !== 'mix-details') d.open = false; }); });
await settle();
check('detail expansion stays inside the dock (internal scroll, no chart overlap)', expanded);

const press = async (barId, planId) => {
  const selector = `button[data-provider-button="${barId}"][data-plan="${planId}"]`;
  await page.evaluate(selector => document.querySelector(selector).scrollIntoView({ block: 'center' }), selector);
  await page.click(selector, { label: `${barId} ${planId || 'API'}` });
  await settle();
};
const barData = await page.evaluate(() => CHANNEL_BARS.map(bar => ({ id: bar.id, kind: bar.kind, vendors: bar.vendors, channels: bar.channels.map(ch => ch.id), projections: bar.plans.map(item => item.servedModels) })));
assert.deepEqual(barData.map(bar => bar.id), ['OpenAI', 'Anthropic', 'Z AI', 'MiniMax', 'Kimi', 'Meta', 'SpaceXAI', 'OpenCode', 'CommandCode']);
assert.deepEqual(barData.find(bar => bar.id === 'SpaceXAI').channels, ['SpaceXAI', 'Cursor']);
const expectedGo = ['LongCat 2.0', 'MiMo-V2.6-Flash', 'DeepSeek V4.1 Flash'];
const expectedGoat = ['Grok 4.5', 'LongCat 2.0', 'Step 5 Preview', 'MiMo-V2.6-Flash', 'MiMo-V2.6-Pro', 'Qwen3.7 Plus', 'DeepSeek V4.1 Flash'];
for (const [id, expected] of [['OpenCode', expectedGo], ['CommandCode', expectedGoat]]) {
  const bar = barData.find(item => item.id === id);
  assert.equal(bar.kind, 'aggregator');
  assert.deepEqual(bar.vendors, []);
  bar.projections.forEach(names => assert.deepEqual(names, expected));
  const visible = await page.evaluate(id => {
    const section = document.querySelector(`section[data-bar="${id}"]`);
    return { heading: section.querySelector('.provider-h').textContent, coverage: section.querySelector('.coverage').textContent,
      buttons: [...section.querySelectorAll('button[data-plan]')].filter(button => button.dataset.plan).map(button => ({ label: button.getAttribute('aria-label'), title: button.title })),
      rows: [...section.querySelectorAll('.plan-detail li')].map(item => item.textContent) };
  }, id);
  assert.ok(!visible.heading.includes('暂无 benchmark'));
  expected.forEach(name => {
    assert.ok(visible.coverage.includes(name));
    visible.buttons.forEach(button => assert.ok(button.label.includes(name) && button.title.includes(name)));
    assert.ok(visible.rows.some(row => row.startsWith(name + ' ·')));
  });
  for (const name of ['GPT-6 Luna', 'Grok 4.6', 'Grok 4.7', 'Kimi K3', 'GLM-5.3', 'MiniMax-M3', 'Muse Spark 1.3']) {
    assert.ok(!visible.coverage.includes(name));
    assert.ok(visible.buttons.every(button => !button.label.includes(name)));
    assert.ok(visible.rows.every(row => !row.startsWith(name + ' ·')));
  }
}
check('standalone bottom bars, 3/3/7 projected buttons and detail rows, real benchmark attribution', barData);
const apiLongCat = await rowCost('LongCat 2.0');
const apiMiMoFlash = await rowCost('MiMo-V2.6-Flash');
const apiStep = await rowCost('Step 5 Preview');
const apiQwen = await rowCost('Qwen3.7 Plus');
await press('OpenAI', 'pro200');
await press('SpaceXAI', 'ultra200');
await press('OpenCode', 'go10');
assert.deepEqual(await plans(), { OpenAI: 'pro200', SpaceXAI: 'ultra200', OpenCode: 'go10' });
assert.ok(Math.abs((await rowCost('LongCat 2.0')) - apiLongCat / 6) < 1e-9);
assert.ok(Math.abs((await rowCost('MiMo-V2.6-Flash')) - apiMiMoFlash / 6) < 1e-9);
assert.ok(Math.abs((await rowCost('GPT-6 Luna (low)')) - apiLuna / 10.4) < 1e-9);
assert.ok(Math.abs((await rowCost('Grok 4.7 (high)')) - apiGrok / 15) < 1e-9);
assert.ok(Math.abs((await rowCost('Kimi K3 (low)')) - apiKimi) < 1e-9);
await press('CommandCode', 'goat10');
assert.deepEqual(await plans(), { OpenAI: 'pro200', SpaceXAI: 'ultra200', CommandCode: 'goat10' });
assert.ok(Math.abs((await rowCost('LongCat 2.0')) - apiLongCat / 5) < 1e-9);
assert.ok(Math.abs((await rowCost('Step 5 Preview')) - apiStep / 2) < 1e-9);
assert.ok(Math.abs((await rowCost('Qwen3.7 Plus')) - apiQwen / 3.3) < 1e-9);
await press('OpenCode', 'goPlus40');
assert.deepEqual(await plans(), { OpenAI: 'pro200', SpaceXAI: 'ultra200', OpenCode: 'goPlus40' });
assert.ok(Math.abs((await rowCost('LongCat 2.0')) - apiLongCat / 6) < 1e-9);
await press('CommandCode', '');
assert.equal((await plans()).OpenCode, 'goPlus40', 'API on inactive aggregator clears only itself');
await press('OpenCode', '');
assert.deepEqual(await plans(), { OpenAI: 'pro200', SpaceXAI: 'ultra200' });
await page.evaluate(() => {
  const button = document.querySelector('button[data-provider-button="OpenCode"][data-plan=""]');
  button.focus();
  button.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
});
await settle();
assert.equal((await plans()).OpenCode, 'go10', 'keyboard selects next aggregator tier');
await page.evaluate(() => document.activeElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true })));
await settle();
assert.equal((await plans()).OpenCode, undefined, 'keyboard API clears only own aggregator');
check('kind-based aggregator exclusivity both ways, official and reseller survive, own API and keyboard controls', await plans());
const strict = await page.evaluate(() => ({
  luna: pricingEngine.mappingFor('OpenAI', 'GPT-6 Luna (low)', 'go10', 'OpenCode'),
  grok46: pricingEngine.mappingFor('xAI', 'Grok 4.6 (high)', 'goat10', 'CommandCode'),
  deepseek: pricingEngine.rateFor(90, 'DeepSeek', 'DeepSeek V4.1 Flash (max)', 'go10', 'OpenCode'),
  grok45: pricingEngine.rateFor(999, 'xAI', 'Grok 4.5', 'goat10', 'CommandCode'),
}));
assert.equal(strict.luna, null); assert.equal(strict.grok46, null);
assert.equal(strict.deepseek.rate, 90); assert.equal(strict.deepseek.mapping.multiplier, null);
assert.equal(strict.grok45.rate, 999); assert.equal(strict.grok45.mapping.multiplier, null);
check('explicit engine rejects inherited/null official coverage, reseller is not official, unknown access stays API', strict);
await press('CommandCode', 'goat10');
await checkErrors();
await page.reload(); await ready(); await settle();
assert.deepEqual(await plans(), { OpenAI: 'pro200', SpaceXAI: 'ultra200', CommandCode: 'goat10' });
assert.ok(Math.abs((await rowCost('LongCat 2.0')) - apiLongCat / 5) < 1e-9);
const fixtures = [
  [{ OpenCode: 'go10', CommandCode: 'goat10', Cursor: 'ultra200', OpenAI: 'pro200' }, { OpenAI: 'pro200', SpaceXAI: 'ultra200', OpenCode: 'go10' }],
  [{ OpenAI: 'go10', SpaceXAI: 'goat10', Cursor: 'go10', LongCat: 'go10', Nope: 'x' }, {}],
  [{ CommandCode: 'goat10' }, { CommandCode: 'goat10' }],
  [{ SpaceXAI: 'heavy300', Cursor: 'ultra200', OpenCode: 'goPlus40' }, { SpaceXAI: 'heavy300', OpenCode: 'goPlus40' }],
];
for (const [stored, expected] of fixtures) {
  await page.evaluate(stored => localStorage.setItem('mkl-pricing-v1', JSON.stringify({ mix: { ...PRICING.DEFAULT_MIX }, plans: stored })), stored);
  await checkErrors();
  await page.reload(); await ready(); await settle();
  assert.deepEqual(await plans(), expected);
  const twice = await page.evaluate(() => PRICING.normalizeSelections(CHANNEL_BARS, PRICING.normalizeSelections(CHANNEL_BARS, S.subscriptionPlans)));
  assert.deepEqual(twice, expected);
}
check('refresh persistence, fixed-order exclusivity, Cursor legacy precedence, no embedded-key scope widening', fixtures);

await page.click('button[data-pricing]', { label: 'Reopen dock' });
await openMix();
await page.click('#plans-api');
await settle();
await page.fill('#mix-input', '1');
await page.fill('#mix-cacheRead', '96.1');
await page.click('button[data-provider-button="SpaceXAI"][data-plan="heavy300"]', { label: 'Select Heavy for reset test' });
await settle();
const customMix = await page.evaluate(() => ({ ...S.mix }));
await page.click('#mix-defaults');
const afterMixReset = await page.evaluate(() => ({ mix: { ...S.mix }, plans: { ...S.subscriptionPlans }, defaultMix: { ...PRICING.DEFAULT_MIX } }));
assert.deepEqual(afterMixReset.mix, afterMixReset.defaultMix, '恢复默认比例 resets mix only');
assert.deepEqual(afterMixReset.plans, { SpaceXAI: 'heavy300' }, 'plan selection survives mix reset');
await page.fill('#mix-input', '1');
await page.fill('#mix-cacheRead', '96.1');
await page.click('#plans-api');
const afterPlanReset = await page.evaluate(() => ({ mix: { ...S.mix }, plans: { ...S.subscriptionPlans } }));
assert.deepEqual(afterPlanReset.plans, {}, '所有厂商恢复 API resets plans only');
assert.deepEqual(afterPlanReset.mix, customMix, 'custom mix survives plan reset');
await checkErrors();
const health = await page.evaluate(() => ({ errors: window.__errs2, requests: performance.getEntriesByType('resource').map(r => r.name), externalScripts: [...document.scripts].filter(s => s.src).map(s => s.src) }));
assert.deepEqual(health.errors, []); assert.deepEqual(health.requests, []); assert.deepEqual(health.externalScripts, []);
check('zero runtime network and zero errors', health);

report.passed = true;
await fs.writeFile(process.env.MKL_BROWSER_REPORT || '/tmp/llm-pf-subscription-eligibility-report.json', JSON.stringify(report, null, 2));
console.log('Subscription reachability browser QA passed. Space ' + task.spaceId + ' left open (parent owns it).');

} finally {
  await page.evaluate(saved => {
    for (const key of Object.keys(localStorage)) if (!Object.hasOwn(saved, key)) localStorage.removeItem(key);
    for (const [key, value] of Object.entries(saved)) localStorage.setItem(key, value);
  }, savedStorage);
  await page.cdp('Emulation.setDeviceMetricsOverride', { ...savedViewport, mobile: false });
  await page.reload();
  await ready();
}
