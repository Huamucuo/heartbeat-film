import {writeFile,mkdir} from 'node:fs/promises';
import {makeScore,EXCERPTS,FPS,SAMPLE_RATE,BPM} from '../src/score.mjs';
await mkdir(new URL('../audio/',import.meta.url),{recursive:true});
await writeFile(new URL('../audio/score.json',import.meta.url),JSON.stringify({fps:FPS,sampleRate:SAMPLE_RATE,bpm:BPM,excerpts:EXCERPTS,events:makeScore()},null,2));
console.log('Shared score exported.');
