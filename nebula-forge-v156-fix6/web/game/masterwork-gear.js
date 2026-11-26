/* Stage-gated equipment recipes; existing random drops and saved IDs stay intact. */
'use strict';
const MASTERWORKS=[
 {id:'moon',name:'은월 원정대',short:'은월',stage:90,level:30,forge:7,r:5,color:'#b4d9ef',cost:{gold:50000,ore:100,stones:200,relicShards:15},names:['은월의 길잡이','은월 원정 투구','은월 원정 흉갑','은월 원정 각반','은월 원정 장갑','은월 원정 장화','은월의 나침반']},
 {id:'sun',name:'태양 수호대',short:'태양',stage:270,level:170,forge:14,r:7,color:'#f5cc7f',cost:{gold:400000,ore:250,stones:700,relicShards:35},names:['여명의 서약','태양 수호 투구','태양 수호 흉갑','태양 수호 각반','태양 수호 건틀릿','태양 수호 장화','태양의 성인']},
 {id:'dragon',name:'고룡 정복자',short:'고룡',stage:390,level:200,forge:14,r:8,color:'#ed997a',cost:{gold:1800000,ore:450,stones:1400,relicShards:60},names:['용혈의 맹세','고룡 뿔투구','고룡 비늘갑','고룡 경갑','고룡 발톱 장갑','고룡 전투화','고룡의 심장']},
 {id:'sky',name:'천공 심판관',short:'천공',stage:690,level:300,forge:16,r:9,color:'#a9e6f8',cost:{gold:6000000,ore:750,stones:2500,relicShards:100},names:['천공의 판결','천공 날개투구','천공 성갑','천공 성각갑','천공 성수갑','천공 비행화','천공의 성휘']},
 {id:'void',name:'공허 지배자',short:'공허',stage:990,level:400,forge:18,r:10,color:'#d7a2fc',cost:{gold:16000000,ore:1200,stones:4000,relicShards:160},names:['종언의 왕검','공허의 관','공허 지배 흑갑','공허 지배 각반','공허 지배 손아귀','공허 지배 장화','공허의 별심장']}
];
const MASTERWORK_SET_OFFSET=REGION_SETS.length,MASTERWORK_MULTIPLIER=1.05;
REGION_SETS.push(...MASTERWORKS.map(t=>t.name));
let masterworkTier=0,masterworkPart=1;
function masterworkDef(g){const i=g?.masterwork;return Number.isInteger(i)&&MASTERWORKS[i]&&g.r===MASTERWORKS[i].r&&Number.isInteger(g.p)&&g.p>=0&&g.p<7?MASTERWORKS[i]:null}
function normalizeMasterworks(a,raw=a){if(raw.masterworkVersion!==1){a.legacyShowcasePower=a.showcase.reduce((sum,n)=>sum+n,0)*(.001-.00003)}a.legacyShowcasePower=bounded(a.legacyShowcasePower,0,7);for(const g of a.gear){if(masterworkDef(g)){g.set=MASTERWORK_SET_OFFSET+g.masterwork;}else{delete g.masterwork;if(!isPlainStarter(g))g.set=REGIONAL_SET_IDS.includes(g.set)?g.set:Math.floor(bounded(g.set,0,MASTERWORK_SET_OFFSET-1))}}a.masterworkVersion=1;return a}
const starterBeforeMasterworks=starter,migrateBeforeMasterworks=migrate;
starter=function(){return normalizeMasterworks(starterBeforeMasterworks(),{masterworkVersion:1})};
migrate=function(data){return normalizeMasterworks(migrateBeforeMasterworks(data),data||{})};
const titleBeforeMasterworks=equipmentTitle,artBeforeMasterworks=gearArt,valueBeforeMasterworks=gearValue;
equipmentTitle=function(g){const t=masterworkDef(g);return t?t.names[g.p]:titleBeforeMasterworks(g)};
gearArt=function(g,cls=''){return masterworkDef(g)?art('masterwork_'+g.masterwork+'_'+g.p,'equipment-art masterwork-art '+cls):artBeforeMasterworks(g,cls)};
gearValue=function(g){return valueBeforeMasterworks(g)*(masterworkDef(g)?MASTERWORK_MULTIPLIER:1)};
setBonuses=function(){const counts=Array(REGION_SETS.length).fill(0);Object.values(s.equipped).forEach(id=>{const g=s.gear.find(x=>x.id===id);if(g)counts[g.set||0]++});let attack=0,hp=0;for(const n of counts){if(n>=2)attack+=.05;if(n>=4)hp+=.1;if(n>=7){attack+=.2;hp+=.2}}return{counts,attack,hp}};
function masterworkSample(i,p){return {id:'masterwork_preview',p,r:MASTERWORKS[i].r,plus:0,set:MASTERWORK_SET_OFFSET+i,masterwork:i,locked:true}}
function masterworkUnlocked(i){const t=MASTERWORKS[i];return !!t&&s.campaignCleared>=t.stage&&s.level>=t.level&&s.forgeLevel>=t.forge}
function masterworkBlock(i,p){const t=MASTERWORKS[i];if(!t||!Number.isInteger(p)||p<1||p>6)return '장비를 선택하세요';if(dungeonRun||forgeBusy)return '전투 도전·제작 완료 후 이용하세요';if(!masterworkUnlocked(i))return '해금 조건을 달성하세요';if(s.gear.length>=GEAR_CAPACITY)return '장비 가방에 빈칸이 필요합니다';if(Object.entries(t.cost).some(([k,n])=>s[k]<n))return '제작 재료가 부족합니다';return ''}
function craftMasterwork(i,p){const block=masterworkBlock(i,p);if(block){notice(block);return false}const t=MASTERWORKS[i];for(const[k,n]of Object.entries(t.cost))s[k]-=n;s.crafted++;const g={...masterworkSample(i,p),id:'mw_'+Date.now().toString(36)+'_'+s.crafted};g.discovered=!s.unlocked[g.p+'_'+g.r];s.gear.push(g);s.unlocked[g.p+'_'+g.r]=true;if(s.autoEquip&&gearValue(g)>gearValue(equippedItem(g.p)))s.equipped[g.p]=g.id;advanceForge(1);trackOrderEvent('crafted');s.daily.crafted=(s.daily.crafted||0)+1;s.weekly.crafted=(s.weekly.crafted||0)+1;lastLoot=[g];s.lastLoot=lastLoot;save();paint();openMenu('loot');playSound('forge');return true}
function selectMasterwork(i){if(!Number.isInteger(i)||!MASTERWORKS[i])return;masterworkTier=i;renderScreen(false)}
function selectMasterworkPart(p){if(!Number.isInteger(p)||p<1||p>6)return;masterworkPart=p;renderScreen()}
function equipmentStatsPreview(g){const previousGear=s.gear,previousEquipped=s.equipped;const stats=()=>({attack:power(),health:health(),speed:attackSpeed(),critical:criticalChance(),penetration:armorPenetration(),critDamage:criticalDamageBonus(),skill:setBonuses().skill});const before=stats();try{s.gear=[...previousGear.filter(x=>x.id!==g.id),g];s.equipped={...previousEquipped,[g.p]:g.id};return{before,after:stats()}}finally{s.gear=previousGear;s.equipped=previousEquipped}}
function masterworkRequirements(t){return [['스테이지',stageText(t.stage)+' 클리어',s.campaignCleared>=t.stage],['캐릭터','Lv.'+t.level,s.level>=t.level],['모루','Lv.'+t.forge,s.forgeLevel>=t.forge]].map(([label,value,ready])=>'<span class="'+(ready?'ready':'')+'"><small>'+label+'</small><b>'+(ready?'<ui-mark data-shape=check aria-hidden=true></ui-mark> ':'')+value+'</b></span>').join('')}
function masterworkScreen(){const i=masterworkTier,p=masterworkPart,t=MASTERWORKS[i],g=masterworkSample(i,p),preview=equipmentStatsPreview(g),worn=equippedItem(p),delta=gearValue(g)-gearValue(worn),block=masterworkBlock(i,p);return `<div class="masterwork-intro"><h2>모험으로 여는 명장 장비</h2><p>필요한 부위를 선택해 확정 제작하세요.</p></div><div class="masterwork-tiers">${MASTERWORKS.map((x,j)=>`<button class="${i===j?'active':''}${masterworkUnlocked(j)?'':' locked'}" onclick="selectMasterwork(${j})" aria-pressed="${i===j}">${gearArt(masterworkSample(j,0))}<b>${x.short}</b><small>${masterworkUnlocked(j)?'해금':lockMark()+' 잠김'}</small></button>`).join('')}</div><section class="masterwork-card" style="--masterwork-color:${t.color}"><div class="masterwork-hero">${gearArt(g)}<div><small>${t.name} · ${RAR[t.r]}</small><h3>${equipmentTitle(g)}</h3><span>${PARTS[p]} 슬롯 +${s.gearSlotLevels[p]} / +15</span></div></div><div class="masterwork-requirements">${masterworkRequirements(t)}</div><div class="masterwork-parts">${PARTS.map((name,j)=>j===0?'':`<button class="${j===p?'selected':''}" onclick="selectMasterworkPart(${j})" aria-pressed="${j===p}" aria-label="${t.names[j]} 선택">${gearArt(masterworkSample(i,j))}<small>${name}</small></button>`).join('')}</div><div class="masterwork-effect"><div><span>장비 효과</span><b>${compact(gearValue(g))}</b><small>현재 착용 대비 ${delta>=0?'+':'−'}${compact(Math.abs(delta))}</small></div><div><span>착용 후 공격력</span><b>${compact(preview.after.attack)}</b><small>현재 ${compact(preview.before.attack)}</small></div><div><span>착용 후 체력</span><b>${compact(preview.after.health)}</b><small>현재 ${compact(preview.before.health)}</small></div></div><p class="small">착용 후 공격속도 ${preview.after.speed.toFixed(2)}× · 치명타 ${(preview.after.critical*100).toFixed(1)}%</p><p class="small">명장 장비는 같은 등급·강화에서 기본 효과 +5%. 무기·장갑은 공격, 방어구는 체력, 신발은 공속, 장신구는 치명타가 오릅니다.</p><div class="masterwork-costs">${Object.entries(t.cost).map(([k,n])=>`<div class="${s[k]>=n?'enough':''}">${art(RESOURCE_ART[k])}<span>${RESOURCE_NAMES[k]}</span><b>${compact(n)}</b><small>보유 ${compact(s[k])}</small></div>`).join('')}</div>${button(block||'선택 장비 확정 제작',`animateMasterwork(${i},${p})`,!!block)}<p class="small masterwork-rules">제작당 모루 경험치 +1. 전 직업 공용이며 제작 즉시 잠깁니다.</p></section>${masterworkSetPanel(MASTERWORK_SET_OFFSET+i)}`}
SCREEN_TABS.forge.splice(1,0,['masterwork','명장 제작']);
const forgeScreenBeforeMasterworks=forgeScreen,gearPopupBeforeMasterworks=gearPopup;
forgeScreen=function(){return screenTab==='masterwork'?masterworkScreen():forgeScreenBeforeMasterworks()};
gearPopup=function(){const g=s.gear.find(x=>x.id===tab),t=masterworkDef(g);return (t?'<div class="masterwork-origin">명장 제작 · '+stageText(t.stage)+' 클리어 해금 · 기본 효과 +5%</div>':'')+gearPopupBeforeMasterworks()};

