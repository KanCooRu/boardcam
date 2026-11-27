// These rules run on the account server and in isolated game tests. UI code presents their receipts.
function runEconomyRule(state,action,input,random,now,meta={}){
 switch(action){
  case 'forge':return economyForgeRule(state,input,random,now,meta);
  case 'draw':return economyDrawRule(state,input,random,now,meta);
  case 'shop':return economyShopRule(state,input,random,now,meta);
  case 'claim':return economyClaimRule(state,input,random,now,meta);
  default:throw Error('지원하지 않는 요청입니다.');
 }
}

// Forge rules
const WEAPON_NAMES={warrior:'대검',shadow:'쌍단검',paladin:'전투 철퇴',mage:'마력 지팡이',archer:'장궁'};
const WEAPON_APPEARANCE_LEVELS=[0,5,10,15,20,23,25];
const WEAPON_MAX_PLUS=25;
// Indexed by the current level; entry zero attempts +1. No failure pity.
const WEAPON_CODEX_LEVELS=[1,2,4,6,8,10,13,16,19,22,25];
const weaponGrade=level=>Math.max(0,WEAPON_CODEX_LEVELS.findLastIndex(n=>level>=n));
const WEAPON_ENHANCE_RATES=[100,95,90,85,80,75,70,65,60,50,45,40,35,30,25,20,18,15,12,10,7,5,4,3,2];
const WEAPON_DESTROY_RATES=[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4,5,6,7,8,9,10,11,12,14];
function weaponAppearanceTier(level){
 return Math.max(0,WEAPON_APPEARANCE_LEVELS.findLastIndex(threshold=>level>=threshold));
}
function weaponCost(n){
 return {
  gold:Math.round((100+45*n+14*n*n)/10)*10,
  stones:10*(2+Math.floor(n*.75)),
  starIron:5*(2+Math.floor(n/4))
 };
}
// A weapon destroyed without a guard leaves debris. Thirty pieces are reforged into one guard.
const FORGE_DEBRIS_PER_GUARD=30;
function weaponDebris(level){return WEAPON_DESTROY_RATES[level]?level-13:0}
function enhanceChance(w){return WEAPON_ENHANCE_RATES[w.plus]||0}
function weaponEnhanceOdds(level){
 const success=WEAPON_ENHANCE_RATES[level]||0,destroy=WEAPON_DESTROY_RATES[level]||0;
 return {success,keep:100-success-destroy,destroy};
}
function weaponEnhanceOutcome(level,roll){
 const {success,destroy}=weaponEnhanceOdds(level);
 if(roll<success)return 'success';
 return roll<success+destroy?'destroy':'keep';
}
function canPayWeapon(w,state=s){
 return w.plus<WEAPON_MAX_PLUS&&Object.entries(weaponCost(w.plus)).every(([key,amount])=>Number.isFinite(state[key])&&state[key]>=amount);
}

function economyForgeRule(state,input,random,now,meta={}){
 if(!input||typeof input.useGuard!=='boolean'||Object.keys(input).length!==1)throw Error('방지권 사용 여부를 확인하세요.');
 const w=Object.hasOwn(WEAPON_NAMES,state.classId)?state.weapons?.[state.classId]:null;
 if(!w||!Number.isInteger(w.plus)||w.plus<0)throw Error('강화할 전용 무기를 확인하세요.');
 if(w.plus>=WEAPON_MAX_PLUS)throw Error('최고 강화 단계입니다.');
 if(!canPayWeapon(w,state))throw Error('강화 재료가 부족합니다.');
 if(input.useGuard&&!(Number.isSafeInteger(state.forgeGuards)&&state.forgeGuards>0))throw Error('파괴 방지권이 부족합니다.');
 const manual=meta.manual===true,timing=manual&&['perfect','miss'].includes(meta.timing)?meta.timing:'good';
 const at=w.plus,skin=weaponAppearanceTier(at),cost=weaponCost(at);
 let outcome=weaponEnhanceOutcome(at,random()*100);
 const protectedWeapon=outcome==='destroy'&&input.useGuard;
 let debris=0;
 for(const [key,amount] of Object.entries(cost))state[key]-=amount;
 if(protectedWeapon){
  state.forgeGuards--;
  if(state.forgeGuards===0)state.forgeGuardOn=false;
  outcome='keep';
 }else if(outcome==='destroy'){
  // Replace only the active weapon's combat properties. Its runes, mastery and collection stay earned.
  Object.assign(w,{basic:true,plus:0,inheritedPlus:0,grade:0,master:false,legacyAttack:0});
  debris=weaponDebris(at);state.forgeDebris=(state.forgeDebris||0)+debris;
 }else if(outcome==='success'){
  w.plus++;state.highestGearPlus=Math.max(state.highestGearPlus||0,w.plus);state.daily.upgrades=(state.daily.upgrades||0)+1;
  state.unlocked['0_'+Math.min(10,weaponGrade(w.plus))]=true;
 }
 w.peakPlus=Math.max(w.peakPlus||0,at,w.plus);
 w.skin=weaponAppearanceTier(w.plus);
 w.misses=0;
 if(manual)state.forgeManualTries=(state.forgeManualTries||0)+1;
 recordPlayerActivity('weaponForge',1,state);
 if(timing==='perfect')recordPlayerActivity('perfectHit',1,state);
 const awakened=outcome==='success'&&w.skin>weaponAppearanceTier(at);
 return {ok:outcome==='success',outcome,protected:protectedWeapon,awakened,at,skin,cost,timing,debris};
}

