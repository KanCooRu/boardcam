// Replays recorded SQLite conversations against PostgreSQL through the adapter and reports every place
// where PostgreSQL answered differently.
//   node replay.mjs <game dir> <recording.json>...
import {readFileSync,readdirSync} from 'node:fs';
import path from 'node:path';
import pg from '../host/node_modules/pg/lib/index.js';
import {session,translate} from '../host/d1-postgres.mjs';
const [game,...files]=process.argv.slice(2);
const ADMIN=process.env.PG_ADMIN||'postgres://game_app:devpass@127.0.0.1:5432/postgres';
const here=path.dirname(new URL(import.meta.url).pathname);
const sqliteFiles=new Map(readdirSync(game+'/drizzle').filter(n=>n.endsWith('.sql')).map(n=>[readFileSync(game+'/drizzle/'+n,'utf8'),n]));
const pgFile=name=>readFileSync(here+'/../pg/migrations/'+name,'utf8');
const admin=new pg.Client({connectionString:ADMIN});await admin.connect();
let serial=0,total=0,bad=0;const problems=[];
const norm=v=>v===undefined?null:v;
const same=(a,b)=>{
 if(a==null||b==null)return a==null&&b==null;
 const ka=Object.keys(a),kb=Object.keys(b);
 if(ka.length!==kb.length)return false;
 // An unnamed column (SELECT 1 ...) is called "1" by SQLite and "?column?" by PostgreSQL; the server only looks at whether a row came back.
 if(ka.length===1&&kb[0]==='?column?')return Number(a[ka[0]])===Number(b[kb[0]]);
 return ka.every(k=>k in b&&(norm(a[k])===norm(b[k])||Number(a[k])===Number(b[k])&&a[k]!==null&&b[k]!==null&&a[k]!==''&&b[k]!==''));
};
const key=row=>JSON.stringify(Object.keys(row).sort().map(k=>[/^\?column\?$|^\d+$/.test(k)?'_':k,row[k]===null?null:typeof row[k]==='number'?Number(row[k]):row[k]]));
for(const file of files){
 const log=JSON.parse(readFileSync(file,'utf8')),dbs=new Map();
 const open=async id=>{
  if(dbs.has(id))return dbs.get(id);
  const name='replay_'+process.pid+'_'+(serial++);
  await admin.query('CREATE DATABASE '+name);
  const client=new pg.Client({connectionString:ADMIN.replace(/\/[^/]*$/,'/'+name)});await client.connect();
  const entry={name,client,s:session(client),broken:false};dbs.set(id,entry);return entry;
 };
 const report=(entry,what)=>{bad++;if(problems.length<40)problems.push(path.basename(file)+': '+what+'\n    '+entry.sql.replace(/\s+/g,' ').slice(0,260)+'\n    args '+JSON.stringify(entry.args||[]).slice(0,160))};
 for(const [at,e] of log.entries()){
  const db=await open(e.db);
  if(e.op==='exec'){
   const sql=e.sql.trim();
   if(sqliteFiles.has(e.sql)){await db.client.query(pgFile(sqliteFiles.get(e.sql)));continue}
   if(/^PRAGMA/i.test(sql))continue;
   if(/^(BEGIN|COMMIT|ROLLBACK)/i.test(sql)){await db.client.query(sql.split(/\s/)[0]).catch(()=>{});continue}
   // Some tests plant a SQLite trigger that makes one write fail. The same fault is planted here.
   const fault=/^CREATE TRIGGER (\w+) BEFORE INSERT ON (\w+)\s*(?:WHEN (.+?)\s*)?BEGIN SELECT RAISE\(ABORT,'([^']*)'\);\s*END$/is.exec(sql);
   if(fault){
    const [,name,table,when,message]=fault;db.faults=db.faults||new Map();db.faults.set(name,table);
    await db.client.query(`CREATE FUNCTION ${name}_fn() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION '${message}'; END $$`);
    await db.client.query(`CREATE TRIGGER ${name} BEFORE INSERT ON ${table} FOR EACH ROW ${when?'WHEN ('+when+')':''} EXECUTE FUNCTION ${name}_fn()`);
    continue;
   }
   const drop=/^DROP TRIGGER (\w+)$/i.exec(sql);
   if(drop&&db.faults?.has(drop[1])){await db.client.query(`DROP TRIGGER ${drop[1]} ON ${db.faults.get(drop[1])}`);await db.client.query(`DROP FUNCTION ${drop[1]}_fn()`);continue}
   try{await db.client.query(translate(sql).sql)}catch(error){if(!e.error)report(e,'exec failed on PostgreSQL: '+error.message)}
   continue;
  }
  total++;
  if(/^\s*SELECT changes\(\) AS n\s*$/i.test(e.sql)){if(Number(e.result?.n)!==db.s.changes){report(e,'changes() '+e.result?.n+' vs '+db.s.changes);if(process.env.REPLAY_CONTEXT)for(const x of log.slice(Math.max(0,at-3),at))console.log('   before:',x.op,(x.sql||'').replace(/\s+/g,' ').slice(0,200),'=>',JSON.stringify(x.result??x.error??null).slice(0,100))}continue}
  let out,error=null;
  // A test asking SQLite's catalogue whether a table exists is asked of PostgreSQL's catalogue instead.
  const text=e.sql.replace(/\bFROM sqlite_master WHERE name=/i,'FROM information_schema.tables WHERE table_name=');
  try{out=await db.s.run(text,e.args)}catch(err){error=err}
  if(e.error||error){
   if(!!e.error!==!!error)report(e,e.error?'SQLite failed ('+e.error+') but PostgreSQL did not':'PostgreSQL failed: '+error.message);
   continue;
  }
  if(e.op==='run'){
   if(/^\s*(INSERT|UPDATE|DELETE)/i.test(e.sql)&&e.result.changes!==out.changes)report(e,'changed rows '+e.result.changes+' vs '+out.changes);
  }else if(e.op==='get'){
   const row=out.rows[0]??null;
   if(/RANDOM\(\)/i.test(e.sql)){if((e.result==null)!==(row==null))report(e,'presence differs')}
   else if(!same(e.result??null,row))report(e,'row '+JSON.stringify(e.result??null).slice(0,200)+' vs '+JSON.stringify(row).slice(0,200));
  }else{
   const a=e.result||[],b=out.rows;
   if(a.length!==b.length){report(e,'row count '+a.length+' vs '+b.length);continue}
   const ordered=/ORDER BY/i.test(e.sql)&&!/RANDOM\(\)/i.test(e.sql);
   if(/RANDOM\(\)/i.test(e.sql))continue;
   const ok=ordered?a.every((row,i)=>same(row,b[i])):JSON.stringify(a.map(key).sort())===JSON.stringify(b.map(key).sort());
   if(!ok)report(e,'rows '+JSON.stringify(a).slice(0,220)+' vs '+JSON.stringify(b).slice(0,220));
  }
 }
 for(const db of dbs.values()){await db.client.end();await admin.query('DROP DATABASE '+db.name)}
}
await admin.end();
console.log(problems.join('\n'));
console.log('statements replayed: '+total+', differences: '+bad);
process.exit(bad?1:0);
