import {spawn} from 'node:child_process';
import {mkdir,writeFile,rename,stat} from 'node:fs/promises';
import path from 'node:path';
import {root,ffmpegPath} from './runtime.mjs';
import {DURATION} from '../src/pacing.mjs';

const out=path.join(root,'output');await mkdir(out,{recursive:true});
async function run(command,args,label){
 const log=[];let last=Date.now();
 const child=spawn(command,args,{cwd:root,windowsHide:true,stdio:['ignore','pipe','pipe']});
 child.stdout.on('data',b=>{log.push(b.toString());process.stdout.write(b);});
 child.stderr.on('data',b=>{log.push(b.toString());if(Date.now()-last>15000){console.log(`${label}: ${b.toString().trim().split(/[\r\n]/).at(-1)}`);last=Date.now();}});
 await new Promise((resolve,reject)=>{child.on('error',reject);child.on('close',code=>code===0?resolve():reject(Error(`${label} exited ${code}\n${log.join('').slice(-3500)}`)));});
 await writeFile(path.join(out,label+'.log'),log.join(''));
}
await run(process.execPath,['tools/render.mjs','--from','88.4','--to','100','--width','3840','--samples','2','--workers','3','--crf','13','--out','heartbeat-v14-bridge-4k.mp4'],'render-v14');
console.log('New transition complete; assembling the shorter film and new music.');
const old=path.resolve(root,'../heartbeat-film-v13/output/heartbeat-v13-4k.mp4');
const bridge=path.join(out,'heartbeat-v14-bridge-4k.mp4'),audio=path.join(root,'audio/generated/master.wav');
const temp4=path.join(out,'heartbeat-v14-4k.assembling.mp4'),tempHD=path.join(out,'heartbeat-v14-1080p.assembling.mp4');
// Unchanged opening, quicker maze, new ECG/black pause/entry, unchanged life
// and ending choreography. All edits land on the 30 fps playback timeline.
const filter='[0:v]trim=end_frame=1890,setpts=PTS-STARTPTS[a];[1:v]trim=end_frame=2034,setpts=(PTS-STARTPTS)*145/339,fps=30:start_time=0,trim=end_frame=762,setpts=PTS-STARTPTS[b];[2:v]setpts=PTS-STARTPTS[c];[3:v]trim=end_frame=1851,setpts=PTS-STARTPTS[d];[a][b][c][d]concat=n=4:v=1:a=0,setsar=1,split=2[full][hd];[hd]scale=1920:1080:flags=lanczos[preview]';
const common=['-c:v','libx264','-preset','medium','-pix_fmt','yuv420p','-color_primaries','bt709','-color_trc','bt709','-colorspace','bt709','-color_range','tv','-r','30','-frames:v',String(Math.round(DURATION*30)),'-t',String(DURATION),'-c:a','aac','-b:a','320k','-ar','48000','-movflags','+faststart','-metadata','title=心跳 / Heartbeat — v14','-metadata','comment=Original animation and composition. Piano samples: Alexander Holm, Salamander Grand Piano v3, CC BY 3.0.'];
await run(ffmpegPath(),['-hide_banner','-nostdin','-y','-threads','2','-i',old,'-ss','63','-threads','2','-i',old,'-threads','2','-i',bridge,'-ss','134.3','-threads','2','-i',old,'-i',audio,'-filter_complex',filter,'-map','[full]','-map','4:a:0',...common,'-crf','13',temp4,'-map','[preview]','-map','4:a:0',...common,'-crf','17',tempHD],'assemble-v14');
const files=[];
for(const [temp,name] of [[temp4,'heartbeat-v14-4k.mp4'],[tempHD,'heartbeat-v14-1080p.mp4']]){
 const dest=path.join(out,name);await rename(temp,dest);files.push({file:name,bytes:(await stat(dest)).size});
}
await writeFile(path.join(out,'export-v14.json'),JSON.stringify({edition:'v14',seconds:DURATION,fps:30,maze:{source:[63,130.8],playback:[63,92]},newBridge:[88.4,100],blackAndSilence:[95.9,98],lifeEntry:98,audio:'Recomposed v14 master, natural instrument pitch',review:'Not performed, per user request. User is final reviewer.',files},null,2));
console.log(JSON.stringify({complete:true,files,seconds:DURATION}));
