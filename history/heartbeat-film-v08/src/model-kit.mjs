import {TAU,mix,blend} from './drawing.mjs';
export function cylinder(s,x,y,z,r,h,color,a=1,n=20,rt=r){
 const top=[],bottom=[];for(let i=0;i<n;i++){const q=i/n*TAU;top.push([x+Math.cos(q)*rt,y-h,z+Math.sin(q)*rt]);bottom.push([x+Math.cos(q)*r,y,z+Math.sin(q)*r]);}
 s.face(top,color,a);s.face(bottom.slice().reverse(),color,a);
 for(let i=0;i<n;i++){const j=(i+1)%n;s.face([top[j],top[i],bottom[i],bottom[j]],color,a);}
}
export function ellipsoid(s,x,y,z,rx,ry,rz,color,a=1,n=10,m=7){
 const p=(i,j)=>{const q=j/n*TAU,f=i/m*Math.PI;return [x+Math.sin(f)*Math.cos(q)*rx,y-Math.cos(f)*ry,z+Math.sin(f)*Math.sin(q)*rz];};
 for(let i=0;i<m;i++)for(let j=0;j<n;j++)s.face([p(i,j),p(i+1,j),p(i+1,j+1),p(i,j+1)],color,a);
}
export function rod(s,A,B,r,color,a=1,n=8){
 const d=B.map((v,i)=>v-A[i]),len=Math.hypot(...d),v=d.map(x=>x/(len||1)),helper=Math.abs(v[1])>.9?[1,0,0]:[0,1,0];
 let u=[v[1]*helper[2]-v[2]*helper[1],v[2]*helper[0]-v[0]*helper[2],v[0]*helper[1]-v[1]*helper[0]],l=Math.hypot(...u);u=u.map(x=>x/l);const w=[v[1]*u[2]-v[2]*u[1],v[2]*u[0]-v[0]*u[2],v[0]*u[1]-v[1]*u[0]];
 const p=(P,i)=>P.map((x,j)=>x+r*(Math.cos(i/n*TAU)*u[j]+Math.sin(i/n*TAU)*w[j]));
 for(let i=0;i<n;i++)s.face([p(A,i),p(A,i+1),p(B,i+1),p(B,i)],color,a);
}
export function person(s,x,y,z,t,{scale=1,color=[155,119,89],a=1,seated=false,age=0,stride=0}={}){
 const p=(dx,dy,dz)=>[x+dx*scale,y+dy*scale,z+dz*scale],skin=[216,184,145],sway=Math.sin(t*1.8+x)*1.4,hip=seated?-43:-49;
 ellipsoid(s,...p(sway,hip-26,0),18*scale,27*scale,12*scale,color,a,8,6);
 ellipsoid(s,...p(sway+age*5,hip-65,0),12*scale,16*scale,11*scale,skin,a,8,6);
 ellipsoid(s,...p(sway+age*5,hip-76,1),12.2*scale,6*scale,11.5*scale,blend([55,48,42],[174,168,152],age),a,8,4);
 for(const side of [-1,1]){
  const step=Math.sin(t*5+side*Math.PI/2)*stride,hipPoint=p(side*9,hip,0),knee=p(side*10,seated?-43:-24,seated?-28:Math.sin(t*1.5+side)*2+step*16),foot=p(side*11,-Math.max(0,step)*8,seated?-31:-2+step*21);
  rod(s,hipPoint,knee,7.5*scale,[61,73,74],a);rod(s,knee,foot,6*scale,[58,70,72],a);ellipsoid(s,foot[0],foot[1],foot[2]-4*scale,8*scale,5*scale,13*scale,[39,43,42],a,8,4);
  const shoulder=p(side*17,hip-37,0),elbow=p(side*24,hip-18,seated?-16:0),hand=p(side*21,seated?hip-26:hip+1,seated?-34:-4);
  rod(s,shoulder,elbow,6*scale,color,a);rod(s,elbow,hand,5*scale,color,a);ellipsoid(s,...hand,5*scale,6*scale,5*scale,skin,a,6,4);
 }
}
export function book(s,x,y,z,w,d,color,thickness=10){s.box(x,y,z,w,thickness,d,color);s.box(x,y-2,z,w-3,thickness-4,d-2,[219,211,180]);s.box(x,y-thickness,z,w+1,2,d+1,color);for(let k=0;k<3;k++)s.line([[x-w/2+2,y-3-k*2,z-d/2-1],[x+w/2-2,y-3-k*2,z-d/2-1]],[149,135,112],.5,.45);}
export function mug(s,x,y,z,color=[195,183,149],a=1){
 const n=28,outer=[],inner=[];for(let i=0;i<n;i++){const q=i/n*TAU;outer.push([x+Math.cos(q)*9,y-18,z+Math.sin(q)*9]);inner.push([x+Math.cos(q)*7.2,y-18,z+Math.sin(q)*7.2]);}
 for(let i=0;i<n;i++){const j=(i+1)%n,A=outer[i],B=outer[j],I=inner[i],J=inner[j];s.face([B,A,[A[0],y,A[2]],[B[0],y,B[2]]],color,a);s.face([A,B,J,I],blend(color,[249,235,197],.30),a);s.face([I,J,[J[0],y-13,J[2]],[I[0],y-13,I[2]]],blend(color,[91,104,88],.3),a);}
 const liquid=[];for(let i=0;i<n;i++){const q=i/n*TAU;liquid.push([x+Math.cos(q)*7.1,y-15,z+Math.sin(q)*7.1]);}s.face(liquid,[72,48,34],a);
 const P=(i,j)=>{const u=i/32*TAU,v=j/8*TAU,r=6+Math.cos(v)*1.65;return [x+10+Math.cos(u)*r,y-9+Math.sin(u)*r,z+Math.sin(v)*1.65];};
 for(let i=0;i<32;i++)for(let j=0;j<8;j++)s.face([P(i,j),P(i+1,j),P(i+1,j+1),P(i,j+1)],color,a);
}