// Draw rules
const ECONOMY_DRAW_WALLETS={skill:'summonTickets',pet:'petTickets',costume:'rouletteCoins',roulette:'eventCoins'};
function drawDiamondCost(kind,count){
 if(kind==='pet')return PET_SUMMON_PRICE*count;
 if(kind==='skill')return count===10?1350:150;
 if(kind==='costume')return count===10?2700:300;
 return eventDiamondCost(count);
}
// One coin per listed mission of the season. Repeated or unknown names in a stored list earn nothing.
function wheelCoinsEarned(journal){
 const listed=new Set(WHEEL_MISSION_CATALOG.map(([key])=>key));
 return new Set((Array.isArray(journal?.claimed)?journal.claimed:[]).filter(key=>listed.has(key))).size;
}
function economyDrawQuote(state,kind,count,now){
 const season=activeOutfitEventId(now),journal=royalEventState(state,season)?.missions;
 const key=ECONOMY_DRAW_WALLETS[kind];
 const stock=kind==='roulette'?wheelCoinsEarned(journal)-(journal?.spent||0):state[key]||0;
 if(kind==='skill'&&count===1&&(state.lastFreeSkillDay==null||state.lastFreeSkillDay<skillDrawDay(now)))
  return {payment:'daily',cost:0,day:skillDrawDay(now)};
 if(stock>=count)return {payment:kind==='skill'||kind==='pet'?'ticket':'coin',cost:count,key};
 return {payment:'gems',cost:drawDiamondCost(kind,count),key:'gems'};
}
function chargeDrawPayment(state,kind,quote,now){
 if(quote.payment==='daily'){state.lastFreeSkillDay=quote.day;return}
 if(quote.payment==='coin'&&kind==='roulette'){royalEventState(state,activeOutfitEventId(now)).missions.spent+=quote.cost;return}
 if(!(state[quote.key]>=quote.cost))throw Error('소환 재화가 부족합니다');
 state[quote.key]-=quote.cost;
}
function rollSkill(random=Math.random,job=s.classId){
 const roll=random()*100;
 let tier=0,limit=SKILL_RATES[0];
 while(roll>=limit&&tier<SKILL_RATES.length-1)limit+=SKILL_RATES[++tier];
 const pool=classSkillIds(job).filter(k=>SKILL_RULES[k].tier===tier);
 return pool[Math.floor(random()*pool.length)];
}
function rollPet(random=Math.random()){
 const point=Math.max(0,Math.min(9999,Math.floor(random*10000)));let end=0;
 for(const pet of PET_SUMMON_POOL){end+=pet.weight;if(point<end)return pet.i}
 return PET_SUMMON_POOL.at(-1).i;
}
// Higher grades cost more shards per level, and a duplicate of a higher grade gives more shards back.
const SKILL_SHARD_SCALE=[1,1.5,2,3];          // 일반 · 희귀 · 영웅 · 전설
const PET_SHARD_SCALE=[1,1.2,1.5,2,2.5,3];    // 일반 · 희귀 · 영웅 · 전설 · 신화 · 천상
function shardScale(pet,id){
 if(pet)return PET_SHARD_SCALE[PET_TIERS.indexOf(petTier(id))]??1;
 return SKILL_SHARD_SCALE[SKILL_RULES[id]?.tier]??1;
}
function awardSummon(kind,id,state=s,random=Math.random){
 const pet=kind==='pet',levels=pet?state.pets:state.skills,newly=!levels[id];
 const shards=newly?(pet?0:5):Math.round((10+Math.floor(random()*11))*shardScale(pet,id));
 if(newly)levels[id]=1;
 state[pet?'petShards':'shards']+=shards;
 return {id,newly,shards};
}
function rollCostumeTier(random,roll){
 let cumulative=0,tier=5;
 for(let i=0;i<COSTUME_RATES.length;i++){cumulative+=COSTUME_RATES[i]/100;if(random<cumulative){tier=i;break}}
 return roll%500===0?5:roll%100===0?Math.max(3,tier):tier;
}
function drawStandardOutfit(state,random){
 const profession=state.classId;
 state.rolls++;state.normalCostumeRolls++;
 const rank=rollCostumeTier(random(),state.normalCostumeRolls),i=classIndex(profession)*OUTFIT_STRIDE+rank;
 return {kind:'skin',source:'standard',i,profession,name:COSTUME_NAMES[i],result:addCostume(i,state),
  guaranteed:state.normalCostumeRolls%500===0?'천상 보장':state.normalCostumeRolls%100===0?'전설 이상 보장':''};
}
function drawRoyalRewards(state,random,season,draw){
 const profession=state.classId,event=royalEventState(state,season),progress=royalClassState(state,profession,season);
 const pool=royalDrawPool(state,season),due=royalDue(pool,state,progress),wins=due.length?due:[royalPick(random(),pool)];
 state.rolls++;event.rolls++;progress.rolls++;
 for(const slot of pool){
  if(!ROYAL_LIMITS[slot.kind])continue;
  const next=slot.closed||wins.some(w=>w.kind===slot.kind)?0:royalPityFor(slot.kind,progress,state)+1;
  if(slot.kind==='eventSkin')progress.pity=next;
  else state.royalTitlePity=next;
 }
 return wins.map((slot,index)=>{
  const row={kind:slot.kind,source:'event',season,slot:slot.id,profession,name:slot.name,draw,bonus:index>0,
   guaranteed:due.length?num(ROYAL_LIMITS[slot.kind])+'회 확정':''};
  if(slot.kind==='eventSkin')row.result=addEventCostume(profession,state,season);
  else if(slot.kind==='title'){
   row.title=slot.title;row.newly=awardTitle(slot.title,true,state);row.result='전용 칭호 획득';
  }else{
   row.reward={...slot.reward};
   for(const [key,amount] of Object.entries(row.reward)){
    if(key==='gems')creditEconomyGems(state,amount);
    else state[key]=(state[key]||0)+amount;
   }
   row.result=passRewardText(row.reward);
  }
  return row;
 });
}
function economyDrawRule(state,input,random,now,meta={}){
 const {kind,count}=input;
 if(!Object.hasOwn(ECONOMY_DRAW_WALLETS,kind)||![1,10].includes(count))throw Error('소환 종류와 횟수를 확인하세요');
 if(classIndex(state.classId)<0)throw Error('직업을 먼저 선택하세요');
 const feature=kind==='pet'?'pets':kind;
 const testUnlock=state.testOnly===true&&state.testUnlockAll===true&&meta.testUnlock===true;
 if(featureStage(feature)&&!(state.maxStage>featureStage(feature))&&!testUnlock)throw Error(featureLockText(feature));
 if(kind==='roulette'&&!royalEventActive(now))throw Error('이벤트 기간이 아닙니다');
 const quote=economyDrawQuote(state,kind,count,now);
 if(meta.payment!=null&&quote.payment!==meta.payment)throw Error('소환 비용이 바뀌었습니다. 다시 선택하세요');
 const first=quote.payment==='daily'&&state.lastFreeSkillDay==null?PRACTICE_AREA[classIndex(state.classId)]:null;
 chargeDrawPayment(state,kind,quote,now);
 const items=[],season=activeOutfitEventId(now);
 for(let i=0;i<count;i++){
  if(kind==='roulette')items.push(...drawRoyalRewards(state,random,season,i+1));
  else if(kind==='costume')items.push(drawStandardOutfit(state,random));
  else{
   const id=kind==='pet'?rollPet(random()):first!=null&&!state.skills[first]?first:rollSkill(random,state.classId);
   items.push(awardSummon(kind,id,state,random));
   if(kind==='pet'&&state.activePet<0)state.activePet=id;
  }
 }
 if(kind==='skill'||kind==='pet')recordPlayerActivity(kind+'Draw',count,state);
 return {kind,count,payment:quote.payment,cost:quote.cost,items};
}

