import {spawn} from 'node:child_process';
import {rename,readFile,writeFile,stat,rm} from 'node:fs/promises';
import path from 'node:path';
import {EXCERPTS} from '../src/score.mjs';
import {root,ffmpegPath} from './runtime.mjs';
for(const ex of EXCERPTS){
  const file=path.join(root,'output',ex.id+'.mp4'),temp=path.join(root,'output',ex.id+'.remux.mp4');
  try{
    await new Promise((resolve,reject)=>{
      const p=spawn(ffmpegPath(),['-hide_banner','-nostdin','-y','-i',file,'-i',path.join(root,'audio/generated',ex.id+'-master.wav'),'-map','0:v:0','-map','1:a:0','-c:v','copy','-c:a','aac','-b:a','320k','-ar','48000','-movflags','+faststart',temp],{windowsHide:true,stdio:['ignore','ignore','pipe']});
      let log='';p.stderr.on('data',b=>log+=b);p.on('error',reject);p.on('close',c=>c?reject(new Error(log)):resolve());
    });
    await rename(temp,file);console.log('Mastered audio muxed: '+ex.id);
  }catch(e){await rm(temp,{force:true});throw e;}
}
const reportPath=path.join(root,'output/render-report.json');const report=JSON.parse(await readFile(reportPath,'utf8'));
for(const c of report.clips)c.bytes=(await stat(path.join(root,'output',c.output))).size;
report.audioRemastered=new Date().toISOString();await writeFile(reportPath,JSON.stringify(report,null,2));
