const assert=require('node:assert/strict');
const {run}=require('./harness.cjs');
function scenario(name,fn){
 run("s=starter();s.classId='warrior';s.autoEquip=false;dungeonRun=null;challengeResult=null;resultSnapshot=null;bagSalvageSelection=null;view='';tab='';resetDay();");
 assert.equal(run('('+fn.toString()+')()'),true,name);
 console.log('PASS',name);
}
scenario('all 100 items are pickable by distinct ID even after another craft',()=>{
 s.ore=150;forgeCraft(100,true);
 const batch=lastLoot.map(g=>({...g})),[a,b,c]=batch.map(g=>g.id);
 view='loot';resultSnapshot={view,loot:batch,selected:new Set(),action:{kind:'forge',n:100}};
 if((lootUI().match(/data-gear-id=/g)||[]).length!==100)return false;
 forgeCraft(3,true);if(toggleGearPick(lastLoot[0].id))return false;
 for(const id of [a,b,c,c])if(!toggleGearPick(id))return false;
 const before=s.stones,sum=s.gear.filter(g=>[a,b].includes(g.id)).reduce((total,g)=>total+salvageStones(g),0);
 if(!salvagePicked()||salvagePicked())return false;
 return s.stones===before+sum&&batch[0].salvaged&&batch[1].salvaged&&!batch[2].salvaged&&s.gear.some(g=>g.id===c)&&lastLoot.every(g=>!g.salvaged)&&resultSnapshot.action.n===100;
});
scenario('high-rarity duplicates, upgrade payout and lock or equip changes',()=>{
 const base={id:'a',p:0,r:9,plus:3,set:0,locked:false};
 s.gear.push(...['a','b','c','d'].map(id=>({...base,id})));
 view='inventory';startBagSelection();for(const id of ['a','b','c','d'])toggleGearPick(id);
 s.equipped[0]='b';s.gear.find(g=>g.id==='c').locked=true;
 const before=s.stones;if(!salvagePicked()||salvagePicked())return false;
 const saved=migrate(JSON.parse(JSON.stringify(s)));
 return saved.stones===before+58&&saved.gear.some(g=>g.id==='b')&&saved.gear.some(g=>g.id==='c')&&!saved.gear.some(g=>['a','d'].includes(g.id));
});
scenario('bag selects visible eligible gear, updates totals and clears hidden picks on filter changes',()=>{
 const base={p:0,r:2,plus:1,set:0,locked:false};
 s.gear=['a','b','worn','locked','boots','otherSet'].map(id=>({...base,id,
  p:id==='boots'?5:0,set:id==='otherSet'?1:0,locked:id==='locked'}));
 s.equipped[0]='worn';view='inventory';inventoryPart=inventorySet=-1;startBagSelection();
 toggleGearPick('a');toggleBagPickAll();
 const ids=bagSalvageSelection;
 if(ids.size!==4||ids.has('worn')||ids.has('locked')||!inventoryPopup().includes('전체 해제'))return false;
 toggleBagPickAll();if(ids.size||salvagePicked())return false;
 toggleBagPickAll();inventoryFilter(0);filterInventorySet(0);
 if(bagSalvageSelection.size!==2||toggleGearPick('boots')||toggleGearPick('otherSet'))return false;
 toggleGearPick('b');if(!inventoryPopup().includes('전체 선택'))return false;
 toggleBagPickAll();s.gear.find(g=>g.id==='b').locked=true;
 const before=s.stones;if(!salvagePicked()||salvagePicked()||s.stones!==before+9)return false;
 startBagSelection();toggleBagPickAll();
 const empty=inventoryPopup(),bulk=empty.match(/<button[^>]*data-bag-pick-all[^>]*>/);
 return s.gear.length===5&&s.gear.every(g=>g.id!=='a')&&bagSalvageSelection.size===0&&bulk[0].includes('disabled');
});
scenario('bag dismantle hides equipped copies, keeps locked spares visible and restores equipped on cancel',()=>{
 const base={p:0,r:1,plus:0,set:0};
 s.gear=['equipped','spare','locked'].map(id=>({...base,id,locked:id==='locked'}));
 s.equipped[0]='equipped';inventoryPart=inventorySet=-1;view='inventory';
 if(!inventoryPopup().includes('onclick="startBagSelection()">분해</button>'))return false;
 startBagSelection();const markup=inventoryPopup();
 if(markup.includes('data-gear-id="equipped"')||!markup.includes('data-gear-id="spare"')||!markup.includes('data-gear-id="locked"'))return false;
 if(!/취소<\/button>.*전체 선택<\/button>.*>분해<\/button>/.test(markup))return false;
 toggleBagPickAll();if(bagSalvageSelection.size!==1||!bagSalvageSelection.has('spare'))return false;
 s.gear=s.gear.filter(g=>g.id==='equipped');if(!inventoryPopup().includes('미착용 장비가 없습니다'))return false;
 cancelBagSelection();return inventoryPopup().includes('data-gear-id="equipped"');
});
scenario('daily dungeon clear, retry and final tier across all three dungeons',()=>{
 s.maxStage=6;
 for(let i=0;i<3;i++){
  const pass=ENTRY_PASSES[MATERIAL_ENTRIES[i]].resource;s[pass]=2;s.dungeonLevel[i]=2;s.dungeonSelected[i]=2;
  startDungeon(i);finishDungeon(true);
  if(s.dungeonSelected[i]!==3||!challengePopup().includes('3단계 도전')||!continueDungeonResult()||dungeonRun.i!==i||dungeonRun.n!==3||continueDungeonResult()||s[pass]!==2||entryAvailability(MATERIAL_ENTRIES[i]).free!==3)return false;
  finishDungeon(false);if(!challengePopup().includes('3단계 재도전')||!continueDungeonResult()||dungeonRun.n!==3)return false;
  finishDungeon(false);s.dungeonLevel[i]=s.dungeonSelected[i]=10;startDungeon(i);finishDungeon(true);
  if(!challengePopup().includes('11단계 도전')||!continueDungeonResult()||dungeonRun.n!==11)return false;
  finishDungeon(true);if(s[pass]!==2||entryAvailability(MATERIAL_ENTRIES[i]).free!==1||s.dungeonSelected[i]!==12||migrate(JSON.parse(JSON.stringify(s))).dungeonLevel[i]!==12)return false;
 }
 return true;
});
scenario('old dungeon saves advance to unlocked stage once, manual selections survive reload',()=>{
 const raw=JSON.parse(JSON.stringify(s));delete raw.dungeonSelectionVersion;raw.dungeonLevel=[2,3,10];raw.dungeonSelected=[1,2,2];
 s=migrate(raw);if(String(s.dungeonSelected)!=='2,3,10')return false;
 selectDifficulty(1,-1);s=migrate(JSON.parse(JSON.stringify(s)));return String(s.dungeonSelected)==='2,2,10';
});
scenario('retired tower entries and stale results cannot charge, reward, or relaunch',()=>{
 s.maxStage=1200;s.towerFloor=49;s.towerBest=79;
 challengeResult={mode:'tower',n:50,win:true,rewards:{gems:125}};view='challengeResult';
 const before=JSON.stringify(s);
 if(startTower(50)||continueTower()||continueDungeonResult()||dungeonRun||dungeonFollowup(challengeResult))return false;
 if(/무한의 탑|continueDungeonResult|50층/.test(challengePopup()))return false;
 for(const win of [true,false]){
  dungeonRun={mode:'tower',i:0,n:50,hp:1,maxHp:1,time:30};
  finishDungeon(win);
  if(dungeonRun||JSON.stringify(s)!==before)return false;
 }
 return JSON.stringify(s)===before;
});
scenario('boss rush offers only the payable next action',()=>{
 s.maxStage=31;
 startRush();finishDungeon(true);if(!continueDungeonResult()||s.daily.rush!==2)return false;
 finishDungeon(true);if(!continueDungeonResult())return false;finishDungeon(true);
 return s.daily.rush===3&&challengePopup().includes('입장권 부족')&&!continueDungeonResult();
});
scenario('all classes have twelve unique artwork coordinates and only equipped slots show their level',()=>{
 const images=new Set();
 for(let k=0;k<60;k++){const art=skillArt(k);if(images.has(art))return false;images.add(art)}
 const g=equippedItem(0),markup=equipmentTile(g,g);
 return images.size===60&&!markup.includes('tile-level')&&equipmentScreen().includes('tile-level">+0');
});
scenario('the last bag slot is craftable and all 500 items survive reload',()=>{
 s.gear=Array.from({length:499},(_,i)=>({id:'qa_'+i,p:1,r:2,plus:0,set:0,locked:i===498}));
 s.equipped={1:'qa_498'};s.ore=20;
 if(forgeCraft(10,true)!==1||s.ore!==19||s.gear.length!==500||forgeCraft(1,true)!==0)return false;
 const saved=migrate(JSON.parse(JSON.stringify(s)));
 return saved.gear.length===500&&saved.equipped[1]==='qa_498'&&saved.gear.at(-1).id===lastLoot[0].id&&inventoryPopup().includes('500/500');
});
