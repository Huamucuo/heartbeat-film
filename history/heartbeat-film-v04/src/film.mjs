import {W,H,canvas,atmosphere,hash,clamp} from './drawing.mjs';
import {background,firstImpulse,records,pair,labyrinth,silence,relations,ending,lettering} from './scenes.mjs';
import {CHAPTERS,EVENTS,CONNECTIONS} from './score.mjs';
const width=Number(new URLSearchParams(location.search).get('width')||1920),height=width*9/16;
const film=document.querySelector('#film');film.width=width;film.height=height;
// Export reads every frame, so use the canvas frequent-readback configuration.
const out=film.getContext('2d',{alpha:false,willReadFrequently:true}),world=canvas(width,height),c=world.getContext('2d',{alpha:false,willReadFrequently:true}),cloud=atmosphere();
const bloom=canvas(480,270),bx=bloom.getContext('2d',{willReadFrequently:true});
const grain=canvas(256,256),gx=grain.getContext('2d'),gd=gx.createImageData(256,256);
for(let i=0;i<256*256;i++){const n=hash(i)*255;gd.data.set([n,n,n,255],i*4);}gx.putImageData(gd,0,0);
const grainPattern=out.createPattern(grain,'repeat');
function scene(t){
 c.setTransform(width/W,0,0,width/W,0,0);c.globalAlpha=1;c.globalCompositeOperation='source-over';
 background(c,t,cloud);firstImpulse(c,t);records(c,t);pair(c,t);labyrinth(c,t);silence(c,t);relations(c,t);ending(c,t);
}
export function stateAt(t){return {t,k:Math.max(0,CHAPTERS.findIndex(s=>t>=s.start&&t<s.end)),links:CONNECTIONS.filter(e=>t>=e.time&&t<e.loss+.6).length,eventCount:EVENTS.length};}
export function frame(t,fps=30,samples=1){
 t=clamp(t,0,89.9999);out.reset();out.setTransform(1,0,0,1,0,0);out.globalAlpha=1;out.globalCompositeOperation='source-over';out.fillStyle='#000';out.fillRect(0,0,width,height);
 for(let k=0;k<samples;k++){const at=clamp(t+((k+.5)/samples-.5)*.5/fps,0,89.9999);scene(at);out.globalCompositeOperation=k?'lighter':'source-over';out.globalAlpha=1/samples;out.drawImage(world,0,0);}
 out.globalAlpha=1;out.globalCompositeOperation='source-over';out.setTransform(width/W,0,0,width/W,0,0);
 bx.clearRect(0,0,480,270);bx.filter='blur(2px)';bx.drawImage(world,0,0,480,270);bx.filter='none';
 out.save();out.globalCompositeOperation='lighter';out.globalAlpha=.24;out.drawImage(bloom,0,0,W,H);out.restore();
 out.save();out.globalAlpha=.018;out.globalCompositeOperation='soft-light';out.fillStyle=grainPattern;out.fillRect(0,0,W,H);out.restore();
 // Type is laid after exposure accumulation, so no sampled duplicate glyphs.
 lettering(out,t,CHAPTERS);
 return stateAt(t);
}
await document.fonts.ready;
window.heartbeat={ready:true,frame,render:t=>frame(t,30,1),stateAt,debugCanvases:()=>({world,bloom}),info:()=>({width,height,renderer:'Canvas 2D with depth projection; native resolution; no PBR',samples:'half-frame exposure in display color space',eventCount:EVENTS.length})};
frame(0);
