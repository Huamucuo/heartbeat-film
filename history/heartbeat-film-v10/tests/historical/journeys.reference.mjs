import test from 'node:test';
import assert from 'node:assert/strict';
import {journeyAt,routeSlice} from '../../src/journeys.mjs';

const origin=[960,515],arrivals=[40.625,43.75,46.875],starts=[38.125,41.25,44.375];
const distance=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
test('Each irregular walk returns to the same origin before its counter increments',()=>{
 for(let i=0;i<3;i++){
  assert.equal(journeyAt(starts[i]).completed,i);
  assert(distance(journeyAt(starts[i]).position,origin)<1e-9);
  assert.equal(journeyAt(arrivals[i]-.01).completed,i);
  assert(distance(journeyAt(arrivals[i]).position,origin)<1e-9);
  assert.equal(journeyAt(arrivals[i]).completed,i+1);
  assert.equal(journeyAt(arrivals[i]+.3).moving,false);
 }
});
test('The three walks are visibly different and turn across both axes',()=>{
 const walks=starts.map(start=>Array.from({length:26},(_,i)=>journeyAt(start+i*.1).position));
 for(let a=0;a<3;a++){
  const xs=walks[a].map(p=>p[0]),ys=walks[a].map(p=>p[1]);
  assert(Math.max(...xs)-Math.min(...xs)>800);
  assert(Math.max(...ys)-Math.min(...ys)>350);
  for(let b=a+1;b<3;b++)assert(walks[a].reduce((s,p,i)=>s+distance(p,walks[b][i]),0)/26>200);
  const trace=routeSlice(a,1);assert(distance(trace[0],origin)<1e-9);assert(distance(trace.at(-1),origin)<1e-9);
 }
});
test('Absolute-time seeking is finite, bounded and continuous at departures and arrivals',()=>{
 for(let t=37;t<58;t+=.007){const p=journeyAt(t).position;assert(p.every(Number.isFinite));assert(p[0]>200&&p[0]<1750&&p[1]>140&&p[1]<870);}
 for(const t of [...starts,...arrivals])assert(distance(journeyAt(t-1e-5).position,journeyAt(t+1e-5).position)<.1);
 const a=journeyAt(42.7);journeyAt(89);assert.deepEqual(journeyAt(42.7),a);
});
