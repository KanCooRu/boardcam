const assert=require('node:assert/strict');
const {run}=require('./harness.cjs');
const test=(name,body)=>{
 run("s=starter();s.classId='warrior';unlockClassSkills();resetDay();view='';tab='';guildSection='overview';dungeonRun=null;forgeBusy=false;");
 assert.equal(run('(()=>{'+body+'})()'),true,name);
 console.log('PASS',name);
};

test('six menu tiles and each route',`
 s.maxStage=31;
 const menu=convenientMenu();if((menu.match(/<button/g)||[]).length!==6||menu.includes('<input'))return false;
 return SYSTEM_TILES.map(r=>r[0]).join(' ')==='설정 보상 코드 랭킹 공지 도움말 서버'&&SYSTEM_TILES.every(([,icon,action],index)=>{
  Function(action)();return view===['settings','rewardCode','ranking','notices','support','servers'][index];
 });
`);
test('regular and season rewards, badges and claims are independent',`
 recordPlayerActivity('arena');const points=s.season.points,coins=s.passCoins,gems=s.gems;
 if(missionList('daily').includes('시즌')||missionList('daily').includes('claimPlayerPass')||rewardReady('quests:daily'))return false;
 if(!claimPassMission('daily','arena')||claimPassMission('daily','arena')||adventureActivity('daily'))return false;
 trackOrderEvent('kills',210);if(!rewardReady('quests:daily')||!claimAdventure('daily','patrol')||claimAdventure('daily','patrol'))return false;
 if(!claimOrderChest('daily',0)||claimOrderChest('daily',0)||claimOrderChest('daily',1))return false;
 s.daily.kills=100;if(!claimPassMission('daily','kills')||claimPassMission('daily','kills'))return false;
 s=migrate(JSON.parse(JSON.stringify(s)));
 return s.gems===gems+20&&s.passCoins===coins+5&&s.season.points===points+15&&adventureActivity('daily')===20&&
 !rewardReady('quests:daily')&&!claimOrderChest('daily',0)&&!claimAdventure('daily','patrol')&&passMissionList('daily').includes('수령 완료');
`);
test('five regular contracts open the final reward and count one active day',`
 for(const key of ['kills','fieldOre','volley','guard','healer','waves','skill','bossHits','crafted','dungeon','weaponForge','perfectHit'])trackOrderEvent(key,1000);
 let i=0;
 for(const row of orderRows('daily')){
  if(!claimAdventure('daily',row.id))return false;
  i++;if(adventureActivity('daily')!==Math.min(100,20*i)||bounded(adventureBook().weekly.count.dispatchDays)!==Number(i>=5))return false;
 }
 return i===11&&claimOrderChest('daily',4)&&!claimOrderChest('daily',4)&&s.season.points===0;
`);
test('daily and weekly rails unlock at their own pace and persist through reload',`
 for(const [kind,points] of [['daily',20],['weekly',10]]){
  const rows=orderRows(kind),total=100/points;
  if(!missionList(kind).includes('임무 보상 수령 시 +'+points))return false;
  for(let n=0;n<=total;n++){
   const html=orderChestStrip(kind),score=n*points;
   if(!html.includes('max="100" value="'+score+'"')||
      (html.match(/class="next"/g)||[]).length!==Number(n<total)||
      (html.match(/class="collected"/g)||[]).length!==Math.floor(score/20))return false;
   if(n===total)break;
   const row=rows[n];trackOrderEvent(row.key,row.goal);
   if(!claimAdventure(kind,row.id)||claimAdventure(kind,row.id))return false;
   const nextChest=Math.floor(score/20),ready=(score+points)%20===0;
   if(orderChestStrip(kind).includes('class="available"')!==ready||claimOrderChest(kind,nextChest)!==ready)return false;
   if(claimOrderChest(kind,nextChest))return false;
   s=migrate(JSON.parse(JSON.stringify(s)));
  }
  adventureBook()[kind].period='previous';resetDay();
  if(!orderChestStrip(kind).includes('max="100" value="0"'))return false;
 }
 return true;
`);
test('old weekly claims recalculate at ten points without paying an opened chest twice',`
 const page=adventureBook().weekly;
 for(const [id] of adventureCatalogue.weekly.slice(0,5))page.claimed[id]=true;
 page.chests={0:true,2:true,4:true};
 s=migrate(JSON.parse(JSON.stringify(s)));
 if(adventureActivity('weekly')!==50||!adventureRewardReady('weekly')||!claimOrderChest('weekly',1))return false;
 if(adventureRewardReady('weekly')||claimOrderChest('weekly',3)||claimOrderChest('weekly',4))return false;
 for(const row of orderRows('weekly').filter(r=>!r.claimed)){trackOrderEvent(row.key,row.goal);claimAdventure('weekly',row.id)}
 return adventureActivity('weekly')===100&&claimOrderChest('weekly',3)&&!claimOrderChest('weekly',4)&&!adventureRewardReady('weekly');
`);
test('tiers lock on period entry and daily reset retains weekly progress',`
 trackOrderEvent('kills',10);s.maxStage=700;const before=adventureBook();if(before.daily.tier!==0)return false;
 before.daily.period='old';const next=adventureBook();if(next.daily.tier!==2||next.daily.count.kills||next.weekly.count.kills!==10)return false;
 next.weekly.period='old';const week=adventureBook().weekly;return week.tier===2&&!week.count.kills;
`);
test('three completed days survive reload and award a weekly order once',`
 for(let day=1;day<=3;day++){
  if(day>1){adventureBook().daily.period='previous';resetDay()}
  for(const key of ['kills','fieldOre','volley','guard','healer','waves'])trackOrderEvent(key,500);
  for(const id of ['patrol','supply','volley','ruins','guard'])if(!claimAdventure('daily',id))return false;
  s=migrate(JSON.parse(JSON.stringify(s)));resetDay();
  if(adventureBook().weekly.count.dispatchDays!==day)return false;
  if(day<3&&claimAdventure('weekly','patrol'))return false;
 }
 const gems=s.gems;return claimAdventure('weekly','patrol')&&!claimAdventure('weekly','patrol')&&s.gems===gems+65&&adventureActivity('weekly')===10&&s.season.points===0;
`);
test('legacy reward flags migrate once and both order pages have exactly one gauge per task',`
 delete s.adventureOrders;s.daily.claimed.kills=true;s.weekly.crafted=60;
 resetDay();if(!adventureBook().daily.claimed.patrol||adventureBook().weekly.count.crafted!==60)return false;
 return ['daily','weekly'].every(kind=>{
  const html=missionList(kind);
  return (html.match(/class="order-row/g)||[]).length===adventureCatalogue[kind].length&&(html.match(/role="progressbar"/g)||[]).length===adventureCatalogue[kind].length&&!/undefined|NaN|시즌/.test(html);
 });
`);
test('summons count only committed items including a free draw',`
 s.maxStage=16;
 s.gems=0;s.summonTickets=0;summon(10,true);summonPet(1);
 if(playerPassState().daily.count.skillDraw||playerPassState().daily.count.petDraw)return false;
 practiceDraw();practiceDraw();s.summonTickets=10;summon(10,true);s.gems=PET_SUMMON_PRICE;summonPet(1);
 return playerPassState().daily.count.skillDraw===11&&playerPassState().daily.count.petDraw===1;
`);
test('guild objectives pay once after three distinct tasks',`
 s.maxStage=41;
 OnlineService.command('join',{name:'starlight'});const before=s.ore;
 if(OnlineService.command('mission').ok)return false;
 trackOrderEvent('waves',50);recordPlayerActivity('dungeon',5);
 if(OnlineService.command('mission').ok)return false;
 trackOrderEvent('volley',35);
 if(!OnlineService.command('mission').ok||OnlineService.command('mission').ok)return false;
 s=migrate(JSON.parse(JSON.stringify(s)));
 const o=onlineState();return s.ore===before+20&&o.daily.mission&&guildWeekActivity(guildProfile(o))===20;
`);
test('existing guild progress still qualifies after migration',`
 s.maxStage=41;
 OnlineService.command('join',{name:'starlight'});const d=onlineState().daily;
 delete d.orderVersion;Object.assign(d,{donated:true,arena:1,raid:1});
 s=migrate(JSON.parse(JSON.stringify(s)));return OnlineService.command('mission').ok&&!OnlineService.command('mission').ok;
`);
test('guild daily and weekly progress reset separately',`
 s.maxStage=41;
 OnlineService.command('join',{name:'starlight'});s.gold=1000;OnlineService.command('donate');
 recordPlayerActivity('skill',10);let o=onlineState();o.day='1990-05-01';o=onlineState();
 if(guildOrdersDone(o)!==0||guildOrderValue(o,'skill')||guildWeekActivity(guildProfile(o))!==20)return false;
 guildProfile(o).activityWeek='1990-05-01';return guildWeekActivity(guildProfile(o))===0&&o.contribution===20;
`);
test('legacy ranking lists disappear on migration and the new personal peak survives reload',`
 for(const version of [undefined,1,2]){
  const old=JSON.parse(JSON.stringify(s));delete old.rankPower;old.combatRatingVersion=version;
  old.records=[{power:987654,date:'08:00'}];old.classPowerBests={archer:987654};
  old.previousAttackRanks={records:old.records};old.previousCombatRanks={records:old.records};
  s=migrate(old);recordPower();const expected=Math.round(combatPower());
  if(s.rankPower!==expected||s.rankPower===987654)return false;
  const original=combatPower;try{combatPower=()=>1;save()}finally{combatPower=original}
  s=migrate(JSON.parse(JSON.stringify(s)));
  if(s.rankPower!==expected||['records','classPowerBests','previousAttackRanks','previousCombatRanks','combatRatingVersion'].some(k=>k in s))return false;
 }
 return true;
`);
test('ranking tabs use distinct scores and exclude test progress',`
 s.maxStage=31;
 view='ranking';
 for(const [id,title] of [['power','최고 전투력'],['stage','최고 클리어 단계'],['guild','길드 순위']]){
  rankBoard.choose(id);
  const html=rankingPopup();if(tab!==id||!html.includes(title)||(html.match(/aria-pressed="true"/g)||[]).length!==1||html.includes('역대 전투력'))return false;
 }
 s.testOnly=true;s.rankPower=0;recordPower();
 return !s.rankPower&&rankingPopup().includes('테스트 플레이');
`);
test('home locked slots and empty slots have different actions and art',`
 s.maxStage=1;s.slots=[0,-1,-1,-1];paintSkillButtons();const html=$('skillbuttons').innerHTML;
 return html.includes("openMenu('availableSkills',1)")&&html.includes('battle-slot-plus')&&html.includes('disabled aria-label="STAGE 3 해금"')&&!html.includes("openMenu('availableSkills',2)");
`);
test('each objective page renders valid progress at endgame',`
 s.quest=Q.length;return ['weekly','main','daily','achievements'].every(key=>{
  missionTab=key;const html=questsPopup();return !/NaN|undefined/.test(html)&&(key==='main'?html.includes('모든 성장 임무'):html.includes('role="progressbar"'));
 });
`);

