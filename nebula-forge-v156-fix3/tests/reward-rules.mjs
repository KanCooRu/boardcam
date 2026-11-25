import assert from 'node:assert/strict';
import {rankedAction} from '../dist/server/rank-simulation.js';
const when=Date.UTC(2026,10,24,12),day='2026-11-24';
function seed(){
 const s=rankedAction(null,{action:'register',job:'warrior'},when).state;
 s.maxStage=60;s.gems=2000;s.season.points=2400;s.gold=900000;s.kills=3000;
 return s;
}
const claim=(state,source,id,now=when)=>rankedAction({state},{action:'economy',kind:'claim',input:{source,id}},now);
const denied=(state,source,id)=>assert.throws(()=>claim(state,source,id));
function pay(state,source,id){
 const out=claim(state,source,id);
 assert.equal(out.state.gems,state.gems+(out.result.rewards.gems||0));
 assert.deepEqual(out.result.id,id);return out;
}
let s=seed();
s.level=8;s.economyClaims=rankedAction({state:s},{action:'economyBaseline'},when);
s.level=10;
let r=pay(s,'level',10);assert.equal(r.result.rewards.gems,10);denied(r.state,'level',10);
r=pay(r.state,'coupon','folzun-first-gift');assert.equal(r.result.rewards.gems,100);
r.state.redeemedRewardCodes=[];denied(r.state,'coupon','folzun-first-gift');denied(r.state,'coupon','random');
r=pay(r.state,'mail','welcome');assert.deepEqual(r.result.rewards,{gems:300,ore:30,shards:30});
r.state.mailClaimed=false;r.state.mailbox.welcome.claimed=false;denied(r.state,'mail','welcome');
r=pay(r.state,'achievement',0);assert(r.state.titlesOwned['achievement-0']);
for(const retired of [10,23,24,25,26])denied(r.state,'achievement',retired);
r=pay(r.state,'newbie',0);assert(r.state.eventClaims.newbie0);
console.log('PASS level baseline and grouped level-up, genuine mail, coupon, achievement and legacy receipt prevention');
s=r.state;s.unlocked['6_2']=true;
r=pay(s,'collection',6);assert(r.state.discoveryClaimed['6_2']);
denied(r.state,'collection',6);r.state.unlocked['6_6']=true;
r=pay(r.state,'collection',6);assert.equal(r.result.rewards.gems,20);
r=pay(r.state,'growthPass','all');assert.equal(r.result.count,6);denied(r.state,'growthPass',10);
r=pay(r.state,'seasonPass','all');assert.equal(r.state.forgeGuards,(s.forgeGuards||0)+1);denied(r.state,'seasonPass',19);
denied(r.state,'orderWeekly','temper');
r.state.adventureOrders={...r.state.adventureOrders,weekly:{period:r.state.weekly.key,tier:0,count:{weaponForge:10},claimed:{},chests:{}}};
r=pay(r.state,'orderWeekly','temper');assert.equal(r.result.rewards.forgeGuards,1);denied(r.state,'orderWeekly','temper');
r=pay(r.state,'shopDaily','gems');r=pay(r.state,'shopAd','gems:1');r=pay(r.state,'shopAd','gems:2');denied(r.state,'shopAd','gems:3');
assert.equal(r.state.daily.giftAds.gems,2);
console.log('PASS individual and bulk pass IDs share flags, all seven equipment parts, capped ad rewards and weekly guard');
s=seed();s.attendance=5;s.lastAttendance='2026-11-21';s.attendanceBook={last:day,pending:3};s.monthlyAttendance={'2026-11':{count:3,earned:7,rewardsVersion:2,legacyCount:0}};
r=pay(s,'attendance','pending');assert.equal(r.result.count,3);assert.equal(r.result.rewards.gems,1100);
r.state.attendanceBook.pending=3;r.state.attendance=5;denied(r.state,'attendance','pending');
r=pay(r.state,'monthlyAttendance','pending');assert.equal(r.result.count,4);
r.state.monthlyAttendance['2026-11'].count=3;denied(r.state,'monthlyAttendance','pending');
denied(r.state,'tower',1);
s=r.state;const admission=pay(s,'rushEntry',day+'/1');
assert.equal(admission.state.daily.admissions.rush,1);
s=admission.state;s.pendingEconomyRuns={rush:{[day+'/1']:{day,attempt:1,bosses:11}}};
r=pay(s,'rush',day+'/1');assert.equal(r.result.rewards.gems,40);assert.equal(r.result.rewards.summonTickets,2);
denied(r.state,'rush',day+'/1');s.pendingEconomyRuns.rush[day+'/9']={day,attempt:9,bosses:10};denied(s,'rush',day+'/9');
s=r.state;s.pendingEconomyRuns.worldBoss={[day+'/2']:{day,attempt:2,damage:1000000,gems:123456789}};
r=pay(s,'worldBoss',day+'/2');assert.equal(r.result.rewards.gems,90);denied(r.state,'worldBoss',day+'/2');
console.log('PASS earned attendance days, retired tower reward rejection, ticket-backed rush and world-boss formula/dedup');
// Two devices can finish their granted rounds out of order. An old early chest only receives the final upgrade once.
s=r.state;s.pendingEconomyRuns.worldBoss[day+'/1']={day,attempt:1,damage:0};
r=pay(s,'worldBoss',day+'/1');assert.equal(r.result.rewards.gems,10);
s=r.state;s.pendingEconomyRuns.worldBoss[day+'/2']={day,attempt:2,damage:1000000};denied(s,'worldBoss',day+'/2');
s=seed();s.onlineTest={day,daily:{raid:1,raidClaimed:[1],raidLoot:{1:{rewards:{gems:20}}},legacyBossCleared:true}};
s.pendingEconomyRuns={worldBoss:{[day+'/2/advance']:{day,attempt:2,damage:0,advance:true}}};
r=pay(s,'worldBoss',day+'/2/advance');assert.equal(r.result.rewards.gems,15);
r.state.pendingEconomyRuns.worldBoss[day+'/2']={day,attempt:2,damage:1000000};
r=pay(r.state,'worldBoss',day+'/2');assert.equal(r.result.rewards.gems,75);
r.state.pendingEconomyRuns.worldBoss[day+'/1']={day,attempt:1,damage:1000000};denied(r.state,'worldBoss',day+'/1');
console.log('PASS out-of-order independent rounds, legacy early world-boss payouts and prior paid migration');
const sunday=Date.UTC(2026,10,22,14,59,59),monday=sunday+1000;
// Ten forge attempts recorded in the week of the claim earn that week's order.
const tempered=(state,now)=>{
 const period=claim(state,'shopDaily','gems',now).state.weekly.key;
 state.adventureOrders={...state.adventureOrders,weekly:{period,tier:0,count:{weaponForge:10},claimed:{},chests:{}}};
 return state;
};
s=tempered(seed(),sunday);r=claim(s,'orderWeekly','temper',sunday);
assert.throws(()=>claim(r.state,'orderWeekly','temper',sunday));
const second=claim(tempered(r.state,monday),'orderWeekly','temper',monday);
assert.equal(second.state.forgeGuards,r.state.forgeGuards+1);
const once=claim(s,'shopDaily','gems',sunday);
assert.throws(()=>claim(once.state,'shopDaily','gems',sunday));
assert.equal(claim(once.state,'shopDaily','gems',monday).state.gems,once.state.gems+30);
console.log('PASS daily reward and Monday weekly guard reset exactly at midnight in Korea');
