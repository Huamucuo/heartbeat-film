import {mix,ramp,gate,project,path,spot,blend,rgb,coral,gold,teal,blue,ivory} from './drawing.mjs';
import {Solid,paintSolid} from './solids.mjs';
import {phoneSolid} from './telephone.mjs';
import {lifeModel,lifeTransform,ANCHORS} from './life-models.mjs';
import {LIFE_SHOTS,ENDING_START} from './life-direction.mjs';
import {recordWave} from './heart-records.mjs';
const overview={focus:[0,0,0],scale:.90,pitch:.19,yaw:0};
const CAMERA_KEYS=[{t:131,...overview},{t:139,...overview},...LIFE_SHOTS.flatMap(s=>[
 {t:s.start+2.2,focus:ANCHORS[s.id],scale:s.scale,pitch:s.pitch,yaw:s.yaw},
 {t:s.end-2,focus:ANCHORS[s.id],scale:s.scale+.12,pitch:s.pitch+.025,yaw:s.yaw+.07}
]),{t:318,...overview},{t:340,...overview}];
export function lifeCamera(t){
 let index=0;while(index<CAMERA_KEYS.length-2&&t>CAMERA_KEYS[index+1].t)index++;
 const a=CAMERA_KEYS[index],b=CAMERA_KEYS[index+1],u=ramp(a.t,b.t,t),focus=a.focus.map((v,i)=>mix(v,b.focus[i],u));
 const camera={yaw:mix(a.yaw,b.yaw,u),pitch:mix(a.pitch,b.pitch,u),scale:mix(a.scale,b.scale,u),depth:3200,x:0,y:0};
 const target=project(focus,camera);camera.x=960-target[0];camera.y=mix(430,475,ramp(.9,2.5,camera.scale))-target[1];return camera;
}
function phoneClock(t){const s=LIFE_SHOTS[0],points=[[s.start,64],[s.p[0],65.3],[s.p[1],68.1],[s.q[0],68.75],[s.q[1],71.25],[340,76]];let i=0;while(i<points.length-2&&t>points[i+1][0])i++;const a=points[i],b=points[i+1];return mix(a[1],b[1],ramp(a[0],b[0],t));}
export function phoneModel(t){return phoneSolid(phoneClock(t),t).transform(p=>lifeTransform(0,[(p[0]+640)/1.02,(p[1]+275)/1.02,(p[2]-70)/1.02],t));}
function mood(t){
 const decode=hex=>[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16));
 for(let i=0;i<LIFE_SHOTS.length-1;i++){const a=LIFE_SHOTS[i],b=LIFE_SHOTS[i+1];if(t<a.end+2.2)return rgb(blend(decode(a.color),decode(b.color),ramp(a.end-2,b.start+2.2,t)));}
 return LIFE_SHOTS.at(-1).color;
}
export function livedScenes(c,t){
 const a=gate(130.5,337,t,2.1);if(a<.002)return;const cam=lifeCamera(t),detail=ramp(.92,2.25,cam.scale),shot=LIFE_SHOTS.find(s=>t>=s.start&&t<s.end)||LIFE_SHOTS.at(-1);
 if(detail>.002){const bg=c.createRadialGradient(960,440,50,960,500,1200);bg.addColorStop(0,mood(t));bg.addColorStop(.65,'#1a2b34');bg.addColorStop(1,'#050d15');c.save();c.globalAlpha=detail*.95;c.fillStyle=bg;c.fillRect(0,0,1920,1080);c.restore();}
 const cols=[coral,gold,teal,blue,ivory,gold,teal,coral,blue],memory=gate(315,336,t,1.8),branch=(1-ramp(313,320,t))*(1-detail*.85);
 for(let id=0;id<9;id++){
  const born=ramp(131+id*.8,134+id*.8,t),p=lifeTransform(id,[0,80,0],t),pts=[];
  for(let j=0;j<=70;j++){const u=j/70*born;pts.push(project([mix(-140,p[0],u),mix(50,p[1],u)-Math.sin(u*Math.PI)*(56+id*8)-recordWave(id,u,t)*9*Math.sin(u*Math.PI),mix(-150,p[2],u)],cam));}
  path(c,pts,cols[id],a*branch*.24,1);if(pts.length&&born<.99){const end=pts.at(-1);spot(c,end[0],end[1],19,cols[id],a*.45);}
 }
 const order=ANCHORS.map((_,id)=>({id,z:project(lifeTransform(id,[0,0,0],t),cam)[2]})).sort((a,b)=>b.z-a.z);
 for(const {id} of order){
  const born=ramp(132+id*.8,134+id*.8,t);if(born<.001)continue;
  const shotFocus=gate(LIFE_SHOTS[id].start-2,LIFE_SHOTS[id].end+2.2,t,4.2),subjectAlpha=1-detail*(1-shotFocus);if(a*born*subjectAlpha<.002)continue;
  const origin=project(lifeTransform(id,[0,0,0],t),cam);if(origin[0]<-650||origin[0]>2570||origin[1]<-600||origin[1]>1670)continue;
  if(memory>.002){const pane=new Solid();pane.box(0,131,198,430,330,18,blend(cols[id],[24,37,42],.84));pane.layer=1;pane.face([[-203,-188,188],[-203,119,188],[203,119,188],[203,-188,188]],[13,25,32],1,.6);paintSolid(c,pane.transform(p=>lifeTransform(id,p,t)),cam,a*memory);}
  paintSolid(c,id===0?phoneModel(t):lifeModel(id,t),cam,a*born*subjectAlpha);
 }
 const wave=[];for(let i=0;i<=150;i++){const u=i/150;wave.push([650+u*620,885-recordWave(53,u,t,3.7)*19]);}path(c,wave,coral,a*.11*branch,1.0);
}
