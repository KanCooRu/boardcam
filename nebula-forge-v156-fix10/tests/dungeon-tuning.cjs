'use strict';
const assert=require('node:assert/strict');
const {run,ctx}=require('./harness.cjs');
let now=1800000000000,sequence=0;
const tasks=new Map();
ctx.testClock=()=>now;
ctx.setTimeout=(cb,ms=0)=>{const id=++sequence;tasks.set(id,{at:now+ms,cb});return id};
ctx.clearTimeout=id=>tasks.delete(id);
run("Date.now=testClock;save=()=>{};s.auto=false;s.effects=false;");
function tick(ms){
 now+=ms;
 for(const [id,t] of tasks)if(t.at<=now){tasks.delete(id);t.cb()}
}
function encounter(tier,room,seed){
 tasks.clear();
 ctx.testSeed=seed;
 run(`cancelCombatAnimation();view='';activeScreen='home';dungeonRun=null;challengeResult=null;
 s=starter();s.classId='warrior';s.stage=s.maxStage=34;s.speed=1;s.stats[3]=1;
 s.slots=[0,1,2,3];for(const k of s.slots)s.skills[k]=1;
 power=()=>2593;health=()=>3615;heroCurrentHp=health();s.effects=false;s.auto=s.autoSkills=true;
 s.dungeonLevel[${room}]=s.dungeonSelected[${room}]=${tier};cooldowns=[0,0,0,0];combatBusyUntil=enemyRespawnUntil=heroReviveUntil=combatTimer=0;
 Math.random=()=>{testSeed=(Math.imul(testSeed,1664525)+1013904223)>>>0;return testSeed/4294967296};
 startDungeon(${room});`);
 const required=run('recommendedPower('+tier+')');
 for(let ms=100;ms<=30000;ms+=100){
  tick(100);
  if(!run('!!dungeonRun'))break;
  run(`dungeonRun.time-=.1;if(dungeonRun.time<=0)finishDungeon(false);else{
   combatTimer+=.1;paintCooldowns();if(combatTimer>=1.15/attackSpeed()){
    const i=s.slots.findIndex(k=>autoSkillUsable(k));if((i>=0&&cast(i,true))||hit())combatTimer=0;
   }
  }`);
  if(ms%500===0&&run('!!dungeonRun'))run('updateCombatSurvival(.5);tickTactics()');
 }
 const outcome=run('challengeResult?.win');
 assert.equal(outcome,true,`room=${room} tier=${tier} seed=${seed}`);
 return required;
}
for(let i=0;i<3;i++){
 const rec=[6,7].map(n=>encounter(n,i,87411+i));
 assert(rec[1]<2593&&rec[1]/rec[0]<1.5);
 console.log('PASS',run('DUNGEON_NAMES['+i+']'),rec,'cleared both tiers at power 2593');
}
assert.equal(run(`(()=>{s=starter();s.classId='warrior';s.auto=false;dungeonRun=null;s.effects=false;
 s.enemyHp=maxHp();const offline=offlineGains(1800).gold,gold=s.gold;const e=ensureEncounter();
 e.readyAt=e.spawnAt=0;for(let i=0;i<3;i++)hurtFoe(99999,false,i);
 return s.gold-gold===90&&offlineGains(1800).gold===offline})()`),true);
assert.equal(run(`(()=>{s.adventureGoldHalf=0;const old=s.gold;grantAdventureGold(9);
 s=migrate(JSON.parse(JSON.stringify(s)));grantAdventureGold(9);return s.gold===old+27&&!s.adventureGoldHalf})()`),true);
assert.equal(run(`(()=>{s.maxStage=21;for(let i=0;i<3;i++){const hours=8*(i+1);s.expeditions[i]={region:i,start:0,end:1,hours};
 const old=[s.relicShards,s.stones,s.rouletteCoins];claimExpedition(i);claimExpedition(i);
 if(s.relicShards-old[0]!==hours*2.5||s.stones-old[1]!==hours*6.25||s.rouletteCoins-old[2]!==hours/8-1)return false;
 }return true})()`),true);
assert.equal(run(`(()=>{s.maxStage=31;for(const key of ['gold','armory','library','rush','mine']){
 const def=ENTRY_PASSES[key];s.daily.admissions[key]=3;s[def.resource]=1;
 const e=dungeonEntryState(key);if(e.label!=='입장'||!e.status.includes('일일 입장권 0 / 3')||e.disabled)return false;
 s[def.resource]=0;
 if(!dungeonEntryState(key).disabled)return false;
}
 return !dungeonEntryState('tower')&&dungeonEntryState('explore').label==='탐험 관리' })()`),true);
assert.equal(run(`(()=>{let previous;const seen=new Set();
 for(let i=1;i<=300;i++){const mob=encounterFor(1,{mode:'tower',n:i});if(previous===mob.art||!mob.name)return false;
 if(i%10===0){if(!/^creature_\\d+_3$/.test(mob.art))return false}else {if(!mob.mini||!mob.interval)return false;if(i<30)seen.add(mob.art)}
 previous=mob.art}return seen.size===27})()`),true);
