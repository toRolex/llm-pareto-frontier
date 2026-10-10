import assert from 'node:assert/strict';
import { computeFrontier } from './frontier-domain.mjs';

const project = r => [-r.cost, r.val, -r.tok];
const ids = rows => rows.map(r => r.id);
const row = (id, cost, tok, val, speed) => ({ id, cost, tok, val, speed });
const topAt = (surface, x, z) => {
  const heights = [];
  for (let i = 0; i < surface.triangles.length; i += 3) {
    const t = surface.triangles.slice(i, i + 3).map(index => surface.positions.slice(index * 3, index * 3 + 3));
    if (!t.every(p => p[1] === t[0][1])) continue;
    const cross = (a, b) => (b[0] - a[0]) * (z - a[2]) - (b[2] - a[2]) * (x - a[0]);
    const sides = [cross(t[0], t[1]), cross(t[1], t[2]), cross(t[2], t[0])];
    if (sides.every(s => s >= 0) || sides.every(s => s <= 0)) heights.push(t[0][1]);
  }
  return heights.length ? Math.max(...heights) : null;
};

{
  const rows = [row('cheap', 1, 4, 4, 1), row('small', 4, 1, 4, 1), row('fast', 3, 3, 2, 9)];
  const f = computeFrontier(rows, project);
  assert.deepEqual(ids(f.front4), ['cheap', 'small', 'fast']);
  assert.deepEqual(ids(f.front3), ['cheap', 'small', 'fast']);
  assert.deepEqual(ids(f.front2Cost), ['cheap']);
  assert.deepEqual(ids(f.front2Tok), ['small']);
  assert.deepEqual(ids(f.interior4D), []);
  assert.deepEqual(Object.values(f.coverage).map(c => c.boundary), [true, true, true]);
}
{
  const rows = [row('quality', 1, 1, 4, 1), row('speed', 1, 1, 2, 9), row('missing', 1, 1, 2)];
  const f = computeFrontier(rows, project);
  assert.deepEqual(ids(f.front4), ['quality', 'speed']);
  assert.deepEqual(ids(f.front3), ['quality']);
  assert.deepEqual(ids(f.interior4D), ['speed']);
  assert.deepEqual(f.coverage.speed, {
    point: [-1, 2, -1], aliases: ['speed', 'missing'], boundary: false,
    classification: 'interior', boundaryPoint: false, front3: false, front4: true,
    reason: 'speed preserves full 4D nondomination; dominated in the displayed three axes'
  });
}
{
  const rows = [row('a', 1, 1, 3, 2), row('alias', 1, 1, 3, 2), row('near', 1 + 1e-12, 1, 3, 2)];
  const f = computeFrontier(rows, project);
  assert.deepEqual(ids(f.front4), ['a', 'alias']);
  assert.deepEqual(f.coverage.a.aliases, ['a', 'alias']);
  assert.deepEqual(f.coverage.near.aliases, ['near']);
  assert.deepEqual(f.coverage.alias.point, [-1, 3, -1]);
}
{
  const f = computeFrontier([row('a', 1, 3, 1), row('b', 2, 2, 2), row('c', 3, 1, 3)], project);
  assert.deepEqual(ids(f.front3), ['a', 'b', 'c']);
  assert.deepEqual(Object.values(f.coverage).map(c => c.boundary), [true, true, true]);
  assert.deepEqual(f.stairs.cost, [[-5,3],[-3,3],[-3,2],[-2,2],[-2,1],[-1,1]]);
  assert.deepEqual(f.stairs.tok, [[-5,3],[-3,3],[-2,3],[-1,3]]);
}
{
  const rows = [row('a', 1, 3, 1), row('b', 2, 2, 2), row('c', 3, 1, 3)];
  const f = computeFrontier(rows, r => [-r.tok, r.val, -r.cost]);
  assert.deepEqual(f.coverage.a.point, [-3, 1, -1]);
  assert.deepEqual(f.stairs.tok, [[-5,3],[-3,3],[-3,2],[-2,2],[-2,1],[-1,1]]);
  assert.deepEqual([topAt(f.surface, -2.5, -2.5), topAt(f.surface, -1.5, -2.5)], [2, null]);
}
{
  const empty = computeFrontier([], project);
  assert.deepEqual(empty, {
    front4: [], front3: [], front2Cost: [], front2Tok: [], surface: { positions: [], triangles: [], faces: [] },
    interior4D: [], coverage: {}, stairs: { cost: [], tok: [] }
  });
  const f = computeFrontier([row('only', 1, 2, 3)], project);
  assert.deepEqual(ids(f.front4), ['only']);
  assert.deepEqual(f.stairs, { cost: [[-5,3],[-1,3]], tok: [[-5,3],[-2,3]] });
  assert.deepEqual([topAt(f.surface,-2,-3), topAt(f.surface,-1,-2), topAt(f.surface,0,-3)], [3,3,null]);
  assert.equal(f.surface.triangles.length, 6);
  assert.deepEqual(f.surface.faces, [{ kind: 'top', corners: [[-5,3,-5],[-5,3,-2],[-1,3,-2],[-1,3,-5]] }]);
  assert.deepEqual(f.surface.positions.slice(0,12), [-5,3,-5,-5,3,-2,-1,3,-2,-1,3,-5]);
}
{
  const f = computeFrontier([row('high',1,3,4), row('low',3,1,2)], project);
  assert.deepEqual([
    topAt(f.surface,-4,-4), topAt(f.surface,-2,-4), topAt(f.surface,-4,-2),
    topAt(f.surface,-2,-2), topAt(f.surface,-3,-3), topAt(f.surface,-1,-3),
    topAt(f.surface,-3,-1), topAt(f.surface,-1 + 1e-12,-3), topAt(f.surface,-3,-1 + 1e-12)
  ], [4,4,2,null,4,4,2,null,null]);
  assert.deepEqual(f.stairs.cost, [[-5,4],[-3,4],[-1,4]]);
  assert.deepEqual(f.stairs.tok, [[-5,4],[-3,4],[-3,2],[-1,2]]);
  assert.deepEqual(ids(f.front3).map(id => f.coverage[id].boundary), [true,true]);
  for (let i=0; i<f.surface.triangles.length; i+=3) {
    const t = f.surface.triangles.slice(i,i+3).map(k => f.surface.positions.slice(k*3,k*3+3));
    assert.equal(t.every(p => p[0] === t[0][0]) || t.every(p => p[1] === t[0][1]) || t.every(p => p[2] === t[0][2]), true);
    assert.equal(t.every(p => p[1] === -5), false);
  }
}
{
  const f = computeFrontier([row('edge',5,5,2)], project);
  assert.deepEqual(f.coverage.edge.point, [-5,2,-5]);
  assert.equal(f.coverage.edge.boundary, true);
  assert.deepEqual(f.surface, { positions: [-5,2,-5], triangles: [], faces: [] });
  assert.equal(f.coverage.edge.classification, 'top');
  assert.equal(f.coverage.edge.boundaryPoint, true);
  assert.deepEqual(f.stairs, { cost: [[-5,2]], tok: [[-5,2]] });
}
{
  const input = [Object.freeze(row('a',1,2,3,1)), Object.freeze(row('b',2,1,2,2))];
  Object.freeze(input);
  const f = computeFrontier(input, project);
  assert.equal(f.front4[0], input[0]);
  assert.deepEqual(ids(f.front4), ['a','b']);
}
{
  const f = computeFrontier([row('bottom',1,2,-5)], project);
  assert.deepEqual(f.surface.faces, [{ kind: 'top', corners: [[-5,-5,-5],[-5,-5,-2],[-1,-5,-2],[-1,-5,-5]] }]);
  assert.deepEqual([topAt(f.surface,-2,-3), topAt(f.surface,0,-3)], [-5,null]);
  assert.equal(f.surface.triangles.length, 6);
  assert.equal(f.coverage.bottom.classification, 'top');
  assert.equal(f.coverage.bottom.boundary, true);
}
{
  const f = computeFrontier([
    row('high',1,3,4), row('low',3,1,2), row('step',4,3,3),
    row('inside',4,4,3), row('clipOnly',5,4,1)
  ], project);
  assert.deepEqual(['high','low','step','inside','clipOnly'].map(id => f.coverage[id].classification),
    ['top','top','step','interior','interior']);
  assert.deepEqual(['high','low','step','inside','clipOnly'].map(id => f.coverage[id].boundary),
    [true,true,true,false,false]);
  assert.deepEqual(f.surface.faces.filter(face => face.kind === 'step'), [
    { kind: 'step', corners: [[-5,2,-3],[-4,2,-3],[-4,4,-3],[-5,4,-3]] },
    { kind: 'step', corners: [[-4,2,-3],[-3,2,-3],[-3,4,-3],[-4,4,-3]] }
  ]);
  assert.equal(f.surface.faces.some(face => face.kind === 'clip'), false);
  assert.equal(f.surface.triangles.length, f.surface.faces.length * 6);
  assert.equal(f.front3.every(r => f.coverage[r.id].boundary && f.coverage[r.id].classification !== 'clip'), true);
}
{
  const f = computeFrontier([row('bottomEdge',5,5,-5)], project);
  assert.deepEqual(f.surface, { positions: [-5,-5,-5], triangles: [], faces: [] });
  assert.equal(f.coverage.bottomEdge.boundaryPoint, true);
  assert.equal(f.coverage.bottomEdge.classification, 'top');
}
console.log('frontier-domain literal tests passed');
