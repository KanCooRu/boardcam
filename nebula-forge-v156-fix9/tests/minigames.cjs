// The two daily minigames, run against the shipped page scripts.
const assert=require('node:assert/strict');
const {run,ctx}=require('./harness.cjs');
// Timers are kept in a list so that a test can let the battle on screen play itself to the end.
const timers=new Map();let serial=0;
ctx.setTimeout=fn=>{timers.set(++serial,fn);return serial};ctx.clearTimeout=id=>timers.delete(id);
function settle(){for(let i=0;i<4000&&timers.size;i++){const [id,fn]=timers.entries().next().value;timers.delete(id);fn()}}
function check(label,body){
 run("s=starter();s.classId='warrior';s.wear=0;s.costumes=[0];dungeonRun=null;unlockClassSkills();initializeEconomyClaims(s);miniView='hub'");
 assert.equal(run('(()=>{'+body+'})()'),true,label);
 console.log('PASS',label);
}
const helpers=`
 const act=(op,roll=.5)=>{try{return runEconomyRule(s,'claim',{source:'furnace',id:op},()=>roll,Date.now())}catch(error){return error.message}};
 const fight=id=>{try{return runEconomyRule(s,'claim',{source:'petBoard',id},Math.random,Date.now())}catch(error){return error.message}};
 // The companions playing by themselves, written down the way the screen records a battle.
 const record=(stage,place)=>{const st=boardOpen(stage,place),turns=[];
  while(!st.over){let moves='';
   for(const unit of st.units)if(unit.side==='ally'&&unit.hp>0&&!st.over){const plan=boardPlay(st,unit);moves+=unit.slot+boardCell(plan.dest)+(plan.target>=0?boardCell(plan.target):'-')}
   turns.push(moves);if(!st.over)boardFoeTurn(st);boardTurnEnd(st)}
  return {over:st.over,text:turns.join('.')}};
 const solve=stage=>{const random=boardRandom(5),cells=[20,21,22,23,24,25,26,27,28,29];
  for(let i=0;i<300;i++){const place=boardShuffle(cells,random).slice(0,stage.loans.length),out=record(stage,place);
   if(out.over==='win')return {place,code:place.map(boardCell).join(''),text:out.text}}
  return null};
`;
check('minigames stay locked, greyed and explained until their stage is cleared, then open as a full-screen stage',helpers+`
 activeScreen='dungeon';screenTab='minigames';s.maxStage=20;
 const hub=dungeonScreen();
 if((hub.match(/mini-card locked/g)||[]).length!==2||openMinigame('furnace')!==false||view!=='starLocked'||!tab.includes('클리어하면'))return false;
 closeMenu();
 if(typeof act('start')!=='string'||typeof fight(today()+'/0/k--/')!=='string')return false;
 s.maxStage=21;
 if((dungeonScreen().match(/mini-card locked/g)||[]).length!==1||openMinigame('furnace')!==true||!miniStageOpen())return false;
 const stage=miniStageHTML();
 if(!stage.includes('furnace-gauge')||!stage.includes('furnace-scene')||!stage.includes('mini-stage-exit')||!stage.includes('mini-stage-guide'))return false;
 if(!miniGuidePopup.call(null,tab='furnace').includes('과열'))return false;
 closeMinigame();
 if(miniStageOpen()||!dungeonScreen().includes('mini-card'))return false;
 openMinigame('furnace');navigate('home');
 if(miniStageOpen())return false;
 return !s.economyClaims.furnace&&minigamePeek('furnace').runs===0;`);
