import * as T from 'three';
import {ramp} from './forms.mjs';
// Original lighting canvas. A camera-attached sphere supplies a continuous
// backdrop; no photographic plate or reference-film asset is used.
export function atmosphere(scene){
 const uniforms={paper:{value:0},dawn:{value:0},time:{value:0}};
 const material=new T.ShaderMaterial({side:T.BackSide,depthWrite:false,uniforms,
 vertexShader:`varying vec3 v;void main(){v=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
 fragmentShader:`varying vec3 v;uniform float paper,dawn,time;
 void main(){vec3 d=normalize(v);float a=exp(-length((d.xy-vec2(-.28,.02))*vec2(2.4,3.8)));float b=exp(-length((d.xy-vec2(.4,-.05))*vec2(3.3,4.)));
 vec3 c=vec3(.0017,.004,.006)+a*vec3(.013,.022,.021)+b*vec3(.004,.029,.036);
 c+=dawn*a*vec3(.055,.020,.005);c=mix(c,vec3(.60,.51,.38)*(1.-.15*length(d.xy))+a*.09,paper);
 gl_FragColor=vec4(c,1.);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
 }`});
 const sky=new T.Mesh(new T.SphereGeometry(65,32,16),material);sky.renderOrder=-10;scene.add(sky);
 return (t,s,camera)=>{sky.position.copy(camera.position);uniforms.paper.value=s.paper;uniforms.dawn.value=ramp(57.5,66,t)*(1-ramp(80,85,t));uniforms.time.value=t;};
}
