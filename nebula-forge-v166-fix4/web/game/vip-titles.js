/* Permanent VIP milestones and earned, selectable cosmetic titles. */
'use strict';
// Gifts for every level are set from VIP_GIFTS below.
VIP_LEVELS.push(
 {threshold:1000000,gift:{}},
 {threshold:1500000,gift:{}},
 {threshold:2000000,gift:{}},
 {threshold:3000000,gift:{}},
 {threshold:5000000,gift:{}},
 {threshold:7000000,gift:{}},
 {threshold:10000000,gift:{}}
);
// One gift per VIP level. About 20% (VIP 1) to 30% (VIP 16) of the diamonds bought in each step comes back as
// diamonds, and the materials never fall below the previous level's.
const VIP_GIFTS=[
 {gems:25,ore:11,stones:15},
 {gems:80,ore:22,stones:16,summonTickets:1},
 {gems:145,ore:33,stones:30,summonTickets:2},
 {gems:350,ore:55,stones:50,summonTickets:3},
 {gems:420,ore:77,stones:60,summonTickets:3,relicShards:33},
 {gems:880,ore:110,stones:120,summonTickets:5,petTickets:1,rouletteCoins:1,relicShards:33},
 {gems:2000,ore:185,stones:280,summonTickets:12,petTickets:2,rouletteCoins:5,relicShards:33},
 {gems:3100,ore:280,stones:420,summonTickets:19,petTickets:3,rouletteCoins:5,relicShards:33},
 {gems:3400,ore:308,stones:1200,summonTickets:19,petTickets:3,rouletteCoins:10,relicShards:33},
 {gems:10800,ore:720,stones:2500,summonTickets:55,petTickets:10,rouletteCoins:20,relicShards:95},
 {gems:11900,ore:750,stones:3000,summonTickets:55,petTickets:10,rouletteCoins:24,relicShards:95},
 {gems:13100,ore:900,stones:3600,summonTickets:55,petTickets:10,rouletteCoins:28,relicShards:100},
 {gems:23500,ore:1400,stones:5400,summonTickets:90,petTickets:20,rouletteCoins:40,relicShards:300,shards:600},
 {gems:48000,ore:2400,stones:9000,summonTickets:180,petTickets:40,rouletteCoins:65,relicShards:500,shards:2000},
 {gems:53000,ore:2800,stones:10500,summonTickets:180,petTickets:40,rouletteCoins:80,relicShards:600,shards:2400},
 {gems:75000,ore:4200,stones:15000,summonTickets:280,petTickets:65,rouletteCoins:120,relicShards:900,shards:3600,passCoins:300,gold:5000000}
];
VIP_GIFTS.forEach((gift,i)=>{VIP_LEVELS[i].gift=gift});
const VIP_TITLE_NAMES=['별빛의 후원자','은하의 동반자','성좌의 귀빈','천공의 귀족','별의 군주','은하의 황제','천공의 영원'];
const STAGE_TITLES=[
 [30,'초원의 개척자'],[60,'어둠숲의 등불'],[90,'황혼의 방랑자'],[120,'안개의 파수꾼'],
 [150,'불꽃을 넘은 자'],[180,'설원의 수호성'],[210,'잊힌 왕국의 기사'],[240,'공허의 정복자'],
 [270,'천공의 순례자'],[300,'별의 심연을 밝힌 자'],[600,'강철의 성좌'],[900,'지옥을 거닌 별'],[1200,'악몽의 끝']
];
const WHEEL_HONORS=[
 [10,'별의 수집가','blue'],[100,'유성을 건넌 자','violet'],[250,'오로라의 주인','astral']
];
function lifetimeEventDraws(){
 return Object.values(s.costumeEvents||{}).reduce((sum,event)=>sum+(Number(event?.rolls)||0),0);
}
const TITLE_DEFS=[
 ...WHEEL_HONORS.map(([goal,name,tone])=>({id:'wheel-honor-'+goal,kind:'roulette',milestone:true,goal,name,tone,condition:'시즌 합산 한정 룰렛 '+goal+'회 참여'})),
 ...ACHIEVEMENTS.map((a,i)=>({id:'achievement-'+i,name:a[1],kind:'achievement',goal:i,condition:a[1]+' 도전과제 보상 수령',tone:'silver'})),
 ...STAGE_TITLES.map(([goal,name])=>({id:'stage-'+goal,name,kind:'stage',goal,condition:stageText(goal)+' 클리어',tone:goal>=600?'astral':'blue'})),
 ...VIP_TITLE_NAMES.map((name,i)=>({id:'vip-'+(i+10),name,kind:'vip',goal:i+10,condition:'VIP '+(i+10)+' 승급 선물 수령 · 누적 '+num(VIP_LEVELS[i+9].threshold)+'원',tone:i>=4?'crown':'gold'})),
 {id:'trial-conqueror',name:'탑의 정복자',kind:'trial',condition:'오늘의 탑 주간 순위 1등 보상',tone:'crown'},
 {id:'roulette-fate',name:'운명의 별',kind:'roulette',condition:'스킨 룰렛의 칭호 슬롯 당첨',tone:'violet'}
];
let titleFilter='all';
function titleDefinition(id){return TITLE_DEFS.find(t=>t.id===id)}
function normalizeTitles(a){
 const owned=recordMap(a.titlesOwned);
 a.titlesOwned=Object.fromEntries(TITLE_DEFS.filter(t=>owned[t.id]===true).map(t=>[t.id,true]));
 ACHIEVEMENTS.forEach((_,i)=>{if(a.achievements?.[i])a.titlesOwned['achievement-'+i]=true});
 const old=TITLE_DEFS.find(t=>t.name===a.title&&a.titlesOwned[t.id]);
 a.titleId=titleDefinition(a.titleId)&&a.titlesOwned[a.titleId]?a.titleId:old?.id||'';
 if(a.titleId)a.title=titleDefinition(a.titleId).name;
 return a;
}
const honorsStarter=starter,honorsMigrate=migrate;
starter=function(){return normalizeTitles(honorsStarter())};
migrate=function(data){return normalizeTitles(honorsMigrate(data))};
function titleOwned(id,state=s){return state.titlesOwned?.[id]===true}
function titleEligible(t){
 if(!t)return false;
 if(t.milestone)return lifetimeEventDraws()>=t.goal;
 if(t.kind==='achievement')return !!s.achievements[t.goal];
 if(t.kind==='stage')return s.campaignCleared>=t.goal;
 if(t.kind==='vip')return vipSpend()>=VIP_LEVELS[t.goal-1].threshold&&!!s.vipRewards.gifts[t.goal];
 return false; // The roulette title is awarded only by its actual winning slot.
}
function awardTitle(id,equipFirst=false,state=s){
 const t=titleDefinition(id);if(!t||titleOwned(id,state))return false;
 state.titlesOwned[id]=true;
 if(equipFirst&&!state.titleId){state.titleId=id;state.title=t.name}
 return true;
}
function claimTitle(id){const t=titleDefinition(id);if(!t||!titleEligible(t)||!awardTitle(id,true))return false;save();paint();notice('새 칭호 획득 · '+t.name);return true}
function equipTitle(id){
 if(id!==''&&(!titleDefinition(id)||!titleOwned(id)))return false;
 s.titleId=id;s.title=id?titleDefinition(id).name:'';save();paint();return true;
}
const PREMIUM_TITLE_ART='./assets/42d2ea16ad6fce3c44e7.webp';
const VIP_TITLE_ART={14:'./assets/7139e78834659611b741.webp',15:'./assets/072216145feb12f7f04f.webp',16:'./assets/a64a698acd501f5c2dbf.webp'};
function titleFrameArt(t){return t?.id==='roulette-fate'?PREMIUM_TITLE_ART:t?.kind==='vip'?VIP_TITLE_ART[t.goal]||'':''}
function titleEmblem(extra=''){return `<span class="title-emblem ${extra}" aria-hidden="true"><img src="${PREMIUM_TITLE_ART}" alt=""></span>`}
function titleBadge(id,extra=''){
 const t=titleDefinition(id);if(!t)return '';
 const frame=titleFrameArt(t);
 if(frame)return `<span class="honor-badge honor-ornate honor-${t.tone} ${t.kind==='vip'?'honor-regal honor-vip-'+t.goal:'honor-fate'} ${extra}"><img class="honor-frame" src="${frame}" alt="" aria-hidden="true"><strong class="honor-name">${safeText(t.name)}</strong><i class="honor-glint glint-one" aria-hidden="true"></i><i class="honor-glint glint-two" aria-hidden="true"></i></span>`;
 return `<span class="honor-badge honor-${t.tone} ${extra}"><span aria-hidden="true"><ui-mark data-shape=spark aria-hidden=true></ui-mark></span> ${safeText(t.name)} <span aria-hidden="true"><ui-mark data-shape=spark aria-hidden=true></ui-mark></span></span>`;
}
function setTitleFilter(kind){if(!['all','achievement','stage','vip','roulette'].includes(kind))return;titleFilter=kind;render()}
function titlesUI(){
 const available=TITLE_DEFS.filter(t=>t.kind!=='achievement'||ACTIVE_ACHIEVEMENT_IDS.includes(t.goal)||titleOwned(t.id));
 const rows=available.filter(t=>titleFilter==='all'||t.kind===titleFilter).map((t,index)=>({...t,index,owned:titleOwned(t.id),ready:!titleOwned(t.id)&&titleEligible(t)})).sort((a,b)=>Number(b.ready)-Number(a.ready)||Number(b.owned)-Number(a.owned)||a.index-b.index);
 return `<div class="honor-current"><small>현재 장착 칭호</small>${s.titleId?titleBadge(s.titleId):'<b>칭호 미장착</b>'}<p>칭호는 외형만 바뀝니다.</p>${s.titleId?button('칭호 해제',"equipTitle('')",false,true):''}</div><div class="filter-chips honor-filters">${[['all','전체'],['achievement','도전과제'],['stage','스테이지'],['vip','VIP'],['roulette','룰렛']].map(([k,n])=>`<button class="${titleFilter===k?'active':''}" aria-pressed="${titleFilter===k}" onclick="setTitleFilter('${k}')">${n}</button>`).join('')}</div><div class="summary-strip">보유 칭호 <b>${Object.keys(s.titlesOwned).length} / ${available.length}</b></div><div class="honor-list">${rows.map(t=>`<article class="honor-card ${titleFrameArt(t)?'honor-card-premium':''} ${t.ready?'honor-ready':''}">${art(t.kind==='vip'?'vip':t.kind==='stage'?'tower':t.kind==='roulette'?'rouletteCoin':'quests')}<div>${titleBadge(t.id)}<small>${safeText(t.condition)}</small></div><button class="gold-button ${t.owned?'purple':''}" onclick="${t.owned?`equipTitle('${t.id}')`:`claimTitle('${t.id}')`}" ${s.titleId===t.id||!t.owned&&!t.ready?'disabled':''}>${s.titleId===t.id?'장착 중':t.owned?'장착':t.ready?'칭호 받기':'미해금'}</button></article>`).join('')}</div>`;
}
EXTRA_POPUPS.titles=['칭호',titlesUI];
claimAchievement=function(i){
 const a=ACHIEVEMENTS[i];if(!ACTIVE_ACHIEVEMENT_IDS.includes(i)||s.achievements[i]||achieveValue(a[0])<a[2])return false;
 if(saveGuard.usesServer())return claimAccountReward('achievement',i);
 s.achievements[i]=true;s.gems+=a[3];awardTitle('achievement-'+i,true);paint();save();notice('칭호 '+a[1]+' · 다이아 +'+a[3]);return true;
};
claimVipGift=function(i){
 const v=VIP_LEVELS[i-1];if(!Number.isInteger(i)||!v||!gmAllowed()||vipSpend()<v.threshold||s.vipRewards.gifts[i])return false;
 s.vipRewards.gifts[i]=true;grant(v.gift);if(i>=10)awardTitle('vip-'+i,true);save();paint();rewardNotice(v.gift,'VIP '+i+' 승급 선물'+(i>=10?' · 전용 칭호 획득':''));return true;
};
claimVip=claimVipGift;
vipUI=function(){
 const v=VIP_LEVELS[vipPreview-1],spent=vipSpend(),owned=vipLevel()>=vipPreview,claimed=!!s.vipRewards.gifts[vipPreview];
 return `<section class="vip-center-banner"><h3>별빛 혜택 센터</h3><p>등급마다 한 번, 새로운 모험의 선물</p></section><div class="vip-ribbon">누적 충전 VIP · 16등급</div><section class="vip-parchment"><div class="vip-rank-selector"><button onclick="setVipPreview(vipPreview-1)" aria-label="이전 VIP" ${vipPreview===1?'disabled':''}><ui-mark data-shape=chevron-left aria-hidden=true></ui-mark></button><div class="vip-medallion">${art('vip')}<b>${vipPreview}</b></div><div><h3>VIP ${vipPreview}</h3><span>누적 ${num(v.threshold)}원</span></div><button onclick="setVipPreview(vipPreview+1)" aria-label="다음 VIP" ${vipPreview===VIP_LEVELS.length?'disabled':''}><ui-mark data-shape=chevron-right aria-hidden=true></ui-mark></button></div><h4>승급 선물 ${Object.keys(v.gift).length}종 · 등급별 1회</h4>${vipRewardTiles(v.gift)}${vipPreview>=10?`<div class="vip-title-gift"><small>추가 칭호 · 선물 종류 수와 별도</small>${titleBadge('vip-'+vipPreview)}<small>꾸미기 전용 · 승급 선물과 함께 획득</small></div>`:''}<div class="vip-progress-copy"><span>현재 누적 금액</span><b>${num(spent)} / ${num(v.threshold)}원</b></div><div class="vip-progress" role="progressbar" aria-label="VIP 누적 충전 진행도" aria-valuemin="0" aria-valuemax="${v.threshold}" aria-valuenow="${Math.min(spent,v.threshold)}"><i style="width:${Math.min(100,spent/v.threshold*100)}%"></i></div>${button(claimed?'<ui-mark data-shape=check aria-hidden=true></ui-mark> 수령 완료':!gmAllowed()?'결제 연결 준비 중':owned?'승급 선물 받기':'등급 미달성',`claimVipGift(${vipPreview})`,!gmAllowed()||!owned||claimed)}</section><div class="vip-rules"><b>혜택 안내</b><p>VIP 1–16은 누적 충전으로 유지됩니다. 선물은 등급별 1회, 전용 칭호는 VIP 10(100만 원)부터 지급합니다.</p><p>전투 배속·자동 제작·자동 보스는 누구나 이용합니다. VIP 공격력·추가 입장권 혜택은 없습니다.</p><p>결제 연결 후 충전과 유료 혜택이 열립니다.</p></div>${button('칭호 목록',"openMenu('titles')",false,true)}`;
};
const honorsRewardReady=rewardReady;
rewardReady=function(key){if(key==='titles')return TITLE_DEFS.some(t=>!titleOwned(t.id)&&titleEligible(t));return honorsRewardReady(key)};
function profileTitleControl(){return `<button class="profile-title-button" onclick="openMenu('titles')" aria-label="칭호 관리 · ${safeText(titleDefinition(s.titleId)?.name||'미장착')}"><ui-mark data-shape=spark aria-hidden=true></ui-mark> 칭호 관리 <span aria-hidden="true"><ui-mark data-shape=chevron-right aria-hidden=true></ui-mark></span>${rewardDot('titles')}</button>`}
const honorsMore=morePopup;
morePopup=function(){return `<button class="gold-button purple profile-wide" onclick="openMenu('titles')">칭호 · 도전과제와 모험의 기록${rewardDot('titles')}</button>`+honorsMore()};
const honorsPaint=paint;
paint=function(){honorsPaint();const el=$('heroTitle');if(el){const html=s.titleId?titleBadge(s.titleId):'';if(el.innerHTML!==html)el.innerHTML=html;el.hidden=!html}};
