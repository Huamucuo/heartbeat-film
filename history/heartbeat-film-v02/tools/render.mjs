import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {mkdir,writeFile,rename,stat} from 'node:fs/promises';
import path from 'node:path';
import {startServer} from './serve.mjs';
import {root,playwright,browserPath,browserArgs,ffmpegPath} from './runtime.mjs';
const opts=Object.fromEntries(process.argv.slice(2).reduce((a,x,i,all)=>x.startsWith('--')?[...a,[x.slice(2),all[i+1]]]:a,[]));
const FROM=+(opts.from||0),TO=+(opts.to||90),FPS=30,N=Math.round((TO-FROM)*FPS),WORKERS=+(opts.workers||3),SAMPLES=+(opts.samples||2);
if(!(FROM>=0&&TO>FROM&&TO<=90&&WORKERS>=1&&WORKERS<=6))throw new Error('Invalid interval or worker count');
const name=opts.out||'heartbeat-v02.mp4',out=path.join(root,'output');await mkdir(out,{recursive:true});
const temp=path.join(out,name.replace(/\.mp4$/,'.rendering.mp4')),dest=path.join(out,name),audio=path.join(root,'audio/generated/master.wav');await stat(audio);
const server=await startServer(),browsers=[],errors=[];let encoder;
try{
 const pages=await Promise.all(Array.from({length:WORKERS},async()=>{
  const b=await playwright().chromium.launch({headless:true,executablePath:browserPath(),args:browserArgs});browsers.push(b);
  const p=await b.newPage({viewport:{width:1920,height:1080},deviceScaleFactor:1});p.on('pageerror',e=>errors.push(e.message));await p.goto(`http://127.0.0.1:${server.address().port}/render.html`);await p.waitForFunction(()=>window.heartbeat?.ready);return p;
 }));
 let log='';encoder=spawn(ffmpegPath(),['-hide_banner','-nostdin','-y','-f','image2pipe','-framerate',String(FPS),'-vcodec','png','-i','pipe:0','-ss',String(FROM),'-t',String(TO-FROM),'-i',audio,'-map','0:v:0','-map','1:a:0','-c:v','libx264','-preset','medium','-crf','18','-pix_fmt','yuv420p','-vf','scale=out_color_matrix=bt709:out_range=tv,setparams=range=limited:color_primaries=bt709:color_trc=bt709:colorspace=bt709','-color_primaries','bt709','-color_trc','bt709','-colorspace','bt709','-color_range','tv','-frames:v',String(N),'-c:a','aac','-b:a','320k','-ar','48000','-movflags','+faststart','-metadata','title=心跳 / Heartbeat — v02','-metadata','comment=Original procedural film and original instrumental score.',temp],{windowsHide:true,stdio:['pipe','ignore','pipe']});
 encoder.stderr.on('data',b=>log+=b.toString());encoder.stdin.on('error',e=>errors.push(e.message));
 const done=new Promise((resolve,reject)=>{encoder.on('error',reject);encoder.on('close',c=>c===0?resolve():reject(new Error(`FFmpeg ${c}\n${log.slice(-4000)}`)));});done.catch(()=>{});
 let frame=0,lastLog=0;const started=Date.now();
 // A bounded batch keeps memory limited and preserves order regardless of
 // which browser finishes first. Every image has an exact source frame number.
 while(frame<N){
  const ids=Array.from({length:Math.min(WORKERS,N-frame)},(_,k)=>frame+k);
  const images=await Promise.all(ids.map((f,k)=>pages[k].evaluate(({t,samples})=>{window.heartbeat.frame(t,30,samples);return document.querySelector('#film').toDataURL('image/png').split(',')[1];},{t:FROM+f/FPS,samples:SAMPLES})));
  if(errors.length)throw new Error(errors.join('\n'));
  for(const data of images)if(!encoder.stdin.write(Buffer.from(data,'base64')))await once(encoder.stdin,'drain');
  frame+=images.length;
  if(Date.now()-lastLog>10000||frame===N){const sec=(Date.now()-started)/1000;console.log(`${frame}/${N} frames, ${(frame/sec).toFixed(1)} fps, ${sec.toFixed(0)} s elapsed`);lastLog=Date.now();}
 }
 encoder.stdin.end();await done;encoder=null;await rename(temp,dest);
 const report={output:name,width:1920,height:1080,fps:FPS,frames:N,start:FROM,end:TO,seconds:TO-FROM,samples:SAMPLES,workers:WORKERS,renderSeconds:(Date.now()-started)/1000,bytes:(await stat(dest)).size,errors};
 await writeFile(path.join(out,name.replace('.mp4','-render.json')),JSON.stringify(report,null,2));await writeFile(path.join(out,name.replace('.mp4','-encode.log')),log);console.log(JSON.stringify(report));
}finally{encoder?.kill();await Promise.allSettled(browsers.map(b=>b.close()));await new Promise(r=>server.close(r));}
