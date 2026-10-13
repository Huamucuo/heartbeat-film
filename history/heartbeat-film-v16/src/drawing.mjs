export const W=1920,H=1080,TAU=2*Math.PI;
export const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
export const mix=(a,b,u)=>a+(b-a)*u;
export const smooth=v=>(v=clamp(v))*v*(3-2*v);
export const ramp=(a,b,t)=>smooth((t-a)/(b-a));
export const gate=(a,b,t,f=.7)=>ramp(a,a+f,t)*(1-ramp(b-f,b,t));
export const hash=n=>{const k=Math.sin(n*127.17+73.9)*43758.547;return k-Math.floor(k);};
export const coral=[255,130,103],gold=[255,211,143],teal=[126,233,223],blue=[145,173,244],ivory=[250,242,223];
export const blend=(a,b,u)=>a.map((x,i)=>mix(x,b[i],clamp(u)));
export const rgb=(c,a=1)=>`rgba(${c[0]|0},${c[1]|0},${c[2]|0},${clamp(a)})`;
export const canvas=(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c;};
export const lerp3=(a,b,u)=>a.map((v,i)=>mix(v,b[i],u));

export function project(p,{yaw=0,pitch=0,scale=1,x=960,y=500,depth=2300}={}){
 const cy=Math.cos(yaw),sy=Math.sin(yaw),cp=Math.cos(pitch),sp=Math.sin(pitch);
 const X=p[0]*cy+p[2]*sy,Z=-p[0]*sy+p[2]*cy,Y=p[1]*cp-Z*sp,z=p[1]*sp+Z*cp;
 const q=depth/(depth+z);return [x+X*q*scale,y+Y*q*scale,z,q];
}
export function path(c,points,color=ivory,alpha=1,width=1,close=false,fill=false){
 if(alpha<.002||!points.length)return;c.save();c.globalAlpha=clamp(alpha*(fill?1.5:1.8));c.beginPath();points.forEach((p,i)=>c[i?'lineTo':'moveTo'](p[0],p[1]));if(close)c.closePath();c.strokeStyle=rgb(color);c.lineWidth=width*1.16;c.lineJoin='round';if(fill){c.fillStyle=rgb(color);c.fill();}else c.stroke();c.restore();
}
export function spot(c,x,y,r,color=gold,a=1){
 if(a<.003||r<=0)return;const g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,rgb(color,a));g.addColorStop(.08,rgb(color,a*.7));g.addColorStop(.3,rgb(color,a*.12));g.addColorStop(1,rgb(color,0));c.save();c.globalCompositeOperation='lighter';c.fillStyle=g;c.fillRect(x-r,y-r,r*2,r*2);c.restore();
}
export function dot(c,x,y,r,color=ivory,a=1){if(a<.002)return;c.fillStyle=rgb(color,a);c.beginPath();c.arc(x,y,Math.max(.3,r),0,TAU);c.fill();}
export function ring(c,x,y,r,color,a=1,width=1,from=0,to=TAU){if(a<.002)return;c.strokeStyle=rgb(color,a);c.lineWidth=width;c.beginPath();c.arc(x,y,r,from,to);c.stroke();}
export function text(c,s,x,y,size=30,color=ivory,a=1,{align='center',italic=false,tracking=0,sans=false,weight=400}={}){
 if(a<.003)return;c.save();c.globalAlpha=clamp(a);c.fillStyle=rgb(color);c.textAlign=align;c.textBaseline='middle';c.font=`${italic?'italic ':''}${weight} ${size}px ${sans?'"Microsoft YaHei", sans-serif':'"Times New Roman", "Heartbeat Serif", "Noto Serif SC", "SimSun", serif'}`;
 if(!tracking)c.fillText(s,x,y);else{const chars=[...s],width=chars.reduce((v,k)=>v+c.measureText(k).width,0)+tracking*(chars.length-1);let xx=x-(align==='center'?width/2:align==='right'?width:0);c.textAlign='left';for(const k of chars){c.fillText(k,xx,y);xx+=c.measureText(k).width+tracking;}}c.restore();
}
export function heartWave(u){
 const g=(m,s)=>Math.exp(-(((u-m)/s)**2));
 return .18*g(.19,.07)-.32*g(.38,.021)+1.28*g(.415,.016)-.53*g(.457,.025)+.3*g(.64,.09);
}

// A deterministic, very low contrast cloud plate, built from value noise.
// This is atmosphere behind the information, not a simulated reflective material.
export function atmosphere(){
 const c=canvas(480,270),ctx=c.getContext('2d'),d=ctx.createImageData(480,270);
 function noise(x,y){let ix=Math.floor(x),iy=Math.floor(y),u=smooth(x-ix),v=smooth(y-iy);return mix(mix(hash(ix+iy*137),hash(ix+1+iy*137),u),mix(hash(ix+(iy+1)*137),hash(ix+1+(iy+1)*137),u),v);}
 for(let y=0;y<270;y++)for(let x=0;x<480;x++){
  let n=0,s=0;for(let o=0;o<5;o++){const f=2**o*.017,amp=.55**o;n+=noise(x*f,y*f)*amp;s+=amp;}n/=s;
  const band=Math.exp(-(((y/270-.52-.22*Math.sin(x/130))/.42)**2)),v=clamp((n-.3)*1.25)*band;
  const i=(y*480+x)*4;d.data[i]=7+v*17;d.data[i+1]=10+v*21;d.data[i+2]=20+v*41;d.data[i+3]=255;
 }ctx.putImageData(d,0,0);return c;
}
