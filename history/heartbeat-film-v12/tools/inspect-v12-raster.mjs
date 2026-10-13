import {writeFile} from 'node:fs/promises';
import path from 'node:path';
import {startServer} from './serve.mjs';
import {root,playwright,browserPath,browserArgs} from './runtime.mjs';
const server=await startServer();let browser;
try{
 browser=await playwright().chromium.launch({headless:true,executablePath:browserPath(),args:browserArgs});
 const page=await browser.newPage({viewport:{width:1920,height:1080}});
 await page.goto(`http://127.0.0.1:${server.address().port}/render.html`);await page.waitForFunction(()=>window.heartbeat?.ready);
 const report=await page.evaluate(async()=>{
  const {codeMaze}=await import('/src/code-maze.mjs'),{codeLives}=await import('/src/code-lives.mjs'),{endingBackdrop}=await import('/src/code-ending.mjs');
  const film=document.querySelector('#film'),canvases=window.heartbeat.debugCanvases();
  const read=cv=>({data:cv.getContext('2d').getImageData(0,0,cv.width,cv.height).data,width:cv.width,height:cv.height});
  const diff=(a,b)=>{let sum=0,max=0,changed=0,x0=a.width,y0=a.height,x1=0,y1=0;const histogram={};for(let i=0;i<a.data.length;i+=4){let any=false;for(let j=0;j<3;j++){const d=Math.abs(a.data[i+j]-b.data[i+j]);sum+=d;max=Math.max(max,d);histogram[d]=(histogram[d]||0)+1;if(d)any=true;}if(any){changed++;const p=i/4,x=p%a.width,y=Math.floor(p/a.width);x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);}}return{mean:sum/(a.width*a.height*3),max,changed,total:a.width*a.height,bounds:[x0,y0,x1,y1],histogram};};
  const frame=t=>{window.heartbeat.frame(t,30,2);return{film:read(film),world:read(canvases.world),bloom:read(canvases.bloom)};};
  const seeks=[];
  for(const t of[181.5,182,186]){const a=frame(t);frame(195-t*.6);const b=frame(t);seeks.push({time:t,film:diff(a.film,b.film),world:diff(a.world,b.world),bloom:diff(a.bloom,b.bloom)});}
  const sides=[];
  for(const [name,fn]of[['maze',codeMaze],['lives',codeLives]]){const cv=document.createElement('canvas');cv.width=1920;cv.height=1080;const c=cv.getContext('2d',{willReadFrequently:true});const at=t=>{c.reset();c.fillStyle='#000';c.fillRect(0,0,1920,1080);fn(c,t);return read(cv);};sides.push({name,infinitesimal:diff(at(131.25-.00001),at(131.25+.00001)),frameStep:diff(at(131.25-1/60),at(131.25+1/60))});}
  const a=frame(131.25-.00001),b=frame(131.25+.00001);
  const direct=[];
  for(const [name,fn]of[['lives',codeLives],['backdrop',endingBackdrop]])for(const dash of[true,false]){
   const cv=document.createElement('canvas');cv.width=1920;cv.height=1080;const c=cv.getContext('2d',{willReadFrequently:true});
   if(!dash)c.setLineDash=()=>{};
   const at=t=>{c.reset();c.fillStyle='#060c13';c.fillRect(0,0,1920,1080);fn(c,t);return read(cv);};
   const first=at(182+1/240);at(182-1/240);const second=at(182+1/240);direct.push({name,dash,contextResetBeforeEveryDraw:true,difference:diff(first,second)});
  }
  window.heartbeat.render(131.25-.00001);const oneA={film:read(film),world:read(canvases.world),bloom:read(canvases.bloom)};
  window.heartbeat.render(131.25+.00001);const oneB={film:read(film),world:read(canvases.world),bloom:read(canvases.bloom)};
  const worldContext=canvases.world.getContext('2d'),alphaProperty=Object.getOwnPropertyDescriptor(CanvasRenderingContext2D.prototype,'globalAlpha');
  Object.defineProperty(worldContext,'globalAlpha',{configurable:true,get(){return alphaProperty.get.call(this);},set(value){alphaProperty.set.call(this,Math.abs(value-.5)<.0001?.5:value);}});
  window.heartbeat.render(131.25-.00001);const fixedA={film:read(film),world:read(canvases.world)};
  window.heartbeat.render(131.25+.00001);const fixedB={film:read(film),world:read(canvases.world)};
  delete worldContext.globalAlpha;
  return {scope:'Raster root cause isolation; not an approval',seeks,sides,direct,exposure2:{film:diff(a.film,b.film),world:diff(a.world,b.world),bloom:diff(a.bloom,b.bloom)},exposure1:{film:diff(oneA.film,oneB.film),world:diff(oneA.world,oneB.world),bloom:diff(oneA.bloom,oneB.bloom)},exposure1PinnedHalfAlpha:{scope:'Diagnostic runtime only: pin near-0.5 globalAlpha to exactly 0.5 while leaving geometry and all other opacity values unchanged',film:diff(fixedA.film,fixedB.film),world:diff(fixedA.world,fixedB.world)}};
 });
 await writeFile(path.join(root,'output/verification/raster-isolation.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
}finally{await browser?.close();await new Promise(r=>server.close(r));}
