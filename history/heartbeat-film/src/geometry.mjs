export function surfaceHeight(x,z,t,s) {
  const r=Math.hypot(x/3.6,z/2.25),a=Math.atan2(z/2.25,x/3.6);
  let y=.70*Math.sin(a*2+.38)*Math.pow(r,1.55)+.33*Math.cos(a-.5)*r+.18*Math.sin(a*5+.6)*r*r;
  y+=.12*Math.sin(x*.9+z*.7+t*.23)*r;
  const d=Math.hypot(x+1.35,z-.18);
  if(s.responseAge>=0){
    const attack=1-Math.exp(-s.responseAge*12);
    y+=.12*attack*(1-Math.exp(-d*d*4))*Math.exp(-Math.pow((d-s.responseAge*1.8)/.4,2))*Math.exp(-s.responseAge*.17);
  }
  return y;
}
