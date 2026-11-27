const assert = require('node:assert/strict');
const {run} = require('./harness.cjs');
let passed=0;
function test(name,body){
 run("s=starter();s.classId='warrior';s.maxStage=1200;s.costumes=[0];s.wear=0;unlockClassSkills();s.auto=false;s.sound=false;dungeonRun=null;resetDay();pendingGiftAd=null;view='';");
 assert.equal(run('(()=>{'+body+'})()'),true,name);passed++;
}
test('only common starter and one optional common practice draw',`
 return CLASSES.every(c=>{s=starter();s.classId=c.id;s.maxStage=1200;unlockClassSkills();
 const ids=classSkillIds(),first=ids.filter(skill=>skillUnlocked(skill));
 if(first.length!==1||SKILL_RULES[first[0]].tier!==0||!practiceDraw()||practiceDraw())return false;
 return ids.filter(k=>skillUnlocked(k)).length===2 && SKILL_RULES[PRACTICE_AREA[classIndex(c.id)]].tier===0;
 });`);
test('all sixty skills purchasable at advertised grade and only after a draw',`
 const old=Math.random;
 try{
  for(const c of CLASSES){s=starter();s.classId=c.id;s.lastFreeSkillDay=skillDrawDay();unlockClassSkills();const ids=classSkillIds();
   for(let t=0;t<4;t++){const pool=ids.filter(k=>SKILL_RULES[k].tier===t),lo=SKILL_RATES.slice(0,t).reduce((a,b)=>a+b,0);
    if(!pool.length)return false;
    for(let i=0;i<pool.length;i++){const v=[(lo+.1)/100,(i+.25)/pool.length];Math.random=()=>v.shift()??.5;
     s.summonTickets=1;const before=s.skills[pool[i]]||0;const shards=s.shards;summon(1,true);
     if(s.skills[pool[i]]!==Math.max(1,before)||s.summonTickets!==0||!setSlot(0,pool[i]))return false;
     if(s.shards-shards!==(before?15:5))return false;
    }
   }
  } return true;
 }finally{Math.random=old}`);
test('repeated companion rolls pay their own wallet and upgrade only on demand',`
 const random=Math.random,skillStock=s.shards;
 try{
  const draws=[.8];for(let i=0;i<9;i++)draws.push(.8,(i+.5)/11);
  Math.random=()=>draws.shift()??.5;s.petTickets=10;summonPet(10,true);
  const scale=shardScale(true,2),paid=Array.from({length:9},(_,i)=>Math.round((10+i)*scale)),stock=paid.reduce((a,b)=>a+b,0);
  if(scale!==1.5||s.pets[2]!==1||s.petShards!==stock||s.shards!==skillStock||s.petTickets!==0)return false;
  if(!petSummonResults[0].newly||petSummonResults.slice(1).some((x,i)=>x.newly||x.shards!==paid[i]))return false;
  levelPet(2);
  if(petCost(2,1)!==18||s.pets[2]!==2||s.petShards!==stock-18||s.shards!==skillStock)return false;
  s.petShards=13;s.shards=500;levelPet(2);
  if(s.pets[2]!==2||s.petShards!==13||s.shards!==500)return false;
  s=migrate(JSON.parse(JSON.stringify(s)));
  if(s.petShards!==13||s.pets[2]!==2)return false;
  delete s.petShards;s=migrate(JSON.parse(JSON.stringify(s)));
  return s.petShards===0&&s.pets[2]===2&&s.shards===500;
 }finally{Math.random=random}`);
