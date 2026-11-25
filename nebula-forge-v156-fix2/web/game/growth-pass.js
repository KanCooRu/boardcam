/* Growth and seasonal passes share existing claim ledgers and quest progress. */
'use strict';
const GROWTH_PASS_REWARDS=Array.from({length:30},(_,i)=>({id:(i+1)*10,goal:(i+1)*10,reward:{gems:100+Math.min(10,i)*20,...[{ore:30},{stones:40},{shards:10},{relicShards:10},{summonTickets:1}][i%5]}}));
const SEASON_PASS_PRICE=14000,SEASON_PASS_PRODUCT='season_pass_14000';
// Each entry is the season level's resource, free quantity and premium quantity.
const SEASON_LEVEL_LOOT=[
 ['ore',60,180], ['stones',80,240], ['gems',200,400],
 ['shards',30,90], ['relicShards',20,60], ['gems',300,600],
 ['summonTickets',4,10], ['petTickets',2,6], ['gems',400,800],
 ['stones',140,420], ['shards',40,120], ['gems',500,1000],
 ['rouletteCoins',2,6], ['petTickets',2,6], ['gems',700,1400],
 ['stones',100,200], ['relicShards',30,90], ['gems',900,1800],
 ['rouletteCoins',2,6], ['summonTickets',6,15]
];
const SEASON_PASS_REWARDS=SEASON_LEVEL_LOOT.map(([key,free],i)=>({id:i,goal:(i+1)*100,reward:{[key]:free}}));
const PREMIUM_PASS_REWARDS=SEASON_LEVEL_LOOT.map(([key,,premium],i)=>({id:i,goal:(i+1)*100,reward:{[key]:premium}}));
let passMissionTab='daily',seasonPassTrack='free';
const passTrackScroll={growth:null,free:null,premium:null};
function normalizePass(a){
 const season=a.season;
 if(!season.rewardVersion){season.points*=2;season.rewardVersion=2}
 season.premiumClaimed=recordMap(season.premiumClaimed);return a;
}
const beforePassStarter=starter,beforePassMigrate=migrate,beforePassReset=resetDay;
starter=function(){const a=beforePassStarter();a.season.rewardVersion=2;return normalizePass(a)};
migrate=function(data){return normalizePass(beforePassMigrate(data))};
resetDay=function(){const cycle=s.season?.cycle;beforePassReset();if(cycle!==s.season?.cycle){s.season.premiumClaimed={};s.season.rewardVersion=2;passTrackScroll.free=passTrackScroll.premium=null}};
function hasPremiumSeasonPass(){return gmAllowed() && testSession.premiumCycle===s.season.cycle}
function enableTestSeasonPass(){if(!gmAllowed())return false;testSession.premiumCycle=s.season.cycle;paint();notice('테스트 세션에만 유료 패스를 활성화했습니다');return true}
function setSeasonPassTrack(track){if(!['free','premium'].includes(track))return;seasonPassTrack=track;paint()}
function passRewardRows(mode=passMode,sorted=true,track=seasonPassTrack){
 const season=mode==='season',premium=season&&track==='premium',progress=season?s.season.points:Math.min(300,s.maxStage),claimed=season?(premium?s.season.premiumClaimed:s.season.claimed):s.passClaimed;
 const rows=(season?(premium?PREMIUM_PASS_REWARDS:SEASON_PASS_REWARDS):GROWTH_PASS_REWARDS).map((r,index)=>({...r,index,value:progress,claimed:!!claimed[r.id],locked:premium&&!hasPremiumSeasonPass(),priority:missionPriority(premium&&!hasPremiumSeasonPass()?0:progress,r.goal,!!claimed[r.id])}));
 return sorted?rows.sort((a,b)=>a.priority-b.priority||a.index-b.index):rows;
}
function passTotals(track='free'){return (track==='premium'?PREMIUM_PASS_REWARDS:SEASON_PASS_REWARDS).reduce((sum,r)=>{for(const [k,n]of Object.entries(r.reward))sum[k]=(sum[k]||0)+n;return sum},{})}
function passSeasonEnd(now=Date.now()){return seasonStart+(seasonCycle(now)+1)*seasonLength}
function seasonDaysLeft(now=Date.now()){return Math.ceil((passSeasonEnd(now)-now)/86400000)}
function setPassMode(mode){if(!['growth','season'].includes(mode))return;passMode=mode;paint();passScrollTop()}
function setPassMissionTab(kind){if(!['daily','weekly'].includes(kind))return;passMissionTab=kind;paint()}
function passScrollTop(){if(view==='pass')$('content').scrollTop=0;else if(activeScreen==='shop'&&screenTab==='pass')$('screenContent').scrollTop=0}
function passStatus(row){return row.claimed?'수령 완료':row.locked?'유료 패스 필요':row.priority===0?'수령 가능':'진행 중'}
function passRewardText(reward){return Object.entries(reward).map(([k,n])=>RESOURCE_NAMES[k]+' '+num(n)).join(' · ')}
function passClaimCall(mode,id){return mode==='season'?`claimSeason(${id},'${seasonPassTrack}')`:`claimPass(${id})`}

