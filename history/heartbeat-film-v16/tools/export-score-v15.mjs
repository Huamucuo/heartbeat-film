import {writeFile,mkdir} from 'node:fs/promises';
import path from 'node:path';
import {SCORE as AUTHORED_SCORE} from '../src/composition-score.mjs';
import {playbackTime,DURATION} from '../src/pacing.mjs';
import {root} from './runtime.mjs';

const MAZE_START=63,RELEASE_START=88.4,RELEASE_END=92.2;
const SPAN=RELEASE_START-MAZE_START,START_BPM=96,END_BPM=116;
const BRIDGE_R=94.25,LIFE_START=98;
const events=[];
// Preserve the established opening and life/ending note lengths. The visual
// return counter is free to accelerate without adding a sound for every flip.
for(const original of AUTHORED_SCORE.events){
 const early=original.time<MAZE_START;
 const later=original.time>=131&&!original.mazeBuild&&original.voice!=='cyberBreak'&&(!original.codeHeart||original.time>=132.3);
 if(!early&&!later)continue;
 const lifePiano=original.voice==='piano'&&original.time>=131&&original.time<173;
 const time=lifePiano?original.time-33:playbackTime(original.time);
 events.push({...original,id:'v15.'+original.id,time,authoredTime:original.time});
}
function add(time,voice,amp,note,pan,duration,extra={}){
 if(time<0||time>=DURATION)return;
 events.push({id:'v15.maze.'+events.length,time,voice,amp,note,pan,duration,...extra});
}
function piano(time,note,amp,duration,pan=0,extra={}){
 add(time,'piano',amp,note,pan,duration,{velocity:3,mazeBuild:true,...extra});
}
// A modest, integrated accelerando. The picture may race while the phrasing
// stays spacious; no sixteenth-note or late percussion layer is introduced.
const beatPhase=t=>{
 const x=Math.max(0,t-MAZE_START);
 return START_BPM*x/60+(END_BPM-START_BPM)*x**3/(180*SPAN**2);
};
const totalBeats=beatPhase(RELEASE_START);
function timeAtBeat(beat){
 let lo=MAZE_START,hi=RELEASE_START;
 for(let i=0;i<40;i++){
  const mid=(lo+hi)/2;
  if(beatPhase(mid)<beat)lo=mid;else hi=mid;
 }
 return (lo+hi)/2;
}
const HARMONIES=[
 [43,50,59,62],[45,52,60,64],[41,48,57,64],
 [48,55,60,64],[50,57,60,65],[43,50,59,64]
];
const MELODIES=[
 [[0,74,1.9],[1.5,71,1.5],[3,67,2.0],[4,69,1.6],[5.5,71,1.9],[7,74,2.2]],
 [[0,76,2.1],[2,72,1.7],[3.5,71,1.5],[5,69,2.6],[7,64,2.1]],
 [[0,69,2.2],[1.5,72,1.9],[3.5,76,2.5],[6,72,2.6]],
 [[0,76,1.9],[2,74,1.8],[3.5,72,2.0],[5.5,67,2.3],[7,64,2.0]],
 [[0,77,2.3],[2.5,76,1.9],[4,72,2.6],[6.5,69,2.8]],
 [[0,71,3.0],[2,67,3.2]]
];
for(let bar=0,firstBeat=0;firstBeat<totalBeats;bar++,firstBeat+=8){
 const t=timeAtBeat(firstBeat),u=(t-MAZE_START)/SPAN;
 const h=HARMONIES[Math.min(bar,HARMONIES.length-1)];
 const finalPhrase=firstBeat+8>=totalBeats;
 const span=timeAtBeat(Math.min(firstBeat+8,totalBeats))-t;
 const sustain=finalPhrase?RELEASE_END-t:Math.max(2.5,span*.88);
 piano(t,h[0]-12,.29+.04*u,sustain,-.08,{bus:'harmony'});
 h.slice(1).forEach((note,j)=>piano(t+j*.020,note,.178+.016*u,sustain,j*.075-.075,{bus:'harmony'}));
 for(const [offset,note,length] of MELODIES[Math.min(bar,MELODIES.length-1)]){
  if(firstBeat+offset>=totalBeats)continue;
  const noteTime=timeAtBeat(firstBeat+offset);
  piano(noteTime,note,.285+.016*Math.sin(bar*1.2+offset),length,.06*Math.sin(offset*.7));
 }
 // Quiet half-time pulse anchors the maze without doubling the piano rhythm.
 for(let offset=0;offset<8;offset+=2){
  const beat=firstBeat+offset;
  if(beat>=totalBeats||finalPhrase)continue;
  const tt=timeAtBeat(beat),rise=(tt-MAZE_START)/SPAN;
  add(tt,'drive',.11+.065*rise,h[0]-12,0,.42,{mazeBuild:true,brightness:.10+.12*rise});
  if(offset===2||offset===6)add(tt,'wood',.075+.03*rise,45,0,.11,{mazeBuild:true});
 }
}
// One isolated cardiac cycle; both components are one lub-dub, not two pulses.
const common={source:0,codeHeart:true,freq:56,mixGain:.72,bridgeHeart:true};
add(BRIDGE_R,'heart',.91,38,0,.68,{...common,primary:true});
add(BRIDGE_R+.16,'heart',.91*.38,38,0,.44,{...common,secondary:true,freq:59.92});

