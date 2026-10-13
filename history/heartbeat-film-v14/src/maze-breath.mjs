import {ramp,clamp,rgb} from './drawing.mjs';
import {BLUR_START,BLACK_START,LIFE_START,BRIDGE_BEATS} from './pacing.mjs';

export function transitionImage(c,image,t,width,height){
 const scale=width/1920;
 if(t<BLUR_START){c.drawImage(image,0,0);return;}
 if(t<LIFE_START){
  const u=ramp(BLUR_START,92.3,t),zoom=1+.31*u;
  const opacity=1-ramp(91.95,93.35,t);
  if(opacity>.001){
   c.save();c.globalAlpha*=opacity;c.filter=`blur(${23*u*u*scale}px)`;
   c.translate(width/2,height/2);c.scale(zoom,zoom);c.drawImage(image,-width/2,-height/2,width,height);c.restore();
  }
 }else{
  c.save();c.globalAlpha*=ramp(LIFE_START,LIFE_START+1.2,t);c.drawImage(image,0,0);c.restore();
 }
}
function ecgValue(time){
 let v=0;for(const beat of BRIDGE_BEATS){const x=time-beat,g=(m,s)=>Math.exp(-(((x-m)/s)**2));v+=.10*g(-.20,.070)-.19*g(-.055,.028)+g(0,.024)-.36*g(.067,.035)+.18*g(.28,.12);}return v;
}
export function bridgeECG(c,t){
 if(t<91.1||t>=BLACK_START)return;
 const opacity=ramp(91.1,92.0,t)*(1-ramp(94.65,BLACK_START,t));
 let pulse=0;for(const beat of BRIDGE_BEATS){const age=t-beat;if(age>=0)pulse+=Math.exp(-age/.22)*(1-Math.exp(-age/.018));}
 const amplitude=285+40*pulse,trace=[];
 for(let k=0;k<=760;k++){const u=k/760;trace.push([164+1592*u,552-ecgValue(t+(u-.5)*3.7)*amplitude]);}
 const draw=(color,a,width)=>{c.strokeStyle=rgb(color,a*opacity);c.lineWidth=width;c.beginPath();trace.forEach((p,i)=>c[i?'lineTo':'moveTo'](...p));c.stroke();};
 c.save();c.lineCap='round';c.lineJoin='round';
 draw([255,166,100],.075,22);draw([255,179,126],.17,9);draw([248,205,161],.93,3.1);draw([255,244,215],.85,1.1);
 // A restrained light at the time origin connects the audible beat to the
 // centre of the large trace. No title, labels or random surrounding symbols.
 if(pulse>.001){const g=c.createRadialGradient(960,552-ecgValue(t)*amplitude,0,960,552-ecgValue(t)*amplitude,33);g.addColorStop(0,rgb([255,226,178],.36*pulse*opacity));g.addColorStop(1,rgb([255,174,105],0));c.fillStyle=g;c.fillRect(927,519-ecgValue(t)*amplitude,66,66);}
 c.restore();
}
