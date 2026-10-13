import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {EXCERPTS,FPS} from '../src/score.mjs';
import {root,ffmpegPath} from './runtime.mjs';
function ff(args){return new Promise((resolve,reject)=>{
  const p=spawn(ffmpegPath(),['-hide_banner','-nostdin',...args],{windowsHide:true});let out='',err='';
  p.stdout.on('data',b=>out+=b);p.stderr.on('data',b=>err+=b);p.on('error',reject);p.on('close',c=>c?reject(new Error(err)):resolve({out,err}));
});}
const report={checked:new Date().toISOString(),clips:[]};const qa=path.join(root,'output/verification');await mkdir(qa,{recursive:true});
for(const ex of EXCERPTS){
  const file=path.join(root,'output',ex.id+'.mp4');
  const {out,err}=await ff(['-i',file,'-map','0:v:0','-an','-f','framemd5','-']);
  const frames=out.split('\n').filter(l=>/^0,/.test(l));
  assert.equal(frames.length,(ex.end-ex.start)*FPS,'Frame count');
  assert.match(out,/#dimensions 0: 1920x1080/);assert.match(out,/#tb 0: 1\/30/);
  assert.match(err,/yuv420p\(tv, bt709/,'BT.709 limited-range encoding');
  assert.match(err,/Audio: aac.*48000 Hz, stereo/);
  const hashes=frames.map(l=>l.split(',').at(-1).trim());
  assert.ok(new Set(hashes).size>frames.length*.9,'Frozen frames');
  await writeFile(path.join(qa,ex.id+'.framemd5'),out);
  const loud=await ff(['-i',file,'-vn','-af','loudnorm=I=-16:TP=-1:LRA=9:print_format=json','-f','null','-']);
  const measured=JSON.parse(loud.err.match(/\{\s*"input_i"[\s\S]*?\}/)[0]);
  const i=Number(measured.input_i),tp=Number(measured.input_tp);
  assert.ok(Number.isFinite(i)&&i>-19&&i<-13,`Unexpected loudness ${i}`);
  assert.ok(Number.isFinite(tp)&&tp<=-1,`True peak ${tp}`);
  const points=ex.id==='01-emergence'?[0,2.5,4.9666667]:[0,1.8666667,2.2,2.5,4,9.9666667];
  for(const t of points)await ff(['-y','-i',file,'-ss',String(t),'-frames:v','1',path.join(qa,ex.id+'-'+t.toFixed(3)+'.png')]);
  report.clips.push({id:ex.id,frameCount:frames.length,width:1920,height:1080,fps:30,duration:ex.end-ex.start,uniqueFrames:new Set(hashes).size,integratedLUFS:i,truePeakDBTP:tp,audio:'AAC 48000 Hz stereo',color:'BT.709 limited range',decodedContactTimes:points});
}
report.passed=true;await writeFile(path.join(qa,'media-report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
