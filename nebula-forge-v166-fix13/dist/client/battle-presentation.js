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
     UI_KIT_ART     A17-A19 assets/ui-kit/   button, popup frame, divider, bottom-menu glow (ui-kit.css)
     UI_EXTRA_ART   A20-A22 assets/ui-kit/   currency chip + plus badge, shop/mail ribbons, lock badge   */
const BATTLE_UI_ART=true;
const COMBAT_FX_ART=true;
const MINE_ART=true;
const BOSS_INTRO_ART=true;
const UI_KIT_ART=true;
const UI_EXTRA_ART=true;
// fix13: painted miner (card M1: assets/star-mine/miner-body.webp + miner-arm.webp). Until then the drawn miner below is used.
const MINER_ART=false;

const battlePresentation=(()=>{
 const ART='./assets/battle-ui/',FX='./assets/combat-fx/';
 // A horned skull, symmetric about x=12 and centred in its 24-unit box, so it never looks tilted.
 const BOSS_GLYPH='<svg class="bp-glyph" viewBox="0 0 24 24" aria-hidden="true"><path d="M5.2 9.2 2.4 3.6l4.9 2.9M18.8 9.2l2.8-5.6-4.9 2.9" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 4.6c-4.2 0-7.4 2.9-7.4 6.8 0 2.2 1.1 4 2.8 5.1v3h2.3v-1.7h1.2v1.7h2.2v-1.7h1.2v1.7h2.3v-3c1.7-1.1 2.8-2.9 2.8-5.1 0-3.9-3.2-6.8-7.4-6.8Z" fill="currentColor"/><circle cx="9.1" cy="11.6" r="1.9" fill="#160d1c"/><circle cx="14.9" cy="11.6" r="1.9" fill="#160d1c"/><path d="M12 13.8 11 15.5h2Z" fill="#160d1c"/></svg>';
 // fix13: a little star miner (drawn; MINER_ART swaps in painted layers on the same rig points).
 const MINER_SVG='<svg class="bp-miner-svg" aria-hidden="true" viewBox="0 0 240 240"> <defs> <radialGradient id="mnSkin" cx=".42" cy=".38" r=".7"><stop offset="0" stop-color="#ffe3c8"/><stop offset=".7" stop-color="#f3c39d"/><stop offset="1" stop-color="#d99a76"/></radialGradient> <linearGradient id="mnHelm" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe7a6"/><stop offset=".45" stop-color="#e2ad52"/><stop offset="1" stop-color="#9a6526"/></linearGradient> <linearGradient id="mnSuit" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8a6a9e"/><stop offset="1" stop-color="#4b3560"/></linearGradient> <linearGradient id="mnApron" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a7764e"/><stop offset="1" stop-color="#6a4429"/></linearGradient> <linearGradient id="mnBoot" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5a3a28"/><stop offset="1" stop-color="#2e1d14"/></linearGradient> <linearGradient id="mnWood" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#7a4b28"/><stop offset=".5" stop-color="#b07a45"/><stop offset="1" stop-color="#6d4022"/></linearGradient> <linearGradient id="mnIron" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e9eef5"/><stop offset=".45" stop-color="#9aa6b6"/><stop offset="1" stop-color="#4c5566"/></linearGradient> <radialGradient id="mnGlow" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fff6c8" stop-opacity=".95"/><stop offset=".35" stop-color="#ffd36a" stop-opacity=".5"/><stop offset="1" stop-color="#ffb43a" stop-opacity="0"/></radialGradient> </defs> <ellipse class="mn-shadow" cx="82" cy="229" rx="44" ry="8" fill="#000" opacity=".38"/> <g class="mn-body"> <path class="mn-scarf-tail" d="M66 158c-14 2-24 10-30 22 9-3 17-4 25-2-4 4-6 9-6 14 8-8 16-14 24-18z" fill="#7d4fc0"/> <path d="M58 212h20v10c0 5-3 8-9 8H52c-5 0-7-3-6-6 1-6 5-9 12-9z" fill="url(#mnBoot)"/> <path d="M88 212h20v10c0 5-3 8-9 8H86c-4 0-6-3-5-6 1-6 3-9 7-9z" fill="url(#mnBoot)"/> <path d="M50 186c0-22 14-36 32-36s32 14 32 36c0 16-8 28-32 28s-32-12-32-28z" fill="url(#mnSuit)"/> <path d="M60 178h44v22c0 9-9 15-22 15s-22-6-22-15z" fill="url(#mnApron)"/> <rect x="56" y="190" width="52" height="7" rx="3" fill="#3a2418"/> <rect x="77" y="189" width="10" height="9" rx="2" fill="#e6b85c"/> <circle cx="70" cy="182" r="2.2" fill="#e6b85c"/><circle cx="96" cy="182" r="2.2" fill="#e6b85c"/> <path d="M58 156c8 6 40 6 50 0 2 5 1 9-2 11-12 6-36 6-46 0-3-2-4-7-2-11z" fill="#8c5ad6"/> <path d="M60 158c10 5 36 5 46 0" stroke="#b78cf0" stroke-width="2" fill="none" stroke-linecap="round"/> <g class="mn-head"> <path d="M46 112c-6 6-6 18 0 24 4-8 6-14 6-20z" fill="#6b4430"/> <circle cx="84" cy="118" r="38" fill="url(#mnSkin)"/> <path d="M50 104c-6 8-6 22 2 30 0-10 2-18 8-24z" fill="#6b4430"/> <ellipse cx="54" cy="124" rx="7" ry="9" fill="#f0bb93"/> <g class="mn-eyes"> <ellipse cx="94" cy="122" rx="5.2" ry="7.2" fill="#2a1826"/> <ellipse cx="114" cy="121" rx="4.6" ry="6.8" fill="#2a1826"/> <circle cx="96" cy="118.5" r="2" fill="#fff"/><circle cx="115.6" cy="117.8" r="1.8" fill="#fff"/> <circle cx="92.6" cy="125" r=".9" fill="#fff" opacity=".8"/> </g> <ellipse cx="86" cy="136" rx="7" ry="4" fill="#ff8a9a" opacity=".45"/> <ellipse cx="118" cy="134" rx="5" ry="3.4" fill="#ff8a9a" opacity=".45"/> <path d="M101 136c2.5 3 6.5 3 9 0" stroke="#7a3a3a" stroke-width="2" fill="none" stroke-linecap="round"/> <path d="M44 110c0-26 18-42 42-42s40 16 40 40c0 3-2 5-5 5H49c-3 0-5-1-5-3z" fill="url(#mnHelm)"/> <path d="M40 110c0-3 2-5 5-5h80c4 0 6 2 6 5s-2 6-6 6H45c-3 0-5-3-5-6z" fill="#b57a33"/> <path d="M52 92c6-12 18-18 30-18" stroke="#fff3cf" stroke-width="4" fill="none" stroke-linecap="round" opacity=".7"/> <path d="M84 70v34" stroke="#9a6526" stroke-width="3" opacity=".6"/> <circle class="mn-glow" cx="114" cy="92" r="30" fill="url(#mnGlow)"/> <circle cx="114" cy="92" r="10" fill="#6a4320"/> <circle cx="114" cy="92" r="7.5" fill="#fff4c4"/> <path d="M114 85.5l1.9 4.2 4.6.5-3.4 3.1 1 4.5-4.1-2.4-4.1 2.4 1-4.5-3.4-3.1 4.6-.5z" fill="#ffc94a"/> </g> </g> <g class="mn-arm"> <path d="M86 160c14 4 30 8 42 10" stroke="#5b4072" stroke-width="12" stroke-linecap="round" fill="none"/> <path d="M124 176 L198 146" stroke="url(#mnWood)" stroke-width="8" stroke-linecap="round"/> <path d="M124 176 L198 146" stroke="#3b2414" stroke-width="8" stroke-linecap="round" fill="none" opacity=".25" stroke-dasharray="2 14"/> <path d="M178 116c14 6 26 18 30 32 4 13 6 26 6 38-6-10-11-20-18-28-6-8-14-13-24-17z" fill="url(#mnIron)" stroke="#3a4250" stroke-width="1.5"/> <path d="M184 112c-6 0-10 4-11 9l14 6c2-5 1-11-3-15z" fill="#7f8a9a" stroke="#3a4250" stroke-width="1.2"/> <rect x="188" y="136" width="16" height="18" rx="3" transform="rotate(-22 196 145)" fill="#c08a3e" stroke="#5a3a1a" stroke-width="1.2"/> <path d="M190 141l10-4" stroke="#ffe3a0" stroke-width="1.6" stroke-linecap="round"/> <path d="M84 166c16 4 32 6 46 6" stroke="#6f5288" stroke-width="13" stroke-linecap="round" fill="none"/> <circle cx="134" cy="172" r="9" fill="#7a4a2c"/> <circle cx="120" cy="178" r="8.5" fill="#6a3f25"/> <path d="M128 167c3 0 6 2 7 5" stroke="#a8724a" stroke-width="2" fill="none" stroke-linecap="round"/> </g> </svg>';
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
  // fix13: a slim bar that takes the route's place (the framed panel covered the boss and the field).
  hud=document.createElement('section');hud.id='bpBossHud';hud.className='bp-boss-hud slim';hud.hidden=true;
  hud.setAttribute('aria-label','보스 체력');
  // fix13b: the reference layout - name above, crest on the left, a red bar with the % inside, a gold time line under it.
  const crest=BATTLE_UI_ART?`<img src="${ART}route-boss.webp" alt="" draggable="false">`:BOSS_GLYPH;
  hud.innerHTML=`<b class="bp-name" data-name></b>
   <div class="bp-gauge"><span class="bp-emblem">${crest}</span>
    <div class="bp-bar"><i class="bp-trail"></i><i class="bp-fill"></i><b class="bp-pct" data-pct></b></div>
    <div class="bp-time"><i></i><span class="bp-clockicon" aria-hidden="true"></span></div></div>
   <span class="bp-sr" data-hp></span><span class="bp-sr" data-clock></span><span class="bp-sr" data-layers></span><span class="bp-sr" data-tag></span><span class="bp-sr" data-meta></span>`;
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
   const a=s.stageBossAttempt,limit=typeof STAGE_BOSS_LIMIT_MS==='number'?STAGE_BOSS_LIMIT_MS:30000;
   const time=a&&a.stage===s.stage?Math.max(0,a.deadline-Date.now())*(a.speed===2?2:1)/limit:null;
   return {time,hp:s.enemyHp,max:maxHp(),layers:5,tag:'지역 보스',meta:typeof stageText==='function'?stageText():'STAGE '+s.stage,clock:left?left+(String(left).includes('초')?'':'초'):'',key:'s'+s.stage};
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
  el.querySelector('[data-pct]').textContent=Math.max(hp>0?1:0,Math.ceil(hp/max*100))+'%';
  const clock=el.querySelector('[data-clock]');clock.textContent=st.clock||'';
  clock.classList.toggle('urgent',/^\D*([0-9]|10)초?$/.test(st.clock)&&!!st.clock);
  el.querySelector('[data-layers]').textContent=layer>1?'×'+layer:'';
  const fill=el.querySelector('.bp-fill'),trail=el.querySelector('.bp-trail');
  const color=LAYER_COLORS[(layer-1)%LAYER_COLORS.length],below=layer>1?LAYER_COLORS[(layer-2)%LAYER_COLORS.length]:'transparent';
  el.style.setProperty('--bp-color',color);el.style.setProperty('--bp-under',below);
  const share=hp/max*100;
  if(fresh){trail.style.transition='none';trail.style.width=share+'%';void trail.offsetWidth;trail.style.transition=''}
  fill.style.width=share+'%';
  requestAnimationFrame(()=>{trail.style.width=share+'%'});
  const time=el.querySelector('.bp-time');time.hidden=st.time==null;
  if(st.time!=null)time.firstElementChild.style.width=(Math.max(0,Math.min(1,st.time))*100)+'%';
  if(lastHp!==null&&hp<lastHp&&motion()){el.classList.remove('struck');void el.offsetWidth;el.classList.add('struck')}
  if(fresh&&motion()){el.classList.remove('arrive');void el.offsetWidth;el.classList.add('arrive')}
  if(fresh&&st.key[0]==='s'&&motion())bossWalkIn();
  lastHp=hp;lastLayer=layer;lastKey=st.key;
 }

 /* ---------- fix13: the stage boss walks in like the waves do (it used to pop into place) ---------- */
 let walkKey='';
 function bossWalkIn(){
  const field=battle(),mob=document.getElementById('mobActor'),a=s?.stageBossAttempt;
  if(!field||!mob?.animate||document.hidden||!a||Date.now()-a.started>1500)return;
  const key=a.stage+':'+a.started;if(walkKey===key)return;walkKey=key;
  // The hero takes the same few steps forward that it takes between waves.
  try{if(typeof actorMotion!=='undefined')actorMotion.advanceWave?.({boss:true})}catch(e){}
  const width=field.clientWidth,distance=width-mob.offsetLeft+mob.offsetWidth*.08,duration=1250/Math.max(1,s.speed||1);
  const steps=3,frames=Array.from({length:40},(_,i)=>{
   const t=i/39,tail=1-t,travel=tail*tail*(1+.6*t);
   const step=Math.abs(Math.sin(steps*Math.PI*t))*tail;
   return {offset:t,translate:`${(distance*travel).toFixed(1)}px ${(-5*step).toFixed(1)}px`,rotate:`${(1.4*Math.sin(2*steps*Math.PI*t)*tail).toFixed(2)}deg`,opacity:Math.min(1,t/.12)};
  });
  mob.animate(frames,{duration,easing:'linear',fill:'none'});
  // A puff of dust where each heavy foot lands.
  const feetY=mob.offsetTop+mob.offsetHeight*.94,feetX=mob.offsetLeft+mob.offsetWidth*.5;
  for(let k=1;k<=steps;k++){
   const t=k/steps-.02,tail=1-t,travel=tail*tail*(1+.6*t);
   const puff=document.createElement('i');puff.className='bp-dust';puff.setAttribute('aria-hidden','true');
   puff.style.left=(feetX+distance*travel)+'px';puff.style.top=feetY+'px';puff.style.animationDelay=(t*duration)+'ms';
   puff.addEventListener('animationend',()=>puff.remove(),{once:true});field.appendChild(puff);
  }
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
  // Numbers and skill names wait until the warning has passed, so the two never pile up.
  field.classList.add('bp-intro-on');card.onanimationend=e=>{if(e.target===card)field.classList.remove('bp-intro-on')};
  field.classList.remove('bp-boss-shake');void field.offsetWidth;field.classList.add('bp-boss-shake');
  buzz([18,40,28]);
 }

 /* ---------- Hit feel ---------- */
 function buzz(pattern){try{if(s?.effects!==false&&motion()&&navigator.vibrate)navigator.vibrate(pattern)}catch{}}
 function flash(node,strong){
  if(!node||!motion())return;
  // A short brightening of the struck body; the browser ends it, so no timer is left behind.
  node.animate?.(strong?[{filter:'brightness(1.75) saturate(.8)'},{filter:'brightness(1)'}]:[{filter:'brightness(1.4)'},{filter:'brightness(1)'}],{duration:strong?140:90,easing:'ease-out'});
 }
 /* fix13: hit spark at the point of contact for every basic attack and skill hit.
    A white-hot core, a shock ring, flying streaks and (for skills) a slash arc, all compositor
    animations that remove themselves; the screen itself barely moves. */
 let sparkCount=0;
 function hitSpark(host,left,top,{effect='',skill=false,big=false,echo=false,crit=false}={}){
  if(!host||!motion()||document.hidden)return null;
  if(sparkCount>14)return null;
  // Battle sparks go on their own layer above the monsters (the number layer sits under the actors' bodies).
  if(host.id==='fx'){const field=battle();let layer=document.getElementById('bpSparks');if(field&&!layer?.isConnected){layer=document.createElement('div');layer.id='bpSparks';layer.setAttribute('aria-hidden','true');field.appendChild(layer)}if(layer)host=layer}
  const color=ELEMENT_COLORS[effect]||(skill?'#ffd98a':'#fff1c9');
  const size=Math.round((echo?40:skill?84:60)*(big?1.3:1)*(crit?1.25:1));
  const box=document.createElement('span');box.className='bp-spark';box.setAttribute('aria-hidden','true');
  box.style.cssText=`left:${left};top:${top};width:${size}px;height:${size}px;--c:${color}`;
  const parts=[];
  const make=(cls,css='')=>{const i=document.createElement('i');i.className=cls;if(css)i.style.cssText=css;box.appendChild(i);return i};
  const core=make('core'),ring=make('ring');
  parts.push([core,[{transform:'scale(.25)',opacity:1},{offset:.3,transform:'scale(1)',opacity:1},{transform:'scale(1.25)',opacity:0}],230]);
  parts.push([ring,[{transform:'scale(.3)',opacity:.95,borderWidth:'3px'},{transform:'scale(1.7)',opacity:0,borderWidth:'1px'}],echo?240:340]);
  const rays=echo?4:skill||crit?8:6,turn=Math.random()*360;
  for(let k=0;k<rays;k++){
   const a=turn+k*360/rays+(Math.random()*18-9),len=size*(.32+Math.random()*.22);
   const ray=make('ray',`height:${len.toFixed(1)}px;rotate:${a.toFixed(1)}deg`);
   parts.push([ray,[{transform:`translate(-50%,${(-size*.08).toFixed(1)}px) scaleY(1)`,opacity:1},{transform:`translate(-50%,${(-size*.62).toFixed(1)}px) scaleY(.15)`,opacity:0}],260+Math.random()*100]);
  }
  if(skill&&!echo){
   const slash=make('slash',`rotate:${(-38+Math.random()*30).toFixed(1)}deg`);
   parts.push([slash,[{transform:'scale(.55,.4)',opacity:0},{offset:.25,transform:'scale(1,.9)',opacity:1},{transform:'scale(1.3,1)',opacity:0}],300]);
  }
  host.appendChild(box);sparkCount++;
  let left2=parts.length;const done=()=>{if(--left2<=0){box.remove();sparkCount--}};
  for(const [node,frames,ms] of parts){const an=node.animate?.(frames,{duration:ms,easing:'cubic-bezier(.2,.7,.3,1)',fill:'forwards'});if(an)an.onfinish=done;else done()}
  return box;
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
   const miner=MINER_ART?`<div class="bp-miner painted"><img class="mn-body" src="./assets/star-mine/miner-body.webp" alt="" draggable="false"><img class="mn-arm" src="./assets/star-mine/miner-arm.webp" alt="" draggable="false"></div>`:`<div class="bp-miner">${MINER_SVG}</div>`;
   layer.innerHTML=`<i class="bp-lantern"></i>${miner}<div class="bp-ore">${ore}<svg class="bp-cracks" viewBox="0 0 100 100"><path class="c1" d="M50 50 38 34M50 50 64 38"/><path class="c2" d="M50 50 41 66M50 50 70 58M38 34 30 30"/><path class="c3" d="M50 50 52 24M50 50 26 54M64 38 75 30M41 66 36 78"/></svg></div><b class="bp-combo"></b>`;
   // With the A15 art the floating pickaxe becomes a gloved hand gripping it (same anchor points).
   if(MINE_ART){const pick=field.querySelector('.mine-pick');if(pick)pick.src='./assets/star-mine/pick-hand.webp'}
   field.appendChild(layer);
   const view=document.getElementById('mineView');
   if(view&&!view.querySelector('.bp-mine-time')){const bar=document.createElement('div');bar.className='bp-mine-time';bar.innerHTML='<i></i>';view.querySelector('header')?.after(bar)}
  }
  // The ore node sits on the pick's target point.
  const st=getComputedStyle(field),tool=parseFloat(field.style.getPropertyValue('--mine-tool'))||parseFloat(st.getPropertyValue('--mine-tool'))||180;
  const left=parseFloat(field.style.getPropertyValue('--mine-left'))||0,top=parseFloat(field.style.getPropertyValue('--mine-top'))||0;
  const cx=left+.988*tool,cy=top+.40*tool;
  layer.style.setProperty('--ore-x',cx+'px');layer.style.setProperty('--ore-y',cy+'px');
  // The miner's pick tip (214,186 of its 240 box) lands on the contact point; the ore sits just past it.
  const w=field.clientWidth,h=field.clientHeight,size=Math.min(w*.62,h*.36,260),k=size/240,ore=Math.min(w*.36,h*.2,190);
  layer.style.setProperty('--miner-size',size+'px');layer.style.setProperty('--miner-x',(cx-214*k)+'px');layer.style.setProperty('--miner-y',(cy-186*k)+'px');
  layer.style.setProperty('--ore-size',ore+'px');layer.style.setProperty('--ore-cx',(cx+ore*.30)+'px');layer.style.setProperty('--ore-cy',(cy-ore*.12)+'px');
  return layer;
 }
 function minerSwing(auto){
  const miner=document.querySelector('#mineField .bp-miner');if(!miner||!motion())return;
  const arm=miner.querySelector('.mn-arm'),body=miner.querySelector('.mn-body');
  // Same clock as the star-mine strike: windup, contact at `hit`, a little follow-through, back to ready.
  const duration=auto?450:285,hit=auto?.40:.25;
  arm?.animate?.([{rotate:'-115deg'},{offset:hit*.5,rotate:'-128deg'},{offset:hit,rotate:'0deg'},{offset:Math.min(.9,hit+.12),rotate:'8deg'},{rotate:'-115deg'}],{duration,easing:'linear'});
  body?.animate?.([{rotate:'0deg',translate:'0 0'},{offset:hit*.5,rotate:'-3deg',translate:'-2px 0'},{offset:hit,rotate:'5deg',translate:'4px 1px'},{rotate:'0deg',translate:'0 0'}],{duration:duration*1.15,easing:'ease-out'});
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
  document.body?.classList?.toggle('ui-extra-art',UI_EXTRA_ART);
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
    const pick=document.querySelector('#mineField .mine-pick'),was=pick?.getAnimations?.()[0];
    const before=s?.mineRun?.hits;strike.call(this,auto);
    const now=pick?.getAnimations?.()[0];if(now&&now!==was)minerSwing(auto);
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
    if(r&&!s.mineRun){mineResult({hits,ore:s.ore-was.ore,stones:s.stones-was.stones,starIron:s.starIron-was.starIron});document.getElementById('notice')?.classList.remove('show');if(typeof noticeRewardTimer!=='undefined'){clearTimeout(noticeRewardTimer);noticeRewards={}}}
    nodeHits=0;combo=0;return out;
   };
  }
  // The mine result card already lists the haul; a second reward toast on top of it is noise.
  if(typeof rewardNotice==='function'){
   const before=rewardNotice;
   rewardNotice=function(...args){if(document.querySelector('.bp-mine-result'))return;return before.apply(this,args)};
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
 return {paintRoute,paintHud,castBanner,mineResult,routeMarkup,damageNumber,hitSpark};
})();
