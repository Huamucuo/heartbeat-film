import {TAU,clamp,mix,ramp,lerp3} from './drawing.mjs';
import {livingWave} from './motion.mjs';
import {rotate} from './solids.mjs';

// These are lived scenes, not numbered nodes. Labels are editorial metadata;
// the movie shows the objects and actions themselves.
export const SCENES=[
 {name:'联系',anchor:[-640,-275,70],scale:1.02,states:['拨盘电话','按键手机','触屏中的对话']},
 {name:'读书与工作',anchor:[-15,-275,-10],scale:1.03,states:['课桌与书','台式机与文件','夜里的办公桌']},
 {name:'住处',anchor:[605,-260,90],scale:.98,states:['屋檐下的家','公寓','高楼中的一扇窗']},
 {name:'通勤',anchor:[-640,45,-60],scale:1.03,states:['自行车','公共汽车','列车']},
 {name:'相伴',anchor:[0,35,30],scale:1.13,states:['两个人的餐桌','相伴的日子','桌子的另一边空了']},
 {name:'家人',anchor:[610,50,15],scale:1.00,states:['牵着孩子','孩子长大','一个人留下']},
 {name:'身体',anchor:[-635,365,90],scale:1.00,states:['奔跑','疲惫','拐杖与药']},
 {name:'生日',anchor:[-5,365,-30],scale:1.01,states:['生日蛋糕','更多蜡烛','一支烧短的蜡烛']},
 {name:'远行',anchor:[615,370,100],scale:1.04,states:['书包','行李箱','门口的旅行箱']}
];

class Ink {
 constructor(){this.items=[];this.transform=[0,0,1,1];}
 add(points,a=.65,w=1.35,close=false,fill=0,role=0){
  const [x,y,sx,sy]=this.transform;
  this.items.push({points:points.map(p=>[x+p[0]*sx,y+p[1]*sy]),alpha:clamp(a),width:w,close,fill,role});
 }
 line(x1,y1,x2,y2,a=.65,w=1.35,role=0){this.add([[x1,y1],[x2,y2]],a,w,false,0,role);}
 poly(p,a=.65,w=1.35,fill=0,role=0){this.add(p,a,w,true,fill,role);}
 rect(x,y,w,h,a=.65,fill=0,role=0){this.poly([[x,y],[x+w,y],[x+w,y+h],[x,y+h]],a,1.4,fill,role);}
 arc(x,y,rx,ry,from=0,to=TAU,a=.65,w=1.35,role=0,fill=0){
  const pts=Array.from({length:49},(_,i)=>{const q=mix(from,to,i/48);return [x+Math.cos(q)*rx,y+Math.sin(q)*ry];});
  this.add(pts,a,w,to-from>=TAU-.01,fill,role);
 }
 curve(p,a=.65,w=1.35,role=0){
  const pts=Array.from({length:33},(_,i)=>{const u=i/32,v=1-u;return [0,1].map(k=>p[0][k]*v*v*v+3*p[1][k]*v*v*u+3*p[2][k]*v*u*u+p[3][k]*u*u*u);});
  this.add(pts,a,w,false,0,role);
 }
 group(x,y,sx,sy,draw){const prev=this.transform;this.transform=[prev[0]+x*prev[2],prev[1]+y*prev[3],prev[2]*sx,prev[3]*sy];draw();this.transform=prev;}
 floor(t,width=200){
  this.poly([[-width,94],[width*.7,94],[width,119],[-width*.67,119]],.17,.65,.009,2);
  for(let i=0;i<8;i++)this.line(-width+i*width*.23,96,-width+i*width*.23+26,113,.10+.015*Math.sin(t*.5+i),.6,2);
 }
}

