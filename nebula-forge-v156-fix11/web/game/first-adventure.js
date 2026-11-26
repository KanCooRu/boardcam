'use strict';

const ADVENTURE_TERMS={
 '공격력':'평타와 공격 스킬의 피해를 계산할 때 사용하는 기본 수치입니다.',
 '모험 평타 초당 피해':'공격속도와 치명타 확률을 반영한 평타의 평균 피해입니다. 스킬 피해는 별도로 계산합니다.',
 '최대 체력':'전투에서 버틸 수 있는 피해량입니다. 스테이지를 클리어하면 체력을 회복합니다.',
 '공격속도':'평타 사이의 간격을 줄입니다. 2배속 버튼은 전투 진행 속도를 바꿉니다.',
 '골드 배율':'모험에서 몬스터를 처치할 때 받는 골드에 곱하는 값입니다.',
 '치명타 확률':'한 번의 공격이 치명타가 될 확률입니다. 10%라면 평균 열 번에 한 번입니다.',
 '치명타 피해':'치명타가 발생할 때 기본 피해에 더하는 비율입니다. +10%라면 100 피해가 110이 됩니다.',
 '방어 관통력':'대상의 방어 때문에 줄어드는 피해 일부를 되찾습니다. 방어가 있는 적에게 효과가 있습니다.',
 '방어력':'받는 피해를 줄입니다. 피해 감소율은 최대 40%입니다.',
 '슬롯 강화':'골드와 강화석을 써서 장비 부위를 강화합니다. 장비를 바꿔도 그 부위의 강화 단계가 유지됩니다.',
 '진열장 등록':'장비 1개를 소모해 영구 공격력을 얻습니다. 같은 부위·등급·세트는 한 번만 등록할 수 있습니다.',
 '무기 숙련':'전투와 오프라인 보상으로 숙련을 채웁니다. 모루의 무기 성장에서 원할 때 각인하세요. 확정한 단계는 되돌릴 수 없으며 다음 각인에서는 다른 속성도 고를 수 있습니다.'
};
const SCREEN_GUIDES={
 home:[['전투','일반 적을 눌러 공격 대상을 고릅니다. 하단 스킬은 아이콘을 눌러 직접 사용할 수 있습니다.'],['패배 후','일반 스테이지는 같은 곳의 1웨이브에서 재시작합니다. 보스 도전에 실패하면 이전 스테이지로 복귀합니다.']],
 character:[['능력','능력 수치를 누르면 뜻을 볼 수 있습니다. 강화 버튼에서 오를 수치와 필요한 골드를 확인하세요.'],['장비','가방에서 같은 부위의 착용 장비와 기본 능력을 비교합니다. 세트 효과는 장비 상세에서 확인하세요.'],['슬롯 강화',ADVENTURE_TERMS['슬롯 강화']],['진열장 등록',ADVENTURE_TERMS['진열장 등록']]],
 forge:[['장비 제작','성운석 1개로 장비 1개를 제작합니다. 결과에서 이름·등급·착용 여부를 확인할 수 있습니다.'],['무기 숙련',ADVENTURE_TERMS['무기 숙련']]],
 skills:[['장착','보유한 스킬을 빈 슬롯에 넣거나 추천 스킬을 누르세요. 3·4번 슬롯은 스테이지 3·7 도달 시 열립니다.'],['대상과 재사용','단일은 적 하나, 광역은 여러 적, 지원은 자신에게 적용됩니다. 아이콘의 숫자가 사라지면 다시 사용할 수 있습니다.']],
 dungeon:[['입장 전','던전을 고른 뒤 보상·추천 전투력과 남은 입장권을 확인하세요.'],['도전 중','전투를 그만두려면 포기를 누르세요. 던전마다 승리 조건과 입장권 소모 시점이 다릅니다.']],
 content:[['거점 개방','STAGE 40 클리어 후 길드·아레나·거점 상점이 열립니다. 월드보스와 레이드는 STAGE 50 클리어 후 열립니다.'],['성운의 상점','거점 활동으로 받은 전용 코인을 재료로 교환합니다. 코인별로 살 수 있는 상품이 다릅니다.']],
 shop:[['소환 순서','스킬 1회는 오늘의 무료 소환을 먼저 사용합니다. 이후 해당 횟수만큼 소환권이 있으면 소환권을 씁니다.'],['다이아 사용','사용할 다이아와 남을 수량을 확인하고 확정하세요. 취소하면 재화를 그대로 보유합니다.']]
};
function termButton(term,label=''){
 return `<button type="button" class="term-help" aria-label="${term} 설명" onclick="openMenu('termHelp','${term}')">${label}<i aria-hidden="true"><ui-mark data-shape=bang aria-hidden=true></ui-mark></i></button>`;
}
function statReading(term,value){
 return `<button class="stat-reading" type="button" aria-label="${term} ${value} 설명" onclick="openMenu('termHelp','${term}')"><small>${term} <i aria-hidden="true"><ui-mark data-shape=bang aria-hidden=true></ui-mark></i></small><b>${value}</b></button>`;
}
EXTRA_POPUPS.termHelp=['용어 안내',()=>`<section class="guide-reading"><h3>${safeText(tab)}</h3><p>${ADVENTURE_TERMS[tab]||''}</p></section>`];
function helpRows(rows){
 return rows.map(([title,description])=>`<details class="help-item"><summary>${title}</summary><p>${description}</p></details>`).join('');
}
infoPopup=function(){return helpRows(SCREEN_GUIDES[tab]||SCREEN_GUIDES.home)};
const supportBasics=supportPopup;
supportPopup=function(){
 const topics=[['모험', 'home'],['성장과 장비','character'],['모루','forge'],['스킬','skills'],['거점','content'],['던전','dungeon'],['상점','shop']];
 return topics.map(([title,key])=>`<details class="help-item"><summary>${title}</summary>${SCREEN_GUIDES[key].map(([name,line])=>`<p><b>${name}</b><br>${line}</p>`).join('')}</details>`).join('')+'<details class="help-item"><summary>능력치 사전</summary>'+helpRows(Object.entries(ADVENTURE_TERMS).slice(0,9))+'</details>'+supportBasics();
};
EXTRA_POPUPS.support=['도움말',supportPopup];

