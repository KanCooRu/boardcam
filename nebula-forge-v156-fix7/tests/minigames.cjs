// The two daily minigames, run against the shipped page scripts.
const assert=require('node:assert/strict');
const {run}=require('./harness.cjs');
function check(label,body){
 run("s=starter();s.classId='warrior';s.wear=0;s.costumes=[0];dungeonRun=null;unlockClassSkills();initializeEconomyClaims(s);miniView='hub'");
 assert.equal(run('(()=>{'+body+'})()'),true,label);
 console.log('PASS',label);
}
const helpers=`
 const act=(op,roll=.5)=>{try{return runEconomyRule(s,'claim',{source:'furnace',id:op},()=>roll,Date.now())}catch(error){return error.message}};
 const fight=id=>{try{return runEconomyRule(s,'claim',{source:'petBoard',id},Math.random,Date.now())}catch(error){return error.message}};
 const solve=stage=>{const foes=boardFoes(stage),k=stage.loans.length;let best=null,wins=0,total=0;
  const walk=cells=>{if(cells.length===k){total++;const allies=cells.map((c,i)=>boardUnit(c,BOARD_PET_ROLES[stage.loans[i]],BOARD_ROLES[BOARD_PET_ROLES[stage.loans[i]]],'ally'));
   if(boardBattle(allies,foes).win){wins++;best=best||cells.slice()}return}for(let c=0;c<9;c++)if(!cells.includes(c)){cells.push(c);walk(cells);cells.pop()}};
  walk([]);return {best,wins,total}};
 const code=(best)=>{const cells=Array(9).fill('-');best.forEach((c,i)=>cells[c]='l'+i);return cells.join('.')};
`;
check('minigames stay locked, greyed and explained until their stage is cleared, then open as a full-screen stage',helpers+`
 activeScreen='dungeon';screenTab='minigames';s.maxStage=20;
 const hub=dungeonScreen();
 if((hub.match(/mini-card locked/g)||[]).length!==2||openMinigame('furnace')!==false||view!=='starLocked'||!tab.includes('클리어하면'))return false;
 closeMenu();
 if(typeof act('start')!=='string'||typeof fight(today()+'/0/l0.-.-.-.-.-.-.-.-')!=='string')return false;
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
check('every board stage is the same for everyone that day and can be won with the lent companions alone',helpers+`
 for(const day of ['2026-11-26','2026-11-27','2026-12-03','2027-01-15'])for(let n=0;n<3;n++){
  const stage=boardStage(day,n);boardStageCache.clear();
  if(JSON.stringify(boardStage(day,n))!==JSON.stringify(stage))return false;
  const found=solve(stage);
  if(!found.best||stage.loans.length!==BOARD_STAGES[n].loans||stage.loans.filter(i=>BOARD_PET_ROLES[i]==='healer').length>1)return false;
  if(n===2&&found.wins/found.total>.5)return false;
 }
 return true;`);
check('the board pays once for a winning formation and refuses losing, borrowed-twice, unowned and stale ones',helpers+`
 s.maxStage=31;const day=today(),stage=boardStage(day,2),best=solve(stage).best;
 const empty=Array(9).fill('-');
 if(typeof fight(day+'/2/'+empty.join('.'))!=='string')return false;
 if(typeof fight(day+'/2/'+['l0','l0',...empty.slice(2)].join('.'))!=='string')return false;
 if(typeof fight(day+'/2/'+['p3',...empty.slice(1)].join('.'))!=='string')return false;
 if(typeof fight('2020-01-01/2/'+code(best))!=='string')return false;
 if(typeof fight(day+'/2/'+['l0','l1','l2','l3','p3','p4',...empty.slice(6)].join('.'))!=='string')return false;
 const iron=s.starIron,shards=s.petShards,gems=s.gems,paid=fight(day+'/2/'+code(best));
 if(paid.rewards?.starIron!==12||s.starIron!==iron+12||s.petShards!==shards+10||s.gems!==gems+30)return false;
 return typeof fight(day+'/2/'+code(best))==='string'&&s.economyClaims.petBoard.cleared.join()==='2'&&s.starIron===iron+12;`);
check('the board opens as a full-screen stage and places, moves and removes companions within the limit',helpers+`
 s.maxStage=31;activeScreen='dungeon';screenTab='minigames';openMinigame('petBoard');
 const stage=boardSync();
 pickBoardUnit('l0');tapBoardCell(0);pickBoardUnit('l1');tapBoardCell(4);
 if(boardDraft.cells[0]!=='l0'||boardDraft.cells[4]!=='l1')return false;
 pickBoardUnit('l0');tapBoardCell(4);
 if(boardDraft.cells[4]!=='l0'||boardDraft.cells[0]!=='l1')return false;
 tapBoardCell(0);
 if(boardDraft.cells[0]!=='-')return false;
 s.pets[3]=1;s.pets[4]=1;
 for(const [unit,cell] of [['l1',1],['l2',2],['l3',3],['p3',5]])if(stage.loans[Number(unit.slice(1))]!==undefined||unit[0]==='p'){pickBoardUnit(unit);tapBoardCell(cell)}
 const placed=boardDraft.cells.filter(c=>c!=='-').length;
 pickBoardUnit('p4');tapBoardCell(8);
 const screen=miniStageHTML();
 return placed===stage.limit&&boardDraft.cells[8]==='-'&&screen.includes('board-grid ally')&&screen.includes('board-grid foe')&&screen.includes('대여');`);
