import {mix,ramp,gate,blend,TAU} from './drawing.mjs';
import {Solid} from './solids.mjs';
import {rod,cylinder,ellipsoid} from './model-kit.mjs';
import {housingLight} from './life-lighting.mjs';
import {buildingParts,assembleBuildings} from './building-assembly.mjs';
const stone=[170,157,126],dark=[37,60,64],trim=[196,183,146],ochre=[176,110,76],steel=[92,125,124];
function window(s,x,y,z,w,h,warm=0,a=1,curtain=false){
 s.box(x,y,z,w+5,h+5,7,stone,a);s.box(x,y-2,z-4,w,h,2,dark,a);
 s.box(x,y-4,z-5,w-5,h-5,1,blend([61,95,102],[221,179,100],warm),a);
 s.box(x,y+1,z-6,w+10,3,11,trim,a);s.box(x,y-2,z-6,1.5,h,1,trim,a);
 if(curtain)for(const side of [-1,1])s.face([[x+side*w*.45,y-h+1,z-6.5],[x+side*w*.08,y-h+1,z-6.5],[x+side*w*.28,y-3,z-6.5],[x+side*w*.45,y-3,z-6.5]],blend(trim,[151,139,123],.2),a*.9);
}
function door(s,x,y,z,a=1){
 s.box(x,y,z,34,62,5,stone,a);s.box(x,y,z-3,27,56,3,[71,77,64],a);s.box(x,y-7,z-5,21,21,1,[83,93,78],a);s.box(x,y-33,z-5,20,17,1,[124,145,126],a);
 s.disc(x+8,y-26,1.5,z-7,z-6,[218,177,101],a,12);
}
function house(t){
 const s=new Solid();s.box(-27,99,16,168,112,110,[182,166,129]);s.box(-27,100,16,179,8,117,[125,122,101]);
 const top=-13,ridge=-72;
 s.face([[-119,top,-49],[-27,ridge,-49],[-27,ridge,82],[-119,top,82]],ochre);s.face([[-27,ridge,-49],[65,top,-49],[65,top,82],[-27,ridge,82]],[197,125,83]);
 s.face([[-111,top,-40],[57,top,-40],[-27,ridge+4,-40]],[205,183,142]);
 // Thick eaves, individual tile courses and ridge caps.
 s.line([[-119,top,-49],[-27,ridge,-49],[65,top,-49]],[227,162,112],1,3);
 for(const side of [-1,1])for(let k=1;k<7;k++){const u=k/7,x=-27+side*92*u,y=mix(ridge,top,u)-.5;s.line([[x,y,-49],[x,y,82]],[105,77,59],.43,.9);}
 for(let k=0;k<15;k++){const z=-47+k*9;s.line([[-117,-14,z],[-27,-73,z],[63,-14,z]],[226,154,106],.37,.7);}
 rod(s,[-27,-72,-49],[-27,-72,84],2.7,[202,127,81],1,10);
 s.box(15,-41,50,19,47,21,[126,104,81]);s.box(15,-86,50,24,4,25,stone);
 s.layer=1;window(s,-78,49,-42,25,31,.25,1,true);window(s,24,49,-42,25,31,.18,1,true);door(s,-27,99,-44);
 s.box(-27,102,-61,46,5,30,trim);s.box(-27,105,-73,55,4,17,stone);
 s.box(-27,41,-59,44,4,32,ochre);for(const x of [-49,-5])rod(s,[x,99,-72],[x,38,-72],1.9,trim);
 for(let row=0;row<4;row++)for(let col=0;col<9;col++){const x=-104+col*18+(row%2)*9;if(x>-49&&x<-6)continue;s.line([[x,64+row*8,-40.8],[x+14,64+row*8,-40.8]],stone,.35,.65);}
 s.layer=0;s.box(125,99,29,89,49,7,[128,135,109]);for(let i=0;i<5;i++)s.box(88+i*18,53,29,15,5,10,trim);
 for(const x of [83,167]){s.box(x,100,29,10,66,14,stone);s.box(x,36,29,15,4,20,trim);}
 // A lived-in courtyard: a laundry line, terracotta pots, leaves, doorstep.
 rod(s,[85,39,27],[160,39,27],.5,trim);for(let k=0;k<3;k++){const x=101+k*18,wind=Math.sin(t*.7+k)*1.5;s.face([[x,40,24],[x+12,40,24],[x+11+wind,59,23],[x+wind,59,23]],[170-k*25,176-k*18,148-k*10]);}
 for(const x of [-111,60]){cylinder(s,x,99,-57,9,15,ochre,1,22,12);for(let k=0;k<6;k++){const a=k/6*TAU,tip=[x+Math.cos(a)*12,72+Math.sin(t*.7+k),-57+Math.sin(a)*10];rod(s,[x,86,-57],tip,1,[108,131,90]);s.face([tip,[tip[0]+6,tip[1]-3,tip[2]+1],[x,84,-57]],[112,143,98]);}}
 return s;
}
function apartment(t){
 const s=new Solid();s.box(0,99,18,164,226,111,[176,167,137]);s.box(0,100,18,173,9,119,[117,127,114]);
 // Stairwell separates two stacks of flats; floors have real projecting balconies.
 s.box(-18,88,-39,34,209,5,[115,137,129]);
 for(let row=0;row<4;row++){
  const y=53-row*48;s.layer=1;window(s,-19,y+11,-45,15,29,.14);
  for(const side of [-1,1]){const x=side<0?-60:42;window(s,x,y,-41,side<0?22:45,30,((row+2)%3===0)?.55:.08,1,row%2===0);
   if(side===1){s.box(x,y+7,-55,64,4,36,trim);s.box(x,y+6,-69,64,17,2,[151,149,121]);for(let k=0;k<8;k++)rod(s,[x-29+k*8,y-11,-70],[x-29+k*8,y+4,-70],.7,steel);rod(s,[x-31,y-12,-70],[x+31,y-12,-70],1,steel);
    if(row%2===0){s.box(x+17,y-10,-59,16,5,7,ochre);ellipsoid(s,x+17,y-16,-59,9,6,5,[105,133,90],1,14,8);}
   }
  }s.layer=0;
  s.box(0,y-39,-39,164,3,5,[150,149,125]);
 }
 s.layer=1;door(s,-19,99,-46);s.box(-18,40,-57,47,4,37,[127,146,130]);s.box(-18,100,-65,44,4,35,trim);s.layer=0;
 s.box(0,-127,18,173,6,119,stone);for(const z of [-39,73])s.box(0,-130,z,173,12,4,[152,151,129]);for(const x of [-84,84])s.box(x,-130,18,4,12,111,[152,151,129]);
 s.box(35,-133,26,55,20,52,[133,149,133]);cylinder(s,-49,-134,39,14,25,[116,140,134],1,28);cylinder(s,-49,-159,39,15,3,trim,1,28);
 for(const y of [-120,-70,-20,28]){s.box(88,y,30,14,10,24,[161,166,143]);for(let k=0;k<5;k++)s.line([[96,y-8+k*2,18],[96,y-8+k*2,42]],dark,.5,.7);}
 rod(s,[-67,-142,52],[-67,-178,52],1.1,steel);rod(s,[-82,-171,52],[-51,-171,52],.8,steel);
 return s;
}
function tower(t){
 const s=new Solid();
 // Different footprints and staggered massing make a city, not replicated boxes.
 for(const b of [{x:-139,z:83,w:91,h:213,d:85},{x:133,z:128,w:101,h:272,d:80}]){
  s.group=-3;s.box(b.x,99,b.z,b.w,b.h,b.d,[68,99,111]);for(let row=0;row<9;row++){const y=78-row*29;s.box(b.x,y,b.z-b.d/2-1,b.w+4,3,6,[92,118,123]);for(let col=0;col<3;col++)s.box(b.x-b.w*.3+col*b.w*.3,y-4,b.z-b.d/2-2,12,17,2,[47,76,89]);}
 }
 s.group=0;s.box(0,99,10,167,263,117,[128,153,147]);s.box(0,-164,18,119,17,87,[141,158,148]);s.box(0,-181,22,73,12,64,[134,149,140]);
 // Recessed windows sit behind vertical ribs and stone floor bands.
 s.layer=1;for(let row=0;row<8;row++){
  const y=78-row*30;for(let col=0;col<4;col++){
   const x=-60+col*40,chosen=row===6&&col===2;
   const warm=chosen?.93:((row*7+col*3)%13===0?.15:0);window(s,x,y,-51,24,22,warm,1,chosen);
  }
  s.box(0,y+5,-54,173,3,8,[173,177,153]);
 }
 for(const x of [-83,-41,0,41,83])s.box(x,99,-56,4,260,11,[179,183,160]);
 s.layer=2;s.box(0,99,-61,44,57,6,[59,95,101]);s.box(0,44,-71,66,5,42,trim);s.box(0,100,-79,67,4,47,stone);s.line([[0,47,-65],[0,99,-65]],trim,.8,1.4);
 // Only one room remains warmly lit as the city fills the field.
 s.layer=0;
 return s;
}
const partCache=[];
function pieces(index){if(!partCache[index])partCache[index]=buildingParts([house,apartment,tower][index](188));return partCache[index];}
export function dwellingModel(s,t,p,q){
 const wide=gate(180,198,t,2.2),extent=211;
 s.group=-20;s.box(0,114,20,extent*2,15,236,[78,100,97]);s.group=-19;
 for(let k=-4;k<=4;k++)s.line([[k*47,98.5,-93],[k*47,98.5,132]],[174,158,123],.14,.6);
 const L=housingLight(t),dx=L.shadow*(70+q*80),x=p<.5?-27:0;
 s.group=-18;s.face([[x-76,98.2,-39],[x+76,98.2,-39],[x+76+dx,98.2,113],[x-76+dx,98.2,113]],[18,35,42],gate(180,198,t,2.15)*L.day*.42,.7);s.group=0;
 let models;
 if(p<=0)models=[house(t)];
 else if(p<1)models=[assembleBuildings(pieces(0),pieces(1),p,0)];
 else if(q<=0)models=[apartment(t)];
 else if(q<1)models=[assembleBuildings(pieces(1),pieces(2),q,1)];
 else models=[tower(t)];
 for(const m of models){s.faces.push(...m.faces);s.lines.push(...m.lines);}
 s.group=0;
}
