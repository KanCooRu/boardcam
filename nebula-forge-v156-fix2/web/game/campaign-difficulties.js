/* Four consecutive 300-stage difficulties. Absolute IDs keep unlocks and gear intact. */
'use strict';
const CAMPAIGN_DIFFICULTIES=[
 {name:'노말',en:'NORMAL',color:'#8ec8ee',end:1},
 {name:'하드',en:'HARD',color:'#dcadf3',end:2.2},
 {name:'엑스퍼트',en:'EXPERT',color:'#f1b46e',end:3.8},
 {name:'나이트메어',en:'NIGHTMARE',color:'#f48d9e',end:5.8}
];
const CAMPAIGN_LIMIT=1200,CAMPAIGN_NORMAL_BOSS_HP=260000000;
const CAMPAIGN_REGIONS=[0,1,2,3,4,5,6,7,8,9];
const CAMPAIGN_CREATURE_REGIONS=[0,1,2,3,4,5,6,7,8,9];
function campaignEconomyStage(stage=s.stage){return 1+(stage-1)/3}
function campaignPosition(stage=s.stage){const absolute=Math.floor(bounded(stage,1,CAMPAIGN_LIMIT)),tier=Math.floor((absolute-1)/300),local=(absolute-1)%300+1;return {absolute,tier,local,area:Math.floor((local-1)/30),...CAMPAIGN_DIFFICULTIES[tier]}}
function campaignKillsNeeded(stage=s.stage){return stage%10===0?1:9}
const V7_HP_ANCHORS=[[1,420],[10,6000],[20,60000],[30,400000],[40,1600000],[50,5800000],[60,15000000],[90,94500000],[100,135000000],[120,147000000],[150,163000000],[180,180000000],[210,198000000],[240,217000000],[270,238000000],[300,CAMPAIGN_NORMAL_BOSS_HP]];
const NORMAL_HP_ANCHORS=[
 [1,420],[10,6000],[20,60000],[30,375000],[40,1350000],[50,4100000],[60,10000000],
 [75,28900000],[90,61200000],[100,85000000],[120,114750000],[150,142800000],
 [180,168300000],[210,192950000],[240,216750000],[270,236300000],[300,CAMPAIGN_NORMAL_BOSS_HP]
];
function campaignHealthCurve(stage,anchors,ends){
 const p=campaignPosition(stage);
 let value;
 if(!p.tier){
  const hi=anchors.findIndex(a=>a[0]>=p.local),lo=anchors[Math.max(0,hi-1)],high=anchors[hi];
  value=lo[1]*Math.pow(high[1]/lo[1],lo===high?0:(p.local-lo[0])/(high[0]-lo[0]));
 }else{
  const start=CAMPAIGN_NORMAL_BOSS_HP*ends[p.tier-1]*1.08;
  value=start*Math.pow(CAMPAIGN_NORMAL_BOSS_HP*ends[p.tier]/start,(p.local-1)/299);
 }
 return value;
}
const CAMPAIGN_ENDS=CAMPAIGN_DIFFICULTIES.map(t=>t.end);
const MONSTER_DIFFICULTY=.9;
// Balance version 9: one table for all 1,200 stages. Stages 1-100 are unchanged. From
// there the table follows the growth a player gains from weapon enhancement, gear grades
// and anvil awakening, so each difficulty takes longer than the one before it.
const CAMPAIGN_HP_ANCHORS=[
 [1,420],[10,6000],[20,60000],[30,375000],[40,1350000],[50,4100000],[60,10000000],
 [75,28900000],[90,61200000],[100,85000000],[150,1.7e8],[200,3.4e8],[250,5.9e8],[300,1.0e9],
 [301,1.1e9],[400,4.5e9],[500,1.2e10],[600,3.6e10],
 [601,3.9e10],[750,7.5e10],[900,1.5e11],
 [901,1.62e11],[1050,2.7e11],[1200,4.2e11]
];
function campaignStageHealth(stage){
 const n=campaignPosition(stage).absolute,table=CAMPAIGN_HP_ANCHORS;
 const hi=table.findIndex(a=>a[0]>=n),lo=table[Math.max(0,hi-1)],high=table[hi];
 return lo[1]*Math.pow(high[1]/lo[1],lo===high?0:(n-lo[0])/(high[0]-lo[0]));
}
// Earlier balance versions pass their own anchors; the current game uses the table above.
function baselineMonsterHp(stage,anchors){
 const value=anchors?campaignHealthCurve(stage,anchors,CAMPAIGN_ENDS):campaignStageHealth(stage);
 // Keep the tutorial boss intact. Later bosses use the same combat-time
 // allowance at both speeds, so their health is calibrated to 30 combat seconds.
 const bossFactor=stage===10?1:stage===20?.73:.5;
 return Math.ceil(value*(stage%10===0?bossFactor:1/3));
}
function campaignV5Hp(stage,anchors){return Math.max(1,Math.ceil(baselineMonsterHp(stage,anchors)*MONSTER_DIFFICULTY))}
function campaignV6Hp(stage,anchors){return Math.max(1,Math.round(campaignV5Hp(stage,anchors)*.8))}
function campaignEnemyHp(stage,anchors){return Math.max(1,Math.round(campaignV6Hp(stage,anchors)*.9))}
const V12_NORMAL_HP=[[1,420],[10,6000],[20,60000],[30,400000],[40,1600000],[50,3000000],[60,5000000],[90,14000000],[120,30000000],[150,55000000],[180,85000000],[210,120000000],[240,160000000],[270,210000000],[300,CAMPAIGN_NORMAL_BOSS_HP]];
// Opening durability is tuned independently of damage, so adding a few hits
// to the first enemies does not also raise their outgoing damage.
const OPENING_ENEMY_ATTACK=[6,8,9,10,12,14,17,20,23];
function campaignEnemyAttack(stage){const absolute=campaignPosition(stage).absolute;const base=absolute<=9?OPENING_ENEMY_ATTACK[absolute-1]:Math.ceil(6*Math.pow(baselineMonsterHp(stage)/65,.44));return base*MONSTER_DIFFICULTY}
function normalizeCampaign(a){
 const old=a.campaignVersion!==2,oldStage=Math.max(a.stage||1,a.maxStage||1);
 a.legacyStageBest=Math.max(a.legacyStageBest||0,oldStage>1200?oldStage:0);
 a.stage=Math.floor(bounded(a.stage,1,1200));a.maxStage=Math.floor(bounded(a.maxStage,a.stage,1200));
 a.campaignCleared=Math.max(a.maxStage-1,Math.floor(bounded(a.campaignCleared??oldStage-1,0,1200)));
 delete a.bossRetryStage;
 const tour=a.nightmareTour||{};
 a.nightmareTour={rounds:Math.floor(bounded(tour.rounds,0,Number.MAX_SAFE_INTEGER)),step:Math.floor(bounded(tour.step,0,10)),day:validAttendanceDate(tour.day)?tour.day:''};
 a.stageKills=Math.floor(bounded(a.stageKills,0,campaignKillsNeeded(a.stage)-1));
 if(old){a.enemyHp=0;a.stageKills=0}a.campaignVersion=2;a.campaignBalanceVersion=9;a.campaignCompleted=a.campaignCleared===1200;return a;
}
// A save from balance version 8 keeps its records and unlocks. Its current stage moves back to
// the hardest stage whose monsters are no tougher than the ones it was fighting before.
function relocateForBalance9(a){
 const from=Math.floor(bounded(a.stage,1,CAMPAIGN_LIMIT));
 a.enemyHp=0;
 if(from<=100)return;
 const former=campaignEnemyHp(from-(from%10===0?1:0),NORMAL_HP_ANCHORS);
 let stage=from;
 while(stage>100&&campaignEnemyHp(stage-(stage%10===0?1:0))>former)stage--;
 if(stage===from)return;
 if(stage%10===0)stage--;
 a.stage=stage;a.stageKills=0;a.stageBossAttempt=null;a.balanceMoved={from,to:stage};
 if(a.tactics)a.tactics.encounter=null;
}
const beforeCampaignStarter=starter,beforeCampaignMigrate=migrate;
starter=function(){return normalizeCampaign(beforeCampaignStarter())};
migrate=function(data){
 const a=beforeCampaignMigrate(data),version=data?.campaignBalanceVersion;
 if([5,6,7].includes(version)&&data.enemyHp>0){
  const oldHp=({5:campaignV5Hp,6:campaignV6Hp,7:campaignEnemyHp})[version](a.stage,V7_HP_ANCHORS);
  a.enemyHp=Math.ceil(campaignEnemyHp(a.stage)*Math.min(1,data.enemyHp/oldHp));
 }else if([3,4].includes(version)&&a.stage%10===0&&data.enemyHp>0){
  const oldHp=version===4?baselineMonsterHp(a.stage,V7_HP_ANCHORS):Math.ceil(campaignHealthCurve(a.stage,V12_NORMAL_HP,[1,3,8,20]));
  a.enemyHp=Math.ceil(campaignEnemyHp(a.stage)*Math.min(1,data.enemyHp/oldHp));
 }else if(version===8){
  relocateForBalance9(a);
 }else if(version!==9)a.enemyHp=0;
 if(!data?.campaignVersion){a.campaignVersion=0;a.campaignCleared=Math.min(1200,Math.max(data?.stage||1,data?.maxStage||1)-1)}
 return normalizeCampaign(a);
};
stageText=function(stage=s.stage){const p=campaignPosition(stage);return p.name+' '+p.local};
currentRegion=function(){return CAMPAIGN_CREATURE_REGIONS[campaignPosition().area]};
function nightmareTourTarget(){
 return s.campaignCompleted&&s.nightmareTour.step<10?900+30*(s.nightmareTour.step+1):0;
}
function visitNightmareTour(){
 const stage=nightmareTourTarget();
 if(!stage||dungeonRun)return false;
 if(stage!==s.stage)travel(stage-s.stage);
 navigate('home');return true;
}
// The pilgrimage can be walked at any time; its prize is paid once a day.
const NIGHTMARE_TOUR_GEMS=200;
function nightmareTourPaidToday(){return s.nightmareTour.day===today()}
function claimNightmareTour(){
 const tour=s.nightmareTour;
 if(!s.campaignCompleted||tour.step!==10)return false;
 if(nightmareTourPaidToday()){notice('악몽 순례 보상은 하루에 한 번 받을 수 있습니다');return false}
 if(saveGuard.usesServer())return claimAccountReward('nightmare',tour.rounds+1);
 tour.step=0;tour.rounds++;tour.day=today();grant({gems:NIGHTMARE_TOUR_GEMS});save();paint();
 if(view==='quests')render();notice('악몽 순례 완료 · 다이아 +'+NIGHTMARE_TOUR_GEMS);return true;
}
function advanceCampaign(defeated){
 if(defeated===nightmareTourTarget())s.nightmareTour.step++;
 gainWeaponXp(defeated%10===0?5:1);
 trackOrderEvent('kills');if(defeated%10===0)trackOrderEvent('bosses');
 s.stageKills=(s.stageKills||0)+1;
 if(s.stageKills<campaignKillsNeeded(defeated))return false;
 s.stageKills=0;s.campaignCleared=Math.max(s.campaignCleared||0,defeated);
 if(defeated>=1200){if(!s.campaignCompleted){s.campaignCompleted=true;banner('나이트메어 300 · 전 난이도 정복')}return false}
 const next=defeated+1;
 if(next%10!==0||s.autoBoss)s.stage=next;
 s.maxStage=Math.max(s.maxStage,s.stage);
 if(defeated%300===0)banner(campaignPosition(next).name+' 난이도 개방');
 return s.stage!==defeated;
}
const beforeCampaignEncounter=encounterFor;
encounterFor=function(stage,run=null){if(run)return beforeCampaignEncounter(stage,run);const p=campaignPosition(stage),region=CAMPAIGN_REGIONS[p.area],boss=p.local%10===0,species=boss?3:(p.local-1)%3,b=BIOMES[region];return {region,boss,name:boss?b.boss:b.mobs[species].name,art:'creature_'+CAMPAIGN_CREATURE_REGIONS[p.area]+'_'+species,background:'region_'+region}};
MAIL_DEFINITIONS.push({id:'rebalance-157',title:'성장·스테이지 개편 보상',sender:'성운의 모루 운영 소식',date:'2026.11.25',body:'노말 100 이후의 몬스터 체력을 다시 맞추고, 하드 난이도부터 쓰는 모루 각성을 열었습니다. 최고 기록과 해금은 그대로이며, 더 강해진 구간에 있던 기사님은 현재 전투력에 맞는 스테이지로 옮겨 드렸습니다. 개편 보상을 받아 주세요.',rewards:{gems:1000,starIron:300,forgeGuards:1}});
GAME_NOTICES.unshift({id:'rebalance-157',date:'2026.11.25',tag:'밸런스',title:'성장·스테이지·보상 개편',body:'노말 100 이후 스테이지의 몬스터 체력을 성장 속도에 맞춰 다시 정했습니다. 노말 300을 클리어하면 모루에서 모루 각성이 열립니다. 별철은 고대 무기고·오늘의 탑·임무에서 주로 얻고, 장비 분해는 레전드 등급부터 별철을 줍니다. 월드보스 다이아와 탐험대 스킨 코인을 줄이고 시즌 패스·탑 누적 층 보상을 늘렸습니다. 방지권 없이 무기가 파괴되면 무기 잔해가 쌓이며 30개를 방지권 1장으로 바꿉니다.'});
let balanceMoveTold=false;
const beforeCampaignBattle=paintBattle;
paintBattle=function(){beforeCampaignBattle();
 if(s.balanceMoved&&!balanceMoveTold){
  balanceMoveTold=true;const moved=s.balanceMoved;delete s.balanceMoved;
  setTimeout(()=>notice('밸런스 개편 · '+stageText(moved.from)+'에서 '+stageText(moved.to)+'(으)로 이동했습니다. 최고 기록은 유지됩니다'),1200);
 }const p=campaignPosition();$('difficultyBadge').hidden=!!dungeonRun;if(dungeonRun)return;$('difficultyBadge').textContent=p.name+' · '+(p.tier+1)+'/4';$('difficultyBadge').style.setProperty('--difficulty-accent',p.color);$('stage').textContent='STAGE '+p.local+' / 300';$('region').textContent=BIOMES[p.area].name+' · '+(s.campaignCleared===1200&&s.stage===1200?'전 난이도 완료':p.local%10===0?'지역 보스':'사냥 '+s.stageKills+'/'+campaignKillsNeeded());};
