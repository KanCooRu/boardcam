'use strict';

function progressGauge(label, value, goal) {
 const filled = Math.min(goal, Math.max(0, Number(value) || 0));
 return `<div class="mission-gauge" role="progressbar" aria-label="${safeText(label)}" aria-valuemin="0" aria-valuemax="${goal}" aria-valuenow="${filled}"><i style="width:${100*filled/goal}%"></i><b>${num(filled)} / ${num(goal)}</b></div>`;
}

function objectiveRow({title, icon, value, goal, reward='', action, done=false, claim='', locked=false}) {
 const ready = value >= goal;
 const handler = ready ? claim : action;
 const disabled = done || !handler || locked;
 const label = done ? '수령 완료' : locked ? '한도 달성' : ready ? (claim ? '받기' : '완료') : '이동';
 return `<article class="objective ${done?'is-claimed':ready&&!locked?'is-ready':''}">
  ${art(icon,'objective-icon')}<div class="objective-body"><strong>${safeText(title)}</strong>
  ${progressGauge(title,value,goal)}${reward?`<small>${safeText(reward)}</small>`:''}</div>
  <button class="${ready&&!disabled?'gold-button':'muted-button'}" ${disabled?'disabled':`onclick="${handler}"`}>${label}</button></article>`;
}

missionList=adventureMissionList;
dailyClaim=key=>claimAdventure('daily',key);
weeklyClaim=key=>claimAdventure('weekly',key);

mainQuestPopup=function(){
 const q=Q[s.quest];
 if(!q)return '<p class="empty-state">모든 성장 임무를 완료했습니다.</p>';
 const [value,goal]=questProgress(s.quest),reward=growthQuestReward(s.quest);
 return `<div class="objective-heading"><h3>성장 임무</h3><span>${s.quest+1} / ${Q.length}</span></div>`+
 objectiveRow({title:q[0],icon:RESOURCE_ART[Object.keys(reward)[0]],value,goal,reward:orderRewardText(reward),claim:'claimQuest('+s.quest+')',action:'questDestination()'});
};

const achievementGoals={kills:['몬스터 처치','equipment',"navigate('home')"],cleared:['누적 스테이지 클리어','quests',"navigate('home')"],stage:['최고 스테이지','quests',"navigate('home')"],
 craft:['장비 제작','forgeIcon',"navigate('forge','craft')"],collection:['장비 도감 수집','collection',"navigate('character','collection')"],
 plus:['장비 강화 단계','equipment',"navigate('character','equipment')"]};
achievementsPopup=function(){
 const rows=ACTIVE_ACHIEVEMENT_IDS.map(i=>{
  const [type,title,goal,gems]=ACHIEVEMENTS[i];
  const [task,icon,action]=achievementGoals[type];
  return {title:task,icon,action,goal,value:achieveValue(type),reward:title+' 칭호 · 다이아 '+num(gems),done:!!s.achievements[i],claim:`claimAchievement(${i})`};
 });
 rows.sort((a,b)=>missionPriority(a.value,a.goal,a.done)-missionPriority(b.value,b.goal,b.done));
 const tour=s.nightmareTour,target=nightmareTourTarget();
 const circuit=s.campaignCompleted?objectiveRow({
  title:'악몽 순례 '+num(tour.rounds+1)+'회차',icon:'worldBossGate',value:tour.step,goal:10,
  reward:(target?stageText(target)+' 지역 보스 · ':'')+'다이아 '+NIGHTMARE_TOUR_GEMS+(nightmareTourPaidToday()?' · 오늘 수령 완료':' · 하루 1회'),claim:'claimNightmareTour()',action:'visitNightmareTour()'
 }):'';
 return circuit+rows.map(objectiveRow).join('');
};

