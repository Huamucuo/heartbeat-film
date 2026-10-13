import {clamp,hash,mix,ramp,rgb,blend} from './drawing.mjs';
import {STOP_TIME,HEART_OUTLINE,codePulse,codeECG} from './code-direction.mjs';

// All geometry is original 2D ink. Architectural bays, branch nodes, and
// crystallised limbs retain their identity as the living backdrop withers.
const COOL=[112,174,181],WARM=[224,185,133],ASH=[105,129,146];
const CORAL=[245,153,128],PALE=[240,217,173];
const TAU=Math.PI*2;
function line(c,p,col,a=.2,w=1,close=false){
 if(a<.001||p.length<2)return;
 c.beginPath();p.forEach((q,i)=>c[i?'lineTo':'moveTo'](q[0],q[1]));
 if(close)c.closePath();c.strokeStyle=rgb(col,a);c.lineWidth=w;c.stroke();
}
function bezier(a,b,d,e,n=36){return Array.from({length:n+1},(_,i)=>{
 const u=i/n,v=1-u;return[v*v*v*a[0]+3*v*v*u*b[0]+3*v*u*u*d[0]+u*u*u*e[0],v*v*v*a[1]+3*v*v*u*b[1]+3*v*u*u*d[1]+u*u*u*e[1]];
});}
function box(c,x,y,w,h,col,a,lw=.7){line(c,[[x,y],[x+w,y],[x+w,y+h],[x,y+h]],col,a,lw,true);}
function ring(c,x,y,rx,ry,col,a,w=.7){c.beginPath();c.ellipse(x,y,rx,ry,0,0,TAU);c.strokeStyle=rgb(col,a);c.lineWidth=w;c.stroke();}

// Overlapping districts have three distances, but never three shared shelf
// baselines. The foreground buildings terminate along one continuous street.
const BLOCKS=[];
for(let side=0;side<2;side++)for(let row=0;row<3;row++)for(let j=0;j<[6,5,6][row];j++){
 const k=side*137+row*23+j*7;
 const width=[46,72,57][row]+hash(k+2)*[31,41,37][row];
 const height=[100,211,207][row]+hash(k+9)*[111,118,153][row];
 const local=24+j*[94,118,101][row]+hash(k+33)*21;
 const x=side?1920-local-width:local;
 const base=row===0?344+hash(k+17)*47:row===1?627+hash(k+17)*64:868+hash(k+17)*20;
 BLOCKS.push({x,y:base-height,w:width,h:height,side,row,seed:k,cols:3+Math.floor(width/28),floors:4+Math.floor(height/27),distance:[.48,.72,1][row]});
}
const TWIGS=[];
function grow(x,y,ang,len,depth,seed){
 const bx=x+Math.cos(ang)*len,by=y+Math.sin(ang)*len;
 const bend=(hash(seed+4)-.5)*len*.15;
 const pts=bezier([x,y],[x+Math.cos(ang)*len*.38+bend,y+Math.sin(ang)*len*.3],[bx-bend,by+len*.12],[bx,by],12);
 TWIGS.push({pts,end:[bx,by],ang,len,depth,seed});
 if(depth>0){
  grow(bx,by,ang-.42-hash(seed+6)*.18,len*.66,depth-1,seed*3+11);
  grow(bx,by,ang+.44+hash(seed+9)*.13,len*.62,depth-1,seed*3+17);
 }
}
grow(150,883,-1.3,122,4,5);grow(1740,883,-1.9,127,4,13);
grow(580,944,-1.95,91,3,41);grow(1350,940,-1.3,88,3,57);

// This is a drafted six-way vascular skeleton, not a copied snowflake: each
// rib has staggered capillary forks and a small architectural diamond joint.
const CRYSTAL=[];
for(let arm=0;arm<6;arm++){
 const angle=-Math.PI/2+arm*Math.PI/3;
 const polar=(r,off=0)=>[960+Math.cos(angle+off)*r,524+Math.sin(angle+off)*r*.88];
 const from=polar(180),to=polar(850);CRYSTAL.push({p:[from,to],depth:0,arm});
 for(let joint=0;joint<6;joint++){
  const r=326+joint*79,origin=polar(r),len=112-joint*11;
  for(const sign of [-1,1]){
   const a=angle+sign*Math.PI/3;
   const tip=[origin[0]+Math.cos(a)*len,origin[1]+Math.sin(a)*len*.88];
   CRYSTAL.push({p:[origin,tip],depth:1,arm});
   for(let fork=1;fork<4;fork++){
    const q=fork/4,base=[mix(origin[0],tip[0],q),mix(origin[1],tip[1],q)];
    const f=a-sign*.87,l=(1-q)*len*.38;
    CRYSTAL.push({p:[base,[base[0]+Math.cos(f)*l,base[1]+Math.sin(f)*l*.88]],depth:2,arm});
   }
  }
  const p=polar(r),v=5+joint*.35;
  CRYSTAL.push({p:[[p[0]-v,p[1]],[p[0],p[1]-v],[p[0]+v,p[1]],[p[0],p[1]+v],[p[0]-v,p[1]]],depth:2,arm});
 }
}

