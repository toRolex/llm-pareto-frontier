// Run (Ego's embedded runtime does not inherit CLI environment):
// export MKL_SPACE_ID=13
// { printf 'process.env.MKL_SPACE_ID="%s";\n' "$MKL_SPACE_ID"; tee < .agents/skills/llm-pareto-frontier/scripts/test-redesign-browser.mjs; } | ego-browser nodejs
// The owner serializes p1 access and finishes the shared TaskSpace, not this script.
const fs = await import('node:fs/promises');
const { default: assert } = await import('node:assert/strict');
const spaceId = Number(process.env.MKL_SPACE_ID);
assert.ok(Number.isInteger(spaceId) && spaceId > 0, 'MKL_SPACE_ID must name the existing TaskSpace');
const task = await taskSpace(spaceId);
const page = task.page('p1');
// 固定标准验收尺寸：CDP override 会跨运行残留，窄视口只能出现在显式场景里
await page.cdp('Emulation.setDeviceMetricsOverride', { width: 1470, height: 837, deviceScaleFactor: 2, mobile: false });
const directory = '/tmp/mkl-redesign-backup';
await fs.mkdir(directory, { recursive: true });
const report = { spaceId, startedAt: new Date().toISOString(), checks: [], passed: false };
let original, deniedPage, preload;
const check = (name, evidence) => report.checks.push({ name, evidence });
const ready = async p => {
  await p.waitForFunction(() => typeof world !== 'undefined' && world && typeof labelLayer !== 'undefined');
  await p.waitForFunction(() => !flight);
};
const settle = async () => {
  // 2D 场景必须等到标签层按当前视口重算（flight 期间签名被清空，落地后才重建）
  await page.waitForFunction(() => !flight && (S.view === '3d' || labelSignature !== ''));
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
};

