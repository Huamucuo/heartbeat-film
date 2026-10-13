import * as T from 'three';
export const colors={gold:new T.Color('#dca76e'),copper:new T.Color('#c86a3d'),teal:new T.Color('#449b94'),ivory:new T.Color('#e9dbc3'),ink:new T.Color('#07161e')};
export function makeEnvironment(renderer){
 const room=new T.Scene();room.background=new T.Color(.035,.047,.059);
 const panel=(x,y,z,sx,sy,col)=>{const p=new T.Mesh(new T.PlaneGeometry(sx,sy),new T.MeshBasicMaterial({color:new T.Color(...col),side:T.DoubleSide}));p.position.set(x,y,z);p.lookAt(0,0,0);room.add(p);};
 panel(-6,5,6,4.5,9,[7,4.5,2.5]);panel(7,1,3,2.5,10,[2.5,5.2,5.5]);panel(0,8,-2,10,3,[6,6,5.7]);panel(0,-4,6,8,1.7,[.75,.9,1.1]);panel(-3,1,-7,2,7,[1.5,2,3]);
 const pm=new T.PMREMGenerator(renderer),env=pm.fromScene(room,.035,.1,100);room.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});pm.dispose();return env;
}
export function makeBump(){
 const n=512,data=new Uint8Array(n*n*4);let seed=4329;
 for(let y=0;y<n;y++)for(let x=0;x<n;x++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;const v=128+Math.sin(x*.65+Math.sin(y*.034)*2)*13+Math.sin(y*1.5+x*.035)*6+(seed/4294967296-.5)*25,k=(y*n+x)*4;data[k]=data[k+1]=data[k+2]=v;data[k+3]=255;}
 const tex=new T.DataTexture(data,n,n);tex.wrapS=tex.wrapT=T.RepeatWrapping;tex.needsUpdate=true;tex.magFilter=T.LinearFilter;tex.minFilter=T.LinearMipmapLinearFilter;tex.generateMipmaps=true;tex.repeat.set(4,1);return tex;
}
export function metal(color,bump){return new T.MeshPhysicalMaterial({color,metalness:.86,roughness:.27,clearcoat:.75,clearcoatRoughness:.19,envMapIntensity:1.0,side:T.DoubleSide,bumpMap:bump,bumpScale:.019});}
export function gem(color){return new T.MeshPhysicalMaterial({color,metalness:.42,roughness:.16,clearcoat:1,clearcoatRoughness:.07,envMapIntensity:1.4,flatShading:true});}
