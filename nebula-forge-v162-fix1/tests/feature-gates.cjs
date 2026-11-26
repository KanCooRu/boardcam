'use strict';
const assert=require('node:assert/strict');
const {run}=require('./harness.cjs');
const thresholds=new Map([
 [5,['material','attendance']],
 [10,['relics','pass','event']],
 [15,['pets','mine']],
 [20,['explore','costume','collection']],
 [30,['rush','ranking']],
 [40,['haven','guild','arena','havenShop']],
 [50,['worldBoss','partyRaid','roulette','trial']]
]);
run('let gateTestNotices=[];notice=message=>gateTestNotices.push(message)');
const json=expr=>JSON.parse(run('JSON.stringify('+expr+')'));
function fresh(){
 run("testSession=null;s=starter();s.classId='warrior';unlockClassSkills();s.effects=false;s.gold=100000;s.gems=5000;s.petTickets=10;activeScreen='home';screenTab='';view='';tab='';popupStack=[];dungeonRun=null;resultAction=null;forgeBusy=wheelBusy=false;resetDay();gateTestNotices=[];");
}
function verified(name,scenario){fresh();scenario();console.log('PASS',name)}

verified('all stage thresholds use the highest stage reached after clearance',()=>{
 for(const [threshold,keys] of thresholds){
  for(const key of keys){
   const id=JSON.stringify(key);
   assert.equal(run('featureStage('+id+')'),threshold,key);
   for(const max of [1,threshold,threshold+1]){
    run('s.maxStage='+max+';s.stage=1');
    assert.equal(run('featureOpen('+id+')'),max>threshold,key+' at '+max);
   }
  }
 }
});

verified('unlocked day-one screens, paid tabs and skill summons stay accessible',()=>{
 for(const [page,sub] of [
  ['character','growth'],['character','equipment'],['skills','library'],['forge','craft'],['forge','weapon'],
  ['shop','diamonds'],['shop','exchange'],['shop','summon'],['shop','packages']
 ]){
  run('navigate('+JSON.stringify(page)+','+JSON.stringify(sub)+')');
  assert.deepEqual(json('[activeScreen,screenTab]'),[page,sub]);
 }
 for(const name of ['quests','mail','notices','settings','profile','offline','vip','diamondProduct']){
  run('dismissPopup();openMenu('+JSON.stringify(name)+')');
  assert.equal(run('view'),name);
 }
});

verified('locked routes and actions preserve the original screen, popup, wallets and entry counts',()=>{
 run("navigate('forge','weapon');openMenu('settings');shopSummonKind='skill';onlineState()");
 const snapshot=()=>json(`[activeScreen,screenTab,view,tab,shopSummonKind,s.gems,s.petTickets,s.rouletteCoins,
  s.towerPass,s.rushPass,s.goldPass,s.minePass,s.arenaPass,s.daily.admissions,s.petShards,s.pets,
  s.dungeonWins,s.mineRun||null,s.expeditions,dungeonRun?.mode||null,resultAction?.kind||null]`);
 for(const [stage,action] of [
  [5,"navigate('dungeon','challenges')"],[5,"openMenu('dungeonGuide','gold')"],[5,"openMenu('attendance')"],[5,"startDungeon(0)"],
  [10,"openMenu('relics')"],[10,"navigate('shop','pass')"],[10,"openMenu('event')"],
  [15,"openShopSummons('pet')"],[15,"selectShopSummon('pet')"],[15,"summonPet(1,true)"],[15,"startMine()"],
  [20,"openMenu('collection')"],[20,"navigate('dungeon','explore')"],[20,"rollCostume(1,false)"],
  [30,"startRush()"],[30,"openMenu('ranking')"],
  [40,"navigate('content','town')"],[40,"openTownPlace('guild')"],[40,"openMenu('online','arena')"],[40,"openMenu('havenShop')"],
  [50,"openMenu('online','raid')"],[50,"openMenu('raidComing')"],[50,"worldBoss.start()"],[50,"worldBoss.sweep()"],
  [50,"partyRaid.start()"],[50,"openMenu('royalEvent')"],[50,"rollRoyalEvent(1,false)"]
 ]){
  const before=snapshot();
  run('gateTestNotices=[];'+action);
  assert.deepEqual(snapshot(),before,action);
  assert.ok(json('gateTestNotices').includes('STAGE '+stage+' 클리어 시 열립니다'),action+' explains its threshold');
 }
 run("dismissPopup();navigate('character','growth');switchScreenTab('pets')");
 assert.equal(run('screenTab'),'growth');
});

verified('real shop selector stays present and clickable with one lock badge, then loses the badge when unlocked',()=>{
 run("openShopSummons('skill')");
 const handler=run('shopScreen()').match(/onclick="(selectShopSummon\('pet'\))"/)?.[1];
 assert.ok(handler,'the companion summon tab is rendered on a fresh account');
 const values=json(`(()=>{
  const button=document.createElement('button'),attrs={onclick:${JSON.stringify(handler)}};
  let badge=null,appendCount=0;
  button.getAttribute=name=>attrs[name];button.setAttribute=(name,value)=>{attrs[name]=value};
  button.removeAttribute=name=>delete attrs[name];button.querySelector=selector=>selector==='.feature-lock-badge'?badge:null;
  button.append=child=>{badge=child;appendCount++;child.remove=()=>{badge=null}};
  const root={querySelectorAll:selector=>selector.includes('button')?[button]:[]};
  hydrateArt(root);hydrateArt(root);
  const locked=[button.dataset.featureLocked,attrs['aria-description'],badge?.innerHTML,!!button.disabled,appendCount];
  s.maxStage=16;hydrateArt(root);
  return [locked,!!badge,!!button.dataset.featureLocked,attrs.onclick];
 })()`);
 assert.equal(values[0][0],'pets');
 assert.equal(values[0][1],'STAGE 15 클리어 시 열립니다');
 // The padlock is the drawn mark, or the painted one once the constellation art is switched on.
 assert.match(values[0][2],/(data-shape="lock"|class="lock-art").*STAGE 15/);
 assert.deepEqual(values[0].slice(3),[false,1]);
 assert.deepEqual(values.slice(1),[false,false,handler]);
});

