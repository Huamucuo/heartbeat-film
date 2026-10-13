import {ramp,clamp,hash,mix,blend,path,text,rgb,ivory,coral,teal} from './drawing.mjs';
import {MODULE_CENTRES,MODULE_NAMES,MODULE_COLORS,HEART_CELLS,codePulse,STOP_TIME} from './code-direction.mjs';
import {codeBackground,drawProgram,glyph,curve} from './code-ink.mjs';
import {lifeProgram,LIFE_CELLS} from './code-life-programs.mjs';
import {endingBackdrop,heartStructure,endingECG,heartAssemblyPaths,cityLightDimming} from './code-ending.mjs';
const GROUPS=Array.from({length:9},()=>[]);
HEART_CELLS.forEach((p,index)=>{const id=Math.min(2,Math.max(0,Math.floor((p[0]+245)/164)))+3*Math.min(2,Math.max(0,Math.floor((p[1]+265)/189)));GROUPS[id].push({p,index});});
function stages(id,t){const a=ramp(140+id*.23,145+id*.23,t),b=ramp(156+id*.19,161+id*.19,t);return [1-a,a-b,b];}
function sourcePoint(id,j,count,t){const weights=stages(id,t);let x=0,y=0;for(let era=0;era<3;era++){const pool=LIFE_CELLS[id][era],p=pool[Math.min(pool.length-1,Math.floor(j/count*pool.length))];x+=p[0]*weights[era];y+=p[1]*weights[era];}return [MODULE_CENTRES[id][0]+x,MODULE_CENTRES[id][1]+y];}

const FAILURE_TEXT='heart attack',LIGHTS_AT_ONSET=cityLightDimming(187);
function fineDisplacement(seed,t){
 const phase=(t-187)*(7+hash(seed+17)*3)+hash(seed+31)*43,k=Math.floor(phase),u=phase-k;
 return mix(hash(seed*131+k*17)*2-1,hash(seed*131+(k+1)*17)*2-1,u*u*(3-2*u));
}
function heartFailureGlyph(c,x,y,index,target,t,color,alpha,extinction){
 const change=ramp(hash(index+613)*.94,hash(index+613)*.94+.06,extinction);
 const tremor=.9*ramp(187,189,t),dx=tremor*fineDisplacement(index+31,t),dy=tremor*fineDisplacement(index+1741,t);
 // The existing cells retain their typeface, ink and position. Only their
 // contents fail; smooth sub-pixel disturbance never moves the organ itself.
 if(change<1)glyph(c,x+dx,y+dy,index,t,color,alpha*(1-change),9.8);
 if(change>0){
  const row=Math.round((target[1]+257)/12),column=Math.round((target[0]+245)/11);
  const phase=Math.floor((t-187)*(1.2+hash(row+93)*1.4)+hash(row+4)*21);
  c.fillStyle=rgb(color,alpha*change);c.font='9.8px Consolas, monospace';c.textAlign='center';c.textBaseline='middle';
  c.fillText(FAILURE_TEXT[(column+phase)%FAILURE_TEXT.length],x+dx,y+dy);
 }
}

