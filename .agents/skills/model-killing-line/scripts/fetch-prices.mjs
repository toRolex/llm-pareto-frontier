// fetch-prices.mjs — 生成 aa-prices.json（base slug → {input, output, cacheHit}，$/M tok）
//
// v7 数据源优先级：
//   1. aa-catalog.json（fetch-catalog.mjs 产物：单个详情页内嵌全目录，~530 个带价 slug；
//      变体名 → 目录对象 → slug 剥 effort 后缀得 base slug → 价格）
//   2. 自身详情页 curl 兜底（目录缺价时；同模型各 effort 价格相同，已确认）
// 无公开 JSON API（/api/models 404），SSR flight 数据是唯一来源。
//
// 用法: node scripts/fetch-prices.mjs [--out <path>]
//   默认 $TMPDIR/model-killing-line/aa-prices.json；MKL_DIR 可覆盖目录。
import { writeFileSync, mkdirSync, readFileSync, existsSync } from 'node:fs';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import os from 'node:os';
import path from 'node:path';

const DIR_DEFAULT = process.env.MKL_DIR ?? path.join(os.tmpdir(), 'model-killing-line');
const OUT = process.argv.includes('--out')
  ? process.argv[process.argv.indexOf('--out') + 1]
  : path.join(DIR_DEFAULT, 'aa-prices.json');
mkdirSync(path.dirname(OUT), { recursive: true });

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/126 Safari/537.36';
const execFileP = promisify(execFile);

// AA 对 node fetch 高频请求限连（UND_ERR_CONNECT_TIMEOUT），curl 实测可达（慢但 200）
async function curlText(url) {
  const { stdout } = await execFileP('curl', ['-s', '--max-time', '120', '-A', UA, url], { maxBuffer: 64e6 });
  if (!stdout) throw new Error('empty body');
  return stdout;
}

// 目录页 price 块提取（兜底路径用）：price 键前最近的 slug 即所属对象
function extractPrices(html) {
  const out = [];
  const re = /\\"price1mInputTokens\\":([0-9.eE+-]+)/g;
  let m;
  for (;;) {
    m = re.exec(html);
    if (!m) break;
    const before = html.slice(Math.max(0, m.index - 3000), m.index);
    const sm = [...before.matchAll(/\\"slug\\":\\"([a-z0-9-]+)\\"/g)];
    const slug = sm.length ? sm[sm.length - 1][1] : null;
    const seg = html.slice(m.index, m.index + 2000);
    const po = seg.match(/\\"price1mOutputTokens\\":([0-9.eE+-]+)/);
    const pc = seg.match(/\\"cacheHitPrice\\":([0-9.eE+-]+)/);
    if (slug && po && pc) {
      out.push({
        slug,
        input: parseFloat(m[1]),
        output: parseFloat(po[1]),
        cacheHit: parseFloat(pc[1]),
      });
    }
  }
  return out;
}

// slug 特例（目录映射兜底；与 fetch-metrics 同步）
const SLUG_OVERRIDE = {
  'Qwen3.8 Max (0902)': 'qwen3-8-max',
  'GPT-5.5 Instant (June 2026)': 'gpt-5-5-instant-06-26',
  'Nemotron 3 Ultra': 'nvidia-nemotron-3-ultra-550b-a55b',
  'Quasar 438B (max)': 'quasar-438b',
  'Step 5 Preview': 'step-5',
  'DeepSeek V4 Pro 0813 (max)': 'deepseek-v4-pro',
};

// 目录：byName 直查 + bySlug 反查（榜单名如 "X (max with fallback)" 与目录名不一致时，
// 用剥括号 slug 查 bySlug）。base slug = 变体 slug 剥 effort 后缀。
let catalog = null, catalogBySlug = null;
const CATALOG_FILE = path.join(DIR_DEFAULT, 'aa-catalog.json');
if (existsSync(CATALOG_FILE)) {
  try {
    const cat = JSON.parse(readFileSync(CATALOG_FILE, 'utf8'));
    catalog = cat.byName ?? null;
    catalogBySlug = cat.bySlug ?? null;
    console.log(`catalog: ${Object.keys(catalog).length} name / ${Object.keys(catalogBySlug).length} slug 条目`);
  } catch (err) {
    console.log(`catalog 读取失败 (${err.message}) — 回退详情页抓取`);
  }
} else {
  console.log('catalog 不存在 — 先跑 fetch-catalog.mjs，否则全部逐页抓取');
}

