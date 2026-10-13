import {Solid,rotate} from './solids.mjs';
import {TAU,mix,ramp,clamp} from './drawing.mjs';
// Cut architecture into spatial blocks: windows, sills and trim remain attached
// to the piece of wall carrying them. The building is entirely absent in the hold.
function clipPolygon(points,axis,bound,greater){
 const out=[],inside=p=>greater?p[axis]>=bound:p[axis]<=bound;
 for(let i=0;i<points.length;i++){
  const a=points[i],b=points[(i+1)%points.length],ia=inside(a),ib=inside(b);
  if(ia)out.push(a);if(ia!==ib){const u=(bound-a[axis])/(b[axis]-a[axis]);out.push(a.map((v,k)=>mix(v,b[k],u)));}
 }return out;
}
export function buildingParts(s){
 const cells=new Map(),size=[68,58,67],base=[-204,-232,-100];
 const bucket=(x,y,z)=>{const key=[x,y,z].join(',');if(!cells.has(key))cells.set(key,{faces:[],lines:[],center:base.map((b,i)=>b+([x,y,z][i]+.5)*size[i])});return cells.get(key);};
 for(const f of s.faces){
  const lo=[0,1,2].map(k=>Math.floor((Math.min(...f.points.map(p=>p[k]))-base[k])/size[k]));
  const hi=[0,1,2].map(k=>Math.floor((Math.max(...f.points.map(p=>p[k]))-base[k]-1e-6)/size[k]));
  for(let x=lo[0];x<=Math.max(lo[0],hi[0]);x++)for(let y=lo[1];y<=Math.max(lo[1],hi[1]);y++)for(let z=lo[2];z<=Math.max(lo[2],hi[2]);z++){
   const ijk=[x,y,z];let points=f.points;
   for(let k=0;k<3&&points.length;k++){points=clipPolygon(points,k,base[k]+ijk[k]*size[k],true);points=clipPolygon(points,k,base[k]+(ijk[k]+1)*size[k],false);}
   if(points.length>=3)bucket(x,y,z).faces.push({...f,points});
  }
 }
 for(const l of s.lines)for(let j=0;j<l.points.length-1;j++){
  const a=l.points[j],b=l.points[j+1],mid=a.map((v,k)=>(v+b[k])/2),ijk=mid.map((v,k)=>Math.floor((v-base[k])/size[k]));
  bucket(...ijk).lines.push({...l,points:[a,b]});
 }
 return [...cells.values()].filter(p=>p.faces.length).sort((a,b)=>b.center[1]-a.center[1]||a.center[0]-b.center[0]||a.center[2]-b.center[2]);
}
export function assemblyState(u){return {detached:u>.34&&u<.63,old:u<.5,scatter:u<.5?ramp(0,.34,u):1-ramp(.63,1,u)};}
export function assembleBuildings(oldParts,newParts,u,variant=0){
 const s=new Solid(),N=Math.max(oldParts.length,newParts.length),flip=ramp(.42,.58,u),rotation=Math.PI*flip,cross=ramp(.465,.535,u);
 for(const [parts,weight,isOld] of [[oldParts,1-cross,true],[newParts,cross,false]]){if(weight<.00001)continue;for(let i=0;i<parts.length;i++){
  const p=parts[i],angle=i*2.399963+variant*1.7+(.12+variant*.12)*ramp(.27,.7,u),radius=190*Math.sqrt((i+.7)/N);
  const slot=[Math.cos(angle)*radius,-25+Math.sin(angle)*radius*.66,20+Math.sin(i*1.39)*64];
  // Roof and walls leave in a cascade. Foundations return before higher floors.
  const delay=(i/N)*.08,e=isOld?ramp(delay,.29+delay,u):1-ramp(.62+delay,.92+delay,u);
  const center=p.center.map((v,k)=>mix(v,slot[k],e));
  const pinch=1-.9*Math.sin(Math.PI*flip)**8,scale=mix(1,.48,e);
  const transform=v=>{
   const local=v.map((v,k)=>(v-p.center[k])*scale*(k===0?pinch:1));
   const rot=rotate(local,e*(.11*Math.sin(i)),e*(Math.sin(i*1.1)*.22+rotation*(isOld?1:-1)),e*.11*Math.sin(i*2));
   return rot.map((v,k)=>v+center[k]);
  };
  // Physical depth wins while pieces are apart; coplanar trim rejoins its wall.
  const g=e>.04?0:null;
  for(const f of p.faces)s.faces.push({...f,alpha:f.alpha*weight,points:f.points.map(transform),group:g??f.group,layer:e>.04?0:f.layer,doubleSided:e>.04});
  for(const l of p.lines)s.lines.push({...l,alpha:l.alpha*weight,points:l.points.map(transform),group:g??l.group,layer:e>.04?0:l.layer});
 }}
 return s;
}
