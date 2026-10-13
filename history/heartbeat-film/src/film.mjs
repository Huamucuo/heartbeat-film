import * as THREE from '../assets/vendor/three.module.min.js';
import {sampleState,clamp,ease,lerp} from './state.mjs';
import {membraneMaterial,coreMaterial,haloTexture,palette} from './materials.mjs';
import {surfaceHeight} from './geometry.mjs';

const canvas=document.querySelector('#film');
const query=new URLSearchParams(location.search);
const width=Number(query.get('width')||1920),height=Number(query.get('height')||1080);
const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,preserveDrawingBuffer:true,powerPreference:'high-performance'});
renderer.setSize(width,height,false);renderer.setPixelRatio(1);
renderer.setClearColor('#0B1018',1);renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.18;
const scene=new THREE.Scene();
const camera=new THREE.PerspectiveCamera(36,width/height,.05,100);

// One deformed polar disk. Its UVs and indices stay fixed throughout every shot.
const RINGS=112,ARCS=320,positions=new Float32Array((RINGS+1)*(ARCS+1)*3),uvs=new Float32Array((RINGS+1)*(ARCS+1)*2),indices=[];
for(let r=0;r<=RINGS;r++)for(let a=0;a<=ARCS;a++){
  const i=r*(ARCS+1)+a;uvs[i*2]=a/ARCS;uvs[i*2+1]=r/RINGS;
  if(r<RINGS&&a<ARCS){const b=i+ARCS+1;indices.push(i,b,i+1,i+1,b,b+1);}
}
const geometry=new THREE.BufferGeometry();
geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));
geometry.setAttribute('uv',new THREE.BufferAttribute(uvs,2));geometry.setIndex(indices);
const material=membraneMaterial(),surface=new THREE.Mesh(geometry,material);surface.name='membrane.main';scene.add(surface);

function surfacePoint(x,z,t,s) {
  return new THREE.Vector3(x,surfaceHeight(x,z,t,s),z);
}

// The trace is retained as a bright, interrupted selvedge. Other curves are fibers.
function makeLine(n,color,opacity){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(new Float32Array(n*3),3));const m=new THREE.LineBasicMaterial({color,transparent:true,opacity,depthWrite:false});const l=new THREE.Line(g,m);scene.add(l);return l;}
const rim=makeLine(641,'#E7DAC5',.8);rim.name='trace.main';
const innerRim=makeLine(641,'#F16A5B',.2);
const path=makeLine(241,'#E7DAC5',.14);path.name='trace.connection';
const echoTail=makeLine(101,'#66C7C0',.9);
const radialFibers=Array.from({length:30},(_,i)=>makeLine(110,i%4===0?'#F16A5B':'#E7DAC5',.14));

const halo=haloTexture();
function makeCore(color,name,size){
  const group=new THREE.Group();group.name=name;
  const mat=coreMaterial(color),orb=new THREE.Mesh(new THREE.SphereGeometry(size,56,36),mat);orb.scale.set(1,.83,1);group.add(orb);
  const glow=new THREE.Sprite(new THREE.SpriteMaterial({map:halo,color,transparent:true,opacity:.45,blending:THREE.AdditiveBlending,depthWrite:false}));glow.scale.setScalar(size*10);group.add(glow);
  // A thin persistent seam is more identifiable than a featureless glowing dot.
  const seam=new THREE.Mesh(new THREE.TorusGeometry(size*1.04,.002,6,72,Math.PI*1.79),new THREE.MeshBasicMaterial({color:palette.ivory,transparent:true,opacity:.22}));
  seam.rotation.x=.85;seam.rotation.z=-.5;group.add(seam);scene.add(group);
  return {group,orb,mat,glow,seam,size};
}
const origin=makeCore(palette.coral,'pulse.origin',.125),reply=makeCore(palette.teal,'pulse.reply',.072);
const spark=new THREE.Sprite(new THREE.SpriteMaterial({map:halo,color:palette.teal,transparent:true,opacity:1,blending:THREE.AdditiveBlending,depthWrite:false}));spark.scale.setScalar(.48);scene.add(spark);
const sparkDot=new THREE.Mesh(new THREE.SphereGeometry(.024,16,12),new THREE.MeshBasicMaterial({color:'#ccffec'}));scene.add(sparkDot);

function pathPoint(q,t,s) {
  // The same connection already remains visible during the wait.
  const x=lerp(2.45,-1.35,q),z=lerp(-.44,.18,q)-.44*Math.sin(Math.PI*q);
  const p=surfacePoint(x,z,t,s);p.y+=.026;return p;
}
function setLine(line,points){const attr=line.geometry.attributes.position;for(let i=0;i<points.length;i++){attr.setXYZ(i,points[i].x,points[i].y,points[i].z);}attr.needsUpdate=true;line.geometry.computeBoundingSphere();}

