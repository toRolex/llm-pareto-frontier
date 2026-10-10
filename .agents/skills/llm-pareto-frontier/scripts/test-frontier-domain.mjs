import assert from 'node:assert/strict';
import { computeFrontier, delaunay } from './frontier-domain.mjs';
const row=(id,cost,tok,val,speed)=>({id,cost,tok,val,speed});
const project=r=>[-r.cost,r.val,-r.tok];
const ids=rows=>rows.map(r=>r.id);
{
  const rows=[row('cheap',1,4,4,1),row('small',4,1,4,1),row('fast',3,3,2,9)];
  const f=computeFrontier(rows,project);
  assert.deepEqual(ids(f.front4),['cheap','small','fast']);
  assert.deepEqual(ids(f.front3),['cheap','small','fast']);
  assert.deepEqual(ids(f.front2Cost),['cheap']);
  assert.deepEqual(ids(f.front2Tok),['small']);
  assert.deepEqual(f.lines,{cost:[[-1,4]],tok:[[-1,4]]});
  assert.deepEqual(f.surface.positions,[-1,4,-4,-4,4,-1,-3,2,-3]);
  assert.equal(f.surface.triangles.length,3);
  assert.equal(new Set(f.surface.triangles).size,3);
  assert.equal(f.surface.edges.length,3);
}
{
  const f=computeFrontier([row('quality',1,1,4,1),row('speed',1,1,2,9),row('missing',1,1,2)],project);
  assert.deepEqual(ids(f.front4),['quality','speed']);
  assert.deepEqual(ids(f.front3),['quality']);
  assert.deepEqual(ids(f.interior4D),['speed']);
  assert.deepEqual(f.coverage.speed,{point:[-1,2,-1],aliases:['speed','missing'],front3:false,front4:true,geometryVertex:false,
    reason:'speed preserves full 4D nondomination; dominated in the displayed three axes'});
  assert.deepEqual(f.surface,{positions:[-1,4,-1],triangles:[],edges:[],vertexIds:['quality']});
}
{
  const rows=[row('a',1,3,1),row('b',2,2,2),row('c',3,1,3)];
  const f=computeFrontier(rows,project);
  assert.deepEqual(f.lines,{cost:[[-3,3],[-2,2],[-1,1]],tok:[[-1,3]]});
  assert.deepEqual(f.surface.triangles,[]);
  assert.deepEqual(f.surface.edges,[[2,1],[1,0]]);
  assert.deepEqual(ids(f.front3),['a','b','c']);
  const swapped=computeFrontier(rows,r=>[-r.tok,r.val,-r.cost]);
  assert.deepEqual(swapped.lines.tok,[[-3,3]],'frontier membership uses raw axes, not the projection callback');
}
{
  const rows=[row('a',1,1,3,2),row('alias',1,1,3,2),row('near',1+1e-12,1,3,2)];
  const f=computeFrontier(rows,project);
  assert.deepEqual(ids(f.front4),['a','alias']);
  assert.deepEqual(f.coverage.a.aliases,['a','alias']);
  assert.deepEqual(f.coverage.near.aliases,['near']);
  assert.deepEqual(f.lines.cost,[[-1,3]]);
  assert.deepEqual(f.surface.vertexIds,['a']);
  assert.equal(Object.keys(f.coverage).length,3,'geometry deduplication must not delete observations');
}
{
  const rows=[row('a',1,3,3),row('near',1+1e-12,3,4),row('b',3,1,2)];
  const f=computeFrontier(rows,project);
  assert.deepEqual(f.surface.vertexIds,['a','near','b'],'near coordinates are not rounded together');
  assert.deepEqual(ids(f.front4),['a','near','b']);
}
{
  const empty=computeFrontier([],project);
  assert.deepEqual(empty,{front4:[],front3:[],front2Cost:[],front2Tok:[],interior4D:[],coverage:{},
    surface:{positions:[],triangles:[],edges:[],vertexIds:[]},lines:{cost:[],tok:[]}});
  const f=computeFrontier([row('edge',5,5,-5)],project);
  assert.deepEqual(f.surface.positions,[-5,-5,-5]);
  assert.deepEqual(f.lines,{cost:[[-5,-5]],tok:[[-5,-5]]});
}
{
  const input=Object.freeze([Object.freeze(row('a',1,2,3,1)),Object.freeze(row('b',2,1,2,2))]);
  const f=computeFrontier(input,project);
  assert.equal(f.front4[0],input[0]);
  assert.deepEqual(ids(f.front4),['a','b']);
}
assert.deepEqual(delaunay([{u:0,v:0},{u:1,v:1},{u:2,v:2},{u:3,v:3}]),[]);
assert.deepEqual(delaunay([{u:0,v:0},{u:1,v:0}]),[]);
console.log('PASS direct front2, front3 Delaunay/degeneracy, exact aliases, full P4, immutable inputs');