// Shop rules
const FORGE_GUARD_PRICE=1500;
const SHOP_EXCHANGE_OFFERS=[
 ['ore',30,150],['ore',100,450],['ore',300,1200],['stones',50,100],
 ['relicShards',10,300],['shards',20,200],['summonTickets',5,450],['forgeGuards',1,FORGE_GUARD_PRICE,'장']
];
const SHOP_GOLD_BOXES=[[1,50,1],[5,200,1.25],[15,500,1.5]];
// Season mission coins buy these. Each row is the resource, its amount and the coin price.
const PASS_COIN_OFFERS=[['ore',30,10],['stones',50,20],['summonTickets',1,30],['petTickets',1,40],['rouletteCoins',1,40]];
function passCoinOfferId(key,amount){return 'passcoin-'+key+'-'+amount}
const FAST_BATTLE_OFFER={cost:30,seconds:1800,limit:5};
function goldBoxAmount(hours,multiplier){return Math.floor(hours*3600*goldGain()*.12*multiplier)}
function shopExchangeId(key,amount){return 'exchange-'+key+'-'+amount}
function economyShopRule(state,input,random,now){
 const id=input?.itemId;
 if(typeof id!=='string'||id.length>70)throw Error('상품을 확인해 주세요.');
 const exchange=SHOP_EXCHANGE_OFFERS.find(([key,amount])=>shopExchangeId(key,amount)===id);
 const box=SHOP_GOLD_BOXES.find(([hours])=>'gold-box-'+hours===id);
 const pass=Object.values(ENTRY_PASSES).find(item=>item.shopId===id);
 const fast=id==='fast-battle';
 const coinOffer=PASS_COIN_OFFERS.find(([key,amount])=>passCoinOfferId(key,amount)===id);
 if(id==='debris-guard'){
  if(!Number.isSafeInteger(state.forgeDebris)||state.forgeDebris<FORGE_DEBRIS_PER_GUARD)throw Error('무기 잔해가 부족합니다.');
  state.forgeDebris-=FORGE_DEBRIS_PER_GUARD;state.forgeGuards=(state.forgeGuards||0)+1;
  return {itemId:id,cost:FORGE_DEBRIS_PER_GUARD,currency:'forgeDebris',rewards:{forgeGuards:1}};
 }
 if(coinOffer){
  const [key,amount,coins]=coinOffer;
  if(!Number.isSafeInteger(state.passCoins)||state.passCoins<coins)throw Error('패스 코인이 부족합니다.');
  state.passCoins-=coins;state[key]=(state[key]||0)+amount;
  return {itemId:id,cost:coins,currency:'passCoins',rewards:{[key]:amount}};
 }
 if(!exchange&&!box&&!pass&&!fast)throw Error('판매 중인 상품이 아닙니다.');
 const cost=exchange?exchange[2]:box?box[1]:pass?ENTRY_PASS_PRICE:FAST_BATTLE_OFFER.cost;
 if(!Number.isFinite(state.gems)||state.gems<cost)throw Error('다이아가 부족합니다.');
 let rewards;
 if(exchange){
  rewards={[exchange[0]]:exchange[1]};
 }else if(box){
  rewards={gold:goldBoxAmount(box[0],box[2])};
 }else if(pass){
  const bought=onlineState().daily.diamondPassPurchases;
  if(bought[id]>=ENTRY_PASS_DAILY_LIMIT)throw Error('오늘 구매 가능한 수량을 모두 사용했습니다.');
  bought[id]=(bought[id]||0)+1;rewards={[pass.resource]:1};
 }else{
  const offer=FAST_BATTLE_OFFER;
  if(state.day!==today())resetDay();
  if((state.daily.fastBattle||0)>=offer.limit)throw Error('오늘의 빠른 전투를 모두 사용했습니다.');
  const gain=offlineGains(offer.seconds);
  state.daily.fastBattle=(state.daily.fastBattle||0)+1;
  rewards={gold:gain.gold,ore:gain.ore};
  // Account level rewards for an instant battle belong to the same server revision.
  state.xp+=Math.floor(gain.xp);
  while(state.level<9999&&state.xp>=playerXpGoal(state.level)){
   state.xp-=playerXpGoal(state.level);state.level++;
  }
  if(state.level>=9999)state.xp=Math.min(state.xp,playerXpGoal(state.level));
  creditEconomyLevels(state);
  const weapon=state.weapons?.[state.classId];
  if(weapon&&weaponGoal(weapon))weapon.xp=Math.min(2000000,weapon.xp+Math.floor(gain.seconds/60));
 }
 state.gems-=cost;
 for(const [key,amount] of Object.entries(rewards))state[key]=(state[key]||0)+amount;
 return {itemId:id,cost,rewards};
}


