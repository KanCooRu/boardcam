/* Combat, timed solo content and earned rewards. No simulated online users or paid receipts. */
'use strict';
const EXPEDITIONS=[['심산의 길',8,[1,3,5,0],'explore'],['모래 유적',16,[2,4,6,0],'explore'],['설산 봉우리',24,[0,1,2,3,4,5,6],'explore']];
const PETS=COMPANIONS.map(p=>p[0]);
const DUNGEON_NAMES=['황금 광산','고대 무기고','마법 도서관'];
const ACHIEVEMENTS=[['kills','첫 사냥',10,50],['kills','숲의 추적자',100,100],['kills','천의 발자취',1000,300],['stage','길을 여는 자',10,100],['stage','경계의 기사',50,300],['stage','별을 넘은 자',100,500],['craft','대장장이',100,100],['craft','천공의 장인',1000,500],['collection','수집가',20,200],['plus','극한의 연마',15,500],['tower','탑의 도전자',10,200],
 ['cleared','어둠길의 길잡이',150,500],['cleared','노말의 수호자',300,700],
 ['cleared','하드의 선봉',450,800],['cleared','하드의 정복자',600,900],
 ['cleared','심연의 등불',750,1000],['cleared','엑스퍼트의 증인',900,1100],
 ['cleared','악몽의 길잡이',1050,1200],['cleared','성운의 개척자',1200,1500],
 ['kills','별길의 사냥꾼',10000,400],['kills','십만 별의 추적자',100000,800],
 ['kills','백만 별의 파수꾼',1000000,1500],['craft','모루의 달인',10000,700],
 ['tower','구름을 넘긴 자',50,500],['tower','천공의 문지기',100,700],
 ['tower','별탑의 수호자',200,1000],['tower','별 너머의 파수꾼',500,1500]
];
// Saved achievement receipts and titles use the original catalogue indices.
const ACTIVE_ACHIEVEMENT_IDS=ACHIEVEMENTS.flatMap(([type],id)=>type==='tower'?[]:[id]);
const DAILY_GOALS=[['kills','몬스터 처치',100],['crafted','장비 제작',10],['dungeons','던전 클리어',1],['upgrades','능력·스킬·장비 강화',20]];
const WEEKLY_GOALS=[['bosses','보스 처치',10],['crafted','성운석 소모',300]];
let challengeResult=null,dungeonAdmissionPending=false,mineLastTick=0,hitLastAt=0;
maxHp=function(){return campaignEnemyHp(s.stage)};
function materialGuardianAttack(hp){
 const shoulder=materialDungeonHp(1)*1.5;
 const weight=hp<=shoulder?hp:shoulder*Math.pow(hp/shoulder,.72);
 return MONSTER_DIFFICULTY*Math.max(2,Math.ceil(weight*.005/MONSTER_DIFFICULTY));
}
function bossAttackFromHealth(hp){return MONSTER_DIFFICULTY*Math.max(2,Math.ceil(hp*.005/MONSTER_DIFFICULTY))}
function enemyAttack(){if(dungeonRun?.mode==='daily')return materialGuardianAttack(dungeonRun.maxHp);return dungeonRun?bossAttackFromHealth(dungeonRun.maxHp):campaignEnemyAttack(s.stage)}
function regionFilter(){return ['saturate(.9) hue-rotate(25deg)','none','sepia(.45) saturate(.8)','hue-rotate(50deg) saturate(.6)','sepia(.6) hue-rotate(310deg) saturate(1.8)','hue-rotate(350deg) saturate(.45) brightness(1.2)','saturate(.5)','hue-rotate(50deg) saturate(1.4) brightness(.8)'][currentRegion()]||'none'}
paintBattle=function(){const run=dungeonRun,hp=run?run.hp:s.enemyHp,mx=run?run.maxHp:maxHp();if(!run){$('stage').textContent='STAGE '+stageText();$('region').textContent=REG[currentRegion()]+' · '+REGION_SETS[currentRegion()]}$('enemy').textContent=encounterFor(s.stage,run).name;$('enemybar').style.width=Math.max(0,Math.min(100,hp/mx*100))+'%';$('enemytext').textContent=compact(Math.max(0,hp))+' / '+compact(mx);$('mobActor').classList.toggle('boss-form',s.stage%10===0||!!run);const routeKey=String(s.stage);if($('route').dataset.stage!==routeKey){$('route').dataset.stage=routeKey;$('route').innerHTML=Array.from({length:10},(_,i)=>`<span class="${i<((s.stage-1)%10)+1?'filled':''} ${i===9?'boss-dot':''}" title="${i+1}${i===9?' · 보스':''}">${i===9?'<ui-mark data-shape=boss aria-hidden=true></ui-mark>':''}</span>`).join('');}paintWorld();paintHeroHealth();};
function paintHeroHealth(){
 const own=$('heroHealth'),fill=$('heroHealthFill'),label=$('heroHealthText');if(!own||!fill||!label)return;
 const maximum=Math.max(1,health()),current=Math.max(0,Math.min(maximum,Number(heroCurrentHp)||0));
 fill.style.width=(current/maximum*100)+'%';const text='HP '+compact(current);if(label.textContent!==text)label.textContent=text;
 own.setAttribute('aria-valuemin','0');own.setAttribute('aria-valuemax',String(maximum));own.setAttribute('aria-valuenow',String(Math.round(current)));
}
paintSkillButtons=function(){$('skillbuttons').innerHTML=s.slots.map((k,i)=>`<button class="${!slotOpen(i)||k<0?'locked':''}" onclick="cast(${i})" aria-label="${!slotOpen(i)?'STAGE '+(i===2?10:30)+' 해금':k<0?'스킬 장착':SK[k][0]}">${art(!slotOpen(i)?'lock':k<0?'skills':'s'+k)}<small id="cool${i}" style="display:${cooldowns[i]>0?'grid':'none'}">${Math.ceil(cooldowns[i])}</small>${!slotOpen(i)?'<b class="skill-lock">'+(i===2?'10':'30')+'</b>':''}<em>${i+1}</em></button>`).join('')};
hit=function(){if(!s)return;const now=Date.now();if(now-hitLastAt<100)return;hitLastAt=now;visualStrike();const crit=Math.random()<criticalChance(),d=Math.floor(power()*(.9+Math.random()*.2)*(crit?criticalDamageMultiplier():1));applyDamage(d,crit);paintBattle()};
cast=function(i,automatic=false){const k=s.slots[i];if(!slotOpen(i)){if(!automatic)notice('STAGE '+(i===2?10:30)+'에서 해금됩니다');return}if(k<0){if(!automatic)navigate('skills');return}if(cooldowns[i]>0){if(!automatic)notice('재사용 대기 '+Math.ceil(cooldowns[i])+'초');return}const r=SKILL_RULES[k];cooldowns[i]=r.cd;visualStrike();skillVisual(k);const d=skillDamage(k);applyDamage(d,true);for(let j=1;j<r.hits;j++)setTimeout(()=>damageText(Math.floor(d/r.hits),false,j%3),j*100);if(k===8)battleSlowUntil=Date.now()+4000;if(k===10)heroCurrentHp=Math.min(health(),heroCurrentHp+health()*.15);if(!automatic)banner(SK[k][0]);paintBattle();paintCooldowns()};
applyDamage=function(d,crit=false){if(trialCombatPaused())return false;d=Math.max(0,Number(d)||0);damageText(d,crit);if(dungeonRun){const run=dungeonRun;run.hp-=d;run.damage=(run.damage||0)+d;if(run.hp<=0){enemySound.play(enemySound.forEncounter(encounterFor(s.stage,run)),'death',true);if(run.mode==='trial')nextTrialFloor(run);else if(run.mode==='rush'){run.bosses++;run.maxHp=Math.ceil(run.maxHp*1.35);run.hp=run.maxHp;heroCurrentHp=Math.min(health(),heroCurrentHp+health()*.15);banner('BOSS '+run.bosses+' CLEAR')}else finishDungeon(true)}return}s.enemyHp-=d;if(s.enemyHp>0)return;const defeat=duoTransaction?null:captureCampaignDefeat();if(!duoTransaction&&stageBossActive())enemySound.play(enemySound.forEncounter(encounterFor(s.stage,null)),'death',true);const defeated=s.stage,oreBefore=s.ore,stack=campaignMaterialStack(defeated);
 s.kills++;s.daily.kills=(s.daily.kills||0)+1;
 grantAdventureGold(campaignKillGoldBase(defeated));gainXP(4+Math.floor(campaignEconomyStage(defeated)/4));
 const weekend=[0,6].includes(new Date().getDay());
 if(Math.random()<Math.min(.9,.45*(1+s.legacyGrowth[2]*.05)))s.ore+=stack*(weekend?2:1);
 if(defeated%10===0){
  s.ore+=5+2*(stack-1)+Math.floor(Math.random()*6);
  s.relicShards+=stack+Math.floor(Math.random()*3);s.shards+=2*stack;
  s.bossKills=(s.bossKills||0)+1;s.weekly.bosses=(s.weekly.bosses||0)+1;banner('BOSS CLEAR');playSound('victory');
 }
 if(s.ore>oreBefore)trackOrderEvent('fieldOre',s.ore-oreBefore);
 advanceCampaign(defeated);if(defeated%5===0)s.stones+=2*stack;
 s.enemyHp=maxHp();heroCurrentHp=health();battleElapsed=0;s.battleCount=(s.battleCount||0)+1;if(s.battleCount%10===0)recordPower();paint();save();if(defeat)showDefeatFeedback(defeat)};
