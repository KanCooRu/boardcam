'use strict';

// Reservation and completion share the existing account revision and reward ledger.
function dailyTrialWallet(state,{source,id},now){
 const today=trialDayInfo(now);
 const match=typeof id==='string'&&/^(\d{4}-\d{2}-\d{2})\/([1-3])(?:\/(0|[1-9]\d*))?$/.exec(id);
 if(!match||(source==='trialFinish')!==(match[3]!==undefined))throw Error('도전 기록을 확인하세요.');
 const dayKey=match[1],attempt=Number(match[2]),score=Number(match[3]||0);
 if(!Number.isSafeInteger(score))throw Error('점수를 확인하세요.');
 const ledger=initializeEconomyClaims(state);
 const book=ledger.trial||={days:{},weekKey:today.weekKey,bestScore:0,bestFloors:0};
 if(book.weekKey!==today.weekKey)Object.assign(book,{weekKey:today.weekKey,bestScore:0,bestFloors:0});
 let day=book.days[dayKey];
 if(source==='trialEnter'){
  if(dayKey!==today.dayKey)throw Error('날짜가 바뀌었습니다. 다시 입장하세요.');
  if(!state.classId||!(state.maxStage>featureStage('trial'))&&!featureTestOverride())throw Error(featureLockText('trial'));
  if(!day){
   day=book.days[dayKey]={weekKey:today.weekKey,weakness:today.weakness,used:0,closed:0,bonus:false};
   for(const key of Object.keys(book.days).sort().slice(0,-2))delete book.days[key];
  }
  if(day.used>=TRIAL_ENTRY_LIMIT)throw Error('오늘의 도전 횟수를 모두 사용했습니다.');
  if(attempt!==day.used+1)rejectEconomyClaim();
  state.daily.trialRuns=++day.used;
  state.trial={...state.trial,weekKey:book.weekKey,bestScore:book.bestScore,bestFloors:book.bestFloors};
  return {dayKey,weekKey:day.weekKey,weakness:day.weakness,attempt};
 }
 // A reservation can close exactly once. Voluntary exit consumes the entry
 // and leaves the first-completion bonus available for another run that day.
 const mask=1<<(attempt-1);
 if(!day||attempt>day.used||day.closed&mask)rejectEconomyClaim();
 day.closed|=mask;
 const rewards={};
 if(source==='trialFinish'){
  Object.assign(rewards,TRIAL_RUN_REWARD);
  if(!day.bonus){rewards.gems=TRIAL_FIRST_GEMS;day.bonus=true}
  for(const [key,amount] of Object.entries(rewards)){
   if(key==='gems')creditEconomyGems(state,amount);
   else state[key]=(state[key]||0)+amount;
  }
  state.trialPeak=Math.max(trialPeakFloors(state),Math.floor(score/1000));
  if(day.weekKey===today.weekKey){
   book.bestScore=Math.max(book.bestScore,score);
   book.bestFloors=Math.max(book.bestFloors,Math.floor(score/1000));
  }
 }
 state.trial={...state.trial,weekKey:book.weekKey,bestScore:book.bestScore,bestFloors:book.bestFloors};
 return {rewards,bestScore:book.bestScore,bestFloors:book.bestFloors};
}
const trialRemote={owner:null,calendar:null,expires:0,pending:null,retryAt:0,timer:0};
const trialDateKey=key=>typeof key==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(key);
function trialClock(){return performance.now()}
function trialReadOwner(){return typeof s==='undefined'?null:s}
function trialSurfaceVisible(){
 return !document.hidden&&(activeScreen==='dungeon'||view==='dungeonGuide'||view==='trialRanking'||view==='trialWeekReward');
}
function trialCalendar(){
 const owner=trialReadOwner();if(!owner)return null;
 if(!saveGuard.usesServer()){
  const current=trialDayInfo();
  const used=owner.economyClaims?.trial?.days?.[current.dayKey]?.used??(owner.day===current.dayKey?owner.daily?.trialRuns:0);
  return {...current,used:used||0,serverNow:Date.now()};
 }
 return trialRemote.owner===owner&&trialClock()<trialRemote.expires?trialRemote.calendar:null;
}
async function trialRead(path){
 const owner=trialReadOwner();
 if(!owner||!saveGuard.usesServer())return null;
 const key=saveGuard.accountKey?.(),controller=new AbortController(),timer=setTimeout(()=>controller.abort(),6500);
 try{
  const response=await fetch('/api/trial/'+path,{cache:'no-store',credentials:'same-origin',signal:controller.signal,
   headers:key?{'X-Nebula-Account':key}:{}});
  const tag=response.headers?.get('X-Nebula-Account');
  if(!response.ok||key&&tag&&tag!==key)return null;
  const data=await response.json();
  return owner===trialReadOwner()&&saveGuard.usesServer()?data:null;
 }catch{return null}finally{clearTimeout(timer)}
}
function setTrialCalendar(data,start){
 if(!data||!trialDateKey(data.dayKey)||!trialDateKey(data.weekKey)||!Object.hasOwn(WEAPON_ELEMENTS,data.weakness)||
  !Number.isInteger(data.used)||data.used<0||data.used>TRIAL_ENTRY_LIMIT||!Number.isFinite(data.serverNow))return false;
 const midnight=Date.parse(data.dayKey+'T15:00:00Z');
 if(!Number.isFinite(midnight)||midnight<=data.serverNow||midnight-data.serverNow>86400000)return false;
 const current=trialCalendar();
 trialRemote.calendar={...data,used:Math.max(data.used,current?.dayKey===data.dayKey?current.used:0)};
 // Start timing before the request so a delayed reply never extends yesterday's key.
 trialRemote.expires=start+midnight-data.serverNow;
 clearTimeout(trialRemote.timer);
 trialRemote.timer=setTimeout(()=>{
  if(trialSurfaceVisible()&&saveGuard.usesServer())void refreshTrialCalendar(true);
 },Math.max(1,trialRemote.expires-trialClock()+1));
 return true;
}
function refreshTrialCalendar(force=false){
 const owner=trialReadOwner();
 if(!owner||!saveGuard.usesServer())return Promise.resolve(trialCalendar());
 if(trialRemote.owner!==owner){
  clearTimeout(trialRemote.timer);
  Object.assign(trialRemote,{owner,calendar:null,expires:0,pending:null,retryAt:0,timer:0});
 }
 if(trialRemote.pending)return trialRemote.pending;
 const cached=trialCalendar(),start=trialClock();
 if(!force&&(cached||start<trialRemote.retryAt))return Promise.resolve(cached);
 const job=trialRead('today').then(data=>{
  if(owner!==trialReadOwner()||owner!==trialRemote.owner)return null;
  if(!setTrialCalendar(data,start)){trialRemote.retryAt=trialClock()+8000;return null}
  trialRemote.retryAt=0;
  if(typeof onTrialCalendarChanged==='function')onTrialCalendarChanged();
  return trialCalendar();
 }).finally(()=>{if(trialRemote.pending===job)trialRemote.pending=null});
 trialRemote.pending=job;return job;
}
function refreshVisibleTrial(){
 if(trialRemote.owner&&trialSurfaceVisible()&&saveGuard.usesServer())void refreshTrialCalendar(true);
}
window.addEventListener?.('online',refreshVisibleTrial);
document.addEventListener?.('visibilitychange',()=>{
 if(document.hidden||!trialRemote.owner)return;
 // Mobile browsers can suspend their monotonic timer while the screen is off.
 trialRemote.expires=0;refreshVisibleTrial();
});
function fetchTrialRanking(weekKey){
 if(weekKey!=null&&!trialDateKey(weekKey))return Promise.resolve(null);
 return trialRead(weekKey?'ranking?week='+encodeURIComponent(weekKey):'ranking');
}
function claimTrialWeek(weekKey){
 if(!trialDateKey(weekKey)||!saveGuard.usesServer()||!guardFeature('trial'))return Promise.resolve(null);
 return saveGuard.command('trialClaim',{weekKey});
}
function localDailyTrialCommand(source,id){
 try{
  resetDay();
  const result=dailyTrialWallet(s,{source,id},Date.now());
  save();return result;
 }catch(error){notice(error.message);return null}
}
async function reserveDailyTrial(){
 if(!guardFeature('trial'))return null;
 const owner=s,info=trialCalendar()||await refreshTrialCalendar();
 if(owner!==s)return null;
 if(!info){notice('서버에서 오늘의 탑 정보를 확인하지 못했습니다');return null}
 if(info.used>=TRIAL_ENTRY_LIMIT){notice('오늘의 도전 횟수를 모두 사용했습니다.');return null}
 if(!saveGuard.usesServer())return localDailyTrialCommand('trialEnter',info.dayKey+'/'+(info.used+1));
 const result=await saveGuard.command('trialStart',{});
 if(owner!==s||!saveGuard.usesServer())return null;
 if(!result?.runId){void refreshTrialCalendar(true);return null}
 const verified=trialCalendar();
 if(verified?.dayKey===result.dayKey)verified.used=Math.max(verified.used,result.attempt);
 else void refreshTrialCalendar(true);
 return result;
}
async function settleDailyTrial(run,score){
 if(!run||!Number.isInteger(run.attempt)||!run.abandoned&&(!Number.isSafeInteger(score)||score<0||Math.floor(score/1000)!==run.floors))return null;
 if(saveGuard.usesServer()){
  if(typeof run.runId!=='string'||!run.runId)return null;
  const result=await saveGuard.command('trialFinish',{runId:run.runId,score:run.abandoned?0:score,
   floors:run.abandoned?0:run.floors,settle:run.abandoned?'forfeit':'normal'});
  if(result?.ranked&&typeof invalidateTrialRanking==='function')invalidateTrialRanking();
  return result;
 }
 const id=run.dayKey+'/'+run.attempt;
 return run.abandoned?localDailyTrialCommand('trialForfeit',id):localDailyTrialCommand('trialFinish',id+'/'+score);
}
