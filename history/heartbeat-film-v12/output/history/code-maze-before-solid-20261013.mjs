import {RETURN_RUNS,returnAt,MODULE_CENTRES,codeECG,codePulse} from './code-direction.mjs';
import {ramp,gate,hash,mix,clamp,rgb,text,ivory} from './drawing.mjs';

// A connected maze inside a volume, not a surface displaced along its normal.
// Grid edges exist along all three world axes; only the camera and route heads
// move. Its chase rig is integrated once on the shared film clock.
const GOLD=[239,168,100],CORE=[255,246,219],TEAL=[95,195,181],COPPER=[181,124,89],STEEL=[105,156,176];
const NX=7,NY=5,NZ=7,CELL=218,HALF=59,NEAR=105,FAR=4650,FOCAL=1010;
const START=61.5,END=132,STEP=1/240,AXES=[[1,0,0],[0,1,0],[0,0,1]];
const add=(a,b)=>a.map((v,i)=>v+b[i]),sub=(a,b)=>a.map((v,i)=>v-b[i]),mul=(a,k)=>a.map(v=>v*k);
const dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0),norm=a=>Math.hypot(...a),unit=a=>mul(a,1/Math.max(.000001,norm(a)));
const lerp=(a,b,u)=>a.map((v,i)=>mix(v,b[i],u));
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const id=(x,y,z)=>(z*NY+y)*NX+x;
const coord=i=>[i%NX,Math.floor(i/NX)%NY,Math.floor(i/(NX*NY))];
const world=i=>coord(i).map((v,k)=>(v-[3,2,3][k])*CELL);
const HOME=id(3,2,3),COUNT=NX*NY*NZ,graph=Array.from({length:COUNT},()=>[]);
function neighbors(i){const p=coord(i),out=[];for(let axis=0;axis<3;axis++)for(const sign of [-1,1]){const q=[...p];q[axis]+=sign;if(q[axis]>=0&&q[axis]<[NX,NY,NZ][axis])out.push(id(...q));}return out;}
function connect(a,b){if(!graph[a].includes(b)){graph[a].push(b);graph[b].push(a);}}
// Seeded DFS plus a small number of cross-connections. There are still genuine
// cul-de-sacs, but the searches can branch around the home cell in x, y and z.
const visited=new Set([HOME]),stack=[HOME];let randomStep=0;
while(stack.length){const a=stack.at(-1),options=neighbors(a).filter(n=>!visited.has(n));if(!options.length){stack.pop();continue;}const b=options[Math.floor(hash(++randomStep*71+91)*options.length)];connect(a,b);visited.add(b);stack.push(b);}
for(let a=0;a<COUNT;a++)for(const b of neighbors(a))if(b>a&&!graph[a].includes(b)&&hash(a*131+b*19+97)<.105)connect(a,b);
for(const axis of [0,1,2])for(const sign of [-1,1]){const q=coord(HOME);q[axis]+=sign;connect(HOME,id(...q));}
function pathBetween(a,b){
 const prev=new Int32Array(COUNT).fill(-1),queue=[a];prev[a]=a;
 for(let k=0;k<queue.length&&prev[b]<0;k++)for(const n of graph[queue[k]])if(prev[n]<0){prev[n]=queue[k];queue.push(n);}
 if(prev[b]<0)throw new Error('Disconnected volumetric maze');
 const path=[b];while(path.at(-1)!==a)path.push(prev[path.at(-1)]);return path.reverse();
}
const homePaths=Array.from({length:COUNT},(_,i)=>pathBetween(HOME,i));
function axisDiversity(path){const axes=new Set();for(let i=1;i<path.length;i++){const a=coord(path[i-1]),b=coord(path[i]);axes.add(a.findIndex((v,k)=>v!==b[k]));}return axes.size;}
function makeCurve(points){const lengths=[0];for(let i=1;i<points.length;i++)lengths.push(lengths.at(-1)+norm(sub(points[i],points[i-1])));return {points,lengths,total:lengths.at(-1)};}
function fromCells(cells){for(let i=1;i<cells.length;i++)if(!graph[cells[i-1]].includes(cells[i]))throw new Error('Route left its 3D passage');return makeCurve(cells.map(world));}
function pointAt(curve,u){
 const distance=clamp(u)*curve.total;let lo=0,hi=curve.lengths.length-1;
 while(hi-lo>1){const mid=(lo+hi)>>1;if(curve.lengths[mid]<distance)lo=mid;else hi=mid;}
 return lerp(curve.points[lo],curve.points[hi],(distance-curve.lengths[lo])/Math.max(.0001,curve.lengths[hi]-curve.lengths[lo]));
}
function slice(curve,a,b){const out=[pointAt(curve,a)],lo=a*curve.total,hi=b*curve.total;for(let i=1;i<curve.points.length-1;i++)if(curve.lengths[i]>lo&&curve.lengths[i]<hi)out.push(curve.points[i]);out.push(pointAt(curve,b));return out;}
const streams=Array.from({length:96},(_,stream)=>RETURN_RUNS.map((run,i)=>{
 const maxSteps=i<13?12:i<34?10:8;
 let eligible=homePaths.map((path,target)=>({path,target})).filter(({path,target})=>path.length>=5&&path.length<=maxSteps+1&&axisDiversity(path)===3&&(stream===0||coord(target)[stream%3]!==[3,2,3][stream%3]));
 const dead=eligible.filter(v=>graph[v.target].length===1);if(dead.length>5)eligible=dead;
 const chosen=eligible[Math.floor(hash(i*173+stream*887+59)*eligible.length)];
 // All excursions close at one world-space origin. Reversing through a real
 // dead end makes the repeated return understandable as a failed search.
 return fromCells([...chosen.path,...chosen.path.slice(0,-1).reverse()]);
}));
const intro=makeCurve(streams[0][0].points.slice(0,5).reverse());
function runProgress(u,stream=0){const hold=stream?.065:.028;return u<.5-hold?u/(.5-hold)*.5:u<.5+hold?.5:.5+(u-.5-hold)/(.5-hold)*.5;}
function routeState(t,stream=0){
 if(t<66)return {position:pointAt(intro,ramp(START,66,t)),index:-1,u:ramp(START,66,t)};
 if(t>=121)return {position:[0,0,0],index:71,u:1};
 const r=returnAt(t),u=runProgress(r.u,stream);return {position:pointAt(streams[stream][r.index],u),index:r.index,u};
}
function trace(t,stream,span){
 const r=returnAt(t),global=t<66?-1+ramp(START,66,t):t<121?r.index+r.u:72,start=Math.max(-1,global-span),out=[];
 for(let i=Math.floor(start);i<=Math.min(71,Math.floor(global));i++){
  const curve=i<0?intro:streams[stream][i],a=clamp(start-i),b=clamp(global-i);if(b<=a)continue;
  const section=slice(curve,i<0?a:runProgress(a,stream),i<0?b:runProgress(b,stream));out.push(...section.slice(out.length?1:0));
 }return out.length>1?out:[[0,0,0],[0,0,0]];
}

