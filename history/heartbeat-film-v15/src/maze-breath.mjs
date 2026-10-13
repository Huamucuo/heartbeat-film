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

// One measured MLII beat at its real 360 Hz clock, extended by a quiet baseline.
function ecgValue(time){
 const index=(time-.65)*ECG_SAMPLE_RATE;
 if(index<0||index>ECG_SAMPLES.length-1)return 0;
 const a=Math.floor(index),b=Math.min(a+1,ECG_SAMPLES.length-1);
 return ECG_SAMPLES[a]+(ECG_SAMPLES[b]-ECG_SAMPLES[a])*(index-a);
}
export function bridgeECG(c,t){
 if(t<ECG_START||t>=ECG_CLEAR)return;
 const duration=ECG_SWEEP_END-ECG_START,age=t-ECG_START,head=clamp(age/duration);
 const opacity=ramp(0,.10,age)*(1-ramp(ECG_SWEEP_END+.04,ECG_CLEAR,t));
 const points=[],left=180,right=1740,y=577,scale=234;
 const xAt=u=>left+(right-left)*u,yAt=u=>y-ecgValue(u*duration)*scale;
 // Reveal only the waveform already reached by the monitor sweep.
 for(let i=0;i<=Math.floor(head*1000);i++){const u=i/1000;points.push([xAt(u),yAt(u)]);}
 points.push([xAt(head),yAt(head)]);
 c.save();c.lineJoin='round';c.lineCap='round';
 for(const [width,alpha] of [[7,.12],[2.4,.95]]){
  c.lineWidth=width;c.strokeStyle=rgb([244,37,53],alpha*opacity);c.beginPath();
  points.forEach((p,i)=>c[i?'lineTo':'moveTo'](...p));c.stroke();
 }
 if(age<duration){c.fillStyle=rgb([255,66,76],opacity);c.beginPath();c.arc(xAt(head),yAt(head),2.8,0,Math.PI*2);c.fill();}
 c.restore();
}
