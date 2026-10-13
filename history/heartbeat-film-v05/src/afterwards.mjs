import {TAU,mix,ramp,gate,hash,coral,gold,teal,blue,ivory,blend,project,path,spot,dot,ring,text} from './drawing.mjs';
import {pulse,NODE_TIMES,CONNECTIONS} from './score.mjs';
import {ORIGIN,journeyAt,routeSlice} from './journeys.mjs';
import {drawMotif} from './motifs.mjs';

function terrain(c,t,a){
 // Different contour fields replace the repeated spiral tiles. They are a
 // landscape for the journey: the route remains the brightest moving mark.
 const islands=[[475,410,305,.65,1.2],[1320,425,425,.58,2.6],[860,700,280,.48,4.4]];
 for(let h=0;h<islands.length;h++){
  const [x,y,R,stretch,phase]=islands[h];
  for(let k=0;k<15;k++){
   const rr=R*(.18+k*.059),pts=[];
   for(let j=0;j<=150;j++){const q=j/150*TAU,noise=1+.16*Math.sin(q*(3+h)+phase)+.11*Math.cos(q*2-phase)+.025*Math.sin(q*7+t*.12);pts.push([x+Math.cos(q)*rr*noise,y+Math.sin(q)*rr*stretch*noise]);}
   path(c,pts,blend(blue,gold,h*.25),a*(k%4===0?.19:.072),k%4===0?.9:.55);
  }
 }
 for(let k=0;k<85;k++){
  const x=140+hash(k+71)*1640,y=180+hash(k+142)*670;
  path(c,[[x-3,y],[x+3,y]],gold,a*.16,.55);path(c,[[x,y-3],[x,y+3]],gold,a*.16,.55);
 }
}
function history(c,t,a){
 const state=journeyAt(t),cols=[gold,teal,coral];
 for(let i=0;i<=state.index;i++){
  const u=i<state.index?1:state.progress,pts=routeSlice(i,u),settle=ramp(40.625+i*3.125,41.125+i*3.125,t);
  path(c,pts,cols[i],a*mix(.72,.25,settle),mix(1.5,.85,settle));
  for(let k=18;k<pts.length;k+=54){const p=pts[k],last=pts[k-1],angle=Math.atan2(p[1]-last[1],p[0]-last[0]);path(c,[[p[0]+Math.cos(angle+.7)*-5,p[1]+Math.sin(angle+.7)*-5],p,[p[0]+Math.cos(angle-.7)*-5,p[1]+Math.sin(angle-.7)*-5]],cols[i],a*.38,.7);}
 }
 return state;
}
export function labyrinth(c,t){
 const a=ramp(37.3,39,t)*(1-ramp(48,59.375,t));if(a<.002)return;
 terrain(c,t,a*(1-ramp(47.5,52,t)));
 const state=history(c,t,a),[x,y]=state.position;
 ring(c,...ORIGIN,14,gold,a*.72,1);ring(c,...ORIGIN,20,blue,a*.28,.6);
 path(c,[[ORIGIN[0]-29,ORIGIN[1]],[ORIGIN[0]-21,ORIGIN[1]]],gold,a*.6,.8);
 path(c,[[ORIGIN[0]+21,ORIGIN[1]],[ORIGIN[0]+29,ORIGIN[1]]],gold,a*.6,.8);
 text(c,'原点',ORIGIN[0],ORIGIN[1]+44,21,ivory,a*.85*(1-ramp(55,57,t)),{tracking:4});
 const countAlpha=gate(38.125,49,t,.6);
 text(c,String(state.completed).padStart(2,'0'),1570,139,65,ivory,countAlpha*.88);
 text(c,state.completed?'次 / 回到这里':'尚未抵达',1570,197,19,gold,countAlpha*.75,{tracking:3});
 for(let i=0;i<3;i++){const end=40.625+i*3.125,p=ramp(end,end+.24,t)*(1-ramp(end+.24,end+.65,t));ring(c,...ORIGIN,19+28*ramp(end,end+.65,t),[gold,teal,coral][i],a*p*.65,1.1);}
 const head=1-ramp(48,50,t);spot(c,x,y,33,coral,a*.75*head);dot(c,x,y,3.3,ivory,a*head);
}

