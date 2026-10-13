import {spawn} from 'node:child_process';
import {stat,rename,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {root,ffmpegPath} from './runtime.mjs';
const source=path.join(root,'output/heartbeat-v14-4k.mp4'),temp=path.join(root,'output/heartbeat-v14-1080p.rendering.mp4'),target=path.join(root,'output/heartbeat-v14-1080p.mp4');await stat(source);
let log='';const p=spawn(ffmpegPath(),['-hide_banner','-nostdin','-y','-i',source,'-vf','scale=1920:1080:flags=lanczos','-c:v','libx264','-preset','slow','-crf','17','-pix_fmt','yuv420p','-c:a','copy','-movflags','+faststart',temp],{windowsHide:true});p.stderr.on('data',b=>log+=b);await new Promise((resolve,reject)=>{p.on('error',reject);p.on('close',c=>c?reject(new Error(log.slice(-3000))):resolve());});await rename(temp,target);await writeFile(path.join(root,'output/heartbeat-v14-1080p-encode.log'),log);console.log(JSON.stringify({source:path.basename(source),file:path.basename(target),bytes:(await stat(target)).size}));


