'use strict';
// Existing skill IDs 0–19 and all progression ledgers retain their identities.
const SLOT_GATES=[1,1,3,7];
CLASS_GATES.splice(0,4,1,1,3,7);
CLASS_SKILLS[9][5]='방패로 공격하고 4초간 받는 피해 45% 감소.';
CLASS_SKILLS[13][5]='얼음으로 공격하고 4초간 대상의 공격을 35% 약화.';
const EXTRA_SKILLS=[
 ['갑옷 부수기','cleave',3.2,8,1,'6초간 대상이 받는 피해 +25%.','break','single'],
 ['전장의 함성','storm',0,16,1,'6초간 주는 피해 +50%.','boost','self'],
 ['흡혈 베기','cross',2.6,11,1,'최대 체력의 18% 회복.','heal','single'],
 ['지진파','quake',2.8,14,1,'모든 적을 1.4초 기절.','stun','all'],
 ['독칼 던지기','mark',1.8,10,1,'4초간 매초 공격력 80%의 중독 피해.','poison','single'],
 ['그림자 연무','storm',3.1,13,1,'모든 적의 공격을 4초간 35% 약화.','weaken','all'],
 ['암살','dash',5.2,12,1,'체력 35% 이하인 적에게 피해 +60%.','execute','single'],
 ['그림자 장막','mark',0,15,1,'6초간 받는 피해 45% 감소.','guard','self'],
 ['성역','holy',3.5,12,1,'모든 적을 공격하고 최대 체력 12% 회복.','heal','all'],
 ['천벌의 사슬','judgment',3.3,14,1,'모든 적을 1.4초 기절.','stun','all'],
 ['신앙의 결의','shield',0,16,1,'6초간 주는 피해 +50%.','boost','self'],
 ['정화의 빛','heal',1.8,14,1,'최대 체력의 25% 회복.','heal','single'],
 ['화염 지대','fire',2.2,13,1,'모든 적에게 4초간 매초 공격력 65%의 화상.','burn','all'],
 ['서리 감옥','ice',2.4,14,1,'모든 적을 1.6초 기절.','stun','all'],
 ['비전 집중','lightning',0,16,1,'6초간 주는 피해 +50%.','boost','self'],
 ['마력 장벽','ice',1.8,15,1,'6초간 받는 피해 45% 감소.','guard','single'],
 ['폭발 화살','rain',3.2,10,1,'모든 적에게 폭발 피해.','burst','all'],
 ['표식 사격','pierce',2.2,8,1,'6초간 대상이 받는 피해 +25%.','break','single'],
 ['독성 덫','volley',1.6,13,1,'모든 적에게 4초간 매초 공격력 65%의 중독.','poison','all'],
 ['집중 사격','arrow',5.2,12,1,'체력 35% 이하인 적에게 피해 +60%.','execute','single']
];
// Each generation reserves four consecutive IDs per class, preserving previous saves.
const SKILL_GRADES=['일반','희귀','영웅','전설'], SKILL_RATES=[65,26,8,1];
const DISCOVERY_SKILLS=[
 ['갈고리 참격','cleave',2.8,7,1,'갑옷을 갈라 6초간 받는 피해를 25% 높입니다.','break','single'],
 ['쇄도하는 암석','quake',3.6,11,1,'바위 파편이 모든 적을 강타합니다.','burst','all'],
 ['철벽 반격','cross',2.8,11,2,'두 번 베고 6초간 받는 피해가 45% 줄어듭니다.','guard','single'],
 ['낙성참','cleave',4.7,14,2,'두 번 내려칩니다. 체력 35% 이하인 대상에게 피해 +60%.','execute','single'],
 ['비취 비수','mark',2.2,8,1,'비수의 독이 4초간 피해를 줍니다.','poison','single'],
 ['안개 장막','storm',3.4,12,1,'모든 적을 베고 4초간 공격을 약화합니다.','weaken','all'],
 ['붉은 매복','dash',3.2,10,2,'연속 기습으로 6초간 대상이 받는 피해를 25% 높입니다.','break','single'],
 ['밤까마귀','mark',4.3,13,2,'그림자 칼날이 두 번 덮칩니다. 체력 35% 이하에서 피해 +60%.','execute','single'],
 ['태양창','judgment',3.2,7,1,'빛의 창이 단일 대상을 관통합니다.','burst','single'],
 ['은빛 성소','holy',3.3,13,1,'모든 적에게 피해를 주고 최대 체력의 15%를 회복합니다.','heal','all'],
 ['심판의 망치','shield',3.5,11,2,'연속 심판으로 6초간 받는 피해를 25% 높입니다.','break','single'],
 ['세라핌의 창','judgment',5.3,14,2,'두 번 관통합니다. 체력 35% 이하인 대상에게 피해 +60%.','execute','single'],
 ['얼음 파편','ice',3.2,8,1,'얼음 파편으로 단일 적을 잠시 기절시킵니다.','stun','single'],
 ['잿불 고리','fire',3.2,12,1,'모든 적에게 피해를 주고 4초간 화상을 입힙니다.','burn','all'],
 ['갈래 번개','lightning',3.1,10,2,'번개가 두 번 내리쳐 6초간 대상이 받는 피해 +25%.','break','single'],
 ['푸른 혜성','fire',4.9,16,2,'혜성이 두 차례 폭발해 모든 적을 공격합니다.','burst','all'],
 ['바람깃','arrow',3,7,1,'빠른 관통 화살로 6초간 대상이 받는 피해 +25%.','break','single'],
 ['황혼 화우','rain',2.2,11,2,'두 차례 화살비가 모든 적을 덮칩니다.','burst','all'],
 ['서리 올가미','volley',4.2,12,1,'모든 적을 공격하고 잠시 기절시킵니다.','stun','all'],
 ['불사조 화살','pierce',4.8,14,2,'불새가 두 번 관통합니다. 체력 35% 이하인 대상에게 피해 +60%.','execute','single']
];
EXTRA_SKILLS.push(...DISCOVERY_SKILLS);
function skillOwnerIndex(k){return Number.isInteger(k)&&k>=0&&k<60?Math.floor((k%20)/4):-1}
function skillGate(){return 1}
function skillMeta(k){
 if(k<0)return {target:'single',status:'',factor:1};
 if(k>=20){const x=EXTRA_SKILLS[k-20];return {target:x[7],status:x[6],factor:1}}
 const area=[2,3,6,7,11,14,15,18,19].includes(k);
 return {target:area?'all':'single',status:k===9?'guard':k===10?'heal':k===13?'weaken':'',factor:area?.62:1};
}
for(let i=0;i<EXTRA_SKILLS.length;i++){
 const x=EXTRA_SKILLS[i],ci=Math.floor((i%20)/4),base=ci*4+[0,3,1,2][i%4],old=SKILL_VFX[base];
 CLASS_SKILLS.push(x.slice(0,6));SK.push([x[0],'']);SKILL_TYPES.push(CLASSES[ci].name);
 SKILL_RULES.push({mult:x[2],cd:x[3],hits:x[4],tier:(i<20?[0,1,1,2]:[0,1,2,3])[i%4],effect:x[1]});
 SKILL_VFX.push({...old,id:i+20,effect:x[1],travel:false});
}
classSkillIds=function(id=s?.classId){const base=classIndex(id)*4;return base<0?[]:[0,20,40].flatMap(group=>[0,1,2,3].map(i=>group+base+i))};
skillBelongs=function(k,id=s?.classId){return classIndex(id)>=0&&skillOwnerIndex(k)===classIndex(id)};
skillUnlocked=function(k){return skillBelongs(k)&&s.skills[k]>0};
slotOpen=function(i){return Number.isInteger(i)&&i>=0&&i<4&&s.maxStage>=SLOT_GATES[i]};
unlockClassSkills=function(){
 if(!s?.classId)return;
 const base=classIndex(s.classId)*4;
 if(s.skills[base])return;
 s.skills[base]=1;
 if(s.slots[0]<0)s.slots[0]=base;
};
const PRACTICE_AREA=[2,6,28,32,36];
for(const k of PRACTICE_AREA)SKILL_RULES[k].tier=0;
function practiceDraw(){return grantSkillDraw(1,false,skillDrawDay())}

