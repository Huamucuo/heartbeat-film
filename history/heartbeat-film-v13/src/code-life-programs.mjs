import {poly,rect,oval,curve} from './code-ink.mjs';
import {insidePolygon} from './code-direction.mjs';
import {hash,ramp,mix,clamp} from './drawing.mjs';
const line=(...p)=>poly(p);
function windows(p,x,y,cols,rows,sx,sy,w=15,h=19){for(let r=0;r<rows;r++)for(let c=0;c<cols;c++)p.push(rect(x+c*sx,y+r*sy,w,h));}
function cup(p,x,y){p.push(poly([[x-18,y-22],[x+18,y-22],[x+14,y+10],[x-14,y+10],[x-18,y-22]],true),oval(x+22,y-7,10,11),oval(x,y+14,29,5));}
function book(p,x,y,w=34,h=70){p.push(rect(x,y,w,h,true),line([x+7,y],[x+7,y+h]),line([x+13,y+12],[x+w-5,y+12]));}
export function lifeProgram(id,era,t=170){
 const p=[],e=era;const base=90;
 if(id===0){
  book(p,-220,-13,46,90);book(p,-166,8,35,68);
  if(e===0){p.push(poly([[-90,64],[-69,-26],[-25,-55],[46,-55],[85,-25],[98,64],[-90,64]],true),oval(3,13,42,40),oval(3,13,23,22),curve([-95,-45],[-100,-115],[100,-115],[104,-46]));for(let k=0;k<10;k++){const a=k/10*Math.PI*2;p.push(oval(3+Math.cos(a)*31,13+Math.sin(a)*29,5));}p.push(poly([[-96,-42],[-81,-61],[-50,-64],[-39,-44],[-54,-26],[-96,-42]],true),poly([[105,-43],[90,-62],[59,-65],[46,-46],[60,-28],[105,-43]],true));}
  else{p.push(rect(-63,-108,126,202,true),rect(-51,-86,102,e===1?72:151),line([-19,-98],[19,-98]),oval(0,81,6));if(e===1){windows(p,-42,4,3,4,30,19,21,12);p.push(line([62,-102],[62,-140],[70,-140],[70,-101]));}else{p.push(curve([-32,-40],[-5,-72],[8,-20],[33,-47]),line([-36,7],[34,7]),line([-36,23],[19,23]),line([-36,39],[26,39]));}}
  p.push(rect(124,-57,110,91),line([134,-41],[221,-41]),line([134,-25],[209,-25]),line([134,-9],[217,-9]),line([132,63],[232,63]),line([132,72],[188,72]),line([-245,103],[245,103]));
  for(let k=0;k<5;k++)p.push(curve([75+k*3,-7],[95+k*4,-25],[106+k*3,-35],[114+k*3,-15]));
 }
 if(id===1){
  p.push(line([-242,86],[242,86]),line([-198,87],[-190,110]),line([195,87],[189,110]));
  book(p,-226,-7,28,91);book(p,-191,10,25,74);book(p,-160,26,22,58);
  if(e===0){p.push(rect(-92,-15,183,89,true),rect(-67,-107,137,85,true),line([-54,-89],[58,-89]),line([-54,-74],[31,-74]),line([-54,-59],[51,-59]));windows(p,-75,13,9,3,18,17,10,9);p.push(line([-103,-1],[109,-1]),oval(-104,-14,9),oval(108,-14,9));}
  else{p.push(rect(-104,-98,208,139,true),rect(-92,-84,184,108),poly([[-104,41],[104,41],[132,75],[-132,75],[-104,41]],true),rect(-26,52,52,14));windows(p,-99,45,12,2,17,10,11,4);for(let i=0;i<6;i++)p.push(line([-78,-62+i*13],[-10+(i%3)*34,-62+i*13]));if(e===2){p.push(rect(-10,-67,90,75),curve([0,-10],[20,-62],[41,21],[73,-47]));}}
  p.push(line([159,76],[159,-62],[196,-92]),poly([[184,-100],[211,-77],[228,-90],[199,-116],[184,-100]],true),oval(159,80,35,5));
 }
 if(id===2){
  if(e===0){p.push(poly([[-160,-20],[0,-124],[160,-20],[-160,-20]],true),rect(-133,-20,266,127,true),rect(-25,24,49,83),rect(-99,5,47,45),rect(55,5,47,45),rect(75,-105,27,64,true));p.push(line([-80,5],[-80,50]),line([-99,28],[-52,28]),line([77,5],[77,50]),line([55,28],[102,28]));}
  else if(e===1){p.push(rect(-150,-110,300,220,true),rect(-164,-123,328,13,true),rect(-26,66,53,44));windows(p,-126,-84,6,4,43,36,25,25);}
  else{p.push(rect(-190,-88,152,196,true),rect(-20,-141,147,249,true),rect(144,-53,73,160,true));windows(p,-177,-73,5,8,26,22,14,12);windows(p,-7,-126,5,10,25,22,14,12);windows(p,154,-40,2,7,27,20,15,11);}
  p.push(line([-249,111],[249,111]));for(let i=0;i<15;i++)p.push(line([-231+i*34,115],[-250+i*34,126]));
 }
 if(id===3){
  p.push(line([-255,77],[255,77]),line([-255,98],[255,98]));for(let i=0;i<20;i++)p.push(line([-246+i*27,80],[-255+i*27,101]));
  for(let i=0;i<7;i++){const h=35+hash(i+34)*57;p.push(rect(-230+i*72,-h-25,56,h),line([-220+i*72,-h-34],[-184+i*72,-h-34]));}
  if(e===0){p.push(oval(-83,24,48),oval(89,24,48),line([-83,24],[-39,-45],[10,24],[-83,24]),line([-39,-45],[49,-45],[10,24]),line([89,24],[47,-65],[28,-68]),line([-49,-55],[-24,-55]),oval(10,24,9),line([10,24],[29,40]));}
  else{p.push(poly([[-206,-58],[149,-58],[202,-16],[212,53],[-214,53],[-214,-35],[-206,-58]],true));windows(p,-190,-41,e===1?7:10,1,e===1?47:33,25,e===1?32:22,38);p.push(rect(154,2,30,45),line([-206,21],[208,21]),oval(-141,58,19),oval(145,58,19));if(e===2){p.push(poly([[-23,-58],[-5,-96],[47,-96],[29,-58]]),line([-235,-110],[235,-110]),line([-12,-100],[55,-100]));}}
 }
 if(id===4){
  p.push(rect(-112,-123,224,104),line([0,-123],[0,-19]),line([-112,-71],[112,-71]),oval(0,43,170,44,true),line([-104,76],[-118,120]),line([106,76],[120,120]));
  const chairs=e<2?[-203,203]:[-203];for(const x of chairs)p.push(rect(x-23,-1,46,57,true),line([x-23,57],[x-27,111]),line([x+23,57],[x+27,111]),line([x-23,42],[x+23,42]));
  cup(p,-72,35);if(e<2)cup(p,71,35);p.push(oval(0,52,35,12),line([-33,28],[28,28]));
  for(let side=0;side<(e<2?2:1);side++){const x=side?71:-72;for(let k=0;k<2;k++)p.push(curve([x+k*10-5,7],[x-14+k*10+Math.sin(t)*4,-16],[x+17+k*5,-20],[x+k*6,-35]));}
 }
 if(id===5){
  p.push(line([-215,-128],[-215,106]),line([-229,106],[-201,106]));for(let k=0;k<14;k++)p.push(line([-217,-116+k*15],[-197+(k%3===0?12:0),-116+k*15]));
  p.push(poly([[-87,87],[-96,-26],[-73,-64],[63,-64],[88,-25],[80,87],[-87,87]],true),rect(-54,-99,90,35),rect(-61,22,116,52),line([-92,-22],[-122,56]),line([88,-22],[120,56]));
  for(let k=0;k<e+1;k++)p.push(line([-224,-21-k*30],[-173,-21-k*30]));
  if(e===0){p.push(oval(161,52,43),curve([122,41],[171,15],[180,68],[197,65]),curve([158,9],[136,61],[173,64],[164,94]));}
  else{book(p,131,13,32,86);book(p,170,-7,30,106);p.push(poly([[113,-16],[160,-52],[215,-16],[160,0],[113,-16]]),line([198,-22],[199,19]));}
 }
 if(id===6){
  for(let k=0;k<5;k++)p.push(rect(-204,-44+k*18,240,10,true));p.push(line([-178,45],[-190,104]),line([14,45],[25,104]),line([-205,59],[42,59]));
  p.push(curve([80,98],[80,16],[63,-126],[115,-104]),line([114,-104],[117,-90]),rect(155,7,49,83,true),rect(165,-12,29,19),line([164,37],[195,37]),line([180,21],[180,53]));
  p.push(oval(-131,29,23,14),oval(-78,29,23,14),curve([-108,25],[-97,19],[-96,19],[-101,25]),line([-155,25],[-169,13]));
  if(e===0)p.push(curve([-30,107],[-28,37],[-72,50],[-67,-9]));else for(let k=0;k<e;k++)p.push(rect(116+k*17,76,10,24,true));
 }
 if(id===7){
  p.push(oval(0,86,139,22),rect(-102,12,204,70,true),oval(0,12,102,21),oval(0,70,102,21),line([-101,38],[101,38]));
  const count=[11,7,3][e];for(let k=0;k<count;k++){const x=(k-(count-1)/2)*15;p.push(rect(x-2,-26+(k%2)*6,4,36,true),oval(x,-34+(k%2)*6,3+Math.sin(t*3+k)*.7,7));}
  const slice=e>0?e*25:0;if(slice)p.push(poly([[0,12],[slice,84],[102,72],[102,12],[0,12]],true));
  for(const side of [-1,1]){const bx=side*192,by=-46+Math.sin(t*.7+side)*5;p.push(oval(bx,by,31,41),curve([bx,by+41],[bx-20,by+70],[bx+17,83],[bx,117]));}
 }
 if(id===8){
  p.push(rect(-71,-57,151,146,true),rect(-32,-108,69,51),rect(-26,-100,57,43),oval(-48,95,9),oval(57,95,9));for(let k=0;k<9;k++)p.push(line([-56+k*15,-44],[-56+k*15,75]));
  p.push(poly([[-224,-103],[-131,-87],[-110,-25],[-140,25],[-219,19],[-238,-45],[-224,-103]]),curve([-221,-69],[-168,-102],[-162,38],[-133,-32]),line([125,90],[233,90]),rect(132,-126,96,211),rect(144,-112,73,107),oval(211,9,3));
  if(e>0)p.push(poly([[101,-48],[130,-79],[171,-89],[143,-59],[139,-26],[126,-23],[120,-52],[101,-48]],true));
 }
 return animateParts(id,era,t,p);
}
// Each miniature has its own objects and sequence of actions. These are
// movements of the drawn structure, in addition to the travelling ink nib.
function animateParts(id,era,t,program){
 const local=clamp(t,131,173),age=local-131,late=ramp(162,173,local);
 const begin=era===0?131:era===1?140+id*.23:156+id*.19;
 const grow=ramp(begin,173,local),act=ramp(begin,begin+7,local);
 let p=program.map(op=>({...op,points:op.points.map(q=>q.slice())}));
 const move=(op,dx=0,dy=0,angle=0,cx=0,cy=0,sx=1,sy=1)=>({...op,points:op.points.map(([x,y])=>{x=(x-cx)*sx;y=(y-cy)*sy;return [cx+x*Math.cos(angle)-y*Math.sin(angle)+dx,cy+x*Math.sin(angle)+y*Math.cos(angle)+dy];})});
 if(id===0){
  if(era===0){
   const lift=ramp(132,136,local)*(1-ramp(138.5,143,local));
   p=p.map((op,k)=>[9,20,21].includes(k)?move(op,-17*lift,-36*lift,-.12*lift,0,-55):k>=10&&k<=19?move(op,0,0,age*.42,3,13):op);
  }else{
   const last=era===1?22:13,lean=.10*Math.sin((local-begin)*.29)*(1-.5*late);
   p=p.map((op,k)=>k>=6&&k<=last?move(op,0,-7*act,lean,0,35):op);
   // The screen visibly fills with a new exchange; existing rows rise away.
   const scroll=(local-begin)*(era===1?8:12);
   for(let k=0;k<6;k++){const y=-68+k*20-scroll%20;if(y>-83&&y<61){const width=18+55*hash(k+Math.floor(scroll/20)*11);p.push(poly([[-39,y],[-39+width*ramp(k*.32,k*.32+1.5,local-begin),y]],false,1.4));}}
  }
 }
 if(id===1){
  if(era===0){
   const shift=-38*ramp(131,141,local),rise=-25*ramp(132,143,local);
   p=p.map((op,k)=>k>=13&&k<=16?move(op,shift,rise):op);
   for(let k=0;k<5;k++)p.push(line([-48+shift,-91+rise+k*11],[-48+shift+95*ramp(131.3+k*1.35,132.5+k*1.35,local),-91+rise+k*11]));
  }else{
   p=p.map((op,k)=>k===12||k===13||(k>=40&&k<(era===2?48:46))?move(op,0,0,0,0,41,1,.68+.32*act):op);
   const cursor=-75+140*((local-begin)*.23%1);p.push(line([cursor,30],[cursor+10,30]));
   if(era===2)for(let k=0;k<5;k++){const h=(16+k*7)*( .3+.7*ramp(begin+k*.8,172.9,local));p.push(rect(-2+k*15,14-h,8,h,true));}
  }
 }
 if(id===2){
  const previous=era===0?null:era===1?[140.46,145.46]:[156.38,161.38];
  const outgoing=era===0?[140.46,145.46]:era===1?[156.38,161.38]:null;
  const inScatter=previous?1-ramp(previous[0]+2.76,previous[1],local):0;
  const outScatter=outgoing?ramp(outgoing[0],outgoing[0]+2.24,local):0;
  const scatter=Math.max(inScatter,outScatter);
  p=p.map((op,k)=>{
   if(k>=program.length-16)return op;
   const x=op.points.reduce((s,q)=>s+q[0],0)/op.points.length;
   const y=op.points.reduce((s,q)=>s+q[1],0)/op.points.length;
   const angle=(hash(k*37+11)-.5)*.8*scatter,dx=(x*.42+(hash(k*19)-.5)*78)*scatter,dy=(y*.40+(hash(k*13)-.5)*78)*scatter;
   const built=move(op,dx,dy,angle,x,y,1,era===2?mix(.89,1.04,grow):1);
   if(era===2&&k>2){built.reveal=ramp(158+k*.035,162+k*.035,local);built.opacity=.40+.60*ramp(164+(k%17)*.32,172.8,local);}
   return built;
  });
 }
 if(id===3){
  // The street passes continuously; vehicles progress rather than bouncing.
  const speed=era===0?18:era===1?36:57;
  p=p.map((op,k)=>{
   if(k>=2&&k<22)return move(op,-((age*speed)%27));
   if(k>=22&&k<36)return move(op,-((age*(speed*.43))%72));
   if(k>=36)return move(op,mix(-35,44,grow),-3*Math.sin(age*2.5),0,0,0,.90+.10*act,1);
   return op;
  });
  for(let k=0;k<4;k++){const x=240-((age*speed*3+k*127)%490);p.push(line([x,-96+k*21],[x+26+era*9,-96+k*21]));}
 }
 if(id===4){
  const gather=ramp(132,140,local),leave=ramp(153,168,local);
  p=p.map(op=>{
   const x=op.points.reduce((s,q)=>s+q[0],0)/op.points.length,y=op.points.reduce((s,q)=>s+q[1],0)/op.points.length;
   if(Math.abs(x)>172&&y>-12)return move(op,Math.sign(x)*(mix(30,0,gather)+leave*27),leave*8);
   if(x>-110&&x<-32&&y>-12&&y<60)return move(op,20*gather-13*late,-10*late);
   if(x>35&&x<110&&y>-12&&y<60)return move(op,-20*gather,leave*14);
   return op;
  });
  const q=(local-131)*.18;p.push(curve([-83,-12],[-98+Math.sin(q)*10,-35],[-51,-42],[-71+Math.cos(q)*12,-68]));
 }
 if(id===5){
  p=p.map((op,k)=>{
   if(k>=16&&k<21)return move(op,0,-10*grow,0,0,87,mix(.80,1.08,grow),mix(.79,1.08,grow));
   if(k>=21&&op.points.every(q=>q[0]>100))return move(op,-17*grow,-14*grow,-.08*grow,166,88);
   return op;
  });
  const height=mix(52,-87,ramp(132,173,local));p.push(line([-234,height],[-172,height]));
  for(let k=0;k<4;k++){const x=115+k*21,y=89-43*ramp(151+k*2.8,161+k*2.8,local);p.push(line([x,89],[x,y],[x+14,y],[x+14,89]));}
 }
 if(id===6){
  const tend=ramp(133,153,local),heavy=ramp(153,173,local);
  p=p.map((op,k)=>k>=8&&k<=9?move(op,-22*tend,0,-.09*heavy,82,100):k>=10&&k<=13?move(op,-35*tend,0):k>=14&&k<=17?move(op,14*heavy,-8*heavy,.14*heavy,-103,29):op);
  // A strip is opened one pocket at a time and the small tablets settle down.
  for(let k=0;k<5;k++){const u=ramp(138+k*5.4,143+k*5.4,local),x=93+k*18;p.push(oval(x,74+21*u,4,4));p.push(line([x-6,62],[x+6,62],[x+6,84-20*u]));}
 }
 if(id===7){
  const cut=ramp(142,171.8,local),slice=era>0?24+36*cut:0;
  p=p.map(op=>{
   if(op.points.length===5&&op.points[0][0]===0&&op.points[0][1]===12)return move(op,slice,8*cut,.10*cut,45,55);
   if(op.points.every(q=>Math.abs(q[0])>140))return move(op,Math.sign(op.points[0][0])*grow*13,-grow*27);
   return op;
  });
  // Knife travels down through the cake; candles bend and extinguish in sequence.
  const knife=ramp(136,153,local);p.push(poly([[26,-96+105*knife],[39,-108+105*knife],[69,-32+105*knife],[61,-17+105*knife],[26,-96+105*knife]],true));
  p=p.map(op=>{
   const xs=op.points.map(q=>q[0]),ys=op.points.map(q=>q[1]),cx=xs.reduce((a,b)=>a+b,0)/xs.length;
   if(op.points.length>40&&Math.max(...ys)<0&&Math.max(...xs)-Math.min(...xs)<12){op.opacity=1-ramp(162+(cx+80)*.05,164+(cx+80)*.05,local);return move(op,Math.sin(local*4+cx)*2,0);}
   return op;
  });
 }
 if(id===8){
  const packed=ramp(132,148,local),departure=ramp(153,173,local),opening=ramp(151,169,local);
  p=p.map((op,k)=>{
   if(k<=13)return move(op,70*departure,-2*Math.sin(departure*Math.PI),-.04*departure,0,89,.93+.07*packed,1);
   if(k>=14&&k<=15)return move(op,138*packed,-16*Math.sin(packed*Math.PI),packed*.44,-177,-30,.8-.28*packed,.8-.28*packed);
   if(k>=18&&k<=19)return move(op,0,0,0,144,0,mix(1,.38,opening),1);
   return op;
  });
  p.push(line([-230,108],[-230+360*departure,108]));
 }
 return p;
}
export function programCells(program){const polygons=program.filter(p=>p.fill).map(p=>p.points),out=[];for(let y=-132;y<=116;y+=10)for(let x=-238;x<=238;x+=10)if(polygons.some(p=>insidePolygon(x,y,p)))out.push([x,y]);return out.length?out:[[0,0]];}
export const LIFE_CELLS=Array.from({length:9},(_,id)=>Array.from({length:3},(_,era)=>programCells(lifeProgram(id,era,170))));
