// Economy and campaign rules of the 2026-11-25 rebalance, run against the shipped page scripts.
const assert=require('node:assert/strict');
const {run}=require('./harness.cjs');
function check(label,body){
 run("s=starter();s.classId='warrior';s.wear=0;s.costumes=[0];dungeonRun=null;unlockClassSkills();initializeEconomyClaims(s)");
 assert.equal(run('(()=>{'+body+'})()'),true,label);
 console.log('PASS',label);
}
check('dismantling pays star iron from legendary gear up; the armory keeps its own prizes',`
 if([0,3,5].some(r=>salvageIron({r,plus:0})!==0))return false;
 if(JSON.stringify([6,7,8,9,10].map(r=>salvageIron({r,plus:0})))!=='[1,2,3,5,8]')return false;
 if(salvageStones({r:4,plus:2})!==16)return false;
 const first=materialDungeonLoot(1,1),last=materialDungeonLoot(1,30);
 return first.starIron===6&&first.stones===45&&last.starIron===64&&last.stones===440&&TRIAL_RUN_REWARD.starIron===10;`);
check('world boss diamonds, expedition coins and the season pass follow the new tables',`
 const day=d=>[1,2,3].reduce((sum,n)=>sum+worldBoss.rewardForReceipt(n,d).gems,0);
 if(day(1e6)!==270||day(1e9)!==540||day(0)!==45)return false;
 const coins=[8,16,24].map(h=>expeditionRewards(h).rouletteCoins||0);
 if(JSON.stringify(coins)!=='[0,1,2]')return false;
 const free=passTotals('free'),paid=passTotals('premium');
 return free.gems===3000&&paid.gems===6000&&free.petTickets===4&&free.starIron===200&&free.forgeGuards===1;`);
check('pass coins and forge debris are exchanged by the shop rule',`
 s.passCoins=100;s.petTickets=0;
 const pet=runEconomyRule(s,'shop',{itemId:passCoinOfferId('petTickets',1)},Math.random,Date.now());
 if(pet.cost!==40||s.passCoins!==60||s.petTickets!==1)return false;
 s.passCoins=5;
 try{runEconomyRule(s,'shop',{itemId:passCoinOfferId('ore',30)},Math.random,Date.now());return false}catch(error){if(s.passCoins!==5)return false}
 s.forgeDebris=29;
 try{runEconomyRule(s,'shop',{itemId:'debris-guard'},Math.random,Date.now());return false}catch(error){}
 s.forgeDebris=31;s.forgeGuards=0;
 runEconomyRule(s,'shop',{itemId:'debris-guard'},Math.random,Date.now());
 return s.forgeDebris===1&&s.forgeGuards===1;`);
check('an unprotected destruction leaves debris; a guarded one does not',`
 const w=s.weapons.warrior;s.gold=s.stones=s.starIron=1e9;
 w.plus=20;const broken=runEconomyRule(s,'forge',{useGuard:false},()=>.1,Date.now());
 if(broken.outcome!=='destroy'||broken.debris!==7||s.forgeDebris!==7||w.plus!==0)return false;
 w.plus=24;s.forgeGuards=1;const kept=runEconomyRule(s,'forge',{useGuard:true},()=>.1,Date.now());
 if(!kept.protected||kept.debris!==0||s.forgeDebris!==7||w.plus!==24)return false;
 w.plus=10;const safe=runEconomyRule(s,'forge',{useGuard:false},()=>.999,Date.now());
 return safe.outcome==='keep'&&s.forgeDebris===7&&weaponDebris(14)===0&&weaponDebris(15)===2&&weaponDebris(24)===11;`);
check('tower floor prizes need the recorded best floor and pay once',`
 const claim=id=>{try{return runEconomyRule(s,'claim',{source:'trialFloor',id},Math.random,Date.now())}catch(error){return null}};
 s.trialPeak=9;if(claim(10)||claim(7))return false;
 const gems=s.gems;s.trialPeak=12;
 const paid=claim(10);
 if(!paid||paid.rewards.gems!==150||paid.rewards.petTickets!==1||s.gems!==gems+150||claim(10))return false;
 return trialFloorPaid(10)&&!trialFloorPaid(15)&&trialFloorPrizes().includes('15층');`);
check('the nightmare pilgrimage pays once a day',`
 s.campaignCleared=1200;s.campaignCompleted=true;s.nightmareTour={rounds:0,step:10,day:''};
 const claim=n=>{try{return runEconomyRule(s,'claim',{source:'nightmare',id:n},Math.random,Date.now())}catch(error){return error.message}};
 const first=claim(1);if(first.rewards?.gems!==200||s.nightmareTour.day!==today()||s.nightmareTour.rounds!==1)return false;
 s.nightmareTour.step=10;
 const second=claim(2);
 return typeof second==='string'&&s.nightmareTour.rounds===1&&migrate(JSON.parse(JSON.stringify(s))).nightmareTour.day===today();`);
check('constellation engraving opens after Normal 300, spends star iron and stones, and multiplies attack and health',`
 const attack=power(),hp=health();
 if(engraveConstellation(1)||constellationLevel()!==0)return false;
 s.campaignCleared=300;s.maxStage=301;s.starIron=60+66;s.stones=600+660;
 if(!engraveConstellation(10)||constellationLevel()!==2||s.starIron!==0||s.stones!==0)return false;
 if(power()!==Math.floor(attack*1.02*1.02)||health()!==Math.floor(hp*1.02*1.02))return false;
 const saved=migrate(JSON.parse(JSON.stringify(s))),older=migrate({anvilAwakening:7});
 screenTab='constellation';
 return saved.constellation===2&&older.constellation===7&&!('anvilAwakening' in older)&&migrate({constellation:9999}).constellation===300&&
  characterScreen().includes('밝힌 별 2')&&SCREEN_TABS.character.some(([key])=>key==='constellation')&&!SCREEN_TABS.forge.some(([key])=>key==='awakening');`);
check('balance 9 keeps stages 1-100, and a version 8 save keeps its records while moving to a stage it can fight',`
 for(const stage of [1,10,50,100])if(campaignEnemyHp(stage)!==campaignEnemyHp(stage,NORMAL_HP_ANCHORS))return false;
 const old={classId:'warrior',stage:450,maxStage:450,campaignCleared:449,campaignVersion:2,campaignBalanceVersion:8,enemyHp:5,stageKills:4};
 const moved=migrate(JSON.parse(JSON.stringify(old)));
 if(moved.maxStage!==450||moved.campaignCleared!==449||moved.stage>=450||moved.stage<=100||moved.stage%10===0)return false;
 if(campaignEnemyHp(moved.stage)>campaignEnemyHp(449,NORMAL_HP_ANCHORS)||moved.balanceMoved.from!==450)return false;
 const again=migrate(JSON.parse(JSON.stringify(moved)));
 const early=migrate({classId:'warrior',stage:80,maxStage:80,campaignCleared:79,campaignVersion:2,campaignBalanceVersion:8});
 return again.stage===moved.stage&&again.campaignBalanceVersion===9&&early.stage===80&&!early.balanceMoved;`);
