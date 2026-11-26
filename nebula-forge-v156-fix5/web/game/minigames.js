/* Two daily minigames: the smelting furnace and the companion formation board. */
'use strict';
// Both are settled by the reward rule (economyClaimRule), so the server rolls the furnace
// and replays the board itself. Their daily records live in the server-kept claim ledger.
const MINIGAME_GATES={furnace:20,petBoard:30};
// Painted art for the minigames. Set this to true once the nine files of work order A9
// are in dist/client/assets/minigames/. Until then the screens show no pictures.
const MINIGAME_ART=false;
function minigameArt(name,cls,width,height){return MINIGAME_ART?'<img class="'+cls+'" src="./assets/minigames/'+name+'.webp" width="'+width+'" height="'+height+'" alt="">':''}
function minigameOpen(key,state=s){return state.maxStage>MINIGAME_GATES[key]}
function minigameLockText(key){return stageText(MINIGAME_GATES[key])+'을 클리어하면 열립니다.'}
// Reading never writes: the device must not alter the ledger outside a settled action.
function minigamePeek(key,state=s,day=today()){
 const row=state.economyClaims?.[key];
 return row?.day===day?row:key==='furnace'?{day,runs:0,run:null}:{day,cleared:[]};
}
function minigameBook(state,key,day){
 const ledger=initializeEconomyClaims(state);
 if(ledger[key]?.day!==day)ledger[key]=key==='furnace'?{day,runs:0,run:null}:{day,cleared:[]};
 return ledger[key];
}

// ---------- Smelting furnace ----------
// Add ore, watch the heat, take the ingot out before the furnace overheats. Nothing is staked:
// entries are free, and an overheated run still pays half its purity.
const FURNACE={runs:3,limit:100,coolant:15,
 pieces:{small:{name:'작은 덩이',heat:[8,14],purity:2},large:{name:'큰 덩이',heat:[16,26],purity:5}}};
function furnaceRewards(purity,burst){
 const kept=burst?Math.floor(purity/2):purity,rewards={};
 if(kept>=3)rewards.starIron=Math.floor(kept/3);
 if(kept>0)rewards.stones=kept*10;
 return rewards;
}
function furnaceRule(state,op,random,day){
 if(!minigameOpen('furnace',state))throw Error(minigameLockText('furnace'));
 const book=minigameBook(state,'furnace',day),run=book.run;
 const view=(extra={})=>({op,heat:book.run.heat,purity:book.run.purity,runs:book.runs,...extra});
 if(op==='start'){
  if(run)throw Error('진행 중인 제련을 먼저 끝내세요.');
  if(book.runs>=FURNACE.runs)throw Error('오늘의 제련을 모두 마쳤습니다.');
  book.runs++;book.run={heat:0,purity:0,count:0,cooled:false};
  return {rewards:{},furnace:view()};
 }
 if(!run)throw Error('제련을 먼저 시작하세요.');
 if(op==='cool'){
  if(run.cooled)throw Error('냉각수는 한 판에 한 번만 쓸 수 있습니다.');
  run.cooled=true;run.heat=Math.max(0,run.heat-FURNACE.coolant);
  return {rewards:{},furnace:view()};
 }
 if(op==='take'){
  if(!run.count)throw Error('덩이를 하나 이상 넣은 뒤 꺼낼 수 있습니다.');
  const rewards=furnaceRewards(run.purity,false);book.run=null;
  return {rewards,furnace:{op,heat:run.heat,purity:run.purity,runs:book.runs,ended:true}};
 }
 const piece=Object.hasOwn(FURNACE.pieces,op)?FURNACE.pieces[op]:null;
 if(!piece)throw Error('등록되지 않은 제련 동작입니다.');
 const [low,high]=piece.heat,rolled=low+Math.floor(random()*(high-low+1));
 run.heat+=rolled;run.purity+=piece.purity;run.count++;
 if(run.heat<=FURNACE.limit)return {rewards:{},furnace:view({rolled})};
 const rewards=furnaceRewards(run.purity,true);book.run=null;
 return {rewards,furnace:{op,rolled,heat:run.heat,purity:run.purity,runs:book.runs,burst:true,ended:true}};
}