// This oracle deliberately does not call pareto(), toWorld() or updateLabels().
const inspect = () => page.evaluate(() => {
  const close = (a, b, epsilon = 2e-5) => Number.isFinite(a) && Number.isFinite(b) && Math.abs(a - b) < epsilon;
  const rows = world.rows;
  const axis = S.view === 'tok' ? 'tok' : 'cost';
  const value = m => axis === 'cost' ? costOf(m) : m.tok;
  const front = rows.filter(a => !rows.some(b => b !== a && value(b) <= value(a) && b.val >= a.val && (value(b) < value(a) || b.val > a.val)))
    .sort((a, b) => value(a) - value(b));
  const expected = rows.map(m => m.model).sort();
  const groups = [...document.querySelectorAll('#labels g[data-model]')];
  // Overlap is a text concern: the connector line converges on the anchor, so
  // coincident effort points of one model always overlap at group level.
  const labels = groups.map(g => { const tspans = [...g.querySelectorAll('tspan')].map(t => t.textContent); const r = g.querySelector('text').getBoundingClientRect(); return { name: g.dataset.model, front: g.dataset.front === 'true', tspans, effort: effortOf(g.dataset.model), box: { x: r.x, y: r.y, w: r.width, h: r.height } }; });
  const overlaps = [];
  for (let i = 0; i < labels.length; i++) for (let j = i + 1; j < labels.length; j++) {
    const a = labels[i].box, b = labels[j].box;
    if (a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y) overlaps.push([labels[i].name, labels[j].name]);
  }
  const normalize = (v, max, min, scale, values) => {
    if (scale !== 'log') return (max - v) / (max - min);
    const positive = values.filter(v => v > 0), pivot = positive.length ? Math.min(...positive) : 1;
    const transform = min === 0 ? v => Math.log1p(v / pivot) : Math.log;
    return (transform(max) - transform(v)) / (transform(max) - transform(min));
  };
  const position = m => [normalize(costOf(m), DOM.costMax, DOM.costMin, S.costScale, rows.map(costOf)) * W.w,
    (m.val - DOM.idxMin) / (DOM.idxMax - DOM.idxMin) * W.d,
    normalize(m.tok, DOM.tokMax, DOM.tokMin, S.tokScale, rows.map(m => m.tok)) * W.h];
  const pointFailures = world.sprites.filter(sp => !sp.position.toArray().every((v, i) => close(v, position(sp.userData.model)[i])))
    .map(sp => sp.userData.model.model);
  const expectedLine = front.flatMap(m => { const p = position(m); p[axis === 'cost' ? 2 : 0] = -0.02; return p; });
  const actualLine = Array.from(world.frontLines[axis][0].geometry.attributes.position.array);
  const lineMatches = actualLine.length === expectedLine.length && actualLine.every((v, i) => close(v, expectedLine[i]));
  const flagFailures = labels.filter(l => l.front !== front.some(m => m.model === l.name)).map(l => l.name);
  // Front line must stay a solid, theme-colored line (regression guard against
  // the old faint dashed style).
  const frontMat = (() => { const m = world.frontLines[axis][0].material;
    return { dashed: m.isLineDashedMaterial === true, color: m.color.getHexString(), opacity: m.opacity }; })();
  // Point-level coverage: distinct projected anchors, and how many carry a label.
  const anchorOf = m => { const p = toWorld(m).project(camera2); return `${Math.round((p.x + 1) * innerWidth / 2)}@${Math.round((1 - p.y) * innerHeight / 2)}`; };
  const anchors = new Set(rows.map(anchorOf));
  const labeledAnchors = new Set(groups.map(g => anchorOf(rows.find(m => m.model === g.dataset.model))));
  const viewport = { w: innerWidth, h: innerHeight };
  // Axis-region audit: per-sprite rects, same math as the page.
  const pxPerWorld = innerHeight / (camera2.top - camera2.bottom);
  const axisRects = [];
  world.group.traverse(o => { if (!o.isSprite || !o.userData.axis) return;
    const p = o.position.clone().project(camera2);
    const cx = (p.x + 1) * innerWidth / 2, cy = (1 - p.y) * innerHeight / 2;
    const hw = o.scale.x * pxPerWorld / 2 + 10, hh = o.scale.y * pxPerWorld / 2 + 8;
    axisRects.push({ x: cx - hw, y: cy - hh, w: hw * 2, h: hh * 2 }); });
  const stateRect = document.getElementById('state').getBoundingClientRect();
  if (stateRect.height > 0) axisRects.push({ x: stateRect.x, y: stateRect.y, w: stateRect.width, h: stateRect.height });
  return { view: S.view, metric: METRICS[S.metric].key, mode: S.priceMode, plan: S.subscriptionPlans.OpenAI || null,
    errors: window.__mklRedesignErrors || [], boxedLabels: document.querySelectorAll('#labels rect').length, perTask: S.perTask, points: world.sprites.length, pointFailures, lineMatches, actualLine, expectedLine,
    front: front.map(m => m.model), frontBase: [...new Set(front.map(m => baseKey(m.model)))], baseKeys: rows.map(m => baseKey(m.model)),
    coverage: window.__labelCoverage, axisRects, viewport, frontMat, anchors: anchors.size, labeledAnchors: labeledAnchors.size,
    sorted: [...rows].sort((a, b) => value(a) - value(b)).map(m => m.model),
    expected, labels, overlaps, flagFailures, costs: rows.map(m => ({ name: m.model, cost: costOf(m), tok: m.tok })) };
});
let lastRecord = null;
function verify(record, { relaxedBounds = false } = {}) {
  lastRecord = record;
  assert.deepEqual(record.errors, [], 'scenario must have no runtime errors');
  assert.equal(record.boxedLabels, 0, 'labels must be text without boxes');
  assert.ok(record.points > 0, 'scenario must render points');

  assert.deepEqual(record.pointFailures, [], 'points must use effective costOf');
  assert.equal(record.lineMatches, true, 'front line must match independent effective-price/token frontier and ordering');
  assert.equal(record.frontMat.dashed, false, 'front line must be solid, not dashed');
  assert.ok(['66d9a8', '2e7358'].includes(record.frontMat.color), 'front line color must follow the theme');
  assert.ok(record.frontMat.opacity >= 0.9, 'front line must be near-opaque');
  // Labels cover every visible point minus whatever screen-space collision
  // arbitration or viewport clipping had to drop. The name belongs to the base
  // model (labeled at most once, effort-only lines on its other points), and
  // effort belongs to the point, so the checkable invariants are relational:
  // rendered labels ⊆ visible models, names unique per base model, and the
  // name/effort split matches the data-model suffix.
  const named = record.labels.filter(l => l.tspans.length === 2);
  const nameTexts = named.map(l => l.tspans[0]);
  assert.equal(new Set(nameTexts).size, nameTexts.length, 'a model name must be labeled at most once');
  for (const l of record.labels) {
    assert.ok(record.expected.includes(l.name), `label ${l.name} must be a visible model`);
    assert.ok(l.tspans.length === 1 || l.tspans.length === 2, `label ${l.name} must have one or two lines`);
    assert.equal(l.tspans.at(-1), l.effort, `label ${l.name} effort line must match effortOf`);
  }
  assert.deepEqual(record.flagFailures, [], 'front badges must use the same frontier');
  assert.deepEqual(record.overlaps, [], 'SVG label rectangles must not overlap');
  // Name coverage: every visible base model is either named or explicitly
  // dropped by collision/clipping; the reported set must equal the DOM.
  assert.ok(record.coverage, 'page must report label coverage');
  const domNames = [...new Set(record.labels.filter(l => l.tspans.length === 2).map(l => l.tspans[0]))].sort();
  assert.deepEqual([...new Set(record.coverage.named)].sort(), domNames, 'reported named set must equal DOM name set');
  assert.deepEqual([...new Set([...record.coverage.named, ...record.coverage.dropped])].sort(), [...new Set(record.baseKeys)].sort(),
    'every visible base model must be named or explicitly dropped');
  // Point-level coverage: at least 3/4 of distinct anchors carry a label, so
  // effort tags cannot silently vanish even when points coincide.
  if (!relaxedBounds) assert.ok(record.labeledAnchors >= record.anchors * 0.75,
    `too few labeled anchors: ${record.labeledAnchors}/${record.anchors}`);
  // Bounded omission rule: dense clusters can physically exhaust label space.
  // Every omission must be reported (named ∪ dropped == visible base models),
  // and drops must stay rare: frontier names ≤ 25% of the frontier, all drops
  // ≤ 15% of visible base models (floor, so a small frontier cannot lose its
  // only name). Hover tooltip is the fallback entry for dropped names.
  const droppedFront = record.coverage.dropped.filter(bk => record.frontBase.includes(bk));
  if (!relaxedBounds) {
    assert.ok(droppedFront.length <= Math.floor(record.frontBase.length * 0.25),
      `too many frontier names dropped: ${droppedFront.join(', ')}`);
    assert.ok(record.coverage.dropped.length <= Math.floor(record.baseKeys.length * 0.15),
      `too many model names dropped: ${record.coverage.dropped.join(', ')}`);
  }
  // Labels must stay clear of axis ticks, axis titles and the state strip.
  const axisIntrusions = [];
  const intrusionDetail = [];
  for (const l of record.labels) for (const a of record.axisRects)
    if (l.box.x < a.x + a.w && l.box.x + l.box.w > a.x && l.box.y < a.y + a.h && l.box.y + l.box.h > a.y) { axisIntrusions.push(l.name); intrusionDetail.push({ name: l.name, box: l.box, hit: a }); }
  record.intrusionDetail = intrusionDetail;
  assert.deepEqual(axisIntrusions, [], 'labels must not overlap axis ticks, titles or the state strip');
}
try {
  await ready(page);
  report.url = await page.url();
  original = await page.evaluate(() => ({ state: JSON.parse(JSON.stringify(S)), theme, selected: [...selected].map(([k, v]) => [k, [...v]]),
    storage: ['mkl-pricing-v1', 'mkl-theme'].map(key => { try { return { key, value: localStorage.getItem(key) }; } catch { return { key, unavailable: true }; } }) }));
  // Observe the real load via Resource Timing, not a window.fetch monkey-patch.
  const errorPreload = await page.cdp('Page.addScriptToEvaluateOnNewDocument', { source: `
    window.__mklRedesignErrors=[];
    addEventListener('error',e=>window.__mklRedesignErrors.push(e.message));
    addEventListener('unhandledrejection',e=>window.__mklRedesignErrors.push(String(e.reason)));
  ` });
  await page.cdp('Network.enable');
  await page.events();
  await page.reload();
  await ready(page);
  await page.cdp('Page.removeScriptToEvaluateOnNewDocument', { identifier: errorPreload.identifier });
  const events = await page.events();
  const requests = events.filter(e => (e.method || e.type || e.name) === 'Network.requestWillBeSent').map(e => e.params || e.data || e);
  report.networkEvents = events;
  assert.ok(requests.some(e => e.type === 'Document' && e.request?.url.startsWith('file:')), 'CDP must observe the real file document request');
  assert.deepEqual(requests.filter(e => /^https?:/.test(e.request?.url || '')), [], 'CDP observed no HTTP requests');
  check('CDP Network.requestWillBeSent request list', requests);
  const network = await page.evaluate(() => ({ resources: performance.getEntriesByType('resource').map(e => ({ name: e.name, initiatorType: e.initiatorType, transferSize: e.transferSize })),
    externalScripts: [...document.scripts].filter(s => s.src).map(s => s.src), inlineScripts: [...document.scripts].filter(s => !s.src).length }));
  assert.ok(network.inlineScripts > 0);
  assert.deepEqual(network.externalScripts, []);
  assert.deepEqual(network.resources.filter(e => /^(https?:|file:)/.test(e.name)), [], 'no runtime network or file sidecars');
  check('real reload Resource Timing / inline dependency evidence', network);
  await page.evaluate(() => {
    S.metric = 0; S.perTask = false; S.subscriptionPlans = {}; S.mix = { ...PRICING.DEFAULT_MIX };
    pricingPanel.classList.add('hidden'); cfgEl.classList.add('hidden');
    renderPricingPanel(); rebuild(); applyView('cost', true);
  });
  for (const plan of [null, 'plus']) {
    await page.click('button[data-pricing]');
    if (plan) await page.click(`button[data-provider-button="OpenAI"][data-plan="${plan}"]`);
    else await page.click('#plans-api');
    await page.click('#pricing-close');
    for (const mode of ['blend', 'in', 'out', 'cache']) {
      await page.click(`button[data-price="${mode}"]`);
      await settle();
      const record = await inspect(); verify(record);
      assert.equal(record.plan, plan); assert.equal(record.mode, mode);
      check(`Cost–Metric ${mode} / ${plan || 'API'}`, record);
    }
  }
  await page.click('button[data-pricing]');
  const apiButton = 'button[data-provider-button="OpenAI"][data-tier="0"]';
  await page.focus(apiButton);
  await page.press(apiButton, 'ArrowRight');
  const keyboardRight = await page.evaluate(() => ({ plan: S.subscriptionPlans.OpenAI, focused: document.activeElement.dataset.plan, pressed: document.activeElement.getAttribute('aria-pressed') }));
  assert.equal(keyboardRight.plan, 'plus'); assert.equal(keyboardRight.focused, 'plus'); assert.equal(keyboardRight.pressed, 'true');
  await page.press('button[data-provider-button="OpenAI"][data-plan="plus"]', 'End');
  const keyboardEnd = await page.evaluate(() => ({ plan: S.subscriptionPlans.OpenAI, focused: document.activeElement.dataset.plan,
    expected: [...document.querySelectorAll('button[data-provider-button="OpenAI"]')].at(-1).dataset.plan }));
  assert.equal(keyboardEnd.plan, keyboardEnd.expected); assert.equal(keyboardEnd.focused, keyboardEnd.expected);
  await page.press(`button[data-provider-button="OpenAI"][data-plan="${keyboardEnd.expected}"]`, 'Home');
  assert.equal(await page.evaluate(() => S.subscriptionPlans.OpenAI || null), null);
  const rangeSelector = 'input[data-provider-range="OpenAI"]';
  await page.focus(rangeSelector);
  await page.press(rangeSelector, 'Home');
  await page.press(rangeSelector, 'ArrowRight');
  assert.equal(await page.evaluate(() => S.subscriptionPlans.OpenAI), 'plus');
  check('plan button ArrowRight/Home/End and native range ArrowRight', { keyboardRight, keyboardEnd, rangeSelector });
  await page.click('#pricing-close');
  const plus = await page.evaluate(() => MODELS.filter(m => m.creator === 'OpenAI').map(m => ({ name: m.model, api: (() => {
    const saved = S.subscriptionPlans; S.subscriptionPlans = {}; try { return costOf(m); } finally { S.subscriptionPlans = saved; }
  })(), effective: costOf(m), multiplier: priceBreakdown(m).input?.mapping?.multiplier ?? null })));
  assert.ok(plus.some(m => m.multiplier > 1 && m.effective < m.api), 'Plus must actually discount at least one mapped model');
  check('OpenAI Plus changes effective costs', plus);

  // Temporary browser-only models demonstrate crossed input/output ranks. No ROWS_RAW edits.
  const fixture = await page.evaluate(() => {
    const savedModels = MODELS.slice(), savedSelected = [...selected].map(([k, v]) => [k, new Set(v)]), savedS = { ...S };
    const snapshots = [];
    try {
      const fixtures = [30, 50, 70].map((index, i) => ({ ...savedModels[0], model: `Regression ${'ABC'[i]}`, creator: 'Regression', index,
        pin: i + 1, pout: 3 - i, pcache: 0.1, pcacheWrite: i + 1, tok: 1000 + i * 1000, cost: 777, latest: true }));
      MODELS.splice(0, MODELS.length, ...fixtures); selected.clear();
      fixtures.forEach(m => selected.set(baseKey(m.model), new Set([effortOf(m.model)])));
      S.metric = 0; S.perTask = false; S.subscriptionPlans = {}; S.view = 'cost';
      for (const mode of ['in', 'out']) {
        S.priceMode = mode; rebuild(); applyView('cost', true);
        const members = world.rows.filter(a => !world.rows.some(b => b !== a && costOf(b) <= costOf(a) && b.val >= a.val && (costOf(b) < costOf(a) || b.val > a.val)))
          .sort((a, b) => costOf(a) - costOf(b));
        snapshots.push({ mode, sorted: [...world.rows].sort((a, b) => costOf(a) - costOf(b)).map(m => m.model), members: members.map(m => m.model),
          line: Array.from(world.frontLines.cost[0].geometry.attributes.position.array),
          expectedLine: members.flatMap(m => { const p = toWorld(m).toArray(); p[2] = -0.02; return p; }),
          labels: [...labelLayer.querySelectorAll('g[data-front="true"]')].map(g => g.dataset.model).sort() });
      }
      return { snapshots, restored: true, rawCount: ROWS_RAW.length, modelsCount: savedModels.length };
    } finally {
      MODELS.splice(0, MODELS.length, ...savedModels); selected.clear(); savedSelected.forEach(([k, v]) => selected.set(k, v));
      Object.assign(S, savedS); rebuild(); applyView(S.view, true);
    }
  });
  assert.deepEqual(fixture.snapshots[0].sorted, ['Regression A', 'Regression B', 'Regression C']);
  assert.deepEqual(fixture.snapshots[1].sorted, ['Regression C', 'Regression B', 'Regression A']);
  assert.deepEqual(fixture.snapshots[0].members, ['Regression A', 'Regression B', 'Regression C']);
  assert.deepEqual(fixture.snapshots[1].members, ['Regression C']);
  for (const r of fixture.snapshots) {
    assert.deepEqual(r.labels, [...r.members].sort());
    assert.equal(r.line.length, r.expectedLine.length);
    assert.ok(r.line.every((v, i) => Math.abs(v - r.expectedLine[i]) < 2e-5));
  }
  check('crossed input/output rank and frontier membership; fixture restored in finally', fixture);
  await page.click('button[data-price="blend"]');
  // Exactly 22 scenarios: both 2D views times all 11 real metrics.
  for (const view of ['cost', 'tok']) {
    await page.click(`button[data-view="${view}"]`);
    await settle();
    for (let metric = 0; metric < 11; metric++) {
      await page.click(`button[data-metric="${metric}"]`);
      await settle();
      const record = await inspect(); verify(record);
      check(`labels ${view} / ${record.metric}`, record);
    }
  }
  assert.equal(report.checks.filter(c => c.name.startsWith('labels ')).length, 22);
  const runtimeErrors = await page.evaluate(() => window.__mklRedesignErrors);
  assert.deepEqual(runtimeErrors, []);
  check('all 22 label scenarios runtime errors empty', runtimeErrors);

  // 3D round trip through real view clicks: labels must clear and rebuild.
  await page.click('button[data-view="3d"]');
  await settle();
  assert.equal(await page.evaluate(() => labelLayer.children.length), 0, '3D view must clear 2D labels');
  assert.equal(await page.evaluate(() => window.__labelCoverage), null, '3D view must invalidate coverage stats');
  await page.click('button[data-view="cost"]');
  await settle();
  verify(await inspect());
  check('3D round trip via real view clicks', {});

  // Light theme through a real click: labels and frontier line re-derive.
  await page.click('#theme-switch button[data-theme="light"]');
  await settle();
  verify(await inspect());
  await page.screenshot({ path: '/tmp/mkl-redesign-backup/labels-light.png' });
  await page.click('#theme-switch button[data-theme="dark"]');
  await settle();
  verify(await inspect());
  check('light/dark theme via real clicks', {});

  // Narrow viewport: axis bands, collision and coverage must re-derive.
  // CDP 模拟尺寸不触发 window resize，手动派发以走页面真实 resize 处理器
  await page.cdp('Emulation.setDeviceMetricsOverride', { width: 1100, height: 700, deviceScaleFactor: 1, mobile: false });
  await page.evaluate(() => dispatchEvent(new Event('resize')));
  await settle();
  verify(await inspect(), { relaxedBounds: true });
  await page.cdp('Emulation.clearDeviceMetricsOverride', {});
  await page.evaluate(() => dispatchEvent(new Event('resize')));
  await settle();
  verify(await inspect());
  check('narrow viewport relayout', {});

  deniedPage = await task.newPage();
  const injection = await deniedPage.cdp('Page.addScriptToEvaluateOnNewDocument', { source: `
    window.__mklErrors=[];
    addEventListener('error',e=>window.__mklErrors.push(e.message));
    addEventListener('unhandledrejection',e=>window.__mklErrors.push(String(e.reason)));
    Object.defineProperty(window,'localStorage',{configurable:true,get(){throw new DOMException('Regression denied storage','SecurityError')}});
  ` });
  preload = injection.identifier;
  await deniedPage.goto(report.url);
  await ready(deniedPage);
  const deniedInitial = await deniedPage.evaluate(() => ({ available: savedPricing.storageAvailable, warning: document.getElementById('storage-warning').classList.contains('visible'), errors: window.__mklErrors }));
  assert.equal(deniedInitial.available, false); assert.equal(deniedInitial.warning, true); assert.deepEqual(deniedInitial.errors, []);
  await deniedPage.click('#theme-switch button[data-theme="light"]');
  const deniedLight = await deniedPage.evaluate(() => ({ theme, domTheme: document.documentElement.dataset.theme, errors: window.__mklErrors }));
  assert.equal(deniedLight.theme, 'light'); assert.equal(deniedLight.domTheme, 'light'); assert.deepEqual(deniedLight.errors, []);
  await deniedPage.click('#theme-switch button[data-theme="dark"]');
  const deniedDark = await deniedPage.evaluate(() => ({ theme, domTheme: document.documentElement.dataset.theme, errors: window.__mklErrors }));
  assert.equal(deniedDark.theme, 'dark'); assert.equal(deniedDark.domTheme, 'dark'); assert.deepEqual(deniedDark.errors, []);
  check('denied storage: real light/dark theme clicks remain functional', { deniedLight, deniedDark });
  await deniedPage.click('button[data-pricing]');
  await deniedPage.click('button[data-provider-button="OpenAI"][data-plan="plus"]');
  const deniedChanged = await deniedPage.evaluate(() => ({ plan: S.subscriptionPlans.OpenAI, warning: document.getElementById('storage-warning').classList.contains('visible'), points: world.sprites.length, errors: window.__mklErrors }));
  assert.equal(deniedChanged.plan, 'plus'); assert.equal(deniedChanged.warning, true); assert.ok(deniedChanged.points > 0); assert.deepEqual(deniedChanged.errors, []);
  await deniedPage.reload(); await ready(deniedPage);
  const deniedReloaded = await deniedPage.evaluate(() => ({ plans: S.subscriptionPlans, mix: S.mix, defaultMix: PRICING.DEFAULT_MIX, errors: window.__mklErrors }));
  assert.deepEqual(deniedReloaded.plans, {}); assert.deepEqual(deniedReloaded.mix, deniedReloaded.defaultMix); assert.deepEqual(deniedReloaded.errors, []);
  check('separate page CDP preload denies storage; read/write/reload remain functional', { page: deniedPage.label, deniedInitial, deniedChanged, deniedReloaded });
  report.passed = true;
} catch (error) {
  report.failure = { message: error.message, stack: error.stack, lastRecord: lastRecord ? { coverage: lastRecord.coverage, frontBase: lastRecord.frontBase, labels: lastRecord.labels.length, view: lastRecord.view, metric: lastRecord.metric, mode: lastRecord.mode, viewport: lastRecord.viewport, plan: lastRecord.plan, intrusionDetail: lastRecord.intrusionDetail, sig: null } : null };
  process.exitCode = 1;
} finally {
  try {
    if (deniedPage) {
      if (preload) await deniedPage.cdp('Page.removeScriptToEvaluateOnNewDocument', { identifier: preload });
      await deniedPage.close();
    }
    if (original) await page.evaluate(saved => {
      for (const item of saved.storage) if (!item.unavailable) {
        if (item.value === null) localStorage.removeItem(item.key); else localStorage.setItem(item.key, item.value);
      }
      Object.assign(S, saved.state); selected.clear(); saved.selected.forEach(([k, v]) => selected.set(k, new Set(v)));
      theme = saved.theme; document.documentElement.dataset.theme = theme; scene.background.setHex(palette().bg);
      document.querySelectorAll('#theme-switch button').forEach(b => b.classList.toggle('on', b.dataset.theme === theme));
      renderPricingPanel(); pricingPanel.classList.add('hidden'); cfgEl.classList.add('hidden');
      rebuild(); applyView(S.view, true);
      document.querySelectorAll('button[data-price]').forEach(b => b.classList.toggle('on', b.dataset.price === S.priceMode));
      document.querySelectorAll('button[data-metric]').forEach(b => b.classList.toggle('on', +b.dataset.metric === S.metric));
      document.querySelectorAll('button[data-pertask]').forEach(b => b.classList.toggle('on', S.perTask));
    }, original);
    report.restored = true;
  } catch (error) { report.cleanupFailure = String(error); report.passed = false; process.exitCode = 1; }
  report.finishedAt = new Date().toISOString();
  await fs.writeFile(`${directory}/test-redesign-browser.json`, JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ passed: report.passed, checks: report.checks.length, report: `${directory}/test-redesign-browser.json`, failure: report.failure, cleanupFailure: report.cleanupFailure }));
}
