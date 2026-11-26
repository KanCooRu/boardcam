// The same database handle on a local SQLite file, for development on one machine.
import {DatabaseSync} from 'node:sqlite';
import {readFileSync,readdirSync} from 'node:fs';
export function createDatabase(file,migrations){
 const db=new DatabaseSync(file);
 db.exec('PRAGMA foreign_keys=ON');db.exec('PRAGMA journal_mode=WAL');
 db.exec('CREATE TABLE IF NOT EXISTS host_migrations (name TEXT PRIMARY KEY)');
 for(const name of readdirSync(migrations).filter(n=>n.endsWith('.sql')).sort()){
  if(db.prepare('SELECT 1 FROM host_migrations WHERE name=?').get(name))continue;
  db.exec('BEGIN');
  try{db.exec(readFileSync(migrations+'/'+name,'utf8'));db.prepare('INSERT INTO host_migrations VALUES (?)').run(name);db.exec('COMMIT')}
  catch(error){db.exec('ROLLBACK');throw error}
 }
 const statement=(sql,args=[])=>{
  const q=db.prepare(sql);
  const execute=()=>{
   const rows=q.columns().length>0,results=rows?q.all(...args):[];
   const changes=rows?db.prepare('SELECT changes() AS n').get().n:q.run(...args).changes;
   return {success:true,results,meta:{changes:Number(changes)}};
  };
  return {bind:(...values)=>statement(sql,values),first:async column=>{const row=q.get(...args)??null;return column&&row?row[column]??null:row},
   run:async()=>execute(),all:async()=>({success:true,results:q.all(...args),meta:{changes:0}}),execute};
 };
 return {prepare:sql=>statement(sql),async batch(statements){
  db.exec('BEGIN');
  try{const results=statements.map(st=>st.execute());db.exec('COMMIT');return results}
  catch(error){db.exec('ROLLBACK');throw error}
 },async ping(){db.prepare('SELECT 1').get()}};
}