test('duplicate skill and companion draws give 10 to 20 times the grade scale at every level',`
 const original=Math.random;
 try{
  for(const [kind,cap,key,wallet] of [['skill',100,'skills','shards'],['pet',50,'pets','petShards']]){
   for(let level=1;level<=cap;level++){
    s[key][0]=level;
    for(let bucket=0;bucket<11;bucket++){
     for(const offset of [0,.999999]){
      Math.random=()=>(bucket+offset)/11;
      const before=s[wallet],item=awardSummon(kind,0);
      if(item.newly||item.shards!==Math.round((10+bucket)*shardScale(kind==='pet',0))||s[wallet]-before!==item.shards||s[key][0]!==level)return false;
     }
    }
   }
  }
 }finally{Math.random=original}
 tab=0;s.pets[0]=2;const detail=petDetail();
 return detail.includes('동료 조각 보유량')&&detail.includes('현재 → 다음 레벨')&&
  !detail.includes('Lv.50')&&!detail.includes('소환 확률')&&!detail.includes('스킬 조각');`);
test('unowned skill cannot be upgraded or equipped with shards',`
 s.shards=10000; const before=s.shards;return !skillLevel(43)&&!setSlot(0,43)&&s.shards===before&&!s.skills[43];`);
test('last occupied slot can be removed and stays empty across reload and repaint',`
 s.skills[43]=9;setSlot(0,43);removeAt(0);unlockClassSkills();s=migrate(JSON.parse(JSON.stringify(s)));unlockClassSkills();
 return s.slots.every(k=>k===-1)&&s.skills[43]===9;`);
test('new legendary skills and equipped levels survive migration',`
 return CLASSES.every(c=>{s.classId=c.id;const k=classSkillIds().at(-1);s.skills[k]=44;setSlot(1,k);const migrated=migrate(JSON.parse(JSON.stringify(s)));
 return migrated.skills[k]===44&&migrated.slots[1]===k&&migrated.classLoadouts[c.id].slots[1]===k;});`);
test('both daily gifts can be claimed separately and saved',`
 const gold=s.gold,gems=s.gems,n=dailyGifts.gold.amount();if(startGiftAd('gold')||!claimFreeGift('gold')||claimFreeGift('gold')||!claimFreeGift('gems')||claimFreeGift('gems'))return false;
 s=migrate(JSON.parse(JSON.stringify(s)));return s.gold===gold+n&&s.gems===gems+30&&s.daily.shopGift&&s.daily.shopGold;`);
test('two completed videos per resource, early close and replay do not award',`
 for(const kind of ['gems','gold']){
  claimFreeGift(kind);const before=s[kind],n=dailyGifts[kind].amount();
  if(!startGiftAd(kind)||collectTestAd())return false;
  const cancelled=pendingGiftAd;closeMenu();if(finishGiftAd(cancelled)||s[kind]!==before)return false;
  for(let i=0;i<2;i++){if(!startGiftAd(kind)||startGiftAd(kind))return false;const ad=pendingGiftAd;ad.ends=Date.now()-1;
   if(!collectTestAd()||finishGiftAd(ad))return false;}
  if(startGiftAd(kind)||s[kind]!==before+2*n)return false;
  s=migrate(JSON.parse(JSON.stringify(s)));if(giftAds(kind)!==2)return false;
 }return true;`);
test('midnight cancels pending ad and restores both daily gifts',`
 claimFreeGift('gems');startGiftAd('gems');const old=Date.now;const ad=pendingGiftAd;
 try{ad.day='expired';if(finishGiftAd(ad))return false;cancelGiftAd();s.day='expired';resetDay();return !s.daily.shopGift&&!s.daily.shopGold&&giftAds('gems')===0;}finally{Date.now=old}`);
test('v12 in-flight last boss retains HP percentage and an existing learned skill',`
 s.stage=s.maxStage=1200;s.skills[20]=19;const prior={...s,campaignBalanceVersion:3,enemyHp:260000000*20*.4};
 const a=migrate(prior),b=migrate(JSON.parse(JSON.stringify(a)));
 return Math.abs(a.enemyHp/campaignEnemyHp(1200)-.4)<1e-6&&a.enemyHp===b.enemyHp&&a.skills[20]===19;`);
test('30 battle seconds at either speed and no extension from speed toggles',`
 const now=Date.now();s.stage=300;s.speed=2;const a=stageBossAttempt(now);if(a.deadline!==now+15000)return false;
 s.speed=1;stageBossAttempt(now+5000);if(a.deadline!==now+25000)return false;
 s.speed=2;stageBossAttempt(now+9000);return a.deadline===now+17000;`);
