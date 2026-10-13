import {writeFile} from 'node:fs/promises';
import path from 'node:path';
import {EVENTS,CHAPTERS} from '../src/score.mjs';
import {root} from './runtime.mjs';
const q=s=>'"'+String(s??'').replaceAll('"','""')+'"';
const rows=[['time_seconds','chapter','voice','note_midi','amplitude','pan','duration_seconds','source','node','from','to'],...EVENTS.map(e=>[e.time,CHAPTERS.find(c=>e.time>=c.start&&e.time<c.end)?.zh,e.voice,e.notes?.join(' / ')||e.note,e.amp,e.pan,e.duration,e.source,e.node,e.from,e.to])];
await writeFile(path.join(root,'audio/cue-sheet.csv'),'\uFEFF'+rows.map(r=>r.map(q).join(',')).join('\r\n'),'utf8');
console.log(`${EVENTS.length} cues exported.`);
