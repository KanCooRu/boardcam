/* v2.1 plan rules. Existing save keys and inventory identities remain stable. */
'use strict';
REL.push(['바람의 장화','',50],['대지의 심장','',60],['시간의 모래시계','',70],['붉은 맹세의 성배','',80]);
REL.forEach((relic,i)=>relic[2]=(i+1)*10);
const REGION_SETS=['초원 파수꾼','어둠숲 사냥꾼','협곡 투사','늪지 주술사','용암 전사','설원 수호자','폐허 기사','마왕성 군주'];
const GRADE_MULT=[1,1.6,2.6,4.2,7,12,20,34,58,100,170];
const STAT_NAMES=['공격력','공격속도','골드 획득','체력','치명타 확률','방어 관통력','치명타 피해'];
const STAT_ICONS=['attack','speed','gold','hp','crit','penetration','crit-damage'];
function growthStatIcon(i){return catalogIcon('stat-'+STAT_ICONS[i],'stat-illustration')}

const SKILL_RULES=[{mult:3.6,cd:7,tier:0,hits:1},{mult:1.4,cd:8,tier:0,hits:3},{mult:4.8,cd:10,tier:1,hits:1},{mult:8,cd:15,tier:2,hits:1},{mult:4,cd:7,tier:0,hits:1},{mult:1.6,cd:11,tier:1,hits:4},{mult:10,cd:17,tier:2,hits:1},{mult:1.3,cd:8,tier:0,hits:3},{mult:5.4,cd:12,tier:1,hits:1},{mult:6,cd:12,tier:1,hits:1},{mult:7,cd:14,tier:2,hits:1},{mult:4.3,cd:8,tier:0,hits:1},{mult:11,cd:18,tier:2,hits:1}];
const COSTUME_TIERS=[0,0,0,1,1,2,2,3],TIER_NAMES=['일반','희귀','영웅','전설'];
const FORGE_UNLOCK=[1,1,2,3,5,7,9,12,15,18,20];
// All ten set families are random. Modest rarity uplift offsets the loss of targeted set completion.
const FORGE_ANCHORS={1:[70,30],3:[38,41,15,6],5:[20,49,20,8,3],8:[8,42,31,12,5,2],10:[4,24,44,18,6.5,2.5,1],12:[0,12,52,23,8.5,3.1,1.1,.3],15:[0,5.5,31,39,15.5,6.2,2,.6,.2],18:[0,0,11,54,22,8.8,2.9,.9,.3,.1],20:[0,0,7,39,34,13,4.7,1.5,.55,.2,.05],25:[0,0,3,26,37,22,8,2.5,1,.4,.1],30:[0,0,1,16,35,29,12,4.5,1.5,.8,.2]};
const baseStarterV2=starter,baseMigrateV2=migrate,baseResetDayV2=resetDay,baseSaveV2=save;
let extraTimer=0,forgeBusy=false,forgeNextAt=0,summonResults=[],costumeResults=[],pendingOffline=null,battleElapsed=0,heroCurrentHp=0,battleSlowUntil=0,forgePreviewLevel=0;
const bounded=(n,min=0,max=1e100)=>Number.isFinite(Number(n))?Math.max(min,Math.min(max,Number(n))):min;
const recordMap=x=>x&&typeof x==='object'&&!Array.isArray(x)?x:{};
const monthKey=()=>today().slice(0,7);
const seasonStart=Date.UTC(2026,10,1),seasonLength=28*86400000;
const seasonCycle=(now=Date.now())=>Math.floor((now-seasonStart)/seasonLength);
const weekKey=()=>{const day=koreaDayNumber();return attendanceDay(day-koreaWeekday(day))};
// Before roster 2, slots 7 and 8 held the retired book and awl, and slot 9 held the grail.
function restoreRelics(a,data){
 if(!Array.isArray(data?.relics))return;
 if(data.relicRosterVersion===2){a.relics=data.relics;return}
 const oldLevel=i=>Math.floor(bounded(data.relics[i],0,50));
 for(const i of [7,8]){
  const level=oldLevel(i);
  a.relicShards=bounded(a.relicShards)+level*(level+4); // Sum of upgrade prices 5, 7, 9, …
 }
 a.relics=Array.from({length:REL.length},(_,i)=>oldLevel(i===7?9:i));
}
function extendSave(a){
 a.relicRosterVersion=2;
 a.relics=Array.from({length:REL.length},(_,i)=>Math.floor(bounded(a.relics?.[i],0,50)));
 a.stats=Array.from({length:STAT_NAMES.length},(_,i)=>Math.floor(bounded(a.stats?.[i]??1,1,GROWTH_RULES[i].max)));
 for(const k of ['relicShards','summonTickets','rouletteCoins','passCoins','costumeShards','towerFloor','towerBest','rushBest','rushWeekly','petTickets','petShards'])a[k]=Math.floor(bounded(a[k]));
 if(!a.planVersion)a.relicShards+=30;
 a.planVersion=21;a.saveVersion=10;a.joinedAt=bounded(a.joinedAt||Date.now(),1,Date.now());
 a.awaySince=bounded(a.awaySince,0,Date.now());
 a.stage=Math.floor(bounded(a.stage,1,1e7));a.maxStage=Math.floor(bounded(a.maxStage,a.stage,1e7));
 a.skills=Object.fromEntries(Object.entries(a.skills||{}).map(([k,v])=>[k,Math.min(100,v)]));
 a.gear.forEach(g=>{if(!isPlainStarter(g))g.set=Math.floor(bounded(g.set,0,REGION_SETS.length-1));g.locked=!!g.locked});
 a.showcase=Array.from({length:7},(_,i)=>Math.floor(bounded(a.showcase?.[i],0,1000)));
 a.costumeLevels=Object.fromEntries(a.costumes.map(i=>[i,Math.floor(bounded(a.costumeLevels?.[i]||1,1,5))]));
 a.achievements=a.achievements&&typeof a.achievements==='object'?a.achievements:{};
 a.monthlyAttendance=Object.fromEntries(Object.entries(recordMap(a.monthlyAttendance)).filter(([key])=>/^\d{4}-(0[1-9]|1[0-2])$/.test(key)).map(([key,value])=>[key,normalizeMonthlyRecord(value)]));
 a.eventClaims=a.eventClaims&&typeof a.eventClaims==='object'?a.eventClaims:{};
 settleLegacyNewbieGift(a);
 a.newbieDays=a.newbieDays&&typeof a.newbieDays==='object'?a.newbieDays:{};
 a.weekly=a.weekly&&typeof a.weekly==='object'?a.weekly:{key:weekKey(),bosses:0,crafted:0,claimed:{}};
 a.weekly.claimed=recordMap(a.weekly.claimed);a.weekly.bosses=bounded(a.weekly.bosses);a.weekly.crafted=bounded(a.weekly.crafted);
 for(const key of ['claimed'])a.daily[key]=recordMap(a.daily[key]);
 for(const key of ['collectionClaimed','passClaimed','unlocked','vipClaimed'])a[key]=recordMap(a[key]);
 for(const key of ['kills','crafted','upgrades','dungeons','rush','fastBattle'])a.daily[key]=bounded(a.daily[key]);
 // Retired progression is a read-only bonus; it can no longer reset or spend anything.
 a.legacyGrowth=Array.from({length:4},(_,i)=>Math.floor(bounded((a.legacyGrowth||a.rebirthTree)?.[i],0,50)));
 delete a.rebirthTree;delete a.rebirthPoints;delete a.rebirthCount;
 const bank=recordMap(a.offlineRewards);
 a.offlineRewards=Object.fromEntries(['seconds','gold','ore','xp'].map(k=>[k,Math.floor(bounded(bank[k],0,k==='seconds'?86400:1e100))]));
 if(!a.offlineRewards.seconds)a.offlineRewards={seconds:0,gold:0,ore:0,xp:0};
 a.expeditions=Array.from({length:3},(_,i)=>{const x=a.expeditions?.[i];return x&&Number.isFinite(x.end)&&Number.isFinite(x.start)&&[8,16,24].includes(x.hours)?{region:i,start:x.start,end:x.end,hours:x.hours}:null});
 a.mineTickets=Math.floor(bounded(a.mineTickets??2,0,99));a.mineRun=a.mineRun&&Number.isFinite(a.mineRun.end)?{end:a.mineRun.end,start:a.mineRun.start,hits:Math.floor(bounded(a.mineRun.hits,0,Number.MAX_SAFE_INTEGER)),last:bounded(a.mineRun.last)}:null;
 a.dungeonSelected=a.dungeonSelectionVersion===2?Array.from({length:3},(_,i)=>Math.floor(bounded(a.dungeonSelected?.[i]??a.dungeonLevel[i],1,a.dungeonLevel[i]))):[...a.dungeonLevel];
 a.dungeonSelectionVersion=2;
 a.pets=Object.fromEntries(Object.entries(a.pets||{}).filter(([k,v])=>Number.isInteger(+k)&&+k>=0&&+k<COMPANIONS.length&&Number.isFinite(v)&&v>0).map(([k,v])=>[k,Math.floor(bounded(v,1,50))]));a.activePet=a.pets[a.activePet]?Number(a.activePet):-1;
 a.season=a.season&&typeof a.season==='object'?a.season:{key:monthKey(),spent:0,points:0,claimed:{},vipGifts:{}};a.season.claimed=recordMap(a.season.claimed);a.season.vipGifts=recordMap(a.season.vipGifts);a.season.cycle=Number.isInteger(a.season.cycle)?a.season.cycle:seasonCycle();
 a.season.spent=bounded(a.season.spent);a.season.points=bounded(a.season.points);
 a.autoSalvage=false;a.autoForge=!!a.autoForge;a.growthBatch=[1,10,50].includes(a.growthBatch)?a.growthBatch:50;
 a.highestGearPlus=Math.floor(bounded(a.highestGearPlus,0,WEAPON_MAX_PLUS));a.lastLoot=Array.isArray(a.lastLoot)?a.lastLoot.slice(-100):[];
 normalizeDailyTrialState(a);
 return extendProfileSave(a);
}
starter=function(){const a=baseStarterV2();a.playerXpVersion=2;a.slots=[0,4,-1,-1];a.attendanceBook={last:'',pending:0};return extendSave(a)};
migrate=function(data){const a=baseMigrateV2(data);
 if(data&&data.playerXpVersion!==2){
  const previousGoal=a.level*20;
  a.xp=Math.floor(Math.min(1,a.xp/previousGoal)*playerXpGoal(a.level));
 }
 a.playerXpVersion=2;a.dungeonSelectionVersion=data?.dungeonSelectionVersion;a.legacyGrowth=Array.isArray(data?.legacyGrowth)?data.legacyGrowth:data?.rebirthTree;a.stage=Math.floor(bounded(data?.stage||a.stage,1,1e7));a.maxStage=Math.floor(bounded(data?.maxStage||a.maxStage,a.stage,1e7));if(Array.isArray(data?.stats))a.stats=data.stats;restoreRelics(a,data);const saved=extendSave(a);restoreAttendance(saved,data);return saved};
