export function delaunay(pts) {
  const n = pts.length;
  if (n < 3) return [];
  const us = pts.map(p => p.u), vs = pts.map(p => p.v);
  const minU = Math.min(...us), maxU = Math.max(...us), minV = Math.min(...vs), maxV = Math.max(...vs);
  const dm = Math.max(maxU - minU, maxV - minV);
  if (!dm) return [];
  const P = pts.concat([{u:minU-20*dm,v:minV-20*dm}, {u:maxU+20*dm,v:minV-20*dm}, {u:(minU+maxU)/2,v:maxV+20*dm}]);
  const area = (a,b,c) => (b.u-a.u)*(c.v-a.v)-(b.v-a.v)*(c.u-a.u);
  const circum = (a,b,c) => {
    const bu=b.u-a.u, bv=b.v-a.v, cu=c.u-a.u, cv=c.v-a.v;
    const d=2*(bu*cv-bv*cu);
    if (d === 0) return null;
    const b2=bu*bu+bv*bv, c2=cu*cu+cv*cv;
    const x=a.u+(cv*b2-bv*c2)/d, y=a.v+(bu*c2-cu*b2)/d;
    return {x,y,r2:(a.u-x)**2+(a.v-y)**2};
  };
  let tris = [[n,n+1,n+2]];
  for (let i=0;i<n;i++) {
    const p=P[i], bad=[], edges=new Map();
    for (const t of tris) {
      const cc=circum(...t.map(k=>P[k]));
      if (!cc || (p.u-cc.x)**2+(p.v-cc.y)**2 <= cc.r2) bad.push(t);
    }
    for (const t of bad) for (const [a,b] of [[t[0],t[1]],[t[1],t[2]],[t[2],t[0]]]) {
      const k=a<b ? a+'_'+b : b+'_'+a;
      if (edges.has(k)) edges.delete(k); else edges.set(k,[a,b]);
    }
    tris=tris.filter(t=>!bad.includes(t));
    for (const [a,b] of edges.values()) if (area(P[a],P[b],p) !== 0) tris.push([a,b,i]);
  }
  return tris.filter(t=>t.every(k=>k<n) && area(...t.map(k=>P[k])) !== 0);
}

export function computeFrontier(rows, project) {
  const dominates = (a, b, axes) => axes.every(f => f(a) >= f(b)) && axes.some(f => f(a) > f(b));
  const pareto = axes => rows.filter(b => !rows.some(a => dominates(a, b, axes)));
  const cost = r => -r.cost, tok = r => -r.tok, val = r => r.val;
  const speed = r => r.speed ?? -Infinity;
  const front4 = pareto([cost, tok, val, speed]);
  const front3 = pareto([cost, tok, val]);
  const front2Cost = pareto([cost, val]);
  const front2Tok = pareto([tok, val]);
  const points = rows.map(row => ({ row, xyz: project(row) }));
  const pointOf = row => points.find(p => p.row === row);
  const slots = new Map();
  for (const row of front3) {
    const p=pointOf(row), key=JSON.stringify([p.xyz[0],p.xyz[2]]);
    if (!slots.has(key) || slots.get(key).row.val < row.val) slots.set(key,p);
  }
  const vertices=[...slots.values()];
  const tris=delaunay(vertices.map(p=>({u:p.xyz[0],v:p.xyz[2]})));
  const edgeCounts=new Map();
  for (const t of tris) for (const [a,b] of [[t[0],t[1]],[t[1],t[2]],[t[2],t[0]]]) {
    const key=a<b ? a+'_'+b : b+'_'+a;
    const edge=edgeCounts.get(key) || {indices:[a,b],count:0};
    edge.count++; edgeCounts.set(key,edge);
  }
  let edges=[...edgeCounts.values()].filter(e=>e.count===1).map(e=>e.indices);
  if (!tris.length) {
    const order=vertices.map((_,i)=>i).sort((a,b)=>vertices[a].xyz[0]-vertices[b].xyz[0] || vertices[a].xyz[2]-vertices[b].xyz[2]);
    edges=order.slice(1).map((i,k)=>[order[k],i]);
  }
  const direct = (front,axis) => {
    const sorted=front.map(pointOf).sort((a,b)=>a.xyz[axis]-b.xyz[axis] || a.xyz[1]-b.xyz[1]);
    return sorted.filter((p,i)=>!i || p.xyz[axis]!==sorted[i-1].xyz[axis] || p.xyz[1]!==sorted[i-1].xyz[1]).map(p=>[p.xyz[axis],p.xyz[1]]);
  };
  const interior4D = front4.filter(row => !front3.includes(row));
  const coverage = Object.fromEntries(points.map(({row,xyz})=>[row.id, {
    point:[...xyz], aliases:points.filter(p=>p.xyz.every((x,i)=>x===xyz[i])).map(p=>p.row.id),
    front3:front3.includes(row), front4:front4.includes(row),
    geometryVertex:vertices.some(p=>p.xyz.every((x,i)=>x===xyz[i])),
    reason:interior4D.includes(row) ? 'speed preserves full 4D nondomination; dominated in the displayed three axes' : front3.includes(row) ? 'observed three-axis frontier vertex; interpolation is a visual guide' : 'dominated in the displayed three axes'
  }]));
  return {front4,front3,front2Cost,front2Tok,interior4D,coverage,
    surface:{positions:vertices.flatMap(p=>p.xyz),triangles:tris.flat(),edges,vertexIds:vertices.map(p=>p.row.id)},
    lines:{cost:direct(front2Cost,0),tok:direct(front2Tok,2)}};
}
