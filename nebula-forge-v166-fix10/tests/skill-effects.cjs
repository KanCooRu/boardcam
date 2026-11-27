const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {ctx,run}=require('./harness.cjs');
const frames=[],draws=[];
let now=0,reduced=false;
ctx.performance.now=()=>now;
ctx.matchMedia=()=>({matches:reduced});
ctx.requestAnimationFrame=cb=>{frames.push(cb);return frames.length};
const gradient={addColorStop(){}};
function node(){
 const context={translate(){},rotate(){},scale(){},save(){},restore(){},clearRect(){},fillRect(){},createRadialGradient:()=>gradient,
  drawImage(im,...args){draws.push({image:im.src,sourceX:args[0],sourceY:args[1],alpha:this.globalAlpha})}};
 return {hidden:false,isConnected:true,children:[],dataset:{},style:{},setAttribute(){},getContext:()=>context,
  appendChild(o){o.parentNode=this;this.children.push(o)}};
}
ctx.document.createElement=node;
ctx.host=node();ctx.anchor={};ctx.startCast=(id,ordinal=0)=>run(`combatEffects.emit(host,{id:${id},job:'archer',ordinal:${ordinal},echo:${ordinal>0},group:1,anchor,size:180,x:100,y:100,duration:600})`);
const all=run('SKILL_FILMS.map(([name])=>name)');
assert.equal(new Set(all).size,60);
// Every skill keeps its 16-cel sheets (read by the optional Unity renderer) and has the smoother 36-cel film.
for(const name of all)for(const extension of ['.avif','.webp','.s36.avif','.s36.webp'])assert(fs.statSync(path.join(__dirname,'../dist/client/assets/skill-casts',name+extension)).size>1000);
assert(run('SKILL_FILMS.every(f=>f[5]===36)'));
run('s.effects=true;s.powerSaving=false;document.hidden=false;');
for(let id=0;id<60;id++){
 run(`Object.assign(combatEffects.load(${id}),{naturalWidth:1280,naturalHeight:1280,complete:true})`);
 ctx.startCast(id);const count=ctx.host.children.length;ctx.startCast(id,1);assert.equal(ctx.host.children.length,count);
 now+=93;draws.length=0;frames.shift()(now);
 assert(draws.length>=2&&draws.every(d=>d.image.split('?')[0].endsWith('/'+all[id]+'.s36.avif')),all[id]);
 assert(draws.some(d=>d.alpha>0&&d.alpha<1));
 run('combatEffects.clear(host)');now+=700;frames.shift()?.(now);
}
reduced=true;draws.length=0;run('Object.assign(combatEffects.load(18),{naturalWidth:1280,naturalHeight:1280,complete:true})');ctx.startCast(18);const still=d=>Math.abs(d.sourceX-1280/6*4)<.01&&Math.abs(d.sourceY-1280/6*2)<.01;assert(draws.some(still));
now+=100;frames.shift()(now);assert(draws.every(still));
run('combatEffects.clear(host);s.effects=false');ctx.startCast(18);assert.equal(run('combatEffects.counts(host).playing'),0);
console.log('PASS all 60 registered skills retain their art across follow-through, blend adjacent frames, and honor reduced and disabled effects');

const compat=run(`(()=>{const im=combatEffects.load(6);im.onerror();return [im.src,im.onerror]})()`);
assert.match(compat[0],/dark-brand\.s36\.webp/);
assert.equal(compat[1],null);

const field=node(),oldGet=ctx.document.getElementById;
ctx.document.getElementById=id=>id==='classFx'?field:oldGet(id);
function frame(ms){now+=ms;frames.splice(0).forEach(cb=>cb(now))}
function fieldCast(echo=false,feet=false){
 run(`combatEffects.emit($('classFx'),{id:18,job:'archer',group:5,anchor:foeNode(0),follow:foeNode(0),
  echo:${echo},ordinal:${echo?1:0},feet:${feet},x:100,y:100,size:120,duration:600})`);
}
const playing=()=>run("combatEffects.counts($('classFx')).playing");
reduced=false;run("s.effects=true;view='';activeScreen='home';foeNode(0).dataset.wave='boss'");
for(const mode of ['trial','rush']){
 run(`dungeonRun={mode:'${mode}',n:1,bosses:0}`);
 fieldCast();fieldCast(true);frame(80);assert.equal(playing(),1);
 run('dungeonRun.n++;dungeonRun.bosses++');frame(16);
 assert.equal(playing(),0,'old spell on next '+mode+' boss');
 fieldCast(false,true);run('dungeonRun.n++;dungeonRun.bosses++');
 fieldCast(true,true);frame(16);assert.equal(playing(),1,'new boss receives its own echo');
 run("view='settings'");frame(16);assert.equal(playing(),0);
 run("view=''");
}
run("dungeonRun=null;ensureEncounter();foeNode(0).dataset.wave='1'");
fieldCast();run('tacticsState().encounter=null;ensureEncounter()');frame(16);assert.equal(playing(),0);
console.log('PASS field spells keep legitimate multi-hits and stop on wave, boss or screen replacement');
