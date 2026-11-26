/* Sign-in for the game when it runs on its own server with Firebase.
   The host adds this script to the page; the game's own files do not know about it.
   Every request to /api waits until the player is signed in, then carries the player's ID token. */
(()=>{
 'use strict';
 const SDK='https://www.gstatic.com/firebasejs/10.14.1/';
 const realFetch=window.fetch.bind(window);
 let auth=null,settled,waited=false;
 const ready=new Promise(resolve=>{settled=resolve});
 const isApi=input=>{
  try{const url=new URL(typeof input==='string'?input:input.url,location.href);return url.origin===location.origin&&url.pathname.startsWith('/api/')&&url.pathname!=='/api/host'}
  catch{return false}
 };
 window.fetch=async(input,init={})=>{
  if(!isApi(input))return realFetch(input,init);
  await ready;
  const send=async force=>{
   const token=await auth.currentUser.getIdToken(force);
   const headers=new Headers(init.headers||(typeof input!=='string'&&input.headers)||{});
   headers.set('Authorization','Bearer '+token);
   // The game gives each request a short time limit that may have run out while the sign-in window was open.
   const {signal,...rest}=init;
   return realFetch(input,{...rest,headers,signal:signal&&!signal.aborted?signal:undefined});
  };
  let response=await send(false);
  if(response.status===401)response=await send(true);   // a token that just expired is renewed once
  return response;
 };
 const script=src=>new Promise((resolve,reject)=>{const el=document.createElement('script');el.src=src;el.onload=resolve;el.onerror=()=>reject(Error('load '+src));document.head.appendChild(el)});
 function panel(message){
  let box=document.getElementById('hostSignIn');
  if(!box){
   box=document.createElement('div');box.id='hostSignIn';box.setAttribute('role','dialog');box.setAttribute('aria-modal','true');box.setAttribute('aria-label','로그인');
   box.style.cssText='position:fixed;inset:0;z-index:2147483000;display:grid;place-items:center;padding:24px;background:#0c0a18f2;color:#f8eddb;font:16px/1.5 system-ui,sans-serif';
   box.innerHTML='<div style="width:min(100%,360px);display:grid;gap:14px;text-align:center">'+
    '<h1 style="margin:0;font-size:24px;color:#ffe9bd">성운의 모루</h1>'+
    '<p id="hostSignInText" style="margin:0;min-height:48px;color:#cdbfe0"></p>'+
    '<button id="hostGoogle" style="min-height:52px;border:0;border-radius:12px;background:#f1c986;color:#2a1c00;font-size:17px;font-weight:700">Google 계정으로 시작</button>'+
    '<button id="hostGuest" style="min-height:48px;border:1px solid #6d5a86;border-radius:12px;background:#231b3a;color:#f8eddb;font-size:15px">로그인 없이 시작</button>'+
    '<small style="color:#9a8fb0">로그인 없이 시작하면 이 기기의 이 브라우저에만 저장됩니다.</small></div>';
   (document.body||document.documentElement).appendChild(box);
   const busy=on=>{for(const id of ['hostGoogle','hostGuest'])document.getElementById(id).disabled=on};
   const attempt=work=>async()=>{
    busy(true);panel('연결하는 중입니다…');
    try{await work()}catch(error){busy(false);panel(error&&error.code==='auth/popup-closed-by-user'?'로그인 창이 닫혔습니다. 다시 시도해 주세요.':'로그인하지 못했습니다. 잠시 후 다시 시도해 주세요.')}
   };
   document.getElementById('hostGoogle').onclick=attempt(async()=>{
    const provider=new firebase.auth.GoogleAuthProvider();
    try{await auth.signInWithPopup(provider)}
    catch(error){if(error.code==='auth/popup-blocked'||error.code==='auth/operation-not-supported-in-this-environment')await auth.signInWithRedirect(provider);else throw error}
   });
   document.getElementById('hostGuest').onclick=attempt(()=>auth.signInAnonymously());
  }
  document.getElementById('hostSignInText').textContent=message;
  return box;
 }
 // Offered to the game's settings screen: connect a guest to a Google account, or sign out.
 window.hostAccount={
  state:()=>auth&&auth.currentUser?{guest:auth.currentUser.isAnonymous,email:auth.currentUser.email||''}:null,
  linkGoogle:()=>auth.currentUser.linkWithPopup(new firebase.auth.GoogleAuthProvider()),
  signOut:async()=>{await auth.signOut();location.reload()}
 };
 (async()=>{
  try{
   const info=await (await realFetch('/api/host',{cache:'no-store'})).json();
   if(info.auth!=='firebase'){settled();return}
   await script(SDK+'firebase-app-compat.js');await script(SDK+'firebase-auth-compat.js');
   firebase.initializeApp(info.firebase);auth=firebase.auth();
   await auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);
   try{await auth.getRedirectResult()}catch{}
   auth.onAuthStateChanged(user=>{
    if(user){
     const box=document.getElementById('hostSignIn');
     // The game started while the sign-in window was open and may have given up on its first requests;
     // starting the page again is the cleanest way to continue.
     if(box&&waited){location.reload();return}
     if(box)box.remove();
     settled();
    }else{waited=true;panel('계정을 선택해 주세요.')}
   });
  }catch(error){
   waited=true;panel('로그인 서버에 연결하지 못했습니다. 인터넷 연결을 확인하고 새로고침해 주세요.');
   for(const id of ['hostGoogle','hostGuest'])document.getElementById(id).disabled=true;
  }
 })();
})();
