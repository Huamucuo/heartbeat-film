import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {createHash} from 'node:crypto';
import {createReadStream} from 'node:fs';
import {readFile,writeFile,stat,rename} from 'node:fs/promises';
import path from 'node:path';
import {root,ffmpegPath} from './runtime.mjs';
import {DURATION,CHAPTERS,SUBTITLES,storyTime} from '../src/timeline.mjs';
import * as previousTimeline from '../../heartbeat-film-v11/src/timeline.mjs';
import {pulseAtReal} from '../src/composition-score.mjs';
import {pulseAtReal as oldPulse} from '../../heartbeat-film-v11/src/composition-score.mjs';
const out=path.join(root,'output'),oldRoot=path.resolve(root,'../heartbeat-film-v11');
const read=async p=>JSON.parse(await readFile(p,'utf8'));
const digest=async p=>{const h=createHash('sha256');for await(const b of createReadStream(p))h.update(b);return h.digest('hex');};
const retained=await read(path.join(out,'verification/retained-pixels.json'));assert.equal(retained.passed,true);assert.deepEqual(retained.allowedIntervals,[[0,61.5]]);
const oldReport=await read(path.join(oldRoot,'output/heartbeat-v11-4k-render.json'));
for(const [name,sha] of Object.entries(oldReport.sourceHashes))assert.equal(await digest(path.join(oldRoot,name)),sha,'Prior master source changed: '+name);
const oldMaster=path.join(oldRoot,'output/heartbeat-v11-4k.mp4');
assert.equal(await digest(oldMaster),'d9a1c252462efed5c6d5dd0cb343a23a2cf69a92b828794c0a6ce1e7a08bd8cd');
assert.deepEqual(CHAPTERS.slice(0,4),previousTimeline.CHAPTERS.slice(0,4));
assert.deepEqual(SUBTITLES.filter(s=>s[0]<61.5),previousTimeline.SUBTITLES.filter(s=>s[0]<61.5));
for(let f=0;f<61.5*120;f++){const t=f/120;assert.equal(storyTime(t),previousTimeline.storyTime(t));for(let s=0;s<2;s++)assert.equal(pulseAtReal(t,s),oldPulse(t,s));}
for(const name of ['drawing','heart-records','archive','days','city','motion'])assert.equal(await digest(path.join(root,`src/${name}.mjs`)),await digest(path.join(oldRoot,`src/${name}.mjs`)),'Retained source changed: '+name);
const reports=[];
for(const [file,start,end] of [['heartbeat-v12-planar-4k',61.5,134.6],['heartbeat-v12-ending-4k',173,196]]){
 const r=await read(path.join(out,file+'-render.json'));assert.equal(r.start,start);assert.equal(r.end,end);assert.equal(r.width,3840);assert.equal(r.height,2160);assert.equal(r.fps,30);assert.equal(r.frames,Math.round((end-start)*30));assert.equal(r.samples,2);assert.deepEqual(r.errors,[]);
 for(const [name,sha] of Object.entries(r.sourceHashes))assert.equal(await digest(path.join(root,name)),sha,'Render source changed: '+name);
 reports.push(r);
}
const history=path.join(out,'history/pre-planar-20261013'),middle=await read(path.join(history,'heartbeat-v12-tail-4k-render.json'));
assert.equal(middle.start,61.5);assert.equal(middle.end,196);assert.equal(middle.width,3840);assert.equal(middle.frames,4035);assert.deepEqual(middle.errors,[]);
for(const [name,sha] of Object.entries(middle.sourceHashes)){
 const saved=name.startsWith('src/')?path.join(history,name):name==='audio/generated/master.wav'?path.join(history,'master.wav'):path.join(root,name);
 assert.equal(await digest(saved),sha,'Saved middle source changed: '+name);
}
const retainedLives=await read(path.join(out,'verification/retained-lives.json'));
assert.equal(retainedLives.passed,true);assert.deepEqual(retainedLives.allowedIntervals,[[134.6,173]]);
for(const [name,sha] of Object.entries(retainedLives.sourceSHA256))assert.equal(await digest(path.join(root,'src',name)),sha,'Retained life proof changed: '+name);
const middleMaster=path.join(history,'heartbeat-v12-tail-4k.mp4');
const dest=path.join(out,'heartbeat-v12-4k.mp4'),temp=path.join(out,'heartbeat-v12-4k.assembling.mp4');
const filter='[0:v]trim=start_frame=0:end_frame=1845,setpts=PTS-STARTPTS[v0];[1:v]setpts=PTS-STARTPTS[v1];[2:v]trim=start_frame=2193:end_frame=3345,setpts=PTS-STARTPTS[v2];[3:v]setpts=PTS-STARTPTS[v3];[v0][v1][v2][v3]concat=n=4:v=1:a=0,setsar=1,setparams=range=limited:color_primaries=bt709:color_trc=bt709:colorspace=bt709[v]';
const args=['-hide_banner','-nostdin','-y','-i',oldMaster,'-i',path.join(out,'heartbeat-v12-planar-4k.mp4'),'-i',middleMaster,'-i',path.join(out,'heartbeat-v12-ending-4k.mp4'),'-i',path.join(root,'audio/generated/master.wav'),'-filter_complex',filter,'-map','[v]','-map','4:a:0','-c:v','libx264','-preset','medium','-crf','13','-pix_fmt','yuv420p','-color_primaries','bt709','-color_trc','bt709','-colorspace','bt709','-color_range','tv','-r','30','-frames:v',String(DURATION*30),'-t',String(DURATION),'-c:a','aac','-b:a','320k','-ar','48000','-movflags','+faststart','-metadata','title=心跳 / Heartbeat — 活着的意义','-metadata','comment=Original composition. Piano samples: Salamander Grand Piano v3 by Alexander Holm, CC BY 3.0. Resampled, filtered and mixed.',temp];
let log='';const started=Date.now(),p=spawn(ffmpegPath(),args,{windowsHide:true});p.stderr.on('data',b=>{log+=b;});p.on('error',e=>{throw e;});
await new Promise((resolve,reject)=>p.on('close',code=>code===0?resolve():reject(new Error(log.slice(-4000)))));
await rename(temp,dest);await writeFile(path.join(out,'heartbeat-v12-4k-encode.log'),log);
const report={output:path.basename(dest),width:3840,height:2160,fps:30,frames:DURATION*30,start:0,end:DURATION,seconds:DURATION,samples:2,crf:13,bytes:(await stat(dest)).size,sourceHashes:reports[0].sourceHashes,renderSeconds:reports.reduce((s,r)=>s+r.renderSeconds,0),assemblySeconds:(Date.now()-started)/1000,errors:[],assembly:{retainedMaster:'heartbeat-v11-4k.mp4',retainedSHA256:await digest(oldMaster),retainedMiddleSHA256:await digest(middleMaster),segments:[{from:0,to:61.5,source:'retained v11 native 4K master'},{from:61.5,to:134.6,source:reports[0].output},{from:134.6,to:173,source:'verified pre-planar native 4K life interval'},{from:173,to:196,source:reports[1].output}],audio:'Complete v12 master; v11 PCM retained through 63 seconds. Heart stops at 194.5, musical resonance ends at 195.92.',proof:'retained-pixels.json, retained-lives.json, source and clock equivalence checks',encoding:'Native 4K sources, exact frame trims, final CRF 13 medium re-encode; retained and newly rendered segments each undergo this assembly encode. No upscaling.'}};
await writeFile(path.join(out,'heartbeat-v12-4k-render.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({output:report.output,seconds:DURATION,frames:report.frames,bytes:report.bytes,assemblySeconds:report.assemblySeconds}));
