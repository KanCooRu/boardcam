'use strict';
const partyRaid=(()=>{
 const bossName='월식의 파수꾼',duration=60000;
 const roles={
  warrior:{power:1,interval:1470},shadow:{power:.78,interval:1120},paladin:{power:.83,interval:1720},
  mage:{power:1.32,interval:2070},archer:{power:.96,interval:1510}
 };
 const posts=[
  {x:.34,y:.70,scale:.246},{x:.34,y:.885,scale:.253},{x:.23,y:.565,scale:.217},
  {x:.116,y:.705,scale:.222},{x:.12,y:.89,scale:.243}
 ];
 const moves=[
  {name:'초승도끼 휩쓸기',cue:'전열 이탈',fx:'sweep',wind:1900,damage:29},
  {name:'빙창 낙하',cue:'표식에서 이탈',fx:'ice',wind:2100,damage:33},
  {name:'월식 개문',cue:'공격 스킬 적중 시 차단',fx:'eclipse',wind:2400,damage:36}
 ];
 const images=new Map(),cap=(x,lo=0,hi=1)=>Math.max(lo,Math.min(hi,x));
 let run=null,dialog=null,canvas=null,raf=0,lastHud=0,frameTime=0,leaving=false,recruitTimer=0,controller=null;
 function progress(){
  let p=s.partyRaid;if(!p||typeof p!=='object')p=s.partyRaid={};
  if(!Number.isSafeInteger(p.clears))p.clears=Math.floor(bounded(p.tier||0,0,Number.MAX_SAFE_INTEGER));
  if(!Number.isFinite(p.best))p.best=0;delete p.tier;return p;
 }
 function payout(){return {raidCoins:30,gold:800,stones:15}}
 function rewardLine(r){return '<div class="party-loot">'+[[havenCoin('raid'),'레이드 코인',r.raidCoins],[art('coin'),'골드',r.gold],[art('stone'),'강화석',r.stones]].map(([icon,name,n])=>'<span aria-label="'+name+' '+num(n)+'" title="'+name+'">'+icon+num(n)+'</span>').join('')+'</div>'}
 function lobby(){
  return '<section class="party-lobby"><div class="party-cover"><div class="party-cover-monster"></div><header><small>월식의 천문대</small><h2>'+bossName+'</h2><span>60초 · 무한 체력</span></header><button class="party-info" aria-label="레이드 안내" onclick="openMenu(\'partyRaidHelp\')"><ui-mark data-shape=bang aria-hidden=true></ui-mark></button></div>'+
   '<div class="party-heading"><b>완료 보상</b>'+rewardLine(payout())+'</div>'+
   button('레이드 입장','partyRaid.start()',!s.classId||!!dungeonRun)+'</section>';
 }
 function imageFor(key,path){if(!images.has(key)){const img=new Image();img.decoding='async';img.src=path;images.set(key,img)}return images.get(key)}
 function partyMembers(peers){
  const records=[{...raidRecords.snapshot(),name:s.nickname},...peers],taken=new Set();
  return records.map((p,i)=>{
   const order=['mage','archer'].includes(p.job)?[3,4,2,1,0]:p.job==='warrior'?[0,1,2,4,3]:p.job==='shadow'?[1,0,2,4,3]:[2,0,1,4,3];
   const post=order.find(n=>!taken.has(n));taken.add(post);
   const formation=posts[post],backline=['mage','archer'].includes(p.job);
   return {...p,...roles[p.job],...formation,x:formation.x-(backline&&post<3?.055:0),post,self:i===0,key:p.job+'-'+p.outfit,hp:100,at:-10000,next:450+i*245,hit:0,
    hurt:-10000,downUntil:0,evadeAt:-10000,evadeDir:0,volley:0};
  });
 }
 function make(peers=[]){
  const occupied=new Set();
  const skills=Array.from({length:4},(_,i)=>{
   const id=s.slots[i];
   if(!slotOpen(i)||!Number.isInteger(id)||id<0||!SKILL_RULES[id]||!skillUnlocked(id)||occupied.has(id))return null;
   occupied.add(id);
   return {id,cd:SKILL_RULES[id].cd*1000,ready:0,casts:0};
  });
  return {owner:s,fighter:onlineFighter(),time:0,damage:0,poseClock:createActorMotionClock(),members:partyMembers(peers),index:0,struckAt:-Infinity,strikeWeight:0,nextBoss:6200,healAt:5600,
   guardReady:0,nextSkill:850,skills,until:{},dots:{},exposedUntil:0,targets:[],marks:[],
   fx:[],pending:[],impact:-9000,move:0,warning:'',result:null,settled:false,phase:'battle',report:'공격 개시'};
 }
 function effect(r,kind,from,to,life=590){if(r.fx.length>=36)r.fx.shift();r.fx.push({kind,from,to,life,at:r.time})}
 function position(r,m,swing=m,now=r.time){
  const dt=r.time-m.evadeAt;
  let offset=0;if(dt>=0&&dt<2900)offset=dt<300?Math.sin(dt/300*Math.PI*.5):dt<2050?1:(1-(dt-2050)/850)**2;
  const age=now-swing.at,reach=swing.advance||0;
  const smooth=t=>{const p=cap(t);return p*p*(3-2*p)};
  const forward=age<285?smooth(age/285):age<360?1:1-smooth((age-360)/300);
  return [m.x+reach*forward-Math.min(.05,Math.max(0,m.x-.102))*offset,m.y+.069*m.evadeDir*offset];
 }
 const bossPoint=[.79,.596],bossFoot=[.73,.812];
 function attack(r,m,id=-1,allySkill=false){
  const rule=id>=0?SKILL_RULES[id]:null,meta=skillMeta(id),selfCast=meta.target==='self';
  const ground=rule?.effect==='quake',shot=!selfCast&&rangedCombat.heroStyle(m.job,id);
  // Original combat cadence is independent of the optical route of sigils and sky strikes.
  const thrown=m.job==='mage'||m.job==='archer'||[24,44,47,48,51].includes(id);
  const hitDelay=ground?400:thrown&&!selfCast?460:285;
  if(run===r&&!r.catchingUp&&motionAllowed())combatEffects.load(id,m.job);
  if(m.self)r.petCast=selfCast?null:{start:r.time,impact:hitDelay,owner:s.activePet};
  m.at=r.time;m.skillId=id;m.casting=!!(shot||ground||selfCast);m.hits=rule?.hits||1;
  m.advance=m.casting?0:Math.max(0,[.585,.59,.55,.555,.565][m.post]-m.x);
  if(m.self){
   const at=r.poseClock.now(r.time);
   if(!m.renderSwing||at-m.renderSwing.at>=455)m.renderSwing={at,casting:m.casting,hits:m.hits,skillId:id,advance:m.advance};
  }
  const ratio=m.self?1:cap(m.level/Math.max(1,r.members[0].level),.82,1.18);
  const base=rule?skillDamage(id)*meta.factor:r.fighter.attack*(allySkill?2.3:1);
  const critical=m.self&&!selfCast&&Math.random()<r.fighter.crit;
  const total=Math.max(1,Math.round(base*m.power*ratio*(critical?r.fighter.critDamage:1)));
  const sound=run===r&&!r.catchingUp&&!document.hidden&&m.self;
  if(sound)playSound('swing',{classId:m.job,skillId:id,hitCount:m.hits});
  for(let n=0;n<m.hits;n++){
   const amount=Math.round(total*(n+1)/m.hits)-Math.round(total*n/m.hits);
   r.pending.push({at:r.time+hitDelay+n*70,start:r.time,m,amount,id,skill:!!rule||allySkill,
    ranged:shot,ground,selfCast,critical,ordinal:n});
  }
 }
 function autoCast(r,m){
  if(r.time<r.nextSkill||!m.hp)return false;
  const slot=r.skills.find(sk=>{
   if(!sk||r.time<sk.ready)return false;
   const {target,status}=skillMeta(sk.id);
   if(status==='heal'&&target!=='all'&&m.hp>75)return false;
   return !(['boost','guard'].includes(status)&&r.until[status]>r.time);
  });
  if(!slot)return false;
  slot.casts++;slot.ready=r.time+slot.cd;r.nextSkill=r.time+750;
  attack(r,m,slot.id);m.next=Math.max(m.next,r.time+660);
  r.report=SK[slot.id][0];return true;
 }
 function applyStatus(r,hit){
  const {id,m}=hit,{status,target}=skillMeta(id);
  if(['break','boost','guard','weaken'].includes(status))r.until[status]=r.time+(status==='weaken'||id===9?4000:6000);
  if(status==='heal'){m.hp=Math.min(100,m.hp+({22:18,28:12,31:25}[id]||15));effect(r,'heal',position(r,m),position(r,m),650)}
  if(status==='stun'&&!r.warning)r.nextBoss=Math.max(r.nextBoss,r.time+1400);
  if(status==='poison'||status==='burn')r.dots[status]={m,next:r.time+1000,left:4,amount:r.fighter.attack*skillDotRatio(id,s.skills[id]||1)};
 }
 function beginCast(r){
  r.move=r.index%3;
  if(run===r&&!r.catchingUp)enemySound.play(['blade','frost','rift'][r.move],'release',true);
  const living=r.members.filter(m=>m.hp>0);
  if(r.move===0){
   r.targets=living.filter(m=>m.x>=.25);
   if(!r.targets.length&&living.length)r.targets=[living.reduce((a,b)=>a.x>b.x?a:b)];
  }else if(r.move===1){
   const ordered=[...living].sort((a,b)=>b.hit-a.hit);
   r.targets=ordered.filter((m,i)=>(i+Math.floor(r.index/3))%2===0);
   if(!r.targets.length&&ordered.length)r.targets=[ordered[0]];
  }else r.targets=living;
  r.marks=r.targets.map(m=>position(r,m));r.warning=moves[r.move].name;
  r.poseWindUntil=r.poseClock.now(r.time)+r.nextBoss-r.time;
 }
 function endCast(r,interrupted){
  const move=moves[r.move];
  r.interruptPose=interrupted?windPose(cap(1-(r.nextBoss-r.time)/move.wind)):null;
  r.impact=r.time;r.poseImpact=r.poseClock.now(r.time);r.lastMove=r.move;
  if(interrupted){r.exposedUntil=r.time+4600;r.report='차단 성공 · 4초간 피해 증가';effect(r,'break',bossPoint,bossPoint,860)}
  else{
   let dodged=0;
   r.targets.forEach((m,i)=>{
    const target=r.marks[i],point=position(r,m),avoided=r.move!==2&&Math.hypot(point[0]-target[0],point[1]-target[1])>.055;
    effect(r,move.fx,bossPoint,target,800);
    if(avoided){dodged++;return}
    m.hp=Math.max(0,m.hp-move.damage*(m.self?1-armorMitigation(r.fighter.armor):1)*(r.until.weaken>r.time?.65:1)*(m.self&&r.until.guard>r.time?.55:1));m.hurt=r.time;if(!m.hp)m.downUntil=r.time+4700;
   });
   r.report=dodged?'회피 성공 · 반격':move.name;
   if(run===r&&!r.catchingUp&&!document.hidden)enemySound.play(['blade','frost','rift'][r.move],'impact',true);
  }
  r.index++;r.warning='';r.nextBoss=r.time+6500;
 }
 function classImpact(r,hit){
  if(run!==r||!combatEffects.enabled()||!dialog||r.catchingUp)return false;
  const host=dialog.querySelector('.party-field');if(!host)return false;
  const job=hit.m.job,id=hit.id<0&&hit.skill?classSkillIds(job)[0]:hit.id;
  const feet=combatEffects.ground(id),at=hit.selfCast?position(r,hit.m):feet?bossFoot:bossPoint;
  const x=host.clientWidth*at[0],y=host.clientHeight*(at[1]-(hit.selfCast?.09:0));
  const size=id<0?(job==='archer'?24:host.clientWidth*.13):combatEffects.extent(id,host.clientWidth)*(hit.m.self?1:.78);
  const heading=id===18&&hit.origin?Math.atan2(y-host.clientHeight*hit.origin.y,x-host.clientWidth*hit.origin.x):0;
  combatEffects.emit(host,{id,job,x,y,size,heading,anchor:hit.m,group:hit.start,player:!!hit.m.self,ordinal:hit.ordinal,echo:!!hit.ordinal,hard:true,duration:combatEffects.duration(id,job,!!hit.ordinal)});
  return true;
 }
 function resolveHits(r){
  const waiting=[];
  for(const hit of r.pending){
   if(hit.at>r.time){waiting.push(hit);continue}
   if(hit.origin&&archerFlight.tailMs(hit.id)&&run===r&&!r.catchingUp){
    const tail=archerFlight.tailMs(hit.id);
    r.fx.push({kind:'through-arrow',id:hit.id,from:[hit.origin.x,hit.origin.y],to:bossPoint,life:tail,at:hit.at});
   }
   if(hit.id>=0&&!hit.ordinal)applyStatus(r,hit);
   if(!hit.selfCast){
    if(hit.id>=0&&r.warning&&r.move===2)endCast(r,true);
    const armor=r.time<r.until.break?1.25:penetrationMultiplier(.18,r.fighter.penetration);
    const amount=Math.round(hit.amount*armor*(hit.m.self&&r.until.boost>r.time?1.5:1)*(r.time<r.exposedUntil?1.65:1));
    hit.m.hit+=amount;r.damage+=amount;
    const poseNow=r.poseClock.now(r.time),weight=hit.skill ? .95 : hit.m.self ? .62 : .33;
    r.strikeWeight=Math.max(r.struckAt===poseNow?r.strikeWeight:0,weight);
    r.struckAt=poseNow;
    if(hit.m.self&&r===run&&!r.catchingUp&&!document.hidden&&motionAllowed()){
     const strong=hit.critical||hit.skill;
     raidContactGlint(dialog.querySelector('.party-field'),bossPoint[0]*100+'%',bossPoint[1]*100+'%',strong);
     if(typeof battlePresentation!=='undefined')battlePresentation.damageNumber(dialog.querySelector('.party-field'),amount,!!hit.critical,
      {left:bossPoint[0]*100+'%',top:(bossPoint[1]-.08)*100+'%',drift:(r.index*7+hit.ordinal*5)%19-9,className:'raid-number'});
     if(strong)r.poseClock.hold(60,r.time);
    }
   }
   if(!classImpact(r,hit)&&!hit.selfCast)effect(r,hit.ground?'fault':hit.skill?'lances':hit.ranged?'embers':'dust',position(r,hit.m),hit.ground?bossFoot:bossPoint,hit.skill?550:370);
   if(hit.m.self&&run===r&&!r.catchingUp&&!document.hidden)playSound('impact',{classId:hit.m.job,skillId:hit.id,surface:'steel',ordinal:hit.ordinal,echo:hit.ordinal>0});
  }
  r.pending=waiting;
 }
 function step(r,dt){
  if(r.result)return;r.time=Math.min(duration,r.time+dt);resolveHits(r);
  if(r.time>=duration){r.result='done';return}
  for(const m of r.members)if(!m.hp&&r.time>=m.downUntil){m.hp=64;m.next=r.time+800;effect(r,'heal',bossPoint,position(r,m),620)}
  if(!r.warning&&r.time>=r.nextBoss-moves[r.index%3].wind)beginCast(r);
  if(r.warning&&r.time>=r.nextBoss)endCast(r,false);
  if(r.time>=r.healAt){
   const healer=r.members.find(m=>m.job==='paladin'&&m.hp>0),hurt=r.members.filter(m=>m.hp>0&&m.hp<95).sort((a,b)=>a.hp-b.hp)[0];
   if(healer&&hurt){hurt.hp=Math.min(100,hurt.hp+18);effect(r,'heal',position(r,healer),position(r,hurt),620)}
   r.healAt=r.time+5900;
  }
  for(const dot of Object.values(r.dots))if(dot.left&&r.time>=dot.next){
   const damage=Math.round(dot.amount*(r.exposedUntil>r.time?1.65:1));dot.m.hit+=damage;r.damage+=damage;dot.left--;dot.next+=1000;
  }
  autoCast(r,r.members[0]);
  for(const m of r.members)if(m.hp>0&&r.time>=m.next){m.volley++;attack(r,m,-1,!m.self&&m.volley%4===0);m.next=r.time+m.interval/cap(r.fighter.speed,.75,2.5)}
  r.fx=r.fx.filter(f=>r.time-f.at<f.life);
 }
 function settle(r){
  if(r.owner!==s||r.result!=='done'||r.settled)return null;
  const p=progress(),reward=payout();r.settled=true;p.clears++;p.best=Math.max(p.best,r.damage);
  onlineState().raidCoins+=reward.raidCoins;grant({gold:reward.gold,stones:reward.stones});save();return reward;
 }
 function command(mode){
  if(!run||run.phase!=='battle'||!dialog||leaving||run.result||document.hidden||Date.now()>=run.deadline)return false;
  const r=run,hero=r.members[0];if(!hero.hp)return false;
  if(mode==='guard'){
   if(r.time<r.guardReady)return false;r.guardReady=r.time+4700;
   for(const m of r.members.filter(m=>m.hp)){m.evadeAt=r.time;m.evadeDir=r.index%2 ? 1 : -1}
   r.report='진형 이탈';
  }else return false;hud();return true;
 }

 const imageReady=im=>!!im?.naturalWidth;
 function sprite(ctx,img,x,y,w,h){if(imageReady(img))ctx.drawImage(img,x,y,w,h)}
 const smoothMotion=t=>{const p=cap(t);return p*p*(3-2*p)};
 function windPose(wind){
  return wind<.75?smoothMotion(wind/.75):1+smoothMotion((wind-.75)/.25);
 }
 function draw(){
  if(!canvas||!run)return;
  const ctx=canvas.getContext('2d'),w=canvas.clientWidth,h=canvas.clientHeight;if(!ctx||!w||!h)return;
  const d=Math.min(2,window.devicePixelRatio||1);
  if(canvas.width!==Math.round(w*d)||canvas.height!==Math.round(h*d)){canvas.width=Math.round(w*d);canvas.height=Math.round(h*d);ctx.imageSmoothingQuality='high'}
  ctx.setTransform(d,0,0,d,0,0);ctx.clearRect(0,0,w,h);
  const r=run,animate=motionAllowed(),wind=r.warning?cap(1-(r.nextBoss-r.time)/moves[r.move].wind):0;
  function ground(x,y,rx){ctx.save();ctx.translate(x,y);ctx.scale(rx,rx*.22);const g=ctx.createRadialGradient(0,0,0,0,0,1);g.addColorStop(0,'#08060eca');g.addColorStop(1,'#08060e00');ctx.fillStyle=g;ctx.fillRect(-1,-1,2,2);ctx.restore()}
  ground(w*bossFoot[0],h*bossFoot[1],w*.16);for(const m of r.members){const [x,y]=position(r,m);ground(w*x,h*y,w*.050)}
  if(r.warning){
   ctx.save();ctx.lineWidth=1.3;const color=['#f0b072','#9fdff4','#cfafef'][r.move];ctx.strokeStyle=color;
   const shape=(x,y,rx,ry)=>{const g=ctx.createRadialGradient(x,y,0,x,y,rx);g.addColorStop(0,color+'05');g.addColorStop(.8,color+'25');g.addColorStop(1,color+'9e');ctx.fillStyle=g;ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fill();ctx.stroke()};
   if(r.move===2)shape(w*.74,h*.81,w*(.08+.12*wind),h*(.024+.032*wind));
   else if(r.move===0&&r.marks.length){const min=Math.min(...r.marks.map(v=>v[0]));ctx.beginPath();ctx.moveTo(w*.69,h*.805);ctx.quadraticCurveTo(w*min,h*.58,w*(min-.085),h*.72);ctx.quadraticCurveTo(w*(min-.17),h*.90,w*(min+.02),h*.92);ctx.closePath();ctx.fillStyle=color+'3d';ctx.fill();ctx.stroke()}
   else for(const [x,y] of r.marks)shape(w*x,h*y,w*.074,h*.024);
   ctx.restore();
  }
  function boss(){
   const rest=imageFor('warden-rest','./assets/enemy-motion/rest/eclipse-warden.webp');
   const motion=animate?imageFor('warden-motion','./assets/enemy-motion/eclipse-warden.webp'):null;
   const now=r.poseClock.now(r.time),impact=now-(r.poseImpact??-9000);
   let position=0;
   if(animate&&r.warning)position=windPose(cap(1-(r.poseWindUntil-now)/moves[r.move].wind));
   else if(animate&&impact<650)position=r.interruptPose!=null?r.interruptPose*(1-smoothMotion(impact/650)):2+2*smoothMotion(impact/650);
   const load=Math.sin(position*Math.PI/2),swing=Math.sin(Math.PI*cap((position-1)/2));
   const height=Math.min(h*.62,w*.53),width=height*512/448;
   const breath=animate?Math.sin(now/720):0,weight=animate?Math.sin(now/1280):0;
   const recovery=cap((now-r.struckAt)/215),recoil=animate?r.strikeWeight*Math.sin(recovery*Math.PI)*(1-recovery):0;
   ctx.save();ctx.translate(w*bossFoot[0]+width*(.024*recoil+.0045*weight+[.055,-.020,.012][r.move]*load-[.115,.018,.032][r.move]*swing),
    h*bossFoot[1]+height*([.012,-.025,-.063][r.move]*load+[.009,.018,.026][r.move]*swing));
   ctx.rotate(.042*recoil+.018*breath+.006*weight-[.14,.055,-.049][r.move]*load+[.11,.060,-.025][r.move]*swing);
   const x=-width*.5625,y=-height*.9464;
   if(imageReady(motion))enemyMotion.paint(ctx,motion,'eclipse-warden',4,enemyMotion.sample('eclipse-warden',position),x,y,width,height);
   else if(imageReady(rest))ctx.drawImage(rest,x,y,width,height);
   ctx.restore();
  }
  function actor(m){
   if(m.job==='archer')twilightRain.ready(m.key);
   if(m.job==='paladin')paladinMotion.ready(m.key);
   const rig=SKIN_RIGS[m.key],img=imageFor(m.key,heroRigURL(m.key));if(!rig||!imageReady(img))return;
   const swing=m.self&&m.renderSwing?m.renderSwing:m,now=m.self?r.poseClock.now(r.time):r.time;
   const time=now-swing.at,ranged=!!swing.casting,active=m.hp>0&&animate&&time<650,t=active?time:null;
   const body=rig.body[0],k=Math.min(h*m.scale,w*.27)/Math.max(360,body[3]),[x,y]=position(r,m,swing,now);
   const xx=w*x,yy=h*y;
   ctx.save();ctx.globalAlpha=m.hp?1:.4;ctx.translate(xx,yy);if(!m.hp)ctx.rotate(-.40);ctx.scale(k,k);ctx.translate(-body[4]-body[2]/2,-body[5]-body[3]);
   const pose=t===null?0:skinMotion.poseIndex(skinMotion.heroFrame(m.job,t,swing.hits||1));
   const weapon=m.self?selectedWeaponAppearance(m.job):weaponAppearance(m.job,m.weapon);
   const muzzle=skinMotion.paintActor(ctx,img,rig,m.key,pose,t,swing.hits||1,ranged,weapon?.ready?weapon:null,m.post,swing.skillId,null,
    {owner:m,now,animate:animate&&m.hp>0,x:(x-m.x)*w/k,y:(y-m.y)*h/k,lean:0});ctx.restore();
   const emission=swing.skillId===57&&t>=archerFlight.spec(57).release?(twilightRain.releaseTip(m.key)||muzzle):muzzle;
   if(emission)m.weaponMuzzle={x:(xx+(emission[0]-body[4]-body[2]/2)*k)/w,y:(yy+(emission[1]-body[5]-body[3])*k)/h};
   ctx.save();ctx.font='600 '+Math.max(10,w*.028)+'px sans-serif';ctx.textAlign='center';ctx.textBaseline='top';ctx.fillStyle=m.self?'#ffe39c':'#f0e9e1';
   ctx.shadowColor='#100d16';ctx.shadowBlur=3;const name=m.name.length>7?m.name.slice(0,6)+'…':m.name;ctx.fillText(name,xx,yy+2,w*.23);ctx.restore();
  }
  const ordered=r.members.slice().sort((a,b)=>position(r,a)[1]-position(r,b)[1]);
  for(const m of ordered.filter(m=>position(r,m)[1]<.81))actor(m);boss();for(const m of ordered.filter(m=>position(r,m)[1]>=.81))actor(m);
  const pet=companionMotion.active(),player=r.members.find(m=>m.self);
  if(pet>=0&&player?.hp>0){
   const size=Math.min(w*.10,h*.15),{x,y}=player;
   const box={x:Math.max(0,w*x-size*1.45),y:h*y-size,w:size};
   const cast=animate&&r.petCast?.owner===pet?r.petCast:null;
   companionMotion.assist(ctx,pet,cast?r.time-cast.start:null,box,{x:bossPoint[0]*w,y:bossPoint[1]*h},cast?.impact||270,cast,w);
  }
  if(!animate)return;
  if(r.warning&&wind>.69){
   const p=(wind-.69)/.31;
   if(r.move===0&&r.marks.length){
    const target=r.marks[0],u=p*p;
    combatEffects.cell(ctx,'slash',.08+.41*p,w*(.70+(target[0]-.70)*u),h*(.59+(target[1]-.59)*u),w*.34,w*.27,-.8+p*.48,.91);
   }else if(r.move===1){
    for(const [x,y] of r.marks)combatEffects.cell(ctx,'ice',.08+.42*p,x*w,h*y-w*.28*(1-p*p)-w*.10,w*.20,w*.23,Math.PI,.85);
   }else combatEffects.cell(ctx,'mist',.06+.47*p,.75*w,.57*h,w*.33,w*.33,-p*.5,.85);
  }
  for(const hit of r.pending){
   if(!hit.ranged)continue;
   const archer=hit.m.job==='archer',release=hit.start+rangedCombat.releaseTime(hit.m.job,hit.id)+hit.ordinal*70;
   if(r.time<release)continue;
   const t=cap((r.time-release)/(hit.at-release)),a=position(r,hit.m);
   hit.origin??=hit.m.weaponMuzzle||{x:a[0]+.035,y:a[1]-.12};
   const from={x:hit.origin.x*w,y:hit.origin.y*h},feet=combatEffects.ground(hit.id);
   const to={x:(feet?bossFoot:bossPoint)[0]*w,y:(feet?bossFoot:bossPoint)[1]*h};
   if(archer){rangedCombat.drawArrow(ctx,from,to,t,hit.ranged,w,1,hit.id,hit.ordinal);continue}
   if(rangedCombat.spellFlight(ctx,from,to,t,hit.ranged,w,1,hit.id,hit.ordinal))continue;
   const x=(a[0]+(bossPoint[0]-a[0])*t)*w,y=((a[1]-.12)*(1-t)+bossPoint[1]*t-Math.sin(t*Math.PI)*.06)*h;
   ctx.save();ctx.translate(x,y);ctx.rotate(-1.68);sprite(ctx,imageFor('souls','./assets/boss-fx/souls.webp'),-w*.026,-w*.038,w*.052,w*.076);ctx.restore();
  }
  for(const f of r.fx){
   const t=cap((r.time-f.at)/f.life),special=['sweep','ice','eclipse','break'].includes(f.kind);
   if(f.kind==='through-arrow'){
    rangedCombat.drawArrow(ctx,{x:f.from[0]*w,y:f.from[1]*h},{x:f.to[0]*w,y:f.to[1]*h},1+t*.69,'pierce',w,1-t*t,f.id);continue;
   }
   if(special){
    const x=f.to[0]*w,y=f.to[1]*h;
    if(f.kind==='sweep'){
     const u=1-(1-t)**3;
     combatEffects.cell(ctx,'slash',t,x+(1-u)*w*.10,y-h*.05,w*.47,w*.33,-.9+.86*u,.98);
     combatEffects.cell(ctx,'earth',(t-.21)/.79,x-w*.025,y-h*.015,w*.23,w*.15,0,.79);
    }else if(f.kind==='ice'){
     combatEffects.cell(ctx,'lance',t,x+(1-t)*w*.025,y-w*.16*(1-t),w*.19,w*.29,-.55,.86);
     combatEffects.cell(ctx,'ice',Math.min(.999,.12+t*.88),x,y-h*.055,w*.27,w*.29,0,1);
    }else{
     const broken=f.kind==='break',scale=broken?1-.58*t:.66+.34*t;
     combatEffects.cell(ctx,'mist',t,x,y-h*.055,w*.35*scale,w*.34*scale,(broken?-1:1)*t*.76,.95);
     combatEffects.cell(ctx,'cross',(t-.13)/.87,x,y-h*.055,w*.23,w*.24,-.25,.83);
    }
    continue;
   }
   const kind=f.kind==='break'?'eclipse':f.kind==='heal'?'souls':f.kind;
   const im=imageFor(kind,'./assets/'+(special?'raid/':'boss-fx/')+kind+'.webp'),size=w*(special?.28:kind==='fault'?.29:kind==='lances'?.17:.13)*(special?.80+.2*Math.min(1,t*5):1);
   const anchor=kind==='fault'?[.5,.88]:kind==='sweep'?[.13,.90]:kind==='ice'?[.51,.94]:[.5,.5];
   ctx.save();ctx.globalAlpha=Math.min(1,(t+.025)*12)*(1-t*t);ctx.globalCompositeOperation=special||kind==='dust'||kind==='fault'?'source-over':'screen';
   sprite(ctx,im,w*f.to[0]-anchor[0]*size,h*f.to[1]-anchor[1]*size,size,size);ctx.restore();
  }
 }

 function hud(){
  const r=run;if(!dialog||r?.phase!=='battle')return;
  const q=k=>dialog.querySelector('[data-raid-'+k+']');
  q('damage').textContent=num(r.damage);q('clock').textContent=Math.ceil((duration-r.time)/1000)+'초';
  q('clock').classList.toggle('closing',r.time>=50000);
  r.members.forEach((m,i)=>{
   const bar=q('hp'+i),hp=Math.ceil(m.hp);if(!bar||bar.dataset.percent===String(hp))return;
   bar.dataset.percent=hp;bar.style.setProperty('--hp',hp+'%');bar.setAttribute('aria-label',hp?'체력 '+hp+'%':'회복 대기');
  });
  const cast=q('cast');cast.classList.toggle('warning',!!r.warning);
  cast.textContent=r.warning?r.warning+' · '+moves[r.move].cue:r.time<r.exposedUntil?'파수꾼 노출 · 피해 증가':r.report;
  const guard=q('guard'),left=Math.max(0,Math.ceil((r.guardReady-r.time)/1000));
  guard.disabled=!!left||r.members[0].hp<=0;guard.textContent='진형 회피'+(left?' · '+left+'초':'');
  r.skills.forEach((sk,i)=>{
   if(!sk)return;
   const el=q('cd'+i),remaining=Math.max(0,Math.ceil((sk.ready-r.time)/1000)),label=remaining?String(remaining):'';
   if(el.textContent!==label)el.textContent=label;
  });
 }
 function memberList(){
  return '<section class="raid-members" aria-label="참가 대원"><h3>참가 대원 <small>'+run.members.length+'명</small></h3><ul>'+run.members.map((m,i)=>{
   const face=displayFaceIndex(m.portrait,m.job),job=CLASSES[classIndex(m.job)].name;
   return `<li><img src="${faceURL(face)}" alt=""><b>${safeText(m.name)}${m.self?' <em>나</em>':''}</b><small>Lv.${m.level} · ${job}</small><span class="raid-member-hp" data-raid-hp${i} aria-label="체력 100%"><i></i></span></li>`;
  }).join('')+'</ul></section>';
 }
 function fightMarkup(){
  const slots=run.skills.map((sk,i)=>{
   const name=sk?SK[sk.id][0]:slotOpen(i)?'빈 슬롯':'잠김';
   return '<div role="listitem" class="raid-slot" aria-label="'+name+'"><div class="raid-icon">'+(sk?skillArt(sk.id):'—')+'<b data-raid-cd'+i+'></b></div><span>'+name+'</span></div>';
  }).join('');
  return '<div class="party-panel"><header class="party-top"><span><small>월식의 천문대</small><b>'+bossName+' <em>∞</em></b></span><strong data-raid-clock>60초</strong><button class="raid-leave" onclick="partyRaid.exit()">포기</button></header>'+
  '<div class="party-field"><canvas aria-label="월식의 파수꾼 전투"></canvas><div class="raid-damage">누적 피해 <b data-raid-damage>0</b></div></div><div data-raid-cast class="party-cast" role="status"></div>'+
  '<div class="raid-actions"><div class="raid-skill-rack" role="list" aria-label="자동 스킬">'+slots+'</div><button class="muted-button" data-raid-guard onclick="partyRaid.command(&quot;guard&quot;)">진형 회피</button></div>'+memberList()+'</div>';
 }
 function resumeAdventure(r){
  if(r?.adventure&&s===r.owner&&s.stageBossAttempt===r.adventure){
   const paused=Math.max(0,Date.now()-r.entered);r.adventure.started+=paused;r.adventure.deadline+=paused;save();
  }
 }
 function result(){
  const r=run,loot=settle(r);resumeAdventure(r);run=null;canvas=null;leaving=false;enemyUnity.cancelFrame(raf);
  dialog.classList.remove('raid-in-combat');dialog.innerHTML='<section class="party-result"><div class="party-cover"><div class="party-cover-monster"></div><header><small>'+bossName+' · 60초</small><h2>레이드 완료</h2></header></div><div class="party-heading"><b>누적 피해</b><strong>'+num(r.damage)+'</strong></div>'+
  (loot?'<div class="party-heading"><b>지급 완료</b>'+rewardLine(loot)+'</div>':'')+button('확인','partyRaid.close()')+'</section>';hydrateArt(dialog);dialog.querySelector('button')?.focus();playSound('reward');
 }
 function tick(now){
  if(run?.phase!=='battle'||!dialog)return;
  const r=run,target=Math.min(duration,Math.max(0,Date.now()-r.started));
  raf=enemyUnity.requestFrame(tick);
  r.catchingUp=document.hidden||target-r.time>1000;
  while(r.time<target&&!r.result)step(r,Math.min(50,target-r.time));
  r.catchingUp=false;if(r.result){result();return}
  if(!document.hidden&&(!s.powerSaving||now-frameTime>=66)){draw();frameTime=now}
  if(now-lastHud>=100){hud();lastHud=now}
 }
 function recruitCard(m){
  const src=m.outfit==='season2'?seasonTwoArt(m.job,'display'):matureArtURL(m.key);
  return '<div class="raid-arrival"><img src="'+src+'" alt="'+CLASSES[classIndex(m.job)].name+'"><div><b>'+safeText(m.name)+'</b><small>Lv.'+m.level+' · '+CLASSES[classIndex(m.job)].name+'</small></div><span>'+(m.self?'나':'합류')+'</span></div>';
 }
 function recruitment(){
  const r=run;dialog.innerHTML='<section class="raid-recruit"><header class="party-top"><span><small>월식의 천문대</small><b>토벌대 모집</b></span><button class="raid-leave" onclick="partyRaid.close()">취소</button></header>'+
  '<div class="raid-beacon" aria-hidden="true"></div><div class="raid-recruits" data-recruits>'+recruitCard(r.members[0])+'</div><p role="status" data-recruit-status>Lv.'+Math.max(1,s.level-10)+'–'+(s.level+10)+' 기사 모집 중…</p><div data-recruit-actions></div></section>';
 }
 function launch(){
  const r=run;if(!r||r.phase!=='recruit'||!r.ready)return false;
  clearTimeout(recruitTimer);r.phase='battle';r.started=Date.now();r.deadline=r.started+duration;
  dialog.classList.add('raid-in-combat');dialog.innerHTML=fightMarkup();canvas=dialog.querySelector('canvas');lastHud=frameTime=0;
  raf=enemyUnity.requestFrame(tick);draw();hud();return true;
 }
 async function search(){
  const r=run;if(!r||r.phase!=='recruit'||r.searching)return;
  r.searching=true;r.ready=false;recruitment();const current=new AbortController();controller=current;
  const timeout=setTimeout(()=>current.abort(),5000);let peers;
  try{peers=await raidRecords.recruit(current.signal)}
  catch{
   if(r!==run||!dialog)return;r.ready=true;r.searching=false;
   dialog.querySelector('[data-recruit-status]').textContent='기사 기록에 연결할 수 없습니다.';
   dialog.querySelector('[data-recruit-actions]').innerHTML=button('다시 모집','partyRaid.search()')+button('혼자 출격','partyRaid.launch()');return;
  }finally{clearTimeout(timeout);if(controller===current)controller=null}
  if(r!==run||!dialog)return;r.members=partyMembers(peers);let next=1;
  const reveal=()=>{
   if(r!==run||r.phase!=='recruit')return;
   if(next<r.members.length){
    const m=r.members[next++];dialog.querySelector('[data-recruits]').insertAdjacentHTML('beforeend',recruitCard(m));
    dialog.querySelector('[data-recruit-status]').textContent=m.name+' 합류';recruitTimer=setTimeout(reveal,450);return;
   }
   r.ready=true;r.searching=false;
   dialog.querySelector('[data-recruit-status]').textContent=peers.length?'모집 완료 · '+r.members.length+'명 출격':'레벨 범위에 다른 기사 기록이 없어 혼자 출격합니다.';
   recruitTimer=setTimeout(launch,peers.length?850:1450);
  };
  recruitTimer=setTimeout(reveal,450);
 }
 function start(){
  if(dialog||!s?.classId||!guardFeature('partyRaid')||dungeonRun||worldBoss.inBattle())return false;
  run=make();run.phase='recruit';run.adventure=stageBossAttempt();run.entered=Date.now();leaving=false;
  dialog=document.createElement('dialog');dialog.className='party-dialog';dialog.setAttribute('aria-label','월식 레이드');
  dialog.addEventListener('cancel',e=>{e.preventDefault();exit()});document.body.appendChild(dialog);dialog.showModal();syncMusic();
  imageFor('warden-rest','./assets/enemy-motion/rest/eclipse-warden.webp');if(motionAllowed())imageFor('warden-motion','./assets/enemy-motion/eclipse-warden.webp');for(const k of ['sweep','ice','eclipse'])imageFor(k,'./assets/raid/'+k+'.webp');
  search();return true;
 }
 function exit(){
  if(!run||run.phase==='recruit'){close();return}if(leaving)return;
  leaving=true;const el=document.createElement('div');el.className='party-exit';el.innerHTML='<div><h3>레이드를 포기할까요?</h3><p>완료 보상을 받을 수 없습니다.</p><button class="muted-button" onclick="partyRaid.close()">포기</button><button class="gold-button" onclick="partyRaid.stay()">전투 계속</button></div>';dialog.appendChild(el);el.querySelector('.gold-button').focus();
 }
 function stay(){leaving=false;dialog?.querySelector('.party-exit')?.remove();dialog?.querySelector('[data-raid-guard]')?.focus()}
 function close(){
  resumeAdventure(run);clearTimeout(recruitTimer);controller?.abort();enemyUnity.cancelFrame(raf);run=null;canvas=null;leaving=false;
  if(dialog){dialog.close();dialog.remove();dialog=null}syncMusic();paint();if(view==='raidComing')render();
 }
 document.addEventListener('visibilitychange',()=>{if(!document.hidden&&run?.phase==='battle'){enemyUnity.cancelFrame(raf);tick(performance.now())}});
 return {lobby,start,close,exit,stay,command,launch,search,inBattle:()=>!!run};
})();
EXTRA_POPUPS.partyRaidHelp=['월식 레이드 안내',()=>'<p>내 레벨 ±10인 기사 기록 중 최대 4명을 무작위 모집합니다. 오프라인 기사도 참여합니다.</p><p>60초간 장착 스킬 4개가 자동 발동합니다. 도끼·빙창은 회피하고, 월식 개문은 공격 스킬로 끊어 4초간 피해를 높이세요.</p>'];
