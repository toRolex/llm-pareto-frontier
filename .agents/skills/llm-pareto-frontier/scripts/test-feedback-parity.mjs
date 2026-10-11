import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
const html=readFileSync(new URL('../prototype-4d-3d.html',import.meta.url),'utf8');
const source=readFileSync(new URL('./frontier-domain.mjs',import.meta.url),'utf8').replace(/^export /gm,'');
const runtime=html.match(/\/\/ FRONTIER_DOMAIN_RUNTIME\n([\s\S]*?)\/\/ END_FRONTIER_DOMAIN_RUNTIME/)[1];
assert.equal(runtime,source,'single-file frontier runtime must match pure source');
const script=html.split('<script>').at(-1).split('</script>')[0];
new vm.Script(script,{filename:'prototype-inline.js'});
const rows=[{id:'A',cost:1,tok:3,val:3,speed:3},{id:'B',cost:2,tok:2,val:2,speed:4},{id:'C',cost:3,tok:1,val:3,speed:3}];
const ids=vm.runInNewContext(`${runtime}\ncomputeFrontier(rows,r=>[3-r.cost,r.val,3-r.tok]).front4.map(r=>r.id)`,{rows});
assert.deepEqual(Array.from(ids),['A','B','C']);
assert.equal(/perfScale|perfMax|perfVal|Perf: 绝对值/.test(script),false,'normalization state, helper and control removed');
const rowBuilder=script.match(/const rows = valid\.map\(m => \(\{[^\n]+\}\)\);/)[0];
const built=vm.runInNewContext(`${rowBuilder}\nrows`,{valid:[{creator:'C',model:'A',raw:123.5}],mi:{get:m=>m.raw}});
assert.equal(built[0].val,123.5,'buildWorld rows retain absolute metric');
assert.ok(script.includes('frontier.lines[axis]') && script.includes("line?.geometry.getAttribute('position')"),'line and fill consume same sampled direct geometry');
const selectFront=script.match(/  const front = [^\n]+;\n  const frontSet = new Set\(front\);/)[0];
const displayedRows=[
  {id:'A',cost:1,tok:3,val:3,speed:3},
  {id:'B',cost:2,tok:3,val:2,speed:9},
  {id:'C',cost:3,tok:1,val:3,speed:3},
  {id:'tie',cost:1,tok:3,val:3,speed:1},
].map(r=>({...r,src:{id:r.id}}));
for(const [view,expected] of [['3d',['A','C','tie']],['cost',['A','tie']],['tok',['C']]]) {
  const actual=vm.runInNewContext(`${runtime}\nconst frontier=computeFrontier(rows,r=>[r.cost,r.val,r.tok]);\n${selectFront}\n[...frontSet].map(r=>r.id)`,{rows:displayedRows,S:{view}});
  assert.deepEqual(Array.from(actual),expected,`${view} buildWorld selection excludes speed-only B and preserves ties`);
  const empty=vm.runInNewContext(`${runtime}\nconst frontier=computeFrontier([],r=>[]);\n${selectFront}\nfront.length`,{S:{view}});
  assert.equal(empty,0,`${view} empty selection`);
}
console.log('PASS inline/template parity, runtime syntax, domain P4, current-view rings and ties/empty, absolute rows, shared line/fill source');
