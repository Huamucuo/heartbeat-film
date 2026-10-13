import {spawn} from 'node:child_process';
import {mkdir,writeFile,rename,rm,stat} from 'node:fs/promises';
import path from 'node:path';
import {startServer} from './serve.mjs';
import {playwright,browserPath,browserArgs,ffmpegPath,root} from './runtime.mjs';
import {EXCERPTS,FPS} from '../src/score.mjs';

const requested=process.argv.slice(2);
const clips=requested.length?EXCERPTS.filter(e=>requested.includes(e.id)):EXCERPTS;
if(!clips.length)throw new Error('Use 01-emergence or 02-answer, or no arguments for both.');
const out=path.join(root,'output');await mkdir(out,{recursive:true});
for(const ex of clips)await stat(path.join(root,'audio/generated',ex.id+'-master.wav'));
const server=await startServer();let browser,encoder;
const report={created:new Date().toISOString(),width:1920,height:1080,fps:FPS,method:'absolute source time -> WebGL canvas PNG -> FFmpeg image pipe',clips:[]};
try{
  browser=await playwright().chromium.launch({headless:true,executablePath:browserPath(),args:browserArgs});
  const page=await browser.newPage({viewport:{width:1920,height:1080},deviceScaleFactor:1});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await page.goto(`http://127.0.0.1:${server.address().port}/render.html`);
  await page.waitForFunction(()=>window.heartbeat?.ready,null,{timeout:30000});
  for(const ex of clips){
    const started=Date.now(),frames=Math.round((ex.end-ex.start)*FPS);
    const temp=path.join(out,ex.id+'.rendering.mp4'),dest=path.join(out,ex.id+'.mp4');
    let log='';
    encoder=spawn(ffmpegPath(),['-hide_banner','-nostdin','-y','-f','image2pipe','-framerate',String(FPS),'-vcodec','png','-i','pipe:0','-i',path.join(root,'audio/generated',ex.id+'-master.wav'),'-map','0:v:0','-map','1:a:0','-c:v','libx264','-preset','slow','-crf','16','-pix_fmt','yuv420p','-vf','scale=out_color_matrix=bt709:out_range=tv','-color_primaries','bt709','-color_trc','bt709','-colorspace','bt709','-color_range','tv','-frames:v',String(frames),'-c:a','aac','-b:a','320k','-ar','48000','-movflags','+faststart','-metadata',`title=心跳 / ${ex.title}`,'-metadata',`comment=Original key sample. Source interval ${ex.start}-${ex.end} seconds.`,temp],{windowsHide:true,stdio:['pipe','ignore','pipe']});
    encoder.stderr.on('data',b=>{log+=b.toString();});encoder.stdin.on('error',()=>{});
    const finished=new Promise((resolve,reject)=>{encoder.on('error',reject);encoder.on('close',code=>code===0?resolve():reject(new Error(`FFmpeg exited ${code}\n${log.slice(-5000)}`)));});finished.catch(()=>{});
    try{
      for(let frame=0;frame<frames;frame++){
        if(errors.length)throw new Error(errors.join('\n'));
        const t=ex.start+frame/FPS;
        const data=await page.evaluate(t=>{window.heartbeat.seek(t);return document.querySelector('#film').toDataURL('image/png').split(',')[1];},t);
        const png=Buffer.from(data,'base64');
        await new Promise((resolve,reject)=>encoder.stdin.write(png,error=>error?reject(error):resolve()));
        if(frame%30===0||frame===frames-1)console.log(`${ex.id}: ${frame+1}/${frames} frames (${((Date.now()-started)/1000).toFixed(1)} s)`);
      }
      encoder.stdin.end();await finished;encoder=null;
      await rename(temp,dest);
      await writeFile(path.join(out,ex.id+'-encode.log'),log);
      report.clips.push({...ex,frames,output:path.basename(dest),renderSeconds:(Date.now()-started)/1000,bytes:(await stat(dest)).size});
    }catch(e){encoder?.kill();await finished.catch(()=>{});await writeFile(path.join(out,ex.id+'-failed.log'),log);await rm(temp,{force:true});throw e;}
  }
  await writeFile(path.join(out,'render-report.json'),JSON.stringify(report,null,2));console.log('Both requested excerpts rendered successfully.');
}finally{encoder?.kill();await browser?.close();await new Promise(r=>server.close(r));}