function person(g,x,y,h,{a=.72,lean=0,step=0,arm=0,seated=false,old=0}={}){
 g.group(x,y,h/130,h/130,()=>{
  const dx=lean*20;
  g.arc(dx,-108,11,14,0,TAU,a,1.5,1,.028);
  g.curve([[dx-11,-112],[dx-9,-130],[dx+9,-127],[dx+11,-111]],a*.65,1.1,2);
  g.line(dx+6,-108,dx+12,-106,a*.6,.9);g.line(dx+4,-98,dx+10,-99,a*.5,.8);
  g.poly([[dx-6,-92],[-17,-85],[-21,-46],[17,-46],[14,-83],[dx+6,-92]],a*.65,1.5,.026,1);
  g.add([[dx-6,-92],[dx,-79],[dx+6,-92]],a*.45,.85,false,0,2);
  g.line(dx,-78,1,-50,a*.25,.7,2);
  g.curve([[-13,-82],[-30,-63+arm],[-28,-52+arm],[-37,-44+arm]],a,1.45);
  g.curve([[13,-82],[27,-60-arm],[25,-52-arm],[34,-42-arm]],a,1.45);
  g.poly([[-16,-83],[-29,-63+arm],[-30,-51+arm],[-26,-50+arm],[-24,-62+arm],[-11,-79]],a*.68,.7,.027);
  g.poly([[16,-83],[28,-60-arm],[28,-51-arm],[23,-50-arm],[22,-59-arm],[10,-79]],a*.68,.7,.027);
  const knee=seated?39:step*11;
  g.add([[-12,-45],[-17+knee,-23],[-21+step*18,0],[-8+step*18,0]],a,1.8);
  g.add([[11,-45],[19+knee,-23],[25-step*18,0],[38-step*18,0]],a,1.8);
  g.poly([[-16,-45],[-21+knee,-23],[-25+step*18,-1],[-15+step*18,-1],[-12+knee,-23],[-5,-45]],a*.65,.8,.027,2);
  g.poly([[6,-45],[14+knee,-23],[21-step*18,-1],[31-step*18,-1],[24+knee,-23],[16,-45]],a*.65,.8,.027,2);
  g.curve([[dx-8,-115],[dx,-122],[dx+6,-113],[dx+9,-114]],a*old,.9,2);
 });
}
function steam(g,x,y,t,a){for(let k=0;k<3;k++)g.curve([[x+k*8,y],[x-9+k*8+Math.sin(t*2+k)*4,y-12],[x+12+k*8,y-23],[x+k*8+Math.sin(t*1.5+k)*7,y-35]],a,.9,2);}
function mug(g,x,y,t,a=.65,hot=1){g.add([[x,y],[x+1,y+20],[x+25,y+20],[x+27,y]],a,1.3);g.arc(x+13,y,14,3,0,TAU,a,.95);g.arc(x+29,y+9,8,7,-Math.PI/2,Math.PI/2,a,1.3);steam(g,x+3,y-7,t,a*.30*hot);}
function book(g,x,y,w,h,t,a=.65){
 const turn=Math.sin(t*1.8)*4;
 g.poly([[x-w,y],[x-w,y-h],[x-7,y-h-8],[x,y-h-3],[x+w,y-h-9],[x+w,y],[x,y+5]],a,1.3,.012,1);
 g.line(x,y+5,x,y-h-3,a,1.2);g.curve([[x,y-h-3],[x-15+turn,y-h-30],[x-38,y-h-20],[x-w+2,y-h]],a*.55,.75);
 for(let i=0;i<4;i++){g.line(x-w+8,y-h+10+i*6,x-8,y-h+9+i*6,a*.30,.6,2);g.line(x+8,y-h+8+i*6,x+w-8,y-h+4+i*6,a*.30,.6,2);}
}