// Low-cost deterministic bloom/color finish. No temporal history: seeking is exact.
const target=new THREE.WebGLRenderTarget(width,height,{type:THREE.HalfFloatType,samples:4});
const postScene=new THREE.Scene(),postCamera=new THREE.OrthographicCamera(-1,1,1,-1,0,1);
const postMaterial=new THREE.ShaderMaterial({
  uniforms:{tex:{value:target.texture},res:{value:new THREE.Vector2(width,height)},time:{value:0}},
  vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}',
  fragmentShader:`
  precision highp float;varying vec2 vUv;uniform sampler2D tex;uniform vec2 res;uniform float time;
  float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
  void main(){vec3 c=texture2D(tex,vUv).rgb;vec3 glow=vec3(0.);float w=0.;
    for(int i=0;i<12;i++){float a=float(i)*2.39996;float r=2.+float(i)*1.8;vec2 off=vec2(cos(a),sin(a))*r/res;vec3 s=texture2D(tex,vUv+off).rgb;glow+=max(s-.23,0.)/(1.+r*.14);w+=1./(1.+r*.14);}
    c+=glow/w*.27;
    vec2 p=(vUv-.5)*vec2(1.,.74);c*=1.-.39*dot(p,p);
    c=pow(c/(c+vec3(.74)),vec3(1./2.2));
    c+=(hash(gl_FragCoord.xy+floor(time*30.)*.13)-.5)*.0025;
    gl_FragColor=vec4(c,1.);
  }`,depthTest:false,depthWrite:false,
});
postScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2,2),postMaterial));

let current;
function seek(t){
  const s=sampleState(t);current=s;
  camera.position.fromArray(s.camera.position);camera.fov=s.camera.fov;camera.lookAt(...s.camera.target);camera.updateProjectionMatrix();
  for(let r=0;r<=RINGS;r++)for(let a=0;a<=ARCS;a++){
    const i=r*(ARCS+1)+a,rr=r/RINGS,theta=a/ARCS*Math.PI*2;
    const p=surfacePoint(lerp(-1.35,Math.cos(theta)*3.6,rr),lerp(.18,Math.sin(theta)*2.25,rr),t,s);
    positions[i*3]=p.x;positions[i*3+1]=p.y;positions[i*3+2]=p.z;
  }
  geometry.attributes.position.needsUpdate=true;geometry.computeVertexNormals();geometry.computeBoundingSphere();
  const o=surfacePoint(-1.35,.18,t,s),q=surfacePoint(2.45,-.44,t,s);
  o.y+=.1;q.y+=.075;
  for(const [c,p,b] of [[origin,o,s.originImpulse],[reply,q,s.replyImpulse]]){
    c.group.position.copy(p);c.orb.scale.set(1-b*.10,.83-b*.10,1-b*.10);
    c.mat.uniforms.beat.value=b;c.mat.uniforms.time.value=t;c.glow.material.opacity=.29+b*.34;c.glow.scale.setScalar(c.size*(8+b*7));
    c.seam.scale.setScalar(1+b*.16);
  }
  origin.group.visible=true;reply.group.visible=t>=30;
  for(const [key,value] of Object.entries({time:t,growth:s.growth,exposure:s.exposure,responseAge:s.responseAge,originBeat:s.originImpulse,echoProgress:s.echoProgress,echoActive:s.echoActive?1:0})){material.uniforms[key].value=value;}
  material.uniforms.origin.value.copy(o);material.uniforms.reply.value.copy(q);
  const rimPoints=[],rim2=[];
  for(let i=0;i<=640;i++){
    const a=.16+i/640*(Math.PI*2-.32);
    const p=surfacePoint(Math.cos(a)*3.6,Math.sin(a)*2.25,t,s);p.y+=.009;rimPoints.push(p);
    const p2=surfacePoint(Math.cos(a)*3.6*.987,Math.sin(a)*2.25*.987,t,s);p2.y+=.012;rim2.push(p2);
  }
  setLine(rim,rimPoints);setLine(innerRim,rim2);
  rim.material.opacity=(s.second?.20:.69)*s.exposure;innerRim.material.opacity=s.second?.10:.22;
  radialFibers.forEach((l,j)=>{
    const pts=[],theta=j/30*Math.PI*2+.02*Math.sin(j*4.2);
    const extent=clamp(s.growth*1.10-(j%5)*.018);
    for(let i=0;i<110;i++){
      const r=1-i/109*extent*.97,a=theta+.045*Math.sin(r*9+j);
      const p=surfacePoint(lerp(-1.35,Math.cos(a)*3.6,r),lerp(.18,Math.sin(a)*2.25,r),t,s);p.y+=.012;pts.push(p);
    }
    setLine(l,pts);l.material.opacity=(.10+.06*Math.sin(j*2)**2)*s.exposure*clamp(s.growth*6);
  });
  setLine(path,Array.from({length:241},(_,i)=>pathPoint(i/240,t,s)));
  path.visible=s.second;path.material.opacity=.14+.06*ease((t-57.5)/3);
  spark.visible=sparkDot.visible=echoTail.visible=s.echoActive;
  if(s.echoActive){
    const p=pathPoint(s.echoProgress,t,s);spark.position.copy(p);sparkDot.position.copy(p);
    setLine(echoTail,Array.from({length:101},(_,i)=>pathPoint(clamp(s.echoProgress-.18+i/100*.18),t,s)));
  }
  postMaterial.uniforms.time.value=t;
  renderer.setRenderTarget(target);renderer.render(scene,camera);renderer.setRenderTarget(null);renderer.render(postScene,postCamera);
  return inspect();
}
function inspect(){
  const project=p=>{const n=p.clone().project(camera);return [(n.x*.5+.5)*width,(-n.y*.5+.5)*height];};
  return {sourceTime:current.time,state:current,origin:project(origin.group.position),reply:project(reply.group.position),size:[width,height],renderer:renderer.info.render};
}
window.heartbeat={seek,inspect,ready:false};
seek(17.5);window.heartbeat.ready=true;
