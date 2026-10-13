import {mix,ramp,gate,project,path,spot,blend,coral,gold,teal,blue,ivory,TAU} from './drawing.mjs';
import {paintSolid,rotate} from './solids.mjs';
import {phoneSolid} from './telephone.mjs';
import {localLifeModel} from './life-models.mjs';
import {LIFE_SHOTS} from './life-direction.mjs';
import {miniatureTime,miniOpacity,MINI_ANCHORS,MINI_SCALES} from './montage-direction.mjs';
import {housingLight,litCamera,lifePracticalLights} from './life-lighting.mjs';
import {confluenceState,foldIntoHeart,modelBounds,heartEndpoint,CONFLUENCE_END} from './heart-confluence.mjs';
const fadeLayers=new WeakMap();
function objectLayer(c){
 let layer=fadeLayers.get(c.canvas);
 if(!layer){layer=document.createElement('canvas');fadeLayers.set(c.canvas,layer);}
 if(layer.width!==c.canvas.width||layer.height!==c.canvas.height){layer.width=c.canvas.width;layer.height=c.canvas.height;}
 const d=layer.getContext('2d');d.resetTransform();d.clearRect(0,0,layer.width,layer.height);d.setTransform(c.getTransform());return d;
}
export function lifeCamera(t){return {yaw:0,pitch:.18,scale:mix(1.03,1.065,ramp(134,172,t)),depth:6000,x:960,y:446};}
export function miniatureTransform(id,p,t){
 const a=MINI_ANCHORS[id],s=LIFE_SHOTS[id],k=MINI_SCALES[id],v=rotate(p.map(v=>v*k),.055,s.yaw*.7+.018*Math.sin(t*.3+id),0);
 return [a[0]+v[0],a[1]+v[1]+(1-ramp(131+id*.12,134+id*.12,t))*27,a[2]+v[2]];
}
function phoneClock(t){const s=LIFE_SHOTS[0],ps=[[s.start,64],[s.p[0],65.3],[s.p[1],68.1],[s.q[0],68.75],[s.q[1],71.25],[s.end,74]];let i=0;while(i<ps.length-2&&t>ps[i+1][0])i++;return mix(ps[i][1],ps[i+1][1],ramp(ps[i][0],ps[i+1][0],t));}
export function phoneModel(t){const lt=miniatureTime(0,t);return phoneSolid(phoneClock(lt),lt).transform(p=>miniatureTransform(0,[(p[0]+640)/1.02,(p[1]+275)/1.02,(p[2]-70)/1.02],t));}
function littleSky(c,t,lt,cam,a){
 const at=project(miniatureTransform(2,[0,0,0],t),cam),L=housingLight(lt),day=L.day,half=L.f<.5,phase=half?L.f*2:(L.f-.5)*2;
 spot(c,at[0],at[1]-25,250,blend([43,77,106],[184,151,99],day),a*(.12+day*.10));
 const x=at[0]+mix(-166,166,phase),y=at[1]-40-Math.sin(phase*Math.PI)*(104-L.cycle*8),v=gate(0,1,phase,.12)*a;
 spot(c,x,y,half?42:29,half?[242,197,124]:[175,205,216],v*.35);
 c.save();c.globalAlpha=v;c.fillStyle=half?'#efce91':'#bbcbd0';c.beginPath();c.arc(x,y,half?11:8,0,TAU);c.fill();
 if(!half){c.fillStyle='#0a1925';c.beginPath();c.arc(x+3.3,y-1.7,7.1,0,TAU);c.fill();}c.restore();
}
export function livedScenes(c,t){
 if(t<130.5||t>=182)return;const cam=lifeCamera(t),a=ramp(130.5,132.2,t);
 // The room light contracts softly toward the line, without an iris edge.
 const room=1-ramp(174.2,181.7,t),cy=mix(733,455,room),radius=1500*room+1;
 const ambient=c.createRadialGradient(960,cy,0,960,cy,radius);ambient.addColorStop(0,'#142936');ambient.addColorStop(.45,'rgba(16,35,47,.94)');ambient.addColorStop(.80,'rgba(10,25,37,.5)');ambient.addColorStop(1,'rgba(5,12,20,0)');
 c.save();c.globalAlpha=a*.88;c.fillStyle=ambient;c.fillRect(0,0,1920,1080);c.restore();
 const cols=[coral,gold,teal,blue,ivory,gold,teal,coral,blue];
 for(let id=0;id<9;id++){
  const alpha=a*miniOpacity(id,t);if(alpha<.002)continue;
  const fold=confluenceState(id,t),pose=Math.min(t,fold.start),lt=miniatureTime(id,pose),origin=project(miniatureTransform(id,[0,0,0],pose),cam);
  const born=ramp(131.1,133.8+id*.08,t),link=1-ramp(136,140,t);
  if(link>.002){const points=[];for(let j=0;j<=40;j++){const u=j/40*born;points.push([mix(960,origin[0],u),mix(454,origin[1],u)-Math.sin(u*Math.PI)*(27+id*3)]);}path(c,points,cols[id],alpha*.24*link,.9);}
  // Fade the already-occluded object as a single image. Multiplying every
  // polygon's opacity reveals hidden surfaces and turns solids into wire cages.
  const folding=t>=fold.start,d=(alpha<.999||id===3||folding)?objectLayer(c):c;d.save();
  if(id===2)littleSky(d,pose,lt,cam,1);
  if(id===3){d.beginPath();d.rect(origin[0]-277,origin[1]-185,554,345);d.clip();}
  const model=id===0?phoneModel(pose):localLifeModel(id,lt).transform(p=>miniatureTransform(id,p,pose));
  paintSolid(d,model,litCamera(cam,id,lt),1);
  lifePracticalLights(d,id,lt,cam,1,(id,p)=>miniatureTransform(id,p,pose));d.restore();
  if(id===3){
   // Mask the whole occluded vehicle, so windows and wheels cannot float after
   // a long body face disappears. Every component crosses the same edge.
   d.save();d.globalCompositeOperation='destination-in';const g=d.createLinearGradient(origin[0]-277,0,origin[0]+277,0);g.addColorStop(0,'transparent');g.addColorStop(.085,'#fff');g.addColorStop(.915,'#fff');g.addColorStop(1,'transparent');d.fillStyle=g;d.fillRect(origin[0]-277,origin[1]-185,554,345);d.restore();
  }
  if(folding)foldIntoHeart(c,d,modelBounds(model,cam,id,origin),id,t);
  else if(d!==c){c.save();c.resetTransform();c.globalAlpha=alpha;c.drawImage(d.canvas,0,0);c.restore();}
 }
 if(t>=CONFLUENCE_END)heartEndpoint(c,t);
}
