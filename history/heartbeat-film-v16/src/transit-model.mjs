import {TAU,mix,ramp,gate,blend} from './drawing.mjs';
import {Solid,rotate} from './solids.mjs';
import {rod,cylinder} from './model-kit.mjs';

const C={ink:[26,44,49],metal:[128,155,151],ivory:[220,210,176],rust:[170,95,65],glass:[28,67,77],teal:[75,126,127],gold:[218,180,109]};
const append=(a,b)=>{a.faces.push(...b.faces);a.lines.push(...b.lines);};
function torus(s,x,y,z,r,tube,col,a=1,n=48,m=8){
 const P=(i,j)=>{const u=i/n*TAU,v=j/m*TAU;return [x+Math.cos(u)*(r+Math.cos(v)*tube),y+Math.sin(u)*(r+Math.cos(v)*tube),z+Math.sin(v)*tube];};
 for(let i=0;i<n;i++)for(let j=0;j<m;j++)s.face([P(i,j),P(i+1,j),P(i+1,j+1),P(i,j+1)],col,a);
}
function wheel(s,x,y,z,r,t,a=1,spokes=false){
 torus(s,x,y,z,r-3,3,[32,42,43],a);torus(s,x,y,z-.8,r-5,.9,C.metal,a,48,6);
 s.disc(x,y,spokes?3:r*.44,z-4,z+4,spokes?C.metal:[83,106,103],a,24);
 if(spokes){for(let k=0;k<24;k++){const u=k/24*TAU+t*2.7;s.line([[x+Math.cos(u+.5)*3,y+Math.sin(u+.5)*3,z],[x+Math.cos(u)*(r-6),y+Math.sin(u)*(r-6),z]],[164,182,172],a*.8,.5);}}
 else{for(let k=0;k<6;k++){const u=k/6*TAU+t*2;s.disc(x+Math.cos(u)*r*.23,y+Math.sin(u)*r*.23,1.05,z-4.5,z-4,C.ivory,a,8);}}
}
export function bicycle(t){
 const s=new Solid(),z=-10,crank=t*2.7;
 for(const x of [-91,91])wheel(s,x,58,z,40,t,1,true);
 const steel=[155,106,76];
 for(const [A,B] of [[[-91,58,z],[-33,-8,z]],[[-33,-8,z],[12,58,z]],[[12,58,z],[-91,58,z]],[[-33,-8,z],[65,-8,z]],[[65,-8,z],[12,58,z]]])rod(s,A,B,3,steel,1,12);
 for(const zz of [-15,-5])rod(s,[65,-8,zz],[91,58,zz],2.1,C.metal,1,10);
 rod(s,[-33,-8,z],[-40,-22,z],2.8,C.metal);s.rounded(-58,-27,35,7,3,z-8,z+8,[61,51,43]);
 rod(s,[65,-8,z],[60,-32,z],2.6,C.metal);rod(s,[60,-32,-26],[60,-32,7],2,C.metal);rod(s,[60,-32,-26],[47,-27,-29],2.4,C.ink);rod(s,[60,-32,7],[47,-27,10],2.4,C.ink);
 s.disc(12,58,10,z-9,z-7,C.metal,1,28);s.disc(12,58,6,z-9.5,z-9,C.ink,1,20);
 s.line([[-91,53,z-8],[12,47,z-8],[22,58,z-8],[12,68,z-8],[-91,63,z-8],[-91,53,z-8]],[183,173,133],1,.95);
 for(const side of [-1,1]){const x=12+side*Math.cos(crank)*14,y=58+side*Math.sin(crank)*14;rod(s,[12,58,z-10],[x,y,z-10],1.7,C.metal);s.box(x,y+1,z-12,12,3,9,C.ink);}
 // Rear rack, mudguards and brake cables identify an everyday commuter bicycle.
 for(const zz of [-23,4]){rod(s,[-117,7,zz],[-63,7,zz],1.4,C.metal);rod(s,[-110,7,zz],[-91,58,zz],1.2,C.metal);}
 for(const x of [-91,91]){const arc=[];for(let i=0;i<=36;i++){const u=Math.PI+Math.PI*i/36;arc.push([x+Math.cos(u)*43,58+Math.sin(u)*43,z]);}s.line(arc,[161,169,145],1,2);}
 s.line([[52,-30,-27],[40,-14,-25],[51,11,-20],[76,28,-15]],[40,50,47],1,.7);
 s.box(-92,2,-10,39,5,27,[120,84,61]);s.disc(84,-10,5,-18,-12,C.ivory,1,20);
 return s;
}
function bus(t){
 const s=new Solid(),col=[190,188,149];
 // Wheel-arch cutouts are in the body profile, not black discs on a box.
 const p=[[-150,-17],[-143,-25],[131,-25],[147,-15],[155,13],[155,77],[124,77]];
 for(let i=0;i<=16;i++){const u=-Math.PI*i/16;p.push([105+Math.cos(u)*22,78+Math.sin(u)*22]);}
 p.push([-82,77]);for(let i=0;i<=16;i++){const u=-Math.PI*i/16;p.push([-104+Math.cos(u)*22,78+Math.sin(u)*22]);}p.push([-150,77]);
 s.extrude(p,-40,40,col);s.layer=1;s.box(0,51,-41,300,19,2,C.rust);s.box(-5,75,-41,285,5,2,[112,129,118]);
 for(const x of [-104,105])for(const z of [-41,35]){s.layer=z<0?2:0;wheel(s,x,79,z,20,t);}s.layer=1;
 for(let k=0;k<5;k++){
  const x=-133+k*38;s.rounded(x,-11,33,38,3,-42,-41,C.glass);s.line([[x+2,2,-43],[x+30,2,-43]],[142,160,144],.75,.7);
  s.line([[x+4,-6,-43],[x+16,22,-43]],[117,152,151],.35,1);
 }
 // Two-leaf passenger door; opening settles before the departure.
 const door=(1-ramp(205,205.9,t))*.8,dx=door*10;
 for(const side of [-1,1]){s.rounded(91+side*10+side*dx,-10,18,73,2,-42,-41,C.teal);s.rounded(94+side*10+side*dx,-6,12,34,1,-43,-42,C.glass);s.line([[102+side*10+side*dx,34,-44],[102+side*10+side*dx,49,-44]],C.ivory,.6,1);}
 s.rounded(122,-10,22,34,3,-42,-41,C.glass);
 s.face([[154,10,-34],[147,-12,-34],[147,-12,34],[154,10,34]].reverse(),C.glass);
 s.face([[155,39,-30],[155,15,-30],[155,15,30],[155,39,30]].reverse(),C.glass);
 for(const z of [-28,28]){s.box(156,54,z,2,9,11,C.ivory);rod(s,[142,-8,z*1.4],[158,-9,z*1.4],1.1,C.metal);s.box(158,3,z*1.4,3,17,7,C.ink);}
 s.box(156,73,0,3,7,70,C.metal);for(let k=0;k<7;k++)s.line([[156,61+k, -19],[156,61+k,19]],C.ink,.65,.6);
 s.box(-101,-27,3,65,5,42,[155,163,141]);for(let k=0;k<8;k++)s.line([[-131+k*8,-32,-15],[-131+k*8,-32,21]],C.ink,.45,.65);
 s.box(-146,54,-41,5,10,3,[157,53,43]);
 return s;
}
function train(t){
 const s=new Solid();
 const shell=[[-172,-28],[-166,-43],[118,-43],[136,-35],[165,-6],[174,31],[168,53],[-172,53]];
 s.extrude(shell,-44,44,[209,211,188]);
 s.box(-12,64,0,294,12,60,[63,84,85]);
 for(const x of [-102,98]){
  s.box(x,73,0,65,13,64,[43,61,66]);
  for(const dx of [-22,22])for(const zz of [-41,34]){wheel(s,x+dx,85,zz,13,t);s.disc(x+dx,85,5,zz-4.6,zz-4,C.metal,1,20);}
  for(const dx of [-15,15]){s.rounded(x+dx-6,67,12,9,3,-46,-40,C.metal);for(let k=0;k<4;k++)s.line([[x+dx-6,68+k*2,-47],[x+dx+6,68+k*2,-47]],C.ink,.7,.6);}
 }
 // Broad shell faces cannot depth-sort coplanar trim reliably: near-side skin
 // uses an explicit overlay layer; undercarriage stays in physical depth order.
 s.layer=1;s.box(-11,39,-45,314,19,2,C.teal);s.box(-13,52,-46,311,3,2,C.gold);
 // The near side has explicit sliding doors, with the cab at the right end.
 for(const x of [-146,-39,67]){
  s.rounded(x,-24,35,68,3,-46,-45,[156,181,173]);
  for(const side of [0,1])s.rounded(x+4+side*16,-18,11,26,2,-47,-46,C.glass);
  s.line([[x+17.5,-22,-48],[x+17.5,42,-48]],C.ink,.7,.8);s.line([[x+2,42,-48],[x+33,42,-48]],C.metal,.9,1);
 }
 for(const x of [-99,9]){s.rounded(x,-24,44,34,4,-46,-45,C.glass);s.line([[x+4,-18,-47],[x+20,6,-47]],[153,180,169],.35,1);}
 s.face([[133,-28,-45],[155,-6,-45],[157,15,-45],[116,15,-45],[116,-28,-45]],C.glass);
 s.face([[139,-30,-33],[139,-30,33],[163,-3,38],[163,-3,-38]].reverse(),C.glass);
 for(const z of [-27,27])s.box(171,30,z,3,6,11,[235,221,161]);
 s.box(174,53,0,4,8,49,[55,80,84]);rod(s,[174,61,0],[184,61,0],3,C.ink);
 for(const x of [-60,50])s.rounded(x-31,-49,62,7,3,-24,24,[130,153,148]);
 for(let j=0;j<9;j++)s.line([[-87+j*7,-50,-21],[-87+j*7,-50,21]],C.ink,.55,.6);
 rod(s,[-33,-49,0],[-8,-73,0],1.7,C.metal);rod(s,[-8,-73,0],[20,-49,0],1.7,C.metal);rod(s,[20,-49,0],[38,-73,0],1.7,C.metal);s.box(14,-75,0,58,3,28,C.metal);
 // Bellows and a partial second carriage distinguish rail stock from a road bus.
 for(let k=0;k<7;k++)s.box(-176-k*3,45,0,1.4,79,79,k%2?C.ink:[91,116,117]);
 s.box(-232,50,0,76,91,88,[156,179,173]);s.box(-232,36,-45,76,17,2,C.teal);s.rounded(-264,-24,58,33,4,-46,-45,C.glass);
 s.layer=0;s.box(-232,67,0,76,17,61,[57,78,81]);s.box(-232,76,0,60,13,64,[45,66,70]);s.layer=1;
 for(const dx of [-16,16])wheel(s,-233+dx,85,-41,13,t);
 return s;
}
function street(s,t,p,q,wide){
 const extent=245,v=22+58*p+110*q,slide=((t-198)*v)%90;
 s.group=-20;s.box(0,114,20,extent*2,15,236,blend([74,94,100],[62,77,84],q));
 // One ground axis is conserved: the road markings resolve into rail sleepers.
 s.group=-18;
 for(let k=-8;k<=8;k++){const x=k*90-slide;s.box(x,99,2,34,1,4,C.gold,1-q);s.box(x,102,0,11,5,105,[96,98,88],q);}
 for(const z of [-34,34]){s.box(0,99,z,extent*2,3,3,C.metal,q);s.box(0,96,z,extent*2,1.8,5,[187,195,176],q);}
 // A rear street and station create parallax instead of a floating display plinth.
 s.group=-13;s.box(0,100,153,extent*2,7,69,[116,120,108],wide);
 s.box(0,88,105,extent*2,8,9,[166,170,140],wide*q);
 for(let k=-7;k<=8;k++){
  const x=k*153-(((t-198)*(8+36*p+45*q))%459),h=110+(k%3+3)%3*36;
  s.group=-14;s.box(x,98,255,117,h,82,blend([62,86,86],[49,70,79],q),wide*(1-q*.8));
  for(let row=0;row<4;row++)for(let col=0;col<3;col++)s.box(x-36+col*35,63-row*29,212,16,20,2,(row+col+k)%4===0?[163,141,92]:[34,59,66],wide*(1-q*.8));
  s.group=-12;rod(s,[x,94,129],[x,-99,129],3,[90,113,110],wide*q);rod(s,[x,-99,129],[x,-106,19],3,[90,113,110],wide*q);
  s.box(x,-101,75,96,3,18,[192,195,162],wide*q);
 }
 // A single bus shelter, with a bench and a route diagram (no invented labels).
 const stop=gate(201.6,209.2,t,1.4)*wide,x=-224-(t-204)*8;
 s.group=-9;for(const xx of [x-38,x+38])rod(s,[xx,99,138],[xx,-62,138],2.3,C.metal,stop);
 s.box(x,-59,139,95,5,54,C.teal,stop);s.box(x,62,132,71,5,21,C.rust,stop);for(const xx of [x-27,x+27])s.box(xx,98,132,3,37,15,C.ink,stop);
 s.box(x+37,17,125,16,36,2,C.ivory,stop);s.line([[x+33,-12,123],[x+33,11,123],[x+40,11,123]],C.rust,stop,1.3);
 s.group=0;
}
export function transitMotion(t){
 const pass=ramp(203.2,205,t),rail=ramp(209,198+25*60/112,t);
 return {pass,rail,busX:(1-pass)*660-rail*690,trainX:(1-rail)*800+17};
}
export function transitModel(s,t,p,q){
 const wide=gate(198,216,t,2.4);street(s,t,p,q,wide);
 const {pass,rail}=transitMotion(t);
 if(pass<1){const b=bicycle(t);b.transform(v=>[v[0]-pass*590,v[1],v[2]]);append(s,b);}
 if(pass>.001&&rail<1){const b=bus(t),arrival=(1-pass)*660,depart=rail*690;b.transform(v=>[v[0]+arrival-depart,v[1]+Math.sin(t*7)*.28,v[2]]);append(s,b);}
 if(rail>.001){const r=train(t);r.transform(v=>[v[0]+(1-rail)*800+17,v[1]+Math.sin(t*16)*.11,v[2]]);append(s,r);}
}
