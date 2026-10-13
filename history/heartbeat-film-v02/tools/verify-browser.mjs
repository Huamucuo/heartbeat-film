import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {startServer} from './serve.mjs';
import {root,playwright,browserPath,browserArgs} from './runtime.mjs';
const server=await startServer(),errors=[];let browser;
try{
 browser=await playwright().chromium.launch({headless:true,executablePath:browserPath(),args:browserArgs});
 const page=await browser.newPage({viewport:{width:1920,height:1080}});page.on('pageerror',e=>errors.push(e.message));
 await page.goto(`http://127.0.0.1:${server.address().port}/render.html`);await page.waitForFunction(()=>window.heartbeat?.ready);await page.evaluate(()=>document.fonts.ready);
 const frame=async t=>createHash('sha256').update(await page.evaluate(t=>{window.heartbeat.frame(t,30,2);return document.querySelector('canvas').toDataURL();},t)).digest('hex');
 const checks=[];
 for(const t of [0,12,18.5,31,57.5,62,73,86,89.9666666667]){const a=await frame(t);await frame(40.125);const b=await frame(t);assert.equal(a,b,`Seek-order dependence at ${t}`);checks.push({time:t,sha256:a,repeatIdentical:true});}
 const dimensions=await page.evaluate(()=>({width:document.querySelector('canvas').width,height:document.querySelector('canvas').height,events:window.heartbeat.events.length}));assert.equal(dimensions.width,1920);assert.equal(dimensions.height,1080);assert.deepEqual(errors,[]);
 const report={passed:true,dimensions,deterministicSeek:checks,pageErrors:errors};await mkdir(path.join(root,'output/verification'),{recursive:true});await writeFile(path.join(root,'output/verification/browser-render.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
}finally{await browser?.close();await new Promise(r=>server.close(r));}
