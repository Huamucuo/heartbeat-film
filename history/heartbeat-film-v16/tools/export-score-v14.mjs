import {writeFile,mkdir} from 'node:fs/promises';
import path from 'node:path';
import {SCORE as AUTHORED_SCORE} from '../src/composition-score.mjs';
import {playbackTime,DURATION} from '../src/pacing.mjs';
import {root} from './runtime.mjs';

const MAZE_START=63,MAZE_BREAK=91.8,SPAN=MAZE_BREAK-MAZE_START;
const START_BPM=132,END_BPM=248;
const clamp=x=>Math.max(0,Math.min(1,x));
const smooth=x=>{const u=clamp(x);return u*u*(3-2*u);};
const events=[];
// Carry the completed opening and the life/ending phrases onto the new picture
// clock. Their acoustic note lengths stay natural. The maze is newly composed.
for(const original of AUTHORED_SCORE.events){
 const early=original.time<MAZE_START;
 const later=original.time>=131&&!original.mazeBuild&&original.voice!=='cyberBreak'&&(!original.codeHeart||original.time>=132.3);
 const mazeHeart=original.codeHeart&&original.time>=MAZE_START&&original.time<130.8;
 const returnContact=original.voice==='return';
 if(!early&&!later&&!mazeHeart&&!returnContact)continue;
 const lifePiano=original.voice==='piano'&&original.time>=131&&original.time<173;
 const time=lifePiano?original.time-33:playbackTime(original.time);
 events.push({...original,id:'v14.'+original.id,time,
  ...(returnContact?{amp:original.amp*.82}:{}),authoredTime:original.time});
}
function add(time,voice,amp,note,pan,duration,extra={}){
 if(time<0||time>=DURATION)return;
 events.push({id:'v14.maze.'+events.length,time,voice,amp,note,pan,duration,...extra});
}
function piano(time,note,amp,duration,pan=0,extra={}){
 add(time,'piano',amp,note,pan,duration,{velocity:3,mazeBuild:true,...extra});
}
// One integrated quadratic tempo phase: no stacked retimed piano attacks and
// no pitch-shifting of the existing recording.
const beatPhase=t=>{
 const x=Math.max(0,t-MAZE_START);
 return START_BPM*x/60+(END_BPM-START_BPM)*x**3/(180*SPAN**2);
};
const totalBeats=beatPhase(MAZE_BREAK);
function timeAtBeat(beat){
 let lo=MAZE_START,hi=MAZE_BREAK;
 for(let i=0;i<40;i++){
  const mid=(lo+hi)/2;
  if(beatPhase(mid)<beat)lo=mid;else hi=mid;
 }
 return (lo+hi)/2;
}
const HARMONIES=[
 [43,50,59,62],[45,52,60,64],[41,48,57,64],[48,55,60,64],
 [45,52,60,64],[41,48,57,64],[50,57,60,65],[43,50,59,62],
 [45,52,60,64],[41,48,57,64],[43,50,59,64]
];
const pattern=[1,2,3,2,1,3,2,1,2,3,1,2,3,2,1,2];
for(let halfBeat=0;halfBeat/2<totalBeats;halfBeat++){
 const beat=halfBeat/2,t=timeAtBeat(beat),u=(t-MAZE_START)/SPAN;
 const bar=Math.floor(beat/8),h=HARMONIES[Math.min(bar,HARMONIES.length-1)];
 const k=halfBeat%16,bpm=START_BPM+(END_BPM-START_BPM)*u*u,quarter=60/bpm;
 const downbeat=halfBeat%2===0;
 // The first phrase has breathing room; inner eighths grow in over the next
 // phrase while the bass and contact rhythm already carry the forward motion.
 const inner=smooth((t-68)/7);
 if(downbeat||inner>.005){
  const strength=(.235+.046*u+(k%4===0?.035:0))*Math.sqrt(132/bpm)*(downbeat?1:inner);
  piano(t,h[pattern[k]]+12,strength,Math.max(.19,quarter*(1.35-.35*u)),Math.sin(halfBeat*.46)*.14);
 }
 if(k===0){
  const phraseLength=timeAtBeat(Math.min(beat+8,totalBeats))-t;
  const finalPhrase=beat+8>=totalBeats;
  piano(t,h[0]-12,.30+.075*u,finalPhrase?4.2:Math.max(.4,Math.min(3.2,phraseLength*.80)),-.1,{bus:'harmony'});
  h.slice(1).forEach((note,j)=>piano(t+j*.017,note,(.175+.025*u)*Math.sqrt(132/bpm),finalPhrase?4.35:Math.max(.35,phraseLength*.74),j*.1-.1,{bus:'harmony'}));
 }
 if(downbeat){
  add(t,'wood',.105+.14*u,45,Math.sin(halfBeat*.31)*.035,.105,{mazeBuild:true});
  add(t,'drive',.11+.21*smooth(u),h[0]-12,Math.sin(halfBeat*.21)*.06,quarter*.73,{mazeBuild:true,brightness:u});
 }
 // Tight, restrained offbeats make the last third press forward. All voices
 // share this tempo, then the final bar releases under the foreground ECG.
 if(!downbeat&&u>.64){
  add(t,'wood',.047*smooth((u-.64)/.28),45,0,.072,{mazeBuild:true});
  add(t,'drive',.07*smooth((u-.64)/.28),h[0]-12,0,quarter*.42,{mazeBuild:true,brightness:u});
 }
}
for(const [i,t] of [92.1,93.2,94.3].entries()){
 const strength=.93-i*.085,freq=58-i*7;
 const common={source:0,codeHeart:true,freq,mixGain:.72,bridgeHeart:true};
 add(t,'heart',strength,38,0,.72,{...common,primary:true});
 add(t+.16,'heart',strength*.38,38,0,.46,{...common,secondary:true,freq:freq*1.07});
}
events.sort((a,b)=>a.time-b.time||a.id.localeCompare(b.id));
const score={
 ...AUTHORED_SCORE,edition:'v14',duration:DURATION,
 stopTime:playbackTime(AUTHORED_SCORE.stopTime),
 resonanceEnd:playbackTime(AUTHORED_SCORE.resonanceEnd),
 pianoReleaseStart:playbackTime(182),pianoReleaseEnd:playbackTime(184),mazeBreak:MAZE_BREAK,
 mazeReleaseEnd:95.8,silenceStart:95.9,silenceEnd:98,lifeFadeInEnd:99.2,
 tempoSections:[
  {...AUTHORED_SCORE.tempoSections[0]},
  {start:MAZE_START,end:MAZE_BREAK,bpm:START_BPM,endBpm:END_BPM,curve:'quadratic',meter:'4/4',name:'紧凑、连续加速的迷途'},
  {start:91.8,end:95.9,bpm:54.54545,meter:'free',name:'心电图与三次清晰心跳'},
  {start:95.9,end:98,bpm:0,meter:'silence',name:'全黑静默'},
  ...AUTHORED_SCORE.tempoSections.slice(2).map((section,i)=>({...section,start:i===0?98:playbackTime(section.start),end:playbackTime(section.end)}))
 ],
 chapters:AUTHORED_SCORE.chapters.map(chapter=>({...chapter,
  start:chapter.id==='silence'?92:chapter.id==='lives'?98:playbackTime(chapter.start),
  end:chapter.id==='maze'?92:chapter.id==='silence'?98:playbackTime(chapter.end)
 })),
 events,
 instruments:AUTHORED_SCORE.instruments,
 arrangement:'New 132–248 BPM maze in 28.8 seconds; original acoustic pitches, sparse first phrase, growing eighth notes, bass and percussion. Music releases 91.8–95.8 beneath three foreground heartbeats at 92.1, 93.2, 94.3. Exact silence 95.9–98.0; life piano begins softly at 98.0. Opening retained from the v13 master; authored return and heartbeat positions mapped to the shortened picture; life and ending retain natural note lengths.'
};
await mkdir(path.join(root,'audio'),{recursive:true});
await writeFile(path.join(root,'audio/score.json'),JSON.stringify(score,null,2));
console.log(`${events.length} events; ${DURATION} seconds; maze break ${MAZE_BREAK.toFixed(6)} seconds.`);