function telephone(g,t,p,q){
 const x=mix(-84,-38,p),y=mix(8,-96,p),w=mix(168,76,p),h=mix(71,169,p);
 g.floor(t,170);g.rect(x-4*q,y-9*q,w+8*q,h+9*q,.77,.024);
 const depth=mix(15,6,p);
 g.poly([[x-4*q,y-9*q],[x-4*q+depth,y-9*q-depth],[x+w+4*q+depth,y-9*q-depth],[x+w+4*q,y-9*q]],.38,1.0,.025,2);
 g.poly([[x+w+4*q,y-9*q],[x+w+4*q+depth,y-9*q-depth],[x+w+4*q+depth,y+h-depth],[x+w+4*q,y+h]],.34,1.0,.020,2);
 for(let k=0;k<11;k++)g.line(x+10+k*(w-20)/10,y+h-17,x+16+k*(w-20)/10,y+h-7,(1-p)*.17,.65,2);
 // The ten holes retain their order as the rotary dial becomes a keypad.
 g.arc(0,38,37*(1-.22*p),31,0,TAU,(1-p)*.72,1.5);
 g.arc(0,38,16,14,0,TAU,(1-p)*.6,1.0);
 for(let k=0;k<10;k++){
  const a=k/10*TAU-.45,dx=mix(Math.cos(a)*27,((k%3)-1)*21,p),dy=mix(38+Math.sin(a)*23,6+Math.floor(k/3)*15,p);
  g.arc(dx,dy,mix(4,3,p),mix(4,2.3,p),0,TAU,.65*(1-q),1.0);
 }
 const ring=Math.sin(t*7)*1.4*(1-p);
 g.add([[-77,-5+ring],[-78,-20+ring],[-60,-34+ring],[-27,-36+ring],[-24,-14+ring],[-45,-10+ring],[-40,-2+ring],[40,-2+ring],[44,-11+ring],[24,-15+ring],[28,-36+ring],[59,-34+ring],[78,-21+ring],[76,-5+ring]],(1-p)*.78,2,true,.012);
 for(const s of [-1,1])for(let k=0;k<6;k++)g.line(s*(31+k*5),-25+ring,s*(32+k*5),-17+ring,(1-p)*.34,.8,2);
 const cord=[];for(let k=0;k<=100;k++){const u=k/100;cord.push([-79-u*35+Math.sin(u*TAU*9)*6,19+u*65]);}g.add(cord,(1-p)*.5,1.0);
 g.rect(-28,-76-q*10,56,58+q*64,p*.73,.022,2);
 g.line(-11,-87-q*10,11,-87-q*10,p*.64,1.1);g.arc(0,62,4,4,0,TAU,p*.65,1.0);
 for(let i=0;i<3;i++){const yy=-59+i*22+q*5;g.rect(-20+(i%2)*8,yy,31,13,p*q*(.5+.14*Math.sin(t*1.8-i)),.008,1);}
 g.line(-28,41,28,41,q*.52,.8,2);
 for(let k=0;k<3;k++)g.arc(54,0,23+k*9,30+k*10,-.9,.9,(.16+.07*Math.sin(t*5-k))*q,.85,2);
}

