// This job only completes the export already running in this local session.
import {access,writeFile} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import path from 'node:path';
import {root} from './runtime.mjs';
const needed=['heartbeat-v10-tail-4k-render.json','heartbeat-v10-bridge-4k-render.json'];
const exists=async p=>{try{await access(p);return true;}catch{return false;}};
const started=Date.now();
while(!(await Promise.all(needed.map(n=>exists(path.join(root,'output',n))))).every(Boolean)){
 if(Date.now()-started>3600000)throw new Error('Segment export did not complete within the wait limit');
 await new Promise(r=>setTimeout(r,5000));
}
for(const task of ['assemble-edition.mjs','make-viewing-copy.mjs','verify.mjs']){
 console.log('Starting '+task);let output='';
 const p=spawn(process.execPath,[path.join(root,'tools',task)],{cwd:root,windowsHide:true,stdio:['ignore','pipe','pipe']});
 for(const stream of [p.stdout,p.stderr])stream.on('data',b=>{output+=b;process.stdout.write(b);});
 await new Promise((resolve,reject)=>{p.on('error',reject);p.on('close',code=>code===0?resolve():reject(new Error(task+' exited '+code)));});
 await writeFile(path.join(root,'output',task.replace('.mjs','-run.log')),output);
}
console.log('Complete media exported and technically verified; final visual review and packaging remain.');
