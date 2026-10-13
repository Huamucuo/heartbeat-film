import {DURATION,CHAPTERS,MAZE_RUNS,realTime} from './timeline.mjs';
import {record} from './heart-records.mjs';
export {DURATION,CHAPTERS};
export const FPS=30,BPM=96,BEAT=.625,BAR=2.5;
export const TEMPO_SECTIONS=[
 {start:0,end:63,bpm:96,meter:'4/4',name:'钢琴主题与独立心跳'},
 {start:63,end:85,bpm:96,meter:'5/4',name:'第一次迷途'},
 {start:85,end:104,bpm:112,meter:'7/8',name:'第二次迷途'},
 {start:104,end:118.5,bpm:132,meter:'3/4',name:'第三次迷途'},
 {start:118.5,end:131,bpm:64,meter:'free',name:'原点余响'},
 {start:131,end:173,bpm:80,meter:'4/4',name:'同时流逝的日常'},
 {start:173,end:182,bpm:64,meter:'free',name:'留下'},
 {start:182,end:196,bpm:76,meter:'free',name:'未完成的尾声'}
];
const events=[];
function add(time,voice,amp=.5,note=57,pan=0,duration=1,extra={}){if(time<0||time>=DURATION)return;events.push({id:voice+'.'+events.length,time,voice,amp,note,pan,duration,...extra});}
function piano(time,note,amp=.38,duration=3.2,pan=0,extra={}){add(time,'piano',amp,note,pan,duration,{velocity:amp>.50?7:3,...extra});}
function chord(time,notes,amp=.19,duration=4){notes.forEach((n,j)=>piano(time+j*.019,n,amp,duration,(j-(notes.length-1)/2)*.10,{bus:'harmony'}));}
// ECG timing stays identical to the image. Mix gain is independent of its visual intensity.
for(const b of record(0).beats){const t=b.time;if(t<.4||(t>=63&&t<173)||t>=194)continue;const a=(t<63?.73:.44)*b.height,delay=.13+b.width*1.4;add(t,'heart',a,38,-.08,.58+b.width*2,{source:0,primary:true,mixGain:.22});add(t+delay,'heart',a*(.30+b.s*.30),38,-.08,.39+b.width,{source:0,mixGain:.22});}
for(const b of record(1).beats)if(b.time>=47&&b.time<63){add(b.time,'heart',.59*b.height,38,.35,.65,{source:1,primary:true,mixGain:.18});add(b.time+.16,'heart',.24*b.height,38,.35,.43,{source:1,mixGain:.18});}
const H=[[45,52,60,64],[41,48,57,64],[40,48,55,64],[43,50,59,62]];
const melody=[[0,76,1.8],[2,72,1.25],[3.5,71,1],[5,69,2.5],[8,72,1.6],[10,74,1.1],[11.5,71,1.6],[14,64,2.4]];
[ [1.25,76],[3.125,74],[5,72],[6.875,71] ].forEach(([t,n],i)=>piano(t,n,.27-i*.016,3.2,.03));
for(let b=0,t=9;t<47;t+=5,b++){
 const h=H[b%4];chord(t,h,.21,t<29?4.3:3.6);piano(t,h[0]-12,.26,3.2,-.12,{bus:'harmony'});
 if(t>=29)for(let j=0;j<8;j++)piano(t+j*.625,h[[0,2,1,3,1,2,3,1][(j+b)%8]]+12,.19+(j%4===0?.04:0),1.4,Math.sin(j*.7)*.14);
}
for(let phrase=0;phrase<4;phrase++)for(const [beat,n,d] of melody){const t=9+phrase*10+beat*.625;if(t>=46)continue;piano(t,n+(phrase===3&&beat===8?-3:0),.40+Math.sin(phrase+beat)*.027,d+.65,.09);}
chord(47,[45,52,60,64],.23,5);chord(52,[41,48,57,64],.22,5);chord(57,[43,50,59,62],.20,5);
[[47.6,76,-.23],[48.8,72,-.23],[50.0,71,-.23],[51.25,69,-.23],[52.6,64,.27],[53.8,67,.27],[55,69,.27],[56.8,71,.27],[58.4,72,-.18],[59.5,71,.18],[61,69,0]].forEach(([t,n,p])=>piano(t,n,.37,2.8,p));
for(let si=0;si<3;si++){
 const S=TEMPO_SECTIONS[si+1],beat=60/S.bpm,step=si===1?beat/2:beat,group=[5,7,3][si];
 for(let n=0,t=S.start;t<S.end-.18;t+=step,n++){
  const bar=Math.floor(n/group),h=H[bar%4],k=n%group,rise=(t-S.start)/(S.end-S.start);
  const note=h[[1,2,3,2,1,3,2][k]]+(si===2?12:0);
  piano(t,note,.26+si*.025+(k===0?.07:0)+rise*.045,si===0?1.7:1.12,Math.sin(n*.8)*.12);
  if(k===0){piano(t,h[0]-12,.32+si*.03,group*step*.83,-.10,{bus:'harmony'});chord(t+.025,[h[1],h[2],h[3]],.17+si*.02,group*step*.88);}
  if(n%2===0)add(t,'wood',.10+si*.018,45,0,.16);
 }
}
for(const [i,run] of MAZE_RUNS.entries()){add(run.end,'impact',.17+i*.025,45,0,1.7);chord(run.end,[45,52,60,64],.31+i*.03,3.6);piano(run.end+.31,71,.38,2.7,.1);}
[[122.2,76],[124.3,72],[126.5,71],[128.6,69]].forEach(([t,n],i)=>piano(t,n,.19-i*.021,3.7,.02));
const LIFE_H=[[45,52,60,64],[41,48,57,64],[48,55,60,64],[43,50,59,62],[50,57,60,65],[45,52,60,64],[41,48,57,64]];
for(let b=0;b<7;b++){
 const t=131+b*6,h=LIFE_H[b];chord(t,h,.22,5.4);piano(t,h[0]-12,.27,4,-.1,{bus:'harmony'});
 const patterns=[[0,2,1,3,2,1],[1,2,3,1,2,0],[0,1,3,2,1,2]];
 for(let j=0;j<6;j++)piano(t+.75+j*.75,h[patterns[b%3][j]]+12,.19+(j===0?.03:0),2.3,Math.sin(j+b)*.12);
}
const phrases=[
 [133.25,76,2.1],[135.5,74,1.2],[137,72,2.8],[140.5,71,1.5],[142.75,69,3.6],
 [146,72,1.7],[148.25,76,2.5],[151.25,74,1.5],[153.5,72,2.5],[157,69,2.6],
 [160,71,1.4],[162.25,72,1.8],[164.5,71,1.4],[167,69,2.5],[170,64,3.5]
];
for(const [t,n,d] of phrases)piano(t,n,.38+(t>156?.015:0),d,.09);
// Disassembly and the returning foundations share a restrained wooden accent.
for(const t of [141.6,143.3,146.4,148,156.7,158.3,162,164])add(t,'wood',.09,48,0,.18);
for(const b of record(0).beats)if(b.time>=131&&b.time<173){add(b.time,'heart',.33*b.height,38,0,.60,{source:0,mixGain:.13});}
[[174,76],[175.6,74],[177.2,72],[179,71],[180.6,69]].forEach(([t,n],i)=>piano(t,n,.29-i*.015,3.8,.07));
chord(182,[45,52,59],.13,8);[[183.2,76],[185.6,72],[188.1,71],[190.8,64]].forEach(([t,n],i)=>piano(t,n,.30-i*.029,5.0,0));
export const EVENTS=events.sort((a,b)=>a.time-b.time||a.id.localeCompare(b.id));
const HEARTS=EVENTS.filter(e=>e.voice==='heart'||e.voice==='arrival');
export function pulseAtReal(t,source=0){let v=0;for(const e of HEARTS){if(e.time>t)break;const age=t-e.time;if(age<1.5&&(e.source===source||e.voice==='arrival'))v+=e.amp*(1-Math.exp(-age/.015))*Math.exp(-age/.19);}return v;}
export const pulse=(t,source=0)=>pulseAtReal(realTime(t),source);
export const NODE_TIMES=Array.from({length:9},(_,i)=>59.375+i*.625),CONNECTIONS=[];
export const SCORE={title:'心跳 / Heartbeat — 活着的意义',edition:'v11',duration:DURATION,bpm:BPM,tempoSections:TEMPO_SECTIONS,sampleRate:48000,chapters:CHAPTERS,events:EVENTS,instruments:'Original composition; Salamander Grand Piano v3 by Alexander Holm, CC BY 3.0; resampled, retuned, filtered and mixed.'};