function desk(g,t,p,q){
 g.floor(t,205);g.poly([[-135,31],[106,31],[142,55],[-106,55]],.65,1.4,.015);
 g.add([[-112,54],[-120,105],[-107,105]],.64,1.6);g.add([[120,54],[130,105],[117,105]],.64,1.6);
 g.line(-110,85,124,85,.30,.8,2);
 book(g,-35,20,49,40,t,.73*(1-p));
 g.poly([[-60,-96],[43,-96],[43,-18],[-60,-18]],p*(1-q)*.73,1.7,.018,1);
 g.poly([[43,-96],[67,-110],[65,-35],[43,-18]],p*(1-q)*.42,1.2,.018,2);g.poly([[-60,-96],[-38,-110],[67,-110],[43,-96]],p*(1-q)*.34,1,.015,2);
 for(let k=0;k<6;k++)g.line(48,-82+k*7,61,-91+k*7,p*(1-q)*.3,.8,2);
 g.rect(-52,-86,86,59,p*(1-q)*.55,.01,2);g.add([[-18,-17],[-18,-3],[-44,2],[25,2],[0,-3],[0,-17]],p*(1-q)*.6,1.2);
 // Screen stays in the same place as its thick CRT case becomes a laptop.
 g.poly([[-59,-74],[43,-74],[55,5],[-47,5]],q*.77,1.5,.02,1);g.poly([[-47,6],[55,6],[84,31],[-77,31]],q*.65,1.3,.02);
 for(let row=0;row<5;row++)g.line(-50+row*1.3,-68+row*12,31,-68+row*12,p*(.18+.09*Math.sin(t*1.4+row)),.9,2);
 for(let row=0;row<3;row++)for(let col=0;col<9;col++)g.rect(-51+col*12+row*3,12+row*5,7,2,p*.36,0,2);
 g.add([[91,29],[91,-9],[123,-39],[106,-61]],.59,1.6);g.poly([[90,-53],[113,-73],[140,-43]],.66,1.3,.035,1);
 g.poly([[118,-44],[59,29],[153,29]],(.011+.007*Math.sin(t*2))*q,.5,.026,1);
 mug(g,-122,13,t,.65,p);
 for(let i=0;i<5;i++)g.add([[82,19-i*4],[143,17-i*4],[154,24-i*4],[91,26-i*4]],p*.43,1.0);
 g.arc(108,-100,20,20,0,TAU,q*.5,1.0,2);g.line(108,-100,108+Math.sin(t*.8)*12,-100-Math.cos(t*.8)*12,q*.6,1.1);g.line(108,-100,97,-101,q*.45,1.1);
}

function home(g,t,p,q){
 g.floor(t,185);const left=mix(-78,-95,p),right=mix(77,95,p),top=mix(-5,-86,p)-q*42;
 g.rect(left,top,right-left,91-top,.75,.018);
 g.poly([[right,top],[right+22,top-14],[right+22,77],[right,91]],.35,1.1,.02,2);
 for(let k=0;k<8;k++)g.line(left+3,8+k*10,right-3,8+k*10,(1-p)*.17,.6,2);
 g.poly([[-106,-3],[-4,-84],[106,-3]],(1-p)*.72,1.6,.012,1);
 for(let k=1;k<9;k++)g.line(-104+k*11,-3-k*8.3,-2+k*12,-83+k*8.8,(1-p)*.21,.7,2);
 g.add([[-65,-36],[-65,-84],[-43,-84],[-43,-56]],(1-p)*.6,1.2);
 g.rect(-15,31,31,59,.58,.024,1);g.arc(9,60,1.6,1.6,0,TAU,.8,.9);
 const floors=mix(1,5,p)+q*2;
 for(let row=0;row<7;row++)for(let col=0;col<4;col++){
  const y=73-row*28,alpha=ramp(row+.10,row+.9,floors),lit=(row===3&&col===2?1:.20+.10*Math.sin(t*.9+row*1.7+col));
  g.rect(-75+col*45,y-19,22,17,alpha*.50,alpha*lit*.035,row===3&&col===2?1:2);
  g.line(-64+col*45,y-18,-64+col*45,y-3,alpha*.28,.65,2);
 }
 // The familiar window survives as the city grows around it.
 for(let side=-1;side<=1;side+=2){
  const x=side<0?-155:102;
  g.rect(x,-46-q*53,48,139+q*53,p*.3,.008,2);
  for(let r=0;r<6;r++)for(let k=0;k<2;k++)g.rect(x+9+k*18,67-r*24,8,10,p*.25,0,2);
 }
 g.line(-10,-127,10,-127,q*.60,1.3,1);
 for(let i=0;i<7;i++)g.line(-83+i*24,92,-120+i*36,116,.11,.65,2);
}

