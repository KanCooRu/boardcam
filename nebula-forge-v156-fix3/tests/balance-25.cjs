'use strict';
const assert=require('node:assert/strict');
const {run}=require('./harness.cjs');
function check(name,fn){assert.equal(run('('+fn.toString()+')()'),true,name);console.log('PASS',name)}
check('all 25 enhancement odds and every outcome boundary agree with the maximum gate',()=>{
 s=starter();chooseClass('warrior');s.effects=false;
 const success=[100,95,90,85,80,75,70,65,60,50,45,40,35,30,25,20,18,15,12,10,7,5,4,3,2];
 const destroy=[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4,5,6,7,8,9,10,11,12,14],w=currentWeapon();
 if(WEAPON_MAX_PLUS!==25)return false;
 for(let at=0;at<25;at++){
  w.plus=at;w.misses=17;
  const odds=weaponEnhanceOdds(at),end=success[at]+destroy[at];
  if(odds.success!==success[at]||odds.destroy!==destroy[at]||odds.keep!==100-end||enhanceChance(w)!==success[at])return false;
  for(const roll of [0,success[at]-.00001,success[at],end-.00001,end,99.99999]){
   if(roll>=100)continue;
   const expected=roll<success[at]?'success':roll<end?'destroy':'keep';
   if(weaponEnhanceOutcome(at,roll)!==expected)return false;
  }
 }
 s.gold=s.stones=s.starIron=1e8;w.plus=25;openWeaponRitual('weaponEnhance');
 const gold=s.gold;
 return !canPayWeapon(w)&&!attemptWeaponEnhance()&&s.gold===gold&&enhanceChance(w)===0&&ritualContent('weaponEnhance').includes('최고 강화 달성');
});
check('saved levels above 25 cap once without reducing previously earned weapon attack',()=>{
 for(const level of [26,50,80,100]){
  s=starter();chooseClass('warrior');const raw=JSON.parse(JSON.stringify(s)),w=raw.weapons.warrior;
  w.plus=level;w.misses=19;delete w.balanceVersion;delete w.legacyAttack;
  const old=12*((1+.075*Math.min(level,15))*Math.pow(1.064,level)-1);
  s=migrate(raw);const attack=weaponAttack(currentWeapon());
  if(currentWeapon().plus!==25||currentWeapon().misses!==0||attack<old-1e-7)return false;
  s=migrate(JSON.parse(JSON.stringify(s)));
  if(weaponAttack(currentWeapon())!==attack||currentWeapon().plus!==25)return false;
 }
 return true;
});
check('all eleven weapon records are reachable before the +25 cap',()=>{
 s=starter();chooseClass('warrior');s.effects=false;s.gold=s.stones=s.starIron=1e9;
 s.forgeGuards=1;s.forgeGuardOn=true;
 const original=Math.random;Math.random=()=>0;
 try{
  for(let i=1;i<=25;i++){
   openWeaponRitual('weaponEnhance');if(!attemptWeaponEnhance()||currentWeapon().plus!==i)return false;
  }
 }finally{Math.random=original;}
 return s.forgeGuards===1&&WEAPON_CODEX_LEVELS.length===11&&WEAPON_CODEX_LEVELS.at(-1)===25&&WEAPON_CODEX_LEVELS.every((level,i)=>weaponGrade(level)===i&&s.unlocked['0_'+i]);
});
check('starter weapon attack keeps its precision in combat and rounds the same way in the forge preview, receipt and growth tab',()=>{
 s=starter();chooseClass('warrior');s.effects=false;s.gold=s.stones=s.starIron=1e8;
 s.forgeGuards=1;s.forgeGuardOn=true;
 const random=Math.random,plain=html=>html.replace(/<[^>]+>/g,'');
 const cases=[
  [5,47.7196800000,'33','48'],
  [10,210.9025112064,'161','211'],
  [15,727.5370355801,'573','728'],
  [20,2288.2559954685,'1,828','2,288'],
  [25,6856.5275983730,'5,521','6,857']
 ];
 try{
  Math.random=()=>0;
  for(const [level,attack,from,to] of cases){
   currentWeapon().plus=level-1;s=migrate(JSON.parse(JSON.stringify(s)));
   const w=currentWeapon(),transition='무기 공격력 '+from+' → '+to;
   openWeaponRitual('weaponEnhance');
   if(!plain(ritualContent('weaponEnhance')).includes(transition)||!attemptWeaponEnhance()||w.plus!==level||
      !plain(ritualContent('weaponEnhance')).includes(transition))return false;
   if(Math.abs(weaponAttack(w)-attack)>1e-7||gearValue(equippedItem(0))!==weaponAttack(w)||w.legacyAttack!==0)return false;
   navigate('forge','weapon');
   if(!forgeScreen().includes('무기 공격력 '+to+'</span>'))return false;
  }
  currentWeapon().plus=24;s=migrate(JSON.parse(JSON.stringify(s)));
  openWeaponRitual('weaponEnhance');setForgeGuard(false);Math.random=()=>.05;
  if(!attemptWeaponEnhance()||!confirmForgeRisk()||weaponRitual.result.outcome!=='destroy')return false;
  if(currentWeapon().plus!==0||weaponAttack(currentWeapon())!==0||gearValue(equippedItem(0))!==0)return false;
  navigate('forge','weapon');if(!forgeScreen().includes('무기 공격력 0</span>'))return false;
  openWeaponRitual('weaponEnhance');
  return plain(ritualContent('weaponEnhance')).includes('무기 공격력 0 → 5');
 }finally{Math.random=random}
});
check('critical damage and penetration thresholds feed live calculations for all classes',()=>{
 for(const c of CLASSES){
  s=starter();chooseClass(c.id);const w=currentWeapon();
  for(const [level,crit,pen] of [[0,.10,0],[10,.10,0],[11,.12,0],[20,.30,0],[21,.32,.01],[25,.40,.05]]){
   w.plus=level;
   if(Math.abs(criticalDamageBonus()-crit)>1e-9||Math.abs(armorPenetration()-pen)>1e-9)return false;
  }
 }
 return true;
});
check('heart at 60 grants penetration and grail at 80 grants critical damage',()=>{
 s=starter();chooseClass('warrior');s.relicShards=100;s.maxStage=59;
 if(REL.length!==8||s.relics.length!==8||REL[5][0]!=='대지의 심장'||REL[7][0]!=='붉은 맹세의 성배')return false;
 relicLevel(5);s.maxStage=60;relicLevel(5);
 if(s.relics[5]!==1||s.relicShards!==95||Math.abs(armorPenetration()-.002)>1e-9)return false;
 s.maxStage=79;relicLevel(7);if(s.relics[7]||s.relicShards!==95)return false;
 s.maxStage=80;const loot=JSON.stringify([0,1,2].map(i=>materialDungeonLoot(i,10)));
 relicLevel(7);s=migrate(JSON.parse(JSON.stringify(s)));
 if(s.relics[7]!==1||s.relicShards!==90||Math.abs(criticalDamageBonus()-.11)>1e-9||Math.abs(armorPenetration()-.002)>1e-9)return false;
 if(loot!==JSON.stringify([0,1,2].map(i=>materialDungeonLoot(i,10))))return false;
 for(const id of [5,7]){tab=id;const html=relicPopup();if(!html.includes(relicEffectText(id,1))||!html.includes(relicEffectText(id,2)))return false;}
 const screen=relicsScreen();
 return screen.includes('8 / 8 해금 · STAGE 10–80')&&!screen.includes('균열의 송곳')&&!screen.includes('승리의 서')&&REL.every((_,i)=>{tab=i;return screen.includes(art('relic'+i))&&relicPopup().includes(art('relic'+i))&&HD_ART['relic'+i][0]==='relic-treasures'});
});
check('old rosters refund the exact retired upgrade costs once and preserve the grail independently',()=>{
 for(const [old,grail,refund] of [
  [[1,2,3,4],0,0],
  [[1,2,3,4,5,6,7,3],0,21],
  [[1,2,3,4,5,6,7,3,2,9],9,33],
  [[1,2,3,4,5,6,7,50,50,50],50,5400]
 ]){
  const raw=starter();delete raw.relicRosterVersion;raw.relics=old;raw.relicShards=50;
  const expected=[...Array.from({length:7},(_,i)=>old[i]||0),grail];
  let saved=raw;
  for(let round=0;round<3;round++){
   saved=migrate(JSON.parse(JSON.stringify(saved)));
   if(saved.relicRosterVersion!==2||JSON.stringify(saved.relics)!==JSON.stringify(expected)||saved.relicShards!==50+refund)return false;
  }
 }
 return true;
});
check('owned companions stack, only equipped traits apply, and only legendary partners have two',()=>{
 s=starter();chooseClass('warrior');
 const distinct=new Set();
 for(let id=0;id<COMPANIONS.length;id++){
  const kinds=Object.keys(COMPANIONS[id][2]);
  if(kinds.length!==(petTier(id).name==='전설'?2:1))return false;
  for(const kind of kinds){if(distinct.has(kind))return false;distinct.add(kind)}
  s.pets[id]=25;
 }
 s=migrate(JSON.parse(JSON.stringify(s)));s.activePet=-1;
 const held=petHoldingBonus(),attack=power(),gold=goldGain(100);
 const expected=COMPANIONS.reduce((total,_,i)=>total+petHoldingEffect(i,25),0);
 if(held!==expected)return false;
 for(let id=0;id<COMPANIONS.length;id++){
  s.activePet=id;
  if(petHoldingBonus()!==held)return false;
  for(const kind of distinct){
   if(petSpecial(kind)!==petEffectValue(id,kind,25))return false;
   if(!Object.hasOwn(COMPANIONS[id][2],kind)&&petSpecial(kind)!==0)return false;
  }
  tab=id;
  const html=petDetail();
  if(!html.includes('보유 효과')||!html.includes('동행 효과')||!html.includes('적용 중'))return false;
 }
 s.activePet=-1;s.pets={};
 return petHoldingBonus()===0&&power()<attack&&goldGain(100)<gold;
});
check('companion traits change their advertised rewards and combat values',()=>{
 s=starter();chooseClass('warrior');s.mineRun={hits:99};
 for(let id=0;id<COMPANIONS.length;id++)s.pets[id]=35;
 const one=classSkillIds().find(k=>skillMeta(k).target==='single'&&SKILL_RULES[k].mult>0);
 const area=classSkillIds().find(k=>skillMeta(k).target==='all'&&SKILL_RULES[k].mult>0);
 const values=()=>({attack:power(),critical:criticalChance(),health:health(),critDamage:criticalDamageBonus(),
  offlineXp:offlineGains(3600).xp,speed:attackSpeed(),areaSkill:skillDamage(area),offlineGold:offlineGains(3600).gold,
  penetration:armorPenetration(),firstSlotSkill:skillDamage(s.slots[0]),singleSkill:skillDamage(one),gold:goldGain(100),offlineOre:offlineGains(3600).ore});
 s.activePet=-1;const base=values();
 for(let id=0;id<COMPANIONS.length;id++){
  s.activePet=id;const current=values();
  for(const kind of Object.keys(COMPANIONS[id][2])){
   if(kind==='skill'){if(current.areaSkill<=base.areaSkill||current.singleSkill<=base.singleSkill)return false}
   else if(!(current[kind]>base[kind]))return false;
  }
  if(id===5&&current.singleSkill!==base.singleSkill||id===9&&current.areaSkill!==base.areaSkill)return false;
 }
 return true;
});
check('crescent rabbit follows slot one for hits, damage over time and combat rating',()=>{
 for(const job of CLASSES){
  s=starter();chooseClass(job.id);s.maxStage=100;s.level=30;s.pets[8]=25;s.mineRun={hits:100};
  const [a,b]=classSkillIds().filter(k=>skillMeta(k).target!=='self'&&SKILL_RULES[k].mult>0&&skillMeta(k).status!=='heal');
  s.skills[a]=10;s.skills[b]=10;
  for(const [first,second] of [[a,b],[b,a]]){
   s.slots=[first,second,-1,-1];s.activePet=-1;
   const before=[skillDamage(first,10,true),skillDamage(first,10),skillDamage(second,10),combatPower(),mineReward(),power()];
   s.activePet=8;tab=8;
   if(skillDamage(first,10,true)<=before[0]||skillDamage(first,10)<=before[1]||skillDamage(second,10)!==before[2])return false;
   if(combatPower()<=before[3]||mineReward()!==before[4]||power()!==before[5])return false;
   if(!petDetail().includes('1번 슬롯 스킬 피해')||petDetail().includes('광산 채굴량'))return false;
  }
  s.slots=[-1,b,-1,-1];const emptyRating=combatPower();s.activePet=-1;if(combatPower()!==emptyRating)return false;
 }
 const poison=24;s.skills[poison]=10;s.slots=[poison,-1,-1,-1];s.activePet=-1;
 const base=skillDotRatio(poison,10,true);s.activePet=8;
 const boosted=skillDotRatio(poison,10,true);s.slots=[-1,poison,-1,-1];
 return boosted>base&&skillDotRatio(poison,10,true)===base;
});
check('outfit critical damage changes in combat, every star remains whole-percent and save-compatible',()=>{
 s=starter();chooseClass('warrior');s.costumes.push(4);s.wear=4;
 for(let star=1;star<=5;star++){
  s.skinUpgrades={'4':star};
  const expected=.1+regularHoldStats('warrior',4,star).critDamage+rowWearStats({tier:4},star).critDamage;
  if(Math.abs(criticalDamageBonus()-expected)>1e-9)return false;
 }
 return true;
});
