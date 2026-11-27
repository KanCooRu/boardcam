/* Artwork catalogue and view integration. Purchase catalog intentionally has no local credit path. */
'use strict';
SCREEN_TABS.shop=[['diamonds','다이아'],['exchange','교환'],['summon','소환'],['costumes','스킨'],['packages','패키지']];
SCREEN_TABS.dungeon.splice(2,0,['regions','지역 지도']);
SHORTCUTS.shop=['shop','diamonds'];
let selectedPet=0,lastEncounterKey='';
function paintWorld(){
 document.body.classList.toggle('dungeon-combat',!!dungeonRun);$('dungeonLeave').hidden=$('dungeonHeading').hidden=!dungeonRun;
 if(dungeonRun){
  const r=dungeonRun,floor=r.mode==='tower'||r.mode==='trial',rush=r.mode==='rush';
  const name=floor||rush?DUNGEON_BANNERS[r.mode].name:DUNGEON_NAMES[r.i];
  const progress=floor?r.n+'층':rush?r.bosses+'보스 돌파':r.n+'단계';
  const seconds=Math.max(0,Math.ceil(r.time))+'초';
  $('stage').textContent=name;
  $('region').textContent=progress+' · '+seconds;
  $('dungeonName').textContent=rush?name:name+' '+progress;
  $('dungeonClock').textContent='남은 시간 '+seconds;
 }
 const e=encounterFor(s.stage,dungeonRun),b=BIOMES[e.region],land=document.querySelector('.landscape'),mob=$('mobActor');
 const key=e.art+':'+e.background+':'+s.activePet;
 if(!dungeonRun)$('region').textContent=b.name+' · '+(e.boss?'지역 보스':((s.stage-1)%10+1)+'/10');
 if(key!==lastEncounterKey){
  lastEncounterKey=key;
  if(e.mini){
   $('battle').dataset.towerMini='true';$('battle').dataset.miniScale=e.scale;
   const field=$('battle');field.style.setProperty('--tower-mini-size',Math.round(Math.min(field.clientWidth*e.scale,field.clientHeight*.53))+'px');
  }else{delete $('battle').dataset.towerMini;delete $('battle').dataset.miniScale}
  land.style.filter='none';land.style.backgroundImage='var(--'+e.background+')';
  $('battle').style.setProperty('--biome-accent',b.color);$('battle').setAttribute('data-region',e.region);
  mob.classList.add('world-creature');
  if(!isDuoBattle()){mob.setAttribute('data-art',e.art);mob.setAttribute('aria-label',e.name);hydrateArt($('battle'))}
  $('mobTwo').hidden=true;$('mobThree').hidden=true;
  const pet=$('battlePet');if(pet){pet.hidden=s.activePet<0;if(s.activePet>=0&&pet.dataset.companion!==String(s.activePet)){pet.dataset.companion=String(s.activePet);pet.innerHTML=petArt(s.activePet,'','battle');pet.setAttribute('aria-label',PETS[s.activePet]);hydrateArt(pet)}}
 }
 mob.classList.toggle('region-boss',e.boss);
 $('battleWeather').className='battle-weather region-weather-'+e.region;
}
function initDiversity(){
 const pet=document.createElement('div');pet.id='battlePet';pet.className='battle-pet';pet.setAttribute('role','img');$('battle').appendChild(pet);
 lastEncounterKey='';paintWorld();
}
function petDisplayOrder(){return PET_TIERS.slice().reverse().flatMap(t=>t.pets)}
petsScreen=function(){const i=s.activePet>=0?s.activePet:selectedPet,p=COMPANIONS[i],lv=s.pets[i]||0;return `<div class="pet-hero"><div class="pet-aura"></div>${petArt(i)}<h2>${p[0]}</h2>${petTierBadge(i)}<p>${p[1]}</p><small>${lv?'Lv.'+lv+' · '+(s.activePet===i?'동행 중':'보유 동료'):'6등급 · 12종의 별의 동료'}</small></div><div class="summary-strip"><span>보유 <b>${Object.keys(s.pets).length} / ${PETS.length}</b></span><button class="muted-button" onclick="openMenu('petRates')">소환 확률 <ui-mark data-shape=info aria-hidden=true></ui-mark></button></div><div class="action-row">${button('1회 소환<small>다이아 '+num(PET_SUMMON_PRICE)+'</small>','animatePetSummon(1)',s.gems<PET_SUMMON_PRICE,true)}${button('10회 소환<small>다이아 '+num(PET_SUMMON_PRICE*10)+'</small>','animatePetSummon(10)',s.gems<PET_SUMMON_PRICE*10)}</div><div class="pet-sort-note">등급 높은 순 · 천상 → 일반</div><div class="pet-grid">${petDisplayOrder().map(j=>`<button class="pet-card ${s.activePet===j?'equipped':''}" style="--pet-tier:${petTier(j).color}" onclick="openMenu('petDetail',${j})">${petArt(j)}${s.activePet===j?'<em>동행</em>':''}${petTierBadge(j)}<b>${PETS[j]}</b><small>${s.pets[j]?'Lv.'+s.pets[j]:'미보유'} · ${Object.keys(COMPANIONS[j][2]).map(key=>PET_EFFECT_LABELS[key]).join(' · ')}</small></button>`).join('')}</div>`};
function petSummonPopup(){return drawResultPanel('pet',petSummonResults)}
function petRatesPopup(){
 const groups=PET_TIERS.map(t=>summonOddsGroup({name:t.name,color:t.color,chance:t.weight/100},
  t.pets.map(i=>({name:PETS[i],icon:petArt(i),chance:petProbability(i)})))).join('');
 return '<p class="small">같은 등급 내 확률 동일 · 10회도 개별 추첨 · 중복 시 동료 조각 10~20개(희귀 ×1.2 · 영웅 ×1.5 · 전설 ×2 · 신화 ×2.5 · 천상 ×3). 강화에 드는 조각도 같은 배수입니다</p>'+groups;
}
const exchangeShopScreen=shopScreen;
shopScreen=function(){return screenTab==='diamonds'?diamondShop():exchangeShopScreen()};
function diamondShop(){return `<div class="diamond-banner"><div><h2>별의 다이아 상점</h2><p>모험을 위한 빛나는 선택</p></div>${art('diamonds4')}</div><div class="shop-status"><span class="status-lamp"></span><div><b>결제 오픈 준비 중</b><small>상품을 누르면 구성과 첫 충전 혜택을 볼 수 있습니다.</small></div></div><div class="diamond-grid">${DIAMOND_PRODUCTS.map((p,i)=>`<button class="diamond-product ${i===DIAMOND_PRODUCTS.length-1?'grand':''}" onclick="openMenu('diamondProduct',${i})"><span class="first-charge">첫 충전 2배</span>${art(p.art)}<span class="product-copy"><small>${p.name}</small><strong>${num(p.gems)} <em>다이아</em></strong><span class="bonus">첫 구매 보너스 +${num(p.gems)}</span></span><span class="product-price">${num(p.price)}원 <small>구성 보기 <ui-mark data-shape=chevron-right aria-hidden=true></ui-mark></small></span></button>`).join('')}</div><p class="small shop-footnote">상품별 첫 유료 구매는 다이아 2배입니다. 결제 연결 후 적용됩니다.</p>`}
function diamondProductPopup(){const i=+tab,p=DIAMOND_PRODUCTS[i];if(!p)return '<p>상품을 선택하세요.</p>';return `<div class="popup-hero diamond-detail">${art(p.art)}<h3>${p.name}</h3><p>다이아 ${num(p.gems)}개</p></div><div class="effect-table"><div><span>기본 수량</span><b>${num(p.gems)} 다이아</b></div><div><span>첫 구매 추가 수량</span><b>+${num(p.gems)} 다이아</b></div><div class="purchase-total"><span>첫 구매 시 총 수량</span><b>${num(p.gems*2)} 다이아</b></div><div><span>상품 가격</span><b>${num(p.price)}원</b></div></div><div class="payment-notice"><b>아직 구매할 수 없습니다</b><p>결제 연결 전입니다. 현재 구매와 다이아 지급은 불가합니다.</p></div><div class="action-row">${button('결제 연결 전','',true)}${button('상점으로 돌아가기','closeMenu()',false,true)}</div>`}
function worldMapPopup(){return `<div class="atlas-intro"><h3>여덟 세계를 잇는 별길</h3><p>지역마다 9번의 사냥과 1번의 보스전.<br>배경·몬스터 3종·지역 보스가 함께 바뀝니다.</p></div><div class="world-grid">${BIOMES.map((b,i)=>`<button class="world-card ${currentRegion()===i?'current':''}" style="--world-bg:var(--region_${i})" onclick="openMenu('regionDetail',${i})"><span class="world-number">${String(i+1).padStart(2,'0')}</span><div><small>STAGE ${i*10+1}–${i*10+10}</small><b>${b.name}</b><em>${s.maxStage>=i*10+1?'지역 정보 보기':'미탐험 · 미리보기'}</em></div></button>`).join('')}</div><p class="small">STAGE 81부터 8개 지역을 순환하며 적이 강해집니다. 현재 ${Math.floor((s.stage-1)/80)+1}회차 · 최고 STAGE ${s.maxStage}</p>`}
function regionDetailPopup(){const i=+tab,b=BIOMES[i];if(!b)return '<p>지역을 선택하세요.</p>';const cycle=Math.floor((s.stage-1)/80),start=cycle*80+i*10+1,target=start<=s.maxStage?start:i*10+1;return `<div class="region-preview" style="background-image:var(--region_${i})"><span>REGION ${String(i+1).padStart(2,'0')}</span><h3>${b.name}</h3><p>${b.sub}</p></div><p class="small">${b.desc}</p>${head('이 지역의 몬스터','스테이지마다 순서대로 등장')}<div class="bestiary-grid">${b.mobs.map((mob,j)=>`<div>${art('creature_'+i+'_'+j)}<b>${mob.name}</b><small>${j+1} · ${j+4} · ${j+7}번째 사냥</small></div>`).join('')}</div><div class="region-boss-preview">${art('creature_'+i+'_3')}<div><span>REGION BOSS · 10 / 10</span><h3>${b.boss}</h3><small>지역의 마지막 스테이지에서 등장</small></div></div><div class="action-row">${button('STAGE '+target+'로 이동',`travelToRegion(${i})`,target>s.maxStage||!!dungeonRun)}${button('지역 목록','closeMenu()',false,true)}</div>`}
function travelToRegion(i){if(!Number.isInteger(i)||i<0||i>=8||dungeonRun)return;const start=Math.floor((s.stage-1)/80)*80+i*10+1,target=start<=s.maxStage?start:i*10+1;if(target>s.maxStage){notice('아직 탐험하지 않은 지역입니다');return}s.stage=target;s.enemyHp=maxHp();heroCurrentHp=health();battleElapsed=0;navigate('home');paint();save()}
const existingDungeonScreen=dungeonScreen;
dungeonScreen=function(){return screenTab==='regions'?worldMapPopup():existingDungeonScreen()};
EXTRA_POPUPS.petDetail=['동료 관리',petDetail];
Object.assign(EXTRA_POPUPS,{petSummonResult:['별의 동료 소환',petSummonPopup],petRates:['동료 소환 확률',petRatesPopup],diamondProduct:['다이아 상품',diamondProductPopup],worldMap:['지역 지도',worldMapPopup],regionDetail:['탐험 안내',regionDetailPopup]});