function commute(g,t,p,q){
 g.floor(t,200);const bob=Math.sin(t*6)*1.1;
 const wheels=[[-88,60],[91,60]];
 for(const [x,y] of wheels){
  const r=mix(34,17,p)*(1-.15*q);g.arc(x,y+bob,r,r,0,TAU,.70*(1-q*.2),1.7);
  for(let k=0;k<8;k++){const a=k/8*TAU+t*3;g.line(x,y+bob,x+Math.cos(a)*r,y+bob+Math.sin(a)*r,(1-p)*.35,.8);}
 }
 g.add([[-88,60],[-39,-6],[12,60],[-88,60],[-16,60],[60,-6],[91,60]],(1-p)*.76,2.0);
 g.line(-39,-6,60,-6,(1-p)*.68,1.8);g.add([[59,-8],[50,-32],[69,-34]],(1-p)*.78,1.8);g.line(-54,-14,-26,-14,(1-p)*.71,2.3);
 g.arc(12,60,9,9,0,TAU,(1-p)*.6,1.2);g.line(12,60,12+Math.cos(t*4)*18,60+Math.sin(t*4)*18,(1-p)*.7,1.5);
 g.poly([[-130,-51],[106,-51],[135,-20],[135,52],[-130,52]],p*(1-q)*.74,1.7,.018,1);
 g.poly([[-160,-36],[98,-36],[145,-18],[177,37],[-160,37]],p*q*.76,1.7,.014,1);
 for(let k=0;k<7;k++){const x=-112+k*30;g.rect(x,-35+q*13,23,28-q*10,p*.63,.012,2);}
 g.add([[91,-29],[119,-20],[119,25],[92,25],[91,-29]],p*(1-q)*.51,1.1);
 g.line(-126,13-q*6,131+q*27,13-q*6,p*.51,1.3,1);
 g.line(-180,86,190,86,.38,.9,2);g.line(-180,97,190,97,q*.4,.9,2);
 for(let k=0;k<15;k++)g.line(-176+k*25,87,-167+k*25,102,q*.25,.75,2);
 for(let k=0;k<4;k++)g.line(-196,-21+k*18,-148+Math.sin(t*2+k)*12,-21+k*18,.14*p,.9,2);
}

function table(g,t,p,q){
 g.floor(t,195);g.arc(0,23,75,17,0,TAU,.76,1.7,1,.027);g.add([[-51,33],[-65,99]],.66,1.7);g.add([[51,33],[64,99]],.66,1.7);
 for(const s of [-1,1]){g.add([[s*93,97],[s*94,4],[s*128,4],[s*132,97]],.53,1.5);g.line(s*93,57,s*130,57,.5,1.2);}
 person(g,-111,81,111,{a:.69,lean:.25,seated:true,arm:Math.sin(t*1.3)*3});
 person(g,111+q*35,81,111,{a:.68*(1-q),lean:-.3,seated:true,arm:Math.sin(t*1.4+.4)*3});
 mug(g,-41,5,t,.67,1-.6*q);mug(g,25,5,t,.65,1-q);
 g.arc(0,34,24,5,0,TAU,.48,1);g.line(-7,29,-5,40,.42,.8);
 g.curve([[-95,-35],[-71,-19+Math.sin(t*2)*3],[-71,-3],[-58,11]],.5*(1-q*.2),1.3);
 g.curve([[94,-35],[71,-19-Math.sin(t*2)*3],[71,-3],[58,11]],.5*(1-q),1.3);
 const sway=Math.sin(t*1.4)*3;g.add([[-5,3],[-7,-37],[sway,-61]],.55,1.1, false,0,1);
 g.arc(sway,-62,7,10,0,TAU,.5*(1-q*.65),1.0,1);g.line(-6,-31,7+sway,-44,.41,1.0);
}

