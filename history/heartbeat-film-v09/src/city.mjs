import {TAU,mix,ramp,gate,hash,blend,project,path,spot,ivory,gold,teal} from './drawing.mjs';
import {Solid,paintSolid} from './solids.mjs';
import {archivePose,archiveCamera} from './archive.mjs';

const PALETTE=[[177,126,99],[174,164,143],[96,135,133],[153,142,139],[195,173,133],[108,122,137]];
export function cityCamera(t){
 const u=ramp(17.8,21,t),old=archiveCamera(t),q=ramp(21,27,t);
 const next={yaw:mix(-.38,.11,q),pitch:mix(.60,.79,q),scale:mix(1.0,1.2,q),x:960+Math.sin(t*.18)*70,y:700,depth:3100};
 return Object.fromEntries(Object.keys(next).map(k=>[k,mix(old[k]??next[k],next[k],u)]));
}
export function city(c,t){
 const a=gate(17.5,29.2,t,2.0);if(a<.002)return;
 const spread=ramp(17.8,21,t),cam=cityCamera(t),mesh=new Solid(),sink=1-ramp(26.0,29.2,t);
 const sky=c.createLinearGradient(0,0,0,1080);sky.addColorStop(0,'#172b34');sky.addColorStop(.55,'#32464a');sky.addColorStop(1,'#101b26');
 c.save();c.globalAlpha=a;c.fillStyle=sky;c.fillRect(0,0,1920,1080);c.restore();
 mesh.group=-100000;
 mesh.face([[-2350,321,-1450],[2350,321,-1450],[2350,321,2300],[-2350,321,2300]],[55,63,62],spread*.98,.30);
 // Roads are spaces between masses, not another wire grid.
 mesh.layer=1;
 for(let k=-8;k<=8;k++){
  const z=k*190;
  mesh.face([[-2300,319,z-22],[2300,319,z-22],[2300,319,z+22],[-2300,319,z+22]],[45,54,55],spread*.92,.25);
  for(let j=-15;j<=15;j++)mesh.face([[j*145,318,z-1],[j*145+46,318,z-1],[j*145+46,318,z+1],[j*145,318,z+1]],[194,181,145],spread*.42,.5);
 }
 for(let k=-7;k<=7;k++){const x=k*198;mesh.face([[x-22,319,-1550],[x+22,319,-1550],[x+22,319,2300],[x-22,319,2300]],[45,54,55],spread*.85,.25);}
 for(let id=0;id<126;id++){
  const col=id%14,row=Math.floor(id/14),start=archivePose(id,t),growth=ramp(17.5+hash(id)*1.2,21.3+hash(id)*1.4,t),height=(85+hash(id+730)*440)*(row===4?.76:1);
  const p=[mix(start[0],(col-6.5)*198,spread),mix(start[1]+31.5,316,spread),mix(start[2],(row-3)*190,spread)];
  const w=mix(101,110+hash(id+12)*27,spread),d=mix(1,108+hash(id+8)*23,spread),h=mix(63,height,growth)*sink;
  const color=PALETTE[id%PALETTE.length],x=p[0],y=p[1],z=p[2];
  mesh.group=-project([x,180,z],cam)[2];mesh.layer=0;
  mesh.box(x,y,z,w,h,d,color,.98);
  mesh.box(x+4,y-h-1,z+3,w*.60,8*growth,d*.64,blend(color,[43,54,56],.50),growth*.95);
  if(id%7===1)mesh.box(x-13,y-h-9,z+5,w*.32,30*growth,d*.29,blend(color,[58,71,76],.6),growth);
  if(id%9===3){mesh.box(x+19,y-h-8,z+2,3,45*growth,3,[117,131,128],growth);mesh.box(x+19,y-h-35,z+2,29*growth,2,2,[117,131,128],growth);}
  mesh.layer=1;
  const rows=8,visibleHeight=Math.max(1,h-28);
  for(let iy=0;iy<rows;iy++)for(let ix=0;ix<4;ix++){
   const wy=y-17-iy*visibleHeight/rows,wx=x-w*.37+ix*w*.24,lit=hash(id*41+iy*7+ix)>.65,breath=.82+.18*Math.sin(t*1.1+id*.7+iy*.5);
   const colr=lit?[229*breath,185*breath,119*breath]:[35,61,66],ww=w*.12,hh=Math.min(16,h*.064);
   mesh.face([[wx,wy-hh,z-d/2-.7],[wx,wy,z-d/2-.7],[wx+ww,wy,z-d/2-.7],[wx+ww,wy-hh,z-d/2-.7]],colr,growth*.92,lit?.93:.35);
   if(ix<3){const zz=z-d*.32+ix*d*.29;mesh.face([[x+w/2+.7,wy-hh,zz],[x+w/2+.7,wy,zz],[x+w/2+.7,wy,zz+ww],[x+w/2+.7,wy-hh,zz+ww]],colr,growth*.86,lit?.75:.20);}
  }
 }
 paintSolid(c,mesh,cam,a);
 // A pulse travels along the street and becomes the next shot's two rhythms.
 for(let route=0;route<3;route++){
  const pts=[];for(let j=0;j<=150;j++){const u=j/150,x=(u-.5)*2760,z=(route-1)*380;pts.push(project([x,315,z],cam));}
  path(c,pts,route===1?gold:teal,a*.20,1.3);
  for(let k=0;k<8;k++){const u=((t*.13+k/8+route*.05)%1+1)%1,p=project([(u-.5)*2760,314,(route-1)*380],cam);spot(c,p[0],p[1],4,ivory,a*.50);}
 }
}
