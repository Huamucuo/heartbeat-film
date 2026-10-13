import {hash,clamp,ramp,mix} from './drawing.mjs';
import {record} from './heart-records.mjs';
import {COLS,ORIGIN_CELL,pathBetween} from './maze-world.mjs';

export const STOP_TIME=194.5;
const lengths=Array.from({length:72},(_,i)=>2.1*Math.exp(-i*.095)+.30);
const total=lengths.reduce((a,b)=>a+b,0);let clock=66;
export const RETURN_RUNS=lengths.map((v,i)=>{
 const start=clock;clock+=v/total*55;
 const targets=[ORIGIN_CELL,...Array.from({length:2+i%3},(_,j)=>{
  const x=1+Math.floor(hash(i*107+j*19+71)*29),y=1+Math.floor(hash(i*83+j*41+231)*21);return y*COLS+x;
 }),ORIGIN_CELL],route=[ORIGIN_CELL];
 for(let k=1;k<targets.length;k++)route.push(...pathBetween(targets[k-1],targets[k]).slice(1));
 return {index:i,start,end:clock,route,color:i%3};
});
export function returnAt(t){
 let i=RETURN_RUNS.findIndex(r=>t<r.end);if(i<0)i=RETURN_RUNS.length-1;
 const r=RETURN_RUNS[i];return {...r,u:clamp((t-r.start)/(r.end-r.start)),completed:RETURN_RUNS.filter(s=>t>=s.end).length};
}

export const MAZE_BEATS=record(0).beats.filter(b=>b.time>=98&&b.time<131).map(b=>({
 time:b.time,strength:mix(.22,.50,ramp(98,125,b.time))*b.height,freq:mix(54,42,ramp(98,125,b.time)),width:b.width,second:.15+b.width
}));
export const LIFE_BEATS=record(0).beats.filter(b=>b.time>=131&&b.time<182).map(b=>({
 time:b.time,strength:mix(.28,.94,ramp(131,181,b.time))*b.height,freq:mix(59,33,ramp(131,181,b.time)),width:b.width,second:.15+b.width
}));
const endings=[182.18,183.02,183.88,184.78,185.76,186.86,188.10,189.46,190.97,192.58,193.86];
export const END_BEATS=endings.map((time,i)=>({time,strength:mix(.93,.045,(i/(endings.length-1))**1.18),freq:33-i*.45,width:.029+i*.001,second:.16}));
export const CODE_BEATS=[...MAZE_BEATS,...LIFE_BEATS,...END_BEATS];
export function codePulse(t){if(t>=STOP_TIME)return 0;let p=0;for(const b of CODE_BEATS){const age=t-b.time;if(age<0)break;if(age<.85)p+=b.strength*(1-Math.exp(-age/.013))*Math.exp(-age/.16);const a=age-b.second;if(a>0&&a<.7)p+=b.strength*.38*(1-Math.exp(-a/.018))*Math.exp(-a/.12);}return p;}
export function codeECG(t){if(t>=STOP_TIME)return 0;let y=0;for(const b of CODE_BEATS){const x=t-b.time;if(x<-.35)break;if(x>.6)continue;const g=(m,s)=>Math.exp(-(((x-m)/s)**2));y+=b.strength*(.12*g(-.17,.045)-.2*g(-.043,.020)+g(0,b.width)-.34*g(.05,.026)+.18*g(.22,.07));}return y;}
export const MODULE_CENTRES=[[340,306],[960,306],[1580,306],[340,575],[960,575],[1580,575],[340,824],[960,824],[1580,824]];
export const MODULE_NAMES=['联络','工作','居所','往返','相聚','成长','照料','生日','离开'];
export const MODULE_COLORS=[[233,172,119],[183,210,218],[216,195,144],[116,217,202],[230,198,167],[143,201,189],[176,194,210],[243,166,124],[157,182,206]];
export function heartOutline(){
 const result=[],curves=[
 [[-78,-224],[-35,-280],[65,-262],[139,-190]],
 [[139,-190],[259,-88],[237,93],[106,235]],
 [[106,235],[58,296],[0,317],[-58,263]],
 [[-58,263],[-180,158],[-262,40],[-200,-108]],
 [[-200,-108],[-175,-209],[-114,-225],[-78,-224]]
 ];
 for(const [a,b,c,d] of curves)for(let j=0;j<40;j++){const u=j/40,v=1-u;result.push([v**3*a[0]+3*v*v*u*b[0]+3*v*u*u*c[0]+u**3*d[0],v**3*a[1]+3*v*v*u*b[1]+3*v*u*u*c[1]+u**3*d[1]]);}return result;
}
export const HEART_OUTLINE=heartOutline();
export function insidePolygon(x,y,poly){let yes=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[i],b=poly[j];if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])yes=!yes;}return yes;}
export const HEART_CELLS=[];
for(let y=-257;y<300;y+=12)for(let x=-245;x<245;x+=11)if(insidePolygon(x,y,HEART_OUTLINE))HEART_CELLS.push([x,y]);
export const GLITCHES=[{start:192.84,end:192.94,shift:6},{start:193.27,end:193.36,shift:-11},{start:194.02,end:194.19,shift:17}];