const beforeCampaignTravel=travel;
travel=function(d){if(dungeonRun)return;const target=s.stage+d;if(target<1||target>Math.min(CAMPAIGN_LIMIT,s.maxStage))return;s.stageKills=0;beforeCampaignTravel(d)};
const beforeCampaignRetreat=retreatBoss;
retreatBoss=function(){s.stageKills=0;beforeCampaignRetreat()};
gmStage=function(target){if(!gmAllowed()||!Number.isInteger(target)||target<1||target>1200){notice('GM 활성화 후 스테이지 1~1200을 선택하세요');return false}s.stage=target;s.maxStage=Math.max(s.maxStage,target);s.campaignCleared=Math.max(s.campaignCleared,target-1);s.stageKills=0;resetTestCombat();save();navigate('home');paint();notice('테스트 이동 · '+stageText(target));return true};

let atlasDifficulty=0;
function selectAtlasDifficulty(i){if(!Number.isInteger(i)||!CAMPAIGN_DIFFICULTIES[i])return;atlasDifficulty=i;if(view==='worldMap')render();else renderScreen()}
function worldMapPopup(){return `<div class="atlas-intro"><h3>네 난이도 · 1,200 스테이지</h3><p>300스테이지를 깨면 성장 기록을 유지한 채 다음 난이도 1부터 시작합니다.</p></div><div class="campaign-difficulty-tabs">${CAMPAIGN_DIFFICULTIES.map((d,i)=>`<button class="${atlasDifficulty===i?'active':''}" onclick="selectAtlasDifficulty(${i})">${d.name}<small>${s.maxStage>=i*300+1?'개방':'미개방'}</small></button>`).join('')}</div><div class="world-grid">${CAMPAIGN_REGIONS.map((r,i)=>{const b=BIOMES[r],start=atlasDifficulty*300+i*30+1;return `<button class="world-card ${campaignPosition().tier===atlasDifficulty&&campaignPosition().area===i?'current':''}" style="--world-bg:var(--region_${r})" onclick="openMenu('regionDetail',${i})"><span class="world-number">${String(i+1).padStart(2,'0')}</span><div><small>STAGE ${i*30+1}–${i*30+30}</small><b>${b.name}</b><em>${s.maxStage>=start?'지역 정보 보기':'미탐험 · 미리보기'}</em></div></button>`}).join('')}</div><p class="small">최고 도달 ${stageText(s.maxStage)} · 누적 ${s.campaignCleared} / 1,200 클리어${s.legacyStageBest?' · 이전 최고 기록 '+num(s.legacyStageBest)+' 보존':''}</p>`}
function regionDetailPopup(){const i=+tab,r=CAMPAIGN_REGIONS[i],b=BIOMES[r];if(!b)return '<p>지역을 선택하세요.</p>';const target=atlasDifficulty*300+i*30+1;return `<div class="region-preview" style="background-image:var(--region_${r})"><span>${CAMPAIGN_DIFFICULTIES[atlasDifficulty].en} · STAGE ${i*30+1}–${i*30+30}</span><h3>${b.name}</h3><p>${b.sub}</p></div><p class="small">일반전은 3마리씩 3웨이브. 10스테이지마다 30초 보스전이 열립니다.</p><div class="bestiary-grid">${b.mobs.map((mob,j)=>`<div>${art('creature_'+CAMPAIGN_CREATURE_REGIONS[i]+'_'+j)}<b>${mob.name}</b><small>${FOE_ROLES[mob.kind][0]}</small></div>`).join('')}</div><div class="region-boss-preview">${art('creature_'+CAMPAIGN_CREATURE_REGIONS[i]+'_3')}<div><span>지역 보스</span><h3>${b.boss}</h3><small>${CAMPAIGN_DIFFICULTIES[atlasDifficulty].name} ${i*30+30}</small></div></div><div class="action-row">${button('지역으로 이동',`travelToRegion(${i})`,target>s.maxStage||!!dungeonRun)}${button('지역 목록','closeMenu()',false,true)}</div>`}
function travelToRegion(i){if(!Number.isInteger(i)||i<0||i>=10||dungeonRun)return false;const target=atlasDifficulty*300+i*30+1;if(target>s.maxStage)return false;s.stage=target;s.stageKills=0;s.enemyHp=maxHp();heroCurrentHp=health();battleElapsed=0;navigate('home');paint();save();return true}
EXTRA_POPUPS.worldMap=['지역 지도',worldMapPopup];EXTRA_POPUPS.regionDetail=['탐험 안내',regionDetailPopup];

const beforeCampaignOpenMenu=openMenu,beforeCampaignNavigation=navigate,beforeCampaignTab=switchScreenTab;
openMenu=function(kind,arg){if(kind==='worldMap')atlasDifficulty=campaignPosition().tier;return beforeCampaignOpenMenu(kind,arg)};
navigate=function(page,sub){if(page==='dungeon'&&sub==='regions')atlasDifficulty=campaignPosition().tier;return beforeCampaignNavigation(page,sub)};
switchScreenTab=function(t){if(activeScreen==='dungeon'&&t==='regions')atlasDifficulty=campaignPosition().tier;return beforeCampaignTab(t)};
