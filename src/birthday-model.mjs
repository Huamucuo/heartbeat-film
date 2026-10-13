import {TAU,mix,ramp,gate,blend} from './drawing.mjs';
import {Solid} from './solids.mjs';
import {cylinder,ellipsoid,rod} from './model-kit.mjs';
const cream=[235,213,174],sponge=[175,124,81],berry=[161,64,49],chocolate=[116,72,53];
function lathe(s,x,z,profile,color,a=1,n=80){
 const P=(j,i)=>[x+Math.cos(i/n*TAU)*profile[j][0],profile[j][1],z+Math.sin(i/n*TAU)*profile[j][0]];
 for(let j=0;j<profile.length-1;j++)for(let i=0;i<n;i++)s.face([P(j,i),P(j+1,i),P(j+1,i+1),P(j,i+1)],color,a);
}
function wedge(s,a0,a1,base,height,r,col,a,cutLeft,cutRight){
 const n=10,top=[[0,base-height,0]],bot=[[0,base,0]];
 for(let i=0;i<=n;i++){const u=mix(a0,a1,i/n);top.push([r*Math.cos(u),base-height,r*Math.sin(u)]);bot.push([r*Math.cos(u),base,r*Math.sin(u)]);}
 s.face(top,col,a);s.face(bot.slice().reverse(),col,a);
 for(let i=1;i<=n;i++)s.face([top[i+1],top[i],bot[i],bot[i+1]],col,a);
 if(cutLeft)s.face([top[0],top[1],bot[1],bot[0]].reverse(),col,a);
 if(cutRight)s.face([top.at(-1),top[0],bot[0],bot.at(-1)].reverse(),col,a);
}
function strawberry(s,x,y,z,scale=1,a=1){
 const n=20,m=12,P=(i,j)=>{const v=i/m*Math.PI,u=j/n*TAU,r=Math.sin(v)*(1+.25*Math.cos(v));return [x+Math.cos(u)*r*6*scale,y-Math.cos(v)*9*scale,z+Math.sin(u)*r*6*scale];};
 for(let i=0;i<m;i++)for(let j=0;j<n;j++)s.face([P(i,j),P(i+1,j),P(i+1,j+1),P(i,j+1)],berry,a);
 for(let j=0;j<8;j++){const u=j/8*TAU;rod(s,[x+Math.cos(u)*5,y-2,z+Math.sin(u)*5],[x+Math.cos(u)*5.2,y,z+Math.sin(u)*5.2],.5,[226,174,104],a,5);}
 for(let k=0;k<5;k++){const u=k/5*TAU;s.face([[x,y-8,z],[x+Math.cos(u)*6,y-7,z+Math.sin(u)*6],[x+Math.cos(u+.4)*2,y-9,z+Math.sin(u+.4)*2]],[96,127,76],a);}
}
function rosette(s,x,y,z,a=1){
 const n=28,m=8,P=(i,j)=>{const u=i/n*TAU,v=j/m,r=7*(1-v)**.7*(1+.14*Math.sin(u*7+v*5));return [x+Math.cos(u)*r+v*v*2,y-v*12,z+Math.sin(u)*r];};
 for(let j=0;j<m;j++)for(let i=0;i<n;i++)s.face([P(i,j),P(i,j+1),P(i+1,j+1),P(i+1,j)].reverse(),cream,a);
}
export function birthdayModel(s,t,p,q){
 s.group=-20;s.box(0,114,20,410,15,236,[103,79,64]);s.group=-19;
 for(let j=0;j<12;j++)s.line([[-200,98.5,-88+j*19],[200,98.5,-86+j*19]],[177,131,85],.18,.7);
 // A real plate profile: raised lip, shallow well, turned foot.
 lathe(s,0,0,[[0,98],[70,98],[75,96],[97,96],[108,92],[112,89],[111,87],[106,88],[96,92],[0,92]],[212,202,172],1,96);
 s.group=0;
 const removedOrder=[10,11,0,9,8,7,6,5,4],unit=60/72/2;
 const removed=k=>{const idx=removedOrder.indexOf((k+12)%12);return idx<0?0:ramp(290+idx*unit,290+idx*unit+.29,t);};
 for(let k=0;k<12;k++){
  const idx=removedOrder.indexOf(k),progress=idx<0?0:ramp(290+idx*unit,290+idx*unit+.29,t),a=1-progress;
  if(a<.003)continue;
  const piece=new Solid(),a0=k/12*TAU,a1=(k+1)/12*TAU;
  const cutLeft=removed(k-1)>.01,cutRight=removed(k+1)>.01;
  const part=(base,h,r,col)=>wedge(piece,a0,a1,base,h,r,col,a,cutLeft,cutRight);
  part(91,21,79,sponge);part(70,3,79.4,cream);part(67,22,79,chocolate);part(45,3,79.4,cream);part(42,14,79,sponge);part(28,5,80.1,cream);
  const u=(a0+a1)/2,x=Math.cos(u)*69,z=Math.sin(u)*69;
  rosette(piece,x,23,z,a);if(k%2===0)strawberry(piece,Math.cos(u)*49,17,Math.sin(u)*49,.88,a);
  // Each served slice moves a few centimetres away; the remaining cake keeps its volume.
  piece.transform(v=>[v[0]+Math.cos(u)*progress*29,v[1]+progress*4,v[2]+Math.sin(u)*progress*29]);s.faces.push(...piece.faces);s.lines.push(...piece.lines);
 }
 // Candle positions belong to the slices; the last candle remains in the final quarter.
 const candles=[{k:2,r:36},{k:0,r:29},{k:5,r:35},{k:7,r:24},{k:9,r:38},{k:11,r:30},{k:4,r:21}];
 for(const [i,c] of candles.entries()){
  const u=(c.k+.5)/12*TAU,x=Math.cos(u)*c.r,z=Math.sin(u)*c.r,idx=removedOrder.indexOf(c.k),gone=idx<0?0:ramp(290+idx*unit,290+idx*unit+.29,t);
  const a=(i<3?1:p)*(1-gone),burn=ramp(282,294,t),len=31-13*burn,extinguish=ramp(293.35,293.65,t),flicker=Math.sin(t*13+i)*.55;
  cylinder(s,x,23,z,2.5,len,[219,174+i*5,123+i*4],a,20);rod(s,[x,23-len,z],[x,20-len,z],.55,[65,50,39],a,6);
  ellipsoid(s,x+flicker,16-len,z,2.1,5.7+Math.sin(t*17+i)*.6,1.8,[250,184,75],a*(1-extinguish),18,12);
  ellipsoid(s,x,18-len,z,1.1,2.5,1,[255,226,153],a*(1-extinguish),12,8);
  for(let d=0;d<3;d++)ellipsoid(s,x+Math.cos(d*2.1)*2.4,23-len+5+d*4,z+Math.sin(d*2.1)*2.4,.7,2.7+d,.7,[230,195,152],a*burn,8,6);
  if(i===0&&extinguish>.001){const smoke=[];for(let j=0;j<=38;j++){const v=j/38;smoke.push([x+Math.sin(v*5+t*1.2)*v*9,20-len-v*53,z]);}s.line(smoke,[191,181,155],extinguish*.24,.8);}
 }
 for(let k=0;k<22;k++){const u=-.2-k*.31,r=81+(k%5)*4;s.box(Math.cos(u)*r,91.7,Math.sin(u)*r,1.7+k%2,1.2,1.8,sponge,q*.75);}
 // An empty place and a fork keep the scale intimate; no exploding confetti.
 s.group=-1;lathe(s,147,25,[[0,98.7],[32,98.7],[36,97],[36,95],[30,96],[0,96]],[184,181,155],1,56);
 rod(s,[141,94,2],[161,94,48],1.7,[175,185,169]);for(let k=0;k<4;k++)rod(s,[137+k*2.8,94,-9],[141+k*2.8,94,5],.75,[190,195,173]);
 s.group=0;
 for(const side of [-1,1]){
  const x=side*143,y=-44-Math.sin(t*.65+side)*5,a=1-q;
  ellipsoid(s,x,y,28,21,29,19,side<0?[125,156,154]:[174,133,102],a,36,22);cylinder(s,x,y+32,28,2,4,[131,153,137],a,10,1);s.face([[x-3,y+33,27],[x+3,y+33,27],[x,y+37,28]],[133,150,132],a);
  const string=[];for(let j=0;j<=24;j++){const v=j/24;string.push([mix(x,side*107,v)+Math.sin(v*4+t*.7)*v*4,mix(y+37,97,v),mix(28,6,v)]);}s.line(string,[180,167,139],a*.65,.7);
 }
}
