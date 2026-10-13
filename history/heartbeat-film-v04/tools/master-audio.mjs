import {spawn} from 'node:child_process';
import {writeFile} from 'node:fs/promises';
import path from 'node:path';
import {ffmpegPath,root} from './runtime.mjs';
function run(args){return new Promise((resolve,reject)=>{const p=spawn(ffmpegPath(),['-hide_banner','-nostdin',...args],{windowsHide:true});let err='';p.stderr.on('data',b=>err+=b);p.on('error',reject);p.on('close',c=>c?reject(new Error(err)):resolve(err));});}
const dir=path.join(root,'audio/generated'),raw=path.join(dir,'source-mix.wav'),wav=path.join(dir,'master.wav');
const analyze=await run(['-i',raw,'-af','loudnorm=I=-15.5:TP=-1.7:LRA=9:print_format=json','-f','null','-']);
const input=JSON.parse(analyze.match(/\{\s*"input_i"[\s\S]*?\}/)[0]);
const filter=`loudnorm=I=-15.5:TP=-1.7:LRA=9:measured_I=${input.input_i}:measured_TP=${input.input_tp}:measured_LRA=${input.input_lra}:measured_thresh=${input.input_thresh}:offset=${input.target_offset}:linear=false,alimiter=limit=0.794:level=false`;
await run(['-y','-i',raw,'-af',filter,'-ar','48000','-c:a','pcm_s24le',wav]);
await run(['-y','-i',wav,'-c:a','libmp3lame','-b:a','256k',path.join(dir,'heartbeat-score.mp3')]);
const log=await run(['-i',wav,'-af','loudnorm=I=-15.5:TP=-1.7:LRA=9:print_format=json','-f','null','-']);
const output=JSON.parse(log.match(/\{\s*"input_i"[\s\S]*?\}/)[0]);
if(!Number.isFinite(+output.input_i)||!Number.isFinite(+output.input_tp))throw new Error('Silent or invalid audio');
await writeFile(path.join(dir,'master-report.json'),JSON.stringify({input,output},null,2));console.log(output);

