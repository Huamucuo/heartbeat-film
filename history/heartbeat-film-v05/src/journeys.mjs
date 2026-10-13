// The walks share an origin, not a trajectory. Geometry is independent of frame history.
export const ORIGIN=Object.freeze([960,515]);
const clamp=x=>Math.max(0,Math.min(1,x));
const smooth=x=>(x=clamp(x))*x*(3-2*x);
const controls=[
 [ORIGIN,[800,410],[540,445],[405,310],[620,220],[895,285],[1105,380],[1415,250],[1570,480],[1360,600],[1155,635],[1045,545],ORIGIN],
 [ORIGIN,[1090,450],[1165,270],[920,210],[690,315],[730,560],[465,690],[690,820],[1000,725],[1290,820],[1515,650],[1370,490],[1175,555],ORIGIN],
 [ORIGIN,[1160,620],[1475,760],[1680,550],[1425,320],[1145,380],[995,210],[710,190],[470,365],[615,500],[365,600],[505,780],[800,640],ORIGIN]
];
function build(points){
 const samples=[ORIGIN.slice()],lengths=[0];let length=0;
 for(let i=0;i<points.length-1;i++)for(let j=1;j<=40;j++){
  const p0=points[Math.max(0,i-1)],p1=points[i],p2=points[i+1],p3=points[Math.min(points.length-1,i+2)],u=j/40;
  const p=[0,1].map(k=>.5*((2*p1[k])+(-p0[k]+p2[k])*u+(2*p0[k]-5*p1[k]+4*p2[k]-p3[k])*u*u+(-p0[k]+3*p1[k]-3*p2[k]+p3[k])*u*u*u));
  length+=Math.hypot(p[0]-samples.at(-1)[0],p[1]-samples.at(-1)[1]);samples.push(p);lengths.push(length);
 }
 samples[samples.length-1]=ORIGIN.slice();return {samples,lengths,length};
}
const routes=controls.map(build);
function atDistance(route,u){
 u=clamp(u);if(u===0)return {p:ORIGIN.slice(),i:0};if(u===1)return {p:ORIGIN.slice(),i:route.samples.length-1};
 const d=u*route.length;let lo=0,hi=route.lengths.length-1;
 while(lo+1<hi){const m=(lo+hi)>>1;if(route.lengths[m]<d)lo=m;else hi=m;}
 const q=(d-route.lengths[lo])/(route.lengths[hi]-route.lengths[lo]);
 return {p:route.samples[lo].map((x,k)=>x+(route.samples[hi][k]-x)*q),i:lo};
}
export function routeSlice(index,progress){
 const route=routes[index],{p,i}=atDistance(route,progress);return [...route.samples.slice(0,i+1),p];
}
export function journeyAt(t){
 const completed=[40.625,43.75,46.875].filter(end=>t>=end).length;
 const index=Math.max(0,Math.min(2,Math.floor((t-38.125)/3.125)));
 const raw=clamp((t-(38.125+index*3.125))/2.5),progress=smooth(raw);
 return {position:atDistance(routes[index],progress).p,completed,index,progress,moving:raw>0&&raw<1};
}
