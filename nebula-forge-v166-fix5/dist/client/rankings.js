'use strict';

const rankBoard=(()=>{
 const boards={power:['전투력','최고 전투력'],stage:['스테이지','최고 클리어 단계'],guild:['길드','길드 순위']};
 let current=null,cache=new Map();
 function usable(){return !!s?.classId&&!testSession&&!s.testOnly&&!!accountName&&typeof fetch==='function'}
 function ensurePlayer(){
  if(current===s)return;
  current=s;cache=new Map();
 }
 async function request(path,options={}){
  const response=await fetch('/api/rankings'+path,{cache:'no-store',credentials:'same-origin',signal:AbortSignal.timeout(10000),...options});
  if(!response.ok)throw Error();
  return response.json();
 }
 function schedule(){if(usable())void certifiedCombat.connect()}
 async function refresh(key,item){
  const player=s;item.loading=true;
  try{
   if(key==='guild'&&chatRestoreTask)await chatRestoreTask;
   await certifiedCombat.connect();
   const data=await request('?board='+key);
   if(!Array.isArray(data.rows))throw Error();
   item.rows=data.rows;item.failed=false;item.until=Date.now()+30000;
  }catch{item.failed=true;item.until=Date.now()+10000}
  finally{
   item.loading=false;
   if(s===player&&view==='ranking'&&selected()===key&&cache.get(key)===item)render();
  }
 }
 function selected(){return Object.hasOwn(boards,tab)?tab:'power'}
 function choose(key){
  if(!Object.hasOwn(boards,key)||view!=='ranking')return;
  tab=key;render();$('content').scrollTop=0;
 }
 function displayScore(key,score){
  if(key==='guild'&&score==null)return '집계 중';
  if(key==='stage')return stageText(score);
  if(key==='trial')return num(score)+'점';
  if(key==='worldboss')return num(score);
  return ratingText(score);
 }
 function crest(name){
  let tone=0;
  for(const c of name)tone=(tone*31+c.codePointAt(0))%6;
  return '<span class="rank-standard standard-'+tone+'" aria-hidden="true"><i>'+(name?safeText(Array.from(name)[0]):'<ui-mark data-shape=spark aria-hidden=true></ui-mark>')+'</i></span>';
 }
 // The season-two display art is also square. These contact points use its own standing pose.
 const seasonPodium={
  archer:{x:.476,y:.934,height:.844,span:.477},mage:{x:.535,y:.934,height:.854,span:.426},
  paladin:{x:.536,y:.934,height:.848,span:.569},shadow:{x:.463,y:.932,height:.860,span:.895},
  warrior:{x:.477,y:.938,height:.848,span:.584}
 };
 function standingPortrait(src,pose){
  const size='--height-fit:'+(100/pose.height).toFixed(2)+'cqh;--width-fit:'+(95/pose.span).toFixed(2)+'cqw';
  const contact='--foot-x:'+(-100*pose.x).toFixed(2)+'%;--foot-gap:'+((1-pose.y)*100).toFixed(2)+'%';
  return '<img class="rank-champion" style="'+size+';'+contact+'" src="'+src+'" alt="">';
 }
 function figure(key,row,large){
  if(key==='guild')return crest(row.name);
  const profile=row.mine?raidRecords.snapshot():row;
  if(profile&&CLASSES.some(c=>c.id===profile.job)){
   const outfit=profile.job+'-'+profile.outfit;
   const face=faceURL(displayFaceIndex(profile.portrait,profile.job));
   const body=profile.outfit==='season2'?seasonTwoArt(profile.job,'display'):Object.hasOwn(MATURE_ART,outfit)?matureArtURL(outfit):null;
   if(large&&body)return standingPortrait(body,profile.outfit==='season2'?seasonPodium[profile.job]:MATURE_ART[outfit]);
   return '<img class="rank-portrait" src="'+face+'" alt="">';
  }
  return '<span class="rank-seal" aria-hidden="true"><ui-mark data-shape=spark aria-hidden=true></ui-mark></span>';
 }
 function podium(key,rows,title,subtitle){
  const slots=[1,0,2].map(i=>{
   const row=rows[i],slot=['center','left','right'][i];
   if(!row||row.place==null)return '<div class="rank-seat seat-'+slot+' vacant" aria-hidden="true"><div class="rank-plinth"></div></div>';
   const medal=row.place===1?'gold':row.place===2?'silver':'bronze';
   return '<div class="rank-seat seat-'+slot+' medal-'+medal+'"><div class="rank-figure">'+figure(key,row,true)+'</div>'+
    '<div class="rank-plinth"><span class="rank-medal">'+row.place+'위</span><strong>'+safeText(row.name)+'</strong><b>'+displayScore(key,row.score)+'</b></div></div>';
  }).join('');
  return '<section class="rank-hall" aria-label="상위 순위"><header><h3>'+title+'</h3>'+(subtitle?'<small>'+subtitle+'</small>':'')+'</header><div class="rank-podium">'+slots+'</div></section>';
 }
 function entryRow(key,row,mine=false){
  return '<div class="rank-line'+(mine?' rank-personal':'')+'"'+(mine?'':' role="listitem"')+'><b class="rank-position">'+(row.place==null?'—':row.place+'위')+'</b>'+
   '<span class="rank-icon">'+figure(key,row,false)+'</span><span class="rank-identity">'+(mine?'<small>'+(key==='guild'?'내 길드':'내 순위')+'</small>':'')+
   '<strong>'+safeText(row.name)+'</strong></span><b class="rank-value">'+displayScore(key,row.score)+'</b></div>';
 }
 function gallery(key,title,subtitle,rows,status,controls='',personalRow=null){
  const ranked=Array.isArray(rows),records=ranked?rows:[],mine=personalRow||records.find(row=>row.mine);
  // The API includes the current account after the top 50 when necessary.
  const rest=records.slice(0,50).filter((row,index)=>index>=3||row.place==null);
  const list=rest.length?'<div class="rank-list" role="list" aria-label="순위 목록">'+rest.map(row=>entryRow(key,row)).join('')+'</div>':'';
  const personal=mine?entryRow(key,mine,true):ranked?
   '<div class="rank-personal rank-unplaced"><strong>'+(key==='guild'?'내 길드':'내 순위')+'</strong><span>'+(key==='guild'?'가입한 길드 없음':'순위 미등록')+'</span></div>':'';
  return '<section class="rank-gallery" data-board="'+key+'">'+podium(key,records,title,subtitle)+list+status+
   '<footer class="rank-dock">'+personal+controls+'</footer></section>';
 }
 function panel(){
  const key=selected();
  const tabs='<nav class="rank-tabs" aria-label="랭킹 종류">'+Object.entries(boards).map(([id,[label]])=>
   '<button type="button" onclick="rankBoard.choose(\''+id+'\')" aria-pressed="'+(id===key)+'">'+label+'</button>').join('')+'</nav>';
  return onlineGallery(key,boards[key][1],key==='guild'?'길드원의 현재 전투력 합계':key==='stage'?'모험에서 클리어한 단계 · 1분마다 갱신':'모험 기록 기준 최고 전투력 · 1분마다 갱신',tabs);
 }
 function onlineGallery(key,title,subtitle,controls){
  ensurePlayer();
  let status='',rows=null;
  if(testSession||s.testOnly)status='테스트 플레이는 랭킹 집계에서 제외됩니다.';
  else if(!usable())status='닉네임을 연결하면 랭킹이 표시됩니다.';
  else{
   const item=cache.get(key)||{rows:null,until:0,loading:false,failed:false};cache.set(key,item);
   if(!item.loading&&Date.now()>=item.until)void refresh(key,item);
   rows=item.rows;
   if(item.failed)status='랭킹을 불러오지 못했습니다. <button type="button" onclick="rankBoard.retry()">다시 시도</button>';
   else if(!rows)status='랭킹을 불러오는 중…';
   else if(!rows.length)status={guild:'아직 참가한 길드가 없습니다.',stage:'아직 스테이지를 클리어한 기사가 없습니다.',power:'아직 기록된 기사가 없습니다.'}[key];
  }
  return gallery(key,title,subtitle,rows,status?'<p class="rank-message" role="status">'+status+'</p>':'',controls);
 }
 function trialGallery(data,subtitle,controls=''){
  const convert=row=>({place:row.rank,name:row.name,score:row.score,mine:row.isMe});
  const rows=data.top.slice(0,50).map(convert);
  const status=rows.length?'':'<p class="rank-status">이 기간에 등록된 기록이 없습니다.</p>';
  return gallery('trial','오늘의 탑',subtitle,rows,status,controls,data.me?convert(data.me):null);
 }
 function worldTrials(rows,status){
  return gallery('worldboss','월드보스 인증 피해','인증 장비·스킬 기준 · 파수룡 Lv.1부터',rows,status);
 }
 function retry(){const item=cache.get(selected());if(item)item.until=0;render()}
 function invalidate(){cache.clear()}
 return {panel,worldTrials,trialGallery,choose,retry,schedule,invalidate};
})();

