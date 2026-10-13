import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {createHash} from 'node:crypto';
import {createReadStream} from 'node:fs';
import {mkdir,writeFile,readFile,stat} from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {CHAPTERS,DURATION} from '../src/score.mjs';
import {STOP_TIME,RESONANCE_END,GLITCHES,RETURN_RUNS} from '../src/code-direction.mjs';
import {root,playwright,browserPath,browserArgs,ffmpegPath} from './runtime.mjs';
const dir=path.join(root,'output/verification');await mkdir(dir,{recursive:true});
for(const name of ['browser','motion']){
 const evidence=JSON.parse(await readFile(path.join(dir,name+'.json'),'utf8'));assert.equal(evidence.passed,true);
 for(const file of ['code-maze.mjs','code-direction.mjs','code-lives.mjs','code-ending.mjs','scenes.mjs','timeline.mjs','film.mjs','drawing.mjs'])assert.equal(evidence.sourceSHA256?.[file],await digest(path.join(root,'src',file)),`${name} verification belongs to a different source: ${file}`);
}
const audioEvidence=JSON.parse(await readFile(path.join(dir,'audio-v12.json'),'utf8'));assert.equal(audioEvidence.passed,true);assert.equal(audioEvidence.masterSHA256,await digest(path.join(root,'audio/generated/master.wav')),'Audio verification belongs to an earlier master');
const renderReport=JSON.parse(await readFile(path.join(root,'output/heartbeat-v12-4k-render.json'),'utf8'));
assert.equal(renderReport.frames,DURATION*30);assert.equal(renderReport.width,3840);assert.equal(renderReport.samples,2);assert.deepEqual(renderReport.errors,[]);
for(const [name,sha] of Object.entries(renderReport.sourceHashes))assert.equal(await digest(path.join(root,name)),sha,`Source changed after render: ${name}`);
function ff(args){return new Promise((resolve,reject)=>{const p=spawn(ffmpegPath(),['-hide_banner','-nostdin','-nostats','-xerror',...args],{windowsHide:true});let out='',err='';p.stdout.on('data',b=>out+=b);p.stderr.on('data',b=>err+=b);p.on('error',reject);p.on('close',code=>code===0?resolve({out,err}):reject(new Error(`FFmpeg ${code}: ${err.slice(-5000)}`)));});}
async function digest(p){const h=createHash('sha256');for await(const b of createReadStream(p))h.update(b);return h.digest('hex');}
const videos=[];
for(const [name,width,height] of [['heartbeat-v12-4k.mp4',3840,2160],['heartbeat-v12-1080p.mp4',1920,1080]]){
 const file=path.join(root,'output',name);await stat(file);console.log(`Decode every frame: ${name}`);
 const video=await ff(['-i',file,'-map','0:v:0','-an','-f','framemd5','-']);
 const rows=video.out.split(/\r?\n/).filter(s=>s&&!s.startsWith('#')).map(s=>s.split(',').map(x=>x.trim()));
 assert.equal(rows.length,DURATION*30);assert.match(video.out,/#tb 0: 1\/30/);assert.ok(video.out.includes(`#dimensions 0: ${width}x${height}`));
 rows.forEach((r,i)=>{assert.equal(+r[2],i,'Video timestamp gap');assert.equal(+r[3],1);});
 const stopFrame=Math.round(STOP_TIME*30),active=rows.slice(0,stopFrame),unique=new Set(rows.map(r=>r.at(-1))).size;
 const runs=items=>{let max=1,run=1;for(let i=1;i<items.length;i++){run=items[i].at(-1)===items[i-1].at(-1)?run+1:1;max=Math.max(max,run);}return max;};
 const maxRun=runs(rows),maxActiveRun=runs(active),activeUnique=new Set(active.map(r=>r.at(-1))).size;
 assert.ok(activeUnique>active.length*.96,'Unexpected held images before the authored stop');assert.ok(maxActiveRun<=8,'Unintended frozen section before 194.5s');
 // The final 45 frames intentionally hold. Compression may change decoded hashes
 // of a static source slightly; exact frozen-source equality is checked in browser.json.
 const silentTailStart=RESONANCE_END+.035;
 assert.ok(silentTailStart<DURATION,'The authored resonant tail must leave an encoded silence window');
 const silence=await ff(['-ss',String(silentTailStart),'-i',file,'-vn','-af','astats=metadata=0:reset=0','-f','null','-']);
 const peaks=[...silence.err.matchAll(/Peak level dB:\s*(-?inf|[-.\d]+)/g)].map(m=>Number(m[1]==='-inf'?-Infinity:m[1]));
 assert.ok(peaks.length>=1&&peaks.every(p=>p<=-80),'Encoded ending is not silent after the AAC boundary window');
 assert.match(video.err,/Video: h264/);assert.match(video.err,/yuv420p\(tv, bt709/);assert.match(video.err,/Audio: aac.*48000 Hz, stereo/);
 await writeFile(path.join(dir,name.replace('.mp4','-frames.md5')),video.out);await writeFile(path.join(dir,name.replace('.mp4','-decode.log')),video.err);
 videos.push({file:name,bytes:(await stat(file)).size,sha256:await digest(file),width,height,frames:rows.length,fps:30,uniqueFrameHashes:unique,maxRepeatedFrames:maxRun,maxActiveRepeatedFrames:maxActiveRun,authoredStillInterval:[STOP_TIME,DURATION],heartStopSeconds:STOP_TIME,resonanceEndSeconds:RESONANCE_END,encodedSilenceCheckStart:silentTailStart,silentTailPeakDBFS:Number.isFinite(Math.max(...peaks))?Math.max(...peaks):"-inf"});
}
const file=path.join(root,'output/heartbeat-v12-4k.mp4'),audio=await ff(['-i',file,'-vn','-af','loudnorm=I=-15.5:TP=-1.7:LRA=9:print_format=json','-f','null','-']);
const measured=JSON.parse(audio.err.match(/\{\s*"input_i"[\s\S]*?\}/)?.[0]||'null');assert.ok(measured);const loudness=+measured.input_i,truePeak=+measured.input_tp;assert.ok(loudness>-18.5&&loudness<-14);assert.ok(truePeak<=-.5);
const mainTimes=[2,5,8,14,23,28,37,44,54,59,61.5,63,66,70,76,82,90,98,104,110,116,118.5,120.5,124,129,RETURN_RUNS.at(-1).end,131,133,134.6,136,140,144,148,152,156,160,164,168,171,173.5,175,177,178.5,180,181.5,182,183.5,185,187,189,191,192.8,192.866667,193.3,194.1,194.466667,194.5,195,195.966667];
// A requested event may fall between video frames. Select the first frame at
// or after it, and label the real frame timestamp (not the requested time).
const mainShots=mainTimes.map(t=>{const frame=Math.min(DURATION*30-1,Math.ceil(t*30));return {requestedTime:t,time:frame/30,frame};});
const boundaryTimes=[...new Set([...CHAPTERS.slice(1).map(c=>c.start),61.5,66,131,134.6,173,182,STOP_TIME,...GLITCHES.flatMap(g=>[g.start,g.end])])].sort((a,b)=>a-b);
const frames=[...new Set([...mainShots.map(s=>s.frame),...boundaryTimes.flatMap(t=>[Math.round(t*30)-1,Math.round(t*30),Math.round(t*30)+1])])].sort((a,b)=>a-b);
// Extract native 4K pixels from the encoded deliverable; contact sheets only
// scale those images for review. These are not renderer screenshots.
await ff(['-y','-i',file,'-an','-vf','select='+frames.map(n=>`eq(n\\,${n})`).join('+'),'-fps_mode','vfr',path.join(dir,'encoded-%02d.png')]);
const shotByFrame=new Map(frames.map((f,i)=>[f,`encoded-${String(i+1).padStart(2,'0')}.png`]));
const groups=[{name:'encoded-contact',items:mainShots},{name:'encoded-boundaries',items:boundaryTimes.flatMap(t=>[-1,0,1].map(d=>({time:(Math.round(t*30)+d)/30,frame:Math.round(t*30)+d})))}];
for(const group of groups){const html='<!doctype html><meta charset="utf-8"><title>成片解码检查</title><style>body{background:#111923;color:#efe2ca;font:20px system-ui;margin:20px}main{display:grid;grid-template-columns:repeat(3,1fr);gap:18px}figure{margin:0}img{width:100%;display:block}figcaption{padding:7px}</style><h1>《心跳 · 活着的意义》4K MP4 实际解码</h1><main>'+group.items.map(s=>`<figure><img src="${shotByFrame.get(s.frame)}"><figcaption>${s.time.toFixed(3)} s</figcaption></figure>`).join('')+'</main>';await writeFile(path.join(dir,group.name+'.html'),html);}
let browser;const pageErrors=[],playerChecks=[];
try{
 browser=await playwright().chromium.launch({headless:true,executablePath:browserPath(),args:browserArgs});const page=await browser.newPage({viewport:{width:1280,height:1050}});page.on('pageerror',e=>pageErrors.push(e.message));await page.goto(pathToFileURL(path.join(root,'index.html')).href);await page.waitForFunction(()=>document.querySelector('video').readyState>=1);
 const meta=await page.evaluate(()=>{const v=document.querySelector('video');v.muted=true;return {duration:v.duration,width:v.videoWidth,height:v.videoHeight};});assert.ok(Math.abs(meta.duration-DURATION)<.1);assert.equal(meta.width,1920);assert.equal(meta.height,1080);
 await page.evaluate(()=>document.querySelector('video').play());await page.waitForFunction(()=>document.querySelector('video').currentTime>2.5);const playback=await page.evaluate(()=>{const v=document.querySelector('video');v.pause();const q=v.getVideoPlaybackQuality();return {advancedToSeconds:v.currentTime,totalVideoFrames:q.totalVideoFrames,droppedVideoFrames:q.droppedVideoFrames};});assert.ok(playback.totalVideoFrames>20);
 for(let i=0;i<CHAPTERS.length;i++){const t=CHAPTERS[i].start;await page.locator('nav button').nth(i).click();await page.waitForFunction(t=>{const v=document.querySelector('video');return v.currentTime>=t&&v.currentTime<t+1&&v.readyState>=2;},t);await page.evaluate(()=>document.querySelector('video').pause());playerChecks.push({chapter:CHAPTERS[i].zh,seek:t,passed:true});}
 await page.evaluate(()=>{const v=document.querySelector('video');v.currentTime=118.5;});await page.waitForFunction(()=>!document.querySelector('video').seeking);await page.screenshot({path:path.join(dir,'player-desktop.png'),fullPage:true});await page.setViewportSize({width:390,height:844});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.screenshot({path:path.join(dir,'player-mobile.png'),fullPage:true});
 for(const href of ['output/heartbeat-v12-4k.mp4','output/heartbeat-v12-1080p.mp4','audio/generated/heartbeat-score.mp3'])assert.ok((await stat(path.join(root,href))).size>1000);
 await page.evaluate(()=>{const v=document.querySelector('video');v.src='output/heartbeat-v12-4k.mp4';v.load();});await page.waitForFunction(()=>document.querySelector('video').readyState>=1);assert.equal(await page.evaluate(()=>document.querySelector('video').videoWidth),3840);await page.evaluate(()=>{const v=document.querySelector('video');v.currentTime=118.5;});await page.waitForFunction(()=>!document.querySelector('video').seeking&&document.querySelector('video').readyState>=2);
 for(const group of groups){await page.setViewportSize({width:1800,height:1100});await page.goto(pathToFileURL(path.join(dir,group.name+'.html')).href);for(let start=0;start<group.items.length;start+=9){await page.evaluate(start=>document.querySelectorAll('figure').forEach((f,i)=>f.style.display=i>=start&&i<start+9?'':'none'),start);await page.screenshot({path:path.join(dir,`${group.name}-${start/9+1}.png`),fullPage:true});}}
 assert.deepEqual(pageErrors,[]);const report={passed:true,theme:'活着的意义',videos,duration:meta.duration,video:'H.264 / yuv420p / limited BT.709',audio:{codec:'AAC',sampleRate:48000,channels:2,integratedLUFS:loudness,truePeakDBTP:truePeak,loudnessRangeLU:+measured.input_lra,heartStopSeconds:STOP_TIME,resonanceEndSeconds:RESONANCE_END},extractedNative4KFrames:frames.length,offlineFilePlayer:true,playback,native4KSeek:true,chapterSeeks:playerChecks,pageErrors,note:`Technical validation and decoded visual samples. The picture and heartbeat stop at ${STOP_TIME}s; only a musical high-frequency resonance decays until ${RESONANCE_END}s. Encoded complete silence is checked after the AAC boundary allowance. Preceding motion remains validated. This does not certify artistic quality or subjective listening.`};await writeFile(path.join(dir,'delivery.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
}finally{await browser?.close();}


