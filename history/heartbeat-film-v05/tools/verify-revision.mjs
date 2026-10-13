import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {startServer} from './serve.mjs';
import {startServer as startPrevious} from '../../heartbeat-film-v04/tools/serve.mjs';
import {root,playwright,browserPath,browserArgs} from './runtime.mjs';
import {seedPoint,nodePoint} from '../src/afterwards.mjs';
const dir=path.join(root,'output/verification');await mkdir(dir,{recursive:true});
const current=await startServer(),previous=await startPrevious();let browser;
const report={preservedFrames:[],dateOnlyChanges:[],seedContinuity:[],motionSheets:[],errors:[]};
try{
 browser=await playwright().chromium.launch({headless:true,executablePath:browserPath(),args:browserArgs});
 const pages=await Promise.all([current,previous].map(async server=>{const p=await browser.newPage({viewport:{width:1920,height:1080}});p.on('pageerror',e=>report.errors.push(e.message));await p.goto(`http://127.0.0.1:${server.address().port}/render.html`);await p.waitForFunction(()=>window.heartbeat?.ready);return p;}));
 const pixels=(p,t)=>p.evaluate(t=>{window.heartbeat.frame(t,30,2);return document.querySelector('#film').toDataURL('image/png').split(',')[1];},t);
 for(const t of [3.5,7,9,18.5,22,28,32,36,37.25]){
  const pair=await Promise.all(pages.map(p=>pixels(p,t))),hash=pair.map(s=>createHash('sha256').update(s).digest('hex'));assert.equal(hash[0],hash[1],`Unexpected early-frame change at ${t}`);report.preservedFrames.push({time:t,sha256:hash[0]});
 }
 for(const t of [12,15]){
  const pngs=await Promise.all(pages.map(p=>pixels(p,t)));
  const delta=await pages[0].evaluate(async pngs=>{
   const data=[];for(const s of pngs){const img=new Image();img.src='data:image/png;base64,'+s;await img.decode();const c=document.createElement('canvas');c.width=1920;c.height=1080;const ctx=c.getContext('2d');ctx.drawImage(img,0,0);data.push(ctx.getImageData(0,0,1920,1080).data);}
   let outside=0,inside=0;for(let y=0;y<1080;y++)for(let x=0;x<1920;x++){const k=(y*1920+x)*4,d=Math.max(...[0,1,2].map(o=>Math.abs(data[0][k+o]-data[1][k+o])));if(d>2){if(x>=880&&x<=1140&&y>=580&&y<=680)inside++;else outside++;}}return {inside,outside};
  },pngs);assert.equal(delta.outside,0);assert(delta.inside>0);report.dateOnlyChanges.push({time:t,...delta});
 }
 for(const t of [55,57.5,59.375]){const a=seedPoint(t-1e-5),b=seedPoint(t+1e-5),distance=Math.hypot(a[0]-b[0],a[1]-b[1]);assert(distance<.1);report.seedContinuity.push({time:t,distance});}
 assert(Math.hypot(...seedPoint(57.5).map((v,i)=>v-nodePoint(0,57.5)[i]))<1e-8);
 // Half-second sequences expose turns and transfer, rather than only shot endpoints.
 for(const [name,from,to,step] of [['walks',37.5,48,.5],['handoff',54.5,60,.25],['voices',64,80,1]]){
  const shots=[];for(let t=from;t<=to+1e-6;t+=step){const file=`motion-${name}-${t.toFixed(2).replace('.','-')}.png`;await writeFile(path.join(dir,file),Buffer.from(await pixels(pages[0],t),'base64'));shots.push({file,t});}
  for(let k=0;k<shots.length;k+=9){const part=shots.slice(k,k+9);await pages[0].setContent('<style>body{margin:12px;background:#10131b;color:#eee;font:20px sans-serif}main{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}figure{margin:0}img{width:100%}</style><main>'+part.map(s=>`<figure><img src="http://127.0.0.1:${current.address().port}/output/verification/${s.file}"><figcaption>${s.t.toFixed(2)} s</figcaption></figure>`).join('')+'</main>');await pages[0].waitForFunction(()=>[...document.images].every(i=>i.complete));const sheet=`motion-${name}-sheet-${k/9+1}.png`;await pages[0].screenshot({path:path.join(dir,sheet),fullPage:true});report.motionSheets.push(sheet);}
  await pages[0].goto(`http://127.0.0.1:${current.address().port}/render.html`);await pages[0].waitForFunction(()=>window.heartbeat?.ready);
 }
 assert.deepEqual(report.errors,[]);report.passed=true;
}finally{await browser?.close();await Promise.all([current,previous].map(s=>new Promise(r=>s.close(r))));}
await writeFile(path.join(dir,'revision.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
