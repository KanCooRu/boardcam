import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {rankedAction} from '../dist/server/rank-simulation.js';
import {saveRequests,expectStatus} from './save-worker-fixture.mjs';

const db=new DatabaseSync(':memory:');
db.exec('PRAGMA foreign_keys=ON');
const migrations=new URL('../drizzle/',import.meta.url);
for(const file of readdirSync(migrations).filter(f=>f.endsWith('.sql')).sort()){
 db.exec(readFileSync(new URL(file,migrations),'utf8'));
}
const http=saveRequests(db),DAY=86400000;
const monday=Date.UTC(2026,10,23,3),originalClock=Date.now;
let now=monday;
Date.now=()=>now;
const head=owner=>db.prepare('SELECT revision,data FROM player_saves WHERE owner=?').get(owner);
const saved=owner=>JSON.parse(head(owner).data);
const funds=s=>[s.gems,s.forgeGuards,s.starIron,s.stones];
const gain=(after,before)=>after.map((n,i)=>n-before[i]);
const uuid=()=>crypto.randomUUID();
const nameFor=owner=>owner.startsWith('participant-')?'도전자'+owner.slice(-2):owner.slice(0,12);
function seed(owner,stage=51){
 const state=rankedAction(null,{action:'register',job:'warrior'},now).state;
 Object.assign(state,{maxStage:stage,stage,campaignCleared:stage-1,gems:4000,forgeGuards:0,starIron:10,stones:100});
 db.prepare('INSERT INTO nicknames(owner,name_key,name) VALUES(?,?,?)').run(owner,nameFor(owner).toLowerCase(),nameFor(owner));
 db.prepare('INSERT INTO player_saves(owner,revision,data,updated_at) VALUES(?,1,?,?)').run(owner,JSON.stringify(state),now-10000);
 db.prepare('INSERT INTO player_save_history(owner,revision,data,saved_at) VALUES(?,1,?,?)').run(owner,JSON.stringify(state),now-10000);
}
const get=(owner,path)=>http(owner,'GET',undefined,{path:'/api/trial/'+path});
const post=(owner,path,body,opts={})=>http(owner,'POST',body,{path:'/api/trial/'+path,headers:{
 'If-Match':String(opts.revision??head(owner)?.revision??0),'X-Nebula-Request-Id':opts.id??uuid()
}});
const count=(table,owner)=>db.prepare('SELECT COUNT(*) AS n FROM '+table+' WHERE owner=?').get(owner).n;
const rowFor=runId=>db.prepare('SELECT * FROM trial_runs WHERE run_id=?').get(runId);
async function ok(promise){return (await expectStatus(200,promise)).body}
async function denied(promise){
 const value=await promise;assert.ok(value.status>=400&&value.status<500,JSON.stringify({status:value.status,error:value.body.error}));
 return value;
}
async function start(owner){
 const before=head(owner);const r=await ok(post(owner,'start',{}));assert.equal(r.revision,before.revision+1);
 assert.equal(r.data,head(owner).data);assert.ok(r.result.runId);const row=rowFor(r.result.runId);
 assert.equal(row.owner,owner);assert.equal(row.started_at,now);assert.equal(row.finished_at,null);
 return r.result;
}
const bodyFor=(run,score=2010)=>({runId:run.runId,floors:Math.floor(score/1000),score});
async function settle(owner,body,opts){
 const r=await ok(post(owner,'finish',body,opts));assert.equal(r.data,head(owner).data);
 assert.equal(rowFor(body.runId).finished_at,now);return r;
}
async function ranked(owner,score){
 const run=await start(owner);now+=20000;return settle(owner,bodyFor(run,score));
}
const ranking=(owner,week)=>ok(get(owner,'ranking'+(week?'?week='+week:'')));
try{
 const main='duration-check',other='other-owner',early='lower-stage',unplayed='never-played';
 seed(main);seed(other);seed(early,50);seed(unplayed);
 await expectStatus(401,get(null,'today'));
 await denied(post('missing-nickname','start',{}));
 await denied(post(early,'start',{}));assert.equal(count('trial_runs',early),0);
 now=Date.UTC(2026,10,22,14,59,59,999);
 const sunday=await ok(get(main,'today'));assert.equal(sunday.dayKey,'2026-11-22');assert.equal(sunday.weekKey,'2026-11-16');
 now++;const nextDay=await ok(get(main,'today'));assert.equal(nextDay.dayKey,'2026-11-23');assert.equal(nextDay.weekKey,'2026-11-23');
 assert.notEqual(sunday.weakness,nextDay.weakness);assert.equal((await ok(get(other,'today'))).weakness,nextDay.weakness);
 const three=new Set();for(let i=0;i<3;i++){now=monday+i*DAY;three.add((await ok(get(main,'today'))).weakness)}
 assert.deepEqual([...three].sort(),['fire','frost','storm']);now=monday;
 const initial=funds(saved(main));
 const id=uuid(),revision=head(main).revision;
 const reservations=await Promise.all([post(main,'start',{},{id,revision}),post(main,'start',{},{id,revision})]);
 assert.deepEqual(reservations.map(r=>r.status),[200,200]);assert.equal(reservations[0].body.result.runId,reservations[1].body.result.runId);
 const first=reservations[0].body.result;assert.equal(count('trial_runs',main),1);assert.equal(head(main).revision,revision+1);
 const finish=bodyFor(first);const beforeBad=head(main);
 now+=19999;await denied(post(main,'finish',finish));now++;
 await denied(post(other,'finish',finish));assert.equal(rowFor(first.runId).finished_at,null);
 for(const bad of [{score:999,floors:1},{score:2000,floors:1},{score:-1,floors:0},{score:10.5,floors:0},{score:2010,floors:2.5}]){
  await denied(post(main,'finish',{...finish,...bad}));assert.equal(rowFor(first.runId).finished_at,null);
 }
 assert.deepEqual(head(main),beforeBad);
 const finishId=uuid(),finishRevision=head(main).revision;
 const accepted=await settle(main,finish,{id:finishId,revision:finishRevision});
 assert.deepEqual(gain(funds(saved(main)),initial),[30,0,5,30]);assert.equal(rowFor(first.runId).score,finish.score);
 const after=head(main);assert.equal((await ok(post(main,'finish',finish,{id:finishId,revision:finishRevision}))).result.runId,accepted.result.runId);
 await denied(post(main,'finish',finish));assert.deepEqual(head(main),after);
 const competingRevision=head(main).revision,olderReceipt=post(main,'start',{},{id,revision});
 const attempts=await Promise.all([olderReceipt,post(main,'start',{},{revision:competingRevision}),post(main,'start',{},{revision:competingRevision})]);
 assert.equal(attempts[0].status,200);assert.equal(attempts[0].body.result.runId,first.runId);
 assert.deepEqual(attempts.slice(1).map(r=>r.status).sort(),[200,409]);
 const second=attempts.slice(1).find(r=>r.status===200).body.result;
 assert.equal(second.attempt,2);assert.equal(count('trial_runs',main),2);
 now+=600000;
 await settle(main,bodyFor(second,2999));assert.equal(count('trial_weekly',main),1);
 const third=await start(main);now+=600001;
 await denied(post(main,'finish',bodyFor(third,5231)));assert.equal(rowFor(third.runId).finished_at,null);
 const thirdFunds=funds(saved(main));
 const outside=await settle(main,{...bodyFor(third,5231),settle:'normal'});assert.equal(outside.result.ranked,false);
 assert.deepEqual(gain(funds(saved(main)),thirdFunds),[0,0,5,30]);assert.equal((await ranking(main)).me.score,2999);
 const beforeFourth=head(main);await denied(post(main,'start',{}));
 assert.equal(count('trial_runs',main),3);assert.deepEqual(head(main),beforeFourth);assert.equal((await ok(get(main,'today'))).used,3);
 const local=(await http(main)).body;assert.equal(local.data,beforeFourth.data);
 console.log('PASS KST clock and nickname/stage gates; real SQL enforces three entries, ownership, integral floor/score and inclusive 20–600 seconds');

 // A cancelled or unsubmitted entry alone earns neither participation nor first-run gems.
 const bv=funds(saved(other));const quit=await start(other);
 await settle(other,{runId:quit.runId,score:0,floors:0,settle:'forfeit'});assert.deepEqual(funds(saved(other)),bv);
 assert.equal((await ranking(other)).me,null);
 await start(unplayed);assert.equal((await ranking(unplayed)).me,null);
 const valid=await start(other);now+=20000;await settle(other,bodyFor(valid,300));
 assert.deepEqual(gain(funds(saved(other)),bv),[30,0,5,30]);
 const today='2026-11-23';
 for(const account of [main,other,unplayed])await denied(post(account,'claim',{weekKey:today}));
 const rollover='rollover-player';seed(rollover);now=Date.UTC(2026,10,29,14,59,50);
 const crossing=await start(rollover);assert.equal(crossing.weekKey,today);
 now+=20000;assert.equal((await ok(get(rollover,'today'))).used,0);
 const afterMidnight=await settle(rollover,{...bodyFor(crossing,5301),settle:'normal'});
 assert.equal(afterMidnight.result.ranked,false);assert.equal((await ranking(rollover,today)).me,null);
 assert.equal((await ranking(rollover)).me,null);
 const beforeLegacy=head(rollover);
 for(const [source,id] of [['trialEnter','2026-11-30/1'],['trialFinish','2026-11-30/1/1200'],['trialForfeit','2026-11-30/1']]){
  await denied(http(rollover,'POST',{source,id},{path:'/api/reward/claim',headers:{'If-Match':String(beforeLegacy.revision),'X-Nebula-Request-Id':uuid()}}));
 }
 assert.deepEqual(head(rollover),beforeLegacy);
 console.log('PASS accepted runs count once; early exits consume an entry without score or payout and preserve the first eligible reward');

 // Build the entire second week's population through real admitted, timed runs.
 // Fifty-one produces fractional cutoffs at both 10% and 30%, and a personal row below the public 50.
 now=monday+7*DAY;const week='2026-11-30',ownerAt=rank=>'participant-'+String(rank).padStart(2,'0');
 for(let rank=1;rank<=51;rank++){
  const owner=ownerAt(rank);seed(owner);await ranked(owner,6000-(rank===5?4:rank)*10);
 }
 const fourth=ownerAt(4),fifth=ownerAt(5),bottom=ownerAt(51);
 const tieTime=db.prepare('SELECT updated_at FROM trial_weekly WHERE owner=? AND week_key=?');
 const originalTie=tieTime.get(fourth,week).updated_at;await ranked(fourth,5960);
 assert.equal(tieTime.get(fourth,week).updated_at,originalTie);
 await ranked(fourth,2010);assert.equal(tieTime.get(fourth,week).updated_at,originalTie);
 const board=await ranking(bottom);assert.equal(board.weekKey,week);assert.equal(board.currentWeek,true);
 assert.equal(board.participantCount,51);assert.equal(board.top.length,50);
 assert.deepEqual(board.top.map(r=>r.rank),Array.from({length:50},(_,i)=>i+1));
 assert.deepEqual(board.top.slice(3,5).map(r=>[r.name,r.score]),[[nameFor(fourth),5960],[nameFor(fifth),5960]]);
 assert.equal(board.me.name,nameFor(bottom));assert.equal(board.me.rank,51);assert.equal(board.me.isMe,true);
 assert.equal(board.top.some(r=>r.isMe),false);assert.equal((await ranking(fifth)).top[4].isMe,true);
 assert.ok(board.top.every(row=>!('owner' in row)));assert.equal((await ranking(unplayed)).me,null);
 await denied(post(bottom,'claim',{weekKey:week}));
 console.log('PASS 51 actual participants, first achiever wins ties, equal/worse subsequent scores keep original timestamp, personal rank 51 remains visible');
 now=monday+14*DAY;const newWeek='2026-12-07';
 const empty=await ranking(bottom);assert.equal(empty.weekKey,newWeek);assert.equal(empty.participantCount,0);
 assert.deepEqual(empty.top,[]);assert.equal(empty.me,null);assert.equal(empty.previous.weekKey,week);assert.equal(empty.previous.rank,51);
 const historical=await ranking(bottom,week);assert.equal(historical.currentWeek,false);assert.equal(historical.me.rank,51);assert.equal(historical.participantCount,51);
 await denied(post(unplayed,'claim',{weekKey:week}));await denied(post(main,'claim',{weekKey:today}));await denied(post(bottom,'claim',{weekKey:newWeek}));
 for(const [rank,gems,guards] of [[1,2000,2],[2,1500,1],[3,1200,1],[4,800,0],[6,800,0],[7,400,0],[16,400,0],[17,150,0],[51,150,0]]){
  const owner=ownerAt(rank),before=saved(owner),pre=head(owner),preview=(await ranking(owner)).previous;
  assert.deepEqual([preview.rank,preview.claimed,preview.eligible,preview.rewards.gems,preview.rewards.forgeGuards||0],[rank,false,true,gems,guards]);
  assert.equal(preview.title,rank===1?'탑의 정복자':null);
  const requestId=uuid(),body={weekKey:week},opts={id:requestId,revision:pre.revision};
  if(rank===6){
   const priorReceiptCount=count('player_action_receipts',owner);
   db.exec("CREATE TRIGGER fail_trial_reward BEFORE INSERT ON trial_rewards BEGIN SELECT RAISE(ABORT,'simulated reward write failure');END");
   try{
    await expectStatus(503,post(owner,'claim',body,opts));
    assert.deepEqual(head(owner),pre);assert.equal(count('trial_rewards',owner),0);
    assert.equal(count('player_action_receipts',owner),priorReceiptCount);
   }finally{db.exec('DROP TRIGGER fail_trial_reward')}
  }
  const winners=await Promise.all([post(owner,'claim',body,opts),post(owner,'claim',body,opts)]);
  assert.deepEqual(winners.map(r=>r.status),[200,200]);assert.deepEqual(winners[0].body.result,winners[1].body.result);
  const receipt=winners[0].body.result,after=saved(owner);assert.equal(receipt.rank,rank);assert.equal(receipt.rewards.gems,gems);
  assert.deepEqual(gain(funds(after),funds(before)),[gems,guards,0,0]);assert.equal(after.titlesOwned['trial-conqueror']===true,rank===1);
  assert.equal(count('trial_rewards',owner),1);assert.equal(head(owner).revision,pre.revision+1);
  const claimed=(await ranking(owner)).previous;assert.equal(claimed.claimed,true);assert.equal(claimed.eligible,false);
  const checkpoint=head(owner);await denied(post(owner,'claim',body));assert.deepEqual(head(owner),checkpoint);
  const latest=(await http(owner)).body;assert.equal(latest.data,checkpoint.data);
  if(rank===2){
   const forged=JSON.parse(latest.data);forged.titlesOwned['trial-conqueror']=true;now+=5000;
   await expectStatus(409,http(owner,'POST',{baseRevision:latest.revision,data:JSON.stringify(forged)}));assert.deepEqual(head(owner),checkpoint);
   const buy=await ok(http(owner,'POST',{itemId:'exchange-forgeGuards-1'},{path:'/api/shop/buy',headers:{'If-Match':String(checkpoint.revision),'X-Nebula-Request-Id':uuid()}}));
   const current=JSON.parse(buy.data);assert.deepEqual(gain(funds(current),funds(after)),[-1500,1,0,0]);
   const replay=await ok(post(owner,'claim',body,opts));assert.equal(replay.data,buy.data);assert.deepEqual(replay.result,receipt);
  }
 }
 console.log('PASS previous-week-only payouts; 1st/2nd/3rd, ceil top 10%/30% boundaries and participation pay once with durable title/guards/gems');
}finally{
 Date.now=originalClock;db.close();
}
