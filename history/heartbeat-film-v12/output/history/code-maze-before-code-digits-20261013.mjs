import {RETURN_RUNS,returnAt,MODULE_CENTRES} from './code-direction.mjs';
import {ramp,gate,hash,mix,clamp,rgb} from './drawing.mjs';

// A fixed, full-frame plan: positions below are screen-space coordinates.
// Walls, searches, returns and outgoing connections all share this one map.
export const STREAM_COUNT=240;
const COLS=43,ROWS=25,CELL=54,START=61.5,END=132,HANDOFF=130.1;
const RETURN_END=RETURN_RUNS.at(-1).end;
const ORIGIN=[960,540],GOLD=[239,180,104],CORE=[255,245,221];
const id=(x,y)=>y*COLS+x,coord=n=>[n%COLS,Math.floor(n/COLS)];
const plane=n=>{const [x,y]=coord(n);return [ORIGIN[0]+(x-21)*CELL,ORIGIN[1]+(y-12)*CELL];};
const HOME=id(21,12),N=COLS*ROWS,graph=Array.from({length:N},()=>[]);
const lerp=(a,b,u)=>a.map((v,k)=>mix(v,b[k],u));
const distance=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
function adjacent(n){const [x,y]=coord(n);return [[x-1,y],[x+1,y],[x,y-1],[x,y+1]].filter(([a,b])=>a>=0&&a<COLS&&b>=0&&b<ROWS).map(([a,b])=>id(a,b));}
function connect(a,b){if(!graph[a].includes(b)){graph[a].push(b);graph[b].push(a);}}
const visited=new Set([HOME]),stack=[HOME];let randomStep=0;
while(stack.length){const a=stack.at(-1),options=adjacent(a).filter(b=>!visited.has(b));if(!options.length){stack.pop();continue;}const b=options[Math.floor(hash(++randomStep*53+601)*options.length)];connect(a,b);visited.add(b);stack.push(b);}
// Braided passages permit genuinely different outward and return walks.
// A single rooted shortest-path tree would funnel every search into a few lines.
for(let a=0;a<N;a++)for(const b of adjacent(a))if(b>a&&!graph[a].includes(b)&&hash(a*173+b*29+811)<.34)connect(a,b);
for(const b of adjacent(HOME))connect(HOME,b);
const edgeKey=(a,b)=>a<b?a*N+b:b*N+a;
class Heap{
 constructor(){this.items=[];}
 push(v){const a=this.items;a.push(v);let i=a.length-1;while(i){const p=(i-1)>>1;if(a[p][0]<=v[0])break;a[i]=a[p];i=p;}a[i]=v;}
 pop(){const a=this.items,first=a[0],last=a.pop();if(a.length){let i=0;while(i*2+1<a.length){let j=i*2+1;if(j+1<a.length&&a[j+1][0]<a[j][0])j++;if(a[j][0]>=last[0])break;a[i]=a[j];i=j;}a[i]=last;}return first;}
}
function routeBetween(start,end,seed,used=new Set()){
 const costs=new Float64Array(N).fill(Infinity),prev=new Int32Array(N).fill(-1),queue=new Heap();costs[start]=0;prev[start]=start;queue.push([0,start]);
 while(queue.items.length){const [cost,a]=queue.pop();if(cost!==costs[a])continue;if(a===end)break;
  for(const b of graph[a]){const key=edgeKey(a,b),next=cost+1+hash(key*.027+seed)*1.6+(used.has(key)?2.7:0);if(next<costs[b]){costs[b]=next;prev[b]=a;queue.push([next,b]);}}
 }
 if(prev[end]<0)throw new Error('Disconnected planar maze');const out=[end];while(out.at(-1)!==start)out.push(prev[out.at(-1)]);return out.reverse();
}
function makeCurve(points){const lengths=[0];for(let k=1;k<points.length;k++)lengths.push(lengths.at(-1)+distance(points[k-1],points[k]));return {points,lengths,total:lengths.at(-1)};}
function curveFromCells(cells){for(let k=1;k<cells.length;k++)if(!graph[cells[k-1]].includes(cells[k]))throw new Error('Search crossed a wall');return makeCurve(cells.map(plane));}
function sample(curve,d){d=clamp(d,0,curve.total);let lo=0,hi=curve.points.length-1;while(hi-lo>1){const m=(lo+hi)>>1;if(curve.lengths[m]<d)lo=m;else hi=m;}const a=curve.lengths[lo],span=curve.lengths[hi]-a;return {point:lerp(curve.points[lo],curve.points[hi],span>.000001?(d-a)/span:0),next:hi};}
function slice(curve,a,b){a=clamp(a,0,curve.total);b=clamp(b,a,curve.total);const points=[sample(curve,a).point];for(let k=1;k<curve.points.length-1;k++)if(curve.lengths[k]>a&&curve.lengths[k]<b)points.push(curve.points[k]);points.push(sample(curve,b).point);return points;}
function target(seed){return id(4+Math.floor(hash(seed*41+117)*35),3+Math.floor(hash(seed*83+37)*19));}
function closedWalk(start,seed,stops=2){
 const cells=[start],used=new Set();let at=start;
 for(let k=0;k<=stops;k++){
  let end=k===stops?start:target(seed+k*971);if(end===at&&k<stops)end=target(seed+k*811+317);
  const path=routeBetween(at,end,seed+k*1901,used);for(let j=1;j<path.length;j++)used.add(edgeKey(path[j-1],path[j]));cells.push(...path.slice(1));at=end;
 }
 return curveFromCells(cells);
}
const mainCurves=RETURN_RUNS.map((r,i)=>closedWalk(HOME,811+i*137,1+i%2));
const introCurve=closedWalk(HOME,109813,1);
const birth=i=>i===0?START:82+42*(i/(STREAM_COUNT-1))**.72;
const births=Array.from({length:STREAM_COUNT},(_,i)=>{
 if(i===0)return HOME;
 const cell=((i-1)*97)%239,col=cell%20,row=Math.floor(cell/20);
 return id(4+Math.floor((col+.16+.68*hash(i*17))/20*35),3+Math.floor((row+.16+.68*hash(i*31))/12*19));
});
const searches=Array.from({length:STREAM_COUNT},(_,i)=>i===0?null:{
 speed:92+138*hash(i*73+17),phase:hash(i*91+47)*Math.PI*2,
 curves:Array.from({length:3},(_,k)=>closedWalk(births[i],i*1193+k*7127+97,2)),
 lane:[(hash(i*61)-.5)*5,(hash(i*37)-.5)*5]
});
function mainTrace(t){
 if(t<66){const d=introCurve.total*ramp(START,66,t);return slice(introCurve,Math.max(0,d-940),d);}
 const r=returnAt(Math.min(t,RETURN_END)),global=r.index+r.u,from=Math.max(0,global-.65),out=[];
 for(let k=Math.floor(from);k<=Math.floor(global)&&k<72;k++){
  const curve=mainCurves[k],a=clamp(from-k),b=clamp(global-k);if(b<=a)continue;const p=slice(curve,ramp(0,1,a)*curve.total,ramp(0,1,b)*curve.total);out.push(...p.slice(out.length?1:0));
 }
 const p=out.length>1?out:[ORIGIN,ORIGIN];if(t<=RETURN_END)return p;const curve=makeCurve(p);return slice(curve,curve.total*ramp(RETURN_END,Math.min(HANDOFF,RETURN_END+.42),t),curve.total);
}
// Integrate the speed curve rather than multiplying elapsed time by speed.
// Every head stays continuous while the whole maze accelerates fivefold.
function speedFactor(t){return .65+4.35*ramp(82,RETURN_END,t);}
function travelClock(t){
 const span=RETURN_END-82,u=clamp((t-82)/span);
 return .65*(t-82)+4.35*(span*(u**3-.5*u**4)+Math.max(0,t-RETURN_END));
}
function secondaryState(i,t){
 const s=searches[i];let d=Math.max(0,travelClock(t)-travelClock(birth(i)))*s.speed,which=0;
 while(d>s.curves[which%3].total){d-=s.curves[which%3].total;which++;}
 const curve=s.curves[which%3],head=sample(curve,d),length=150+230*hash(i*57+271),points=slice(curve,Math.max(0,d-length),d);
 if(d<length&&which>0){const previous=s.curves[(which-1)%3],prefix=slice(previous,Math.max(0,previous.total-length+d),previous.total);points.unshift(...prefix.slice(0,-1));}
 // Sub-cell lanes separate concurrent searches while remaining in a corridor.
 const shifted=points.map(p=>[p[0]+s.lane[0],p[1]+s.lane[1]]);
 return {points:shifted,head:shifted.at(-1),curve,d,next:head.next,plan:which};
}
function routePoints(i,t){return i===0?mainTrace(t):secondaryState(i,t).points;}
function nearestModule(p){let chosen=0,best=Infinity;MODULE_CENTRES.forEach((q,k)=>{const d=distance(p,q);if(d<best){best=d;chosen=k;}});return chosen;}
function nodeAt(p){return id(clamp(Math.round((p[0]-960)/CELL)+21,0,COLS-1),clamp(Math.round((p[1]-540)/CELL)+12,0,ROWS-1));}
const groupRanks=new Uint16Array(9);
const handoffs=Array.from({length:STREAM_COUNT},(_,i)=>{
 const state=i===0?{points:mainTrace(HANDOFF),head:ORIGIN}:secondaryState(i,HANDOFF),module=nearestModule(state.head),rank=groupRanks[module]++;
 const [cx,cy]=MODULE_CENTRES[module],lane=((rank%13)-6)*2.2,entry=nodeAt(state.head),anchor=nodeAt([cx,cy]);
 // Start at the live head, finish its current cell segment, then follow the
 // same actual graph toward the nearest scene. There is no all-screen lerp.
 const first=i===0?HOME:nodeAt(state.curve.points[state.next]),cells=routeBetween(first,anchor,i*413+831),join=plane(first);
 const approach=[...state.points,join,...cells.slice(1).map(plane)];
 const side=state.head[0]<cx?-1:1,offset=76+13*hash(i*71);
 approach.push([cx+side*offset,plane(anchor)[1]],[cx+side*offset,cy+lane],[cx-side*(35+hash(i*11)*54),cy+lane]);
 const curve=makeCurve(approach),prefix=makeCurve(state.points).total,start=HANDOFF+Math.floor(module/3)*.045+(rank%9)*.012;
 return {curve,prefix,module,rank,lane,start,end:131.78+(rank%5)*.025};
});
function visibleRoute(i,t){
 if(t<=HANDOFF)return routePoints(i,t);
 const h=handoffs[i],d=mix(h.prefix,h.curve.total,ramp(h.start,h.end,t)),tail=mix(h.prefix,i===0?410:210+150*hash(i*97),ramp(HANDOFF,HANDOFF+.5,t));
 return slice(h.curve,Math.max(0,d-tail),d);
}
function hue(h,s=.78,l=.57){const a=s*Math.min(l,1-l);return [0,8,4].map(n=>{const k=(n+h/30)%12;return 255*(l-a*Math.max(-1,Math.min(k-3,9-k,1)));});}
const identities=Array.from({length:STREAM_COUNT},(_,i)=>hue((i*137.508+24)%360));
function routeColor(i,t,u){if(i===0)return GOLD;const phase=t*(.19+.12*hash(i*41))+i*2.399+u*2.7,flow=[0,2.094,4.189].map(p=>22+222*(.5+.5*Math.sin(phase+p)));return lerp(identities[i],flow,.52);}
const wallSegments=[];
for(let n=0;n<N;n++){
 const [x,y]=coord(n),[px,py]=plane(n);
 if(x===0||!graph[n].includes(n-1))wallSegments.push({a:[px-CELL/2,py-CELL/2],b:[px-CELL/2,py+CELL/2],vertical:true});
 if(y===0||!graph[n].includes(n-COLS))wallSegments.push({a:[px-CELL/2,py-CELL/2],b:[px+CELL/2,py-CELL/2],vertical:false});
 if(x===COLS-1)wallSegments.push({a:[px+CELL/2,py-CELL/2],b:[px+CELL/2,py+CELL/2],vertical:true});
 if(y===ROWS-1)wallSegments.push({a:[px-CELL/2,py+CELL/2],b:[px+CELL/2,py+CELL/2],vertical:false});
}
function drawWalls(c,t){
 const fade=1-ramp(130.48,131.8,t);c.lineCap='square';
 for(const wall of wallSegments){
  const [a,b]=[wall.a,wall.b];if(Math.max(a[0],b[0])<-12||Math.min(a[0],b[0])>1932||Math.max(a[1],b[1])<-12||Math.min(a[1],b[1])>1092)continue;
  const away=distance([(a[0]+b[0])/2,(a[1]+b[1])/2],ORIGIN),reveal=mix(.13,1,ramp(62+away/210,69+away/175,t)),alpha=fade*reveal;
  c.strokeStyle=rgb([2,7,12],alpha*.86);c.lineWidth=13;c.beginPath();c.moveTo(a[0]+2,a[1]+2);c.lineTo(b[0]+2,b[1]+2);c.stroke();
  c.strokeStyle=rgb(wall.vertical?[30,51,62]:[35,59,69],alpha);c.lineWidth=8.6;c.beginPath();c.moveTo(...a);c.lineTo(...b);c.stroke();
  c.strokeStyle=rgb([59,85,91],alpha*.68);c.lineWidth=1;c.beginPath();c.moveTo(a[0]-2.6,a[1]-2.6);c.lineTo(b[0]-2.6,b[1]-2.6);c.stroke();
 }
}
function drawRoute(c,i,t,points,opacity){
 if(opacity<.002||points.length<2)return;
 const curve=makeCurve(points),total=curve.total,primary=i===0,width=primary?3.1:1.2+.45*hash(i*31);c.lineCap='round';c.lineJoin='round';
 for(let k=1;k<points.length;k++){
  const a=points[k-1],b=points[k];if(distance(a,b)<.005)continue;
  const u=total?curve.lengths[k]/total:1,ua=total?curve.lengths[k-1]/total:0,alpha=opacity*(.10+.90*u),color=routeColor(i,t,u);
  const gradient=c.createLinearGradient(...a,...b);gradient.addColorStop(0,rgb(routeColor(i,t,ua),alpha));gradient.addColorStop(1,rgb(color,alpha));
  c.strokeStyle=rgb(color,alpha*.10);c.lineWidth=width+4;c.beginPath();c.moveTo(...a);c.lineTo(...b);c.stroke();
  c.strokeStyle=gradient;c.lineWidth=width;c.beginPath();c.moveTo(...a);c.lineTo(...b);c.stroke();
  if(primary){c.strokeStyle=rgb(CORE,alpha*.87);c.lineWidth=.95;c.stroke();}
 }
 const head=points.at(-1),size=primary?7:3.4+hash(i*91)*1.4;c.fillStyle=rgb(primary?CORE:routeColor(i,t,1),opacity);c.fillRect(head[0]-size/2,head[1]-size/2,size,size);
}
export function mazeStageAt(t){return {projection:'fixed-planar',grid:[COLS,ROWS],cellSize:CELL,origin:[...ORIGIN],activeStreams:Array.from({length:STREAM_COUNT},(_,i)=>i).filter(i=>t>=birth(i)).length,streamCount:STREAM_COUNT,waveStreams:0,primaryMorph:0,handoff:ramp(HANDOFF,131.9,t),continuingSearches:t>RETURN_END,counterBounds:[...COUNTER_BOUNDS],speedFactor:speedFactor(t)};}
export function mazeDiagnosticsAt(t){return {...mazeStageAt(t),head:visibleRoute(0,t).at(-1),returns:returnAt(t).completed,routes:Array.from({length:STREAM_COUNT},(_,i)=>({id:i,birthTime:birth(i),birthPoint:plane(births[i]),visible:t>=birth(i),head:visibleRoute(i,t).at(-1),headSize:i===0?7:3.4+hash(i*91)*1.4,module:handoffs[i].module,instantaneousSpeed:i===0?null:searches[i].speed*speedFactor(t)}))};}
const COUNTER_BOUNDS=[630,312,660,410],COUNTER_SIZE=296;
const digitTextures=new Map();
function digitTexture(n){
 if(digitTextures.has(n))return digitTextures.get(n);
 const canvas=document.createElement('canvas');canvas.width=520;canvas.height=380;
 const c=canvas.getContext('2d');c.fillStyle='#f4efdf';c.textAlign='center';c.textBaseline='middle';
 c.font=`500 ${COUNTER_SIZE}px "Bahnschrift", "Arial", sans-serif`;
 c.fillText(String(n).padStart(2,'0'),260,190);
 digitTextures.set(n,canvas);return canvas;
}
export function mazeCounterAt(t){
 const completed=returnAt(t).completed;
 if(!completed)return {from:0,to:0,progress:1,active:false,bounds:[...COUNTER_BOUNDS]};
 const event=RETURN_RUNS[completed-1],next=RETURN_RUNS[completed],gap=next?next.end-event.end:event.end-event.start;
 const duration=clamp(gap*.72,.22,.52),progress=clamp((t-event.end)/duration);
 return {from:completed-1,to:completed,progress,active:progress<1,bounds:[...COUNTER_BOUNDS],start:event.end,end:event.end+duration};
}
function staticHalf(c,tex,upper,opacity){
 const sy=upper?0:190;c.globalAlpha=opacity;
 c.drawImage(tex,0,sy,520,190,700,330+sy,520,190);
}
function foldedHalf(c,tex,upper,angle,opacity){
 // Each glyph half rotates about its centre hinge in perspective. Transparent
 // strips map the actual glyph, with no card, frame or backing rectangle.
 const sine=Math.sin(angle),cosine=Math.cos(angle),hingeY=520;
 for(let sy=upper?0:190;sy<(upper?190:380);sy+=2){
  const y0=sy-190,y1=Math.min(sy+2,380)-190;
  const project=y=>{const z=Math.abs(y)*sine,q=880/(880-z);return {y:hingeY+y*cosine*q,q};};
  const a=project(y0),b=project(y1),q=(a.q+b.q)*.5,dy=Math.min(a.y,b.y),dh=Math.abs(b.y-a.y);
  if(dh<.005)continue;
  c.globalAlpha=opacity*(.58+.42*Math.abs(cosine));
  c.drawImage(tex,0,sy,520,Math.min(2,380-sy),960-260*q,dy,520*q,dh+.18*Math.sin(angle));
 }
}
function drawCounter(c,t,opacity){
 const a=mazeCounterAt(t),show=opacity*ramp(62,64,t)*(1-ramp(130.02,130.82,t));if(show<.001)return;
 const current=digitTexture(a.to);c.save();
 if(!a.active){c.globalAlpha=show;c.drawImage(current,700,330);}
 else{
  const prior=digitTexture(a.from),u=a.progress;
  // Under the falling top is the next top; the old lower half remains until
  // the new lower half unfolds. Ease within the two phases, not across counts.
  if(u<.5){
   const angle=ramp(0,.5,u)*Math.PI/2,edge=520-190*Math.cos(angle)*880/(880-190*Math.sin(angle));
   c.save();c.beginPath();c.rect(630,312,660,Math.max(0,edge-312));c.clip();staticHalf(c,current,true,show);c.restore();
   staticHalf(c,prior,false,show);foldedHalf(c,prior,true,angle,show);
  }else{
   const angle=(1-ramp(.5,1,u))*Math.PI/2,edge=520+190*Math.cos(angle)*880/(880-190*Math.sin(angle));
   staticHalf(c,current,true,show);
   c.save();c.beginPath();c.rect(630,edge,660,Math.max(0,722-edge));c.clip();staticHalf(c,prior,false,show);c.restore();
   foldedHalf(c,current,false,angle,show);
  }
 }
 c.restore();
}
export function codeMaze(c,t){
 const alpha=gate(START,END,t,1.5);if(alpha<.001)return;
 c.save();c.globalAlpha=alpha;c.beginPath();c.rect(0,0,1920,1080);c.clip();
 const background=c.createRadialGradient(960,520,60,960,520,1240);background.addColorStop(0,'#0b1c27');background.addColorStop(1,'#040d15');c.fillStyle=background;c.fillRect(0,0,1920,1080);
 drawWalls(c,t);
 const mark=(1-ramp(130.1,130.9,t));if(mark>.001){c.strokeStyle=rgb(GOLD,mark*.83);c.lineWidth=1.6;c.strokeRect(952,532,16,16);}
 for(let i=STREAM_COUNT-1;i>=0;i--){const a=i===0?1:ramp(birth(i),birth(i)+.8,t)*(.47+.26*hash(i*17));if(a>.001)drawRoute(c,i,t,visibleRoute(i,t),a);}
 drawCounter(c,t,alpha);
 c.restore();
}
