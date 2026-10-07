// fetch-aa.mjs — 从 Artificial Analysis 模型榜 SSR HTML 提取 leaderboard，生成 aa-data.json
//
// 页面 https://artificialanalysis.ai/leaderboards/models 是 Next.js SSR，
// 首屏 <table><tbody> 里直接带全量 ~305 个 <tr>（每行 9 个 <td>：
//   模型 | Context Window | Creator | Intelligence Index | Cost per Task |
//   Median Tokens/s | Latency First Chunk | Total Response | Further Analysis）。
// 无需浏览器，直接 GET 解析即可（已验证 2.5MB HTML / 305 tr）。
// 没有 JSON API 可用（flight 数据里只有 intelligenceIndex 等明细字段，
//   没有 Cost per Task 列），所以 SSR HTML 是唯一可信来源。
//
// 过滤规则：只要求行可解析（模型名 + Index 可数值化）。Index 门槛已取消——
// Intelligence Index 只是 11 个可选指标之一，不应作为入选过滤；页面可见性
// 由数据完整性（tok/价格）自然淘汰。* 预估只标记不排除。
// Index 格子里可能带 *（页面标注的预估值），解析时只取数字，另存 estimated 标记。
//
// 用法: node scripts/fetch-aa.mjs [--out <path>]
//   默认写到系统临时目录: os.tmpdir()/model-killing-line/aa-data.json（可用 MKL_DIR 环境变量覆盖目录）
import { writeFileSync, mkdirSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const DIR_DEFAULT = process.env.MKL_DIR ?? path.join(os.tmpdir(), 'model-killing-line');
const OUT = process.argv.includes('--out')
  ? process.argv[process.argv.indexOf('--out') + 1]
  : path.join(DIR_DEFAULT, 'aa-data.json');
mkdirSync(path.dirname(OUT), { recursive: true });

const URL = 'https://artificialanalysis.ai/leaderboards/models';

const res = await fetch(URL, { headers: { 'user-agent': 'Mozilla/5.0 (compatible; model-killing-line/1.0)' } });
if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${URL}`);
const html = await res.text();

const tbody = html.slice(html.indexOf('<tbody'), html.indexOf('</tbody>'));
if (!tbody) throw new Error('no <tbody> found — page markup likely changed');

const strip = (s) => s.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').trim();
const trs = [...tbody.matchAll(/<tr.*?>(.*?)<\/tr>/gs)].map((m) => m[1]);
if (trs.length === 0) throw new Error('no <tr> rows parsed — page markup likely changed');

const rows = [];
for (const tr of trs) {
  const cells = [...tr.matchAll(/<td.*?>(.*?)<\/td>/gs)].map((m) => strip(m[1]));
  // 期望 9 列：模型 | Context | Creator | Index | Cost | Speed | Latency | Total | Further
  if (cells.length < 8) continue;
  const [model, context, creator, indexRaw, costRaw, speed, latency, total] = cells;
  // Index 解析不出（如未实测档显示 "----"）的行保留为 null——低档行只有这一处
  // 入口，丢掉会导致页面缺 effort 档（Sonnet 5.5 low 事件，2026-09-30）。
  // Index 门槛已废除：null index 行靠 tok/价格完整性自然淘汰。
  const index = parseFloat(indexRaw.replace(/[^0-9.]/g, ''));
  const cost = parseFloat(costRaw.trim().replace(/[$,]/g, ''));
  if (!model) continue;
  rows.push({
    model,
    context,
    creator,
    index: Number.isNaN(index) ? null : index,
    estimated: indexRaw.includes('*'),
    cost: Number.isNaN(cost) ? null : cost,
    speed: speed.trim(),
    latency: latency.trim(),
    total: total.trim(),
  });
}

if (rows.length === 0) {
  throw new Error('no rows after filter — table markup likely changed, re-inspect <tbody> cells');
}

rows.sort((a, b) => (b.index ?? -1) - (a.index ?? -1));

writeFileSync(OUT, JSON.stringify(rows, null, 1) + '\n');
console.log(`source: ${URL}  trs: ${trs.length}  kept(可解析): ${rows.length}  → ${OUT}`);
console.log('top3:', rows.slice(0, 3).map((r) => `${r.model}/${r.index}/$${r.cost}`).join(', '));