events.sort((a,b)=>a.time-b.time||a.id.localeCompare(b.id));
const score={
 ...AUTHORED_SCORE,edition:'v15',duration:DURATION,
 stopTime:playbackTime(AUTHORED_SCORE.stopTime),
 resonanceEnd:playbackTime(AUTHORED_SCORE.resonanceEnd),
 pianoReleaseStart:playbackTime(182),pianoReleaseEnd:playbackTime(184),
 mazeBreak:RELEASE_START,mazeReleaseEnd:RELEASE_END,
 bridgeMusicFadeStart:RELEASE_START,bridgeMusicMuteStart:RELEASE_END,bridgeMusicMuteEnd:LIFE_START,
 silenceRanges:[[RELEASE_END,BRIDGE_R],[95.8,LIFE_START]],
 silenceStart:95.8,silenceEnd:LIFE_START,lifeFadeInEnd:99.2,bridgeHeartbeat:BRIDGE_R,
 tempoSections:[
  {...AUTHORED_SCORE.tempoSections[0]},
  {start:MAZE_START,end:RELEASE_START,bpm:START_BPM,endBpm:END_BPM,curve:'quadratic',meter:'4/4',name:'留出呼吸的迷途'},
  {start:RELEASE_START,end:RELEASE_END,bpm:0,meter:'release',name:'音乐渐出'},
  {start:RELEASE_END,end:LIFE_START,bpm:0,meter:'free',name:'黑场中的一次心搏'},
  ...AUTHORED_SCORE.tempoSections.slice(2).map((section,i)=>({...section,start:i===0?LIFE_START:playbackTime(section.start),end:playbackTime(section.end)}))
 ],
 chapters:AUTHORED_SCORE.chapters.map(chapter=>({...chapter,
  start:chapter.id==='silence'?92.3:chapter.id==='lives'?LIFE_START:playbackTime(chapter.start),
  end:chapter.id==='maze'?92.3:chapter.id==='silence'?LIFE_START:playbackTime(chapter.end)
 })),
 events,instruments:AUTHORED_SCORE.instruments,
 arrangement:'New spacious 96–116 BPM maze: five- or six-note eight-beat phrases, sustained harmony, half-time low pulse and restrained wood accents. No maze return ticks, repeating heartbeats, extra late subdivisions or frantic percussion. All music including reverb releases 88.4–92.2 and is absent until 98.0. One isolated lub-dub at 94.25 / 94.41 accompanies the red ECG; exact silence returns by 95.8. Life entry 98.0–99.2. Opening retained from v13 master; life and ending retain natural acoustic note lengths.'
};
await mkdir(path.join(root,'audio'),{recursive:true});
await writeFile(path.join(root,'audio/score.json'),JSON.stringify(score,null,2));
console.log(`${events.length} events; ${DURATION} seconds; maze ${START_BPM}–${END_BPM} BPM; one bridge heartbeat ${BRIDGE_R}.`);
