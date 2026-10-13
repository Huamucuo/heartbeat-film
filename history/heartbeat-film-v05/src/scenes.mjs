import {TAU,mix,ramp,gate,hash,coral,gold,teal,blue,ivory,blend,rgb,lerp3,project,path,spot,dot,ring,text,heartWave,clamp} from './drawing.mjs';
import {pulse,EVENTS,NODE_TIMES,CONNECTIONS} from './score.mjs';
import {drawDay} from './days.mjs';

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

function recordPose(i,t){
 const col=i%12,row=Math.floor(i/12);
 const origin=[(i%12-5.5)*81,(Math.floor(i/12)-4)*4,0];
 const archive=[(col-5.5)*135,(row-4)*86,(row-4)*27+Math.sin(col*.65)*190];
 const q=i/108*TAU+Math.max(0,t-19)*.07;
 const route=[Math.sin(q)*770,Math.cos(q)*255,(i%3-1)*100+Math.cos(q)*230];
 const split=[(i%2?1:-1)*360+Math.cos(i*.618)*((i%6)*32+110),Math.sin(i*.618)*((i%6)*32+110),Math.sin(i*.91)*80];
 const a=lerp3(origin,archive,ramp(5.5,9.5,t));
 return lerp3(lerp3(a,route,ramp(17,20,t)),split,ramp(25.5,29.1,t));
}
function recordCamera(t){return {yaw:mix(-.18,.22,ramp(7.5,17,t))*(1-ramp(24,28,t)),pitch:mix(-.2,.35,ramp(14,22,t))*(1-ramp(24,28,t)),scale:mix(mix(1.06,1.12,ramp(7.5,16,t)),.98,ramp(17,20,t)),x:mix(1020,960,ramp(17,20,t)),y:505};}

