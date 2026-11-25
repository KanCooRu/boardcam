import {limitedUpload} from './economy-protection.js';
import {readLimitMemory,limitMemoryStatement} from './progress-limits.js';
// One authoritative revision per account. Device snapshots never select an older revision.
const SAVE_BYTES=512*1024, SAVE_INTERVAL_MS=5000, HISTORY_LENGTH=5;
const MAX_ENVELOPE_BYTES=6*SAVE_BYTES+2048;
const encoder=new TextEncoder();
const currentSQL='SELECT revision,data,updated_at AS updatedAt FROM player_saves WHERE owner=?';
const missing={revision:0,data:null,updatedAt:0};
function reply(status,data,headers={}){
 return Response.json(data,{status,headers:{'Cache-Control':'private, no-store',...headers}});
}
function pruneHistory(db,owner){
 return db.prepare(`DELETE FROM player_save_history WHERE owner=? AND revision NOT IN
  (SELECT revision FROM player_save_history WHERE owner=? ORDER BY revision DESC LIMIT ?)`).bind(owner,owner,HISTORY_LENGTH);
}
export async function readPlayerSave(db,owner){
 const current=()=>db.prepare(currentSQL).bind(owner).first();
 const record=await current();
 if(record)return record;
 const legacy=await db.prepare(`SELECT revision,snapshot AS data,updated_at AS updatedAt
  FROM account_backups WHERE owner=? ORDER BY revision DESC LIMIT 1`).bind(owner).first();
 if(!legacy)return null;
 // Old builds could store a snapshot before the player registered a nickname.
 // Keep that record readable. The first request after registration promotes it.
 const registered=await db.prepare('SELECT 1 AS registered FROM nicknames WHERE owner=?').bind(owner).first();
 if(!registered)return legacy;
 await db.batch([
  db.prepare(`INSERT OR IGNORE INTO player_saves(owner,revision,data,updated_at)
   SELECT owner,revision,snapshot,updated_at FROM account_backups WHERE owner=? ORDER BY revision DESC LIMIT 1`).bind(owner),
  db.prepare(`INSERT OR IGNORE INTO player_save_history(owner,revision,data,saved_at)
   SELECT b.owner,b.revision,b.snapshot,b.updated_at FROM account_backups b
   JOIN player_saves s ON s.owner=b.owner WHERE b.owner=? AND b.revision<=s.revision`).bind(owner),
  pruneHistory(db,owner)
 ]);
 return await current()||legacy;
}

