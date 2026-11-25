/* Anvil awakening: the long growth track that opens with the Hard difficulty. */
'use strict';
// Each level multiplies final attack and health by 2%. Star iron comes from daily
// content, so the track keeps pace with play over many months.
const ANVIL_AWAKENING={max:300,stage:300,step:.02};
function awakeningLevel(state=s){return Math.floor(bounded(state?.anvilAwakening,0,ANVIL_AWAKENING.max))}
function awakeningBonus(level=awakeningLevel()){return Math.pow(1+ANVIL_AWAKENING.step,level)-1}
function awakeningCost(level=awakeningLevel()){return {starIron:60+6*level,stones:600+60*level}}
function awakeningOpen(){return s.campaignCleared>=ANVIL_AWAKENING.stage}
function awakeningBlock(){
 if(!awakeningOpen())return stageText(ANVIL_AWAKENING.stage)+' 클리어 후 열립니다';
 if(awakeningLevel()>=ANVIL_AWAKENING.max)return '최고 단계입니다';
 if(dungeonRun||forgeBusy)return '전투 도전·제작 완료 후 이용하세요';
 if(Object.entries(awakeningCost()).some(([key,amount])=>!(s[key]>=amount)))return '각성 재료가 부족합니다';
 return '';
}
function awakenAnvil(times=1){
 if(!Number.isInteger(times)||times<1)return false;
 const block=awakeningBlock();
 if(block){notice(block);return false}
 let done=0;
 while(done<times&&!awakeningBlock()){
  for(const [key,amount] of Object.entries(awakeningCost()))s[key]-=amount;
  s.anvilAwakening=awakeningLevel()+1;done++;
 }
 heroCurrentHp=Math.min(health(),Math.max(1,heroCurrentHp));
 recordPower();save();paint();if(activeScreen==='forge')renderScreen();
 playSound('forge');notice('모루 각성 Lv.'+awakeningLevel()+' · 공격력·체력 +'+awakeningPercent(awakeningBonus()));
 return true;
}
function awakeningPercent(value){return (value*100).toFixed(value<1?1:0)+'%'}
function awakeningScreen(){
 const level=awakeningLevel(),max=level>=ANVIL_AWAKENING.max,cost=awakeningCost(),block=awakeningBlock();
 const open=awakeningOpen(),next=Math.min(ANVIL_AWAKENING.max,level+1);
 const costs=Object.entries(cost).map(([key,amount])=>`<div class="${s[key]>=amount?'enough':''}">${art(RESOURCE_ART[key])}<span>${RESOURCE_NAMES[key]}</span><b>${max?'-':compact(amount)}</b><small>보유 ${compact(s[key])}</small></div>`).join('');
 return `<div class="masterwork-intro"><h2>모루 각성</h2><p>별철로 모루를 깨워 모든 직업의 공격력과 체력을 함께 올립니다.</p></div>
 <section class="masterwork-card awakening-card"><div class="masterwork-hero">${art('forgeIcon')}<div><small>전 직업 공용 · 영구 효과</small><h3>각성 Lv.${level} <span class="awakening-max">/ ${ANVIL_AWAKENING.max}</span></h3><span>공격력·체력 +${awakeningPercent(awakeningBonus(level))}</span></div></div>
 <progress class="pass-meter awakening-meter" max="${ANVIL_AWAKENING.max}" value="${level}" aria-label="모루 각성 단계"></progress>
 <div class="masterwork-requirements"><span class="${open?'ready':''}"><small>해금</small><b>${open?'<ui-mark data-shape=check aria-hidden=true></ui-mark> ':''}${stageText(ANVIL_AWAKENING.stage)} 클리어</b></span><span><small>단계당</small><b>최종 공격력·체력 ×${(1+ANVIL_AWAKENING.step).toFixed(2)}</b></span></div>
 <div class="masterwork-effect awakening-effect"><div><span>현재 효과</span><b>+${awakeningPercent(awakeningBonus(level))}</b><small>Lv.${level}</small></div><div><span>다음 단계</span><b>${max?'최고 단계':'+'+awakeningPercent(awakeningBonus(next))}</b><small>${max?'':'Lv.'+next}</small></div><div><span>현재 공격력</span><b>${compact(power())}</b><small>체력 ${compact(health())}</small></div></div>
 <div class="masterwork-costs awakening-costs">${costs}</div>
 <div class="action-row">${button(block||'각성 1단계','awakenAnvil(1)',!!block)}${button('10단계 연속','awakenAnvil(10)',!!block,true)}</div>
 <p class="small masterwork-rules">별철은 고대 무기고·오늘의 탑·임무·패스에서 얻습니다. 무기 강화와 같은 별철을 쓰므로 필요한 만큼 나누어 사용하세요.</p></section>`;
}
function normalizeAwakening(a){a.anvilAwakening=awakeningLevel(a);return a}
const starterBeforeAwakening=starter,migrateBeforeAwakening=migrate;
starter=function(){return normalizeAwakening(starterBeforeAwakening())};
migrate=function(data){return normalizeAwakening(migrateBeforeAwakening(data))};
const powerBeforeAwakening=power,healthBeforeAwakening=health;
power=function(){return Math.floor(powerBeforeAwakening()*(1+awakeningBonus()))};
health=function(){return Math.floor(healthBeforeAwakening()*(1+awakeningBonus()))};
SCREEN_TABS.forge.push(['awakening','모루 각성']);
const forgeScreenBeforeAwakening=forgeScreen;
forgeScreen=function(){return screenTab==='awakening'?awakeningScreen():forgeScreenBeforeAwakening()};
