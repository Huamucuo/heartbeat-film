import * as T from 'three';
import {FullScreenQuad} from 'three/addons/postprocessing/Pass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';
// Average time samples in linear HDR on the GPU, then tone-map once. Only
// the finished frame crosses to Canvas2D for crisp typography and PNG export.
export class Shutter{
 constructor(renderer,w,h){this.renderer=renderer;this.target=new T.WebGLRenderTarget(w,h,{type:T.HalfFloatType,depthBuffer:false});this.material=new T.ShaderMaterial({uniforms:{picture:{value:null},weight:{value:1}},depthTest:false,depthWrite:false,transparent:true,blending:T.AdditiveBlending,toneMapped:false,vertexShader:'varying vec2 uv0;void main(){uv0=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'varying vec2 uv0;uniform sampler2D picture;uniform float weight;void main(){gl_FragColor=vec4(texture2D(picture,uv0).rgb*weight,1.);}'});this.quad=new FullScreenQuad(this.material);this.output=new OutputPass();this.output.renderToScreen=true;}
 clear(){const r=this.renderer,old=r.getRenderTarget(),color=r.getClearColor(new T.Color()),alpha=r.getClearAlpha();r.setRenderTarget(this.target);r.setClearColor(0,0);r.clear();r.setClearColor(color,alpha);r.setRenderTarget(old);}
 add(texture,weight){const r=this.renderer,old=r.getRenderTarget(),auto=r.autoClear;r.autoClear=false;r.setRenderTarget(this.target);this.material.uniforms.picture.value=texture;this.material.uniforms.weight.value=weight;this.quad.render(r);r.autoClear=auto;r.setRenderTarget(old);}
 present(){this.output.render(this.renderer,null,this.target);}
}
