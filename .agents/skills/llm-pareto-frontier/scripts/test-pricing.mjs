import assert from 'node:assert/strict';
import { createPricingEngine, validateMix, cacheWriteQuote } from './pricing-model.mjs';
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
  ['Cursor','Composer 2.5','ultra200',152],
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
console.log('Pricing behavior passed. Persistence and independent resets are exercised by verify-pricing-browser.mjs.');
