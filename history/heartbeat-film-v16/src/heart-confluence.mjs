import {mix,ramp,project,path,spot,dot,coral,ivory} from './drawing.mjs';
import {record,recordWave} from './heart-records.mjs';

// The same recorded beats launch the three rows and sound in the score.
const beats=record(0).beats.filter(b=>b.time>=173).slice(0,3);
export const CONFLUENCE_STARTS=Array.from({length:9},(_,id)=>beats[Math.floor(id/3)].time+(id%3)*.11);
export const CONFLUENCE_END=Math.max(...CONFLUENCE_STARTS)+4.7;
// Preserve the montage's left / centre / right spatial identity while joining.
export const CONFLUENCE_SLOTS=[0,3,6,1,4,7,2,5,8];
export const HEART_LINE={x:650,y:733,width:620,amplitude:43,window:3.4,samples:360};
export function heartPoint(u,t){const h=HEART_LINE;return [h.x+u*h.width,h.y-recordWave(0,u,t,h.window)*h.amplitude];}
export function confluenceState(id,t){
 const start=CONFLUENCE_STARTS[id];
 return {start,fold:ramp(start+.12,start+3.1,t),travel:ramp(start+.8,start+4.7,t),tint:ramp(start+1.6,start+3.0,t)};
}
export function drawHeart(c,t,from=0,to=1){
 const points=[];for(let i=Math.round(from*360);i<=Math.round(to*360);i++)points.push(heartPoint(i/360,t));
 path(c,points,coral,.7,1.55);
}
export function modelBounds(model,cam,id,origin){
 const points=model.faces.flatMap(f=>f.points.map(p=>project(p,cam)));
 let x=Math.min(...points.map(p=>p[0]))-14,y=Math.min(...points.map(p=>p[1]))-14;
 let r=Math.max(...points.map(p=>p[0]))+14,b=Math.max(...points.map(p=>p[1]))+14;
 if(id===3){x=Math.max(x,origin[0]-277);r=Math.min(r,origin[0]+277);y=Math.max(y,origin[1]-185);b=Math.min(b,origin[1]+160);}
 // The house's sun and moon belong to its miniature and fold with it.
 if(id===2){x=Math.min(x,origin[0]-205);r=Math.max(r,origin[0]+205);y=Math.min(y,origin[1]-187);}
 x=Math.max(0,x);y=Math.max(0,y);r=Math.min(1920,r);b=Math.min(940,b);
 return {x,y,width:r-x,height:b-y,cx:(x+r)/2,cy:(y+b)/2};
}
export function foldIntoHeart(c,layer,bounds,id,t){
 const s=confluenceState(id,t),h=HEART_LINE,k=c.getTransform().a,slot=CONFLUENCE_SLOTS[id];
 if(s.travel>=1){drawHeart(c,t,slot/9,(slot+1)/9);return;}
 const targetX=h.x+h.width*(slot+.5)/9;
 const cx=mix(bounds.cx,targetX,s.travel),cy=mix(bounds.cy,h.y,s.travel)-Math.sin(s.travel*Math.PI)*(20+Math.floor(id/3)*9);
 const width=mix(bounds.width,h.width/9,ramp(s.start+.4,s.start+3.2,t));
 const height=Math.max(.65,bounds.height*(1-s.fold)**1.85),bend=ramp(.28,.92,s.fold);
 // Preserve the opaque, occluded image until it has physically folded flat.
 // No object alpha envelope is used during this transformation.
 if(s.tint>0){layer.save();layer.globalCompositeOperation='source-atop';layer.globalAlpha=s.tint;layer.fillStyle='#ff8267';layer.fillRect(bounds.x,bounds.y,bounds.width,bounds.height);layer.restore();}
 const strips=180,sw=bounds.width/strips,dw=width/strips;
 if(height>1){
  c.save();c.imageSmoothingEnabled=true;
  for(let i=0;i<strips;i++){
   const u=(i+.5)/strips,heartU=(slot+u)/9;
   const waveY=-recordWave(0,heartU,t,h.window)*h.amplitude*bend;
   c.drawImage(layer.canvas,(bounds.x+i*sw)*k,bounds.y*k,(sw+.22)*k,bounds.height*k,cx-width/2+i*dw,cy-height/2+waveY,dw+.23,height);
  }
  c.restore();
 }
 // The flattened ribbon becomes the exact segment used by the title shot.
 if(height<12){
  const pts=[];for(let i=0;i<=40;i++){const u=i/40,heartU=(slot+u)/9;pts.push([cx+(u-.5)*width,cy-recordWave(0,heartU,t,h.window)*h.amplitude*bend]);}
  path(c,pts,coral,.7*ramp(12,1,height),1.55);
 }
}
export function heartEndpoint(c,t,alpha=1){
 const pos=heartPoint(1,t);spot(c,...pos,22,coral,.32*alpha);dot(c,...pos,1.7,ivory,alpha);
}
