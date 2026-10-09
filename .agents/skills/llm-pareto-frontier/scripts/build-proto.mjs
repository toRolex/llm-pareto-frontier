#!/usr/bin/env node
// build-proto.mjs — 把中间 JSON（aa-metrics / arena-data）与新 logo 内联进 prototype-4d-3d.html
//
// 输入：
//   $TMPDIR/model-killing-line/aa-metrics.json   (fetch-metrics.mjs 产物，75 变体 × 6 AA 指标)
//   $TMPDIR/model-killing-line/arena-data.json   (fetch-arena.mjs 产物，text + agent 4 榜)
//   /tmp/logos/{nvidia,apodex,multiversecomputing}.svg  （一次性补齐的缺失 logo，见 spec）
// 输出：原地更新 prototype-4d-3d.html 的 METRICS_DATA / ARENA_DATA / LOGOS（nvidialogo.png、
//   apodex.svg、multiversecomputing.svg 三个键）。重复运行幂等（logo 键存在即跳过）。
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { readFile } from 'node:fs/promises';
import { DEFAULT_MIX, createPricingEngine, cacheWriteQuote } from './pricing-model.mjs';

const HERE = new URL('.', import.meta.url).pathname;
const HTML = process.env.MKL_HTML_OUT ?? path.join(HERE, '..', 'prototype-4d-3d.html');
const DIR = process.env.MKL_DIR ?? path.join(os.tmpdir(), 'model-killing-line');
const snapshot = process.env.MKL_SNAPSHOT === '1';
const metrics = snapshot ? {} : readJson(path.join(DIR, 'aa-metrics.json'));
const arena = snapshot ? {} : readJson(path.join(DIR, 'arena-data.json'));
const prices = existsSync(path.join(DIR, 'aa-prices.json'))
  ? readJson(path.join(DIR, 'aa-prices.json'))
  : null;
const pricingEngine = createPricingEngine();

let html = readFileSync(HTML, 'utf8');
const axisSource = await readFile(new URL('./axis-domain.mjs', import.meta.url), 'utf8');
html = html.replace(/\/\/ AXIS_DOMAIN_RUNTIME[\s\S]*?\/\/ END_AXIS_DOMAIN_RUNTIME\n/, `// AXIS_DOMAIN_RUNTIME\n${axisSource.replace(/^export /gm, '')}// END_AXIS_DOMAIN_RUNTIME\n`);
const pricingSource = await readFile(new URL('./pricing-model.mjs', import.meta.url), 'utf8');

// JSON 读取统一走 readJson：解析失败时报出具体文件名，而不是裸 SyntaxError
function readJson(file) {
  try {
    return JSON.parse(readFileSync(file, 'utf8'));
  } catch (err) {
    throw new Error(`JSON 读取/解析失败: ${file} — ${err.message}`);
  }
}

