// fetch-catalog.mjs — 从任意一个 AA 模型详情页提取全目录数据，生成 aa-catalog.json
//
// 关键发现（2026-09-30）：AA 每个模型详情页的 flight 数据里内嵌了【整个模型目录】，
// 不是只有本页模型。以 /models/claude-opus-5-5 为例，单页可提取：
//   ~925 个 slug 对象，其中 ~686 个模型 × 6 指标（intelligenceIndex / gdpvalNormalized
//   / terminalBench40 / scicode / hle / omniscience）、~419 个 tok（outputTokensPerTask）、
//   ~531 个挂牌价（input/output/cacheHit）。
// 因此一次 curl 就能拿到近乎全库数据，取代「逐变体抓详情页」的旧模式。
// 注意：own-page currentModel 的 tok 会给未实测档填占位常量（54642.77172835717），
// 但目录对象里这些档是 null——目录对象是诚实数据源。
//
// 用法: node scripts/fetch-catalog.mjs [--out <path>] [--page <slug>]
//   默认 $TMPDIR/model-killing-line/aa-catalog.json；MKL_DIR 可覆盖目录。
//   输出 { byName: {name→{slug, baseSlug, metrics…}}, bySlug: {slug→同结构} }
import { writeFileSync, mkdirSync } from 'node:fs';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import os from 'node:os';
import path from 'node:path';

const DIR_DEFAULT = process.env.MKL_DIR ?? path.join(os.tmpdir(), 'model-killing-line');
const OUT = process.argv.includes('--out')
  ? process.argv[process.argv.indexOf('--out') + 1]
  : path.join(DIR_DEFAULT, 'aa-catalog.json');
const PAGE = process.argv.includes('--page')
  ? process.argv[process.argv.indexOf('--page') + 1]
  : 'claude-opus-5-5';
mkdirSync(path.dirname(OUT), { recursive: true });

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/126 Safari/537.36';
const execFileP = promisify(execFile);

async function curlText(url) {
  const { stdout } = await execFileP('curl', ['-s', '--max-time', '120', '-A', UA, url], { maxBuffer: 64e6 });
  if (!stdout) throw new Error('empty body');
  return stdout;
}

const num = (s) => (s == null || s === 'null' ? null : Number.isNaN(+s) ? null : +s);

// 每个 slug 出现点向后取窗口，抓同对象内的指标/价格/tok。
// ⚠️ 同一 slug 在 HTML 里出现多次：真实模型对象（带 shortName）之外，还有嵌套
//   引用（如 variant 对象里 "release":{"slug":...}、creator/provider 列表）。
//   取「首次出现」会把嵌套引用后面的窗口错当本对象——例如 claude-sonnet-5-5
//   首次出现在 medium 变体对象的 release 引用处，窗口读进的是 medium 的指标，
//   导致 max 档（base 页即 max）整行数据错成 medium（Sonnet 5.5 / DeepSeek
//   V4.1 Flash 事件，2026-09-30）。真对象以 shortName 键为标志：取窗口内
//   shortName 距离最近的出现点；全都没有 shortName 时退回首次出现。
function extractCatalog(html) {
  const re = /\\"slug\\":\\"([a-z0-9-]+)\\"/g;
  const cands = {}; // slug → [{sn, seg}]
  let m;
  for (;;) {
    m = re.exec(html);
    if (!m) break;
    const slug = m[1];
    const seg = html.slice(m.index, m.index + 9000);
    const sn = seg.indexOf('\\"shortName\\"');
    (cands[slug] ??= []).push({ sn: sn < 0 ? Infinity : sn, seg });
  }
  const bySlug = {};
  for (const [slug, cs] of Object.entries(cands)) {
    cs.sort((a, b) => a.sn - b.sn);
    const seg = cs[0].seg;
    const nm = seg.match(/\\"name\\":\\"((?:[^"\\]|\\\\.)*?)\\"/);
    const name = nm ? nm[1].replace(/\\"/g, '"') : null;
    const g = (k) => {
      // 目标键在 HTML 里形如 "key":value（单层转义）——字面量查找，避开 RegExp 转义
      const needle = '\\"' + k + '\\":';
      const i = seg.indexOf(needle);
      if (i < 0) return null;
      return num(seg.slice(i + needle.length).match(/^[^,}]+/)[0]);
    };
    const t = seg.match(/\\"intelligenceIndexOutputTokensPerTask\\":\{[^}]*\\"output\\":([^,}]+)/);
    const o = {
      slug,
      name,
      index: g('intelligenceIndex'),
      gdpvalNormalized: g('gdpvalNormalized'),
      terminalBench40: g('terminalBench40'),
      scicode: g('scicode'),
      hle: g('hle'),
      omniscience: g('omniscience'),
      tokPerTask: t ? num(t[1]) : null,
    };
    const pi = seg.match(/\\"price1mInputTokens\\":([^,}]+)/);
    const po = seg.match(/\\"price1mOutputTokens\\":([^,}]+)/);
    const pc = seg.match(/\\"cacheHitPrice\\":([^,}]+)/);
    if (pi && po && pc) {
      o.pin = num(pi[1]);
      o.pout = num(po[1]);
      o.pcache = num(pc[1]);
    }
    bySlug[slug] = o;
  }
  return bySlug;
}

const html = await curlText(`https://artificialanalysis.ai/models/${PAGE}`);
const bySlug = extractCatalog(html);

// byName：目录名 → 对象；榜单名常截断目录名的 "(based on ...)" 后缀，注册别名
const byName = {};
for (const o of Object.values(bySlug)) {
  if (!o.name) continue;
  if (!byName[o.name]) byName[o.name] = o;
  const alias = o.name.replace(/\s*\(based on [^)]*\)\s*$/, '').trim();
  if (alias && alias !== o.name && !byName[alias]) byName[alias] = o;
}

const n = (x) => Object.values(bySlug).filter((o) => o[x] != null).length;
writeFileSync(OUT, `${JSON.stringify({ byName, bySlug }, null, 1)}\n`);
console.log(
  `page: ${PAGE}  slugs: ${Object.keys(bySlug).length}  names: ${Object.keys(byName).length}  ` +
    `index: ${n('index')}  tok: ${n('tokPerTask')}  price: ${n('pin')}  ` +
    `gdpval: ${n('gdpvalNormalized')}  tb40: ${n('terminalBench40')}  hle: ${n('hle')}  scicode: ${n('scicode')}  omni: ${n('omniscience')}\n→ ${OUT}`,
);