// Only active campaign kills use this stage premium. Replays pay for the defeated stage.
function campaignMaterialStack(stage){
 return stage<25?1:2+Math.floor(Math.log2(stage/25));
}
function campaignKillGoldBase(stage){
 const base=goldGain(stage),ordinary=base+Math.round(base/9);
 const stageFactor=1+.4*Math.log2(1+(stage-1)/16);
 const monsterGold=2*Math.round(ordinary*stageFactor);
 return stage%10===0?2*monsterGold:monsterGold;
}
function adventureGoldHalves(base){return 3*base+(s.adventureGoldHalf===1?1:0)}
function campaignKillGold(stage=s.stage){return Math.floor(adventureGoldHalves(campaignKillGoldBase(stage))/2)}
// Carry the half gold across kills so the +50% bonus is exact even on small drops.
function grantAdventureGold(base){
 const halves=adventureGoldHalves(base);
 s.gold+=Math.floor(halves/2);s.adventureGoldHalf=halves%2;
}
const MATERIAL_HP_STEPS=[1,1.72,2.92,4.92,8.16,12.75,17.50,23.10,29.40,36.50];
function materialTier(value){
 const n=Math.floor(Number(value));return Number.isSafeInteger(n)&&n>0?n:1;
}
function materialDungeonHp(value){
 const tier=materialTier(value),extra=tier-MATERIAL_HP_STEPS.length;
 const weight=extra<=0?MATERIAL_HP_STEPS[tier-1]:36.5+7.1*extra+.35*extra*(extra+1);
 return Math.round(8640*MONSTER_DIFFICULTY*weight);
}
// Simulate a 30-second rotation at normal speed; the displayed reference assumes ready skills.
function dungeonDamagePerPower(enemyHp){
 const end=300,enemyInterval=25;
 const strength=Math.max(1,power()),speed=attackSpeed(),crit=1+criticalChance()*(criticalDamageMultiplier()-1);
 const interval=Math.ceil(11.5/speed),maxHealth=health(),pierce=penetrationMultiplier(.15);
 const incoming=materialGuardianAttack(enemyHp)*.6*weaponModifier('frost');
 const slots=s.slots.flatMap((k,i)=>slotOpen(i)&&k>=0&&s.skills[k]&&skillUnlocked(k)?[{
  k,rule:SKILL_RULES[k],meta:skillMeta(k),ratio:skillDamage(k)/strength,ready:0
 }]:[]);
 const basic=crit*weaponModifier('storm'),dots={};
 let hp=maxHealth,damage=0,next=interval,retaliate=25,boost=0,broken=0,guard=0,weaken=0;
 for(let t=1;t<end;t++){
  if(t>=retaliate){
   hp-=incoming*(t<guard?.55:1)*(t<weaken?.65:1);
   if(hp<=0)break;
   retaliate=t+enemyInterval;
  }
  for(const dot of Object.values(dots))if(t===dot.next&&t<=dot.end){damage+=dot.ratio;dot.next+=10}
  if(t<next||t+3>=end)continue;
  const skill=slots.find(slot=>slot.ready<=t&&!(slot.meta.status==='heal'&&slot.meta.target!=='all'&&hp>.75*maxHealth));
  const factor=(t<boost?1.5:1)*(t<broken?1.25:pierce);
  next=t+interval;
  if(!skill){damage+=basic*factor;continue}
  const {k,rule,meta,ratio}=skill;
  skill.ready=t+rule.cd*10;
  next=Math.max(next,t+Math.ceil(Math.max(680,270+rule.hits*70)/100));
  if(meta.target!=='self')damage+=ratio*meta.factor*crit*factor;
  switch(meta.status){
   case 'heal':hp=Math.min(maxHealth,hp+maxHealth*(k===31?.25:k===28?.12:k===22?.18:.15));break;
   case 'guard':guard=t+60;break;
   case 'boost':boost=t+(k===9?40:60);break;
   case 'break':broken=t+60;break;
   case 'weaken':weaken=t+40;break;
   case 'stun':retaliate=Math.max(retaliate,t+12);break;
   case 'burn':case 'poison':dots[meta.status]={next:t+10,end:t+41,ratio:(meta.target==='all'?.65:.8)*(1+(s.skills[k]-1)*.15)*pierce};break;
  }
 }
 return Math.max(1,damage);
}
function recommendedPower(n){const hp=materialDungeonHp(n);return Math.ceil(hp/dungeonDamagePerPower(hp))}
function rushRecommendedPower(){return dungeonRun?.mode==='rush'&&Number.isFinite(dungeonRun.startPower)?dungeonRun.startPower:power()}
function recommendedPowerHTML(requiredAttack,note=''){
 const factors=combatPowerFactors(),current=combatPower(power(),factors),required=combatPower(requiredAttack,factors);
 return `<div class="recommended-power ${Math.round(current)>=Math.round(required)?'power-ready':'power-low'}"><span>추천 전투력</span><strong>${ratingText(required)}</strong><small>현재 ${ratingText(current)}</small>${note?`<em class="recommendation-note">${note}</em>`:''}</div>`;
}
function continueTower(){return false}
function dailyDungeonGold(n){
 const base=Math.max(500*n*n,offlineGains(600+120*n).gold);
 return Math.floor(base/10);
}
function materialDungeonLoot(i,n){
 if(i===0)return {gold:dailyDungeonGold(n)};
 if(i===1){
  // The armory is the main source of star iron. Its prizes follow their own tier curve.
  const stacks=n<=10?3+Math.floor((n-1)/3):6+Math.ceil(Math.log2(n/10));
  const grade=Math.min(10,2+Math.floor(n/2));
  return {
   stones:stacks*(grade+1)*5,
   starIron:stacks*2*(1+Math.floor(grade/3))
  };
 }
 return {shards:20+Math.floor((n-1)*40/9)};
}
function materialLootLabel(i,n){
 return Object.entries(materialDungeonLoot(i,n)).map(([key,count])=>RESOURCE_NAMES[key]+' '+num(count)).join(' · ');
}
function materialEntryLabel(i,n,label){
 return n<s.dungeonLevel[i]?label+' · 입장권 1장 사용':label;
}
function selectDifficulty(i,d){s.dungeonSelected[i]=Math.max(1,Math.min(s.dungeonLevel[i],s.dungeonSelected[i]+d));paint();save()}
startDungeon=function(i){dungeon(i)};
dungeon=function(i){if(dungeonRun||!Number.isInteger(i)||i<0||i>2)return;if(!allowDungeonEntry(MATERIAL_ENTRIES[i]))return;const n=Math.min(s.dungeonLevel[i],s.dungeonSelected[i]||1);challengeResult=null;const hp=materialDungeonHp(n);dungeonRun={i,n,mode:'daily',replay:n<s.dungeonLevel[i],hp,maxHp:hp,time:30,damage:0,startPower:power()};navigate('home');heroCurrentHp=health();paint();save();banner(DUNGEON_NAMES[i])};
finishDungeon=function(win){const run=dungeonRun;if(!run)return;if(run.mode==='trial')return finishDailyTrial(run);dungeonRun=null;
 if(run.mode!=='daily'&&run.mode!=='rush')return false;
 const completed=!run.abandoned&&(run.mode==='rush'?run.bosses>0:!!win);
 if(run.mode==='daily'&&(!completed||run.replay)){
  resetDay();
  chargeEntry(MATERIAL_ENTRIES[run.i]);
 }
 if(run.mode==='rush'&&!run.abandoned)recordWheelGoal('rush',run.bosses||0);
 const server=saveGuard.usesServer();let earnedId=null;
 if(win&&run.mode==='daily')gainWeaponXp(5);if(run.mode==='rush'&&!run.abandoned)gainWeaponXp((run.bosses||0)*5);const rewards={};if(run.mode==='rush'){if(!run.abandoned){const score=Math.floor(run.damage);s.rushBest=Math.max(s.rushBest,score);s.rushWeekly+=score;rewards.gems=10+Math.min(30,run.bosses*3);rewards.summonTickets=1+(run.bosses>=10?1:0);
   if(server&&run.claimDay&&run.claimAttempt){earnedId=run.claimDay+'/'+run.claimAttempt;rememberEarnedRun('rush',earnedId,{day:run.claimDay,attempt:run.claimAttempt,bosses:run.bosses||0})}}win=completed;}else if(win){
  s.dungeonWins[run.i]++;s.dungeonLevel[run.i]=Math.max(s.dungeonLevel[run.i],run.n+1);
  s.dungeonSelected[run.i]=run.n+1;s.daily.dungeons=(s.daily.dungeons||0)+1;
  Object.assign(rewards,materialDungeonLoot(run.i,run.n));
 }
 if(!server||run.mode!=='rush')grant(rewards);
 if(earnedId)scheduleEarnedClaims();
 heroCurrentHp=health();challengeResult={...run,win,rewards};paint();save();openMenu('challengeResult');playSound(win?'victory':'defeat')};
