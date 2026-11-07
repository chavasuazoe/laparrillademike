/* Dependency-free local preview. Cloudflare requests still go to the configured Worker. */
import {createServer} from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {resolve,sep,extname} from 'node:path';
const root=resolve(import.meta.dirname,'..');
const port=Number(process.env.PORT)||8080;
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.webmanifest':'application/manifest+json','.svg':'image/svg+xml','.png':'image/png','.ico':'image/x-icon'};
createServer(async(req,res)=>{
 try{
  if(req.method!=='GET'&&req.method!=='HEAD'){res.writeHead(405);res.end();return}
  const url=new URL(req.url,'http://localhost');
  const decoded=decodeURIComponent(url.pathname);
  const pathname=decoded.endsWith('/')?decoded+'index.html':decoded;
  const file=resolve(root,'.'+pathname);
  if(!(file===root||file.startsWith(root+sep))){res.writeHead(403);res.end();return}
  const info=await stat(file);
  if(!info.isFile()){res.writeHead(404);res.end();return}
  const content=await readFile(file);
  res.writeHead(200,{'Content-Type':mime[extname(file)]||'application/octet-stream','Cache-Control':'no-store'});
  res.end(req.method==='HEAD'?undefined:content);
 }catch(e){res.writeHead(404,{'Content-Type':'text/plain; charset=utf-8'});res.end('Archivo no encontrado')}
}).listen(port,'127.0.0.1',()=>console.log(`Vista local: http://127.0.0.1:${port}`));
