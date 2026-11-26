import {readPlayerSave,compareAndSwapPlayerSave,validateSaveData,hashSaveData,accountTag} from './save-store.js';
import {limitedUpload} from './economy-protection.js';
import {readLimitMemory} from './progress-limits.js';
import {resolveTrialRun} from './trial-runs.js';
import {resolveTrialClaim} from './trial-ranking.js';
import {rankedAction} from './rank-simulation.js';

const routes=new Map([
 ['/api/forge/enhance','forge'],['/api/draw','draw'],['/api/shop/buy','shop'],['/api/reward/claim','claim'],
 ['/api/trial/start','trialStart'],['/api/trial/finish','trialFinish'],['/api/trial/claim','trialClaim']
]);
export const economyPath=path=>routes.has(path);
const reply=(status,value,headers={})=>Response.json(value,{status,headers:{'Cache-Control':'private, no-store',...headers}});
const invalid=()=>reply(400,{error:'요청 형식을 확인해 주세요.'});
const stringId=(id,limit)=>typeof id==='string'&&id.length>0&&id.length<=limit&&!/[\x00-\x1f\x7f]/.test(id);
const MAX_COMMAND_BYTES=6*512*1024+4096;
async function readCommand(request,gzip){
 if(Number(request.headers.get('Content-Length'))>MAX_COMMAND_BYTES)return {status:413};
 if(!request.body)return {status:400};
 let stream=request.body,compressedBytes=0,oversized=false;
 const decoder=new TextDecoder('utf-8',{fatal:true});let size=0,text='';
 try{
  if(gzip){
   const input=stream.getReader();
   const limited=new ReadableStream({
    async pull(controller){
     const {done,value}=await input.read();
     if(done){controller.close();return}
     compressedBytes+=value.byteLength;
     if(compressedBytes>MAX_COMMAND_BYTES){
      oversized=true;controller.error(new RangeError());await input.cancel();return;
     }
     controller.enqueue(value);
    },
    cancel:reason=>input.cancel(reason)
   });
   stream=limited.pipeThrough(new DecompressionStream('gzip'));
  }
  const reader=stream.getReader();
  for(;;){
   const {done,value}=await reader.read();if(done)break;
   size+=value.byteLength;if(size>MAX_COMMAND_BYTES){await reader.cancel();return {status:413}}
   text+=decoder.decode(value,{stream:true});
  }
  return {input:JSON.parse(text+decoder.decode())};
 }catch{return {status:oversized?413:400}}
}
function parseCommand(kind,input,headers){
 if(!input||typeof input!=='object'||Array.isArray(input))return null;
 const rev=headers.get('If-Match'),id=headers.get('X-Nebula-Request-Id');
 if(id!==null&&!/^[A-Za-z0-9_-]{8,96}$/.test(id))return null;
 if(rev!==null&&!/^(?:[0-9]+|"[0-9]+")$/.test(rev))return null;
 const expected=rev===null?null:Number(rev.replaceAll('"',''));
 if(expected!==null&&!Number.isSafeInteger(expected))return null;
 const payment=headers.get('X-Nebula-Payment'),timing=headers.get('X-Nebula-Timing'),manual=headers.get('X-Nebula-Manual');
 if(payment!==null&&kind!=='draw'||(timing!==null||manual!==null)&&kind!=='forge')return null;
 const progress=input._progress;
 if(progress!==undefined){
  if(expected===null||!progress||typeof progress!=='object'||Array.isArray(progress)||
   Object.keys(progress).some(key=>!['data','previousHash'].includes(key))||typeof progress.data!=='string'||
   (Object.hasOwn(progress,'previousHash')&&(typeof progress.previousHash!=='string'||!/^[0-9a-f]{64}$/.test(progress.previousHash))))return null;
  delete input._progress;
 }
 const meta={};
 let body;
 switch(kind){
  case 'forge':
   if(typeof input.useGuard!=='boolean')return null;
   body={useGuard:input.useGuard};
   if(manual!==null&&!['true','false','1','0'].includes(manual))return null;
   meta.manual=manual==='true'||manual==='1';meta.timing=timing||'good';
   if(!['perfect','good','miss'].includes(meta.timing)||!meta.manual&&meta.timing!=='good')return null;
   break;
  case 'draw':
   if(!['skill','pet','costume','roulette'].includes(input.kind)||![1,10].includes(input.count))return null;
   body={kind:input.kind,count:input.count};
   if(payment!==null){
    if(!['daily','ticket','coin','gems','true','false'].includes(payment))return null;
    meta.payment=payment==='false'?'gems':payment==='true'?(['skill','pet'].includes(body.kind)?'ticket':'coin'):payment;
   }
   break;
  case 'shop':
   if(!stringId(input.itemId,70))return null;
   body={itemId:input.itemId};break;
  case 'trialStart':body={};break;
  case 'trialFinish':
   if(!stringId(input.runId,80)||!Number.isSafeInteger(input.score)||input.score<0||
    !Number.isSafeInteger(input.floors)||input.floors<0||Math.floor(input.score/1000)!==input.floors)return null;
   body={runId:input.runId,score:input.score,floors:input.floors};
   if(Object.hasOwn(input,'settle')){
    if(!['normal','forfeit'].includes(input.settle)||input.settle==='forfeit'&&input.score!==0)return null;
    body.settle=input.settle;
   }
   break;
  case 'trialClaim':
   if(!stringId(input.weekKey,10))return null;
   body={weekKey:input.weekKey};break;
  case 'claim':
   if(['trialEnter','trialFinish','trialForfeit'].includes(input.source))return null;
   if(!stringId(input.source,64)||!(stringId(input.id,400)||Number.isSafeInteger(input.id)&&input.id>=0))return null;
   body={source:input.source,id:input.id};break;
  default:return null;
 }
 if(Object.keys(input).length!==Object.keys(body).length)return null;
 return {body,meta,id,expected,progress,fingerprint:JSON.stringify([kind,body,meta])};
}
async function replayReceipt(db,owner,command){
 if(!command.id)return null;
 const receipt=await db.prepare('SELECT command,result FROM player_action_receipts WHERE owner=? AND request_id=?')
  .bind(owner,command.id).first();
 if(!receipt)return null;
 const save=await readPlayerSave(db,owner);
 if(receipt.command!==command.fingerprint)return reply(409,{...save,code:'request_id_reused',error:'다른 행동에 사용한 요청 번호입니다.'});
 return reply(200,{...save,result:JSON.parse(receipt.result)});
}
export async function economyRoute(request,db,path){
 const owner=request.headers.get('oai-authenticated-user-id');
 if(!owner)return reply(401,{error:'로그인이 필요합니다.'});
 if(request.method!=='POST')return reply(405,{error:'지원하지 않는 요청입니다.'},{Allow:'POST'});
 if(request.headers.get('Origin')!==new URL(request.url).origin)return reply(403,{error:'게임에서 다시 시도해 주세요.'});
 const tag=request.headers.get('X-Nebula-Account');
 if(tag!==null&&tag!==await accountTag(request,owner))
  return reply(403,{code:'account_changed',error:'로그인한 계정이 변경되었습니다.'});
 const type=request.headers.get('Content-Type')?.split(';')[0].trim().toLowerCase();
 const marker=request.headers.get('X-Nebula-Gzip'),gzip=marker==='1';
 if(request.headers.has('Content-Encoding')||!(marker===null&&type==='application/json'||gzip&&type==='application/octet-stream'))
  return reply(415,{error:'지원하지 않는 전송 형식입니다.'});
 const {input,status}=await readCommand(request,gzip);
 if(status)return reply(status,{error:status===413?'저장 요청이 너무 큽니다.':'요청 형식을 확인해 주세요.'});
 const kind=routes.get(path),command=parseCommand(kind,input,request.headers);
 if(!command)return invalid();
 if(command.progress){
  const status=validateSaveData(command.progress.data);
  if(status!==200)return reply(status,{error:status===413?'저장 파일은 512KB 이하만 가능합니다.':'정상적인 본 플레이 기록이 필요합니다.'});
  command.fingerprint+=':'+await hashSaveData(command.progress.data)+':'+(command.progress.previousHash||'');
 }
 if(!await db.prepare('SELECT 1 AS registered FROM nicknames WHERE owner=?').bind(owner).first())
  return reply(428,{code:'nickname_required',error:'기사 이름을 먼저 등록해 주세요.'});
 const save=await readPlayerSave(db,owner);
 if(!save&&!command.progress)return reply(404,{code:'save_not_found',error:'서버 저장이 없습니다.'});
 return settle(db,owner,kind,command,save);
}
async function matchesAutosave(db,owner,command,save){
 const previous=command.progress?.previousHash;
 if(!previous||!save||save.revision!==command.expected+1)return false;
 // Hash the submitted public snapshot, not its server-normalized copy which
 // can legitimately include a freshly initialized reward ledger.
 return !!await db.prepare('SELECT 1 FROM player_saves WHERE owner=? AND revision=? AND upload_hash=?')
  .bind(owner,save.revision,previous).first();
}
async function settle(db,owner,kind,command,save){
 const replay=await replayReceipt(db,owner,command);if(replay)return replay;
 const revision=save?.revision||0;
 if(command.expected!==null&&command.expected!==revision){
  // The customer's autosave may just have won the revision race. Accept only
  // the exact bytes the device had already submitted, at the very next revision.
  if(!await matchesAutosave(db,owner,command,save))
   return reply(409,save||{revision:0,updatedAt:0,data:null});
 }
 const now=Date.now();
 const checked=command.progress?limitedUpload(save,command.progress.data,now,await readLimitMemory(db,owner)):{data:save.data,memory:null};
 if(checked===null)return reply(409,save);
 const {data,memory:limitMemory}=checked;
 const record={state:JSON.parse(data)};
 let resolved;
 try{
  if(kind==='trialClaim')resolved=await resolveTrialClaim(db,owner,record.state,command.body,now);
  else if(kind==='trialStart'||kind==='trialFinish')resolved=await resolveTrialRun(db,owner,record.state,kind,command.body,now);
  else resolved=rankedAction(record,{action:'economy',kind,input:command.body,meta:command.meta},now);
 }catch(error){
  if(error.status===409)return reply(409,{...save,code:error.code||'already_claimed',error:error.message});
  if(error.status===404)return reply(404,{code:error.code,error:error.message});
  if(error.constructor===Error&&/[가-힣]/.test(error.message))return reply(422,{error:error.message});
  throw error;
 }
 const {result,state}=resolved;
 const receipt=command.id||resolved.statements?{id:command.id||crypto.randomUUID(),command:command.fingerprint,result,
  nonce:resolved.statements?crypto.randomUUID():null}:null;
 const written=await compareAndSwapPlayerSave(db,owner,revision,JSON.stringify(state),{now,receipt,statements:resolved.statements,limitMemory});
 if(written.status===409){
  if(revision===command.expected&&await matchesAutosave(db,owner,command,written.save))
   return settle(db,owner,kind,command,written.save);
  return await replayReceipt(db,owner,command)||reply(409,written.save);
 }
 if(written.status!==200)return reply(written.status,{error:'서버 저장을 확인해 주세요.'});
 return reply(200,{...written.save,result});
}
