import {TAU,blend} from './drawing.mjs';
import {Solid,rotate} from './solids.mjs';
import {cylinder,ellipsoid,rod} from './model-kit.mjs';
export function shoe(s,x,y,z,color=[139,150,125],a=1,turn=0,scale=1){
 const m=new Solid();m.extrude([[-31,-2],[-30,-22],[-21,-29],[-8,-27],[12,-13],[32,-12],[41,-6],[39,0]],-14,14,color,a);
 m.rounded(-33,-3,76,8,4,-16,16,[209,200,168],a);m.layer=1;
 m.extrude([[-29,-21],[-23,-24],[-18,-16],[-24,-10]],-14.6,-14.4,blend(color,[47,67,65],.5),a);
 for(let i=0;i<5;i++){const xx=-9+i*7,yy=-25+i*2.8;rod(m,[xx-4,yy,-11],[xx+3,yy,11],.9,[222,211,179],a,6);rod(m,[xx+3,yy,-11],[xx-4,yy,11],.9,[222,211,179],a,6);}
 m.line([[-27,-1,-17],[34,-1,-17]],[153,159,136],a*.7,.6);
 m.transform(p=>{const q=rotate([p[0]*scale,(p[1]-5)*scale,p[2]*scale],0,turn,0);return [x+q[0],y+q[1],z+q[2]];});s.faces.push(...m.faces);s.lines.push(...m.lines);
}
export function backpack(s,x,y,z,a=1){
 s.rounded(x-35,y-97,70,96,11,z-18,z+18,[147,105,69],a);s.layer=1;
 s.rounded(x-29,y-42,58,35,6,z-21,z-18,[170,124,78],a);
 s.line([[x-26,y-42,z-22],[x+26,y-42,z-22]],[224,190,131],a,.85);
 for(let k=0;k<10;k++)s.line([[x-25+k*5,y-41,z-22.5],[x-24+k*5,y-39,z-22.5]],[70,73,62],a,.5);
 s.disc(x+17,y-39,2,z-25,z-23,[198,177,119],a,12);s.layer=0;
 for(const d of [-1,1]){const pts=[];for(let j=0;j<=28;j++){const u=j/28;pts.push([x+d*(26+Math.sin(u*Math.PI)*14),y-82+u*76,z+18+Math.sin(u*Math.PI)*13]);}s.line(pts,[96,76,54],a,5);}
 for(let k=0;k<14;k++)s.line([[x-24+k*3.8,y-90,z-19],[x-24+k*3.8,y-87,z-19]],[207,169,115],a*.5,.45);
 rod(s,[x-11,y-98,z],[x-11,y-109,z],2.5,[81,72,55],a);rod(s,[x-11,y-109,z],[x+11,y-109,z],2.5,[81,72,55],a);rod(s,[x+11,y-109,z],[x+11,y-98,z],2.5,[81,72,55],a);
}
export function toyTrain(s,x,y,z,t,a=1){
 const drift=Math.sin(t*.55)*9;
 for(let car=0;car<3;car++){
  const xx=x-55+car*51+drift;s.box(xx,y-13,z,42,12,32,car%2?[100,139,132]:[181,119,78],a);
  if(car===0){cylinder(s,xx-9,y-26,z,12,12,[202,164,101],a,14);s.box(xx+11,y-25,z,18,26,30,[190,150,86],a);cylinder(s,xx-12,y-41,z,5,17,[137,96,62],a,12);}
  else{s.box(xx-8,y-26,z,15,24,25,[206,175,116],a);s.box(xx+10,y-26,z,15,17,25,[152,94,69],a);}
  for(const dx of [-13,13])for(const dz of [-19,19]){s.disc(xx+dx,y-7,8,z+dz-3,z+dz+3,[60,87,86],a,16);s.disc(xx+dx,y-7,3,z+dz-3.5,z+dz-3,[186,161,113],a,12);}
  if(car<2)rod(s,[xx+22,y-18,z],[xx+29,y-18,z],1.8,[195,177,122],a);
 }
}
export function doorway(s,x,y,z,a=1,open=0){
 const wood=[119,105,82],m=new Solid(),previousGroup=s.group;s.group=-1;m.group=-1;
 for(const side of [-1,1])s.box(x+side*55,y,z,12,245,18,wood,a);
 s.box(x,y-235,z,122,13,18,[153,130,93],a);
 m.box(0,0,0,98,234,7,[86,110,105],a);
 for(const yy of [-38,-130]){m.layer=1;m.box(0,yy,-4.5,78,77,2,[112,132,117],a);m.box(0,yy-6,-6,66,64,1,[72,96,91],a);}
 m.layer=2;m.disc(33,-107,4,-10,-7,[206,167,102],a,16);rod(m,[33,-107,-10],[45,-107,-10],2,[206,167,102],a);
 for(const yy of [-193,-40])m.box(-48,yy,-3,3,18,8,[166,145,102],a);
 m.transform(p=>{const q=rotate([p[0]+49,p[1],p[2]],0,-open*.5,0);return [x-49+q[0],y+q[1],z+q[2]];});s.faces.push(...m.faces);s.lines.push(...m.lines);s.group=previousGroup;
}
