'use strict';
const gradeColors=['#b7aba4','#69c8de','#b98bf3','#f0bb61'];
function collectionTile({name,icon,level,grade,color,equipped,action,empty=false,upgrade=false}){
 const status=empty?'빈 슬롯':!level?'미획득':(equipped?'장착 중 · ':'')+'Lv.'+level;
 const mark=empty?'':!level?skillLock():equipped?'<ui-mark data-shape=check aria-hidden=true></ui-mark>':upgrade?'<ui-mark data-shape=chevron-up aria-hidden=true></ui-mark>':'';
 return '<button type="button" class="collection-tile '+(!level&&!empty?'undiscovered ':'')+(equipped?'worn':'')+'" style="--rim:'+color+'" onclick="'+action+'" aria-label="'+name+(grade?' · '+grade:'')+' · '+status+'"><span class="tile-art">'+icon+(mark?'<i class="tile-mark">'+mark+'</i>':'')+(level?'<b class="tile-level">Lv.'+level+'</b>':'')+'</span><span class="tile-name">'+name+'</span></button>';
}
function skillTile(k){
 const grade=SKILL_RULES[k].tier,lv=s.skills[k]||0;
 return collectionTile({name:SK[k][0],icon:skillArt(k),level:lv,grade:SKILL_GRADES[grade],color:gradeColors[grade],equipped:s.slots.includes(k),action:"openMenu('skillDetail',"+k+")",upgrade:lv>0&&lv<100&&s.shards>=skillCost(k)});
}
function slotTile(i,k,choosing){
 const open=slotOpen(i),action=choosing===undefined?k<0?"openMenu('availableSkills',"+i+")":"openMenu('skillDetail',"+k+")":"equipAt("+i+","+choosing+")";
 if(!open)return '<button class="collection-tile slot-off" disabled><span class="tile-art">'+skillLock()+'</span><span class="tile-name">STAGE '+SLOT_GATES[i]+'</span></button>';
 return collectionTile({name:k<0?'슬롯 '+(i+1):SK[k][0],icon:k<0?'<span class="slot-plus"><ui-mark data-shape=plus aria-hidden=true></ui-mark></span>':skillArt(k),level:k<0?0:s.skills[k],grade:k<0?'':SKILL_GRADES[SKILL_RULES[k].tier],color:k<0?'#625769':gradeColors[SKILL_RULES[k].tier],equipped:false,empty:k<0,action});
}
skillsScreen=function(){
 unlockClassSkills();
 const ids=classSkillIds(),t=tacticsState();
 const choices=Object.entries(PRESET_NAMES).map(([key,title])=>'<button class="'+(t.selectedPreset===key?'active':'')+'" onclick="applySkillPreset(\''+key+'\')">'+title+'</button>').join('');
 return skillMaterialHUD()+'<section class="codex-block"><div class="codex-heading"><h3>장착 스킬</h3><div class="skill-build-actions"><button type="button" class="gold-button" data-guide="hunt" onclick="autoEquipSkills()">'+(guidance().status==='active'&&guidance().step===2?'사냥 구성 장착':'추천 스킬')+'</button><button class="muted-button" onclick="openMenu(\'saveBuild\')">구성 저장</button></div></div><div class="build-presets">'+choices+'</div><div class="collection-grid4">'+s.slots.map((k,i)=>slotTile(i,k)).join('')+'</div></section><section class="codex-block"><div class="codex-heading"><h3>스킬 도감</h3><span>'+ids.filter(k=>s.skills[k]).length+' / '+ids.length+'</span></div><div class="collection-grid4">'+ids.sort((a,b)=>SKILL_RULES[a].tier-SKILL_RULES[b].tier).map(skillTile).join('')+'</div></section>';
};
EXTRA_POPUPS.saveBuild=['구성 저장',()=>'<div class="action-row">'+Object.entries(PRESET_NAMES).map(([key,title])=>button(title,"saveSkillPreset('"+key+"');closeMenu()",false,true)).join('')+'</div>'];
function equipAt(i,k){if(!setSlot(i,k))return false;dismissPopup();renderScreen();return true}
function removeAt(i){
 if(!slotOpen(i)||s.slots[i]<0)return false;
 s.slots[i]=-1;cooldowns[i]=0;tacticsState().selectedPreset='custom';rememberClass();save();dismissPopup();paint();renderScreen();return true;
}
function beginEquip(k){
 if(!skillUnlocked(k))return;
 const free=s.slots.findIndex((v,i)=>v<0&&slotOpen(i));
 if(free>=0)equipAt(free,k);else openMenu('replaceSkill',k);
}
EXTRA_POPUPS.replaceSkill=['교체할 슬롯',()=>'<div class="collection-grid4">'+s.slots.map((v,i)=>slotTile(i,v,Number(tab))).join('')+'</div>'];
EXTRA_POPUPS.availableSkills=['장착할 스킬',()=>{
 const i=Number(tab),ids=classSkillIds().filter(k=>skillUnlocked(k)&&!s.slots.includes(k));
 return ids.length?'<div class="collection-grid4">'+ids.map(k=>collectionTile({name:SK[k][0],icon:skillArt(k),level:s.skills[k],grade:SKILL_GRADES[SKILL_RULES[k].tier],color:gradeColors[SKILL_RULES[k].tier],action:'equipAt('+i+','+k+')'})).join('')+'</div>':button('상점에서 스킬 소환',"openShopSummons('skill')");
}];
skillPopup=function(){
 const k=Number(tab);if(!skillBelongs(k))return '';
 const r=SKILL_RULES[k],lv=s.skills[k]||0,slot=s.slots.indexOf(k),cost=skillCost(k);
 const actions=lv?button(slot>=0?'장착 해제':'장착',slot>=0?'removeAt('+slot+')':'beginEquip('+k+')')+button(lv>=100?'최대 레벨':'강화 · 조각 '+cost,'skillLevel('+k+');render()',lv>=100||s.shards<cost,true):button('상점에서 스킬 소환',"openShopSummons('skill')");
 return skillMaterialHUD(k)+'<div class="ability-sheet" style="--rim:'+gradeColors[r.tier]+'">'+skillArt(k)+'<div><small>'+SKILL_GRADES[r.tier]+' · '+skillRoleLabel(k)+'</small><h3>'+SK[k][0]+'</h3><b>'+(lv?'Lv.'+lv:'미획득')+'</b></div></div><p class="ability-copy">'+CLASS_SKILLS[k][5]+'</p><div class="ability-metrics"><b>'+skillSummary(k)+'</b></div><div class="action-row">'+actions+'</div>';
};
function skillOddsRows(){
 return SKILL_GRADES.map((name,tier)=>({name,color:gradeColors[tier],chance:SKILL_RATES[tier]}));
}
summonRates=function(){
 const ids=classSkillIds();
 const groups=skillOddsRows().map((row,tier)=>{
  const pool=ids.filter(id=>SKILL_RULES[id].tier===tier);
  return summonOddsGroup(row,pool.map(id=>({name:SK[id][0],icon:skillArt(id),chance:row.chance/pool.length})));
 });
 return '<p class="small">한국 시간 0시 무료 1회. 첫 무료 소환은 미보유 기본 광역 스킬을 보장합니다. 결제 수단별 확률 동일 · 10회도 개별 추첨 · 중복 시 스킬 조각 10~20개(희귀 ×1.5 · 영웅 ×2 · 전설 ×3). 강화에 드는 조각도 같은 배수입니다</p>'+groups.join('');
};
EXTRA_POPUPS.summonRates=['스킬 소환 확률',summonRates];
summonScreen=function(){
 const ids=classSkillIds();
 const banner=`<section class="skill-observatory"><div><h2>${currentClass().name} 스킬 소환</h2><span>수집 ${ids.filter(id=>s.skills[id]>0).length} / ${ids.length}</span></div></section>`;
 return banner+summonOddsPanel(skillOddsRows(),'스킬 등급별·개별 확률',"openMenu('summonRates')")+drawControls('skill');
};
EXTRA_POPUPS.summonResult=['스킬 소환 결과',summonResult];
petsScreen=function(){
 const count=PETS.filter((_,i)=>s.pets[i]>0).length,j=s.activePet;
 return petMaterialHUD()+'<section class="codex-block"><div class="codex-heading"><h3>동행 중</h3><button class="muted-button" onclick="openShopSummons(\'pet\')">상점에서 소환</button></div>'+(j>=0?'<button class="pet-partner" onclick="openMenu(\'petDetail\','+j+')">'+petArt(j)+'<span>'+petTier(j).name+'<strong>'+PETS[j]+'</strong></span><b>Lv.'+s.pets[j]+'</b></button>':'<div class="no-partner">'+skillLock()+' 동행할 동료를 소환하세요</div>')+'</section><section class="codex-block"><div class="codex-heading"><h3>동료 도감</h3><span>'+count+' / '+PETS.length+'</span></div><div class="collection-grid4">'+petDisplayOrder().map(i=>collectionTile({name:PETS[i],icon:petArt(i),grade:petTier(i).name,color:petTier(i).color,level:s.pets[i]||0,equipped:i===j,upgrade:s.pets[i]>0&&s.pets[i]<50&&s.petShards>=petCost(i),action:"openMenu('petDetail',"+i+")"})).join('')+'</div></section>';
};
const dailyGifts={gems:{art:'gem',label:'다이아',flag:'shopGift',amount:()=>30},gold:{art:'coin',label:'골드',flag:'shopGold',amount:()=>Math.max(100,Math.round(goldGain()*6))}};
function giftAds(kind){return Math.min(2,Math.max(0,Math.floor(Number(s.daily.giftAds?.[kind])||0)))}
function dailyShopCards(){
 return Object.entries(dailyGifts).map(([kind,g])=>{
  const free=!!s.daily[g.flag],n=giftAds(kind),action=free?"startGiftAd('"+kind+"')":"claimFreeGift('"+kind+"')";
  return '<div class="offer-card daily-gift"><small>일일 선물</small><strong>'+g.label+' '+num(g.amount())+'</strong>'+art(g.art)+button(!free?'무료 수령':n<2?'광고 · '+(2-n)+'회 남음':'오늘 수령 완료',action,n>=2)+'</div>';
 }).join('');
}
function claimFreeGift(kind){
 resetDay();const g=dailyGifts[kind];if(!g||s.daily[g.flag])return false;
 if(kind==='gems'){const result=claimShopDaily();return saveGuard.usesServer()?result:true}
 s.daily[g.flag]=true;const n=g.amount();s[kind]+=n;save();paint();notice(g.label+' +'+num(n));return true;
}
let pendingGiftAd=null;
function finishGiftAd(ad){
 if(pendingGiftAd!==ad||!ad||s!==ad.owner||s.day!==ad.day||today()!==ad.day||!s.daily[dailyGifts[ad.kind].flag]||giftAds(ad.kind)>=2)return false;
 if(ad.kind==='gems'&&saveGuard.usesServer()){
  if(ad.settling)return false;
  ad.settling=true;render();
  return claimAccountReward('shopAd','gems:'+(giftAds('gems')+1)).then(receipt=>{
   if(pendingGiftAd===ad){
    if(receipt){pendingGiftAd=null;if(view==='rewardAd')dismissPopup()}
    else {ad.settling=false;if(view==='rewardAd')render()}
   }
   return !!receipt;
  });
 }
 pendingGiftAd=null;const g=dailyGifts[ad.kind];s.daily.giftAds||={};s.daily.giftAds[ad.kind]=giftAds(ad.kind)+1;s[ad.kind]+=ad.amount;
 save();dismissPopup();paint();notice(g.label+' +'+num(ad.amount));return true;
}
function startGiftAd(kind){
 resetDay();const g=dailyGifts[kind];if(!g||!s.daily[g.flag]||giftAds(kind)>=2||pendingGiftAd)return false;
 const ad={kind,owner:s,day:s.day,amount:g.amount(),ends:Date.now()+3000};pendingGiftAd=ad;openMenu('rewardAd');
 ad.timer=setTimeout(()=>{if(pendingGiftAd===ad&&view==='rewardAd')render()},3020);return true;
}
function collectTestAd(){const ad=pendingGiftAd;if(!ad||view!=='rewardAd'||document.hidden||Date.now()<ad.ends)return false;return finishGiftAd(ad)}
function cancelGiftAd(){if(pendingGiftAd)clearTimeout(pendingGiftAd.timer);pendingGiftAd=null}
EXTRA_POPUPS.rewardAd=['광고 보상 테스트',()=>{
 const a=pendingGiftAd;if(!a)return '';
 const done=Date.now()>=a.ends;
 return '<div class="test-ad">'+art(dailyGifts[a.kind].art)+'<h3>'+dailyGifts[a.kind].label+' '+num(a.amount)+'</h3><p>테스트 재생 · 3초</p><i></i></div><div class="action-row">'+button('닫기','closeMenu()',false,true)+button('보상 받기','collectTestAd()',!done||a.settling)+'</div>';
}];
const closeBeforeGift=closeMenu,dismissBeforeGift=dismissPopup;
closeMenu=function(...args){if(view==='rewardAd')cancelGiftAd();return closeBeforeGift(...args)};
dismissPopup=function(...args){
 if(view==='rewardAd')cancelGiftAd();
 const result=dismissBeforeGift(...args);
 if(activeScreen==='home'&&s?.guidance?.status==='active')paintJourneyPanel();
 return result;
};
document.addEventListener('visibilitychange',()=>{if(document.hidden&&pendingGiftAd){cancelGiftAd();if(view==='rewardAd')closeMenu()}});

