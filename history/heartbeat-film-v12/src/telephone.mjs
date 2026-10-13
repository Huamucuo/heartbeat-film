import {TAU,mix,ramp,blend} from './drawing.mjs';
import {Solid,rotate,paintSolid} from './solids.mjs';
import {SCENES} from './vignettes.mjs';

export function phoneSolid(t,motionTime=t){
 const p=ramp(65.3,68.1,t),q=ramp(68.75,71.25,t),s=new Solid();
 const old=[190,128,78],middle=[67,101,100],modern=[194,182,153],caseColor=blend(blend(old,middle,p),modern,q);
 const w=mix(175,79,p)+q*6,h=mix(81,170,p)+q*4,y=mix(6,-99,p)-q*3,depth=mix(47,15,p)-q*5,front=-depth/2;
 // Wood, paper and matte case faces. No mirror environment or glossy shader.
 s.group=-4;
 s.box(0,122,32,470,15,235,[126,94,69],1);
 s.group=-3;
 for(let k=0;k<18;k++){
  const x=-230+k*27,pts=[];for(let j=0;j<=24;j++)pts.push([x+Math.sin(j*.30+k)*2,106.6,-82+j*9]);
  s.line(pts,[159,121,86],.24,.65);
 }
 s.group=-2;
 s.face([[-175,105,-47],[-64,105,-67],[-50,105,18],[-162,105,35]],[216,200,164],.96,.45);
 s.line([[-175,104.8,-47],[-112,104.8,-8],[-64,104.8,-67]],[130,103,76],.65,.65);
 s.box(150,105,17,90,18,94,[66,95,102],.92);
 s.box(152,86,17,81,4,87,[217,202,165],.98);
 s.box(146,82,14,88,13,94,[159,88,64],.96);
 // A restrained contact shadow, integrated into the same ground plane.
 s.face(Array.from({length:40},(_,i)=>[15+Math.cos(i/40*TAU)*114,106.4,30+Math.sin(i/40*TAU)*48]),[25,27,25],.27,.45);
 s.group=0;s.layer=0;
 s.rounded(-w/2,y,w,h,mix(15,9,p),front,depth/2,caseColor);
 s.layer=1;
 s.rounded(-w/2+4,y+4,w-8,h-8,mix(11,6,p),front-.5,front,blend(caseColor,[37,51,51],.14),.93);
 s.layer=2;s.disc(0,42,34,front-4,front-1,[55,57,48],1-p,48);
 s.layer=3;
 s.disc(0,42,28,front-6,front-4,[204,185,142],1-p,48);
 s.layer=4;
 s.disc(0,42,14,front-7,front-6,[76,74,56],1-p,40);
 for(let k=0;k<10;k++){
  const angle=k/10*TAU-.45+Math.sin(motionTime*3.4)*.025,xx=mix(Math.cos(angle)*23,((k%3)-1)*20,p),yy=mix(42+Math.sin(angle)*23,8+Math.floor(k/3)*15,p);
  s.disc(xx,yy,mix(4,3.7,p),front-7,front-5,blend([33,37,34],[219,217,187],p),1-q,18);
 }
 const ring=Math.sin(motionTime*7)*1.0;
 s.layer=0;
 s.rounded(-80,-27+ring,52,27,12,front+6,depth/2+7,[171,113,67],1-p);
 s.rounded(28,-27+ring,52,27,12,front+6,depth/2+7,[171,113,67],1-p);
 s.rounded(-51,-21+ring,102,14,7,front+8,depth/2+4,[176,119,75],1-p);
 for(const side of [-1,1])for(let k=0;k<6;k++)s.disc(side*(37+k*5),-15+ring,1.4,front+5,front+6,[30,36,32],1-p,12);
 const cord=[];for(let j=0;j<=180;j++){const u=j/180;cord.push([-80-u*35+Math.sin(u*TAU*11)*5,15+u*83,15+Math.cos(u*TAU*11)*5]);}s.line(cord,[70,61,46],1-p,2.4);
 s.layer=5;
 s.rounded(-29,-79-q*7,58,58+q*65,3,front-2,front-1,blend([116,143,121],[17,42,48],q),p);
 s.rounded(-11,-89-q*8,22,2,1,front-3,front-2,[29,41,40],p);
 s.disc(0,61,3,front-3,front-2,[71,93,86],p,20);
 s.layer=6;
 for(let k=0;k<3;k++)s.rounded(-22+(k%2)*10,-59+k*23,34,13,3,front-3,front-2,k%2?[86,137,128]:[175,143,112],p*q*(.72+.10*Math.sin(motionTime*1.8-k)));
 // Physical side buttons and the thin rim make the final device a volume.
 s.box(w/2+1,y+54,0,3,21,4,blend(caseColor,[25,38,37],.35),p);
 s.box(w/2+1,y+83,0,3,12,4,blend(caseColor,[25,38,37],.35),p);
 const rest=107-(y+h);
 for(const item of [...s.faces,...s.lines])if(item.group===0)item.points=item.points.map(([x,y,z])=>[x,y+rest,z]);
 const anchor=SCENES[0].anchor,scale=SCENES[0].scale;
 const turn=-.26+.43*ramp(65.5,71.5,t)+.035*Math.sin(t*.7);
 s.transform(v=>{const p=rotate(v,-.07,turn,.012*Math.sin(t*.55));return [anchor[0]+p[0]*scale,anchor[1]+p[1]*scale,anchor[2]+p[2]*scale];});
 return s;
}
export function telephone(c,t,cam,alpha){paintSolid(c,phoneSolid(t),cam,alpha);}
