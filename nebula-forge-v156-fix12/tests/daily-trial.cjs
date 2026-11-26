'use strict';
const assert=require('node:assert/strict');
const {run,ctx}=require('./harness.cjs');
const DAY=86400000, MONDAY=Date.UTC(2026,10,23,3);
const KEYS=['attack','crit','critDamage','speed','skillDamage','cooldown','time','weakHp'];
let now=MONDAY,frameTime=1000,pulse,onVisibility;
ctx.testWallClock=()=>now;
ctx.performance.now=()=>frameTime;
ctx.setInterval=(f,ms)=>{if(ms===100)pulse=f;return 1};
ctx.document.addEventListener=(type,f)=>{if(type==='visibilitychange')onVisibility=f};
run('Date.now=testWallClock;load=()=>{};save=()=>{};resizeEffects=()=>{};init()');
assert.equal(typeof pulse,'function');
const data=source=>JSON.parse(run('JSON.stringify('+source+')'));
const value=JSON.stringify;
const info=()=>data('trialDayInfo()');
const options=(day,index)=>data('trialBuffOptions('+value(day)+','+index+')');
const wallet=()=>data('[s.starIron,s.stones,s.gems]');
const delta=(after,before)=>after.map((n,i)=>n-before[i]);
const near=(actual,expected,tolerance=1e-6)=>assert.ok(Math.abs(actual-expected)<=tolerance,actual+' vs '+expected);
function reset(stage=51,job='warrior'){
 run("dismissPopup();dungeonRun=null;challengeResult=null;s=starter();s.classId="+value(job)+";s.stage=s.maxStage="+stage+";s.campaignCleared="+(stage-1)+";s.auto=s.effects=false;s.speed=1;unlockClassSkills();heroCurrentHp=health();heroReviveUntil=enemyRespawnUntil=combatBusyUntil=combatTimer=0;cooldowns=[0,0,0,0];cancelCombatAnimation();resetDay()");
}
async function enter(){await run('startDailyTrial()');assert.equal(run('dungeonRun?.mode'),'trial')}
function choose(key){assert.ok(data('dungeonRun.options').includes(key));run('chooseTrialBuff('+value(key)+')');assert.equal(run('dungeonRun.choosing'),false)}
function clearFloor(){const floor=run('dungeonRun.n');run('applyDamage(Math.ceil(dungeonRun.hp)+1)');assert.equal(run('dungeonRun.n'),floor+1)}
function checkBattleHeading(floor){
 run('paintWorld()');
 assert.equal(run('document.getElementById("dungeonHeading").hidden'),false);
 assert.equal(run('document.getElementById("dungeonName").textContent'),'오늘의 탑 '+floor+'층');
 assert.equal(run('document.getElementById("stage").textContent'),'오늘의 탑');
 assert.match(run('document.getElementById("region").textContent'),new RegExp('^'+floor+'층 · [0-9]+초$'));
}
function pulseFor(ms){for(let left=ms;left>0;left-=100){frameTime+=Math.min(left,100);now+=Math.min(left,100);pulse()}}
async function settle(){for(let i=0;i<5;i++)await new Promise(resolve=>setImmediate(resolve))}
function findChoiceDay(key,repeat=false){
 for(let i=0;i<240;i++){const t=MONDAY+i*DAY;const day=data('trialDayInfo('+t+')').dayKey;
  if(options(day,0).includes(key)&&(!repeat||options(day,1).includes(key)))return t;
 }assert.fail('No fixture for '+key);
}
function confirmExit(){return run('confirmDungeonExit()')}
function requestExit(){run('askDungeonExit()');assert.equal(run('view'),'dungeonExit');return run('EXTRA_POPUPS[view][1]()')}
function popupHtml(){return run('EXTRA_POPUPS[view][1]()')}
function button(html,pattern){
 const buttons=[...html.matchAll(/<button\b[^>]*?onclick="([^"]+)"[^>]*>([\s\S]*?)<\/button>/g)];
 const selected=buttons.filter(([,handler,label])=>pattern.test(label.replace(/<[^>]+>/g,'')));
 assert.equal(selected.length,1,pattern+' in '+html);return selected[0][1];
}
async function main(){
 assert.deepEqual(data('Object.keys(TRIAL_BUFFS)').sort(),[...KEYS].sort());
 const all=new Set(),weakness=new Set();
 for(let day=0;day<12;day++){
  now=MONDAY+day*DAY;const d=info();weakness.add(d.weakness);
  for(let i=0;i<6;i++){const list=options(d.dayKey,i);assert.equal(new Set(list).size,3);assert.deepEqual(options(d.dayKey,i),list);for(const key of list){assert.ok(KEYS.includes(key));all.add(key)}}
 }
 assert.equal(all.size,8);assert.deepEqual([...weakness].sort(),['fire','frost','storm']);
 now=Date.UTC(2026,10,22,14,59,59,999);const sunday=info();now++;
 assert.notEqual(info().dayKey,sunday.dayKey);assert.notEqual(info().weekKey,sunday.weekKey);
 now=MONDAY;reset(50);await run('startDailyTrial()');assert.equal(run('dungeonRun'),null);assert.equal(run('s.daily.trialRuns||0'),0);
 reset();const entry=run("dungeonEntryState('trial')"),hub=run('contentHub()');
 assert.deepEqual(Array.from(hub.matchAll(/<article[^>]+data-dungeon="(\w+)"/g),m=>m[1]),['trial','mine','explore']);
 assert.match(hub,/도전 횟수 갱신/);assert.doesNotMatch(hub,/콘텐츠별 3장 충전/);
 assert.match(run('dungeonResetBanner()'),/콘텐츠별 3장 충전/);
 assert.equal(run("dungeonBanner('tower')"),'');
 assert.match(run("dungeonBanner('trial')"),/오늘의 탑[\s\S]*startDailyTrial\(\)[\s\S]*주간 순위/);
 assert.equal(entry.disabled,false);
 assert.ok(run("Object.hasOwn(DUNGEON_BANNERS,'trial')&&!Object.hasOwn(ENTRY_PASSES,'trial')"));
 console.log('PASS stage 50 clear gates a distinct challenge with three deterministic choices and Korean day/week rollover');

 const sameDay=info().dayKey;
 for(const [job,stage,growth] of [['mage',51,0],['archer',300,80]]){
  reset(stage,job);run('s.stats[0]='+growth);await enter();
  assert.deepEqual(data('dungeonRun.options'),options(sameDay,0));assert.equal(run('dungeonRun.weakness'),info().weakness);
  near(run('dungeonRun.maxHp'),run('MONSTER_DIFFICULTY*5000'));
  choose(data('dungeonRun.options').find(k=>k!=='weakHp'));
  clearFloor();near(run('dungeonRun.maxHp'),run('MONSTER_DIFFICULTY*5000*1.3'));
  requestExit();await confirmExit();await settle();
 }
 reset();const date=info(),firstWallet=wallet(),preTower=data('[s.towerFloor,s.towerBest??null]');
 await enter();checkBattleHeading(1);let offered=data('dungeonRun.options');
 assert.deepEqual(offered,options(date.dayKey,0));assert.equal(run('dungeonRun.weakness'),date.weakness);
 assert.equal(run('s.daily.trialRuns'),1);assert.deepEqual(wallet(),firstWallet);
 assert.deepEqual(data('[dungeonRun.n,dungeonRun.floors,dungeonRun.damage,dungeonRun.time]'),[1,0,0,90]);
 near(run('dungeonRun.maxHp'),run('MONSTER_DIFFICULTY*5000'));
 run('chooseTrialBuff("no-such-effect");applyDamage(500);performClassAttack(-1,true);updateCombatSurvival(2);tickTactics()');
 pulseFor(2400);assert.deepEqual(data('[dungeonRun.hp,dungeonRun.time,dungeonRun.damage,heroCurrentHp]'),[run('dungeonRun.maxHp'),90,0,run('health()')]);
 ctx.document.hidden=true;onVisibility();now+=62000;ctx.document.hidden=false;onVisibility();
 assert.equal(run('dungeonRun.time'),90);
 let confirmation=requestExit();assert.match(confirmation,/보상/);assert.match(confirmation,/입장|횟수/);
 let resume=button(confirmation,/계속/);run(resume);assert.equal(run('dungeonRun.choosing'),true);
 assert.deepEqual(data('dungeonRun.options'),offered);
 choose(offered.find(k=>k!=='time'&&k!=='weakHp'));clearFloor();
 const combatSnapshot=data('[dungeonRun.n,dungeonRun.hp,dungeonRun.time,dungeonRun.damage,dungeonRun.picks]');
 confirmation=requestExit();pulseFor(1300);run(button(confirmation,/계속/));assert.deepEqual(data('[dungeonRun.n,dungeonRun.hp,dungeonRun.time,dungeonRun.damage,dungeonRun.picks]'),combatSnapshot);
 confirmation=requestExit();assert.equal((confirmation.match(/onclick="confirmDungeonExit\(\)"/g)||[]).length,1);
 await confirmExit();await settle();assert.equal(run('dungeonRun'),null);assert.equal(run('s.daily.trialRuns'),1);
 assert.deepEqual(wallet(),firstWallet);assert.deepEqual(data('[s.trial.bestScore,s.trial.bestFloors]'),[0,0]);
 assert.deepEqual(data('[s.towerFloor,s.towerBest??null]'),preTower);
 console.log('PASS choosing pauses taps, clock and background time; continue restores choice and combat; forfeit consumes the entry with no score or rewards');

 await enter();assert.deepEqual(data('dungeonRun.options'),offered);assert.equal(run('dungeonRun.weakness'),date.weakness);
 choose(offered.find(k=>k!=='weakHp'));run('heroCurrentHp=health()*.4');clearFloor();near(run('heroCurrentHp/health()'),.55,.01);
 run('heroCurrentHp=health()');clearFloor();near(run('heroCurrentHp'),run('health()'));clearFloor();
 checkBattleHeading(4);assert.equal(run('dungeonRun.choosing'),true);assert.deepEqual(data('dungeonRun.options'),options(date.dayKey,1));
 choose(data('dungeonRun.options').find(k=>k!=='weakHp'));const base=run('TRIAL_BASE_HP');
 near(run('dungeonRun.maxHp'),base*1.3**3,1);
 const beforeKill=wallet();run('applyDamage(dungeonRun.maxHp/2);heroCurrentHp=0;resolveHeroDefeat()');await settle();
 assert.equal(run('dungeonRun'),null);assert.deepEqual(delta(wallet(),beforeKill),[10,30,30]);
 const result=data('challengeResult');assert.equal(result.floors,3);near(result.score,3500,1);assert.equal(result.bestScore,result.score);assert.equal(result.bestFloors,3);assert.equal(result.picks.length,2);
 assert.deepEqual(data('[s.trial.bestScore,s.trial.bestFloors]'),[result.score,3]);
 const receipt=popupHtml();assert.match(receipt,/최고/);assert.match(receipt,/점수/);for(const key of [offered.find(k=>k!=='weakHp'),options(date.dayKey,1).find(k=>k!=='weakHp')])assert.ok(receipt.includes(run('TRIAL_BUFFS['+value(key)+'].label')));
 const settledWallet=wallet();assert.equal(await run('settleDailyTrial(challengeResult,challengeResult.score)'),null);assert.deepEqual(wallet(),settledWallet);
 await enter();choose(data('dungeonRun.options')[0]);run('dungeonRun.time=.05');pulseFor(100);await settle();
 assert.equal(run('dungeonRun'),null);assert.deepEqual(delta(wallet(),settledWallet),[10,30,0]);assert.equal(run('s.trial.bestScore'),result.score);
 assert.equal(run('s.daily.trialRuns'),3);await run('startDailyTrial()');assert.equal(run('dungeonRun'),null);
 assert.deepEqual(data('[s.towerFloor,s.towerBest??null]'),preTower);
 now=MONDAY+DAY;await enter();assert.equal(run('s.daily.trialRuns'),1);assert.equal(run('s.trial.bestScore'),result.score);
 requestExit();await confirmExit();await settle();
 now=MONDAY+7*DAY;await enter();assert.deepEqual(data('[s.daily.trialRuns,s.trial.bestScore,s.trial.bestFloors]'),[1,0,0]);
 console.log('PASS death and actual clock expiry pay once; only first settled run gets gems, daily quota and weekly records reset independently');
 await checkEffects();
 await checkAccountReceipts();
}
async function checkEffects(){
 // Every pair of picks is obtained from the real dated offer on floors 1 and 4.
 for(const key of KEYS){
  now=findChoiceDay(key,true);reset();const attackStats='[power(),criticalChance(),criticalDamageMultiplier(),attackSpeed(),skillDamage(0,1,false)]';
  const original=data(attackStats);await enter();
  for(let count=1;count<=2;count++){
   const floor=run('dungeonRun.n'),time=run('dungeonRun.time');
   choose(key);const changed=data(attackStats);
   assert.equal(run('dungeonRun.buffs['+value(key)+']'),count);
   switch(key){
    case 'attack':near(changed[0],Math.floor(original[0]*(1+.25*count)),1);break;
    case 'crit':near(changed[1],original[1]+.15*count);break;
    case 'critDamage':near(changed[2],original[2]+.5*count);break;
    case 'speed':near(changed[3],original[3]*(1+.2*count));break;
    case 'skillDamage':near(changed[4],Math.ceil(original[4]*(1+.4*count)),1);break;
    case 'cooldown':{
     const cooldown=run("(()=>{const k=s.slots[0];tacticsState().ready={};tacticsState().classReadyAt=0;combatBusyUntil=0;if(!performClassAttack(k))return -1;return (tacticsState().ready[k]-Date.now())/1000/SKILL_RULES[k].cd})()");
     near(cooldown,1-.25*count);run('cancelCombatAnimation()');break;
    }
    case 'time':assert.equal(run('dungeonRun.time'),time+8);break;
    case 'weakHp':near(run('dungeonRun.maxHp'),run('trialBossHp('+floor+')')*.8,1e-5);break;
   }
   for(let i=0;i<3;i++){
    if(key==='weakHp')near(run('dungeonRun.maxHp'),run('trialBossHp(dungeonRun.n)')*.8,1e-5);
    clearFloor();
   }
   if(key==='weakHp')near(run('dungeonRun.maxHp'),run('trialBossHp(dungeonRun.n)'),1e-5);
  }
  assert.equal(run('dungeonRun.selection'),2);assert.equal(run('dungeonRun.choosing'),true);
  assert.deepEqual(data('dungeonRun.options'),options(info().dayKey,2));
  requestExit();await confirmExit();await settle();
  assert.deepEqual(data(attackStats),original,key+' must end with the run');
  assert.equal(run('trialMod('+value(key)+')'),0);
 }
 console.log('PASS all eight real buffs can be chosen twice; live stats, held cooldown and three-floor HP expiration stay local to the run');

 // Use actual hit resolution, bypassing random crits and attack animations only.
 // All nonmatching rune levels are fixed across observations of each element.
 const allDays=new Set();
 for(let day=0;day<3;day++){
  now=MONDAY+day*DAY;reset();const element=info().weakness;allDays.add(element);
  run('currentWeapon().runes['+value(element)+']=3');
  const entry=run("dungeonEntryState('trial')");assert.equal(entry.rank,3);
  const guide=run("trialEntryGuide(dungeonEntryState('trial'))");assert.ok(guide.includes(run('WEAPON_ELEMENTS['+value(element)+'].name')));assert.match(guide,/3단계/);assert.match(guide,/18%/);
  await enter();choose(data('dungeonRun.options').find(k=>k!=='weakHp'));
  const dealt=level=>run("(()=>{currentWeapon().runes["+value(element)+"]="+level+";const before=dungeonRun.hp;const k=0;const ok=tacticalImpact(100,false,combatEncounter(),combatSerial,SKILL_RULES[k].effect,true,k);if(!ok)return -1;return before-dungeonRun.hp})()");
  const baseline=dealt(0);assert.ok(baseline>0);
  for(const level of [1,3,5])near(dealt(level),baseline*(1+.06*level),1);
  run('currentWeapon().runes['+value(element)+']=0');
  for(const other of ['fire','frost','storm'].filter(k=>k!==element)){
   run('currentWeapon().runes['+value(other)+']=5');assert.equal(dealt(0),baseline);
  }
  requestExit();await confirmExit();await settle();assert.equal(run("trialMod('weakness')"),0);
 }
 assert.equal(allDays.size,3);
 console.log('PASS every daily weakness displays the equipped rune and modifies actual hit resolution by 6% per matching level');
}
async function checkAccountReceipts(){
 now=MONDAY;reset();
 const pending=[],serverNow=now+DAY,calendar={...data('trialDayInfo('+serverNow+')'),serverNow,used:0};
 const firstId='82d221a7-9351-4b5e-bf7a-c984d65ea94a',secondId='12bf0b3f-03b1-4220-84e9-eb385c05ba20';
 ctx.AbortController=AbortController;
 ctx.fetch=async url=>{assert.equal(url,'/api/trial/today');return Response.json(calendar)};
 ctx.commandForTrialTest=(action,body)=>new Promise(resolve=>pending.push({action,body,resolve}));
 run("saveGuard.usesServer=()=>true;saveGuard.command=commandForTrialTest");
 await run('refreshTrialCalendar()');assert.equal(run('trialCalendar().dayKey'),calendar.dayKey);
 const before=wallet();
 const click=button(run("trialEntryGuide(dungeonEntryState('trial'))"),/입장/);
 const first=run(click);assert.equal(await run(click),false);
 assert.equal(pending.length,1);assert.equal(pending[0].action,'trialStart');assert.deepEqual({...pending[0].body},{});
 assert.equal(run('dungeonRun'),null);assert.equal(run('s.daily.trialRuns'),0);
 pending.shift().resolve(null);assert.equal(await first,false);assert.equal(run('s.daily.trialRuns'),0);
 function accept(mode,attempt,runId){
  const req=pending.shift();
  if(mode==='start'){
   assert.equal(req.action,'trialStart');assert.deepEqual({...req.body},{});
  }else{
   assert.equal(req.action,'trialFinish');assert.deepEqual({...req.body},{runId,score:0,floors:0,settle:mode});
  }
  // saveGuard.command applies the server state before returning its receipt.
  const command={mode,attempt,info:calendar,usedToday:attempt,first:mode==='normal',ranked:false};
  const receipt=run('applyTrialSettlement(s,'+value(command)+','+serverNow+').result');
  req.resolve({...receipt,runId});
 }
 const entered=run(click);accept('start',1,firstId);assert.equal(await entered,true);assert.equal(run('s.daily.trialRuns'),1);assert.deepEqual(wallet(),before);
 assert.equal(run('dungeonRun.weakness'),calendar.weakness);
 assert.deepEqual(data('dungeonRun.options'),options(calendar.dayKey,0));
 const choices=popupHtml();assert.equal((choices.match(/class="trial-option"/g)||[]).length,3);
 const chooseHandler=button(choices,new RegExp(run("TRIAL_BUFFS[dungeonRun.options[0]].label").replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
 run(chooseHandler);assert.equal(run(chooseHandler),false);
 const completion=run('finishDungeon(false)');assert.equal(run('dungeonRun'),null);
 assert.deepEqual(wallet(),before);assert.equal(run('challengeResult.settling'),true);
 assert.match(popupHtml(),/확인/);run('finishDungeon(false)');assert.equal(pending.length,1);
 accept('normal',1,firstId);await completion;await settle();assert.deepEqual(delta(wallet(),before),[10,30,30]);
 assert.equal(run('challengeResult.settling'),false);assert.equal(run('challengeResult.settlementFailed'),false);
 const second=run(click);accept('start',2,secondId);await second;requestExit();const quit=confirmExit();
 assert.equal(pending.length,1);assert.equal(pending[0].body.settle,'forfeit');const beforeQuit=wallet();
 accept('forfeit',2,secondId);await quit;await settle();assert.deepEqual(wallet(),beforeQuit);assert.deepEqual(data('challengeResult.rewards'),{});assert.equal(run('s.daily.trialRuns'),2);
 console.log('PASS normal accounts wait for entry and settlement receipts; repeated clicks cannot reserve, pick, or collect twice');
}
main().catch(error=>{console.error(error);process.exitCode=1});