EXTRA_POPUPS.ranking=['랭킹',rankingPopup];
// The worker reconstructs the account from its own starter kit, costs and combat engine.
// A browser sends only the player's choice or a receipt the worker has already issued.
const certifiedCombat=(()=>{
 let actor=null,nickname='',profile=null,connecting=null,nextConnect=0,lastFight=null,settling=null,queue=Promise.resolve();
 function active(){return typeof fetch==='function'&&!!s?.classId&&!!accountName&&!testSession&&!s.testOnly}
 function reset(){
  if(actor===s&&nickname===accountName)return;
  actor=s;nickname=accountName;profile=null;connecting=null;nextConnect=0;lastFight=null;settling=null;queue=Promise.resolve();
 }
 async function call(data){
  const res=await fetch('/api/ranked-progress',{method:'POST',credentials:'same-origin',cache:'no-store',signal:AbortSignal.timeout(12000),
   headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});
  const body=await res.json();
  if(!res.ok){const error=new Error(body.error);error.status=res.status;error.readyAt=body.readyAt;error.retryMs=body.retryMs;error.profile=body.profile;throw error}
  return body;
 }
 function update(next,wanted){
  if(!active()||s!==wanted||actor!==wanted)return false;
  if(next){const changed=profile&&next.revision!==profile.revision;profile=next;if(changed)rankBoard.invalidate()}
  return true;
 }
 function connect(){
  if(!active())return Promise.resolve(false);
  reset();
  if(profile)return Promise.resolve(true);
  if(connecting)return connecting;
  if(Date.now()<nextConnect)return Promise.resolve(false);
  const wanted=s;nextConnect=Date.now()+10000;
  connecting=call({action:'register',job:s.classId}).then(r=>update(r.profile,wanted)).catch(()=>false)
   .finally(()=>{if(wanted===actor)connecting=null});
  return connecting;
 }
 function serialize(wanted,work){
  queue=queue.then(async()=>{if(!active()||s!==wanted||!await connect()||s!==wanted)return;await work()}).catch(()=>{});
  return queue;
 }
 function noteAttack(){
  if(!active()||worldBoss.inBattle()||partyRaid.inBattle()||dungeonRun)return;
  reset();
  const mode='stage',target=s.stage;
  if(profile&&target>profile.stage+1&&!(settling?.mode===mode&&target===settling.target+1))return;
  if(lastFight&&lastFight.mode===mode&&lastFight.target===target&&Date.now()<lastFight.retryAt)return;
  const wanted=s,speed=s.speed===2?2:1,run={mode,target,challenge:null,retryAt:Infinity};
  lastFight=run;
  serialize(wanted,async()=>{
   if(target>profile.stage+1)return;
   const result=await call({action:'prepare',mode,target,speed});
   if(update(result.profile,wanted)){run.challenge=result.challenge;run.retryAt=Date.now()+120000}
  }).finally(()=>{if(!run.challenge)run.retryAt=Date.now()+2000});
 }
 const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
 function finish(mode,target){
  const run=lastFight;
  if(!active()||!run||run.mode!==mode||run.target!==target)return;
  const wanted=s;lastFight=null;settling=run;
  serialize(wanted,async()=>{
   const proof=run.challenge;if(!proof)return;
   // The server owns the clock; the first call also handles differences between device clocks.
   let result;
   try{result=await call({action:'finish',id:proof.id})}
   catch(err){
    if(err.status!==425)throw err;
    const serverWait=Number(err.retryMs)||Math.max(0,err.readyAt-Date.now());
    await delay(Math.min(92000,serverWait+100));
    if(!active()||s!==wanted)return;
    result=await call({action:'finish',id:proof.id});
   }
   update(result.profile,wanted);
  }).finally(()=>{if(settling===run)settling=null});
 }
 function grow(stat,count){
  if(!active()||![1,10,50].includes(count))return;
  reset();const wanted=s;
  serialize(wanted,async()=>{
   const id=crypto.randomUUID();
   try{const r=await call({action:'upgrade',stat,count,id,revision:profile.revision});update(r.profile,wanted);lastFight=null}
   catch(e){if(e.profile)update(e.profile,wanted)}
  });
 }
 return {connect,noteAttack,finish,grow,info:()=>active()?profile:null};
})();
// The stage board follows the stored adventure (the server replays the top stage of each save), so ordinary
// attacks no longer start a separate server-side stage proof.
const rankedAdvance=advanceCampaign;
advanceCampaign=function(target){const prior=s.stageKills,out=rankedAdvance(target);if(prior+1>=campaignKillsNeeded(target))certifiedCombat.finish('stage',target);return out};
const rankedUpgrade=upgrade;
upgrade=function(i,...args){const old=s.stats[i],out=rankedUpgrade(i,...args);if(s.stats[i]>old)certifiedCombat.grow(i,s.stats[i]-old);return out};
const nameSyncBeforeRankings=syncAccountNickname;
syncAccountNickname=async function(){await nameSyncBeforeRankings();rankBoard.schedule();if(view==='ranking')render()};
