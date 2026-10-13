// Reuse only the unchanged 134.6–173 s daily-life interval of the saved native 4K export.
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {root,playwright,browserPath,browserArgs} from './runtime.mjs';
import {startServer} from './serve.mjs';
const previous=path.join(root,'output/history/pre-planar-20261013/src');
const destination=path.join(root,'output/verification/retained-lives');await mkdir(destination,{recursive:true});
const server=await startServer();let browser;
const times=[134.6,135,137,140,142.5,144,146,149,152,156,158.5,160,162,165,168,170,172,172.966667];
const evidence={passed:false,allowedIntervals:[[134.6,173]],width:3840,height:2160,samples:2,rows:[],sourceSHA256:{}};
try{
 browser=await playwright().chromium.launch({headless:true,executablePath:browserPath(),args:browserArgs});
 const old=await browser.newPage({viewport:{width:3840,height:2160}}),current=await browser.newPage({viewport:{width:3840,height:2160}});
 await old.route('**/src/*.mjs',async route=>{const name=path.basename(new URL(route.request().url()).pathname);await route.fulfill({contentType:'text/javascript',body:await readFile(path.join(previous,name))});});
 for(const page of [old,current]){await page.goto(`http://127.0.0.1:${server.address().port}/render.html?width=3840`);await page.waitForFunction(()=>window.heartbeat?.ready);}
 for(const time of times){
  const frames=[];for(const [i,page] of [old,current].entries()){
   const png=await page.evaluate(t=>{window.heartbeat.frame(t,30,2);return document.querySelector('#film').toDataURL('image/png').split(',')[1];},time);
   frames.push(png);await writeFile(path.join(destination,`${time.toFixed(6)}-${i?'current':'previous'}.png`),Buffer.from(png,'base64'));
  }
  const delta=await current.evaluate(async frames=>{
   const c=document.createElement('canvas');c.width=3840;c.height=2160;const x=c.getContext('2d',{willReadFrequently:true}),images=[];
   for(const png of frames){const image=new Image();image.src='data:image/png;base64,'+png;await image.decode();x.clearRect(0,0,c.width,c.height);x.drawImage(image,0,0);images.push(x.getImageData(0,0,c.width,c.height).data);}
   let sum=0,max=0,count=0;for(let i=0;i<images[0].length;i+=4){let changed=false;for(let k=0;k<3;k++){const d=Math.abs(images[0][i+k]-images[1][i+k]);sum+=d;max=Math.max(max,d);changed||=d>0;}if(changed)count++;}
   return {meanRGBDifference:sum/(3840*2160*3),maxRGBDifference:max,changedPixels:count};
  },frames);
  evidence.rows.push({time,...delta});assert.ok(delta.maxRGBDifference<=2&&delta.changedPixels<100&&delta.meanRGBDifference<.00001,JSON.stringify({time,...delta}));
 }
 for(const file of ['code-maze.mjs','code-lives.mjs','code-ending.mjs','code-direction.mjs','film.mjs','timeline.mjs'])evidence.sourceSHA256[file]=createHash('sha256').update(await readFile(path.join(root,'src',file))).digest('hex');
 evidence.passed=true;evidence.note='Native source pixels compared against the exact saved source snapshot that produced the retained 4K interval. Sparse raster rounding is reported, not called byte identity. Only 134.6–173 s is authorized for reuse.';
}finally{await browser?.close();await new Promise(resolve=>server.close(resolve));await writeFile(path.join(root,'output/verification/retained-lives.json'),JSON.stringify(evidence,null,2));}
console.log(JSON.stringify({passed:evidence.passed,frames:evidence.rows.length,maxChangedPixels:Math.max(...evidence.rows.map(r=>r.changedPixels))}));
