import {CHAPTERS,EVENTS,HEARTS,DURATION,NODE_TIMES,CONNECTIONS,pulse} from './score.mjs';
const TAU=Math.PI*2, W=1920,H=1080, clamp=(x,a=0,b=1)=>Math.min(b,Math.max(a,x));
const mix=(a,b,u)=>a+(b-a)*u;
const ease=x=>(x=clamp(x))*x*(3-2*x), ramp=(a,b,t)=>ease((t-a)/(b-a));
const rgba=(c,a=1)=>`rgba(${c[0]|0},${c[1]|0},${c[2]|0},${clamp(a)})`;
const coral=[255,127,88],gold=[255,205,137],teal=[104,226,207],ivory=[251,232,195];
const blend=(a,b,u)=>a.map((v,i)=>mix(v,b[i],u));
function hash(i){const x=Math.sin(i*127.1+311.7)*43758.5453;return x-Math.floor(x);}
const offscreen=(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c;};

// Ninety-six persistent strands. A strand keeps its index and parameter along
// every change of representation; no frame-to-frame simulation state is used.
export function shape(mode,i,u,t,energy=0){
 const q=i/95,a=u*TAU-Math.PI/2,phase=t*TAU/1.25,small=Math.sin(a*5+q*8-t*.28),p=energy;
 if(mode===0){
  const r=52+q*700+Math.sin(a*3+q*7-t*.33)*(5+q*14)+Math.sin(a*11+q*17)*2;
  return [Math.cos(a)*r,Math.sin(a)*r,(q-.5)*100+small*8];
 }
 if(mode===1){
  const r=205+80*Math.sin(q*Math.PI)+12*Math.sin(a*3+q*8-t*.35);
  return [Math.cos(a)*r+160*Math.sin(q*3.6-1.8),Math.sin(a)*r+(q-.5)*470,(q-.5)*850];
 }
 if(mode===2){
  const x=(u-.5)*2000,ph=u*TAU*1.08+q*2.7-t*.28;
  return [x,Math.sin(ph)*210+(q-.5)*430,Math.cos(ph)*220+(q-.5)*230];
 }
 if(mode===3){
  const side=i<48?-1:1,qq=(i%48)/47,off=side===1?.5:0;
  const r=58+qq*325+Math.sin(a*3-phase*.18-off)*8+(p*10)*(1-qq);
  return [side*410+Math.cos(a)*r,Math.sin(a)*r,Math.sin(a*2+qq*3+off)*100+(qq-.5)*100];
 }
 if(mode===4){
  const b=u*TAU,qw=(q-.5)*2;
  return [Math.sin(b)*(655+qw*150),Math.sin(b*2+qw*.45)*(220+qw*95),Math.cos(b)*(140+qw*100)+Math.sin(b*3+t*.35)*42];
 }
 if(mode===5){
  const x=(u-.5)*1950,qq=(q-.5),arch=Math.sin(u*Math.PI);
  return [x,qq*540+arch*(135*Math.sin(qq*4+t*.1)) + 32*Math.sin(u*TAU*2-t*.3+q*4),qq*400+arch*110*Math.cos(q*5)];
 }
 if(mode===6){
  const b=u*TAU,r=125+(q-.5)*132,R=350+12*Math.sin(t*.65);
  const x=(R+r*Math.cos(b*3+q*TAU*.24))*Math.cos(b*2);
  const y=(R+r*Math.cos(b*3+q*TAU*.24))*Math.sin(b*2);
  return [x,y,r*Math.sin(b*3+q*TAU*.24)*1.8];
 }
 if(mode===7){
  const k=i%9,qq=Math.floor(i/9)/10, c=nodeWorld(k,t);
  const r=32+qq*92+Math.sin(a*3+k*.4-t*.45)*4;
  return [c[0]+Math.cos(a)*r,c[1]+Math.sin(a)*r,c[2]+Math.sin(a*2+k)*24+(qq-.5)*80];
 }
 const r=220+q*350+Math.sin(a*2+q*5+t*.2)*8;
 return [Math.cos(a)*r,Math.sin(a)*r,Math.sin(a+q*5)*45];
}
function nodeWorld(k,t){
 const angle=k/9*TAU-Math.PI/2,breath=1+.018*Math.sin(t*TAU/5);
 return [Math.cos(angle)*620*breath,Math.sin(angle)*330*breath,Math.sin(angle*2+t*.12)*80];
}
const CAM=[
 [1.25,-130,20,0,0], [1.17,210,0,.49,-.18], [1.0,0,-10,.34,-.07],
 [1.06,0,0,.08,0], [1.12,0,0,.52,.15], [1.05,0,0,.14,-.05],
 [1.20,100,0,.62,-.30], [1.06,0,0,.10,.02], [.88,0,-15,0,0]
];
function cameraKey(i,t){
 const c=[...CAM[i]],s=CHAPTERS[i],u=ramp(s.start+2.2,s.end,t);
 if(i===1){c[0]+=u*.17;c[1]-=u*90;c[3]+=u*.30;c[4]+=u*.56;}
 if(i===2){c[0]+=u*.13;c[3]+=u*.12;c[4]-=u*.13;}
 if(i===4){c[0]+=Math.sin(u*Math.PI)*.20;c[3]+=u*.24;c[4]-=u*.28;}
 if(i===6){c[0]-=u*.06;c[3]-=u*.34;c[4]+=u*.70;}
 if(i===7){c[3]+=.10*Math.sin(u*Math.PI);c[4]+=.12*Math.sin(u*Math.PI*2);}
 return c;
}
export function stateAt(t){
 t=clamp(t,0,DURATION);const chapter=Math.max(0,CHAPTERS.findLastIndex(s=>t>=s.start));
 // Handoffs occupy the start of a chapter, with exactly the previous geometry
 // at the boundary. Camera keys use the same interpolation.
 const previous=Math.max(0,chapter-1),duration=chapter===7?3:chapter===8?3.5:2.2;
 const blendT=chapter? ramp(CHAPTERS[chapter].start,CHAPTERS[chapter].start+duration,t):1;
 const ca=cameraKey(previous,t),cb=cameraKey(chapter,t),cam=ca.map((v,k)=>mix(v,cb[k],blendT));
 if(chapter===0)cam[0]=mix(1.85,CAM[0][0],ramp(0,7.5,t));
 cam[3]+=.025*Math.sin(t*.15);cam[4]+=.018*Math.sin(t*.22);
 const cold=ramp(26,32,t),white=ramp(57.5,69,t),quiet=ramp(47.5,50,t)*(1-ramp(55,57.5,t));
 const paper=ramp(7.5,10,t)*(1-ramp(16.7,19.5,t));
 return {t,chapter,previous,blendT,cam,cold,white,quiet,paper,p0:pulse(t,0),p1:pulse(t,1)};
}

