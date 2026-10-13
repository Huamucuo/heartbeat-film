import {ramp,text,gold,ivory,path} from './drawing.mjs';
// One date step per 96 BPM beat, shared by the foreground memory and later stack.
export function dayAt(t){
 const beat=Math.max(0,(t-10)/.625),step=Math.floor(beat),age=(beat-step)*.625;
 return {number:54+step,settled:ramp(0,.18,age)};
}
export function drawDay(c,t,x,y,size,alpha,options={}){
 const day=dayAt(t);text(c,'DAY '+String(day.number).padStart(3,'0'),x,y+(1-day.settled)*size*.16,size*(1+(1-day.settled)*.045),gold,alpha*(.8+.2*day.settled),options);
}
// The date is the subject of this shot: three stable columns, a true beat count,
// and a brief vertical handover. Only changed digits roll; no random counters.
export function drawDayHero(c,t,x,y,alpha){
 const {number,settled}=dayAt(t),before=String(number-1).padStart(3,'0'),now=String(number).padStart(3,'0');
 text(c,'DAY',x,y-106,18,gold,alpha*.80,{tracking:7});
 c.save();c.beginPath();c.rect(x-132,y-73,264,151);c.clip();
 for(let i=0;i<now.length;i++){
  const xx=x+(i-(now.length-1)/2)*75;
  if(before[i]===now[i])text(c,now[i],xx,y,126,ivory,alpha);
  else{
   text(c,before[i],xx,y-settled*146,126,ivory,alpha*(1-settled*.55));
   text(c,now[i],xx,y+(1-settled)*146,126,ivory,alpha*(.45+.55*settled));
  }
 }
 c.restore();
 path(c,[[x-112,y+99],[x+112,y+99]],gold,alpha*.35,.8);
 text(c,'已经过去的日子',x,y+139,25,ivory,alpha*.78,{tracking:4});
 text(c,'再也不能重来',x,y+182,18,gold,alpha*.63,{tracking:3});
}
