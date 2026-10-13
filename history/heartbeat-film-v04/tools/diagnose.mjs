import {mkdir,writeFile} from 'node:fs/promises';
import {startServer} from './serve.mjs';
import {playwright,browserPath,browserArgs,root} from './runtime.mjs';
const s=await startServer();let b;
try{b=await playwright().chromium.launch({headless:true,executablePath:browserPath(),args:browserArgs});const p=await b.newPage({viewport:{width:1920,height:1080}});await p.goto(`http://127.0.0.1:${s.address().port}/render.html`);await p.waitForFunction(()=>window.heartbeat?.ready);
const result=await p.evaluate(()=>{
 const get=t=>{window.heartbeat.frame(t,30,2);return document.querySelector('#film').getContext('2d').getImageData(0,0,1920,1080).data;};
 const debug=()=>Object.fromEntries(Object.entries(window.heartbeat.debugCanvases()).map(([k,c])=>[k,c.getContext('2d').getImageData(0,0,c.width,c.height).data]));
 const a=get(3.5),da=debug(),b=get(3.5),db=debug();get(86.9);const d=get(3.5),e=get(3.5);
 function diff(x,y){let n=0,max=0,sum=0,x0=1920,y0=1080,x1=0,y1=0;for(let i=0;i<x.length;i+=4){let dd=0;for(let k=0;k<3;k++){const v=Math.abs(x[i+k]-y[i+k]);dd=Math.max(dd,v);sum+=v;}if(dd){n++;max=Math.max(max,dd);const px=(i/4)%1920,py=Math.floor(i/4/1920);x0=Math.min(x0,px);x1=Math.max(x1,px);y0=Math.min(y0,py);y1=Math.max(y1,py);}}return {n,max,mean:sum/(1920*1080*3),bounds:[x0,y0,x1,y1]};}
 return {consecutive:diff(a,b),layers:Object.fromEntries(Object.keys(da).map(k=>[k,diff(da[k],db[k])])),afterSeek:diff(b,d),again:diff(d,e),fonts:document.fonts.status};
});console.log(JSON.stringify(result,null,2));
}finally{await b?.close();await new Promise(r=>s.close(r));}