let tokPatched = 0, pricePatched = 0, priceMissing = 0;
if (!snapshot) {
// --- METRICS_DATA / ARENA_DATA（幂等：已存在则替换）---
const METRICS_BLOCK = `const METRICS_DATA = ${JSON.stringify(metrics)};\n`;
const ARENA_BLOCK = `const ARENA_DATA = ${JSON.stringify(arena)};\n`;
if (html.includes('const METRICS_DATA =')) {
  html = html.replace(/const METRICS_DATA = .*?;\n/s, METRICS_BLOCK);
} else {
  html = html.replace('const LOGOS = ', `${METRICS_BLOCK}const LOGOS = `);
}
if (html.includes('const ARENA_DATA =')) {
  html = html.replace(/const ARENA_DATA = .*?;\n/s, ARENA_BLOCK);
} else {
  html = html.replace('const LOGOS = ', `${ARENA_BLOCK}const LOGOS = `);
}

// --- ROWS_RAW.tok 重写为 per-effort 真值 ---
// aa-data.json 的 tok 列是 Intelligence Index 的 output-tokens/task 基准常量
// （同 base 各档全等），真正的 per-effort 值在 fetch-metrics 抓的
// intelligenceIndexOutputTokensPerTask.output。按变体全名逐行覆盖。
// 详情页缺测的变体置 null（tok 维缺测：钉远端、不占便宜、不进 2D 前沿线），
// 绝不留基准常量冒充真值——那会让同 base 各档 tok 全等，x 轴上叠成一列。
// --- ROWS_RAW 重建（v6：以 aa-data.json 为准，不再沿用 HTML 旧快照）---
// 旧行为（v5 及以前）从 HTML 里的 ROWS_RAW 读行清单，导致 AA 榜新增模型
// （如 Sonnet 5.5）永远进不了页面。现在直接以 aa-data.json 行清单重建，
// 再打 per-effort tok 与价格补丁。
// aa-data.json 的 tok 列是 Intelligence Index 的 output-tokens/task 基准常量
// （同 base 各档全等），真正的 per-effort 值在 fetch-metrics 抓的
// intelligenceIndexOutputTokensPerTask.output。按变体全名逐行覆盖。
// 详情页缺测的变体置 null（tok 维缺测：钉远端、不占便宜、不进 2D 前沿线），
// 绝不留基准常量冒充真值——那会让同 base 各档 tok 全等，x 轴上叠成一列。
const aaRows = readJson(path.join(DIR, 'aa-data.json'));
const rows = aaRows.map(r => ({
  model: r.model,
  creator: r.creator,
  index: r.index,
  cost: r.cost ?? null,
  tok: null,
  speed: Number.isFinite(parseFloat(r.speed)) ? parseFloat(r.speed) : null,
}));
let tokMissing = 0;
for (const r of rows) {
  const t = metrics[r.model]?.tokPerTask;
  if (typeof t === 'number' && Number.isFinite(t) && t > 0) {
    if (r.tok !== t) tokPatched++;
    r.tok = t;
  } else {
    if (r.tok !== null) tokMissing++;
    r.tok = null;
  }
}
if (tokMissing) console.warn(`tok 缺测 ${tokMissing} 变体已置 null（详情页无数据，不再用基准常量兜底）`);
// --- ROWS_RAW 价格重写为 token 单价（v5 spec）---
// aa-prices.json（fetch-prices 产物）：base slug → {input, output, cacheHit}（$/M tok）。
// 同模型各 effort 价格相同 → 变体全名剥括号 effort 后取 base slug 查表。
// 综合价由 pricing-model.mjs 的 DEFAULT_MIX 加权（input 0.4 / cacheRead 96.7 / cacheWrite 2.6 / output 0.3，
// cacheWrite 缺独立报价时按 cacheWriteQuote 估算）；此处不再硬编码权重。
// 缺价的变体四价置 null（价格维缺测：隐藏，与 tok 缺测同策略），绝不留 cost per task 冒充。
const SLUG_OVERRIDE_PRICES = {
  'Qwen3.8 Max (0902)': 'qwen3-8-max',
  'GPT-5.5 Instant (June 2026)': 'gpt-5-5-instant-06-26',
  'Nemotron 3 Ultra': 'nvidia-nemotron-3-ultra-550b-a55b',
  'Quasar 438B (max)': 'quasar-438b',
  'Step 5 Preview': 'step-5',
  'DeepSeek V4 Pro 0813 (max)': 'deepseek-v4-pro',
};
function baseSlugForPrices(name) {
  if (SLUG_OVERRIDE_PRICES[name]) return SLUG_OVERRIDE_PRICES[name];
  return name.replace(/\s*\([^)]*\)\s*$/, '').trim()
    .toLowerCase().replace(/\./g, '-').replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '');
}

