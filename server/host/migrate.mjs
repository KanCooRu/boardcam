// Applies the PostgreSQL schema files that have not been applied yet. Safe to run on every deploy:
// two servers starting at once wait for each other here.
import {readFileSync,readdirSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createPool} from './d1-postgres.mjs';
const dir=process.env.MIGRATIONS_DIR||path.join(path.dirname(fileURLToPath(import.meta.url)),'../pg/migrations');
export async function migrate(pool){
 const client=await pool.connect();
 try{
  await client.query('SELECT pg_advisory_lock(727001)');
  await client.query('CREATE TABLE IF NOT EXISTS host_migrations (name TEXT PRIMARY KEY, applied_at BIGINT NOT NULL)');
  const done=new Set((await client.query('SELECT name FROM host_migrations')).rows.map(row=>row.name));
  const applied=[];
  for(const name of readdirSync(dir).filter(n=>n.endsWith('.sql')).sort()){
   if(done.has(name))continue;
   await client.query('BEGIN');
   try{
    await client.query(readFileSync(path.join(dir,name),'utf8'));
    await client.query('INSERT INTO host_migrations VALUES ($1,$2)',[name,Date.now()]);
    await client.query('COMMIT');applied.push(name);
   }catch(error){await client.query('ROLLBACK');throw Error('migration '+name+' failed: '+error.message)}
  }
  // Names sort by plain byte order in SQLite. A database made with another collation sorts ties differently.
  const collation=(await client.query('SELECT datcollate FROM pg_database WHERE datname=current_database()')).rows[0]?.datcollate;
  if(collation&&!/^(C|POSIX|C\.UTF-?8)$/i.test(collation))console.warn('[db] collation is '+collation+'; rankings break ties between equal scores by name in that order, not byte order.');
  return applied;
 }finally{
  await client.query('SELECT pg_advisory_unlock(727001)').catch(()=>{});
  client.release();
 }
}
if(process.argv[1]===fileURLToPath(import.meta.url)){
 if(!process.env.DATABASE_URL){console.error('DATABASE_URL is not set.');process.exit(1)}
 const pool=createPool(process.env.DATABASE_URL);
 try{const applied=await migrate(pool);console.log(applied.length?'Applied: '+applied.join(', '):'Schema is up to date.')}
 catch(error){console.error(error.message);process.exitCode=1}
 finally{await pool.end()}
}
