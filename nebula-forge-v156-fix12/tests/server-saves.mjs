import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {saveRequests,expectStatus} from './save-worker-fixture.mjs';
import {rankedAction} from '../dist/server/rank-simulation.js';

const db=new DatabaseSync(':memory:');
db.exec('PRAGMA foreign_keys=ON');
const migrations=new URL('../drizzle/',import.meta.url);
const files=readdirSync(migrations).filter(n=>n.endsWith('.sql')).sort();
const apply=name=>db.exec(readFileSync(new URL(name,migrations),'utf8'));
const isLegacy=name=>Number(name.slice(0,4))<=9;
files.filter(isLegacy).forEach(apply);
const clock=Date.now;
let now=Date.UTC(2026,10,24);Date.now=()=>now;
// A first upload is accepted as sent only when it is a new game, so the records start from one.
const fresh=rankedAction(null,{action:'economyStarter'},Date.UTC(2026,10,24));
const snapshot=(stage,description='')=>JSON.stringify({...fresh,stage,level:2,gold:stage,description});
const max=512*1024;
function exactBytes(limit){
 const overhead=Buffer.byteLength(snapshot(15));
 const count=Math.floor((limit-overhead)/3);
 const value=snapshot(15,'별'.repeat(count)+'x'.repeat(limit-overhead-3*count));
 assert.equal(Buffer.byteLength(value),limit);return value;
}
const legacyRows=[
 ['legacy-named',6,snapshot(21)],['legacy-named',7,snapshot(34)],
 ['legacy-pending',12,snapshot(40)],['legacy-pending',13,exactBytes(max+1)]
];
db.prepare('INSERT INTO nicknames(owner,name_key,name) VALUES(?,?,?)').run('legacy-named','기존기사','기존기사');
const legacy=db.prepare('INSERT INTO account_backups(owner,revision,request_id,updated_at,snapshot) VALUES(?,?,?,?,?)');
for(const [owner,revision,data] of legacyRows)legacy.run(owner,revision,'old-'+revision,now-20000+revision,data);
files.filter(name=>!isLegacy(name)).forEach(apply);

