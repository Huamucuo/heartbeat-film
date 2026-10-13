import {TAU,clamp,mix,blend,rgb,project} from './drawing.mjs';

const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const sub=(a,b)=>a.map((v,i)=>v-b[i]);
export function rotate(p,rx=0,ry=0,rz=0){
 let [x,y,z]=p;
 [y,z]=[y*Math.cos(rx)-z*Math.sin(rx),y*Math.sin(rx)+z*Math.cos(rx)];
 [x,z]=[x*Math.cos(ry)+z*Math.sin(ry),-x*Math.sin(ry)+z*Math.cos(ry)];
 return [x*Math.cos(rz)-y*Math.sin(rz),x*Math.sin(rz)+y*Math.cos(rz),z];
}
export class Solid {
 constructor(){this.faces=[];this.lines=[];this.group=0;this.layer=0;}
 face(points,color,alpha=1,emission=0){this.faces.push({points,color,alpha,emission,group:this.group,layer:this.layer});}
 line(points,color,alpha=1,width=1){this.lines.push({points,color,alpha,width,group:this.group,layer:this.layer});}
 box(x,y,z,w,h,d,color,alpha=1){
  const a=x-w/2,b=x+w/2,top=y-h,bottom=y,front=z-d/2,back=z+d/2;
  this.face([[a,top,front],[a,bottom,front],[b,bottom,front],[b,top,front]],color,alpha);
  this.face([[b,top,back],[b,bottom,back],[a,bottom,back],[a,top,back]],color,alpha);
  this.face([[a,top,back],[a,bottom,back],[a,bottom,front],[a,top,front]],color,alpha);
  this.face([[b,top,front],[b,bottom,front],[b,bottom,back],[b,top,back]],color,alpha);
  this.face([[a,top,back],[a,top,front],[b,top,front],[b,top,back]],color,alpha);
  this.face([[a,bottom,front],[a,bottom,back],[b,bottom,back],[b,bottom,front]],color,alpha);
 }
 extrude(points,front,back,color,alpha=1){
  this.face(points.map(([x,y])=>[x,y,front]).reverse(),color,alpha);
  this.face(points.map(([x,y])=>[x,y,back]),color,alpha);
  for(let i=0;i<points.length;i++){const a=points[i],b=points[(i+1)%points.length];this.face([[...a,front],[...b,front],[...b,back],[...a,back]],color,alpha);}
 }
 disc(x,y,r,front,back,color,alpha=1,n=40){this.extrude(Array.from({length:n},(_,i)=>[x+Math.cos(i/n*TAU)*r,y+Math.sin(i/n*TAU)*r]),front,back,color,alpha);}
 rounded(x,y,w,h,r,front,back,color,alpha=1){
  const points=[];for(let corner=0;corner<4;corner++){
   const cx=x+(corner===0||corner===3?w-r:r),cy=y+(corner<2?h-r:r);
   for(let j=0;j<=8;j++){const a=(corner*Math.PI/2)+j/8*Math.PI/2;points.push([cx+Math.cos(a)*r,cy+Math.sin(a)*r]);}
  }
  this.extrude(points,front,back,color,alpha);
 }
 transform(fn){this.faces.forEach(f=>f.points=f.points.map(fn));this.lines.forEach(l=>l.points=l.points.map(fn));return this;}
}

export function paintSolid(c,solid,cam,alpha=1){
 const light=[-.38,-.79,-.48],items=[];
 for(const face of solid.faces){
  if(face.alpha*alpha<.002)continue;
  const points=face.points.map(p=>project(p,cam));
  if(points.some(p=>!p.every(Number.isFinite)||p[3]<0))continue;
  const winding=points.reduce((s,p,i)=>{const q=points[(i+1)%points.length];return s+p[0]*q[1]-q[0]*p[1];},0);
  if(winding>=0)continue;
  let n=cross(sub(face.points[1],face.points[0]),sub(face.points[2],face.points[0])),length=Math.hypot(...n)||1;n=n.map(v=>v/length);
  const shade=mix(.40+.58*Math.max(0,n.reduce((s,v,i)=>s+v*light[i],0)),1,face.emission);
  const color=face.color.map(v=>Math.min(255,v*shade));
  items.push({points,color,a:alpha*face.alpha,z:points.reduce((s,p)=>s+p[2],0)/points.length,group:face.group,layer:face.layer,kind:'face'});
 }
 for(const line of solid.lines){
  if(line.alpha*alpha<.002)continue;
  const points=line.points.map(p=>project(p,cam));if(points.some(p=>!p.every(Number.isFinite)||p[3]<0))continue;
  items.push({points,color:line.color,a:alpha*line.alpha,z:points.reduce((s,p)=>s+p[2],0)/points.length,group:line.group,layer:line.layer,kind:'line',width:line.width*(points[0]?.[3]||1)*(cam.scale||1)});
 }
 items.sort((a,b)=>a.group-b.group||a.layer-b.layer||b.z-a.z);
 c.save();c.lineJoin='round';
 for(const it of items){
  c.beginPath();it.points.forEach((p,i)=>c[i?'lineTo':'moveTo'](p[0],p[1]));c.globalAlpha=clamp(it.a);
  if(it.kind==='face'){c.closePath();c.fillStyle=rgb(it.color);c.fill();}
  c.strokeStyle=rgb(it.color);c.lineWidth=it.kind==='face'?.65:it.width;c.stroke();
 }
 c.restore();
}