let dungeonExitTarget=null;
function askDungeonExit(){
 const run=dungeonRun;if(!run||dungeonExitTarget===run&&view==='dungeonExit')return false;
 if(run.mode==='trial'){
  const paused=trialCombatPaused(run);run.exitPending=true;
  if(!paused)beginTrialCombatPause(run);
 }
 dungeonExitTarget=run;openMenu('dungeonExit');return true;
}
function confirmDungeonExit(){if(view!=='dungeonExit'||!dungeonRun||dungeonExitTarget!==dungeonRun)return;dungeonRun.abandoned=true;dungeonExitTarget=null;if(dungeonRun.mode==='trial')return finishDailyTrial(dungeonRun);dismissPopup();finishDungeon(false)}
function startTower(){return false}
function startRush(){
 if(dungeonRun||dungeonAdmissionPending)return false;
 if(!saveGuard.usesServer()){if(!spendEntry('rush'))return false;return beginRush()}
 if(!allowDungeonEntry('rush')||!saveGuard.canTransact())return false;
 const day=today(),book=s.economyClaims?.rushAdmission,attempt=(book?.period===day?book.claims.issued||0:0)+1;
 dungeonAdmissionPending=true;
 return saveGuard.command('claim',{source:'rushEntry',id:day+'/'+attempt}).then(row=>row&&!dungeonRun?beginRush(row):false)
  .finally(()=>{dungeonAdmissionPending=false});
}
function beginRush(receipt=null){
 const startPower=rushRecommendedPower(),hp=Math.ceil(startPower*15*MONSTER_DIFFICULTY);
 dungeonRun={mode:'rush',i:2,n:1,bosses:0,hp,maxHp:hp,time:60,damage:0,startPower};
 if(receipt){dungeonRun.claimDay=receipt.day;dungeonRun.claimAttempt=receipt.attempt}
 challengeResult=null;
 save();
 heroCurrentHp=health();navigate('home');paint();return true;
}
function startMine(){if(s.mineRun||dungeonRun||!spendEntry('mine'))return;s.mineRun={start:Date.now(),end:Date.now()+60000,hits:0,last:0};save();renderScreen()}
function mineHit(){const run=s.mineRun;if(!run||Date.now()>=run.end||Date.now()-run.last<120)return;run.hits+=1;run.last=Date.now();mineScene.strike();updateMineDOM()}
function mineReward(){const r=s.mineRun;if(!r)return 0;return 30+Math.floor(r.hits*.45)+Math.floor(Math.log10(Math.max(10,power()))*5)}
function claimMine(){const r=s.mineRun;if(!r||Date.now()<r.end)return;const ore=mineReward();s.ore+=ore;s.stones+=Math.floor(ore/5);s.starIron+=Math.floor(ore/10);mineScene.cleanup();s.mineRun=null;paint();save();notice('채굴 완료 · 성운석 '+ore+' · 강화석 '+Math.floor(ore/5))}
function updateMineDOM(){mineScene.refresh()}
function sendExpedition(i){if(!guardFeature('explore')||!EXPEDITIONS[i]||s.expeditions[i])return;const e=EXPEDITIONS[i];if(!e[2].includes(new Date().getDay())){notice('해당 탐험이 열리는 요일에 파견하세요');return}const now=Date.now();s.expeditions[i]={region:i,start:now,end:now+e[1]*3600000,hours:e[1]};save();renderScreen()}
function expeditionRewards(hours){const coins=Math.floor(hours/8)-1,reward={relicShards:20*hours/8,stones:50*hours/8};if(coins>0)reward.rouletteCoins=coins;return reward}
function claimExpedition(i){const e=s.expeditions[i];if(!e||Date.now()<e.end)return;const reward=expeditionRewards(e.hours);s.expeditions[i]=null;grant(reward);paint();save();notice('탐험 완료 · 유물 조각 '+reward.relicShards+' · 강화석 '+reward.stones+(reward.rouletteCoins?' · 일반 룰렛 코인 '+reward.rouletteCoins:''))}



