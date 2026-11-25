import {rankedAction} from './rank-simulation.js';
import {limitUpload} from './progress-limits.js';

const jobs=['warrior','shadow','paladin','mage','archer'];
const protectedWeapon=['plus','peakPlus','inheritedPlus','grade','legacyAttack'];
const object=value=>value&&typeof value==='object'?value:{};
const sorted=value=>Array.isArray(value)?value.map(sorted):value&&typeof value==='object'?
 Object.fromEntries(Object.keys(value).sort().map(key=>[key,sorted(value[key])])):value;
const equal=(a,b)=>JSON.stringify(sorted(a))===JSON.stringify(sorted(b));
const inventoryIds=values=>Object.keys(object(values)).filter(key=>values[key]>0).sort();
function protectedState(game){
 const events={};
 for(const [id,event] of Object.entries(object(game.costumeEvents))){
  const classes={};
  for(const job of jobs){
   const row=event?.classes?.[job];
   if(row?.owned||row?.pity||row?.rolls)classes[job]=[row.owned??false,row.pity??0,row.rolls??0];
  }
  if(event?.rolls||event?.missions?.spent||Object.keys(classes).length)
   events[id]={rolls:event.rolls??0,spent:event.missions?.spent??0,classes};
 }
 return {gems:game.gems??0,guards:game.forgeGuards??0,tries:game.forgeManualTries??0,
  rolls:game.rolls??0,normal:game.normalCostumeRolls??0,royal:game.royalTitlePity??0,
  free:game.lastFreeSkillDay??null,royalTitle:game.titlesOwned?.['roulette-fate']??false,trialTitle:game.titlesOwned?.['trial-conqueror']??false,
  classId:game.classId??null,legacyCostume:game.costumeLegacyFloor??0,newbieGift:game.eventClaims?.newbieGift6??null,
  events,skills:inventoryIds(game.skills),pets:inventoryIds(game.pets),
  costumes:Array.isArray(game.costumes)?[...game.costumes].sort((a,b)=>a-b):[],
  weapons:jobs.map(job=>{
   const w=game.weapons?.[job]||{};
   return [...protectedWeapon.map(key=>w[key]??0),w.basic??false,w.master??false];
  })
 };
}
// Daily admission stock belongs to the UTC day used by onlineState. Permit the
// browser's real rollover while preventing a fabricated date from restoring stock.
function dayCounterValid(oldDay,day,oldCounts,counts,today){
 const active=map=>Object.fromEntries(Object.entries(object(map)).filter(([,v])=>v!==0));
 const old=active(oldCounts),next=active(counts);
 if(day===oldDay)return equal(old,next);
 if(oldDay===today&&Object.keys(old).length)return false;
 return Object.keys(next).length===0;
}
function sameEconomy(before,after,now){
 const expected=protectedState(before),actual=protectedState(after);
 if(expected.classId===null&&jobs.includes(actual.classId)){
  const i=jobs.indexOf(actual.classId);
  expected.classId=actual.classId;
  expected.skills=[...new Set([...expected.skills,String(i*4)])].sort();
  expected.costumes=[...new Set([...expected.costumes,i*6])].sort((a,b)=>a-b);
 }
 if(!equal(expected,actual))return false;
 for(const [list,max] of [['skills',100],['pets',50]]){
  if(!equal(before[list],after[list])&&Object.values(object(after[list])).some(level=>level!=null&&
   (!Number.isInteger(level)||level<0||level>max)))return false;
 }
 if(!equal(before.skinUpgrades,after.skinUpgrades)||!equal(before.skinCopies,after.skinCopies)){
  const quantity=state=>rankedAction({state},{action:'economySkinInventory'},now);
  const newCopies=quantity(after);
  if(!newCopies||!equal(quantity(before),newCopies))return false;
 }
 if(before.weaponVersion===1&&after.weaponVersion!==1||before.rouletteVersion>=4&&after.rouletteVersion!==before.rouletteVersion)return false;
 const day=new Date(now).toISOString().slice(0,10),gameDay=new Date(now+9*3600000).toISOString().slice(0,10);
 const oldShop=before.onlineTest,newShop=after.onlineTest;
 return dayCounterValid(oldShop?.day,newShop?.day,oldShop?.daily?.diamondPassPurchases,newShop?.daily?.diamondPassPurchases,day)&&
  dayCounterValid(before.day,after.day,{fast:before.daily?.fastBattle??0},{fast:after.daily?.fastBattle??0},gameDay);
}
// Settings a replaced first upload may keep. Everything else restarts from the server's new game.
const profileKeys={nickname:value=>typeof value==='string'&&value.length<=24,
 sound:value=>typeof value==='boolean',music:value=>typeof value==='boolean',effects:value=>typeof value==='boolean',
 haptics:value=>typeof value==='boolean',powerSaving:value=>typeof value==='boolean',
 soundVolume:value=>Number.isInteger(value)&&value>=0&&value<=100,musicVolume:value=>Number.isInteger(value)&&value>=0&&value<=100};
