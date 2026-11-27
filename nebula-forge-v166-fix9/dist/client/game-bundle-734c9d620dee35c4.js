"use strict";
/* ./enemy-motion.js */
'use strict';
// All motion is a rigid translation/rotation of one original whole-body painting.
const enemyMotion=(()=>{
 const clamp=t=>Math.max(0,Math.min(1,t));
 // Match the Unity AnimationCurve tangents. Keep velocity through intermediate
 // poses, ease into direction changes, and start and finish each attack at rest.
 const slopes={};
 for(const [profile,keys] of Object.entries(enemyMotionClips)){
  slopes[profile]=keys.map((point,i)=>point.map((value,axis)=>{
   if(!i)return 0;
   const incoming=value-keys[i-1][axis],outgoing=keys[(i+1)%keys.length][axis]-value;
   return incoming*outgoing>0?2*incoming*outgoing/(incoming+outgoing):0;
  }));
 }
 const ids=Object.keys(enemyRegistration);

 function position(phase,release){
  const p=clamp(phase),recover=(p-release)/(1-release);
  if(p<release*.46)return p/(release*.46);
  if(p<release*.76)return 1+(p/release-.46)/.30;
  if(p<release)return 2+(p/release-.76)/.24;
  if(recover<.30)return 3+recover/.30;
  if(recover<.76)return 4+(recover-.30)/.46;
  return 5+(recover-.76)/.24;
 }
 function index(p,rows){return Math.round(Math.max(0,p))%rows}
 function sample(key,p){
  const rows=enemyRegistration[key].rows;
  if(rows===1||!p)return {frame:0,phase:0,x:0,y:0,angle:0};
  const profile=enemyRegistration[key].profile,keys=enemyMotionClips[profile],t=Math.max(0,p)%rows;
  const i=Math.floor(t),j=(i+1)%rows,u=t-i,weight=u*u*(3-2*u),bend=u*(1-u);
  const a=keys[i],b=keys[j],m=slopes[profile];
  const axis=k=>a[k]+(b[k]-a[k])*weight+bend*((1-u)*m[i][k]-u*m[j][k]);
  return {frame:index(t,rows),phase:t,x:axis(0),y:axis(1),angle:axis(2)};
 }
 function paint(ctx,image,key,slot,pose,x,y,w,h){
  const count=enemyRegistration[key].rows,sw=image.naturalWidth/count,sh=image.naturalHeight;
  if(enemyUnity.draw(slot,ids.indexOf(key),pose,ctx,x,y,w,h))return;
  ctx.save();ctx.translate(x+w*(.5+pose.x),y+h*(.875+pose.y));ctx.rotate(pose.angle*Math.PI/180);
  ctx.drawImage(image,pose.frame*sw,0,sw,sh,-w*.5,-h*.875,w,h);ctx.restore();
 }
 function landmark(key,point,row){
  const reg=enemyRegistration[key];
  return [.5+(point[0]-.5)*reg.scale,.5+(point[1]-.5)*reg.scaleY+reg.dy[row]];
 }
 function place(point,pose,aspect=1){
  const angle=pose.angle*Math.PI/180,dx=point[0]-.5,dy=(point[1]-.875)/aspect;
  return [.5+pose.x+dx*Math.cos(angle)-dy*Math.sin(angle),.875+pose.y+(dx*Math.sin(angle)+dy*Math.cos(angle))*aspect];
 }
 return {position,index,sample,paint,landmark,place};
})();

;
/* ./actor-motion.js */
'use strict';
// Silhouettes are immutable painted poses. Combat owns all clocks, hits, targeting and saves.
// A local pose clock subtracts only the union of real-time holds; gameplay uses its own clock.
function createActorMotionClock(){
 let until=0,stoppedFor=0;
 return {
  now:realNow=>Math.max(realNow,until)-stoppedFor,
  held:realNow=>realNow<until,
  hold(ms,realNow){
   if(!(ms>0)||!Number.isFinite(ms))return;
   const end=Math.max(until,realNow+ms);
   stoppedFor+=end-Math.max(realNow,until);until=end;
  },
  reset(){until=0;stoppedFor=0}
 };
}
const actorMotion=(()=>{
 const slots=new Map(),cache=new Map();
 const bodyTypes=[
  ['hound','boar','hare','stag'],['cap','spider','sapling','tree'],['scorpion','hound','fighter','giant'],
  ['toad','serpent','fighter','hydra'],['imp','hound','beetle','giant'],['hound','bat','giant','mammoth'],
  ['fighter','gargoyle','wraith','knight'],['hound','fighter','pyromancer','knight'],['griffin','orb','knight','seraph'],
  ['tentacle','centipede','oracle','leviathan']
 ];
 const bossAtlas=key=>/^creature_[0-9]_3$/.test(key);
 // Contact cel tips are in original 320px picture coordinates, including the illustrated overhang.
 const bladeTips={creature_2_2:-.103,creature_5_2:-.097,creature_6_0:-.109,creature_6_2:-.103,creature_7_1:-.106,creature_8_2:-.081};
 // Mouth, casting palm, grimoire or crystal in the full extension painting.
 const muzzlePoints={creature_1_0:[.125,.55],creature_1_2:[.15,.60],creature_3_0:[.20,.55],
  creature_4_0:[.247,.581],creature_7_2:[.088,.355],creature_8_1:[.103,.505],creature_9_2:[.138,.284]};
 const strikePoints={creature_0_1:[.115,.65],creature_0_2:[.20,.55],creature_1_1:[.36,.61],
  creature_2_0:[.10,.58],creature_2_1:[.075,.60],creature_3_1:[.074,.40],creature_3_2:[.058,.41],
  creature_4_1:[.103,.54],creature_4_2:[.094,.68],creature_5_0:[.11,.37],creature_5_1:[.11,.56],
  creature_6_1:[.047,.700],creature_7_0:[.188,.661],creature_8_0:[.112,.568],
  creature_9_0:[.069,.403],creature_9_1:[.119,.481]};
 const hasAttackStrip=key=>enemyRegistration[key]?.rows>1;
 const plainFoe=key=>/^creature_\d_[012]$/.test(key);
 const fullBody=key=>hasAttackStrip(key);
 // Emission points measured on the whole 400px contact cels, one per tower enemy or guardian.
 const towerTips=[[.15,.69],[.10,.305],[.13,.4],[.045,.47],[.12,.67],[.21,.48],[.055,.39],
  [.22,.31],[.07,.47],[.075,.52],[.18,.395],[.12,.74],[.105,.40],[.108,.378],[.155,.395],
  [.043,.37],[.17,.415],[.085,.47],[.35,.755],[.145,.225],[.165,.53],[.135,.50],[.09,.365],
  [.11,.62],[.0125,.5225],[.10,.425],[.12,.478]];
 const guardianTips=[[.10,.66],[.16,.76],[.26,.74],[.10,.53],[.45,.38],[.13,.56],[.09,.34],[.03,.77],[.03,.46],[.50,.44]];
 const companions=['drake','fox','stag','phoenix','owl','ray','tortoise','giant','hare','hound','cap','griffin'];
 const floating=new Set(['ray','bat','phoenix','orb','seraph','wraith','nautilus','tentacle','oracle','leviathan']);
 const heavy=new Set(['boar','tree','giant','knight','mammoth','tortoise']);
 let initialized=false,raf=0,sequence=0,heroMove=null,paused=true,encounter=null;
 let journey=null,trail=0,landscape=null,trailScene=null,poseEncounter=null;
 const clamp=n=>Math.max(0,Math.min(1,n));
 const ease=n=>{const t=clamp(n);return t*t*(3-2*t)};
 const sample=(first,last,t)=>Math.round(first+(last-first)*clamp(t));
 const stats={painted:0,frames:0,requests:0,contacts:0};

 function trim(){
  const active=new Set([...slots.values()].map(v=>v.key));
  const hero=slots.get('heroActor');if(hero?.key)active.add('walk-'+hero.identity);
  let pixels=0;for(const item of cache.values())pixels+=item.image.naturalWidth*item.image.naturalHeight;
  for(const [key,item] of [...cache].sort((a,b)=>a[1].used-b[1].used)){
   if(cache.size<=7&&pixels<=14000000)break;
   if(active.has(key))continue;
   pixels-=item.image.naturalWidth*item.image.naturalHeight;cache.delete(key);
  }
 }
 function request(key){
  let item=cache.get(key);
  if(item){item.used=++sequence;return item}
  const image=new Image();item={image,ready:false,used:++sequence};cache.set(key,item);stats.requests++;
  image.decoding='async';
  image.onload=()=>{
   const ready=()=>{item.ready=true;trim();if(key.startsWith('hero-'))refreshAppearance();wake()};
   if(image.decode)image.decode().then(ready,()=>{if(image.naturalWidth)ready()});else ready();
  };
  image.onerror=()=>{item.failed=true;if(key===slots.get('heroActor')?.key)delete $('heroActor').dataset.weaponOutfit};
  image.src=key.startsWith('walk-')?'./assets/hero-walk/'+key.slice(5)+'.webp?v=134':enemyRegistration[key]?'./assets/enemy-motion/'+key+'.webp':key.startsWith('companion-')?companionMotion.url(Number(key.slice(10))):key.startsWith('hero-')?heroRigURL(key.slice(5)):'./assets/actor-poses/'+key+'.webp';trim();return item;
 }
 function native(slot){
  slot.node.classList.remove('has-actor-motion');slot.last=-1;
  slot.transform=null;slot.distanceX=slot.distanceY=slot.tilt=0;slot.node.style.translate='';if(slot.hud)slot.hud.style.translate='';
  if(slot.canvas){slot.canvas.hidden=true;slot.canvas.style.transform=''}
 }
 function reset(slot){
  slot.clock.reset();slot.cueDeadline=undefined;slot.cueOffset=0;slot.lastCastPhase=null;slot.strike=slot.contact=slot.hurt=slot.follow=slot.cast=slot.recoil=slot.lastFoePose=slot.paintPose=null;slot.prep=0;native(slot);
 }
 function bind(id,key,body,identity,foe,index){
  const node=$(id);if(!node)return;
  let slot=slots.get(id);
  if(!slot){slot={node,id,seed:(slots.size*.237)%1,clock:createActorMotionClock()};slots.set(id,slot)}
  if(key!==slot.key||identity!==slot.identity){
   reset(slot);slot.key=key;slot.identity=identity;slot.item=null;slot.body=body;
   slot.mini=key?.startsWith('tower_mini_');
   slot.boss=slot.mini||bossAtlas(key);slot.armed=Object.hasOwn(bladeTips,key);slot.wolf=key==='creature_0_0';
   slot.animal=plainFoe(key)&&!slot.wolf&&!slot.armed&&hasAttackStrip(key);
   slot.sequence=slot.boss||slot.armed||slot.animal;
   if(slot.boss){
    const region=slot.mini?TOWER_MINIS[Number(key.slice(-2))].technique:Number(key.split('_')[1]);
    const mini=slot.mini?TOWER_MINIS[Number(key.slice(-2))]:null;
    slot.emitter=mini?towerTips[Number(mini.id)]:guardianTips[region];
    slot.release=(mini?.shot||[3,6,8,9].includes(region)) ? .32 : .64;
    bossTechniques.preload(region);
   }else slot.release=muzzlePoints[key] ? .45 : .64;
   slot.rig=id==='heroActor'?SKIN_RIGS[identity]:null;slot.muzzle=null;
   if(id==='heroActor'){heroMove=null;Promise.all([secondaryMotion.ready(identity),twilightRain.ready(identity),paladinMotion.ready(identity)]).then(()=>{if(slot.identity===identity)refreshAppearance()})}
   slot.needsMeasure=true;
  }
  slot.foe=foe;slot.index=index;
  if(key&&!slot.item)slot.item=request(key);
 }
 function refreshAppearance(){
  if(!initialized||document.hidden||activeScreen!=='home'||view)return;
  const slot=slots.get('heroActor');
  if(!slot?.item?.ready||slot.body!==s?.classId)return;
  if(awake()){
   const realNow=performance.now();
   if(!slot.clock.held(realNow))renderHero(slot,slot.clock.now(realNow));
   wake();
  }else draw(slot,0);
 }
 function awake(){return initialized&&warriorMotion.visible()&&!document.body.classList.contains('low-motion')}
 function wake(){if(!raf&&awake())raf=enemyUnity.requestFrame(tick)}
 function suspend(){
  if(raf)enemyUnity.cancelFrame(raf);raf=0;
  finishTravel(false);
  adventureFx.clear();rangedCombat.clear();bossTechniques.clear();if(paused)return;paused=true;heroMove=null;poseEncounter=null;warriorMotion.clearHolds?.();
  for(const slot of slots.values())reset(slot);
 }
 function currentBoss(){
  const boss=bossTacticState;
  return boss?.save===s&&boss.encounter===(dungeonRun||s.stageBossAttempt)&&boss.wave===(dungeonRun?.bosses||0)?boss:null;
 }
 function sync(pair){
  if(!initialized)return;
  const scene=dungeonRun||campaignPosition(s.stage).area;
  if(scene!==trailScene){finishTravel(false);trail=0;if(landscape)delete landscape.dataset.trail;trailScene=scene}
  const outfit=s.classId+'-'+outfitRigRank();
  const hero=$('heroActor');
  if(selectedWeaponAppearance(s.classId)&&!cache.get('hero-'+outfit)?.failed)hero.dataset.weaponOutfit=outfit;
  else delete hero.dataset.weaponOutfit;
  // Use the intact resting painting during decode and when motion is disabled.
  for(let i=0;i<3;i++){
   const n=foeNode(i);if(!n)continue;
   const key=n.hidden?'':pair?n.dataset.tacticArt:encounterFor(s.stage,dungeonRun).art;
   const rest=key&&(fullBody(key)||key==='creature_0_0')?key:'';
   if(n.dataset.restArt!==rest){
    n.dataset.restArt=rest;n.classList.toggle('enemy-rest',!!rest);
    if(rest)n.style.setProperty('--rest-art','url("./assets/enemy-motion/rest/'+key+'.webp")');
    else n.style.removeProperty('--rest-art');
   }
  }
  if(!awake()){
   suspend();
   if(s.classId&&!document.hidden&&activeScreen==='home'&&!view&&!motionAllowed()){
    bind('heroActor','hero-'+outfit,s.classId,outfit,null,0);
    draw(slots.get('heroActor'),0);
   }
   return;
  }
  if(!poseEncounter||!sameEncounter(poseEncounter)){
   heroMove=null;
   for(const slot of slots.values())reset(slot);
   warriorMotion.clearHolds?.();poseEncounter=combatEncounter();
  }
  paused=false;encounter=pair;
  bind('heroActor','hero-'+outfit,s.classId,outfit,null,0);
  for(let i=0;i<3;i++){
   const node=foeNode(i);if(!node)continue;
   const foe=pair?pair.foes[i]:i===0?currentBoss():null;
   const key=node.hidden?'':pair?node.dataset.tacticArt:encounterFor(s.stage,dungeonRun).art;
   const codes=key?.match(/^creature_(\d+)_(\d+)$/);
   const mini=key?.startsWith('tower_mini_')?TOWER_MINIS[Number(key.slice(-2))]:null;
   bind(node.id,codes||mini?key:'',mini?mini.body:codes?bodyTypes[+codes[1]][+codes[2]]:'',pair||dungeonRun||s.stage,foe,i);
  }
  const pet=s.activePet,hasPet=Number.isInteger(pet)&&pet>=0&&pet<companions.length;
  bind('battlePet',hasPet?'companion-'+pet:'',companions[pet],pet,null,0);
  if([...slots.values()].some(slot=>slot.needsMeasure))measure();
  wake();
 }
 function canvasFor(slot){
  if(!slot.canvas){
   const c=document.createElement('canvas');c.className='actor-cel';c.setAttribute('aria-hidden','true');
   const ctx=c.getContext('2d');if(!ctx||typeof ctx.drawImage!=='function')return false;
   slot.canvas=c;slot.ctx=ctx;
  }
  if(slot.canvas.parentNode!==slot.node)slot.node.appendChild(slot.canvas);
  return true;
 }
 function draw(slot,frame,x=0,y=0,angle=0,time=null,bossPhase=0,walk=null){
  if(!slot.item?.ready||!canvasFor(slot))return;
  const canvas=slot.canvas,img=slot.item.image,rig=slot.rig;
  const rows=enemyRegistration[slot.key]?.rows||0;
  const pet=slot.id==='battlePet';
  const cell=rig?512:rows?img.naturalWidth/rows:pet?img.naturalWidth/4:img.naturalWidth;
  const pad=rig?weaponFramePadding(slot.body):0,extent=cell+2*pad;
  const className=rig?'actor-cel rigid-weapon'+(slot.body==='warrior'?' greatsword-cel':''):slot.sequence?'actor-cel enemy-sequence':'actor-cel';
  if(canvas.className!==className)canvas.className=className;
  if(rig)canvas.actorPadding=pad/cell;
  if(canvas.width!==extent||canvas.height!==extent){canvas.width=canvas.height=extent;slot.ctx.imageSmoothingQuality='high';slot.last=-1}
  const pos=slot.sequence?enemyMotion.position(bossPhase,slot.release):slot.wolf?bossPhase:0;
  const pose=rows?enemyMotion.sample(slot.key,pos):null;
  const index=rows?pose.frame:rig?skinMotion.poseIndex(frame):pet?frame:0,ctx=slot.ctx;
  const replacement=rig?selectedWeaponAppearance(slot.body):null;
  const weapon=replacement?.ready?replacement.image:null;
  const depthVersion=rig&&typeof weaponDepth!=='undefined'?weaponDepth.version():0;
  const realNow=performance.now(),now=slot.clock.now(realNow);
  const animate=rig&&motionAllowed();
  const moving=!!(walk?.moving||heroMove||slot.recoil);
  // Skin, hair and cloth reuse the last idle painting between 30 Hz samples.
  // The planted-body transform below still follows the display refresh.
  const idleFrame=animate&&!moving?Math.floor(now*30/1000):'';
  const materialFrame=rig?secondaryMotion.stamp(slot.identity,slot,now,moving,animate)+'|'+idleFrame:'';
  if(materialFrame!==slot.materialFrame||index!==slot.last||(rows&&(pos!==slot.motionPos||slot.engineRevision!==enemyUnity.revision(slot.index)))||(rig&&(slot.heroRevision!==enemyUnity.revision(5)||slot.walkFrame!==(walk?.frame||0)||slot.walkImage!==walk?.image||slot.poseTime!==time||slot.weaponImage!==weapon||slot.weaponSkin!==replacement?.skin||slot.weaponViewVersion!==depthVersion))){
   slot.weaponImage=weapon;slot.weaponSkin=replacement?.skin;slot.weaponViewVersion=depthVersion;
   ctx.clearRect(0,0,extent,extent);
   if(rig){
    ctx.save();ctx.translate(pad,pad);
    const hits=heroMove?.hits||1,ranged=!!heroMove?.ranged;
    slot.walkFrame=walk?.frame||0;slot.walkImage=walk?.image;
    slot.materialFrame=materialFrame;
    const recoil=slot.recoil?skinMotion.spring(slot.recoil,now).x:0;
    const unit=512/Math.max(1,slot.width||1);
    const movement={owner:slot,now,animate,x:(x+recoil)*5.12+warriorMotion.advance(realNow)*unit,
     y:y*5.12,lean:angle+recoil*.45,air:(walk?.speed||0)*unit};
    slot.muzzle=skinMotion.paintActor(ctx,img,rig,slot.identity,index,time,hits,ranged,replacement,0,heroMove?.skillId??-1,walk,movement);
    ctx.restore();
    slot.poseTime=time;slot.heroRevision=enemyUnity.revision(5);
   }else if(rows){
    slot.motionPos=pos;slot.engineRevision=enemyUnity.revision(slot.index);slot.paintPose=pose;
    enemyMotion.paint(ctx,img,slot.key,slot.index,pose,0,0,cell,cell);
   }else if(pet){
    companionMotion.draw(ctx,img,index,0,0,cell);
   }else{
    ctx.drawImage(img,0,0,cell,cell,0,0,cell,cell);
   }
   slot.last=index;stats.painted++;
  }
  if(slot.id.startsWith('mob')){
   slot.lastFoePose={frame,x,y,angle,bossPhase};slot.tilt=angle;
   const desired=x*(slot.width||0)/100,dy=y*(slot.width||0)/100;
   const dx=slot.limits?Math.max(slot.limits[0],Math.min(slot.limits[1],desired)):desired;
   if(dx!==slot.distanceX||dy!==slot.distanceY){const offset=dx||dy?dx.toFixed(2)+'px '+dy.toFixed(2)+'px':'';
    slot.node.style.translate=offset;if(slot.hud)slot.hud.style.translate=offset;slot.distanceX=dx;slot.distanceY=dy;
   }
   x=0;y=0;
  }
  // Recoil moves the painted cel around its planted foot, independently of hitboxes and HP bars.
  if(slot.recoil){
   const {x:shift,v}=skinMotion.spring(slot.recoil,now);
   if(Math.abs(shift)<.01&&Math.abs(v)<.15)slot.recoil=null;
   x+=shift;y-=Math.abs(shift)*.12;angle+=shift*.45;
  }
  if(rig){x*=cell/extent;y*=cell/extent}
  const transform=x||y||angle?'translate('+x.toFixed(2)+'%,'+y.toFixed(2)+'%) rotate('+angle.toFixed(2)+'deg)':'';
  if(slot.transform!==transform){canvas.style.transform=transform;slot.transform=transform}
  if(canvas.hidden||!slot.node.classList.contains('has-actor-motion')){
   canvas.hidden=false;slot.node.classList.add('has-actor-motion');
  }
 }
 function idle(slot,now){
  const b=slot.body,period=floating.has(b)?1080:heavy.has(b)?2600:b==='shadow'||b==='hare'?1550:2080;
  const phase=(now/period+slot.seed)%1,cycle=Math.floor(now/period+slot.seed);
  if(slot.id!=='heroActor'&&cycle%4===2)return 44+Math.floor(phase*12);
  return Math.floor(phase*12);
 }
 // Keep the full panorama in its original orientation. Three overlapping copies
 // let the last 16% of the painting blend into its next left edge off the camera.
 function panTrail(value){
  const field=$('battle'),panel=Math.max(field.clientWidth,field.clientHeight*1.5||0);
  if(!panel||!landscape)return;
  trail=value%.84;
  const initial=(1-field.clientWidth/panel)/2,phase=((initial+trail-.16)%.84+.84)%.84;
  landscape.style.setProperty('--trail-pan',(-100*(phase+.16)).toFixed(4)+'%');
 }
 function finishTravel(complete){
  if(!journey)return;
  if(complete)panTrail(journey.from+journey.distance);
  journey.hero.style.translate='';
  if(journey.bar)journey.bar.style.translate='';
  if(journey.pet)journey.pet.style.translate='';
  journey=null;
 }
 function advanceWave(group){
  if(!awake()||dungeonRun||!group||document.hidden||!motionAllowed())return;
  const hero=$('heroActor'),field=$('battle');
  landscape=document.querySelector('.landscape');
  if(!hero||!landscape?.dataset||!field?.clientWidth)return;
  finishTravel(true);
  const key=s.classId+'-'+outfitRigRank(),width=field.clientWidth;
  const panel=Math.max(width,field.clientHeight*1.5||width),walkDistance=width*.92;
  const duration=combatMs(1540);
  landscape.dataset.trail='';panTrail(trail);
  journey={hero,bar:$('heroHealth'),pet:$('battlePet'),at:performance.now(),duration,width,walkDistance,distance:walkDistance/panel,from:trail,
   originStage:s.stage,walk:request('walk-'+key)};
  wake();return duration;
 }
 function travelFrame(now){
  if(!journey)return null;
  if(dungeonRun||s.stage!==journey.originStage){finishTravel(false);return null}
  const t=clamp((now-journey.at)/journey.duration);
  if(t>=1){finishTravel(true);return null}
  // The first foot takes the weight before the camera catches up. World and
  // camera distance are both monotone, and reach the same position at rest.
  const q=ease(clamp((t-.06)/.94)),camera=q*q*(1.28-.28*q);
  const offset=(q-camera)*journey.walkDistance;
  panTrail(journey.from+camera*journey.distance);
  journey.hero.style.translate=offset.toFixed(2)+'px 0';
  if(journey.bar)journey.bar.style.translate=journey.hero.style.translate;
  if(journey.pet&&!journey.pet.hidden)journey.pet.style.translate=(offset*.78).toFixed(2)+'px 0';
  const phase=q*8*Math.PI,step=Math.sin(phase),weight=Math.sin(Math.PI*q);
  const frame=Math.abs(step)<.28?0:step>0?1:2;
  const phaseTime=clamp((t-.06)/.94);
  const speed=6*phaseTime*(1-phaseTime)*journey.walkDistance*1000/(journey.duration*.94);
  return {frame,speed,image:journey.walk.ready?journey.walk.image:null,lean:weight*(1.8+.45*step),
   lift:-1.35*Math.abs(step)*weight,pitch:2*step*weight,moving:q>0};
 }
 function renderHero(slot,now,walk=null){
  if(walk?.moving){heroMove=null;draw(slot,0,0,walk.lift,walk.lean,null,0,walk);return}
  if(heroMove&&heroMove.token===combatSerial){
   const t=heroMove.clock.pose(now-heroMove.at);
   if(t<650){
    const ranged=heroMove.ranged,release=rangedCombat.releaseTime(slot.body,heroMove.skillId);
    if(slot.body==='archer'&&heroMove.skillId===57){
     draw(slot,skinMotion.heroFrame(slot.body,t,heroMove.hits),0,0,0,t);return;
    }
    const pull=ranged?Math.sin(Math.PI*clamp(t/release)):0;
    const beat=t-release,last=(heroMove.hits-1)*70;
    const recoil=ranged&&beat>=0&&beat<last+100?Math.sin(Math.PI*clamp((beat<last?beat%70:beat-last)/ (beat<last?70:100))):0;
    const poseBody=ranged&&slot.body!=='archer'&&slot.body!=='mage'?'mage':slot.body;
    draw(slot,skinMotion.heroFrame(poseBody,t,heroMove.hits),-2.5*pull-1.8*recoil,-.8*pull,-2.4*pull+2.8*recoil,t);
    return;
   }
   heroMove=null;
  }
  const rec=slot.hurt;
  if(rec){const t=(now-rec.at)/rec.duration;if(t<1){draw(slot,sample(28,33,t));return}slot.hurt=null}
  const phase=now*.0028+slot.seed,breath=Math.sin(phase),shift=Math.sin(phase*.53);
  draw(slot,idle(slot,now),.38*shift,.20*breath,1.12*breath+.48*shift);
 }
 function renderPet(slot,now){
  const f=slot.follow,flight=floating.has(slot.body)||slot.body==='drake'||slot.body==='griffin';
  const phase=now/1200+slot.seed,restX=flight?1.7*Math.sin(phase):0,restY=flight?2.8*Math.sin(phase*1.4):0;
  let x=restX,y=restY,angle=flight?2.4*Math.sin(phase*.85):0,frame=0;
  if(slot.cast){
   const cast=slot.cast,t=cast.clock.pose(now-cast.at);
   if(t<companionMotion.finishMs){
    const beat=companionMotion.releaseMs,gather=ease(t/beat),release=clamp((t-beat)/75),settle=ease((t-beat-75)/(companionMotion.finishMs-beat-75));
    const snap=Math.sin(Math.PI*release);
    frame=companionMotion.frame(slot.identity,t);
    x=(cast.x*(1-gather)-3.5*gather+5*snap)*(1-settle)+restX*settle;
    y=(cast.y*(1-gather)-(flight?8:1.2)*gather+2*snap)*(1-settle)+restY*settle;
    angle=(cast.angle*(1-gather)-(flight?4:2)*gather+5*snap)*(1-settle)+angle*settle;
    slot.petX=x;slot.petY=y;slot.petAngle=angle;draw(slot,frame,x,y,angle);return;
   }
   slot.cast=null;
  }
  if(f){
   const t=clamp((now-f.at)/f.duration);
   if(t<1){
    const direction=f.defend?-1:1,reach=flight?29:21;
    if(t<.17){
     const k=ease(t/.17);
     x=f.startX+(-2*direction-f.startX)*k;y=f.startY+(2-f.startY)*k;angle=f.startAngle*(1-k);

    }else if(t<.62){
     const k=ease((t-.17)/.45);x=direction*(-2+(reach+2)*k);y=2-(flight?13:8)*Math.sin(k*Math.PI*.85);
     angle=direction*(flight?-10:-3)*Math.sin(Math.PI*k);
    }else{
     const k=ease((t-.62)/.38);x=direction*reach*(1-k)+restX*k;
     y=2*(1-k)-(flight?8:3)*Math.sin(k*Math.PI)+restY*k;
     angle=direction*(flight?10:4)*Math.sin(Math.PI*k);
    }
   }else slot.follow=null;
  }
  slot.petX=x;slot.petY=y;slot.petAngle=angle;draw(slot,frame,x,y,angle);
 }
 function follow(slot,now,duration,defend){
  if(!slot||!slot.key)return;
  slot.follow={at:now,duration,defend,startX:slot.petX||0,startY:slot.petY||0,startAngle:slot.petAngle||0};
 }
 function planMelee(node,foe,wall,speed){
  const slot=slots.get(node?.id),left=foe.nextAttack-wall;
  if(!slot||!awake()||left<=0||left*speed>1000)return;
  if(slot.strike?.deadline===foe.nextAttack&&slot.strike.foe===foe)return;
  // HP resolves on the first 250-ms combat tick at or after the authored deadline.
  slot.strike={foe,deadline:foe.nextAttack,at:slot.clock.now(performance.now())+250*Math.ceil(left/250)};
 }
 function availableReach(slot,now){
  const realNow=performance.now();
  const advance=100*warriorMotion.advance(now+realNow-slot.clock.now(realNow))/Math.max(1,slot.width||1);
  return Math.max(0,(slot.reach||40)-advance);
 }
 function retreat(slot,ms,duration,startX,startY,startAngle){
  const t=clamp(ms/duration),remaining=(1-t)*(1-t)*(1+1.7*t);
  const bounce=slot.body==='hare'||slot.body==='toad'?8:floating.has(slot.body)?5:2;
  const frame=t<.26?sample(30,35,ease(t/.26)):12+Math.floor((t-.26)*21)%12;
  draw(slot,frame,startX*remaining,startY*remaining-bounce*Math.sin(Math.PI*t),startAngle*remaining,null,slot.animal?.64+.36*t:slot.wolf?2+2*ease(t):0);
 }
 function approach(slot,progress,now){
  const b=slot.body,cast=!!rangedCombat.enemyStyle(b),flight=floating.has(b)||b==='griffin';
  // Load on the rear foot, push off, then arrive at the scheduled contact.
  const p=clamp(progress),load=heavy.has(b)?.48:b==='hare'||b==='toad'?.54:.31;
  const wind=ease(p/load),stride=ease((p-load)/(1-load));
  const frame=p<load?sample(24,27,wind):p<.78?12+Math.floor(stride*14)%12:sample(27,30,ease((p-.78)/.22));
  const travel=cast?5:availableReach(slot,now);
  const plant=heavy.has(b)?2.8:b==='spider'?.6:1.3;
  const pitch=b==='spider'?1.3:b==='serpent'?5:heavy.has(b)?3.7:2.5;
  return [cast?(p<.78?sample(24,27,wind):sample(27,30,(p-.78)/.22)):frame,
    (plant+1.5)*wind*(1-stride)-travel*stride,
    (cast?0:slot.contactY||0)*stride+(flight?0:plant)*wind*(1-stride)-(flight?13:b==='hare'||b==='toad'?21:b==='hound'||b==='stag'?8:heavy.has(b)?1.8:4)*Math.sin(stride*Math.PI),
    cast?0:pitch*wind*(1-stride)+(flight?-7:b==='spider'?-1:-3)*Math.sin(stride*Math.PI)];
 }
 function renderFoe(slot,now,wall,speed,realNow){
  const f=encounter?slot.foe:currentBoss();
  // The projectile and combat deadline stay on real time. Rebase each new telegraph
  // separately so a previous foe animation's stop never delays the following shot.
  if(slot.cueDeadline!==f?.nextAttack){slot.cueDeadline=f?.nextAttack;slot.cueOffset=realNow-now}
  const cueNow=now+slot.cueOffset,cueWall=wall-(realNow-cueNow);
  if(slot.node.dataset.dying||f?.status?.stun?.until>wall){
   slot.strike=slot.contact=null;slot.prep=0;
   const hold=slot.lastFoePose;
   if(hold)draw(slot,hold.frame,hold.x,hold.y,hold.angle,null,hold.bossPhase);else draw(slot,0);
   return;
  }
  const entryWall=wall-(realNow-now);
  if(encounter&&entryWall<encounter.spawnAt+encounter.entryDuration+slot.index*encounter.entryStagger){
   const t=clamp((entryWall-encounter.spawnAt-slot.index*encounter.entryStagger)/encounter.entryDuration);
   const step=Math.sin(Math.PI*t),flight=floating.has(slot.body);
   if(slot.body==='boar'||slot.body==='hare'){
    const phase=(t*(slot.body==='hare'||slot.body==='cap'?2:3))%1;
    draw(slot,0,0,-(slot.body==='hare'?9:2)*Math.sin(Math.PI*phase)**2,0,null,phase);return;
   }
   const contactStep=.5-.5*Math.cos(4*Math.PI*t),lift=flight?(3+2*contactStep)*step:contactStep*2.2;
   draw(slot,0,0,-lift,step*(heavy.has(slot.body)?-.8:-1.5),null,slot.animal?slot.release*.44*contactStep:0);return;
  }
  const breathing=Math.sin(now/(heavy.has(slot.body)?700:490)+slot.seed*6);
  const hovering=floating.has(slot.body),weight=Math.sin(now/(slot.boss?1330:940)+slot.seed*7);
  const lift=hovering?-2.4*breathing:.22*breathing,lean=(heavy.has(slot.body)?1.04:1.35)*breathing+.42*weight;
  if(slot.boss){
   const action=bossTechniques.pose(f,cueNow);
   if(action){
    const tip=(enemyMotion.landmark(slot.key,slot.emitter,3)[0]-.1)*1.25;
    const reach=Math.min(56,Math.max(0,availableReach(slot,now)-100*(.32-tip)));
    const idleWeight=1-Math.sin(action.phase*Math.PI);
    draw(slot,0,action.back*.65-action.advance*reach,action.y*.70+lift*idleWeight,action.angle*.76+lean*idleWeight,null,action.phase);return
   }
   draw(slot,0,.48*weight,lift,lean);return;
  }
  if(slot.armed){
   const strike=slot.strike,after=slot.contact,reach=slot.weaponReach||0;
   let phase=0;
   if(after){const age=(now-after.at)/after.duration;if(age<1)phase=.64+.36*clamp(age);else slot.contact=null}
   if(!phase&&strike&&strike.foe===f&&strike.deadline===f?.nextAttack)phase=.64*clamp(1-(strike.at-now)*speed/660);
   const advance=phase<=.64?ease((phase-.28)/.36):1-ease((phase-.64)/.36);
   const load=Math.sin(Math.PI*clamp(phase/.64))*(1-advance);
   draw(slot,0,3*load-Math.max(0,reach-100*warriorMotion.advance(realNow)/Math.max(1,slot.width))*advance,(slot.contactY||0)*advance+lift*(1-advance),lean*(1-advance)+2.4*load-2*advance,null,phase);return;
  }
  const cast=rangedCombat.enemyPose(f,cueNow);
  if(cast){
   const wind=ease(cast.draw),release=cast.flight,recover=ease(release/.78);
   const frame=release>0?sample(30,35,recover):wind<.8?sample(24,27,wind/.8):sample(27,30,(wind-.8)/.2);
   // The caster plants its feet; the upper body springs back as the shot leaves.
   const push=Math.sin(Math.PI*release);
   const phase=release>0?slot.release+(1-slot.release)*recover:slot.release*wind;slot.lastCastPhase=phase;
   draw(slot,frame,(6.5*wind-8.5*push)*(1-recover),-1.8*wind*(1-recover),4*wind*(1-recover)-6*push,null,phase);return;
  }
  if(slot.contact){
   const t=(now-slot.contact.at)/slot.contact.duration;
   if(t<1){
    const a=slot.contact;
    if(a.heal){draw(slot,sample(24,35,t),0,-2.5*Math.sin(Math.PI*t),0,null,slot.animal?slot.release*.68*Math.sin(Math.PI*t):0);return}
    if(a.cast){
     const phase=a.phase+(1-a.phase)*ease(t);
     draw(slot,idle(slot,now),0,-1.3*(1-ease(t)),1.4*(1-ease(t)),null,phase);return;
    }
    retreat(slot,now-a.at,a.duration,a.x,a.y,a.angle);return;
   }
   slot.contact=null;
  }
  const engaged=!!dungeonRun||s.auto||(encounter?encounter.engaged:f?.engaged);
  const strike=slot.strike&&slot.strike.foe===f&&slot.strike.deadline===f?.nextAttack?slot.strike:null;
  const remaining=strike?(strike.at-now)*speed:(f?.nextAttack-cueWall)*speed;
  if(engaged&&f&&f.hp!==0&&remaining<660&&!heroReviveUntil){
   if(strike&&remaining<=0){
    // A delayed simulation callback must not pin the actor at the contact point.
    if(!strike.arrival)strike.arrival=[-availableReach(slot,strike.at),slot.contactY||0,0];
    retreat(slot,now-strike.at,combatMs(heavy.has(slot.body)?580:460),...strike.arrival);return;
   }
   slot.prep=clamp(1-remaining/660);const pose=approach(slot,slot.prep,now);
   draw(slot,...pose,null,slot.animal?.64*slot.prep:slot.wolf?2*slot.prep:0);return;
  }
  slot.prep=0;
  if(slot.hurt){const t=(now-slot.hurt.at)/slot.hurt.duration;if(t<1){draw(slot,sample(36,43,t));return}slot.hurt=null}
  const breath=Math.sin(now/(heavy.has(slot.body)?640:460)+slot.seed*6);
  draw(slot,idle(slot,now),.55*weight,hovering?breath*2.2:.25*breath,lean);
 }
 function tick(now){
  raf=0;if(!awake()){suspend();return}paused=false;
  stats.frames++;
  const wall=Date.now(),speed=Math.max(1,s.speed||1),walk=travelFrame(now);
  for(const slot of slots.values()){
   if(!slot.key||!slot.item?.ready||slot.node.hidden||slot.clock.held(now))continue;
   if(slot.id==='heroActor')renderHero(slot,slot.clock.now(now),walk);
   else if(slot.id==='battlePet')renderPet(slot,now);
   else renderFoe(slot,slot.clock.now(now),wall,speed,now);
  }
  rangedCombat.render(now,wall);bossTechniques.render(now);wake();
 }
 function measure(){
  if(landscape?.dataset.trail!==undefined)panTrail(trail);
  const h=$('heroActor'),battle=$('battle');if(!h?.offsetWidth||!battle)return;
  for(const slot of slots.values())slot.needsMeasure=false;
  for(let i=0;i<3;i++){const node=foeNode(i),slot=slots.get(node?.id);if(!slot||!node.offsetWidth)continue;
   slot.width=node.offsetWidth;
   const fieldWidth=battle.clientWidth;
   if(fieldWidth){
    const scale=typeof getComputedStyle==='function'?parseFloat(getComputedStyle(node).scale)||1:1;
    // Reserve room beyond the art for recoil, foot rotation, and weapon overhang.
    const margin=node.offsetWidth*((slot.sequence?.66:.57)*scale-.5)+2;
    slot.limits=[margin-node.offsetLeft,fieldWidth-node.offsetLeft-node.offsetWidth-margin];
   }
   const hud=encounter?$('foeHud'+i):i===0&&stageBossActive()?document.querySelector('.enemy-status'):null;
   if(slot.hud!==hud&&slot.hud)slot.hud.style.translate='';
   slot.hud=hud;
   if(slot.armed){
    const tip=(enemyMotion.landmark(slot.key,[.10+bladeTips[slot.key]/1.25,.5],3)[0]-.10)*1.25;
    slot.weaponReach=Math.max(0,100*(node.offsetLeft+node.offsetWidth*tip-h.offsetLeft-h.offsetWidth*.62)/node.offsetWidth);
   }
   const contact=strikePoints[slot.key];
   const tip=contact?enemyMotion.landmark(slot.key,contact,3):null;
   const x=tip?1.25*tip[0]-.125:.32,y=tip?1.25*tip[1]-.125:.53;
   slot.reach=Math.max(0,100*(node.offsetLeft+node.offsetWidth*x-h.offsetLeft-h.offsetWidth*.64)/node.offsetWidth);
   slot.contactY=Number.isFinite(h.offsetTop)&&Number.isFinite(node.offsetTop)?
    Math.max(-56,Math.min(56,100*(h.offsetTop+h.offsetWidth*.53-node.offsetTop-node.offsetWidth*y)/node.offsetWidth)):0;
  }
 }
 function attack(token,factor,hits,k=-1){
  if(!initialized||!awake())return;
  finishTravel(true);
  const now=performance.now(),ranged=!!rangedCombat.heroStyle(s.classId,k);
  const outfit=s.classId+'-'+outfitRigRank();
  // A first cast can arrive between a costume change and the next encounter paint.
  // Bind the intended rig before arming the cast so the next sync cannot cancel it.
  bind('heroActor','hero-'+outfit,s.classId,outfit,null,0);
  const actor=slots.get('heroActor'),poseNow=actor.clock.now(now),clock=skillMotion.clock(s.classId,k,factor);
  const recent=heroMove&&(heroMove.token===token||heroMove.token===token-1)&&poseNow-heroMove.at<.7*heroMove.clock.elapsed(650);
  if(recent)heroMove.token=token;
  else{
   heroMove={at:poseNow,factor,hits,token,ranged,skillId:k,clock};
   if(actor.item?.ready&&!actor.clock.held(now))renderHero(actor,poseNow);
  }
  wake();
  const companion=companionMotion.active();
  if(companion>=0)bind('battlePet','companion-'+companion,companions[companion],companion,null,0);
  const pet=slots.get('battlePet');
  if(pet&&rangedCombat.petStyle()&&skillMeta(k).target!=='self'){
   pet.follow=null;pet.cast={at:now,factor,clock,x:pet.petX||0,y:pet.petY||0,angle:pet.petAngle||0};
  }else follow(pet,now,Math.max(340,790*factor),false);
  return actor.item?.ready?!recent:undefined;
 }
 function contact(node,kind){
  const slot=slots.get(node?.id);if(!slot?.item?.ready||!awake())return false;
  const realNow=performance.now(),now=slot.clock.now(realNow),cast=!slot.armed&&!!rangedCombat.enemyStyle(slot.body);
  const strike=kind==='attack'&&!cast?slot.strike:null;
  let at=now,x=100*(slot.distanceX||0)/(slot.width||1),y=100*(slot.distanceY||0)/(slot.width||1),angle=slot.tilt||0;
  if(strike&&strike.foe===slot.foe&&now>=strike.at-18){
   at=Math.min(now,strike.at);
   [x,y,angle]=strike.arrival||[-availableReach(slot,at),slot.contactY||0,0];
  }
  slot.strike=null;
  slot.contact={at,duration:combatMs(heavy.has(slot.body)?580:460),x,y,angle,cast,phase:cast?(slot.lastCastPhase??slot.release):.64,heal:kind==='heal'};
  slot.lastCastPhase=null;slot.prep=0;stats.contacts++;
  // Draw the impact pose on the same game callback as the health deduction.
  if(!slot.clock.held(realNow))renderFoe(slot,now,Date.now(),s.speed||1,realNow);
  return true;
 }
 function hurt(node,factor=1,strength=115){
  const slot=slots.get(node?.id);if(!slot?.item?.ready||!awake())return false;
  const now=slot.clock.now(performance.now()),hero=node.id==='heroActor';
  const mass=slot.boss?2.6:heavy.has(slot.body)?1.65:hero&&slot.body==='paladin'?1.5:1;
  slot.recoil=skinMotion.impulse(slot.recoil,now,1.25*strength*(hero?-1:1),mass,1/Math.max(.44,factor));
  slot.hurt={at:now,duration:Math.max(100,260*factor)};
  const pet=slots.get('battlePet');if(node.id==='heroActor'&&pet&&!pet.follow)follow(pet,performance.now(),Math.max(260,490*factor),true);
  return true;
 }
 function hitStop(ms,target){
  if(!Number.isFinite(ms)||ms<=0||!motionAllowed()||!warriorMotion.visible())return false;
  const targets=(Array.isArray(target)?target:[target]).filter(node=>node?.id&&!node.hidden);
  if(!targets.length)return false;
  const now=performance.now();
  slots.get('heroActor')?.clock.hold(ms,now);
  for(const node of targets){
   slots.get(node.id)?.clock.hold(ms,now);
   warriorMotion.holdActor?.(ms,node);
  }
  wake();return true;
 }
 function init(){
  if(initialized||typeof HTMLCanvasElement==='undefined')return;
  initialized=true;adventureFx.init($('battle'));document.addEventListener('visibilitychange',()=>{if(document.hidden)suspend();else sync(isDuoBattle()?s?.tactics?.encounter:null)});
  new ResizeObserver(measure).observe($('battle'));
  window.matchMedia?.('(prefers-reduced-motion: reduce)').addEventListener?.('change',()=>sync(isDuoBattle()?s?.tactics?.encounter:null));
  sync(isDuoBattle()?s?.tactics?.encounter:null);measure();
 }
 function emitter(){
  const slot=slots.get('heroActor');
  return slot?.muzzle&&slot.last>=0?slot.muzzle.map(x=>x/512):null;
 }
 const contactMarks=[
  [[.51,.53,.44,.80],[.52,.54,.47,.80],[.52,.61,.43,.80],[.52,.60,.46,.80]],
  [[.56,.58,.73,.80],[.53,.52,.53,.81],[.51,.60,.44,.80],[.50,.52,.41,.81]],
  [[.54,.59,.76,.72],[.50,.50,.42,.80],[.53,.62,.65,.80],[.50,.50,.32,.80]],
  [[.52,.59,.59,.80],[.49,.54,.51,.82],[.49,.50,.69,.82],[.49,.61,.53,.80]],
  [[.50,.57,.65,.80],[.51,.54,.43,.79],[.54,.55,.40,.76],[.49,.53,.64,.80]],
  [[.54,.52,.45,.77],[.49,.49,.49,.76],[.51,.52,.61,.80],[.53,.51,.47,.79]],
  [[.53,.58,.64,.80],[.50,.55,.61,.78],[.47,.56,.50,.79],[.50,.57,.55,.80]],
  [[.51,.62,.61,.79],[.51,.61,.63,.80],[.51,.58,.51,.81],[.49,.62,.56,.79]],
  [[.50,.52,.42,.72],[.50,.46,.50,.73],[.48,.60,.41,.80],[.48,.59,.48,.80]],
  [[.50,.40,.50,.71],[.52,.53,.49,.69],[.47,.43,.48,.71],[.47,.62,.49,.80]]
 ];
 function targetMark(node,feet=false){
  const slot=slots.get(node.id),key=slot?.key||node.dataset?.tacticArt||node.dataset?.art||'';
  if(node.id==='heroActor')return feet?[.50,.90]:[.50,.48];
  const match=/^creature_(\d)_(\d)$/.exec(key),m=match&&contactMarks[+match[1]]?.[+match[2]];
  const mark=m?m.slice(feet?2:0,feet?4:2):feet?[.5,.82]:[.5,.54];
  return slot?.paintPose?enemyMotion.place(mark,slot.paintPose):mark;
 }
 function monsterMuzzle(node){
  const slot=slots.get(node?.id),point=muzzlePoints[slot?.key];
  if(!point||!slot.paintPose)return null;
  const contact=enemyMotion.landmark(slot.key,point,3);
  return enemyMotion.place(contact,slot.paintPose);
 }
 function towerMuzzle(node,origin){
  const slot=slots.get(node?.id);
  if(!slot?.boss||slot.last<0||!slot.emitter)return origin;
  const weight=[0,.14,.6,1,.71,.25][slot.last];
  const contact=enemyMotion.landmark(slot.key,slot.emitter,3);
  const base=origin.map((n,i)=>(.10+n/1.25)*(1-weight)+contact[i]*weight);
  const [x,y]=enemyMotion.place(base,slot.paintPose).map(n=>(n-.1)*1.25);
  const angle=(slot.tilt||0)*Math.PI/180,dx=x-.5,dy=y-.963;
  return [.5+dx*Math.cos(angle)-dy*Math.sin(angle),.963+dx*Math.sin(angle)+dy*Math.cos(angle)];
 }
 function targetMoving(node){const slot=slots.get(node?.id);return !!(slot?.contact||slot?.prep||slot?.distanceX)}
 return {init,sync,advanceWave,targetMark,canvas:node=>{const slot=slots.get(node.id);return slot?.last>=0&&!slot.canvas?.hidden?slot.canvas:null},refreshAppearance,measure,attack,contact,hurt,hitStop,planMelee,emitter,monsterMuzzle,towerMuzzle,isArmed:node=>Object.hasOwn(bladeTips,node?.dataset?.tacticArt),body:node=>slots.get(node?.id)?.body,suspend,targetMoving,heroFrame:skinMotion.heroFrame,swordAngle:skinMotion.swordAngle,stats:()=>({...stats,cache:cache.size,active:[...slots.values()].filter(v=>v.key&&v.last>=0).length})};
})();
const initBeforeActorMotion=initClassesCombat;
initClassesCombat=function(){initBeforeActorMotion();actorMotion.init()};

;
/* ./adventure-orders.js */
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

;
/* ./mission-ui.js */
'use strict';

function progressGauge(label, value, goal) {
 const filled = Math.min(goal, Math.max(0, Number(value) || 0));
 return `<div class="mission-gauge" role="progressbar" aria-label="${safeText(label)}" aria-valuemin="0" aria-valuemax="${goal}" aria-valuenow="${filled}"><i style="width:${100*filled/goal}%"></i><b>${num(filled)} / ${num(goal)}</b></div>`;
}

function objectiveRow({title, icon, value, goal, reward='', action, done=false, claim='', locked=false}) {
 const ready = value >= goal;
 const handler = ready ? claim : action;
 const disabled = done || !handler || locked;
 const label = done ? '수령 완료' : locked ? '한도 달성' : ready ? (claim ? '받기' : '완료') : '이동';
 return `<article class="objective ${done?'is-claimed':ready&&!locked?'is-ready':''}">
  ${art(icon,'objective-icon')}<div class="objective-body"><strong>${safeText(title)}</strong>
  ${progressGauge(title,value,goal)}${reward?`<small>${safeText(reward)}</small>`:''}</div>
  <button class="${ready&&!disabled?'gold-button':'muted-button'}" ${disabled?'disabled':`onclick="${handler}"`}>${label}</button></article>`;
}

missionList=adventureMissionList;
dailyClaim=key=>claimAdventure('daily',key);
weeklyClaim=key=>claimAdventure('weekly',key);

mainQuestPopup=function(){
 const q=Q[s.quest];
 if(!q)return '<p class="empty-state">모든 성장 임무를 완료했습니다.</p>';
 const [value,goal]=questProgress(s.quest),reward=growthQuestReward(s.quest);
 return `<div class="objective-heading"><h3>성장 임무</h3><span>${s.quest+1} / ${Q.length}</span></div>`+
 objectiveRow({title:q[0],icon:RESOURCE_ART[Object.keys(reward)[0]],value,goal,reward:orderRewardText(reward),claim:'claimQuest('+s.quest+')',action:'questDestination()'});
};

const achievementGoals={kills:['몬스터 처치','equipment',"navigate('home')"],cleared:['누적 스테이지 클리어','quests',"navigate('home')"],stage:['최고 스테이지','quests',"navigate('home')"],
 craft:['장비 제작','forgeIcon',"navigate('forge','craft')"],collection:['장비 도감 수집','collection',"navigate('character','collection')"],
 plus:['장비 강화 단계','equipment',"navigate('character','equipment')"]};
achievementsPopup=function(){
 const rows=ACTIVE_ACHIEVEMENT_IDS.map(i=>{
  const [type,title,goal,gems]=ACHIEVEMENTS[i];
  const [task,icon,action]=achievementGoals[type];
  return {title:task,icon,action,goal,value:achieveValue(type),reward:title+' 칭호 · 다이아 '+num(gems),done:!!s.achievements[i],claim:`claimAchievement(${i})`};
 });
 rows.sort((a,b)=>missionPriority(a.value,a.goal,a.done)-missionPriority(b.value,b.goal,b.done));
 const tour=s.nightmareTour,target=nightmareTourTarget();
 const circuit=s.campaignCompleted?objectiveRow({
  title:'악몽 순례 '+num(tour.rounds+1)+'회차',icon:'worldBossGate',value:tour.step,goal:10,
  reward:(target?stageText(target)+' 지역 보스 · ':'')+'다이아 '+NIGHTMARE_TOUR_GEMS+(nightmareTourPaidToday()?' · 오늘 수령 완료':' · 하루 1회'),claim:'claimNightmareTour()',action:'visitNightmareTour()'
 }):'';
 return circuit+rows.map(objectiveRow).join('');
};

function showMissionTab(key){
 missionTab=key;render();$('content').scrollTop=0;
}
function openMissions(key='daily'){missionTab=key;openMenu('quests')}
questsPopup=function(){
 const panes=[['daily','일일'],['weekly','주간'],['main','성장'],['achievements','업적']];
 const links=missionTab==='achievements'?button('칭호',"openMenu('titles')",false,true):'';
 return `<nav class="mission-tabs" aria-label="임무 종류">${panes.map(([id,name])=>`<button aria-pressed="${missionTab===id}" onclick="showMissionTab('${id}')">${name}${rewardDot('quests:'+id)}</button>`).join('')}</nav>`+
 (missionTab==='main'?mainQuestPopup():missionTab==='achievements'?achievementsPopup():missionList(missionTab))+
 (links?'<div class="mission-links">'+links+'</div>':'');
};
EXTRA_POPUPS.quests=['임무',questsPopup];

const guildOrders=[
 ['수비대 웨이브 돌파','guildHall','waves',50],
 ['아레나 대련','arenaHall','arena',4],
 ['월드보스 도전','worldBossGate','worldBoss',3],
 ['광역기로 세 적 동시 타격','skills','volley',35],
 ['재료 던전 클리어','dungeon','dungeon',5]
];
const guildTargets=Object.fromEntries(guildOrders.map(([, ,key,goal])=>[key,goal]));
function guildOrderValue(o,key){
 const d=o.daily;
 if(key==='worldBoss')return d.raid;
 return bounded(d[key]);
}
function guildOrderRows(o){
 return guildOrders.map(([title,icon,key,goal])=>{
  const value=guildOrderValue(o,key);
  return {title,icon,key,value,goal,ready:value>=goal};
 });
}
function guildOrdersDone(o){
 const count=guildOrderRows(o).filter(row=>row.ready).length;
 return o.daily.legacyGuildReady?Math.max(3,count):count;
}
function recordGuildOrder(key,n){
 if(!s.onlineTest?.guild||!['waves','volley','dungeon'].includes(key))return;
 const d=onlineState().daily;d[key]=Math.min(guildTargets[key],bounded(d[key])+n);
}
function guildOrderAction(key){
 if(key==='guild')return "setGuildSection('overview')";
 if(key==='arena'||key==='worldBoss')return "onlineSelect('"+(key==='arena'?'arena':'raid')+"')";
 return "playerMissionGo('"+orderMetrics[key][1]+"')";
}
function guildWeekActivity(g){return g.activityWeek===weekKey()?Math.floor(bounded(g.weeklyActivity)):0}

function guildRosterUI(o){
 const members=guildMembers(o).sort((a,b)=>Number(!!b.self)-Number(!!a.self));
 return `<div class="guild-roll"><div class="roll-head"><span>이름</span><span>주간 기여</span><span>직위</span></div>
 ${members.length?'':communityRecords.message('roster','등록된 길드원이 없습니다.')}${members.map(m=>`<button class="roll-member" onclick="openMenu('guildMember','${m.id}')"><span>${guildAvatar(m)}<b>${safeText(m.name)}<small>${m.self?'나':(m.level?'Lv.'+num(m.level):'')}</small></b></span><strong>${m.self?num(guildWeekActivity(guildProfile(o))):'—'}</strong><span>${GUILD_ROLES[m.role]}</span></button>`).join('')}</div>`;
};
function guildMissionsUI(o){
 const completed=guildOrdersDone(o),claimed=o.daily.mission;
 return `<div class="objective-heading"><h3>길드 임무 3개 달성</h3><span>매일 9시 · 한국</span></div>
 <div class="guild-bounty">${progressGauge('길드 임무 달성',completed,3)}<div><span>길드 코인 20 · 성운석 20 · 강화석 20</span>${button(claimed?'수령 완료':'보상 받기',"onlineAct('mission')",claimed||completed<3)}</div></div>
 ${o.daily.legacyGuildReady&&!claimed?'<p>이전 임무 달성 보상을 받을 수 있습니다.</p>':''}${guildOrderRows(o).map(row=>renderOrder(row,'',guildOrderAction)).join('')}`;
};
function setGuildSection(key){
 if(!['overview','missions','members'].includes(key))return;
 guildSection=key;render();$('content').scrollTop=0;
};
onlineGuildUI=function(o){
 if(!o.guild)return `<div class="guild-join"><div class="guild-sign">${art('guildHall')}<div><h3>별빛 기사단</h3><span>공개 길드</span></div></div>
 ${button('가입하기',"changeChatGuild('join','별빛 기사단')")}
 <label for="guildName">길드 이름</label><div><input id="guildName" data-live-input="true" maxlength="12" autocomplete="off" placeholder="길드 이름 (1~12자)" value="${safeText(onlineGuildDraft)}" oninput="onlineGuildDraft=this.value">${button('가입',"changeChatGuild('join',$('guildName').value)")}${button('창설',"changeChatGuild('create',$('guildName').value)",false,true)}</div></div>`;
 const g=guildProfile(o),growth=guildGrowth(g.xp),count=guildMembers(o).length;
 const sections=[['overview','정보'],['members','길드원'],['missions','임무']];
 const nav=`<nav class="mission-tabs" aria-label="길드 메뉴">${sections.map(([id,n])=>`<button aria-pressed="${guildSection===id}" onclick="setGuildSection('${id}')">${n}${id==='missions'&&!o.daily.mission&&guildOrdersDone(o)>=3?'<i class="claim-dot" aria-label="보상 수령 가능"></i>':''}</button>`).join('')}</nav>`;
 if(guildSection==='members')return nav+guildRosterUI(o);
 if(guildSection==='missions')return nav+guildMissionsUI(o);
 return nav+`<div class="guild-sign">${art('guildHall')}<div><h3>${safeText(o.guild)}</h3><span>Lv.${growth.level} · ${count||'—'}/30명 · ${GUILD_ROLES[g.role]}</span></div></div>
 <div class="guild-level"><b>길드 경험치</b>${growth.need?progressGauge('길드 경험치',growth.progress,growth.need):'<strong>최고 레벨</strong>'}</div>
 <section class="notice-slip"><div><b>길드 공지</b>${g.role==='leader'?button('수정','openGuildNotice()',false,true):''}</div><p>${safeText(communityRecords.guildNotice(o.guild))}</p></section>
 <section class="guild-giving"><div><strong>길드 기부</strong><small>500골드 → 길드 코인 20</small></div>${button(o.daily.donated?'기부 완료':s.gold<500?'골드 부족':'기부',"onlineAct('donate')",o.daily.donated||s.gold<500)}</section>
 <div class="guild-foot"><span>보유 코인 <b>${num(o.guildCoins)}</b></span><button onclick="openMenu('guildLeave')">길드 탈퇴</button></div>`;
};
const nonGuildOnline=onlinePopup;
onlinePopup=function(){
 if(tab==='arena'||tab==='raid')return nonGuildOnline();
 const back=popupStack.some(p=>p.view==='havenShop')?'<button class="haven-return" onclick="returnToHavenShop()"><ui-mark data-shape=chevron-left aria-hidden=true></ui-mark> 성운의 상점</button>':'';
 return back+onlineGuildUI(OnlineService.snapshot());
};
EXTRA_POPUPS.online=[()=>({arena:'아레나',raid:'월드보스'}[tab]||'길드'),onlinePopup];

GAME_NOTICES.unshift({id:'guild-missions-menu-v18',date:'2026.11.10',tag:'모험',title:'길드와 임무 개편',body:'길드 임무 다섯 가지 중 세 가지를 달성하면 보상을 받습니다. 모험 화면의 임무에서 일일 목표와 선택 임무의 진행도를 확인하세요. 랭킹은 전체 메뉴에서 열 수 있습니다.'});

GAME_NOTICES.unshift({id:'adventure-orders-v19',date:'2026.11.11',tag:'모험',title:'모험 의뢰와 활약도 보상',body:'일일·주간 의뢰를 한 줄씩 확인하세요. 활약도 100 보상은 일일 의뢰 5개, 주간 의뢰 10개를 수령하면 열립니다. 시즌 임무와 시즌 포인트는 시즌패스에서 확인하세요.'});

;
/* ./gear-selection.js */
'use strict';

let bagSalvageSelection=null;
function canSalvage(g){return !!g&&!g.locked&&s.equipped[g.p]!==g.id}
function salvageStones(g){return (g.r+1)*2+g.plus*3}

function dismantleGear(ids){
 const removed=s.gear.filter(g=>ids.has(g.id)&&canSalvage(g));
 if(!removed.length)return {count:0,stones:0,iron:0};
 const used=new Set(removed.map(g=>g.id));
 const stones=removed.reduce((sum,g)=>sum+salvageStones(g),0);
 s.gear=s.gear.filter(g=>!used.has(g.id));
 s.stones+=stones;recordWheelGoal('salvage',removed.length);
 const iron=removed.reduce((total,g)=>total+salvageIron(g),0);s.starIron+=iron;
 for(const batch of new Set([lastLoot,s.lastLoot,resultSnapshot?.loot])){
  for(const item of batch||[])if(used.has(item.id))item.salvaged=true;
 }
 return {count:removed.length,stones,iron};
}
function gearSelection(){
 if(view==='inventory')return bagSalvageSelection;
 if(view==='loot'&&resultSnapshot?.view==='loot')return resultSnapshot.selected;
 return null;
}
function startBagSelection(){if(view==='inventory'){bagSalvageSelection=new Set();render()}}
function cancelBagSelection(){bagSalvageSelection=null;render()}
function matchesBagFilters(g){
 return (inventoryPart<0||g.p===inventoryPart)&&(inventorySet<0||g.set===inventorySet);
}
function refreshBagFilter(){
 if(bagSalvageSelection){
  bagSalvageSelection=new Set(s.gear.filter(g=>matchesBagFilters(g)&&canSalvage(g)&&bagSalvageSelection.has(g.id)).map(g=>g.id));
 }
 render();
}
function bagPickOptions(ids){
 const items=s.gear.filter(g=>matchesBagFilters(g)&&canSalvage(g));
 const all=items.length>0&&items.every(g=>ids.has(g.id));
 return {items,all,label:all?'전체 해제':'전체 선택'};
}
function toggleBagPickAll(){
 const ids=bagSalvageSelection;
 if(view!=='inventory'||!ids)return;
 const {items,all}=bagPickOptions(ids);
 for(const g of items){
  if(all)ids.delete(g.id);else ids.add(g.id);
 }
 updateGearSelection(ids);
}
function selectionSummary(ids){
 const items=s.gear.filter(g=>ids.has(g.id)&&canSalvage(g));
 return {count:items.length,stones:items.reduce((sum,g)=>sum+salvageStones(g),0),iron:items.reduce((sum,g)=>sum+salvageIron(g),0)};
}
function salvageButtonLabel(count,bag){
 if(count)return count+'개 분해';
 return bag?'분해':'선택 분해';
}
function salvageBar(ids,bag=false){
 const {count,stones,iron}=selectionSummary(ids);
 const options=bag?bagPickOptions(ids):null;
 const bulk=bag?`<button type="button" class="muted-button" data-bag-pick-all onclick="toggleBagPickAll()" ${options.items.length?'':'disabled'}>${options.label}</button>`:'';
 return `<div class="salvage-bar${bag?' bag-salvage-bar':''}"><span data-salvage-total aria-live="polite">${count?'강화석 +'+num(stones)+(iron?' · 별철 +'+num(iron):''):'분해할 장비 선택'}</span>${bag?'<button class="muted-button bag-salvage-cancel" onclick="cancelBagSelection()">취소</button>':''}${bulk}<button class="gold-button" data-salvage-submit onclick="salvagePicked()" ${count?'':'disabled'}>${salvageButtonLabel(count,bag)}</button></div>`;
}
function equipmentTile(item,owned,ids=null,slot=false,comparison=null){
 const selecting=ids!==null,enabled=selecting?canSalvage(owned)&&!item.salvaged:!!owned;
 const worn=!!owned&&s.equipped[owned.p]===owned.id;
 const state=item.salvaged?'분해 완료':!owned?'보관 종료':worn?'착용 중':owned.locked?'잠금':'';
 const level=slot?'+'+gearEnhancement(owned||item):'';
 const label=equipmentTitle(item)+' · '+RAR[item.r]+(slot?' · '+level:'')+(state?' · '+state:'');
 const mark=item.salvaged?'−':!owned?'−':worn?'착용':owned.locked?skillLock():'';
 return equippedTileButton({
  title:equipmentTitle(item),label:label+(comparison?' · '+comparison.text:''),comparison,grade:item.r,icon:gearArt(item),mark,level,worn,
  action:selecting?'toggleGearPick(this.dataset.gearId)':"openMenu('gearDetail',this.dataset.gearId)",
  attributes:`data-gear-id="${safeText(item.id)}" ${selecting?`aria-pressed="${enabled&&ids.has(item.id)}"`:''} ${enabled?'':'disabled'}`,selecting
 });
}
function equippedTileButton({title,label,grade,icon,mark,level,worn,action,attributes='',selecting=false,comparison=null}){
 return `<button type="button" class="collection-tile equipment-tile ${selecting?'picking':''} ${worn?'worn':''}" ${attributes} aria-label="${safeText(label)}" onclick="${action}"><span class="tile-art rar${grade}" style="--rim:currentColor">${icon}${mark?`<i class="tile-mark">${mark}</i>`:''}${level?`<b class="tile-level">${level}</b>`:''}</span><span class="tile-name">${safeText(title)}</span>${comparison?`<small class="gear-delta" data-direction="${comparison.direction}">${comparison.text}</small>`: ''}</button>`;
}
function toggleGearPick(id){
 const ids=gearSelection();
 const item=s.gear.find(g=>g.id===id);
 if(!ids||!canSalvage(item)||(view==='inventory'&&!matchesBagFilters(item)))return false;
 if(view==='loot'&&!resultSnapshot.loot.some(g=>g.id===id&&!g.salvaged))return false;
 if(ids.has(id))ids.delete(id);else ids.add(id);
 updateGearSelection(ids);
 return true;
}
function updateGearSelection(ids){
 const panel=$('content'),{count,stones,iron}=selectionSummary(ids);
 if(view==='inventory'){
  const {items,label}=bagPickOptions(ids),bulk=panel.querySelector('[data-bag-pick-all]');
  if(bulk){bulk.disabled=!items.length;bulk.textContent=label}
 }
 for(const card of panel.querySelectorAll('[data-gear-id]'))card.setAttribute('aria-pressed',String(ids.has(card.dataset.gearId)&&!card.disabled));
 const submit=panel.querySelector('[data-salvage-submit]');
 if(submit){submit.disabled=!count;submit.textContent=salvageButtonLabel(count,view==='inventory')}
 const total=panel.querySelector('[data-salvage-total]');
 if(total)total.textContent=count?'강화석 +'+num(stones)+(iron?' · 별철 +'+num(iron):''):'분해할 장비 선택';
}
function salvagePicked(){
 const ids=gearSelection();
 if(!ids||!ids.size)return false;
 const {count,stones,iron}=dismantleGear(ids);ids.clear();
 if(view==='inventory')bagSalvageSelection=null;
 if(view==='loot')refreshForgeReceipt();
 if(count)save();
 paint();
 if(count)notice(count+'개 분해 · 강화석 +'+num(stones)+(iron?' · 별철 +'+num(iron):''));
 return count>0;
}
function refreshForgeReceipt(){
 const receipt=resultSnapshot;
 if(receipt?.view!=='loot')return;
 const panel=$('content'),scroll=panel.scrollTop;
 panel.classList.add('result-settled');
 panel.innerHTML=lootUI(receipt.loot,receipt.action,receipt.selected);
 hydrateArt(panel);receipt.html=panel.innerHTML;panel.scrollTop=scroll;
}

function normalizeGearSlots(state,raw={}){
 const saved=Array.isArray(raw?.gearSlotLevels)?raw.gearSlotLevels:[];
 state.gearSlotLevels=PARTS.map((_,part)=>part?Math.floor(bounded(saved[part],0,15)):0);
 state.gear=state.gear.map(item=>{
  if(!item.p||!item.plus)return item; // Old weapons use their own migration.
  state.gearSlotLevels[item.p]=Math.max(state.gearSlotLevels[item.p],item.plus);
  return {...item,plus:0};
 });
 state.highestGearPlus=Math.max(state.highestGearPlus||0,...state.gearSlotLevels);
 const validEntry=/^[0-6]:(?:[0-9]|10):(?:-1|[0-9]|1[0-4])$/;
 state.showcaseEntries=Object.fromEntries(Object.entries(recordMap(raw?.showcaseEntries)).filter(([key,value])=>validEntry.test(key)&&value===true));
 // At the former cap, each craft continued to accumulate experience.
 addForgeExperience(state,0);
 return state;
}
const starterBeforeGearSlots=starter,migrateBeforeGearSlots=migrate;
starter=function(){return normalizeGearSlots(starterBeforeGearSlots())};
migrate=function(raw){return normalizeGearSlots(migrateBeforeGearSlots(raw),raw)};

function gearEnhancement(item){
 return item.p===0?item.plus:(s?.gearSlotLevels?.[item.p]??0);
}
const SLOT_GOLD_COSTS=[
 // +1…+10: 1.5 times base gold from 3n kills at stage 1+10(n-1) and one tier-n gold dungeon.
 251,921,2214,4008,6533,9747,13409,17976,23328,29235,
 // +11…+15: smaller price increases to reach 60,000 gold for the final upgrade.
 35200,41200,47300,53500,60000
];
function slotUpgradeCost(level){
 const next=level+1;
 const lateSteps=Math.max(0,next-5);
 // Past +5, each step adds five more stones to the previous step's increase.
 const stones=10*next+5*lateSteps*(lateSteps+1)/2;
 const gold=SLOT_GOLD_COSTS[Math.min(level,SLOT_GOLD_COSTS.length-1)];
 return {gold,stones};
}
function improveGearSlot(part,maximum=false){
 if(!Number.isInteger(part)||part<1||part>=PARTS.length)return false;
 let count=0;
 while(s.gearSlotLevels[part]<15){
  const cost=slotUpgradeCost(s.gearSlotLevels[part]);
  if(s.gold<cost.gold||s.stones<cost.stones)break;
  s.gold-=cost.gold;s.stones-=cost.stones;s.gearSlotLevels[part]++;count++;
  if(!maximum)break;
 }
 if(!count){notice(s.gearSlotLevels[part]>=15?'슬롯 최대 강화입니다':'강화 재료가 부족합니다');return false}
 s.highestGearPlus=Math.max(s.highestGearPlus,s.gearSlotLevels[part]);
 s.daily.upgrades=(s.daily.upgrades||0)+count;
 save();paint();return true;
}
EXTRA_POPUPS.gearSlot=['빈 장비 슬롯',()=>{
 const part=Number(tab);if(!Number.isInteger(part)||part<1||part>=PARTS.length)return '';
 const level=s.gearSlotLevels[part],cost=slotUpgradeCost(level);
 return gearMaterialHUD(part)+'<div class="popup-hero">'+gearArt({p:part,r:0})+'<h3>'+PARTS[part]+' +'+level+'</h3><p>같은 부위의 모든 장비에 적용됩니다.</p></div>'+
 '<div class="action-row">'+button(level>=15?'슬롯 최대 강화':'슬롯 강화<small>'+num(cost.gold)+' 골드 · '+num(cost.stones)+' 강화석</small>','improveGearSlot('+part+')',level>=15||s.gold<cost.gold||s.stones<cost.stones)+
 button('가방에서 장비 선택','inventoryPart='+part+';openMenu(\'inventory\')',false,true)+'</div>';
}];

const showcaseKey=g=>g.p+':'+g.r+':'+g.set;
function canShowcaseGear(g){
 return g?.p>0&&canSalvage(g)&&!s.showcaseEntries[showcaseKey(g)]&&s.showcase[g.p]<SHOWCASE_CAP;
}
function showcaseCandidates(){
 const byKind=new Map();
 for(const g of s.gear){
  const key=showcaseKey(g);
  if(canShowcaseGear(g)&&!byKind.has(key))byKind.set(key,g);
 }
 return [...byKind.values()].sort((a,b)=>a.p-b.p||b.r-a.r||a.set-b.set);
}
let showcaseSelection=new Set();
function beginShowcasePicker(){
 showcaseSelection=new Set();
 openMenu('showcasePicker');
}
function eligibleShowcasePicks(items){
 const room=s.showcase.map(n=>SHOWCASE_CAP-n),selected=new Set();
 for(const item of items){
  if(room[item.p]<=0)continue;
  selected.add(item.id);room[item.p]-=item.r+1;
 }
 return selected;
}
function toggleShowcaseAll(){
 if(view!=='showcasePicker')return;
 const candidates=showcaseCandidates(),all=eligibleShowcasePicks(candidates);
 showcaseSelection=all.size&&[...all].every(id=>showcaseSelection.has(id))?new Set():all;render();
}
function toggleShowcasePick(id){
 if(view!=='showcasePicker')return;
 const items=showcaseCandidates();
 if(!items.some(g=>g.id===id))return;
 if(showcaseSelection.has(id))showcaseSelection.delete(id);
 else {
  const picked=items.filter(g=>showcaseSelection.has(g.id));picked.push(items.find(g=>g.id===id));
  if(!eligibleShowcasePicks(picked).has(id)){notice('이 부위의 진열 점수가 가득 찹니다');return}
  showcaseSelection.add(id);
 }
 render();
}
function registerShowcase(ids){
 const byId=new Map(s.gear.map(g=>[g.id,g])),used=new Set();
 for(const id of ids){
  const g=byId.get(id);if(!g||used.has(id)||!canShowcaseGear(g))continue;
  const points=Math.min(g.r+1,SHOWCASE_CAP-s.showcase[g.p]);
  s.showcase[g.p]+=points;
  s.showcaseEntries[showcaseKey(g)]=true;used.add(g.id);
 }
 if(!used.size)return 0;
 s.gear=s.gear.filter(g=>!used.has(g.id));
 save();paint();
 return used.size;
}
function confirmShowcasePicks(){
 if(view!=='showcasePicker'||!showcaseSelection.size)return;
 const used=registerShowcase(showcaseSelection);
 showcaseSelection.clear();
 if(used)closeMenu();else render();
}
EXTRA_POPUPS.showcaseHelp=['진열장 안내',()=>{
 return '<p class="small">부위·등급·세트가 같은 장비는 1개만 소모합니다. 착용·잠금 장비는 보호됩니다.</p>'+
  '<p class="small">1점당 영구 공격력 +0.003% · 부위당 최대 '+num(SHOWCASE_CAP)+'점</p>'+
  (s.legacyShowcasePower?'<p class="small">이전 진열 보너스 +'+(s.legacyShowcasePower*100).toFixed(3)+'%</p>':'');
}];
EXTRA_POPUPS.showcasePicker=['진열할 장비 선택',()=>{
 const candidates=showcaseCandidates();
 const selected=candidates.filter(g=>showcaseSelection.has(g.id)).length;
 const tiles=candidates.map(g=>equippedTileButton({
  title:equipmentTitle(g),label:equipmentTitle(g)+' · '+RAR[g.r]+' · '+(REGION_SETS[g.set]||'기본 장비'),grade:g.r,
  icon:gearArt(g),mark:'',level:REGION_SETS[g.set]||'기본 장비',worn:false,selecting:true,
  action:'toggleShowcasePick(this.dataset.showcaseId)',
  attributes:'data-showcase-id="'+safeText(g.id)+'" aria-pressed="'+showcaseSelection.has(g.id)+'"'
 })).join('');
 const all=eligibleShowcasePicks(candidates),filled=all.size>0&&[...all].every(id=>showcaseSelection.has(id));
 return '<div class="showcase-pick-bar"><span>'+selected+'개 선택</span>'+button(filled?'전체 해제':'전체 선택','toggleShowcaseAll()',!all.size,true)+button('확인 · 진열','confirmShowcasePicks()',!selected)+'</div>'+
  (tiles?'<div class="collection-grid4 showcase-grid">'+tiles+'</div>':'<div class="empty-state">등록할 새 장비가 없습니다.</div>');
}];

;
/* ./world-boss-motion.js */
'use strict';

function raidContactGlint(field,x,y,strong){
 if(!field||document.hidden||!motionAllowed())return;
 const glint=document.createElement('i');
 glint.className='raid-contact-glint'+(strong?' strong':'');
 glint.setAttribute('aria-hidden','true');glint.style.left=x;glint.style.top=y;
 field.appendChild(glint);
 setTimeout(()=>glint.remove(),strong?200:110);
 if(strong)shakeImpactStage(field);
}

let worldBossFlameImage;
function loadWorldBossFlame(){
 if(!worldBossFlameImage || (worldBossFlameImage.complete&&!worldBossFlameImage.naturalWidth)){
  worldBossFlameImage=new Image();
  worldBossFlameImage.decoding='async';
  worldBossFlameImage.src='./assets/world-boss-breath.webp';
 }
 return worldBossFlameImage;
}

// Stage coordinates include the two ground planes. Only the encounter clock resolves combat.
function createWorldBossMotion(stage,onImpact) {
 const hero=stage.querySelector('.wb-player'), boss=stage.querySelector('.wb-dragon');
 const cel=stage.querySelector('.wb-rig'), layer=stage.querySelector('.wb-trails');
 const ctx=layer.getContext('2d'), brush=cel.getContext('2d');
 if(!ctx?.createRadialGradient||!brush?.drawImage)return null;
 const dragon=boss.querySelector('img'),petNode=stage.querySelector('.wb-pet');
 let companionBox=null;
 const body=document.createElement('canvas'),bodyBrush=body.getContext('2d'),poses=new Image();
 const lips=[[.064,.542],[.092,.326],[.084,.456],[.066,.552],[.051,.453],[.066,.511]];
 const mouths=lips.map((lip,i)=>enemyMotion.landmark('world-guardian',lip,i));
 let lastBody=-1,lastRevision=-1;
 body.className='wb-guardian-pose';body.width=512;body.height=384;body.hidden=true;body.setAttribute('aria-hidden','true');boss.appendChild(body);
 poses.decoding='async';if(motionAllowed())poses.src='./assets/enemy-motion/world-guardian.webp';
 const job=s.classId, outfit=job+'-'+outfitRigRank();
 const pad=weaponFramePadding(job);
 cel.width=cel.height=512+2*pad;
 cel.classList.toggle('greatsword-cel',job==='warrior');
 const rig=SKIN_RIGS[outfit], image=new Image();
 let ready=false, disposed=false, raf=0, move=null, dx=0,dy=0, breathAt=Infinity, lastFire=-Infinity, struckAt=-Infinity, strikeWeight=0;
 let piercingHeading=0,muzzle=null,poseTime,poseIndex,poseWeapon,poseSkin,poseDepth,heroRevision,materialFrame, pending=[],width,height,unit;
 let h,b,heroRotation=0;
 const clamp=t=>Math.max(0,Math.min(1,t));
 const fade=t=>{t=clamp(t);return t*t*(3-2*t)};
 const clock=()=>performance.now(),posesClock=createActorMotionClock();
 let breathPoseAt=Infinity,lastFirePose=-Infinity;
 function size(){
  width=stage.clientWidth;height=stage.clientHeight;
  if(!width||!height)return;
  const ratio=Math.min(2,window.devicePixelRatio||1);
  layer.width=Math.round(width*ratio);layer.height=Math.round(height*ratio);ctx.imageSmoothingQuality='high';
  ctx.setTransform(ratio,0,0,ratio,0,0);unit=width/390;
  const box=n=>({x:n.offsetLeft,y:n.offsetTop,w:n.offsetWidth,h:n.offsetHeight});
  h=box(hero);b=box(boss);companionBox=petNode?box(petNode):null;
 }
 const observer=new ResizeObserver(size);observer.observe(stage);size();
 if(rig){
  image.decoding='async';
  image.onload=()=>{if(disposed)return;ready=true;paintPose(null,false);wake()};
  selectedWeaponAppearance(job)?.loaded.then(()=>{if(!disposed&&!motionAllowed())paintPose(null,false)});
  if(typeof weaponDepth!=='undefined')weaponDepth.readyFor(outfit,selectedWeaponAppearance(job)).then(()=>{if(!disposed&&!motionAllowed())paintPose(null,false)});
  Promise.all([secondaryMotion.ready(outfit),twilightRain.ready(outfit),paladinMotion.ready(outfit)]).then(()=>{if(!disposed&&ready&&!motionAllowed())paintPose(null,false)});
  image.src=heroRigURL(outfit);
 }
 function paintPose(time,ranged,movement=null){
  if(!ready)return;
  const body=ranged&&job!=='mage'&&job!=='archer'?'mage':job;
  const index=time===null?0:skinMotion.poseIndex(skinMotion.heroFrame(body,time,move?.hits||1));
  const replacement=selectedWeaponAppearance(job),weapon=replacement?.ready?replacement.image:null;
  const depth=typeof weaponDepth!=='undefined'?weaponDepth.version():0;
  const moving=!!move||!!movement?.hurt;
  const now=movement?.now||0,idleFrame=movement?.animate&&!moving?Math.floor(now*30/1000):'';
  const stamp=secondaryMotion.stamp(outfit,hero,now,moving,movement?.animate)+'|'+idleFrame;
  if(materialFrame===stamp&&heroRevision===enemyUnity.revision(5)&&poseTime===time&&poseIndex===index&&poseWeapon===weapon&&poseSkin===replacement?.skin&&poseDepth===depth)return;
  materialFrame=stamp;poseWeapon=weapon;poseSkin=replacement?.skin;poseDepth=depth;heroRevision=enemyUnity.revision(5);
  brush.clearRect(0,0,cel.width,cel.height);
  brush.save();brush.translate(pad,pad);
  muzzle=skinMotion.paintActor(brush,image,rig,outfit,index,time,move?.hits||1,ranged,replacement,0,move?.skillId??-1,null,movement);
  brush.restore();poseTime=time;poseIndex=index;hero.classList.add('wb-rig-ready');
 }
 function target(){return {x:b.x+b.w*.28,y:b.y+b.h*.67}}
 function actorMotion(now){
  const m=move;
  let t=m?(now-m.start)/m.factor:650,rotation=0;
  dx=dy=0;
  if(m&&t<650){
   const p=m.path;while(m.index+2<p.length&&p[m.index+1][0]<=t)m.index++;
   const a=p[m.index],z=p[m.index+1],f=clamp((t-a[0])/(z[0]-a[0]));
   const mix=k=>a[k]+(z[k]-a[k])*f, carry=1-fade(t/200);
   dx=mix(1)+m.originX*carry;rotation=mix(2);
   dy=mix(3)+m.originY*carry+(m.reach?Math.max(0,mix(1)/m.reach)*m.rise:0);
  }else{
   move=null;
   const cycle=now/570;
   rotation=.82*Math.sin(cycle)+.34*Math.sin(cycle*.43);
   dx=h.w*.0035*Math.sin(cycle*.64);
  }
  // The fire impact bends the player's stance without interrupting their current swing.
  const hurt=clamp((now-lastFirePose)/390),brace=Math.sin(hurt*Math.PI)*(1-hurt);
  dx-=h.w*.09*brace;dy-=h.w*.025*brace;rotation-=5*brace;
  heroRotation=rotation*Math.PI/180;
  paintPose(move?t:null,!!move?.ranged,{owner:hero,now,animate:true,x:512*dx/h.w,y:512*dy/h.w,lean:rotation,hurt:brace>.001});
  hero.style.transform='translate3d('+dx.toFixed(2)+'px,'+dy.toFixed(2)+'px,0) rotate('+rotation.toFixed(2)+'deg)';
 }
 let atlas=motionAllowed()?loadWorldBossFlame():null;
 const plume=document.createElement('canvas');plume.width=512;plume.height=192;
 const ink=plume.getContext('2d');
 // A small radial light illuminates the existing scene under the painted fire.
 const light=document.createElement('canvas');light.width=light.height=64;
 const lamp=light.getContext('2d'),halo=lamp.createRadialGradient(32,32,0,32,32,32);
 halo.addColorStop(0,'#ffd386');halo.addColorStop(.22,'rgba(255,139,46,.7)');
 halo.addColorStop(.6,'rgba(235,68,19,.26)');halo.addColorStop(1,'rgba(210,51,12,0)');
 lamp.fillStyle=halo;lamp.fillRect(0,0,64,64);
 function illuminate(x,y,rx,ry,opacity){
  ctx.globalAlpha=clamp(opacity);
  ctx.drawImage(light,x-rx,y-ry,2*rx,2*ry);
 }
 function paintFlame(elapsed,x,y,vx,vy,front,tail,strength){
  if(!atlas?.naturalWidth||front<=0||tail>=1)return;
  // Sixteen premultiplied-alpha cels, packed four across. The emission point is
  // at 5% of each cel; keep it fixed while the expanding head travels forward.
  const frame=Math.floor(elapsed*32/1000)%16;
  const sw=atlas.naturalWidth/4,sh=atlas.naturalHeight/4,sx=frame%4*sw,sy=Math.floor(frame/4)*sh;
  const length=Math.hypot(vx,vy)*front/.80;
  const girth=length*.47*(1+.06*Math.sin(elapsed*.021));
  let texture=atlas,ox=sx,oy=sy;
  if(tail>0){
   ink.clearRect(0,0,sw,sh);ink.drawImage(atlas,sx,sy,sw,sh,0,0,sw,sh);
   const fadeEnd=tail*1.14;
   const mask=ink.createLinearGradient((fadeEnd-.18)*sw,0,fadeEnd*sw,0);
   mask.addColorStop(0,'transparent');mask.addColorStop(1,'#fff');
   ink.globalCompositeOperation='destination-in';ink.fillStyle=mask;ink.fillRect(0,0,sw,sh);
   ink.globalCompositeOperation='source-over';texture=plume;ox=oy=0;
  }
  ctx.save();ctx.translate(x,y);ctx.rotate(Math.atan2(vy,vx));
  // Keep the buoyant edge above the jet even when the boss fires to the left.
  if(vx<0)ctx.scale(1,-1);
  ctx.globalAlpha=strength;ctx.drawImage(texture,ox,oy,sw,sh,-length*.05,-girth*.59,length,girth);ctx.restore();
 }
 function fire(now){
  const until=breathAt-now,since=now-lastFire,lasting=since>=0&&since<1060;
  const poseNow=posesClock.now(now),untilPose=breathPoseAt-poseNow,sincePose=poseNow-lastFirePose;
  const wind=untilPose>=220?fade((940-untilPose)/720):1-fade((220-untilPose)/120);
  const breathing=sincePose>=0&&sincePose<1060,idle=Math.sin(poseNow/670);
  // Pivot the intact portrait at its feet. Use the same rigid transform for the mouth.
  const pos=breathing?3.55+2.45*fade(sincePose/1060):untilPose>=940?0:untilPose>=220?3*fade((940-untilPose)/720):3+.55*fade((220-untilPose)/220);
  const pose=enemyMotion.sample('world-guardian',pos);
  const painted=bodyBrush&&poses.complete&&poses.naturalWidth>0;
  if(painted&&(pos!==lastBody||lastRevision!==enemyUnity.revision(3))){
   bodyBrush.clearRect(0,0,512,384);enemyMotion.paint(bodyBrush,poses,'world-guardian',3,pose,0,0,512,384);
   lastBody=pos;lastRevision=enemyUnity.revision(3);body.hidden=false;dragon.style.visibility='hidden';
  }
  const loading=breathing?0:wind;
  const thrust=breathing?1-fade(sincePose/850):untilPose<220?fade((220-untilPose)/220):0;
  const step=breathing?Math.sin(Math.PI*fade((sincePose-160)/820)):0;
  const breath=.5+.5*idle;
  const recovery=clamp((poseNow-struckAt)/240),recoil=strikeWeight*Math.sin(recovery*Math.PI)*(1-recovery);
  const tx=b.w*(.025*recoil+.004*Math.sin(poseNow/1170)+.021*loading-.052*thrust+.017*step),ty=b.h*(-.025*loading+.013*thrust-.009*step-.004*breath);

  const angle=1.18*idle+2.8*recoil+2.35*loading-3.25*thrust+1.4*step,rot=angle*Math.PI/180;
  (painted?body:dragon).style.transform='translate('+tx.toFixed(2)+'px,'+ty.toFixed(2)+'px) rotate('+angle.toFixed(3)+'deg)';
  if(!lasting&&until>940)return;
  const mouth=painted?enemyMotion.place(mouths[pose.frame],pose,512/384):mouths[0],mx=(mouth[0]-.62)*b.w,my=(mouth[1]-.95)*b.h;
  const x=b.x+tx+.62*b.w+mx*Math.cos(rot)-my*Math.sin(rot);
  const y=b.y+ty+.95*b.h+mx*Math.sin(rot)+my*Math.cos(rot);
  const charge=!lasting&&until>220;
  const elapsed=lasting?220+since:Math.max(0,220-until);
  const front=charge?0:fade(elapsed/220);
  const tail=lasting?fade((since-565)/495):0;
  // Aim down the player's lane. A melee lunge into the cone does not shorten it.
  const vx=h.x+h.w*.43-x,vy=h.y+h.h*.51-y;
  const intensity=charge?wind:(1-tail);
  ctx.save();ctx.globalCompositeOperation='lighter';
  illuminate(x,y,(6+19*intensity)*unit,(5+14*intensity)*unit,intensity*.84);
  if(charge){
   for(let i=0;i<9;i++){
    const t=(now/530+i/9)%1,theta=i*2.40+t*.52,dist=(1-t)*28*unit;
    illuminate(x+Math.cos(theta)*dist,y+Math.sin(theta)*dist,1.8*unit,1.1*unit,wind*t);
   }
  }else{
   const arrival=lasting?fade(since/100):0;
   illuminate(x+vx,y+vy+14*unit,48*unit,17*unit,arrival*(1-tail)*.66);
  }
  ctx.restore();
  if(charge)return;
  paintFlame(elapsed,x,y,vx,vy,front,tail,1-.37*tail);
  if(!lasting)return;
  const scorch=(since-35)/640;
  combatEffects.cell(ctx,'fire',scorch,x+vx*(1+.025*clamp(scorch)),y+vy-9*unit,86*unit,70*unit,0,.90);
  combatEffects.cell(ctx,'earth',(since-180)/660,x+vx+8*unit,y+vy+8*unit,100*unit,49*unit,0,.76);
  // Ejected sparks rise independently after the jet cuts out.
  ctx.save();ctx.globalCompositeOperation='lighter';
  for(let i=0;i<15;i++){
   const age=(since-17*i)/(440+i*19);if(age<=0||age>=1)continue;
   const scatter=Math.sin(i*2.4),distance=1+.25*age*scatter;
   const px=x+vx*distance+Math.sin(i*1.8)*13*unit*age;
   const py=y+vy*distance+(Math.cos(i*2.1)*9-35*age)*unit;
   illuminate(px,py,(3-age)*unit,(1.9-age)*unit,Math.sin(Math.PI*age)*.87);
  }
  ctx.restore();
 }
 function projectile(m,now){
  if(!m?.ranged||m.self)return;
  const t=(now-m.realStart)/m.factor, release=rangedCombat.releaseTime(job,m.skillId);
  const bowPoint=(tip=muzzle)=>{
   const x=h.w*((tip?tip[0]/512:.76)-.52),y=h.h*((tip?tip[1]/512:.38)-.90);
   return {x:h.x+dx+h.w*.52+x*Math.cos(heroRotation)-y*Math.sin(heroRotation),
    y:h.y+dy+h.h*.90+x*Math.sin(heroRotation)+y*Math.cos(heroRotation)};
  };
  if(t<release){if(job==='archer')m.nock=bowPoint();return}
  const z=combatEffects.ground(m.skillId)?{x:b.x+b.w*.42,y:b.y+b.h*.92}:target();
  if(job==='archer'||m.skillId>=0){
   m.origins??=[];
   for(let i=0;i<m.hits;i++){
    const age=t-i*70;
    const tail=job==='archer'?archerFlight.tailMs(m.skillId):0,linger=tail||65;
    if(age<release||age>270+linger)continue;
    m.origins[i]??=m.skillId===57?bowPoint(twilightRain.releaseTip(outfit)||muzzle):(i===0&&m.nock)||bowPoint();
    if(m.skillId===18)piercingHeading=Math.atan2(z.y-m.origins[i].y,z.x-m.origins[i].x);
    const progress=clamp((age-release)/(270-release)),after=clamp((age-270)/linger),opacity=1-after;
    if(job==='archer')rangedCombat.drawArrow(ctx,m.origins[i],z,progress+(tail?.69*after:0),m.ranged,width,opacity,m.skillId,i);
    else rangedCombat.spellFlight(ctx,m.origins[i],z,progress,m.ranged,width,opacity,m.skillId,i);
   }
   return;
  }
  if(t>=270)return;
  m.from??=bowPoint();
  const a=m.from,p=clamp((t-release)/(270-release));
  const x=a.x+(z.x-a.x)*p,y=a.y+(z.y-a.y)*p;
  const arrow=['arrow','pierce','rain','dagger'].includes(m.ranged);
  ctx.save();ctx.translate(x,y);ctx.rotate(Math.atan2(z.y-a.y,z.x-a.x));ctx.scale(unit,unit);
  const color=arrow?'#efdbac':m.ranged==='ember'?'#ff923d':'#96caff';
  const gradient=ctx.createLinearGradient(-29,0,0,0);gradient.addColorStop(0,'transparent');gradient.addColorStop(1,color);
  ctx.fillStyle=gradient;ctx.fillRect(-29,-1.4,29,2.8);ctx.fillStyle=arrow?'#fff1c7':'#fff4e1';
  if(arrow){ctx.beginPath();ctx.moveTo(4,0);ctx.lineTo(-4,-2.4);ctx.lineTo(-4,2.4);ctx.fill()}
  else{ctx.shadowColor=color;ctx.shadowBlur=9;ctx.beginPath();ctx.ellipse(0,0,5,2.8,0,0,Math.PI*2);ctx.fill()}
  ctx.restore();
 }
 function frame(now){
  raf=0;if(disposed||document.hidden||!motionAllowed())return;
  if(!width||!height){wake();return}
  ctx.clearRect(0,0,width,height);actorMotion(posesClock.now(now));projectile(move,now);
  const pet=companionMotion.active();
  if(companionBox&&pet>=0&&companionMotion.sheet(pet).naturalWidth){
   petNode.style.visibility='hidden';
   const cast=move&&!move.self?move:null;
   companionMotion.assist(ctx,pet,cast?(now-cast.realStart)/cast.factor:null,companionBox,target(),270,cast,width);
  }
  fire(now);
  for(let i=0;i<pending.length;){
   if(pending[i].at>now){i++;continue}
   const {hit}=pending.splice(i,1)[0];
   if(!hit.periodic){
    const at=posesClock.now(now);
    strikeWeight=Math.max(struckAt===at?strikeWeight:0,hit.skill>=0||hit.crit?1:.55);
    struckAt=at;
   }
   onImpact(hit);
  }
  wake();
 }
 function wake(){if(!disposed&&!raf&&!document.hidden&&motionAllowed())raf=enemyUnity.requestFrame(frame)}
 function swing(hit,self=false){
  if(!width||!height||document.hidden||!motionAllowed())return false;
  const now=clock(),poseNow=posesClock.now(now),ranged=self||rangedCombat.heroStyle(job,hit.skill);
  const factor=Math.min(1,Math.max(.48,1.4/attackSpeed()));
  if(!hit.periodic&&(!move||poseNow-move.start>=455*move.factor)){
   if(hit.skill>=0)combatEffects.load(hit.skill);
   const reach=ranged?h.w*.045:Math.max(h.w*.12,target().x-(h.x+h.w*.85));
   const rise=ranged?0:Math.min(0,Math.max(-h.w*.7,target().y-(h.y+h.h*.48)));
   move={start:poseNow,realStart:now,factor,ranged,self,reach,rise,skillId:hit.skill,hits:SKILL_RULES[hit.skill]?.hits||1,originX:dx,originY:dy,index:0,path:warriorMotion.attackStride(job,h.w,reach,!ranged,SKILL_RULES[hit.skill]?.hits||1,SKILL_RULES[hit.skill]?.effect,hit.skill)};
  }
  if(!self)pending.push({hit,at:now+(hit.periodic?10:270*factor)});
  wake();return true;
 }
 function reset(){
  enemyUnity.cancelFrame(raf);raf=0;pending=[];move=null;dx=dy=0;posesClock.reset();breathAt=breathPoseAt=Infinity;lastFire=lastFirePose=struckAt=-Infinity;strikeWeight=0;
  if(petNode)petNode.style.visibility='';
  hero.style.transform='';dragon.style.transform='';dragon.style.visibility='';body.hidden=true;lastBody=-1;ctx.clearRect(0,0,width,height);paintPose(null,false);
 }
 function visibility(){
  if(document.hidden||!motionAllowed()){reset();return}
  if(!atlas)atlas=loadWorldBossFlame();
  if(!poses.src)poses.src='./assets/enemy-motion/world-guardian.webp';
  wake();
 }
 document.addEventListener('visibilitychange',visibility);
 const media=window.matchMedia?.('(prefers-reduced-motion: reduce)');media?.addEventListener?.('change',visibility);wake();
 return {swing,piercingHeading:()=>piercingHeading,hitStop(ms){if(!disposed&&motionAllowed())posesClock.hold(ms,clock())},
  clock(ms){const now=clock(),next=now+ms;if(Math.abs(next-breathAt)>25)breathPoseAt=posesClock.now(now)+ms;breathAt=next;wake()},
  breath(){lastFire=clock();lastFirePose=posesClock.now(lastFire)},pending:()=>pending.length>0,pendingDamage:()=>pending.reduce((sum,p)=>sum+p.hit.hit,0),
  dispose(){disposed=true;reset();image.onload=null;observer.disconnect();document.removeEventListener('visibilitychange',visibility);media?.removeEventListener?.('change',visibility)}};
}

;
/* ./world-boss.js */
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
   const fx=dialog.querySelector('.wb-fx'), text=document.createElement('b');
   text.className='wb-damage'+(hit.crit?' wb-critical':'');
   text.textContent=(hit.crit?'치명타 ':'')+num(hit.hit);
   text.style.setProperty('--wb-drift',((hit.at+Math.floor(hit.hit))%19-9)+'px');
   fx.appendChild(text);setTimeout(()=>text.remove(),740);
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

;
/* ./weapon-forge.js */
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
// Once the hammer comes down (and while a rune is being carved) the popup stays open until the result shows,
// so a stray tap outside or on X cannot hide the outcome. A stuck request frees the popup after this long.
const FORGE_LOCK_LIMIT_MS=20000;
function forgeStrikeLocked(){
 const a=weaponRitual;
 if(!a||view!==a.kind||a.owner!==s||a.job!==s.classId)return false;
 const busy=a.kind==='weaponEnhance'?a.phase==='committing'||a.phase==='working':a.phase==='working';
 return busy&&performance.now()-(a.lockedAt||0)<FORGE_LOCK_LIMIT_MS;
}
let forgeLockNoticeAt=0;
function refuseForgeClose(){
 if(!forgeStrikeLocked())return false;
 const now=performance.now();
 if(now-forgeLockNoticeAt>1500){forgeLockNoticeAt=now;notice(weaponRitual.kind==='weaponEnhance'?'강화 결과가 나올 때까지 기다려 주세요':'속성 부여가 끝날 때까지 기다려 주세요')}
 return true;
}
function syncForgeLock(){
 const overlay=$('overlay');if(!overlay)return;
 if(forgeStrikeLocked())overlay.dataset.forgeBusy='true';else delete overlay.dataset.forgeBusy;
}
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
 if(a.kind==='weaponImbue')a.lockedAt=performance.now();
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
 a.phase='committing';a.lockedAt=performance.now();
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
EXTRA_POPUPS.weaponSkins=['무기 모습',weaponSkins];
EXTRA_POPUPS.weaponSupplies=['강화 재료 획득처',weaponSupplies];
const renderBeforeWeapons=render;
function renderWithWeapons(){
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
}
render=function(){const result=renderWithWeapons();syncForgeLock();return result};

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

;
/* ./assets/season-weapons/geometry.js */
const SEASON_WEAPON_GEOMETRY={"warrior":[{"grip":[0.495,0.825],"tip":[0.4899,0.01],"strike":[0.4799,0.48]},{"grip":[0.4742,0.825],"tip":[0.5329,0.0177],"strike":[0.4671,0.48]},{"grip":[0.5025,0.825],"tip":[0.4485,0.0139],"strike":[0.5417,0.48]},{"grip":[0.5044,0.825],"tip":[0.5133,0.0117],"strike":[0.4956,0.48]},{"grip":[0.5044,0.825],"tip":[0.5022,0.0117],"strike":[0.4978,0.48]},{"grip":[0.4976,0.825],"tip":[0.4952,0.0117],"strike":[0.4833,0.48]}],"shadow":[{"grip":[0.4968,0.79],"tip":[0.5032,0.0102],"strike":[0.5127,0.46]},{"grip":[0.5176,0.79],"tip":[0.5324,0.0121],"strike":[0.5647,0.46]},{"grip":[0.4891,0.79],"tip":[0.3607,0.0142],"strike":[0.6066,0.46]},{"grip":[0.5693,0.79],"tip":[0.5322,0.0101],"strike":[0.448,0.46]},{"grip":[0.5,0.79],"tip":[0.5,0.0101],"strike":[0.5,0.46]},{"grip":[0.5426,0.79],"tip":[0.5085,0.0101],"strike":[0.4062,0.46]}],"paladin":[{"grip":[0.5261,0.72],"tip":[0.6426,0.0101],"strike":[0.494,0.22]},{"grip":[0.5019,0.72],"tip":[0.6854,0.0142],"strike":[0.5019,0.22]},{"grip":[0.5075,0.72],"tip":[0.7566,0.006],"strike":[0.4551,0.22]},{"grip":[0.5429,0.72],"tip":[0.5485,0.002],"strike":[0.4925,0.22]},{"grip":[0.4983,0.72],"tip":[0.4983,0.002],"strike":[0.4966,0.22]},{"grip":[0.508,0.72],"tip":[0.506,0.002],"strike":[0.506,0.22]}],"mage":[{"grip":[0.4781,0.54],"tip":[0.3937,0.0197],"strike":[0.5031,0.16]},{"grip":[0.5256,0.54],"tip":[0.859,0.0177],"strike":[0.5096,0.16]},{"grip":[0.5273,0.54],"tip":[0.6667,0.0137],"strike":[0.4485,0.1588]},{"grip":[0.5102,0.54],"tip":[0.5128,0.0137],"strike":[0.4923,0.16]},{"grip":[0.485,0.54],"tip":[0.5025,0.002],"strike":[0.52,0.16]},{"grip":[0.4719,0.54],"tip":[0.5026,0.002],"strike":[0.5179,0.16]}],"archer":[{"grip":[0.866,0.5],"tip":[0.1503,0.016],"strike":[0.7925,0.3],"nocks":[[0.1503,0.016],[0.1356,0.986]]},{"grip":[0.8758,0.5],"tip":[0.1699,0.0139],"strike":[0.7958,0.3],"nocks":[[0.1699,0.0139],[0.1258,0.9841]]},{"grip":[0.8894,0.5],"tip":[0.1056,0.016],"strike":[0.8317,0.3],"nocks":[[0.1056,0.016],[0.0924,0.988]]},{"grip":[0.8115,0.5],"tip":[0.1443,0.006],"strike":[0.7508,0.3],"nocks":[[0.1443,0.006],[0.1164,0.988]]},{"grip":[0.7862,0.5],"tip":[0.1585,0.002],"strike":[0.7815,0.3],"nocks":[[0.1585,0.002],[0.1492,0.988]]},{"grip":[0.9081,0.5],"tip":[0.1403,0.004],"strike":[0.8403,0.3],"nocks":[[0.1403,0.004],[0.1177,0.9861]]}]};

;
/* ./assets/weapon-views/views.js */
const WEAPON_VIEWS={"warrior-0":{"sword":[[null,[2,87,252,31,-31,-15],[218.686,0.0]],[null,[258,87,246,29,-31,-14],[213.113,0.0]],[[851,87,129,12,57,-6],[508,87,126,27,-31,-13],[183.112,0.0]],[[2,122,128,12,34,-6],[638,87,87,26,-29,-13],[159.232,0.0]],[[729,87,118,13,67,-7],[2,48,122,35,-31,-17],[183.592,0.0]],[null,[2,2,247,42,-31,-21],[213.719,0.0]],[null,[507,2,251,40,-30,-20],[218.742,0.0]],[null,[253,2,250,42,-31,-21],[216.909,0.0]],[null,[762,2,239,40,-31,-20],[205.474,0.0]],[null,[128,48,229,35,-31,-17],[195.66,0.0]],[null,[361,48,238,34,-31,-17],[205.152,0.0]],[null,[603,48,250,32,-31,-16],[216.525,0.0]]]},"warrior-1":{"sword":[[null,[2,121,255,44,-35,-21],[217.579,0.0]],[null,[261,121,250,42,-36,-20],[212.093,0.0]],[[781,121,171,29,13,-19],[515,121,141,38,-35,-18],[182.314,0.0]],[[140,169,155,27,5,-18],[660,121,117,36,-32,-17],[158.567,0.0]],[[2,169,134,29,50,-16],[238,66,133,49,-35,-24],[182.79,0.0]],[null,[2,2,251,60,-36,-30],[212.692,0.0]],[null,[514,2,255,58,-35,-29],[217.63,0.0]],[null,[257,2,253,60,-35,-30],[215.842,0.0]],[null,[773,2,242,57,-36,-28],[204.522,0.0]],[null,[2,66,232,51,-36,-25],[194.78,0.0]],[null,[375,66,242,49,-36,-24],[204.203,0.0]],[null,[621,66,254,46,-36,-22],[215.464,0.0]]]},"warrior-2":{"sword":[[null,[260,92,256,31,-47,-15],[206.551,0.0]],[null,[520,92,253,29,-49,-14],[201.889,0.0]],[[397,128,142,21,34,-13],[2,128,150,26,-48,-12],[174.296,0.0]],[[266,128,127,22,26,-13],[156,128,106,24,-44,-10],[151.878,0.0]],[[777,92,119,27,57,-16],[492,48,148,34,-48,-17],[174.743,0.0]],[null,[2,2,253,42,-49,-21],[202.426,0.0]],[null,[518,2,256,41,-47,-21],[206.55,0.0]],[null,[259,2,255,42,-48,-21],[205.193,0.0]],[null,[2,48,246,40,-49,-20],[194.99,0.0]],[null,[252,48,236,35,-49,-17],[185.964,0.0]],[null,[644,48,245,34,-49,-17],[194.696,0.0]],[null,[2,92,254,32,-48,-16],[204.869,0.0]]]},"warrior-3":{"sword":[[null,[273,107,268,37,-51,-18],[215.368,0.0]],[null,[545,107,264,35,-52,-17],[210.051,0.0]],[[262,150,158,23,24,-16],[813,107,152,31,-51,-15],[180.715,0.0]],[[115,150,143,29,16,-15],[2,150,109,30,-47,-14],[157.235,0.0]],[[424,150,130,22,53,-13],[513,56,149,41,-50,-20],[181.186,0.0]],[null,[2,2,264,50,-52,-25],[210.638,0.0]],[null,[540,2,267,48,-50,-24],[215.408,0.0]],[null,[270,2,266,50,-51,-25],[213.709,0.0]],[null,[2,56,256,47,-52,-23],[202.617,0.0]],[null,[262,56,247,42,-52,-21],[193.021,0.0]],[null,[666,56,256,41,-52,-20],[202.303,0.0]],[null,[2,107,267,39,-52,-19],[213.342,0.0]]]},"warrior-4":{"sword":[[null,[2,109,277,38,-44,-19],[230.907,-0.52]],[null,[562,109,273,36,-46,-18],[224.351,-0.505]],[[259,151,169,25,24,-16],[839,109,144,32,-45,-16],[191.855,-0.432]],[[432,151,155,24,13,-16],[152,151,103,29,-42,-13],[166.495,-0.375]],[[2,151,146,30,48,-19],[526,57,141,42,-45,-21],[192.367,-0.433]],[null,[2,2,273,51,-46,-26],[225.029,-0.507]],[null,[558,2,277,49,-44,-25],[231.029,-0.52]],[null,[279,2,275,51,-45,-26],[228.671,-0.515]],[null,[2,57,263,48,-46,-24],[215.933,-0.486]],[null,[269,57,253,43,-46,-22],[205.304,-0.462]],[null,[671,57,264,42,-46,-21],[215.582,-0.486]],[null,[283,109,275,38,-45,-19],[228.223,-0.514]]]},"warrior-5":{"sword":[[null,[282,111,276,38,-50,-19],[224.23,0.0]],[null,[562,111,273,37,-53,-18],[218.22,0.0]],[[317,154,164,26,25,-16],[2,154,161,31,-52,-14],[187.096,0.0]],[[167,154,146,27,18,-16],[485,154,118,26,-48,-9],[162.545,0.0]],[[839,111,152,34,37,-21],[530,58,154,43,-52,-21],[187.589,0.0]],[null,[2,2,274,52,-53,-26],[218.858,0.0]],[null,[560,2,276,50,-50,-25],[224.315,0.0]],[null,[280,2,276,52,-52,-26],[222.249,0.0]],[null,[2,58,265,49,-53,-24],[210.231,0.0]],[null,[271,58,255,44,-53,-21],[200.05,0.0]],[null,[688,58,265,43,-53,-21],[209.896,0.0]],[null,[2,111,276,39,-52,-19],[221.837,0.0]]]},"warrior-event":{"sword":[[null,[291,141,286,50,-50,-25],[234.255,-0.521]],[null,[581,141,282,47,-53,-23],[227.418,-0.505]],[[613,197,178,31,18,-21],[173,197,158,38,-52,-16],[194.227,-0.432]],[[335,197,158,35,12,-20],[497,197,112,33,-48,-12],[168.46,-0.374]],[[2,197,167,39,29,-27],[824,74,153,54,-51,-26],[194.748,-0.433]],[null,[292,2,283,67,-53,-34],[228.117,-0.507]],[null,[579,2,287,66,-51,-34],[234.396,-0.521]],[null,[2,2,286,68,-52,-35],[231.887,-0.515]],[null,[2,74,274,63,-53,-32],[218.781,-0.486]],[null,[280,74,263,56,-53,-28],[207.925,-0.462]],[null,[547,74,273,55,-53,-27],[218.422,-0.485]],[null,[2,141,285,52,-52,-26],[231.421,-0.514]]]},"shadow-0":{"dagger":[[null,[690,2,67,84,-59,6],[-58.533,73.167]],[null,[344,2,66,86,-60,7],[-60.267,75.333]],[[358,96,18,30,-50,18],[625,2,61,85,-58,7],[-58.657,73.322]],[[761,2,39,83,-55,5],[804,2,52,80,-51,6],[-55.433,69.291]],[null,[205,2,64,88,-59,5],[-59.137,73.921]],[null,[2,2,66,90,-59,4],[-59.451,74.314]],[null,[72,2,60,89,-55,2],[-55.72,69.651]],[null,[136,2,65,89,-58,3],[-57.855,72.319]],[null,[273,2,67,88,-60,6],[-60.118,75.148]],[null,[414,2,66,86,-60,7],[-60.437,75.546]],[null,[484,2,66,86,-60,7],[-60.306,75.382]],[null,[554,2,67,86,-59,6],[-59.393,74.241]]],"offhand":[[[283,96,32,63,2,-6],null,[31.27,43.636]],[[169,96,34,65,1,-6],null,[32.695,45.625]],[[88,96,38,67,-1,-5],null,[35.162,49.067]],[[44,96,40,68,-2,-4],null,[36.387,50.777]],[[981,2,41,71,-1,-4],null,[38.224,53.34]],[[939,2,38,72,6,-1],[398,96,13,27,0,11],[41.04,57.27]],[[860,2,34,73,11,0],[319,96,35,58,0,9],[42.21,58.902]],[[898,2,37,73,7,-2],[380,96,14,28,1,11],[40.671,56.754]],[[2,96,38,69,2,-4],null,[36.784,51.33]],[[130,96,35,67,2,-6],null,[34.191,47.712]],[[207,96,35,65,2,-5],null,[33.462,46.695]],[[246,96,33,65,2,-7],null,[32.056,44.732]]]},"shadow-1":{"dagger":[[null,[747,2,72,90,-67,1],[-66.495,73.144]],[null,[522,2,72,92,-68,1],[-68.388,75.226]],[[490,103,33,48,-63,11],[674,2,69,91,-68,0],[-66.427,73.07]],[[823,2,52,88,-66,-1],[46,103,49,70,-50,1],[-62.712,68.983]],[null,[298,2,69,94,-67,-1],[-66.985,73.683]],[null,[2,2,72,97,-68,-3],[-67.508,74.258]],[null,[152,2,66,95,-63,-5],[-63.355,69.691]],[null,[78,2,70,97,-66,-4],[-65.741,72.316]],[null,[222,2,72,95,-68,-1],[-68.231,75.055]],[null,[371,2,71,94,-68,0],[-68.549,75.404]],[null,[446,2,72,93,-68,1],[-68.428,75.271]],[null,[598,2,72,92,-67,0],[-67.443,74.187]]],"offhand":[[[404,103,36,65,0,-7],null,[32.698,42.365]],[[236,103,38,67,-1,-7],null,[34.188,44.295]],[[191,103,41,68,-2,-5],null,[36.767,47.637]],[[99,103,42,69,-3,-5],null,[38.047,49.296]],[[964,2,45,71,-3,-4],null,[39.967,51.783]],[[879,2,40,73,6,-3],[550,103,17,28,-2,11],[42.909,55.596]],[[923,2,37,72,10,-1],[444,103,42,64,-2,7],[44.131,57.179]],[[2,103,40,71,6,-2],[527,103,19,31,-1,11],[42.524,55.096]],[[145,103,42,69,0,-4],[571,103,1,1,0,13],[38.461,49.832]],[[278,103,39,67,0,-6],null,[35.751,46.321]],[[321,103,38,67,0,-6],null,[34.99,45.334]],[[363,103,37,66,0,-7],null,[33.519,43.429]]]},"shadow-2":{"dagger":[[null,[585,2,55,89,-51,1],[-50.612,72.803]],[null,[408,2,55,91,-53,1],[-52.167,75.041]],[[235,102,22,41,-47,9],[292,2,54,93,-54,-1],[-50.875,73.182]],[[644,2,38,89,-52,-2],[155,102,36,63,-37,2],[-48.126,69.227]],[null,[350,2,54,93,-53,-1],[-51.28,73.764]],[null,[57,2,55,95,-52,-3],[-51.428,73.977]],[null,[2,2,51,96,-49,-6],[-48.138,69.244]],[null,[116,2,53,95,-50,-3],[-50.013,71.942]],[null,[173,2,55,94,-52,-1],[-52.03,74.843]],[null,[232,2,56,94,-54,0],[-52.339,75.287]],[null,[467,2,55,91,-53,1],[-52.204,75.094]],[null,[526,2,55,91,-52,1],[-51.375,73.901]]],"offhand":[[[80,102,33,65,0,-8],null,[29.932,41.62]],[[41,102,35,67,-1,-8],null,[31.291,43.51]],[[938,2,38,70,-3,-8],null,[33.642,46.779]],[[852,2,40,71,-4,-7],null,[34.808,48.4]],[[806,2,42,72,-4,-6],null,[36.555,50.828]],[[686,2,37,75,5,-5],[281,102,15,25,-3,9],[39.224,54.54]],[[727,2,34,74,9,-3],[195,102,36,56,-3,6],[40.328,56.075]],[[765,2,37,73,5,-4],[261,102,16,27,-2,7],[38.875,54.054]],[[896,2,38,71,0,-7],[300,102,2,4,-1,13],[35.185,48.924]],[[980,2,36,68,0,-8],null,[32.717,45.492]],[[2,102,35,68,0,-8],null,[32.023,44.527]],[[117,102,34,64,0,-8],null,[30.681,42.662]]]},"shadow-3":{"dagger":[[null,[789,2,87,38,9,-9],[94.79,22.476]],[null,[2,50,90,37,9,-8],[97.519,23.123]],[[19,91,14,2,61,25],[732,50,88,32,8,-5],[94.776,22.473]],[[918,50,75,12,16,12],[824,50,57,18,5,-4],[89.501,21.222]],[null,[638,50,90,35,7,-7],[95.567,22.66]],[null,[388,2,90,39,7,-9],[96.246,22.821]],[null,[96,50,87,37,4,-8],[90.293,21.41]],[null,[482,2,89,39,6,-9],[93.71,22.22]],[null,[575,2,90,39,8,-9],[97.292,23.069]],[null,[488,50,89,36,10,-7],[97.762,23.181]],[null,[187,50,90,37,9,-8],[97.578,23.137]],[null,[281,50,88,37,9,-8],[96.153,22.799]]],"offhand":[[[581,50,53,36,7,-9],null,[55.785,19.913]],[[669,2,53,39,10,-10],null,[58.348,20.828]],[[201,2,55,42,11,-11],null,[62.794,22.415]],[[260,2,58,41,9,-10],null,[65.008,23.205]],[[69,2,60,43,11,-10],null,[68.337,24.394]],[[2,2,63,44,14,-9],[997,50,11,9,11,8],[73.472,26.227]],[[133,2,64,43,15,-8],[885,50,29,16,11,3],[75.625,26.995]],[[322,2,62,40,14,-8],[2,91,13,9,12,8],[72.795,25.985]],[[726,2,59,39,11,-8],null,[65.725,23.461]],[[880,2,55,38,10,-9],null,[61.042,21.79]],[[373,50,54,37,9,-9],null,[59.729,21.321]],[[431,50,53,37,9,-9],null,[57.197,20.417]]]},"shadow-4":{"dagger":[[null,[691,2,66,95,-58,1],[-57.661,78.771]],[null,[346,2,66,98,-58,1],[-59.319,81.035]],[[494,108,28,52,-55,10],[416,2,62,98,-56,0],[-57.646,78.75]],[[819,2,39,94,-53,1],[761,2,54,95,-50,-1],[-54.435,74.364]],[null,[278,2,64,99,-57,0],[-58.127,79.407]],[null,[2,2,67,102,-59,-2],[-58.546,79.98]],[null,[213,2,61,100,-54,-3],[-54.927,75.037]],[null,[73,2,65,101,-57,-2],[-57.005,77.874]],[null,[142,2,67,101,-59,0],[-59.181,80.847]],[null,[482,2,65,98,-58,1],[-59.465,81.235]],[null,[551,2,66,98,-58,1],[-59.355,81.084]],[null,[621,2,66,96,-58,1],[-58.49,79.903]]],"offhand":[[[445,108,45,71,-1,-10],[627,108,3,3,-3,10],[39.463,46.509]],[[238,108,48,74,-3,-10],[634,108,3,3,-5,10],[41.28,48.652]],[[124,108,55,77,-8,-9],null,[44.436,52.371]],[[63,108,57,78,-9,-8],null,[46.008,54.224]],[[2,108,57,81,-6,-8],[641,108,4,3,-9,9],[48.375,57.014]],[[916,2,50,83,5,-6],[594,108,19,17,-8,6],[52.033,61.324]],[[862,2,50,84,7,-5],[526,108,40,50,-8,-2],[53.571,63.137]],[[970,2,50,82,5,-6],[570,108,20,20,-7,4],[51.55,60.756]],[[183,108,51,77,0,-7],[617,108,6,5,-5,9],[46.518,54.825]],[[290,108,49,74,-2,-8],[657,108,2,2,-4,10],[43.192,50.905]],[[343,108,48,74,-2,-9],[663,108,3,2,-4,10],[42.26,49.807]],[[395,108,46,72,-1,-9],[649,108,4,3,-4,10],[40.464,47.69]]]},"shadow-5":{"dagger":[[null,[652,2,57,82,-47,-2],[-46.533,65.147]],[null,[360,2,57,85,-47,-2],[-48.053,67.275]],[[379,95,19,41,-43,1],[421,2,53,85,-45,-3],[-47.023,65.832]],[[909,2,29,76,-43,-1],[539,2,48,83,-42,-4],[-44.558,62.381]],[null,[123,2,55,86,-46,-3],[-47.379,66.331]],[null,[2,2,57,89,-47,-4],[-47.319,66.246]],[null,[182,2,52,86,-44,-6],[-44.193,61.871]],[null,[63,2,56,87,-46,-5],[-45.963,64.348]],[null,[238,2,58,86,-48,-3],[-47.913,67.078]],[null,[300,2,56,86,-47,-2],[-48.249,67.549]],[null,[478,2,57,85,-47,-2],[-48.092,67.329]],[null,[591,2,57,83,-47,-2],[-47.268,66.175]]],"offhand":[[[338,95,37,70,0,-9],[474,95,3,4,-3,10],[35.456,42.83]],[[103,95,41,72,-3,-9],[460,95,3,5,-5,9],[37.076,44.788]],[[942,2,48,75,-7,-9],null,[39.883,48.179]],[[2,95,50,75,-8,-8],null,[41.278,49.864]],[[854,2,51,77,-6,-8],[488,95,2,3,-8,8],[43.373,52.394]],[[713,2,44,79,4,-6],[426,95,19,20,-7,6],[46.59,56.281]],[[761,2,42,78,7,-5],[148,95,51,72,-7,1],[47.931,57.9]],[[807,2,43,78,5,-6],[402,95,20,24,-6,4],[46.167,55.77]],[[56,95,43,75,0,-8],[449,95,7,11,-5,8],[41.73,50.41]],[[203,95,42,72,-2,-8],[494,95,2,3,-4,9],[38.778,46.843]],[[249,95,42,72,-2,-8],[481,95,3,4,-4,9],[37.949,45.842]],[[295,95,39,72,-1,-10],[467,95,3,5,-3,10],[36.349,43.909]]]},"shadow-event":{"dagger":[[null,[234,2,110,58,9,-13],[116.591,34.582]],[null,[692,2,112,56,9,-11],[119.323,35.392]],[[586,125,48,11,67,30],[229,65,106,45,7,-9],[114.883,34.076]],[[357,125,99,24,9,14],[460,125,66,23,5,-7],[107.987,32.03]],[null,[118,65,107,54,8,-11],[115.96,34.395]],[null,[2,2,112,59,7,-13],[118.136,35.04]],[null,[808,2,108,56,4,-12],[111.524,33.079]],[null,[348,2,109,58,6,-13],[115.401,34.229]],[null,[118,2,112,59,9,-13],[119.142,35.339]],[null,[2,65,112,56,9,-11],[119.358,35.403]],[null,[461,2,112,57,9,-12],[119.363,35.404]],[null,[577,2,111,57,9,-12],[118.04,35.012]]],"offhand":[[[81,125,70,37,3,-10],null,[67.609,19.516]],[[924,65,70,38,4,-10],null,[70.766,20.427]],[[766,65,72,41,7,-11],null,[76.266,22.015]],[[339,65,74,44,8,-12],null,[79.018,22.809]],[[417,65,78,44,8,-11],null,[83.18,24.011]],[[499,65,83,43,9,-9],[530,125,23,16,11,7],[89.679,25.887]],[[586,65,87,43,9,-8],[305,125,48,25,10,1],[92.454,26.688]],[[677,65,85,43,8,-9],[557,125,25,16,11,6],[88.815,25.637]],[[842,65,78,39,6,-9],[638,125,2,2,13,15],[79.913,23.068]],[[2,125,75,38,4,-9],null,[74.094,21.388]],[[155,125,72,37,4,-9],null,[72.471,20.919]],[[231,125,70,36,3,-9],null,[69.347,20.018]]]},"paladin-0":{"shield":[[null,[223,2,79,161,-51,-77],[-13.026,-60.722]],[null,[306,2,75,161,-48,-77],[-13.038,-60.777]],[[316,286,4,17,-43,-52],[385,2,66,161,-42,-77],[-12.94,-60.322]],[[543,169,13,57,-39,-57],[2,2,55,163,-33,-76],[-12.825,-59.784]],[null,[61,2,70,162,-45,-77],[-12.967,-60.446]],[null,[135,2,84,162,-54,-77],[-13.03,-60.74]],[null,[790,2,87,159,-56,-77],[-12.953,-60.379]],[null,[881,2,85,159,-55,-77],[-12.984,-60.523]],[null,[455,2,82,160,-53,-77],[-13.023,-60.707]],[null,[541,2,79,160,-51,-77],[-13.034,-60.76]],[null,[624,2,79,160,-51,-77],[-13.033,-60.752]],[null,[707,2,79,160,-51,-77],[-13.029,-60.733]]],"mace":[[null,[171,233,163,47,-16,-40],[144.272,-17.0]],[null,[505,233,159,46,-16,-39],[139.94,-16.49]],[[900,233,52,38,82,-36],[2,286,143,28,-15,-21],[130.785,-15.411]],[[834,233,62,41,67,-35],[193,286,119,21,-15,-14],[125.31,-14.766]],[[149,286,40,25,106,-41],[668,233,162,45,-16,-37],[143.977,-16.965]],[null,[361,169,178,58,-16,-48],[160.125,-18.868]],[null,[184,169,173,59,-15,-48],[155.962,-18.378]],[null,[2,169,178,60,-16,-49],[159.884,-18.84]],[null,[560,169,174,54,-16,-45],[155.401,-18.312]],[null,[738,169,166,50,-16,-42],[147.509,-17.382]],[null,[2,233,165,49,-16,-41],[146.7,-17.286]],[null,[338,233,163,47,-16,-40],[145.142,-17.103]]]},"paladin-1":{"shield":[[null,[643,2,82,159,-54,-76],[-15.029,-59.917]],[null,[213,2,78,160,-51,-76],[-15.043,-59.973]],[[937,231,6,21,-46,-54],[2,2,68,162,-44,-76],[-14.931,-59.527]],[[1001,2,17,74,-41,-60],[74,2,58,162,-36,-76],[-14.799,-58.997]],[null,[136,2,73,162,-48,-76],[-14.962,-59.649]],[null,[295,2,86,160,-57,-76],[-15.034,-59.935]],[null,[908,2,89,158,-59,-76],[-14.944,-59.577]],[null,[729,2,87,159,-58,-76],[-14.98,-59.72]],[null,[820,2,84,159,-56,-76],[-15.026,-59.902]],[null,[385,2,82,160,-54,-76],[-15.039,-59.955]],[null,[471,2,82,160,-54,-76],[-15.037,-59.947]],[null,[557,2,82,160,-54,-76],[-15.032,-59.929]]],"mace":[[null,[148,231,140,48,-16,-33],[121.376,-9.729]],[null,[437,231,137,46,-16,-32],[117.946,-9.454]],[[888,231,45,28,69,-30],[578,231,128,39,-15,-25],[110.582,-8.863]],[[710,231,49,38,61,-29],[763,231,121,29,-15,-16],[106.123,-8.506]],[null,[612,168,139,51,-16,-35],[121.144,-9.71]],[null,[155,168,151,58,-16,-40],[132.791,-10.644]],[null,[310,168,146,57,-15,-39],[128.243,-10.279]],[null,[2,168,149,59,-15,-40],[132.231,-10.599]],[null,[460,168,148,55,-16,-38],[129.866,-10.409]],[null,[755,168,142,50,-16,-34],[123.905,-9.931]],[null,[2,231,142,49,-16,-34],[123.277,-9.881]],[null,[292,231,141,48,-16,-33],[122.059,-9.783]]]},"paladin-2":{"shield":[[null,[234,2,77,158,-44,-77],[-6.512,-60.206]],[null,[315,2,73,158,-41,-76],[-6.518,-60.268]],[[320,288,1,6,-36,-37],[2,2,64,159,-36,-75],[-6.471,-59.829]],[[951,2,6,70,-32,-59],[716,2,53,157,-27,-74],[-6.414,-59.302]],[null,[392,2,68,158,-38,-74],[-6.484,-59.951]],[null,[464,2,81,158,-46,-77],[-6.514,-60.225]],[null,[861,2,86,156,-49,-76],[-6.474,-59.859]],[null,[773,2,84,157,-48,-76],[-6.49,-60.004]],[null,[549,2,81,158,-46,-77],[-6.51,-60.191]],[null,[70,2,78,159,-44,-77],[-6.516,-60.247]],[null,[152,2,78,159,-44,-77],[-6.515,-60.238]],[null,[634,2,78,158,-44,-77],[-6.513,-60.219]]],"mace":[[null,[492,232,159,51,-16,-38],[139.909,-13.347]],[null,[655,232,155,49,-16,-37],[135.758,-12.951]],[[876,232,54,40,77,-35],[2,288,140,33,-15,-21],[126.958,-12.111]],[[814,232,58,44,67,-33],[146,288,125,25,-15,-14],[121.683,-11.608]],[[275,288,41,24,100,-40],[2,232,158,52,-16,-38],[139.627,-13.32]],[null,[2,165,173,63,-16,-46],[154.833,-14.77]],[null,[179,165,168,63,-15,-46],[150.546,-14.361]],[null,[351,165,173,63,-16,-46],[154.514,-14.74]],[null,[528,165,169,58,-16,-43],[150.499,-14.357]],[null,[701,165,162,53,-16,-40],[143.004,-13.642]],[null,[164,232,161,52,-16,-39],[142.232,-13.568]],[null,[329,232,159,52,-16,-39],[140.742,-13.426]]]},"paladin-3":{"shield":[[null,[150,2,84,161,-49,-75],[-9.013,-57.986]],[null,[238,2,79,161,-46,-74],[-9.024,-58.053]],[[18,168,9,64,-40,-45],[2,2,67,162,-38,-74],[-8.96,-57.645]],[[2,168,12,93,-36,-59],[321,2,57,161,-30,-73],[-8.883,-57.145]],[null,[73,2,73,162,-42,-74],[-8.978,-57.76]],[null,[382,2,88,161,-52,-75],[-9.016,-58.005]],[null,[924,2,93,158,-55,-74],[-8.96,-57.642]],[null,[653,2,91,160,-54,-75],[-8.982,-57.785]],[null,[474,2,87,161,-51,-75],[-9.011,-57.97]],[null,[748,2,84,160,-49,-75],[-9.02,-58.027]],[null,[836,2,84,160,-49,-75],[-9.018,-58.018]],[null,[565,2,84,161,-49,-75],[-9.015,-57.998]]],"mace":[[null,[309,265,148,50,-16,-35],[129.348,-11.549]],[null,[461,265,145,49,-16,-35],[125.614,-11.216]],[[806,265,51,34,71,-32],[667,265,135,37,-15,-24],[117.642,-10.504]],[[610,265,53,42,65,-31],[861,265,123,29,-15,-16],[112.836,-10.075]],[[988,265,22,12,102,-37],[679,168,148,53,-16,-37],[129.095,-11.526]],[null,[195,168,160,62,-16,-43],[142.212,-12.697]],[null,[359,168,155,61,-15,-43],[137.74,-12.298]],[null,[31,168,160,63,-16,-44],[141.744,-12.656]],[null,[518,168,157,58,-16,-41],[138.714,-12.385]],[null,[831,168,151,52,-16,-37],[132.115,-11.796]],[null,[2,265,150,52,-16,-37],[131.426,-11.734]],[null,[156,265,149,51,-16,-36],[130.093,-11.615]]]},"paladin-4":{"shield":[[null,[141,2,72,187,-41,-88],[-7.021,-68.507]],[null,[2,2,70,188,-40,-87],[-7.024,-68.535]],[null,[76,2,61,188,-34,-86],[-6.965,-67.96]],[[749,194,5,46,-31,-53],[678,2,52,185,-27,-84],[-6.9,-67.322]],[null,[217,2,65,187,-37,-86],[-6.981,-68.111]],[null,[286,2,77,187,-45,-88],[-7.023,-68.524]],[null,[817,2,81,183,-47,-87],[-6.986,-68.161]],[null,[734,2,79,185,-46,-88],[-7.001,-68.311]],[null,[598,2,76,186,-44,-88],[-7.02,-68.493]],[null,[367,2,73,187,-42,-88],[-7.025,-68.541]],[null,[444,2,73,187,-42,-88],[-7.024,-68.534]],[null,[521,2,73,187,-42,-88],[-7.022,-68.518]]],"mace":[[null,[146,252,139,45,-16,-22],[120.502,0.0]],[null,[432,252,135,43,-16,-21],[117.109,0.0]],[[872,252,40,27,72,-20],[571,252,128,40,-16,-19],[109.816,0.0]],[[703,252,45,35,63,-20],[752,252,116,31,-15,-11],[105.397,0.0]],[null,[607,194,138,47,-16,-23],[120.273,0.0]],[null,[2,194,150,54,-16,-27],[131.734,0.0]],[null,[308,194,144,53,-15,-27],[127.166,0.0]],[null,[156,194,148,54,-15,-27],[131.16,0.0]],[null,[456,194,147,50,-16,-25],[128.885,0.0]],[null,[758,194,141,46,-16,-23],[123.003,0.0]],[null,[2,252,140,46,-16,-23],[122.382,0.0]],[null,[289,252,139,44,-16,-21],[121.178,0.0]]]},"paladin-5":{"shield":[[null,[71,2,72,177,-44,-84],[-10.026,-65.371]],[null,[147,2,69,177,-42,-83],[-10.032,-65.411]],[null,[220,2,61,177,-37,-82],[-9.952,-64.886]],[[903,2,9,76,-34,-56],[285,2,53,177,-30,-81],[-9.86,-64.289]],[null,[2,2,65,178,-39,-83],[-9.973,-65.026]],[null,[342,2,78,177,-48,-84],[-10.029,-65.388]],[null,[818,2,81,174,-50,-83],[-9.973,-65.025]],[null,[735,2,79,175,-49,-83],[-9.996,-65.173]],[null,[424,2,76,177,-47,-84],[-10.024,-65.356]],[null,[504,2,73,177,-45,-84],[-10.032,-65.407]],[null,[581,2,73,177,-45,-84],[-10.031,-65.399]],[null,[658,2,73,177,-45,-84],[-10.028,-65.382]]],"mace":[[null,[162,251,154,52,-16,-27],[135.545,-1.383]],[null,[479,251,150,50,-16,-26],[131.574,-1.343]],[[693,251,47,40,79,-25],[744,251,140,38,-16,-15],[123.128,-1.256]],[[633,251,56,45,65,-24],[888,251,125,31,-15,-9],[118.052,-1.205]],[[2,309,27,16,105,-28],[679,184,154,54,-16,-28],[135.275,-1.38]],[null,[2,184,168,63,-16,-33],[149.544,-1.526]],[null,[344,184,163,62,-15,-33],[145.139,-1.481]],[null,[174,184,166,63,-15,-33],[149.15,-1.522]],[null,[511,184,164,59,-16,-31],[145.596,-1.486]],[null,[837,184,157,54,-16,-28],[138.496,-1.413]],[null,[2,251,156,54,-16,-28],[137.761,-1.406]],[null,[320,251,155,52,-16,-27],[136.339,-1.391]]]},"paladin-event":{"shield":[[null,[159,2,92,203,-50,-97],[-6.025,-75.914]],[null,[255,2,86,203,-47,-96],[-6.024,-75.904]],[[183,491,7,62,-40,-69],[2,2,69,204,-35,-95],[-5.968,-75.193]],[[193,413,12,73,-37,-66],[634,2,56,202,-26,-93],[-5.909,-74.448]],[null,[75,2,80,204,-44,-96],[-5.982,-75.372]],[null,[694,2,97,202,-53,-96],[-6.026,-75.926]],[null,[2,210,103,199,-57,-96],[-5.998,-75.578]],[null,[895,2,100,200,-55,-96],[-6.01,-75.728]],[null,[795,2,96,201,-53,-96],[-6.024,-75.902]],[null,[345,2,92,203,-50,-97],[-6.027,-75.938]],[null,[441,2,93,203,-51,-97],[-6.027,-75.934]],[null,[538,2,92,203,-50,-97],[-6.026,-75.922]]],"mace":[[null,[768,413,183,69,-16,-33],[164.299,-0.456]],[[749,491,39,23,113,-30],[2,491,177,67,-16,-32],[159.131,-0.442]],[[439,491,90,52,62,-32],[194,491,150,58,-16,-25],[148.339,-0.412]],[[348,491,87,58,58,-29],[608,491,137,45,-16,-13],[141.948,-0.394]],[[533,491,71,48,95,-37],[209,413,179,71,-16,-34],[163.946,-0.455]],[null,[316,210,203,85,-16,-43],[184.516,-0.513]],[null,[523,210,198,84,-15,-43],[181.003,-0.503]],[null,[109,210,203,86,-16,-44],[184.654,-0.513]],[null,[725,210,196,80,-16,-40],[177.942,-0.494]],[null,[2,413,187,74,-16,-37],[168.198,-0.467]],[null,[392,413,185,71,-16,-34],[167.221,-0.465]],[null,[581,413,183,71,-16,-35],[165.343,-0.459]]]},"mage-0":{"staff":[[[678,2,44,84,-19,-132],[278,2,29,414,-20,-113],[5.593,-104.396]],[[624,2,50,85,-22,-129],[368,2,23,365,-11,-62],[5.498,-102.627]],[[516,2,51,90,-23,-122],[418,2,20,341,-7,-37],[5.302,-98.964]],[[464,2,48,96,-21,-120],[442,2,18,337,-6,-34],[5.186,-96.797]],[[571,2,49,88,-21,-128],[395,2,19,365,-7,-62],[5.544,-103.487]],[null,[95,2,52,428,-23,-139],[5.971,-111.461]],[[818,2,16,70,-6,204],[311,2,53,366,-23,-142],[6.056,-113.043]],[null,[187,2,54,423,-24,-141],[6.021,-112.395]],[[814,436,14,36,15,-134],[2,2,52,430,-23,-137],[5.866,-109.497]],[[838,2,39,67,-12,-135],[58,2,33,430,-21,-132],[5.736,-107.078]],[[774,2,40,76,-14,-134],[151,2,32,425,-21,-126],[5.701,-106.426]],[[726,2,44,80,-18,-133],[245,2,29,417,-20,-117],[5.632,-105.134]]],"book":[[null,[236,436,74,54,-39,-50],[-2.841,-42.333]],[null,[314,436,73,54,-39,-51],[-2.891,-43.074]],[[832,436,17,35,-37,-40],[881,2,69,55,-37,-51],[-2.959,-44.095]],[[789,436,21,45,-36,-47],[954,2,61,55,-30,-51],[-2.983,-44.453]],[[853,436,6,16,-39,-39],[391,436,70,53,-36,-50],[-3.005,-44.77]],[null,[546,436,77,52,-41,-49],[-2.926,-43.597]],[null,[709,436,76,51,-41,-48],[-2.823,-42.058]],[null,[627,436,78,52,-42,-49],[-2.946,-43.895]],[null,[465,436,77,53,-41,-50],[-2.993,-44.6]],[null,[2,436,74,55,-39,-51],[-2.917,-43.458]],[null,[80,436,74,55,-39,-51],[-2.899,-43.2]],[null,[158,436,74,55,-39,-51],[-2.863,-42.658]]]},"mage-1":{"staff":[[[686,2,48,87,-26,-129],[342,2,44,387,-30,-113],[-0.934,-97.186]],[[798,2,58,84,-33,-126],[482,2,27,334,-12,-59],[-0.919,-95.575]],[[623,2,59,88,-33,-121],[513,2,23,313,-7,-38],[-0.887,-92.225]],[[565,2,54,95,-30,-119],[540,2,21,310,-6,-36],[-0.868,-90.237]],[[738,2,56,85,-31,-127],[455,2,23,338,-8,-63],[-0.927,-96.36]],[null,[65,2,59,400,-33,-137],[-0.996,-103.532]],[[961,2,16,69,-3,182],[390,2,61,340,-34,-140],[-1.008,-104.855]],[null,[178,2,62,397,-35,-139],[-1.003,-104.337]],[[138,480,18,35,8,-130],[2,2,59,403,-34,-135],[-0.979,-101.793]],[[2,409,42,67,-18,-132],[128,2,46,398,-32,-126],[-0.958,-99.618]],[[912,2,45,73,-22,-132],[244,2,45,396,-31,-123],[-0.952,-99.028]],[[860,2,48,79,-25,-130],[293,2,45,390,-31,-116],[-0.941,-97.857]]],"book":[[null,[133,409,82,57,-40,-53],[0.474,-45.916]],[null,[48,409,81,59,-39,-55],[0.483,-46.708]],[[116,480,18,39,-37,-44],[219,409,74,57,-34,-54],[0.494,-47.794]],[[91,480,21,48,-36,-52],[297,409,66,57,-27,-54],[0.498,-48.171]],[[160,480,9,29,-39,-46],[540,409,76,56,-34,-54],[0.501,-48.487]],[null,[796,409,87,55,-43,-53],[0.487,-47.169]],[[173,480,9,5,25,-49],[2,480,85,53,-42,-51],[0.47,-45.481]],[null,[887,409,87,55,-43,-53],[0.491,-47.498]],[null,[620,409,86,56,-42,-54],[0.499,-48.323]],[null,[367,409,83,57,-40,-54],[0.487,-47.119]],[null,[710,409,82,56,-40,-53],[0.484,-46.843]],[null,[454,409,82,57,-40,-53],[0.478,-46.264]]]},"mage-2":{"staff":[[[694,2,60,112,-14,-144],[351,2,39,415,-23,-136],[15.826,-107.055]],[[2,430,76,108,-27,-140],[527,2,42,361,-22,-80],[15.555,-105.222]],[[162,430,80,102,-29,-133],[652,2,38,323,-9,-42],[14.994,-101.433]],[[932,2,75,109,-26,-131],[614,2,34,327,-6,-48],[14.664,-99.195]],[[82,430,76,104,-26,-140],[573,2,37,350,-8,-68],[15.686,-106.114]],[null,[2,2,80,424,-27,-152],[16.916,-114.429]],[null,[394,2,82,415,-28,-155],[17.168,-116.134]],[null,[264,2,83,418,-29,-154],[17.062,-115.422]],[[246,430,28,57,23,-147],[141,2,67,421,-28,-149],[16.61,-112.365]],[[877,2,51,110,-3,-146],[86,2,51,423,-25,-147],[16.237,-109.842]],[[758,2,54,112,-7,-146],[212,2,48,421,-25,-145],[16.137,-109.163]],[[816,2,57,112,-11,-145],[480,2,43,414,-24,-136],[15.939,-107.821]]],"book":[[null,[407,430,68,54,-35,-51],[-1.421,-43.299]],[null,[479,430,66,54,-34,-51],[-1.446,-44.054]],[[170,542,6,13,-26,-18],[278,430,63,55,-32,-52],[-1.48,-45.093]],[[150,542,16,40,-31,-43],[345,430,58,55,-28,-52],[-1.492,-45.457]],[null,[765,430,66,53,-34,-51],[-1.502,-45.774]],[null,[909,430,71,52,-37,-50],[-1.463,-44.563]],[null,[77,542,69,51,-36,-49],[-1.411,-42.985]],[null,[2,542,71,52,-37,-50],[-1.473,-44.869]],[null,[835,430,70,53,-36,-51],[-1.497,-45.606]],[null,[549,430,68,54,-35,-51],[-1.459,-44.446]],[null,[621,430,68,54,-35,-51],[-1.45,-44.182]],[null,[693,430,68,54,-35,-51],[-1.432,-43.63]]]},"mage-3":{"staff":[[[899,2,54,135,-8,-131],[89,2,52,417,-25,-130],[15.909,-91.71]],[[50,425,79,108,-30,-128],[593,2,64,385,-29,-95],[15.648,-90.208]],[[215,425,82,90,-31,-121],[783,2,57,336,-8,-45],[15.106,-87.079]],[[133,425,78,96,-29,-117],[724,2,55,346,-7,-57],[14.783,-85.218]],[[301,425,80,90,-29,-126],[661,2,59,381,-8,-89],[15.775,-90.94]],[null,[2,2,83,419,-30,-138],[16.927,-97.576]],[null,[504,2,85,409,-31,-141],[17.129,-98.746]],[null,[414,2,86,413,-32,-140],[17.052,-98.302]],[[385,425,19,57,32,-125],[145,2,78,416,-30,-136],[16.65,-95.982]],[[2,425,44,109,4,-134],[286,2,61,414,-28,-130],[16.301,-93.97]],[[957,2,46,133,1,-133],[351,2,59,414,-27,-130],[16.206,-93.423]],[[844,2,51,136,-5,-132],[227,2,55,416,-26,-130],[16.017,-92.334]]],"book":[[null,[838,425,70,54,-35,-53],[-0.949,-46.111]],[null,[477,425,69,55,-35,-54],[-0.965,-46.905]],[null,[408,425,65,56,-33,-55],[-0.988,-47.995]],[[311,538,16,41,-32,-48],[550,425,60,55,-28,-55],[-0.995,-48.372]],[[331,538,1,4,-35,-40],[912,425,69,54,-35,-54],[-1.002,-48.688]],[null,[157,538,74,52,-38,-52],[-0.975,-47.362]],[null,[235,538,72,51,-37,-51],[-0.94,-45.665]],[null,[79,538,74,53,-38,-53],[-0.981,-47.692]],[null,[2,538,73,54,-37,-54],[-0.998,-48.525]],[null,[614,425,71,55,-36,-54],[-0.974,-47.317]],[null,[689,425,71,55,-36,-54],[-0.968,-47.04]],[null,[764,425,70,55,-35,-54],[-0.956,-46.46]]]},"mage-4":{"staff":[[[2,450,58,95,-11,-138],[2,2,50,444,-36,-137],[15.874,-98.048]],[[159,450,92,93,-41,-135],[628,2,54,419,-40,-109],[15.61,-96.413]],[[900,2,94,96,-41,-127],[752,2,23,348,-11,-36],[15.06,-93.015]],[[806,2,90,101,-39,-124],[779,2,23,345,-12,-34],[14.733,-91.001]],[[64,450,91,95,-39,-133],[686,2,62,399,-14,-87],[15.739,-97.209]],[[445,549,12,34,-41,-133],[56,2,94,443,-39,-145],[16.922,-104.518]],[[461,549,10,34,-13,249],[527,2,97,430,-41,-149],[17.145,-105.897]],[null,[423,2,100,437,-44,-148],[17.056,-105.349]],[[425,450,26,61,27,-140],[154,2,85,443,-42,-144],[16.634,-102.737]],[[316,450,49,85,1,-141],[243,2,60,443,-39,-140],[16.275,-100.521]],[[369,450,52,85,-3,-140],[307,2,56,443,-38,-139],[16.178,-99.921]],[[255,450,57,92,-9,-139],[367,2,52,443,-37,-137],[15.985,-98.73]]],"book":[[null,[846,450,79,58,-46,-55],[-7.12,-46.803]],[null,[532,450,77,59,-45,-56],[-7.242,-47.606]],[[475,549,17,28,-41,-38],[455,450,73,60,-43,-57],[-7.409,-48.704]],[[416,549,25,46,-42,-51],[613,450,65,59,-36,-57],[-7.467,-49.082]],[[496,549,9,19,-45,-43],[2,549,73,57,-42,-55],[-7.514,-49.394]],[null,[248,549,80,55,-47,-53],[-7.307,-48.031]],[null,[332,549,80,55,-47,-53],[-7.044,-46.302]],[null,[163,549,81,56,-48,-54],[-7.358,-48.369]],[null,[79,549,80,57,-47,-55],[-7.49,-49.235]],[null,[682,450,78,59,-46,-56],[-7.305,-48.021]],[null,[764,450,78,59,-46,-56],[-7.263,-47.742]],[null,[929,450,78,58,-46,-55],[-7.174,-47.155]]]},"mage-5":{"staff":[[[744,2,67,109,-20,-148],[436,2,44,435,-31,-133],[10.255,-103.483]],[[2,454,87,105,-35,-144],[646,2,45,394,-31,-89],[10.082,-101.733]],[[93,454,89,103,-35,-136],[695,2,21,344,-6,-38],[9.722,-98.107]],[[815,2,84,108,-33,-132],[720,2,20,343,-6,-38],[9.51,-95.961]],[[252,454,86,102,-33,-143],[581,2,61,409,-8,-103],[10.166,-102.585]],[null,[2,2,91,448,-35,-156],[10.947,-110.469]],[[405,563,15,49,-7,228],[484,2,93,417,-36,-160],[11.102,-112.025]],[null,[178,2,94,443,-37,-159],[11.039,-111.389]],[[405,454,37,75,17,-145],[97,2,77,448,-35,-154],[10.755,-108.529]],[[342,454,59,97,-9,-151],[276,2,52,441,-33,-142],[10.518,-106.137]],[[186,454,62,103,-13,-150],[332,2,50,441,-32,-141],[10.454,-105.492]],[[903,2,66,108,-18,-149],[386,2,46,438,-31,-136],[10.328,-104.214]]],"book":[[null,[901,454,76,56,-44,-56],[-6.652,-48.746]],[null,[520,454,74,57,-43,-57],[-6.765,-49.576]],[[451,563,11,18,-37,-32],[446,454,70,58,-41,-58],[-6.919,-50.707]],[[424,563,23,45,-40,-51],[598,454,64,57,-36,-57],[-6.972,-51.095]],[[466,563,5,13,-43,-42],[666,454,71,57,-41,-57],[-7.014,-51.404]],[null,[2,563,77,56,-45,-56],[-6.817,-49.959]],[[475,563,13,5,18,-52],[324,563,77,53,-45,-53],[-6.57,-48.147]],[null,[83,563,78,56,-46,-56],[-6.865,-50.314]],[null,[741,454,77,57,-45,-57],[-6.993,-51.25]],[null,[822,454,75,57,-44,-57],[-6.823,-50.005]],[null,[165,563,75,56,-44,-56],[-6.784,-49.717]],[null,[244,563,76,56,-44,-56],[-6.701,-49.111]]]},"mage-event":{"staff":[[[2,454,81,117,-41,-157],[407,2,64,443,-52,-152],[1.856,-116.939]],[[87,454,101,114,-56,-153],[747,2,60,384,-46,-92],[1.824,-114.886]],[[294,454,102,113,-56,-145],[811,2,24,332,-9,-39],[1.757,-110.662]],[[864,2,95,119,-51,-143],[839,2,21,331,-7,-39],[1.717,-108.176]],[[192,454,98,114,-53,-153],[699,2,44,387,-9,-95],[1.839,-115.884]],[[805,575,11,46,-56,-148],[165,2,99,446,-51,-167],[1.989,-125.327]],[[686,454,17,74,-5,191],[588,2,107,392,-58,-171],[2.022,-127.408]],[null,[475,2,109,442,-60,-169],[2.008,-126.505]],[[634,454,48,77,-2,-163],[2,2,88,448,-58,-164],[1.951,-122.943]],[[559,454,71,96,-28,-161],[94,2,67,447,-55,-159],[1.906,-120.076]],[[482,454,73,104,-31,-160],[337,2,66,444,-54,-155],[1.894,-119.31]],[[400,454,78,113,-37,-158],[268,2,65,445,-53,-154],[1.87,-117.8]]],"book":[[null,[788,454,83,61,-37,-63],[3.336,-55.183]],[[884,575,3,4,-36,-20],[180,575,81,60,-36,-63],[3.391,-56.099]],[[832,575,15,33,-35,-43],[875,454,75,61,-31,-64],[3.466,-57.334]],[[782,575,19,50,-34,-55],[265,575,68,60,-25,-63],[3.491,-57.747]],[[820,575,8,34,-37,-45],[707,454,77,62,-31,-65],[3.509,-58.041]],[null,[603,575,88,59,-41,-62],[3.404,-56.311]],[[851,575,29,19,17,-58],[695,575,83,57,-41,-60],[3.278,-54.221]],[null,[337,575,88,60,-41,-63],[3.429,-56.725]],[null,[2,575,87,61,-39,-64],[3.5,-57.908]],[null,[429,575,83,60,-37,-63],[3.42,-56.569]],[null,[516,575,83,60,-37,-63],[3.4,-56.253]],[null,[93,575,83,61,-37,-63],[3.36,-55.586]]]},"archer-0":{"bow":[[[879,2,32,116,-24,-118],[510,2,37,187,-27,-22],[3.664,-5.051],[[-10.788,-115.507,-63.725],[-12.554,159.611,58.296]]],[[678,2,35,119,-26,-123],[425,2,39,189,-29,-24],[3.887,-4.871],[[-11.548,-120.055,-55.802],[-13.188,160.632,51.165]]],[[551,2,39,123,-29,-130],[291,2,42,196,-31,-30],[4.253,-4.559],[[-12.859,-127.676,-40.438],[-14.17,161.404,37.77]]],[[594,2,40,123,-30,-134],[243,2,44,211,-32,-46],[4.423,-4.409],[[-13.505,-131.285,-31.871],[-14.592,161.249,30.503]]],[[759,2,39,118,-31,-138],[149,2,44,232,-32,-67],[4.525,-4.278],[[-13.973,-134.859,-20.907],[-14.751,160.57,22.764]]],[[942,2,19,57,-33,-143],[2,2,45,305,-33,-143],[4.69,-4.057],[[-14.799,-140.09,-0.219],[-14.957,157.873,8.312]]],[[965,2,17,53,-33,107],[51,2,46,305,-34,-145],[4.765,-3.952],[[-15.217,-142.089,11.014],[-15.021,155.696,0.545]]],[[915,2,23,69,-32,-142],[101,2,44,262,-32,-99],[4.615,-4.111],[[-14.481,-138.982,-4.669],[-14.783,158.609,12.0]]],[[717,2,38,119,-29,-133],[197,2,42,220,-31,-54],[4.246,-4.499],[[-12.916,-130.109,-33.225],[-14.027,161.346,33.315]]],[[638,2,36,121,-27,-126],[337,2,40,195,-29,-29],[4.001,-4.744],[[-11.984,-123.863,-48.038],[-13.445,161.237,44.667]]],[[802,2,35,118,-26,-124],[381,2,40,193,-29,-27],[3.918,-4.822],[[-11.681,-121.804,-52.187],[-13.231,160.975,48.229]]],[[841,2,34,118,-25,-121],[468,2,38,189,-28,-24],[3.755,-4.97],[[-11.105,-117.778,-59.743],[-12.802,160.194,54.794]]]]},"archer-1":{"bow":[[[898,2,33,110,-26,-112],[527,2,36,168,-28,-18],[3.664,-5.051],[[-12.165,-108.508,-61.717],[-13.978,143.038,50.542]]],[[695,2,35,113,-28,-117],[444,2,38,173,-29,-22],[3.887,-4.871],[[-13.017,-112.904,-54.128],[-14.702,143.915,44.282]]],[[567,2,39,117,-31,-124],[313,2,42,182,-32,-31],[4.253,-4.559],[[-14.485,-120.257,-39.372],[-15.834,144.601,32.579]]],[[610,2,41,116,-33,-127],[266,2,43,187,-33,-36],[4.423,-4.409],[[-15.206,-123.728,-31.126],[-16.327,144.493,26.258]]],[[816,2,40,111,-34,-131],[174,2,43,212,-33,-62],[4.525,-4.278],[[-15.725,-127.134,-20.592],[-16.528,143.956,19.586]]],[[101,2,22,244,-36,-136],[53,2,44,283,-34,-135],[4.69,-4.057],[[-16.639,-132.092,-0.695],[-16.802,141.717,7.154]]],[[964,2,17,48,-34,98],[2,2,47,284,-37,-138],[4.765,-3.952],[[-17.1,-133.965,10.118],[-16.897,139.881,0.485]]],[[935,2,25,65,-35,-135],[127,2,43,236,-33,-87],[4.615,-4.111],[[-16.284,-131.037,-5.002],[-16.597,142.328,10.334]]],[[773,2,39,112,-31,-126],[221,2,41,196,-31,-45],[4.246,-4.499],[[-14.543,-122.561,-32.486],[-15.687,144.591,28.731]]],[[655,2,36,115,-29,-120],[359,2,39,180,-30,-29],[4.001,-4.744],[[-13.503,-116.56,-46.711],[-15.005,144.461,38.578]]],[[734,2,35,113,-28,-119],[402,2,38,178,-29,-27],[3.918,-4.822],[[-13.164,-114.577,-50.684],[-14.758,144.227,41.699]]],[[860,2,34,111,-27,-114],[486,2,37,171,-28,-21],[3.755,-4.97],[[-12.52,-110.698,-57.912],[-14.263,143.544,47.461]]]]},"archer-2":{"bow":[[[964,2,35,115,-28,-117],[530,2,40,185,-31,-14],[3.671,-5.05],[[-10.073,-112.523,-61.743],[-12.694,161.675,59.465]]],[[753,2,36,118,-29,-122],[483,2,43,186,-33,-15],[3.893,-4.871],[[-10.791,-116.923,-54.041],[-13.309,162.724,52.214]]],[[619,2,41,122,-33,-129],[340,2,45,197,-35,-26],[4.257,-4.559],[[-12.03,-124.281,-39.108],[-14.258,163.52,38.579]]],[[664,2,42,122,-34,-133],[289,2,47,211,-36,-40],[4.426,-4.409],[[-12.64,-127.756,-30.782],[-14.663,163.363,31.176]]],[[838,2,42,117,-36,-137],[188,2,48,231,-37,-61],[4.527,-4.278],[[-13.077,-131.19,-20.09],[-14.812,162.669,23.291]]],[[107,2,25,289,-38,-143],[56,2,47,306,-36,-139],[4.691,-4.058],[[-13.851,-136.193,0.085],[-14.996,159.916,8.56]]],[[34,315,22,58,-38,106],[2,2,50,309,-39,-145],[4.766,-3.953],[[-14.244,-138.087,11.039],[-15.047,157.696,0.639]]],[[2,315,28,73,-37,-141],[136,2,48,259,-37,-91],[4.616,-4.112],[[-13.549,-135.137,-4.235],[-14.832,160.67,12.323]]],[[793,2,41,118,-33,-132],[240,2,45,218,-35,-47],[4.249,-4.499],[[-12.075,-126.625,-32.048],[-14.118,163.46,34.049]]],[[710,2,39,120,-31,-125],[389,2,43,193,-33,-22],[4.006,-4.744],[[-11.198,-120.602,-46.479],[-13.558,163.344,45.609]]],[[884,2,37,117,-30,-123],[436,2,43,191,-33,-20],[3.923,-4.822],[[-10.913,-118.613,-50.515],[-13.352,163.074,49.232]]],[[925,2,35,117,-28,-120],[574,2,41,185,-32,-14],[3.762,-4.969],[[-10.371,-114.721,-57.867],[-12.936,162.273,55.906]]]]},"archer-3":{"bow":[[[426,311,53,106,-40,-105],[631,2,59,221,-40,-44],[3.586,-5.056],[[-37.848,-102.353,-86.048],[-33.397,166.876,36.055]]],[[310,311,55,108,-43,-110],[763,2,63,220,-43,-44],[3.823,-4.873],[[-40.513,-108.445,-76.918],[-35.495,166.207,30.121]]],[[962,2,59,116,-47,-121],[559,2,68,222,-46,-48],[4.212,-4.557],[[-45.159,-118.822,-58.711],[-38.84,164.423,19.549]]],[[2,311,61,115,-50,-126],[484,2,71,230,-48,-57],[4.392,-4.405],[[-47.474,-123.813,-48.324],[-40.337,163.234,14.091]]],[[67,311,58,112,-52,-131],[338,2,71,242,-48,-71],[4.502,-4.271],[[-49.192,-128.579,-36.116],[-40.986,161.575,7.584]]],[[49,2,35,304,-55,-138],[215,2,54,269,-30,-113],[4.68,-4.046],[[-52.216,-135.768,-12.817],[-41.954,157.629,-4.279]]],[[2,2,43,305,-57,-141],[134,2,77,274,-53,-140],[4.761,-3.942],[[-53.74,-138.65,-0.052],[-42.349,155.079,-10.529]]],[[88,2,42,303,-54,-136],[273,2,61,266,-37,-104],[4.6,-4.1],[[-51.069,-134.108,-18.605],[-41.29,158.475,-1.924]]],[[129,311,58,111,-48,-124],[413,2,67,234,-45,-61],[4.206,-4.492],[[-45.428,-121.776,-51.777],[-38.411,163.56,14.808]]],[[191,311,56,110,-44,-115],[694,2,65,221,-44,-46],[3.946,-4.742],[[-42.092,-113.381,-68.545],[-36.374,165.489,24.222]]],[[251,311,55,110,-43,-113],[830,2,63,220,-42,-44],[3.857,-4.822],[[-41.015,-110.64,-73.23],[-35.65,165.942,27.254]]],[[369,311,53,107,-41,-107],[897,2,61,220,-41,-43],[3.684,-4.973],[[-38.97,-105.326,-81.661],[-34.216,166.613,32.952]]]]},"archer-4":{"bow":[[[97,288,41,108,-32,-110],[663,2,45,171,-35,-18],[3.633,-5.053],[[-17.741,-104.941,-64.842],[-16.51,146.098,47.429]]],[[868,2,43,111,-34,-115],[563,2,47,176,-37,-23],[3.862,-4.873],[[-18.945,-109.556,-57.13],[-17.471,146.687,41.29]]],[[766,2,48,115,-38,-123],[403,2,51,193,-40,-40],[4.237,-4.558],[[-21.022,-117.299,-42.048],[-18.987,146.919,29.91]]],[[712,2,50,116,-40,-127],[346,2,53,200,-41,-48],[4.41,-4.408],[[-22.042,-120.965,-33.58],[-19.655,146.618,23.81]]],[[915,2,47,111,-42,-131],[233,2,55,212,-43,-61],[4.516,-4.275],[[-22.788,-124.529,-22.936],[-19.938,145.89,17.246]]],[[2,2,28,282,-44,-136],[69,2,45,242,-33,-94],[4.686,-4.053],[[-24.089,-129.744,-2.787],[-20.347,143.375,5.063]]],[[142,288,26,60,-43,86],[118,2,57,242,-45,-139],[4.763,-3.948],[[-24.737,-131.732,8.181],[-20.507,141.434,-1.452]]],[[34,2,31,278,-43,-135],[179,2,50,234,-38,-85],[4.609,-4.107],[[-23.594,-128.614,-7.277],[-20.059,144.022,8.06]]],[[966,2,46,111,-38,-126],[292,2,50,203,-39,-51],[4.23,-4.496],[[-21.13,-119.664,-35.273],[-18.79,146.763,25.95]]],[[818,2,46,114,-36,-119],[458,2,49,189,-38,-36],[3.979,-4.743],[[-19.649,-113.365,-49.687],[-17.872,147.002,35.61]]],[[2,288,45,111,-35,-117],[511,2,48,184,-37,-31],[3.894,-4.822],[[-19.166,-111.287,-53.709],[-17.542,146.894,38.683]]],[[51,288,42,109,-33,-112],[614,2,45,174,-35,-21],[3.727,-4.972],[[-18.248,-107.228,-61.009],[-16.886,146.461,44.375]]]]},"archer-5":{"bow":[[[53,306,40,112,-31,-114],[665,2,45,188,-33,-19],[3.62,-5.054],[[-17.846,-106.825,-65.178],[-14.811,158.537,52.801]]],[[867,2,42,114,-33,-118],[564,2,47,190,-35,-21],[3.851,-4.873],[[-19.039,-111.458,-57.387],[-15.722,159.207,46.036]]],[[714,2,47,118,-37,-126],[405,2,51,210,-38,-41],[4.23,-4.558],[[-21.096,-119.234,-42.168],[-17.157,159.47,33.448]]],[[765,2,50,118,-39,-129],[347,2,54,220,-40,-51],[4.405,-4.407],[[-22.107,-122.916,-33.63],[-17.788,159.123,26.677]]],[[959,2,47,113,-40,-133],[233,2,55,238,-41,-70],[4.512,-4.274],[[-22.854,-126.509,-22.883],[-18.047,158.277,19.342]]],[[114,2,25,294,-42,-139],[63,2,47,299,-33,-135],[4.684,-4.051],[[-24.149,-131.769,-2.545],[-18.427,155.412,5.704]]],[[142,306,29,69,-42,93],[2,2,57,300,-43,-141],[4.763,-3.946],[[-24.79,-133.778,8.522],[-18.578,153.218,-1.601]]],[[143,2,30,283,-41,-137],[177,2,52,260,-38,-95],[4.607,-4.105],[[-23.663,-130.632,-7.062],[-18.152,156.148,9.055]]],[[2,306,47,113,-37,-128],[292,2,51,226,-38,-57],[4.223,-4.495],[[-21.22,-121.625,-35.303],[-16.956,159.262,29.033]]],[[819,2,44,117,-34,-122],[460,2,49,204,-36,-35],[3.97,-4.743],[[-19.745,-115.291,-49.857],[-16.092,159.545,39.777]]],[[913,2,42,114,-33,-120],[513,2,47,196,-35,-26],[3.883,-4.822],[[-19.265,-113.203,-53.921],[-15.782,159.426,43.168]]],[[97,306,41,112,-32,-115],[615,2,46,189,-34,-20],[3.715,-4.973],[[-18.35,-109.124,-61.301],[-15.165,158.943,49.441]]]]},"archer-event":{"bow":[[[873,365,82,130,-62,-129],[145,365,63,266,-38,-71],[3.444,-5.051],[[-58.541,-120.899,-114.004],[-35.289,180.649,26.678]]],[[692,365,88,135,-66,-137],[2,365,69,273,-42,-80],[3.705,-4.866],[[-62.771,-128.715,-102.279],[-38.3,179.296,21.046]]],[[212,365,96,178,-75,-151],[788,2,76,282,-47,-92],[4.136,-4.545],[[-70.239,-142.253,-78.818],[-43.177,176.451,11.35]]],[[312,365,96,145,-79,-158],[868,2,78,280,-49,-92],[4.335,-4.392],[[-74.013,-148.897,-65.398],[-45.398,174.814,6.514]]],[[234,2,90,350,-82,-165],[430,2,79,293,-49,-107],[4.46,-4.253],[[-76.993,-155.357,-50.107],[-46.463,172.613,0.243]]],[[92,2,67,357,-87,-176],[513,2,59,291,-28,-143],[4.663,-4.025],[[-82.251,-165.424,-20.863],[-48.15,167.874,-11.027]]],[[2,2,86,359,-90,-181],[328,2,98,296,-67,-158],[4.755,-3.921],[[-84.904,-169.669,-4.818],[-48.9,165.014,-16.889]]],[[163,2,67,355,-85,-173],[576,2,55,288,-25,-136],[4.576,-4.076],[[-80.378,-163.05,-28.433],[-47.14,168.762,-9.214]]],[[412,365,89,141,-75,-156],[635,2,75,283,-46,-94],[4.135,-4.471],[[-70.946,-146.191,-70.543],[-42.66,175.068,6.173]]],[[505,365,90,138,-69,-144],[714,2,70,283,-43,-91],[3.844,-4.727],[[-65.44,-135.132,-91.743],[-39.618,177.946,15.139]]],[[599,365,89,136,-67,-140],[950,2,69,279,-42,-87],[3.745,-4.81],[[-63.681,-131.566,-97.711],[-38.555,178.718,18.061]]],[[784,365,85,133,-64,-133],[75,365,66,271,-40,-77],[3.552,-4.966],[[-60.358,-124.708,-108.435],[-36.47,180.023,23.617]]]]},"warrior-season2":{"sword":[[null,[2,121,255,44,-35,-21],[217.579,0.0]],[null,[261,121,250,42,-36,-20],[212.093,0.0]],[[781,121,171,29,13,-19],[515,121,141,38,-35,-18],[182.314,0.0]],[[140,169,155,27,5,-18],[660,121,117,36,-32,-17],[158.567,0.0]],[[2,169,134,29,50,-16],[238,66,133,49,-35,-24],[182.79,0.0]],[null,[2,2,251,60,-36,-30],[212.692,0.0]],[null,[514,2,255,58,-35,-29],[217.63,0.0]],[null,[257,2,253,60,-35,-30],[215.842,0.0]],[null,[773,2,242,57,-36,-28],[204.522,0.0]],[null,[2,66,232,51,-36,-25],[194.78,0.0]],[null,[375,66,242,49,-36,-24],[204.203,0.0]],[null,[621,66,254,46,-36,-22],[215.464,0.0]]]},"shadow-season2":{"dagger":[[null,[690,2,67,84,-59,6],[-58.533,73.167]],[null,[344,2,66,86,-60,7],[-60.267,75.333]],[[358,96,18,30,-50,18],[625,2,61,85,-58,7],[-58.657,73.322]],[[761,2,39,83,-55,5],[804,2,52,80,-51,6],[-55.433,69.291]],[null,[205,2,64,88,-59,5],[-59.137,73.921]],[null,[2,2,66,90,-59,4],[-59.451,74.314]],[null,[72,2,60,89,-55,2],[-55.72,69.651]],[null,[136,2,65,89,-58,3],[-57.855,72.319]],[null,[273,2,67,88,-60,6],[-60.118,75.148]],[null,[414,2,66,86,-60,7],[-60.437,75.546]],[null,[484,2,66,86,-60,7],[-60.306,75.382]],[null,[554,2,67,86,-59,6],[-59.393,74.241]]],"offhand":[[[283,96,32,63,2,-6],null,[31.27,43.636]],[[169,96,34,65,1,-6],null,[32.695,45.625]],[[88,96,38,67,-1,-5],null,[35.162,49.067]],[[44,96,40,68,-2,-4],null,[36.387,50.777]],[[981,2,41,71,-1,-4],null,[38.224,53.34]],[[939,2,38,72,6,-1],[398,96,13,27,0,11],[41.04,57.27]],[[860,2,34,73,11,0],[319,96,35,58,0,9],[42.21,58.902]],[[898,2,37,73,7,-2],[380,96,14,28,1,11],[40.671,56.754]],[[2,96,38,69,2,-4],null,[36.784,51.33]],[[130,96,35,67,2,-6],null,[34.191,47.712]],[[207,96,35,65,2,-5],null,[33.462,46.695]],[[246,96,33,65,2,-7],null,[32.056,44.732]]]},"paladin-season2":{"mace":[[null,[171,66,163,47,-16,-40],[144.272,-17.0]],[null,[505,66,159,46,-16,-39],[139.94,-16.49]],[[900,66,52,38,82,-36],[2,119,143,28,-15,-21],[130.785,-15.411]],[[834,66,62,41,67,-35],[193,119,119,21,-15,-14],[125.31,-14.766]],[[149,119,40,25,106,-41],[668,66,162,45,-16,-37],[143.977,-16.965]],[null,[361,2,178,58,-16,-48],[160.125,-18.868]],[null,[184,2,173,59,-15,-48],[155.962,-18.378]],[null,[2,2,178,60,-16,-49],[159.884,-18.84]],[null,[543,2,174,54,-16,-45],[155.401,-18.312]],[null,[721,2,166,50,-16,-42],[147.509,-17.382]],[null,[2,66,165,49,-16,-41],[146.7,-17.286]],[null,[338,66,163,47,-16,-40],[145.142,-17.103]]]},"mage-season2":{"staff":[[[678,2,44,84,-19,-132],[278,2,29,414,-20,-113],[5.593,-104.396]],[[624,2,50,85,-22,-129],[368,2,23,365,-11,-62],[5.498,-102.627]],[[516,2,51,90,-23,-122],[418,2,20,341,-7,-37],[5.302,-98.964]],[[464,2,48,96,-21,-120],[442,2,18,337,-6,-34],[5.186,-96.797]],[[571,2,49,88,-21,-128],[395,2,19,365,-7,-62],[5.544,-103.487]],[null,[95,2,52,428,-23,-139],[5.971,-111.461]],[[818,2,16,70,-6,204],[311,2,53,366,-23,-142],[6.056,-113.043]],[null,[187,2,54,423,-24,-141],[6.021,-112.395]],[[881,2,14,36,15,-134],[2,2,52,430,-23,-137],[5.866,-109.497]],[[838,2,39,67,-12,-135],[58,2,33,430,-21,-132],[5.736,-107.078]],[[774,2,40,76,-14,-134],[151,2,32,425,-21,-126],[5.701,-106.426]],[[726,2,44,80,-18,-133],[245,2,29,417,-20,-117],[5.632,-105.134]]]},"archer-season2":{"bow":[[[898,2,33,110,-26,-112],[527,2,36,168,-28,-18],[3.664,-5.051],[[-12.165,-108.508,-61.717],[-13.978,143.038,50.542]]],[[695,2,35,113,-28,-117],[444,2,38,173,-29,-22],[3.887,-4.871],[[-13.017,-112.904,-54.128],[-14.702,143.915,44.282]]],[[567,2,39,117,-31,-124],[313,2,42,182,-32,-31],[4.253,-4.559],[[-14.485,-120.257,-39.372],[-15.834,144.601,32.579]]],[[610,2,41,116,-33,-127],[266,2,43,187,-33,-36],[4.423,-4.409],[[-15.206,-123.728,-31.126],[-16.327,144.493,26.258]]],[[816,2,40,111,-34,-131],[174,2,43,212,-33,-62],[4.525,-4.278],[[-15.725,-127.134,-20.592],[-16.528,143.956,19.586]]],[[101,2,22,244,-36,-136],[53,2,44,283,-34,-135],[4.69,-4.057],[[-16.639,-132.092,-0.695],[-16.802,141.717,7.154]]],[[964,2,17,48,-34,98],[2,2,47,284,-37,-138],[4.765,-3.952],[[-17.1,-133.965,10.118],[-16.897,139.881,0.485]]],[[935,2,25,65,-35,-135],[127,2,43,236,-33,-87],[4.615,-4.111],[[-16.284,-131.037,-5.002],[-16.597,142.328,10.334]]],[[773,2,39,112,-31,-126],[221,2,41,196,-31,-45],[4.246,-4.499],[[-14.543,-122.561,-32.486],[-15.687,144.591,28.731]]],[[655,2,36,115,-29,-120],[359,2,39,180,-30,-29],[4.001,-4.744],[[-13.503,-116.56,-46.711],[-15.005,144.461,38.578]]],[[734,2,35,113,-28,-119],[402,2,38,178,-29,-27],[3.918,-4.822],[[-13.164,-114.577,-50.684],[-14.758,144.227,41.699]]],[[860,2,34,111,-27,-114],[486,2,37,171,-28,-21],[3.755,-4.97],[[-12.52,-110.698,-57.912],[-14.263,143.544,47.461]]]]},"warrior-skin1":{"sword":[[null,[123,2,89,313,-42,-264],[-0.655,-262.412]],[[329,320,12,82,-39,-112],[558,2,75,306,-31,-254],[-0.631,-253.011]],[[957,2,54,199,-35,-215],[76,320,53,187,-13,-137],[-0.534,-213.784]],[[133,320,60,179,-34,-185],[276,320,49,154,-11,-108],[-0.461,-184.583]],[[2,320,70,196,-46,-215],[197,320,75,175,-25,-125],[-0.535,-214.381]],[null,[435,2,119,307,-59,-255],[-0.634,-253.894]],[null,[2,2,117,314,-59,-264],[-0.656,-262.731]],[null,[216,2,120,311,-60,-260],[-0.646,-258.823]],[null,[637,2,112,295,-54,-243],[-0.605,-242.445]],[[345,320,5,13,-18,-206],[854,2,99,283,-47,-231],[-0.573,-229.617]],[null,[753,2,97,295,-46,-243],[-0.604,-242.014]],[null,[340,2,91,310,-43,-259],[-0.644,-258.191]]]},"warrior-skin2":{"sword":[[[481,323,6,23,-41,-59],[2,2,92,317,-40,-267],[7.997,-262.291]],[[436,323,13,69,-39,-98],[590,2,77,309,-27,-257],[7.71,-252.894]],[[2,323,65,203,-36,-217],[228,323,60,182,-14,-132],[6.515,-213.685]],[[157,323,67,185,-35,-187],[376,323,56,144,-13,-98],[5.625,-184.498]],[[71,323,82,199,-47,-217],[292,323,80,180,-23,-129],[6.533,-214.282]],[null,[459,2,127,310,-60,-258],[7.737,-253.777]],[null,[98,2,124,317,-60,-267],[8.006,-262.609]],[null,[226,2,128,315,-61,-263],[7.887,-258.703]],[null,[671,2,119,299,-55,-246],[7.388,-242.333]],[[453,323,24,58,-23,-226],[901,2,106,285,-48,-233],[6.997,-229.511]],[null,[794,2,103,299,-46,-246],[7.375,-241.903]],[[491,323,1,1,-43,-38],[358,2,97,314,-43,-262],[7.868,-258.072]]]},"warrior-skin3":{"sword":[[[421,321,6,18,-43,-55],[2,2,90,315,-43,-265],[-7.097,-262.316]],[[403,321,14,53,-41,-75],[567,2,75,307,-31,-255],[-6.843,-252.919]],[[2,321,54,206,-37,-215],[139,321,53,197,-13,-146],[-5.782,-213.706]],[[283,321,62,184,-35,-186],[349,321,50,168,-12,-121],[-4.992,-184.516]],[[60,321,75,204,-48,-216],[196,321,83,190,-32,-140],[-5.798,-214.303]],[null,[442,2,121,309,-61,-257],[-6.867,-253.802]],[null,[96,2,118,315,-61,-266],[-7.106,-262.635]],[null,[218,2,123,313,-62,-262],[-7.0,-258.729]],[null,[646,2,114,297,-56,-245],[-6.557,-242.357]],[[431,321,4,8,-22,-206],[867,2,101,284,-49,-232],[-6.21,-229.534]],[null,[764,2,99,296,-48,-244],[-6.545,-241.927]],[null,[345,2,93,312,-45,-261],[-6.983,-258.097]]]},"warrior-skin4":{"sword":[[[563,324,1,1,-46,-76],[136,2,97,317,-46,-266],[1.268,-262.409]],[[531,324,17,54,-44,-95],[617,2,78,309,-29,-256],[1.222,-253.009]],[[116,324,56,201,-40,-217],[256,324,57,179,-13,-128],[1.033,-213.782]],[[317,324,67,178,-38,-187],[475,324,52,157,-10,-110],[0.892,-184.581]],[[176,324,76,195,-52,-217],[388,324,83,176,-27,-125],[1.036,-214.379]],[null,[480,2,133,311,-67,-258],[1.226,-253.892]],[null,[2,2,130,318,-67,-267],[1.269,-262.728]],[null,[237,2,134,315,-68,-263],[1.25,-258.821]],[null,[699,2,124,300,-61,-246],[1.171,-242.443]],[[552,324,7,16,-16,-214],[2,324,110,285,-53,-232],[1.109,-229.615]],[null,[827,2,108,299,-52,-245],[1.169,-242.012]],[null,[375,2,101,315,-48,-262],[1.247,-258.188]]]},"warrior-skin5":{"sword":[[[575,323,1,2,-41,-54],[2,2,97,317,-46,-267],[-0.312,-262.412]],[[533,323,17,92,-44,-122],[616,2,80,310,-31,-257],[-0.301,-253.012]],[[115,323,58,205,-39,-217],[256,323,57,184,-14,-133],[-0.254,-213.784]],[[317,323,67,182,-38,-187],[477,323,52,157,-11,-110],[-0.219,-184.583]],[[177,323,75,200,-51,-217],[388,323,85,177,-30,-126],[-0.255,-214.381]],[null,[479,2,133,311,-67,-258],[-0.302,-253.895]],[null,[103,2,130,317,-67,-267],[-0.312,-262.731]],[null,[237,2,133,315,-68,-263],[-0.308,-258.823]],[null,[700,2,123,299,-60,-246],[-0.288,-242.445]],[[554,323,17,40,-24,-223],[2,323,109,285,-53,-233],[-0.273,-229.618]],[null,[827,2,106,299,-51,-246],[-0.288,-242.015]],[null,[374,2,101,314,-48,-262],[-0.307,-258.191]]]},"warrior-skin6":{"sword":[[null,[2,2,90,317,-42,-267],[-0.318,-262.412]],[[427,323,13,46,-41,-90],[573,2,76,310,-30,-257],[-0.306,-253.012]],[[2,323,59,198,-37,-217],[144,323,57,185,-16,-134],[-0.259,-213.784]],[[288,323,60,174,-35,-187],[352,323,50,143,-11,-96],[-0.223,-184.583]],[[65,323,75,193,-47,-217],[205,323,79,181,-27,-130],[-0.259,-214.381]],[null,[446,2,123,311,-61,-258],[-0.307,-253.895]],[null,[96,2,120,317,-61,-267],[-0.318,-262.731]],[null,[220,2,124,315,-62,-263],[-0.313,-258.823]],[null,[653,2,114,299,-55,-246],[-0.293,-242.445]],[[406,323,17,49,-25,-220],[875,2,103,285,-49,-233],[-0.278,-229.618]],[null,[771,2,100,299,-48,-246],[-0.293,-242.015]],[null,[348,2,94,314,-44,-262],[-0.313,-258.191]]]},"shadow-skin1":{"dagger":[[null,[270,2,31,102,-15,-82],[0.215,-81.707]],[null,[2,2,29,107,-14,-85],[0.222,-84.346]],[null,[137,2,25,105,-13,-83],[0.217,-82.483]],[[722,2,14,55,-3,-78],[378,2,19,85,-11,-64],[0.206,-78.134]],[null,[166,2,28,105,-14,-83],[0.219,-83.115]],[null,[198,2,34,105,-17,-84],[0.219,-83.074]],[null,[342,2,32,97,-16,-78],[0.205,-77.621]],[null,[305,2,33,101,-16,-81],[0.213,-80.713]],[null,[101,2,32,106,-16,-85],[0.222,-84.104]],[null,[35,2,28,107,-14,-85],[0.223,-84.677]],[null,[67,2,30,107,-15,-85],[0.222,-84.412]],[null,[236,2,30,104,-15,-83],[0.219,-82.986]]],"offhand":[[[680,2,18,64,-9,-53],[791,2,6,13,-2,1],[0.14,-53.23]],[[611,2,22,67,-11,-55],[811,2,7,12,-2,3],[0.147,-55.655]],[[461,2,25,74,-12,-60],[852,2,3,4,-1,12],[0.158,-59.851]],[[431,2,26,78,-13,-62],[859,2,1,1,0,16],[0.163,-61.934]],[[401,2,26,79,-13,-65],[822,2,7,12,-1,6],[0.171,-65.057]],[[514,2,22,72,-11,-70],[759,2,17,53,-5,-35],[0.184,-69.841]],[[637,2,16,65,-11,-71],[702,2,16,64,-5,-45],[0.189,-71.827]],[[540,2,20,71,-10,-69],[740,2,15,54,-4,-36],[0.182,-69.214]],[[490,2,20,74,-10,-62],[780,2,7,15,-2,2],[0.165,-62.608]],[[564,2,19,71,-9,-58],[843,2,5,11,-1,5],[0.153,-58.199]],[[587,2,20,70,-10,-57],[833,2,6,12,-1,3],[0.15,-56.96]],[[657,2,19,65,-9,-54],[801,2,6,13,-2,2],[0.144,-54.566]]]},"shadow-skin2":{"dagger":[[null,[288,2,32,103,-17,-83],[0.533,-81.5]],[null,[37,2,31,106,-16,-85],[0.55,-84.136]],[null,[146,2,27,105,-14,-83],[0.538,-82.285]],[[769,2,12,54,-1,-78],[403,2,21,81,-13,-60],[0.509,-77.949]],[null,[177,2,31,105,-16,-83],[0.542,-82.914]],[null,[212,2,36,105,-19,-84],[0.541,-82.866]],[null,[364,2,35,98,-18,-79],[0.506,-77.421]],[null,[324,2,36,102,-19,-82],[0.526,-80.508]],[null,[72,2,34,106,-18,-85],[0.548,-83.894]],[null,[2,2,31,108,-16,-86],[0.552,-84.468]],[null,[110,2,32,106,-17,-85],[0.55,-84.203]],[null,[252,2,32,105,-17,-84],[0.541,-82.777]]],"offhand":[[[721,2,20,65,-10,-54],[847,2,8,12,-3,2],[0.347,-53.108]],[[669,2,23,68,-12,-56],[859,2,7,12,-2,3],[0.363,-55.527]],[[517,2,26,74,-13,-60],[901,2,6,8,-1,8],[0.39,-59.712]],[[459,2,29,79,-15,-63],[911,2,1,1,0,16],[0.404,-61.789]],[[428,2,27,80,-14,-66],[825,2,7,13,-1,5],[0.424,-64.904]],[[591,2,23,72,-12,-71],[785,2,17,54,-5,-35],[0.455,-69.676]],[[745,2,20,61,-12,-73],[547,2,16,74,-4,-56],[0.468,-71.656]],[[618,2,22,70,-12,-70],[806,2,15,54,-4,-36],[0.451,-69.05]],[[492,2,21,76,-11,-63],[836,2,7,13,-2,3],[0.408,-62.462]],[[567,2,20,73,-10,-59],[870,2,6,12,-1,3],[0.379,-58.064]],[[644,2,21,70,-11,-57],[880,2,6,12,-1,3],[0.371,-56.828]],[[696,2,21,67,-11,-55],[890,2,7,12,-2,2],[0.356,-54.441]]]},"shadow-skin3":{"dagger":[[null,[308,2,36,101,-18,-81],[-4.993,-81.278]],[null,[39,2,34,105,-17,-84],[-5.155,-83.908]],[[866,2,7,29,7,-63],[156,2,29,104,-15,-82],[-5.042,-82.064]],[[802,2,18,57,-5,-78],[520,2,21,75,-14,-54],[-4.776,-77.74]],[null,[189,2,34,104,-17,-83],[-5.08,-82.691]],[null,[227,2,39,104,-19,-83],[-5.077,-82.64]],[null,[391,2,37,96,-18,-77],[-4.743,-77.209]],[null,[348,2,39,100,-19,-80],[-4.932,-80.287]],[null,[77,2,37,105,-18,-84],[-5.14,-83.666]],[null,[2,2,33,107,-17,-85],[-5.175,-84.239]],[null,[118,2,34,105,-17,-84],[-5.159,-83.974]],[null,[270,2,34,104,-17,-83],[-5.072,-82.551]]],"offhand":[[[757,2,21,65,-10,-53],[888,2,7,12,-2,3],[-3.254,-52.967]],[[704,2,24,69,-12,-56],[899,2,7,11,-2,5],[-3.402,-55.379]],[[545,2,28,75,-14,-60],[953,2,6,8,-1,9],[-3.659,-59.553]],[[465,2,31,79,-15,-62],[963,2,1,1,1,16],[-3.786,-61.625]],[[432,2,29,80,-14,-65],[910,2,8,11,-2,7],[-3.977,-64.731]],[[628,2,22,72,-13,-70],[844,2,18,56,-5,-37],[-4.269,-69.489]],[[782,2,16,63,-12,-72],[500,2,16,79,-4,-60],[-4.39,-71.463]],[[654,2,20,71,-12,-69],[824,2,16,57,-4,-39],[-4.231,-68.866]],[[577,2,22,75,-11,-62],[877,2,7,17,-2,0],[-3.827,-62.295]],[[603,2,21,73,-10,-58],[922,2,6,11,-1,5],[-3.558,-57.91]],[[678,2,22,71,-11,-57],[932,2,6,11,-1,5],[-3.482,-56.677]],[[732,2,21,67,-10,-54],[942,2,7,11,-2,4],[-3.336,-54.297]]]},"shadow-skin4":{"dagger":[[null,[331,2,39,102,-23,-82],[-1.58,-81.719]],[null,[41,2,37,106,-21,-85],[-1.631,-84.357]],[null,[208,2,31,105,-18,-83],[-1.595,-82.494]],[[877,2,14,59,-2,-79],[566,2,26,75,-16,-54],[-1.511,-78.143]],[null,[82,2,36,106,-21,-84],[-1.607,-83.125]],[null,[243,2,42,105,-24,-84],[-1.606,-83.086]],[null,[420,2,41,97,-23,-78],[-1.501,-77.632]],[null,[374,2,42,101,-23,-81],[-1.561,-80.724]],[null,[122,2,40,106,-23,-85],[-1.626,-84.115]],[null,[2,2,35,107,-20,-85],[-1.637,-84.688]],[null,[166,2,38,106,-22,-85],[-1.632,-84.424]],[null,[289,2,38,105,-22,-84],[-1.605,-82.997]]],"offhand":[[[823,2,24,65,-14,-53],[947,2,6,12,-2,3],[-1.029,-53.236]],[[765,2,26,68,-15,-55],[967,2,6,10,-2,5],[-1.076,-55.661]],[[596,2,29,74,-16,-59],[1006,2,6,7,-1,9],[-1.157,-59.857]],[[501,2,32,78,-18,-61],null,[-1.198,-61.941]],[[465,2,32,79,-18,-65],[995,2,7,9,-2,8],[-1.258,-65.064]],[[677,2,28,71,-17,-69],[895,2,18,56,-5,-38],[-1.351,-69.85]],[[851,2,22,61,-16,-72],[629,2,16,73,-4,-54],[-1.389,-71.836]],[[737,2,24,70,-14,-68],[917,2,16,56,-4,-38],[-1.338,-69.223]],[[537,2,25,76,-14,-62],[937,2,6,14,-2,3],[-1.211,-62.615]],[[649,2,24,72,-14,-58],[977,2,5,10,-1,6],[-1.125,-58.205]],[[709,2,24,71,-14,-57],[986,2,5,10,-1,6],[-1.101,-56.966]],[[795,2,24,67,-14,-54],[957,2,6,11,-2,4],[-1.055,-54.573]]]},"shadow-skin5":{"dagger":[[null,[308,2,36,100,-18,-81],[0.0,-81.718]],[null,[77,2,33,104,-17,-84],[0.0,-84.357]],[null,[114,2,29,104,-15,-82],[0.0,-82.494]],[[638,2,16,68,-3,-78],[430,2,22,82,-13,-62],[0.0,-78.143]],[null,[147,2,34,104,-17,-83],[0.0,-83.125]],[null,[226,2,39,103,-20,-83],[0.0,-83.085]],[null,[390,2,36,95,-18,-77],[0.0,-77.631]],[null,[348,2,38,99,-19,-80],[0.0,-80.723]],[null,[185,2,37,104,-19,-84],[0.0,-84.115]],[null,[2,2,33,105,-17,-84],[0.0,-84.688]],[null,[39,2,34,105,-17,-84],[0.0,-84.423]],[null,[269,2,35,103,-18,-83],[0.0,-82.997]]],"offhand":[[[785,2,22,64,-11,-52],[890,2,7,11,-2,3],[0.0,-53.237]],[[684,2,24,67,-12,-55],[943,2,7,10,-2,4],[0.0,-55.662]],[[578,2,29,73,-14,-59],[954,2,3,4,-1,12],[0.0,-59.858]],[[483,2,30,78,-15,-62],null,[0.0,-61.941]],[[517,2,29,77,-14,-64],[901,2,8,11,-1,6],[0.0,-65.065]],[[456,2,23,79,-13,-69],[834,2,20,50,-6,-33],[0.0,-69.85]],[[811,2,19,60,-13,-71],[736,2,19,66,-6,-48],[0.0,-71.837]],[[712,2,20,67,-12,-68],[858,2,17,50,-5,-33],[0.0,-69.223]],[[550,2,24,75,-12,-62],[879,2,7,14,-2,3],[0.0,-62.615]],[[611,2,23,70,-11,-57],[913,2,6,11,-1,4],[0.0,-58.206]],[[658,2,22,68,-11,-56],[923,2,6,11,-1,4],[0.0,-56.966]],[[759,2,22,66,-11,-54],[933,2,6,11,-1,3],[0.0,-54.573]]]},"shadow-skin6":{"dagger":[[null,[297,2,35,102,-19,-82],[-1.268,-81.718]],[null,[75,2,33,106,-18,-84],[-1.309,-84.357]],[null,[187,2,28,104,-16,-82],[-1.28,-82.494]],[[787,2,16,56,-5,-78],[417,2,22,89,-14,-68],[-1.212,-78.143]],[null,[112,2,32,105,-18,-83],[-1.29,-83.125]],[null,[219,2,37,104,-20,-83],[-1.289,-83.086]],[null,[377,2,36,97,-19,-78],[-1.204,-77.632]],[null,[336,2,37,101,-20,-81],[-1.252,-80.724]],[null,[148,2,35,105,-19,-84],[-1.305,-84.115]],[null,[2,2,32,107,-18,-85],[-1.314,-84.688]],[null,[38,2,33,107,-18,-85],[-1.31,-84.424]],[null,[260,2,33,104,-18,-83],[-1.288,-82.997]]],"offhand":[[[739,2,21,64,-11,-52],[857,2,6,13,-2,2],[-0.826,-53.236]],[[687,2,24,67,-13,-55],[900,2,6,12,-2,4],[-0.864,-55.661]],[[534,2,28,73,-15,-59],[919,2,4,6,-1,11],[-0.929,-59.858]],[[475,2,29,77,-16,-61],[927,2,1,1,0,16],[-0.961,-61.941]],[[443,2,28,79,-15,-65],[867,2,8,13,-2,5],[-1.009,-65.065]],[[636,2,23,68,-14,-69],[807,2,16,51,-4,-32],[-1.084,-69.85]],[[764,2,19,61,-13,-71],[566,2,15,73,-4,-54],[-1.115,-71.836]],[[663,2,20,68,-13,-69],[827,2,15,51,-4,-32],[-1.074,-69.223]],[[508,2,22,75,-12,-62],[846,2,7,14,-2,3],[-0.971,-62.615]],[[585,2,22,72,-12,-58],[910,2,5,9,-1,7],[-0.903,-58.205]],[[611,2,21,69,-11,-56],[879,2,7,13,-2,3],[-0.884,-56.966]],[[715,2,20,66,-11,-54],[890,2,6,13,-2,2],[-0.847,-54.573]]]},"paladin-skin1":{"mace":[[null,[611,2,75,165,-38,-118],[9.646,-116.614]],[null,[773,2,73,161,-37,-115],[9.377,-113.361]],[[62,182,46,60,-36,-108],[850,2,67,143,-32,-99],[8.797,-106.352]],[[2,182,56,65,-35,-103],[921,2,58,137,-24,-95],[8.445,-102.097]],[[112,182,6,7,-31,-97],[690,2,79,165,-41,-118],[9.628,-116.395]],[null,[2,2,89,176,-47,-129],[10.523,-127.214]],[null,[357,2,89,168,-48,-125],[10.145,-122.651]],[null,[183,2,89,174,-47,-128],[10.473,-126.61]],[null,[95,2,84,175,-43,-126],[10.307,-124.603]],[null,[276,2,77,169,-39,-121],[9.844,-119.007]],[null,[450,2,77,167,-39,-120],[9.795,-118.413]],[null,[531,2,76,166,-39,-119],[9.7,-117.261]]]},"paladin-skin2":{"mace":[[null,[574,2,81,165,-39,-118],[16.358,-115.938]],[null,[836,2,81,160,-39,-114],[15.901,-112.703]],[[130,181,58,56,-38,-107],[921,2,68,141,-28,-98],[14.918,-105.734]],[[68,181,58,65,-37,-104],[2,181,62,131,-23,-89],[14.321,-101.503]],[[192,181,23,26,-41,-100],[746,2,86,164,-42,-117],[16.327,-115.719]],[null,[2,2,95,175,-48,-128],[17.846,-126.482]],[null,[386,2,96,167,-50,-124],[17.206,-121.948]],[null,[101,2,97,174,-49,-128],[17.761,-125.882]],[null,[202,2,91,173,-45,-125],[17.479,-123.882]],[null,[297,2,85,168,-41,-120],[16.694,-118.317]],[null,[486,2,84,167,-41,-119],[16.61,-117.727]],[null,[659,2,83,165,-40,-118],[16.449,-116.581]]]},"paladin-skin3":{"mace":[[null,[743,2,80,164,-39,-118],[22.01,-117.196]],[null,[827,2,80,160,-39,-115],[21.392,-113.907]],[[135,182,62,56,-38,-108],[911,2,63,150,-23,-107],[20.064,-106.832]],[[61,182,70,61,-38,-105],[2,182,55,137,-16,-96],[19.258,-102.542]],[[201,182,33,31,-42,-106],[571,2,82,165,-39,-118],[21.968,-116.974]],[null,[2,2,96,176,-49,-129],[24.043,-128.022]],[null,[383,2,96,167,-50,-125],[23.199,-123.528]],[null,[102,2,95,174,-49,-129],[23.935,-127.447]],[null,[201,2,90,174,-45,-126],[23.533,-125.304]],[null,[295,2,84,168,-41,-121],[22.465,-119.619]],[null,[483,2,84,167,-41,-120],[22.352,-119.017]],[null,[657,2,82,165,-40,-119],[22.133,-117.851]]]},"paladin-skin4":{"mace":[[null,[637,2,78,166,-41,-118],[0.486,-117.908]],[null,[805,2,76,162,-40,-115],[0.473,-114.611]],[[57,182,42,54,-38,-108],[885,2,64,150,-30,-105],[0.443,-107.512]],[[2,182,51,59,-37,-104],[953,2,56,138,-23,-95],[0.425,-103.204]],[null,[719,2,82,166,-44,-118],[0.485,-117.685]],[null,[2,2,93,176,-51,-129],[0.531,-128.695]],[null,[373,2,92,168,-51,-125],[0.512,-124.119]],[null,[191,2,93,174,-51,-128],[0.528,-128.097]],[null,[99,2,88,175,-47,-126],[0.52,-126.017]],[null,[288,2,81,169,-43,-121],[0.496,-120.334]],[null,[469,2,81,168,-43,-120],[0.494,-119.732]],[null,[554,2,79,167,-42,-119],[0.489,-118.563]]]},"paladin-skin5":{"mace":[[null,[700,2,87,165,-42,-118],[0.0,-117.908]],[null,[886,2,85,163,-41,-116],[0.0,-114.611]],[[206,182,42,53,-39,-108],[2,182,74,156,-32,-111],[0.0,-107.512]],[[147,182,55,67,-38,-107],[80,182,63,148,-22,-105],[0.0,-103.204]],[[252,182,6,4,-37,-100],[791,2,91,165,-44,-118],[0.0,-117.685]],[null,[2,2,102,176,-51,-129],[0.0,-128.695]],[null,[411,2,101,168,-51,-125],[0.0,-124.119]],[null,[108,2,103,174,-52,-128],[0.0,-128.097]],[null,[215,2,98,174,-48,-126],[0.0,-126.017]],[null,[317,2,90,169,-44,-121],[0.0,-120.334]],[null,[516,2,89,168,-43,-120],[0.0,-119.732]],[null,[609,2,87,167,-42,-119],[0.0,-118.563]]]},"paladin-skin6":{"mace":[[null,[599,2,73,166,-36,-119],[-0.162,-117.908]],[null,[756,2,71,162,-35,-115],[-0.157,-114.611]],[[2,182,38,55,-34,-108],[831,2,64,151,-30,-106],[-0.148,-107.512]],[[960,2,47,62,-33,-104],[899,2,57,147,-24,-104],[-0.142,-103.204]],[[44,182,8,11,-38,-100],[676,2,76,166,-37,-118],[-0.162,-117.685]],[null,[2,2,87,176,-44,-129],[-0.177,-128.695]],[null,[351,2,87,168,-45,-125],[-0.17,-124.119]],[null,[179,2,88,174,-45,-128],[-0.176,-128.097]],[null,[93,2,82,175,-41,-126],[-0.173,-126.017]],[null,[271,2,76,169,-38,-121],[-0.165,-120.334]],[null,[442,2,75,168,-37,-120],[-0.164,-119.732]],[null,[521,2,74,167,-37,-119],[-0.163,-118.563]]]},"mage-skin1":{"staff":[[[110,405,102,158,-51,-195],[704,2,70,327,-46,-139],[-9.69,-189.654]],[[437,405,112,153,-54,-191],[858,2,50,247,-25,-59],[-9.485,-185.643]],[[660,405,113,152,-53,-183],[964,2,52,228,-26,-42],[-9.076,-177.653]],[[2,405,104,161,-48,-183],[912,2,48,229,-23,-44],[-8.843,-173.078]],[[324,405,109,155,-51,-196],[778,2,76,321,-23,-133],[-9.584,-187.58]],[[1008,405,1,4,-55,-163],[130,2,117,397,-54,-213],[-10.621,-207.887]],[[977,405,27,54,-23,123],[251,2,123,395,-58,-220],[-10.955,-214.414]],[null,[2,2,124,399,-59,-217],[-10.787,-211.14]],[[882,405,91,114,-32,-208],[378,2,82,385,-57,-198],[-10.331,-202.202]],[[777,405,101,151,-47,-202],[464,2,77,360,-53,-172],[-10.015,-196.013]],[[553,405,103,153,-49,-200],[545,2,77,354,-53,-166],[-9.934,-194.429]],[[216,405,104,157,-52,-197],[626,2,74,341,-50,-153],[-9.777,-191.367]]]},"mage-skin2":{"staff":[[[449,407,67,142,-19,-196],[680,2,70,370,-51,-182],[37.268,-190.122]],[[337,407,108,146,-58,-191],[754,2,82,328,-58,-140],[36.473,-186.065]],[[222,407,111,152,-60,-182],[898,2,58,220,-29,-35],[34.891,-177.996]],[[2,407,104,164,-55,-178],[960,2,55,213,-28,-31],[33.987,-173.382]],[[110,407,108,162,-56,-193],[840,2,54,241,-29,-54],[36.857,-188.023]],[[756,407,51,91,-58,-191],[123,2,91,400,-35,-214],[40.9,-208.65]],[null,[2,2,117,401,-60,-221],[42.217,-215.37]],[null,[218,2,120,400,-63,-217],[41.554,-211.985]],[[714,407,38,111,16,-208],[342,2,101,390,-60,-204],[39.763,-202.851]],[[653,407,57,118,-6,-202],[447,2,76,378,-55,-191],[38.531,-196.564]],[[589,407,60,131,-10,-201],[527,2,74,375,-54,-188],[38.216,-194.958]],[[520,407,65,138,-16,-198],[605,2,71,371,-52,-183],[37.608,-191.855]]]},"mage-skin3":{"staff":[[[406,408,92,149,-43,-196],[710,2,76,377,-56,-189],[16.425,-191.671]],[[502,408,115,149,-62,-192],[790,2,63,277,-39,-89],[16.075,-187.595]],[[287,408,115,154,-61,-184],[913,2,55,223,-29,-37],[15.38,-179.481]],[[59,408,108,163,-56,-179],[2,408,53,217,-28,-34],[14.982,-174.839]],[[171,408,112,158,-58,-194],[857,2,52,252,-28,-64],[16.244,-189.563]],[[951,408,35,88,-62,-195],[131,2,102,401,-44,-216],[18.018,-210.261]],[null,[2,2,125,402,-64,-223],[18.593,-216.972]],[null,[237,2,126,401,-66,-219],[18.304,-213.597]],[[887,408,60,96,-4,-210],[367,2,89,385,-64,-199],[17.52,-204.45]],[[802,408,81,143,-29,-203],[460,2,81,383,-60,-195],[16.979,-198.142]],[[714,408,84,145,-33,-201],[545,2,80,382,-59,-194],[16.841,-196.53]],[[621,408,89,147,-39,-198],[629,2,77,378,-57,-190],[16.574,-193.413]]]},"mage-skin4":{"staff":[[[176,409,109,159,-51,-198],[831,2,90,359,-66,-168],[0.363,-191.716]],[[669,409,136,154,-71,-193],[2,409,54,249,-27,-59],[0.355,-187.645]],[[809,409,137,153,-69,-184],[60,409,55,228,-27,-40],[0.34,-179.539]],[[289,409,127,158,-63,-181],[119,409,53,228,-26,-41],[0.331,-174.901]],[[532,409,133,155,-66,-195],[925,2,52,258,-25,-68],[0.359,-189.611]],[[317,662,28,57,-71,-189],[2,2,121,403,-49,-216],[0.398,-210.267]],[[349,662,4,7,-24,134],[127,2,150,403,-75,-223],[0.41,-216.949]],[null,[281,2,150,403,-76,-219],[0.404,-213.591]],[[222,662,91,113,-23,-210],[435,2,100,394,-74,-205],[0.387,-204.473]],[[113,662,105,142,-43,-204],[539,2,95,378,-70,-188],[0.375,-198.177]],[[2,662,107,146,-46,-202],[638,2,94,373,-69,-182],[0.372,-196.567]],[[420,409,108,156,-49,-200],[736,2,91,364,-67,-173],[0.366,-193.456]]]},"mage-skin5":{"staff":[[[277,409,116,171,-53,-197],[848,2,91,369,-65,-178],[2.487,-195.698]],[[627,409,141,161,-70,-193],[102,409,54,250,-24,-60],[2.433,-191.504]],[[138,743,142,154,-68,-184],[217,409,56,231,-25,-43],[2.327,-183.166]],[[2,743,132,157,-62,-180],[160,409,53,233,-23,-46],[2.267,-178.402]],[[772,409,133,158,-64,-195],[2,409,96,330,-23,-140],[2.459,-193.528]],[[488,743,27,75,-69,-177],[2,2,129,403,-51,-216],[2.731,-214.903]],[[519,743,1,1,-23,139],[135,2,152,403,-72,-223],[2.82,-221.913]],[null,[291,2,154,403,-74,-219],[2.775,-218.375]],[[393,743,91,124,-18,-210],[449,2,102,390,-72,-201],[2.654,-208.88]],[[284,743,105,153,-38,-204],[555,2,95,372,-68,-182],[2.571,-202.365]],[[515,409,108,163,-42,-202],[654,2,94,371,-67,-181],[2.55,-200.702]],[[397,409,114,170,-50,-199],[752,2,92,371,-66,-180],[2.509,-197.492]]]},"mage-skin6":{"staff":[[[209,410,108,166,-45,-197],[844,2,92,356,-61,-165],[4.275,-195.696]],[[566,410,136,156,-66,-193],[2,410,64,266,-29,-76],[4.183,-191.502]],[[2,680,138,152,-65,-184],[138,410,67,229,-29,-41],[4.001,-183.164]],[[321,410,129,160,-59,-183],[70,410,64,230,-28,-43],[3.897,-178.399]],[[706,410,135,154,-62,-196],[940,2,63,272,-28,-82],[4.227,-193.526]],[[340,680,25,55,-66,-177],[155,2,126,403,-48,-216],[4.694,-214.902]],[[369,680,1,1,-27,132],[2,2,149,404,-68,-223],[4.848,-221.914]],[null,[285,2,150,403,-70,-219],[4.77,-218.375]],[[250,680,86,112,-13,-210],[439,2,103,380,-69,-191],[4.563,-208.879]],[[144,680,102,149,-35,-204],[546,2,97,369,-65,-179],[4.421,-202.363]],[[845,410,105,153,-39,-202],[647,2,96,367,-64,-177],[4.384,-200.701]],[[454,410,108,160,-44,-199],[747,2,93,360,-62,-169],[4.314,-197.49]]]},"archer-skin1":{"bow":[[[423,292,128,274,-111,-105],[335,571,85,183,-71,-31],[3.683,-5.048],[[-82.075,-81.792,-138.042],[-96.367,166.536,-18.887]]],[[2,292,135,275,-117,-110],[166,571,85,185,-70,-39],[3.903,-4.87],[[-88.144,-91.474,-126.019],[-101.747,162.084,-21.564]]],[[832,2,148,277,-128,-120],[893,292,81,188,-61,-61],[4.264,-4.559],[[-99.01,-108.284,-101.059],[-110.651,154.521,-24.689]]],[[532,2,151,279,-133,-125],[255,571,76,185,-56,-65],[4.431,-4.409],[[-104.606,-116.53,-86.376],[-114.833,150.95,-25.468]]],[[251,2,145,281,-135,-131],[818,292,71,191,-50,-73],[4.531,-4.279],[[-108.654,-124.119,-71.153],[-116.772,147.193,-28.508]]],[[123,2,124,283,-139,-140],[760,292,54,200,-32,-107],[4.693,-4.059],[[-116.104,-136.024,-41.565],[-119.825,140.623,-33.233]]],[[2,2,117,286,-141,-146],[689,292,67,221,-45,-136],[4.767,-3.955],[[-120.054,-141.086,-25.128],[-121.165,137.346,-35.352]]],[[400,2,128,281,-137,-138],[424,571,56,181,-35,-87],[4.619,-4.114],[[-113.042,-132.998,-50.478],[-117.79,141.792,-34.201]]],[[687,2,141,279,-126,-124],[2,571,72,188,-52,-68],[4.256,-4.5],[[-99.279,-112.439,-94.645],[-109.523,152.094,-29.668]]],[[141,292,138,275,-120,-114],[568,571,77,177,-62,-42],[4.015,-4.744],[[-91.59,-99.032,-116.12],[-104.056,158.515,-25.593]]],[[283,292,136,275,-118,-112],[484,571,80,179,-65,-40],[3.933,-4.821],[[-89.144,-94.703,-122.1],[-102.158,160.548,-24.043]]],[[555,292,130,274,-113,-107],[78,571,84,187,-70,-38],[3.773,-4.968],[[-84.562,-86.394,-132.662],[-98.456,164.416,-20.816]]]]},"archer-skin2":{"bow":[[[547,2,128,276,-113,-106],[616,571,91,176,-75,-23],[3.722,-5.043],[[-80.999,-81.8,-137.687],[-99.954,166.699,-18.467]]],[[813,2,135,275,-119,-110],[174,571,89,184,-72,-40],[3.935,-4.866],[[-86.913,-91.567,-125.734],[-105.268,162.133,-21.223]]],[[435,292,146,273,-130,-116],[527,571,85,181,-67,-47],[4.285,-4.558],[[-97.509,-108.522,-100.899],[-114.055,154.377,-24.487]]],[[2,292,149,275,-135,-121],[356,571,80,183,-61,-54],[4.447,-4.41],[[-102.972,-116.839,-86.28],[-118.181,150.712,-25.338]]],[[396,2,147,278,-137,-128],[921,292,72,196,-53,-67],[4.543,-4.282],[[-106.888,-124.466,-71.148],[-120.044,146.891,-28.479]]],[[123,2,129,283,-141,-140],[794,292,57,246,-37,-126],[4.699,-4.064],[[-114.13,-136.441,-41.725],[-122.961,140.207,-33.389]]],[[2,2,117,286,-142,-146],[855,292,62,224,-42,-127],[4.769,-3.96],[[-117.991,-141.542,-25.376],[-124.232,136.871,-35.606]]],[[256,2,136,282,-138,-137],[729,292,61,250,-41,-123],[4.627,-4.119],[[-111.115,-133.377,-50.613],[-120.944,141.42,-34.327]]],[[585,292,140,273,-128,-118],[95,571,75,187,-57,-57],[4.276,-4.502],[[-97.695,-112.66,-94.559],[-112.866,151.946,-29.547]]],[[155,292,137,275,-122,-113],[440,571,83,182,-66,-46],[4.043,-4.742],[[-90.229,-99.161,-115.91],[-107.511,158.502,-25.333]]],[[296,292,135,275,-120,-111],[267,571,85,184,-68,-45],[3.964,-4.819],[[-87.855,-94.801,-121.853],[-105.647,160.58,-23.742]]],[[679,2,130,276,-115,-108],[2,571,89,188,-73,-39],[3.809,-4.964],[[-83.411,-86.435,-132.345],[-102.008,164.532,-20.438]]]]},"archer-skin3":{"bow":[[[417,290,125,273,-112,-102],[483,568,80,170,-69,-19],[3.681,-5.049],[[-88.686,-78.47,-145.266],[-103.577,168.754,-25.867]]],[[2,290,133,274,-119,-108],[2,568,81,182,-69,-34],[3.901,-4.87],[[-95.276,-88.59,-132.852],[-109.429,163.833,-28.183]]],[[698,2,146,275,-130,-117],[253,568,81,180,-68,-37],[4.263,-4.559],[[-107.108,-106.188,-106.97],[-119.161,155.537,-30.443]]],[[543,2,151,277,-135,-123],[409,568,70,171,-57,-50],[4.43,-4.409],[[-113.225,-114.834,-91.697],[-123.761,151.655,-30.664]]],[[388,2,151,279,-138,-129],[861,290,65,198,-48,-85],[4.53,-4.279],[[-117.651,-122.776,-76.07],[-125.918,147.601,-33.337]]],[[125,2,125,282,-142,-139],[747,290,52,211,-34,-99],[4.693,-4.059],[[-125.822,-135.27,-45.634],[-129.349,140.628,-37.285]]],[[2,2,119,284,-143,-145],[679,290,64,231,-46,-136],[4.766,-3.954],[[-130.167,-140.607,-28.7],[-130.875,137.215,-38.945]]],[[254,2,130,280,-139,-136],[803,290,54,211,-37,-99],[4.618,-4.113],[[-122.451,-132.076,-54.981],[-127.086,141.847,-38.67]]],[[848,2,145,275,-129,-120],[338,568,67,174,-54,-52],[4.255,-4.5],[[-107.391,-110.498,-100.645],[-117.937,152.884,-35.535]]],[[139,290,137,274,-122,-113],[87,568,79,182,-67,-36],[4.014,-4.744],[[-99.017,-96.473,-122.754],[-111.948,159.894,-32.041]]],[[280,290,133,274,-119,-110],[930,290,80,184,-68,-36],[3.932,-4.821],[[-96.359,-91.949,-128.908],[-109.877,162.129,-30.65]]],[[546,290,129,273,-115,-105],[170,568,79,182,-68,-32],[3.771,-4.969],[[-91.384,-83.273,-139.755],[-105.846,166.401,-27.68]]]]},"archer-skin4":{"bow":[[[550,292,126,261,-104,-93],[760,292,101,206,-77,-45],[3.7,-5.046],[[-76.645,-86.296,-133.83],[-92.547,166.191,-13.188]]],[[280,292,133,264,-110,-100],[524,562,97,193,-71,-48],[3.917,-4.868],[[-82.281,-95.766,-121.975],[-97.559,162.047,-16.218]]],[[791,2,143,272,-120,-115],[160,562,93,202,-65,-69],[4.273,-4.559],[[-92.357,-112.2,-97.46],[-105.817,154.957,-20.136]]],[[502,2,145,276,-124,-123],[257,562,90,200,-61,-73],[4.438,-4.41],[[-97.538,-120.26,-83.078],[-109.674,151.579,-21.41]]],[[358,2,140,280,-127,-130],[625,562,80,193,-50,-79],[4.536,-4.281],[[-101.279,-127.691,-68.007],[-111.422,148.006,-24.829]]],[[114,2,115,285,-130,-142],[2,562,65,203,-34,-103],[4.695,-4.061],[[-108.17,-139.341,-38.765],[-114.141,141.663,-30.33]]],[[2,2,108,286,-133,-146],[680,292,76,216,-44,-125],[4.768,-3.957],[[-111.828,-144.293,-22.542],[-115.316,138.445,-32.894]]],[[233,2,121,283,-128,-139],[351,562,68,198,-37,-95],[4.622,-4.116],[[-105.338,-136.384,-47.432],[-112.279,142.815,-30.951]]],[[651,2,136,273,-118,-119],[71,562,85,203,-57,-75],[4.265,-4.501],[[-92.593,-116.283,-90.901],[-104.729,152.685,-25.113]]],[[2,292,136,266,-113,-106],[865,292,91,204,-64,-68],[4.028,-4.743],[[-85.469,-103.168,-112.115],[-99.687,158.727,-20.458]]],[[142,292,134,266,-111,-103],[709,562,92,188,-66,-49],[3.947,-4.821],[[-83.202,-98.932,-118.027],[-97.928,160.628,-18.746]]],[[417,292,129,262,-107,-96],[423,562,97,198,-72,-47],[3.789,-4.967],[[-78.952,-90.801,-128.489],[-94.49,164.227,-15.248]]]]},"archer-skin5":{"bow":[[[571,293,132,270,-107,-102],[2,571,102,221,-73,-64],[3.676,-5.049],[[-76.596,-87.821,-133.9],[-89.581,165.595,-12.782]]],[[147,293,139,272,-113,-108],[612,571,101,212,-70,-63],[3.898,-4.87],[[-82.271,-97.239,-121.968],[-94.58,161.569,-15.793]]],[[818,2,148,277,-123,-120],[508,571,100,214,-66,-74],[4.26,-4.559],[[-92.411,-113.588,-97.329],[-102.816,154.67,-19.701]]],[[517,2,150,280,-128,-127],[813,571,97,208,-62,-74],[4.428,-4.409],[[-97.623,-121.609,-82.891],[-106.663,151.38,-20.98]]],[[371,2,142,283,-130,-133],[108,571,89,217,-53,-89],[4.529,-4.279],[[-101.411,-129.028,-67.712],[-108.433,147.878,-24.364]]],[[2,2,119,287,-134,-143],[874,293,71,225,-33,-117],[4.692,-4.058],[[-108.37,-140.659,-38.281],[-111.196,141.65,-29.813]]],[[125,2,113,287,-136,-147],[707,293,85,234,-47,-137],[4.766,-3.954],[[-112.051,-145.602,-21.962],[-112.394,138.484,-32.354]]],[[242,2,125,286,-132,-141],[796,293,74,228,-37,-116],[4.617,-4.113],[[-105.537,-137.719,-46.96],[-109.345,142.77,-30.414]]],[[671,2,143,278,-122,-124],[717,571,92,209,-58,-75],[4.252,-4.5],[[-92.701,-117.69,-90.656],[-101.774,152.426,-24.609]]],[[2,293,141,274,-115,-114],[201,571,97,217,-65,-74],[4.011,-4.744],[[-85.508,-104.624,-112.011],[-96.723,158.325,-19.992]]],[[290,293,139,272,-113,-110],[406,571,98,216,-67,-69],[3.928,-4.822],[[-83.219,-100.405,-117.966],[-94.963,160.178,-18.294]]],[[433,293,134,271,-109,-105],[302,571,100,217,-70,-64],[3.767,-4.969],[[-78.928,-92.308,-128.512],[-91.524,163.684,-14.824]]]]},"archer-skin6":{"bow":[[[276,290,128,272,-117,-102],[927,290,83,180,-71,-30],[3.693,-5.047],[[-88.29,-80.927,-146.622],[-104.835,168.477,-25.974]]],[[408,290,136,272,-124,-107],[157,568,81,174,-69,-32],[3.912,-4.869],[[-94.839,-91.177,-134.056],[-110.671,163.507,-28.293]]],[[725,2,147,275,-135,-117],[479,568,77,170,-64,-39],[4.27,-4.559],[[-106.611,-109.017,-107.881],[-120.377,155.131,-30.553]]],[[568,2,153,276,-140,-122],[242,568,72,173,-58,-52],[4.435,-4.41],[[-112.703,-117.793,-92.443],[-124.966,151.211,-30.771]]],[[409,2,155,279,-143,-129],[861,290,62,184,-48,-76],[4.534,-4.28],[[-117.111,-125.857,-76.63],[-127.103,147.133,-33.45]]],[[130,2,133,282,-147,-140],[755,290,48,217,-33,-119],[4.694,-4.061],[[-125.271,-138.571,-45.843],[-130.499,140.121,-37.407]]],[[2,2,124,284,-149,-145],[691,290,60,228,-45,-131],[4.767,-3.956],[[-129.623,-144.018,-28.718],[-132.008,136.691,-39.07]]],[[267,2,138,281,-145,-137],[807,290,50,202,-36,-103],[4.621,-4.115],[[-121.899,-135.309,-55.279],[-128.237,141.356,-38.798]]],[[876,2,146,275,-134,-120],[2,568,67,177,-54,-57],[4.261,-4.501],[[-106.879,-113.378,-101.451],[-119.132,152.476,-35.659]]],[[548,290,139,272,-127,-111],[399,568,76,172,-63,-37],[4.023,-4.743],[[-98.551,-99.159,-123.821],[-113.172,159.541,-32.159]]],[[137,290,135,273,-124,-109],[318,568,77,173,-65,-36],[3.942,-4.821],[[-95.91,-94.575,-130.052],[-111.11,161.795,-30.766]]],[[2,290,131,274,-120,-105],[73,568,80,175,-68,-32],[3.783,-4.967],[[-90.968,-85.789,-141.037],[-107.095,166.103,-27.79]]]]},"archer-skin0":{"bow":[[[214,294,98,257,-89,-94],[757,294,75,169,-66,-25],[3.662,-5.051],[[-75.887,-75.701,-125.053],[-85.323,143.216,-20.217]]],[[2,294,104,262,-94,-103],[2,560,74,164,-64,-27],[3.885,-4.871],[[-81.455,-84.483,-114.072],[-90.293,139.229,-22.17]]],[[647,2,112,272,-102,-119],[836,294,71,168,-60,-39],[4.252,-4.559],[[-91.356,-99.646,-91.298],[-98.535,132.451,-24.106]]],[[414,2,116,277,-106,-127],[542,294,67,171,-56,-47],[4.422,-4.409],[[-96.415,-107.031,-77.911],[-102.415,129.254,-24.322]]],[[298,2,112,281,-108,-135],[477,294,61,172,-49,-54],[4.525,-4.278],[[-100.051,-113.819,-63.89],[-104.326,125.976,-26.369]]],[[97,2,94,287,-111,-147],[378,294,44,196,-32,-94],[4.69,-4.056],[[-106.672,-124.348,-36.66],[-107.372,120.298,-29.33]]],[[2,2,91,288,-114,-151],[316,294,58,210,-46,-120],[4.765,-3.952],[[-110.142,-128.751,-21.542],[-108.733,117.502,-30.537]]],[[195,2,99,286,-109,-144],[426,294,47,189,-35,-85],[4.615,-4.111],[[-103.957,-121.716,-44.762],[-105.498,121.337,-30.441]]],[[534,2,109,275,-101,-124],[613,294,64,171,-53,-48],[4.245,-4.499],[[-91.608,-103.425,-85.252],[-97.655,130.389,-28.084]]],[[763,2,106,267,-96,-111],[911,294,69,168,-59,-37],[4.0,-4.744],[[-84.613,-91.34,-104.967],[-92.506,136.08,-25.318]]],[[873,2,104,264,-94,-106],[681,294,72,170,-62,-34],[3.916,-4.822],[[-82.378,-87.423,-110.443],[-90.73,137.888,-24.169]]],[[110,294,100,259,-91,-98],[80,560,73,163,-63,-24],[3.753,-4.97],[[-78.175,-79.886,-120.12],[-87.271,141.329,-21.715]]]]},"warrior-skin0":{"sword":[[null,[56,2,37,293,-18,-263],[-0.445,-262.412]],[null,[195,2,37,286,-18,-254],[-0.429,-253.011]],[[436,2,26,191,-16,-215],[523,2,32,139,-15,-109],[-0.363,-213.784]],[[466,2,25,170,-15,-185],[604,2,25,92,-9,-64],[-0.313,-184.583]],[[495,2,24,161,-12,-215],[559,2,41,133,-20,-103],[-0.364,-214.381]],[null,[236,2,52,286,-26,-255],[-0.431,-253.895]],[null,[2,2,50,294,-25,-264],[-0.445,-262.731]],[null,[97,2,51,291,-25,-260],[-0.439,-258.823]],[null,[292,2,47,274,-23,-243],[-0.411,-242.445]],[null,[389,2,43,261,-21,-230],[-0.389,-229.618]],[null,[343,2,42,274,-21,-243],[-0.41,-242.015]],[null,[152,2,39,290,-19,-259],[-0.438,-258.191]]]}};

;
/* ./weapon-depth.js */
'use strict';

// These transparent views were projected from each item's actual painted surface.
// Each view contains disjoint back/front coverage and its projected strike or string points.
const weaponDepth=(()=>{
 const sheets=new Map();
 let revision=0;
 const clamp=t=>Math.max(0,Math.min(1,t));
 const timings={warrior:[145,270],shadow:[95,270],paladin:[163,270],mage:[112,151],archer:[102,137]};
 function texture(key){
  if(!WEAPON_VIEWS[key])return null;
  let item=sheets.get(key);
  if(item){sheets.delete(key);sheets.set(key,item);return item}
  item=loadAppearanceImage('./assets/weapon-views/'+key+'.webp?v=102');
  sheets.set(key,item);
  // Reloading a gallery or changing equipment should release old decoded sheets.
  if(sheets.size>14)sheets.delete(sheets.keys().next().value);
  item.loaded.then(ready=>{
   if(!ready)return;
   revision++;
   if(typeof actorMotion!=='undefined')actorMotion.refreshAppearance();
  });
  return item;
 }
 function readyFor(key,replacement){
  const needsNative=!replacement||SKIN_RIGS[key].parts.some(p=>p.kind==='shield'||p.kind==='book');
  const native=needsNative&&texture(key),skin=replacement&&texture(replacement.job+'-skin'+replacement.skin);
  return Promise.all([native?.loaded,skin?.loaded]);
 }
 function moment(job,time,hits,ranged){
  if(time===null||time<=0||time>=650)return 0;
  const [wind,hit]=ranged&&job!=='mage'&&job!=='archer'?[108,145]:timings[job];
  const end=hit+(hits-1)*70,follow=end+(650-end)*.35;
  let stage;
  if(time<wind)stage=time/wind;
  else if(time<hit)stage=1+(time-wind)/(hit-wind);
  else if(time<end)stage=2-.2*Math.sin(Math.PI*((time-hit)%70)/70);
  else if(time<follow)stage=2+(time-end)/(follow-end);
  else stage=3+(time-follow)/(650-follow);
  return Math.round(stage*3)%12;
 }
 function view(key,part,pose,angle,time,hits,ranged,replacement,socket=null){
  const job=key.split('-')[0],kind=part.kind;
  const custom=replacement&&!replacement.failed&&kind!=='shield'&&kind!=='book';
  if(custom&&!replacement.ready)return null;
  const id=custom?job+'-skin'+replacement.skin:key,sheet=texture(id);
  if(!sheet?.ready)return null;
  const phase=moment(job,time,hits,ranged);
  const frame=WEAPON_VIEWS[id]?.[kind]?.[phase];
  if(!frame)return null;
  let zoom=1;
  if(Number.isFinite(socket?.bearing)){
   angle=socket.bearing-Math.atan2(frame[2][1],frame[2][0])*180/Math.PI;
   if(custom&&kind==='sword')zoom=(part.rect[2]-2-part.pivot[0])*1.23/250;
  }else if(custom&&kind!=='bow'){
   // The registered vectors already include perspective for this exact view.
   const nativeTip=WEAPON_VIEWS[key][kind][phase][2],customTip=frame[2];
   angle+=(Math.atan2(nativeTip[1],nativeTip[0])-Math.atan2(customTip[1],customTip[0]))*180/Math.PI;
   if(kind==='sword')zoom=(part.rect[2]-2-part.pivot[0])*1.23/250;
  }
  // A lowered bow is carried diagonally beside the body; its upper limb recedes.
  // Extreme native gallery cant would display the whole catalogue face across the waist.
  if(!socket&&kind==='bow'&&angle>18)angle=18+(angle-18)*.33;
  const radians=angle*Math.PI/180,cs=Math.cos(radians),sn=Math.sin(radians);
  const hand=socket?.hand||part.hands[pose];
  function point(local){return [hand[0]+zoom*(local[0]*cs-local[1]*sn),hand[1]+zoom*(local[0]*sn+local[1]*cs)]}
  let string=null,tip=point(frame[2]);
  if(frame[3]){
   const ends=frame[3].map(point),middle=ends[0].map((v,i)=>(v+ends[1][i])*.5);
   // Pose two is the follow-through: the drawing hand has already flown behind
   // the cheek. The released arrow/string must never be attached to that hand.
   const cheek=socket?.nock||part.drawHands?.[1]||middle;
   if(!socket)tip=skinMotion.bowShelf(tip,cheek,ends,pose);
   const pull=socket?.pull??skinMotion.tension(time,hits);
   const nock=socket&&!socket.released?socket.nock:middle.map((v,i)=>v+(cheek[i]-v)*pull);
   string={ends,nock,depths:frame[3].map(p=>p[2]),nockDepth:pull*16+(1-pull)*(frame[3][0][2]+frame[3][1][2])/2};
  }
  return {sheet:sheet.image,frame,hand,angle:radians,zoom,string,tip};
 }
 function bowLines(ctx,string,front){
  for(let i=0;i<2;i++){
   let a=string.ends[i],b=string.nock;
   const za=string.depths[i],zb=string.nockDepth;
   const aNear=za>=0,bNear=zb>=0;
   if(aNear!==bNear){
    const t=clamp(za/(za-zb)),cut=a.map((v,j)=>v+(b[j]-v)*t);
    if(aNear===front)b=cut;else a=cut;
   }else if(aNear!==front)continue;
   ctx.beginPath();ctx.strokeStyle=front?'#e4daaf':'#c4bc9d';ctx.lineWidth=front?1.45:1.1;
   ctx.moveTo(...a);ctx.lineTo(...b);ctx.stroke();
  }
 }
 function paint(ctx,projected,front){
  if(projected.string){ctx.save();bowLines(ctx,projected.string,front);ctx.restore()}
  const region=projected.frame[front?1:0];
  if(!region)return;
  const [x,y,w,h,dx,dy]=region,k=projected.zoom;
  ctx.save();ctx.translate(...projected.hand);ctx.rotate(projected.angle);
  ctx.drawImage(projected.sheet,x,y,w,h,dx*k,dy*k,w*k,h*k);ctx.restore();
 }
 return {view,paint,readyFor,version:()=>revision};
})();

;
/* ./weapon-appearance.js */
'use strict';

// The grip and bow nocks are normalized coordinates in the transparent item art.
// Warrior wind-ups sweep farther above the 512-unit body frame.
const weaponFramePadding=job=>job==='warrior'?288:192;
function seasonWeaponGeometry(job,id){
 return typeof SEASON_WEAPON_GEOMETRY!=='undefined'?SEASON_WEAPON_GEOMETRY[job]?.[id-1]:null;
}
const weaponArtCache=new Map();
function loadAppearanceImage(path){
 const image=new Image();
 image.decoding='async';
 const entry={image,ready:false,loaded:null};
 entry.loaded=new Promise(resolve=>{
  image.onload=()=>{entry.ready=true;resolve(true)};
  image.onerror=()=>{entry.failed=true;resolve(false)};
 });
 image.src=path;
 return entry;
}
// The archer and warrior have fully rigged default weapons as well as cosmetic skins.
const BASE_WEAPON_GRIPS={warrior:[.5000,.8858],archer:[.90764,.51691]};
const BASE_BOW_NOCKS=[[.02842,.07729],[.03020,.93076]];
function appearanceGrip(job,skin){
 return skin===0?BASE_WEAPON_GRIPS[job]:seasonWeaponGeometry(job,skin)?.grip;
}
function weaponAppearance(job,skin){
 if(!Number.isInteger(skin)||!appearanceGrip(job,skin))return null;
 const key=job+'-'+skin;
 if(!weaponArtCache.has(key)){
  const entry=loadAppearanceImage(skin?'./assets/season-weapons/'+key+'.webp':'./assets/weapon-forge/'+key+'.webp?v=49');
  entry.job=job;entry.skin=skin;weaponArtCache.set(key,entry);
  entry.loaded.then(()=>{
   if(typeof actorMotion!=='undefined')actorMotion.refreshAppearance();
  });
 }
 return weaponArtCache.get(key);
}
function selectedWeaponAppearance(job){
 if(typeof s==='undefined'||s?.classId!==job)return null;
 const entry=weaponAppearance(job,s.weapons?.[job]?.skin);
 return entry?.failed?null:entry;
}
function paintedWeaponAngle(part,custom){
 const {kind,rect,pivot}=part;
 if(kind==='bow')return 0;
 const {job,skin,image}=custom,grip=appearanceGrip(job,skin);
 const tip=seasonWeaponGeometry(job,skin)?.tip||[.492,.0082];
 const catalog=Math.atan2((tip[1]-grip[1])*image.naturalHeight,(tip[0]-grip[0])*image.naturalWidth);
 const dagger=kind==='dagger'||kind==='offhand';
 const native=part.tip||(dagger?[pivot[0]>rect[2]/2?0:rect[2]-1,rect[3]*.8]:
  [pivot[0]<rect[2]/2?rect[2]-2:2,rect[3]*.5]);
 // The flat greatsword is authored along the positive local X axis.
 const original=kind==='sword'?0:Math.atan2(native[1]-pivot[1],native[0]-pivot[0]);
 return (original-catalog)*180/Math.PI;
}
function paintSignaturePart(ctx,replacement,part,pose,angle,time,hits){
 const {job,skin,image}=replacement;
 const grip=appearanceGrip(job,skin);
 const shape=part.kind;
 const aspect=image.naturalWidth/image.naturalHeight;
 let h;
 if(shape==='sword'){
  // Measure from the outfit grip to its native tip, then extend the greatsword's reach.
  const reach=(part.rect[2]-2-part.pivot[0])*1.23;
  const tip=skin===0?[.4920,.0082]:seasonWeaponGeometry(job,skin).tip;
  const dx=(tip[0]-grip[0])*aspect,dy=tip[1]-grip[1];
  h=reach/Math.hypot(dx,dy);

 }else{
  h={dagger:108,offhand:90,staff:403,bow:302,mace:177}[shape];

 }
 const w=h*aspect;
 const rotation=angle+paintedWeaponAngle(part,replacement);
 const joint={pivot:[w*grip[0],h*grip[1]],hands:part.hands,drawHands:part.drawHands};
 if(shape==='bow'){
  joint.stringTips=(skin===0?BASE_BOW_NOCKS:seasonWeaponGeometry(job,skin).nocks).map(([x,y])=>[w*x,h*y]);
  const [a,n,b]=skinMotion.bowLine(joint,pose,rotation,time,hits);
  ctx.save();ctx.beginPath();ctx.strokeStyle='#e4daaf';ctx.lineWidth=1.45;
  ctx.moveTo(...a);ctx.lineTo(...n);ctx.lineTo(...b);ctx.stroke();ctx.restore();
 }
 ctx.save();ctx.translate(...part.hands[pose]);ctx.rotate(rotation*Math.PI/180);
 ctx.drawImage(image,-joint.pivot[0],-joint.pivot[1],w,h);ctx.restore();
 if(['staff','mace','sword','dagger'].includes(shape)){
  const tip=seasonWeaponGeometry(job,skin)?.tip||(shape==='sword'?[.492,.0082]:[.5,.10]);
  return skinMotion.rotated(joint,pose,rotation,[w*tip[0],h*tip[1]]);
 }
 if(shape==='bow'){
  const shelf=skinMotion.rotated(joint,pose,rotation,[joint.pivot[0]+5,joint.pivot[1]-4]);
  return skinMotion.bowShelf(shelf,part.drawHands?.[1],joint.stringTips.map(end=>skinMotion.rotated(joint,pose,rotation,end)),pose);
 }
 return null;
}

// A portrait uses the same four-layer compositor as battle. Replacing the whole
// painted pose keeps both the hand mask and secondary book/shield in front.
const appearanceRigs=new Map(),appearanceStills=new Map();
function weaponStill(key,replacement){
 const id=key+':'+(replacement?.skin??'native');
 if(appearanceStills.has(id))return appearanceStills.get(id);
 if(!appearanceRigs.has(key))appearanceRigs.set(key,loadAppearanceImage(heroRigURL(key)));
 const atlas=appearanceRigs.get(key);
 const pending=Promise.all([atlas.loaded,replacement?.loaded??true,weaponDepth.readyFor(key,replacement),secondaryMotion.ready(key)]).then(async ([bodyReady,weaponReady])=>{
  if(!bodyReady)return null;
  if(!weaponReady)await weaponDepth.readyFor(key,null);
  const canvas=document.createElement('canvas');
  canvas.width=704;canvas.height=704;
  const ctx=canvas.getContext('2d');if(!ctx)return null;
  ctx.translate(96,96);
  skinMotion.paintActor(ctx,atlas.image,SKIN_RIGS[key],key,0,null,1,false,weaponReady?replacement:null);
  // Encode one shared still; frequent menu redraws reuse the browser's image
  // decoder and create only a lightweight image node for each portrait.
  return new Promise(resolve=>canvas.toBlob(blob=>{
   if(!blob){resolve(null);return}
   const file=new FileReader();
   file.onload=()=>resolve(file.result);file.onerror=()=>resolve(null);
   file.readAsDataURL(blob);
  },'image/webp',.94));
 }).catch(()=>null);
 appearanceStills.set(id,pending);
 if(appearanceStills.size>18)appearanceStills.delete(appearanceStills.keys().next().value);
 if(appearanceRigs.size>8)appearanceRigs.delete(appearanceRigs.keys().next().value);
 return pending;
}
function weaponPortraitMarkup(job,rank,skin=typeof s!=='undefined'&&s?.classId===job?s.weapons?.[job]?.skin:undefined){
 return SKIN_RIGS[job+'-'+rank]&&(skin===0||appearanceGrip(job,skin))?'<weapon-portrait data-rig="'+job+'-'+rank+'" data-skin="'+skin+'" aria-hidden="true"></weapon-portrait>':'';
}
if(typeof customElements!=='undefined'&&!customElements.get('weapon-portrait')){
 customElements.define('weapon-portrait',class extends HTMLElement{
  connectedCallback(){
   const key=this.dataset.rig,rig=SKIN_RIGS[key];if(!rig||this.firstChild)return;
   const replacement=weaponAppearance(key.split('-')[0],+this.dataset.skin);
   weaponStill(key,replacement).then(src=>{
    if(!this.isConnected||this.firstChild)return;
    if(!src){this.nativePortrait(key);return}
    const image=new Image();image.alt='';image.decoding='async';
    image.onerror=()=>this.nativePortrait(key);image.src=src;this.appendChild(image);
   });
  }
  nativePortrait(key){
   const owner=this.parentElement;
   this.replaceChildren();
   if(owner?.hasAttribute('data-weapon-outfit')){
    owner.removeAttribute('data-weapon-outfit');
    this.hidden=true;
    return;
   }
   // A standalone shop try-on also has a native outfit fallback.
   const [job,rank]=key.split('-'),a=rank==='event'&&!MATURE_ART[key]?
    {image:'var(--royal-'+job+')',size:'400% 500%',y:100}:classAtlas(job,rank==='event'?rank:+rank);
   this.style.backgroundImage=a.image;this.style.backgroundSize=a.size;
   this.style.backgroundPosition='0 '+a.y+'%';this.style.backgroundRepeat='no-repeat';
  }
 });
}

;
/* ./summon-shop.js */
'use strict';

const SHOP_SUMMONS={skill:'스킬',pet:'동료'};
let shopSummonKind='skill';

function openShopSummons(kind){
 if(!Object.hasOwn(SHOP_SUMMONS,kind)||kind==='pet'&&!guardFeature('pets'))return false;
 shopSummonKind=kind;
 navigate('shop','summon');return true;
}
function selectShopSummon(kind){
 if(resultAction||!Object.hasOwn(SHOP_SUMMONS,kind)||kind==='pet'&&!guardFeature('pets'))return false;
 shopSummonKind=kind;renderScreen(false);
}
function summonOddsGrid(rows){
 return '<div class="summon-odds-grid">'+rows.map(({name,color,chance})=>
  `<span style="--rarity:${color}"><i aria-hidden="true"></i><span>${name}</span><b>${petPercent(chance)}</b></span>`
 ).join('')+'</div>';
}
function summonOddsPanel(rows,label,openAction,heading='등급별 확률'){
 return `<section class="summon-odds-panel" aria-label="${label}"><header><h3>${heading}</h3><button type="button" class="odds-info" aria-label="${label}" onclick="${openAction}"><span aria-hidden="true"><ui-mark data-shape=bang aria-hidden=true></ui-mark></span></button></header>${summonOddsGrid(rows)}</section>`;
}
function summonOddsGroup(row,items){
 const entries=items.map(item=>`<div>${item.icon}<span>${item.name}</span><b>${petPercent(item.chance)}</b></div>`).join('');
 return `<section class="summon-rate-group"><h3><i style="--rarity:${row.color}"></i>${row.name}<b>${petPercent(row.chance)}</b></h3>${entries}</section>`;
}
function petSummonCounter(){
 const owned=PETS.filter((_,i)=>s.pets[i]>0).length;
 return '<section class="companion-sanctuary"><div><h2>별의 동료 소환</h2><span>수집 '+owned+' / '+PETS.length+'</span></div></section>'+
 summonOddsPanel(PET_TIERS.map(t=>({name:t.name,color:t.color,chance:t.weight/100})),'동료 등급별·개별 확률',"openMenu('petRates')")+drawControls('pet');
}
function weaponSkinGrid(){
 const w=currentWeapon(),job=s.classId;
 const appearances=WEAPON_APPEARANCE_LEVELS.map((level,id)=>{
  const current=id===w.skin;
  const status=current?' · 현재':level<=w.peakPlus?' · 달성':' 달성 시';
  return `<li class="skin-specimen"${current?' aria-current="true"':''}>${weaponIcon(job,id)}<b>${weaponSkinName(id,job)}</b><small>+${level}${status}</small></li>`;
 });
 return '<ul class="weapon-catalog-grid">'+appearances.join('')+'</ul>';
}
const previousSummonShop=shopScreen;
shopScreen=function(){
 if(screenTab!=='summon')return previousSummonShop();
 if(shopSummonKind==='pet'&&!featureOpen('pets'))shopSummonKind='skill';
 if(shopSummonKind==='skill')primeGrimoireAssets();
 if(shopSummonKind==='pet')primeHatchAssets();
 const tabs=Object.entries(SHOP_SUMMONS).map(([key,title])=>'<button aria-pressed="'+(shopSummonKind===key)+'" onclick="selectShopSummon(\''+key+'\')">'+title+'</button>').join('');
 return '<nav class="shop-summon-tabs" aria-label="소환 종류">'+tabs+'</nav>'+
  (shopSummonKind==='pet'?petSummonCounter():summonScreen());
};

function weaponCodex(){
 const w=currentWeapon(),ready=collectionPending(0).length,icon=collectionGearIcon(0);
 const cells=RAR.map((_,r)=>{
  const found=!!s.unlocked['0_'+r],fresh=isNewDiscovery(0,r);
  return '<button class="weapon-milestone '+(found?'found':'')+'" onclick="openMenu(\'collectionItem\','+r+')">'+icon+'<b>+'+WEAPON_CODEX_LEVELS[r]+'</b><small>'+(fresh?'보상 가능':found?'수령 완료':'미발견')+'</small></button>';
 }).join('');
 return '<div class="weapon-codex-intro">'+icon+'<div><small>'+currentClass().name+' 전용 무기</small><h2>'+weaponLabel()+' +'+w.plus+'</h2><span>숙련 '+weaponRank(w)+'단계 · '+weaponSkinName(w.skin)+'</span></div></div>'+
 '<div class="codex-heading"><h3>무기 모습</h3></div>'+weaponSkinGrid()+
 '<div class="codex-heading weapon-record-heading"><h3>강화 기록</h3><span>'+discoveryKeys(0).length+' / 11</span></div>'+
 '<p class="small">+25까지 강화 기록 11개를 수집합니다. 기존에 발견한 무기 등급도 포함됩니다.</p>'+
 '<div class="weapon-milestone-grid">'+cells+'</div><div class="action-row">'+button(ready?'발견 보상 · 다이아 '+num(ready*20):'보상 수령 완료','claimCollection(0)',!ready)+button('무기 성장',"navigate('forge','weapon')",false,true)+'</div>';
}
function weaponRecordDetail(r){
 const stage=WEAPON_CODEX_LEVELS[r],found=!!s.unlocked['0_'+r];
 return '<div class="weapon-codex-intro">'+collectionGearIcon(0)+'<div><small>전용 무기 강화 기록</small><h2>'+weaponLabel()+' +'+stage+'</h2><span>'+(found?(isNewDiscovery(0,r)?'보상 수령 가능 · 다이아 20':'발견 보상 수령 완료'):'강화 +'+stage+' 달성 시 발견')+'</span></div></div>'+
 '<div class="action-row">'+button('무기 성장',"navigate('forge','weapon')")+button('무기 도감',"openMenu('collectionPart',0)",false,true)+'</div>';
}

;
/* ./hatch-ritual.js */
'use strict';

const hatchArtRoot='./assets/summon-ritual/';
let hatchArtPrimed=false;
function primeHatchAssets(){
 if(hatchArtPrimed)return;
 hatchArtPrimed=true;
 for(const name of ['hatch-shells.webp','hatch-cavern.webp','hatch-chip.webp']){
  const image=new Image();
  image.src=hatchArtRoot+name;
  image.decode?.().catch(()=>{});
 }
}

function hatchTableau(reward,animate){
 const layers=reward
  ? '<i class="hatch-sprite hatch-left"></i><i class="hatch-sprite hatch-right"></i>'+
    '<div class="ritual-drop hatch-creature">'+drawRewardArt('pet',reward,animate)+'</div>'+
    '<i class="hatch-sprite hatch-bowl"></i><i class="hatch-sprite hatch-last-shell"></i>'+
    '<div class="hatch-spall"><i></i><i></i><i></i><i></i><i></i></div>'
  : '<div class="hatch-body"><i class="hatch-sprite hatch-sealed"></i>'+
    '<i class="hatch-sprite hatch-veined"></i><i class="hatch-sprite hatch-riven"></i></div>';
 return '<div class="hatch-lens"><i class="hatch-grounding"></i><i class="hatch-reflection"></i>'+
  '<div class="hatch-subject">'+layers+'</div></div>';
}

;
/* ./summon-ritual.js */
'use strict';

let summonRitualKind='skill',summonSkip=null;
const isCostumeRitual=kind=>kind==='costume'||kind==='eventCostume';
const isSummonRitual=action=>action.kind==='skill'||action.kind==='pet'||isCostumeRitual(action.kind)||action.kind==='forge'&&action.n>=10;
const RITUAL_PREP_MS={forge:950,skill:1600,pet:1550,costume:1500,eventCostume:1500};

const GRIMOIRE_ART='./assets/summon-ritual/observatory-';
let grimoirePrimed=false;
function primeGrimoireAssets(){
 if(grimoirePrimed||!document.head)return;
 grimoirePrimed=true;
 for(const state of ['dormant','lit']){
  const image=new Image();image.src=GRIMOIRE_ART+state+'.webp';
 }
 // The static artwork is sufficient on low-motion and data-saving devices.
 if(!resultMotion()||navigator.connection?.saveData)return;
 for(const phase of ['awaken','reveal']){
  const video=document.createElement('video');video.muted=true;video.preload='auto';
  video.src=GRIMOIRE_ART+phase+'.mp4';video.load();
 }
}
function grimoireTableau(reward,motion){
 const plate=GRIMOIRE_ART+(reward?'lit':'dormant')+'.webp';
 const clip=GRIMOIRE_ART+(reward?'reveal':'awaken')+'.mp4';
 const scene=motion?`<video class="grimoire-scene" muted autoplay playsinline disablepictureinpicture poster="${plate}" src="${clip}"></video>`:
  `<img class="grimoire-scene" alt="" src="${plate}">`;
 const skill=reward?'<div class="ritual-drop">'+drawRewardArt('skill',reward,motion)+'</div>':'';
 return '<div class="grimoire-plate" style="background-image:url('+plate+')">'+scene+'</div>'+skill;
}
function summonScene(kind,reward=null,animate=true){
 const pet=kind==='pet';
 const tableau=pet?hatchTableau(reward,animate):grimoireTableau(reward,animate);
 return '<section class="summon-cinema '+(pet?'hatch':'invocation')+(reward?' arrived':' preparing')+(animate?' moving':'')+'" data-tier="'+(reward?.tier||0)+'" style="--aura:'+
  (reward?.color||(pet?'#9af0df':'#e0b5ff'))+'"><div class="ritual-tableau" aria-hidden="true">'+tableau+'</div>'+
  (reward?'<div class="arrival-label"><span>'+reward.grade+'</span><strong>'+reward.name+'</strong></div>':'')+'</section>';
}
function batchForgeScene(){
 return '<section class="forge-shot batch-strike" data-phase="working" data-metal="tempered" aria-label="모루에 쇠를 두드리는 대장장이" style="--shot-time:'+RITUAL_PREP_MS.forge+'ms">'+
  '<div class="forge-camera"><div class="forge-bounce-light"></div><img class="batch-ingot" alt="" src="./assets/weapon-forge/iron.webp">'+
  '<img class="forge-mallet" alt="" src="./assets/weapon-forge/smith-strike.webp"></div></section>';
}
function ritualPreparation(){
 const kind=summonRitualKind;
 if(isCostumeRitual(kind))return costumeRitualPreparation(kind);
 const scene=kind==='forge'?batchForgeScene():summonScene(kind);
 return scene+'<div class="ritual-controls">'+button('연출 건너뛰기','summonSkip?.()',false,true)+'</div>';
}
EXTRA_POPUPS.summonRitual=[()=>isCostumeRitual(summonRitualKind)?costumeRitualTitle(summonRitualKind):
 summonRitualKind==='forge'?'장비 제작':summonRitualKind==='pet'?'동료 소환':'스킬 소환',ritualPreparation];

function forgeBatchHighlight(item,count){
 if(count<10||!item)return '';
 const tier=item.r>=6?3:item.r>=4?2:item.r>=2?1:0;
 return '<div class="forge-highlight rar'+item.r+'" data-tier="'+tier+'"><span class="forge-prize">'+gearArt(item)+'</span><div><small>'+RAR[item.r]+'</small><b>'+safeText(equipmentTitle(item))+'</b></div></div>';
}

function drawRewardArt(kind,item,animate){
 const pet=kind==='pet',original=pet?petArt(item.id):skillArt(item.id);
 if(item.newly)return original;
 const icon=art(pet?'petShard':'shard');
 return `<span class="draw-change${animate?' transforming':''}" aria-hidden="true"><span class="draw-original">${original}</span><span class="draw-fragment">${icon}</span><b class="tile-level draw-quantity">×${item.shards}</b></span>`;
}
function summonArrival(kind,items,animate=resultMotion()&&!resultAction?.skipMotion){
 if(!items.length)return '';
 const pet=kind==='pet',tier=id=>pet?PET_TIERS.indexOf(petTier(id)):SKILL_RULES[id].tier;
 const best=items.reduce((a,b)=>tier(b.id)>tier(a.id)?b:a);
 const id=best.id,grade=tier(id);
 return summonScene(kind,{...best,tier:grade,name:pet?PETS[id]:SK[id][0],grade:pet?PET_TIERS[grade].name:SKILL_GRADES[grade],
  color:pet?PET_TIERS[grade].color:gradeColors[grade]},animate);
}
function drawResultPanel(kind,items){
 if(!items.length)return '';
 const pet=kind==='pet',viewName=pet?'petSummonResult':'summonResult',detail=pet?'petDetail':'skillDetail';
 const label=pet?'동료 조각':'스킬 조각',action=currentResultAction(viewName);
 const animate=resultMotion()&&!resultAction?.skipMotion;
 const total=items.reduce((sum,item)=>sum+item.shards,0);
 const fresh=items.filter(item=>item.newly).length;
 const payment=pet?drawPayment(kind,items.length,!!action?.ticket):null;
 const acquired=fresh?(items.length===1?'신규 · Lv.1':'신규 '+fresh+'종'):'';
 const summary=[items.length+'회',acquired,total?label+' +'+num(total):'',payment?payment.label+' '+num(payment.cost)+' 사용':''].filter(Boolean).join(' · ');
 const tiles=items.map(item=>{
  const id=item.id,name=pet?PETS[id]:SK[id][0],color=pet?petTier(id).color:gradeColors[SKILL_RULES[id].tier];
  const badge=item.newly?'<i class="tile-mark draw-new">신규</i><b class="tile-level">Lv.1</b>':'';
  return `<button type="button" class="collection-tile" style="--rim:${color}" onclick="openMenu('${detail}',${id})" aria-label="${name} · ${item.newly?'신규':label+' '+item.shards+'개'}"><span class="tile-art">${drawRewardArt(kind,item,animate)}${badge}</span><span class="tile-name">${name}</span></button>`;
 });
 const grid=items.length>1?'<div class="collection-grid4">'+tiles.join('')+'</div>':
  `<button class="muted-button draw-detail" onclick="openMenu('${detail}',${items[0].id})">상세 보기</button>`;
 return summonArrival(kind,items,animate)+'<div class="summary-strip">'+summary+'</div>'+grid+resultFooter(action);
}

;
/* ./nickname.js */
'use strict';
let nameBusy=false,nameRevision=0,accountName=null,legacyNamePending=false;
let nicknameSyncOwner=null,nicknameSyncTask=null;
const NICKNAME_MIN=2,NICKNAME_LIMIT=12;
const EXTRA_NICKNAMES=[
 '전설의 세입자','은신 중 재채기','주문은 곱빼기','칼집에 단무지','용용 죽겠지',
 '힐은 셀프','보스도 식후경','포션은 국물만','과녁이 피했어','한 대만 장군',
 '왕년에 슬라임','갑옷은 찬물세탁','퇴마는 칼퇴 후','치명적 길치','강화의 목격자',
 '법사인데 주먹','전리품 영수증','검 뽑다 담 걸림','투구 속 까치','길 잃은 길마',
 '마나 한 잔 외상','도끼는 찍먹','활시위는 고무줄','막타만 출근','용 비늘 때밀이',
 '성검 대여 중','보물상자 집주인','탱커 뒤의 탱커','수상한 감별사','방패로 전 부침'
];
let remainingNicknames=[];
function nicknameField(value){
 return `<div class="nickname-heading"><label class="field-label" for="nicknameInput">기사 이름 · ${NICKNAME_MIN}~${NICKNAME_LIMIT}자</label><button type="button" class="muted-button" data-live-input="true" onclick="suggestNickname()">추천 이름</button></div>
 <div class="nickname-field"><input class="profile-input" id="nicknameInput" data-live-input="true" inputmode="text" autocomplete="off" placeholder="닉네임 입력" aria-describedby="nameFeedback" value="${safeText(value||'')}" oninput="editNicknameDraft(this,event.isComposing)" oncompositionend="editNicknameDraft(this)"><button type="button" class="muted-button" data-live-input="true" onclick="checkNickname()">중복 확인</button></div><span id="nameFeedback" role="status" aria-live="polite"></span>`;
}
function editNicknameDraft(field,composing=false){
 if(!composing){
  const letters=Array.from(field.value.normalize('NFKC'));
  if(letters.length>NICKNAME_LIMIT)field.value=letters.slice(0,NICKNAME_LIMIT).join('');
 }
 profileNameDraft=field.value;nameRevision++;nameFeedback('');
}
function suggestNickname(){
 const field=$('nicknameInput');
 if(nameBusy||!field)return;
 let choices=remainingNicknames.filter(name=>name!==field.value);
 if(!choices.length){
  remainingNicknames=[...PROFILE_FACES,...EXTRA_NICKNAMES];
  choices=remainingNicknames.filter(name=>name!==field.value);
 }
 const name=choices[Math.floor(Math.random()*choices.length)];
 remainingNicknames.splice(remainingNicknames.indexOf(name),1);
 field.value=name;editNicknameDraft(field);
}
function nameFeedback(message){const el=$('nameFeedback');if(el)el.textContent=message}
async function nameRequest(action,name){
 const options={cache:'no-store'};
 if(action)Object.assign(options,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,name})});
 let res,data;
 try{res=await fetch('/api/nickname',options);data=await res.json()}catch{throw Error('이름 서버에 연결할 수 없습니다. 다시 시도해 주세요.')}
 if(!res.ok)throw Object.assign(Error(data.error||'이름을 확인하지 못했습니다.'),{status:res.status});
 return data.name;
}
async function checkNickname(){
 if(nameBusy)return false;
 const name=validNickname(profileNameDraft,NICKNAME_MIN);
 if(!name){nameFeedback(`한글·영문·숫자·공백·_·-로 ${NICKNAME_MIN}~${NICKNAME_LIMIT}자를 입력하세요.`);return false}
 if(testSession||s.testOnly){nameFeedback('테스트 이름으로 사용할 수 있습니다.');return true}
 const owner=s,revision=nameRevision;nameFeedback('확인 중…');
 try{await nameRequest('check',name);if(owner===s&&revision===nameRevision)nameFeedback('사용할 수 있는 이름입니다.')}
 catch(error){if(owner===s&&revision===nameRevision)nameFeedback(error.message)}
}
async function submitNickname(id){
 if(nameBusy||id&&(s.classId||classPreview!==id||pendingClassChoice!==id))return false;
 const resumingName=id&&accountName&&profileNameDraft===accountName;
 const name=validNickname(profileNameDraft,resumingName?1:NICKNAME_MIN);
 if(!name){nameFeedback(`닉네임을 ${NICKNAME_MIN}~${NICKNAME_LIMIT}자로 입력하세요.`);$('nicknameInput')?.focus();return false}
 const owner=s;nameBusy=true;nameRevision++;nameFeedback('등록 중…');
 const field=$('nicknameInput');if(field)field.disabled=true;
 try{
  const localTest=!!(testSession||s.testOnly);
  const registered=localTest?name:await nameRequest(id||legacyNamePending?'claim':'rename',name);
  if(s!==owner)return false;
  s.nickname=registered;profileNameDraft=null;
  if(!localTest){accountName=registered;legacyNamePending=false}
  let success=true;
  if(id){pendingClassChoice='';success=chooseClass(id)}
  else{save();closeMenu();paint();notice('기사 이름을 등록했습니다.')}
  if(!localTest)void saveGuard.accountReady();
  return success;
 }catch(error){nameFeedback(error.message);return false}
 finally{nameBusy=false;if(field)field.disabled=false}
}
function syncAccountNickname(){
 const owner=s;
 if(!owner||testSession||owner.testOnly||nameBusy)return Promise.resolve();
 if(nicknameSyncOwner===owner&&nicknameSyncTask)return nicknameSyncTask;
 nicknameSyncOwner=owner;
 nicknameSyncTask=readAccountNickname(owner).finally(()=>{
  if(nicknameSyncOwner===owner){nicknameSyncOwner=null;nicknameSyncTask=null}
 });
 return nicknameSyncTask;
}
function promptLegacyNickname(message){
 if(!legacyNamePending){legacyNamePending=true;openNameEditor()}
 if(view==='editName')nameFeedback(message);
}
async function readAccountNickname(owner){
 try{
  let name=await nameRequest();
  if(s!==owner||nameBusy||testSession)return;
  if(!name&&s.classId){
   if(!s.nickname||s.nickname==='성운기사'){promptLegacyNickname('서버에 진행을 저장할 닉네임을 등록해 주세요.');return}
   try{name=await nameRequest('claim',s.nickname)}catch(error){
    if(error.status!==400&&error.status!==409)throw error;
    if(s===owner&&!nameBusy&&!testSession)promptLegacyNickname(error.message);
    return;
   }
  }
  if(s!==owner||nameBusy||testSession)return;
  accountName=name;
  if(!name)return;
  legacyNamePending=false;
  if(s.classId&&name&&s.nickname!==name){s.nickname=name;save();paint()}
  if(!s.classId&&name&&!profileNameDraft){profileNameDraft=name;const input=$('nicknameInput');if(input)input.value=name}
  void saveGuard.accountReady();
 }catch(error){if(s===owner&&!testSession)notice(error.message)}
}
window.addEventListener('online',syncAccountNickname);

;
/* ./event-missions.js */
'use strict';

// One objective and one claim per activity in a season.
// The legacy save format maps paid missions by position. Preserve every slot for migration.
const WHEEL_MISSION_CATALOG=[
 ['kills','모험 몬스터 처치',160,'마리'],['skill','전투 스킬 사용',75,'회'],
 ['crafted','모루에서 장비 제작',30,'개'],['dungeon','재료 던전 클리어',5,'회'],
 ['bosses','스테이지 보스 처치',4,'마리'],['fieldOre','모험에서 성운석 획득',60,'개'],
 ['arena','아레나 대전 완료',4,'회'],['worldBoss','월드보스 토벌 참여',3,'회'],
 ['guild','길드 기부',3,'일'],['salvage','장비 분해',18,'개'],
 ['shelf','진열장에 서로 다른 장비 등록',6,'종'],['tower','무한탑 도달',5,'층'],
 ['rush','보스러시 누적 처치',7,'마리'],['haven','성운의 상점에서 교환',4,'회'],
 ['orders','일일 모험 의뢰 보상 수령',5,'건'],['slotLevels','방어구 슬롯 강화 합계',8,'단계'],
 ['skillLevels','보유 스킬의 레벨업 합계',9,'단계'],['petCollection','서로 다른 동료 보유',3,'종'],
 ['relicDepth','유물 강화 레벨 합계',6,'단계'],['raid','월식 레이드 완료',3,'회']
];
const WHEEL_GOALS=WHEEL_MISSION_CATALOG.filter(([key])=>key!=='tower');
const WHEEL_LEGACY={
 kills:[45,150,360,720],skill:[25,90,200,400],crafted:[8,25,60,120],dungeon:[1,3,6,12],bosses:[1,3,5,8]
};
function normalizeWheelJournal(prior={}){
 const count={},claimed=[],carried=[];
 for(const [i,[key,,goal]] of WHEEL_MISSION_CATALOG.entries()){
  const oldKey=Object.keys(WHEEL_LEGACY)[i%5],oldId=oldKey+'-'+WHEEL_LEGACY[oldKey][Math.floor(i/5)];
  const paid=Array.isArray(prior?.claimed)&&prior.claimed.includes(prior.version===2?key:oldId);
  count[key]=paid?goal:Math.floor(bounded(prior?.count?.[key],0,goal));
  if(paid){claimed.push(key);if(prior.version!==2||prior.carried?.includes(key))carried.push(key)}
 }
 return {version:2,count,claimed,carried,spent:Math.floor(bounded(prior?.spent,0,claimed.length))};
}
function wheelJournal(){return royalEventState().missions}
function wheelTokens(){const journal=wheelJournal();return journal.claimed.length-journal.spent}
function recordWheelGoal(key,amount=1){
 const def=WHEEL_GOALS.find(row=>row[0]===key);
 if(!def||!s?.classId||!royalEventActive()||!Number.isFinite(amount)||amount<=0)return;
 const j=wheelJournal();j.count[key]=Math.min(def[2],j.count[key]+amount);
}
function wheelMissionRows(){
 const book=wheelJournal(),total=a=>(a||[]).reduce((v,n)=>v+(Number(n)||0),0);
 const characterGoals={shelf:Object.keys(s.showcaseEntries||{}).filter(k=>!k.startsWith('0:')).length,
 slotLevels:total(s.gearSlotLevels),skillLevels:classSkillIds().reduce((v,id)=>v+Math.max(0,(s.skills[id]||0)-1),0),
 petCollection:Object.values(s.pets||{}).filter(n=>n>0).length,relicDepth:total(s.relics),raid:s.partyRaid?.clears??s.partyRaid?.tier??0};
 return WHEEL_GOALS.map(([id,label,goal,unit])=>{
  const value=Math.min(goal,Math.max(book.count[id],characterGoals[id]||0)),claimed=book.claimed.includes(id);
  return {id,label,goal,unit,value,claimed,carried:book.carried.includes(id),ready:value===goal&&!claimed};
 }).sort((a,b)=>Number(b.ready)-Number(a.ready)||Number(a.claimed)-Number(b.claimed));
}
function eventTokenArt(){return '<img class="event-token-art" src="./assets/event-wheel-token.webp" width="27" height="27" alt="">'}
function claimWheelMission(id){
 if(!guardFeature('roulette')||!s.classId||!royalEventActive())return false;
 const row=wheelMissionRows().find(row=>row.id===id);if(!row?.ready)return false;
 const book=wheelJournal();book.count[id]=row.goal;book.claimed.push(id);save();render();notice('한정 룰렛 코인 +1');return true;
}
function wheelMissionUI(){
 const rows=wheelMissionRows();
 return '<div class="wheel-mission-summary"><b>한정 룰렛 미션</b><span>수령 '+rows.filter(row=>row.claimed).length+' / '+rows.length+'</span></div><p class="wheel-mission-note">'+eventTokenArt()+' 목표마다 한 번, 코인 1개</p>'+
 rows.map(row=>'<div class="wheel-mission-row"><div><strong>'+row.label+'</strong><small>'+num(row.value)+' / '+num(row.goal)+row.unit+'</small></div>'+
 button(row.carried?'이전 미션 수령':row.claimed?'수령 완료':row.ready?'코인 받기':'진행 중',"claimWheelMission('"+row.id+"')",!row.ready||!royalEventActive(),!row.ready)+'</div>').join('');
}
function eventDiamondCost(count){return count===10?4500:500}
function wheelEventActions(){
 const ready=wheelMissionRows().filter(row=>row.ready).length;
 return '<div class="wheel-funds"><span aria-label="다이아 '+num(s.gems)+'">'+art('gem')+' '+num(s.gems)+'</span>'+drawBalance('eventCostume')+
 button('한정 미션'+(ready?' · '+ready:''),"openMenu('wheelMissions')",false,true)+'</div>'+drawControls('eventCostume');
}
EXTRA_POPUPS.wheelMissions=['한정 룰렛 미션',wheelMissionUI];

;
/* ./costume-ritual.js */
'use strict';

const ATELIER_ASSET='./assets/summon-ritual/atelier-';
const ATELIER_COLORS=['#ada29c','#70b9e4','#b690eb','#efbf74','#e78c98','#e9d08e'];

function costumeRitualTitle(kind){
 return kind==='eventCostume'?eventCostumeName():'별빛 스킨 뽑기';
}
function atelierNormalChances(roll){
 // Apply the actual draw's guarantee to the midpoint of each weighted interval.
 const chances=Array(COSTUME_RATES.length).fill(0);
 let cumulative=0;
 for(const weight of COSTUME_RATES){
  if(weight)chances[rollCostumeTier((cumulative+weight/2)/100,roll)]+=weight;
  cumulative+=weight;
 }
 return chances;
}
function atelierEventChances(){
 const pool=royalDrawPool(),due=royalDue(pool);
 const total=royalDrawWeightTotal(pool);
 const rows=pool.map(slot=>{
  const rate=due.length?(slot.id===due[0].id?100:0):100*slot.drawWeight/total;
  return {...slot,rate,bonusDue:due.slice(1).some(bonus=>bonus.id===slot.id)};
 });
 // Distribute the remaining thousandths so every displayed slot still adds up to 100%.
 const units=rows.map(row=>Math.floor(row.rate*1000));
 const remaining=100000-units.reduce((sum,n)=>sum+n,0);
 const remainders=rows.map((row,index)=>({index,fraction:row.rate*1000-units[index]}));
 remainders.sort((a,b)=>b.fraction-a.fraction);
 for(const {index} of remainders.slice(0,remaining))units[index]++;
 return rows.map((row,index)=>({...row,displayRate:units[index]/1000}));
}
function atelierOdds(event){
 if(!event){
  const chances=atelierNormalChances(s.normalCostumeRolls+1);
  return CLASS_RANKS.slice(1).map((name,index)=>({name,color:ATELIER_COLORS[index+1],chance:chances[index+1]}));
 }
 const slots=atelierEventChances();
 return [['eventSkin','한정 스킨','#efaa75'],['title','전용 칭호','#d1aceb'],['resource','재화','#80b7c6']]
  .map(([kind,name,color])=>({name,color,chance:slots.reduce((total,slot)=>total+(slot.kind===kind?slot.displayRate:0),0)}));
}
const atelierPrimed=new Set();
function primeAtelier(event){
 if(event)return;
 const file=ATELIER_ASSET+(event?'phoenix':'standard');
 if(atelierPrimed.has(file)||!document.head||!resultMotion()||navigator.connection?.saveData)return;
 atelierPrimed.add(file);
 const video=document.createElement('video');
 video.muted=true;video.preload='auto';video.src=file+'.mp4';video.load();
 const poster=new Image();poster.src=file+'-dormant.webp';
}
function atelierPlate(event,phase,animate){
 const file=ATELIER_ASSET+(event?'phoenix':'standard');
 const still=file+(phase==='prepare'?'-dormant':'-lit')+'.webp';
 return phase==='prepare'&&animate
  ? '<video class="atelier-backdrop" autoplay muted playsinline disablepictureinpicture preload="auto" poster="'+still+'" src="'+file+'.mp4" aria-hidden="true"></video>'
  : '<img class="atelier-backdrop" alt="" src="'+still+'">';
}
function royalDialMarkup(phase,highlight,animate=true){
 const pool=royalDrawPool(),index=Math.max(0,pool.findIndex(slot=>slot.id===highlight?.slot));
 const step=360/pool.length,target=(360-index*step)%360;
 const inks={eventSkin:'#763d58',title:'#463659',resource:'#243342'};
 const sectors=pool.map((slot,i)=>inks[slot.kind]+' '+(i*step)+'deg '+((i+1)*step-.75)+'deg,#b29769 '+((i+1)*step-.75)+'deg '+((i+1)*step)+'deg').join(',');
 const icons=pool.map((slot,i)=>{
  const theta=i*step*Math.PI/180,x=50+38*Math.sin(theta),y=50-38*Math.cos(theta);
  return '<i class="royal-dial-icon '+slot.kind+'" style="left:'+x+'%;top:'+y+'%">'+royalSlotArt(slot)+'</i>';
 }).join('');
 const motes=animate&&phase==='release'?'<span class="royal-motes">'+Array.from({length:10},(_,i)=>'<i style="--ray:'+i*36+'deg;--delay:'+(i%3)*35+'ms"></i>').join('')+'</span>':'';
 return '<div class="royal-engine '+phase+(animate?' moving':'')+'" aria-hidden="true" style="--slices:conic-gradient(from '+(-step/2)+'deg,'+sectors+');--stop:'+target+'deg">'+
  '<div class="royal-chassis"><div class="royal-flywheel">'+icons+'</div><i class="royal-axis"></i><i class="royal-needle"></i>'+motes+'</div></div>';
}
function atelierFeatured(rows){
 return rows.reduce((best,row)=>atelierRank(row)>atelierRank(best)?row:best);
}
function atelierRehearsal(event){
 if(event)return '<section class="event-dial-stage royal-dial-landing">'+
  '<div class="event-dial-heading"><span>'+currentClass().name+' · 이벤트 룰렛</span><h2>'+safeText(eventCostumeName().split(' · ')[0])+'</h2></div>'+royalDialMarkup('rest')+'</section>';
 const selected=event?eventCostumeSprite(s.classId):costumeSprite(classIndex(s.classId)*OUTFIT_STRIDE+3);
 const title=costumeRitualTitle('costume');
 const subtitle=currentClass().name+' · 희귀~천상';
 return '<section class="atelier-stage atelier-landing '+(event?'phoenix':'standard')+'">'+atelierPlate(event,'arrived',false)+
  '<div class="atelier-display" aria-hidden="true">'+selected+'</div><div class="atelier-caption"><h2>'+title+'</h2><span>'+subtitle+'</span></div></section>';
}
function eventHonorProgress(){
 const t=TITLE_DEFS.find(title=>title.milestone&&!titleOwned(title.id));
 if(!t)return '';
 const count=lifetimeEventDraws();
 const buttonHtml=count>=t.goal?button('칭호 받기',`claimTitle('${t.id}');render()`):'';
 return '<div class="wheel-guarantees"><div><span>'+safeText(t.name)+' 칭호</span><b>'+num(Math.min(count,t.goal))+' / '+num(t.goal)+'회</b></div>'+buttonHtml+'</div>';
}
function atelierShop(event){
 primeAtelier(event);

 const guarantee=event?royalPityPanel():'<div class="wheel-guarantees"><div><span>전설 이상 보장까지</span><b>'+(100-s.normalCostumeRolls%100)+'회</b></div><div><span>천상 보장까지</span><b>'+(500-s.normalCostumeRolls%500)+'회</b></div></div>';
 const info=event?"openMenu('royalRates')":"openMenu('normalCostumeRates')";
 const header=event?'<div class="atelier-event-clock"><span data-royal-clock>'+royalCountdown()+'</span></div>':'';
 const controls=event?button('상시 스킨 소환',"navigate('shop','costumes')",false,true):'';

 return '<div class="atelier-shop"'+(event?' data-wheel-season="'+activeOutfitEventId()+'" data-wheel-active="'+royalEventActive()+'"':'')+'>'+atelierRehearsal(event)+
  summonOddsPanel(atelierOdds(event),event?'이벤트 보상별 확률과 보장 안내':'스킨 등급별 확률과 보장 안내',info,event?'보상별 확률':'등급별 확률')+
  header+(event?wheelEventActions():wheelActions(false))+guarantee+(event?eventHonorProgress():'')+
  '<div class="action-row">'+button('보유 스킨',"navigate('character','costume')",false,true)+controls+'</div></div>';
}
function costumeRitualPreparation(kind){
 const event=kind==='eventCostume';
 if(event)return '<section class="event-dial-stage preparing" aria-label="이벤트 룰렛 회전 중">'+royalDialMarkup('spin',null,resultMotion())+'</section>'+
  '<div class="ritual-controls">'+button('연출 건너뛰기','summonSkip?.()',false,true)+'</div>';
 return '<section class="atelier-stage atelier-preparing '+(event?'phoenix':'standard')+'" aria-label="스킨 소환 중">'+atelierPlate(event,'prepare',resultMotion())+'</section>'+
  '<div class="ritual-controls">'+button('연출 건너뛰기','summonSkip?.()',false,true)+'</div>';
}
function atelierRewardArt(row,extra=''){
 if(row.kind==='skin')return costumeSprite(row.i,extra);
 if(row.kind==='eventSkin')return eventCostumeSprite(row.profession,extra,row.season);
 if(row.kind==='title')return titleEmblem(extra);
 return art(RESOURCE_ART[Object.keys(row.reward)[0]],extra);
}
function atelierRank(row){
 if(row.kind==='skin')return COSTUME_TIERS[row.i];
 return row.kind==='eventSkin'?7:row.kind==='title'?1:0;
}
function atelierGrade(row){
 if(row.kind==='skin')return CLASS_RANKS[COSTUME_TIERS[row.i]];
 return row.kind==='eventSkin'?'이벤트 한정 스킨':row.kind==='title'?'전용 칭호':'재화';
}
function atelierReceipt(){
 if(!costumeResults.length)return resultFooter(currentResultAction('costumeResult'));
 const event=costumeResults[0].source==='event',multi=costumeResults.length>1;
 const best=atelierFeatured(costumeResults);
 const name=safeText(best.name),status=safeText(best.result),motion=resultMotion()&&!resultAction?.skipMotion;
 const caption='<div class="atelier-caption"><span>'+atelierGrade(best)+'</span><h2>'+name+'</h2></div>';
 const hero=event?
  '<section class="event-dial-stage event-arrived'+(motion?' moving':'')+'">'+royalDialMarkup('release',best,motion)+
  '<div class="event-center-prize"><div class="event-winning-tile">'+skinRewardFrame(best)+atelierRewardArt(best)+'</div><b>'+name+'</b></div></section>':
  '<section class="atelier-stage atelier-arrival '+(event?'phoenix':'standard')+(motion?' moving':'')+'">'+atelierPlate(event,'arrived',false)+
  '<div class="atelier-display '+(best.kind==='resource'||best.kind==='title'?'object':'')+'">'+atelierRewardArt(best)+'</div>'+caption+'</section>';
 const receipt=multi?'<div class="loot-grid royal-results">'+costumeResults.map((row,index)=>
  '<div class="loot-card royal-result-'+row.kind+'" style="--result-delay:'+Math.min(index,8)*35+'ms">'+skinRewardFrame(row)+atelierRewardArt(row,'costume-result-hero')+
  '<b>'+safeText(row.name)+'</b><small>'+atelierGrade(row)+' · '+safeText(row.result)+'</small>'+(row.guaranteed?'<small class="royal-guarantee">'+safeText(row.guaranteed)+'</small>':'')+'</div>'
 ).join('')+'</div>':'<div class="atelier-receipt">'+(best.kind==='title'?titleBadge(best.title):'')+'<b>'+status+'</b>'+
  (best.guaranteed?'<span>'+safeText(best.guaranteed)+'</span>':'')+'</div>';
 return hero+receipt+resultFooter(currentResultAction('costumeResult'));
}

function startRoyalTicks(action,phase){
 const wheel=document.querySelector('.royal-engine.'+phase+' .royal-flywheel');
 if(!wheel||!resultMotion())return;
 const count=royalDrawPool().length,step=360/count;
 let prev=0,rotation=0,peg=0,lastSound=-Infinity;
 const started=performance.now(),length=phase==='spin'?1500:1630;
 function frame(now){
  if(resultAction!==action||!wheel.isConnected||document.hidden||!resultMotion())return;
  const transform=getComputedStyle(wheel).transform;
  if(transform!=='none'){
   const m=new DOMMatrixReadOnly(transform),angle=Math.atan2(m.b,m.a)*180/Math.PI;
   rotation+=(angle-prev+540)%360-180;prev=angle;
   const next=Math.floor(rotation/step+.5);
   if(next!==peg){
    peg=next;
    if(now-lastSound>34&&s.sound&&soundContext?.state==='running'){
     const audio=soundContext,at=audio.currentTime,osc=audio.createOscillator(),gain=audio.createGain();
     osc.type='triangle';osc.frequency.setValueAtTime(1040,at);osc.frequency.exponentialRampToValueAtTime(420,at+.025);
     gain.gain.setValueAtTime(.105,at);gain.gain.exponentialRampToValueAtTime(.001,at+.032);
     osc.connect(gain);gain.connect(soundBus());osc.start(at);osc.stop(at+.035);osc.onended=()=>{osc.disconnect();gain.disconnect()};
     lastSound=now;
    }
    const needle=wheel.parentElement.querySelector('.royal-needle');
    needle?.animate?.([{transform:'rotate(-8deg)'},{transform:'rotate(0deg)'}],{duration:78,easing:'ease-out'});
   }
  }
  if(now-started<length)requestAnimationFrame(frame);
  else if(phase==='release')playSound('reward');
 }
 requestAnimationFrame(frame);
}

;
/* ./admission.js */
'use strict';

const MATERIAL_ENTRIES=['gold','armory','library'];
const ENTRY_PASSES={
 gold:{name:'황금 광산',resource:'goldPass',market:'guild'},
 armory:{name:'고대 무기고',resource:'armoryPass',market:'guild'},
 library:{name:'마법 도서관',resource:'libraryPass',market:'guild'},
 mine:{name:'별의 광산',resource:'minePass',market:'guild'},
 rush:{name:'보스 러시',resource:'rushPass',market:'worldBoss'},
 arena:{name:'아레나',resource:'arenaPass',market:'arena'}
};
const ENTRY_PASS_PRICE=50;
const ENTRY_COIN_PRICE=40;
const ENTRY_PASS_DAILY_LIMIT=3;
const entryArtKeys=new Set(['passBundle']);
for(const entry of Object.values(ENTRY_PASSES)){
 const key=entry.resource;
 entryArtKeys.add(key);
 RESOURCE_NAMES[key]=entry.name+' 입장권';
 RESOURCE_ART[key]=key;
 entry.shopId='pass-'+key;
 TOWN_SHOP_ITEMS.push({id:entry.shopId,kind:entry.market,name:RESOURCE_NAMES[key],art:key,reward:{[key]:1},quantity:1,cost:ENTRY_COIN_PRICE,limit:ENTRY_PASS_DAILY_LIMIT});
}
RESOURCE_NAMES.tickets='입장권 '+Object.keys(ENTRY_PASSES).length+'종 묶음';
RESOURCE_ART.tickets='passBundle';

const artBeforeAdmissions=art;
art=function(key,cls=''){
 if(!entryArtKeys.has(key))return artBeforeAdmissions(key,cls);
 return catalogIcon(key,cls);
};

function entryCount(value){
 return Number.isFinite(value)?Math.min(Number.MAX_SAFE_INTEGER,Math.max(0,Math.floor(value))):0;
}
function initializeAdmission(save,raw){
 const legacy=raw&&raw.admissionVersion!==1;
 for(const [key,entry] of Object.entries(ENTRY_PASSES)){
  const material=MATERIAL_ENTRIES.indexOf(key);
  let oldStock=0;
  if(legacy&&material>=0)oldStock=entryCount(raw.tickets?.[material]);
  if(legacy&&key==='mine')oldStock=entryCount(raw.mineTickets);
  save[entry.resource]=oldStock+entryCount(raw?.[entry.resource]);
 }
 save.admissionVersion=1;
 // Older dashboard code expects an array. All transferable inventory is now typed.
 save.tickets=[0,0,0];
 delete save.mineTickets;
 const usage=raw?.daily?.admissions;
 save.daily.admissions={};
 for(const key of Object.keys(ENTRY_PASSES)){
  if(key==='arena')continue;
  const used=key==='rush'?usage?.rush??raw?.daily?.rush:usage?.[key];
  save.daily.admissions[key]=Math.min(3,entryCount(used));
 }
 return save;
}
const beforeAdmissionStarter=starter,beforeAdmissionMigrate=migrate;
starter=function(){return initializeAdmission(beforeAdmissionStarter(),null)};
migrate=function(raw){return initializeAdmission(beforeAdmissionMigrate(raw),raw)};

function entryAvailability(key,arenaDaily){
 if(!Object.hasOwn(ENTRY_PASSES,key))return {limit:0,free:0,stock:0,can:false};
 const def=ENTRY_PASSES[key],limit=key==='arena'?ONLINE_LIMITS.arena:3;
 const used=key==='arena'?arenaDaily.arena:s.daily.admissions?.[key];
 const free=Math.max(0,limit-entryCount(used));
 const stock=entryCount(s[def.resource]);
 return {limit,free,stock,can:free>0||stock>0};
}
function admissionFeature(key){return MATERIAL_ENTRIES.includes(key)?'material':key}
function allowDungeonEntry(key){
 if(dungeonAdmissionPending||!Object.hasOwn(ENTRY_PASSES,key))return false;
 if(!guardFeature(admissionFeature(key)))return false;
 resetDay();
 if(entryAvailability(key).can)return true;
 notice(ENTRY_PASSES[key].name+' 입장권이 부족합니다');return false;
}
function spendEntry(key,arenaDaily){
 if(!guardFeature(admissionFeature(key)))return false;
 if(key!=='arena')resetDay();
 return chargeEntry(key,arenaDaily);
}
// Cleared and abandoned runs settle under the admission already made on entry.
function chargeEntry(key,arenaDaily){
 if(!Object.hasOwn(ENTRY_PASSES,key))return false;
 const {free,stock}=entryAvailability(key,arenaDaily);
 if(!free&&!stock){notice(ENTRY_PASSES[key].name+' 입장권이 부족합니다');return false}
 if(!free){s[ENTRY_PASSES[key].resource]=stock-1;return true}
 if(key==='arena')arenaDaily.arena++;
 else {
  const usage=s.daily.admissions||(s.daily.admissions={});
  usage[key]=entryCount(usage[key])+1;
  if(key==='rush')s.daily.rush=usage.rush;
 }
 return true;
}
function entryStatus(key,arenaDaily){
 const {limit,free}=entryAvailability(key,arenaDaily);
 return (key==='arena'?'무료 ':'일일 입장권 ')+free+' / '+limit;
}
function entryButton(key,action,arenaDaily){
 const {free,can}=entryAvailability(key,arenaDaily);
 if(!can)return '입장권 부족';
 if(key!=='arena')return '입장';
 return free?action:action+' · 입장권 1장';
}
function entrySummary(key,arenaDaily){
 if(!Object.hasOwn(ENTRY_PASSES,key))return '';
 const def=ENTRY_PASSES[key],{stock}=entryAvailability(key,arenaDaily);
 return '<div class="summary-strip">'+art(def.resource)+'<b>'+entryStatus(key,arenaDaily)+'</b><span>입장권 '+num(stock)+'장</span></div>';
}

function admissionShopCards(){
 const shop=onlineState();
 return head('추가 입장권','종류별 하루 3회 · 오전 9시 초기화')+`<div class="offer-grid" data-pass-shop-day="${shop.day}">`+
  Object.entries(ENTRY_PASSES).map(([id,entry])=>{
   const left=ENTRY_PASS_DAILY_LIMIT-shop.daily.diamondPassPurchases[entry.shopId];
   return `<div class="offer-card"><small>보유 ${num(s[entry.resource])}장</small><strong>${entry.name}</strong>`+
    art(entry.resource)+`<small>오늘 ${left}/${ENTRY_PASS_DAILY_LIMIT}회 남음</small>`+
    purchaseButton(left?'다이아 '+ENTRY_PASS_PRICE:'오늘 구매 완료',`askDiamondUse('${entry.name} 입장권 1장',${ENTRY_PASS_PRICE},()=>buyAdmissionPass('${id}'))`,!left||s.gems<ENTRY_PASS_PRICE,true)+'</div>';
  }).join('')+'</div>';
}
function buyAdmissionPass(key){
 if(!Object.hasOwn(ENTRY_PASSES,key))return false;
 return buyListedShopItem(ENTRY_PASSES[key].shopId);
}
function enterArenaOpponent(id){
 if(view!=='online'||tab!=='arena')return false;
 return communityRecords.available()?communityRecords.duel(id):onlineAct('arena',{id});
}

;
/* ./menu-materials.js */
'use strict';
function materialHUD(icon,label,amount,hint,ready){
 return '<div class="material-hud" aria-label="'+label+' 보유량"><span class="material-wallet">'+art(icon)+'<span>'+label+'</span><b>'+num(amount)+'</b></span><small class="'+(ready?'ready':'')+'">'+hint+'</small></div>';
}
function summonMaterialHUD(pet,id){
 const levels=pet?s.pets:s.skills,stock=pet?s.petShards:s.shards,limit=pet?50:100;
 const cost=pet?petCost:skillCost;
 const eligible=k=>levels[k]>0&&levels[k]<limit&&stock>=cost(k);
 const count=id==null?(pet?petDisplayOrder():classSkillIds()).filter(eligible).length:0;
 const ready=id==null?count>0:eligible(id);
 const hint=id==null?'강화 가능 '+count+'종':!levels[id]?'미보유':levels[id]>=limit?'최대 강화':'강화에 '+num(cost(id))+'개 필요';
 return materialHUD(pet?'petShard':'shard',pet?'동료 조각':'스킬 조각',stock,hint,ready);
}
function petMaterialHUD(id){return summonMaterialHUD(true,id)}
function skillMaterialHUD(id){return summonMaterialHUD(false,id)}
function gearMaterialHUD(part){
 const eligible=i=>{const level=s.gearSlotLevels[i],cost=slotUpgradeCost(level);return level<15&&s.gold>=cost.gold&&s.stones>=cost.stones};
 const count=PARTS.slice(1).filter((_,i)=>eligible(i+1)).length;
 const hint=part==null?'강화 가능 '+count+'부위':s.gearSlotLevels[part]>=15?'최대 강화':eligible(part)?'슬롯 강화 가능':'강화 재료 부족';
 return materialHUD('stone','강화석',s.stones,hint,part==null?count>0:eligible(part));
}
const SET_GEAR_STYLES={
 0:['잎맥','녹엽 관모'],1:['검은숲','밤그늘 두건'],2:['붉은 협곡','붉은 갈기 투구'],
 3:['늪안개','주술사의 뼈가면'],4:['잿불','용암뿔 투구'],5:['서리결','빙하 수호 투구'],
 6:['폐허의 은철','금 간 기사면갑'],7:['흑철','군주의 가시 왕관'],
 13:['천공의 빛','성소의 날개관'],14:['공허결','공허 추적 면갑']
};
function setEmblem(id){return SET_GEAR_STYLES[id]?'<img src="'+catalogPath('set-'+id)+'" alt="" width="24" height="24">':''}
const baseGearTitle=equipmentTitle,baseGearArt=gearArt;
equipmentTitle=function(g){
 if(isPlainStarter(g))return '기본 '+PARTS[g.p];
 const theme=SET_GEAR_STYLES[g?.set];if(!theme||!g.p||masterworkDef(g))return baseGearTitle(g);
 return g.p===1?theme[1]:theme[0]+' '+PARTS[g.p];
};
gearArt=function(g,cls=''){
 const theme=SET_GEAR_STYLES[g?.set];if(!theme||!g.p||masterworkDef(g))return baseGearArt(g,cls);
 if(g.p===1)return '<img class="art catalog-icon equipment-art gear-illustration set-helmet '+cls+'" src="'+catalogPath('helmet-'+g.set)+'" alt="" decoding="async">';
 return baseGearArt(g,cls+' set-insignia').replace('data-art=', 'data-set="'+g.set+'" data-art=');
};

;
/* ./star-mine.js */
'use strict';
const mineScene=(()=>{
 let field=null,canvas=null,ctx=null,chips=null,frame=0,animation=null,last=0,particles=[],strikeTimer=null;
 let confirmRun=null,shownHits=0;
 const target=[.635,.54],dustColor=['205,181,207','176,157,145'];
 function focused(){return !!s?.mineRun&&activeScreen==='dungeon'&&screenTab==='mine'}
 function cleanup(){
  cancelAnimationFrame(frame);clearTimeout(strikeTimer);animation?.cancel();frame=0;animation=null;strikeTimer=null;last=0;particles=[];field=canvas=ctx=null;
 }
 function render(){
  const r=s.mineRun,active=!!r,done=active&&Date.now()>=r.end;
  const heading=active?'<button class="mine-leave" onclick="mineScene.askExit()">포기</button>':'';
  return (active?'':backContent())+'<section id="mineView" class="mine-room '+(active?'mining':'')+'"><header><div><h2>별의 광산</h2><b id="mineClock">'+(r?Math.max(0,Math.ceil((r.end-Date.now())/1000))+'초':'60초 채굴')+'</b></div>'+heading+'</header>'+
   '<button id="mineField" class="mine-field" aria-label="별빛 광맥 채굴" onclick="mineHit()" '+(!active||done?'disabled':'')+'><canvas aria-hidden="true"></canvas><img class="mine-pick" src="./assets/star-mine/pick.webp" alt="" draggable="false"></button>'+
   '<div class="mine-foot"><p id="mineScore">'+(active?num(r.hits)+'회 타격 · 예상 성운석 '+num(mineReward()):'광맥을 누르면 채굴량이 늘어납니다.')+'</p>'+
   (active?'<button id="mineClaim" class="gold-button" onclick="claimMine()" '+(done?'':'hidden disabled')+'>채굴 보상 받기</button>':entrySummary('mine')+button(entryButton('mine','채굴 시작'),'startMine()',!!dungeonRun||!entryAvailability('mine').can))+'</div></section>';
 }
 function prepare(){
  const node=$('mineField');if(!node||!node.isConnected)return false;
  if(node!==field){cleanup();field=node;canvas=node.querySelector('canvas');ctx=canvas.getContext('2d');if(!chips){chips=new Image();chips.src='./assets/star-mine/chips.webp'}}
  const w=node.clientWidth,h=node.clientHeight;if(!w||!h)return false;
  const scale=Math.max(w/1008,h/756),x=target[0]*1008*scale-(1008*scale-w)*.46,y=target[1]*756*scale-(756*scale-h)*.5;
  const size=Math.min(w*.46,h*.56,226);
  field.style.setProperty('--mine-tool',size+'px');field.style.setProperty('--mine-left',(x-.988*size)+'px');field.style.setProperty('--mine-top',(y-.40*size)+'px');
  const d=Math.min(1.5,devicePixelRatio||1);
  if(canvas.width!==Math.round(w*d)||canvas.height!==Math.round(h*d)){
   canvas.width=Math.round(w*d);canvas.height=Math.round(h*d);ctx?.setTransform(d,0,0,d,0,0);
  }
  return {x,y,w,h};
 }
 function paint(now){
  frame=0;if(!ctx||!field?.isConnected||document.hidden||!focused()){cleanup();return}
  const dt=Math.min(.04,(now-last)/1000);last=now;ctx.clearRect(0,0,field.clientWidth,field.clientHeight);
  particles=particles.filter(p=>p.age<p.life);
  for(const p of particles){
   p.age+=dt;p.vy+=p.gravity*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.a+=p.spin*dt;
   const opacity=Math.max(0,1-p.age/p.life);ctx.save();ctx.globalAlpha=opacity;
   if(p.dust){
    const radius=p.size*(1+p.age*2),grad=ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,radius);
    grad.addColorStop(0,'rgba('+p.color+',.46)');grad.addColorStop(1,'rgba('+p.color+',0)');ctx.fillStyle=grad;ctx.fillRect(p.x-radius,p.y-radius,2*radius,2*radius);
   }else if(chips.naturalWidth){ctx.translate(p.x,p.y);ctx.rotate(p.a);ctx.drawImage(chips,p.index*32,0,32,32,-p.size/2,-p.size/2,p.size,p.size)}
   ctx.restore();
  }
  if(particles.length)frame=requestAnimationFrame(paint);
 }
 function impact(point,auto,run){
  if(!field?.isConnected||s.mineRun!==run||!focused()||document.hidden)return;
  shownHits=run.hits;updateMineDOM();enemySound.play('stone','impact');
  if(!ctx||!motionAllowed())return;
  const n=auto?9:15;particles=particles.slice(-(55-n));
  for(let i=0;i<n;i++){
   const dust=i%3===0,angle=(.87+Math.random()*1.1)*Math.PI,speed=(dust?25:58)+Math.random()*(dust?40:96);
   particles.push({x:point.x+(Math.random()-.5)*7,y:point.y,age:0,life:(dust?.46:.30)+Math.random()*.36,dust,
    vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,gravity:dust?12:430,index:i%8,
    size:dust?7+Math.random()*8:5+Math.random()*9,a:Math.random()*5,spin:dust?0:Math.random()*14-7,color:dustColor[i%2]});
  }
  if(!frame){last=performance.now();frame=requestAnimationFrame(paint)}
 }
 function strike(auto=false){
  if(!focused()||document.hidden||view)return;
  const r=s.mineRun;
  if(auto&&r.last&&Date.now()-r.last<240)return;
  const point=prepare();if(!point)return;
  if(!motionAllowed()||!field.animate){impact(point,auto,r);return}
  const tool=field.querySelector('.mine-pick');animation?.cancel();clearTimeout(strikeTimer);
  const duration=auto?450:285,hit=auto?.40:.25;
  animation=tool.animate([{transform:'rotate(-25deg)'},{offset:hit,transform:'rotate(0deg)'},{offset:hit+.10,transform:'rotate(1.6deg)'},{transform:'rotate(-25deg)'}],{duration,easing:'linear'});
  strikeTimer=setTimeout(()=>{strikeTimer=null;impact(point,auto,r)},duration*hit);
 }
 function refresh(){
  const r=s.mineRun;if(!r)return;const now=Date.now(),clock=$('mineClock'),score=$('mineScore'),claim=$('mineClaim'),target=$('mineField');
  if(clock)clock.textContent=Math.max(0,Math.ceil((r.end-now)/1000))+'초';
  if(score&&(strikeTimer===null||shownHits===r.hits||now>=r.end))score.textContent=num(r.hits)+'회 타격 · 예상 성운석 '+num(mineReward());
  if(claim){claim.hidden=now<r.end;claim.disabled=now<r.end}if(target)target.disabled=now>=r.end;
 }
 function askExit(){if(!focused())return;if(Date.now()>=s.mineRun.end){claimMine();return}confirmRun=s.mineRun;openMenu('mineExit')}
 function abandon(){if(view!=='mineExit'||s.mineRun!==confirmRun||!confirmRun)return;dismissPopup();if(Date.now()>=confirmRun.end){claimMine();return}confirmRun=null;cleanup();s.mineRun=null;save();paint();renderScreen()}
 document.addEventListener('visibilitychange',()=>{if(document.hidden)cleanup()});
 return {render,strike,refresh,focused,cleanup,askExit,abandon};
})();
EXTRA_POPUPS.mineExit=['채굴 포기',()=>'<p>포기하면 이번 채굴 보상을 잃습니다.</p><div class="action-row">'+button('계속 채굴','closeMenu()',false,true)+button('포기','mineScene.abandon()')+'</div>'];


;
/* ./raid-profiles.js */
'use strict';
const PROFILE_FACES=[
 '껄껄대공','방긋펀치','수염꽈배기','칼퇴일섬',
 '피식 공작','귀가 금값','한눈 감정사','웃참자객',
 '왕관은 셀프','빛의 정수리','꽃따귀 부인','수습 전설',
 '별꼴도사','불장난 초범','뒷북예언가','명상인 척',
 '딸기 밀수꾼','곰네 맏형','귀만 만렙','과녁아 튀어'
];
function faceIndex(n){return Number.isInteger(n)&&n>=0&&n<PROFILE_FACES.length?n:-1}
function displayFaceIndex(portrait,job){
 const selected=faceIndex(portrait);
 return selected>=0?selected:Math.max(0,classIndex(job))*4;
}
function faceURL(n){return './assets/profile-portraits/'+String(n).padStart(2,'0')+'.webp?v=145'}
function profileFace(cls=''){
 const n=displayFaceIndex(s.profileFace,s.classId);
 return '<img class="art custom-face '+cls+'" src="'+faceURL(n)+'" alt="'+PROFILE_FACES[n]+'">';
}
function faceControl(){return '<button class="face-control" onclick="openMenu(\'profileFaces\')" aria-label="프로필 초상화 변경">'+profileFace()+'<span aria-hidden="true"><ui-mark data-shape=edit aria-hidden=true></ui-mark></span></button>'}
function facePicker(){
 const selected=faceIndex(s.profileFace);
 return '<div class="face-grid">'+PROFILE_FACES.map((name,i)=>'<button type="button" onclick="selectProfileFace('+i+')" aria-pressed="'+(selected===i)+'"><img src="'+faceURL(i)+'" alt=""><span>'+name+'</span></button>').join('')+'</div>'+
 '<button class="muted-button face-default" onclick="selectProfileFace(-1)" '+(selected<0?'disabled':'')+'>기본 초상화</button>';
}
function paintProfileFace(){
 const n=displayFaceIndex(s.profileFace,s.classId),el=document.querySelector('.profile .portrait');
 if(!el||el.dataset.face===String(n))return;
 el.dataset.face=String(n);
 el.innerHTML='<img alt="" src="'+faceURL(n)+'">';
}
function selectProfileFace(n){
 if(view!=='profileFaces'||(n!==-1&&faceIndex(n)<0))return false;
 s.profileFace=n;save();closeMenu();paint();return true;
}
EXTRA_POPUPS.dungeonExit=['전투 포기',()=>{
 if(dungeonRun?.mode==='trial')return '<p class="trial-exit-note">이번 판의 보상을 받을 수 없고, 사용한 입장 횟수 1회도 돌아오지 않습니다. 정말 포기하시겠습니까?</p><div class="action-row trial-exit-actions">'+button('계속 도전','cancelTrialExit()',false,true)+button('포기하기','confirmDungeonExit()')+'</div>';

 const note=dungeonRun?.mode==='rush'?'입장권은 이미 사용했습니다. 포기 시 보상은 없습니다.':'포기하면 도전 횟수 1회가 차감됩니다.';
 return '<p>'+note+'</p><div class="action-row">'+button('계속 전투','closeMenu()',false,true)+button('포기','confirmDungeonExit()')+'</div>';
}];
EXTRA_POPUPS.profileFaces=['초상화 선택',facePicker];
const facePaint=paint;paint=function(){const result=facePaint();paintProfileFace();return result};

const raidRecords=(()=>{
 let written='',writing=false,timer=null,owner=null,retryAfter=0;
 function snapshot(){
  if(!s?.classId)return null;
  return {level:s.level,job:s.classId,outfit:String(outfitRigRank()),weapon:s.weapons?.[s.classId]?.skin||0,portrait:faceIndex(s.profileFace)};
 }
 async function request(path,record,signal){
  const res=await fetch('/api/raid/'+path,{method:'POST',headers:{'Content-Type':'application/json'},cache:'no-store',body:JSON.stringify(record),signal});
  if(!res.ok)throw Error('기록 연결 실패');return res.json();
 }
 function schedule(){
  if(!s?.classId||!accountName||typeof fetch==='undefined'||writing||timer!==null||Date.now()<retryAfter)return;
  if(owner!==s){owner=s;written=''}
  const body=JSON.stringify(snapshot());if(body===written)return;
  timer=setTimeout(async()=>{
   timer=null;if(!s?.classId||!accountName)return;
   const current=s,r=snapshot();writing=true;
   try{await request('profile',r);if(current===s)written=JSON.stringify(r)}
   catch{retryAfter=Date.now()+30000}
   finally{writing=false;schedule()}
  },300);
 }
 async function recruit(signal){
  const r=snapshot(),data=await request('recruit',r,signal);
  if(!Array.isArray(data.members))throw Error('기사 기록 형식 오류');
  return data.members.filter(m=>m&&typeof m.name==='string'&&Object.hasOwn(SKIN_RIGS,m.job+'-'+m.outfit)&&
   Number.isInteger(m.level)&&Math.abs(m.level-r.level)<=10).slice(0,4);
 }
 return {snapshot,schedule,recruit};
})();
const beforeRaidRecordSave=save;save=function(){const value=beforeRaidRecordSave();raidRecords.schedule();return value};
const beforeRaidNameSync=syncAccountNickname;syncAccountNickname=async function(){await beforeRaidNameSync();raidRecords.schedule()};


;
/* ./party-raid.js */
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

;
/* ./community.js */
'use strict';
const communityRecords=(()=>{
 const cache=new Map();
 let player=null;
 function available(){return typeof fetch==='function'&&!testSession&&!s.testOnly&&!!accountName}
 function invalidate(kind){if(kind)cache.delete(kind);else cache.clear()}
 function rows(kind,scope=''){
  if(player!==s){invalidate();player=s}
  if(!available())return [];
  let state=cache.get(kind);
  if(!state||state.scope!==scope){state={scope,until:0,rows:[],loading:false,error:false};cache.set(kind,state)}
  if(!state.loading&&Date.now()>=state.until){
   state.loading=true;
   fetch('/api/community/'+kind,{credentials:'same-origin',cache:'no-store',signal:AbortSignal.timeout(8000)})
    .then(async response=>{if(!response.ok)throw Error();const data=await response.json();
     state.rows=kind==='roster'&&data.guild!==scope?[]:data.rows;state.error=false;state.until=Date.now()+30000;
     if(kind==='roster'&&data.guild===scope)state.notice=data.notice||'';
    }).catch(()=>{state.rows=[];state.error=true;state.until=Date.now()+10000})
    .finally(()=>{state.loading=false;if(cache.get(kind)===state&&player===s&&['online','guildMember','wbRanks'].includes(view))render()});
  }
  return state.rows;
 }
 function message(kind,empty){
  const state=cache.get(kind),label=!available()?'계정 연결 후 이용할 수 있습니다.':state?.error?'서버 기록을 불러오지 못했습니다.':state?.loading&&!state.rows.length?'서버 기록을 불러오는 중…':empty;
  return '<p class="online-note" role="status">'+safeText(label)+'</p>';
 }
 function roster(name){return rows('roster',name.toLowerCase())}
 function guildNotice(name){
  roster(name);const state=cache.get('roster');return state?.scope===name.toLowerCase()?state.notice||'등록된 공지가 없습니다.':'';
 }
 async function editGuildNotice(notice){
  const res=await fetch('/api/community/guild-notice',{method:'POST',credentials:'same-origin',signal:AbortSignal.timeout(8000),headers:{'Content-Type':'application/json'},body:JSON.stringify({notice})});
  if(!res.ok)throw Error((await res.json()).error||'공지 저장 실패');
  invalidate('roster');
 }
 function arena(){return rows('arena').map(p=>({...p,id:'peer-'+encodeURIComponent(p.name).replace(/'/g,'%27')}))}
 let arenaPending=null,dueling=false;
 async function duel(id){
  if(dueling||!guardFeature('arena'))return false;
  const opponent=arena().find(p=>p.id===id),actor=s;
  if(!opponent||!entryAvailability('arena',onlineState().daily).can||dungeonRun||forgeBusy)return false;
  if(!arenaPending||arenaPending.name!==opponent.name||arenaPending.actor!==actor)arenaPending={name:opponent.name,actor,id:crypto.randomUUID()};
  dueling=true;
  try{
   const res=await fetch('/api/community/arena',{method:'POST',credentials:'same-origin',signal:AbortSignal.timeout(10000),
    headers:{'Content-Type':'application/json'},body:JSON.stringify({name:opponent.name,id:arenaPending.id})});
   const result=await res.json();if(!res.ok)throw Error(result.error);
   if(s!==actor||testSession||view!=='online'||tab!=='arena')return false;
   const ok=onlineAct('arena',{id,server:result});if(ok)arenaPending=null;return ok;
  }catch(e){notice(e.message||'대결 서버에 연결할 수 없습니다.');return false}
  finally{dueling=false}
 }
 async function worldAction(data){
  const res=await fetch('/api/community/worldboss',{method:'POST',credentials:'same-origin',cache:'no-store',signal:AbortSignal.timeout(8000),
   headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});
  const json=await res.json();
  if(!res.ok)throw Error(json.error||'서버 기록을 저장하지 못했습니다.');
  return json;
 }
 function startWorld(run){
  if(!available())return;
  run.trialCasts=[];
  run.ticket=worldAction({action:'start',skills:run.skills.map(sk=>sk?.id??null)}).then(x=>x.id).catch(()=>null);
 }
 async function endWorld(run,result){
  const id=await run.ticket;if(!id)return;
  try{
   if(!result){await worldAction({action:'cancel',id});return}
   const data=await worldAction({action:'finish',id,casts:run.trialCasts});
   result.trialDamage=data.damage;invalidate('worldboss');
   // The user can have switched screens or completed another fight in the meantime.
   if(s.onlineTest?.lastRaidResult===result && !testSession){save();const label=document.querySelector('[data-world-trial]');if(label)label.textContent=num(data.damage);}
  }catch{if(result && s.onlineTest?.lastRaidResult===result){const label=document.querySelector('[data-world-trial]');if(label)label.textContent='미등록'}}
 }
 return {roster,arena,duel,message,invalidate,rows,available,guildNotice,editGuildNotice,startWorld,endWorld};
})();

;
/* ./chat.js */
'use strict';

const gameChatTabs={world:'전체',guild:'길드',whisper:'귓속말',news:'소식',events:'이벤트'};
const chatDrafts=new Map();
let chatTab='world',chatEpoch=0,chatCursor=0,chatTimer=0,chatPosting=false,chatGuildBusy=false;
let chatRestoreTask=null,chatRefreshId=0,chatRoom=null;

async function chatRequest(path,payload){
 const options={cache:'no-store',credentials:'same-origin',signal:AbortSignal.timeout(10000)};
 if(payload)Object.assign(options,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
 let res,data;
 try{res=await fetch('/api/chat'+path,options);data=await res.json()}
 catch{throw Error('채팅 서버에 연결할 수 없습니다.')}
 if(!res.ok){const error=Error(data.error||'채팅을 불러오지 못했습니다.');error.status=res.status;throw error}
 return data;
}
function applyChatGuild(guild){
 const o=onlineState(),name=guild?.name||'';
 if(o.guild!==name)communityRecords.invalidate('roster');
 if(o.guild===name&&(!name||guildProfile(o).role===guild.role))return;
 if(o.guild!==name){o.guild=name;o.guildProfile=name?newGuildProfile(name,guild.role):null;guildSection='overview'}
 else guildProfile(o).role=guild.role;
 save();if(view==='online')render();
}
function restoreChatGuild(){
 if(!s?.classId||testSession||!accountName)return Promise.resolve();
 if(chatRestoreTask)return chatRestoreTask;
 const player=s;
 chatRestoreTask=chatRequest('/guild',{action:'resume',name:onlineState().guild||''}).then(data=>{
  if(s===player&&!testSession)applyChatGuild(data.guild);
 }).finally(()=>{chatRestoreTask=null});
 return chatRestoreTask;
}
async function changeChatGuild(action,name){
 if(!guardFeature('guild'))return false;
 if(dungeonRun||forgeBusy||chatGuildBusy)return false;
 if(testSession||typeof fetch!=='function'){
  if(action==='leave')return leaveCurrentGuild();
  return onlineAct('join',{name:name==='별빛 기사단'?'starlight':name});
 }
 chatGuildBusy=true;
 const player=s;
 try{
  await chatRestoreTask;
  const data=await chatRequest('/guild',{action,name});
  if(s!==player||testSession)return false;
  const previous=onlineState().guild;
  applyChatGuild(data.guild);
  if(data.guild.name&&previous!==data.guild.name){guildLog(onlineState(),action==='create'?'길드를 창설했습니다':'길드에 가입했습니다');save()}
  if(action==='leave'&&view==='guildLeave')closeMenu();
  paint();notice(data.guild.name?data.guild.name+' 가입 완료':'길드에서 나왔습니다');return true;
 }catch(error){notice(error.message);return false}
 finally{chatGuildBusy=false}
}
function chatSheetGeometry(){
 const game=$('game').getBoundingClientRect(),nav=$('bottomNav').getBoundingClientRect();
 const viewport=window.visualViewport,visible=viewport?viewport.height:window.innerHeight;
 const lower=viewport?viewport.height+viewport.offsetTop:window.innerHeight;
 const keyboard=window.innerHeight-lower>90;
 // Dungeons, the tower and the mine hide the bottom menu; the sheet then rests on the screen's bottom edge.
 const bottom=keyboard||nav.height<=0?lower:Math.min(lower,nav.top);
 const height=Math.max(120,Math.min(keyboard?visible-8:game.height*.62,bottom-(viewport?.offsetTop||0)-4));
 const el=$('chatSheet');
 el.style.setProperty('--chat-left',game.left+'px');el.style.setProperty('--chat-width',game.width+'px');
 el.style.setProperty('--chat-bottom',Math.max(0,window.innerHeight-bottom)+'px');el.style.setProperty('--chat-height',height+'px');
}
function setChatStatus(message){const el=$('chatStatus');el.textContent=message;el.hidden=!message}
function chatWritable(){return ['world','guild','whisper'].includes(chatTab)}
function keepChatDraft(){
 if(!chatWritable())return;
 const prev=chatDrafts.get(chatTab)||{};
 chatDrafts.set(chatTab,{...prev,text:$('chatText').value,to:$('chatTo').value});
}
function selectChatTab(key,recipient=''){
 if(!Object.hasOwn(gameChatTabs,key)||key==='guild'&&!guardFeature('guild'))return false;
 if($('chatSheet').dataset.initialized)keepChatDraft();
 $('chatSheet').dataset.initialized='1';chatTab=key;chatRoom=null;chatEpoch++;chatCursor=0;chatRefreshId++;
 for(const btn of $('chatChannels').querySelectorAll('button'))btn.setAttribute('aria-pressed',String(btn.dataset.channel===key));
 const log=$('chatLog'),draft=chatDrafts.get(key)||{};
 log.replaceChildren();setChatStatus('');
 $('chatTo').hidden=key!=='whisper';$('chatForm').hidden=!chatWritable();
 $('chatText').value=draft.text||'';$('chatTo').value=recipient||draft.to||'';
 if(!chatWritable()){
  if(key==='news')log.innerHTML=GAME_NOTICES.map(n=>`<details class="chat-news"><summary>${safeText(n.title)}</summary><time>${safeText(n.date)}</time><p>${safeText(n.body)}</p></details>`).join('');
  else{
   const name=activeOutfitEventId()===SEASON_TWO_ID?SEASON_TWO_THEME:ROYAL_THEME;
   log.innerHTML=`<section class="chat-news"><strong>${safeText(name)} 한정 룰렛</strong><small>${safeText(royalCountdown())}</small>${royalEventActive()?'<button class="muted-button" data-wheel>룰렛 보기</button>':''}</section>`;paintFeatureLocks(log);
  }
 }else{
  log.innerHTML='<p class="chat-empty">메시지를 불러오는 중…</p>';
 }
 scheduleChat(0);
}
function openGameChat(){
 const sheet=$('chatSheet');
 if(sheet.open||!s?.classId||testSession)return;
 sheet.showModal();chatSheetGeometry();selectChatTab('world');
}
function chatRows(messages){
 return messages.map(m=>{
  const peer=m.mine?m.recipient:m.sender;
  const label=chatTab==='whisper'&&m.mine?'나 → '+m.recipient:m.sender;
  const time=new Date(m.at).toLocaleTimeString('ko-KR',{hour:'2-digit',minute:'2-digit',hour12:false});
  const by=`${safeText(label)}<time>${safeText(time)}</time>`;
  const byline=peer?`<button type="button" class="chat-by" data-whisper="${safeText(peer)}" aria-label="${safeText(peer)}에게 귓속말">${by}</button>`:`<span class="chat-by">${by}</span>`;
  const actions=m.mine?'':`<details class="chat-actions"><summary aria-label="메시지 관리"><ui-mark data-shape=more aria-hidden=true></ui-mark></summary><div><button type="button" data-ignore="${m.id}">차단</button><label>신고 사유 <select>${['욕설·괴롭힘','광고·도배','개인정보 노출','기타'].map(t=>'<option>'+t+'</option>').join('')}</select></label><button type="button" data-report="${m.id}">신고</button></div></details>`;
  return `<article class="chat-row${m.mine?' mine':''}"><img src="${faceURL(faceIndex(m.portrait)<0?0:m.portrait)}" alt=""><div>${byline}<p>${safeText(m.body)}</p></div>${actions}</article>`;
 }).join('');
}
function updateChatTeaser(message){
 $('chatTeaser').textContent=message.sender+': '+message.body;
}
function chatEmpty(message){$('chatLog').innerHTML='<p class="chat-empty">'+safeText(message)+'</p>'}
function scheduleChat(ms){clearTimeout(chatTimer);if(!document.hidden)chatTimer=setTimeout(refreshChat,ms)}
async function refreshChat(){
 const cycle=++chatRefreshId,stamp=chatEpoch,sheet=$('chatSheet'),open=sheet.open;
 const valid=()=>cycle===chatRefreshId&&stamp===chatEpoch&&open===sheet.open&&!document.hidden;
 if(open&&!chatWritable())return;
 let delay=open?4000:25000;
 try{
  if(!s?.classId||testSession||(!open&&view))return;
  if(!open){
   const data=await chatRequest('?channel=world&preview=1');
   if(valid()){if(data.messages.length)updateChatTeaser(data.messages[0]);else $('chatTeaser').textContent='채팅 열기'}
   return;
  }
  if(chatTab==='guild'&&!chatRoom)await restoreChatGuild();
  if(!valid())return;
  const data=await chatRequest('?channel='+chatTab+'&after='+chatCursor);
  if(!valid())return;
  if(chatTab==='guild'){
   if(chatRoom&&chatRoom!==data.room){chatCursor=0;chatRoom=null;chatEmpty('길드 대화를 불러오는 중…');delay=0;return}
   chatRoom=data.room;
  }
  $('chatForm').hidden=false;
  if($('chatStatus').dataset.network){setChatStatus('');delete $('chatStatus').dataset.network}
  const log=$('chatLog'),first=!chatCursor;
  if(data.messages.length){
   const pinned=first||log.scrollHeight-log.scrollTop-log.clientHeight<48;
   if(first)log.replaceChildren();
   log.insertAdjacentHTML('beforeend',chatRows(data.messages));chatCursor=data.messages.at(-1).id;
   while(log.children.length>150)log.firstElementChild.remove();
   if(pinned)log.scrollTop=log.scrollHeight;
   if(!first&&data.messages.length===50)delay=0;
   if(chatTab==='world')updateChatTeaser(data.messages.at(-1));
  }else if(first)chatEmpty(({world:'아직 전체 채팅이 없습니다.',guild:'아직 길드 채팅이 없습니다.',whisper:'주고받은 귓속말이 없습니다.'})[chatTab]);
 }catch(error){
  if(open&&valid()){
   if(error.status===401||error.status===403){chatCursor=0;chatRoom=null;chatEmpty(error.message);$('chatForm').hidden=true}
   else if(!chatCursor)chatEmpty('메시지를 불러오지 못했습니다.');
   setChatStatus(error.status===401||error.status===403?'':error.message);$('chatStatus').dataset.network='1';
  }
 }finally{if(valid())scheduleChat(delay)}
}
async function submitChat(event){
 event.preventDefault();
 if(chatPosting||!chatWritable()||testSession||$('chatForm').hidden)return;
 const channel=chatTab,text=$('chatText').value.trim(),to=channel==='whisper'?$('chatTo').value.trim():'';
 if(!text){$('chatText').focus();return}
 if(channel==='whisper'&&!to){setChatStatus('받는 기사 닉네임을 입력해 주세요.');$('chatTo').focus();return}
 keepChatDraft();const draft=chatDrafts.get(channel),signature=JSON.stringify([text,to]);
 if(draft.signature!==signature){draft.nonce=crypto.randomUUID();draft.signature=signature}
 chatPosting=true;$('chatSend').disabled=true;setChatStatus('');
 try{
  await chatRequest('',{channel,text,to,room:channel==='guild'?chatRoom:undefined,nonce:draft.nonce,portrait:displayFaceIndex(s.profileFace,s.classId)});
  const saved=chatDrafts.get(channel);
  if(saved?.text.trim()===text&&(channel!=='whisper'||saved.to.trim()===to))chatDrafts.set(channel,{text:'',to});
  if($('chatSheet').open&&channel===chatTab){
   if($('chatText').value.trim()===text)$('chatText').value='';
   setChatStatus('');scheduleChat(0);
  }
 }catch(error){if($('chatSheet').open&&channel===chatTab)setChatStatus(error.message)}
 finally{chatPosting=false;$('chatSend').disabled=false}
}
async function moderateChat(action,id,reason){
 try{
  await chatRequest('/moderation',{action,id,reason});
  if(action==='block'){selectChatTab(chatTab);$('chatTeaser').textContent='채팅 열기';}
  setChatStatus(action==='report'?'메시지를 신고했습니다.':'이 기사의 메시지를 차단했습니다.');
 }catch(e){setChatStatus(e.message)}
}
async function showChatBlocks(){
 const epoch=++chatEpoch;chatRefreshId++;clearTimeout(chatTimer);
 chatTab='blocked';chatRoom=null;$('chatForm').hidden=true;$('chatTo').hidden=true;setChatStatus('');
 for(const btn of $('chatChannels').querySelectorAll('button'))btn.setAttribute('aria-pressed',String(btn.dataset.channel==='blocked'));
 chatEmpty('차단 목록을 불러오는 중…');
 try{
  const data=await chatRequest('/moderation');
  if(epoch!==chatEpoch||!$('chatSheet').open)return;
  if(!data.names.length){chatEmpty('차단한 기사가 없습니다.');return}
  $('chatLog').innerHTML=data.names.map(name=>`<p class="chat-block-entry"><span>${safeText(name)}</span><button type="button" data-unblock="${safeText(name)}">차단 해제</button></p>`).join('');
 }catch(e){if(epoch===chatEpoch)chatEmpty(e.message)}
}
function initGameChat(){
 const sheet=$('chatSheet');
 $('chatChannels').innerHTML=Object.entries(gameChatTabs).map(([id,label])=>`<button type="button" data-channel="${id}">${label}</button>`).join('')+'<button type="button" data-channel="blocked">차단 관리</button>';
 paintFeatureLocks($('chatChannels'));
 $('chatChannels').addEventListener('click',e=>{const key=e.target.closest('[data-channel]')?.dataset.channel;if(key==='blocked'){keepChatDraft();void showChatBlocks()}else if(key)selectChatTab(key)});
 $('chatLog').addEventListener('click',e=>{
  const block=e.target.closest('[data-ignore]'),report=e.target.closest('[data-report]'),unblock=e.target.closest('[data-unblock]');
  if(block||report){const b=block||report;b.disabled=true;void moderateChat(block?'block':'report',Number(block?b.dataset.ignore:b.dataset.report),report?.closest('details')?.querySelector('select')?.value).finally(()=>{b.disabled=false});return}
  if(unblock){unblock.disabled=true;void chatRequest('/moderation',{action:'unblock',name:unblock.dataset.unblock}).then(()=>{if(chatTab==='blocked')showChatBlocks()}).catch(e=>setChatStatus(e.message)).finally(()=>{unblock.disabled=false});return}
  const who=e.target.closest('[data-whisper]')?.dataset.whisper;
  if(who){selectChatTab('whisper',who);$('chatText').focus()}
  if(e.target.closest('[data-wheel]')&&guardFeature('roulette')){sheet.close();openMenu('royalEvent')}
 });
 $('chatForm').addEventListener('submit',submitChat);
 $('chatText').addEventListener('keydown',e=>{if(e.key==='Enter'&&(e.isComposing||e.keyCode===229))e.preventDefault()});
 $('chatClose').addEventListener('click',()=>sheet.close());
 sheet.addEventListener('click',e=>{if(e.target===sheet){const r=sheet.getBoundingClientRect();if(e.clientY<r.top||e.clientY>r.bottom||e.clientX<r.left||e.clientX>r.right)sheet.close()}});
 sheet.addEventListener('close',()=>{
  if(sheet.open)return;
  keepChatDraft();delete sheet.dataset.initialized;
  chatTab='world';chatEpoch++;scheduleChat(0);
  $('chatStrip').focus({preventScroll:true});
 });
 const resize=()=>{if(sheet.open)chatSheetGeometry()};
 window.addEventListener('resize',resize);window.visualViewport?.addEventListener('resize',resize);window.visualViewport?.addEventListener('scroll',resize);
 document.addEventListener('visibilitychange',()=>{chatRefreshId++;scheduleChat(0)});
 scheduleChat(1200);
}

;
/* ./rankings.js */
'use strict';

const rankBoard=(()=>{
 const boards={power:['전투력','최고 전투력'],stage:['스테이지','최고 클리어 단계'],guild:['길드','길드 순위']};
 let current=null,cache=new Map();
 function usable(){return !!s?.classId&&!testSession&&!s.testOnly&&!!accountName&&typeof fetch==='function'}
 function ensurePlayer(){
  if(current===s)return;
  current=s;cache=new Map();
 }
 async function request(path,options={}){
  const response=await fetch('/api/rankings'+path,{cache:'no-store',credentials:'same-origin',signal:AbortSignal.timeout(10000),...options});
  if(!response.ok)throw Error();
  return response.json();
 }
 function schedule(){if(usable())void certifiedCombat.connect()}
 async function refresh(key,item){
  const player=s;item.loading=true;
  try{
   if(key==='guild'&&chatRestoreTask)await chatRestoreTask;
   await certifiedCombat.connect();
   const data=await request('?board='+key);
   if(!Array.isArray(data.rows))throw Error();
   item.rows=data.rows;item.failed=false;item.until=Date.now()+30000;
  }catch{item.failed=true;item.until=Date.now()+10000}
  finally{
   item.loading=false;
   if(s===player&&view==='ranking'&&selected()===key&&cache.get(key)===item)render();
  }
 }
 function selected(){return Object.hasOwn(boards,tab)?tab:'power'}
 function choose(key){
  if(!Object.hasOwn(boards,key)||view!=='ranking')return;
  tab=key;render();$('content').scrollTop=0;
 }
 function displayScore(key,score){
  if(key==='guild'&&score==null)return '집계 중';
  if(key==='stage')return stageText(score);
  if(key==='trial')return num(score)+'점';
  if(key==='worldboss')return num(score);
  return ratingText(score);
 }
 function crest(name){
  let tone=0;
  for(const c of name)tone=(tone*31+c.codePointAt(0))%6;
  return '<span class="rank-standard standard-'+tone+'" aria-hidden="true"><i>'+(name?safeText(Array.from(name)[0]):'<ui-mark data-shape=spark aria-hidden=true></ui-mark>')+'</i></span>';
 }
 // The season-two display art is also square. These contact points use its own standing pose.
 const seasonPodium={
  archer:{x:.476,y:.934,height:.844,span:.477},mage:{x:.535,y:.934,height:.854,span:.426},
  paladin:{x:.536,y:.934,height:.848,span:.569},shadow:{x:.463,y:.932,height:.860,span:.895},
  warrior:{x:.477,y:.938,height:.848,span:.584}
 };
 function standingPortrait(src,pose){
  const size='--height-fit:'+(100/pose.height).toFixed(2)+'cqh;--width-fit:'+(95/pose.span).toFixed(2)+'cqw';
  const contact='--foot-x:'+(-100*pose.x).toFixed(2)+'%;--foot-gap:'+((1-pose.y)*100).toFixed(2)+'%';
  return '<img class="rank-champion" style="'+size+';'+contact+'" src="'+src+'" alt="">';
 }
 function figure(key,row,large){
  if(key==='guild')return crest(row.name);
  const profile=row.mine?raidRecords.snapshot():row;
  if(profile&&CLASSES.some(c=>c.id===profile.job)){
   const outfit=profile.job+'-'+profile.outfit;
   const face=faceURL(displayFaceIndex(profile.portrait,profile.job));
   const body=profile.outfit==='season2'?seasonTwoArt(profile.job,'display'):Object.hasOwn(MATURE_ART,outfit)?matureArtURL(outfit):null;
   if(large&&body)return standingPortrait(body,profile.outfit==='season2'?seasonPodium[profile.job]:MATURE_ART[outfit]);
   return '<img class="rank-portrait" src="'+face+'" alt="">';
  }
  return '<span class="rank-seal" aria-hidden="true"><ui-mark data-shape=spark aria-hidden=true></ui-mark></span>';
 }
 function podium(key,rows,title,subtitle){
  const slots=[1,0,2].map(i=>{
   const row=rows[i],slot=['center','left','right'][i];
   if(!row||row.place==null)return '<div class="rank-seat seat-'+slot+' vacant" aria-hidden="true"><div class="rank-plinth"></div></div>';
   const medal=row.place===1?'gold':row.place===2?'silver':'bronze';
   return '<div class="rank-seat seat-'+slot+' medal-'+medal+'"><div class="rank-figure">'+figure(key,row,true)+'</div>'+
    '<div class="rank-plinth"><span class="rank-medal">'+row.place+'위</span><strong>'+safeText(row.name)+'</strong><b>'+displayScore(key,row.score)+'</b></div></div>';
  }).join('');
  return '<section class="rank-hall" aria-label="상위 순위"><header><h3>'+title+'</h3>'+(subtitle?'<small>'+subtitle+'</small>':'')+'</header><div class="rank-podium">'+slots+'</div></section>';
 }
 function entryRow(key,row,mine=false){
  return '<div class="rank-line'+(mine?' rank-personal':'')+'"'+(mine?'':' role="listitem"')+'><b class="rank-position">'+(row.place==null?'—':row.place+'위')+'</b>'+
   '<span class="rank-icon">'+figure(key,row,false)+'</span><span class="rank-identity">'+(mine?'<small>'+(key==='guild'?'내 길드':'내 순위')+'</small>':'')+
   '<strong>'+safeText(row.name)+'</strong></span><b class="rank-value">'+displayScore(key,row.score)+'</b></div>';
 }
 function gallery(key,title,subtitle,rows,status,controls='',personalRow=null){
  const ranked=Array.isArray(rows),records=ranked?rows:[],mine=personalRow||records.find(row=>row.mine);
  // The API includes the current account after the top 50 when necessary.
  const rest=records.slice(0,50).filter((row,index)=>index>=3||row.place==null);
  const list=rest.length?'<div class="rank-list" role="list" aria-label="순위 목록">'+rest.map(row=>entryRow(key,row)).join('')+'</div>':'';
  const personal=mine?entryRow(key,mine,true):ranked?
   '<div class="rank-personal rank-unplaced"><strong>'+(key==='guild'?'내 길드':'내 순위')+'</strong><span>'+(key==='guild'?'가입한 길드 없음':'순위 미등록')+'</span></div>':'';
  return '<section class="rank-gallery" data-board="'+key+'">'+podium(key,records,title,subtitle)+list+status+
   '<footer class="rank-dock">'+personal+controls+'</footer></section>';
 }
 function panel(){
  const key=selected();
  const tabs='<nav class="rank-tabs" aria-label="랭킹 종류">'+Object.entries(boards).map(([id,[label]])=>
   '<button type="button" onclick="rankBoard.choose(\''+id+'\')" aria-pressed="'+(id===key)+'">'+label+'</button>').join('')+'</nav>';
  return onlineGallery(key,boards[key][1],key==='guild'?'길드원의 현재 전투력 합계':key==='stage'?'모험에서 클리어한 단계 · 1분마다 갱신':'모험 기록 기준 최고 전투력 · 1분마다 갱신',tabs);
 }
 function onlineGallery(key,title,subtitle,controls){
  ensurePlayer();
  let status='',rows=null;
  if(testSession||s.testOnly)status='테스트 플레이는 랭킹 집계에서 제외됩니다.';
  else if(!usable())status='닉네임을 연결하면 랭킹이 표시됩니다.';
  else{
   const item=cache.get(key)||{rows:null,until:0,loading:false,failed:false};cache.set(key,item);
   if(!item.loading&&Date.now()>=item.until)void refresh(key,item);
   rows=item.rows;
   if(item.failed)status='랭킹을 불러오지 못했습니다. <button type="button" onclick="rankBoard.retry()">다시 시도</button>';
   else if(!rows)status='랭킹을 불러오는 중…';
   else if(!rows.length)status={guild:'아직 참가한 길드가 없습니다.',stage:'아직 스테이지를 클리어한 기사가 없습니다.',power:'아직 기록된 기사가 없습니다.'}[key];
  }
  return gallery(key,title,subtitle,rows,status?'<p class="rank-message" role="status">'+status+'</p>':'',controls);
 }
 function trialGallery(data,subtitle,controls=''){
  const convert=row=>({place:row.rank,name:row.name,score:row.score,mine:row.isMe});
  const rows=data.top.slice(0,50).map(convert);
  const status=rows.length?'':'<p class="rank-status">이 기간에 등록된 기록이 없습니다.</p>';
  return gallery('trial','오늘의 탑',subtitle,rows,status,controls,data.me?convert(data.me):null);
 }
 function worldTrials(rows,status){
  return gallery('worldboss','월드보스 인증 피해','인증 장비·스킬 기준 · 파수룡 Lv.1부터',rows,status);
 }
 function retry(){const item=cache.get(selected());if(item)item.until=0;render()}
 function invalidate(){cache.clear()}
 return {panel,worldTrials,trialGallery,choose,retry,schedule,invalidate};
})();

EXTRA_POPUPS.ranking=['랭킹',rankingPopup];
// The worker reconstructs the account from its own starter kit, costs and combat engine.
// A browser sends only the player's choice or a receipt the worker has already issued.
const certifiedCombat=(()=>{
 let actor=null,nickname='',profile=null,connecting=null,nextConnect=0,lastFight=null,settling=null,queue=Promise.resolve();
 function active(){return typeof fetch==='function'&&!!s?.classId&&!!accountName&&!testSession&&!s.testOnly}
 function reset(){
  if(actor===s&&nickname===accountName)return;
  actor=s;nickname=accountName;profile=null;connecting=null;nextConnect=0;lastFight=null;settling=null;queue=Promise.resolve();
 }
 async function call(data){
  const res=await fetch('/api/ranked-progress',{method:'POST',credentials:'same-origin',cache:'no-store',signal:AbortSignal.timeout(12000),
   headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});
  const body=await res.json();
  if(!res.ok){const error=new Error(body.error);error.status=res.status;error.readyAt=body.readyAt;error.retryMs=body.retryMs;error.profile=body.profile;throw error}
  return body;
 }
 function update(next,wanted){
  if(!active()||s!==wanted||actor!==wanted)return false;
  if(next){const changed=profile&&next.revision!==profile.revision;profile=next;if(changed)rankBoard.invalidate()}
  return true;
 }
 function connect(){
  if(!active())return Promise.resolve(false);
  reset();
  if(profile)return Promise.resolve(true);
  if(connecting)return connecting;
  if(Date.now()<nextConnect)return Promise.resolve(false);
  const wanted=s;nextConnect=Date.now()+10000;
  connecting=call({action:'register',job:s.classId}).then(r=>update(r.profile,wanted)).catch(()=>false)
   .finally(()=>{if(wanted===actor)connecting=null});
  return connecting;
 }
 function serialize(wanted,work){
  queue=queue.then(async()=>{if(!active()||s!==wanted||!await connect()||s!==wanted)return;await work()}).catch(()=>{});
  return queue;
 }
 function noteAttack(){
  if(!active()||worldBoss.inBattle()||partyRaid.inBattle()||dungeonRun)return;
  reset();
  const mode='stage',target=s.stage;
  if(profile&&target>profile.stage+1&&!(settling?.mode===mode&&target===settling.target+1))return;
  if(lastFight&&lastFight.mode===mode&&lastFight.target===target&&Date.now()<lastFight.retryAt)return;
  const wanted=s,speed=s.speed===2?2:1,run={mode,target,challenge:null,retryAt:Infinity};
  lastFight=run;
  serialize(wanted,async()=>{
   if(target>profile.stage+1)return;
   const result=await call({action:'prepare',mode,target,speed});
   if(update(result.profile,wanted)){run.challenge=result.challenge;run.retryAt=Date.now()+120000}
  }).finally(()=>{if(!run.challenge)run.retryAt=Date.now()+2000});
 }
 const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
 function finish(mode,target){
  const run=lastFight;
  if(!active()||!run||run.mode!==mode||run.target!==target)return;
  const wanted=s;lastFight=null;settling=run;
  serialize(wanted,async()=>{
   const proof=run.challenge;if(!proof)return;
   // The server owns the clock; the first call also handles differences between device clocks.
   let result;
   try{result=await call({action:'finish',id:proof.id})}
   catch(err){
    if(err.status!==425)throw err;
    const serverWait=Number(err.retryMs)||Math.max(0,err.readyAt-Date.now());
    await delay(Math.min(92000,serverWait+100));
    if(!active()||s!==wanted)return;
    result=await call({action:'finish',id:proof.id});
   }
   update(result.profile,wanted);
  }).finally(()=>{if(settling===run)settling=null});
 }
 function grow(stat,count){
  if(!active()||![1,10,50].includes(count))return;
  reset();const wanted=s;
  serialize(wanted,async()=>{
   const id=crypto.randomUUID();
   try{const r=await call({action:'upgrade',stat,count,id,revision:profile.revision});update(r.profile,wanted);lastFight=null}
   catch(e){if(e.profile)update(e.profile,wanted)}
  });
 }
 return {connect,noteAttack,finish,grow,info:()=>active()?profile:null};
})();
// The stage board follows the stored adventure (the server replays the top stage of each save), so ordinary
// attacks no longer start a separate server-side stage proof.
const rankedAdvance=advanceCampaign;
advanceCampaign=function(target){const prior=s.stageKills,out=rankedAdvance(target);if(prior+1>=campaignKillsNeeded(target))certifiedCombat.finish('stage',target);return out};
const rankedUpgrade=upgrade;
upgrade=function(i,...args){const old=s.stats[i],out=rankedUpgrade(i,...args);if(s.stats[i]>old)certifiedCombat.grow(i,s.stats[i]-old);return out};
const nameSyncBeforeRankings=syncAccountNickname;
syncAccountNickname=async function(){await nameSyncBeforeRankings();rankBoard.schedule();if(view==='ranking')render()};

;
/* ./battle-presentation.js */
'use strict';
/* Battle presentation layer (v166 fix8).
   Visual only: nothing here changes damage, rewards, timing rules or saves, and the server's rule
   simulation does not load this file (tools/rank-simulation/build.cjs lists it as presentation).

   Art switches. Every switch starts false and the code-drawn look below stays in place until the
   matching pictures exist. Work order: GPT-전투연출-그림·UI·효과-상세.md (cards A13-A16).
     BATTLE_UI_ART  A13  assets/battle-ui/   route + boss HP frame pictures
     COMBAT_FX_ART  A14  assets/combat-fx/   hit spark, crit burst, slash sheets
     MINE_ART       A15  assets/star-mine/   gloved hand with pickaxe, ore node crack stages, gem
     BOSS_INTRO_ART A16  assets/battle-ui/   boss warning banner                                   */
const BATTLE_UI_ART=false;
const COMBAT_FX_ART=false;
const MINE_ART=false;
const BOSS_INTRO_ART=false;

const battlePresentation=(()=>{
 const ART='./assets/battle-ui/',FX='./assets/combat-fx/';
 // A horned skull, symmetric about x=12 and centred in its 24-unit box, so it never looks tilted.
 const BOSS_GLYPH='<svg class="bp-glyph" viewBox="0 0 24 24" aria-hidden="true"><path d="M5.2 9.2 2.4 3.6l4.9 2.9M18.8 9.2l2.8-5.6-4.9 2.9" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 4.6c-4.2 0-7.4 2.9-7.4 6.8 0 2.2 1.1 4 2.8 5.1v3h2.3v-1.7h1.2v1.7h2.2v-1.7h1.2v1.7h2.3v-3c1.7-1.1 2.8-2.9 2.8-5.1 0-3.9-3.2-6.8-7.4-6.8Z" fill="currentColor"/><circle cx="9.1" cy="11.6" r="1.9" fill="#160d1c"/><circle cx="14.9" cy="11.6" r="1.9" fill="#160d1c"/><path d="M12 13.8 11 15.5h2Z" fill="#160d1c"/></svg>';
 const LAYER_COLORS=['#d9485a','#e07a3c','#d6ad3f','#6fb35a','#3f9cc4','#8a63d9'];
 const ELEMENT_COLORS={fire:'#ff8a3d',ember:'#ff8a3d',frost:'#7fd3ff',ice:'#7fd3ff',holy:'#ffe08a',storm:'#b99bff',lightning:'#b99bff',shade:'#c28bff',venom:'#8ee07a',earth:'#d9b37a',blade:'#f2e6d0'};
 const motion=()=>typeof motionAllowed!=='function'||motionAllowed();
 const battle=()=>document.getElementById('battle');

 /* ---------- Stage route: nine waves and the boss crest ---------- */
 function routeMarkup(stage){
  const step=(stage-1)%10,bossStage=step===9;
  const nodes=Array.from({length:9},(_,i)=>`<span class="bp-node${i<step||bossStage?' done':''}${i===step?' now':''}"></span>`).join('');
  const crest=BATTLE_UI_ART?`<img src="${ART}route-boss.webp" alt="" draggable="false">`:BOSS_GLYPH;
  const progress=bossStage?100:Math.round(step/9*100);
  return `<i class="bp-line" aria-hidden="true"><b style="width:${progress}%"></b></i>${nodes}<span class="bp-crest${bossStage?' now':''}" title="10 · 보스">${crest}</span>`;
 }
 function paintRoute(){
  const route=document.getElementById('route');if(!route||!s)return;
  const key='bp'+s.stage+(BATTLE_UI_ART?'a':'');
  if(route.dataset.bp===key)return;
  route.dataset.bp=key;route.classList.add('bp-route');route.classList.toggle('painted',BATTLE_UI_ART);
  route.innerHTML=routeMarkup(s.stage);
 }

 /* ---------- Boss HP display (stage boss, dungeons, tower) ---------- */
 let hud=null,lastLayer=0,lastHp=null,lastKey='';
 function ensureHud(){
  const field=battle();if(!field)return null;
  if(hud?.isConnected)return hud;
  hud=document.createElement('section');hud.id='bpBossHud';hud.className='bp-boss-hud'+(BATTLE_UI_ART?' painted':'');hud.hidden=true;
  hud.setAttribute('aria-label','보스 체력');
  hud.innerHTML=`<div class="bp-medal">${BATTLE_UI_ART?`<img src="${ART}boss-medal.webp" alt="" draggable="false">`:''}${BOSS_GLYPH}</div>
   <div class="bp-body"><div class="bp-title"><em data-tag></em><b data-name></b><small data-meta></small></div>
   <div class="bp-bar"><i class="bp-under"></i><i class="bp-trail"></i><i class="bp-fill"></i><span class="bp-ticks"></span><b class="bp-layers" data-layers></b></div>
   <div class="bp-foot"><span data-hp></span><span class="bp-clock" data-clock></span><b data-pct></b></div></div>`;
  field.appendChild(hud);return hud;
 }
 function hudState(){
  if(!s?.classId)return null;
  const run=dungeonRun;
  if(run){
   if(!document.body.classList.contains('dungeon-combat'))return null;
   const tag=run.mode==='trial'?`${run.n||1}층`:run.mode==='rush'?'보스 러시':'던전 보스';
   return {hp:run.hp,max:run.maxHp,layers:3,tag,meta:'',clock:'',key:'d'+run.mode+(run.i??'')+(run.n??'')+(run.bosses??'')};
  }
  if(typeof stageBossActive==='function'&&stageBossActive()){
   const left=document.getElementById('stageBossSeconds')?.textContent||'';
   return {hp:s.enemyHp,max:maxHp(),layers:5,tag:'지역 보스',meta:typeof stageText==='function'?stageText():'STAGE '+s.stage,clock:left?left+(String(left).includes('초')?'':'초'):'',key:'s'+s.stage};
  }
  return null;
 }
 function paintHud(){
  const st=hudState(),field=battle();
  field?.classList.toggle('bp-boss-on',!!st);document.body.classList.toggle('bp-boss-on',!!st);
  const el=ensureHud();if(!el)return;
  if(!st){el.hidden=true;lastHp=null;lastKey='';return}
  el.hidden=false;
  const name=typeof encounterFor==='function'?encounterFor(s.stage,dungeonRun).name:'';
  const max=Math.max(1,Number(st.max)||1),hp=Math.max(0,Math.min(max,Number(st.hp)||0));
  const per=max/st.layers,layer=Math.max(1,Math.ceil(hp/per-1e-9)),within=hp<=0?0:(hp-(layer-1)*per)/per*100;
  const fresh=st.key!==lastKey;
  el.querySelector('[data-tag]').textContent=st.tag;
  el.querySelector('[data-name]').textContent=name;
  el.querySelector('[data-meta]').textContent=st.meta;
  el.querySelector('[data-hp]').textContent=compact(hp)+' / '+compact(max);
  el.querySelector('[data-pct]').textContent=(hp/max*100).toFixed(hp/max<.1?1:0)+'%';
  const clock=el.querySelector('[data-clock]');clock.textContent=st.clock?'⏱ '+st.clock:'';
  clock.classList.toggle('urgent',/^\D*([0-9]|10)초?$/.test(st.clock)&&!!st.clock);
  el.querySelector('[data-layers]').textContent=layer>1?'×'+layer:'';
  const fill=el.querySelector('.bp-fill'),trail=el.querySelector('.bp-trail'),under=el.querySelector('.bp-under');
  const color=LAYER_COLORS[(layer-1)%LAYER_COLORS.length],below=layer>1?LAYER_COLORS[(layer-2)%LAYER_COLORS.length]:'transparent';
  el.style.setProperty('--bp-color',color);el.style.setProperty('--bp-under',below);
  if(fresh||layer!==lastLayer){trail.style.transition='none';trail.style.width=(layer!==lastLayer&&!fresh?100:within)+'%';void trail.offsetWidth;trail.style.transition=''}
  fill.style.width=within+'%';under.style.width='100%';
  requestAnimationFrame(()=>{trail.style.width=within+'%'});
  if(lastHp!==null&&hp<lastHp&&motion()){el.classList.remove('struck');void el.offsetWidth;el.classList.add('struck')}
  if(fresh&&motion()){el.classList.remove('arrive');void el.offsetWidth;el.classList.add('arrive')}
  lastHp=hp;lastLayer=layer;lastKey=st.key;
 }

 /* ---------- Boss entrance card ---------- */
 let introKey='';
 function bossIntro(){
  const st=hudState(),field=battle();
  if(!st||!field){if(!st)introKey='';return}
  if(st.key===introKey)return;
  introKey=st.key;
  if(!motion()||document.hidden)return;
  const name=typeof encounterFor==='function'?encounterFor(s.stage,dungeonRun).name:'';
  let card=document.getElementById('bpBossIntro');
  if(!card){card=document.createElement('div');card.id='bpBossIntro';card.className='bp-boss-intro';card.setAttribute('aria-hidden','true');field.appendChild(card)}
  card.classList.toggle('painted',BOSS_INTRO_ART);
  card.innerHTML=`<div class="bp-warn">${BOSS_INTRO_ART?`<img src="${ART}boss-warning.webp" alt="">`:''}<small>WARNING</small><em>${st.tag}</em><b>${safeText(name)}</b></div>`;
  card.classList.remove('show');void card.offsetWidth;card.classList.add('show');
  field.classList.remove('bp-boss-shake');void field.offsetWidth;field.classList.add('bp-boss-shake');
  buzz([18,40,28]);
 }

 /* ---------- Hit feel ---------- */
 function buzz(pattern){try{if(s?.effects!==false&&motion()&&navigator.vibrate)navigator.vibrate(pattern)}catch{}}
 function flash(node,strong){
  if(!node||!motion())return;
  // A short white-out of the struck body; the browser ends it, so no timer is left behind.
  node.animate?.(strong?[{filter:'brightness(2.6) saturate(.25)'},{filter:'brightness(1)'}]:[{filter:'brightness(1.9) saturate(.55)'},{filter:'brightness(1)'}],{duration:strong?150:95,easing:'ease-out'});
 }
 function critBurst(){
  if(!motion())return;
  const fx=document.getElementById('fx'),numbers=fx?[...fx.querySelectorAll('.combat-number.critical')]:[];
  const node=numbers[numbers.length-1];if(!node)return;
  const burst=document.createElement('img');burst.className='bp-crit-burst';burst.alt='';
  burst.src=COMBAT_FX_ART?FX+'crit-burst.webp':'./assets/critical-hit.webp';
  burst.style.left=node.style.left;burst.style.top=node.style.top;
  burst.addEventListener('animationend',()=>burst.remove(),{once:true});fx.appendChild(burst);
 }
 function castBanner(k){
  const field=battle();if(!field||!motion()||typeof SK==='undefined'||!SK[k])return;
  const effect=typeof SKILL_RULES!=='undefined'?SKILL_RULES[k]?.effect:'';
  const color=ELEMENT_COLORS[effect]||'#ffd98a';
  let el=document.getElementById('bpCast');
  if(!el){el=document.createElement('div');el.id='bpCast';el.className='bp-cast';el.setAttribute('aria-hidden','true');field.appendChild(el)}
  el.style.setProperty('--bp-cast',color);
  el.innerHTML=`<b>${safeText(SK[k][0])}</b>`;
  el.classList.remove('show');void el.offsetWidth;el.classList.add('show');
  field.style.setProperty('--bp-cast',color);
  field.classList.remove('bp-casting');void field.offsetWidth;field.classList.add('bp-casting');
 }

 /* ---------- Star mine: ore node, combo, floating ore, timer bar, result ---------- */
 const ORE_HITS=12;
 let combo=0,comboAt=0,nodeHits=0;
 function mineLayer(){
  const field=document.getElementById('mineField');if(!field)return null;
  let layer=field.querySelector('.bp-mine');
  if(!layer){
   layer=document.createElement('div');layer.className='bp-mine'+(MINE_ART?' painted':'');layer.setAttribute('aria-hidden','true');
   const ore=MINE_ART?`<img class="bp-ore-art" src="./assets/star-mine/ore-node-0.webp" alt="" draggable="false">`:`<img class="bp-ore-art" src="./assets/minigames/ore-large.webp" alt="" draggable="false">`;
   layer.innerHTML=`<i class="bp-lantern"></i><div class="bp-ore">${ore}<svg class="bp-cracks" viewBox="0 0 100 100"><path class="c1" d="M50 50 38 34M50 50 64 38"/><path class="c2" d="M50 50 41 66M50 50 70 58M38 34 30 30"/><path class="c3" d="M50 50 52 24M50 50 26 54M64 38 75 30M41 66 36 78"/></svg></div><b class="bp-combo"></b>`;
   // With the A15 art the floating pickaxe becomes a gloved hand gripping it (same anchor points).
   if(MINE_ART){const pick=field.querySelector('.mine-pick');if(pick)pick.src='./assets/star-mine/pick-hand.webp'}
   field.appendChild(layer);
   const view=document.getElementById('mineView');
   if(view&&!view.querySelector('.bp-mine-time')){const bar=document.createElement('div');bar.className='bp-mine-time';bar.innerHTML='<i></i>';view.querySelector('header')?.after(bar)}
  }
  // The ore node sits on the pick's target point.
  const st=getComputedStyle(field),tool=parseFloat(field.style.getPropertyValue('--mine-tool'))||parseFloat(st.getPropertyValue('--mine-tool'))||180;
  const left=parseFloat(field.style.getPropertyValue('--mine-left'))||0,top=parseFloat(field.style.getPropertyValue('--mine-top'))||0;
  layer.style.setProperty('--ore-x',(left+.988*tool)+'px');layer.style.setProperty('--ore-y',(top+.40*tool)+'px');
  return layer;
 }
 function paintMineTime(){
  const r=s?.mineRun,bar=document.querySelector('#mineView .bp-mine-time i');if(!r||!bar)return;
  const left=Math.max(0,r.end-Date.now()),share=left/Math.max(1,r.end-r.start);
  bar.style.width=(share*100)+'%';bar.parentElement.classList.toggle('urgent',left<=10000);
 }
 function mineContact(auto){
  const layer=mineLayer();if(!layer)return;
  const now=performance.now();
  if(!auto){combo=now-comboAt<650?combo+1:1;comboAt=now}
  nodeHits++;
  const stage=Math.min(3,Math.floor((nodeHits%ORE_HITS)/(ORE_HITS/4)));
  const ore=layer.querySelector('.bp-ore');ore.dataset.crack=String(stage);
  if(MINE_ART){const img=ore.querySelector('.bp-ore-art');const want='./assets/star-mine/ore-node-'+stage+'.webp';if(!img.src.endsWith(want.slice(1)))img.src=want}
  ore.classList.remove('hit');void ore.offsetWidth;ore.classList.add('hit');
  const field=document.getElementById('mineField');
  field?.classList.remove('bp-mine-shake');void field?.offsetWidth;field?.classList.add('bp-mine-shake');
  floatGain(layer,auto?'+'+1:'+1',false);
  if(nodeHits%ORE_HITS===0){
   ore.classList.remove('burst');void ore.offsetWidth;ore.classList.add('burst');
   for(let i=0;i<5;i++)setTimeout(()=>floatGain(layer,'',true),i*45);
   floatGain(layer,'광맥 파괴!',false,true);buzz([16,30,16]);
  }
  const comboEl=layer.querySelector('.bp-combo');
  if(combo>=3&&!auto){comboEl.textContent='콤보 ×'+combo;comboEl.classList.toggle('hot',combo>=10);comboEl.classList.remove('pop');void comboEl.offsetWidth;comboEl.classList.add('pop')}
  else if(now-comboAt>650)comboEl.textContent='';
  paintMineTime();
 }
 function floatGain(layer,text,gem,big=false){
  if(!motion())return;
  const el=document.createElement('span');el.className='bp-gain'+(gem?' gem':'')+(big?' big':'');
  if(gem){const img=document.createElement('img');img.src=MINE_ART?'./assets/star-mine/gem.webp':'./assets/minigames/ore-small.webp';img.alt='';el.appendChild(img)}
  else el.textContent=text;
  el.style.setProperty('--dx',(Math.random()*90-45).toFixed(0)+'px');el.style.setProperty('--dy',(-60-Math.random()*50).toFixed(0)+'px');
  el.addEventListener('animationend',()=>el.remove(),{once:true});layer.appendChild(el);
 }
 function mineResult(gain){
  const view=document.getElementById('mineView')||document.getElementById('screenContent');if(!view)return;
  const card=document.createElement('div');card.className='bp-mine-result';card.setAttribute('role','dialog');card.setAttribute('aria-label','채굴 결과');
  const tile=(icon,label,n)=>n>0?`<div>${art(icon)}<b>+${num(n)}</b><small>${label}</small></div>`:'';
  card.innerHTML=`<section><h3>채굴 완료</h3><p>${num(gain.hits)}회 타격</p><div class="bp-mine-rewards">${tile('ore','성운석',gain.ore)}${tile('stone','강화석',gain.stones)}${tile('starIron','별철',gain.starIron)}</div><button type="button" class="gold-button">확인</button></section>`;
  card.querySelector('button').onclick=()=>card.remove();
  (document.getElementById('screenContent')||document.body).appendChild(card);hydrateArt(card);
 }

 /* ---------- Wiring ---------- */
 function install(){
  if(typeof paintBattle==='function'){
   const before=paintBattle;
   paintBattle=function(...args){const out=before.apply(this,args);try{paintRoute();paintHud();bossIntro()}catch(e){}return out};
  }
  if(typeof paintAdventureImpact==='function'){
   const before=paintAdventureImpact;
   paintAdventureImpact=function(target,effect,k,surface,crit,big,echo,...rest){const out=before.call(this,target,effect,k,surface,crit,big,echo,...rest);if(!echo&&target&&target!==document.getElementById('heroActor'))flash(target,crit||big);return out};
  }
  if(typeof adventureFx!=='undefined'&&adventureFx.impact){
   const before=adventureFx.impact;
   // Player hits used to show only a glow; give every non-echo hit its sparks and dust as well.
   adventureFx.impact=function(o={}){return before.call(this,o.flashOnly&&!o.echo?{...o,flashOnly:false}:o)};
  }
  if(typeof damageText==='function'){
   const before=damageText;
   damageText=function(d,crit,...rest){const out=before.call(this,d,crit,...rest);if(crit){critBurst();buzz(12)}return out};
  }
  if(typeof performClassAttack==='function'){
   const before=performClassAttack;
   performClassAttack=function(k,...rest){const ok=before.call(this,k,...rest);if(ok&&Number.isInteger(k)&&k>=0&&!dungeonRun?.choosing)castBanner(k);return ok};
  }
  if(typeof mineScene!=='undefined'&&mineScene.strike){
   const strike=mineScene.strike;
   mineScene.strike=function(auto=false){
    const before=s?.mineRun?.hits;strike.call(this,auto);
    if(!s?.mineRun||!mineScene.focused())return;
    mineLayer();setTimeout(()=>{if(s?.mineRun&&mineScene.focused())mineContact(auto)},motion()?(auto?180:72):0);
   };
   const refresh=mineScene.refresh;
   mineScene.refresh=function(...args){const out=refresh.apply(this,args);try{mineLayer();paintMineTime()}catch(e){}return out};
  }
  if(typeof claimMine==='function'){
   const before=claimMine;
   claimMine=function(...args){
    const r=s?.mineRun,was={ore:s?.ore||0,stones:s?.stones||0,starIron:s?.starIron||0},hits=r?.hits||0;
    const out=before.apply(this,args);
    if(r&&!s.mineRun)mineResult({hits,ore:s.ore-was.ore,stones:s.stones-was.stones,starIron:s.starIron-was.starIron});
    nodeHits=0;combo=0;return out;
   };
  }
  // World boss bar: a lagging trail under the live fill, watched only inside that battle's own window.
  if(typeof worldBoss!=='undefined'&&worldBoss.start&&typeof MutationObserver==='function'){
   const start=worldBoss.start;
   worldBoss.start=function(...args){
    const out=start.apply(this,args);
    const box=document.querySelector?.('dialog.wb-dialog');
    if(out&&box&&!box.bpWatch){
     box.bpWatch=new MutationObserver(()=>{try{
      const fill=box.querySelector('.wb-battle-head .wb-hp>i:not(.bp-trail)');if(!fill)return;
      const track=fill.parentElement;let trail=track.querySelector('.bp-trail');
      if(!trail){trail=document.createElement('i');trail.className='bp-trail';track.prepend(trail)}
      if(trail.style.width!==fill.style.width)trail.style.width=fill.style.width;
     }catch{}});
     box.bpWatch.observe(box,{subtree:true,childList:true,attributes:true,attributeFilter:['style']});
    }
    return out;
   };
  }
 }
 install();
 return {paintRoute,paintHud,castBanner,mineResult,routeMarkup};
})();

;