test('role hunt stays available before the forest and an old partial tally carries forward once',`
 const daily=adventureBook().daily;delete daily.huntKind;daily.count={healer:7};
 const row=()=>orderRows('daily').find(item=>item.id==='ruins');
 if(row().key!=='guard'||row().value!==7)return false;
 trackOrderEvent('guard',2);s.maxStage=31;s=migrate(JSON.parse(JSON.stringify(s)));
 if(row().key!=='guard'||row().value!==9)return false;
 adventureBook().daily.period='previous';trackOrderEvent('healer',1);
 return row().key==='healer'&&row().value===1;
`);

test('gold contracts pay once per period at the locked tier and count toward activity',`
 for(const [tier,stage] of [1,100,600].entries()){
  s.maxStage=stage;adventureBook().daily.period='previous';adventureBook().weekly.period='previous';
  for(const [kind,base] of [['daily',[500,1500,2500]],['weekly',[3000,6000,9000]]]){
   const rows=orderRows(kind).filter(row=>row.reward.gold);
   if(rows.length!==base.length)return false;
   for(const [i,r] of rows.entries()){
    const gold=s.gold,gems=s.gems,expected=base[i]*[1,3,6][tier];
    if(r.reward.gold!==expected||claimAdventure(kind,r.id))return false;
    trackOrderEvent(r.key,r.goal);if(!rewardReady('quests:'+kind)||!claimAdventure(kind,r.id))return false;
    s=migrate(JSON.parse(JSON.stringify(s)));
    if(s.gold!==gold+expected||s.gems!==gems||claimAdventure(kind,r.id))return false;
   }
   if(adventureActivity(kind)!==base.length*(kind==='daily'?20:10))return false;
  }
 }
 return true;
`);
test('growth missions show and grant the same currency throughout the chain, including after reload',`
 s.kills=10000;s.crafted=10000;s.stats=[100,100,100,100,100];s.forgeLevel=15;s.maxStage=300;s.stage=1;
 for(let i=0;i<Q.length;i++){
  const gold=s.gold,gems=s.gems,amount=(i+1)%3===0?1000*(i+1)/3:0;
  const label=amount?'골드 '+num(amount):'다이아 100';
  if(!mainQuestPopup().includes(label)||!claimQuest(i)||s.quest!==i+1||claimQuest(i))return false;
  if(s.gold!==gold+amount||s.gems!==gems+(amount?0:100))return false;
  if(i===8)s=migrate(JSON.parse(JSON.stringify(s)));
 }
 return !claimQuest(s.quest)&&mainQuestPopup().includes('모든 성장 임무를 완료');
`);