function family(g,t,p,q){
 g.floor(t,191);const grown=mix(76,137,p),away=q*62;
 person(g,-94,94,151,{a:.68*(1-q*.77),old:p,lean:.09+.22*q,arm:Math.sin(t*1.1)*1.2});
 person(g,94,94,143,{a:.69,old:p,lean:-.10+.28*q,arm:Math.sin(t*1.0)*1.6});
 person(g,away,94,grown,{a:.73*(1-q),step:Math.sin(t*2)*.08,arm:0});
 g.curve([[-54.5,45.2],[-44,43],[-31,61],[-37*grown/130,94-44*grown/130]],.55*(1-p),1.35);
 g.curve([[53.3,45.6],[40,43],[30,62],[34*grown/130,94-42*grown/130]],.55*(1-p),1.35);
 g.rect(-150,-120,305,222,.15,0,2);g.line(-143,-113,147,-113,.22,.8,2);
 // Growth marks on a door frame make the passing years concrete.
 for(let k=0;k<8;k++)g.line(147,71-k*20,137-(k%2)*5,71-k*20,.28,.8,2);
 g.line(133,94-grown,151,94-grown,.58,1.15,1);
}

function body(g,t,p,q){
 g.floor(t,180);const gait=Math.sin(t*4)*(1-p)*.65;
 person(g,-24,102,170,{a:.76,lean:mix(-.25,.25,p)+q*.36,step:gait,arm:Math.sin(t*4)*(1-p)*10,old:q});
 g.curve([[44,11],[61,4],[63,15],[61,27]],q*.79,2.0,1);g.line(62,26,51,104,q*.79,2,1);
 g.rect(96,29,28,61,p*.51,.025,2);g.rect(93,23,34,10,p*.54,.02,1);
 for(let k=0;k<5;k++)g.arc(88+k*12,102-k%2*4,6,3,.2,TAU+.2,q*.55,1.0,1);
 g.add([[134,54],[138,95],[160,95],[165,54]],q*.45,1.0);g.arc(149,55,16,3,0,TAU,q*.51,.8);g.line(138,74,163,74,q*.33,.8,2);
 for(let k=0;k<3;k++)g.curve([[-122,12+k*16],[-142,4+k*16],[-149,12+k*16],[-162,11+k*16]],(1-p)*.26,.9,2);
}

function birthday(g,t,p,q){
 g.floor(t,180);g.arc(0,79,108,17,0,TAU,.65,1.3);g.arc(0,72,83,12,0,TAU,.6,1.2);
 const top=mix(5,59,q);
 g.poly([[-75,top],[-75,68],[75,68],[75,top]],.69*(1-q*.30),1.6,.024);
 g.arc(0,top,75,15,0,TAU,.72*(1-q*.30),1.5,1,.026);
 for(let k=0;k<8;k++)g.curve([[-71+k*18,top],[-72+k*18,top+16],[-61+k*18,top+22],[-55+k*18,top+3]],.45*(1-q),1.0);
 for(let k=0;k<7;k++){
  const a=(k===3?1:mix(k%3===0?1:0,1,p)*(1-q)),x=(k-3)*17,y=top-5+Math.abs(k-3)*.8,len=mix(38,12,q);
  g.rect(x-2,y-len,5,len,a*.70,.015,1);
  g.curve([[x,y-len-2],[x-8,y-len-13],[x+Math.sin(t*7+k)*4,y-len-19],[x,y-len-2]],a*(1-q*.85)*.75,1.25,1);
 }
 for(const s of [-1,1]){
  const xx=s*(116+q*20)+Math.sin(t*.8+s)*6,yy=-66-q*80;
  g.arc(xx,yy,20,28,0,TAU,(1-q)*.43,1.15,2);
  g.curve([[xx,yy+28],[xx+s*20,yy+57],[xx-s*15,18],[s*100,84]],(1-q)*.28,.8,2);
 }
 steam(g,-1,top-24,t,q*.16);
}

