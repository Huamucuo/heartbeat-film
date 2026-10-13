import {random} from './heart-records.mjs';
import {MAZE_RUNS} from './timeline.mjs';
export const COLS=31,ROWS=23,CELL=90,ORIGIN_CELL=11*COLS+15;
export const ORIGIN_PILLARS=[[-68,-68],[-68,68],[68,-68],[68,68]];
const r=random(731091),edges=Array.from({length:COLS*ROWS},()=>new Set()),seen=new Set([ORIGIN_CELL]),stack=[ORIGIN_CELL];
export const cellPosition=id=>[(id%COLS-(COLS-1)/2)*CELL,0,(Math.floor(id/COLS)-(ROWS-1)/2)*CELL];
function neighbours(id){const x=id%COLS,z=Math.floor(id/COLS);return [[x-1,z],[x+1,z],[x,z-1],[x,z+1]].filter(([a,b])=>a>=0&&b>=0&&a<COLS&&b<ROWS).map(([a,b])=>b*COLS+a);}
function join(a,b){edges[a].add(b);edges[b].add(a);}
while(stack.length){const a=stack.at(-1),options=neighbours(a).filter(b=>!seen.has(b));if(!options.length){stack.pop();continue;}const b=options[Math.floor(r()*options.length)];join(a,b);seen.add(b);stack.push(b);}
// A braided maze permits three genuinely different loops rather than replaying
// the same solution backwards. The small origin courtyard has a unique scar.
for(let a=0;a<edges.length;a++)for(const b of neighbours(a))if(a<b&&!edges[a].has(b)&&r()<.105)join(a,b);
for(let z=10;z<=12;z++)for(let x=14;x<=16;x++){const a=z*COLS+x;for(const b of neighbours(a))if(b%COLS>=14&&b%COLS<=16&&Math.floor(b/COLS)>=10&&Math.floor(b/COLS)<=12)join(a,b);}
export function pathBetween(start,end){const q=[start],previous=new Map([[start,-1]]);for(let i=0;i<q.length&&!previous.has(end);i++)for(const n of edges[q[i]])if(!previous.has(n)){previous.set(n,q[i]);q.push(n);}if(!previous.has(end))throw new Error('Disconnected maze');const out=[];for(let n=end;n!==-1;n=previous.get(n))out.push(n);return out.reverse();}
const waypointGroups=[[[10,6],[19,7]],[[25,18],[26,5],[18,4]],[[3,18],[2,3],[28,3],[28,20]]];
export const ROUTES=waypointGroups.map(points=>{const targets=[ORIGIN_CELL,...points.map(([x,z])=>z*COLS+x),ORIGIN_CELL],route=[ORIGIN_CELL];for(let i=1;i<targets.length;i++)route.push(...pathBetween(targets[i-1],targets[i]).slice(1));return route;});
export const WALLS=[];
for(let z=0;z<ROWS;z++)for(let x=0;x<COLS;x++){
 const a=z*COLS+x,[X,,Z]=cellPosition(a);
 if(z===0)WALLS.push({x:X,z:Z-CELL/2,w:CELL+12,d:12,seed:a*4});
 if(x===0)WALLS.push({x:X-CELL/2,z:Z,w:12,d:CELL+12,seed:a*4+1});
 if(x===COLS-1||!edges[a].has(a+1))WALLS.push({x:X+CELL/2,z:Z,w:12,d:CELL+12,seed:a*4+2});
 if(z===ROWS-1||!edges[a].has(a+COLS))WALLS.push({x:X,z:Z+CELL/2,w:CELL+12,d:12,seed:a*4+3});
}
export const hasPassage=(a,b)=>edges[a]?.has(b)||false;
export function routePoint(index,u){const cells=ROUTES[index],v=Math.max(0,Math.min(1,u))*(cells.length-1),i=Math.min(cells.length-2,Math.floor(v)),k=v-i,a=cellPosition(cells[i]),b=cellPosition(cells[i+1]);return {position:a.map((p,j)=>p+(b[j]-p)*k),direction:[b[0]-a[0],0,b[2]-a[2]],cell:cells[i],next:cells[i+1],fraction:k,progress:v};}
export function mazeAt(t){let index=MAZE_RUNS.findIndex(s=>t<s.end);if(index<0)index=2;const run=MAZE_RUNS[index],u=Math.max(0,Math.min(1,(t-run.start)/(run.end-run.start)));return {...routePoint(index,u),index,u,completed:MAZE_RUNS.filter(s=>t>=s.end).length};}
