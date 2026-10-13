import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {CHAPTERS,EVENTS,NODE_TIMES,CONNECTIONS} from '../src/score.mjs';
import {node} from '../src/forms.mjs';
import {startServer} from './serve.mjs';
import {root,playwright,browserPath,browserArgs} from './runtime.mjs';
assert.equal(CHAPTERS[0].start,0);assert.equal(CHAPTERS.at(-1).end,90);
CHAPTERS.slice(1).forEach((ch,i)=>assert.equal(ch.start,CHAPTERS[i].end));
assert.equal(new Set(EVENTS.map(e=>e.id)).size,EVENTS.length);
for(const e of EVENTS)assert.ok(e.time>=0&&e.time<90&&e.duration>0);
for(const e of CONNECTIONS){assert.ok(e.time>Math.max(NODE_TIMES[e.from],NODE_TIMES[e.to]));assert.ok(e.loss>e.time+.625);}
const server=await startServer(),errors=[];let browser;
try{
 browser=await playwright().chromium.launch({headless:true,executablePath:browserPath(),args:browserArgs});
 const page=await browser.newPage({viewport:{width:1920,height:1080}});page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.goto(`http://127.0.0.1:${server.address().port}/render.html`);await page.waitForFunction(()=>window.heartbeat?.ready);await page.evaluate(()=>document.fonts.ready);
 const frame=async t=>createHash('sha256').update(await page.evaluate(t=>{window.heartbeat.frame(t,30,2);return document.querySelector('#film').toDataURL();},t)).digest('hex');
 const trailChanges=[];for(const t of [54,58]){const [a,b]=await page.evaluate(t=>[window.heartbeat.inspect(t-1e-6).trailOpacity,window.heartbeat.inspect(t+1e-6).trailOpacity],t);assert.ok(Math.abs(a-b)<.001,`Tail pops at ${t}: ${a} -> ${b}`);trailChanges.push({time:t,opacityJump:Math.abs(a-b)});}
 const deterministic=[];for(const t of [0,12,24,31,51,62,73,78.5,86]){const a=await frame(t);await frame(40.125);const b=await frame(t);assert.equal(a,b,`Seek-order dependence at ${t}`);deterministic.push({time:t,sha256:a,repeatIdentical:true});}
 const handoffs=[];
 for(const ch of CHAPTERS.slice(1)){const [a,b]=await page.evaluate(t=>[window.heartbeat.inspect(t-1e-6),window.heartbeat.inspect(t+1e-6)],ch.start);let max=0;for(let i=0;i<a.points.length;i++){for(const v of [...a.points[i],...b.points[i]])assert.ok(Number.isFinite(v));max=Math.max(max,Math.hypot(a.points[i][0]-b.points[i][0],a.points[i][1]-b.points[i][1]));}const cam=Math.max(...a.camera.map((v,i)=>Math.abs(v-b.camera[i])));assert.ok(max<.01,`Position discontinuity ${ch.start}: ${max}`);assert.ok(cam<.001);handoffs.push({time:ch.start,maxPixelJump:max,cameraJump:cam});}
 const network=await page.evaluate(()=>window.heartbeat.inspect(74));network.nodes.forEach((n,k)=>node(k,0).forEach((v,j)=>assert.ok(Math.abs(v-n.position[j])<1e-6,'Link endpoint drift')));
 const empty=await page.evaluate(()=>window.heartbeat.inspect(80));assert.ok(empty.links.every(l=>!l.visible),'The unresolved ending must release all links');
 const before=await page.evaluate(()=>window.heartbeat.inspect(59.374));assert.ok(before.nodes.every(n=>n.scale===0),'Nodes should follow their musical onsets');
 const info=await page.evaluate(()=>window.heartbeat.info());assert.equal(info.width,1920);assert.deepEqual(errors,[]);
 const report={passed:true,theme:'活着的意义',events:EVENTS.length,chapters:9,deterministic,handoffs,connectionsAnchored:true,connectionsReleased:true,info,pageErrors:errors};await mkdir(path.join(root,'output/verification'),{recursive:true});await writeFile(path.join(root,'output/verification/browser-render.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
}finally{await browser?.close();await new Promise(r=>server.close(r));}
