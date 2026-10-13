import {DURATION,CHAPTERS,realTime} from './timeline.mjs';
import {record} from './heart-records.mjs';
import {CODE_BEATS,GLITCHES,RETURN_RUNS,STOP_TIME,RESONANCE_END} from './code-direction.mjs';
export {DURATION,CHAPTERS};
export const FPS=30,BPM=96,BEAT=.625,BAR=2.5;
export const TEMPO_SECTIONS=[
 {start:0,end:63,bpm:96,meter:'4/4',name:'钢琴主题与独立心跳'},
 {start:63,end:131.25,bpm:96,endBpm:224,curve:'quadratic',meter:'4/4',name:'连续加速的迷途'},
 {start:131,end:173,bpm:80,meter:'4/4',name:'同时流逝的日常'},
 {start:173,end:182,bpm:64,meter:'free',name:'日常汇成心脏'},
 {start:182,end:196,bpm:76,meter:'free',name:'衰弱与停止'}
];
const events=[];
function add(time,voice,amp=.5,note=57,pan=0,duration=1,extra={}){if(time<0||time>=DURATION)return;events.push({id:voice+'.'+events.length,time,voice,amp,note,pan,duration,...extra});}
function piano(time,note,amp=.38,duration=3.2,pan=0,extra={}){add(time,'piano',amp,note,pan,duration,{velocity:amp>.50?7:3,...extra});}
function chord(time,notes,amp=.19,duration=4){notes.forEach((n,j)=>piano(time+j*.019,n,amp,duration,(j-(notes.length-1)/2)*.10,{bus:'harmony'}));}
// ECG timing stays identical to the image. Mix gain is independent of its visual intensity.
for(const b of record(0).beats){const t=b.time;if(t<.4||t>=63)continue;const a=.73*b.height,delay=.13+b.width*1.4;add(t,'heart',a,38,-.08,.58+b.width*2,{source:0,primary:true,mixGain:.22});add(t+delay,'heart',a*(.30+b.s*.30),38,-.08,.39+b.width,{source:0,mixGain:.22});}
for(const b of record(1).beats)if(b.time>=47&&b.time<63){add(b.time,'heart',.59*b.height,38,.35,.65,{source:1,primary:true,mixGain:.18});add(b.time+.16,'heart',.24*b.height,38,.35,.43,{source:1,mixGain:.18});}
const H=[[45,52,60,64],[41,48,57,64],[40,48,55,64],[43,50,59,62]];
const melody=[[0,76,1.8],[2,72,1.25],[3.5,71,1],[5,69,2.5],[8,72,1.6],[10,74,1.1],[11.5,71,1.6],[14,64,2.4]];
[ [1.25,76],[3.125,74],[5,72],[6.875,71] ].forEach(([t,n],i)=>piano(t,n,.27-i*.016,3.2,.03));
for(let b=0,t=9;t<47;t+=5,b++){
 const h=H[b%4];chord(t,h,.21,t<29?4.3:3.6);piano(t,h[0]-12,.26,3.2,-.12,{bus:'harmony'});
 if(t>=29)for(let j=0;j<8;j++)piano(t+j*.625,h[[0,2,1,3,1,2,3,1][(j+b)%8]]+12,.19+(j%4===0?.04:0),1.4,Math.sin(j*.7)*.14);
}
for(let phrase=0;phrase<4;phrase++)for(const [beat,n,d] of melody){const t=9+phrase*10+beat*.625;if(t>=46)continue;piano(t,n+(phrase===3&&beat===8?-3:0),.40+Math.sin(phrase+beat)*.027,d+.65,.09);}
const clamp01=x=>Math.max(0,Math.min(1,x));
const ease=x=>{const u=clamp01(x);return u*u*(3-2*u);};
const MAZE_BREAK=131.25,ACCEL_START=63,ACCEL_SPAN=MAZE_BREAK-ACCEL_START;
// The 44 s G phrase completes at 49 s. One integrated beat phase then carries
// its eight-beat harmony all the way through the maze, without section resets.
const beatPhase=t=>t<=ACCEL_START?(t-44)*1.6:19*1.6+(t-ACCEL_START)*1.6+128*(t-ACCEL_START)**3/(180*ACCEL_SPAN**2);
const tempoAt=t=>96+128*clamp01((t-ACCEL_START)/ACCEL_SPAN)**2;
function timeAtBeat(beat){let lo=44,hi=MAZE_BREAK;for(let i=0;i<40;i++){const mid=(lo+hi)/2;if(beatPhase(mid)<beat)lo=mid;else hi=mid;}return (lo+hi)/2;}
const WALK_H=[[45,52,60,64],[41,48,57,64],[43,50,59,62],[45,52,60,64],[41,48,57,64],[48,55,60,64],[43,50,59,62],[50,57,60,65]];
const lastBar=Math.floor((beatPhase(MAZE_BREAK)-8)/8);
function walkHarmony(bar){return bar===lastBar?[43,50,59,64]:WALK_H[bar%WALK_H.length];}
[[46.5,74,-.18],[47.75,71,-.12],[49,72,-.06],[50.875,71,.02],[52.125,69,.08],[54,69,.12],[55.875,67,.15],[57.125,64,.08],[59,67,0],[60.875,71,-.06],[62.125,72,-.08]].forEach(([t,n,p])=>piano(t,n,.35,2.4,p));
for(let beat=8,n=0;beat<beatPhase(MAZE_BREAK);beat+=.5,n++){
 const t=timeAtBeat(beat),bar=Math.floor((beat-8)/8),h=walkHarmony(bar),k=n%16;
 const rise=clamp01((t-ACCEL_START)/ACCEL_SPAN),bpm=tempoAt(t),quarter=60/bpm;
 const subdivisions=n%2===0?1:ease((t-49)/14),density=Math.sqrt(96/bpm);
 const pattern=[1,2,3,2,1,3,2,1,2,3,1,2,3,2,1,2];
 const note=h[pattern[k]]+12;
 piano(t,note,(.205+.08*rise+(k%4===0?.035:0))*density*subdivisions,Math.max(.22,quarter*(1.9-.8*rise)),Math.sin(n*.46)*.15,{mazeBuild:true});
 if(k===0){
  const sustain=Math.min(timeAtBeat(Math.min(beat+8,beatPhase(MAZE_BREAK)))-t,5)*.84;
  piano(t,h[0]-12,.28+.055*rise,Math.max(.4,sustain),-.10,{bus:'harmony',mazeBuild:true});
  h.slice(1).forEach((note,j)=>piano(t+.017*j,note,(.185+.025*rise)*density,Math.max(.4,sustain),j*.10-.10,{bus:'harmony',mazeBuild:true}));
 }
 if(n%2===0){
  add(t,'wood',(.095+.13*rise)*ease((t-59)/8),45,0,.13,{mazeBuild:true});
  add(t,'drive',(.10+.18*rise)*ease((t-63)/18),h[0]-12,Math.sin(n*.21)*.07,quarter*.74,{mazeBuild:true,brightness:rise});
 }
 // Inner notes gradually enter the same clock; they never restart it or replace
 // the fast ending with the previous slow, exposed piano coda.
 const filigree=ease((t-91)/31);
 if(filigree>0){const tt=timeAtBeat(beat+.25);if(tt<MAZE_BREAK-.004)piano(tt,h[pattern[(k+3)%16]]+12,.115*filigree*density,.20,Math.sin(n*.61+.8)*.16,{mazeBuild:true});}
}
// A brief, quiet pencil-like contact marks each actual return; dense repeats
// become a light ticking texture instead of 72 competing chord accents.
for(const run of RETURN_RUNS)add(run.end,'return',.052,69,Math.sin(run.index*.47)*.12,.072,{returnIndex:run.index,mazeBuild:true});
add(MAZE_BREAK,'cyberBreak',.62,38,0,.58,{transitionBreak:true});
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
// One event table drives the contour, the ECG and both sounds of each beat.
for(const b of CODE_BEATS){
 const common={source:0,codeHeart:true,freq:b.freq,mixGain:.64};
 add(b.time,'heart',b.strength,38,0,.61,{...common,primary:true});
 add(b.time+b.second,'heart',b.strength*.38,38,0,.43,{...common,secondary:true,freq:b.freq*1.07});
}
[[174,76],[175.6,74],[177.2,72],[179,71],[180.6,69]].forEach(([t,n],i)=>piano(t,n,.245-i*.034,2.2,.07));
// The final held breath belongs to the heart. Piano tails leave by 184 s.
for(const g of GLITCHES)add(g.start,'glitch',.047,38,0,g.end-g.start,{sharedGlitch:true});
add(STOP_TIME,'flatline',.58,83,0,RESONANCE_END-STOP_TIME,{terminalTail:true,freq:1000});
export const EVENTS=events.sort((a,b)=>a.time-b.time||a.id.localeCompare(b.id));
const HEARTS=EVENTS.filter(e=>e.voice==='heart'||e.voice==='arrival');
export function pulseAtReal(t,source=0){let v=0;for(const e of HEARTS){if(e.time>t)break;const age=t-e.time;if(age<1.5&&(e.source===source||e.voice==='arrival'))v+=e.amp*(1-Math.exp(-age/.015))*Math.exp(-age/.19);}return v;}
export const pulse=(t,source=0)=>pulseAtReal(realTime(t),source);
export const NODE_TIMES=Array.from({length:9},(_,i)=>59.375+i*.625),CONNECTIONS=[];
export const SCORE={title:'心跳 / Heartbeat — 活着的意义',edition:'v13',duration:DURATION,stopTime:STOP_TIME,resonanceEnd:RESONANCE_END,mazeBreak:MAZE_BREAK,bpm:BPM,tempoSections:TEMPO_SECTIONS,sampleRate:48000,chapters:CHAPTERS,events:EVENTS,instruments:'Original composition; Salamander Grand Piano v3 by Alexander Holm, CC BY 3.0; resampled, retuned, filtered and mixed. Original digital transition, pulse drive and sustained electronic flatline.'};
