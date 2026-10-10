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
  const positions = [], triangles = [], faces = [];
  const vertex = xyz => { const index = positions.length / 3; positions.push(...xyz); return index; };
  const quad = (kind, corners) => {
    const indices = corners.map(vertex);
    triangles.push(indices[0], indices[1], indices[2], indices[0], indices[2], indices[3]);
    faces.push({ kind, corners });
  };
  const unique = values => [...new Set(values)].sort((a, b) => a - b);
  const u = unique([-5, 5, ...points.map(p => p.xyz[0]).filter(x => x > -5 && x < 5)]);
  const v = unique([-5, 5, ...points.map(p => p.xyz[2]).filter(x => x > -5 && x < 5)]);
  const height = (x, z) => {
    const feasible = points.filter(p => p.xyz[0] >= x && p.xyz[2] >= z);
    return feasible.length ? Math.max(...feasible.map(p => p.xyz[1])) : null;
  };
  const cells = u.slice(1).map(x => v.slice(1).map(z => height(x, z)));
  for (let i = 0; i < u.length - 1; i++) {
    for (let j = 0; j < v.length - 1; j++) {
      const x0 = u[i], x1 = u[i + 1], z0 = v[j], z1 = v[j + 1], y = cells[i][j];
      if (y === null) continue;
      quad('top', [[x0,y,z0], [x0,y,z1], [x1,y,z1], [x1,y,z0]]);
      const right = cells[i + 1]?.[j] ?? null;
      if (right !== null && y !== right) quad('step', [[x1,right,z0], [x1,y,z0], [x1,y,z1], [x1,right,z1]]);
      const above = cells[i][j + 1] ?? null;
      if (above !== null && y !== above) quad('step', [[x0,above,z1], [x1,above,z1], [x1,y,z1], [x0,y,z1]]);
    }
  }
  const onFace = (xyz, { corners }) => [0,1,2].every(axis => {
    const coordinates = corners.map(c => c[axis]);
    return xyz[axis] >= Math.min(...coordinates) && xyz[axis] <= Math.max(...coordinates);
  });
  const interior4D = front4.filter(row => !front3.includes(row));
  const coverage = Object.fromEntries(points.map(({ row, xyz }) => {
    const inBounds = xyz[0] >= -5 && xyz[0] <= 5 && xyz[2] >= -5 && xyz[2] <= 5;
    const envelopeBoundary = inBounds && xyz[1] === height(xyz[0], xyz[2]);
    const face = faces.find(face => face.kind === 'top' && onFace(xyz, face))
      ?? faces.find(face => face.kind === 'step' && onFace(xyz, face));
    const boundaryPoint = !face && envelopeBoundary && front3.includes(row) && (xyz[0] === -5 || xyz[2] === -5);
    if (boundaryPoint) vertex(xyz);
    const classification = face?.kind ?? (boundaryPoint ? 'top' : 'interior');
    const boundary = classification === 'top' || classification === 'step';
    return [row.id, {
      point: [...xyz],
      aliases: points.filter(p => p.xyz.every((x, axis) => x === xyz[axis])).map(p => p.row.id),
      boundary,
      classification,
      boundaryPoint,
      front3: front3.includes(row),
      front4: front4.includes(row),
      reason: interior4D.includes(row) ? 'speed preserves full 4D nondomination; dominated in the displayed three axes' : boundary ? 'displayed envelope boundary' : 'dominated in the displayed three axes'
    }];
  }));
  const staircase = axis => {
    const xs = unique(points.map(p => p.xyz[axis]).filter(x => x >= -5 && x <= 5));
    if (!xs.length) return [];
    const boundary = [];
    let left = -5;
    for (const x of xs) {
      const y = Math.max(...points.filter(p => p.xyz[axis] >= x).map(p => p.xyz[1]));
      if (!boundary.length || boundary.at(-1)[1] !== y) boundary.push([left, y]);
      if (boundary.at(-1)[0] !== x) boundary.push([x, y]);
      left = x;
    }
    return boundary;
  };
  return { front4, front3, front2Cost, front2Tok, surface: { positions, triangles, faces }, interior4D, coverage, stairs: { cost: staircase(0), tok: staircase(2) } };
}