function fieldMob(stage,species){
 const region=CAMPAIGN_CREATURE_REGIONS[campaignPosition(stage).area];
 return BIOMES[region].mobs[species];
}
function normalizeTactics(a,raw=a){
 const old=recordMap(raw?.tactics),now=Date.now();
 a.tactics={version:2,selectedPreset:['hunt','boss','survive','custom'].includes(old.selectedPreset)?old.selectedPreset:'custom',presets:recordMap(old.presets),ready:{},classReadyAt:Math.min(now+18000,Math.max(0,Number(old.classReadyAt)||0)),buffs:{},encounter:null};
 for(const [k,v]of Object.entries(recordMap(old.ready)))if(skillOwnerIndex(+k)>=0&&Number.isFinite(v)&&v>now)a.tactics.ready[k]=Math.min(v,now+60000);
 for(const key of ['boost','guard']){const v=old.buffs?.[key];if(v&&Number.isFinite(v.until)&&v.until>now)a.tactics.buffs[key]={until:Math.min(v.until,now+6000)}}
 // Carry forward the same completed fraction from ten solo kills or six paired kills.
 if(a.stage%10!==0&&old.version!==2)a.stageKills=Math.min(8,Math.floor(Math.max(0,Number(raw.stageKills)||0)*(old.version?1.5:.9)));
 const e=old.encounter;
 if(old.version===2&&e&&e.stage===a.stage&&Number.isSafeInteger(e.id)&&Number.isInteger(e.baseKills)&&e.baseKills>=0&&e.baseKills<=8&&Array.isArray(e.foes)&&e.foes.length===Math.min(3,9-e.baseKills)){
  const foes=e.foes.map((f,i)=>{
   const species=Number.isInteger(f?.species)&&f.species>=0&&f.species<3?f.species:(a.stage+Math.floor(e.baseKills/3)+i-1)%3;
   const kind=fieldMob(a.stage,species).kind,max=maxEncounterHp(a.stage,kind);
   const oldMax=Number(f?.max),rawHp=Number(f?.hp)||0;
   const hp=Number.isFinite(oldMax)&&oldMax>0&&oldMax!==max?Math.ceil(max*rawHp/oldMax):rawHp;
   return {species,kind,max,hp:Math.max(0,Math.min(max,hp)),status:{},nextAttack:now+(1800+i*350)/a.speed,nextHeal:now+4000/a.speed};
  });
  const duration=Math.max(280,Math.min(560,Number(e.entryDuration)||560)),stagger=duration*90/560,spawnAt=Math.min(now,Number(e.spawnAt)||now-740),readyAt=Math.min(now+740,spawnAt+duration+(foes.length-1)*stagger);
  if(e.baseKills+foes.filter(f=>f.hp<=0).length===a.stageKills&&foes.some(f=>f.hp>0)){
   const target=foes[e.target]?.hp>0?Number(e.target):foes.findIndex(f=>f.hp>0);
   a.tactics.encounter={id:e.id,stage:a.stage,baseKills:e.baseKills,foes,engaged:!!e.engaged||foes.some(f=>f.hp<f.max),target,spawnAt,entryDuration:duration,entryStagger:stagger,readyAt};
   a.enemyHp=foes[target].hp;
  }
 }
 return a;
}
const tacticsStarter=starter,tacticsMigrate=migrate;
starter=function(){return normalizeTactics(tacticsStarter())};
migrate=function(raw){return normalizeTactics(tacticsMigrate(raw),raw||{})};
const trialTacticalClocks=new WeakMap();
function tacticsState(){
 if(!s.tactics)normalizeTactics(s);
 if(dungeonRun?.mode!=='trial')return s.tactics;
 if(!trialTacticalClocks.has(dungeonRun)){
  const base=s.tactics,buffs=Object.fromEntries(Object.entries(base.buffs).map(([key,buff])=>[key,{...buff}]));
  trialTacticalClocks.set(dungeonRun,{...base,ready:{...base.ready},buffs,encounter:null});
 }
 return trialTacticalClocks.get(dungeonRun);
}
function trialPausedAt(){return dungeonRun?.mode==='trial'?dungeonRun.combatPausedAt:null}
let trialContacts=[];
function armTrialContact(contact){
 contact.due=Date.now()+contact.delay;
 const timer=setTimeout(()=>{
  if(contact.timer!==timer)return;
  trialContacts=trialContacts.filter(other=>other!==contact);
  contact.hit();
 },contact.delay);
 contact.timer=timer;classAttackTimers.push(timer);
}
function beginTrialCombatPause(run){
 if(run!==dungeonRun||run.mode!=='trial'||run.combatPausedAt!=null)return;
 run.combatPausedAt=Date.now();tacticsState();bossStatus();
 if(run.choosing){clearDefeatFeedback();cancelCombatAnimation();return}
 for(const contact of trialContacts){
  clearTimeout(contact.timer);contact.timer=null;
  contact.delay=Math.max(0,contact.due-run.combatPausedAt);
 }
}
function endTrialCombatPause(run){
 if(run!==dungeonRun||run.combatPausedAt==null||trialCombatPaused(run))return;
 const start=run.combatPausedAt,duration=Math.max(0,Date.now()-start);
 delete run.combatPausedAt;
 const defer=deadline=>deadline>start?deadline+duration:deadline;
 const tactics=tacticsState(),boss=bossStatus();
 for(const key of Object.keys(tactics.ready))tactics.ready[key]=defer(tactics.ready[key]);
 tactics.classReadyAt=defer(tactics.classReadyAt);
 boss.nextAttack=defer(boss.nextAttack);
 for(const status of [...Object.values(tactics.buffs),...Object.values(boss.status)]){
  status.until=defer(status.until);
  if(status.next)status.next=defer(status.next);
 }
 combatBusyUntil=defer(combatBusyUntil);
 for(const contact of trialContacts)armTrialContact(contact);
}
const FOE_ROLES={normal:['일반','대상을 눌러 집중 공격'],guard:['방어형','받는 피해 25% 감소 · 약화에 취약'],healer:['회복형','4초마다 동료 체력 회복'],striker:['돌격형','강한 공격 · 기절로 차단']};
const COMBAT_BALANCE={normalHit:2,bossHit:2.2,waveHeal:.08,reviveMs:2200};
const combatMs=ms=>ms/Math.max(1,s.speed||1);
let heroReviveUntil=0,heroReviveSave=null;
let waveSequence=0,duoTransaction=false,quietDamageNumber=false,visualTarget=-1,motionHitCount=1,bossTacticState=null;
// Commit reward/HUD updates together, after the wave reward adjustment.
const fullPaintBeforeTactics=paint;
paint=function(...args){if(!duoTransaction)return fullPaintBeforeTactics(...args)};
function isDuoBattle(){return !!s?.classId&&!dungeonRun&&s.stage%10!==0}
function maxEncounterHp(stage,kind){
 // In the opening hunt, armor alone provides the guard's defense.
 const multiplier={guard:stage<10?1:1.1,healer:.8,striker:.9}[kind]||1;
 return Math.max(1,Math.ceil(campaignEnemyHp(stage)*multiplier));
}
function ensureEncounter(){
 if(!isDuoBattle())return null;
 const t=tacticsState();let e=t.encounter;
 if(e&&e.stage===s.stage&&(duoTransaction||e.baseKills+e.foes.filter(f=>f.hp<=0).length===s.stageKills&&e.foes.some(f=>f.hp>0)))return e;
 if(e?.stage===s.stage&&Date.now()<enemyRespawnUntil)return e;
 const base=s.stageKills||0,now=Math.max(Date.now(),enemyRespawnUntil),wave=Math.floor(base/3);
 e=t.encounter={id:Math.max(++waveSequence,(t.encounter?.id||0)+1),stage:s.stage,baseKills:base,target:0,engaged:false,spawnAt:now,entryDuration:560/s.speed,entryStagger:90/s.speed,readyAt:now+(560+(Math.min(3,9-base)-1)*90)/s.speed,foes:Array.from({length:Math.min(3,9-base)},(_,i)=>{
  const species=(s.stage+wave+i-1)%3,kind=fieldMob(s.stage,species).kind,max=maxEncounterHp(s.stage,kind);
  return {species,kind,max,hp:max,status:{},nextAttack:now+combatMs(2200+i*350),nextHeal:now+combatMs(4000)};
 })};
 s.enemyHp=e.foes[0].hp;return e;
}
function selectedFoe(){const e=ensureEncounter();if(!e)return null;if(!e.foes[e.target]||e.foes[e.target].hp<=0)e.target=e.foes.findIndex(f=>f.hp>0);return e.foes[e.target]||null}
function foeNode(i){return $(["mobActor","mobTwo","mobThree"][i]||'mobActor')}
// Own entrance/death effects explicitly: a reused DOM actor must never inherit
// the previous monster's transparent fill, even if finish events arrive late.
const foeTransitions=new WeakMap();
function clearFoeTransition(actor){
 const effect=foeTransitions.get(actor);if(!effect)return;
 foeTransitions.delete(actor);effect.animation.onfinish=null;effect.animation.cancel();
 actor.classList.remove('foe-entering');delete actor.dataset.dying;delete actor.dataset.dissolved;
}
function finishFoeTransition(actor,effect){
 if(foeTransitions.get(actor)!==effect)return;
 const current=s.tactics?.encounter===effect.encounter&&actor.dataset.wave===String(effect.encounter.id);
 clearFoeTransition(actor);
 if(current&&effect.kind==='death'&&effect.encounter.foes[effect.index].hp<=0)actor.hidden=true;
}
function trackFoeTransition(actor,animation,kind,e,i,until){
 const effect={animation,kind,encounter:e,index:i,until};foeTransitions.set(actor,effect);
 animation.onfinish=()=>finishFoeTransition(actor,effect);
}
function encounterReady(e=ensureEncounter()){return !trialCombatPaused()&&(!e||Date.now()>=e.readyAt)}
function combatTargetNode(){const e=isDuoBattle()?ensureEncounter():null;return foeNode(e?(visualTarget>=0?visualTarget:e.target):0)}
function chooseEnemy(i){const e=ensureEncounter();if(!e?.foes[i]||e.foes[i].hp<=0)return false;e.target=i;s.enemyHp=e.foes[i].hp;warriorMotion.invalidate();paintTactics();return true}
const oldCombatEncounter=combatEncounter,oldSameEncounter=sameEncounter;
combatEncounter=function(){const e=ensureEncounter();return {...oldCombatEncounter(),wave:e?.id}};
sameEncounter=function(e){if(e.wave!==undefined)return s===e.save&&!dungeonRun&&s.stage===e.stage&&s.tactics?.encounter?.id===e.wave;return oldSameEncounter(e)};
function bossStatus(){
 const encounter=dungeonRun || stageBossAttempt();
 const wave=dungeonRun?.bosses || 0;
 if(!bossTacticState || bossTacticState.save!==s || bossTacticState.encounter!==encounter || bossTacticState.wave!==wave){
  bossTacticState={save:s,encounter,wave,status:{},engaged:false,nextAttack:Date.now()+combatMs(2400)};
 }
 return bossTacticState;
}
function targetStatus(i){return isDuoBattle()?ensureEncounter()?.foes[i]?.status:bossStatus().status}
function statusOn(obj,name,now=trialPausedAt()??Date.now()){return !!obj?.[name]&&obj[name].until>now}
function damageFactor(i,k){const f=isDuoBattle()?ensureEncounter().foes[i]:null,status=f?.status||bossStatus().status,m=skillMeta(k);let v=m.factor;if(statusOn(tacticsState().buffs,'boost'))v*=1.5;if(statusOn(status,'break'))v*=1.25;else{const armor=targetArmorReduction(f);if(f?.kind==='guard')v*=.75;v*=penetrationMultiplier(armor)}if(m.status==='execute'&&(f?f.hp/f.max:(dungeonRun?dungeonRun.hp/dungeonRun.maxHp:s.enemyHp/maxHp()))<=.35)v*=1.6;return v}
function putStatus(i,k){const m=skillMeta(k),now=Date.now(),status=targetStatus(i);if(!status)return;
 if(m.status==='break'||m.status==='weaken')status[m.status]={until:now+combatMs(m.status==='break'?6000:4000)};
 if(m.status==='stun'){const ms=combatMs((k===33?1600:1400)*(isDuoBattle()?1:.4));status.stun={until:now+ms};const foe=isDuoBattle()?ensureEncounter().foes[i]:bossStatus();foe.nextAttack=Math.max(foe.nextAttack||now,now+ms+combatMs(600))}
 if(m.status==='poison'||m.status==='burn')status[m.status]={until:now+combatMs(4100),next:now+combatMs(1000),damage:Math.ceil(power()*skillDotRatio(k,s.skills[k]||1,!dungeonRun)*(1+trialMod('skillDamage')))};
}
function applySupport(k){const m=skillMeta(k),t=tacticsState(),now=Date.now();if(['boost','guard'].includes(m.status))t.buffs[m.status]={until:now+combatMs(k===9?4000:6000)};if(m.status==='heal'){const ratio=k===31?.25:k===28?.12:k===22?.18:.15;heroCurrentHp=Math.min(health(),heroCurrentHp+health()*ratio)}}
function autoSkillUsable(k){if(trialCombatPaused()||!skillUnlocked(k)||!s.skills[k]||Date.now()<Math.max(tacticsState().ready[k]||0,tacticsState().classReadyAt||0))return false;const m=skillMeta(k);if(m.status==='heal'&&m.target!=='all'&&heroCurrentHp>health()*.75)return false;if(['guard','boost'].includes(m.status)&&statusOn(tacticsState().buffs,m.status))return false;return true}