export function records(c,t){
 const global=gate(4,29.5,t,1.7);if(global<.002)return;
 const cam=recordCamera(t),spread=ramp(5.5,9.5,t),toRoute=ramp(17,20,t),thin=1-ramp(25,29.5,t)*.8;
 const P=Array.from({length:108},(_,i)=>recordPose(i,t)),order=P.map((_,i)=>i).sort((a,b)=>project(P[b],cam)[2]-project(P[a],cam)[2]);
 // The lattice joins known records. It does not introduce unrelated sparks.
 for(let i=0;i<108;i++){
  const a=project(P[i],cam),to=i+1<108?i+1:0,b=project(P[to],cam);
  path(c,[a,b],i%3?blue:gold,global*(.07+.22*toRoute),.85);
  if(i+12<108)path(c,[a,project(P[i+12],cam)],blue,global*.10*(1-toRoute),.6);
 }
 for(const i of order){
  const p=P[i],col=i%12,row=Math.floor(i/12),reveal=ramp(5.3+i*.014,7.6+i*.014,t),birth=global*reveal;
  if(birth<.003)continue;
  const w=mix(72,82,spread)*mix(1,.82,toRoute),h=mix(3,53,spread)*mix(1,.82,toRoute);
  const pulseIndex=(Math.floor((t-7.5)/.625)%108+108)%108,active=Math.max(0,1-Math.abs(i-pulseIndex)/2)*ramp(7.5,8.5,t);
  const color=i%12===5?coral:i%3===0?gold:teal,alpha=(.28+.22*hash(i+39)+active*.4)*birth*thin;
  const corners=[[-w/2,-h/2],[w/2,-h/2],[w/2,h/2],[-w/2,h/2]].map(([x,y])=>project([p[0]+x,p[1]+y,p[2]],cam));
  path(c,corners,color,alpha*.38,1,true,true);path(c,corners,color,alpha,.8,true);
  const wave=[];for(let n=0;n<=30;n++){const u=n/30;wave.push(project([p[0]+(u-.5)*w*.84,p[1]-heartWave(u)*h*.34,p[2]-1],cam));}
  path(c,wave,color,(.50+active*.6)*birth*thin,1.1);
  if(i%12===5){const v=project([p[0],p[1]-h*.31,p[2]],cam);dot(c,v[0],v[1],1.35,coral,birth*.7);}
  if(i%6===0&&spread>.8&&toRoute<.5){const q=project([p[0]-w/2,p[1]-h/2-9,p[2]],cam);text(c,String(i+1).padStart(3,'0'),q[0],q[1],9,gold,birth*.43*(1-toRoute),{align:'left'});}
 }
 const a=project(recordPose(53,t),cam);spot(c,a[0],a[1],65,coral,pulse(t,0)*.45*global);
 if(t<17){
  const z=gate(10,16.8,t,1),zoom=ramp(10,12,t)*(1-ramp(15.1,16.8,t)),cx=mix(a[0],785,zoom),cy=mix(a[1],505,zoom),w=mix(82,675,zoom),h=mix(53,300,zoom);
  // Magnifying one stored day gives the field a readable foreground.
  const under=c.createLinearGradient(cx-w/2,cy-h/2,cx+w/2,cy+h/2);under.addColorStop(0,'#17262e');under.addColorStop(1,'#0b111d');c.save();c.globalAlpha=z*.96;c.fillStyle=under;c.fillRect(cx-w/2,cy-h/2,w,h);c.restore();
  path(c,[[cx-w/2,cy-h/2],[cx+w/2,cy-h/2],[cx+w/2,cy+h/2],[cx-w/2,cy+h/2]],gold,z*.8,1.4,true);
  for(let j=0;j<7;j++)path(c,[[cx-w/2,cy+(j-3)*h/8],[cx+w/2,cy+(j-3)*h/8]],teal,z*.08,.6);
  for(let i=0;i<19;i++)path(c,[[cx+(i-9)*w/20,cy-h/2],[cx+(i-9)*w/20,cy+h/2]],teal,z*.08,.6);
  const wave=[];for(let i=0;i<=160;i++){const u=i/160;wave.push([cx+(u-.5)*w*.90,cy-heartWave(u)*h*.30]);}path(c,wave,coral,z*.8,2.5);
  text(c,'曾 经',cx-w/2+25,cy-h/2+35,28,ivory,z,{align:'left',tracking:5});drawDay(c,t,cx+w/2-20,cy+h/2-25,14,z*.7,{align:'right',tracking:4});
  path(c,[[cx+w/2,cy],[1440,cy],[1440,cy-77]],gold,z*.45,.8);text(c,'已经过去',1440,cy-106,39,ivory,z*.85);text(c,'再也不能重来',1440,cy-55,22,gold,z*.65);
 }
 if(t>18){
  const z=gate(19,25.6,t,.7);text(c,'前 行',320,325,43,gold,z*.8,{tracking:7});text(c,'回 到 原 处',1515,700,29,teal,z*.65,{tracking:4});
  // A red trace moves through the same indexed records and never finds an exit.
  const q=((t-18)*.14)%1,idx=Math.floor(q*108),u=q*108-idx,b=project(lerp3(P[idx],P[(idx+1)%108],u),cam);spot(c,b[0],b[1],32,coral,global*.65);dot(c,b[0],b[1],2.5,ivory,global);
 }
}

