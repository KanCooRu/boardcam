import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {rankedAction} from '../dist/server/rank-simulation.js';
import {saveRequests,expectStatus} from './save-worker-fixture.mjs';

// Device uploads: a first record, values only the server issues, and values play raises on the device.
const dir=new URL('../drizzle/',import.meta.url);
const files=readdirSync(dir).filter(name=>name.endsWith('.sql')).sort();
function database(skip){
 const db=new DatabaseSync(':memory:');db.exec('PRAGMA foreign_keys=ON');
 for(const name of files)if(name!==skip)db.exec(readFileSync(new URL(name,dir),'utf8'));
 return db;
}
const clock=Date.now;
let now=Date.UTC(2026,10,24,3);Date.now=()=>now;
const HOUR=3600000;
const db=database(),request=saveRequests(db);
const post=(owner,baseRevision,state)=>request(owner,'POST',{baseRevision,data:JSON.stringify(state)});
const name=(owner,label)=>expectStatus(200,request(owner,'POST',{action:'claim',name:label},{path:'/api/nickname'}));
const stored=owner=>JSON.parse(db.prepare('SELECT data FROM player_saves WHERE owner=?').get(owner).data);
const revision=owner=>db.prepare('SELECT revision FROM player_saves WHERE owner=?').get(owner).revision;
const newGame=job=>rankedAction(null,{action:'register',job},now).state;
const command=(owner,path,input)=>request(owner,'POST',input,{path,headers:{'If-Match':String(revision(owner)),'X-Nebula-Request-Id':crypto.randomUUID()}});
async function upload(owner,edit){
 const state=stored(owner);edit(state);now+=6000;
 return {sent:state,saved:JSON.parse((await expectStatus(200,post(owner,revision(owner),state))).body.data)};
}
try{
 await name('honest','정직한기사');await name('forger','조작한기사');
 const honest=newGame('mage');Object.assign(honest,{stage:52,maxStage:52,campaignCleared:51,kills:2,gold:honest.gold+900,nickname:'정직한기사'});
 const first=await expectStatus(200,post('honest',0,honest));
 assert.equal(first.body.data,JSON.stringify(honest));
 const forged=newGame('archer');
 Object.assign(forged,{gems:9999999,forgeGuards:999,summonTickets:500,nickname:'조작한기사',soundVolume:20});
 for(const weapon of Object.values(forged.weapons))Object.assign(weapon,{plus:25,peakPlus:25});
 const replaced=JSON.parse((await expectStatus(200,post('forger',0,forged))).body.data),plain=newGame('archer');
 assert.deepEqual([replaced.classId,replaced.gems,replaced.forgeGuards||0,replaced.summonTickets,replaced.weapons.archer.plus],
  ['archer',plain.gems,0,plain.summonTickets,0]);
 assert.deepEqual([replaced.nickname,replaced.soundVolume],['조작한기사',20]);
 assert.deepEqual(stored('forger'),replaced);
 console.log('PASS a new game is stored as sent; a first record carrying goods the server never issued restarts with its class and settings');

 // Server-issued wallets do not move on the device. Play-earned ones rise only by their allowance.
 const base=stored('honest');
 const tampered=await upload('honest',s=>{s.petTickets+=10;s.petShards+=500;s.summonTickets+=500;s.rouletteCoins+=300;s.starIron+=100000;s.gold+=5e8;s.level+=900;s.maxStage+=600});
 const got=tampered.saved;
 assert.equal(got.petTickets,base.petTickets);assert.equal(got.petShards,base.petShards);
 assert.equal(got.summonTickets,base.summonTickets+22);assert.equal(got.rouletteCoins,base.rouletteCoins+4);
 assert.ok(got.starIron>base.starIron&&got.starIron-base.starIron<2000,'starIron '+(got.starIron-base.starIron));
 assert.ok(got.gold>base.gold&&got.gold-base.gold<1e7,'gold '+(got.gold-base.gold));
 assert.ok(got.level-base.level<60&&got.maxStage>base.maxStage&&got.maxStage-base.maxStage<=100);
 const again=await upload('honest',s=>{s.summonTickets+=500;s.starIron+=100000});
 assert.equal(again.saved.summonTickets,got.summonTickets);assert.ok(again.saved.starIron-got.starIron<=1);
 now+=24*HOUR;
 const nextDay=await upload('honest',s=>{s.summonTickets+=500});
 assert.equal(nextDay.saved.summonTickets,again.saved.summonTickets+22);
 const play=await upload('honest',s=>{s.gold+=5000;s.ore+=40;s.stones+=12;s.kills+=3;s.xp=(s.xp||0)+90});
 assert.deepEqual(play.saved,play.sent);
 // Dismantling gear pays stones and star iron for the items made, and winning new dungeon tiers pays their prizes.
 now+=HOUR;
 const craft=await upload('honest',s=>{s.ore-=30;s.crafted+=30;s.stones+=150;s.starIron+=30});
 // The same items cannot be dismantled twice: a second claim falls back on the day's allowance.
 const padded=await upload('honest',s=>{s.starIron+=100000;s.stones+=1e7});
 assert.ok(padded.saved.starIron-craft.saved.starIron<1000&&padded.saved.stones-craft.saved.stones<5e5);
 assert.deepEqual(craft.saved,craft.sent);
 const used=await upload('honest',s=>{s.daily.admissions={...s.daily.admissions,armory:2}});
 const refund=await upload('honest',s=>{s.daily.admissions.armory=0});
 assert.equal(used.saved.daily.admissions.armory,2);assert.equal(refund.saved.daily.admissions.armory,2);
 // Constellation engraving: closed before Hard is in reach, then limited by the star iron the record holds.
 const closed=await upload('honest',s=>{s.constellation=200});
 assert.equal(closed.saved.constellation||0,0);
 await upload('honest',s=>{s.campaignCleared=Math.max(s.campaignCleared,s.maxStage-1)});
 const reach=stored('honest');
 if(reach.campaignCleared>=200){
  const paid=await upload('honest',s=>{s.constellation=200});
  assert.ok(paid.saved.constellation<=Math.floor(reach.starIron/60)+40,'constellation '+paid.saved.constellation);
 }
 // Minigame records sit in the server's ledger: it rolls the furnace itself, and a device cannot cool it by editing the record.
 const lit=await expectStatus(200,command('honest','/api/reward/claim',{source:'furnace',id:'start'}));
 assert.equal(lit.body.result.furnace.runs,1);
 const piece=await expectStatus(200,command('honest','/api/reward/claim',{source:'furnace',id:'large'}));
 assert.ok(piece.body.result.furnace.rolled>=16&&piece.body.result.furnace.rolled<=26,'rolled '+piece.body.result.furnace.rolled);
 const cooled=stored('honest');cooled.economyClaims.furnace.run.heat=0;
 await expectStatus(409,post('honest',revision('honest'),cooled));
 const lost=await command('honest','/api/reward/claim',{source:'petBoard',id:stored('honest').day+'/0/a/0/k/'});
 assert.equal(lost.status,422);
 await expectStatus(409,post('honest',revision('honest'),{...stored('honest'),gems:stored('honest').gems+1}));
 console.log('PASS tickets, coins and materials stop at their allowance, refill with time, and ordinary play, dismantling and spent entries pass unchanged');

 // Rewards need their condition in the stored record.
 for(const [source,id] of [['quest',0],['achievement',1],['newbie',0],['orderDaily','patrol'],['chestDaily',4],['orderWeekly','temper']]){
  const before=db.prepare('SELECT revision,data FROM player_saves WHERE owner=?').get('honest');
  const denied=await command('honest','/api/reward/claim',{source,id});
  assert.equal(denied.status,422,source+' '+denied.status);
  assert.deepEqual(db.prepare('SELECT revision,data FROM player_saves WHERE owner=?').get('honest'),before);
 }
 await upload('honest',s=>{s.kills=Math.max(s.kills,10)});
 const quest=await expectStatus(200,command('honest','/api/reward/claim',{source:'quest',id:0}));
 assert.equal(quest.body.result.rewards.gems,100);
 console.log('PASS quests, achievements, newbie missions, orders and activity chests pay only once earned');

 // Limited-roulette coins: one for each listed mission, however long the stored list is.
 const eventId=Object.keys(stored('honest').costumeEvents||{})[0];
 if(eventId){
  const gems=stored('honest').gems;
  await upload('honest',s=>{s.maxStage=Math.max(s.maxStage,60);const book=s.costumeEvents[eventId].missions;book.claimed=Array.from({length:400},(_,i)=>i%2?'kills':'not-a-mission-'+i)});
  const state=stored('honest');
  if(state.maxStage>50){
   const spin=await command('honest','/api/draw',{kind:'roulette',count:10});
   assert.ok(spin.status===422||spin.status===200&&JSON.parse(spin.body.data).gems===gems-4500,'ten spins are not free: '+spin.status);
  }
 }
 console.log('PASS a padded mission list buys no limited-roulette spins');

 // The tower ranking records no more floors than the server's own replay of the stored character, plus a small margin.
 const run=(await expectStatus(200,command('honest','/api/trial/start',{}))).body.result;
 now+=25000;
 const finish=(await expectStatus(200,command('honest','/api/trial/finish',{runId:run.runId,score:500999,floors:500}))).body.result;
 const board=db.prepare('SELECT best_score AS score,best_floors AS floors FROM trial_weekly WHERE owner=?').get('honest');
 assert.equal(finish.ranked,true);assert.ok(board.floors>=3&&board.floors<=12,'floors '+board.floors);
 assert.equal(board.score,board.floors*1000+999);assert.equal(finish.bestFloors,board.floors);
 console.log('PASS a tower score beyond the stored character is entered at the reachable floor');

 // Without the allowance table (migration not yet applied) saving still works.
 const bare=database('0013_progress_limits.sql'),legacy=saveRequests(bare);
 await expectStatus(200,legacy('early','POST',{action:'claim',name:'이전서버'},{path:'/api/nickname'}));
 const early=newGame('warrior');
 const kept=await expectStatus(200,legacy('early','POST',{baseRevision:0,data:JSON.stringify(early)}));
 assert.equal(kept.body.data,JSON.stringify(early));
 now+=6000;early.gold+=5e8;
 assert.equal((await expectStatus(200,legacy('early','POST',{baseRevision:1,data:JSON.stringify(early)}))).body.data,JSON.stringify(early));
 bare.close();
 console.log('PASS saving continues unchanged where the allowance table has not been created');
}finally{Date.now=clock;db.close()}