let petSummonResults=[];
function summonPet(n=1,ticket=false){return executeGameDraw('pet',n,ticket)}
function equipPet(i){if(!guardFeature('pets')||!Number.isInteger(i)||!PETS[i]||!s.pets[i])return;const hpRatio=Math.max(0,Math.min(1,heroCurrentHp/health()));s.activePet=i;heroCurrentHp=health()*hpRatio;paint();save();notice(PETS[i]+' 동행 시작')}
function levelPet(i){if(!guardFeature('pets')||!Number.isInteger(i)||!PETS[i])return;const cost=petCost(i);if(!s.pets[i]||s.pets[i]>=50||s.petShards<cost)return;s.petShards-=cost;s.pets[i]++;paint();save()}
function achieveValue(type){return{kills:s.kills,stage:s.maxStage,cleared:s.campaignCleared,craft:s.crafted,collection:Object.values(s.unlocked).filter(Boolean).length,plus:Math.max(s.highestGearPlus||0,...s.gearSlotLevels)}[type]||0}
function claimAchievement(i){const a=ACHIEVEMENTS[i];if(!ACTIVE_ACHIEVEMENT_IDS.includes(i)||s.achievements[i]||achieveValue(a[0])<a[2])return;s.achievements[i]=true;s.gems+=a[3];s.title=a[1];paint();save();notice('칭호 '+a[1]+' · 다이아 +'+a[3])}
dailyClaim=function(key){resetDay();const goal=DAILY_GOALS.find(x=>x[0]===key);if(!goal||s.daily.claimed[key]||(s.daily[key]||0)<goal[2])return;s.daily.claimed[key]=true;s.gems+=50;s.passCoins+=5;s.season.points+=20;paint();save();notice('다이아 +50 · 패스 코인 +5 · 시즌 포인트 +20')};
function weeklyClaim(key){resetDay();const g=WEEKLY_GOALS.find(x=>x[0]===key);if(!g||s.weekly.claimed[key]||(s.weekly[key]||0)<g[2])return;s.weekly.claimed[key]=true;s.gems+=200;s.summonTickets+=2;s.season.points+=100;paint();save()}
function claimMonthDay(){
 if(!guardFeature('attendance'))return false;
 recordAttendanceVisit();
 const days=monthlyPending();if(!days)return false;
 if(saveGuard.usesServer?.())return claimServerReward('monthlyAttendance','pending');
 const today=attendanceDay();
 for(const [key,m] of Object.entries(s.monthlyAttendance)){
  if(m.count>=m.earned)continue;
  for(let n=m.count+1;n<=m.earned;n++)grant(monthlyReward(n,m));
  m.count=m.earned;if(key===today.slice(0,7))m.last=today;
 }
 save();paint();notice('월 출석 · '+days+'일분 수령');return true;
}
function claimNewbie(i){
 if(!guardFeature('event')||!newbieReady(i))return false;
 if(saveGuard.usesServer())return claimAccountReward('newbie',i);
 grant(newbieReward(i));
 s.eventClaims['newbie'+i]=true;
 s.eventClaims['newbieGift'+i]=i===6?NEWBIE_MISSIONS[i][3].gems:true;
 if(!s.eventClaims.newbieFinal&&NEWBIE_MISSIONS.every((_,j)=>s.eventClaims['newbie'+j])){
  s.eventClaims.newbieFinal=true;
  addCostume(classIndex(s.classId)*OUTFIT_STRIDE+2);
  notice('7개 미션 완료 · 현재 직업 영웅 스킨 획득');
 }
 paint();save();
}
function claimSeason(i){resetDay();if(!Number.isInteger(i)||i<0||i>=20)return;const goal=(i+1)*50;if(s.season.claimed[i]||s.season.points<goal)return;s.season.claimed[i]=true;grant({gems:50+i*10,ore:10,summonTickets:i%3===2?1:0});paint();save()}
function buyListedShopItem(itemId){
 if(!saveGuard.canTransact())return false;
 if(saveGuard.usesServer())return saveGuard.command('shop',{itemId}).then(receipt=>{
  if(!receipt)return false;
  if(itemId==='fast-battle')scheduleWeaponPrompt();
  paint();if(view)render();
  return true;
 });
 try{
  initializeEconomyClaims(s);
  economyShopRule(s,{itemId},Math.random,Date.now());
 }catch(error){notice(error.message);return false}
 paint();saveTransaction();return true;
}
function fastBattle(){return buyListedShopItem('fast-battle')}
function buyItem(k,n,cost,currency='gems'){
 if(currency==='gems'){
  if(!SHOP_EXCHANGE_OFFERS.some(([key,amount,price])=>key===k&&amount===n&&price===cost))return false;
  return buyListedShopItem(shopExchangeId(k,n));
 }
 if(currency!=='passCoins'||s.passCoins<cost)return false;
 if(!PASS_COIN_OFFERS.some(([key,amount,price])=>key===k&&amount===n&&price===cost))return false;
 return buyListedShopItem(passCoinOfferId(k,n));
}
function buyGoldBox(hours,cost,bonus){
 if(!SHOP_GOLD_BOXES.some(([h,c,b])=>h===hours&&c===cost&&b===bonus))return false;
 return buyListedShopItem('gold-box-'+hours);
}
function retreatBoss(){s.autoBoss=false;s.stage=Math.max(1,s.stage-1);s.enemyHp=maxHp();heroCurrentHp=health();battleElapsed=0;paint();save();notice('보스 도전 실패 · 이전 스테이지에서 성장하세요')}
function retryBoss(){if(dungeonRun)return;const next=Math.floor((s.stage-1)/10)*10+10;if(s.maxStage>=next||s.stage%10===9){s.stage=next;s.enemyHp=maxHp();heroCurrentHp=health();battleElapsed=0;paint();save()}}
function initExpansion(){
 const healthNode=document.createElement('div');healthNode.id='heroHealth';healthNode.className='hero-health';healthNode.setAttribute('role','progressbar');healthNode.setAttribute('aria-label','캐릭터 체력');healthNode.innerHTML='<i id="heroHealthFill"></i><small id="heroHealthText"></small>';$('battle').appendChild(healthNode);
 const retry=document.createElement('button');retry.id='retryBoss';retry.className='boss-retry';retry.textContent='보스 도전';retry.onclick=retryBoss;$('battle').appendChild(retry);

 let last=Date.now(),auto=0;extraTimer=setInterval(()=>{const now=Date.now(),dt=Math.min(2,(now-last)/1000);last=now;if((worldBoss.inBattle()||partyRaid.inBattle())||!stageBossTick(now)||document.hidden)return;auto+=dt;
 updateCombatSurvival(dt);
 if(s.autoForge&&!forgeBusy&&now>=forgeNextAt&&s.ore>0&&s.gear.length<GEAR_CAPACITY){forgeNextAt=now+3000;forgeCraft(Math.min(10,s.ore),true)}
 if(s.mineRun&&now<s.mineRun.end&&now-mineLastTick>=1000){mineLastTick=now;s.mineRun.hits+=1+Math.min(4,Math.floor(Math.log10(Math.max(10,power()))/2));mineScene.strike(true);updateMineDOM()}
 if(auto>=1){auto=0;paintBattle();paintStageBossHUD(now);updateMineDOM();if(activeScreen==='dungeon'&&screenTab==='explore')document.querySelectorAll('[data-expedition-clock]').forEach(el=>{const i=+el.dataset.expeditionClock,e=s.expeditions[i];el.textContent=e?durationLeft(e.end-Date.now()):'';if(e&&Date.now()>=e.end){const b=$('expClaim'+i);if(b)b.disabled=false}})}
 },250);paintBattle();
}
function durationLeft(ms){if(ms<=0)return '탐험 완료';const sec=Math.ceil(ms/1000),h=Math.floor(sec/3600),m=Math.floor(sec%3600/60);return h+'시간 '+m+'분 '+sec%60+'초'}

travel=function(d){if(dungeonRun){notice('도전 전투 중에는 이동할 수 없습니다');return}const target=s.stage+d;if(target<1||target>s.maxStage){notice('먼저 현재 스테이지를 클리어하세요');return}s.stage=target;s.enemyHp=maxHp();heroCurrentHp=health();battleElapsed=0;paint();save()};
