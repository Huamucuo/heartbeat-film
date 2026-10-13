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
 for(const t of [3.5,12,22,32,42,51,64,74,86]){const a=await digest(t);await digest(89-t*.6);const b=await digest(t);assert.equal(a,b,`Non-deterministic seek at ${t}`);report.determinism.push({time:t,sha256:a});}
 for(const t of [4,7.5,10,17.5,25.5,27.5,37.3,37.5,38.125,40.625,41.25,43.75,44.375,46.875,47.5,55,57.5,59.375,67.5,76.875,80,83.5]){
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
