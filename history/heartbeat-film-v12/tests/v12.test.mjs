import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {record,sampleHeart,recordWave} from '../src/heart-records.mjs';
import {DURATION,realTime,storyTime} from '../src/timeline.mjs';
import {EVENTS,SCORE} from '../src/composition-score.mjs';
import {RETURN_RUNS,returnAt,CODE_BEATS,MAZE_BEATS,LIFE_BEATS,END_BEATS,STOP_TIME,RESONANCE_END,codePulse,codeECG,HEART_OUTLINE,HEART_CELLS,insidePolygon,MODULE_CENTRES,GLITCHES} from '../src/code-direction.mjs';

test('72 authored return cues accelerate without gaps; rendered origin arrival is checked separately',()=>{
 assert.equal(RETURN_RUNS.length,72);assert.equal(RETURN_RUNS[0].start,66);assert.ok(Math.abs(RETURN_RUNS.at(-1).end-129.6)<1e-8);
 for(let i=0;i<RETURN_RUNS.length;i++){
  const r=RETURN_RUNS[i];assert.ok(r.end>r.start);
  if(i){assert.equal(r.start,RETURN_RUNS[i-1].end);assert.ok(r.end-r.start<RETURN_RUNS[i-1].end-RETURN_RUNS[i-1].start);}
  assert.equal(returnAt(r.end+1e-8).completed,i+1);
 }
 assert.ok(RETURN_RUNS.at(-1).end-RETURN_RUNS.at(-1).start<.5);
});

test('126 heart records remain independently varied and deterministic',()=>{
 const hashes=new Set();for(let id=0;id<126;id++){const b=record(id).beats;assert.ok(new Set(b.slice(10,24).map(e=>e.rr.toFixed(4))).size>10);const a=Array.from({length:200},(_,j)=>recordWave(id,j/199,21));hashes.add(createHash('sha256').update(JSON.stringify(a)).digest('hex'));const repeat=a.reduce((s,v,j)=>s+Math.abs(v-recordWave(id,j/199,21+record(id).average)),0);assert.ok(repeat>2);assert.deepEqual(a,Array.from({length:200},(_,j)=>recordWave(id,j/199,21)));}assert.equal(hashes.size,126);
});

test('heart traces remain continuous through every generated beat',()=>{for(const id of [0,53,91,125])for(const b of record(id).beats.filter(b=>b.time>0&&b.time<DURATION))assert.ok(Math.abs(sampleHeart(id,b.time-1e-6)-sampleHeart(id,b.time+1e-6))<.002);});

test('authored time remains invertible throughout 196 seconds',()=>{assert.equal(DURATION,196);for(let t=0;t<=196;t+=.125)assert.ok(Math.abs(realTime(storyTime(t))-t)<1e-8);});

test('opening soundtrack retains the independently timed ECG beats',()=>{
 const beats=record(0).beats.filter(b=>b.time>=.4&&b.time<9),audio=EVENTS.filter(e=>e.voice==='heart'&&e.primary&&e.time<9);
 assert.deepEqual(audio.map(e=>e.time),beats.map(b=>b.time));assert.ok(new Set(audio.map(e=>e.amp.toFixed(3))).size>5);
});

test('code heart, its nine modules and final soundtrack use shared onsets',()=>{
 const sound=EVENTS.filter(e=>e.voice==='heart'&&e.primary&&e.time>=98);
 assert.deepEqual(sound.map(e=>e.time),CODE_BEATS.map(b=>b.time));
 for(const [beats,start,end] of [[MAZE_BEATS,98,131],[LIFE_BEATS,131,182],[END_BEATS,182,STOP_TIME]]){assert.ok(beats.length>10);assert.ok(beats.every(b=>b.time>=start&&b.time<end));assert.deepEqual(sound.filter(e=>e.time>=start&&e.time<end).map(e=>e.time),beats.map(b=>b.time));}
 assert.equal(new Set(CODE_BEATS.map(b=>b.time)).size,CODE_BEATS.length);
 assert.equal(MODULE_CENTRES.length,9);assert.equal(new Set(MODULE_CENTRES.map(c=>c.join(','))).size,9);
 for(const c of MODULE_CENTRES){assert.ok(c[0]>200&&c[0]<1720);assert.ok(c[1]>200&&c[1]<950);}
 assert.ok(HEART_CELLS.length>1000);for(const c of HEART_CELLS)assert.ok(insidePolygon(...c,HEART_OUTLINE));
});

test('final eleven beats slow and weaken before an exact authored stop',()=>{
 assert.ok(RESONANCE_END>STOP_TIME&&RESONANCE_END<DURATION-.035,'Musical resonance must end after the visual/heartbeat stop and before the encoded silence check');
 assert.equal(END_BEATS.length,11);const gaps=[];
 for(let i=1;i<END_BEATS.length;i++){
  const current=END_BEATS[i],previous=END_BEATS[i-1],nextGap=current.time-previous.time;
  gaps.push(nextGap);assert.ok(nextGap>.7);assert.ok(current.strength<previous.strength);assert.ok(current.freq<previous.freq);
 }
 assert.ok(gaps.slice(-3).reduce((a,b)=>a+b,0)>gaps.slice(0,3).reduce((a,b)=>a+b,0)*1.4);
 assert.ok(END_BEATS.at(-1).time<STOP_TIME);assert.ok(codePulse(END_BEATS[0].time+.07)>codePulse(END_BEATS.at(-1).time+.07)*10);
 for(let t=STOP_TIME;t<=196;t+=.001){assert.equal(codePulse(t),0);assert.equal(codeECG(t),0);}
 assert.ok(EVENTS.filter(e=>e.voice==='heart'&&e.primary).every(e=>e.time<STOP_TIME));
});

test('authored glitches are short, local shifts preceding terminal stillness',()=>{
 assert.equal(GLITCHES.length,3);for(const g of GLITCHES){assert.ok(g.end>g.start&&g.end-g.start<=.2);assert.ok(g.end<STOP_TIME);assert.ok(Math.abs(g.shift)<=20);}
});

test('only musical resonance is scheduled after the heartbeat stops',()=>{
 const after=EVENTS.filter(e=>e.time>=STOP_TIME);
 assert.equal(after.length,1);assert.equal(after[0].voice,'resonance');assert.equal(after[0].terminalTail,true);
 assert.equal(after[0].time,STOP_TIME);assert.ok(Math.abs(after[0].duration-(RESONANCE_END-STOP_TIME))<1e-8);
 assert.equal(SCORE.resonanceEnd,RESONANCE_END);
});
