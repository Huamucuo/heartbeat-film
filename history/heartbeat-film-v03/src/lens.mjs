import * as T from 'three';
import {ShaderPass} from 'three/addons/postprocessing/ShaderPass.js';
// Reuse the main pass's depth texture. This avoids rendering every ribbon
// again solely for depth while retaining native-resolution colour and depth.
export function lensTarget(w,h){return new T.WebGLRenderTarget(w,h,{type:T.HalfFloatType,depthTexture:new T.DepthTexture(w,h,T.UnsignedIntType),samples:2});}
export class LensPass extends ShaderPass{
 constructor(camera){super({name:'HeartbeatLens',uniforms:{tDiffuse:{value:null},tDepth:{value:null},focus:{value:14},aperture:{value:.00012},maxblur:{value:.0018},near:{value:camera.near},far:{value:camera.far},aspect:{value:camera.aspect}},
 vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
 fragmentShader:`varying vec2 vUv;uniform sampler2D tDiffuse,tDepth;uniform float focus,aperture,maxblur,near,far,aspect;
 float linearDepth(vec2 p){float z=texture2D(tDepth,p).x;return -(near*far)/((far-near)*z-far);}
 void main(){float depth=linearDepth(vUv);float radius=min(abs(depth-focus)*aperture,maxblur);vec3 sum=texture2D(tDiffuse,vUv).rgb*3.;float weights=3.;
 for(int i=0;i<32;i++){float q=(float(i)+.5)/32.;float a=float(i)*2.39996323;float r=sqrt(q)*radius;vec2 off=vec2(cos(a),sin(a)*aspect)*r;float other=linearDepth(vUv+off);float edge=exp(-abs(other-depth)*8./max(depth,1.));float weight=exp(-q*2.4)*edge;sum+=texture2D(tDiffuse,vUv+off).rgb*weight;weights+=weight;}
 gl_FragColor=vec4(sum/weights,1.);}`});}
 render(renderer,writeBuffer,readBuffer,...args){this.uniforms.tDepth.value=readBuffer.depthTexture;super.render(renderer,writeBuffer,readBuffer,...args);}
}
