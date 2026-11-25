'use strict';
const assert=require('node:assert/strict');

function game(job='warrior'){
 delete require.cache[require.resolve('./harness.cjs')];
 const {run,ctx,timers}=require('./harness.cjs');
 ctx.job=job;
 run("s=starter();chooseClass(job);s.effects=false;s.gold=s.stones=s.starIron=1e7;resetDay()");
 return {run,ctx,timers};
}
function snapshot(run,expression){return JSON.parse(run('JSON.stringify('+expression+')'))}
function price(run){return snapshot(run,'weaponCost(currentWeapon().plus)')}
function wallet(run){return snapshot(run,'({gold:s.gold,stones:s.stones,starIron:s.starIron})')}
function paid(before,cost){
 return Object.fromEntries(Object.keys(before).map(key=>[key,before[key]-cost[key]]));
}
function rigRoll(ctx,run,value){
 let count=0;
 ctx.riskRoll=()=>{count++;return value};
 run('Math.random=riskRoll');
 return ()=>count;
}
function panel(run){return run("ritualContent('weaponEnhance')")}
function checkOdds(run,success,destroy){
 const copy=panel(run).replace(/<[^>]+>/g,' ').replace(/\s+/g,' ');
 for(const [label,value] of [['성공',success],['유지',100-success-destroy],['파괴',destroy]]){
  assert.ok(copy.includes(label+' '+value+'%'),label+' '+value+'%');
 }
}
const open="openWeaponRitual('weaponEnhance')";

{
 const {run}=game();
 assert.deepEqual(snapshot(run,'[s.forgeGuards,s.forgeGuardOn]'),[0,false]);
 for(const [count,enabled,expected] of [[undefined,undefined,[0,false]],[-2,true,[0,false]],[0,true,[0,false]],[3.9,true,[3,true]],[2,false,[2,false]]]){
  const raw=snapshot(run,'s');
  delete raw.forgeGuards;delete raw.forgeGuardOn;
  if(count!==undefined)raw.forgeGuards=count;
  if(enabled!==undefined)raw.forgeGuardOn=enabled;
  run('s=migrate('+JSON.stringify(raw)+')');
  assert.deepEqual(snapshot(run,'[s.forgeGuards,s.forgeGuardOn]'),expected);
  run('s=migrate(JSON.parse(JSON.stringify(s)))');
  assert.deepEqual(snapshot(run,'[s.forgeGuards,s.forgeGuardOn]'),expected);
 }
 assert.equal(run('RESOURCE_NAMES.forgeGuards'),'파괴 방지권');
 console.log('PASS legacy, invalid and persisted guard inventory');
}

{
 const {run,ctx}=game();
 const rolls=rigRoll(ctx,run,.999);
 run('s.effects=true;currentWeapon().plus=15;s.forgeGuards=1;'+open);
 assert.equal(run('setForgeGuard(false)'),true);
 const before=wallet(run),cost=price(run);
 assert.equal(run('attemptWeaponEnhance();weaponRitual.phase'),'warning');
 assert.match(panel(run),/파괴되면 \+0 기본 무기로 돌아갑니다/);
 assert.match(panel(run),/이번 접속 동안 다시 묻지 않기/);
 assert.equal(run('attemptWeaponEnhance()'),false);
 assert.equal(run('settleWeaponAim()'),false);
 assert.equal(run('cancelForgeRisk();weaponRitual.phase'),'choose');
 run('attemptWeaponEnhance();dismissPopup()');
 assert.equal(run('confirmForgeRisk(true)'),false);
 assert.deepEqual(wallet(run),before);
 assert.equal(rolls(),0);
 assert.equal(run('s.forgeManualTries'),0);
 run(open+';attemptWeaponEnhance()');
 assert.equal(run('confirmForgeRisk(false);weaponRitual.phase'),'aim');
 assert.equal(run('confirmForgeRisk(true)'),false);
 assert.equal(rolls(),0);
 assert.deepEqual(wallet(run),before);
 assert.equal(run('settleWeaponAim();weaponRitual.result.outcome'),'keep');
 assert.deepEqual(wallet(run),paid(before,cost));
 assert.equal(rolls(),1);
 assert.equal(run(open+';attemptWeaponEnhance();weaponRitual.phase'),'warning');
 assert.equal(run('confirmForgeRisk(true);weaponRitual.phase'),'aim');
 run('settleWeaponAim()');
 assert.equal(run(open+';attemptWeaponEnhance();weaponRitual.phase'),'aim');
 const saved=snapshot(run,'s');
 const reloaded=game();reloaded.ctx.oldSave=saved;
 assert.equal(reloaded.run('s=migrate(oldSave);'+open+';attemptWeaponEnhance();weaponRitual.phase'),'warning');
 console.log('PASS risk confirmation precedes payment and aim, cancel and close do not grant consent, session opt-out resets on reload');
}

