// A load generator that needs only Node.js. Each virtual player signs up, uploads a first save, then every
// INTERVAL seconds uploads a slightly advanced save and reads a ranking, the way the game client does.
//   node node-load.mjs <game dir> --url http://host --players 2000 --interval 30 --seconds 120
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const args=process.argv.slice(2),game=path.resolve(args[0]);
const opt=(name,fallback)=>{const i=args.indexOf('--'+name);return i>=0?args[i+1]:fallback};
const URL_BASE=opt('url','http://127.0.0.1'),PLAYERS=Number(opt('players',500)),INTERVAL=Number(opt('interval',30)),SECONDS=Number(opt('seconds',60));
const {rankedAction}=await import(pathToFileURL(path.join(game,'dist/server/rank-simulation.js')).href);
const stats={count:0,ms:[],status:{},errors:0},fresh=new Map();
async function call(player,method,route,body,extra={}){
 const started=performance.now();
 try{
  const res=await fetch(URL_BASE+route,{method,headers:{...(body?{'Content-Type':'application/json; charset=utf-8','Origin':URL_BASE}:{}),...(player.cookie?{Cookie:player.cookie}:{}),...extra},
   body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(20000)});
  const set=res.headers.get('set-cookie');if(set)player.cookie=set.split(';')[0];
  const text=await res.text();
  if(player.measure){stats.count++;stats.ms.push(performance.now()-started);const k=route.split('?')[0].replace('/api/','')+' '+res.status;stats.status[k]=(stats.status[k]||0)+1}
  try{return {status:res.status,body:JSON.parse(text)}}catch{return {status:res.status,body:null}}
 }catch(error){if(player.measure){stats.errors++;stats.count++}return {status:0,body:null}}
}
async function signUp(i){
 const player={cookie:'',measure:false,name:'부하'+Date.now().toString(36).slice(-5)+i.toString(36)};
 await call(player,'GET','/api/nickname');
 const named=await call(player,'POST','/api/nickname',{action:'claim',name:player.name});
 if(named.status!==200)return null;
 const job=['warrior','mage','archer','paladin','shadow'][i%5];
 if(!fresh.has(job))fresh.set(job,JSON.stringify(rankedAction(null,{action:'register',job},Date.now()).state));
 const state=JSON.parse(fresh.get(job));
 state.nickname=player.name;
 const first=await call(player,'POST','/api/save',{baseRevision:0,data:JSON.stringify(state)});
 if(first.status!==200)return null;
 player.revision=first.body.revision;player.state=JSON.parse(first.body.data);
 return player;
}
async function play(player,until){
 await new Promise(r=>setTimeout(r,Math.random()*INTERVAL*1000));
 player.measure=true;
 while(Date.now()<until){
  player.state.kills=(player.state.kills||0)+1;player.state.gold=(player.state.gold||0)+5;
  const saved=await call(player,'POST','/api/save',{baseRevision:player.revision,data:JSON.stringify(player.state)});
  if(saved.status===200){player.revision=saved.body.revision;player.state=JSON.parse(saved.body.data)}
  else if(saved.status===409){const fresh=await call(player,'GET','/api/save');if(fresh.status===200&&fresh.body?.data){player.revision=fresh.body.revision;player.state=JSON.parse(fresh.body.data)}}
  await call(player,'GET','/api/rankings?board='+['power','stage','guild'][Math.floor(Math.random()*3)]);
  await new Promise(r=>setTimeout(r,INTERVAL*1000*(.8+Math.random()*.4)));
 }
}
console.log(`signing up ${PLAYERS} players at ${URL_BASE} ...`);
const t0=Date.now(),players=[];
for(let i=0;i<PLAYERS;i+=25)players.push(...(await Promise.all(Array.from({length:Math.min(25,PLAYERS-i)},(_,k)=>signUp(i+k)))).filter(Boolean));
console.log(`${players.length} signed up in ${((Date.now()-t0)/1000).toFixed(1)}s (${(players.length/((Date.now()-t0)/1000)).toFixed(0)} sign-ups/s)`);
const until=Date.now()+SECONDS*1000,started=Date.now();
await Promise.all(players.map(p=>play(p,until)));
const took=(Date.now()-started)/1000,sorted=stats.ms.sort((a,b)=>a-b),at=q=>sorted.length?sorted[Math.min(sorted.length-1,Math.floor(sorted.length*q))].toFixed(0):'-';
console.log(JSON.stringify({players:players.length,intervalSeconds:INTERVAL,requests:stats.count,perSecond:+(stats.count/took).toFixed(1),p50ms:at(.5),p95ms:at(.95),p99ms:at(.99),failed:stats.errors,status:stats.status}));