resetDay=function(){const old=s.day;baseResetDayV2();if(old!==s.day){s.daily.fastBattle=0;s.daily.rush=0;normalizeDailyTrialState(s)}if(s.weekly&&s.weekly.key!==weekKey()){s.weekly={key:weekKey(),bosses:0,crafted:0,claimed:{}};s.rushWeekly=0}if(s.season){if(s.season.key!==monthKey()){s.lastVip={level:vipLevel(),month:s.season.key};s.season.key=monthKey();s.season.spent=0;s.season.vipGifts={}}if(s.season.cycle!==seasonCycle()){s.season.cycle=seasonCycle();s.season.points=0;s.season.claimed={}}}};
save=function(){baseSaveV2()};
function playerXpGoal(level=s.level){return level*(120+4*(level-1))}
function gainXP(amount){
 if(!Number.isFinite(amount)||amount<=0)return;
 const priorLevel=s.level,server=saveGuard.usesServer();
 s.xp+=Math.floor(amount);
 while(s.level<9999&&s.xp>=playerXpGoal()){
  s.xp-=playerXpGoal();s.level++;if(!server)s.gems+=5;
 }
 if(s.level>=9999)s.xp=Math.min(s.xp,playerXpGoal());
 if(server&&s.level>priorLevel){s.pendingLevelReward=s.level;scheduleEarnedClaims()}
}
function offlineCap(){return Math.round(Math.min(24,8+s.legacyGrowth[3]*.3+s.relics[6]*.1)*3600)}
function offlineGains(seconds){const t=Math.floor(Math.min(offlineCap(),bounded(seconds)));return {
 seconds:t,gold:Math.floor(t*goldGain()*.12*(1+petSpecial('offlineGold'))),
 ore:Math.floor(t/60*(1+s.legacyGrowth[2]*.05)*(1+petSpecial('offlineOre'))),
 xp:Math.floor(t*.2*(1+petSpecial('offlineXp')))
}}
function accrueOffline(seconds){
 if(!Number.isFinite(seconds)||seconds<60)return;
 const bank=s.offlineRewards,r=offlineGains(Math.min(seconds,Math.max(0,offlineCap()-bank.seconds)));
 for(const key of ['seconds','gold','ore','xp'])bank[key]+=r[key];
 pendingOffline=bank.seconds?bank:null;s.last=Date.now();save();return r.seconds?r:undefined;
}
function claimOffline(){
 const r=s.offlineRewards;if(!r||r.seconds<=0)return false;
 s.offlineRewards={seconds:0,gold:0,ore:0,xp:0};pendingOffline=null;
 s.gold+=r.gold;s.ore+=r.ore;gainXP(r.xp);gainWeaponXp(Math.floor(r.seconds/60));save();paint();playSound('reward');notice('오프라인 보상을 수령했습니다');return true;
}
function offlineTime(seconds=s.offlineRewards.seconds){const t=Math.floor(bounded(seconds,0,86400));return [Math.floor(t/3600),Math.floor(t%3600/60),t%60].map(n=>String(n).padStart(2,'0')).join(':')}
function paintOfflineReward(){const el=$('offlineRewardTimer'),ready=s.offlineRewards.seconds>0;el.textContent=offlineTime();$('offlineRewardDot').hidden=!ready;$('offlineRewardButton').setAttribute('aria-label','오프라인 보상 · 적립 '+offlineTime()+(ready?' · 수령 가능':''))}
load=function(){s=saveGuard.readLocal();resetDay();const elapsed=(Date.now()-(s.awaySince||s.last||Date.now()))/1000;s.awaySince=0;pendingOffline=s.offlineRewards.seconds?s.offlineRewards:null;accrueOffline(elapsed);if(!Number.isFinite(s.enemyHp)||s.enemyHp<=0||s.enemyHp>maxHp())s.enemyHp=maxHp();heroCurrentHp=health();lastLoot=s.lastLoot||[];refreshAttendance();};
function currentRegion(){return Math.floor((s.stage-1)/10)%8}
function isPlainStarter(g){return g?.set===-1&&g.r===0&&g.id==='starter_'+g.p}
function baseGearValue(g,level){return 12*GRADE_MULT[g.r]*((isPlainStarter(g)?0:1)+level*.2)*([1,.92,1.20,.88][g.p]||1)}
function gearValue(g){return g?baseGearValue(g,gearEnhancement(g)):0}
function setBonuses(){const counts=Array(8).fill(0);Object.values(s.equipped).forEach(id=>{const g=s.gear.find(x=>x.id===id);if(g)counts[g.set||0]++});let attack=0,hp=0;counts.forEach(n=>{if(n>=2)attack+=.05;if(n>=4)hp+=.1;if(n>=7){attack+=.2;hp+=.2}});return{counts,attack,hp}}
function collectionBonus(){return PARTS.reduce((sum,_,p)=>sum+(Math.max(-1,...Object.keys(s.unlocked).filter(k=>k.startsWith(p+'_')&&s.unlocked[k]).map(k=>+k.split('_')[1]))+1)*.003,0)}
function costumeBonus(){let v=costumeSets().filter(x=>x.complete).length*.01;for(const i of s.costumes){const tier=COSTUME_TIERS[i],lv=s.costumeLevels?.[i]||1;v+=[.01,.03,.06,.12,.16,.2][tier]+(lv-1)*[.005,.0125,.0225,.045,.06,.08][tier]}return Math.min(.2,v)}
function petHoldingBonus(){
 let total=0;
 for(let id=0;id<COMPANIONS.length;id++)if(s?.pets?.[id])total+=petHoldingEffect(id,s.pets[id]);
 return total;
}
function skillCollection(){return Object.values(s.skills).reduce((a,b)=>a+b,0)}
// Equipping the starting loadout gives every class 100 attack before class passives.
const STARTER_BASE_ATTACK={unassigned:74,standard:73};
power=function(){
 const plainStart=s.weapons?.warrior?.basic;
 const intrinsic=plainStart?(s.classId?99:100):(s.classId?STARTER_BASE_ATTACK.standard:STARTER_BASE_ATTACK.unassigned);
 const base=intrinsic+gearValue(equippedItem(0))+gearValue(equippedItem(4));
 const b=setBonuses();
 return Math.floor(base*(1+growthBonus(0))*(1+s.relics[0]*.03)*(1+b.attack+collectionBonus()+showcaseBonus())*(1+skillCollection()*.005)*(1+costumeBonus())*(1+costumeWearBonus())*(1+s.legacyGrowth[0]*.05)*(1+petHoldingBonus())*(1+petSpecial('attack')));
};
health=function(){let base=s.weapons?.warrior?.basic?676:300;[1,2,3].forEach(i=>base+=gearValue(equippedItem(i))*10);return Math.floor(base*(1+growthBonus(3))*(1+s.relics[1]*.04)*(1+setBonuses().hp+collectionBonus())*(1+costumeBonus('hp'))*(1+costumeWearBonus('hp'))*(1+petSpecial('health')))};
armor=function(){return Math.floor(health()*.04)};
function armorMitigation(value=armor()){
 const defense=Math.max(0, Number(value)||0);
 return .4*defense/(defense+300);
}
function criticalChance(){return Math.min(.6,.05+growthBonus(4)+setBonuses().critical+s.relics[3]*.005+gearValue(equippedItem(6))*.00005+petSpecial('critical')+costumeBonus('critical')+costumeWearBonus('critical'))}
function attackSpeed(){return 1+Math.min(2,growthBonus(1)+setBonuses().speed+s.relics[4]*.01+gearValue(equippedItem(5))*.0005+petSpecial('speed')+costumeBonus('speed')+costumeWearBonus('speed'))}
goldGain=function(stage=s.stage){return Math.ceil((7+campaignEconomyStage(stage)*2)*(1+growthBonus(2))*(1+s.relics[3]*.03)*(1+s.legacyGrowth[1]*.05)*(1+petHoldingBonus())*(1+petSpecial('gold')))};
statCost=function(i){return Math.ceil([30,100,150,30,80][i]*Math.pow(1.13,s.stats[i]-1))};
upgrade=function(i,n){if(!Number.isInteger(i)||i<0||i>4)return;const count=n??s.growthBatch??1;let done=0;while(done<(count==='max'?1200:count)&&s.stats[i]<1200&&s.gold>=statCost(i)){if(i===4&&criticalChance()>=.6||i===1&&attackSpeed()>=3)break;s.gold-=statCost(i);s.stats[i]++;done++}s.daily.upgrades=(s.daily.upgrades||0)+done;paint();save();notice(done?STAT_NAMES[i]+' '+done+'회 강화':'재화 부족 또는 최대 효과입니다')};
function growthBatch(n){
 if(!GROWTH_BATCHES.includes(n)||!STAT_NAMES.some((_,i)=>growthOffers(i,n).has(n)))return;
 s.growthBatch=n;paint();save();
}
function forgeProb(level){level=Math.max(1,Math.min(FORGE_MAX_LEVEL,level));const keys=Object.keys(FORGE_ANCHORS).map(Number),lo=Math.max(...keys.filter(k=>k<=level)),hi=Math.min(...keys.filter(k=>k>=level)),t=lo===hi?0:(level-lo)/(hi-lo);const raw=RAR.map((_,i)=>FORGE_UNLOCK[i]>level?0:(FORGE_ANCHORS[lo][i]||0)*(1-t)+(FORGE_ANCHORS[hi][i]||0)*t);const sum=raw.reduce((a,b)=>a+b,0);return raw.map(x=>x*100/sum)}
rollR=function(){
 const odds=forgeProb(s.forgeLevel);let draw=Math.random()*100,last=0;
 for(let i=0;i<odds.length;i++){
  if(odds[i]<=0)continue;
  last=i;draw-=odds[i];if(draw<0)return i;
 }
 return last;
};
boostForge=function(){notice('모루 경험치는 장비 제작으로만 획득합니다')};
function addForgeExperience(state,count){
 if(state.forgeLevel<FORGE_MAX_LEVEL){
  state.forgeExp+=count;
  while(state.forgeLevel<FORGE_MAX_LEVEL&&state.forgeExp>=NEED[state.forgeLevel-1]){
   state.forgeExp-=NEED[state.forgeLevel-1];
   state.forgeLevel++;
  }
 }
 if(state.forgeLevel===FORGE_MAX_LEVEL)state.forgeExp=0;
}
function advanceForge(count){addForgeExperience(s,count)}
function obtainGear(g){const discovered=!s.unlocked[g.p+'_'+g.r];s.unlocked[g.p+'_'+g.r]=true;let salvaged=false;if(s.gear.length>=GEAR_CAPACITY){s.stones+=g.r+1;salvaged=true}else{s.gear.push(g);if(s.autoEquip&&gearValue(g)>gearValue(equippedItem(g.p)))s.equipped[g.p]=g.id}return{...g,salvaged,discovered}}
function forgeCraft(n,quiet=false){if(!Number.isFinite(n)||n<1)return 0;const room=Math.max(0,GEAR_CAPACITY-s.gear.length);if(!room){if(!quiet)notice('장비 가방이 가득 찼습니다. 장비를 정리한 뒤 제작하세요');return 0}const count=Math.min(Math.floor(n),Math.floor(s.ore),100,room);if(count<=0){if(!quiet)notice('성운석이 부족합니다');return 0}lastLoot=[];for(let i=0;i<count;i++){s.ore--;s.crafted++;const g={id:'g_'+Date.now().toString(36)+'_'+s.crafted+'_'+i,p:1+Math.floor(Math.random()*6),r:rollR(),plus:0,set:rollCraftSet(),locked:false};lastLoot.push(obtainGear(g));advanceForge(1)}s.lastLoot=lastLoot;trackOrderEvent('crafted',count);s.daily.crafted=(s.daily.crafted||0)+count;s.weekly.crafted=(s.weekly.crafted||0)+count;paint();save();if(!quiet){playSound('forge');openMenu('loot')}return count}
make=function(n){return animateForge(n)};
function animateForge(n){return beginResultAction({kind:'forge',n})}
function toggleAutoForge(){s.autoForge=!s.autoForge;forgeNextAt=Date.now()+2200;save();paint()}
function upgradeCost(g){return slotUpgradeCost(gearEnhancement(g))}
improve=function(id,maximum=false){const g=s.gear.find(item=>item.id===id);return g?improveGearSlot(g.p,maximum):false};
function toggleGearLock(id){const g=s.gear.find(x=>x.id===id);if(!g)return;g.locked=!g.locked;paint();save()}
salvage=function(id){const g=s.gear.find(x=>x.id===id);if(!g)return;if(!canSalvage(g)){notice('착용·잠금 장비는 보호됩니다');return}dismantleGear(new Set([id]));paint();save();notice('분해 완료')};
salvageLow=function(){const ids=new Set(s.gear.filter(g=>matchesBagFilters(g)&&canSalvage(g)&&g.r<=1).map(g=>g.id));const {count}=dismantleGear(ids);paint();save();notice(count+'개 분해')};
equipBest=function(){for(let p=1;p<7;p++){const best=s.gear.filter(g=>g.p===p).sort((a,b)=>gearValue(b)-gearValue(a))[0];if(best)s.equipped[p]=best.id}paint();save();notice('가장 강한 장비를 장착했습니다')};
function showcaseGear(id){const g=s.gear.find(x=>x.id===id);if(!g||g.locked||s.equipped[g.p]===id){notice('미착용·잠금 해제 장비를 선택하세요');return}s.showcase[g.p]+=g.r+1;s.gear=s.gear.filter(x=>x.id!==id);paint();save();notice('진열장 등록 · 영구 공격력 +'+((g.r+1)*.1).toFixed(1)+'%')}
function slotOpen(i){return i<2||i===2&&s.maxStage>=10||i===3&&s.maxStage>=30}
function skillCost(k,level=s.skills[k]||0){return Math.round((10+Math.floor(level*1.5))*shardScale(false,k))}
function petCost(i,level=s.pets[i]||0){return Math.round((10+level*2)*shardScale(true,i))}
skillLevel=function(k,maximum=false){if(k<0||k>=SK.length)return;let count=0;while((s.skills[k]||0)<100&&s.shards>=skillCost(k)){s.shards-=skillCost(k);s.skills[k]=(s.skills[k]||0)+1;count++;if(!maximum)break}s.daily.upgrades=(s.daily.upgrades||0)+count;paint();save();if(!count)notice('스킬 조각 부족 또는 최대 레벨')};
levelAllSkills=function(maximum){let count=0;for(let round=0;round<(maximum?100:1);round++){let done=0;for(const k of Object.keys(s.skills).map(Number)){if(s.skills[k]<100&&s.shards>=skillCost(k)){s.shards-=skillCost(k);s.skills[k]++;done++;count++}}if(!done)break}s.daily.upgrades=(s.daily.upgrades||0)+count;paint();save();if(!count)notice('강화 가능한 스킬이 없습니다')};
setSlot=function(slot,k){if(!slotOpen(slot)||!s.skills[k]){notice('STAGE '+(slot===2?10:30)+'에서 슬롯이 열립니다');return}const old=s.slots.indexOf(k);if(old>=0)s.slots[old]=-1;s.slots[slot]=k;cooldowns[slot]=Math.max(cooldowns[slot],SKILL_RULES[k].cd);closeMenu();paint();save();notice('스킬 장착 완료')};
autoEquipSkills=function(){const list=Object.keys(s.skills).map(Number).sort((a,b)=>skillDamage(b)-skillDamage(a));s.slots=Array.from({length:4},(_,i)=>slotOpen(i)?list[i]??-1:-1);cooldowns=cooldowns.map(x=>Math.max(7,x));paint();save()};
// Adventure attacks use the hero's earned level, including when replaying earlier stages.
function adventureBasicMultiplier(level=s.level){
 return 1+.06*Math.min(level,50)+.04*Math.min(50,Math.max(0,level-50));
}
function skillLevelMultiplier(level,adventure){return 1+(level-1)*(adventure?.10:.15)}
function firstSlotSkillMultiplier(k){
 return k===s.slots[0]?1+petSpecial('firstSlotSkill'):1;
}
function skillDotRatio(k,level,adventure=false){
 const base=skillMeta(k).target==='all'?.65:.8;
 return base*skillLevelMultiplier(level,adventure)*firstSlotSkillMultiplier(k);
}
function skillDamage(k,lv=s.skills[k]||1,adventure=false){
 const r=SKILL_RULES[k],attack=power(),target=skillMeta(k).target;
 let damage=attack*r.mult*r.hits*skillLevelMultiplier(lv,adventure);
 if(adventure&&damage>0){
  const area=target==='all';
  // Add the hero-level contribution once per cast, including multi-hit skills.
  damage=damage*(area?.80:.90)+attack*(adventureBasicMultiplier()-1)*(area?.25:.65);
 }
 const targetBonus=target==='all'?petSpecial('areaSkill'):target==='single'?petSpecial('singleSkill'):0;
 return Math.ceil(damage*(1+s.relics[2]*.03)*(1+petSpecial('skill'))*(1+targetBonus)*(1+setBonuses().skill)*firstSlotSkillMultiplier(k));
}
function skillDrawDay(now=Date.now()){return koreaDayNumber(now)}
function dailySkillAvailable(day=skillDrawDay()){return s.lastFreeSkillDay==null||s.lastFreeSkillDay<day}
function grantSkillDraw(n,useTicket=false,freeDay=null){return executeGameDraw('skill',n,useTicket,freeDay,false)}
relicLevel=function(i,maximum=false){if(!guardFeature('relics'))return false;if(!Number.isInteger(i)||i<0||i>=REL.length||(s.maxStage<REL[i][2]&&!s.relics[i])){notice('해금 스테이지에 도달하세요');return}let count=0;while(s.relics[i]<50&&s.relicShards>=5+s.relics[i]*2){s.relicShards-=5+s.relics[i]*2;s.relics[i]++;count++;if(!maximum)break}paint();save();if(!count)notice('유물 조각 부족 또는 최대 레벨')};
function addCostume(i,state=s){if(!Number.isInteger(i)||i<0||i>=COSTUME_NAMES.length)return false;if(!state.costumes.includes(i)){state.costumes.push(i);return'신규 획득'}return addSkinCopy({key:i,tier:i%OUTFIT_STRIDE},state)}
function claimAttendance(){
 if(!guardFeature('attendance'))return false;
 recordAttendanceVisit();
 const book=s.attendanceBook,days=book.pending;
 if(!days)return false;
 if(saveGuard.usesServer?.())return claimServerReward('attendance','pending');
 for(let i=0;i<days;i++)grant(SEVEN_ATTENDANCE_REWARDS[(s.attendance+i)%7]);
 s.attendance+=days;s.lastAttendance=book.last;book.pending=0;
 save();paint();notice('7일 출석 · '+days+'일분 수령');return true;
}
function grant(rewards){for(const[k,v]of Object.entries(rewards)){if(k==='tickets'){for(const {resource} of Object.values(ENTRY_PASSES))s[resource]+=v}else s[k]=(s[k]||0)+v}}
function vipLevel(){const thresholds=[10000,30000,50000,100000,300000,500000,1000000,1500000,2000000];return thresholds.filter(n=>n<=(s.season?.spent||0)).length}
function claimVip(){notice('누적 VIP는 결제 서비스 연결 후 이용할 수 있습니다')}

