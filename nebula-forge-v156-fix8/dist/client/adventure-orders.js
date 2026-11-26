'use strict';

const orderMetrics={
 perfectHit:['완벽 타격','weapon'], weaponForge:['전용 무기 강화 시도','weapon'], kills:['몬스터 처치','home'], waves:['웨이브 돌파','home'], skill:['전투 스킬 사용','home'],
 volley:['광역기로 세 적 동시 타격','home'], crafted:['장비 제작','forge'], dungeon:['재료 던전 클리어','dungeon'],
 bossHits:['스테이지 보스에 스킬 적중','home'], bosses:['스테이지 보스 토벌','home'], arena:['아레나 대련','arena'], worldBoss:['월드보스 도전','raid'],
 guard:['방어형 몬스터 처치','home'], healer:['회복형 몬스터 처치','home'], fieldOre:['사냥으로 성운석 획득','home'], dispatchDays:['일일 활약도 100 달성','orders']
};
// Goals lock to the highest stage at the start of each period.
const adventureCatalogue={
 daily:[
  ['temper','weaponForge',[1,1,1],{gold:500,starIron:3}],
  ['patrol','kills',[210,235,340],{gems:20}],
  ['forgePay','crafted',[10,20,30],{gold:1500,starIron:5}],
  ['anvil','perfectHit',[3,3,3],{starIron:5}],
  ['supply','fieldOre',[90,100,145],{ore:12}],
  ['volley','volley',[45,55,65],{shards:12}],
  ['ruins','healer',[20,25,32],{stones:18}],
  ['dungeonPay','dungeon',[1,2,3],{gold:2500}],
  ['guard','waves',[55,60,75],{gems:20}],
  ['hunt','bossHits',[18,24,40],{relicShards:8}],
  ['study','skill',[240,260,280],{shards:18}]
 ],
 weekly:[
  ['temper','weaponForge',[10,10,10],{gold:3000,starIron:15,forgeGuards:1}],
  ['patrol','dispatchDays',[3,3,3],{gems:65}],
  ['huntPay','kills',[600,900,1200],{gold:6000,starIron:20}],
  ['supply','crafted',[240,420,600],{ore:55}],
  ['ruins','dungeon',[14,16,18],{stones:65}],
  ['hunt','bosses',[10,15,20],{relicShards:35}],
  ['trainingPay','skill',[350,500,700],{gold:9000}],
  ['guard','arena',[13,15,18],{gems:65}],
  ['raid','worldBoss',[7,8,9],{summonTickets:2}],
  ['volley','volley',[150,210,270],{shards:55}]
 ]
};
const activityPerOrder={daily:20,weekly:10};
const activityMilestones=[20,40,60,80,100];
const orderChests={
 daily:[{ore:10},{gems:25},{stones:20,starIron:5},{summonTickets:1},{gems:100}],
 weekly:[{ore:50},{gems:50},{relicShards:40,starIron:20},{summonTickets:2,petTickets:2},{gems:200}]
};
const legacyOrders={daily:{kills:'patrol',crafted:'supply',dungeons:'ruins',upgrades:'volley'},weekly:{bosses:'hunt',crafted:'supply'}};
function newOrderPeriod(kind,period,legacy,state=s) {
 const tier=state.maxStage>=600?2:state.maxStage>=100?1:0;
 const page={period,tier,count:{},claimed:{},chests:{}};
 if(legacy){
  const old=state[kind];
  for(const [key,id] of Object.entries(legacyOrders[kind])){
   if(old.claimed?.[key])page.claimed[id]=true;
   const metric=key==='dungeons'?'dungeon':key;
   if(orderMetrics[metric])page.count[metric]=bounded(old[key]);
  }
 }
 return page;
}
function adventureBook(state=s) {
 const legacy=!state.adventureOrders;
 state.adventureOrders=recordMap(state.adventureOrders);
 const book=state.adventureOrders;
 for(const [kind,period] of [['daily',state.day],['weekly',state.weekly.key]]){
  if(book[kind]?.period!==period)book[kind]=newOrderPeriod(kind,period,legacy,state);
  const page=book[kind];
  page.tier=Math.floor(bounded(page.tier,0,2));
  for(const key of ['count','claimed','chests'])page[key]=recordMap(page[key]);
  if(kind==='daily'&&page.huntKind!=='healer'&&page.huntKind!=='guard'){
   const area=campaignPosition(state.maxStage).area;
   const healerUnlocked=state.maxStage>300||CAMPAIGN_CREATURE_REGIONS.slice(0,area+1).some(region=>BIOMES[region].mobs.some(mob=>mob.kind==='healer'));
   page.huntKind=healerUnlocked?'healer':'guard';
   if(!healerUnlocked)page.count.guard=bounded(page.count.healer);
  }
 }
 return book;
}
function trackOrderEvent(key,amount=1,state=s){
 if(!Object.hasOwn(orderMetrics,key)||!Number.isFinite(amount)||amount<=0)return;
 if(state===s){
  recordWheelGoal(key,amount);
  if(state.day!==today())resetDay();
 }
 const book=adventureBook(state);
 for(const page of [book.daily,book.weekly])page.count[key]=bounded(page.count[key])+amount;
 if(state===s)recordGuildOrder(key,amount);
}
function orderMetric(page,key){return key==='healer'?page.huntKind:key}
function orderRows(kind){
 const page=adventureBook()[kind];
 return adventureCatalogue[kind].map(([id,metric,goals,reward])=>{
  const key=orderMetric(page,metric);
  const value=bounded(page.count[key]),goal=goals[page.tier];
  const payout=reward.gold?{...reward,gold:reward.gold*[1,3,6][page.tier]}:reward;
  return {id,key,title:orderMetrics[key][0],value,goal,reward:payout,claimed:!!page.claimed[id],ready:value>=goal};
 }).sort((a,b)=>missionPriority(+a.ready,1,a.claimed)-missionPriority(+b.ready,1,b.claimed));
}
function adventureActivity(kind){
 const flags=adventureBook()[kind].claimed;
 return Math.min(100,adventureCatalogue[kind].filter(([id])=>flags[id]).length*activityPerOrder[kind]);
}
function orderRewardText(reward){return Object.entries(reward).map(([key,n])=>RESOURCE_NAMES[key]+' '+num(n)).join(' · ')}
function payOrder(reward){
 grant(reward);save();paint();rewardNotice(reward,'임무 보상');playSound('reward');
}
function claimAdventure(kind,id){
 if(!Object.hasOwn(adventureCatalogue,kind))return false;
 resetDay();
 const row=orderRows(kind).find(x=>x.id===id);
 if(!row||row.claimed||!row.ready)return false;
 if(saveGuard.usesServer?.())return claimServerReward(kind==='daily'?'orderDaily':'orderWeekly',id);
 const page=adventureBook()[kind];page.claimed[id]=true;
 if(kind==='daily')recordWheelGoal('orders');
 if(kind==='daily'&&!page.dispatchCredited&&adventureActivity(kind)===100){
  page.dispatchCredited=true;trackOrderEvent('dispatchDays');
 }
 payOrder(row.reward);return true;
}
function claimOrderChest(kind,i){
 if(!Object.hasOwn(orderChests,kind)||!Number.isInteger(i)||!orderChests[kind][i])return false;
 resetDay();const page=adventureBook()[kind];
 if(page.chests[i]||adventureActivity(kind)<activityMilestones[i])return false;
 if(saveGuard.usesServer?.())return claimServerReward(kind==='daily'?'chestDaily':'chestWeekly',i);
 page.chests[i]=true;payOrder(orderChests[kind][i]);return true;
}
function lootIcon(reward) {
 const key=reward.forgeGuards?'forgeGuards':Object.keys(reward)[0];
 return `<span class="loot-icon" title="${orderRewardText(reward)}" aria-label="${orderRewardText(reward)}">${art(RESOURCE_ART[key])}<b>${compact(reward[key])}</b></span>`;
}
function orderChestStrip(kind){
 const score=adventureActivity(kind),page=adventureBook()[kind];
 const label=kind==='daily'?'일일 활약도':'주간 활약도';
 const nextIndex=activityMilestones.findIndex((goal,i)=>goal>score&&!page.chests[i]);
 const milestones=orderChests[kind].map((reward,i)=>{
  const goal=activityMilestones[i],done=!!page.chests[i],ready=score>=goal;
  const state=done?'collected':ready?'available':i===nextIndex?'next':'locked';
  return `<button title="${orderRewardText(reward)}" class="${state}" onclick="claimOrderChest('${kind}',${i})" ${done||!ready?'disabled':''} aria-label="${goal} 활약도 · ${orderRewardText(reward)} · ${done?'수령 완료':ready?'받기':state==='next'?'다음 보상':'잠김'}">${lootIcon(reward)}<i class="order-stop" aria-hidden="true">${done?'<ui-mark data-shape=check aria-hidden=true></ui-mark>':''}</i><strong>${goal}</strong></button>`;
 }).join('');
 return `<section class="order-strip" aria-label="${label}"><div class="chest-track">
  <progress class="activity-rail" max="100" value="${score}" aria-label="${label}" aria-valuetext="${score} / 100"></progress>
  <div class="order-score"><b>${score}</b><i class="order-stop" aria-hidden="true"></i><small>활약도</small></div>${milestones}
 </div><small class="weapon-chest-note">활약도 ${activityMilestones[2]} · ${orderRewardText(orderChests[kind][2])}</small></section>`;
}
function renderOrder(row,claim,goTo,daily=false){
 const label=row.claimed?'수령 완료':row.ready?(claim?'받기':'완료'):'이동';
 const action=row.ready?claim:goTo(row.key);
 return `<article class="order-row ${row.ready?'completed':''}">${row.reward?lootIcon(row.reward):art(row.icon,'guild-task-icon')}<div><strong>${row.title}</strong>${progressGauge(row.title,row.value,row.goal)}${row.reward&&Object.keys(row.reward).length>1?'<small class="order-payout">'+orderRewardText(row.reward)+'</small>':''}</div><button${daily&&row.ready&&!row.claimed?' data-guide="claim"':''} class="${row.ready&&claim&&!row.claimed?'gold-button':'muted-button'}" ${row.claimed||!action?'disabled':`onclick="${action}"`}>${label}</button></article>`;
}
function adventureMissionList(kind){
 return orderChestStrip(kind)+`<div class="order-reset"><span>임무 보상 수령 시 +${activityPerOrder[kind]}</span><span>초기화 <time data-reset-clock="${kind}">${resetCountdown(kind)}</time></span></div>`+orderRows(kind).map(row=>renderOrder(row,`claimAdventure('${kind}','${row.id}')`,key=>`playerMissionGo('${orderMetrics[key][1]}')`,kind==='daily')).join('');
}
function forgeDailyOrders(){
 const daily=orderRows('daily');
 const rows=['temper','forgePay','anvil'].map(id=>{
  const row=daily.find(order=>order.id===id);
  const progress=`${Math.min(row.value,row.goal)} / ${row.goal}`;
  let action='';
  if(row.claimed)action='<small class="weapon-order-claimed">수령 완료</small>';
  else if(row.ready)action=`<button class="gold-button" aria-label="${row.title} 보상 받기" onclick="claimAdventure('daily','${id}')">보상 받기</button>`;
  return `<div class="weapon-order-row" data-order="${id}"><strong>${row.title}</strong><span class="weapon-order-progress">${progress}</span>${action}</div>`;
 }).join('');
 return `<section class="weapon-panel weapon-daily-orders" aria-labelledby="forgeDailyTitle"><h3 id="forgeDailyTitle">오늘의 대장간 임무</h3>${rows}</section>`;
}
function adventureRewardReady(kind){
 const page=adventureBook()[kind],score=adventureActivity(kind);
 if(orderChests[kind].some((_,i)=>!page.chests[i]&&score>=activityMilestones[i]))return true;
 return adventureCatalogue[kind].some(([id,metric,goals])=>!page.claimed[id]&&bounded(page.count[orderMetric(page,metric)])>=goals[page.tier]);
}
