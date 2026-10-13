import {TAU,coral,gold,teal,blue,ivory,blend,project,path,dot,ring,text,heartWave,ramp} from './drawing.mjs';
import {drawDay} from './days.mjs';

const curve=(n,f)=>Array.from({length:n+1},(_,i)=>f(i/n));
// Each voice has its own construction and motion law. Common line treatment
// binds them to the film; their silhouettes are not variations of one badge.
function membrane(c,t,a,r,o,col){
 for(let k=0;k<21;k++){
  const v=k/20*2-1,rr=Math.sqrt(1-v*v)*r;
  const pts=curve(100,u=>{const q=u*TAU,d=1+.07*Math.sin(q*4+t*.7+v*3);return [Math.cos(q)*rr*d,Math.sin(q)*rr*.36+v*r*.68+Math.sin(q*2+t*.45)*8*(1-v*v)];});
  path(c,pts,blend(col,blue,k/25),a*(k%5===0?.5:.2),k%5===0?1.15:.6);
 }
 for(let k=0;k<16;k++){const q=k/16*TAU;path(c,curve(60,u=>{const v=u*2-1,rr=Math.sqrt(1-v*v)*r;return [Math.cos(q)*rr,Math.sin(q)*rr*.36+v*r*.68];}),col,a*.13,.65);}
 ring(c,0,0,r*.14,col,a*.65,.9);
}
function branching(c,t,a,r,o,col){
 function branch(x,y,angle,len,level,seed){
  const growth=ramp(level*.09,level*.09+.28,o),sway=Math.sin(t*.45+seed)*.055;
  const ex=x+Math.cos(angle+sway)*len*growth,ey=y+Math.sin(angle+sway)*len*growth;
  path(c,curve(12,u=>[x+(ex-x)*u+Math.sin(u*Math.PI)*Math.sin(seed)*len*.08,y+(ey-y)*u]),blend(col,gold,level/7),a*(.70-level*.07),1.65-level*.2);
  if(level<5){branch(ex,ey,angle-.49,len*.70,level+1,seed*1.31+2);branch(ex,ey,angle+.52,len*.67,level+1,seed*1.7+1);}
  else {dot(c,ex,ey,1.7,col,a*.8);path(c,[[ex-3,ey+3],[ex+4,ey-3]],gold,a*.45,.7);}
 }
 branch(0,r*.78,-Math.PI/2,r*.65,0,1);
 for(let i=0;i<7;i++)path(c,[[0,r*.78],[(i-3)*r*.2,r*(.98+.04*Math.sin(i))]],col,a*.2,.6);
}
const phi=(1+Math.sqrt(5))/2;
const crystalVertices=[[-1,phi,0],[1,phi,0],[-1,-phi,0],[1,-phi,0],[0,-1,phi],[0,1,phi],[0,-1,-phi],[0,1,-phi],[phi,0,-1],[phi,0,1],[-phi,0,-1],[-phi,0,1]];
const edges=[];for(let i=0;i<12;i++)for(let j=i+1;j<12;j++)if(Math.hypot(...crystalVertices[i].map((x,k)=>x-crystalVertices[j][k]))<2.01)edges.push([i,j]);
const faces=[];for(let i=0;i<12;i++)for(let j=i+1;j<12;j++)for(let k=j+1;k<12;k++)if([[i,j],[i,k],[j,k]].every(([a,b])=>edges.some(e=>e[0]===a&&e[1]===b)))faces.push([i,j,k]);
function crystal(c,t,a,r,o,col){
 const cam={yaw:t*.13,pitch:.3+Math.sin(t*.17)*.25,x:0,y:0,depth:650};
 for(let layer=3;layer>=0;layer--){
  const scale=r/(phi*1.3)*(1-layer*.17),P=crystalVertices.map(p=>project(p.map(v=>v*scale),cam));
  if(layer===0)for(const f of faces.slice().sort((a,b)=>b.reduce((s,i)=>s+P[i][2],0)-a.reduce((s,i)=>s+P[i][2],0)))path(c,f.map(i=>P[i]),col,a*.025,1,true,true);
  for(const [i,j] of edges)path(c,[P[i],P[j]],blend(col,blue,layer*.22),a*(layer===0?.6:.19),layer===0?1:.6);
  if(layer===0)P.forEach(p=>dot(c,p[0],p[1],2,col,a*.8));
 }
}
function vortices(c,t,a,r,o,col){
 for(let side=-1;side<=1;side+=2)for(let k=0;k<14;k++){
  const pts=curve(100,u=>{const q=u*TAU*1.43+side*t*.18+k*.065,rr=r*(.025+u*.67);return [side*r*.32+Math.cos(q)*rr,Math.sin(q)*rr*.78+side*(u-.5)*r*.3];});
  path(c,pts,blend(col,teal,k/30),a*(k%4===0?.45:.14),k%4===0?.9:.55);
 }
 path(c,curve(100,u=>[(u-.5)*r*2.2,Math.sin(u*TAU)*r*.3]),col,a*.24,.75);
}
function woven(c,t,a,r,o,col){
 const P=(x,y)=>project([x*r,y*r*.75,x*y*r*.5+Math.sin(x*4+t*.65+y)*r*.06],{x:0,y:0,pitch:.68,yaw:.3+Math.sin(t*.12)*.15,depth:650});
 for(let j=0;j<17;j++)for(let i=0;i<19;i++)if((i+j)%2===0){const x=i/19*1.8-.9,y=j/17*1.8-.9;path(c,[P(x,y),P(x+1.8/19,y),P(x+1.8/19,y+1.8/17),P(x,y+1.8/17)],blend(col,gold,i/19),a*.038,1,true,true);}
 for(let k=0;k<=22;k++){const v=k/22*1.8-.9;path(c,curve(60,u=>P(u*1.8-.9,v)),blend(col,gold,k/22),a*(k%5===0?.53:.23),k%5===0?1:.6);path(c,curve(60,u=>P(v,u*1.8-.9)),blue,a*.24,.6);}
}
function knot(c,t,a,r,o,col){
 const cam={x:0,y:0,depth:600,yaw:.45+Math.sin(t*.13)*.3,pitch:t*.055};
 for(let k=0;k<13;k++){
  const pts=curve(200,u=>{const q=u*TAU,off=(k-6)*1.7;return project([Math.sin(q*2)*r*.91+Math.cos(q)*off,Math.sin(q*3)*r*.7+Math.sin(q)*off,Math.cos(q)*r*.4],cam);});
  path(c,pts,blend(col,blue,k/20),a*(k===6?.65:k%4===0?.28:.10),k===6?1.2:.55);
 }
}
function broken(c,t,a,r,o,col){
 for(let k=0;k<11;k++){
  const R=r*(.25+k*.065),start=.3+k*.24+Math.sin(t*.2+k*.5)*.25,end=start+TAU*(.52+.014*k);
  path(c,curve(95,u=>{const q=start+(end-start)*u;return [Math.cos(q)*R,Math.sin(q)*R*.78];}),blend(col,blue,k/14),a*(k%3===0?.66:.23),k%3===0?1.1:.55);
  dot(c,Math.cos(start)*R,Math.sin(start)*R*.78,1.6,col,a*.6);
 }
 for(let k=0;k<48;k++){const q=k/48*TAU;if(k>28&&k<37)continue;path(c,[[Math.cos(q)*r,Math.sin(q)*r*.78],[Math.cos(q)*(r+5+(k%4===0?4:0)),Math.sin(q)*(r+5+(k%4===0?4:0))*.78]],col,a*.34,.7);}
}
function petals(c,t,a,r,o,col){
 for(let k=0;k<11;k++){
  const q=k/11*TAU+t*.065;
  for(let b=0;b<6;b++){
   const pts=curve(65,u=>{const v=u*Math.PI,rr=Math.sin(v)*r*(.91+b*.018),theta=q+(u-.5)*(.50-b*.036);return [Math.cos(theta)*rr,Math.sin(theta)*rr*.85];});
   path(c,pts,blend(col,coral,k/24),a*(b===0?.57:.15),b===0?.95:.55);
  }
 }
 for(let k=0;k<34;k++){const q=k*2.39996,rr=Math.sqrt(k)*r*.025;dot(c,Math.cos(q)*rr,Math.sin(q)*rr,1,gold,a*.7);}
}
function palimpsest(c,t,a,r,o,col){
 for(let k=7;k>=0;k--){
  const y=-k*9,x=Math.sin(k*.57+t*.15)*k*4,skew=Math.sin(k*.3+t*.12)*k*2,w=r*(1.12+k*.032),h=r*.59;
  const card=[[-w/2+x-skew,y-h/2],[w/2+x-skew,y-h/2],[w/2+x+skew,y+h/2],[-w/2+x+skew,y+h/2]];
  path(c,card,blue,a*.055,1,true,true);path(c,card,blend(col,blue,k/9),a*(k===0?.75:.22),k===0?1:.65,true);
  path(c,curve(80,u=>[x+(u-.5)*w*.86,y+8-heartWave(u)*h*.48]),k===0?coral:col,a*(k===0?.8:.16),k===0?1.4:.6);
  if(k===0)drawDay(c,t,x,y-h*.31,9,a*.9,{tracking:2});
 }
 for(let k=0;k<6;k++){const x=(k-2.5)*r*.26;path(c,[[x,r*.34],[x,r*(.55+k*.035)]],col,a*.3,.7);dot(c,x,r*(.55+k*.035),1.5,col,a*.6);}
}
const DRAW=[membrane,branching,crystal,vortices,woven,knot,broken,petals,palimpsest];
export function drawMotif(c,i,t,a,r,o=1){
 const color=i===8?gold:i%3===0?coral:i%3===1?teal:gold;
 DRAW[i](c,t,a,r,o,color);
}
