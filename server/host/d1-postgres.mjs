// The game server was written for a D1 (SQLite) database handle: prepare(sql).bind(...).first()/all()/run()
// and batch([...]). This gives it the same handle on top of PostgreSQL, rewriting the few SQLite-only
// spellings on the way, so the server's own files stay as they are.
import pg from 'pg';
import {readFileSync} from 'node:fs';

// SQLite hands back plain numbers and 0/1; PostgreSQL would hand back strings and booleans.
pg.types.setTypeParser(20,value=>Number(value));              // bigint
pg.types.setTypeParser(1700,value=>Number(value));            // numeric (SUM and friends)
pg.types.setTypeParser(16,value=>value==='t'?1:0);            // boolean

const CHANGES='__changes__';
const cache=new Map();

// Walks the statement outside of quoted text.
function eachPlain(sql,visit){
 let out='',i=0;
 while(i<sql.length){
  const c=sql[i];
  if(c==="'"||c==='"'){
   let j=i+1;
   while(j<sql.length){if(sql[j]===c){if(sql[j+1]===c){j+=2;continue}break}j++}
   out+=sql.slice(i,j+1);i=j+1;continue;
  }
  let j=i;
  while(j<sql.length&&sql[j]!=="'"&&sql[j]!=='"')j++;
  out+=visit(sql.slice(i,j));i=j;
 }
 return out;
}
// MAX(a,b) and MIN(a,b) with two arguments are SQLite's GREATEST and LEAST.
function scalarExtremes(sql){
 return sql.replace(/\b(MAX|MIN)\s*\(/gi,(match,name,at)=>{
  let depth=1,comma=false;
  for(let i=at+match.length;i<sql.length&&depth>0;i++){
   if(sql[i]==='(')depth++;else if(sql[i]===')')depth--;else if(sql[i]===','&&depth===1)comma=true;
  }
  return comma?(name.toUpperCase()==='MAX'?'GREATEST(':'LEAST('):match;
 });
}
// SQLite sorts NULL as the smallest value; PostgreSQL sorts it as the largest. Every ORDER BY term is told
// to keep SQLite's order, so a guild without a score still comes last in a ranking.
function orderNulls(sql){
 const stop=/^(LIMIT|OFFSET|FETCH|FOR|RETURNING|UNION|EXCEPT|INTERSECT|ROWS|RANGE|GROUPS|WINDOW)\b/i;
 let out='',from=0;
 for(const match of sql.matchAll(/\bORDER\s+BY\b/gi)){
  const start=match.index+match[0].length;
  if(start<from)continue;
  let i=start,depth=0,term=start;const terms=[];
  for(;i<sql.length;i++){
   const c=sql[i];
   if(c==="'"||c==='"'){i++;while(i<sql.length&&sql[i]!==c)i++;continue}
   if(c==='(')depth++;
   else if(c===')'){if(depth===0)break;depth--}
   else if(c===','&&depth===0){terms.push(sql.slice(term,i));term=i+1}
   else if(depth===0&&/\s/.test(sql[i-1]||' ')&&stop.test(sql.slice(i,i+12)))break;
  }
  terms.push(sql.slice(term,i));
  const fixed=terms.map(text=>{
   const body=text.replace(/\s+$/,''),tail=text.slice(body.length);
   if(!body.trim()||/\bNULLS\s+(FIRST|LAST)$/i.test(body))return text;
   return body+(/\bDESC$/i.test(body)?' NULLS LAST':' NULLS FIRST')+tail;
  });
  out+=sql.slice(from,start)+fixed.join(',');from=i;
 }
 return out+sql.slice(from);
}
export function translate(source){
 if(cache.has(source))return cache.get(source);
 let sql=source.trim().replace(/;\s*$/,''),ignore=false,replace=false;
 sql=sql.replace(/^INSERT\s+OR\s+IGNORE\s+INTO/i,()=>{ignore=true;return 'INSERT INTO'});
 sql=sql.replace(/^INSERT\s+OR\s+REPLACE\s+INTO/i,()=>{replace=true;return 'INSERT INTO'});
 if(replace){
  // Replacing a row means it arrives again at the back of the order.
  if(!/^INSERT INTO guild_power_order\s*\(guild_key\)/i.test(sql))throw Error('INSERT OR REPLACE is only translated for guild_power_order: '+source.slice(0,80));
  sql+=" ON CONFLICT (guild_key) DO UPDATE SET arrival=nextval(pg_get_serial_sequence('guild_power_order','arrival'))";
 }
 if(ignore&&!/\bON\s+CONFLICT\b/i.test(sql)){
  const returning=sql.search(/\bRETURNING\b/i);
  sql=returning<0?sql+' ON CONFLICT DO NOTHING':sql.slice(0,returning)+'ON CONFLICT DO NOTHING '+sql.slice(returning);
 }
 // In "DO UPDATE SET x=MAX(x,excluded.x)" PostgreSQL wants the stored column named with its table.
 const table=/^INSERT INTO\s+([A-Za-z_][A-Za-z0-9_]*)/i.exec(sql)?.[1],upsert=sql.search(/\bDO\s+UPDATE\s+SET\b/i);
 if(table&&upsert>=0)sql=sql.slice(0,upsert)+sql.slice(upsert).replace(/\b(MAX|MIN)\s*\(\s*([A-Za-z_][A-Za-z0-9_]*)\s*,\s*excluded\./gi,'$1('+table+'.$2,excluded.');
 sql=orderNulls(sql);
 let count=0,usesChanges=false;
 sql=eachPlain(sql,part=>{
  part=scalarExtremes(part);
  // PostgreSQL folds unquoted names to lower case; the server reads updatedAt, bestScore and the like.
  part=part.replace(/\bAS\s+([a-z][a-z0-9_]*[A-Z][A-Za-z0-9_]*)\b/g,'AS "$1"');
  part=part.replace(/\bchanges\s*\(\s*\)/gi,()=>{usesChanges=true;return CHANGES});
  // A comparison is 0 or 1 in SQLite and a boolean here; the ranking query mixes it with a number.
  part=part.replace(/\bCOALESCE\(\s*mine\s*,\s*0\s*\)/gi,'COALESCE(mine::int,0)');
  part=part.replace(/\bmine\s*=\s*1\b/g,'mine');
  return part.replace(/\?/g,()=>'$'+(++count));
 });
 const entry={sql,count,usesChanges,write:/^(INSERT|UPDATE|DELETE)\b/i.test(sql)};
 cache.set(source,entry);
 return entry;
}
function value(v){
 if(v===undefined)return null;
 if(typeof v==='boolean')return v?1:0;
 if(typeof v==='bigint')return v.toString();
 return v;
}
// One connection's view: runs a statement and keeps SQLite's "rows changed by the last write".
export function session(client){
 let changes=0;
 return {
  get changes(){return changes},
  async run(source,args=[]){
   const t=translate(source);
   const text=t.usesChanges?t.sql.replaceAll(CHANGES,String(changes)):t.sql;
   let result;
   // A write that fails has changed nothing, as in SQLite.
   try{result=await client.query(text,args.map(value))}catch(error){if(t.write)changes=0;throw error}
   if(t.write)changes=result.rowCount??0;
   return {rows:result.rows,changes};
  }
 };
}
export function createDatabase(pool){
 const one=async(source,args)=>{
  const client=await pool.connect();
  try{return await session(client).run(source,args)}finally{client.release()}
 };
 const shape=out=>({success:true,results:out.rows,meta:{changes:out.changes}});
 const statement=(source,args=[])=>({
  source,args,
  bind:(...values)=>statement(source,values),
  first:async column=>{const row=(await one(source,args)).rows[0]??null;return column&&row?row[column]??null:row},
  all:async()=>shape(await one(source,args)),
  run:async()=>shape(await one(source,args))
 });
 return {
  prepare:source=>statement(source),
  // A batch is one transaction on one connection, as it is in D1.
  async batch(statements){
   const client=await pool.connect();
   try{
    const s=session(client),results=[];
    await client.query('BEGIN');
    try{
     for(const st of statements)results.push(shape(await s.run(st.source,st.args)));
     await client.query('COMMIT');
    }catch(error){await client.query('ROLLBACK').catch(()=>{});throw error}
    return results;
   }finally{client.release()}
  },
  async ping(){await pool.query('SELECT 1')}
 };
}
// The connection is encrypted when the address asks for it (sslmode=require). With DB_CA_FILE set to the
// database provider's certificate bundle, the server's certificate is checked as well.
export function createPool(url,options={}){
 const wantsTls=/[?&]sslmode=(require|verify-ca|verify-full)/.test(url),ca=process.env.DB_CA_FILE;
 const ssl=wantsTls?(ca?{ca:readFileSync(ca,'utf8'),rejectUnauthorized:true}:{rejectUnauthorized:false}):undefined;
 // The address is passed without its sslmode word; the setting above decides.
 const pool=new pg.Pool({connectionString:url.replace(/([?&])sslmode=[^&]*&?/,'$1').replace(/[?&]$/,''),max:Number(process.env.DB_POOL||12),idleTimeoutMillis:30000,
  connectionTimeoutMillis:8000,ssl,...options});
 pool.on('error',error=>console.error('[db] idle connection error:',error.message));
 return pool;
}
