import {writeFile,mkdir} from 'node:fs/promises';
import path from 'node:path';
import {SCORE} from '../src/score.mjs';
import {root} from './runtime.mjs';
await mkdir(path.join(root,'audio'),{recursive:true});await writeFile(path.join(root,'audio/score.json'),JSON.stringify(SCORE,null,2));console.log(`${SCORE.events.length} events, ${SCORE.duration} seconds.`);

