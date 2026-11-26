import {readPlayerSave,accountTag} from './save-store.js';
import {rankedAction} from './rank-simulation.js';

const reply=(status,value,headers={})=>Response.json(value,{status,headers:{'Cache-Control':'private, no-store',...headers}});
const dayInfo=now=>rankedAction(null,{action:'trialDate'},now);
const writeWon='EXISTS(SELECT 1 FROM player_action_receipts WHERE owner=? AND request_id=? AND revision=? AND operation_id=?)';
const fail=(message,status=422,code='invalid_trial')=>{throw Object.assign(Error(message),{status,code})};
// The server replays the run with the stored character at double speed. Skilled manual play and
// a lucky run can finish a few floors above that replay; nothing higher enters the ranking.
const FLOOR_MARGIN=3;
function reachableFloors(state,info,now){
 let best=0;
 for(const prefer of [undefined,['skillDamage','attack','cooldown','critDamage','speed','crit','weakHp','time'],['time','weakHp','attack','skillDamage','critDamage','speed','crit','cooldown']]){
  const replay=rankedAction({state,seed:1+best},{action:'trialCeiling',info,prefer},now);
  best=Math.max(best,replay.floors);
 }
 return best+FLOOR_MARGIN;
}
export async function trialReadAccess(request){
 const owner=request.headers.get('oai-authenticated-user-id');
 if(!owner)return {response:reply(401,{error:'로그인이 필요합니다.'})};
 if(request.method!=='GET')return {response:reply(405,{error:'지원하지 않는 요청입니다.'},{Allow:'GET'})};
 const tag=await accountTag(request,owner),headers={'X-Nebula-Account':tag};
 if(request.headers.has('X-Nebula-Account')&&request.headers.get('X-Nebula-Account')!==tag)
  return {response:reply(403,{code:'account_changed',error:'로그인한 계정이 변경되었습니다.'})};
 return {owner,headers};
}
async function usedToday(db,owner,state,dayKey){
 const row=await db.prepare('SELECT MAX(attempt) AS used FROM trial_runs WHERE owner=? AND day_key=?').bind(owner,dayKey).first();
 const legacy=state.economyClaims?.trial?.days?.[dayKey];
 return Math.min(3,Math.max(row?.used||0,legacy?.used||0));
}
export async function trialTodayRoute(request,db){
 const access=await trialReadAccess(request);
 if(access.response)return access.response;
 const now=Date.now(),info=dayInfo(now),save=await readPlayerSave(db,access.owner);
 const used=await usedToday(db,access.owner,save?JSON.parse(save.data):{},info.dayKey);
 return reply(200,{...info,serverNow:now,used},access.headers);
}
async function best(db,owner,weekKey){
 return await db.prepare('SELECT best_score AS bestScore,best_floors AS bestFloors FROM trial_weekly WHERE owner=? AND week_key=?')
  .bind(owner,weekKey).first()||{bestScore:0,bestFloors:0};
}
export async function resolveTrialRun(db,owner,state,kind,input,now){
 const today=dayInfo(now),weekly=await best(db,owner,today.weekKey),used=await usedToday(db,owner,state,today.dayKey);
 if(kind==='trialStart'){
  const gate=rankedAction(null,{action:'featureInfo',key:'trial'},now);
  if(!state.classId||!(state.maxStage>gate.stage))fail(gate.message);
  if(used>=3)fail('오늘의 도전 횟수를 모두 사용했습니다.');
  const attempt=used+1,runId=crypto.randomUUID();
  const resolved=rankedAction({state},{action:'trialSettlement',mode:'start',info:today,attempt,usedToday:attempt,...weekly},now);
  return {...resolved,result:{...resolved.result,runId},statements:token=>[
   db.prepare(`INSERT INTO trial_runs(run_id,owner,day_key,week_key,attempt,started_at)
    SELECT ?,?,?,?,?,? WHERE `+writeWon).bind(runId,owner,today.dayKey,today.weekKey,attempt,now,owner,token.id,token.revision,token.nonce)
  ]};
 }
 const run=await db.prepare('SELECT day_key,week_key,attempt,started_at,finished_at FROM trial_runs WHERE run_id=? AND owner=?')
  .bind(input.runId,owner).first();
 if(!run)fail('입장 기록을 찾을 수 없습니다.',404,'trial_not_found');
 if(run.finished_at!==null)fail('이미 종료된 도전입니다.',409,'already_claimed');
 const elapsed=now-run.started_at;
 if(elapsed<0)fail('도전 시작 시간을 확인해 주세요.');
 const info=dayInfo(run.started_at),forfeit=input.settle==='forfeit';
 const ranked=!forfeit&&elapsed>=20000&&elapsed<=600000&&run.week_key===today.weekKey;
 if(!input.settle&&!ranked)fail('순위 등록 시간이 지났거나 아직 도전을 마칠 수 없습니다.');
 const completed=await db.prepare("SELECT 1 FROM trial_runs WHERE owner=? AND day_key=? AND status IN ('ranked','unranked') LIMIT 1")
  .bind(owner,run.day_key).first();
 const first=!forfeit&&!completed&&!state.economyClaims?.trial?.days?.[run.day_key]?.bonus;
 let {score,floors}=input;
 if(ranked){
  const limit=reachableFloors(state,info,now);
  if(floors>limit){floors=limit;score=limit*1000+999}
  weekly.bestScore=Math.max(weekly.bestScore,score);
  weekly.bestFloors=Math.max(weekly.bestFloors,floors);
 }
 const mode=forfeit?'forfeit':'normal',status=forfeit?'forfeit':ranked?'ranked':'unranked';
 const resolved=rankedAction({state},{action:'trialSettlement',mode,info,attempt:run.attempt,ranked,score,
  floors,first,usedToday:used,...weekly},now);
 return {...resolved,result:{...resolved.result,runId:input.runId},statements:token=>{
  const guard=[owner,token.id,token.revision,token.nonce];
  const list=[db.prepare(`UPDATE trial_runs SET finished_at=?,status=?,score=?,floors=?
   WHERE run_id=? AND owner=? AND finished_at IS NULL AND `+writeWon)
   .bind(now,status,ranked?score:null,ranked?floors:null,input.runId,owner,...guard)];
  if(ranked)list.push(db.prepare(`INSERT INTO trial_weekly(owner,week_key,best_score,best_floors,updated_at)
   SELECT ?,?,?,?,? WHERE `+writeWon+`
   ON CONFLICT(owner,week_key) DO UPDATE SET best_score=excluded.best_score,best_floors=excluded.best_floors,updated_at=excluded.updated_at
   WHERE excluded.best_score>trial_weekly.best_score`).bind(owner,run.week_key,score,floors,now,...guard));
  return list;
 }};
}
