/* Presentation only: original damage, cooldowns, rewards, saves and boss deadlines remain authoritative. */
'use strict';
const warriorMotion=(()=>{
 const pools={numbers:[]};
 const stats={attacks:0,effectUses:0,numberUses:0,allocated:0,geometryReads:0,assetRequests:0};
 let geometry=null,geometryCache=new Map(),actor=null,poses=[],motions=[],recoils=new Map(),sequence=0,numberLane=0,numberStack=0,numberAt=0;
 let heroStride=null;
 const heldAnimations=new Map();
 const decoded=new Map();
 const onBattlefield=()=>!!s?.classId&&activeScreen==='home'&&!view&&!document.hidden;
 const visible=()=>onBattlefield()&&motionAllowed();
 const capable=()=>typeof $('heroActor')?.animate==='function';
 const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
 function release(slot){slot.version++;clearTimeout(slot.timer);slot.animations.forEach(a=>a.cancel());slot.animations=[];slot.busy=false;slot.node.hidden=true;}
 function acquire(type,limit,host,create){
  const pool=pools[type];let slot=pool.find(x=>!x.busy);
  if(!slot&&pool.length<limit){const node=create();slot={node,busy:false,version:0,animations:[],used:0};pool.push(slot);stats.allocated++;}
  if(!slot)slot=pool.reduce((a,b)=>a.used<b.used?a:b);
  release(slot);slot.busy=true;slot.used=++sequence;slot.node.hidden=false;
  if(slot.node.parentNode!==host)host.appendChild(slot.node);
  return slot;
 }
 function play(slot,node,frames,options,last=false){
  const version=slot.version,a=node.animate(frames,options);slot.animations.push(a);
  if(last)a.onfinish=()=>{if(slot.version===version)release(slot)};
  return a;
 }
 function measure(){
  const target=typeof combatTargetNode==='function'?combatTargetNode():$('mobActor');if(geometry?.target===target)return geometry;if(geometryCache.has(target))return geometry=geometryCache.get(target);
  const battle=$('battle').getBoundingClientRect(),hero=$('heroActor').getBoundingClientRect(),enemy=target.getBoundingClientRect();
  stats.geometryReads+=3;
  const {x,y}=rangedCombat.hitPoint(target,false,{actor:enemy,battle});
  geometry={target,sourceX:hero.left-battle.left+hero.width*.65,sourceY:hero.top-battle.top+hero.height*.38,width:battle.width,height:battle.height,heroSize:hero.width,
   x:clamp(x,0,battle.width),y:clamp(y,0,battle.height),
   enemySize:enemy.width,heroLeft:hero.left-battle.left,heroTop:hero.top-battle.top,
   floor:rangedCombat.hitPoint(target,true,{actor:enemy,battle})};
  geometryCache.set(target,geometry);return geometry;
 }
 function cancelMotion(animation){
  clearTimeout(heldAnimations.get(animation)?.timer);heldAnimations.delete(animation);animation.cancel();
 }
 function resume(animation){
  const hold=heldAnimations.get(animation);if(!hold)return;
  clearTimeout(hold.timer);heldAnimations.delete(animation);
  if(animation.playState==='paused')animation.play();
 }
 function holdActor(ms,target){
  if(!visible()||ms<=0)return;
  const now=performance.now(),until=now+ms;
  if(heroStride&&until>heroStride.heldUntil){
   heroStride.start+=until-Math.max(now,heroStride.heldUntil);
   heroStride.heldUntil=until;
  }
  const recoil=recoils.get(target);
  for(const animation of recoil?[...motions,recoil]:motions){
   if(!animation.pause||animation.playState==='idle'||animation.playState==='finished')continue;
   const hold=heldAnimations.get(animation);
   if(hold&&hold.until>=until)continue;
   if(hold)clearTimeout(hold.timer);else animation.pause();
   heldAnimations.set(animation,{until,timer:setTimeout(()=>resume(animation),ms)});
  }
 }
 function clearHolds(){
  if(heroStride){
   heroStride.start-=Math.max(0,heroStride.heldUntil-performance.now());heroStride.heldUntil=0;
  }
  for(const animation of heldAnimations.keys())resume(animation);
 }
 function clearActor(){
  heroStride=null;motions.forEach(cancelMotion);motions=[];
  if(actor){actor.classList.remove('smooth-warrior');actor.dataset.motion='idle';actor.style.setProperty('--frame-x','0%');poses.forEach(p=>p.hidden=true);}
 }
 function stop(){
  combatEffects.clear($('classFx'));clearActor();recoils.forEach(cancelMotion);recoils.clear();
  Object.values(pools).forEach(pool=>pool.forEach(release));geometry=null;geometryCache.clear();
 }
 function preload(url){
  if(decoded.has(url)||typeof Image==='undefined')return;
  const img=new Image();decoded.set(url,img);stats.assetRequests++;img.decoding='async';img.src=url;
  if(img.decode)img.decode().catch(()=>{});
  // Keep only a few selected outfits decoded; CSS/browser cache owns the rest.
  if(decoded.size>4)decoded.delete(decoded.keys().next().value);
 }
 function outfit(){const key=s?.classId+'-'+outfitRigRank();if(s?.effects&&!s.powerSaving)for(const id of s.slots||[])combatEffects.load(id);if(MATURE_ART[key])preload(matureArtURL(key,true));geometry=null;}
 function keyPoses(hits){
  const points=[[0,0],[45,0],[80,1],[190,1]];
  for(let j=0;j<hits;j++){const t=270+j*70;points.push([t-35,j?3:1],[t-15,2],[t+12,2],[t+25,3]);}
  const release=270+(hits-1)*70;points.push([release+65,3],[Math.min(635,release+165),0],[650,0]);return points;
 }
 // Sample the same keyframes as the compositor, without a layout read at collision.
 function advance(now){
  if(!heroStride)return 0;
  const {stride,start,heldUntil,clock}=heroStride,t=clock.pose(Math.max(now,heldUntil)-start);
  if(t<=0||t>=650)return 0;
  return Math.max(0,skinMotion.strideAt(stride,t)[0]);
 }
 function attack(effect,token,factor,k=-1){
  if(!visible()||!capable())return false;
  const now=performance.now();
  const hits=typeof motionHitCount==='number'?motionHitCount:effect==='cross'?3:effect==='storm'?5:1;
  const melee=skillMeta(k).target!=='self'&&!['mage','archer'].includes(s.classId)&&!rangedCombat.heroStyle(s.classId,k);
  const admitted=actorMotion.attack(token,factor,hits,k);
  if(melee)rangedCombat.swingTrail(s.classId,k,token,factor,hits);
  const elapsed=heroStride?Math.max(now,heroStride.heldUntil)-heroStride.start:0;
  if(admitted===false||admitted===undefined&&heroStride&&elapsed<heroStride.duration*.7)return true;
  const holdRemaining=heroStride?Math.max(0,heroStride.heldUntil-now):0;
  clearActor();geometry=null;geometryCache.clear();const g=measure(),h=$('heroActor');actor=h;
  const useLegacyPoses=!h.classList.contains('has-actor-motion');
  if(useLegacyPoses&&(!poses.length||poses[0].parentNode!==h)){
   poses=Array.from({length:4},(_,i)=>{const p=document.createElement('span');p.className='warrior-motion-pose';p.setAttribute('aria-hidden','true');p.style.setProperty('--pose-x',(i*100/3)+'%');h.appendChild(p);return p});
  }
  h.dataset.motion='warrior';h.classList.add('smooth-warrior');poses.forEach(p=>p.hidden=!useLegacyPoses);
  combatEffects.load(k,s.classId);
  const tip=melee?skinMotion.contactTip(s.classId+'-'+outfitRigRank(),k,hits):[.5,.5];
  const dx=melee?clamp(g.x-g.heroLeft-g.heroSize*tip[0],0,g.width*.68):g.heroSize*.045;
  const dy=melee?clamp(g.y-g.heroTop-g.heroSize*tip[1],-g.heroSize*.28,g.heroSize*.09):0;
  const stride=skinMotion.attackStride(s.classId,g.heroSize,effect==='shield'?dx/.67:dx,melee,hits,effect,k);
  if(dx&&dy)for(const frame of stride)frame[3]+=dy*clamp(frame[1]/dx,0,1);
  const options={duration:650*factor,fill:'both'};
  const clock=skillMotion.clock(s.classId,k,factor),offset=t=>clock.elapsed(t)/options.duration;
  const swing=heroStride={stride,start:now,heldUntil:0,duration:options.duration,clock};
  const movement=h.animate(stride.map(([t,x,r,y=0])=>({offset:offset(t),transform:`translate3d(${x}px,${y}px,0) rotate(${r}deg)`,easing:'linear'})),options);motions.push(movement);
  const health=$('heroHealth');if(health?.animate)motions.push(health.animate(stride.map(([t,x])=>({offset:offset(t),transform:`translateX(calc(-50% + ${x}px))`,easing:'linear'})),options));
  const points=keyPoses(hits);
  if(useLegacyPoses)poses.forEach((p,i)=>motions.push(p.animate(points.map(([t,pose])=>({offset:offset(t),opacity:pose===i?1:0})),options)));
  movement.onfinish=()=>{if(heroStride===swing)clearActor()};
  if(holdRemaining)holdActor(holdRemaining);
  stats.attacks++;return true;
 }
 function impact(effect,big,skillId,echo,factor,finishing=false,ordinal=0,secondary=false){
  if(!combatEffects.enabled()||activeScreen!=='home'||view||skillId<0&&!visible())return;
  const self=skillId>=0&&skillMeta(skillId).target==='self';
  const g=measure(),host=$('classFx');if(!host)return;
  const job=s.classId,arrow=job==='archer'&&skillId<0,feet=combatEffects.ground(skillId);
  const size=skillId<0?clamp(g.heroSize*(arrow?.19:job==='shadow'?.22:.28),19,43):combatEffects.extent(skillId,g.width,secondary);
  const follow=self?$('heroActor'):g.target;
  const {x,y}=self?combatEffects.casterPoint(follow):feet?rangedCombat.hitPoint(follow,true):g;
  combatEffects.emit(host,{id:skillId,job,echo,ordinal,secondary,x,y,size,follow,feet,self,group:combatSerial,anchor:follow,
   duration:secondary?PIERCE_RIPPLE_FILM[2]:combatEffects.duration(skillId,job,echo,factor),heading:(skillId===18?rangedCombat.piercingHeading(combatSerial,ordinal):null)??Math.atan2(y-g.sourceY,x-g.sourceX)});
  stats.effectUses++;
 }
 function number(d,crit){
  if(!onBattlefield())return false;
  const g=measure(),slot=acquire('numbers',12,$('fx'),()=>document.createElement('div')),lane=numberLane++%3-1;
  // Rapid hits climb in a short staircase instead of landing on top of each other.
  const stamp=performance.now();numberStack=stamp-numberAt<340?(numberStack+1)%4:0;numberAt=stamp;
  const node=slot.node;node.className='hit combat-number'+(crit?' critical':'');node.textContent='−'+compact(d);
  const area=isDuoBattle(),margin=Math.min(g.width*.13,12+node.textContent.length*(crit?4.6:3.9));
  if(area)node.className+=' lane-number';
  node.style.left=clamp(g.x+lane*g.heroSize*(area?.025:.16),margin,g.width-margin)+'px';node.style.top=(g.y-g.heroSize*.30-Math.abs(lane)*6-numberStack*(area?14:crit?32:22))+'px';
  const duration=crit?870:680;
  stats.numberUses++;
  if(!motionAllowed()||!node.animate){
   node.style.transform='translate(-50%,-5px)';
   slot.timer=setTimeout(()=>release(slot),duration);return true;
  }
  node.style.transform='';
  const drift=lane*(area?4:crit?13:8);
  const pop=crit?1.45:1.12;
  if(crit)play(slot,node,[{color:'#fff'},{color:'#fff'}],{duration:80});
  play(slot,node,[{offset:0,transform:'translate(-50%,5px) scale(.72)',opacity:0},{offset:.14,transform:`translate(-50%,-5px) scale(${pop})`,opacity:1},{offset:.58,transform:`translate(calc(-50% + ${drift*.6}px),-26px) scale(1)`,opacity:1},{offset:1,transform:`translate(calc(-50% + ${drift}px),-48px) scale(.94)`,opacity:0}],{duration,fill:'both',easing:'ease-out'},true);
  return true;
 }
 function hitReaction(big,echo,factor){
  const mob=typeof combatTargetNode==='function'?combatTargetNode():$('mobActor');if(!visible()||!mob?.animate)return;
  if(actorMotion.targetMoving(mob)){geometry=null;geometryCache.delete(mob)}
  if(actorMotion.hurt(mob,factor,big&&!echo?188:echo?72:115))return;
  if(recoils.has(mob))cancelMotion(recoils.get(mob));
  const shift=big&&!echo?7:3;
  const reaction=mob.animate([{transform:'translate3d(0,0,0)',offset:0},{transform:`translate3d(${shift}px,-1px,0) rotate(1deg)`,offset:.23},{transform:'translate3d(0,0,0)',offset:1}],{duration:220*factor,easing:'ease-out'});recoils.set(mob,reaction);
 }
 function init(){
  const resize=new ResizeObserver(()=>{geometry=null;geometryCache.clear()});resize.observe($('battle'));
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stop()});
  window.matchMedia?.('(prefers-reduced-motion: reduce)').addEventListener?.('change',stop);
  outfit();
 }
 return {visible,capable,advance,attackStride:skinMotion.attackStride,attack,impact,number,hitReaction,holdActor,clearHolds,stop,outfit,init,preload,invalidate(){geometry=null;geometryCache.clear()},stats(){
  const contacts=combatEffects.counts($('classFx'));
  return {...stats,allocated:stats.allocated+contacts.total,effectNodes:contacts.total,numberNodes:pools.numbers.length,
   sparkNodes:0,activeNodes:contacts.playing+pools.numbers.filter(n=>n.busy).length};
 }};
})();