function architecturalCity(c,t,wilt){
 for(const b of BLOCKS){
  const col=blend(b.row===1?WARM:COOL,ASH,wilt);
  const edge=(.105+.055*(1-wilt))*b.distance,x=b.x,y=b.y;
  box(c,x,y,b.w,b.h,col,edge,.85);
  box(c,x+6,y+7,b.w-12,b.h-7,col,edge*.46,.6);
  line(c,[[x-4,y+b.h],[x+b.w+5,y+b.h]],col,edge*1.1,.8);
  const roof=5+hash(b.seed+19)*17;
  line(c,[[x+12,y],[x+12,y-roof],[x+b.w-13,y-roof],[x+b.w-13,y]],col,edge*.75,.65);
  for(let floor=0;floor<b.floors;floor++)for(let j=0;j<b.cols;j++){
   const id=b.seed*73+floor*17+j,wx=x+9+j*(b.w-14)/b.cols,wy=y+17+floor*(b.h-20)/b.floors;
   const ww=(b.w-19)/b.cols-7,hh=Math.max(4,(b.h-24)/b.floors-10);
   const extinction=ramp(187+hash(id+10)*3.1,190.8+hash(id+14)*2.7,t);
   const occupied=hash(id+37)>.25;
   const breath=.82+.18*Math.sin(t*.53+hash(id+2)*TAU);
   box(c,wx,wy,ww,hh,col,.08*b.distance,.5);
   if(occupied&&extinction<.999){
    c.fillStyle=rgb(WARM,(1-extinction)*(.08+hash(id+5)*.12)*breath*1.35*b.distance);
    c.fillRect(wx+.5,wy+.5,ww-1,hh-1);
    line(c,[[wx,wy+hh],[wx+ww,wy+hh]],WARM,(1-extinction)*.2565*b.distance,.6);
   }
  }
 }
 // Nested street conduits link the elevations. Their tracked travelling marks
 // slow and finally stop instead of becoming a cloud of decorative particles.
 const span=6.7,elapsed=Math.max(0,t-186.8),u=clamp(elapsed/span);
 const travelled=16*(t-173)-14*(span*(u**3-.5*u**4)+Math.max(0,elapsed-span));
 for(let side=0;side<2;side++)for(let i=0;i<7;i++){
  const left=side===0,x0=left?18:1902,x1=left?623:1297;
  const y=350+i*86,turn=left?572-i*18:1348+i*18;
  const p=[[x0,y],[turn,y],[turn,y+28],[x1,y+28]];
  line(c,p,COOL,.075,.65);
  c.save();c.setLineDash([15,230]);c.lineDashOffset=-travelled-i*33;
  line(c,p,blend(WARM,ASH,wilt),.20*(1-wilt)+.028,.9);c.restore();
 }
 // Pavements unify both halves without crossing the ECG's reserved band.
 for(let lane=0;lane<3;lane++){
  const y=887+lane*7,p=bezier([0,y+9],[600,y-15],[1370,y-15],[1920,y+9],96);
  line(c,p,blend(COOL,ASH,wilt),lane===0?.18:.085,lane===0?1:.65);
  if(lane===1){c.save();c.setLineDash([30,235]);c.lineDashOffset=-travelled;line(c,p,WARM,.18*(1-wilt)+.025,.85);c.restore();}
 }
 for(const b of BLOCKS)if(b.row===2){
  const x=b.x+b.w*.5;line(c,[[x,b.y+b.h],[x,883],[x+11,890]],ASH,.085,.6);
 }
}
function foliage(c,t,wilt){
 for(const b of TWIGS){
  const thick=.4+b.depth*.25;
  line(c,b.pts,blend(COOL,ASH,wilt),.12+.105*wilt,thick);
  if(b.depth!==0)continue;
  const onset=187.1+hash(b.seed)*3.1,fold=ramp(onset,onset+2.1,t);
  const living=1-fold;
  for(const side of [-1,1]){
   const a=b.ang+side*.72,le=11+hash(b.seed+side)*7;
   const base=[b.end[0],b.end[1]],fall=fold*fold*(9+hash(b.seed+2)*19);
   const tip=[base[0]+Math.cos(a)*le,base[1]+Math.sin(a)*le+fall];
   const mid=[mix(base[0],tip[0],.5),mix(base[1],tip[1],.5)];
   const wide=(2.6+hash(b.seed+5)*2.8)*living;
   const pp=[base,[mid[0]+Math.cos(a+Math.PI/2)*wide,mid[1]+Math.sin(a+Math.PI/2)*wide],tip,[mid[0]-Math.cos(a+Math.PI/2)*wide,mid[1]-Math.sin(a+Math.PI/2)*wide]];
   line(c,pp,blend([151,198,156],ASH,fold),.10+.17*living,.65,true);
   if(living>.2){c.beginPath();pp.forEach((p,i)=>c[i?'lineTo':'moveTo'](...p));c.closePath();c.fillStyle=rgb(COOL,.025*living);c.fill();}
  }
 }
}
export function endingBackdrop(c,time,alpha=1){
 if(alpha<=0)return;const t=Math.min(time,STOP_TIME),wilt=ramp(186.8,193.5,t);
 c.save();c.globalAlpha*=clamp(alpha);c.lineCap='round';c.lineJoin='round';
 // The exclusion follows the organ, so the six ribs reach its silhouette
 // rather than ending together on an invisible, much wider ellipse.
 const boundary=(1+.09*codePulse(t))*1.045;
 c.beginPath();c.rect(0,0,1920,1080);
 HEART_OUTLINE.forEach((p,i)=>c[i?'lineTo':'moveTo'](960+p[0]*boundary,520+p[1]*boundary));c.closePath();c.clip('evenodd');
 architecturalCity(c,t,wilt);foliage(c,t,wilt);
 const crystal=ramp(186.8,193.5,t);
 for(let i=0;i<CRYSTAL.length;i++){
  const s=CRYSTAL[i],build=ramp(187.1+s.depth*.65+s.arm*.045,190.5+s.depth*.98,t);
  if(build<=0)continue;
  const p=s.p.map((v,j)=>j===0?v:[mix(s.p[0][0],v[0],build),mix(s.p[0][1],v[1],build)]);
  line(c,p,blend(COOL,PALE,.35),crystal*[.32,.225,.16][s.depth],[1.05,.8,.65][s.depth]);
 }
 // Four grafts visibly share a street/building corner with the crystal.
 // Those connections turn the city into the same dying structure as the ribs.
 for(const arm of [1,2,4,5]){
  const angle=-Math.PI/2+arm*Math.PI/3,p=[960+Math.cos(angle)*625,524+Math.sin(angle)*625*.88];
  const candidates=BLOCKS.filter(b=>(p[0]<960?b.side===0:b.side===1));
  let best=null,distance=Infinity;
  for(const b of candidates)for(const corner of [[b.x,b.y],[b.x+b.w,b.y],[b.x,b.y+b.h],[b.x+b.w,b.y+b.h]]){
   const d=Math.hypot(corner[0]-p[0],corner[1]-p[1]);if(d<distance){distance=d;best=corner;}
  }
  if(best)line(c,[p,[p[0],best[1]],best],blend(COOL,PALE,.22),crystal*.19,.75);
 }
 // A few broad cartographic arcs connect both halves of the composition;
 // they are static paths, preserving visual hierarchy around the heart.
 for(let i=0;i<5;i++){
  const yy=68+i*14;
  line(c,bezier([20,yy+33],[530,yy-26],[1410,yy-25],[1900,yy+32],80),COOL,.04+.035*crystal,.55);
  line(c,bezier([24,1009+i*11],[640,954+i*9],[1300,959+i*9],[1897,1009+i*11],80),COOL,.04+.035*crystal,.55);
 }
 c.restore();
}

