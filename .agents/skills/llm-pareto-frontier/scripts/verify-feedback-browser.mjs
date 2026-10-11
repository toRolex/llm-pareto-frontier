// { printf 'process.env.MKL_SPACE_ID="%s";\n' "${MKL_SPACE_ID:-1}"; tee < .agents/skills/llm-pareto-frontier/scripts/verify-feedback-browser.mjs; } | ego-browser nodejs
// The parent owns TaskSpace lifetime and serializes access to p1.
const { default: assert } = await import('node:assert/strict');
const fs = await import('node:fs/promises');
const spaceId = Number(process.env.MKL_SPACE_ID || 1);
assert.ok(Number.isInteger(spaceId) && spaceId > 0);
const page = (await taskSpace(spaceId)).page('p1');
const report = { spaceId, page: 'p1', checks: [], passed: false };
const record = (name, evidence) => report.checks.push({ name, evidence });
const frames = () => page.evaluate(() => new Promise(resolve => {
  let n = 0;
  const tick = () => ++n === 24 ? resolve() : requestAnimationFrame(tick);
  requestAnimationFrame(tick);
}));
const settle = async () => {
  await page.waitForFunction(() => world && !flight && (!Motion || sampleMotion(Motion, performance.now()).done));
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
};
const snapshot = () => page.evaluate(() => {
  const rect = r => ({ x: r.x ?? r.left, y: r.y ?? r.top, width: r.width, height: r.height });
  const p = rect(plotRect()), card = rect(document.querySelector('#tip').getBoundingClientRect());
  const key = m => m.creator + '|' + baseKey(m.model);
  const id = m => m.id ?? m.model;
  const cam = activeCamera();
  const points = world.sprites.map(sp => {
    const m = sp.userData.model, projected = sp.position.clone().project(cam);
    const eye = sp.position.clone().applyMatrix4(cam.matrixWorldInverse);
    const half = sp.scale.x / 2;
    const a = sp.position.clone().add(new THREE.Vector3(half, 0, 0).applyQuaternion(cam.quaternion)).project(cam);
    const b = sp.position.clone().add(new THREE.Vector3(-half, 0, 0).applyQuaternion(cam.quaternion)).project(cam);
    return { id: id(m), name: m.model, family: key(m), base: baseKey(m.model), effort: effortOf(m.model),
      x: p.x + (projected.x + 1) * p.width / 2, y: p.y + (1 - projected.y) * p.height / 2,
      depth: -eye.z, size: Math.abs(a.x - b.x) * p.width / 2, scale: sp.scale.x,
      opacity: sp.material.opacity, xyz: sp.position.toArray(), cost: costOf(m), tok: m.tok, val: m.val, speed: m.speed ?? null };
  });
  const labels = [...document.querySelectorAll('#labels g[data-model]')].map(g => ({ name: g.dataset.model,
    text: [...g.querySelectorAll('tspan')].map(t => t.textContent), box: rect(g.querySelector('text').getBoundingClientRect()) }));
  const fills = {};
  for (const axis of ['cost', 'tok']) {
    const polygon = document.querySelector(`#front-fill polygon[data-axis="${axis}"]`);
    if (polygon) {
      const svg=polygon.ownerSVGElement, matrix=polygon.getScreenCTM(), style=getComputedStyle(polygon);
      const points=Array.from({length:polygon.points.numberOfItems},(_,i)=>{const q=polygon.points.getItem(i),pixel=new DOMPoint(q.x,q.y).matrixTransform(matrix);return [pixel.x,pixel.y];});
      const local=xyz=>{const q=new THREE.Vector3(...xyz).project(cam);return [p.x+(q.x+1)*p.width/2,p.y+(1-q.y)*p.height/2];};
      fills[axis]={points,opacity:Number(style.fillOpacity)*Number(style.opacity),visible:style.display!=='none'&&getComputedStyle(svg).display!=='none',clip:getComputedStyle(svg).overflow,svgRect:rect(svg.getBoundingClientRect()),
        origin:local([0,0,0]),xEnd:local(axis==='cost'?[W.w,0,0]:[0,0,W.h]),yEnd:local([0,W.d,0])};
    }
  }
  return { view: S.view, metric: S.metric, price: S.priceMode, flight: !!flight, points, labels, p, card,
    hovered: typeof hovered !== 'undefined' && hovered ? id(hovered.userData.model) : null,
    hoverState: typeof hoverState !== 'undefined' ? hoverState : null,
    cameraType: cam.type, camera2: camera2.position.toArray(), direction: cam.getWorldDirection(new THREE.Vector3()).toArray(),
    cameraPosition: camera.position.toArray(), target: controls.target.toArray(),
    front: world.front.map(id), frontier: world.frontier, fills,
    lines: Object.fromEntries(['cost', 'tok'].map(axis => [axis, Array.from(world.frontLines[axis][0].geometry.attributes.position.array)])),
    effortLines: [...world.effortLines].map(([family, lines]) => ({ family, opacities: lines.map(l => l.material.opacity) })),
    worldSize: { ...W }, errors: window.__feedbackErrors || [] };
});
const intersects = (a, b) => a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
const close = (a, b, eps = 3e-5) => Math.abs(a - b) <= eps;
const oracle = (points, axes) => points.filter(a => !points.some(b => axes.every(([k, dir]) => dir * b[k] >= dir * a[k]) && axes.some(([k, dir]) => dir * b[k] > dir * a[k]))).map(p => p.id).sort();
const dimensions = [['cost', -1], ['tok', -1], ['val', 1], ['speed', 1]];
function verifyFrontier(s) {
  const rows = s.points.map(p => ({ ...p, speed: p.speed ?? -Infinity }));
  const displayedAxes = s.view === '3d' ? dimensions.slice(0, 3) : [[s.view === 'cost' ? 'cost' : 'tok', -1], ['val', 1]];
  assert.deepEqual([...s.front].sort(), oracle(rows, displayedAxes), 'rings match current displayed-axis Pareto');
  assert.deepEqual(s.frontier.front4.map(p => p.id).sort(), oracle(rows, dimensions), 'domain preserves full P4 separately');
  assert.ok(s.frontier, 'world.frontier must expose surface and coverage');
  const p3 = oracle(rows, dimensions.slice(0, 3));
  const surface = s.frontier.surface;
  const vertex = i => surface.positions.slice(i * 3, i * 3 + 3).map((v, axis) => (v + 5) / 10 * [s.worldSize.w, s.worldSize.d, s.worldSize.h][axis]);
  const onTriangle = (p, a, b, c) => {
    const sub = (u,v) => u.map((x,i) => x-v[i]), dot = (u,v) => u.reduce((sum,x,i) => sum+x*v[i],0);
    const ab = sub(b,a), ac = sub(c,a), ap = sub(p,a);
    const cross = [ab[1]*ac[2]-ab[2]*ac[1],ab[2]*ac[0]-ab[0]*ac[2],ab[0]*ac[1]-ab[1]*ac[0]];
    const norm = Math.sqrt(dot(cross,cross));
    if (norm < 1e-9 || Math.abs(dot(ap,cross))/norm > 4e-5) return false;
    const d00=dot(ab,ab), d01=dot(ab,ac), d11=dot(ac,ac), d20=dot(ap,ab), d21=dot(ap,ac), den=d00*d11-d01*d01;
    const u=(d11*d20-d01*d21)/den, v=(d00*d21-d01*d20)/den;
    return u >= -1e-5 && v >= -1e-5 && u+v <= 1+1e-5;
  };
  for (const id of p3) {
    const p = rows.find(p => p.id === id), coverage = s.frontier.coverage[id];
    assert.equal(coverage?.front3, true, `${id} P3 ledger`);
    assert.equal(coverage?.geometryVertex, true, `${id} observed geometry vertex`);
    let hit = false;
    for (let i=0; i<surface.triangles.length; i+=3) {
      if (onTriangle(p.xyz, ...surface.triangles.slice(i,i+3).map(vertex))) { hit=true; break; }
    }
    const edgeVertex = Array.from({length:surface.positions.length/3}, (_,i) => vertex(i)).some(v => v.every((x,i) => close(x,p.xyz[i])));
    assert.ok(hit || edgeVertex, `${id} independently covered by actual surface geometry`);
  }
  record(`P4/P3 metric ${s.metric} ${s.price}`, { expectedP4: oracle(rows,dimensions), actualP4:s.frontier.front4.map(p => p.id), currentView:s.front, p3 });
}
const rowsFor2D = s => s.points.map(p=>({...p,speed:p.speed ?? -Infinity}));
function verify2D(s) {
  assert.equal(s.flight, false);
  assert.equal(s.cameraType, 'OrthographicCamera');
  const axis = s.view === 'cost' ? 0 : 2;
  const normal = s.view === 'cost' ? 2 : 0;
  assert.ok(close(Math.abs(s.direction[normal]),1), 'cancelled flight must land on a true 2D plane');
  assert.ok(s.direction.every((v,i) => i === normal || close(v,0)), '2D camera must have no oblique component');
  const frontierIds=oracle(rowsFor2D(s),[[s.view === 'cost' ? 'cost' : 'tok',-1],['val',1]]);
  const sorted=s.points.filter(p=>frontierIds.includes(p.id)).map(p=>[p.xyz[axis],p.xyz[1]]).sort((a,b)=>a[0]-b[0] || a[1]-b[1]);
  const stairs=sorted.filter((p,i)=>!i || p[0]!==sorted[i-1][0] || p[1]!==sorted[i-1][1]);
  const expected=stairs.flatMap(([x,y]) => axis===0 ? [x,y,-0.02] : [-0.02,y,x]);
  assert.equal(s.lines[s.view].length, expected.length, 'direct observed front2 vertex count');
  assert.ok(s.lines[s.view].every((v,i)=>close(v,expected[i])), 'independent direct observed frontier, no inserted corners');
  const fill=s.fills[s.view];
  assert.ok(fill && fill.visible && fill.opacity>0 && fill.opacity<0.5, 'visible shallow above-frontier fill');
  const width=axis===0?s.worldSize.w:s.worldSize.h;
  const dx=fill.xEnd[0]-fill.origin[0],dy=fill.yEnd[1]-fill.origin[1];
  const actualPolygon=fill.points.map(([x,y])=>[(x-fill.origin[0])/dx*width,(y-fill.origin[1])/dy*s.worldSize.d]);
  const visibleTop=(s.p.y-fill.origin[1])/dy*s.worldSize.d;
  const expectedPolygon=[...stairs,[stairs.at(-1)[0],visibleTop],[stairs[0][0],visibleTop]];
  assert.equal(fill.clip,'hidden','above-frontier polygon must be clipped to the visible chart');
  for(const k of ['x','y','width','height']) assert.ok(close(fill.svgRect[k],s.p[k],0.01),`fill clip matches plot ${k}`);
  const equalPoint=(a,b)=>a.every((v,i)=>close(v,b[i],0.003));
  const cyclicEqual=(a,b)=>a.length===b.length&&a.some((_,offset)=>b.every((point,i)=>equalPoint(point,a[(i+offset)%a.length])));
  assert.ok(cyclicEqual(actualPolygon,expectedPolygon)||cyclicEqual([...actualPolygon].reverse(),expectedPolygon),'SVG polygon exactly follows direct frontier and closes above it');
  const areaOf=polygon=>Math.abs(polygon.reduce((sum,a,i)=>{const b=polygon[(i+1)%polygon.length];return sum+a[0]*b[1]-b[0]*a[1];},0))/2;
  const area=areaOf(actualPolygon),expectedArea=areaOf(expectedPolygon);
  assert.ok(close(area,expectedArea,0.02),'above fill exact polygon area');
  record(`2D exact line/fill ${s.view}`,{expected,actualPolygon,expectedPolygon,area,expectedArea,direction:s.direction});
}
function verifyCard(s, baseline) {
  assert.ok(s.card.width>0 && s.card.height>0, 'default reserved card must remain visible');
  assert.equal(intersects(s.card,s.p),false,'card must not overlap plotRect');
  if(baseline) for(const k of ['x','y','width','height']) assert.ok(close(s.card[k],baseline[k],1),`fixed card ${k}`);
}
async function hoverPoint(point, baseline) {
  await page.mouse.move(point.x,point.y);
  await settle();
  const s=await snapshot();
  assert.equal(s.hoverState?.modelId,point.id,'point hit selects exact config');
  assert.equal(s.hoverState?.familyKey,point.family,'family key includes creator');
  assert.equal(s.hovered,point.id,'hovered sprite and state agree');
  const peers=s.points.filter(p=>p.family===point.family), named=s.labels.filter(l=>l.text.length===2);
  assert.equal(named.length,1,'exactly one full name on hover');
  assert.equal(named[0].name,point.name,'full name belongs to target config');
  assert.deepEqual(named[0].text,[point.base,point.effort]);
  assert.deepEqual(s.labels.map(l=>l.name).sort(),peers.map(p=>p.name).sort(),'all family efforts including single config');
  for(const l of s.labels) assert.equal(l.text.at(-1),peers.find(p=>p.name===l.name).effort);
  assert.ok(s.points.filter(p=>p.family!==point.family).every(p=>p.opacity<=0.2),'other families dim, including single-config hover');
  assert.ok(peers.every(p=>p.opacity>0.2),'all family configs highlight');
  for(const line of s.effortLines.filter(l=>l.family===point.family)) assert.ok(line.opacities.every(v=>v>0.2),'family segments highlight');
  verifyCard(s,baseline);
  record(`hover ${point.name}`,{hoverState:s.hoverState,labels:s.labels,card:s.card});
}
let saved;
try {
  await settle();
  saved=await page.evaluate(()=>({state:JSON.parse(JSON.stringify(S)), selected:[...selected].map(([k,v])=>[k,[...v]]), theme,
    storage:['mkl-pricing-v1','mkl-theme'].map(key=>{try{return {key,value:localStorage.getItem(key)};}catch{return {key,unavailable:true};}})}));
  await page.evaluate(()=> {window.__feedbackErrors=[]; window.__feedbackOnError=e=>window.__feedbackErrors.push(e.message||String(e.reason)); addEventListener('error',window.__feedbackOnError); addEventListener('unhandledrejection',window.__feedbackOnError);});
  for(const view of ['cost','tok']) {
    await page.click(`button[data-view="${view}"]`); await settle();
    await page.mouse.move(2,2); await settle();
    let s=await snapshot(); assert.equal(s.labels.length,0,'default labels zero'); verifyCard(s); verify2D(s);
    const baseline=s.card;
    const families=new Map(); for(const p of s.points) families.set(p.family,[...(families.get(p.family)||[]),p]);
    const visible=p=>p.x>s.p.x+25&&p.x<s.p.x+s.p.width-25&&p.y>s.p.y+25&&p.y<s.p.y+s.p.height-25;
    const multi=[...families.values()].find(ps=>ps.length>1&&ps.some(visible));
    const single=[...families.values()].find(ps=>ps.length===1&&visible(ps[0]));
    assert.ok(multi&&single,'real dataset must exercise multi/single families');
    await hoverPoint(multi.find(visible),baseline); await hoverPoint(single[0],baseline);
    const segments=await page.evaluate(()=>[...world.effortLines].flatMap(([family,lines])=>lines.flatMap(l=>{
      const a=l.geometry.attributes.position.array, out=[], r=plotRect();
      for(let i=0;i<a.length-3;i+=3) {
        const project=j=>new THREE.Vector3(a[j],a[j+1],a[j+2]).project(activeCamera());
        const p=project(i),q=project(i+3);
        out.push({family,a:{x:r.x+(p.x+1)*r.width/2,y:r.y+(1-p.y)*r.height/2},b:{x:r.x+(q.x+1)*r.width/2,y:r.y+(1-q.y)*r.height/2}});
      } return out;
    })));
    const segment=segments.find(l=>Math.hypot(l.a.x-l.b.x,l.a.y-l.b.y)>60&&visible(l.a)&&visible(l.b));
    assert.ok(segment,'dataset must contain an isolated hittable family segment');
    const at={x:segment.a.x*0.7+segment.b.x*0.3,y:segment.a.y*0.7+segment.b.y*0.3};
    const nearest=s.points.filter(p=>p.family===segment.family).sort((a,b)=>Math.hypot(a.x-at.x,a.y-at.y)-Math.hypot(b.x-at.x,b.y-at.y))[0];
    await page.mouse.move(at.x,at.y); await settle(); s=await snapshot();
    assert.equal(s.hoverState?.modelId,nearest.id,'segment hit chooses nearest projected configuration'); verifyCard(s,baseline);
    record(`segment ${view}`,{at,nearest:nearest.id,hoverState:s.hoverState});
    await page.mouse.move(s.p.x+s.p.width/2,s.p.y+s.p.height/2); await page.mouse.wheel(0,-180); await frames();
    verify2D(await snapshot());
    await page.mouse.down(); await page.mouse.move(s.p.x+s.p.width/2+65,s.p.y+s.p.height/2+35); await page.mouse.up(); await frames();
    verify2D(await snapshot());
    await page.evaluate(()=>applyView(S.view,true)); await settle();
  }
  for(let metric=0;metric<11;metric++) {
    await page.click(`button[data-metric="${metric}"]`); await settle(); verifyFrontier(await snapshot());
  }
  for(const view of ['cost','tok']) for(const cancel of ['metric','price','filter','resize']) {
    await page.evaluate(({view,cancel})=>{
      applyView('3d',true); applyView(view,false);
      if(cancel==='metric') document.querySelector(`button[data-metric="${(S.metric+1)%11}"]`).click();
      if(cancel==='price') document.querySelector(`button[data-price="${S.priceMode==='in'?'out':'in'}"]`).click();
      if(cancel==='filter') { const first=selected.keys().next().value; selected.delete(first); rebuild({keepCamera:true}); }
      if(cancel==='resize') dispatchEvent(new Event('resize'));
    },{view,cancel});
    await settle(); const s=await snapshot(); verify2D(s); verifyFrontier(s); record(`rapid cancellation ${view}/${cancel}`,{camera2:s.camera2});
  }
  for(const size of [{width:1470,height:837},{width:720,height:700}]) {
    await page.cdp('Emulation.setDeviceMetricsOverride',{...size,deviceScaleFactor:1,mobile:false});
    await page.evaluate(()=>dispatchEvent(new Event('resize'))); await settle();
    for(const t of ['light','dark']) {await page.click(`#theme-switch button[data-theme="${t}"]`);await settle();const s=await snapshot();verifyCard(s);verify2D(s);record(`resize/card ${size.width}/${t}`,{plot:s.p,card:s.card});}
  }
  await page.cdp('Emulation.clearDeviceMetricsOverride',{}); await page.evaluate(()=>dispatchEvent(new Event('resize')));
  await page.click('button[data-view="3d"]'); await settle(); await page.mouse.move(2,2); await settle();
  let before=await snapshot(); assert.equal(before.labels.length,0);
  const center={x:before.p.x+before.p.width/2,y:before.p.y+before.p.height/2};
  await page.mouse.move(center.x,center.y); await page.mouse.wheel(0,-180); await frames();
  let after=await snapshot();
  const distance=s=>Math.hypot(...s.cameraPosition.map((v,i)=>v-s.target[i]));
  assert.ok(distance(after)<distance(before),'actual 3D wheel zooms in');
  record('real wheel input',{before:distance(before),after:distance(after)});
  before=after; await page.mouse.move(center.x,center.y); await page.mouse.down();
  for(let i=1;i<=8;i++) await page.mouse.move(center.x+i*8,center.y+i*3);
  await page.mouse.up(); await frames(); after=await snapshot();
  assert.ok(Math.hypot(...after.direction.map((v,i)=>v-before.direction[i]))>0.01,'actual drag rotates perspective camera');
  const visible=after.points.filter(p=>p.depth>0&&p.x>after.p.x&&p.x<after.p.x+after.p.width&&p.y>after.p.y&&p.y<after.p.y+after.p.height).sort((a,b)=>a.depth-b.depth);
  assert.ok(visible.length>1); const near=visible[0],far=visible.at(-1);
  assert.ok(far.depth>near.depth*1.05,'near/far evidence has meaningful depth separation');
  assert.ok(near.size/near.scale>far.size/far.scale,'actual projected sprites shrink with distance');
  assert.ok(close((near.size/near.scale)/(far.size/far.scale),far.depth/near.depth,0.03),'projected size ratio agrees with perspective depths');
  record('real drag and near/far projected size',{direction:after.direction,near,far});
  assert.deepEqual(after.errors,[]); report.passed=true;
} catch(error) { report.failure={message:error.message,stack:error.stack}; process.exitCode=1; }
finally {
  try {
    await page.cdp('Emulation.clearDeviceMetricsOverride',{});
    if(saved) await page.evaluate(saved=>{
      for(const item of saved.storage) if(!item.unavailable) {if(item.value===null)localStorage.removeItem(item.key);else localStorage.setItem(item.key,item.value);}
      Object.assign(S,saved.state); selected.clear(); saved.selected.forEach(([k,v])=>selected.set(k,new Set(v)));
      theme=saved.theme; document.documentElement.dataset.theme=theme; scene.background.setHex(palette().bg);
      document.querySelectorAll('#theme-switch button').forEach(b=>b.classList.toggle('on',b.dataset.theme===theme));
      rebuild(); applyView(S.view,true); renderPricingPanel();
      for(const kind of ['price','metric']) document.querySelectorAll(`button[data-${kind}]`).forEach(b=>b.classList.toggle('on',kind==='price'?b.dataset.price===S.priceMode:+b.dataset.metric===S.metric));
      removeEventListener('error',window.__feedbackOnError); removeEventListener('unhandledrejection',window.__feedbackOnError);
      dispatchEvent(new Event('resize'));
    },saved);
    report.restored=true;
  } catch(error) {report.cleanupFailure=String(error);report.passed=false;process.exitCode=1;}
  const path='/tmp/pareto-feedback-browser-report.json';
  await fs.writeFile(path,JSON.stringify(report,null,2)); console.log(JSON.stringify({passed:report.passed,checks:report.checks.length,report:path,failure:report.failure,cleanupFailure:report.cleanupFailure}));
}
