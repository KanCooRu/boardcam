const assert=require('node:assert/strict');
const {run,ctx}=require('./harness.cjs');
require('./arena-account.cjs');

// Drive the same UI entry point, timer and local command path used by the game.
let now=new Date(2026,5,12,12).getTime(), tick, dialog;
ctx.Date=class extends Date {constructor(...args){super(...(args.length?args:[now]))} static now(){return now;}};
ctx.setInterval=(fn)=>{tick=fn;return 1;};
const create=ctx.document.createElement;
ctx.document.createElement=(tag)=>{
 const el=create(tag);
 if(tag==='dialog'){dialog=el;el.showModal=()=>{};el.close=()=>{};}
 return el;
};
function step(ms){now+=ms;tick();}
function reset(){
 run("worldBoss.close();s=starter();s.maxStage=51;s.classId='warrior';s.costumes=[0];s.wear=0;unlockClassSkills();s.effects=false;s.sound=false;dungeonRun=null;forgeBusy=false;");
}
function verify(js){assert.equal(run(js),true,js);}
function start(){verify('worldBoss.start()');assert.match(dialog.innerHTML,/VS/);}
function finish(){step(31400);assert.match(dialog.innerHTML,/이번 도전 피해/);run('worldBoss.close()');}
reset();
verify("!worldBoss.sweep()&&!OnlineService.command('raid').ok");
start();verify("!worldBoss.start()&&!worldBoss.sweep()");
step(2000);verify('worldBoss.inBattle()');
verify("!OnlineService.command('raid').ok");
run('worldBoss.close()');verify('onlineState().daily.raid===0&&onlineState().worldBossCoins===0');
run(`function wbWallet(){return [s.gold,s.gems,s.ore,s.stones,s.shards,s.relicShards,s.summonTickets,onlineState().worldBossCoins]}
 function savedWalletMatches(){const saved=JSON.parse(localStorage.getItem(saveTarget()));return [saved.gold,saved.gems,saved.ore,saved.stones,saved.shards,saved.relicShards,saved.summonTickets,saved.onlineTest.worldBossCoins].every((v,i)=>wbWallet()[i]===v)}
 function oCoins(){return Object.values(onlineState().daily.raidLoot).reduce((a,r)=>a+r.coins,0)}
 const wbStart=wbWallet();
 function verifyLedgerPaid(n,before){
  const row=onlineState().daily.raidLoot[n];
  const amounts=['gold','gems','ore','stones','shards','relicShards','summonTickets'].map(key=>row.rewards[key]);
  amounts.push(row.coins);
  return amounts.every((amount,i)=>Number.isSafeInteger(amount)&&amount>=0&&amount===wbWallet()[i]-before[i]);
 }`);
start();step(31399);verify("onlineState().daily.raid===0&&worldBoss.inBattle()");
step(1);verify("!worldBoss.inBattle()&&onlineState().daily.raid===1&&onlineState().worldBossCoins===onlineState().lastResult.coinRewards.worldBoss&&onlineState().worldBossCoins>=30");
verify("verifyLedgerPaid(1,wbStart)");
verify('savedWalletMatches()');
assert.match(dialog.innerHTML,/자동 지급 완료/);
assert.match(dialog.innerHTML,/1회차 획득 보상/);assert.equal((dialog.innerHTML.match(/<div class="wb-drop[ "]/g)||[]).length,8);
run('const afterOne=wbWallet()');
verify("onlineState().raidBest>0&&onlineState().raidBest===onlineState().lastResult.damage");
verify("onlineState().lastResult.rounds.some(x=>x.skill===0)&&playerPassState().daily.count.worldBoss===1");
verify("!OnlineService.command('raid').ok&&!worldBoss.sweep()");
run('worldBoss.close()');verify('worldBoss.sweep()');
verify("onlineState().daily.raidDamage===2*onlineState().raidBest&&onlineState().worldBossCoins===oCoins()");
verify('verifyLedgerPaid(2,afterOne)');
verify('savedWalletMatches()');
assert.match(dialog.innerHTML,/소탕 완료/);assert.match(dialog.innerHTML,/자동 지급 완료/);
run('const afterTwo=wbWallet()');
run('worldBoss.close()');
verify('worldBoss.sweep()');verify("onlineState().lastResult.damage===onlineState().raidBest&&onlineState().lastResult.endLevel>1&&onlineState().daily.raid===3");
verify('verifyLedgerPaid(3,afterTwo)');verify('savedWalletMatches()');run('const savedBossCoins=onlineState().worldBossCoins, finalWallet=wbWallet()');
run('worldBoss.close()');verify("!worldBoss.start()&&!worldBoss.sweep()&&onlineState().worldBossCoins===savedBossCoins");
verify("oCoins()===savedBossCoins");
run('worldBoss.last();worldBoss.close();worldBoss.last();worldBoss.close()');
for(const n of [1,2,3]){
 run('worldBoss.rewardTab('+n+')');const history=run('worldBoss.rewards()');
 assert.match(history,new RegExp(n+'회차 지급 내역'));assert.doesNotMatch(history,/보상 받기|raidReward|수령 가능/);
}
verify('wbWallet().every((v,i)=>v===finalWallet[i])');
assert.doesNotMatch(run('worldBoss.lobby(onlineState())'),/기여 보상|수령 가능/);
run("s=migrate(JSON.parse(JSON.stringify(s)));onlineState().day='2000-01-01'");
verify("onlineState().daily.raid===0&&onlineState().raidBest>5&&onlineState().worldBossCoins===savedBossCoins");
verify("OnlineService.command('arena',{id:'peer-arena_b'}).ok&&onlineState().lastRaidResult.kind==='raid'&&onlineState().raidBest>5");
// Exact HP boundaries, overkill, Lv.100 -> infinity, rollback, and persisted starting level.
reset();run("onlineState().raidBest=240");
verify('worldBoss.sweep()');verify("onlineState().lastResult.endLevel===2 && onlineState().raidLastCleared===1 && onlineState().lastResult.nextLevel===1");
// Resume against a boss that can survive the starter build for the whole round.
run("worldBoss.close();onlineState().raidBest=1000000");
verify('worldBoss.sweep()');verify("onlineState().lastResult.endLevel>6 && onlineState().lastResult.nextLevel===onlineState().lastResult.endLevel-6 && onlineState().daily.raidDamage===1000240");
run("worldBoss.close();const nextRaid=onlineState().lastResult.nextLevel;s=migrate(JSON.parse(JSON.stringify(s)));onlineState().day='1999-01-01'");
start();step(1399);verify("worldBoss.inBattle()&&onlineState().daily.raid===0");step(12000);verify("worldBoss.inBattle()&&onlineState().daily.raid===0");
step(18001);verify("onlineState().lastResult.startLevel===nextRaid && onlineState().lastResult.cleared===0 && onlineState().lastResult.nextLevel===nextRaid");
run('worldBoss.close()');
reset();run(`const raidHp=lv=>Math.round(240*1.09**(lv-1)+70*(lv-1));
 onlineState().raidBest=Array.from({length:100},(_,i)=>raidHp(i+1)).reduce((a,b)=>a+b,0);`);