check('the furnace rolls heat inside the stated range, cools once, and pays purity when the ingot is taken out',helpers+`
 s.maxStage=31;
 if(act('small')!=='제련을 먼저 시작하세요.'||act('start').furnace.runs!==1||typeof act('start')!=='string'||typeof act('take')!=='string')return false;
 const low=act('large',0).furnace,high=act('large',.999).furnace,small=act('small',0).furnace;
 if(low.rolled!==16||high.rolled!==26||small.rolled!==8||small.heat!==50||small.purity!==12)return false;
 if(act('cool').furnace.heat!==35||typeof act('cool')!=='string')return false;
 const iron=s.starIron,stones=s.stones,gems=s.gems,out=act('take');
 return out.furnace.ended===true&&out.rewards.starIron===4&&out.rewards.stones===120&&s.starIron===iron+4&&s.stones===stones+120&&s.gems===gems&&s.economyClaims.furnace.run===null;`);
check('an overheated furnace still pays half, and three runs a day are free of any cost',helpers+`
 s.maxStage=31;const gems=s.gems,gold=s.gold;
 act('start');for(let i=0;i<3;i++)if(act('large',.999).furnace.burst)return false;
 const iron=s.starIron,stones=s.stones,burst=act('large',.999);
 if(!burst.furnace.burst||burst.furnace.heat!==104||burst.rewards.starIron!==3||burst.rewards.stones!==100||s.starIron!==iron+3||s.stones!==stones+100)return false;
 act('start');act('small');act('take');act('start');act('small');act('take');
 return act('start')==='오늘의 제련을 모두 마쳤습니다.'&&s.gems===gems&&s.gold===gold&&s.economyClaims.furnace.runs===3;`);
check('every board stage is the same for everyone that day and can be won with the companions it gives',helpers+`
 for(const day of ['2026-11-26','2026-11-27','2026-12-03','2027-01-15'])for(let n=0;n<3;n++){
  const stage=boardStage(day,n);boardStageCache.clear();
  if(JSON.stringify(boardStage(day,n))!==JSON.stringify(stage))return false;
  if(stage.loans.length!==BOARD_STAGES[n].loans||stage.loans.filter(i=>BOARD_PET_ROLES[i]==='healer').length>1)return false;
  if(stage.foes.length!==BOARD_STAGES[n].foes.length||stage.foes.some(foe=>boardRow(foe.cell)>1)||new Set(stage.foes.map(foe=>foe.cell)).size!==stage.foes.length)return false;
  if(stage.stars.length!==BOARD_STAGES[n].stars||stage.stars.some(cell=>boardRow(cell)<2||boardRow(cell)>3))return false;
  const found=solve(stage);
  if(!found||boardReplay(stage,found.place,found.text).over!=='win')return false;
 }
 return true;`);
check('the battle rules: walking is blocked by units, each role reaches what it says, and a star tile adds half',helpers+`
 const stage={loans:[6,5,0,2],stars:[6],foes:[{kind:'guard',cell:7,hp:50,atk:5},{kind:'striker',cell:2,hp:30,atk:13},{kind:'sniper',cell:8,hp:20,atk:9}]};
 const st=boardOpen(stage,[16,17,27,26]),ally=slot=>boardAlly(st,slot),foe=cell=>boardAt(st,cell);
 const reach=boardReach(st,ally(0));
 if(reach.get(6)!==2||reach.get(12)!==2||reach.has(17)||reach.has(7)||reach.has(1)||reach.get(16)!==0)return false;
 // The piercer on tile 17 looks up its column: tiles 12, 7 and 2. Both enemies there are struck, the one beside is not.
 if(boardAims(st,ally(1)).sort().join()!=='2,7'||boardAims(st,ally(0)).length)return false;
 boardCommand(st,1,17,7);
 if(foe(7).hp!==42||foe(2).hp!==22||foe(8).hp!==20||!ally(1).done)return false;
 try{boardCommand(st,1,17,7);return false}catch(error){}
 // From the star tile the guard hits for 6 x 1.5 = 9.
 boardCommand(st,0,6,7);
 if(foe(7).hp!==33)return false;
 // The blast companion cannot reach from four tiles away; from three it hits its target and the enemies beside it.
 try{boardCommand(st,2,27,7);return false}catch(error){}
 if(ally(2).cell!==27||ally(2).done)return false;
 boardCommand(st,2,22,7);
 if(foe(7).hp!==26||foe(8).hp!==13||foe(2).hp!==15||ally(0).hp!==60)return false;
 // A healer mends a hurt friend within three tiles.
 ally(0).hp=40;
 if(boardAims(st,ally(3)).includes(6)||!boardAims(st,ally(3),21).includes(6))return false;
 boardCommand(st,3,21,6);
 if(ally(0).hp!==48)return false;
 boardFoeTurn(st);boardTurnEnd(st);
 return st.turn===2&&st.units.every(unit=>!unit.done)&&!st.over;`);
