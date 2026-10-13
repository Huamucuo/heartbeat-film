import {rgb,ramp,clamp,hash,mix,path} from './drawing.mjs';
const glyphs='01{}[]<>:;+=/';
export function codeBackground(c,t){
 c.fillStyle='#060c13';c.fillRect(0,0,1920,1080);
 const g=c.createLinearGradient(0,0,1920,1080);g.addColorStop(0,'#101c26');g.addColorStop(.50,'#07131d');g.addColorStop(1,'#0c1018');c.fillStyle=g;c.fillRect(0,0,1920,1080);
 c.strokeStyle='rgba(111,163,176,.035)';c.lineWidth=.6;c.beginPath();
 for(let x=32;x<1920;x+=32){c.moveTo(x,0);c.lineTo(x,1080);}for(let y=20;y<1080;y+=28){c.moveTo(0,y);c.lineTo(1920,y);}c.stroke();
}
export const poly=(points,fill=false,width=1)=>({points,fill,width});
export const rect=(x,y,w,h,fill=false)=>poly([[x,y],[x+w,y],[x+w,y+h],[x,y+h],[x,y]],fill);
export function oval(x,y,rx,ry=rx,fill=false){return poly(Array.from({length:65},(_,i)=>{const q=i/64*Math.PI*2;return [x+rx*Math.cos(q),y+ry*Math.sin(q)];}),fill);}
export function curve(a,b,d,e,n=48){return poly(Array.from({length:n+1},(_,i)=>{const u=i/n,v=1-u;return [v**3*a[0]+3*v*v*u*b[0]+3*v*u*u*d[0]+u**3*e[0],v**3*a[1]+3*v*v*u*b[1]+3*v*u*u*d[1]+u**3*e[1]];}));}
export function drawProgram(c,program,color,t,{alpha=1,erase=0,build=1,offset=0}={}){
 c.save();c.lineJoin='round';c.lineCap='round';
 for(let k=0;k<program.length;k++){
  const op=program[k],n=op.points.length,show=clamp(build*1.7-k/program.length*.65),stop=Math.max(0,Math.ceil(n*show*(1-erase)));
  if(stop<2)continue;const pts=op.points.slice(0,stop);
  if(op.fill&&erase<.01&&show>.99){c.fillStyle=rgb(color,alpha*.055);c.beginPath();pts.forEach((p,i)=>c[i?'lineTo':'moveTo'](...p));c.fill();}
  path(c,pts,color,alpha*.43,op.width||1);
  // A scanning nib adds new, legible marks while the established contour persists.
  c.strokeStyle=rgb(color,alpha*.76);c.lineWidth=(op.width||1)*1.15;c.setLineDash([9,39+hash(k+13)*70]);c.lineDashOffset=-t*(18+hash(k+offset)*22)-k*27;
  c.beginPath();pts.forEach((p,i)=>c[i?'lineTo':'moveTo'](...p));c.stroke();c.setLineDash([]);
 }
 c.restore();
}
export function glyph(c,x,y,seed,t,color,alpha=1,size=10){
 c.fillStyle=rgb(color,alpha);c.font=`${size}px Consolas, monospace`;c.textAlign='center';c.textBaseline='middle';
 const phase=Math.floor(t*(1.2+hash(seed)*2.1)+hash(seed+4)*21);c.fillText(glyphs[(phase+seed)%glyphs.length],x,y);
}
export function sweepGlyphs(c,cells,color,t,{alpha=.36,scale=1,x=0,y=0}={}){
 c.save();c.font='10px Consolas, monospace';c.textAlign='center';c.textBaseline='middle';
 for(let i=0;i<cells.length;i++){const p=cells[i],scan=.45+.55*Math.exp(-(((p[1]-((t*28)%340-170))/42)**2));glyph(c,x+p[0]*scale,y+p[1]*scale,i,t,color,alpha*scan,9.5*scale);}c.restore();
}