// The display shelf must obey the same cap while playing and after loading a save.
const SHOWCASE_CAP=1000,SHOWCASE_POINT_BONUS=.00003;
function showcaseBonus(){return (s.legacyShowcasePower||0)+Math.min(.21,s.showcase.reduce((sum,n)=>sum+n,0)*SHOWCASE_POINT_BONUS)}
showcasePopup=function(){
 const rows=PARTS.slice(1).map((name,p)=>{const i=p+1;return '<div class="showcase-part">'+art('gear'+i)+'<span>'+name+'</span><b>'+num(s.showcase[i])+'점</b></div>'}).join('');
 return '<div class="codex-heading"><h3>영구 공격력 +'+(showcaseBonus()*100).toFixed(3)+'%</h3><button class="muted-button" aria-label="진열장 안내" onclick="openMenu(\'showcaseHelp\')"><ui-mark data-shape=info aria-hidden=true></ui-mark></button></div>'+
  '<div class="showcase-parts">'+rows+'</div><div class="action-row">'+button('등록할 장비 선택','beginShowcasePicker()')+'</div>';
};
EXTRA_POPUPS.showcase=['장비 진열장',showcasePopup];
showcaseGear=function(id){return registerShowcase([id])>0};
showcaseConfirm=function(){
 const g=s.gear.find(item=>item.id===tab);if(!g)return '<p>장비가 없습니다.</p>';
 const points=Math.max(0,Math.min(g.r+1,SHOWCASE_CAP-s.showcase[g.p]));
 return '<div class="popup-hero">'+gearArt(g)+'<h3>'+equipmentTitle(g)+'</h3><p>'+(REGION_SETS[g.set]||'기본 장비')+' · 등록 시 장비 1개 소모</p><strong>영구 공격력 +'+(points*.003).toFixed(3)+'%</strong></div>'+
  '<div class="action-row">'+button('취소','closeMenu()',false,true)+button('확인 · 진열',"if(showcaseGear('"+g.id+"'))closeMenu()",!canShowcaseGear(g))+'</div>';
};
EXTRA_POPUPS.showcaseConfirm=['진열장 등록',showcaseConfirm];

for(const [index] of MASTERWORKS.entries()){
 registerGearAtlas('masterwork_'+index,'gear-masterwork-'+index,PARTS.length);
}
