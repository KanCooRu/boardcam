// Production host for the Nebula Forge game server.
// It answers /health, serves the built game files, and hands /api requests to the game's own server
// module (dist/server/index.js) with a database handle and the player's verified identity.
// One process per CPU; a process that dies is started again.
import cluster from 'node:cluster';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import {createGunzip} from 'node:zlib';
import {createReadStream,existsSync,readFileSync,statSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {firebaseUser,guestFromCookie,newGuestCookie,OWNER_HEADER} from './auth.mjs';

const env=process.env;
const GAME_DIR=path.resolve(env.GAME_DIR||'/app/game');
const PORT=Number(env.PORT||3000);
const WORKERS=Math.max(1,Number(env.WORKERS||os.availableParallelism?.()||os.cpus().length));
const AUTH_MODE=env.AUTH_MODE||'guest';                 // 'firebase' or 'guest'
const PUBLIC_ORIGIN=(env.PUBLIC_ORIGIN||'').replace(/\/$/,'');
const MAX_BODY=Number(env.MAX_BODY_BYTES||1048576);
const RATE_PER_SECOND=Number(env.RATE_PER_SECOND||8),RATE_BURST=Number(env.RATE_BURST||40);
const log=(...parts)=>console.log(new Date().toISOString(),...parts);

function checkSettings(){
 const problems=[];
 if(!existsSync(path.join(GAME_DIR,'dist/server/index.js')))problems.push('GAME_DIR has no dist/server/index.js: '+GAME_DIR);
 if(!['firebase','guest'].includes(AUTH_MODE))problems.push('AUTH_MODE must be firebase or guest.');
 if(AUTH_MODE==='firebase'&&!env.FIREBASE_PROJECT_ID)problems.push('FIREBASE_PROJECT_ID is required when AUTH_MODE=firebase.');
 if(AUTH_MODE==='guest'&&!(env.GUEST_SECRET&&env.GUEST_SECRET.length>=24))problems.push('GUEST_SECRET (24+ characters) is required when AUTH_MODE=guest.');
 if(!env.DATABASE_URL&&!env.SQLITE_PATH)problems.push('Set DATABASE_URL (PostgreSQL) or SQLITE_PATH (one machine only).');
 if(env.SQLITE_PATH&&WORKERS>1&&!env.DATABASE_URL)problems.push('SQLITE_PATH works with WORKERS=1 only.');
 return problems;
}

if(cluster.isPrimary){
 const problems=checkSettings();
 if(problems.length){for(const p of problems)console.error('[config] '+p);process.exit(1)}
 // The schema is brought up to date once, before any worker takes a request.
 if(env.DATABASE_URL&&env.SKIP_MIGRATIONS!=='1'){
  const {createPool}=await import('./d1-postgres.mjs'),{migrate}=await import('./migrate.mjs');
  const pool=createPool(env.DATABASE_URL,{max:1});
  // A database that is still starting is waited for (about a minute) instead of failing at once.
  try{
   for(let attempt=1;;attempt++){
    try{const applied=await migrate(pool);if(applied.length)log('[db] applied',applied.join(', '));break}
    catch(error){
     const waiting=/ECONNREFUSED|ENOTFOUND|EAI_AGAIN|starting up|timeout/i.test(error.message)&&attempt<30;
     if(!waiting)throw error;
     if(attempt===1)log('[db] not reachable yet, waiting:',error.message);
     await new Promise(resolve=>setTimeout(resolve,2000));
    }
   }
  }catch(error){console.error('[db] '+error.message);process.exit(1)}
  finally{await pool.end()}
 }
 log(`[host] starting ${WORKERS} worker(s) on port ${PORT}, auth=${AUTH_MODE}, db=${env.DATABASE_URL?'postgres':'sqlite'}`);
 let stopping=false;
 for(let i=0;i<WORKERS;i++)cluster.fork();
 cluster.on('exit',(worker,code)=>{
  if(stopping)return;
  log(`[host] worker ${worker.process.pid} exited (${code}); starting another`);
  setTimeout(()=>cluster.fork(),1000);
 });
 for(const signal of ['SIGTERM','SIGINT'])process.on(signal,()=>{
  stopping=true;
  for(const worker of Object.values(cluster.workers))worker.process.kill('SIGTERM');
  setTimeout(()=>process.exit(0),10000).unref();
 });
}else{
 await serve();
}

async function serve(){
 const game=(await import(pathToFileURL(path.join(GAME_DIR,'dist/server/index.js')).href)).default;
 const root=path.join(GAME_DIR,'dist/client');
 let DB,pool=null,locks=null,rankings=null;
 if(env.DATABASE_URL){
  const pgdb=await import('./d1-postgres.mjs');
  pool=pgdb.createPool(env.DATABASE_URL);DB=pgdb.createDatabase(pool);
  // Player locks wait on connections of their own. If they shared the query pool, requests holding a lock
  // could take every connection and leave none for the queries they are waiting to run.
  locks=pgdb.createPool(env.DATABASE_URL,{max:Number(env.DB_LOCK_POOL||8)});
  rankings=(await import('./rankings.mjs')).createRankings(pool,Number(env.RANK_CACHE_SECONDS??30),log);
 }else{
  DB=(await import('./d1-sqlite.mjs')).createDatabase(env.SQLITE_PATH,path.join(GAME_DIR,'drizzle'));
 }
 const notFound=()=>new Response('Not found',{status:404});
 // With Firebase sign-in, the page gets one extra script that signs the player in and adds the ID token to
 // every /api request. The game's files stay untouched; the page is rewritten on its way out.
 const hostDir=path.dirname(fileURLToPath(import.meta.url));
 const signInScript=AUTH_MODE==='firebase'?readFileSync(path.join(hostDir,'sign-in.client.js')):null;
 let page=null;
 function gamePage(){
  const file=path.join(root,'index.html'),info=statSync(file);
  if(!page||page.mtime!==info.mtimeMs){
   const html=readFileSync(file,'utf8');
   if(!/<head[^>]*>/i.test(html))throw Error('index.html has no <head>');
   page={mtime:info.mtimeMs,body:Buffer.from(html.replace(/<head[^>]*>/i,match=>match+'<script src="/host/sign-in.js"></script>'))};
  }
  return page.body;
 }
 const gameEnv={DB,ASSETS:{fetch:async()=>notFound()}};

 // Health: the load balancer asks every few seconds; the database is asked at most once a second.
 let health={at:0,ok:false};
 async function healthy(){
  if(Date.now()-health.at<1000)return health.ok;
  try{await Promise.race([DB.ping(),new Promise((_,reject)=>setTimeout(()=>reject(Error('timeout')),2000))]);health={at:Date.now(),ok:true}}
  catch{health={at:Date.now(),ok:false}}
  return health.ok;
 }

 // A backstop against one client hammering the API. Cloudflare and the proxy do the real limiting.
 const buckets=new Map();
 function allowed(key){
  const now=Date.now(),b=buckets.get(key)||{tokens:RATE_BURST,at:now};
  b.tokens=Math.min(RATE_BURST,b.tokens+(now-b.at)/1000*RATE_PER_SECOND);b.at=now;
  if(b.tokens<1){buckets.set(key,b);return false}
  b.tokens-=1;buckets.set(key,b);return true;
 }
 setInterval(()=>{const old=Date.now()-120000;for(const [key,b] of buckets)if(b.at<old)buckets.delete(key)},60000).unref();

 // Two requests from the same player are answered one after the other, on every server at once.
 // SQLite did this by itself; PostgreSQL needs to be asked.
 async function oneAtATime(owner,work){
  if(!locks)return work();
  const key=createHash('sha256').update(owner).digest().readBigInt64BE(0).toString();
  const client=await locks.connect();
  try{
   await client.query('SELECT pg_advisory_lock($1)',[key]);
   try{return await work()}finally{await client.query('SELECT pg_advisory_unlock($1)',[key]).catch(()=>{})}
  }finally{client.release()}
 }

 const types={wasm:'application/wasm',data:'application/octet-stream',html:'text/html; charset=utf-8',js:'text/javascript; charset=utf-8',
  mjs:'text/javascript; charset=utf-8',css:'text/css; charset=utf-8',json:'application/json',webmanifest:'application/manifest+json',
  webp:'image/webp',avif:'image/avif',png:'image/png',jpg:'image/jpeg',svg:'image/svg+xml',ico:'image/x-icon',mp3:'audio/mpeg',
  ogg:'audio/ogg',wav:'audio/wav',mp4:'video/mp4',webm:'video/webm',woff2:'font/woff2',txt:'text/plain; charset=utf-8'};
 function staticFile(req,res,url){
  let file;
  try{file=path.resolve(root,'.'+decodeURIComponent(url.pathname))}catch{res.writeHead(400).end();return}
  if(file!==root&&!file.startsWith(root+path.sep)){res.writeHead(404).end();return}
  // The Unity player is stored packed; it is unpacked on the way out.
  if(['/unity-battle/UnityPlayer.wasm','/unity-battle/UnityPlayer.data'].includes(url.pathname)&&!existsSync(file)){
   const code=url.pathname.endsWith('.wasm'),packed=path.join(root,'unity-battle',code?'player-code.bin':'player-data.bin');
   if(existsSync(packed)){
    res.writeHead(200,{'Content-Type':code?'application/wasm':'application/octet-stream','Cache-Control':'public, max-age=86400'});
    if(req.method==='HEAD')res.end();else createReadStream(packed).pipe(createGunzip()).pipe(res);
    return;
   }
  }
  let info;
  try{info=statSync(file);if(info.isDirectory()){file=path.join(file,'index.html');info=statSync(file)}}
  catch{res.writeHead(404,{'Content-Type':'text/plain; charset=utf-8'}).end('Not found');return}
  const name=path.basename(file),ext=path.extname(name).slice(1).toLowerCase();
  // Files whose name carries a hash never change; the page itself is always asked for again.
  const cache=ext==='html'||name==='sw.js'?'no-cache':/-[0-9a-f]{16,}\.|^[0-9a-f]{20}\./.test(name)?'public, max-age=31536000, immutable':'public, max-age=3600';
  const etag='"'+info.size.toString(16)+'-'+Math.floor(info.mtimeMs).toString(16)+'"';
  const headers={'Content-Type':types[ext]||'application/octet-stream','Cache-Control':cache,'ETag':etag,'Accept-Ranges':'bytes','X-Content-Type-Options':'nosniff'};
  if(req.headers['if-none-match']===etag){res.writeHead(304,headers).end();return}
  // Audio and video players ask for a part of the file.
  const range=/^bytes=(\d*)-(\d*)$/.exec(req.headers.range||'');
  if(range&&(range[1]||range[2])){
   let start=range[1]?Number(range[1]):Math.max(0,info.size-Number(range[2])),end=range[1]&&range[2]?Math.min(Number(range[2]),info.size-1):info.size-1;
   if(start>end||start>=info.size){res.writeHead(416,{'Content-Range':'bytes */'+info.size}).end();return}
   res.writeHead(206,{...headers,'Content-Range':`bytes ${start}-${end}/${info.size}`,'Content-Length':end-start+1});
   if(req.method==='HEAD')res.end();else createReadStream(file,{start,end}).pipe(res);
   return;
  }
  res.writeHead(200,{...headers,'Content-Length':info.size});
  if(req.method==='HEAD')res.end();else createReadStream(file).pipe(res);
 }

 async function readBody(req){
  const parts=[];let size=0;
  for await(const part of req){size+=part.length;if(size>MAX_BODY)throw Object.assign(Error('too large'),{status:413});parts.push(part)}
  return parts.length?Buffer.concat(parts):undefined;
 }
 const json=(res,status,body,headers={})=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store',...headers});res.end(JSON.stringify(body))};

 async function api(req,res,url){
  const secure=(PUBLIC_ORIGIN||'').startsWith('https://')||req.headers['x-forwarded-proto']==='https';
  const origin=PUBLIC_ORIGIN||((secure?'https://':'http://')+req.headers.host);
  // Identity. Whatever the client sent in the identity header is thrown away.
  let owner=null,setCookie=null;
  if(AUTH_MODE==='firebase'){
   const token=/^Bearer (.+)$/.exec(req.headers.authorization||'')?.[1];
   if(token){
    try{const uid=await firebaseUser(token,env.FIREBASE_PROJECT_ID);if(uid)owner='fb:'+uid}
    catch(error){log('[auth] key service unavailable:',error.message);json(res,503,{error:'로그인 확인 서버에 연결하지 못했습니다. 잠시 후 다시 시도해 주세요.'},{'Retry-After':'5'});return}
   }
   if(!owner){json(res,401,{error:'로그인이 필요합니다.',code:'sign-in'});return}
  }else{
   owner=guestFromCookie(req.headers.cookie,env.GUEST_SECRET);
   if(!owner){const guest=newGuestCookie(env.GUEST_SECRET,secure);owner=guest.id;setCookie=guest.cookie}
   owner='guest:'+owner;
  }
  if(!allowed(owner)){json(res,429,{error:'요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.'},{'Retry-After':'2'});return}
  let body;
  try{body=req.method==='GET'||req.method==='HEAD'?undefined:await readBody(req)}
  catch(error){json(res,error.status||400,{error:'요청이 너무 큽니다.'});return}
  // Rankings by power and stage come from the host's snapshot.
  if(rankings&&req.method==='GET'&&url.pathname==='/api/rankings'){
   const rows=await rankings.rows(url.searchParams.get('board'),owner);
   if(rows){json(res,200,{rows},setCookie?{'Set-Cookie':setCookie}:{});return}
  }
  const headers=new Headers();
  for(const [name,value] of Object.entries(req.headers)){
   if(name===OWNER_HEADER||name==='host'||name==='connection'||name==='content-length'||name==='authorization'||name==='cookie')continue;
   headers.set(name,Array.isArray(value)?value.join(', '):value);
  }
  headers.set(OWNER_HEADER,owner);
  const request=new Request(origin+url.pathname+url.search,{method:req.method,headers,body});
  const answer=req.method==='GET'||req.method==='HEAD'?await game.fetch(request,gameEnv):await oneAtATime(owner,()=>game.fetch(request,gameEnv));
  const out=Object.fromEntries(answer.headers);
  if(!out['cache-control'])out['cache-control']='no-store';
  if(setCookie)out['set-cookie']=setCookie;
  res.writeHead(answer.status,out);
  res.end(Buffer.from(await answer.arrayBuffer()));
 }

 let active=0,closing=false,errors=0;
 const server=http.createServer(async(req,res)=>{
  active++;res.on('close',()=>{active--});
  try{
   const url=new URL(req.url,'http://host');
   if(url.pathname==='/health'){
    const ok=!closing&&await healthy();
    json(res,ok?200:503,{ok,auth:AUTH_MODE,pid:process.pid});return;
   }
   if(url.pathname==='/api/host'){json(res,200,{auth:AUTH_MODE,firebase:AUTH_MODE==='firebase'?{projectId:env.FIREBASE_PROJECT_ID,apiKey:env.FIREBASE_WEB_API_KEY||'',authDomain:env.FIREBASE_AUTH_DOMAIN||env.FIREBASE_PROJECT_ID+'.firebaseapp.com'}:null});return}
   if(url.pathname.startsWith('/api/')){await api(req,res,url);return}
   if(req.method!=='GET'&&req.method!=='HEAD'){res.writeHead(405).end();return}
   if(signInScript){
    if(url.pathname==='/host/sign-in.js'){res.writeHead(200,{'Content-Type':'text/javascript; charset=utf-8','Cache-Control':'no-cache','Content-Length':signInScript.length});res.end(req.method==='HEAD'?undefined:signInScript);return}
    if(url.pathname==='/'||url.pathname==='/index.html'){const body=gamePage();res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-cache','Content-Length':body.length});res.end(req.method==='HEAD'?undefined:body);return}
   }
   staticFile(req,res,url);
  }catch(error){
   errors++;log('[error]',req.method,req.url,error.stack||error.message);
   if(!res.headersSent)json(res,500,{error:'서버에 문제가 생겼습니다. 잠시 후 다시 시도해 주세요.'});else res.destroy();
  }
 });
 server.requestTimeout=30000;server.headersTimeout=15000;server.keepAliveTimeout=65000;
 server.listen(PORT,env.HOST||'0.0.0.0');
 setInterval(()=>{if(errors){log(`[host] ${errors} request error(s) in the last minute (pid ${process.pid})`);errors=0}},60000).unref();
 // Stop: fail the health check first so the load balancer looks elsewhere, then finish what is in flight.
 process.on('SIGTERM',()=>{
  closing=true;
  setTimeout(()=>{server.close(async()=>{await pool?.end().catch(()=>{});await locks?.end().catch(()=>{});process.exit(0)});server.closeIdleConnections?.()},Number(env.DRAIN_MS||4000));
  setTimeout(()=>process.exit(0),9000).unref();
 });
}
