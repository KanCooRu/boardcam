'use strict';

const WEAPON_SKIN_NAMES={
 warrior:['불사조의 송곳니','빙해 절단검','비취 가시대검','월식의 파쇄검','여명의 왕검','은하의 별가름검'],
 shadow:['홍련의 쌍아','빙조의 비수','비취 독가시','자월 쌍월도','여명날개 쌍검','은하 균열쌍검'],
 paladin:['불사조의 쇠부리','빙해의 파도추','비취 가시철퇴','월식의 심판추','여명의 성좌철퇴','은하의 별망치'],
 mage:['홍련의 불씨지팡이','빙해의 물결지팡이','비취의 뿌리지팡이','월식의 초승지팡이','여명의 천문지팡이','은하의 항성지팡이'],
 archer:['불사조의 날개활','빙해의 파도활','비취의 가시활','월식의 음영궁','여명의 천익궁','은하의 유성궁']
};
function weaponSkinName(id,job=s.classId){
 return id===0?'기본 무기':WEAPON_SKIN_NAMES[job]?.[id-1]||'전용 무기';
}
function skinBonus(){return 0}
function runeArt(key){return key?'<img class="rune-emblem" src="'+catalogPath(key)+'" alt="">':''}
const WEAPON_ELEMENTS={
 fire:{name:'화염',color:'#ff955e',stat:'스킬 피해',step:6},
 frost:{name:'서리',color:'#81e7fa',stat:'받는 피해',step:-4},
 storm:{name:'뇌전',color:'#d0a5ff',stat:'일반 공격 피해',step:8}
};
const WEAPON_RANK_XP=[30,180,600,1500,3500,7500,14000,25000,40000,65000,100000,150000,220000,320000,460000];
const WEAPON_START_IRON=12;
const FORGE_AIM_PERIOD_MS=1200,FORGE_AIM_TIMEOUT_MS=4000,FORGE_AUTO_UNLOCK=30;
const FORGE_TIMING_LABELS={perfect:'완벽',good:'좋음',miss:'빗맞음'};
const weaponAsset=(name)=>'./assets/weapon-forge/'+name+'.webp';
const whole=(n,max)=>Number.isFinite(n)?Math.min(max,Math.max(0,Math.floor(n))):0;
const weaponRank=w=>Object.values(w.runes).reduce((n,x)=>n+x,0);
const weaponGoal=w=>WEAPON_RANK_XP[weaponRank(w)]||0;
const canInscribe=w=>weaponGoal(w)>0&&w.xp>=weaponGoal(w);
function readWeapon(raw={},inherit={}){
 const inheritedPlus=whole(inherit.plus??raw.inheritedPlus,15);
 const plus=Math.max(inheritedPlus,whole(raw.plus,WEAPON_MAX_PLUS));
 const w={basic:isPlainStarter(inherit)||raw.basic===true,inheritedPlus,grade:whole(inherit.r??raw.grade,10),master:inherit.masterwork!==undefined||raw.master===true,
  plus,peakPlus:Math.max(plus,whole(raw.peakPlus,WEAPON_MAX_PLUS)),misses:0,legacyAttack:whole(raw.legacyAttack,1e9),
  xp:whole(raw.xp,2000000),runes:{},skin:weaponAppearanceTier(plus),seen:whole(raw.seen,15)};
 for(const key of Object.keys(WEAPON_ELEMENTS))w.runes[key]=whole(raw.runes?.[key],5);
 // Preserve already earned attack when an old save exceeds the new final level.
 if(raw.balanceVersion!==2&&Number(raw.plus)>WEAPON_MAX_PLUS){
  const oldCurve=n=>(1+.075*Math.min(n,15))*Math.pow(1.064,n);
  const base=w.basic?0:12*GRADE_MULT[w.grade]*(1+inheritedPlus*.2)*(w.master?MASTERWORK_MULTIPLIER:1);
  const previous=base+12*(oldCurve(whole(raw.plus,100))-oldCurve(inheritedPlus));
  w.legacyAttack=Math.max(w.legacyAttack,Math.ceil(previous-weaponAttack(w)));
 }
 w.balanceVersion=2;
 return w;
}
function initializeWeapons(a,raw={}){
 const oldWeapons=a.gear.filter(g=>g.p===0);
 // Transfer the best old weapon's attack, including its rarity, smith bonus and enhancement.
 const legacy=raw.weaponVersion===1?null:oldWeapons.reduce((best,g)=>!best||gearValue(g)>gearValue(best)?g:best,null);
 a.weapons={};
 a.forgeManualTries=whole(raw.forgeManualTries,Number.MAX_SAFE_INTEGER);
 a.forgeAuto=a.forgeManualTries>=FORGE_AUTO_UNLOCK&&raw.forgeAuto===true;
 a.forgeGuards=whole(raw.forgeGuards,Number.MAX_SAFE_INTEGER);
 a.forgeDebris=whole(raw.forgeDebris,Number.MAX_SAFE_INTEGER);
 a.forgeGuardOn=a.forgeGuards>0&&raw.forgeGuardOn===true;
 for(const id of Object.keys(WEAPON_NAMES))a.weapons[id]=readWeapon(recordMap(raw.weapons?.[id]),legacy||{});
 a.starIron=raw.weaponVersion===1?whole(raw.starIron,1e12):WEAPON_START_IRON;
 if(legacy)a.gear=a.gear.filter(g=>g.id!==legacy.id);
 delete a.equipped[0];
 if(a.classId&&(!a.weapons[a.classId].basic||a.weapons[a.classId].plus>0)){
  const highest=weaponGrade(a.weapons[a.classId].plus);
  for(let r=0;r<=highest;r++)a.unlocked['0_'+r]=true;
 }
 delete a.weaponSkinVersion;a.weaponVersion=1;
 return a;
}
const starterBeforeWeapons=starter, migrateBeforeWeapons=migrate;
starter=function(){return initializeWeapons(starterBeforeWeapons())};
migrate=function(raw){return initializeWeapons(migrateBeforeWeapons(raw),raw||{})};
function currentWeapon(){return s?.weapons?.[s.classId||'warrior']}
function weaponAttack(w,at=w.plus){
 const base=12*GRADE_MULT[w.grade]*(1+w.inheritedPlus*.2)*(w.master?MASTERWORK_MULTIPLIER:1);
 const curve=n=>(1+.2*n)*Math.pow(1.2,n);
 const level=whole(at,WEAPON_MAX_PLUS);
 return (w.basic?0:base)+12*(curve(level)-curve(w.inheritedPlus))+(w.legacyAttack||0);
}
function weaponEnhancementBonus(stat,level=currentWeapon()?.plus||0){
 const n=whole(level,WEAPON_MAX_PLUS);
 return stat==='critDamage'?Math.max(0,n-10)*.02:stat==='penetration'?Math.max(0,n-20)*.01:0;
}
function weaponBonusLine(level){
 return '치명타 피해 +'+Math.round(weaponEnhancementBonus('critDamage',level)*100)+'% · 방어 관통력 +'+Math.round(weaponEnhancementBonus('penetration',level)*100)+'%p';
}
function signatureItem(){
 const w=currentWeapon();if(!w)return null;
 return {id:'signature_'+(s.classId||'warrior'),signature:true,p:0,set:null,r:Math.max(w.grade,weaponGrade(w.plus)),plus:w.plus,locked:true};
}
const equippedBeforeWeapons=equippedItem,valueBeforeWeapons=gearValue;
equippedItem=function(p){return Number(p)===0&&s?.weapons?signatureItem():equippedBeforeWeapons(p)};
gearValue=function(g){return g?.signature?weaponAttack(currentWeapon()):valueBeforeWeapons(g)};
function weaponModifier(key){return 1+(currentWeapon()?.runes?.[key]||0)*WEAPON_ELEMENTS[key].step/100}
const powerBeforeWeaponSkin=power,healthBeforeWeaponSkin=health,critBeforeWeaponSkin=criticalChance,speedBeforeWeaponSkin=attackSpeed;
power=function(){const base=Math.floor(powerBeforeWeaponSkin()*(1+skinBonus('attack')));return Math.floor(base*(1+trialMod('attack')))};
health=function(){return Math.floor(healthBeforeWeaponSkin()*(1+skinBonus('health')))};
criticalChance=function(){return Math.min(1,Math.min(.6+(s.classId==='shadow'?.08:0),critBeforeWeaponSkin()+skinBonus('critical'))+trialMod('crit'))};
attackSpeed=function(){return speedBeforeWeaponSkin()*(1+skinBonus('speed'))*(1+trialMod('speed'))};
const skillBeforeWeapons=skillDamage;
skillDamage=function(...args){const base=Math.ceil(skillBeforeWeapons(...args)*weaponModifier('fire')*(1+skinBonus('skill')));return Math.ceil(base*(1+trialMod('skillDamage')))};
function gainWeaponXp(amount){
 const w=currentWeapon();if(!s.classId||!w||!weaponGoal(w)||amount<=0)return;
 w.xp=Math.min(2000000,w.xp+Math.floor(amount));
 if(canInscribe(w)&&w.seen===weaponRank(w))scheduleWeaponPrompt();
}
let promptTimer=0;
function scheduleWeaponPrompt(){
 if(promptTimer)return;
 promptTimer=setTimeout(()=>{promptTimer=0;promptWeaponIfReady()},120);
}
function promptWeaponIfReady(){
 const w=currentWeapon();
 if(!s?.classId||!w||!canInscribe(w)||w.seen!==weaponRank(w)||document.hidden||view||forgeBusy||wheelBusy||
    dungeonRun||s.stage%10===0||worldBoss.inBattle()||partyRaid.inBattle()||activeScreen!=='home'||!$('classOnboarding').hidden)return;
 w.seen=weaponRank(w)+1;save();
 notice('숙련 완료 · 모루의 무기 성장에서 속성을 부여하세요');
}
const rewardsClockBeforeWeapons=refreshRewardClocks;
refreshRewardClocks=function(){rewardsClockBeforeWeapons();promptWeaponIfReady()};
// Star iron comes from daily content. Dismantling pays it only for legendary gear and above.
const SALVAGE_IRON=[0,0,0,0,0,0,1,2,3,5,8];
function salvageIron(g){return SALVAGE_IRON[g.r]||0}
RESOURCE_NAMES.starIron='별철';RESOURCE_ART.starIron='starIron';
const FORGE_GUARD_ICON='./assets/reward-icons/forge-guard.webp';
RESOURCE_NAMES.forgeGuards='파괴 방지권';
RESOURCE_ART.forgeGuards='forgeGuards';
const artBeforeWeapons=art;
art=function(name,cls=''){
 if(name==='forgeGuards')return '<img class="art catalog-icon '+cls+'" data-icon="forgeGuards" src="'+FORGE_GUARD_ICON+'" width="40" height="40" alt="">';
 return artBeforeWeapons(name,cls);
};
function weaponIcon(job,skin,cls=''){
 const src=catalogPath('weapon-'+job+'-'+skin);
 return '<img class="weapon-icon '+cls+'" alt="" width="192" height="192" src="'+src+'">';
}
function forgeWeaponSource(job,skin){
 if(skin>0)return './assets/season-weapons/'+job+'-'+skin+'.webp';
 if(job==='shadow')return './assets/weapon-icons/shadow-0.webp';
 if(job==='archer')return './assets/weapon-icons/archer-base-display.webp';
 return weaponAsset(job+'-'+skin)+'?v=49';
}
function forgeWeaponArt(job,skin){
 // The season combat asset is one hand's dagger; its catalog art shows the equipped pair.
 const src=job==='shadow'&&skin>0?'./assets/season-weapons/icons/shadow-'+skin+'.webp':forgeWeaponSource(job,skin);
 return '<img class="weapon-icon" alt="" src="'+src+'">';
}
function weaponLabel(){return WEAPON_NAMES[s.classId]||'전용 무기'}
function weaponTile(){
 const w=currentWeapon(),job=s.classId||'warrior',name=weaponLabel();
 return equippedTileButton({
  title:name,label:name+' 무기 성장',grade:signatureItem().r,icon:weaponIcon(job,w.skin,'gear-illustration'),
  mark:'착용',level:'+'+w.plus,worn:true,action:"navigate('forge','weapon')"
 });
}
function elementLine(key,level){
 const e=WEAPON_ELEMENTS[key],value=e.step*level;
 return e.stat+' '+(value>0?'+':'')+value+'%';
}
function weaponScene(skin){
 return '<div class="weapon-scene display" aria-hidden="true"><i class="weapon-halo"></i><span class="weapon-display">'+forgeWeaponArt(s.classId||'warrior',skin)+'</span></div>';
}
function inscriptionScene(job,skin,key,phase){
 const element=key||'dormant',moving=motionAllowed()&&!!key;
 return `<div class="weapon-scene inscription" data-element="${element}" data-phase="${phase}" data-moving="${moving}" style="--rune:${WEAPON_ELEMENTS[key]?.color||'#c9c2d9'}" aria-hidden="true">
  <div class="inscription-stone"></div>
  ${moving?'<div class="inscription-current"><i></i><i></i></div>':''}
  <span class="weapon-display">${forgeWeaponArt(job,skin)}</span>
 </div>`;
}
// Contact points lie on the opaque metal of each skin, in its unrotated image.
const forgeContacts={
 warrior:{height:70,angle:-96,y:41,x:41},
 shadow:{height:58,angle:-96,y:43,x:39},
 paladin:{height:57,angle:-95,y:20,x:37},
 mage:{height:58,angle:-95,y:24,x:40},
 archer:{height:68,angle:88,y:50,x:88}
};
const FORGE_SHOT_MS=1800,FORGE_CONTACT_MS=FORGE_SHOT_MS*.44,FORGE_AWAKEN_MS=800;
function forgeStrikePiece(job,skin,appearanceClass=''){
 const pose=forgeContacts[job],daggers=job==='shadow'&&skin===0;
 const src=forgeWeaponSource(job,skin);
 const contact=skin>0?seasonWeaponGeometry(job,skin)?.strike:null;
 const strikeX=contact?contact[0]*100:pose.x,strikeY=contact?contact[1]*100:pose.y;
 const metal='--piece:url('+src+');--size:'+(daggers?43:pose.height)+'cqw;--ax:'+strikeX+'%;--ay:'+strikeY+'%;--angle:'+(daggers?-65:pose.angle)+'deg';
 return '<div class="forge-piece-plane'+appearanceClass+'" style="'+metal+'"><span class="forge-workpiece"><img alt="" src="'+src+'"><i class="forge-heat"></i></span></div>';
}
function forgeStrikeScene(job,skin,ritual){
 const outcome=ritual.result?(ritual.result.ok?'tempered':'cooled'):'ready';
 const awakening=ritual.revealing&&motionAllowed();
 return '<div class="forge-shot'+(awakening?' weapon-awakening':'')+'" data-phase="'+ritual.phase+'" data-metal="'+outcome+'" data-timing="'+(ritual.result?.timing||'')+'" style="--shot-time:'+FORGE_SHOT_MS+'ms;--awaken-time:'+FORGE_AWAKEN_MS+'ms" aria-hidden="true">'+
  '<div class="forge-camera"><div class="forge-bounce-light"></div>'+
  (awakening?forgeStrikePiece(job,ritual.result.skin,' forge-form-from'):'')+forgeStrikePiece(job,skin,awakening?' forge-form-to':'')+
  '<img class="forge-mallet" src="'+weaponAsset('smith-strike')+'" alt=""><canvas class="forge-emission"></canvas></div></div>';
}
// The physical impulse is rendered in the same 960 × 540 camera space as the anvil.
function forgeImpactParticles(canvas,ritual){
 const ctx=canvas?.getContext('2d');
 if(!ctx||!canvas.isConnected||!motionAllowed())return;
 const width=Math.min(1152,Math.round(canvas.clientWidth*Math.min(window.devicePixelRatio||1,2)));
 if(!width)return;
 canvas.width=width;canvas.height=Math.round(width*540/960);
 ctx.setTransform(canvas.width/960,0,0,canvas.height/540,0,0);
 let seed=Math.round(ritual.startedAt*47)>>>0;
 const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
 const hot=ritual.result.ok;
 const scale=ritual.result.timing==='perfect'?1.5:ritual.result.timing==='miss'?.5:1;
 const sparks=Array.from({length:Math.round((hot?61:43)*scale)},()=>{
  const scale=random(),angled=random()<.29,side=random()<.57?-1:1;
  return {x:(random()-.5)*47,y:(random()-.5)*5,vx:side*(34+random()*605)*(angled?.49:1),
   vy:-(30+random()*(angled?440:235)),gravity:420+random()*440,delay:random()**2*.12,
   life:.18+random()*(hot?.81:.59),width:.65+scale*1.72,tail:.006+scale*.019};
 });
 const cx=480,cy=540*.58;
 function frame(now){
  if(!canvas.isConnected||validRitual('weaponEnhance')!==ritual||ritual.phase!=='working'||document.hidden||!motionAllowed())return;
  const t=(now-ritual.startedAt-FORGE_CONTACT_MS)/1000;
  ctx.clearRect(0,0,960,540);
  if(t>=0){
   ctx.save();ctx.translate(cx,cy);ctx.globalCompositeOperation='lighter';
   const light=Math.exp(-t*12);
   if(light>.004){
    ctx.save();ctx.scale(1,.30);
    const spill=ctx.createRadialGradient(0,0,1,0,0,150);
    spill.addColorStop(0,'rgba(255,224,160,'+(.86*light)+')');
    spill.addColorStop(.19,'rgba(255,146,43,'+(.64*light)+')');
    spill.addColorStop(1,'rgba(225,76,19,0)');
    ctx.fillStyle=spill;ctx.fillRect(-150,-150,300,300);ctx.restore();
   }
   for(const p of sparks){
    const age=t-p.delay;if(age<0||age>=p.life)continue;
    const fade=1-age/p.life;
    const x=p.x+p.vx*age/(1+.55*age),y=p.y+p.vy*age+.5*p.gravity*age*age;
    if(y>30&&Math.abs(x)<330)continue;
    const dx=p.vx/((1+.55*age)**2),dy=p.vy+p.gravity*age;
    ctx.globalAlpha=Math.min(1,fade*2.6);ctx.lineCap='round';
    ctx.strokeStyle='rgb(255,'+Math.round(67+fade*124)+','+Math.round(9+fade*65)+')';
    ctx.lineWidth=p.width*fade+.32;ctx.beginPath();ctx.moveTo(x-dx*p.tail,y-dy*p.tail);ctx.lineTo(x,y);ctx.stroke();
    ctx.fillStyle=fade>.67?'#ffe6af':'#ff9b43';
    ctx.beginPath();ctx.arc(x,y,Math.max(.36,p.width*fade*.65),0,Math.PI*2);ctx.fill();
   }
   ctx.restore();
  }
  if(now<ritual.startedAt+FORGE_SHOT_MS)requestAnimationFrame(frame);
 }
 requestAnimationFrame(frame);
}
function weaponScreen(){
 const w=currentWeapon(),rank=weaponRank(w),goal=weaponGoal(w),ready=canInscribe(w);
 return '<section class="weapon-page">'+forgeDailyOrders()+'<header class="weapon-plinth">'+weaponScene(w.skin)+
 '<div><small>'+currentClass().name+' 전용 무기</small><h2>'+weaponLabel()+' <b>+'+w.plus+'</b></h2><span>'+weaponSkinName(w.skin)+' · 무기 공격력 '+num(Math.round(weaponAttack(w)))+'</span></div></header>'+
 '<div class="weapon-tools"><button class="gold-button" data-guide="enhance" onclick="openWeaponRitual(\'weaponEnhance\')">무기 강화</button><button class="muted-button" onclick="openMenu(\'weaponSkins\')">무기 모습</button></div>'+
 '<section class="weapon-panel"><div class="weapon-heading"><h3>무기 숙련</h3><b>'+rank+'단계</b></div>'+
 (goal?progressGauge('다음 속성 부여',w.xp,goal):'<b>모든 속성 각인 완료</b>')+
 '<p>일반 몬스터 처치 +1 · 지역 보스 처치 +5 · 방치 1분당 +1</p>'+
 '<button class="'+(ready?'gold-button':'muted-button')+'" onclick="openWeaponRitual(\'weaponImbue\')">'+(ready?'속성 부여 가능':'속성 확인')+'</button></section>'+
 '<section class="weapon-panel"><div class="weapon-heading"><h3>강화 재료</h3><button class="muted-button" onclick="openMenu(\'weaponSupplies\')">획득처</button></div>'+materialRows()+'</section></section>';
}
SCREEN_TABS.forge.splice(1,0,['weapon','무기 성장']);
const forgeBeforeWeapons=forgeScreen;
forgeScreen=function(){return screenTab==='weapon'?weaponScreen():forgeBeforeWeapons()};
function materialRows(cost){
 return '<div class="weapon-materials">'+(cost?['gold','stones','starIron']:['stones','starIron']).map(k=>'<div>'+art(RESOURCE_ART[k])+'<small>'+RESOURCE_NAMES[k]+'</small><b'+(cost&&s[k]<cost[k]?' class="short"':'')+'>'+num(s[k])+(cost?' / '+num(cost[k]):'')+'</b></div>').join('')+'</div>';
}
function weaponSupplies(){
 return '<div class="weapon-supplies">'+[
 ['장비 분해','미착용 장비 분해 시 강화석·별철 획득',"openMenu('inventory')"],
 ['별의 광산','채굴량에 따라 별철 3~15개·강화석 획득',"navigate('dungeon','mine')"],
 ['일일·주간 미션','장비 제작·몬스터 처치·무기 강화 임무에서 획득',"openMissions('daily')"],
 ['성장·시즌 패스','성장 패스·시즌 보상에서 별철 획득',"openMenu('pass')"]
 ].map(([a,b,fn])=>'<button onclick="'+fn+'"><span><b>'+a+'</b><small>'+b+'</small></span> <ui-mark data-shape=chevron-right aria-hidden=true></ui-mark></button>').join('')+'</div>';
}
function weaponSkins(){
 return '<div class="weapon-wardrobe">'+weaponSkinGrid()+'</div>';
}
let weaponRitual=null,forgeRiskConsentOwner=null;
function openWeaponRitual(kind){
 if(!s.classId||!['weaponEnhance','weaponImbue'].includes(kind))return false;
 const w=currentWeapon();if(kind==='weaponImbue'&&canInscribe(w)){w.seen=weaponRank(w)+1;save()}
 if(weaponRitual?.aimTimer)clearTimeout(weaponRitual.aimTimer);
 weaponRitual={kind,owner:s,job:s.classId,phase:'choose',selected:'',result:null};
 if(view===kind)render();else openMenu(kind);
 return true;
}
function validRitual(kind){
 const a=weaponRitual;return a&&view===kind&&a.kind===kind&&a.owner===s&&a.job===s.classId?a:null;
}
function animateWeaponResult(a,result){
 a.result=result;a.phase='working';
 if(a.kind==='weaponImbue')save();
 a.startedAt=performance.now();render();paint();
 const finish=()=>{
  if(validRitual(a.kind)!==a||a.phase!=='working')return;
  a.revealing=!!result.awakened&&motionAllowed()&&!document.hidden;
  a.phase='done';render();playSound(result.ok?'reward':'impact');
  if(a.revealing)setTimeout(()=>{
   a.revealing=false;
   if(validRitual(a.kind)===a)render();
  },FORGE_AWAKEN_MS);
  if(result.outcome==='destroy'&&motionAllowed()&&!document.hidden){
   const panel=$('content').querySelector('.weapon-ritual');
   panel?.classList.add('forge-destroyed');
   setTimeout(()=>panel?.classList.remove('forge-destroyed'),300);
  }
 };
 const moving=motionAllowed();if(!moving){finish();return}
 if(a.kind==='weaponEnhance'){
  if(result.awakened)new Image().src=forgeWeaponSource(a.job,currentWeapon().skin);
  const elapsed=performance.now()-a.startedAt;
  setTimeout(()=>{
   if(validRitual(a.kind)!==a||document.hidden||!motionAllowed())return;
   playSound('forge');
   if(result.timing==='perfect')navigator.vibrate?.(30);
  },Math.max(0,FORGE_CONTACT_MS-elapsed));
  setTimeout(finish,Math.max(0,FORGE_SHOT_MS-elapsed));
 }else{playSound('holy');setTimeout(finish,1550)}
}
function forgeAimGrade(elapsed){
 // Compare distances in milliseconds to include both edges of each timing window exactly.
 const half=FORGE_AIM_PERIOD_MS/2,cycle=Math.max(0,elapsed)%FORGE_AIM_PERIOD_MS;
 const cursor=Math.min(cycle,FORGE_AIM_PERIOD_MS-cycle),distance=Math.abs(cursor-half/2);
 return distance<=half*.06?'perfect':distance<=half*.20?'good':'miss';
}
function setForgeAuto(checked){
 const a=validRitual('weaponEnhance');
 if(!a||a.phase!=='choose'||s.forgeManualTries<FORGE_AUTO_UNLOCK)return false;
 s.forgeAuto=checked===true;save();render();return true;
}
function setForgeGuard(checked){
 const a=validRitual('weaponEnhance');
 if(!a||a.phase!=='choose'||!WEAPON_DESTROY_RATES[currentWeapon().plus])return false;
 s.forgeGuardOn=s.forgeGuards>0&&checked===true;save();render();return true;
}
function forgeRiskNeedsConsent(a){
 return WEAPON_DESTROY_RATES[a.aimLevel]>0&&!(s.forgeGuardOn&&s.forgeGuards>0)&&!a.riskAccepted&&forgeRiskConsentOwner!==s;
}
function attemptWeaponEnhance(){
 const a=validRitual('weaponEnhance'),w=currentWeapon();
 if(!a||a.phase!=='choose'||!saveGuard.canTransact()||!canPayWeapon(w))return false;
 a.aimLevel=w.plus;a.riskAccepted=false;
 if(forgeRiskNeedsConsent(a)){
  a.phase='warning';render();return true;
 }
 return beginWeaponHammer(a);
}
function cancelForgeRisk(){
 const a=validRitual('weaponEnhance');
 if(!a||a.phase!=='warning')return false;
 a.phase='choose';render();return true;
}
function confirmForgeRisk(skip=false){
 const a=validRitual('weaponEnhance'),w=currentWeapon();
 if(!a||a.phase!=='warning')return false;
 if(!saveGuard.canTransact()||w.plus!==a.aimLevel||!canPayWeapon(w)){a.phase='choose';render();return false}
 if(skip===true)forgeRiskConsentOwner=s;
 a.riskAccepted=true;
 return beginWeaponHammer(a);
}
function beginWeaponHammer(a){
 a.manual=!(s.forgeAuto&&s.forgeManualTries>=FORGE_AUTO_UNLOCK);
 a.phase='choose';
 if(!a.manual||!motionAllowed())return commitWeaponEnhance(a,'good');
 a.phase='aim';a.aimStartedAt=performance.now();
 a.aimTimer=setTimeout(()=>settleWeaponAim(a,true),FORGE_AIM_TIMEOUT_MS);
 render();return true;
}
function settleWeaponAim(a=weaponRitual,timedOut=false){
 if(!a||a!==validRitual('weaponEnhance')||a.phase!=='aim'||a.aimNode?.isConnected===false)return false;
 const elapsed=performance.now()-a.aimStartedAt;
 const timing=timedOut||elapsed>=FORGE_AIM_TIMEOUT_MS||!motionAllowed()?'good':forgeAimGrade(elapsed);
 return commitWeaponEnhance(a,timing);
}
function commitWeaponEnhance(a,timing){
 const w=currentWeapon();
 if(!a||a!==validRitual('weaponEnhance')||!['aim','choose'].includes(a.phase))return false;
 clearTimeout(a.aimTimer);
 if(!saveGuard.canTransact()||w.plus!==a.aimLevel||!canPayWeapon(w)){a.phase='choose';render();return false}
 if(forgeRiskNeedsConsent(a)){a.phase='warning';render();return false}
 a.phase='committing';
 const input={useGuard:s.forgeGuardOn===true&&s.forgeGuards>0},meta={timing,manual:a.manual};
 if(saveGuard.usesServer()){
  const pending=saveGuard.command('forge',input,meta);
  render();
  return pending.then(receipt=>{
   if(validRitual('weaponEnhance')!==a)return !!receipt;
   if(!receipt){a.phase='choose';render();return false}
   animateWeaponResult(a,receipt);return true;
  });
 }
 const receipt=economyForgeRule(s,input,Math.random,Date.now(),meta);
 saveTransaction();animateWeaponResult(a,receipt);return true;
}
function pickWeaponRune(key){
 const a=validRitual('weaponImbue'),w=currentWeapon();if(!a||a.phase!=='choose'||!Object.hasOwn(WEAPON_ELEMENTS,key)||w.runes[key]>=5)return false;
 a.selected=key;render();return true;
}
function inscribeWeapon(){
 const a=validRitual('weaponImbue'),w=currentWeapon();if(!a||a.phase!=='choose'||!Object.hasOwn(WEAPON_ELEMENTS,a.selected)||!canInscribe(w)||w.runes[a.selected]>=5)return false;
 const key=a.selected,goal=weaponGoal(w);w.xp-=goal;w.runes[key]++;w.seen=weaponRank(w);
 animateWeaponResult(a,{ok:true,key,rank:weaponRank(w),level:w.runes[key]});return true;
}
function forgeChanceRows(level){
 const {success,keep,destroy}=weaponEnhanceOdds(level);
 return '<div class="forge-chances" role="group" aria-label="+'+level+' 단계 강화 확률">'+
  '<div><small>성공</small><b>'+success+'%</b></div><div><small>유지</small><b>'+keep+'%</b></div><div><small>파괴</small><b>'+destroy+'%</b></div></div>';
}
// Debris from unprotected destructions, with its exchange for a guard.
function forgeDebrisRow(w){
 const have=s.forgeDebris||0;
 if(!have&&!WEAPON_DESTROY_RATES[w.plus])return '';
 const ready=have>=FORGE_DEBRIS_PER_GUARD;
 return '<div class="forge-debris"><span>무기 잔해 <b>'+num(have)+' / '+FORGE_DEBRIS_PER_GUARD+'</b><small>방지권 없이 파괴되면 강화 단계에 따라 쌓입니다</small></span>'+
  '<button class="'+(ready?'gold-button':'muted-button')+'" onclick="exchangeForgeDebris()" '+(ready?'':'disabled')+'>방지권 교환</button></div>';
}
function exchangeForgeDebris(){
 if((s.forgeDebris||0)<FORGE_DEBRIS_PER_GUARD)return false;
 return buyListedShopItem('debris-guard');
}
function forgeResultCopy(result,w){
 if(result.ok)return ['강화 성공 · +'+w.plus,'무기 공격력 '+num(Math.round(weaponAttack(w,result.at)))+' → '+num(Math.round(weaponAttack(w)))];
 if(result.outcome==='destroy')return ['무기가 부서져 기본 무기로 돌아갔습니다',weaponLabel()+' +0 · 각인과 숙련 유지'+(result.debris?' · 무기 잔해 +'+result.debris:'')];
 if(result.protected)return ['파괴 방지권이 무기를 지켰습니다','강화 단계 +'+w.plus+' 유지 · 방지권 1장 사용'];
 return ['강화 단계 유지 · +'+w.plus,'강화 재료 소모'];
}
function weaponAwakeningLine(job,skin){
 const name=weaponSkinName(skin,job),ending=(name.charCodeAt(name.length-1)-0xac00)%28;
 // Korean uses 로 after a vowel or final ㄹ, and 으로 after other final consonants.
 return name+(ending===0||ending===8?'로':'으로')+' 깨어났습니다';
}
function ritualContent(kind){
 const a=validRitual(kind);if(!a)return '';
 const w=currentWeapon(),forge=kind==='weaponEnhance',ready=canInscribe(w),key=a.selected,e=WEAPON_ELEMENTS[key];
 const r=a.result,active=a.phase==='working',done=a.phase==='done';
 const artScene=forge?forgeStrikeScene(a.job,active?r.skin:w.skin,a):inscriptionScene(a.job,w.skin,key,a.phase);
 const chances=forge?forgeChanceRows(r?.at??w.plus):'';
 let body;
 if(forge&&a.phase==='committing'){
  body='<div class="weapon-outcome" role="status"><strong>강화 결과를 기다리는 중…</strong></div>';
 }else if(forge&&a.phase==='warning'){
  body='<div class="forge-warning" role="group" aria-labelledby="forge-risk-message"><p id="forge-risk-message">파괴되면 +0 기본 무기로 돌아갑니다. 계속할까요?</p>'+
   '<label class="forge-warning-skip"><input id="forge-risk-skip" type="checkbox"> 이번 접속 동안 다시 묻지 않기</label>'+
   '<div class="forge-warning-actions"><button type="button" class="muted-button" onclick="cancelForgeRisk()">취소</button>'+
   '<button type="button" class="gold-button" '+transactionAttrs()+' onclick="confirmForgeRisk($(\'forge-risk-skip\').checked)">계속 강화</button></div></div>';
 }else if(forge&&a.phase==='aim'){
  body='<div class="forge-aim" style="--aim-cycle:'+FORGE_AIM_PERIOD_MS+'ms"><p>가운데에 맞춰 내려치세요.</p>'+
   '<div class="forge-aim-track" aria-hidden="true"><i class="forge-aim-good"></i><i class="forge-aim-perfect"></i><i class="forge-aim-marker"></i></div>'+
   '<button type="button" class="gold-button forge-strike-button" '+transactionAttrs()+' data-guide="enhance" onclick="settleWeaponAim()">내려치기</button></div>';
 }else if(active)body='<div class="weapon-outcome" role="status"><strong>'+(forge?'무기를 두드리는 중…':e.name+' 문양을 새기는 중…')+'</strong>'+(forge?'<span class="forge-timing-grade">'+FORGE_TIMING_LABELS[r.timing]+'</span>':'')+'</div>';
 else if(done){
  const [title,sub]=forge?forgeResultCopy(r,w):[e.name+' 속성 부여 완료',elementLine(key,r.level)+' · 숙련 '+r.rank+'단계'];
  body='<div class="weapon-outcome" role="status"><strong>'+title+'</strong>'+(r.awakened?'<span class="weapon-awakening-line">'+weaponAwakeningLine(a.job,w.skin)+'</span>':'')+(forge?'<span class="forge-timing-grade">'+FORGE_TIMING_LABELS[r.timing]+'</span>':'')+'<span>'+sub+'</span></div>'+
   '<div class="weapon-tools"><button class="muted-button" onclick="closeMenu()">닫기</button>'+
   (forge&&w.plus<WEAPON_MAX_PLUS?'<button class="gold-button" onclick="openWeaponRitual(\'weaponEnhance\')">다시 강화</button>':!forge&&ready?'<button class="gold-button" onclick="openWeaponRitual(\'weaponImbue\')">다음 속성 부여</button>':'')+'</div>';
 }else if(forge){
  const max=w.plus===WEAPON_MAX_PLUS;
  body='<div class="weapon-heading"><h3>'+weaponLabel()+' +'+w.plus+'</h3>'+(max?'<b>최고 단계</b>':'')+'</div>'+chances+
   '<p class="weapon-stat">'+weaponBonusLine(w.plus)+'</p>'+
   (w.legacyAttack?'<small class="weapon-hint">이전 강화에서 이월된 공격력 +'+num(w.legacyAttack)+'</small>':'')+
   (max?'':'<p class="weapon-stat">무기 공격력 <b>'+num(Math.round(weaponAttack(w)))+' → '+num(Math.round(weaponAttack(w,w.plus+1)))+'</b></p>'+materialRows(weaponCost(w.plus))+
   '<details class="balance-help"><summary><ui-mark data-shape=info aria-hidden=true></ui-mark> 강화 안내</summary><p>최대 +25. +14까지는 실패해도 단계가 유지됩니다. +15부터는 실패 시 파괴될 수 있으며, 파괴되면 +0 기본 무기로 돌아갑니다. 파괴 방지권을 사용하면 파괴를 막습니다.</p><p>단계당 +11부터 치명타 피해 +2%p, +21부터 방어 관통력 +1%p.</p><p>다음 단계: '+weaponBonusLine(w.plus+1)+'</p></details>')+
   (WEAPON_DESTROY_RATES[w.plus]?'<label class="forge-guard-toggle"><input type="checkbox" onchange="setForgeGuard(this.checked)" '+(s.forgeGuards>0?(s.forgeGuardOn?'checked':''):'disabled')+'>'+art(RESOURCE_ART.forgeGuards)+'<span>파괴 방지권 사용</span><small>'+(s.forgeGuards>0?'보유 '+num(s.forgeGuards)+'장':'방지권 없음 · 0장')+'</small></label>':'')+
   forgeDebrisRow(w)+
   (!max&&s.forgeManualTries>=FORGE_AUTO_UNLOCK?'<label class="forge-auto-toggle"><input type="checkbox" onchange="setForgeAuto(this.checked)" '+(s.forgeAuto?'checked':'')+'> 자동 망치질</label>':'')+
   '<button class="gold-button weapon-confirm" data-guide="enhance" onclick="attemptWeaponEnhance()" '+transactionAttrs(!canPayWeapon(w))+'>'+(max?'최고 강화 달성':canPayWeapon(w)?'+'+(w.plus+1)+' 강화하기':'강화 재료 부족')+'</button>';
 }else{
  body='<div class="weapon-heading"><h3>'+weaponLabel()+' · 숙련 '+weaponRank(w)+'단계</h3><b>'+(ready?'각인 가능':weaponGoal(w)?num(w.xp)+' / '+num(weaponGoal(w)):'각인 완료')+'</b></div>'+
   '<div class="rune-options">'+Object.entries(WEAPON_ELEMENTS).map(([k,el])=>{
    const level=w.runes[k];return '<button style="--rune:'+el.color+'" aria-pressed="'+(k===key)+'" onclick="pickWeaponRune(\''+k+'\')" '+(level===5?'disabled':'')+'><i>'+runeArt(k)+'</i><b>'+el.name+'</b><small>'+elementLine(k,Math.min(5,level+1))+'</small><span>'+level+(level===5?' / 5':' → '+(level+1))+'단계</span></button>'
   }).join('')+'</div><small class="weapon-hint">'+(ready?'확정한 각인은 되돌릴 수 없습니다. 다음 숙련 단계에서 다른 속성을 추가할 수 있습니다.':'전투·방치로 숙련을 채우면 속성을 각인할 수 있습니다.')+'</small>'+
   '<button class="gold-button weapon-confirm" onclick="inscribeWeapon()" '+(ready&&key?'':'disabled')+'>'+(ready?key?e.name+' 속성 부여':'부여할 속성 선택':'숙련 수련 중')+'</button>';
 }
 return '<section class="weapon-ritual">'+artScene+'<div class="weapon-ritual-body">'+(a.phase==='choose'?'':chances)+body+'</div></section>';
}
EXTRA_POPUPS.weaponSkins=['무기 모습',weaponSkins];EXTRA_POPUPS.weaponSupplies=['강화 재료 획득처',weaponSupplies];
const renderBeforeWeapons=render;
render=function(){
 if(!['weaponEnhance','weaponImbue'].includes(view)){
  const result=renderBeforeWeapons();
  if(s?.guidance?.status==='active')paintJourneyPanel();
  return result;
 }
 const el=$('content'),html=ritualContent(view);
 // Keep the live nodes and focus across automatic combat/HUD refreshes.
 if(el.firstElementChild?.weaponMarkup===html)return;
 const focusHandler=el.contains?.(document.activeElement)?document.activeElement.getAttribute('onclick'):null;
 $('heading').textContent=view==='weaponEnhance'?'무기 강화':'숙련 속성 부여';
 el.classList.remove('result-surface','result-settled');el.dataset.surface='interface';
 el.innerHTML=html;if(el.firstElementChild)el.firstElementChild.weaponMarkup=html;
 hydrateArt(el);setPopupInert(true);
 const ritual=validRitual('weaponEnhance');
 if(ritual?.phase==='warning')el.querySelector('.forge-warning-actions button')?.focus({preventScroll:true});
 if(ritual?.phase==='aim'){
  ritual.aimNode=el.querySelector('.forge-aim');
  ritual.aimNode?.style.setProperty('--aim-offset',-(performance.now()-ritual.aimStartedAt)+'ms');
 }
 if(ritual?.phase==='working')forgeImpactParticles(el.querySelector('.forge-emission'),ritual);
 if(s?.guidance?.status==='active')paintJourneyPanel();
 if(focusHandler){const button=[...el.querySelectorAll('button:not(:disabled)')].find(b=>b.getAttribute('onclick')===focusHandler);button?.focus({preventScroll:true})}
};