const request=saveRequests(db);
const post=(owner,baseRevision,data,opts)=>request(owner,'POST',{baseRevision,data},opts);
const nickname=(owner,name)=>expectStatus(200,request(owner,'POST',{action:'claim',name},{path:'/api/nickname'}));
const history=owner=>db.prepare('SELECT revision,data,saved_at FROM player_save_history WHERE owner=? ORDER BY revision').all(owner);
function head(got,revision,data){
 assert.deepEqual(Object.keys(got).sort(),['data','revision','updatedAt']);
 assert.equal(got.revision,revision);assert.equal(got.data,data);assert(Number.isFinite(got.updatedAt));
}
try{
 await expectStatus(401,request(null));await expectStatus(401,post(null,0,snapshot(1)));
 const missing=await expectStatus(404,request('player-one'));
 assert.equal(missing.body.code,'save_not_found');assert.match(missing.headers.get('Cache-Control'),/no-store/);
 assert.equal((await expectStatus(428,post('player-one',0,snapshot(1)))).body.code,'nickname_required');
 await nickname('player-one','첫번째기사');await nickname('player-two','두번째기사');
 await expectStatus(404,request('player-one'));
 await expectStatus(403,post('player-one',0,snapshot(1),{origin:null}));
 await expectStatus(403,post('player-one',0,snapshot(1),{origin:'https://other.test'}));
 await expectStatus(415,post('player-one',0,snapshot(1),{type:'text/plain'}));
 await expectStatus(415,post('player-one',0,snapshot(1),{type:'application/jsonp'}));
 await expectStatus(400,request('player-one','POST','{',{raw:true}));
 await expectStatus(400,post('player-one',-1,snapshot(1)));await expectStatus(400,post('player-one',0.5,snapshot(1)));
 await expectStatus(400,post('player-one',0,{stage:1}));await expectStatus(400,post('player-one',0,'{'));
 await expectStatus(400,post('player-one',0,JSON.stringify({...JSON.parse(snapshot(1)),testOnly:true})));
 await expectStatus(413,post('player-one',0,exactBytes(max+1)));
 const first=exactBytes(max);
 const saved=await expectStatus(200,post('player-one',0,first));head(saved.body,1,first);
 assert.match(saved.headers.get('Cache-Control'),/no-store/);
 await expectStatus(404,request('player-two','GET',undefined,{path:'/api/save?owner='+encodeURIComponent('player-one')}));
 const second=snapshot(27);head((await expectStatus(200,post('player-two',0,second))).body,1,second);
 now+=4999;
 const limited=await expectStatus(429,post('player-one',1,snapshot(2)));
 assert(Number(limited.headers.get('Retry-After'))>0);assert(limited.body.retryAfterMs>0&&limited.body.retryAfterMs<=5000);
 now++;
 const candidates=[snapshot(2,'one'),snapshot(3,'two')];
 const race=await Promise.all(candidates.map(data=>post('player-one',1,data)));
 assert.deepEqual(race.map(x=>x.status).sort(),[200,409]);
 const winner=race.find(x=>x.status===200).body;
 assert(candidates.includes(winner.data));head(winner,2,winner.data);
 assert.deepEqual(race.find(x=>x.status===409).body,winner);
 assert.deepEqual((await expectStatus(200,request('player-one'))).body,winner);
 head((await expectStatus(200,request('player-two'))).body,1,second);
 const oldWire={owner:'player-one',revision:1,snapshot:snapshot(1),requestId:crypto.randomUUID()};
 await expectStatus(405,request('player-one','PUT',oldWire));
 assert.deepEqual((await request('player-one')).body,winner);
 for(let rev=3;rev<=8;rev++){
  now+=5000;head((await expectStatus(200,post('player-one',rev-1,snapshot(rev)))).body,rev,snapshot(rev));
 }
 assert.deepEqual(history('player-one').map(r=>[r.revision,r.data]),[4,5,6,7,8].map(rev=>[rev,snapshot(rev)]));
 assert.deepEqual(history('player-two').map(r=>r.revision),[1]);
 const atEight=(await request('player-one')).body;
 assert.deepEqual((await expectStatus(409,post('player-one',2,snapshot(3)))).body,atEight);
 assert.deepEqual((await request('player-one','GET',undefined,{path:'/api/save?previous=1'})).body,atEight);
 console.log('PASS worker save identity, origin, cache, UTF-8 limit, per-owner rate, competing devices and five revisions');

 for(const [owner,revision,data] of [legacyRows[1],legacyRows[3]]){
  const res=await expectStatus(200,request(owner));head(res.body,revision,data);
  assert.equal(res.body.updatedAt,Date.UTC(2026,10,24)-20000+revision);
 }
 assert.deepEqual(history('legacy-named').map(r=>r.revision),[6,7]);
 const beforeName=await expectStatus(428,post('legacy-pending',13,snapshot(41)));
 assert.equal(beforeName.body.code,'nickname_required');
 await nickname('legacy-pending','돌아온기사');
 head((await expectStatus(200,request('legacy-pending'))).body,13,legacyRows[3][2]);
 assert.deepEqual(history('legacy-pending').map(r=>r.revision),[12,13]);
 const migrated=await expectStatus(200,post('legacy-pending',13,snapshot(41)));head(migrated.body,14,snapshot(41));
 assert.deepEqual(history('legacy-pending').map(r=>r.revision),[12,13,14]);
 head((await expectStatus(409,post('legacy-named',0,snapshot(1)))).body,7,legacyRows[1][2]);
 console.log('PASS nickname and pre-nickname legacy snapshots keep data, original revisions and timestamps');

 // Force an actual SQLite history write error to verify the head update and pruning roll back with it.
 now+=5000;
 db.exec("CREATE TRIGGER fail_history BEFORE INSERT ON player_save_history WHEN NEW.revision=9 BEGIN SELECT RAISE(ABORT,'history offline'); END");
 const failed=await post('player-one',8,snapshot(9));assert(failed.status>=500&&failed.status<600);
 assert.deepEqual((await request('player-one')).body,atEight);
 assert.deepEqual(history('player-one').map(r=>r.revision),[4,5,6,7,8]);
 db.exec('DROP TRIGGER fail_history');
 head((await expectStatus(200,post('player-one',8,snapshot(9)))).body,9,snapshot(9));
 assert.deepEqual(history('player-one').map(r=>r.revision),[5,6,7,8,9]);
 console.log('PASS real SQLite failure preserves the playable save and retry history');
}finally{Date.now=clock;db.close()}
