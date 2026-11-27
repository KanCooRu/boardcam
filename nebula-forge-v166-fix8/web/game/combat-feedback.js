/* Visible combat feedback, coherent shop values and isolated VIP previews. */
'use strict';
let enemyRespawnUntil=0,defeatTimer=0,noticeRewardTimer=0,noticeRewards={},vipPreview=1;
paintBattleSwitch=function(id,label,on){const el=$(id);el.classList.toggle('orb-on',on);el.classList.toggle('orb-off',!on);el.innerHTML='<span class="orb-symbol">'+(id==='auto'?'<ui-mark data-shape=swords aria-hidden=true></ui-mark>':'<ui-mark data-shape=crown aria-hidden=true></ui-mark>')+'</span><span class="orb-label">'+label+'</span>';el.setAttribute('role','switch');el.setAttribute('aria-checked',String(on));el.setAttribute('aria-label',label+' '+(on?'켜짐':'꺼짐'));};

function rewardNotice(rewards,title='보상 수령 완료'){
 for(const [k,n] of Object.entries(rewards))if(Number.isFinite(n)&&n>0)noticeRewards[k]=(noticeRewards[k]||0)+n;
 if(!Object.keys(noticeRewards).length)return;
 clearTimeout(noticeRewardTimer);noticeRewardTimer=setTimeout(()=>{const el=$('notice'),rows=Object.entries(noticeRewards);noticeRewards={};el.className='notice reward-notice show';el.innerHTML='<span class="notice-confirm"><ui-mark data-shape=check aria-hidden=true></ui-mark></span><div class="notice-body"><strong>'+safeText(title)+'</strong><div class="notice-items">'+rows.map(([k,n])=>'<span>'+art(RESOURCE_ART[k]||'quests')+'<b>+'+compact(n)+'</b><small>'+safeText(RESOURCE_NAMES[k]||k)+'</small></span>').join('')+'</div></div>';hydrateArt(el);clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),3800)},40);
}
notice=function(message){const el=$('notice');el.className='notice info-notice show';el.innerHTML='<span class="notice-confirm"><ui-mark data-shape=diamond aria-hidden=true></ui-mark></span><div class="notice-body">'+safeText(String(message))+'</div>';clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),2600)};
// Capture actual wallet deltas, so every successful claim displays the exact paid amounts.
function announceRewards(fn){const wrapped=function(...args){const before={};for(const k of Object.keys(RESOURCE_NAMES))if(k!=='tickets')before[k]=s[k]||0;const result=fn.apply(this,args),reward={};for(const k of Object.keys(before)){const after=s[k]||0;if(after>before[k])reward[k]=after-before[k]}rewardNotice(reward);return result};wrapped.original=fn;return wrapped}
claimCollection=announceRewards(claimCollection);claimQuest=announceRewards(claimQuest);claimAttendance=announceRewards(claimAttendance);claimMonthDay=announceRewards(claimMonthDay);claimShopDaily=announceRewards(claimShopDaily);dailyClaim=announceRewards(dailyClaim);weeklyClaim=announceRewards(weeklyClaim);claimAchievement=announceRewards(claimAchievement);claimNewbie=announceRewards(claimNewbie);claimMine=announceRewards(claimMine);claimExpedition=announceRewards(claimExpedition);claimOffline=announceRewards(claimOffline);claimPass=announceRewards(claimPass);claimSeason=announceRewards(claimSeason);claimAllPass=announceRewards(claimAllPass);claimAllMail=announceRewards(claimAllMail);claimMailById=announceRewards(claimMailById);
// Bulk mail wraps individual claims: suppress inner presentation to avoid double counts.
const feedbackMailClaim=claimMailById;
claimMailById=function(id,quiet=false){return quiet?feedbackMailClaim.original(id,quiet):feedbackMailClaim(id,quiet)};

