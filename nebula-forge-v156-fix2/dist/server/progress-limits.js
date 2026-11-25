import {rankedAction} from './rank-simulation.js';

// Ordinary play raises these values on the device. The server keeps one allowance
// per value: it refills with real time, and an upload can add no more than it holds.
// An excess is trimmed to the allowance, so an honest device never loses a save.
const HOUR=3600000;
const read=(game,path)=>path.reduce((value,key)=>value?.[key],game);
function write(game,path,value){
 let node=game;
 for(const key of path.slice(0,-1)){
  if(!node[key]||typeof node[key]!=='object')return;
  node=node[key];
 }
 node[path.at(-1)]=value;
}
export async function readLimitMemory(db,owner){
 try{
  const row=await db.prepare('SELECT state FROM player_limits WHERE owner=?').bind(owner).first();
  return {stored:true,memory:row?JSON.parse(row.state):null};
 }catch{
  // Until migration 0013 has run, saving continues without the allowances.
  return {stored:false,memory:null};
 }
}
// Written in the same transaction as the save, and only when that save won its revision.
export function limitMemoryStatement(db,owner,memory,now){
 return db.prepare(`INSERT INTO player_limits(owner,state,updated_at)
  SELECT ?,?,? WHERE EXISTS(SELECT 1 FROM player_saves WHERE owner=? AND updated_at=?)
  ON CONFLICT(owner) DO UPDATE SET state=excluded.state,updated_at=excluded.updated_at`)
  .bind(owner,JSON.stringify(memory),now,owner,now);
}
export function limitUpload(before,proposed,memory,lastAt,now){
 let pace;
 try{pace=rankedAction({state:before},{action:'progressPace',next:{dungeonLevel:proposed.dungeonLevel,crafted:proposed.crafted,gear:Array.isArray(proposed.gear)?proposed.gear.length:0,
   gearIds:Array.isArray(proposed.gear)?proposed.gear.map(g=>g?.id):[]}},now)}
 catch{return {trimmed:[],memory}}
 const since=Math.max(0,now-(memory?.at??lastAt??now));
 const stock={},trimmed=[],closed=[];
 for(const [name,{path,hourly,hold,credit=0}] of Object.entries(pace)){
  if(!hold)closed.push(name);
  const had=Number(read(before,path))||0,wants=read(proposed,path);
  // A source that has just opened starts with its full allowance, like a new account's.
  const saved=memory?.closed?.includes(name)?hold:memory?.stock?.[name];
  const kept=Math.max(0,Math.min(hold,(Number.isFinite(saved)?saved:hold)+hourly*since/HOUR));
  if(typeof wants!=='number'||!Number.isFinite(wants)){stock[name]=kept;continue}
  const gain=wants-had-credit;
  if(gain>kept){
   const allowed=Math.floor(kept+credit);
   write(proposed,path,had+allowed);stock[name]=Math.max(0,kept+credit-allowed);trimmed.push(name);
  }else stock[name]=gain>0?kept-gain:kept;
  stock[name]=Math.round(stock[name]*1000)/1000;
 }
 // Free daily entries are spent, never returned, within one game day.
 const used=before.daily?.admissions,claimed=proposed.daily?.admissions;
 if(used&&claimed&&typeof claimed==='object'&&before.day===proposed.day){
  for(const [key,count] of Object.entries(used)){
   if(Number.isFinite(count)&&!(claimed[key]>=count)){claimed[key]=count;trimmed.push('admissions.'+key)}
  }
 }
 return {trimmed,memory:{at:now,stock,closed}};
}
