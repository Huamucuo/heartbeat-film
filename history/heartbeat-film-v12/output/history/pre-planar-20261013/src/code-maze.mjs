import {RETURN_RUNS,returnAt,MODULE_CENTRES} from './code-direction.mjs';
import {ramp,gate,hash,mix,clamp,rgb,text,ivory} from './drawing.mjs';

// A connected maze inside a volume, not a surface displaced along its normal.
// Grid edges exist along all three world axes; only the camera and route heads
// move. Its chase rig is integrated once on the shared film clock.
export const STREAM_COUNT=128;
const GOLD=[239,168,100],CORE=[255,246,219],TEAL=[95,195,181],COPPER=[181,124,89],STEEL=[105,156,176];
const NX=7,NY=5,NZ=7,CELL=218,HALF=59,NEAR=105,FAR=4650,FOCAL=1010;
const START=61.5,END=132,STEP=1/240,AXES=[[1,0,0],[0,1,0],[0,0,1]];
const add=(a,b)=>a.map((v,i)=>v+b[i]),sub=(a,b)=>a.map((v,i)=>v-b[i]),mul=(a,k)=>a.map(v=>v*k);
const dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0),norm=a=>Math.hypot(...a),unit=a=>mul(a,1/Math.max(.000001,norm(a)));
const lerp=(a,b,u)=>a.map((v,i)=>mix(v,b[i],u));
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
function hueColor(h,s=.73,l=.61){const a=s*Math.min(l,1-l);return [0,8,4].map(n=>{const k=(n+h/30)%12;return 255*(l-a*Math.max(-1,Math.min(k-3,9-k,1)));});}
const routeColors=Array.from({length:STREAM_COUNT},(_,i)=>i===0?GOLD:hueColor((i*137.508+24)%360,.72,.59));
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
const streams=Array.from({length:STREAM_COUNT},(_,stream)=>RETURN_RUNS.map((run,i)=>{
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
 const r=returnAt(t),global=t<66?-1+ramp(START,66,t):t<121?r.index+r.u:72+(stream?(t-121)/.72:0),start=Math.max(-1,global-span),out=[];
 for(let i=Math.floor(start);i<=Math.floor(global);i++){
  const curve=i<0?intro:streams[stream][i%72],a=clamp(start-i),b=clamp(global-i);if(b<=a)continue;
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
 // The last movement settles into a fixed overall XZ plan. Subsequent changes
 // belong to the searches inside the maze; this camera no longer follows them.
 const plan=ramp(103,112,t);cam.position=lerp(cam.position,[0,-2700,-200],plan);cam.target=lerp(cam.target,[0,0,0],plan);
 const forward=unit(sub(cam.target,cam.position)),right=unit(cross([0,-1,0],forward)),up=cross(forward,right);
 return {...cam,forward,right,up,orthographic:plan,framing:1-.32*Math.sin(Math.PI*plan),head:[...state.position],runIndex:state.index,runProgress:state.u,worldDimensions:[NX,NY,NZ],cellSize:CELL};
}
function cameraSpace(p,cam){const q=sub(p,cam.position);return [dot(q,cam.right),dot(q,cam.up),dot(q,cam.forward)];}
function projected(q,cam){const scale=mix(FOCAL/q[2],.59,cam?.orthographic||0)*(cam?.framing||1);return [960+q[0]*scale,510+q[1]*scale,q[2],scale];}
function projectSegment(a,b,cam){
 let p=cameraSpace(a,cam),q=cameraSpace(b,cam);
 if((p[2]<NEAR&&q[2]<NEAR)||(p[2]>FAR&&q[2]>FAR))return null;
 if(p[2]<NEAR)p=lerp(p,q,(NEAR-p[2])/(q[2]-p[2]));
 if(q[2]<NEAR)q=lerp(q,p,(NEAR-q[2])/(p[2]-q[2]));
 if(p[2]>FAR)p=lerp(p,q,(FAR-p[2])/(q[2]-p[2]));
 if(q[2]>FAR)q=lerp(q,p,(FAR-q[2])/(p[2]-q[2]));
 const a2=projected(p,cam),b2=projected(q,cam);if((a2[0]<-100&&b2[0]<-100)||(a2[0]>2020&&b2[0]>2020)||(a2[1]<-100&&b2[1]<-100)||(a2[1]>1180&&b2[1]>1180))return null;
 return [a2,b2];
}
function screenLine(c,a,b,color,alpha,width){if(alpha<.003)return;c.strokeStyle=rgb(color,alpha);c.lineWidth=width;c.beginPath();c.moveTo(a[0],a[1]);c.lineTo(b[0],b[1]);c.stroke();}
function projectPolygon(points,cam){
 let poly=points.map(p=>cameraSpace(p,cam));
 for(const [bound,sign] of [[NEAR,1],[FAR,-1]]){
  const clipped=[];for(let i=0;i<poly.length;i++){const a=poly[i],b=poly[(i+1)%poly.length],insideA=(a[2]-bound)*sign>=0,insideB=(b[2]-bound)*sign>=0;if(insideA)clipped.push(a);if(insideA!==insideB)clipped.push(lerp(a,b,(bound-a[2])/(b[2]-a[2])));}poly=clipped;if(poly.length<3)return null;
 }
 return {points:poly.map(p=>projected(p,cam)),depth:poly.reduce((s,p)=>s+p[2],0)/poly.length};
}
const walls=[],THICKNESS=11;
function wallPanel(center,u,v,normal,lu,lv,dead=false){
 const corners=[[1,1],[-1,1],[-1,-1],[1,-1]].map(([x,y])=>add(center,add(mul(u,x*lu/2),mul(v,y*lv/2))));
 const outer=corners.map(p=>add(p,mul(normal,THICKNESS))),axis=normal.findIndex(v=>Math.abs(v)>.5);
 walls.push({center,normal,corners,axis,dead,edge:false});
 for(let k=0;k<4;k++)walls.push({center,normal,corners:[corners[k],outer[k],outer[(k+1)%4],corners[(k+1)%4]],axis,dead,edge:true});
}
// Continuous solid corridors meet open junction rooms. An edge is an actual
// square tube from room opening to room opening, not a stack of thick rings.
for(let a=0;a<COUNT;a++){
 const p=world(a),grid=coord(a);
 for(let axis=0;axis<3;axis++)for(const sign of [-1,1]){
  const adjacent=[...grid];adjacent[axis]+=sign;
  const inside=adjacent[axis]>=0&&adjacent[axis]<[NX,NY,NZ][axis],open=inside&&graph[a].includes(id(...adjacent));
  if(!open){const normal=mul(AXES[axis],sign);wallPanel(add(p,mul(normal,HALF)),AXES[(axis+1)%3],AXES[(axis+2)%3],normal,HALF*2,HALF*2,graph[a].length===1);}
 }
 for(const b of graph[a])if(b>a){
  const q=world(b),axis=grid.findIndex((v,k)=>v!==coord(b)[k]),mid=mul(add(p,q),.5),length=CELL-2*HALF;
  for(const side of [(axis+1)%3,(axis+2)%3])for(const sign of [-1,1]){
   const normal=mul(AXES[side],sign),other=[0,1,2].find(k=>k!==axis&&k!==side);wallPanel(add(mid,mul(normal,HALF)),AXES[axis],AXES[other],normal,length,HALF*2);
  }
 }
}

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
function planLayerVisibility(y,cam){return mix(1,.055+.945*(1-ramp(60,150,Math.abs(y))),cam.orthographic||0);}
function drawSpace(c,cam,t,alpha){
 const plate=c.createRadialGradient(970,460,80,920,540,1080);plate.addColorStop(0,'#102630');plate.addColorStop(.62,'#081722');plate.addColorStop(1,'#040a12');c.fillStyle=plate;c.fillRect(0,0,1920,1080);
 const reveal=ramp(66.5,94,t),whole=ramp(76,94,t),detail=Math.sqrt(reveal)*alpha,queue=[];
 const focusDepth=norm(sub(cam.target,cam.position)),heroDelta=sub(cam.head,cam.position),heroDistance=norm(heroDelta),heroRay=unit(heroDelta);
 const transitionContrast=1-.30*ramp(106,111,t)*(1-ramp(115,118.5,t));
 for(const face of walls){
  const distance=norm(sub(face.center,cam.target)),local=1-ramp(mix(250,1400,whole),mix(625,2200,whole),distance);if(local<.003)continue;
  const facing=dot(face.normal,unit(sub(cam.position,face.center))),cut=1-ramp(-.24,.30,facing);if(cut<.003)continue;
  const p=projectPolygon(face.corners,cam);if(!p)continue;
  // A smoothly moving view-section opens the nearest part of the volume.
  // Face selection never flips on a sign test; orientation and depth fade
  // continuously while actual face positions and material remain unchanged.
  const toFace=sub(face.center,cam.position),along=dot(toFace,heroRay),radial=norm(sub(toFace,mul(heroRay,along)));
  // Carve only the sightline into the current passage, including its nearest
  // junction. Back walls beyond the head remain solid and depth-sorted.
  const heroSection=(1-ramp(145,330,radial))*(1-ramp(heroDistance-180,heroDistance+65,along))*ramp(0,160,along);
  const section=mix(ramp(focusDepth-650,focusDepth-150,p.depth),1,cam.orthographic),fog=1-ramp(3000,FAR,p.depth);
  // In the settled plan, remove the outer four storeys instead of stacking
  // five equally bright roofs. The central floor and its open doorways read
  // as one traversable section; distant passages remain only a dark context.
  const sectionLayer=mix(1,.018+.982*(1-ramp(70,145,Math.abs(face.center[1]))),cam.orthographic);
  const opacity=detail*local*cut*section*(1-heroSection*(1-cam.orthographic))*.98*sectionLayer;
  if(opacity<.003)continue;
  const base=face.edge?[44,65,78]:face.dead?[40,50,58]:[[35,55,70],[48,69,80],[26,44,58]][face.axis];
  const color=lerp([6,14,23],base,(.30+.70*fog)*transitionContrast);
  queue.push({depth:p.depth,draw:()=>{c.beginPath();p.points.forEach((q,i)=>c[i?'lineTo':'moveTo'](q[0],q[1]));c.closePath();c.fillStyle=rgb(color,opacity);c.fill();if(!face.edge){c.strokeStyle=rgb([5,14,22],opacity*.70);c.lineWidth=.85;c.stroke();}}});
 }
 for(const s of segments){
  if(s.kind!==3&&s.kind!==4)continue;
  const mid=mul(add(s.a,s.b),.5),distance=norm(sub(mid,cam.target)),local=1-ramp(mix(185,1400,whole),mix(480,2200,whole),distance);if(local<.005)continue;
  const p=projectSegment(s.a,s.b,cam);if(!p)continue;
  const depth=(p[0][2]+p[1][2])/2,fog=(1-ramp(mix(800,2400,whole),FAR,depth))*ramp(NEAR,205,depth);
  const a=detail*local*fog*(s.kind===4?.19:.15)*planLayerVisibility(mid[1],cam);queue.push({depth,draw:()=>screenLine(c,...p,s.kind===4?COPPER:STEEL,a,s.kind===4?1.3:1)});
 }
 return queue;
}
function drawRoute(c,points,cam,color,primary,opacity,queue,colorAt=()=>color){
 const n=points.length,lines=[],lengths=makeCurve(points).lengths,total=lengths.at(-1);
 for(let i=1;i<n;i++){const p=projectSegment(points[i-1],points[i],cam);if(!p)continue;const u=total>.0001?lengths[i]/total:1,depth=(p[0][2]+p[1][2])/2,fade=1-ramp(2900,FAR,depth),strength=opacity*fade*planLayerVisibility((points[i-1][1]+points[i][1])/2,cam)*(primary?.13+.87*ramp(.15,1,u):.12+.75*u);lines.push({p,depth,strength,color:colorAt(u),width:clamp((p[0][3]+p[1][3])/2,.65,2.6)*(primary?4.9:2.35)});}
 // Route segments and solid faces share depth order; foreground walls can
 // occlude a search. There are no black per-segment masks between line cores.
 for(const l of lines)queue.push({depth:l.depth,draw:()=>{screenLine(c,...l.p,l.color,l.strength*.09,l.width+7);screenLine(c,...l.p,l.color,l.strength,l.width);if(primary)screenLine(c,...l.p,CORE,l.strength*.94,Math.max(1.3,l.width*.36));}});
 const head=cameraSpace(points.at(-1),cam);if(head[2]<NEAR||head[2]>FAR)return;
 const p=projected(head,cam),r=clamp(p[3]*(primary?4.6:3),2,8);queue.push({depth:head[2]-.01,draw:()=>{const headAlpha=opacity*planLayerVisibility(points.at(-1)[1],cam);c.fillStyle=rgb(primary?CORE:colorAt(1),headAlpha);c.fillRect(p[0]-r,p[1]-r,r*2,r*2);screenLine(c,[p[0]+r+3,p[1]-r],[p[0]+r+14,p[1]-r],colorAt(1),headAlpha*.8,1.5);}});
}
const HANDOFF_REPRESENTATIVES=[4,18,32,46,60,74,88,102,116];
const searchBirth=stream=>88+39*(stream/(STREAM_COUNT-1))**.78;
const searchLanes=Array.from({length:STREAM_COUNT},(_,i)=>i===0?[0,0,0]:mul(unit([hash(i*47+31)-.5,hash(i*83+17)-.5,hash(i*139+67)-.5]),2+6*hash(i*193+41)));
function searchColor(stream,t,u){
 if(stream===0)return GOLD;
 const variation=hash(stream*47+391),phase=t*(.25+.16*variation)+u*(2.1+variation)*Math.PI+stream*2.399;
 const flowing=[0,2.094,4.189].map((p,j)=>25+225*(.5+.5*Math.sin(phase+p+.28*Math.sin(t*.31+stream*.43+j))));
 return lerp(routeColors[stream],flowing,.74*ramp(88,112,t));
}
export function mazeStageAt(t){return {reveal:ramp(66.5,94,t),wholeMaze:ramp(76,94,t),fixedPlan:ramp(103,112,t),activeStreams:1+Array.from({length:STREAM_COUNT-1},(_,k)=>k+1).filter(i=>ramp(searchBirth(i),searchBirth(i)+.7,t)>.001).length,primaryMorph:0,waveStreams:0,handoff:ramp(130.1,131.65,t),continuingSearches:t>121,streamCount:STREAM_COUNT};}
function drawSearch(c,t,cam,stream,worldQueue,screenQueue){
 const birth=searchBirth(stream),visible=stream===0?1:ramp(birth,birth+.7,t);if(visible<.001)return;
 const phase=stream?mix(-.34,.34,hash(stream*113+8))*ramp(88,94,t):0;
 const representative=HANDOFF_REPRESENTATIVES.indexOf(stream),leaving=t>130.1;
 let at=stream?t+phase:Math.min(121,t);
 if(leaving&&stream){
  const entry=130.1+phase;
  if(representative>=0){
   // Nine chosen heads finish the excursion they were already following.
   // Their return travels through real passages, never across a wall.
   const nextReturn=121+Math.ceil((entry-121)/.72)*.72;
   at=mix(entry,nextReturn,ramp(130.1,130.64,t));
  }else{
   // The other searches decelerate in place and retract along their own
   // traces. They never enter the outgoing screen-space connector layer.
   at=entry+.07*(1-Math.exp(-(t-130.1)/.07));
  }
 }
 let points=trace(at,stream,stream===0?1.05:.76).map(p=>add(p,mul(searchLanes[stream],ramp(0,CELL*.65,norm(p)))));
 if(stream===0&&t>121)points=slice(makeCurve(points),ramp(121,124,t),1);
 let opacity=visible*(stream===0?1:.25+.24*hash(stream*37));
 if(leaving){
  const shrink=representative>=0?ramp(130.45,130.94,t):ramp(130.1,131.16,t);
  points=slice(makeCurve(points),shrink,1);
  opacity*=1-ramp(representative>=0?130.64:130.1,representative>=0?131.12:131.25,t);
 }
 drawRoute(c,points,cam,routeColors[stream],stream===0,opacity,worldQueue,u=>searchColor(stream,t,u));
 if(!leaving||representative<0||t<=130.64)return;
 // First establish three aligned row directions from the common origin.
 // Only after those directions exist do their three module branches grow.
 // This is nine representatives, not 128 pointwise interpolations.
 const [x,y]=MODULE_CENTRES[representative],row=Math.floor(representative/3),col=representative%3;
 const origin=projected(cameraSpace([0,0,0],cam),cam).slice(0,2),rowPoint=[origin[0],y];
 const spine=ramp(130.64,131.04,t),branch=ramp(131.01,131.65,t),color=searchColor(stream,t,.85);
 const strength=.78*ramp(130.64,130.84,t),width=2.1;
 if(col===1)screenQueue.push(()=>screenLine(c,origin,lerp(origin,rowPoint,spine),color,strength,width));
 if(branch>0){
  const end=lerp(rowPoint,[x,y],branch);
  if(col!==1)screenQueue.push(()=>screenLine(c,rowPoint,end,color,strength,width));
  else{const half=76*branch;screenQueue.push(()=>screenLine(c,[x-half,y],[x+half,y],color,strength,width));}
 }
}
export function codeMaze(c,t){
 const alpha=gate(START,END,t,1.5);if(alpha<.001)return;
 const cam=mazeCameraAt(t),structure=(1-ramp(130.2,131.8,t))*mix(1,.66,ramp(103,115,t));c.save();c.globalAlpha=alpha;c.beginPath();c.rect(0,0,1920,1080);c.clip();c.lineCap='round';c.lineJoin='miter';
 const worldQueue=drawSpace(c,cam,t,structure),screenQueue=[];
 for(let stream=STREAM_COUNT-1;stream>0;stream--)drawSearch(c,t,cam,stream,worldQueue,screenQueue);
 drawSearch(c,t,cam,0,worldQueue,screenQueue);
 worldQueue.sort((a,b)=>b.depth-a.depth);for(const layer of worldQueue)layer.draw();for(const draw of screenQueue)draw();
 let impact=0;for(const run of RETURN_RUNS){const d=t-run.end;if(Math.abs(d)<.18)impact+=Math.exp(-((d/.043)**2));}
 const home=cameraSpace([0,0,0],cam),markAlpha=(1-ramp(130,131.4,t));
 if(home[2]>NEAR&&home[2]<FAR){
  const p=projected(home,cam),r=clamp(p[3]*11,6,23);c.strokeStyle=rgb(GOLD,(.65+impact*.3)*markAlpha);c.lineWidth=1.8;c.strokeRect(p[0]-r,p[1]-r,r*2,r*2);
  screenLine(c,[p[0]-r-8,p[1]],[p[0]-r-2,p[1]],GOLD,markAlpha,2);screenLine(c,[p[0]+r+2,p[1]],[p[0]+r+8,p[1]],GOLD,markAlpha,2);
  if(p[0]>80&&p[0]<1790&&p[1]>60&&p[1]<900)text(c,'原点',p[0],p[1]+r+22,16,GOLD,alpha*markAlpha,{tracking:2});
 }
 const state=returnAt(t),count=state.completed,a=alpha*(1-ramp(130,131.4,t));
 text(c,String(count).padStart(2,'0'),1760,196,52,ivory,a,{sans:true,weight:300});text(c,'次回到原点',1760,241,18,GOLD,a,{tracking:1});
 for(let i=0;i<72;i++){const x=1692+(i%12)*13,y=281+Math.floor(i/12)*11;screenLine(c,[x,y],[x+4,y],i<count?GOLD:STEEL,(i<count?.47:.12)*a,1);}
 c.restore();
}
