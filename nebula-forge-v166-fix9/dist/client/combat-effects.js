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