function firstUpload(proposed,data,now){
 // An account's first record is compared with the server's own new game. A device
 // file with purchased or drawn goods the server never issued starts again instead.
 const fresh=rankedAction(null,{action:'economyStarter'},now);
 const carriedLedger=Object.hasOwn(proposed,'economyClaims');
 delete proposed.economyClaims;
 if(sameEconomy(fresh,proposed,now))return {data:carriedLedger?JSON.stringify(proposed):data,before:fresh,proposed};
 const profile={};
 for(const [key,valid] of Object.entries(profileKeys))if(valid(proposed[key]))profile[key]=proposed[key];
 const restart=rankedAction(null,{action:'economyStarter',job:jobs.includes(proposed.classId)?proposed.classId:null,profile},now);
 return {data:JSON.stringify(restart),before:restart,proposed:restart};
}
function inspectUpload(existing,data,now){
 const proposed=JSON.parse(data);
 if(!existing)return firstUpload(proposed,data,now);
 let before=JSON.parse(existing.data);
 // Compare a legitimately upgraded device with the server's own migration of
 // the previous record. A caller cannot inject equipment into the migration.
 if((before.weaponVersion!==1&&proposed.weaponVersion===1)||(before.rouletteVersion!==4&&proposed.rouletteVersion===4))
  before=rankedAction({state:before},{action:'economyMigrate'},now);
 if(before.eventClaims?.newbieGift6===true&&proposed.eventClaims?.newbieGift6!==true)
  before=rankedAction({state:before},{action:'economyLegacyGift'},now);
 if((proposed.titleId==='trial-conqueror'||proposed.title==='탑의 정복자')&&!before.titlesOwned?.['trial-conqueror'])return null;
 if(!sameEconomy(before,proposed,now))return null;
 if(Object.hasOwn(proposed,'economyClaims')&&!equal(before.economyClaims,proposed.economyClaims))return null;
 if(before.economyClaims){
  if(Object.hasOwn(proposed,'economyClaims'))return {data,before,proposed};
  proposed.economyClaims=before.economyClaims;
 }else{
  // Keep legacy wire snapshots byte-exact until an economic progress boundary
  // moves. In particular, snapshot the old level before the client advances it.
  const flags=['level','quest','towerFloor','attendance','lastAttendance','mailClaimed','redeemedRewardCodes',
   'discoveryClaimed','achievements','eventClaims','passClaimed','monthlyAttendance','onlineTest','weekly','guidance','mailbox','adventureOrders','season','nightmareTour','daily','day'];
  if(flags.every(key=>equal(before[key],proposed[key])))return {data,before,proposed};
  proposed.economyClaims=rankedAction({state:before},{action:'economyBaseline'},now);
 }
 return {data:JSON.stringify(proposed),before,proposed};
}
// Returns the record to store, or null when the upload changes a value only the server issues.
export function protectedUpload(existing,data,now){
 return inspectUpload(existing,data,now)?.data??null;
}
// The same check, followed by the allowances for values ordinary play raises on the device.
export function limitedUpload(existing,data,now,limits){
 const checked=inspectUpload(existing,data,now);
 if(!checked)return null;
 if(!limits?.stored)return {data:checked.data,memory:null};
 const {trimmed,memory}=limitUpload(checked.before,checked.proposed,limits.memory,existing?.updatedAt,now);
 return {data:trimmed.length?JSON.stringify(checked.proposed):checked.data,memory};
}
