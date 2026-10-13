// Authored time, in seconds. Older opening compositions keep their own clock;
// the maze, independent heart records, score and lived scenes use real film time.
import {LIFE_SHOTS} from './life-direction.mjs';
export const DURATION=340;
const knots=[[0,0],[7.5,9],[17.5,29],[27.5,47],[37.5,63],[47.5,121],[57.5,131],[80,326],[90,340]];
function map(t,from,to){let i=0;while(i<knots.length-2&&t>knots[i+1][from])i++;const a=knots[i],b=knots[i+1];return a[to]+(t-a[from])/(b[from]-a[from])*(b[to]-a[to]);}
export const realTime=t=>map(t,0,1);
export const storyTime=t=>map(t,1,0);
export const CHAPTERS=[
 {start:0,end:9,id:'imprint',zh:'发生',en:'A FIRST IMPULSE'},
 {start:9,end:29,id:'memory',zh:'日子',en:'NO TWO DAYS ARE THE SAME'},
 {start:29,end:47,id:'city',zh:'奔赴',en:'MOTION IS NOT DIRECTION'},
 {start:47,end:63,id:'pair',zh:'彼此',en:'TWO DIFFERENT RHYTHMS'},
 {start:63,end:121,id:'maze',zh:'迷途',en:'THE WAY BACK'},
 {start:121,end:131,id:'silence',zh:'空白',en:'THE WORLD DOES NOT ANSWER'},
 {start:131,end:141,id:'lives',zh:'日常',en:'THINGS WE CALLED A LIFE'},
 ...LIFE_SHOTS.map(s=>({start:s.start,end:s.end,id:'life-'+s.id,zh:s.name,en:['A VOICE ACROSS THE DISTANCE','PAGES BECOME NIGHTS','A WINDOW IN THE CITY','FASTER THROUGH THE SAME DAYS','THE OTHER CUP','MARKS ON A DOORFRAME','WHAT THE BODY REMEMBERS','ANOTHER YEAR','AT THE THRESHOLD'][s.id]})),
 {start:315,end:326,id:'absence',zh:'留下',en:'WHAT REMAINS'},
 {start:326,end:340,id:'return',zh:'心跳',en:'HEARTBEAT'}
];
export const MAZE_RUNS=[{start:66,end:82,color:0},{start:85,end:102,color:1},{start:104,end:118.5,color:2}];
export const SUBTITLES=[
 [2.1,7.8,'开始，并没有问过我。'],[13,23.8,'每一天，都不完全一样。'],
 [33,43.5,'我们把忙碌，当作方向。'],[50,59.5,'靠近，并不意味着抵达。'],
 [66.6,73,'我以为，再往前一点。'],[77,83.8,'就能离开这里。'],
 [88,95,'换一条路，换一种活法。'],[106,112.5,'这一次，我走得更远。'],
 [118.8,125.5,'可这道痕迹，我认得。'],[126,130.5,'世界没有回答。'],
 [135.5,140.5,'日子，曾有具体的模样。'],...LIFE_SHOTS.map(s=>s.line),
 [319,324.5,'我们仍想从中，找到意义。']
];