export function firstImpulse(c,t){
 const a=1-ramp(6.3,9,t);if(a<.003)return;
 const p=pulse(t,0),reveal=ramp(.2,2,t),ripple=ramp(1.2,4,t);
 // Interleaved marks are time, not a glossy surface. Each ring is a past beat.
 const events=EVENTS.filter(e=>e.voice==='heart'&&e.time<=t&&e.time>=t-6);
 for(const e of events){const age=t-e.time,R=age*145+12;
  for(let band=0;band<3;band++){const pts=[];for(let j=0;j<=160;j++){const q=j/160*TAU,rad=R+band*4+6*Math.sin(q*7+e.time);pts.push([960+Math.cos(q)*rad,500+Math.sin(q)*rad*.58]);}path(c,pts,blend(coral,blue,age/6),a*reveal*Math.exp(-age*.6)*(.26-band*.06),band?1:1.6);}
 }
 const full=ramp(.4,3.1,t),wave=[];for(let i=0;i<=240;i++){const u=i/240;if(u>full)break;wave.push([430+u*1060,500-heartWave(u)*155*(1+.045*p)]);}path(c,wave,coral,a*reveal*.9,2);
 if(wave.length){const end=wave.at(-1);spot(c,...end,42,coral,a*.6);dot(c,...end,2.3,ivory,a);}
 spot(c,960,500,110+p*90,coral,a*(.13+p*.22));
 for(let i=0;i<96;i++){
  const q=i/96*TAU,R=310+hash(i)*35,x=960+Math.cos(q)*R,y=500+Math.sin(q)*R*.58;
  path(c,[[x,y],[x+Math.cos(q)*(i%8===0?15:5),y+Math.sin(q)*(i%8===0?9:3)]],gold,a*ripple*.35,.8);
 }
 text(c,'01',375,510,64,gold,a*ramp(2,3.5,t)*.5);text(c,'一次心跳',1550,494,34,ivory,a*ramp(2,3.5,t)*.8);text(c,'没有被询问的开始',1550,539,18,gold,a*ramp(3.2,4.5,t)*.6);
}

function fieldVertex(i,j,t){
 const x=(i/60-.5)*1680,y=(j/30-.5)*610;
 const d1=Math.hypot(x+360,y),d2=Math.hypot(x-360,y);
 const phase=t*TAU/1.25,a1=Math.sin(d1*.034-phase),a2=Math.sin(d2*.034-phase-1.5);
 const z=(a1*Math.exp(-d1/1300)+a2*Math.exp(-d2/1300))*35;
 return {p:project([x,y,z],{pitch:.64,yaw:.025*Math.sin(t*.18),x:960,y:565,scale:1}),v:a1+a2,x,y};
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

const SUBS=[
 [1.7,6.4,'开始，并没有问过我。'],[9.7,16.4,'日子一层层经过。'],[20,26.2,'我们把忙碌，当作方向。'],[29.7,36.2,'靠近，并不意味着抵达。'],[40,46.2,'出口，有时只是另一个循环。'],[49.5,55.5,'世界没有回答。'],[60,66.5,'我们把记忆与相遇，编织成意义。'],[70,75.5,'连在一起，仍各自沉默。'],[77,80.6,'有些联系，终究会消失。']
];
export function lettering(c,t,chapters){
 const chapter=chapters.find(s=>t>=s.start&&t<s.end)||chapters.at(-1),i=chapters.indexOf(chapter),a=gate(chapter.start+.35,chapter.start+4.6,t,.6);
 if(i<8){text(c,String(i+1).padStart(2,'0'),105,107,24,gold,a*.8,{align:'left'});path(c,[[147,88],[147,131]],gold,a*.6,1);text(c,chapter.zh,169,100,28,ivory,a*.9,{align:'left',tracking:3});text(c,chapter.en,170,136,10,gold,a*.6,{align:'left',tracking:2});}
 for(const [from,to,s] of SUBS){const a=gate(from,to,t,.5);if(a<.002)continue;
  const g=c.createLinearGradient(0,860,0,1080);g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(1,`rgba(0,0,0,${a*.65})`);c.fillStyle=g;c.fillRect(0,860,1920,220);text(c,s,960,970,33,ivory,a,{tracking:2});
 }
 if(t>=81){const a=ramp(81,83.5,t)*(1-ramp(88.7,90,t)*.65);text(c,'心跳',960,414,142,ivory,a,{tracking:24});text(c,'HEARTBEAT',960,541,25,gold,a*.75,{tracking:12});text(c,'活 着 的 意 义',960,607,30,ivory,a*.75,{tracking:8});text(c,'答案没有到来。',960,836,27,ivory,ramp(84,85.7,t)*a*.8);text(c,'心跳仍在继续。',960,886,23,gold,ramp(86,87.5,t)*a*.6);}
}
