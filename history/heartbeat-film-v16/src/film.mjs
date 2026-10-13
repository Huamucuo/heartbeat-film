import {W,H,canvas,atmosphere,hash,clamp} from './drawing.mjs';
import {background,firstImpulse,pair,lettering} from './scenes.mjs';
import {records} from './archive.mjs';
import {city} from './city.mjs';
import {codeMaze} from './code-maze.mjs';
import {codeLives} from './code-lives.mjs';
import {GLITCHES,STOP_TIME} from './code-direction.mjs';
import {storyTime} from './timeline.mjs';
import {DURATION,authoredTime,playbackTime,BLUR_START,BLACK_START,LIFE_START} from './pacing.mjs';
import {transitionImage,bridgeECG} from './maze-breath.mjs';
import {CHAPTERS,EVENTS,CONNECTIONS} from './score.mjs';
const width=Number(new URLSearchParams(location.search).get('width')||1920),height=width*9/16;
const film=document.querySelector('#film');film.width=width;film.height=height;
// Export reads every frame, so use the canvas frequent-readback configuration.
const out=film.getContext('2d',{alpha:false,willReadFrequently:true}),world=canvas(width,height),c=world.getContext('2d',{alpha:false,willReadFrequently:true}),cloud=atmosphere();
const bloom=canvas(480,270),bx=bloom.getContext('2d',{willReadFrequently:true});
const grain=canvas(256,256),gx=grain.getContext('2d'),gd=gx.createImageData(256,256);
for(let i=0;i<256*256;i++){const n=hash(i)*255;gd.data.set([n,n,n,255],i*4);}gx.putImageData(gd,0,0);
const grainPattern=out.createPattern(grain,'repeat');
const glitchPlate=canvas(width,height),glitchContext=glitchPlate.getContext('2d');
function scene(t,playback){
 c.setTransform(width/W,0,0,width/W,0,0);c.globalAlpha=1;c.globalCompositeOperation='source-over';
 const v=storyTime(t);background(c,v,cloud);firstImpulse(c,v);records(c,v);city(c,v);pair(c,v);codeMaze(c,t);if(playback<92||playback>=LIFE_START)codeLives(c,t);
}
export function stateAt(t){const at=authoredTime(t);return {t,authoredTime:at,k:Math.max(0,CHAPTERS.findIndex(s=>at>=s.start&&at<s.end)),links:CONNECTIONS.filter(e=>at>=e.time&&at<e.loss+.6).length,eventCount:EVENTS.length};}
export function frame(t,fps=30,samples=1){
 t=clamp(t,0,DURATION-.0001);out.reset();out.setTransform(1,0,0,1,0,0);out.globalAlpha=1;out.globalCompositeOperation='source-over';out.fillStyle='#000';out.fillRect(0,0,width,height);
 // Isolate the single clinical trace from scene, bloom and grain layers.
 if(t>=BLACK_START&&t<LIFE_START){out.setTransform(width/W,0,0,width/W,0,0);bridgeECG(out,t);return stateAt(t);}
 for(let k=0;k<samples;k++){const at=clamp(t+((k+.5)/samples-.5)*.5/fps,0,DURATION-.0001);scene(authoredTime(at),at);out.globalCompositeOperation=k?'lighter':'source-over';out.globalAlpha=1/samples;transitionImage(out,world,at,width,height);}
 out.globalAlpha=1;out.globalCompositeOperation='source-over';out.setTransform(width/W,0,0,width/W,0,0);
 bx.clearRect(0,0,480,270);bx.filter='blur(2px)';bx.drawImage(t>=BLUR_START&&t<LIFE_START+1.2?film:world,0,0,480,270);bx.filter='none';
 out.save();out.globalCompositeOperation='lighter';out.globalAlpha=.24;out.drawImage(bloom,0,0,W,H);out.restore();
 out.save();out.globalAlpha=.018;out.globalCompositeOperation='soft-light';out.fillStyle=grainPattern;out.fillRect(0,0,W,H);out.restore();
 // Type is laid after exposure accumulation, so no sampled duplicate glyphs.
 bridgeECG(out,t);
 const originalTime=authoredTime(t),glitch=GLITCHES.find(g=>originalTime>=g.start&&originalTime<g.end);
 if(glitch){
  glitchContext.reset();glitchContext.drawImage(film,0,0);out.save();out.setTransform(1,0,0,1,0,0);
  for(let k=0;k<7;k++){const y=(190+hash(k+Math.floor(originalTime*16))*695)*width/W,h=(3+hash(k+13)*10)*width/W,dx=glitch.shift*(.4+hash(k+17))*width/W;out.drawImage(glitchPlate,0,y,width,h,dx,y,width,h);}
  out.globalAlpha=.15;out.globalCompositeOperation='screen';out.fillStyle='#a95873';out.fillRect(0,(460+glitch.shift)*width/W,width,2*width/W);out.restore();
 }
 if(t<BLUR_START||t>=LIFE_START)lettering(out,originalTime,CHAPTERS);
 return stateAt(t);
}
const serif=new FontFace('Heartbeat Serif',`url(${new URL('../assets/fonts/NotoSerifSC-VF.ttf',import.meta.url).href})`,{weight:'200 900'});
await serif.load();document.fonts.add(serif);await document.fonts.ready;
window.heartbeat={ready:true,frame,render:t=>frame(t,30,1),stateAt,debugCanvases:()=>({world,bloom}),info:()=>({width,height,renderer:'Canvas 2D with depth projection; native resolution; no PBR',samples:'half-frame exposure in display color space',eventCount:EVENTS.length})};
frame(0);