const VESSELS=[
 // Aortic arch, pulmonary outflow, and returning veins.
 {p:bezier([-37,-122],[-103,-246],[-44,-311],[60,-263]),a:.64,w:2.2},
 {p:bezier([60,-263],[103,-250],[104,-219],[115,-172]),a:.62,w:2.0},
 {p:bezier([-17,-120],[-58,-224],[-9,-274],[58,-243]),a:.42,w:1.25},
 {p:bezier([58,-243],[82,-225],[84,-198],[83,-173]),a:.4,w:1.25},
 {p:bezier([-16,-262],[-15,-284],[-17,-292],[-11,-305]),a:.57,w:1.7},
 {p:bezier([12,-267],[12,-290],[17,-295],[21,-309]),a:.55,w:1.7},
 {p:bezier([38,-262],[40,-281],[52,-290],[55,-301]),a:.53,w:1.7},
 {p:bezier([-67,-156],[22,-216],[144,-216],[171,-157]),a:.57,w:1.8},
 {p:bezier([-61,-133],[29,-186],[133,-186],[162,-141]),a:.35,w:1.1},
 {p:bezier([-164,-172],[-155,-202],[-156,-235],[-153,-266]),a:.44,w:1.55},
 {p:bezier([-137,-177],[-128,-211],[-132,-239],[-129,-266]),a:.34,w:1.1},
 {p:bezier([153,-99],[190,-124],[207,-113],[237,-124]),a:.40,w:1.45},
 {p:bezier([155,-75],[199,-85],[212,-70],[239,-81]),a:.35,w:1.15},
 // The anterior interventricular groove and coronary branches.
 {p:bezier([5,-134],[-19,-36],[48,58],[40,152]),a:.57,w:1.65},
 {p:bezier([40,152],[37,203],[14,247],[-19,283]),a:.54,w:1.35},
 {p:bezier([-2,-84],[-69,-55],[-118,-74],[-182,-103]),a:.40,w:1.2},
 {p:bezier([-53,-65],[-73,-25],[-114,5],[-162,32]),a:.30,w:.85},
 {p:bezier([-73,-27],[-97,-7],[-112,40],[-133,69]),a:.27,w:.7},
 {p:bezier([4,-27],[72,-59],[126,-37],[184,-24]),a:.4,w:1.15},
 {p:bezier([61,-47],[71,-15],[112,2],[142,44]),a:.29,w:.85},
 {p:bezier([28,49],[-43,23],[-103,84],[-115,124]),a:.36,w:1.1},
 {p:bezier([-29,52],[-47,96],[-67,121],[-62,166]),a:.28,w:.8},
 {p:bezier([41,114],[104,89],[136,120],[143,145]),a:.34,w:1.05},
 {p:bezier([74,111],[95,153],[83,183],[84,214]),a:.27,w:.8},
 {p:bezier([26,206],[-14,166],[-45,189],[-53,222]),a:.29,w:.85}
];
const PIPES=[
 {p:bezier([-149,-174],[-141,-212],[-145,-239],[-141,-266]),r:10,a:.46,w:1.25},
 {p:bezier([155,-96],[190,-120],[209,-110],[237,-124]),r:7,a:.43,w:1.15},
 {p:bezier([155,-73],[197,-87],[216,-70],[239,-81]),r:6,a:.38,w:1.1},
 {p:bezier([-65,-145],[24,-202],[140,-198],[167,-150]),r:10,a:.50,w:1.55},
 {p:[...bezier([-29,-134],[-81,-235],[-33,-290],[59,-253]),...bezier([59,-253],[91,-237],[92,-207],[100,-173]).slice(1)],r:13,a:.68,w:1.85},
 {p:bezier([-15,-264],[-16,-283],[-17,-293],[-11,-305]),r:6,a:.59,w:1.45},
 {p:bezier([12,-268],[12,-287],[17,-298],[21,-309]),r:6,a:.59,w:1.45},
 {p:bezier([38,-261],[41,-279],[52,-290],[55,-301]),r:6,a:.57,w:1.4}
];
function draftedPipe(c,v,col,pulse){
 const left=[],right=[],normals=[];
 for(let i=0;i<v.p.length;i++){
  const a=v.p[Math.max(0,i-1)],b=v.p[Math.min(v.p.length-1,i+1)],dx=b[0]-a[0],dy=b[1]-a[1],len=Math.hypot(dx,dy)||1;
  const normal=[-dy/len,dx/len],r=v.r*mix(1.1,.88,i/(v.p.length-1)),p=v.p[i];
  normals.push({normal,r});left.push([p[0]+normal[0]*r,p[1]+normal[1]*r]);right.push([p[0]-normal[0]*r,p[1]-normal[1]*r]);
 }
 line(c,left,col,v.a*(.95+.05*pulse),v.w);
 line(c,right,col,v.a*.84,v.w*.8);
 const slices=v.p.length>45?[.19,.4,.64,.85,1]:[.24,.62,1];
 for(const f of slices){
  const i=Math.round(f*(v.p.length-1)),p=v.p[i],{normal,r}=normals[i],a=[p[0]+normal[0]*r,p[1]+normal[1]*r],b=[p[0]-normal[0]*r,p[1]-normal[1]*r];
  const bend=[-normal[1]*r*.36,normal[0]*r*.36];
  line(c,bezier(a,[mix(a[0],b[0],.3)+bend[0],mix(a[1],b[1],.3)+bend[1]],[mix(a[0],b[0],.7)+bend[0],mix(a[1],b[1],.7)+bend[1]],b,12),col,v.a*(f===1?.70:.31),.6);
  if(f===1)line(c,bezier(a,[mix(a[0],b[0],.3)-bend[0],mix(a[1],b[1],.3)-bend[1]],[mix(a[0],b[0],.7)-bend[0],mix(a[1],b[1],.7)-bend[1]],b,12),col,v.a*.4,.55);
 }
}
export function heartStructure(c,time,alpha=1){
 if(alpha<=0)return;const t=Math.min(time,STOP_TIME),pulse=codePulse(t),scale=1+.09*pulse;
 const weakness=ramp(186,194.5,t),col=blend(CORAL,[182,151,139],weakness*.58);
 c.save();c.globalAlpha*=clamp(alpha);c.translate(960,520);c.scale(scale,scale);c.lineCap='round';c.lineJoin='round';
 line(c,HEART_OUTLINE,col,.68+Math.min(.16,pulse*.2),1.6,true);
 // Secondary contour follows the same organ without giving it a plastic fill.
 line(c,HEART_OUTLINE.map(p=>[p[0]*.984,p[1]*.987+1.5]),PALE,.13,.6,true);
 c.save();c.beginPath();HEART_OUTLINE.forEach((p,i)=>c[i?'lineTo':'moveTo'](...p));c.closePath();c.clip();
 for(let i=0;i<20;i++){
  const y=-226+i*26;
  line(c,bezier([-231,y+38],[-69,y-12],[126,y+52],[231,y-14],42),blend(COOL,col,.4),.06+(i%3===0?.025:0),.55);
 }
 for(let i=0;i<9;i++){
  const x=-176+i*45;
  line(c,bezier([x,-260],[x-97,-30],[x+65,172],[x-26,315],48),col,.033,.45);
 }
 c.restore();
 for(const v of PIPES)draftedPipe(c,v,PALE,pulse);
 for(const v of VESSELS.slice(13)){
  line(c,v.p,v.a>.5?PALE:col,v.a*(.94+.06*pulse),v.w);
 }
 // Minute conducting segments travel along vessels while life is present.
 // Their motion shares STOP_TIME with the physical organ and the audio.
 if(t<STOP_TIME)for(let k=12;k<VESSELS.length;k+=3){
  const p=VESSELS[k].p,n=p.length-1,q=((t*.41+k*.071)%1)*n,at=Math.floor(q);
  if(at<n-1)line(c,p.slice(at,Math.min(n+1,at+3)),PALE,.18+pulse*.24,1.3);
 }
 c.restore();
}
export function endingECG(c,time,alpha=1){
 if(alpha<=0)return;const t=Math.min(time,STOP_TIME),stopped=time>=STOP_TIME;
 const x=520,y=930,width=880,n=440,window=4.2,points=[],amplitude=1-ramp(193.86,STOP_TIME,t);
 for(let i=0;i<=n;i++){const age=(1-i/n)*window;points.push([x+i/n*width,y-codeECG(t-age)*49*amplitude]);}
 c.save();c.globalAlpha*=clamp(alpha);c.lineCap='round';
 line(c,[[x,y],[x+width,y]],COOL,.055,.7);
 line(c,points,stopped?[177,154,136]:CORAL,stopped?.56:.75,1.15);
 const p=points[points.length-1];c.fillStyle=rgb(PALE,stopped?.4:.85);c.beginPath();c.arc(p[0],p[1],stopped?1.3:1.65,0,TAU);c.fill();
 c.restore();
}