function showMissionTab(key){
 missionTab=key;render();$('content').scrollTop=0;
}
function openMissions(key='daily'){missionTab=key;openMenu('quests')}
questsPopup=function(){
 const panes=[['daily','일일'],['weekly','주간'],['main','성장'],['achievements','업적']];
 const links=missionTab==='achievements'?button('칭호',"openMenu('titles')",false,true):'';
 return `<nav class="mission-tabs" aria-label="임무 종류">${panes.map(([id,name])=>`<button aria-pressed="${missionTab===id}" onclick="showMissionTab('${id}')">${name}${rewardDot('quests:'+id)}</button>`).join('')}</nav>`+
 (missionTab==='main'?mainQuestPopup():missionTab==='achievements'?achievementsPopup():missionList(missionTab))+
 (links?'<div class="mission-links">'+links+'</div>':'');
};
EXTRA_POPUPS.quests=['임무',questsPopup];

const guildOrders=[
 ['수비대 웨이브 돌파','guildHall','waves',50],
 ['아레나 대련','arenaHall','arena',4],
 ['월드보스 도전','worldBossGate','worldBoss',3],
 ['광역기로 세 적 동시 타격','skills','volley',35],
 ['재료 던전 클리어','dungeon','dungeon',5]
];
const guildTargets=Object.fromEntries(guildOrders.map(([, ,key,goal])=>[key,goal]));
function guildOrderValue(o,key){
 const d=o.daily;
 if(key==='worldBoss')return d.raid;
 return bounded(d[key]);
}
function guildOrderRows(o){
 return guildOrders.map(([title,icon,key,goal])=>{
  const value=guildOrderValue(o,key);
  return {title,icon,key,value,goal,ready:value>=goal};
 });
}
function guildOrdersDone(o){
 const count=guildOrderRows(o).filter(row=>row.ready).length;
 return o.daily.legacyGuildReady?Math.max(3,count):count;
}
function recordGuildOrder(key,n){
 if(!s.onlineTest?.guild||!['waves','volley','dungeon'].includes(key))return;
 const d=onlineState().daily;d[key]=Math.min(guildTargets[key],bounded(d[key])+n);
}
function guildOrderAction(key){
 if(key==='guild')return "setGuildSection('overview')";
 if(key==='arena'||key==='worldBoss')return "onlineSelect('"+(key==='arena'?'arena':'raid')+"')";
 return "playerMissionGo('"+orderMetrics[key][1]+"')";
}
function guildWeekActivity(g){return g.activityWeek===weekKey()?Math.floor(bounded(g.weeklyActivity)):0}