const stripEffort = (slug) => slug.replace(/-(max|xhigh|high|medium|low|non-reasoning|reasoning)$/, '');
function baseSlugOf(name) {
  if (catalog?.[name]) return stripEffort(catalog[name].slug);
  const stripped = name.replace(/\s*\([^)]*\)\s*$/, '').trim()
    .toLowerCase().replace(/\./g, '-').replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '');
  if (catalogBySlug?.[stripped]) return stripped;
  if (SLUG_OVERRIDE[name]) return SLUG_OVERRIDE[name];
  return stripped;
}
// 价格对象：byName 直查 → bySlug[base slug] 反查 → null
const priceSourceFor = (name) => catalog?.[name] ?? catalogBySlug?.[baseSlugOf(name)] ?? null;

// 变体名单：读 aa-data.json（fetch-aa 产物）
const DATA = path.join(DIR_DEFAULT, 'aa-data.json');
if (!existsSync(DATA)) { console.error('no aa-data.json — run fetch-aa.mjs first'); process.exit(1); }
let names;
try {
  names = [...new Set(JSON.parse(readFileSync(DATA, 'utf8')).map(r => r.model))];
} catch (err) {
  console.error(`aa-data.json 读取/解析失败: ${err.message} — 先跑 fetch-aa.mjs`);
  process.exit(1);
}

const baseSlugs = [...new Set(names.map(baseSlugOf))];
console.log(`variants: ${names.length} → base slugs: ${baseSlugs.length}`);

// 1) 目录批量提取；价格字段存在但为 null → 确认 AA 未录价（own-page 同样 null，
//   逐页重托纯属浪费时间），记入 confirmedNull 跳过兜底
const prices = {}; // baseSlug → {input, output, cacheHit}
const confirmedNull = new Set();
let fromCatalog = 0;
if (catalog) {
  for (const name of names) {
    const bs = baseSlugOf(name);
    const o = priceSourceFor(name);
    if (!o) continue;
    if (o.pin == null && o.pout == null && o.pcache == null) {
      confirmedNull.add(bs);
      continue;
    }
    if (![o.pin, o.pout, o.pcache].every(v => Number.isFinite(v) && v >= 0)) {
      if (o.pin == null) confirmedNull.add(bs);
      continue;
    }
    if (!prices[bs]) {
      prices[bs] = { input: o.pin, output: o.pout, cacheHit: o.pcache };
      fromCatalog++;
    }
  }
}
console.log(`catalog: ${fromCatalog} priced base slugs, ${confirmedNull.size} 确认无价（跳过兜底）`);

// 2) 缺失的 base slug 回退抓详情页（目录已确认无价的跳过）
const missing = baseSlugs.filter(s => !prices[s] && !confirmedNull.has(s));
console.log(`fallback detail pages: ${missing.length}`);
let ok = 0, fail = 0;
for (const slug of missing) {
  try {
    const html = await curlText(`https://artificialanalysis.ai/models/${slug}`);
    const found = extractPrices(html).filter(p => p.slug === slug || p.slug.startsWith(slug));
    if (!found.length) throw new Error('no price block');
    // 详情页可能含多个 effort 条目，同模型同价 → 取第一个
    const p = found[0];
    prices[slug] = { input: p.input, output: p.output, cacheHit: p.cacheHit };
    ok++;
    console.log(`ok  ${slug}  in=${p.input} out=${p.output} cache=${p.cacheHit}`);
  } catch (e) {
    fail++;
    console.log(`ERR ${slug}: ${e.message}`);
  }
  await new Promise(r => setTimeout(r, 300)); // 温和限速
}

writeFileSync(OUT, `${JSON.stringify(prices, null, 1)}\n`);
const covered = baseSlugs.filter(s => prices[s]).length;
console.log(`\nwrote ${OUT}  covered ${covered}/${baseSlugs.length} base slugs (catalog ${fromCatalog} + detail ${ok}, fail ${fail})`);
if (covered < baseSlugs.length) process.exitCode = 2;