// Unlisted routes (including the diamond shop, packages and VIP) are available from the start.
// maxStage is the highest stage entered: clearing N advances the record to N+1.
const FEATURE_GATES={
 material:{stage:5,name:'재료 던전',go:()=>navigate('dungeon','challenges')},
 attendance:{stage:5,name:'출석',go:()=>openMenu('attendance')},
 relics:{stage:10,name:'유물',go:()=>navigate('character','relics')},
 pass:{stage:10,name:'성장 패스',go:()=>{passMode='growth';openMenu('pass')}},
 event:{stage:10,name:'모험의 선물',go:()=>openMenu('event')},
 pets:{stage:15,name:'동료와 동료 소환',go:()=>navigate('character','pets')},
 mine:{stage:15,name:'별의 광산',go:()=>navigate('dungeon','mine')},
 explore:{stage:20,name:'탐험',go:()=>navigate('dungeon','explore')},
 costume:{stage:20,name:'코스튬',go:()=>navigate('character','costume')},
 collection:{stage:20,name:'도감',go:()=>navigate('character','collection')},
 rush:{stage:30,name:'보스 러시',go:()=>openMenu('dungeonGuide','rush')},
 ranking:{stage:30,name:'랭킹',go:()=>openMenu('ranking')},
 haven:{stage:40,name:'거점',go:()=>navigate('content','town')},
 guild:{stage:40,name:'길드',go:()=>openTownPlace('guild')},
 arena:{stage:40,name:'아레나',go:()=>openTownPlace('arena')},
 havenShop:{stage:40,name:'거점 상점',go:()=>openTownPlace('havenShop')},
 worldBoss:{stage:50,name:'월드보스',go:()=>openTownPlace('raid')},
 partyRaid:{stage:50,name:'레이드',go:()=>openTownPlace('raidComing')},
 roulette:{stage:50,name:'이벤트 룰렛',go:()=>openMenu('royalEvent')},
 trial:{stage:50,name:'오늘의 탑',go:()=>openMenu('dungeonGuide','trial')}
};
const havenFeatures={guild:'guild',arena:'arena',havenShop:'havenShop',raid:'worldBoss',raidComing:'partyRaid'};
function featureForHavenPlace(id){return Object.hasOwn(havenFeatures,id)?havenFeatures[id]:''}
const HAVEN_UNLOCKS=Object.fromEntries(Object.entries(havenFeatures).map(([id,key])=>{
 const {stage,name}=FEATURE_GATES[key];return [id,[stage,name]];
}));
function featureStage(key){return Object.hasOwn(FEATURE_GATES,key)?FEATURE_GATES[key].stage:0}
function featureTestOverride(){return !!(TEST_TOOLS_ENABLED&&testSession&&s?.testOnly===true&&s.testUnlockAll===true)}
function featureOpen(key){
 const stage=featureStage(key);
 return !stage||(s?.maxStage||1)>stage||featureTestOverride();
}
function featureLockText(key){return 'STAGE '+featureStage(key)+' 클리어 시 열립니다'}
function guardFeature(key){
 if(featureOpen(key))return true;
 notice(featureLockText(key));return false;
}
function havenLocked(id){return !featureOpen(featureForHavenPlace(id))}
function canOpenHaven(id){return guardFeature(featureForHavenPlace(id))}
const adventureStarter=starter,adventureMigrate=migrate;
starter=function(){
 const a=adventureStarter();a.seenUnlocks={};a.testUnlockAll=false;return a;
};
migrate=function(raw){
 const a=adventureMigrate(raw);
 const seen=raw?.seenUnlocks,hasLedger=!!seen&&typeof seen==='object'&&!Array.isArray(seen);
 a.seenUnlocks={};
 for(const [key,feature] of Object.entries(FEATURE_GATES)){
  if(a.maxStage>feature.stage&&(!hasLedger||seen[key]===true))a.seenUnlocks[key]=true;
 }
 a.testUnlockAll=!!(TEST_TOOLS_ENABLED&&testSession&&a.testOnly===true&&raw?.testUnlockAll===true);
 return a;
};
let featureIntro=null;
function selectFeatureUnlock(key){
 if(featureIntro?.owner!==s||!featureIntro.keys.includes(key))return false;
 featureIntro.selected=key;
 const banner=$('featureUnlockBanner');
 for(const button of banner.querySelectorAll('[data-feature-choice]'))button.setAttribute('aria-pressed',String(button.dataset.featureChoice===key));
 return true;
}
function dismissFeatureUnlock(){
 if(featureIntro?.owner!==s)return false;
 featureIntro=null;$('featureUnlockBanner').hidden=true;updateAdventureUnlocks();return true;
}
function visitFeatureUnlock(){
 if(featureIntro?.owner!==s)return false;
 const key=featureIntro.selected;
 if(!guardFeature(key))return false;
 featureIntro=null;$('featureUnlockBanner').hidden=true;FEATURE_GATES[key].go();return true;
}
function updateAdventureUnlocks(){
 const banner=$('featureUnlockBanner');
 if(!banner||!s)return;
 if(featureIntro?.owner!==s)featureIntro=null;
 if(activeScreen!=='home'||view||dungeonRun||document.hidden||featureTestOverride()){
  banner.hidden=true;return;
 }
 if(!featureIntro){
  const keys=Object.keys(FEATURE_GATES).filter(key=>s.maxStage>featureStage(key)&&
   !s.seenUnlocks[key]&&(key!=='trial'||Object.hasOwn(DUNGEON_BANNERS,'trial')));
  if(!keys.length){banner.hidden=true;return}
  const group=keys.filter(key=>featureStage(key)===featureStage(keys[0]));
  featureIntro={owner:s,keys:group,selected:group[0]};
  const names=group.map((key,i)=>`<button type="button" class="feature-unlock-name" data-feature-choice="${key}" aria-pressed="${i===0}" onclick="selectFeatureUnlock('${key}')">${FEATURE_GATES[key].name}</button>`).join('');
  banner.innerHTML='<div class="feature-unlock-names"><strong>새 기능:</strong>'+names+'</div>'+
   '<button type="button" class="gold-button feature-unlock-go" onclick="visitFeatureUnlock()">가 보기</button>'+
   '<button type="button" class="feature-unlock-close" aria-label="새 기능 안내 닫기" onclick="dismissFeatureUnlock()"><ui-mark data-shape=close aria-hidden=true></ui-mark></button>';
  for(const key of group)s.seenUnlocks[key]=true;
  save();
  if(typeof paintFeatureLocks==='function')paintFeatureLocks();
 }
 banner.hidden=false;
}

