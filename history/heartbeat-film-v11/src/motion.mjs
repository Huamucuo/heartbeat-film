import {TAU,mix,ramp,heartWave,lerp3} from './drawing.mjs';
import {NODE_TIMES} from './score.mjs';

export const mod=(x,n=1)=>(x%n+n)%n;
// A moving signal, not a frozen ECG with a moving highlight. Its 1.25 s
// cycle is the score's primary heartbeat period; phase shifts distinguish lives.
export function livingWave(u,t,phase=0,cycles=1){
 const q=mod(u*cycles+(t-.625)/1.25+phase);
 return heartWave(q)+.014*Math.sin(u*TAU*3-t*1.3+phase*4);
}
export const ANCHORS=[[-740,-200,60],[-530,180,-40],[-240,-240,160],[415,-235,20],[760,95,-50],[520,340,100],[40,350,-80],[-270,70,180],[80,-30,-220]];

export function lifePoint(id,u,t){
 const q=u*TAU,drift=t*.24+id*.8,breath=1+.035*Math.sin(t*2.1+id),r=140*breath;
 let p;
 switch(id){
  case 0:p=[Math.cos(q)*r*(1+.18*Math.sin(q*3+drift)),Math.sin(q)*r*.68,Math.sin(q*2+drift)*r*.46];break;
  case 1:p=[Math.sin(q*2+drift*.13)*r,Math.cos(q)*r,Math.sin(q*3+drift)*r*.30];break;
  case 2:{const n=5,a=mod(u)*n,k=Math.floor(a),f=a-k,ang=k/n*TAU+drift*.16,next=(k+1)/n*TAU+drift*.16;p=[mix(Math.cos(ang),Math.cos(next),f)*r,mix(Math.sin(ang),Math.sin(next),f)*r,Math.sin(q*2+drift)*r*.5];break;}
  case 3:{const a=q*1.8+drift,rr=(.18+.78*u)*r;p=[Math.cos(a)*rr,Math.sin(a)*rr,Math.sin(q+drift)*r*.8];break;}
  case 4:p=[Math.sin(q)*r,Math.cos(q)*r*.55,Math.sin(q*2+drift)*r*.85];break;
  case 5:p=[Math.sin(q*2)*r,Math.sin(q*3+drift*.2)*r*.76,Math.cos(q+drift)*r*.75];break;
  case 6:{const a=q*.88+drift*.6;p=[Math.cos(a)*r,Math.sin(a)*r*.8,Math.sin(q*2+drift)*r*.36];break;}
  case 7:{const rr=r*(.62+.35*Math.sin(q*5+drift*.3));p=[Math.cos(q)*rr,Math.sin(q)*rr,Math.cos(q*3+drift)*r*.38];break;}
  default:p=[(u-.5)*r*2.25,-livingWave(u,t,.2)*r*.7,Math.sin(q+drift)*r*.3];
 }
 const wave=livingWave(u,t,id*.107)*9;
 return [p[0],p[1]+wave,p[2]+Math.sin(q+drift)*6];
}

// Persistent point correspondence: the same u and band are first a heartbeat,
// then a folded life, then one thread of a shared fabric, then a released thread.
export function loomPoint(id,u,band,t){
 const birth=NODE_TIMES[id],a=ANCHORS[id],q=u*TAU,offset=(band-6)*3.1;
 const line=[(u-.5)*260,-livingWave(u,t,id*.107)*70,0],shape=lifePoint(id,u,t);
 const local=lerp3(line,shape,ramp(birth+.2,birth+1.35,t));
 const separate=[a[0]+local[0]+Math.cos(q)*offset,a[1]+local[1]+Math.sin(q)*offset*.7,a[2]+local[2]+offset*1.8];
 const v=(id*13+band+.5)/117,wave=livingWave(u,t,v*.73,2.1);
 const sheet=[(u-.5)*2460,(v-.5)*960+125*Math.sin(u*TAU*1.2+v*4-t*.48)+wave*29,(v-.5)*470+245*Math.sin(u*TAU*.9+v*4.5-t*.27)];
 const aq=(u-.5)*TAU*1.22+v*.87+t*.09,R=340+v*310;
 const arch=[Math.sin(aq)*R*1.58,Math.cos(aq)*R*.85+Math.sin(v*Math.PI)*-85+wave*20,Math.sin(aq*1.65+v*3+t*.12)*340];
 const woven=lerp3(sheet,arch,ramp(68,73.5,t));
 let p=lerp3(separate,woven,ramp(63.75,68.25,t));
 const loss=76.875+id*.25,release=ramp(loss,loss+4.6,t),theta=v*TAU+u*.65;
 const free=[p[0]+Math.cos(theta)*release*1500,p[1]+Math.sin(theta)*release*960,p[2]+release*(650+v*800)];
 p=lerp3(p,free,release);
 return p;
}