export class HeartbeatFilm{
 constructor(canvas){
  this.canvas=canvas;canvas.width=W;canvas.height=H;this.ctx=canvas.getContext('2d',{alpha:false});
  this.layer=offscreen(W,H);this.g=this.layer.getContext('2d');this.halo=offscreen(W/4,H/4);this.hc=this.halo.getContext('2d');
  this.grain=offscreen(512,512);const c=this.grain.getContext('2d'),data=c.createImageData(512,512);
  for(let k=0;k<data.data.length;k+=4){const n=hash(k/4);data.data[k]=data.data[k+1]=data.data[k+2]=n>.5?220:10;data.data[k+3]=6+Math.floor(n*13);}
  c.putImageData(data,0,0);this.pattern=this.ctx.createPattern(this.grain,'repeat');
  this.knots=EVENTS.filter(e=>e.voice==='bloom');this.notes=EVENTS.filter(e=>e.voice==='pluck');
 }
 project(point,st){
  let [x,y,z]=point;const [scale,dx,dy,pitch,yaw]=st.cam;
  const xa=x*Math.cos(yaw)+z*Math.sin(yaw),za=z*Math.cos(yaw)-x*Math.sin(yaw);
  const ya=y*Math.cos(pitch)-za*Math.sin(pitch),zz=za*Math.cos(pitch)+y*Math.sin(pitch);
  const f=1900/(1900-zz);
  return [W/2+dx+xa*f*scale,H/2+dy+ya*f*scale,zz,f*scale];
 }
 world(i,u,st){
  const energyFor=mode=>mode<3?st.p0:(i<48?st.p0:st.p1);
  const energy=mix(energyFor(st.previous),energyFor(st.chapter),st.blendT);
  const a=shape(st.previous,i,u,st.t,energy),b=shape(st.chapter,i,u,st.t,energy);
  const grow=1+energy*.020;
  return a.map((v,k)=>mix(v,b[k],st.blendT)*(k===2?1:grow));
 }
 background(st){
  const {ctx:c}=this,{t,quiet,cold}=st;
  c.fillStyle='#090e16';c.fillRect(0,0,W,H);
  // Broad light in the material, not a starfield. The left and right sources
  // are present in the light direction before they become visible objects.
  const spot=(x,y,r,col,a)=>{const g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,rgba(col,a));g.addColorStop(1,rgba(col,0));c.fillStyle=g;c.fillRect(0,0,W,H);};
  spot(1000+Math.sin(t*.08)*260,510,960,[95,49,34],.32*(1-quiet*.3));
  spot(1570,400,920,[22,85,90],.16+cold*.20);
  spot(120,980,850,[34,38,68],.37);
  const fade=ramp(0,2,t);
  c.save();c.lineWidth=.7;
  // Wide, subdued residual contours provide scale; they are enlarged copies
  // of the same circle/wave family rather than unrelated filler particles.
  for(let k=0;k<18;k++){
   c.beginPath();for(let j=0;j<=85;j++){
    const u=j/85,x=-150+u*2220,y=200+k*53+110*Math.sin(u*3.3+k*.12+t*.045);
    c[j?'lineTo':'moveTo'](x,y);
   }c.strokeStyle=rgba(k<9?coral:teal,(.026+k*.0013)*fade);c.stroke();
  }
  c.restore();
  if(st.paper>0){
   c.save();c.globalAlpha=st.paper;const p=c.createLinearGradient(0,0,W,H);p.addColorStop(0,'#e2d5b8');p.addColorStop(.46,'#f2e8d1');p.addColorStop(1,'#bc9e74');c.fillStyle=p;c.fillRect(0,0,W,H);
   c.strokeStyle='rgba(73,46,30,.05)';c.lineWidth=1;for(let i=0;i<80;i++){const y=i*16+Math.sin(i*4)*7;c.beginPath();c.moveTo(0,y);c.bezierCurveTo(600,y-12,1200,y+8,W,y);c.stroke();}c.restore();
  }
 }
 strandStyle(i,st,z){
  const q=i/95,side=i<48?0:1;
  let col=blend(coral,gold,q*.9);
  if(st.cold>0)col=blend(col,side?teal:coral,st.cold*.92);
  if(st.chapter>=6)col=blend(col,ivory,st.white*.22);
  col=blend(col,[42+q*16,22+q*9,15+q*5],ramp(.13,.24,st.paper));
  const depth=clamp((z+600)/1150),p=side?st.p1:st.p0;
  let strength=.16+depth*.40+(i%12===0?.25:0)+p*.1;
  // A moving bright band is the visual consequence of each heart event.
  let waveA=0,waveB=0;
  for(const e of HEARTS){const age=st.t-e.time;if(age<0)break;if(age>4)continue;
   const contribution=mode=>{
    if(mode>=3&&mode<6&&e.source!==side&&e.voice!=='arrival')return 0;
    const radius=mode===3?(i%48)/47:q,r=age/(mode<2?2.7:1.8);
    return Math.exp(-Math.pow((radius-r)/.045,2))*e.amp*.85;
   };
   waveA+=contribution(st.previous);waveB+=contribution(st.chapter);
  }
  strength+=mix(waveA,waveB,st.blendT);strength*=1-st.quiet*.48;
  if(st.t<3.5)strength*=.22+.78*ramp(q*2.8,q*2.8+.6,st.t);
  return {col,alpha:clamp(strength+st.paper*.1,.045,.95),width:i%12===0?2.8:1.22};
 }
 strokeLine(points,col,alpha,width,glow=false){
  const g=this.g;g.beginPath();points.forEach((p,j)=>g[j?'lineTo':'moveTo'](p[0],p[1]));
  g.strokeStyle=rgba(col,alpha);g.lineWidth=width;g.stroke();
  if(glow){g.strokeStyle=rgba(col,alpha*.12);g.lineWidth=width+8;g.stroke();}
 }
 glow(x,y,size,col,a=1){
  const g=this.g,gr=g.createRadialGradient(x,y,0,x,y,size);
  gr.addColorStop(0,rgba(ivory,a));gr.addColorStop(.09,rgba(col,a*.9));gr.addColorStop(.28,rgba(col,a*.2));gr.addColorStop(1,rgba(col,0));
  g.fillStyle=gr;g.fillRect(x-size,y-size,size*2,size*2);
 }
 drawStrands(st){
  const g=this.g,lines=[];g.lineCap='round';g.lineJoin='round';
  for(let i=0;i<96;i++){
   const pts=[];let z=0;for(let j=0;j<=192;j++){const p=this.project(this.world(i,j/192,st),st);pts.push(p);z+=p[2];}
   lines.push({i,pts,z:z/193});
  }
  lines.sort((a,b)=>a.z-b.z);
  // Filled translucent ribbons give the trace a body, while the small bright
  // contour retains a readable silhouette at a distance.
  for(const line of lines){
   const {i,pts,z}=line,sty=this.strandStyle(i,st,z);
   if(st.paper>.04&&st.paper<.96)this.strokeLine(pts,[0,0,0],Math.sin(st.paper*Math.PI)*.36,3.4);
   if(i%4===0&&i<95){
    const p2=[];for(let j=192;j>=0;j--)p2.push(this.project(this.world(i+1,j/192,st),st));
    g.beginPath();[...pts,...p2].forEach((p,j)=>g[j?'lineTo':'moveTo'](p[0],p[1]));g.closePath();g.fillStyle=rgba(sty.col,sty.alpha*.09);g.fill();
   }
   this.strokeLine(pts,sty.col,sty.alpha,sty.width,i%12===0);
   // Short highlights follow each strand, rather than making the whole object
   // blink. Different offsets show direction and preserve the dark structure.
   const head=(st.t*.065+i*.039)%1,start=Math.floor(head*170);
   if(i%4===0)this.strokeLine(pts.slice(start,start+13),blend(sty.col,ivory,.45),sty.alpha*.78,1.7);
   for(const e of this.activeNotes||[]){if(e.strand!==i)continue;const age=st.t-e.time,index=Math.floor(clamp(age/.65)*185);this.strokeLine(pts.slice(Math.max(0,index-13),index+3),ivory,(1-age/.8)*.9,3,true);const P=pts[index];this.glow(P[0],P[1],24,sty.col,(1-age/.8)*.7);}
  }
  this.lines=lines;
 }
 drawSutures(st){
  // Sparse transverse stitches make the unfolding loops read as a fabric.
  const a=ramp(14.5,21,st.t)*(1-ramp(28,31,st.t))+ramp(44,49,st.t)*(1-ramp(58,61,st.t));
  if(a<=0)return;
  for(let j=0;j<48;j++){
   const pts=[];for(let i=0;i<96;i+=2)pts.push(this.project(this.world(i,j/48,st),st));
   this.strokeLine(pts,j%3===0?gold:teal,a*(st.quiet?.07:.15),.7);
  }
 }
 sourceOrbs(st){
  const t=st.t;
  if(t<17.5){
   const a=1-ramp(12,17.5,t),p=this.project([0,0,0],st);this.glow(p[0],p[1],80+st.p0*90,coral,a*(.45+st.p0*.5));
  }
  const pair=ramp(27.5,30,t)*(1-ramp(37.5,41,t));
  if(pair>0)for(let k=0;k<2;k++){const p=this.project([k?410:-410,0,0],st);this.glow(p[0],p[1],65+(k?st.p1:st.p0)*70,k?teal:coral,pair*.9);}
  // In the quiet passage the established threads stay visible. One returning
  // impulse travels along strand 45; its arrival time is also in the score.
  if(t>=47.5&&t<=58){
   const u=mix(.93,.08,ramp(55,57.5,t)),p=this.project(this.world(45,u,st),st);
   const gain=ramp(53.8,55,t)*(1-ramp(57.5,58,t));
   this.glow(p[0],p[1],64,blend(teal,gold,ramp(56,57.5,t)),gain);
   if(t>=55){const trail=[];for(let j=0;j<22;j++)trail.push(this.project(this.world(45,clamp(u+j*.005),st),st));this.strokeLine(trail,gold,gain*.85,2.4,true);}
  }
 }
 network(st){
  const t=st.t,a=(t>=NODE_TIMES[0]?1:0)*(1-ramp(80,83,t));if(a<=0)return;
  const enter=ramp(64,70.5,t),nodes=[];
  for(let k=0;k<9;k++){
   const w=nodeWorld(k,t),start=[Math.cos(k/9*TAU)*300,Math.sin(k/9*TAU)*220,0];
   const p=this.project(w.map((v,j)=>mix(start[j],v,enter)),st);nodes.push(p);
  }
  for(const {from:k,to:j,step,time} of CONNECTIONS){
   const growth=ramp(time,time+.625,t),ap=(growth>0?a:0);
   const A=nodes[k],B=nodes[j],pts=[];
   for(let q=0;q<=64;q++){const u=q/64*growth,ar=Math.sin(u*Math.PI)*(step===1?18:70);pts.push([mix(A[0],B[0],u),mix(A[1],B[1],u)-ar,0]);}
   this.strokeLine(pts,k%2?teal:gold,ap*(step===1?.64:.30),step===1?2.2:1.3);
   // Each established connection carries several voices. Their parallel
   // curves create a woven interior, introduced only after the returning beat.
   for(let rib=-4;rib<=4;rib++)if(rib){const cable=pts.map((p,j)=>[p[0]+Math.sin(j/64*Math.PI)*rib*4,p[1]+Math.sin(j/64*Math.PI)*rib*7,0]);this.strokeLine(cable,k%2?teal:coral,ap*.16,.8);}
   const u=(t*.32-k*.07)%1;if(u>=0){const idx=Math.floor(u*64),P=pts[idx];this.glow(P[0],P[1],17,k%2?teal:coral,ap*.65);}
  }
  for(let k=0;k<9;k++){
   const active=ramp(NODE_TIMES[k],NODE_TIMES[k]+.025,t)*a,P=nodes[k],birth=Math.exp(-Math.max(0,t-NODE_TIMES[k])/.44);
   this.glow(P[0],P[1],46+st.p0*44+birth*66,k%2?teal:coral,active*.95);
  }
 }
 lettering(st){
  const c=this.ctx,{t,chapter}=st,ch=CHAPTERS[chapter],lt=t-ch.start;
  const ink=blend(ivory,[57,38,25],st.paper),caption=blend(gold,[109,64,32],st.paper);
  const a=ramp(.75,1.6,lt)*(1-ramp(4.5,5.3,lt));
  c.save();c.textBaseline='middle';c.textAlign='left';
  // Chapter words are restrained, stable reading anchors. Large calligraphy
  // appears only where the composition has deliberately made room for it.
  if(chapter<8&&a>0){
   c.fillStyle=rgba(caption,a*.78);c.font='18px "Times New Roman", serif';c.letterSpacing='4px';c.fillText(`${String(chapter+1).padStart(2,'0')}  /  ${ch.en}`,92,88);
   c.letterSpacing='8px';c.font='36px "Microsoft YaHei", sans-serif';c.fillStyle=rgba(ink,a*.93);c.fillText(ch.zh,92,140);c.letterSpacing='0px';
   c.strokeStyle=rgba(gold,a*.45);c.lineWidth=1;c.beginPath();c.moveTo(92,180);c.lineTo(218,180);c.stroke();
  }
  const phrases=[
   [3.75,6.6,'每一次，都留下形状。'],[11,15.6,'时间，把脉动织成了线。'],
   [30.75,35.4,'你有你的节律。'],[49,53.8,'停下来，才能听见。'],
   [59,63,'回声，也会成为起点。'],[73,77.5,'不同的心跳，共同呼吸。']
  ];
  for(const [start,end,txt]of phrases){const v=ramp(start,start+.8,t)*(1-ramp(end-.6,end,t));if(!v)continue;
   if(st.paper<.1){const shadow=c.createLinearGradient(0,925,0,H);shadow.addColorStop(0,'rgba(5,9,14,0)');shadow.addColorStop(1,`rgba(5,9,14,${v*.55})`);c.fillStyle=shadow;c.fillRect(0,925,W,155);}
   c.textAlign='center';c.font='38px "Microsoft YaHei", sans-serif';c.letterSpacing='3px';c.fillStyle=rgba(ink,v*.94);c.fillText(txt,W/2,1008);c.letterSpacing='0px';
  }
  const memory=ramp(10,11.5,t)*(1-ramp(16,17.3,t));
  if(memory>0){
   c.textAlign='left';c.fillStyle=rgba([64,38,22],memory*.86);c.font='124px "SimSun", serif';c.fillText('余',172,420);c.fillText('痕',172,565);
   // Every notch corresponds to a past primary heartbeat, retained as an
   // accumulating record while the same rings rise into depth on the right.
   const hits=HEARTS.filter(e=>e.voice==='heart'&&e.amp>.5&&e.time<t).slice(-12);
   hits.forEach((e,k)=>{const x=173+k*18;c.fillStyle=rgba([91,50,27],memory*.6);c.fillRect(x,694-((e.time*1.3)%1)*45,3,18+((e.time*1.3)%1)*45);});
   c.font='18px "Times New Roman", serif';c.letterSpacing='3px';c.fillText('A HISTORY OF BEATS',170,756);c.letterSpacing='0px';
  }
  if(t>=82){
   const v=ramp(82,84,t)*(1-ramp(88.8,90,t));
   c.textAlign='center';c.font='200px "SimSun", "Noto Serif CJK SC", serif';c.letterSpacing='35px';c.fillStyle=rgba(ivory,v);c.fillText('心跳',W/2+18,490);
   c.letterSpacing='13px';c.font='30px "Times New Roman", serif';c.fillStyle=rgba(gold,v*.9);c.fillText('HEARTBEAT',W/2+6,644);
   const shade=c.createLinearGradient(0,925,0,H);shade.addColorStop(0,'rgba(5,9,14,0)');shade.addColorStop(1,`rgba(5,9,14,${v*.70})`);c.fillStyle=shade;c.fillRect(0,925,W,155);
   c.letterSpacing='3px';c.font='34px "Microsoft YaHei", sans-serif';c.fillStyle=rgba(ivory,v*.94);c.fillText('从一次脉动，到共同呼吸',W/2,1008);c.letterSpacing='0px';
  }
  c.restore();
 }
 render(t,{text=true,applyFade=true}={}){
  const st=stateAt(t);this.activeNotes=this.notes.filter(e=>t>=e.time&&t<e.time+.8);this.background(st);const g=this.g,c=this.ctx;g.clearRect(0,0,W,H);
  this.drawStrands(st);this.drawSutures(st);this.network(st);this.sourceOrbs(st);
  // Bloom is computed from the actual geometry layer, then the sharp contours
  // are composited above it. Typography is added afterward.
  this.hc.clearRect(0,0,W/4,H/4);this.hc.drawImage(this.layer,0,0,W/4,H/4);
  c.save();c.globalCompositeOperation='screen';c.filter='blur(13px)';c.globalAlpha=.44*(1-st.paper);c.drawImage(this.halo,0,0,W,H);c.filter='none';c.globalCompositeOperation='source-over';c.globalAlpha=1;c.drawImage(this.layer,0,0);c.globalCompositeOperation='screen';c.globalAlpha=(1-st.paper)*.28;c.drawImage(this.layer,0,0);c.restore();
  c.save();c.fillStyle=this.pattern;c.globalAlpha=.40;c.translate(Math.floor(t*24)%19,Math.floor(t*17)%23);c.fillRect(-24,-24,W+48,H+48);c.restore();
  const v=c.createRadialGradient(W/2,H/2,250,W/2,H/2,1150);v.addColorStop(0,'rgba(0,0,0,0)');v.addColorStop(1,`rgba(0,0,0,${.47-st.paper*.27})`);c.fillStyle=v;c.fillRect(0,0,W,H);
  if(text)this.lettering(st);
  const fade=ramp(0,.6,t)*(1-ramp(88.4,90,t));if(applyFade&&fade<1){c.fillStyle=`rgba(4,7,10,${1-fade})`;c.fillRect(0,0,W,H);}
  return st;
 }
}

