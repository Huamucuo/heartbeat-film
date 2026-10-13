import {LIFE_SHOTS,ENDING_START} from './life-direction.mjs';
import {DURATION,CHAPTERS,MAZE_RUNS,realTime} from './timeline.mjs';
import {record} from './heart-records.mjs';
export {DURATION,CHAPTERS};
export const FPS=30,BPM=96,BEAT=.625,BAR=2.5;
export const TEMPO_SECTIONS=[
 {start:0,end:63,bpm:96,meter:'4/4',name:'原来的主题'},
 {start:63,end:85,bpm:96,meter:'5/4',name:'第一次迷途：缺少落点'},
 {start:85,end:104,bpm:112,meter:'7/8',name:'第二次迷途：错位'},
 {start:104,end:118.5,bpm:132,meter:'3/4',name:'第三次迷途：加速'},
 {start:118.5,end:131,bpm:64,meter:'free',name:'回到原点后的余响'},
 {start:131,end:141,bpm:88,meter:'4/4',name:'日子的展开'},
 ...LIFE_SHOTS.map(s=>({start:s.start,end:s.end,bpm:s.bpm,meter:'4/4',name:s.name+'：独立主题变奏'})),
 {start:315,end:326,bpm:64,meter:'free',name:'回忆退远'},
 {start:326,end:340,bpm:76,meter:'4/4',name:'没有解决的尾声'}
];
const events=[];function add(time,voice,amp=.5,note=57,pan=0,duration=1,extra={}){if(time<0||time>=DURATION)return;events.push({id:`${voice}.${events.length}`,time,voice,amp,note,pan,duration,...extra});}
for(const b of record(0).beats){const t=b.time;if(t<.4||(t>=63&&t<326)||t>=338)continue;const strength=(t<63?.73:.44)*b.height,delay=.13+b.width*1.4;add(t,'heart',strength,38,-.16,.58+b.width*2,{source:0,primary:true});add(t+delay,'heart',strength*(.30+b.s*.30),38,-.16,.39+b.width,{source:0});}
for(const b of record(1).beats){const t=b.time;if(t<47||t>=63)continue;add(t,'heart',.59*b.height,38,.40,.65,{source:1,primary:true});add(t+.16,'heart',.24*b.height,38,.40,.43,{source:1});}
const chords=[[57,60,64,71],[53,57,60,67],[50,57,60,64],[52,55,59,65]],motif=[64,60,59,57];
for(let b=0,t=0;t<63;t+=2.5,b++){
 const chord=chords[Math.floor(b/2)%4];add(t,'pad',t<9?.13:.25,chord[0],0,3.6,{notes:chord});
 if(t>=9)for(let j=0;j<(t<29?4:8);j++)add(t+j*.3125,'pluck',.17,chord[[0,2,1,3][j%4]],Math.sin(j+b)*.45,1.8);
 if(b%2===0){add(t+.3,'bass',.3,chord[0]-24,0,3.5);for(let j=0;j<4;j++)add(t+.625+j*1.25,'felt',.30,motif[j]-(b>=18?5:0),Math.sin(j)*.25,4.2);}
 if(t>=29)for(let j=0;j<4;j++)add(t+j*.625,'tick',.11,72,j%2?.3:-.3,.13);
}
for(let section=0;section<3;section++){
 const S=TEMPO_SECTIONS[section+1],beat=60/S.bpm,step=section===1?beat/2:beat,group=[5,7,3][section];
 for(let n=0,t=S.start;t<S.end-.12;t+=step,n++){
  const rise=(t-S.start)/(S.end-S.start),notes=section===0?[57,60,64,59,55]:section===1?[57,58,64,60,55,59,52]:[57,60,64,65,64,60];
  add(t,section===0?'felt':'marimba',(.24+section*.06)*(n%group===0?1.4:1),notes[n%notes.length]+(section===2&&n%2?12:0),Math.sin(n*.7)*.55,section===0?2.8:1.2);
  add(t,'footstep',.28+rise*.10,38,Math.sin(n)*.2,.25);
  if(n%group===0){add(t,'bass',.37+section*.08,33-section,0,group*step*.9);add(t,'strings',.21+section*.10+rise*.08,45,0,group*step+1,{notes:section===0?[45,52,57,60]:section===1?[40,47,53,58]:[33,45,52,58,64]});}
  if(n%2===0){add(t,'heart',.59+section*.09,38,0,.6,{source:0});add(t+.15,'heart',.28,38,0,.42,{source:0});}
 }
}
for(const [i,run] of MAZE_RUNS.entries()){add(run.end,'impact',.45+i*.12,33,0,3.8);add(run.end+.25,'felt',.46,57,0,4.4);add(run.end+.91,'felt',.3,58,0,4.0);add(run.end-1.8,'swell',.38+i*.09,57,0,1.8);}
for(let j=0;j<6;j++)add(123+j*1.15,'felt',.14,[64,60,59,57,52,58][j],-.15,4);
for(let j=0;j<9;j++)add(132+j*.8,'bloom',.22,[57,59,60,64,65,67,71,72,76][j],Math.sin(j*2.4)*.6,3.4);
for(const b of record(0).beats)if(b.time>=131&&b.time<315){add(b.time,'heart',.43*b.height,38,0,.60,{source:0});add(b.time+.16,'heart',.18*b.height,38,0,.42,{source:0});}
for(const shot of LIFE_SHOTS){
 const beat=60/shot.bpm,motif=[7,3,2,0,7,10,8,2],harmony=[shot.key-12,shot.key,shot.key+3,shot.key+7];
 for(let n=0,t=shot.start;t<shot.end-1;t+=beat,n++){
  const u=(t-shot.start)/(shot.end-shot.start),lift=Math.sin(u*Math.PI),octave=shot.id===7?12:0;
  if(n%(shot.voice==='felt'?2:1)===0)add(t,shot.voice,.24+lift*.15,shot.key+motif[n%8]+octave,Math.sin(n*.6)*.26,shot.voice==='felt'?4.5:1.8);
  if(n%8===0){add(t,'pad',shot.id===6?.13:.23,harmony[0],0,6.2,{notes:harmony});add(t,'bass',shot.id===6?.16:.25,shot.key-24,0,3.9);}
  if(n%8===3&&u<.78)add(t+.5*beat,'felt',.18,shot.key-5,shot.id%2?.3:-.3,3.9);
  if(shot.id===3||shot.id===1)add(t,'tick',.09+lift*.07,72,Math.sin(n)*.3,.15);
  if(shot.id===7&&u>.67)add(t+.5*beat,'marimba',.13,shot.key+25,0,2.2);
 }
 add(shot.p[1],'bloom',.19,shot.key+12,-.1,3.5);add(shot.q[0],'strings',.25,shot.key-12,0,shot.end-shot.q[0]+1,{notes:[shot.key-12,shot.key-5,shot.key+1]});
 add(shot.end-3,'felt',.22,shot.key+1,0,4.8);
}
for(let j=0;j<6;j++)add(315+j*1.6,'felt',.23,[64,60,59,57,52,58][j],Math.sin(j)*.2,4.8);
add(326,'pad',.17,45,0,12,{notes:[45,52,59,60]});for(let j=0;j<5;j++)add(327+j*1.6,'felt',.26,[64,60,59,57,58][j],0,5.6);
export const EVENTS=events.sort((a,b)=>a.time-b.time||a.id.localeCompare(b.id));
const HEARTS=EVENTS.filter(e=>e.voice==='heart'||e.voice==='arrival');
export function pulseAtReal(t,source=0){let v=0;for(const e of HEARTS){if(e.time>t)break;const age=t-e.time;if(age<1.5&&(e.source===source||e.voice==='arrival'))v+=e.amp*(1-Math.exp(-age/.015))*Math.exp(-age/.19);}return v;}
export const pulse=(t,source=0)=>pulseAtReal(realTime(t),source);
export const NODE_TIMES=Array.from({length:9},(_,i)=>59.375+i*.625),CONNECTIONS=[];
export const SCORE={title:'心跳 / Heartbeat — 活着的意义',edition:'v08',duration:DURATION,bpm:BPM,tempoSections:TEMPO_SECTIONS,sampleRate:48000,chapters:CHAPTERS,events:EVENTS};
