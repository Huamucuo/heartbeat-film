import {TAU,mix,ramp,blend} from './drawing.mjs';
import {Solid,rotate} from './solids.mjs';
import {cylinder,ellipsoid,rod,book,mug} from './model-kit.mjs';
import {phaseFor,RELEASE_START,ENDING_START} from './life-direction.mjs';
import {shoe,backpack,toyTrain,doorway} from './life-props.mjs';
export const LIFE_NAMES=['联系','读书与工作','住处','通勤','相伴','成长','身体','生日','远行'];
export const ANCHORS=[[-640,-285,30],[0,-285,-10],[630,-275,55],[-640,30,-30],[0,30,-40],[630,35,30],[-635,360,60],[0,360,-20],[630,360,60]];
export const modelPhase=phaseFor;
function stage(s,color=[80,103,105]){s.group=-20;s.box(0,114,20,410,15,236,color);s.group=-19;for(let i=0;i<9;i++)s.line([[-194+i*47,98.5,-93],[-194+i*47,98.5,132]],[156,154,130],.2,.65);s.group=0;}
function steam(s,x,y,z,t,a=1){for(let n=0;n<3;n++){const p=[];for(let j=0;j<=20;j++){const u=j/20;p.push([x+Math.sin(u*7+t*1.5+n)*4+n*3,y-u*42,z]);}s.line(p,[211,208,179],a*.27,.8);}}
function desk(s,t,p,q){
 stage(s,[104,86,68]);
 s.group=-3;s.box(0,99,128,394,257,8,[50,76,78]);s.layer=1;s.box(74,-14,122,130,123,4,[146,134,98]);s.box(74,-20,118,116,111,3,[34,57,72]);s.layer=2;s.box(74,-18,115,4,116,2,[178,162,113]);s.box(74,-64,115,120,4,2,[178,162,113]);s.layer=0;s.group=0;
 s.box(-121,-25,87,113,7,49,[120,92,60]);for(let k=0;k<5;k++)s.box(-163+k*17,-32,87,12,45+(k%3)*8,37,[[161,96,64],[91,127,117],[183,154,104]][k%3]);
 s.box(0,19,7,275,12,139,[165,127,79]);for(const x of [-120,120])for(const z of [-45,57])s.box(x,99,z,9,83,9,[79,87,82]);
 for(let k=0;k<10;k++)s.line([[-130,6.7,-55+k*13],[130,6.7,-53+k*13]],[214,178,118],.13,.6);
 book(s,90,7,20,42,62,[143,74,59],12);book(s,94,-6,20,37,57,[91,119,116],8);mug(s,-85,7,-29);steam(s,-85,-11,-29,t);
 s.box(97,7,-34,32,5,25,[86,100,92]);rod(s,[97,7,-34],[101,-56,-25],3,[174,159,117]);rod(s,[101,-56,-25],[68,-82,-20],3,[174,159,117]);cylinder(s,66,-70,-20,21,15,[202,175,112],1,24,8);
 const paper=1-p;s.face([[-70,4,-28],[0,-1,-38],[0,1,45],[-70,6,35]],[224,211,171],paper);s.face([[0,-1,-38],[70,4,-28],[70,6,35],[0,1,45]],[237,223,180],paper);
 for(let j=0;j<8;j++)s.line([[-62,3,-20+j*7],[-8,1,-27+j*7]],[104,102,85],paper*.5,.7);
 const turn=.12+.22*Math.sin(t*.75);s.face([[0,4,-36],[Math.cos(turn)*52,4-Math.sin(turn)*52,-28],[Math.cos(turn)*52,6-Math.sin(turn)*52,33],[0,6,41]],[233,220,181],paper*.8);rod(s,[-105,5,39],[-51,5,55],1.8,[184,146,76],paper);rod(s,[-51,5,55],[-45,5,57],1,[67,72,60],paper);
 const cx=0,front=-23.5,crt=p*(1-q);s.box(cx,7,10,55,5,45,[130,143,123],crt);s.box(cx,2,10,18,37,20,[130,143,123],crt);s.box(cx,-35,15,114,85,75,[174,180,145],crt);s.layer=1;s.box(cx,-43,front,98,68,2,[43,69,66],crt);
 for(let j=0;j<5;j++)s.line([[-38,-101+j*10,front-2],[25+Math.sin(t*.6+j)*12,-101+j*10,front-2]],[135,169,132],crt*.65,1.1);
 s.layer=0;s.box(0,10,mix(-61,-54,q),mix(119,127,q),6,mix(40,70,q),[153,157,134],p);
 for(let j=0;j<4;j++)for(let k=0;k<12;k++)s.box(-49+k*9,3,-73+j*8,6,1.5,5,[63,83,81],p);
 const lid=new Solid();lid.box(0,0,0,127,80,5,[142,166,162],q);lid.layer=1;lid.box(0,-6,-3,116,68,1,[18,43,49],q);for(let j=0;j<6;j++)lid.line([[-47,-65+j*9,-4],[31+Math.sin(t+j)*10,-65+j*9,-4]],[122,163,150],q*.5,.8);lid.transform(v=>{const r=rotate(v,-.12+Math.sin(t*.37)*.025,0,0);return [r[0],r[1]+4,r[2]-22];});s.faces.push(...lid.faces);s.lines.push(...lid.lines);rod(s,[-55,4,-21],[55,4,-21],2.5,[103,125,118],q,12);
}
function dwelling(s,t,p,q){
 stage(s,[77,105,102]);const height=mix(116,207,p)+q*21,w=mix(170,139,p),d=98;
 s.box(0,99,20,w,height,d,[167,166,133]);const roof=1-p;
 s.face([[-97,99-height,-45],[0,42-height,-45],[0,42-height,88],[-97,99-height,88]],[166,97,72],roof);s.face([[0,42-height,-45],[97,99-height,-45],[97,99-height,88],[0,42-height,88]],[194,121,80],roof);
 s.face([[-85,99-height,-30],[85,99-height,-30],[0,49-height,-30]],[190,177,140],roof);
 s.face([[85,99-height,69],[-85,99-height,69],[0,49-height,69]],[164,157,127],roof);
 s.line([[-97,99-height,-46],[0,42-height,-46],[97,99-height,-46]],[211,149,101],roof,3);
 s.box(52,80-height,51,22,44,24,[126,109,83],roof);
 steam(s,52,36-height,51,t,roof*.65);
 s.group=1;for(let row=0;row<6;row++)for(let col=0;col<3;col++){
  if(col===1&&row<2)continue;
  const aa=row<2?1:p,yy=74-row*31,xx=(col-1)*36,warm=((1+Math.sin(t*.55+row*1.8+col*2.7))/2)**6;s.layer=1;s.box(xx,yy,-30,22,22,2,[57,91,93],aa);s.layer=2;s.box(xx,yy-3,-31.5,16,16,1,blend([90,122,120],[228,193,118],warm),aa);
  s.line([[xx,yy-21,-33],[xx,yy,-33]],[171,170,140],aa*.7,.9);s.layer=0;
 }
 s.layer=3;s.box(0,99,-34,31,55,4,[87,80,61]);s.disc(8,74,2,-38,-37,[211,178,107]);s.layer=0;
 for(const side of [-1,1]){s.group=0;s.box(side*117,99,50,63,155+q*79,97,[78,108,115],p*q);s.group=1;for(let row=0;row<7;row++)for(let k=0;k<2;k++)s.box(side*117-16+k*29,79-row*27,.4,15,17,2,[158,170,147],p*q*.85);}
 s.group=2;
 for(let k=0;k<4;k++){cylinder(s,-120+k*30,99,-65,8,15,[122,92,66],roof);ellipsoid(s,-120+k*30,74,-65,14,19,13,[95,138,103],roof,8,5);}
}
function transit(s,t,p,q){
 stage(s,[68,92,105]);for(let n=0;n<7;n++)s.box(-185+n*64+((t*25)%64),99,21,32,1,5,[205,190,141]);
 const bike=1-p;for(const x of [-83,85]){s.disc(x,60,38,-13,1,[43,53,52],bike,30);s.disc(x,60,32,-14,-13,[128,144,136],bike,30);for(let k=0;k<12;k++){const a=k/12*TAU+t*2;s.line([[x,60,-15],[x+Math.cos(a)*31,60+Math.sin(a)*31,-15]],[208,204,169],bike*.8,.8);}}
 for(const [A,B] of [[[-83,60,-15],[-35,4,-15]],[[-35,4,-15],[18,60,-15]],[[18,60,-15],[-83,60,-15]],[[-35,4,-15],[64,4,-15]],[[64,4,-15],[18,60,-15]],[[64,4,-15],[85,60,-15]]])rod(s,A,B,3.5,[154,110,79],bike);
 s.box(-32,-1,-15,36,7,17,[57,63,54],bike);rod(s,[64,4,-15],[57,-20,-15],3,[113,135,128],bike);s.box(52,-19,-15,32,4,5,[98,116,111],bike);
 s.disc(18,60,12,-21,-17,[97,121,111],bike,24);s.line([[-83,51,-21],[18,48,-21],[30,60,-21],[18,72,-21],[-83,68,-21]],[202,191,149],bike*.75,1);const crank=t*2;rod(s,[18-Math.cos(crank)*14,60-Math.sin(crank)*14,-23],[18+Math.cos(crank)*14,60+Math.sin(crank)*14,-23],2,[193,188,155],bike);s.box(18+Math.cos(crank)*14,60+Math.sin(crank)*14,-23,15,4,10,[66,80,75],bike);
 const len=mix(267,330,q),top=mix(14,3,q),col=blend([119,161,164],[207,205,174],q);
 s.rounded(-len/2,top,len,66,12,-24,48,col,p);s.layer=1;s.box(0,72,-25,len-8,14,2,blend([159,103,73],[65,118,132],q),p);
 for(let k=0;k<7;k++){s.box(-len*.39+k*len*.115,top+33,-26,len*.087,25,2,[30,64,78],p);s.line([[-len*.39+k*len*.115-8,top+11,-28],[-len*.39+k*len*.115+7,top+28,-28]],[167,183,174],p*.5,.8);}
 s.layer=2;for(const x of [-len*.32,len*.32]){s.disc(x,79,18,-32,-22,[30,43,46],p,24);s.disc(x,79,9,-33,-32,[163,179,168],p,20);}
 s.layer=0;s.box(30,top-1,18,84,7,46,[115,140,139],p*q);s.line([[-190,99,-48],[190,99,-48]],[184,182,151],q,.9);s.line([[-190,99,66],[190,99,66]],[184,182,151],q,.9);
 for(let k=0;k<11;k++)s.box(-175+k*35,100,9,8,2,129,[108,108,91],q);
 for(const side of [-1,1]){s.box(side*(len/2-15),top+31,-27,18,27,2,[34,66,78],p*q);s.box(side*(len/2-8),top+53,-27,7,5,3,[237,213,153],p*q);}
 rod(s,[-10,top-8,18],[7,top-31,18],2,[95,111,108],q);rod(s,[7,top-31,18],[26,top-11,18],2,[95,111,108],q);rod(s,[26,top-11,18],[43,top-33,18],2,[95,111,108],q);s.box(25,top-33,18,54,3,12,[132,151,140],q);
}
function chair(s,x,z,a=1){s.box(x,41,z,44,8,41,[72,109,108],a);s.box(x,38,z+17,44,57,7,[91,128,120],a);for(const xx of [-17,17])for(const zz of [-14,14])s.box(x+xx,99,z+zz,5,58,5,[117,104,77],a);}
function dinner(s,t,p,q){
 stage(s,[96,87,72]);
 // The window and furniture are an actual room, all in one projection.
 s.group=-3;s.box(0,99,140,392,289,9,[71,88,85]);s.layer=1;s.box(0,-10,133,162,156,5,[135,129,100]);s.box(0,-17,129,143,141,3,[35,62,73]);
 s.layer=2;s.box(0,-14,125,5,147,2,[165,153,111]);s.box(0,-77,125,149,5,2,[165,153,111]);s.layer=0;s.group=0;
 for(const x of [-109,109])chair(s,x,15);
 cylinder(s,0,99,-30,10,88,[94,90,70],1,24);cylinder(s,0,15,-30,94,9,[168,127,77],1,48);
 for(let k=0;k<11;k++){const xx=-78+k*15.6,len=Math.sqrt(Math.max(0,88*88-xx*xx));s.line([[xx,5.5,-30-len],[xx,5.5,-30+len]],[208,171,109],.15,.6);}
 s.group=1;const left=1,right=p,plate=(x,aa)=>{cylinder(s,x,5,-40,23,2,[218,201,164],aa,32);cylinder(s,x,2.8,-40,18,1,[177,152,104],aa,28);s.line([[x-27,3,-46],[x-27,3,-14]],[219,216,181],aa,1.8);s.line([[x+27,3,-45],[x+27,3,-14]],[219,216,181],aa,1.8);};
 plate(-46,left);plate(46,right);
 mug(s,-48,5,-5,[205,183,135],left);mug(s,48+12*(1-p),5-35*(1-p),-5,[149,180,172],right);
 steam(s,-48,-15,-5,t,.85);steam(s,48,-15,-5,t+1,right*(1-q));
 // A tea stain stays after the second cup has gone cold.
 const stain=[];for(let j=0;j<=48;j++){const a=j/48*TAU;stain.push([48+Math.cos(a)*12,4.7,-5+Math.sin(a)*12]);}s.line(stain,[89,69,42],q*.45,.9);
 cylinder(s,0,5,-45,9,29,[85,125,114],p,24);for(let i=0;i<3;i++){const tip=[(i-1)*11+q*13,-57+Math.sin(t*.7+i)*2+q*17,-45];rod(s,[0,-24,-45],tip,1,[99,126,85],p);ellipsoid(s,...tip,6,5,4,blend([198,147,102],[126,105,70],q),p,10,6);}
 const napkin=blend([218,205,164],[135,144,128],q);s.face([[64,4,-12],[85,4,-6],[80,4,15],[59,4,9]],napkin,p);
}
function relatives(s,t,p,q){
 stage(s,[91,104,91]);s.group=-3;s.box(0,99,127,390,265,8,[82,108,101]);s.group=0;
 doorway(s,111,99,98,1,q*.30);
 // Height marks remain while the toys leave. No human proxy is used.
 for(let k=0;k<7;k++){const aa=k<2?1:p,yy=56-k*25;s.line([[43,yy,86],[59,yy,86]],[219,208,157],aa,.9);s.disc(51,yy-3,1.3,85,86,[200,165,108],aa,10);}
 const h=55-p*146;s.line([[39,h,84],[66,h,84]],[244,199,110],.85,1.7);
 toyTrain(s,-64,98,-13,t,1-p);
 backpack(s,-76,99,15,p*(1-q));book(s,-3,99,-32,42,60,[166,102,70],11);book(s,0,87,-32,38,57,[75,120,118],9);
 for(const dx of [-18,18])shoe(s,-93+dx,99,-51+dx*.3,[159,126,83],1-q*.8,dx*.008,.55);
 // The grown child's luggage rolls through the frame; the marks stay.
 const bx=-68+q*139,by=88;s.rounded(bx-29,by-118,58,116,8,-8,30,[106,141,145],q);for(const d of [-1,1]){s.disc(bx+d*20,92,7,-9,-2,[39,61,64],q,20);rod(s,[bx+d*13,by-117,10],[bx+d*13,by-144,10],2,[192,187,147],q);}rod(s,[bx-13,by-144,10],[bx+13,by-144,10],3,[62,82,79],q);
 for(let k=0;k<5;k++)s.line([[bx-21+k*10,by-106,-9],[bx-21+k*10,by-10,-9]],[170,182,156],q*.7,.8);
}
function health(s,t,p,q){
 stage(s,[79,105,100]);
 for(let k=0;k<5;k++)s.box(-45,62,44+k*9,164,5,6,[137,116,81]);
 for(let k=0;k<4;k++)s.box(-45,43-k*10,87,164,6,5,[152,129,88]);
 for(const xx of [-111,21]){s.box(xx,99,79,5,87,5,[62,81,78]);s.box(xx,99,43,5,38,5,[62,81,78]);}
 for(const side of [-1,1])shoe(s,-67+side*38,99,-29+side*16,blend([162,170,129],[133,140,112],p),1,side*.14);
 // A once taut lace relaxes into a curve, followed by a cane and medicine.
 const lace=[];for(let j=0;j<=36;j++){const u=j/36;lace.push([-60+u*48,77+Math.sin(u*Math.PI)*(9+p*14),-35+Math.sin(u*8+t*.7)*(1-p)*3]);}s.line(lace,[220,211,174],1,1.2);
 rod(s,[19,-62,22],[43,96,11],3.5,[169,130,81],p);const handle=[];for(let j=0;j<=32;j++){const a=Math.PI+j/32*Math.PI;handle.push([30+Math.cos(a)*12,-60+Math.sin(a)*12,22]);}s.line(handle,[178,139,84],p,6);
 cylinder(s,96,99,3,18,62,[177,161,116],q,28);cylinder(s,96,37,3,19,10,[71,123,117],q,28);
 s.box(96,84,-16,25,31,1,[225,208,166],q);s.box(96,75,-17,3,17,1,[98,133,117],q);s.box(96,69,-17,13,3,1,[98,133,117],q);
 for(let k=0;k<16;k++){const a=k/16*TAU;rod(s,[96+Math.cos(a)*18,28,3+Math.sin(a)*18],[96+Math.cos(a)*18,36,3+Math.sin(a)*18],.5,[151,173,145],q,4);}
 mug(s,147,99,3,[155,176,157],q);for(let k=0;k<5;k++)ellipsoid(s,75+k*12,97,-39,5,2.5,3,k%2?[188,129,85]:[221,203,161],q,8,5);
}
function birthday(s,t,p,q){
 stage(s,[113,91,75]);cylinder(s,0,99,0,108,5,[198,188,150],1,36);const height=mix(70,13,q);
 cylinder(s,0,94,0,81,height,[174,102,81],1,36);cylinder(s,0,94-height,0,82,7,[228,202,155],1,36);
 for(let k=0;k<14;k++){const theta=k/14*TAU,x=Math.cos(theta)*75,z=Math.sin(theta)*75;ellipsoid(s,x,88-height,z,6,8,6,[172,75,56],1-q,10,6);for(let j=0;j<3;j++)ellipsoid(s,x+Math.sin(j*2.1)*3,84-height+j*3,z-5,1,.6,.6,[222,174,104],1-q,5,3);}
 for(let k=0;k<13;k++){const a=k*2.399;s.box(Math.cos(a)*(86+k*.6),96.2,Math.sin(a)*(83+k*.5),2.5+k%3,1.8,3,[165,119,78],q);}
 for(let k=0;k<18;k++){const a=k/18*TAU;ellipsoid(s,Math.cos(a)*76,90-height,Math.sin(a)*76,7,8+Math.sin(k)*3,7,[227,199,152],1-q,8,4);}
 for(let k=0;k<7;k++){
  const a=k===3?1:(k%3===0?1:p)*(1-q),x=(k-3)*18,z=Math.cos(k)*17,y=86-height,len=mix(36,13,q);
  cylinder(s,x,y,z,2.7,len,[218,184,135],a,8);ellipsoid(s,x+Math.sin(t*9+k)*1.2,y-len-5,z,2.6,6+Math.sin(t*7+k),2.6,[255,208,99],a*(1-q*.87),8,5);
 }
 for(const side of [-1,1]){const x=side*136,y=-44-Math.sin(t*.8+side)*8;ellipsoid(s,x,y,27,22,29,20,side<0?[137,164,164]:[184,139,104],1-q,10,7);s.line([[x,y+29,27],[x+Math.sin(t)*8,44,17],[side*100,96,0]],[177,172,144],(1-q)*.65,.9);}
 if(q>.2)steam(s,0,70-height,0,t,q*.6);
}
function luggage(s,t,p,q){
 stage(s,[81,98,107]);const w=mix(88,124,p),h=mix(126,155,p),bottom=mix(99,91,p),top=bottom-h,col=blend([135,115,89],[103,139,155],p);
 s.rounded(-w/2,top,w,h,12,-25,25,col);s.layer=1;s.rounded(-w/2+9,top+65,w-18,43,5,-28,-26,[119,97,71],1-p);
 for(let k=0;k<7;k++)s.line([[-w/2+12+k*(w-24)/6,top+12,-28],[-w/2+12+k*(w-24)/6,81,-28]],blend(col,[225,216,179],.38),p*.75,1.1);
 s.layer=0;for(const side of [-1,1]){rod(s,[side*19,top+2,0],[side*19,top-15-q*34,0],2.4,[166,177,167]);s.disc(side*43,91,8,-20,10,[36,52,57],p,24);s.line([[side*w/2,top+22,20],[side*(w/2+17),top+50,32],[side*(w/2+15),75,26],[side*w/2,82,20]],[87,78,60],1-p,5);}
 rod(s,[-19,top-15-q*34,0],[19,top-15-q*34,0],4,[74,88,85]);
 doorway(s,126,99,58,q,q*.2);
 s.layer=1;for(let k=0;k<25;k++)s.box(-w/2+4,top+8+k*(h-16)/25,-28,2,1.4,1.3,[201,186,144],p);s.disc(-w/2+4,top+23,2.5,-30,-29,[224,194,132],p,12);s.layer=0;
 s.face([[w/2-6,top+31,-30],[w/2+21,top+38+Math.sin(t*2)*3,-31],[w/2+15,top+60,-31],[w/2-12,top+53,-30]],[214,195,150],p);
}
const DRAW=[null,desk,dwelling,transit,dinner,relatives,health,birthday,luggage];
export function localLifeModel(id,t){const s=new Solid(),{p,q}=modelPhase(id,t);if(id>0)DRAW[id](s,t,p,q);return s;}
export function lifeTransform(id,point,t){
 const a=ANCHORS[id],angle=.035*Math.sin(t*.24+id),local=rotate(point,.055,angle,0),birth=ramp(132+id*.8,134+id*.8,t),v=[a[0]+local[0],a[1]+local[1]+(1-birth)*100,a[2]+local[2]];
 const move=ramp(315,323,t);if(!move)return v;
 const order=[0,1,2,5,8,7,6,3],theta=id===4?Math.PI/2:order.indexOf(id)/8*TAU-Math.PI*.75+(t-315)*.018;
 const dest=id===4?[0,10,-120]:[Math.cos(theta)*805,Math.sin(theta)*365,310+Math.sin(theta)*150];
 const r=rotate(point.map(x=>x*.87),-.05,Math.sin(theta)*.27,Math.cos(theta)*.04),pnt=v.map((x,j)=>mix(x,dest[j]+r[j],move));
 const exit=id===4||id===7?ramp(325,330,t):ramp(328+id*.10,335+id*.1,t);
 return [pnt[0]+Math.cos(theta)*exit*1490,pnt[1]+Math.sin(theta)*exit*1080,pnt[2]+exit*700];
}
export function lifeModel(id,t){return localLifeModel(id,t).transform(p=>lifeTransform(id,p,t));}
