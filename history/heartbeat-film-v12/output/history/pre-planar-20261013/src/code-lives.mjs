import {ramp,clamp,hash,mix,blend,path,text,rgb,ivory,coral,teal} from './drawing.mjs';
import {MODULE_CENTRES,MODULE_NAMES,MODULE_COLORS,HEART_CELLS,codePulse,STOP_TIME} from './code-direction.mjs';
import {codeBackground,drawProgram,glyph,curve} from './code-ink.mjs';
import {lifeProgram,LIFE_CELLS} from './code-life-programs.mjs';
import {endingBackdrop,heartStructure,endingECG} from './code-ending.mjs';
const GROUPS=Array.from({length:9},()=>[]);
HEART_CELLS.forEach((p,index)=>{const id=Math.min(2,Math.max(0,Math.floor((p[0]+245)/164)))+3*Math.min(2,Math.max(0,Math.floor((p[1]+265)/189)));GROUPS[id].push({p,index});});
function stages(id,t){const a=ramp(140+id*.23,145+id*.23,t),b=ramp(156+id*.19,161+id*.19,t);return [1-a,a-b,b];}
function sourcePoint(id,j,count,t){const weights=stages(id,t);let x=0,y=0;for(let era=0;era<3;era++){const pool=LIFE_CELLS[id][era],p=pool[Math.min(pool.length-1,Math.floor(j/count*pool.length))];x+=p[0]*weights[era];y+=p[1]*weights[era];}return [MODULE_CENTRES[id][0]+x,MODULE_CENTRES[id][1]+y];}
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
 c.save();c.globalAlpha=intro;codeBackground(c,t);endingBackdrop(c,t,ramp(172,182,t));
 if(t<182){
  livingThreads(c,t,gather,intro);
  for(let id=0;id<9;id++){
   const [x,y]=MODULE_CENTRES[id],weights=stages(id,t),erase=ramp(173+id*.13,179+id*.13,t),color=MODULE_COLORS[id];
   c.save();c.translate(x,y);const build=ramp(130.45+id*.045,132.25+id*.045,t);
   for(let era=0;era<3;era++)if(weights[era]>.001){let program=lifeProgram(id,era,t);
    if(id===2){const transition=Math.sin(Math.PI*clamp((t-(era===0?140.46:156.38))/4.8));if(t<162&&transition>.001)program=program.map((op,k)=>({...op,points:op.points.map(q=>[q[0]+Math.cos(k*2.4)*transition*31,q[1]+Math.sin(k*1.7)*transition*27])}));}
    drawProgram(c,program,color,t,{alpha:weights[era]*intro,erase,build,offset:id*17});
   }
   c.restore();
   // Labels identify life events, not arbitrary component numbers.
   text(c,MODULE_NAMES[id],x-248,y-140,19,color,intro*(1-erase)*.78,{align:'left',tracking:3});
  }
 }
 for(let id=0;id<9;id++){
  const cells=GROUPS[id],local=ramp(173+id*.12,181+id*.12,t),col=blend(MODULE_COLORS[id],coral,local*.73);
  for(let j=0;j<cells.length;j++){
   const {p:target,index}=cells[j],source=sourcePoint(id,j,cells.length,Math.min(t,173)),end=[960+target[0]*heartScale,520+target[1]*heartScale];
   const u=ramp(173+id*.12+hash(index)*.6,180.7+id*.12+hash(index)*.6,t),bow=Math.sin(Math.PI*u);
   const x=mix(source[0],end[0],u)+bow*(source[0]-960)*.08,y=mix(source[1],end[1],u)-bow*(45+hash(index+99)*35);
   const tint=blend(col,ivory,.13+.27*hash(index+19)),edge=Math.min(1,Math.abs(target[0])*.002+Math.abs(target[1])*.0008);
   const alive=t<STOP_TIME?.5+.5*Math.sin(t*1.7+target[1]*.023):.55;
   const ink=mix(.24+.14*alive,.40+.34*edge+.12*p,u)*(1-ramp(189,194.5,t)*.35);
   glyph(c,x,y,index,t,tint,intro*ink,9.8);
  }
 }
 heartStructure(c,t,ramp(177,183,t));endingECG(c,t,ramp(179.5,183,t));
 c.restore();
}