function legacyWeaponDetail(g){
 return '<header class="gear-detail-hero"><div class="gear-detail-picture">'+gearArt(g)+'</div><div><h3>'+equipmentTitle(g)+'</h3><p>이전에 보관한 무기 · '+RAR[g.r]+'</p></div></header>'+
 '<p class="small">전용 무기 전환 후에도 보관·분해할 수 있습니다.</p>'+
 '<div class="weapon-tools">'+button(g.locked?'잠금 해제':'잠금',"toggleGearLock('"+g.id+"')",false,true)+
 button('분해'+(salvageIron(g)?' · 별철 +'+salvageIron(g):''),"salvage('"+g.id+"');closeMenu()",g.locked)+'</div>';
}
for(const row of GROWTH_PASS_REWARDS)if(row.id===10||row.id%30===0)row.reward.starIron=10+Math.floor(row.id/30)*5;
for(const [i,n] of [[0,20],[4,30],[9,40],[14,50],[19,60]]){
 SEASON_PASS_REWARDS[i].reward.starIron=n;PREMIUM_PASS_REWARDS[i].reward.starIron=2*n;
}
PREMIUM_PASS_REWARDS[9].reward.forgeGuards=1;
SEASON_PASS_REWARDS[19].reward.forgeGuards=1;
PREMIUM_PASS_REWARDS[19].reward.forgeGuards=2;
for(const [i,n] of [[0,10],[1,15],[4,20]])NEWBIE_MISSIONS[i][3].starIron=n;
GAME_NOTICES.unshift({id:'signature-weapons-1',date:'2026.11.13',tag:'무기 성장',title:'직업 전용 무기와 별철',body:'모루의 무기 성장에서 전용 무기를 벼리세요. 첫 지급 별철은 12개입니다. 전투와 방치로 쌓은 숙련으로 속성을 새깁니다. 이전 무기 중 공격력이 가장 높은 한 자루의 성능을 각 직업의 시작 무기에 계승했습니다. 나머지 무기는 가방에 보관됩니다. 장비 세트의 완성 조건은 무기를 제외한 여섯 부위입니다.'});
