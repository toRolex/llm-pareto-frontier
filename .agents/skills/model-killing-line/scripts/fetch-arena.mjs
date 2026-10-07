// fetch-arena.mjs — 从 arena.ai SSR 提取 Text 与 Agent 四榜数据，生成 arena-data.json
//
// 页面 https://arena.ai/leaderboard 是 Next.js SSR，payload 中每张榜是一个
// 导航卡片对象：{"subLabel":"Agent | Overall",...,"agentPareto":{"entries":[...]}}。
// HTML 字符串带一层 \" 转义，先全局反转义再按 "entries":[" 配对中括号截取，逐条 JSON.parse。
// 条目字段（已验证）：
//   agent 榜: modelKey "contenders/claude-fable-5.1-max-agent"、modelDisplayName、rating(Net Improvement 0–1)
//   text  榜: modelKey "claude-opus-5.5-high-vertex"、rating(Elo ~1500)
// Arena-Agent(Chat) 榜不在主 leaderboard 页 — 在 /leaderboard/agent/chat 子页，
// payload 结构不同：snapshot.rows[]（contenderName + model + avgScore.value）。
// 用法: node scripts/fetch-arena.mjs [--out <path>]   # 默认 $TMPDIR/model-killing-line/arena-data.json
//   输出 { text: [...], agentOverall: [...], agentCode: [...], agentWork: [...], agentChat: [...] }
import { writeFileSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';

const DIR_DEFAULT = process.env.MKL_DIR ?? path.join(os.tmpdir(), 'model-killing-line');
const OUT = process.argv.includes('--out')
  ? process.argv[process.argv.indexOf('--out') + 1]
  : path.join(DIR_DEFAULT, 'arena-data.json');
mkdirSync(path.dirname(OUT), { recursive: true });

const URL = 'https://arena.ai/leaderboard';
// arena.ai 按 TLS/JA3 指纹拦截非浏览器客户端 — node fetch（含浏览器 UA）实测 403，
// curl 放行。因此走 curl 子进程抓取（已验证 curl-plain 200）。
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';
let html;
try {
  html = execFileSync('curl', ['-s', '--fail', '-A', UA, '--max-time', '90', URL], { maxBuffer: 64 * 1024 * 1024 }).toString('utf8');
} catch (e) {
  throw new Error(`curl fetch failed: ${e.status ?? ''} ${e.message}`);
}
if (!html.includes('agentPareto')) throw new Error('page fetched but no agentPareto payload — markup likely changed');
const un = html.split('\\"').join('"');

// 从 start 起第一个顶层 "entries":[ 数组，手工配对中括号（字符串感知）后逐条解析
function extractEntries(start) {
  const key = '"entries":[';
  let i = un.indexOf(key, start);
  if (i < 0) throw new Error('no entries array found');
  i += key.length;
  let depth = 1, j = i, inStr = false, esc = false;
  while (depth > 0 && j < un.length) {
    const c = un[j];
    if (inStr) { if (esc) esc = false; else if (c === '\\') esc = true; else if (c === '"') inStr = false; }
    else if (c === '"') inStr = true;
    else if (c === '[') depth++;
    else if (c === ']') depth--;
    j++;
  }
  const body = un.slice(i, j - 1);
  const objs = [];
  let d = 0, cur = '', inStr2 = false, esc2 = false;
  for (const ch of body) {
    if (inStr2) {
      cur += ch;
      if (esc2) esc2 = false;
      else if (ch === '\\') esc2 = true;
      else if (ch === '"') inStr2 = false;
      continue;
    }
    if (ch === '"') { inStr2 = true; cur += ch; continue; }
    if (ch === '{') { d++; cur += ch; continue; }
    if (ch === '}') { d--; cur += ch; if (d === 0) { objs.push(cur); cur = ''; } continue; }
    if (d === 0 && ch === ',') continue;
    cur += ch;
  }
  return objs.map((s) => JSON.parse(s));
}

const MARKS = {
  text: '"subLabel":"Text | Overall"',
  agentOverall: '"subLabel":"Agent | Overall"',
  agentCode: '"subLabel":"Agent | Code"',
  agentWork: '"subLabel":"Agent | Work"',
};

const out = {};
for (const [key, mark] of Object.entries(MARKS)) {
  const at = un.indexOf(mark);
  if (at < 0) throw new Error(`marker not found: ${mark}`);
  const entries = extractEntries(at);
  out[key] = entries.map((e) => ({
    modelKey: e.modelKey,
    display: e.modelDisplayName,
    rating: e.rating,
    org: e.modelOrganization,
  }));
  console.log(`${key}: ${entries.length} entries, first=${entries[0]?.modelKey} rating=${entries[0]?.rating?.toFixed(4)}`);
  if (entries.length === 0) throw new Error(`${key}: zero entries — page markup likely changed`);
}

// Arena-Agent(Chat)：/leaderboard/agent/chat 子页的 snapshot.rows[]
{
  const chatUrl = 'https://arena.ai/leaderboard/agent/chat';
  const chatHtml = execFileSync('curl', ['-s', '--fail', '-A', UA, '--max-time', '90', chatUrl], { maxBuffer: 64 * 1024 * 1024 }).toString('utf8');
  const un2 = chatHtml.split('\\"').join('"');
  const rp = un2.indexOf('"rows":[{"rank"');
  if (rp < 0) throw new Error('agent/chat rows not found — markup likely changed');
  // rows 数组括号配对截取（字符串感知）
  let i = un2.indexOf('[', rp), depth = 0, j = i, inStr = false, esc = false;
  while (j < un2.length) {
    const c = un2[j];
    if (inStr) { if (esc) esc = false; else if (c === '\\') esc = true; else if (c === '"') inStr = false; }
    else if (c === '"') inStr = true;
    else if (c === '[') depth++;
    else if (c === ']') { depth--; if (depth === 0) break; }
    j++;
  }
  const rows = JSON.parse(un2.slice(i, j + 1));
  out.agentChat = rows.map((r) => ({
    modelKey: r.contenderName,
    display: r.model,
    rating: r.avgScore?.value ?? null,
    org: r.modelOrganization,
  }));
  console.log(`agentChat: ${out.agentChat.length} entries, first=${out.agentChat[0]?.modelKey} rating=${out.agentChat[0]?.rating?.toFixed(4)}`);
  if (out.agentChat.length === 0) throw new Error('agentChat: zero entries');
}

writeFileSync(OUT, JSON.stringify(out));
console.log(`\nwrote ${OUT}`);
