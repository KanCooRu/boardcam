// Rankings follow the stored adventure: a saved stage counts once the saved character wins it on the server.
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync,readdirSync} from 'node:fs';
import {adoptAdventureRecord} from '../dist/server/rank-records.js';
import {rankedAction} from '../dist/server/rank-simulation.js';

const sql=new DatabaseSync(':memory:'),dir=new URL('../drizzle/',import.meta.url);
for(const f of readdirSync(dir).filter(n=>n.endsWith('.sql')).sort())sql.exec(readFileSync(new URL(f,dir),'utf8'));
const db={prepare(q){const s=sql.prepare(q);return {bind(...args){return {first:()=>s.get(...args),run:()=>s.run(...args),all:()=>({results:s.all(...args)})}}}}};
const row=owner=>sql.prepare('SELECT stage,power,current_power FROM ranked_progress WHERE owner=?').get(owner);
let now=Date.UTC(2026,10,27);

// A real character: the starter kit, then the same game played forward on the server for a few stages.
function played(job,stages){
 let state=rankedAction(null,{action:'economyStarter',job},now);
 for(let target=1;target<=stages;target++){
  const fight=rankedAction({state},{action:'fight',mode:'stage',target},now);
  assert.equal(fight.won,true,'the starter '+job+' clears stage '+target);
  state=fight.state;
 }
 return state;
}

sql.prepare('INSERT INTO nicknames VALUES(?,?,?)').run('honest','정직한기사','정직한기사');
sql.prepare('INSERT INTO nicknames VALUES(?,?,?)').run('forger','조작한기사','조작한기사');
sql.prepare('INSERT INTO nicknames VALUES(?,?,?)').run('unnamed-pal','x','x');
sql.prepare('DELETE FROM nicknames WHERE owner=?').run('unnamed-pal');

const honest=played('warrior',3);
assert.equal(honest.campaignCleared,3);
let started=performance.now();
const first=await adoptAdventureRecord(db,'honest',JSON.stringify(honest),now);
const cost=performance.now()-started;
assert.deepEqual({stage:first.stage},{stage:3});
assert.equal(row('honest').stage,3,'the ranking takes the stage the adventure cleared, with no separate proof run');
assert(row('honest').power>0&&row('honest').current_power===row('honest').power);
console.log('PASS a stored save registers the player and its cleared stage enters the ranking ('+cost.toFixed(0)+' ms)');

// Within a minute the same player is not replayed again.
const later=played('warrior',5);
assert.equal(await adoptAdventureRecord(db,'honest',JSON.stringify(later),now+30000),null);
assert.equal(row('honest').stage,3);
assert.equal((await adoptAdventureRecord(db,'honest',JSON.stringify(later),now+60000)).stage,5);
assert.equal(row('honest').stage,5);
console.log('PASS one replay a minute per player; the next save after that moves the ranking on');

// An edited save claiming a far stage with a starter character is replayed and refused.
const forged=played('mage',1);forged.campaignCleared=900;forged.maxStage=901;forged.stage=901;
const refused=await adoptAdventureRecord(db,'forger',JSON.stringify(forged),now);
assert.equal(refused.stage,0);
assert.equal(row('forger').stage,0,'a stage the saved character cannot win stays out of the ranking');
console.log('PASS a save claiming a stage its character cannot clear is kept off the stage board');

// Lower progress never lowers the board; test saves and players without a name are ignored.
const back=played('warrior',2);
await adoptAdventureRecord(db,'honest',JSON.stringify(back),now+120000);
assert.equal(row('honest').stage,5);
assert.equal(await adoptAdventureRecord(db,'unnamed-pal',JSON.stringify(honest),now),null);
assert.equal(await adoptAdventureRecord(db,'forger',JSON.stringify({...honest,testOnly:true}),now+999999),null);
assert.equal(await adoptAdventureRecord(db,'forger','not json',now+2999999),null);
console.log('PASS the best stage is kept; test saves, unnamed players and broken data are ignored');

// A top stage the replay loses still lets a slightly lower, winnable stage count.
sql.prepare('INSERT INTO nicknames VALUES(?,?,?)').run('wall','벽앞의기사','벽앞의기사');
let wall=rankedAction(null,{action:'economyStarter',job:'archer'},now),reached=0;
for(let target=1;target<=60;target++){
 const fight=rankedAction({state:structuredClone(wall)},{action:'fight',mode:'stage',target},now);
 if(!fight.won)break;wall=fight.state;reached=target;
}
assert(reached>=2&&reached<60,'the starter archer meets a wall before stage 60 (reached '+reached+')');
const claim={...structuredClone(wall),campaignCleared:reached+1,maxStage:reached+2,stage:reached+2};
assert.equal((await adoptAdventureRecord(db,'wall',JSON.stringify(claim),now)).stage,reached);
console.log('PASS a lost replay of the top stage falls back to the stage just below it ('+reached+')');

