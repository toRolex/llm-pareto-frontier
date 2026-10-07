// fetch-metrics.mjs — 生成 aa-metrics.json（变体全名 → 6 指标 + tokPerTask）
//
// v7 数据源优先级：
//   1. aa-catalog.json（fetch-catalog.mjs 产物：单个详情页内嵌的全目录对象，
//      一次 curl 覆盖 ~686 模型；tok 为 null 即 AA 未实测，诚实缺测）
//   2. 本地上次结果缓存（增量复用，成功条目不重抓）
//   3. 自身详情页 curl 抓取（目录缺该变体时兜底；own-page currentModel 的 tok
//      对未实测档可能是占位常量，占位检测见文末）
//
// 详情页 https://artificialanalysis.ai/models/<slug> currentModel 块键名（已验证）：
//   intelligenceIndex / gdpvalNormalized / terminalBench40 / scicode / hle / omniscience
// effort 档 slug 规则见 slugOf()；SLUG_OVERRIDE / BASE_IS_TOP 为目录映射兜底。
// 用法: node scripts/fetch-metrics.mjs [--out <path>] [--force]
//   默认 $TMPDIR/model-killing-line/aa-metrics.json；MKL_DIR 可覆盖目录。--force 忽略缓存。
import { writeFileSync, mkdirSync, readFileSync, existsSync } from 'node:fs';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import os from 'node:os';
import path from 'node:path';

const DIR_DEFAULT = process.env.MKL_DIR ?? path.join(os.tmpdir(), 'model-killing-line');
const OUT = process.argv.includes('--out')
  ? process.argv[process.argv.indexOf('--out') + 1]
  : path.join(DIR_DEFAULT, 'aa-metrics.json');
mkdirSync(path.dirname(OUT), { recursive: true });

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/126 Safari/537.36';
const execFileP = promisify(execFile);

// 详情页走 curl 子进程（fetch-prices / fetch-arena 同款）：AA 对 node fetch 高频请求限连
async function curlText(url) {
  const { stdout } = await execFileP('curl', ['-s', '--max-time', '120', '-A', UA, url], { maxBuffer: 64e6 });
  if (!stdout) throw new Error('empty body');
  return stdout;
}

// 指标键：AA currentModel 数据块里的原始键
const KEYS = ['intelligenceIndex', 'gdpvalNormalized', 'terminalBench40', 'scicode', 'hle', 'omniscience'];

// per-effort 每任务 output tokens：intelligenceIndexOutputTokensPerTask.output。
// 同一模型不同 effort 档该值不同（max 117787 / medium 27337），4D 页 tok 维度的正确数据源。
function extractTokPerTask(html) {
  let i = -1;
  while ((i = html.indexOf('currentModel', i + 1)) >= 0) {
    const seg = html.slice(i, i + 20000);
    if (!seg.includes('shortName')) continue;
    const m = seg.match(new RegExp('\\\\\"intelligenceIndexOutputTokensPerTask\\\\\":\\{[^}]*?\\\\\"output\\\\\":([0-9.eE+-]+)'));
    return m ? parseFloat(m[1]) : null;
  }
  return null;
}

// AA 详情页 slug 特例（默认规则推不出来或推错的）
const SLUG_OVERRIDE = {
  'Qwen3.8 Max (0902)': 'qwen3-8-max',
  'GPT-5.5 Instant (June 2026)': 'gpt-5-5-instant-06-26',
  'Nemotron 3 Ultra': 'nvidia-nemotron-3-ultra-550b-a55b',
  'Quasar 438B (max)': 'quasar-438b', // AA 无 -max 子页，base 页即 max
  'Step 5 Preview': 'step-5', // AA 页叫 Step 5 Preview 但 slug 是 step-5
  'DeepSeek V4 Pro 0813 (max)': 'deepseek-v4-pro', // AA release 名 DeepSeek V4 Pro（0813 日期只在名称里）
};

