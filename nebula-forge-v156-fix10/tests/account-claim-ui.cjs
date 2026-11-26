'use strict';
const assert=require('node:assert/strict');
const {run,ctx}=require('./harness.cjs');
const requests=[],notices=[];
ctx.sendClaim=(action,body)=>new Promise(resolve=>requests.push({action,source:body.source,id:body.id,resolve}));
ctx.captureReward=(items,title)=>{if(Object.keys(items).length)notices.push({items:{...items},title})};
run(`saveGuard.usesServer=()=>true;saveGuard.command=sendClaim;rewardNotice=captureReward;
 s.maxStage=100;s.kills=10;s.attendance=7;s.unlocked['6_1']=true;s.campaignCompleted=true;s.nightmareTour={step:10,rounds:2};
 function claimWallet(){return JSON.stringify([s.gems,s.achievements,s.discoveryClaimed,s.eventClaims,s.nightmareTour,s.mailbox])}`);

async function main(){
 for(const [handler,source,id] of [
  ['claimCollection(6)','collection','6'],['claimAchievement(0)','achievement','0'],
  ['claimNewbie(6)','newbie','6'],['claimNightmareTour()','nightmare','3'],
  ["claimMailById('welcome')",'mail','welcome']
 ]){
  const before=run('claimWallet()'),pending=run(handler);
  assert.equal(run('claimWallet()'),before,handler+' awaiting response');
  const request=requests.shift();
  assert.deepEqual([request.action,request.source,request.id],['claim',source,id]);
  request.resolve(null);assert.equal(await pending,null);
  assert.equal(run('claimWallet()'),before,handler+' rejected request');
 }
 assert.equal(notices.length,0);
 // Additional mail covers mixed results and several currencies in a single bulk claim.
 run(`for(const id of ['bonus-a','bonus-b']){MAIL_DEFINITIONS.push({id,rewards:{gold:3}});s.mailbox[id]={read:false,claimed:false,archived:false}}`);
 const first=run('claimAllMail()'),duplicate=run('claimAllMail()');
 assert.equal(first,duplicate);
 const pending=new Map(requests.splice(0).map(req=>[req.id,req]));
 assert.equal(pending.size,4);
 pending.get('rebalance-157').resolve(null);
 pending.get('welcome').resolve({rewards:{gems:300,ore:30}});
 pending.get('bonus-a').resolve(null);
 assert.equal(notices.length,0);
 pending.get('bonus-b').resolve({rewards:{gems:6,gold:10}});
 assert.equal(await first,2);
 assert.deepEqual(notices,[{items:{gems:306,ore:30,gold:10},title:'우편 2건 보상 수령'}]);
 assert.equal(run('pendingMailBatch'),null);
 console.log('PASS five authoritative claim entries, rejected responses, quiet mail, partial bulk receipts and duplicate clicks');
}
main().catch(error=>{console.error(error);process.exitCode=1});
