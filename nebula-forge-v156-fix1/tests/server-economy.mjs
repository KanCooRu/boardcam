import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {rankedAction} from '../dist/server/rank-simulation.js';
import {saveRequests,expectStatus} from './save-worker-fixture.mjs';

const db=new DatabaseSync(':memory:');db.exec('PRAGMA foreign_keys=ON');
const dir=new URL('../drizzle/',import.meta.url);
for(const f of readdirSync(dir).filter(f=>f.endsWith('.sql')).sort())db.exec(readFileSync(new URL(f,dir),'utf8'));
const request=saveRequests(db),owner='economic-owner',other='economic-other',nowFn=Date.now;
let now=Date.UTC(2026,10,24,11);Date.now=()=>now;
const original=Object.getOwnPropertyDescriptor(crypto,'getRandomValues');
let random=.04,rolls=0;
Object.defineProperty(crypto,'getRandomValues',{configurable:true,value:array=>{rolls++;return array.fill(Math.floor(random*0x100000000))}});
function seed(account,edit){
 const state=rankedAction(null,{action:'register',job:'warrior'},now).state;
 Object.assign(state,{stage:51,maxStage:51,campaignCleared:50,gems:8000,gold:150000,starIron:5000,stones:5000,
  summonTickets:10,petTickets:10,rouletteCoins:10,forgeGuards:1,shards:1500,kills:5000});
 // Ten forge attempts this week and one finished daily order: the weekly order and the first daily chest are earned.
 state.adventureOrders={daily:{period:state.day,tier:0,count:{},claimed:{supply:true},chests:{}},
  weekly:{period:state.weekly.key,tier:0,count:{weaponForge:10},claimed:{},chests:{}}};
 edit?.(state);
 db.prepare('INSERT INTO nicknames(owner,name_key,name) VALUES(?,?,?)').run(account,account,account);
 const values=[account,1,JSON.stringify(state),now-10000];
 db.prepare('INSERT INTO player_saves(owner,revision,data,updated_at) VALUES(?,?,?,?)').run(...values);
 db.prepare('INSERT INTO player_save_history(owner,revision,data,saved_at) VALUES(?,?,?,?)').run(...values);
 return state;
}
const routes={draw:'/api/draw',forge:'/api/forge/enhance',shop:'/api/shop/buy',claim:'/api/reward/claim'};
const latest=(account=owner)=>db.prepare('SELECT revision,data,updated_at AS updatedAt FROM player_saves WHERE owner=?').get(account);
const command=(action,input,{id=crypto.randomUUID(),revision,account=owner,...options}={})=>{
 const headers={'X-Nebula-Request-Id':id,'If-Match':String(revision??latest(account)?.revision??0)};
 return request(account,'POST',input,{path:routes[action],headers,...options});
};
async function paid(action,input,opts={}){
 const account=opts.account||owner,revision=latest(account).revision;
 const {body}=await expectStatus(200,command(action,input,opts)),stored=latest(account);
 assert.equal(body.revision,revision+1);assert.equal(body.data,stored.data);assert(body.result);
 const refreshed=await expectStatus(200,request(account));
 assert.deepEqual(refreshed.body,{revision:body.revision,data:body.data,updatedAt:body.updatedAt});
 return {state:JSON.parse(body.data),receipt:body.result};
}
async function denied(action,input,opts={}){
 const before=latest(opts.account||owner),response=await command(action,input,opts);
 assert(response.status>=400&&response.status<500,action+' '+response.status+' '+JSON.stringify(input));
 assert.deepEqual(latest(opts.account||owner),before);return response;
}
try{
 seed(owner,s=>{
  Object.assign(s.weapons.warrior,{plus:24,peakPlus:24,skin:5,xp:15});
  s.highestGearPlus=24;s.normalCostumeRolls=499;
  const event=s.costumeEvents['phoenix-202611'];event.classes.warrior.pity=499;s.royalTitlePity=299;
  s.kills=100;s.season.points=900;
  s.attendanceBook={last:'2026-11-24',pending:1};
  s.monthlyAttendance={'2026-11':{count:0,earned:1,start:24,last:''}};
  Object.assign(s.guidance,{status:'active',step:6,completeAt:now-1,rewarded:false});
 });
 seed(other,s=>{s.gems=0;s.maxStage=s.stage=1;s.summonTickets=s.petTickets=0;s.starIron=0});
 const guardId=crypto.randomUUID(),commandRevision=latest().revision,before=JSON.parse(latest().data);
 const protectedHit=await paid('forge',{useGuard:true},{id:guardId});
 assert.equal(protectedHit.receipt.outcome,'keep');assert.equal(protectedHit.receipt.protected,true);
 assert.equal(protectedHit.state.forgeGuards,0);assert.equal(protectedHit.state.weapons.warrior.plus,24);
 const consumedRandom=rolls;
 const retry=await expectStatus(200,command('forge',{useGuard:true},{id:guardId,revision:commandRevision}));
 assert.equal(retry.body.revision,latest().revision);assert.deepEqual(retry.body.result,protectedHit.receipt);assert.equal(rolls,consumedRandom);
 await denied('forge',{useGuard:false},{id:guardId});
 const broken=await paid('forge',{useGuard:false});
 assert.equal(broken.receipt.outcome,'destroy');assert.equal(broken.state.weapons.warrior.plus,0);
 assert.equal(broken.state.weapons.warrior.peakPlus,24);assert.equal(broken.state.weapons.warrior.xp,15);
 assert.equal(broken.state.gold,before.gold-2*broken.receipt.cost.gold);
 await denied('forge',{useGuard:false},{account:other});
 console.log('PASS authoritative 24-to-0 destruction, guard, retry identity and pre-presentation persistence');

 const skill=await paid('draw',{kind:'skill',count:1});
 assert.equal(skill.receipt.payment,'daily');assert.equal(skill.receipt.items.length,1);
 assert(skill.state.skills[skill.receipt.items[0].id]>0);
 const skillTen=await paid('draw',{kind:'skill',count:10});
 assert.equal(skillTen.receipt.payment,'ticket');assert.equal(skillTen.state.summonTickets,0);
 const pet=await paid('draw',{kind:'pet',count:10});
 assert.equal(pet.state.petTickets,0);assert.equal(pet.receipt.items.length,10);assert(pet.state.pets[pet.receipt.items[0].id]>0);
 const outfit=await paid('draw',{kind:'costume',count:1});
 assert.equal(outfit.receipt.items[0].guaranteed,'천상 보장');assert(outfit.state.costumes.includes(outfit.receipt.items[0].i));
 const wheel=await paid('draw',{kind:'roulette',count:1});
 assert.equal(wheel.receipt.payment,'gems');assert.deepEqual(wheel.receipt.items.map(r=>r.kind).sort(),['eventSkin','title']);
 assert.equal(wheel.state.royalTitlePity,0);assert(wheel.state.costumeEvents['phoenix-202611'].classes.warrior.owned);
 await denied('draw',{kind:'pet',count:1},{account:other});
 await denied('draw',{kind:'costume',count:2});
 console.log('PASS four server draw types, token/currency debits and both live pity guarantees');

 const previous=JSON.parse(latest().data);
 const itemId='exchange-forgeGuards-1',requestId=crypto.randomUUID(),rev=latest().revision;
 const responses=await Promise.all([command('shop',{itemId},{id:requestId,revision:rev}),command('shop',{itemId},{id:requestId,revision:rev})]);
 assert(responses.every(r=>r.status===200));assert.deepEqual(responses[0].body.result,responses[1].body.result);
 assert.equal(latest().revision,rev+1);
 const after=JSON.parse(latest().data);assert.equal(after.gems,previous.gems-1500);assert.equal(after.forgeGuards,previous.forgeGuards+1);
 await denied('shop',{itemId:'not-in-catalogue'});
 await denied('shop',{itemId:'exchange-ore-30',cost:0});await denied('shop',{itemId},{account:other});
 const claim=await paid('claim',{source:'quest',id:0});
 assert.equal(claim.state.quest,1);assert.equal(claim.state.gems,after.gems+100);
 await denied('claim',{source:'quest',id:0});
 assert.equal((await request(other)).body.revision,1);
 console.log('PASS one shop charge for concurrent retries, catalogue, funds, account isolation and one-time mission');

 for(const [source,id,verify] of [
  ['guide','first',s=>s.guidance.rewarded&&s.guidance.step===7&&s.guidance.status==='done'],
  ['attendance','pending',s=>s.attendance===1&&s.attendanceBook.pending===0],
  ['monthlyAttendance','pending',s=>s.monthlyAttendance['2026-11'].count===1],
  ['growthPass','all',s=>s.passClaimed[10]&&s.passClaimed[50]&&!s.passClaimed[60]],
  ['seasonPass','all',s=>s.season.claimed[0]===true],
  ['orderWeekly','temper',s=>s.adventureOrders.weekly.claimed.temper],
  ['chestDaily',0,s=>s.adventureOrders.daily.chests[0]]
 ]){
  const old=JSON.parse(latest().data);
  const {state,receipt}=await paid('claim',{source,id});
  if(source==='orderWeekly')assert.equal(state.forgeGuards,old.forgeGuards+1);
  assert(verify(state),source+' saved claim');
  assert(receipt.rewards&&Object.keys(receipt.rewards).length,source+' rendered reward');
  await denied('claim',{source,id});
 }
 console.log('PASS seven account reward UI contracts settle once, bulk pass unlocks only earned rows, weekly guard paid once');

 const protectedChanges=[
  s=>s.gems++,s=>s.forgeGuards++,s=>s.weapons.warrior.plus++,s=>s.normalCostumeRolls++,
  s=>s.royalTitlePity++,s=>s.costumeEvents['phoenix-202611'].classes.warrior.pity++,
  s=>{s.skills[59]=1},s=>{const id=Array.from({length:12},(_,i)=>i).find(i=>!s.pets[i]);s.pets[id]=1},
  s=>{s.costumes.push(23)}
 ];
 for(const change of protectedChanges){
  const saved=latest(),local=JSON.parse(saved.data);change(local);now+=5000;
  const conflict=await expectStatus(409,request(owner,'POST',{baseRevision:saved.revision,data:JSON.stringify(local)}));
  assert.equal(conflict.body.data,saved.data);assert.equal(conflict.body.revision,saved.revision);assert.deepEqual(latest(),saved);
 }
 let saved=latest(),local=JSON.parse(saved.data);
 local.shards-=10+Math.floor(local.skills[0]*1.5);local.skills[0]++;now+=5000;
 await expectStatus(200,request(owner,'POST',{baseRevision:saved.revision,data:JSON.stringify(local)}));
 assert.equal(JSON.parse(latest().data).skills[0],local.skills[0]);
 console.log('PASS protected save mismatches return canonical snapshot; legitimately owned skill can still level');

 const carrier='progress-carrier';seed(carrier);
 const persisted=latest(carrier),ordinary=JSON.parse(persisted.data);ordinary.kills+=17;
 const item='exchange-ore-30',id=crypto.randomUUID(),progress={data:JSON.stringify(ordinary)};
 const buy={itemId:item,_progress:progress},base=persisted.revision;
 const merged=await paid('shop',buy,{id,account:carrier,revision:base});
 assert.equal(merged.state.kills,ordinary.kills);assert.equal(merged.state.gems,ordinary.gems-150);
 const replay=await expectStatus(200,command('shop',buy,{id,account:carrier,revision:base}));
 assert.deepEqual(replay.body.result,merged.receipt);assert.equal(latest(carrier).revision,base+1);
 const unchanged=latest(carrier),snapshot=JSON.parse(unchanged.data);
 for(const [body,opts] of [
  [{itemId:item,_progress:{data:JSON.stringify({...snapshot,gems:snapshot.gems+1})}},{}],
  [{itemId:item,_progress:{data:'{}'}},{}],
  [{itemId:item,_progress:{data:unchanged.data}},{headers:{'X-Nebula-Request-Id':crypto.randomUUID()}}],
  [buy,{revision:base}]
 ])await denied('shop',body,{account:carrier,...opts});
 now+=5000;snapshot.kills+=1;
 const uploaded=JSON.stringify(snapshot);
 await expectStatus(200,request(carrier,'POST',{baseRevision:unchanged.revision,data:uploaded}));
 const previousHash=Buffer.from(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(uploaded))).toString('hex');
 const staged=JSON.parse(uploaded);staged.kills+=5;
 const body={itemId:item,_progress:{data:JSON.stringify(staged),previousHash}};
 await denied('shop',{...body,_progress:{...body._progress,previousHash:'0'.repeat(64)}},{account:carrier,revision:unchanged.revision});
 const raced=await paid('shop',body,{account:carrier,revision:unchanged.revision});
 assert.equal(raced.state.kills,staged.kills);assert.equal(raced.state.gems,snapshot.gems-150);
 await denied('shop',body,{account:carrier,revision:unchanged.revision});
 console.log('PASS action and unprotected progress settle in one revision, proof accepts only its pending public upload');

 for(const [legacy,mode] of [['correction-upload','upload'],['correction-command','command']]){
  const raw=seed(legacy,s=>{s.eventClaims.newbie6=true;s.eventClaims.newbieGift6=true});
  const corrected={...raw,gems:raw.gems+20,eventClaims:{...raw.eventClaims,newbieGift6:200}};
  if(mode==='upload'){
   const upgraded=await expectStatus(200,request(legacy,'POST',{baseRevision:1,data:JSON.stringify(corrected)}));
   assert.equal(JSON.parse(upgraded.body.data).gems,corrected.gems);
  }else{
   const upgrade=await paid('shop',{itemId:item},{account:legacy});
   assert.equal(upgrade.state.gems,corrected.gems-150);
  }
  const correctedHead=latest(legacy),paidState=JSON.parse(correctedHead.data);
  assert.equal(paidState.eventClaims.newbieGift6,200);
  for(const edit of [state=>{state.eventClaims.newbieGift6=true},state=>{state.gems+=20}]){
   const fake=JSON.parse(correctedHead.data);edit(fake);now+=5000;
   await expectStatus(409,request(legacy,'POST',{baseRevision:correctedHead.revision,data:JSON.stringify(fake)}));
  }
 }
 console.log('PASS legacy day-seven 180 to 200 diamond correction pays once via upload or first action');
}finally{
 if(original)Object.defineProperty(crypto,'getRandomValues',original);else delete crypto.getRandomValues;
 Date.now=nowFn;db.close();
}
