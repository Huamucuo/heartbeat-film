import path from 'node:path';
import {mkdir,writeFile,readdir,readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {startServer} from './serve.mjs';
import {root,playwright,browserPath,browserArgs} from './runtime.mjs';
const dest=path.join(root,'output/storyboard');await mkdir(dest,{recursive:true});
const sourceHashes=async()=>Object.fromEntries(await Promise.all(['code-maze.mjs','code-direction.mjs','code-lives.mjs','code-ending.mjs','scenes.mjs','timeline.mjs','film.mjs','drawing.mjs'].map(async name=>[name,createHash('sha256').update(await readFile(path.join(root,'src',name))).digest('hex')])));
const sourceSHA256=await sourceHashes();
const server=await startServer();let browser;
try{
 browser=await playwright().chromium.launch({headless:true,executablePath:browserPath(),args:browserArgs});
 const page=await browser.newPage({viewport:{width:1920,height:1080},deviceScaleFactor:1});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(`http://127.0.0.1:${server.address().port}/render.html`);await page.waitForFunction(()=>window.heartbeat?.ready);
 const args=process.argv.slice(2),refresh=args.includes('--refresh-all');let times=args.filter(a=>a!=='--refresh-all').map(Number);
 if(times.some(t=>!Number.isFinite(t)||t<0||t>=196))throw new Error('Capture times must be finite and within the film');
 if(!times.length)times.push(3.5,14,23,37,54,68,82,95,110,118.5,127,132,136,140,142,144.5,147,148,151,156,158,160.5,163,166,170,174,177,179,181,182.5,188,193,195);
 if(refresh){for(const name of await readdir(dest)){const match=name.match(/^t(\d+)-(\d{3})\.png$/);if(match)times.push(Number(match[1])+Number(match[2])/1000);}times.push(63,70,75,76,84,90,98,103,104,108,111,118,121,124,125,128,130,130.25,130.5,130.64,130.75,131,131.01,131.25,131.5,131.9,132,132.15,132.6,133,134,134.6,194.5,195.966667);}
 times=[...new Map(times.map(t=>[t.toFixed(3),t])).values()].sort((a,b)=>a-b);
 if(refresh)times=[...new Set([...times,129.4,129.433333,129.466667,129.6,174.5,176.5,177.4,178.2,180.8,181.4,183,186,189.9,193.78,194.3])].sort((a,b)=>a-b);
 const frames=[];for(const t of times){
  const data=await page.evaluate(t=>{const state=window.heartbeat.frame(t,30,2);return {state,png:document.querySelector('#film').toDataURL('image/png').split(',')[1]};},t);
  const name=`t${t.toFixed(3).padStart(6,'0').replace('.','-')}.png`;await writeFile(path.join(dest,name),Buffer.from(data.png,'base64'));frames.push({time:t,name,chapter:data.state.k});console.log(`v12 storyboard ${t}s`);
 }
 if(errors.length)throw new Error(errors.join('\n'));
 if(JSON.stringify(sourceSHA256)!==JSON.stringify(await sourceHashes()))throw new Error('Source changed during storyboard capture; refresh after the source is frozen');
 await writeFile(path.join(dest,'capture.json'),JSON.stringify({width:1920,height:1080,samples:2,refreshExisting:refresh,sourceSHA256,errors,frames},null,2));
 const html=`<!doctype html><meta charset="utf-8"><style>body{background:#10131a;color:#decbb3;margin:0;font:19px sans-serif}main{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;padding:16px}figure{margin:0}img{width:100%;display:block}figcaption{padding:10px 0 20px}</style><main>${frames.map(f=>`<figure><img src="${f.name}"><figcaption>${f.time.toFixed(2)} s / ${f.chapter+1}</figcaption></figure>`).join('')}</main>`;
 await writeFile(path.join(dest,'index.html'),html);await page.setViewportSize({width:1800,height:1100});await page.goto(`http://127.0.0.1:${server.address().port}/output/storyboard/index.html`);
 for(let i=0;i<Math.ceil(frames.length/9);i++){await page.evaluate(i=>document.querySelectorAll('figure').forEach((e,j)=>e.style.display=j>=i*9&&j<(i+1)*9?'':'none'),i);await page.screenshot({path:path.join(dest,`sheet-${i+1}.png`),fullPage:true});}
}finally{await browser?.close();await new Promise(r=>server.close(r));}