// Reward rules

function creditEconomyGems(state,amount){
 if(!Number.isSafeInteger(amount)||amount<0)throw Error('다이아 지급량을 확인할 수 없습니다.');
 state.gems=(state.gems||0)+amount;
}
function settleLegacyNewbieGift(state){
 // The previous seven-day gift used a boolean receipt for the original 180 diamonds.
 if(state.eventClaims?.newbieGift6!==true)return 0;
 const total=NEWBIE_MISSIONS[6][3].gems,extra=total-180;
 creditEconomyGems(state,extra);state.eventClaims={...state.eventClaims,newbieGift6:total};return extra;
}
function initializeEconomyClaims(state){
 if(state.economyClaims?.version===1)return state.economyClaims;
 const count=n=>Number.isSafeInteger(n)&&n>0?n:0;
 const paid={};
 const flag=(source,id)=>{paid[source+'/'+id]=true};
 for(let i=0;i<count(state.quest)&&i<Q.length;i++)flag('quest',i);
 for(const [key,yes] of Object.entries(state.discoveryClaimed||{}))if(yes)flag('discovery',key);
 for(const [key,yes] of Object.entries(state.achievements||{}))if(yes)flag('achievement',key);
 for(const [key,row] of Object.entries(state.mailbox||{}))if(row?.claimed)flag('mail',key);
 if(state.mailClaimed)flag('mail','welcome');
 if(state.guidance?.rewarded)flag('guide','first');
 for(const id of state.redeemedRewardCodes||[])flag('coupon',id);
 for(const [key,yes] of Object.entries(state.passClaimed||{}))if(yes)flag('growthPass',key);
 for(let i=0;i<NEWBIE_MISSIONS.length;i++)if(state.eventClaims?.['newbieGift'+i])flag('newbie',i);
 const monthly={},monthlyEarned={};
 for(const [key,entry] of Object.entries(state.monthlyAttendance||{})){
  if(!validAttendanceDate(key+'-01'))continue;
  monthly[key]=Math.min(28,count(entry?.count));monthlyEarned[key]=Math.min(28,count(entry?.earned));
 }
 const legacyWorld=state.onlineTest?.daily,legacyWorldDay=state.onlineTest?.day;
 const worldPaid={};
 if(validAttendanceDate(legacyWorldDay)&&Array.isArray(legacyWorld?.raidClaimed)){
  for(const n of legacyWorld.raidClaimed)if(Number.isInteger(n)&&n>=1&&n<=3)worldPaid[n]=count(legacyWorld.raidLoot?.[n]?.rewards?.gems);
 }
 const ledger=state.economyClaims={version:1,paid,worldLegacy:{day:legacyWorldDay||'',completed:Math.min(3,count(legacyWorld?.raid)),earned:Math.min(3,Math.max(count(legacyWorld?.raid),legacyWorld?.legacyBossCleared?3:0)),paid:worldPaid},level:Math.min(9999,Math.max(1,count(state.level))),tower:count(state.towerFloor),
  nightmare:count(state.nightmareTour?.rounds),attendance:count(state.attendance),attendanceDate:state.lastAttendance||'',monthly,monthlyEarned,
  initialAttendanceDue:Math.min(365250,count(state.attendanceBook?.pending)),initialAttendanceDate:state.attendanceBook?.last||''};
 for(const kind of ['daily','weekly']){
  const page=state.adventureOrders?.[kind],period=kind==='daily'?state.day:state.weekly?.key;
  if(!period)continue;
  const book=economyPeriod(ledger,kind,period);
  if(kind==='daily'){
   if(state.daily?.shopGift)book['shopDaily/gems']=true;
   for(let n=1;n<=Math.min(2,count(state.daily?.giftAds?.gems));n++)book['shopAd/gems:'+n]=true;
  }
  if(page?.period===period){
   for(const [key,yes] of Object.entries(page.claimed||{}))if(yes)book['order/'+key]=true;
   for(const [key,yes] of Object.entries(page.chests||{}))if(yes)book['chest/'+key]=true;
  }
 }
 if(Number.isInteger(state.season?.cycle)){
  const book=economyPeriod(ledger,'season',state.season.cycle);
  for(const [key,yes] of Object.entries(state.season.claimed||{}))if(yes)book['seasonPass/'+key]=true;
 }
 return ledger;
}
function creditEconomyLevels(state){
 const ledger=initializeEconomyClaims(state),level=state.level;
 if(!Number.isInteger(level)||level>9999||level<=ledger.level)return 0;
 const gems=(level-ledger.level)*5;ledger.level=level;delete state.pendingLevelReward;creditEconomyGems(state,gems);return gems;
}
function economyPeriod(ledger,kind,period){
 if(ledger[kind]?.period!==period)ledger[kind]={period,claims:{}};
 return ledger[kind].claims;
}
function rejectEconomyClaim(){
 throw Object.assign(Error('이미 받았거나 받을 수 없는 보상입니다.'),{status:409,code:'already_claimed'});
}
function economyClaimRule(state,input,random,now){
 if(['trialEnter','trialFinish','trialForfeit'].includes(input.source))return dailyTrialWallet(state,input,now);
 const {source,id}=input,ledger=initializeEconomyClaims(state);
 const number=Number(id),numeric=Number.isSafeInteger(number)&&number>=0&&String(number)===String(id);
 const rewards={};
 let count=0,extra={};
 function add(items){
  for(const [key,n] of Object.entries(items||{}))if(Number.isSafeInteger(n)&&n>0)rewards[key]=(rewards[key]||0)+n;
 }
 function take(book,key,already=false){if(already||book[key])rejectEconomyClaim();book[key]=true;count++}
 function once(already){take(ledger.paid,source+'/'+id,already)}
 function requireRow(row){if(!row)throw Error('등록되지 않은 보상입니다.');return row}
 // The server pays a reward only when its own record meets the condition shown on the screen.
 function requireEarned(met){if(!met)throw Error('조건을 달성한 뒤 받을 수 있습니다.')}
 const day=today(),week=weekKey();
 switch(source){
  case 'level':{
   requireRow(numeric&&number===state.level);const gems=creditEconomyLevels(state);if(!gems)rejectEconomyClaim();
   return {source,id,rewards:{gems},count:1};
  }
  case 'quest':{
   requireRow(numeric&&Q[number]);if(number!==state.quest)rejectEconomyClaim();
   requireEarned(Q[number][1]());
   once(false);add(growthQuestReward(number));state.quest++;break;
  }
  case 'guide':{
   requireRow(id==='first');const g=guidance();once(g.rewarded);
   g.status='done';g.step=QUICK_GUIDE.length;g.completeAt=0;g.rewarded=true;
   journeyState().status='done';add({gems:150});break;
  }
  case 'orderDaily':case 'orderWeekly':case 'chestDaily':case 'chestWeekly':{
   const kind=source.endsWith('Daily')?'daily':'weekly',period=kind==='daily'?day:week;
   const page=adventureBook()[kind],book=economyPeriod(ledger,kind,period);
   if(page.period!==period)throw Error('임무 기간이 변경되었습니다.');
   if(source.startsWith('chest')){
    const reward=requireRow(numeric&&orderChests[kind][number]);
    requireEarned(page.chests[number]||book['chest/'+number]||adventureActivity(kind)>=activityMilestones[number]);
    take(book,'chest/'+number,page.chests[number]);
    page.chests[number]=true;add(reward);
   }else{
    const row=requireRow(orderRows(kind).find(r=>r.id===id));
    requireEarned(row.claimed||book['order/'+id]||row.ready);
    take(book,'order/'+id,page.claimed[id]);page.claimed[id]=true;add(row.reward);
    if(kind==='daily'){
     recordWheelGoal('orders');
     if(!page.dispatchCredited&&adventureActivity(kind)===100){page.dispatchCredited=true;trackOrderEvent('dispatchDays')}
    }
   }
   break;
  }
  case 'growthPass':case 'seasonPass':{
   const growth=source==='growthPass',rows=growth?GROWTH_PASS_REWARDS:SEASON_PASS_REWARDS;
   const flags=growth?state.passClaimed:state.season.claimed;
   const book=growth?ledger.paid:economyPeriod(ledger,'season',seasonCycle(now));
   if(!growth&&state.season.cycle!==seasonCycle(now))throw Error('시즌이 변경되었습니다.');
   if(id!=='all')requireRow(numeric&&rows.some(row=>row.id===number));
   for(const row of rows){
    const key=source+'/'+row.id;
    if((id!=='all'&&row.id!==number)||flags[row.id]||book[key]||(growth?state.maxStage:state.season.points)<row.goal)continue;
    take(book,key);flags[row.id]=true;add(row.reward);
   }
   if(!count)rejectEconomyClaim();break;
  }
  case 'attendance':{
   requireRow(id==='pending');
   const book=state.attendanceBook,dayNow=attendanceDay(koreaDayNumber(now));
   if(!book||!validAttendanceDate(book.last)||book.last>dayNow||book.last<=ledger.attendanceDate)rejectEconomyClaim();
   const previous=validAttendanceDate(ledger.attendanceDate)?ledger.attendanceDate:validAttendanceDate(state.lastAttendance)?state.lastAttendance:null;
   const duration=previous?(Date.parse(book.last)-Date.parse(previous))/86400000:Math.max(1,Math.ceil((now-(state.joinedAt||now))/86400000)+1);
   const legacy=ledger.initialAttendanceDate&&book.last>=ledger.initialAttendanceDate?ledger.initialAttendanceDue:0;
   const days=Math.min(365250,Math.max(0,Math.floor(book.pending)),Math.max(legacy,duration));
   if(!Number.isInteger(days)||days<1)rejectEconomyClaim();
   const first=ledger.attendance;
   for(let i=0;i<7;i++){const occurrences=Math.floor((days+6-i)/7);if(occurrences)for(const [key,n] of Object.entries(SEVEN_ATTENDANCE_REWARDS[(first+i)%7]))add({[key]:occurrences*n})}
   ledger.initialAttendanceDue=0;state.attendance=ledger.attendance=first+days;state.lastAttendance=ledger.attendanceDate=book.last;book.pending=0;count=days;break;
  }
  case 'monthlyAttendance':{
   requireRow(id==='pending');const dayNow=attendanceDay(koreaDayNumber(now)),currentMonth=dayNow.slice(0,7);
   for(const [month,m] of Object.entries(state.monthlyAttendance||{})){
    if(!validAttendanceDate(month+'-01')||month>currentMonth)continue;
    const beforeJoining=state.joinedAt&&month<attendanceDay(koreaDayNumber(state.joinedAt)).slice(0,7);
    if(beforeJoining&&!ledger.monthlyEarned?.[month])continue;
    const first=Math.max(m.count||0,ledger.monthly[month]||0);
    const last=Math.min(28,Math.floor(m.earned||0),beforeJoining?ledger.monthlyEarned[month]:month===currentMonth?Number(dayNow.slice(-2)):28);
    for(let n=first+1;n<=last;n++){add(monthlyReward(n,m));count++}
    if(last>first){ledger.monthly[month]=m.count=last;if(month===currentMonth)m.last=dayNow}
   }
   if(!count)rejectEconomyClaim();break;
  }
  case 'collection':{
   requireRow(numeric&&number<PARTS.length);const keys=discoveryKeys(number,state);
   for(const key of keys)if(!state.discoveryClaimed[key]&&!ledger.paid['discovery/'+key]){
    take(ledger.paid,'discovery/'+key);state.discoveryClaimed[key]=true;add({gems:20});
   }
   if(!count)rejectEconomyClaim();state.collectionClaimed[number]=keys.length;break;
  }
  case 'achievement':{
   const row=requireRow(numeric&&ACTIVE_ACHIEVEMENT_IDS.includes(number)&&ACHIEVEMENTS[number]);
   requireEarned(state.achievements[number]||ledger.paid[source+'/'+id]||achieveValue(row[0])>=row[2]);
   once(state.achievements[number]);state.achievements[number]=true;
   awardTitle('achievement-'+number,true);add({gems:row[3]});break;
  }
  case 'newbie':{
   requireRow(numeric&&NEWBIE_MISSIONS[number]);
   requireEarned(state.eventClaims['newbieGift'+number]||ledger.paid[source+'/'+id]||state.eventClaims['newbie'+number]||NEWBIE_MISSIONS[number][1]()>=NEWBIE_MISSIONS[number][2]);
   once(state.eventClaims['newbieGift'+number]);add(newbieReward(number));
   state.eventClaims['newbie'+number]=true;state.eventClaims['newbieGift'+number]=number===6?NEWBIE_MISSIONS[number][3].gems:true;
   if(!state.eventClaims.newbieFinal&&NEWBIE_MISSIONS.every((_,i)=>state.eventClaims['newbie'+i])){
    state.eventClaims.newbieFinal=true;addCostume(classIndex(state.classId)*OUTFIT_STRIDE+2);
   }
   break;
  }
  case 'trialFloor':{
   const row=requireRow(numeric&&TRIAL_FLOOR_PRIZES.find(([floor])=>floor===number));
   requireEarned(ledger.paid[source+'/'+id]||trialPeakFloors(state)>=number);
   once(false);add(row[1]);break;
  }
  // Minigames: the furnace is rolled here, and a board formation is replayed here before it pays.
  case 'furnace':{const out=furnaceRule(state,String(id),random,day);add(out.rewards);extra={furnace:out.furnace};count=1;break}
  case 'petBoard':{const out=boardRule(state,id,day);add(out.rewards);extra={board:out.board};count=1;break}
  case 'nightmare':{
   requireRow(numeric&&number>0);const tour=state.nightmareTour;
   if(!tour||!state.campaignCompleted||tour.step!==10||number!==Math.max(ledger.nightmare,tour.rounds)+1)rejectEconomyClaim();
   if(ledger.nightmareDay===day||tour.day===day)throw Error('악몽 순례 보상은 하루에 한 번 받을 수 있습니다.');
   tour.step=0;tour.rounds=ledger.nightmare=number;tour.day=ledger.nightmareDay=day;count=1;add({gems:NIGHTMARE_TOUR_GEMS});break;
  }
  case 'mail':{
   const msg=requireRow(MAIL_DEFINITIONS.find(m=>m.id===id&&Object.keys(m.rewards).length));
   const entry=mailState(id);once(entry.claimed||entry.archived);
   entry.read=entry.claimed=true;if(id==='welcome')state.mailClaimed=true;add(msg.rewards);break;
  }
  case 'coupon':{
   const coupon=requireRow([...REWARD_CODES.values()].find(c=>c.id===id));state.redeemedRewardCodes||=[];
   once(state.redeemedRewardCodes.includes(id));state.redeemedRewardCodes.push(id);add(coupon.rewards);break;
  }
  case 'shopDaily':case 'shopAd':{
   const book=economyPeriod(ledger,'daily',day);
   if(state.day!==day)throw Error('오늘의 선물 기간이 변경되었습니다.');
   if(source==='shopDaily'){
    requireRow(id==='gems');take(book,'shopDaily/gems',state.daily.shopGift);state.daily.shopGift=true;
   }else{
    requireRow(/^gems:[12]$/.test(id));const n=Number(id.slice(-1)),ads=state.daily.giftAds||={};
    if(!state.daily.shopGift||n!==(ads.gems||0)+1)rejectEconomyClaim();
    take(book,'shopAd/'+id);ads.gems=n;
   }
   add({gems:30});break;
  }
  // Repeatable expeditions have a persisted receipt with an ordinal and a capped game-derived payout.
  case 'rushEntry':{
   const period=economyPeriod(ledger,'rushAdmission',day),attempt=(period.issued||0)+1;
   if(String(id)!==day+'/'+attempt)rejectEconomyClaim();
   if(!spendEntry('rush'))throw Error('보스 러시 입장권이 부족합니다.');
   period.issued=attempt;
   const admissions=ledger.rushAdmissions||={};admissions[day]=attempt;
   const previous=new Date(Date.parse(day)-86400000).toISOString().slice(0,10);
   for(const key of Object.keys(admissions))if(key<previous&&!Object.values(state.pendingEconomyRuns?.rush||{}).some(row=>row?.day===key))delete admissions[key];
   return {source,id,day,attempt,rewards:{},count:1};
  }
  case 'rush':case 'worldBoss':{
   const row=state.pendingEconomyRuns?.[source]?.[id];requireRow(row);
   const when=source==='rush'?day:onlineDay();
   const previous=new Date(Date.parse(when)-86400000).toISOString().slice(0,10);
   const legacy=source==='worldBoss'&&row.day===ledger.worldLegacy?.day&&row.attempt<=ledger.worldLegacy.earned;
   const authorized=source==='rush'&&row.attempt<=ledger.rushAdmissions?.[row.day];
   if(!validAttendanceDate(row.day)||row.day>when||row.day<previous&&!legacy&&!authorized)rejectEconomyClaim();
   const advance=source==='worldBoss'&&row.advance===true;
   if(!Number.isSafeInteger(row.attempt)||row.attempt<1||String(id)!==row.day+'/'+row.attempt+(advance?'/advance':''))rejectEconomyClaim();
   const field=source+'Runs',paid=ledger[field]||={};
   for(const date of Object.keys(paid))if(date<previous&&date!==ledger.worldLegacy?.day&&!ledger.rushAdmissions?.[date])delete paid[date];
   const record=paid[row.day]||={through:0,additional:{}};
   if(advance){
    if(!legacy||row.attempt<=ledger.worldLegacy.completed||Object.hasOwn(ledger.worldLegacy.paid,row.attempt))rejectEconomyClaim();
   }else if(row.attempt<=record.through||record.additional[row.attempt])rejectEconomyClaim();
   if(source==='rush'){
    if(!authorized)rejectEconomyClaim();
    const bosses=Math.min(10,Math.max(0,Math.floor(Number(row.bosses)||0)));
    add({gems:10+bosses*3,summonTickets:bosses>=10?2:1});
   }else{
    requireRow(row.attempt<=3);const earned=worldBoss.rewardForReceipt(row.attempt,row.damage);
    const old=ledger.worldLegacy;
    if(row.day===old?.day&&row.attempt<=old.completed&&Object.hasOwn(old.paid,row.attempt))rejectEconomyClaim();
    const earlier=row.day===old?.day?old.paid[row.attempt]||0:0;
    add({gems:Math.max(0,earned.gems-earlier)});
    if(advance)old.paid[row.attempt]=earned.gems;
   }
   if(!advance){
    record.additional[row.attempt]=true;
    while(record.additional[record.through+1])delete record.additional[++record.through];
   }
   delete state.pendingEconomyRuns[source][id];count=1;break;
  }
  default:throw Error('등록되지 않은 보상 종류입니다.');
 }
 for(const [key,n] of Object.entries(rewards)){
  if(key==='gems')creditEconomyGems(state,n);
  else if(key==='tickets'){for(const {resource} of Object.values(ENTRY_PASSES))state[resource]=(state[resource]||0)+n}
  else state[key]=(state[key]||0)+n;
 }
 return {source,id,rewards,count,...extra};
}