const LOC=[[-692,-86,81.8],[-542,151,-57.6],[-210,-172,106.1],[366,-217,-42.4],[692,197,130.3],[411,331,-15.2],[-24,467,33.3],[-211,142,-103],[85,-134,-190.9]];
const nodeCamera=t=>({yaw:mix(-.32,.25,ramp(57.5,80,t)),pitch:.20+.06*Math.sin((t-57.5)*.08),x:965,y:430,scale:1.05,depth:1900});
const nodeWorld=i=>[LOC[i][0],LOC[i][1],LOC[i][2]*3.3];
export function nodePoint(i,t){return project(nodeWorld(i),nodeCamera(t));}
export function seedPoint(t){
 const u=ramp(55,57.5,t),end=nodePoint(0,t);
 return [mix(ORIGIN[0],end[0],u)+Math.sin(u*Math.PI)*310,mix(ORIGIN[1],end[1],u)-Math.sin(u*Math.PI)*110];
}
export function silence(c,t){
 const a=gate(48,59.7,t,1.2);if(a<.002)return;
 const u=ramp(55,57.5,t),q=seedPoint(t),originFade=1-ramp(55,57,t);
 // A fixed point remains when its travelled history thins away. The same seed
 // finally departs, and its arrival is held until node 01 grows around it.
 ring(c,...ORIGIN,14,gold,a*.46*originFade,.8);
 const label=gate(50,54.7,t,.8);text(c,'走过的路，仍然留在这里。',960,674,25,ivory,label*.55,{tracking:2});
 const pts=[];for(let j=0;j<=120;j++){const v=j/120*u,end=nodePoint(0,t);pts.push([mix(ORIGIN[0],end[0],v)+Math.sin(v*Math.PI)*310,mix(ORIGIN[1],end[1],v)-Math.sin(v*Math.PI)*110]);}
 path(c,pts,teal,a*.21*ramp(55,55.2,t),.9);
 const bright=a*(1-ramp(59,59.7,t));spot(c,...q,42,teal,bright*.55);dot(c,...q,2.8,ivory,bright);
}
function linkCurve(a,b,i,u,t){
 const dx=b[0]-a[0],dy=b[1]-a[1],d=Math.hypot(dx,dy),bend=Math.sin(u*Math.PI)*(i-5)*14*Math.sin(t*.025+u*.8);
 return [mix(a[0],b[0],u)-dy/d*bend,mix(a[1],b[1],u)+dx/d*bend];
}
export function relations(c,t){
 const alpha=gate(57.1,84,t,1.8);if(alpha<.003)return;
 const P=Array.from({length:9},(_,i)=>nodePoint(i,t));
 const carried=gate(57.5,60.2,t,.5);spot(c,P[0][0],P[0][1],46,teal,carried*.35);dot(c,P[0][0],P[0][1],2.5,ivory,carried);
 for(const e of CONNECTIONS){
  const grow=ramp(e.time,e.time+.60,t),loss=1-ramp(e.loss,e.loss+.6,t);if(grow*loss<.002)continue;
  const A=P[e.from],B=P[e.to],color=blend(coral,teal,e.from/8);
  for(let k=0;k<11;k++){
   const pts=[];for(let j=0;j<=64;j++){const u=j/64;if(u>grow)break;pts.push(linkCurve(A,B,k,u,t));}
   // Include the precise tip rather than quantising growth to a path vertex.
   if(grow<1)pts.push(linkCurve(A,B,k,grow,t));
   path(c,pts,color,alpha*loss*(k===5?.52:.10),k===5?1.15:.6);
  }
  if(grow<1){const p=linkCurve(A,B,5,grow,t);spot(c,p[0],p[1],25,gold,alpha*loss*.65);}
 }
 const order=Array.from({length:9},(_,i)=>i).sort((i,j)=>P[j][2]-P[i][2]);
 for(const i of order){
  const birth=ramp(NODE_TIMES[i],NODE_TIMES[i]+.65,t),a=alpha*birth*Math.min(1,.72+P[i][3]*.2);if(a<.002)continue;
  const center=nodeWorld(i),cam=nodeCamera(t),origin=P[i],px=project([center[0]+1,center[1],center[2]],cam),py=project([center[0],center[1]+1,center[2]],cam);
  c.save();c.transform(px[0]-origin[0],px[1]-origin[1],py[0]-origin[0],py[1]-origin[1],origin[0],origin[1]);
  const open=ramp(NODE_TIMES[i]+.2,NODE_TIMES[i]+2,t),r=(i===8?124:99)*(.48+.52*open);
  drawMotif(c,i,t,a,r,open);
  const color=i===8?gold:i%3===0?coral:i%3===1?teal:gold;
  if(i!==8){spot(c,0,0,45,color,a*(.14+pulse(t,i%2)*.18));dot(c,0,0,2.2,ivory,a*.85);}
  c.restore();
 }
 const z=gate(61,66.4,t,.6);text(c,'记忆',295,153,25,gold,z*.65);text(c,'相遇',960,136,25,gold,z*.65);text(c,'未完成的愿望',1610,199,25,gold,z*.65);
}
export function ending(c,t){
 const a=ramp(80,83.5,t);if(a<.003)return;
 // Incomplete fragments of the three actual journeys remain at the edges.
 // The middle clears for the unanswered question; no replacement tile wall.
 for(let i=0;i<3;i++){
  const pts=routeSlice(i,1),segments=[];let current=[];
  for(const p of pts){const keep=p[0]<630||p[0]>1300||p[1]<235;if(keep)current.push(p);else if(current.length){segments.push(current);current=[];}}
  if(current.length)segments.push(current);
  for(let k=0;k<segments.length;k++){const loss=1-ramp(83+i*.6+k*.19,89.7,t)*.72;path(c,segments[k],[gold,teal,blue][i],a*.14*loss,.75);}
 }
 const p=pulse(t,0),pos=[960,731];path(c,[[851,731],[935,731],[951,727],[960,731],[974,731]],coral,a*.6,1.5);spot(c,...pos,28+p*20,coral,a*(.27+p*.3));dot(c,...pos,1.5+p,ivory,a);
}
