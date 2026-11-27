import {rankedAction} from './rank-simulation.js';

const professions = new Set(['warrior','shadow','paladin','mage','archer']);
const response = (status, body) => Response.json(body,{status,headers:{'Cache-Control':'private, no-store'}});
const view = row => ({job:row.job,revision:row.revision,power:row.power,currentPower:row.current_power,stage:row.stage});
const receiptPattern=/^[a-zA-Z0-9-]{12,80}$/;
const sheet = sim => JSON.stringify({state:sim.state,seed:sim.seed});
function challengeView(proof) {
 return {id:proof.id,target:proof.target,mode:proof.mode,readyAt:proof.readyAt,expiresAt:proof.expiresAt};
}
async function bodyOf(request) {
 if(!request.headers.get('Content-Type')?.startsWith('application/json'))return null;
 const stream=request.body?.getReader();
 if(!stream)return null;
 let size=0,text='';const decoder=new TextDecoder();
 for(;;){
  const {done,value}=await stream.read();if(done)break;
  size+=value.byteLength;if(size>900){await stream.cancel();return null}
  text+=decoder.decode(value,{stream:true});
 }
 try{return JSON.parse(text+decoder.decode())}catch{return null}
}
const changed = () => response(409,{error:'다른 기기의 진행을 확인해 주세요.'});