let defeatHelp=null;
function offerDefeatHelp(stage,boss=false){
 if(defeatHelp?.owner===s&&defeatHelp.stage===stage)return;
 defeatHelp={owner:s,stage,boss,visible:true};
 paintJourneyPanel();
}
function defeatHelpHTML(){
 if(!defeatHelp?.visible||defeatHelp.owner!==s)return '';
 if(s.stage!==defeatHelp.stage&&(!defeatHelp.boss||s.stage!==defeatHelp.stage-1)){defeatHelp=null;return ''}
 return '<div class="defeat-help"><strong>'+ (defeatHelp.boss?'보스 패배 · 이전 스테이지로 복귀':'전투 패배 · 1웨이브부터 재시작')+'</strong><nav aria-label="패배 후 성장">'+
  [['growth','강화'],['equipment','장비'],['skills','스킬']].map(([key,label])=>'<button onclick="closeDefeatHelp(\''+key+'\')">'+label+'</button>').join('')+
  '<button onclick="closeDefeatHelp()" aria-label="패배 안내 닫기"><ui-mark data-shape=close aria-hidden=true></ui-mark></button></nav></div>';
}
function closeDefeatHelp(route){
 if(defeatHelp)defeatHelp.visible=false;
 if(route==='skills')navigate('skills','library');
 else if(route)navigate('character',route);
 paintJourneyPanel();
}