// base 页即最高档的变体（无 effort 子页）
const BASE_IS_TOP = {
  'GPT-6 Astra (max)': true, 'GPT-6 Sol (max)': true, 'GPT-6 Luna (max)': true,
  'Muse Spark 1.3 (max)': true, 'Grok 4.7 (xhigh)': true, 'Grok 4.6 (high)': true,
  'GLM-5.3 (max)': true, 'Kimi K3 (max)': true, 'Step 5 Preview': true,
  'GPT-5.6 Terra (max)': true, 'Gemini 3.8 Flash (high)': true,
  'DeepSeek V4.1 Flash (max)': true, 'Claude Sonnet 5 (max)': true,
  'DeepSeek V4 Pro 0813 (max)': true, 'DeepSeek V4 Flash Vision (max)': true,
  'Qwen3.8 27B (xhigh)': true,
};
function slugOf(name) {
  if (SLUG_OVERRIDE[name]) return SLUG_OVERRIDE[name];
  const m = name.match(/\(([^)]+)\)\s*$/);
  const base = name.replace(/\s*\([^)]*\)\s*$/, '').trim()
    .toLowerCase().replace(/\./g, '-').replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '');
  if (!m || BASE_IS_TOP[name]) return base;
  const e = m[1];
  if (e.endsWith('with fallback')) {
    const eff = e.split(' ')[0];
    return eff === 'max' ? base : `${base}-${eff}`;
  }
  if (['max', 'xhigh', 'high', 'medium', 'low'].includes(e)) return `${base}-${e}`;
  if (e === 'Non-reasoning') return `${base}-non-reasoning`;
  return base;
}

// 从详情页 HTML 提取含 shortName 的 currentModel 指标块（兜底路径用）
function extractMetrics(html) {
  let i = -1;
  while ((i = html.indexOf('currentModel', i + 1)) >= 0) {
    const seg = html.slice(i, i + 20000);
    if (!seg.includes('shortName')) continue;
    const out = {};
    for (const k of KEYS) {
      const m = seg.match(new RegExp('\\\\"' + k + '\\\\":([^,}]+)'));
      out[k] = m ? parseFloat(m[1]) : null;
      if (out[k] !== null && Number.isNaN(out[k])) out[k] = null;
    }
    return out;
  }
  return null;
}

// 变体名单：--names <json数组文件> 或 aa-data.json
let names;
const namesIdx = process.argv.indexOf('--names');
if (namesIdx > -1) {
  try {
    names = JSON.parse(readFileSync(process.argv[namesIdx + 1], 'utf8'));
  } catch (err) {
    console.error(`--names 文件读取/解析失败: ${err.message}`);
    process.exit(1);
  }
} else if (existsSync(path.join(DIR_DEFAULT, 'aa-data.json'))) {
  try {
    names = JSON.parse(readFileSync(path.join(DIR_DEFAULT, 'aa-data.json'), 'utf8')).map(r => r.model);
  } catch (err) {
    console.error(`aa-data.json 读取/解析失败: ${err.message} — 先跑 fetch-aa.mjs`);
    process.exit(1);
  }
} else {
  console.error('no --names and no aa-data.json — pass --names variants.json');
  process.exit(1);
}
names = [...new Set(names)];
console.log(`variants: ${names.length}`);

// 1) 目录数据源（fetch-catalog.mjs 产物）：byName 直查 + bySlug 反查双保险
//    （榜单名如 "X (max with fallback)" 与目录名不一致时，用 slugOf(name) 查 bySlug）
let catalog = null, catalogBySlug = null;
const CATALOG_FILE = path.join(DIR_DEFAULT, 'aa-catalog.json');
if (existsSync(CATALOG_FILE)) {
  try {
    const cat = JSON.parse(readFileSync(CATALOG_FILE, 'utf8'));
    catalog = cat.byName ?? null;
    catalogBySlug = cat.bySlug ?? null;
    console.log(`catalog: ${Object.keys(catalog).length} name / ${Object.keys(catalogBySlug).length} slug 条目`);
  } catch (err) {
    console.log(`catalog 读取失败 (${err.message}) — 回退逐页抓取`);
  }
} else {
  console.log('catalog 不存在 — 先跑 fetch-catalog.mjs，否则全部逐页抓取');
}