// Keep the identity of the actual phone, window, train, cup and other strokes.
// Three rows leave in succession; every stroke finally occupies a short piece
// of the same anatomical paths drawn by heartStructure, not a generic vortex.
function resampleStroke(points,count){
 const lengths=[0];for(let i=1;i<points.length;i++)lengths.push(lengths[i-1]+Math.hypot(points[i][0]-points[i-1][0],points[i][1]-points[i-1][1]));
 const total=lengths[lengths.length-1]||1;
 return Array.from({length:count},(_,j)=>{const d=j/(count-1)*total;let k=1;while(k<lengths.length-1&&lengths[k]<d)k++;const u=clamp((d-lengths[k-1])/(lengths[k]-lengths[k-1]||1));return [mix(points[k-1][0],points[k][0],u),mix(points[k-1][1],points[k][1],u)];});
}
const DEPARTING_STROKES=[];
for(let id=0;id<9;id++){
 const program=lifeProgram(id,2,173),[x,y]=MODULE_CENTRES[id];
 program.forEach((op,k)=>{
  // Subdivide without dropping any original vertex: a window corner or wheel
  // stays exactly itself at departure instead of popping into a new polygon.
  const points=[[op.points[0][0]+x,op.points[0][1]+y]];
  for(let i=1;i<op.points.length;i++){
   const a=op.points[i-1],b=op.points[i],steps=Math.max(1,Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/18));
   for(let j=1;j<=steps;j++)points.push([x+mix(a[0],b[0],j/steps),y+mix(a[1],b[1],j/steps)]);
  }
  DEPARTING_STROKES.push({id,k,rank:k/program.length,points,width:op.width||1,fill:op.fill});
 });
}
const TARGET_PATHS=heartAssemblyPaths().map(p=>resampleStroke(p,321));
DEPARTING_STROKES.forEach((s,index)=>{
 const family=index%TARGET_PATHS.length,slot=Math.floor(index/TARGET_PATHS.length),count=Math.ceil((DEPARTING_STROKES.length-family)/TARGET_PATHS.length),p=TARGET_PATHS[family];
 s.target=s.points.map((_,j)=>{const f=(slot+j/(s.points.length-1))/count*(p.length-1),k=Math.min(p.length-2,Math.floor(f));return [mix(p[k][0],p[k+1][0],f-k),mix(p[k][1],p[k+1][1],f-k)];});
});
function departurePhase(id,rank,t){
 const start=173+Math.floor(id/3)*1.05+(id%3)*.12+rank*.82;
 return {gather:ramp(start,start+2.25,t),spin:ramp(start+.35,start+4.1,t),land:ramp(start+2.1,start+5.1,t)};
}
function transportInk(source,target,id,phase,heartScale){
 const centre=MODULE_CENTRES[id],a=Math.atan2((centre[1]-520)/.82,centre[0]-960)+(id===4?-.6:0),turn=phase.spin*Math.PI*1.42;
 const theta=a+turn,r=310+Math.floor(id/3)*38,ox=960+Math.cos(theta)*r,oy=520+Math.sin(theta)*r*.82;
 const x=source[0]-centre[0],y=source[1]-centre[1],size=mix(1,.32,phase.gather),cs=Math.cos(turn),sn=Math.sin(turn);
 const px=mix(centre[0],ox,phase.gather)+(x*cs-y*sn)*size,py=mix(centre[1],oy,phase.gather)+(x*sn+y*cs)*size;
 return [mix(px,960+target[0]*heartScale,phase.land),mix(py,520+target[1]*heartScale,phase.land)];
}
function departingLives(c,t,heartScale){
 c.save();c.lineCap='round';c.lineJoin='round';
 for(const stroke of DEPARTING_STROKES){
  const phase=departurePhase(stroke.id,stroke.rank,t);if(phase.land>=1)continue;
  const pts=stroke.points.map((p,j)=>transportInk(p,stroke.target[j],stroke.id,phase,heartScale));
  const col=blend(MODULE_COLORS[stroke.id],coral,phase.land*.72),handoff=1-ramp(.81,1,phase.land);
  if(stroke.fill&&phase.gather<1){c.beginPath();pts.forEach((p,i)=>c[i?'lineTo':'moveTo'](...p));c.fillStyle=rgb(col,.055*(1-phase.gather));c.fill();}
  path(c,pts,col,.43*handoff,stroke.width*mix(1,.8,phase.land));
  c.setLineDash([9,39+hash(stroke.k+13)*70]);c.lineDashOffset=-t*(18+hash(stroke.k+stroke.id*17)*22)-stroke.k*27;
  c.beginPath();pts.forEach((p,i)=>c[i?'lineTo':'moveTo'](...p));c.strokeStyle=rgb(col,.76*handoff);c.lineWidth=stroke.width*1.15;c.stroke();c.setLineDash([]);
 }
 c.restore();
}
function livingThreads(c,t,gather,intro=1){
 // Three horizontal arteries and two vertical junctions make one composition.
 const intensity=.17+.13*codePulse(t),cut=(1-ramp(176,181,t))*intro;
 for(let lane=0;lane<3;lane++)for(let n=0;n<4;n++){
  const y=[440,705,947][lane]+n*4,points=[];
  for(let i=0;i<=200;i++){const x=54+i/200*1812,osc=Math.sin(x*.010-t*(.7+lane*.1))*3;points.push([x,y+osc*(1-gather)]);}
  path(c,points,[100,156,165],intensity*cut*(n===0?1:.28),n===0?1.0:.55);
  const front=((t*(110+lane*29)+lane*401)%1812)/1812;path(c,points.slice(Math.floor(front*177),Math.floor(front*177)+20),MODULE_COLORS[lane*3],.35*cut,1.2);
 }
 for(let i=0;i<8;i++){
  const a=MODULE_CENTRES[i],b=MODULE_CENTRES[i+1],across=i%3===2;
  const p=across?curve([a[0]+240,a[1]+90],[1870,a[1]+155],[65,b[1]-150],[b[0]-240,b[1]-90]):curve([a[0]+236,a[1]],[a[0]+290,a[1]-45],[b[0]-290,b[1]+45],[b[0]-236,b[1]]);
  path(c,p.points,blend(MODULE_COLORS[i],MODULE_COLORS[i+1],.5),.12*cut,.9);
  const h=((t*.22+i*.17)%1)*p.points.length,k=Math.floor(h);path(c,p.points.slice(k,Math.min(k+5,p.points.length)),ivory,.39*cut,1.1);
 }
}
export function codeLives(c,actualTime){
 if(actualTime<130.5)return;const t=Math.min(actualTime,STOP_TIME),intro=ramp(130.5,132.15,t),gather=ramp(173,182,t),p=codePulse(t),heartScale=1+.09*p;
 const failure=t>187?clamp((cityLightDimming(t)-LIGHTS_AT_ONSET)/(1-LIGHTS_AT_ONSET)):0;
 c.save();c.globalAlpha=intro;codeBackground(c,t);endingBackdrop(c,t,ramp(172,182,t));
 if(t<182){
  livingThreads(c,t,gather,intro);
  for(let id=0;id<9;id++){
   const [x,y]=MODULE_CENTRES[id],weights=stages(id,t),erase=ramp(173+id*.13,179+id*.13,t),color=MODULE_COLORS[id];
   c.save();c.translate(x,y);const build=ramp(130.45+id*.045,132.25+id*.045,t);
   for(let era=0;era<3;era++)if(weights[era]>.001){let program=lifeProgram(id,era,t);
    if(id===2){const transition=Math.sin(Math.PI*clamp((t-(era===0?140.46:156.38))/4.8));if(t<162&&transition>.001)program=program.map((op,k)=>({...op,points:op.points.map(q=>[q[0]+Math.cos(k*2.4)*transition*31,q[1]+Math.sin(k*1.7)*transition*27])}));}
    if(t<173)drawProgram(c,program,color,t,{alpha:weights[era]*intro,erase,build,offset:id*17});
   }
   c.restore();
   // Labels identify life events, not arbitrary component numbers.
   const labelOpacity=t<173?1-erase:1-ramp(173+Math.floor(id/3)*1.05,174.5+Math.floor(id/3)*1.05,t);
   text(c,MODULE_NAMES[id],x-248,y-140,19,color,intro*labelOpacity*.78,{align:'left',tracking:3});
  }
 }
 if(t>=173&&t<182.4)departingLives(c,t,heartScale);
 for(let id=0;id<9;id++){
  const cells=GROUPS[id],local=ramp(173+id*.12,181+id*.12,t),col=blend(MODULE_COLORS[id],coral,local*.73);
  for(let j=0;j<cells.length;j++){
   const {p:target,index}=cells[j],source=sourcePoint(id,j,cells.length,Math.min(t,173)),end=[960+target[0]*heartScale,520+target[1]*heartScale];
   const u=ramp(173+id*.12+hash(index)*.6,180.7+id*.12+hash(index)*.6,t),bow=Math.sin(Math.PI*u);
   let x=mix(source[0],end[0],u)+bow*(source[0]-960)*.08,y=mix(source[1],end[1],u)-bow*(45+hash(index+99)*35);
   if(t>=173)[x,y]=transportInk(source,target,id,departurePhase(id,.25+hash(index)*.45,t),heartScale);
   const tint=blend(col,ivory,.13+.27*hash(index+19)),edge=Math.min(1,Math.abs(target[0])*.002+Math.abs(target[1])*.0008);
   const alive=t<STOP_TIME?.5+.5*Math.sin(t*1.7+target[1]*.023):.55;
   const ink=mix(.24+.14*alive,.40+.34*edge+.12*p,u)*(1-ramp(189,194.5,t)*.35);
   const departure=t>=173?departurePhase(id,.25+hash(index)*.45,t):null;
   const separation=departure?1-.37*Math.sin(Math.PI*departure.land)*departure.gather:1;
   if(t>187)heartFailureGlyph(c,x,y,index,target,t,tint,intro*ink*separation,failure);
   else glyph(c,x,y,index,t,tint,intro*ink*separation,9.8);
  }
 }
 heartStructure(c,t,ramp(177,183,t));endingECG(c,t,ramp(179.5,183,t));
 c.restore();
}