test('forge missions use fixed targets and payouts at every tier while the existing chest rewards stay the same',`
 const chests={daily:[{ore:10},{gems:25},{stones:20,starIron:5},{summonTickets:1},{gems:100}],
  weekly:[{ore:50},{gems:50},{relicShards:40,starIron:20},{summonTickets:2,petTickets:2},{gems:200}]};
 if(JSON.stringify(orderChests)!==JSON.stringify(chests))return false;
 for(const [tier,stage] of [1,100,600].entries()){
  s.maxStage=stage;adventureBook().daily.period='prev';adventureBook().weekly.period='prev';
  const daily=orderRows('daily'),weekly=orderRows('weekly');
  if(daily.length!==11||weekly.length!==10)return false;
  const anvil=daily.find(row=>row.id==='anvil'),week=weekly.find(row=>row.id==='temper');
  if(anvil.key!=='perfectHit'||anvil.goal!==3||JSON.stringify(anvil.reward)!=='{"starIron":5}')return false;
  if(week.key!=='weaponForge'||week.goal!==10||week.reward.forgeGuards!==1||week.reward.starIron!==15||
     week.reward.gold!==3000*[1,3,6][tier])return false;
  const oldDaily={temper:{gold:500,starIron:3},patrol:{gems:20},forgePay:{gold:1500,starIron:5},supply:{ore:12},
   volley:{shards:12},ruins:{stones:18},dungeonPay:{gold:2500},guard:{gems:20},hunt:{relicShards:8},study:{shards:18}};
  const oldWeekly={patrol:{gems:65},huntPay:{gold:6000,starIron:20},supply:{ore:55},ruins:{stones:65},hunt:{relicShards:35},
   trainingPay:{gold:9000},guard:{gems:65},raid:{summonTickets:2},volley:{shards:55}};
  for(const [baseline,rows] of [[oldDaily,daily],[oldWeekly,weekly]]){
   for(const [id,reward] of Object.entries(baseline)){
    if(reward.gold)reward.gold*=[1,3,6][tier];
    if(JSON.stringify(rows.find(r=>r.id===id)?.reward)!==JSON.stringify(reward))return false;
   }
  }
 }
 return true;
`);

