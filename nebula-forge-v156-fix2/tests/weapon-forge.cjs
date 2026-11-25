const assert=require('node:assert/strict');
const {run}=require('./harness.cjs');

function scenario(name,check){
 run("s=starter();s.classId='warrior';s.effects=false;resetDay();view='';dungeonRun=null;forgeBusy=wheelBusy=false;");
 assert.equal(run('('+check.toString()+')()'),true,name);
 console.log('PASS',name);
}
scenario('paid enhancement commits once, guarded against repeated clicks, failure preserves XP and fixed odds',()=>{
 const w=currentWeapon();w.xp=18;s.gold=5000;
 openWeaponRitual('weaponEnhance');
 if(!attemptWeaponEnhance()||attemptWeaponEnhance()||w.plus!==1||s.gold!==4900||s.starIron!==2||s.stones!==130)return false;
 w.plus=4;const rate=enhanceChance(w),cost=weaponCost(4),random=Math.random;
 if(cost.stones!==50||cost.starIron!==15||cost.gold!==500)return false;
 s.starIron=14;openWeaponRitual('weaponEnhance');
 if(attemptWeaponEnhance()||s.starIron!==14||s.stones!==130||s.gold!==4900)return false;
 s.starIron=15;
 try{Math.random=()=>.999;openWeaponRitual('weaponEnhance');if(!attemptWeaponEnhance())return false}finally{Math.random=random}
 if(w.plus!==4||w.xp!==18||enhanceChance(w)!==rate||s.starIron!==0||s.stones!==80||s.gold!==4400)return false;
 const old=JSON.parse(JSON.stringify(s));s=migrate(old);
 if(s.weapons.warrior.misses!==0||adventureBook().daily.count.weaponForge!==2||adventureBook().weekly.count.weaponForge!==2)return false;
 s.starIron=0;openWeaponRitual('weaponEnhance');return !attemptWeaponEnhance()&&s.gold===old.gold&&s.stones===old.stones;
});
scenario('manual strikes use the ping-pong gauge without changing cost or odds',()=>{
 s.effects=true;s.powerSaving=false;s.gold=s.starIron=s.stones=100000;
 const time=performance.now,random=Math.random,track=recordPlayerActivity;
 let clock=1000,perfectHits=0,attempts=0;const events=[];
 performance.now=()=>clock;
 recordPlayerActivity=(key,...args)=>{events.push(key);return track(key,...args)};
 try{
  const thresholds=[[179,'miss'],[181,'good'],[263,'good'],[265,'perfect'],[335,'perfect'],[337,'good'],[419,'good'],[421,'miss']];
  for(const [ms,expected] of thresholds){
   if(forgeAimGrade(ms)!==expected||forgeAimGrade(1200-ms)!==expected)return false;
  }
  const grades=[[0,'miss'],[240,'good'],[300,'perfect'],[600,'miss'],[900,'perfect'],[960,'good'],[1200,'miss']];
  for(const [elapsed,grade] of grades){
   if(forgeAimGrade(elapsed)!==grade)return false;
   for(const [roll,win] of [[0,true],[.999,false]]){
    const w=currentWeapon();w.plus=4;Math.random=()=>roll;
    const cost=weaponCost(4),before=Object.keys(cost).map(k=>s[k]),eventIndex=events.length;
    openWeaponRitual('weaponEnhance');
    if(!attemptWeaponEnhance()||weaponRitual.phase!=='aim'||attemptWeaponEnhance())return false;
    if(!ritualContent('weaponEnhance').includes('내려치기')||events.length!==eventIndex||w.plus!==4||
       Object.keys(cost).some((k,i)=>s[k]!==before[i]))return false;
    const aim=weaponRitual;clock+=elapsed;
    settleWeaponAim(aim);settleWeaponAim(aim);settleWeaponAim(aim,true);
    if(aim.result?.timing!==grade||aim.result.ok!==win||w.plus!==4+Number(win)||
       Object.entries(cost).some(([k,v],i)=>s[k]!==before[i]-v))return false;
    const added=events.slice(eventIndex);
    if(added.filter(k=>k==='weaponForge').length!==1||added.filter(k=>k==='perfectHit').length!==Number(grade==='perfect'))return false;
    perfectHits+=Number(grade==='perfect');attempts++;
    const book=adventureBook();
    for(const period of [book.daily,book.weekly]){
     if((period.count.perfectHit||0)!==perfectHits||period.count.weaponForge!==attempts)return false;
    }
   }
  }
  return true;
 }finally{Math.random=random;performance.now=time;recordPlayerActivity=track}
});
scenario('a closed aiming window cannot spend materials or settle a new ritual on timeout',()=>{
 s.effects=true;s.powerSaving=false;
 const w=currentWeapon(),gold=s.gold,iron=s.starIron,stones=s.stones;
 const schedule=setTimeout,now=performance.now,callbacks=[];
 let clock=1000;performance.now=()=>clock;
 setTimeout=(fn,ms)=>{if(ms===4000)callbacks.push(fn);return schedule(fn,ms)};
 try{
  openWeaponRitual('weaponEnhance');attemptWeaponEnhance();
  if(!callbacks.length)return false;
  dismissPopup();clock+=4000;callbacks[0]();
  if(s.gold!==gold||s.starIron!==iron||s.stones!==stones||w.plus||s.forgeManualTries)return false;
  openWeaponRitual('weaponEnhance');attemptWeaponEnhance();
  callbacks[0]();
  if(callbacks.length!==2||weaponRitual.phase!=='aim'||s.gold!==gold)return false;
  clock+=4000;callbacks[1]();callbacks[1]();
  return weaponRitual.result?.timing==='good'&&w.plus===1&&s.gold===gold-100&&s.starIron===iron-10&&
         s.stones===stones-20&&adventureBook().daily.count.weaponForge===1;
 }finally{setTimeout=schedule;performance.now=now}
});
scenario('reduced motion bypasses aiming, and saved auto-hammer unlocks at thirty manual strikes',()=>{
 const old={...s};delete old.forgeManualTries;delete old.forgeAuto;s=migrate(old);
 if(s.forgeManualTries!==0||s.forgeAuto!==false)return false;
 s.effects=false;openWeaponRitual('weaponEnhance');attemptWeaponEnhance();
 if(weaponRitual.phase!=='done'||weaponRitual.result?.timing!=='good')return false;
 s.gold=s.starIron=s.stones=100000;s.effects=true;s.powerSaving=false;s.forgeManualTries=29;s.forgeAuto=false;
 openWeaponRitual('weaponEnhance');
 if(setForgeAuto(true)||s.forgeAuto||ritualContent('weaponEnhance').includes('자동 망치질')||!attemptWeaponEnhance()||weaponRitual.phase!=='aim')return false;
 settleWeaponAim(weaponRitual);
 if(s.forgeManualTries!==30)return false;
 openWeaponRitual('weaponEnhance');if(!ritualContent('weaponEnhance').includes('자동 망치질'))return false;
 if(!setForgeAuto(true))return false;
 s=migrate(JSON.parse(JSON.stringify(s)));
 openWeaponRitual('weaponEnhance');attemptWeaponEnhance();
 return s.forgeAuto&&s.forgeManualTries===30&&weaponRitual.phase==='working'&&weaponRitual.result?.timing==='good';
});
scenario('migration carries strongest legacy attack and level, preserves spare items and does not duplicate starting resources',()=>{
 const raw=JSON.parse(JSON.stringify(s));delete raw.weaponVersion;delete raw.weapons;delete raw.starIron;
 const best={id:'old_mw',p:0,r:MASTERWORKS[0].r,plus:13,masterwork:0,set:8,locked:true};
 const other={id:'old_blade',p:0,r:0,plus:1,set:0,locked:true};
 raw.gear.push(best,other);raw.equipped[0]=other.id;
 const value=gearValue(best);s=migrate(raw);
 for(const job of Object.keys(WEAPON_NAMES)){
  s.classId=job;if(currentWeapon().plus!==13||Math.abs(gearValue(equippedItem(0))-value)>1e-6)return false;
 }
 s.starIron-=2;s.weapons.archer.plus++;s=migrate(JSON.parse(JSON.stringify(s)));
 equip(other.id);equipBest();
 return s.starIron===10&&s.weapons.archer.plus===14&&s.weapons.warrior.plus===13&&!s.equipped[0]&&s.gear.some(g=>g.id===other.id&&g.locked)&&!s.gear.some(g=>g.id===best.id);
});
scenario('all random gear comes from six parts; sets can complete; dismantling pays both materials just once',()=>{
 s.ore=100;s.autoEquip=false;forgeCraft(100,true);if(lastLoot.some(g=>!g.p)||masterworkBlock(0,0)==='')return false;
 const gear=lastLoot[0];const iron=s.starIron,stones=s.stones;const result=dismantleGear(new Set([gear.id]));dismantleGear(new Set([gear.id]));
 for(let p=1;p<=6;p++)equippedItem(p).set=1;
 return result.count===1&&s.starIron===iron+salvageIron(gear)&&s.stones===stones+salvageStones(gear)&&setBonuses().counts[1]===6&&setEffects(1,6).hp===setEffects(1,7).hp;
});
scenario('one-time notice, manual selection, stacked XP, actual combat modifiers, mastery never awards cosmetics, and reload',()=>{
 const w=currentWeapon();activeScreen='home';$('classOnboarding').hidden=true;advanceCampaign(1);
 if(w.xp!==1)return false;
 gainWeaponXp(28);promptWeaponIfReady();if(view)return false;
 gainWeaponXp(1);promptWeaponIfReady();if(view||w.seen!==weaponRank(w)+1||!canInscribe(w))return false;
 view='';promptWeaponIfReady();if(view)return false;
 s.offlineRewards={seconds:1800,gold:100,ore:10,xp:50};
 if(!claimOffline()||claimOffline()||w.xp!==60)return false;
 const basic=skillDamage(0);openWeaponRitual('weaponImbue');pickWeaponRune('fire');
 if(!inscribeWeapon()||inscribeWeapon()||w.xp!==30||skillDamage(0)!==Math.ceil(basic*1.06)||w.skin!==0)return false;
 gainWeaponXp(weaponGoal(w));openWeaponRitual('weaponImbue');pickWeaponRune('frost');inscribeWeapon();heroCurrentHp=200;
 const expected=100*(1-armorMitigation())*.96;
 if(weaponModifier('frost')!==.96||Math.abs(applyHeroDamage(100)-expected)>1e-8||Math.abs(heroCurrentHp-(200-expected))>1e-8)return false;
 gainWeaponXp(weaponGoal(w));openWeaponRitual('weaponImbue');pickWeaponRune('storm');inscribeWeapon();if(w.skin!==0||w.peakPlus!==0)return false;
 if(weaponModifier('storm')!==1.08)return false;
 s.classId='mage';if(currentWeapon().xp||weaponRank(currentWeapon()))return false;
 s.classId='warrior';s=migrate(JSON.parse(JSON.stringify(s)));return weaponRank(currentWeapon())===3&&currentWeapon().xp===30&&s.wear===0;
});
scenario('material payouts agree with the order, growth and season pass displays, with claim ledgers preserved',()=>{
 let iron=s.starIron;recordPlayerActivity('weaponForge',10);
 for(const kind of ['daily','weekly']){
  const row=orderRows(kind).find(r=>r.id==='temper');if(!row.ready||!missionList(kind).includes('별철 '+row.reward.starIron)||!claimAdventure(kind,'temper')||claimAdventure(kind,'temper'))return false;iron+=row.reward.starIron;
 }
 s.maxStage=11;if(!claimPass(10)||claimPass(10))return false;iron+=10;
 s.season.points=500;if(claimSeason(0,'premium')||!claimSeason(0)||claimSeason(0))return false;iron+=20;
 passMode='season';seasonPassTrack='free';claimAllPass('season');iron+=30;
 return s.starIron===iron&&migrate(JSON.parse(JSON.stringify(s))).starIron===iron&&!claimSeason(4);
});
scenario('hammer pose follows the equipped skin and the actual enhancement outcome',()=>{
 for(const job of Object.keys(WEAPON_NAMES)){
  s.classId=job;
  for(let skin=0;skin<7;skin++){
   s.weapons[job]=readWeapon({plus:WEAPON_APPEARANCE_LEVELS[skin]});openWeaponRitual('weaponEnhance');
   const html=ritualContent('weaponEnhance');
   const path=job==='archer'&&skin===0?'weapon-icons/archer-base-display':(skin?'season-weapons/':job==='shadow'?'weapon-icons/':'weapon-forge/')+job+'-'+skin;
   if(!html.includes(path+'.webp')||!html.includes('data-phase="choose"')||!html.includes('smith-strike.webp'))return false;
  }
 }
 s.classId='warrior';const w=currentWeapon();w.plus=6;s.gold=20000;s.starIron=150;
 const original=Math.random;
 try{
  for(const [random,metal] of [[.99,'cooled'],[0,'tempered']]){
   Math.random=()=>random;openWeaponRitual('weaponEnhance');
   if(!attemptWeaponEnhance()||attemptWeaponEnhance())return false;
   const result=ritualContent('weaponEnhance');
   if(!result.includes('data-phase="done"')||!result.includes('data-metal="'+metal+'"'))return false;
  }
 }finally{Math.random=original}
 return w.plus===7&&w.misses===0;
});