const tacticalBaseDamage=applyDamage,tacticalBaseNumber=damageText;
damageText=function(...args){if(!quietDamageNumber)return tacticalBaseNumber(...args)};
function hurtFoe(d,crit,i,k=-1){
 const e=ensureEncounter(),f=e?.foes[i];if(!f||!encounterReady(e)||f.hp<=0||!Number.isFinite(d)||d<=0)return false;
 const hp=f.hp,heroHp=heroCurrentHp,stage=s.stage,amount=Math.max(1,Math.floor(d));
 const fall=amount>=hp?adventureFx.deathAnchor(foeNode(i)):null;
 f.hp=Math.max(0,hp-amount);s.enemyHp=hp;quietDamageNumber=true;duoTransaction=true;
 try{tacticalBaseDamage(amount,crit)}finally{quietDamageNumber=false;duoTransaction=false}
 heroCurrentHp=Math.min(health(),heroHp);
 if(f.hp===0){
  const region=CAMPAIGN_CREATURE_REGIONS[campaignPosition(stage).area];
  enemySound.play(enemySound.forCreature(region,f.species),'death');
  adventureFx.defeat(fall,region,weaponAudio.surface(region,f.species));
  if(f.kind==='healer'||f.kind==='guard')trackOrderEvent(f.kind);
  // The kill handler pays gold once. Keep the nine-kill wave XP adjustment.
  gainXP(Math.round((4+Math.floor(campaignEconomyStage(stage)/4))/9));
  const node=foeNode(i);if(node?.dataset.wave===String(e.id)&&motionAllowed()&&node.animate){clearFoeTransition(node);node.dataset.dying=String(e.id);if(fall?.still)node.dataset.dissolved='true';const animation=node.animate([{offset:0,opacity:1,transform:'translate(0,0)'},{offset:.22,opacity:1,transform:'translate(3px,-1px) rotate(3deg)'},{offset:.60,opacity:.8,transform:'translate(5px,3px) rotate(8deg)'},{offset:1,opacity:0,transform:'translate(6px,8px) rotate(11deg)'}],{duration:420,fill:'forwards'});trackFoeTransition(node,animation,'death',e,i,Date.now()+420)}
 }
 if(s.stage===stage){if(e.foes[e.target]?.hp<=0)e.target=e.foes.findIndex(x=>x.hp>0);s.enemyHp=e.foes[e.target]?.hp||0}
 if(f.hp===0&&e.foes.every(x=>x.hp<=0)){trackOrderEvent('waves');const travel=actorMotion.advanceWave(e)||0;enemyRespawnUntil=Date.now()+Math.max(combatMs(360),travel-combatMs(280));heroCurrentHp=e.baseKills+e.foes.length>=campaignKillsNeeded(stage)?health():Math.min(health(),heroCurrentHp+health()*COMBAT_BALANCE.waveHeal)}
 if(f.hp===0){paint();save()}return true;
}
applyDamage=function(d,crit=false){if(!isDuoBattle())return tacticalBaseDamage(d,crit);const e=ensureEncounter();return hurtFoe(d,crit,e.target)};
function paintAdventureImpact(node,effect,skillId,surface,critical,heavy,echo,incoming=false,source=null){
 if(!warriorMotion.visible()||!adventureFx.ready())return false;
 const bounds=$('battle').getBoundingClientRect(),target=node.getBoundingClientRect();
 const hero=$('heroActor').getBoundingClientRect(),from=incoming?(source||combatTargetNode()).getBoundingClientRect():hero;
 if(incoming&&source&&isDuoBattle()){
  const body=actorMotion.body(source),key=source.dataset.tacticArt||source.dataset.art;
  const attacks={
   hound:'slash',boar:'earth',hare:'wind',cap:'poison',spider:'cross',sapling:'earth',
   scorpion:'poison',toad:'poison',serpent:'wind',fighter:'slash',imp:'fire',
   bat:'snare',giant:'earth',gargoyle:'earth',wraith:'mist',griffin:'wind',
   orb:'lance',knight:'slash',nautilus:'mist',centipede:'cross'
  };
  const overrides={creature_4_1:'fire',creature_4_2:'earth',creature_6_2:'slash',creature_7_2:'fire',creature_9_2:'vortex'};
  const type=overrides[key]||attacks[body];
  if(type){
   const x=target.left-bounds.left+target.width*.49,y=target.top-bounds.top+target.height*.44;
   combatEffects.emit($('classFx'),{id:-1,job:'enemy',type,x,y,ordinal:0,duration:310/Math.max(1,s.speed||1),size:Math.min(84,Math.max(36,hero.width*.51)),angle:type==='slash'?2.7:0});
   return true;
  }
 }
 const contact=incoming?{x:target.left-bounds.left+target.width*.55,y:target.top-bounds.top+target.height*.54}:
  rangedCombat.hitPoint(node,false,{battle:bounds,actor:target});
 return adventureFx.impact({...contact,flashOnly:!incoming,floorY:target.bottom-bounds.top-target.height*.07,
  from:{x:from.left-bounds.left+from.width*.5,y:from.top-bounds.top+from.height*.48},
  scale:hero.width/100,job:incoming?'enemy':s.classId,skillId,effect,surface,critical,heavy,echo});
}
const impactShakeAt=new WeakMap();
function shakeImpactStage(stage){
 if(!stage||!motionAllowed()||document.hidden)return false;
 const now=performance.now();
 if(now-(impactShakeAt.get(stage)??-Infinity)<300)return false;
 impactShakeAt.set(stage,now);
 stage.classList.remove('impact-shake');void stage.offsetWidth;stage.classList.add('impact-shake');
 setTimeout(()=>{if(impactShakeAt.get(stage)===now)stage.classList.remove('impact-shake')},240);
 return true;
}
function tacticalImpact(d,crit,e,token,effect,big,k=-1,echo=false,factor=1,ordinal=0){
 if(heroCurrentHp<=0||token!==combatSerial||!sameEncounter(e)||!encounterReady()||stageBossActive()&&!stageBossTick())return false;
 const bossSkill=!echo&&k>=0&&stageBossActive()&&!dungeonRun;
 const m=skillMeta(k);if(!echo&&k>=0)applySupport(k);
 if(m.target==='self'){
  if(!echo){
   spawnClassFx(effect,true,'impact',k,false,factor);
   playSound('impact',{effect,big:true,skillId:k,motionScale:factor});
  }
  paintTactics();return true;
 }
 const pair=ensureEncounter(),indices=pair?(m.target==='all'?pair.foes.map((_,i)=>i).filter(i=>pair.foes[i].hp>0):[pair.foes[pair.target]?.hp>0?pair.target:pair.foes.findIndex(f=>f.hp>0)]):[0];
 // Capture the surface before damage can kill the target or advance the wave.
 const focus=indices.includes(pair?.target)?pair.target:indices[0];
 const creature=pair?null:encounterFor(s.stage,dungeonRun);
 const surface=pair?weaponAudio.surface(CAMPAIGN_CREATURE_REGIONS[campaignPosition(s.stage).area],pair.foes[focus]?.species):weaponAudio.surface(creature.region,creature.boss?3:creature.variant);
 let landed=0;
 for(const i of indices){if(i<0||!sameEncounter(e))break;visualTarget=pair?i:-1;const amount=Math.max(1,Math.floor(d*damageFactor(i,k)*(k<0?weaponModifier('storm'):1)*(1+trialMod('weakness'))));
  const target=foeNode(i),lethal=amount>=(pair?pair.foes[i].hp:dungeonRun?dungeonRun.hp:s.enemyHp);
  rangedCombat.heroHit(token,ordinal,target);warriorMotion.hitReaction(big||crit,echo,factor);
  if(warriorMotion.visible()){
   const hitSurface=pair?weaponAudio.surface(CAMPAIGN_CREATURE_REGIONS[campaignPosition(s.stage).area],pair.foes[i].species):surface;
   paintAdventureImpact(target,effect,k,hitSurface,crit,big,echo);
   if(crit||big){
    shakeImpactStage($('battle'));
    if(!(lethal&&creature?.boss))actorMotion.hitStop(95,target);
   }
  }
  spawnClassFx(effect,big,'impact',k,echo,factor,lethal&&k<0,ordinal,k===18&&i!==focus);
  damageText(amount,crit);
  if(pair){if(hurtFoe(amount,crit,i,k))landed++}else{quietDamageNumber=true;try{tacticalBaseDamage(amount,crit)}finally{quietDamageNumber=false}}
  if(!echo&&sameEncounter(e))putStatus(i,k);
 }
 if(bossSkill)trackOrderEvent('bossHits');
 if(!echo&&k>=0&&m.target==='all'&&landed===3)trackOrderEvent('volley');
 visualTarget=-1;playSound('impact',{effect,big,crit,echo,ordinal,motionScale:factor,surface,skillId:k});paintBattle();return true;
}
combatImpact=tacticalImpact;
// A delayed browser callback still owns its hit until it resolves or combat is cancelled.
let pendingClassHits=0;
performClassAttack=function(k=-1,automatic=false){
 if(!s.classId||heroCurrentHp<=0||document.hidden||trialCombatPaused()||pendingClassHits>0||Date.now()<combatBusyUntil||Date.now()<enemyRespawnUntil)return false;
 if(stageBossActive()&&!stageBossTick())return false;
 if(k>=0&&(!skillUnlocked(k)||!s.skills[k]||Date.now()<Math.max(tacticsState().ready[k]||0,tacticsState().classReadyAt||0)))return false;
 const pair=ensureEncounter();if(pair&&(!encounterReady(pair)||!selectedFoe()))return false;
 (pair||bossStatus()).engaged=true;
 const skill=k>=0,r=skill?SKILL_RULES[k]:null,effect=skill?r.effect:({warrior:'cleave',shadow:'dash',paladin:'holy',mage:'fire',archer:'arrow'}[s.classId]);
 const token=++combatSerial,e=combatEncounter();
 const crit=(!skill||skillMeta(k).target!=='self')&&Math.random()<criticalChance();
 const adventure=!dungeonRun;
 const base=skill?skillDamage(k,s.skills[k],adventure):power()*(adventure?adventureBasicMultiplier():1)*(.9+Math.random()*.2);
 const total=Math.max(skill?0:1,Math.floor(base*(crit?criticalDamageMultiplier():1)));
 const speed=skill?1:attackSpeed();
 const hits=skill?r.hits||1:speed>=2.5&&total>=2?2:1;
 // Preserve the existing input cadence. Two short contacts share one damage roll.
 const cadenceFactor=(skill?1:Math.max(.4,1/speed))/s.speed;
 const factor=skill?cadenceFactor:Math.max(190/650,cadenceFactor);
 const clock=skillMotion.clock(s.classId,k,factor);
 combatBusyUntil=Date.now()+Math.max(680,270+hits*70)*cadenceFactor;
 classAttackTimers.forEach(clearTimeout);classAttackTimers=[];
 pendingClassHits=hits;
 if(skill)tacticsState().ready[k]=Date.now()+r.cd*Math.max(0,1-trialMod('cooldown'))/s.speed*1000;
 for(let j=0;j<hits;j++){
  let applied=false;
  const hit=()=>{
   if(applied||token!==combatSerial)return;
   applied=true;pendingClassHits--;
   if(document.hidden||trialCombatPaused())return;
   combatImpact(Math.floor(total/hits)+(j<total%hits?1:0),crit,e,token,effect,skill,k,j>0,factor,j);
  };
  const delay=clock.elapsed(270+j*70);
  if(dungeonRun?.mode==='trial'){
   const contact={hit,delay};
   trialContacts.push(contact);armTrialContact(contact);
  }else classAttackTimers.push(setTimeout(hit,delay));
 }
 motionHitCount=hits;animateClassAttack(effect,token,factor,k);launchClassProjectile(k,factor,token,pair,hits);playSound('swing',{effect,big:skill,skillId:k,hitCount:hits,motionScale:factor});
 return true;
};
let projectileNode=null,projectileAnimation=null;
function launchClassProjectile(k,factor,token=combatSerial,pair=s.tactics?.encounter,hits=SKILL_RULES[k]?.hits||1){
 if(rangedCombat.heroCast(k,factor,token,pair,hits))return;
 if(!['mage','archer'].includes(s.classId)||!warriorMotion.visible()||!warriorMotion.capable()||skillMeta(k).target==='self')return;
 const battle=$('battle').getBoundingClientRect(),hero=$('heroActor').getBoundingClientRect();
 if(!projectileNode){projectileNode=document.createElement('i');projectileNode.className='class-flight';projectileNode.setAttribute('aria-hidden','true')}
 if(projectileNode.parentNode!==$('classFx'))$('classFx').appendChild(projectileNode);projectileAnimation?.cancel();projectileNode.hidden=false;
 const grip=actorMotion.emitter()||[.69,.40];
 const [{x,y}]=rangedCombat.paintedPoints($('heroActor'),[grip.map(n=>n*512)]);
 const {x:tx,y:ty}=rangedCombat.hitPoint(combatTargetNode(),combatEffects.ground(k));
 const clock=skillMotion.clock(s.classId,k,factor);
 if(s.classId==='archer'){
  const length=rangedCombat.arrowLength(battle.width,k),kind=rangedCombat.heroStyle('archer',k);
  const from={x,y},to={x:tx,y:ty},tail=archerFlight.tailMs(k),duration=clock.elapsed(270+tail),contact=clock.elapsed(270)/duration,release=clock.elapsed(rangedCombat.releaseTime('archer',k))/duration;
  projectileNode.style.cssText=`left:0;top:0;width:${length}px;height:${length*(k<0?36/240:48/256)}px;transform-origin:right center;background:transparent url("${archerFlight.texture(k).src}") center/contain no-repeat`;
  const frames=[{offset:0,opacity:0},{offset:release,opacity:0}];
  for(let step=0;step<=8;step++){
   const t=step/8,p=rangedCombat.arrowPose(from,to,t,kind,battle.width,k);
   frames.push({offset:release+(contact-release)*t,opacity:1,transform:`translate(${p.x-length}px,calc(${p.y}px - 50%)) rotate(${p.angle}rad)`});
  }
  if(tail){const end=rangedCombat.arrowPose(from,to,1.69,kind,battle.width,k);frames.push({offset:1,opacity:0,transform:`translate(${end.x-length}px,calc(${end.y}px - 50%)) rotate(${end.angle}rad)`})}
  projectileAnimation=projectileNode.animate(frames,{duration,fill:'both',easing:'linear'});
  projectileAnimation.onfinish=()=>{projectileNode.hidden=true};return;
 }
 projectileNode.style.cssText=`left:${x}px;top:${y}px;width:${hero.width*.5}px;--flight-atlas:var(--vfx-${s.classId});--flight-row:${(k>=0?(SKILL_VFX[k]?.row||0):0)*100/3}%`;
 const dx=tx-x,dy=ty-y,arc=hero.width*.045;
 const release=clock.elapsed(rangedCombat.releaseTime('mage',k))/clock.elapsed(270);
 const flight=(fraction,rise,scale)=>`translate(calc(-50% + ${dx*fraction}px),calc(-50% + ${dy*fraction-rise}px)) scale(${scale})`;
 projectileAnimation=projectileNode.animate([
  {offset:0,transform:flight(0,0,.32),opacity:0},
  {offset:Math.max(0,release-.02),transform:flight(0,0,.38),opacity:0},
  {offset:release,transform:flight(.015,0,.72),opacity:1},
  {offset:release+(1-release)*.35,transform:flight(.44,arc,.88),opacity:1},
  {offset:1,transform:flight(1,0,1),opacity:1}
 ],{duration:clock.elapsed(270),fill:'both',easing:'ease-in'});
 projectileAnimation.onfinish=()=>{projectileNode.hidden=true};
}
const tacticalCancel=cancelCombatAnimation;
cancelCombatAnimation=function(){pendingClassHits=0;trialContacts=[];rangedCombat.clear();bossTechniques.clear();projectileAnimation?.cancel();if(projectileNode)projectileNode.hidden=true;return tacticalCancel()};