const CLASS_APPROACH={
 warrior:'대검으로 적 하나를 강타하고, 적이 모이면 지면을 갈라 함께 공격합니다.',
 shadow:'쌍단검 연격에 치명타를 노립니다. 체력이 낮아진 적은 암살로 마무리할 수 있습니다.',
 paladin:'철퇴로 공격하면서 방패로 피해를 줄이고 체력을 회복합니다.',
 mage:'지팡이와 마도서로 여러 적에게 주문을 펼칩니다. 냉기로 공격을 약화하고 화상으로 피해를 이어갑니다.',
 archer:'활로 빠르게 평타를 쏘고, 단일 연사와 여러 적을 맞히는 화살비를 골라 씁니다.'
};
function classSkillIntroduction(job){
 const ids=classSkillIds(job);
 const skill=k=>`<button type="button" onclick="inspectClassSkill(this,${k})" aria-pressed="false">${skillArt(k)}<small>${SK[k][0]}</small></button>`;
 return '<section class="class-skill-intro"><div class="class-skill-preview">'+ids.slice(0,4).map(skill).join('')+'</div>'+
 '<details class="extra-class-skills"><summary>직업 스킬 전체 보기</summary><div class="class-skill-preview">'+ids.slice(4).map(skill).join('')+'</div></details><p class="class-skill-readout" aria-live="polite">스킬을 눌러 대상과 효과를 확인하세요.</p></section>';
}
function inspectClassSkill(button,k){
 const panel=button.closest('.class-skill-intro');
 for(const item of panel.querySelectorAll('button'))item.setAttribute('aria-pressed',String(item===button));
 const rule=SKILL_RULES[k];
 panel.querySelector('.class-skill-readout').innerHTML='<b>'+SK[k][0]+' · '+skillRoleLabel(k)+'</b><span>'+CLASS_SKILLS[k][5]+'</span><small>재사용 '+rule.cd+'초'+(skillMeta(k).target==='self'?'':' · '+rule.hits+'회 타격')+'</small>';
}

let diamondRequest=null,lastDiamondPointer=null;
document.addEventListener('pointerdown',event=>{lastDiamondPointer={x:event.clientX,y:event.clientY,at:performance.now()}},{passive:true});

