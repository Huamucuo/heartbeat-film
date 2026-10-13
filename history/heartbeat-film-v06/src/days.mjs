import {ramp,text,gold} from './drawing.mjs';
// One date step per 96 BPM beat, shared by the foreground memory and later stack.
export function dayAt(t){
 const beat=Math.max(0,(t-10)/.625),step=Math.floor(beat),age=(beat-step)*.625;
 return {number:54+step,settled:ramp(0,.18,age)};
}
export function drawDay(c,t,x,y,size,alpha,options={}){
 const day=dayAt(t);text(c,'DAY '+String(day.number).padStart(3,'0'),x,y+(1-day.settled)*size*.16,size*(1+(1-day.settled)*.045),gold,alpha*(.8+.2*day.settled),options);
}
