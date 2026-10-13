import {ramp,clamp,rgb} from './drawing.mjs';
import {BLUR_START,BLACK_START,LIFE_START,ECG_START,ECG_SWEEP_END,ECG_CLEAR} from './pacing.mjs';
import {ECG_SAMPLES,ECG_SAMPLE_RATE} from './measured-ecg.mjs';

export function transitionImage(c,image,t,width,height){
 if(t<BLUR_START){c.drawImage(image,0,0);return;}
 if(t<BLACK_START){
  const u=ramp(BLUR_START,BLACK_START,t),opacity=1-ramp(90.25,BLACK_START,t);
  c.save();c.globalAlpha*=opacity;c.filter=`blur(${36*u*u*width/1920}px)`;
  c.drawImage(image,0,0);c.restore();
 }else if(t>=LIFE_START){
  c.save();c.globalAlpha*=ramp(LIFE_START,99.2,t);c.drawImage(image,0,0);c.restore();
 }
}

// Keep the measured MLII shape. Playback traverses it rapidly once; this is
// a cinematic accelerated display, not a real-time medical monitor.
function ecgValue(time){
 const index=(time-.65)*ECG_SAMPLE_RATE;
 if(index<0||index>ECG_SAMPLES.length-1)return 0;
 const a=Math.floor(index),b=Math.min(a+1,ECG_SAMPLES.length-1);
 return ECG_SAMPLES[a]+(ECG_SAMPLES[b]-ECG_SAMPLES[a])*(index-a);
}
const left=180,right=1740,baseline=577,height=234,POINTS=1200;
const xAt=u=>left+(right-left)*u;
const yAt=u=>baseline-ecgValue(u*2.2)*height;
const shape=Array.from({length:POINTS+1},(_,i)=>[xAt(i/POINTS),yAt(i/POINTS)]);
function tracePath(c,head){
 c.beginPath();
 for(let i=0;i<=Math.floor(head*POINTS);i++)c[i?'lineTo':'moveTo'](...shape[i]);
 c.lineTo(xAt(head),yAt(head));
}
function trailGradient(c,time,tau,color,opacity){
 const duration=ECG_SWEEP_END-ECG_START,g=c.createLinearGradient(left,0,right,0);
 for(let i=0;i<=64;i++){
  const u=i/64,age=time-(ECG_START+u*duration);
  const strength=age>=0?Math.exp(-age/tau):0;
  g.addColorStop(u,rgb(color,strength*opacity));
 }
 return g;
}
export function bridgeECG(c,t){
 if(t<ECG_START||t>=ECG_CLEAR)return;
 const duration=ECG_SWEEP_END-ECG_START,age=t-ECG_START,head=clamp(age/duration);
 const release=1-ramp(ECG_CLEAR-.12,ECG_CLEAR,t);
 c.save();c.lineJoin='round';c.lineCap='round';c.globalCompositeOperation='lighter';
 // The light is attached to the actual ECG stroke. Short-lived broad emission,
 // a red body and a thin hot core share identical coordinates and timing.
 const layers=[
  {width:14,blur:10,tau:.075,color:[232,10,31],alpha:.21},
  {width:6.2,blur:3.8,tau:.11,color:[255,26,43],alpha:.48},
  {width:2.35,blur:0,tau:.13,color:[255,48,62],alpha:.97},
  {width:.82,blur:0,tau:.046,color:[255,221,212],alpha:.95},
 ];
 for(const layer of layers){
  c.save();c.filter=layer.blur?`blur(${layer.blur}px)`:'none';
  c.strokeStyle=trailGradient(c,t,layer.tau,layer.color,layer.alpha*release);
  c.lineWidth=layer.width;tracePath(c,head);c.stroke();c.restore();
 }
 // A softer persistence layer briefly records the complete measured shape.
 // Its opacity ages point by point, so the trail disappears along the sweep.
 c.strokeStyle=trailGradient(c,t,.19,[205,21,38],.17*release);
 c.lineWidth=1.25;tracePath(c,head);c.stroke();
 if(age<duration){
  // Micro-exposures follow positions already visited. No duplicate waveform,
  // offset RGB curves, full-screen flash or decorative arc is introduced.
  for(let j=9;j>=0;j--){
   const lag=j*.0035,u=clamp((age-lag)/duration);if(age<lag)continue;
   const x=xAt(u),y=yAt(u),a=Math.exp(-j*.34)*release;
   const glow=c.createRadialGradient(x,y,0,x,y,26);
   glow.addColorStop(0,rgb([255,157,143],.29*a));
   glow.addColorStop(.18,rgb([255,51,58],.23*a));
   glow.addColorStop(.48,rgb([227,9,29],.07*a));
   glow.addColorStop(1,'rgba(176,0,20,0)');
   c.fillStyle=glow;c.fillRect(x-26,y-26,52,52);
  }
  const x=xAt(head),y=yAt(head);
  c.fillStyle=rgb([255,228,222],release);c.beginPath();c.arc(x,y,2.2,0,Math.PI*2);c.fill();
 }
 c.restore();
}
