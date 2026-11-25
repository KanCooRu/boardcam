const assert = require('node:assert/strict');
const {run} = require('./harness.cjs');

function check(label, body) {
 run("s=starter();s.classId='warrior';s.wear=0;s.costumes=[0];dungeonRun=null;unlockClassSkills()");
 assert.equal(run('(()=>{'+body+'})()'), true, label);
 console.log('PASS', label);
}
check('normal bosses preserve the tutorial and late endpoints while gaining a sustained slope', `
 const old=stage=>campaignEnemyHp(stage,V7_HP_ANCHORS);
 for(const stage of [1,10,20])if(campaignEnemyHp(stage)!==old(stage))return false;
 for(let stage=30;stage<=1200;stage+=10)if(campaignEnemyHp(stage)<=campaignEnemyHp(stage-10))return false;
 // Balance 9: each difficulty ends well above the last, and no stage is easier than it was.
 for(const stage of [150,300,600,900,1200])if(campaignEnemyHp(stage)<campaignEnemyHp(stage,NORMAL_HP_ANCHORS))return false;
 return campaignEnemyHp(100)===27540000 && campaignEnemyHp(300)===324000000 && campaignEnemyHp(600)>30*campaignEnemyHp(300) && campaignEnemyHp(1200)>10*campaignEnemyHp(600);`);
check('v7 boss migration preserves both health fraction and deadline exactly once', `
 s.stage=s.maxStage=100;const deadline=stageBossAttempt().deadline;
 const old={...s,enemyHp:21870000,campaignBalanceVersion:7};
 const first=migrate(old), again=migrate(first);
 return first.enemyHp===13770000&&again.enemyHp===first.enemyHp&&again.stageBossAttempt.deadline===deadline;`);
check('old achievement indices persist and the final clear unlocks a repeatable circuit', `
 s.achievements[4]=true;s.campaignCleared=1199;s.maxStage=s.stage=1200;
 const gold=s.gems;
 if(claimNightmareTour()||nightmareTourTarget()||achieveValue('cleared')!==1199)return false;
 advanceCampaign(1200);
 if(nightmareTourTarget()!==930)return false;
 advanceCampaign(930);advanceCampaign(930);
 for(let stage=960;stage<=1200;stage+=30)advanceCampaign(stage);
 s=migrate(JSON.parse(JSON.stringify(s)));
 if(!s.achievements[4]||s.nightmareTour.step!==10||!claimNightmareTour()||claimNightmareTour())return false;
 return s.gems===gold+200&&s.nightmareTour.rounds===1&&nightmareTourTarget()===930;`);
check('raid shop exposes the two enabled items and enforces funds and limits', `
 s.maxStage=41;tab='raid';const o=onlineState();o.raidCoins=120;
 if(havenShopPopup().includes('준비 중')||!havenShopPopup().includes("acquireHavenCoin('raid')"))return false;
 const prior=[s.ore,s.shards],buy=id=>OnlineService.command('townExchange',{id}).ok;
 return buy('raid-ore')&&!buy('raid-ore')&&buy('raid-shards')&&!buy('raid-shards')
  &&o.raidCoins===0&&s.ore===prior[0]+100&&s.shards===prior[1]+80;`);
check('cosmetic event milestones honor older seasons and cannot be claimed twice', `
 const events=Object.values(s.costumeEvents);events[0].rolls=8;events[1].rolls=2;
 s=migrate(JSON.parse(JSON.stringify(s)));const before=power();
 return lifetimeEventDraws()===10&&eventHonorProgress().includes('칭호 받기')&&claimTitle('wheel-honor-10')
  &&!claimTitle('wheel-honor-10')&&power()===before&&!titleEligible(titleDefinition('wheel-honor-100'))
  &&ROYAL_SKIN_PITY===500&&ROYAL_TITLE_PITY===300;`);
check('armor is symmetric in arena and lowers actual player damage with a cap', `
 const fighter={attack:100,hp:1000,speed:1,crit:0,critDamage:1,armor:0};
 const noArmor=simulateArena(fighter,fighter).rounds[0];
 const armored=simulateArena({...fighter,armor:300},fighter).rounds[0];
 return noArmor.hit===100&&noArmor.counter===100&&armored.hit===100&&armored.counter===80
  &&armorMitigation(0)===0&&armorMitigation(1e12)<.4&&armorMitigation(300)===.2;`);
