import {recordWave} from './heart-records.mjs';
import {realTime} from './timeline.mjs';
import {TAU,mix,ramp,gate,hash,coral,gold,teal,blue,ivory,blend,project,path,spot,dot,ring,text} from './drawing.mjs';
import {pulse} from './score.mjs';
import {ORIGIN,journeyAt,routeSlice} from './journeys.mjs';
import {livingWave,mod} from './motion.mjs';
import {loomSeed} from './loom.mjs';

const ROUTES=Array.from({length:3},(_,i)=>routeSlice(i,1));
function terrain(c,t,a){
 const islands=[[475,410,305,.65,1.2],[1320,425,425,.58,2.6],[860,700,280,.48,4.4]];
 for(let h=0;h<3;h++){
  const [x,y,R,stretch,phase]=islands[h];
  for(let k=0;k<20;k++){
   const rr=R*(.15+k*.049),pts=[];
   for(let j=0;j<=150;j++){
    const q=j/150*TAU,noise=1+.16*Math.sin(q*(3+h)+phase+t*.20)+.10*Math.cos(q*2-phase-t*.13)+.035*Math.sin(q*7+t*.48),d=rr*noise;
    pts.push([x+Math.cos(q)*d,y+Math.sin(q)*d*stretch+Math.sin(q*2+t*.7+h)*12]);
   }
   path(c,pts,blend(blue,gold,h*.25),a*(k%4===0?.20:.065),k%4===0?.95:.55);
  }
 }
}
function history(c,t,a){
 const state=journeyAt(t),cols=[gold,teal,coral];
 for(let i=0;i<=state.index;i++){
  const u=i<state.index?1:state.progress,pts=routeSlice(i,u),settle=ramp(40.625+i*3.125,41.125+i*3.125,t);
  path(c,pts,cols[i],a*mix(.72,.28,settle),mix(1.5,.9,settle));
  // Completed journeys keep circulating as memory; the leading journey still
  // returns exactly to ORIGIN at the established score times.
  for(let k=0;k<5;k++){
   const q=mod((t-38.125)*.14+k/5+i*.19)*u,p=routeSlice(i,q).at(-1);
   dot(c,p[0],p[1],1.45,cols[i],a*.72);
  }
 }
 return state;
}
export function labyrinth(c,t){
 const a=ramp(37.3,39,t)*(1-ramp(48,55,t));if(a<.002)return;
 terrain(c,t,a*(1-ramp(47.5,51,t)));
 const state=history(c,t,a),[x,y]=state.position;
 ring(c,...ORIGIN,14+2*Math.sin(t*3),gold,a*.72,1);ring(c,...ORIGIN,21,blue,a*.28,.6);
 text(c,'原点',ORIGIN[0],ORIGIN[1]+44,21,ivory,a*.85*(1-ramp(50,53,t)),{tracking:4});
 const countAlpha=gate(38.125,49,t,.6);
 text(c,String(state.completed),1570,139,92,ivory,countAlpha*.94);
 text(c,state.completed?'次回到原点':'尚未抵达',1570,218,19,gold,countAlpha*.75,{tracking:3});
 for(let i=0;i<3;i++){const end=40.625+i*3.125,p=ramp(end,end+.24,t)*(1-ramp(end+.24,end+.65,t));ring(c,...ORIGIN,19+28*ramp(end,end+.65,t),[gold,teal,coral][i],a*p*.65,1.1);}
 const head=1-ramp(48,50,t);spot(c,x,y,33,coral,a*.75*head);dot(c,x,y,3.3,ivory,a*head);
}

