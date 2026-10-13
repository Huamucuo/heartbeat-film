import {TAU,mix,ramp,gate,clamp,blend,rgb,project,spot} from './drawing.mjs';
import {transitMotion} from './transit-model.mjs';

// One accelerating passage of years, authored only for the housing chapter.
// Cycle heights, weather and framing evolve; this is not a reusable scene loop.
export function housingLight(t){
 const u=clamp((t-180.7)/14.1),phase=.08+3.76*u**1.62,cycle=Math.floor(phase),f=phase%1;
 const altitude=Math.sin(f*TAU),day=ramp(-.15,.38,altitude),dusk=Math.exp(-altitude*altitude/ .07)*(1-ramp(3.62,3.84,phase));
 return {phase,cycle,f,altitude,day,dusk,direction:[-.72*Math.cos(f*TAU),-.45-.50*Math.max(0,altitude),-.36],shadow:Math.cos(f*TAU)};
}
export function housingSky(c,t,alpha){
 const a=gate(180,198,t,2.15)*alpha;if(a<.002)return;
 const L=housingLight(t),{cycle,f,day,dusk}=L;
 const top=blend([8,20,38],[62,101,120],day),bottom=blend(blend([18,42,56],[132,149,131],day),[150,91,68],dusk*.45);
 c.save();c.globalAlpha=a;const sky=c.createLinearGradient(0,60,0,930);sky.addColorStop(0,rgb(top));sky.addColorStop(1,rgb(bottom));c.fillStyle=sky;c.fillRect(0,0,1920,1080);
 // The higher houses occupy more of the sky. Clouds drift continuously in one direction.
 for(let k=0;k<3;k++){
  const y=252+k*121,xx=-260+k*570+(t-180)*(7+k*3),w=370-k*40;
  c.save();c.translate(xx,y);c.scale(1,.22);const haze=c.createRadialGradient(0,0,10,0,0,w);haze.addColorStop(0,rgb([222,198,158],(.055+day*.10)*(1-k*.18)));haze.addColorStop(1,'rgba(150,169,163,0)');c.fillStyle=haze;c.fillRect(-w,-w,w*2,w*2);c.restore();
 }
 const sun=f<.5,local=sun?f*2:(f-.5)*2,arc=Math.sin(local*Math.PI),x=mix(90,1830,local),y=770-arc*(555-cycle*35),radius=sun?34-cycle*2:24-cycle;
 const visibility=gate(0,1,local,.13);
 if(visibility>.001){
  spot(c,x,y,sun?150:93,sun?[247,204,132]:[177,205,213],visibility*a*(sun?.42:.23));
  c.globalAlpha=a*visibility;c.fillStyle=sun?'#f9e1ae':'#bdced0';c.beginPath();c.arc(x,y,radius,0,TAU);c.fill();
  if(!sun){c.fillStyle=rgb(blend(top,bottom,clamp(y/1080)));c.beginPath();c.arc(x+radius*.46,y-radius*.18,radius*.91,0,TAU);c.fill();}
 }
 c.restore();return L;
}
export function litCamera(cam,id,t){
 if(id!==2)return cam;const L=housingLight(t),active=gate(180,198,t,2.15);
 return {...cam,light:[-.38,-.79,-.48].map((v,i)=>mix(v,L.direction[i],active)),ambient:mix(.40,.29+L.day*.25,active),diffuse:mix(.58,.43+L.day*.27,active)};
}
export function lifePracticalLights(c,id,t,cam,alpha,worldTransform){
 const point=p=>project(worldTransform(id,p,t),cam),glow=(p,r,color,a)=>{const v=point(p);spot(c,v[0],v[1],r*v[3]*cam.scale,color,a*alpha);};
 if(id===2){
  const p=ramp(184,187,t),q=ramp(191,194,t),night=1-housingLight(t).day;
  glow([-78,32,-49],18,[239,184,104],night*(1-p)*.18);
  glow([42,-58,-48],20,[240,186,111],night*p*(1-q)*.18);
  glow([20,-115,-59],19,[248,193,113],q*(.13+night*.13));
 }
 if(id===3){
  const M=transitMotion(t),rail=M.rail,a=gate(198,216,t,1.8),x=rail>.3?174+M.trainX:156+M.busX,y=rail>.3?30:54;
  if(M.pass>.6){
   const triangle=[[x,y,-28],[x+184,98,-85],[x+242,98,5]].map(point);
   c.save();c.globalCompositeOperation='screen';c.globalAlpha=alpha*a*.047;c.fillStyle='#d7e9dc';c.beginPath();triangle.forEach((p,i)=>c[i?'lineTo':'moveTo'](p[0],p[1]));c.closePath();c.fill();c.restore();glow([x,y,-28],11,[244,226,174],a*.38);
  }
  if(rail>.3)for(let k=-7;k<=8;k++){
   const x=k*153-(((t-198)*(8+36*ramp(202,205,t)+45*ramp(209,212,t)))%459);
   glow([x,-102,65],15,[188,220,215],rail*a*.095);
  }
 }
 if(id===7){
  const u=2.5/12*TAU,x=Math.cos(u)*36,z=Math.sin(u)*36,burn=ramp(282,294,t),len=31-13*burn,a=(1-ramp(293.35,293.65,t));
  glow([x,17-len,z],26,[251,183,91],a*(.10+.008*Math.sin(t*13)));
  glow([x,17-len,z],8,[255,228,159],a*.26);
 }
}