// ---------- Companion formation board ----------
// A puzzle without dice: both sides are fully shown, and the same formation always ends the same way.
const BOARD_ROLES={
 guard:{name:'방패',hp:60,atk:6,tip:'같은 줄 맨 앞의 적을 공격. 체력이 높다'},
 striker:{name:'돌격',hp:30,atk:14,tip:'같은 줄 맨 앞의 적을 강하게 공격'},
 piercer:{name:'관통',hp:26,atk:8,tip:'같은 줄의 적을 모두 공격'},
 blast:{name:'폭발',hp:24,atk:7,tip:'세 줄 맨 앞의 적을 한꺼번에 공격'},
 sniper:{name:'저격',hp:22,atk:12,tip:'같은 줄 맨 뒤의 적을 공격'},
 healer:{name:'치유',hp:28,atk:8,tip:'가장 다친 아군을 회복'}
};
// One role for each of the twelve companions, by companion number.
const BOARD_PET_ROLES=['blast','sniper','healer','striker','sniper','piercer','guard','guard','striker','striker','healer','piercer'];
const BOARD_FOES={
 guard:{name:'방어형',hp:70,atk:5,art:'creature_2_0',act:'guard'},
 striker:{name:'돌격형',hp:34,atk:13,art:'creature_1_1',act:'striker'},
 healer:{name:'회복형',hp:30,atk:7,art:'creature_1_2',act:'healer'}
};
const BOARD_STAGES=[
 {loans:3,foes:['guard','striker','striker','guard'],share:.30,rewards:{starIron:5,petShards:4}},
 {loans:3,foes:['guard','guard','striker','striker','healer'],share:.10,rewards:{starIron:8,petShards:6}},
 {loans:4,foes:['guard','guard','striker','striker','healer','healer'],share:.03,rewards:{starIron:12,petShards:10,gems:30}}
];
const BOARD_ROUNDS=12,BOARD_SAMPLES=60;
function boardSeed(text){let hash=2166136261;for(const c of text)hash=Math.imul(hash^c.charCodeAt(0),16777619)>>>0;return hash}
function boardRandom(seed){let x=seed||1;return ()=>{x=(Math.imul(x,1664525)+1013904223)>>>0;return x/4294967296}}
function boardShuffle(list,random){const a=[...list];for(let i=a.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
// cell = row*3 + column; column 0 is the front line of either side.
function boardUnit(cell,role,stats,side){return {cell,row:Math.floor(cell/3),col:cell%3,role,side,hp:stats.hp,max:stats.hp,atk:stats.atk}}
function boardTargets(unit,foes,friends){
 const alive=foes.filter(x=>x.hp>0);
 if(unit.role==='healer'){
  const hurt=friends.filter(x=>x.hp>0&&x.hp<x.max).sort((a,b)=>a.hp/a.max-b.hp/b.max||a.cell-b.cell)[0];
  return hurt?[hurt]:[];
 }
 if(!alive.length)return [];
 const rows=[0,1,2].sort((a,b)=>Math.abs(a-unit.row)-Math.abs(b-unit.row)||a-b);
 const inRow=row=>alive.filter(x=>x.row===row).sort((a,b)=>a.col-b.col);
 if(unit.role==='blast')return [0,1,2].map(row=>inRow(row)[0]).filter(Boolean);
 const line=inRow(rows.find(row=>inRow(row).length));
 if(unit.role==='piercer')return line;
 return [unit.role==='sniper'?line.at(-1):line[0]];
}
// Allies act first each round, each side from its lowest cell number upward.
function boardBattle(allies,foes,record=false){
 const a=allies.map(u=>({...u})),f=foes.map(u=>({...u})),log=[];
 const order=[...a].sort((x,y)=>x.cell-y.cell).concat([...f].sort((x,y)=>x.cell-y.cell));
 let rounds=0;
 while(rounds<BOARD_ROUNDS&&a.some(u=>u.hp>0)&&f.some(u=>u.hp>0)){
  rounds++;
  for(const unit of order){
   if(unit.hp<=0)continue;
   const mine=unit.side==='ally'?a:f,theirs=unit.side==='ally'?f:a;
   const targets=boardTargets(unit,theirs,mine);
   if(!targets.length)continue;
   for(const target of targets)target.hp=unit.role==='healer'?Math.min(target.max,target.hp+unit.atk):Math.max(0,target.hp-unit.atk);
   if(record)log.push({round:rounds,side:unit.side,from:unit.cell,heal:unit.role==='healer',to:targets.map(t=>t.cell),
    ally:a.map(u=>u.hp),foe:f.map(u=>u.hp)});
   if(!f.some(u=>u.hp>0)||!a.some(u=>u.hp>0))break;
  }
 }
 return {win:!f.some(u=>u.hp>0)&&a.some(u=>u.hp>0),rounds,log};
}
const boardStageCache=new Map();
// The day's stage: its lent companions, the enemy formation, and an enemy toughness chosen so that
// the stated share of formations built from the lent companions alone can win.
function boardStage(dayKey,n){
 const key=dayKey+'|'+n;
 if(boardStageCache.has(key))return boardStageCache.get(key);
 const spec=BOARD_STAGES[n],random=boardRandom(boardSeed('board|'+key));
 // Lent companions: one front-liner first, and never more than one healer, so they can always deal damage.
 const front=boardShuffle(BOARD_PET_ROLES.map((role,i)=>i).filter(i=>['guard','striker'].includes(BOARD_PET_ROLES[i])),random);
 const loans=[front[0]];
 for(const pet of boardShuffle(BOARD_PET_ROLES.map((role,i)=>i).filter(i=>i!==front[0]),random)){
  if(loans.length>=spec.loans)break;
  if(BOARD_PET_ROLES[pet]==='healer'&&loans.some(i=>BOARD_PET_ROLES[i]==='healer'))continue;
  loans.push(pet);
 }
 // Chosen cells are ordered rear to front: healers take the rearmost, guards the foremost.
 const cells=boardShuffle([0,1,2,3,4,5,6,7,8],random).slice(0,spec.foes.length).sort((x,y)=>y%3-x%3||x-y);
 const rank={healer:0,striker:1,guard:2},kinds=[...spec.foes].sort((x,y)=>rank[x]-rank[y]);
 const layout=cells.map((cell,i)=>({cell,kind:kinds[i]}));
 const samples=Array.from({length:BOARD_SAMPLES},()=>boardShuffle([0,1,2,3,4,5,6,7,8],random).slice(0,spec.loans));
 const foesAt=scale=>layout.map(({cell,kind})=>{
  const foe=BOARD_FOES[kind];return boardUnit(cell,foe.act,{hp:Math.round(foe.hp*scale),atk:foe.atk},'foe');
 });
 const wins=scale=>{
  const foes=foesAt(scale);
  return samples.filter(place=>boardBattle(place.map((cell,i)=>boardUnit(cell,BOARD_PET_ROLES[loans[i]],BOARD_ROLES[BOARD_PET_ROLES[loans[i]]],'ally')),foes).win).length;
 };
 const need=Math.max(2,Math.ceil(BOARD_SAMPLES*spec.share));
 // The toughest setting that still leaves the wanted share of winning formations; failing that,
 // the toughest one that can be won at all.
 let scale=.3,fallback=0;
 for(const tried of [2.4,2.1,1.8,1.6,1.4,1.25,1.1,1,.9,.8,.7,.6,.5,.4]){
  const won=wins(tried);
  if(won>=need){scale=tried;fallback=0;break}
  if(won>0&&!fallback)fallback=tried;
 }
 if(fallback)scale=fallback;
 const stage={day:dayKey,n,loans,limit:spec.loans+1,scale,rewards:spec.rewards,
  foes:layout.map(({cell,kind})=>({cell,kind,hp:Math.round(BOARD_FOES[kind].hp*scale),atk:BOARD_FOES[kind].atk}))};
 if(boardStageCache.size>12)boardStageCache.clear();
 boardStageCache.set(key,stage);return stage;
}
// A formation is nine cells: '-' empty, 'l2' the third lent companion, 'p7' the player's own companion 7.
function boardFormation(stage,cells,state=s){
 if(!Array.isArray(cells)||cells.length!==9)throw Error('배치를 확인하세요.');
 const used=new Set(),allies=[];
 cells.forEach((code,cell)=>{
  if(code==='-')return;
  const match=/^([lp])(\d{1,2})$/.exec(code),index=match?Number(match[2]):-1;
  const pet=match?.[1]==='l'?stage.loans[index]:match?.[1]==='p'&&state.pets?.[index]>0?index:undefined;
  if(pet===undefined||used.has(code))throw Error('배치할 수 없는 동료가 있습니다.');
  used.add(code);allies.push(boardUnit(cell,BOARD_PET_ROLES[pet],BOARD_ROLES[BOARD_PET_ROLES[pet]],'ally'));
 });
 if(!allies.length||allies.length>stage.limit)throw Error('동료는 1마리 이상 '+stage.limit+'마리까지 배치합니다.');
 return allies;
}
function boardFoes(stage){return stage.foes.map(foe=>boardUnit(foe.cell,BOARD_FOES[foe.kind].act,foe,'foe'))}
function boardRule(state,id,day){
 if(!minigameOpen('petBoard',state))throw Error(minigameLockText('petBoard'));
 const [stamp,number,layout]=String(id).split('/'),n=Number(number);
 if(stamp!==day)throw Error('날짜가 바뀌었습니다. 오늘의 배치전을 다시 여세요.');
 if(!Number.isInteger(n)||!BOARD_STAGES[n]||typeof layout!=='string')throw Error('배치를 확인하세요.');
 const book=minigameBook(state,'petBoard',day);
 if(book.cleared.includes(n))rejectEconomyClaim();
 const stage=boardStage(day,n),result=boardBattle(boardFormation(stage,layout.split('.'),state),boardFoes(stage));
 if(!result.win)throw Error('이 배치로는 이기지 못합니다. 자리를 바꿔 보세요.');
 book.cleared.push(n);book.cleared.sort();
 return {rewards:{...stage.rewards},board:{n,rounds:result.rounds}};
}

// ---------- Screens ----------
let miniView='hub',furnaceBusy=false,furnaceNote='';
const boardDraft={day:'',n:0,cells:Array(9).fill('-'),pick:'',playing:null,timer:0};
function openMinigame(key){
 if(!minigameOpen(key)){openMenu('starLocked',minigameLockText(key));return false}
 miniView=key;renderScreen(false);return true;
}
function closeMinigame(){stopBoardPlayback();miniView='hub';renderScreen(false)}
function minigameHub(){
 const furnace=minigamePeek('furnace'),board=minigamePeek('petBoard');
 const card=(key,title,copy,status,label)=>{
  const open=minigameOpen(key);
  return `<section class="mini-card${open?'':' locked'}${MINIGAME_ART?' painted':''}">${minigameArt(key==='furnace'?'hub-furnace':'hub-board','mini-thumb',64,64)}<div><h3>${open?'':'<ui-mark data-shape=lock aria-hidden=true></ui-mark> '}${title}</h3><p>${copy}</p><small>${open?status:minigameLockText(key)}</small></div>
  <button class="${open?'gold-button':'muted-button'}" onclick="openMinigame('${key}')">${open?label:'잠김'}</button></section>`;
 };
 return `<div class="masterwork-intro"><h2>미니게임</h2><p>하루에 정해진 횟수만 즐기는 짧은 놀이입니다. 전투력과 상관없이 같은 조건으로 진행합니다.</p></div>`+
  card('furnace','용광로 제련','성운석을 넣어 순도를 올리고, 과열되기 전에 꺼내세요.','오늘 남은 제련 '+(FURNACE.runs-furnace.runs+(furnace.run?1:0))+' / '+FURNACE.runs,furnace.run?'이어 하기':'입장')+
  card('petBoard','동료 배치전','적의 진형을 보고 동료를 배치해 이기는 퍼즐입니다.','오늘 클리어 '+board.cleared.length+' / '+BOARD_STAGES.length,'입장');
}
function furnaceScreen(){
 const book=minigamePeek('furnace'),run=book.run,left=FURNACE.runs-book.runs;
 const heat=run?.heat||0,percent=Math.min(100,heat/FURNACE.limit*100),zone=heat>=85?'danger':heat>=65?'warm':'';
 const piece=key=>{const p=FURNACE.pieces[key];return `<button class="furnace-piece" onclick="furnaceAct('${key}')" ${furnaceBusy?'disabled':''}><b>${p.name}</b><small>온도 +${p.heat[0]}~${p.heat[1]}</small><small>순도 +${p.purity}</small></button>`};
 const preview=furnaceRewards(run?.purity||0,false);
 return `<button class="muted-button mini-back" onclick="closeMinigame()">미니게임 목록</button>
 <section class="furnace-panel"><h3>용광로 제련 <small>오늘 남은 횟수 ${left} / ${FURNACE.runs}</small></h3>
 ${minigameArt('furnace','furnace-art',768,480)}
 <div class="furnace-gauge ${zone}" role="img" aria-label="온도 ${heat} / ${FURNACE.limit}"><i style="width:${percent}%"></i><b>${heat} / ${FURNACE.limit}</b></div>
 <div class="effect-table"><div><span>순도</span><b>${run?.purity||0}</b></div><div><span>지금 꺼내면</span><b>${run?passRewardText(preview)||'보상 없음':'-'}</b></div></div>
 <p class="furnace-note" aria-live="polite">${furnaceNote||'온도가 100을 넘으면 과열되어 순도의 절반만 남습니다.'}</p>
 ${run?`<div class="furnace-pieces">${piece('small')}${piece('large')}</div>
 <div class="action-row">${button(run.cooled?'냉각수 사용함':'냉각수 · 온도 -'+FURNACE.coolant,"furnaceAct('cool')",run.cooled||furnaceBusy,true)}${button('꺼내기',"furnaceAct('take')",!run.count||furnaceBusy)}</div>`
 :`<div class="action-row">${button(left>0?'제련 시작':'오늘의 제련 완료',"furnaceAct('start')",left<=0||furnaceBusy)}</div>`}
 <p class="small masterwork-rules">입장은 무료이고 다이아를 쓰지 않습니다. 보상: 순도 3마다 별철 1개, 순도 1마다 강화석 10개.</p></section>`;
}
function furnaceShow(result){
 const f=result.furnace,rolled=f.rolled?'온도 +'+f.rolled+' · ':'';
 if(f.burst)furnaceNote=rolled+'과열! 순도 '+f.purity+'의 절반만 건졌습니다.';
 else if(f.ended)furnaceNote='순도 '+f.purity+'의 주괴를 꺼냈습니다.';
 else if(f.op==='cool')furnaceNote='냉각수로 온도를 '+FURNACE.coolant+' 낮췄습니다.';
 else if(f.op==='start')furnaceNote='불을 지폈습니다. 덩이를 넣으세요.';
 else furnaceNote=rolled+'현재 온도 '+f.heat+'.';
 if(f.ended&&Object.keys(result.rewards||{}).length){rewardNotice(result.rewards,f.burst?'과열 · 절반 보상':'제련 완료');playSound('reward')}
 else if(f.ended)notice('보상을 받기에는 순도가 부족했습니다');
 else playSound(f.op==='cool'?'ice':'forge');
}
function furnaceAct(op){
 if(furnaceBusy)return false;
 const done=result=>{furnaceBusy=false;if(result)furnaceShow(result);paint();if(activeScreen==='dungeon')renderScreen();return !!result};
 if(saveGuard.usesServer()){
  furnaceBusy=true;renderScreen();
  return saveGuard.command('claim',{source:'furnace',id:op}).then(done,()=>done(null));
 }
 try{const result=economyClaimRule(s,{source:'furnace',id:op},Math.random,Date.now());save();return done(result)}
 catch(error){notice(error.message);return done(null)}
}
function boardCode(){return boardDraft.cells.join('.')}
function boardSync(){
 const day=today();
 if(boardDraft.day!==day){Object.assign(boardDraft,{day,n:0,cells:Array(9).fill('-'),pick:''});stopBoardPlayback()}
 return boardStage(day,boardDraft.n);
}
function stopBoardPlayback(){clearInterval(boardDraft.timer);boardDraft.timer=0;boardDraft.playing=null}
function selectBoardStage(n){if(!BOARD_STAGES[n])return;stopBoardPlayback();Object.assign(boardDraft,{n,cells:Array(9).fill('-'),pick:''});renderScreen(false)}
function pickBoardUnit(code){if(boardDraft.playing)return;boardDraft.pick=boardDraft.pick===code?'':code;renderScreen()}
function tapBoardCell(cell){
 if(boardDraft.playing)return;
 const stage=boardSync(),cells=boardDraft.cells;
 if(cells[cell]!=='-'&&!boardDraft.pick){cells[cell]='-';renderScreen();return}
 if(!boardDraft.pick){notice('아래에서 동료를 먼저 고르세요');return}
 const from=cells.indexOf(boardDraft.pick);
 if(from<0&&cells[cell]==='-'&&cells.filter(c=>c!=='-').length>=stage.limit){notice('동료는 '+stage.limit+'마리까지 배치합니다');return}
 if(from>=0)cells[from]=cells[cell];
 cells[cell]=boardDraft.pick;boardDraft.pick='';renderScreen();
}
function boardPetOf(stage,code){return code[0]==='l'?stage.loans[Number(code.slice(1))]:Number(code.slice(1))}
function boardTile(pet,hp,max,extra=''){
 const role=BOARD_ROLES[BOARD_PET_ROLES[pet]];
 return `${petArt(pet,'board-pet')}<em>${role.name}</em><span class="board-hp"><i style="width:${Math.max(0,hp/max*100)}%"></i></span><small>${hp}</small>${extra}`;
}
function boardGrid(stage,side,frame){
 // Columns are drawn so that both front lines meet in the middle of the screen.
 const foes=boardFoes(stage),order=side==='ally'?[2,1,0]:[0,1,2];
 let allies=[];try{allies=boardFormation(stage,boardDraft.cells)}catch(error){}
 const cells=[];
 for(let row=0;row<3;row++)for(const col of order){
  const cell=row*3+col,acting=frame&&frame.side===side&&frame.from===cell,hit=frame&&frame.side!==side&&!frame.heal&&frame.to.includes(cell)||frame&&frame.side===side&&frame.heal&&frame.to.includes(cell);
  const state=(acting?' acting':'')+(hit?frame.heal?' healed':' hit':'');
  if(side==='foe'){
   const i=foes.findIndex(u=>u.cell===cell),foe=foes[i];
   if(!foe){cells.push('<div class="board-cell empty"></div>');continue}
   const hp=frame?frame.foe[i]:foe.hp,kind=stage.foes[i].kind;
   cells.push(`<div class="board-cell foe${hp<=0?' down':''}${state}">${art(BOARD_FOES[kind].art,'board-foe')}<em>${BOARD_FOES[kind].name}</em><span class="board-hp"><i style="width:${Math.max(0,hp/foe.max*100)}%"></i></span><small>${hp}</small></div>`);
  }else{
   const code=boardDraft.cells[cell],i=allies.findIndex(u=>u.cell===cell);
   if(code==='-'){cells.push(`<button class="board-cell empty${col===0?' front':''}" onclick="tapBoardCell(${cell})" aria-label="${row+1}번째 줄 ${col===0?'앞':col===1?'가운데':'뒤'} 칸, 비어 있음">${col===0?'앞':col===1?'중':'뒤'}</button>`);continue}
   const pet=boardPetOf(stage,code),unit=allies[i],hp=frame?frame.ally[i]:unit.hp;
   cells.push(`<button class="board-cell ally${hp<=0?' down':''}${state}" onclick="tapBoardCell(${cell})" aria-label="${COMPANIONS[pet][0]}, ${BOARD_ROLES[unit.role].name}">${boardTile(pet,hp,unit.max)}</button>`);
  }
 }
 return `<div class="board-grid ${side}">${cells.join('')}</div>`;
}
function boardScreen(){
 const stage=boardSync(),book=minigamePeek('petBoard'),done=book.cleared.includes(stage.n),frame=boardDraft.playing?.frame||null;
 const placed=boardDraft.cells.filter(c=>c!=='-').length;
 const codes=[...stage.loans.map((pet,i)=>'l'+i),...COMPANIONS.map((c,i)=>s.pets?.[i]>0?'p'+i:'').filter(Boolean)];
 const bench=codes.map(code=>{
  const pet=boardPetOf(stage,code),role=BOARD_ROLES[BOARD_PET_ROLES[pet]],used=boardDraft.cells.includes(code);
  return `<button class="board-unit${boardDraft.pick===code?' picked':''}${used?' used':''}" onclick="pickBoardUnit('${code}')" aria-pressed="${boardDraft.pick===code}" aria-label="${COMPANIONS[pet][0]}, ${role.name}, ${role.tip}">${petArt(pet,'board-pet')}<b>${minigameArt('role-'+BOARD_PET_ROLES[pet],'role-icon',18,18)}${role.name}</b><small>${code[0]==='l'?'대여':'내 동료'}</small><small>체력 ${role.hp} · ${BOARD_PET_ROLES[pet]==='healer'?'회복':'공격'} ${role.atk}</small></button>`;
 }).join('');
 const picked=boardDraft.pick?BOARD_ROLES[BOARD_PET_ROLES[boardPetOf(stage,boardDraft.pick)]]:null;
 const tabs=BOARD_STAGES.map((spec,n)=>`<button class="${stage.n===n?'active':''}" aria-pressed="${stage.n===n}" onclick="selectBoardStage(${n})">${n+1}단계${book.cleared.includes(n)?' <ui-mark data-shape=check aria-hidden=true></ui-mark>':''}</button>`).join('');
 return `<button class="muted-button mini-back" onclick="closeMinigame()">미니게임 목록</button>
 <section class="board-panel"><h3>동료 배치전 <small>보상 ${passRewardText(stage.rewards)}</small></h3>
 <div class="tabs board-stages">${tabs}</div>
 <div class="board-field"><div><small class="board-side">내 진형 (뒤 · 중 · 앞)</small>${boardGrid(stage,'ally',frame)}</div><b class="board-versus">VS</b><div><small class="board-side">적 진형 (앞 · 중 · 뒤)</small>${boardGrid(stage,'foe',frame)}</div></div>
 <p class="board-tip" aria-live="polite">${boardDraft.playing?boardDraft.playing.round+' / '+BOARD_ROUNDS+'라운드':picked?picked.name+' · '+picked.tip:'동료를 고른 뒤 내 진형의 칸을 누르세요. '+BOARD_ROUNDS+'라운드 안에 적을 모두 쓰러뜨리면 승리합니다.'}</p>
 <div class="board-bench">${bench}</div>
 <div class="action-row">${button('배치 비우기','clearBoard()',!placed||!!boardDraft.playing,true)}${button(done?'오늘 클리어함':'전투 시작 · '+placed+' / '+stage.limit,'startBoardBattle()',done||!placed||!!boardDraft.playing)}</div>
 <p class="small masterwork-rules">대여 동료만으로도 이길 수 있는 배치가 있습니다. 내 동료가 있으면 한 마리를 더 세울 수 있습니다. 동료의 레벨은 영향을 주지 않습니다.</p></section>`;
}
function clearBoard(){if(boardDraft.playing)return;boardDraft.cells.fill('-');boardDraft.pick='';renderScreen()}
function startBoardBattle(){
 const stage=boardSync();
 if(boardDraft.playing||minigamePeek('petBoard').cleared.includes(stage.n))return false;
 let allies;try{allies=boardFormation(stage,boardDraft.cells)}catch(error){notice(error.message);return false}
 const result=boardBattle(allies,boardFoes(stage),true),code=boardCode(),day=stage.day,n=stage.n;
 let step=0;
 boardDraft.pick='';boardDraft.playing={frame:null,round:1};
 const finish=()=>{
  stopBoardPlayback();
  if(!result.win){notice(result.rounds>=BOARD_ROUNDS?'시간 안에 끝내지 못했습니다. 자리를 바꿔 보세요':'패배 · 자리를 바꿔 보세요');renderScreen();return}
  claimBoardWin(day,n,code);
 };
 const tick=()=>{
  if(activeScreen!=='dungeon'||miniView!=='petBoard'){stopBoardPlayback();return}
  if(step>=result.log.length){finish();return}
  const frame=result.log[step++];boardDraft.playing={frame,round:frame.round};
  playSound(frame.heal?'heal':'heavy');renderScreen();
 };
 boardDraft.timer=setInterval(tick,s.speed===2?140:240);tick();return true;
}
function claimBoardWin(day,n,code){
 const id=day+'/'+n+'/'+code,paid=result=>{
  if(result){rewardNotice(result.rewards,(n+1)+'단계 승리');playSound('victory')}
  paint();if(activeScreen==='dungeon')renderScreen();return !!result;
 };
 if(saveGuard.usesServer())return saveGuard.command('claim',{source:'petBoard',id}).then(paid,()=>paid(null));
 try{const result=economyClaimRule(s,{source:'petBoard',id},Math.random,Date.now());save();return paid(result)}
 catch(error){notice(error.message);return paid(null)}
}
function minigameScreen(){
 if(miniView==='furnace'&&minigameOpen('furnace'))return furnaceScreen();
 if(miniView==='petBoard'&&minigameOpen('petBoard'))return boardScreen();
 miniView='hub';return minigameHub();
}
SCREEN_TABS.dungeon.push(['minigames','미니게임']);
const dungeonScreenBeforeMinigames=dungeonScreen;
dungeonScreen=function(){if(screenTab!=='minigames'){stopBoardPlayback();return dungeonScreenBeforeMinigames()}return minigameScreen()};