function passHero(mode){
 const season=mode==='season',premium=season&&seasonPassTrack==='premium',rows=passRewardRows(mode,false);
 const total=rows[0].value,next=rows.find(r=>r.goal>total);
 const level=next?next.index:rows.length,previous=level?rows[level-1].goal:0;
 const range=next?next.goal-previous:1,value=next?total-previous:1;
 const ready=rows.filter(r=>r.priority===0).length;
 const title=season?(premium?'프리미엄 시즌 패스':'무료 시즌 패스'):'별빛 성장 패스';
 const progress=next?(season?'다음 레벨까지 '+num(next.goal-total)+'P':'다음 보상 STAGE '+next.goal):'모든 구간 달성';
 const details=premium?`<button class="season-price" onclick="openMenu('seasonProduct')" aria-label="유료 패스 구성 보기">${hasPremiumSeasonPass()?'유료 패스 활성':num(SEASON_PASS_PRICE)+'원'} <span aria-hidden="true"><ui-mark data-shape=bang aria-hidden=true></ui-mark></span></button>`:'';
 return `<section class="season-cover ${season?seasonPassTrack:'growth'}">
 <div class="season-cover-top">${season?'시즌 '+Math.max(1,seasonCycle()+1):'노말 · 스테이지 1–300'}</div><h3>${title}</h3>
 ${season?`<div class="season-details"><span class="season-time" data-season-countdown>시즌종료 : ${seasonDaysLeft()}일 남음</span>${details}</div>`:''}
 <div class="season-cover-progress"><div><b>${season?'Lv.'+level:'스테이지 '+total}</b><span>${progress}</span></div><progress class="pass-meter" max="${range}" value="${value}" aria-label="${season?'시즌 레벨':'성장 스테이지'} 진행도" aria-valuetext="${progress}"></progress></div>
 ${ready>1?`<button class="season-collect-all" onclick="claimAllPass('${mode}')">보상 ${ready}개 받기</button>`:''}</section>`;
}
function passTrack(mode){
 const season=mode==='season',rows=passRewardRows(mode,false),track=season?seasonPassTrack:'growth';
 const steps=rows.map(r=>{
  const ready=r.priority===0,earned=r.value>=r.goal;
  const label=season?'Lv.'+(r.index+1):'STAGE '+r.goal;
  const status=r.claimed?'수령 완료':ready?'받기':'';
  const items=Object.entries(r.reward).map(([key,n])=>`<span class="rail-loot">${art(RESOURCE_ART[key])}<span><b>${num(n)}</b><small>${RESOURCE_NAMES[key]}</small></span></span>`).join('');
  return `<li class="rail-stage ${r.claimed?'claimed':ready?'ready':earned?'earned':''}" data-pass-target="${ready?'ready':r.locked&&earned&&!r.claimed?'eligible':earned?'done':'next'}">
  <span class="rail-stop"><i aria-hidden="true"></i>${label}</span><button class="rail-gift" ${ready?`onclick="${passClaimCall(mode,r.id)}"`:'disabled'} aria-label="${label}, ${passRewardText(r.reward)}, ${passStatus(r)}">${items}${status?`<span class="rail-status">${status}</span>`:''}</button></li>`;
 }).join('');
 return `<div class="reward-rail ${track}" data-pass-track="${track}" onscroll="passTrackScroll['${track}']=this.scrollLeft" tabindex="0" role="region" aria-label="${season?'시즌':'성장'} 보상 트랙"><ol class="rail-stages">${steps}</ol></div>`;
}
function seasonTrackSelector(){
 return '<div class="season-track-selector">'+[['free','무료 패스'],['premium','유료 패스']].map(([key,title])=>
  `<button class="${seasonPassTrack===key?'active '+key:''}" aria-pressed="${seasonPassTrack===key}" onclick="setSeasonPassTrack('${key}')">${title}${rewardDot('season:'+key)}</button>`
 ).join('')+'</div>';
}
function seasonProductPopup(){return `<div class="season-product-heading"><h3>시즌 패스 · 14,000원</h3><p>무료 보상에 추가로 받는 시즌 성장 패키지</p></div><div class="effect-table">${Object.entries(passTotals('premium')).map(([k,n])=>`<div><span>${RESOURCE_NAMES[k]}</span><b>+${num(n)}</b></div>`).join('')}</div><p class="small">무료·유료 트랙은 포인트를 공유합니다. 시즌 중 구매하면 달성 보상도 받습니다. 최종 보상은 Lv.20.</p><div class="payment-notice"><b>결제 서비스 연결 준비 중</b></div>${button('구매 준비 중 · 14,000원','',true)}`}
EXTRA_POPUPS.seasonProduct=['시즌 패스 구성',seasonProductPopup];
function passMissionList(kind){
 const rows=seasonMissionRows(kind);
 return `<div class="pass-period-clock">초기화까지 <time data-reset-clock="${kind}">${resetCountdown(kind)}</time></div><div class="pass-compact-list">${rows.map(r=>{
  const claim=r.priority===0;
  const action=claim?`claimPassMission('${kind}','${r.key}')`:`playerMissionGo('${r.target}')`;
  return `<article class="pass-list-row" data-pass-mission="${r.key}" data-pass-priority="${r.priority}">
   <div class="pass-point-icon">${art('pass')}<b>+${r.points}P</b></div><div class="pass-list-copy"><strong>${r.name}</strong>${r.coins?'<small>패스 코인 +'+r.coins+'</small>':''}
   <div class="pass-mission-progress"><div class="bar"><i style="width:${Math.min(100,r.value/r.goal*100)}%"></i></div><span>${num(Math.min(r.value,r.goal))}/${num(r.goal)}</span></div></div>
   <button class="${claim?'gold-button':'muted-button'}" onclick="${action}" ${r.claimed?'disabled':''}>${r.claimed?'수령 완료':claim?'받기':'이동'}</button></article>`;
 }).join('')}</div>`;
}
passPopup=function(){
 resetDay();
 const season=passMode==='season';
 const modes=`<div class="tabs pass-mode-tabs">${[['growth','성장 패스'],['season','시즌 패스']].map(([k,n])=>`<button class="${passMode===k?'active':''}" aria-pressed="${passMode===k}" onclick="setPassMode('${k}')">${n}${rewardDot(k==='growth'?'growth':'season:all')}</button>`).join('')}</div>`;
 const tracks=(season?seasonTrackSelector():'')+passHero(passMode)+passTrack(passMode);
 if(!season)return modes+tracks;
 const tabs=[['daily','일일 미션'],['weekly','주간 미션']].map(([k,n])=>`<button class="${passMissionTab===k?'active':''}" aria-pressed="${passMissionTab===k}" onclick="setPassMissionTab('${k}')">${n}${rewardDot(k)}</button>`).join('');
 return modes+tracks+'<div class="tabs pass-mission-tabs">'+tabs+'</div>'+passMissionList(passMissionTab);
};
EXTRA_POPUPS.pass=['패스',passPopup];

