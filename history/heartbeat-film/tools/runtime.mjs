import {createRequire} from 'node:module';
import {existsSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
export const root=fileURLToPath(new URL('../',import.meta.url));
export function playwright(){
  const require=createRequire(import.meta.url);
  try{return require('playwright');}catch{
    const base=process.env.CODEX_RUNTIME_NODE_MODULES||path.join(process.env.USERPROFILE||'', '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules');
    return require(path.join(base,'playwright'));
  }
}
export function browserPath(){
  if(process.env.HEARTBEAT_BROWSER)return process.env.HEARTBEAT_BROWSER;
  for(const p of [process.env['ProgramFiles(x86)']+'/Microsoft/Edge/Application/msedge.exe',process.env.ProgramFiles+'/Google/Chrome/Application/chrome.exe'])if(existsSync(p))return p;
  return undefined;
}
export function ffmpegPath(){
  const local=path.join(root,'tools/python-deps/imageio_ffmpeg/binaries/ffmpeg-win-x86_64-v7.1.exe');
  return process.env.FFMPEG_PATH||(existsSync(local)?local:'ffmpeg');
}
export const browserArgs=['--disable-gpu-sandbox','--enable-unsafe-swiftshader','--autoplay-policy=no-user-gesture-required'];
