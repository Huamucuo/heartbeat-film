import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {createHash} from 'node:crypto';
import {createReadStream} from 'node:fs';
import {readFile,writeFile,stat,rename} from 'node:fs/promises';
import path from 'node:path';
import {root,ffmpegPath} from './runtime.mjs';
import {DURATION,CHAPTERS,SUBTITLES,storyTime} from '../src/timeline.mjs';
import * as previousTimeline from '../../heartbeat-film-v10/src/timeline.mjs';
import {pulseAtReal} from '../src/composition-score.mjs';
import {pulseAtReal as oldPulse} from '../../heartbeat-film-v10/src/composition-score.mjs';
const out=path.join(root,'output'),oldRoot=path.resolve(root,'../heartbeat-film-v10');
const read=async p=>JSON.parse(await readFile(p,'utf8'));
const digest=async p=>{const h=createHash('sha256');for await(const b of createReadStream(p))h.update(b);return h.digest('hex');};
assert.equal((await read(path.join(out,'verification/retained-pixels.json'))).passed,true);
const oldReport=await read(path.join(oldRoot,'output/heartbeat-v10-4k-render.json'));
for(const [name,sha] of Object.entries(oldReport.sourceHashes))assert.equal(await digest(path.join(oldRoot,name)),sha,'Prior master source changed: '+name);
const oldMaster=path.join(oldRoot,'output/heartbeat-v10-4k.mp4');
assert.equal(await digest(oldMaster),'92799ea264124d7edb62c02d86fae9a06f76adbbe909b75982a74be0bf00b39f');
assert.deepEqual(CHAPTERS.slice(0,6),previousTimeline.CHAPTERS.slice(0,6));
assert.deepEqual(SUBTITLES.filter(s=>s[0]<131),previousTimeline.SUBTITLES.filter(s=>s[0]<131));
for(let f=0;f<130*120;f++){const t=f/120;assert.equal(storyTime(t),previousTimeline.storyTime(t));for(let s=0;s<2;s++)assert.equal(pulseAtReal(t,s),oldPulse(t,s));}
for(const name of ['drawing','film','heart-records','archive','days','city','maze-scene','maze-world','model-kit','motion'])assert.equal(await digest(path.join(root,`src/${name}.mjs`)),await digest(path.join(oldRoot,`src/${name}.mjs`)),'Retained source changed: '+name);
const reports=[];
for(const [file,start,end] of [['heartbeat-v11-tail-4k',130,196]]){
 const r=await read(path.join(out,file+'-render.json'));assert.equal(r.start,start);assert.equal(r.end,end);assert.equal(r.width,3840);assert.equal(r.samples,2);assert.deepEqual(r.errors,[]);
 for(const [name,sha] of Object.entries(r.sourceHashes))assert.equal(await digest(path.join(root,name)),sha,'Render source changed: '+name);
 reports.push(r);
}
const dest=path.join(out,'heartbeat-v11-4k.mp4'),temp=path.join(out,'heartbeat-v11-4k.assembling.mp4');
const filter='[0:v]trim=start_frame=0:end_frame=3900,setpts=PTS-STARTPTS[v0];[1:v]setpts=PTS-STARTPTS[v1];[v0][v1]concat=n=2:v=1:a=0,setsar=1,setparams=range=limited:color_primaries=bt709:color_trc=bt709:colorspace=bt709[v]';
const args=['-hide_banner','-nostdin','-y','-i',oldMaster,'-i',path.join(out,'heartbeat-v11-tail-4k.mp4'),'-i',path.join(root,'audio/generated/master.wav'),'-filter_complex',filter,'-map','[v]','-map','2:a:0','-c:v','libx264','-preset','medium','-crf','13','-pix_fmt','yuv420p','-color_primaries','bt709','-color_trc','bt709','-colorspace','bt709','-color_range','tv','-r','30','-frames:v',String(DURATION*30),'-t',String(DURATION),'-c:a','aac','-b:a','320k','-ar','48000','-movflags','+faststart','-metadata','title=心跳 / Heartbeat — 活着的意义','-metadata','comment=Original composition. Piano samples: Salamander Grand Piano v3 by Alexander Holm, CC BY 3.0. Resampled, filtered and mixed.',temp];
let log='';const started=Date.now(),p=spawn(ffmpegPath(),args,{windowsHide:true});p.stderr.on('data',b=>{log+=b;});p.on('error',e=>{throw e;});
await new Promise((resolve,reject)=>p.on('close',code=>code===0?resolve():reject(new Error(log.slice(-4000)))));
await rename(temp,dest);await writeFile(path.join(out,'heartbeat-v11-4k-encode.log'),log);
const report={output:path.basename(dest),width:3840,height:2160,fps:30,frames:DURATION*30,start:0,end:DURATION,seconds:DURATION,samples:2,crf:13,bytes:(await stat(dest)).size,sourceHashes:reports[0].sourceHashes,renderSeconds:reports.reduce((s,r)=>s+r.renderSeconds,0),assemblySeconds:(Date.now()-started)/1000,errors:[],assembly:{retainedMaster:'heartbeat-v10-4k.mp4',retainedSHA256:await digest(oldMaster),segments:[{from:0,to:130,source:'retained native 4K master'},{from:130,to:196,source:reports[0].output}],audio:'New complete v11 master; no previous soundtrack used',proof:'retained-pixels.json, source and clock equivalence checks',encoding:'Native 4K sources, exact frame trims, final CRF 13 medium re-encode; retained and newly rendered segments each undergo this assembly encode. No upscaling.'}};
await writeFile(path.join(out,'heartbeat-v11-4k-render.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({output:report.output,seconds:DURATION,frames:report.frames,bytes:report.bytes,assemblySeconds:report.assemblySeconds}));
