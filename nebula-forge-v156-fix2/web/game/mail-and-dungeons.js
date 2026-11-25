/* Clear claim states and illustrated dungeon entry lists. */
'use strict';
let mailClaimEffectUntil=0,dungeonListSignature='';
const MAIL_ITEMS=[['gems','다이아',300,'gem'],['ore','성운석',30,'ore'],['shards','스킬 조각',30,'shard']];
mailUI=function(){const claimed=!!s.mailClaimed,justClaimed=claimed&&Date.now()<mailClaimEffectUntil;
 return `<article class="mail-letter ${claimed?'mail-received':''} ${justClaimed?'mail-claim-animation':''}"><div class="mail-letter-heading">${art('mail')}<span>천공의 대장간<small>모험가에게 보내는 선물</small></span><b class="mail-status ${claimed?'received':''}">${claimed?'<ui-mark data-shape=check aria-hidden=true></ui-mark> 수령 완료':'미수령'}</b></div><h3>성운기사에게 보내는 초대장</h3><p>천공의 대장간에 오신 것을 환영합니다.<br>기사의 첫 모험을 위한 선물을 받아 주세요.</p><div class="mail-reward-grid">${MAIL_ITEMS.map(([key,name,count,a],i)=>`<div class="mail-reward ${claimed?'claimed':''}" data-reward="${key}" style="--claim-delay:${i*90}ms"><div class="mail-reward-icon">${art(a)}${claimed?'<span class="received-check" aria-hidden="true"><ui-mark data-shape=check aria-hidden=true></ui-mark></span>':''}</div><strong>${name} <b>${num(count)}</b></strong><small>${claimed?'수령 완료':'받을 수 있는 선물'}</small>${claimed?'<span class="received-stamp">수령 완료</span>':''}</div>`).join('')}</div><div class="mail-summary"><span>첨부 아이템</span><b>${claimed?'3 / 3 수령 완료':'3개 보상 수령 가능'}</b></div><button class="gold-button mail-claim-button" onclick="claimMail()" ${claimed?'disabled':''}>${claimed?'<ui-mark data-shape=check aria-hidden=true></ui-mark> 모든 보상을 수령했습니다':'모든 보상 받기'}</button></article>`;
};
const previousClaimMail=claimMail;
claimMail=function(){if(!s.mailClaimed)mailClaimEffectUntil=Date.now()+1000;previousClaimMail()};