for (const r of rows) {
  const p = prices?.[baseSlugForPrices(r.model)];
  if (p && [p.input, p.output, p.cacheHit].some(v => typeof v === 'number' && Number.isFinite(v) && v >= 0)) {
    r.pin = p.input; r.pout = p.output; r.pcache = p.cacheHit;
    if (typeof p.cacheWrite === 'number' && Number.isFinite(p.cacheWrite) && p.cacheWrite >= 0) {
      r.pcacheWrite = p.cacheWrite;
      r.pcacheWriteSource = p.cacheWriteSource || 'Artificial Analysis';
    } else {
      const quote = cacheWriteQuote(p.input, r.creator);
      r.pcacheWrite = quote.rate;
      r.pcacheWriteSource = quote.source;
    }
    r.pblend = pricingEngine.mixedRate({ input: r.pin, cacheRead: r.pcache, cacheWrite: r.pcacheWrite, output: r.pout }, DEFAULT_MIX);
    pricePatched++;
  } else {
    r.pin = r.pout = r.pcache = r.pcacheWrite = r.pblend = null;
    r.pcacheWriteSource = null;
    priceMissing++;
  }
}
if (priceMissing) console.warn(`价格缺测 ${priceMissing} 变体已置 null（AA 无价格数据，隐藏处理）`);

// --- 批代标记（v7 spec）：默认只显示每家最新一批，旧批Configs可勾回 ---
// batch = 同厂商同代模型family（如 GPT-6.x 含 6.1）；latest = 该 batch 是否
// 为 creator 下 max(Index) 最高的 batch（Index 只用于代际排序，不作指标过滤）。
// 未进表的 base 回退：batch = base 名（单模型自成一批）。
const BATCHES = {
  'GPT-6 Astra': 'GPT-6.x', 'GPT-6 Sol': 'GPT-6.x', 'GPT-6 Luna': 'GPT-6.x', 'GPT-6.1 Sol': 'GPT-6.x',
  'GPT-5.6 Terra': 'GPT-5.x', 'GPT-5.5 Instant': 'GPT-5.x',
  'Claude Opus 5.5': 'Claude 5.x', 'Claude Sonnet 5.5': 'Claude 5.x', 'Claude Fable 5.1': 'Claude 5.x',
  'Gemini 3.8 Flash': 'Gemini 3.x', 'Gemini 3.1 Pro Preview': 'Gemini 3.x', 'Gemini 3.5 Flash-Lite': 'Gemini 3.x',
  'Gemma 4 31B': 'Gemma 4.x', 'Gemma 4 26B A4B': 'Gemma 4.x',
  'Muse Spark 1.3': 'Muse Spark 1.x', 'Muse Glimmer': 'Muse Glimmer',
  'Grok 4.7': 'Grok 4.x',
  'MiMo-V2.6-Pro': 'MiMo 2.6', 'MiMo-V2.6-Flash': 'MiMo 2.6',
  'Qwen3.8 Max': 'Qwen3.8', 'Qwen3.8 2.4T A95B': 'Qwen3.8', 'Qwen3.8-Flash-Next': 'Qwen3.8', 'Qwen3.8 27B': 'Qwen3.8',
  'Qwen3.7 Plus': 'Qwen3.7', 'Qwen3 Coder Next': 'Qwen3.5-3.6', 'Qwen3.6 35B A3B': 'Qwen3.5-3.6',
  'GLM-5.3': 'GLM-5.3', 'GLM-5.3-Flash': 'GLM-5.3',
  'DeepSeek V4.1 Flash': 'DeepSeek V4', 'DeepSeek V4 Pro 0813': 'DeepSeek V4', 'DeepSeek V4 Flash Vision': 'DeepSeek V4',
  'Kimi K3': 'Kimi K3', 'Kimi K2.7 Code': 'Kimi K2.7',
  'Nemotron 3 Ultra': 'Nemotron 3', 'Nemotron 3.5 Lightning': 'Nemotron 3',
  'Mistral Medium 3.5': 'Mistral 3.5-gen', 'Mistral Small 4': 'Mistral 3.5-gen',
  'Mistral Large 3': 'Mistral 3.5-gen', 'Ministral 3 14B': 'Mistral 3.5-gen', 'Ministral 3 8B': 'Mistral 3.5-gen',
  'Granite 4.2 30B': 'Granite 4.2', 'Granite 4.2 8B': 'Granite 4.2', 'Granite 4.2 3B': 'Granite 4.2',
  'Ling 3.0 Flash': 'Ling 3.0 Flash', 'Ling-3.0-flash-VL': 'Ling 3.0 Flash', 'Ling-3.0-flash-Fin': 'Ling 3.0 Flash',
};
for (const r of rows) {
  r.batch = BATCHES[baseSlugName(r.model)] ?? baseSlugName(r.model);
}
// base 名（剥 effort 括号；与 BATCHES 键同名 helper）
function baseSlugName(name) { return name.replace(/\s*\([^)]*\)\s*$/, '').trim(); }
// 每 creator 取「可显示行（tok/价格/Index 齐全）里 max(Index) 最高的 batch」为最新批；
// creator 无可显示行时回退全体行（避免唯一可显示模型被无数据的“新一代”挤掉默认位）。
const latestBatch = new Map(); // creator → batch
for (const r of rows) {
  const displayable = r.tok > 0 && Number.isFinite(r.pblend) && r.pblend >= 0 && Number.isFinite(r.index);
  const cur = latestBatch.get(r.creator);
  if (cur && !cur.displayable && displayable) { latestBatch.set(r.creator, { batch: r.batch, index: r.index, displayable }); continue; }
  if (cur && !cur.displayable && !displayable && r.index > cur.index) latestBatch.set(r.creator, { batch: r.batch, index: r.index, displayable });
  if (!cur) latestBatch.set(r.creator, { batch: r.batch, index: r.index, displayable });
}
for (const r of rows) r.latest = latestBatch.get(r.creator)?.batch === r.batch;