verified('missions and the first-adventure guide leave locked destinations closed',()=>{
 run("navigate('character','growth');openMissions('daily');playerMissionGo('petDraw')");
 assert.deepEqual(json('[activeScreen,screenTab,view,shopSummonKind]'),['character','growth','quests','skill']);
 run("s.maxStage=41;playerMissionGo('raid')");
 assert.deepEqual(json('[activeScreen,screenTab,view]'),['character','growth','quests']);
 run("s.maxStage=5;dismissPopup();s.guidance.status='active';s.guidance.step=6;guideAction()");
 assert.equal(run('activeScreen'),'character');
 assert.match(run('quickGuideHTML()'),/STAGE 5를 넘으면 이어집니다/);
});

verified('stage five opens once, banner visits the chosen feature, and earlier regions keep access after reload',()=>{
 for(let stage=1;stage<=5;stage++){
  run('for(let i=0;i<campaignKillsNeeded('+stage+');i++)advanceCampaign('+stage+');updateAdventureUnlocks()');
  assert.equal(run('s.maxStage'),stage+1);
  const panel=run("$('featureUnlockBanner')");
  if(stage<5){assert.equal(run("featureOpen('material')"),false);assert.equal(panel.hidden,true);continue}
  assert.equal(panel.hidden,false);
  assert.match(panel.innerHTML,/새 기능/);assert.match(panel.innerHTML,/재료 던전/);assert.match(panel.innerHTML,/출석/);assert.match(panel.innerHTML,/가 보기/);
 }
 assert.equal(run("s.seenUnlocks.material===true&&s.seenUnlocks.attendance===true"),true);
 run("selectFeatureUnlock('attendance');visitFeatureUnlock()");
 assert.equal(run('view'),'attendance');
 run("dismissPopup();travel(-1);updateAdventureUnlocks()");
 assert.equal(run("s.stage===5&&s.maxStage===6&&featureOpen('material')&&$('featureUnlockBanner').hidden"),true);
 run('s=migrate(JSON.parse(JSON.stringify(s)));updateAdventureUnlocks()');
 assert.equal(run("featureOpen('attendance')&&$('featureUnlockBanner').hidden"),true);
});

verified('legacy saves initialize only actually reached features without an announcement flood',()=>{
 run(`const oldUnlockSave=JSON.parse(JSON.stringify(s));delete oldUnlockSave.seenUnlocks;
  oldUnlockSave.stage=5;oldUnlockSave.maxStage=21;oldUnlockSave.campaignCleared=20;
  oldUnlockSave.onlineTest={...onlineState(),wins:10,guild:'기존 길드',raidBest:10};oldUnlockSave.partyRaid={clears:1};
  s=migrate(oldUnlockSave);updateAdventureUnlocks();`);
 assert.equal(run("$('featureUnlockBanner').hidden"),true);
 for(const [threshold,keys] of thresholds)for(const key of keys){
  const id=JSON.stringify(key),open=21>threshold;
  assert.equal(run('featureOpen('+id+')'),open,key);
  assert.equal(run('s.seenUnlocks['+id+']===true'),open,key);
 }
});

verified('all-features toggle is limited to the test account and never persists into the real save',()=>{
 run('s.testUnlockAll=true');
 assert.equal(run("featureOpen('worldBoss')"),false);
 run('delete s.testUnlockAll;enterTestMode()');
 assert.equal(run('!!testSession'),true);
 run('toggleTestFeatureUnlocks()');
 for(const keys of thresholds.values())for(const key of keys)assert.equal(run('featureOpen('+JSON.stringify(key)+')'),true,key);
 assert.equal(run('s.maxStage'),1);
 run('toggleTestFeatureUnlocks()');
 assert.equal(run("featureOpen('material')"),false);
 run('toggleTestFeatureUnlocks();leaveTestMode()');
 assert.equal(run("!testSession&&!s.testUnlockAll&&!featureOpen('worldBoss')&&s.maxStage===1"),true);
});

verified('retired tower stays absent for an existing advanced player',()=>{
 run("s.maxStage=80;s.towerFloor=28;s.towerBest=28;s.towerPass=2;navigate('dungeon','content')");
 assert.equal(run("Object.hasOwn(FEATURE_GATES,'tower')"),false);
 assert.doesNotMatch(run('dungeonScreen()'),/무한의 탑|towerRanking/);
 assert.match(run('dungeonScreen()'),/오늘의 탑/);
 run("openMenu('towerRanking');openMenu('dungeonGuide','tower');openDungeonContent('tower')");
 assert.equal(run('view'),'');
 run("navigate('dungeon','tower')");
 assert.equal(run('screenTab'),'content');
 run("switchScreenTab('records')");
 assert.doesNotMatch(run('dungeonScreen()'),/무한의 탑/);
 assert.deepEqual(json('[s.towerBest,s.towerPass,dungeonRun]'),[28,2,null]);
});
