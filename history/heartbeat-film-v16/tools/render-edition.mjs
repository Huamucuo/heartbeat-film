// Sequential native exports avoid two encoders competing for the same cores.
import {spawn} from 'node:child_process';
import {writeFile,readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {root} from './runtime.mjs';
const frozen={};
for(const file of ['code-maze.mjs','code-lives.mjs','code-ending.mjs','code-direction.mjs','timeline.mjs','scenes.mjs'])frozen[file]=createHash('sha256').update(await readFile(path.join(root,'src',file))).digest('hex');
const tasks=[
 ['render.mjs','--from','61.5','--to','134.6','--width','3840','--workers','3','--samples','2','--crf','13','--out','heartbeat-v12-planar-4k.mp4'],
 ['render.mjs','--from','173','--to','196','--width','3840','--workers','3','--samples','2','--crf','13','--out','heartbeat-v12-ending-4k.mp4'],
 ['assemble-edition.mjs'],['make-viewing-copy.mjs'],['verify.mjs']
];
for(const task of tasks){
 for(const [file,sha] of Object.entries(frozen))if(createHash('sha256').update(await readFile(path.join(root,'src',file))).digest('hex')!==sha)throw Error('Source changed during export: '+file);
 console.log('Starting '+task.join(' '));let output='';
 const p=spawn(process.execPath,[path.join(root,'tools',task[0]),...task.slice(1)],{cwd:root,windowsHide:true,stdio:['ignore','pipe','pipe']});
 for(const stream of [p.stdout,p.stderr])stream.on('data',b=>{output+=b;process.stdout.write(b);});
 await new Promise((resolve,reject)=>{p.on('error',reject);p.on('close',code=>code===0?resolve():reject(Error(task[0]+' exited '+code)));});
 const logName=task[0]==='render.mjs'?task.at(-1).replace('.mp4','-run.log'):task[0].replace('.mjs','-run.log');
 await writeFile(path.join(root,'output',logName),output);
}
console.log('Full exports and technical verification completed. Encoded visual review and packaging remain.');
