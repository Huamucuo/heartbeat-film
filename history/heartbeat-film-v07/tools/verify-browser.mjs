import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {startServer} from './serve.mjs';
import {root,playwright,browserPath,browserArgs} from './runtime.mjs';
const server=await startServer();let browser;
const report={errors:[],determinism:[],boundaries:[],notes:['Continuity metrics do not replace viewing the moving shots.']};
try{
 browser=await playwright().chromium.launch({headless:true,executablePath:browserPath(),args:browserArgs});
 const page=await browser.newPage({viewport:{width:1920,height:1080}});page.on('pageerror',e=>report.errors.push(e.message));page.on('console',m=>{if(m.type()==='error')report.errors.push(m.text());});
 await page.goto(`http://127.0.0.1:${server.address().port}/render.html`);await page.waitForFunction(()=>window.heartbeat?.ready);
 const digest=async t=>createHash('sha256').update(await page.evaluate(t=>{window.heartbeat.frame(t,30,2);return document.querySelector('#film').toDataURL();},t)).digest('hex');
 for(const t of [3.5,12,22,32,42,51,60.5,64,66,71,74,78,86,88.25]){const a=await digest(t);await digest(89-t*.6);const b=await digest(t);assert.equal(a,b,`Non-deterministic seek at ${t}`);report.determinism.push({time:t,sha256:a});}
 for(const t of [4,5,7.5,9,10,12.5,13.125,16,17.5,17.8,19.5,21,23,25,26,27.5,29.2,30.2,37.3,37.5,38.125,40.625,41.25,43.75,44.375,46.875,47.2,47.5,48,54.5,57.5,58.8,59.125,59.375,60.7,63.75,63.8,65,65.3,65.5,67.5,68.1,68.75,71.25,71.3,71.8,73,75.4,75.8,76.1,76.2,76.875,77.5,80,80.4,80.5,83.5,85.7,86]){
  const value=await page.evaluate(t=>{
   const canvas=document.createElement('canvas');canvas.width=320;canvas.height=180;const c=canvas.getContext('2d');
   const at=q=>{window.heartbeat.render(q);c.drawImage(document.querySelector('#film'),0,0,320,180);return c.getImageData(0,0,320,180).data;};
   const compare=delta=>{const a=at(t-delta),b=at(t+delta);let sum=0,max=0;for(let i=0;i<a.length;i++){if(i%4===3)continue;const d=Math.abs(a[i]-b[i]);sum+=d;max=Math.max(max,d);}return {mean:sum/(320*180*3),max};};
   return {infinitesimal:compare(.00001),frameStep:compare(1/60)};
  },t);assert(value.infinitesimal.mean<.3,`Discontinuity at ${t}: ${value.infinitesimal.mean}`);report.boundaries.push({time:t,...value});
 }
 assert.deepEqual(report.errors,[]);report.info=await page.evaluate(()=>window.heartbeat.info());report.passed=true;
}finally{await browser?.close();await new Promise(r=>server.close(r));}
await mkdir(path.join(root,'output/verification'),{recursive:true});await writeFile(path.join(root,'output/verification/browser.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
