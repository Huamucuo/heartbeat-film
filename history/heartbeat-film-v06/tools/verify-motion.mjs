import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {startServer} from './serve.mjs';
import {root,playwright,browserPath,browserArgs} from './runtime.mjs';
import {seedPoint} from '../src/afterwards.mjs';
import {loomSeed} from '../src/loom.mjs';

const dir=path.join(root,'output/verification');await mkdir(dir,{recursive:true});
const server=await startServer();let browser;
const report={seedContinuity:[],subjectMotion:[],motionSheets:[],errors:[],note:'Subject-only rendering excludes starfield, grain, titles and subtitles. Half-second differences reveal held geometry; aesthetic motion still requires visual review.'};
try{
 browser=await playwright().chromium.launch({headless:true,executablePath:browserPath(),args:browserArgs});
 const page=await browser.newPage({viewport:{width:1920,height:1080}});page.on('pageerror',e=>report.errors.push(e.message));
 const url=`http://127.0.0.1:${server.address().port}`;
 await page.goto(url+'/render.html');await page.waitForFunction(()=>window.heartbeat?.ready);
 report.subjectMotion=await page.evaluate(async()=>{
  const {firstImpulse,pair}=await import('/src/scenes.mjs'),{records}=await import('/src/archive.mjs'),{labyrinth,silence,ending}=await import('/src/afterwards.mjs'),{relations}=await import('/src/loom.mjs');
  const canvas=document.createElement('canvas');canvas.width=480;canvas.height=270;const c=canvas.getContext('2d',{willReadFrequently:true});
  const at=t=>{c.reset();c.scale(.25,.25);c.fillStyle='#000';c.fillRect(0,0,1920,1080);firstImpulse(c,t);records(c,t);pair(c,t);labyrinth(c,t);silence(c,t);relations(c,t);ending(c,t);return c.getImageData(0,0,480,270).data;};
  const out=[];
  for(let t=1;t<=89;t+=.5){const a=at(t),b=at(t+.25);let sum=0,changed=0;for(let i=0;i<a.length;i+=4){const d=Math.max(Math.abs(a[i]-b[i]),Math.abs(a[i+1]-b[i+1]),Math.abs(a[i+2]-b[i+2]));sum+=d;if(d>2)changed++;}out.push({time:t,mean:sum/(480*270),changedFraction:changed/(480*270)});}
  return out;
 });
 for(const r of report.subjectMotion)assert(r.mean>.025&&r.changedFraction>.0003,`Held subject near ${r.time}s: ${JSON.stringify(r)}`);
 for(const t of [54.5,58.8,59.375,60.7]){const a=seedPoint(t-1e-5),b=seedPoint(t+1e-5),d=Math.hypot(a[0]-b[0],a[1]-b[1]);assert(d<.1);report.seedContinuity.push({time:t,distance:d});}
 for(const t of [58.8,59,59.375]){const a=seedPoint(t),b=loomSeed(t);assert(Math.hypot(a[0]-b[0],a[1]-b[1])<1e-8);}
 const pixels=async t=>page.evaluate(t=>{window.heartbeat.frame(t,30,2);return document.querySelector('#film').toDataURL('image/png').split(',')[1];},t);
 for(const [name,times] of [
  ['live-ecg',[8,8.25,8.5,12,12.25,12.5,14,14.25,14.5]],
  ['space',[17,18.5,20,22,24,26,29,32,35]],
  ['memory',[46.5,47.5,49,51,53,55,57,59,61]],
  ['unfold',[62,62.75,63.5,64.25,65,65.75,66.5,67.25,68]],
  ['weave',[68,69,70,71,72,73,74,75,76]],
  ['release',[77,78,79,80,81,82,83,86,89]]
 ]){
  const shots=[];
  for(const t of times){const name2=`motion-${name}-${t.toFixed(2).replace('.','-')}.png`;await writeFile(path.join(dir,name2),Buffer.from(await pixels(t),'base64'));shots.push({name:name2,t});}
  await page.setViewportSize({width:1800,height:1100});
  await page.setContent('<style>body{margin:12px;background:#10131b;color:#eee;font:20px sans-serif}main{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}figure{margin:0}img{width:100%}</style><main>'+shots.map(s=>`<figure><img src="${url}/output/verification/${s.name}"><figcaption>${s.t.toFixed(2)} s</figcaption></figure>`).join('')+'</main>');
  await page.waitForFunction(()=>[...document.images].every(i=>i.complete));
  const sheet=`motion-${name}-sheet.png`;await page.screenshot({path:path.join(dir,sheet),fullPage:true});report.motionSheets.push(sheet);
  await page.goto(url+'/render.html');await page.waitForFunction(()=>window.heartbeat?.ready);
 }
 assert.deepEqual(report.errors,[]);report.passed=true;
}finally{await browser?.close();await new Promise(r=>server.close(r));}
await writeFile(path.join(dir,'motion.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({...report,subjectMotion:{samples:report.subjectMotion.length,minMean:Math.min(...report.subjectMotion.map(r=>r.mean)),minChangedFraction:Math.min(...report.subjectMotion.map(r=>r.changedFraction))}},null,2));
