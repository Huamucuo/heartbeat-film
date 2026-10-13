import http from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {root} from './runtime.mjs';
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.mp4':'video/mp4','.wav':'audio/wav','.mp3':'audio/mpeg','.ttf':'font/ttf'};
export function startServer(port=0){
 const server=http.createServer(async(req,res)=>{
  try{
   const p=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));
   if(p!==root&&!p.startsWith(root+path.sep)){res.writeHead(403).end();return;}
   const f=(await stat(p)).isDirectory()?path.join(p,'index.html'):p,body=await readFile(f);
   const range=req.headers.range?.match(/^bytes=(\d+)-(\d*)$/);
   if(range){const start=+range[1],end=Math.min(range[2]?+range[2]:body.length-1,body.length-1);if(start>end){res.writeHead(416,{'Content-Range':`bytes */${body.length}`}).end();return;}res.writeHead(206,{'Content-Type':mime[path.extname(f)]||'application/octet-stream','Content-Range':`bytes ${start}-${end}/${body.length}`,'Accept-Ranges':'bytes','Content-Length':end-start+1}).end(body.subarray(start,end+1));}
   else res.writeHead(200,{'Content-Type':mime[path.extname(f)]||'application/octet-stream','Content-Length':body.length,'Accept-Ranges':'bytes'}).end(body);
  }catch{res.writeHead(404).end('Not found');}
 });return new Promise(resolve=>server.listen(port,'127.0.0.1',()=>resolve(server)));
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){const s=await startServer(+(process.env.PORT||4191));console.log(`Heartbeat v07: http://127.0.0.1:${s.address().port}`);}