function animateEnemy(node,kind){
 if(!node?.animate||!warriorMotion.visible())return;
 if(actorMotion.contact(node,kind)||kind==='attack'&&actorMotion.isArmed(node))return;
 node.getAnimations?.().filter(a=>!a.animationName).forEach(a=>a.cancel());
 const attack=kind==='attack',frames=attack?[
  {transform:'translate3d(0,0,0) rotate(0deg)'},{offset:.22,transform:'translate3d(5px,2px,0) rotate(3deg)'},
  {offset:.48,transform:'translate3d(-18px,-5px,0) rotate(-5deg)'},{offset:.56,transform:'translate3d(-19px,-3px,0) rotate(-3deg)'},
  {offset:.76,transform:'translate3d(-5px,1px,0) rotate(1deg)'},{transform:'translate3d(0,0,0) rotate(0deg)'}
 ]:[{filter:'brightness(1)'},{filter:'brightness(1.5)'},{filter:'brightness(1)'}];
 node.animate(frames,{duration:combatMs(attack?440:500),easing:'ease-out'});
}
function applyEnemyCombatTick(dt,slow){
 const now=Date.now(),e=ensureEncounter(),foes=e?e.foes:[bossStatus()],guard=statusOn(tacticsState().buffs,'guard')?.55:1;
 if(!encounterReady(e))return;
 foes.forEach((f,i)=>{if(heroCurrentHp<=0||e&&f.hp<=0)return;if(statusOn(f.status,'stun',now))return;const node=foeNode(e?i:0),body=actorMotion.body(node);
  const sound=e?enemySound.forCreature(CAMPAIGN_CREATURE_REGIONS[campaignPosition(s.stage).area],f.species):enemySound.forEncounter(encounterFor(s.stage,dungeonRun));
  if(f.sounded!==f.nextAttack&&(f.nextAttack-now)*Math.max(1,s.speed)<=320){enemySound.play(sound,'release',!e);f.sounded=f.nextAttack}
  if(now<f.nextAttack){
   const speed=Math.max(1,s.speed);
   if(!e)bossTechniques.start(node,f,now,false);
   else if(!actorMotion.isArmed(node)&&rangedCombat.enemyStyle(body))rangedCombat.planEnemy(node,body,f,e,now,speed);
   else actorMotion.planMelee(node,f,now,speed);
  }
  if(f.kind==='healer'&&now>=f.nextHeal){const ally=e.foes.find(x=>x!==f&&x.hp>0);if(ally){ally.hp=Math.min(ally.max,ally.hp+ally.max*.08);animateEnemy(node,'heal')}f.nextHeal=now+combatMs(4000)}
  if(now>=f.nextAttack){const attack=enemyAttack()*(e?COMBAT_BALANCE.normalHit:dungeonRun?.6:COMBAT_BALANCE.bossHit)*(f.kind==='striker'?1.4:f.kind==='healer'?.7:1)*(statusOn(f.status,'weaken')?.65:1)*guard*slow;
   enemySound.play(sound,'impact',!e);
   if(e){if(!actorMotion.isArmed(node))rangedCombat.enemyHit(node,body,f,e);animateEnemy(node,'attack')}
   else bossTechniques.start(node,f,now,true);
   applyHeroDamage(attack,node);const cadence=!e&&dungeonRun?.mode==='tower'?towerEncounter(dungeonRun.n).interval:0;f.nextAttack=now+combatMs(cadence||2400+(i?350:0))}
 });
 if(e&&e.foes[e.target])s.enemyHp=e.foes[e.target].hp;
}
function resolveHeroDefeat(){
 if(heroCurrentHp>0||heroReviveUntil>Date.now())return false;
 if(dungeonRun){finishDungeon(false);return true}
 if(stageBossActive()){retreatBoss();return true}
 const e=ensureEncounter();if(!e)return false;
 cancelCombatAnimation();s.stageKills=0;tacticsState().encounter=null;tacticsState().buffs={};
 heroReviveUntil=Date.now()+combatMs(COMBAT_BALANCE.reviveMs);heroReviveSave=s;enemyRespawnUntil=heroReviveUntil;
 s.enemyHp=maxHp();battleElapsed=0;s.lastCombatDefeat={stage:s.stage,at:Date.now()};
 paintBattle();save();banner('전투 패배');offerDefeatHelp(s.stage);return true;
}
function updateCombatSurvival(dt){
 if(!s?.classId||document.hidden||trialCombatPaused()||worldBoss.inBattle()||partyRaid.inBattle())return;
 if(heroReviveUntil){
  if(heroReviveSave!==s||dungeonRun||s.lastCombatDefeat?.stage!==s.stage)heroReviveUntil=0;
  else if(Date.now()<heroReviveUntil)return;
  else {heroReviveUntil=0;heroCurrentHp=health();paintHeroHealth();return}
 }
 const encounter=ensureEncounter()||bossStatus();if(!dungeonRun&&!s.auto&&!encounter.engaged)return;
 battleElapsed+=dt;applyEnemyCombatTick(dt,Date.now()<battleSlowUntil?.5:1);
 if(heroCurrentHp<=0)resolveHeroDefeat();
}
function tickTactics(){
 if(!s?.classId||document.hidden||trialCombatPaused()||worldBoss.inBattle()||partyRaid.inBattle())return;
 const now=Date.now(),e=ensureEncounter(),snapshot=combatEncounter(),targets=e?e.foes:[bossStatus()];
 targets.forEach((f,i)=>{if(e&&(!encounterReady(e)||f.hp<=0))return;for(const key of ['poison','burn']){if(!sameEncounter(snapshot)||stageBossActive()&&!stageBossTick()||e&&f.hp<=0)break;const status=f.status?.[key];if(!status||status.until<=now||status.next>now)continue;status.next=now+combatMs(1000);visualTarget=e?i:-1;warriorMotion.invalidate();const d=Math.round(status.damage*penetrationMultiplier(targetArmorReduction(e?f:null))*(1+trialMod('weakness')));damageText(d,false);if(e)hurtFoe(d,false,i);else{quietDamageNumber=true;try{tacticalBaseDamage(d,false)}finally{quietDamageNumber=false}}}});
 visualTarget=-1;paintTactics();
}
function setCreature(node,key){if(node.dataset.tacticArt===key)return;node.dataset.tacticArt=key;const a=HD_ART[key];if(!a)return;node.style.removeProperty('mask-image');const [sheet,w,h,x,y,cw,ch]=a;node.style.backgroundImage='var(--'+sheet+')';node.style.backgroundSize=w/cw*100+'% '+h/ch*100+'%';node.style.backgroundPosition=(w===cw?0:x/(w-cw)*100)+'% '+(h===ch?0:y/(h-ch)*100)+'%'}
// One short compositor animation per new monster; no extra frame loop or particles.
function animateEnemyEntrance(actor,e,i){
 const elapsed=Date.now()-e.spawnAt,delay=i*e.entryStagger;
 if(elapsed>=e.entryDuration+delay||!motionAllowed()||!warriorMotion.visible()||!actor.animate)return;
 const distance=$('battle').clientWidth-actor.offsetLeft+actor.offsetWidth*.15;
 // Sample a continuous gait onto the compositor once per entrance.
 const key=actor.dataset.tacticArt||'',flying=['creature_5_1','creature_6_2','creature_7_2','creature_8_1','creature_9_2'].includes(key);
 const heavy=['creature_0_1','creature_5_2','creature_8_2'].includes(key);
 const steps=flying?1:heavy?2:3;
 const frames=Array.from({length:36},(_,index)=>{
  const t=index/36,tail=1-t,travel=tail*tail*(1+.9*t);
  const gait=Math.sin(steps*Math.PI*t),weight=gait*gait*tail;
  const y=-(flying?7:heavy?2.5:4)*weight;
  const angle=(flying?1.3:heavy?1.1:2)*Math.sin(2*steps*Math.PI*t)*tail;
  return {offset:t,transform:`translate(${distance*travel}px,${y}px) rotate(${angle}deg)`,opacity:Math.min(1,t/.15)};
 });
 frames.push({offset:1,transform:'translate(0,0) rotate(0)',opacity:1});
 clearFoeTransition(actor);actor.classList.add('foe-entering');
 const animation=actor.animate(frames,{duration:e.entryDuration,delay:delay+Math.max(0,-elapsed),fill:'both',easing:'linear'});
 animation.currentTime=Math.max(0,elapsed);
 trackFoeTransition(actor,animation,'entry',e,i,e.spawnAt+e.entryDuration+delay);
}
let combatEffectsHud=null,soloMobEncounter=null,soloWaveKey='';
function paintTactics(){
 if(!s?.classId||duoTransaction)return;const e=ensureEncounter(),battle=$('battle');battle.classList.toggle('duo-battle',!!e);battle.classList.toggle('campaign-boss',stageBossActive());const now=trialPausedAt()??Date.now();
 if(e)soloMobEncounter=null;
 else if(!soloMobEncounter||!sameEncounter(soloMobEncounter)){
  soloMobEncounter=combatEncounter();soloWaveKey='boss-'+(++waveSequence);
 }
 for(let i=0;i<3;i++){const actor=foeNode(i),hud=$('foeHud'+i);if(!actor||!hud)continue;
  const transition=foeTransitions.get(actor);
  if(transition&&(transition.encounter!==e||now>=transition.until))finishFoeTransition(actor,transition);
  if(!e){actor.hidden=!!i;if(!i){if(actor.dataset.wave!==soloWaveKey){clearFoeTransition(actor);actor.getAnimations?.().filter(a=>!a.animationName).forEach(a=>a.cancel());actor.dataset.wave=soloWaveKey;delete actor.dataset.tacticArt;delete actor.dataset.dying}actor.classList.remove('targeted','foe-windup','foe-stunned','foe-entering');actor.setAttribute('role','img');actor.removeAttribute('tabindex');actor.removeAttribute('aria-pressed')}hud.hidden=true;continue}const f=e.foes[i];
  actor.classList.remove('awaiting-spawn','enemy-arrival');
  hud.hidden=!f||f.hp<=0||now<e.spawnAt+e.entryDuration+i*e.entryStagger;if(!f){clearFoeTransition(actor);actor.hidden=true;continue}
  const fresh=actor.dataset.wave!==String(e.id);
  if(fresh){clearFoeTransition(actor);actor.getAnimations?.().filter(a=>!a.animationName).forEach(a=>a.cancel());actor.dataset.wave=String(e.id);delete actor.dataset.tacticArt;delete actor.dataset.dying;actor.classList.remove('foe-entering')}
  actor.hidden=f.hp<=0&&actor.dataset.dying!==String(e.id);
  actor.classList.add('tactical-creature');hud.classList.toggle('targeted',e.target===i&&f.hp>0);actor.classList.toggle('foe-windup',s.auto&&f.hp>0&&!statusOn(f.status,'stun')&&f.nextAttack-now<600);actor.classList.toggle('foe-stunned',statusOn(f.status,'stun'));
  actor.setAttribute('role','button');actor.setAttribute('tabindex',f.hp>0&&encounterReady(e)?'0':'-1');actor.setAttribute('aria-label',FOE_ROLES[f.kind][0]+' '+fieldMob(e.stage,f.species).name+' · 체력 '+compact(f.hp)+' · 집중 공격');actor.setAttribute('aria-pressed',String(e.target===i));
  setCreature(actor,'creature_'+CAMPAIGN_CREATURE_REGIONS[campaignPosition().area]+'_'+f.species);
  if(fresh&&f.hp>0)animateEnemyEntrance(actor,e,i);
  const name=FOE_ROLES[f.kind][0],status=Object.keys(f.status).filter(k=>statusOn(f.status,k)).map(k=>({stun:'기절',break:'약화',poison:'중독',burn:'화상',weaken:'공격↓'}[k]||''));
  const signature=name+':'+Math.ceil(f.hp)+':'+Math.round(f.hp/f.max*100)+':'+e.target+':'+status.join(',');if(hud.dataset.state!==signature){hud.dataset.state=signature;hud.innerHTML=`<b>${e.target===i?'<ui-mark data-shape=diamond aria-hidden=true></ui-mark> ':''}${name}</b><span><i style="width:${Math.max(0,f.hp/f.max*100)}%"></i><em>${compact(f.hp)}</em></span><small>${status.join(' · ')}</small>`}
 }
 if(e)$('region').textContent=BIOMES[campaignPosition().area].name+' · '+Math.min(3,Math.floor((s.stageKills||0)/3)+1)+'/3 웨이브';
 actorMotion.sync(e);
 const buffs=combatEffectsHud;if(buffs){const rows=['boost','guard'].filter(k=>statusOn(tacticsState().buffs,k));buffs.textContent=rows.map(k=>(k==='boost'?'공격↑ ':'피해↓ ')+Math.ceil((tacticsState().buffs[k].until-now)/1000)+'초').join(' · ')}
}
const tacticalPaintBattle=paintBattle;
paintBattle=function(){if(duoTransaction)return;tacticalPaintBattle();paintTactics()};
const tacticalCooldowns=paintCooldowns;
paintCooldowns=function(){if(s?.tactics){const t=tacticsState(),now=trialPausedAt()??Date.now();cooldowns=s.slots.map(k=>k<0?0:Math.max(0,(Math.max(t.ready[k]||0,t.classReadyAt||0)-now)/1000*s.speed))}for(let i=0;i<4;i++){const el=$('cool'+i);if(el){el.style.display=cooldowns[i]>0?'grid':'none';el.textContent=Math.ceil(cooldowns[i]/s.speed)}}};
const tacticalInit=initClassesCombat;
initClassesCombat=function(){tacticalInit();for(let i=0;i<3;i++){const node=document.createElement('div');node.id='foeHud'+i;node.className='foe-hud foe-hud-'+i;$('battle').appendChild(node);const actor=foeNode(i);actor.addEventListener('click',()=>chooseEnemy(i));actor.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();chooseEnemy(i)}})}combatEffectsHud=document.createElement('div');combatEffectsHud.id='combatBuffs';combatEffectsHud.className='combat-buffs';$('skillbuttons').appendChild(combatEffectsHud);setInterval(tickTactics,250);paintBattle()};