test('three settled manual perfect strikes pay five iron once from either screen and share the other two daily claims',`
 const random=Math.random,now=performance.now;
 let clock=1000;performance.now=()=>clock;Math.random=()=>.99;
 const forge=()=>{navigate('forge','weapon');return forgeScreen()};
 const quests=()=>{openMissions('daily');return questsPopup()};
 const button=(html,id)=>[...html.matchAll(/onclick="([^"]+)"/g)].map(m=>m[1]).find(action=>action==="claimAdventure('daily','"+id+"')");
 try{
  for(const forgeFirst of [true,false]){
   s=starter();s.classId='warrior';s.effects=true;s.powerSaving=false;s.gold=s.starIron=s.stones=100000;s.ore=25;resetDay();
   const start=forge(),card=forgeDailyOrders();
   if(!start.includes(card)||start.indexOf(card)>start.indexOf("openWeaponRitual(")||
      [...card.matchAll(/data-order="([^"]+)"/g)].map(m=>m[1]).join(',')!=='temper,forgePay,anvil'||
      ['temper','forgePay','anvil'].some(id=>button(card,id)))return false;
   for(let n=1;n<=3;n++){
    openWeaponRitual('weaponEnhance');
    if(!attemptWeaponEnhance()||weaponRitual.phase!=='aim'||adventureBook().daily.count.perfectHit!== (n===1?undefined:n-1))return false;
    const a=weaponRitual;clock+=300;
    if(!settleWeaponAim(a)||settleWeaponAim(a)||a.result.timing!=='perfect'||adventureBook().daily.count.perfectHit!==n)return false;
    const row=orderRows('daily').find(r=>r.id==='anvil');
    if(row.value!==n||row.ready!==(n===3)||Boolean(button(forge(),'anvil'))!==(n===3))return false;
   }
   s.autoEquip=false;forgeCraft(10,true);
   for(const id of ['anvil','temper','forgePay']){
    const row=orderRows('daily').find(r=>r.id===id);
    const fromForge=button(forge(),id),fromQuests=button(quests(),id);
    if(!row.ready||!fromForge||!fromQuests)return false;
    const first=forgeFirst?fromForge:fromQuests,stale=forgeFirst?fromQuests:fromForge;
    if(forgeFirst)forge();else quests();
    const iron=s.starIron,gold=s.gold,score=adventureActivity('daily');
    if(!eval(first)||s.starIron!==iron+row.reward.starIron||s.gold!==gold+(row.reward.gold||0)||
       adventureActivity('daily')!==score+20)return false;
    if(forgeFirst)quests();else forge();
    if(eval(stale)||button(forge(),id)||button(quests(),id)||s.starIron!==iron+row.reward.starIron)return false;
    s=migrate(JSON.parse(JSON.stringify(s)));
    if(!orderRows('daily').find(r=>r.id===id).claimed||claimAdventure('daily',id))return false;
   }
  }
  return true;
 }finally{performance.now=now;Math.random=random}
`);

