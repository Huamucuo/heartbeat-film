import assert from 'node:assert/strict';

// Inspect real Canvas operations and their resulting pixels. Diagnostics only
// associate stable route IDs with the painted heads; their coverage totals are
// deliberately not used as evidence that those routes appeared on screen.
export async function verifyPlanMaze(page,runs,onMeasured=()=>{}){
 const result=await page.evaluate(async runs=>{
  const {codeMaze,mazeDiagnosticsAt,mazeStageAt}=await import('/src/code-maze.mjs');
  const {MODULE_CENTRES}=await import('/src/code-direction.mjs');
  const cv=document.createElement('canvas');cv.width=1920;cv.height=1080;const c=cv.getContext('2d',{willReadFrequently:true});
  const digitMask=document.createElement('canvas');digitMask.width=1920;digitMask.height=1080;const mask=digitMask.getContext('2d',{willReadFrequently:true});
  const original=Object.fromEntries(['fillRect','strokeRect','fillText','beginPath','moveTo','lineTo','stroke','drawImage'].map(k=>[k,c[k].bind(c)]));
  let heads=[],markers=[],labels=[],routeSegments=[],walls=[],points=[],digitDraws=0;
  const mapped=(x,y)=>{const m=c.getTransform();return [m.a*x+m.c*y+m.e,m.b*x+m.d*y+m.f];};
  const distance=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
  const inside=p=>p[0]>=2&&p[0]<1918&&p[1]>=2&&p[1]<1078;
  const sampleRGB=p=>inside(p)?[...c.getImageData(Math.round(p[0]),Math.round(p[1]),1,1).data].slice(0,3):null;
  c.fillRect=(x,y,w,h)=>{original.fillRect(x,y,w,h);if(w>=3&&w<=9&&Math.abs(w-h)<.01){const p=mapped(x+w/2,y+h/2);heads.push({point:p,size:w,color:String(c.fillStyle),immediateRGB:sampleRGB(p)});}};
  c.strokeRect=(x,y,w,h)=>{if(w>=12&&w<=46&&Math.abs(w-h)<.01)markers.push({point:mapped(x+w/2,y+h/2),radius:w/2});return original.strokeRect(x,y,w,h);};
  c.fillText=(s,x,y,...args)=>{labels.push({s:String(s),point:mapped(x,y)});return original.fillText(s,x,y,...args);};
  c.beginPath=()=>{points=[];return original.beginPath();};
  c.moveTo=(x,y)=>{points.push({point:mapped(x,y),start:true});return original.moveTo(x,y);};
  c.lineTo=(x,y)=>{points.push({point:mapped(x,y),start:false});return original.lineTo(x,y);};
  c.stroke=(...args)=>{const segments=[];for(let i=1;i<points.length;i++)if(!points[i].start)segments.push([points[i-1].point,points[i].point]);if(typeof c.strokeStyle!=='string')routeSegments.push(...segments);else if(c.lineWidth>8&&c.lineWidth<9)walls.push(...segments);return original.stroke(...args);};
  // Counter textures are copied only into a verification mask. Ignoring their
  // reveal clip makes that mask conservative: no exposed or hidden glyph ink
  // can be mistaken for a route when a route crosses a digit's rectangle.
  c.drawImage=(...args)=>{original.drawImage(...args);mask.save();mask.setTransform(c.getTransform());mask.globalAlpha=1;mask.drawImage(...args);mask.restore();digitDraws++;};

  const signature=items=>{let hash=2166136261;for(const ch of JSON.stringify(items)){hash^=ch.charCodeAt(0);hash=Math.imul(hash,16777619);}return (hash>>>0).toString(16);};
  const at=time=>{heads=[];markers=[];labels=[];routeSegments=[];walls=[];points=[];digitDraws=0;c.reset();mask.reset();mask.clearRect(0,0,1920,1080);c.fillStyle='#000';original.fillRect(0,0,1920,1080);codeMaze(c,time);return {heads:[...heads],markers:[...markers],labels:[...labels],segments:[...routeSegments],wallCount:walls.length,wallHash:signature(walls),digitDraws,digitMask:mask.getImageData(0,0,1920,1080).data};};
  const associate=(drawn,diagnostic)=>diagnostic.routes.filter(r=>r.visible).map(r=>{const h=drawn.heads.find(h=>Math.abs(h.size-r.headSize)<.001&&distance(h.point,r.head)<.001);return h?{id:r.id,module:r.module,point:h.point,size:h.size,inside:inside(h.point),digitMasked:inside(h.point)&&drawn.digitMask[(Math.round(h.point[1])*1920+Math.round(h.point[0]))*4+3]>8,immediateRGB:h.immediateRGB,finalRGB:sampleRGB(h.point)}:null;}).filter(Boolean);
  const returns=runs.map(run=>{
   const q=mazeDiagnosticsAt(run.end),beforeTime=run.end-Math.min(.1,(run.end-run.start)*.18),before=mazeDiagnosticsAt(beforeTime),beforeDrawn=at(beforeTime),main=q.routes.find(r=>r.id===0),beforeHead=beforeDrawn.heads.filter(h=>Math.abs(h.size-main.headSize)<.001).sort((a,b)=>distance(a.point,before.head)-distance(b.point,before.head))[0],drawn=at(run.end),head=drawn.heads.filter(h=>Math.abs(h.size-main.headSize)<.001).sort((a,b)=>distance(a.point,q.head)-distance(b.point,q.head))[0];
   if(!head)throw new Error('No actual route head at return '+run.index);
   const marker=drawn.markers.sort((a,b)=>distance(a.point,q.origin)-distance(b.point,q.origin))[0]||{point:q.origin,radius:8};
   const [x,y]=marker.point,r=marker.radius,p=c.getImageData(Math.round(q.origin[0])-1,Math.round(q.origin[1])-1,3,3).data;let bright=0;for(let i=0;i<p.length;i+=4)if(p[i]>200&&p[i+1]>180&&p[i+2]>145)bright++;
   return {index:run.index,time:run.end,origin:q.origin,head:q.head,originError:distance(q.head,q.origin),precedingTime:beforeTime,precedingHead:beforeHead,precedingPaintError:beforeHead?distance(beforeHead.point,before.head):null,precedingDistance:beforeHead?distance(beforeHead.point,q.origin):0,paintedHead:head,projectionError:distance(head.point,q.head),brightPixels:bright,finalCoreRGB:[...p].filter((_,i)=>i%4!==3),originRegion:{paintedMarker:drawn.markers.length>0}};
  });
  const coverage=(drawn)=>{
   const p=c.getImageData(0,0,1920,1080).data,zones=Array(9).fill(0),seen=new Set(),visiblePoints=[];
   for(const [a,b] of drawn.segments){const n=Math.max(1,Math.ceil(distance(a,b)/12));for(let j=0;j<=n;j++){const x=Math.round(a[0]+(b[0]-a[0])*j/n),y=Math.round(a[1]+(b[1]-a[1])*j/n);if(x<1||x>1918||y<1||y>1078)continue;const key=y*1920+x;if(drawn.digitMask[key*4+3]>8||seen.has(key))continue;seen.add(key);let visible=false;for(const dx of [-1,0,1]){const k=(key+dx)*4,rgb=[p[k],p[k+1],p[k+2]];if(Math.max(...rgb)>60&&Math.max(...rgb)-Math.min(...rgb)>16)visible=true;}if(visible){zones[Math.min(2,Math.floor(y/360))*3+Math.min(2,Math.floor(x/640))]++;visiblePoints.push([x,y]);}}}
   return {routeSamplesByZone:zones,occupiedZones:zones.filter(v=>v>0).length,visibleRouteSamples:visiblePoints.length,bounds:visiblePoints.length?[Math.min(...visiblePoints.map(p=>p[0])),Math.min(...visiblePoints.map(p=>p[1])),Math.max(...visiblePoints.map(p=>p[0])),Math.max(...visiblePoints.map(p=>p[1]))]:null};
  };
  const stages=[70,84,95,106,118,125,128,130,130.8,131.2,131.55].map(time=>{const q=mazeDiagnosticsAt(time),drawn=at(time),matched=associate(drawn,q),visible=matched.filter(h=>h.inside&&!h.digitMasked&&Math.max(...h.finalRGB)>45);return {time,authored:mazeStageAt(time),paintedRouteHeads:matched.length,visibleRouteHeads:visible.length,counterTextureDrawCalls:drawn.digitDraws,drawnText:drawn.labels.map(l=>l.s),headsByZone:Array.from({length:9},(_,i)=>visible.filter(h=>Math.floor(h.point[1]/360)*3+Math.floor(h.point[0]/640)===i).length),wallCount:drawn.wallCount,wallGeometryHash:drawn.wallHash,...coverage(drawn)};});
  const lateSearchMotion=[121.3,122.5,124,126,128].map(time=>{const a=associate(at(time),mazeDiagnosticsAt(time)),b=associate(at(time+.25),mazeDiagnosticsAt(time+.25)),map=new Map(b.map(h=>[h.id,h])),d=a.filter(h=>h.id!==0&&h.inside&&map.get(h.id)?.inside).map(h=>distance(h.point,map.get(h.id).point));return {time,matchedHeads:d.length,movedPixelsMean:d.reduce((a,b)=>a+b,0)/Math.max(1,d.length),movedOverFourPixels:d.filter(x=>x>4).length};});
  const tracks=new Map();for(let t=125;t<=126.21;t+=.2){for(const h of associate(at(t),mazeDiagnosticsAt(t)))if(h.id!==0&&h.inside){if(!tracks.has(h.id))tracks.set(h.id,[]);tracks.get(h.id).push(h.point);}}
  const complete=[...tracks.entries()].filter(([,p])=>p.length===7),pathShapes=complete.map(([,p])=>p.map(q=>q.map((v,k)=>Math.round((v-p[0][k])*10)/10))),uniqueMovementSignatures=new Set(pathShapes.map(p=>JSON.stringify(p))).size;
  const handoff=[130.8,131.2,131.55].map(time=>{const q=mazeDiagnosticsAt(time),drawn=at(time),heads=associate(drawn,q),groups=Array.from({length:9},(_,id)=>heads.filter(h=>h.module===id&&distance(h.point,MODULE_CENTRES[id])<300));return {time,paintedRoutes:heads.length,visibleHeads:heads.filter(h=>h.inside&&!h.digitMasked&&Math.max(...h.finalRGB)>30).length,headsNearAssignedModule:groups.map(g=>g.length),routeSegments:drawn.segments.length};});
  return {returns,stages,fixedProjection:stages.filter(s=>s.time<130.1).map(s=>({time:s.time,wallCount:s.wallCount,wallGeometryHash:s.wallGeometryHash})),lateSearchMotion,independentTiming:{trackedRouteCount:complete.length,uniqueMovementSignatures,samplesPerRoute:7},handoff};
 },runs.map(({index,start,end})=>({index,start,end})));
 await onMeasured(result);
 assert.equal(result.returns.length,runs.length);
 assert.ok(result.stages.every(s=>s.drawnText.every(t=>!/[\u3400-\u9fff]/.test(t))),'Maze still paints a Chinese label');
 for(const r of result.returns){assert.ok(r.originError<.01&&r.projectionError<.01,`Return ${r.index} misses its painted planar origin`);assert.ok(r.precedingHead&&r.precedingPaintError<.01&&r.precedingDistance>1,`Return ${r.index} does not actually approach the origin`);assert.ok(r.paintedHead.immediateRGB?.every(v=>v>=190),`Return ${r.index} primary head is not painted`);}
 assert.equal(new Set(result.fixedProjection.map(r=>r.wallGeometryHash)).size,1,'The maze plan changes projection or wall positions');assert.ok(result.fixedProjection.every(r=>r.wallCount>100),'No substantial fixed maze structure painted');
 const mature=result.stages.filter(s=>s.time>=118&&s.time<=130),union=Array.from({length:9},(_,i)=>mature.some(s=>s.routeSamplesByZone[i]>4));assert.ok(union.every(Boolean),'Actual route pixels do not reach all nine screen regions');assert.ok(mature.every(s=>s.occupiedZones>=7),'Late routes collapse into a few screen regions');assert.ok(mature.some(s=>s.bounds&&s.bounds[2]-s.bounds[0]>1536&&s.bounds[3]-s.bounds[1]>864),'Routes never span most of the full frame');
 for(const r of result.lateSearchMotion)assert.ok(r.matchedHeads>30&&r.movedOverFourPixels>20,`Late search heads stop moving at ${r.time}`);
 assert.ok(result.independentTiming.trackedRouteCount>30&&result.independentTiming.uniqueMovementSignatures>result.independentTiming.trackedRouteCount*.5,'Most route heads share the same movement timing');
 assert.ok(result.handoff.some(r=>r.visibleHeads>30),'The large route handoff is not actually painted');assert.ok(Array.from({length:9},(_,i)=>result.handoff.some(r=>r.headsNearAssignedModule[i]>0)).every(Boolean),'Routes fail to reach one or more life regions');
 return result;
}
