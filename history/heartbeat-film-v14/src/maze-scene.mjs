import {ramp,gate,mix,hash,blend,project,path,spot,dot,text,gold,ivory,teal,coral} from './drawing.mjs';
import {Solid,paintSolid} from './solids.mjs';
import {WALLS,COLS,ROWS,CELL,ROUTES,ORIGIN_PILLARS,cellPosition,mazeAt,routePoint} from './maze-world.mjs';
import {ellipsoid} from './model-kit.mjs';
import {MAZE_RUNS} from './timeline.mjs';

export function mazeCamera(t){
 const state=mazeAt(t),future=mazeAt(t+.27),follow=1-ramp(74,83,t)*.55-ramp(100,116,t)*.45;
 const x=mix(state.position[0],future.position[0],.45)*follow,z=mix(state.position[2],future.position[2],.45)*follow;
 const zoom=mix(1.50,.76,ramp(74,85,t));
 return {yaw:-.35+.15*Math.sin((t-63)*.056)+.62*ramp(100,117,t),pitch:mix(.70,1.15,ramp(100,118,t)),scale:mix(zoom,.40,ramp(107,119,t)),x:960,y:mix(570,516,ramp(107,119,t)),depth:4300,follow:[x,0,z]};
}
function modelToView(s,cam){const f=cam.follow;s.transform(p=>[p[0]-f[0],p[1],p[2]-f[2]]);return s;}
function floorPoint(p,cam){return project([p[0]-cam.follow[0],p[1],p[2]-cam.follow[2]],cam);}
function routeFloor(c,index,progress,cam,alpha){
 const route=ROUTES[index],end=Math.min(route.length-1,progress*(route.length-1)),points=[];
 for(let i=0;i<=Math.floor(end);i++){const p=cellPosition(route[i]);p[1]=-1.5;points.push(floorPoint(p,cam));}
 if(end%1>0){const p=routePoint(index,progress).position;p[1]=-1.5;points.push(floorPoint(p,cam));}
 const color=[gold,teal,coral][index];path(c,points,color,alpha*.12,14*cam.scale);path(c,points,color,alpha*.72,3.4*cam.scale);
 for(let i=0;i<points.length;i+=4)dot(c,points[i][0],points[i][1],1.2*cam.scale,color,alpha*.50);
}
export function mazeScene(c,t){
 const a=gate(61.5,132,t,2.2);if(a<.002)return;
 const cam=mazeCamera(t),state=mazeAt(t),build=ramp(62,66,t),fall=ramp(122,132,t);
 c.save();c.globalAlpha=a;const bg=c.createRadialGradient(960,430,70,960,520,1300);bg.addColorStop(0,'#1b3039');bg.addColorStop(.5,'#101e2b');bg.addColorStop(1,'#04080e');c.fillStyle=bg;c.fillRect(0,0,1920,1080);c.restore();
 const floor=new Solid();floor.box(0,60,0,COLS*CELL+100,60,ROWS*CELL+100,[41,61,67]);
 floor.group=1;floor.box(0,2,0,COLS*CELL+56,7,ROWS*CELL+56,[82,101,98]);
 paintSolid(c,modelToView(floor,cam),cam,a*(1-fall*.8));
 // Inlaid paving, route markings and the scar belong to the ground; walls
 // occlude them. No path is rendered as an x-ray over the architecture.
 for(let x=0;x<=COLS;x++){const X=(x-COLS/2)*CELL;path(c,[floorPoint([X,-.5,-ROWS*CELL/2],cam),floorPoint([X,-.5,ROWS*CELL/2],cam)],[126,145,134],a*.18,.5);}
 for(let z=0;z<=ROWS;z++){const Z=(z-ROWS/2)*CELL;path(c,[floorPoint([-COLS*CELL/2,-.5,Z],cam),floorPoint([COLS*CELL/2,-.5,Z],cam)],[126,145,134],a*.18,.5);}
 for(let i=0;i<=state.index;i++)routeFloor(c,i,i<state.index?1:state.u,cam,a*(.9-.45*ramp(MAZE_RUNS[i].end,MAZE_RUNS[i].end+.9,t)));
 const origin=[];for(let i=0;i<=80;i++){const q=i/80*Math.PI*2;origin.push(floorPoint([Math.cos(q)*48,-2,Math.sin(q)*48],cam));}path(c,origin,gold,a*.9,2);
 path(c,[[-37,-2,21],[-12,-2,-8],[8,-2,7],[33,-2,-28]].map(p=>floorPoint(p,cam)),coral,a*.88,3);
 const solid=new Solid(),ripple=ramp(118.5,120,t)*(1-ramp(120,124,t));
 for(const w of WALLS){
  const radius=Math.hypot(w.x,w.z),reveal=ramp(radius/1000*.50,radius/1000*.50+1,build*2.2),sink=fall*(.5+hash(w.seed)*.5);
  const h=(64+hash(w.seed)*18)*reveal*(1-fall)**(1+hash(w.seed)*.4);if(h<.1)continue;
  const face=blend([164,177,165],[85,115,124],hash(w.seed+12)*.55),wave=Math.exp(-(((radius-(t-118.5)*830)/160)**2))*ripple;
  solid.box(w.x,0,w.z,w.w,h,w.d,blend(face,[238,194,121],wave*.7),1-fall*.8);
  // A narrow cap makes the wall read as masonry at wide and close scales.
  solid.box(w.x,-h+2,w.z,w.w+2,Math.min(4,h),w.d+2,blend(face,[240,222,176],.20),1-fall*.8);
 }
 // Origin gate: an asymmetric copper lintel and chipped plinth are the
 // persistent recognition cue at every return.
 for(const [x,z] of ORIGIN_PILLARS)solid.box(x,0,z,15,118,15,[146,107,71]);
 for(const side of [-1,1]){solid.box(0,-112,side*68,151,15,19,[196,156,92]);solid.box(side*68,-112,0,19,15,151,[170,131,82]);}
 for(const [i,p] of [[0,[-620,0,-550]],[1,[840,0,570]],[2,[-1010,0,640]]]){
  solid.box(p[0],0,p[2],22,164,22,[73,88,89]);solid.box(p[0],-138,p[2],32,22,32,blend([123,165,157],[206,161,105],i/2));
 }
 // The persistent heartbeat seed floats above its real ground path.
 // There is no humanoid figure; its route is carried by the floor inlay.
 const [x,,z]=state.position;
 ellipsoid(solid,x,-88,z,8,8,8,[239,217,169],1,12,8);
 paintSolid(c,modelToView(solid,cam),cam,a);
 const head=floorPoint([x,-88,z],cam);spot(c,head[0],head[1],23*cam.scale,gold,a*.60);dot(c,head[0],head[1],2.8*cam.scale,ivory,a);
 const atOrigin=floorPoint([0,-126,0],cam);text(c,'原点',atOrigin[0],atOrigin[1]-28,22,gold,a*.85,{tracking:4});
 for(let i=0;i<3;i++){const e=MAZE_RUNS[i].end,hit=gate(e,e+2.7,t,.35);if(hit>.002){text(c,['第一次，回到这里。','第二次，仍是这里。','走了这么远。'][i],960,190,46,ivory,hit,{tracking:6});}}
 if(t>114){const all=ramp(114,118.5,t)*(1-ramp(125,130,t));text(c,'原 点',1530,225,76,ivory,all,{tracking:10});text(c,'留下的痕迹，一道也没有消失。',1530,301,20,gold,all*.83,{tracking:2});}
 // At the end the maze sinks into layers of memory. The same warm point
 // departs towards the first lived scene, keeping the sequence continuous.
 if(t>125){const u=ramp(125,132,t),p=floorPoint([0,-84,0],cam),xx=mix(p[0],350,u),yy=mix(p[1],230,u)-Math.sin(u*Math.PI)*160;spot(c,xx,yy,24,teal,a*.85);dot(c,xx,yy,3,ivory,a);}
}
