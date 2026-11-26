/* Two daily minigames: the smelting furnace and the companion formation battle. */
'use strict';
// Both are settled by the reward rule (economyClaimRule), so the server rolls the furnace
// and replays the board battle itself. Their daily records live in the server-kept claim ledger.
const MINIGAME_GATES={furnace:20,petBoard:30};
// Painted art for each minigame. Set a switch to true once that game's files (work orders
// A9 and A10) are in dist/client/assets/minigames/. Until then the scenes draw simple shapes.
const FURNACE_ART=false,BOARD_ART=false;
function minigameArt(on,name,cls,width,height){return on?'<img class="'+cls+'" src="./assets/minigames/'+name+'.webp" width="'+width+'" height="'+height+'" alt="">':''}
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

// ---------- Companion formation battle ----------
// A small turn-based battle on a board five tiles wide and six deep. The enemy holds the two top rows.
// The player first recruits companions from a shop of four random cards (coins buy a card or deal a new
// hand; two of the same companion join into a stronger one), places them on the two bottom rows, and the
// sides then take turns: each unit may walk and then act once. The battle itself has no dice. The server
// deals the same cards from the same numbers and replays the recorded turns before it pays.
const BOARD_W=5,BOARD_H=6,BOARD_TURNS=12,BOARD_SAMPLES=24,BOARD_STAR=1.5;
// The shop: four cards at a time, the price of a card, the price of a new hand, and how much stronger a
// companion of two and of three stars is.
const BOARD_SHOP=4,BOARD_PRICE=2,BOARD_REROLL=1,BOARD_RANKS=[1,1.6,2.5];
const BOARD_ROLES={
 guard:{name:'방패',hp:60,atk:6,move:2,reach:1,tip:'붙어 있는 적 하나를 공격. 체력이 높아 길을 막기 좋다'},
 striker:{name:'돌격',hp:30,atk:14,move:3,reach:1,tip:'3칸까지 달려가, 붙어 있는 적 하나를 강하게 공격'},
 piercer:{name:'관통',hp:26,atk:8,move:2,reach:3,shape:'line',tip:'직선 3칸 안의 적을 모두 꿰뚫는다'},
 blast:{name:'폭발',hp:24,atk:7,move:2,reach:3,shape:'burst',tip:'3칸 안의 적과 그 옆에 붙은 적을 함께 공격'},
 sniper:{name:'저격',hp:22,atk:12,move:2,reach:4,tip:'4칸 안의 적 하나를 공격'},
 healer:{name:'치유',hp:28,atk:8,move:2,reach:3,shape:'heal',tip:'3칸 안의 다친 아군을 회복. 적을 고르면 절반의 힘으로 공격'}
};
// One role for each of the twelve companions, by companion number.
const BOARD_PET_ROLES=['blast','sniper','healer','striker','sniper','piercer','guard','guard','striker','striker','healer','piercer'];
// An enemy moves and aims like the role named in act, with its own health and attack.
const BOARD_FOES={
 guard:{name:'방어형',hp:70,atk:5,art:'creature_2_0',act:'guard'},
 striker:{name:'돌격형',hp:34,atk:13,art:'creature_1_1',act:'striker'},
 sniper:{name:'사격형',hp:24,atk:9,art:'creature_3_1',act:'sniper'},
 healer:{name:'회복형',hp:30,atk:7,art:'creature_1_2',act:'healer'}
};
const BOARD_STAGES=[
 {coins:8,limit:3,stars:1,foes:['guard','striker','striker','sniper'],share:.5,rewards:{starIron:5,petShards:4}},
 {coins:10,limit:4,stars:2,foes:['guard','guard','striker','sniper','healer'],share:.3,rewards:{starIron:8,petShards:6}},
 {coins:12,limit:5,stars:2,foes:['guard','guard','striker','striker','sniper','healer'],share:.15,rewards:{starIron:12,petShards:10,gems:30}}
];
function boardSeed(text){let hash=2166136261;for(const c of text)hash=Math.imul(hash^c.charCodeAt(0),16777619)>>>0;return hash}
function boardRandom(seed){let x=seed||1;return ()=>{x=(Math.imul(x,1664525)+1013904223)>>>0;return x/4294967296}}
function boardShuffle(list,random){const a=[...list];for(let i=a.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
// cell = row * 5 + column. Row 0 is the enemy's back line and row 5 the companions' back line.
function boardRow(cell){return Math.floor(cell/BOARD_W)}
function boardCol(cell){return cell%BOARD_W}
function boardGap(a,b){return Math.abs(boardRow(a)-boardRow(b))+Math.abs(boardCol(a)-boardCol(b))}
function boardNear(cell){
 const row=boardRow(cell),col=boardCol(cell),near=[];
 if(row>0)near.push(cell-BOARD_W);
 if(col>0)near.push(cell-1);
 if(col<BOARD_W-1)near.push(cell+1);
 if(row<BOARD_H-1)near.push(cell+BOARD_W);
 return near;
}
function boardAt(state,cell){return state.units.find(unit=>unit.hp>0&&unit.cell===cell)}
function boardAlly(state,slot){return state.units.find(unit=>unit.side==='ally'&&unit.slot===slot)}
function boardFront(pet){return ['guard','striker'].includes(BOARD_PET_ROLES[pet])}
// The cards on offer after a number of new hands. They follow from the day, the stage and the attempt's
// own number (salt), so the server deals exactly what the player saw. The first hand always has a front-liner.
function boardShop(stage,salt,roll){
 const random=boardRandom(boardSeed('shop|'+stage.day+'|'+stage.n+'|'+salt+'|'+roll));
 const cards=Array.from({length:BOARD_SHOP},()=>Math.floor(random()*BOARD_PET_ROLES.length));
 if(!roll&&!cards.some(boardFront)){
  const fronts=BOARD_PET_ROLES.map((role,pet)=>pet).filter(boardFront);
  cards[0]=fronts[Math.floor(random()*fronts.length)];
 }
 return cards;
}
function boardDraftOpen(stage,salt){return {salt,coins:stage.coins,roll:0,shop:boardShop(stage,salt,0),units:[],serial:0,text:''}}
// One step of recruiting: 'r' deals a new hand, '0'-'3' buys that card. Two companions of the same kind and
// rank join at once into one of the next rank, which keeps the place of the earlier one.
function boardDraftStep(stage,draft,op){
 if(op==='r'){
  if(draft.coins<BOARD_REROLL)throw Error('코인이 부족합니다.');
  draft.coins-=BOARD_REROLL;draft.roll++;draft.shop=boardShop(stage,draft.salt,draft.roll);draft.text+='r';
  return {unit:null,gone:[]};
 }
 const slot=/^\d$/.test(op)?Number(op):-1,pet=draft.shop[slot];
 if(pet===undefined||pet<0)throw Error('영입할 수 없는 카드입니다.');
 if(draft.coins<BOARD_PRICE)throw Error('코인이 부족합니다.');
 draft.coins-=BOARD_PRICE;draft.shop[slot]=-1;draft.text+=op;
 let unit={id:draft.serial++,pet,star:1};
 const gone=[];
 draft.units.push(unit);
 while(unit.star<BOARD_RANKS.length){
  const twin=draft.units.find(other=>other!==unit&&other.pet===unit.pet&&other.star===unit.star);
  if(!twin)break;
  const [kept,lost]=twin.id<unit.id?[twin,unit]:[unit,twin];
  draft.units.splice(draft.units.indexOf(lost),1);gone.push(lost.id);
  kept.star++;unit=kept;
 }
 return {unit,gone};
}
function boardDraftRun(stage,salt,text){
 if(typeof salt!=='string'||!/^[0-9a-z]{1,3}$/.test(salt)||typeof text!=='string'||text.length>stage.coins)throw Error('영입 기록을 확인하세요.');
 const draft=boardDraftOpen(stage,salt);
 for(const op of text)boardDraftStep(stage,draft,op);
 return draft;
}
// Recruiting without a player, used to choose how tough the day's enemies are: join a pair when one is on
// offer, fill the board with a front-liner first, and pay for a new hand only when nothing on offer helps.
function boardAutoDraft(stage,salt){
 const draft=boardDraftOpen(stage,salt);
 while(draft.coins>=BOARD_PRICE){
  const offer=test=>draft.shop.findIndex(pet=>pet>=0&&test(pet));
  let slot=offer(pet=>draft.units.some(unit=>unit.pet===pet&&unit.star<BOARD_RANKS.length));
  if(slot<0&&draft.units.length<stage.limit){
   if(!draft.units.some(unit=>boardFront(unit.pet)))slot=offer(boardFront);
   if(slot<0)slot=offer(pet=>BOARD_PET_ROLES[pet]!=='healer'||!draft.units.some(unit=>BOARD_PET_ROLES[unit.pet]==='healer'));
   if(slot<0)slot=offer(()=>true);
  }
  if(slot>=0){boardDraftStep(stage,draft,String(slot));continue}
  if(draft.coins<BOARD_PRICE+BOARD_REROLL&&draft.units.length>=stage.limit)break;
  boardDraftStep(stage,draft,'r');
 }
 return draft;
}
// A placement made without a player: the strongest companions up to the board's limit, front-liners on the
// upper of the two rows and the others behind them, from the middle outward.
function boardAutoPlace(stage,units){
 const chosen=[...units].sort((a,b)=>b.star-a.star||a.id-b.id).slice(0,stage.limit),columns=[2,1,3,0,4],used=[0,0];
 return units.map(unit=>{
  if(!chosen.includes(unit))return -1;
  const back=boardFront(unit.pet)?0:1,row=used[back]<BOARD_W?back:1-back;
  return (BOARD_H-2+row)*BOARD_W+columns[used[row]++];
 });
}
// A battle in its opening position. place holds one cell for each recruited companion, or -1 when left out.
function boardOpen(stage,units,place){
 const list=[];
 units.forEach((unit,slot)=>{
  if(place[slot]<0)return;
  const role=BOARD_PET_ROLES[unit.pet],stats=BOARD_ROLES[role],rank=BOARD_RANKS[unit.star-1],hp=Math.round(stats.hp*rank);
  list.push({side:'ally',slot,pet:unit.pet,star:unit.star,role,cell:place[slot],hp,max:hp,atk:Math.round(stats.atk*rank),done:false});
 });
 stage.foes.forEach((foe,slot)=>list.push({side:'foe',slot,kind:foe.kind,role:BOARD_FOES[foe.kind].act,cell:foe.cell,hp:foe.hp,max:foe.hp,atk:foe.atk,done:false}));
 return {units:list,stars:stage.stars,turn:1,over:''};
}
// Every tile the unit can walk to this turn, with the number of steps. Units block the way.
function boardReach(state,unit){
 const limit=BOARD_ROLES[unit.role].move,steps=new Map([[unit.cell,0]]),queue=[unit.cell];
 while(queue.length){
  const cell=queue.shift(),walked=steps.get(cell);
  if(walked>=limit)continue;
  for(const next of boardNear(cell))if(!steps.has(next)&&!boardAt(state,next)){steps.set(next,walked+1);queue.push(next)}
 }
 return steps;
}
// The tiles the unit could act on while standing on from: enemies in reach, and for a healer, hurt friends.
function boardAims(state,unit,from=unit.cell){
 const role=BOARD_ROLES[unit.role],aims=[];
 for(const other of state.units){
  if(other.hp<=0||other===unit||boardGap(from,other.cell)>role.reach)continue;
  if(other.side===unit.side){if(role.shape==='heal'&&other.hp<other.max)aims.push(other.cell);continue}
  if(role.shape==='line'&&boardRow(from)!==boardRow(other.cell)&&boardCol(from)!==boardCol(other.cell))continue;
  aims.push(other.cell);
 }
 return aims;
}
// Who is affected, and by how much, when the unit acts on target while standing on from.
function boardStruck(state,unit,from,target){
 const role=BOARD_ROLES[unit.role],aimed=boardAt(state,target),heal=aimed.side===unit.side;
 let list=[aimed],power=unit.atk;
 if(heal){}
 else if(role.shape==='heal')power=unit.atk/2;
 else if(role.shape==='line'){
  const dr=Math.sign(boardRow(target)-boardRow(from)),dc=Math.sign(boardCol(target)-boardCol(from));
  list=[];
  for(let k=1,row=boardRow(from)+dr,col=boardCol(from)+dc;k<=role.reach&&row>=0&&row<BOARD_H&&col>=0&&col<BOARD_W;k++,row+=dr,col+=dc){
   const other=boardAt(state,row*BOARD_W+col);
   if(other&&other!==unit&&other.side!==unit.side)list.push(other);
  }
 }else if(role.shape==='burst')for(const cell of boardNear(target)){
  const other=boardAt(state,cell);
  if(other&&other.side!==unit.side)list.push(other);
 }
 return {heal,list,amount:Math.round(power*(state.stars.includes(from)?BOARD_STAR:1))};
}
function boardCheck(state){
 if(!state.units.some(unit=>unit.side==='foe'&&unit.hp>0))state.over='win';
 else if(!state.units.some(unit=>unit.side==='ally'&&unit.hp>0))state.over='lose';
}
function boardHit(state,unit,target){
 const hit=boardStruck(state,unit,unit.cell,target);
 const cells=hit.list.map(other=>{
  const before=other.hp;
  other.hp=hit.heal?Math.min(other.max,other.hp+hit.amount):Math.max(0,other.hp-hit.amount);
  return {cell:other.cell,change:other.hp-before};
 });
 boardCheck(state);
 return {heal:hit.heal,cells};
}
// How a unit plays by itself: the action worth the most from any tile it can walk to (a knockout counts
// extra), with the fewest steps; with nothing in reach it walks toward the nearest enemy.
function boardThink(state,unit){
 const reach=boardReach(state,unit),cells=[...reach.keys()].sort((a,b)=>reach.get(a)-reach.get(b)||a-b);
 let best=null;
 for(const dest of cells)for(const target of boardAims(state,unit,dest)){
  const hit=boardStruck(state,unit,dest,target);
  let worth=0;
  for(const other of hit.list)worth+=hit.heal?Math.min(other.max-other.hp,hit.amount)*1.5:Math.min(other.hp,hit.amount)+(other.hp<=hit.amount?40:0);
  const score=worth*100-boardAt(state,target).hp;
  if(!best||score>best.score)best={score,dest,target};
 }
 if(best)return {dest:best.dest,target:best.target};
 const foes=state.units.filter(other=>other.hp>0&&other.side!==unit.side);
 let dest=unit.cell,gap=Infinity;
 for(const cell of cells){
  const near=Math.min(...foes.map(other=>boardGap(cell,other.cell)));
  if(near<gap){gap=near;dest=cell}
 }
 return {dest,target:-1};
}
function boardPlay(state,unit){
 const plan=boardThink(state,unit);
 unit.cell=plan.dest;
 if(plan.target>=0)boardHit(state,unit,plan.target);
 unit.done=true;
 return plan;
}
function boardFoeTurn(state){for(const unit of state.units)if(unit.side==='foe'&&unit.hp>0&&!state.over)boardPlay(state,unit)}
// After the enemy has moved: the next turn begins, or time runs out.
function boardTurnEnd(state){
 if(state.over)return;
 state.turn++;
 if(state.turn>BOARD_TURNS){state.over='time';return}
 for(const unit of state.units)unit.done=false;
}
// Both sides playing by themselves. Used to choose how tough the day's enemies are.
function boardAutoBattle(stage,units,place){
 const state=boardOpen(stage,units,place);
 while(!state.over){
  for(const unit of state.units)if(unit.side==='ally'&&unit.hp>0&&!state.over)boardPlay(state,unit);
  if(!state.over)boardFoeTurn(state);
  boardTurnEnd(state);
 }
 return state;
}
// One recorded move of a companion: walk to dest, then act on target (-1 to do nothing more).
function boardCommand(state,slot,dest,target){
 const unit=boardAlly(state,slot);
 if(!unit||unit.hp<=0||unit.done)throw Error('움직일 수 없는 동료입니다.');
 if(dest!==unit.cell){
  if(!boardReach(state,unit).has(dest))throw Error('갈 수 없는 칸입니다.');
  unit.cell=dest;
 }
 if(target>=0){
  if(!boardAims(state,unit).includes(target))throw Error('공격할 수 없는 대상입니다.');
  boardHit(state,unit,target);
 }
 unit.done=true;
}
// A tile is written as one base-36 character, and a move as three: companion number, destination, target or '-'.
// The moves of one turn are written together and turns are separated by '.'.
function boardCell(cell){return cell.toString(36)}
function boardCellOf(letter){
 const cell=/^[0-9a-z]$/.test(letter)?parseInt(letter,36):-1;
 if(cell<0||cell>=BOARD_W*BOARD_H)throw Error('기록을 확인하세요.');
 return cell;
}
function boardReplay(stage,units,place,record){
 const state=boardOpen(stage,units,place),turns=String(record).split('.');
 if(turns.length>BOARD_TURNS)throw Error('기록을 확인하세요.');
 for(const turn of turns){
  if(turn.length%3)throw Error('기록을 확인하세요.');
  for(let i=0;i<turn.length&&!state.over;i+=3)
   boardCommand(state,/^\d$/.test(turn[i])?Number(turn[i]):-1,boardCellOf(turn[i+1]),turn[i+2]==='-'?-1:boardCellOf(turn[i+2]));
  if(!state.over)boardFoeTurn(state);
  boardTurnEnd(state);
  if(state.over)break;
 }
 return state;
}
const boardStageCache=new Map();
// The day's stage: the enemy formation, the star tiles, the coins and the board's limit, and an enemy
// toughness chosen so that the stated share of attempts win even when nobody plays (cards recruited,
// placed and moved by the rules above).
function boardStage(dayKey,n){
 const key=dayKey+'|'+n;
 if(boardStageCache.has(key))return boardStageCache.get(key);
 const spec=BOARD_STAGES[n],random=boardRandom(boardSeed('board|'+key));
 // Healers and shooters stand on the enemy's back row, the others on the row in front of it.
 const rear=boardShuffle([0,1,2,3,4],random),van=boardShuffle([5,6,7,8,9],random);
 const layout=spec.foes.map(kind=>({kind,cell:(kind==='healer'||kind==='sniper'?rear:van).pop()})).sort((a,b)=>a.cell-b.cell);
 const stars=boardShuffle([10,11,12,13,14,15,16,17,18,19],random).slice(0,spec.stars).sort((a,b)=>a-b);
 const build=scale=>({day:dayKey,n,coins:spec.coins,limit:spec.limit,stars,
  foes:layout.map(({kind,cell})=>({kind,cell,hp:Math.round(BOARD_FOES[kind].hp*scale),atk:BOARD_FOES[kind].atk}))});
 const plain=build(1),samples=Array.from({length:BOARD_SAMPLES},(unused,i)=>{
  const units=boardAutoDraft(plain,'s'+i.toString(36)).units;
  return {units,place:boardAutoPlace(plain,units)};
 });
 const need=Math.max(2,Math.ceil(BOARD_SAMPLES*spec.share));
 // Whether enough of the sample attempts win at this toughness; it stops counting once that is settled.
 const enough=scale=>{
  const trial=build(scale);
  let won=0;
  for(let i=0;i<samples.length&&won<need&&won+samples.length-i>=need;i++)if(boardAutoBattle(trial,samples[i].units,samples[i].place).over==='win')won++;
  return won>=need;
 };
 // The toughest setting that still leaves the wanted share of winning attempts. Tougher enemies win
 // more often, so the list is searched by halves. If even the weakest setting falls short, the enemies are
 // made weaker still.
 const scales=[.3,.4,.5,.6,.7,.8,.9,1,1.1,1.25,1.4,1.6,1.8,2.1,2.4,2.8,3.2];
 let low=0,high=scales.length-1,scale=.2;
 while(low<=high){
  const middle=(low+high)>>1;
  if(enough(scales[middle])){scale=scales[middle];low=middle+1}else high=middle-1;
 }
 const stage={scale,rewards:spec.rewards,...build(scale)};
 if(boardStageCache.size>12)boardStageCache.clear();
 boardStageCache.set(key,stage);return stage;
}
// A placement is one character for each recruited companion: its tile on the two bottom rows, or '-'.
// Only recruited companions take part, so the companions a player owns make no difference.
function boardPlace(stage,units,text){
 if(typeof text!=='string'||text.length!==units.length)throw Error('배치를 확인하세요.');
 const place=[...text].map(letter=>letter==='-'?-1:boardCellOf(letter)),set=place.filter(cell=>cell>=0);
 if(!set.length||set.length>stage.limit||new Set(set).size!==set.length||set.some(cell=>boardRow(cell)<BOARD_H-2))throw Error('배치를 확인하세요.');
 return place;
}
// A claim is written as day/stage/salt/recruiting/placement/turns.
function boardRule(state,id,day){
 if(!minigameOpen('petBoard',state))throw Error(minigameLockText('petBoard'));
 const [stamp,number,salt,recruits,layout,record]=String(id).split('/'),n=Number(number);
 if(stamp!==day)throw Error('날짜가 바뀌었습니다. 오늘의 배치전을 다시 여세요.');
 if(!Number.isInteger(n)||!BOARD_STAGES[n]||typeof record!=='string')throw Error('배치를 확인하세요.');
 const book=minigameBook(state,'petBoard',day);
 if(book.cleared.includes(n))rejectEconomyClaim();
 const stage=boardStage(day,n),units=boardDraftRun(stage,salt,recruits).units;
 const result=boardReplay(stage,units,boardPlace(stage,units,layout),record);
 if(result.over!=='win')throw Error('이 기록으로는 이기지 못합니다.');
 book.cleared.push(n);book.cleared.sort();
 return {rewards:{...stage.rewards},board:{n,turns:result.turn}};
}

// ---------- Screens ----------
let miniView='hub',furnaceBusy=false,furnaceNote='',furnaceFx=null,furnaceLast=null;
// The ingot shown at the end is named by its purity. The name is for show; the reward follows the purity.
const FURNACE_GRADES=[[23,'명장의 주괴'],[16,'빛나는 주괴'],[8,'단단한 주괴'],[0,'거친 주괴']];
function furnaceGrade(purity){return 3-FURNACE_GRADES.findIndex(([need])=>purity>=need)}
// What the player is doing on the board: the cards recruited so far (draft), where each recruit stands
// (place, by the recruit's id), the recruit picked up to be placed, and the battle once it has begun.
const boardDraft={day:'',n:-1,draft:null,place:new Map(),pick:-1,note:'',battle:null,banner:''};
function openMinigame(key){
 if(!minigameOpen(key)){openMenu('starLocked',minigameLockText(key));return false}
 miniView=key;miniRefresh();return true;
}
function closeMinigame(){stopBoardBattle();miniView='hub';miniRefresh()}
// A minigame takes the whole screen: its own title, the play area, and a bar with the guide and the exit.
let miniStageEl=null;
const MINI_STAGES={
 furnace:{title:'용광로 제련',art:()=>FURNACE_ART,chips:['starIron','stones'],body:()=>furnaceScreen(),
  left:()=>'오늘 남은 제련 '+(FURNACE.runs-minigamePeek('furnace').runs)+' / '+FURNACE.runs,
  guide:['성운석 덩이를 넣어 순도를 올리고, 온도가 100을 넘기 전에 주괴를 꺼냅니다.','작은 덩이는 온도 +8~14 · 순도 +2, 큰 덩이는 온도 +16~26 · 순도 +5입니다.','냉각수는 한 판에 한 번, 온도를 15 낮춥니다.','온도가 100을 넘으면 과열되어 순도의 절반만 남습니다.','보상은 순도 3마다 별철 1개, 순도 1마다 강화석 10개입니다. 입장은 무료이고 하루 3판입니다.']},
 petBoard:{title:'동료 배치전',art:()=>BOARD_ART,chips:['starIron','petShards'],body:()=>boardScreen(),
  left:()=>'오늘 클리어 '+minigamePeek('petBoard').cleared.length+' / '+BOARD_STAGES.length,
  guide:['상점에 카드 4장이 무작위로 나옵니다. 카드를 누르면 코인 '+BOARD_PRICE+'개로 그 동료를 영입하고, "새 카드"를 누르면 코인 '+BOARD_REROLL+'개로 카드 4장을 새로 받습니다.','같은 동료를 두 장 모으면 2성으로 합체해 체력과 공격이 1.6배가 됩니다. 2성 둘은 3성(2.5배)이 됩니다. 상점에서 합체할 수 있는 카드에는 "합체" 표시가 붙습니다.','영입한 동료는 판의 아래 두 줄에 놓입니다. 판에 세울 수 있는 수는 단계마다 정해져 있습니다(3 · 4 · 5마리). 내 동료를 누른 뒤 칸을 누르면 자리를 옮깁니다.','전투는 턴제입니다. 내 차례에 동료를 누르면 갈 수 있는 칸이 파랗게, 공격할 수 있는 적이 붉게 표시됩니다. 동료마다 한 턴에 이동 한 번, 행동 한 번이고, '+BOARD_TURNS+'턴 안에 적을 모두 쓰러뜨리면 승리합니다.','방패·돌격은 붙어 있는 적을, 저격은 4칸 안의 적을 공격합니다. 관통은 직선 3칸의 적 전부를, 폭발은 고른 적과 그 옆의 적을 함께 공격합니다. 치유는 3칸 안의 아군을 회복합니다.','별빛 칸에 서서 행동하면 공격과 회복이 1.5배가 됩니다. 자동을 켜면 동료가 스스로 움직입니다.','"처음부터"를 누르면 새 카드로 다시 시작합니다. 코인과 카드는 이 놀이 안에서만 쓰이며, 내가 가진 동료나 다이아와는 상관없습니다.']}
};
function miniStageOpen(){return Object.hasOwn(MINI_STAGES,miniView)}
function miniStageHTML(){
 const stage=MINI_STAGES[miniView],painted=stage.art(),name=miniView==='furnace'?'furnace':'board';
 const chips=stage.chips.map(key=>`<span>${art(RESOURCE_ART[key])}<b>${compact(s[key]||0)}</b></span>`).join('');
 return `<div class="mini-stage-frame ${name}${painted?' painted':''}${miniView==='petBoard'&&boardDraft.battle?' fighting':''}">
 <header class="mini-stage-top"><small class="mini-stage-left">${stage.left()}</small><div class="mini-stage-chips">${chips}</div>
 ${minigameArt(painted,'title-'+name,'mini-stage-title',1024,360)}<h2>${stage.title}</h2></header>
 <div class="mini-stage-body">${stage.body()}</div>
 <footer class="mini-stage-bar"><button class="mini-stage-guide" onclick="openMenu('miniGuide','${miniView}')"><ui-mark data-shape=info aria-hidden=true></ui-mark>가이드</button>
 <button class="mini-stage-exit" onclick="closeMinigame()" aria-label="미니게임 나가기"><ui-mark data-shape=close aria-hidden=true></ui-mark></button></footer></div>`;
}
function miniGuidePopup(){
 const stage=MINI_STAGES[tab];
 return stage?`<h3>${stage.title}</h3><ol class="mini-guide-list">${stage.guide.map(line=>`<li>${line}</li>`).join('')}</ol><div class="action-row">${button('확인','closeMenu()')}</div>`:'<p>미니게임을 선택하세요.</p>';
}
EXTRA_POPUPS.miniGuide=['가이드',miniGuidePopup];
// Draws whichever minigame view is current: the full-screen stage, or the list inside the dungeon tab.
function miniRefresh(){
 if(!miniStageOpen()){
  if(miniStageEl){miniStageEl.remove();miniStageEl=null}
  if(activeScreen==='dungeon')renderScreen(false);
  return;
 }
 if(!miniStageEl){
  miniStageEl=document.createElement('section');miniStageEl.id='miniStage';miniStageEl.className='mini-stage';
  miniStageEl.setAttribute('aria-label','미니게임');$('game').appendChild(miniStageEl);
 }
 const scroll=miniStageEl.querySelector('.mini-stage-body')?.scrollTop||0;
 miniStageEl.innerHTML=miniStageHTML();hydrateArt();
 const body=miniStageEl.querySelector('.mini-stage-body');if(body)body.scrollTop=scroll;
}
function minigameHub(){
 const furnace=minigamePeek('furnace'),board=minigamePeek('petBoard');
 const card=(key,title,copy,status,label)=>{
  const open=minigameOpen(key);
  const painted=key==='furnace'?FURNACE_ART:BOARD_ART;
  return `<section class="mini-card${open?'':' locked'}${painted?' painted':''}">${minigameArt(painted,key==='furnace'?'hub-furnace':'hub-board','mini-thumb',64,64)}<div><h3>${open?'':lockMark()+' '}${title}</h3><p>${copy}</p><small>${open?status:minigameLockText(key)}</small></div>
  <button class="${open?'gold-button':'muted-button'}" onclick="openMinigame('${key}')">${open?label:'잠김'}</button></section>`;
 };
 return `<div class="masterwork-intro"><h2>미니게임</h2><p>하루에 정해진 횟수만 즐기는 짧은 놀이입니다. 전투력과 상관없이 같은 조건으로 진행합니다.</p></div>`+
  card('furnace','용광로 제련','성운석을 넣어 순도를 올리고, 과열되기 전에 꺼내세요.','오늘 남은 제련 '+(FURNACE.runs-furnace.runs+(furnace.run?1:0))+' / '+FURNACE.runs,furnace.run?'이어 하기':'입장')+
  card('petBoard','동료 배치전','무작위로 나오는 카드에서 동료를 영입해 판에 세우고, 턴마다 움직여 적을 물리칩니다.','오늘 클리어 '+board.cleared.length+' / '+BOARD_STAGES.length,'입장');
}
function furnaceScreen(){
 const book=minigamePeek('furnace'),run=book.run,left=FURNACE.runs-book.runs;
 const heat=run?.heat||0,percent=Math.min(100,heat/FURNACE.limit*100),zone=heat>=85?'danger':heat>=65?'warm':'';
 const piece=key=>{const p=FURNACE.pieces[key];return `<button class="furnace-piece" onclick="furnaceAct('${key}')" ${furnaceBusy?'disabled':''}>${minigameArt(FURNACE_ART,'ore-'+key,'furnace-ore',48,48)}<b>${p.name}</b><small>온도 +${p.heat[0]}~${p.heat[1]}</small><small>순도 +${p.purity}</small></button>`};
 const preview=furnaceRewards(run?.purity||0,false);
 return `<section class="furnace-panel">
 ${furnaceScene(run,heat,zone)}
 <div class="furnace-gauge ${zone}" role="img" aria-label="온도 ${heat} / ${FURNACE.limit}"><i style="width:${percent}%"></i><b>${heat} / ${FURNACE.limit}</b></div>
 <div class="effect-table"><div><span>순도</span><b>${run?.purity||0}</b></div><div><span>지금 꺼내면</span><b>${run?passRewardText(preview)||'보상 없음':'-'}</b></div></div>
 <p class="furnace-note" aria-live="polite">${furnaceNote||'온도가 100을 넘으면 과열되어 순도의 절반만 남습니다.'}</p>
 ${run?`<div class="furnace-pieces">${piece('small')}${piece('large')}</div>
 <div class="action-row">${button(run.cooled?'냉각수 사용함':'냉각수 · 온도 -'+FURNACE.coolant,"furnaceAct('cool')",run.cooled||furnaceBusy,true)}${button('꺼내기',"furnaceAct('take')",!run.count||furnaceBusy)}</div>`
 :`<div class="action-row">${button(left>0?'제련 시작':'오늘의 제련 완료',"furnaceAct('start')",left<=0||furnaceBusy)}</div>`}
 <p class="small masterwork-rules">입장은 무료이고 다이아를 쓰지 않습니다. 보상: 순도 3마다 별철 1개, 순도 1마다 강화석 10개.</p></section>`;
}
// The scene is layered: forge background, furnace body, a flame that grows with the heat,
// then short one-shot effects (a falling ore piece, steam) and the finished ingot or the burst.
function furnaceScene(run,heat,zone){
 const fx=furnaceFx&&Date.now()-furnaceFx.at<1200?furnaceFx:null,last=!run&&furnaceLast;
 const image=(name,cls,size)=>minigameArt(FURNACE_ART,name,cls,size,size);
 return `<div class="furnace-scene ${zone}${FURNACE_ART?' painted':''}${run?' lit':''}" style="--heat:${(Math.min(FURNACE.limit,heat)/FURNACE.limit).toFixed(2)}" aria-hidden="true">
 <div class="furnace-body">${image('furnace-body','',640)}</div>
 <div class="furnace-flame">${image('furnace-flame','',512)}</div>
 ${fx&&FURNACE.pieces[fx.kind]?`<div class="furnace-drop ${fx.kind}">${image('ore-'+fx.kind,'',192)}</div>`:''}
 ${fx?.kind==='cool'?`<div class="furnace-steam">${image('steam','',512)}</div>`:''}
 ${last?`<div class="furnace-result${last.burst?' burst':''}${fx&&Date.now()-fx.at<600?' fresh':''} grade-${last.grade}">${image(last.burst?'burst':'ingot-'+last.grade,'',256)}<b>${last.burst?'과열':FURNACE_GRADES[3-last.grade][1]}</b><small>순도 ${last.purity}</small></div>`:''}
 </div>`;
}
function furnaceShow(result){
 const shown=result.furnace;
 furnaceFx={kind:shown.op,at:Date.now()};
 if(shown.op==='start')furnaceLast=null;
 if(shown.ended)furnaceLast={burst:!!shown.burst,purity:shown.purity,grade:furnaceGrade(shown.purity)};
 setTimeout(()=>{if(furnaceFx&&Date.now()-furnaceFx.at>=1100&&miniView==='furnace')miniRefresh()},1250);
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
 const done=result=>{furnaceBusy=false;if(result)furnaceShow(result);paint();miniRefresh();return !!result};
 if(saveGuard.usesServer()){
  furnaceBusy=true;miniRefresh();
  return saveGuard.command('claim',{source:'furnace',id:op}).then(done,()=>done(null));
 }
 try{const result=economyClaimRule(s,{source:'furnace',id:op},Math.random,Date.now());save();return done(result)}
 catch(error){notice(error.message);return done(null)}
}
// The battle on screen. The device plays it out with the same rules, records each companion's move,
// and hands the record to the server when the last enemy falls.
function boardSync(){
 const day=today();
 if(boardDraft.day!==day){stopBoardBattle();Object.assign(boardDraft,{day,n:0,draft:null})}
 if(boardDraft.n<0)boardDraft.n=0;
 const stage=boardStage(day,boardDraft.n);
 if(!boardDraft.draft)newBoardDraft(stage);
 return stage;
}
// A fresh attempt: its own number decides which cards the shop will deal.
function newBoardDraft(stage){
 Object.assign(boardDraft,{draft:boardDraftOpen(stage,Math.floor(Math.random()*46656).toString(36)),place:new Map(),pick:-1,note:''});
}
function boardPlaces(){return boardDraft.draft.units.map(unit=>boardDraft.place.has(unit.id)?boardDraft.place.get(unit.id):-1)}
function boardPlaceCode(){return boardPlaces().map(cell=>cell<0?'-':boardCell(cell)).join('')}
function stopBoardBattle(){if(boardDraft.battle)clearTimeout(boardDraft.battle.timer);boardDraft.battle=null;boardDraft.banner=''}
function selectBoardStage(n){if(!BOARD_STAGES[n]||boardDraft.battle)return;Object.assign(boardDraft,{n,draft:null});miniRefresh()}
function resetBoardDraft(){if(boardDraft.battle)return;boardDraft.draft=null;miniRefresh()}
// The first free tile for a new recruit: front-liners on the upper of the two rows, the others behind.
function boardFreeCell(pet){
 const taken=new Set(boardDraft.place.values()),rows=boardFront(pet)?[BOARD_H-2,BOARD_H-1]:[BOARD_H-1,BOARD_H-2];
 for(const row of rows)for(const column of [2,1,3,0,4])if(!taken.has(row*BOARD_W+column))return row*BOARD_W+column;
 return -1;
}
function buyBoardCard(slot){
 const stage=boardSync(),draft=boardDraft.draft;
 if(boardDraft.battle)return false;
 let bought;
 try{bought=boardDraftStep(stage,draft,String(slot))}catch(error){notice(error.message);return false}
 const unit=bought.unit,place=boardDraft.place;
 // A joined companion stays where either half stood; a new one steps onto the board while there is room.
 for(const id of bought.gone){
  if(place.has(id)&&!place.has(unit.id))place.set(unit.id,place.get(id));
  place.delete(id);
  if(boardDraft.pick===id)boardDraft.pick=-1;
 }
 if(!place.has(unit.id)&&place.size<stage.limit){const cell=boardFreeCell(unit.pet);if(cell>=0)place.set(unit.id,cell)}
 boardDraft.note=bought.gone.length?COMPANIONS[unit.pet][0]+' '+unit.star+'성으로 합체!':'';
 playSound(bought.gone.length?'reward':'forge');miniRefresh();return true;
}
function rerollBoardShop(){
 const stage=boardSync();
 if(boardDraft.battle)return false;
 try{boardDraftStep(stage,boardDraft.draft,'r')}catch(error){notice(error.message);return false}
 boardDraft.note='';miniRefresh();return true;
}
function boardPace(){return s.speed===2?240:400}
function boardUnitNote(unit){
 const role=BOARD_ROLES[unit.role],name=unit.side==='ally'?COMPANIONS[unit.pet][0]:BOARD_FOES[unit.kind].name;
 return name+' · 체력 '+unit.hp+' · '+(role.shape==='heal'?'회복 ':'공격 ')+unit.atk+' · 이동 '+role.move+' · '+role.tip;
}
// Bench and roster buttons: before the battle they pick a companion to place, during it they select the piece.
function pickBoardUnit(key){
 const b=boardDraft.battle;
 if(!b){boardDraft.pick=boardDraft.pick===key?-1:key;boardDraft.note='';miniRefresh();return}
 const unit=boardAlly(b.state,key);
 if(unit&&unit.hp>0)tapBoardCell(unit.cell);
}
function tapBoardCell(cell){
 const stage=boardSync();
 if(boardDraft.battle){boardBattleTap(boardDraft.battle,cell);return}
 const place=boardDraft.place,units=boardDraft.draft.units,here=units.find(unit=>place.get(unit.id)===cell),foe=stage.foes.find(unit=>unit.cell===cell);
 if(foe){boardDraft.note=boardUnitNote({side:'foe',kind:foe.kind,role:BOARD_FOES[foe.kind].act,hp:foe.hp,atk:foe.atk});miniRefresh();return}
 if(boardRow(cell)<BOARD_H-2){notice(stage.stars.includes(cell)?'별빛 칸 · 이 칸에 서면 공격과 회복이 1.5배가 됩니다':'동료는 아래 두 줄에만 놓을 수 있습니다');return}
 const pick=boardDraft.pick;
 if(pick<0){
  if(!here){notice(units.length?'아래 내 동료에서 놓을 동료를 고르세요':'먼저 상점에서 카드를 영입하세요');return}
  boardDraft.pick=here.id;miniRefresh();return;
 }
 // Tapping the picked companion's own tile takes it off the board; another companion's tile swaps the two.
 if(here?.id===pick)place.delete(pick);
 else{
  if(!here&&!place.has(pick)&&place.size>=stage.limit){notice('판에는 '+stage.limit+'마리까지 세울 수 있습니다');return}
  if(here){if(place.has(pick))place.set(here.id,place.get(pick));else place.delete(here.id)}
  place.set(pick,cell);
 }
 boardDraft.pick=-1;boardDraft.note='';miniRefresh();
}
function autoBoardPlace(){
 const stage=boardSync();
 if(boardDraft.battle)return;
 const units=boardDraft.draft.units,cells=boardAutoPlace(stage,units);
 boardDraft.place=new Map(units.map((unit,i)=>[unit.id,cells[i]]).filter(([id,cell])=>cell>=0));
 boardDraft.pick=-1;boardDraft.note='';miniRefresh();
}
function startBoardBattle(){
 const stage=boardSync(),draft=boardDraft.draft;
 if(boardDraft.battle)return false;
 if(!boardDraft.place.size){notice(draft.units.length?'동료를 한 마리 이상 판에 세우세요':'먼저 상점에서 카드를 영입하세요');return false}
 boardDraft.battle={stage,state:boardOpen(stage,draft.units,boardPlaces()),code:draft.salt+'/'+draft.text+'/'+boardPlaceCode(),turns:[],current:'',sel:-1,moved:false,
  phase:'ally',busy:false,auto:false,fx:null,timer:0};
 Object.assign(boardDraft,{pick:-1,note:'',banner:''});miniRefresh();return true;
}
function leaveBoardBattle(){stopBoardBattle();miniRefresh()}
function boardFx(b,fx){b.fx={at:Date.now(),...fx}}
function boardNote(b,unit,target){b.current+=unit.slot+boardCell(unit.cell)+(target>=0?boardCell(target):'-')}
function boardBattleTap(b,cell){
 const state=b.state;
 if(state.over)return;
 if(b.auto){notice('자동 진행 중입니다. 직접 하려면 자동을 끄세요');return}
 if(b.busy)return;
 const here=boardAt(state,cell),unit=b.sel>=0?boardAlly(state,b.sel):null;
 if(unit){
  if(boardAims(state,unit).includes(cell)){
   const hit=boardHit(state,unit,cell);
   boardNote(b,unit,cell);unit.done=true;b.sel=-1;b.moved=false;
   boardFx(b,{lunge:{unit,to:cell},hits:hit.cells,heal:hit.heal});playSound(hit.heal?'heal':'heavy');
   boardAfterMove(b);return;
  }
  if(cell===unit.cell){
   if(b.moved)boardRest(b,unit);else{b.sel=-1;miniRefresh()}
   return;
  }
  if(b.moved){notice('붉은 칸의 대상을 고르거나, 동료를 다시 눌러 대기하세요');return}
  if(!here&&boardReach(state,unit).has(cell)){
   const from=unit.cell;unit.cell=cell;b.moved=true;boardFx(b,{walk:{unit,from}});
   if(boardAims(state,unit).length)miniRefresh();else boardRest(b,unit);
   return;
  }
 }
 if(here?.side==='ally'){
  if(here.done){notice('이번 턴에 이미 움직인 동료입니다');return}
  b.sel=here.slot;boardDraft.note='';miniRefresh();return;
 }
 if(here){boardDraft.note=boardUnitNote(here);miniRefresh();return}
 if(unit)notice('파란 칸으로만 이동할 수 있습니다');
}
// The selected companion ends its move without acting.
function boardRest(b,unit){boardNote(b,unit,-1);unit.done=true;b.sel=-1;b.moved=false;boardAfterMove(b)}
function boardAfterMove(b){
 miniRefresh();
 if(b.state.over){boardFinish(b);return}
 if(b.state.units.some(unit=>unit.side==='ally'&&unit.hp>0&&!unit.done))return;
 b.busy=true;b.timer=setTimeout(()=>boardEndTurn(b),boardPace());
}
function endBoardTurn(){
 const b=boardDraft.battle;
 if(!b||b.busy||b.auto||b.state.over)return;
 if(b.moved)boardNote(b,boardAlly(b.state,b.sel),-1);
 boardEndTurn(b);
}
// A unit playing by itself, shown as a walk and then a strike. Returns what it decided.
function boardShow(b,unit,then){
 const plan=boardThink(b.state,unit),from=unit.cell,pace=boardPace();
 const strike=()=>{
  if(boardDraft.battle!==b)return;
  if(plan.target>=0){
   const hit=boardHit(b.state,unit,plan.target);
   boardFx(b,{lunge:{unit,to:plan.target},hits:hit.cells,heal:hit.heal});playSound(hit.heal?'heal':'heavy');
  }
  unit.done=true;miniRefresh();
  b.timer=setTimeout(then,plan.target>=0?pace:plan.dest!==from?pace*.4:0);
 };
 if(plan.dest!==from){unit.cell=plan.dest;boardFx(b,{walk:{unit,from}});miniRefresh();b.timer=setTimeout(strike,pace*.7)}
 else strike();
 return plan;
}
function boardEndTurn(b){
 if(boardDraft.battle!==b)return;
 b.turns.push(b.current);Object.assign(b,{current:'',sel:-1,moved:false,busy:true,phase:'foe'});
 const foes=b.state.units.filter(unit=>unit.side==='foe');
 let i=0;
 const step=()=>{
  if(boardDraft.battle!==b)return;
  while(i<foes.length&&foes[i].hp<=0)i++;
  if(!b.state.over&&i<foes.length){boardShow(b,foes[i++],step);return}
  boardTurnEnd(b.state);
  b.busy=false;b.phase='ally';
  if(b.state.over){boardFinish(b);return}
  miniRefresh();
  if(b.auto)boardAutoPhase(b);
 };
 miniRefresh();b.timer=setTimeout(step,boardPace()*.5);
}
function boardAutoPhase(b){
 if(b.busy||b.state.over)return;
 if(b.moved)boardNote(b,boardAlly(b.state,b.sel),-1),boardAlly(b.state,b.sel).done=true;
 Object.assign(b,{sel:-1,moved:false,busy:true});
 const allies=b.state.units.filter(unit=>unit.side==='ally');
 let i=0;
 const step=()=>{
  if(boardDraft.battle!==b)return;
  b.busy=false;
  if(b.state.over){boardFinish(b);return}
  if(!b.auto){miniRefresh();return}
  while(i<allies.length&&(allies[i].hp<=0||allies[i].done))i++;
  if(i>=allies.length){boardEndTurn(b);return}
  b.busy=true;
  const unit=allies[i++],plan=boardShow(b,unit,step);
  b.current+=unit.slot+boardCell(plan.dest)+(plan.target>=0?boardCell(plan.target):'-');
 };
 step();
}
function toggleBoardAuto(){
 const b=boardDraft.battle;
 if(!b||b.state.over)return;
 b.auto=!b.auto;
 if(b.auto&&!b.busy)boardAutoPhase(b);
 miniRefresh();
}
function boardFinish(b){
 const state=b.state,win=state.over==='win',day=b.stage.day,n=b.stage.n;
 if(win)b.turns.push(b.current);
 Object.assign(b,{busy:true,sel:-1,moved:false});
 boardDraft.banner=win?'win':'lose';miniRefresh();
 const fresh=!minigamePeek('petBoard').cleared.includes(n);
 if(win&&fresh)claimBoardWin(day,n,day+'/'+n+'/'+b.code+'/'+b.turns.join('.'));
 else if(win){playSound('victory');notice('연습 승리 · 보상은 단계마다 하루 한 번입니다')}
 else notice(state.over==='time'?BOARD_TURNS+'턴 안에 끝내지 못했습니다. 배치를 바꿔 보세요':'패배 · 배치를 바꿔 다시 도전하세요');
 b.timer=setTimeout(()=>{if(boardDraft.battle===b){stopBoardBattle();if(miniView==='petBoard')miniRefresh()}},1800);
}
function claimBoardWin(day,n,id){
 const paid=result=>{
  if(result){rewardNotice(result.rewards,(n+1)+'단계 승리');playSound('victory')}
  paint();miniRefresh();return !!result;
 };
 if(saveGuard.usesServer())return saveGuard.command('claim',{source:'petBoard',id}).then(paid,()=>paid(null));
 try{const result=economyClaimRule(s,{source:'petBoard',id},Math.random,Date.now());save();return paid(result)}
 catch(error){notice(error.message);return paid(null)}
}
function boardRoleMark(role){return minigameArt(BOARD_ART,'role-'+role,'role-icon',18,18)}
// Two and three stars are shown as small gold stars before the role name.
function boardRank(star){return star>1?'<i class="board-rank" aria-label="'+star+'성">'+'★'.repeat(star)+'</i>':''}
// The board is two layers: thirty tiles that take the taps, and the pieces standing on them.
function boardMap(stage){
 const b=boardDraft.battle,units=boardDraft.draft.units,state=b?b.state:boardOpen(stage,units,boardPlaces());
 const fx=b?.fx&&Date.now()-b.fx.at<520?b.fx:null;
 const picked=b&&b.sel>=0?boardAlly(state,b.sel):null;
 const reach=picked&&!b.moved?boardReach(state,picked):null,aims=picked?boardAims(state,picked):[];
 const tiles=[],place=(cell)=>`left:${boardCol(cell)*100/BOARD_W}%;top:${(boardRow(cell)*100/BOARD_H).toFixed(3)}%`;
 for(let cell=0;cell<BOARD_W*BOARD_H;cell++){
  const row=boardRow(cell),unit=boardAt(state,cell),open=!b&&row>=BOARD_H-2;
  let cls='board-tile',label=(row+1)+'번째 줄 '+(boardCol(cell)+1)+'번째 칸';
  if(state.stars.includes(cell)){cls+=' star';label+=', 별빛 칸'}
  if(open)cls+=' zone';
  if(aims.includes(cell)){cls+=unit.side==='ally'?' mend':' aim';label+=unit.side==='ally'?', 회복할 수 있음':', 공격할 수 있음'}
  else if(reach?.has(cell)&&!unit){cls+=' move';label+=', 이동할 수 있음'}
  if(unit)label+=', '+(unit.side==='ally'?COMPANIONS[unit.pet][0]:BOARD_FOES[unit.kind].name)+' '+BOARD_ROLES[unit.role].name+' 체력 '+unit.hp;
  else label+=', 비어 있음';
  tiles.push(`<button class="${cls}" onclick="tapBoardCell(${cell})" aria-label="${label}">${open&&!unit?'<ui-mark data-shape=plus aria-hidden=true></ui-mark>':''}</button>`);
 }
 const pieces=state.units.filter(unit=>unit.hp>0).map(unit=>{
  const row=boardRow(unit.cell),col=boardCol(unit.cell);
  let cls='board-piece '+unit.side,style=place(unit.cell)+';z-index:'+(row+1);
  if(picked===unit||!b&&unit.side==='ally'&&boardDraft.pick===units[unit.slot].id)cls+=' picked';
  if(unit.star>1)cls+=' rank-'+unit.star;
  if(b&&unit.side==='ally'&&unit.done&&!state.over)cls+=' done';
  if(fx?.walk?.unit===unit){cls+=' walk';style+=`;--dx:${boardCol(fx.walk.from)-col};--dy:${boardRow(fx.walk.from)-row}`}
  if(fx?.lunge?.unit===unit){cls+=' lunge';style+=`;--dx:${Math.sign(boardCol(fx.lunge.to)-col)};--dy:${Math.sign(boardRow(fx.lunge.to)-row)}`}
  const sprite=unit.side==='ally'?'companion-'+unit.pet:BOARD_FOES[unit.kind].art;
  return `<div class="${cls}" style="${style}"><div class="board-figure"><span class="board-hp"><i style="width:${Math.max(0,unit.hp/unit.max*100)}%"></i></span><img src="./assets/actor-poses/${sprite}.webp" width="256" height="256" alt="" decoding="async"><em>${boardRank(unit.star)}${boardRoleMark(unit.role)}${BOARD_ROLES[unit.role].name} <b>${unit.hp}</b></em></div></div>`;
 }).join('');
 const hits=(fx?.hits||[]).map(hit=>`<i class="board-fx ${fx.heal?'heal':'hit'}" style="${place(hit.cell)}">${minigameArt(BOARD_ART,fx.heal?'fx-heal':'fx-hit','',256,256)}</i><b class="board-dmg${fx.heal?' heal':''}" style="${place(hit.cell)}">${hit.change>0?'+':''}${hit.change}</b>`).join('');
 return `<div class="board-map${b?' battle':''}${BOARD_ART?' painted':''}"><div class="board-tiles">${tiles.join('')}</div><div class="board-pieces" aria-hidden="true">${pieces}${hits}</div></div>`;
}
function boardScreen(){
 const stage=boardSync(),b=boardDraft.battle,book=minigamePeek('petBoard'),done=book.cleared.includes(stage.n);
 const draft=boardDraft.draft,placed=boardDraft.place.size;
 const tabs=BOARD_STAGES.map((spec,n)=>`<button class="${stage.n===n?'active':''}" aria-pressed="${stage.n===n}" onclick="selectBoardStage(${n})" ${b?'disabled':''}>${n+1}단계${book.cleared.includes(n)?' <ui-mark data-shape=check aria-hidden=true></ui-mark>':''}</button>`).join('');
 const banner=boardDraft.banner?`<div class="board-banner ${boardDraft.banner}" role="status">${minigameArt(BOARD_ART,'banner-'+boardDraft.banner,'',768,256)}<b>${boardDraft.banner==='win'?'승리':'패배'}</b></div>`:'';
 if(b){
  const state=b.state,picked=b.sel>=0?boardAlly(state,b.sel):null;
  const roster=state.units.filter(unit=>unit.side==='ally').map(unit=>`<button class="board-unit in-battle${b.sel===unit.slot?' picked':''}${unit.hp<=0?' down':unit.done?' used':''}" onclick="pickBoardUnit(${unit.slot})" ${unit.hp<=0?'disabled':''} aria-pressed="${b.sel===unit.slot}" aria-label="${COMPANIONS[unit.pet][0]}, ${BOARD_ROLES[unit.role].name}, 체력 ${unit.hp}">${petArt(unit.pet,'board-pet')}<b>${boardRank(unit.star)}${boardRoleMark(unit.role)}${BOARD_ROLES[unit.role].name}</b><span class="board-hp"><i style="width:${Math.max(0,unit.hp/unit.max*100)}%"></i></span><small>${unit.hp} / ${unit.max}</small></button>`).join('');
  const tip=state.over?'전투가 끝났습니다.':b.phase==='foe'?'적이 움직이는 중입니다.':b.auto?'자동으로 진행하는 중입니다.':
   picked?b.moved?'붉은 칸의 대상을 눌러 공격하거나, 동료를 다시 눌러 대기합니다.':BOARD_ROLES[picked.role].name+' · 파란 칸으로 이동, 붉은 칸을 눌러 공격 · '+BOARD_ROLES[picked.role].tip:
   boardDraft.note||'움직일 동료를 누르세요. 동료마다 한 턴에 이동 한 번, 행동 한 번입니다.';
  return `<section class="board-panel"><div class="board-turn"><b>${Math.min(state.turn,BOARD_TURNS)} / ${BOARD_TURNS}턴</b><span class="${b.phase}">${b.phase==='foe'?'적 차례':'내 차례'}</span><small>남은 적 ${state.units.filter(unit=>unit.side==='foe'&&unit.hp>0).length}</small></div>
  <div class="board-field">${banner}${boardMap(stage)}</div>
  <p class="board-tip" aria-live="polite">${tip}</p>
  <div class="board-bench" style="--n:${Math.max(3,state.units.filter(unit=>unit.side==='ally').length)}">${roster}</div>
  <div class="action-row board-actions">${button(b.auto?'자동 끄기':'자동','toggleBoardAuto()',!!state.over,true)}${button('나가기','leaveBoardBattle()',false,true)}${button('턴 종료','endBoardTurn()',b.busy||b.auto||!!state.over)}</div></section>`;
 }
 // The shop: four cards. A card that would join with a companion already recruited is marked.
 const shop=draft.shop.map((pet,slot)=>{
  if(pet<0)return '<span class="board-card sold">영입함</span>';
  const role=BOARD_ROLES[BOARD_PET_ROLES[pet]],twin=draft.units.some(unit=>unit.pet===pet&&unit.star<BOARD_RANKS.length);
  return `<button class="board-card${twin?' twin':''}" onclick="buyBoardCard(${slot})" ${draft.coins<BOARD_PRICE?'disabled':''} aria-label="${COMPANIONS[pet][0]}, ${role.name}, ${role.tip}, 코인 ${BOARD_PRICE}${twin?', 합체 가능':''}">${twin?'<i class="board-twin">합체</i>':''}${petArt(pet,'board-pet')}<b>${boardRoleMark(BOARD_PET_ROLES[pet])}${role.name}</b><small>${COMPANIONS[pet][0]}</small><em>코인 ${BOARD_PRICE}</em></button>`;
 }).join('');
 const bench=draft.units.map(unit=>{
  const role=BOARD_ROLES[BOARD_PET_ROLES[unit.pet]],used=boardDraft.place.has(unit.id);
  return `<button class="board-unit small${boardDraft.pick===unit.id?' picked':''}${used?' used':''}" onclick="pickBoardUnit(${unit.id})" aria-pressed="${boardDraft.pick===unit.id}" aria-label="${COMPANIONS[unit.pet][0]}, ${unit.star}성 ${role.name}, ${used?'판에 있음':'대기 중'}">${petArt(unit.pet,'board-pet')}<b>${boardRank(unit.star)}${role.name}</b><small>${used?'판 위':'대기'}</small></button>`;
 }).join('');
 const chosen=draft.units.find(unit=>unit.id===boardDraft.pick),picked=chosen?BOARD_ROLES[BOARD_PET_ROLES[chosen.pet]]:null,rank=chosen?BOARD_RANKS[chosen.star-1]:1;
 const tip=picked?picked.name+' · 체력 '+Math.round(picked.hp*rank)+' · '+(picked.shape==='heal'?'회복 ':'공격 ')+Math.round(picked.atk*rank)+' · 이동 '+picked.move+' · '+picked.tip:
  boardDraft.note||(draft.units.length?'내 동료를 누른 뒤 아래 두 줄의 칸을 누르면 자리를 옮깁니다. 적을 누르면 정보를 봅니다.':'상점의 카드를 눌러 동료를 영입하세요. 같은 동료 두 장은 2성으로 합체합니다.');
 return `<section class="board-panel"><div class="tabs board-stages">${tabs}</div>
 <div class="board-field">${banner}${boardMap(stage)}</div>
 <p class="board-tip" aria-live="polite">${tip}</p>
 <div class="board-shop-head"><b class="board-coins">코인 ${draft.coins}</b><small>${done?'받은 보상':'보상'} · ${passRewardText(stage.rewards)}</small>${button('새 카드 · 코인 '+BOARD_REROLL,'rerollBoardShop()',draft.coins<BOARD_REROLL,true)}</div>
 <div class="board-shop">${shop}</div>
 <div class="board-bench owned" aria-label="내 동료">${bench||'<p class="board-empty">영입한 동료가 여기에 모입니다. 판에는 '+stage.limit+'마리까지 세웁니다.</p>'}</div>
 <div class="action-row board-actions">${button('처음부터','resetBoardDraft()',false,true)}${button('자동 배치','autoBoardPlace()',!draft.units.length,true)}${button((done?'연습 시작':'전투 시작')+' · '+placed+' / '+stage.limit,'startBoardBattle()',!placed)}</div></section>`;
}
SCREEN_TABS.dungeon.push(['minigames','미니게임']);
const dungeonScreenBeforeMinigames=dungeonScreen;
dungeonScreen=function(){return screenTab==='minigames'?minigameHub():dungeonScreenBeforeMinigames()};
// Moving to another screen leaves the minigame first.
const navigateBeforeMinigames=navigate;
navigate=function(...args){if(miniStageOpen()){stopBoardBattle();miniView='hub';miniRefresh()}return navigateBeforeMinigames(...args)};