// All entry points validate the same reward definitions; old saves retain their IDs.
claimPass=function(stage){
 if(!guardFeature('pass'))return false;
 const reward=GROWTH_PASS_REWARDS.find(r=>r.id===stage);
 if(!reward||s.maxStage<reward.goal||s.passClaimed[stage])return false;
 if(saveGuard.usesServer?.())return claimServerReward('growthPass',stage);
 s.passClaimed[stage]=true;grant(reward.reward);save();paint();notice('성장 보상 수령 · '+passRewardText(reward.reward));return true};
claimSeason=function(id,track='free'){resetDay();if(!['free','premium'].includes(track))return false;const premium=track==='premium',rows=premium?PREMIUM_PASS_REWARDS:SEASON_PASS_REWARDS,ledger=premium?s.season.premiumClaimed:s.season.claimed,row=rows.find(r=>r.id===id);if(!row||ledger[id]||s.season.points<row.goal||premium&&!hasPremiumSeasonPass())return false;
 if(saveGuard.usesServer?.())return premium?false:claimServerReward('seasonPass',id);
 ledger[id]=true;grant(row.reward);save();paint();notice('시즌 보상 수령 · '+passRewardText(row.reward));return true};
function claimAllPass(mode){if(!['growth','season'].includes(mode)||mode==='growth'&&!guardFeature('pass'))return false;resetDay();const rows=passRewardRows(mode).filter(r=>r.priority===0);if(!rows.length)return false;
 if(saveGuard.usesServer?.())return mode==='season'&&seasonPassTrack==='premium'?false:claimServerReward(mode==='growth'?'growthPass':'seasonPass','all');
 const ledger=mode==='season'?(seasonPassTrack==='premium'?s.season.premiumClaimed:s.season.claimed):s.passClaimed;for(const r of rows){ledger[r.id]=true;grant(r.reward)}save();paint();notice(rows.length+'개 패스 보상을 수령했습니다');return true}