const rowsBlock = `const ROWS_RAW = ${JSON.stringify(rows)};\n`;
if (html.includes('const ROWS_RAW =')) {
  html = html.replace(/const ROWS_RAW = .*?\];\n/s, rowsBlock);
} else {
  throw new Error('ROWS_RAW missing — 2D 管线退役后应始终存在');
}

}

// --- 缺失 logo 补齐（源文件随 skill 提交在 prototype-assets/logos/，构建可复现）---
function b64(file) {
  const mime = { '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp' }[path.extname(file).toLowerCase()];
  if (!mime) throw new Error(`unknown logo mime: ${file}`);
  return `data:${mime};base64,${readFileSync(file).toString('base64')}`;
}
const ASSETS = path.join(HERE, '..', 'prototype-assets', 'logos');
const LOGO_SOURCES = {
  'nvidialogo.png': path.join(ASSETS, 'nvidia.svg'),
  'apodex.svg': path.join(ASSETS, 'apodex.svg'),
  'multiversecomputing.svg': path.join(ASSETS, 'multiversecomputing.svg'),
  // v8 批量补齐：key 与源文件同名（源 = AA /img/logos/<slug>.<ext>，随 skill 提交，构建可复现）
  'china-mobile.png': path.join(ASSETS, 'china-mobile.png'), 'motif.svg': path.join(ASSETS, 'motif.svg'),
  'ifm.svg': path.join(ASSETS, 'ifm.svg'), 'nex.svg': path.join(ASSETS, 'nex.svg'),
  'upstage.svg': path.join(ASSETS, 'upstage.svg'), 'sktelecom.svg': path.join(ASSETS, 'sktelecom.svg'),
  'ai9stars.svg': path.join(ASSETS, 'ai9stars.svg'), 'kwaikat.svg': path.join(ASSETS, 'kwaikat.svg'),
  'lg.png': path.join(ASSETS, 'lg.png'), 'longcat.svg': path.join(ASSETS, 'longcat.svg'),
  'google.svg': path.join(ASSETS, 'google.svg'), 'ibm.svg': path.join(ASSETS, 'ibm.svg'),
  'baidu.svg': path.join(ASSETS, 'baidu.svg'), 'mistral.png': path.join(ASSETS, 'mistral.png'),
  'servicenow.svg': path.join(ASSETS, 'servicenow.svg'), 'cohere.svg': path.join(ASSETS, 'cohere.svg'),
  'openbmb.svg': path.join(ASSETS, 'openbmb.svg'), 'inceptionlabs.svg': path.join(ASSETS, 'inceptionlabs.svg'),
  'naver.webp': path.join(ASSETS, 'naver.webp'), 'korea-telecom.png': path.join(ASSETS, 'korea-telecom.png'),
  'arcee.svg': path.join(ASSETS, 'arcee.svg'), 'prime-intellect.svg': path.join(ASSETS, 'prime-intellect.svg'),
  'meta.svg': path.join(ASSETS, 'meta.svg'), 'trillionlabs.svg': path.join(ASSETS, 'trillionlabs.svg'),
  'sarvam.svg': path.join(ASSETS, 'sarvam.svg'), 'nanbeige.png': path.join(ASSETS, 'nanbeige.png'),
  'liquidai.svg': path.join(ASSETS, 'liquidai.svg'), 'nousresearch.jpg': path.join(ASSETS, 'nousresearch.jpg'),
  'tii.svg': path.join(ASSETS, 'tii.svg'), 'ai2.svg': path.join(ASSETS, 'ai2.svg'),
  'perplexity.svg': path.join(ASSETS, 'perplexity.svg'), 'celeris.svg': path.join(ASSETS, 'celeris.svg'),
  'microsoft-ai.svg': path.join(ASSETS, 'microsoft-ai.svg'), 'ai21.svg': path.join(ASSETS, 'ai21.svg'),
  'reka.svg': path.join(ASSETS, 'reka.svg'), 'swiss-ai-initiative.png': path.join(ASSETS, 'swiss-ai-initiative.png'),
  'deepcogito.png': path.join(ASSETS, 'deepcogito.png'), 'bytedance.svg': path.join(ASSETS, 'bytedance.svg'),
  'aws.svg': path.join(ASSETS, 'aws.svg'), 'inclusionai.jpg': path.join(ASSETS, 'inclusionai.jpg'),
};
const logosMatch = html.match(/const LOGOS = (\{.*?\});\n/s);
if (!logosMatch) throw new Error('LOGOS block not found');
const logos = (() => {
  try {
    return JSON.parse(logosMatch[1]);
  } catch (err) {
    throw new Error(`LOGOS 块 JSON 解析失败 — ${err.message}`);
  }
})();
const added = [];
for (const [key, file] of Object.entries(LOGO_SOURCES)) {
  if (logos[key]) continue;
  if (!existsSync(file)) throw new Error(`logo source missing: ${file}`);
  logos[key] = b64(file);
  added.push(key);
}
html = html.replace(/const LOGOS = \{.*?\};\n/s, `const LOGOS = ${JSON.stringify(logos)};\n`);

