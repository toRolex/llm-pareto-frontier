import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const task = await taskSpace(Number(process.env.MKL_BROWSER_SPACE) || 'Subscription pricing acceptance');
console.log('Browser space '+task.spaceId);
const page = task.page('p1');
const dir = '/tmp/mkl-subscription-evidence';
await fs.mkdir(dir, { recursive: true });
const state = async () => {
  await page.waitForFunction(() => !flight && (!Motion || sampleMotion(Motion, performance.now()).done));
  // motion.done can flip true on a poll without an intervening rAF frame, so sample sprites
  // only after one more rendered frame lands at the settled target (same settle as test-redesign).
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  return page.evaluate(() => ({
  mix: S.mix, plans: S.subscriptionPlans, mode: S.priceMode, view: S.view, perTask: S.perTask,
  errors: window.__errs2, requests: performance.getEntriesByType('resource').map(x => x.name),
  positions: world.sprites.map(s => s.position.toArray()), front: world.front.map(m => m.model),
  costLine: world.frontLines.cost.map(l => Array.from(l.geometry.attributes.position.array)),
  sol: costOf(MODELS.find(m => m.model === 'GPT-6.1 Sol (xhigh)')),
  error: document.getElementById('mix-error').textContent,
  stored: JSON.parse(localStorage.getItem('mkl-pricing-v1') || 'null'),
}));
};
const records = [];
const openMix = () => page.evaluate(() => { const d = document.getElementById('mix-details'); if (d) d.open = true; });
await page.goto(process.env.MKL_BROWSER_URL || 'file:///Users/rolex/Documents/Codes/githubProject/MyProject/llm-pareto-frontier/.agents/skills/llm-pareto-frontier/prototype-4d-3d.html');
await page.click('text="订阅价格"');
await openMix();
await page.click('#plans-api');
await page.click('#mix-defaults');
const initial = await state();
await page.click('button[data-provider-button="OpenAI"][data-plan="pro200"]');
const plan = await state();
assert.ok(Math.abs(initial.sol / plan.sol - 10.4) < 1e-9);
assert.notDeepEqual(plan.positions,initial.positions);
assert.notDeepEqual(plan.front,initial.front);
records.push({ stage: 'OpenAI Pro200 changes positions and 4D front', initial, plan });
await openMix();
await page.fill('#mix-input','1');
const invalid = await state();
assert.deepEqual(invalid.mix,{input:0.4,cacheRead:96.7,cacheWrite:2.6,output:0.3});
assert.match(invalid.error,/100/);
assert.deepEqual(invalid.positions,plan.positions);
await page.fill('#mix-cacheRead','96.1');
const valid = await state();
assert.deepEqual(valid.mix,{input:1,cacheRead:96.1,cacheWrite:2.6,output:0.3});
assert.notDeepEqual(valid.positions,plan.positions);
await page.reload();
const reload = await state();
assert.deepEqual(reload.plans,{OpenAI:'pro200'});
assert.deepEqual(reload.mix,valid.mix);
await page.click('text="订阅价格"');
await openMix();
await page.click('#mix-defaults');
assert.deepEqual((await state()).plans,{OpenAI:'pro200'});
await page.fill('#mix-input','1');
await page.fill('#mix-cacheRead','96.1');
await page.click('#plans-api');
assert.deepEqual((await state()).mix,valid.mix);
assert.deepEqual((await state()).plans,{});
await page.click('#pricing-close');
await page.click('text="Cost–Metric (2D)"');
const before2d = await state();
await page.click('text="输入"');
const input2d = await state();
assert.equal(input2d.view,'cost');
assert.equal(input2d.mode,'in');
assert.notDeepEqual(input2d.costLine,before2d.costLine);
await page.click('text="输出"'); assert.equal((await state()).mode,'out');
await page.click('text="缓存"'); assert.equal((await state()).mode,'cache');
await page.click('text="混合"');
await page.click('text="$/task"'); assert.equal((await state()).perTask,true);
await page.click('text="GDPval"');
await page.click('text="Cost: log"');
await page.click('text="Tok: log"');
assert.equal(await page.evaluate(() => document.querySelectorAll('button[data-scale="perf"]').length),0);
assert.equal(await page.evaluate(() => 'perfScale' in S),false);
assert.equal(await page.evaluate(() => world.rows.every(m => m.val === METRICS[S.metric].get(m))),true);
await page.click('text="Cost: 线性"');
await page.click('text="Tok: 线性"');
await page.screenshot({path:`${dir}/cost-2d.png`});
await page.click('text="Token–Metric (2D)"'); assert.equal((await state()).view,'tok');
await page.click('text="3D"'); assert.equal((await state()).view,'3d');
await page.click('text="$/task"');
await page.click('text="Index"');
await page.click('text="订阅价格"');
await openMix();
await page.click('#mix-defaults');
await page.click('button[data-provider-button="Anthropic"][data-plan="max20x200"]');
await page.screenshot({path:`${dir}/pricing-3d.png`});
await page.click('#pricing-close');
await state();
const hoverPoint = await page.evaluate(() => {
  const sprite = world.sprites.find(s => s.userData.model.model.includes('Claude Sonnet 5.5'));
  const point = sprite.position.clone().project(activeCamera());
  const r=plotRect();
  return {x:r.x+(point.x+1)*r.width/2,y:r.y+(1-point.y)*r.height/2};
});
await page.mouse.move(hoverPoint.x,hoverPoint.y,{label:'Inspect fitted subscription tooltip'});
await page.waitForFunction(() => hoverState !== null);
const tooltip = await page.evaluate(() => document.getElementById('tip').textContent);
assert.match(tooltip,/API ÷/);
assert.match(tooltip,/cache write|Cache write/);
assert.match(tooltip,/2026-09-29/);
await page.screenshot({path:`${dir}/tooltip-3d.png`});
const final = await state();
assert.deepEqual(final.errors,[]);
assert.deepEqual(final.requests,[]);
records.push({stage:'2D frontier updates, modes, task, refresh and independent resets passed', before2d,input2d,final});
await fs.writeFile(`${dir}/browser-results.json`,JSON.stringify(records,null,2));
console.log('Browser behavior passed. Screenshots and results in '+dir);
console.log(await page.snapshot());
// The parent owns TaskSpace completion.
