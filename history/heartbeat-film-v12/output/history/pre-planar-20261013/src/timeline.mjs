// Authored time, in seconds. Older opening compositions keep their own clock;
// the maze, independent heart records, score and lived scenes use real film time.
export const DURATION=196;
const knots=[[0,0],[7.5,9],[17.5,29],[27.5,47],[37.5,63],[47.5,121],[57.5,131],[80,182],[90,196]];
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
 {start:131,end:173,id:'lives',zh:'日常',en:'ALL THESE LIVES, AT ONCE'},
 {start:173,end:182,id:'absence',zh:'留下',en:'WHAT REMAINS'},
 {start:182,end:196,id:'return',zh:'心跳',en:'HEARTBEAT'}
];
export const MAZE_RUNS=[{start:66,end:82,color:0},{start:85,end:102,color:1},{start:104,end:118.5,color:2}];
export const SUBTITLES=[
 [2.1,7.8,'开始，并没有问过我。'],[13,23.8,'每一天，都不完全一样。'],
 [33,43.5,'我们把忙碌，当作方向。'],[50,59.5,'靠近，并不意味着抵达。'],
 [66.6,73,'我以为，再往前一点。'],[77,83.8,'就能离开这里。'],
 [88,95,'换一条路，换一种活法。'],[106,112.5,'路，越来越多。'],
 [118.8,125.5,'但每一条路的终点，总是一致。'],[126,130.5,'世界没有回答。'],
 [135.5,140.5,'日子，曾有具体的模样。'],
 [148.5,153.5,'一切都在改变。'],[165.5,171.5,'有些东西，却没有再回来。'],
 [175.5,181,'我们仍想从中，找到意义。']
];
