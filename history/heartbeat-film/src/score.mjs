export const FPS = 30;
export const SAMPLE_RATE = 48000;
export const BPM = 96;
export const EXCERPTS = [
  { id:'01-emergence', title:'痕迹成为材料', start:17.5, end:22.5 },
  { id:'02-answer', title:'等待之后，回声返回', start:55, end:65 },
];

/** A single original score: exact seconds, independent of video frame rate. */
export function makeScore() {
  const events=[];
  const add=(id,time,voice,amp,note=57,pan=0,duration=1)=>events.push({id,time,voice,amp,note,pan,duration});
  for(let i=1;i<72;i++) {
    const t=i*1.25;
    if(t>=55 && t<58.75) continue;
    const a=t<10?0.70:t<47.5?0.84:t<55?0.52:t<82.5?0.84:0.64;
    add(`origin.${i}.a`,t,'pulse',a,33,-0.21,0.8);
    add(`origin.${i}.b`,t+0.16,'pulse',a*0.47,33,-0.21,0.5);
  }
  for(let i=0;i<10;i++) {
    const t=35.3125+i*1.25;
    add(`reply.${i}.a`,t,'reply',0.43,45,0.54,0.85);
    add(`reply.${i}.b`,t+0.16,'reply',0.2,45,0.54,0.55);
  }
  add('echo.depart',56.875,'reply',0.58,57,0.62,0.625);
  add('echo.path',56.875,'path',0.52,69,0,0.625);
  add('echo.arrive',57.5,'arrival',0.90,33,-0.21,1.5);
  add('echo.arrive.recoil',57.66,'pulse',0.36,33,-0.21,0.6);
  // Spacious motif, deliberately leaving the wait with only sustained air.
  const phrases=[
    [8.125,57,0.30],[10,64,0.32],[11.875,71,0.22],
    [15,57,0.34],[16.875,64,0.33],[18.125,71,0.34],[20,64,0.32],[21.875,69,0.28],
    [25,57,0.33],[27.5,64,0.29],[30,71,0.31],[32.5,76,0.27],
    [36.25,60,0.30],[38.125,67,0.29],[40.625,71,0.28],[43.125,64,0.25],
    [47.5,57,0.21],[50,64,0.16],[52.5,71,0.13],
    [58.125,57,0.39],[59.375,64,0.32],[60.625,71,0.37],[62.5,76,0.32],[64.375,71,0.28],
    [66.25,57,0.35],[68.125,64,0.34],[70,71,0.34],[72.5,69,0.33],
    [75,64,0.32],[77.5,71,0.28],[80,76,0.24],[83.125,64,0.22],[86.25,57,0.19],
  ];
  phrases.forEach(([t,n,a],i)=>add(`motif.${i}`,t,'felt',a,n,Math.sin(i*1.8)*0.3,4.5));
  return events.sort((a,b)=>a.time-b.time||a.id.localeCompare(b.id));
}
