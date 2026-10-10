export const MOTION_MS = 240;
export const motionEase = k => k < 0.5 ? 4*k*k*k : 1-Math.pow(-2*k+2,3)/2;
export function sampleMotion(motion, now) {
  const k = motion.duration ? Math.min(1,Math.max(0,(now-motion.t0)/motion.duration)) : 1;
  const e = motionEase(k), points = new Map();
  for (const [id,p] of motion.keyed) points.set(id,{position:p.from.map((v,i)=>v+(p.to[i]-v)*e),alpha:p.alphaFrom+(p.alphaTo-p.alphaFrom)*e});
  const swap = k >= 0.5;
  const topologyAlpha = motion.duration ? (swap ? motionEase((k-0.5)*2) : motion.shownAlpha*(1-motionEase(k*2))) : 1;
  return {points,done:k===1,swap,topologyAlpha};
}
export function createMotion(targetKey, targets, current, now, {reduced=false,shownAlpha=1}={}) {
  const keyed=new Map();
  for (const id of new Set([...current.keys(),...targets.keys()])) {
    const old=current.get(id),to=targets.get(id);
    if(!to && old.alpha===0) continue;
    keyed.set(id,{from:old ? old.position.slice() : to.slice(),to:to ? to.slice() : old.position.slice(),alphaFrom:old ? old.alpha : 0,alphaTo:to ? 1 : 0});
  }
  return {targetKey,keyed,t0:now,duration:reduced ? 0 : MOTION_MS,shownAlpha};
}
export function retargetMotion(motion,targetKey,targets,now,options) {
  if(motion && motion.targetKey===targetKey) return motion;
  const current=motion ? sampleMotion(motion,now).points : new Map();
  return createMotion(targetKey,targets,current,now,options);
}
export function sampleCameraPlan(plan,now) {
  const k=plan.duration ? Math.min(1,Math.max(0,(now-plan.t0)/plan.duration)) : 1,e=motionEase(k);
  return {position:plan.from.position.map((v,i)=>v+(plan.to.position[i]-v)*e),target:plan.from.target.map((v,i)=>v+(plan.to.target[i]-v)*e),fov:plan.from.fov+(plan.to.fov-plan.from.fov)*e,done:k===1};
}
export function createCameraPlan(targetKey,from,to,now,reduced=false) {
  return {targetKey,from:{position:from.position.slice(),target:from.target.slice(),fov:from.fov},to:{position:to.position.slice(),target:to.target.slice(),fov:to.fov},t0:now,duration:reduced ? 0 : MOTION_MS};
}