function clearDefeatFeedback(){clearTimeout(defeatTimer);enemyRespawnUntil=0;const layer=$('defeatFx');if(layer)layer.remove();$('mobActor').classList.remove('awaiting-spawn');$('mobActor').classList.remove('enemy-arrival');$('battle').classList.remove('enemy-defeated')}
function showDefeatFeedback(e){
 if(activeScreen!=='home'||view||document.hidden)return;
 clearDefeatFeedback();
 // The successor already owns this lane and has its own entrance.
 if(e.actorWave!==$('mobActor').dataset.wave)return;
 const layer=document.createElement('div');layer.id='defeatFx';layer.className='defeat-feedback '+(e.boss?'boss-defeat':'')+(motionAllowed()?'':' minimal-defeat');
 layer.innerHTML='<div class="fallen-creature '+(e.boss?'fallen-boss':'')+'">'+art(e.art)+'</div><div class="defeat-caption"><b>'+(e.boss?'BOSS CLEAR':'처치 완료')+'</b><span>'+safeText(e.name)+'</span></div>';
 $('battle').appendChild(layer);hydrateArt(layer);
 if(e.fallAt){
  const fallen=layer.querySelector('.fallen-creature'),r=e.fallAt;
  if(r.still)fallen.hidden=true;
  Object.assign(fallen.style,{left:r.left+'px',top:r.top+'px',width:r.width+'px',height:r.height+'px',right:'auto',bottom:'auto'});
  adventureFx.defeat(r,e.region,weaponAudio.surface(e.region,e.boss?3:e.variant),e.boss);
 }
 $('battle').classList.add('enemy-defeated');$('mobActor').classList.add('awaiting-spawn');enemyRespawnUntil=Date.now()+460;
 defeatTimer=setTimeout(()=>{layer.remove();$('battle').classList.remove('enemy-defeated');$('mobActor').classList.remove('awaiting-spawn');$('mobActor').classList.add('enemy-arrival');enemyRespawnUntil=0;setTimeout(()=>$('mobActor').classList.remove('enemy-arrival'),280)},460);
}
// Dungeon bosses advance or open their result screen on death. Only campaign
// defeats have a respawn interval during which the fallen actor can be shown.
function captureCampaignDefeat(){
 const e=encounterFor(s.stage,null),target=$('mobActor');
 e.fallAt=adventureFx.deathAnchor(target);
 e.actorWave=target.dataset.wave;
 if(e.boss&&warriorMotion.visible())actorMotion.hitStop(190,target);
 return e;
}
const attackBeforeFeedback=performClassAttack;
performClassAttack=function(k=-1,automatic=false){if(Date.now()<enemyRespawnUntil)return false;return attackBeforeFeedback(k,automatic)};
const travelBeforeFeedback=travel,navBeforeFeedback=navigate,loadBeforeFeedback=load;
travel=function(d){clearDefeatFeedback();return travelBeforeFeedback(d)};
navigate=function(page,sub){if(page!=='home')clearDefeatFeedback();return navBeforeFeedback(page,sub)};
load=function(){clearDefeatFeedback();return loadBeforeFeedback()};

