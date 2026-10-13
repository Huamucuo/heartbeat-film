import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {startServer} from './serve.mjs';
import {root,playwright,browserPath,browserArgs} from './runtime.mjs';
import {CONFLUENCE_STARTS} from '../src/heart-confluence.mjs';
const server=await startServer();let browser;
const report={errors:[],determinism:[],boundaries:[],notes:['Continuity metrics do not replace viewing the moving shots.']};
try{
 browser=await playwright().chromium.launch({headless:true,executablePath:browserPath(),args:browserArgs});
 const page=await browser.newPage({viewport:{width:1920,height:1080}});page.on('pageerror',e=>report.errors.push(e.message));page.on('console',m=>{if(m.type()==='error')report.errors.push(m.text());});
 await page.goto(`http://127.0.0.1:${server.address().port}/render.html`);await page.waitForFunction(()=>window.heartbeat?.ready);
 const digest=async t=>createHash('sha256').update(await page.evaluate(t=>{window.heartbeat.frame(t,30,2);return document.querySelector('#film').toDataURL();},t)).digest('hex');
 for(const t of [3.5,5.2,14,24,35,54,68,82,95,110,118.5,127,132,136,141,143,144.5,147,148,151,156,158,160,161.5,164,168,171,175,179,182,186,191,195]){const a=await digest(t);await digest(195-t*.6);const b=await digest(t);assert.equal(a,b,`Non-deterministic seek at ${t}`);report.determinism.push({time:t,sha256:a});}
 for(const t of [2,4,7.56,9,10,14,14.625,23,29,33,39,43,47,55,61.5,63,66,74,82,83,85,100,102,104,107,114,118.5,119,121,122,125,130.5,131,132,134,136,137.5,139,140,141,142,143,144,144.5,145,146,147,148,150,152,153,154,155,156,157,158,159,160,161,162,163,164,166,168,170,172,173,176,179,181,182,183,185,188,191,194,195.5,...CONFLUENCE_STARTS.flatMap(t=>[t,t+3.1,t+4.7])]){
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
