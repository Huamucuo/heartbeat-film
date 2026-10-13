import path from 'node:path';
import {mkdir,writeFile} from 'node:fs/promises';
import {startServer} from './serve.mjs';
import {root,playwright,browserPath,browserArgs} from './runtime.mjs';
const dest=path.join(root,'output/storyboard');await mkdir(dest,{recursive:true});
const server=await startServer();let browser;
try{
 browser=await playwright().chromium.launch({headless:true,executablePath:browserPath(),args:browserArgs});
 const page=await browser.newPage({viewport:{width:1920,height:1080},deviceScaleFactor:1});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(`http://127.0.0.1:${server.address().port}/render.html`);await page.waitForFunction(()=>window.heartbeat?.ready);
 const times=process.argv.slice(2).map(Number);if(!times.length)times.push(1.5,4,7,9,12,16,18,21,25,28,31,35,38,41,45,48,51,55,56.5,57.5,60,64,66,69,73,77,81,84,86,89);
 const frames=[];for(const t of times){
  const data=await page.evaluate(t=>{const state=window.heartbeat.render(t);return {state,png:document.querySelector('#film').toDataURL('image/png').split(',')[1]};},t);
  const name=`t${t.toFixed(3).padStart(6,'0').replace('.','-')}.png`;await writeFile(path.join(dest,name),Buffer.from(data.png,'base64'));frames.push({time:t,name,chapter:data.state.k});console.log(`v07 storyboard ${t}s`);
 }
 if(errors.length)throw new Error(errors.join('\n'));
 await writeFile(path.join(dest,'capture.json'),JSON.stringify({width:1920,height:1080,errors,frames},null,2));
 const html=`<!doctype html><meta charset="utf-8"><style>body{background:#10131a;color:#decbb3;margin:0;font:19px sans-serif}main{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;padding:16px}figure{margin:0}img{width:100%;display:block}figcaption{padding:10px 0 20px}</style><main>${frames.map(f=>`<figure><img src="${f.name}"><figcaption>${f.time.toFixed(2)} s / ${f.chapter+1}</figcaption></figure>`).join('')}</main>`;
 await writeFile(path.join(dest,'index.html'),html);await page.setViewportSize({width:1800,height:1100});await page.goto(`http://127.0.0.1:${server.address().port}/output/storyboard/index.html`);
 for(let i=0;i<Math.ceil(frames.length/9);i++){await page.evaluate(i=>document.querySelectorAll('figure').forEach((e,j)=>e.style.display=j>=i*9&&j<(i+1)*9?'':'none'),i);await page.screenshot({path:path.join(dest,`sheet-${i+1}.png`),fullPage:true});}
}finally{await browser?.close();await new Promise(r=>server.close(r));}


