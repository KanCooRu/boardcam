'use strict';

const worldBoss = (() => {
 const name = '공허의 파수룡';
 const duration = 30000, intro = 1400, step = 200;
 const bossImage = './assets/world-boss-guardian.webp';
 const rewardWeights = [1, 1.5, 2];
 const damageMilestones = [
  {damage:0, gems:10, tickets:1},
  {damage:10000, gems:20, tickets:1},
  {damage:100000, gems:40, tickets:2},
  {damage:1000000, gems:60, tickets:3},
  {damage:10000000, gems:80, tickets:4},
  {damage:100000000, gems:100, tickets:4},
  {damage:1000000000, gems:120, tickets:5}
 ];
 // Materials grow between milestones. Each pair gives the base and the increase per milestone.
 const rewardAmounts = {
  gold:[2000,3000], ore:[20,20], stones:[40,20],
  shards:[10,10], relicShards:[4,4], worldBoss:[30,10]
 };
 const lootOrder = ['gold','gems','ore','stones','shards','relicShards','summonTickets','worldBoss'];
 const oldRewards = [{stones:15}, {ore:15}, {shards:20}];
 const finishingHits=new WeakSet();
 let run = null, dialog = null, timer = 0, panel = '', motion = null;

 function best(o) { return bounded(o.raidBest); }
 function startLevel(o) { return Math.max(1,(o.raidLastCleared||0)-5); }
 function levelName(stage) { return 'Lv.'+(stage>100?'∞':stage); }
 function levelHp(stage) {
  const n=Math.min(100,stage)-1;
  const base=Math.round(240*Math.pow(1.09,n)+70*n);
  return stage<=100?base:base*Math.pow(1.25,stage-100);
 }
 function beginStage(level){const max=levelHp(level);return {level,max,hp:max,cleared:0};}
 function deal(stage,amount){
  // Carry the whole hit through each health bar, including an exact finishing blow.
  while(amount>=stage.hp){
   amount-=stage.hp;stage.cleared=Math.min(100,stage.level);stage.level++;
   stage.max=stage.hp=levelHp(stage.level);
  }
  stage.hp-=amount;
 }
 function legacyClear(d){return d.bossMax>0&&d.legacyBossCleared===true;}
 function blocked(o) {
  if (!s.classId) return '먼저 직업을 선택하세요';
  if (forgeBusy || dungeonRun) return '현재 도전·제작이 끝난 뒤 이용하세요';
  if (o.daily.raid >= ONLINE_LIMITS.raid) return '오늘의 도전을 모두 사용했습니다';
  return '';
 }
 function bundle(n, damage) {
  const score=bounded(damage);
  const tier=damageMilestones.findLastIndex(row=>score>=row.damage);
  const current=damageMilestones[tier];
  const next=damageMilestones[tier+1];
  const fraction=next?(score-current.damage)/(next.damage-current.damage):0;
  const progress=tier+fraction;
  const weight=rewardWeights[n-1];
  const items={};
  for(const [key,[base,increase]] of Object.entries(rewardAmounts)){
   items[key]=Math.floor((base+increase*progress)*weight);
  }
  const {worldBoss:coins,...rewards}=items;
  const gems=current.gems+fraction*((next?.gems??current.gems)-current.gems);
  rewards.gems=Math.floor(gems*weight);
  rewards.summonTickets=Math.floor(current.tickets*weight);
  return {rewards,coins};
 }
 function ledger(o) {
  const d=o.daily;
  if(d.raidLoot && typeof d.raidLoot==='object' && !Array.isArray(d.raidLoot))return d.raidLoot;
  const rows=d.raidLoot={};
  // Older saves kept only a daily total and the most recent fight. Recover exact scores
  // where possible and leave missing scores unknown instead of inventing round splits.
  const last=o.lastRaidResult;
  const when=new Date(last?.at);
  const sameDay=Number.isFinite(when.getTime())&&when.toISOString().slice(0,10)===o.day;
  const latest=sameDay && last.kind==='raid'?Math.floor(bounded(last.damage,0,d.raidDamage)):null;
  for(let n=1;n<=3;n++){
   if(n>d.raid && !d.raidClaimed.includes(n))continue;
   let damage=null;
   if(n===1 && d.raid===1)damage=d.raidDamage;
   else if(n===d.raid)damage=latest;
   else if(n===1 && d.raid===2 && latest!==null)damage=d.raidDamage-latest;
   const row=rows[n]={damage,legacy:true};
   if(d.raidClaimed.includes(n)){row.rewards=oldRewards[n-1];row.coins=n<=d.raid?15:0;}
  }
  return rows;
 }
 function claimOffer(o,n) {
  const d=o.daily, rows=ledger(o), row=rows[n], early=n>d.raid && legacyClear(d);
  const damage=(early?rows[d.raid]?.damage:row?.damage)??null;
  const loot=bundle(n,damage??0);
  // v32 paid its 15 coins immediately even when the contribution gift was left unclaimed.
  if(row?.legacy && n<=d.raid)loot.coins-=15;
  return {damage,early,...loot};
 }
 function payWorldReceipt(o,n,row,rewards){
  const {gems,...materials}=rewards;onlinePay(materials);
  if(gems>0){
   const advance=row.early===true,id=o.day+'/'+n+(advance?'/advance':'');
   rememberEarnedRun('worldBoss',id,{day:o.day,attempt:n,advance,damage:Math.max(0,row.damage||0)});
   scheduleEarnedClaims();
  }
 }
 function pay(o,n,row) {
  ledger(o)[n]=row;
  if(!o.daily.raidClaimed.includes(n))o.daily.raidClaimed.push(n);
  o.worldBossCoins+=row.coins;
  return {ok:true,rewards:row.rewards,message:n+'회차 보상 · 월드보스 코인 +'+num(row.coins)};
 }
 // Pay any earned chests still present in an older save before its daily record rolls over.
 function settleOutstanding(o) {
  const daily=o.daily, earned=legacyClear(daily)?3:daily.raid;
  let changed=false;
  for(let n=1;n<=earned;n++){
   if(daily.raidClaimed.includes(n))continue;
   const payout=pay(o,n,claimOffer(o,n));
   if(saveGuard.usesServer())payWorldReceipt(o,n,ledger(o)[n],payout.rewards);else onlinePay(payout.rewards);
   changed=true;
  }
  return changed;
 }
 function lootGrid(rewards,coins) {
  const items={...rewards,worldBoss:coins};
  return '<div class="wb-drops">'+lootOrder.filter(k=>items[k]>0).map(k=>{
   const coin=k==='worldBoss',icon=coin?havenCoin('worldBoss'):art(RESOURCE_ART[k]);
   return `<div class="wb-drop ${coin?'wb-drop-coin':''}">${icon}<strong>+${num(items[k])}</strong><small>${coin?'월드보스 코인':RESOURCE_NAMES[k]}</small></div>`;
  }).join('')+'</div>';
 }
 function lobby(o) {
  const d=o.daily,level=startLevel(o),max=levelHp(level),record=best(o),reason=blocked(o);
  return `<div class="wb-page"><div class="wb-poster">
   <img class="wb-cover-boss" src="${bossImage}" alt=""><div class="wb-poster-title"><small>용암 성채</small><h3>${name}</h3></div>
   <div class="wb-boss-health"><span>도전 시작 · ${levelName(level)}</span><strong>체력 ${num(max)}</strong><div class="wb-track"><i style="width:100%"></i></div></div></div>
   <div class="wb-record"><div><small>내 역대 최고 피해</small><strong>${num(record)}</strong></div><div><small>오늘 누적 피해</small><b>${num(d.raidDamage)}</b></div></div>
   <div class="wb-links"><button onclick="openMenu('wbRewards')">${art('offlineChest')}보상 내역</button><button onclick="openMenu('wbRanks')">${art('arenaHall')}피해 순위</button></div>
   <div class="wb-actions"><button onclick="worldBoss.sweep()" ${reason||!record?'disabled':''}>소탕</button><button class="wb-primary" onclick="worldBoss.start()" ${reason?'disabled':''}>도전 <b>${Math.max(0,3-d.raid)}/3</b></button></div>
   <p class="wb-note">${reason|| (record?'소탕은 내 최고 피해 기준입니다.':'첫 전투 완료 시 소탕이 열립니다.')}<br>재도전은 직전 클리어 레벨 −5부터 · 오전 9시 횟수 초기화</p>
   ${o.lastRaidResult?.kind==='raid'?'<button class="wb-history" onclick="worldBoss.last()">최근 토벌 결과 보기 <ui-mark data-shape=chevron-right aria-hidden=true></ui-mark></button>':''}</div>`;
 }
 function ranking() {
  const rows=communityRecords.rows('worldboss');
  return rankBoard.worldTrials(rows,rows.length?'':communityRecords.message('worldboss','아직 등록된 월드보스 기록이 없습니다.'));
 }
 function rewards() {
  const o=OnlineService.snapshot(), d=o.daily;
  const n=[1,2,3].includes(+tab)?+tab:Math.max(1,d.raid);
  const claimed=d.raidClaimed.includes(n),row=claimed?ledger(o)[n]:null;
  const status=i=>d.raidClaimed.includes(i)?'지급 완료':'도전 전';
  const description=row?.damage!=null?'기여 피해 '+num(row.damage):claimed?'이전 지급 기록':'기본 보상';
  const loot=row?.rewards?row:bundle(n,0);
  const million=bundle(n,1000000).rewards;
  return `<div class="wb-page"><div class="wb-section"><h3>오늘의 보상 내역</h3><small>참여 ${d.raid}/3회</small></div>
   <div class="wb-chest-tabs">${rewardWeights.map((weight,i)=>`<button aria-pressed="${n===i+1}" onclick="worldBoss.rewardTab(${i+1})">${i+1}회차 <b>×${weight}</b><small>${status(i+1)}</small></button>`).join('')}</div>
   <div class="wb-loot-heading"><strong>${n}회차 ${claimed?'지급 내역':'보상'}</strong><small>${description}</small></div>
   ${lootGrid(loot.rewards,loot.coins)}
   <p class="wb-note">100만 피해 보상 · 다이아 ${num(million.gems)}개 · 스킬 소환권 ${million.summonTickets}장<br>보상은 전투·소탕 직후 자동 지급되며 10억 피해에서 최대입니다.</p></div>`;
 }

 function combatState(start,level,fighter,skills){
  return {start,startLevel:level,stage:beginStage(level),damage:0,rounds:[],fighter,skills,playerHp:fighter.hp,until:{},dots:{},
   nextBreath:6000,breaths:0,elapsed:0,nextTick:step,nextHit:step,nextSkill:700,auto:true,phase:'intro'};
 }
 function trialSkills(ids){
  return ids.map((id,i)=>Number.isInteger(id)&&id>=0&&SKILL_RULES[id]&&slotOpen(i)&&skillUnlocked(id)&&s.skills[id]?
   {id,hit:skillDamage(id),cd:SKILL_RULES[id].cd*1000,ready:0,dot:skillDotRatio(id,s.skills[id])}:null);
 }
 function makeRun(o,now) {
  return {...combatState(now+intro,startLevel(o),onlineFighter(),trialSkills(s.slots)),day:o.day,dayUses:o.daily.raid,priorDamage:o.daily.raidDamage};
 }
 // The authoritative worker imports these same combat rules. Capture only the
 // verified input sheet at entry so mid-fight upgrades cannot change a result.
 function captureForTrial(ids){
  return {fighter:onlineFighter(),skills:trialSkills(ids),storm:weaponModifier('storm'),frost:weaponModifier('frost')};
 }
 function replayTrial(sheet,casts){
  const r=combatState(0,1,sheet.fighter,sheet.skills);
  r.auto=false;r.storm=sheet.storm;r.frost=sheet.frost;
  for(const [at,id] of casts){
   advance(r,at);
   const slot=r.skills.findIndex(sk=>sk?.id===id);
   if(slot>=0 && r.elapsed>=r.skills[slot].ready && r.phase==='fight')cast(r,slot);
  }
  advance(r,duration);return r.damage;
 }
 function strike(r,raw,skill,periodic=false) {
  if(raw<=0)return;
  if(skill<0&&!periodic)raw*=(r.storm??weaponModifier('storm'));
  if(r.until.boost>r.elapsed)raw*=1.5;
  if(r.until.break>r.elapsed)raw*=1.25;else raw*=penetrationMultiplier(.30,r.fighter.penetration||0);
  const crit=Math.random()<r.fighter.crit;
  const hit=bounded(Math.round(raw*(.92+Math.random()*.16)*(crit?r.fighter.critDamage:1)),1);
  if(hit<=0)return;
  const level=r.stage.level;deal(r.stage,hit);r.damage+=hit;
  const round={hit,total:r.damage,skill,crit,...(periodic?{periodic:true}:{}),at:r.elapsed};
  r.rounds.push(round);
  if(r===run&&r.stage.level>level&&!document.hidden){finishingHits.add(round);enemySound.play('dragon','death',true)}
 }
 function cast(r,i) {
  const sk=r.skills[i];
  if(!sk || r.phase!=='fight'||r.elapsed<sk.ready)return false;
  sk.ready=r.elapsed+sk.cd;
  if(r.trialCasts)r.trialCasts.push([Math.round(r.elapsed),sk.id]);
  const m=skillMeta(sk.id), status=m.status;
  let amount=sk.hit*m.factor;
  if(status==='execute'&&r.stage.hp/r.stage.max<=.35)amount*=1.6;
  if(m.target!=='self')strike(r,amount,sk.id);
  if(status==='boost'||status==='guard'||status==='break'||status==='weaken')r.until[status]=r.elapsed+(sk.id===9||status==='weaken'?4000:6000);
  if(status==='stun')r.nextBreath=Math.max(r.nextBreath,r.elapsed+1200);
  if(status==='heal')r.playerHp=Math.min(r.fighter.hp,r.playerHp+r.fighter.hp*({22:.18,28:.12,31:.25}[sk.id]||.15));
  if(status==='burn'||status==='poison')r.dots[status]={id:sk.id,next:r.elapsed+1000,hits:4,raw:r.fighter.attack*sk.dot};
  r.lastCast=sk.id;r.castCount=(r.castCount||0)+1;
  return true;
 }
 function advance(r,now) {
  if(r.phase==='done'||now<r.start)return;
  r.phase='fight';
  const until=Math.min(duration,Math.max(0,now-r.start));
  while(r.nextTick<=until) {
   r.elapsed=r.nextTick;r.nextTick+=step;
   if(r.elapsed>=r.nextHit) {
    strike(r,r.fighter.attack,-1);r.nextHit+=Math.max(step,1150/r.fighter.speed);
   }
   for(const dot of Object.values(r.dots)){
    if(dot.hits&&r.elapsed>=dot.next){strike(r,dot.raw,-1,true);dot.hits--;dot.next+=1000;}
   }
   if(r===run&&until-r.elapsed<500&&r.nextBreath-r.elapsed<=350&&r.breathCue!==r.nextBreath){enemySound.play('dragon','release',true);r.breathCue=r.nextBreath}
   if(r.elapsed>=r.nextBreath){
    if(r===run&&until-r.elapsed<500)enemySound.play('dragon','impact',true);
    const scale=(r.until.guard>r.elapsed?.55:1)*(r.until.weaken>r.elapsed?.65:1);
    r.playerHp=Math.max(0,r.playerHp-Math.max(1,Math.round(r.fighter.hp*.13*scale*(1-armorMitigation(r.fighter.armor))*weaponModifier('frost'))));
    r.nextBreath=r.elapsed+6000;r.breaths++;
   }
   if(r.auto && r.elapsed>=r.nextSkill) {
    const ready=r.skills.findIndex(sk=>sk&&r.elapsed>=sk.ready&&!(skillMeta(sk.id).status==='heal'&&skillMeta(sk.id).target!=='all'&&r.playerHp>r.fighter.hp*.75));
    if(ready>=0&&cast(r,ready))r.nextSkill=r.elapsed+700;
   }
  }
  r.elapsed=until;
  if(until>=duration)r.phase='done';
 }

 // Only a completed live encounter or a saved personal best can fund settlement.
 // LocalOnlineService handles the same daily wallet, activity hooks and save as other Haven content.
 function settle(o,{sweep=false}={}) {
  const fail=message=>({ok:false,message}), d=o.daily, reason=blocked(o);
  if(reason)return fail(reason);
  const prior=best(o),start=startLevel(o);
  if(sweep) {
   if(run||!prior)return fail('도전을 완료한 기록이 필요합니다');
  } else if(!run||run.phase!=='done'||run.settled||run.day!==o.day||d.raid!==run.dayUses||d.raidDamage!==run.priorDamage||start!==run.startLevel) {
   return fail('완료된 전투를 확인하세요');
  }
  const damage=sweep?prior:run.damage;
  if(!(damage>0))return fail('정산할 피해가 없습니다');
  const stage=sweep?beginStage(start):run.stage;
  if(sweep)deal(stage,damage);else run.settled=true;
  const rows=ledger(o), n=d.raid+1, prepaid=d.raidClaimed.includes(n)?rows[n]:null;
  // A pre-update early kill could already have paid a future round. Credit only its upgrade.
  const earned=bundle(n,damage), rewards={...earned.rewards};
  for(const k in rewards)rewards[k]=Math.max(0,rewards[k]-(prepaid?.rewards?.[k]||0));
  const coins=Math.max(0,earned.coins-(prepaid?.coins||0));
  d.raidDamage+=damage;d.raid=n;
  const paid=pay(o,n,{damage,rewards,coins});
  if(prepaid){
   rows[n].rewards={...rewards};
   for(const [k,v] of Object.entries(prepaid.rewards||{}))rows[n].rewards[k]=(rows[n].rewards[k]||0)+v;
   rows[n].coins+=prepaid.coins||0;
  }
  if(stage.cleared)o.raidLastCleared=stage.cleared;
  o.raidBest=Math.max(prior,damage);
  o.lastResult={kind:'raid',name,damage,rounds:sweep?[]:run.rounds,attempt:n,rewards,coinRewards:{worldBoss:coins},at:Date.now(),
   startLevel:start,endLevel:stage.level,cleared:stage.cleared,nextLevel:startLevel(o),
   best:o.raidBest,record:!sweep&&damage>prior,sweep};
  return paid;
 }
 function mount() {
  dialog=document.createElement('dialog');dialog.className='wb-dialog';dialog.setAttribute('aria-label','월드보스 토벌');
  dialog.addEventListener('cancel',e=>{e.preventDefault();if(run)confirmExit();else close();});
  dialog.addEventListener('keydown',e=>{e.stopPropagation();if(!run)return;if(/^[1-4]$/.test(e.key))use(+e.key-1);});
  document.body.appendChild(dialog);dialog.showModal();syncMusic();
 }
 function heroArt() {
  const id=currentClass().id,event=eventSkinEquipped(),rank=s.wear%OUTFIT_STRIDE;
  if(outfitRigRank()==='season2')return '<div class="wb-hero-pose" style="--wb-sheet:'+hairVolume.background(seasonTwoArt(id,'display'),id+'-season2','still')+';--wb-size:100% 100%;--wb-y:0%"></div>';
  const still=weaponPortraitMarkup(id,event?'event':rank);
  const a=event && !MATURE_ART[id+'-event']?{image:'var(--royal-'+id+')',size:'400% 500%',y:100}:classAtlas(id,event?'event':rank);
  return `<div class="wb-hero-pose" ${still?'data-weapon-outfit':''} style="--wb-sheet:${a.image};--wb-size:${a.size};--wb-y:${a.y}%">${still}</div>`;
 }
 function fighterActors() {
  const pet=Number.isInteger(s.activePet)&&s.activePet>=0&&COMPANIONS[s.activePet];
  return `<div class="wb-dragon" role="img" aria-label="${name}"><img src="./assets/enemy-motion/rest/world-guardian.webp" alt=""></div><div class="wb-player">${heroArt()}<canvas class="wb-rig" aria-hidden="true"></canvas><span class="wb-player-hp" aria-label="기사 체력"><i></i></span></div>${pet?`<img class="wb-pet" src="./assets/pets/companion-${s.activePet}.webp" alt="${COMPANIONS[s.activePet][0]}">`:''}`;
 }
 function start() {
  if(dialog||run||!guardFeature('worldBoss'))return false;
  const o=OnlineService.snapshot(),reason=blocked(o);
  if(reason){notice(reason);return false;}
  if(motionAllowed())loadWorldBossFlame();
  run=makeRun(o,Date.now());communityRecords.startWorld(run);mount();panel='intro';
  dialog.innerHTML=`<section class="wb-intro"><div class="wb-versus-boss"><img src="${bossImage}" alt=""><b>${levelName(run.startLevel)} · ${name}</b></div><div class="wb-versus-hero">${heroArt()}<b>${safeText(s.nickname||'성운기사')}</b></div><strong>VS</strong></section>`;
  timer=setInterval(tick,100);tick();return true;
 }
 function skillButtons() {
  return run.skills.map((sk,i)=>sk?`<button class="wb-skill" data-slot="${i}" aria-label="${safeText(SK[sk.id][0])}" onclick="worldBoss.use(${i})">${skillArt(sk.id)}<span hidden></span></button>`:
   '<span class="wb-empty-slot" aria-label="빈 스킬 슬롯">―</span>').join('');
 }
 function drawFight() {
  panel='fight';dialog.innerHTML=`<div class="wb-field"><header class="wb-battle-head"><small>용암 성채 · <b data-level></b></small><h2>${name}</h2><div class="wb-clock" role="timer">남은 전투 <b data-clock></b></div><div class="wb-track wb-hp"><i></i></div><div class="wb-live-stats"><small data-hp></small><small>누적 피해 <b data-total></b></small></div></header>
   <div class="wb-stage">${fighterActors()}<canvas class="wb-trails" aria-hidden="true"></canvas><div class="wb-fx" aria-hidden="true"></div></div><span class="wb-warning" hidden>파수룡의 화염 브레스</span><div class="wb-hotbar"><button class="wb-auto" aria-label="자동 스킬" aria-pressed="true" onclick="worldBoss.toggle()">자동<br>ON</button>${skillButtons()}</div></div>
   <section class="wb-table"><div class="wb-section"><h3>내 전투 기록</h3><small>이번 도전</small></div><div data-ranks></div></section>
   <footer class="wb-fight-foot"><button class="wb-exit" onclick="worldBoss.confirmExit()">철수</button><small>철수하면 횟수는 유지되고 보상은 받지 못합니다.</small></footer>`;
  motion=createWorldBossMotion(dialog.querySelector('.wb-stage'),impact);
 }
 function impact(hit,delay=0) {
  if(document.hidden||panel!=='fight')return;
  if(motionAllowed()){
   const fx=dialog.querySelector('.wb-fx'),drift=(hit.at+Math.floor(hit.hit))%19-9;
   // The same damage number as the stage (battle-presentation.js); the old text is the fallback.
   if(typeof battlePresentation!=='undefined')battlePresentation.damageNumber(fx,hit.hit,hit.crit,{drift:drift*1.4,className:'wb-damage'});
   if(typeof battlePresentation!=='undefined')battlePresentation.hitSpark?.(fx,`calc(var(--wb-target-x) + ${drift*2}px)`,`calc(100% - var(--wb-target-bottom) - .2 * var(--wb-boss-size))`,{skill:hit.skill>=0,crit:!!hit.crit,effect:hit.skill>=0&&typeof SKILL_RULES!=='undefined'?SKILL_RULES[hit.skill]?.effect||'':''});
   else{
    const text=document.createElement('b');
    text.className='wb-damage'+(hit.crit?' wb-critical':'');
    text.textContent=(hit.crit?'치명타 ':'')+num(hit.hit);
    text.style.setProperty('--wb-drift',drift+'px');
    fx.appendChild(text);setTimeout(()=>text.remove(),740);
   }
   const strong=hit.crit||hit.skill>=0,finishing=finishingHits.has(hit);
   raidContactGlint(dialog.querySelector('.wb-stage'),'var(--wb-target-x)','calc(100% - var(--wb-target-bottom))',strong);
   if(finishing||strong)motion?.hitStop(finishing?190:95);
  }
  if(!hit.periodic){
   const factor=Math.min(1,Math.max(.48,1.4/attackSpeed()));
   if(combatEffects.enabled()){
    const beats=SKILL_RULES[hit.skill]?.hits||1;
    for(let i=0;i<beats;i++)paintedBurst(hit.skill,'boss',i,70*i*factor,hit);
   }
   const count=weaponAudio.recipe(hit.skill)?SKILL_RULES[hit.skill].hits:1;
   // The boss simulation books total damage once. Sound the weapon's individual contacts on its visual beat.
   for(let i=0;i<count;i++)playSound('impact',{skillId:hit.skill,classId:s.classId,big:hit.skill>=0,surface:'hard',echo:i>0,ordinal:i,delay:delay+i*.07*factor,motionScale:factor});
  }
 }
 function hitsSince(r,before){
  for(let i=before;i<r.rounds.length;i++){
   const hit=r.rounds[i];
   if(r.elapsed-hit.at>step)continue;
   const factor=Math.min(1,Math.max(.48,1.4/attackSpeed()));
   const phased=weaponAudio.recipe(hit.skill);
   if(phased&&!hit.periodic&&!document.hidden)playSound('swing',{skillId:hit.skill,big:true,hitCount:SKILL_RULES[hit.skill].hits,motionScale:factor});
   if(!motion?.swing(hit))impact(hit,phased ? .27*factor : 0);
  }
 }
 function paintedBurst(id,target='boss',ordinal=0,delay=0,group=null) {
  if(!combatEffects.enabled())return;
  const host=dialog.querySelector('.wb-fx'),actor=dialog.querySelector(target==='hero'?'.wb-player':'.wb-dragon');
  if(!host||!actor)return;
  const box=actor.getBoundingClientRect(),field=host.getBoundingClientRect(),self=target==='hero',job=s.classId;
  const feet=!self&&combatEffects.ground(id);
  const x=box.left-field.left+box.width*(self?.50:feet?.42:.28),y=box.top-field.top+box.height*(self?.48:feet?.92:.67);
  const size=id<0?(job==='archer'?25:field.width*.14):combatEffects.extent(id,field.width);
  combatEffects.emit(host,{id,job,ordinal,echo:ordinal>0,group,anchor:target,x,y,size,heading:id===18?motion?.piercingHeading?.():0,delay,duration:combatEffects.duration(id,job,ordinal>0)});
 }
 function showCast(r) {
  if(skillMeta(r.lastCast).target==='self'){
   const animated=motion?.swing({skill:r.lastCast},true);
   const factor=Math.min(1,Math.max(.48,1.4/attackSpeed()));
   if(r.lastCast>=20&&!document.hidden)playSound('swing',{skillId:r.lastCast,big:true,motionScale:factor});
   paintedBurst(r.lastCast,'hero',0,animated?270*factor:0);
   playSound('impact',{skillId:r.lastCast,big:true,delay:r.lastCast<20 ? 0 : (animated ? .27*factor : .12)});
  }
 }
 function showBreath() {
  motion?.breath();playSound('fire');
 }
 function updateHUD() {
  const r=run,shown=Math.max(0,r.damage-(motion?.pendingDamage()||0));
  if(!r.displayStage||shown<r.displayTotal){r.displayStage=beginStage(r.startLevel);r.displayTotal=0;}
  const stage=r.displayStage;
  deal(stage,shown-r.displayTotal);r.displayTotal=shown;
  dialog.querySelector('[data-clock]').textContent='00:'+String(Math.ceil((duration-r.elapsed)/1000)).padStart(2,'0');
  const label=dialog.querySelector('[data-level]');
  if(r.drawnLevel!==stage.level){
   label.textContent=levelName(stage.level);
   if(r.drawnLevel&&motionAllowed()&&!document.hidden)label.animate?.([{color:'#fff',scale:'1.25'},{color:'#ffdf93',scale:'1'}],{duration:330});
   r.drawnLevel=stage.level;
  }
  dialog.querySelector('[data-hp]').textContent=num(stage.hp)+' / '+num(stage.max);
  dialog.querySelector('[data-total]').textContent=num(shown);
  dialog.querySelector('.wb-hp i').style.width=(100*stage.hp/stage.max)+'%';
  dialog.querySelector('.wb-player-hp i').style.width=(100*r.playerHp/r.fighter.hp)+'%';
  dialog.querySelector('.wb-warning').hidden=r.nextBreath-r.elapsed>950;
  if(r.drawnDamage!==shown){dialog.querySelector('[data-ranks]').textContent=(s.nickname||'성운기사')+' · 누적 피해 '+num(shown);r.drawnDamage=shown;}
  for(const b of dialog.querySelectorAll('[data-slot]')){
   const sk=r.skills[+b.dataset.slot], sec=Math.max(0,Math.ceil((sk.ready-r.elapsed)/1000));
   b.disabled=sec>0;const counter=b.lastElementChild;counter.hidden=!sec;counter.textContent=sec||'';
  }
 }
 function tick() {
  if(!run)return;
  if(run.day!==onlineDay()){close();notice('일일 도전이 초기화되었습니다. 다시 입장하세요');return;}
  const before=run.rounds.length, casts=run.castCount, breaths=run.breaths;advance(run,Date.now());
  if(run.phase==='intro')return;
  if(panel==='intro'){const exiting=!!dialog.querySelector('.wb-confirm');drawFight();if(exiting)confirmExit();}
  if(run.breaths!==breaths)showBreath();
  motion?.clock(run.start+run.nextBreath-Date.now());
  if(run.castCount!==casts)showCast(run);
  hitsSince(run,before);
  updateHUD();
  if(run.phase==='done'){
   if(!document.hidden&&motionAllowed()&&motion?.pending()&&Date.now()-run.start-run.elapsed<650)return;
   clearInterval(timer);timer=0;
   const result=OnlineService.command('raid');
   if(!result.ok){close();notice(result.message);return;}
   const completed=OnlineService.snapshot().lastResult;if(run.ticket)void communityRecords.endWorld(run,completed);run=null;showResult(completed);return;
  }
 }
 function use(i) {
  tick();
  if(!run || run.phase!=='fight')return false;
  const before=run.rounds.length;
  if(!cast(run,i))return false;
  showCast(run);hitsSince(run,before);updateHUD();return true;
 }
 function toggle() {
  tick();if(!run||run.phase!=='fight')return;
  run.auto=!run.auto;const b=dialog.querySelector('.wb-auto');
  b.setAttribute('aria-pressed',String(run.auto));b.innerHTML='자동<br>'+(run.auto?'ON':'OFF');
 }
 function confirmExit() {
  if(!run)return;
  if(dialog.querySelector('.wb-confirm'))return;
  dialog.insertAdjacentHTML('beforeend','<div class="wb-confirm"><section><h3>토벌에서 철수할까요?</h3><p>철수하면 이번 피해는 미기록, 도전 횟수는 유지됩니다.</p><div class="wb-actions"><button onclick="worldBoss.close()">철수하기</button><button class="wb-primary" onclick="worldBoss.stay()">전투 계속</button></div></section></div>');
  dialog.querySelector('.wb-confirm .wb-primary').focus();
 }
 function stay(){dialog?.querySelector('.wb-confirm')?.remove();dialog?.querySelector('.wb-exit')?.focus();}
 function showResult(r) {
  paint();
  motion?.dispose();motion=null;panel='result';if(!dialog)mount();
  dialog.innerHTML=`<section class="wb-result"><div class="wb-result-card"><div class="wb-result-hero"><img src="${bossImage}" alt=""><div><small>${name}</small><h2>${r.sweep?'소탕 완료':r.slain?'파수룡 토벌 성공':'도전 완료'}</h2></div></div>
   <div class="wb-result-body"><div class="wb-score"><span>이번 도전 피해</span><strong>${num(r.damage)}</strong></div><div class="wb-score"><span>역대 최고 피해</span><b>${num(r.best??best(OnlineService.snapshot()))}</b></div>
   ${r.endLevel?`<div class="wb-score"><span>시작 → 도달 레벨</span><b>${levelName(r.startLevel)} → ${levelName(r.endLevel)}</b></div><div class="wb-score"><span>다음 도전 시작</span><b>${levelName(r.nextLevel)}</b></div>`:''}
   ${!r.sweep?`<div class="wb-score"><span>인증 피해</span><b data-world-trial>${r.trialDamage?num(r.trialDamage):'미등록'}</b></div>`:''}
   <div class="wb-loot-heading"><strong>${r.attempt?r.attempt+'회차 ':''}획득 보상</strong><small>${r.attempt?'보상 ×'+rewardWeights[r.attempt-1]+' · ':''}자동 지급 완료</small></div>
   ${Object.values(r.rewards||{}).some(v=>v>0)||r.coinRewards?.worldBoss>0?lootGrid(r.rewards,r.coinRewards?.worldBoss):'<p class="wb-note">이번 회차 보상은 이미 지급됐습니다.</p>'}
   <button class="wb-primary wb-ok" onclick="worldBoss.close()">확인</button></div></div></section>`;
  hydrateArt(dialog);dialog.querySelector('.wb-ok').focus({preventScroll:true});playSound('reward');
 }
 function sweep() {
  if(dialog||run||!guardFeature('worldBoss'))return false;
  const res=OnlineService.command('raid',{sweep:true});if(!res.ok){notice(res.message);return false;}
  showResult(OnlineService.snapshot().lastResult);return true;
 }
 function last(){const r=OnlineService.snapshot().lastRaidResult;if(!dialog&&r?.kind==='raid')showResult(r);}
 function close() {
  if(run?.ticket)void communityRecords.endWorld(run,null);motion?.dispose();motion=null;clearInterval(timer);timer=0;run=null;panel='';
  if(dialog){dialog.close();dialog.remove();dialog=null;}
  syncMusic();paint();if(view==='online'&&tab==='raid')document.querySelector('.wb-actions .wb-primary:not(:disabled),.wb-links button')?.focus();
 }
 function rewardTab(n){tab=String(n);render();}
 return {payWorldReceipt,rewardForReceipt:(attempt,damage)=>bundle(attempt,damage).rewards,captureForTrial,replayTrial,lobby,ranking,rewards,rewardTab,settleOutstanding,start,settle,sweep,use,toggle,close,stay,confirmExit,last,inBattle:()=>!!run};
})();

const priorWorldBossPopup=onlinePopup;
onlinePopup=function(){
 if(tab!=='raid')return priorWorldBossPopup();
 const shop=popupStack.some(p=>p.view==='havenShop');
 return (shop?'<button class="haven-return" onclick="returnToHavenShop()"><ui-mark data-shape=chevron-left aria-hidden=true></ui-mark> 교환하던 성운의 상점으로</button>':'')+onlineRaidUI(OnlineService.snapshot());
};
EXTRA_POPUPS.online=[()=>({arena:'아레나',raid:'월드보스'}[tab]||'길드'),onlinePopup];
EXTRA_POPUPS.wbRanks=['피해 순위',worldBoss.ranking];
EXTRA_POPUPS.wbRewards=['보상 내역',worldBoss.rewards];
