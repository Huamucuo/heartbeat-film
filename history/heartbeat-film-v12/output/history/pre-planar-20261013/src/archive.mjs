import {recordWave} from './heart-records.mjs';
import {realTime} from './timeline.mjs';
import {TAU,mix,ramp,gate,hash,coral,gold,teal,blue,ivory,blend,project,lerp3,path,spot,dot,text} from './drawing.mjs';
import {pulse} from './score.mjs';
import {drawDayHero} from './days.mjs';
import {livingWave,mod} from './motion.mjs';

export function archiveCamera(t){
 return {yaw:mix(-.22,.27,ramp(6,17,t))+.10*Math.sin(t*.24)*ramp(17,20,t),pitch:mix(-.13,.46,ramp(12,24,t)),scale:mix(1.05,.86,ramp(16,24,t)),x:960+Math.sin(t*.13)*45,y:490,depth:2400};
}
export function stratumPoint(u,v,t){
 const valley=-155*Math.exp(-(((u-.32)/.15)**2))+150*Math.exp(-(((u-.72)/.22)**2));
 return [(u-.5)*2470,(v-.5)*680+valley+80*Math.sin(u*TAU*1.1+v*2.2-t*.29)+livingWave(u,t,v*.22,2.6)*25,Math.sin(u*Math.PI)*520+(v-.5)*710+40*Math.sin(u*8-t*.3)];
}
export function archivePose(i,t){
 const col=i%14,row=Math.floor(i/14),q=i/126*TAU+(t-17)*.16;
 const start=[(col-6.5)*81,(row-4)*4,0];
 const sheet=[(col-6.5)*143,(row-4)*96+Math.sin(col*.50-t*.5)*20,(row-4)*72+Math.sin(col*.4-t*.22)*180];
 const river=stratumPoint((col+.5)/14,row/8,t);
 const paired=[(i%2?1:-1)*365+Math.cos(q*2)*230,Math.sin(q*2)*140,Math.sin(q*2)*145];
 return lerp3(lerp3(lerp3(start,sheet,ramp(5,9,t)),river,ramp(16,21,t)),paired,ramp(25,29,t));
}
function trace(c,t,p,w,h,id,cam,color,a,thickness=1){
 const pts=[];
 for(let j=0;j<=56;j++){const u=j/56;pts.push(project([p[0]+(u-.5)*w,p[1]-recordWave(id,u,realTime(t))*h,p[2]],cam));}
 path(c,pts,color,a,thickness);
 const u=mod(.86-realTime(t)*.18-id*.083),q=project([p[0]+(u-.5)*w,p[1]-recordWave(id,u,realTime(t))*h,p[2]],cam);
 dot(c,q[0],q[1],1.6,color,a*.75);
}
export function records(c,t){
 const a=gate(4,30.2,t,1.8);if(a<.002)return;
 const cam=archiveCamera(t),open=ramp(5,9,t),river=ramp(16,21,t),leave=1-ramp(26,30.2,t);
 // Receding layers reveal the archive as a volume. Every line inside them flows.
 for(let layer=4;layer>=1;layer--){
  const bg=gate(8,26.5,t,2)*(.13-layer*.016);
  for(let row=0;row<11;row++){
   const pts=[];
   for(let j=0;j<=140;j++){
    const u=j/140,x=(u-.5)*2550,y=(row-5)*105+Math.sin(u*TAU-t*.44+layer)*50;
    pts.push(project([x,y-livingWave(u,t,layer*.17+row*.07,5.4)*28,450+layer*390+Math.sin(u*5+t*.2)*120],cam));
   }
   path(c,pts,blend(blue,teal,row/14),a*bg,.75);
  }
 }
 const poses=Array.from({length:126},(_,i)=>archivePose(i,t));
 const order=poses.map((p,i)=>({i,z:project(p,cam)[2]})).sort((a,b)=>b.z-a.z);
 for(let i=0;i<126;i++){
  const j=(i+1)%126;
  path(c,[project(poses[i],cam),project(poses[j],cam)],i%4?blue:gold,a*(.09+.10*river)*leave,.65);
 }
 for(const {i} of order){
  const p=poses[i],col=i%14,row=Math.floor(i/14),birth=ramp(4.8+i*.013,6.8+i*.013,t),color=i%11===3?coral:i%3===0?gold:teal;
  const w=mix(73,101,open),h=mix(2,63,open),signal=gate(7.5,29.7,t,1),phase=(row*.083+col*.033);
  const border=1-ramp(17,23,t)*.82,alpha=a*birth*(.39+.12*hash(i))*leave;
  const corners=[[-w/2,-h/2],[w/2,-h/2],[w/2,h/2],[-w/2,h/2]].map(([x,y])=>project([p[0]+x,p[1]+y,p[2]],cam));
  path(c,corners,color,alpha*.09*border,1,true,true);path(c,corners,color,alpha*border,.72,true);
  trace(c,t,p,w*.9,h*.32,i,cam,color,alpha*(1+.5*signal),1.05);
 }
 // The rows of recorded days become strata. Broad matte facets and fine edges
 // give accumulated time weight, contrasting with the transparent late fabric.
 const flow=gate(17.2,29.4,t,1.8);
 const strata=Array.from({length:65},(_,band)=>Array.from({length:121},(_,j)=>project(stratumPoint(j/120,band/64,t),cam)));
 for(let band=0;band<64;band++){
  const color=blend(gold,blend(coral,blue,.64),band/64);
  for(let j=0;j<120;j+=3)path(c,[strata[band][j],strata[band][j+3],strata[band+1][j+3],strata[band+1][j]],color,a*flow*(.021+.014*Math.sin(j*.12+band*.19)**2),1,true,true);
  path(c,strata[band],color,a*flow*(band%8===0?.30:.095),band%8===0?1.2:.6);
  if(band%8===0){const u=mod(t*.12+band*.07),p=project(stratumPoint(u,band/64,t),cam);dot(c,p[0],p[1],1.8,ivory,a*flow*.8);}
 }
 const hero=gate(10,16.5,t,.9),zoom=ramp(10,11.8,t)*(1-ramp(14.8,16.5,t));
 if(hero>.002){
  const home=project(archivePose(53,t),cam),cx=mix(home[0],755,zoom),cy=mix(home[1],490,zoom),w=mix(100,700,zoom),h=mix(63,315,zoom);
  c.save();c.translate(cx,cy);c.rotate(Math.sin(t*.42)*.012*zoom);
  c.fillStyle=`rgba(7,16,26,${hero*.94})`;c.fillRect(-w/2,-h/2,w,h);
  path(c,[[-w/2,-h/2],[w/2,-h/2],[w/2,h/2],[-w/2,h/2]],gold,hero*.7,1.3,true);
  for(let j=0;j<9;j++)path(c,[[-w/2,(j-4)*h/10],[w/2,(j-4)*h/10]],teal,hero*.075,.5);
  const pts=[];for(let j=0;j<=220;j++){const u=j/220;pts.push([(u-.5)*w*.91,-recordWave(53,u,realTime(t),4.5)*h*.29]);}
  path(c,pts,coral,hero*.83,2.2);
  const scan=mod((t-10)/1.25),x=(scan-.5)*w*.91;
  const gradient=c.createLinearGradient(x-w*.12,0,x,0);gradient.addColorStop(0,'rgba(126,233,223,0)');gradient.addColorStop(1,`rgba(126,233,223,${hero*.10})`);c.fillStyle=gradient;c.fillRect(x-w*.12,-h*.31,w*.12,h*.62);
  path(c,[[x,-h*.29],[x,h*.29]],teal,hero*.30,1);
  const legible=hero*ramp(.18,.58,zoom);
  text(c,'一日，又一日',-w/2+25,-h/2+31,25,ivory,legible,{align:'left',tracking:3});
  c.restore();
  const veil=c.createRadialGradient(1430,478,30,1430,478,316);veil.addColorStop(0,`rgba(6,13,22,${legible*.93})`);veil.addColorStop(.62,`rgba(6,13,22,${legible*.82})`);veil.addColorStop(1,'rgba(6,13,22,0)');c.fillStyle=veil;c.fillRect(1114,162,632,632);
  drawDayHero(c,t,1430,447,legible);
 }
 const p=pulse(t);spot(c,960,500,70+p*40,coral,a*.13);
}
