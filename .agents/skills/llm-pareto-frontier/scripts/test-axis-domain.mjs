import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { createAxisDomain } from './axis-domain.mjs';

const baseline = process.argv[2];
if (baseline) {
  const html = readFileSync(baseline, 'utf8');
  const code = html.slice(html.indexOf('const niceCeil ='), html.indexOf('// 纵轴取当前指标值'));
  const context = { MODELS: [{ cost: 10, tok: 100 }, { cost: 20, tok: 200 }, { cost: 10000, tok: 100000 }], costOf: m => m.cost, S: { costScale: 'lin', tokScale: 'lin' } };
  vm.createContext(context);
  const result = vm.runInContext(`${code}\n({ min:DOM.costMin, max:DOM.costMax, span:Math.abs(xn.cost(10)-xn.cost(20)) })`, context);
  console.log('Hidden outlier repro', JSON.stringify(result));
  assert.ok(result.span > 0.8, 'retained models must occupy most of the axis after hiding the outlier');
} else {
  for (const scale of ['lin', 'log']) {
    const axis = createAxisDomain([10, 20], scale);
    assert.ok(axis.project(20) - axis.project(10) > 0.8);
    assert.ok(axis.project(10) > 0 && axis.project(20) < 1);
    assert.equal(createAxisDomain([10, 20, null, NaN, Infinity], scale).max, axis.max);
    for (const values of [[], [0], [7], [0.0001], [0.0001, 0.001], [0, 10], [-20, -10]]) {
      if (scale === 'log' && values.some(v => v < 0)) continue;
      const d = createAxisDomain(values, scale);
      assert.ok(Number.isFinite(d.min) && Number.isFinite(d.max) && d.max > d.min);
      for (const v of values) assert.ok(Number.isFinite(d.project(v)) && d.project(v) >= 0 && d.project(v) <= 1);
    }
    const free = createAxisDomain([0, 10], scale);
    assert.equal(free.project(0), 0);
    assert.ok(free.project(10) > 0.9 && free.project(10) < 1);
  }
  assert.deepEqual([10, 20].map(createAxisDomain([10, 20]).project).map(v => +v.toFixed(6)), [0.053571, 0.946429]);
  const html = readFileSync(new URL('../prototype-4d-3d.html', import.meta.url), 'utf8');
  const runtime = html.match(/\/\/ AXIS_DOMAIN_RUNTIME\n([\s\S]*?)\/\/ END_AXIS_DOMAIN_RUNTIME/)[1];
  assert.equal(vm.runInNewContext(`${runtime}\ncreateAxisDomain([10,20]).project(10)`), createAxisDomain([10,20]).project(10));
  const ticks = html.slice(html.indexOf('  const linTicks ='), html.indexOf('  for (const v of costTicks)'));
  for (const values of [[], [0], [100, 200]]) for (const scale of ['lin', 'log']) {
    const axis = createAxisDomain(values, scale);
    const actual = vm.runInNewContext(`${ticks}\n({costTicks,tokTicks})`, {
      DOM: { costMin: axis.min, costMax: axis.max, tokMin: axis.min, tokMax: axis.max },
      S: { costScale: scale, tokScale: scale },
    }, { timeout: 100 });
    assert.deepEqual(Array.from(actual.tokTicks), Array.from(actual.costTicks), 'token and cost ticks share zero-safe domain behavior');
    assert.ok(actual.tokTicks.length > 0 && actual.tokTicks.every(Number.isFinite));
    if (!values.length && scale === 'log') assert.deepEqual(Array.from(actual.tokTicks), [0, 0.2, 0.4, 0.6, 0.8, 1]);
    if (values.length === 2 && scale === 'log') assert.deepEqual(Array.from(actual.tokTicks), [100, 200]);
  }
  console.log('PASS retained range, margin, zero-safe log, singleton, empty, invalid values, embedded artifact parity, actual buildWorld ticks terminate');
}
