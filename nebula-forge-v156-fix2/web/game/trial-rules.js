'use strict';

const TRIAL_ENTRY_LIMIT=3,TRIAL_TIME=90;
const TRIAL_RUN_REWARD={starIron:10,stones:30};
const TRIAL_FIRST_GEMS=30;
const TRIAL_BASE_HP=MONSTER_DIFFICULTY*5000;
const TRIAL_BUFFS={
 attack:{label:'공격력 +25%',amount:.25},
 crit:{label:'치명타 확률 +15%p',amount:.15},
 critDamage:{label:'치명타 피해 +50%p',amount:.50},
 speed:{label:'공격속도 +20%',amount:.20},
 skillDamage:{label:'스킬 피해 +40%',amount:.40},
 cooldown:{label:'스킬 재사용 대기시간 -25%',amount:.25},
 time:{label:'남은 시간 +8초',amount:8},
 weakHp:{label:'다음 3개 층 보스 체력 -20%',amount:.20}
};
// Lifetime floor milestones. Each pays once when a ranked run has reached that floor.
const TRIAL_FLOOR_PRIZES=[
 [5,{gems:100,starIron:20}],[10,{gems:150,petTickets:1}],[15,{gems:200,starIron:40}],[20,{gems:250,petTickets:2}],
 [25,{gems:300,starIron:60}],[30,{gems:400,forgeGuards:1}],[35,{gems:400,petTickets:3}],[40,{gems:500,starIron:100}],
 [45,{gems:500,petTickets:3}],[50,{gems:600,forgeGuards:1}],[55,{gems:600,starIron:150}],[60,{gems:800,petTickets:5}],
 [65,{gems:800,starIron:200}],[70,{gems:1000,forgeGuards:2}]
];
function trialPeakFloors(state=s){return Math.max(0,Math.floor(Number(state?.trialPeak)||0))}
function trialFloorPaid(floor,state=s){return !!state.economyClaims?.paid?.['trialFloor/'+floor]}
function trialMod(key){
 const run=dungeonRun;
 if(run?.mode!=='trial')return 0;
 if(key==='weakness')return Math.min(5,currentWeapon()?.runes?.[run.weakness]||0)*.06;
 return (run.buffs?.[key]||0)*(TRIAL_BUFFS[key]?.amount||0);
}
function trialDayInfo(now=Date.now()){
 const day=koreaDayNumber(now);
 return {dayKey:attendanceDay(day),weekKey:attendanceDay(day-koreaWeekday(day)),weakness:['fire','frost','storm'][((day%3)+3)%3]};
}
function trialBuffOptions(dayKey,selection){
 // The same date and choice number shuffle the same set on every device.
 let seed=2166136261;
 for(const c of dayKey+'|'+selection)seed=Math.imul(seed^c.charCodeAt(0),16777619)>>>0;
 const keys=Object.keys(TRIAL_BUFFS);
 for(let i=keys.length-1;i>0;i--){
  seed=(Math.imul(seed,1664525)+1013904223)>>>0;
  const j=Math.floor(seed/4294967296*(i+1));
  [keys[i],keys[j]]=[keys[j],keys[i]];
 }
 return keys.slice(0,3);
}
function trialBossHp(n){return TRIAL_BASE_HP*Math.pow(1.3,n-1)}
function trialScore(run){
 const fraction=run.maxHp>0?1-run.hp/run.maxHp:0;
 return run.floors*1000+Math.max(0,Math.min(999,Math.floor(fraction*1000)));
}

const TRIAL_WEEKLY_PRIZES=[
 {place:1,gems:2000,guards:2,title:'탑의 정복자'},
 {place:2,gems:1500,guards:1},
 {place:3,gems:1200,guards:1},
 {percent:10,gems:800},{percent:30,gems:400},{percent:100,gems:150}
];
function trialWeeklyPrize(rank,participantCount){
 if(!Number.isSafeInteger(participantCount)||!Number.isSafeInteger(rank)||rank<1||rank>participantCount)
  throw Error('주간 순위 기록을 확인하세요.');
 const prize=TRIAL_WEEKLY_PRIZES.find(row=>row.place?rank<=row.place:rank<=Math.ceil(participantCount*row.percent/100));
 const rewards={gems:prize.gems};
 if(prize.guards)rewards.forgeGuards=prize.guards;
 return {rewards,title:prize.title||null};
}
function grantTrialWeeklyPrize(state,weekKey,rank,participantCount){
 const {rewards,title}=trialWeeklyPrize(rank,participantCount);
 creditEconomyGems(state,rewards.gems);
 if(rewards.forgeGuards)state.forgeGuards=(state.forgeGuards||0)+rewards.forgeGuards;
 if(title){state.titlesOwned||={};awardTitle('trial-conqueror',false,state)}
 return {state,result:{rewards,title,rank,weekKey}};
}
function applyTrialSettlement(state,command,now){
 const today=trialDayInfo(now),info=command.info;
 const {attempt,mode}=command;
 const rewards={};
 if(mode==='normal'){
  Object.assign(rewards,TRIAL_RUN_REWARD);
  if(command.first){rewards.gems=TRIAL_FIRST_GEMS;creditEconomyGems(state,TRIAL_FIRST_GEMS)}
  for(const [key,amount] of Object.entries(TRIAL_RUN_REWARD))state[key]=(state[key]||0)+amount;
 }
 if(command.ranked===true&&Number.isSafeInteger(command.floors))state.trialPeak=Math.max(trialPeakFloors(state),command.floors);
 if(state.day!==today.dayKey)resetDay();
 const previous=state.trial?.weekKey===today.weekKey?state.trial:{};
 state.trial={weekKey:today.weekKey,bestScore:Math.max(0,command.bestScore??previous.bestScore??0),
  bestFloors:Math.max(0,command.bestFloors??previous.bestFloors??0)};
 if(Number.isInteger(command.usedToday))state.daily.trialRuns=command.usedToday;
 else if(mode==='start'&&info.dayKey===today.dayKey)state.daily.trialRuns=attempt;
 return {state,result:{dayKey:info.dayKey,weekKey:info.weekKey,weakness:info.weakness,attempt,rewards,
  ranked:command.ranked===true,bestScore:state.trial.bestScore,bestFloors:state.trial.bestFloors}};
}