check('the board pays once for a recorded win; owned companions take no part, and impossible, unfinished or stale records are refused',helpers+`
 s.maxStage=31;const day=today(),stage=boardStage(day,2),won=solve(stage),before=JSON.stringify(s.economyClaims);
 const refused=id=>typeof fight(id)==='string';
 if(!refused(day+'/2/----/')||!refused(day+'/2/'+won.code)||!refused(day+'/2/'+won.code.slice(1)+'/'+won.text))return false;
 const twice=won.code[0]+won.code[0]+won.code.slice(2),outside=boardCell(12)+won.code.slice(1);
 if(!refused(day+'/2/'+twice+'/'+won.text)||!refused(day+'/2/'+outside+'/'+won.text)||!refused(day+'/2/p3--/'+won.text))return false;
 if(!refused('2020-01-01/2/'+won.code+'/'+won.text))return false;
 // A record that stops early, one that walks too far, one that hits from out of reach, and one that moves a companion twice.
 const turns=won.text.split('.');
 if(!refused(day+'/2/'+won.code+'/'+turns.slice(0,-1).join('.'))||!refused(day+'/2/'+won.code+'/'))return false;
 const slot=won.code.split('').findIndex(letter=>letter!=='-'),from=won.place[slot];
 if(!refused(day+'/2/'+won.code+'/'+slot+boardCell(from-20)+'-')||!refused(day+'/2/'+won.code+'/'+slot+boardCell(from)+boardCell(stage.foes[0].cell)))return false;
 if(!refused(day+'/2/'+won.code+'/'+turns[0].slice(0,3)+turns[0].slice(0,3)+turns[0].slice(3)+'.'+turns.slice(1).join('.')))return false;
 if(!refused(day+'/2/'+won.code+'/'+Array(BOARD_TURNS+1).fill('').join('.')))return false;
 if(JSON.stringify(s.economyClaims)!==before&&s.economyClaims.petBoard?.cleared.length)return false;
 const iron=s.starIron,shards=s.petShards,gems=s.gems,paid=fight(day+'/2/'+won.code+'/'+won.text);
 if(paid.rewards?.starIron!==12||s.starIron!==iron+12||s.petShards!==shards+10||s.gems!==gems+30)return false;
 return refused(day+'/2/'+won.code+'/'+won.text)&&s.economyClaims.petBoard.cleared.join()==='2'&&s.starIron===iron+12;`);
check('the board opens as a full-screen stage and places, swaps and removes the day\'s companions on the two bottom rows',helpers+`
 s.maxStage=31;activeScreen='dungeon';screenTab='minigames';openMinigame('petBoard');
 const stage=boardSync();
 pickBoardUnit(0);tapBoardCell(20);pickBoardUnit(1);tapBoardCell(26);
 if(boardDraft.place[0]!==20||boardDraft.place[1]!==26)return false;
 tapBoardCell(20);tapBoardCell(26);
 if(boardDraft.place[0]!==26||boardDraft.place[1]!==20)return false;
 pickBoardUnit(2);tapBoardCell(12);
 if(boardDraft.place[2]!==-1)return false;
 boardDraft.pick=-1;tapBoardCell(26);tapBoardCell(26);
 if(boardDraft.place[0]!==-1)return false;
 s.pets[3]=1;s.pets[4]=1;autoBoardPlace();
 const screen=miniStageHTML();
 if(boardDraft.place.some(cell=>cell<20)||new Set(boardDraft.place).size!==stage.loans.length)return false;
 if((screen.match(/class="board-unit/g)||[]).length!==stage.loans.length||screen.includes('내 동료'))return false;
 if((screen.match(/class="board-tile[ "]/g)||[]).length!==30||(screen.match(/class="board-piece ally/g)||[]).length!==stage.loans.length||(screen.match(/class="board-piece foe/g)||[]).length!==stage.foes.length)return false;
 clearBoard();
 return boardDraft.place.every(cell=>cell<0)&&startBoardBattle()===false;`);