// The chase camera has a delayed position and a separately delayed look-ahead
// target. Its world-space displacement is real; this is not a fixed overview
// with a projection ripple. The stable rear three-quarter offset avoids the
// violent 90-degree viewpoint snaps that a raw tangent camera would produce.
const cameraSamples=[];
let cameraPosition=add(routeState(START).position,[-430,-292,-655]),cameraFocus=routeState(START).position;
for(let i=0;i<=Math.ceil((121-START)/STEP);i++){
 const t=Math.min(121,START+i*STEP),fast=ramp(85,116,t),head=routeState(t).position;
 const ahead=routeState(Math.min(121,t+mix(.085,.035,fast))).position;
 const look=lerp(head,ahead,.24),desired=add(head,[-430,-292,-655]);
 cameraPosition=lerp(cameraPosition,desired,1-Math.exp(-STEP/mix(.155,.28,fast)));
 cameraFocus=lerp(cameraFocus,look,1-Math.exp(-STEP/mix(.11,.24,fast)));
 cameraSamples.push({position:[...cameraPosition],target:[...cameraFocus]});
}
function cameraSample(t){const f=clamp((t-START)/STEP,0,cameraSamples.length-1),i=Math.floor(f),a=cameraSamples[i],b=cameraSamples[Math.min(i+1,cameraSamples.length-1)];return {position:lerp(a.position,b.position,f-i),target:lerp(a.target,b.target,f-i)};}
export function mazeCameraAt(t){
 const state=routeState(t),cam=cameraSample(Math.min(121,t));
 if(t<66){const scale=mix(1.72,1,ramp(61.8,66,t));cam.position=add(cam.target,mul(sub(cam.position,cam.target),scale));}
 // After the first solitary searches, pull back while still following the
 // route. The changing parallax reveals that every passage shares one volume.
 const reveal=ramp(76,94,t),focus=mul(cam.target,mix(1,.3,reveal));
 cam.position=add(focus,mul(sub(cam.position,cam.target),mix(1,2.9,reveal)));cam.target=focus;
 if(t>121){const u=ramp(121,125.6,t);cam.position=lerp(cam.position,[-1260,-810,-1920],u);cam.target=lerp(cam.target,[0,0,0],u);}
 const forward=unit(sub(cam.target,cam.position)),right=unit(cross([0,-1,0],forward)),up=cross(forward,right);
 return {...cam,forward,right,up,head:[...state.position],runIndex:state.index,runProgress:state.u,worldDimensions:[NX,NY,NZ],cellSize:CELL};
}
function cameraSpace(p,cam){const q=sub(p,cam.position);return [dot(q,cam.right),dot(q,cam.up),dot(q,cam.forward)];}
function projected(q){const scale=FOCAL/q[2];return [960+q[0]*scale,510+q[1]*scale,q[2],scale];}
function projectSegment(a,b,cam){
 let p=cameraSpace(a,cam),q=cameraSpace(b,cam);
 if((p[2]<NEAR&&q[2]<NEAR)||(p[2]>FAR&&q[2]>FAR))return null;
 if(p[2]<NEAR)p=lerp(p,q,(NEAR-p[2])/(q[2]-p[2]));
 if(q[2]<NEAR)q=lerp(q,p,(NEAR-q[2])/(p[2]-q[2]));
 if(p[2]>FAR)p=lerp(p,q,(FAR-p[2])/(q[2]-p[2]));
 if(q[2]>FAR)q=lerp(q,p,(FAR-q[2])/(p[2]-q[2]));
 const a2=projected(p),b2=projected(q);if((a2[0]<-100&&b2[0]<-100)||(a2[0]>2020&&b2[0]>2020)||(a2[1]<-100&&b2[1]<-100)||(a2[1]>1180&&b2[1]>1180))return null;
 return [a2,b2];
}
function screenLine(c,a,b,color,alpha,width){if(alpha<.003)return;c.strokeStyle=rgb(color,alpha);c.lineWidth=width;c.beginPath();c.moveTo(a[0],a[1]);c.lineTo(b[0],b[1]);c.stroke();}