test('ten settled weekly attempts count success, keep, protection and destruction and pay one guard once',`
 const random=Math.random;
 try{
  s.effects=false;s.gold=s.stones=s.starIron=100000;s.weapons.warrior=readWeapon({plus:15});
  s.forgeGuards=1;s.forgeGuardOn=true;
  const cases=[[0,'success'],[.99,'keep'],[.185,'keep'],[.185,'destroy'],...Array.from({length:6},()=>[0,'success'])];
  for(const [i,[roll,outcome]] of cases.entries()){
   Math.random=()=>roll;
   if(i===9)s=migrate(JSON.parse(JSON.stringify(s)));
   openWeaponRitual('weaponEnhance');if(!attemptWeaponEnhance())return false;
   if(weaponRitual.phase==='warning'&&!confirmForgeRisk())return false;
   if(weaponRitual.result?.outcome!==outcome||weaponRitual.result.protected!==(i===2)||attemptWeaponEnhance())return false;
   const weekly=orderRows('weekly').find(r=>r.id==='temper');
   if(weekly.value!==i+1||weekly.ready!==(i===9)||i<9&&claimAdventure('weekly','temper'))return false;
  }
  if(s.forgeGuards!==0)return false;
  const gold=s.gold,iron=s.starIron;
  openMissions('weekly');const html=questsPopup();
  const handler=[...html.matchAll(/onclick="([^"]+)"/g)].map(m=>m[1]).find(action=>action==="claimAdventure('weekly','temper')");
  if(!handler||!html.includes('파괴 방지권 1')||!eval(handler)||eval(handler))return false;
  s=migrate(JSON.parse(JSON.stringify(s)));
  if(claimAdventure('weekly','temper')||s.forgeGuards!==1||s.gold!==gold+3000||s.starIron!==iron+15)return false;
  // A player who already claimed the old five-attempt weekly contract cannot reclaim it after the update.
  const raw=JSON.parse(JSON.stringify(s));raw.adventureOrders.weekly.count.weaponForge=5;raw.forgeGuards=0;
  s=migrate(raw);trackOrderEvent('weaponForge',5);
  return s.forgeGuards===0&&!claimAdventure('weekly','temper');
 }finally{Math.random=random}
`);

