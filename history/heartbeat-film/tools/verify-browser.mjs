import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {startServer} from './serve.mjs';
import {playwright,browserPath,browserArgs,root} from './runtime.mjs';

const server=await startServer();let browser;
const qa=path.join(root,'output/verification');await mkdir(qa,{recursive:true});
const report={};
try{
  browser=await playwright().chromium.launch({headless:true,executablePath:browserPath(),args:browserArgs});
  const page=await browser.newPage({viewport:{width:1920,height:1080}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(`http://127.0.0.1:${server.address().port}/render.html`);await page.waitForFunction(()=>window.heartbeat?.ready);
  const capture=async(t)=>{
    const data=await page.evaluate(t=>{window.heartbeat.seek(t);return document.querySelector('#film').toDataURL();},t);
    return createHash('sha256').update(data).digest('hex');
  };
  report.seekHashes=[];
  for(const t of [17.5,20,22.4666667,55,57.5,59,64.9666667]){
    const a=await capture(t);await capture(t>35?19:63);const b=await capture(t);assert.equal(a,b,`non-deterministic seek at ${t}`);report.seekHashes.push({time:t,sha256:a});
  }
  const before=await page.evaluate(()=>window.heartbeat.seek(57.5-1e-6));const at=await page.evaluate(()=>window.heartbeat.seek(57.5));
  report.arrivalOriginDiscontinuityPixels=Math.hypot(before.origin[0]-at.origin[0],before.origin[1]-at.origin[1]);assert.ok(report.arrivalOriginDiscontinuityPixels<1);
  await page.setViewportSize({width:1440,height:1100});
  await page.goto(pathToFileURL(path.join(root,'index.html')).href);
  await page.waitForFunction(()=>document.querySelector('video').readyState>=1);
  report.offlinePlayer=[];
  for(const [index,duration] of [[0,5],[1,10]]){
    await page.locator(`[data-clip="${index}"]`).click();
    await page.waitForFunction(d=>Math.abs(document.querySelector('video').duration-d)<.04,duration);
    const info=await page.evaluate(async()=>{const v=document.querySelector('video');await v.play();return {duration:v.duration,width:v.videoWidth,height:v.videoHeight};});
    await page.waitForFunction(()=>document.querySelector('video').currentTime>.15);
    await page.evaluate(()=>document.querySelector('video').pause());
    assert.equal(await page.evaluate(()=>document.querySelector('video').paused),true);
    await page.evaluate(d=>new Promise(r=>{const v=document.querySelector('video');v.addEventListener('seeked',r,{once:true});v.currentTime=d/2;}),duration);
    const sought=await page.evaluate(()=>document.querySelector('video').currentTime);assert.ok(Math.abs(sought-duration/2)<.04);
    await page.screenshot({path:path.join(qa,`player-${index+1}.png`),fullPage:true});
    await page.evaluate(d=>new Promise(r=>{const v=document.querySelector('video');v.addEventListener('seeked',r,{once:true});v.currentTime=d-.2;}),duration);
    await page.evaluate(()=>document.querySelector('video').play());await page.waitForFunction(()=>document.querySelector('video').ended);
    report.offlinePlayer.push({...info,seek:sought,playPauseSeekEnd:true});
  }
  await page.setViewportSize({width:390,height:844});await page.screenshot({path:path.join(qa,'player-mobile.png'),fullPage:true});
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);assert.equal(overflow,false);
  assert.deepEqual(errors,[]);report.pageErrors=errors;report.mobileOverflow=overflow;report.passed=true;
  await writeFile(path.join(qa,'browser-report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
}finally{await browser?.close();await new Promise(r=>server.close(r));}