const VIP_LEVELS=[
 {threshold:1200,gift:{gems:22,ore:11}},
 {threshold:5900,gift:{gems:66,ore:22,summonTickets:1}},
 {threshold:14000,gift:{gems:110,ore:33,summonTickets:2}},
 {threshold:33000,gift:{gems:200,ore:55,summonTickets:3}},
 {threshold:55000,gift:{gems:275,ore:77,relicShards:33}},
 {threshold:100000,gift:{gems:440,ore:110,summonTickets:5}},
 {threshold:200000,gift:{gems:770,ore:154,rouletteCoins:5}},
 {threshold:350000,gift:{gems:1100,ore:220,summonTickets:10}},
 {threshold:500000,gift:{gems:1650,ore:308,rouletteCoins:10}}
];
function normalizeBenefits(a){a.vipLifetimeSpent=Math.floor(bounded(Math.max(a.vipLifetimeSpent||0,a.season?.spent||0)));a.vipRewards=recordMap(a.vipRewards);a.vipRewards.gifts=recordMap(a.vipRewards.gifts);a.vipRewards.daily=typeof a.vipRewards.daily==='string'?a.vipRewards.daily:'';return a}
const beforeBenefitsStarter=starter,beforeBenefitsMigrate=migrate,beforeBenefitsReset=resetDay;
starter=function(){return normalizeBenefits(beforeBenefitsStarter())};migrate=function(data){return normalizeBenefits(beforeBenefitsMigrate(data))};
resetDay=function(){if(s)normalizeBenefits(s);beforeBenefitsReset()};
function vipSpend(){return gmAllowed()&&Number.isFinite(testSession.vipSpend)?testSession.vipSpend:s.vipLifetimeSpent||0}
vipLevel=function(){return VIP_LEVELS.filter(v=>vipSpend()>=v.threshold).length};
function setVipPreview(i){vipPreview=Math.max(1,Math.min(VIP_LEVELS.length,i));render()}
function previewVipEntitlement(){if(!gmAllowed())return false;testSession.vipSpend=VIP_LEVELS[vipPreview-1].threshold;paint();return true}
function claimVipGift(i){const v=VIP_LEVELS[i-1];if(!v||!gmAllowed()||vipSpend()<v.threshold||s.vipRewards.gifts[i])return false;s.vipRewards.gifts[i]=true;grant(v.gift);save();paint();rewardNotice(v.gift,'VIP '+i+' 승급 선물');return true}
// Old cached controls cannot grant the removed daily benefit.
function claimVipDaily(){return false}
claimVip=claimVipGift;
function vipRewardTiles(reward){return '<div class="vip-reward-grid">'+Object.entries(reward).map(([k,n])=>'<div>'+art(RESOURCE_ART[k])+'<b>'+num(n)+'</b><small>'+RESOURCE_NAMES[k]+'</small></div>').join('')+'</div>'}
vipUI=function(){const v=VIP_LEVELS[vipPreview-1],spent=vipSpend(),owned=vipLevel()>=vipPreview,claimed=!!s.vipRewards.gifts[vipPreview];return '<section class="vip-center-banner"><h3>별빛 혜택 센터</h3><p>모험을 오래 함께할수록 빛나는 선물</p>'+art('vip')+'</section><div class="vip-ribbon">누적 충전 VIP</div><section class="vip-parchment"><div class="vip-rank-selector"><button onclick="setVipPreview(vipPreview-1)" aria-label="이전 VIP" '+(vipPreview===1?'disabled':'')+'><ui-mark data-shape=chevron-left aria-hidden=true></ui-mark></button><div class="vip-medallion">'+art('vip')+'<b>'+vipPreview+'</b></div><div><h3>VIP '+vipPreview+'</h3><span>누적 '+num(v.threshold)+'원</span></div><button onclick="setVipPreview(vipPreview+1)" aria-label="다음 VIP" '+(vipPreview===9?'disabled':'')+'><ui-mark data-shape=chevron-right aria-hidden=true></ui-mark></button></div><h4>승급 선물 · 등급별 1회</h4>'+vipRewardTiles(v.gift)+'<div class="vip-progress-copy"><span>현재 누적 금액</span><b>'+num(spent)+' / '+num(v.threshold)+'원</b></div><div class="vip-progress" role="progressbar" aria-valuemin="0" aria-valuemax="'+v.threshold+'" aria-valuenow="'+Math.min(spent,v.threshold)+'"><i style="width:'+Math.min(100,spent/v.threshold*100)+'%"></i></div><button class="gold-button profile-wide" onclick="claimVipGift('+vipPreview+')" '+(!gmAllowed()||!owned||claimed?'disabled':'')+'>'+(claimed?'<ui-mark data-shape=check aria-hidden=true></ui-mark> 수령 완료':!gmAllowed()?'결제 연결 준비 중':owned?'승급 선물 받기':'등급 미달성')+'</button></section><div class="vip-rules"><b>혜택 안내</b><p>누적 충전 등급은 매월 유지됩니다. 승급 선물은 등급별 1회입니다.</p><p>결제 연결 후 혜택이 열리며, 시즌 패스 금액도 VIP에 누적될 예정입니다.</p></div>'};
const openBeforeVip=openMenu;
openMenu=function(kind,arg){if(kind==='vip')vipPreview=Math.max(1,vipLevel());return openBeforeVip(kind,arg)};

// Additional main quests continue the first difficulty without changing old IDs.
const EXTRA_MAIN_STAGES=[150,200,250,300],legacyQuestCount=Q.length;
for(const stage of EXTRA_MAIN_STAGES)Q.push(['노말 STAGE '+stage+' 도달',()=>s.maxStage>=stage]);
const progressBefore270=questProgress;
questProgress=function(i){return i>=legacyQuestCount&&i<Q.length?[Math.min(s.maxStage,300),EXTRA_MAIN_STAGES[i-legacyQuestCount]]:progressBefore270(i)};
