// Device recovery copies are local. The authenticated server decides which revision starts play.
const saveGuard=(()=>{
 const backupKeys=[1,2,3].map(i=>KEY+'_bak'+i),brokenPrefix=KEY+'_broken_',previous=KEY+'.previous';
 let stopped=false,booted=false,starting=false,queuedRaw,bootRaw,savedRaw,previousAt=0;
 let brokenRaw,recoveryStatus=null,writeWarning=false,revision=0,confirmed='',pending=null,pendingKey='';
 let generation=0,inFlight=null,publicWrite=null,restoring=false,waitingName=false,urgent=false,retryAt=0,accountTag='',resumeNotice='';
 let uploadTimer=0,scheduledAt=Infinity,failureSince=null,lockTimer=0;
 const routes={forge:'/api/forge/enhance',draw:'/api/draw',shop:'/api/shop/buy',claim:'/api/reward/claim',
  trialStart:'/api/trial/start',trialFinish:'/api/trial/finish',trialClaim:'/api/trial/claim'};
 const commands=new Set();let commandTail=Promise.resolve();
 const blockedMessage='서버와 연결되면 다시 할 수 있습니다';
 function player(){return typeof s==='undefined'?null:s}
 function testing(){return !!testSession||player()?.testOnly===true}
 function decode(raw) {
  const value = JSON.parse(raw);
  if (!value || value.testOnly || !Number.isInteger(value.level) || value.level < 1 ||
   !Number.isInteger(value.stage) || value.stage < 1 || !Number.isFinite(value.gold) || value.gold < 0 ||
   !Array.isArray(value.gear) || !Array.isArray(value.stats)) throw Error('저장 형식을 확인할 수 없습니다.');
  return value;
 }
 function safeGet(key) { try { return localStorage.getItem(key); } catch { return null; } }
 function feedback(message) {
  if(stopped&&recoveryStatus)recoveryStatus.textContent=message;
  else notice(message);
 }
 function writeFailed() {
  if(!writeWarning)feedback('저장하지 못했습니다');
  writeWarning=true;
  return false;
 }
 function rememberBroken(raw) {
  if(raw===null||raw===undefined)return true;
  const keys=[];
  for(let i=0;i<localStorage.length;i++){
   const key=localStorage.key(i);
   if(key?.startsWith(brokenPrefix)&&/^\d+$/.test(key.slice(brokenPrefix.length)))keys.push(key);
  }
  keys.sort((a,b)=>Number(b.slice(brokenPrefix.length))-Number(a.slice(brokenPrefix.length)));
  if(!keys.length||localStorage.getItem(keys[0])!==raw){
   const stamp=Math.max(Date.now(),keys.length?Number(keys[0].slice(brokenPrefix.length))+1:0);
   const key=brokenPrefix+stamp;
   localStorage.setItem(key,raw);
   keys.unshift(key);
  }
  for(const old of keys.slice(3))localStorage.removeItem(old);
  return true;
 }
 function backupDate(time){return new Date(time+9*3600000).toISOString().slice(0,10)}
 function envelope(raw) {
  try{
   const copy=JSON.parse(raw);
   if(/^\d{4}-\d{2}-\d{2}$/.test(copy?.date)&&typeof copy.data==='string')return copy;
  }catch{}
  return null;
 }
 function dailyBackup(raw) {
  if(testSession||raw===null)return;
  const date=backupDate(Date.now());
  try{
   const old=backupKeys.map(key=>localStorage.getItem(key));
   if(envelope(old[0])?.date===date)return;
   const next=[JSON.stringify({date,data:raw}),old[0],old[1]],changed=[];
   try{
    for(let i=2;i>=0;i--){
     if(next[i]===null||next[i]===old[i])continue;
     localStorage.setItem(backupKeys[i],next[i]);changed.push(i);
    }
   }catch(error){
    for(const i of changed.reverse()){
     if(old[i]===null)localStorage.removeItem(backupKeys[i]);
     else localStorage.setItem(backupKeys[i],old[i]);
    }
    throw error;
   }
  }catch{writeFailed();}
 }
 function findBackup() {
  let hasDaily=false;
  for(const key of backupKeys){
   const raw=localStorage.getItem(key);
   if(raw===null)continue;
   hasDaily=true;
   const copy=envelope(raw);
   if(copy)try{validateImport(decode(copy.data));return copy;}catch{}
  }
  // Upgrading devices can still recover their last pre-rotation snapshot.
  if(!hasDaily){
   const raw=localStorage.getItem(previous);
   if(raw!==null)try{
    const value=decode(raw);validateImport(value);
    return {data:raw,date:Number.isFinite(value.last)&&value.last>0?backupDate(value.last):'날짜 미상'};
   }catch{}
  }
  return null;
 }
 function fingerprint(raw){
  // Autosaves update last even if the inventory, awaySince and all gameplay are unchanged.
  const value=decode(raw);delete value.last;return JSON.stringify(value);
 }
 function serverRecord(value,submitted){
  if(!value||!Number.isSafeInteger(value.revision)||value.revision<1||!Number.isFinite(value.updatedAt)||typeof value.data!=='string')
   throw Error('서버 저장을 읽지 못했습니다.');
  if(value.data!==submitted)validateImport(decode(value.data));return value;
 }
 const keepaliveLimit=60000;
 function wireBytes(raw){return typeof Blob==='function'?new Blob([raw]).size:typeof TextEncoder==='function'?new TextEncoder().encode(raw).length:raw.length*3}
 async function commandWire(raw,large){
  if(large&&typeof CompressionStream==='function'&&typeof Blob==='function'&&typeof Response==='function'){
   try{
    const compressed=await new Response(new Blob([raw]).stream().pipeThrough(new CompressionStream('gzip'))).arrayBuffer();
    if(compressed.byteLength<wireBytes(raw))return {body:compressed,bytes:compressed.byteLength,encoding:'gzip'};
   }catch{}
  }
  return {body:raw,bytes:wireBytes(raw)};
 }
 async function request(method='GET',data,url='/api/save',extraHeaders={},wire){
  const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),6500);
  try{
   const body=wire?.body??(data?JSON.stringify(data):undefined);
   const bytes=wire?.bytes??(body&&wireBytes(body));
   const headers=body?{'Content-Type':'application/json',...extraHeaders}:{};
   if(wire?.encoding==='gzip'){
    headers['Content-Type']='application/octet-stream';headers['X-Nebula-Gzip']='1';
   }
   const response=await fetch(url,{method,signal:controller.signal,credentials:'same-origin',cache:'no-store',
    headers,body,keepalive:!!body&&bytes<=keepaliveLimit});
   let value;
   try{value=await response.json()}catch{
    throw Object.assign(Error('서버 응답을 읽지 못했습니다.'),{status:response.status>=400?response.status:502});
   }
   if(method==='GET'&&(response.ok||response.status===404)){
    const tag=response.headers?.get('X-Nebula-Account');
    if(booted&&accountTag&&tag&&accountTag!==tag){stopped=true;location.reload();throw Error('접속 계정이 변경되었습니다.')}
    accountTag=/^[a-f0-9]{64}$/.test(tag||'')?tag:'';
   }
   if(method==='GET'&&response.status===404&&value?.code==='save_not_found')return null;
   if(!response.ok){
    const retry=Math.max(Number(value?.retryAfterMs)||0,1000*(Number(response.headers?.get('Retry-After'))||0));
    throw Object.assign(Error(value?.error||'서버 저장 요청에 실패했습니다.'),{status:response.status,code:value?.code,record:value,retry});
   }
   return serverRecord(value,data?.data);
  }finally{clearTimeout(timeout)}
 }
 function dialog(title,text,actions){
  stopped=true;
  document.getElementById('gameBoot')?.remove();
  let box=document.getElementById('saveRecovery');
  if(!box){box=document.createElement('dialog');box.id='saveRecovery';document.body.append(box)}
  box.replaceChildren();const heading=document.createElement('h2');heading.textContent=title;box.append(heading);
  if(text){const info=document.createElement('p');info.textContent=text;box.append(info)}
  recoveryStatus=document.createElement('p');recoveryStatus.setAttribute('role','status');
  for(const [label,call] of actions){
   const button=document.createElement('button');button.type='button';button.textContent=label;
   button.onclick=async()=>{button.disabled=true;try{await call()}catch(error){feedback(error.message)}finally{button.disabled=false}};
   box.append(button);
  }
  box.append(recoveryStatus);box.oncancel=event=>event.preventDefault();if(!box.open)box.showModal();
 }
 function clearDialog(){
  const box=document.getElementById('saveRecovery');if(box?.open)box.close();
  recoveryStatus=null;stopped=false;
 }
 function connectionDialog(start,error){
  const detail=error?.status===413?'서버 저장 한도 512KB를 초과했습니다. 기기 원본은 보관 중입니다.':'';
  dialog('서버에 연결하지 못했습니다',detail,[['다시 시도',()=>start?boot(start):location.reload()]]);
 }
 function corruptDialog(raw){
  brokenRaw=raw;
  dialog('저장을 읽지 못했습니다','',[
   ['백업에서 복구',restoreBackup],
   ['새로 시작',()=>confirm('현재 기기 기록을 새 게임으로 바꿀까요?')&&restoreFrom('new')]
  ]);
 }
 function cacheRaw(raw){
  try{
   const old=localStorage.getItem(KEY);
   if(old!==null&&old!==raw&&brokenRaw===old)rememberBroken(old);
   if(old!==raw)localStorage.setItem(KEY,raw);
   savedRaw=raw;brokenRaw=undefined;writeWarning=false;return true;
  }catch{return writeFailed()}
 }
 function readLocal(){
  let raw;
  try{
   raw=bootRaw===undefined?localStorage.getItem(KEY):bootRaw;
   if(bootRaw===undefined)savedRaw=raw;
   bootRaw=undefined;
   if(raw===null)return starter();
   const state=migrate(decode(raw));dailyBackup(raw);return state;
  }catch(error){corruptDialog(raw??null);throw error}
 }
 function stopTimer(){clearTimeout(uploadTimer);uploadTimer=0;scheduledAt=Infinity}
 function repaint(){
  if(!booted||testing())return;
  if(typeof paint==='function')paint();
  if(typeof paintTransactionControls==='function')paintTransactionControls();
 }
 function failed(){
  if(failureSince!==null)return;
  failureSince=Date.now();lockTimer=setTimeout(()=>{if(failureSince!==null)repaint()},30001);
 }
 function healthy(){
  const wasBlocked=failureSince!==null&&Date.now()-failureSince>=30000;
  failureSince=null;clearTimeout(lockTimer);lockTimer=0;retryAt=0;if(wasBlocked)repaint();
 }
 function usesServer(){return (starting||booted)&&!testSession}
 function isBusy(){return commands.size>0}
 function transactionMessage(){return isBusy()&&failureSince===null?'서버에서 처리하고 있습니다':blockedMessage}
 function updateControls(){if(booted&&!testing()&&typeof paintTransactionControls==='function')paintTransactionControls()}
 function canTransact(quiet=false){
  if(testing())return true;
  const allowed=!stopped&&!restoring&&!isBusy()&&(failureSince===null||Date.now()-failureSince<30000);
  if(!allowed&&!quiet)feedback(transactionMessage());
  return allowed;
 }
 function acknowledge(record){
  revision=record.revision;confirmed=fingerprint(record.data);healthy();
  if(pendingKey===confirmed){pending=null;pendingKey=''}
 }
 function closeWithRecord(record,message){
  stopped=true;generation++;pending=null;pendingKey='';stopTimer();
  const owner=player();
  if(owner&&!testing()){
   const restored=validateImport(decode(record.data));
   for(const key of Object.keys(owner))if(!Object.hasOwn(restored,key))delete owner[key];
   for(const key of Object.keys(restored))if(key!=='__proto__')owner[key]=restored[key];
  }
  cacheRaw(record.data);alert(message);location.reload();
 }
 function schedule(delay){
  if(!booted||stopped||testing()||waitingName||restoring||isBusy()||!pending)return;
  const at=Math.max(Date.now()+delay,retryAt);
  if(uploadTimer&&scheduledAt<=at)return;
  stopTimer();scheduledAt=at;uploadTimer=setTimeout(()=>{uploadTimer=0;scheduledAt=Infinity;void flush()},Math.max(0,at-Date.now()));
 }
 function queueRaw(raw,key=fingerprint(raw)){
  // An in-flight change can still make the previous confirmed value dirty again.
  pending=inFlight&&!publicWrite?.superseded||key!==confirmed?raw:null;pendingKey=pending?key:'';
  if(!pending)stopTimer();else schedule(10000);
 }
 async function flush(){
  if(!booted||stopped||testing()||restoring||waitingName||isBusy()||!pending)return false;
  if(inFlight){urgent=true;return inFlight}
  if(Date.now()<retryAt){schedule(0);return false}
  stopTimer();urgent=false;
  const epoch=generation,owner=player(),raw=pending,baseRevision=revision;
  const writing=publicWrite={raw,baseRevision,superseded:false};
  const current=()=>epoch===generation&&!testing()&&owner===player();
  inFlight=(async()=>{
   try{
    const record=await request('POST',{baseRevision,data:raw});
    if(!current())return false;
    if(record.revision>=revision){
     if(owner&&record.data!==raw)installCommand(record,decode(raw),owner);
     else acknowledge(record);
    }
    return true;
   }catch(error){
    if(!current()||writing.superseded)return false;
    if(error.status===409){
     if(error.record?.revision===0&&error.record?.data===null){stopped=true;location.reload();return false}
     try{closeWithRecord(serverRecord(error.record),'다른 기기의 진행을 불러왔습니다');return false}
     catch{connectionDialog(null);return false}
    }
    failed();
    if(error.status===428&&error.code==='nickname_required'){
     waitingName=true;
     if(player()?.classId&&typeof syncAccountNickname==='function')void syncAccountNickname();
    }else retryAt=Date.now()+(error.status===429?Math.max(1000,error.retry||5000):5000);
    return false;
   }
  })();
  try{return await inFlight}finally{
   inFlight=null;publicWrite=null;
   if(pendingKey===confirmed){pending=null;pendingKey=''}
   if(pending&&!stopped&&!testing()&&!restoring&&!waitingName)schedule(urgent||retryAt?0:10000);
  }
 }
 function sync(force=false){
  if(!force){schedule(10000);return Promise.resolve(false)}
  if(isBusy()){if(pending)urgent=true;return Promise.resolve(false)}
  return flush();
 }
 // Only a command changes these values. Ordinary combat and navigation can continue during a request.
 const serverFields=new Set(['gems','forgeGuards','forgeDebris','trialPeak','forgeManualTries','classId','costumes','normalCostumeRolls','royalTitlePity','rolls','lastFreeSkillDay','economyClaims']);
 const weaponFields=new Set(['plus','basic','inheritedPlus','grade','master','legacyAttack','peakPlus']);
 const additiveStock=new Set(['gold','ore','stones','shards','petShards','starIron']);
 function serverControls(path,before,after){
  const [root,key,field,detail,stat]=path;
  if(serverFields.has(root)||root==='trial')return true;
  if(root==='weapons'&&path.length===3)return weaponFields.has(field);
  if(root==='pets'||root==='skills')return path.length===2&&(before===undefined||after===undefined);
  if(root==='titlesOwned')return key==='roulette-fate'||key==='trial-conqueror';
  if(root==='costumeEvents')return field==='rolls'||field==='missions'&&detail==='spent'||
    field==='classes'&&['owned','rolls','pity'].includes(stat);
  return root==='daily'&&(key==='fastBattle'||key==='trialRuns')||root==='onlineTest'&&key==='daily'&&field==='diamondPassPurchases';
 }
 function commandValue(before,after,live,path){
  if(serverControls(path,before,after))return after;
  if(live===before||live===after)return after;
  if(after&&before&&live&&typeof after==='object'&&typeof before==='object'&&typeof live==='object'&&
    !Array.isArray(after)&&!Array.isArray(before)&&!Array.isArray(live)){
   for(const key of new Set([...Object.keys(before),...Object.keys(after),...Object.keys(live)])){
    if(key==='__proto__'||key==='prototype'||key==='constructor')continue;
    const value=commandValue(before[key],after[key],live[key],[...path,key]);
    if(value===undefined)delete live[key];else live[key]=value;
   }
   return live;
  }
  if(after===before||Array.isArray(after)&&JSON.stringify(after)===JSON.stringify(before))return live;
  if(path.length===1&&additiveStock.has(path[0])&&[before,after,live].every(Number.isSafeInteger))
   return Math.max(0,after+(live-before));
  return after;
 }
 function installCommand(record,baseline,owner){
  const canonical=decode(record.data);
  commandValue(baseline,canonical,owner,[]);
  acknowledge(record);
  const raw=JSON.stringify(owner);cacheRaw(raw);queueRaw(raw);
 }
 function wait(ms){return new Promise(resolve=>setTimeout(resolve,ms))}
 async function requestCommand(run,current){
  let backoff=750;
  while(current()){
   try{return await run()}
   catch(error){
    if(!current())return null;
    if(error.status===409&&error.record?.revision>0){
     const winner=serverRecord(error.record);
     if(error.code==='already_claimed'&&winner.revision===revision&&fingerprint(winner.data)===confirmed){
      healthy();feedback(error.message);return null;
     }
     closeWithRecord(winner,'다른 기기의 진행을 불러왔습니다');return null;
    }
    if(error.status===428&&error.code==='nickname_required'){
     waitingName=true;
     if(player()?.classId&&typeof syncAccountNickname==='function')void syncAccountNickname();
    }
    if(error.status&&error.status<500&&error.status!==429){healthy();feedback(error.message);return null}
    failed();updateControls();
    // The server may already have committed. Retry the exact same id and base until its receipt arrives.
    await wait(error.status===429?Math.max(250,error.retry||5000):backoff);
    backoff=Math.min(5000,backoff*2);
   }
  }
  return null;
 }
 async function snapshotHash(raw){
  const bytes=typeof TextEncoder==='function'?new TextEncoder().encode(raw):
   Uint8Array.from(encodeURIComponent(raw).replace(/%([0-9A-F]{2})/g,(_,hex)=>String.fromCharCode(parseInt(hex,16))),ch=>ch.charCodeAt(0));
  const hash=await crypto.subtle.digest('SHA-256',bytes);
  return Array.from(new Uint8Array(hash),n=>n.toString(16).padStart(2,'0')).join('');
 }
 const intentPrefix=()=>KEY+'_pending_economy_'+accountTag+'_';
 function forgetIntent(key){if(key)try{localStorage.removeItem(key)}catch{}}
 function rememberIntent(intent){
  if(!accountTag)return null;
  const key=intentPrefix()+intent.id;
  try{localStorage.setItem(key,JSON.stringify(intent));return key}catch{return null}
 }
 async function prepareIntent(intent,large){
  const {base,id,body,meta}=intent;
  const headers={'If-Match':String(base),'X-Nebula-Request-Id':id};
  if(accountTag)headers['X-Nebula-Account']=accountTag;
  if(meta.payment!==undefined)headers['X-Nebula-Payment']=String(meta.payment);
  if(meta.timing!==undefined)headers['X-Nebula-Timing']=String(meta.timing);
  if(meta.manual!==undefined)headers['X-Nebula-Manual']=String(meta.manual);
  if(intent.previousRaw)body._progress.previousHash=await snapshotHash(intent.previousRaw);
  const wire=await commandWire(JSON.stringify(body),large);
  return {bytes:wire.bytes,send:()=>request('POST',body,routes[intent.action],headers,wire)};
 }
 async function resumeLargeCommands(record){
  if(!accountTag)return record;
  const prefix=intentPrefix(),keys=[];
  try{
   for(let i=0;i<localStorage.length;i++){
    const key=localStorage.key(i);if(key?.startsWith(prefix))keys.push(key);
   }
  }catch{return record}
  for(const key of keys){
   let intent;
   try{intent=JSON.parse(localStorage.getItem(key))}catch{}
   if(!intent||key!==prefix+intent.id||!Object.hasOwn(routes,intent.action)||!Number.isSafeInteger(intent.base)||
    !intent.body||!intent.meta||!/^[\w-]{8,96}$/.test(intent.id)){forgetIntent(key);continue}
   try{
    const prepared=await prepareIntent(intent,true);record=await prepared.send();forgetIntent(key);
    resumeNotice='진행 중이던 거래 결과를 불러왔습니다';
   }catch(error){
    if(error.status===409&&error.record?.revision>0){
     record=serverRecord(error.record);resumeNotice=error.code==='already_claimed'?error.message:'다른 기기의 진행을 불러왔습니다';
     // Closing an owned run has no quoted price. Retry against the latest wallet, without its old progress.
     if(intent.action==='trialFinish'&&!error.code&&record.revision>intent.base){
      const {runId,floors,score,settle}=intent.body;
      const retry={action:intent.action,id:crypto.randomUUID(),base:record.revision,meta:{},body:{runId,floors,score,settle}};
      const fresh=await prepareIntent(retry,false);
      try{record=await fresh.send();resumeNotice='오늘의 탑 도전 결과를 불러왔습니다'}
      catch(next){
       if(next.status===409&&next.record?.revision>0){
        record=serverRecord(next.record);
        if(!next.code&&record.revision>retry.base)throw next;
       }
       else if(![400,404,422].includes(next.status))throw next;
      }
     }
    }
    else if(![400,404,409,413,422,428].includes(error.status))throw error;
    else resumeNotice=error.message;
    forgetIntent(key);
   }
  }
  return record;
 }
 async function runCommand(action,body,meta,owner,epoch,id){
  const current=()=>!stopped&&!restoring&&!testing()&&owner===player()&&epoch===generation;
  if(!current())return null;
  if(waitingName){feedback('닉네임을 등록한 뒤 이용할 수 있습니다');return null}
  // Commit unsaved play and the purchase together, including when a public autosave is throttled.
  const raw=JSON.stringify(owner),baseline=decode(raw),base=revision;
  const writing=publicWrite?.baseRevision===base?publicWrite:null;
  if(writing||fingerprint(raw)!==confirmed){
   if(writing)writing.superseded=true;
   body={...body,_progress:{data:raw}};
  }
  const intent={action,body,meta,base,id,previousRaw:writing?.raw};
  const bytes=wireBytes(JSON.stringify(body));
  const large=bytes+(writing?Math.min(keepaliveLimit,wireBytes(writing.raw)+128):0)>keepaliveLimit;
  // Persist before asynchronous compression. An interrupted tab can retry only this account and revision.
  const journal=large||action==='trialFinish'?rememberIntent(intent):null;
  const prepared=await prepareIntent(intent,large);
  if(!current())return null;
  if(prepared.bytes>keepaliveLimit&&!journal){feedback('거래 요청을 보관할 수 없습니다. 기기 저장 공간을 확인해 주세요.');return null}
  const record=await requestCommand(prepared.send,current);
  if(record||current()||stopped&&action!=='trialFinish')forgetIntent(journal);
  if(!record||!current())return null;
  installCommand(record,baseline,owner);
  return record.result??null;
 }
 function command(action,body,meta={}){
  if(!usesServer()||testing()||!Object.hasOwn(routes,action))return Promise.resolve(null);
  const finish=action==='trialFinish',canQueue=finish||action==='claim';
  const key=finish?'trialFinish:'+body?.runId:action==='claim'?'claim:'+JSON.stringify([body?.source,body?.id]):action;
  if(stopped||restoring||commands.has(key)||isBusy()&&!canQueue||!finish&&failureSince!==null&&Date.now()-failureSince>=30000){
   feedback(transactionMessage());return Promise.resolve(null);
  }
  const owner=player(),epoch=generation,id=crypto.randomUUID();
  if(finish)rememberIntent({action,body,meta,base:revision,id});
  commands.add(key);stopTimer();updateControls();
  const job=commandTail.then(()=>runCommand(action,body,meta,owner,epoch,id)).catch(error=>{
   if(!testing()&&!stopped)feedback(error.message||'처리 결과를 확인하지 못했습니다');
   return null;
  }).finally(()=>{
   commands.delete(key);updateControls();
   if(!isBusy())schedule(urgent?0:10000);
  });
  commandTail=job;return job;
 }
 function accountReady(){
  if(testing()||stopped)return Promise.resolve(false);
  const awaiting=waitingName;waitingName=false;
  if(awaiting&&pending)return sync(true);
  return Promise.resolve(false);
 }
 function write(key,raw){
  if(stopped)return false;
  if(key!==KEY){try{localStorage.setItem(key,raw);return true}catch{return writeFailed()}}
  if(testing())return false;
  if(starting){queuedRaw=raw;return true}
  let signature;
  if(booted)try{signature=fingerprint(raw)}catch{return writeFailed()}
  try{
   const old=localStorage.getItem(KEY);
   if(savedRaw!==undefined&&old!==savedRaw){
    dialog('다른 탭에서 저장 기록이 변경되었습니다.','',[['다시 확인',()=>location.reload()]]);return false;
   }
   if(old!==null&&old!==brokenRaw&&Date.now()-previousAt>=60000){decode(old);localStorage.setItem(previous,old);previousAt=Date.now()}
  }catch{if(booted)queueRaw(raw,signature);return writeFailed()}
  const ok=cacheRaw(raw);if(booted)queueRaw(raw,signature);return ok;
 }
 async function seed(raw){
  try{return await request('POST',{baseRevision:0,data:raw})}
  catch(error){
   if(error.status===409&&error.record?.revision>0)return serverRecord(error.record);
   if(error.status===428&&error.code==='nickname_required'){waitingName=true;return null}
   throw error;
  }
 }
 async function restoreFrom(kind,fileRaw){
  if(testing()||restoring)return false;
  if(isBusy()){feedback(transactionMessage());return false}
  restoring=true;stopTimer();const owner=player(),epoch=generation;
  const current=()=>!testing()&&owner===player()&&epoch===generation;
  try{
   if(inFlight)await inFlight;
   if(!current())return false;
   let record=await request();
   if(!current())return false;
   let source='서버 저장',raw;
   let restoringServer=!!record;
   if(record)raw=record.data;
   else if(kind==='backup'){
    const copy=findBackup();if(!copy){feedback('복구할 기기 백업이 없습니다.');return false}
    raw=copy.data;source=copy.date+' 백업';
   }else raw=kind==='new'?JSON.stringify(starter()):fileRaw;
   validateImport(decode(raw));
   if(!stopped&&kind==='backup'&&!confirm(source+'으로 현재 진행을 복구할까요?'))return false;
   if(!record){
    if(savedRaw!==undefined&&localStorage.getItem(KEY)!==savedRaw){feedback('다른 탭에서 기록이 변경되었습니다. 다시 불러와 주세요.');return false}
    record=await seed(raw);
    if(!current())return false;
    if(record){if(record.data!==raw){source='서버 저장';restoringServer=true}raw=record.data}
   }
   if(!cacheRaw(raw)&&!record)return false;
   generation++;stopped=true;pending=null;pendingKey='';stopTimer();
   if(kind!=='new'||restoringServer)alert(source+'을 복구했습니다.');
   location.reload();return true;
  }catch(error){feedback(error?.status===413?'서버 저장 한도 512KB를 초과했습니다.':'서버에 연결하지 못했습니다. 다시 시도해 주세요.');return false}
  finally{restoring=false;if(!stopped)schedule(10000)}
 }
 function restoreBackup(){return restoreFrom('backup')}
 function importLocal(raw){return restoreFrom('file',raw)}
 async function boot(start){
  if(starting||booted)return false;
  const epoch=++generation;stopTimer();queuedRaw=undefined;waitingName=false;brokenRaw=undefined;
  let raw=null,invalid=false;
  try{raw=localStorage.getItem(KEY);savedRaw=raw;if(raw!==null)validateImport(decode(raw))}
  catch{invalid=true;brokenRaw=raw;if(raw!==null)try{rememberBroken(raw)}catch{writeFailed()}}
  let record;
  try{
   record=await request();if(epoch!==generation)return false;
   record=await resumeLargeCommands(record);if(epoch!==generation)return false;
   if(!record){
    if(invalid){corruptDialog(raw);return false}
    if(raw!==null)record=await seed(raw);else waitingName=true;
   }
  }catch(error){connectionDialog(start,error);return false}
  if(epoch!==generation)return false;
  if(record){acknowledge(record);raw=record.data;cacheRaw(raw)}
  else{revision=0;confirmed='';healthy();if(waitingName&&raw!==null)failed()}
  bootRaw=raw;clearDialog();
  try{
   starting=true;start();starting=false;booted=true;
   if(queuedRaw!==undefined)write(KEY,queuedRaw);
   else if(!record&&raw!==null)queueRaw(raw);
   window.nebulaBootReady?.();if(resumeNotice){feedback(resumeNotice);resumeNotice=''}return true;
  }catch(error){
   starting=false;if(!stopped)dialog('게임을 시작하지 못했습니다.','',[['다시 시도',()=>location.reload()]]);
   return false;
  }
 }
 window.addEventListener?.('pagehide',()=>{if(!testing())void sync(true)});
 document.addEventListener?.('visibilitychange',()=>{if(document.hidden&&!testing())void sync(true)});
 window.addEventListener?.('online',()=>{if(!testing()&&pending)void sync(true)});
 return {readLocal,write,boot,sync,usesServer,command,isBusy,canTransact,transactionMessage,accountReady,restoreBackup,importLocal,
  accountKey:()=>accountTag,locked:()=>stopped,
  status:()=>waitingName?'기기 저장 · 닉네임 등록 대기':failureSince!==null?'기기 저장 · 서버 연결 재시도 중':'기기 저장 · 서버 연결됨'};
})();
