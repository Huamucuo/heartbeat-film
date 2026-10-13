import {writeFile} from 'node:fs/promises';
import path from 'node:path';
import {SUBTITLES} from '../src/timeline.mjs';
import {root} from './runtime.mjs';
const stamp=t=>{
 const ms=Math.round(t*1000),h=Math.floor(ms/3600000),m=Math.floor(ms/60000)%60,s=Math.floor(ms/1000)%60;
 return [h,m,s].map(v=>String(v).padStart(2,'0')).join(':')+','+String(ms%1000).padStart(3,'0');
};
const lines=SUBTITLES;
await writeFile(path.join(root,'docs/dialogue.srt'),lines.map(([a,b,line],i)=>`${i+1}\n${stamp(a)} --> ${stamp(b)}\n${line}\n`).join('\n'),'utf8');
console.log(`Exported ${lines.length} subtitle cues.`);
