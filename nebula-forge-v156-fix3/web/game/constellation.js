/* Constellation engraving: the long growth track that opens with the Hard difficulty. */
'use strict';
// Each star multiplies final attack and health by 2%. Star iron comes from daily
// content, so the track keeps pace with play over many months.
const CONSTELLATION={max:300,stage:300,step:.02};
// Saves from the first release of this track stored the level as anvilAwakening.
function constellationLevel(state=s){return Math.floor(bounded(Math.max(Number(state?.constellation)||0,Number(state?.anvilAwakening)||0),0,CONSTELLATION.max))}
function constellationBonus(level=constellationLevel()){return Math.pow(1+CONSTELLATION.step,level)-1}
function constellationCost(level=constellationLevel()){return {starIron:60+6*level,stones:600+60*level}}
function constellationOpen(){return s.campaignCleared>=CONSTELLATION.stage}
function constellationBlock(){
 if(!constellationOpen())return stageText(CONSTELLATION.stage)+' 클리어 후 열립니다';
 if(constellationLevel()>=CONSTELLATION.max)return '모든 별을 밝혔습니다';
 if(dungeonRun||forgeBusy)return '전투 도전·제작 완료 후 이용하세요';
 if(Object.entries(constellationCost()).some(([key,amount])=>!(s[key]>=amount)))return '각인 재료가 부족합니다';
 return '';
}
function engraveConstellation(times=1){
 if(!Number.isInteger(times)||times<1)return false;
 const block=constellationBlock();
 if(block){notice(block);return false}
 let done=0;
 while(done<times&&!constellationBlock()){
  for(const [key,amount] of Object.entries(constellationCost()))s[key]-=amount;
  s.constellation=constellationLevel()+1;done++;
 }
 heroCurrentHp=Math.min(health(),Math.max(1,heroCurrentHp));
 recordPower();save();paint();if(activeScreen==='character')renderScreen();
 playSound('reward');notice('성좌 각인 '+constellationLevel()+'번째 별 · 공격력·체력 +'+constellationPercent(constellationBonus()));
 return true;
}
function constellationPercent(value){return (value*100).toFixed(value<1?1:0)+'%'}
function constellationScreen(){
 const level=constellationLevel(),max=level>=CONSTELLATION.max,cost=constellationCost(),block=constellationBlock();
 const open=constellationOpen(),next=Math.min(CONSTELLATION.max,level+1);
 const costs=Object.entries(cost).map(([key,amount])=>`<div class="${s[key]>=amount?'enough':''}">${art(RESOURCE_ART[key])}<span>${RESOURCE_NAMES[key]}</span><b>${max?'-':compact(amount)}</b><small>보유 ${compact(s[key])}</small></div>`).join('');
 return `<div class="masterwork-intro"><h2>성좌 각인</h2><p>별철로 밤하늘의 별을 하나씩 밝혀 모든 직업의 공격력과 체력을 함께 올립니다.</p></div>
 <section class="masterwork-card constellation-card"><div class="masterwork-hero">${art('growthEmblem','constellation-emblem')}<div><small>전 직업 공용 · 영구 효과</small><h3>밝힌 별 ${level} <span class="constellation-max">/ ${CONSTELLATION.max}</span></h3><span>공격력·체력 +${constellationPercent(constellationBonus(level))}</span></div></div>
 <progress class="pass-meter constellation-meter" max="${CONSTELLATION.max}" value="${level}" aria-label="밝힌 별의 수"></progress>
 <div class="masterwork-requirements"><span class="${open?'ready':''}"><small>해금</small><b>${open?'<ui-mark data-shape=check aria-hidden=true></ui-mark> ':''}${stageText(CONSTELLATION.stage)} 클리어</b></span><span><small>별 하나당</small><b>최종 공격력·체력 ×${(1+CONSTELLATION.step).toFixed(2)}</b></span></div>
 <div class="masterwork-effect constellation-effect"><div><span>현재 효과</span><b>+${constellationPercent(constellationBonus(level))}</b><small>별 ${level}개</small></div><div><span>다음 별</span><b>${max?'완성':'+'+constellationPercent(constellationBonus(next))}</b><small>${max?'':'별 '+next+'개'}</small></div><div><span>현재 공격력</span><b>${compact(power())}</b><small>체력 ${compact(health())}</small></div></div>
 <div class="masterwork-costs constellation-costs">${costs}</div>
 <div class="action-row">${button(block||'별 1개 각인','engraveConstellation(1)',!!block)}${button('10개 연속','engraveConstellation(10)',!!block,true)}</div>
 <p class="small masterwork-rules">별철은 고대 무기고·오늘의 탑·임무·패스에서 얻습니다. 무기 강화와 같은 별철을 쓰므로 필요한 만큼 나누어 사용하세요.</p></section>`;
}
function normalizeConstellation(a){a.constellation=constellationLevel(a);delete a.anvilAwakening;return a}
const starterBeforeConstellation=starter,migrateBeforeConstellation=migrate;
starter=function(){return normalizeConstellation(starterBeforeConstellation())};
migrate=function(data){return normalizeConstellation(migrateBeforeConstellation(data))};
const powerBeforeConstellation=power,healthBeforeConstellation=health;
power=function(){return Math.floor(powerBeforeConstellation()*(1+constellationBonus()))};
health=function(){return Math.floor(healthBeforeConstellation()*(1+constellationBonus()))};
SCREEN_TABS.character.push(['constellation','성좌']);
const characterScreenBeforeConstellation=characterScreen;
characterScreen=function(){return screenTab==='constellation'?constellationScreen():characterScreenBeforeConstellation()};
