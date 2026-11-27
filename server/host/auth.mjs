// Who is asking. The game server module trusts one request header for the player's identity; this file is
// the only place that fills it. Two ways: Firebase sign-in (production) or a signed guest cookie (testing).
import {createHmac,createVerify,randomUUID,timingSafeEqual,X509Certificate} from 'node:crypto';

export const OWNER_HEADER='oai-authenticated-user-id';
// Google publishes the keys that sign Firebase ID tokens here. (The address can be replaced only for tests.)
const CERTS_URL=process.env.FIREBASE_CERTS_URL||'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com';
let certs={keys:new Map(),until:0,loading:null};

async function googleKeys(){
 if(Date.now()<certs.until)return certs.keys;
 certs.loading=certs.loading||(async()=>{
  try{
   const response=await fetch(CERTS_URL,{signal:AbortSignal.timeout(8000)});
   if(!response.ok)throw Error('certificate fetch '+response.status);
   const age=Number(/max-age=(\d+)/.exec(response.headers.get('cache-control')||'')?.[1]||3600);
   const keys=new Map(Object.entries(await response.json()).map(([kid,pem])=>[kid,new X509Certificate(pem).publicKey]));
   certs={keys,until:Date.now()+Math.min(age,21600)*1000,loading:null};
  }catch(error){
   certs.loading=null;
   if(!certs.keys.size)throw error;            // nothing to fall back on
   certs.until=Date.now()+60000;               // keep the old keys a little longer and try again
  }
  return certs.keys;
 })();
 return certs.loading;
}
const decode=part=>JSON.parse(Buffer.from(part,'base64url').toString('utf8'));
// Returns the Firebase user id of a valid ID token, or null. Checks follow Firebase's own list:
// algorithm, key id, signature, audience, issuer, subject, expiry and issue time.
export async function firebaseUser(token,project,now=Date.now()){
 const parts=String(token||'').split('.');
 if(parts.length!==3)return null;
 let header,claims;
 try{header=decode(parts[0]);claims=decode(parts[1])}catch{return null}
 if(header.alg!=='RS256'||typeof header.kid!=='string')return null;
 const key=(await googleKeys()).get(header.kid);
 if(!key)return null;
 if(!createVerify('RSA-SHA256').update(parts[0]+'.'+parts[1]).verify(key,parts[2],'base64url'))return null;
 const seconds=now/1000;
 if(claims.aud!==project||claims.iss!=='https://securetoken.google.com/'+project)return null;
 if(typeof claims.sub!=='string'||!claims.sub||claims.sub.length>128)return null;
 if(!(claims.exp>seconds)||!(claims.iat<=seconds+300)||!(claims.auth_time<=seconds+300))return null;
 return claims.sub;
}
// Guest cookie: a random id and its signature, so nobody can type in somebody else's id.
const sign=(id,secret)=>createHmac('sha256',secret).update(id).digest('base64url');
export function guestFromCookie(cookie,secret){
 const match=/(?:^|;\s*)nebula_guest=([a-f0-9-]{36})\.([A-Za-z0-9_-]{43})(?:;|$)/.exec(cookie||'');
 if(!match)return null;
 const expected=Buffer.from(sign(match[1],secret)),given=Buffer.from(match[2]);
 return expected.length===given.length&&timingSafeEqual(expected,given)?match[1]:null;
}
export function newGuestCookie(secret,secure){
 const id=randomUUID();
 return {id,cookie:`nebula_guest=${id}.${sign(id,secret)}; Path=/; Max-Age=31536000; HttpOnly; SameSite=Lax${secure?'; Secure':''}`};
}