function missionPriority(value,goal,claimed){return claimed?2:value>=goal?0:1}
function sortedMissions(kind){const rows=kind==='daily'?DAILY_GOALS:WEEKLY_GOALS,data=kind==='daily'?s.daily:s.weekly;return rows.map(([key,name,goal],index)=>({key,name,goal,index,value:data[key]||0,claimed:!!data.claimed[key]})).sort((a,b)=>missionPriority(a.value,a.goal,a.claimed)-missionPriority(b.value,b.goal,b.claimed)||a.index-b.index)}
function missionCard(n,v,max,done,fn,reward,key=''){
 const status=done?'claimed':v>=max?'ready':'progress';
 return `<article class="card mission-card mission-${status}" data-mission-key="${key}" data-mission-state="${status}"><div class="mission-card-heading"><h3>${n}</h3><span class="mission-status">${done?'<ui-mark data-shape=check aria-hidden=true></ui-mark> 수령 완료':status==='ready'?'수령 가능':'진행 중'}</span></div><div class="mission-progress"><span>${num(Math.min(v,max))} / ${num(max)}</span><small>${reward}</small></div><div class="bar"><i style="width:${Math.max(0,Math.min(100,v/max*100))}%"></i></div><div class="action-row">${button(done?'<ui-mark data-shape=check aria-hidden=true></ui-mark> 수령 완료':status==='ready'?'보상 받기':'진행 중',fn,status!=='ready')}</div></article>`;
}
function missionList(kind){const rows=sortedMissions(kind),ready=rows.filter(r=>missionPriority(r.value,r.goal,r.claimed)===0).length,done=rows.filter(r=>r.claimed).length;return `<div class="mission-list-summary"><div><b>${ready?'받을 수 있는 보상 '+ready+'개':'새로운 도전을 이어가세요'}</b></div><span>${done}/${rows.length} 수령</span></div><div class="mission-reset">${kind==='daily'?'일일':'주간'} 초기화까지 <b data-reset-clock="${kind}">${resetCountdown(kind)}</b></div><div class="mission-list">${rows.map(r=>missionCard(r.name,r.value,r.goal,r.claimed,`${kind==='daily'?'dailyClaim':'weeklyClaim'}('${r.key}')`,kind==='daily'?'다이아 50 · 패스 코인 5 · 시즌 20P':'다이아 200 · 소환권 2 · 시즌 100P',r.key)).join('')}</div>`}
questsPopup=function(){return `<div class="tabs">${[['main','진행'],['daily','일일'],['weekly','주간'],['achievements','업적']].map(([k,n])=>`<button class="${missionTab===k?'active':''}" onclick="missionTab='${k}';$('content').scrollTop=0;render()">${n}${rewardDot('quests:'+k)}</button>`).join('')}</div>${missionTab==='main'?mainQuestPopup():missionTab==='achievements'?achievementsPopup():missionList(missionTab==='weekly'?'weekly':'daily')}`};
achievementsPopup=function(){return ACTIVE_ACHIEVEMENT_IDS.map(index=>{const [type,name,goal,reward]=ACHIEVEMENTS[index];return {name,goal,reward,index,value:achieveValue(type),claimed:!!s.achievements[index]}}).sort((a,b)=>missionPriority(a.value,a.goal,a.claimed)-missionPriority(b.value,b.goal,b.claimed)||a.index-b.index).map(r=>missionCard(r.name,r.value,r.goal,r.claimed,`claimAchievement(${r.index})`,'칭호 · 다이아 '+num(r.reward),'achievement_'+r.index)).join('')};
const previousDailyClaim=dailyClaim,previousWeeklyClaim=weeklyClaim,previousAchievementClaim=claimAchievement;
function afterMissionClaim(wasClaimed,isClaimed){if(!wasClaimed&&isClaimed&&view==='quests'){$('content').scrollTop=0;render()}}
dailyClaim=function(key){const before=!!s.daily.claimed[key];previousDailyClaim(key);afterMissionClaim(before,!!s.daily.claimed[key])};
weeklyClaim=function(key){const before=!!s.weekly.claimed[key];previousWeeklyClaim(key);afterMissionClaim(before,!!s.weekly.claimed[key]);if(!before&&s.weekly.claimed[key])notice('주간 보상 수령 · 다이아 200 · 소환권 2')};
claimAchievement=function(i){const before=!!s.achievements[i];previousAchievementClaim(i);afterMissionClaim(before,!!s.achievements[i])};

