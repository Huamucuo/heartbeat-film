import test from 'node:test';
import assert from 'node:assert/strict';
import {SCENES,lifeGeometry,lifeVertex,lifePhase} from '../../src/vignettes.mjs';
import {loomCamera} from '../../src/loom.mjs';
import {project,ramp} from '../../src/drawing.mjs';
import {NODE_TIMES} from '../../src/score.mjs';

test('every lived scene changes its geometry between early and late life and is seek deterministic',()=>{
 assert.equal(SCENES.length,9);
 const signatures=[];
 for(let id=0;id<9;id++){
  const early=lifeGeometry(id,63),late=lifeGeometry(id,75);
  assert(early.length>12&&late.length>12);
  assert.notEqual(JSON.stringify(early),JSON.stringify(late));
  assert.deepEqual(lifeGeometry(id,63),early);
  signatures.push(JSON.stringify(early));
  for(const t of [61,65,68,71,75]){
   const g=lifeGeometry(id,t);assert(g.some(s=>s.alpha>.2));
   for(const s of g){assert(s.points.length>=2);assert(Number.isFinite(s.alpha));assert(s.points.flat().every(Number.isFinite));}
  }
 }
 assert.equal(new Set(signatures).size,9);
});

test('each life has a legible early, middle and late state within the actual camera frame',()=>{
 for(let id=0;id<9;id++){
  const witnessed=new Set();
  for(let t=59;t<=79.75;t+=.125){
   if(ramp(NODE_TIMES[id]-.45,NODE_TIMES[id]+1,t)<.98)continue;
   const {p,q}=lifePhase(id,t),phase=p<.1&&q<.01?'early':p>.98&&q<.1?'middle':q>.95?'late':null;
   if(!phase||witnessed.has(phase))continue;
   const g=lifeGeometry(id,t),points=[];
   for(let k=0;k<g.length;k++)if(g[k].alpha>.25)for(const u of [0,.25,.5,.75,1])points.push(project(lifeVertex(id,g[k],k,g.length,u,t),loomCamera(t)));
   const visible=points.filter(([x,y])=>x>=15&&x<=1905&&y>=12&&y<=965).length/points.length;
   if(visible>.90)witnessed.add(phase);
  }
  assert.deepEqual([...witnessed].sort(),['early','late','middle'],SCENES[id].name+' loses a life stage outside the camera');
 }
});

test('recognizable contours continue into the final shared space without coordinate jumps',()=>{
 for(let t=58;t<=86;t+=.5)for(let id=0;id<9;id++){
  const g=lifeGeometry(id,t);
  for(const k of [0,Math.floor(g.length/2),g.length-1])for(const u of [0,.25,.5,.75,1]){
   const p=lifeVertex(id,g[k],k,g.length,u,t);
   assert(p.every(v=>Number.isFinite(v)&&Math.abs(v)<16000));
  }
 }
 for(const t of [64.5,68,70.2,74,76.2,80,82,85])for(let id=0;id<9;id++){
  const a=lifeGeometry(id,t-1e-5),b=lifeGeometry(id,t+1e-5);
  assert.equal(a.length,b.length,'stroke identity is stable across transitions');
  for(let k=0;k<a.length;k+=5){
   const A=lifeVertex(id,a[k],k,a.length,.37,t-1e-5),B=lifeVertex(id,b[k],k,b.length,.37,t+1e-5);
   assert(Math.hypot(...A.map((v,i)=>v-B[i]))<.2,`jump in ${id}/${k} at ${t}`);
  }
 }
});