test('retired tower achievement IDs keep earned titles and never create new targets or rewards',`
 const retired=[10,23,24,25,26], oldTitle='achievement-10';
 s.towerFloor=s.towerBest=500;
 s.achievements[10]=true;
 s=migrate(JSON.parse(JSON.stringify(s)));
 if(!titleOwned(oldTitle)||!equipTitle(oldTitle)||s.title!=='탑의 도전자')return false;
 const objectives=achievementsPopup(),catalogue=titlesUI(),gems=s.gems;
 if(!catalogue.includes('1 / '+(TITLE_DEFS.length-4)))return false;
 for(const id of retired){
  if(objectives.includes('claimAchievement('+id+')')||rewardReady('achievements:'+id)||claimAchievement(id))return false;
  if(id!==10&&catalogue.includes(ACHIEVEMENTS[id][1]))return false;
  try{economyClaimRule(s,{source:'achievement',id},Math.random,Date.now());return false}
  catch(error){if(error.message!=='등록되지 않은 보상입니다.')return false}
 }
 return catalogue.includes('탑의 도전자')&&s.titleId===oldTitle&&s.gems===gems&&
  ACHIEVEMENTS[11][1]==='어둠길의 길잡이'&&ACTIVE_ACHIEVEMENT_IDS.includes(11)&&
  objectives.includes('어둠길의 길잡이')&&s.achievements[10];
`);

test('retired roulette mission preserves v1 and v2 earned coins and the next historical mission ID',`
 s.maxStage=51;
 for(const prior of [
  {claimed:['skill-200','crafted-60'],spent:1},
  {version:2,claimed:['tower','rush'],spent:1}
 ]){
  const journal=normalizeWheelJournal(prior);
  const season=royalEventState();season.missions=journal;
  recordWheelGoal('tower',5);
  const rows=wheelMissionRows(),markup=wheelMissionUI();
  if(rows.length!==19||rows.some(row=>row.id==='tower')||claimWheelMission('tower'))return false;
  if(!rows.find(row=>row.id==='rush')?.claimed||!markup.includes('수령 1 / 19'))return false;
  if(wheelTokens()!==1||JSON.stringify(journal)!==JSON.stringify(normalizeWheelJournal(journal)))return false;
  if(economyDrawQuote(s,'roulette',1,Date.now()).payment!=='coin')return false;
 }
 royalEventState().missions=normalizeWheelJournal({version:2,count:{tower:5},claimed:[],spent:0});
 return wheelTokens()===0&&!claimWheelMission('tower');
`);
