import {SUBTITLES,realTime} from './timeline.mjs';
import {recordWave} from './heart-records.mjs';
import {TAU,mix,ramp,gate,hash,coral,gold,teal,blue,ivory,blend,rgb,lerp3,project,path,spot,dot,ring,text,heartWave,clamp} from './drawing.mjs';
import {pulse,EVENTS,NODE_TIMES,CONNECTIONS} from './score.mjs';
import {livingWave} from './motion.mjs';

export function background(c,t,cloud){
 c.fillStyle='#04060d';c.fillRect(0,0,1920,1080);
 const drift=Math.sin(t*.032)*45;c.globalAlpha=.82;c.drawImage(cloud,-70+drift,-50,2080,1170);c.globalAlpha=1;
 const warm=gate(7,27,t,3),cool=gate(27,48,t,3),silence=gate(48,57,t,2);
 spot(c,1240+Math.sin(t*.07)*180,460,980,blend(blue,gold,warm*.55),.09*(1-silence*.65));
 spot(c,220,650,670,teal,.035+cool*.05);
 // Distant, middle and near marks have different parallax and sharpness.
 for(let layer=0;layer<3;layer++)for(let i=0;i<250;i++){
  const n=i+layer*319,dx=(hash(n)*2180-t*(layer+1)*1.1+2180)%2180-130,dy=hash(n+713)*1060+10;
  const a=(.08+hash(n+49)*.19)*(1-silence*.65)*(layer===2?.7:1);
  dot(c,dx,dy,.45+layer*.3,layer===1?gold:blue,a);
 }
 const v=c.createRadialGradient(960,495,270,960,530,1170);v.addColorStop(0,'rgba(0,0,0,0)');v.addColorStop(1,'rgba(0,0,0,.65)');c.fillStyle=v;c.fillRect(0,0,1920,1080);
}

export function firstImpulse(c,t){
 const a=1-ramp(6.3,9,t);if(a<.003)return;
 const now=realTime(t),p=pulse(t,0),reveal=ramp(.2,2,t),ripple=ramp(1.2,4,t);
 // Interleaved marks are time, not a glossy surface. Each ring is a past beat.
 const events=EVENTS.filter(e=>e.voice==='heart'&&e.primary&&e.time<=now&&e.time>=now-6);
 for(const e of events){const age=now-e.time,R=age*145+12;
  for(let band=0;band<3;band++){const pts=[];for(let j=0;j<=160;j++){const q=j/160*TAU,rad=R+band*4+6*Math.sin(q*7+e.time);pts.push([960+Math.cos(q)*rad,500+Math.sin(q)*rad*.58]);}path(c,pts,blend(coral,blue,age/6),a*reveal*Math.exp(-age*.6)*(.26-band*.06),band?1:1.6);}
 }
 const full=ramp(.4,3.1,t),wave=[];for(let i=0;i<=480;i++){const u=i/480;if(u>full)break;wave.push([430+u*1060,500-recordWave(0,u,now,3.4)*155*(1+.055*p)]);}path(c,wave,coral,a*reveal*.9,2);
 if(wave.length){const end=wave.at(-1);spot(c,...end,42,coral,a*.6);dot(c,...end,2.3,ivory,a);}
 spot(c,960,500,110+p*90,coral,a*(.13+p*.22));
 for(let i=0;i<96;i++){
  const q=i/96*TAU,R=310+hash(i)*35,x=960+Math.cos(q)*R,y=500+Math.sin(q)*R*.58;
  path(c,[[x,y],[x+Math.cos(q)*(i%8===0?15:5),y+Math.sin(q)*(i%8===0?9:3)]],gold,a*ripple*.35,.8);
 }
 text(c,'一次心跳',1550,494,34,ivory,a*ramp(2,3.5,t)*.8);text(c,'没有被询问的开始',1550,539,18,gold,a*ramp(3.2,4.5,t)*.6);
}