const FORCE = process.argv.includes('--force');
// 2) 本地缓存：已有成功条目直接复用；null（上次失败）下次自愈重试
let cached = {};
if (existsSync(OUT)) {
  try { cached = JSON.parse(readFileSync(OUT, 'utf8')); } catch { cached = {}; }
}

const result = {};
let fail = 0, fromCatalog = 0, reused = 0, fetched = 0;
for (const name of names) {
  // ① 目录：一次 curl 的全库数据，始终最新，优先于一切；名字对不上时用 slug 反查。
  // 有任一非空字段就用目录（部分实测条目如 low 档：index=null 但 tok/其他指标为真，
  // 丢掉会退到 own-page 拿占位 tok——Sonnet 5.5 low 事件，2026-09-30）。
  const c = catalog?.[name] ?? catalogBySlug?.[slugOf(name)];
  const hasAny = c && [c.index, c.gdpvalNormalized, c.terminalBench40, c.scicode, c.hle, c.omniscience, c.tokPerTask].some(v => v != null);
  if (!FORCE && c && hasAny) {
    result[name] = {
      intelligenceIndex: c.index,
      gdpvalNormalized: c.gdpvalNormalized,
      terminalBench40: c.terminalBench40,
      scicode: c.scicode,
      hle: c.hle,
      omniscience: c.omniscience,
      tokPerTask: c.tokPerTask ?? null,
    };
    fromCatalog++;
    continue;
  }
  // ② 本地缓存
  const prev = cached[name];
  if (!FORCE && prev && typeof prev === 'object') {
    result[name] = prev;
    reused++;
    continue;
  }
  // ③ 自身详情页兜底
  const slug = slugOf(name);
  const url = `https://artificialanalysis.ai/models/${slug}`;
  try {
    const html = await curlText(url);
    const metrics = extractMetrics(html);
    if (!metrics) throw new Error('no currentModel block');
    metrics.tokPerTask = extractTokPerTask(html);
    result[name] = metrics;
    fetched++;
    console.log(`ok  ${name} -> ${slug}  idx=${metrics.intelligenceIndex} tok=${metrics.tokPerTask}`);
  } catch (e) {
    fail++;
    result[name] = null;
    console.log(`ERR ${name} -> ${slug}: ${e.message}`);
  }
  await new Promise(r => setTimeout(r, 300)); // 温和限速
}

// 占位常量检测：AA own-page 对新收录/未实测档会填同一占位 tok（观测值
// 54642.77172835717，精确到 14 位小数跨模型复现；目录对象里这些档是 null）。
// 精确同值且 ≥3 个变体 → 判占位置 null，绝不冒充真值。
const tokGroups = {};
for (const [name, v] of Object.entries(result)) {
  if (v && typeof v === 'object' && Number.isFinite(v.tokPerTask)) {
    (tokGroups[v.tokPerTask] ??= []).push(name);
  }
}
for (const [tok, group] of Object.entries(tokGroups)) {
  if (group.length < 3) continue;
  for (const name of group) {
    result[name].tokPerTask = null;
    console.log(`占位 tok ${tok} → ${name} 置 null（与 ${group.length - 1} 个其他变体精确同值）`);
  }
}

writeFileSync(OUT, JSON.stringify(result, null, 1));
console.log(`\nwrote ${OUT}  ok=${names.length - fail} (catalog ${fromCatalog} + cached ${reused} + fetched ${fetched}) err=${fail}`);
if (fail > 0) process.exitCode = 2;
