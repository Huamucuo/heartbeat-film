import {spawn} from 'node:child_process';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {ffmpegPath,root} from './runtime.mjs';
import {EXCERPTS} from '../src/score.mjs';

function run(args){return new Promise((resolve,reject)=>{const p=spawn(ffmpegPath(),['-hide_banner','-nostdin',...args],{windowsHide:true});let log='';p.stderr.on('data',b=>log+=b);p.on('error',reject);p.on('close',code=>code?reject(new Error(log)):resolve(log));});}
const dir=path.join(root,'audio/generated');await mkdir(dir,{recursive:true});
const raw=path.join(dir,'source-mix.wav'),master=path.join(dir,'source-master.wav');
const analyze=await run(['-i',raw,'-af','loudnorm=I=-16:TP=-1.5:LRA=9:print_format=json','-f','null','-']);
const matched=analyze.match(/\{\s*"input_i"[\s\S]*?\}/);
if(!matched)throw new Error('No loudness measurement returned');
const m=JSON.parse(matched[0]);
const filter=`loudnorm=I=-16:TP=-1.5:LRA=9:measured_I=${m.input_i}:measured_TP=${m.input_tp}:measured_LRA=${m.input_lra}:measured_thresh=${m.input_thresh}:offset=${m.target_offset}:linear=false:print_format=json`;
await run(['-y','-i',raw,'-af',filter,'-ar','48000','-c:a','pcm_s24le',master]);
const report={sourceInput:m,sourceMaster:master,clips:[]};
for(const ex of EXCERPTS){
  const output=path.join(dir,ex.id+'-master.wav');
  await run(['-y','-i',master,'-af',`atrim=start=${ex.start}:end=${ex.end},asetpts=PTS-STARTPTS,afade=t=in:d=0.005,afade=t=out:st=${ex.end-ex.start-.005}:d=0.005`,'-ar','48000','-c:a','pcm_s24le',output]);
  const text=await run(['-i',output,'-af','loudnorm=I=-16:TP=-1:LRA=9:print_format=json','-f','null','-']);
  const measurement=JSON.parse(text.match(/\{\s*"input_i"[\s\S]*?\}/)[0]);
  const loudness=Number(measurement.input_i),peak=Number(measurement.input_tp);
  if(!Number.isFinite(loudness)||!Number.isFinite(peak))throw new Error(`${ex.id}: non-finite loudness; audio crop may be silent`);
  report.clips.push({id:ex.id,integratedLUFS:loudness,truePeakDBTP:peak,loudnessRangeLU:Number(measurement.input_lra)});
}
await writeFile(path.join(dir,'master-report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report.clips,null,2));
