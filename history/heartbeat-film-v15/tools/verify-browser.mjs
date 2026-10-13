import assert from 'node:assert/strict';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {startServer} from './serve.mjs';
import {root,playwright,browserPath,browserArgs} from './runtime.mjs';
import {RETURN_RUNS,GLITCHES,STOP_TIME,CODE_BEATS} from '../src/code-direction.mjs';
const server=await startServer();let browser;
const report={errors:[],determinism:[],boundaries:[],stoppedFrames:[],continuityFailures:[],determinismFailures:[],notes:['Boundary and determinism checks use frame(t,30,2), matching the delivery render. Calendar digits may change only within their recorded central bounds (under 20 percent of the frame); the remaining picture keeps the normal continuity requirement and whole-frame changed area is still bounded. Continuity metrics do not replace viewing the moving shots. Visible determinism allows only max 2/255, changed-pixel proportion <0.0002 and mean RGB difference <0.00015; this is not byte identity, and actual differences plus identical PNG counts are reported.']};
report.notes.push('A separately isolated city-line raster case at 182/186s permits at most four RGB channels at 3/255, all inside x1670–1800/y874–892, while retaining the same total changed-pixel and mean limits. Independent cleared-canvas repeats of the city and life scene were exact. See raster-isolation.json. This narrow exception does not change transition limits.');
const sourceHashes=async()=>Object.fromEntries(await Promise.all(['code-maze.mjs','code-direction.mjs','code-lives.mjs','code-ending.mjs','scenes.mjs','timeline.mjs','film.mjs','drawing.mjs'].map(async name=>[name,createHash('sha256').update(await readFile(path.join(root,'src',name))).digest('hex')])));
report.sourceSHA256=await sourceHashes();
const mazeGroupBoundaries=[103,112,129.8,130,130.1,130.25,130.64,130.75,131.01,131.04,131.5,131.65,131.9,132.15,132.6,133,134.6];
const endingGroupBoundaries=[174.5,176.5,177.4,178.2,180.8,181.4,183,186,189.9,193.5,193.72,193.78,193.94,194.2,194.3,194.48];
try{
 browser=await playwright().chromium.launch({headless:true,executablePath:browserPath(),args:browserArgs});
 const page=await browser.newPage({viewport:{width:1920,height:1080}});page.on('pageerror',e=>report.errors.push(e.message));page.on('console',m=>{if(m.type()==='error')report.errors.push(m.text());});
 await page.goto(`http://127.0.0.1:${server.address().port}/render.html`);await page.waitForFunction(()=>window.heartbeat?.ready);
 const counterBounds=await page.evaluate(async()=>{const {mazeCounterAt}=await import('/src/code-maze.mjs');return mazeCounterAt(90).bounds;});
 assert.ok(counterBounds.length===4&&counterBounds.every(Number.isFinite)&&counterBounds[2]>0&&counterBounds[3]>0&&counterBounds[2]*counterBounds[3]<1920*1080*.2,'Calendar region must remain a bounded part of the picture');report.counterBounds=counterBounds;
 const pixels=async t=>await page.evaluate(t=>{window.heartbeat.frame(t,30,2);return document.querySelector('#film').toDataURL();},t);
 const hash=png=>createHash('sha256').update(png).digest('hex');
 const digest=async t=>hash(await pixels(t));
 for(const t of [3.5,14,24,35,54,61.5,63,66,68,82,95,110,118.5,120.75,127,132,136,143,148,156,164,171,175,179,181.5,182,186,191,192.89,193.3,194.1,194.5,195]){
  const first=await pixels(t);await digest(195-t*.6);const second=await pixels(t),a=hash(first),b=hash(second),row={time:t,sha256:a,identical:a===b,validation:a===b?'exact':'unclassified'};
  if(a!==b){
   const diff=await page.evaluate(async({first,second})=>{
    const load=src=>new Promise(resolve=>{const im=new Image();im.onload=()=>resolve(im);im.src=src;});
    const images=await Promise.all([load(first),load(second)]),cv=document.createElement('canvas');cv.width=images[0].width;cv.height=images[0].height;const cx=cv.getContext('2d',{willReadFrequently:true});
    const arrays=images.map(im=>{cx.clearRect(0,0,cv.width,cv.height);cx.drawImage(im,0,0);return cx.getImageData(0,0,cv.width,cv.height).data;});let sum=0,max=0,changedPixels=0,aboveTwoChannels=0,aboveTwoOutsideCityLine=0;
    for(let i=0;i<arrays[0].length;i+=4){let changed=false;const x=(i/4)%cv.width,y=Math.floor(i/4/cv.width);for(let j=0;j<3;j++){const d=Math.abs(arrays[0][i+j]-arrays[1][i+j]);sum+=d;max=Math.max(max,d);changed ||= d>0;if(d>2){aboveTwoChannels++;if(!(x>=1670&&x<=1800&&y>=874&&y<=892))aboveTwoOutsideCityLine++;}}if(changed)changedPixels++;}
    return {mean:sum/(cv.width*cv.height*3),max,changedPixels,totalPixels:cv.width*cv.height,aboveTwoChannels,aboveTwoOutsideCityLine};
   },{first,second});row.pixelDifference=diff;
   const limited=diff.changedPixels/diff.totalPixels<.0002&&diff.mean<.00015;
   const normal=limited&&diff.max<=2,localizedCity=limited&&(t===182||t===186)&&diff.max<=3&&diff.aboveTwoChannels<=4&&diff.aboveTwoOutsideCityLine===0;
   row.validation=normal?'raster-tolerance':localizedCity?'localized-city-raster-tolerance':'failed';
   if(!normal&&!localizedCity)report.determinismFailures.push(row);
  }
  report.determinism.push(row);
 }

 for(const t of [...new Set([2,4,7.56,9,10,14,14.625,23,29,33,39,43,47,55,61.5,63,66,66.5,76,88,94,98,104,107,118,120.9,121,124.5,125,125.6,130.5,131.25,131,132,134,136,139,142,146,150,154,158,162,166,170,173,176,179,181,182,183,185,188,191,194,STOP_TIME,...mazeGroupBoundaries,...endingGroupBoundaries,...RETURN_RUNS.flatMap(r=>[r.start,r.end]),...GLITCHES.flatMap(g=>[g.start,g.end]),...CODE_BEATS.filter(b=>b.time>=182).map(b=>b.time)])]){
  const value=await page.evaluate(({t,counterBounds})=>{
   const canvas=document.createElement('canvas');canvas.width=320;canvas.height=180;const c=canvas.getContext('2d');
   const at=q=>{window.heartbeat.frame(q,30,2);c.drawImage(document.querySelector('#film'),0,0,320,180);return c.getImageData(0,0,320,180).data;};
   const compare=delta=>{const a=at(t-delta),b=at(t+delta);let sum=0,max=0,changed=0,outsideSum=0,outsideMax=0,outsideChanged=0,outsideCount=0;for(let i=0;i<a.length;i++){if(i%4===3)continue;const d=Math.abs(a[i]-b[i]);sum+=d;max=Math.max(max,d);if(d>15)changed++;const px=Math.floor(i/4)%320,py=Math.floor(Math.floor(i/4)/320),counter=px*6>=counterBounds[0]-6&&px*6<=counterBounds[0]+counterBounds[2]+6&&py*6>=counterBounds[1]-6&&py*6<=counterBounds[1]+counterBounds[3]+6;if(!counter){outsideSum+=d;outsideMax=Math.max(outsideMax,d);if(d>15)outsideChanged++;outsideCount++;}}return {mean:sum/(320*180*3),max,changedFraction:changed/(320*180*3),outsideCounter:{mean:outsideSum/outsideCount,max:outsideMax,changedFraction:outsideChanged/outsideCount}};};
   return {infinitesimal:compare(.00001),frameStep:compare(1/60)};
  },{t,counterBounds});
  const deliberateGlitch=GLITCHES.some(g=>Math.abs(t-g.start)<1e-6||Math.abs(t-g.end)<1e-6);
  const deliberateReturn=RETURN_RUNS.some(r=>Math.abs(t-r.end)<1e-6);
  if(deliberateReturn){
   if(!(value.infinitesimal.mean<2&&value.infinitesimal.changedFraction<.03&&value.infinitesimal.outsideCounter.mean<.3))report.continuityFailures.push({time:t,reason:'Return cue moves more than its meaningful counter/tally area or breaks surrounding continuity',...value});
  }else if(deliberateGlitch){if(!(value.infinitesimal.mean<15&&value.infinitesimal.changedFraction<.25))report.continuityFailures.push({time:t,reason:'Glitch becomes a full-frame flash',...value});}
  else if(!(value.infinitesimal.mean<.3))report.continuityFailures.push({time:t,reason:'Discontinuous state change',...value});
  report.boundaries.push({time:t,deliberateGlitch,deliberateReturn,...value});
 }
 const stoppedHashes=[];for(const t of [STOP_TIME+.1,195,195.966667]){const sha256=await digest(t);report.stoppedFrames.push({time:t,sha256});stoppedHashes.push(sha256);}
 assert.equal(new Set(stoppedHashes).size,1,'The picture must freeze completely after the final beat');
 assert.deepEqual(await sourceHashes(),report.sourceSHA256,'Source changed during verification; rerun after the final freeze'); assert.deepEqual(report.errors,[]);report.identicalPNGSeeks=report.determinism.filter(r=>r.identical).length;report.tolerancePassedSeeks=report.determinism.filter(r=>r.validation.includes('tolerance')).map(r=>({time:r.time,validation:r.validation,pixelDifference:r.pixelDifference}));report.info=await page.evaluate(()=>window.heartbeat.info());report.passed=report.continuityFailures.length===0&&report.determinismFailures.length===0;
}catch(error){report.passed=false;report.errors.push(error.stack||String(error));}finally{await browser?.close();await new Promise(r=>server.close(r));}
await mkdir(path.join(root,'output/verification'),{recursive:true});await writeFile(path.join(root,'output/verification/browser.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({passed:report.passed,deterministicSeeks:report.determinism.length,identicalPNGSeeks:report.identicalPNGSeeks,boundaries:report.boundaries.length,continuityFailures:report.continuityFailures,determinismFailures:report.determinismFailures,stoppedFrames:report.stoppedFrames,errors:report.errors},null,2));
assert.equal(report.passed,true,'Inspect browser.json for all detected continuity failures');
