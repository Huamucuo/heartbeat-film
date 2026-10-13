export const DURATION=90, FPS=30, BPM=96, BEAT=60/BPM, BAR=BEAT*4;
export const CHAPTERS=[
 {start:0,end:7.5,id:'imprint',zh:'发生',en:'A FIRST IMPULSE'},
 {start:7.5,end:17.5,id:'memory',zh:'余痕',en:'NOTHING IS LOST'},
 {start:17.5,end:27.5,id:'weave',zh:'延伸',en:'A TRACE BECOMES A THREAD'},
 {start:27.5,end:37.5,id:'pair',zh:'彼此',en:'TWO DIFFERENT RHYTHMS'},
 {start:37.5,end:47.5,id:'interference',zh:'错拍',en:'ALMOST / NOT YET'},
 {start:47.5,end:57.5,id:'listen',zh:'倾听',en:'THE DISTANCE BETWEEN'},
 {start:57.5,end:67.5,id:'answer',zh:'回应',en:'SOMETHING RETURNS'},
 {start:67.5,end:80,id:'chorus',zh:'共振',en:'ONE PULSE / MANY VOICES'},
 {start:80,end:90,id:'return',zh:'心跳',en:'HEARTBEAT'},
];
const events=[];
function add(time,voice,amp=.5,note=57,pan=0,duration=1,extra={}){events.push({id:`${voice}.${events.length}`,time,voice,amp,note,pan,duration,...extra});}
for(let i=0;i<72;i++){
 const t=.625+i*1.25;if(t>=89||t>=47.5&&t<57.5)continue;
 const a=t<7.5?.9:t<37.5?.7:t<47.5?.8:t<67.5?.8:t<80?.88:.54;
 add(t,'heart',a,38,-.28,.7,{source:0});add(t+.17,'heart',a*.53,38,-.28,.5,{source:0});
}
for(let t=27.8125;t<47.5;t+=1.25){add(t,'other',.54,45,.48,.7,{source:1});add(t+.18,'other',.22,45,.48,.5,{source:1});}
for(let t=58.125;t<87;t+=1.25)add(t,'other',.40,45,.36,.7,{source:1});
add(55,'travel',.46,76,.6,2.5);add(57.5,'arrival',.95,45,-.4,2);
const harmony=[[57,60,64,71],[53,57,60,67],[48,55,60,64],[55,59,62,69]];
for(let b=0;b<36;b++){
 const t=b*BAR,section=CHAPTERS.findIndex(s=>t>=s.start&&t<s.end);
 const chord=b>=32?[57,61,64,71]:harmony[Math.floor(b/2)%4];
 let padAmp=t<7.5?.11:t<27.5?.23:t<37.5?.25:t<47.5?.22:t<55?.08:t<57.5?.12:t<67.5?.28:t<80?.40:.24;
 add(t,'pad',padAmp,chord[0],0,3.8,{notes:chord});
 if(t>=7.5&&t<47.5||t>=57.5&&t<87.5){
  const count=t<17.5?4:t<37.5?8:t<47.5?8:t<67.5?8:t<80?16:4;
  for(let j=0;j<count;j++){
   const n=chord[[0,2,1,3,2,0,3,1][j%8]]+(t>=67.5?12:0);
   add(t+j*BAR/count,'pluck',t<47.5?.25:.27,n,Math.sin(j*1.7+b)*.55,2.4,{strand:(b*8+j)%96});
  }
 }
 if(t>=17.5&&t<47.5||t>=57.5&&t<80){
  for(let j=0;j<4;j++) add(t+j*BEAT,'tick',j%2?.14:.085,76,((j+b)%2?1:-1)*.4,.15);
  if(t>=37.5||t>=67.5) add(t+1.875,'brush',.12,62,.1,.32);
 }
 if(b%2===0&&t<47.5||b%2===0&&t>=57.5){add(t+.625,'bass',.32,chord[0]-24,0,3.4);}
}
const motif=[57,64,71,69,64,60,59,57];
for(const base of [1.875,10,20,30,40,58.75,70,81.25])for(let j=0;j<(base===1.875?3:4);j++)add(base+j*1.25,'felt',base>=70?.44:.35,motif[j+(base>=40?4:0)],Math.sin(j)*.3,4.5);
export const NODE_TIMES=Array.from({length:9},(_,i)=>59.375+i*.625);
for(let i=0;i<9;i++) add(NODE_TIMES[i],'bloom',.43,[69,71,76,79,81,83,88,91,93][i],Math.sin(i*2.4)*.65,3.5,{node:i});
export const CONNECTIONS=[];
// First establish nine voices in the knot; their relationships then grow in
// the chorus, with the outer circuit preceding the cross-connections.
for(let k=0;k<9;k++)for(const step of [1,3]){const j=(k+step)%9,time=67.5+k*.625+(step===3?3.75:0);CONNECTIONS.push({from:k,to:j,step,time});add(time,'connect',.12,[57,60,64,67,71][k%5],Math.sin(k)*.4,1.2,{from:k,to:j});}
for(const t of [7.5,17.5,27.5,37.5,57.5,67.5,80]){add(t-.8,'swell',.26,64,0,.8);add(t,'bell',.27,69+(t===80?4:0),0,3);}
add(87.5,'bell',.25,81,0,2.5);
export const EVENTS=events.sort((a,b)=>a.time-b.time||a.id.localeCompare(b.id));
export const HEARTS=EVENTS.filter(e=>['heart','other','arrival'].includes(e.voice));
export function pulse(t,source=0){let v=0;for(const e of HEARTS){if(e.time>t)break;const a=t-e.time;if(a<1.5&&(e.source===source||e.voice==='arrival'))v+=e.amp*(1-Math.exp(-a/.015))*Math.exp(-a/.19);}return v;}
export const SCORE={title:'心跳 / Heartbeat — second visual edition',duration:DURATION,bpm:BPM,sampleRate:48000,chapters:CHAPTERS,events:EVENTS};