const segments=[];
for(let a=0;a<COUNT;a++)for(const b of graph[a])if(b>a){
 const p=world(a),q=world(b),axis=coord(a).findIndex((v,k)=>v!==coord(b)[k]),u=AXES[(axis+1)%3],v=AXES[(axis+2)%3],corners=[[1,1],[-1,1],[-1,-1],[1,-1]];
 const rings=[.12,.5,.88].map(f=>corners.map(([i,j])=>add(lerp(p,q,f),add(mul(u,HALF*i),mul(v,HALF*j)))));
 for(let r=0;r<rings.length;r++)for(let k=0;k<4;k++)segments.push({a:rings[r][k],b:rings[r][(k+1)%4],kind:r===1?1:0});
 for(const k of [0,2])segments.push({a:rings[0][k],b:rings[2][k],kind:2});
 // Etched marks are attached to corridors, giving stable spatial parallax.
 const m=add(lerp(p,q,.6),add(mul(u,HALF),mul(v,HALF)));for(let k=0;k<3;k++)segments.push({a:add(m,mul(u,k*8)),b:add(add(m,mul(u,k*8)),mul(v,6+k*2)),kind:3});
}
for(let a=0;a<COUNT;a++)if(graph[a].length===1){
 const p=world(a),inward=unit(sub(world(graph[a][0]),p)),axis=inward.findIndex(v=>Math.abs(v)>.1),u=AXES[(axis+1)%3],v=AXES[(axis+2)%3],center=sub(p,mul(inward,CELL*.29));
 const corners=[[1,1],[-1,1],[-1,-1],[1,-1]].map(([i,j])=>add(center,add(mul(u,HALF*i),mul(v,HALF*j))));
 for(let k=0;k<4;k++)segments.push({a:corners[k],b:corners[(k+1)%4],kind:4});
 segments.push({a:add(center,mul(u,-15)),b:add(center,mul(u,15)),kind:4});
}
function drawSpace(c,cam,t,alpha){
 const plate=c.createRadialGradient(970,460,80,920,540,1080);plate.addColorStop(0,'#102630');plate.addColorStop(.62,'#081722');plate.addColorStop(1,'#040a12');c.fillStyle=plate;c.fillRect(0,0,1920,1080);
 const reveal=ramp(66.5,94,t),whole=ramp(76,94,t),detail=reveal*alpha,lines=[];
 for(const s of segments){
  const mid=mul(add(s.a,s.b),.5),distance=norm(sub(mid,cam.head)),local=1-ramp(mix(185,1400,whole),mix(480,2200,whole),distance);if(local<.005)continue;
  const p=projectSegment(s.a,s.b,cam);if(!p)continue;
  const depth=(p[0][2]+p[1][2])/2,fog=(1-ramp(mix(800,2400,whole),FAR,depth))*ramp(NEAR,205,depth);
  lines.push({p,depth,alpha:detail*local*fog*[.20,.115,.10,.14,.36][s.kind],kind:s.kind});
 }
 lines.sort((a,b)=>b.depth-a.depth);
 for(const line of lines)screenLine(c,...line.p,line.kind===4?COPPER:STEEL,line.alpha,line.kind===4?1.6:line.kind===3?1.1:1.25);
}
function drawRoute(c,points,cam,color,primary,opacity){
 const n=points.length,lines=[];
 for(let i=1;i<n;i++){const p=projectSegment(points[i-1],points[i],cam);if(!p)continue;const u=i/(n-1),depth=(p[0][2]+p[1][2])/2,fade=1-ramp(2900,FAR,depth),strength=opacity*fade*(primary?.13+.87*ramp(.15,1,u):.12+.75*u);lines.push({p,strength,width:clamp(FOCAL/depth,.65,2.6)*(primary?4.9:2.35)});}
 // Separate body and core passes preserve continuous rectilinear corners.
 for(const l of lines)screenLine(c,...l.p,color,l.strength*.09,l.width+7);
 for(const l of lines)screenLine(c,...l.p,color,l.strength,l.width);
 if(primary)for(const l of lines)screenLine(c,...l.p,CORE,l.strength*.94,Math.max(1.3,l.width*.36));
 const head=cameraSpace(points.at(-1),cam);if(head[2]<NEAR||head[2]>FAR)return;
 const p=projected(head),r=clamp(p[3]*(primary?4.6:3),2,8);c.fillStyle=rgb(primary?CORE:color,opacity);c.fillRect(p[0]-r,p[1]-r,r*2,r*2);
 screenLine(c,[p[0]+r+3,p[1]-r],[p[0]+r+14,p[1]-r],color,opacity*.8,1.5);
}
const handoffCurves=MODULE_CENTRES.map(([x,y])=>makeCurve([[960,540,0],[960,y,0],[x-132,y,0],[x-68,y,0],[x-51,y-15,0],[x-41,y+10,0],[x-28,y-57,0],[x-12,y+26,0],[x+11,y,0],[x+132,y,0]]));
const searchBirth=stream=>88+19*(stream/95)**.78;
const searchMorph=(stream,t)=>stream===0?ramp(121,124.5,t):ramp(104+hash(stream*79)*3.7,112+hash(stream*67)*5.3,t);
const searchLanes=Array.from({length:96},(_,i)=>i===0?[0,0,0]:mul(unit([hash(i*47+31)-.5,hash(i*83+17)-.5,hash(i*139+67)-.5]),2+6*hash(i*193+41)));
export function mazeStageAt(t){return {reveal:ramp(66.5,94,t),wholeMaze:ramp(76,94,t),activeStreams:1+Array.from({length:95},(_,k)=>k+1).filter(i=>ramp(searchBirth(i),searchBirth(i)+.7,t)>.001).length,primaryMorph:searchMorph(0,t),waveStreams:Array.from({length:96},(_,i)=>i).filter(i=>searchMorph(i,t)>.001).length,handoff:ramp(125,131.25,t)};}
function strokePolyline(c,points,color,alpha,width){
 if(alpha<.002)return;c.strokeStyle=rgb(color,alpha);c.lineWidth=width;c.beginPath();for(let i=0;i<points.length;i++)c[i?'lineTo':'moveTo'](points[i][0],points[i][1]);c.stroke();
}
function drawSearch(c,t,cam,stream){
 const birth=searchBirth(stream),visible=stream===0?1:ramp(birth,birth+.7,t);if(visible<.001)return;
 const phase=stream?mix(-.34,.34,hash(stream*113+8))*ramp(88,94,t):0,at=Math.min(121,t+phase);
 // Stable 2–8 unit lanes remain well inside the 118-unit open corridors.
 // Every lane converges exactly to zero at the common world-space origin.
 const worldPoints=trace(at,stream,stream===0?1.05:.76).map(p=>add(p,mul(searchLanes[stream],ramp(0,CELL*.65,norm(p)))));
 const morph=searchMorph(stream,t);
 const color=stream===0?GOLD:stream%5===0?COPPER:stream%4===0?[162,184,193]:TEAL;
 if(morph<.001){drawRoute(c,worldPoints,cam,color,stream===0,visible*(stream===0?1:.13+.19*hash(stream*37)));return;}
 // The moving traces themselves become the waveform. Resampling by arc
 // length preserves their order and connects every moving point to its new
 // position, rather than cutting to an unrelated heart graphic.
 const curve=makeCurve(worldPoints),points=[],handoff=ramp(125,131.25,t),pulse=codePulse(t),variation=hash(stream*47+391),offset=(variation-.5)*142;
 for(let k=0;k<=160;k++){
  const u=k/160,wp=pointAt(curve,u),cp=cameraSpace(wp,cam),p=projected([cp[0],cp[1],Math.max(NEAR,cp[2])]);
  const time=t-4.9*(1-u)+(variation-.5)*.095,signal=codeECG(time);
  const breathing=Math.sin(u*15.3+stream*.37+t*.61)*3.8+Math.sin(u*39.1-stream*.1+t*.47)*1.5;
  let q=[180+1560*u+(variation-.5)*28,554+offset-signal*(420+variation*180)+breathing*(.5+pulse*.3)];
  if(handoff>0){const target=pointAt(handoffCurves[stream%9],u);q=[mix(q[0],target[0],handoff),mix(q[1],target[1]+(variation-.5)*5,handoff)];}
  points.push([mix(p[0],q[0],morph),mix(p[1],q[1],morph)]);
 }
 const a=visible*(stream===0?.9:mix(.12,.17,variation)),width=stream===0?3.8:mix(.75,1.45,variation);
 strokePolyline(c,points,color,a,width);if(stream===0)strokePolyline(c,points,CORE,.76,1.4);
}
export function codeMaze(c,t){
 const alpha=gate(START,END,t,1.5);if(alpha<.001)return;
 const cam=mazeCameraAt(t),structure=(1-ramp(125,131,t))*mix(1,.33,ramp(103,115,t));c.save();c.globalAlpha=alpha;c.beginPath();c.rect(0,0,1920,1080);c.clip();c.lineCap='round';c.lineJoin='miter';
 drawSpace(c,cam,t,structure);
 for(let stream=95;stream>0;stream--)drawSearch(c,t,cam,stream);
 drawSearch(c,t,cam,0);
 let impact=0;for(const run of RETURN_RUNS){const d=t-run.end;if(Math.abs(d)<.18)impact+=Math.exp(-((d/.043)**2));}
 const home=cameraSpace([0,0,0],cam),markAlpha=(1-ramp(124,127,t));
 if(home[2]>NEAR&&home[2]<FAR){
  const p=projected(home),r=clamp(p[3]*11,6,23);c.strokeStyle=rgb(GOLD,(.65+impact*.3)*markAlpha);c.lineWidth=1.8;c.strokeRect(p[0]-r,p[1]-r,r*2,r*2);
  screenLine(c,[p[0]-r-8,p[1]],[p[0]-r-2,p[1]],GOLD,markAlpha,2);screenLine(c,[p[0]+r+2,p[1]],[p[0]+r+8,p[1]],GOLD,markAlpha,2);
  if(p[0]>80&&p[0]<1790&&p[1]>60&&p[1]<900)text(c,'原点',p[0],p[1]+r+22,16,GOLD,alpha*markAlpha,{tracking:2});
 }
 const state=returnAt(t),count=state.completed,a=alpha*(1-ramp(124,128,t));
 text(c,String(count).padStart(2,'0'),1760,196,52,ivory,a,{sans:true,weight:300});text(c,'次回到原点',1760,241,18,GOLD,a,{tracking:1});
 for(let i=0;i<72;i++){const x=1692+(i%12)*13,y=281+Math.floor(i/12)*11;screenLine(c,[x,y],[x+4,y],i<count?GOLD:STEEL,(i<count?.47:.12)*a,1);}
 c.restore();
}
