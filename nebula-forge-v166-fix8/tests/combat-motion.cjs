const assert=require('node:assert/strict');
const {run,ctx}=require('./harness.cjs');
const animations=[];
function node(){
 const classes=new Set(),styles={};let html='';
 const n={clientWidth:390,offsetWidth:105,offsetLeft:150,dataset:{},hidden:false,children:[],parentNode:null,style:{setProperty(k,v){styles[k]=v},removeProperty(k){delete styles[k]}},classList:{add(...v){v.forEach(x=>classes.add(x))},remove(...v){v.forEach(x=>classes.delete(x))},contains:v=>classes.has(v),toggle(k,b){b?classes.add(k):classes.delete(k)}},setAttribute(){},getAttribute(){return ''},removeAttribute(){},querySelector(){return node()},querySelectorAll(){return []},getBoundingClientRect(){return {left:0,top:0,width:390,height:600,bottom:600}},appendChild(c){if(c.parentNode)c.parentNode.children.splice(c.parentNode.children.indexOf(c),1);this.children.push(c);c.parentNode=this;return c},remove(){if(this.parentNode)this.parentNode.children.splice(this.parentNode.children.indexOf(this),1);this.parentNode=null},animate(frames,options){
  assert(options.duration>0,'positive animation duration');let offset=-1;
  for(const f of frames)if(f.offset!==undefined){assert(f.offset>=offset&&f.offset<=1,'ordered, normalized keyframes');offset=f.offset}
  const a={target:this,frames,options,playState:'running',cancelled:false,pause(){this.playState='paused'},play(){this.playState='running'},cancel(){this.cancelled=true;this.playState='idle'}};animations.push(a);return a;
 }};
 Object.defineProperty(n,'firstElementChild',{get(){return this.children[0]}});
 Object.defineProperty(n,'innerHTML',{get(){return html},set(v){this.children.forEach(x=>x.parentNode=null);this.children=[];html=v;for(const tag of v.matchAll(/<i>/g))this.appendChild(node())}});
 n.append=(...children)=>children.forEach(c=>n.appendChild(c));return n;
}
const elements=new Map(['battle','heroActor','heroHealth','mobActor','mobTwo','mobThree','classFx','fx'].map(id=>[id,node()]));
for(const [id,n] of elements)n.id=id;
const oldGet=ctx.document.getElementById.bind(ctx.document);
ctx.document.getElementById=id=>elements.get(id)||oldGet(id);ctx.document.createElement=node;
elements.get('heroActor').getBoundingClientRect=()=>({left:40,top:290,width:134,height:134,bottom:424});
elements.get('mobActor').getBoundingClientRect=()=>({left:220,top:260,width:140,height:200,bottom:460});
let queue=new Map(),tid=0;ctx.setTimeout=(fn,ms)=>{queue.set(++tid,{fn,ms});return tid};ctx.clearTimeout=id=>queue.delete(id);
run('let motionNow=1793892000000;Date.now=performance.now=()=>motionNow;Math.random=()=>.99;');
let passed=0;
function reset(){run("warriorMotion.stop();s=migrate(starter());s.classId='warrior';s.costumes=[0];s.wear=0;s.stage=s.maxStage=45;s.auto=false;s.effects=true;s.powerSaving=false;s.speed=1;unlockClassSkills();for(const k of classSkillIds())s.skills[k]=1;s.slots=classSkillIds().slice(0,4);cooldowns.fill(0);s.enemyHp=maxHp();heroCurrentHp=health();activeScreen='home';view='';document.hidden=false;dungeonRun=null;enemyRespawnUntil=0;stageBossResolving=false;cancelCombatAnimation();motionNow+=10000;ensureEncounter();motionNow+=1000;");queue.clear();animations.length=0}
function test(name,fn){reset();fn();passed++;console.log('PASS',name)}
test('normal attack and four skills produce valid animations at three speeds',()=>{
 for(const factor of [.2,1,2])for(const effect of ['cleave','cross','quake','storm']){
  run('motionNow+=1500');assert.equal(run(`warriorMotion.attack('${effect}',++combatSerial,${factor})`),true);
 }
 assert.equal(animations.filter(x=>x.target===elements.get('heroActor')).length,12);
 const a=animations.at(-6);a.onfinish();assert(!elements.get('heroActor').classList.contains('smooth-warrior'));
});
test('all attack damage and cooldowns match the old presentation path',()=>{
 const animate=elements.get('heroActor').animate;
 for(const k of [-1,0,1,2,3]){
  const results=[];
  for(const enabled of [false,true]){
   reset();elements.get('heroActor').animate=enabled?animate:undefined;
   const hp=run('s.enemyHp'),start=run('Date.now()');
   assert.equal(run(k<0?'performClassAttack()':`cast(${k},true)`),true);
   const ids=run('Array.from(classAttackTimers)');
   for(const job of ids.map(id=>queue.get(id)).filter(Boolean).sort((a,b)=>a.ms-b.ms))job.fn();
   results.push([hp-run('s.enemyHp'),run('combatBusyUntil')-start,run('JSON.stringify(cooldowns)')]);
  }
  assert.deepEqual(results[1],results[0],`attack ${k}`);
 }
 elements.get('heroActor').animate=animate;
});
test('fast basics hold the windup and present both contacts on one damage budget',()=>{
 for(const job of ['warrior','shadow','paladin','mage','archer']){
  reset();run('s.classId='+JSON.stringify(job)+';s.speed=2;globalThis.savedAttackSpeed=attackSpeed;attackSpeed=()=>3;');
  try{
   assert.equal(run('performClassAttack(-1)'),true);
   const times=Array.from(run('Array.from(classAttackTimers)'),id=>queue.get(id).ms);
   const pivot=run("['mage','archer'].includes(s.classId)?rangedCombat.releaseTime(s.classId,-1):270");
   const release=run('skillMotion.clock(s.classId,-1,190/650).elapsed('+pivot+')');
   assert.ok(release>=80,job);assert.equal(times.length,2);assert.ok(times[1]>times[0]&&times[1]<190);
   assert.equal(run('motionHitCount'),2);
   const held=run('skillMotion.clock(s.classId,-1,190/650).pose('+release+')');
   assert.ok(Math.abs(held-pivot)<1e-8);
  }finally{run('attackSpeed=savedAttackSpeed')}
 }
});
// Observe the real contact dispatch without running a second animation renderer.
function observeContacts(fn){
 const fx=run('adventureFx'),actor=run('actorMotion'),stage=elements.get('battle');
 const original={ready:fx.ready,impact:fx.impact,hitStop:actor.hitStop,add:stage.classList.add};
 const events={flashes:[],stops:[],shakes:[]};
 fx.ready=()=>true;fx.impact=hit=>{events.flashes.push(hit);return true};
 actor.hitStop=(ms,target)=>events.stops.push([ms,target]);
 stage.classList.add=(...names)=>{if(names.includes('impact-shake'))events.shakes.push(run('performance.now()'));original.add(...names)};
 try{fn(events)}finally{fx.ready=original.ready;fx.impact=original.impact;actor.hitStop=original.hitStop;stage.classList.add=original.add}
}
function hit({damage=100,crit=false,heavy=false,skill=-1,echo=false}={}){
 return run(`combatImpact(${damage},${crit},combatEncounter(),combatSerial,'cleave',${heavy},${skill},${echo})`);
}
elements.get('mobTwo').getBoundingClientRect=()=>({left:170,top:195,width:110,height:160,bottom:355});
elements.get('mobThree').getBoundingClientRect=()=>({left:260,top:160,width:100,height:125,bottom:285});
function hitLocation(id){return Array.from(run(`Object.values(rangedCombat.hitPoint($('${id}')))`))}
test('ordinary, critical and strong hits flash the actual foe and throttle shake per stage',()=>observeContacts(({flashes,stops,shakes})=>{
 run('ensureEncounter().target=1;s.enemyHp=ensureEncounter().foes[1].hp');
 const hp=run('ensureEncounter().foes[1].hp'),when=run('motionNow');
 const target=elements.get('mobTwo');
 assert(hit());assert.equal(stops.length,0);assert.equal(shakes.length,0);
 assert(hit({crit:true}));run('motionNow+=299');assert(hit({heavy:true}));run('motionNow++');assert(hit({heavy:true}));
 assert.deepEqual(shakes,[when,when+300]);assert.equal(stops.length,3);
 assert(stops.every(([ms,node])=>ms===95&&node===target));
 assert.equal(flashes.length,4);assert.deepEqual(flashes.map(f=>[f.critical,f.heavy]),[[false,false],[true,false],[false,true],[false,true]]);
 for(const f of flashes){assert.equal(f.flashOnly,true);assert.deepEqual([f.x,f.y],hitLocation('mobTwo'))}
 assert.ok(run('ensureEncounter().foes[1].hp')<hp);
 const otherStage=node();ctx.secondStage=otherStage;
 assert(run('shakeImpactStage(secondStage)'));assert.equal(run('shakeImpactStage(secondStage)'),false);
}));
test('area skill lights every living foe once, shares one shake and leaves other combat clocks intact',()=>observeContacts(({flashes,stops,shakes})=>{
 const area=run("classSkillIds().find(k=>skillMeta(k).target==='all')");
 assert.ok(Number.isInteger(area));
 const hps=()=>Array.from(run('ensureEncounter().foes.map(f=>f.hp)'));
 const clocks=()=>run('JSON.stringify([combatBusyUntil,enemyRespawnUntil,ensureEncounter().readyAt,tacticsState().ready,cooldowns])');
 const before=hps(),clock=clocks();
 assert(hit({skill:area,heavy:true,echo:true}));
 const ids=['mobActor','mobTwo','mobThree'];
 assert.deepEqual(flashes.map(f=>[f.x,f.y]),ids.map(hitLocation));
 assert(flashes.every(f=>f.heavy&&f.echo&&f.flashOnly));
 assert.equal(stops.length,3);stops.forEach(([ms,target],i)=>{assert.equal(ms,95);assert.equal(target,elements.get(ids[i]))});
 assert.equal(shakes.length,1);assert(hps().every((hp,i)=>hp<before[i]));
 assert.equal(clocks(),clock);
 run('hurtFoe(1e20,false,1)');flashes.length=0;stops.length=0;
 assert(hit({skill:area,heavy:true,echo:true}));
 assert.deepEqual(flashes.map(f=>[f.x,f.y]),['mobActor','mobThree'].map(hitLocation));assert.equal(stops.length,2);
}));
test('boss finishing contact freezes exactly once for 120 ms on ordinary and critical kills',()=>{
 for(const crit of [false,true]){
  reset();run('s.stage=10;s.enemyHp=1;stageBossTick()');
  observeContacts(({flashes,stops,shakes})=>{
   assert(hit({damage:1e20,crit}));
   assert.equal(flashes.length,1);assert.equal(flashes[0].critical,crit);
   assert.equal(stops.length,1);assert.equal(stops[0][0],190);assert.equal(stops[0][1],elements.get('mobActor'));
   assert.equal(shakes.length,Number(crit));assert.equal(run('s.stage'),11);
  });
 }
});
// Count captured enemies and departures through the same impact path used by player skills.
function observeDefeats(fn){
 const fx=run('adventureFx'),original=fx.deathAnchor,defeat=fx.defeat,targets=[],departures=[];
 fx.deathAnchor=target=>{targets.push(target.id);return {still:{},target:target.id}};
 fx.defeat=box=>departures.push(box?.target);
 try{fn(targets,departures)}finally{fx.deathAnchor=original;fx.defeat=defeat}
}
function beginTrialBattle(){
 run("dungeonRun={mode:'trial',n:1,bosses:0,floors:0,hp:trialBossHp(1),maxHp:trialBossHp(1),damage:0,time:90,weakness:'frost',picks:[],weakUntil:[],buffs:{}};paintTactics()");
}
test('trial keeps the defeated boss in its lane until the next floor can receive hits',()=>{
 for(const crit of [false,true]){
  reset();beginTrialBattle();
  const oldWave=elements.get('mobActor').dataset.wave;
  const stage=run('s.stage'),before=run('dungeonRun.hp');
  ctx.previousTrialEnemy=run('combatEncounter()');
  observeDefeats((targets,departures)=>{
   run('dungeonRun.choosing=true;applyDamage(dungeonRun.hp+1);dungeonRun.choosing=false');
   assert.equal(run('dungeonRun.hp'),before);
   assert(hit({damage:100,skill:0,heavy:true,crit}));
   assert(run('dungeonRun.hp')>0&&run('dungeonRun.hp')<before);
   assert.deepEqual(targets,[]);assert.deepEqual(departures,[]);
   assert(hit({damage:before*10,skill:0,heavy:true,crit}));
   assert.deepEqual(targets,['mobActor']);assert.deepEqual(departures,['mobActor']);
   assert.equal(elements.get('battle').dataset.trialDeparture,'dissolve');
   assert.equal(run('dungeonRun.hp'),0);assert.equal(run('dungeonRun.n'),1);
   assert(run('sameEncounter(previousTrialEnemy) && trialCombatPaused()'));
   assert.equal(run('performClassAttack(-1)'),false);
   assert.equal(hit({damage:before,skill:0,echo:true}),false);
   run('motionNow+=1100;tickTrialFloorTransition(dungeonRun,1.1);paintTactics()');
   assert.equal(run('dungeonRun.n'),1);assert.equal(elements.get('mobActor').dataset.wave,oldWave);
   run('motionNow+=110;tickTrialFloorTransition(dungeonRun,0.11);paintTactics()');
   assert.equal(run('dungeonRun.n'),2);assert.equal(run('dungeonRun.bosses'),1);
   assert.equal(elements.get('battle').dataset.trialDeparture,undefined);
   assert.equal(run('dungeonRun.hp'),run('dungeonRun.maxHp'));
   assert.notEqual(elements.get('mobActor').dataset.wave,oldWave);
   assert.equal(run('sameEncounter(previousTrialEnemy)'),false);
   assert.equal(run("combatImpact(1000,false,previousTrialEnemy,combatSerial,'cross',true,1,true)"),false);
   assert.equal(run('dungeonRun.hp'),run('dungeonRun.maxHp'));
   assert.deepEqual(targets,['mobActor']);assert.deepEqual(departures,['mobActor']);
   assert.equal(run('s.stage'),stage);assert(run('performClassAttack(-1)'));
  });
 }
});
test('a reduced-effects trial keeps the same floor notice and timing without a canvas snapshot',()=>{
 run('s.effects=false');beginTrialBattle();
 assert(hit({damage:1e8}));
 assert.equal(elements.get('battle').dataset.trialDeparture,'fall');
 const notice=run("$('trialFloorStatus')");
 assert.equal(notice.hidden,false);assert.match(notice.textContent,/1층 돌파.*2층/);
 run('motionNow+=1100;tickTrialFloorTransition(dungeonRun,1.1)');
 assert.equal(run('dungeonRun.n'),1);assert.equal(notice.hidden,false);
 run('motionNow+=110;tickTrialFloorTransition(dungeonRun,0.11)');
 assert.equal(run('dungeonRun.n'),2);assert.equal(notice.hidden,true);
});
test('delayed contacts of one trial skill cannot hit the following floor',()=>{
 beginTrialBattle();run('dungeonRun.hp=1');
 observeDefeats((targets,departures)=>{
  assert(run('performClassAttack(1)'));
  const hits=Array.from(run('trialContacts.map(c=>c.timer)'),id=>queue.get(id).fn);
  assert.equal(hits.length,3);hits[0]();
  assert.equal(run('dungeonRun.hp'),0);
  hits[1]();
  run('motionNow+=1210;tickTrialFloorTransition(dungeonRun,1.21)');
  hits[2]();
  assert.equal(run('dungeonRun.n'),2);assert.equal(run('dungeonRun.hp'),run('dungeonRun.maxHp'));
  assert.deepEqual(targets,['mobActor']);assert.deepEqual(departures,['mobActor']);
 });
});
test('rush immediately hands off a real skill kill without a corpse over the next boss',()=>{
 for(const crit of [false,true]){
  reset();run('clearDefeatFeedback();beginRush()');
  const previousLayers=new Set(elements.get('battle').children);
  const stage=run('s.stage'),before=run('dungeonRun.hp');
  observeDefeats((targets,departures)=>{
   assert(hit({damage:100,skill:0,heavy:true,crit}));
   assert(run('dungeonRun.hp')>0&&run('dungeonRun.hp')<before);
   assert.equal(run('dungeonRun.bosses'),0);
   assert(hit({damage:before*10,skill:0,heavy:true,crit}));
   assert.equal(run('dungeonRun.mode'),'rush');assert.equal(run('dungeonRun.bosses'),1);
   assert.equal(run('dungeonRun.hp'),run('dungeonRun.maxHp'));assert.equal(run('s.stage'),stage);
   assert.deepEqual(targets,[]);assert.deepEqual(departures,[]);
   assert.equal(elements.get('battle').children.some(n=>n.id==='defeatFx'&&!previousLayers.has(n)),false);
   assert.equal(elements.get('mobActor').classList.contains('awaiting-spawn'),false);
   assert(run('enemyRespawnUntil<=Date.now()'));assert(run('performClassAttack(-1)'));
  });
 }
});
test('an area skill captures only its dead lane and keeps both surviving enemies visible',()=>{
 run("paintTactics();ensureEncounter().foes.forEach((foe,i)=>foe.hp=foe.max=i===1?1:10000);s.enemyHp=10000");
 const skill=run("classSkillIds().find(k=>skillMeta(k).target==='all')"),kills=run('s.kills');
 observeDefeats((targets,departures)=>{
  assert(hit({damage:100,heavy:true,skill}));
  assert.deepEqual(targets,['mobTwo']);assert.deepEqual(departures,['mobTwo']);
  assert.equal(run('ensureEncounter().foes[1].hp'),0);assert.equal(run('s.kills'),kills+1);
  for(const [i,id] of [[0,'mobActor'],[2,'mobThree']]){
   const hp=run('ensureEncounter().foes['+i+'].hp');
   assert(hp>0&&hp<10000);assert(!elements.get(id).hidden);assert.equal(elements.get(id).dataset.dying,undefined);
  }
 });
});
test('reduced motion, disabled effects and power saving preserve hit damage without hit feedback',()=>{
 const original=ctx.matchMedia;
 try{
  let baseline;
  for(const mode of ['full','system','disabled','power']){
   reset();ctx.matchMedia=()=>({matches:mode==='system'});
   if(mode==='disabled')run('s.effects=false');
   if(mode==='power')run('s.powerSaving=true');
   const before=run('selectedFoe().hp');
   observeContacts(({flashes,stops,shakes})=>{
    assert(hit({crit:true}));const amount=before-run('selectedFoe().hp');
    if(mode==='full'){baseline=amount;assert(amount>0)}
    else{assert.equal(amount,baseline);assert.equal(flashes.length,0);assert.equal(stops.length,0);assert.equal(shakes.length,0)}
   });
  }
 }finally{ctx.matchMedia=original}
});
test('ordinary and critical damage number sizes and durations keep the white flash to the first 80 ms',()=>{
 for(const [crit,pop,duration] of [[false,1.12,680],[true,1.45,870]]){
  animations.length=0;assert(run(`warriorMotion.number(100,${crit})`));
  const movement=animations.find(a=>a.frames.some(f=>f.transform));
  assert.equal(movement.options.duration,duration);
  assert(movement.frames.some(f=>f.transform?.includes('scale('+pop+')')));
  const colors=animations.filter(a=>a.frames.some(f=>f.color));
  assert.equal(colors.length,Number(crit));
  if(crit){assert.equal(colors[0].options.duration,80);assert(colors[0].frames.every(f=>f.color==='#fff'));assert(!['both','forwards'].includes(colors[0].options.fill))}
 }
 run('s.powerSaving=true');animations.length=0;assert(run('warriorMotion.number(100,true)'));
 assert.equal(animations.length,0);assert(elements.get('fx').children.some(n=>!n.hidden&&n.textContent==='−100'));
});
test('the live combat interval advances cooldown and dungeon time during the visible hit stop',()=>{
 const setInterval=ctx.setInterval;
 let tick;
 try{
  ctx.setInterval=(fn,ms)=>{if(ms===100)tick=fn;return 1};run('init()');assert(tick);
  reset();tick();
  run('dungeon(0);combatTimer=0;cooldowns.fill(1);s.speed=1');
  const before=run('dungeonRun.time'),hp=run('dungeonRun.hp');
  run("warriorMotion.attack('cleave',++combatSerial,1)");
  const heroMove=animations.find(a=>a.target===elements.get('heroActor')&&!a.cancelled);assert(heroMove);
  assert(hit({damage:1,crit:true}));assert(run('dungeonRun.hp')<hp);
  assert.equal(heroMove.playState,'paused');
  run('motionNow+=30');tick();
  assert.equal(heroMove.playState,'paused');assert(Math.abs(before-run('dungeonRun.time')-.03)<1e-8);
  assert(Math.abs(run('cooldowns[0]')-.97)<1e-8);
  assert(Math.abs(run('combatTimer')-.03)<1e-8);
 }finally{ctx.setInterval=setInterval}
});
test('a new action cannot restart the fast attack pose before 70 percent, while contacts still resolve',()=>{
 const factor=190/650;
 const cutoff=run(`skillMotion.clock('warrior',-1,${factor}).elapsed(650*.7)`);
 const start=run('motionNow');
 const before=run('warriorMotion.stats().attacks');
 run(`warriorMotion.attack('cleave',++combatSerial,${factor},-1)`);
 run(`motionNow=${start+cutoff-1};warriorMotion.attack('cross',++combatSerial,${factor},1)`);
 assert.equal(run('warriorMotion.stats().attacks'),before+1);
 const hp=run('selectedFoe().hp');assert(hit());assert(run('selectedFoe().hp')<hp);
 run(`motionNow=${start+cutoff+1};warriorMotion.attack('cross',++combatSerial,${factor},1)`);
 assert.equal(run('warriorMotion.stats().attacks'),before+2);
});
test('geometry is read once per combo, and repeated impacts reuse bounded nodes',()=>{
 const before=run('warriorMotion.stats()');
 run("warriorMotion.attack('storm',combatSerial,1);for(let i=0;i<1000;i++){warriorMotion.impact('storm',true,3,i%5>0,1);warriorMotion.number(123,i%2===0)}");
 const after=run('warriorMotion.stats()');
 assert.equal(after.geometryReads-before.geometryReads,3);assert(after.effectNodes<=8&&after.numberNodes<=12&&after.sparkNodes<=24);
 run("for(let i=0;i<1000;i++){warriorMotion.impact('cross',true,1,false,1);warriorMotion.number(99,false)}");
 assert.equal(run('warriorMotion.stats().allocated'),after.allocated);
});
test('cancellation hides pools and detached nodes can be reused',()=>{
 run("warriorMotion.impact('cleave',true,0,false,1);warriorMotion.number(10);cancelCombatAnimation()");
 assert.equal(run('warriorMotion.stats().activeNodes'),0);assert.equal(elements.get('classFx').children.length,0);
 run("warriorMotion.impact('cleave',true,0,false,1)");assert(elements.get('classFx').children.length>0);
});
test('hidden, feature screens, reduced effects do not allocate attack visuals',()=>{
 for(const condition of ["document.hidden=true","activeScreen='character'","view='settings'","s.effects=false","s.powerSaving=true"]){
  reset();const before=run('warriorMotion.stats().allocated');run(condition);
  assert.equal(run("warriorMotion.attack('storm',combatSerial,1)"),false);
  run("warriorMotion.impact('storm',true,3,false,1)");assert.equal(run('warriorMotion.stats().allocated'),before);
 }
});
test('old callbacks cannot damage a replacement encounter',()=>{
 assert.equal(run('performClassAttack(3,true)'),true);
 const jobs=run('Array.from(classAttackTimers)').map(id=>queue.get(id));run('s.stage++;s.enemyHp=maxHp()');const hp=run('s.enemyHp');
 jobs.filter(Boolean).forEach(j=>j.fn());assert.equal(run('s.enemyHp'),hp);
});
test('expired boss impact cannot produce visuals or rewards',()=>{
 run('s.stage=10;stageBossTick();s.enemyHp=maxHp();');const before=run('warriorMotion.stats().effectUses');
 run("const lateEncounter=combatEncounter(),lateToken=combatSerial;motionNow+=30000;combatImpact(1e20,false,lateEncounter,lateToken,'cleave',true,0)");
 assert.equal(run('s.stage'),9);assert.equal(run('warriorMotion.stats().effectUses'),before);assert.equal(run('s.bossKills'),0);
});
test('all five classes use bounded motion layers',()=>{
 for(const id of ['warrior','shadow','paladin','mage','archer']){run(`s.classId='${id}';animateClassAttack('arrow',combatSerial,1)`);assert(elements.get('heroActor').classList.contains('smooth-warrior'));}
 assert(animations.length>0);
});
test('normal and 60 skills show their painted atlas with the FX canvas available; support stays at the caster',()=>{
 const ready=run('adventureFx.ready');ctx.withCanvas=()=>true;
 try{
  run('adventureFx.ready=withCanvas');
  for(const id of ['warrior','shadow','paladin','mage','archer']){
   for(const k of [-1,...run(`classSkillIds('${id}')`)]){
    reset();run(`s.classId='${id}';for(const key of classSkillIds())s.skills[key]=1;`);
    const before=run('warriorMotion.stats().effectUses');
    assert(run(`performClassAttack(${k},false)`));
    const jobs=run('Array.from(classAttackTimers)').map(i=>queue.get(i)).filter(Boolean);
    jobs[0].fn();
    const self=run(`skillMeta(${k}).target==='self'`);
    const count=run('warriorMotion.stats().effectUses')-before;
    assert.equal(count,run(`skillMeta(${k}).target==='all'?ensureEncounter().foes.length:1`),id+' '+k);
    const painted=elements.get('classFx').children.filter(n=>!n.hidden&&n.dataset.skill===String(k));
    assert(painted.length>0);
    if(self)assert.equal(painted[0].style.left,'107px');
   }
  }
 }finally{ctx.originalReady=ready;run('adventureFx.ready=originalReady')}
});
test('cached outfit paint still removes legacy HUD color rotation',()=>{
 run("paintHeroCostume();$('heroActor').style.filter='hue-rotate(185deg)';paintHeroCostume()");
 assert.equal(elements.get('heroActor').style.filter,'drop-shadow(0 7px 5px #1119)');
});
test('each new wave gets exactly three staggered offscreen arrivals',()=>{
 run("s.tactics.encounter=null;paintTactics()");
 const entries=animations.filter(a=>a.target.classList.contains('foe-entering'));
 assert.equal(entries.length,3);assert.deepEqual(entries.map(a=>a.options.delay),[0,90,180]);
 for(const a of entries){assert.equal(a.options.duration,560);assert(a.frames[0].transform.includes('255.75px'));assert.equal(a.frames.at(-1).transform,'translate(0,0) rotate(0)');}
 run('paintTactics();paintTactics()');assert.equal(animations.length,3);
 const queuedFinishes=entries.map(a=>a.onfinish);
 run('s.tactics.encounter=null;paintTactics()');const current=run("$('mobActor').dataset.wave");
 queuedFinishes.forEach(fn=>fn());assert.equal(run("$('mobActor').dataset.wave"),current);assert(elements.get('mobActor').classList.contains('foe-entering'));
});
test('reduced effects skips entry animation but keeps the same arrival deadline',()=>{
 run('s.effects=false;s.tactics.encounter=null;paintTactics()');assert.equal(animations.length,0);assert.equal(run('ensureEncounter().readyAt-Date.now()'),740);
});
test('finished death hides only its dead actor and releases transparent fill',()=>{
 run('paintTactics();hurtFoe(1e20,false,0);paintTactics()');
 const death=animations.find(a=>a.options.fill==='forwards');assert(death);assert(!death.target.hidden);
 death.onfinish();assert(death.target.hidden);assert(death.cancelled);assert.equal(death.onfinish,null);
 run('paintTactics()');assert(elements.get('mobActor').hidden);assert(!elements.get('mobTwo').hidden);
});
test('queued old death cannot hide a replacement wave or boss',()=>{
 run('paintTactics();hurtFoe(1e20,false,0)');const death=animations.find(a=>a.options.fill==='forwards'),late=death.onfinish;
 run('s.stageKills=0;s.tactics.encounter=null;paintTactics()');late();
 assert(death.cancelled);assert(!elements.get('mobActor').hidden);assert(elements.get('mobActor').classList.contains('foe-entering'));
 run('s.stage=50;paintTactics()');late();assert(!elements.get('mobActor').hidden);
});
test('stalled entry and death callbacks settle from the encounter clock',()=>{
 run('s.tactics.encounter=null;paintTactics()');const entries=animations.slice();
 run('motionNow+=1000;paintTactics()');assert(entries.every(a=>a.cancelled));assert(!elements.get('mobActor').classList.contains('foe-entering'));
 run('hurtFoe(1e20,false,0);motionNow+=500;paintTactics()');
 assert(elements.get('mobActor').hidden);assert(animations.find(a=>a.options.fill==='forwards').cancelled);
});
test('ordinary actors clear leftover single-boss spawn hiding',()=>{
 for(const id of ['mobActor','mobTwo','mobThree'])elements.get(id).classList.add('awaiting-spawn','enemy-arrival');
 run('paintTactics()');
 for(const id of ['mobActor','mobTwo','mobThree']){assert(!elements.get(id).hidden);assert(!elements.get(id).classList.contains('awaiting-spawn'))}
});
console.log(JSON.stringify({passed}));
