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
const changed=path.join(out,'heartbeat-v16-ecg-flash-4k.mp4');
if(!process.argv.includes('--assemble-only')) await run(process.execPath,['tools/render.mjs','--from','93','--to','96','--width','3840','--samples','2','--workers','3','--crf','13','--out',path.basename(changed)],'render-v16');
if(process.argv.includes('--render-only'))process.exit(0);
const old=path.resolve(root,'archive/workspace/heartbeat-film-v15/output/heartbeat-v15-4k.mp4');
const audio=path.join(root,'audio/generated/master.wav');
const temp4=path.join(out,'heartbeat-v16-4k.assembling.mp4'),tempHD=path.join(out,'heartbeat-v16-1080p.assembling.mp4');
// Retain v15 picture around a three-second ECG flash replacement.
const filter='[0:v]trim=end_frame=2790,setpts=PTS-STARTPTS[a];[1:v]trim=end_frame=90,setpts=PTS-STARTPTS[b];[2:v]trim=end_frame=1971,setpts=PTS-STARTPTS[c];[a][b][c]concat=n=3:v=1:a=0,setsar=1,split=2[full][hd];[hd]scale=1920:1080:flags=lanczos[preview]';
const common=['-c:v','libx264','-preset','fast','-pix_fmt','yuv420p','-color_primaries','bt709','-color_trc','bt709','-colorspace','bt709','-color_range','tv','-r','30','-frames:v',String(Math.round(DURATION*30)),'-t',String(DURATION),'-c:a','aac','-b:a','320k','-ar','48000','-movflags','+faststart','-metadata','title=心跳 / Heartbeat — v16','-metadata','comment=Piano: Alexander Holm, Salamander Grand Piano v3, CC BY 3.0. ECG: MIT-BIH Arrhythmia Database record 100 MLII, Moody and Mark (2005), PhysioNet, doi:10.13026/C2F305, Open Data Commons Attribution License 1.0; excerpt with baseline removal, one accelerated luminous sweep.'];
await run(ffmpegPath(),['-hide_banner','-nostdin','-y','-threads','2','-i',old,'-threads','2','-i',changed,'-ss','96','-threads','2','-i',old,'-i',audio,'-filter_complex',filter,'-map','[full]','-map','3:a:0',...common,'-crf','13',temp4,'-map','[preview]','-map','3:a:0',...common,'-crf','17',tempHD],'assemble-v16');
const files=[];
for(const [temp,name] of [[temp4,'heartbeat-v16-4k.mp4'],[tempHD,'heartbeat-v16-1080p.mp4']]){
 const dest=path.join(out,name);await rename(temp,dest);files.push({file:name,bytes:(await stat(dest)).size});
}
await writeFile(path.join(out,'export-v16.json'),JSON.stringify({edition:'v16',seconds:DURATION,fps:30,newPicture:[93,96],pullback:[66,92.3],firstBlack:[92.3,94.0772727273],measuredECGSweep:[94.0772727273,94.4772727273],afterglowEnd:94.85,heartbeat:94.25,secondBlack:[94.85,98],lifeEntry:98,audio:'v15 music retained; one tighter heartbeat, 94.25 / 94.39',review:'Not performed, per user request. User is final reviewer.',files},null,2));
console.log(JSON.stringify({complete:true,files,seconds:DURATION}));