// Rankings follow the adventure itself. After a save is stored, the server replays the highest stage that
// save claims with the saved character; the stage counts only if that character wins it. Power is the saved
// character's own combat power. At most one replay a minute per player and server process.
const ADOPT_EVERY_MS=60000,adoptedAt=new Map();
export async function adoptAdventureRecord(db,owner,data,now=Date.now()){
 if(now-(adoptedAt.get(owner)||0)<ADOPT_EVERY_MS)return null;
 let save;try{save=JSON.parse(data)}catch{return null}
 if(!save||typeof save!=='object'||save.testOnly||!professions.has(save.classId))return null;
 adoptedAt.set(owner,now);
 if(adoptedAt.size>100000)for(const [key,at] of adoptedAt)if(now-at>=ADOPT_EVERY_MS)adoptedAt.delete(key);
 const get=()=>db.prepare('SELECT stage,power,current_power FROM ranked_progress WHERE owner=?').bind(owner).first();
 let row=await get();
 if(!row){
  if(!await db.prepare('SELECT 1 AS found FROM nicknames WHERE owner=?').bind(owner).first())return null;
  const first=rankedAction(null,{action:'register',job:save.classId},now);
  await db.prepare('INSERT INTO ranked_progress(owner,job,power,current_power,sheet,last_action_at) VALUES(?,?,?,?,?,?) ON CONFLICT DO NOTHING')
   .bind(owner,save.classId,first.power,first.power,sheet(first),now).run();
  row=await get();if(!row)return null;
 }
 const state=rankedAction({state:save},{action:'economyMigrate'},now);
 const claimed=Math.min(1200,Math.max(0,Math.floor(Number(state.campaignCleared)||0)));
 let stage=row.stage,power;
 if(claimed>row.stage){
  const fight=rankedAction({state},{action:'fight',mode:'stage',target:claimed},now);
  power=fight.power;if(fight.won)stage=claimed;
  else{
   // A top stage cleared by a lucky roll may lose its replay; a stage a little lower still counts meanwhile.
   const fallback=Math.max(row.stage+1,claimed-Math.max(1,Math.floor(claimed/10)));
   if(fallback<claimed&&rankedAction({state:rankedAction({state:save},{action:'economyMigrate'},now)},{action:'fight',mode:'stage',target:fallback},now).won)stage=fallback;
  }
 }else power=rankedAction({state},{action:'power'},now).power;
 power=Math.max(1,Math.round(Number(power)||0));
 if(stage===row.stage&&power===row.current_power&&power<=row.power)return {stage,power};
 await db.prepare('UPDATE ranked_progress SET stage=MAX(stage,?),power=MAX(power,?),current_power=? WHERE owner=?')
  .bind(stage,power,power,owner).run();
 return {stage,power};
}
export async function rankRecords(request,db) {
 const owner=request.headers.get('oai-authenticated-user-id');
 if(!owner)return response(401,{error:'로그인이 필요합니다.'});
 const get=()=>db.prepare('SELECT * FROM ranked_progress WHERE owner=?').bind(owner).first();
 if(request.method==='GET'){const row=await get();return response(200,{profile:row?view(row):null})}
 if(request.method!=='POST')return response(405,{error:'지원하지 않는 요청입니다.'});
 const origin=request.headers.get('Origin');
 if(origin&&origin!==new URL(request.url).origin)return response(403,{error:'게임에서 다시 시도해 주세요.'});
 const command=await bodyOf(request);
 const keys={register:['job'],prepare:['mode','target','speed'],finish:['id'],upgrade:['stat','count','id','revision']};
 if(!command||!Object.hasOwn(keys,command.action)||Object.keys(command).some(k=>k!=='action'&&!keys[command.action].includes(k)))return response(400,{error:'게임 동작을 확인해 주세요.'});
 const now=Date.now();
 let row=await get();
 if(command.action==='register'){
  if(!professions.has(command.job))return response(400,{error:'직업을 확인해 주세요.'});
  if(!row){
   if(!await db.prepare('SELECT 1 AS found FROM nicknames WHERE owner=?').bind(owner).first())return response(403,{error:'닉네임을 먼저 등록해 주세요.'});
   const data=rankedAction(null,command,now);
   await db.prepare('INSERT INTO ranked_progress(owner,job,power,current_power,sheet,last_action_at) VALUES(?,?,?,?,?,?) ON CONFLICT DO NOTHING')
    .bind(owner,command.job,data.power,data.power,sheet(data),now).run();
   row=await get();
  }
  return row.job===command.job?response(200,{profile:view(row)}):response(409,{error:'이미 등록한 직업과 다릅니다.'});
 }
 if(!row)return response(409,{error:'직업을 먼저 등록해 주세요.'});
 let proof=row.proof&&JSON.parse(row.proof);
 if(command.action==='prepare'){
  const {mode,target,speed}=command;
  if(mode!=='stage'||![1,2].includes(speed)||!Number.isInteger(target)||target<=0)return response(400,{error:'전투 대상을 확인해 주세요.'});
  if(target>Math.min(1200,row.stage+1))return response(409,{profile:view(row),error:'검증된 이전 단계부터 순서대로 도전해 주세요.'});
  if(proof&&proof.target===target&&proof.mode===mode&&now<=proof.expiresAt)return response(200,{profile:view(row),challenge:challengeView(proof)});
  if(now-row.last_action_at<1500)return response(429,{error:'잠시 후 다시 시도해 주세요.'});
  // Reserve this revision before the CPU-intensive replay. A concurrent device must re-read it.
  const lock=await db.prepare('UPDATE ranked_progress SET last_action_at=?,proof=NULL WHERE owner=? AND revision=? AND last_action_at=? RETURNING owner')
   .bind(now,owner,row.revision,row.last_action_at).first();
  if(!lock)return changed();
  const base=JSON.parse(row.sheet);
  const sim=rankedAction(base,{action:'fight',mode,target},now);
  // Only the worker creates receipts. Clients see the target and timing, never the pending result.
  proof={id:crypto.randomUUID(),mode,target,readyAt:now+Math.ceil(sim.elapsed/speed),expiresAt:now+180000,won:sim.won,power:sim.power,state:sheet(sim),stage:sim.stage};
  const saved=await db.prepare('UPDATE ranked_progress SET proof=? WHERE owner=? AND revision=? AND last_action_at=? AND proof IS NULL RETURNING owner')
   .bind(JSON.stringify(proof),owner,row.revision,now).first();
  return saved?response(200,{profile:view(row),challenge:challengeView(proof)}):changed();
 }
 if(!receiptPattern.test(command.id||''))return response(400,{error:'기록 확인 번호가 필요합니다.'});
 if(row.last_receipt===command.id)return response(200,{profile:view(row)});
 let next,condition,params;
 if(command.action==='finish'){
  if(!proof||proof.mode!=='stage'||proof.id!==command.id||now>proof.expiresAt)return changed();
  if(now<proof.readyAt)return response(425,{readyAt:proof.readyAt,retryMs:proof.readyAt-now,error:'전투 판정을 기다려 주세요.'});
  next=proof;
  condition=' AND proof=?';params=[row.proof];
 }else{
  if(!Number.isSafeInteger(command.revision)||command.revision!==row.revision)return changed();
  if(!Number.isInteger(command.stat)||command.stat<0||command.stat>6||![1,10,50].includes(command.count))return response(400,{error:'능력 강화 단위를 확인해 주세요.'});
  const before=JSON.parse(row.sheet),level=before.state.stats[command.stat];
  const sim=rankedAction(before,command,now);
  if(sim.state.stats[command.stat]===level)return response(409,{profile:view(row),error:'서버 캐릭터의 강화 조건을 확인해 주세요.'});
  next={power:sim.power,stage:sim.stage,state:sheet(sim)};
  condition='';params=[];
 }
 const result=await db.prepare('UPDATE ranked_progress SET power=MAX(power,?),current_power=MAX(current_power,?),stage=MAX(stage,?),sheet=?,proof=NULL,last_receipt=?,revision=revision+1,last_action_at=? WHERE owner=? AND revision=?'+condition+' RETURNING job,power,current_power,stage,revision')
  .bind(next.power,next.power,next.stage,next.state,command.id,now,owner,row.revision,...params).first();
 if(!result){
  const latest=await get();
  if(latest?.last_receipt===command.id)return response(200,{profile:view(latest)});
  return changed();
 }
 return response(200,{profile:view(result),...(command.action==='finish'?{won:next.won}:{})});
}