for(const [level,success,destroy] of [[14,25,0],[15,20,4],[20,7,9],[24,2,14]]){
 const rows=[[success/200,'success'],[(success+destroy+99.999)/200,'keep']];
 if(destroy)rows.push([(success+destroy/2)/100,'destroy']);
 for(const enabled of [false,true])for(const [roll,rawOutcome] of rows){
  const {run,ctx}=game();
  ctx.at=level;ctx.enabled=enabled;
  run('currentWeapon().plus=at;s.forgeGuards=1;'+open);
  checkOdds(run,success,destroy);
  assert.equal(panel(run).includes('setForgeGuard('),destroy>0);
  if(destroy)assert.equal(run('setForgeGuard(enabled)'),true);
  const before=wallet(run),cost=price(run);
  const rolls=rigRoll(ctx,run,roll);
  assert.equal(run('attemptWeaponEnhance()'),true);
  if(destroy&&!enabled){
   assert.equal(run('weaponRitual.phase'),'warning');
   checkOdds(run,success,destroy);
   assert.equal(rolls(),0);
   assert.equal(run('confirmForgeRisk()'),true);
  }
  const blocked=rawOutcome==='destroy'&&enabled;
  assert.equal(run('weaponRitual.result.outcome'),blocked?'keep':rawOutcome);
  assert.equal(run('weaponRitual.result.protected'),blocked);
  checkOdds(run,success,destroy);
  assert.equal(run('currentWeapon().plus'),rawOutcome==='success'?level+1:rawOutcome==='destroy'&&!blocked?0:level);
  assert.equal(run('s.forgeGuards'),blocked?0:1);
  assert.equal(run('s.forgeGuardOn'),!!destroy&&enabled&&!blocked);
  assert.equal(run('attemptWeaponEnhance()||confirmForgeRisk()||settleWeaponAim()'),false);
  assert.equal(rolls(),1);
  assert.deepEqual(wallet(run),paid(before,cost));
  assert.equal(run('adventureBook().daily.count.weaponForge'),1);
  if(blocked){
   assert.match(panel(run),/파괴 방지권이 무기를 지켰습니다/);
   run(open);assert.match(panel(run),/방지권 없음/);
   run('setForgeGuard(true)');
   assert.equal(run('s.forgeGuardOn'),false);
   assert.equal(run('attemptWeaponEnhance();weaponRitual.phase'),'warning');
  }
 }
 console.log('PASS +'+level+' real enhancement outcomes, single roll, price and guard consumption');
}

{
 const {run,ctx}=game(),tasks=[],classes=new Set(),sounds=[];
 ctx.setTimeout=(fn,delay)=>{tasks.push({fn,delay});return tasks.length};
 ctx.document.getElementById('content').querySelector=selector=>selector==='.weapon-ritual'?{classList:{
  add:key=>classes.add(key),remove:key=>classes.delete(key)
 }}:null;
 ctx.soundLog=sound=>sounds.push(sound);
 run("s.effects=true;s.weapons.warrior=readWeapon({plus:20});playSound=soundLog;"+open);
 const rolls=rigRoll(ctx,run,.08);
 run('attemptWeaponEnhance();confirmForgeRisk()');
 checkOdds(run,7,9);
 run('settleWeaponAim()');
 checkOdds(run,7,9);
 assert.equal(rolls(),1);
 assert.equal(run('weaponRitual.phase'),'working');
 assert.ok(panel(run).includes('season-weapons/warrior-4.webp'));
 assert.equal(classes.size,0);
 const finish=tasks.find(t=>t.delay===run('FORGE_SHOT_MS'));
 assert.ok(finish);
 finish.fn();finish.fn();
 assert.equal(run('weaponRitual.phase'),'done');
 assert.ok(panel(run).includes('weapon-forge/warrior-0.webp'));
 assert.ok(classes.has('forge-destroyed'));
 assert.equal(sounds.filter(sound=>sound==='impact').length,1);
 const flashEnds=tasks.filter(t=>t.delay===300);
 assert.equal(flashEnds.length,1);
 flashEnds[0].fn();assert.equal(classes.size,0);
 console.log('PASS destroyed appearance, one impact and 300ms red flash follow the hammer animation');
}

