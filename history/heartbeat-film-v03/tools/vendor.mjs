import {readFile,writeFile,mkdir,copyFile} from 'node:fs/promises';
import path from 'node:path';
import {existsSync} from 'node:fs';
import {root} from './runtime.mjs';
const source=[path.join(root,'node_modules/three'),path.resolve(root,'../heartbeat-film/node_modules/three')].find(existsSync),dest=path.join(root,'vendor/three'),seen=new Set();if(!source)throw new Error('npm install before refreshing vendored Three.js');
async function copy(rel){if(seen.has(rel))return;seen.add(rel);const txt=await readFile(path.join(source,rel),'utf8'),out=rel.startsWith('examples/jsm/')?'addons/'+rel.slice(13):rel.startsWith('build/')?rel.slice(6):rel;await mkdir(path.dirname(path.join(dest,out)),{recursive:true});await writeFile(path.join(dest,out),txt);for(const m of txt.matchAll(/(?:from\s*|import\s*)['"]([^'"]+)['"]/g))if(m[1].startsWith('.'))await copy(path.posix.normalize(path.posix.join(path.posix.dirname(rel),m[1])));}
for(const p of ['build/three.module.js','examples/jsm/postprocessing/EffectComposer.js','examples/jsm/postprocessing/RenderPass.js','examples/jsm/postprocessing/UnrealBloomPass.js','examples/jsm/postprocessing/BokehPass.js','examples/jsm/postprocessing/OutputPass.js'])await copy(p);
await copyFile(path.join(source,'LICENSE'),path.join(dest,'LICENSE'));await writeFile(path.join(dest,'PROVENANCE.json'),JSON.stringify({package:'three',version:'0.180.0',license:'MIT',files:[...seen]},null,2));console.log(`${seen.size} Three.js module files, original MIT license retained.`);
