import {makeScore} from './score.mjs';
export const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
export const ease=x=>{const a=clamp(x); return a*a*(3-2*a);};
export const lerp=(a,b,x)=>a+(b-a)*x;
const score=makeScore();

function impulse(t,voices) {
  let sum=0;
  for(const e of score) {
    const d=t-e.time;
    if(voices.includes(e.voice)&&d>=0&&d<1.4) sum+=e.amp*Math.exp(-d*6.5)*(.24+.76*(1-Math.exp(-d*95)));
  }
  return sum;
}

export function sampleState(t) {
  if(!Number.isFinite(t)) throw new TypeError('Source time must be finite');
  const growth=ease((t-17.5)/5);
  const responseAge=t>=57.5?t-57.5:-1;
  const second=t>=35;
  const pull=ease((t-58)/7);
  const camera=second?{
    position:[lerp(0.6,0.35,pull),lerp(4.4,6.4,pull),lerp(8.7,10.8,pull)],
    target:[0,0,0],fov:36,
  }:{
    position:[lerp(0.35,0.1,growth),lerp(7.8,4.8,growth),lerp(9.2,10.3,growth)],
    target:[0,0,0],fov:36,
  };
  return {
    time:t, ids:['pulse.origin','pulse.reply','trace.main','membrane.main'],
    growth, camera, second,
    originImpulse:impulse(t,['pulse','arrival']),
    replyImpulse:impulse(t,['reply']),
    echoProgress:clamp((t-56.875)/0.625),
    echoActive:t>=56.875&&t<57.5,
    responseAge,
    exposure:second?lerp(0.28,1.10,ease((t-57.5)/3)):lerp(0.90,1.10,growth),
    breath:0.014*Math.sin(t*2*Math.PI/5),
  };
}
