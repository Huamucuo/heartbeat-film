import {writeFile} from 'node:fs/promises';
import {SUBTITLES} from '../src/timeline.mjs';
import {playbackTime} from '../src/pacing.mjs';
const stamp=t=>{const v=Math.round(playbackTime(t)*1000);return [Math.floor(v/3600000),Math.floor(v/60000)%60,Math.floor(v/1000)%60].map(n=>String(n).padStart(2,'0')).join(':')+','+String(v%1000).padStart(3,'0');};
await writeFile(new URL('../docs/dialogue.srt',import.meta.url),SUBTITLES.map(([a,b,text],i)=>`${i+1}\n${stamp(a)} --> ${stamp(b)}\n${text}\n`).join('\n'));
