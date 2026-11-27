'use strict';
const mineScene=(()=>{
 let field=null,canvas=null,ctx=null,chips=null,frame=0,animation=null,last=0,particles=[],strikeTimer=null;
 let confirmRun=null,shownHits=0;
 const target=[.635,.54],dustColor=['205,181,207','176,157,145'];
 function focused(){return !!s?.mineRun&&activeScreen==='dungeon'&&screenTab==='mine'}
 function cleanup(){
  cancelAnimationFrame(frame);clearTimeout(strikeTimer);animation?.cancel();frame=0;animation=null;strikeTimer=null;last=0;particles=[];field=canvas=ctx=null;
 }
 function render(){
  const r=s.mineRun,active=!!r,done=active&&Date.now()>=r.end;
  const heading=active?'<button class="mine-leave" onclick="mineScene.askExit()">포기</button>':'';
  return (active?'':backContent())+'<section id="mineView" class="mine-room '+(active?'mining':'')+'"><header><div><h2>별의 광산</h2><b id="mineClock">'+(r?Math.max(0,Math.ceil((r.end-Date.now())/1000))+'초':'60초 채굴')+'</b></div>'+heading+'</header>'+
   '<button id="mineField" class="mine-field" aria-label="별빛 광맥 채굴" onclick="mineHit()" '+(!active||done?'disabled':'')+'><canvas aria-hidden="true"></canvas><img class="mine-pick" src="./assets/star-mine/pick.webp" alt="" draggable="false"></button>'+
   '<div class="mine-foot"><p id="mineScore">'+(active?num(r.hits)+'회 타격 · 예상 성운석 '+num(mineReward()):'광맥을 누르면 채굴량이 늘어납니다.')+'</p>'+
   (active?'<button id="mineClaim" class="gold-button" onclick="claimMine()" '+(done?'':'hidden disabled')+'>채굴 보상 받기</button>':entrySummary('mine')+button(entryButton('mine','채굴 시작'),'startMine()',!!dungeonRun||!entryAvailability('mine').can))+'</div></section>';
 }
 function prepare(){
  const node=$('mineField');if(!node||!node.isConnected)return false;
  if(node!==field){cleanup();field=node;canvas=node.querySelector('canvas');ctx=canvas.getContext('2d');if(!chips){chips=new Image();chips.src='./assets/star-mine/chips.webp'}}
  const w=node.clientWidth,h=node.clientHeight;if(!w||!h)return false;
  // On tall phones the cover-scaled vein is much wider than the screen: slide it so the glowing seam stays in view.
  const scale=Math.max(w/1008,h/756),W=1008*scale,H=756*scale,px=W>w+1?Math.min(1,Math.max(0,(target[0]*W-.62*w)/(W-w))):.46;
  node.style.backgroundPosition=(px*100).toFixed(2)+'% 50%';
  const x=target[0]*W-(W-w)*px,y=target[1]*H-(H-h)*.5;
  const size=Math.min(w*.46,h*.56,226);
  field.style.setProperty('--mine-tool',size+'px');field.style.setProperty('--mine-left',(x-.988*size)+'px');field.style.setProperty('--mine-top',(y-.40*size)+'px');
  const d=Math.min(1.5,devicePixelRatio||1);
  if(canvas.width!==Math.round(w*d)||canvas.height!==Math.round(h*d)){
   canvas.width=Math.round(w*d);canvas.height=Math.round(h*d);ctx?.setTransform(d,0,0,d,0,0);
  }
  return {x,y,w,h};
 }
 function paint(now){
  frame=0;if(!ctx||!field?.isConnected||document.hidden||!focused()){cleanup();return}
  const dt=Math.min(.04,(now-last)/1000);last=now;ctx.clearRect(0,0,field.clientWidth,field.clientHeight);
  particles=particles.filter(p=>p.age<p.life);
  for(const p of particles){
   p.age+=dt;p.vy+=p.gravity*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.a+=p.spin*dt;
   const opacity=Math.max(0,1-p.age/p.life);ctx.save();ctx.globalAlpha=opacity;
   if(p.dust){
    const radius=p.size*(1+p.age*2),grad=ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,radius);
    grad.addColorStop(0,'rgba('+p.color+',.46)');grad.addColorStop(1,'rgba('+p.color+',0)');ctx.fillStyle=grad;ctx.fillRect(p.x-radius,p.y-radius,2*radius,2*radius);
   }else if(chips.naturalWidth){ctx.translate(p.x,p.y);ctx.rotate(p.a);ctx.drawImage(chips,p.index*32,0,32,32,-p.size/2,-p.size/2,p.size,p.size)}
   ctx.restore();
  }
  if(particles.length)frame=requestAnimationFrame(paint);
 }
 function impact(point,auto,run){
  if(!field?.isConnected||s.mineRun!==run||!focused()||document.hidden)return;
  shownHits=run.hits;updateMineDOM();enemySound.play('stone','impact');
  if(!ctx||!motionAllowed())return;
  const n=auto?9:15;particles=particles.slice(-(55-n));
  for(let i=0;i<n;i++){
   const dust=i%3===0,angle=(.87+Math.random()*1.1)*Math.PI,speed=(dust?25:58)+Math.random()*(dust?40:96);
   particles.push({x:point.x+(Math.random()-.5)*7,y:point.y,age:0,life:(dust?.46:.30)+Math.random()*.36,dust,
    vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,gravity:dust?12:430,index:i%8,
    size:dust?7+Math.random()*8:5+Math.random()*9,a:Math.random()*5,spin:dust?0:Math.random()*14-7,color:dustColor[i%2]});
  }
  if(!frame){last=performance.now();frame=requestAnimationFrame(paint)}
 }
 function strike(auto=false){
  if(!focused()||document.hidden||view)return;
  const r=s.mineRun;
  if(auto&&r.last&&Date.now()-r.last<240)return;
  const point=prepare();if(!point)return;
  if(!motionAllowed()||!field.animate){impact(point,auto,r);return}
  const tool=field.querySelector('.mine-pick');animation?.cancel();clearTimeout(strikeTimer);
  const duration=auto?450:285,hit=auto?.40:.25;
  animation=tool.animate([{transform:'rotate(-25deg)'},{offset:hit,transform:'rotate(0deg)'},{offset:hit+.10,transform:'rotate(1.6deg)'},{transform:'rotate(-25deg)'}],{duration,easing:'linear'});
  strikeTimer=setTimeout(()=>{strikeTimer=null;impact(point,auto,r)},duration*hit);
 }
 function refresh(){
  const r=s.mineRun;if(!r)return;const now=Date.now(),clock=$('mineClock'),score=$('mineScore'),claim=$('mineClaim'),target=$('mineField');
  if(clock)clock.textContent=Math.max(0,Math.ceil((r.end-now)/1000))+'초';
  if(score&&(strikeTimer===null||shownHits===r.hits||now>=r.end))score.textContent=num(r.hits)+'회 타격 · 예상 성운석 '+num(mineReward());
  if(claim){claim.hidden=now<r.end;claim.disabled=now<r.end}if(target)target.disabled=now>=r.end;
 }
 function askExit(){if(!focused())return;if(Date.now()>=s.mineRun.end){claimMine();return}confirmRun=s.mineRun;openMenu('mineExit')}
 function abandon(){if(view!=='mineExit'||s.mineRun!==confirmRun||!confirmRun)return;dismissPopup();if(Date.now()>=confirmRun.end){claimMine();return}confirmRun=null;cleanup();s.mineRun=null;save();paint();renderScreen()}
 document.addEventListener('visibilitychange',()=>{if(document.hidden)cleanup()});
 return {render,strike,refresh,focused,cleanup,askExit,abandon};
})();
EXTRA_POPUPS.mineExit=['채굴 포기',()=>'<p>포기하면 이번 채굴 보상을 잃습니다.</p><div class="action-row">'+button('계속 채굴','closeMenu()',false,true)+button('포기','mineScene.abandon()')+'</div>'];

