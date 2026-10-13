import {spawn} from 'node:child_process';
import {writeFile,readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {ffmpegPath,root} from './runtime.mjs';
import {STOP_TIME,RESONANCE_END} from '../src/code-direction.mjs';
function run(args){return new Promise((resolve,reject)=>{const p=spawn(ffmpegPath(),['-hide_banner','-nostdin',...args],{windowsHide:true});let err='';p.stderr.on('data',b=>err+=b);p.on('error',reject);p.on('close',c=>c?reject(new Error(err)):resolve(err));});}
const dir=path.join(root,'audio/generated'),raw=path.join(dir,'source-mix.wav'),wav=path.join(dir,'master.wav');
const levelPass=await run(['-i',raw,'-af','loudnorm=I=-15.5:TP=-1.7:LRA=9:print_format=json','-f','null','-']);
const input=JSON.parse(levelPass.match(/\{\s*"input_i"[\s\S]*?\}/)[0]);
// A single constant gain preserves the increase and collapse of the final
// heartbeats. No automatic gain rider or global fade may flatten that arc.
const gainDB=Math.min(-15.5-Number(input.input_i),-2.05-Number(input.input_tp));
const filter=`volume=${gainDB}dB`;
await run(['-y','-i',raw,'-af',filter,'-ar','48000','-c:a','pcm_s24le',wav]);
function pcmInfo(b){
 if(b.toString('ascii',0,4)!=='RIFF'||b.toString('ascii',8,12)!=='WAVE')throw Error('Expected PCM WAV');
 let fmt,data;
 for(let p=12;p+8<=b.length;){const id=b.toString('ascii',p,p+4),size=b.readUInt32LE(p+4);if(id==='fmt ')fmt={channels:b.readUInt16LE(p+10),rate:b.readUInt32LE(p+12),bits:b.readUInt16LE(p+22)};if(id==='data')data={offset:p+8,size};p+=8+size+(size%2);}
 if(fmt?.channels!==2||fmt.rate!==48000||fmt.bits!==24||!data)throw Error('Expected 48 kHz stereo 24-bit PCM');return {...fmt,...data};
}
const oldPath=path.resolve(root,'../heartbeat-film-v11/audio/generated/master.wav');
const previous=await readFile(oldPath),out=await readFile(wav),old=pcmInfo(previous),now=pcmInfo(out);
const retainedSeconds=43,blendSeconds=.75;
const retainedBytes=retainedSeconds*48000*6;
previous.copy(out,now.offset,old.offset,old.offset+retainedBytes);
// Hand over before the 44 s phrase. Retaining the former first 63 s would
// overwrite the repaired 47 s harmony with the very splice being replaced.
const blendFrames=Math.round(blendSeconds*48000),blendStart=retainedSeconds*48000;
for(let i=0;i<blendFrames;i++)for(let ch=0;ch<2;ch++){
 const p=(blendStart+i)*6+ch*3,u=i/(blendFrames-1),s=u*u*(3-2*u);
 out.writeIntLE(Math.round(previous.readIntLE(old.offset+p,3)*(1-s)+out.readIntLE(now.offset+p,3)*s),now.offset+p,3);
}
out.fill(0,now.offset+Math.round(RESONANCE_END*48000)*6,now.offset+now.size);
await writeFile(wav,out);
await run(['-y','-i',wav,'-c:a','libmp3lame','-b:a','256k',path.join(dir,'heartbeat-score.mp3')]);
const preservation={source:oldPath,start:0,end:retainedSeconds,pcmBytes:retainedBytes,crossfadeAfterRetainedSeconds:blendSeconds};
await writeFile(path.join(dir,'master-report.json'),JSON.stringify({gainDB,processing:'Fixed linear mastering gain; first 43 s PCM retained from v11, 750 ms blend before the repaired phrase. One continuous maze accelerando reaches 224 BPM at 131.25; dry cyber break 131.25-131.83. Heart stops at 194.5; a sustained 1000 Hz electronic flatline lasts to 195.92 with only an 8 ms anti-click release, then exact silence.',preservation,stopTime:STOP_TIME,resonanceEnd:RESONANCE_END,masterSHA256:createHash('sha256').update(out).digest('hex'),review:'No listening or review pass, per user instruction.'},null,2));console.log({master:wav,gainDB,preservation,stopTime:STOP_TIME,resonanceEnd:RESONANCE_END});

