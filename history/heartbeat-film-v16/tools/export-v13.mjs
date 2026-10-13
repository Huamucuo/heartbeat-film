import {spawn} from 'node:child_process';
import {mkdir,writeFile,rename,stat} from 'node:fs/promises';
import path from 'node:path';
import {root,ffmpegPath} from './runtime.mjs';

// A direct production export. The user performs the viewing/review.
const out=path.join(root,'output');
await mkdir(out,{recursive:true});
async function run(command,args,label){
 const log=[];let last=Date.now();
 const child=spawn(command,args,{cwd:root,windowsHide:true,stdio:['ignore','pipe','pipe']});
 child.stdout.on('data',b=>{log.push(b.toString());process.stdout.write(b);});
 child.stderr.on('data',b=>{log.push(b.toString());if(Date.now()-last>15000){console.log(`${label}: ${b.toString().trim().split(/[\r\n]/).at(-1)}`);last=Date.now();}});
 await new Promise((resolve,reject)=>{child.on('error',reject);child.on('close',code=>code===0?resolve():reject(Error(`${label} exited ${code}\n${log.join('').slice(-3500)}`)));});
 await writeFile(path.join(out,label+'.log'),log.join(''));
}
await run(process.execPath,['tools/render.mjs','--from','124','--to','196','--width','3840','--samples','2','--workers','3','--crf','13','--out','heartbeat-v13-tail-4k.mp4'],'render-v13');
console.log('New animation complete; joining the film and replacing its full soundtrack.');
const old=path.resolve(root,'../heartbeat-film-v12/output/heartbeat-v12-4k.mp4');
const tail=path.join(out,'heartbeat-v13-tail-4k.mp4'),audio=path.join(root,'audio/generated/master.wav');
const temp4=path.join(out,'heartbeat-v13-4k.assembling.mp4'),tempHD=path.join(out,'heartbeat-v13-1080p.assembling.mp4');
const filter='[0:v]trim=start_frame=0:end_frame=3720,setpts=PTS-STARTPTS[a];[1:v]setpts=PTS-STARTPTS[b];[a][b]concat=n=2:v=1:a=0,setsar=1,split=2[full][hd];[hd]scale=1920:1080:flags=lanczos[preview]';
const common=['-c:v','libx264','-preset','medium','-pix_fmt','yuv420p','-color_primaries','bt709','-color_trc','bt709','-colorspace','bt709','-color_range','tv','-r','30','-frames:v','5880','-t','196','-c:a','aac','-b:a','320k','-ar','48000','-movflags','+faststart','-metadata','title=心跳 / Heartbeat — v13','-metadata','comment=Original animation and composition. Piano samples: Alexander Holm, Salamander Grand Piano v3, CC BY 3.0.'];
await run(ffmpegPath(),['-hide_banner','-nostdin','-y','-i',old,'-i',tail,'-i',audio,'-filter_complex',filter,'-map','[full]','-map','2:a:0',...common,'-crf','13',temp4,'-map','[preview]','-map','2:a:0',...common,'-crf','17',tempHD],'assemble-v13');
const files=[];
for(const [temp,name] of [[temp4,'heartbeat-v13-4k.mp4'],[tempHD,'heartbeat-v13-1080p.mp4']]){
 const dest=path.join(out,name);await rename(temp,dest);files.push({file:name,bytes:(await stat(dest)).size});
}
await writeFile(path.join(out,'export-v13.json'),JSON.stringify({edition:'v13',seconds:196,fps:30,retainedPicture:[0,124],newPicture:[124,196],audio:'Complete v13 master',review:'Not performed, per user request. User is final reviewer.',files},null,2));
console.log(JSON.stringify({complete:true,files}));
