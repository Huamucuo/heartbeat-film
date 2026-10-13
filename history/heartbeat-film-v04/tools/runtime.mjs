import {createRequire} from 'node:module';
import {existsSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
export const root=path.resolve(fileURLToPath(new URL('../',import.meta.url)));
export function playwright(){
 const require=createRequire(import.meta.url);
 for(const p of ['playwright',path.join(root,'../heartbeat-film/node_modules/playwright'),path.join(process.env.USERPROFILE||'', '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')]){
  try{return require(p);}catch{}
 }throw new Error('Install Playwright with npm install.');
}
export function browserPath(){
 if(process.env.HEARTBEAT_BROWSER)return process.env.HEARTBEAT_BROWSER;
 for(const p of [process.env['ProgramFiles(x86)']+'/Microsoft/Edge/Application/msedge.exe',process.env.ProgramFiles+'/Google/Chrome/Application/chrome.exe'])if(existsSync(p))return p;
 return undefined;
}
export function ffmpegPath(){
 if(process.env.FFMPEG_PATH)return process.env.FFMPEG_PATH;
 const existing=path.join(root,'../heartbeat-film/tools/python-deps/imageio_ffmpeg/binaries/ffmpeg-win-x86_64-v7.1.exe');
 return existsSync(existing)?existing:'ffmpeg';
}
export const browserArgs=['--disable-gpu-sandbox','--enable-unsafe-swiftshader','--autoplay-policy=no-user-gesture-required'];