test('all seven adventure gifts show and pay their own gold and materials once',`
 const gold=[20000,22000,45000,24000,25000,28000,36000];
 if(NEWBIE_MISSIONS.length!==gold.length||newbieReady(0))return false;
 const startGold=s.gold;claimNewbie(0);if(s.gold!==startGold)return false;
 s.kills=3000;s.crafted=500;s.campaignCleared=60;s.skills[0]=50;s.dungeonWins[0]=15;s.relics[0]=15;s.attendance=7;
 const types=new Set();
 for(const [i,mission] of NEWBIE_MISSIONS.entries()){
  const reward=mission[3],row=newbieMissionRow(mission,i);
  types.add(Object.keys(reward).sort().join(','));
  if(!newbieReady(i)||reward.gold!==gold[i]||Object.keys(reward).length!==([0,1,4].includes(i)?4:3))return false;
  const before={...s};
  claimNewbie(i);claimNewbie(i);
  if(newbieReady(i)||!s.eventClaims['newbie'+i]||!s.eventClaims['newbieGift'+i])return false;
  for(const [key,amount] of Object.entries(reward)){
   if(!row.includes(RESOURCE_NAMES[key]+' '+num(amount))||s[key]-before[key]!==amount)return false;
  }
 }
 if(types.size!==7||s.gold-startGold!==200000||!s.costumes.includes(2)||!s.eventClaims.newbieFinal)return false;
 s=migrate(JSON.parse(JSON.stringify(s)));claimNewbie(6);return !rewardReady('event')&&s.gold===startGold+200000;`);
test('legacy adventure gifts can claim each outstanding difference after loading',`
 for(let i=0;i<7;i++)s.eventClaims['newbie'+i]=true;
 s.eventClaims.newbieFinal=true;s.costumes=[0,2];s=migrate(JSON.parse(JSON.stringify(s)));
 const before={...s};
 for(const [i,mission] of NEWBIE_MISSIONS.entries()){
  const extra=newbieReward(i),row=newbieMissionRow(mission,i);
  if(!newbieReady(i)||!row.includes('추가 보상'))return false;
  for(const [key,n] of Object.entries(extra))if(!row.includes(RESOURCE_NAMES[key]+' '+num(n)))return false;
  claimNewbie(i);s=migrate(JSON.parse(JSON.stringify(s)));claimNewbie(i);
 }
 return !rewardReady('event')&&s.gold-before.gold===200000&&s.gems-before.gems===250&&s.ore-before.ore===80&&
  s.rouletteCoins-before.rouletteCoins===1&&s.costumes.length===2&&s.stones-before.stones===160;`);
test('seven-day gift grants 200 diamonds or credits the old 180 receipt once',`
 s.attendance=7;
 const gems=s.gems;
 if(!newbieMissionRow(NEWBIE_MISSIONS[6],6).includes('다이아 200'))return false;
 claimNewbie(6);s=migrate(JSON.parse(JSON.stringify(s)));claimNewbie(6);
 if(s.gems!==gems+200)return false;
 s.eventClaims.newbieGift6=true;s.gems-=20;
 const old=JSON.stringify(s),gold=s.gold,shards=s.costumeShards;
 s=migrate(JSON.parse(old));s=migrate(JSON.parse(JSON.stringify(s)));claimNewbie(6);
 return s.gems===gems+200&&s.gold===gold&&s.costumeShards===shards&&!newbieReady(6);`);
test('upgrade cost grows with grade',`
 const skill=t=>SKILL_RULES.findIndex(r=>r.tier===t),pet=t=>PET_TIERS[t].pets[0];
 if([0,1,2,3].map(t=>skillCost(skill(t),10)).join()!=='25,38,50,75')return false;
 return [0,1,2,3,4,5].map(t=>petCost(pet(t),10)).join()==='30,36,45,60,75,90';`);
console.log(JSON.stringify({passed}));

