import test from 'node:test';
import assert from 'node:assert/strict';
import {livingWave,lifePoint,loomPoint} from '../../src/motion.mjs';

test('ECG geometry travels during a shot and remains continuous through a beat wrap',()=>{
 const samples=t=>Array.from({length:200},(_,i)=>livingWave(i/199,t,.13));
 const a=samples(12),b=samples(12.18);
 assert.ok(a.reduce((s,v,i)=>s+Math.abs(v-b[i]),0)/a.length>.10,'the actual trace must move, not just its glow');
 for(const t of [10,12.5,57.5,74,89]){
  assert.ok(samples(t-1e-6).every((v,i)=>Math.abs(v-samples(t+1e-6)[i])<.001));
 }
 assert.deepEqual(samples(12),a,'seeking must not change the waveform');
});

test('nine lives have distinct moving geometry and every projection source stays finite',()=>{
 const signatures=[];
 for(let id=0;id<9;id++){
  const a=Array.from({length:101},(_,i)=>lifePoint(id,i/100,62));
  const b=Array.from({length:101},(_,i)=>lifePoint(id,i/100,62.25));
  assert.ok(a.flat().every(Number.isFinite));
  assert.ok(a.reduce((s,p,i)=>s+Math.hypot(...p.map((v,k)=>v-b[i][k])),0)/a.length>2);
  signatures.push(JSON.stringify(a));
 }
 assert.equal(new Set(signatures).size,9);
 for(let t=57;t<=89;t+=.5)for(let id=0;id<9;id++)for(const u of [0,.1,.5,.9,1]){
  const p=loomPoint(id,u,6,t);assert.ok(p.every(v=>Number.isFinite(v)&&Math.abs(v)<12000));
 }
});

test('the same point persists across unfolding, joining and release boundaries',()=>{
 for(const t of [59.375,62.5,65,67.5,70,73,76.875,80,83])for(let id=0;id<9;id++){
  const a=loomPoint(id,.37,4,t-1e-5),b=loomPoint(id,.37,4,t+1e-5);
  assert.ok(Math.hypot(...a.map((v,k)=>v-b[k]))<.15,`jump at ${t}, strand ${id}`);
 }
});
