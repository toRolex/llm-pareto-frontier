const assert = (await import('node:assert/strict')).default;
const fs = await import('node:fs/promises');
const spaceId = Number(process.env.MKL_SPACE_ID || 2);
assert.ok(Number.isInteger(spaceId) && spaceId > 0);
const page = (await taskSpace(spaceId)).page('p1');
const report = { spaceId, passed: false, checks: [] };
const settle = async () => {
  await page.waitForFunction(() => world && !flight && !cameraPlan && (!Motion || sampleMotion(Motion, performance.now()).done));
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
};
async function verify(name) {
  await settle();
  const result = await page.evaluate(() => {
    const fields = S.view === '3d' ? [['cost',-1],['tok',-1],['val',1]] : [[S.view === 'cost' ? 'cost' : 'tok',-1],['val',1]];
    const rows = world.rows.map(m => ({id:m.id,cost:costOf(m),tok:m.tok,val:METRICS[S.metric].get(m)}));
    const expected = rows.filter(a => !rows.some(b => fields.every(([k,d]) => d*b[k]>=d*a[k]) && fields.some(([k,d]) => d*b[k]>d*a[k]))).map(m=>m.id).sort();
    const rings=[];
    world.group.traverse(o=>{if(o.userData.ring && o.visible && o.material.opacity>0.01)rings.push(o.userData.model.id);});
    const close=(a,b)=>Math.abs(a-b)<0.0001;
    const attached=o=>{for(let p=o;p;p=p.parent)if(p===scene)return true;return false;};
    const isShown=o=>{for(let p=o;p;p=p.parent)if(!p.visible)return false;return attached(o);};
    const geometry = shownTopology===world.topology && isShown(shownTopology) && close(shownTopology.userData.alpha,1) && (S.view === '3d' ? (()=>{
      const target=world.rows.filter(m=>expected.includes(m.id)).map(m=>toWorld(m).toArray());
      const faces=shownTopology.children.filter(o=>o.userData.face && isShown(o));
      const actual=faces.flatMap(o=>{
        const attr=o.geometry.getAttribute('position');
        return Array.from({length:attr.count},(_,i)=>[attr.getX(i),attr.getY(i),attr.getZ(i)]);
      });
      const matches=(p,q)=>p.every((v,i)=>close(v,q[i]));
      const unique=target.filter((p,i)=>!target.slice(0,i).some(q=>matches(p,q)));
      return faces.every(o=>close(o.material.opacity,o.isMesh?0.28:0.7)) && actual.every(p=>target.some(q=>matches(p,q))) && (unique.length<2 ? actual.length===0 : unique.every(p=>actual.some(q=>matches(p,q)))) && !document.querySelector('#front-fill polygon');
    })() : (()=>{
      const axis=S.view==='cost'?'x':'z';
      const points=world.rows.filter(m=>expected.includes(m.id)).map(toWorld).sort((a,b)=>a[axis]-b[axis] || a.y-b.y);
      const unique=points.filter((p,i)=>!i || p[axis]!==points[i-1][axis] || p.y!==points[i-1].y);
      const line=shownTopology.children.find(o=>o.userData.projection===S.view);
      if(!line || !isShown(line) || !close(line.material.opacity,0.95))return false;
      const attr=line.geometry.getAttribute('position'),actual=Array.from(attr.array);
      const target=unique.flatMap(p=>S.view==='cost'?[p.x,p.y,-0.02]:[-0.02,p.y,p.z]);
      if(actual.length!==target.length || !actual.every((v,i)=>close(v,target[i])))return false;
      const polygon=document.querySelector(`#front-fill polygon[data-axis="${S.view}"]`);
      if(!target.length)return !document.querySelector('#front-fill polygon');
      if(!polygon || getComputedStyle(polygon).display==='none' || getComputedStyle(polygon.ownerSVGElement).display==='none')return false;
      const r=plotRect(),projected=Array.from({length:attr.count},(_,i)=>{
        const p=new THREE.Vector3(attr.getX(i),attr.getY(i),attr.getZ(i)).project(camera2);
        return [(p.x+1)*r.width/2,(1-p.y)*r.height/2];
      });
      const fillTarget=[...projected,[projected.at(-1)[0],0],[projected[0][0],0]];
      const fillActual=Array.from({length:polygon.points.numberOfItems},(_,i)=>{const p=polygon.points.getItem(i);return [p.x,p.y];});
      return fillActual.length===fillTarget.length && fillActual.every((p,i)=>p.every((v,j)=>Math.abs(v-fillTarget[i][j])<0.001)) && close(+getComputedStyle(polygon).opacity,shownTopology.userData.alpha) && close(+getComputedStyle(polygon).fillOpacity,0.16);
    })());
    const tooltips=world.sprites.map(sp=>{
      setHovered(sp);
      return {id:sp.userData.model.id,front:tip.querySelector('.front')?.textContent,obsolete:tip.textContent.includes('速度优势保留')};
    });
    clearHover();
    const retiring=[];world.group.traverse(o=>{if(o.userData.retiringRing)retiring.push(o.userData.model.id);});
    return {view:S.view,metric:S.metric,price:S.priceMode,perTask:S.perTask,costScale:S.costScale,tokScale:S.tokScale,expected,rings:rings.sort(),membership:[...world.frontSet].map(m=>m.id).sort(),status:document.querySelector('#state').textContent,tooltips,geometry,retiring,settled:!flight && !cameraPlan && controls.enabled===!VIEWS[S.view].lock,rows:world.rows.length,visibleRows:visible().length,selectedCount:[...selected.values()].reduce((n,s)=>n+s.size,0),errors:window.__ringsErrors};
  });
  assert.deepEqual(result.rings,result.expected,`${name} visible rings match independent raw-axis oracle`);
  assert.deepEqual(result.membership,result.expected,`${name} shared membership`);
  assert.ok(result.status.includes(`当前显示轴 Pareto 非支配 ${result.expected.length}`),`${name} status count`);
  for(const t of result.tooltips) {
    assert.equal(t.front,result.expected.includes(t.id)?'当前显示轴 Pareto 非支配配置':'非当前显示轴 Pareto 前沿',`${name} tooltip ${t.id}`);
    assert.equal(t.obsolete,false);
  }
  assert.equal(result.geometry,true,`${name} rings agree with actual displayed frontier geometry`);
  assert.deepEqual(result.errors,[]);
  assert.deepEqual(result.retiring,[],`${name} retiring rings removed`);
  assert.equal(result.settled,true,`${name} camera settled and controls match view`);
  if(name.startsWith('empty ')) for(const field of ['rows','visibleRows','selectedCount']) assert.equal(result[field],0,`${name} genuinely empty ${field}`);
  report.checks.push({name,...result});
  console.log(`PASS ${name} ${result.view} rings=${result.rings.length}`);
}
let saved;
try {
  if(process.env.MKL_URL) await page.goto(process.env.MKL_URL);
  await settle();
  saved=await page.evaluate(()=>({state:JSON.parse(JSON.stringify(S)),selected:[...selected].map(([k,v])=>[k,[...v]])}));
  await page.evaluate(()=>{
    window.__ringsErrors=[];
    window.__ringsOnError=e=>window.__ringsErrors.push(e.message||String(e.reason));
    addEventListener('error',window.__ringsOnError);addEventListener('unhandledrejection',window.__ringsOnError);
  });
  await verify('initial');
  const metrics=await page.evaluate(()=>[...document.querySelectorAll('button[data-metric]')].map(b=>b.dataset.metric));
  for(const metric of metrics) {
    await page.click(`button[data-metric="${metric}"]`);
    for(const view of ['3d','cost','tok','cost']) {
      await page.click(`button[data-view="${view}"]`);
      await verify(`metric ${metric}/${view}`);
    }
  }
  const prices=await page.evaluate(()=>[...document.querySelectorAll('button[data-price]')].map(b=>b.dataset.price));
  for(const price of prices) {
    await page.click(`button[data-price="${price}"]`);
    for(const view of ['3d','cost','tok']) {
      await page.click(`button[data-view="${view}"]`);
      await verify(`price ${price}/${view}`);
    }
  }
  for(const axis of ['cost','tok']) for(let i=0;i<2;i++) {
    await page.click(`button[data-scale="${axis}"]`);await verify(`scale ${axis}/${i}`);
  }
  for(let i=0;i<2;i++) {
    await page.click('button[data-pertask]');await verify(`per task ${i}`);
  }
  await page.click('loc=role:button[name*="Configs"]');
  await page.click('#cfg-all');await verify('select all');
  await page.click('#cfg-list .cfg-row:first-child .chip:first-child');await verify('exclude one config');
  await page.click('#cfg-none');
  await verify('empty cleared');
  await page.click('loc=role:button[name*="Configs"]');
  for(const view of ['3d','cost','tok']) {await page.click(`button[data-view="${view}"]`);await verify(`empty ${view}`);}
  await page.click('loc=role:button[name*="Configs"]');
  await page.click('#cfg-all');await verify('restore all configs');
  await page.click('loc=role:button[name*="Configs"]');
  await page.click('button[data-metric="0"]');
  await page.click('button[data-view="3d"]');await verify('reversal baseline');
  const reversal=await page.evaluate(()=>new Promise((resolve,reject)=>{
    const fronts=view=>{
      const fields=view==='3d'?[['cost',-1],['tok',-1],['val',1]]:[[view==='cost'?'cost':'tok',-1],['val',1]];
      const rows=world.rows.map(m=>({id:m.id,cost:costOf(m),tok:m.tok,val:METRICS[S.metric].get(m)}));
      return rows.filter(a=>!rows.some(b=>fields.every(([k,d])=>d*b[k]>=d*a[k]) && fields.some(([k,d])=>d*b[k]>d*a[k]))).map(m=>m.id);
    };
    const front3=fronts('3d');
    const target=['cost','tok'].map(view=>({view,id:front3.find(id=>!fronts(view).includes(id))})).find(t=>t.id);
    if(!target)return reject(new Error('No ring membership difference for reversal fixture'));
    if(reducedMotion())return reject(new Error('Opacity reversal requires real non-reduced animation'));
    const started=performance.now();
    document.querySelector(`button[data-view="${target.view}"]`).click();
    const frame=()=>{
      sampleDataMotion(performance.now());
      const oldRing=world.handles.get(target.id)?.nodes.find(o=>o.userData.ring);
      if(oldRing && oldRing.material.opacity>0 && oldRing.material.opacity<0.95){
        const before=oldRing.material.opacity;
        document.querySelector('button[data-view="3d"]').click();
        const ring=world.handles.get(target.id)?.nodes.find(o=>o.userData.ring);
        resolve({id:target.id,view:target.view,before,sampled:oldRing.material.opacity,from:ring?.userData.ringPlan?.from,after:ring?.material.opacity,to:ring?.userData.ringPlan?.to,retiring:!!ring?.userData.retiringRing});
      }else if(performance.now()-started>2000)reject(new Error('No real intermediate fading ring frame observed'));
      else requestAnimationFrame(frame);
    };
    frame();
  }));
  assert.ok(reversal.before>0 && reversal.before<0.95);
  assert.ok(Math.abs(reversal.sampled-reversal.before)<0.05,'reversal samples the current fading opacity');
  assert.equal(reversal.from,reversal.sampled,'same ID new ring starts from sampled old opacity');
  assert.equal(reversal.after,reversal.from,'rebuild preserves opacity at reversal boundary');
  assert.equal(reversal.to,0.95);assert.equal(reversal.retiring,false);
  report.reversal=reversal;
  await verify('live sampled opacity reversal');
  await page.evaluate(()=>{
    document.querySelector('button[data-view="3d"]').click();
    document.querySelector('button[data-view="cost"]').click();
    document.querySelector('button[data-view="tok"]').click();
    document.querySelector('button[data-view="3d"]').click();
  });
  await verify('rapid 3d cost tok 3d');
  for(const view of ['cost','tok','cost']) {
    await page.evaluate(view=>{
      document.querySelector(`button[data-view="${view}"]`).click();
      document.querySelector(`button[data-metric="${(S.metric+1)%METRICS.length}"]`).click();
      document.querySelector('button[data-scale="cost"]').click();
    },view);
    await verify(`interrupted ${view}`);
  }
  await page.click('button[data-metric="0"]');
  await page.click('button[data-view="cost"]');await verify('stable snapshot');
  const screenshot=process.env.MKL_RINGS_SCREENSHOT || '/tmp/pareto-rings-after.png';
  await page.screenshot({path:screenshot});report.screenshot=screenshot;
  report.passed=true;
} catch(error) {report.failure={message:error.message,stack:error.stack};process.exitCode=1;}
finally {
  try {
    if(saved) await page.evaluate(saved=>{
      Object.assign(S,saved.state);selected.clear();saved.selected.forEach(([k,v])=>selected.set(k,new Set(v)));
      rebuild({keepCamera:true});applyView(S.view,true);buildCfg();updateCfgBtn();renderPricingPanel();
      for(const kind of ['price','metric']) document.querySelectorAll(`button[data-${kind}]`).forEach(b=>b.classList.toggle('on',kind==='price'?b.dataset.price===S.priceMode:+b.dataset.metric===S.metric));
      document.querySelector('button[data-pertask]').classList.toggle('on',S.perTask);
      for(const axis of ['cost','tok']) document.querySelector(`button[data-scale="${axis}"]`).textContent=(axis==='cost'?'Cost: ':'Tok: ')+(S[axis+'Scale']==='log'?'log':'线性');
      cfgEl.classList.add('hidden');clearHover();
      removeEventListener('error',window.__ringsOnError);removeEventListener('unhandledrejection',window.__ringsOnError);
    },saved);
    await settle();report.restored=true;
  } catch(error) {report.cleanupFailure=String(error);report.passed=false;process.exitCode=1;}
  const path=process.env.MKL_RINGS_REPORT || '/tmp/pareto-rings-browser-results.json';
  await fs.writeFile(path,JSON.stringify(report,null,2));
  console.log(JSON.stringify({passed:report.passed,checks:report.checks.length,report:path,failure:report.failure,cleanupFailure:report.cleanupFailure}));
}