// The caller supplies the full serialized state and the revision it was based on.
// Paid server commands can use the same atomic write without the autosave throttle.
export async function compareAndSwapPlayerSave(db,owner,baseRevision,data,{minIntervalMs=0,now=Date.now(),receipt=null,uploadHash=null,statements=null,limitMemory=null}={}){
 const latest=await readPlayerSave(db,owner);
 if((latest?.revision||0)!==baseRevision)return {status:409,save:latest||missing};
 if(latest&&minIntervalMs>0&&now-latest.updatedAt<minIntervalMs)
  return {status:429,retryAfterMs:minIntervalMs-(now-latest.updatedAt)};
 const next=baseRevision+1;
 const mutate=baseRevision===0?
  db.prepare(`INSERT INTO player_saves(owner,revision,data,updated_at,upload_hash)
   SELECT owner,1,?,?,? FROM nicknames WHERE owner=? ON CONFLICT(owner) DO NOTHING
   RETURNING revision,data,updated_at AS updatedAt`).bind(data,now,uploadHash,owner):
  db.prepare(`UPDATE player_saves SET revision=?,data=?,updated_at=?,upload_hash=?
   WHERE owner=? AND revision=? RETURNING revision,data,updated_at AS updatedAt`).bind(next,data,now,uploadHash,owner,baseRevision);
 const operations=[mutate];
 if(receipt){
  // changes() refers to the preceding CAS in this same transaction. A losing
  // device can neither publish a winning receipt nor overwrite another action.
  operations.push(db.prepare(`INSERT INTO player_action_receipts(owner,request_id,command,revision,result,operation_id)
   SELECT ?,?,?,?,?,? WHERE changes()=1`).bind(owner,receipt.id,receipt.command,next,JSON.stringify(receipt.result),receipt.nonce||null));
  if(statements)operations.push(...statements({id:receipt.id,revision:next,nonce:receipt.nonce}));
 }
 if(limitMemory)operations.push(limitMemoryStatement(db,owner,limitMemory,now));
 operations.push(db.prepare(`INSERT OR IGNORE INTO player_save_history(owner,revision,data,saved_at)
  SELECT owner,revision,data,updated_at FROM player_saves WHERE owner=? AND revision=?`).bind(owner,next),pruneHistory(db,owner));
 const results=await db.batch(operations);
 const save=results[0].results[0];
 if(save)return {status:200,save};
 const winner=await readPlayerSave(db,owner);
 if((winner?.revision||0)!==baseRevision)return {status:409,save:winner||missing};
 // With no canonical row, a new or formerly unnamed legacy account must claim its nickname first.
 return {status:428};
}
export function validateSaveData(data){
 if(typeof data!=='string')return 400;
 if(encoder.encode(data).length>SAVE_BYTES)return 413;
 try{
  const game=JSON.parse(data);
  return game&&typeof game==='object'&&!Array.isArray(game)&&!game.testOnly&&
   Number.isInteger(game.level)&&game.level>=1&&Number.isInteger(game.stage)&&game.stage>=1&&
   Number.isFinite(game.gold)&&game.gold>=0&&Array.isArray(game.stats)&&Array.isArray(game.gear)?200:400;
 }catch{return 400}
}
export async function hashSaveData(text){
 const digest=await crypto.subtle.digest('SHA-256',encoder.encode(text));
 return Array.from(new Uint8Array(digest),n=>n.toString(16).padStart(2,'0')).join('');
}
export function accountTag(request,owner){
 return hashSaveData('nebula-economy:'+new URL(request.url).origin+':'+owner);
}
async function parseUpload(request){
 if(Number(request.headers.get('Content-Length'))>MAX_ENVELOPE_BYTES)return {status:413};
 const reader=request.body?.getReader();
 if(!reader)return {status:400};
 const decoder=new TextDecoder('utf-8',{fatal:true});let text='',size=0;
 try{
  for(;;){
   const {done,value}=await reader.read();if(done)break;
   size+=value.byteLength;
   if(size>MAX_ENVELOPE_BYTES){await reader.cancel();return {status:413}}
   text+=decoder.decode(value,{stream:true});
  }
  const input=JSON.parse(text+decoder.decode());
  if(!Number.isSafeInteger(input?.baseRevision)||input.baseRevision<0||typeof input.data!=='string')return {status:400};
  const status=validateSaveData(input.data);if(status!==200)return {status};
  return {status:200,input};
 }catch{return {status:400}}
}
export async function playerSaveRoute(request,db){
 const owner=request.headers.get('oai-authenticated-user-id');
 if(!owner)return reply(401,{error:'로그인이 필요합니다.'});
 if(request.method==='GET'){
  const [save,tag]=await Promise.all([readPlayerSave(db,owner),accountTag(request,owner)]);
  const headers={'X-Nebula-Account':tag};
  return save?reply(200,save,headers):reply(404,{code:'save_not_found',error:'서버 저장이 없습니다.'},headers);
 }
 if(request.method!=='POST')return reply(405,{error:'게임을 새로고침해 주세요.'},{Allow:'GET, POST'});
 if(request.headers.get('Origin')!==new URL(request.url).origin)return reply(403,{error:'게임에서 다시 시도해 주세요.'});
 if(request.headers.get('Content-Type')?.split(';')[0].trim().toLowerCase()!=='application/json')
  return reply(415,{error:'JSON 요청이 필요합니다.'});
 const {status,input}=await parseUpload(request);
 if(status!==200)return reply(status,{error:status===413?'저장 파일은 512KB 이하만 가능합니다.':'정상적인 본 플레이 기록이 필요합니다.'});
 const current=await readPlayerSave(db,owner);
 if((current?.revision||0)!==input.baseRevision)return reply(409,current||missing);
 const now=Date.now(),checked=limitedUpload(current,input.data,now,await readLimitMemory(db,owner));
 if(checked===null)return reply(409,current);
 const {data,memory:limitMemory}=checked;
 const uploadHash=await hashSaveData(input.data);
 const result=await compareAndSwapPlayerSave(db,owner,input.baseRevision,data,{minIntervalMs:SAVE_INTERVAL_MS,now,uploadHash,limitMemory});
 if(result.status===428)return reply(428,{code:'nickname_required',error:'기사 이름을 먼저 등록해 주세요.'});
 if(result.status===429)return reply(429,{error:'잠시 후 다시 저장해 주세요.',retryAfterMs:result.retryAfterMs},
  {'Retry-After':String(Math.ceil(result.retryAfterMs/1000))});
 return reply(result.status,result.save);
}
