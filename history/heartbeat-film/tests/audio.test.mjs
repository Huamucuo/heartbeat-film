import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import path from 'node:path';
import {root,ffmpegPath} from '../tools/runtime.mjs';
import {EXCERPTS} from '../src/score.mjs';
for(const ex of EXCERPTS)test(`${ex.id} mastered WAV has the exact sample count and audible sound`,()=>{
  const r=spawnSync(ffmpegPath(),['-v','error','-i',path.join(root,'audio/generated',ex.id+'-master.wav'),'-f','f32le','-c:a','pcm_f32le','pipe:1'],{windowsHide:true,maxBuffer:12e6});
  assert.equal(r.status,0,r.stderr?.toString());
  assert.equal(r.stdout.length,(ex.end-ex.start)*48000*2*4);
  let sum=0,peak=0;for(let i=0;i<r.stdout.length;i+=4){const x=r.stdout.readFloatLE(i);assert.ok(Number.isFinite(x));sum+=x*x;peak=Math.max(peak,Math.abs(x));}
  const rms=Math.sqrt(sum/(r.stdout.length/4));
  assert.ok(rms>.015,`Silent or unexpectedly quiet mix: RMS ${rms}`);
  assert.ok(peak<.92,`Insufficient headroom: ${peak}`);
});