function claimPassMission(kind,key){
 if(!['daily','weekly'].includes(kind))return false;
 resetDay();
 const row=seasonMissionRows(kind).find(r=>r.key===key);
 if(!row||row.claimed||row.value<row.goal)return false;
 row.ledger.claimed[key]=true;
 s.season.points+=row.points;s.passCoins+=row.coins;
 save();paint();notice('시즌 포인트 +'+row.points+(row.coins?' · 패스 코인 +'+row.coins:''));return true;
}

function restorePassTrack(){
 document.querySelectorAll('[data-pass-track]').forEach(el=>{const mode=el.dataset.passTrack,offset=passTrackScroll[mode];if(offset!==null)el.scrollLeft=offset;else{const target=el.querySelector('[data-pass-target="ready"],[data-pass-target="eligible"]')||el.querySelector('[data-pass-target="next"]')||el.querySelector('.rail-stage:last-child');el.scrollLeft=target?Math.max(0,target.offsetLeft-8):0}});
}
const beforePassRender=render,beforePassScreen=renderScreen;
render=function(){beforePassRender();if(view==='pass')restorePassTrack()};
renderScreen=function(keepScroll=true){beforePassScreen(keepScroll);if(activeScreen==='shop'&&screenTab==='pass')restorePassTrack()};

const beforePassNavigation=navigate;
navigate=function(page,sub){if(page==='shop'&&sub==='pass'){openMenu('pass');return}beforePassNavigation(page,sub)};
