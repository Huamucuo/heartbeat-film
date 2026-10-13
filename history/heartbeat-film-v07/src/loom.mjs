import {mix,ramp,gate,coral,gold,teal,blue,ivory,blend,project,path,spot,dot} from './drawing.mjs';
import {NODE_TIMES,CONNECTIONS} from './score.mjs';
import {livingWave,mod} from './motion.mjs';
import {SCENES,lifeGeometry,lifeVertex,lifePlacement} from './vignettes.mjs';
import {telephone} from './telephone.mjs';
import {Solid,paintSolid} from './solids.mjs';

export function loomCamera(t){
 const fold=ramp(76.2,81,t),detail=gate(63.8,73,t,1.7),scale=mix(.95+.018*Math.sin((t-58)*.25),2.45,detail);
 return {yaw:mix(-.025+.025*Math.sin((t-58)*.15),.16,fold),pitch:mix(.035+.018*Math.sin(t*.2)+detail*.25,.16,fold),scale:mix(scale,1.08,fold),x:960+640*scale*detail,y:479+275*scale*detail,depth:2800};
}
function origin(id,t){const g=lifeGeometry(id,t),k=g.findIndex(s=>s.role!==2);return lifeVertex(id,g[k],k,g.length,0,t);}
export function loomSeed(t){return project(origin(0,t),loomCamera(t));}