verify('worldBoss.sweep()');verify("onlineState().lastResult.endLevel===101 && onlineState().lastResult.cleared===100 && onlineState().lastResult.nextLevel===95");
run('worldBoss.close();onlineState().raidBest*=3');
verify('worldBoss.sweep()');verify("onlineState().lastResult.startLevel===95 && onlineState().lastResult.endLevel>101 && onlineState().lastResult.nextLevel===95");
assert.match(dialog.innerHTML,/Lv.∞/);run('worldBoss.close()');
// A live one-hit leap past Lv.100 must keep fighting until the 30-second deadline.
reset();run("const originalWbAttack=onlineFighter;onlineFighter=()=>({...originalWbAttack(),attack:100000000})");
start();step(1600);verify("worldBoss.inBattle() && !OnlineService.command('raid').ok && onlineState().daily.raid===0");
step(29799);verify("worldBoss.inBattle() && onlineState().daily.raid===0");
step(1);verify("!worldBoss.inBattle() && onlineState().lastResult.endLevel>100 && onlineState().lastResult.nextLevel===95");
verify("onlineState().lastResult.damage===onlineState().lastResult.rounds.reduce((sum,r)=>sum+r.hit,0) && onlineState().lastResult.rounds.at(-1).at>28000");
run("onlineFighter=originalWbAttack;worldBoss.close()");
// Old early kills unlocked all chests. Recover them once, including unplayed rounds.
reset();run(`{const o=onlineState();Object.assign(o.daily,{raid:1,bossMax:10000,raidDamage:10000,raidClaimed:[1],raidLoot:{1:{damage:10000,rewards:{gold:12000},coins:180}}});delete o.daily.legacyBossCleared;o.raidBest=10000;}`);
verify("onlineState().daily.raidClaimed.join()==='1,2,3'&&savedWalletMatches()");
run('const prepaidWallet=wbWallet()');verify('worldBoss.sweep()');
verify("onlineState().daily.raid===2 && wbWallet().every((v,i)=>v===prepaidWallet[i]) && onlineState().daily.raidClaimed.length===3");
run('worldBoss.close()');
// v32 had already paid 15 coins to each participant. Existing claimed chests stay claimed.
reset();run(`{const o=onlineState();Object.assign(o.daily,{raid:2,bossMax:10000,raidDamage:3200,raidClaimed:[1]});o.worldBossCoins=30;o.lastResult={kind:'raid',rounds:[],damage:2200,at:Date.now()};}`);
verify("onlineState().daily.raidClaimed.join()==='1,2'");
verify("onlineState().worldBossCoins===30+48-15");
verify("onlineState().daily.raidLoot[1].damage===1000&&onlineState().daily.raidLoot[2].damage===2200");
reset();run("Object.assign(onlineState().daily,{raid:3,bossMax:10000,raidDamage:4000})");
verify("onlineState().daily.raidClaimed.length===3 && onlineState().daily.raidLoot[1].damage===null && onlineState().daily.raidLoot[1].coins===15");
// Restore a previous day's last unpaid round on startup, before resetting its daily limit.
reset();run("const beforeRecovery=wbWallet();{const o=s.onlineTest;o.day='2000-01-01';Object.assign(o.daily,{raid:1,raidDamage:2000});o.worldBossCoins=15;}save();");
run('init()');
verify("onlineState().daily.raid===0 && onlineState().day===onlineDay() && [2600,12,24,44,12,4,1,32].every((v,i)=>wbWallet()[i]-beforeRecovery[i]===v) && savedWalletMatches()");
run('init()');verify('[2600,12,24,44,12,4,1,32].every((v,i)=>wbWallet()[i]-beforeRecovery[i]===v)');
reset();start();run("onlineDay=()=> '2099-01-01'");step(31400);
verify("!worldBoss.inBattle()&&onlineState().daily.raid===0&&onlineState().worldBossCoins===0");
// Exercise the real sweep and wallet for each tier, an interpolation point and the upper limit.
for(const [damage,gems,tickets] of [
 [1,45,4],[10000,90,4],[55000,135,4],[100000,180,9],[999999,267,9],
 [1000000,270,13],[10000000,360,18],[100000000,450,18],[1000000000,540,22],[1e16,540,22]
]){
 reset();
 run('onlineState().raidBest='+damage);
 const initial=run('wbWallet()');
 for(let n=1;n<=3;n++){
  verify('worldBoss.sweep()');
  if(damage===1000000){
   const expected=[
    [11000,60,80,100,40,16,3,60],[16500,90,120,150,60,24,4,90],[22000,120,160,200,80,32,6,120]
   ][n-1];
   const row=run('onlineState().daily.raidLoot['+n+']');
   assert.deepEqual(['gold','gems','ore','stones','shards','relicShards','summonTickets'].map(key=>row.rewards[key]).concat(row.coins),expected);
  }
  run('worldBoss.close()');
 }
 assert.equal(run('s.gems')-initial[1],gems);
 assert.equal(run('s.summonTickets')-initial[6],tickets);
 verify('!worldBoss.sweep()&&savedWalletMatches()');
}
// All five classes can finish with base and discovery skills, including support and DOTs.
for(const [idx,id] of ['warrior','shadow','paladin','mage','archer'].entries()){
 reset();run(`s.classId='${id}';s.maxStage=51;const wbSlots${idx}=[${idx*4},${20+idx*4},${21+idx*4},${40+idx*4}];s.slots=wbSlots${idx};for(const k of s.slots)s.skills[k]=1;`);
 start();finish();verify("onlineState().lastResult.damage>0&&onlineState().daily.raid===1&&onlineState().lastResult.rounds.every(x=>Number.isFinite(x.hit)&&x.hit>0)");
}
console.log('World boss checks passed: timer, retreat, limits, settlement, best, sweep, rewards, day change, five classes.');

