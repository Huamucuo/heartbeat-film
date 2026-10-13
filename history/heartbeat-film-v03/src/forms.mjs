export const TAU=Math.PI*2,clamp=(t,a=0,b=1)=>Math.min(b,Math.max(a,t)),mix=(a,b,t)=>a+(b-a)*t;
export const ease=t=>(t=clamp(t))*t*(3-2*t),ramp=(a,b,t)=>ease((t-a)/(b-a));
export function node(k,t){const a=k/9*TAU-Math.PI/2;return [Math.cos(a)*5.4,Math.sin(a)*2.85,Math.sin(a*2)*1.3];}
export function pathPoint(mode,i,u,t,p=0){
 const q=i/23,a=u*TAU,side=i<12?-1:1,j=(i%12)/11;
 if(mode===0){const r=.65+q*5.25;return [r*Math.cos(a),r*Math.sin(a),.13*Math.sin(a*3+q*13-t*.4)+.20*Math.sin(q*22-t*2)*(1-q)];}
 if(mode===1){const r=1.2+Math.sin(q*Math.PI)*1.65,b=a+q*.65;return [Math.cos(b)*r+Math.sin(q*3)*1.0+1.3,Math.sin(b)*r*.78+(q-.5)*2.8,(q-.5)*6.3+.26*Math.sin(a*3+q*8)];}
 if(mode===2){const b=u*TAU*1.4+q*2.7-t*.25;return [(u-.5)*19,Math.sin(b)*1.8+(q-.5)*5.2,Math.cos(b)*2+(q-.5)*3];}
 if(mode===3){const b=a+Math.PI/6+j*.48+side*.13*Math.sin(t*.18),f=Math.cos(Math.PI/6)/Math.cos((b+Math.PI/6)%(Math.PI/3)-Math.PI/6),r=(1.2+Math.sin(j*Math.PI)*1.10)*f;return [side*3.65+Math.cos(b)*r+(j-.5)*side*.7,(j-.5)*5.2+Math.sin(b)*.32,Math.sin(b)*r+p*.13];}
 if(mode===4){const r=(q-.5)*1.55;return [Math.sin(a)*(5.4+r),Math.sin(a*2+r*.45)*(1.8+r*.55),Math.cos(a)*(1.45+r*.6)+Math.sin(a*3+t*.12)*.28];}
 if(mode===5){const x=(u-.5)*19;return [x,(q-.5)*4.8+Math.sin(u*Math.PI)*Math.sin(q*3+t*.1)*.9,Math.sin(u*TAU*1.5+q*4-t*.13)*.8+(q-.5)*1.5];}
 if(mode===6){const layer=Math.floor(i/8),theta=i%8/8*TAU+layer*.27+t*.025,r=.5+(1-Math.cos(a))*(1.55+layer*.32),v=Math.sin(a)*(.35+layer*.16),open=ramp(59,65,t);return [Math.cos(theta)*r-Math.sin(theta)*v,Math.sin(theta)*r*.82+Math.cos(theta)*v,.3+layer*.65+Math.sin(a)*.7+Math.cos(a)*mix(-1.0,1.0,open)];}
 if(mode===7){const c=node(i%9,t),q=Math.floor(i/9),r=.46+q*.2,b=a+i*.17,f=Math.cos(Math.PI/3)/Math.cos((b+Math.PI/3)%(TAU/3)-Math.PI/3);return [c[0]+Math.cos(b)*r*f,c[1]+Math.sin(b)*r*1.65*f,c[2]+(q-1)*.65+Math.sin(b)*.18];}
 const r=2.5+q*2.1,b=a*(1-.035*ramp(82,87,t));return [r*Math.cos(b),r*Math.sin(b),Math.sin(b*2+q*5)*.25+(q-.5)*.8];
}
export const CAMERAS=[
 [0,1.5,13,0,0,0],[6,4,14,1.1,0,0],[1.1,3.2,14,0,0,0],[-.4,2,16,0,0,0],
 [3,2.7,14,0,0,0],[0,4.8,16,0,-.1,0],[3.5,1.8,13,0,0,0],[1,2.5,18,0,0,0],[0,0.5,17,0,0,0]
];
