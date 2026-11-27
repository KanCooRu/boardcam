'use strict';
/* Battle presentation layer (v166 fix8).
   Visual only: nothing here changes damage, rewards, timing rules or saves, and the server's rule
   simulation does not load this file (tools/rank-simulation/build.cjs lists it as presentation).

   Art switches. Every switch starts false and the code-drawn look below stays in place until the
   matching pictures exist. Work order: GPT-전투연출-그림·UI·효과-상세.md (cards A13-A16).
     BATTLE_UI_ART  A13  assets/battle-ui/   route + boss HP frame pictures
     COMBAT_FX_ART  A14  assets/combat-fx/   hit spark, crit burst, slash sheets
     MINE_ART       A15  assets/star-mine/   gloved hand with pickaxe, ore node crack stages, gem
     BOSS_INTRO_ART A16  assets/battle-ui/   boss warning banner
     UI_KIT_ART     A17-A19 assets/ui-kit/   button, popup frame, divider, bottom-menu glow (ui-kit.css) */
const BATTLE_UI_ART=false;
const COMBAT_FX_ART=false;
const MINE_ART=false;
const BOSS_INTRO_ART=false;
const UI_KIT_ART=false;

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

 /* ---------- One damage number for every battle (stage, world boss, raid) ---------- */
 // Same text, size, colours and motion as the stage's warriorMotion.number: '−' + compact amount,
 // pop then rise 48px; a critical is larger gold italic with the star and the crit burst behind it.
 function damageNumber(host,amount,crit,{left,top,drift=0,className=''}={}){
  if(!host||!motion())return null;
  const node=document.createElement('b');
  node.className='bp-num'+(crit?' critical':'')+(className?' '+className:'');
  node.textContent='−'+compact(Math.max(0,Math.round(amount)));
  if(left!=null)node.style.left=left;if(top!=null)node.style.top=top;
  host.appendChild(node);
  const duration=crit?870:680,pop=crit?1.45:1.12,end=()=>node.remove();
  if(!node.animate){setTimeout(end,duration);return node}
  if(crit)node.animate([{color:'#fff'},{color:'#fff'}],{duration:80});
  const motionAnim=node.animate([
   {offset:0,transform:'translate(-50%,5px) scale(.72)',opacity:0},
   {offset:.14,transform:`translate(-50%,-5px) scale(${pop})`,opacity:1},
   {offset:.58,transform:`translate(calc(-50% + ${drift*.6}px),-26px) scale(1)`,opacity:1},
   {offset:1,transform:`translate(calc(-50% + ${drift}px),-48px) scale(1)`,opacity:0}],{duration,easing:'ease-out',fill:'forwards'});
  motionAnim.onfinish=end;
  if(crit)buzz(12);
  return node;
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
  document.body?.classList?.toggle('bp-fx-art',COMBAT_FX_ART);
  document.body?.classList?.toggle('ui-kit-art',UI_KIT_ART);
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
 return {paintRoute,paintHud,castBanner,mineResult,routeMarkup,damageNumber};
})();