for(const [i,job] of ['warrior','shadow','paladin','mage','archer'].entries()){
 const {run,ctx,timers}=game(job);
 const initial=snapshot(run,'({item:equippedItem(0),attack:weaponAttack(currentWeapon()),art:weaponTile()})');
 ctx.peak=i%2===0?24:25;
 run(`const raw=JSON.parse(JSON.stringify(s));
  delete raw.weaponVersion;delete raw.weapons;
  raw.gear.push({id:'inherited-master',p:0,r:MASTERWORKS[0].r,plus:13,masterwork:0,set:8,locked:true});
  raw.gear.push({id:'spare-blade',p:0,r:0,plus:1,set:0,locked:true});
  s=migrate(raw);s.starIron=1000;
  Object.assign(currentWeapon(),{plus:24,legacyAttack:1240,xp:73,runes:{fire:2,frost:1,storm:1},seen:4,skin:1,owned:[1,2]});
  s.highestGearPlus=peak;s.unlocked['0_10']=true;
  s=migrate(JSON.parse(JSON.stringify(s)));
  const equipped=currentWeapon();`);
 assert.equal(run('s.highestGearPlus'),ctx.peak);
 assert.equal(run('equipped.inheritedPlus'),13);
 assert.equal(run('equipped.skin'),5);
 assert.equal(run('equipped.peakPlus'),24);
 assert.ok(run('equipped.master&&weaponAttack(equipped)>1240'));
 const preserved=`({runes:currentWeapon().runes,xp:currentWeapon().xp,seen:currentWeapon().seen,
  weaponPeak:currentWeapon().peakPlus,codex:s.unlocked,peak:s.highestGearPlus,gear:s.gear,
  equipped:s.equipped,slotLevels:s.gearSlotLevels,otherJobs:Object.entries(s.weapons).filter(([id])=>id!==job)})`;
 const before=snapshot(run,preserved);
 const rolls=rigRoll(ctx,run,.05);
 run(open+';attemptWeaponEnhance();confirmForgeRisk()');
 assert.equal(run('weaponRitual.result.outcome'),'destroy');
 assert.equal(rolls(),1);
 assert.match(panel(run),/무기가 부서져 기본 무기로 돌아갔습니다/);
 for(let reload=0;reload<=1;reload++){
  if(reload)run('s=migrate(JSON.parse(JSON.stringify(s)))');
  assert.deepEqual(snapshot(run,preserved),before,job+' persisted progression and loadout');
  run("openMenu('weaponSkins')");
  const gallery=run("EXTRA_POPUPS[view][1]()");
  const cells=gallery.split(/class="skin-specimen/).slice(1);
  assert.equal(cells.length,7);assert.match(cells[0],/aria-current="true"/);
  for(let id=1;id<=5;id++)assert.match(cells[id].replace(/<[^>]+>/g,' '),/달성(?! 시)/);
  assert.match(cells[6],/\+25 달성 시/);
  assert.deepEqual(snapshot(run,'({item:equippedItem(0),attack:weaponAttack(currentWeapon()),art:weaponTile()})'),initial);
  assert.deepEqual(snapshot(run,'[currentWeapon().basic,currentWeapon().inheritedPlus,currentWeapon().master,currentWeapon().legacyAttack,currentWeapon().grade,currentWeapon().skin]'),[true,0,false,0,0,0]);
 }
 run("dismissPopup();s.stage=s.maxStage=3;heroCurrentHp=health();const foe=ensureEncounter().foes[0];ensureEncounter().readyAt=0;const hpBefore=foe.hp");
 assert.equal(run('hit()'),true);
 const impact=run('classAttackTimers[0]');
 timers[impact-1]();
 assert.ok(run('foe.hp<hpBefore'),job+' landed a normal attack after destruction');
 console.log('PASS '+job+' inherited weapon returns to its exact equipped +0 starter and damages an enemy after reload');
}
