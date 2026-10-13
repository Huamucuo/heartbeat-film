import http from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(fileURLToPath(new URL('../',import.meta.url)));
const types={'.html':'text/html; charset=utf-8','.mjs':'text/javascript','.js':'text/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.mp4':'video/mp4','.wav':'audio/wav'};
export function startServer(port=0){
  const server=http.createServer(async(req,res)=>{
    try{
      const p=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));
      if(p!==root&&!p.startsWith(root+path.sep)){res.writeHead(403).end();return;}
      const f=(await stat(p)).isDirectory()?path.join(p,'index.html'):p;
      const body=await readFile(f);res.writeHead(200,{'Content-Type':types[path.extname(f)]||'application/octet-stream','Cache-Control':'no-store'}).end(body);
    }catch{res.writeHead(404).end('Not found');}
  });
  return new Promise(resolve=>server.listen(port,'127.0.0.1',()=>resolve(server)));
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const server=await startServer(Number(process.env.PORT||4186));console.log(`Heartbeat preview: http://127.0.0.1:${server.address().port}`);
}