const canvas=typeof document==='undefined'?null:document.querySelector('#film');
if(canvas){
 const film=new HeartbeatFilm(canvas),acc=offscreen(W,H),ac=acc.getContext('2d',{alpha:false});
 window.heartbeat={ready:true,render:t=>film.render(t),stateAt,duration:DURATION,events:EVENTS,
  frame(t,fps=30,samples=2){
   if(samples===1)return film.render(t);
   ac.globalCompositeOperation='source-over';ac.globalAlpha=1;ac.fillStyle='#000';ac.fillRect(0,0,W,H);ac.globalCompositeOperation='lighter';ac.globalAlpha=1/samples;
   const st=stateAt(t);
   for(let i=0;i<samples;i++){
    let tk=clamp(t+((i+.5)/samples-.5)*.5/fps,0,DURATION);
    if(stateAt(tk).chapter!==st.chapter)tk=t;
    film.render(tk,{text:false,applyFade:false});ac.drawImage(canvas,0,0);
   }
   film.ctx.drawImage(acc,0,0);film.lettering(st);
   // Text is composited after temporal sampling. It follows the final fade.
   const fade=ramp(0,.6,t)*(1-ramp(88.4,90,t));if(fade<1){film.ctx.fillStyle=`rgba(4,7,10,${1-fade})`;film.ctx.fillRect(0,0,W,H);}
   return st;
  }
 };film.render(5);
}
