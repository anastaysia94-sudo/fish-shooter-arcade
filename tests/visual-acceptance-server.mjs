import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname, relative } from 'node:path';

const HOST = process.env.FSA_QA_HOST || '127.0.0.1';
const PORT = Number(process.env.FSA_QA_PORT || 4173);
const ROOT = resolve(process.env.FSA_QA_ROOT || '.');

const MIME = new Map([
  ['.html','text/html; charset=utf-8'],
  ['.js','text/javascript; charset=utf-8'],
  ['.mjs','text/javascript; charset=utf-8'],
  ['.css','text/css; charset=utf-8'],
  ['.json','application/json; charset=utf-8'],
  ['.webmanifest','application/manifest+json; charset=utf-8'],
  ['.svg','image/svg+xml'],
  ['.webp','image/webp'],
  ['.png','image/png'],
  ['.jpg','image/jpeg'],
  ['.jpeg','image/jpeg'],
  ['.txt','text/plain; charset=utf-8'],
  ['.xml','application/xml; charset=utf-8']
]);

function headers(file, length){
  return {
    'Content-Type': MIME.get(extname(file).toLowerCase()) || 'application/octet-stream',
    'Content-Length': String(length),
    'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
    'Pragma': 'no-cache',
    'Expires': '0',
    'Connection': 'close',
    'X-Content-Type-Options': 'nosniff'
  };
}

function safePath(rawUrl){
  const pathname = decodeURIComponent(new URL(rawUrl || '/', 'http://qa.local').pathname);
  const normalized = pathname === '/' ? '/index.html' : pathname.endsWith('/') ? `${pathname}index.html` : pathname;
  const target = resolve(ROOT, `.${normalized}`);
  const rel = relative(ROOT, target);
  if(rel.startsWith('..') || rel.includes('../') || rel.includes('..\\')) return null;
  return target;
}

const server = http.createServer(async (req,res)=>{
  if(req.method !== 'GET' && req.method !== 'HEAD'){
    res.writeHead(405, {'Content-Length':'0','Connection':'close'}); res.end(); return;
  }
  try{
    const file = safePath(req.url);
    if(!file){res.writeHead(403,{'Content-Length':'0','Connection':'close'});res.end();return;}
    const info = await stat(file);
    if(!info.isFile()) throw new Error('not-file');
    const body = await readFile(file);
    res.writeHead(200, headers(file, body.length));
    if(req.method === 'HEAD') res.end(); else res.end(body);
    process.stdout.write(`FSA_QA_HTTP 200 ${req.url}\n`);
  }catch{
    const body = Buffer.from('Not Found\n');
    res.writeHead(404, {...headers('.txt', body.length), 'Content-Type':'text/plain; charset=utf-8'});
    if(req.method === 'HEAD') res.end(); else res.end(body);
    process.stdout.write(`FSA_QA_HTTP 404 ${req.url}\n`);
  }
});

server.keepAliveTimeout = 1;
server.headersTimeout = 5000;
server.requestTimeout = 10000;

server.listen(PORT, HOST, ()=>{
  console.log(`FSA_VISUAL_ACCEPTANCE_SERVER=READY http://${HOST}:${PORT}/ root=${ROOT}`);
});

function shutdown(signal){
  console.log(`FSA_VISUAL_ACCEPTANCE_SERVER=STOP signal=${signal}`);
  server.close(()=>process.exit(0));
  setTimeout(()=>process.exit(0), 1500).unref();
}
process.on('SIGTERM',()=>shutdown('SIGTERM'));
process.on('SIGINT',()=>shutdown('SIGINT'));
