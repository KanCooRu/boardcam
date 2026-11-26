// Preloaded into a test run (node --import): writes down every statement the test sends to SQLite, with its
// arguments and what came back, so the same conversation can be replayed against PostgreSQL.
import {DatabaseSync} from 'node:sqlite';
import {writeFileSync} from 'node:fs';
const out=process.env.NEBULA_RECORD;
const log=[],ids=new WeakMap();let next=0;
const id=db=>{if(!ids.has(db))ids.set(db,next++);return ids.get(db)};
const plain=v=>typeof v==='bigint'?Number(v):v instanceof Uint8Array?{bytes:v.length}:v;
const rows=r=>r==null?r:Array.isArray(r)?r.map(o=>Object.fromEntries(Object.entries(o).map(([k,v])=>[k,plain(v)]))):Object.fromEntries(Object.entries(r).map(([k,v])=>[k,plain(v)]));
const prepare=DatabaseSync.prototype.prepare,exec=DatabaseSync.prototype.exec;
DatabaseSync.prototype.exec=function(sql){
 const entry={db:id(this),op:'exec',sql};log.push(entry);
 try{return exec.call(this,sql)}catch(error){entry.error=String(error.message);throw error}
};
DatabaseSync.prototype.prepare=function(sql){
 const db=id(this),st=prepare.call(this,sql);
 const call=op=>(...args)=>{
  const entry={db,op,sql,args:args.map(plain)};log.push(entry);
  try{const result=st[op](...args);entry.result=op==='run'?{changes:Number(result.changes)}:rows(result);return result}
  catch(error){entry.error=String(error.message);throw error}
 };
 return new Proxy(st,{get(target,key){
  if(key==='get'||key==='all'||key==='run')return call(key);
  const v=target[key];return typeof v==='function'?v.bind(target):v;
 }});
};
process.on('exit',()=>{if(out)writeFileSync(out,JSON.stringify(log))});