scenario('inscription uses complete display weapons and selected element for every class and skin',()=>{
 for(const job of Object.keys(WEAPON_NAMES)){
  s.classId=job;
  for(let skin=0;skin<7;skin++){
   s.weapons[job]=readWeapon({plus:WEAPON_APPEARANCE_LEVELS[skin]});openWeaponRitual('weaponImbue');
   const expected=job==='shadow'?(skin?'season-weapons/icons/shadow-'+skin:'weapon-icons/shadow-0'):
    skin?'season-weapons/'+job+'-'+skin:job==='archer'?'weapon-icons/archer-base-display':'weapon-forge/'+job+'-0';
   const ready=ritualContent('weaponImbue');
   if(!ready.includes(expected+'.webp')||!ready.includes('data-element="dormant"'))return false;
   for(const key of Object.keys(WEAPON_ELEMENTS)){
    pickWeaponRune(key);const html=ritualContent('weaponImbue');
    if(!html.includes('data-element="'+key+'"')||!html.includes('data-moving="false"')||!html.includes(expected+'.webp'))return false;
   }
  }
 }
 return true;
});

scenario('awakening reveals both weapons for 800ms after hammer contact and shows final-only art with reduced motion',()=>{
 const timer=setTimeout,random=Math.random,media=window.matchMedia;
 const effects=['moving','gameReduced','systemReduced'];
 try{
  for(const effect of effects){
   const moving=effect==='moving',timers=[];
   window.matchMedia=query=>({matches:effect==='systemReduced'&&query.includes('reduced-motion')});
   Math.random=()=>0;setTimeout=(fn,ms)=>{timers.push({fn,ms});return timers.length};
   s.effects=effect!=='gameReduced';s.powerSaving=false;s.gold=s.stones=s.starIron=10000;
   s.weapons.warrior=readWeapon({plus:4});
   openWeaponRitual('weaponEnhance');attemptWeaponEnhance();
   if(moving){
    if(weaponRitual.phase!=='aim'||!settleWeaponAim())return false;
    const hammer=ritualContent('weaponEnhance');
    if(weaponRitual.phase!=='working'||!hammer.includes('weapon-forge/warrior-0.webp')||hammer.includes('season-weapons/warrior-1.webp'))return false;
    const finish=timers.find(t=>t.ms===FORGE_SHOT_MS);if(!finish)return false;
    finish.fn();finish.fn();
   }
   if(weaponRitual.phase!=='done'||currentWeapon().skin!==1)return false;
   const revealed=ritualContent('weaponEnhance'),ends=timers.filter(t=>t.ms===800);
   if(!revealed.includes(weaponSkinName(1))||!revealed.includes('깨어났습니다')||
      !revealed.includes('season-weapons/warrior-1.webp')||ends.length!==Number(moving))return false;
   if(revealed.includes('forge-form-from')!==moving||revealed.includes('forge-form-to')!==moving||
      revealed.includes('weapon-forge/warrior-0.webp')!==moving)return false;
   if(moving){
    if(!revealed.includes('--awaken-time:800ms'))return false;
    ends[0].fn();
    const final=ritualContent('weaponEnhance');
    if(final.includes('forge-form-from')||final.includes('weapon-forge/warrior-0.webp')||
       !final.includes('season-weapons/warrior-1.webp')||!final.includes('깨어났습니다'))return false;
   }
  }
  return true;
 }finally{setTimeout=timer;Math.random=random;window.matchMedia=media}
});
