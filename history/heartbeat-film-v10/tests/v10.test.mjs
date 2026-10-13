import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {record,sampleHeart,recordWave} from '../src/heart-records.mjs';
import {ROUTES,WALLS,hasPassage,mazeAt,ORIGIN_CELL,ORIGIN_PILLARS,routePoint} from '../src/maze-world.mjs';
import {LIFE_SHOTS} from '../src/life-direction.mjs';
import {DURATION,MAZE_RUNS,realTime,storyTime} from '../src/timeline.mjs';
import {EVENTS,TEMPO_SECTIONS} from '../src/composition-score.mjs';
import {lifeModel,modelPhase,LIFE_NAMES} from '../src/life-models.mjs';
import {miniatureTime} from '../src/montage-direction.mjs';
import {localLifeModel} from '../src/life-models.mjs';
import {miniatureTransform,lifeCamera,phoneModel} from '../src/lived-scenes.mjs';
import {project} from '../src/drawing.mjs';
test('126 heart records are individually seeded, vary beat intervals and never tile one shared waveform',()=>{
 const hashes=new Set();for(let id=0;id<126;id++){const b=record(id).beats;assert.ok(new Set(b.slice(10,24).map(e=>e.rr.toFixed(4))).size>10);const a=Array.from({length:200},(_,j)=>recordWave(id,j/199,21));hashes.add(createHash('sha256').update(JSON.stringify(a)).digest('hex'));const repeat=a.reduce((s,v,j)=>s+Math.abs(v-recordWave(id,j/199,21+record(id).average)),0);assert.ok(repeat>2);assert.deepEqual(a,Array.from({length:200},(_,j)=>recordWave(id,j/199,21)));}assert.equal(hashes.size,126);
});
test('heart traces remain continuous through every generated beat',()=>{for(const id of [0,53,91,125])for(const b of record(id).beats.filter(b=>b.time>0&&b.time<DURATION)){assert.ok(Math.abs(sampleHeart(id,b.time-1e-6)-sampleHeart(id,b.time+1e-6))<.002);}});
test('all three maze journeys pass only through open passages and physically reach the same origin',()=>{
 assert.ok(WALLS.length>600);assert.equal(new Set(ROUTES.map(r=>r.join(','))).size,3);
 for(let i=0;i<3;i++){const route=ROUTES[i];assert.equal(route[0],ORIGIN_CELL);assert.equal(route.at(-1),ORIGIN_CELL);for(let j=1;j<route.length;j++)assert.ok(hasPassage(route[j-1],route[j]));assert.deepEqual(mazeAt(MAZE_RUNS[i].end).position,[0,0,0]);assert.equal(mazeAt(MAZE_RUNS[i].end).completed,i+1);}
});
test('long film time is invertible and maze journeys have meaningful screen time',()=>{assert.equal(DURATION,196);for(let t=0;t<=196;t+=.125)assert.ok(Math.abs(realTime(storyTime(t))-t)<1e-8);for(const run of MAZE_RUNS)assert.ok(run.end-run.start>=14);});
test('opening audio uses the exact non-repeating ECG beat times and changing intensity',()=>{
 const beats=record(0).beats.filter(b=>b.time>=.4&&b.time<9),audio=EVENTS.filter(e=>e.voice==='heart'&&e.primary&&e.time<9);
 assert.deepEqual(audio.map(e=>e.time),beats.map(b=>b.time));assert.ok(new Set(audio.map(e=>e.amp.toFixed(3))).size>5);
 assert.deepEqual(TEMPO_SECTIONS.slice(1,4).map(s=>s.bpm),[96,112,132]);for(const run of MAZE_RUNS)assert.ok(EVENTS.some(e=>e.voice==='impact'&&e.time===run.end));
});
test('each concrete life has early, middle and late states readable for at least one second',()=>{
 for(let id=0;id<9;id++){
  const seen={early:0,middle:0,late:0};
  for(let t=134;t<172;t+=.25){
   const {p,q}=modelPhase(id,miniatureTime(id,t)),phase=p<.04&&q<.01?'early':p>.98&&q<.04?'middle':q>.98?'late':null;if(!phase||seen[phase]>=1)continue;
   const model=id===0?phoneModel(t):localLifeModel(id,miniatureTime(id,t)).transform(p=>miniatureTransform(id,p,t)),points=model.faces.filter(f=>f.alpha>.45&&f.group>=0).flatMap(f=>f.points.map(p=>project(p,lifeCamera(t))));
   assert.ok(points.flat().every(Number.isFinite));const visible=points.filter(([x,y])=>x>12&&x<1908&&y>14&&y<950).length/points.length;
   if(visible>.96)seen[phase]+=.25;
  }
  for(const [phase,seconds] of Object.entries(seen))assert.ok(seconds>=1,`${LIFE_NAMES[id]} ${phase} visible for only ${seconds}s`);
 }
});

test('origin architecture leaves room for every traveller path',()=>{for(let i=0;i<3;i++)for(let j=0;j<ROUTES[i].length*20;j++){const [x,,z]=routePoint(i,j/(ROUTES[i].length*20-1)).position;for(const [px,pz] of ORIGIN_PILLARS)assert.ok(Math.abs(x-px)>16||Math.abs(z-pz)>16);}});
test('both rhythms are present and ending sound follows the same ECG record',()=>{for(const id of [0,1])assert.ok(EVENTS.filter(e=>e.voice==='heart'&&e.source===id&&e.time>=47&&e.time<63).length>15);const ending=EVENTS.filter(e=>e.primary&&e.source===0&&e.time>=182);assert.deepEqual(ending.map(e=>e.time),record(0).beats.filter(e=>e.time>=182&&e.time<194).map(e=>e.time));});
