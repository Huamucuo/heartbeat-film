import {TAU,mix,ramp,gate,coral,gold,teal,blue,ivory,blend,project,path,spot,dot} from './drawing.mjs';
import {NODE_TIMES,pulse,CONNECTIONS} from './score.mjs';
import {loomPoint,livingWave,mod,ANCHORS} from './motion.mjs';

export function loomCamera(t){
 return {yaw:mix(-.15,.34,ramp(58,76,t)),pitch:mix(.12,.62,ramp(64,74,t))+.04*Math.sin(t*.28),scale:mix(1.04,.77,ramp(68,74,t)),x:960,y:480,depth:2500};
}
export function loomSeed(t){return project(loomPoint(0,0,6,t),loomCamera(t));}
export function relations(c,t){
 const a=gate(57.35,86,t,1.5);if(a<.002)return;
 const cam=loomCamera(t),weave=ramp(63.75,68.25,t),loss=ramp(77,85.5,t),threads=[];
 // A common pulse visibly branches into the different lives before they fold.
 // These connections survive until the separate curves unfold into the fabric.
 const branching=gate(57.35,68.5,t,1.5);
 for(let id=0;id<9;id++){
  const born=NODE_TIMES[id],growth=ramp(born-2.0,born+.15,t),end=loomPoint(id,0,6,t),color=[coral,teal,gold,blue][id%4];
  for(let k=-2;k<=2;k++){
   const pts=[];
   for(let j=0;j<=90;j++){
    const u=j/90*growth,s=Math.sin(u*Math.PI),x=mix(-40,end[0],u),y=mix(90,end[1],u)+s*(id%2?-1:1)*(95+k*7),z=mix(-100,end[2],u)+s*k*24;
    pts.push(project([x,y-livingWave(u,t,id*.11,1.4)*15*s,z],cam));
   }
   path(c,pts,color,a*branching*(k===0?.28:.055),k===0?.95:.55);
  }
 }
 const trunk=[];for(let j=0;j<=180;j++){const u=j/180;trunk.push(project([-650+u*610,90-livingWave(u,t)*60,-100],cam));}
 path(c,trunk,coral,a*branching*.38,1.4);
 for(let id=0;id<9;id++){
  const grow=ramp(NODE_TIMES[id]-.25,NODE_TIMES[id]+1.1,t),color=[coral,teal,gold,blue,teal,gold,coral,teal,ivory][id];
  if(grow<.001)continue;
  for(let band=0;band<13;band++){
   const pts=[];for(let j=0;j<=126;j++){const u=j/126;if(u>grow)break;pts.push(project(loomPoint(id,u,band,t),cam));}
   if(grow<1)pts.push(project(loomPoint(id,grow,band,t),cam));
   const z=pts.reduce((s,p)=>s+p[2],0)/pts.length;
   threads.push({id,band,pts,z,color,grow});
  }
 }
 threads.sort((a,b)=>b.z-a.z);
 const fabric=ramp(65,69,t)*(1-ramp(77.5,82,t));
 if(fabric>.002)for(let id=0;id<9;id++)for(let band=1;band<12;band+=4){
  const color=[coral,teal,gold,blue][id%4];
  for(let j=0;j<72;j+=3){
   const u=j/72,v=(j+3)/72;
   const pts=[[u,band],[v,band],[v,band+2],[u,band+2]].map(([q,k])=>project(loomPoint(id,q,k,t),cam));
   path(c,pts,color,a*fabric*.016,1,true,true);
  }
 }
 for(const {id,band,pts,color,grow} of threads){
  const major=band===6||band===0||band===12;
  path(c,pts,blend(color,blue,band/30),a*(major?.54:.18)*(1-loss*.48),major?1.12:.58);
  // Particles run along the actual fibres; during the fabric shot their trails
  // make crossing, separation and depth readable instead of adding static icons.
  if(band%3===0){
   const u=mod((t-NODE_TIMES[id])*.23+band*.071+id*.09)*grow,tail=[];
   for(let j=0;j<=12;j++){const v=u-j*.0017;if(v>=0)tail.unshift(project(loomPoint(id,v,band,t),cam));}
   path(c,tail,color,a*.52*(1-loss*.55),1.5);
   const p=project(loomPoint(id,u,band,t),cam);dot(c,p[0],p[1],1.7*mix(1,.8,weave),ivory,a*.88*(1-loss*.4));
   if(band===6)spot(c,p[0],p[1],15,color,a*.22);
  }
  if(grow<1&&band===6){const p=pts.at(-1);spot(c,p[0],p[1],27,color,a*.55);}
 }
 // The score's connection events stitch the fibres across their depth layers.
 for(const e of CONNECTIONS){
  const join=ramp(e.time,e.time+.65,t),release=1-ramp(e.loss,e.loss+1.35,t);if(join*release<.002)continue;
  const u=.14+e.from*.079,A=loomPoint(e.from,u,6,t),B=loomPoint(e.to,1-u,6,t);
  for(let k=0;k<5;k++){
   const pts=[];for(let j=0;j<=56;j++){
    const v=j/56*join,s=Math.sin(v*Math.PI),P=[mix(A[0],B[0],v),mix(A[1],B[1],v)-s*(45+k*13),mix(A[2],B[2],v)+s*(k-2)*45];pts.push(project(P,cam));
   }
   path(c,pts,blend(gold,teal,e.from/9),a*release*(k===2?.29:.065),k===2?.9:.5);
  }
 }
 // Distant echoes emerge from the same sheet. Subtle, widely spaced layers
 // give the collective shot a scale beyond the foreground construction.
 const distance=gate(66.5,81.5,t,2);
 for(let layer=3;layer>=1;layer--)for(let band=0;band<22;band++){
  const pts=[];
  for(let j=0;j<=108;j++){
   const u=j/108,P=loomPoint(band%9,u,band%13,t);
   pts.push(project([P[0]*1.55,P[1]*1.5+(layer-2)*360,P[2]+layer*850],cam));
  }
  path(c,pts,blend(blue,teal,band/22),a*distance*.050/layer,.65);
 }
 const power=pulse(t);if(t>67.5&&t<79)spot(c,960,460,350+power*30,blue,a*.045);
}
