import assert from 'node:assert/strict';
import {writeFile,mkdir} from 'node:fs/promises';
import path from 'node:path';
import {CHAPTERS,EVENTS,NODE_TIMES,CONNECTIONS,DURATION} from '../src/score.mjs';
import {HeartbeatFilm,stateAt} from '../src/film.mjs';
import {root} from './runtime.mjs';
assert.equal(CHAPTERS[0].start,0);assert.equal(CHAPTERS.at(-1).end,DURATION);
CHAPTERS.slice(1).forEach((ch,i)=>assert.equal(ch.start,CHAPTERS[i].end));
assert.equal(new Set(EVENTS.map(e=>e.id)).size,EVENTS.length);
for(const e of EVENTS)assert.ok(Number.isFinite(e.time)&&e.time>=0&&e.time<DURATION&&e.duration>0);
for(const link of CONNECTIONS)assert.ok(link.time>Math.max(NODE_TIMES[link.from],NODE_TIMES[link.to]),'Connection before endpoints exist');
assert.equal(Math.min(...CONNECTIONS.map(e=>e.time)),67.5);
assert.ok(Math.max(...CONNECTIONS.map(e=>e.time))>=76,'Chorus relationships should keep developing');
for(let k=0;k<9;k++)assert.equal(EVENTS.find(e=>e.voice==='bloom'&&e.node===k).time,NODE_TIMES[k]);
const film=HeartbeatFilm.prototype;
function point(i,u,t){const st=stateAt(t);return film.project(film.world(i,u,st),st);}
const handoffs=[];
for(const ch of CHAPTERS.slice(1)){
 let maximum=0,alphaJump=0,colorJump=0;
 for(let i=0;i<96;i+=3)for(let j=0;j<=32;j++){const a=point(i,j/32,ch.start-1e-6),b=point(i,j/32,ch.start+1e-6);maximum=Math.max(maximum,Math.hypot(...a.map((v,k)=>v-b[k])));}
 const a=stateAt(ch.start-1e-6).cam,b=stateAt(ch.start+1e-6).cam,camJump=Math.max(...a.map((v,k)=>Math.abs(v-b[k])));
 for(let i=0;i<96;i++){
  const sa=stateAt(ch.start-1e-6),sb=stateAt(ch.start+1e-6);
  const aa=film.strandStyle(i,sa,point(i,.5,sa.t)[2]),bb=film.strandStyle(i,sb,point(i,.5,sb.t)[2]);
  alphaJump=Math.max(alphaJump,Math.abs(aa.alpha-bb.alpha));colorJump=Math.max(colorJump,...aa.col.map((c,k)=>Math.abs(c-bb.col[k])));
 }
 assert.ok(maximum<.01,`Projected discontinuity at ${ch.start}: ${maximum}`);assert.ok(camJump<.01,`Camera discontinuity at ${ch.start}`);
 if(ch.start!==57.5)assert.ok(alphaJump<.001,`Strand brightness discontinuity at ${ch.start}: ${alphaJump}`);
 assert.ok(colorJump<.001,`Strand color discontinuity at ${ch.start}: ${colorJump}`);
 handoffs.push({time:ch.start,maximumProjectedJump:maximum,cameraJump:camJump,alphaJump,colorJump,eventException:ch.start===57.5?'Intentional arrival attack':null});
}
const report={passed:true,chapters:CHAPTERS.length,events:EVENTS.length,nodes:NODE_TIMES.length,connections:CONNECTIONS.length,handoffs,note:'Structural checks do not establish artistic quality.'};
await mkdir(path.join(root,'output/verification'),{recursive:true});await writeFile(path.join(root,'output/verification/structure.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
