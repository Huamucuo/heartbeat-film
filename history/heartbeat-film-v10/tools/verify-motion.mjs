import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {startServer} from './serve.mjs';
import {root,playwright,browserPath,browserArgs} from './runtime.mjs';
import {mazeAt} from '../src/maze-world.mjs';
import {MAZE_RUNS} from '../src/timeline.mjs';

const dir=path.join(root,'output/verification');await mkdir(dir,{recursive:true});
const server=await startServer();let browser;
const report={seedContinuity:[],subjectMotion:[],motionSheets:[],errors:[],note:'Scene-only rendering excludes shared starfield, grain and post-composited titles/subtitles; internal scene lettering remains. Quarter-second differences detect still images, but camera motion also changes pixels. Narrative motion requires visual review.'};
try{
 browser=await playwright().chromium.launch({headless:true,executablePath:browserPath(),args:browserArgs});
 const page=await browser.newPage({viewport:{width:1920,height:1080}});page.on('pageerror',e=>report.errors.push(e.message));
 const url=`http://127.0.0.1:${server.address().port}`;
 await page.goto(url+'/render.html');await page.waitForFunction(()=>window.heartbeat?.ready);
 report.subjectMotion=await page.evaluate(async()=>{
  const {firstImpulse,pair}=await import('/src/scenes.mjs'),{records}=await import('/src/archive.mjs'),{city}=await import('/src/city.mjs'),{ending}=await import('/src/afterwards.mjs'),{livedScenes}=await import('/src/lived-scenes.mjs'),{mazeScene}=await import('/src/maze-scene.mjs'),{storyTime}=await import('/src/timeline.mjs');
  const canvas=document.createElement('canvas');canvas.width=480;canvas.height=270;const c=canvas.getContext('2d',{willReadFrequently:true});
  const at=t=>{c.reset();c.scale(.25,.25);c.fillStyle='#000';c.fillRect(0,0,1920,1080);const v=storyTime(t);firstImpulse(c,v);records(c,v);city(c,v);pair(c,v);mazeScene(c,t);livedScenes(c,t);ending(c,v);return c.getImageData(0,0,480,270).data;};
  const out=[];
  for(let t=1;t<=195;t+=1){const a=at(t),b=at(t+.25);let sum=0,changed=0;for(let i=0;i<a.length;i+=4){const d=Math.max(Math.abs(a[i]-b[i]),Math.abs(a[i+1]-b[i+1]),Math.abs(a[i+2]-b[i+2]));sum+=d;if(d>2)changed++;}out.push({time:t,mean:sum/(480*270),changedFraction:changed/(480*270)});}
  return out;
 });
 for(const r of report.subjectMotion)assert(r.mean>.025&&r.changedFraction>.0003,`Held subject near ${r.time}s: ${JSON.stringify(r)}`);
 for(const t of MAZE_RUNS.flatMap(r=>[r.start,r.end])){const a=mazeAt(t-1e-5).position,b=mazeAt(t+1e-5).position,d=Math.hypot(...a.map((v,i)=>v-b[i]));assert(d<.1);report.seedContinuity.push({time:t,distance:d});}
 const pixels=async t=>page.evaluate(t=>{window.heartbeat.frame(t,30,2);return document.querySelector('#film').toDataURL('image/png').split(',')[1];},t);
 for(const [name,times] of [
  ['opening-ecg',[3,3.25,3.5,4,4.25,4.5,5,5.25,5.5]],
  ['live-ecg',[14,14.25,14.5,17,17.25,17.5,24,24.25,24.5]],
  ['maze',[67,72,78,84,90,102,110,118.5,121]],
  ['together',[134,138,143,144.5,148,156,160,164,170]],
  
  
  ['release',[173,175,177,179,181,183,187,191,195]]
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