const animateBeforeSmoothWarrior=animateClassAttack;
animateClassAttack=function(effect,token,factor=1,k=-1){
 if(s.classId&&warriorMotion.capable()){
  warriorMotion.attack(effect,token,factor,k);
  return;
 }
 return animateBeforeSmoothWarrior(effect,token,factor);
};
const fxBeforeSmoothWarrior=spawnClassFx;
spawnClassFx=function(effect,big=false,phase='impact',skillId=-1,echo=false,factor=1,finishing=false,ordinal=0,secondary=false){
 if(s.classId&&(skillId>=0||warriorMotion.capable())){
  if(phase==='impact')warriorMotion.impact(effect,big,skillId,echo,factor,finishing,ordinal,secondary);
  return;
 }
 if(skillId<0&&s.classId==='archer')return;
 return fxBeforeSmoothWarrior(effect,big,phase,skillId,echo,factor);
};
const numberBeforeSmoothWarrior=damageText;
damageText=function(d,crit=false,index=0){
 if(s.classId&&(activeScreen!=='home'||view||document.hidden))return;
 if(warriorMotion.number(d,crit))return;
 return numberBeforeSmoothWarrior(d,crit,index);
};
const impactBeforeSmoothWarrior=combatImpact;
combatImpact=function(d,crit,e,token,effect,big,skillId=-1,echo=false,factor=1){
 if(!s.classId||!warriorMotion.capable())return impactBeforeSmoothWarrior(d,crit,e,token,effect,big,skillId,echo,factor);
 if(token!==combatSerial||!sameEncounter(e))return false;
 if(stageBossActive()&&!stageBossTick())return false;
 warriorMotion.hitReaction(big,echo,factor);spawnClassFx(effect,big,'impact',skillId,echo,factor);
 playSound('impact',{effect,big,crit,echo,skillId});applyDamage(d,crit);paintBattle();return true;
};
const cancelBeforeSmoothWarrior=cancelCombatAnimation;
cancelCombatAnimation=function(){warriorMotion.stop();return cancelBeforeSmoothWarrior()};
const navigateBeforeSmoothWarrior=navigate,menuBeforeSmoothWarrior=openMenu,preferencesBeforeSmoothWarrior=applyPreferences;
navigate=function(...args){warriorMotion.stop();return navigateBeforeSmoothWarrior(...args)};
openMenu=function(...args){warriorMotion.stop();return menuBeforeSmoothWarrior(...args)};
applyPreferences=function(...args){warriorMotion.stop();return preferencesBeforeSmoothWarrior(...args)};
const costumeBeforeSmoothWarrior=paintHeroCostume;
let motionCostumeKey='';
paintHeroCostume=function(){
 if(!s)return;
 const key=[s.classId,s.wear,wornEventId()].join(':');
 if(key===motionCostumeKey){
  // The legacy HUD paint still assigns its old hue rotation before calling us.
  const hero=$('heroActor');if(hero.style.filter.includes('hue-rotate'))hero.style.filter='drop-shadow(0 7px 5px #1119)';
  return;
 }
 motionCostumeKey=key;warriorMotion.stop();costumeBeforeSmoothWarrior();warriorMotion.outfit();
};
const warmBeforeSmoothWarrior=warmClassArt;
warmClassArt=function(id){
 if(classIndex(id)<0)return;
 // The old multi-outfit atlas is no longer used by the current warrior artwork.
 for(const key of ['icons-'+id,'vfx-'+id]){
  const value=getComputedStyle(document.documentElement).getPropertyValue('--'+key).trim(),match=/^url\(["']?(.*?)["']?\)$/.exec(value);
  if(match)warriorMotion.preload(match[1]);
 }
};
const initBeforeSmoothWarrior=initClassesCombat;
initClassesCombat=function(){initBeforeSmoothWarrior();warriorMotion.init()};