export function relations(c,t){
 const a=gate(57.35,86,t,1.4);if(a<.002)return;
 const cam=loomCamera(t),fold=ramp(76.2,80.4,t),loss=ramp(80.5,86,t),branching=gate(57.35,79,t,1.7);
 const detail=gate(63.8,73,t,1.7);
 if(detail>.002){const wash=c.createRadialGradient(930,510,120,960,530,1180);wash.addColorStop(0,'#83715c');wash.addColorStop(.48,'#3c4848');wash.addColorStop(1,'#0b1721');c.save();c.globalAlpha=detail*.94;c.fillStyle=wash;c.fillRect(0,0,1920,1080);c.restore();}
 const colors=[coral,gold,teal,blue,ivory,gold,teal,coral,blue];
 // One pulse draws the everyday worlds. Their physical floors share the
 // coordinate system of the previous journey instead of arriving as cards.
 const origins=SCENES.map((_,id)=>origin(id,t));
 for(let id=0;id<SCENES.length;id++){
  const grow=ramp(NODE_TIMES[id]-2,NODE_TIMES[id]+.15,t),end=origins[id],color=colors[id];
  for(let k=-1;k<=1;k++){
   const pts=[];for(let j=0;j<=90;j++){
    const u=j/90*grow,s=Math.sin(u*Math.PI);
    pts.push(project([mix(-80,end[0],u),mix(55,end[1],u)+(id%2?1:-1)*s*(66+k*9)-livingWave(u,t,id*.11)*s*12,mix(-240,end[2],u)+s*k*18],cam));
   }
   path(c,pts,color,a*branching*(k===0?.22:.042),k===0?.95:.55);
  }
 }
 const trunk=[];for(let j=0;j<=150;j++){const u=j/150;trunk.push(project([-670+u*590,55-livingWave(u,t)*44,-240],cam));}
 path(c,trunk,coral,a*branching*.30,1.3);

 const strokes=[];
 const memory=gate(76.1,85.7,t,1.2),panes=new Map();
 if(memory>.002){
  for(let id=0;id<9;id++){
   const pane=new Solid();pane.box(0,124,22,432,306,16,blend(colors[id],[37,47,51],.81),.98);
   pane.group=1;pane.face([[-203,-170,12],[-203,112,12],[203,112,12],[203,-170,12]],[18,28,36],1,.8);
   pane.transform(p=>lifePlacement(id,p,t));
   panes.set(id,pane);
  }
 }
 for(let id=0;id<SCENES.length;id++){
  const grow=ramp(NODE_TIMES[id]-.45,NODE_TIMES[id]+1.0,t),geometry=lifeGeometry(id,t);if(grow<.001)continue;
  for(let k=0;k<geometry.length;k++){
   const stroke=geometry[k];if(stroke.alpha<.002)continue;
   const pts=[],samples=Math.max(16,Math.min(48,stroke.points.length));
   for(let j=0;j<=samples;j++)pts.push(project(lifeVertex(id,stroke,k,geometry.length,j/samples*grow,t),cam));
   const z=pts.reduce((s,p)=>s+p[2],0)/pts.length;
   const color=stroke.role===1?blend(colors[id],ivory,.36):stroke.role===2?blend(colors[id],blue,.6):blend(colors[id],ivory,.66);
   strokes.push({id,k,stroke,pts,z,color,grow});
  }
 }
 strokes.sort((A,B)=>B.z-A.z);
 const matte=[[157,104,68],[158,128,91],[119,154,145],[91,127,151],[178,149,112],[148,126,109],[101,148,139],[180,113,94],[119,131,156]];
 const sceneOrder=SCENES.map((_,id)=>({id,z:project(lifePlacement(id,[0,0,0],t),cam)[2]})).sort((a,b)=>b.z-a.z);
 for(const {id:sceneId} of sceneOrder){
 const group=strokes.filter(s=>s.id===sceneId),pane=panes.get(sceneId);if(pane)paintSolid(c,pane,cam,a*memory);
 for(const {id,stroke,pts,grow} of group)if(stroke.fill>0&&grow>.65&&id!==0){
  const color=stroke.role===2?blend(matte[id],[30,42,48],.50):stroke.role===1?blend(matte[id],[210,191,151],.20):matte[id];
  path(c,pts,color,a*stroke.alpha*mix(.38,.93,Math.min(1,stroke.fill/.02))*ramp(.65,1,grow)*(1-loss*.8),1,true,true);
 }
 for(const {id,k,stroke,pts,color,grow} of group){
  const contour=.68;
  // u=1 already closes the original object. Adding closePath after morphing
  // would draw a spurious chord across every released contour.
  const physical=id===0?ramp(75.8,76.6,t):1;
  path(c,pts,color,a*stroke.alpha*physical*mix(.73,contour,fold)*(1-loss*.58),mix(stroke.width,.70,fold),false);
  if(grow<.998&&k%9===0){const p=pts.at(-1);dot(c,p[0],p[1],1.35,ivory,a*.70);}
 }
 if(sceneId===0)telephone(c,t,cam,a*ramp(NODE_TIMES[0]-.3,NODE_TIMES[0]+1.3,t)*(1-ramp(75.8,76.6,t)));
 }

 for(const e of CONNECTIONS){
  const join=ramp(e.time,e.time+.65,t),release=1-ramp(e.loss,e.loss+1.4,t);if(join*release<.002)continue;
  const A=origins[e.from],B=origins[e.to],pts=[];
  for(let j=0;j<=64;j++){const u=j/64*join,s=Math.sin(u*Math.PI);pts.push(project([mix(A[0],B[0],u),mix(A[1],B[1],u)-s*90,mix(A[2],B[2],u)+s*220],cam));}
  path(c,pts,blend(colors[e.from],colors[e.to],.5),a*release*.20,1.0);
  const i=Math.floor(mod(t*.17+e.from*.17)*(pts.length-1));dot(c,pts[i][0],pts[i][1],1.65,gold,a*release*.70);
 }
 // The final volume consists of the objects' own outlines. Only their
 // distant echoes are additional layers, and those emerge after the lives.
 const echoes=gate(78,84,t,2);
 if(echoes>.002)for(let layer=2;layer>=1;layer--)for(let id=0;id<9;id++){
  const geometry=lifeGeometry(id,t);
  for(let k=0;k<geometry.length;k+=7){const s=geometry[k];if(s.alpha<.02)continue;const pts=[];for(let j=0;j<=48;j++){const p=lifeVertex(id,s,k,geometry.length,j/48,t);pts.push(project([p[0]*1.35,p[1]*1.35,p[2]+layer*780],cam));}path(c,pts,colors[id],a*echoes*s.alpha*.10/layer,.65);}
 }
 if(fold>.01)spot(c,960,480,360,blue,a*.028*fold);
}