assert.equal(run(`(()=>{
 s=starter();chooseClass('warrior');
 for(const [stage,amount] of [[1,30],[49,249],[50,510],[99,531],[100,1062],[1200,18870]]){
  if(campaignKillGold(stage)!==amount)return false;
 }
 return true;
})()`),true,'doubled campaign gold at normal stages, bosses and the campaign limit');
for(const stage of [1,25,49,50,99,100,299,300,301,1199,1200]){
 ctx.dropStage=stage;
 assert.equal(run(`(()=>{
  s=starter();chooseClass('shadow');s.effects=false;s.stage=dropStage;s.maxStage=1200;
  s.campaignCleared=1199;dungeonRun=null;s.tactics.encounter=null;s.enemyHp=maxHp();
  const boss=s.stage%10===0,guaranteed=campaignKillGold(),before=s.gold,kills=s.kills,ore=s.ore,
    stack=campaignMaterialStack(s.stage),oldRandom=Math.random,oldStage=s.stage;
  const half=s.adventureGoldHalf===1?1:0;
  try{Math.random=()=>0;
   if(boss){stageBossAttempt();applyDamage(1e20)}
   else{const wave=ensureEncounter();wave.readyAt=wave.spawnAt=0;hurtFoe(1e20,false,0);hurtFoe(1e20,false,0)}
  }finally{Math.random=oldRandom}
  const weekend=[0,6].includes(new Date().getDay());
  return s.kills===kills+1&&s.gold-before===guaranteed&&
   s.ore-ore===(weekend?2:1)*stack+(boss?5+2*(stack-1):0)&&
   2*(s.gold-before)+(s.adventureGoldHalf||0)-half===3*campaignKillGoldBase(oldStage);
 })()`),true,'actual payout for stage '+stage);
}
assert.equal(run(`(()=>{
 s=starter();chooseClass('warrior');s.stage=s.maxStage=49;
 for(const tier of [1,10,37,100]){
  for(const relic of [0,13,50]){
   s.relics[7]=relic;s.dungeonSelected[0]=s.dungeonLevel[0]=tier;
   const previousBase=Math.max(500*tier*tier,offlineGains(600+120*tier).gold);
   const expected=Math.floor(previousBase/10);
   const balance=s.gold;
   if(dungeonEntryState('gold').reward!=='골드 '+num(expected))return false;
   startDungeon(0);finishDungeon(true);finishDungeon(true);
   if(s.gold-balance!==expected||challengeResult.rewards.gold!==expected)return false;
  }
 }
 return true;
})()`),true,'gold mine preview and payout are one tenth after player scaling at all grail levels');
assert.equal(run(`(()=>{s=starter();chooseClass('mage');s.maxStage=6;s.relics[7]=13;
 for(const n of [1,10,11,21,41,100]){
  for(let i=0;i<3;i++){
   s.dungeonSelected[i]=s.dungeonLevel[i]=n;
   const loot=materialDungeonLoot(i,n),key=MATERIAL_ENTRIES[i];
   if(dungeonEntryState(key).reward!==materialLootLabel(i,n))return false;
   const resources=['gold','shards','stones','starIron'],before=resources.map(k=>s[k]);
   const inventory=JSON.stringify([s.gear,s.equipped,s.unlocked]);
   startDungeon(i);finishDungeon(true);finishDungeon(true);
   if(resources.some((k,j)=>s[k]-before[j] !== (loot[k]||0)))return false;
   if(JSON.stringify([s.gear,s.equipped,s.unlocked])!==inventory||
      JSON.stringify(challengeResult.rewards)!==JSON.stringify(loot))return false;
  }
 }
 return true;
})()`),true,'material reward previews match a single clear payout at all tested tiers');
assert.equal(run(`(()=>{
 s=starter();chooseClass('warrior');s.maxStage=6;s.relics[7]=0;
 for(const [tier,stones,iron] of [[1,45,6],[10,240,36],[11,280,42],[21,440,64],[100,550,80]]){
  const loot=materialDungeonLoot(1,tier);
  if(loot.stones!==stones||loot.starIron!==iron)return false;
  if(materialLootLabel(1,tier)!=='강화석 '+stones+' · 별철 '+iron)return false;
 }
 s.dungeonSelected[1]=s.dungeonLevel[1]=11;s.relics[7]=13;
 const stones=s.stones,iron=s.starIron;
 startDungeon(1);finishDungeon(false);
 if(s.stones!==stones||s.starIron!==iron||Object.keys(challengeResult.rewards).length)return false;
 startDungeon(1);askDungeonExit();confirmDungeonExit();
 if(!challengeResult.abandoned||s.stones!==stones||s.starIron!==iron)return false;
 startDungeon(1);finishDungeon(true);
 const result=challengePopup(),saved=migrate(JSON.parse(JSON.stringify(s)));
 return result.includes('강화석')&&result.includes('별철')&&
  saved.stones-stones===280&&saved.starIron-iron===42;
})()`),true,'armory materials from tier one, result, reload, failure and abandonment');
console.log('PASS adventure drops, carry/reload, offline gold, expedition payouts, ticket labels and 300 archived guardian artwork selections');

