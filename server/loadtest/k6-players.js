// k6 load test (server guide, section 10): virtual players who save and read a ranking every 30 seconds.
//   k6 run -e URL=https://game.example.com -e PLAYERS=10000 -e MINUTES=10 k6-players.js
// Run it against a server in AUTH_MODE=guest (a staging copy), never against live player data.
// Passes when 95% of requests answer within 200 ms and none fail.
import http from 'k6/http';
import {check,sleep} from 'k6';
import {SharedArray} from 'k6/data';
const URL=__ENV.URL||'http://127.0.0.1',PLAYERS=Number(__ENV.PLAYERS||1000),MINUTES=Number(__ENV.MINUTES||10),INTERVAL=Number(__ENV.INTERVAL||30);
const fresh=new SharedArray('new-game',()=>[JSON.parse(open('./new-game.json'))])[0];
export const options={
 scenarios:{players:{executor:'ramping-vus',startVUs:0,stages:[{duration:'2m',target:PLAYERS},{duration:MINUTES+'m',target:PLAYERS},{duration:'30s',target:0}],gracefulRampDown:'10s'}},
 thresholds:{http_req_duration:['p(95)<200'],'checks{kind:play}':['rate>0.999']}
};
const JSON_HEADERS={'Content-Type':'application/json; charset=utf-8','Origin':URL};
let me=null;
export default function(){
 if(!me){
  // Sign up: a guest cookie (kept by k6 for this virtual player), a nickname, and a first save.
  const jobs=Object.keys(fresh),job=jobs[__VU%jobs.length],name='k'+__VU.toString(36)+Date.now().toString(36).slice(-5);
  http.get(URL+'/api/nickname');
  const named=http.post(URL+'/api/nickname',JSON.stringify({action:'claim',name}),{headers:JSON_HEADERS});
  if(named.status!==200){sleep(5);return}
  const state=Object.assign({},fresh[job],{nickname:name});
  const first=http.post(URL+'/api/save',JSON.stringify({baseRevision:0,data:JSON.stringify(state)}),{headers:JSON_HEADERS});
  if(first.status!==200){sleep(5);return}
  me={revision:first.json('revision'),state:JSON.parse(first.json('data'))};
  sleep(Math.random()*INTERVAL);
 }
 me.state.kills=(me.state.kills||0)+1;me.state.gold=(me.state.gold||0)+5;
 const saved=http.post(URL+'/api/save',JSON.stringify({baseRevision:me.revision,data:JSON.stringify(me.state)}),{headers:JSON_HEADERS,tags:{kind:'play'}});
 // 429 is the game telling a client to slow down; it is an answer, not a failure.
 check(saved,{'save answered':r=>r.status===200||r.status===409||r.status===429},{kind:'play'});
 if(saved.status===200){me.revision=saved.json('revision');me.state=JSON.parse(saved.json('data'))}
 else if(saved.status===409){const now=http.get(URL+'/api/save');if(now.status===200&&now.json('data')){me.revision=now.json('revision');me.state=JSON.parse(now.json('data'))}}
 const board=http.get(URL+'/api/rankings?board='+['power','stage','guild'][Math.floor(Math.random()*3)],{tags:{kind:'play'}});
 check(board,{'ranking answered':r=>r.status===200},{kind:'play'});
 sleep(INTERVAL*(0.8+Math.random()*0.4));
}
