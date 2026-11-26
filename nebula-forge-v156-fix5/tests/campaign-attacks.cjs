// Run one real stage at 1x, with identical gear and a repeatable combat clock.
const assert=require('node:assert/strict');
const {run,ctx}=require('./harness.cjs');
const jobs=new Map();
let now=1800000000000,sequence=0;
ctx.clock=()=>now;
ctx.setTimeout=(fn,delay=0)=>{jobs.set(++sequence,{fn,at:now+delay});return sequence};
ctx.clearTimeout=id=>jobs.delete(id);
ctx.advanceClock=()=>{
 now+=50;
 for(const [id,job] of jobs)if(job.at<=now){jobs.delete(id);job.fn()}
};
run(`Date.now=clock;let combatSeed=1;
 Math.random=()=>{combatSeed=(Math.imul(combatSeed,1664525)+1013904223)>>>0;return combatSeed/4294967296};
 save=paint=paintTactics=paintBattle=render=renderScreen=playSound=damageText=()=>{};`);
function fight(build,classId,skills,seed){
 jobs.clear();ctx.fixture={...build,classId,skills,seed};now+=120000;
 return run(`(()=>{
  const f=fixture;cancelCombatAnimation();s=starter();chooseClass(f.classId);
  s.stage=s.maxStage=f.stage;s.campaignCleared=f.stage-1;s.level=f.level;
  s.stats=[f.growth,f.speed,1,f.growth,f.crit||25,f.crit||25,f.stage<=50?1:f.crit||25];if(f.relics)s.relics.fill(f.relics);
  s.gear.forEach(g=>{g.r=f.gear;g.set=2});s.gearSlotLevels.fill(f.plus);currentWeapon().plus=f.weapon;s.constellation=f.constellation||0;
  for(const id of classSkillIds())s.skills[id]=f.skillLevel;
  s.auto=s.autoBoss=true;s.autoSkills=f.skills;s.effects=s.sound=false;s.speed=1;
  applySkillPreset(f.stage%10?'hunt':'boss');
  if(new Set(s.slots).size!==4||s.slots.includes(-1))throw Error('Expected four equipped skills');
  dungeonRun=null;heroReviveUntil=enemyRespawnUntil=combatTimer=0;
  cooldowns.fill(0);s.enemyHp=maxHp();heroCurrentHp=health();combatSeed=f.seed;
  const start=Date.now(),attack=power();let basics=0,casts=0;
  for(let t=0;t<180000;t+=50){
   advanceClock();if(s.stage!==f.stage||s.campaignCompleted||s.lastCombatDefeat?.at>=start)break;
   if(t%100===0){
    combatTimer+=.1;
    if(combatTimer>=1.15/attackSpeed()){
     const slot=s.autoSkills?s.slots.findIndex((k,i)=>slotOpen(i)&&cooldowns[i]<=0&&autoSkillUsable(k)):-1;
     if(slot>=0&&cast(slot,true)){combatTimer=0;casts++}
     else if(hit()){combatTimer=0;basics++}
    }
   }
   if(t%250===0){tickTactics();updateCombatSurvival(.25);paintCooldowns()}
  }
  return {clear:s.stage>f.stage||s.campaignCompleted,sec:(Date.now()-start)/1000,attack,basics,casts};
 })()`);
}
const builds=[
 {stage:10,level:8,growth:30,speed:15,gear:2,plus:1,weapon:4,skillLevel:2},
 {stage:49,level:47,growth:100,speed:75,gear:7,plus:7,weapon:20,skillLevel:8},
 {stage:50,level:47,growth:100,speed:75,gear:7,plus:7,weapon:20,skillLevel:8},
 {stage:100,level:85,growth:270,speed:130,gear:9,plus:12,weapon:22,skillLevel:25},
 {stage:300,level:100,growth:300,speed:130,gear:9,plus:12,weapon:24,skillLevel:35},
 {stage:1200,level:300,growth:450,speed:130,gear:10,plus:15,weapon:25,skillLevel:100,constellation:150,crit:93,relics:50}
];
if(require.main===module){
 assert.equal(run(`(()=>{
  s=starter();chooseClass('warrior');dungeonRun=null;
  for(const [lv,ratio] of [[1,1.06],[50,4],[100,6],[150,6]]){
   s.level=lv;
   const expected=power()*ratio*weaponModifier('storm')*(1+criticalChance()*(criticalDamageMultiplier()-1))*attackSpeed()/1.15;
   if(adventureBasicMultiplier()!==ratio||Math.abs(expected-playerCombatStats().dps)>1e-8)return false;
  }
  for(const rank of [1,25,100]){
   s.skills[41]=rank;
   const preview=compact(Math.round(skillDamage(41,rank,true)*skillMeta(41).factor));
   if(!skillSummary(41).includes(preview)||skillDamage(21,rank,true)!==0)return false;
   s.skills[24]=rank;s.stage=7;putStatus(0,24);
   if(targetStatus(0).poison.damage!==Math.ceil(power()*.8*(1+(rank-1)*.1)))return false;
   dungeonRun={mode:'daily',i:1,n:1};putStatus(0,24);
   if(targetStatus(0).poison.damage!==Math.ceil(power()*.8*(1+(rank-1)*.15)))return false;
   dungeonRun=null;
  }
  return true;
 })()`),true,'campaign previews, support and periodic damage use the right mode');
 for(const seed of [7,19])for(const build of builds)for(const id of ['warrior','shadow','paladin','mage','archer']){
  const basic=fight(build,id,false,seed),mixed=fight(build,id,true,seed);
  console.log(seed,build.stage,id,basic.attack,basic.clear?basic.sec:'fail/'+basic.sec,mixed.clear?mixed.sec:'fail/'+mixed.sec);
  assert(basic.clear&&mixed.clear,build.stage+' '+id+' should clear with either rotation');
  assert.equal(basic.casts,0);assert(mixed.casts>0&&mixed.sec<basic.sec);
  if(build.stage%10===0)assert(basic.sec<=30);
 }
}
module.exports={fight,builds};
