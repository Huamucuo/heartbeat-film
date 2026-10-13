import {mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {startServer} from './serve.mjs';
import {playwright,browserPath,browserArgs,root} from './runtime.mjs';
const server=await startServer();let browser;
try{
  browser=await playwright().chromium.launch({headless:true,executablePath:browserPath(),args:browserArgs});
  const page=await browser.newPage({viewport:{width:1920,height:1080},deviceScaleFactor:1});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await page.goto(`http://127.0.0.1:${server.address().port}/render.html`);
  await page.waitForFunction(()=>window.heartbeat?.ready,{timeout:30000});
  const times=process.argv.slice(2).map(Number);if(!times.length)times.push(17.5,18.75,20,22.4667,55,56.9,57.2,57.6,59,62,64.9667);
  const out=path.join(root,'output/contact');await mkdir(out,{recursive:true});const states=[];
  for(const t of times){
    const state=await page.evaluate(t=>window.heartbeat.seek(t),t);states.push(state);
    await page.locator('#film').screenshot({path:path.join(out,`t${t.toFixed(4).replace('.','-')}.png`)});console.log(`frame ${t.toFixed(4)}s: origin ${state.origin.map(x=>x.toFixed(1))}`);
  }
  await writeFile(path.join(out,'states.json'),JSON.stringify({errors,states},null,2));
  if(errors.length)throw new Error(errors.join('\n'));console.log('Contact frames complete.');
}finally{await browser?.close();await new Promise(r=>server.close(r));}