function costumeSets(){return [['별의 기사단',[0,5,7]],['밤의 수호대',[2,3,6]]].map(([name,ids])=>({name,ids,complete:ids.every(i=>s.costumes.includes(i))}))}

// Battle completion is saved before requesting the corresponding server reward. A reload resumes unpaid receipts.
let automaticClaimTimer=0,processingClaims=false;
function rememberEarnedRun(source,id,details){
 const runs=s.pendingEconomyRuns||={};(runs[source]||={})[id]=details;
}
function scheduleEarnedClaims(delay=0){
 if(automaticClaimTimer||processingClaims||!saveGuard.usesServer())return;
 automaticClaimTimer=setTimeout(()=>{automaticClaimTimer=0;void settleEarnedClaims()},delay);
}
async function settleEarnedClaims(){
 if(processingClaims||!saveGuard.usesServer())return;
 const owner=s;
 processingClaims=true;
 try{
  if(!saveGuard.canTransact(true))return;
  if(s.pendingLevelReward){
   if((s.economyClaims?.level||0)>=s.level)delete s.pendingLevelReward;
   else if(!await saveGuard.command('claim',{source:'level',id:s.level}))return;
  }
  for(const source of ['rush','worldBoss']){
   const rows=owner.pendingEconomyRuns?.[source]||{};
   const pending=Object.entries(rows).sort(([,a],[,b])=>String(a.day||'').localeCompare(String(b.day||''))||(a.attempt||a.floor)-(b.attempt||b.floor));
   for(const [id] of pending){
    if(s!==owner||!saveGuard.usesServer())return;
    if(!await saveGuard.command('claim',{source,id}))return;
   }
  }
 }finally{
  processingClaims=false;
  if(s===owner&&saveGuard.usesServer()&&(s.pendingLevelReward||['rush','worldBoss'].some(source=>Object.keys(s.pendingEconomyRuns?.[source]||{}).length)))scheduleEarnedClaims(10000);
 }
}
window.addEventListener('online',()=>scheduleEarnedClaims());
