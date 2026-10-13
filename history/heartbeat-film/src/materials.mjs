import * as THREE from '../assets/vendor/three.module.min.js';

export const palette={coral:new THREE.Color('#F16A5B'),teal:new THREE.Color('#66C7C0'),ivory:new THREE.Color('#E7DAC5')};

export function membraneMaterial() {
  return new THREE.ShaderMaterial({
    side:THREE.DoubleSide, transparent:true, depthWrite:true,
    uniforms:{time:{value:0},growth:{value:0},exposure:{value:1},responseAge:{value:-1},originBeat:{value:0},echoProgress:{value:0},echoActive:{value:0},origin:{value:new THREE.Vector3()},reply:{value:new THREE.Vector3()},coral:{value:palette.coral},teal:{value:palette.teal},ivory:{value:palette.ivory}},
    vertexShader:`
      varying vec2 vUv; varying vec3 vP; varying vec3 vN;
      void main(){vUv=uv;vP=(modelMatrix*vec4(position,1.)).xyz;vN=normalize(mat3(modelMatrix)*normal);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}
    `,
    fragmentShader:`
      precision highp float;
      varying vec2 vUv; varying vec3 vP; varying vec3 vN;
      uniform float time,growth,exposure,responseAge,originBeat,echoProgress,echoActive;
      uniform vec3 origin,reply,coral,teal,ivory;
      float thread(float x,float width){float fw=fwidth(x);float d=abs(fract(x+.5)-.5);float v=1.-smoothstep(width,width+max(fw*.7,.004),d);return mix(v,width*2.,smoothstep(.22,.8,fw));}
      void main(){
        float radius=vUv.y;
        float theta=vUv.x*6.2831853;
        // Material grows from the very same outer rim, down the warp strands.
        float born=1.-smoothstep(growth*1.04,growth*1.04+.022,1.-radius);
        if(born<.006||radius<.013) discard;
        float warp=thread(vUv.x*352.+.22*sin(radius*11.+theta*3.)+.035*sin(radius*49.+theta*9.),.024);
        float weft=thread(radius*147.+.13*sin(theta*5.+radius*9.)+.05*cos(theta*13.),.020);
        float fine=thread(vUv.x*733.+.19*sin(radius*25.+theta*2.),.012);
        float grain=.75+.25*sin(theta*139.+radius*377.)*sin(theta*193.-radius*291.);
        vec3 n=normalize(vN);vec3 view=normalize(cameraPosition-vP);
        float side=abs(dot(n,normalize(vec3(-.65,1.1,.35))));
        float grazing=pow(1.-abs(dot(n,view)),2.6);
        float streak=pow(abs(dot(n,normalize(vec3(-.5,.9,-.7)))),18.);
        float d=length((vP-origin)*vec3(1.,.5,1.));
        float pulseAge=mod(max(time,0.),1.25);
        float traveling=exp(-pow((d-pulseAge*4.)/.14,2.))*originBeat*.5;
        float response=0.;
        if(responseAge>=0.){
          float rr=responseAge*1.8;
          response=exp(-pow((d-rr)/.24,2.))*exp(-responseAge*.20);
          response+=.36*exp(-pow((d-rr+.45)/.35,2.))*exp(-responseAge*.3);
        }
        vec3 c=mix(ivory,coral,.20)*(.014+side*.020+grazing*.032);
        float variation=.52+.48*pow(.5+.5*sin(theta*23.+radius*.8),3.);
        float fibers=warp*(.075+side*.30)*variation+weft*(.013+grazing*.042)+fine*.015;
        c+=ivory*fibers*grain;
        c+=ivory*streak*(.10+warp*.95);
        float growing=exp(-pow((1.-radius-growth*1.04)/.023,2.))*(1.-smoothstep(.87,1.,growth));
        c+=mix(ivory,coral,.4)*growing*(.06+warp*.24);
        c+=coral*(traveling+response)*(.12+warp*.7+weft*.55);
        c+=coral*exp(-d*d*2.3)*(.07+originBeat*.32);
        float dr=length((vP-reply)*vec3(1.,.5,1.));
        c+=teal*exp(-dr*dr*2.)*.13*smoothstep(30.,35.,time);
        float alpha=born*(.29+warp*.32+weft*.035+grazing*.22);
        c*=exposure;
        gl_FragColor=vec4(c,alpha);
      }
    `,
  });
}

export function coreMaterial(color) {
  return new THREE.ShaderMaterial({
    uniforms:{color:{value:color},beat:{value:0},time:{value:0}},
    vertexShader:`varying vec3 vN,vP,vLocal;void main(){vN=normalize(mat3(modelMatrix)*normal);vP=(modelMatrix*vec4(position,1.)).xyz;vLocal=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader:`
      varying vec3 vN,vP,vLocal;uniform vec3 color;uniform float beat,time;
      void main(){vec3 n=normalize(vN),v=normalize(cameraPosition-vP);
        float rim=pow(1.-max(0.,dot(n,v)),2.5);
        float light=max(0.,dot(n,normalize(vec3(-.8,1.2,.9))));
        float notch=1.-.70*smoothstep(.94,.97,dot(normalize(vLocal),normalize(vec3(.68,.28,.72))));
        float seam=pow(abs(sin(vLocal.y*32.+vLocal.x*9.)),15.);
        vec3 c=color*(.10+light*.55+rim*.6+beat*1.5)*notch;
        c+=vec3(1.,.77,.53)*pow(light,22.)*.9;
        c+=color*seam*.025;gl_FragColor=vec4(c,1.);}
    `,
  });
}

export function haloTexture() {
  const size=128,data=new Uint8Array(size*size*4);
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    const r=Math.hypot((x+0.5-size/2)/(size/2),(y+0.5-size/2)/(size/2));
    const a=Math.exp(-r*r*8)*Math.max(0,1-r)*0.65;
    const i=(y*size+x)*4;data[i]=data[i+1]=data[i+2]=255;data[i+3]=Math.round(a*255);
  }
  const tex=new THREE.DataTexture(data,size,size);tex.needsUpdate=true;return tex;
}
