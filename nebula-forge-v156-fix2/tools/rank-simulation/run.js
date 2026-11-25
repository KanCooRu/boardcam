 // The most each device-earned value can rise through uninterrupted play, from the game's own formulas.
 // hourly refills an allowance up to hold; credit is added for this upload alone.
 function progressPace(next){
  // Attack cadence allows about three kills a second on waves, and seven on the final boss once it falls in one hit.
  const stage=Math.max(1,Math.min(CAMPAIGN_LIMIT,Math.floor(Number(s.maxStage)||1)+20));
  const KILLS=stage>=CAMPAIGN_LIMIT?26500:12000,RUNS=9;
  const stack=campaignMaterialStack(stage),away=offlineGains(86400);
  const tier=i=>materialTier(s.dungeonLevel?.[i]);
  const prize=(i,n)=>materialDungeonLoot(i,n);
  const best=i=>prize(i,tier(i)+5);
  const count=value=>Number.isFinite(value)?Math.max(0,Math.floor(value)):0;
  const daily=amount=>({hourly:amount/24,hold:amount});
  // A source counts once its content is open.
  const open=key=>s.maxStage>featureStage(key),none={hourly:0,hold:0};
  const steady=(hourly,extra=0)=>({hourly,hold:hourly*2+extra});
  // Winning a new dungeon tier pays once without an entry. Credit exactly those first wins.
  const first={};
  for(let i=0;i<3;i++){
   const top=Math.min(tier(i)+60,materialTier(next?.dungeonLevel?.[i]));
   for(let n=tier(i);n<top;n++)for(const [key,amount] of Object.entries(prize(i,n)))first[key]=(first[key]||0)+amount;
  }
  // A sixty-second mine run registers one strike every 120ms at most, plus the automatic strikes.
  const mineOre=30+Math.floor(800*.45)+Math.floor(Math.log10(Math.max(10,power()))*5);
  const trips=EXPEDITIONS.length*3;
  // Field ore: one roll a kill, doubled at weekends. Offline hunting and the mine add the rest.
  const oreHour=KILLS*Math.min(.9,.45*(1+count(s.legacyGrowth?.[2])*.05))*stack*2+90*(15+2*stack)+mineOre*RUNS/24+60;
  const ore=steady(oreHour,away.ore*1.5+mineOre*RUNS+700);
  // One ore makes one item and an item is dismantled once. Dismantled items are those
  // the bag held or this upload made that the uploaded bag no longer holds.
  const made=Math.max(0,Math.min(count(next?.crafted)-count(s.crafted),count(s.ore)+ore.hold));
  // Items that left the stored bag pay their exact value. Items made and dismantled within
  // this upload pay twice the forge's average for its level, which covers a lucky batch.
  const stored=Array.isArray(s.gear)?s.gear:[],kept=new Set(Array.isArray(next?.gearIds)?next.gearIds:[]);
  const left=stored.filter(g=>g&&!kept.has(g.id));
  const fresh=Math.max(0,count(next?.gear)-(stored.length-left.length));
  const melted=Math.max(0,made-fresh);
  const odds=forgeProb(Math.min(FORGE_MAX_LEVEL,count(s.forgeLevel)+2));
  const average=value=>odds.reduce((sum,chance,r)=>sum+chance/100*value({r,plus:0}),0);
  const salvaged=value=>left.reduce((sum,g)=>sum+(Number(value(g))||0),0)+(melted?Math.ceil(melted*average(value)*2)+value({r:10,plus:0}):0);
  const xpKill=4+Math.floor(campaignEconomyStage(stage)/4);
  const xpHour=(xpKill+Math.round(xpKill/9))*KILLS+720;
  const climb=xp=>{
   let level=Math.max(1,count(s.level)),gained=0;
   while(level<9999&&gained<5000&&xp>=playerXpGoal(level)){xp-=playerXpGoal(level);level++;gained++}
   return gained+(level<9999?xp/playerXpGoal(level):0);
  };
  const goldHour=campaignKillGold(stage)*KILLS+best(0).gold*RUNS/24+60000;
  const pace={
   gold:{path:['gold'],hourly:goldHour,hold:Math.max(goldHour*2,away.gold*1.5)+best(0).gold*RUNS+150000},
   ore:{path:['ore'],...ore},
   stones:{path:['stones'],...steady(KILLS*2*stack+3000+(best(1).stones+mineOre/5)*RUNS/24,(best(1).stones+mineOre/5)*RUNS+50*trips+1000),
    credit:salvaged(salvageStones)},
   starIron:{path:['starIron'],...daily((best(1).starIron+Math.floor(mineOre/10))*RUNS),
    credit:salvaged(salvageIron)},
   shards:{path:['shards'],...steady(KILLS/90*2*stack+200+best(2).shards*RUNS/24,best(2).shards*RUNS+500)},
   relicShards:{path:['relicShards'],...steady(KILLS/90*(stack+2)+50,20*trips+150)},
   // Tickets, coins and companion shards come from the server. The device adds only
   // the world boss's summon tickets, the long expeditions' coins and the daily mission pass coins.
   petShards:{path:['petShards'],hourly:0,hold:0},
   costumeShards:{path:['costumeShards'],hourly:0,hold:0},
   petTickets:{path:['petTickets'],hourly:0,hold:0},
   summonTickets:{path:['summonTickets'],...(open('worldBoss')?daily(22):none)},
   rouletteCoins:{path:['rouletteCoins'],...(open('explore')?daily(4):none)},
   passCoins:{path:['passCoins'],...daily(40)},
   seasonPoints:{path:['season','points'],...daily(300)},
   level:{path:['level'],hourly:climb(xpHour),hold:Math.max(3,climb(xpHour*2+away.xp*1.5))},
   kills:{path:['kills'],hourly:KILLS*1.2,hold:KILLS/4},
   // Nine kills a stage: at best a stage every two seconds.
   maxStage:{path:['maxStage'],hourly:1800,hold:100},
   campaignCleared:{path:['campaignCleared'],hourly:1800,hold:100}
  };
  // Awakening levels are bought with star iron. The stored stock pays for most of a rise
  // and the day's star iron for the rest; before Hard is in reach there is none.
  const awakeCost=awakeningCost(awakeningLevel(s)).starIron,ironDay=(best(1).starIron+Math.floor(mineOre/10))*RUNS;
  pace.anvilAwakening=count(s.campaignCleared)>=ANVIL_AWAKENING.stage-100?
   {path:['anvilAwakening'],hourly:ironDay/24/awakeCost,hold:Math.ceil(ironDay/awakeCost)+1,credit:Math.floor(count(s.starIron)/awakeCost)}:
   {path:['anvilAwakening'],...none};
  for(let i=0;i<3;i++)pace['dungeon'+i]={path:['dungeonLevel',i],hourly:30,hold:60};
  // The three free daily entries are counted apart. Stored passes come from the coin shops, three a day each.
  for(const {resource} of Object.values(ENTRY_PASSES))pace[resource]={path:[resource],...(open('havenShop')?daily(4):none)};
  for(const [key,amount] of Object.entries(first))if(pace[key])pace[key].credit=(pace[key].credit||0)+amount;
  return pace;
 }
 // Pure combat does not emit visual, audio, storage, or network events in the worker.
 paint=paintBattle=render=renderScreen=save=notice=banner=damageText=playSound=animateClassAttack=launchClassProjectile=spawnClassFx=captureCampaignDefeat=showDefeatFeedback=paintStageBossHUD=()=>{};
 warmClassArt=warmSoundEffects=showClassOnboarding=paintTactics=paintHeroHealth=navigate=openMenu=()=>{};
 if(command.action==='trialDate')return trialDayInfo(now);
 if(command.action==='trialSettlement'){
  s=structuredClone(record.state);
  return applyTrialSettlement(s,command,now);
 }
 if(command.action==='trialAwardPreview')return trialWeeklyPrize(command.rank,command.participantCount);
 if(command.action==='trialAward')return grantTrialWeeklyPrize(structuredClone(record.state),command.weekKey,command.rank,command.participantCount);
 if(economy){
  s=structuredClone(record.state);
  if(command.action==='economyMigrate')return migrate(s);
  if(command.action==='economyLegacyGift'){
   settleLegacyNewbieGift(s);return s;
  }
  if(command.action==='economySkinInventory'){
   // Wardrobe upgrades consume duplicates locally. Their conserved quantity
   // is the owned copies plus the exact number invested in existing stars.
   const quantities={};
   for(const id of new Set([...Object.keys(s.skinUpgrades||{}),...Object.keys(s.skinCopies||{})])){
    const level=s.skinUpgrades?.[id]??1,held=s.skinCopies?.[id]??0;
    const row=id.includes(':')?{event:true}:{tier:Number(id)%OUTFIT_STRIDE};
    const costs=skinCosts(row);
    if(!costs||!Number.isInteger(level)||level<1||level>1+costs.length||!Number.isSafeInteger(held)||held<0)return null;
    const total=held+costs.slice(0,level-1).reduce((n,cost)=>n+cost,0);
    if(total)quantities[id]=total;
   }
   return quantities;
  }
  if(command.action==='economyBaseline')return initializeEconomyClaims(s);
  if(!s.weapons||!s.costumeEvents||!s.daily||s.weaponVersion!==1)s=migrate(s);
  if(s.eventClaims?.newbieGift6===true)settleLegacyNewbieGift(s);
  initializeEconomyClaims(s);resetDay();
  const result=runEconomyRule(s,command.kind,command.input,secureRandom,now,command.meta);
  return {state:s,result};
 }
 if(command.action==='economyStarter'){
  // The record every new account starts from. A chosen class receives the same kit as registration.
  s=starter();
  const i=classIndex(command.job);
  if(i>=0){
   s.classId=command.job;s.costumes=[i*OUTFIT_STRIDE];s.wear=s.costumes[0];
   s.slots=[...s.classLoadouts[command.job].slots];unlockClassSkills();rememberClass();
  }
  Object.assign(s,command.profile);
  return s;
 }
 if(command.action==='progressPace'){
  s=structuredClone(record.state);
  if(!s.weapons||!s.costumeEvents||!s.daily||s.weaponVersion!==1)s=migrate(s);
  return progressPace(command.next);
 }
 if(command.action==='featureInfo'){
  return {stage:featureStage(command.key),message:featureLockText(command.key)};
 }
 if(command.action==='trialCeiling'){
  // Replay the tower with this record at the fastest combat speed. The server
  // records no score above what the stored character can reach.
  s=structuredClone(record.state);
  if(!s.weapons||!s.costumeEvents||!s.daily||s.weaponVersion!==1)s=migrate(s);
  s.effects=false;s.sound=false;s.powerSaving=true;s.speed=2;s.auto=s.autoBoss=s.autoSkills=true;
  const info=command.info,hp=trialBossHp(1);
  const run={dayKey:info.dayKey,weekKey:info.weekKey,weakness:info.weakness,attempt:1,mode:'trial',n:1,bosses:0,floors:0,
   hp,maxHp:hp,time:TRIAL_TIME,damage:0,choosing:false,exitPending:false,selection:0,options:[],buffs:{},picks:[],weakUntil:[]};
  let ended=false;
  finishDungeon=()=>{ended=true};
  dungeonRun=run;combatTimer=0;cooldowns=[0,0,0,0];heroCurrentHp=health();
  const prefer=Array.isArray(command.prefer)?command.prefer:['attack','skillDamage','critDamage','speed','crit','cooldown','weakHp','time'];
  const choose=()=>chooseTrialBuff(prefer.find(key=>run.options.includes(key))||run.options[0]);
  openTrialChoice(run);choose();
  let nextCheck=now;
  for(let step=0;step<6000&&!ended&&run.time>0;step++){
   now+=50;
   for(const [id,task] of jobs)if(now>=task.at){jobs.delete(id);task.fn()}
   if(ended)break;
   if(run.choosing){choose();continue}
   cooldowns=cooldowns.map(x=>Math.max(0,x-.05*s.speed));combatTimer+=.05*s.speed;run.time-=.05;
   if(combatTimer>=1.15/attackSpeed()){
    const ready=cooldowns.findIndex((c,i)=>c<=0&&slotOpen(i)&&s.slots[i]>=0&&autoSkillUsable(s.slots[i]));
    if((ready>=0&&cast(ready,true))||hit())combatTimer=0;
   }
   if(now>=nextCheck){nextCheck=now+250;tickTactics();updateCombatSurvival(.25)}
  }
  return {floors:run.floors,score:trialScore(run),damage:Math.round(run.damage),picks:run.picks,defeated:ended&&run.time>0};
 }
 if(command.action==='worldReplay'){
  return {damage:worldBoss.replayTrial(command.world,command.casts)};
 }
 if(command.action==='register'){
  s=starter();
  const i=classIndex(command.job);
  if(i<0)throw Error('직업을 확인해 주세요.');
  s.classId=command.job;s.costumes=[i*OUTFIT_STRIDE];s.wear=s.costumes[0];
  s.slots=[...s.classLoadouts[command.job].slots];unlockClassSkills();rememberClass();
 }else {
  s=record.state;
 }
 if(command.action==='socialDuel'){
  const fighter=onlineFighter();return {playerMax:fighter.hp,enemyMax:command.enemy.hp,...simulateArena(fighter,command.enemy)};
 }
 if(command.action==='socialFighter'){
  return {fighter:onlineFighter(),world:worldBoss.captureForTrial(command.skills||[])};
 }
 s.effects=false;s.sound=false;s.powerSaving=true;s.speed=1;
 dungeonRun=null;heroCurrentHp=health();s.enemyHp=maxHp();
 let elapsed=0,won=false;
 if(command.action==='upgrade')upgrade(command.stat,command.count);
 if(command.action==='fight'){
  if(command.mode!=='stage')throw Error('전투 대상을 확인해 주세요.');
  s.auto=s.autoBoss=s.autoSkills=true;
  s.stage=command.target;s.maxStage=Math.max(s.stage,s.maxStage);
  const entryStage=s.stage,initialKills=s.kills,started=now;
  s.stageKills=0;s.tactics.encounter=null;s.stageBossAttempt=null;s.tactics.ready={};s.tactics.buffs={};
  delete s.lastCombatDefeat;delete s.lastStageBossFailure;
  s.enemyHp=maxHp();unlockClassSkills();
  let nextCheck=now;
  for(let dt=50;dt<=90000;dt+=50){
   now=started+dt;
   for(const [id,task] of jobs)if(now>=task.at){jobs.delete(id);task.fn()}
   if(dt%100===0){
    combatTimer+=.1;
    if(combatTimer>=1.15/attackSpeed()){
     combatTimer=0;
     const skill=s.slots.find((id,i)=>id>=0&&slotOpen(i)&&autoSkillUsable(id));
     performClassAttack(skill??-1,true);
    }
   }
   if(now>=nextCheck){
    nextCheck=now+250;
    tickTactics();updateCombatSurvival(.25);
    if(stageBossActive())stageBossTick();
   }
   won=(s.stage!==entryStage&&!s.lastStageBossFailure||s.campaignCompleted&&entryStage===CAMPAIGN_LIMIT&&s.stageKills===0&&s.kills>initialKills);
   if(won||s.lastCombatDefeat||s.lastStageBossFailure)break;
  }
  elapsed=now-started;
  // Drop phase-local handles from the private save; each proof starts at the encounter boundary.
  s.stageKills=0;s.tactics.encounter=null;s.tactics.ready={};s.tactics.buffs={};s.stageBossAttempt=null;
  s.tactics.classReadyAt=0;
 }
 return {state:s,seed,power:Math.round(combatPower()),stage:s.campaignCleared||0,elapsed,won};