function fieldVertex(i,j,t){
 const x=(i/60-.5)*1680,y=(j/30-.5)*610;
 const d1=Math.hypot(x+360,y),d2=Math.hypot(x-360,y);
 const phase=t*TAU/1.25,a1=Math.sin(d1*.034-phase),a2=Math.sin(d2*.034-phase-1.5);
 const z=(a1*Math.exp(-d1/1300)+a2*Math.exp(-d2/1300))*(45+25*ramp(28,36,t))+Math.sin(x*.003+t*.4)*24;
 return {p:project([x,y,z],{pitch:.52+.14*Math.sin(t*.32),yaw:.12*Math.sin(t*.18),x:960,y:565,scale:1}),v:a1+a2,x,y};
}
export function pair(c,t){
 const alpha=gate(26.7,39.4,t,1.8);if(alpha<.003)return;
 const V=Array.from({length:31},(_,j)=>Array.from({length:61},(_,i)=>fieldVertex(i,j,t)));
 // Thin colored facets carry the interference pattern; no specular lighting.
 for(let j=0;j<30;j++)for(let i=0;i<60;i++){
  const v=V[j][i],col=blend(teal,coral,i/60),p=[v.p,V[j][i+1].p,V[j+1][i+1].p,V[j+1][i].p];
  const intensity=Math.abs(v.v)/2;path(c,p,col,alpha*(.018+.075*intensity**3),1,true,true);
 }
 for(let j=0;j<=30;j++)path(c,V[j].map(v=>v.p),blend(teal,gold,j/30),alpha*(j%5===0?.45:.16),j%5===0?1.1:.55);
 for(let i=0;i<=60;i+=2)path(c,V.map(row=>row[i].p),blend(coral,teal,i/60),alpha*.19,.6);
 for(let side=0;side<2;side++){
  const cx=side?1320:600,col=side?teal:coral,p=pulse(t,side);
  spot(c,cx,565,90+p*30,col,alpha*(.2+p*.2));dot(c,cx,565,3+p*3,ivory,alpha);
  for(let n=0;n<12;n++){const R=54+n*22+((t*55)%22),pts=[];for(let j=0;j<=160;j++){const q=j/160*TAU;pts.push([cx+Math.cos(q)*R,565+Math.sin(q)*R*.54]);}const fade=ramp(54,76,R)*(1-ramp(275,318,R));path(c,pts,col,alpha*.22*(1-(R-54)/340)*fade,.85);}
  path(c,[[cx,390],[cx,565]],col,alpha*.35,.8);text(c,side?'你':'我',cx,320,70,col,alpha*.9);text(c,side?'另一种节律':'同一片寂静',cx,387,21,ivory,alpha*.7,{tracking:3});
 }
 const span=ramp(30,34,t)*(1-ramp(35.2,37.8,t));
 path(c,[[645,275],[1275,275]],gold,alpha*span*.55,1);text(c,'短 暂 同 频',960,265,27,gold,alpha*span,{tracking:3});
}

const SUBS=SUBTITLES;
export function lettering(c,t,chapters){
 const chapter=chapters.find(s=>t>=s.start&&t<s.end)||chapters.at(-1),i=chapters.indexOf(chapter),a=gate(chapter.start+.35,chapter.start+4.6,t,.6);
 if(chapter.id!=='return'){const x=104-18*(1-ramp(chapter.start+.35,chapter.start+1.2,t));text(c,chapter.zh,x,100,42,ivory,a*.94,{align:'left',tracking:4,weight:700});text(c,chapter.en,x+2,146,12,gold,a*.68,{align:'left',tracking:3});}
 for(const [from,to,s] of SUBS){const a=gate(from,to,t,.5);if(a<.002)continue;
  const g=c.createLinearGradient(0,860,0,1080);g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(1,`rgba(0,0,0,${a*.65})`);c.fillStyle=g;c.fillRect(0,860,1920,220);text(c,s,960,970,33,ivory,a,{tracking:2});
 }
 if(t>=183){const a=ramp(183,186.5,t)*(1-ramp(194,196,t)*.65);text(c,'心跳',960,410,174,ivory,a,{tracking:22,weight:700});text(c,'HEARTBEAT',960,557,24,gold,a*.75,{tracking:12});text(c,'活着的意义',960,620,30,ivory,a*.75,{tracking:10});text(c,'答案没有到来。',960,836,27,ivory,ramp(187,189,t)*a*.8);text(c,'心跳仍在继续。',960,886,23,gold,ramp(190,193,t)*a*.6);}
}