const pricingMarker = '// SUBSCRIPTION_PRICING_RUNTIME';
const pricingRuntime = `${pricingMarker}\n${pricingSource.replace(/^export /gm, '')}\nwindow.MKL_PRICING = { DEFAULT_MIX, SUBSCRIPTION_REGISTRY, createPricingEngine, validateMix, cacheWriteQuote };\n`;
if (html.includes(pricingMarker)) html = html.replace(/\/\/ SUBSCRIPTION_PRICING_RUNTIME[\s\S]*?\/\/ END_SUBSCRIPTION_PRICING_RUNTIME\n/, `${pricingRuntime}// END_SUBSCRIPTION_PRICING_RUNTIME\n`);
else html = html.replace('const LOGOS = ', `${pricingRuntime}// END_SUBSCRIPTION_PRICING_RUNTIME\nconst LOGOS = `);

for (const asset of ['three.min.js', 'OrbitControls.js']) {
  const tag = `<script src="prototype-assets/${asset}" onerror="this.dataset.failed=1"></script>`;
  if (html.includes(tag)) {
    const code = readFileSync(path.join(HERE, '..', 'prototype-assets', asset), 'utf8').replace(/<\/script/gi, '<\\/script');
    html = html.replace(tag, `<script>${code}</script>`);
  }
}
writeFileSync(HTML, html);
console.log(`metrics: ${Object.keys(metrics).length} variants; arena boards: ${Object.keys(arena).join(',')}; tok patched: ${tokPatched}; prices patched: ${pricePatched}${priceMissing ? ` (missing ${priceMissing})` : ''}; logos added: ${added.join(',') || '(none)'}`);
