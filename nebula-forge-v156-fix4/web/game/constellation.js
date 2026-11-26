/* Constellation engraving: the long growth track that opens with the Hard difficulty. */
'use strict';
// Each engraving multiplies final attack and health by 2%. Star iron comes from daily
// content, so the track keeps pace with play over many months.
const CONSTELLATION={max:300,stage:300,step:.02,perStar:20};
// Three figures of five stars. A star holds twenty engravings; a figure opens when the one
// before it is complete. Positions are percentages of the map: [name, left, top].
const CONSTELLATION_FIGURES=[
 {name:'여명의 기사 자리',plate:[50,94],stars:[['검 끝',20,85],['방패',38,75],['투구',58,84],['심장',76,73],['깃발',50,64]]},
 {name:'쌍검 자리',plate:[17,57],stars:[['왼 칼날',72,57],['오른 칼날',86,46],['손잡이',64,42],['칼자루 보석',48,52],['교차점',32,45]]},
 {name:'성운 왕관 자리',plate:[42,7],stars:[['첫째 보석',18,31],['둘째 보석',34,21],['중심 보석',52,29],['넷째 보석',70,18],['왕관의 별',84,27]]}
];
// Painted art for the map: the sky, one star medallion for each figure and the padlock.
// Set this to true once sky.webp, node-0.webp, node-1.webp, node-2.webp and lock.webp
// are in dist/client/assets/constellation/. Until then the map draws itself.
const CONSTELLATION_ART=false;
function constellationCore(f){return CONSTELLATION_ART?'<img src="./assets/constellation/node-'+f+'.webp" width="40" height="40" alt="">':'<ui-mark data-shape=spark aria-hidden=true></ui-mark>'}
function constellationPadlock(){return CONSTELLATION_ART?'<img src="./assets/constellation/lock.webp" width="26" height="26" alt="">':'<ui-mark data-shape=lock aria-hidden=true></ui-mark>'}
const CONSTELLATION_STARS=CONSTELLATION_FIGURES.flatMap((figure,f)=>figure.stars.map(([name,x,y])=>({name,x,y,figure:f})));
// Saves from the first release of this track stored the level as anvilAwakening.
function constellationLevel(state=s){return Math.floor(bounded(Math.max(Number(state?.constellation)||0,Number(state?.anvilAwakening)||0),0,CONSTELLATION.max))}
function constellationBonus(level=constellationLevel()){return Math.pow(1+CONSTELLATION.step,level)-1}
function constellationCost(level=constellationLevel()){return {starIron:60+6*level,stones:600+60*level}}
function constellationOpen(){return s.campaignCleared>=CONSTELLATION.stage}
// The per-star counts always add up to the level. A level the server lowered, or a save
// from before the map existed, is laid out again from the first star.
function constellationStars(state=s){
 const total=constellationLevel(state),cap=CONSTELLATION.perStar,count=CONSTELLATION_STARS.length;
 let stars=Array.from({length:count},(_,i)=>Math.floor(bounded(state.constellationStars?.[i],0,cap)));
 const sum=()=>stars.reduce((n,x)=>n+x,0);
 const ordered=stars.every((x,i)=>!x||CONSTELLATION_STARS[i].figure===0||
  stars.every((y,j)=>CONSTELLATION_STARS[j].figure!==CONSTELLATION_STARS[i].figure-1||y===cap));
 if(!ordered||sum()>total)stars=stars.map((_,i)=>Math.max(0,Math.min(cap,total-i*cap)));
 for(let i=0,left=total-sum();i<count&&left>0;i++){const add=Math.min(cap-stars[i],left);stars[i]+=add;left-=add}
 state.constellationStars=stars;return stars;
}
function constellationFigureCount(f,stars=constellationStars()){return stars.reduce((n,x,i)=>n+(CONSTELLATION_STARS[i].figure===f?x:0),0)}
function constellationFigureOpen(f,stars=constellationStars()){
 return constellationOpen()&&(f===0||constellationFigureCount(f-1,stars)===CONSTELLATION_FIGURES[f-1].stars.length*CONSTELLATION.perStar);
}
// Why a star cannot be touched yet, or '' when it can.
function constellationLockReason(i){
 const star=CONSTELLATION_STARS[i];
 if(!star)return '별을 선택하세요';
 if(!constellationOpen())return stageText(CONSTELLATION.stage)+'을 클리어하면 성좌 각인이 열립니다.';
 if(!constellationFigureOpen(star.figure))return '「'+CONSTELLATION_FIGURES[star.figure-1].name+'」의 별을 모두 밝히면 열립니다.';
 return '';
}
function constellationBlock(i=nextConstellationStar()){
 if(!constellationOpen())return constellationLockReason(0);
 if(constellationLevel()>=CONSTELLATION.max||i<0)return '모든 별을 밝혔습니다';
 const locked=constellationLockReason(i);
 if(locked)return locked;
 if(constellationStars()[i]>=CONSTELLATION.perStar)return '이 별은 모두 밝혔습니다';
 if(dungeonRun||forgeBusy)return '전투 도전·제작 완료 후 이용하세요';
 if(Object.entries(constellationCost()).some(([key,amount])=>!(s[key]>=amount)))return '각인 재료가 부족합니다';
 return '';
}
function nextConstellationStar(){
 const stars=constellationStars();
 return stars.findIndex((n,i)=>n<CONSTELLATION.perStar&&constellationFigureOpen(CONSTELLATION_STARS[i].figure,stars));
}
function engraveStar(i,times=1){
 if(!Number.isInteger(i)||!Number.isInteger(times)||times<1)return false;
 const block=constellationBlock(i);
 if(block){notice(block);return false}
 let done=0;
 while(done<times&&!constellationBlock(i)){
  for(const [key,amount] of Object.entries(constellationCost()))s[key]-=amount;
  constellationStars()[i]++;s.constellation=constellationLevel()+1;done++;
 }
 heroCurrentHp=Math.min(health(),Math.max(1,heroCurrentHp));
 recordPower();save();paint();if(activeScreen==='character')renderScreen();if(view==='starNode')render();
 playSound('reward');notice(CONSTELLATION_STARS[i].name+' '+constellationStars()[i]+' / '+CONSTELLATION.perStar+' · 공격력·체력 +'+constellationPercent(constellationBonus()));
 return true;
}
// Engraves the first unfinished star that is open.
function engraveConstellation(times=1){
 if(!Number.isInteger(times)||times<1)return false;
 let done=false;
 for(let left=times;left>0;left--){
  const i=nextConstellationStar();
  if(i<0||constellationBlock(i)){if(!done)notice(constellationBlock(i));break}
  if(!engraveStar(i,1))break;
  done=true;
 }
 return done;
}
function constellationPercent(value){return (value*100).toFixed(value<1?1:0)+'%'}
// A locked star or figure explains its condition instead of opening.
function tapConstellationStar(i){
 const locked=constellationLockReason(i);
 if(locked){openMenu('starLocked',locked);return false}
 openMenu('starNode',i);return true;
}
function tapConstellationFigure(f){
 const first=CONSTELLATION_STARS.findIndex(star=>star.figure===f),locked=constellationLockReason(first);
 if(locked){openMenu('starLocked',locked);return false}
 const stars=constellationStars(),open=CONSTELLATION_STARS.findIndex((star,i)=>star.figure===f&&stars[i]<CONSTELLATION.perStar);
 openMenu('starNode',open<0?first:open);return true;
}
function constellationCostHTML(cost,done){
 return Object.entries(cost).map(([key,amount])=>`<div class="${s[key]>=amount?'enough':''}">${art(RESOURCE_ART[key])}<span>${RESOURCE_NAMES[key]}</span><b>${done?'-':compact(amount)}</b><small>보유 ${compact(s[key])}</small></div>`).join('');
}
function constellationMap(){
 const stars=constellationStars(),cap=CONSTELLATION.perStar;
 const lines=CONSTELLATION_FIGURES.map((figure,f)=>{
  const open=constellationFigureOpen(f,stars),offset=CONSTELLATION_STARS.findIndex(star=>star.figure===f);
  return figure.stars.slice(1).map(([,x,y],k)=>{
   const [,px,py]=figure.stars[k],lit=stars[offset+k]>0&&stars[offset+k+1]>0;
   return `<line class="${!open?'locked':lit?'lit':''}" x1="${px}" y1="${py}" x2="${x}" y2="${y}"/>`;
  }).join('');
 }).join('');
 const plates=CONSTELLATION_FIGURES.map((figure,f)=>{
  const open=constellationFigureOpen(f,stars),have=constellationFigureCount(f,stars),all=figure.stars.length*cap;
  return `<button class="star-plate${open?'':' locked'}${have===all?' complete':''}" style="left:${figure.plate[0]}%;top:${figure.plate[1]}%" onclick="tapConstellationFigure(${f})" aria-label="${figure.name}, ${open?have+' / '+all:'잠김'}">${open?'':'<ui-mark data-shape=lock aria-hidden=true></ui-mark>'}<b>${figure.name}</b><small>${have} / ${all}</small></button>`;
 }).join('');
 const nodes=CONSTELLATION_STARS.map((star,i)=>{
  const open=constellationFigureOpen(star.figure,stars),n=stars[i];
  const state=!open?'locked':n>=cap?'full':n>0?'lit':'empty';
  return `<button class="star-node figure-${star.figure} ${state}" style="left:${star.x}%;top:${star.y}%" onclick="tapConstellationStar(${i})" aria-label="${star.name}, ${open?n+' / '+cap:'잠김'}"><i class="star-core" aria-hidden="true">${constellationCore(star.figure)}</i>${open?`<b>${n}</b>`:'<span class="star-lock" aria-hidden="true">'+constellationPadlock()+'</span>'}</button>`;
 }).join('');
 return `<div class="star-map${constellationOpen()?'':' closed'}${CONSTELLATION_ART?' painted':''}"><svg class="star-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">${lines}</svg>${plates}${nodes}</div>`;
}
function constellationScreen(){
 const level=constellationLevel(),max=level>=CONSTELLATION.max,block=constellationBlock();
 return `<div class="masterwork-intro constellation-intro"><h2>성좌 각인</h2><p>별을 눌러 별철로 밝히세요. 밝힌 만큼 모든 직업의 공격력과 체력이 함께 오릅니다.</p></div>
 <div class="constellation-summary"><div><span>밝힌 별빛</span><b>${level} / ${CONSTELLATION.max}</b></div><div><span>공격력·체력</span><b>+${constellationPercent(constellationBonus(level))}</b></div></div>
 ${constellationMap()}
 <div class="masterwork-costs constellation-costs">${constellationCostHTML(constellationCost(),max)}</div>
 <div class="action-row constellation-quick">${button(block||'다음 별 각인','engraveConstellation(1)',!!block)}${button('10회 연속','engraveConstellation(10)',!!block,true)}</div>
 <p class="small masterwork-rules">한 자리의 별을 모두 밝히면 다음 자리가 열립니다. 별철은 고대 무기고·오늘의 탑·임무·패스에서 얻습니다.</p>`;
}
function starNodePopup(){
 const i=Number(tab),star=CONSTELLATION_STARS[i];
 if(!Number.isInteger(i)||!star)return '<p>별을 선택하세요.</p>';
 const n=constellationStars()[i],cap=CONSTELLATION.perStar,done=n>=cap,level=constellationLevel(),block=constellationBlock(i);
 return `<div class="star-detail"><div class="star-node figure-${star.figure} ${done?'full':n>0?'lit':'empty'} star-detail-node" aria-hidden="true"><i class="star-core">${constellationCore(star.figure)}</i></div>
 <div><small>${CONSTELLATION_FIGURES[star.figure].name}</small><h3>${star.name}</h3><span>각인 ${n} / ${cap}</span></div></div>
 <progress class="pass-meter constellation-meter" max="${cap}" value="${n}" aria-label="이 별의 각인 수"></progress>
 <div class="masterwork-effect constellation-effect"><div><span>현재 효과</span><b>+${constellationPercent(constellationBonus(level))}</b><small>별빛 ${level}</small></div><div><span>각인 1회 후</span><b>${done||level>=CONSTELLATION.max?'-':'+'+constellationPercent(constellationBonus(level+1))}</b><small>공격력·체력</small></div></div>
 <div class="masterwork-costs constellation-costs">${constellationCostHTML(constellationCost(),done)}</div>
 <div class="action-row">${button(block||'1회 각인','engraveStar('+i+',1)',!!block)}${button('10회 연속','engraveStar('+i+',10)',!!block,true)}</div>`;
}
function starLockedPopup(){
 return `<div class="star-alert"><span class="star-lock" aria-hidden="true">${constellationPadlock()}</span><p>${safeText(tab)}</p></div><div class="action-row">${button('확인','closeMenu()')}</div>`;
}
EXTRA_POPUPS.starNode=['별 각인',starNodePopup];
EXTRA_POPUPS.starLocked=['알림',starLockedPopup];
function normalizeConstellation(a){a.constellation=constellationLevel(a);delete a.anvilAwakening;constellationStars(a);return a}
const starterBeforeConstellation=starter,migrateBeforeConstellation=migrate;
starter=function(){return normalizeConstellation(starterBeforeConstellation())};
migrate=function(data){return normalizeConstellation(migrateBeforeConstellation(data))};
const powerBeforeConstellation=power,healthBeforeConstellation=health;
power=function(){return Math.floor(powerBeforeConstellation()*(1+constellationBonus()))};
health=function(){return Math.floor(healthBeforeConstellation()*(1+constellationBonus()))};
SCREEN_TABS.character.push(['constellation','성좌']);
const characterScreenBeforeConstellation=characterScreen;
characterScreen=function(){return screenTab==='constellation'?constellationScreen():characterScreenBeforeConstellation()};
