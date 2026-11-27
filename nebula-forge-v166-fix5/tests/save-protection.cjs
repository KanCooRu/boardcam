'use strict';
const assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../dist/client/save-guard.js'),'utf8');
const snapshot=stage=>JSON.stringify({stage,level:8,gold:12,stats:[],gear:[]});
const firstDay=Date.UTC(2026,10,1,16,0); // 2026-11-02 01:00 in Korea.
const dayMs=86400000;
// Each device gets separate storage, clocks and callbacks but can share one account endpoint.
function cloud(data=null,registered=true){
 const requests=[];
 let fence,revision=data===null?0:7;
 const server={requests,registered,name:registered?'별빛기사':null,fail:null,
  raw:()=>data,revision:()=>revision,
  holdNextWrite(){
   let enter,release;
   const entered=new Promise(resolve=>{enter=resolve}),wait=new Promise(resolve=>{release=resolve});
   fence={entered,wait,enter,release};return fence;
  },
  async fetch(url,options={}){
   const method=options.method||'GET',body=options.body?JSON.parse(options.body):null;
   requests.push({url,method,body});
   if(server.fail==='offline')throw Error('offline');
   if(server.fail==='static404')return new Response('missing route',{status:404});
   if(method==='POST'&&server.fail==='limited')return Response.json({retryAfterMs:5000},{status:429,headers:{'Retry-After':'5'}});
   if(typeof server.fail==='number')return Response.json({error:'unavailable'},{status:server.fail});
   if(url==='/api/nickname'){
    if(method==='POST'&&body.action!=='check'){server.name=body.name;server.registered=true}
    return Response.json({name:server.name});
   }
   assert.equal(url,'/api/save');
   const record=()=>({revision,data,updatedAt:firstDay});
   if(method==='GET')return data===null?Response.json({code:'save_not_found',error:'서버 저장이 없습니다.'},{status:404}):Response.json(record());
   assert.equal(method,'POST','legacy PUT cannot appear on the modern client');
   assert.equal(options.headers['Content-Type'],'application/json');
   assert.deepEqual(Object.keys(body).sort(),['baseRevision','data']);assert.equal(typeof body.data,'string');
   if(fence){const latch=fence;fence=null;latch.enter();await latch.wait}
   if(!server.registered)return Response.json({code:'nickname_required',error:'nickname_required'},{status:428});
   if(body.baseRevision!==revision)return Response.json(record(),{status:409});
   data=body.data;revision++;return Response.json(record());
  }
 };
 return server;
}
function session(map=new Map(),options={}){
 let clock=options.clock??firstDay;
 const alerts=[],confirmations=[],notices=[],timers=new Map();
 const server=options.server||cloud(null,false);
 let serial=0;
 const later=(fn,delay)=>{const id=++serial;timers.set(id,{fn,at:clock+delay});return id};
 const settle=()=>new Promise(resolve=>setImmediate(resolve));
 async function advance(ms){
  const end=clock+ms;
  while(true){
   const next=[...timers].filter(([,t])=>t.at<=end).sort((a,b)=>a[1].at-b[1].at)[0];
   if(!next)break;
   timers.delete(next[0]);clock=next[1].at;next[1].fn();await settle();
  }
  clock=end;await settle();
 }
 let reloads=0,started=false,accept=true,blocked=null,state;
 const localStorage={
  get length(){return map.size},
  key:index=>[...map.keys()][index]??null,
  getItem:key=>map.get(key)??null,
  setItem(key,value){if(key===blocked||blocked==='*')throw new Error('QuotaExceededError');map.set(key,String(value))},
  removeItem:key=>map.delete(key)
 };
 class GameDate extends Date{
  constructor(...args){super(...(args.length?args:[clock]))}
  static now(){return clock}
 }
 const nodes=new Map();
 function element(tag){
  return {tagName:tag.toUpperCase(),children:[],textContent:'',open:false,
   append(...items){this.children.push(...items);for(const item of items)if(item?.id)nodes.set(item.id,item)},
   appendChild(item){this.append(item)},
   replaceChildren(...items){this.children=[];this.append(...items)},
   remove(){if(this.id)nodes.delete(this.id)},
   setAttribute(key,value){this[key]=value},
   showModal(){this.open=true},close(){this.open=false}
  };
 }
 const body=element('body'),location={href:'https://game.test/',reload(){reloads++}};
 const confirm=message=>{confirmations.push(message);return accept},alert=message=>alerts.push(message);
 const document={hidden:false,addEventListener(){},querySelectorAll:()=>[],getElementById:id=>nodes.get(id)||null,createElement:element,body};
 const starter=()=>JSON.parse(snapshot(1)),migrate=data=>{if(data.rejectMigration)throw Error('migration refused');return data};
 const ctx=vm.createContext({localStorage,AbortController,setTimeout:later,clearTimeout:id=>timers.delete(id),setInterval:later,clearInterval:id=>timers.delete(id),console,Date:GameDate,JSON,KEY:'main',testSession:null,
  fetch:(url,request)=>server.fetch(url,request),document,location,confirm,alert,crypto:globalThis.crypto,window:{confirm,alert,location,addEventListener(){}},
  notice:message=>notices.push(message),starter,migrate,validateImport:migrate,
  attendanceDay:()=>new Date(clock+9*3600000).toISOString().slice(0,10)
 });
 vm.runInContext(source,ctx);
 const guard=vm.runInContext('saveGuard',ctx);
 return {map,guard,ctx,notices,alerts,confirmations,storage:localStorage,advance,settle,server,
  start:()=>guard.boot(()=>{ctx.s=state=guard.readLocal();started=true}),started:()=>started,state:()=>state,reloads:()=>reloads,
  answer:value=>{accept=value},fail:key=>{blocked=key},setTime:value=>{clock=value},
  dialog:()=>nodes.get('saveRecovery'),
  click:async label=>{
   const button=nodes.get('saveRecovery')?.children.find(node=>node.tagName==='BUTTON'&&node.textContent===label);
   assert.ok(button,label);assert.ok(!button.disabled,label);return button.onclick();
  },
  action:code=>vm.runInContext(code,ctx)};
}
if(require.main!==module){module.exports={session};return}
const backup=(date,data)=>JSON.stringify({date,data});
const backupSlots=map=>[1,2,3].map(i=>map.get('main_bak'+i));
const brokenKeys=map=>[...map.keys()].filter(key=>/^main_broken_\d+$/.test(key)).sort();
const {run}=require('./harness.cjs');
const watchdog=setTimeout(()=>{console.error('A save operation failed to settle');process.exit(1)},20000);
const settings=run("saveManager()"),restoreButton=settings.match(/<button[^>]*onclick="([^"]+)"[^>]*>백업에서 복구<\/button>/);
assert.ok(restoreButton,'One restore action in save settings');
assert.equal((settings.match(/>백업에서 복구<\/button>/g)||[]).length,1);
assert.doesNotMatch(restoreButton[0],/disabled/);
assert.match(run("testSession={enabled:true};saveManager()"),/<button[^>]*disabled[^>]*>백업에서 복구/);
(async()=>{
 const one=snapshot(11),two=snapshot(12);
 for(const raw of ['{','null','{}','[]','',JSON.stringify({...JSON.parse(one),testOnly:true}),JSON.stringify({...JSON.parse(one),rejectMigration:true})]){
  const map=new Map([['main',raw],['main_bak1',backup('2026-11-01',one)]]);
  const oldBackups=backupSlots(map),t=session(map);await t.start();
  assert.ok(t.dialog()?.open&&!t.started()&&t.guard.locked());
  assert.ok(t.dialog().children.some(node=>node.textContent==='저장을 읽지 못했습니다'));
  assert.deepEqual(t.dialog().children.filter(node=>node.tagName==='BUTTON').map(node=>node.textContent).sort(),['백업에서 복구','새로 시작'].sort());
  assert.equal(t.guard.write('main',two),false);assert.equal(map.get('main'),raw);
  assert.deepEqual(backupSlots(map),oldBackups);assert.equal(brokenKeys(map).length,1);assert.equal(map.get(brokenKeys(map)[0]),raw);
 }
 const repeated=new Map();
 for(let i=1;i<=5;i++){
  repeated.set('main','bad'+i);
  const t=session(repeated,{clock:firstDay+1000*i});await t.start();
  assert.deepEqual(brokenKeys(repeated).map(key=>repeated.get(key)),Array.from({length:Math.min(i,3)},(_,j)=>'bad'+(Math.max(1,i-2)+j)));
 }
 console.log('PASS malformed, shape-invalid, migration-failing saves remain intact; newest three original strings retained');

 const daily=new Map();
 for(let i=0;i<4;i++){
  daily.set('main',snapshot(10+i));const t=session(daily,{clock:firstDay+dayMs*i});await t.start();
  assert.equal(t.state().stage,10+i);
  const slots=backupSlots(daily).filter(Boolean).map(raw=>JSON.parse(raw));
  assert.deepEqual(slots.map(row=>row.date),Array.from({length:Math.min(i+1,3)},(_,n)=>'2026-11-0'+(2+i-n)));
  assert.deepEqual(slots.map(row=>row.data),Array.from({length:Math.min(i+1,3)},(_,n)=>snapshot(10+i-n)));
  const previous=backupSlots(daily);
  const changed=snapshot(200+i);assert.equal(t.guard.write('main',changed),true);
  const sameDay=session(daily,{clock:firstDay+dayMs*i+3600000});await sameDay.start();
  assert.equal(sameDay.state().stage,200+i);
  assert.deepEqual(backupSlots(daily),previous);
 }
 // Recover from the settings control before the next day's first successful load.
 const live=session(daily,{clock:firstDay+dayMs*3+7200000});await live.start();
 const previous=backupSlots(daily);
 live.setTime(firstDay+dayMs*4);
 live.answer(false);await live.action(restoreButton[1]);assert.equal(live.reloads(),0);assert.equal(live.map.get('main'),snapshot(203));
 live.answer(true);await live.action(restoreButton[1]);
 assert.equal(live.reloads(),1);assert.equal(live.map.get('main'),snapshot(13));
 assert.match([...live.confirmations,...live.notices,...live.alerts].join(' '),/2026-11-05/);
 assert.deepEqual(backupSlots(live.map),previous);
 // If the player returns the day after damage, bak1 still holds the previous day's valid state.
 const brokenAtBoot=new Map(daily);brokenAtBoot.set('main','invalid today');
 const prior=session(brokenAtBoot,{clock:firstDay+dayMs*4});await prior.start();
 await prior.click('백업에서 복구');
 assert.equal(prior.reloads(),1);assert.equal(prior.map.get('main'),snapshot(13));
 assert.match([...prior.confirmations,...prior.notices,...prior.alerts].join(' '),/2026-11-05/);
 console.log('PASS Korean-day, once-per-day rotation; all three slots stay intact across valid, failed and repeated loads');

 for(const index of [1,2,3]){
  const map=new Map([['main','}']]);const t=session(map);
  for(let i=1;i<=3;i++){
   const raw=i===index?snapshot(i+20):i===1?'bad':JSON.stringify({...JSON.parse(one),rejectMigration:true});
   map.set('main_bak'+i,backup('2026-10-'+(30-i),raw));
  }
  const before=backupSlots(map);await t.start();await t.click('백업에서 복구');
  assert.equal(t.reloads(),1);assert.equal(map.get('main'),snapshot(index+20));assert.deepEqual(backupSlots(map),before);
  assert.match([...t.confirmations,...t.alerts,...t.notices].join(' '),new RegExp('2026-10-'+(30-index)));
 }
 const bad=new Map([['main','{']]),fresh=session(bad);await fresh.start();
 fresh.answer(false);await fresh.click('새로 시작');assert.equal(fresh.reloads(),0);assert.equal(bad.get('main'),'{');assert.ok(fresh.guard.locked());
 fresh.answer(true);await fresh.click('새로 시작');assert.equal(fresh.reloads(),1);
 assert.equal(JSON.parse(bad.get('main')).stage,1);assert.equal(bad.get(brokenKeys(bad)[0]),'{');
 assert.equal(fresh.confirmations.length,2);
 console.log('PASS recovery chooses the newest readable backup and reports its date; new game requires a second confirmation');

 const limitedMap=new Map(daily);limitedMap.set('main',two);
 const slotSnapshot=backupSlots(limitedMap),limited=session(limitedMap,{clock:firstDay+5*dayMs});
 limited.fail('main_bak2');await limited.start();
 assert.equal(limited.state().stage,12);assert.equal(limitedMap.get('main'),two);assert.deepEqual(backupSlots(limitedMap),slotSnapshot);
 assert.ok(limited.notices.some(text=>text.includes('저장하지 못했습니다')));
 const store=new Map([['main',one],['main_bak1',backup('2026-11-02',two)]]);
 const failedRestore=session(store);await failedRestore.start();failedRestore.fail('main');
 assert.equal(await failedRestore.action(restoreButton[1]),false);
 assert.equal(failedRestore.reloads(),0);assert.equal(store.get('main'),one);assert.equal(JSON.parse(store.get('main_bak1')).data,two);
 const map=new Map([['main',one]]);const local=session(map);await local.start();
 assert.equal(local.guard.write('main',two),true);assert.equal(map.get('main.previous'),one);
 local.fail('main');assert.equal(local.guard.write('main',snapshot(99)),false);assert.equal(map.get('main'),two);
 assert.ok(local.notices.some(text=>text.includes('저장하지 못했습니다')));
 local.fail(null);map.set('main','newer-tab');assert.equal(local.guard.write('main',two),false);assert.equal(map.get('main'),'newer-tab');

 console.log('PASS quota notification and last good progress, previous copy and concurrent tab detection');
 await checkCloudAuthority();
})().catch(error=>{console.error(error);process.exitCode=1}).finally(()=>clearTimeout(watchdog));
function savedWeapon(plus,last,extra={}){
 return JSON.stringify({...JSON.parse(snapshot(20)),nickname:'별빛기사',classId:'warrior',last,gems:300,
  weaponVersion:1,weapons:{warrior:{plus,peakPlus:20}},...extra});
}
const writes=server=>server.requests.filter(req=>req.method==='POST'&&req.url==='/api/save');
async function checkCloudAuthority(){
 const before=savedWeapon(20,firstDay+dayMs),broken=savedWeapon(0,firstDay);
 for(const failure of ['offline','static404',401,500]){
  const server=cloud(broken),map=new Map([['main',before]]);
  server.fail=failure;const device=session(map,{server});await device.start();
  assert.equal(device.started(),false);
  assert.equal(map.get('main'),before);assert.equal(writes(server).length,0);
  const dialog=device.dialog();assert(dialog.open);
  assert(dialog.children.some(el=>el.textContent.includes('서버에 연결하지 못했습니다')));
  server.fail=null;await device.click('다시 시도');await device.settle();
  const reopened=device.reloads()?session(map,{server}):device;
  if(reopened!==device)await reopened.start();
  assert(reopened.started());assert.equal(reopened.state().weapons.warrior.plus,0);
 }
 console.log('PASS first GET must succeed, only 404 admits local play, Korean retry resumes canonical progress');

 // A forged local timestamp and cloud link from the previous API are never grounds to beat the server.
 const server=cloud(before),deviceA=session(new Map([['main',before],['main.cloud',JSON.stringify({owner:'retired-owner',revision:122})]]),{server});
 await deviceA.start();assert(deviceA.started());
 const wiped=session(new Map(),{server});await wiped.start();
 assert.deepEqual(wiped.state(),JSON.parse(before));
 deviceA.guard.write('main',broken);await deviceA.guard.sync(true);await deviceA.settle();
 assert.equal(server.raw(),broken);assert.equal(writes(server).at(-1).body.baseRevision,7);
 const oldCopy=savedWeapon(20,firstDay+dayMs*100);
 const oldBackup=backup('2026-11-01',oldCopy);
 const tampered=new Map([['main',oldCopy],['main.previous',oldCopy],['main_bak1',oldBackup],['main.cloud',JSON.stringify({revision:900,snapshot:oldCopy})]]);
 const resumed=session(tampered,{server});await resumed.start();
 assert.equal(resumed.state().weapons.warrior.plus,0);assert.equal(tampered.get('main'),broken);
 const other=session(new Map(),{server});await other.start();assert.deepEqual(other.state(),JSON.parse(broken));
 const corrupt=session(new Map([['main','bad old device']]),{server});await corrupt.start();
 assert(corrupt.started());assert.equal(corrupt.state().weapons.warrior.plus,0);
 assert.equal(corrupt.map.get(brokenKeys(corrupt.map)[0]),'bad old device');
 const tight=session(new Map([['main',oldCopy]]),{server});tight.fail('main');await tight.start();
 assert(tight.started());assert.equal(tight.state().weapons.warrior.plus,0);assert.equal(tight.map.get('main'),oldCopy);
 assert.match(tight.notices.join(' '),/저장하지 못했습니다/);
 console.log('PASS two devices, cleared storage, broken weapon and stale legacy cache restore the server record');

 // The real enhancement UI and its migration must agree with the serialized +0 being restored here.
 const forged=run(`(()=>{
  testSession=null;s=starter();s.classId='warrior';s.nickname='별빛기사';s.effects=false;
  s.gold=s.stones=s.starIron=100000;s.forgeGuardOn=false;s.forgeGuards=0;
  const w=currentWeapon();w.plus=w.peakPlus=20;w.skin=weaponAppearanceTier(20);
  const initial=JSON.stringify(s),random=Math.random;
  try{
   Math.random=()=>.08;openWeaponRitual('weaponEnhance');
   if(!attemptWeaponEnhance()||weaponRitual.phase!=='warning'||!confirmForgeRisk()||weaponRitual.result.outcome!=='destroy')throw Error('Forge did not break the weapon');
   return [initial,JSON.stringify(s)];
  }finally{Math.random=random}
 })()`);
 const forgedServer=cloud(forged[0]),forging=session(new Map(),{server:forgedServer});await forging.start();
 assert(forging.guard.write('main',forged[1]));await forging.guard.sync(true);
 const forgingReturn=session(new Map([['main',forged[0]]]),{server:forgedServer});await forgingReturn.start();
 const actual=forgingReturn.state();
 assert.equal(actual.weapons.warrior.plus,0);assert.equal(actual.weapons.warrior.peakPlus,20);
 assert(actual.weapons.warrior.basic);assert(actual.gold<JSON.parse(forged[0]).gold);
 assert.equal(run(`s=migrate(${JSON.stringify(actual)});currentWeapon().plus`),0);
 console.log('PASS real unguarded +20 destruction and costs survive device rollback and full game migration');

 // Recover/import while an account record exists, even when the device already has the right revision.
 for(const control of ['restore','import']){
  const local=new Map([['main',broken],['main_bak1',oldBackup]]);
  const device=session(local,{server});await device.start();local.set('main_bak1',oldBackup);
  const start=server.requests.length;
  if(control==='restore')await device.action(restoreButton[1]);
  else await device.guard.importLocal(oldCopy);
  await device.settle();assert.equal(local.get('main'),broken);assert.equal(server.raw(),broken);
  assert(server.requests.slice(start).some(req=>req.method==='GET'));
  assert(!server.requests.slice(start).some(req=>req.body?.data===oldCopy));
 }
 console.log('PASS settings backup restoration and confirmed import consult current server data before installing');

 const staleMap=new Map(),stale=session(staleMap,{server});await stale.start();
 const late=savedWeapon(20,firstDay+2*dayMs),winner=savedWeapon(0,firstDay,{gold:91});
 const latch=server.holdNextWrite();stale.guard.write('main',late);
 const inFlight=stale.guard.sync(true);await latch.entered;
 stale.guard.write('main',savedWeapon(20,firstDay+3*dayMs));
 const winning=session(new Map(),{server});await winning.start();winning.guard.write('main',winner);
 await winning.guard.sync(true);await winning.settle();assert.equal(server.raw(),winner);
 latch.release();await inFlight;await stale.settle();
 assert.equal(staleMap.get('main'),winner);assert.equal(server.raw(),winner);
 assert.match([...stale.alerts,...stale.notices].join(' '),/다른 기기나 다른 창에서 저장한 최신 진행을 불러왔습니다/);
 await stale.advance(120000);assert.equal(server.raw(),winner);
 assert.deepEqual(JSON.parse(staleMap.get('main')),JSON.parse(winner));
 console.log('PASS late write gets 409, installs the winning revision and discards queued stale changes');

 // The latest device value may equal the earlier server head while an intervening value is in flight.
 const reverting=cloud(broken),toggle=session(new Map(),{server:reverting});await toggle.start();
 const toggled=savedWeapon(0,firstDay,{powerSaving:true});
 const pending=reverting.holdNextWrite();toggle.guard.write('main',toggled);
 const first=toggle.guard.sync(true);await pending.entered;
 assert(toggle.guard.write('main',broken));pending.release();await first;
 await toggle.advance(10500);
 assert.deepEqual(writes(reverting).map(r=>r.body.data),[toggled,broken]);assert.equal(reverting.raw(),broken);
 console.log('PASS changing back to the previous value during an active upload still saves the latest value');

 const meter=cloud(broken),player=session(new Map(),{server:meter});await player.start();
 const limited=savedWeapon(0,firstDay,{gold:502});meter.fail='offline';
 player.guard.write('main',limited);await player.guard.sync(true);await player.settle();
 assert(player.guard.canTransact(true));await player.advance(29500);assert(player.guard.canTransact(true));
 await player.advance(1600);assert.equal(player.guard.canTransact(),false);
 assert.match(player.notices.join(' '),/서버와 연결되면 다시 할 수 있습니다/);
 assert.equal(player.guard.locked(),false);
 assert(player.guard.write('main',limited));
 meter.fail=null;await player.guard.sync(true);await player.advance(15000);
 assert.equal(meter.raw(),limited);assert(player.guard.canTransact(true));
 console.log('PASS 30 seconds of upload failure closes spending only and successful sync reopens it');

 const batching=cloud(broken),normal=session(new Map(),{server:batching});await normal.start();
 const count=writes(batching).length;
 for(let i=0;i<5;i++)assert(normal.guard.write('main',savedWeapon(0,firstDay,{gold:600+i})));
 await normal.advance(9999);assert.equal(writes(batching).length,count);
 await normal.advance(10);assert.equal(writes(batching).length,count+1);
 assert.equal(JSON.parse(batching.raw()).gold,604);
 normal.action('testSession={enabled:true}');
 const sandbox=savedWeapon(25,firstDay,{testOnly:true});
 normal.guard.write('main_test_session',sandbox);await normal.guard.sync(true);await normal.advance(30000);
 assert(!writes(batching).some(r=>r.body.data===sandbox));assert.equal(normal.map.get('main_test_session'),sandbox);
 console.log('PASS ordinary saves coalesce to latest value at ten seconds and test-session snapshots stay local');

 const throttled=cloud(broken),rate=session(new Map(),{server:throttled});await rate.start();
 throttled.fail='limited';rate.guard.write('main',limited);await rate.guard.sync(true);await rate.settle();
 const firstTry=writes(throttled).length;assert.equal(firstTry,1);
 await rate.advance(4900);assert.equal(writes(throttled).length,firstTry);
 throttled.fail=null;await rate.advance(5110);
 assert.equal(throttled.raw(),limited);assert.equal(writes(throttled).length,firstTry+1);assert(rate.guard.canTransact(true));
 console.log('PASS rate-limited urgent upload waits and retries without dropping progress');

 await checkFirstNickname();
}
async function checkFirstNickname(){
 const server=cloud(null,false),map=new Map(),device=session(map,{server});
 await device.start();assert(device.started());assert.equal(server.raw(),null);
 await device.advance(15000);assert.equal(writes(server).length,0);
 Object.assign(device.ctx,{
  classPreview:'warrior',pendingClassChoice:'warrior',profileNameDraft:'새별기사',
  validNickname:name=>name?.length>=2?name:null,
  $:()=>({focus(){}}),save:()=>device.guard.write('main',JSON.stringify(device.ctx.s)),
  chooseClass:id=>{device.ctx.s.classId=id;device.ctx.save();return true},
  paint(){},closeMenu(){}
 });
 vm.runInContext(fs.readFileSync(path.join(__dirname,'../dist/client/nickname.js'),'utf8'),device.ctx);
 assert(await device.action("submitNickname('warrior')"));await device.settle();
 assert.equal(server.name,'새별기사');assert.equal(JSON.parse(server.raw()).classId,'warrior');
 assert.equal(JSON.parse(server.raw()).nickname,'새별기사');
 assert.equal(writes(server)[0].body.baseRevision,0);
 const guest=cloud(null,false),legacy=session(new Map([['main',savedWeapon(6,firstDay)]]),{server:guest});await legacy.start();
 assert(legacy.started());assert.equal(guest.raw(),null);
 guest.registered=true;await legacy.guard.accountReady();await legacy.settle();
 assert.equal(JSON.parse(guest.raw()).weapons.warrior.plus,6);
 console.log('PASS first nickname creates revision 1, and a legacy unregistered save uploads after registering');
}