function spendContext(){return [activeScreen,screenTab,view,tab,shopSummonKind].join('|')}
function transactionAttrs(disabled=false){
 if(disabled)return 'data-server-transaction disabled';
 return saveGuard.canTransact(true)?'data-server-transaction':'data-server-transaction data-server-was-enabled disabled';
}
function paintTransactionControls(root=document){
 const offline=!saveGuard.canTransact(true);
 for(const [scopeId,statusId] of [['screenContent','screenTransactionStatus'],['content','popupTransactionStatus'],['diamondConfirm','diamondTransactionStatus']]){
  if(root!==document&&root.id!==scopeId)continue;
  const scope=$(scopeId),status=$(statusId);
  if(!scope||!status)continue;
  const buttons=scope.querySelectorAll('[data-server-transaction]');
  for(const control of buttons){
   if(offline&&!control.disabled){
    control.dataset.serverWasEnabled='';control.disabled=true;
   }else if(!offline&&control.dataset.serverWasEnabled!==undefined){
    delete control.dataset.serverWasEnabled;control.disabled=false;
   }
  }
  status.hidden=!offline||buttons.length===0;
  if(!status.hidden)status.textContent=saveGuard.transactionMessage();
 }
}
function askDiamondUse(label,cost,onAccept){
 if(diamondRequest||!saveGuard.canTransact()||!(cost>0)||s.gems<cost)return false;
 const dialog=$('diamondConfirm');
 diamondRequest={owner:s,context:spendContext(),cost,onAccept};
 $('diamondPurpose').textContent=label;
 $('diamondCost').textContent='다이아 '+num(cost)+'개 사용';
 $('diamondBalance').textContent='보유 '+num(s.gems)+'개 → 사용 후 '+num(s.gems-cost)+'개';
 const opener=document.activeElement;
 const origin=opener?.getBoundingClientRect?.();
 dialog.classList.remove('confirm-first');
 dialog.showModal();
 paintTransactionControls(dialog);
 // Put confirmation on the opposite side if the invoking control overlaps it.
 const confirm=dialog.querySelector('.gold-button').getBoundingClientRect();
 const point=lastDiamondPointer;
 const recent=point&&performance.now()-point.at<800;
 const overlaps=recent?point.x>=confirm.left&&point.x<=confirm.right&&point.y>=confirm.top&&point.y<=confirm.bottom:
  origin&&origin.left<confirm.right&&origin.right>confirm.left&&origin.top<confirm.bottom&&origin.bottom>confirm.top;
 if(overlaps)
  dialog.classList.add('confirm-first');
 return true;
}
function cancelDiamondUse(){
 diamondRequest=null;
 if($('diamondConfirm').open)$('diamondConfirm').close();
}
function acceptDiamondUse(event){
 if(event?.detail>1)return false;
 const request=diamondRequest;cancelDiamondUse();
 if(!request||document.hidden||request.owner!==s||request.context!==spendContext()||s.gems<request.cost||!saveGuard.canTransact())return false;
 return request.onAccept();
}

function featureControlKey(button){
 const data=button.dataset;
 if(button.classList.contains('realm-info'))return '';
 if(data.feature)return data.feature;
 if(data.screen)return featureForScreen(data.screen);
 if(data.channel==='guild')return 'guild';
 if(data.wheel!==undefined)return 'roulette';
 const action=button.getAttribute('onclick')||'';
 const route=action.match(/\b(navigate|openMenu|switchScreenTab|openTownPlace|selectShopSummon|openShopSummons|playerMissionGo|openDungeonContent)\(\s*['"](\w+)['"](?:\s*,\s*['"](\w+)['"])?/);
 if(!route)return '';
 const [,command,key,sub]=route;
 switch(command){
  case 'navigate': return featureForScreen(key,sub);
  case 'openMenu': return featureForMenu(key,sub);
  case 'switchScreenTab': return featureForScreen(activeScreen,key);
  case 'openTownPlace': return featureForHavenPlace(key);
  case 'playerMissionGo': return featureForMission(key);
  case 'openDungeonContent': return featureForDungeon(key);
  default: return key==='pet'?'pets':'';
 }
}
// One padlock for every locked control. The painted padlock replaces the line mark once the
// constellation art (CONSTELLATION_ART) is installed.
function lockMark(){
 return typeof CONSTELLATION_ART!=='undefined'&&CONSTELLATION_ART?
  '<img class="lock-art" src="./assets/constellation/lock.webp" width="26" height="26" alt="">':
  '<ui-mark data-shape="lock" aria-hidden="true"></ui-mark>';
}
function paintFeatureLocks(root=document){
 if(!s)return;
 const buttons=root.querySelectorAll('button[onclick],button[data-feature],button[data-channel],button[data-wheel]');
 for(const button of buttons){
  const key=featureControlKey(button),locked=key&&!featureOpen(key);
  if(!locked&&!button.dataset.featureLocked)continue;
  let badge=button.querySelector('.feature-lock-badge');
  if(locked){
   if(!badge){
    badge=document.createElement('span');badge.className='feature-lock-badge';
    badge.setAttribute('aria-hidden','true');
    (button.querySelector('.town-nameplate')||button).append(badge);
   }
   if(button.dataset.featureLocked!==key||!badge.textContent){
    const stage=featureStage(key);
    badge.innerHTML=lockMark()+'STAGE '+stage;
    button.dataset.featureLocked=key;
    button.setAttribute('aria-description','STAGE '+stage+' 클리어 시 열립니다');
   }
   if(button.disabled){button.dataset.featureDisabled='true';button.disabled=false}
  }else{
   badge?.remove();delete button.dataset.featureLocked;button.removeAttribute('aria-description');
   if(button.dataset.featureDisabled){delete button.dataset.featureDisabled;button.disabled=true}
  }
 }
}
