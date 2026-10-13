// Repair a review contact's final-frame index without repeating already passed
// full-video decoding. The MP4 hashes must still match that completed check.
import assert from 'node:assert/strict';
import {readFile,writeFile,stat} from 'node:fs/promises';
import {createReadStream} from 'node:fs';
import {createHash} from 'node:crypto';
import {spawn} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import path from 'node:path';
import {root,ffmpegPath,playwright,browserPath,browserArgs} from './runtime.mjs';
import {DURATION,CHAPTERS} from '../src/timeline.mjs';
import {RETURN_RUNS,STOP_TIME,GLITCHES} from '../src/code-direction.mjs';
const dir=path.join(root,'output/verification'),report=JSON.parse(await readFile(path.join(dir,'delivery.json'),'utf8'));
assert.equal(report.passed,true);
for(const video of report.videos){const h=createHash('sha256');for await(const b of createReadStream(path.join(root,'output',video.file)))h.update(b);assert.equal(h.digest('hex'),video.sha256);}
const mainTimes=[2,5,8,14,23,28,37,44,54,59,61.5,63,66,70,76,82,90,98,104,110,116,118.5,120.5,124,129,RETURN_RUNS.at(-1).end,131,133,134.6,136,140,144,148,152,156,160,164,168,171,173.5,175,177,178.5,180,181.5,182,183.5,185,187,189,191,192.8,192.866667,193.3,194.1,194.466667,194.5,195,195.966667];
const mainShots=mainTimes.map(t=>{const frame=Math.min(DURATION*30-1,Math.ceil(t*30));return {requestedTime:t,time:frame/30,frame};});
const boundaryTimes=[...new Set([...CHAPTERS.slice(1).map(c=>c.start),61.5,66,131,134.6,173,182,STOP_TIME,...GLITCHES.flatMap(g=>[g.start,g.end])])].sort((a,b)=>a-b);
const frames=[...new Set([...mainShots.map(s=>s.frame),...boundaryTimes.flatMap(t=>[Math.round(t*30)-1,Math.round(t*30),Math.round(t*30)+1])])].sort((a,b)=>a-b);
assert.equal(frames.at(-1),DURATION*30-1);
const lastName=`encoded-${String(frames.length).padStart(2,'0')}.png`,lastPath=path.join(dir,lastName);
// Seek to frame 5874 of the already timestamp-verified 30fps file; select the
// sixth and final frame. Output frame 5879 is at 195.9666667, never 196.000.
const args=['-hide_banner','-nostdin','-y','-ss',String(DURATION-.2),'-i',path.join(root,'output/heartbeat-v12-4k.mp4'),'-an','-vf','select=eq(n\\,5),showinfo','-frames:v','1',lastPath];
const p=spawn(ffmpegPath(),args,{windowsHide:true});let log='';p.stderr.on('data',b=>log+=b);await new Promise((resolve,reject)=>{p.on('error',reject);p.on('close',c=>c===0?resolve():reject(Error(log)));});
assert.ok((await stat(lastPath)).size>1000);
for(let i=0;i<frames.length;i++)assert.ok((await stat(path.join(dir,`encoded-${String(i+1).padStart(2,'0')}.png`))).size>1000);
const shotByFrame=new Map(frames.map((f,i)=>[f,`encoded-${String(i+1).padStart(2,'0')}.png`]));
const groups=[{name:'encoded-contact',items:mainShots},{name:'encoded-boundaries',items:boundaryTimes.flatMap(t=>[-1,0,1].map(d=>({time:(Math.round(t*30)+d)/30,frame:Math.round(t*30)+d})))}];
let browser;
try{
 browser=await playwright().chromium.launch({headless:true,executablePath:browserPath(),args:browserArgs});const page=await browser.newPage({viewport:{width:1800,height:1100}});
 for(const group of groups){const html='<!doctype html><meta charset="utf-8"><title>成片解码检查</title><style>body{background:#111923;color:#efe2ca;font:20px system-ui;margin:20px}main{display:grid;grid-template-columns:repeat(3,1fr);gap:18px}figure{margin:0}img{width:100%;display:block}figcaption{padding:7px}</style><h1>《心跳 · 活着的意义》4K MP4 实际解码</h1><main>'+group.items.map(s=>`<figure><img src="${shotByFrame.get(s.frame)}"><figcaption>${s.time.toFixed(3)} s</figcaption></figure>`).join('')+'</main>';await writeFile(path.join(dir,group.name+'.html'),html);await page.goto(pathToFileURL(path.join(dir,group.name+'.html')).href);await page.waitForFunction(()=>[...document.images].every(i=>i.complete&&i.naturalWidth>0));for(let start=0;start<group.items.length;start+=9){await page.evaluate(start=>document.querySelectorAll('figure').forEach((f,i)=>f.style.display=i>=start&&i<start+9?'':'none'),start);await page.screenshot({path:path.join(dir,`${group.name}-${start/9+1}.png`),fullPage:true});}}
}finally{await browser?.close();}
report.extractedNative4KFrames=frames.length;report.reviewFrameIndexRepair={lastFrame:frames.at(-1),lastTime:frames.at(-1)/30,allReviewImagesPresent:true,videoHashesUnchanged:true};
await writeFile(path.join(dir,'delivery.json'),JSON.stringify(report,null,2));await writeFile(path.join(dir,'review-last-frame.log'),log);
console.log(JSON.stringify({passed:true,images:frames.length,lastFrame:frames.at(-1),lastTime:frames.at(-1)/30}));
