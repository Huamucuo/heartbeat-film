import assert from 'node:assert/strict';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {startServer} from './serve.mjs';
import {root,playwright,browserPath,browserArgs} from './runtime.mjs';
import {RETURN_RUNS,STOP_TIME,MODULE_CENTRES} from '../src/code-direction.mjs';
import {verifyPlanMaze} from './verify-maze-plan.mjs';

const dir=path.join(root,'output/verification');await mkdir(dir,{recursive:true});
const server=await startServer();let browser;
const report={renderedReturns:[],mazePlanMotion:null,mazeStages:[],subjectMotion:[],moduleMotion:[],motionSheets:[],errors:[],note:'Scene-only pixel differences exclude shared starfield/grain and subtitles. The maze uses a fixed full-frame planar projection. Real Canvas head/line operations and resulting pixels are checked for returns, nine-region distribution, independent movement timing, continuing searches and the large handoff. Diagnostics associate route IDs with actual paint operations; metadata alone is not considered painted evidence. Ending background ECG is rendered independently of the moving heart. Authored final stillness is excluded from active-motion checks. These are source-render measurements and review frames, not encoded-video or subjective listening certification.'};
const sourceHashes=async()=>Object.fromEntries(await Promise.all(['code-maze.mjs','code-direction.mjs','code-lives.mjs','code-ending.mjs','scenes.mjs','timeline.mjs','film.mjs','drawing.mjs'].map(async name=>[name,createHash('sha256').update(await readFile(path.join(root,'src',name))).digest('hex')])));
report.sourceSHA256=await sourceHashes();
try{
 browser=await playwright().chromium.launch({headless:true,executablePath:browserPath(),args:browserArgs});
 const page=await browser.newPage({viewport:{width:1920,height:1080}});page.on('pageerror',e=>report.errors.push(e.message));
 const url=`http://127.0.0.1:${server.address().port}`;
 await page.goto(url+'/render.html');await page.waitForFunction(()=>window.heartbeat?.ready);
 const motionResult=await page.evaluate(async({stopTime,centres})=>{
  const {firstImpulse,pair}=await import('/src/scenes.mjs'),{records}=await import('/src/archive.mjs'),{city}=await import('/src/city.mjs'),{codeLives}=await import('/src/code-lives.mjs'),{codeMaze}=await import('/src/code-maze.mjs'),{endingBackgroundECG,endingBackdrop}=await import('/src/code-ending.mjs'),{storyTime}=await import('/src/timeline.mjs');
  const canvas=document.createElement('canvas');canvas.width=480;canvas.height=270;const c=canvas.getContext('2d',{willReadFrequently:true});
  const at=t=>{c.reset();c.scale(.25,.25);c.fillStyle='#000';c.fillRect(0,0,1920,1080);const v=storyTime(t);firstImpulse(c,v);records(c,v);city(c,v);pair(c,v);codeMaze(c,t);codeLives(c,t);return c.getImageData(0,0,480,270).data;};
  const out=[];
  for(let t=1;t<stopTime-.25;t+=1){const a=at(t),b=at(t+.25);let sum=0,changed=0;for(let i=0;i<a.length;i+=4){const d=Math.max(Math.abs(a[i]-b[i]),Math.abs(a[i+1]-b[i+1]),Math.abs(a[i+2]-b[i+2]));sum+=d;if(d>2)changed++;}out.push({time:t,mean:sum/(480*270),changedFraction:changed/(480*270)});}
  const modules=[];
  for(const t of [134,138,143,148,153,158,163,168,171]){
   const a=at(t),b=at(t+.35);
   for(let id=0;id<centres.length;id++){
    const [cx,cy]=centres[id].map(v=>v*.25);let sum=0,changed=0,count=0;
    for(let y=Math.round(cy-27);y<Math.round(cy+27);y++)for(let x=Math.round(cx-52);x<Math.round(cx+52);x++){
     const k=(y*480+x)*4,d=Math.max(Math.abs(a[k]-b[k]),Math.abs(a[k+1]-b[k+1]),Math.abs(a[k+2]-b[k+2]));sum+=d;if(d>2)changed++;count++;
    }
    modules.push({time:t,id,mean:sum/count,changedFraction:changed/count});
   }
  }
  const backgroundAt=t=>{c.reset();c.scale(.25,.25);c.fillStyle='#000';c.fillRect(0,0,1920,1080);endingBackgroundECG(c,t,1);return c.getImageData(0,0,480,270).data;};
  const backgroundDifference=(a,b)=>{let sum=0,changed=0,ink=0;for(let i=0;i<a.length;i+=4){const d=Math.max(Math.abs(a[i]-b[i]),Math.abs(a[i+1]-b[i+1]),Math.abs(a[i+2]-b[i+2]));sum+=d;if(d>2)changed++;if(Math.max(a[i],a[i+1],a[i+2])>5)ink++;}return {mean:sum/(480*270),changedFraction:changed/(480*270),inkPixels:ink};};
  const endingBackgroundMotion=[183,185,188,191,193.3,194.1].map(time=>({time,...backgroundDifference(backgroundAt(time),backgroundAt(time+.15))}));
  const endingBackgroundStopped=backgroundDifference(backgroundAt(stopTime),backgroundAt(195.8));
  // Inspect actual window fills and their final pixels in the isolated city,
  // rather than treating the heart or an exported dimming scalar as evidence.
  const cityCanvas=document.createElement('canvas');cityCanvas.width=1920;cityCanvas.height=1080;
  const cityContext=cityCanvas.getContext('2d',{willReadFrequently:true}),fill=cityContext.fillRect.bind(cityContext);let windows=[];
  cityContext.fillRect=(x,y,w,h)=>{fill(x,y,w,h);if(w>1&&w<40&&h>1&&h<40)windows.push([x+w/2,y+h/2]);};
  const cityWindows=[183,187,188,190,191,192,193.4,194.1,stopTime].map(time=>{
   cityContext.reset();cityContext.fillStyle='#000';fill(0,0,1920,1080);windows=[];endingBackdrop(cityContext,time,1);
   const pixels=cityContext.getImageData(0,0,1920,1080).data;
   const bright=windows.filter(([x,y])=>{const k=(Math.round(y)*1920+Math.round(x))*4;return pixels[k]>5&&pixels[k]>pixels[k+2]*1.1;});
   return {time,paintedWindowFills:windows.length,visibleWarmWindowCentres:bright.length};
  });
  return {subjectMotion:out,moduleMotion:modules,endingBackgroundMotion,endingBackgroundStopped,cityWindows};
 },{stopTime:STOP_TIME,centres:MODULE_CENTRES});
 report.subjectMotion=motionResult.subjectMotion;report.moduleMotion=motionResult.moduleMotion;report.endingBackgroundMotion=motionResult.endingBackgroundMotion;report.endingBackgroundStopped=motionResult.endingBackgroundStopped;report.cityWindows=motionResult.cityWindows;
 // The background deliberately loses amplitude and brightness before the stop.
 // Require visible ink and measured motion, not a minimum density that would
 // incorrectly reject that authored weakening at the 480px inspection scale.
 for(const r of report.endingBackgroundMotion)assert.ok(r.inkPixels>0&&r.mean>.001&&r.changedFraction>.00001,`Ending ECG background stays inert near ${r.time}s`);
 assert.equal(report.endingBackgroundStopped.mean,0,'Ending ECG background must stop at the same time as the heart');
 assert.ok(report.cityWindows[0].visibleWarmWindowCentres>20,'The city begins without visible occupied windows');
 assert.equal(report.cityWindows.at(-1).paintedWindowFills,0,'Window lights remain lit after the final stop');
 assert.ok(report.cityWindows.slice(1).every((r,i)=>r.paintedWindowFills<=report.cityWindows[i].paintedWindowFills),'Window extinction unexpectedly reverses');
 for(let id=0;id<9;id++){const rows=report.moduleMotion.filter(r=>r.id===id),moving=rows.filter(r=>r.mean>.025&&r.changedFraction>.0003);assert.ok(moving.length>=7,`Module ${id} stays inert in ${rows.length-moving.length} sampled windows`);}

 for(const r of report.subjectMotion)assert(r.mean>.025&&r.changedFraction>.0003,`Held subject near ${r.time}s: ${JSON.stringify(r)}`);
 const planar=await verifyPlanMaze(page,RETURN_RUNS);
 report.renderedReturns=planar.returns;report.mazeStages=planar.stages;report.mazePlanMotion={fixedProjection:planar.fixedProjection,lateSearchMotion:planar.lateSearchMotion,independentTiming:planar.independentTiming,handoff:planar.handoff};
 report.returnVisibility={brightOriginPatchCount:planar.returns.filter(r=>r.brightPixels>=4).length,dimOriginPatchCount:planar.returns.filter(r=>r.brightPixels<4).length,note:'Actual primary head painting, its preceding motion and arrival at the common origin are checked. The hollow calendar glyphs are behind the walls and routes; final origin-patch brightness is also recorded after all compositing. Chinese origin markers are not required.'};

 const pixels=async t=>page.evaluate(t=>{window.heartbeat.frame(t,30,2);return document.querySelector('#film').toDataURL('image/png').split(',')[1];},t);
 for(const [name,times] of [
  ['opening-ecg',[3,3.25,3.5,4,4.25,4.5,5,5.25,5.5]],
  ['live-ecg',[14,14.25,14.5,17,17.25,17.5,24,24.25,24.5]],
  ['maze',[63,67,72,78,84,90,98,103,107]],
  ['maze-overview',[105,109,113,117,121,123,125,128,130.5]],
  ['maze-calendar',[RETURN_RUNS[0].end-.04,RETURN_RUNS[0].end+.05,RETURN_RUNS[0].end+.13,RETURN_RUNS[35].end-.04,RETURN_RUNS[35].end+.05,RETURN_RUNS[35].end+.13,RETURN_RUNS.at(-1).end-.1,RETURN_RUNS.at(-1).end-2/30,RETURN_RUNS.at(-1).end-1/30]],
  ['handoff',[130,130.25,130.5,130.75,131,131.25,131.5,132,134]],
  ['together',[134,138,143,144.5,148,156,160,164,170]],
  
  
  ['release',[173,175,177,179,181,183,187,191,194.5]],
  ['rotation',[173,174.5,176,177.5,179,180.5,182,184,187]],
  ['terminal',[191,192.84,192.94,193.27,193.36,194.02,194.19,194.5,195.966667]]
 ]){
  const shots=[];
  for(const t of times){const name2=`motion-${name}-${t.toFixed(2).replace('.','-')}.png`;await writeFile(path.join(dir,name2),Buffer.from(await pixels(t),'base64'));shots.push({name:name2,t});}
  await page.setViewportSize({width:1800,height:1100});
  await page.setContent('<style>body{margin:12px;background:#10131b;color:#eee;font:20px sans-serif}main{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}figure{margin:0}img{width:100%}</style><main>'+shots.map(s=>`<figure><img src="${url}/output/verification/${s.name}"><figcaption>${s.t.toFixed(2)} s</figcaption></figure>`).join('')+'</main>');
  await page.waitForFunction(()=>[...document.images].every(i=>i.complete));
  const sheet=`motion-${name}-sheet.png`;await page.screenshot({path:path.join(dir,sheet),fullPage:true});report.motionSheets.push(sheet);
  await page.goto(url+'/render.html');await page.waitForFunction(()=>window.heartbeat?.ready);
 }
 assert.deepEqual(await sourceHashes(),report.sourceSHA256,'Source changed during verification; rerun after the final freeze'); assert.deepEqual(report.errors,[]);report.passed=true;
}catch(error){report.passed=false;report.errors.push(error.stack||String(error));}finally{await browser?.close();await new Promise(r=>server.close(r));}
await writeFile(path.join(dir,'motion.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({passed:report.passed,subjectMotion:{samples:report.subjectMotion.length,minMean:Math.min(...report.subjectMotion.map(r=>r.mean)),minChangedFraction:Math.min(...report.subjectMotion.map(r=>r.changedFraction))},moduleSamples:report.moduleMotion.length,planarReturns:report.renderedReturns.length,maxOriginError:Math.max(...report.renderedReturns.map(r=>r.originError)),mazeStages:report.mazeStages,endingBackground:report.endingBackgroundMotion,errors:report.errors},null,2));
assert.equal(report.passed,true,'Inspect motion.json for measured motion and return failures');
