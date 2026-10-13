// Independent continuous recordings: seeded per record AND per beat.
// A fixed seed makes an exported frame seekable; no waveform is looped.
export function random(seed){let a=seed>>>0;return ()=>{a+=0x6D2B79F5;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return ((t^t>>>14)>>>0)/4294967296;};}
const cache=new Map();
export function record(id){
 if(cache.has(id))return cache.get(id);
 const r=random(81731+id*1013),average=.64+r()*.63,beats=[];let t=-25+r()*average;
 while(t<365){const rr=average*(.80+r()*.39),p={time:t,rr,height:.78+r()*.45,width:.023+r()*.014,p:.065+r()*.13,q:.14+r()*.19,s:.24+r()*.35,tail:.12+r()*.25,skew:(r()-.5)*.06};beats.push(p);t+=rr;}
 const result={id,beats,average,phase:r()*6.283,drift:.035+r()*.035};cache.set(id,result);return result;
}
export function sampleHeart(id,t){
 const r=record(id),beats=r.beats;let lo=0,hi=beats.length;
 while(lo<hi){const m=(lo+hi)>>1;if(beats[m].time<t)lo=m+1;else hi=m;}
 let y=r.drift*Math.sin(t*.83+r.phase)+.018*Math.sin(t*3.61+r.phase*1.7);
 for(let i=Math.max(0,lo-2);i<Math.min(beats.length,lo+2);i++){
  const b=beats[i],x=t-b.time,g=(m,s)=>Math.exp(-(((x-m)/s)**2));
  y+=b.p*g(-.16+b.skew,.055)-b.q*g(-.040,.022)+b.height*g(0,b.width)-b.s*g(.048,.033)+b.tail*g(.225+b.skew,.080);
 }
 return y;
}
export const recordWave=(id,u,t,window=2.15)=>sampleHeart(id,t-(1-u)*window);
