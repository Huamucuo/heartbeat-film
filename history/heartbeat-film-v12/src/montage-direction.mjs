import {clamp,mix,ramp} from './drawing.mjs';
import {LIFE_SHOTS} from './life-direction.mjs';
export const MONTAGE_START=131,RELEASE_START=173,ENDING_START=182;
// Each miniature keeps its own authored changes, played together in one space.
export const MINI_SCHEDULE=[
 {p:[140,146],q:[156,162]}, {p:[139,144],q:[152,160]},
 {p:[141,148],q:[156,164]}, {p:[140,145],q:[155,161]},
 {p:[137.5,143],q:[156,164]}, {p:[139.5,146],q:[154,163]},
 {p:[140.5,147],q:[157,166]}, {p:[139,144],q:[153,163]},
 {p:[143,150],q:[157,166]}
];
export const MINI_ANCHORS=[[-587,-239,18],[0,-249,-12],[590,-223,30],[-582,43,-18],[0,53,-24],[586,67,20],[-560,346,15],[12,339,-5],[592,356,25]];
export const MINI_SCALES=[.87,.82,.78,.91,.85,.81,.91,.98,.87];
export function miniatureTime(id,t){
 const s=LIFE_SHOTS[id],n=MINI_SCHEDULE[id],points=[[132+id*.16,s.start],[n.p[0],s.p[0]],[n.p[1],s.p[1]],[n.q[0],s.q[0]],[n.q[1],s.q[1]],[172,s.end-.15],[196,s.end+5]];
 let i=0;while(i<points.length-2&&t>points[i+1][0])i++;
 const a=points[i],b=points[i+1],u=clamp((t-a[0])/(b[0]-a[0]));return mix(a[1],b[1],u);
}
export function miniOpacity(id,t){
 return ramp(131.2+id*.12,133.6+id*.12,t);
}