// Loadout UI: free edits, four slots, per-skill cooldowns survive changes and reloads.
const ROLE_NAMES={single:'단일',all:'광역',self:'지원'};
const PRESET_NAMES={hunt:'사냥',boss:'보스',survive:'생존'};
const PRESET_HINTS={hunt:'광역 공격으로 세 마리를 빠르게',boss:'약화와 단일 공격으로 집중 공략',survive:'제어와 회복으로 오래 버티기'};
function suggestedLoadout(kind){const ci=Math.max(0,classIndex(s.classId)),b=ci*4,x=20+ci*4,orders={hunt:[[b+2,b+3,x+3,x],[b+2,x+1,b+3,x],[x,b+3,x+1,x+2],[x,x+1,b+3,b+2],[x,b+3,x+2,b+2]],boss:[[x,x+1,b+1,b],[x,b+1,x+2,b],[x+2,b,b+1,b+3],[x+2,b,b+2,b+1],[x+1,b+1,x+3,b]],survive:[[x+2,x+3,b+2,b],[x+3,x+1,x,b],[b+1,x+3,x+1,b],[x+3,x+1,b+1,b],[x+2,x+1,b+2,b]]};const n=40+4*ci;
 const priorities=kind==='boss'?[[n+3,x,n+2,b+1],[n+2,n+3,x,b+1],[n+2,n+3,x+2,b],[n+2,x+2,b,b+1],[n+3,x+1,b+1,b]][ci]
  :kind==='hunt'?[[n+1,b+2,b+3,x+3],[n+1,b+2,x+1,b+3],[n+1,x,b+3,x+1],[n+3,n+1,x,b+3],[n+1,n+2,x,b+3]][ci]:[];
 const wanted=priorities.concat(orders[kind]?.[ci]||[]);return [...new Set(wanted.concat(classSkillIds()))].filter(k=>skillUnlocked(k)&&s.skills[k]).slice(0,4)}
