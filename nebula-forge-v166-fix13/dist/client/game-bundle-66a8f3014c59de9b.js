"use strict";
/* ./skill-motion.js */
'use strict';
// Hand and body stay registered to an intact drawing. Motion uses the original 512px coordinates.
const skillMotion=(()=>{
 // Drawing, weapon pitch (degrees clockwise), travel, rise/drop, body lean.
 const rest=[0,0,0,0,0];
 const forms={
  cleave:   [[1,-34,-12,0,-6],[2,19,18,1,7],[3,32,13,1,5]],
  breaker:  [[1,-67,-14,-10,-8],[2,35,16,3,10],[3,43,11,2,8]],
  backcut:  [[3,45,-10,2,7],[2,-42,18,-3,-6],[1,-26,8,-2,-4]],
  flurry:   [[1,-34,-7,1,-5],[2,22,15,2,7],[3,-28,9,-2,-3]],
  lunge:    [[3,14,-13,3,-6],[2,-11,26,0,11],[1,-4,13,1,6]],
  counter:  [[3,31,-12,3,-5],[1,-31,-5,2,-3],[2,20,19,0,8]],
  ward:     [[3,16,-4,1,-2],[1,-46,-10,2,-6],[1,-34,-5,1,-4]],
  salute:   [[3,9,-3,1,1],[1,-69,-3,-5,-7],[1,-44,0,-1,-3]],
  throw:    [[1,-61,-10,1,-8],[2,22,18,0,7],[3,36,11,1,6]],
  wheel:    [[3,39,-10,3,6],[2,-39,20,-4,-6],[1,-55,7,0,-8]],
  bind:     [[1,-18,-7,1,-4],[3,-48,5,0,5],[1,-34,2,0,2]],
  cast:     [[1,-46,-8,1,-6],[2,27,16,0,8],[3,16,8,1,5]],
  sky:      [[1,-25,-7,1,-4],[1,-64,-5,-5,-9],[2,-21,8,-2,2]],
  plant:    [[1,-42,-6,-4,-5],[2,49,12,3,9],[3,31,9,2,6]],
  hook:     [[3,34,-9,2,5],[2,-34,17,-1,-5],[3,21,-6,1,-6]],
  vanish:   [[3,31,-6,3,4],[1,-42,-16,-9,-6],[3,12,2,1,3]],
  thrust:   [[1,-38,-8,1,-6],[2,-6,22,-2,9],[3,8,12,0,6]]
 };
 // Entries follow each job's three tiers. The lift, stroke and recovery of the family are
 // shared; the accent, fraction of the beat spent loading, and hold after striking are authored per skill.
 const books={
  warrior:[['cleave',4,.65,50],['flurry',6,.48,26],['breaker',10,.73,80],['wheel',-10,.52,36],['breaker',-8,.80,50],['salute',-6,.45,132],['backcut',9,.61,57],['plant',15,.66,100],['hook',-9,.67,63],['throw',-3,.74,47],['counter',5,.77,48],['breaker',-14,.52,77]],
  shadow: [['lunge',-8,.83,34],['flurry',-8,.54,18],['hook',-13,.62,70],['flurry',14,.42,20],['throw',-11,.62,34],['wheel',8,.47,65],['lunge',12,.88,54],['vanish',10,.52,100],['throw',7,.72,40],['vanish',-16,.78,53],['counter',-9,.82,32],['throw',-17,.54,45]],
  paladin:[['breaker',1,.72,67],['ward',-10,.46,100],['salute',9,.53,121],['sky',-6,.57,118],['plant',-12,.60,109],['cast',-9,.72,82],['ward',13,.66,100],['bind',2,.53,110],['throw',-6,.71,62],['salute',-16,.40,122],['breaker',15,.76,78],['thrust',-11,.66,67]],
  mage:   [['cast',-2,.68,64],['bind',8,.55,93],['sky',-7,.51,71],['salute',-12,.56,130],['plant',11,.64,99],['bind',-12,.68,107],['salute',10,.40,125],['ward',-11,.49,103],['thrust',-12,.73,34],['wheel',-10,.55,105],['sky',12,.74,82],['sky',-18,.48,130]]
 };
 // Unlike a basic loose, an aimed skill keeps the drawing hand at the cheek until
 // release. Each shot registers its own draw and recovery.
 const bows={
  //                          set            loose          recoil           set by       hold
  16:{keys:[[1,-14,-6,0,-4],[1,-19,2,-6,-7],[2,9,-5,-1,-1]],load:.55,hold:43},
  17:{keys:[[1,16,3,2,4],[1,8,7,1,3],[2,-12,-5,0,-4]],load:.44,hold:24},
  18:{keys:[[1,-24,-12,2,-6],[1,-28,-10,2,-7],[2,8,-18,-2,-11]],load:.48,hold:108},
  19:{keys:[[1,-22,-5,2,-7],[1,-49,15,-21,-19],[2,-36,17,-27,-15]],load:.62,hold:74},
  36:{keys:[[1,24,-7,2,5],[1,32,4,2,9],[2,10,-7,0,3]],load:.66,hold:86},
  37:{keys:[[1,-13,3,1,3],[1,-10,9,1,5],[2,-4,7,1,2]],load:.41,hold:77},
  38:{keys:[[1,14,-6,1,4],[1,36,8,3,12],[2,26,8,2,7]],load:.70,hold:74},
  39:{keys:[[1,-6,-14,2,-9],[1,-16,-8,2,-5],[2,-15,-11,0,-6]],load:.40,hold:113},
  56:{keys:[[1,-13,-9,1,-5],[1,-25,11,-12,-10],[2,-7,14,-5,-4]],load:.65,hold:47},
  57:{keys:[[1,-31,0,0,0],[1,-60,0,0,0],[2,-45,0,0,0]],load:.67,hold:96},
  58:{keys:[[1,-9,1,1,-2],[1,26,10,3,9],[2,35,3,2,5]],load:.49,hold:72},
  59:{keys:[[1,-24,-9,2,-6],[1,-42,2,-8,-12],[2,-18,-8,-4,-8]],load:.54,hold:87}
 };
 // World-space aiming directions for the primary focus or thrown blade. A staff and a
 // hammer point in different directions in their source drawings, including between skins.
 // Choose the direction of the business end, independent of that texture orientation.
 const focusAngles={
  10:[-140,-85,-99],11:[-126,-82,-61],24:[-142,2,36],28:[-92,31,10],29:[-118,3,-21],
  31:[-127,-36,-68],44:[-121,-9,24],47:[-137,-18,6],48:[-116,-7,21],49:[-118,-84,-103],51:[-109,-17,-2],
  12:[-121,2,-32],13:[-58,-114,-88],14:[-131,-83,-61],15:[-143,-95,-114],
  32:[-107,35,21],33:[-134,16,-35],34:[-76,-111,-97],35:[-46,-64,-68],
  52:[-103,-14,-37],53:[-23,28,-46],54:[-123,-67,-12],55:[-139,-103,-80]
 };
 const focusKeys={};
 for(const [id,angles] of Object.entries(focusAngles)){
  const job=['warrior','shadow','paladin','mage'][Math.floor((id%20)/4)];
  const [form]=books[job][Math.floor(id/20)*4+id%4];
  focusKeys[id]=forms[form].map((step,i)=>[...step,angles[i]]);
 }
 const heldForms=new Set(['ward','salute','bind','vanish']);
 const alternating=new Set(['flurry','wheel','backcut','counter']);
 const ease=t=>t*t*(3-2*t);
 function blend(a,b,t){
  const u=ease(Math.max(0,Math.min(1,t))),mix=i=>a[i]+(b[i]-a[i])*u;
  const pose={from:a[0],to:b[0],mix:u,pose:u<.5?a[0]:b[0],pitch:mix(1),x:mix(2),y:mix(3),lean:mix(4)};
  if(a.length>5||b.length>5){const from=a[5]??b[5],to=b[5]??a[5];pose.aim=from+(to-from)*u}
  return pose;
 }
 function bowCast(id,t,hits){
  const shot=bows[id];if(!shot)return null;
  const release=archerFlight.spec(id).release,drawn=release*shot.load;
  const salvo=id===19||id===57?1:hits,last=release+70*(salvo-1);
  const [set,loose,kick]=shot.keys;
  // The cheek and extended arm must still be in their release drawing on the spawn frame.
  const endKick=Math.min(555,last+47),settle=Math.min(600,endKick+shot.hold);
  let p,clock,nocked;
  if(t<release){
   p=t<drawn?blend(rest,set,t/drawn):blend(set,loose,(t-drawn)/(release-drawn));
   clock=130*Math.min(1,t/drawn);nocked=t>=Math.min(37,drawn*.5);
  }else if(t<last){
   const unit=(t-release)%70;
   p=unit<28?blend(loose,kick,unit/28):blend(kick,loose,(unit-28)/42);
   p.pose=unit<10||unit>=35?1:2;
   clock=137+(t-release);nocked=unit>=35;
  }else{
   if(t<endKick){p=blend(loose,kick,(t-last)/(endKick-last));p.pose=t-last<14?1:2}
   else if(t<settle)p=blend(kick,kick,1);
   else{
    const recovery=(t-settle)/(650-settle);
    p=blend(kick,rest,recovery);
    const middle=.45;
    p.from=recovery<middle?2:3;p.to=recovery<middle?3:0;
    p.mix=ease(recovery<middle?recovery/middle:(recovery-middle)/(1-middle));
    p.pose=p.mix<.5?p.from:p.to;
   }
   clock=137+(t-release);nocked=false;
  }
  return Object.assign(p,{id,clock,salvo,nocked,held:false,weight:Math.min(1,t/drawn,(650-t)/(650-settle))});
 }
 function sample(job,id,t,hits=1,ranged=false){
  if(t===null||t<=0||t>=650||!Number.isInteger(id)||id<0||id>=60)return null;
  if(job==='archer')return bowCast(id,t,Math.max(1,hits));
  const entry=books[job]?.[Math.floor(id/20)*4+id%4];if(!entry)return null;
  const [form,accent,load,hold]=entry,[set,strike,follow]=focusKeys[id]||forms[form];
  const held=heldForms.has(form),alternate=alternating.has(form);
  const release=ranged?releaseTime(job,id):270;
  const swings=held||form==='sky'||form==='plant'||id===50?1:Math.max(1,hits);
  const last=release+70*(swings-1),wind=release*(ranged&&focusKeys[id]?Math.min(.51,load):load);
  const followAt=Math.min(584,last+Math.min(85,(650-last)*.38));
  const settle=Math.min(610,followAt+hold);
  let p;
  if(t<wind)p=blend(rest,set,t/wind);
  else if(t<release)p=blend(set,strike,(t-wind)/(release-wind));
  else if(t<last){
   const stroke=Math.floor((t-release)/70),unit=(t-release)%70/70;
   if(alternate)p=stroke%2?blend(follow,strike,unit):blend(strike,follow,unit);
   else p=unit<.48?blend(strike,set,unit/.48):blend(set,strike,(unit-.48)/.52);
  }else{
   const end=alternate&&swings%2===0?follow:strike;
   if(t<followAt)p=blend(end,follow,(t-last)/(followAt-last));
   else if(t<settle)p=blend(follow,follow,1);
   else p=blend(follow,rest,(t-settle)/(650-settle));
  }
  const weight=Math.min(1,t/wind,(650-t)/(650-settle));
  p.pitch+=weight*accent;
  return Object.assign(p,{id,form,held,weight,strokes:swings});
 }
 function releaseTime(job,id=-1){return job==='archer'?archerFlight.spec(id).release:job==='mage'?151:145}
 // The release and collision share this clock with the compositor. Preserve the
 // original attack period by borrowing from recovery at very high attack speed.
 function clock(job,id,factor){
  const pivot=id<0&&(job==='archer'||job==='mage')?releaseTime(job,id):270;
  const duration=650*factor,windup=id<0?Math.max(80,pivot*factor):pivot*factor;
  const before=windup/pivot,after=(duration-windup)/(650-pivot);
  return {
   elapsed:t=>t===650?duration:t<=pivot?t*before:windup+(t-pivot)*after,
   pose:t=>t<=windup?t/before:pivot+(t-windup)/after
  };
 }
 return {sample,releaseTime,clock};
})();

;
/* ./secondary-art.js */
// Pose order: rest, wind-up, contact, recovery, and the two walking paintings.
const SECONDARY_ART={
"warrior-1":[[{"rect":[140.0,286.0,76.0,124.0],"pivot":[0.82456,0.0448],"file":"warrior-cloth.webp","src":[798,477,57,93],"kind":"cloth"}],[{"rect":[130.0,232.0,97.0,167.0],"pivot":[0.85911,0.03726],"file":"warrior-cloth.webp","src":[488,337,73,125],"kind":"cloth"}],[{"rect":[46.0,214.0,175.0,189.0],"pivot":[0.91556,0.0341],"file":"warrior-cloth.webp","src":[344,185,131,142],"kind":"cloth"}],[{"rect":[124.0,250.0,101.0,150.0],"pivot":[0.84928,0.04],"file":"warrior-cloth.webp","src":[2,477,76,112],"kind":"cloth"}],[{"rect":[124.0,282.67,93.33,145.33],"pivot":[0.84286,0.0367],"file":"warrior-cloth.webp","src":[179,593,52,82],"kind":"cloth"}],[{"rect":[140.0,282.67,78.67,113.33],"pivot":[0.79661,0.04706],"file":"warrior-cloth.webp","src":[409,593,44,64],"kind":"cloth"}]],
"warrior-2":[[{"rect":[114.0,278.0,132.0,173.0],"pivot":[0.88721,0.03725],"file":"warrior-cloth.webp","src":[295,337,99,130],"kind":"cloth"}],[{"rect":[92.0,243.0,139.0,167.0],"pivot":[0.89848,0.03526],"file":"warrior-cloth.webp","src":[565,337,104,125],"kind":"cloth"}],[{"rect":[129.0,282.0,135.0,125.0],"pivot":[0.86173,0.048],"file":"warrior-cloth.webp","src":[693,477,101,94],"kind":"cloth"}],[{"rect":[87.0,292.0,188.0,135.0],"pivot":[0.89894,0.04938],"file":"warrior-cloth.webp","src":[162,477,141,101],"kind":"cloth"}],[{"rect":[94.67,274.67,149.33,150.67],"pivot":[0.88988,0.0413],"file":"warrior-cloth.webp","src":[2,593,84,85],"kind":"cloth"}],[{"rect":[89.33,270.67,161.33,130.67],"pivot":[0.90083,0.05102],"file":"warrior-cloth.webp","src":[314,593,91,74],"kind":"cloth"}]],
"warrior-3":[[{"rect":[66.0,257.0,127.0,195.0],"pivot":[0.99213,0.03134],"file":"warrior-cloth.webp","src":[166,185,95,146],"kind":"cloth"}],[{"rect":[61.0,236.0,168.0,210.0],"pivot":[0.90675,0.02751],"file":"warrior-cloth.webp","src":[546,2,126,158],"kind":"cloth"}],[{"rect":[114.0,236.0,151.0,204.0],"pivot":[0.8933,0.02832],"file":"warrior-cloth.webp","src":[676,2,113,153],"kind":"cloth"}],[{"rect":[89.0,268.0,195.0,167.0],"pivot":[0.89288,0.0346],"file":"warrior-cloth.webp","src":[673,337,146,125],"kind":"cloth"}],[{"rect":[77.33,253.33,137.33,168.0],"pivot":[0.88673,0.03704],"file":"warrior-cloth.webp","src":[459,477,77,94],"kind":"cloth"}],[{"rect":[80.0,253.33,133.33,133.33],"pivot":[0.89333,0.04667],"file":"warrior-cloth.webp","src":[235,593,75,75],"kind":"cloth"}]],
"warrior-4":[[{"rect":[125.0,271.0,114.0,173.0],"pivot":[0.86842,0.03661],"file":"warrior-cloth.webp","src":[398,337,86,130],"kind":"cloth"}],[{"rect":[94.0,253.0,151.0,179.0],"pivot":[0.88447,0.03662],"file":"warrior-cloth.webp","src":[178,337,113,134],"kind":"cloth"}],[{"rect":[139.0,268.0,141.0,151.0],"pivot":[0.855,0.03826],"file":"warrior-cloth.webp","src":[907,337,106,113],"kind":"cloth"}],[{"rect":[94.0,300.0,199.0,126.0],"pivot":[0.88554,0.04586],"file":"warrior-cloth.webp","src":[540,477,149,94],"kind":"cloth"}],[{"rect":[96.0,268.0,150.67,146.67],"pivot":[0.87316,0.03939],"file":"warrior-cloth.webp","src":[90,593,85,82],"kind":"cloth"}],[{"rect":[105.33,268.0,144.0,102.67],"pivot":[0.84877,0.05628],"file":"warrior-cloth.webp","src":[457,593,81,58],"kind":"cloth"}]],
"warrior-5":[[{"rect":[81.0,236.0,105.0,215.0],"pivot":[0.98942,0.02687],"file":"warrior-cloth.webp","src":[463,2,79,161],"kind":"cloth"}],[{"rect":[72.0,228.0,156.0,219.0],"pivot":[0.90598,0.03044],"file":"warrior-cloth.webp","src":[342,2,117,164],"kind":"cloth"}],[{"rect":[80.0,239.0,176.0,188.0],"pivot":[0.89899,0.03369],"file":"warrior-cloth.webp","src":[479,185,132,141],"kind":"cloth"}],[{"rect":[66.0,250.0,229.0,182.0],"pivot":[0.90733,0.03297],"file":"warrior-cloth.webp","src":[2,337,172,136],"kind":"cloth"}],[{"rect":[70.67,228.0,136.0,198.67],"pivot":[0.89216,0.03356],"file":"warrior-cloth.webp","src":[82,477,76,112],"kind":"cloth"}],[{"rect":[70.67,228.0,137.33,180.0],"pivot":[0.8835,0.03704],"file":"warrior-cloth.webp","src":[307,477,77,101],"kind":"cloth"}]],
"warrior-event":[[{"rect":[112.0,221.0,120.0,239.0],"pivot":[0.87407,0.02743],"file":"warrior-cloth.webp","src":[2,2,90,179],"kind":"cloth"}],[{"rect":[94.0,225.0,168.0,231.0],"pivot":[0.90079,0.02646],"file":"warrior-cloth.webp","src":[212,2,126,173],"kind":"cloth"}],[{"rect":[88.0,211.0,158.0,185.0],"pivot":[0.88326,0.03183],"file":"warrior-cloth.webp","src":[615,185,118,139],"kind":"cloth"}],[{"rect":[94.0,214.0,150.0,239.0],"pivot":[0.89037,0.02696],"file":"warrior-cloth.webp","src":[96,2,112,179],"kind":"cloth"}],[{"rect":[90.67,221.33,142.67,213.33],"pivot":[0.88474,0.02917],"file":"warrior-cloth.webp","src":[823,337,80,120],"kind":"cloth"}],[{"rect":[97.33,221.33,137.33,160.0],"pivot":[0.87055,0.03889],"file":"warrior-cloth.webp","src":[859,477,77,90],"kind":"cloth"}]],
"warrior-season2":[[{"rect":[91.0,236.0,100.0,192.0],"pivot":[0.86778,0.03009],"file":"warrior-cloth.webp","src":[265,185,75,144],"kind":"cloth"}],[{"rect":[57.0,218.0,198.0,203.0],"pivot":[0.91526,0.02956],"file":"warrior-cloth.webp","src":[793,2,148,152],"kind":"cloth"}],[{"rect":[20.0,236.0,214.0,198.0],"pivot":[0.92004,0.02918],"file":"warrior-cloth.webp","src":[2,185,160,148],"kind":"cloth"}],[{"rect":[19.0,257.0,219.0,185.0],"pivot":[0.91984,0.03303],"file":"warrior-cloth.webp","src":[737,185,164,139],"kind":"cloth"}],[{"rect":[74.67,236.0,118.67,176.0],"pivot":[0.86891,0.03283],"file":"warrior-cloth.webp","src":[388,477,67,99],"kind":"cloth"}],[{"rect":[65.33,236.0,126.67,157.33],"pivot":[0.88772,0.03672],"file":"warrior-cloth.webp","src":[940,477,71,88],"kind":"cloth"}]],
"shadow-0":[[{"file":"shadow-length.webp","rect":[224,62,116,73],"pivot":[0.966,0.405],"kind":"hair","front":true}],[{"file":"shadow-length.webp","rect":[218,57,116,73],"pivot":[0.966,0.405],"kind":"hair","front":true}],[{"file":"shadow-length.webp","rect":[184,70,116,73],"pivot":[0.966,0.405],"kind":"hair","front":true}],[{"file":"shadow-length.webp","rect":[118,101,116,73],"pivot":[0.966,0.405],"kind":"hair","front":true}],[{"file":"shadow-length.webp","rect":[224,62,116,73],"pivot":[0.966,0.405],"kind":"hair","front":true}],[{"file":"shadow-length.webp","rect":[224,62,116,73],"pivot":[0.966,0.405],"kind":"hair","front":true}]],
"shadow-1":[[{"rect":[104.0,278.0,131.0,132.0],"pivot":[0.86175,0.04882],"file":"shadow-cloth.webp","src":[324,536,98,99],"kind":"cloth"},{"file":"shadow-length.webp","rect":[221,53,116,73],"pivot":[0.966,0.405],"kind":"hair","front":true}],[{"rect":[70.0,257.0,192.0,133.0],"pivot":[0.89468,0.04595],"file":"shadow-cloth.webp","src":[176,536,144,100],"kind":"cloth"},{"file":"shadow-length.webp","rect":[220,56,116,73],"pivot":[0.966,0.405],"kind":"hair","front":true}],[{"rect":[39.0,268.0,209.0,120.0],"pivot":[0.90218,0.04815],"file":"shadow-cloth.webp","src":[706,536,157,90],"kind":"cloth"},{"file":"shadow-length.webp","rect":[189,73,116,73],"pivot":[0.966,0.405],"kind":"hair","front":true}],[{"rect":[12.0,303.0,221.0,125.0],"pivot":[0.97536,0.05067],"file":"shadow-cloth.webp","src":[426,536,166,94],"kind":"cloth"},{"file":"shadow-length.webp","rect":[140,103,116,73],"pivot":[0.966,0.405],"kind":"hair","front":true}],[{"rect":[104.0,281.33,134.67,108.0],"pivot":[0.89109,0.06173],"file":"shadow-cloth.webp","src":[513,641,76,61],"kind":"cloth"},{"file":"shadow-length.webp","rect":[221,53,116,73],"pivot":[0.966,0.405],"kind":"hair","front":true}],[{"rect":[104.0,281.33,138.67,93.33],"pivot":[0.89103,0.07143],"file":"shadow-cloth.webp","src":[697,641,78,52],"kind":"cloth"},{"file":"shadow-length.webp","rect":[221,53,116,73],"pivot":[0.966,0.405],"kind":"hair","front":true}]],
"shadow-2":[[{"rect":[114.0,260.0,169.0,175.0],"pivot":[0.90335,0.0381],"file":"shadow-cloth.webp","src":[176,158,127,131],"kind":"cloth"},{"file":"shadow-length.webp","rect":[223,58,116,73],"pivot":[0.966,0.405],"kind":"hair","front":true}],[{"rect":[71.0,239.0,208.0,157.0],"pivot":[0.90652,0.04034],"file":"shadow-cloth.webp","src":[128,298,156,118],"kind":"cloth"},{"file":"shadow-length.webp","rect":[226,52,116,73],"pivot":[0.966,0.405],"kind":"hair","front":true}],[{"rect":[33.0,260.0,245.0,136.0],"pivot":[0.9102,0.04902],"file":"shadow-cloth.webp","src":[508,420,184,102],"kind":"cloth"},{"file":"shadow-length.webp","rect":[182,65,116,73],"pivot":[0.966,0.405],"kind":"hair","front":true}],[{"rect":[16.0,328.0,213.0,151.0],"pivot":[0.92645,0.04121],"file":"shadow-cloth.webp","src":[586,298,160,113],"kind":"cloth"},{"file":"shadow-length.webp","rect":[145,98,116,73],"pivot":[0.966,0.405],"kind":"hair","front":true}],[{"rect":[113.33,260.0,162.67,145.33],"pivot":[0.89891,0.04587],"file":"shadow-cloth.webp","src":[2,641,92,82],"kind":"cloth"},{"file":"shadow-length.webp","rect":[223,58,116,73],"pivot":[0.966,0.405],"kind":"hair","front":true}],[{"rect":[113.33,257.33,168.0,130.67],"pivot":[0.89153,0.04422],"file":"shadow-cloth.webp","src":[310,641,94,74],"kind":"cloth"},{"file":"shadow-length.webp","rect":[223,58,116,73],"pivot":[0.966,0.405],"kind":"hair","front":true}]],
"shadow-3":[[{"rect":[96.0,204.0,165.0,199.0],"pivot":[0.90505,0.02903],"file":"shadow-cloth.webp","src":[147,2,124,149],"kind":"cloth"},{"file":"shadow-length.webp","rect":[214,100,105,68],"pivot":[0.966,0.405],"kind":"hair","front":true}],[{"rect":[98.0,196.0,161.0,196.0],"pivot":[0.89303,0.03401],"file":"shadow-cloth.webp","src":[275,2,121,147],"kind":"cloth"},{"file":"shadow-length.webp","rect":[227,109,105,68],"pivot":[0.966,0.405],"kind":"hair","front":true}],[{"rect":[52.0,200.0,198.0,192.0],"pivot":[0.9046,0.03241],"file":"shadow-cloth.webp","src":[650,2,148,144],"kind":"cloth"},{"file":"shadow-length.webp","rect":[199,112,105,68],"pivot":[0.966,0.405],"kind":"hair","front":true}],[{"rect":[96.0,207.0,153.0,195.0],"pivot":[0.88308,0.03248],"file":"shadow-cloth.webp","src":[531,2,115,146],"kind":"cloth"},{"file":"shadow-length.webp","rect":[225,107,105,68],"pivot":[0.966,0.405],"kind":"hair","front":true}],[{"rect":[96.0,200.0,166.67,182.67],"pivot":[0.896,0.03406],"file":"shadow-cloth.webp","src":[410,420,94,103],"kind":"cloth"},{"file":"shadow-length.webp","rect":[214,100,105,68],"pivot":[0.966,0.405],"kind":"hair","front":true}],[{"rect":[96.0,200.0,166.67,193.33],"pivot":[0.896,0.03218],"file":"shadow-cloth.webp","src":[165,420,94,109],"kind":"cloth"},{"file":"shadow-length.webp","rect":[214,100,105,68],"pivot":[0.966,0.405],"kind":"hair","front":true}]],
"shadow-4":[[{"rect":[97.0,253.0,173.0,171.0],"pivot":[0.89852,0.03834],"file":"shadow-cloth.webp","src":[453,158,130,128],"kind":"cloth"},{"file":"shadow-length.webp","rect":[199,70,116,73],"pivot":[0.966,0.405],"kind":"hair","front":true}],[{"rect":[82.0,243.0,187.0,160.0],"pivot":[0.89245,0.03681],"file":"shadow-cloth.webp","src":[732,158,140,120],"kind":"cloth"},{"file":"shadow-length.webp","rect":[196,70,116,73],"pivot":[0.966,0.405],"kind":"hair","front":true}],[{"rect":[21.0,250.0,249.0,150.0],"pivot":[0.91522,0.04],"file":"shadow-cloth.webp","src":[750,298,187,112],"kind":"cloth"},{"file":"shadow-length.webp","rect":[175,82,116,73],"pivot":[0.966,0.405],"kind":"hair","front":true}],[{"rect":[85.0,296.0,158.0,160.0],"pivot":[0.90225,0.03889],"file":"shadow-cloth.webp","src":[876,158,118,120],"kind":"cloth"},{"file":"shadow-length.webp","rect":[194,87,116,73],"pivot":[0.966,0.405],"kind":"hair","front":true}],[{"rect":[96.0,253.33,173.33,152.0],"pivot":[0.90256,0.04094],"file":"shadow-cloth.webp","src":[867,536,98,86],"kind":"cloth"},{"file":"shadow-length.webp","rect":[199,70,116,73],"pivot":[0.966,0.405],"kind":"hair","front":true}],[{"rect":[96.0,253.33,174.67,138.67],"pivot":[0.89567,0.04487],"file":"shadow-cloth.webp","src":[208,641,98,78],"kind":"cloth"},{"file":"shadow-length.webp","rect":[199,70,116,73],"pivot":[0.966,0.405],"kind":"hair","front":true}]],
"shadow-5":[[{"rect":[86.0,264.0,188.0,171.0],"pivot":[0.90426,0.03639],"file":"shadow-cloth.webp","src":[587,158,141,128],"kind":"cloth"},{"file":"shadow-length.webp","rect":[194,63,116,73],"pivot":[0.966,0.405],"kind":"hair","front":true}],[{"rect":[78.0,239.0,189.0,175.0],"pivot":[0.90417,0.03619],"file":"shadow-cloth.webp","src":[307,158,142,131],"kind":"cloth"},{"file":"shadow-length.webp","rect":[195,63,116,73],"pivot":[0.966,0.405],"kind":"hair","front":true}],[{"rect":[19.0,243.0,253.0,157.0],"pivot":[0.92271,0.03751],"file":"shadow-cloth.webp","src":[288,298,190,118],"kind":"cloth"},{"file":"shadow-length.webp","rect":[175,75,116,73],"pivot":[0.966,0.405],"kind":"hair","front":true}],[{"rect":[81.0,296.0,163.0,158.0],"pivot":[0.89911,0.03938],"file":"shadow-cloth.webp","src":[2,298,122,118],"kind":"cloth"},{"file":"shadow-length.webp","rect":[189,86,116,73],"pivot":[0.966,0.405],"kind":"hair","front":true}],[{"rect":[85.33,264.0,189.33,161.33],"pivot":[0.90141,0.03857],"file":"shadow-cloth.webp","src":[596,536,106,91],"kind":"cloth"},{"file":"shadow-length.webp","rect":[194,63,116,73],"pivot":[0.966,0.405],"kind":"hair","front":true}],[{"rect":[85.33,260.0,189.33,144.0],"pivot":[0.90141,0.0463],"file":"shadow-cloth.webp","src":[98,641,106,81],"kind":"cloth"},{"file":"shadow-length.webp","rect":[194,63,116,73],"pivot":[0.966,0.405],"kind":"hair","front":true}]],
"shadow-event":[[{"rect":[57.0,207.0,188.0,203.0],"pivot":[0.90721,0.0312],"file":"shadow-cloth.webp","src":[2,2,141,152],"kind":"cloth"},{"file":"shadow-length.webp","rect":[223,70,105,68],"pivot":[0.966,0.405],"kind":"hair","front":true}],[{"rect":[54.0,200.0,196.0,184.0],"pivot":[0.90363,0.03382],"file":"shadow-cloth.webp","src":[802,2,147,138],"kind":"cloth"},{"file":"shadow-length.webp","rect":[219,68,105,68],"pivot":[0.966,0.405],"kind":"hair","front":true}],[{"rect":[28.0,207.0,226.0,182.0],"pivot":[0.91445,0.0348],"file":"shadow-cloth.webp","src":[2,158,170,136],"kind":"cloth"},{"file":"shadow-length.webp","rect":[203,68,105,68],"pivot":[0.966,0.405],"kind":"hair","front":true}],[{"rect":[64.0,260.0,169.0,196.0],"pivot":[0.90467,0.03401],"file":"shadow-cloth.webp","src":[400,2,127,147],"kind":"cloth"},{"file":"shadow-length.webp","rect":[237,82,105,68],"pivot":[0.966,0.405],"kind":"hair","front":true}],[{"rect":[66.67,210.67,177.33,202.67],"pivot":[0.90727,0.0307],"file":"shadow-cloth.webp","src":[482,298,100,114],"kind":"cloth"},{"file":"shadow-length.webp","rect":[223,70,105,68],"pivot":[0.966,0.405],"kind":"hair","front":true}],[{"rect":[68.0,210.67,176.0,181.33],"pivot":[0.90657,0.03431],"file":"shadow-cloth.webp","src":[696,420,99,102],"kind":"cloth"},{"file":"shadow-length.webp","rect":[223,70,105,68],"pivot":[0.966,0.405],"kind":"hair","front":true}]],
"shadow-season2":[[{"rect":[62.0,250.0,212.0,150.0],"pivot":[0.89832,0.04],"file":"shadow-cloth.webp","src":[2,420,159,112],"kind":"cloth"},{"file":"shadow-length.webp","rect":[204,57,126,79],"pivot":[0.966,0.405],"kind":"hair","front":true}],[{"rect":[49.0,250.0,226.0,135.0],"pivot":[0.9002,0.04444],"file":"shadow-cloth.webp","src":[2,536,170,101],"kind":"cloth"},{"file":"shadow-length.webp","rect":[215,58,126,79],"pivot":[0.966,0.405],"kind":"hair","front":true}],[{"rect":[24.0,257.0,254.0,136.0],"pivot":[0.91339,0.04493],"file":"shadow-cloth.webp","src":[799,420,190,102],"kind":"cloth"},{"file":"shadow-length.webp","rect":[165,59,126,79],"pivot":[0.966,0.405],"kind":"hair","front":true}],[{"rect":[75.0,303.0,191.0,143.0],"pivot":[0.8918,0.04429],"file":"shadow-cloth.webp","src":[263,420,143,107],"kind":"cloth"},{"file":"shadow-length.webp","rect":[170,79,126,79],"pivot":[0.966,0.405],"kind":"hair","front":true}],[{"rect":[88.0,249.33,180.0,124.0],"pivot":[0.89383,0.05376],"file":"shadow-cloth.webp","src":[408,641,101,70],"kind":"cloth"},{"file":"shadow-length.webp","rect":[204,57,126,79],"pivot":[0.966,0.405],"kind":"hair","front":true}],[{"rect":[88.0,249.33,178.67,101.33],"pivot":[0.9005,0.06579],"file":"shadow-cloth.webp","src":[593,641,100,57],"kind":"cloth"},{"file":"shadow-length.webp","rect":[204,57,126,79],"pivot":[0.966,0.405],"kind":"hair","front":true}]],
"paladin-0":[[{"rect":[111.0,246.0,91.0,142.0],"pivot":[0.85104,0.04538],"file":"paladin-cloth.webp","src":[177,645,68,106],"kind":"cloth"},{"file":"paladin-length.webp","rect":[208.48,82.1,21.52,28.9],"pivot":[0.6,0.085],"kind":"hair","front":true}],[{"rect":[102.0,189.0,145.0,210.0],"pivot":[0.89042,0.03122],"file":"paladin-cloth.webp","src":[427,176,109,158],"kind":"cloth"},{"file":"paladin-length.webp","rect":[240.48,110.1,21.52,28.9],"pivot":[0.6,0.085],"kind":"hair","front":true}],[{"rect":[26.0,164.0,196.0,224.0],"pivot":[0.9195,0.02976],"file":"paladin-cloth.webp","src":[183,2,147,168],"kind":"cloth"},{"file":"paladin-length.webp","rect":[172.48,90.1,21.52,28.9],"pivot":[0.6,0.085],"kind":"hair","front":true}],[{"rect":[47.0,196.0,182.0,203.0],"pivot":[0.91392,0.03284],"file":"paladin-cloth.webp","src":[863,176,136,152],"kind":"cloth"},{"file":"paladin-length.webp","rect":[220.48,88.1,21.52,28.9],"pivot":[0.6,0.085],"kind":"hair","front":true}],[{"rect":[98.67,242.67,104.0,138.67],"pivot":[0.86325,0.04487],"file":"paladin-cloth.webp","src":[146,759,58,78],"kind":"cloth"},{"file":"paladin-length.webp","rect":[213.77,81.89,20.45,27.44],"pivot":[0.6,0.085],"kind":"hair","front":true}],[{"rect":[105.33,242.67,97.33,129.33],"pivot":[0.85388,0.04811],"file":"paladin-cloth.webp","src":[208,759,55,73],"kind":"cloth"},{"file":"paladin-length.webp","rect":[213.77,81.89,20.45,27.44],"pivot":[0.6,0.085],"kind":"hair","front":true}]],
"paladin-1":[[{"rect":[114.0,250.0,88.0,154.0],"pivot":[0.84596,0.03896],"file":"paladin-cloth.webp","src":[870,496,66,116],"kind":"cloth"},{"file":"paladin-length.webp","rect":[212.48,76.1,21.52,28.9],"pivot":[0.6,0.085],"kind":"hair","front":true}],[{"rect":[74.0,193.0,166.0,201.0],"pivot":[0.90361,0.0304],"file":"paladin-cloth.webp","src":[495,340,124,151],"kind":"cloth"},{"file":"paladin-length.webp","rect":[226.48,98.1,21.52,28.9],"pivot":[0.6,0.085],"kind":"hair","front":true}],[{"rect":[12.0,182.0,201.0,210.0],"pivot":[0.91321,0.03069],"file":"paladin-cloth.webp","src":[540,176,151,158],"kind":"cloth"},{"file":"paladin-length.webp","rect":[168.48,94.1,21.52,28.9],"pivot":[0.6,0.085],"kind":"hair","front":true}],[{"rect":[83.0,232.0,135.0,160.0],"pivot":[0.88642,0.03889],"file":"paladin-cloth.webp","src":[765,496,101,120],"kind":"cloth"},{"file":"paladin-length.webp","rect":[218.48,72.1,21.52,28.9],"pivot":[0.6,0.085],"kind":"hair","front":true}],[{"rect":[97.33,242.67,106.67,140.0],"pivot":[0.85417,0.04444],"file":"paladin-cloth.webp","src":[82,759,60,79],"kind":"cloth"},{"file":"paladin-length.webp","rect":[212.78,77.47,21.44,29.19],"pivot":[0.6,0.085],"kind":"hair","front":true}],[{"rect":[105.33,242.67,98.67,114.67],"pivot":[0.84234,0.05426],"file":"paladin-cloth.webp","src":[267,759,56,64],"kind":"cloth"},{"file":"paladin-length.webp","rect":[212.78,77.47,21.44,29.19],"pivot":[0.6,0.085],"kind":"hair","front":true}]],
"paladin-2":[[{"rect":[96.0,232.0,114.0,192.0],"pivot":[0.87329,0.03241],"file":"paladin-cloth.webp","src":[281,496,86,144],"kind":"cloth"},{"file":"paladin-length.webp","rect":[208.13,90.41,20.53,27.59],"pivot":[0.6,0.085],"kind":"hair","front":true}],[{"rect":[87.0,211.0,146.0,202.0],"pivot":[0.88965,0.02915],"file":"paladin-cloth.webp","src":[381,340,110,152],"kind":"cloth"},{"file":"paladin-length.webp","rect":[214.13,100.41,20.53,27.59],"pivot":[0.6,0.085],"kind":"hair","front":true}],[{"rect":[50.0,189.0,183.0,217.0],"pivot":[0.91196,0.03021],"file":"paladin-cloth.webp","src":[756,2,137,163],"kind":"cloth"},{"file":"paladin-length.webp","rect":[223.7,102.73,19.3,26.27],"pivot":[0.6,0.085],"kind":"hair","front":true}],[{"rect":[53.0,236.0,171.0,192.0],"pivot":[0.91683,0.03009],"file":"paladin-cloth.webp","src":[371,496,128,144],"kind":"cloth"},{"file":"paladin-length.webp","rect":[203.7,96.73,19.3,26.27],"pivot":[0.6,0.085],"kind":"hair","front":true}],[{"rect":[85.33,232.0,121.33,168.0],"pivot":[0.87912,0.03704],"file":"paladin-cloth.webp","src":[657,645,68,94],"kind":"cloth"},{"file":"paladin-length.webp","rect":[213.43,91.06,19.46,26.27],"pivot":[0.6,0.085],"kind":"hair","front":true}],[{"rect":[84.0,232.0,124.0,168.0],"pivot":[0.87097,0.03704],"file":"paladin-cloth.webp","src":[729,645,70,94],"kind":"cloth"},{"file":"paladin-length.webp","rect":[213.43,91.06,19.46,26.27],"pivot":[0.6,0.085],"kind":"hair","front":true}]],
"paladin-3":[[{"rect":[83.0,218.0,120.0,227.0],"pivot":[0.8787,0.02643],"file":"paladin-cloth.webp","src":[2,2,90,170],"kind":"cloth"},{"file":"paladin-length.webp","rect":[211.7,93.73,19.3,26.27],"pivot":[0.6,0.085],"kind":"hair","front":true}],[{"rect":[52.0,200.0,181.0,224.0],"pivot":[0.91099,0.02778],"file":"paladin-cloth.webp","src":[334,2,136,168],"kind":"cloth"},{"file":"paladin-length.webp","rect":[219.7,104.73,19.3,26.27],"pivot":[0.6,0.085],"kind":"hair","front":true}],[{"rect":[33.0,189.0,218.0,214.0],"pivot":[0.92508,0.03063],"file":"paladin-cloth.webp","src":[2,176,164,160],"kind":"cloth"},{"file":"paladin-length.webp","rect":[229.7,96.73,19.3,26.27],"pivot":[0.6,0.085],"kind":"hair","front":true}],[{"rect":[57.0,232.0,161.0,203.0],"pivot":[0.9931,0.03065],"file":"paladin-cloth.webp","src":[2,340,121,152],"kind":"cloth"},{"file":"paladin-length.webp","rect":[220.13,94.41,20.53,27.59],"pivot":[0.6,0.085],"kind":"hair","front":true}],[{"rect":[61.33,225.33,146.67,192.0],"pivot":[0.89091,0.03009],"file":"paladin-cloth.webp","src":[91,645,82,108],"kind":"cloth"},{"file":"paladin-length.webp","rect":[215.64,95.48,18.14,24.52],"pivot":[0.6,0.085],"kind":"hair","front":true}],[{"rect":[57.33,225.33,150.67,196.0],"pivot":[0.89381,0.02948],"file":"paladin-cloth.webp","src":[2,645,85,110],"kind":"cloth"},{"file":"paladin-length.webp","rect":[215.64,95.48,18.14,24.52],"pivot":[0.6,0.085],"kind":"hair","front":true}]],
"paladin-4":[[{"rect":[106.0,221.0,100.0,193.0],"pivot":[0.86,0.03397],"file":"paladin-cloth.webp","src":[2,496,75,145],"kind":"cloth"},{"file":"paladin-length.webp","rect":[215.36,119.48,18.31,24.52],"pivot":[0.6,0.085],"kind":"hair","front":true}],[{"rect":[34.0,200.0,194.0,197.0],"pivot":[0.9244,0.03158],"file":"paladin-cloth.webp","src":[771,340,146,148],"kind":"cloth"},{"file":"paladin-length.webp","rect":[227.36,126.48,18.31,24.52],"pivot":[0.6,0.085],"kind":"hair","front":true}],[{"rect":[42.0,182.0,224.0,203.0],"pivot":[0.92361,0.03175],"file":"paladin-cloth.webp","src":[127,340,168,152],"kind":"cloth"},{"file":"paladin-length.webp","rect":[259.36,131.48,18.31,24.52],"pivot":[0.6,0.085],"kind":"hair","front":true}],[{"rect":[61.0,214.0,163.0,193.0],"pivot":[0.91275,0.03339],"file":"paladin-cloth.webp","src":[81,496,122,145],"kind":"cloth"},{"file":"paladin-length.webp","rect":[223.36,124.48,18.31,24.52],"pivot":[0.6,0.085],"kind":"hair","front":true}],[{"rect":[84.0,232.0,126.67,165.33],"pivot":[0.8807,0.03763],"file":"paladin-cloth.webp","src":[803,645,71,93],"kind":"cloth"},{"file":"paladin-length.webp","rect":[224.62,120.65,17.15,23.35],"pivot":[0.6,0.085],"kind":"hair","front":true}],[{"rect":[72.0,228.0,138.67,169.33],"pivot":[0.89103,0.03937],"file":"paladin-cloth.webp","src":[575,645,78,95],"kind":"cloth"},{"file":"paladin-length.webp","rect":[224.62,120.65,17.15,23.35],"pivot":[0.6,0.085],"kind":"hair","front":true}]],
"paladin-5":[[{"rect":[102.0,207.0,94.0,193.0],"pivot":[0.84397,0.03282],"file":"paladin-cloth.webp","src":[207,496,70,145],"kind":"cloth"},{"file":"paladin-length.webp","rect":[218.02,103.79,17.32,23.21],"pivot":[0.6,0.085],"kind":"hair","front":true}],[{"rect":[65.0,196.0,157.0,178.0],"pivot":[0.8995,0.03745],"file":"paladin-cloth.webp","src":[643,496,118,134],"kind":"cloth"},{"file":"paladin-length.webp","rect":[239.59,111.11,16.08,21.89],"pivot":[0.6,0.085],"kind":"hair","front":true}],[{"rect":[52.0,175.0,182.0,182.0],"pivot":[0.90598,0.0348],"file":"paladin-cloth.webp","src":[503,496,136,136],"kind":"cloth"},{"file":"paladin-length.webp","rect":[237.36,115.48,18.31,24.52],"pivot":[0.6,0.085],"kind":"hair","front":true}],[{"rect":[91.0,214.0,115.0,196.0],"pivot":[0.87826,0.03288],"file":"paladin-cloth.webp","src":[921,340,86,147],"kind":"cloth"},{"file":"paladin-length.webp","rect":[224.02,101.79,17.32,23.21],"pivot":[0.6,0.085],"kind":"hair","front":true}],[{"rect":[56.0,221.33,140.0,176.0],"pivot":[0.89524,0.03535],"file":"paladin-cloth.webp","src":[413,645,79,99],"kind":"cloth"},{"file":"paladin-length.webp","rect":[221.61,101.06,16.16,21.6],"pivot":[0.6,0.085],"kind":"hair","front":true}],[{"rect":[62.67,221.33,133.33,173.33],"pivot":[0.89,0.0359],"file":"paladin-cloth.webp","src":[496,645,75,98],"kind":"cloth"},{"file":"paladin-length.webp","rect":[221.61,101.06,16.16,21.6],"pivot":[0.6,0.085],"kind":"hair","front":true}]],
"paladin-event":[[{"rect":[114.0,214.0,111.0,227.0],"pivot":[0.86286,0.02839],"file":"paladin-cloth.webp","src":[96,2,83,170],"kind":"cloth"},{"file":"paladin-length.webp","rect":[242,93,18,22],"pivot":[0.6,0.085],"kind":"hair","front":true}],[{"rect":[62.0,211.0,171.0,223.0],"pivot":[0.90578,0.02641],"file":"paladin-cloth.webp","src":[624,2,128,167],"kind":"cloth"},{"file":"paladin-length.webp","rect":[239,94,18,22],"pivot":[0.6,0.085],"kind":"hair","front":true}],[{"rect":[58.0,189.0,195.0,224.0],"pivot":[0.90598,0.02927],"file":"paladin-cloth.webp","src":[474,2,146,168],"kind":"cloth"},{"file":"paladin-length.webp","rect":[233,89,18,22],"pivot":[0.6,0.085],"kind":"hair","front":true}],[{"rect":[110.0,221.0,123.0,213.0],"pivot":[0.86902,0.03078],"file":"paladin-cloth.webp","src":[170,176,92,160],"kind":"cloth"},{"file":"paladin-length.webp","rect":[243,83,18,22],"pivot":[0.6,0.085],"kind":"hair","front":true}],[{"rect":[86.67,225.33,138.67,181.33],"pivot":[0.88782,0.03186],"file":"paladin-cloth.webp","src":[249,645,78,102],"kind":"cloth"},{"file":"paladin-length.webp","rect":[242,93,18,22],"pivot":[0.6,0.085],"kind":"hair","front":true}],[{"rect":[88.0,225.33,138.67,181.33],"pivot":[0.87821,0.03186],"file":"paladin-cloth.webp","src":[331,645,78,102],"kind":"cloth"},{"file":"paladin-length.webp","rect":[242,93,18,22],"pivot":[0.6,0.085],"kind":"hair","front":true}]],
"paladin-season2":[[{"rect":[109.0,239.0,104.0,203.0],"pivot":[0.86645,0.0312],"file":"paladin-cloth.webp","src":[299,340,78,152],"kind":"cloth"},{"file":"paladin-length.webp","rect":[212.48,80.1,21.52,28.9],"pivot":[0.6,0.085],"kind":"hair","front":true}],[{"rect":[35.0,214.0,209.0,211.0],"pivot":[0.92132,0.03054],"file":"paladin-cloth.webp","src":[266,176,157,158],"kind":"cloth"},{"file":"paladin-length.webp","rect":[226.48,98.1,21.52,28.9],"pivot":[0.6,0.085],"kind":"hair","front":true}],[{"rect":[18.0,200.0,219.0,206.0],"pivot":[0.9244,0.0302],"file":"paladin-cloth.webp","src":[695,176,164,154],"kind":"cloth"},{"file":"paladin-length.webp","rect":[244.13,94.41,20.53,27.59],"pivot":[0.6,0.085],"kind":"hair","front":true}],[{"rect":[34.0,228.0,192.0,200.0],"pivot":[0.91551,0.03333],"file":"paladin-cloth.webp","src":[623,340,144,150],"kind":"cloth"},{"file":"paladin-length.webp","rect":[202.48,85.1,21.52,28.9],"pivot":[0.6,0.085],"kind":"hair","front":true}],[{"rect":[66.67,236.0,148.0,161.33],"pivot":[0.89489,0.03581],"file":"paladin-cloth.webp","src":[878,645,83,91],"kind":"cloth"},{"file":"paladin-length.webp","rect":[217.77,81.89,20.45,27.44],"pivot":[0.6,0.085],"kind":"hair","front":true}],[{"rect":[80.0,236.0,136.0,158.67],"pivot":[0.87582,0.03641],"file":"paladin-cloth.webp","src":[2,759,76,89],"kind":"cloth"},{"file":"paladin-length.webp","rect":[217.77,81.89,20.45,27.44],"pivot":[0.6,0.085],"kind":"hair","front":true}]],
"mage-0":[[{"rect":[160.0,228.0,69.0,107.0],"pivot":[0.77295,0.06231],"file":"mage-cloth.webp","src":[77,691,52,80],"kind":"cloth"},{"file":"mage-length.webp","rect":[180,53,46,59],"pivot":[0.84,0.09],"kind":"hair","front":true}],[{"rect":[97.0,196.0,160.0,144.0],"pivot":[0.88264,0.0463],"file":"mage-cloth.webp","src":[609,463,120,108],"kind":"cloth"},{"file":"mage-length.webp","rect":[186,69,43,55],"pivot":[0.84,0.09],"kind":"hair","front":true}],[{"rect":[94.0,200.0,182.0,153.0],"pivot":[0.89011,0.04067],"file":"mage-cloth.webp","src":[2,463,136,115],"kind":"cloth"},{"file":"mage-length.webp","rect":[215,78,46,59],"pivot":[0.84,0.09],"kind":"hair","front":true}],[{"rect":[146.0,228.0,75.0,118.0],"pivot":[0.80296,0.0565],"file":"mage-cloth.webp","src":[957,582,56,88],"kind":"cloth"},{"file":"mage-length.webp","rect":[180,57,46,59],"pivot":[0.84,0.09],"kind":"hair","front":true}],[{"rect":[101.33,225.33,126.67,144.0],"pivot":[0.88421,0.04012],"file":"mage-cloth.webp","src":[2,691,71,81],"kind":"cloth"},{"file":"mage-length.webp","rect":[180,53,46,59],"pivot":[0.84,0.09],"kind":"hair","front":true}],[{"rect":[118.67,228.0,109.33,136.0],"pivot":[0.86585,0.04902],"file":"mage-cloth.webp","src":[133,691,62,76],"kind":"cloth"},{"file":"mage-length.webp","rect":[180,53,46,59],"pivot":[0.84,0.09],"kind":"hair","front":true}]],
"mage-1":[[{"rect":[120.0,236.0,89.0,185.0],"pivot":[0.84894,0.03123],"file":"mage-cloth.webp","src":[487,173,67,139],"kind":"cloth"},{"file":"mage-length.webp","rect":[182,89,44,52],"pivot":[0.84,0.09],"kind":"hair","front":true}],[{"rect":[75.0,221.0,146.0,199.0],"pivot":[0.89878,0.03294],"file":"mage-cloth.webp","src":[755,2,110,149],"kind":"cloth"},{"file":"mage-length.webp","rect":[151,102,41,49],"pivot":[0.84,0.09],"kind":"hair","front":true}],[{"rect":[60.0,228.0,159.0,181.0],"pivot":[0.89727,0.03683],"file":"mage-cloth.webp","src":[2,323,119,136],"kind":"cloth"},{"file":"mage-length.webp","rect":[193,121,47,55],"pivot":[0.84,0.09],"kind":"hair","front":true}],[{"rect":[113.0,239.0,104.0,197.0],"pivot":[0.86218,0.03215],"file":"mage-cloth.webp","src":[869,2,78,148],"kind":"cloth"},{"file":"mage-length.webp","rect":[179,91,44,52],"pivot":[0.84,0.09],"kind":"hair","front":true}],[{"rect":[62.67,236.0,148.0,173.33],"pivot":[0.8979,0.03333],"file":"mage-cloth.webp","src":[602,582,83,98],"kind":"cloth"},{"file":"mage-length.webp","rect":[182,89,44,52],"pivot":[0.84,0.09],"kind":"hair","front":true}],[{"rect":[72.0,232.0,138.67,160.0],"pivot":[0.89103,0.03889],"file":"mage-cloth.webp","src":[875,582,78,90],"kind":"cloth"},{"file":"mage-length.webp","rect":[182,89,44,52],"pivot":[0.84,0.09],"kind":"hair","front":true}]],
"mage-2":[[{"rect":[119.0,232.0,102.0,185.0],"pivot":[0.85512,0.03363],"file":"mage-cloth.webp","src":[558,173,76,139],"kind":"cloth"},{"file":"mage-length.webp","rect":[182,83,43,58],"pivot":[0.84,0.09],"kind":"hair","front":true}],[{"rect":[120.0,221.0,126.0,173.0],"pivot":[0.88183,0.03789],"file":"mage-cloth.webp","src":[289,323,94,130],"kind":"cloth"},{"file":"mage-length.webp","rect":[204,96,40,55],"pivot":[0.84,0.09],"kind":"hair","front":true}],[{"rect":[83.0,218.0,184.0,182.0],"pivot":[0.90157,0.03297],"file":"mage-cloth.webp","src":[833,173,138,136],"kind":"cloth"},{"file":"mage-length.webp","rect":[211,118,43,58],"pivot":[0.84,0.09],"kind":"hair","front":true}],[{"rect":[106.0,236.0,115.0,183.0],"pivot":[0.8715,0.03157],"file":"mage-cloth.webp","src":[743,173,86,137],"kind":"cloth"},{"file":"mage-length.webp","rect":[173,86,43,58],"pivot":[0.84,0.09],"kind":"hair","front":true}],[{"rect":[102.67,236.0,118.67,174.67],"pivot":[0.87266,0.03308],"file":"mage-cloth.webp","src":[531,582,67,98],"kind":"cloth"},{"file":"mage-length.webp","rect":[182,83,43,58],"pivot":[0.84,0.09],"kind":"hair","front":true}],[{"rect":[84.0,236.0,137.33,180.0],"pivot":[0.88997,0.0321],"file":"mage-cloth.webp","src":[273,582,77,101],"kind":"cloth"},{"file":"mage-length.webp","rect":[182,83,43,58],"pivot":[0.84,0.09],"kind":"hair","front":true}]],
"mage-3":[[{"rect":[93.0,232.0,121.0,218.0],"pivot":[0.87695,0.02854],"file":"mage-cloth.webp","src":[201,2,91,164],"kind":"cloth"},{"file":"mage-length.webp","rect":[196,111,45,48],"pivot":[0.84,0.09],"kind":"hair","front":true}],[{"rect":[72.0,228.0,158.0,195.0],"pivot":[0.89451,0.03419],"file":"mage-cloth.webp","src":[2,173,118,146],"kind":"cloth"},{"file":"mage-length.webp","rect":[204,115,45,48],"pivot":[0.84,0.09],"kind":"hair","front":true}],[{"rect":[28.0,204.0,244.0,167.0],"pivot":[0.91985,0.0346],"file":"mage-cloth.webp","src":[387,323,183,125],"kind":"cloth"},{"file":"mage-length.webp","rect":[203,104,45,48],"pivot":[0.84,0.09],"kind":"hair","front":true}],[{"rect":[68.0,236.0,150.0,213.0],"pivot":[0.89778,0.02713],"file":"mage-cloth.webp","src":[395,2,112,160],"kind":"cloth"},{"file":"mage-length.webp","rect":[200,107,45,48],"pivot":[0.84,0.09],"kind":"hair","front":true}],[{"rect":[33.33,236.0,181.33,186.67],"pivot":[0.91422,0.03095],"file":"mage-cloth.webp","src":[843,463,102,105],"kind":"cloth"},{"file":"mage-length.webp","rect":[196,111,45,48],"pivot":[0.84,0.09],"kind":"hair","front":true}],[{"rect":[70.67,236.0,144.0,177.33],"pivot":[0.89198,0.03258],"file":"mage-cloth.webp","src":[354,582,81,100],"kind":"cloth"},{"file":"mage-length.webp","rect":[196,111,45,48],"pivot":[0.84,0.09],"kind":"hair","front":true}]],
"mage-4":[[{"rect":[90.0,207.0,118.0,223.0],"pivot":[0.86441,0.0284],"file":"mage-cloth.webp","src":[2,2,88,167],"kind":"cloth"},{"file":"mage-length.webp","rect":[183,101,40,42],"pivot":[0.84,0.09],"kind":"hair","front":true}],[{"rect":[67.0,207.0,137.0,220.0],"pivot":[0.88646,0.02879],"file":"mage-cloth.webp","src":[94,2,103,165],"kind":"cloth"},{"file":"mage-length.webp","rect":[184,97,40,42],"pivot":[0.84,0.09],"kind":"hair","front":true}],[{"rect":[42.0,207.0,218.0,189.0],"pivot":[0.91641,0.03351],"file":"mage-cloth.webp","src":[229,173,164,142],"kind":"cloth"},{"file":"mage-length.webp","rect":[230,116,40,42],"pivot":[0.84,0.09],"kind":"hair","front":true}],[{"rect":[77.0,214.0,127.0,218.0],"pivot":[0.87752,0.02956],"file":"mage-cloth.webp","src":[296,2,95,164],"kind":"cloth"},{"file":"mage-length.webp","rect":[180,101,40,42],"pivot":[0.84,0.09],"kind":"hair","front":true}],[{"rect":[69.33,214.67,138.67,198.67],"pivot":[0.88462,0.02908],"file":"mage-cloth.webp","src":[142,463,78,112],"kind":"cloth"},{"file":"mage-length.webp","rect":[183,101,40,42],"pivot":[0.84,0.09],"kind":"hair","front":true}],[{"rect":[70.67,214.67,137.33,184.0],"pivot":[0.8835,0.0314],"file":"mage-cloth.webp","src":[192,582,77,104],"kind":"cloth"},{"file":"mage-length.webp","rect":[183,101,40,42],"pivot":[0.84,0.09],"kind":"hair","front":true}]],
"mage-5":[[{"rect":[81.0,232.0,135.0,195.0],"pivot":[0.8749,0.03191],"file":"mage-cloth.webp","src":[124,173,101,146],"kind":"cloth"},{"file":"mage-length.webp","rect":[179,100,43,45],"pivot":[0.84,0.09],"kind":"hair","front":true}],[{"rect":[56.0,218.0,162.0,203.0],"pivot":[0.90535,0.02956],"file":"mage-cloth.webp","src":[629,2,122,152],"kind":"cloth"},{"file":"mage-length.webp","rect":[182,96,43,45],"pivot":[0.84,0.09],"kind":"hair","front":true}],[{"rect":[52.0,211.0,214.0,174.0],"pivot":[0.92004,0.03384],"file":"mage-cloth.webp","src":[125,323,160,130],"kind":"cloth"},{"file":"mage-length.webp","rect":[230,108,43,45],"pivot":[0.84,0.09],"kind":"hair","front":true}],[{"rect":[52.0,232.0,152.0,206.0],"pivot":[0.89766,0.0302],"file":"mage-cloth.webp","src":[511,2,114,154],"kind":"cloth"},{"file":"mage-length.webp","rect":[176,101,43,45],"pivot":[0.84,0.09],"kind":"hair","front":true}],[{"rect":[52.0,228.0,164.0,185.33],"pivot":[0.89702,0.03597],"file":"mage-cloth.webp","src":[96,582,92,104],"kind":"cloth"},{"file":"mage-length.webp","rect":[179,100,43,45],"pivot":[0.84,0.09],"kind":"hair","front":true}],[{"rect":[54.67,228.0,160.0,186.67],"pivot":[0.90278,0.03571],"file":"mage-cloth.webp","src":[2,582,90,105],"kind":"cloth"},{"file":"mage-length.webp","rect":[179,100,43,45],"pivot":[0.84,0.09],"kind":"hair","front":true}]],
"mage-event":[[{"rect":[108.0,214.0,114.0,189.0],"pivot":[0.8616,0.0341],"file":"mage-cloth.webp","src":[397,173,86,142],"kind":"cloth"},{"file":"mage-length.webp","rect":[184,51,45,62],"pivot":[0.84,0.09],"kind":"hair","front":true}],[{"rect":[28.0,204.0,243.0,157.0],"pivot":[0.92364,0.0368],"file":"mage-cloth.webp","src":[630,323,182,118],"kind":"cloth"},{"file":"mage-length.webp","rect":[184,50,45,62],"pivot":[0.84,0.09],"kind":"hair","front":true}],[{"rect":[46.0,204.0,229.0,148.0],"pivot":[0.91703,0.03904],"file":"mage-cloth.webp","src":[224,463,172,111],"kind":"cloth"},{"file":"mage-length.webp","rect":[214,58,45,62],"pivot":[0.84,0.09],"kind":"hair","front":true}],[{"rect":[86.0,228.0,135.0,185.0],"pivot":[0.89053,0.03604],"file":"mage-cloth.webp","src":[638,173,101,139],"kind":"cloth"},{"file":"mage-length.webp","rect":[180,54,45,62],"pivot":[0.84,0.09],"kind":"hair","front":true}],[{"rect":[46.67,225.33,174.67,194.67],"pivot":[0.91349,0.02968],"file":"mage-cloth.webp","src":[507,463,98,110],"kind":"cloth"},{"file":"mage-length.webp","rect":[184,51,45,62],"pivot":[0.84,0.09],"kind":"hair","front":true}],[{"rect":[65.33,225.33,156.0,176.0],"pivot":[0.90313,0.03283],"file":"mage-cloth.webp","src":[439,582,88,99],"kind":"cloth"},{"file":"mage-length.webp","rect":[184,51,45,62],"pivot":[0.84,0.09],"kind":"hair","front":true}]],
"mage-season2":[[{"rect":[146.0,243.0,70.0,165.0],"pivot":[0.80952,0.03569],"file":"mage-cloth.webp","src":[574,323,52,124],"kind":"cloth"},{"file":"mage-length.webp","rect":[193,57,44,58],"pivot":[0.84,0.09],"kind":"hair","front":true}],[{"rect":[110.0,225.0,141.0,144.0],"pivot":[0.88416,0.04244],"file":"mage-cloth.webp","src":[733,463,106,108],"kind":"cloth"},{"file":"mage-length.webp","rect":[207,65,44,58],"pivot":[0.84,0.09],"kind":"hair","front":true}],[{"rect":[39.0,211.0,242.0,156.0],"pivot":[0.91139,0.03775],"file":"mage-cloth.webp","src":[816,323,182,117],"kind":"cloth"},{"file":"mage-length.webp","rect":[217,79,44,58],"pivot":[0.84,0.09],"kind":"hair","front":true}],[{"rect":[113.0,253.0,137.0,148.0],"pivot":[0.88808,0.04429],"file":"mage-cloth.webp","src":[400,463,103,111],"kind":"cloth"},{"file":"mage-length.webp","rect":[219,69,44,58],"pivot":[0.84,0.09],"kind":"hair","front":true}],[{"rect":[56.0,242.67,161.33,168.0],"pivot":[0.90909,0.03704],"file":"mage-cloth.webp","src":[689,582,91,94],"kind":"cloth"},{"file":"mage-length.webp","rect":[193,57,44,58],"pivot":[0.84,0.09],"kind":"hair","front":true}],[{"rect":[60.0,242.67,154.67,164.0],"pivot":[0.89943,0.03794],"file":"mage-cloth.webp","src":[784,582,87,92],"kind":"cloth"},{"file":"mage-length.webp","rect":[193,57,44,58],"pivot":[0.84,0.09],"kind":"hair","front":true}]],
"archer-0":[[],[],[],[],[],[]],
"archer-1":[[],[],[],[],[],[]],
"archer-2":[[{"rect":[107.0,225.0,109.0,210.0],"pivot":[0.87768,0.0291],"file":"archer-cloth.webp","src":[646,2,82,158],"kind":"cloth"}],[{"rect":[95.0,218.0,133.0,215.0],"pivot":[0.88972,0.02791],"file":"archer-cloth.webp","src":[441,2,100,161],"kind":"cloth"}],[{"rect":[88.0,221.0,129.0,214.0],"pivot":[0.88889,0.03063],"file":"archer-cloth.webp","src":[545,2,97,160],"kind":"cloth"}],[{"rect":[101.0,253.0,118.0,177.0],"pivot":[0.86158,0.03704],"file":"archer-cloth.webp","src":[646,196,88,133],"kind":"cloth"}],[{"rect":[61.33,228.0,158.67,193.33],"pivot":[0.89076,0.03448],"file":"archer-cloth.webp","src":[833,349,89,109],"kind":"cloth"}],[{"rect":[76.0,228.0,144.0,185.33],"pivot":[0.87963,0.03597],"file":"archer-cloth.webp","src":[2,481,81,104],"kind":"cloth"}]],
"archer-3":[[{"rect":[102.0,268.0,132.0,177.0],"pivot":[0.87037,0.03264],"file":"archer-cloth.webp","src":[738,196,99,133],"kind":"cloth"}],[{"rect":[82.0,243.0,162.0,195.0],"pivot":[0.89849,0.0302],"file":"archer-cloth.webp","src":[241,196,122,146],"kind":"cloth"}],[{"rect":[75.0,243.0,167.0,199.0],"pivot":[0.89222,0.02959],"file":"archer-cloth.webp","src":[2,196,125,149],"kind":"cloth"}],[{"rect":[100.0,253.0,141.0,198.0],"pivot":[0.87943,0.03311],"file":"archer-cloth.webp","src":[131,196,106,148],"kind":"cloth"}],[{"rect":[58.67,264.0,177.33,164.0],"pivot":[0.89223,0.03794],"file":"archer-cloth.webp","src":[279,481,100,92],"kind":"cloth"}],[{"rect":[70.67,264.0,166.67,134.67],"pivot":[0.87733,0.0462],"file":"archer-cloth.webp","src":[723,481,94,76],"kind":"cloth"}]],
"archer-4":[[{"rect":[129.0,246.0,86.0,161.0],"pivot":[0.81525,0.04003],"file":"archer-cloth.webp","src":[282,349,64,121],"kind":"cloth"}],[{"rect":[113.0,221.0,105.0,183.0],"pivot":[0.85397,0.03582],"file":"archer-cloth.webp","src":[563,196,79,137],"kind":"cloth"}],[{"rect":[94.0,225.0,117.0,172.0],"pivot":[0.868,0.03553],"file":"archer-cloth.webp","src":[841,196,88,129],"kind":"cloth"}],[{"rect":[111.0,246.0,103.0,164.0],"pivot":[0.85545,0.0393],"file":"archer-cloth.webp","src":[104,349,77,123],"kind":"cloth"}],[{"rect":[89.33,246.67,122.67,146.67],"pivot":[0.86594,0.03939],"file":"archer-cloth.webp","src":[383,481,69,82],"kind":"cloth"}],[{"rect":[88.0,246.67,126.67,136.0],"pivot":[0.84912,0.04248],"file":"archer-cloth.webp","src":[648,481,71,76],"kind":"cloth"}]],
"archer-5":[[{"rect":[75.0,193.0,124.0,253.0],"pivot":[0.8862,0.02415],"file":"archer-cloth.webp","src":[2,2,93,190],"kind":"cloth"}],[{"rect":[60.0,186.0,154.0,250.0],"pivot":[0.90332,0.024],"file":"archer-cloth.webp","src":[99,2,116,188],"kind":"cloth"}],[{"rect":[50.0,189.0,158.0,249.0],"pivot":[0.89873,0.02633],"file":"archer-cloth.webp","src":[219,2,118,187],"kind":"cloth"}],[{"rect":[75.0,196.0,128.0,244.0],"pivot":[0.88628,0.02732],"file":"archer-cloth.webp","src":[341,2,96,183],"kind":"cloth"}],[{"rect":[25.33,193.33,174.67,228.0],"pivot":[0.91349,0.02534],"file":"archer-cloth.webp","src":[2,349,98,128],"kind":"cloth"}],[{"rect":[34.67,193.33,165.33,217.33],"pivot":[0.9086,0.02658],"file":"archer-cloth.webp","src":[185,349,93,122],"kind":"cloth"}]],
"archer-event":[[{"rect":[105.0,218.0,124.0,195.0],"pivot":[0.87366,0.03077],"file":"archer-cloth.webp","src":[367,196,93,146],"kind":"cloth"}],[{"rect":[100.0,214.0,137.0,206.0],"pivot":[0.87916,0.03128],"file":"archer-cloth.webp","src":[732,2,103,154],"kind":"cloth"}],[{"rect":[99.0,211.0,138.0,200.0],"pivot":[0.88003,0.02944],"file":"archer-cloth.webp","src":[839,2,104,150],"kind":"cloth"}],[{"rect":[103.0,232.0,127.0,190.0],"pivot":[0.86877,0.03275],"file":"archer-cloth.webp","src":[464,196,95,142],"kind":"cloth"}],[{"rect":[62.67,217.33,166.67,180.0],"pivot":[0.904,0.03704],"file":"archer-cloth.webp","src":[87,481,94,101],"kind":"cloth"}],[{"rect":[70.67,217.33,160.0,173.33],"pivot":[0.89167,0.03846],"file":"archer-cloth.webp","src":[185,481,90,98],"kind":"cloth"}]],
"archer-season2":[[{"rect":[99.0,275.0,120.0,141.0],"pivot":[0.86389,0.04177],"file":"archer-cloth.webp","src":[926,349,90,106],"kind":"cloth"}],[{"rect":[27.0,239.0,223.0,153.0],"pivot":[0.9153,0.04139],"file":"archer-cloth.webp","src":[472,349,167,115],"kind":"cloth"}],[{"rect":[8.0,236.0,248.0,150.0],"pivot":[0.91398,0.03852],"file":"archer-cloth.webp","src":[643,349,186,112],"kind":"cloth"}],[{"rect":[65.0,271.0,158.0,159.0],"pivot":[0.89381,0.03983],"file":"archer-cloth.webp","src":[350,349,118,119],"kind":"cloth"}],[{"rect":[54.67,270.67,165.33,146.67],"pivot":[0.89516,0.04545],"file":"archer-cloth.webp","src":[456,481,93,82],"kind":"cloth"}],[{"rect":[58.67,268.0,161.33,144.0],"pivot":[0.89256,0.04012],"file":"archer-cloth.webp","src":[553,481,91,81],"kind":"cloth"}]]
};

;
/* ./hair-volume.js */
'use strict';
const HAIR_VOLUME={
"archer-0":{"rig":[[2,2,74,63,54,3],[2,68,70,59,476,5],[2,130,70,59,749,4],[2,192,73,59,256,3]],"walk":[[2,254,56,47,159,43],[2,304,56,47,543,43]],"still":[[2,356,147,161,140,57]],"strip":[[2,520,147,161,140,57],[2,684,138,152,659,63],[2,839,138,152,1169,64],[2,994,140,155,1677,58]]},
"archer-1":{"rig":[[2,2,70,58,61,4],[2,63,70,59,731,4],[2,125,70,59,493,4],[2,187,70,59,262,4]],"walk":[[2,249,52,43,167,38],[2,295,52,43,551,38]],"still":[[2,343,138,152,155,50]],"strip":[[2,498,138,152,155,50],[2,653,138,152,666,58],[2,808,138,152,1175,57],[2,963,138,152,1685,54]]},
"archer-2":{"rig":[[2,2,55,41,128,21],[2,46,56,42,132,446],[2,91,56,41,658,23],[2,135,56,41,385,21]],"walk":[[2,179,41,31,175,60],[2,213,41,31,559,60]],"still":[[2,249,54,40,233,81]],"strip":[[2,292,54,40,233,81],[2,335,55,40,737,87],[2,378,55,40,1240,84],[2,421,54,40,1761,81]]},
"archer-3":{"rig":[[2,2,66,55,413,2],[2,60,66,55,131,437],[2,118,66,54,700,3],[2,175,66,53,130,3]],"walk":[[2,231,49,41,170,40],[2,275,49,41,554,40]],"still":[[2,321,129,142,163,53]],"strip":[[2,466,129,142,163,53],[2,611,129,142,660,69],[2,756,129,142,1168,67],[2,901,126,140,1703,50]]},
"archer-4":{"rig":[[2,2,63,53,88,2],[2,58,60,49,575,3],[2,110,60,49,116,423],[2,162,60,49,332,4]],"walk":[[2,214,48,40,161,49],[2,257,48,40,545,49]],"still":[[2,302,123,137,155,65]],"strip":[[2,442,123,137,155,65],[2,582,118,129,664,67],[2,714,118,129,1174,68],[2,846,118,129,1693,67]]},
"archer-5":{"rig":[[2,2,66,54,139,5],[2,59,70,58,150,423],[2,120,66,55,738,6],[2,178,66,55,429,5]],"walk":[[2,236,49,40,159,52],[2,279,49,40,543,52]],"still":[[2,324,129,142,149,69]],"strip":[[2,469,129,142,149,69],[2,614,136,149,653,76],[2,766,129,142,1165,76],[2,911,129,142,1685,70]]},
"archer-event":{"rig":[[2,2,69,57,685,4],[2,62,67,55,118,437],[2,120,69,57,118,6],[2,180,71,58,417,5]],"walk":[[2,241,51,43,166,43],[2,287,51,43,550,43]],"still":[[2,335,127,140,164,69]],"strip":[[2,478,127,140,163,69],[2,621,126,140,669,70],[2,764,127,140,1180,74],[2,907,129,142,1686,68]]},
"archer-season2":{"rig":[[2,2,66,55,107,5],[2,60,66,55,692,6],[2,118,66,55,193,517],[2,176,66,54,642,516]],"walk":[[2,233,49,41,155,36],[2,277,49,41,539,36]],"still":[[2,323,129,142,143,48]],"strip":[[2,468,129,142,143,48],[2,613,129,142,656,64],[2,758,129,142,1162,65],[2,903,126,140,1670,40]]},
"mage-0":{"rig":[[2,2,87,61,47,3],[2,66,79,61,502,4],[2,130,87,62,796,6],[2,195,88,59,246,5]],"walk":[[2,257,63,46,152,27],[2,306,63,46,536,27]],"still":[[2,357,107,75,181,36]],"strip":[[2,435,107,75,181,36],[2,513,99,77,699,46],[2,593,107,76,1240,60],[2,672,107,73,1717,42]]},
"mage-1":{"rig":[[2,2,72,47,70,39],[2,52,66,50,520,34],[2,105,71,47,849,42],[2,155,72,47,287,36]],"walk":[[2,205,54,35,154,55],[2,243,54,35,538,55]],"still":[[2,283,94,66,183,74]],"strip":[[2,352,94,66,183,74],[2,421,86,70,664,80],[2,494,98,68,1218,107],[2,565,93,66,1716,76]]},
"mage-2":{"rig":[[2,2,83,63,162,5],[2,68,73,63,418,6],[2,134,83,63,153,427],[2,200,83,63,652,3]],"walk":[[2,266,61,47,154,50],[2,316,61,47,538,50]],"still":[[2,368,105,74,183,66]],"strip":[[2,445,105,74,183,66],[2,522,97,74,717,70],[2,599,105,74,1236,101],[2,676,105,74,1710,69]]},
"mage-3":{"rig":[[2,2,63,45,853,51],[2,50,62,46,155,505],[2,99,62,49,528,41],[2,151,63,46,155,49]],"walk":[[2,200,47,34,163,63],[2,237,47,34,547,63]],"still":[[2,276,83,74,197,84]],"strip":[[2,353,83,74,197,84],[2,430,82,74,717,88],[2,507,82,77,1228,74],[2,587,83,74,1737,80]]},
"mage-4":{"rig":[[2,2,48,34,445,54],[2,39,43,36,146,48],[2,78,49,32,217,507],[2,113,49,35,743,56]],"walk":[[2,151,36,23,157,66],[2,177,36,23,541,66]],"still":[[2,205,73,55,184,87]],"strip":[[2,263,73,55,184,87],[2,321,66,59,699,79],[2,383,72,51,1257,103],[2,437,75,47,1717,89]]},
"mage-5":{"rig":[[2,2,54,37,432,52],[2,42,55,38,154,48],[2,83,53,36,305,500],[2,122,54,35,755,53]],"walk":[[2,160,41,26,154,64],[2,189,40,27,539,64]],"still":[[2,221,78,58,180,84]],"strip":[[2,282,79,59,180,84],[2,344,80,60,695,79],[2,407,79,63,1255,89],[2,473,78,58,1713,86]]},
"mage-event":{"rig":[[2,2,76,61,99,4],[2,66,76,61,420,3],[2,130,76,61,191,451],[2,194,76,61,810,5]],"walk":[[2,258,57,46,154,29],[2,307,57,46,538,29]],"still":[[2,358,96,73,185,38]],"strip":[[2,434,96,73,185,38],[2,510,96,73,697,37],[2,586,96,74,1239,45],[2,663,96,74,1717,41]]},
"mage-season2":{"rig":[[2,2,84,59,65,4],[2,64,82,62,629,4],[2,129,83,59,197,515],[2,191,83,58,637,515]],"walk":[[2,252,61,45,160,31],[2,300,61,45,544,31]],"still":[[2,350,101,72,194,42]],"strip":[[2,425,101,72,194,42],[2,500,101,75,720,47],[2,578,101,68,1242,66],[2,649,101,70,1756,56]]},
"paladin-0":{"rig":[[2,2,84,59,391,3],[2,64,84,60,135,41],[2,127,84,60,143,453],[2,190,84,60,721,3]],"walk":[[2,253,60,43,156,36],[2,299,60,43,540,36]],"still":[[2,347,83,63,203,44]],"strip":[[2,413,83,63,203,44],[2,479,83,63,747,74],[2,545,83,63,1191,52],[2,611,83,63,1751,48]]},
"paladin-1":{"rig":[[2,2,84,60,719,4],[2,65,84,60,441,28],[2,128,84,60,153,453],[2,191,84,60,132,4]],"walk":[[2,254,62,46,156,31],[2,303,62,46,540,31]],"still":[[2,354,83,63,207,40]],"strip":[[2,420,83,63,207,40],[2,486,83,63,733,62],[2,552,83,63,1187,56],[2,618,83,63,1749,36]]},
"paladin-2":{"rig":[[2,2,80,58,398,3],[2,63,80,58,124,19],[2,124,75,55,171,439],[2,182,75,55,701,3]],"walk":[[2,240,56,40,157,44],[2,283,56,40,541,44]],"still":[[2,328,79,60,203,54]],"strip":[[2,391,79,60,203,54],[2,454,79,60,721,66],[2,517,75,57,1243,68],[2,577,74,57,1735,62]]},
"paladin-3":{"rig":[[2,2,75,55,811,3],[2,60,75,55,165,21],[2,118,75,55,194,434],[2,176,80,58,502,3]],"walk":[[2,237,53,38,158,49],[2,278,53,38,542,49]],"still":[[2,321,74,57,207,60]],"strip":[[2,381,74,57,207,60],[2,441,75,57,727,72],[2,501,74,57,1249,64],[2,561,79,60,1751,60]]},
"paladin-4":{"rig":[[2,2,72,51,106,3],[2,56,72,51,751,3],[2,110,72,51,214,400],[2,164,72,51,410,3]],"walk":[[2,218,49,36,166,69],[2,257,49,36,550,69]],"still":[[2,298,72,53,210,87]],"strip":[[2,354,72,53,210,87],[2,410,72,53,734,95],[2,466,71,53,1279,99],[2,522,72,53,1754,93]]},
"paladin-5":{"rig":[[2,2,67,48,392,3],[2,53,62,46,704,3],[2,102,72,51,182,416],[2,156,67,48,131,3]],"walk":[[2,207,47,33,163,56],[2,243,47,33,547,56]],"still":[[2,281,67,50,214,73]],"strip":[[2,334,67,50,214,73],[2,387,62,47,748,83],[2,437,72,53,1256,83],[2,493,67,50,1756,71]]},
"paladin-event":{"rig":[[2,2,101,84,719,2],[2,89,101,91,161,443],[2,183,125,81,415,2],[2,267,101,85,117,2]],"walk":[[2,355,76,68,168,28],[2,426,76,68,552,28]],"still":[[2,497,101,90,223,57]],"strip":[[2,590,101,90,223,57],[2,683,101,90,732,64],[2,776,101,90,1209,54],[2,869,101,90,1760,49]],"restore":true},
"paladin-season2":{"rig":[[2,2,84,60,98,2],[2,65,84,60,698,7],[2,128,80,58,221,513],[2,189,84,60,675,513]],"walk":[[2,252,60,43,159,36],[2,298,60,43,543,36]],"still":[[2,346,83,63,207,44]],"strip":[[2,412,83,63,207,44],[2,478,83,63,733,62],[2,544,79,60,1263,60],[2,607,83,63,1733,48]]},
"shadow-0":{"rig":[[2,2,95,64,601,28],[2,69,95,64,224,28],[2,136,95,64,259,477],[2,203,95,64,665,477]],"walk":[[2,270,70,48,251,49],[2,321,70,48,635,49]],"still":[[2,374,203,71,225,63]],"strip":[[2,448,203,71,225,63],[2,522,203,71,731,58],[2,596,203,71,1209,71],[2,670,203,71,1655,102]]},
"shadow-1":{"rig":[[2,2,74,56,635,58],[2,61,75,51,276,62],[2,115,77,52,275,516],[2,170,77,54,694,509]],"walk":[[2,227,56,42,258,68],[2,272,56,41,642,68]],"still":[[2,318,196,93,222,54]],"strip":[[2,414,196,93,222,54],[2,510,198,88,733,57],[2,601,198,88,1214,74],[2,692,198,91,1677,104]]},
"shadow-2":{"rig":[[2,2,95,64,626,25],[2,69,95,64,267,23],[2,136,95,64,261,474],[2,203,95,64,687,469]],"walk":[[2,270,70,48,250,46],[2,321,70,48,634,46]],"still":[[2,374,203,71,224,59]],"strip":[[2,448,203,71,224,59],[2,522,202,71,739,53],[2,596,202,71,1207,66],[2,670,204,71,1682,99]]},
"shadow-3":{"rig":[[2,2,80,55,219,21],[2,60,80,55,590,424],[2,118,80,55,602,32],[2,176,80,55,230,427]],"walk":[[2,234,61,40,234,79],[2,277,61,40,618,79]],"still":[[2,322,178,66,215,101]],"strip":[[2,391,178,66,215,101],[2,460,178,66,740,110],[2,529,178,66,1224,113],[2,598,178,66,1762,108]]},
"shadow-4":{"rig":[[2,2,58,69,582,31],[2,74,59,58,224,35],[2,135,60,54,264,467],[2,192,53,64,671,471]],"walk":[[2,259,33,51,231,62],[2,313,32,52,615,61]],"still":[[2,370,164,79,200,71]],"strip":[[2,452,164,79,200,71],[2,534,164,71,709,71],[2,608,167,71,1200,83],[2,682,160,76,1731,88]]},
"shadow-5":{"rig":[[2,2,85,67,588,29],[2,72,84,67,220,32],[2,142,86,67,258,465],[2,212,85,69,663,468]],"walk":[[2,284,59,49,226,57],[2,336,62,51,607,57]],"still":[[2,392,185,78,195,64]],"strip":[[2,473,185,78,195,64],[2,554,184,81,708,64],[2,638,185,77,1200,76],[2,718,185,80,1726,87]]},
"shadow-event":{"rig":[[2,2,77,54,659,19],[2,59,77,54,266,19],[2,116,77,54,276,441],[2,173,77,54,727,444]],"walk":[[2,230,58,41,241,56],[2,274,58,41,625,56]],"still":[[2,320,175,66,224,71]],"strip":[[2,389,175,66,224,71],[2,458,175,66,732,69],[2,527,175,66,1228,69],[2,596,175,66,1774,83]]},
"shadow-season2":{"rig":[[2,2,96,62,265,0],[2,67,96,58,798,0],[2,128,96,54,264,512],[2,185,96,50,727,512]],"walk":[[2,238,72,49,243,46],[2,290,72,49,627,46]],"still":[[2,344,215,77,186,31]],"strip":[[2,424,215,77,205,58],[2,504,214,77,728,59],[2,584,214,77,1190,60],[2,664,215,77,1707,80]]},
"warrior-0":{"rig":[[2,2,73,55,724,562],[2,60,74,59,232,1089],[2,122,72,56,204,108],[2,181,73,57,239,592]],"walk":[[2,241,55,41,165,43],[2,285,55,41,549,43]],"still":[[2,331,73,55,221,58]],"strip":[[2,389,73,55,221,58],[2,447,71,58,745,77],[2,508,72,56,1225,110],[2,567,72,57,1783,79]]},
"warrior-1":{"rig":[[2,2,72,55,80,6],[2,60,70,52,325,6],[2,115,74,51,151,430],[2,169,75,57,599,7]],"walk":[[2,229,55,42,163,50],[2,274,55,41,547,50]],"still":[[2,320,67,53,222,68]],"strip":[[2,376,67,53,222,68],[2,432,66,52,748,94],[2,487,70,49,1221,112],[2,539,70,56,1785,103]]},
"warrior-2":{"rig":[[2,2,68,57,113,7],[2,62,68,53,411,7],[2,118,74,52,767,7],[2,173,74,53,208,449]],"walk":[[2,229,52,43,168,38],[2,275,52,43,552,38]],"still":[[2,323,64,51,227,51]],"strip":[[2,377,64,51,227,51],[2,431,64,50,754,74],[2,484,70,49,1289,83],[2,536,70,50,1778,129]]},
"warrior-3":{"rig":[[2,2,75,56,152,6],[2,61,72,54,480,7],[2,118,72,50,852,6],[2,171,72,50,208,453]],"walk":[[2,224,55,41,163,35],[2,268,55,41,547,35]],"still":[[2,314,60,53,230,47]],"strip":[[2,370,60,53,230,47],[2,426,56,53,758,69],[2,482,60,47,1301,85],[2,532,62,48,1787,128]]},
"warrior-4":{"rig":[[2,2,66,57,99,6],[2,62,64,50,390,6],[2,115,70,56,696,7],[2,174,70,58,201,456]],"walk":[[2,235,50,42,166,31],[2,280,50,42,550,31]],"still":[[2,327,57,52,225,41]],"strip":[[2,382,57,52,225,41],[2,437,59,49,758,65],[2,489,63,55,1281,78],[2,547,62,55,1775,128]]},
"warrior-5":{"rig":[[2,2,63,52,143,7],[2,57,62,50,487,7],[2,110,65,51,833,7],[2,164,66,50,227,455]],"walk":[[2,217,48,43,166,33],[2,263,48,43,550,33]],"still":[[2,311,58,47,225,45]],"strip":[[2,361,58,47,225,45],[2,411,56,46,760,73],[2,460,61,49,1261,88],[2,512,61,46,1776,133]]},
"warrior-event":{"rig":[[2,2,64,48,142,6],[2,53,65,49,419,6],[2,105,65,49,174,437],[2,157,64,49,746,6]],"walk":[[2,209,48,35,189,42],[2,247,48,36,573,42]],"still":[[2,288,60,46,252,85]],"strip":[[2,337,60,46,252,85],[2,386,61,45,747,85],[2,434,61,47,1200,91],[2,484,59,46,1783,86]]},
"warrior-season2":{"rig":[[2,2,65,55,117,6],[2,60,64,55,683,19],[2,118,69,57,238,517],[2,178,72,53,722,517],[2,234,66,55,125,1136],[2,292,69,56,654,1137],[2,351,78,64,208,1683],[2,418,70,57,755,1666],[2,478,69,53,248,2169],[2,534,73,55,766,2170],[2,592,65,54,181,2684],[2,649,66,55,648,2684]],"walk":[[2,707,49,41,156,37],[2,751,49,41,540,37]],"still":[[2,797,65,55,208,49]],"strip":[[2,855,65,55,208,49],[2,913,64,54,740,62],[2,970,69,57,1282,61],[2,1030,71,51,1766,76]]}
};
// Hair shading is baked into the decoded body or walk atlas once. The WebGL
// camera, its Canvas fallback, and outfit stills all receive that same texture.
const hairVolume = (() => {
 const patches = new Map(), textures = new WeakMap();
 let revision = 0;
 function patch(key) {
  if (!HAIR_VOLUME[key]) return null;
  const cached = patches.get(key);
  if (cached) {
   patches.delete(key);
   patches.set(key,cached);
   return cached;
  }
  const image = new Image(), item = {image,ready:false};
  item.loaded = new Promise(resolve => {
   image.onload = () => {item.ready = true; revision++; resolve(true)};
   image.onerror = () => resolve(false);
  });
  patches.set(key,item);
  // Decoded actor atlases own their finished pixels. Keep just recent small UV sheets.
  if (patches.size > 16) patches.delete(patches.keys().next().value);
  image.decoding = 'async';
  image.src = './assets/hair-volume/' + key + '.webp' + (key.startsWith('archer-') ? '?v=142' : '');
  return item;
 }
 function ready(key) {
  return patch(key)?.loaded || Promise.resolve(false);
 }
 function texture(image,key,kind) {
  if (!image) return image;
  const cached = textures.get(image);
  if (cached) return cached;
  const patchesForKey = HAIR_VOLUME[key]?.[kind];
  if (!patchesForKey || !image.naturalWidth || !image.naturalHeight) return image;
  const item = patch(key);
  if (!item?.ready) return image;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.naturalWidth = image.naturalWidth;
  canvas.height = canvas.naturalHeight = image.naturalHeight;
  const brush = canvas.getContext('2d');
  if (!brush || typeof brush.drawImage !== 'function') return image;
  brush.drawImage(image,0,0);
  const restore = HAIR_VOLUME[key].restore;
  brush.globalCompositeOperation = restore ? 'source-over' : 'source-atop';
  for (const [sx,sy,w,h,dx,dy] of patchesForKey) {
   if (restore) brush.clearRect(dx,dy,w,h);
   brush.drawImage(item.image,sx,sy,w,h,dx,dy,w,h);
  }
  brush.globalCompositeOperation = 'source-over';
  textures.set(image,canvas);
  return canvas;
 }
 // CSS wardrobe portraits and ranking <img> elements use separate full illustrations.
 // Decode and composite those once as well. PNG retains the original face and alpha.
 const staticAssets = new Map();
 function resolveStill(url,key,kind) {
  let result = staticAssets.get(url);
  if (result) return result;
  const original = new Image();
  original.decoding = 'async';
  const decoded = new Promise(resolve => {
   original.onload = () => resolve(true);
   original.onerror = () => resolve(false);
  });
  original.src = url;
  result = Promise.all([decoded,ready(key)]).then(([body,ink]) => {
   if (!body || !ink) return url;
   const canvas = texture(original,key,kind);
   if (!canvas.toBlob) return url;
   return new Promise(resolve => canvas.toBlob(blob => resolve(blob ? URL.createObjectURL(blob) : url),'image/png'));
  }).catch(() => url);
  staticAssets.set(url,result);
  return result;
 }
 function background(url,key,kind) {
  if (!HAIR_VOLUME[key]?.[kind]?.length || !document.documentElement?.style?.setProperty) return "url('" + url + "')";
  const property = '--hair-' + kind + '-' + key;
  const absolute = new URL(url,document.baseURI || location.href).href;
  if (!staticAssets.has(absolute)) {
   resolveStill(absolute,key,kind).then(src => {
    if (src !== absolute) document.documentElement.style.setProperty(property,"url('" + src + "')");
   });
  } else {
   const style = document.documentElement.style;
   if (!style.getPropertyValue?.(property)) staticAssets.get(absolute).then(src => {
    if (src !== absolute) style.setProperty(property,"url('" + src + "')");
   });
  }
  return "var(" + property + ",url('" + url + "'))";
 }
 // Standalone display images in ranking podiums and raid recruitment cards retain
 // their own authored bounds and registration, including each figure's foot contact.
 document.addEventListener('load',event => {
  const image=event.target;
  if (image.tagName !== 'IMG' || !image.currentSrc) return;
  const absolute = image.currentSrc;
  const url = new URL(absolute,document.baseURI);
  if (url.origin !== location.origin) return;
  const regular = /\/assets\/proportions\/((?:archer|mage|shadow|paladin|warrior)-(?:[0-5]|event))\.webp$/.exec(url.pathname);
  const season = /\/assets\/season-outfits\/(archer|mage|shadow|paladin|warrior)-display\.webp$/.exec(url.pathname);
  const key = regular?.[1] || (season && season[1]+'-season2');
  if (!key || !HAIR_VOLUME[key]?.still?.length) return;
  resolveStill(absolute,key,'still').then(src => {
   if (src !== absolute && image.currentSrc === absolute) image.src = src;
  });
 },true);
 return {ready,texture,background,version:()=>revision};
})();

;
/* ./secondary-motion.js */
'use strict';
// Pose art uses a 512-unit painting. Attachments are registered in that space, before the
// actor transform. Both the Unity sprite camera and its Canvas fallback consume these draws.
const secondaryMotion=(()=>{
 const step=1/120, actors=new WeakMap(), pictures=new Map(), shapes=new Map();
 const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
 let revision=0,shapePixels=0;
 function picture(file){
  if(!pictures.has(file)){
   const image=new Image();image.decoding='async';
   const ready=new Promise(resolve=>{
    image.onload=()=>{revision++;resolve(true)};
    image.onerror=()=>resolve(false);
   });
   pictures.set(file,{image,ready});image.src='./assets/secondary-motion/'+file;
  }
  return pictures.get(file);
 }
 function ready(key){
  const files=new Set();
  for(const layers of SECONDARY_ART[key]||[])for(const piece of layers||[])files.add(piece.file);
  const loads=Array.from(files,f=>picture(f).ready);
  if(typeof hairVolume!=='undefined')loads.push(hairVolume.ready(key));
  return Promise.all(loads);
 }
 // Two coupled angular masses. The second joint follows the first with its own
 // inertia. The installed player can run this same integrator through its Web bridge.
 function integrate(s,steps){
  const dt=step;
  for(let i=0;i<steps;i++){
   const rootForce=s[6]*s[6]*(s[4]*s[5]-s[0])-s[7]*s[1];
   s[1]+=rootForce*dt;s[0]+=s[1]*dt;
   const endTarget=s[4]*(1-s[5])+s[0]*.35-s[1]*.028;
   s[3]+=(s[8]*s[8]*(endTarget-s[2])-s[9]*s[3])*dt;s[2]+=s[3]*dt;
  }
 }
 function chain(kind,job){
  const s=new Float32Array(10);
  const config=kind==='cloth'?(job==='paladin'||job==='warrior'?[.21,14,13,9,7.8]:[.23,17,15,11,9.2]):
   job==='paladin'?[.40,30,26,24,21]:job==='archer'?[.34,22,19,15,12]:[.36,25,20,17,13];
  s.set(config,5);return s;
 }
 function tick(owner,key,pose,action,input){
  const art=SECONDARY_ART[key],parts=art?.[pose];
  if(!art)return null;
  if(!owner||!input||!input.animate){if(owner)actors.delete(owner);return {parts,cloth:null,hair:null}}
  const {now}=input,job=key.split('-')[0];
  const lean=(input.lean||0)+(action?.lean||0)+(action?.twilight?.frame.secondary.find(p=>p.kind==='hair')?.angle||0);
  const x=input.x+(action?.x||0)+lean*2.45,y=input.y+(action?.y||0);
  let a=actors.get(owner);
  if(!a||a.key!==key||now-a.at>180||now<a.at){
   a={key,at:now,x,y,vx:0,vy:0,credit:0,hair:chain('hair',job),cloth:chain('cloth',job)};
   actors.set(owner,a);
  }
  const elapsed=(now-a.at)/1000;
  if(elapsed>=.002){
   const vx=clamp((x-a.x)/elapsed+(input.air||0),-1550,1550);
   const vy=clamp((y-a.y)/elapsed,-900,900);
   const filter=1-Math.exp(-elapsed*22);
   a.vx+=(vx-a.vx)*filter;a.vy+=(vy-a.vy)*filter;
   const force=clamp(a.vx/800-.18*a.vy/700,-1,1);
   a.credit+=Math.min(elapsed,.1);
   const steps=Math.min(12,Math.floor(a.credit/step));a.credit-=steps*step;
   const solver=window.NebulaFabricStep||integrate;
   a.hair[4]=force*(job==='paladin'?.38:.89);
   a.cloth[4]=force*(job==='paladin'||job==='warrior'?.50:.66);
   if(steps){solver(a.hair,steps);solver(a.cloth,steps)}
   a.at=now;a.x=x;a.y=y;
  }
  if(Math.abs(a.vx)>18||Math.abs(a.vy)>25)a.activeUntil=now+1050;
  return {parts,hair:a.hair,cloth:a.cloth};
 }
 // Bake a small fan of continuous bends from the painted material. Each scanline
 // retains its cross-section as the centre line curves. The root stays pinned;
 // folds, trim and silhouette bend together. Unity caches the fan as one texture.
 const bends=13,mid=6,bendMax=.74;
 const pending=new Map();
 let scheduled=false;
 function queueBake(){
  if(scheduled||!pending.size)return;
  scheduled=true;
  const slice=()=>{
   scheduled=false;
   const end=performance.now()+2;
   // Bound all skin preparation together, including the five fighters in a raid.
   while(pending.size&&performance.now()<end){
    const [key,job]=pending.entries().next().value;
    if(performance.now()-job.used>700){pending.delete(key);continue}
    if(job.drawNext()){
     pending.delete(key);const f=job.result;
     shapes.set(key,f);shapePixels+=f.pixels;revision++;
     while(shapePixels>4500000&&shapes.size>1){
      const oldest=shapes.keys().next().value;shapePixels-=shapes.get(oldest).pixels;shapes.delete(oldest);
     }
    }
   }
   queueBake();
  };
  if(typeof requestIdleCallback==='function')requestIdleCallback(slice,{timeout:80});
  else setTimeout(slice,16);
 }
 function fan(piece,image){
  const cacheKey=piece.kind==='hair'?piece.file:piece;
  if(shapes.has(cacheKey)){
   const cached=shapes.get(cacheKey);shapes.delete(cacheKey);shapes.set(cacheKey,cached);return cached;
  }
  const queued=pending.get(cacheKey);
  if(queued){queued.used=performance.now();return null}
  const [sx,sy,sw,sh]=piece.src||[0,0,image.naturalWidth,image.naturalHeight];
  const scale=Math.min(1,160/Math.max(sw,sh)),w=Math.max(1,Math.round(sw*scale)),h=Math.max(1,Math.round(sh*scale));
  const [px,py]=piece.pivot;
  const horizontal=piece.tip?Math.abs((piece.tip[0]-px)*w)>Math.abs((piece.tip[1]-py)*h):w*Math.max(px,1-px)>h*Math.max(py,1-py);
  const length=horizontal?w:h,origin=horizontal?px*w:py*h;
  const sign=piece.tip?Math.sign(horizontal?piece.tip[0]-px:piece.tip[1]-py)||1:(origin>length*.5?-1:1);
  const reach=Math.max(1,sign===1?length-origin:origin);
  const pad=Math.ceil(reach*.40)+3,cw=w+2*pad,ch=h+2*pad;
  const canvas=document.createElement('canvas');canvas.width=cw*4;canvas.height=ch*4;
  // The existing Unity texture bridge accepts either DOM image source; it reads these dimensions.
  canvas.naturalWidth=canvas.width;canvas.naturalHeight=canvas.height;
  const brush=canvas.getContext('2d');if(!brush)return null;
  const result={canvas,pad,cw,ch,w,h,pixels:canvas.width*canvas.height};
  let frame=0,line=0;
  function drawNext(){
   const angle=(frame-mid)*bendMax/mid,ox=(frame%4)*cw+pad,oy=Math.floor(frame/4)*ch+pad;
   if(frame===mid){brush.drawImage(image,sx,sy,sw,sh,ox,oy,w,h);frame++;return false}
   const until=Math.min(length,line+12);
   for(let j=line;j<until;j++){
    const u=clamp(sign*(j+.5-origin)/reach,0,1);
    const across=sign*reach*(1-Math.cos(angle*u))/angle;
    const along=sign*reach*(Math.sin(angle*u)/angle-u);
    const nextU=clamp(sign*(j+1.5-origin)/reach,0,1);
    const segment=1+sign*reach*((Math.sin(angle*nextU)-Math.sin(angle*u))/angle-(nextU-u));
    if(horizontal)brush.drawImage(image,sx+j*sw/w,sy,sw/w,sh,ox+j+along,oy+across,Math.max(.4,segment)+.22,h);
    else brush.drawImage(image,sx,sy+j*sh/h,sw,sh/h,ox-across,oy+j+along,w,Math.max(.4,segment)+.22);
   }
   line=until;
   if(line===length){line=0;frame++}
   return frame===bends;
  }
  pending.set(cacheKey,{result,drawNext,used:performance.now()});queueBake();return null;
 }
 function paint(ctx,state,front,anchors=null){
  for(const p of state?.parts||[]){
   if(Boolean(p.front)!==front)continue;
   const im=picture(p.file).image;if(!im.complete||!im.naturalWidth)continue;
   const dynamics=state[p.kind],root=dynamics?clamp(dynamics[0],-.38,.38):0,tip=dynamics?clamp(dynamics[2],-bendMax,bendMax):0;
   const [x,y,w,h]=p.rect,[u,v]=p.pivot;
   const frame=mid+Math.round(tip*mid/bendMax);
   const attached=anchors?.find(a=>a.kind===p.kind);
   const pin=attached?.anchor||[x+w*u,y+h*v];
   ctx.save();ctx.translate(...pin);ctx.rotate(root+(attached?.angle||0)*Math.PI/180);
   if(frame!==mid){
    const f=fan(p,im);
    if(f){
     const dx=w/f.w,dy=h/f.h;
     ctx.drawImage(f.canvas,frame%4*f.cw,Math.floor(frame/4)*f.ch,f.cw,f.ch,-w*u-f.pad*dx,-h*v-f.pad*dy,f.cw*dx,f.ch*dy);
     ctx.restore();continue;
    }
   }
   const src=p.src||[0,0,im.naturalWidth,im.naturalHeight];
   ctx.drawImage(im,...src,-w*u,-h*v,w,h);ctx.restore();
  }
 }
 function stamp(key,owner,now,moving,animate){
  if(!SECONDARY_ART[key])return '';
  const active=moving||now<(actors.get(owner)?.activeUntil||0);
  return revision+'|'+(typeof hairVolume==='undefined'?0:hairVolume.version())+'|'+(animate&&active?now:0);
 }
 return {tick,paint,stamp,ready};
})();

;
/* ./assets/twilight-rain/poses.js */
'use strict';
const TWILIGHT_RAIN_POSES={"times":[0,8,17,25,33,42,50,58,67,75,83,92,100,108,112,127,146,166,182,211,253,307,375,453,533,592,650],"skins":{"archer-0":{"lower":[1615,579,165,154,175,327],"frames":[{"basePose":0,"hand":[352.0,230.0],"drawHand":[212.0,302.0],"nock":[212.0,302.0],"angle":1.77,"aim":-27.22,"pull":0,"secondary":[{"kind":"hair","anchor":[222.18,110.6],"angle":0}],"body":[1502,301,200,271,161,56],"palm":[75,853,18,24,343,218]},{"basePose":0,"hand":[353.66,227.63],"drawHand":[214.05,296.08],"nock":[214.05,296.08],"angle":1.73,"aim":-26.12,"pull":0.0148,"secondary":[{"kind":"hair","anchor":[221.53,111.02],"angle":-0.95}],"body":[199,301,203,272,160,55],"palm":[2,853,19,25,344,215]},{"basePose":0,"hand":[356.95,222.07],"drawHand":[218.09,284.19],"nock":[218.09,284.19],"angle":1.37,"aim":-24.1,"pull":0.05,"secondary":[{"kind":"hair","anchor":[220.23,111.78],"angle":-2.61}],"body":[406,301,208,272,159,55],"palm":[1784,579,20,26,347,209]},{"basePose":0,"hand":[361.55,212.02],"drawHand":[223.85,266.69],"nock":[223.85,266.69],"angle":0.18,"aim":-21.65,"pull":0.1012,"secondary":[{"kind":"hair","anchor":[218.45,112.79],"angle":-4.73}],"body":[618,301,215,272,157,55],"palm":[1808,579,21,26,351,199]},{"basePose":0,"hand":[366.43,195.81],"drawHand":[230.67,244.76],"nock":[230.67,244.76],"angle":-2.66,"aim":-19.83,"pull":0.18,"secondary":[{"kind":"hair","anchor":[216.02,114.2],"angle":-7.54}],"body":[837,301,222,272,155,55],"palm":[1833,579,21,26,356,183]},{"basePose":1,"hand":[368.69,170.93],"drawHand":[236.86,221.07],"nock":[236.86,221.07],"angle":-11.62,"aim":-20.82,"pull":0.3338,"secondary":[{"kind":"hair","anchor":[214.36,114.73],"angle":-11.7}],"body":[1706,301,224,270,155,57],"palm":[1858,579,21,26,358,158]},{"basePose":1,"hand":[367.08,143.64],"drawHand":[242.13,199.27],"nock":[242.13,199.27],"angle":-18.77,"aim":-24.0,"pull":0.4849,"secondary":[{"kind":"hair","anchor":[210.95,116.85],"angle":-15.84}],"body":[2,579,228,270,150,57],"palm":[97,853,23,24,355,132]},{"basePose":1,"hand":[362.58,114.19],"drawHand":[247.26,176.66],"nock":[247.26,176.66],"angle":-27.09,"aim":-28.45,"pull":0.6234,"secondary":[{"kind":"hair","anchor":[208.03,119.18],"angle":-20.32}],"body":[476,579,228,269,146,58],"palm":[179,853,24,22,350,104]},{"basePose":1,"hand":[353.8,84.53],"drawHand":[251.06,156.56],"nock":[251.06,156.56],"angle":-36.69,"aim":-35.03,"pull":0.7551,"secondary":[{"kind":"hair","anchor":[205.31,121.28],"angle":-24.05}],"body":[1172,579,226,268,140,59],"palm":[410,853,25,21,341,75]},{"basePose":1,"hand":[343.88,62.2],"drawHand":[253.05,143.03],"nock":[253.05,143.03],"angle":-44.94,"aim":-41.66,"pull":0.8521,"secondary":[{"kind":"hair","anchor":[203.28,122.7],"angle":-26.36}],"body":[1718,2,213,275,143,52],"palm":[207,853,25,22,331,52]},{"basePose":1,"hand":[336.87,50.56],"drawHand":[253.64,136.67],"nock":[253.64,136.67],"angle":-49.81,"aim":-45.98,"pull":0.9199,"secondary":[{"kind":"hair","anchor":[202.07,123.63],"angle":-27.86}],"body":[1509,2,205,286,144,41],"palm":[439,853,25,21,324,41]},{"basePose":1,"hand":[331.55,43.17],"drawHand":[253.83,132.9],"nock":[253.83,132.9],"angle":-53.17,"aim":-49.11,"pull":0.9736,"secondary":[{"kind":"hair","anchor":[201.19,124.36],"angle":-28.95}],"body":[774,2,198,294,146,33],"palm":[236,853,25,22,319,33]},{"basePose":1,"hand":[330.24,42.12],"drawHand":[253.68,132.78],"nock":[253.68,132.78],"angle":-53.84,"aim":-49.82,"pull":0.9938,"secondary":[{"kind":"hair","anchor":[201.0,124.43],"angle":-29.0}],"body":[2,2,197,295,146,32],"palm":[265,853,25,22,318,32]},{"basePose":1,"hand":[329.9,41.89],"drawHand":[253.63,132.79],"nock":[253.63,132.79],"angle":-54.0,"aim":-50.0,"pull":1.0,"secondary":[{"kind":"hair","anchor":[200.94,124.44],"angle":-29.0}],"body":[203,2,196,295,146,32],"palm":[294,853,25,22,317,32]},{"basePose":1,"hand":[329.9,41.89],"drawHand":[253.63,132.79],"nock":[253.63,132.79],"angle":-54.0,"aim":-50.0,"pull":1,"secondary":[{"kind":"hair","anchor":[200.94,124.44],"angle":-29}],"body":[403,2,196,295,146,32],"palm":[323,853,25,22,317,32]},{"basePose":2,"hand":[311.28,43.66],"drawHand":[228.82,136.69],"nock":[228.82,136.69],"angle":-52.55,"aim":-48.45,"pull":0.31,"secondary":[{"kind":"hair","anchor":[200.8,125.87],"angle":-29}],"body":[976,2,173,293,151,34],"palm":[468,853,26,21,298,34]},{"basePose":2,"hand":[307.27,41.62],"drawHand":[213.15,140.02],"nock":[213.15,140.02],"angle":-50.53,"aim":-46.27,"pull":0,"secondary":[{"kind":"hair","anchor":[201.19,125.24],"angle":-27.26}],"body":[603,2,167,295,153,32],"palm":[498,853,26,21,294,32]},{"basePose":2,"hand":[313.17,44.67],"drawHand":[211.64,139.89],"nock":[211.64,139.89],"angle":-47.67,"aim":-43.16,"pull":0.025,"secondary":[{"kind":"hair","anchor":[202.13,124.45],"angle":-25.81}],"body":[1153,2,171,292,155,35],"palm":[528,853,26,21,300,35]},{"basePose":2,"hand":[319.74,48.53],"drawHand":[214.31,139.14],"nock":[214.31,139.14],"angle":-45.39,"aim":-40.68,"pull":0,"secondary":[{"kind":"hair","anchor":[202.92,123.85],"angle":-24.94}],"body":[1328,2,177,289,155,38],"palm":[352,853,25,22,307,38]},{"basePose":2,"hand":[335.85,63.44],"drawHand":[219.54,140.98],"nock":[219.54,140.98],"angle":-38.41,"aim":-33.69,"pull":0,"secondary":[{"kind":"hair","anchor":[205.09,122.36],"angle":-22.62}],"body":[2,301,193,274,155,53],"palm":[381,853,25,22,323,53]},{"basePose":2,"hand":[352.55,84.98],"drawHand":[226.7,144.35],"nock":[226.7,144.35],"angle":-29.87,"aim":-25.26,"pull":0,"secondary":[{"kind":"hair","anchor":[208.17,119.78],"angle":-17.98}],"body":[1402,579,209,268,155,59],"palm":[151,853,24,23,340,74]},{"basePose":2,"hand":[364.46,113.22],"drawHand":[234.2,155.33],"nock":[234.2,155.33],"angle":-20.98,"aim":-17.92,"pull":0,"secondary":[{"kind":"hair","anchor":[211.43,117.84],"angle":-14.5}],"body":[708,579,224,269,152,58],"palm":[124,853,23,24,353,102]},{"basePose":2,"hand":[370.59,146.83],"drawHand":[237.45,175.44],"nock":[237.45,175.44],"angle":-11.67,"aim":-12.13,"pull":0,"secondary":[{"kind":"hair","anchor":[215.39,115.97],"angle":-10.15}],"body":[936,579,232,269,149,58],"palm":[25,853,21,25,360,135]},{"basePose":1,"hand":[378.55,175.47],"drawHand":[245.0,201.48],"nock":[245.0,201.48],"angle":-7.25,"aim":-11.02,"pull":0,"secondary":[{"kind":"hair","anchor":[219.6,112.18],"angle":-6.38}],"body":[234,579,238,270,151,57],"palm":[50,853,21,25,368,163]},{"basePose":0,"hand":[366.73,204.69],"drawHand":[230.16,248.48],"nock":[230.16,248.48],"angle":0.05,"aim":-17.78,"pull":0,"secondary":[{"kind":"hair","anchor":[219.5,112.2],"angle":-3.48}],"body":[1063,301,224,272,153,55],"palm":[1883,579,21,26,356,192]},{"basePose":0,"hand":[356.97,222.76],"drawHand":[218.12,284.26],"nock":[218.12,284.26],"angle":1.6,"aim":-23.89,"pull":0,"secondary":[{"kind":"hair","anchor":[221.42,111.0],"angle":-0.87}],"body":[1291,301,207,272,160,55],"palm":[1908,579,20,26,347,210]},{"basePose":0,"hand":[352.0,230.0],"drawHand":[212.0,302.0],"nock":[212.0,302.0],"angle":1.77,"aim":-27.22,"pull":0,"secondary":[{"kind":"hair","anchor":[222.18,110.6],"angle":0}],"body":[1502,301,200,271,161,56],"palm":[75,853,18,24,343,218]}]},"archer-1":{"lower":[1736,559,154,166,181,315],"frames":[{"basePose":0,"hand":[354.0,214.0],"drawHand":[220.0,290.0],"nock":[220.0,290.0],"angle":3.4,"aim":-29.56,"pull":0,"secondary":[{"kind":"hair","anchor":[231.63,100.46],"angle":0}],"body":[1295,288,199,266,164,49],"palm":[288,829,18,20,345,204]},{"basePose":0,"hand":[355.63,212.1],"drawHand":[222.06,284.63],"nock":[222.06,284.63],"angle":3.36,"aim":-28.5,"pull":0.0148,"secondary":[{"kind":"hair","anchor":[230.9,100.83],"angle":-0.95}],"body":[2,288,201,267,164,48],"palm":[120,829,19,21,346,202]},{"basePose":0,"hand":[358.87,207.55],"drawHand":[226.13,273.83],"nock":[226.13,273.83],"angle":2.99,"aim":-26.53,"pull":0.05,"secondary":[{"kind":"hair","anchor":[229.46,101.5],"angle":-2.61}],"body":[207,288,204,267,164,48],"palm":[143,829,19,21,349,197]},{"basePose":0,"hand":[363.48,199.12],"drawHand":[232.0,257.9],"nock":[232.0,257.9],"angle":1.76,"aim":-24.09,"pull":0.1012,"secondary":[{"kind":"hair","anchor":[227.49,102.4],"angle":-4.73}],"body":[415,288,209,267,164,48],"palm":[1894,559,19,22,354,188]},{"basePose":0,"hand":[368.56,185.19],"drawHand":[239.05,237.88],"nock":[239.05,237.88],"angle":-1.17,"aim":-22.14,"pull":0.18,"secondary":[{"kind":"hair","anchor":[224.81,103.66],"angle":-7.54}],"body":[1714,2,215,268,163,47],"palm":[2,829,19,22,359,174]},{"basePose":1,"hand":[366.51,164.82],"drawHand":[244.73,216.73],"nock":[244.73,216.73],"angle":-10.83,"aim":-23.08,"pull":0.3338,"secondary":[{"kind":"hair","anchor":[220.83,107.29],"angle":-11.7}],"body":[1498,288,217,266,159,49],"palm":[25,829,20,22,356,154]},{"basePose":1,"hand":[364.95,141.47],"drawHand":[250.32,196.75],"nock":[250.32,196.75],"angle":-18.12,"aim":-25.74,"pull":0.4849,"secondary":[{"kind":"hair","anchor":[217.21,109.29],"angle":-15.84}],"body":[2,559,216,266,159,49],"palm":[49,829,20,22,355,131]},{"basePose":1,"hand":[360.97,116.05],"drawHand":[255.93,175.87],"nock":[255.93,175.87],"angle":-26.6,"aim":-29.66,"pull":0.6234,"secondary":[{"kind":"hair","anchor":[214.05,111.51],"angle":-20.32}],"body":[899,559,214,265,157,50],"palm":[166,829,21,21,350,106]},{"basePose":1,"hand":[353.43,90.18],"drawHand":[260.25,157.22],"nock":[260.25,157.22],"angle":-36.37,"aim":-35.73,"pull":0.7551,"secondary":[{"kind":"hair","anchor":[211.13,113.52],"angle":-24.05}],"body":[1117,559,210,264,154,51],"palm":[191,829,21,21,343,80]},{"basePose":1,"hand":[344.99,70.47],"drawHand":[262.61,144.63],"nock":[262.61,144.63],"angle":-44.78,"aim":-41.99,"pull":0.8521,"secondary":[{"kind":"hair","anchor":[208.98,114.91],"angle":-26.36}],"body":[1331,559,201,264,155,51],"palm":[310,829,22,20,334,61]},{"basePose":1,"hand":[339.01,60.05],"drawHand":[263.45,138.64],"nock":[263.45,138.64],"angle":-49.73,"aim":-46.13,"pull":0.9199,"secondary":[{"kind":"hair","anchor":[207.69,115.81],"angle":-27.86}],"body":[1536,559,196,264,154,51],"palm":[336,829,22,20,328,51]},{"basePose":1,"hand":[334.48,53.38],"drawHand":[263.81,135.07],"nock":[263.81,135.07],"angle":-53.16,"aim":-49.14,"pull":0.9736,"secondary":[{"kind":"hair","anchor":[206.77,116.49],"angle":-28.95}],"body":[1519,2,191,271,154,44],"palm":[362,829,22,20,323,44]},{"basePose":1,"hand":[333.37,52.4],"drawHand":[263.67,134.95],"nock":[263.67,134.95],"angle":-53.83,"aim":-49.82,"pull":0.9938,"secondary":[{"kind":"hair","anchor":[206.57,116.56],"angle":-29.0}],"body":[937,2,190,272,154,43],"palm":[388,829,22,20,322,43]},{"basePose":1,"hand":[333.08,52.18],"drawHand":[263.62,134.96],"nock":[263.62,134.96],"angle":-54.0,"aim":-50.0,"pull":1.0,"secondary":[{"kind":"hair","anchor":[206.52,116.57],"angle":-29.0}],"body":[1131,2,190,272,154,43],"palm":[414,829,22,20,322,43]},{"basePose":1,"hand":[333.08,52.18],"drawHand":[263.62,134.96],"nock":[263.62,134.96],"angle":-54.0,"aim":-50.0,"pull":1,"secondary":[{"kind":"hair","anchor":[206.52,116.57],"angle":-29}],"body":[1325,2,190,272,154,43],"palm":[440,829,22,20,322,43]},{"basePose":2,"hand":[315.8,45.59],"drawHand":[231.49,140.88],"nock":[231.49,140.88],"angle":-52.55,"aim":-48.5,"pull":0.31,"secondary":[{"kind":"hair","anchor":[203.71,116.86],"angle":-29}],"body":[368,2,176,279,152,36],"palm":[466,829,21,20,305,36]},{"basePose":2,"hand":[308.06,41.62],"drawHand":[210.52,144.06],"nock":[210.52,144.06],"angle":-50.53,"aim":-46.4,"pull":0,"secondary":[{"kind":"hair","anchor":[204.75,115.92],"angle":-27.26}],"body":[2,2,179,282,149,33],"palm":[594,829,22,19,297,33]},{"basePose":2,"hand":[313.33,44.25],"drawHand":[208.15,143.74],"nock":[208.15,143.74],"angle":-47.67,"aim":-43.41,"pull":0.025,"secondary":[{"kind":"hair","anchor":[205.86,115.01],"angle":-25.81}],"body":[185,2,179,280,149,35],"palm":[491,829,22,20,302,35]},{"basePose":2,"hand":[320.32,48.18],"drawHand":[211.37,142.91],"nock":[211.37,142.91],"angle":-45.39,"aim":-41.01,"pull":0,"secondary":[{"kind":"hair","anchor":[206.72,114.45],"angle":-24.94}],"body":[548,2,183,276,149,39],"palm":[517,829,22,20,309,39]},{"basePose":2,"hand":[336.94,62.91],"drawHand":[217.7,144.27],"nock":[217.7,144.27],"angle":-38.41,"aim":-34.31,"pull":0,"secondary":[{"kind":"hair","anchor":[209.12,112.86],"angle":-22.62}],"body":[735,2,198,274,150,41],"palm":[543,829,22,20,326,54]},{"basePose":2,"hand":[353.92,84.23],"drawHand":[226.41,147.0],"nock":[226.41,147.0],"angle":-29.87,"aim":-26.21,"pull":0,"secondary":[{"kind":"hair","anchor":[212.38,110.31],"angle":-17.98}],"body":[222,559,213,266,151,49],"palm":[569,829,21,20,343,75]},{"basePose":2,"hand":[365.98,111.88],"drawHand":[236.22,157.12],"nock":[236.22,157.12],"angle":-20.98,"aim":-19.22,"pull":0,"secondary":[{"kind":"hair","anchor":[215.8,108.25],"angle":-14.5}],"body":[439,559,226,266,150,49],"palm":[216,829,21,21,355,102]},{"basePose":2,"hand":[371.8,143.46],"drawHand":[241.24,175.59],"nock":[241.24,175.59],"angle":-11.67,"aim":-13.83,"pull":0,"secondary":[{"kind":"hair","anchor":[219.94,106.05],"angle":-10.15}],"body":[628,288,232,267,150,48],"palm":[73,829,20,22,362,133]},{"basePose":1,"hand":[374.1,169.33],"drawHand":[252.35,199.25],"nock":[252.35,199.25],"angle":-6.38,"aim":-13.81,"pull":0,"secondary":[{"kind":"hair","anchor":[226.3,104.88],"angle":-6.38}],"body":[669,559,226,266,158,49],"palm":[241,829,20,21,364,159]},{"basePose":0,"hand":[368.55,193.26],"drawHand":[238.32,241.38],"nock":[238.32,241.38],"angle":1.62,"aim":-20.28,"pull":0,"secondary":[{"kind":"hair","anchor":[228.63,101.87],"angle":-3.48}],"body":[864,288,218,267,160,48],"palm":[97,829,19,22,359,182]},{"basePose":0,"hand":[358.88,208.19],"drawHand":[226.14,273.9],"nock":[226.14,273.9],"angle":3.22,"aim":-26.34,"pull":0,"secondary":[{"kind":"hair","anchor":[230.79,100.81],"angle":-0.87}],"body":[1086,288,205,267,163,48],"palm":[265,829,19,21,349,198]},{"basePose":0,"hand":[354.0,214.0],"drawHand":[220.0,290.0],"nock":[220.0,290.0],"angle":3.4,"aim":-29.56,"pull":0,"secondary":[{"kind":"hair","anchor":[231.63,100.46],"angle":0}],"body":[1295,288,199,266,164,49],"palm":[288,829,18,20,345,204]}]},"archer-2":{"lower":[756,1650,215,158,127,323],"frames":[{"basePose":0,"hand":[354.0,226.0],"drawHand":[218.0,298.0],"nock":[218.0,298.0],"angle":4.07,"aim":-27.9,"pull":0,"secondary":[{"kind":"cloth","anchor":[202.67,231.11],"angle":0.0}],"body":[247,1118,235,262,128,61],"palm":[198,1913,18,24,345,214]},{"basePose":0,"hand":[355.6,223.93],"drawHand":[219.83,292.55],"nock":[219.83,292.55],"angle":4.03,"aim":-26.81,"pull":0.0148,"secondary":[{"kind":"cloth","anchor":[202.67,231.15],"angle":-0.03}],"body":[745,576,237,263,128,60],"palm":[126,1913,19,25,346,211]},{"basePose":0,"hand":[358.81,219.01],"drawHand":[223.45,281.62],"nock":[223.45,281.62],"angle":3.65,"aim":-24.82,"pull":0.05,"secondary":[{"kind":"cloth","anchor":[202.67,231.24],"angle":-0.09}],"body":[2,851,241,263,128,60],"palm":[975,1650,20,26,349,206]},{"basePose":0,"hand":[363.41,209.95],"drawHand":[228.62,265.5],"nock":[228.62,265.5],"angle":2.41,"aim":-22.4,"pull":0.1012,"secondary":[{"kind":"cloth","anchor":[202.67,231.37],"angle":-0.18}],"body":[247,851,246,263,128,60],"palm":[2,1913,21,26,353,197]},{"basePose":0,"hand":[368.53,195.04],"drawHand":[234.75,245.29],"nock":[234.75,245.29],"angle":-0.55,"aim":-20.59,"pull":0.18,"secondary":[{"kind":"cloth","anchor":[202.68,231.55],"angle":-0.3}],"body":[497,851,251,263,128,60],"palm":[27,1913,21,26,358,182]},{"basePose":1,"hand":[369.62,171.18],"drawHand":[241.22,222.38],"nock":[241.22,222.38],"angle":-13.57,"aim":-21.74,"pull":0.3338,"secondary":[{"kind":"cloth","anchor":[218.02,222.15],"angle":-1.85}],"body":[272,1385,258,260,122,63],"palm":[52,1913,21,26,359,158]},{"basePose":1,"hand":[368.5,145.32],"drawHand":[246.21,201.88],"nock":[246.21,201.88],"angle":-20.39,"aim":-24.82,"pull":0.4849,"secondary":[{"kind":"cloth","anchor":[217.92,222.57],"angle":-2.51}],"body":[534,1385,257,259,122,64],"palm":[220,1913,22,24,357,134]},{"basePose":1,"hand":[364.72,117.19],"drawHand":[251.11,180.56],"nock":[251.11,180.56],"angle":-28.32,"aim":-29.15,"pull":0.6234,"secondary":[{"kind":"cloth","anchor":[217.86,222.92],"angle":-3.06}],"body":[247,1650,254,258,122,65],"palm":[272,1913,23,23,353,106]},{"basePose":1,"hand":[356.93,88.51],"drawHand":[254.75,161.55],"nock":[254.75,161.55],"angle":-37.47,"aim":-35.56,"pull":0.7551,"secondary":[{"kind":"cloth","anchor":[217.79,223.28],"angle":-3.63}],"body":[505,1650,247,257,122,66],"palm":[355,1913,24,22,345,78]},{"basePose":1,"hand":[347.92,66.64],"drawHand":[256.66,148.73],"nock":[256.66,148.73],"angle":-45.35,"aim":-41.97,"pull":0.8521,"secondary":[{"kind":"cloth","anchor":[217.75,223.57],"angle":-4.09}],"body":[234,576,238,266,122,57],"palm":[641,1913,25,21,335,57]},{"basePose":1,"hand":[341.46,55.08],"drawHand":[257.25,142.68],"nock":[257.25,142.68],"angle":-49.99,"aim":-46.13,"pull":0.9199,"secondary":[{"kind":"cloth","anchor":[217.72,223.75],"angle":-4.37}],"body":[446,293,232,278,122,45],"palm":[383,1913,25,22,329,45]},{"basePose":1,"hand":[336.51,47.68],"drawHand":[257.45,139.07],"nock":[257.45,139.07],"angle":-53.21,"aim":-49.14,"pull":0.9736,"secondary":[{"kind":"cloth","anchor":[217.71,223.87],"angle":-4.56}],"body":[689,2,227,286,122,37],"palm":[412,1913,25,22,324,37]},{"basePose":1,"hand":[335.28,46.59],"drawHand":[257.3,138.95],"nock":[257.3,138.95],"angle":-53.84,"aim":-49.82,"pull":0.9938,"secondary":[{"kind":"cloth","anchor":[217.71,223.9],"angle":-4.61}],"body":[2,2,225,287,122,36],"palm":[441,1913,24,22,323,36]},{"basePose":1,"hand":[334.96,46.34],"drawHand":[257.25,138.96],"nock":[257.25,138.96],"angle":-54.0,"aim":-50.0,"pull":1.0,"secondary":[{"kind":"cloth","anchor":[217.71,223.91],"angle":-4.63}],"body":[231,2,225,287,122,36],"palm":[469,1913,24,22,323,36]},{"basePose":1,"hand":[334.96,46.34],"drawHand":[257.25,138.96],"nock":[257.25,138.96],"angle":-54.0,"aim":-50.0,"pull":1,"secondary":[{"kind":"cloth","anchor":[217.71,223.91],"angle":-4.63}],"body":[460,2,225,287,122,36],"palm":[497,1913,24,22,323,36]},{"basePose":2,"hand":[320.27,54.12],"drawHand":[239.08,145.88],"nock":[239.08,145.88],"angle":-52.55,"aim":-48.5,"pull":0.31,"secondary":[{"kind":"cloth","anchor":[208.41,226.65],"angle":-3.59}],"body":[2,293,218,279,115,44],"palm":[525,1913,26,22,307,44]},{"basePose":2,"hand":[320.42,54.14],"drawHand":[227.62,151.58],"nock":[227.62,151.58],"angle":-50.53,"aim":-46.4,"pull":0,"secondary":[{"kind":"cloth","anchor":[208.41,226.55],"angle":-3.46}],"body":[224,293,218,279,115,44],"palm":[555,1913,25,22,308,44]},{"basePose":2,"hand":[325.87,58.08],"drawHand":[226.47,152.05],"nock":[226.47,152.05],"angle":-47.67,"aim":-43.39,"pull":0.025,"secondary":[{"kind":"cloth","anchor":[208.41,226.39],"angle":-3.28}],"body":[682,293,223,275,115,48],"palm":[584,1913,25,22,313,48]},{"basePose":2,"hand":[330.92,62.15],"drawHand":[228.44,151.2],"nock":[228.44,151.2],"angle":-45.39,"aim":-40.99,"pull":0,"secondary":[{"kind":"cloth","anchor":[208.41,226.26],"angle":-3.13}],"body":[2,576,228,271,115,52],"palm":[613,1913,24,22,319,52]},{"basePose":2,"hand":[343.37,76.97],"drawHand":[232.18,152.64],"nock":[232.18,152.64],"angle":-38.41,"aim":-34.24,"pull":0,"secondary":[{"kind":"cloth","anchor":[208.42,225.91],"angle":-2.72}],"body":[2,1650,241,259,114,64],"palm":[299,1913,24,23,331,66]},{"basePose":2,"hand":[355.9,97.18],"drawHand":[237.07,155.36],"nock":[237.07,155.36],"angle":-29.87,"aim":-26.09,"pull":0,"secondary":[{"kind":"cloth","anchor":[208.45,225.46],"angle":-2.21}],"body":[751,1118,254,261,114,62],"palm":[327,1913,24,23,344,86]},{"basePose":2,"hand":[364.43,122.29],"drawHand":[242.2,164.46],"nock":[242.2,164.46],"angle":-20.98,"aim":-19.03,"pull":0,"secondary":[{"kind":"cloth","anchor":[208.48,225.02],"angle":-1.69}],"body":[486,1118,261,262,114,61],"palm":[246,1913,22,24,353,111]},{"basePose":2,"hand":[368.71,152.06],"drawHand":[243.73,182.25],"nock":[243.73,182.25],"angle":-11.67,"aim":-13.58,"pull":0,"secondary":[{"kind":"cloth","anchor":[208.53,224.51],"angle":-1.1}],"body":[476,576,265,264,114,59],"palm":[149,1913,21,25,358,140]},{"basePose":1,"hand":[378.26,175.85],"drawHand":[248.74,204.23],"nock":[248.74,204.23],"angle":-9.42,"aim":-12.36,"pull":0,"secondary":[{"kind":"cloth","anchor":[218.18,221.52],"angle":-0.83}],"body":[2,1385,266,261,122,62],"palm":[77,1913,20,26,368,163]},{"basePose":0,"hand":[368.4,203.58],"drawHand":[234.25,248.77],"nock":[234.25,248.77],"angle":2.27,"aim":-18.62,"pull":0,"secondary":[{"kind":"cloth","anchor":[176.34,217.71],"angle":-0.13}],"body":[752,851,251,263,128,60],"palm":[101,1913,21,26,358,191]},{"basePose":0,"hand":[358.79,219.68],"drawHand":[223.47,281.69],"nock":[223.47,281.69],"angle":3.89,"aim":-24.62,"pull":0,"secondary":[{"kind":"cloth","anchor":[185.55,225.87],"angle":-0.04}],"body":[2,1118,241,263,128,60],"palm":[174,1913,20,25,349,207]},{"basePose":0,"hand":[354.0,226.0],"drawHand":[218.0,298.0],"nock":[218.0,298.0],"angle":4.07,"aim":-27.9,"pull":0,"secondary":[{"kind":"cloth","anchor":[202.67,231.11],"angle":0.0}],"body":[247,1118,235,262,128,61],"palm":[198,1913,18,24,345,214]}]},"archer-3":{"lower":[724,1630,217,183,123,298],"frames":[{"basePose":0,"hand":[368.0,210.0],"drawHand":[218.0,272.0],"nock":[218.0,272.0],"angle":5.06,"aim":-22.46,"pull":0,"secondary":[{"kind":"cloth","anchor":[216.89,273.78],"angle":0.0},{"kind":"hair","anchor":[235.01,100.3],"angle":0}],"body":[2,1630,228,245,149,53],"palm":[218,1879,18,20,359,200]},{"basePose":0,"hand":[369.18,208.16],"drawHand":[219.64,266.78],"nock":[219.64,266.78],"angle":5.02,"aim":-21.41,"pull":0.0148,"secondary":[{"kind":"cloth","anchor":[216.89,273.78],"angle":-0.0},{"kind":"hair","anchor":[234.29,100.68],"angle":-0.95}],"body":[266,1129,230,246,149,52],"palm":[75,1879,19,21,360,198]},{"basePose":0,"hand":[371.54,203.64],"drawHand":[222.86,256.36],"nock":[222.86,256.36],"angle":4.63,"aim":-19.52,"pull":0.05,"secondary":[{"kind":"cloth","anchor":[216.89,273.78],"angle":-0.0},{"kind":"hair","anchor":[232.87,101.38],"angle":-2.61}],"body":[500,1129,232,246,149,52],"palm":[98,1879,19,21,362,193]},{"basePose":0,"hand":[374.81,195.05],"drawHand":[227.39,241.09],"nock":[227.39,241.09],"angle":3.37,"aim":-17.34,"pull":0.1012,"secondary":[{"kind":"cloth","anchor":[216.89,273.78],"angle":-0.0},{"kind":"hair","anchor":[230.94,102.33],"angle":-4.73}],"body":[736,1129,236,246,149,52],"palm":[945,1630,20,22,365,184]},{"basePose":0,"hand":[378.04,180.49],"drawHand":[232.66,222.13],"nock":[232.66,222.13],"angle":0.35,"aim":-15.98,"pull":0.18,"secondary":[{"kind":"cloth","anchor":[216.89,273.78],"angle":-0.0},{"kind":"hair","anchor":[228.32,103.67],"angle":-7.54}],"body":[2,1380,239,246,149,52],"palm":[2,1879,20,22,368,170]},{"basePose":1,"hand":[388.56,153.66],"drawHand":[241.93,199.75],"nock":[241.93,199.75],"angle":-10.41,"aim":-17.45,"pull":0.3338,"secondary":[{"kind":"cloth","anchor":[247.56,231.89],"angle":-0.0},{"kind":"hair","anchor":[229.61,104.94],"angle":-11.7}],"body":[506,877,250,247,149,51],"palm":[26,1879,21,22,378,143]},{"basePose":1,"hand":[387.44,125.43],"drawHand":[246.86,180.78],"nock":[246.86,180.78],"angle":-17.78,"aim":-21.49,"pull":0.4849,"secondary":[{"kind":"cloth","anchor":[247.56,231.89],"angle":-0.0},{"kind":"hair","anchor":[226.18,107.22],"angle":-15.84}],"body":[245,1380,249,246,149,52],"palm":[240,1879,21,20,377,116]},{"basePose":1,"hand":[383.03,94.96],"drawHand":[251.62,161.38],"nock":[251.62,161.38],"angle":-26.34,"aim":-26.82,"pull":0.6234,"secondary":[{"kind":"cloth","anchor":[247.56,231.89],"angle":-0.0},{"kind":"hair","anchor":[223.24,109.73],"angle":-20.32}],"body":[234,1630,245,245,149,53],"palm":[265,1879,22,20,372,86]},{"basePose":1,"hand":[373.51,63.85],"drawHand":[255.15,144.29],"nock":[255.15,144.29],"angle":-36.21,"aim":-34.2,"pull":0.7551,"secondary":[{"kind":"cloth","anchor":[247.56,231.89],"angle":-0.0},{"kind":"hair","anchor":[220.54,111.97],"angle":-24.05}],"body":[483,1630,237,245,149,53],"palm":[291,1879,22,20,362,55]},{"basePose":1,"hand":[362.31,40.24],"drawHand":[256.99,132.83],"nock":[256.99,132.83],"angle":-44.7,"aim":-41.32,"pull":0.8521,"secondary":[{"kind":"cloth","anchor":[247.56,231.89],"angle":-0.0},{"kind":"hair","anchor":[218.53,113.47],"angle":-26.36}],"body":[452,594,227,267,149,31],"palm":[317,1879,22,20,351,31]},{"basePose":1,"hand":[354.29,27.92],"drawHand":[257.54,127.56],"nock":[257.54,127.56],"angle":-49.69,"aim":-45.84,"pull":0.9199,"secondary":[{"kind":"cloth","anchor":[247.56,231.89],"angle":-0.0},{"kind":"hair","anchor":[217.34,114.45],"angle":-27.86}],"body":[2,594,219,279,149,19],"palm":[343,1879,22,20,343,19]},{"basePose":1,"hand":[348.18,20.11],"drawHand":[257.71,124.48],"nock":[257.71,124.48],"angle":-53.15,"aim":-49.08,"pull":0.9736,"secondary":[{"kind":"cloth","anchor":[247.56,231.89],"angle":-0.0},{"kind":"hair","anchor":[216.43,115.23],"angle":-28.95}],"body":[645,302,212,287,149,11],"palm":[369,1879,22,20,337,11]},{"basePose":1,"hand":[346.61,18.95],"drawHand":[257.56,124.38],"nock":[257.56,124.38],"angle":-53.83,"aim":-49.81,"pull":0.9938,"secondary":[{"kind":"cloth","anchor":[247.56,231.89],"angle":-0.0},{"kind":"hair","anchor":[216.24,115.3],"angle":-29.0}],"body":[2,302,211,288,149,10],"palm":[395,1879,21,20,336,10]},{"basePose":1,"hand":[346.2,18.7],"drawHand":[257.51,124.39],"nock":[257.51,124.39],"angle":-54.0,"aim":-50.0,"pull":1.0,"secondary":[{"kind":"cloth","anchor":[247.56,231.89],"angle":-0.0},{"kind":"hair","anchor":[216.19,115.31],"angle":-29.0}],"body":[217,302,210,288,149,10],"palm":[420,1879,22,20,335,10]},{"basePose":1,"hand":[346.2,18.7],"drawHand":[257.51,124.39],"nock":[257.51,124.39],"angle":-54.0,"aim":-50.0,"pull":1,"secondary":[{"kind":"cloth","anchor":[247.56,231.89],"angle":-0.0},{"kind":"hair","anchor":[216.19,115.31],"angle":-29}],"body":[431,302,210,288,149,10],"palm":[446,1879,22,20,335,10]},{"basePose":2,"hand":[329.96,13.26],"drawHand":[231.61,124.07],"nock":[231.61,124.07],"angle":-52.55,"aim":-48.41,"pull":0.31,"secondary":[{"kind":"cloth","anchor":[244.0,231.89],"angle":-0.0},{"kind":"hair","anchor":[213.81,116.43],"angle":-29}],"body":[200,2,198,294,149,4],"palm":[472,1879,22,20,319,4]},{"basePose":2,"hand":[323.75,10.57],"drawHand":[214.73,124.17],"nock":[214.73,124.17],"angle":-50.53,"aim":-46.18,"pull":0,"secondary":[{"kind":"cloth","anchor":[244.0,231.89],"angle":-0.0},{"kind":"hair","anchor":[212.15,117.58],"angle":-27.26}],"body":[2,2,194,296,149,2],"palm":[550,1879,21,19,313,2]},{"basePose":2,"hand":[330.72,13.7],"drawHand":[213.2,123.28],"nock":[213.2,123.28],"angle":-47.67,"aim":-43.0,"pull":0.025,"secondary":[{"kind":"cloth","anchor":[244.0,231.89],"angle":-0.0},{"kind":"hair","anchor":[212.92,116.77],"angle":-25.81}],"body":[402,2,199,293,149,5],"palm":[575,1879,21,19,320,5]},{"basePose":2,"hand":[338.95,17.94],"drawHand":[216.12,122.66],"nock":[216.12,122.66],"angle":-45.39,"aim":-40.45,"pull":0,"secondary":[{"kind":"cloth","anchor":[244.0,231.89],"angle":-0.0},{"kind":"hair","anchor":[213.86,115.95],"angle":-24.94}],"body":[605,2,204,289,149,9],"palm":[498,1879,22,20,328,9]},{"basePose":2,"hand":[358.83,34.6],"drawHand":[221.93,124.28],"nock":[221.93,124.28],"angle":-38.41,"aim":-33.23,"pull":0,"secondary":[{"kind":"cloth","anchor":[244.0,231.89],"angle":-0.0},{"kind":"hair","anchor":[216.35,114.46],"angle":-22.62}],"body":[225,594,223,272,149,26],"palm":[600,1879,22,19,348,26]},{"basePose":2,"hand":[379.26,59.3],"drawHand":[230.05,127.08],"nock":[230.05,127.08],"angle":-29.87,"aim":-24.43,"pull":0,"secondary":[{"kind":"cloth","anchor":[244.0,231.89],"angle":-0.0},{"kind":"hair","anchor":[219.99,111.21],"angle":-17.98}],"body":[2,877,241,248,149,50],"palm":[524,1879,22,20,368,50]},{"basePose":2,"hand":[393.33,91.88],"drawHand":[238.41,137.6],"nock":[238.41,137.6],"angle":-20.98,"aim":-16.44,"pull":0,"secondary":[{"kind":"cloth","anchor":[244.0,231.89],"angle":-0.0},{"kind":"hair","anchor":[225.74,108.9],"angle":-14.5}],"body":[247,877,255,248,149,50],"palm":[121,1879,22,21,382,82]},{"basePose":2,"hand":[399.16,129.75],"drawHand":[242.42,156.1],"nock":[242.42,156.1],"angle":-11.67,"aim":-9.55,"pull":0,"secondary":[{"kind":"cloth","anchor":[244.0,231.89],"angle":-0.0},{"kind":"hair","anchor":[231.56,110.29],"angle":-10.15}],"body":[683,594,260,249,149,49],"palm":[147,1879,20,21,389,120]},{"basePose":1,"hand":[399.35,161.64],"drawHand":[250.03,181.64],"nock":[250.03,181.64],"angle":-5.92,"aim":-7.63,"pull":0,"secondary":[{"kind":"cloth","anchor":[247.56,231.89],"angle":-0.0},{"kind":"hair","anchor":[234.9,102.31],"angle":-6.38}],"body":[2,1129,260,247,149,51],"palm":[51,1879,20,22,389,151]},{"basePose":0,"hand":[378.54,189.36],"drawHand":[232.44,225.06],"nock":[232.44,225.06],"angle":3.23,"aim":-13.73,"pull":0,"secondary":[{"kind":"cloth","anchor":[232.33,228.69],"angle":-0.0},{"kind":"hair","anchor":[232.07,101.77],"angle":-3.48}],"body":[498,1380,239,246,149,52],"palm":[171,1879,20,21,368,179]},{"basePose":0,"hand":[371.54,204.34],"drawHand":[222.91,256.37],"nock":[222.91,256.37],"angle":4.88,"aim":-19.29,"pull":0,"secondary":[{"kind":"cloth","anchor":[222.29,258.94],"angle":-0.0},{"kind":"hair","anchor":[234.19,100.67],"angle":-0.87}],"body":[741,1380,232,246,149,52],"palm":[195,1879,19,21,362,194]},{"basePose":0,"hand":[368.0,210.0],"drawHand":[218.0,272.0],"nock":[218.0,272.0],"angle":5.06,"aim":-22.46,"pull":0,"secondary":[{"kind":"cloth","anchor":[216.89,273.78],"angle":0.0},{"kind":"hair","anchor":[235.01,100.3],"angle":0}],"body":[2,1630,228,245,149,53],"palm":[218,1879,18,20,359,200]}]},"archer-4":{"lower":[1734,534,209,173,135,308],"frames":[{"basePose":0,"hand":[342.0,224.0],"drawHand":[270.0,254.0],"nock":[270.0,254.0],"angle":6.18,"aim":-22.62,"pull":0,"secondary":[{"kind":"cloth","anchor":[199.11,252.44],"angle":0.0},{"kind":"hair","anchor":[224.24,111.21],"angle":0}],"body":[1524,534,206,243,145,65],"palm":[440,785,18,20,333,214]},{"basePose":0,"hand":[343.58,221.7],"drawHand":[269.74,250.17],"nock":[269.74,250.17],"angle":6.14,"aim":-21.08,"pull":0.0148,"secondary":[{"kind":"cloth","anchor":[199.11,252.44],"angle":-0.0},{"kind":"hair","anchor":[223.53,111.5],"angle":-0.95}],"body":[437,534,208,244,145,64],"palm":[120,785,19,21,334,211]},{"basePose":0,"hand":[346.71,216.41],"drawHand":[269.19,242.46],"nock":[269.19,242.46],"angle":5.75,"aim":-18.57,"pull":0.05,"secondary":[{"kind":"cloth","anchor":[199.11,252.44],"angle":-0.0},{"kind":"hair","anchor":[222.14,112.04],"angle":-2.61}],"body":[649,534,211,244,145,64],"palm":[143,785,19,21,337,206]},{"basePose":0,"hand":[351.11,207.0],"drawHand":[268.26,231.04],"nock":[268.26,231.04],"angle":4.45,"aim":-16.18,"pull":0.1012,"secondary":[{"kind":"cloth","anchor":[199.11,252.44],"angle":-0.0},{"kind":"hair","anchor":[220.24,112.76],"angle":-4.73}],"body":[864,534,216,244,145,64],"palm":[2,785,20,22,341,196]},{"basePose":0,"hand":[355.88,192.05],"drawHand":[266.88,216.63],"nock":[266.88,216.63],"angle":1.38,"aim":-15.44,"pull":0.18,"secondary":[{"kind":"cloth","anchor":[199.11,252.44],"angle":-0.0},{"kind":"hair","anchor":[217.64,113.77],"angle":-7.54}],"body":[212,534,221,245,145,63],"palm":[166,785,20,21,346,182]},{"basePose":1,"hand":[353.88,169.17],"drawHand":[261.78,200.21],"nock":[261.78,200.21],"angle":-9.04,"aim":-18.63,"pull":0.3338,"secondary":[{"kind":"cloth","anchor":[203.48,221.7],"angle":-1.47},{"kind":"hair","anchor":[206.48,107.87],"angle":-11.7}],"body":[2,280,219,250,145,58],"palm":[190,785,20,21,344,159]},{"basePose":1,"hand":[352.05,144.61],"drawHand":[258.7,185.39],"nock":[258.7,185.39],"angle":-16.64,"aim":-23.6,"pull":0.4849,"secondary":[{"kind":"cloth","anchor":[203.44,222.11],"angle":-1.99},{"kind":"hair","anchor":[202.42,109.92],"angle":-15.84}],"body":[225,280,220,250,142,58],"palm":[26,785,20,22,342,134]},{"basePose":1,"hand":[347.83,117.99],"drawHand":[255.43,169.85],"nock":[255.43,169.85],"angle":-25.48,"aim":-29.3,"pull":0.6234,"secondary":[{"kind":"cloth","anchor":[203.41,222.46],"angle":-2.44},{"kind":"hair","anchor":[198.77,112.25],"angle":-20.32}],"body":[679,280,218,249,140,59],"palm":[214,785,21,21,337,108]},{"basePose":1,"hand":[340.11,91.06],"drawHand":[251.92,155.94],"nock":[251.92,155.94],"angle":-35.66,"aim":-36.34,"pull":0.7551,"secondary":[{"kind":"cloth","anchor":[203.39,222.81],"angle":-2.89},{"kind":"hair","anchor":[195.47,114.38],"angle":-24.05}],"body":[1374,280,213,248,138,60],"palm":[239,785,22,21,329,81]},{"basePose":1,"hand":[331.54,70.64],"drawHand":[249.02,146.56],"nock":[249.02,146.56],"angle":-44.41,"aim":-42.61,"pull":0.8521,"secondary":[{"kind":"cloth","anchor":[203.37,223.1],"angle":-3.25},{"kind":"hair","anchor":[193.1,115.84],"angle":-26.36}],"body":[2,534,206,247,136,61],"palm":[265,785,21,21,321,61]},{"basePose":1,"hand":[325.51,59.9],"drawHand":[247.43,142.08],"nock":[247.43,142.08],"angle":-49.56,"aim":-46.47,"pull":0.9199,"secondary":[{"kind":"cloth","anchor":[203.37,223.28],"angle":-3.47},{"kind":"hair","anchor":[191.66,116.8],"angle":-27.86}],"body":[1539,2,201,258,135,50],"palm":[290,785,21,21,315,50]},{"basePose":1,"hand":[320.94,53.03],"drawHand":[246.37,139.39],"nock":[246.37,139.39],"angle":-53.12,"aim":-49.19,"pull":0.9736,"secondary":[{"kind":"cloth","anchor":[203.38,223.4],"angle":-3.63},{"kind":"hair","anchor":[190.65,117.52],"angle":-28.95}],"body":[1338,2,197,264,134,44],"palm":[462,785,21,20,310,44]},{"basePose":1,"hand":[319.83,52.04],"drawHand":[246.17,139.31],"nock":[246.17,139.31],"angle":-53.83,"aim":-49.83,"pull":0.9938,"secondary":[{"kind":"cloth","anchor":[203.38,223.43],"angle":-3.67},{"kind":"hair","anchor":[190.45,117.58],"angle":-29.0}],"body":[1138,2,196,265,134,43],"palm":[487,785,21,20,309,43]},{"basePose":1,"hand":[319.55,51.83],"drawHand":[246.12,139.33],"nock":[246.12,139.33],"angle":-54.0,"aim":-50.0,"pull":1.0,"secondary":[{"kind":"cloth","anchor":[203.37,223.44],"angle":-3.68},{"kind":"hair","anchor":[190.41,117.59],"angle":-29.0}],"body":[738,2,196,266,134,42],"palm":[315,785,22,21,308,42]},{"basePose":1,"hand":[319.55,51.83],"drawHand":[246.12,139.33],"nock":[246.12,139.33],"angle":-54.0,"aim":-50.0,"pull":1,"secondary":[{"kind":"cloth","anchor":[203.37,223.44],"angle":-3.68},{"kind":"hair","anchor":[190.41,117.59],"angle":-29}],"body":[938,2,196,266,134,42],"palm":[341,785,22,21,308,42]},{"basePose":2,"hand":[303.09,46.46],"drawHand":[217.0,144.05],"nock":[217.0,144.05],"angle":-52.55,"aim":-48.58,"pull":0.31,"secondary":[{"kind":"cloth","anchor":[197.57,226.55],"angle":-2.38},{"kind":"hair","anchor":[190.42,118.93],"angle":-29}],"body":[364,2,181,271,133,37],"palm":[512,785,22,20,292,37]},{"basePose":2,"hand":[295.85,42.55],"drawHand":[197.51,146.52],"nock":[197.51,146.52],"angle":-50.53,"aim":-46.59,"pull":0,"secondary":[{"kind":"cloth","anchor":[197.55,226.46],"angle":-2.3},{"kind":"hair","anchor":[191.45,118.02],"angle":-27.26}],"body":[2,2,175,274,133,34],"palm":[613,785,22,19,285,34]},{"basePose":2,"hand":[300.87,45.15],"drawHand":[195.42,146.12],"nock":[195.42,146.12],"angle":-47.67,"aim":-43.76,"pull":0.025,"secondary":[{"kind":"cloth","anchor":[197.54,226.33],"angle":-2.18},{"kind":"hair","anchor":[192.69,117.12],"angle":-25.81}],"body":[181,2,179,272,133,36],"palm":[538,785,21,20,290,36]},{"basePose":2,"hand":[307.49,49.02],"drawHand":[198.51,145.39],"nock":[198.51,145.39],"angle":-45.39,"aim":-41.49,"pull":0,"secondary":[{"kind":"cloth","anchor":[197.54,226.23],"angle":-2.08},{"kind":"hair","anchor":[193.59,116.54],"angle":-24.94}],"body":[549,2,185,268,133,40],"palm":[563,785,21,20,297,40]},{"basePose":2,"hand":[323.33,63.59],"drawHand":[205.9,146.13],"nock":[205.9,146.13],"angle":-38.41,"aim":-35.1,"pull":0,"secondary":[{"kind":"cloth","anchor":[197.53,225.96],"angle":-1.81},{"kind":"hair","anchor":[196.08,115.03],"angle":-22.62}],"body":[1744,2,202,254,132,54],"palm":[588,785,21,20,313,54]},{"basePose":2,"hand":[339.67,84.56],"drawHand":[216.29,147.86],"nock":[216.29,147.86],"angle":-29.87,"aim":-27.16,"pull":0,"secondary":[{"kind":"cloth","anchor":[197.52,225.61],"angle":-1.47},{"kind":"hair","anchor":[199.94,112.38],"angle":-17.98}],"body":[1591,280,218,248,132,60],"palm":[367,785,21,21,329,75]},{"basePose":2,"hand":[351.56,112.21],"drawHand":[230.1,155.42],"nock":[230.1,155.42],"angle":-20.98,"aim":-19.58,"pull":0,"secondary":[{"kind":"cloth","anchor":[197.52,225.26],"angle":-1.13},{"kind":"hair","anchor":[203.61,110.45],"angle":-14.5}],"body":[901,280,230,249,132,59],"palm":[392,785,21,21,341,102]},{"basePose":2,"hand":[357.68,144.36],"drawHand":[242.55,169.28],"nock":[242.55,169.28],"angle":-11.67,"aim":-12.21,"pull":0,"secondary":[{"kind":"cloth","anchor":[197.52,224.86],"angle":-0.73},{"kind":"hair","anchor":[208.07,108.33],"angle":-10.15}],"body":[1135,280,235,249,132,59],"palm":[417,785,19,21,348,134]},{"basePose":1,"hand":[361.65,171.75],"drawHand":[261.17,187.56],"nock":[261.17,187.56],"angle":-4.4,"aim":-8.94,"pull":0,"secondary":[{"kind":"cloth","anchor":[203.58,221.07],"angle":-0.66},{"kind":"hair","anchor":[212.49,105.46],"angle":-6.38}],"body":[449,280,226,250,145,58],"palm":[50,785,19,22,352,161]},{"basePose":0,"hand":[356.02,199.93],"drawHand":[267.47,219.26],"nock":[267.47,219.26],"angle":4.31,"aim":-12.32,"pull":0,"secondary":[{"kind":"cloth","anchor":[199.11,252.47],"angle":-0.0},{"kind":"hair","anchor":[221.34,112.33],"angle":-3.48}],"body":[1084,534,221,244,145,64],"palm":[73,785,20,22,346,189]},{"basePose":0,"hand":[346.73,217.02],"drawHand":[269.2,242.53],"nock":[269.2,242.53],"angle":5.99,"aim":-18.21,"pull":0,"secondary":[{"kind":"cloth","anchor":[199.11,252.45],"angle":-0.0},{"kind":"hair","anchor":[223.42,111.48],"angle":-0.87}],"body":[1309,534,211,244,145,64],"palm":[97,785,19,22,337,206]},{"basePose":0,"hand":[342.0,224.0],"drawHand":[270.0,254.0],"nock":[270.0,254.0],"angle":6.18,"aim":-22.62,"pull":0,"secondary":[{"kind":"cloth","anchor":[199.11,252.44],"angle":0.0},{"kind":"hair","anchor":[224.24,111.21],"angle":0}],"body":[1524,534,206,243,145,65],"palm":[440,785,18,20,333,214]}]},"archer-5":{"lower":[1215,1025,245,183,94,298],"frames":[{"basePose":0,"hand":[352.0,206.0],"drawHand":[230.0,262.0],"nock":[230.0,262.0],"angle":3.25,"aim":-24.66,"pull":0,"secondary":[{"kind":"cloth","anchor":[184.89,199.11],"angle":0.0},{"kind":"hair","anchor":[221.01,116.3],"angle":0}],"body":[833,781,230,231,131,67],"palm":[290,1260,18,20,343,196]},{"basePose":0,"hand":[353.3,204.27],"drawHand":[231.17,257.73],"nock":[231.17,257.73],"angle":3.21,"aim":-23.64,"pull":0.0148,"secondary":[{"kind":"cloth","anchor":[184.85,199.32],"angle":-0.17},{"kind":"hair","anchor":[220.43,116.79],"angle":-0.95}],"body":[1067,781,232,231,131,67],"palm":[97,1260,19,21,344,194]},{"basePose":0,"hand":[355.85,200.1],"drawHand":[233.47,249.19],"nock":[233.47,249.19],"angle":2.84,"aim":-21.86,"pull":0.05,"secondary":[{"kind":"cloth","anchor":[184.75,199.77],"angle":-0.55},{"kind":"hair","anchor":[219.27,117.67],"angle":-2.61}],"body":[2,1025,234,231,131,67],"palm":[2,1260,19,22,346,189]},{"basePose":0,"hand":[359.38,192.36],"drawHand":[236.72,236.62],"nock":[236.72,236.62],"angle":1.61,"aim":-19.84,"pull":0.1012,"secondary":[{"kind":"cloth","anchor":[184.6,200.42],"angle":-1.09},{"kind":"hair","anchor":[217.7,118.82],"angle":-4.73}],"body":[240,1025,238,231,131,67],"palm":[120,1260,20,21,349,182]},{"basePose":0,"hand":[363.02,179.53],"drawHand":[240.52,220.91],"nock":[240.52,220.91],"angle":-1.3,"aim":-18.67,"pull":0.18,"secondary":[{"kind":"cloth","anchor":[184.41,201.34],"angle":-1.87},{"kind":"hair","anchor":[215.59,120.4],"angle":-7.54}],"body":[482,1025,242,231,131,67],"palm":[25,1260,20,22,353,169]},{"basePose":1,"hand":[362.43,154.25],"drawHand":[240.82,199.4],"nock":[240.82,199.4],"angle":-13.03,"aim":-20.37,"pull":0.3338,"secondary":[{"kind":"cloth","anchor":[202.33,178.35],"angle":-3.99},{"kind":"hair","anchor":[213.62,113.79],"angle":-11.7}],"body":[1004,273,275,241,97,57],"palm":[144,1260,20,21,352,144]},{"basePose":1,"hand":[359.72,130.28],"drawHand":[242.64,182.8],"nock":[242.64,182.8],"angle":-19.94,"aim":-24.16,"pull":0.4849,"secondary":[{"kind":"cloth","anchor":[201.4,179.6],"angle":-5.42},{"kind":"hair","anchor":[210.63,115.92],"angle":-15.84}],"body":[2,536,274,241,96,57],"palm":[168,1260,21,21,349,120]},{"basePose":1,"hand":[354.48,104.44],"drawHand":[244.36,165.69],"nock":[244.36,165.69],"angle":-27.98,"aim":-29.08,"pull":0.6234,"secondary":[{"kind":"cloth","anchor":[200.67,180.67],"angle":-6.62},{"kind":"hair","anchor":[208.12,118.22],"angle":-20.32}],"body":[861,536,269,240,96,58],"palm":[312,1260,21,20,344,95]},{"basePose":1,"hand":[345.51,78.24],"drawHand":[245.29,150.54],"nock":[245.29,150.54],"angle":-37.25,"aim":-35.81,"pull":0.7551,"secondary":[{"kind":"cloth","anchor":[199.92,181.77],"angle":-7.84},{"kind":"hair","anchor":[205.77,120.28],"angle":-24.05}],"body":[291,781,260,239,96,59],"palm":[337,1260,21,20,335,69]},{"basePose":1,"hand":[335.79,58.36],"drawHand":[245.42,140.39],"nock":[245.42,140.39],"angle":-45.24,"aim":-42.23,"pull":0.8521,"secondary":[{"kind":"cloth","anchor":[199.33,182.67],"angle":-8.84},{"kind":"hair","anchor":[204.0,121.67],"angle":-26.36}],"body":[750,273,250,249,96,49],"palm":[362,1260,21,20,325,49]},{"basePose":1,"hand":[329.11,47.96],"drawHand":[245.24,135.67],"nock":[245.24,135.67],"angle":-49.94,"aim":-46.28,"pull":0.9199,"secondary":[{"kind":"cloth","anchor":[198.98,183.22],"angle":-9.44},{"kind":"hair","anchor":[202.95,122.58],"angle":-27.86}],"body":[2,273,244,259,96,39],"palm":[387,1260,22,20,318,39]},{"basePose":1,"hand":[324.08,41.35],"drawHand":[245.01,132.89],"nock":[245.01,132.89],"angle":-53.2,"aim":-49.18,"pull":0.9736,"secondary":[{"kind":"cloth","anchor":[199.56,183.65],"angle":-9.86},{"kind":"hair","anchor":[202.05,123.34],"angle":-28.95}],"body":[716,2,236,266,99,32],"palm":[413,1260,22,20,313,32]},{"basePose":1,"hand":[322.86,40.38],"drawHand":[244.85,132.81],"nock":[244.85,132.81],"angle":-53.84,"aim":-49.83,"pull":0.9938,"secondary":[{"kind":"cloth","anchor":[199.52,183.75],"angle":-9.97},{"kind":"hair","anchor":[201.87,123.41],"angle":-29.0}],"body":[2,2,234,267,99,31],"palm":[439,1260,21,20,312,31]},{"basePose":1,"hand":[322.55,40.17],"drawHand":[244.8,132.82],"nock":[244.8,132.82],"angle":-54.0,"aim":-50.0,"pull":1.0,"secondary":[{"kind":"cloth","anchor":[199.51,183.77],"angle":-10.0},{"kind":"hair","anchor":[201.82,123.42],"angle":-29.0}],"body":[240,2,234,267,99,31],"palm":[464,1260,21,20,312,31]},{"basePose":1,"hand":[322.55,40.17],"drawHand":[244.8,132.82],"nock":[244.8,132.82],"angle":-54.0,"aim":-50.0,"pull":1,"secondary":[{"kind":"cloth","anchor":[199.51,183.77],"angle":-10.0},{"kind":"hair","anchor":[201.82,123.42],"angle":-29}],"body":[478,2,234,267,99,31],"palm":[489,1260,21,20,312,31]},{"basePose":2,"hand":[312.22,47.06],"drawHand":[230.78,139.33],"nock":[230.78,139.33],"angle":-52.55,"aim":-48.57,"pull":0.31,"secondary":[{"kind":"cloth","anchor":[195.14,187.38],"angle":-9.75},{"kind":"hair","anchor":[198.39,123.62],"angle":-29}],"body":[956,2,237,260,89,38],"palm":[514,1260,22,20,301,38]},{"basePose":2,"hand":[312.42,47.15],"drawHand":[220.63,144.12],"nock":[220.63,144.12],"angle":-50.53,"aim":-46.57,"pull":0,"secondary":[{"kind":"cloth","anchor":[194.71,187.64],"angle":-9.4},{"kind":"hair","anchor":[198.98,122.49],"angle":-27.26}],"body":[1197,2,241,260,85,38],"palm":[540,1260,21,20,302,38]},{"basePose":2,"hand":[317.68,50.56],"drawHand":[219.61,144.33],"nock":[219.61,144.33],"angle":-47.67,"aim":-43.72,"pull":0.025,"secondary":[{"kind":"cloth","anchor":[194.79,187.27],"angle":-8.9},{"kind":"hair","anchor":[199.86,121.51],"angle":-25.81}],"body":[250,273,244,257,84,41],"palm":[565,1260,21,20,307,41]},{"basePose":2,"hand":[322.58,54.11],"drawHand":[221.36,143.44],"nock":[221.36,143.44],"angle":-45.39,"aim":-41.43,"pull":0,"secondary":[{"kind":"cloth","anchor":[195.13,186.77],"angle":-8.5},{"kind":"hair","anchor":[200.56,120.92],"angle":-24.94}],"body":[498,273,248,253,85,45],"palm":[590,1260,21,20,312,45]},{"basePose":2,"hand":[334.96,67.36],"drawHand":[225.05,144.14],"nock":[225.05,144.14],"angle":-38.41,"aim":-34.94,"pull":0,"secondary":[{"kind":"cloth","anchor":[195.67,185.76],"angle":-7.4},{"kind":"hair","anchor":[202.53,119.32],"angle":-22.62}],"body":[1134,536,261,240,85,58],"palm":[615,1260,22,20,324,58]},{"basePose":2,"hand":[347.64,85.53],"drawHand":[229.94,145.57],"nock":[229.94,145.57],"angle":-29.87,"aim":-27.02,"pull":0,"secondary":[{"kind":"cloth","anchor":[196.38,184.47],"angle":-6.0},{"kind":"hair","anchor":[205.31,116.46],"angle":-17.98}],"body":[555,781,274,239,84,59],"palm":[193,1260,21,21,337,76]},{"basePose":2,"hand":[357.0,108.7],"drawHand":[235.79,152.43],"nock":[235.79,152.43],"angle":-20.98,"aim":-19.84,"pull":0,"secondary":[{"kind":"cloth","anchor":[196.91,183.36],"angle":-4.6},{"kind":"hair","anchor":[208.13,114.29],"angle":-14.5}],"body":[2,781,285,240,82,58],"palm":[218,1260,20,21,347,99]},{"basePose":2,"hand":[362.57,136.48],"drawHand":[239.37,166.5],"nock":[239.37,166.5],"angle":-11.67,"aim":-13.7,"pull":0,"secondary":[{"kind":"cloth","anchor":[197.37,182.11],"angle":-3.0},{"kind":"hair","anchor":[211.59,111.75],"angle":-10.15}],"body":[280,536,291,241,81,57],"palm":[49,1260,20,22,352,126]},{"basePose":1,"hand":[370.43,158.25],"drawHand":[245.15,183.89],"nock":[245.15,183.89],"angle":-8.81,"aim":-11.56,"pull":0,"secondary":[{"kind":"cloth","anchor":[203.72,176.72],"angle":-1.8},{"kind":"hair","anchor":[218.26,111.28],"angle":-6.38}],"body":[575,536,282,241,98,57],"palm":[242,1260,20,21,360,148]},{"basePose":0,"hand":[363.43,187.01],"drawHand":[240.32,223.51],"nock":[240.32,223.51],"angle":1.48,"aim":-16.51,"pull":0,"secondary":[{"kind":"cloth","anchor":[177.29,197.39],"angle":-0.78},{"kind":"hair","anchor":[218.63,118.14],"angle":-3.48}],"body":[728,1025,243,231,130,67],"palm":[73,1260,20,22,353,176]},{"basePose":0,"hand":[355.88,200.69],"drawHand":[233.49,249.22],"nock":[233.49,249.22],"angle":3.07,"aim":-21.63,"pull":0,"secondary":[{"kind":"cloth","anchor":[179.92,197.63],"angle":-0.23},{"kind":"hair","anchor":[220.34,116.75],"angle":-0.87}],"body":[975,1025,236,231,130,67],"palm":[266,1260,20,21,346,190]},{"basePose":0,"hand":[352.0,206.0],"drawHand":[230.0,262.0],"nock":[230.0,262.0],"angle":3.25,"aim":-24.66,"pull":0,"secondary":[{"kind":"cloth","anchor":[184.89,199.11],"angle":0.0},{"kind":"hair","anchor":[221.01,116.3],"angle":0}],"body":[833,781,230,231,131,67],"palm":[290,1260,18,20,343,196]}]},"archer-event":{"lower":[506,1697,222,157,123,323],"frames":[{"basePose":0,"hand":[349.0,233.0],"drawHand":[213.0,298.0],"nock":[213.0,298.0],"angle":7,"aim":-25.55,"pull":0,"secondary":[{"kind":"cloth","anchor":[213.33,224.0],"angle":0.0},{"kind":"hair","anchor":[231.86,106.35],"angle":0}],"body":[2,1427,221,266,141,57],"palm":[760,1697,23,28,338,219]},{"basePose":0,"hand":[350.78,230.78],"drawHand":[214.76,292.63],"nock":[214.76,292.63],"angle":6.95,"aim":-24.45,"pull":0.0148,"secondary":[{"kind":"cloth","anchor":[213.31,224.1],"angle":-0.13},{"kind":"hair","anchor":[231.06,106.67],"angle":-0.95}],"body":[499,884,223,267,141,56],"palm":[787,1697,24,28,339,217]},{"basePose":0,"hand":[354.36,225.56],"drawHand":[218.24,281.89],"nock":[218.24,281.89],"angle":6.56,"aim":-22.48,"pull":0.05,"secondary":[{"kind":"cloth","anchor":[213.24,224.33],"angle":-0.4},{"kind":"hair","anchor":[229.49,107.27],"angle":-2.61}],"body":[726,884,227,267,141,56],"palm":[815,1697,24,28,343,212]},{"basePose":0,"hand":[359.5,216.04],"drawHand":[223.23,266.12],"nock":[223.23,266.12],"angle":5.25,"aim":-20.18,"pull":0.1012,"secondary":[{"kind":"cloth","anchor":[213.15,224.65],"angle":-0.81},{"kind":"hair","anchor":[227.35,108.09],"angle":-4.73}],"body":[2,1156,232,267,141,56],"palm":[843,1697,24,28,348,203]},{"basePose":0,"hand":[365.25,200.51],"drawHand":[229.18,246.47],"nock":[229.18,246.47],"angle":2.13,"aim":-18.66,"pull":0.18,"secondary":[{"kind":"cloth","anchor":[213.04,225.12],"angle":-1.38},{"kind":"hair","anchor":[224.43,109.26],"angle":-7.54}],"body":[2,884,239,268,141,55],"palm":[2,1964,25,27,353,188]},{"basePose":1,"hand":[371.02,177.57],"drawHand":[236.68,226.79],"nock":[236.68,226.79],"angle":-11.78,"aim":-20.12,"pull":0.3338,"secondary":[{"kind":"cloth","anchor":[222.69,222.13],"angle":-2.81},{"kind":"hair","anchor":[216.89,113.17],"angle":-11.7}],"body":[490,1427,249,264,141,59],"palm":[871,1697,25,28,359,164]},{"basePose":1,"hand":[371.38,150.91],"drawHand":[242.05,207.83],"nock":[242.05,207.83],"angle":-18.91,"aim":-23.75,"pull":0.4849,"secondary":[{"kind":"cloth","anchor":[222.45,222.75],"angle":-3.81},{"kind":"hair","anchor":[212.86,115.59],"angle":-15.84}],"body":[743,1427,250,263,140,60],"palm":[31,1964,26,27,359,138]},{"basePose":1,"hand":[368.99,122.01],"drawHand":[247.5,188.22],"nock":[247.5,188.22],"angle":-27.2,"aim":-28.59,"pull":0.6234,"secondary":[{"kind":"cloth","anchor":[222.26,223.27],"angle":-4.65},{"kind":"hair","anchor":[209.29,118.31],"angle":-20.32}],"body":[2,1697,250,263,138,60],"palm":[91,1964,27,25,356,110]},{"basePose":1,"hand":[362.13,92.43],"drawHand":[251.75,170.81],"nock":[251.75,170.81],"angle":-36.75,"aim":-35.37,"pull":0.7551,"secondary":[{"kind":"cloth","anchor":[222.08,223.81],"angle":-5.51},{"kind":"hair","anchor":[206.07,120.75],"angle":-24.05}],"body":[256,1697,246,261,135,62],"palm":[122,1964,28,25,349,80]},{"basePose":1,"hand":[353.43,69.81],"drawHand":[254.09,159.1],"nock":[254.09,159.1],"angle":-44.98,"aim":-41.95,"pull":0.8521,"secondary":[{"kind":"cloth","anchor":[221.94,224.25],"angle":-6.21},{"kind":"hair","anchor":[203.73,122.41],"angle":-26.36}],"body":[239,597,238,271,134,52],"palm":[154,1964,28,25,340,58]},{"basePose":1,"hand":[346.96,57.89],"drawHand":[254.95,153.61],"nock":[254.95,153.61],"angle":-49.82,"aim":-46.13,"pull":0.9199,"secondary":[{"kind":"cloth","anchor":[221.86,224.51],"angle":-6.64},{"kind":"hair","anchor":[202.33,123.49],"angle":-27.86}],"body":[2,597,233,283,133,40],"palm":[186,1964,28,25,334,46]},{"basePose":1,"hand":[341.94,50.27],"drawHand":[255.35,150.37],"nock":[255.35,150.37],"angle":-53.17,"aim":-49.14,"pull":0.9736,"secondary":[{"kind":"cloth","anchor":[221.82,224.69],"angle":-6.93},{"kind":"hair","anchor":[201.34,124.29],"angle":-28.95}],"body":[202,301,226,291,135,32],"palm":[218,1964,28,25,329,38]},{"basePose":1,"hand":[340.6,49.12],"drawHand":[255.2,150.27],"nock":[255.2,150.27],"angle":-53.84,"aim":-49.82,"pull":0.9938,"secondary":[{"kind":"cloth","anchor":[221.8,224.74],"angle":-7.01},{"kind":"hair","anchor":[201.13,124.37],"angle":-29.0}],"body":[244,2,225,292,135,31],"palm":[250,1964,28,25,327,37]},{"basePose":1,"hand":[340.25,48.86],"drawHand":[255.15,150.28],"nock":[255.15,150.28],"angle":-54.0,"aim":-50.0,"pull":1.0,"secondary":[{"kind":"cloth","anchor":[221.8,224.76],"angle":-7.03},{"kind":"hair","anchor":[201.08,124.38],"angle":-29.0}],"body":[473,2,224,292,135,31],"palm":[282,1964,28,25,327,37]},{"basePose":1,"hand":[340.25,48.86],"drawHand":[255.15,150.28],"nock":[255.15,150.28],"angle":-54,"aim":-50.0,"pull":1,"secondary":[{"kind":"cloth","anchor":[221.8,224.76],"angle":-7.03},{"kind":"hair","anchor":[201.08,124.38],"angle":-29}],"body":[701,2,224,292,135,31],"palm":[314,1964,28,25,327,37]},{"basePose":2,"hand":[318.56,49.59],"drawHand":[221.46,159.34],"nock":[221.46,159.34],"angle":-52.53,"aim":-48.5,"pull":0.31,"secondary":[{"kind":"cloth","anchor":[221.12,221.65],"angle":-7.98},{"kind":"hair","anchor":[200.09,122.63],"angle":-29}],"body":[2,301,196,292,141,31],"palm":[473,1964,29,24,305,38]},{"basePose":2,"hand":[312.62,46.55],"drawHand":[199.31,165.55],"nock":[199.31,165.55],"angle":-50.47,"aim":-46.4,"pull":0,"secondary":[{"kind":"cloth","anchor":[221.19,221.52],"angle":-7.69},{"kind":"hair","anchor":[201.09,121.44],"angle":-27.26}],"body":[2,2,238,295,93,28],"palm":[506,1964,29,24,299,35]},{"basePose":2,"hand":[318.82,49.7],"drawHand":[196.55,165.35],"nock":[196.55,165.35],"angle":-47.56,"aim":-43.41,"pull":0.025,"secondary":[{"kind":"cloth","anchor":[221.29,221.26],"angle":-7.28},{"kind":"hair","anchor":[202.34,120.4],"angle":-25.81}],"body":[432,301,227,291,110,32],"palm":[346,1964,29,25,305,38]},{"basePose":2,"hand":[326.16,53.98],"drawHand":[199.76,163.9],"nock":[199.76,163.9],"angle":-45.24,"aim":-41.01,"pull":0,"secondary":[{"kind":"cloth","anchor":[221.37,221.06],"angle":-6.95},{"kind":"hair","anchor":[203.27,119.76],"angle":-24.94}],"body":[663,301,251,287,94,36],"palm":[379,1964,28,25,313,42]},{"basePose":2,"hand":[343.51,70.13],"drawHand":[206.08,163.72],"nock":[206.08,163.72],"angle":-38.13,"aim":-34.26,"pull":0,"secondary":[{"kind":"cloth","anchor":[221.61,220.51],"angle":-6.05},{"kind":"hair","anchor":[205.84,118.09],"angle":-22.62}],"body":[481,597,243,271,119,52],"palm":[411,1964,28,25,330,58]},{"basePose":2,"hand":[360.45,92.9],"drawHand":[214.77,163.96],"nock":[214.77,163.96],"angle":-29.44,"aim":-26.0,"pull":0,"secondary":[{"kind":"cloth","anchor":[221.94,219.78],"angle":-4.91},{"kind":"hair","anchor":[209.77,115.12],"angle":-17.98}],"body":[238,1156,238,267,141,56],"palm":[443,1964,26,25,348,81]},{"basePose":2,"hand":[371.67,122.26],"drawHand":[225.27,171.41],"nock":[225.27,171.41],"angle":-20.39,"aim":-18.56,"pull":0,"secondary":[{"kind":"cloth","anchor":[222.26,219.09],"angle":-3.76},{"kind":"hair","anchor":[213.47,112.9],"angle":-14.5}],"body":[245,884,250,268,141,55],"palm":[61,1964,26,26,359,110]},{"basePose":2,"hand":[375.9,155.99],"drawHand":[231.11,187.44],"nock":[231.11,187.44],"angle":-10.9,"aim":-12.26,"pull":0,"secondary":[{"kind":"cloth","anchor":[222.66,218.32],"angle":-2.45},{"kind":"hair","anchor":[218.0,110.36],"angle":-10.15}],"body":[728,597,253,269,141,54],"palm":[900,1697,25,28,364,143]},{"basePose":1,"hand":[381.22,183.26],"drawHand":[244.04,209.23],"nock":[244.04,209.23],"angle":-7.44,"aim":-10.72,"pull":0,"secondary":[{"kind":"cloth","anchor":[223.08,221.2],"angle":-1.27},{"kind":"hair","anchor":[222.94,110.26],"angle":-6.38}],"body":[227,1427,259,265,141,58],"palm":[929,1697,24,28,370,170]},{"basePose":0,"hand":[365.06,209.2],"drawHand":[228.64,249.63],"nock":[228.64,249.63],"angle":5.11,"aim":-16.51,"pull":0,"secondary":[{"kind":"cloth","anchor":[182.48,207.34],"angle":-0.57},{"kind":"hair","anchor":[228.59,107.6],"angle":-3.48}],"body":[480,1156,238,267,141,56],"palm":[957,1697,25,28,353,196]},{"basePose":0,"hand":[354.35,226.23],"drawHand":[218.25,281.93],"nock":[218.25,281.93],"angle":6.81,"aim":-22.26,"pull":0,"secondary":[{"kind":"cloth","anchor":[195.27,216.7],"angle":-0.17},{"kind":"hair","anchor":[230.95,106.66],"angle":-0.87}],"body":[722,1156,227,267,141,56],"palm":[732,1697,24,29,343,212]},{"basePose":0,"hand":[349.0,233.0],"drawHand":[213.0,298.0],"nock":[213.0,298.0],"angle":7,"aim":-25.55,"pull":0,"secondary":[{"kind":"cloth","anchor":[213.33,224.0],"angle":0.0},{"kind":"hair","anchor":[231.86,106.35],"angle":0}],"body":[2,1427,221,266,141,57],"palm":[760,1697,23,28,338,219]}]},"archer-season2":{"lower":[1374,931,204,167,108,313],"frames":[{"basePose":0,"hand":[330.0,209.0],"drawHand":[214.0,288.0],"nock":[214.0,288.0],"angle":7,"aim":-34.26,"pull":0,"secondary":[{"kind":"cloth","anchor":[202.67,280.89],"angle":0.0},{"kind":"hair","anchor":[215.01,95.3],"angle":0}],"body":[699,659,221,267,121,46],"palm":[409,1187,17,17,322,201]},{"basePose":0,"hand":[331.26,205.92],"drawHand":[214.28,281.58],"nock":[214.28,281.58],"angle":6.95,"aim":-32.89,"pull":0.0148,"secondary":[{"kind":"cloth","anchor":[202.67,280.89],"angle":-0.0},{"kind":"hair","anchor":[214.41,95.55],"angle":-0.95}],"body":[924,659,223,267,121,46],"palm":[1582,931,18,19,323,197]},{"basePose":0,"hand":[333.6,199.07],"drawHand":[214.76,268.8],"nock":[214.76,268.8],"angle":6.56,"aim":-30.4,"pull":0.05,"secondary":[{"kind":"cloth","anchor":[202.67,280.89],"angle":-0.0},{"kind":"hair","anchor":[213.18,96.02],"angle":-2.61}],"body":[2,659,225,268,121,45],"palm":[1604,931,18,19,325,190]},{"basePose":0,"hand":[336.5,187.37],"drawHand":[215.26,250.17],"nock":[215.26,250.17],"angle":5.25,"aim":-27.38,"pull":0.1012,"secondary":[{"kind":"cloth","anchor":[202.67,280.89],"angle":-0.0},{"kind":"hair","anchor":[211.47,96.66],"angle":-4.73}],"body":[231,659,228,268,121,45],"palm":[116,1187,18,18,328,179]},{"basePose":0,"hand":[338.68,169.67],"drawHand":[215.48,227.22],"nock":[215.48,227.22],"angle":2.13,"aim":-25.04,"pull":0.18,"secondary":[{"kind":"cloth","anchor":[202.67,280.89],"angle":-0.0},{"kind":"hair","anchor":[209.11,97.58],"angle":-7.54}],"body":[1515,338,231,269,121,44],"palm":[1626,931,18,19,330,161]},{"basePose":1,"hand":[354.78,144.69],"drawHand":[214.28,208.63],"nock":[214.28,208.63],"angle":-11.78,"aim":-24.47,"pull":0.3338,"secondary":[{"kind":"cloth","anchor":[225.11,245.33],"angle":-0.0},{"kind":"hair","anchor":[202.19,115.51],"angle":-11.7}],"body":[1380,659,248,252,121,61],"palm":[138,1187,18,18,346,136]},{"basePose":1,"hand":[353.44,115.18],"drawHand":[213.2,188.61],"nock":[213.2,188.61],"angle":-18.91,"aim":-27.64,"pull":0.4849,"secondary":[{"kind":"cloth","anchor":[225.11,245.33],"angle":-0.0},{"kind":"hair","anchor":[199.57,117.18],"angle":-15.84}],"body":[2,931,248,252,120,61],"palm":[1648,931,18,19,345,106]},{"basePose":1,"hand":[348.91,83.82],"drawHand":[211.97,168.48],"nock":[211.97,168.48],"angle":-27.2,"aim":-31.73,"pull":0.6234,"secondary":[{"kind":"cloth","anchor":[225.11,245.33],"angle":-0.0},{"kind":"hair","anchor":[197.4,118.91],"angle":-20.32}],"body":[854,931,245,251,119,62],"palm":[1670,931,19,19,340,75]},{"basePose":1,"hand":[339.04,52.27],"drawHand":[210.35,150.99],"nock":[210.35,150.99],"angle":-36.75,"aim":-37.49,"pull":0.7551,"secondary":[{"kind":"cloth","anchor":[225.11,245.33],"angle":-0.0},{"kind":"hair","anchor":[195.31,120.51],"angle":-24.05}],"body":[1274,338,237,274,118,39],"palm":[1693,931,19,19,330,43]},{"basePose":1,"hand":[327.42,28.61],"drawHand":[208.81,139.39],"nock":[208.81,139.39],"angle":-44.98,"aim":-43.05,"pull":0.8521,"secondary":[{"kind":"cloth","anchor":[225.11,245.33],"angle":-0.0},{"kind":"hair","anchor":[193.68,121.64],"angle":-26.36}],"body":[722,338,226,297,117,16],"palm":[160,1187,18,18,319,20]},{"basePose":1,"hand":[319.16,16.45],"drawHand":[207.88,134.21],"nock":[207.88,134.21],"angle":-49.82,"aim":-46.62,"pull":0.9199,"secondary":[{"kind":"cloth","anchor":[225.11,245.33],"angle":-0.0},{"kind":"hair","anchor":[192.72,122.36],"angle":-27.86}],"body":[213,338,219,309,116,4],"palm":[182,1187,19,18,310,8]},{"basePose":1,"hand":[312.89,8.83],"drawHand":[207.23,131.26],"nock":[207.23,131.26],"angle":-53.17,"aim":-49.2,"pull":0.9736,"secondary":[{"kind":"cloth","anchor":[225.11,245.33],"angle":-0.0},{"kind":"hair","anchor":[191.33,124.59],"angle":-28.95}],"body":[2,338,207,317,121,-4],"palm":[1716,931,19,19,304,0]},{"basePose":1,"hand":[311.24,7.74],"drawHand":[207.05,131.19],"nock":[207.05,131.19],"angle":-53.84,"aim":-49.84,"pull":0.9938,"secondary":[{"kind":"cloth","anchor":[225.11,245.33],"angle":-0.0},{"kind":"hair","anchor":[191.16,124.76],"angle":-29.0}],"body":[1513,2,206,318,121,-5],"palm":[205,1187,19,18,302,-1]},{"basePose":1,"hand":[310.8,7.5],"drawHand":[207.01,131.2],"nock":[207.01,131.2],"angle":-54.0,"aim":-50.0,"pull":1.0,"secondary":[{"kind":"cloth","anchor":[225.11,245.33],"angle":-0.0},{"kind":"hair","anchor":[191.11,124.78],"angle":-29.0}],"body":[1095,2,205,319,121,-6],"palm":[228,1187,19,18,302,-1]},{"basePose":1,"hand":[310.8,7.5],"drawHand":[207.01,131.2],"nock":[207.01,131.2],"angle":-54,"aim":-50.0,"pull":1,"secondary":[{"kind":"cloth","anchor":[225.11,245.33],"angle":-0.0},{"kind":"hair","anchor":[191.11,124.78],"angle":-29}],"body":[1304,2,205,319,121,-6],"palm":[251,1187,19,18,302,-1]},{"basePose":2,"hand":[306.99,-3.64],"drawHand":[181.6,138.58],"nock":[181.6,138.58],"angle":-52.48,"aim":-48.6,"pull":0.31,"secondary":[{"kind":"cloth","anchor":[229.67,241.78],"angle":-0.0},{"kind":"hair","anchor":[188.51,124.9],"angle":-29}],"body":[251,2,323,330,0,-17],"palm":[274,1187,19,18,298,-12]},{"basePose":2,"hand":[304.06,-4.96],"drawHand":[163.89,143.46],"nock":[163.89,143.46],"angle":-50.35,"aim":-46.64,"pull":0,"secondary":[{"kind":"cloth","anchor":[229.67,241.78],"angle":-0.0},{"kind":"hair","anchor":[189.05,124.39],"angle":-27.26}],"body":[2,2,245,332,75,-19],"palm":[2,1187,19,19,295,-14]},{"basePose":2,"hand":[311.81,-1.21],"drawHand":[161.82,142.8],"nock":[161.82,142.8],"angle":-47.34,"aim":-43.83,"pull":0.025,"secondary":[{"kind":"cloth","anchor":[229.67,241.78],"angle":-0.0},{"kind":"hair","anchor":[189.83,123.69],"angle":-25.81}],"body":[578,2,249,328,79,-15],"palm":[25,1187,19,19,303,-10]},{"basePose":2,"hand":[319.95,3.26],"drawHand":[164.53,141.2],"nock":[164.53,141.2],"angle":-44.94,"aim":-41.59,"pull":0,"secondary":[{"kind":"cloth","anchor":[229.67,241.78],"angle":-0.0},{"kind":"hair","anchor":[190.47,123.21],"angle":-24.94}],"body":[831,2,260,324,76,-11],"palm":[48,1187,19,19,311,-6]},{"basePose":2,"hand":[339.66,20.72],"drawHand":[170.76,140.79],"nock":[170.76,140.79],"angle":-37.58,"aim":-35.41,"pull":0,"secondary":[{"kind":"cloth","anchor":[229.67,241.78],"angle":-0.0},{"kind":"hair","anchor":[192.0,121.95],"angle":-22.62}],"body":[436,338,282,307,73,6],"palm":[297,1187,18,18,331,12]},{"basePose":2,"hand":[359.52,45.43],"drawHand":[179.59,140.32],"nock":[179.59,140.32],"angle":-28.58,"aim":-27.81,"pull":0,"secondary":[{"kind":"cloth","anchor":[229.67,241.78],"angle":-0.0},{"kind":"hair","anchor":[193.79,119.98],"angle":-17.98}],"body":[952,338,318,282,57,31],"palm":[319,1187,18,18,351,37]},{"basePose":2,"hand":[372.95,78.24],"drawHand":[191.32,147.87],"nock":[191.32,147.87],"angle":-19.2,"aim":-20.97,"pull":0,"secondary":[{"kind":"cloth","anchor":[229.67,241.78],"angle":-0.0},{"kind":"hair","anchor":[195.05,119.43],"angle":-14.5}],"body":[1103,931,267,251,121,62],"palm":[341,1187,18,18,364,70]},{"basePose":2,"hand":[377.88,117.39],"drawHand":[201.22,164.63],"nock":[201.22,164.63],"angle":-9.36,"aim":-14.97,"pull":0,"secondary":[{"kind":"cloth","anchor":[229.67,241.78],"angle":-0.0},{"kind":"hair","anchor":[197.83,117.43],"angle":-10.15}],"body":[254,931,330,252,62,61],"palm":[363,1187,19,18,369,109]},{"basePose":1,"hand":[369.2,149.95],"drawHand":[216.23,187.65],"nock":[216.23,187.65],"angle":-7.44,"aim":-13.84,"pull":0,"secondary":[{"kind":"cloth","anchor":[225.11,245.33],"angle":-0.0},{"kind":"hair","anchor":[206.89,121.06],"angle":-6.38}],"body":[588,931,262,252,121,61],"palm":[71,1187,19,19,360,141]},{"basePose":0,"hand":[340.43,177.88],"drawHand":[216.13,230.44],"nock":[216.13,230.44],"angle":5.11,"aim":-22.92,"pull":0,"secondary":[{"kind":"cloth","anchor":[203.32,239.53],"angle":-0.0},{"kind":"hair","anchor":[212.47,96.3],"angle":-3.48}],"body":[463,659,232,268,121,45],"palm":[94,1187,18,19,332,169]},{"basePose":0,"hand":[333.74,199.66],"drawHand":[214.83,268.77],"nock":[214.83,268.77],"angle":6.81,"aim":-30.17,"pull":0,"secondary":[{"kind":"cloth","anchor":[201.68,268.72],"angle":-0.0},{"kind":"hair","anchor":[214.29,95.55],"angle":-0.87}],"body":[1151,659,225,267,121,46],"palm":[386,1187,19,18,325,191]},{"basePose":0,"hand":[330.0,209.0],"drawHand":[214.0,288.0],"nock":[214.0,288.0],"angle":7,"aim":-34.26,"pull":0,"secondary":[{"kind":"cloth","anchor":[202.67,280.89],"angle":0.0},{"kind":"hair","anchor":[215.01,95.3],"angle":0}],"body":[699,659,221,267,121,46],"palm":[409,1187,17,17,322,201]}]}}};

;
/* ./twilight-rain.js */
'use strict';
// Registered body poses for the skyward loose. The combat clock and the two rainfall hits
// are independent of display cadence. The same draw list is consumed by Unity and Canvas.
const twilightRain=(()=>{
 const pictures=new Map(),release=112,rad=Math.PI/180;
 const times=TWILIGHT_RAIN_POSES.times,releaseIndex=times.indexOf(release);
 function sheet(key){
  if(!TWILIGHT_RAIN_POSES.skins[key])return null;
  let item=pictures.get(key);
  if(!item){
   item=loadAppearanceImage('./assets/twilight-rain/'+key+'.webp?v=140');
   pictures.set(key,item);
   if(pictures.size>8)pictures.delete(pictures.keys().next().value);
  }
  return item;
 }
 function ready(key){return sheet(key)?.loaded}
 function sample(key,time){
  const texture=sheet(key);
  if(!texture?.ready)return null;
  const skin=TWILIGHT_RAIN_POSES.skins[key];
  let i=0;
  while(i<times.length-1&&time>=(times[i]+times[i+1])*.5)i++;
  return {image:texture.image,lower:skin.lower,index:i,frame:skin.frames[i]};
 }
 function arrowTip(frame){
  const a=frame.aim*rad;
  return [frame.hand[0]+9*Math.cos(a),frame.hand[1]+9*Math.sin(a)];
 }
 function releaseTip(key){
  const skin=TWILIGHT_RAIN_POSES.skins[key];
  return skin&&pictures.get(key)?.ready?arrowTip(skin.frames[releaseIndex]):null;
 }
 function paint(ctx,img,rig,key,time,action,secondary,weapon,paintPose){
  const {image,lower,frame}=action.twilight;
  const bow=rig.parts.find(part=>part.kind==='bow'),angle=frame.angle*rad;
  const socket={hand:frame.hand,nock:frame.nock,pull:frame.pull,released:time>release};
  const projection=weaponDepth.view(key,bow,frame.basePose,frame.angle,action.clock,1,true,weapon,socket);
  if(projection)weaponDepth.paint(ctx,projection,false);
  secondaryMotion.paint(ctx,secondary,false,frame.secondary);
  paintPose(ctx,image,lower);paintPose(ctx,image,frame.body);
  secondaryMotion.paint(ctx,secondary,true,frame.secondary);
  if(projection)weaponDepth.paint(ctx,projection,true);
  else{
   // The registered native limb remains attached while an equipped bow's depth views decode.
   const [sx,sy,w,h]=bow.rect,[px,py]=bow.pivot;
   const ends=bow.stringTips.map(([x,y])=>[frame.hand[0]+(x-px)*Math.cos(angle)-(y-py)*Math.sin(angle),
    frame.hand[1]+(x-px)*Math.sin(angle)+(y-py)*Math.cos(angle)]);
   const nock=time<=release?frame.nock:ends[0].map((v,i)=>{
    const middle=(v+ends[1][i])/2;return middle+(frame.nock[i]-middle)*frame.pull;
   });
   ctx.save();ctx.strokeStyle='#e4daaf';ctx.lineWidth=1.4;ctx.beginPath();
   ctx.moveTo(...ends[0]);ctx.lineTo(...nock);ctx.lineTo(...ends[1]);ctx.stroke();
   ctx.translate(...frame.hand);ctx.rotate(angle);ctx.drawImage(img,sx,sy,w,h,-px,-py,w,h);ctx.restore();
  }
  const tip=arrowTip(frame);
  if(action.nocked&&time>=58){
   const draw=typeof rangedCombat==='undefined'?archerFlight.nocked:rangedCombat.drawNockedArrow;
   ctx.save();
   ctx.globalAlpha=Math.min(1,(time-58)/17);
   draw(ctx,frame.nock,tip,frame.nock,57);
   ctx.restore();
  }
  paintPose(ctx,image,frame.palm);
  return tip;
 }
 return {ready,sample,releaseTip,paint};
})();

;
/* ./paladin-motion-art.js */
'use strict';
const PALADIN_MOTION={"paladin-0":[{"base":2,"grip":[213.55,90.85],"body":[2,2,446,428,26,53],"palm":[2,514,56,74,198,73]},{"base":2,"grip":[277.18,94.28],"body":[514,2,446,428,26,53],"palm":[514,514,44,80,249,76]},{"base":2,"grip":[305.65,125.44],"body":[1026,2,446,428,26,53],"palm":[1026,514,73,57,250,110]},{"base":2,"grip":[302.72,190.18],"body":[1538,2,446,428,26,53],"palm":[1538,514,80,44,241,162]}],"paladin-1":[{"base":2,"grip":[206.31,100.9],"body":[2,2,420,423,12,57],"palm":[2,514,55,75,191,83]},{"base":2,"grip":[263.52,100.81],"body":[514,2,420,423,12,57],"palm":[514,514,45,79,234,83]},{"base":2,"grip":[290.59,127.33],"body":[1026,2,420,423,12,57],"palm":[1026,514,74,55,234,113]},{"base":2,"grip":[291.19,185.52],"body":[1538,2,420,423,12,57],"palm":[1538,514,79,45,230,156]}],"paladin-2":[{"base":2,"grip":[256.6,115.08],"body":[2,2,448,411,50,69],"palm":[2,514,56,74,241,97]},{"base":2,"grip":[311.1,115.95],"body":[514,2,448,411,50,69],"palm":[514,514,44,79,282,98]},{"base":2,"grip":[336.45,141.66],"body":[1026,2,448,411,50,69],"palm":[1026,514,73,57,281,126]},{"base":2,"grip":[336.05,197.1],"body":[1538,2,448,411,50,69],"palm":[1538,514,79,44,275,168]}],"paladin-3":[{"base":2,"grip":[254.95,110.5],"body":[2,2,448,417,33,63],"palm":[2,514,57,74,239,93]},{"base":2,"grip":[308.56,112.29],"body":[514,2,448,417,33,63],"palm":[514,514,44,80,280,94]},{"base":2,"grip":[333.06,138.02],"body":[1026,2,448,417,33,63],"palm":[1026,514,74,58,277,122]},{"base":2,"grip":[331.71,192.56],"body":[1538,2,448,417,33,63],"palm":[1538,514,80,44,270,164]}],"paladin-4":[{"base":2,"grip":[284.12,148.21],"body":[2,2,448,381,42,100],"palm":[2,514,49,77,270,130]},{"base":2,"grip":[331.39,151.02],"body":[514,2,448,381,42,100],"palm":[514,514,51,76,297,134]},{"base":2,"grip":[352.42,174.29],"body":[1026,2,448,381,42,100],"palm":[1026,514,76,51,294,160]},{"base":2,"grip":[349.98,222.39],"body":[1538,2,448,381,42,100],"palm":[1538,514,76,51,291,188]}],"paladin-5":[{"base":2,"grip":[257.84,116.02],"body":[2,2,448,397,52,84],"palm":[2,514,50,77,243,98]},{"base":2,"grip":[315.95,115.92],"body":[514,2,448,397,52,84],"palm":[514,514,49,76,282,99]},{"base":2,"grip":[343.46,142.85],"body":[1026,2,448,397,52,84],"palm":[1026,514,76,51,285,128]},{"base":2,"grip":[344.08,201.95],"body":[1538,2,448,397,52,84],"palm":[1538,514,76,49,285,168]}],"paladin-event":[{"base":2,"grip":[259.08,89.96],"body":[2,2,274,432,88,48],"palm":[2,514,29,31,245,74]},{"base":2,"grip":[324.46,89.73],"body":[514,2,274,432,88,48],"palm":[514,514,28,30,311,75]},{"base":2,"grip":[355.46,119.97],"body":[1026,2,286,432,88,48],"palm":[1026,514,30,28,341,106]},{"base":2,"grip":[356.27,186.46],"body":[1538,2,285,432,88,48],"palm":[1538,514,30,28,341,173]}],"paladin-season2":[{"base":2,"grip":[290.15,83.19],"body":[2,2,382,421,45,59],"palm":[2,514,21,21,280,72]},{"base":2,"grip":[364.64,84.61],"body":[514,2,382,421,45,59],"palm":[514,514,21,21,355,74]},{"base":2,"grip":[399.17,119.87],"body":[1026,2,382,421,45,59],"palm":[1026,514,21,20,389,110]},{"base":2,"grip":[398.39,195.64],"body":[1538,2,382,421,45,59],"palm":[1538,514,21,21,388,186]}]};

;
/* ./paladin-motion.js */
'use strict';
// The plated forearm, gauntlet and palm are registered together on each painted cel.
// The complete figure uses the contact pose's feet, shield, cape and hair attachments.
const paladinMotion=(()=>{
 const sheets=new Map(),ranks=new Map();
 function sheet(key){
  let item=sheets.get(key);
  if(!item){item=loadAppearanceImage('./assets/paladin-motion/'+key+'.webp');sheets.set(key,item)}
  return item;
 }
 function ready(key){return PALADIN_MOTION[key]&&sheet(key).loaded}
 function frameIndex(t,action){
  if(t===null||t<=0||t>=650||action?.walk)return -1;
  let swing,follow;
  if(!action){
   if(t>=157&&t<270)swing=(t-157)/113;
   else if(t>=287&&t<349)follow=(t-287)/62;
  }else if(action.from===1&&action.to===2)swing=action.mix;
  else if(action.from===2&&action.to===1)swing=1-action.mix;
  else if(action.from===2&&action.to===3)follow=action.mix;
  return swing>=.1&&swing<.84?(swing<.33?0:swing<.6?1:2):follow>=.12&&follow<.68?3:-1;
 }
 function sample(key,t,action){
  if(!PALADIN_MOTION[key])return null;
  const i=frameIndex(t,action);
  if(i<0||!sheet(key).ready)return null;
  let frames=ranks.get(key);
  if(!frames){
   const part=SKIN_RIGS[key].parts.find(p=>p.kind==='mace');
   frames=PALADIN_MOTION[key].map((frame,index)=>{
    const hands=part.hands.slice();hands[frame.base]=frame.grip;
    return {...frame,index,image:sheet(key).image,mace:{...part,hands}};
   });
   ranks.set(key,frames);
  }
  return frames[i];
 }
 return {sample,ready,frameIndex};
})();

;
/* ./skin-motion.js */
'use strict';
function heroRigURL(key){return './assets/hero-rigs/'+key+'.webp?v='+(['paladin-1','paladin-2','paladin-3'].includes(key)?137:135)}

// All positions are in the 512-unit painted pose. Only translation and rotation move equipment.
const skinMotion=(()=>{
 const DEG=Math.PI/180;
 const timing={
  warrior:[145,270],shadow:[95,270],paladin:[163,270],mage:[112,151],archer:[102,137]
 };
 const flourish={sword:[-7,5],dagger:[-26,18],offhand:[18,-19],mace:[-14,12],shield:[-13,7],staff:[-13,15],book:[-8,9],bow:[-6,5]};
 const swingTracks=new WeakMap();
 const unit=t=>Math.max(0,Math.min(1,t));
 const ease=t=>{t=unit(t);return t*t*(3-2*t)};
 const clamp=unit;
 const sample=(first,last,t)=>Math.round(first+(last-first)*unit(t));
 const arc=(a,b)=>(b-a+540)%360-180;
 // Time-weighted, monotone cubic interpolation. Interior keys keep their angular velocity.
 // A direction reversal stops at its key, even when the neighbouring spans differ in length.
 function tangent(a,b){
  return a*b>0?2*a*b/(a+b):0;
 }
 function track(keys,time){
  let i=0;while(i<keys.length-2&&time>keys[i+1][0])i++;
  const [start,a]=keys[i],[end,b]=keys[i+1],dt=end-start,t=unit((time-start)/dt);
  const slope=(b-a)/dt,prev=keys[i-1],next=keys[i+2];
  const m0=prev?tangent((a-prev[1])/(start-prev[0]),slope):0;
  const m1=next?tangent(slope,(next[1]-b)/(next[0]-end)):0;
  return a+(b-a)*t*t*(3-2*t)+dt*t*(1-t)*((1-t)*m0-t*m1);
 }
 // Closed-form response to one impulse. Units are seconds; frame cadence never changes the trajectory.
 function spring(state,now){
  const t=Math.max(0,(now-state.at)/1000)*state.speed;
  if(t>.75)return {x:0,v:0};
  const {frequency:w,damping:d}=state,decay=Math.exp(-d*t);
  const a=state.x,b=(state.v+d*a)/w,c=Math.cos(w*t),n=Math.sin(w*t);
  const x=decay*(a*c+b*n);
  return {x,v:decay*w*(b*c-a*n)-d*x};
 }
 function impulse(previous,now,strength,mass,speed){
  const prior=previous?spring(previous,now):{x:0,v:0};
  return {at:now,x:prior.x,v:Math.max(-260,Math.min(260,prior.v*(previous?.speed||speed)/speed+strength/mass)),
   damping:17/Math.sqrt(mass),frequency:20/Math.sqrt(mass),speed};
 }
 // Hermite tangents join the whole stride. A planted foot can hold while its hips keep travelling.
 function stridePath(points){
  const count=points.length,slopes=points.map((point,i)=>[1,2,3].map(k=>{
   if(!i||i===count-1)return 0;
   const prev=points[i-1],next=points[i+1];
   const a=((point[k]||0)-(prev[k]||0))/(point[0]-prev[0]);
   const b=((next[k]||0)-(point[k]||0))/(next[0]-point[0]);
   return a*b<=0?0:2*a*b/(a+b);
  }));
  const output=[];
  for(let i=0;i<count-1;i++){
   const a=points[i],b=points[i+1],dt=b[0]-a[0],steps=Math.max(1,Math.ceil(dt/16));
   for(let j=0;j<steps;j++){
    const t=j/steps,t2=t*t,t3=t2*t;
    const pose=[a[0]+dt*t];
    for(let k=1;k<=3;k++)pose.push((2*t3-3*t2+1)*(a[k]||0)+(t3-2*t2+t)*dt*slopes[i][k-1]+(-2*t3+3*t2)*(b[k]||0)+(t3-t2)*dt*slopes[i+1][k-1]);
    output.push(pose);
   }
  }
  output.push(points[count-1]);return output;
 }
 // Shared by adventure and the world-boss camera; distances are in scene pixels.
 function attackStride(job,heroSize,d,melee,hits,effect='',skillId=-1){
  if(job==='archer'&&skillId===57)return [[0,0,0,0],[650,0,0,0]];
  const heavy=effect==='quake'||effect==='holy';
  const rush=effect==='dash'||job==='shadow',brace=effect==='shield';
  const lean=brace?1.8:heavy?3.8:rush?4:2.8;
  const lift=heroSize*(melee?(heavy?.052:rush?.038:brace?.008:.022):.010);
  const plant=heavy?181:rush?125:brace?154:160,contactReach=brace?d*.67:d;
  const pull=heroSize*(heavy?.062:rush?.024:.038);
  const path=[[0,0,0,0],[72,-pull*.48,-lean*.5,.6],[plant,-pull,-lean,heavy?-lift*.9:1.8],
   [218,contactReach*(rush?.70:.51),.5,-lift],[254,contactReach*.97,lean*.65,-lift*.26],
   [270,contactReach,lean*.72,0],[288,contactReach*.99,lean*.68,heavy?1.1:0]];
  for(let j=1;j<hits;j++){const t=270+j*70;path.push([t-20,contactReach*.91,-.5],[t,contactReach,1.5],[t+18,contactReach*.97,.5]);}
  const release=270+(hits-1)*70;
  path.push([release+42,contactReach*(heavy?.94:.86),.5,0],[Math.min(624,release+(heavy?160:125)),contactReach*.35,-.6,-lift*.40],[650,0,0,0]);
  return stridePath(path);
 }
 function strideAt(stride,t){
  let lo=0,hi=stride.length-1;
  while(hi-lo>1){const mid=(lo+hi)>>1;if(stride[mid][0]<=t)lo=mid;else hi=mid}
  const a=stride[lo],b=stride[hi];
  const u=unit((t-a[0])/(b[0]-a[0]));
  return [1,2,3].map(k=>(a[k]||0)+((b[k]||0)-(a[k]||0))*u);
 }
 function swing(part,job,time,hits=1,ranged=false){
  const a=part.angles;
  if(time===null||time<=0||time>=650)return a[0];
  const [wind,impact]=ranged&&job!=='mage'&&job!=='archer'?[108,145]:timing[job];
  const sword=job==='warrior'&&part.kind==='sword'&&!ranged;
  const [pull,push]=sword?[0,0]:(flourish[part.kind]||flourish.sword);
  let tracks=swingTracks.get(part);
  if(!tracks){tracks=new Map();swingTracks.set(part,tracks);}
  const id=hits*2+Number(ranged);
  if(!tracks.has(id)){
   let d=arc(a[0],a[1]);
   if(job==='warrior'&&part.kind==='sword'&&d>120)d-=360;
   const ready=a[0]+d+pull;
   let strike=ready+arc(ready,a[2])+push;
   if(job==='warrior'&&part.kind==='sword'&&strike-ready< -110)strike+=360;
   const last=impact+(hits-1)*70,follow=strike+arc(strike,a[3]);
   const snap=sword?wind:Math.max(wind,impact-(job==='archer'?30:job==='mage'?42:78));
   const keys=[[0,a[0]],[wind,ready]];
   if(snap>wind)keys.push([snap,ready+.08*push]);
   // Accelerate through contact, then let the weapon's weight carry the follow-through.
   keys.push([impact-14,strike-Math.sign(strike-ready)*Math.min(18,Math.abs(strike-ready)*.09)],[impact,strike]);
   for(let j=1;j<hits;j++)keys.push([impact+(j-.52)*70,strike-(sword?15:1.1*push)],[impact+j*70,strike]);
   keys.push([last+Math.min(108,(650-last)*.40),follow],[650,follow+arc(follow,a[0])]);
   tracks.set(id,keys);
  }
  return track(tracks.get(id),time);
 }
 function rotated(part,pose,angle,point){
  const x=point[0]-part.pivot[0],y=point[1]-part.pivot[1],r=angle*DEG,h=part.hands[pose];
  return [h[0]+Math.cos(r)*x-Math.sin(r)*y,h[1]+Math.sin(r)*x+Math.cos(r)*y];
 }
 function tension(time,hits){
  if(time===null||time<0)return 0;
  if(time<137)return ease(time/115);
  const elapsed=time-137,beat=Math.floor(elapsed/70);
  if(beat<hits-1){const t=elapsed%70;return t<18?1-ease(t/18):ease((t-18)/52)}
  return 1-ease((elapsed-(hits-1)*70)/22);
 }
 function bowLine(part,pose,angle,time,hits){
  const [a,b]=part.stringTips.map(end=>rotated(part,pose,angle,end));
  const mid=[(a[0]+b[0])/2,(a[1]+b[1])/2];
  const wrist=part.drawHands?.[1];
  const pull=tension(time,hits);
  const dx=wrist?wrist[0]-mid[0]:-88;
  const dy=wrist?wrist[1]-mid[1]:0;
  return [a,[mid[0]+dx*pull,mid[1]+dy*pull],b];
 }
 function paintPose(ctx,img,region){
  if(!region)return;
  const [sx,sy,w,h,x,y]=region;
  ctx.drawImage(img,sx,sy,w,h,x,y,w,h);
 }
 function paintPart(ctx,img,part,pose,angle,time,hits){
  if(part.stringTips){
   const [a,nock,b]=bowLine(part,pose,angle,time,hits);
   ctx.save();ctx.beginPath();ctx.strokeStyle='rgba(230,214,179,.88)';ctx.lineWidth=1.45;
   ctx.moveTo(...a);ctx.lineTo(...nock);ctx.lineTo(...b);ctx.stroke();ctx.restore();
  }
  const [sx,sy,w,h]=part.rect;
  ctx.save();ctx.translate(...part.hands[pose]);ctx.rotate(angle*DEG);
  ctx.drawImage(img,sx,sy,w,h,-part.pivot[0],-part.pivot[1],w,h);
  ctx.restore();
 }
 const swordKeys=[[0,33],[80,-92],[132,-159],[167,-149],[208,-95],[247,-26],[270,3],[325,24],[395,32],[650,33]];
 function swordAngle(time,hits){
  const last=(hits-1)*70;
  if(time>270&&time<=270+last)return 3-17*Math.sin(Math.PI*((time-270)%70)/70);
  if(time>270)time=270+(time-270-last)*380/(380-last);
  return track(swordKeys,time);
 }
 // The combat clock selects a painted pose. A blade never interpolates through body pixels.
 function heroFrame(body,time,hits){
  const rangedClass=body==='mage'||body==='archer';
  const ready=body==='shadow'?95:body==='paladin'?163:body==='archer'?120:145;
  const release=body==='archer'?99:body==='mage'?115:225;
  if(rangedClass){const peak=body==='archer'?137:151;
   if(time<release)return sample(12,16,ease(time/release));
   if(time<peak)return sample(16,20,ease((time-release)/(peak-release)));
   if(time<270)return 20;
  }
  if(time<ready)return sample(12,16,ease(time/ready));
  if(time<release)return 16;
  if(time<270)return sample(16,20,ease((time-release)/(270-release)));
  const end=270+70*(hits-1);
  if(time<end){const beat=(time-270)%70;return beat<28?sample(20,22,beat/28):sample(22,20,(beat-28)/42)}
  if(time<end+35)return 20;
  if(time<end+90)return sample(20,24,ease((time-end-35)/55));
  const home=clamp((time-end-90)/Math.max(20,650-end-90));
  if(!rangedClass&&hits<=3&&home>.54)return sample(34,45,ease((home-.54)/.46));
  return sample(24,28,ease(home/(rangedClass||hits>3?1:.54)))%28;
 }
 const poseIndex=frame=>frame>=12&&frame<28?Math.round((frame-12)/4)%4:0;
 // Full-figure paintings and their blade bearings share one clock. The last
 // strike always has enough time to lower the sword and recover to guard.
 const eclipseStrokes=[[0,0],[45,4],[90,5],[134,1],[177,6],[216,7],[270,2],
  [309,8],[351,9],[400,10],[446,3],[536,11],[650,0]];
 const swordTransitions={'0-1':[0,4,5,1],'1-2':[1,6,7,2],'2-3':[2,8,9,10,3],'3-0':[3,11,0]};
 const forwardForms=new Set(['cleave','flurry','breaker','plant']);
 function eclipseTime(time,hits){
  const last=270+70*(hits-1);
  if(time<=270)return time;
  if(time<last)return 270+39*Math.sin(Math.PI*((time-270)%70)/70)**2;
  return 270+380*(time-last)/(650-last);
 }
 function attackPose(key,time,hits,defaultPose,action,ranged){
  const pose=action?.pose??defaultPose;
  if(time===null||time<=0||time>=650||action?.walk)return pose;
  if(key.startsWith('mage-')&&action?.form==='cast'&&pose===3)return 1;
  if(key.startsWith('shadow-')&&action?.strokes>1&&!ranged){
   const release=270,end=release+(action.strokes-1)*70;
   if(time>=release&&time<end){
    return skillMotion.sample('shadow',action.id,release,hits,false).pose;
   }
   if(time>=end&&action.form==='flurry'&&pose===3)return 1;
  }
  if(key==='warrior-season2'&&!ranged&&action&&forwardForms.has(action.form)){
   const {from,to,mix}=action;
   const path=swordTransitions[from+'-'+to]||swordTransitions[to+'-'+from];
   if(!path)return pose;
   return path[Math.round((path[0]===from?mix:1-mix)*(path.length-1))];
  }
  if(key.startsWith('warrior-')&&!ranged&&!action){
   const clock=eclipseTime(time,hits);
   if(key!=='warrior-season2')return clock<67?0:clock<202?1:clock<358?2:clock<548?3:0;
   for(let i=1;i<eclipseStrokes.length;i++){
    if(clock<(eclipseStrokes[i-1][0]+eclipseStrokes[i][0])/2)return eclipseStrokes[i-1][1];
   }
   return 0;
  }
  if(!action&&(key.startsWith('archer-')||key.startsWith('mage-'))){
   const release=key.startsWith('archer-')?137:151;
   if(time<release)return time<release*.39?0:1;
   const elapsed=time-release;
   if(elapsed<(hits-1)*70)return elapsed%70<33?2:1;
   const sinceLast=elapsed-(hits-1)*70;
   return sinceLast<78?2:sinceLast<245?3:0;
  }
  return pose;
 }
 // Authored in actor space (right = 0°, down = 90°). Costumes supply their own
 // painted wrist and weapon mesh, but never their own timing or swing direction.
 const castSword=[[0,33],[82,-119],[145,-8],[207,22],[340,36],[650,33]];
 const hammer=[[0,109],[75,150],[151,248],[185,260],[221,300],[270,369],[341,383],[480,428],[650,469]];
 const castHammer=[[0,109],[75,176],[106,238],[145,358],[205,381],[390,413],[650,469]];
 const bladeCast=[[0,128],[42,92],[77,39],[145,-9],[220,7],[305,41],[650,128]];
 const dagger=[[0,128],[78,90],[136,103],[189,73],[244,9],[270,-11],[335,9],[433,56],[650,128]];
 const secondBlade=[[0,55],[84,39],[157,32],[214,20],[270,2],[331,-17],[420,27],[650,55]];
 const staff=[[0,-76],[86,-110],[113,-103],[151,-6],[225,4],[350,-36],[650,-76]];
 function flatTip(key,part){
  if(part.tip)return part.tip;
  const [,,w,h]=part.rect,[px,py]=part.pivot;
  switch(part.kind){
   case 'sword':return [w-2,py];
   case 'shield':case 'book':{
    const direction=WEAPON_VIEWS[key]?.[part.kind]?.[0]?.[2];
    return direction?[px+direction[0],py+direction[1]]:[px,0];
   }
   case 'dagger':case 'offhand':return [px>w/2?0:w-1,h*.8];
   default:return [px<w/2?w-2:2,h*.5];
  }
 }
 const bearings=new WeakMap();
 function flatBearing(key,part){
  if(!bearings.has(part)){
   const tip=flatTip(key,part);
   bearings.set(part,Math.atan2(tip[1]-part.pivot[1],tip[0]-part.pivot[0])/DEG);
  }
  return bearings.get(part);
 }
 function repeatStroke(keys,t,hits,hit,recoil){
  if(t<=hit||hits<=1)return track(keys,t);
  const end=hit+(hits-1)*70;
  if(t<end)return track(keys,hit)-recoil*Math.sin(Math.PI*((t-hit)%70)/70)**2;
  return track(keys,hit+(t-end)*(650-hit)/(650-end));
 }
 function classBearing(job,kind,time,hits,ranged){
  const t=time??0,master=SKIN_RIGS[job+'-0'].parts.find(p=>p.kind===kind);
  switch(kind){
   case 'sword':return ranged?repeatStroke(castSword,t,hits,145,12):swordAngle(t,hits);
   case 'mace':return repeatStroke(ranged?castHammer:hammer,t,hits,ranged?145:270,16);
   case 'dagger':return repeatStroke(ranged?bladeCast:dagger,t,hits,ranged?145:270,21);
   case 'offhand':return repeatStroke(secondBlade,t,hits,270,-17);
   case 'staff':return repeatStroke(staff,t,hits,151,13);
   default:return swing(master,job,t,hits,ranged)+flatBearing(job+'-0',master);
  }
 }
 function weaponAngle(key,part,time,hits=1,ranged=false){
  const job=key.split('-')[0];
  if(part.kind==='bow'){
   const master=SKIN_RIGS['archer-0'].parts[0],t=time??0;
   const rest=1-ease(Math.min(t/65,(650-t)/160));
   return swing(master,job,t,hits,ranged)+rest*(part.angles[0]-master.angles[0]);
  }
  return classBearing(job,part.kind,time,hits,ranged)-flatBearing(key,part);
 }
 function weaponPose(key,part,pose,time,hits,ranged,replacement,action){
  const job=key.split('-')[0],kind=part.kind;
  if(kind==='bow'){
   const angle=weaponAngle(key,part,time,hits,ranged)+(action?.pitch||0);
   return {key,part,angle,projected:weaponDepth.view(key,part,pose,angle,time,hits,ranged,replacement)};
  }
  const rest=classBearing(job,kind,null,1,ranged);
  let bearing=classBearing(job,kind,time,action?.strokes??hits,ranged);
  if(action?.held)bearing=rest;
  if(action){
   const leverage={sword:.42,mace:.29,dagger:.55,offhand:-.5,shield:-.48,book:.31}[kind]??1;
   bearing+=action.pitch*leverage;
   if(Number.isFinite(action.aim)&&['staff','mace','dagger'].includes(kind)){
    // At the two fades the authored direction is constant. Interpolate from
    // guard, so crossing the +/-180 seam never reverses a partially drawn swing.
    bearing=rest+arc(rest,action.aim)*ease(action.weight)-action.lean;
   }
   if(kind==='mace'&&action.id===9)bearing=rest+arc(rest,-111)*ease(action.weight);
  }
  const angle=bearing-flatBearing(key,part);
  const projected=weaponDepth.view(key,part,pose,angle,time,hits,ranged,replacement,{bearing});
  return {key,part,angle,projected};
 }
 // Find where the nocked shaft crosses the bow's riser. The cheek and
 // bow hand both stay on the original painted fingers, even on long-limbed bows.
 function bowShelf(tip,cheek,ends,pose){
  if(pose!==1||!cheek)return tip;
  const slope=Math.tan(8*DEG),dx=ends[1][0]-ends[0][0],dy=ends[1][1]-ends[0][1];
  const cross=dy-slope*dx;
  if(Math.abs(cross)<1)return tip;
  const u=(cheek[1]-tip[1]+slope*(tip[0]-cheek[0]))/cross;
  return [tip[0]+u*dx,tip[1]+u*dy];
 }
 function strikingPart(job,id,time){
  if(job==='paladin'&&id===9)return 'shield';
  if(job==='shadow'&&(id===5||id===7)&&time>=305&&Math.floor((time-235)/70)%2)return 'offhand';
  return {warrior:'sword',shadow:'dagger',paladin:'mace',mage:'staff',archer:'bow'}[job];
 }
 function contactPoint(item,pose){
  const {key,part,angle,projected}=item;
  if(part.kind==='shield'){
   if(projected){
    const corners=[];
    for(const region of projected.frame.slice(0,2))if(region){
     const [,,w,h,x,y]=region;
     corners.push([x+w,y+h*.5]);
    }
    const p=corners.reduce((a,b)=>b[0]>a[0]?b:a);
    return rotated(part,pose,projected.angle/DEG,[part.pivot[0]+p[0],part.pivot[1]+p[1]]);
   }
   return rotated(part,pose,angle,[part.rect[2]-2,part.pivot[1]]);
  }
  return projected?.tip||rotated(part,pose,angle,flatTip(key,part));
 }
 // Use the projected weapon at the damage beat when placing the attack stride.
 function contactTip(key,id,hits){
  const rig=SKIN_RIGS[key],job=key.split('-')[0];if(!rig)return [.88,.51];
  const action=skillMotion.sample(job,id,270,hits,false),pose=attackPose(key,270,hits,2,action,false);
  const paintedShield=id===9&&rig.contacts?.shield?.[pose];
  const part=rig.parts.find(p=>p.kind===(id===9?'shield':'sword'))||
   rig.parts.find(p=>!['shield','offhand','book'].includes(p.kind));
  if(!part)return [.88,.51];
  const {angle,projected}=weaponPose(key,part,pose,270,hits,false,selectedWeaponAppearance(job),action);
  let [x,y]=paintedShield||contactPoint({key,part,angle,projected},pose);
  if(action){
   const foot=rig.body[0],cx=foot[4]+foot[2]/2,cy=foot[5]+foot[3],a=action.lean*DEG;
   const dx=x-cx,dy=y-cy;
   x=cx+action.x+dx*Math.cos(a)-dy*Math.sin(a);y=cy+action.y+dx*Math.sin(a)+dy*Math.cos(a);
  }
  return [x/512,y/512];
 }
 function paintLayers(ctx,img,rig,key,pose,time,hits=1,ranged=false,replacement=null,action=null,secondary=null){
  const job=key.split('-')[0];
  if(action?.twilight)return twilightRain.paint(ctx,img,rig,key,time,action,secondary,replacement,paintPose);
  let muzzle=null;
  const foot=rig.body[0],pivotX=foot[4]+foot[2]/2,pivotY=foot[5]+foot[3];
  if(action){
   ctx.save();ctx.translate(pivotX+action.x,pivotY+action.y);ctx.rotate(action.lean*DEG);ctx.translate(-pivotX,-pivotY);
  }
  // Retimed skill draws use the same release for the string, the depth view and the arrow.
  const handClock=action?.clock??time,shots=action?.salvo??hits;
  const equipment=rig.parts.map(part=>weaponPose(key,action?.arm&&part.kind==='mace'?action.arm.mace:part,pose,handClock,shots,ranged,replacement,action));
  function flat(part,angle){
   if(replacement&&!replacement.failed&&part.kind!=='shield'&&part.kind!=='book'){
    if(replacement.ready)muzzle=paintSignaturePart(ctx,replacement,part,pose,angle,handClock,shots)||muzzle;
   }else{
    paintPart(ctx,img,part,pose,angle,handClock,shots);
    if(part.tip){
     muzzle=rotated(part,pose,angle,part.tip);
     if(part.stringTips)muzzle=bowShelf(muzzle,part.drawHands?.[1],part.stringTips.map(end=>rotated(part,pose,angle,end)),pose);
    }
    else if(['sword','mace','dagger'].includes(part.kind)){
     const far=part.pivot[0]<part.rect[2]/2?part.rect[2]-2:2;
     muzzle=rotated(part,pose,angle,[far,part.rect[3]*.5]);
    }
   }
  }
  for(const item of equipment){
   if(item.projected)weaponDepth.paint(ctx,item.projected,false);
   else if(item.part.order<0)flat(item.part,item.angle);
  }
  secondaryMotion.paint(ctx,secondary,false);
  if(action?.walk?.image&&action.walk.frame){
   const walk=action.walk,half=walk.image.naturalWidth/2;
   ctx.drawImage(walk.image,(walk.frame-1)*half,0,half,walk.image.naturalHeight,0,0,512,512);
  }else if(action?.arm)paintPose(ctx,action.arm.image,action.arm.body);
  else paintPose(ctx,img,rig.body[pose]);
  secondaryMotion.paint(ctx,secondary,true);
  for(const item of equipment){
   if(item.projected){
    weaponDepth.paint(ctx,item.projected,true);
    if(!['offhand','shield','book'].includes(item.part.kind))muzzle=item.projected.tip;
   }else if(item.part.order>=0)flat(item.part,item.angle);
  }
  const strike=strikingPart(job,action?.id,time);
  const contact=equipment.find(item=>item.part.kind===strike);
  if(strike==='shield'&&rig.contacts?.shield?.[pose])muzzle=rig.contacts.shield[pose];
  else if(contact&&strike!=='bow')muzzle=contactPoint(contact,pose);
  const nocked=action?.nocked??((time>=65&&time<137)||(time>=155&&time<137+(hits-1)*70&&(time-137)%70>=18));
  if(job==='archer'&&time!==null&&nocked&&typeof archerFlight!=='undefined'){
   const bow=equipment.find(item=>item.part.kind==='bow');
   if(bow&&muzzle){
    const nock=bow.projected?.string?.nock||bowLine(bow.part,pose,bow.angle,handClock,shots)[1];
    const drawArrow=typeof rangedCombat==='undefined'?archerFlight.nocked:rangedCombat.drawNockedArrow;
    drawArrow(ctx,nock,muzzle,bow.part.drawHands?.[1]||nock,action?.id??-1);
   }
  }
  if(action?.arm)paintPose(ctx,action.arm.image,action.arm.palm);
  else paintPose(ctx,img,rig.palm[pose]);
  if(action){
   ctx.restore();
   if(muzzle){
    const x=muzzle[0]-pivotX,y=muzzle[1]-pivotY,angle=action.lean*DEG;
    muzzle=[pivotX+action.x+x*Math.cos(angle)-y*Math.sin(angle),pivotY+action.y+x*Math.sin(angle)+y*Math.cos(angle)];
   }
  }
  return muzzle;
 }
 function paintActor(ctx,img,rig,key,pose,time,hits=1,ranged=false,replacement=null,slot=-1,skillId=-1,walk=null,movement=null){
  if(typeof hairVolume!=='undefined'){
   img=hairVolume.texture(img,key,'rig');
   if(walk?.image)walk={...walk,image:hairVolume.texture(walk.image,key,'walk')};
  }
  let action=walk?{pose:0,x:0,y:0,lean:0,pitch:walk.pitch,walk}:skillId<0?null:skillMotion.sample(key.split('-')[0],skillId,time,hits,ranged);
  if(action?.id===57&&key.startsWith('archer-'))action.twilight=twilightRain.sample(key,time);
  pose=action?.twilight?.frame.basePose??attackPose(key,time,hits,pose,action,ranged);
  // Select the plated hand and the shaft socket as one exposure before adding root motion.
  const arm=paladinMotion.sample(key,time,action);
  if(arm){
   pose=arm.base;
   action={x:0,y:0,lean:0,pitch:0,...action,arm};
  }
  if(!action&&time===null&&movement?.animate){
   const breath=Math.sin(movement.now*.00215);
   action={x:0,y:0,lean:.16*breath,pitch:0};
  }
  const attachmentPose=walk?.image&&walk.frame?3+walk.frame:(pose<4?pose:-1);
  const secondary=secondaryMotion.tick(movement?.owner,key,attachmentPose,action,movement);
  return slot>=0&&typeof unityHeroes!=='undefined'?unityHeroes.draw(slot,ctx,img,rig,key,pose,time,hits,ranged,replacement,paintLayers,action,secondary):
   paintLayers(ctx,img,rig,key,pose,time,hits,ranged,replacement,action,secondary);
 }
 return {attackPose,weaponAngle,bowShelf,strikingPart,spring,impulse,tension,contactTip,attackStride,strideAt,swing,rotated,bowLine,heroFrame,poseIndex,swordAngle,paintActor};
})();

;
/* ./skill-films.js */
// Generated by tools/bake-skill-effects-smooth.py. URL stem, width fraction, milliseconds, contact x/y, cel count.
// A cel count of 36 means assets/skill-casts/<stem>.s36.(avif|webp) on a 6x6 grid; 16 means the original 4x4 sheets.
const SKILL_FILMS=[
 ["greatsword",0.49,812,0.6653,0.5339,36],
 ["crushing-combo",0.44,721,0.6244,0.3991,36],
 ["earthsplit",0.55,966,0.4919,0.7297,36],
 ["blade-storm",0.53,980,0.4874,0.4271,36],
 ["shadow-lunge",0.47,686,0.6143,0.5,36],
 ["twin-moons",0.46,784,0.5294,0.4485,36],
 ["dark-brand",0.42,924,0.5444,0.6686,36],
 ["eclipse-dance",0.52,987,0.5243,0.6162,36],
 ["holy-strike",0.49,854,0.612,0.7814,36],
 ["guardian-shield",0.44,924,0.5202,0.7514,36],
 ["healing-oath",0.45,1036,0.5092,0.7975,36],
 ["heavenly-judgment",0.55,1008,0.6045,0.8418,36],
 ["fireball",0.45,826,0.4912,0.6842,36],
 ["frozen-tome",0.49,910,0.4557,0.8671,36],
 ["lightning-chapter",0.5,812,0.4722,0.6528,36],
 ["meteor-finale",0.56,1064,0.582,0.8254,36],
 ["wind-arrow",0.44,742,0.7966,0.4576,36],
 ["triple-shot",0.46,728,0.8531,0.4825,36],
 ["piercing-shot",0.49,588,0.5745,0.5021,36],
 ["starlit-rain",0.55,994,0.5817,0.7516,36],
 ["armor-break",0.44,777,0.6761,0.6197,36],
 ["battle-cry",0.52,1001,0.5025,0.6517,36],
 ["siphon-cut",0.47,854,0.8254,0.5079,36],
 ["seismic-wave",0.56,980,0.4035,0.6959,36],
 ["venom-knife",0.41,763,0.6704,0.6313,36],
 ["smokeblade",0.51,966,0.5949,0.5359,36],
 ["assassinate",0.48,714,0.6346,0.4375,36],
 ["shadow-veil",0.47,1050,0.5212,0.7273,36],
 ["sanctuary",0.52,1036,0.4968,0.8917,36],
 ["heaven-chain",0.54,889,0.4405,0.7798,36],
 ["resolve",0.46,1036,0.5025,0.6281,36],
 ["purifying-light",0.46,924,0.6129,0.8516,36],
 ["flame-field",0.54,1078,0.4727,0.8424,36],
 ["frost-prison",0.5,1029,0.4516,0.7871,36],
 ["arcane-focus",0.45,1029,0.4973,0.6432,36],
 ["mana-barrier",0.47,924,0.5,0.6932,36],
 ["explosive-arrow",0.54,966,0.4973,0.8541,36],
 ["marked-shot",0.44,854,0.6936,0.5029,36],
 ["poison-trap",0.51,1078,0.4903,0.8581,36],
 ["focused-shot",0.53,819,0.8063,0.4555,36],
 ["hook-cut",0.47,798,0.6609,0.3696,36],
 ["rock-surge",0.55,1001,0.4457,0.7429,36],
 ["iron-counter",0.46,854,0.6816,0.5247,36],
 ["falling-star",0.54,966,0.6701,0.8426,36],
 ["jade-dagger",0.45,833,0.6989,0.457,36],
 ["mist-veil",0.52,1036,0.5859,0.5909,36],
 ["crimson-ambush",0.48,770,0.695,0.415,36],
 ["night-raven",0.54,910,0.7264,0.6318,36],
 ["solar-lance",0.52,882,0.8423,0.4505,36],
 ["silver-sanctuary",0.55,1050,0.5029,0.8514,36],
 ["judgment-hammer",0.51,882,0.5,0.7733,36],
 ["seraph-lance",0.55,938,0.8325,0.5616,36],
 ["ice-shards",0.46,840,0.4889,0.7,36],
 ["cinder-ring",0.54,1071,0.4528,0.8113,36],
 ["forked-lightning",0.53,847,0.4525,0.7709,36],
 ["blue-comet",0.56,1029,0.6011,0.8404,36],
 ["wind-feather",0.47,756,0.8868,0.4906,36],
 ["twilight-rain",0.55,994,0.5398,0.7898,36],
 ["frost-snare",0.52,1036,0.4881,0.7857,36],
 ["phoenix-arrow",0.57,1043,0.6324,0.6814,36]
];
const PIERCE_RIPPLE_FILM=["pierce-pressure",0.185,230,0.4865,0.5135];

;
/* ./combat-effects.js */
'use strict';
// Each original 2D painting has 16 registered cels. The Unity player selects the
// cel on its combat clock and renders it through BattleHeroes' sprite camera.
const combatEffects=(()=>{
 const basic={warrior:'steel',shadow:'knife',paladin:'hammer',mage:'emberHit',archer:'contact'};
 // Registration of the painted contact in a 160px cel, in texture coordinates.
 const pivots={snare:[.50,.69],fire:[.46,.80],ice:[.45,.77],earth:[.49,.71],poison:[.48,.79],
  bolt:[.43,.83],heal:[.50,.85],ward:[.50,.79],mist:[.59,.77],vortex:[.51,.50],cross:[.54,.61],
  slash:[.94,.39],wind:[.92,.52],lance:[.83,.84],phoenix:[.06,.74]};
 const groundIds=new Set([2,11,13,15,19,23,28,32,33,36,38,41,43,49,50,53,55,57,58]);
 function ground(id){return groundIds.has(id)}
 const images=new Map(),active=new Map(),pools=new WeakMap();
 let timer=0,guard=0;
 const clamp=t=>Math.max(0,Math.min(1,t));
 function image(name){
  if(!images.has(name)){
   const im=new Image();im.decoding='async';im.src='./assets/skill-motion/'+name+'.webp';images.set(name,im);
  }
  return images.get(name);
 }
 // The compact contact sheet also supplies a legible first cast on a cold connection.
 const poster=new Image();poster.src='./assets/skill-casts/contacts.webp?v=128';
 const films=new Map();
 let ripple=null,ripplePoster=null;
 // A film baked with 36 cels lives in <stem>.s36.* on a 6x6 grid; the 16-cel originals stay for Unity.
 function filmGrid(spec){return spec?.[5]===36?6:4}
 function filmImage(name,grid=4){
  const im=new Image(),base='./assets/skill-casts/'+name+(grid===6?'.s36':'');
  im.decoding='async';
  const sd=base+'.webp?v=127';
  if(window.navigator?.connection?.saveData)im.src=sd;
  else{
   im.onerror=()=>{im.onerror=null;im.src=sd};
   im.src=base+'.avif?v=128';
  }
  return im;
 }
 function loadRipple(){
  if(!ripple){
   ripple=filmImage(PIERCE_RIPPLE_FILM[0]);
   ripplePoster=new Image();ripplePoster.src='./assets/skill-casts/pierce-pressure-poster.webp?v=128';
  }
  return ripple;
 }
 function load(id){
  const spec=SKILL_FILMS[id];if(!spec)return;
  if(id===18)loadRipple();
  if(skillOwnerIndex(id)===4)archerFlight.texture(id);else spellTrails.preload(id);
  const im=films.get(id)||filmImage(spec[0],filmGrid(spec));im.celGrid=filmGrid(spec);
  films.delete(id);films.set(id,im);
  // Active casts hold their own image until the final frame.
  if(films.size>12)films.delete(films.keys().next().value);
  return im;
 }
 function enabled(){return !!s?.effects&&!s.powerSaving&&!document.hidden}
 function extent(id,width,secondary=false){return secondary?Math.min(115,Math.max(59,width*PIERCE_RIPPLE_FILM[1])):Math.min(315,Math.max(75,width*SKILL_FILMS[id][1]))}
 function duration(id,job,echo=false,factor=1){
  if(id<0)return (job==='archer'?145:195)*factor;
  const scaled=SKILL_FILMS[id][2]*Math.max(.75,Math.min(1,factor));
  return echo?Math.max(335,scaled*.79):Math.max(465,scaled);
 }
 function drawCel(ctx,im,frame,x,y,w,h){
  const grid=im.celGrid===6?6:4,unit=im.naturalWidth/grid;
  // The Unity sprite camera knows only the 4x4 sheets.
  const source=grid===4&&window.NebulaEnemyUnity?.heroReady()&&window.NebulaHeroUnity?.scheduleCel(im,frame)||im;
  ctx.drawImage(source,frame%grid*unit,Math.floor(frame/grid)*unit,unit,unit,x,y,w,h);
 }
 function cell(ctx,name,t,x,y,w,h=w,angle=0,opacity=1){
  if(t<0||t>=1||opacity<=0)return false;
  const im=image(name);if(!im.naturalWidth)return false;
  const frame=Math.min(15,Math.floor(t*16));
  ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.globalAlpha=opacity;
  drawCel(ctx,im,frame,-w/2,-h/2,w,h);ctx.restore();return true;
 }
 function flecks(ctx,t,x,y,size,angle,hard){
  ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.lineCap='round';
  const spread=1-(1-t)**2;
  for(let i=0;i<3;i++){
   const rad=[-1.02,-.35,.72][i],dist=size*(.05+spread*(i===1?.29:.39)),end=dist+size*(1-t)*(.16-.025*i);
   ctx.strokeStyle=hard&&i===0?'#eadbc0':i===1?'#bda88a':'#8b7561';ctx.lineWidth=Math.max(.65,size*.045*(1-.6*t));ctx.globalAlpha=(1-t)*.9;
   ctx.beginPath();ctx.moveTo(Math.cos(rad)*dist,Math.sin(rad)*dist+size*.10*t*t);
   ctx.lineTo(Math.cos(rad)*end,Math.sin(rad)*end+size*.10*t*t);ctx.stroke();
  }
  ctx.restore();
 }
 const colors={steel:['#e3e0d6','#928f89'],knife:['#d5cedf','#8e819d'],hammer:['#f3d191','#a48764'],
  emberHit:['#ffda9f','#c76535']};
 function smallHit(ctx,type,t,x,y,size,heading){
  if(type==='contact'){flecks(ctx,t,x,y,size,heading,false);return}
  const [light,shade]=colors[type],u=1-(1-t)**2;
  const n=type==='knife'?3:type==='hammer'?6:4;
  ctx.save();ctx.translate(x,y);ctx.rotate(heading);ctx.lineCap='round';
  for(let i=0;i<n;i++){
   const dir=-1.53+2.75*i/(n-1),r=size*u*(.22+.06*(i%3)),end=r+size*(1-t)*(type==='knife'?.20:.11);
   const drop=size*t*t*(type==='hammer'?.22:type==='emberHit'?-.15:.07);
   ctx.strokeStyle=i%2?shade:light;ctx.globalAlpha=(1-t)**1.35;ctx.lineWidth=Math.max(.7,size*(type==='hammer'?.052:.032)*(1-t*.6));
   ctx.beginPath();ctx.moveTo(r*Math.cos(dir),r*Math.sin(dir)+drop);ctx.lineTo(end*Math.cos(dir),end*Math.sin(dir)+drop);ctx.stroke();
  }
  ctx.restore();
 }
 function registered(ctx,name,t,x,y,extent,angle,alpha){
  if(t<0||t>=1)return;
  const [px,py]=pivots[name]||[.5,.5],dx=(.5-px)*extent,dy=(.5-py)*extent;
  const c=Math.cos(angle),s=Math.sin(angle);
  cell(ctx,name,t,x+dx*c-dy*s,y+dx*s+dy*c,extent,extent,angle,alpha);
 }
 function paint(ctx,o,t,size){
  const main=o.main,x=size*o.pivot[0],y=size*o.pivot[1];
  if(colors[main]||main==='contact'){smallHit(ctx,main,t,x,y,size*.78,o.heading||0);return}
  const angle=o.angle||0,unit=size*.78,scale=.88+.12*(1-(1-t)**2);
  registered(ctx,main,t,x,y,unit*scale,angle,1);
  if(o.accent)registered(ctx,o.accent,(t-.20)/.80,x,y,unit*.43,angle,.60);
 }
 function finish(n){
  const item=active.get(n);if(!item)return;
  active.delete(n);item.canvas.hidden=true;n.style.backgroundImage='';n.style.backgroundColor='';
  if(item.own)n.hidden=true;
 }
 // Echoes share the same target canvas. The first stroke always gets to finish;
 // the newest follow-through is composited over it at its own contact time.
 function filmStroke(o,t,strength,echo){
  const {ctx,size,pivot,still}=o;
  // 16 cels: still 7, play 2..15. 36 cels: the same moments on the finer grid.
  const last=o.film?.celGrid===6?35:15,lead=last*2/15;
  const phase=still?Math.round(last*7/15):Math.min(last,lead+t*(last-lead)),frame=Math.floor(phase);
  const x=size*pivot[0],y=size*pivot[1];
  ctx.save();ctx.translate(x,y);
  if(echo&&!still){if(!ground(o.id))ctx.rotate(echo%2?-.09:.09);ctx.scale(.88,.88)}
  ctx.globalAlpha=strength;
  if(o.film.complete&&o.film.naturalWidth){
   const mix=phase-frame;
   ctx.globalAlpha=strength*(1-mix);
   drawCel(ctx,o.film,frame,-x,-y,size,size);
   if(mix>0){
    // Add premultiplied samples so the silhouette keeps its brightness between cels.
    ctx.globalCompositeOperation='lighter';ctx.globalAlpha=strength*mix;
    drawCel(ctx,o.film,frame+1,-x,-y,size,size);
   }
  }else if(o.secondary&&ripplePoster?.naturalWidth){
   ctx.drawImage(ripplePoster,-x,-y,size,size);
  }else if(!o.secondary&&poster.naturalWidth){
   const scale=still?1:.86+.17*Math.sin(Math.min(1,t*1.5)*Math.PI*.5);
   ctx.scale(scale,scale);ctx.globalAlpha=strength*(still?1:Math.min(1,(1-t)*3));
   const cell=poster.naturalWidth/8;
   ctx.drawImage(poster,(o.id%8)*cell,Math.floor(o.id/8)*cell,cell,cell,-x,-y,size,size);
  }else{
   // The palette light buys the contact beat while the first texture is in flight.
   const color={warrior:'#ffc188',shadow:'#c493ff',paladin:'#ffe19b',mage:'#9dcfff',archer:'#e5d494'}[o.job]||'#ffe1b0';
   const r=size*(still?.24:.17+.13*t),g=ctx.createRadialGradient(0,0,0,0,0,r);
   g.addColorStop(0,'#fff9e9');g.addColorStop(.22,color);g.addColorStop(1,color+'00');
   ctx.globalAlpha=strength*(1-.76*t);ctx.fillStyle=g;ctx.fillRect(-r,-r,2*r,2*r);
  }
  ctx.restore();
 }
 function casterPoint(actor){
  const b=$('battle').getBoundingClientRect(),r=actor.getBoundingClientRect(),scale=$('battle').clientWidth/b.width||1;
  return {x:(r.left-b.left+r.width*.5)*scale,y:(r.top-b.top+r.height*.76)*scale};
 }
 function drawItem(n,item,now,positions){
  if(n.hidden||n.isConnected===false||!enabled()||(!item.film&&!motionAllowed())||
   (item.encounter&&(activeScreen!=='home'||view||!sameEncounter(item.encounter)))){finish(n);return}
  if(now<item.start)return;
  const elapsed=now-item.start,echoes=item.beats||[];
  if(elapsed>=item.duration&&echoes.every(b=>now>=b.start+b.duration)){finish(n);return}
  const actor=item.follow;
  if(actor&&!item.feet){
   if(actor.dataset.wave!==item.wave||actor.dataset.art!==item.art||actor.hidden||actor.dataset.dying){
    item.follow=null; // Finish a killing blow at its last world position.
   }else{
    let marks=positions.get(actor);if(!marks){marks={};positions.set(actor,marks)}
    const pos=marks[item.feet]||=(item.self?casterPoint(actor):rangedCombat.hitPoint(actor,item.feet));
    n.style.left=pos.x+'px';n.style.top=pos.y+'px';
   }
  }
  if(!item.ctx)return;
  const {ctx,size}=item;ctx.clearRect(0,0,size,size);
  if(!item.film){paint(ctx,item,elapsed/item.duration,size);return}
  const beat=echoes.filter(b=>now>=b.start&&now<b.start+b.duration).at(-1);
  if(elapsed<item.duration)filmStroke(item,elapsed/item.duration,beat ? .70 : 1,0);
  if(beat)filmStroke(item,(now-beat.start)/beat.duration,1,beat.ordinal);
 }
 function wake(){
  if(timer||!active.size)return;
  timer=enemyUnity.requestFrame(frame);
  // A WebGL warm-up or a suspended compositor can skip the queued callback.
  // Keep advancing the same contact clock until native/browser frames resume.
  guard=setTimeout(()=>{if(timer)enemyUnity.cancelFrame(timer);frame(performance.now())},52);
 }
 function frame(now){
  clearTimeout(guard);guard=0;timer=0;const positions=new Map();
  for(const [n,item] of active)drawItem(n,item,now,positions);
  wake();
 }
 function attach(n,o,own=false){
  finish(n);
  const film=o.secondary?loadRipple():o.id>=0&&!o.type?load(o.id):null;
  const spec=o.secondary?PIERCE_RIPPLE_FILM:SKILL_FILMS[o.id];
  n.className='motion-contact'+(film?' skill-contact':'');
  const main=o.type||(film?spec[0]:basic[o.job]||'contact');
  const [px,py]=pivots[main]||[.5,.5];
  const a=o.angle||0,c=Math.cos(a),s=Math.sin(a);
  const pivot=film?spec.slice(3):[.5+.78*((px-.5)*c-(py-.5)*s),.5+.78*((px-.5)*s+(py-.5)*c)];
  n.style.transformOrigin=(pivot[0]*100)+'% '+(pivot[1]*100)+'%';
  n.style.transform='translate('+(-100*pivot[0])+'%,'+(-100*pivot[1])+'%)'+(o.id===18?' rotate('+(o.heading||0)+'rad)':'');
  if(n.dataset){n.dataset.skill=String(o.id);n.dataset.effect=main}
  n.style.width=o.size+'px';n.style.height=o.size+'px';n.style.left=o.x+'px';n.style.top=o.y+'px';n.hidden=false;
  let canvas=n._contactCanvas;
  if(!canvas){canvas=document.createElement('canvas');n._contactCanvas=canvas;n.appendChild(canvas)}
  const context=canvas.getContext?.('2d'),ctx=context?.drawImage?context:null;
  const size=Math.max(24,Math.min(film?640:192,Math.round(o.size*Math.min(film?2.5:1.5,window.devicePixelRatio||1))));
  if(canvas.width!==size||canvas.height!==size)canvas.width=canvas.height=size;
  canvas.hidden=!ctx;
  if(!ctx){
   if(film){
    n.style.backgroundImage='url('+(o.secondary?ripplePoster:poster).src+')';n.style.backgroundSize=o.secondary?'contain':'800% 800%';
    n.style.backgroundPosition=o.secondary?'center':(o.id%8*100/7)+'% '+(Math.floor(o.id/8)*100/7)+'%';
   }else n.style.backgroundImage='radial-gradient(ellipse,#ffdfaf,transparent 55%)';
  }
  if(o.type){image(o.type);if(o.accent)image(o.accent)}
  const now=performance.now(),still=!!film&&!motionAllowed();
  const encounter=n.parentNode===$('classFx')?combatEncounter():null;
  const item={...o,main,pivot,film,still,beats:[],encounter,wave:o.follow?.dataset.wave,art:o.follow?.dataset.art,own,ctx,size,canvas,
   duration:still?265:o.duration,start:now+(o.delay||0)};
  active.set(n,item);drawItem(n,item,now,new Map());
  wake();
 }
 function emit(host,o){
  if(!host||!enabled()||o.id<0&&!motionAllowed())return;
  let pool=pools.get(host);if(!pool){pool=[];pools.set(host,pool)}
  if(o.echo&&o.id>=0){
   for(const n of pool){
    const item=active.get(n);
    if(item?.encounter&&!sameEncounter(item.encounter)){finish(n);continue}
    if(item&&item.id===o.id&&item.group===o.group&&item.anchor===o.anchor){
     if(!item.still)item.beats.push({start:performance.now()+(o.delay||0),duration:o.duration,ordinal:o.ordinal||1});
     return;
    }
   }
  }
  let n=pool.find(n=>!active.has(n));
  if(!n&&pool.length<(o.follow?8:12)){n=document.createElement('div');n.setAttribute('aria-hidden','true');host.appendChild(n);pool.push(n)}
  if(!n){
   const priority=v=>v.player===false?0:v.id<0?1:2;
   n=pool.reduce((a,b)=>{const x=active.get(a),y=active.get(b);return priority(x)!==priority(y)?(priority(x)<priority(y)?a:b):(x.start<=y.start?a:b)});
   if(priority(o)<priority(active.get(n)))return;
  }
  if(n.parentNode!==host)host.appendChild(n);
  attach(n,o,true);
 }
 function counts(host){const pool=pools.get(host)||[];return {total:pool.length,playing:pool.filter(n=>active.has(n)).length}}
 function clear(host){for(const [n] of active)if(n.parentNode===host)finish(n)}
 return {counts,casterPoint,emit,clear,cell,registered,load,duration,extent,enabled,ground};
})();

;
/* ./combat-motion.js */
/* Presentation only: original damage, cooldowns, rewards, saves and boss deadlines remain authoritative. */
'use strict';
const warriorMotion=(()=>{
 const pools={numbers:[]};
 const stats={attacks:0,effectUses:0,numberUses:0,allocated:0,geometryReads:0,assetRequests:0};
 let geometry=null,geometryCache=new Map(),actor=null,poses=[],motions=[],recoils=new Map(),sequence=0,numberLane=0,numberStack=0,numberAt=0;
 let heroStride=null;
 const heldAnimations=new Map();
 const decoded=new Map();
 const onBattlefield=()=>!!s?.classId&&activeScreen==='home'&&!view&&!document.hidden;
 const visible=()=>onBattlefield()&&motionAllowed();
 const capable=()=>typeof $('heroActor')?.animate==='function';
 const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
 function release(slot){slot.version++;clearTimeout(slot.timer);slot.animations.forEach(a=>a.cancel());slot.animations=[];slot.busy=false;slot.node.hidden=true;}
 function acquire(type,limit,host,create){
  const pool=pools[type];let slot=pool.find(x=>!x.busy);
  if(!slot&&pool.length<limit){const node=create();slot={node,busy:false,version:0,animations:[],used:0};pool.push(slot);stats.allocated++;}
  if(!slot)slot=pool.reduce((a,b)=>a.used<b.used?a:b);
  release(slot);slot.busy=true;slot.used=++sequence;slot.node.hidden=false;
  if(slot.node.parentNode!==host)host.appendChild(slot.node);
  return slot;
 }
 function play(slot,node,frames,options,last=false){
  const version=slot.version,a=node.animate(frames,options);slot.animations.push(a);
  if(last)a.onfinish=()=>{if(slot.version===version)release(slot)};
  return a;
 }
 function measure(){
  const target=typeof combatTargetNode==='function'?combatTargetNode():$('mobActor');if(geometry?.target===target)return geometry;if(geometryCache.has(target))return geometry=geometryCache.get(target);
  const battle=$('battle').getBoundingClientRect(),hero=$('heroActor').getBoundingClientRect(),enemy=target.getBoundingClientRect();
  stats.geometryReads+=3;
  const {x,y}=rangedCombat.hitPoint(target,false,{actor:enemy,battle});
  geometry={target,sourceX:hero.left-battle.left+hero.width*.65,sourceY:hero.top-battle.top+hero.height*.38,width:battle.width,height:battle.height,heroSize:hero.width,
   x:clamp(x,0,battle.width),y:clamp(y,0,battle.height),
   enemySize:enemy.width,heroLeft:hero.left-battle.left,heroTop:hero.top-battle.top,
   floor:rangedCombat.hitPoint(target,true,{actor:enemy,battle})};
  geometryCache.set(target,geometry);return geometry;
 }
 function cancelMotion(animation){
  clearTimeout(heldAnimations.get(animation)?.timer);heldAnimations.delete(animation);animation.cancel();
 }
 function resume(animation){
  const hold=heldAnimations.get(animation);if(!hold)return;
  clearTimeout(hold.timer);heldAnimations.delete(animation);
  if(animation.playState==='paused')animation.play();
 }
 function holdActor(ms,target){
  if(!visible()||ms<=0)return;
  const now=performance.now(),until=now+ms;
  if(heroStride&&until>heroStride.heldUntil){
   heroStride.start+=until-Math.max(now,heroStride.heldUntil);
   heroStride.heldUntil=until;
  }
  const recoil=recoils.get(target);
  for(const animation of recoil?[...motions,recoil]:motions){
   if(!animation.pause||animation.playState==='idle'||animation.playState==='finished')continue;
   const hold=heldAnimations.get(animation);
   if(hold&&hold.until>=until)continue;
   if(hold)clearTimeout(hold.timer);else animation.pause();
   heldAnimations.set(animation,{until,timer:setTimeout(()=>resume(animation),ms)});
  }
 }
 function clearHolds(){
  if(heroStride){
   heroStride.start-=Math.max(0,heroStride.heldUntil-performance.now());heroStride.heldUntil=0;
  }
  for(const animation of heldAnimations.keys())resume(animation);
 }
 function clearActor(){
  heroStride=null;motions.forEach(cancelMotion);motions=[];
  if(actor){actor.classList.remove('smooth-warrior');actor.dataset.motion='idle';actor.style.setProperty('--frame-x','0%');poses.forEach(p=>p.hidden=true);}
 }
 function stop(){
  combatEffects.clear($('classFx'));clearActor();recoils.forEach(cancelMotion);recoils.clear();
  Object.values(pools).forEach(pool=>pool.forEach(release));geometry=null;geometryCache.clear();
 }
 function preload(url){
  if(decoded.has(url)||typeof Image==='undefined')return;
  const img=new Image();decoded.set(url,img);stats.assetRequests++;img.decoding='async';img.src=url;
  if(img.decode)img.decode().catch(()=>{});
  // Keep only a few selected outfits decoded; CSS/browser cache owns the rest.
  if(decoded.size>4)decoded.delete(decoded.keys().next().value);
 }
 function outfit(){const key=s?.classId+'-'+outfitRigRank();if(s?.effects&&!s.powerSaving)for(const id of s.slots||[])combatEffects.load(id);if(MATURE_ART[key])preload(matureArtURL(key,true));geometry=null;}
 function keyPoses(hits){
  const points=[[0,0],[45,0],[80,1],[190,1]];
  for(let j=0;j<hits;j++){const t=270+j*70;points.push([t-35,j?3:1],[t-15,2],[t+12,2],[t+25,3]);}
  const release=270+(hits-1)*70;points.push([release+65,3],[Math.min(635,release+165),0],[650,0]);return points;
 }
 // Sample the same keyframes as the compositor, without a layout read at collision.
 function advance(now){
  if(!heroStride)return 0;
  const {stride,start,heldUntil,clock}=heroStride,t=clock.pose(Math.max(now,heldUntil)-start);
  if(t<=0||t>=650)return 0;
  return Math.max(0,skinMotion.strideAt(stride,t)[0]);
 }
 function attack(effect,token,factor,k=-1){
  if(!visible()||!capable())return false;
  const now=performance.now();
  const hits=typeof motionHitCount==='number'?motionHitCount:effect==='cross'?3:effect==='storm'?5:1;
  const melee=skillMeta(k).target!=='self'&&!['mage','archer'].includes(s.classId)&&!rangedCombat.heroStyle(s.classId,k);
  const admitted=actorMotion.attack(token,factor,hits,k);
  if(melee)rangedCombat.swingTrail(s.classId,k,token,factor,hits);
  const elapsed=heroStride?Math.max(now,heroStride.heldUntil)-heroStride.start:0;
  if(admitted===false||admitted===undefined&&heroStride&&elapsed<heroStride.duration*.7)return true;
  const holdRemaining=heroStride?Math.max(0,heroStride.heldUntil-now):0;
  clearActor();geometry=null;geometryCache.clear();const g=measure(),h=$('heroActor');actor=h;
  const useLegacyPoses=!h.classList.contains('has-actor-motion');
  if(useLegacyPoses&&(!poses.length||poses[0].parentNode!==h)){
   poses=Array.from({length:4},(_,i)=>{const p=document.createElement('span');p.className='warrior-motion-pose';p.setAttribute('aria-hidden','true');p.style.setProperty('--pose-x',(i*100/3)+'%');h.appendChild(p);return p});
  }
  h.dataset.motion='warrior';h.classList.add('smooth-warrior');poses.forEach(p=>p.hidden=!useLegacyPoses);
  combatEffects.load(k,s.classId);
  const tip=melee?skinMotion.contactTip(s.classId+'-'+outfitRigRank(),k,hits):[.5,.5];
  const dx=melee?clamp(g.x-g.heroLeft-g.heroSize*tip[0],0,g.width*.68):g.heroSize*.045;
  const dy=melee?clamp(g.y-g.heroTop-g.heroSize*tip[1],-g.heroSize*.28,g.heroSize*.09):0;
  const stride=skinMotion.attackStride(s.classId,g.heroSize,effect==='shield'?dx/.67:dx,melee,hits,effect,k);
  if(dx&&dy)for(const frame of stride)frame[3]+=dy*clamp(frame[1]/dx,0,1);
  const options={duration:650*factor,fill:'both'};
  const clock=skillMotion.clock(s.classId,k,factor),offset=t=>clock.elapsed(t)/options.duration;
  const swing=heroStride={stride,start:now,heldUntil:0,duration:options.duration,clock};
  const movement=h.animate(stride.map(([t,x,r,y=0])=>({offset:offset(t),transform:`translate3d(${x}px,${y}px,0) rotate(${r}deg)`,easing:'linear'})),options);motions.push(movement);
  const health=$('heroHealth');if(health?.animate)motions.push(health.animate(stride.map(([t,x])=>({offset:offset(t),transform:`translateX(calc(-50% + ${x}px))`,easing:'linear'})),options));
  const points=keyPoses(hits);
  if(useLegacyPoses)poses.forEach((p,i)=>motions.push(p.animate(points.map(([t,pose])=>({offset:offset(t),opacity:pose===i?1:0})),options)));
  movement.onfinish=()=>{if(heroStride===swing)clearActor()};
  if(holdRemaining)holdActor(holdRemaining);
  stats.attacks++;return true;
 }
 function impact(effect,big,skillId,echo,factor,finishing=false,ordinal=0,secondary=false){
  if(!combatEffects.enabled()||activeScreen!=='home'||view||skillId<0&&!visible())return;
  const self=skillId>=0&&skillMeta(skillId).target==='self';
  const g=measure(),host=$('classFx');if(!host)return;
  const job=s.classId,arrow=job==='archer'&&skillId<0,feet=combatEffects.ground(skillId);
  const size=skillId<0?clamp(g.heroSize*(arrow?.19:job==='shadow'?.22:.28),19,43):combatEffects.extent(skillId,g.width,secondary);
  const follow=self?$('heroActor'):g.target;
  const {x,y}=self?combatEffects.casterPoint(follow):feet?rangedCombat.hitPoint(follow,true):g;
  combatEffects.emit(host,{id:skillId,job,echo,ordinal,secondary,x,y,size,follow,feet,self,group:combatSerial,anchor:follow,
   duration:secondary?PIERCE_RIPPLE_FILM[2]:combatEffects.duration(skillId,job,echo,factor),heading:(skillId===18?rangedCombat.piercingHeading(combatSerial,ordinal):null)??Math.atan2(y-g.sourceY,x-g.sourceX)});
  // Contact spark (presentation layer): makes each hit read as a hit, without shaking the screen.
  if(!self&&!secondary&&typeof battlePresentation!=='undefined')battlePresentation.hitSpark($('fx'),x+'px',y+'px',{effect,skill:skillId>=0,big:big||finishing,echo});
  stats.effectUses++;
 }
 function number(d,crit){
  if(!onBattlefield())return false;
  const g=measure(),slot=acquire('numbers',12,$('fx'),()=>document.createElement('div')),lane=numberLane++%3-1;
  // Rapid hits climb in a short staircase instead of landing on top of each other.
  const stamp=performance.now();numberStack=stamp-numberAt<340?(numberStack+1)%4:0;numberAt=stamp;
  const node=slot.node;node.className='hit combat-number'+(crit?' critical':'');node.textContent='−'+compact(d);
  const area=isDuoBattle(),margin=Math.min(g.width*.13,12+node.textContent.length*(crit?4.6:3.9));
  if(area)node.className+=' lane-number';
  node.style.left=clamp(g.x+lane*g.heroSize*(area?.025:.16),margin,g.width-margin)+'px';node.style.top=(g.y-g.heroSize*.30-Math.abs(lane)*6-numberStack*(area?14:crit?32:22))+'px';
  const duration=crit?870:680;
  stats.numberUses++;
  if(!motionAllowed()||!node.animate){
   node.style.transform='translate(-50%,-5px)';
   slot.timer=setTimeout(()=>release(slot),duration);return true;
  }
  node.style.transform='';
  const drift=lane*(area?4:crit?13:8);
  const pop=crit?1.45:1.12;
  if(crit)play(slot,node,[{color:'#fff'},{color:'#fff'}],{duration:80});
  play(slot,node,[{offset:0,transform:'translate(-50%,5px) scale(.72)',opacity:0},{offset:.14,transform:`translate(-50%,-5px) scale(${pop})`,opacity:1},{offset:.58,transform:`translate(calc(-50% + ${drift*.6}px),-26px) scale(1)`,opacity:1},{offset:1,transform:`translate(calc(-50% + ${drift}px),-48px) scale(.94)`,opacity:0}],{duration,fill:'both',easing:'ease-out'},true);
  return true;
 }
 function hitReaction(big,echo,factor){
  const mob=typeof combatTargetNode==='function'?combatTargetNode():$('mobActor');if(!visible()||!mob?.animate)return;
  if(actorMotion.targetMoving(mob)){geometry=null;geometryCache.delete(mob)}
  if(actorMotion.hurt(mob,factor,big&&!echo?188:echo?72:115))return;
  if(recoils.has(mob))cancelMotion(recoils.get(mob));
  const shift=big&&!echo?7:3;
  const reaction=mob.animate([{transform:'translate3d(0,0,0)',offset:0},{transform:`translate3d(${shift}px,-1px,0) rotate(1deg)`,offset:.23},{transform:'translate3d(0,0,0)',offset:1}],{duration:220*factor,easing:'ease-out'});recoils.set(mob,reaction);
 }
 function init(){
  const resize=new ResizeObserver(()=>{geometry=null;geometryCache.clear()});resize.observe($('battle'));
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stop()});
  window.matchMedia?.('(prefers-reduced-motion: reduce)').addEventListener?.('change',stop);
  outfit();
 }
 return {visible,capable,advance,attackStride:skinMotion.attackStride,attack,impact,number,hitReaction,holdActor,clearHolds,stop,outfit,init,preload,invalidate(){geometry=null;geometryCache.clear()},stats(){
  const contacts=combatEffects.counts($('classFx'));
  return {...stats,allocated:stats.allocated+contacts.total,effectNodes:contacts.total,numberNodes:pools.numbers.length,
   sparkNodes:0,activeNodes:contacts.playing+pools.numbers.filter(n=>n.busy).length};
 }};
})();

const animateBeforeSmoothWarrior=animateClassAttack;
animateClassAttack=function(effect,token,factor=1,k=-1){
 if(s.classId&&warriorMotion.capable()){
  warriorMotion.attack(effect,token,factor,k);
  return;
 }
 return animateBeforeSmoothWarrior(effect,token,factor);
};
const fxBeforeSmoothWarrior=spawnClassFx;
spawnClassFx=function(effect,big=false,phase='impact',skillId=-1,echo=false,factor=1,finishing=false,ordinal=0,secondary=false){
 if(s.classId&&(skillId>=0||warriorMotion.capable())){
  if(phase==='impact')warriorMotion.impact(effect,big,skillId,echo,factor,finishing,ordinal,secondary);
  return;
 }
 if(skillId<0&&s.classId==='archer')return;
 return fxBeforeSmoothWarrior(effect,big,phase,skillId,echo,factor);
};
const numberBeforeSmoothWarrior=damageText;
damageText=function(d,crit=false,index=0){
 if(s.classId&&(activeScreen!=='home'||view||document.hidden))return;
 if(warriorMotion.number(d,crit))return;
 return numberBeforeSmoothWarrior(d,crit,index);
};
const impactBeforeSmoothWarrior=combatImpact;
combatImpact=function(d,crit,e,token,effect,big,skillId=-1,echo=false,factor=1){
 if(!s.classId||!warriorMotion.capable())return impactBeforeSmoothWarrior(d,crit,e,token,effect,big,skillId,echo,factor);
 if(token!==combatSerial||!sameEncounter(e))return false;
 if(stageBossActive()&&!stageBossTick())return false;
 warriorMotion.hitReaction(big,echo,factor);spawnClassFx(effect,big,'impact',skillId,echo,factor);
 playSound('impact',{effect,big,crit,echo,skillId});applyDamage(d,crit);paintBattle();return true;
};
const cancelBeforeSmoothWarrior=cancelCombatAnimation;
cancelCombatAnimation=function(){warriorMotion.stop();return cancelBeforeSmoothWarrior()};
const navigateBeforeSmoothWarrior=navigate,menuBeforeSmoothWarrior=openMenu,preferencesBeforeSmoothWarrior=applyPreferences;
navigate=function(...args){warriorMotion.stop();return navigateBeforeSmoothWarrior(...args)};
openMenu=function(...args){warriorMotion.stop();return menuBeforeSmoothWarrior(...args)};
applyPreferences=function(...args){warriorMotion.stop();return preferencesBeforeSmoothWarrior(...args)};
const costumeBeforeSmoothWarrior=paintHeroCostume;
let motionCostumeKey='';
paintHeroCostume=function(){
 if(!s)return;
 const key=[s.classId,s.wear,wornEventId()].join(':');
 if(key===motionCostumeKey){
  // The legacy HUD paint still assigns its old hue rotation before calling us.
  const hero=$('heroActor');if(hero.style.filter.includes('hue-rotate'))hero.style.filter='drop-shadow(0 7px 5px #1119)';
  return;
 }
 motionCostumeKey=key;warriorMotion.stop();costumeBeforeSmoothWarrior();warriorMotion.outfit();
};
const warmBeforeSmoothWarrior=warmClassArt;
warmClassArt=function(id){
 if(classIndex(id)<0)return;
 // The old multi-outfit atlas is no longer used by the current warrior artwork.
 for(const key of ['icons-'+id,'vfx-'+id]){
  const value=getComputedStyle(document.documentElement).getPropertyValue('--'+key).trim(),match=/^url\(["']?(.*?)["']?\)$/.exec(value);
  if(match)warriorMotion.preload(match[1]);
 }
};
const initBeforeSmoothWarrior=initClassesCombat;
initClassesCombat=function(){initBeforeSmoothWarrior();warriorMotion.init()};

;
/* ./tactics.js */
'use strict';
// Existing skill IDs 0–19 and all progression ledgers retain their identities.
const SLOT_GATES=[1,1,3,7];
CLASS_GATES.splice(0,4,1,1,3,7);
CLASS_SKILLS[9][5]='방패로 공격하고 4초간 받는 피해 45% 감소.';
CLASS_SKILLS[13][5]='얼음으로 공격하고 4초간 대상의 공격을 35% 약화.';
const EXTRA_SKILLS=[
 ['갑옷 부수기','cleave',3.2,8,1,'6초간 대상이 받는 피해 +25%.','break','single'],
 ['전장의 함성','storm',0,16,1,'6초간 주는 피해 +50%.','boost','self'],
 ['흡혈 베기','cross',2.6,11,1,'최대 체력의 18% 회복.','heal','single'],
 ['지진파','quake',2.8,14,1,'모든 적을 1.4초 기절.','stun','all'],
 ['독칼 던지기','mark',1.8,10,1,'4초간 매초 공격력 80%의 중독 피해.','poison','single'],
 ['그림자 연무','storm',3.1,13,1,'모든 적의 공격을 4초간 35% 약화.','weaken','all'],
 ['암살','dash',5.2,12,1,'체력 35% 이하인 적에게 피해 +60%.','execute','single'],
 ['그림자 장막','mark',0,15,1,'6초간 받는 피해 45% 감소.','guard','self'],
 ['성역','holy',3.5,12,1,'모든 적을 공격하고 최대 체력 12% 회복.','heal','all'],
 ['천벌의 사슬','judgment',3.3,14,1,'모든 적을 1.4초 기절.','stun','all'],
 ['신앙의 결의','shield',0,16,1,'6초간 주는 피해 +50%.','boost','self'],
 ['정화의 빛','heal',1.8,14,1,'최대 체력의 25% 회복.','heal','single'],
 ['화염 지대','fire',2.2,13,1,'모든 적에게 4초간 매초 공격력 65%의 화상.','burn','all'],
 ['서리 감옥','ice',2.4,14,1,'모든 적을 1.6초 기절.','stun','all'],
 ['비전 집중','lightning',0,16,1,'6초간 주는 피해 +50%.','boost','self'],
 ['마력 장벽','ice',1.8,15,1,'6초간 받는 피해 45% 감소.','guard','single'],
 ['폭발 화살','rain',3.2,10,1,'모든 적에게 폭발 피해.','burst','all'],
 ['표식 사격','pierce',2.2,8,1,'6초간 대상이 받는 피해 +25%.','break','single'],
 ['독성 덫','volley',1.6,13,1,'모든 적에게 4초간 매초 공격력 65%의 중독.','poison','all'],
 ['집중 사격','arrow',5.2,12,1,'체력 35% 이하인 적에게 피해 +60%.','execute','single']
];
// Each generation reserves four consecutive IDs per class, preserving previous saves.
const SKILL_GRADES=['일반','희귀','영웅','전설'], SKILL_RATES=[65,26,8,1];
const DISCOVERY_SKILLS=[
 ['갈고리 참격','cleave',2.8,7,1,'갑옷을 갈라 6초간 받는 피해를 25% 높입니다.','break','single'],
 ['쇄도하는 암석','quake',3.6,11,1,'바위 파편이 모든 적을 강타합니다.','burst','all'],
 ['철벽 반격','cross',2.8,11,2,'두 번 베고 6초간 받는 피해가 45% 줄어듭니다.','guard','single'],
 ['낙성참','cleave',4.7,14,2,'두 번 내려칩니다. 체력 35% 이하인 대상에게 피해 +60%.','execute','single'],
 ['비취 비수','mark',2.2,8,1,'비수의 독이 4초간 피해를 줍니다.','poison','single'],
 ['안개 장막','storm',3.4,12,1,'모든 적을 베고 4초간 공격을 약화합니다.','weaken','all'],
 ['붉은 매복','dash',3.2,10,2,'연속 기습으로 6초간 대상이 받는 피해를 25% 높입니다.','break','single'],
 ['밤까마귀','mark',4.3,13,2,'그림자 칼날이 두 번 덮칩니다. 체력 35% 이하에서 피해 +60%.','execute','single'],
 ['태양창','judgment',3.2,7,1,'빛의 창이 단일 대상을 관통합니다.','burst','single'],
 ['은빛 성소','holy',3.3,13,1,'모든 적에게 피해를 주고 최대 체력의 15%를 회복합니다.','heal','all'],
 ['심판의 망치','shield',3.5,11,2,'연속 심판으로 6초간 받는 피해를 25% 높입니다.','break','single'],
 ['세라핌의 창','judgment',5.3,14,2,'두 번 관통합니다. 체력 35% 이하인 대상에게 피해 +60%.','execute','single'],
 ['얼음 파편','ice',3.2,8,1,'얼음 파편으로 단일 적을 잠시 기절시킵니다.','stun','single'],
 ['잿불 고리','fire',3.2,12,1,'모든 적에게 피해를 주고 4초간 화상을 입힙니다.','burn','all'],
 ['갈래 번개','lightning',3.1,10,2,'번개가 두 번 내리쳐 6초간 대상이 받는 피해 +25%.','break','single'],
 ['푸른 혜성','fire',4.9,16,2,'혜성이 두 차례 폭발해 모든 적을 공격합니다.','burst','all'],
 ['바람깃','arrow',3,7,1,'빠른 관통 화살로 6초간 대상이 받는 피해 +25%.','break','single'],
 ['황혼 화우','rain',2.2,11,2,'두 차례 화살비가 모든 적을 덮칩니다.','burst','all'],
 ['서리 올가미','volley',4.2,12,1,'모든 적을 공격하고 잠시 기절시킵니다.','stun','all'],
 ['불사조 화살','pierce',4.8,14,2,'불새가 두 번 관통합니다. 체력 35% 이하인 대상에게 피해 +60%.','execute','single']
];
EXTRA_SKILLS.push(...DISCOVERY_SKILLS);
function skillOwnerIndex(k){return Number.isInteger(k)&&k>=0&&k<60?Math.floor((k%20)/4):-1}
function skillGate(){return 1}
function skillMeta(k){
 if(k<0)return {target:'single',status:'',factor:1};
 if(k>=20){const x=EXTRA_SKILLS[k-20];return {target:x[7],status:x[6],factor:1}}
 const area=[2,3,6,7,11,14,15,18,19].includes(k);
 return {target:area?'all':'single',status:k===9?'guard':k===10?'heal':k===13?'weaken':'',factor:area?.62:1};
}
for(let i=0;i<EXTRA_SKILLS.length;i++){
 const x=EXTRA_SKILLS[i],ci=Math.floor((i%20)/4),base=ci*4+[0,3,1,2][i%4],old=SKILL_VFX[base];
 CLASS_SKILLS.push(x.slice(0,6));SK.push([x[0],'']);SKILL_TYPES.push(CLASSES[ci].name);
 SKILL_RULES.push({mult:x[2],cd:x[3],hits:x[4],tier:(i<20?[0,1,1,2]:[0,1,2,3])[i%4],effect:x[1]});
 SKILL_VFX.push({...old,id:i+20,effect:x[1],travel:false});
}
classSkillIds=function(id=s?.classId){const base=classIndex(id)*4;return base<0?[]:[0,20,40].flatMap(group=>[0,1,2,3].map(i=>group+base+i))};
skillBelongs=function(k,id=s?.classId){return classIndex(id)>=0&&skillOwnerIndex(k)===classIndex(id)};
skillUnlocked=function(k){return skillBelongs(k)&&s.skills[k]>0};
slotOpen=function(i){return Number.isInteger(i)&&i>=0&&i<4&&s.maxStage>=SLOT_GATES[i]};
unlockClassSkills=function(){
 if(!s?.classId)return;
 const base=classIndex(s.classId)*4;
 if(s.skills[base])return;
 s.skills[base]=1;
 if(s.slots[0]<0)s.slots[0]=base;
};
const PRACTICE_AREA=[2,6,28,32,36];
for(const k of PRACTICE_AREA)SKILL_RULES[k].tier=0;
function practiceDraw(){return grantSkillDraw(1,false,skillDrawDay())}

function fieldMob(stage,species){
 const region=CAMPAIGN_CREATURE_REGIONS[campaignPosition(stage).area];
 return BIOMES[region].mobs[species];
}
function normalizeTactics(a,raw=a){
 const old=recordMap(raw?.tactics),now=Date.now();
 a.tactics={version:2,selectedPreset:['hunt','boss','survive','custom'].includes(old.selectedPreset)?old.selectedPreset:'custom',presets:recordMap(old.presets),ready:{},classReadyAt:Math.min(now+18000,Math.max(0,Number(old.classReadyAt)||0)),buffs:{},encounter:null};
 for(const [k,v]of Object.entries(recordMap(old.ready)))if(skillOwnerIndex(+k)>=0&&Number.isFinite(v)&&v>now)a.tactics.ready[k]=Math.min(v,now+60000);
 for(const key of ['boost','guard']){const v=old.buffs?.[key];if(v&&Number.isFinite(v.until)&&v.until>now)a.tactics.buffs[key]={until:Math.min(v.until,now+6000)}}
 // Carry forward the same completed fraction from ten solo kills or six paired kills.
 if(a.stage%10!==0&&old.version!==2)a.stageKills=Math.min(8,Math.floor(Math.max(0,Number(raw.stageKills)||0)*(old.version?1.5:.9)));
 const e=old.encounter;
 if(old.version===2&&e&&e.stage===a.stage&&Number.isSafeInteger(e.id)&&Number.isInteger(e.baseKills)&&e.baseKills>=0&&e.baseKills<=8&&Array.isArray(e.foes)&&e.foes.length===Math.min(3,9-e.baseKills)){
  const foes=e.foes.map((f,i)=>{
   const species=Number.isInteger(f?.species)&&f.species>=0&&f.species<3?f.species:(a.stage+Math.floor(e.baseKills/3)+i-1)%3;
   const kind=fieldMob(a.stage,species).kind,max=maxEncounterHp(a.stage,kind);
   const oldMax=Number(f?.max),rawHp=Number(f?.hp)||0;
   const hp=Number.isFinite(oldMax)&&oldMax>0&&oldMax!==max?Math.ceil(max*rawHp/oldMax):rawHp;
   return {species,kind,max,hp:Math.max(0,Math.min(max,hp)),status:{},nextAttack:now+(1800+i*350)/a.speed,nextHeal:now+4000/a.speed};
  });
  const duration=Math.max(280,Math.min(560,Number(e.entryDuration)||560)),stagger=duration*90/560,spawnAt=Math.min(now,Number(e.spawnAt)||now-740),readyAt=Math.min(now+740,spawnAt+duration+(foes.length-1)*stagger);
  if(e.baseKills+foes.filter(f=>f.hp<=0).length===a.stageKills&&foes.some(f=>f.hp>0)){
   const target=foes[e.target]?.hp>0?Number(e.target):foes.findIndex(f=>f.hp>0);
   a.tactics.encounter={id:e.id,stage:a.stage,baseKills:e.baseKills,foes,engaged:!!e.engaged||foes.some(f=>f.hp<f.max),target,spawnAt,entryDuration:duration,entryStagger:stagger,readyAt};
   a.enemyHp=foes[target].hp;
  }
 }
 return a;
}
const tacticsStarter=starter,tacticsMigrate=migrate;
starter=function(){return normalizeTactics(tacticsStarter())};
migrate=function(raw){return normalizeTactics(tacticsMigrate(raw),raw||{})};
const trialTacticalClocks=new WeakMap();
function tacticsState(){
 if(!s.tactics)normalizeTactics(s);
 if(dungeonRun?.mode!=='trial')return s.tactics;
 if(!trialTacticalClocks.has(dungeonRun)){
  const base=s.tactics,buffs=Object.fromEntries(Object.entries(base.buffs).map(([key,buff])=>[key,{...buff}]));
  trialTacticalClocks.set(dungeonRun,{...base,ready:{...base.ready},buffs,encounter:null});
 }
 return trialTacticalClocks.get(dungeonRun);
}
function trialPausedAt(){return dungeonRun?.mode==='trial'?dungeonRun.combatPausedAt:null}
let trialContacts=[];
function armTrialContact(contact){
 contact.due=Date.now()+contact.delay;
 const timer=setTimeout(()=>{
  if(contact.timer!==timer)return;
  trialContacts=trialContacts.filter(other=>other!==contact);
  contact.hit();
 },contact.delay);
 contact.timer=timer;classAttackTimers.push(timer);
}
function beginTrialCombatPause(run){
 if(run!==dungeonRun||run.mode!=='trial'||run.combatPausedAt!=null)return;
 run.combatPausedAt=Date.now();tacticsState();bossStatus();
 if(run.choosing){clearDefeatFeedback();cancelCombatAnimation();return}
 for(const contact of trialContacts){
  clearTimeout(contact.timer);contact.timer=null;
  contact.delay=Math.max(0,contact.due-run.combatPausedAt);
 }
}
function endTrialCombatPause(run){
 if(run!==dungeonRun||run.combatPausedAt==null||trialCombatPaused(run))return;
 const start=run.combatPausedAt,duration=Math.max(0,Date.now()-start);
 delete run.combatPausedAt;
 const defer=deadline=>deadline>start?deadline+duration:deadline;
 const tactics=tacticsState(),boss=bossStatus();
 for(const key of Object.keys(tactics.ready))tactics.ready[key]=defer(tactics.ready[key]);
 tactics.classReadyAt=defer(tactics.classReadyAt);
 boss.nextAttack=defer(boss.nextAttack);
 for(const status of [...Object.values(tactics.buffs),...Object.values(boss.status)]){
  status.until=defer(status.until);
  if(status.next)status.next=defer(status.next);
 }
 combatBusyUntil=defer(combatBusyUntil);
 for(const contact of trialContacts)armTrialContact(contact);
}
const FOE_ROLES={normal:['일반','대상을 눌러 집중 공격'],guard:['방어형','받는 피해 25% 감소 · 약화에 취약'],healer:['회복형','4초마다 동료 체력 회복'],striker:['돌격형','강한 공격 · 기절로 차단']};
const COMBAT_BALANCE={normalHit:2,bossHit:2.2,waveHeal:.08,reviveMs:2200};
const combatMs=ms=>ms/Math.max(1,s.speed||1);
let heroReviveUntil=0,heroReviveSave=null;
let waveSequence=0,duoTransaction=false,quietDamageNumber=false,visualTarget=-1,motionHitCount=1,bossTacticState=null;
// Commit reward/HUD updates together, after the wave reward adjustment.
const fullPaintBeforeTactics=paint;
paint=function(...args){if(!duoTransaction)return fullPaintBeforeTactics(...args)};
function isDuoBattle(){return !!s?.classId&&!dungeonRun&&s.stage%10!==0}
function maxEncounterHp(stage,kind){
 // In the opening hunt, armor alone provides the guard's defense.
 const multiplier={guard:stage<10?1:1.1,healer:.8,striker:.9}[kind]||1;
 return Math.max(1,Math.ceil(campaignEnemyHp(stage)*multiplier));
}
function ensureEncounter(){
 if(!isDuoBattle())return null;
 const t=tacticsState();let e=t.encounter;
 if(e&&e.stage===s.stage&&(duoTransaction||e.baseKills+e.foes.filter(f=>f.hp<=0).length===s.stageKills&&e.foes.some(f=>f.hp>0)))return e;
 if(e?.stage===s.stage&&Date.now()<enemyRespawnUntil)return e;
 const base=s.stageKills||0,now=Math.max(Date.now(),enemyRespawnUntil),wave=Math.floor(base/3);
 e=t.encounter={id:Math.max(++waveSequence,(t.encounter?.id||0)+1),stage:s.stage,baseKills:base,target:0,engaged:false,spawnAt:now,entryDuration:560/s.speed,entryStagger:90/s.speed,readyAt:now+(560+(Math.min(3,9-base)-1)*90)/s.speed,foes:Array.from({length:Math.min(3,9-base)},(_,i)=>{
  const species=(s.stage+wave+i-1)%3,kind=fieldMob(s.stage,species).kind,max=maxEncounterHp(s.stage,kind);
  return {species,kind,max,hp:max,status:{},nextAttack:now+combatMs(2200+i*350),nextHeal:now+combatMs(4000)};
 })};
 s.enemyHp=e.foes[0].hp;return e;
}
function selectedFoe(){const e=ensureEncounter();if(!e)return null;if(!e.foes[e.target]||e.foes[e.target].hp<=0)e.target=e.foes.findIndex(f=>f.hp>0);return e.foes[e.target]||null}
function foeNode(i){return $(["mobActor","mobTwo","mobThree"][i]||'mobActor')}
// Own entrance/death effects explicitly: a reused DOM actor must never inherit
// the previous monster's transparent fill, even if finish events arrive late.
const foeTransitions=new WeakMap();
function clearFoeTransition(actor){
 const effect=foeTransitions.get(actor);if(!effect)return;
 foeTransitions.delete(actor);effect.animation.onfinish=null;effect.animation.cancel();
 actor.classList.remove('foe-entering');delete actor.dataset.dying;delete actor.dataset.dissolved;
}
function finishFoeTransition(actor,effect){
 if(foeTransitions.get(actor)!==effect)return;
 const current=s.tactics?.encounter===effect.encounter&&actor.dataset.wave===String(effect.encounter.id);
 clearFoeTransition(actor);
 if(current&&effect.kind==='death'&&effect.encounter.foes[effect.index].hp<=0)actor.hidden=true;
}
function trackFoeTransition(actor,animation,kind,e,i,until){
 const effect={animation,kind,encounter:e,index:i,until};foeTransitions.set(actor,effect);
 animation.onfinish=()=>finishFoeTransition(actor,effect);
}
function encounterReady(e=ensureEncounter()){return !trialCombatPaused()&&(!e||Date.now()>=e.readyAt)}
function combatTargetNode(){const e=isDuoBattle()?ensureEncounter():null;return foeNode(e?(visualTarget>=0?visualTarget:e.target):0)}
function chooseEnemy(i){const e=ensureEncounter();if(!e?.foes[i]||e.foes[i].hp<=0)return false;e.target=i;s.enemyHp=e.foes[i].hp;warriorMotion.invalidate();paintTactics();return true}
const oldCombatEncounter=combatEncounter,oldSameEncounter=sameEncounter;
combatEncounter=function(){const e=ensureEncounter();return {...oldCombatEncounter(),wave:e?.id}};
sameEncounter=function(e){if(e.wave!==undefined)return s===e.save&&!dungeonRun&&s.stage===e.stage&&s.tactics?.encounter?.id===e.wave;return oldSameEncounter(e)};
function bossStatus(){
 const encounter=dungeonRun || stageBossAttempt();
 const wave=dungeonRun?.bosses || 0;
 if(!bossTacticState || bossTacticState.save!==s || bossTacticState.encounter!==encounter || bossTacticState.wave!==wave){
  bossTacticState={save:s,encounter,wave,status:{},engaged:false,nextAttack:Date.now()+combatMs(2400)};
 }
 return bossTacticState;
}
function targetStatus(i){return isDuoBattle()?ensureEncounter()?.foes[i]?.status:bossStatus().status}
function statusOn(obj,name,now=trialPausedAt()??Date.now()){return !!obj?.[name]&&obj[name].until>now}
function damageFactor(i,k){const f=isDuoBattle()?ensureEncounter().foes[i]:null,status=f?.status||bossStatus().status,m=skillMeta(k);let v=m.factor;if(statusOn(tacticsState().buffs,'boost'))v*=1.5;if(statusOn(status,'break'))v*=1.25;else{const armor=targetArmorReduction(f);if(f?.kind==='guard')v*=.75;v*=penetrationMultiplier(armor)}if(m.status==='execute'&&(f?f.hp/f.max:(dungeonRun?dungeonRun.hp/dungeonRun.maxHp:s.enemyHp/maxHp()))<=.35)v*=1.6;return v}
function putStatus(i,k){const m=skillMeta(k),now=Date.now(),status=targetStatus(i);if(!status)return;
 if(m.status==='break'||m.status==='weaken')status[m.status]={until:now+combatMs(m.status==='break'?6000:4000)};
 if(m.status==='stun'){const ms=combatMs((k===33?1600:1400)*(isDuoBattle()?1:.4));status.stun={until:now+ms};const foe=isDuoBattle()?ensureEncounter().foes[i]:bossStatus();foe.nextAttack=Math.max(foe.nextAttack||now,now+ms+combatMs(600))}
 if(m.status==='poison'||m.status==='burn')status[m.status]={until:now+combatMs(4100),next:now+combatMs(1000),damage:Math.ceil(power()*skillDotRatio(k,s.skills[k]||1,!dungeonRun)*(1+trialMod('skillDamage')))};
}
function applySupport(k){const m=skillMeta(k),t=tacticsState(),now=Date.now();if(['boost','guard'].includes(m.status))t.buffs[m.status]={until:now+combatMs(k===9?4000:6000)};if(m.status==='heal'){const ratio=k===31?.25:k===28?.12:k===22?.18:.15;heroCurrentHp=Math.min(health(),heroCurrentHp+health()*ratio)}}
function autoSkillUsable(k){if(trialCombatPaused()||!skillUnlocked(k)||!s.skills[k]||Date.now()<Math.max(tacticsState().ready[k]||0,tacticsState().classReadyAt||0))return false;const m=skillMeta(k);if(m.status==='heal'&&m.target!=='all'&&heroCurrentHp>health()*.75)return false;if(['guard','boost'].includes(m.status)&&statusOn(tacticsState().buffs,m.status))return false;return true}

const tacticalBaseDamage=applyDamage,tacticalBaseNumber=damageText;
damageText=function(...args){if(!quietDamageNumber)return tacticalBaseNumber(...args)};
function hurtFoe(d,crit,i,k=-1){
 const e=ensureEncounter(),f=e?.foes[i];if(!f||!encounterReady(e)||f.hp<=0||!Number.isFinite(d)||d<=0)return false;
 const hp=f.hp,heroHp=heroCurrentHp,stage=s.stage,amount=Math.max(1,Math.floor(d));
 const fall=amount>=hp?adventureFx.deathAnchor(foeNode(i)):null;
 f.hp=Math.max(0,hp-amount);s.enemyHp=hp;quietDamageNumber=true;duoTransaction=true;
 try{tacticalBaseDamage(amount,crit)}finally{quietDamageNumber=false;duoTransaction=false}
 heroCurrentHp=Math.min(health(),heroHp);
 if(f.hp===0){
  const region=CAMPAIGN_CREATURE_REGIONS[campaignPosition(stage).area];
  enemySound.play(enemySound.forCreature(region,f.species),'death');
  adventureFx.defeat(fall,region,weaponAudio.surface(region,f.species));
  if(f.kind==='healer'||f.kind==='guard')trackOrderEvent(f.kind);
  // The kill handler pays gold once. Keep the nine-kill wave XP adjustment.
  gainXP(Math.round((4+Math.floor(campaignEconomyStage(stage)/4))/9));
  const node=foeNode(i);if(node?.dataset.wave===String(e.id)&&motionAllowed()&&node.animate){clearFoeTransition(node);node.dataset.dying=String(e.id);if(fall?.still)node.dataset.dissolved='true';const animation=node.animate([{offset:0,opacity:1,transform:'translate(0,0)'},{offset:.22,opacity:1,transform:'translate(3px,-1px) rotate(3deg)'},{offset:.60,opacity:.8,transform:'translate(5px,3px) rotate(8deg)'},{offset:1,opacity:0,transform:'translate(6px,8px) rotate(11deg)'}],{duration:420,fill:'forwards'});trackFoeTransition(node,animation,'death',e,i,Date.now()+420)}
 }
 if(s.stage===stage){if(e.foes[e.target]?.hp<=0)e.target=e.foes.findIndex(x=>x.hp>0);s.enemyHp=e.foes[e.target]?.hp||0}
 if(f.hp===0&&e.foes.every(x=>x.hp<=0)){trackOrderEvent('waves');const travel=actorMotion.advanceWave(e)||0;enemyRespawnUntil=Date.now()+Math.max(combatMs(360),travel-combatMs(280));heroCurrentHp=e.baseKills+e.foes.length>=campaignKillsNeeded(stage)?health():Math.min(health(),heroCurrentHp+health()*COMBAT_BALANCE.waveHeal)}
 if(f.hp===0){paint();save()}return true;
}
applyDamage=function(d,crit=false){if(!isDuoBattle())return tacticalBaseDamage(d,crit);const e=ensureEncounter();return hurtFoe(d,crit,e.target)};
function paintAdventureImpact(node,effect,skillId,surface,critical,heavy,echo,incoming=false,source=null){
 if(!warriorMotion.visible()||!adventureFx.ready())return false;
 const bounds=$('battle').getBoundingClientRect(),target=node.getBoundingClientRect();
 const hero=$('heroActor').getBoundingClientRect(),from=incoming?(source||combatTargetNode()).getBoundingClientRect():hero;
 if(incoming&&source&&isDuoBattle()){
  const body=actorMotion.body(source),key=source.dataset.tacticArt||source.dataset.art;
  const attacks={
   hound:'slash',boar:'earth',hare:'wind',cap:'poison',spider:'cross',sapling:'earth',
   scorpion:'poison',toad:'poison',serpent:'wind',fighter:'slash',imp:'fire',
   bat:'snare',giant:'earth',gargoyle:'earth',wraith:'mist',griffin:'wind',
   orb:'lance',knight:'slash',nautilus:'mist',centipede:'cross'
  };
  const overrides={creature_4_1:'fire',creature_4_2:'earth',creature_6_2:'slash',creature_7_2:'fire',creature_9_2:'vortex'};
  const type=overrides[key]||attacks[body];
  if(type){
   const x=target.left-bounds.left+target.width*.49,y=target.top-bounds.top+target.height*.44;
   combatEffects.emit($('classFx'),{id:-1,job:'enemy',type,x,y,ordinal:0,duration:310/Math.max(1,s.speed||1),size:Math.min(84,Math.max(36,hero.width*.51)),angle:type==='slash'?2.7:0});
   return true;
  }
 }
 const contact=incoming?{x:target.left-bounds.left+target.width*.55,y:target.top-bounds.top+target.height*.54}:
  rangedCombat.hitPoint(node,false,{battle:bounds,actor:target});
 return adventureFx.impact({...contact,flashOnly:!incoming,floorY:target.bottom-bounds.top-target.height*.07,
  from:{x:from.left-bounds.left+from.width*.5,y:from.top-bounds.top+from.height*.48},
  scale:hero.width/100,job:incoming?'enemy':s.classId,skillId,effect,surface,critical,heavy,echo});
}
const impactShakeAt=new WeakMap();
function shakeImpactStage(stage){
 if(!stage||!motionAllowed()||document.hidden)return false;
 const now=performance.now();
 if(now-(impactShakeAt.get(stage)??-Infinity)<300)return false;
 impactShakeAt.set(stage,now);
 stage.classList.remove('impact-shake');void stage.offsetWidth;stage.classList.add('impact-shake');
 setTimeout(()=>{if(impactShakeAt.get(stage)===now)stage.classList.remove('impact-shake')},240);
 return true;
}
function tacticalImpact(d,crit,e,token,effect,big,k=-1,echo=false,factor=1,ordinal=0){
 if(heroCurrentHp<=0||token!==combatSerial||!sameEncounter(e)||!encounterReady()||stageBossActive()&&!stageBossTick())return false;
 const bossSkill=!echo&&k>=0&&stageBossActive()&&!dungeonRun;
 const m=skillMeta(k);if(!echo&&k>=0)applySupport(k);
 if(m.target==='self'){
  if(!echo){
   spawnClassFx(effect,true,'impact',k,false,factor);
   playSound('impact',{effect,big:true,skillId:k,motionScale:factor});
  }
  paintTactics();return true;
 }
 const pair=ensureEncounter(),indices=pair?(m.target==='all'?pair.foes.map((_,i)=>i).filter(i=>pair.foes[i].hp>0):[pair.foes[pair.target]?.hp>0?pair.target:pair.foes.findIndex(f=>f.hp>0)]):[0];
 // Capture the surface before damage can kill the target or advance the wave.
 const focus=indices.includes(pair?.target)?pair.target:indices[0];
 const creature=pair?null:encounterFor(s.stage,dungeonRun);
 const surface=pair?weaponAudio.surface(CAMPAIGN_CREATURE_REGIONS[campaignPosition(s.stage).area],pair.foes[focus]?.species):weaponAudio.surface(creature.region,creature.boss?3:creature.variant);
 let landed=0;
 for(const i of indices){if(i<0||!sameEncounter(e))break;visualTarget=pair?i:-1;const amount=Math.max(1,Math.floor(d*damageFactor(i,k)*(k<0?weaponModifier('storm'):1)*(1+trialMod('weakness'))));
  const target=foeNode(i),lethal=amount>=(pair?pair.foes[i].hp:dungeonRun?dungeonRun.hp:s.enemyHp);
  rangedCombat.heroHit(token,ordinal,target);warriorMotion.hitReaction(big||crit,echo,factor);
  if(warriorMotion.visible()){
   const hitSurface=pair?weaponAudio.surface(CAMPAIGN_CREATURE_REGIONS[campaignPosition(s.stage).area],pair.foes[i].species):surface;
   paintAdventureImpact(target,effect,k,hitSurface,crit,big,echo);
   if(crit||big){
    shakeImpactStage($('battle'));
    if(!(lethal&&creature?.boss))actorMotion.hitStop(95,target);
   }
  }
  spawnClassFx(effect,big,'impact',k,echo,factor,lethal&&k<0,ordinal,k===18&&i!==focus);
  damageText(amount,crit);
  if(pair){if(hurtFoe(amount,crit,i,k))landed++}else{quietDamageNumber=true;try{tacticalBaseDamage(amount,crit)}finally{quietDamageNumber=false}}
  if(!echo&&sameEncounter(e))putStatus(i,k);
 }
 if(bossSkill)trackOrderEvent('bossHits');
 if(!echo&&k>=0&&m.target==='all'&&landed===3)trackOrderEvent('volley');
 visualTarget=-1;playSound('impact',{effect,big,crit,echo,ordinal,motionScale:factor,surface,skillId:k});paintBattle();return true;
}
combatImpact=tacticalImpact;
// A delayed browser callback still owns its hit until it resolves or combat is cancelled.
let pendingClassHits=0;
performClassAttack=function(k=-1,automatic=false){
 if(!s.classId||heroCurrentHp<=0||document.hidden||trialCombatPaused()||pendingClassHits>0||Date.now()<combatBusyUntil||Date.now()<enemyRespawnUntil)return false;
 if(stageBossActive()&&!stageBossTick())return false;
 if(k>=0&&(!skillUnlocked(k)||!s.skills[k]||Date.now()<Math.max(tacticsState().ready[k]||0,tacticsState().classReadyAt||0)))return false;
 const pair=ensureEncounter();if(pair&&(!encounterReady(pair)||!selectedFoe()))return false;
 (pair||bossStatus()).engaged=true;
 const skill=k>=0,r=skill?SKILL_RULES[k]:null,effect=skill?r.effect:({warrior:'cleave',shadow:'dash',paladin:'holy',mage:'fire',archer:'arrow'}[s.classId]);
 const token=++combatSerial,e=combatEncounter();
 const crit=(!skill||skillMeta(k).target!=='self')&&Math.random()<criticalChance();
 const adventure=!dungeonRun;
 const base=skill?skillDamage(k,s.skills[k],adventure):power()*(adventure?adventureBasicMultiplier():1)*(.9+Math.random()*.2);
 const total=Math.max(skill?0:1,Math.floor(base*(crit?criticalDamageMultiplier():1)));
 const speed=skill?1:attackSpeed();
 const hits=skill?r.hits||1:speed>=2.5&&total>=2?2:1;
 // Preserve the existing input cadence. Two short contacts share one damage roll.
 const cadenceFactor=(skill?1:Math.max(.4,1/speed))/s.speed;
 const factor=skill?cadenceFactor:Math.max(190/650,cadenceFactor);
 const clock=skillMotion.clock(s.classId,k,factor);
 combatBusyUntil=Date.now()+Math.max(680,270+hits*70)*cadenceFactor;
 classAttackTimers.forEach(clearTimeout);classAttackTimers=[];
 pendingClassHits=hits;
 if(skill)tacticsState().ready[k]=Date.now()+r.cd*Math.max(0,1-trialMod('cooldown'))/s.speed*1000;
 for(let j=0;j<hits;j++){
  let applied=false;
  const hit=()=>{
   if(applied||token!==combatSerial)return;
   applied=true;pendingClassHits--;
   if(document.hidden||trialCombatPaused())return;
   combatImpact(Math.floor(total/hits)+(j<total%hits?1:0),crit,e,token,effect,skill,k,j>0,factor,j);
  };
  const delay=clock.elapsed(270+j*70);
  if(dungeonRun?.mode==='trial'){
   const contact={hit,delay};
   trialContacts.push(contact);armTrialContact(contact);
  }else classAttackTimers.push(setTimeout(hit,delay));
 }
 motionHitCount=hits;animateClassAttack(effect,token,factor,k);launchClassProjectile(k,factor,token,pair,hits);playSound('swing',{effect,big:skill,skillId:k,hitCount:hits,motionScale:factor});
 return true;
};
let projectileNode=null,projectileAnimation=null;
function launchClassProjectile(k,factor,token=combatSerial,pair=s.tactics?.encounter,hits=SKILL_RULES[k]?.hits||1){
 if(rangedCombat.heroCast(k,factor,token,pair,hits))return;
 if(!['mage','archer'].includes(s.classId)||!warriorMotion.visible()||!warriorMotion.capable()||skillMeta(k).target==='self')return;
 const battle=$('battle').getBoundingClientRect(),hero=$('heroActor').getBoundingClientRect();
 if(!projectileNode){projectileNode=document.createElement('i');projectileNode.className='class-flight';projectileNode.setAttribute('aria-hidden','true')}
 if(projectileNode.parentNode!==$('classFx'))$('classFx').appendChild(projectileNode);projectileAnimation?.cancel();projectileNode.hidden=false;
 const grip=actorMotion.emitter()||[.69,.40];
 const [{x,y}]=rangedCombat.paintedPoints($('heroActor'),[grip.map(n=>n*512)]);
 const {x:tx,y:ty}=rangedCombat.hitPoint(combatTargetNode(),combatEffects.ground(k));
 const clock=skillMotion.clock(s.classId,k,factor);
 if(s.classId==='archer'){
  const length=rangedCombat.arrowLength(battle.width,k),kind=rangedCombat.heroStyle('archer',k);
  const from={x,y},to={x:tx,y:ty},tail=archerFlight.tailMs(k),duration=clock.elapsed(270+tail),contact=clock.elapsed(270)/duration,release=clock.elapsed(rangedCombat.releaseTime('archer',k))/duration;
  projectileNode.style.cssText=`left:0;top:0;width:${length}px;height:${length*(k<0?36/240:48/256)}px;transform-origin:right center;background:transparent url("${archerFlight.texture(k).src}") center/contain no-repeat`;
  const frames=[{offset:0,opacity:0},{offset:release,opacity:0}];
  for(let step=0;step<=8;step++){
   const t=step/8,p=rangedCombat.arrowPose(from,to,t,kind,battle.width,k);
   frames.push({offset:release+(contact-release)*t,opacity:1,transform:`translate(${p.x-length}px,calc(${p.y}px - 50%)) rotate(${p.angle}rad)`});
  }
  if(tail){const end=rangedCombat.arrowPose(from,to,1.69,kind,battle.width,k);frames.push({offset:1,opacity:0,transform:`translate(${end.x-length}px,calc(${end.y}px - 50%)) rotate(${end.angle}rad)`})}
  projectileAnimation=projectileNode.animate(frames,{duration,fill:'both',easing:'linear'});
  projectileAnimation.onfinish=()=>{projectileNode.hidden=true};return;
 }
 projectileNode.style.cssText=`left:${x}px;top:${y}px;width:${hero.width*.5}px;--flight-atlas:var(--vfx-${s.classId});--flight-row:${(k>=0?(SKILL_VFX[k]?.row||0):0)*100/3}%`;
 const dx=tx-x,dy=ty-y,arc=hero.width*.045;
 const release=clock.elapsed(rangedCombat.releaseTime('mage',k))/clock.elapsed(270);
 const flight=(fraction,rise,scale)=>`translate(calc(-50% + ${dx*fraction}px),calc(-50% + ${dy*fraction-rise}px)) scale(${scale})`;
 projectileAnimation=projectileNode.animate([
  {offset:0,transform:flight(0,0,.32),opacity:0},
  {offset:Math.max(0,release-.02),transform:flight(0,0,.38),opacity:0},
  {offset:release,transform:flight(.015,0,.72),opacity:1},
  {offset:release+(1-release)*.35,transform:flight(.44,arc,.88),opacity:1},
  {offset:1,transform:flight(1,0,1),opacity:1}
 ],{duration:clock.elapsed(270),fill:'both',easing:'ease-in'});
 projectileAnimation.onfinish=()=>{projectileNode.hidden=true};
}
const tacticalCancel=cancelCombatAnimation;
cancelCombatAnimation=function(){pendingClassHits=0;trialContacts=[];rangedCombat.clear();bossTechniques.clear();projectileAnimation?.cancel();if(projectileNode)projectileNode.hidden=true;return tacticalCancel()};

function animateEnemy(node,kind){
 if(!node?.animate||!warriorMotion.visible())return;
 if(actorMotion.contact(node,kind)||kind==='attack'&&actorMotion.isArmed(node))return;
 node.getAnimations?.().filter(a=>!a.animationName).forEach(a=>a.cancel());
 const attack=kind==='attack',frames=attack?[
  {transform:'translate3d(0,0,0) rotate(0deg)'},{offset:.22,transform:'translate3d(5px,2px,0) rotate(3deg)'},
  {offset:.48,transform:'translate3d(-18px,-5px,0) rotate(-5deg)'},{offset:.56,transform:'translate3d(-19px,-3px,0) rotate(-3deg)'},
  {offset:.76,transform:'translate3d(-5px,1px,0) rotate(1deg)'},{transform:'translate3d(0,0,0) rotate(0deg)'}
 ]:[{filter:'brightness(1)'},{filter:'brightness(1.5)'},{filter:'brightness(1)'}];
 node.animate(frames,{duration:combatMs(attack?440:500),easing:'ease-out'});
}
function applyEnemyCombatTick(dt,slow){
 const now=Date.now(),e=ensureEncounter(),foes=e?e.foes:[bossStatus()],guard=statusOn(tacticsState().buffs,'guard')?.55:1;
 if(!encounterReady(e))return;
 foes.forEach((f,i)=>{if(heroCurrentHp<=0||e&&f.hp<=0)return;if(statusOn(f.status,'stun',now))return;const node=foeNode(e?i:0),body=actorMotion.body(node);
  const sound=e?enemySound.forCreature(CAMPAIGN_CREATURE_REGIONS[campaignPosition(s.stage).area],f.species):enemySound.forEncounter(encounterFor(s.stage,dungeonRun));
  if(f.sounded!==f.nextAttack&&(f.nextAttack-now)*Math.max(1,s.speed)<=320){enemySound.play(sound,'release',!e);f.sounded=f.nextAttack}
  if(now<f.nextAttack){
   const speed=Math.max(1,s.speed);
   if(!e)bossTechniques.start(node,f,now,false);
   else if(!actorMotion.isArmed(node)&&rangedCombat.enemyStyle(body))rangedCombat.planEnemy(node,body,f,e,now,speed);
   else actorMotion.planMelee(node,f,now,speed);
  }
  if(f.kind==='healer'&&now>=f.nextHeal){const ally=e.foes.find(x=>x!==f&&x.hp>0);if(ally){ally.hp=Math.min(ally.max,ally.hp+ally.max*.08);animateEnemy(node,'heal')}f.nextHeal=now+combatMs(4000)}
  if(now>=f.nextAttack){const attack=enemyAttack()*(e?COMBAT_BALANCE.normalHit:dungeonRun?.6:COMBAT_BALANCE.bossHit)*(f.kind==='striker'?1.4:f.kind==='healer'?.7:1)*(statusOn(f.status,'weaken')?.65:1)*guard*slow;
   enemySound.play(sound,'impact',!e);
   if(e){if(!actorMotion.isArmed(node))rangedCombat.enemyHit(node,body,f,e);animateEnemy(node,'attack')}
   else bossTechniques.start(node,f,now,true);
   applyHeroDamage(attack,node);const cadence=!e&&dungeonRun?.mode==='tower'?towerEncounter(dungeonRun.n).interval:0;f.nextAttack=now+combatMs(cadence||2400+(i?350:0))}
 });
 if(e&&e.foes[e.target])s.enemyHp=e.foes[e.target].hp;
}
function resolveHeroDefeat(){
 if(heroCurrentHp>0||heroReviveUntil>Date.now())return false;
 if(dungeonRun){finishDungeon(false);return true}
 if(stageBossActive()){retreatBoss();return true}
 const e=ensureEncounter();if(!e)return false;
 cancelCombatAnimation();s.stageKills=0;tacticsState().encounter=null;tacticsState().buffs={};
 heroReviveUntil=Date.now()+combatMs(COMBAT_BALANCE.reviveMs);heroReviveSave=s;enemyRespawnUntil=heroReviveUntil;
 s.enemyHp=maxHp();battleElapsed=0;s.lastCombatDefeat={stage:s.stage,at:Date.now()};
 paintBattle();save();banner('전투 패배');offerDefeatHelp(s.stage);return true;
}
function updateCombatSurvival(dt){
 if(!s?.classId||document.hidden||trialCombatPaused()||worldBoss.inBattle()||partyRaid.inBattle())return;
 if(heroReviveUntil){
  if(heroReviveSave!==s||dungeonRun||s.lastCombatDefeat?.stage!==s.stage)heroReviveUntil=0;
  else if(Date.now()<heroReviveUntil)return;
  else {heroReviveUntil=0;heroCurrentHp=health();paintHeroHealth();return}
 }
 const encounter=ensureEncounter()||bossStatus();if(!dungeonRun&&!s.auto&&!encounter.engaged)return;
 battleElapsed+=dt;applyEnemyCombatTick(dt,Date.now()<battleSlowUntil?.5:1);
 if(heroCurrentHp<=0)resolveHeroDefeat();
}
function tickTactics(){
 if(!s?.classId||document.hidden||trialCombatPaused()||worldBoss.inBattle()||partyRaid.inBattle())return;
 const now=Date.now(),e=ensureEncounter(),snapshot=combatEncounter(),targets=e?e.foes:[bossStatus()];
 targets.forEach((f,i)=>{if(e&&(!encounterReady(e)||f.hp<=0))return;for(const key of ['poison','burn']){if(!sameEncounter(snapshot)||stageBossActive()&&!stageBossTick()||e&&f.hp<=0)break;const status=f.status?.[key];if(!status||status.until<=now||status.next>now)continue;status.next=now+combatMs(1000);visualTarget=e?i:-1;warriorMotion.invalidate();const d=Math.round(status.damage*penetrationMultiplier(targetArmorReduction(e?f:null))*(1+trialMod('weakness')));damageText(d,false);if(e)hurtFoe(d,false,i);else{quietDamageNumber=true;try{tacticalBaseDamage(d,false)}finally{quietDamageNumber=false}}}});
 visualTarget=-1;paintTactics();
}
function setCreature(node,key){if(node.dataset.tacticArt===key)return;node.dataset.tacticArt=key;const a=HD_ART[key];if(!a)return;node.style.removeProperty('mask-image');const [sheet,w,h,x,y,cw,ch]=a;node.style.backgroundImage='var(--'+sheet+')';node.style.backgroundSize=w/cw*100+'% '+h/ch*100+'%';node.style.backgroundPosition=(w===cw?0:x/(w-cw)*100)+'% '+(h===ch?0:y/(h-ch)*100)+'%'}
// One short compositor animation per new monster; no extra frame loop or particles.
function animateEnemyEntrance(actor,e,i){
 const elapsed=Date.now()-e.spawnAt,delay=i*e.entryStagger;
 if(elapsed>=e.entryDuration+delay||!motionAllowed()||!warriorMotion.visible()||!actor.animate)return;
 const distance=$('battle').clientWidth-actor.offsetLeft+actor.offsetWidth*.15;
 // Sample a continuous gait onto the compositor once per entrance.
 const key=actor.dataset.tacticArt||'',flying=['creature_5_1','creature_6_2','creature_7_2','creature_8_1','creature_9_2'].includes(key);
 const heavy=['creature_0_1','creature_5_2','creature_8_2'].includes(key);
 const steps=flying?1:heavy?2:3;
 const frames=Array.from({length:36},(_,index)=>{
  const t=index/36,tail=1-t,travel=tail*tail*(1+.9*t);
  const gait=Math.sin(steps*Math.PI*t),weight=gait*gait*tail;
  const y=-(flying?7:heavy?2.5:4)*weight;
  const angle=(flying?1.3:heavy?1.1:2)*Math.sin(2*steps*Math.PI*t)*tail;
  return {offset:t,transform:`translate(${distance*travel}px,${y}px) rotate(${angle}deg)`,opacity:Math.min(1,t/.15)};
 });
 frames.push({offset:1,transform:'translate(0,0) rotate(0)',opacity:1});
 clearFoeTransition(actor);actor.classList.add('foe-entering');
 const animation=actor.animate(frames,{duration:e.entryDuration,delay:delay+Math.max(0,-elapsed),fill:'both',easing:'linear'});
 animation.currentTime=Math.max(0,elapsed);
 trackFoeTransition(actor,animation,'entry',e,i,e.spawnAt+e.entryDuration+delay);
}
let combatEffectsHud=null,soloMobEncounter=null,soloWaveKey='';
function paintTactics(){
 if(!s?.classId||duoTransaction)return;const e=ensureEncounter(),battle=$('battle');battle.classList.toggle('duo-battle',!!e);battle.classList.toggle('campaign-boss',stageBossActive());const now=trialPausedAt()??Date.now();
 if(e)soloMobEncounter=null;
 else if(!soloMobEncounter||!sameEncounter(soloMobEncounter)){
  soloMobEncounter=combatEncounter();soloWaveKey='boss-'+(++waveSequence);
 }
 for(let i=0;i<3;i++){const actor=foeNode(i),hud=$('foeHud'+i);if(!actor||!hud)continue;
  const transition=foeTransitions.get(actor);
  if(transition&&(transition.encounter!==e||now>=transition.until))finishFoeTransition(actor,transition);
  if(!e){actor.hidden=!!i;if(!i){if(actor.dataset.wave!==soloWaveKey){clearFoeTransition(actor);actor.getAnimations?.().filter(a=>!a.animationName).forEach(a=>a.cancel());actor.dataset.wave=soloWaveKey;delete actor.dataset.tacticArt;delete actor.dataset.dying}actor.classList.remove('targeted','foe-windup','foe-stunned','foe-entering');actor.setAttribute('role','img');actor.removeAttribute('tabindex');actor.removeAttribute('aria-pressed')}hud.hidden=true;continue}const f=e.foes[i];
  actor.classList.remove('awaiting-spawn','enemy-arrival');
  hud.hidden=!f||f.hp<=0||now<e.spawnAt+e.entryDuration+i*e.entryStagger;if(!f){clearFoeTransition(actor);actor.hidden=true;continue}
  const fresh=actor.dataset.wave!==String(e.id);
  if(fresh){clearFoeTransition(actor);actor.getAnimations?.().filter(a=>!a.animationName).forEach(a=>a.cancel());actor.dataset.wave=String(e.id);delete actor.dataset.tacticArt;delete actor.dataset.dying;actor.classList.remove('foe-entering')}
  actor.hidden=f.hp<=0&&actor.dataset.dying!==String(e.id);
  actor.classList.add('tactical-creature');hud.classList.toggle('targeted',e.target===i&&f.hp>0);actor.classList.toggle('foe-windup',s.auto&&f.hp>0&&!statusOn(f.status,'stun')&&f.nextAttack-now<600);actor.classList.toggle('foe-stunned',statusOn(f.status,'stun'));
  actor.setAttribute('role','button');actor.setAttribute('tabindex',f.hp>0&&encounterReady(e)?'0':'-1');actor.setAttribute('aria-label',FOE_ROLES[f.kind][0]+' '+fieldMob(e.stage,f.species).name+' · 체력 '+compact(f.hp)+' · 집중 공격');actor.setAttribute('aria-pressed',String(e.target===i));
  setCreature(actor,'creature_'+CAMPAIGN_CREATURE_REGIONS[campaignPosition().area]+'_'+f.species);
  if(fresh&&f.hp>0)animateEnemyEntrance(actor,e,i);
  const name=FOE_ROLES[f.kind][0],status=Object.keys(f.status).filter(k=>statusOn(f.status,k)).map(k=>({stun:'기절',break:'약화',poison:'중독',burn:'화상',weaken:'공격↓'}[k]||''));
  const signature=name+':'+Math.ceil(f.hp)+':'+Math.round(f.hp/f.max*100)+':'+e.target+':'+status.join(',');if(hud.dataset.state!==signature){hud.dataset.state=signature;hud.innerHTML=`<b>${e.target===i?'<ui-mark data-shape=diamond aria-hidden=true></ui-mark> ':''}${name}</b><span><i style="width:${Math.max(0,f.hp/f.max*100)}%"></i><em>${compact(f.hp)}</em></span><small>${status.join(' · ')}</small>`}
 }
 if(e)$('region').textContent=BIOMES[campaignPosition().area].name+' · '+Math.min(3,Math.floor((s.stageKills||0)/3)+1)+'/3 웨이브';
 actorMotion.sync(e);
 const buffs=combatEffectsHud;if(buffs){const rows=['boost','guard'].filter(k=>statusOn(tacticsState().buffs,k));buffs.textContent=rows.map(k=>(k==='boost'?'공격↑ ':'피해↓ ')+Math.ceil((tacticsState().buffs[k].until-now)/1000)+'초').join(' · ')}
}
const tacticalPaintBattle=paintBattle;
paintBattle=function(){if(duoTransaction)return;tacticalPaintBattle();paintTactics()};
const tacticalCooldowns=paintCooldowns;
paintCooldowns=function(){if(s?.tactics){const t=tacticsState(),now=trialPausedAt()??Date.now();cooldowns=s.slots.map(k=>k<0?0:Math.max(0,(Math.max(t.ready[k]||0,t.classReadyAt||0)-now)/1000*s.speed))}for(let i=0;i<4;i++){const el=$('cool'+i);if(el){el.style.display=cooldowns[i]>0?'grid':'none';el.textContent=Math.ceil(cooldowns[i]/s.speed)}}};
const tacticalInit=initClassesCombat;
initClassesCombat=function(){tacticalInit();for(let i=0;i<3;i++){const node=document.createElement('div');node.id='foeHud'+i;node.className='foe-hud foe-hud-'+i;$('battle').appendChild(node);const actor=foeNode(i);actor.addEventListener('click',()=>chooseEnemy(i));actor.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();chooseEnemy(i)}})}combatEffectsHud=document.createElement('div');combatEffectsHud.id='combatBuffs';combatEffectsHud.className='combat-buffs';$('skillbuttons').appendChild(combatEffectsHud);setInterval(tickTactics,250);paintBattle()};

// Loadout UI: free edits, four slots, per-skill cooldowns survive changes and reloads.
const ROLE_NAMES={single:'단일',all:'광역',self:'지원'};
const PRESET_NAMES={hunt:'사냥',boss:'보스',survive:'생존'};
const PRESET_HINTS={hunt:'광역 공격으로 세 마리를 빠르게',boss:'약화와 단일 공격으로 집중 공략',survive:'제어와 회복으로 오래 버티기'};
function suggestedLoadout(kind){const ci=Math.max(0,classIndex(s.classId)),b=ci*4,x=20+ci*4,orders={hunt:[[b+2,b+3,x+3,x],[b+2,x+1,b+3,x],[x,b+3,x+1,x+2],[x,x+1,b+3,b+2],[x,b+3,x+2,b+2]],boss:[[x,x+1,b+1,b],[x,b+1,x+2,b],[x+2,b,b+1,b+3],[x+2,b,b+2,b+1],[x+1,b+1,x+3,b]],survive:[[x+2,x+3,b+2,b],[x+3,x+1,x,b],[b+1,x+3,x+1,b],[x+3,x+1,b+1,b],[x+2,x+1,b+2,b]]};const n=40+4*ci;
 const priorities=kind==='boss'?[[n+3,x,n+2,b+1],[n+2,n+3,x,b+1],[n+2,n+3,x+2,b],[n+2,x+2,b,b+1],[n+3,x+1,b+1,b]][ci]
  :kind==='hunt'?[[n+1,b+2,b+3,x+3],[n+1,b+2,x+1,b+3],[n+1,x,b+3,x+1],[n+3,n+1,x,b+3],[n+1,n+2,x,b+3]][ci]:[];
 const wanted=priorities.concat(orders[kind]?.[ci]||[]);return [...new Set(wanted.concat(classSkillIds()))].filter(k=>skillUnlocked(k)&&s.skills[k]).slice(0,4)}
function applySkillPreset(kind,useRecommendation=false){
 if(!s.classId||!PRESET_NAMES[kind])return false;
 unlockClassSkills();
 const t=tacticsState(),stored=t.presets[s.classId]?.[kind];
 const candidate=!useRecommendation&&Array.isArray(stored)?stored:suggestedLoadout(kind),used=new Set();
 s.slots=Array.from({length:4},(_,i)=>{
  const k=candidate[i];
  if(!slotOpen(i)||!skillUnlocked(k)||used.has(k))return -1;
  used.add(k);
  return k;
 });
 cooldowns=s.slots.map(k=>Math.max(0,(Math.max(t.ready[k]||0,t.classReadyAt||0)-Date.now())/1000*s.speed));
 if(!useRecommendation)t.selectedPreset=kind;
 rememberClass();save();paint();return true;
}
function saveSkillPreset(kind){if(!PRESET_NAMES[kind])return false;const t=tacticsState();t.presets[s.classId]||={};t.presets[s.classId][kind]=[...s.slots];t.selectedPreset=kind;save();notice(PRESET_NAMES[kind]+' 구성 저장');return true}
setSlot=function(slot,k){if(!slotOpen(slot)||!skillUnlocked(k)||!s.skills[k])return false;const old=s.slots.indexOf(k),replaced=s.slots[slot];if(old>=0)s.slots[old]=replaced;s.slots[slot]=k;const t=tacticsState();t.selectedPreset='custom';cooldowns=s.slots.map(k=>Math.max(0,(Math.max(t.ready[k]||0,t.classReadyAt||0)-Date.now())/1000*s.speed));rememberClass();save();paint();return true};
autoEquipSkills=function(){
 const selected=tacticsState().selectedPreset;
 const kind=guidance().status==='active'&&guidance().step===2?'hunt':PRESET_NAMES[selected]?selected:stageBossActive()?'boss':'hunt';
 if(!applySkillPreset(kind,true))return false;
 notice(PRESET_NAMES[kind]+' 추천 스킬 장착 완료');
 return true;
};
const oldSkillArt=skillArt;
skillArt=function renderSkill(k){
 if(k<20)return oldSkillArt(k);
 if(!CLASS_SKILLS[k])return art('skills');
 const atlas=k<40?'technique-art':'discovery-art';
 return `<span class="skill-sigil ${atlas}" aria-hidden="true" style="background-position:${(k%4)*100/3}% ${skillOwnerIndex(k)*25}%"></span>`;
};
function skillRoleLabel(k){const m=skillMeta(k);return ROLE_NAMES[m.target]+(['heal','guard'].includes(m.status)?' · 생존':['stun','break','weaken','poison','burn'].includes(m.status)?' · '+({stun:'제어',break:'약화',weaken:'약화',poison:'지속',burn:'지속'}[m.status]):'')}
function skillSummary(k){const m=skillMeta(k),d=compact(Math.round(skillDamage(k,s.skills[k]||1,true)*m.factor));return (m.target==='self'?'':(m.target==='all'?'모험 · 각 적 ':'모험 피해 ')+d+' · ')+SKILL_RULES[k].cd+'초'}
paintSkillButtons=function(){
 $('skillbuttons').innerHTML=s.slots.map((k,i)=>{
  const open=slotOpen(i),empty=k<0,label=!open?'STAGE '+SLOT_GATES[i]+' 해금':empty?'스킬 장착':SK[k][0];
  const icon=!open?skillLock():empty?'<i class="battle-slot-plus"><ui-mark data-shape=plus aria-hidden=true></ui-mark></i>':skillArt(k);
  const action=empty?"openMenu('availableSkills',"+i+")":'cast('+i+')';
  return `<button${open&&!empty&&skillMeta(k).target==='all'?' data-guide="cast"':''} class="${!open?'locked':empty?'empty-skill':''}" ${open?'onclick="'+action+'"':'disabled'} aria-label="${label}">${icon}<small id="cool${i}" style="display:${cooldowns[i]>0?'grid':'none'}">${Math.ceil(cooldowns[i]/s.speed)}</small><span class="skill-target">${open&&!empty?ROLE_NAMES[skillMeta(k).target]:''}</span><span class="battle-skill-name">${!open?'STAGE '+SLOT_GATES[i]:empty?'장착':SK[k][0]}</span></button>`;
 }).join('');
 if(combatEffectsHud)$('skillbuttons').appendChild(combatEffectsHud);
};

;
/* ./guided-ui.js */
'use strict';
const guideStarter=starter,guideMigrate=migrate;
function normalizeGuide(a,raw=a){
 const old=recordMap(raw.guidance),legacy=recordMap(a.journey);
 const statuses=['offer','active','paused','done','idle'];
 const status=statuses.includes(old.status)?old.status:statuses.includes(legacy.status)?legacy.status:'idle';
 const step=status==='done'?7:Math.min(old.version===3?6:4,Math.max(0,Math.floor(Number(old.step)||0)));
 a.guidance={version:3,status,step,areaUses:Math.max(0,Math.floor(Number(old.areaUses)||0)),
  completeAt:old.version===3&&Number.isFinite(old.completeAt)?Math.min(Math.max(0,old.completeAt),Date.now()+1500):0,
  rewarded:old.rewarded===true};
 return a;
}
starter=function(){return normalizeGuide(guideStarter())};
migrate=function(raw){return normalizeGuide(guideMigrate(raw),raw||{})};
function guidance(){if(!s.guidance)normalizeGuide(s);return s.guidance}
function guideScreen(page,sub){
 return {here:()=>!view&&activeScreen===page&&(!sub||screenTab===sub),go:()=>navigate(page,sub)};
}
function guideHasAreaSkill(){return classSkillIds().some(k=>skillUnlocked(k)&&skillMeta(k).target==='all')}
function equippedArea(){return s.slots.some((k,i)=>k>=0&&slotOpen(i)&&skillUnlocked(k)&&skillMeta(k).target==='all')}
const QUICK_GUIDE=[
 {...guideScreen('forge','craft'),target:'craft',text:'장비는 모루에서 성운석으로 만듭니다. 더 좋은 장비는 자동으로 장착됩니다.',done:()=>s.crafted>0},
 {...guideScreen('character','growth'),target:'growth',text:'골드로 능력치를 올립니다.',done:()=>s.stats[0]>1},
 {target:'hunt',text:'적 셋을 한 번에 치는 광역 스킬을 장착합니다.',done:equippedArea,
  here:()=>!view&&(guideHasAreaSkill()?activeScreen==='skills'&&screenTab==='library':activeScreen==='shop'&&screenTab==='summon'&&shopSummonKind==='skill'),
  go:()=>guideHasAreaSkill()?navigate('skills','library'):openShopSummons('skill')},
 {...guideScreen('home'),target:'cast',text:'스킬은 직접 누르거나 자동 전투가 사용합니다.',done:()=>guidance().areaUses>0},
 {target:'enhance',text:'전용 무기는 강화할수록 모습이 바뀝니다.',done:()=>currentWeapon()?.plus>=1,
  here:()=>view==='weaponEnhance'||!view&&activeScreen==='forge'&&screenTab==='weapon',go:()=>navigate('forge','weapon')},
 {target:'claim',text:'임무를 끝내면 여기서 보상을 받습니다.',done:()=>orderRows('daily').some(row=>row.claimed),
  here:()=>view==='quests'&&missionTab==='daily',go:()=>openMissions('daily')},
 {target:'dungeon',text:'하루 3번, 강화 재료를 얻는 곳입니다. STAGE 5 클리어 후 열립니다.',
  done:()=>featureOpen('material')&&s.dungeonWins?.some(n=>n>0),here:()=>!view&&activeScreen==='dungeon'&&screenTab==='challenges'||view==='dungeonGuide',
  go:()=>{if(featureOpen('material'))navigate('dungeon','challenges')}}
];
let retryGuideReward=false;
function collectGuideReward(){
 const g=guidance();
 if(g.status!=='active'||g.step!==QUICK_GUIDE.length-1||!g.completeAt||g.rewarded||Date.now()<g.completeAt)return false;
 retryGuideReward=false;
 const command=claimServerReward('guide','first',()=>openMenu('firstAdventureComplete','reward'));
 if(command)command.then(paid=>{if(!paid){retryGuideReward=true;paintJourneyPanel()}});
 return command;
}
function advanceQuickGuide(){
 const g=guidance();
 if(g.status!=='active')return;
 const step=QUICK_GUIDE[g.step],now=Date.now();
 if(!g.completeAt){
  if(step?.done()){g.completeAt=now+1500;save()}
  return;
 }
 if(now<g.completeAt)return;
 if(g.step===QUICK_GUIDE.length-1&&(resultAction||diamondRequest||dungeonRun||forgeBusy||wheelBusy))return;
 if(g.step===QUICK_GUIDE.length-1&&!g.rewarded&&saveGuard.usesServer?.()){
  if(!retryGuideReward)collectGuideReward();
  return;
 }
 g.completeAt=0;g.step++;
 if(g.step<QUICK_GUIDE.length){save();return}
 g.status='done';journeyState().status='done';
 const awarded=!g.rewarded;
 if(awarded){g.rewarded=true;grant({gems:150})}
 save();
 openMenu('firstAdventureComplete',awarded?'reward':'replay');
}
startPlayerJourney=function(){
 const g=guidance();
 if(g.status==='done'){g.step=0;g.areaUses=0;g.completeAt=0}
 g.status='active';journeyState().status='active';
 dismissPopup();guideAction();paint();save();
};
pausePlayerJourney=function(){guidance().status='paused';journeyState().status='paused';save();paint();paintJourneyPanel()};
skipPlayerJourney=function(){guidance().status='idle';journeyState().status='idle';dismissPopup();save();paint();paintJourneyPanel()};
goPlayerJourney=function(){return guideAction()};
nextPlayerJourney=function(){paintJourneyPanel();return guidance().status==='done'};
function guideWaiting(){return guidance().step===6&&!featureOpen('material')}
function guideAction(){
 const g=guidance(),step=QUICK_GUIDE[g.step];
 if(g.status!=='active'||!step||guideWaiting()||g.completeAt||dungeonRun||resultAction)return false;
 if(!step.here())step.go();
 paintJourneyPanel();
 return true;
}
function quickGuideHTML(){
 const g=guidance();
 if(g.status==='offer')return '<div class="quick-guide"><div><small>첫 모험 안내</small><b>일곱 단계를 마치면 다이아 150개를 받습니다.</b></div><button class="gold-button" onclick="startPlayerJourney()">안내 시작</button><button class="guide-skip" onclick="skipPlayerJourney()">나중에</button></div>';
 if(g.status!=='active')return '';
 const step=QUICK_GUIDE[g.step],waiting=guideWaiting();
 const text=waiting?'STAGE 5를 넘으면 이어집니다':step.text;
 const go=retryGuideReward&&g.completeAt&&g.step===QUICK_GUIDE.length-1?'<button onclick="collectGuideReward()">보상 받기</button>':!g.completeAt&&!waiting&&!view&&!step.here()?'<button class="gold-button" onclick="guideAction()">가 보기</button>':'';
 const badge=g.completeAt?'<strong class="guide-complete" role="status">완료</strong>':'';
 return '<div class="quick-guide"><div><small>첫 모험 '+(g.step+1)+'/7 '+badge+'</small><b>'+text+'</b></div>'+go+'<button class="guide-skip" onclick="pausePlayerJourney()" aria-label="안내 잠시 숨기기"><ui-mark data-shape=close aria-hidden=true></ui-mark></button></div>';
}
let lastGuideTarget=null,lastGuideRoute='';
function paintJourneyPanel(){
 if(!s)return;
 advanceQuickGuide();
 const g=guidance(),step=QUICK_GUIDE[g.step],active=g.status==='active'&&!dungeonRun,onHome=activeScreen==='home';
 const feature=$('featureGuide'),popup=$('popupGuide');
 let target=null;
 if(active&&!g.completeAt&&!guideWaiting()&&step.here()){
  const tag=g.step===2&&!guideHasAreaSkill()?'summon':step.target;
  const root=view?'#content':onHome?'#skillbuttons':'#screenContent';
  target=document.querySelector(root+' [data-guide="'+tag+'"]:not(:disabled)');
 }
 if(lastGuideTarget!==target){
  lastGuideTarget?.classList.remove('guide-target');target?.classList.add('guide-target');lastGuideTarget=target;
 }
 const route=[g.status,g.step,activeScreen,screenTab,view,!!target].join('|');
 if(route!==lastGuideRoute&&target&&!onHome)target.scrollIntoView?.({block:'nearest'});
 lastGuideRoute=route;
 const html=quickGuideHTML();
 feature.hidden=!active||onHome||!!view;
 if(!feature.hidden&&feature.innerHTML!==html)feature.innerHTML=html;
 if(popup){
  popup.hidden=!active||!view||!(['quests','weaponEnhance','dungeonGuide','challengeResult'].includes(view)||RESULT_VIEWS.has(view));
  if(!popup.hidden&&popup.innerHTML!==html)popup.innerHTML=html;
 }
 if(!onHome||dungeonRun)return;
 const quest=$('homeQuest'),homeHTML=defeatHelpHTML()||html;
 if(homeHTML){
  if(quest.innerHTML!==homeHTML)quest.innerHTML=homeHTML;
  quest.classList.add('guided-quest');
 }else if(quest.classList.contains('guided-quest')){
  quest.classList.remove('guided-quest');dashboardBeforeJourney();
 }
}
// The same six controls move out of the playfield when vertically stacked icons would cover the fight.
function placeBattleShortcuts(){
 if(!window.matchMedia)return;
 const compact=window.matchMedia('(max-width:540px)');
 const rail=$('battleShortcuts'),home=$('homeScreen'),field=$('battle');
 const place=()=>{
  if(compact.matches){
   if(rail.parentElement!==home)home.insertBefore(rail,field);
  }else if(rail.parentElement===home)field.insertBefore(rail,field.querySelector('.enemy-status'));
 };
 place();
 compact.addEventListener('change',place);
}
placeBattleShortcuts();
playerJourneyPopup=function(){const g=guidance();return `<section class="simple-guide"><h3>첫 모험 안내</h3><p>장비 제작부터 재료 던전까지 일곱 단계를 따라가세요. 첫 완료 보상은 다이아 150개입니다.</p><button class="gold-button" onclick="startPlayerJourney()">${g.status==='done'?'처음부터 다시 보기':g.status==='paused'?'이어하기':'안내 시작'}</button></section>`};
EXTRA_POPUPS.playerJourney=['첫 모험',playerJourneyPopup];
EXTRA_POPUPS.firstAdventureComplete=['첫 모험 완료',()=>'<section class="simple-guide"><p>'+ (tab==='reward'?'일곱 단계를 마쳤습니다. 다이아 150개를 받았습니다.':'일곱 단계를 다시 마쳤습니다.')+'</p>'+button('확인','closeMenu()')+'</section>'];
const guidedCast=cast;
cast=function(i,automatic=false){
 const g=guidance(),k=s.slots[i];
 const guideCast=g.status==='active'&&g.step===3&&!dungeonRun&&k>=0&&skillMeta(k).target==='all';
 const ok=guidedCast(i,automatic);
 if(ok&&guideCast&&!g.areaUses){g.areaUses++;paintJourneyPanel()}
 return ok;
};
const guidedChooseClass=chooseClass;
chooseClass=function(id){const ok=guidedChooseClass(id);if(ok){tacticsState().selectedPreset='custom';save()}return ok};

// Stable navigation: useful default landing pages and explicit, searchable routes.
SCREEN_META.character[0]='성장';SCREEN_META.content[0]='거점';
SCREEN_TABS.character.splice(0,SCREEN_TABS.character.length,['growth','능력'],['equipment','장비'],['class','직업'],['relics','유물'],['pets','동료'],['costume','스킨'],['collection','도감']);
SCREEN_TABS.dungeon.splice(0,SCREEN_TABS.dungeon.length,['challenges','재료 던전'],['content','도전'],['regions','지역'],['records','기록']);
const simplifiedNavigate=navigate;
navigate=function(page,sub){if(page==='character'&&!sub)sub='growth';if(page==='shop'&&!sub)sub='exchange';if(page==='skills'&&!sub)sub='library';const result=simplifiedNavigate(page,sub);paintJourneyPanel();return result};
const SYSTEM_TILES=[
 ['설정','settings',"openMenu('settings')"],['보상 코드','ticket',"openMenu('rewardCode')"],
 ['랭킹','ranking',"openMenu('ranking')"],
 ['공지','quests','openGameNotices()'],['도움말','skills',"openMenu('support')"],
 ['서버','dungeon',"openMenu('servers')"]
];
function convenientMenu(){
 return '<nav class="system-tiles" aria-label="전체 메뉴">'+SYSTEM_TILES.map(([name,icon,action])=>
  `<button type="button" onclick="${action}">${art(icon)}<strong>${name}</strong></button>`).join('')+'</nav>';
}
EXTRA_POPUPS.more=['전체 메뉴',convenientMenu];
const convenientOpen=openMenu;
openMenu=function(kind,...args){if(kind==='more'){dismissPopup();}return convenientOpen(kind,...args)};
infoPopup=function(){const text={character:'능력·장비·직업을 탭으로 전환하세요.',skills:'스킬을 눌러 장착·강화하세요. 사냥·보스·생존 구성을 저장할 수 있습니다.',dungeon:'필요한 보상을 고른 뒤 도전하세요.',shop:'재화를 확인하고 교환하세요.',home:'적을 누르면 집중 공격. 광역기는 모든 적을 공격해요.'};return `<div class="simple-guide"><h3>${SCREEN_META[tab]?.[0]||'모험'}</h3><p>${text[tab]||'하단 메뉴에서 이동할 곳을 선택하세요.'}</p></div>`};
EXTRA_POPUPS.regionDetail=['지역 정보',regionDetailPopup];
GAME_NOTICES.unshift({id:'tactical-pairs-20261106',date:'2026.11.06',tag:'전투 개편',title:'두 마리 전투와 직업별 8개 스킬',body:'일반 전투가 2마리씩 3웨이브로 바뀌었습니다. 적을 눌러 공격 대상을 선택하고 방어형·회복형·돌격형에 맞춰 공략하세요. 각 직업은 8개 중 4개를 장착하며 사냥·보스·생존 구성을 저장할 수 있습니다. 전체 메뉴에 기능 검색을 추가하고 첫 모험 안내를 4가지 직접 행동으로 줄였습니다.'});
const guidedInit=initClassesCombat;
initClassesCombat=function(){guidedInit();document.body.classList.add('guided-ui');const header=document.querySelector('button[aria-label="전체 메뉴"]');if(header)header.setAttribute('title','전체 메뉴');paintJourneyPanel();setInterval(()=>{if(s&&guidance().status==='active'&&!document.hidden)paintJourneyPanel()},500)};

GAME_NOTICES.unshift({id:'triple-arrival-20261106',date:'2026.11.06',tag:'전투 개선',title:'3마리씩 3웨이브 · 몬스터 등장 모션',body:'몬스터가 오른쪽 화면 밖에서 순서대로 들어옵니다. 한 무리 3마리를 처치하고 총 3웨이브를 완료하면 다음 스테이지로 진행합니다. 광역 스킬은 세 적을 함께 공격합니다.'});

;
/* ./player-hit.js */
'use strict';
// Incoming damage is reported at the same point that HP is deducted.
// Presentation never changes attack scheduling, mitigation, or player cooldowns.
const playerHitFeedback=(()=>{
 const slots=[];
 let layer=null,lane=0,sequence=0,flash=null,barFlash=null;
 const visible=()=>!!s?.classId&&activeScreen==='home'&&!view&&!document.hidden;
 function release(slot){slot.version++;clearTimeout(slot.timer);slot.animation?.cancel();slot.animation=null;slot.busy=false;slot.node.hidden=true}
 function clear(){slots.forEach(release);flash?.cancel();barFlash?.cancel();flash=null;barFlash=null}
 function show(amount){
  if(!Number.isFinite(amount)||amount<=0||!visible())return false;
  const battle=$('battle'),hero=$('heroActor'),bar=$('heroHealth');if(!battle||!hero||!bar)return false;
  if(!layer){layer=document.createElement('div');layer.id='playerDamageLayer';layer.setAttribute('aria-hidden','true')}
  if(layer.parentNode!==battle)battle.appendChild(layer);
  let slot=slots.find(x=>!x.busy);
  if(!slot&&slots.length<4){const node=document.createElement('span');node.className='player-damage-number';slot={node,busy:false,version:0,used:0,timer:null,animation:null};slots.push(slot)}
  if(!slot)slot=slots.reduce((a,b)=>a.used<b.used?a:b);
  release(slot);slot.busy=true;slot.used=++sequence;slot.node.hidden=false;
  if(slot.node.parentNode!==layer)layer.appendChild(slot.node);
  const bounds=battle.getBoundingClientRect(),anchor=bar.getBoundingClientRect(),column=lane++%3-1;
  const x=Math.max(38,Math.min(bounds.width-38,anchor.left-bounds.left+anchor.width/2+column*12));
  const y=Math.max(32,anchor.top-bounds.top-33-(column+1)*12);
  slot.node.style.left=x+'px';slot.node.style.top=y+'px';
  slot.node.textContent='−'+(amount<1000?amount.toLocaleString('ko-KR',{maximumFractionDigits:amount<1?2:1}):compact(amount));
  const version=slot.version,finish=()=>{if(slot.version===version)release(slot)};
  // Keep essential damage information visible even with effects disabled.
  if(motionAllowed()&&slot.node.animate){
   slot.animation=slot.node.animate([{offset:0,transform:'translate(-50%,4px) scale(.9)',opacity:0},{offset:.12,transform:'translate(-50%,0) scale(1.08)',opacity:1},{offset:.65,transform:'translate(-50%,-10px) scale(1)',opacity:1},{offset:1,transform:'translate(-50%,-19px) scale(.98)',opacity:0}],{duration:900,fill:'both',easing:'ease-out'});
   slot.animation.onfinish=finish;
   flash?.cancel();barFlash?.cancel();
   const base=hero.style.filter||'drop-shadow(0 7px 5px #1119)';
   if(hero.animate)flash=hero.animate([{filter:base},{offset:.18,filter:base+' brightness(1.2) sepia(.3) drop-shadow(0 0 5px #ff526c)'},{filter:base}],{duration:220,easing:'ease-out'});
   if($('heroHealthFill')?.animate)barFlash=$('heroHealthFill').animate([{filter:'brightness(1)'},{offset:.15,filter:'brightness(1.8)',boxShadow:'0 0 7px #ff6079'},{filter:'brightness(1)',boxShadow:'none'}],{duration:260});
  }
  slot.timer=setTimeout(finish,950);return true;
 }
 function init(){document.addEventListener('visibilitychange',()=>{if(document.hidden)clear()});window.matchMedia?.('(prefers-reduced-motion: reduce)').addEventListener?.('change',clear)}
 return {show,clear,init,stats:()=>({nodes:slots.length,active:slots.filter(x=>x.busy).length,uses:sequence})};
})();
function applyHeroDamage(amount,source){
 if(trialCombatPaused()||!Number.isFinite(amount)||amount<=0||!Number.isFinite(heroCurrentHp)||heroCurrentHp<=0)return 0;
 const actual=Math.min(heroCurrentHp,amount*(1-armorMitigation())*weaponModifier('frost'));heroCurrentHp=Math.max(0,heroCurrentHp-actual);
 actorMotion.hurt($('heroActor'),1/Math.max(1,s.speed||1));if(!source||isDuoBattle())paintAdventureImpact($('heroActor'),'impact',-1,'steel',false,false,false,true,source);paintHeroHealth();playerHitFeedback.show(actual);return actual;
}
const healthBeforeHitFeedback=paintHeroHealth;
paintHeroHealth=function(){healthBeforeHitFeedback();$('heroHealth')?.classList.toggle('low-health',heroCurrentHp/Math.max(1,health())<=.3)};
const cancelBeforeHitFeedback=cancelCombatAnimation,navigateBeforeHitFeedback=navigate,menuBeforeHitFeedback=openMenu,preferencesBeforeHitFeedback=applyPreferences;
cancelCombatAnimation=function(...args){playerHitFeedback.clear();return cancelBeforeHitFeedback(...args)};
navigate=function(page,sub){
 if(!guardFeature(featureForScreen(page,sub)))return false;
 playerHitFeedback.clear();
 const result=navigateBeforeHitFeedback(page,sub);
 updateAdventureUnlocks();return result;
};
openMenu=function(kind,arg){
 if(!guardFeature(featureForMenu(kind,arg)))return false;
 playerHitFeedback.clear();
 const result=menuBeforeHitFeedback(kind,arg);
 updateAdventureUnlocks();return result;
};
applyPreferences=function(...args){playerHitFeedback.clear();return preferencesBeforeHitFeedback(...args)};
const initBeforeHitFeedback=initClassesCombat;
initClassesCombat=function(){initBeforeHitFeedback();playerHitFeedback.init()};

;
/* ./collection.js */
'use strict';
const gradeColors=['#b7aba4','#69c8de','#b98bf3','#f0bb61'];
function collectionTile({name,icon,level,grade,color,equipped,action,empty=false,upgrade=false}){
 const status=empty?'빈 슬롯':!level?'미획득':(equipped?'장착 중 · ':'')+'Lv.'+level;
 const mark=empty?'':!level?skillLock():equipped?'<ui-mark data-shape=check aria-hidden=true></ui-mark>':upgrade?'<ui-mark data-shape=chevron-up aria-hidden=true></ui-mark>':'';
 return '<button type="button" class="collection-tile '+(!level&&!empty?'undiscovered ':'')+(equipped?'worn':'')+'" style="--rim:'+color+'" onclick="'+action+'" aria-label="'+name+(grade?' · '+grade:'')+' · '+status+'"><span class="tile-art">'+icon+(mark?'<i class="tile-mark">'+mark+'</i>':'')+(level?'<b class="tile-level">Lv.'+level+'</b>':'')+'</span><span class="tile-name">'+name+'</span></button>';
}
function skillTile(k){
 const grade=SKILL_RULES[k].tier,lv=s.skills[k]||0;
 return collectionTile({name:SK[k][0],icon:skillArt(k),level:lv,grade:SKILL_GRADES[grade],color:gradeColors[grade],equipped:s.slots.includes(k),action:"openMenu('skillDetail',"+k+")",upgrade:lv>0&&lv<100&&s.shards>=skillCost(k)});
}
function slotTile(i,k,choosing){
 const open=slotOpen(i),action=choosing===undefined?k<0?"openMenu('availableSkills',"+i+")":"openMenu('skillDetail',"+k+")":"equipAt("+i+","+choosing+")";
 if(!open)return '<button class="collection-tile slot-off" disabled><span class="tile-art">'+skillLock()+'</span><span class="tile-name">STAGE '+SLOT_GATES[i]+'</span></button>';
 return collectionTile({name:k<0?'슬롯 '+(i+1):SK[k][0],icon:k<0?'<span class="slot-plus"><ui-mark data-shape=plus aria-hidden=true></ui-mark></span>':skillArt(k),level:k<0?0:s.skills[k],grade:k<0?'':SKILL_GRADES[SKILL_RULES[k].tier],color:k<0?'#625769':gradeColors[SKILL_RULES[k].tier],equipped:false,empty:k<0,action});
}
skillsScreen=function(){
 unlockClassSkills();
 const ids=classSkillIds(),t=tacticsState();
 const choices=Object.entries(PRESET_NAMES).map(([key,title])=>'<button class="'+(t.selectedPreset===key?'active':'')+'" onclick="applySkillPreset(\''+key+'\')">'+title+'</button>').join('');
 return skillMaterialHUD()+'<section class="codex-block"><div class="codex-heading"><h3>장착 스킬</h3><div class="skill-build-actions"><button type="button" class="gold-button" data-guide="hunt" onclick="autoEquipSkills()">'+(guidance().status==='active'&&guidance().step===2?'사냥 구성 장착':'추천 스킬')+'</button><button class="muted-button" onclick="openMenu(\'saveBuild\')">구성 저장</button></div></div><div class="build-presets">'+choices+'</div><div class="collection-grid4">'+s.slots.map((k,i)=>slotTile(i,k)).join('')+'</div></section><section class="codex-block"><div class="codex-heading"><h3>스킬 도감</h3><span>'+ids.filter(k=>s.skills[k]).length+' / '+ids.length+'</span></div><div class="collection-grid4">'+ids.sort((a,b)=>SKILL_RULES[a].tier-SKILL_RULES[b].tier).map(skillTile).join('')+'</div></section>';
};
EXTRA_POPUPS.saveBuild=['구성 저장',()=>'<div class="action-row">'+Object.entries(PRESET_NAMES).map(([key,title])=>button(title,"saveSkillPreset('"+key+"');closeMenu()",false,true)).join('')+'</div>'];
function equipAt(i,k){if(!setSlot(i,k))return false;dismissPopup();renderScreen();return true}
function removeAt(i){
 if(!slotOpen(i)||s.slots[i]<0)return false;
 s.slots[i]=-1;cooldowns[i]=0;tacticsState().selectedPreset='custom';rememberClass();save();dismissPopup();paint();renderScreen();return true;
}
function beginEquip(k){
 if(!skillUnlocked(k))return;
 const free=s.slots.findIndex((v,i)=>v<0&&slotOpen(i));
 if(free>=0)equipAt(free,k);else openMenu('replaceSkill',k);
}
EXTRA_POPUPS.replaceSkill=['교체할 슬롯',()=>'<div class="collection-grid4">'+s.slots.map((v,i)=>slotTile(i,v,Number(tab))).join('')+'</div>'];
EXTRA_POPUPS.availableSkills=['장착할 스킬',()=>{
 const i=Number(tab),ids=classSkillIds().filter(k=>skillUnlocked(k)&&!s.slots.includes(k));
 return ids.length?'<div class="collection-grid4">'+ids.map(k=>collectionTile({name:SK[k][0],icon:skillArt(k),level:s.skills[k],grade:SKILL_GRADES[SKILL_RULES[k].tier],color:gradeColors[SKILL_RULES[k].tier],action:'equipAt('+i+','+k+')'})).join('')+'</div>':button('상점에서 스킬 소환',"openShopSummons('skill')");
}];
skillPopup=function(){
 const k=Number(tab);if(!skillBelongs(k))return '';
 const r=SKILL_RULES[k],lv=s.skills[k]||0,slot=s.slots.indexOf(k),cost=skillCost(k);
 const actions=lv?button(slot>=0?'장착 해제':'장착',slot>=0?'removeAt('+slot+')':'beginEquip('+k+')')+button(lv>=100?'최대 레벨':'강화 · 조각 '+cost,'skillLevel('+k+');render()',lv>=100||s.shards<cost,true):button('상점에서 스킬 소환',"openShopSummons('skill')");
 return skillMaterialHUD(k)+'<div class="ability-sheet" style="--rim:'+gradeColors[r.tier]+'">'+skillArt(k)+'<div><small>'+SKILL_GRADES[r.tier]+' · '+skillRoleLabel(k)+'</small><h3>'+SK[k][0]+'</h3><b>'+(lv?'Lv.'+lv:'미획득')+'</b></div></div><p class="ability-copy">'+CLASS_SKILLS[k][5]+'</p><div class="ability-metrics"><b>'+skillSummary(k)+'</b></div><div class="action-row">'+actions+'</div>';
};
function skillOddsRows(){
 return SKILL_GRADES.map((name,tier)=>({name,color:gradeColors[tier],chance:SKILL_RATES[tier]}));
}
summonRates=function(){
 const ids=classSkillIds();
 const groups=skillOddsRows().map((row,tier)=>{
  const pool=ids.filter(id=>SKILL_RULES[id].tier===tier);
  return summonOddsGroup(row,pool.map(id=>({name:SK[id][0],icon:skillArt(id),chance:row.chance/pool.length})));
 });
 return '<p class="small">한국 시간 0시 무료 1회. 첫 무료 소환은 미보유 기본 광역 스킬을 보장합니다. 결제 수단별 확률 동일 · 10회도 개별 추첨 · 중복 시 스킬 조각 10~20개(희귀 ×1.5 · 영웅 ×2 · 전설 ×3). 강화에 드는 조각도 같은 배수입니다</p>'+groups.join('');
};
EXTRA_POPUPS.summonRates=['스킬 소환 확률',summonRates];
summonScreen=function(){
 const ids=classSkillIds();
 const banner=`<section class="skill-observatory"><div><h2>${currentClass().name} 스킬 소환</h2><span>수집 ${ids.filter(id=>s.skills[id]>0).length} / ${ids.length}</span></div></section>`;
 return banner+summonOddsPanel(skillOddsRows(),'스킬 등급별·개별 확률',"openMenu('summonRates')")+drawControls('skill');
};
EXTRA_POPUPS.summonResult=['스킬 소환 결과',summonResult];
petsScreen=function(){
 const count=PETS.filter((_,i)=>s.pets[i]>0).length,j=s.activePet;
 return petMaterialHUD()+'<section class="codex-block"><div class="codex-heading"><h3>동행 중</h3><button class="muted-button" onclick="openShopSummons(\'pet\')">상점에서 소환</button></div>'+(j>=0?'<button class="pet-partner" onclick="openMenu(\'petDetail\','+j+')">'+petArt(j)+'<span>'+petTier(j).name+'<strong>'+PETS[j]+'</strong></span><b>Lv.'+s.pets[j]+'</b></button>':'<div class="no-partner">'+skillLock()+' 동행할 동료를 소환하세요</div>')+'</section><section class="codex-block"><div class="codex-heading"><h3>동료 도감</h3><span>'+count+' / '+PETS.length+'</span></div><div class="collection-grid4">'+petDisplayOrder().map(i=>collectionTile({name:PETS[i],icon:petArt(i),grade:petTier(i).name,color:petTier(i).color,level:s.pets[i]||0,equipped:i===j,upgrade:s.pets[i]>0&&s.pets[i]<50&&s.petShards>=petCost(i),action:"openMenu('petDetail',"+i+")"})).join('')+'</div></section>';
};
const dailyGifts={gems:{art:'gem',label:'다이아',flag:'shopGift',amount:()=>30},gold:{art:'coin',label:'골드',flag:'shopGold',amount:()=>Math.max(100,Math.round(goldGain()*6))}};
function giftAds(kind){return Math.min(2,Math.max(0,Math.floor(Number(s.daily.giftAds?.[kind])||0)))}
function dailyShopCards(){
 return Object.entries(dailyGifts).map(([kind,g])=>{
  const free=!!s.daily[g.flag],n=giftAds(kind),action=free?"startGiftAd('"+kind+"')":"claimFreeGift('"+kind+"')";
  return '<div class="offer-card daily-gift"><small>일일 선물</small><strong>'+g.label+' '+num(g.amount())+'</strong>'+art(g.art)+button(!free?'무료 수령':n<2?'광고 · '+(2-n)+'회 남음':'오늘 수령 완료',action,n>=2)+'</div>';
 }).join('');
}
function claimFreeGift(kind){
 resetDay();const g=dailyGifts[kind];if(!g||s.daily[g.flag])return false;
 if(kind==='gems'){const result=claimShopDaily();return saveGuard.usesServer()?result:true}
 s.daily[g.flag]=true;const n=g.amount();s[kind]+=n;save();paint();notice(g.label+' +'+num(n));return true;
}
let pendingGiftAd=null;
function finishGiftAd(ad){
 if(pendingGiftAd!==ad||!ad||s!==ad.owner||s.day!==ad.day||today()!==ad.day||!s.daily[dailyGifts[ad.kind].flag]||giftAds(ad.kind)>=2)return false;
 if(ad.kind==='gems'&&saveGuard.usesServer()){
  if(ad.settling)return false;
  ad.settling=true;render();
  return claimAccountReward('shopAd','gems:'+(giftAds('gems')+1)).then(receipt=>{
   if(pendingGiftAd===ad){
    if(receipt){pendingGiftAd=null;if(view==='rewardAd')dismissPopup()}
    else {ad.settling=false;if(view==='rewardAd')render()}
   }
   return !!receipt;
  });
 }
 pendingGiftAd=null;const g=dailyGifts[ad.kind];s.daily.giftAds||={};s.daily.giftAds[ad.kind]=giftAds(ad.kind)+1;s[ad.kind]+=ad.amount;
 save();dismissPopup();paint();notice(g.label+' +'+num(ad.amount));return true;
}
function startGiftAd(kind){
 resetDay();const g=dailyGifts[kind];if(!g||!s.daily[g.flag]||giftAds(kind)>=2||pendingGiftAd)return false;
 const ad={kind,owner:s,day:s.day,amount:g.amount(),ends:Date.now()+3000};pendingGiftAd=ad;openMenu('rewardAd');
 ad.timer=setTimeout(()=>{if(pendingGiftAd===ad&&view==='rewardAd')render()},3020);return true;
}
function collectTestAd(){const ad=pendingGiftAd;if(!ad||view!=='rewardAd'||document.hidden||Date.now()<ad.ends)return false;return finishGiftAd(ad)}
function cancelGiftAd(){if(pendingGiftAd)clearTimeout(pendingGiftAd.timer);pendingGiftAd=null}
EXTRA_POPUPS.rewardAd=['광고 보상 테스트',()=>{
 const a=pendingGiftAd;if(!a)return '';
 const done=Date.now()>=a.ends;
 return '<div class="test-ad">'+art(dailyGifts[a.kind].art)+'<h3>'+dailyGifts[a.kind].label+' '+num(a.amount)+'</h3><p>테스트 재생 · 3초</p><i></i></div><div class="action-row">'+button('닫기','closeMenu()',false,true)+button('보상 받기','collectTestAd()',!done||a.settling)+'</div>';
}];
const closeBeforeGift=closeMenu,dismissBeforeGift=dismissPopup;
closeMenu=function(...args){if(view==='rewardAd')cancelGiftAd();return closeBeforeGift(...args)};
dismissPopup=function(...args){
 if(view==='rewardAd')cancelGiftAd();
 const result=dismissBeforeGift(...args);
 if(activeScreen==='home'&&s?.guidance?.status==='active')paintJourneyPanel();
 return result;
};
document.addEventListener('visibilitychange',()=>{if(document.hidden&&pendingGiftAd){cancelGiftAd();if(view==='rewardAd')closeMenu()}});


;
/* ./archer-flight.js */
'use strict';
// Coordinates refer to the arrowhead. Each skill keeps its nocked arrow when the string releases it.
const archerFlight=(()=>{
 const normal={name:null,scale:1,release:137,arc:.025};
 const shots={
  16:{name:'wind',scale:1.19,release:119,arc:.06},
  17:{name:'star',scale:1.06,release:111,arc:.045},
  18:{name:'piercing',scale:1.78,release:169,arc:0},
  19:{name:'star',scale:1.19,release:112,rain:true},
  36:{name:'ember',scale:1.42,release:149,arc:.14},
  37:{name:'star',scale:1.28,release:153,arc:.035},
  38:{name:'venom',scale:1.21,release:127,arc:.26},
  39:{name:'piercing',scale:1.33,release:161,arc:.013},
  56:{name:'wind',scale:1.43,release:106,arc:.015},
  57:{name:'twilight',scale:1.43,release:112,rain:true,elevation:50},
  58:{name:'frost',scale:1.31,release:129,arc:.21},
  59:{name:'phoenix',scale:1.64,release:134,arc:.077}
 };
 const art=new Map();
 const spec=id=>shots[id]||normal;
 function texture(id){
  const name=spec(id).name,key=name||'physical';
  if(!art.has(key)){
   const im=new Image();im.decoding='async';im.src=name?'./assets/arrow-skills/'+name+'.webp?v=128':'./assets/adventure-fx/archer-arrow.webp';art.set(key,im);
  }
  return art.get(key);
 }
 texture(-1);
 function length(width,id=-1){return Math.min(58,Math.max(46,55*width/390))*spec(id).scale}
 const clamp=t=>Math.max(0,Math.min(1,t));
 function parabola(from,to,t,rise){
  const dx=to.x-from.x,dy=to.y-from.y;
  return {x:from.x+dx*t,y:from.y+dy*t-4*rise*t*(1-t),angle:Math.atan2(dy-4*rise*(1-2*t),dx)};
 }
 function pose(from,to,t,kind,width,id=-1,beat=0){
  const shot=spec(id),dx=to.x-from.x,dy=to.y-from.y;
  if(shot.rain){
   if(t<.37){
    const u=t/.37;
    // The seed arrow leaves the raised bow, then wheels upward and dissolves into the falling volley.
    const vx=shot.elevation ? .16 : .23;
    const vy=shot.elevation ? vx*Math.tan(shot.elevation*Math.PI/180) : .095;
    const ax=.14-vx,ay=.31-vy;
    return {x:from.x+width*(vx*u+ax*u*u),y:from.y-width*(vy*u+ay*u*u),
     angle:Math.atan2(-vy-2*ay*u,vx+2*ax*u)};
   }
   // Each volley falls from above its own landing point, along the direction of the shaft.
   const height=Math.min(width*.43,180),sweep=height*(id===57?.46:.25)+(beat%3-1)*width*.024;
   const u=clamp((t-.37)/.63),drop=.42*u+.58*u*u;
   return {x:to.x-sweep*(1-u),y:to.y-height*(1-drop),angle:Math.atan2(height*(.42+1.16*u),sweep)};
  }
  if(id===36){
   const dip=dx*.24;
   return {x:from.x+dx*t,y:from.y+dip*t+(dy-dip)*t*t,
    angle:Math.atan2(dip+2*(dy-dip)*t,dx)};
  }
  const arc=shots[id]?shot.arc:({pierce:.008,rain:.32,ice:.06})[kind]??normal.arc;
  return parabola(from,to,t,Math.min(Math.hypot(dx,dy),width*.75)*arc);
 }
 // The pressure wake is painted behind the vanes and tapers into the traced trajectory.
 const wake={16:'wind',18:'wind',36:'fire',38:'poison',39:'wind',56:'wind',58:'snare',59:'phoenix'};
 function draw(ctx,from,to,t,kind,width,opacity=1,id=-1,beat=0,lead=true){
  if(opacity<=0)return;
  const s=spec(id),p=pose(from,to,t,kind,width,id,beat);
  if(s.rain&&t<.37){
   if(!lead||beat!==0)return;
   opacity*=clamp((.37-t)/.104);
  }
  if(s.rain&&t>=.37)opacity*=clamp((t-.37)/.09);
  if(t>1&&id!==18&&id!==56&&id!==59)return;
  const im=texture(id),full=length(width,id);
  // Let the energy shaft extend out of the drawn bow. A full-length streak on the first
  // flight frame would stretch backward through the archer on a close target.
  const distance=Math.hypot(p.x-from.x,p.y-from.y);
  const span=id<0?full:Math.min(full,Math.min(37,width*.09)+distance*.90);
  const wakeOn=clamp(distance/(width*.20));
  ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.angle);
  if(wake[id]&&id!==18){
   ctx.save();
   if(id===59)ctx.scale(-1,1);
   combatEffects.cell(ctx,wake[id],.22+.46*Math.min(1,t),span*(id===59?.72:-.78),0,span*(id===59?1.42:.95),span*(id===59?.65:.32),0,opacity*.69*wakeOn);
   ctx.restore();
  }
  if(id===18){
   // Two narrow, dissipating pressure ribbons spiral around the single crystal shaft.
   for(let side=-1;side<=1;side+=2){
    ctx.globalAlpha=opacity*.72*wakeOn;ctx.strokeStyle=side>0?'#a4f4ff':'#afa5ff';ctx.lineWidth=Math.max(1,span*.018);
    ctx.beginPath();
    for(let j=0;j<=16;j++){
     const u=j/16,x=-span*(.10+1.12*u),y=side*Math.sin(5.9*u-Math.min(1.6,t)*6)*span*.068*Math.sin(Math.PI*u);
     if(!j)ctx.moveTo(x,y);else ctx.lineTo(x,y);
    }
    ctx.stroke();
   }
  }
  if(im.naturalWidth){
   const h=span*im.naturalHeight/im.naturalWidth;
   const sprite=window.NebulaEnemyUnity?.heroReady()&&window.NebulaHeroUnity?.scheduleSprite?.(im)||im;
   ctx.globalAlpha=opacity;ctx.drawImage(sprite,-span,-h/2,span,h);
  }else if(s.name){
   // The cold-load silhouette still shows a head, shaft and fletching.
   const physical=texture(-1);
   if(physical.naturalWidth){const h=span*physical.naturalHeight/physical.naturalWidth;ctx.globalAlpha=opacity;ctx.drawImage(physical,-span,-h/2,span,h)}
  }
  ctx.restore();
 }
 function nocked(ctx,nock,rest,hand,id=-1){
  const selected=texture(id),im=selected.naturalWidth?selected:texture(-1);if(!im.naturalWidth)return;
  const angle=Math.atan2(rest[1]-hand[1],rest[0]-hand[0]);
  const span=Math.max(20,Math.hypot(rest[0]-hand[0],rest[1]-hand[1]));
  const h=span*im.naturalHeight/im.naturalWidth;
  ctx.save();ctx.translate(nock[0],nock[1]);ctx.rotate(angle);ctx.drawImage(im,0,-h/2,span,h);ctx.restore();
 }
 function tailMs(id){return id===18?178:id===56||id===59?108:0}
 return {spec,texture,length,pose,draw,nocked,tailMs};
})();

;
/* ./spell-flight.js */
'use strict';
// Ranged skills resolve on the simulation's hit beat. This is their approach to that beat.
// The art is shared with the character's own element and the registered impact paintings.
const spellTrails=(()=>{
 const books={
  warrior:{41:['stone','upheaval']},
  shadow:{6:['spectral','brand'],24:['dagger','venomKnife'],44:['dagger','jadeKnife'],47:['dagger','raven']},
  paladin:{11:['light','judgment'],28:['light','sanctuary'],29:['light','chains'],
   31:['light','purify'],48:['light','sunLance'],49:['light','silverSeal'],51:['light','seraph']},
  mage:{12:['ember','fireball'],13:['ice','frozenPage'],14:['storm','lightning'],15:['comet','meteor'],
   32:['ember','firefield'],33:['ice','frostPrison'],34:[null,null],35:['ice','barrier'],
   52:['ice','splinters'],53:['ember','cinders'],54:['storm','fork'],55:['comet','blueComet']}
 };
 const skills=new Map();
 for(const book of Object.values(books))for(const [id,spec] of Object.entries(book))skills.set(+id,spec[1]);
 const clamp=t=>Math.max(0,Math.min(1,t));
 const bank=new Map();
 const layers={
  upheaval:['boss-fx/fault','adventure-fx/dust'],brand:['skill-motion/mist','boss-fx/rift'],
  venomKnife:['adventure-fx/dagger','adventure-fx/mist'],jadeKnife:['weapon-forge/shadow-5','skill-motion/wind','adventure-fx/mist'],
  raven:['weapon-forge/shadow-2','boss-fx/souls'],judgment:['boss-fx/lances','adventure-fx/gold'],
  sanctuary:['skill-motion/heal','skill-motion/ward'],chains:['skill-motion/bolt','adventure-fx/gold'],
  purify:['skill-motion/heal','adventure-fx/gold'],sunLance:['boss-fx/lances','adventure-fx/gold'],
  silverSeal:['skill-motion/snare','skill-motion/ward'],seraph:['boss-fx/lances','skill-motion/wind'],
  fireball:['adventure-fx/fire','boss-fx/embers'],frozenPage:['skill-motion/ice','adventure-fx/shard'],
  lightning:['skill-motion/bolt'],meteor:['adventure-fx/fire','boss-fx/magma'],
  firefield:['skill-motion/fire','boss-fx/embers'],frostPrison:['skill-motion/snare','adventure-fx/frost'],
  barrier:['skill-motion/ward','adventure-fx/plasma'],splinters:['adventure-fx/shard','skill-motion/wind'],
  cinders:['boss-fx/embers','adventure-fx/fire'],fork:['skill-motion/bolt'],blueComet:['adventure-fx/frost','adventure-fx/shard']
 };
 function picture(key){
  let im=bank.get(key);
  if(!im){im=new Image();bank.set(key,im);im.decoding='async';im.src='./assets/'+key+'.webp'}
  return im;
 }
 function preload(id){for(const key of layers[skills.get(id)]||[])picture(key)}
 function style(job,id){return books[job]?.[id]?.[0]}
 // Position the painted landmark (tip, base, or core) rather than the texture rectangle.
 function stamp(ctx,key,x,y,w,h,angle,alpha,px=.5,py=.5,frame=0){
  if(alpha<=0||w<=0||h<=0)return;
  const im=picture(key);
  if(!im.naturalWidth)return;
  ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.globalAlpha=alpha;
  if(key.startsWith('skill-motion/')){
   const f=Math.min(15,Math.max(0,Math.floor(frame*16))),u=im.naturalWidth/4;
   const sheet=window.NebulaEnemyUnity?.heroReady()&&window.NebulaHeroUnity?.scheduleCel(im,f)||im;
   ctx.drawImage(sheet,(f%4)*u,Math.floor(f/4)*u,u,u,-w*px,-h*py,w,h);
  }else ctx.drawImage(im,-w*px,-h*py,w,h);
  ctx.restore();
 }
 function flight(a,b,t,rise){
  const dx=b.x-a.x,dy=b.y-a.y;
  return {x:a.x+dx*t,y:a.y+dy*t-4*rise*t*(1-t),angle:Math.atan2(dy-4*rise*(1-2*t),dx)};
 }
 function draw(ctx,from,to,t,kind,width,alpha,id,ordinal=0){
  const name=skills.get(id);
  if(!name)return false;
  t=clamp(t);
  const u=Math.max(.78,Math.min(1.40,width/390)),phase=.17+.52*t;
  const tex=(key,x,y,w,h,angle=0,opacity=1,px=.5,py=.5,frame=phase)=>
   stamp(ctx,key,x,y,w*u,h*u,angle,alpha*opacity,px,py,frame);
  // Local paths are expressed in CSS pixels at 390px, and finish at the game's own target.
  const path=(rise=0,delta=0)=>flight(from,to,clamp(t+delta),rise*u);
  function sky(height,drift){
   const side=from.x<=to.x?1:-1;
   return {x:to.x+(drift+(ordinal%3-1)*12)*u*side,y:to.y-height*u};
  }
  function sparkBolt(origin,end,branch=false){
   const fraction=1-(1-t)**1.6,q={x:origin.x+(end.x-origin.x)*fraction,y:origin.y+(end.y-origin.y)*fraction};
   const dx=q.x-origin.x,dy=q.y-origin.y,n=Math.hypot(dx,dy);
   if(n<1)return;
   const rot=Math.atan2(dy,dx)-Math.PI*.5;
   // The painted bolt's foot sits at .83 in the atlas. Orient the whole branching silhouette.
   tex('skill-motion/bolt',q.x,q.y,(branch?34:64)*(.72+.28*fraction),n/u/.79,
    rot,branch?.81:.98,.43,.83,.14+.49*t);
  }
  function lamp(point){
   const grow=(1-t)*.36;
   tex('adventure-fx/gold',point.x,point.y,24+grow*20,26+grow*20,t*1.3,.65);
  }
  switch(name){
   case 'lightning':case 'fork':{
    const origin=sky(name==='fork'?124:139,-24);
    sparkBolt(origin,to);
    if(name==='fork'){
     const split={x:origin.x+(to.x-origin.x)*.39,y:origin.y+(to.y-origin.y)*.39};
     sparkBolt(split,{x:to.x+(ordinal%2?23:-23)*u,y:to.y-7*u},true);
    }
    break;
   }
   case 'meteor':case 'blueComet':{
    const cold=name==='blueComet',origin=sky(cold?142:130,cold?-62:44);
    const p=flight(origin,to,.04*t+.96*t*t,0),wake=cold?'adventure-fx/frost':'adventure-fx/fire';
    const L=cold?83:73;
    tex(wake,p.x,p.y,L,L*.78,p.angle-Math.PI*.72,.92,.70,.67);
    if(cold)tex('adventure-fx/shard',p.x,p.y,47,15,p.angle,1,.98,.50);
    else tex('boss-fx/magma',p.x,p.y,36,38,p.angle+1.3+t*1.6,1,.66,.55);
    break;
   }
   case 'judgment':{
    const p=flight(sky(114,(ordinal%2?1:-1)*21),to,t*t,0);
    tex('boss-fx/lances',p.x,p.y,36,78,p.angle-Math.PI*.5,1,.50,.97);break;
   }
   case 'sunLance':case 'seraph':{
    const seraph=name==='seraph',p=path(seraph?(ordinal%2?12:-8):2);
    if(seraph){
     const reach=12*u,cx=p.x-Math.cos(p.angle)*reach,cy=p.y-Math.sin(p.angle)*reach;
     for(const wing of [-1,1])tex('skill-motion/wind',cx,cy,75,29,p.angle+wing*(.20+.15*Math.sin(t*Math.PI)),.91,.92,.51);
    }
    else tex('adventure-fx/gold',p.x,p.y,68,25,p.angle,.82,.86,.50);
    tex('boss-fx/lances',p.x,p.y,seraph?33:43,seraph?91:83,p.angle-Math.PI*.5,1,.50,.97);
    break;
   }
   case 'chains':{
    const p=path(-9),n=Math.hypot(p.x-from.x,p.y-from.y);
    tex('skill-motion/bolt',p.x,p.y,42,n/u/.80,p.angle-Math.PI*.5,.72,.43,.83);
    const N=5;for(let i=1;i<=N;i++){const q=flight(from,p,i/N,1*u);lamp(q)}
    break;
   }
   case 'venomKnife':case 'jadeKnife':case 'raven':{
    const raven=name==='raven',jade=name==='jadeKnife';
    const p=path(raven?(ordinal%2?37:-15):jade?21:5),angle=p.angle;
    // The steel edge stays opaque over the moving vapour and turns edge-on in flight.
    if(raven)tex('boss-fx/souls',p.x,p.y,81,31,angle+Math.PI,.86,.12,.53);
    else tex('adventure-fx/mist',p.x,p.y,jade?68:43,jade?30:20,angle+.17*Math.sin(t*7),.91,.88,.51);
    if(jade)tex('skill-motion/wind',p.x,p.y,58,15,angle,.63,.93,.51);
    const roll=.69+.31*Math.abs(Math.cos(t*Math.PI*2));
    if(jade||raven){
     const blade=jade?'weapon-forge/shadow-5':'weapon-forge/shadow-2';
     tex(blade,p.x,p.y,(jade?19:22)*roll,jade?54:65,angle+Math.PI*.5,1,jade?.35:.47,0);
    }else tex('adventure-fx/dagger',p.x,p.y,45,10*roll,angle,1,.99,.50);
    break;
   }
   case 'fireball':{
    const p=path(14);
    tex('boss-fx/embers',p.x,p.y,69,33,p.angle,.74,.85,.5);
    tex('adventure-fx/fire',p.x,p.y,49,52,p.angle-2.03+.18*Math.sin(t*9),1,.48,.68);
    break;
   }
   case 'splinters':{
    for(let i=-1;i<=1;i++){
     const q=flight(from,to,t,(i*20+4)*u);
     if(!i)tex('skill-motion/wind',q.x,q.y,62,22,q.angle,.78,.91,.5);
     tex('adventure-fx/shard',q.x,q.y,i?33:48,i?9:15,q.angle,1,.99,.51);
    }
    break;
   }
   case 'upheaval':{
    const base={x:from.x+(to.x-from.x)*.17,y:to.y},p=flight(base,to,t,0);
    tex('adventure-fx/dust',p.x,p.y,68,24,0,.81,.76,.82);
    tex('boss-fx/fault',p.x,p.y,29+31*t,17+39*t,0,.98,.49,.87);
    break;
   }
   case 'brand':{
    tex('boss-fx/rift',to.x,to.y,23+22*t,18+15*t,t*1.45,.62);
    tex('skill-motion/mist',to.x,to.y,53,42,0,.36+.55*t,.59,.77);break;
   }
   case 'barrier':{
    tex('skill-motion/ward',from.x,from.y+10*u,60,59,0,.91,.50,.73);
    const p=path(4);tex('adventure-fx/plasma',p.x,p.y,34,28,p.angle+2*t,.80);break;
   }
   case 'frozenPage':case 'frostPrison':case 'silverSeal':case 'sanctuary':case 'firefield':case 'cinders':{
    // Projected charge belongs to the ground. Surface width opens before vertical growth.
    const scale=.32+.68*t,edge=(1-t)*26*u,op=.43+.57*t;
    if(name==='frozenPage'){
     tex('skill-motion/ice',to.x,to.y,53*scale,45*scale,0,op,.45,.77);
     for(const side of [-1,1])tex('adventure-fx/shard',to.x+side*edge,to.y-5*u,30,9,side>0?2.2:.9,op,.98,.5);
    }else if(name==='frostPrison'||name==='silverSeal'){
     tex('skill-motion/snare',to.x,to.y,89*scale,22+28*t,0,op,.50,.69);
     if(name==='frostPrison')tex('adventure-fx/frost',to.x,to.y,38*scale,28*scale,-.30,.68,.50,.82);
     else tex('skill-motion/ward',to.x,to.y,69*scale,16+17*t,0,.78,.50,.79);
    }else if(name==='sanctuary'){
     tex('skill-motion/ward',to.x,to.y,82*scale,18+20*t,0,op,.50,.79);
     tex('skill-motion/heal',to.x,to.y,36,16+47*t,0,.85,.50,.85);
    }else{
     tex('boss-fx/embers',to.x,to.y,76*scale,18+10*t,0,.83,.50,.70);
     if(name==='firefield')tex('skill-motion/fire',to.x,to.y,64*scale,14+24*t,0,op,.46,.80);
     else for(const side of [-1,1]){
      const angle=t*2.8+(side===1?Math.PI:0);
      tex('adventure-fx/fire',to.x+Math.cos(angle)*33*u*scale,to.y+Math.sin(angle)*6*u*scale,
       23,23,angle*.24,op,.50,.85);
     }
    }
    break;
   }
   case 'purify':{
    const p=path(16);lamp(p);tex('skill-motion/heal',p.x,p.y,38,54,p.angle+Math.PI*.5,.83,.5,.8);break;
   }
  }
  return true;
 }
 return {style,draw,preload};
})();

;
/* ./companion-cels.js */
'use strict';
const COMPANION_CELS=[
{"times":[0.0,0.0833333,0.1666667,0.25,0.3333333,0.4166667,0.5,0.5833333,0.6666667,0.75,0.8333333,0.9166667,1.0],"release":0.5,"muzzle":[0.77826,0.32635],"points":[[0.7375,0.30312],[0.71867,0.29022],[0.71002,0.28477],[0.7081,0.28338],[0.72836,0.29184],[0.76274,0.313],[0.77826,0.32635],[0.74778,0.30722],[0.71719,0.29392],[0.73201,0.30023],[0.74195,0.30514],[0.74127,0.30483],[0.7375,0.30312]]},
{"times":[0.0,0.0833333,0.1666667,0.25,0.3333333,0.4166667,0.5,0.5833333,0.6666667,0.75,0.8333333,0.9166667,1.0],"release":0.5,"muzzle":[0.50634,0.3608],"points":[[0.46875,0.34063],[0.44846,0.335],[0.43948,0.33378],[0.43759,0.33367],[0.45757,0.33719],[0.49148,0.35067],[0.50634,0.3608],[0.47769,0.34375],[0.44795,0.33354],[0.46295,0.33825],[0.47296,0.34223],[0.47231,0.34201],[0.46875,0.34063]]},
{"times":[0.0,0.0833333,0.1666667,0.25,0.3333333,0.4166667,0.5,0.5833333,0.6666667,0.75,0.8333333,0.9166667,1.0],"release":0.5,"muzzle":[0.77812,0.14062],"points":[[0.69375,0.13125],[0.64375,0.13437],[0.62187,0.14062],[0.61562,0.14062],[0.65938,0.13125],[0.74062,0.13125],[0.77812,0.14062],[0.71562,0.125],[0.65312,0.125],[0.68125,0.125],[0.70312,0.13125],[0.7,0.12812],[0.69375,0.13125]]},
{"times":[0.0,0.0833333,0.1666667,0.25,0.3333333,0.4166667,0.5,0.5833333,0.6666667,0.75,0.8333333,0.9166667,1.0],"release":0.5,"muzzle":[0.8875,0.25938],"points":[[0.83125,0.16875],[0.79063,0.14062],[0.77812,0.1375],[0.76875,0.13125],[0.80312,0.15],[0.86562,0.2125],[0.8875,0.25938],[0.85,0.19062],[0.8,0.14688],[0.82188,0.1625],[0.8375,0.175],[0.8375,0.175],[0.83125,0.16875]]},
{"times":[0.0,0.0833333,0.1666667,0.25,0.3333333,0.4166667,0.5,0.5833333,0.6666667,0.75,0.8333333,0.9166667,1.0],"release":0.5,"muzzle":[0.6319,0.31306],"points":[[0.59375,0.30312],[0.57268,0.29788],[0.56309,0.29636],[0.56091,0.296],[0.58045,0.29702],[0.61504,0.30539],[0.6319,0.31306],[0.6041,0.30259],[0.57755,0.29768],[0.58962,0.30093],[0.59776,0.30372],[0.59714,0.30373],[0.59375,0.30312]]},
{"times":[0.0,0.0833333,0.1666667,0.25,0.3333333,0.4166667,0.5,0.5833333,0.6666667,0.75,0.8333333,0.9166667,1.0],"release":0.5,"muzzle":[0.68206,0.37595],"points":[[0.65625,0.37188],[0.64316,0.37347],[0.63749,0.37491],[0.63627,0.3754],[0.64845,0.37406],[0.67065,0.37436],[0.68206,0.37595],[0.66472,0.3727],[0.64878,0.37155],[0.65479,0.37178],[0.65891,0.37208],[0.6585,0.37205],[0.65625,0.37188]]},
{"times":[0.0,0.083333,0.166667,0.25,0.333333,0.416667,0.5,0.583333,0.666667,0.75,0.833333,0.916667,1.0],"release":0.5,"muzzle":[0.87976,0.30516],"points":[[0.85625,0.3125],[0.86285,0.323],[0.86669,0.33403],[0.86765,0.34577],[0.86657,0.35193],[0.8771,0.32772],[0.87976,0.30516],[0.87416,0.30998],[0.86426,0.31338],[0.85128,0.31274],[0.84803,0.31243],[0.84963,0.31242],[0.85625,0.3125]]},
{"times":[0.0,0.083333,0.166667,0.25,0.333333,0.416667,0.5,0.583333,0.666667,0.75,0.833333,0.916667,1.0],"release":0.5,"muzzle":[0.89897,0.66807],"points":[[0.82812,0.6875],[0.80957,0.69124],[0.79081,0.69336],[0.77032,0.69303],[0.75883,0.69162],[0.83916,0.68363],[0.89897,0.66807],[0.88861,0.66677],[0.86699,0.67172],[0.82374,0.68887],[0.81162,0.69278],[0.8149,0.69182],[0.82812,0.6875]]},
{"times":[0.0,0.083333,0.166667,0.25,0.333333,0.416667,0.5,0.583333,0.666667,0.75,0.833333,0.916667,1.0],"release":0.5,"muzzle":[0.26176,0.17727],"points":[[0.3125,0.1375],[0.33578,0.12071],[0.35542,0.10233],[0.37816,0.08021],[0.39351,0.06633],[0.31484,0.1119],[0.26176,0.17727],[0.26593,0.17397],[0.28137,0.15387],[0.33308,0.11326],[0.34674,0.10644],[0.34053,0.11309],[0.3125,0.1375]]},
{"times":[0.0,0.083333,0.166667,0.25,0.333333,0.416667,0.5,0.583333,0.666667,0.75,0.833333,0.916667,1.0],"release":0.5,"muzzle":[0.75415,0.20348],"points":[[0.75625,0.23125],[0.76529,0.24193],[0.7694,0.25207],[0.7664,0.26221],[0.76179,0.2674],[0.75965,0.22928],[0.75415,0.20348],[0.75055,0.20958],[0.74835,0.21931],[0.75121,0.23248],[0.75199,0.23603],[0.75282,0.23507],[0.75625,0.23125]]},
{"times":[0.0,0.083333,0.166667,0.25,0.333333,0.416667,0.5,0.583333,0.666667,0.75,0.833333,0.916667,1.0],"release":0.5,"muzzle":[0.84776,0.43662],"points":[[0.82188,0.4375],[0.81453,0.439],[0.80762,0.44108],[0.79894,0.44273],[0.79382,0.44371],[0.82247,0.43704],[0.84776,0.43662],[0.84031,0.43397],[0.82796,0.43157],[0.81615,0.43613],[0.81336,0.4376],[0.81503,0.43758],[0.82188,0.4375]]},
{"times":[0.0,0.083333,0.166667,0.25,0.333333,0.416667,0.5,0.583333,0.666667,0.75,0.833333,0.916667,1.0],"release":0.5,"muzzle":[0.77233,0.22723],"points":[[0.71562,0.25938],[0.71228,0.26536],[0.70058,0.26694],[0.68246,0.26532],[0.67029,0.26257],[0.72439,0.23931],[0.77233,0.22723],[0.75873,0.23659],[0.73393,0.24494],[0.7094,0.25354],[0.70211,0.25693],[0.7057,0.25881],[0.71562,0.25938]]}
];

;
/* ./companion-motion.js */
'use strict';
// Authored in normalized image coordinates. A cast uses the same clock and socket for art and flight.
const companionMotion=(()=>{
 const releaseMs=119,finishMs=420,contactMs=270;
 const books=[
  ['ember','fire','#ffa553',.09],['ice','shard','#a6e3ff',.05],['seed','pod','#afe59a',.16],
  ['cinder','fire','#ffb374',.11],['feather','gold','#f0dbad',.12],['lunar','frost','#a6e7ff',.10],
  ['stone','shard','#dac59b',.23],['light','gold','#ffe4a2',.05],['lunar','frost','#b4cafd',.16],
  ['spectral','plasma','#c4adfa',.085],['spore','pod','#efc183',.22],['feather','gold','#ffda89',.08]
 ];
 const cache=new Map(),particles=new Map();
 const clamp=x=>Math.max(0,Math.min(1,x));
 function active(){const id=s.activePet;return Number.isInteger(id)&&books[id]&&s.pets?.[id]>0?id:-1}
 function imageFor(map,key,url){
  let picture=map.get(key);
  if(!picture){
   picture=new Image();picture.decoding='async';picture.src=url;
   if(map===cache&&map.size>=3)map.delete(map.keys().next().value);
   map.set(key,picture);
  }
  return picture;
 }
 const url=id=>'./assets/companion-motion/companion-'+id+'.webp';
 function sheet(id){return imageFor(cache,id,url(id))}
 function frame(id,ms){
  if(ms==null||ms<=0||ms>=finishMs)return 0;
  const data=COMPANION_CELS[id],p=ms<releaseMs?ms/releaseMs*data.release:
   data.release+(1-data.release)*(ms-releaseMs)/(finishMs-releaseMs);
  let i=0;
  while(i+1<data.times.length&&p>(data.times[i]+data.times[i+1])/2)i++;
  return i;
 }
 function draw(ctx,atlas,index,x,y,size){
  if(!atlas?.naturalWidth)return false;
  const cell=atlas.naturalWidth/4;
  const source=window.NebulaEnemyUnity?.heroReady()&&window.NebulaHeroUnity?.scheduleCel(atlas,index)||atlas;
  ctx.drawImage(source,index%4*cell,Math.floor(index/4)*cell,cell,cell,x,y,size,size);
  return true;
 }
 function socket(id,index){const d=COMPANION_CELS[id];return d.points?.[index]||d.muzzle}
 function style(id=active()){return books[id]?[books[id][0],...COMPANION_CELS[id].muzzle]:null}
 function flight(ctx,id,a,b,t,fade,width){
  const [kind,texture,color,arc]=books[id],u=clamp(t);
  const dx=b.x-a.x,dy=b.y-a.y,k=Math.max(.80,Math.min(1.6,width/390));
  const rise=Math.min(width*.75,Math.hypot(dx,dy))*arc;
  const point=v=>[a.x+dx*v,a.y+dy*v-4*rise*v*(1-v)];
  const [x,y]=point(u),angle=Math.atan2(dy-4*rise*(1-2*u),dx);
  const sprite=imageFor(particles,texture,'./assets/adventure-fx/'+texture+'.webp');
  ctx.save();ctx.lineCap='round';ctx.strokeStyle=color;
  const tail=.10+.03*Math.sin(Math.PI*u);
  for(let i=0;i<4;i++){
   const s=point(Math.max(0,u-tail*(1-i/4))),e=point(Math.max(0,u-tail*(1-(i+1)/4)));
   ctx.globalAlpha=fade*(.13+i*.12);ctx.lineWidth=(1+i*.57)*k;
   ctx.beginPath();ctx.moveTo(...s);ctx.lineTo(...e);ctx.stroke();
  }
  ctx.translate(x,y);ctx.rotate(angle);ctx.globalAlpha=fade;
  const length=(kind==='light'||kind==='feather'||kind==='cinder'?22:16)*k;
  if(kind==='lunar'){
   ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(-5*k,-7*k);
   ctx.quadraticCurveTo(12*k,-k,-5*k,7*k);ctx.quadraticCurveTo(2*k,0,-5*k,-7*k);ctx.fill();
  }else if(kind==='feather'||kind==='cinder'){
   ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(7*k,0);ctx.quadraticCurveTo(-2*k,-7*k,-12*k,-2*k);
   ctx.quadraticCurveTo(-9*k,4*k,7*k,0);ctx.fill();
   ctx.strokeStyle='#fff4d7';ctx.lineWidth=k;ctx.beginPath();ctx.moveTo(-12*k,2*k);ctx.lineTo(5*k,0);ctx.stroke();
  }else if(sprite.naturalWidth){
   const h=length*sprite.naturalHeight/sprite.naturalWidth;
   ctx.drawImage(sprite,-length*.72,-h*.5,length,h);
  }
  else{ctx.fillStyle=color;ctx.beginPath();ctx.ellipse(0,0,5*k,2.5*k,0,0,Math.PI*2);ctx.fill()}
  ctx.restore();
 }
 function assist(ctx,id,ms,box,target,impact,cast,width){
  const index=frame(id,ms),atlas=sheet(id);
  draw(ctx,atlas,index,box.x,box.y,box.w);
  if(!cast||ms<releaseMs||ms>impact+85)return;
  if(!cast.petOrigin){
   const [sx,sy]=COMPANION_CELS[id].muzzle;
   cast.petOrigin={x:(box.x+box.w*sx)/width,y:(box.y+box.w*sy)/width};
  }
  const from={x:cast.petOrigin.x*width,y:cast.petOrigin.y*width};
  flight(ctx,id,from,target,clamp((ms-releaseMs)/(impact-releaseMs)),1-clamp((ms-impact)/85),width);
 }
 return {active,style,url,sheet,frame,socket,draw,flight,assist,releaseMs,finishMs,contactMs};
})();

;
/* ./ranged-combat.js */
'use strict';
// Presentation consumes the combat schedule. Only the original combat callbacks can deal damage.
const rangedCombat=(()=>{
 const profiles={
  arrow:   {shape:'arrow',color:'#bdad92',core:'#ffffdf',arc:.025},
  pierce:  {shape:'arrow',color:'#78ceff',core:'#efffff',arc:.008},
  rain:    {shape:'arrow',color:'#ead39a',core:'#fff6db',arc:.32},
  ember:   {shape:'fire',color:'#ff803d',core:'#ffe9a1',arc:.075},
  ice:     {shape:'shard',color:'#6dc9fa',core:'#e7ffff',arc:.06},
  storm:   {shape:'bolt',color:'#9ea3ff',core:'#f4edff',arc:.035},
  comet:   {shape:'fire',color:'#87adff',core:'#f2ecff',arc:.36},
  venom:   {shape:'drop',color:'#9ad766',core:'#eff3ab',arc:.21},
  spore:   {shape:'seed',color:'#e0b66f',core:'#fff1b4',arc:.24},
  seed:    {shape:'seed',color:'#83cd76',core:'#d7ffae',arc:.18},
  spectral:{shape:'wisp',color:'#ad85ef',core:'#f3d8ff',arc:.12},
  lunar:   {shape:'crescent',color:'#72cde9',core:'#e8faff',arc:.115},
  light:   {shape:'lance',color:'#ffd485',core:'#fff9d9',arc:.025},
  feather: {shape:'feather',color:'#d9a773',core:'#fff1c2',arc:.13},
  cinder:  {shape:'feather',color:'#ff9d40',core:'#fff3b9',arc:.16},
  dagger:  {shape:'blade',color:'#a791da',core:'#e8edff',arc:.055},
  stone:   {shape:'shard',color:'#d39b69',core:'#f8d5a7',arc:.24}
 };
 // Emission points belong to the existing painted species, normalised to their sprite cell.
 const enemyStyles={
  cap:['spore',.155,.40],sapling:['seed',.23,.54],toad:['venom',.26,.535],hydra:['venom',.105,.43],
  imp:['ember',.30,.49],wraith:['spectral',.32,.48],orb:['storm',.46,.44],seraph:['light',.37,.43],
  pyromancer:['ember',.088,.355],oracle:['spectral',.138,.284],
  nautilus:['spectral',.36,.52],leviathan:['spectral',.32,.43]
 };
 const clamp=t=>Math.max(0,Math.min(1,t));
 const shots=[],hostiles=new Map(),brushes=new Map();
 const limit=24,linger=105;
 let canvas=null,ctx=null,battle=null,dirty=false,pixelRatio=1,seq=0,width=0,height=0;
 let swing=null;
 let counters={volleys:0,assists:0,casts:0,arrivals:0};
 const drawArrow=archerFlight.draw,arrowPose=archerFlight.pose,arrowLength=archerFlight.length;
 const drawNockedArrow=archerFlight.nocked;
 const releaseTime=skillMotion.releaseTime;
 function heroStyle(job,k){
  if(k>=0&&skillMeta(k).target==='self')return null;
  if(job==='archer')return k===18||k===56||k===59?'pierce':archerFlight.spec(k).rain?'rain':'arrow';
  const authored=spellTrails.style(job,k);
  if(authored!==undefined)return authored;
  if(job==='mage')return 'ember';
  return null;
 }
 const petStyle=companionMotion.style;
 function resize(){
  if(!ctx)return;
  width=battle.clientWidth;height=battle.clientHeight;pixelRatio=Math.min(2,window.devicePixelRatio||1);
  canvas.width=Math.max(1,Math.ceil(width*pixelRatio));canvas.height=Math.max(1,Math.ceil(height*pixelRatio));
  ctx.setTransform(pixelRatio,0,0,pixelRatio,0,0);
 }
 function surface(){
  if(!warriorMotion.visible()||typeof HTMLCanvasElement==='undefined')return false;
  if(ctx)return true;
  const c=document.createElement('canvas'),context=c.getContext('2d');
  if(typeof context?.createRadialGradient!=='function')return false;
  battle=$('battle');canvas=c;ctx=context;c.className='ranged-combat-layer';c.setAttribute('aria-hidden','true');battle.appendChild(c);
  resize();new ResizeObserver(resize).observe(battle);return true;
 }
 function remove(i){if(hostiles.get(shots[i].caster)===shots[i])hostiles.delete(shots[i].caster);shots.splice(i,1)}
 function queue(data){
  if(shots.length>=limit){const oldest=shots.findIndex(s=>s.hitAt!==undefined);remove(oldest<0?0:oldest)}
  const shot={...data,serial:++seq,stage:s.stage,save:s,run:dungeonRun,boss:dungeonRun?.bosses,attempt:s.stageBossAttempt,pet:s.activePet};
  shots.push(shot);return shot;
 }
 function valid(shot,wall){
  if(shot.save!==s||shot.stage!==s.stage||shot.run!==dungeonRun||shot.boss!==dungeonRun?.bosses||shot.pair&&shot.pair!==s.tactics.encounter)return false;
  if(!shot.pair&&!shot.run&&shot.attempt!==s.stageBossAttempt)return false;
  if(shot.hitAt!==undefined)return true;
  if(heroCurrentHp<=0)return false;
  if(shot.caster)return shot.caster.hp!==0&&!statusOn(shot.caster.status,'stun',wall)&&!shot.from.hidden&&!shot.from.dataset.dying;
  return shot.token===combatSerial&&(shot.actor!=='pet'||shot.pet===s.activePet);
 }
 function heroCast(k,factor,token,pair,hits=SKILL_RULES[k]?.hits||1){
  if(skillMeta(k).target==='self')return false;
  const style=heroStyle(s.classId,k),pet=petStyle();
  if((!style&&!pet)||!surface())return false;
  const start=performance.now(),ranged=!!style,clock=skillMotion.clock(s.classId,k,factor);
  const area=skillMeta(k).target==='all';
  const indices=area&&pair?pair.foes.map((_,i)=>i).filter(i=>pair.foes[i].hp>0):[-1];
  if(ranged){
   const rank=eventSkinEquipped()?6:s.wear%OUTFIT_STRIDE;
   const focus=[[.705,.133],[.75,.255],[.78,.265],[.70,.15],[.785,.18],[.71,.16],[.755,.23]];
   const hand=s.classId==='archer'?[rank===6?.81:.74,.35]:
    s.classId==='mage'?focus[rank]||focus[0]:s.classId==='paladin'?[.85,.30]:[.80,.41];
   const release=releaseTime(s.classId,k);
   // A piercing shot has one physical shaft. Area damage is resolved for every victim by the combat clock.
   const lead=pair&&indices.includes(pair.target)?pair.target:indices[0];
   const lanes=k===18||k===36?[lead]:indices;
   for(let j=0;j<hits;j++)for(const index of lanes){
    queue({actor:'hero',skillId:k,kind:style,from:$('heroActor'),hand,index,token,pair,hit:j,
     lead:index===lead,
     cue:start+clock.elapsed(j?release+70*j-48:0),release:start+clock.elapsed(release+70*j),end:start+clock.elapsed(270+70*j)});
   }
   counters.volleys++;
  }
  if(pet){
   queue({actor:'pet',kind:pet[0],from:$('battlePet'),hand:pet.slice(1),index:-1,token,pair,hit:0,
    cue:start,release:start+clock.elapsed(companionMotion.releaseMs),end:start+clock.elapsed(companionMotion.contactMs),clock});
   counters.assists++;
  }
  return ranged;
 }
 // The survival loop runs every 250 ms. Predict the actual due tick, including at 2x.
 // Do not advance the simulation, or grant a shot to a stunned, dead or departing actor.
 function planEnemy(node,body,foe,pair,now,speed){
  const style=enemyStyles[body],remaining=foe.nextAttack-now;
  if(!style||remaining<=0||remaining*speed>900||!surface())return;
  const prev=hostiles.get(foe);if(prev?.deadline===foe.nextAttack)return;
  if(prev){const i=shots.indexOf(prev);if(i>=0)remove(i)}
  const wait=Math.ceil(remaining/250)*250,end=performance.now()+wait;
  const shot=queue({actor:'enemy',kind:style[0],from:node,hand:style.slice(1),index:-1,caster:foe,pair,
   deadline:foe.nextAttack,cue:end-700/speed,release:end-310/speed,end});
  hostiles.set(foe,shot);counters.casts++;
 }
 function enemyPose(foe,now){const shot=hostiles.get(foe);if(!shot||shot.hitAt!==undefined)return null;
  return {draw:clamp((now-shot.cue)/(shot.release-shot.cue)),flight:clamp((now-shot.release)/(shot.end-shot.release))};
 }
 function target(shot){
  if(shot.caster)return $('heroActor');
  const index=shot.index<0?(shot.pair?.target??0):shot.index;
  return foeNode(index);
 }
 const boxes=new Map(),frameMarks=new Map();
 function flightMark(node,feet){
  let marks=frameMarks.get(node);if(!marks){marks={};frameMarks.set(node,marks)}
  return marks[feet]||=hitPoint(node,feet);
 }
 function point(node,xy){
  const sprite=node.querySelector?.('.actor-cel:not([hidden])')||node;
  if(!boxes.has(sprite))boxes.set(sprite,sprite.getBoundingClientRect());
  if(!boxes.has(battle))boxes.set(battle,battle.getBoundingClientRect());
  const r=boxes.get(sprite),b=boxes.get(battle);
  const margin=sprite.actorPadding||0,span=1+2*margin;
  const x=(xy[0]+margin)/span,y=(xy[1]+margin)/span;
  const k=(battle.clientWidth/b.width)||1;
  return {x:(r.left-b.left+r.width*x)*k,y:(r.top-b.top+r.height*y)*k};
 }
 // CSS rotations on the actor and the padded canvas are rigid. Map the painted grip
 // and edge through those same rotations, instead of treating their rotated bounds as an axis-aligned sprite.
 function paintedPoints(node,coords){
  const cel=node.querySelector?.('.actor-cel:not([hidden])');
  const host=battle||$('battle');
  if(!cel?.offsetWidth||!host?.clientWidth){
   const r=node.getBoundingClientRect(),b=host.getBoundingClientRect();
   const k=host.clientWidth/b.width||1;
   return coords.map(([x,y])=>({x:(r.left-b.left+r.width*x/512)*k,y:(r.top-b.top+r.height*y/512)*k}));
  }
  const r=cel.getBoundingClientRect(),b=host.getBoundingClientRect();
  const scale=host.clientWidth/b.width,centerX=(r.left+r.width*.5-b.left)*scale,centerY=(r.top+r.height*.5-b.top)*scale;
  let angle=0;
  for(const el of [node,cel]){
   const matrix=getComputedStyle(el).transform;
   if(matrix&&matrix!=='none'){const m=new DOMMatrixReadOnly(matrix);angle+=Math.atan2(m.b,m.a);}
  }
  const cos=Math.cos(angle),sin=Math.sin(angle),extent=512*(1+2*(cel.actorPadding||0));
  return coords.map(([x,y])=>{
   const dx=(x-256)*cel.offsetWidth/extent,dy=(y-256)*cel.offsetHeight/extent;
   return {x:centerX+cos*dx-sin*dy,y:centerY+sin*dx+cos*dy};
  });
 }
 // The arrowhead, contact painting and damage number all sample the same landmark.
 function hitPoint(node,feet=false,bounds=null){
  const mark=actorMotion.targetMark(node,feet),cel=actorMotion.canvas(node);
  if(cel)return paintedPoints(node,[mark.map(n=>n*512)])[0];
  const host=battle||$('battle'),b=bounds?.battle||host.getBoundingClientRect(),r=bounds?.actor||node.getBoundingClientRect();
  const k=host.clientWidth/b.width||1;
  const padded=node.dataset?.restArt&&node.dataset.restArt!=='creature_0_0';
  const xy=padded?mark.map(n=>(n-.5)*1.25+.5):mark;
  return {x:(r.left-b.left+r.width*xy[0])*k,y:(r.top-b.top+r.height*xy[1])*k};
 }
 function swingTrail(job,id,token,factor,hits){
  if(!surface())return;
  swing={job,id,token,clock:skillMotion.clock(job,id,factor),hits,start:performance.now(),points:[]};
 }
 function paintSwing(now){
  if(!swing)return;
  const {job,id,token,clock,hits,start,points}=swing,t=clock.pose(now-start);
  if(token!==combatSerial||t>345+(hits-1)*70){swing=null;return}
  if(t<178)return;
  const tip=actorMotion.emitter();
  if(!tip){points.length=0;return}
  const hand=skinMotion.strikingPart(job,id,t),last=points.at(-1);
  // A change of hand or a new painted arm pose starts a fresh arc. Connecting
  // separate poses draws a straight luminous cord through the character.
  if(last&&(last.hand!==hand||t-last.time>48||Math.hypot(tip[0]-last.tip[0],tip[1]-last.tip[1])>.23))points.length=0;
  const pos=paintedPoints($('heroActor'),[tip.map(n=>n*512)])[0];
  while(points.length&&points[0].time<t-64)points.shift();
  points.push({...pos,time:t,tip,hand});
  const tone=job==='paladin'?'#e4bf77':job==='shadow'?'#c0a5cd':'#d4d5cb';
  const weight=(job==='shadow'?1.3:job==='warrior'?2.7:2.2)*(id>=0?1.65:1);
  for(let i=1;i<points.length;i++){
   const alpha=i/points.length*(id<0?.34:.58);
   if(id>=0){
    const prev=points[i-1],next=points[i],length=Math.hypot(next.x-prev.x,next.y-prev.y);
    if(length>2)combatEffects.cell(ctx,job==='shadow'?'cross':job==='paladin'?'lance':'wind',
     .30+.20*i/points.length,(prev.x+next.x)/2,(prev.y+next.y)/2,length+8,weight*6,
     Math.atan2(next.y-prev.y,next.x-prev.x),alpha);
   }
   line([points[i-1],points[i]],tone,weight*(.5+i/points.length),alpha);
  }
 }
 function origin(shot){
  if(shot.actor==='pet'){
   const phase=Math.max(0,Math.min(companionMotion.releaseMs,shot.clock.pose(performance.now()-shot.cue)));
   const hand=companionMotion.socket(shot.pet,companionMotion.frame(shot.pet,phase));
   return paintedPoints(shot.from,[hand.map(n=>n*512)])[0];
  }
  const anchor=shot.actor==='hero'?actorMotion.emitter():null;
  if(shot.caster){
   const muzzle=actorMotion.monsterMuzzle(shot.from);
   if(muzzle)return paintedPoints(shot.from,[muzzle.map(n=>n*512)])[0];
  }
  return anchor?paintedPoints(shot.from,[anchor.map(n=>n*512)])[0]:point(shot.from,shot.hand);
 }
 function launchPoint(shot){
  if(shot.actor==='hero'&&shot.skillId===57){
   const tip=twilightRain.releaseTip('archer-'+outfitRigRank());
   if(tip)return paintedPoints(shot.from,[tip])[0];
  }
  return shot.drawnFrom||origin(shot);
 }
 function finish(shot,node,now){
  boxes.clear();shot.to=hitPoint(node,!shot.caster&&combatEffects.ground(shot.skillId));
  if(!shot.origin)shot.origin=launchPoint(shot);
  shot.hitAt=now;shot.end=now;counters.arrivals++;
 }
 function heroHit(token,ordinal,node){
  if(!ctx)return;
  const now=performance.now();
  for(const shot of shots)if(shot.token===token&&shot.hit===ordinal&&shot.hitAt===undefined&&target(shot)===node)finish(shot,node,now);
 }
 function piercingHeading(token,ordinal){
  const shaft=shots.find(shot=>shot.token===token&&shot.skillId===18&&shot.hit===ordinal);
  if(!shaft)return null;
  const a=shaft.origin||shaft.drawnFrom||origin(shaft),b=shaft.to||hitPoint(target(shaft),false);
  return Math.atan2(b.y-a.y,b.x-a.x);
 }
 function enemyHit(node,body,foe,pair){
  if(!enemyStyles[body]||!surface())return;
  let shot=hostiles.get(foe);
  if(!shot){ // Returning to a fight already in progress can expose only the contact frame.
   const style=enemyStyles[body];shot=queue({actor:'enemy',kind:style[0],from:node,hand:style.slice(1),caster:foe,pair,release:performance.now(),end:performance.now()});
  }
  finish(shot,$('heroActor'),performance.now());
 }
 function clear(){
  swing=null;shots.length=0;hostiles.clear();boxes.clear();if(ctx&&dirty)ctx.clearRect(0,0,width,height);dirty=false;
 }
 function brush(color){
  if(brushes.has(color))return brushes.get(color);
  const c=document.createElement('canvas');c.width=c.height=48;const g=c.getContext('2d');
  const glow=g.createRadialGradient(24,24,0,24,24,24);glow.addColorStop(0,'#ffffee');glow.addColorStop(.19,color);glow.addColorStop(1,color+'00');
  g.fillStyle=glow;g.fillRect(0,0,48,48);brushes.set(color,c);return c;
 }
 function glow(x,y,size,color,alpha){
  if(size<.1||alpha<=0)return;ctx.globalAlpha=clamp(alpha);ctx.drawImage(brush(color),x-size,y-size,size*2,size*2);
 }
 function line(points,color,w,alpha){
  ctx.globalAlpha=clamp(alpha);ctx.strokeStyle=color;ctx.lineWidth=w;ctx.beginPath();
  ctx.moveTo(points[0].x,points[0].y);for(let i=1;i<points.length;i++)ctx.lineTo(points[i].x,points[i].y);ctx.stroke();
 }
 function poly(coords,color){
  ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(coords[0],coords[1]);
  for(let i=2;i<coords.length;i+=2)ctx.lineTo(coords[i],coords[i+1]);ctx.closePath();ctx.fill();
 }
 function curve(a,b,t,p,seed){
  const dx=b.x-a.x,dy=b.y-a.y,dist=Math.hypot(dx,dy);
  const arc=Math.min(dist,width*.75)*p.arc;
  const wave=p.shape==='wisp'?Math.sin(Math.PI*t)*Math.sin(2*Math.PI*t+seed)*5:0;
  return {x:a.x+dx*t,y:a.y+dy*t-4*arc*t*(1-t)+wave};
 }
 function tip(p,pos,angle,size,phase){
  ctx.save();ctx.translate(pos.x,pos.y);ctx.rotate(angle);ctx.scale(size,size);ctx.globalAlpha=1;
  switch(p.shape){
   case 'arrow':
    poly([-17,-.8,4,-.8,4,.8,-17,.8],'#caa776');
    poly([9,0,1,-3.1,2,0,1,3.1],p.core);
    poly([-15,0,-22,-4,-18,-4,-12,-.6,-12,.6,-18,4,-22,4],p.color);break;
   case 'blade':case 'lance':case 'shard':
    poly([9,0,-3,-4,-8,-1,-6,3,-2,4],p.color);poly([9,0,-3,-4,-1,-.4],p.core);break;
   case 'feather':
    ctx.fillStyle=p.color;ctx.beginPath();ctx.moveTo(8,0);ctx.quadraticCurveTo(-2,-7,-13,-2);ctx.quadraticCurveTo(-9,5,8,0);ctx.fill();
    line([{x:-13,y:2},{x:7,y:-.2}],p.core,.85,1);break;
   case 'crescent':
    ctx.fillStyle=p.core;ctx.beginPath();ctx.moveTo(-4,-7);ctx.quadraticCurveTo(13,0,-5,7);ctx.quadraticCurveTo(4,0,-4,-7);ctx.fill();break;
   case 'seed':case 'drop':
    ctx.fillStyle=p.color;ctx.beginPath();ctx.ellipse(0,0,5,3.4,Math.sin(phase)*.35,0,2*Math.PI);ctx.fill();
    ctx.fillStyle=p.core;ctx.beginPath();ctx.arc(1,-1,1.5,0,2*Math.PI);ctx.fill();break;
   default:
    glow(0,0,9,p.color,.94);
    poly([5,0,-6,-2.4,-11,0,-5,1.8],p.core);
  }
  ctx.restore();
 }
 function paint(shot,now){
  if(now<shot.cue)return;
  const p=profiles[shot.kind],scale=Math.max(.85,Math.min(1.7,width/390))*(shot.actor==='pet'?.80:shot.actor==='hero'&&s.classId==='mage'&&shot.skillId<0?.67:1);
  const hit=shot.hitAt!==undefined;
  if(!hit&&now<shot.release){
   const a=origin(shot),t=clamp((now-shot.cue)/(shot.release-shot.cue));
   if(shot.actor==='hero'&&s.classId==='archer'){shot.drawnFrom=a;return}
   glow(a.x,a.y,(2+6*t)*scale,p.color,t*.82);
   if(p.shape!=='arrow')for(let i=0;i<3;i++){const r=(1-t)*8*scale,angle=i*2.094+t*2;glow(a.x+r*Math.cos(angle),a.y+r*Math.sin(angle),1.75*scale,p.core,.62*t)}
   return;
  }
  if(!shot.origin)shot.origin=launchPoint(shot);
  const a=shot.origin,b=hit?shot.to:flightMark(target(shot),!shot.caster&&combatEffects.ground(shot.skillId));
  const t=hit?1:Math.min(.98,clamp((now-shot.release)/Math.max(1,shot.end-shot.release)));
  const after=hit?clamp((now-shot.hitAt)/linger):0,fade=1-after;
  if(shot.actor==='pet'){
   companionMotion.flight(ctx,shot.pet,a,b,t,fade,width);return;
  }
  if(shot.actor==='hero'&&s.classId==='archer'){
   const tail=archerFlight.tailMs(shot.skillId);
   if(hit&&!tail&&shot.skillId>=0){
    // At 2x the browser can skip every transit frame during a texture decode.
    // Retain the shaft at the actual contact for two or three display frames.
    const age=now-shot.hitAt;
    if(shot.inFlight||age>68)return;
    drawArrow(ctx,a,b,1,shot.kind,width,1-age/68,shot.skillId,shot.hit,shot.lead);return;
   }
   if(!hit)shot.inFlight=true;
   const u=hit&&tail?clamp((now-shot.hitAt)/tail):0;
   drawArrow(ctx,a,b,t+u*.69,shot.kind,width,hit&&tail?1-u*u:fade,shot.skillId,shot.hit,shot.lead);
   return;
  }
  if(shot.actor==='hero'&&spellTrails.draw(ctx,a,b,t,shot.kind,width,fade,shot.skillId,shot.hit))return;
  const head=curve(a,b,t,p,shot.serial);
  if(adventureFx.ready()&&adventureFx.projectile({id:shot.serial,from:a,to:b,head,progress:t,fade,job:shot.actor==='hero'?s.classId:shot.actor,skillId:shot.skillId??-1,style:shot.kind,enemy:shot.actor==='enemy',scale}))return;
  const vapor=['drop','fire','wisp','seed','crescent'].includes(p.shape);
  const tail=Math.max(0,t-(p.shape==='bolt'?.88:vapor?.44:.34)*fade),path=[];
  for(let j=0;j<=6;j++){
   const u=tail+(t-tail)*j/6,pt=curve(a,b,u,p,shot.serial);
   if(p.shape==='bolt'&&j>0&&j<6)pt.y+=Math.sin(j*3.5+shot.serial)*4*scale*fade;
   path.push(pt);
  }
  if(fade>.01){
   for(let j=1;j<path.length;j++)line([path[j-1],path[j]],p.color,(.5+(vapor?4.8:3.2)*j/6)*scale,fade*(.12+.50*j/6));
   line(path.slice(-3),p.core,1.25*scale,fade*.96);
   if(vapor&&!hit){
    glow(head.x,head.y,10*scale,p.color,.48);
    // Two fading motes peel off behind the physical head, along its flight direction.
    for(let j=1;j<3;j++){
     const u=Math.max(0,t-.11*j),w=curve(a,b,u,p,shot.serial);
     const separation=Math.sin(Math.PI*t)*(2+j)*scale;
     const phase=t*7+shot.serial+j*2.8;
     glow(w.x+Math.cos(phase)*separation,w.y+Math.sin(phase)*separation,(3.8-j*.65)*scale,p.color,.78-j*.13);
    }
   }
   if(!hit){const pre=path[5];tip(p,head,Math.atan2(head.y-pre.y,head.x-pre.x)||Math.atan2(b.y-a.y,b.x-a.x),scale,now*.012)}
   else{glow(head.x,head.y,(3+6*fade)*scale,p.color,fade*.78);
    for(let j=0;j<3;j++){const angle=j*2.094+shot.serial*.8,r=(3+after*8)*scale;
     const dx=Math.cos(angle),dy=Math.sin(angle);line([{x:b.x+r*dx,y:b.y+r*dy},{x:b.x+(r+3*fade)*dx,y:b.y+(r+3*fade)*dy}],p.core,1.15*scale,fade)}
   }
  }
 }
 function render(now,wall){
  if(!ctx||!shots.length&&!swing&&!dirty)return;
  boxes.clear();frameMarks.clear();ctx.clearRect(0,0,width,height);dirty=!!swing;paintSwing(now);
  for(let i=shots.length-1;i>=0;i--){const shot=shots[i];
   if(!valid(shot,wall)||(shot.hitAt!==undefined?now>shot.hitAt+Math.max(linger,archerFlight.tailMs(shot.skillId)):now>shot.end+320)){remove(i);continue}
   if(shot.index>=0&&shot.hitAt===undefined&&shot.pair?.foes[shot.index]?.hp<=0){remove(i);continue}
   dirty=true;paint(shot,now);
  }
  ctx.globalAlpha=1;
 }
 return {spellFlight:spellTrails.draw,piercingHeading,paintedPoints,hitPoint,swingTrail,heroStyle,arrowPose,arrowLength,arrowURL:archerFlight.texture(-1).src,drawArrow,drawNockedArrow,releaseTime,petStyle,enemyStyle:body=>enemyStyles[body],heroCast,planEnemy,enemyHit,heroHit,enemyPose,render,clear,
  stats:()=>({...counters,active:shots.length})};
})();

;
/* ./skin-rigs.js */
const SKIN_RIGS={
"warrior-0":{"body":[[518,518,498,498,14,14],[2,1033,491,495,0,17],[2,2,512,512,0,0],[2,518,512,511,0,1]],"palm":[[745,1033,28,24,179,271],[777,1033,28,24,217,133],[809,1033,27,24,296,230],[840,1033,28,24,208,280]],"parts":[{"kind":"sword","pivot":[31,21],"angles":[33,-164,14,32],"hands":[[193,283],[231,145],[309,243],[222,292]],"order":1,"rect":[497,1033,244,42]}]},
"warrior-1":{"body":[[2,2,213,420,140,63],[219,2,252,386,130,97],[2,426,305,376,46,108],[475,2,259,384,124,99]],"palm":[[563,426,30,23,174,282],[663,426,25,21,158,148],[597,426,29,23,297,265],[630,426,29,23,174,289]],"parts":[{"kind":"sword","pivot":[36,30],"hands":[[189,293],[170,158],[311,276],[188,300]],"angles":[32,-156,24,32],"order":1,"rect":[311,426,248,60]}]},
"warrior-2":{"body":[[2,2,258,439,114,46],[264,2,321,423,92,60],[589,2,306,405,129,79],[2,445,326,360,87,125]],"palm":[[697,445,29,23,170,283],[587,445,27,25,168,66],[618,445,42,25,345,299],[664,445,29,25,364,334]],"parts":[{"kind":"sword","pivot":[49,21],"hands":[[184,294],[180,80],[359,311],[378,346]],"angles":[29,-158,36,38],"order":1,"rect":[332,445,251,42]}]},
"warrior-3":{"body":[[2,2,296,442,66,42],[302,2,346,424,61,60],[652,2,326,405,114,79],[2,448,328,361,89,123]],"palm":[[674,448,29,23,176,277],[707,448,25,21,192,68],[600,448,37,25,355,283],[641,448,29,25,376,322]],"parts":[{"kind":"sword","pivot":[52,25],"hands":[[190,288],[204,78],[369,295],[390,334]],"angles":[31,-159,38,39],"order":1,"rect":[334,448,262,50]}]},
"warrior-4":{"body":[[2,2,233,446,125,37],[239,2,294,423,94,60],[537,2,301,410,139,73],[2,452,318,361,94,123]],"palm":[[668,452,29,23,177,246],[701,452,25,22,187,67],[598,452,33,25,327,264],[635,452,29,25,346,308]],"parts":[{"kind":"sword","pivot":[46,26],"hands":[[191,257],[199,78],[341,276],[360,320]],"angles":[34,-165,40,41],"order":1,"rect":[324,452,270,51]}]},
"warrior-5":{"body":[[2,2,306,445,81,39],[312,2,327,417,72,66],[643,2,337,402,80,82],[2,451,340,357,66,127]],"palm":[[692,451,29,23,178,261],[725,451,25,21,180,77],[621,451,34,25,301,283],[659,451,29,25,341,323]],"parts":[{"kind":"sword","pivot":[53,26],"hands":[[192,272],[192,87],[315,295],[355,335]],"angles":[34,-154,40,39],"order":1,"rect":[346,451,271,52]}]},
"warrior-event":{"body":[[2,2,273,428,112,52],[279,2,311,428,94,52],[2,434,334,420,88,60],[594,2,313,427,94,53]],"palm":[[690,434,31,29,205,265],[624,434,31,31,225,112],[725,434,33,27,364,203],[659,434,27,31,202,267]],"parts":[{"kind":"sword","pivot":[53,34],"hands":[[220,279],[240,127],[380,216],[215,282]],"angles":[31,-139,8,35],"order":1,"rect":[340,434,280,67]}]},
"shadow-0":{"body":[[379,2,376,443,112,39],[2,2,373,448,106,34],[2,454,443,432,37,50],[449,454,409,400,12,81]],"palm":[[713,890,292,49,164,256],[426,890,283,62,152,185],[2,1048,34,30,365,202],[2,890,297,154,52,292]],"parts":[{"kind":"dagger","pivot":[60,1],"hands":[[176,266],[164,195],[386,212],[64,302]],"angles":[0.0,1.37,-152.964,2.513],"order":1,"rect":[303,890,67,95]},{"kind":"offhand","pivot":[3,1],"hands":[[443,294],[422,236],[377,221],[336,435]],"angles":[0.0,-15.983,-31.479,-33.068],"order":1,"rect":[374,890,48,78]}]},
"shadow-1":{"body":[[394,2,386,446,104,35],[2,2,388,448,70,34],[2,454,437,432,39,49],[443,454,426,396,12,86]],"palm":[[2,1047,291,41,165,264],[441,890,292,67,133,188],[297,1047,36,32,364,205],[2,890,303,153,70,302]],"parts":[{"kind":"dagger","pivot":[68,2],"hands":[[177,274],[145,198],[387,215],[82,312]],"angles":[0.0,-3.591,-151.977,0.879],"order":1,"rect":[309,890,72,96]},{"kind":"offhand","pivot":[5,2],"hands":[[443,294],[414,245],[376,226],[360,444]],"angles":[0.0,-4.893,-24.871,-30.247],"order":1,"rect":[385,890,52,77]}]},
"shadow-2":{"body":[[407,2,372,443,114,38],[2,2,401,448,71,34],[2,454,442,434,33,48],[448,454,427,396,16,86]],"palm":[[425,892,302,72,154,242],[2,1050,292,57,145,194],[298,1050,33,31,369,204],[2,892,307,154,72,304]],"parts":[{"kind":"dagger","pivot":[52,2],"hands":[[166,252],[157,204],[389,214],[84,314]],"angles":[0.0,0.457,-151.351,6.983],"order":1,"rect":[313,892,55,96]},{"kind":"offhand","pivot":[6,4],"hands":[[443,303],[426,241],[381,224],[366,447]],"angles":[0.0,-11.256,-31.525,-33.779],"order":1,"rect":[372,892,49,78]}]},
"shadow-3":{"body":[[2,2,350,396,96,85],[362,402,371,389,98,91],[356,2,448,394,52,86],[2,402,356,394,96,86]],"palm":[[2,800,250,52,165,281],[341,800,263,44,167,270],[737,402,80,77,353,235],[608,800,251,43,168,293]],"parts":[{"kind":"dagger","pivot":[1,9],"hands":[[177,291],[179,280],[365,301],[180,303]],"angles":[100.338,112.37,0.0,106.781],"order":1,"rect":[863,800,99,40]},{"kind":"offhand","pivot":[1,11],"hands":[[402,322],[417,303],[420,245],[406,325]],"angles":[31.612,26.06,0.0,33.284],"order":1,"rect":[256,800,81,49]}]},
"shadow-4":{"body":[[373,2,369,429,97,52],[2,2,367,433,82,48],[2,439,448,416,21,65],[454,439,378,413,85,68]],"palm":[[691,859,287,51,141,272],[351,859,263,95,141,172],[982,859,34,26,348,204],[2,859,274,119,135,288]],"parts":[{"kind":"dagger","pivot":[59,1],"hands":[[153,282],[153,182],[369,214],[147,298]],"angles":[-2.948,0.0,-154.744,0.816],"order":1,"rect":[280,859,67,102]},{"kind":"offhand","pivot":[12,6],"hands":[[415,312],[392,257],[360,219],[396,396]],"angles":[11.477,0.0,-41.129,-9.527],"order":1,"rect":[618,859,69,90]}]},
"shadow-5":{"body":[[379,2,379,432,86,49],[2,2,373,433,78,48],[2,439,448,421,19,60],[454,439,382,412,81,69]],"palm":[[697,864,304,41,123,289],[285,864,280,99,132,174],[2,979,39,28,347,197],[2,864,279,111,131,300]],"parts":[{"kind":"dagger","pivot":[48,4],"hands":[[135,299],[144,184],[373,207],[143,310]],"angles":[-5.034,0.0,-155.88,2.566],"order":1,"rect":[569,864,58,89]},{"kind":"offhand","pivot":[11,6],"hands":[[414,319],[400,263],[359,214],[397,400]],"angles":[5.865,0.0,-42.713,-9.563],"order":1,"rect":[631,864,62,83]}]},
"shadow-event":{"body":[[394,2,373,422,57,58],[2,2,388,424,54,56],[2,430,449,418,28,62],[455,430,389,407,64,73]],"palm":[[2,1041,267,37,156,262],[345,852,311,60,129,189],[273,1041,35,24,356,211],[2,852,339,185,101,264]],"parts":[{"kind":"dagger","pivot":[1,13],"hands":[[173,274],[146,201],[373,223],[118,277]],"angles":[22,-131,-18,34],"order":1,"rect":[660,852,120,60]},{"kind":"offhand","pivot":[1,12],"hands":[[409,285],[428,235],[364,220],[424,435]],"angles":[-31,-45,38,45],"order":1,"rect":[784,852,99,50]}]},
"paladin-0":{"body":[[299,2,250,436,111,45],[2,2,293,446,102,35],[2,452,446,428,26,53],[553,2,320,430,47,51]],"palm":[[723,452,31,35,152,268],[758,452,33,33,135,115],[831,452,82,30,248,145],[795,452,32,33,124,252]],"parts":[{"kind":"shield","order":1,"pivot":[57,77],"hands":[[330,227],[360,238],[287,247],[335,223]],"angles":[0.0,-2.1,-1.3,-1.55],"rect":[452,452,88,164]},{"kind":"mace","order":1,"pivot":[16,47],"hands":[[167,285],[151,131],[312,160],[140,268]],"angles":[116.75,-42.84,0.0,139.76],"rect":[544,452,175,57]}]},
"paladin-1":{"body":[[626,2,249,442,114,38],[294,2,328,445,74,36],[2,452,420,423,12,57],[2,2,288,446,83,34]],"palm":[[673,452,31,35,159,263],[708,452,31,35,103,125],[778,452,82,29,234,144],[743,452,31,35,136,246]],"parts":[{"kind":"shield","order":1,"pivot":[60,76],"hands":[[333,224],[370,233],[291,250],[342,224]],"angles":[0.0,-4.7,0.6,0.91],"rect":[426,452,90,162]},{"kind":"mace","order":1,"pivot":[16,39],"hands":[[174,280],[118,142],[298,158],[151,263]],"angles":[116.87,-62.51,0.0,122.34],"rect":[520,452,149,57]}]},
"paladin-2":{"body":[[291,2,260,425,96,55],[2,2,285,432,87,49],[2,438,448,411,50,69],[555,2,306,418,53,63]],"palm":[[719,438,30,35,146,260],[753,438,30,35,118,130],[821,438,82,30,279,156],[787,438,30,35,111,243]],"parts":[{"kind":"shield","order":1,"pivot":[50,76],"hands":[[319,233],[333,241],[315,255],[318,235]],"angles":[0.0,-1.2,-1.63,-3.59],"rect":[454,438,87,159]},{"kind":"mace","order":1,"pivot":[16,45],"hands":[[160,277],[132,147],[343,171],[125,260]],"angles":[119.53,-60.48,0.0,123.02],"rect":[545,438,170,61]}]},
"paladin-3":{"body":[[687,2,283,420,83,60],[2,2,338,427,52,53],[2,433,448,417,33,63],[344,2,339,422,57,59]],"palm":[[714,433,31,35,162,263],[786,433,33,33,113,123],[823,433,82,30,275,152],[749,433,33,35,214,247]],"parts":[{"kind":"shield","order":1,"pivot":[56,74],"hands":[[327,233],[349,230],[335,250],[350,234]],"angles":[0.0,-2.96,-5.17,-6.1],"rect":[454,433,94,161]},{"kind":"mace","order":1,"pivot":[16,43],"hands":[[177,280],[129,139],[339,167],[230,264]],"angles":[116.69,-44.83,0.0,61.35],"rect":[552,433,158,61]}]},
"paladin-4":{"body":[[2,2,247,393,106,88],[563,2,334,386,34,95],[2,399,448,381,42,100],[253,2,306,388,61,93]],"palm":[[692,399,31,35,160,274],[727,399,33,33,118,227],[801,399,82,30,293,186],[764,399,33,32,136,247]],"parts":[{"kind":"shield","order":1,"pivot":[48,87],"hands":[[319,241],[332,249],[353,257],[335,246]],"angles":[0.0,-2.99,0.3,-0.44],"rect":[454,399,82,187]},{"kind":"mace","order":1,"pivot":[16,26],"hands":[[175,291],[134,243],[357,200],[152,263]],"angles":[116.15,140.5,0.0,140.71],"rect":[540,399,148,52]}]},
"paladin-5":{"body":[[280,2,249,407,102,74],[533,2,311,398,65,83],[2,415,448,397,52,84],[2,2,274,409,91,72]],"palm":[[709,415,31,35,158,272],[744,415,32,35,134,197],[817,415,82,28,287,160],[780,415,33,35,180,266]],"parts":[{"kind":"shield","order":1,"pivot":[51,83],"hands":[[320,236],[338,237],[327,260],[332,240]],"angles":[0.0,-6.29,-4.78,-2.31],"rect":[454,415,82,178]},{"kind":"mace","order":1,"pivot":[16,32],"hands":[[173,289],[149,214],[351,174],[196,283]],"angles":[116.32,-124.57,0.0,56.51],"rect":[540,415,165,61]}]},
"paladin-event":{"body":[[609,2,252,428,114,52],[2,443,316,427,62,53],[282,2,323,432,58,48],[2,2,276,437,110,43]],"palm":[[632,443,29,29,193,270],[665,443,29,29,131,106],[727,443,33,27,348,142],[698,443,25,29,142,257]],"parts":[{"kind":"shield","order":1,"pivot":[58,96],"hands":[[348,280],[359,269],[321,232],[364,272]],"angles":[-7,-16,-27,-9],"rect":[322,443,104,204]},{"kind":"mace","order":1,"pivot":[16,42],"hands":[[207,284],[145,120],[364,155],[154,271]],"angles":[44,-66,-13,75],"rect":[430,443,198,83]}]},
"mage-0":{"body":[[2,2,185,445,156,35],[392,2,258,437,97,44],[654,2,281,425,94,56],[191,2,197,442,145,39]],"palm":[[285,451,184,33,157,168],[473,451,180,33,166,160],[657,451,199,32,177,169],[84,451,197,35,146,173]],"parts":[{"kind":"staff","pivot":[24,140],"hands":[[327,185],[333,177],[362,185],[329,192]],"angles":[0.0,4.45,0.01,0.41],"order":1,"tip":[30,28],"rect":[939,2,54,424]},{"kind":"book","pivot":[42,50],"hands":[[179,185],[188,177],[198,187],[167,190]],"angles":[0.0,-7.5,-6.34,-5.26],"order":1,"rect":[2,451,78,53]}]},
"mage-1":{"body":[[2,2,206,445,137,36],[442,2,267,433,95,48],[713,2,307,414,86,67],[212,2,226,439,127,41]],"palm":[[353,451,187,33,144,181],[68,451,190,79,131,133],[744,451,238,31,132,158],[544,451,196,32,141,182]],"parts":[{"kind":"staff","pivot":[35,138],"hands":[[317,197],[307,149],[360,173],[323,198]],"angles":[0.0,-12.6,1.11,-1.01],"order":1,"tip":[34,34],"rect":[2,451,62,398]},{"kind":"book","pivot":[43,54],"hands":[[164,201],[149,199],[153,180],[163,200]],"angles":[0.0,3.39,-7.84,2.85],"order":1,"rect":[262,451,87,56]}]},
"mage-2":{"body":[[90,2,224,418,133,63],[318,2,258,415,129,66],[2,425,322,382,83,99],[580,2,233,413,124,68]],"palm":[[663,425,180,42,155,176],[2,811,187,36,177,160],[403,425,256,51,149,159],[193,811,167,36,158,185]],"parts":[{"kind":"staff","pivot":[30,153],"hands":[[321,202],[350,176],[394,175],[311,205]],"angles":[0.0,1.7,0.44,-2.84],"order":1,"tip":[47,38],"rect":[2,2,84,419]},{"kind":"book","pivot":[37,51],"hands":[[176,193],[199,183],[172,201],[180,202]],"angles":[0.0,1.47,-4.53,-1.18],"order":1,"rect":[328,425,71,53]}]},
"mage-3":{"body":[[729,2,292,445,93,35],[2,454,321,444,72,37],[332,2,393,446,28,35],[2,2,326,448,68,33]],"palm":[[2,902,204,39,141,178],[495,454,206,49,153,158],[705,454,225,42,139,146],[210,902,205,37,146,178]],"parts":[{"kind":"staff","pivot":[32,139],"hands":[[331,194],[345,174],[350,162],[337,194]],"angles":[0.0,0.6,-0.17,-0.0],"order":1,"tip":[49,41],"rect":[327,454,86,414]},{"kind":"book","pivot":[38,54],"hands":[[163,204],[175,193],[161,180],[168,203]],"angles":[0.0,1.67,-1.57,0.81],"order":1,"rect":[417,454,74,54]}]},
"mage-4":{"body":[[326,2,283,446,90,35],[2,2,320,448,67,33],[2,454,398,432,42,49],[613,2,297,446,77,35]],"palm":[[2,890,180,34,151,174],[736,454,196,36,145,160],[489,454,243,55,151,148],[186,890,185,33,145,175]],"parts":[{"kind":"staff","pivot":[44,147],"hands":[[318,190],[329,180],[381,187],[318,191]],"angles":[0.0,1.73,5.02,-0.19],"order":1,"tip":[61,42],"rect":[914,2,100,438]},{"kind":"book","pivot":[48,55],"hands":[[173,194],[167,176],[172,164],[167,195]],"angles":[0.0,-1.19,3.49,0.19],"order":1,"rect":[404,454,81,57]}]},
"mage-5":{"body":[[308,2,293,447,81,34],[2,2,302,448,56,33],[100,454,362,438,52,43],[605,2,328,446,52,35]],"palm":[[754,454,177,33,147,178],[186,902,187,32,148,174],[548,454,202,43,173,165],[2,902,180,33,144,181]],"parts":[{"kind":"staff","pivot":[37,158],"hands":[[310,194],[321,190],[361,192],[311,197]],"angles":[0.0,1.62,3.17,-0.0],"order":1,"tip":[48,47],"rect":[2,454,94,444]},{"kind":"book","pivot":[46,57],"hands":[[169,198],[170,190],[195,180],[166,200]],"angles":[0.0,2.21,-0.54,2.4],"order":1,"rect":[466,454,78,57]}]},
"mage-event":{"body":[[2,2,237,444,108,36],[243,2,335,444,28,36],[2,450,346,436,46,44],[695,2,254,442,86,38]],"palm":[[2,890,185,30,150,171],[660,450,197,33,146,154],[445,450,211,35,165,161],[191,890,193,30,144,172]],"parts":[{"kind":"staff","pivot":[60,168],"hands":[[323,185],[330,168],[363,176],[325,186]],"angles":[3,1,6,3],"order":1,"tip":[62,42],"rect":[582,2,109,443]},{"kind":"book","pivot":[41,64],"hands":[[168,184],[164,177],[184,186],[162,188]],"angles":[-6,-8,-10,-5],"order":1,"rect":[352,450,89,61]}]},
"archer-0":{"body":[[2,2,200,425,161,56],[412,2,254,421,151,60],[670,2,255,419,134,62],[206,2,202,424,159,57]],"palm":[[982,2,18,24,343,218],[1004,2,18,24,387,162],[2,431,18,24,371,166],[24,431,18,24,343,218]],"parts":[{"kind":"bow","pivot":[36,145],"hands":[[352,230],[396,174],[380,178],[352,230]],"angles":[1.77,-1.79,0.0,1.83],"order":1,"tip":[44,141],"stringTips":[[20,3],[20,303]],"drawHands":[[212,302],[266,146],[224,136],[212,300]],"rect":[929,2,49,307]}]},
"archer-1":{"body":[[2,2,199,433,164,48],[669,2,235,425,160,56],[408,2,257,426,134,55],[205,2,199,429,160,52]],"palm":[[962,2,18,20,345,204],[984,2,18,20,377,162],[2,439,18,20,373,164],[24,439,18,20,341,204]],"parts":[{"kind":"bow","pivot":[39,138],"hands":[[354,214],[386,172],[382,174],[350,214]],"angles":[3.4,-0.81,0.0,4.16],"order":1,"tip":[47,134],"stringTips":[[21,4],[21,280]],"drawHands":[[220,290],[272,152],[218,136],[236,254]],"rect":[908,2,50,286]}]},
"archer-2":{"body":[[2,2,256,420,107,61],[2,426,302,414,95,66],[530,2,291,419,88,62],[262,2,264,420,101,61]],"palm":[[365,426,18,24,345,214],[387,426,18,24,379,162],[409,426,18,24,361,166],[431,426,18,24,347,208]],"parts":[{"kind":"bow","pivot":[41,145],"hands":[[354,226],[388,174],[370,178],[356,220]],"angles":[4.07,-4.23,0.0,3.32],"order":1,"tip":[49,141],"stringTips":[[26,7],[25,305]],"drawHands":[[218,298],[264,152],[230,152],[260,210]],"rect":[308,426,53,312]}]},
"archer-3":{"body":[[289,2,275,428,102,53],[2,437,327,412,82,69],[568,2,330,415,75,66],[2,2,283,431,100,49]],"palm":[[422,437,18,20,359,200],[444,437,18,20,391,170],[466,437,18,20,387,166],[488,437,18,20,365,196]],"parts":[{"kind":"bow","pivot":[60,142],"hands":[[368,210],[400,180],[396,176],[374,206]],"angles":[5.06,-0.29,0.0,5.06],"order":1,"tip":[68,138],"stringTips":[[3,2],[14,302]],"drawHands":[[218,272],[252,144],[210,126],[268,238]],"rect":[333,437,85,311]}]},
"archer-4":{"body":[[2,2,222,416,129,65],[478,2,270,415,113,66],[2,422,281,414,94,67],[228,2,246,416,111,65]],"palm":[[352,422,18,20,333,214],[374,422,18,20,365,160],[396,422,18,20,357,162],[418,422,18,20,339,210]],"parts":[{"kind":"bow","pivot":[48,139],"hands":[[342,224],[374,170],[366,172],[348,220]],"angles":[6.18,1.42,0.0,3.68],"order":1,"tip":[56,135],"stringTips":[[22,7],[26,283]],"drawHands":[[270,254],[256,156],[206,140],[224,186]],"rect":[287,422,61,288]}]},
"archer-5":{"body":[[2,2,286,415,75,66],[2,421,327,407,60,74],[584,2,325,409,50,72],[292,2,288,414,75,67]],"palm":[[398,421,18,20,343,196],[420,421,18,20,369,160],[442,421,18,20,357,164],[464,421,18,20,345,196]],"parts":[{"kind":"bow","pivot":[46,141],"hands":[[352,206],[378,170],[366,174],[354,206]],"angles":[3.25,-3.55,0.0,3.25],"order":1,"tip":[54,137],"stringTips":[[20,7],[26,297]],"drawHands":[[230,262],[250,154],[220,154],[236,256]],"rect":[333,421,61,306]}]},
"archer-event":{"body":[[568,2,257,424,105,56],[2,433,316,424,100,56],[2,2,304,427,99,53],[310,2,254,427,103,53]],"palm":[[454,433,23,28,338,219],[481,433,23,28,387,167],[508,433,23,28,374,166],[535,433,23,28,331,219]],"parts":[{"kind":"bow","pivot":[96,183],"hands":[[349,233],[398,180],[385,179],[342,233]],"angles":[7,-2,1,6],"order":1,"tip":[104,179],"stringTips":[[6,11],[42,355]],"drawHands":[[213,298],[261,156],[201,147],[210,295]],"rect":[322,433,128,368]}]}
};

;
/* ./season-rigs.js */
Object.assign(SKIN_RIGS,{
"warrior-season2":{"body":[[0,0,265,439,91,43],[512,0,350,440,57,42],[0,512,425,426,20,56],[512,512,408,412,19,70],[2,1132,278,436,91,47],[514,1132,301,444,69,39],[2,1648,399,469,34,13],[514,1648,441,449,9,34],[2,2164,421,431,18,52],[514,2164,450,422,3,61],[2,2680,384,415,64,68],[514,2680,279,433,83,49]],"palm":[[0,1026,17,17,221,215],[512,1026,17,17,152,52],[0,1047,17,17,418,128],[512,1047,17,17,188,279],[2,3117,38,38,210,125],[44,3117,38,37,149,72],[86,3117,38,33,243,15],[128,3117,34,35,403,37],[166,3117,37,37,400,182],[207,3117,42,36,350,251],[253,3117,37,38,239,210],[294,3117,39,37,213,198]],"parts":[{"kind":"sword","pivot":[36,30],"hands":[[229,223],[160,60],[426,136],[196,287],[230,142],[165,92],[262,29],[420,56],[418,199],[373,265],[258,228],[229,215]],"angles":[-56,-142,12,38],"order":1,"rect":[2,1068,248,60]}]},
"shadow-season2":{"body":[[0,0,394,416,59,64],[512,0,414,411,49,69],[0,512,469,406,21,74],[512,512,361,382,75,98]],"palm":[[0,1026,277,40,161,257],[512,1026,301,66,151,179],[0,1096,26,22,348,200],[512,1096,303,165,112,279]],"parts":[{"kind":"dagger","pivot":[60,1],"hands":[[169,265],[159,187],[365,208],[120,287]],"angles":[3,24,-150,4],"order":1,"rect":[2,1265,67,95]},{"kind":"offhand","pivot":[3,1],"hands":[[429,288],[443,236],[356,213],[406,435]],"angles":[-13,-15,-32,-26],"order":1,"rect":[73,1265,48,78]}]},
"paladin-season2":{"body":[[0,0,277,438,109,42],[512,0,369,425,35,55],[0,512,409,421,18,59],[512,512,345,432,34,48]],"palm":[[0,1026,17,17,170,268],[512,1026,17,17,166,63],[0,1047,17,17,400,152],[512,1047,17,17,167,211]],"parts":[{"kind":"mace","order":1,"pivot":[16,47],"hands":[[178,276],[174,71],[408,160],[175,219]],"angles":[124,-141,8,96],"rect":[2,1068,175,57]}],"contacts":{"shield":[[377,215],[399,223],[362,256],[374,216]]}},
"mage-season2":{"body":[[0,0,204,442,146,38],[512,0,272,438,110,42],[0,512,415,417,39,63],[512,512,277,427,113,53]],"palm":[[0,1026,17,17,329,184],[512,1026,17,17,359,121],[0,1047,17,17,433,163],[512,1047,17,17,338,129]],"parts":[{"kind":"staff","pivot":[24,140],"hands":[[337,192],[367,129],[441,171],[346,137]],"angles":[0,-24,61,10],"order":1,"tip":[30,28],"rect":[2,1068,54,424]}]},
"archer-season2":{"body":[[0,0,243,437,99,43],[512,0,390,422,27,58],[0,512,424,420,8,60],[512,512,260,444,65,36]],"palm":[[0,1026,17,17,322,201],[512,1026,17,17,397,136],[0,1047,17,17,403,132],[512,1047,17,17,304,200]],"parts":[{"kind":"bow","pivot":[39,138],"hands":[[330,209],[405,144],[411,140],[312,208]],"angles":[7,-2,3,8],"order":1,"tip":[47,134],"stringTips":[[21,4],[21,280]],"drawHands":[[214,288],[226,125],[177,119],[238,241]],"rect":[2,1068,50,286]}]}
});

;
/* ./boss-techniques.js */
'use strict';

// One cast follows one existing combat deadline. Only the combat tick changes HP.
// Coordinates identify the painted mouth, horn, hand or blade in each boss portrait.
const bossTechniques=(()=>{
 const styles=[
  {name:'별뿔 가르기',type:'antler',color:'#82d6eb',origin:[.23,.23],travel:.92,load:.29,lift:3,drop:-1,turn:-6,coil:4},
  {name:'뒤엉킨 뿌리',type:'roots',color:'#85c884',origin:[.19,.69],travel:0,load:.40,lift:0,drop:0,turn:-1.2,coil:1.6},
  {name:'단층 파쇄',type:'fault',color:'#e8ac65',origin:[.18,.64],travel:.07,load:.47,lift:4,drop:2,turn:-4,coil:3},
  {name:'삼두 맹독',type:'venom',color:'#99d659',origin:[.11,.45],travel:0,load:.26,lift:1,drop:0,turn:1.8,coil:-1},
  {name:'심핵 분출',type:'magma',color:'#ff692d',origin:[.44,.40],travel:0,load:.43,lift:1,drop:2,turn:-2.4,coil:2.6},
  {name:'서리 상아',type:'frost',color:'#75c8f9',origin:[.23,.57],travel:.23,load:.34,lift:2,drop:1,turn:-3.8,coil:2.5},
  {name:'망령 소환',type:'souls',color:'#a5aecf',origin:[.28,.53],travel:0,load:.45,lift:.5,drop:0,turn:-1,coil:1},
  {name:'흑철 참격',type:'blade',color:'#ef5750',origin:[.23,.69],travel:.86,load:.44,lift:1.4,drop:.6,turn:-5,coil:3},
  {name:'성광 낙창',type:'lances',color:'#efc874',origin:[.42,.40],travel:0,load:.34,lift:6,drop:-2,turn:-1.4,coil:1.3},
  {name:'검은별 붕괴',type:'rift',color:'#bd76fe',origin:[.44,.52],travel:0,load:.48,lift:3.2,drop:-1.6,turn:-1.8,coil:2.1}
 ];
 const wind=680,fall=380;
 const textures=new Map();
 function texture(type){
  if(!textures.has(type)){
   const img=new Image();img.decoding='async';img.src=(type.startsWith('artillery/')?'./assets/':'./assets/boss-fx/')+type+'.webp';textures.set(type,img);
  }
  return textures.get(type);
 }
 const aftermath={antler:'wind',roots:'earth',fault:'earth',venom:'poison',magma:'fire',frost:'ice',souls:'mist',blade:'slash',lances:'lance',rift:'vortex'};
 function preload(region){if(styles[region])texture(styles[region].type)}

 let current=null,canvas,ctx,width,height,host,dirty=false;
 const unit=t=>Math.max(0,Math.min(1,t));
 const smooth=t=>{const n=unit(t);return n*n*(3-2*n)};
 const lerp=(a,b,t)=>a+(b-a)*t;
 const point=(a,b,t,dy=0)=>({x:lerp(a.x,b.x,t),y:lerp(a.y,b.y,t)+dy});
 function clear(){
  current=null;
  if(dirty&&ctx){ctx.clearRect(0,0,width,height);dirty=false}
 }
 function valid(c){
  return c&&s===c.save&&s.stage===c.stage&&dungeonRun===c.run&&c.foe===bossTacticState&&
   (dungeonRun?dungeonRun.bosses===c.wave:s.stageBossAttempt===c.attempt)&&
   !statusOn(c.foe.status,'stun')&&warriorMotion.visible();
 }
 function size(){
  if(!ctx)return;
  const w=host.clientWidth,h=host.clientHeight;
  const scale=Math.min(1.5,window.devicePixelRatio||1);
  const px=Math.max(1,Math.round(w*scale)),py=Math.max(1,Math.round(h*scale));
  if(width===w&&height===h&&canvas.width===px&&canvas.height===py)return;
  width=w;height=h;canvas.width=px;canvas.height=py;ctx.setTransform(scale,0,0,scale,0,0);
  if(current){current.release=null;current.contact=null}
 }
 function surface(){
  if(ctx)return true;
  if(typeof HTMLCanvasElement==='undefined')return false;
  const node=document.createElement('canvas'),context=node.getContext('2d');
  if(!context?.createRadialGradient)return false;
  canvas=node;ctx=context;host=$('battle');canvas.className='boss-technique-layer';canvas.setAttribute('aria-hidden','true');
  host.appendChild(canvas);size();new ResizeObserver(size).observe(host);return true;
 }
 function start(node,foe,wall,hit){
  if(!warriorMotion.visible()||document.hidden||!motionAllowed()||!s?.classId){clear();return}
  const speed=Math.max(1,s.speed||1),remaining=foe.nextAttack-wall;
  if(!hit&&(remaining<=0||remaining*speed>wind+250))return;
  if(current?.foe!==foe||current.deadline!==foe.nextAttack){
   const enemy=encounterFor(s.stage,dungeonRun),region=enemy.region;
   const style=enemy.mini?{...styles[region],origin:enemy.origin,shot:enemy.shot,singleSource:true,...(enemy.shot?{travel:0,turn:1.5,coil:-3}:null)}:styles[region];
   preload(region);
   if(enemy.shot==='shell')for(const key of ['muzzle','shell','smoke','impact'])texture('artillery/'+key);
   if(enemy.shot==='flame'||enemy.shot==='breath')loadWorldBossFlame();
   current={save:s,stage:s.stage,run:dungeonRun,wave:dungeonRun?.bosses,attempt:s.stageBossAttempt,region,style,foe,node,
    speed,deadline:foe.nextAttack,impact:performance.now()+Math.max(0,250*Math.ceil(remaining/250))};
  }
  if(hit){
   // Preserve the predicted arrival for delayed callbacks and avoid rewinding the body.
   current.impact=Math.min(performance.now(),current.impact);
  }
 }
 function timing(c,now){
  if(!c)return null;
  const elapsed=(now-c.impact)*c.speed;
  if(elapsed < -wind || elapsed>fall)return null;
  return elapsed<0?.64*unit(1+elapsed/wind):.64+.36*unit(elapsed/fall);
 }
 function pose(foe,now){
  const c=current;if(!c||c.foe!==foe||!valid(c))return null;
  const phase=timing(c,now);if(phase===null)return null;
  const style=c.style,ready=smooth(phase/style.load),strike=smooth((phase-style.load)/(.64-style.load));
  const recover=unit((phase-.64)/.36);
  const load=ready*(1-strike),settle=(1-recover)**2*(1+2*recover),weight=strike*settle;
  const arc=style.type==='antler'?4*Math.sin(Math.PI*strike):0;
  if(style.shot==='shell'){
   const kick=phase<.32?0:Math.sin(unit((phase-.32)/.14)*Math.PI)*(1-unit((phase-.32)/.19));
   return {phase,advance:0,back:5.8*kick,y:0,angle:-1.7*kick};
  }
  const rebound=Math.sin(Math.PI*recover*2)*(1-recover)**2;
  return {phase,advance:style.travel*weight,back:style.travel*4*load+2.7*rebound,
   y:-style.lift*load+style.drop*weight-arc+.85*rebound,angle:style.coil*load+style.turn*weight-1.60*rebound};
 }
 // Sample the transformed actors at release. A launched missile keeps its source,
 // while the contact point follows the target's actual stance until impact.
 function box(c){
  const field=host.getBoundingClientRect(),mob=c.node.getBoundingClientRect(),hero=$('heroActor').getBoundingClientRect();
  const k=width/(field.width||width),p=(r,x,y)=>({x:(r.left-field.left+r.width*x)*k,y:(r.top-field.top+r.height*y)*k});
  const origin=actorMotion.towerMuzzle(c.node,c.style.origin);
  return {from:p(mob,...origin),enemyFoot:p(mob,.45,.89),to:p(hero,.50,.54),foot:p(hero,.51,.88),
   heads:[[.13,.46],[.35,.22],[.58,.39]].map(xy=>p(mob,...xy)),scale:Math.min(1.5,Math.max(.64,width/390))};
 }
 function light(p,r,color,alpha){
  if(alpha<=.005||r<=0)return;
  const g=ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,r);
  g.addColorStop(0,'#fff4e4');g.addColorStop(.15,color+'dd');g.addColorStop(.52,color+'50');g.addColorStop(1,color+'00');
  ctx.globalCompositeOperation='lighter';ctx.globalAlpha=unit(alpha);ctx.fillStyle=g;ctx.fillRect(p.x-r,p.y-r,r*2,r*2);
 }
 // Reveal the original pixels upward for roots, rock and ice, with no stretching.
 function stamp(type,p,size,alpha,anchor=.5,angle=0,reveal=1){
  const img=texture(type);
  if(alpha<=.006||!img.naturalWidth||!ctx.drawImage||reveal<=0)return;
  const h=img.naturalHeight,w=img.naturalWidth,shown=Math.min(1,reveal);
  ctx.save();ctx.translate(p.x,p.y);ctx.rotate(angle);ctx.globalAlpha=unit(alpha);ctx.globalCompositeOperation='source-over';
  ctx.drawImage(img,0,h*(1-shown),w,h*shown,-size*.5,size*(1-shown-anchor),size,size*shown);ctx.restore();
 }
 const terrain={
  roots:{steps:3,size:85,angle:.08},fault:{steps:3,size:93,angle:-.12},
  magma:{steps:4,size:87,angle:.06},frost:{steps:3,size:83,angle:.12}
 };
 function ground(c,t,a,b){
  const type=c.style.type,cue=terrain[type];
  // The final, largest eruption breaches at the damage beat.
  for(let i=0;i<cue.steps;i++){
   const f=i/(cue.steps-1),at=.33+f*.25,age=t-at;
   if(age<0)continue;
   const root=point(a.enemyFoot,b.foot,.13+.87*f,Math.sin(i*2.5)*2*b.scale);
   const extent=cue.size*b.scale*(.37+.63*f);
   const emerged=smooth(age/(type==='roots'?.13:.092));
   const opacity=(1-smooth((age-.15)/.27))*(.6+.4*f);
   if(opacity<=0)continue;
   light(root,extent*.32,c.style.color,opacity*(type==='magma'?.5:.15));
   stamp(type,root,extent,opacity,.92,cue.angle*Math.sin(1.7+i*2.3),emerged);
  }
 }
 function artillery(key,p,size,alpha,anchorX,anchorY,angle=0){
  const img=texture('artillery/'+key);if(alpha<=0||!img.naturalWidth)return;
  const h=size*img.naturalHeight/img.naturalWidth;
  ctx.save();ctx.translate(p.x,p.y);ctx.rotate(angle);ctx.globalAlpha=unit(alpha);ctx.globalCompositeOperation='source-over';
  ctx.drawImage(img,-size*anchorX,-h*anchorY,size,h);ctx.restore();
 }
 function fireCannon(t,a,b,k){
  const u=unit((t-.32)/.32),age=unit((t-.32)/.68),after=unit((t-.64)/.36),dx=b.to.x-a.from.x,dy=b.to.y-a.from.y;
  const direction=Math.atan2(dy,dx)-Math.PI;
  if(t<.32)return;
  artillery('smoke',{x:a.from.x-6*k*age,y:a.from.y-18*k*age},(38+52*age)*k,(1-age)*.72,.949,.569,direction);
  const flash=1-smooth(age/.23);artillery('muzzle',a.from,(68+17*(1-flash))*k,flash,.952,.582,direction);
  if(u<1){const arc=18*k,pos=point(a.from,b.to,u,-4*arc*u*(1-u));artillery('shell',pos,16*k,1,.5,.5,Math.atan2(dy-4*arc*(1-2*u),dx)-Math.PI)}
  if(t>=.64){artillery('impact',b.to,(59+31*after)*k,1-smooth(after),.489,.858);light(b.to,18*k,'#ffbd74',(1-after)**3*.42)}
 }
 function fireBreath(t,a,b,k,large){
  const img=loadWorldBossFlame(),u=smooth((t-.32)/.32),fade=1-smooth((t-.69)/.31);
  if(!img?.naturalWidth||u<=0||fade<=0)return;
  const dx=b.to.x-a.from.x,dy=b.to.y-a.from.y,dist=Math.hypot(dx,dy),w=dist*u/.80,h=w*(large?.49:.33);
  const n=Math.floor(Math.max(0,t-.32)*32)%16,sw=img.naturalWidth/4,sh=img.naturalHeight/4;
  ctx.save();ctx.translate(a.from.x,a.from.y);ctx.rotate(Math.atan2(dy,dx));if(dx<0&&ctx.scale)ctx.scale(1,-1);
  ctx.globalAlpha=fade;ctx.drawImage(img,(n%4)*sw,Math.floor(n/4)*sh,sw,sh,-w*.05,-h*.59,w,h);ctx.restore();
  if(t>=.64)light(b.to,18*k,'#ff8a42',fade*.45);
 }
 function cast(c,t,a,b){
  const {type,color}=c.style,k=b.scale,travel=unit((t-.32)/.32),after=unit((t-.64)/.36);
  const glow=smooth(t/.28)*(1-smooth((t-.30)/.09));
  light(b.from,k*(5+11*glow),color,glow*.63);
  if(t<.28)return;
  if(c.style.shot==='shell'){fireCannon(t,a,b,k);return}
  if(c.style.shot==='flame'||c.style.shot==='breath'){fireBreath(t,a,b,k,c.style.shot==='breath');return}
  if(c.style.shot){
   const bolt=c.style.shot==='bolt',u=travel;
   const source=a.from,end=b.to,arc=(bolt?4:20)*k;
   if(u>0&&u<1){
    const pos=point(source,end,u,-4*arc*u*(1-u));
    const angle=Math.atan2(end.y-source.y-4*arc*(1-2*u),end.x-source.x);
    light(pos,(bolt?5:10)*k,color,.65);
    stamp(bolt?'lances':'embers',pos,(bolt?28:22)*k,1,.5,bolt?angle-Math.PI/2:3*u);
   }
   if(after>0){const fade=1-smooth(after);stamp(bolt?'blade':'magma',end,(bolt?40:56)*k*(.75+.4*after),fade,.62);light(end,14*k,color,fade*.55)}
   return;
  }
  if(terrain[type]){ground(c,t,a,b);return}
  if(type==='venom'||type==='souls'||type==='lances'){
   for(let i=0;i<3;i++){
    const delay=i*.036,u=unit((travel-delay)/(1-delay));
    if(u<=0||u>=1)continue;
    const end={x:b.to.x+(i-1)*5*k,y:b.to.y+(i-1)*3*k};
    if(type==='lances'){
     const start={x:end.x+(i-1)*21*k,y:end.y-(83+Math.abs(i-1)*18)*k};
     const pos=point(start,end,u*u);stamp(type,pos,64*k,Math.min(u*8,1),.91,(i-1)*.15);
    }else{
     const start=type==='venom'?(c.style.singleSource?a.from:a.heads[i]):{x:a.from.x,y:a.from.y+(i-1)*11*k};
     const rise=(type==='venom'?-Math.sin(Math.PI*u)*(20+i*6):Math.sin(Math.PI*u)*Math.sin(5*u+i)*(12+i*5))*k;
     const pos=point(start,end,u,rise);
     stamp(type,pos,(type==='venom'?19:33)*k*(1+.17*u),Math.min(1,u*12),.49,type==='venom'?.7*u:.13*Math.sin(u*5+i));
    }
   }
  }else if(type==='rift'){
   const open=smooth((t-.28)/.27),collapse=1-smooth((t-.56)/.12);
   stamp(type,b.to,(14+60*open)*k*collapse,open*collapse,.5,-.62+1.4*travel);
  }
  if(t<.60)return;
  const burst=smooth((t-.60)/.052),fade=1-smooth(after);
  const strength=type==='blade'?1-smooth(after/.75):fade;
  const size={antler:79,blade:77,venom:66,souls:65,lances:58,rift:90}[type]*k;
  light(b.to,size*.33,color,burst*strength*.46);
  stamp(type,b.to,size*(.42+.58*burst+.20*after),burst*strength,type==='lances'?.88:.58,
    type==='rift'?1.1+after*.85:type==='blade'?-.23:0);
 }
 function render(now){
  if(!current)return;
  const c=current;
  if(!valid(c)||(now-c.impact)*c.speed>fall){clear();return}
  const t=timing(c,now);
  if(t===null||!surface())return;
  ctx.clearRect(0,0,width,height);dirty=true;
  if(!width||!height)return;
  const b=box(c);
  if(t>=.32&&!c.release)c.release=b;
  if(t>=.64&&!c.contact)c.contact=b;
  ctx.save();cast(c,t,c.release||b,c.contact||b);ctx.restore();
  const surfacePoint=terrain[c.style.type]&&!c.style.shot?b.foot:b.to;
  if(t>=.61){
   const u=unit((t-.61)/.39),p=c.contact?(terrain[c.style.type]&&!c.style.shot?c.contact.foot:c.contact.to):surfacePoint;
   const name=c.style.shot==='shell'||c.style.shot==='flame'||c.style.shot==='breath'?'fire':aftermath[c.style.type];
   const grounded=terrain[c.style.type],size=(grounded?97:78)*b.scale;
   combatEffects.registered(ctx,name,u,p.x,p.y,size,name==='slash'?.35-u*.48:0,.85);
  }
  if(t>=.64&&!c.landed){
   c.landed=true;
   const type=c.style.type,p=terrain[type]&&!c.style.shot?b.foot:b.to;
   const material={antler:'frost',roots:'venom',fault:'earth',venom:'venom',magma:'ember',frost:'frost',souls:'shade',blade:'iron',lances:'holy',rift:'storm'}[type];
   adventureFx.impact({x:p.x,y:p.y,floorY:b.foot.y,job:'enemy',effect:material,surface:type==='roots'?'wood':terrain[type]?'hard':'steel',heavy:true,scale:b.scale*.74,from:b.from});
  }
 }
 return {start,pose,render,clear,styles,preload};
})();

;
/* ./adventure-fx.js */
'use strict';

// All coordinates are CSS pixels in the battle viewport. Hits only originate from combat.
const adventureFx = (() => {
 const materials = {
  iron:   {hot:'#fff2c5',rim:'#eaa15c',rgb:[1,.54,.20]},
  blade:  {hot:'#effaff',rim:'#a6c2c8',rgb:[.62,.78,.85]},
  shade:  {hot:'#efe4ff',rim:'#ac78d2',rgb:[.59,.31,.91]},
  holy:   {hot:'#fffae1',rim:'#e3b25a',rgb:[1,.75,.32]},
  ember:  {hot:'#fff3b4',rim:'#f78235',rgb:[1,.33,.062]},
  frost:  {hot:'#efffff',rim:'#86dcf2',rgb:[.23,.71,1]},
  storm:  {hot:'#f6f4ff',rim:'#a5a1f5',rgb:[.49,.44,1]},
  venom:  {hot:'#ecf3bd',rim:'#a5c65d',rgb:[.51,.72,.20]},
  earth:  {hot:'#f5dbb9',rim:'#9f8669',rgb:[.71,.54,.33]}
 };
 const spells = {arrow:'blade',pierce:'frost',rain:'blade',feather:'blade',lunar:'frost',
  ember:'ember',fire:'ember',cinder:'ember',comet:'frost',ice:'frost',light:'holy',lightning:'storm',
  storm:'storm',spectral:'shade',dagger:'shade',venom:'venom',spore:'earth',seed:'venom',stone:'earth'};
 const arcs = {arrow:.025,pierce:.008,rain:.32,ember:.075,fire:.075,ice:.06,storm:.035,lightning:.035,
  comet:.36,venom:.21,spore:.24,seed:.18,spectral:.12,lunar:.115,light:.025,feather:.13,cinder:.16,dagger:.055,stone:.24};
 const textures = {}, brushes = new Map(), shots = new Map();
 const heroFlash = {normal:{life:110,heft:.60},strong:{life:200,heft:1.65}};
 const contactTextures = {iron:'gold',holy:'gold',blade:'frost',frost:'frost',ember:'fire',storm:'plasma',shade:'plasma',venom:'mist',earth:'dust'};
 const particles = [], flashes = [], lightsView = [], dissolves = [];
 let dissolveCanvas;
 const TAU = Math.PI*2, bound = (n,lo,hi)=>Math.min(hi,Math.max(lo,n));
 const unit = n=>bound(n,0,1), rand = (lo,hi)=>lo+Math.random()*(hi-lo);
 const valid = p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.y);
 const cssScale = n=>bound(Number.isFinite(n)?n:1,.35,2.5);
 const clock = ()=>performance.now();
 let surface = null,canvas = null,ctx = null,observer = null,width = 0,height = 0,dpr = 1;
 let raf = 0,lastPainted = false,available = false;
 let serial = 0;
 const docVisible = ()=>typeof document!=='undefined'&&!document.hidden;
 function visible(){
  return available&&docVisible()&&(typeof motionAllowed!=='function'||motionAllowed())&&
   (typeof activeScreen==='undefined'||activeScreen==='home')&&(typeof view==='undefined'||!view);
 }
 function resize(){
  const w=surface.clientWidth,h=surface.clientHeight;
  const density=Math.max(1,Math.min(1.65,window.devicePixelRatio||1));
  if(w===width&&h===height&&dpr===density)return;
  width=w;height=h;dpr=density;
  canvas.width=Math.max(1,Math.round(w*dpr));canvas.height=Math.max(1,Math.round(h*dpr));
  ctx.setTransform(dpr,0,0,dpr,0,0);
 }
 function init(host){
  if(host===surface&&available)return true;
  if(!host||typeof document==='undefined'||typeof HTMLCanvasElement==='undefined')return false;
  const target=document.createElement('canvas'),context=target.getContext('2d',{alpha:true});
  if(!context||!['createRadialGradient','createLinearGradient','drawImage','setTransform','quadraticCurveTo','save'].every(k=>typeof context[k]==='function'))return false;
  clear();observer?.disconnect();canvas?.remove();
  surface=host;canvas=target;ctx=context;available=true;width=height=0;
  canvas.setAttribute('aria-hidden','true');canvas.className='adventure-fx-layer';
  canvas.style.cssText='position:absolute;inset:0;width:100%;height:100%;z-index:16;pointer-events:none;contain:strict';
  host.appendChild(canvas);resize();
  if(typeof ResizeObserver==='function'){observer=new ResizeObserver(resize);observer.observe(host)}
  for(const name of ['dust','fire','frost','plasma','gold','mist','arrow','dagger','pod','shard','defeat-mask']){
   if(textures[name])continue;
   const image=new Image();image.decoding='async';image.src='./assets/adventure-fx/'+name+'.webp';textures[name]=image;
  }
  for(const name of ['dust','embers']){
   const img=new Image();img.decoding='async';img.src='./assets/boss-fx/'+name+'.webp';textures['defeat-'+name]=img;
  }
  return true;
 }
 function clear(){
  if(raf)cancelAnimationFrame(raf);raf=0;
  particles.length=flashes.length=lightsView.length=dissolves.length=0;shots.clear();
  if(lastPainted&&ctx)ctx.clearRect(0,0,width,height);
  lastPainted=false;
 }
 function wake(){if(!raf)raf=requestAnimationFrame(loop)}
 function loop(now){raf=0;tick(now);if(particles.length||flashes.length||shots.size||dissolves.length)wake()}
 function lightBrush(key){
  if(brushes.has(key))return brushes.get(key);
  const c=document.createElement('canvas');c.width=c.height=80;const g=c.getContext('2d');
  const p=materials[key],grad=g.createRadialGradient(40,40,0,40,40,40);
  grad.addColorStop(0,p.hot);grad.addColorStop(.10,p.rim+'f0');grad.addColorStop(.32,p.rim+'6b');
  grad.addColorStop(.68,p.rim+'16');grad.addColorStop(1,p.rim+'00');
  g.fillStyle=grad;g.fillRect(0,0,80,80);brushes.set(key,c);return c;
 }
 function glow(key,x,y,rx,ry,alpha){
  if(rx<.1||ry<.1||alpha<=0)return;
  ctx.globalAlpha=unit(alpha);ctx.drawImage(lightBrush(key),x-rx,y-ry,rx*2,ry*2);
 }
 function stamp(name,x,y,angle,w,h,alpha){
  const img=textures[name];if(!img?.complete||!img.naturalWidth||alpha<=0)return;
  ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.globalAlpha=unit(alpha);
  ctx.drawImage(img,-w/2,-h/2,w,h);ctx.restore();
 }
 function ink(points,paint,lineWidth,alpha){
  ctx.strokeStyle=paint;ctx.lineWidth=lineWidth;ctx.globalAlpha=unit(alpha);ctx.beginPath();
  ctx.moveTo(points[0].x,points[0].y);for(let i=1;i<points.length;i++)ctx.lineTo(points[i].x,points[i].y);ctx.stroke();
 }
 function palette(job,effect,k){
  if(job==='enemy'&&Object.hasOwn(materials,effect))return effect;
  if(job==='mage')return effect==='ice'?'frost':effect==='lightning'?'storm':effect==='meteor'||k===55?'frost':'ember';
  if(job==='paladin')return 'holy';
  if(job==='shadow')return k===24||k===44?'venom':'shade';
  if(job==='archer')return k===38?'venom':k===39||k===59||k===36?'ember':k===58?'frost':'blade';
  return effect==='quake'?'earth':'blade';
 }
 function addParticle(p){if(particles.length>=128)particles.shift();p.born=clock();particles.push(p)}
 // Capture CSS coordinates while the defeated actor is still in its lane.
 function deathAnchor(node){
  if(!visible()||!node||!surface)return null;
  const base=surface.getBoundingClientRect(),r=node.getBoundingClientRect();
  if(!r.width||!r.height||!base.width)return null;
  const unit=surface.clientWidth/base.width;
  const box={node,wave:node.dataset?.wave,left:(r.left-base.left)*unit,top:(r.top-base.top)*unit,width:r.width*unit,height:r.height*unit};
  const painted=node.querySelector('canvas.actor-cel:not([hidden])');
  if(painted?.width&&textures['defeat-mask']?.naturalWidth){
   const still=document.createElement('canvas');still.width=still.height=192;
   still.getContext('2d').drawImage(painted,0,0,192,192);
   box.still=still;
   box.padded=painted.classList.contains('boss-technique-cel')?1.25:1;
  }
  return box;
 }
 function actorReplaced(box){return box?.node&&box.node.dataset?.wave!==box.wave}
 function defeat(box,region,material,boss=false){
  if(!box||actorReplaced(box)||!visible())return;
  if(box.still){
   if(dissolves.length>=4)dissolves.shift();
   dissolves.push({box,born:clock(),duration:boss?650:465});
  }
  const size=bound(box.width,65,205),x=box.left+box.width*.50,floor=box.top+box.height*.88;
  const y=floor-size*.31;
  const color=['blade','venom','earth','venom','ember','frost','shade','iron','holy','storm'][region]||'blade';
  const solid=material==='hard'||material==='wood'||material==='steel',n=boss?11:6;
  for(let i=0;i<n;i++){
   const side=i%2?1:-1,delta=side*rand(.04,.19)*size;
   const chip=solid&&i%3!==0;
   addParticle({departure:box,kind:chip?'chip':'mote',key:color,x:x+delta,y:y+rand(-.13,.15)*size,
    vx:side*rand(.18,.55)*size,vy:-rand(.16,.46)*size,grav:(chip?2.7:-.19)*size,
    drag:chip?1.55:1.85,age:0,life:rand(.41,.70),floor,angle:rand(-2,2),spin:rand(-4,4),
    bounce:0,sz:rand(.012,.027)*size,wood:material==='wood',sc:1});
  }
  // Two low, asymmetric dust plumes settle as the last motes rise past the silhouette.
  for(const side of [-1,1]){
   addParticle({departure:box,kind:'dust',texture:'defeat-dust',x:x+side*.075*size,y:floor-size*.10,
    vx:side*size*rand(.12,.24),vy:-size*.037,grav:-size*.035,drag:1.7,age:0,
    life:boss?.72:.52,floor,sz:size*(boss?.58:.50),angle:side*.13,spin:side*.12,opacity:solid?.77:.57,sc:1});
  }
  if(region===4||region===7){
   addParticle({departure:box,kind:'dust',texture:'defeat-embers',x,y:y+size*.08,vx:0,vy:-size*.16,grav:0,drag:1.2,age:0,
    life:.58,floor,sz:size*.53,angle:0,spin:.18,opacity:.76,sc:1});
  }
  wake();
 }
 function drawDissolve(d,now){
  const dt=unit((now-d.born)/d.duration),{box}=d,cell=96;
  const settle=unit((dt-.12)/.88),frame=Math.round(settle*23),sx=cell*(frame%6),sy=cell*Math.floor(frame/6);
  if(!dissolveCanvas){dissolveCanvas=document.createElement('canvas');dissolveCanvas.width=dissolveCanvas.height=192}
  const g=dissolveCanvas.getContext('2d'),mask=textures['defeat-mask'];
  g.clearRect(0,0,192,192);g.drawImage(box.still,0,0);
  g.globalCompositeOperation='source-atop';
  g.drawImage(mask,sx,sy+4*cell,cell,cell,0,0,192,192);
  g.globalCompositeOperation='destination-in';g.drawImage(mask,sx,sy,cell,cell,0,0,192,192);
  g.globalCompositeOperation='source-over';
  const size=box.width*box.padded;
  ctx.save();ctx.globalAlpha=1-dt*.16;ctx.globalCompositeOperation='source-over';
  ctx.translate(box.left+box.width*.5,box.top+box.height*.86+dt*dt*box.height*.04);
  ctx.rotate(.15*settle*(2-settle));ctx.drawImage(dissolveCanvas,-size*.5,-size*.5-box.height*.36,size,size);ctx.restore();
 }
 function impact({x,y,floorY,job='warrior',skillId=-1,effect,surface:hitSurface='body',critical=false,heavy=false,echo=false,scale=1,from,flashOnly=false}){
  if(!visible()||!Number.isFinite(x)||!Number.isFinite(y))return false;
  const sc=cssScale(scale),key=palette(job,effect??(typeof SKILL_RULES!=='undefined'?SKILL_RULES[skillId]?.effect:''),skillId);
  const steel=hitSurface==='steel',stone=hitSurface==='hard',wood=hitSurface==='wood';
  const floor=Math.max(y+2*sc,Number.isFinite(floorY)?floorY:y+35*sc);
  const heading=valid(from)?Math.atan2(y-from.y,x-from.x):-.18;
  const heft=(critical?1.24:1)*(heavy?1.2:1)*(echo?.63:1);
  const color=steel&&key==='blade'?'iron':key;
  const flash=job==='enemy'?{heft,life:echo?108:critical?204:154}:heroFlash[critical||heavy?'strong':'normal'];
  flashes.push({x,y,floor,key:color,sc,heft:flash.heft,t:clock(),life:flash.life,heading,flashOnly});
  if(flashes.length>8)flashes.shift();
  // The skill's own contact film already supplies its sparks, splinters and elemental plume.
  if(flashOnly){wake();return true}
  const sparkCount=Math.round((steel?11:stone?7:wood?4:3)*heft);
  for(let i=0;i<sparkCount;i++){
   const fan=heading+(i%4===0?Math.PI:0)+rand(-.98,.92),speed=sc*rand(55,steel?235:158)*heft;
   const chip=stone||wood||key==='frost';
   addParticle({kind:chip?'chip':'spark',key:color,x,y,px:x,py:y,vx:speed*Math.cos(fan),vy:speed*Math.sin(fan)-rand(12,68)*sc,
    grav:(chip?365:240)*sc,drag:chip?1.55:2.5,age:0,life:rand(.23,.57),floor,
    sz:sc*rand(chip?1.25:.65,chip?3.6:1.36),angle:rand(0,TAU),spin:rand(-12,12),bounce:0,sc,wood});
  }
  const dustCount=(key==='earth'?5:stone||wood?3:1)+(heavy?1:0);
  for(let i=0;i<dustCount;i++){
   const atFloor=key==='earth',dir=(i%2?1:-1);
   addParticle({kind:'dust',x:x+rand(-3,3)*sc,y:atFloor?floor-2*sc:y,px:x,py:y,vx:atFloor?dir*rand(28,64)*sc:Math.cos(heading)*rand(18,44)*sc,
    vy:-rand(9,27)*sc,grav:-9*sc,drag:2.8,age:0,life:rand(.38,.70),floor,
    sz:sc*rand(13,22)*(atFloor?1.15:1),angle:rand(-1,1),spin:rand(-.85,.85),opacity:stone||wood||atFloor?.53:.27,sc});
  }
  if(key==='ember'||key==='holy'||key==='shade'||key==='storm'||key==='frost'||key==='venom'){
   const n=echo?1:heavy?4:2;
   for(let i=0;i<n;i++){
    const a=heading+rand(-1.25,1.25),v=rand(16,70)*sc;
    addParticle({kind:'plume',key:color,x,y,px:x,py:y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-14*sc,grav:-12*sc,drag:3.4,
     age:0,life:rand(.17,.39),floor,sz:rand(13,24)*sc*heft,angle:a+rand(-.64,.64),spin:rand(-2.2,2.2),sc});
   }
  }
  wake();return true;
 }
 function pathAt(shot,t){
  const {from:a,to:b,arc}=shot,dx=b.x-a.x,dy=b.y-a.y;
  return {x:a.x+dx*t,y:a.y+dy*t-4*arc*t*(1-t)};
 }
 function projectile({id,from,to,head,progress,job='archer',skillId=-1,style,scale=1,enemy=false,fade=1}){
  if(!visible()||id==null||!valid(from)||!valid(to)||!Number.isFinite(progress))return false;
  const sc=cssScale(scale),kind=style||({mage:'ember',archer:'arrow',paladin:'light',shadow:'dagger'}[job]||'stone');
  const t=unit(progress),now=clock(),arc=Math.min(Math.hypot(to.x-from.x,to.y-from.y),width*.75)*(arcs[kind]??.05);
  if(!shots.has(id)&&shots.size>=24)shots.delete(shots.keys().next().value);
  const shot=shots.get(id)||{seed:++serial,lastShed:0};
  Object.assign(shot,{from,to,t,sc:sc*(enemy?.93:1),kind,key:spells[kind]||palette(job,'',skillId),arc,time:now,fade:unit(fade)});
  shot.head=valid(head)?{x:head.x,y:head.y}:pathAt(shot,t);shots.set(id,shot);
  if((kind==='ember'||kind==='comet'||kind==='fire')&&now-shot.lastShed>22&&t>0&&t<1){
   shot.lastShed=now;
   addParticle({kind:'plume',key:shot.key,x:shot.head.x,y:shot.head.y,px:shot.head.x,py:shot.head.y,vx:rand(-6,6)*sc,vy:-12*sc,
    grav:-5*sc,drag:2,age:0,life:.19,sz:12*sc,angle:rand(0,TAU),spin:rand(-1,1),floor:height,sc});
  }
  wake();return true;
 }
 function triangle(coords,fill,alpha){
  ctx.globalAlpha=unit(alpha);ctx.fillStyle=fill;
  ctx.beginPath();ctx.moveTo(coords[0],coords[1]);for(let i=2;i<coords.length;i+=2)ctx.lineTo(coords[i],coords[i+1]);ctx.closePath();ctx.fill();
 }
 function paintShot(s,now){
  const t=s.t,k=s.kind,sc=s.sc,mat=materials[s.key],alpha=s.fade*unit(1-Math.max(0,now-s.time-40)/53);
  const head=s.head,back=pathAt(s,Math.max(0,t-.015));
  const a=Math.atan2(head.y-back.y,head.x-back.x)||Math.atan2(s.to.y-s.from.y,s.to.x-s.from.x);
  const isArrow=['arrow','pierce','rain','feather','dagger','light','lunar','cinder'].includes(k);
  const tail=k==='storm'||k==='lightning'?.65:isArrow?.23:.40;
  const line=[];
  for(let i=0;i<=8;i++){
   const u=Math.max(0,t-tail*(1-i/8)),q=pathAt(s,u);
   if((k==='storm'||k==='lightning')&&i>0&&i<8)q.y+=Math.sin(s.seed*4.3+i*11.8)*3.8*sc;
   line.push(i===8?head:q);
  }
  ctx.globalCompositeOperation='lighter';
  for(let i=1;i<line.length;i++)ink([line[i-1],line[i]],mat.rim,(isArrow?1.25:3.4)*sc*(.25+i/10),alpha*(i*i/68)*(isArrow?.45:.72));
  if(!isArrow)ink(line.slice(-3),mat.hot,1.15*sc,alpha*.89);
  if(isArrow){
   const sprite=k==='dagger'?'dagger':k==='light'||k==='lunar'?'shard':'arrow';
   const length=(k==='dagger'?17:k==='light'?27:26)*sc;
   if(textures[sprite]?.naturalWidth){
    const tip={x:head.x-Math.cos(a)*length*.5,y:head.y-Math.sin(a)*length*.5};
    ctx.globalCompositeOperation='source-over';
    stamp(sprite,tip.x,tip.y,a,length,length*textures[sprite].naturalHeight/textures[sprite].naturalWidth,alpha);
    return;
   }
   ctx.save();ctx.translate(head.x,head.y);ctx.rotate(a);ctx.scale(sc,sc);
   const arrowLength=k==='light'?19:k==='dagger'?11:15;
   const fork=k==='dagger'||k==='lunar'?3.4:1.75;
   ctx.globalCompositeOperation='source-over';
   ink([{x:-arrowLength,y:0},{x:0,y:0}],k==='dagger'?'#483750':'#79624a',1.65,alpha);
   ink([{x:-arrowLength,y:-.38},{x:-1,y:-.38}],mat.hot,.52,alpha*.96);
   triangle([1.4,0,-4.8,-fork,-3.3,0,-4.8,fork],mat.rim,alpha);
   triangle([1.4,0,-4.8,-fork,-3.3,0],mat.hot,alpha);
   triangle([-arrowLength+3,0,-arrowLength-2,-2.6,-arrowLength+1,-2.45,-arrowLength+5,-.5],mat.rim,alpha*.9);
   ctx.restore();
  }else{
   const solid=k==='ice'||k==='stone'?'shard':['seed','spore','venom'].includes(k)?'pod':null;
   const name=solid||((k==='ember'||k==='fire')?'fire':'plasma');
   if(solid)ctx.globalCompositeOperation='source-over';
   stamp(name,head.x,head.y,a,sc*(solid?15:20),sc*(solid?8:12),alpha*.96);
   ctx.globalCompositeOperation='lighter';glow(s.key,head.x,head.y,6.2*sc,4.3*sc,alpha*.78);
  }
 }
 function travelParticle(p,dt){
  const decay=Math.exp(-p.drag*dt),flight=-Math.expm1(-p.drag*dt)/p.drag;
  p.x+=p.vx*flight;p.y+=p.vy*flight+p.grav/p.drag*(dt-flight);
  p.vx*=decay;p.vy=p.vy*decay+p.grav*flight;p.angle+=p.spin*dt;
 }
 function updateParticle(p,dt){
  p.px=p.x;p.py=p.y;p.age+=dt;
  if(p.age>=p.life||dt<=0)return;
  if(p.settled)return;
  if(p.kind!=='chip'&&p.kind!=='spark'){travelParticle(p,dt);return;}
  // Find the instant of ground contact. Carry the unused part of this frame past
  // the bounce so gravity, friction and landing time agree at 30, 60 and 120 Hz.
  let remaining=dt;
  while(remaining>0){
   const start=p.y,vy=p.vy,drag=p.drag,g=p.grav;
   const at=t=>{const f=-Math.expm1(-drag*t)/drag;return start+vy*f+g/drag*(t-f);};
   if(at(remaining)<p.floor){travelParticle(p,remaining);break;}
   let low=0,high=remaining;
   for(let i=0;i<12;i++){const mid=(low+high)*.5;if(at(mid)<p.floor)low=mid;else high=mid;}
   travelParticle(p,high);remaining-=high;p.y=p.floor;
   p.vy=-Math.abs(p.vy)*(p.kind==='spark'?.29:.18);p.vx*=p.wood?.47:.64;p.spin*=.62;
   if(++p.bounce>=2||Math.abs(p.vy)<4){
    p.settled=true;p.vx=p.vy=p.spin=0;p.life=Math.min(p.life,p.age-remaining+.075);break;
   }
  }
 }
 function paintParticle(p){
  const u=unit(p.age/p.life),fade=1-u;
  if(p.kind==='dust'){
   ctx.globalCompositeOperation='source-over';const w=p.sz*(.68+1.45*u);
   stamp(p.texture||'dust',p.x,p.y,p.angle,w,w*(p.texture==='defeat-dust'?.59:.81),Math.sin(Math.min(1,u/.12)*Math.PI/2)*fade*fade*p.opacity);return;
  }
  const mat=materials[p.key];ctx.globalCompositeOperation='lighter';
  if(p.kind==='mote'){
   const w=p.sz*(1+.34*Math.sin(u*Math.PI));
   glow(p.key,p.x,p.y,w*2.6,w*2.6,fade*fade*.52);
   stamp('frost',p.x,p.y,p.angle,w*1.8,w*2.5,fade*.85);
  }else if(p.kind==='plume'){
   const name=({ember:'fire',frost:'frost',holy:'gold',venom:'mist'})[p.key]||'plasma',size=p.sz*(.62+u*.77);
   stamp(name,p.x,p.y,p.angle,size,size*.83,fade*fade*.81);
   if(!textures[name]?.naturalWidth)glow(p.key,p.x,p.y,size*.37,size*.19,fade*.33);
  }else if(p.kind==='spark'){
   const travel=.026*fade;
   const tail={x:p.x-p.vx*travel,y:p.y-p.vy*travel};
   ink([tail,p],mat.rim,p.sz*2.2,fade*.49);
   ink([tail,p],u<.3?mat.hot:mat.rim,p.sz*.86,fade);
  }else{
   if(!['frost','holy','ember'].includes(p.key))ctx.globalCompositeOperation='source-over';
   ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.angle);
   const size=p.sz*(.82+.18*Math.cos(p.angle));
   const w=p.wood?size*.46:size*.75,h=size*(p.key==='frost'?1.75:1.1);
   triangle([-w,-h*.70,w*.64,-h,w,h*.30,-w*.28,h],p.wood?'#a98250':p.key==='frost'?mat.rim:'#aa9890',fade);
   triangle([-w,-h*.70,w*.64,-h,-w*.28,h],p.wood?'#d1ad7d':mat.hot,fade*.89);ctx.restore();
  }
 }
 function paintFlash(f,now){
  const u=unit((now-f.t)/f.life),fade=1-u,sc=f.sc,rad=(8+13*f.heft)*sc;
  ctx.globalCompositeOperation='lighter';
  if(f.y<f.floor)glow(f.key,f.x+Math.cos(f.heading)*2*sc,f.floor,rad*1.22,4*sc,fade*fade*.24);
  glow(f.key,f.x,f.y,rad,rad*.85,fade*fade*.72);
  if(u<.42){
   if(f.flashOnly)stamp(contactTextures[f.key],f.x,f.y,f.heading,rad*.92,rad*.50,(1-u/.42)*.56);
   ctx.save();ctx.translate(f.x,f.y);ctx.rotate(f.heading-.77);const core=(1-u/.42)*sc;
   glow(f.key,0,0,(7+6*f.heft)*core,1.45*sc,fade*.95);ctx.restore();
  }
 }
 function lights(){
  lightsView.length=0;if(!flashes.length||!visible())return lightsView;
  const now=clock();
  for(let i=flashes.length-1;i>=0&&lightsView.length<4;i--){
   const f=flashes[i],fade=unit(1-(now-f.t)/f.life);if(fade<=0)continue;
   lightsView.push({x:f.x,y:f.y,radius:(41+15*f.heft)*f.sc,intensity:.95*fade*fade*f.heft,rgb:materials[f.key].rgb});
  }
  return lightsView;
 }
 function tick(now=clock()){
  if(!visible()){clear();return}
  if(!Number.isFinite(now))return;
  if(!width||!height)resize();
  ctx.clearRect(0,0,width,height);
  for(let i=particles.length-1;i>=0;i--){
   const p=particles[i];
   if(actorReplaced(p.departure)){particles.splice(i,1);continue}
   updateParticle(p,Math.max(0,(now-p.born)/1000-p.age));
   if(p.age>=p.life)particles.splice(i,1);
  }
  for(let i=dissolves.length-1;i>=0;i--){
   const d=dissolves[i];
   if(actorReplaced(d.box)||now-d.born>=d.duration)dissolves.splice(i,1);
   else drawDissolve(d,now);
  }
  for(const p of particles)if(p.kind==='dust')paintParticle(p);
  ctx.globalCompositeOperation='lighter';ctx.lineCap='round';ctx.lineJoin='round';
  for(const [id,shot] of shots){if(now-shot.time>93||shot.fade<=0)shots.delete(id);else paintShot(shot,now)}
  for(let i=flashes.length-1;i>=0;i--){if(now-flashes[i].t>=flashes[i].life)flashes.splice(i,1);else paintFlash(flashes[i],now)}
  for(const p of particles)if(p.kind!=='dust')paintParticle(p);
  ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';
  lastPainted=Boolean(particles.length||shots.size||flashes.length||dissolves.length);
 }
 return {init,ready:()=>available,clear,deathAnchor,defeat,impact,projectile,tick,lights,
  stats:()=>({particles:particles.length,lights:flashes.length,projectiles:shots.size,active:!!raf})};
})();

;
/* ./tower-minis.js */
'use strict';

// Every ten-floor gallery ends at a campaign guardian. The three galleries have
// their own roster; the next visit starts at a different position in its roster.
const TOWER_MINIS=[
 // name, body, technique, weapon origin (in the original cell), attack interval, projectile
 ['도끼 집행자','fighter',7,.12,.56,2770],['쇠뇌 망령','wraith',7,.07,.35,2210,'bolt'],['칼등 멧돼지','boar',0,.075,.59,2440],
 ['철벽 창병','knight',7,.025,.79,2350],['화로 사제','fighter',4,.28,.13,2830],['철갑 사냥개','hound',0,.38,.90,2100],
 ['잿빛 검술사','fighter',7,.05,.35,2240],['삼각 포탑','giant',2,.10,.225,2710,'shell'],['공성 골렘','giant',2,.125,.69,2930],
 ['비늘 창병','fighter',7,.08,.52,2350],['백로 예언자','seraph',8,.12,.33,2740],['비취 악어','hound',0,.06,.60,2430],
 ['고목 방패수','tree',1,.05,.8,2860],['달나방 주술사','bat',6,.08,.31,2580],['비취 독전갈','scorpion',3,.56,.38,2330],
 ['갈고리 자객','fighter',7,.06,.73,2110],['등불 포자술사','cap',3,.12,.51,2600],['늪의 뿔사슴','stag',0,.15,.39,2490],
 ['흑요석 철퇴병','knight',2,.175,.63,2720],['천구술사','orb',9,.23,.22,2850],['화염 도롱뇽','toad',4,.06,.55,2420,'flame'],
 ['태양 창병','knight',8,.04,.47,2290,'bolt'],['월식 예언자','wraith',9,.13,.275,2790],['용암 산양','stag',0,.07,.33,2380],
 ['은낫 수확자','fighter',7,.025,.87,2180],['시계 대포병','giant',2,.09,.375,2900,'shell'],['현무암 비룡','griffin',4,.067,.475,2650,'breath']
].map(([name,body,technique,x,y,interval,shot],i)=>{
 const id=String(i).padStart(2,'0'),art='tower_mini_'+id;
 const scale=[.42,.40,.46,.43,.40,.42,.42,.46,.53,.44,.43,.49,.51,.43,.47,.40,.40,.48,.47,.44,.46,.44,.43,.46,.46,.50,.57][i];
 return {id,art,scale,name,body,technique,origin:[x,y],interval,shot,region:technique,mini:true,boss:true,background:'tower-interior'};
});
function towerEncounter(floor){
 const group=Math.floor((floor-1)/10),position=(floor-1)%10;
 if(position!==9)return TOWER_MINIS[group%3*9+(position+Math.floor(group/3)*2)%9];
 const region=CAMPAIGN_CREATURE_REGIONS[group%CAMPAIGN_CREATURE_REGIONS.length];
 return {region,variant:3,boss:true,name:BIOMES[region].boss,art:'creature_'+region+'_3',background:'tower-interior'};
}


;
/* ./assets/enemy-motion/registration.js */
const enemyRegistration={"creature_0_0":{"profile":"leap","scale":0.8347826086956521,"scaleY":0.8347826086956521,"dy":[-0.03260869565217391,-0.03260869565217391,-0.03260869565217391,-0.03260869565217391],"rows":4},"creature_0_1":{"profile":"charge","scale":0.8333333333333334,"scaleY":0.8333333333333334,"dy":[0.0,0.0026041666666666665,0.0026041666666666665,0.005208333333333333,0.005208333333333333,0.005208333333333333],"rows":6},"creature_0_2":{"profile":"charge","scale":0.8333333333333334,"scaleY":0.8333333333333334,"dy":[-0.005208333333333333,0.0,0.0,0.0,-0.0026041666666666665,0.0],"rows":6},"creature_0_3":{"profile":"charge","scale":0.8333333333333334,"scaleY":0.8333333333333334,"dy":[0.03125,0.029166666666666667,0.03125,0.03333333333333333,0.03125,0.03125],"rows":6},"creature_1_0":{"profile":"sweep","scale":0.8333333333333334,"scaleY":0.8333333333333334,"dy":[0.0,0.0,0.0,0.0,0.0,0.0],"rows":6},"creature_1_1":{"profile":"sweep","scale":0.8333333333333334,"scaleY":0.8333333333333334,"dy":[0.0,0.0,0.0,0.0,0.0,0.0],"rows":6},"creature_1_2":{"profile":"sweep","scale":0.8333333333333334,"scaleY":0.8333333333333334,"dy":[0.0,0.0,0.0,0.0,0.0,0.0],"rows":6},"creature_1_3":{"profile":"sweep","scale":0.8333333333333334,"scaleY":0.8333333333333334,"dy":[0.0375,0.0375,0.041666666666666664,0.0375,0.0375,0.0375],"rows":6},"creature_2_0":{"profile":"heavy","scale":0.8333333333333334,"scaleY":0.8333333333333334,"dy":[0.0,0.0,0.0,0.0,0.0,0.0],"rows":6},"creature_2_1":{"profile":"heavy","scale":0.8333333333333334,"scaleY":0.8333333333333334,"dy":[0.0,0.0,0.0,0.0,0.0,0.0],"rows":6},"creature_2_2":{"profile":"heavy","scale":0.8333333333333334,"scaleY":0.8333333333333334,"dy":[0.075,0.07291666666666667,0.07291666666666667,0.07291666666666667,0.075,0.075],"rows":6},"creature_2_3":{"profile":"heavy","scale":0.8333333333333334,"scaleY":0.8333333333333334,"dy":[0.06666666666666667,0.06875,0.06875,0.06666666666666667,0.06875,0.06666666666666667],"rows":6},"creature_3_0":{"profile":"cast","scale":0.8333333333333334,"scaleY":0.8333333333333334,"dy":[0.0,0.0,0.0,0.0,0.0,0.0],"rows":6},"creature_3_1":{"profile":"cast","scale":0.8333333333333334,"scaleY":0.8333333333333334,"dy":[0.0,0.0,0.0,0.0,0.0,0.0],"rows":6},"creature_3_2":{"profile":"cast","scale":0.8333333333333334,"scaleY":0.8333333333333334,"dy":[0.0,0.0,0.0,0.0,0.0,0.0],"rows":6},"creature_3_3":{"profile":"cast","scale":0.8333333333333334,"scaleY":0.8333333333333334,"dy":[0.04375,0.04583333333333333,0.04583333333333333,0.04583333333333333,0.04583333333333333,0.04375],"rows":6},"creature_4_0":{"profile":"heavy","scale":0.8333333333333334,"scaleY":0.8333333333333334,"dy":[0.0,0.0,0.0,0.0,0.0,0.0],"rows":6},"creature_4_1":{"profile":"heavy","scale":0.8333333333333334,"scaleY":0.8333333333333334,"dy":[0.0,0.0,0.0,0.0,0.0,0.0],"rows":6},"creature_4_2":{"profile":"heavy","scale":0.8333333333333334,"scaleY":0.8333333333333334,"dy":[0.0,0.0,0.0,0.0,0.0,0.0],"rows":6},"creature_4_3":{"profile":"heavy","scale":0.8333333333333334,"scaleY":0.8333333333333334,"dy":[0.05625,0.05625,0.05625,0.05625,0.05625,0.05625],"rows":6},"creature_5_0":{"profile":"charge","scale":0.8333333333333334,"scaleY":0.8333333333333334,"dy":[0.0,0.0,0.0,0.0,0.0,0.0],"rows":6},"creature_5_1":{"profile":"charge","scale":0.8333333333333334,"scaleY":0.8333333333333334,"dy":[0.0,0.0,0.0,0.0,0.0,0.0],"rows":6},"creature_5_2":{"profile":"charge","scale":0.8333333333333334,"scaleY":0.8333333333333334,"dy":[0.07291666666666667,0.07083333333333333,0.07083333333333333,0.07083333333333333,0.07083333333333333,0.07291666666666667],"rows":6},"creature_5_3":{"profile":"charge","scale":0.8333333333333334,"scaleY":0.8333333333333334,"dy":[0.07083333333333333,0.07291666666666667,0.07083333333333333,0.07291666666666667,0.07291666666666667,0.07083333333333333],"rows":6},"creature_6_0":{"profile":"sweep","scale":0.8333333333333334,"scaleY":0.8333333333333334,"dy":[0.06875,0.06666666666666667,0.06666666666666667,0.06875,0.06666666666666667,0.06875],"rows":6},"creature_6_1":{"profile":"sweep","scale":0.8333333333333334,"scaleY":0.8333333333333334,"dy":[0.0,0.0,0.0,0.0,0.0,0.0],"rows":6},"creature_6_2":{"profile":"sweep","scale":0.8333333333333334,"scaleY":0.8333333333333334,"dy":[0.0625,0.06458333333333334,0.06458333333333334,0.06458333333333334,0.0625,0.0625],"rows":6},"creature_6_3":{"profile":"sweep","scale":0.8333333333333334,"scaleY":0.8333333333333334,"dy":[0.06458333333333334,0.06458333333333334,0.06666666666666667,0.06458333333333334,0.06458333333333334,0.06458333333333334],"rows":6},"creature_7_0":{"profile":"sweep","scale":0.8333333333333334,"scaleY":0.8333333333333334,"dy":[0.0,0.0,0.0,0.0,0.0,0.0],"rows":6},"creature_7_1":{"profile":"sweep","scale":0.8333333333333334,"scaleY":0.8333333333333334,"dy":[0.05625,0.05625,0.058333333333333334,0.058333333333333334,0.05625,0.05625],"rows":6},"creature_7_2":{"profile":"sweep","scale":0.8333333333333334,"scaleY":0.8333333333333334,"dy":[0.0,0.0,0.0,0.0,0.0,0.0],"rows":6},"creature_7_3":{"profile":"sweep","scale":0.8333333333333334,"scaleY":0.8333333333333334,"dy":[0.06041666666666667,0.06041666666666667,0.058333333333333334,0.06041666666666667,0.058333333333333334,0.06041666666666667],"rows":6},"creature_8_0":{"profile":"flying","scale":0.8333333333333334,"scaleY":0.8333333333333334,"dy":[0.0,0.0,0.0,0.0,0.0,0.0],"rows":6},"creature_8_1":{"profile":"flying","scale":0.8333333333333334,"scaleY":0.8333333333333334,"dy":[0.0,0.0,0.0,0.0,0.0,0.0],"rows":6},"creature_8_2":{"profile":"flying","scale":0.8333333333333334,"scaleY":0.8333333333333334,"dy":[0.11875,0.12083333333333333,0.12083333333333333,0.12083333333333333,0.12083333333333333,0.11875],"rows":6},"creature_8_3":{"profile":"flying","scale":0.8333333333333334,"scaleY":0.8333333333333334,"dy":[0.125,0.125,0.125,0.125,0.125,0.125],"rows":6},"creature_9_0":{"profile":"cast","scale":0.8333333333333334,"scaleY":0.8333333333333334,"dy":[0.0,0.0,0.0,0.0,0.0,0.0],"rows":6},"creature_9_1":{"profile":"cast","scale":0.8333333333333334,"scaleY":0.8333333333333334,"dy":[0.0,0.0,0.0,0.0,0.0,0.0],"rows":6},"creature_9_2":{"profile":"cast","scale":0.8333333333333334,"scaleY":0.8333333333333334,"dy":[0.0,0.0,0.0,0.0,0.0,0.0],"rows":6},"creature_9_3":{"profile":"cast","scale":0.8333333333333334,"scaleY":0.8333333333333334,"dy":[0.14583333333333334,0.14583333333333334,0.14166666666666666,0.14166666666666666,0.14583333333333334,0.14583333333333334],"rows":6},"eclipse-warden":{"profile":"leap","scale":0.8338762214983714,"scaleY":0.8327137546468402,"dy":[0.0,0.0,0.0,0.0],"rows":4},"tower_mini_00":{"profile":"sweep","scale":0.8333333333333334,"scaleY":0.8333333333333334,"dy":[0.008333333333333333,0.010416666666666666,0.010416666666666666,0.0125,0.010416666666666666,0.010416666666666666],"rows":6},"tower_mini_01":{"profile":"cast","scale":0.8333333333333334,"scaleY":0.8333333333333334,"dy":[0.010416666666666666,0.014583333333333334,0.014583333333333334,0.016666666666666666,0.014583333333333334,0.0125],"rows":6},"tower_mini_02":{"profile":"charge","scale":0.8333333333333334,"scaleY":0.8333333333333334,"dy":[0.008333333333333333,0.008333333333333333,0.008333333333333333,0.008333333333333333,0.008333333333333333,0.008333333333333333],"rows":6},"tower_mini_03":{"profile":"sweep","scale":0.8333333333333334,"scaleY":0.8333333333333334,"dy":[0.010416666666666666,0.010416666666666666,0.010416666666666666,0.010416666666666666,0.010416666666666666,0.010416666666666666],"rows":6},"tower_mini_04":{"profile":"cast","scale":0.8333333333333334,"scaleY":0.8333333333333334,"dy":[0.010416666666666666,0.010416666666666666,0.010416666666666666,0.010416666666666666,0.010416666666666666,0.010416666666666666],"rows":6},"tower_mini_05":{"profile":"charge","scale":0.8333333333333334,"scaleY":0.8333333333333334,"dy":[0.00625,0.008333333333333333,0.008333333333333333,0.008333333333333333,0.008333333333333333,0.008333333333333333],"rows":6},"tower_mini_06":{"profile":"sweep","scale":0.8333333333333334,"scaleY":0.8333333333333334,"dy":[0.010416666666666666,0.0125,0.0125,0.0125,0.0125,0.0125],"rows":6},"tower_mini_07":{"profile":"cast","scale":0.8333333333333334,"scaleY":0.8333333333333334,"dy":[0.008333333333333333,0.010416666666666666,0.0125,0.010416666666666666,0.0125,0.010416666666666666],"rows":6},"tower_mini_08":{"profile":"heavy","scale":0.8333333333333334,"scaleY":0.8333333333333334,"dy":[0.00625,0.008333333333333333,0.00625,0.00625,0.00625,0.00625],"rows":6},"tower_mini_09":{"profile":"sweep","scale":0.8333333333333334,"scaleY":0.8333333333333334,"dy":[0.010416666666666666,0.014583333333333334,0.014583333333333334,0.0125,0.0125,0.014583333333333334],"rows":6},"tower_mini_10":{"profile":"cast","scale":0.8333333333333334,"scaleY":0.8333333333333334,"dy":[0.010416666666666666,0.014583333333333334,0.0125,0.0125,0.0125,0.0125],"rows":6},"tower_mini_11":{"profile":"charge","scale":0.8333333333333334,"scaleY":0.8333333333333334,"dy":[0.010416666666666666,0.014583333333333334,0.0125,0.014583333333333334,0.0125,0.014583333333333334],"rows":6},"tower_mini_12":{"profile":"heavy","scale":0.8333333333333334,"scaleY":0.8333333333333334,"dy":[0.010416666666666666,0.0020833333333333333,0.0020833333333333333,0.0020833333333333333,0.0020833333333333333,0.0020833333333333333],"rows":6},"tower_mini_13":{"profile":"flying","scale":0.8333333333333334,"scaleY":0.8333333333333334,"dy":[0.0125,0.0020833333333333333,0.0020833333333333333,0.004166666666666667,0.0020833333333333333,0.0020833333333333333],"rows":6},"tower_mini_14":{"profile":"cast","scale":0.8333333333333334,"scaleY":0.8333333333333334,"dy":[0.010416666666666666,0.0020833333333333333,0.0020833333333333333,0.0020833333333333333,0.004166666666666667,0.0020833333333333333],"rows":6},"tower_mini_15":{"profile":"sweep","scale":0.8333333333333334,"scaleY":0.8333333333333334,"dy":[0.010416666666666666,0.014583333333333334,0.014583333333333334,0.0125,0.014583333333333334,0.014583333333333334],"rows":6},"tower_mini_16":{"profile":"cast","scale":0.8333333333333334,"scaleY":0.8333333333333334,"dy":[0.010416666666666666,0.0125,0.014583333333333334,0.0125,0.014583333333333334,0.0125],"rows":6},"tower_mini_17":{"profile":"charge","scale":0.8333333333333334,"scaleY":0.8333333333333334,"dy":[0.010416666666666666,0.0125,0.014583333333333334,0.014583333333333334,0.014583333333333334,0.014583333333333334],"rows":6},"tower_mini_18":{"profile":"heavy","scale":0.8333333333333334,"scaleY":0.8333333333333334,"dy":[0.008333333333333333,0.010416666666666666,0.010416666666666666,0.010416666666666666,0.008333333333333333,0.010416666666666666],"rows":6},"tower_mini_19":{"profile":"cast","scale":0.8333333333333334,"scaleY":0.8333333333333334,"dy":[0.010416666666666666,0.0125,0.0125,0.0125,0.0125,0.0125],"rows":6},"tower_mini_20":{"profile":"charge","scale":0.8333333333333334,"scaleY":0.8333333333333334,"dy":[0.010416666666666666,0.0125,0.0125,0.0125,0.0125,0.0125],"rows":6},"tower_mini_21":{"profile":"sweep","scale":0.8333333333333334,"scaleY":0.8333333333333334,"dy":[0.010416666666666666,0.010416666666666666,0.0125,0.0125,0.0125,0.0125],"rows":6},"tower_mini_22":{"profile":"flying","scale":0.8333333333333334,"scaleY":0.8333333333333334,"dy":[0.008333333333333333,0.0125,0.0125,0.0125,0.0125,0.0125],"rows":6},"tower_mini_23":{"profile":"heavy","scale":0.8333333333333334,"scaleY":0.8333333333333334,"dy":[0.010416666666666666,0.0125,0.0125,0.0125,0.0125,0.0125],"rows":6},"tower_mini_24":{"profile":"sweep","scale":0.8333333333333334,"scaleY":0.8333333333333334,"dy":[0.010416666666666666,0.010416666666666666,0.0125,0.0125,0.0125,0.0125],"rows":6},"tower_mini_25":{"profile":"cast","scale":0.8333333333333334,"scaleY":0.8333333333333334,"dy":[0.010416666666666666,0.010416666666666666,0.0125,0.0125,0.0125,0.010416666666666666],"rows":6},"tower_mini_26":{"profile":"charge","scale":0.8333333333333334,"scaleY":0.8333333333333334,"dy":[0.00625,0.008333333333333333,0.00625,0.008333333333333333,0.008333333333333333,0.00625],"rows":6},"world-guardian":{"profile":"cast","scale":0.8338762214983714,"scaleY":0.8347826086956521,"dy":[0.0,0.0,0.0,0.0,0.0,0.0],"rows":6}};
const enemyMotionClips={"charge":[[0,0,0],[0.009,0.003,1.4],[0.014,0.006,3.2],[0,0,0],[-0.016,-0.003,-2.3],[-0.004,0,-0.5]],"sweep":[[0,0,0],[0.003,-0.004,1.2],[0.01,-0.01,3.4],[0,0,0],[-0.012,0.002,-2.7],[-0.003,0,-0.7]],"heavy":[[0,0,0],[0.003,0.004,0.9],[0.007,-0.009,2.2],[0,0,0],[-0.005,0.009,-1.7],[0,0.002,-0.35]],"cast":[[0,0,0],[0.003,-0.004,0.65],[0.007,-0.009,1.5],[0,0,0],[0.006,0.003,1.15],[0.002,0,0.28]],"flying":[[0,0,0],[0.003,-0.009,1],[0.009,-0.018,2.1],[0,0,0],[-0.006,0.008,-1.6],[0,0.003,-0.5]],"leap":[[0,0,0],[0.006,0.004,1.8],[0,0,0],[-0.005,-0.005,-1.5]]};

;
/* ./enemy-unity.js */
'use strict';
// The native combat camera serves the stage, dungeon, world boss and raid.
const enemyUnity=(()=>{
 // Select the backing store once. Keep the fixed 3 × 4 orthographic layout.
 const physical=(window.innerWidth||384)*Math.min(3,window.devicePixelRatio||1);
 const tile=physical>640?576:physical>400?512:384,slots=Array.from({length:5},()=>({actor:-1,serial:0,painted:0,time:0}));
 let columns=2,rows=3;
 let build=null,loading=false,ready=false,canvas,back,brush,version=0;
 const revisions=new Uint32Array(12);
 function invalidate(tile){
  version++;
  if(tile===undefined)revisions.fill(version);else revisions[tile]=version;
 }
 function configure(options){
  build=options;
  if(options.protocol===2){columns=3;rows=4;
   if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
   else start();
  }
 }
 // The browser player is optional. Only an explicit native test loads its activation script.
 function loadSelectedBuild(){
  const url=document.querySelector('meta[name="nebula-unity-build"]')?.getAttribute('content');
  if(!url)return;
  const script=document.createElement('script');
  script.src=url;script.onerror=failed;document.head.appendChild(script);
 }
 if(new URLSearchParams(location.search).get('renderer')==='unity'){
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',loadSelectedBuild,{once:true});
  else loadSelectedBuild();
 }
 // The existing Unity WebGL player decodes PNG in native code. Expand a shared WebP
 // only for its texture request, leaving the surrounding page's fetch pipeline alone.
 function bridgeEnemyPaint(module){
  const folder=new URL('./assets/enemy-motion/',location.href);
  for(const key of ['fetchWithProgress','cachedFetch']){
   const original=module[key];
   if(typeof original!=='function')continue;
   module[key]=async(url,init={})=>{
    const source=new URL(url,location.href);
    if(source.origin!==folder.origin||!source.pathname.startsWith(folder.pathname)||
       !/^[a-z0-9_-]+\.png$/.test(source.pathname.slice(folder.pathname.length)))
     return original.call(module,url,init);
    source.pathname=source.pathname.replace(/\.png$/,'.webp');
    const reply=await fetch(source,{signal:init.signal});
    let response=reply;
    if(reply.ok){
     const blob=await reply.blob(),objectUrl=URL.createObjectURL(blob);
     try{
      const image=new Image();image.src=objectUrl;await image.decode();
      const surface=document.createElement('canvas');surface.width=image.naturalWidth;surface.height=image.naturalHeight;
      surface.getContext('2d').drawImage(image,0,0);
      const png=await new Promise((resolve,reject)=>surface.toBlob(data=>data?resolve(data):reject(Error('Texture decode failed')),'image/png'));
      response=new Response(png,{headers:{'Content-Type':'image/png','Content-Length':String(png.size)}});
     }finally{URL.revokeObjectURL(objectUrl)}
    }
    return module.readBodyWithProgress(response,init.onProgress||(()=>{}),init.enableStreamingDownload);
   };
  }
 }
 function start(){
  if(!build||loading||typeof HTMLCanvasElement==='undefined'||typeof WebGL2RenderingContext==='undefined')return;
  loading=true;
  // Skip downloading and starting the player when this browser cannot create its context.
  const probe=document.createElement('canvas'),test=probe.getContext('webgl2');
  if(!test)return;
  test.getExtension?.('WEBGL_lose_context')?.loseContext();
  canvas=document.createElement('canvas');canvas.id='nebula-unity-combat';canvas.width=tile*columns;canvas.height=tile*rows;
  canvas.style.cssText='position:fixed;left:-10000px;top:0;'+'width:'+canvas.width+'px;height:'+canvas.height+'px;pointer-events:none';
  canvas.tabIndex=-1;canvas.setAttribute('aria-hidden','true');document.body.appendChild(canvas);
  back=document.createElement('canvas');back.width=canvas.width;back.height=canvas.height;brush=back.getContext('2d');
  canvas.addEventListener('webglcontextlost',failed,{once:true});
  const loader=document.createElement('script');loader.src=build.loader;
  loader.onload=()=>createUnityInstance(canvas,{...build.config,preRun:[...(build.config?.preRun||[]),bridgeEnemyPaint],devicePixelRatio:1,matchWebGLToCanvasSize:false,
    webglContextAttributes:{alpha:true,premultipliedAlpha:true,preserveDrawingBuffer:true}})
    .then(()=>{ready=true;invalidate()}).catch(failed);
  loader.onerror=failed;document.head.appendChild(loader);
 }
 function failed(reason){console.warn('Unity combat renderer unavailable:',reason?.message||reason?.type||String(reason));ready=false;invalidate();canvas?.remove();canvas=null}
 function draw(id,actor,pose,ctx,x,y,w,h){
  if(!build)return false;
  if(!loading)start();
  if(!ready||!canvas||id<0||id>=slots.length)return false;
  const s=slots[id];s.time=performance.now();
  if(s.actor!==actor||s.phase!==pose.phase||s.frame!==pose.frame||s.x!==pose.x||s.y!==pose.y||s.angle!==pose.angle){
   Object.assign(s,pose,{actor,serial:s.serial+1});
  }
  // Never show an older pose on a contact beat or a previous encounter identity.
  if(s.shownActor!==actor||s.shownFrame!==pose.frame||Math.abs(pose.angle-s.shownAngle)>.7)return false;
  const sh=tile*h/w,sx=id%columns*tile,sy=Math.floor(id/columns)*tile+(tile-sh)/2;
  ctx.drawImage(back,sx,sy,tile,sh,x,y,w,h);return true;
 }
 function read(id,field){
  const s=slots[id];
  if(performance.now()-s.time>300)return field===0?-1:0;
  switch(field){case 0:return s.actor;case 1:return s.frame||0;case 2:return s.x||0;case 3:return s.y||0;case 4:return s.angle||0;case 5:return s.serial;default:return s.phase||0}
 }
 function complete(id,actor,frame,angle,serial){
  if(!canvas||!brush)return;
  const s=slots[id];if(s.actor!==actor||s.serial!==serial||s.painted===serial)return;
  copyTile(id);
  Object.assign(s,{shownActor:actor,shownFrame:frame,shownAngle:angle,painted:serial});invalidate(id);
 }
 function copyTile(id){
  const x=id%columns*tile,y=Math.floor(id/columns)*tile;
  brush.clearRect(x,y,tile,tile);brush.drawImage(canvas,x,y,tile,tile,x,y,tile,tile);
 }
 function heroReady(){
  if(build?.protocol!==2)return false;
  if(!loading)start();
  return ready;
 }
 function revision(tile){return revisions[tile]}
 function copyHero(slot){copyTile(5+slot);invalidate(5+slot)}
 function blitEffect(index,ctx,x,y,size){
  const id=10+index;
  ctx.drawImage(canvas,id%columns*tile,Math.floor(id/columns)*tile,tile,tile,x,y,size,size);
 }
 function blitHero(slot,ctx,x,y,size){
  const id=5+slot;ctx.drawImage(back,id%columns*tile,Math.floor(id/columns)*tile,tile,tile,x,y,size,size);
 }
 // Keep the existing encounter clocks in milliseconds. Once the player is live,
 // display refresh advances presentation; native Update prepares its next camera pass.
 let nativeTickSeen=false;
 function requestFrame(cb){return requestAnimationFrame(cb)}
 function cancelFrame(id){cancelAnimationFrame(id)}
 function nativeFrame(){
  nativeTickSeen=true;
  window.NebulaHeroUnity?.prepare?.();
 }
 const bridge={requestFrame,cancelFrame,frame:nativeFrame,get engine(){return ready&&nativeTickSeen?(build?.engineVersion?'Unity '+build.engineVersion:'Unity'):'웹'},configure,draw,read,complete,heroReady,revision,copyHero,blitHero,blitEffect,get version(){return version}};
 if(typeof window!=='undefined')window.NebulaEnemyUnity=bridge;
 return bridge;
})();

;
/* ./unity-heroes.js */
'use strict';
// Commands use the same 512-pixel painting coordinates as the grip and muzzle.
// Unity renders the ordered body, equipment, bowstring, arrow and palm as separate sprites.
const unityHeroes=(()=>{
 const stride=12,max=24,images=[null],ids=new WeakMap(),requests=Array.from({length:5},()=>({serial:0,at:-Infinity}));
 // The fifth fighter keeps tile 9. Two unused full camera tiles (10 and 11) render effects.
 // Protocol 2 already accepts arbitrary SpriteRenderer crops, including impact artwork.
 const fifth={serial:0,at:-Infinity}, sheets=new Map(), waiting=new Map();
 let bundle=null,previousSignature='',packed=false;
 function imageId(image){
  let id=ids.get(image);
  if(!id){id=images.length;images.push(typeof WeakRef==='function'?new WeakRef(image):image);ids.set(image,id)}
  return id;
 }
 function recorder(){
  let x=0,y=0,a=0,points=[];
  const stack=[],rows=[],ink=[];
  function position(px,py){const c=Math.cos(a),s=Math.sin(a);return [x+px*c-py*s,y+px*s+py*c]}
  return {
   rows,ink,nativeCommands:true,
   poseBounds(l,t,w,h){ink[rows.length/stride]=[...position(l+w/2,t+h/2),w,h]},strokeStyle:'',lineWidth:1,globalAlpha:1,
   save(){stack.push([x,y,a,this.strokeStyle,this.lineWidth,this.globalAlpha])},
   restore(){[x,y,a,this.strokeStyle,this.lineWidth,this.globalAlpha]=stack.pop()},
   translate(dx,dy){[x,y]=position(dx,dy)},rotate(angle){a+=angle},
   beginPath(){points=[]},moveTo(px,py){points=[position(px,py)]},lineTo(px,py){points.push(position(px,py))},
   stroke(){
    const rgb=this.strokeStyle==='#c4bc9d'?0xc4bc9d:this.strokeStyle==='#e4daaf'?0xe4daaf:0xe6d6b3;
    for(let i=1;i<points.length;i++){const [u,v]=points[i-1],[w,h]=points[i];
     rows.push(-1,0,0,1,1,(u+w)/2,(v+h)/2,Math.atan2(h-v,w-u),Math.hypot(w-u,h-v),this.lineWidth,rgb,this.strokeStyle.startsWith('rgba')?.88:1);
    }
   },
   drawImage(img,...p){
    let sx=0,sy=0,sw=img.naturalWidth,sh=img.naturalHeight;
    if(p.length===8)[sx,sy,sw,sh]=p.splice(0,4);
    const [dx,dy,dw=sw,dh=sh]=p,[cx,cy]=position(dx+dw/2,dy+dh/2);
    rows.push(imageId(img),sx,sy,sw,sh,cx,cy,a,dw,dh,0xffffff,this.globalAlpha);
   }
  };
 }
 // Frame the submitted artwork in actor space. Copying back at the same origin
 // preserves contact points even as a polearm travels outside the body square.
 function cameraFrame(rows,pad,hasRig,ink=[]){
  if(!hasRig||!rows.length)return [-pad,-pad,512+2*pad];
  let left=Infinity,top=Infinity,right=-Infinity,bottom=-Infinity;
  for(let k=0;k<rows.length;k+=stride){
   const c=Math.abs(Math.cos(rows[k+7])),s=Math.abs(Math.sin(rows[k+7]));
   const [x,y,w,h]=ink[k/stride]||[rows[k+5],rows[k+6],rows[k+8],rows[k+9]];
   const rx=(c*w+s*h)*.5,ry=(s*w+c*h)*.5;
   left=Math.min(left,x-rx);right=Math.max(right,x+rx);
   top=Math.min(top,y-ry);bottom=Math.max(bottom,y+ry);
  }
  const size=Math.max(64,Math.ceil((Math.max(right-left,bottom-top)+12)/16)*16);
  const x=Math.floor((left+right-size)*.5),y=Math.floor((top+bottom-size)*.5);
  for(let k=0;k<rows.length;k+=stride){
   rows[k+5]+=256-x-size*.5;rows[k+6]+=256-y-size*.5;
  }
  return [x,y,size];
 }
 function draw(slot,ctx,img,rig,key,pose,time,hits,ranged,weapon,paint,action=null,secondary=null){
  if(!window.NebulaEnemyUnity?.heroReady())return paint(ctx,img,rig,key,pose,time,hits,ranged,weapon,action,secondary);
  const r=slot===4&&packed?fifth:requests[slot],t=performance.now(),commands=recorder(),muzzle=paint(commands,img,rig,key,pose,time,hits,ranged,weapon,action,secondary);
  if(commands.rows.length>max*stride)return paint(ctx,img,rig,key,pose,time,hits,ranged,weapon,action,secondary);
  const pad=weaponFramePadding(key.split('-')[0]),rect=cameraFrame(commands.rows,pad,rig.body,commands.ink),span=rect[2];
  const track=[key,weapon?.skin??'',action?.id??-1,action?.walk?'walk':time===null?'idle':'attack'].join('|');
  // Seeking backwards, restarting the same attack, or equipping another look starts a new sequence.
  if(r.track!==track||(Number.isFinite(time)&&Number.isFinite(r.time)&&time<r.time)){
   r.generation=(r.generation||0)+1;r.track=track;
  }
  r.time=time;
  const changed=(r.rect&&(r.rect[0]!==rect[0]||r.rect[1]!==rect[1]||r.rect[2]!==span))||r.generation!==r.submittedGeneration||!r.rows||r.rows.length!==commands.rows.length||commands.rows.some((v,i)=>v!==r.rows[i]);
  if(changed){r.rows=commands.rows;r.serial++;r.submittedGeneration=r.generation;r.span=span;r.rect=rect;r.muzzle=muzzle}
  r.at=t;
  // Hold a consistent one-render pipeline through cel boundaries. Its registered
  // muzzle, body and palm all belong to the same acknowledged camera exposure.
  const available=r.shown===r.generation&&(r.painted===r.serial||
   (r.painted===r.serial-1&&r.painted>=(r.displayed||0)&&t-r.paintedAt<36));
  if(available){
   r.displayed=r.painted;
   window.NebulaEnemyUnity.blitHero(slot,ctx,...r.shownRect);
   return r.shownMuzzle;
  }
  r.displayed=r.serial;
  return paint(ctx,img,rig,key,pose,time,hits,ranged,weapon,action,secondary);
 }
 // A flat projectile uses the same SpriteRenderer camera windows as a flipbook.
 // Preserve its rectangular crop and ink aspect, including long, narrow arrow tips.
 function scheduleCel(image,frame,whole=false){
  if(!packed){
   Object.assign(fifth,requests[4],{shown:null,painted:0,paintedAt:-Infinity});packed=true;
  }
  const key=imageId(image),cell=whole?Math.max(image.naturalWidth,image.naturalHeight):image.naturalWidth/4;
  let sheet=sheets.get(key);
  if(!sheet){
   if(sheets.size>=8){
    const oldest=sheets.keys().next().value;
    // During a busy raid the source texture remains available; avoid reallocating
    // large canvases every frame while all eight native caches are being used.
    if(performance.now()-sheets.get(oldest).at<350)return null;
    for(const [tag,job] of waiting)if(job.key===oldest)waiting.delete(tag);
    sheets.delete(oldest);
   }
   const canvas=document.createElement('canvas');canvas.width=whole?image.naturalWidth:cell*4;canvas.height=whole?image.naturalHeight:cell*4;
   sheet={image,canvas,brush:canvas.getContext('2d'),frames:new Set(),at:0};
   if(!sheet.brush)return null;
  }else sheets.delete(key);
  sheets.set(key,sheet);
  sheet.at=performance.now();
  for(let j=frame;j<=(whole?0:Math.min(15,frame+1));j++){
   const tag=key+':'+j;
   if(!sheet.frames.has(j)&&!waiting.has(tag))waiting.set(tag,{tag,key,frame:j,cell,sheet,whole});
  }
  return sheet.frames.has(frame)?sheet.canvas:null;
 }
 function prepare(){
  const native=window.NebulaEnemyUnity;
  if(!packed||!native?.heroReady())return;
  const now=performance.now(),hero=fifth.rows&&now-fifth.at<1500?fifth:null;
  for(const [tag,j] of waiting)if(now-j.sheet.at>500)waiting.delete(tag);
  for(const [key,sheet] of sheets)if(now-sheet.at>15000)sheets.delete(key);
  const jobs=Array.from(waiting.values()).slice(0,2);
  const signature=(hero?.serial||0)+'|'+jobs.map(j=>j.tag).join(',');
  if(signature===previousSignature){if(hero||jobs.length)requests[4].at=now;return}
  previousSignature=signature;
  const rows=[],span=512;
  if(hero){
   const scale=512/hero.span;
   for(let i=0;i<hero.rows.length;i+=stride){
    const r=hero.rows.slice(i,i+stride);
    r[5]=256+(r[5]-256)*scale;r[6]=256+(r[6]-256)*scale;
    r[8]*=scale;r[9]*=scale;rows.push(...r);
   }
  }
  // A fighter uses at most 21 layers. Defer extra windows if an outfit fills the tile.
  const batch=jobs.slice(0,Math.max(0,max-rows.length/stride));
  batch.forEach(({key,frame,cell,whole,sheet},i)=>{
   const w=whole?sheet.canvas.width:cell,h=whole?sheet.canvas.height:cell;
   rows.push(key,whole?0:frame%4*cell,whole?0:Math.floor(frame/4)*cell,w,h,768+512*i,256,0,512*w/cell,512*h/cell,0xffffff,1);
  });
  const r=requests[4];bundle={jobs:batch,heroId:hero?.generation,heroSerial:hero?.serial,heroMuzzle:hero?.muzzle,heroRect:hero?.rect};
  r.rows=rows.length?rows:null;r.serial++;r.at=now;r.span=span;
 }
 function complete(i,serial){
  const r=requests[i];if(r.serial!==serial||r.painted===serial)return;
  const native=window.NebulaEnemyUnity;
  native.copyHero(i);r.shown=r.generation;r.shownMuzzle=r.muzzle;r.shownRect=r.rect;r.painted=serial;r.paintedAt=performance.now();
  if(i===4&&packed&&bundle){
   if(bundle.heroSerial){fifth.shown=bundle.heroId;fifth.shownMuzzle=bundle.heroMuzzle;fifth.shownRect=bundle.heroRect;fifth.painted=bundle.heroSerial;fifth.paintedAt=r.paintedAt}
   bundle.jobs.forEach(({tag,frame,cell,sheet,whole},j)=>{
    const x=whole?(sheet.canvas.width-cell)/2:frame%4*cell,y=whole?(sheet.canvas.height-cell)/2:Math.floor(frame/4)*cell;
    native.blitEffect(j,sheet.brush,x,y,cell);
    sheet.frames.add(frame);waiting.delete(tag);
   });
  }
 }
 return {draw,cameraFrame,image:id=>images[id]?.deref?images[id].deref():images[id],requests,stride,max,complete,prepare,scheduleCel,scheduleSprite:image=>scheduleCel(image,0,true)};
})();
window.NebulaHeroUnity=unityHeroes;

;
