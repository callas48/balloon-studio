// Local editor only. No Sites identity, credentials, or remote API calls are used.
import http from 'node:http';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {realpath,stat} from 'node:fs/promises';
import {createReadStream} from 'node:fs';
const root=await realpath(path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../public'));
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg','.svg':'image/svg+xml','.ttf':'font/ttf','.otf':'font/otf','.woff':'font/woff','.woff2':'font/woff2','.pdf':'application/pdf','.webmanifest':'application/manifest+json'};
export const server=http.createServer(async(req,res)=>{
 const json=(status,data)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(data))};
 try{
  const url=new URL(req.url,'http://localhost'),pathname=decodeURIComponent(url.pathname);
  if(pathname.startsWith('/api/')){
   if(pathname==='/api/shared-assets/session'&&req.method==='GET')return json(200,{owner:false});
   if(pathname==='/api/shared-assets'&&req.method==='GET')return json(200,{assets:[]});
   if(pathname==='/api/analytics/visit'&&req.method==='POST'){res.writeHead(204);res.end();return}
   return json(503,{error:'로컬 편집기에서는 서버 공용 에셋·방문 통계를 사용하지 않습니다.'});
  }
  if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);res.end();return}
  if(pathname.includes('\\')||pathname.split('/').some(s=>s.startsWith('.'))){res.writeHead(404);res.end();return}
  const filename=await realpath(path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname)));
  if(!filename.startsWith(root+path.sep)||!(await stat(filename)).isFile()){res.writeHead(404);res.end();return}
  res.writeHead(200,{'Content-Type':mime[path.extname(filename).toLowerCase()]||'application/octet-stream','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});
  if(req.method==='HEAD')res.end();else createReadStream(filename).on('error',()=>res.destroy()).pipe(res);
 }catch{if(!res.headersSent){res.writeHead(404);res.end()}else res.destroy()}
});
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const port=Number(process.env.PORT||4173);if(!Number.isInteger(port)||port<0||port>65535)throw Error('PORT must be 0–65535');
 server.listen(port,'127.0.0.1',()=>console.log('Local editor: http://127.0.0.1:'+server.address().port));
}
