import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {createHash} from 'node:crypto';
import {createReadStream} from 'node:fs';
import {mkdir,writeFile,readFile,stat} from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {CHAPTERS} from '../src/score.mjs';
import {root,playwright,browserPath,browserArgs,ffmpegPath} from './runtime.mjs';
const dir=path.join(root,'output/verification');await mkdir(dir,{recursive:true});
assert.equal(JSON.parse(await readFile(path.join(dir,'browser.json'),'utf8')).passed,true);
const renderReport=JSON.parse(await readFile(path.join(root,'output/heartbeat-v04-4k-render.json'),'utf8'));
assert.equal(renderReport.frames,2700);assert.equal(renderReport.width,3840);assert.equal(renderReport.samples,2);assert.deepEqual(renderReport.errors,[]);
for(const [name,sha] of Object.entries(renderReport.sourceHashes))assert.equal(await digest(path.join(root,name)),sha,`Source changed after render: ${name}`);
function ff(args){return new Promise((resolve,reject)=>{const p=spawn(ffmpegPath(),['-hide_banner','-nostdin','-nostats','-xerror',...args],{windowsHide:true});let out='',err='';p.stdout.on('data',b=>out+=b);p.stderr.on('data',b=>err+=b);p.on('error',reject);p.on('close',code=>code===0?resolve({out,err}):reject(new Error(`FFmpeg ${code}: ${err.slice(-5000)}`)));});}
async function digest(p){const h=createHash('sha256');for await(const b of createReadStream(p))h.update(b);return h.digest('hex');}
const videos=[];
for(const [name,width,height] of [['heartbeat-v04-4k.mp4',3840,2160],['heartbeat-v04-1080p.mp4',1920,1080]]){
 const file=path.join(root,'output',name);await stat(file);console.log(`Decode every frame: ${name}`);
 const video=await ff(['-i',file,'-map','0:v:0','-an','-f','framemd5','-']);
 const rows=video.out.split(/\r?\n/).filter(s=>s&&!s.startsWith('#')).map(s=>s.split(',').map(x=>x.trim()));
 assert.equal(rows.length,2700);assert.match(video.out,/#tb 0: 1\/30/);assert.ok(video.out.includes(`#dimensions 0: ${width}x${height}`));
 rows.forEach((r,i)=>{assert.equal(+r[2],i,'Video timestamp gap');assert.equal(+r[3],1);});
 const unique=new Set(rows.map(r=>r.at(-1))).size;let maxRun=1,run=1;for(let i=1;i<rows.length;i++){run=rows[i].at(-1)===rows[i-1].at(-1)?run+1:1;maxRun=Math.max(maxRun,run);}assert.ok(unique>2600);assert.ok(maxRun<=8);
 assert.match(video.err,/Video: h264/);assert.match(video.err,/yuv420p\(tv, bt709/);assert.match(video.err,/Audio: aac.*48000 Hz, stereo/);
 await writeFile(path.join(dir,name.replace('.mp4','-frames.md5')),video.out);await writeFile(path.join(dir,name.replace('.mp4','-decode.log')),video.err);
 videos.push({file:name,bytes:(await stat(file)).size,sha256:await digest(file),width,height,frames:rows.length,fps:30,uniqueFrameHashes:unique,maxRepeatedFrames:maxRun});
}
const file=path.join(root,'output/heartbeat-v04-4k.mp4'),audio=await ff(['-i',file,'-vn','-af','loudnorm=I=-15.5:TP=-1.7:LRA=9:print_format=json','-f','null','-']);
const measured=JSON.parse(audio.err.match(/\{\s*"input_i"[\s\S]*?\}/)?.[0]||'null');assert.ok(measured);const loudness=+measured.input_i,truePeak=+measured.input_tp;assert.ok(loudness>-17&&loudness<-14);assert.ok(truePeak<=-.5);
const mainTimes=[3.5,12,15,18.5,24,31,41,51,55.5,57.5,59.4,62,66,73,76.5,78.5,80,84,86,89];
const frames=[...new Set([...mainTimes.map(t=>Math.round(t*30)),...CHAPTERS.slice(1).flatMap(c=>[Math.round(c.start*30)-1,Math.round(c.start*30),Math.round(c.start*30)+1])])].sort((a,b)=>a-b);
// Extract native 4K pixels from the encoded deliverable; contact sheets only
// scale those images for review. These are not renderer screenshots.
await ff(['-y','-i',file,'-an','-vf','select='+frames.map(n=>`eq(n\\,${n})`).join('+'),'-fps_mode','vfr',path.join(dir,'encoded-%02d.png')]);
const shotByFrame=new Map(frames.map((f,i)=>[f,`encoded-${String(i+1).padStart(2,'0')}.png`]));
const groups=[{name:'encoded-contact',items:mainTimes.map(t=>({time:t,frame:Math.round(t*30)}))},{name:'encoded-boundaries',items:CHAPTERS.slice(1).flatMap(c=>[-1,0,1].map(d=>({time:(Math.round(c.start*30)+d)/30,frame:Math.round(c.start*30)+d})))}];
for(const group of groups){const html='<!doctype html><meta charset="utf-8"><title>成片解码检查</title><style>body{background:#111923;color:#efe2ca;font:20px system-ui;margin:20px}main{display:grid;grid-template-columns:repeat(3,1fr);gap:18px}figure{margin:0}img{width:100%;display:block}figcaption{padding:7px}</style><h1>《心跳 · 活着的意义》4K MP4 实际解码</h1><main>'+group.items.map(s=>`<figure><img src="${shotByFrame.get(s.frame)}"><figcaption>${s.time.toFixed(3)} s</figcaption></figure>`).join('')+'</main>';await writeFile(path.join(dir,group.name+'.html'),html);}
let browser;const pageErrors=[],playerChecks=[];
try{
 browser=await playwright().chromium.launch({headless:true,executablePath:browserPath(),args:browserArgs});const page=await browser.newPage({viewport:{width:1280,height:1050}});page.on('pageerror',e=>pageErrors.push(e.message));await page.goto(pathToFileURL(path.join(root,'index.html')).href);await page.waitForFunction(()=>document.querySelector('video').readyState>=1);
 const meta=await page.evaluate(()=>{const v=document.querySelector('video');v.muted=true;return {duration:v.duration,width:v.videoWidth,height:v.videoHeight};});assert.ok(Math.abs(meta.duration-90)<.1);assert.equal(meta.width,1920);assert.equal(meta.height,1080);
 await page.evaluate(()=>document.querySelector('video').play());await page.waitForFunction(()=>document.querySelector('video').currentTime>2.5);const playback=await page.evaluate(()=>{const v=document.querySelector('video');v.pause();const q=v.getVideoPlaybackQuality();return {advancedToSeconds:v.currentTime,totalVideoFrames:q.totalVideoFrames,droppedVideoFrames:q.droppedVideoFrames};});assert.ok(playback.totalVideoFrames>20);
 for(let i=0;i<CHAPTERS.length;i++){const t=CHAPTERS[i].start;await page.locator('nav button').nth(i).click();await page.waitForFunction(t=>{const v=document.querySelector('video');return v.currentTime>=t&&v.currentTime<t+1&&v.readyState>=2;},t);await page.evaluate(()=>document.querySelector('video').pause());playerChecks.push({chapter:CHAPTERS[i].zh,seek:t,passed:true});}
 await page.evaluate(()=>{const v=document.querySelector('video');v.currentTime=62;});await page.waitForFunction(()=>!document.querySelector('video').seeking);await page.screenshot({path:path.join(dir,'player-desktop.png'),fullPage:true});await page.setViewportSize({width:390,height:844});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.screenshot({path:path.join(dir,'player-mobile.png'),fullPage:true});
 for(const href of ['output/heartbeat-v04-4k.mp4','output/heartbeat-v04-1080p.mp4','audio/generated/heartbeat-score.mp3'])assert.ok((await stat(path.join(root,href))).size>1000);
 await page.evaluate(()=>{const v=document.querySelector('video');v.src='output/heartbeat-v04-4k.mp4';v.load();});await page.waitForFunction(()=>document.querySelector('video').readyState>=1);assert.equal(await page.evaluate(()=>document.querySelector('video').videoWidth),3840);await page.evaluate(()=>{const v=document.querySelector('video');v.currentTime=62;});await page.waitForFunction(()=>!document.querySelector('video').seeking&&document.querySelector('video').readyState>=2);
 for(const group of groups){await page.setViewportSize({width:1800,height:1100});await page.goto(pathToFileURL(path.join(dir,group.name+'.html')).href);for(let start=0;start<group.items.length;start+=9){await page.evaluate(start=>document.querySelectorAll('figure').forEach((f,i)=>f.style.display=i>=start&&i<start+9?'':'none'),start);await page.screenshot({path:path.join(dir,`${group.name}-${start/9+1}.png`),fullPage:true});}}
 assert.deepEqual(pageErrors,[]);const report={passed:true,theme:'活着的意义',videos,duration:meta.duration,video:'H.264 / yuv420p / limited BT.709',audio:{codec:'AAC',sampleRate:48000,channels:2,integratedLUFS:loudness,truePeakDBTP:truePeak,loudnessRangeLU:+measured.input_lra},extractedNative4KFrames:frames.length,offlineFilePlayer:true,playback,native4KSeek:true,chapterSeeks:playerChecks,pageErrors,note:'Technical validation and decoded visual samples; does not certify artistic quality or subjective listening.'};await writeFile(path.join(dir,'delivery.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
}finally{await browser?.close();}