function guildRosterUI(o){
 const members=guildMembers(o).sort((a,b)=>Number(!!b.self)-Number(!!a.self));
 return `<div class="guild-roll"><div class="roll-head"><span>이름</span><span>주간 기여</span><span>직위</span></div>
 ${members.length?'':communityRecords.message('roster','등록된 길드원이 없습니다.')}${members.map(m=>`<button class="roll-member" onclick="openMenu('guildMember','${m.id}')"><span>${guildAvatar(m)}<b>${safeText(m.name)}<small>${m.self?'나':(m.level?'Lv.'+num(m.level):'')}</small></b></span><strong>${m.self?num(guildWeekActivity(guildProfile(o))):'—'}</strong><span>${GUILD_ROLES[m.role]}</span></button>`).join('')}</div>`;
};
function guildMissionsUI(o){
 const completed=guildOrdersDone(o),claimed=o.daily.mission;
 return `<div class="objective-heading"><h3>길드 임무 3개 달성</h3><span>매일 9시 · 한국</span></div>
 <div class="guild-bounty">${progressGauge('길드 임무 달성',completed,3)}<div><span>길드 코인 20 · 성운석 20 · 강화석 20</span>${button(claimed?'수령 완료':'보상 받기',"onlineAct('mission')",claimed||completed<3)}</div></div>
 ${o.daily.legacyGuildReady&&!claimed?'<p>이전 임무 달성 보상을 받을 수 있습니다.</p>':''}${guildOrderRows(o).map(row=>renderOrder(row,'',guildOrderAction)).join('')}`;
};
function setGuildSection(key){
 if(!['overview','missions','members'].includes(key))return;
 guildSection=key;render();$('content').scrollTop=0;
};
onlineGuildUI=function(o){
 if(!o.guild)return `<div class="guild-join"><div class="guild-sign">${art('guildHall')}<div><h3>별빛 기사단</h3><span>공개 길드</span></div></div>
 ${button('가입하기',"changeChatGuild('join','별빛 기사단')")}
 <label for="guildName">길드 이름</label><div><input id="guildName" data-live-input="true" maxlength="12" autocomplete="off" placeholder="길드 이름 (1~12자)" value="${safeText(onlineGuildDraft)}" oninput="onlineGuildDraft=this.value">${button('가입',"changeChatGuild('join',$('guildName').value)")}${button('창설',"changeChatGuild('create',$('guildName').value)",false,true)}</div></div>`;
 const g=guildProfile(o),growth=guildGrowth(g.xp),count=guildMembers(o).length;
 const sections=[['overview','정보'],['members','길드원'],['missions','임무']];
 const nav=`<nav class="mission-tabs" aria-label="길드 메뉴">${sections.map(([id,n])=>`<button aria-pressed="${guildSection===id}" onclick="setGuildSection('${id}')">${n}${id==='missions'&&!o.daily.mission&&guildOrdersDone(o)>=3?'<i class="claim-dot" aria-label="보상 수령 가능"></i>':''}</button>`).join('')}</nav>`;
 if(guildSection==='members')return nav+guildRosterUI(o);
 if(guildSection==='missions')return nav+guildMissionsUI(o);
 return nav+`<div class="guild-sign">${art('guildHall')}<div><h3>${safeText(o.guild)}</h3><span>Lv.${growth.level} · ${count||'—'}/30명 · ${GUILD_ROLES[g.role]}</span></div></div>
 <div class="guild-level"><b>길드 경험치</b>${growth.need?progressGauge('길드 경험치',growth.progress,growth.need):'<strong>최고 레벨</strong>'}</div>
 <section class="notice-slip"><div><b>길드 공지</b>${g.role==='leader'?button('수정','openGuildNotice()',false,true):''}</div><p>${safeText(communityRecords.guildNotice(o.guild))}</p></section>
 <section class="guild-giving"><div><strong>길드 기부</strong><small>500골드 → 길드 코인 20</small></div>${button(o.daily.donated?'기부 완료':s.gold<500?'골드 부족':'기부',"onlineAct('donate')",o.daily.donated||s.gold<500)}</section>
 <div class="guild-foot"><span>보유 코인 <b>${num(o.guildCoins)}</b></span><button onclick="openMenu('guildLeave')">길드 탈퇴</button></div>`;
};
const nonGuildOnline=onlinePopup;
onlinePopup=function(){
 if(tab==='arena'||tab==='raid')return nonGuildOnline();
 const back=popupStack.some(p=>p.view==='havenShop')?'<button class="haven-return" onclick="returnToHavenShop()"><ui-mark data-shape=chevron-left aria-hidden=true></ui-mark> 성운의 상점</button>':'';
 return back+onlineGuildUI(OnlineService.snapshot());
};
EXTRA_POPUPS.online=[()=>({arena:'아레나',raid:'월드보스'}[tab]||'길드'),onlinePopup];

GAME_NOTICES.unshift({id:'guild-missions-menu-v18',date:'2026.11.10',tag:'모험',title:'길드와 임무 개편',body:'길드 임무 다섯 가지 중 세 가지를 달성하면 보상을 받습니다. 모험 화면의 임무에서 일일 목표와 선택 임무의 진행도를 확인하세요. 랭킹은 전체 메뉴에서 열 수 있습니다.'});

GAME_NOTICES.unshift({id:'adventure-orders-v19',date:'2026.11.11',tag:'모험',title:'모험 의뢰와 활약도 보상',body:'일일·주간 의뢰를 한 줄씩 확인하세요. 활약도 100 보상은 일일 의뢰 5개, 주간 의뢰 10개를 수령하면 열립니다. 시즌 임무와 시즌 포인트는 시즌패스에서 확인하세요.'});