function applySkillPreset(kind,useRecommendation=false){
 if(!s.classId||!PRESET_NAMES[kind])return false;
 unlockClassSkills();
 const t=tacticsState(),stored=t.presets[s.classId]?.[kind];
 const candidate=!useRecommendation&&Array.isArray(stored)?stored:suggestedLoadout(kind),used=new Set();
 s.slots=Array.from({length:4},(_,i)=>{
  const k=candidate[i];
  if(!slotOpen(i)||!skillUnlocked(k)||used.has(k))return -1;
  used.add(k);
  return k;
 });
 cooldowns=s.slots.map(k=>Math.max(0,(Math.max(t.ready[k]||0,t.classReadyAt||0)-Date.now())/1000*s.speed));
 if(!useRecommendation)t.selectedPreset=kind;
 rememberClass();save();paint();return true;
}
function saveSkillPreset(kind){if(!PRESET_NAMES[kind])return false;const t=tacticsState();t.presets[s.classId]||={};t.presets[s.classId][kind]=[...s.slots];t.selectedPreset=kind;save();notice(PRESET_NAMES[kind]+' 구성 저장');return true}
setSlot=function(slot,k){if(!slotOpen(slot)||!skillUnlocked(k)||!s.skills[k])return false;const old=s.slots.indexOf(k),replaced=s.slots[slot];if(old>=0)s.slots[old]=replaced;s.slots[slot]=k;const t=tacticsState();t.selectedPreset='custom';cooldowns=s.slots.map(k=>Math.max(0,(Math.max(t.ready[k]||0,t.classReadyAt||0)-Date.now())/1000*s.speed));rememberClass();save();paint();return true};
autoEquipSkills=function(){
 const selected=tacticsState().selectedPreset;
 const kind=guidance().status==='active'&&guidance().step===2?'hunt':PRESET_NAMES[selected]?selected:stageBossActive()?'boss':'hunt';
 if(!applySkillPreset(kind,true))return false;
 notice(PRESET_NAMES[kind]+' 추천 스킬 장착 완료');
 return true;
};
const oldSkillArt=skillArt;
skillArt=function renderSkill(k){
 if(k<20)return oldSkillArt(k);
 if(!CLASS_SKILLS[k])return art('skills');
 const atlas=k<40?'technique-art':'discovery-art';
 return `<span class="skill-sigil ${atlas}" aria-hidden="true" style="background-position:${(k%4)*100/3}% ${skillOwnerIndex(k)*25}%"></span>`;
};
function skillRoleLabel(k){const m=skillMeta(k);return ROLE_NAMES[m.target]+(['heal','guard'].includes(m.status)?' · 생존':['stun','break','weaken','poison','burn'].includes(m.status)?' · '+({stun:'제어',break:'약화',weaken:'약화',poison:'지속',burn:'지속'}[m.status]):'')}
function skillSummary(k){const m=skillMeta(k),d=compact(Math.round(skillDamage(k,s.skills[k]||1,true)*m.factor));return (m.target==='self'?'':(m.target==='all'?'모험 · 각 적 ':'모험 피해 ')+d+' · ')+SKILL_RULES[k].cd+'초'}
paintSkillButtons=function(){
 $('skillbuttons').innerHTML=s.slots.map((k,i)=>{
  const open=slotOpen(i),empty=k<0,label=!open?'STAGE '+SLOT_GATES[i]+' 해금':empty?'스킬 장착':SK[k][0];
  const icon=!open?skillLock():empty?'<i class="battle-slot-plus"><ui-mark data-shape=plus aria-hidden=true></ui-mark></i>':skillArt(k);
  const action=empty?"openMenu('availableSkills',"+i+")":'cast('+i+')';
  return `<button${open&&!empty&&skillMeta(k).target==='all'?' data-guide="cast"':''} class="${!open?'locked':empty?'empty-skill':''}" ${open?'onclick="'+action+'"':'disabled'} aria-label="${label}">${icon}<small id="cool${i}" style="display:${cooldowns[i]>0?'grid':'none'}">${Math.ceil(cooldowns[i]/s.speed)}</small><span class="skill-target">${open&&!empty?ROLE_NAMES[skillMeta(k).target]:''}</span><span class="battle-skill-name">${!open?'STAGE '+SLOT_GATES[i]:empty?'장착':SK[k][0]}</span></button>`;
 }).join('');
 if(combatEffectsHud)$('skillbuttons').appendChild(combatEffectsHud);
};