// The battle on screen: moves made by hand are recorded, the enemy answers, and the finished record is what gets paid.
run("s=starter();s.classId='warrior';s.wear=0;s.costumes=[0];dungeonRun=null;unlockClassSkills();initializeEconomyClaims(s);miniView='hub';s.maxStage=31;activeScreen='dungeon';screenTab='minigames';openMinigame('petBoard')");
const picked=run(`(()=>{const random=boardRandom(5),cells=[20,21,22,23,24,25,26,27,28,29],stage=boardSync();
 for(let i=0;i<300;i++){const place=boardShuffle(cells,random).slice(0,stage.loans.length);if(boardAutoBattle(stage,place).over==='win'){boardDraft.place=place;return true}}return false})()`);
assert.equal(picked,true,'a winning placement exists for today');
assert.equal(run("startBoardBattle()&&miniStageHTML().includes('board-map battle')&&miniStageHTML().includes('내 차례')"),true);
// First turn by hand: every companion does what it would do by itself, through taps.
assert.equal(run(`(()=>{const b=boardDraft.battle;
 for(const unit of b.state.units.filter(unit=>unit.side==='ally')){
  const plan=boardThink(b.state,unit),from=unit.cell;
  tapBoardCell(from);
  if(b.sel!==unit.slot)return 'select';
  if(!miniStageHTML().includes('board-tile move'))return 'no move tiles';
  if(plan.dest!==from)tapBoardCell(plan.dest);
  if(plan.target>=0)tapBoardCell(plan.target);
  else if(plan.dest===from)tapBoardCell(from);
  else if(!unit.done)tapBoardCell(unit.cell);
  if(unit.cell!==plan.dest)return 'cell';
 }
 return b.current.length%3===0&&b.current.length>0})()`),true);
run("endBoardTurn()");settle();
assert.equal(run("(()=>{const b=boardDraft.battle;return !!b&&b.state.turn===2&&b.turns.length===1&&b.phase==='ally'&&!b.busy})()"),true,'the enemy has answered and the second turn began');
// A tap while the companions play by themselves is ignored, and the battle then runs to its end.
run("toggleBoardAuto()");
assert.equal(run("(()=>{const b=boardDraft.battle,before=b.current;tapBoardCell(b.state.units[0].cell);return b.auto&&b.sel===-1&&b.current===before})()"),true);
const iron=run('s.starIron');
settle();
assert.equal(run("boardDraft.battle===null&&s.economyClaims.petBoard.cleared.join()==='0'"),true,'the recorded battle was accepted');
assert.equal(run('s.starIron'),iron+5);
// A cleared stage can still be played for practice, without a second reward.
run("startBoardBattle();toggleBoardAuto()");settle();
assert.equal(run("boardDraft.battle===null&&s.economyClaims.petBoard.cleared.length===1"),true);
assert.equal(run('s.starIron'),iron+5);
// Leaving in the middle stops the battle.
run("startBoardBattle();toggleBoardAuto();closeMinigame()");settle();
assert.equal(run("boardDraft.battle===null&&!miniStageOpen()"),true);
console.log('PASS a battle played on screen by hand and by itself is recorded, paid once, replayable for practice, and stops on leaving');
