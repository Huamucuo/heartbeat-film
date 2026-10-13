import {createHash} from 'node:crypto';
import {writeFile,readFile} from 'node:fs/promises';
import path from 'node:path';
import {startServer} from './serve.mjs';
import {root,playwright,browserPath,browserArgs} from './runtime.mjs';
const server=await startServer();let browser;
try{
 browser=await playwright().chromium.launch({headless:true,executablePath:browserPath(),args:browserArgs});
 const page=await browser.newPage({viewport:{width:1920,height:1080}});await page.goto(`http://127.0.0.1:${server.address().port}/render.html`);await page.waitForFunction(()=>window.heartbeat?.ready);
 const rows=await page.evaluate(async()=>{
  const {codeMaze,mazeDiagnosticsAt}=await import('/src/code-maze.mjs'),{RETURN_RUNS}=await import('/src/code-direction.mjs'),out=[];
  const cv=document.createElement('canvas');cv.width=1920;cv.height=1080;const c=cv.getContext('2d',{willReadFrequently:true});
  for(const index of [6,16,48,71]){
   const run=RETURN_RUNS[index],time=run.end,q=mazeDiagnosticsAt(time),[x,y]=q.origin;
   c.reset();c.fillStyle='#000';c.fillRect(0,0,1920,1080);codeMaze(c,time);const png=cv.toDataURL('image/png').split(',')[1],sourcePixels=[...c.getImageData(x-1,y-1,3,3).data].filter((_,i)=>i%4!==3);
   window.heartbeat.frame(time,30,2);const real=document.querySelector('#film'),exportPixels=[...real.getContext('2d').getImageData(x-1,y-1,3,3).data].filter((_,i)=>i%4!==3);
   const crop=document.createElement('canvas');crop.width=480;crop.height=480;const cc=crop.getContext('2d');cc.imageSmoothingEnabled=false;cc.drawImage(real,x-60,y-60,120,120,0,0,480,480);
   const sequence=document.createElement('canvas');sequence.width=1440;sequence.height=510;const sc=sequence.getContext('2d');sc.fillStyle='#08121c';sc.fillRect(0,0,1440,510);sc.imageSmoothingEnabled=false;
   const times=[time-Math.min(.15,(run.end-run.start)*.18),time,time+.04];
   for(let i=0;i<times.length;i++){window.heartbeat.frame(times[i],30,2);sc.drawImage(real,x-120,y-120,240,240,i*480,0,480,480);sc.fillStyle='#efddd0';sc.font='18px sans-serif';sc.fillText(times[i].toFixed(5)+' s',i*480+12,500);}
   out.push({index,time,position:q.origin,head:q.head,sourcePixels,exportPixels,sequenceTimes:times,png,exportCrop:crop.toDataURL('image/png').split(',')[1],sequence:sequence.toDataURL('image/png').split(',')[1]});
  }return out;
 });
 for(const row of rows){for(const [key,prefix] of [['png','return-source'],['exportCrop','return-export-crop'],['sequence','return-sequence']]){await writeFile(path.join(root,`output/verification/${prefix}-${row.index}.png`),Buffer.from(row[key],'base64'));delete row[key];}}
 const sourceSHA256=Object.fromEntries(await Promise.all(['code-maze.mjs','code-direction.mjs','code-lives.mjs','code-ending.mjs','scenes.mjs','timeline.mjs','film.mjs','drawing.mjs'].map(async name=>[name,createHash('sha256').update(await readFile(path.join(root,'src',name))).digest('hex')])));
 await writeFile(path.join(root,'output/verification/return-visibility-diagnostic.json'),JSON.stringify({scope:'Fixed-planar maze direct source frames, plus actual two-sample source-frame crops and before/arrival/after sequences. This does not replace normal-speed encoded-video review.',sourceSHA256,rows},null,2));console.log(JSON.stringify(rows.map(({index,time,sequenceTimes})=>({index,time,sequenceTimes})),null,2));
}finally{await browser?.close();await new Promise(r=>server.close(r));}
