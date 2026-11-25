const assert=require('node:assert/strict');const {run}=require('./harness.cjs');let passed=0;
require('./arena-account.cjs');
function reset(){run("s=starter();s.classId='warrior';s.costumes=[0];s.wear=0;unlockClassSkills();dungeonRun=null;forgeBusy=false;resultAction=null;testSession=false;pendingPlayerImport=null;cancelCombatAnimation();cooldowns=[0,0,0,0];resetDay();")}
function test(name,code){reset();assert.equal(run(code),true,name);passed++;console.log('PASS',name)}
test('new players offered guide; old save does not interrupt',`s.journey.status==='offer'&&migrate({}).journey.status==='idle'`);
test('direct tutorial gates actual action and persists its paused completion notice',`(()=>{
 s.guidance.status='active';
 if(nextPlayerJourney()||s.guidance.completeAt)return false;
 forgeCraft(1);advanceQuickGuide();pausePlayerJourney();
 const r=migrate(JSON.parse(JSON.stringify(s)));
 return r.guidance.step===0&&r.guidance.status==='paused'&&r.guidance.completeAt===s.guidance.completeAt&&r.guidance.completeAt>0;
})()`);
test('completed guide migration never strands invalid final step',`migrate({...s,journey:{status:'active',step:100}}).journey.status==='done'`);
for(let i=0;i<5;i++)test('growth '+i+' preview matches actual upgrade',`(()=>{s.gold=1e9;s.growthBatch=10;const before=JSON.stringify(s),p=growthCombatPreview(${i});if(JSON.stringify(s)!==before)return false;upgrade(${i});const actual=playerCombatStats();return ['attack','hp','dps','gold'].every(k=>actual[k]===p.after[k])})()`);
test('skill cooldown failure does not inflate progress',`(()=>{ensureEncounter().readyAt=Date.now();const k=cast(0,true);const after=playerPassState().daily.count.skill;return k===true&&cast(0,true)===false&&after===1&&playerPassState().daily.count.skill===1})()`);
test('real arena attempts counted; rejected sixth ignored',`(()=>{s.maxStage=41;for(let i=0;i<6;i++)OnlineService.command('arena',{id:'peer-arena_b'});return playerPassState().daily.count.arena===5&&playerPassState().weekly.count.arena===5})()`);
test('guild donation counts only successful command',`(()=>{s.maxStage=41;s.gold=1000;OnlineService.command('join',{name:'starlight'});OnlineService.command('donate');OnlineService.command('donate');return playerPassState().daily.count.guild===1})()`);
test('dungeon completion counted at most once',`(()=>{dungeonRun={mode:'daily',i:0,n:1};finishDungeon(true);finishDungeon(true);return playerPassState().weekly.count.dungeon===1})()`);
test('failed dungeon earns no mission progress',`(()=>{dungeonRun={mode:'daily',i:0,n:1};finishDungeon(false);return !playerPassState().weekly.count.dungeon})()`);
test('same mission pays once across both tracks',`(()=>{recordPlayerActivity('skill',10);seasonPassTrack='free';if(!claimPassMission('daily','skill'))return false;seasonPassTrack='premium';return !claimPassMission('daily','skill')&&s.season.points===10})()`);
test('one shared list grants the displayed points and coins for every row',`(()=>{
 for(const kind of ['daily','weekly']){
  for(const [key,,goal,,,base] of SEASON_MISSIONS[kind]){if(base)s[kind][key]=goal;else recordPlayerActivity(key,goal)}
  const initial=s.season.points;
  for(const {key,points,coins} of seasonMissionRows(kind)){
   const before=s.season.points,balance=s.passCoins;
   if(!rewardReady(kind+':'+key)||!claimPassMission(kind,key)||s.season.points!==before+points||s.passCoins!==balance+coins||claimPassMission(kind,key))return false;
  }
  if(s.season.points!==initial+(kind==='daily'?70:210)||rewardReady(kind))return false;
 }
 return !claimPassMission('seasonal','kills')&&!rewardReady('seasonal');
})()`);
test('old basic and choice claims, earned points and rewards survive reload',`(()=>{
 const p=playerPassState();p.daily.claimed.skill=true;p.daily.points=20;p.daily.count.skill=10;p.daily.count.worldBoss=1;
 s.daily.kills=100;s.daily.claimed.kills=true;s.season.points=430;s.season.claimed[0]=true;s.season.premiumClaimed[1]=true;
 s=migrate(JSON.parse(JSON.stringify(s)));
 return !claimPassMission('daily','skill')&&!claimPassMission('daily','kills')&&claimPassMission('daily','worldBoss')&&s.season.points===440&&s.season.claimed[0]&&s.season.premiumClaimed[1];
})()`);
test('daily and weekly periods reset counters and claim flags independently',`(()=>{
 recordPlayerActivity('skill',100);claimPassMission('daily','skill');claimPassMission('weekly','skill');
 const p=playerPassState();p.daily.key='old';resetDay();
 if(p.daily.claimed.skill||p.daily.count.skill||p.weekly.count.skill!==100||!p.weekly.claimed.skill)return false;
 p.weekly.key='old';resetDay();return !p.weekly.claimed.skill&&!p.weekly.count.skill&&s.season.points===30;
})()`);
test('four weeks of non-summon solo and public activities can finish twenty levels',`(()=>{
 const attainable=kind=>seasonMissionRows(kind).filter(r=>!['petDraw','skillDraw','guild'].includes(r.key)).reduce((sum,r)=>sum+r.points,0);
 return attainable('daily')*28+attainable('weekly')*4===2300&&SEASON_PASS_REWARDS.at(-1).goal===2000;
})()`);
test('season end rolls from one remaining day to 28 and clears only season rewards',`(()=>{
 const end=passSeasonEnd();if(seasonDaysLeft(end-1)!==1||seasonDaysLeft(end)!==28||seasonDaysLeft(end-86400001)!==2)return false;
 recordPlayerActivity('arena');s.season.cycle--;s.season.points=400;s.season.claimed[0]=true;s.season.premiumClaimed[0]=true;s.passClaimed[10]=true;
 resetDay();return !s.season.points&&!s.season.claimed[0]&&!s.season.premiumClaimed[0]&&s.passClaimed[10]&&playerPassState().weekly.count.arena===1;
})()`);
test('import staging and cancellation preserve current save',`(()=>{const before=JSON.stringify(s),candidate=JSON.parse(before);candidate.gold+=123;stagePlayerImport(candidate);const ok=JSON.stringify(s)===before&&pendingPlayerImport.data.gold===candidate.gold;cancelPlayerImport();return ok&&JSON.stringify(s)===before})()`);
test('confirmed import waits for server recovery and rejects duplicate clicks',`(()=>{
 const before=JSON.stringify(s),candidate=JSON.parse(before);candidate.gold=12345;candidate.nickname='백업 검사';
 stagePlayerImport(candidate);
 if(!playerImportPopup().includes('선택한 파일'))return false;
 const original=saveGuard.importLocal,requests=[];
 try{
  saveGuard.importLocal=raw=>{requests.push(JSON.parse(raw));return Promise.resolve(true)};
  const restoring=confirmPlayerImport();
  return restoring instanceof Promise&&!confirmPlayerImport()&&requests.length===1&&requests[0].gold===12345&&
   requests[0].nickname==='백업 검사'&&JSON.stringify(s)===before;
 }finally{saveGuard.importLocal=original}
})()`);
test('stale import cannot replace a changed local identity',`(()=>{const candidate=JSON.parse(JSON.stringify(s));stagePlayerImport(candidate);s.localId='different';return !confirmPlayerImport()})()`);
test('online reset fixed at next UTC midnight',`playerResetTime('online',Date.parse('2026-11-05T23:59:59Z'))===Date.parse('2026-11-06T00:00:00Z')`);
test('free and paid tracks share two sorted lists and show every reward on the track',`(()=>{
 passMode='season';s.daily.kills=100;recordPlayerActivity('skill',10);claimPassMission('daily','skill');
 for(const track of ['free','premium']){
  seasonPassTrack=track;
  for(const kind of ['daily','weekly']){
   passMissionTab=kind;const h=passPopup(),rows=seasonMissionRows(kind);
   if(/선택 임무|시즌 도전|보상 목록|패스 안내|→ 진행 중|⌑|undefined/.test(h)||!h.includes('시즌종료 : ')||(h.match(/data-pass-mission=/g)||[]).length!==rows.length)return false;
   if(rows.some((r,i)=>i&&rows[i-1].priority>r.priority))return false;
   const pages=passTrack('season');if((pages.match(/class="rail-stage /g)||[]).length!==20||pages.includes('goSeasonPage'))return false;
   if(!pages.includes('별철')||!pages.includes('소환권')||/\d+P</.test(pages))return false;
  }
 }
 setPassMode('benefits');setPassMissionTab('rewards');return passMode==='season'&&passMissionTab==='weekly';
})()`);
test('season pass guards match the displayed levels, entitlements, and claim receipts',`(()=>{
 const levels=track=>passRewardRows('season',false,track).filter(row=>row.reward.forgeGuards)
  .map(row=>[row.index+1,row.reward.forgeGuards]);
 if(JSON.stringify(levels('free'))!=='[[20,1]]'||JSON.stringify(levels('premium'))!=='[[10,1],[20,2]]')return false;
 seasonPassTrack='free';s.season.points=2000;
 if(!passTrack('season').includes(art(RESOURCE_ART.forgeGuards))||!claimSeason(19)||claimSeason(19)||s.forgeGuards!==1)return false;
 seasonPassTrack='premium';
 if(claimSeason(9,'premium')||claimAllPass('season')||s.forgeGuards!==1||
    !passTrack('season').includes('파괴 방지권 2'))return false;
 testSession={enabled:true,premiumCycle:s.season.cycle};
 if(!claimSeason(9,'premium')||s.forgeGuards!==2||!claimAllPass('season')||s.forgeGuards!==4)return false;
 return !claimSeason(19,'premium')&&!claimAllPass('season')&&migrate(JSON.parse(JSON.stringify(s))).forgeGuards===4;
})()`);
test('every third season level grants gems; the free track pays 3,000 and the paid track twice that',`(()=>{
 return [['free',3000],['premium',6000]].every(([track,gems])=>{
  const rows=passRewardRows('season',false,track),totals=passTotals(track);
  return rows.length===20&&rows.every(r=>!!r.reward.gems===((r.index+1)%3===0))&&totals.gems===gems&&totals.petTickets>0;
 });
})()`);
test('showcase portraits retain measured foot pivots',`CLASSES.every(c=>[0,1,2,3,4,5].every(r=>classSprite(c.id,r).includes('--display-height:'))&&eventCostumeSprite(c.id).includes('assets/proportions/'+c.id+'-event.webp')&&eventCostumeSprite(c.id).includes('--foot-x:'))`);
console.log(JSON.stringify({passed}));