function departure(g,t,p,q){
 g.floor(t,170);const w=mix(92,126,p),h=mix(120,155,p),top=88-h;
 g.rect(-w/2,top,w,h,.75,.025);g.curve([[-w/2,top+18],[-67,top+13],[-71,61],[-w/2,65]],(1-p)*.55,1.2);
 g.curve([[w/2,top+18],[67,top+13],[71,61],[w/2,65]],(1-p)*.55,1.2);
 g.add([[-18,top],[-18,top-14],[18,top-14],[18,top]],.67,1.7);
 g.rect(-w*.34,top+59,w*.68,40,(1-p)*.66,.012,1);g.line(-w*.30,top+68,w*.30,top+68,(1-p)*.58,1.1);
 for(let k=0;k<6;k++)g.line(-45+k*18,top+16,-45+k*18,78,p*.4,.8,2);
 g.add([[-23,top],[-23,top-q*41],[23,top-q*41],[23,top]],p*q*.69,1.6);
 for(const x of [-42,42])g.arc(x,94,7,8,0,TAU,p*.71,1.45);
 const swing=Math.sin(t*2)*5;g.poly([[w/2-11,top+19],[w/2+18+swing,top+32],[w/2+8+swing,top+57],[w/2-21,top+44]],p*.58,1.0,.014,1);
 g.add([[98,100],[98,-123],[174,-123],[174,100]],q*.35,1.1);g.arc(157,-3,3,3,0,TAU,q*.53,1.0,1);g.line(107,-111,107,86,q*.23,.7,2);
 for(let k=0;k<3;k++)g.line(-153,101-k*5,-95,101-k*5,.11,.7,2);
}

const DRAW=[telephone,desk,home,commute,table,family,body,birthday,departure];
export function lifePhase(id,t){
 const offset=(id%3)*.13+Math.floor(id/3)*.22;
 // Late-born lives keep their first state through the phone close-up. Their
 // evolution is shown when the camera returns, rather than happening offscreen.
 const p=id>=6?ramp(72.7+(id-6)*.22,75.3+(id-6)*.22,t):ramp(64.5+offset,68+offset,t);
 const q=id===0?ramp(68.75,71.25,t):id>=6?ramp(76+(id-6)*.13,79+(id-6)*.13,t):ramp(71.8+offset,75.4+offset,t);
 return {p,q};
}
export function lifeGeometry(id,t){
 const {p,q}=lifePhase(id,t),g=new Ink();
 DRAW[id](g,t,p,q);return g.items;
}

export function lifePlacement(id,local,t){
 const scene=SCENES[id],a=scene.anchor;
 const breathe=Math.sin(t*.65+id)*2.7;
 const p=[a[0]+local[0]*scene.scale,a[1]+local[1]*scene.scale+breathe,a[2]+(local[1]+15)*.10+Math.sin(t*.35+id)*7+(local[2]||0)];
 if(t<=76.2)return p;
 // Each remembered scene moves as a whole. It keeps its people and objects
 // recognizable while the camera discovers a ring of receding windows.
 const order=[0,1,2,5,8,7,6,3],theta=id===4?Math.PI*.52:(order.indexOf(id)/8*TAU-Math.PI*.75)+(t-76.2)*.022;
 const r=rotate([local[0]*.85,local[1]*.85,(local[2]||0)*.85],-.08,Math.sin(theta)*.34,Math.cos(theta)*.06);
 const center=id===4?[0,20,-120]:[Math.cos(theta)*815,Math.sin(theta)*350-20,330+Math.sin(theta)*180];
 const move=ramp(76.2,80.4,t),woven=r.map((v,k)=>v+center[k]),result=lerp3(p,woven,move);
 const release=id===4||id===7?ramp(79.9,82.3,t):ramp(80.5+id*.10,85+id*.07,t);
 return [result[0]+Math.cos(theta)*release*1300,result[1]+Math.sin(theta)*release*870,result[2]+release*1000];
}

export function lifeVertex(id,stroke,index,count,u,t){
 const n=stroke.points.length;
 const f=clamp(u)*(stroke.close?n:n-1),j=Math.floor(f),v=f-j,A=stroke.points[j%n],B=stroke.points[(j+1)%n];
 const local=[mix(A[0],B[0],v),mix(A[1],B[1],v)];
 return lifePlacement(id,local,t);
}
