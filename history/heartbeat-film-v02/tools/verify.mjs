import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {createHash} from 'node:crypto';
import {createReadStream} from 'node:fs';
import {mkdir,writeFile,readFile,stat} from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {CHAPTERS} from '../src/score.mjs';
import {root,playwright,browserPath,browserArgs,ffmpegPath} from './runtime.mjs';
await import('./verify-structure.mjs');
const file=path.join(root,'output/heartbeat-v02.mp4'),dir=path.join(root,'output/verification');await mkdir(dir,{recursive:true});await stat(file);
function ff(args){return new Promise((resolve,reject)=>{const p=spawn(ffmpegPath(),['-hide_banner','-nostdin','-nostats',...args],{windowsHide:true});let out='',err='';p.stdout.on('data',b=>out+=b);p.stderr.on('data',b=>err+=b);p.on('error',reject);p.on('close',code=>code===0?resolve({out,err}):reject(new Error(`FFmpeg ${code}: ${err.slice(-5000)}`)));});}
const [video,audio]=await Promise.all([
 ff(['-i',file,'-map','0:v:0','-an','-f','framemd5','-']),
 ff(['-i',file,'-vn','-af','loudnorm=I=-15.5:TP=-1.7:LRA=9:print_format=json','-f','null','-'])
]);
const rows=video.out.split(/\r?\n/).filter(s=>s&&!s.startsWith('#')).map(s=>s.split(',').map(x=>x.trim()));
assert.equal(rows.length,2700,'Expected 2700 decoded frames');assert.match(video.out,/#tb 0: 1\/30/);assert.match(video.out,/#dimensions 0: 1920x1080/);
rows.forEach((r,i)=>{assert.equal(+r[2],i,'Video timestamp gap');assert.equal(+r[3],1);});
const unique=new Set(rows.map(r=>r.at(-1))).size;let maxRun=1,run=1;for(let i=1;i<rows.length;i++){run=rows[i].at(-1)===rows[i-1].at(-1)?run+1:1;maxRun=Math.max(maxRun,run);}assert.ok(unique>2600,'Too many duplicate frames');assert.ok(maxRun<=8,'Frozen sequence');
assert.match(video.err,/Video: h264/);assert.match(video.err,/yuv420p\(tv, bt709/);assert.match(video.err,/Audio: aac.*48000 Hz, stereo/);
const measured=JSON.parse(audio.err.match(/\{\s*"input_i"[\s\S]*?\}/)?.[0]||'null');assert.ok(measured,'Missing audio measurement');
const loudness=+measured.input_i,truePeak=+measured.input_tp;assert.ok(loudness>-17&&loudness<-14,'Unexpected loudness');assert.ok(truePeak<=-.5,'Audio peak too high');
await writeFile(path.join(dir,'decoded-frames.md5'),video.out);await writeFile(path.join(dir,'media-decode.log'),video.err+'\n'+audio.err);
const mainTimes=[3.5,12,15,18.5,24,31,41,51,55.5,57.5,59.4,62,66,73,77,84,86,89];
const frames=[...new Set([...mainTimes.map(t=>Math.round(t*30)),...CHAPTERS.slice(1).flatMap(c=>[Math.round(c.start*30)-1,Math.round(c.start*30),Math.round(c.start*30)+1])])].sort((a,b)=>a-b);
await ff(['-y','-i',file,'-an','-vf','select='+frames.map(n=>`eq(n\\,${n})`).join('+'),'-fps_mode','vfr',path.join(dir,'encoded-%02d.png')]);
const shotByFrame=new Map(frames.map((f,i)=>[f,`encoded-${String(i+1).padStart(2,'0')}.png`]));
const groups=[{name:'encoded-contact',items:mainTimes.map(t=>({time:t,frame:Math.round(t*30)}))},{name:'encoded-boundaries',items:CHAPTERS.slice(1).flatMap(c=>[-1,0,1].map(d=>({time:(Math.round(c.start*30)+d)/30,frame:Math.round(c.start*30)+d})))}];
for(const group of groups){const html='<!doctype html><meta charset="utf-8"><title>成片解码检查</title><style>body{background:#111923;color:#efe2ca;font:20px system-ui;margin:20px}main{display:grid;grid-template-columns:repeat(3,1fr);gap:18px}figure{margin:0}img{width:100%;display:block}figcaption{padding:7px}</style><h1>《心跳》第二版 · MP4 实际解码</h1><main>'+group.items.map(s=>`<figure><img src="${shotByFrame.get(s.frame)}"><figcaption>${s.time.toFixed(3)} s</figcaption></figure>`).join('')+'</main>';await writeFile(path.join(dir,group.name+'.html'),html);}
let browser;const pageErrors=[],playerChecks=[];
try{
 browser=await playwright().chromium.launch({headless:true,executablePath:browserPath(),args:browserArgs});
 const page=await browser.newPage({viewport:{width:1280,height:1050}});page.on('pageerror',e=>pageErrors.push(e.message));
 await page.goto(pathToFileURL(path.join(root,'index.html')).href);await page.waitForFunction(()=>document.querySelector('video').readyState>=1);
 const meta=await page.evaluate(()=>{const v=document.querySelector('video');v.muted=true;return {duration:v.duration,width:v.videoWidth,height:v.videoHeight};});assert.ok(Math.abs(meta.duration-90)<.1);assert.equal(meta.width,1920);assert.equal(meta.height,1080);
 for(let i=0;i<CHAPTERS.length;i++){const t=CHAPTERS[i].start;await page.locator('nav button').nth(i).click();await page.waitForFunction(t=>{const v=document.querySelector('video');return v.currentTime>=t&&v.currentTime<t+1&&v.readyState>=2;},t);await page.evaluate(()=>document.querySelector('video').pause());playerChecks.push({chapter:CHAPTERS[i].zh,seek:t,passed:true});}
 await page.locator('nav button').nth(6).click();await page.waitForFunction(()=>document.querySelector('video').currentTime>57.75);await page.evaluate(()=>{const v=document.querySelector('video');v.pause();v.currentTime=62;});await page.waitForFunction(()=>!document.querySelector('video').seeking);await page.screenshot({path:path.join(dir,'player-desktop.png'),fullPage:true});
 await page.setViewportSize({width:390,height:844});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.screenshot({path:path.join(dir,'player-mobile.png'),fullPage:true});
 for(const href of ['output/heartbeat-v02.mp4','audio/generated/heartbeat-score.mp3'])assert.ok((await stat(path.join(root,href))).size>1000);
 for(const group of groups){await page.setViewportSize({width:1800,height:1100});await page.goto(pathToFileURL(path.join(dir,group.name+'.html')).href);for(let start=0;start<group.items.length;start+=9){await page.evaluate(start=>document.querySelectorAll('figure').forEach((f,i)=>f.style.display=i>=start&&i<start+9?'':'none'),start);await page.screenshot({path:path.join(dir,`${group.name}-${start/9+1}.png`),fullPage:true});}}
 assert.deepEqual(pageErrors,[]);
 const hash=createHash('sha256');for await(const chunk of createReadStream(file))hash.update(chunk);
 const report={passed:true,file:'heartbeat-v02.mp4',bytes:(await stat(file)).size,sha256:hash.digest('hex'),width:1920,height:1080,fps:30,frames:rows.length,uniqueFrameHashes:unique,maxRepeatedFrames:maxRun,duration:meta.duration,video:'H.264 / yuv420p / limited BT.709',audio:{codec:'AAC',sampleRate:48000,channels:2,integratedLUFS:loudness,truePeakDBTP:truePeak,loudnessRangeLU:+measured.input_lra},extractedFrames:frames.length,offlineFilePlayer:true,chapterSeeks:playerChecks,pageErrors,note:'Technical validation and decoded visual samples; does not certify artistic quality or subjective listening.'};
 await writeFile(path.join(dir,'delivery.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
}finally{await browser?.close();}