// Drive a first real contact across each telegraph type. Drawn contact data never enters a reward record.
const contactMotion=run('createWorldBossMotion'),originalFighter=run('onlineFighter');
const realGlint=run('raidContactGlint'),realRandom=run('Math.random');
const hitStops=[],glints=[];
ctx.createWorldBossMotion=()=>({pending:()=>false,pendingDamage:()=>0,clock(){},breath(){},swing:()=>false,dispose(){},hitStop:ms=>hitStops.push(ms)});
ctx.raidContactGlint=(field,x,y,strong)=>{glints.push(strong);realGlint(field,x,y,strong)};
function firstWorldContact(attack,crit,powerSaving=false){
 reset();hitStops.length=glints.length=0;
 ctx.onlineFighter=()=>({...originalFighter(),attack,crit,speed:1});
 run('s.effects=true;s.powerSaving='+powerSaving+';s.slots=[-1,-1,-1,-1];Math.random=()=>.5');
 start();step(1600);
 const first={stops:hitStops.slice(),strong:glints.slice()};
 finish();
 const result=run('onlineState().lastResult');
 assert.equal(result.rounds.length>0,true);
 assert.equal(result.rounds.some(r=>'finishing' in r||'kill' in r),false);
 return {...first,damage:result.damage,duration:result.rounds.at(-1).at};
}
try{
 const normal=firstWorldContact(10,0),critical=firstWorldContact(10,1),killing=firstWorldContact(1000,1);
 assert.deepEqual([normal.stops,normal.strong],[[],[false]]);
 assert.deepEqual([critical.stops,critical.strong],[[60],[true]]);
 assert.deepEqual([killing.stops,killing.strong],[[120],[true]]);
 const quiet=firstWorldContact(1000,1,true);
 assert.deepEqual([quiet.stops,quiet.strong],[[],[]]);
 assert.deepEqual([quiet.damage,quiet.duration],[killing.damage,killing.duration]);
 console.log('PASS world-boss normal contact, critical, bar clear and motion-disabled matching settlement');
}finally{
 ctx.onlineFighter=originalFighter;ctx.createWorldBossMotion=contactMotion;ctx.raidContactGlint=realGlint;
 ctx.restoreWorldTestRandom=realRandom;run('Math.random=restoreWorldTestRandom');
}
