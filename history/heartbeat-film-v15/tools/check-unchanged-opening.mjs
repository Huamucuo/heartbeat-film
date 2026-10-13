import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {writeFile,mkdir} from 'node:fs/promises';
import path from 'node:path';
import {startServer as currentServer} from './serve.mjs';
import {startServer as previousServer} from '../../heartbeat-film-v11/tools/serve.mjs';
import {root,playwright,browserPath,browserArgs} from './runtime.mjs';
// Only intervals whose composition and time mapping are unchanged are eligible.
const allowed=[[0,61.5]],rows=[],servers=[await previousServer(),await currentServer()];let browser;
const dest=path.join(root,'output/verification/retained-opening');await mkdir(dest,{recursive:true});
try{
 browser=await playwright().chromium.launch({headless:true,executablePath:browserPath(),args:browserArgs});
 const pages=await Promise.all(servers.map(async s=>{const p=await browser.newPage();await p.goto('http://127.0.0.1:'+s.address().port+'/render.html?width=3840');await p.waitForFunction(()=>window.heartbeat?.ready);return p;}));
 const times=[0,3.5,8,14,23,28.9666666667,29,37,46.9666666667,47,54,60,61.4666666667];
 for(const time of times){
  const data=await Promise.all(pages.map(p=>p.evaluate(t=>{window.heartbeat.frame(t,30,2);return document.querySelector('#film').toDataURL();},time)));
  const hashes=data.map(d=>createHash('sha256').update(d).digest('hex'));
  for(let i=0;i<2;i++)await writeFile(path.join(dest,`${time.toFixed(4)}-${i?'current':'previous'}.png`),Buffer.from(data[i].split(',')[1],'base64'));
  rows.push({time,hashes,identical:hashes[0]===hashes[1]});console.log(JSON.stringify(rows.at(-1)));
 }
}finally{await browser?.close();await Promise.all(servers.map(s=>new Promise(r=>s.close(r))));}
await mkdir(path.join(root,'output/verification'),{recursive:true});
const report={passed:rows.every(r=>r.identical),width:3840,samples:2,allowed,rows,scope:'Source PNG hash comparison only. Any differences require actual pixel comparison before retaining a previous render.'};
await writeFile(path.join(root,'output/verification/unchanged-opening.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({passed:report.passed,samples:rows.length,allowed}));