const DUNGEON_BANNERS={
 gold:{name:'황금 광산',sub:'황금빛 심장에 잠든 보물',region:2,subject:'creature_2_3',icon:'coin',tag:'골드 던전',tone:'gold',daily:0},
 armory:{name:'고대 무기고',sub:'잊힌 기사단의 유산',region:6,subject:'creature_6_2',icon:'stone',tag:'강화 재료 던전',tone:'steel',daily:1},
 library:{name:'마법 도서관',sub:'별의 마법을 기록한 서고',region:1,subject:'summonBook',icon:'shard',tag:'스킬 던전',tone:'violet',daily:2},
 mine:{name:'별의 광산',sub:'빛나는 성운석을 찾아서',region:4,subject:'mine',icon:'ore',tag:'60초 채굴',tone:'violet'},
 explore:{name:'별길 탐험대',sub:'지평선 너머의 고대 유적',region:0,subject:'explore',icon:'expedition',tag:'시간제 파견',tone:'teal'},
 trial:{name:'오늘의 탑',sub:'90초 동안 층을 돌파하세요',region:6,subject:'creature_8_3',icon:'tower',tag:'일일 도전 · 90초',tone:'violet'},
 rush:{name:'보스 러시',sub:'공허의 군주에게 도전하라',region:7,subject:'creature_7_3',icon:'dungeon',tag:'연속 보스',tone:'red'},

};
function dungeonEntryState(key){
 const meta=DUNGEON_BANNERS[key];if(!meta)return null;
 if(key==='trial'){
  const info=trialCalendar(),busy=!!dungeonRun,reward='별철 · 강화석 · 첫 판 다이아';
  if(!info)return {status:'확인 중',hint:'오늘의 약점 확인 중',icon:'tower',reward,label:'입장',disabled:true,fn:'startDailyTrial()'};
  const runes=currentWeapon()?.runes||{},element=WEAPON_ELEMENTS[info.weakness].name;
  const rank=runes[info.weakness]||0,used=info.used??(s.day===info.dayKey?s.daily.trialRuns||0:0),left=Math.max(0,TRIAL_ENTRY_LIMIT-used);
  return {status:`남은 도전 ${left} / ${TRIAL_ENTRY_LIMIT}`,hint:`오늘의 약점 ${element} · 각인 ${rank}단계`,icon:'tower',
   reward,label:busy?'전투 중':left?'입장':'오늘 도전 완료',disabled:busy||left===0,
   fn:'startDailyTrial()',weakness:info.weakness,rank,element,weekKey:info.weekKey};
 }
 if(key==='explore'){
  const active=s.expeditions.filter(Boolean).length,ready=s.expeditions.filter(e=>e&&e.end<=Date.now()).length;
  return {status:ready?`완료된 탐험 ${ready}개`:`파견 중 ${active} / 3`,hint:'횟수 제한 없음 · 시간제 파견',reward:'유물 조각 · 강화석 · 룰렛 코인',label:ready?'보상 확인':'탐험 관리',disabled:false,fn:"openDungeonContent('explore')",icon:'expedition'};
 }
 const entry=ENTRY_PASSES[key],{stock,can}=entryAvailability(key),busy=!!dungeonRun;
 const state={status:entryStatus(key),hint:'추가 입장권 '+num(stock)+'장',icon:entry.resource,disabled:busy||!can,label:busy?'전투 중':entryButton(key,'입장')};
 if(Number.isInteger(meta.daily)){
  const i=meta.daily,lv=s.dungeonSelected[i];
  const reward=materialLootLabel(i,lv);
  return {...state,label:materialEntryLabel(i,lv,state.label),reward,fn:`startDungeon(${i})`,lv,recommended:recommendedPower(lv)};
 }
 if(key==='rush')return {...state,reward:'다이아 · 소환권',fn:'startRush()',recommended:rushRecommendedPower(),recommendationNote:'시작 보스 기준 · 자동 조정'};
 const r=s.mineRun,ready=!!r&&r.end<=Date.now();
 if(r){state.status=ready?'보상 수령 가능':'채굴 진행 중';state.label=ready?'보상 확인':'계속 채굴';state.disabled=false}
 return {...state,reward:'성운석 · 강화석 · 별철',fn:"openDungeonContent('mine')"};
}
function openDungeonContent(key){if(!['mine','explore'].includes(key)||!guardFeature(key))return false;if(key==='mine'){if(!s.mineRun&&entryAvailability('mine').can){navigate('dungeon','mine');startMine()}else navigate('dungeon','mine');return}navigate('dungeon',key)}
function dungeonSubject(subject){
 if(subject.startsWith('creature_'))return `<img class="realm-portrait" src="./assets/actor-poses/${subject}.webp" width="320" height="320" alt="" decoding="async">`;
 return art(subject);
}
function dungeonBanner(key,featured=false){
 const m=DUNGEON_BANNERS[key],e=dungeonEntryState(key);
 if(!m||!e)return '';
 const preview=m.region;
 const difficulty=Number.isInteger(m.daily)?`<div class="realm-difficulty">
  <button onclick="selectDifficulty(${m.daily},-1)" aria-label="${m.name} 이전 난이도" ${e.lv<=1?'disabled':''}><ui-mark data-shape=chevron-left aria-hidden=true></ui-mark></button>
  <b>${e.lv}단계</b>
  <button onclick="selectDifficulty(${m.daily},1)" aria-label="${m.name} 다음 난이도" ${e.lv>=s.dungeonLevel[m.daily]?'disabled':''}><ui-mark data-shape=chevron-right aria-hidden=true></ui-mark></button></div>`:'';
 return `<article class="realm-banner ${featured?'featured-realm':''} tone-${m.tone} ${e.disabled?'entry-unavailable':''}" data-dungeon="${key}" style="--realm-preview:url('./assets/region-hd/preview-${preview}.webp')">
  <div class="realm-showcase" aria-hidden="true">${dungeonSubject(m.subject)}</div>
  <div class="realm-overview">
   <div class="realm-heading"><div><span>${m.tag}</span><h3>${m.name}</h3></div><button class="realm-info" onclick="openMenu('dungeonGuide','${key}')" aria-label="${m.name} 정보"><ui-mark data-shape=bang aria-hidden=true></ui-mark></button></div>
   <div class="realm-rewards"><small>주요 보상</small><b>${e.reward}</b></div>
  </div>
  <div class="realm-controls"><div class="realm-briefing">
   ${e.recommended?recommendedPowerHTML(e.recommended,e.recommendationNote):''}${difficulty}
   <div class="realm-admission"><div class="realm-entry-count">${art(e.icon)}<b>${e.status}</b></div><small class="realm-entry-hint">${e.hint}</small></div></div>
   <button class="realm-enter" data-feature="${featureForDungeon(key)}"${Number.isInteger(m.daily)?' data-guide="dungeon"':''} onclick="${e.fn}" ${e.disabled?'disabled':''}>${e.label}<span><ui-mark data-shape=chevron-right aria-hidden=true></ui-mark></span>${['mine','explore'].includes(key)?rewardDot(key):''}</button>
   ${key==='trial'?trialRankButton():''}
  </div></article>`;
}
function resetCountdown(kind='daily',now=Date.now()){const next=nextGameReset(kind,now),total=Math.max(0,Math.ceil((next-now)/1000)),days=Math.floor(total/86400),hours=Math.floor(total%86400/3600),mins=Math.floor(total%3600/60),sec=total%60;return (days?days+'일 ':'')+[hours,mins,sec].map(v=>String(v).padStart(2,'0')).join(':')}
function dungeonResetBanner(content=false){return `<div class="dungeon-reset-banner">${art('attendance')}<div><b>${content?'매일 00:00 도전 횟수 갱신':'매일 00:00 일일 입장권 충전'}</b>${content?'':'<small>콘텐츠별 3장 충전</small>'}</div><span><small>다음 초기화까지</small><strong data-reset-clock="daily">${resetCountdown()}</strong></span></div>`}
const priorDungeonList=dungeonScreen;
dungeonScreen=function(){if(screenTab==='challenges')return dungeonResetBanner()+dungeonBanner('rush',true)+`<div class="realm-section-title"><b>일일 던전</b><span>제한 30초</span></div>`+['gold','armory','library'].map(k=>dungeonBanner(k)).join('')+`<button class="realm-more" onclick="switchScreenTab('content')">오늘의 탑 · 광산 · 탐험 <span><ui-mark data-shape=chevron-right aria-hidden=true></ui-mark></span>${rewardDot('tab:content')}</button>`;if(screenTab==='content')return contentHub();return priorDungeonList()};
contentHub=function(){trialRankingUI.visit();return dungeonResetBanner(true)+['trial','mine','explore'].map(k=>dungeonBanner(k,k==='trial')).join('')};
function dungeonGuide(){const m=DUNGEON_BANNERS[tab],e=dungeonEntryState(tab);if(!m||!e)return '<p>던전을 선택해 주세요.</p>';let detail;
 if(tab==='trial')return trialEntryGuide(e);
 if(Number.isInteger(m.daily))detail=`30초 안에 처음 클리어하면 입장권을 유지하고 다음 단계가 열립니다. 이미 깬 단계에 재도전하거나 실패·포기하면 입장권 1장을 사용합니다. ${m.daily===1?'강화석은 슬롯·무기 강화에, 별철은 무기 강화에 씁니다.':''}`;
 else detail={rush:'입장 시 1장 소모. 일일 3장 소진 후 추가 입장권을 씁니다. 60초간 돌파한 보스 수로 보상을 받습니다.',mine:'60초간 자동 채굴하며, 누르면 채굴량이 늘어납니다. 일일 횟수 소진 후 추가 입장권을 씁니다.',explore:'최대 3곳 동시 파견. 지역별 요일·시간이 다르며 수령 후 다시 파견할 수 있습니다.'}[tab];
 return `<div class="dungeon-guide-art" style="--realm-scene:var(--${m.background||'region_'+m.region})">${dungeonSubject(m.subject)}</div><h3 class="dungeon-guide-title">${m.name}</h3><div class="effect-table"><div><span>현재 상태</span><b>${e.status}</b></div><div><span>주요 보상</span><b>${e.reward}</b></div></div>${e.recommended?recommendedPowerHTML(e.recommended,e.recommendationNote):''}<p class="dungeon-guide-copy">${m.sub}. ${detail}</p>${tab==='explore'?'':'<details class="balance-help"><summary><span class="guide-mark" aria-hidden="true"><ui-mark data-shape=bang aria-hidden=true></ui-mark></span> 입장권 획득처</summary><p>7일 출석 6일차 · 일반 상점 · 성운의 상점</p></details>'}<button class="gold-button profile-wide" data-feature="${featureForDungeon(tab)}"${Number.isInteger(m.daily)?' data-guide="dungeon"':''} onclick="${e.fn}" ${e.disabled?'disabled':''}>${e.label}</button>`;
}
function claimTrialFloor(floor){
 const row=TRIAL_FLOOR_PRIZES.find(([n])=>n===floor);
 if(!row||trialFloorPaid(floor)||trialPeakFloors()<floor)return false;
 if(saveGuard.usesServer())return claimServerReward('trialFloor',floor);
 try{economyClaimRule(s,{source:'trialFloor',id:floor},Math.random,Date.now())}catch(error){notice(error.message);return false}
 rewardNotice(row[1]);playSound('reward');save();paint();if(view)render();return true;
}
// The next three unpaid milestones. A reached one can be collected here.
function trialFloorPrizes(){
 const peak=trialPeakFloors(),rows=TRIAL_FLOOR_PRIZES.filter(([floor])=>!trialFloorPaid(floor));
 const head='<h4>누적 층 보상 <small>내 최고 '+peak+'층</small></h4>';
 if(!rows.length)return '<div class="trial-floors">'+head+'<p class="small">모든 층 보상을 받았습니다.</p></div>';
 return '<div class="trial-floors">'+head+rows.slice(0,3).map(([floor,reward])=>{
  const ready=peak>=floor;
  return '<div class="trial-floor-row'+(ready?' ready':'')+'"><b>'+floor+'층</b><span>'+passRewardText(reward)+'</span><button class="'+(ready?'gold-button':'muted-button')+'" onclick="claimTrialFloor('+floor+')" '+(ready?'':'disabled')+'>'+(ready?'받기':'미달성')+'</button></div>';
 }).join('')+'</div>';
}
function trialEntryGuide(entry){
 trialRankingUI.visit();
 const best=s.trial?.weekKey===entry.weekKey?s.trial.bestScore||0:0;
 return `<div class="trial-guide"><h3>오늘의 탑</h3>
  ${entry.weakness?`<div class="trial-element">${runeArt(entry.weakness)}<div><small>오늘의 약점</small><strong>${entry.element}</strong></div><b>각인 ${entry.rank}단계 · 피해 +${entry.rank*6}%</b></div>`:trialRankingUI.calendarStatus()}
  <div class="effect-table"><div><span>오늘 남은 도전</span><b>${entry.weakness?entry.status.replace('남은 도전 ','')+'회':'확인 중'}</b></div>
   <div><span>이번 주 최고 점수</span><b>${entry.weekKey?num(best)+'점':'확인 중'}</b></div>
   <div><span>매 판 보상</span><b>별철 ${TRIAL_RUN_REWARD.starIron} · 강화석 ${TRIAL_RUN_REWARD.stones}</b></div>
   <div><span>오늘 첫 판 추가 보상</span><b>다이아 ${TRIAL_FIRST_GEMS}</b></div></div>
  ${trialFloorPrizes()}
  <p class="dungeon-guide-copy">90초 동안 보스를 처치하세요. 입장 직후와 3층을 돌파할 때마다 강화 효과를 고릅니다. 선택 중에는 시간이 멈춥니다.</p>
  <div class="action-row">${trialRankButton()}<button class="gold-button" data-feature="trial" onclick="startDailyTrial()" ${entry.disabled?'disabled':''}>${entry.label}</button></div></div>`;
}
function trialChoiceIdentity(run){
 return [run.dayKey,run.attempt,run.n,run.selection].join('/');
}
const TRIAL_CARD_ART={
 attack:'stat-attack',crit:'stat-crit',critDamage:'stat-crit-damage',speed:'stat-speed',
 skillDamage:'storm',cooldown:'small-skills',time:'relic6',weakHp:'stat-hp'
};
function trialChoiceCard(key,index){
 const label=TRIAL_BUFFS[key].label,split=label.lastIndexOf(' ');
 const icon=key==='time'?art(TRIAL_CARD_ART[key]):catalogIcon(TRIAL_CARD_ART[key]);
 return `<button class="trial-option" data-buff="${key}" ${index===0?'id="trialBuffFirst"':''} type="button" onclick="chooseTrialBuff('${key}')">
  <span class="trial-card-art" aria-hidden="true">${icon}</span>
  <span class="trial-card-effect"><span>${label.slice(0,split)}</span> <strong>${label.slice(split+1)}</strong></span></button>`;
}
function trialChoicePopup(){
 const run=dungeonRun;
 if(run?.mode!=='trial'||!run.choosing)return '';
 return `<div class="trial-choices" data-trial-choice="${trialChoiceIdentity(run)}"><p class="trial-choice-status"><strong>${num(run.n)}층</strong><span>전투 일시정지 · 남은 시간 ${Math.ceil(run.time)}초</span></p>
  <div class="trial-options" role="group" aria-label="이번 판 강화 효과">${run.options.map(trialChoiceCard).join('')}</div>
  <button class="muted-button trial-forfeit" onclick="askDungeonExit()">도전 포기</button></div>`;
}
function trialResultPopup(r){
 const counts=new Map();for(const key of r.picks||[])if(Object.hasOwn(TRIAL_BUFFS,key))counts.set(key,(counts.get(key)||0)+1);
 const picks=[...counts].map(([key,n])=>'<li>'+TRIAL_BUFFS[key].label+(n>1?' <b>×'+n+'</b>':'')+'</li>').join('');
 return `<section class="trial-result"><div class="trial-result-heading">${art('tower')}<div><small>${r.abandoned?'도전 포기':'오늘의 탑'}</small><h3>${num(r.floors)}층 돌파</h3></div></div>
  <div class="effect-table"><div><span>${r.abandoned?'기록 점수':'이번 점수'}</span><b>${num(r.score)}점</b></div><div><span>이번 주 최고</span><b>${num(r.bestScore||0)}점</b></div></div>
  ${picks?'<h4>고른 효과</h4><ul class="trial-picked">'+picks+'</ul>':''}
  ${r.abandoned?'<p class="small">판 보상과 순위 기록을 받지 않았습니다.</p>':r.settling?'<p class="small" role="status">보상을 확인하고 있습니다.</p>':r.settlementFailed?'<p class="small" role="status">보상 지급을 확인하지 못했습니다.</p>':rewardsHTML(r.rewards||{})}
  <button class="gold-button profile-wide" onclick="navigate('dungeon','content')">던전으로</button></section>`;
}
EXTRA_POPUPS.trialChoice=['강화 효과 선택',trialChoicePopup];
EXTRA_POPUPS.dungeonGuide=['던전 안내',dungeonGuide];
function refreshRewardClocks(){if(document.hidden)return;trialRankingUI.tick();
 if(view==='havenShop'||activeScreen==='shop'){
  const passShop=document.querySelector('[data-pass-shop-day]');
  if(passShop?.dataset.passShopDay&&passShop.dataset.passShopDay!==onlineDay())paint();
 }
 refreshAttendance();paintOfflineReward();const before=s.day+'|'+s.weekly.key+'|'+s.season.cycle;resetDay();if(before!==s.day+'|'+s.weekly.key+'|'+s.season.cycle){save();paint()}document.querySelectorAll('[data-reset-clock]').forEach(el=>el.textContent=resetCountdown(el.dataset.resetClock));if(view==='pass'){const clock=document.querySelector('[data-season-countdown]');if(clock)clock.textContent='시즌종료 : '+seasonDaysLeft()+'일 남음'}if(activeScreen==='dungeon'&&['challenges','content'].includes(screenTab)){const signature=Object.keys(DUNGEON_BANNERS).map(k=>dungeonEntryState(k).status).join('|');if(signature!==dungeonListSignature){dungeonListSignature=signature;renderScreen()}}}
function initRewardsDungeons(){document.addEventListener('visibilitychange',refreshAttendance);setInterval(refreshRewardClocks,1000)}