export function seedPoint(t){
 const u=ramp(54.5,58.8,t),end=loomSeed(t);
 return [mix(ORIGIN[0],end[0],u)+Math.sin(u*Math.PI)*230,mix(ORIGIN[1],end[1],u)-Math.sin(u*Math.PI)*165];
}
export function silence(c,t){
 const a=gate(47.2,65,t,1.6);if(a<.002)return;
 const open=ramp(47.5,55.5,t),cam={x:960,y:515,yaw:open*.38,pitch:open*.68,scale:1+open*.12,depth:2200};
 // Actual travelled paths lift into a receding landscape. The quiet music
 // has moving perspective and travelling echoes, not a held diagram.
 for(let layer=14;layer>=0;layer--){
  const depth=layer*130*open,offset=layer*8*open;
  for(let id=0;id<3;id++){
   const pts=ROUTES[id].filter((_,i)=>i%3===0).map((p,j)=>project([(p[0]-960)*(1+layer*.02*open),(p[1]-515)*(1+layer*.045*open)-offset,depth+Math.sin(j*.06-t*.60+id)*open*30],cam));
   if(layer<14&&layer%2===0){
    const next=ROUTES[id].filter((_,i)=>i%3===0).map((p,j)=>project([(p[0]-960)*(1+(layer+1)*.02*open),(p[1]-515)*(1+(layer+1)*.045*open)-(layer+1)*8*open,depth+130*open+Math.sin(j*.06-t*.60+id)*open*30],cam));
    for(let j=0;j<pts.length-3;j+=3)path(c,[pts[j],pts[j+3],next[j+3],next[j]],blend(gold,blue,id*.3),a*open*.018*(1-ramp(58.5,65,t)),1,true,true);
   }
   path(c,pts,blend([gold,teal,coral][id],blue,layer/16),a*(layer%5===0?.19:.055)*(1-ramp(58.5,65,t)),layer%5===0?1:.55);
   if(layer%3===0){
    const u=mod((t-47.2)*.12+layer*.027+id*.23),p=ROUTES[id][Math.floor(u*(ROUTES[id].length-1))];
    const pos=project([(p[0]-960)*(1+layer*.02*open),(p[1]-515)*(1+layer*.045*open)-offset,depth],cam);
    dot(c,pos[0],pos[1],1.6,ivory,a*.55*(1-ramp(58.5,65,t)));
   }
  }
 }
 const u=ramp(54.5,58.8,t),q=seedPoint(t),pts=[];
 for(let j=0;j<=100;j++){const v=j/100*u,end=loomSeed(t);pts.push([mix(ORIGIN[0],end[0],v)+Math.sin(v*Math.PI)*230,mix(ORIGIN[1],end[1],v)-Math.sin(v*Math.PI)*165]);}
 path(c,pts,teal,a*.28*ramp(54.5,55,t),1);
 const bright=a*(1-ramp(59.4,60.7,t));spot(c,...q,38,teal,bright*.55);dot(c,...q,2.8,ivory,bright);
}

export function ending(c,t){
 const a=ramp(80,83.5,t);if(a<.003)return;
 // Peripheral, receding folds still move after the connected fabric leaves.
 for(let k=0;k<32;k++){
  const pts=[];
  for(let j=0;j<=180;j++){
   const u=j/180,q=u*Math.PI*1.24+Math.PI*.87,R=660+k*13;
   pts.push([960+Math.cos(q+t*.025)*R*1.3,485+Math.sin(q+t*.025)*R*.76+livingWave(u,t,k*.02,2.2)*17]);
  }
  path(c,pts,blend(blue,teal,k/40),a*(k%8===0?.13:.033)*(1-ramp(87,90,t)*.45),k%8===0?.95:.5);
 }
 const wave=[];for(let i=0;i<=220;i++){const u=i/220;wave.push([650+u*620,733-recordWave(0,u,realTime(t),3.4)*43]);}
 path(c,wave,coral,a*.7,1.55);
 const pos=[1270,733-recordWave(0,1,realTime(t),3.4)*43],p=pulse(t);
 spot(c,...pos,24+p*14,coral,a*(.3+p*.24));dot(c,...pos,1.7,ivory,a);
}
