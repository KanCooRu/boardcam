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
