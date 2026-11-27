'use strict';

const gameChatTabs={world:'전체',guild:'길드',whisper:'귓속말',news:'소식',events:'이벤트'};
const chatDrafts=new Map();
let chatTab='world',chatEpoch=0,chatCursor=0,chatTimer=0,chatPosting=false,chatGuildBusy=false;
let chatRestoreTask=null,chatRefreshId=0,chatRoom=null;

async function chatRequest(path,payload){
 const options={cache:'no-store',credentials:'same-origin',signal:AbortSignal.timeout(10000)};
 if(payload)Object.assign(options,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
 let res,data;
 try{res=await fetch('/api/chat'+path,options);data=await res.json()}
 catch{throw Error('채팅 서버에 연결할 수 없습니다.')}
 if(!res.ok){const error=Error(data.error||'채팅을 불러오지 못했습니다.');error.status=res.status;throw error}
 return data;
}
function applyChatGuild(guild){
 const o=onlineState(),name=guild?.name||'';
 if(o.guild!==name)communityRecords.invalidate('roster');
 if(o.guild===name&&(!name||guildProfile(o).role===guild.role))return;
 if(o.guild!==name){o.guild=name;o.guildProfile=name?newGuildProfile(name,guild.role):null;guildSection='overview'}
 else guildProfile(o).role=guild.role;
 save();if(view==='online')render();
}
function restoreChatGuild(){
 if(!s?.classId||testSession||!accountName)return Promise.resolve();
 if(chatRestoreTask)return chatRestoreTask;
 const player=s;
 chatRestoreTask=chatRequest('/guild',{action:'resume',name:onlineState().guild||''}).then(data=>{
  if(s===player&&!testSession)applyChatGuild(data.guild);
 }).finally(()=>{chatRestoreTask=null});
 return chatRestoreTask;
}
async function changeChatGuild(action,name){
 if(!guardFeature('guild'))return false;
 if(dungeonRun||forgeBusy||chatGuildBusy)return false;
 if(testSession||typeof fetch!=='function'){
  if(action==='leave')return leaveCurrentGuild();
  return onlineAct('join',{name:name==='별빛 기사단'?'starlight':name});
 }
 chatGuildBusy=true;
 const player=s;
 try{
  await chatRestoreTask;
  const data=await chatRequest('/guild',{action,name});
  if(s!==player||testSession)return false;
  const previous=onlineState().guild;
  applyChatGuild(data.guild);
  if(data.guild.name&&previous!==data.guild.name){guildLog(onlineState(),action==='create'?'길드를 창설했습니다':'길드에 가입했습니다');save()}
  if(action==='leave'&&view==='guildLeave')closeMenu();
  paint();notice(data.guild.name?data.guild.name+' 가입 완료':'길드에서 나왔습니다');return true;
 }catch(error){notice(error.message);return false}
 finally{chatGuildBusy=false}
}
function chatSheetGeometry(){
 const game=$('game').getBoundingClientRect(),nav=$('bottomNav').getBoundingClientRect();
 const viewport=window.visualViewport,visible=viewport?viewport.height:window.innerHeight;
 const lower=viewport?viewport.height+viewport.offsetTop:window.innerHeight;
 const keyboard=window.innerHeight-lower>90;
 // Dungeons, the tower and the mine hide the bottom menu; the sheet then rests on the screen's bottom edge.
 const bottom=keyboard||nav.height<=0?lower:Math.min(lower,nav.top);
 const height=Math.max(120,Math.min(keyboard?visible-8:game.height*.62,bottom-(viewport?.offsetTop||0)-4));
 const el=$('chatSheet');
 el.style.setProperty('--chat-left',game.left+'px');el.style.setProperty('--chat-width',game.width+'px');
 el.style.setProperty('--chat-bottom',Math.max(0,window.innerHeight-bottom)+'px');el.style.setProperty('--chat-height',height+'px');
}
function setChatStatus(message){const el=$('chatStatus');el.textContent=message;el.hidden=!message}
function chatWritable(){return ['world','guild','whisper'].includes(chatTab)}
function keepChatDraft(){
 if(!chatWritable())return;
 const prev=chatDrafts.get(chatTab)||{};
 chatDrafts.set(chatTab,{...prev,text:$('chatText').value,to:$('chatTo').value});
}
function selectChatTab(key,recipient=''){
 if(!Object.hasOwn(gameChatTabs,key)||key==='guild'&&!guardFeature('guild'))return false;
 if($('chatSheet').dataset.initialized)keepChatDraft();
 $('chatSheet').dataset.initialized='1';chatTab=key;chatRoom=null;chatEpoch++;chatCursor=0;chatRefreshId++;
 for(const btn of $('chatChannels').querySelectorAll('button'))btn.setAttribute('aria-pressed',String(btn.dataset.channel===key));
 const log=$('chatLog'),draft=chatDrafts.get(key)||{};
 log.replaceChildren();setChatStatus('');
 $('chatTo').hidden=key!=='whisper';$('chatForm').hidden=!chatWritable();
 $('chatText').value=draft.text||'';$('chatTo').value=recipient||draft.to||'';
 if(!chatWritable()){
  if(key==='news')log.innerHTML=GAME_NOTICES.map(n=>`<details class="chat-news"><summary>${safeText(n.title)}</summary><time>${safeText(n.date)}</time><p>${safeText(n.body)}</p></details>`).join('');
  else{
   const name=activeOutfitEventId()===SEASON_TWO_ID?SEASON_TWO_THEME:ROYAL_THEME;
   log.innerHTML=`<section class="chat-news"><strong>${safeText(name)} 한정 룰렛</strong><small>${safeText(royalCountdown())}</small>${royalEventActive()?'<button class="muted-button" data-wheel>룰렛 보기</button>':''}</section>`;paintFeatureLocks(log);
  }
 }else{
  log.innerHTML='<p class="chat-empty">메시지를 불러오는 중…</p>';
 }
 scheduleChat(0);
}
function openGameChat(){
 const sheet=$('chatSheet');
 if(sheet.open||!s?.classId||testSession)return;
 sheet.showModal();chatSheetGeometry();selectChatTab('world');
}
function chatRows(messages){
 return messages.map(m=>{
  const peer=m.mine?m.recipient:m.sender;
  const label=chatTab==='whisper'&&m.mine?'나 → '+m.recipient:m.sender;
  const time=new Date(m.at).toLocaleTimeString('ko-KR',{hour:'2-digit',minute:'2-digit',hour12:false});
  const by=`${safeText(label)}<time>${safeText(time)}</time>`;
  const byline=peer?`<button type="button" class="chat-by" data-whisper="${safeText(peer)}" aria-label="${safeText(peer)}에게 귓속말">${by}</button>`:`<span class="chat-by">${by}</span>`;
  const actions=m.mine?'':`<details class="chat-actions"><summary aria-label="메시지 관리"><ui-mark data-shape=more aria-hidden=true></ui-mark></summary><div><button type="button" data-ignore="${m.id}">차단</button><label>신고 사유 <select>${['욕설·괴롭힘','광고·도배','개인정보 노출','기타'].map(t=>'<option>'+t+'</option>').join('')}</select></label><button type="button" data-report="${m.id}">신고</button></div></details>`;
  return `<article class="chat-row${m.mine?' mine':''}"><img src="${faceURL(faceIndex(m.portrait)<0?0:m.portrait)}" alt=""><div>${byline}<p>${safeText(m.body)}</p></div>${actions}</article>`;
 }).join('');
}
function updateChatTeaser(message){
 $('chatTeaser').textContent=message.sender+': '+message.body;
}
function chatEmpty(message){$('chatLog').innerHTML='<p class="chat-empty">'+safeText(message)+'</p>'}
function scheduleChat(ms){clearTimeout(chatTimer);if(!document.hidden)chatTimer=setTimeout(refreshChat,ms)}
async function refreshChat(){
 const cycle=++chatRefreshId,stamp=chatEpoch,sheet=$('chatSheet'),open=sheet.open;
 const valid=()=>cycle===chatRefreshId&&stamp===chatEpoch&&open===sheet.open&&!document.hidden;
 if(open&&!chatWritable())return;
 let delay=open?4000:25000;
 try{
  if(!s?.classId||testSession||(!open&&view))return;
  if(!open){
   const data=await chatRequest('?channel=world&preview=1');
   if(valid()){if(data.messages.length)updateChatTeaser(data.messages[0]);else $('chatTeaser').textContent='채팅 열기'}
   return;
  }
  if(chatTab==='guild'&&!chatRoom)await restoreChatGuild();
  if(!valid())return;
  const data=await chatRequest('?channel='+chatTab+'&after='+chatCursor);
  if(!valid())return;
  if(chatTab==='guild'){
   if(chatRoom&&chatRoom!==data.room){chatCursor=0;chatRoom=null;chatEmpty('길드 대화를 불러오는 중…');delay=0;return}
   chatRoom=data.room;
  }
  $('chatForm').hidden=false;
  if($('chatStatus').dataset.network){setChatStatus('');delete $('chatStatus').dataset.network}
  const log=$('chatLog'),first=!chatCursor;
  if(data.messages.length){
   const pinned=first||log.scrollHeight-log.scrollTop-log.clientHeight<48;
   if(first)log.replaceChildren();
   log.insertAdjacentHTML('beforeend',chatRows(data.messages));chatCursor=data.messages.at(-1).id;
   while(log.children.length>150)log.firstElementChild.remove();
   if(pinned)log.scrollTop=log.scrollHeight;
   if(!first&&data.messages.length===50)delay=0;
   if(chatTab==='world')updateChatTeaser(data.messages.at(-1));
  }else if(first)chatEmpty(({world:'아직 전체 채팅이 없습니다.',guild:'아직 길드 채팅이 없습니다.',whisper:'주고받은 귓속말이 없습니다.'})[chatTab]);
 }catch(error){
  if(open&&valid()){
   if(error.status===401||error.status===403){chatCursor=0;chatRoom=null;chatEmpty(error.message);$('chatForm').hidden=true}
   else if(!chatCursor)chatEmpty('메시지를 불러오지 못했습니다.');
   setChatStatus(error.status===401||error.status===403?'':error.message);$('chatStatus').dataset.network='1';
  }
 }finally{if(valid())scheduleChat(delay)}
}
async function submitChat(event){
 event.preventDefault();
 if(chatPosting||!chatWritable()||testSession||$('chatForm').hidden)return;
 const channel=chatTab,text=$('chatText').value.trim(),to=channel==='whisper'?$('chatTo').value.trim():'';
 if(!text){$('chatText').focus();return}
 if(channel==='whisper'&&!to){setChatStatus('받는 기사 닉네임을 입력해 주세요.');$('chatTo').focus();return}
 keepChatDraft();const draft=chatDrafts.get(channel),signature=JSON.stringify([text,to]);
 if(draft.signature!==signature){draft.nonce=crypto.randomUUID();draft.signature=signature}
 chatPosting=true;$('chatSend').disabled=true;setChatStatus('');
 try{
  await chatRequest('',{channel,text,to,room:channel==='guild'?chatRoom:undefined,nonce:draft.nonce,portrait:displayFaceIndex(s.profileFace,s.classId)});
  const saved=chatDrafts.get(channel);
  if(saved?.text.trim()===text&&(channel!=='whisper'||saved.to.trim()===to))chatDrafts.set(channel,{text:'',to});
  if($('chatSheet').open&&channel===chatTab){
   if($('chatText').value.trim()===text)$('chatText').value='';
   setChatStatus('');scheduleChat(0);
  }
 }catch(error){if($('chatSheet').open&&channel===chatTab)setChatStatus(error.message)}
 finally{chatPosting=false;$('chatSend').disabled=false}
}
async function moderateChat(action,id,reason){
 try{
  await chatRequest('/moderation',{action,id,reason});
  if(action==='block'){selectChatTab(chatTab);$('chatTeaser').textContent='채팅 열기';}
  setChatStatus(action==='report'?'메시지를 신고했습니다.':'이 기사의 메시지를 차단했습니다.');
 }catch(e){setChatStatus(e.message)}
}
async function showChatBlocks(){
 const epoch=++chatEpoch;chatRefreshId++;clearTimeout(chatTimer);
 chatTab='blocked';chatRoom=null;$('chatForm').hidden=true;$('chatTo').hidden=true;setChatStatus('');
 for(const btn of $('chatChannels').querySelectorAll('button'))btn.setAttribute('aria-pressed',String(btn.dataset.channel==='blocked'));
 chatEmpty('차단 목록을 불러오는 중…');
 try{
  const data=await chatRequest('/moderation');
  if(epoch!==chatEpoch||!$('chatSheet').open)return;
  if(!data.names.length){chatEmpty('차단한 기사가 없습니다.');return}
  $('chatLog').innerHTML=data.names.map(name=>`<p class="chat-block-entry"><span>${safeText(name)}</span><button type="button" data-unblock="${safeText(name)}">차단 해제</button></p>`).join('');
 }catch(e){if(epoch===chatEpoch)chatEmpty(e.message)}
}
function initGameChat(){
 const sheet=$('chatSheet');
 $('chatChannels').innerHTML=Object.entries(gameChatTabs).map(([id,label])=>`<button type="button" data-channel="${id}">${label}</button>`).join('')+'<button type="button" data-channel="blocked">차단 관리</button>';
 paintFeatureLocks($('chatChannels'));
 $('chatChannels').addEventListener('click',e=>{const key=e.target.closest('[data-channel]')?.dataset.channel;if(key==='blocked'){keepChatDraft();void showChatBlocks()}else if(key)selectChatTab(key)});
 $('chatLog').addEventListener('click',e=>{
  const block=e.target.closest('[data-ignore]'),report=e.target.closest('[data-report]'),unblock=e.target.closest('[data-unblock]');
  if(block||report){const b=block||report;b.disabled=true;void moderateChat(block?'block':'report',Number(block?b.dataset.ignore:b.dataset.report),report?.closest('details')?.querySelector('select')?.value).finally(()=>{b.disabled=false});return}
  if(unblock){unblock.disabled=true;void chatRequest('/moderation',{action:'unblock',name:unblock.dataset.unblock}).then(()=>{if(chatTab==='blocked')showChatBlocks()}).catch(e=>setChatStatus(e.message)).finally(()=>{unblock.disabled=false});return}
  const who=e.target.closest('[data-whisper]')?.dataset.whisper;
  if(who){selectChatTab('whisper',who);$('chatText').focus()}
  if(e.target.closest('[data-wheel]')&&guardFeature('roulette')){sheet.close();openMenu('royalEvent')}
 });
 $('chatForm').addEventListener('submit',submitChat);
 $('chatText').addEventListener('keydown',e=>{if(e.key==='Enter'&&(e.isComposing||e.keyCode===229))e.preventDefault()});
 $('chatClose').addEventListener('click',()=>sheet.close());
 sheet.addEventListener('click',e=>{if(e.target===sheet){const r=sheet.getBoundingClientRect();if(e.clientY<r.top||e.clientY>r.bottom||e.clientX<r.left||e.clientX>r.right)sheet.close()}});
 sheet.addEventListener('close',()=>{
  if(sheet.open)return;
  keepChatDraft();delete sheet.dataset.initialized;
  chatTab='world';chatEpoch++;scheduleChat(0);
  $('chatStrip').focus({preventScroll:true});
 });
 const resize=()=>{if(sheet.open)chatSheetGeometry()};
 window.addEventListener('resize',resize);window.visualViewport?.addEventListener('resize',resize);window.visualViewport?.addEventListener('scroll',resize);
 document.addEventListener('visibilitychange',()=>{chatRefreshId++;scheduleChat(0)});
 scheduleChat(1200);
}
