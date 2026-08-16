'use strict';
const cv=$('cv'),ctx=cv.getContext('2d');let W=0,H=0,DPR=1;
function resize(){DPR=Math.min(2,devicePixelRatio||1);W=innerWidth;H=innerHeight;cv.width=W*DPR;cv.height=H*DPR;ctx.setTransform(DPR,0,0,DPR,0,0);}
addEventListener('resize',resize);resize();
let actx=null,muted=false,lastPick=0;
function initAudio(){try{if(!actx)actx=new(window.AudioContext||window.webkitAudioContext)();if(actx.state==='suspended')actx.resume();}catch(e){}}
function beep(f0,f1,dur,type,vol,delay){if(!actx||muted)return;const t0=actx.currentTime+(delay||0);const o=actx.createOscillator(),g=actx.createGain();o.type=type||'sine';o.frequency.setValueAtTime(f0,t0);o.frequency.exponentialRampToValueAtTime(Math.max(1,f1),t0+dur);g.gain.setValueAtTime(vol||.1,t0);g.gain.exponentialRampToValueAtTime(.0001,t0+dur);o.connect(g).connect(actx.destination);o.start(t0);o.stop(t0+dur+.03);}
function sfx(k){const M={pickup:[700,1250,.08,'sine',.05],hurt:[220,85,.2,'square',.12],zap:[950,180,.12,'sawtooth',.06],boom:[170,38,.3,'sine',.2],heal:[420,840,.2,'sine',.08],choose:[520,760,.09,'triangle',.1],boss:[130,55,.5,'sawtooth',.2],coin:[1100,1600,.09,'triangle',.06],buy:[600,900,.12,'triangle',.1],craft:[440,880,.2,'triangle',.12],pet:[660,990,.15,'triangle',.1],chest:[880,1320,.18,'triangle',.1],time:[1200,300,.4,'sine',.12],level:[523,880,.2,'triangle',.1]}[k];if(M)beep(M[0],M[1],M[2],M[3],M[4]);}
function jingle(){[[392,0],[494,.12],[587,.24],[784,.36]].forEach(s=>beep(s[0],s[0],.14,'triangle',.1,s[1]));}
function sting(){beep(196,196,.14,'sawtooth',.1);beep(262,262,.18,'sawtooth',.1,.12);}
function roar(){beep(98,49,.6,'sawtooth',.2);beep(147,73,.5,'square',.14,.1);}
const AMBIENT=[[110,131,147,165,196],[98,110,123,147,165],[123,147,165,185,220],[82,98,110,123,147]];
function ambient(i){if(muted||!actx||!G.settings.amb)return;const sc=AMBIENT[i]||AMBIENT[0];const n=sc[Math.random()*sc.length|0];beep(n,n,1,'sine',.03);beep(n*1.5,n*1.5,1,'sine',.018);}
let sndT=0;function hitSfx(e){if(muted||!actx)return;const n=performance.now();if(n-sndT<60)return;sndT=n;const f={'*':520,'^':700,'z':880,'†':300,'✦':620,'»':440,'≈':360,'@':560}[e]||500;beep(f,f*.8,.05,'square',.04);}
let state='menu',G=null,uidN=1,menuDiff=1,menuVow='';
const keys={},mouse={x:0,y:0,down:false};
const ACTS=[{name:'ПУСТОШЬ',floor:['.',',']},{name:'КАТАКОМБЫ',floor:[';',':']},{name:'ПЕПЕЛЬНЫЕ ПОЛЯ',floor:['*','+']},{name:'БЕЗДНА',floor:['~','^']}];
const MUTATORS=[{id:'glass',name:'Стеклянный герой'},{id:'swift_foe',name:'Быстрые враги'},{id:'tank_foe',name:'Толстые враги'},{id:'hoard',name:'Стартовый артефакт'},{id:'storm_start',name:'Штормовой старт'}];
function dayKey(){const d=new Date();return d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate();}
function dailyCfg(){const k=dayKey();let h=0;for(const c of k)h=(h*31+c.charCodeAt(0))>>>0;return{cls:CLASS_ORDER[h%4],vow:['','fury','greed','swift','stone'][(h>>2)%5],diff:1+((h>>4)%2),mut:MUTATORS[(h>>6)%MUTATORS.length]};}
function loadSet(){try{return Object.assign({shake:true,dmg:true,color:false,amb:true,pointers:true},JSON.parse(localStorage.getItem('ms_set')||'{}'));}catch(e){return{shake:true,dmg:true,color:false,amb:true,pointers:true};}}
function saveSet(){try{localStorage.setItem('ms_set',JSON.stringify(G.settings));}catch(e){}}
function applyVowStats(){const s=G.stats,v=G.vow;
 if(v==='fury'){s.dmg*=1.3;s.gold*=1.2;}if(v==='greed'){s.gold*=1.5;s.xp*=1.5;}
 if(v==='swift'){s.spdMul*=1.2;s.cdr=Math.max(.4,s.cdr*.85);s.dmg*=.85;}
 if(v==='stone'){s.armor+=1;s.dmg*=.8;s.gold*=.8;}}
const ACH=[{id:'kill100',name:'Кровавая сотня',desc:'100 убийств',test:r=>r.k>=100},{id:'win1',name:'Выживший',desc:'победа',test:r=>r.won},{id:'chaoswin',name:'Хаос-выживший',desc:'победа на хаосе',test:r=>r.won&&r.diff===2},{id:'tier2',name:'Восхождение',desc:'эволюция II тира',test:r=>r.t2},{id:'rich',name:'Богач',desc:'$800',test:r=>r.gold>=800},{id:'allclass',name:'Все школы',desc:'все классы',test:(r,m)=>Object.keys(m.classes).length>=4},{id:'boss4',name:'Цареубийца',desc:'4 босса',test:r=>r.bosses>=4},{id:'craft3',name:'Кузнец',desc:'3 сборки',test:r=>r.crafts>=3},{id:'jumper',name:'Гиперстранник',desc:'3 гиперпрыжка',test:r=>(r.jumps||0)>=3}];
function loadMeta(){try{return JSON.parse(localStorage.getItem('ms_meta')||'null')||{runs:0,wins:0,kills:0,time:0,classes:{},ach:{}};}catch(e){return{runs:0,wins:0,kills:0,time:0,classes:{},ach:{}};}}
function saveMeta(m){try{localStorage.setItem('ms_meta',JSON.stringify(m));}catch(e){}}
function recordRun(won){try{const key='ms_best_'+(G.diffMode===2?'chaos':'norm');
 const b=JSON.parse(localStorage.getItem(key)||'{"t":0,"k":0,"l":0,"w":0,"vow":""}');
 if(G.t>b.t){b.t=G.t;b.vow=G.vow||'';}b.k=Math.max(b.k,G.kills);b.l=Math.max(b.l,G.player.level);if(won)b.w++;
 localStorage.setItem(key,JSON.stringify(b));
 if(G.daily){const d=JSON.parse(localStorage.getItem('ms_best_daily')||'{"t":0,"k":0}');if(G.t>d.t){d.t=G.t;d.k=G.kills;}localStorage.setItem('ms_best_daily',JSON.stringify(d));}
 const m=loadMeta();m.runs++;if(won)m.wins++;m.kills+=G.kills;m.time+=G.t;m.classes[G.key]=1;
 const run={k:G.kills,won,diff:G.diffMode,gold:G.gold,bosses:G.runBosses,crafts:G.runCrafts,t2:G.runT2,jumps:G.jumps||0};
 const newly=[];for(const a of ACH)if(!m.ach[a.id]&&a.test(run,m)){m.ach[a.id]=1;newly.push(a.name);}
 saveMeta(m);G.achNewly=newly;
  const entry={diff:G.diffMode,cls:G.key,vow:G.vow,daily:G.daily,stage:G.stage,mode:G.diffMode,t:Math.round(G.t),kills:G.kills,lv:G.player.level,cause:G.lastHit,snap:G.telemetry};
  try{const L=JSON.parse(localStorage.getItem('ms_log')||'[]');
   L.push(entry);
   while(L.length>20)L.shift();localStorage.setItem('ms_log',JSON.stringify(L));
   console.log('[telemetry]',entry);}catch(e){}
  try{fetch('/api/log',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(entry)}).catch(()=>{});}catch(e){}}
catch(e){}}
function startGame(key,test,daily){const C=CLASSES[key],P=BALANCE.player,E=BALANCE.enemies;
 let vowUse=menuVow,diffUse=menuDiff,dailyMut=null;
 if(daily){const c=dailyCfg();vowUse=c.vow;diffUse=c.diff;dailyMut=c.mut;}
 G={key,cls:C,t:0,kills:0,endless:!!test,gold:0,test:!!test,daily:!!daily,dailyMut:dailyMut?dailyMut.id:null,
  speedMul:1,diff:test?3:1,diffMode:diffUse,
  player:{x:WORLD/2,y:WORLD/2,r:13,hp:P.hp,maxhp:P.hp,level:1,xp:0,xpNext:P.xpNext||BALANCE.xp.start,ifr:0,face:0},
  stats:{dmg:1,cdr:1,area:1,spdMul:1,regen:0,xp:1,gold:1,armor:0,vamp:0,phoenix:0,crit:false,critN:0,stormgem:false,stormgemT:6,burnMult:1,skelBonus:0,chainBonus:0,projBonus:0,raysBonus:0,mirrorBonus:0,tentacles:false,tentaclesStrong:false,accelerator:false,genome:false,scythe:false,clockwork:false,electro:false},
  spells:{},passives:{},timers:{},pendLevel:0,choiceDelay:0,artifacts:[],combosAcquired:new Set(),pets:[],
  vampBudget:P.vampCapPerSec,hearts:[],killsSinceHeart:0,chests:[],chestT:50,shopOffers:[],
  enemies:[],bullets:[],ebullets:[],parts:[],texts:[],zones:[],beams:[],orbs:[],minions:[],
  spawnT:.5,waveT:BALANCE.waves.every,bossIdx:0,spawnCount:0,shake:0,hitFlash:0,
  ringAng:0,ringTick:0,skelTick:0,ringPos:[],auraTick:0,rayAng:0,rayTick:0,rayMode:null,rayN:0,rayRange:0,
  cycAng:0,cycTick:0,cycPos:[],mirrorAng:0,mirrorPos:[],clockT:20,
  merchantT:15,merchant:null,merchantCd:0,towerT:60,guardT:30,bossWarn:0,bossWarnIdx:-1,ambT:0,evT:25,ev:null,
  runBosses:0,runCrafts:0,runT2:0,achNewly:[],waveCount:0,vowSpdMul:1,
  actIntroT:0,lastAct:-1,noiseT:0,invertT:0,settings:loadSet(),
  stage:0,rewardOffers:[],mode:'play',shoot:null,pendingShooter:false,beamFx:0,prep:0,bossArena:null,synShown:new Set(),synCard:null,interT:0,jumps:0,boost:{rate:0,spread:0},shipShield:0,boosts:[],spiralT:0,
  htree:new Set(),sparks:0,hbuff:{rate:0,pierce:0,dmg:0,barrels:0,hull:0,magnet:1,healOnGlyph:0},treeOpts:[],readyEvoShown:new Set(),
  track:{dmg:0,crits:0,hearts:0,chests:0,gold:0,evos:0},log:[],milestones:{},telemetry:[],logT:0,lastHit:'',
  cam:{x:WORLD/2,y:WORLD/2},bossRef:null,
  dust:Array.from({length:70},()=>({x:rnd(0,WORLD),y:rnd(0,WORLD),r:rnd(.8,2),ph:rnd(0,TAU)})),
  deco:Array.from({length:6},(_,i)=>({x:rnd(200,WORLD-200),y:rnd(200,WORLD-200),r:rnd(90,190),s:rnd(.02,.07)*(i%2?1:-1)}))};
 G.spells[C.start]=1;
 G.vow=vowUse;G.vowHpMul=1;G.vowDmgMul=1;applyHbuff();
 if(G.vow==='fury')G.player.maxhp=Math.round(G.player.maxhp*.75);
 if(G.vow==='greed'){G.vowHpMul=1.2;G.vowDmgMul=1.1;}
 if(G.vow==='stone')G.player.maxhp=Math.round(G.player.maxhp*1.4);
 G.player.hp=G.player.maxhp;applyVowStats();
 if(dailyMut){if(dailyMut.id==='glass'){G.player.maxhp=Math.round(G.player.maxhp*.5);G.player.hp=G.player.maxhp;G.stats.dmg*=1.5;}
  if(dailyMut.id==='swift_foe'){G.vowSpdMul=1.3;G.stats.gold*=1.25;}
  if(dailyMut.id==='tank_foe'){G.vowHpMul*=1.4;G.stats.xp*=1.25;}
  if(dailyMut.id==='hoard'){const pool=ARTSHOP.filter(a=>!a.craftOnly);const a=pool[Math.random()*pool.length|0];G.artifacts.push(a.id);a.apply(G);recomputeStats();}
  if(dailyMut.id==='storm_start')G.spells['lightning']=1;}
 const p0=G.player;
 for(let i=0;i<E.startRing;i++){const a=i/E.startRing*TAU+rnd(-.15,.15),d=rnd(E.startDistMin,E.startDistMax);
  spawnEnemy(i%5===0?'runner':'blob',false,{x:clamp(p0.x+Math.cos(a)*d,20,WORLD-20),y:clamp(p0.y+Math.sin(a)*d,20,WORLD-20)});}
 $('menu').classList.add('hide');['overOv','winOv','pauseOv','choice','shopOv','rewardOv','testOv','introOv','achOv','simOv'].forEach(i=>$(i).classList.add('hide'));
 $('game').classList.remove('hide');$('testBtn').classList.toggle('hide',!G.test);
 $('hint').style.opacity=1;setTimeout(()=>{if(G)$('hint').style.opacity=0;},8000);
 refreshBuildUI();
 if(G.test){state='play';banner('¤ ТЕСТ: '+C.name.toUpperCase());}
 else{state='intro';startIntro();}}
function toMenu(){G=null;state='menu';$('game').classList.add('hide');['pauseOv','overOv','winOv','choice','shopOv','rewardOv','testOv','introOv','achOv','simOv'].forEach(i=>$(i).classList.add('hide'));$('menu').classList.remove('hide');}
const INTRO_LINES=['в мире, где свет погас,','остались лишь глифы...','','девять рун держат пустоту.','ты — последний, кто помнит их язык.','','@ — это ты.','выживи. собери руны. верни свет.'];
let introTimer=null;
function startIntro(){$('introOv').classList.remove('hide');const full=INTRO_LINES.join('\n');let i=0;$('introText').textContent='█';clearInterval(introTimer);
 introTimer=setInterval(()=>{i+=2;$('introText').textContent=full.slice(0,i)+'█';if(i>=full.length){clearInterval(introTimer);$('introText').textContent=full;}},28);jingle();}
function skipIntro(){clearInterval(introTimer);$('introOv').classList.add('hide');state='play';}
function recomputeStats(){const s=G.stats;
 s.dmg=1;s.cdr=1;s.area=1;s.spdMul=1;s.regen=0;s.xp=1;s.gold=1;s.armor=0;s.vamp=0;s.phoenix=0;s.crit=false;s.stormgem=false;s.burnMult=1;s.skelBonus=0;s.chainBonus=0;s.projBonus=0;s.raysBonus=0;s.mirrorBonus=0;s.tentacles=false;s.tentaclesStrong=false;s.accelerator=false;s.genome=false;s.scythe=false;s.clockwork=false;s.electro=false;
 for(const id in G.passives){if(PASSIVE_DEF[id].keep)continue;for(let i=0;i<G.passives[id];i++)PASSIVE_DEF[id].apply(G);}
 for(const id of G.artifacts){const a=ARTSHOP.find(x=>x.id===id);if(a&&!a.keep)a.apply(G);}
 applyVowStats();}
function gainXP(v){const p=G.player;p.xp+=v*G.stats.xp*(G.diffMode===2?BALANCE.chaos.reward:1)*(G.ev&&G.ev.type==='tide'?1.5:1);let lv=false;
 while(p.xp>=p.xpNext){p.xp-=p.xpNext;p.level++;G.pendLevel++;p.xpNext=Math.round(BALANCE.xp.base*Math.pow(p.level,BALANCE.xp.power)+BALANCE.xp.add);p.hp=Math.min(p.maxhp,p.hp+BALANCE.player.healOnLevel);sfx('level');fxRing(p.x,p.y,10,60,'#fff',.4);banner('⬆ УРОВЕНЬ '+p.level);if(BALANCE.pets.levels.includes(p.level)&&G.pets.length<BALANCE.pets.levels.length)spawnPet();lv=true;}
 if(lv)G.invertT=.45;}
function addGold(v){const gv=Math.round(v*G.stats.gold*(G.diffMode===2?BALANCE.chaos.reward:1)*(G.ev&&G.ev.type==='tide'?1.5:1));G.gold+=gv;if(G.track)G.track.gold+=gv;if(performance.now()-lastPick>120){sfx('coin');lastPick=performance.now();}}
function spawnPet(){const d=PET_DEF[G.key];G.pets.push({x:G.player.x+rnd(-30,30),y:G.player.y+rnd(-30,30),r:9,col:d.col,ranged:d.ranged,t:0,shootT:rnd(0,.5),bob:rnd(0,TAU),orb:rnd(0,TAU)});banner('¤ '+d.name.toUpperCase());sfx('pet');refreshBuildUI();}
function updatePets(dt){const p=G.player,PT=BALANCE.pets,dmg=PT.baseDmg+p.level*PT.perLevel;
 for(const pet of G.pets){pet.bob+=dt*6;pet.t-=dt;const tg=nearestEnemy(pet.x,pet.y);let dx=0,dy=0;
  if(tg){const d=Math.hypot(tg.x-pet.x,tg.y-pet.y)||1,a=Math.atan2(tg.y-pet.y,tg.x-pet.x);
   if(pet.ranged){const dir=d>240?1:d<150?-1:0;dx=Math.cos(a)*dir;dy=Math.sin(a)*dir;pet.shootT-=dt;
    if(pet.shootT<=0&&d<PT.shootRange){pet.shootT=PT.shootCd;G.bullets.push({x:pet.x,y:pet.y,vx:Math.cos(a)*380,vy:Math.sin(a)*380,r:4,kind:'pierce',dmg:dmg,pierce:0,life:.9,hit:new Set(),col:'#fff'});}}
   else{dx=Math.cos(a);dy=Math.sin(a);if(d<tg.r+pet.r+6&&pet.t<=0){pet.t=.5;dealDamage(tg,dmg);}}}
  else{pet.orb+=dt*1.6;const ox=p.x+Math.cos(pet.orb)*48,oy=p.y+Math.sin(pet.orb)*48;const dd=Math.hypot(ox-pet.x,oy-pet.y);if(dd>6){dx=(ox-pet.x)/dd;dy=(oy-pet.y)/dd;}}
  const sp=pet.ranged?PT.rangedSpeed:PT.meleeSpeed;pet.x=clamp(pet.x+dx*sp*dt,10,WORLD-10);pet.y=clamp(pet.y+dy*sp*dt,10,WORLD-10);}}
function openChoice(){if(state!=='play'||!G||G.pendLevel<=0)return;
 const act=Object.keys(SPELL_DEF).some(id=>!SPELL_DEF[id].combo&&(G.spells[id]||0)<SPELL_DEF[id].lv.length)||Object.keys(PASSIVE_DEF).some(id=>(G.passives[id]||0)<PASSIVE_DEF[id].max)||COMBOS.some(c=>(!c.cls||c.cls===G.key)&&!G.combosAcquired.has(c.id)&&comboConditionsMet(c));
 if(!act){G.player.hp=Math.min(G.player.maxhp,G.player.hp+G.player.maxhp*.2);G.pendLevel=0;sfx('heal');banner('✨ ВОССТАНОВЛЕНИЕ');return;}
 state='choice';$('ctitle').textContent='УРОВЕНЬ '+G.player.level+' — ВЫБОР МАГИИ';$('csub').textContent='свободный выбор · эволюции своему классу';
 const root=$('cards');root.innerHTML='';const bar=document.createElement('div');bar.className='choiceTabs';const pane=document.createElement('div');pane.className='choicePane';root.appendChild(bar);root.appendChild(pane);
 const sec=[];const my=COMBOS.filter(c=>!c.cls||c.cls===G.key);
 if(my.length)sec.push({l:'⭐ УЛЬТА',e:1,b:()=>buildEvoGrid(my)});
for(const k of CLASS_ORDER)sec.push({l:CLASSES[k].icon+' '+CLASSES[k].name,b:()=>buildSpellGrid(k)});
  sec.push({l:'~ СИНЕРГИИ',b:buildSynergyGrid});
  sec.push({l:'✦ ПАССИВКИ',b:buildPassiveGrid});
 const tabs=[];sec.forEach((s,i)=>{const b=document.createElement('button');b.className='ctab'+(s.e?' evoTab':'');b.textContent=s.l;b.onclick=()=>show(i);bar.appendChild(b);tabs.push(b);});
 function show(i){tabs.forEach((t,j)=>t.classList.toggle('active',i===j));pane.innerHTML='';pane.appendChild(sec[i].b());}
 let st=sec.findIndex(s=>s.e&&my.some(c=>comboConditionsMet(c)&&!G.combosAcquired.has(c.id)));if(st<0)st=Math.max(0,sec.findIndex(s=>s.l.includes(G.cls.name)));show(st);
 $('choice').classList.remove('hide');}
function buildEvoGrid(list){const g=document.createElement('div');g.style.cssText='display:flex;flex-wrap:wrap;gap:14px;justify-content:center;width:100%';
 for(const c of list){const on=G.combosAcquired.has(c.id),rd=comboConditionsMet(c),t2=c.need.every(n=>SPELL_DEF[n.id]&&SPELL_DEF[n.id].combo);
  const needs=c.need.map(n=>{
   if(n.type==='passive'){const d=PASSIVE_DEF[n.id],cur=G.passives[n.id]||0;
    return `<div class="evoNeed" style="color:${cur>=n.lv?'#8ce99a':'#7d8fa8'}">✦ ${d.name} (пассивка) · ур ${n.lv}</div>`;}
   const d=SPELL_DEF[n.id],ow=spellOwner(n.id),cn=ow?CLASSES[ow].name:'общая',cc=ow?CLASSES[ow].color:'#fff',cur=G.spells[n.id]||0;
   return `<div class="evoNeed" style="color:${cur>=n.lv?'#8ce99a':cc}">${d.icon} ${d.name} · ${cn} · ур ${n.lv}</div>`;}).join('');
  const el=document.createElement('div');el.className='pickCard evo'+(on?' disabled':'');
  el.innerHTML=`<div class="pcIcon">${c.icon}</div><div class="pcName">${c.name}${t2?' · ТИР2':''}</div><div class="evoNeeds">${needs}</div><div class="pcLvl">${on?'✔ ИЗУЧЕНА':rd?'ГОТОВА К СЛИЯНИЮ':'—'}</div>${rd&&!on?'<button class="buyBtn evoLearn">[ ИЗУЧИТЬ ]</button>':''}<div class="pcDesc">${c.desc}</div>`;
  if(rd&&!on)el.querySelector('.evoLearn').onclick=()=>pickCombo(c);
  g.appendChild(el);}
 return g;}
function buildSynergyGrid(){const g=document.createElement('div');g.style.cssText='display:flex;flex-wrap:wrap;gap:14px;justify-content:center;width:100%';
 for(const sy of SYNERGIES){const on=synergyActive(sy);
  const needs=sy.need.map(n=>{if(n.type==='passive')return `<span style="color:#8ce99a">✦ ${PASSIVE_DEF[n.id].name}</span>`;
   const ow=spellOwner(n.id);return `<span style="color:${ow?CLASSES[ow].color:'#fff'}">${SPELL_DEF[n.id].icon} ${SPELL_DEF[n.id].name}</span>`;}).join(' + ');
  const el=document.createElement('div');el.className='pickCard'+(on?' up':' disabled');
  el.innerHTML=`<div class="pcIcon">${sy.icon}</div><div class="pcName">${sy.name}</div><div class="evoNeeds"><div class="evoNeed">${needs}</div></div><div class="pcLvl">${on?'АКТИВНА':'—'}</div><div class="pcDesc">${sy.desc}</div>`;
  g.appendChild(el);}
 return g;}
function buildPassiveGrid(){const g=document.createElement('div');g.style.cssText='display:flex;flex-wrap:wrap;gap:10px;justify-content:center;width:100%';
 for(const id in PASSIVE_DEF)g.appendChild(passiveCard(id));return g;}
function syHasCross(sy,k){return sy.need.some(n=>{if(n.type==='passive')return false;const ow=spellOwner(n.id);return ow&&ow!==k;});}
function mtCard(icon,name,sub,status,color,mtId){
 const cls=status==='own'?'mtOwn':status==='ready'?'mtReady':status==='lock'?'mtLock':'mtIdle';
 return `<div class="mtCard ${cls}" style="border-color:${color}55" data-mtid="${mtId}"><div class="mtIcon" style="color:${color}">${icon}</div><div class="mtName">${name}</div><div class="mtSub">${sub}</div></div>`;}
function buildTreePane(){const k=G.key,C=CLASSES[k],unl=crossUnlocked();let h='<div class="mtree">';
 const readyEvo=COMBOS.filter(c=>(!c.cls||c.cls===G.key)&&!G.combosAcquired.has(c.id)&&comboConditionsMet(c)).length;
 const readySyn=SYNERGIES.filter(sy=>!synergyActive(sy)&&sy.need.every(n=>n.type==='passive'?(G.passives[n.id]||0)>=1:(G.spells[n.id]||0)>=1)).length;
 if(readyEvo||readySyn)h+=`<div class="mtReadyBar">★ готово к слиянию: ${readyEvo} эво${readySyn?' · ~ синергий: '+readySyn:''}</div>`;
 h+=`<div class="mtSec"><span class="mtSecIcon" style="color:${C.color}">${C.icon}</span>${C.name} — основная школа</div><div class="mtRow">`;
 for(const id of C.pool){const d=SPELL_DEF[id],lv=G.spells[id]||0,mx=d.lv.length;
  h+=mtCard(d.icon,d.name,'●'.repeat(lv)+'○'.repeat(mx-lv),lv?'own':'idle',C.color,'spell:'+id);}
 h+='</div><div class="mtArrow">↓ синергии</div>';
 h+=`<div class="mtSec"><span class="mtSecIcon">~</span>Синергии</div><div class="mtRow">`;
 for(const sy of SYNERGIES){const on=synergyActive(sy),gated=!unl&&syHasCross(sy,k);
  const comp=sy.need.map(n=>n.type==='passive'?PASSIVE_DEF[n.id].icon:SPELL_DEF[n.id].icon).join('+');
  h+=mtCard(sy.icon,sy.name,comp,on?'own':gated?'lock':'idle',on?'#8ce99a':gated?'#7d8fa8':'#c99bff','syn:'+sy.id);}
 h+='</div><div class="mtArrow">↓ эволюции</div>';
 h+=`<div class="mtSec"><span class="mtSecIcon">⭐</span>Эволюции</div><div class="mtRow">`;
 for(const c of COMBOS){if(c.cls&&c.cls!==k)continue;
  if(c.need.every(n=>n.type!=='passive'&&SPELL_DEF[n.id]&&SPELL_DEF[n.id].combo))continue;
  const on=G.combosAcquired.has(c.id),rd=comboConditionsMet(c);
  const comp=c.need.map(n=>n.type==='passive'?PASSIVE_DEF[n.id].icon:SPELL_DEF[n.id].icon).join('+');
  h+=mtCard(c.icon,c.name,comp+(rd&&!on?' ★':''),on?'own':rd?'ready':'idle',CLASSES[c.cls]?CLASSES[c.cls].color:'#fff','combo:'+c.id);}
 h+='</div>';
 const t2s=COMBOS.filter(c=>(!c.cls||c.cls===k)&&c.need.every(n=>n.type!=='passive'&&SPELL_DEF[n.id]&&SPELL_DEF[n.id].combo));
 if(t2s.length){h+=`<div class="mtSec"><span class="mtSecIcon">⭐⭐</span>Эволюции ТИР2</div><div class="mtRow">`;
  for(const c of t2s){const on=G.combosAcquired.has(c.id),rd=comboConditionsMet(c);
   h+=mtCard(c.icon,c.name,c.need.map(n=>SPELL_DEF[n.id].icon).join('+'),on?'own':rd?'ready':'idle','#ffd166','combo:'+c.id);}
  h+='</div>';}
 h+=`<div class="mtSec"><span class="mtSecIcon">🔒</span>Второстепенные школы ${unl?'(открыто)':'(нужна эволюция своей школы или LV12)'}</div><div class="mtRow">`;
 for(const ok of CLASS_ORDER){if(ok===k)continue;const OC=CLASSES[ok];
  for(const id of OC.pool){const d=SPELL_DEF[id],lv=G.spells[id]||0;
   h+=mtCard(d.icon,d.name,lv?'●'.repeat(lv):(unl?'доступно':'закрыто'),lv?'own':unl?'idle':'lock',OC.color,'spell:'+id);}}
 h+='</div></div>';$('tab-tree').innerHTML=h;}
function showMtPopup(key){const i=key.indexOf(':'),type=key.slice(0,i),id=key.slice(i+1);let h='';
 if(type==='spell'){const d=SPELL_DEF[id],lv=G.spells[id]||0,ow=spellOwner(id),OC=ow?CLASSES[ow]:null;
  const rows=d.lv.map((c,j)=>`<div class="mppRow${j===lv-1?' cur':''}">${R[j]}: ${spellDesc(id,j+1)}</div>`).join('');
  h=`<div class="mpIcon" style="color:${OC?OC.color:'#fff'}">${d.icon}</div><div class="mpName">${d.name}</div>
   <div class="mpSub">${OC?OC.name:'общее'} · ${lv?'ур '+R[lv-1]:'не изучено'}</div><div class="mpLevels">${rows}</div>`;}
 else if(type==='syn'){const sy=SYNERGIES.find(s=>s.id===id);if(!sy)return;
  const needs=sy.need.map(n=>{if(n.type==='passive')return `<span style="color:${(G.passives[n.id]||0)?'#8ce99a':'#7d8fa8'}">✦ ${PASSIVE_DEF[n.id].name}</span>`;
   const ow=spellOwner(n.id),has=(G.spells[n.id]||0)>=1;
   return `<span style="color:${has?'#8ce99a':(ow?CLASSES[ow].color:'#fff')}">${SPELL_DEF[n.id].icon} ${SPELL_DEF[n.id].name}</span>`;}).join(' + ');
  h=`<div class="mpIcon" style="color:#c99bff">${sy.icon}</div><div class="mpName">${sy.name}</div>
   <div class="mpSub">синергия · ${synergyActive(sy)?'АКТИВНА':'не активна'}</div><div class="mpReq">${needs}</div><div class="mpDesc">${sy.desc||''}</div>`;}
 else if(type==='combo'){const c=COMBOS.find(x=>x.id===id);if(!c)return;
  const t2=c.need.every(n=>n.type!=='passive'&&SPELL_DEF[n.id]&&SPELL_DEF[n.id].combo);
  const on=G.combosAcquired.has(c.id),rd=comboConditionsMet(c);
  const needs=c.need.map(n=>{if(n.type==='passive')return `<span style="color:${(G.passives[n.id]||0)>=n.lv?'#8ce99a':'#7d8fa8'}">✦ ${PASSIVE_DEF[n.id].name} ур ${n.lv}</span>`;
   const cur=G.spells[n.id]||0,ok=cur>=n.lv,ow=spellOwner(n.id);
   return `<span style="color:${ok?'#8ce99a':(ow?CLASSES[ow].color:'#fff')}">${SPELL_DEF[n.id].icon} ${SPELL_DEF[n.id].name} ур ${n.lv}${ok?' ✔':' ('+cur+')'}</span>`;}).join(' + ');
  h=`<div class="mpIcon" style="color:#ffd166">${c.icon}</div><div class="mpName">${c.name}${t2?' · ТИР2':''}</div>
   <div class="mpSub">эволюция · ${on?'ИЗУЧЕНА':rd?'★ готова к слиянию':'не готова'}</div><div class="mpReq">${needs}</div><div class="mpDesc">${c.desc||''}</div>`;}
 $('mtPopupBody').innerHTML=h;$('mtPopup').classList.remove('hide');}
function closeMtPopup(){$('mtPopup').classList.add('hide');}
function checkReadyEvos(){if(!G.readyEvoShown)G.readyEvoShown=new Set();
 for(const c of COMBOS){if(G.readyEvoShown.has(c.id)||G.combosAcquired.has(c.id))continue;
  if(c.cls&&c.cls!==G.key&&!G.test)continue;
  if(comboConditionsMet(c)){G.readyEvoShown.add(c.id);banner('★ ГОТОВО К СЛИЯНИЮ: '+c.name);sfx('choose');}}}
function buildSpellGrid(k){const g=document.createElement('div');g.style.cssText='display:flex;flex-wrap:wrap;gap:10px;justify-content:center;width:100%';
 for(const id of Object.keys(SPELL_DEF))if(!SPELL_DEF[id].combo&&spellOwner(id)===k)g.appendChild(spellCard(id));return g;}
function capText(c){const t=[];
 if(c.aoe)t.push('взрыв');if(c.pierce)t.push('пробивает');if(c.slow)t.push('замедляет');
 if(c.burn)t.push('поджигает');if(c.chains)t.push('цепь');if(c.n&&c.n>1)t.push('×'+c.n);
 if(c.heal)t.push('хил');if(c.armor)t.push('броня');if(c.dps)t.push('зона');if(c.pull)t.push('тянет');
 return t.join(' · ');}
function spellCard(id){const d=SPELL_DEF[id],lv=G.spells[id]||0,mx=d.lv.length,max=lv>=mx;
 const foreign=spellOwner(id)&&spellOwner(id)!==G.key&&!crossUnlocked();
 const el=document.createElement('div');el.className='pickCard'+(max||foreign?' disabled':lv?' up':'');
 el.innerHTML=`<div class="pcIcon">${d.icon}</div><div class="pcName">${d.name}</div><div class="pcLvl">${max?'МАКС':lv?'УР '+R[lv-1]+'→'+R[lv]:'НОВОЕ'}</div><div class="pcDesc">${max?capText(d.lv[mx-1])||d.name:capText(d.lv[lv])||d.name}${foreign?'<div class="lockHint">после эволюции своей школы или LV12</div>':''}</div>`;
 if(!max&&!foreign)el.onclick=()=>pickSpell(id);return el;}
function passiveCard(id){const d=PASSIVE_DEF[id],lv=G.passives[id]||0,max=lv>=d.max;
 const el=document.createElement('div');el.className='pickCard'+(max?' disabled':'');
 el.innerHTML=`<div class="pcIcon">${d.icon}</div><div class="pcName">${d.name}</div><div class="pcLvl">${max?'МАКС':'УР '+lv+'→'+(lv+1)}</div><div class="pcDesc">${d.desc}</div>`;
 if(!max)el.onclick=()=>pickPassive(id);return el;}
function pickSpell(id){if(state!=='choice')return;const d=SPELL_DEF[id],lv=G.spells[id]||0;if(lv>=d.lv.length)return;G.spells[id]=lv+1;banner(d.icon+' '+d.name+' '+R[lv]);finishChoice();}
function pickPassive(id){if(state!=='choice')return;const d=PASSIVE_DEF[id],lv=G.passives[id]||0;if(lv>=d.max)return;G.passives[id]=lv+1;if(d.keep)d.apply(G);recomputeStats();banner(d.icon+' '+d.name);finishChoice();}
function pickCombo(c){if(state!=='choice'||G.combosAcquired.has(c.id)||!comboConditionsMet(c))return;acquireCombo(c);finishChoice();}
function finishChoice(){refreshBuildUI();sfx('choose');G.pendLevel--;G.choiceDelay=.35;$('choice').classList.add('hide');state='play';checkReadyEvos();}
function spellDesc(id,lv){const c=SPELL_DEF[id].lv[lv-1],L={dmg:'урон',n:'снар',aoe:'радиус',burn:'поджог',pierce:'проб',chains:'цепи',r:'радиус',heal:'хил',dps:'урон/с',dur:'длит',armor:'броня',pulse:'имп',nova:'нова',novaR:'радиус новы',stormN:'гром',stormDmg:'урон грома',pull:'тяги',orbs:'сфер',drain:'жатва',range:'дальн',width:'ширина',boom:'взрыв',stun:'стан'},b=[];for(const k in L)if(c[k])b.push(L[k]+':'+c[k]);return b.join(' ');}
function shopPool(){const owned=new Set(G.artifacts);const pool=ARTSHOP.filter(a=>!a.craftOnly&&!owned.has(a.id)&&(!a.req||owned.has(a.req)));
 const off=[];const spec=pool.filter(a=>a.cls===G.key);if(spec.length)off.push(spec[Math.random()*spec.length|0]);
 for(const a of pool.filter(a=>!a.cls).sort(()=>Math.random()-.5)){if(off.length>=4)break;off.push(a);}
 for(const a of pool.slice().sort(()=>Math.random()-.5)){if(off.length>=4)break;if(!off.includes(a))off.push(a);}
 return off.map(a=>({a,sold:false}));}
function openShop(){state='shop';G.shopOffers=shopPool();renderShop();$('shopOv').classList.remove('hide');sfx('buy');}
function closeShop(){$('shopOv').classList.add('hide');if(state==='shop')state='play';G.merchantCd=.6;}
function craftableRecipes(){return RECIPES.filter(r=>!G.artifacts.includes(r.id)&&r.need.every(n=>G.artifacts.includes(n)));}
function craftRecipe(r){for(const n of r.need){const i=G.artifacts.indexOf(n);if(i>=0)G.artifacts.splice(i,1);}
 G.artifacts.push(r.id);G.runCrafts++;recomputeStats();banner(r.icon+' СОБРАНО: '+r.name);sfx('craft');renderShop();refreshBuildUI();}
function shopPrice(a){const base={'I':70,'II':160,'III':420,'КЛАСС':240,'ТИР+':520}[artRank(a)]||a.price;
 return Math.round(base*(1+G.t/900));}
let shopTab='I';
function renderShop(){$('shopGoldBig').textContent='$ '+G.gold;
 $('shopNote').textContent='все артефакты · клик по карточке — рецепт · цены растут со временем';
 const tabs=$('shopTabs');tabs.innerHTML='';
 for(const[t,l]of[['I','ОБЫЧНОЕ'],['II','РЕДКОЕ'],['III','ЭПИК/КЛАСС']]){
  const b=document.createElement('button');b.className='ctab'+(shopTab===t?' active':'');b.textContent=l;
  b.onclick=()=>{shopTab=t;renderShop();};tabs.appendChild(b);}
 const box=$('shopItems');box.innerHTML='';const owned=new Set(G.artifacts);
 const inTab=a=>{const r=artRank(a);return shopTab==='I'?r==='I':shopTab==='II'?r==='II':(r==='III'||r==='КЛАСС'||r==='ТИР+');};
 for(const a of ARTSHOP){if(a.craftOnly||!inTab(a))continue;
  const p=shopPrice(a),has=owned.has(a.id),reqOk=!a.req||owned.has(a.req),can=!has&&reqOk&&G.gold>=p;
  const el=document.createElement('div');el.className='shopItem';
  el.innerHTML=`${a.req?'<div class="siTag">УЛУЧШ</div>':a.cls?'<div class="siTag">КЛАСС</div>':''}<div class="siIcon">${a.icon}</div><div class="siName">${a.name}</div><div class="siDesc">${a.desc}</div><button class="buyBtn" ${can?'':'disabled'}>${has?'ЕСТЬ':reqOk?p:'нужен '+(ARTSHOP.find(x=>x.id===a.req)||{}).name}</button>`;
  el.querySelector('.siIcon').onclick=()=>showArtRecipes(a);
  el.querySelector('.siName').onclick=()=>showArtRecipes(a);
  el.querySelector('.buyBtn').onclick=()=>{if(!can)return;G.gold-=p;if(a.req){const i=G.artifacts.indexOf(a.req);if(i>=0)G.artifacts.splice(i,1);}G.artifacts.push(a.id);if(a.keep)a.apply(G);recomputeStats();sfx('buy');refreshBuildUI();renderShop();};
  box.appendChild(el);}
 const cr=craftableRecipes();
 if(cr.length){const h=document.createElement('div');h.style.cssText='width:100%;text-align:center;color:#8ce99a';h.textContent='— СБОРКА —';box.appendChild(h);
  for(const r of cr){const res=ARTSHOP.find(x=>x.id===r.id);const el=document.createElement('div');el.className='shopItem';
   el.innerHTML=`<div class="siTag">СБОРКА</div><div class="siIcon">${r.icon}</div><div class="siName">${r.name}</div><div class="siDesc">${res.desc}</div><button class="buyBtn">СОБРАТЬ</button>`;
   el.querySelector('.buyBtn').onclick=()=>craftRecipe(r);box.appendChild(el);}}
 $('shopInfo').textContent='';}
function showArtRecipes(a){const rs=RECIPES.filter(r=>r.need.includes(a.id)||r.id===a.id);
 let s=a.icon+' '+a.name+': ';
 if(!rs.length)s+='вне сборок';
 else s+=rs.map(r=>{const miss=r.need.filter(n=>!G.artifacts.includes(n)).map(n=>(ARTSHOP.find(x=>x.id===n)||{}).name||n);
  return (r.id===a.id?'собирает '+r.name:'→ '+r.name)+(miss.length?' (нет: '+miss.join(', ')+')':' (готово)');}).join(' · ');
 $('shopInfo').textContent=s;}
function openReward(n){const owned=new Set(G.artifacts);
 const pool=ARTSHOP.filter(a=>!a.craftOnly&&!owned.has(a.id)&&(!a.req||owned.has(a.req))).sort(()=>Math.random()-.5).slice(0,n);
 if(!pool.length){addGold(60);banner('+60');return;}
 G.rewardOffers=pool;state='reward';$('rewardOv').classList.remove('hide');renderReward();}
function renderReward(){const box=$('rewardItems');box.innerHTML='';
 for(const a of G.rewardOffers){const el=document.createElement('div');el.className='shopItem';
  el.innerHTML=`<div class="siIcon">${a.icon}</div><div class="siName">${a.name}</div><div class="siDesc">${a.desc}</div><button class="buyBtn">ВЗЯТЬ</button>`;
  el.querySelector('.buyBtn').onclick=()=>{if(state!=='reward')return;G.artifacts.push(a.id);if(a.keep)a.apply(G);recomputeStats();refreshBuildUI();sfx('buy');closeReward();};
  box.appendChild(el);}}
function closeReward(){$('rewardOv').classList.add('hide');G.rewardOffers=[];
 if(state==='reward')state='play';
 if(G.pendingShooter){G.pendingShooter=false;G.prep=2.4;banner('ПРИГОТОВЬСЯ К ГИПЕРПРЫЖКУ');}}
function openChest(ch){const CH=BALANCE.chests;
 if(ch.golden){if(ch.boss)G.pendingShooter=true;openReward(3);banner('¤ СУНДУК: ВЫБОР АРТЕФАКТА');}
 else{const gold=CH.goldMin+Math.round(G.t*CH.goldPerMin);G.gold+=gold;banner('◊ СУНДУК: +'+gold);}
 if(G.track)G.track.chests++;sfx('chest');refreshBuildUI();}
function shootMods(){const SH=BALANCE.shooter,v=G.vow||'',ch=G.diffMode===2;
 return{dmg:v==='fury'?SH.vowFuryDmg:1,
  rate:v==='swift'?SH.vowSwiftRate:1,
  spd:v==='swift'?SH.vowSwiftSpd:1,
  drop:(v==='greed'?SH.vowGreedDrop:1)*(ch?SH.chaosDrop:1),
  hp:ch?SH.chaosHp:1,edmg:ch?SH.chaosDmg:1,spawn:ch?SH.chaosSpawn:1};}
function nextTreeNode(br){const ns=BALANCE.shooter.tree.nodes[br];for(const n of ns)if(!G.htree.has(n.id))return n;return null;}
function applyHbuff(){const T=BALANCE.shooter.tree.nodes,b={rate:0,pierce:0,dmg:0,barrels:0,hull:0,magnet:1,healOnGlyph:0};
 for(const br in T)for(const n of T[br])if(G.htree.has(n.id)){const f=n.fx;
  b.rate+=f.rate||0;b.pierce+=f.pierce||0;b.dmg+=f.dmg||0;b.barrels+=f.barrels||0;b.hull+=f.hull||0;b.magnet*=(f.magnet||1);b.healOnGlyph+=f.healOnGlyph||0;}
 G.hbuff=b;}
function boostName(t){return t===0?'▲▲ Скорострельность':t===1?'≡ Веер':'◯ Щит';}
function boostColor(t){return t===0?'#ff9a3d':t===1?'#7ee8fa':'#8ce99a';}
function triggerGlyphCombo(t){const C=BALANCE.shooter.combo;
 if(t==='rate'){G.comboBoost.rate=C.rateDur;banner('▲▲×2 ГАТЛИНГ!');}
 else if(t==='spread'){G.comboBoost.spread=C.spreadDur;banner('≡×2 ШТОРМ-ВЕЕР!');}
 else{G.shipShield=(G.shipShield||0)+C.shieldBonus;
  G.player.hp=Math.min(G.player.maxhp,G.player.hp+C.shieldHeal);G.comboBoost.shieldVis=5;banner('◯×2 БАСТИОН!');}
 sfx('level');}
function spawnBoost(x,y){G.boosts.push({x,y,t:0,ty:Math.floor(Math.random()*3)});}
function startShooter(){G.mode='shooter';const SH=BALANCE.shooter;
  G.ebullets=[];G.bullets=[];
  G.player.x=WORLD/2;G.player.y=WORLD/2;G.cam.x=WORLD/2;G.cam.y=WORLD/2;
  G.shoot={dist:0,goal:SH.goal,t:0,warp:SH.warp,mid:false,kills:0,drops:0,guard:null};G.travT=0;G.autoT=0;
  G.boost={rate:0,spread:0};G.shipShield=0;G.boosts=[];G.spiralT=0;
  G.glyphCount={rate:0,spread:0,shield:0};G.comboBoost={rate:0,spread:0,shieldVis:0};
  if((G.vow||'')==='stone')G.shipShield=(G.shipShield||0)+SH.vowStoneShield;
  G.shipShield=(G.shipShield||0)+(G.hbuff.hull||0);
  const tags=[];if(G.vow)tags.push(VOWS[G.vow]);if(G.diffMode===2)tags.push('ХАОС');
  banner('→ ГИПЕРПРЫЖОК'+(tags.length?' · '+tags.join(' · '):''));sfx('time');}
 function endShooter(){const k=G.shoot?G.shoot.kills:0;G.jumps=(G.jumps||0)+1;
  const sh=G.shoot;G.mode='play';G.shoot=null;G.enemies=[];G.ebullets=[];G.bullets=[];G.boosts=[];
  G.player.x=WORLD/2;G.player.y=WORLD/2;G.cam.x=WORLD/2;G.cam.y=WORLD/2;G.interT=1.6;
  banner('✦ СЦЕНА '+(G.stage+1)+' — ЖЁСТЧЕ · прыжок: '+k+' уб. · ⚡'+G.sparks);sfx('level');
  if(G.telemetry)G.telemetry.push({jump:true,kills:k,stage:G.stage,sparks:G.sparks,guard:!!(sh&&sh.guardKilled)});
  openTreeChoice();}
 function openTreeChoice(){const opts=[];for(const br of['fire','spread','guard']){const n=nextTreeNode(br);if(n&&G.sparks>=n.cost)opts.push(n);}
  if(!opts.length)return;
  G.treeOpts=opts;state='tree';renderTree();$('treeOv').classList.remove('hide');}
 function renderTree(){$('treeSparks').textContent='⚡ Искры: '+G.sparks;
  const box=$('treeItems');box.innerHTML='';
  for(const n of G.treeOpts){const el=document.createElement('div');el.className='shopItem';
   el.innerHTML=`<div class="siIcon">${n.icon}</div><div class="siName">${n.name}</div><div class="siDesc">${n.desc}</div><button class="buyBtn">⚡${n.cost}</button>`;
   el.querySelector('.buyBtn').onclick=()=>{if(G.sparks<n.cost)return;G.sparks-=n.cost;G.htree.add(n.id);applyHbuff();banner('⚡ '+n.name);sfx('buy');closeTreeChoice();};
   box.appendChild(el);}}
 function closeTreeChoice(){$('treeOv').classList.add('hide');G.treeOpts=[];if(state==='tree')state='play';}
 function spawnShooterEnemy(){const p=G.player,SH=BALANCE.shooter,ph=G.shoot?clamp(G.shoot.dist/G.shoot.goal,0,1):0,M=shootMods();
  const r=Math.random();let type,mode;
  if(r<.28){type='blob';mode='straight';}
  else if(r<.5){type='runner';mode='sine';}
  else if(r<.68){type='shooter';mode='hover';}
  else if(r<.85){type='runner';mode='dive';}
  else{type='brute';mode='sine';}
  const b=BALANCE.enemies[type],stg=1+G.stage*SH.stageHp;
  const x=clamp(p.x+rnd(-240,240),30,WORLD-30),y=p.y-H/2-rnd(40,180);
  const e={x,y,r:b.r,hp:b.hp*hpMul()*stg*M.hp,maxhp:b.hp*hpMul()*stg*M.hp,spd:0,dmg:b.dmg*(1+G.stage*SH.stageDmg)*M.edmg,xp:b.xp,goldV:b.gold,uid:uidN++,flash:0,stunT:0,slowT:0,slowM:1,kx:0,ky:0,dots:[],type,elite:false,boss:false,sh:true,shMode:mode,shV:rnd(90,180)+ph*70,shA:rnd(30,100),shF:rnd(1.2,2.6),shPh:rnd(0,TAU),shootT:rnd(1,2),tier:Math.min(4,G.stage+1)};
  if(mode==='dive')e.shV*=1.3;
  G.enemies.push(e);}
function updateShooter(dt){const p=G.player,s=G.stats,SH=BALANCE.shooter,M=shootMods(),hb=G.hbuff;
  if(!G.shoot)return;
  if(G.comboBoost.rate>0)G.comboBoost.rate-=dt;
  if(G.comboBoost.spread>0)G.comboBoost.spread-=dt;
  if(G.comboBoost.shieldVis>0)G.comboBoost.shieldVis-=dt;
  G.shoot.t+=dt;
  if(G.shoot.warp>0){G.shoot.warp-=dt;G.shake=2;}
  else{G.shoot.dist+=dt*SH.speed;
   const ph=clamp(G.shoot.dist/G.shoot.goal,0,1);
   if(!G.shoot.mid&&G.shoot.dist>=G.shoot.goal*.5){G.shoot.mid=true;
    const b=BALANCE.enemies.brute,e={x:p.x,y:p.y-H/2-60,r:b.r*1.3,hp:b.hp*hpMul()*3*M.hp,maxhp:b.hp*hpMul()*3*M.hp,spd:0,dmg:b.dmg*M.edmg,xp:8,goldV:20,uid:uidN++,flash:0,stunT:0,slowT:0,slowM:1,kx:0,ky:0,dots:[],type:'brute',elite:true,boss:false,sh:true,shMode:'hover',shV:110,shA:70,shF:1.6,shPh:0,shootT:1,tier:4};
    G.enemies.push(e);banner('!! ЭЛИТА В ГИПЕРПРОСТРАНСТВЕ');}
   G.travT-=dt;
   if(G.travT<=0){G.travT=lerp(SH.spawnStart,SH.spawnEnd,ph)/(1+G.stage*.15)/M.spawn;spawnShooterEnemy();}
   let tgt=(G.shoot.guard&&!G.shoot.guard.dead)?G.shoot.guard:null;
   if(!tgt){const alive=G.enemies.filter(e=>!e.dead);
    const up=alive.filter(e=>e.y<p.y);
    const tars=up.length?up:alive;
    if(tars.length){tgt=tars[0];for(const e of tars){if(Math.abs(e.y-p.y)<Math.abs(tgt.y-p.y))tgt=e;}}}
   let ang=-Math.PI/2;
   if(tgt)ang=Math.atan2(tgt.y-p.y,tgt.x-p.x);
   G.autoT-=dt;
 if(G.autoT<=0){G.autoT=.17*M.rate*(1-hb.rate)*(G.comboBoost.rate>0?.5:1);const baseDmg=(SH.autoDmg+G.stage*8)*s.dmg*M.dmg*(1+hb.dmg);
      const focus=tgt===G.shoot.guard;
      const fdmg=focus?baseDmg*2*(1+G.stage*SH.focusScale):baseDmg;
      const pierce=(focus?99:2)+hb.pierce;
      G.bullets.push({x:p.x,y:p.y-22,vx:Math.cos(ang)*520,vy:Math.sin(ang)*520,r:6,kind:'pierce',elem:'^',dmg:fdmg,pierce,life:1.9,hit:new Set(),col:focus?'#ffe08a':'#fff'});
      if(G.boost.spread>0){for(let off=-1;off<=1;off+=2){const aa=ang+off*.26;
       G.bullets.push({x:p.x-14*off,y:p.y-14,vx:Math.cos(aa)*480,vy:Math.sin(aa)*480,r:4,kind:'pierce',elem:'^',dmg:baseDmg*.55,pierce:1,life:1.5,hit:new Set(),col:'#ffd166'});}}
      const ex=G.stats.raysBonus+(G.spells.ray?SPELL_DEF.ray.lv[G.spells.ray-1].n:0);
      const sideN=(ex>0?2:0)+hb.barrels+(G.comboBoost.spread>0?SH.combo.spreadBarrels:0);
      for(let i=0;i<sideN;i++){const off=(i-(sideN-1)/2)*.22;
       G.bullets.push({x:p.x,y:p.y-12,vx:Math.sin(off)*520,vy:-Math.cos(off)*520,r:4,kind:'pierce',elem:'^',dmg:baseDmg*.7,pierce:1+hb.pierce,life:1.4,hit:new Set(),col:'#9fd8ff'});}}
    G.spiralT-=dt;
    if(ph>=SH.spiralAt&&G.spiralT<=0){G.spiralT=.22;const sd=(SH.autoDmg+G.stage*8)*s.dmg*.6*M.dmg,rot=G.shoot.t*6;
     for(const so of[-1,1]){const aa=ang+so*rot;
      G.bullets.push({x:p.x,y:p.y-22,vx:Math.cos(aa)*500,vy:Math.sin(aa)*500,r:5,kind:'pierce',elem:'^',dmg:sd,pierce:2,life:1.7,hit:new Set(),col:'#7ee8fa'});}}
    if(!G.shoot.sent&&ph>=SH.bossAt){G.shoot.sent=true;const b=BALANCE.enemies.brute;
     const chg=(G.diffMode===2?BALANCE.shooter.chaosGuard:1);
     const e={x:p.x+rnd(-120,120),y:p.y-190,r:b.r*1.6,hp:b.hp*hpMul()*1.8*chg,maxhp:b.hp*hpMul()*1.8*chg,spd:0,dmg:b.dmg,xp:12,goldV:0,uid:uidN++,flash:0,stunT:0,slowT:0,slowM:1,kx:0,ky:0,dots:[],type:'brute',elite:true,boss:false,sh:true,sent:true,shMode:'hover',shV:70,shA:90,shF:1.4,shPh:0,shootT:1,tier:4};
     G.enemies.push(e);G.shoot.guard=e;banner('☠ ГИПЕРСТРАЖ');}
     for(let bi=G.boosts.length-1;bi>=0;bi--){const bo=G.boosts[bi];if(!bo)continue;bo.t+=dt;
     const bd=Math.hypot(bo.x-p.x,bo.y-p.y);
     if(bd<SH.magnetR*(G.hbuff.magnet||1)){const ba=Math.atan2(p.y-bo.y,p.x-bo.x);bo.x+=Math.cos(ba)*260*dt;bo.y+=Math.sin(ba)*260*dt;}
     if(bd<SH.pickupR){if(G.hbuff.healOnGlyph)G.player.hp=Math.min(G.player.maxhp,G.player.hp+G.hbuff.healOnGlyph);
      dmgText(p.x,p.y-30,boostName(bo.ty),boostColor(bo.ty));applyBoost(bo.ty);G.boosts.splice(bi,1);
      const tyN=['rate','spread','shield'][bo.ty];
      G.glyphCount[tyN]=(G.glyphCount[tyN]||0)+1;
      if(G.glyphCount[tyN]>=SH.combo.need){G.glyphCount[tyN]=0;triggerGlyphCombo(tyN);}}
    G.boost.rate=Math.max(0,G.boost.rate-dt);G.boost.spread=Math.max(0,G.boost.spread-dt);
     if(G.shoot.dist>=G.shoot.goal)endShooter();}}}
function applyBoost(ty){const D=BALANCE.shooter.boostDur;
 if(ty===0){G.boost.rate=D;banner('▲▲ СКОРОСТРЕЛЬНОСТЬ');}
 else if(ty===1){G.boost.spread=D;banner('≡ ВЕЕР');}
 else{G.shipShield=2;banner('◯ ЩИТ');}sfx('level');}
function crossUnlocked(){return G.player.level>=12||COMBOS.some(c=>c.cls===G.key&&G.combosAcquired.has(c.id));}
function artRank(a){if(a.craftOnly)return'СБОРКА';if(a.cls)return'КЛАСС';if(a.req)return'ТИР+';return a.price>=130?'III':a.price>=90?'II':'I';}
function openReward(n){const owned=new Set(G.artifacts);
 const pool=ARTSHOP.filter(a=>!a.craftOnly&&!owned.has(a.id)&&(!a.req||owned.has(a.req))).sort(()=>Math.random()-.5).slice(0,n);
 if(!pool.length){addGold(60);banner('+60');return;}
 G.rewardOffers=pool;state='reward';$('rewardOv').classList.remove('hide');renderReward();}
function renderReward(){const box=$('rewardItems');box.innerHTML='';
 for(const a of G.rewardOffers){const el=document.createElement('div');el.className='shopItem';
  el.innerHTML=`<div class="siIcon">${a.icon}</div><div class="siName">${a.name}</div><div class="siDesc">${a.desc}</div><button class="buyBtn">ВЗЯТЬ</button>`;
  el.querySelector('.buyBtn').onclick=()=>{if(state!=='reward')return;G.artifacts.push(a.id);if(a.keep)a.apply(G);recomputeStats();refreshBuildUI();sfx('buy');closeReward();};
  box.appendChild(el);}}
function closeReward(){$('rewardOv').classList.add('hide');G.rewardOffers=[];
 if(state==='reward')state='play';
 if(G.pendingShooter){G.pendingShooter=false;G.prep=2.4;banner('ПРИГОТОВЬСЯ К ГИПЕРПРЫЖКУ');}}
function recipesFor(id){return RECIPES.filter(r=>r.need.includes(id)||r.id===id);}
function refreshBuildUI(){const sk=$('skills');sk.innerHTML='';
 for(const id in G.spells){const d=SPELL_DEF[id];sk.innerHTML+=`<div class="chip">${d.icon}<b>${d.combo?'★':R[G.spells[id]-1]}</b></div>`;}
 if(G.pets.length)sk.innerHTML+=`<div class="chip">¤<b>x${G.pets.length}</b></div>`;
 const pb=$('passivesBar');pb.innerHTML='';for(const id in G.passives)pb.innerHTML+=`<div class="chip">${PASSIVE_DEF[id].icon}<b>${R[G.passives[id]-1]}</b></div>`;
 const sb=$('synBar');sb.innerHTML='';for(const sy of activeSynergies())sb.innerHTML+=`<div class="chip">${sy.icon}</div>`;
 const ar=$('arts');ar.innerHTML='';for(const id of G.artifacts){const a=ARTSHOP.find(x=>x.id===id);if(a)ar.innerHTML+=`<div class="chip">${a.icon}</div>`;}}
function banner(txt){const b=$('banner');b.textContent=txt;b.classList.remove('show');void b.offsetWidth;b.classList.add('show');if(G){G.log.push({txt,t:G.t});if(G.log.length>40)G.log.shift();}}
function setPause(on){if(on){state='pause';buildPause();if(typeof syncSetBtns==='function')syncSetBtns();$('pauseOv').classList.remove('hide');}else{state='play';$('pauseOv').classList.add('hide');}}
function buildPause(){let m='';const groups=[...CLASS_ORDER.map(k=>({k,t:CLASSES[k].name})),{k:null,t:'Общее'}];
 const learned=Object.keys(G.spells);
 if(learned.length){m+='<div class="secHead">ИЗУЧЕННАЯ МАГИЯ</div>';
  for(const g of groups){const list=learned.filter(id=>SPELL_DEF[id].combo?(g.k===null):spellOwner(id)===g.k);if(!list.length)continue;
   m+='<div class="ld">'+g.t+'</div>';
   for(const id of list){const d=SPELL_DEF[id],l=G.spells[id];m+=`<div class="listRow"><div class="li">${d.icon}</div><div class="ln">${d.name}</div><div class="ll">${l}/${d.lv.length}</div></div>`;}}}
 const ps=Object.keys(G.passives);if(ps.length){m+='<div class="secHead">ПАССИВКИ</div>';for(const id of ps)m+=`<div class="listRow"><div class="li">${PASSIVE_DEF[id].icon}</div><div class="ln">${PASSIVE_DEF[id].name}</div><div class="ll">${G.passives[id]}/${PASSIVE_DEF[id].max}</div></div>`;}
 $('tab-magic').innerHTML=m||'<div class="emptyMsg">пусто</div>';
 $('tab-combos').innerHTML=buildComboPane();$('tab-syn').innerHTML=buildSynergyPane();
 const tr=G.track||{dmg:0,crits:0,hearts:0,chests:0,gold:0,evos:0};
 $('tab-stats').innerHTML=`<div class="listRow"><div class="li">@</div><div class="ln">${G.cls.name} · LV ${G.player.level}</div><div class="ll">${fmt(G.t)}</div></div>
 <div class="listRow"><div class="li">*</div><div class="ln">урон нанесён</div><div class="ll">${Math.round(tr.dmg)}</div></div>
 <div class="listRow"><div class="li">%</div><div class="ln">критов</div><div class="ll">${tr.crits}</div></div>
 <div class="listRow"><div class="li">Ω</div><div class="ln">убийств</div><div class="ll">${G.kills}</div></div>
 <div class="listRow"><div class="li">+</div><div class="ln">сердец</div><div class="ll">${tr.hearts}</div></div>
 <div class="listRow"><div class="li">◊</div><div class="ln">сундуков</div><div class="ll">${tr.chests}</div></div>
 <div class="listRow"><div class="li">$</div><div class="ln">золота</div><div class="ll">${Math.round(tr.gold)}</div></div>
 <div class="listRow"><div class="li">&</div><div class="ln">эволюций</div><div class="ll">${tr.evos}</div></div>`;
 let a='';
 if(G.artifacts.length){a+='<div class="note" style="margin:0 0 8px">Рецепты: Кошка+Ускоритель · Гримуар1+Линза1 · Руна2+Око · Проводник+Магнит · Щупальца+Призма · классовые: Уголь+Руна2 · Фонарь+Клык · Проводник+Часы2 · ПризмаАрх+Линза2</div>';
  for(const id of G.artifacts){const x=ARTSHOP.find(q=>q.id===id);a+=`<div class="listRow"><div class="li">${x.icon}</div><div class="ln">${x.name}</div></div>`;}}
 else a='<div class="emptyMsg">нет артефактов — ищи £ и ◊</div>';
 $('tab-arts').innerHTML=a;
 buildTreePane();}
/* ---------- бой ---------- */
function nearestEnemies(x,y,n){const es=G.enemies;if(!es.length)return[];return es.map(e=>[(e.x-x)**2+(e.y-y)**2,e]).sort((a,b)=>a[0]-b[0]).slice(0,n).map(p=>p[1]);}
function nearestEnemy(x,y){let b=null,bd=1e18;for(const e of G.enemies){const d=(e.x-x)**2+(e.y-y)**2;if(d<bd){bd=d;b=e;}}return b;}
function addDot(e,dps,dur){if(e.dots.length<6)e.dots.push({dps:dps*G.stats.dmg,t:dur});}
function fxRing(x,y,r0,r1,col,dur){G.zones.push({type:'fx',x,y,r0,r1,t:dur,dur,col,w:3});}
function burst(x,y,col,n,sp){if(G.parts.length>520)return;for(let i=0;i<n;i++){const a=rnd(0,TAU),v=rnd(.2,1)*(sp||120);G.parts.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,t:rnd(.25,.6),dur:.6,col,r:rnd(1.5,3.5)});}}
function dmgText(x,y,v,col){if(G.settings&&!G.settings.dmg)return;if(G.texts.length>70)return;
 const s=(typeof v==='number')?String(Math.round(v)):String(v);
 G.texts.push({x:x+rnd(-8,8),y:y-10,txt:s,col:col||'#ffd166',t:.7});}
function getArmor(){const t=G.stats.armor+synSum('armor')+(G.spells.shield?SPELL_DEF.shield.lv[G.spells.shield-1].armor:0)+(G.spells.archon?SPELL_DEF.archon.lv[G.spells.archon-1].armor:0);return Math.min(BALANCE.enemies.armorCap||99,t);}
function activeRays(){if(G.spells.laserstorm)return 1;if(G.spells.ray)return SPELL_DEF.ray.lv[G.spells.ray-1].n+G.stats.raysBonus;return 0;}
function dealDamage(e,dmg,o){o=o||{};if(e.dead)return;
 dmg*=(1+synSum('dmg'));
 if(G.stats.tentacles||G.stats.tentaclesStrong){const r=activeRays();if(r>0)dmg*=(1+r*(G.stats.tentaclesStrong?.10:.06));}
 if(G.ev&&G.ev.type==='bless')dmg*=1.25;
 let cr=false;
 if(G.stats.crit){G.stats.critN++;if(G.stats.critN%4===0){dmg*=2;cr=true;dmgText(e.x,e.y-14,dmg,'#fff');}}
 if(G.stats.scythe&&!e.elite&&!e.boss&&Math.random()<.08){e.hp=0;dmgText(e.x,e.y,'⚰','#ff8a8a');}
 else e.hp-=dmg;
 if(G.track){G.track.dmg+=dmg;if(cr)G.track.crits++;}
 if(o.elem)hitSfx(o.elem);
 e.flash=.09;if(dmg>=10||G.texts.length<35)dmgText(e.x,e.y,(o.elem||'')+Math.round(dmg));
 if(e.hp<=0)kill(e,o.src);}
function kill(e,src){if(e.dead)return;e.dead=true;G.kills++;
  if(G.mode==='shooter'&&G.shoot){const ph=G.shoot.dist/G.shoot.goal,M=shootMods();
   G.shoot.kills++;G.sparks=(G.sparks||0)+BALANCE.shooter.tree.sparkPerKill;
   if(e===G.shoot.guard){G.sparks+=BALANCE.shooter.tree.sparkGuard;G.shoot.guardKilled=true;}
   if(e.sh&&!e.sent){const pity=ph>=.7&&G.shoot.drops===0;
    if(pity||Math.random()<BALANCE.shooter.dropChance*M.drop){G.shoot.drops++;spawnBoost(e.x,e.y);}}}
  if(e.sent){const chG=G.diffMode===2?40:0;addGold(80+chG);spawnBoost(e.x,e.y);banner('☠ СТРАЖ ПАЛ: +$'+(80+chG));}
  gainXP(e.xp);addGold(e.goldV||e.xp);
 const vamp=G.stats.vamp+synSum('vamp');
 if(vamp>0&&G.vampBudget>0){const h=Math.min(vamp,G.vampBudget);G.vampBudget-=h;G.player.hp=Math.min(G.player.maxhp,G.player.hp+h);}
 G.killsSinceHeart++;
 if(G.killsSinceHeart>=BALANCE.economy.heartEveryKills){G.killsSinceHeart=0;G.hearts.push({x:e.x,y:e.y,t:0});if(G.track)G.track.hearts++;}
 burst(e.x,e.y,e.boss?'#fff':e.elite?'#fff':'#9aa6e8',e.boss?40:e.elite?16:7,e.boss?260:120);
 if(e.aff==='split')for(let i=0;i<2;i++){const a=rnd(0,TAU);spawnEnemy('runner',false,{x:e.x+Math.cos(a)*22,y:e.y+Math.sin(a)*22});}
 if(e.type==='tower'){const TO=BALANCE.towers;addGold(TO.gold);G.player.hp=Math.min(G.player.maxhp,G.player.hp+TO.heal);banner('# БАШНЯ: +'+TO.gold+' +'+TO.heal);G.shake=Math.max(G.shake,10);sfx('boom');}
 if(e.type==='guard'){G.hearts.push({x:e.x,y:e.y,t:0});
   G.chests.push({x:e.x,y:e.y,golden:Math.random()<.5,t:0});
   banner('✦ СТРАЖ ПАЛ');}
 if(src!=='burst'&&G.spells.deathburst){const c=SPELL_DEF.deathburst.lv[G.spells.deathburst-1];areaDamage(e.x,e.y,c.aoe*Math.sqrt(G.stats.area*(1+synSum('area'))),c.dmg*G.stats.dmg,{src:'burst'});}
 if(e.boss){G.bossRef=null;G.bossArena=null;G.shake=14;sfx('boom');G.runBosses++;addGold(40);
  G.stage++;G.enemies=[];G.ebullets=[];G.beamFx=2;
  G.chests.push({x:e.x,y:e.y,golden:true,t:0,boss:true});
  banner('☠ БОСС ПОВЕРЖЕН');}
 }
function areaDamage(x,y,r,dmg,o){o=o||{};for(const e of G.enemies){if(e.dead)continue;
 if(Math.hypot(e.x-x,e.y-y)<r+e.r){dealDamage(e,dmg,o);
  if(o.burn)addDot(e,o.burn*(1+synSum('burn')),2.5);
  if(o.slow){e.slowT=2;e.slowM=.5;}
  if(o.stun)e.stunT=Math.max(e.stunT,o.stun);
  if(o.knock!==false){const a=Math.atan2(e.y-y,e.x-x),k=o.knock||150;e.kx+=Math.cos(a)*k;e.ky+=Math.sin(a)*k;}}}}
function explode(x,y,r,dmg,o){o=o||{};areaDamage(x,y,r,dmg,o);fxRing(x,y,r*.25,r,o.col||'#ffb45e',.3);burst(x,y,o.col||'#ffb45e',10,150);G.shake=Math.max(G.shake,o.shake||2);if(o.boom)sfx('boom');}
function damagePlayer(d){const p=G.player;G.lastHit='враг';if(p.ifr>0||state!=='play')return;if(G.test)return;
  if(G.shipShield>0){G.shipShield--;banner('◯ ЩИТ');sfx('zap');G.shake=Math.max(G.shake,2);return;}
 if(G.vowDmgMul)d*=G.vowDmgMul;
 if(G.diffMode===2){const ramp=clamp(G.t/300,0,1);d*=(BALANCE.chaos.dmg-0.08)+0.08*ramp;}
 d=Math.max(1,Math.round(d-getArmor()));p.hp-=d;p.ifr=BALANCE.player.ifr;G.hitFlash=.4;G.shake=Math.max(G.shake,6);sfx('hurt');dmgText(p.x,p.y,d,'#ff7b7b');
 if(p.hp<=0){if(G.stats.phoenix>0){G.stats.phoenix--;p.hp=p.maxhp*.5;p.ifr=2;banner('v ФЕНИКС');G.shake=10;sfx('level');return;}p.hp=0;gameOver();}}
function deathBurst(){const p=G.player;G.shake=12;const ch=['@','*','~','^','.',',','Ω','†'];
 for(let i=0;i<48;i++){const a=rnd(0,TAU),v=rnd(40,260);G.parts.push({x:p.x,y:p.y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,t:rnd(.5,1.3),dur:1.3,r:rnd(1,3),ch:ch[Math.random()*ch.length|0]});}}
function winBurst(){const p=G.player;const ch=['*','✦','+','¤','^'];
 for(let i=0;i<60;i++){const a=rnd(0,TAU),v=rnd(60,300);G.parts.push({x:p.x,y:p.y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,t:rnd(.6,1.5),dur:1.5,r:rnd(1,3),ch:ch[Math.random()*ch.length|0]});}}
function telemetryLine(){const snaps=G.telemetry||[];if(!snaps.length)return '—';
 const out=[];let cur=null;
 for(const s of snaps){const b=Math.floor(s.t/30);
  if(cur&&cur.b!==b)out.push(cur);cur={b,t:s.t,hp:s.hp,maxhp:G.player.maxhp,k:s.k,lv:s.lv};}
 if(cur)out.push(cur);
 return out.map(o=>`${Math.floor(o.t/60)}м${String(Math.round((o.t%60)/10)*10).padStart(2,'0')}с hp=${Math.round(o.hp*100/o.maxhp)}% k=${o.k} lv=${o.lv}`).join(' · ');}
function gameOver(){state='over';deathBurst();recordRun(false);
 $('statOver').innerHTML=`<span>Класс</span><b>${G.cls.name}</b><span>Время</span><b>${fmt(G.t)}</b><span>Убийств</span><b>${G.kills}</b><span>Уровень</span><b>${G.player.level}</b><span>Золото</span><b>${G.gold}</b>${(G.achNewly&&G.achNewly.length)?`<span>✦</span><b>${G.achNewly.join(' · ')}</b>`:''}<span>Телеметрия</span><b style="font-size:12px">${telemetryLine()}</b>`;
 setTimeout(()=>{$('overOv').classList.remove('hide');},900);}
function winGame(){state='win';winBurst();recordRun(true);
 $('statWin').innerHTML=`<span>Класс</span><b>${G.cls.name}</b><span>Убийств</span><b>${G.kills}</b><span>Уровень</span><b>${G.player.level}</b><span>Золото</span><b>${G.gold}</b>${(G.achNewly&&G.achNewly.length)?`<span>✦</span><b>${G.achNewly.join(' · ')}</b>`:''}<span>Телеметрия</span><b style="font-size:12px">${telemetryLine()}</b>`;
 sfx('level');setTimeout(()=>{$('winOv').classList.remove('hide');},700);}
/* ---------- спавн ---------- */
function spawnPos(){const p=G.player,a=rnd(0,TAU),d=Math.hypot(W,H)/2+80;return{x:clamp(p.x+Math.cos(a)*d,20,WORLD-20),y:clamp(p.y+Math.sin(a)*d,20,WORLD-20)};}
function hpMul(){const t=G.t,E=BALANCE.enemies;let b=1+t*E.hpGrowth+Math.pow(t/60,2)*E.hpCurve;
 if(G.stats.genome)b*=.85;if(G.vowHpMul)b*=G.vowHpMul;b*=1+(G.stage||0)*.15; if(G.diffMode===2){const ramp=clamp(G.t/300,0,1);b*=(BALANCE.chaos.hp-0.12)+0.12*ramp;}return b*(1+((G.diff||1)-1)*E.diffHp);}
function spawnEnemy(type,elite,pos){const p=pos||spawnPos(),m=hpMul(),E=BALANCE.enemies,sd=1+G.t/E.spdGrowth;let b;
 if(type==='runner')b=E.runner;else if(type==='brute')b=E.brute;else if(type==='shooter')b=E.shooter;else if(type==='healer')b=E.healer;else b=E.blob;
 const e={x:p.x,y:p.y,r:b.r,hp:b.hp*m,spd:b.spd*sd,dmg:b.dmg,xp:b.xp,goldV:b.gold,uid:uidN++,maxhp:b.hp*m,flash:0,stunT:0,slowT:0,slowM:1,kx:0,ky:0,dots:[],type,elite:false,boss:false,tier:Math.min(4,Math.floor(G.t/150)+1)};
 if(elite){const el=E.elite;e.hp*=el.hpMul;e.maxhp=e.hp;e.dmg*=el.dmgMul;e.r*=el.rMul;e.xp=el.xp;e.goldV=el.gold;e.elite=true;
  e.aff=pickArr(['fast','regen','thorns','split']);if(e.aff==='fast')e.spd*=1.6;}
 G.enemies.push(e);}
function spawnBoss(i){const BO=BALANCE.bosses;G.bossIdx=i+1;const pos=spawnPos();
 const e={x:pos.x,y:pos.y,r:34,hp:BO.hp[i],maxhp:BO.hp[i],spd:BO.spd+i*5,dmg:BO.dmg,xp:40,goldV:40,uid:uidN++,flash:0,stunT:0,slowT:0,slowM:1,kx:0,ky:0,dots:[],type:'boss',elite:false,boss:true,shootT:2.5,bossName:BOSS_NAMES[i],tier:4};
 e.aff=pickArr(['regen','thorns','fast']);if(e.aff==='fast')e.spd*=1.4;
 G.bossArena={x:WORLD/2,y:WORLD/2,r:380};
  G.enemies.push(e);G.bossRef=e;sfx('boss');G.shake=Math.max(G.shake,8);banner('☠ '+BOSS_NAMES[i]);}
function spawnGuard(){const pos=spawnPos(),hp=140*hpMul();
 const e={x:pos.x,y:pos.y,r:26,hp,maxhp:hp,spd:42,dmg:14,xp:15,goldV:20,uid:uidN++,flash:0,stunT:0,slowT:0,slowM:1,kx:0,ky:0,dots:[],type:'guard',elite:false,boss:false,shootT:2,tier:Math.min(4,Math.floor(G.t/150)+1)};
 e.aff=pickArr(['fast','regen','thorns','split']);if(e.aff==='fast')e.spd*=1.5;
 G.enemies.push(e);banner('∆ СТРАЖ');sfx('boss');}
function spawnTower(){const TO=BALANCE.towers,p=G.player,a=rnd(0,TAU),d=rnd(260,420);
 const x=clamp(p.x+Math.cos(a)*d,40,WORLD-40),y=clamp(p.y+Math.sin(a)*d,40,WORLD-40),hp=TO.hp*hpMul();
 G.enemies.push({x,y,r:24,hp,maxhp:hp,spd:0,dmg:16,xp:TO.xp,goldV:10,uid:uidN++,flash:0,stunT:0,slowT:0,slowM:1,kx:0,ky:0,dots:[],type:'tower',elite:false,boss:false,shootT:1.6,tier:Math.min(4,Math.floor(G.t/150)+1)});
 banner('# БАШНЯ');sfx('boss');}
function spawnMerchant(){const p=G.player,a=rnd(0,TAU),d=rnd(280,460);
 G.merchant={x:clamp(p.x+Math.cos(a)*d,40,WORLD-40),y:clamp(p.y+Math.sin(a)*d,40,WORLD-40),used:false};
 banner('£ ТОРГОВЕЦ');sfx('coin');}
function startEvent(){const p=G.player,type=pickArr(['meteor','fog','tide','bless']);G.ev={type,dur:9,mt:0};
 if(type==='tide'){for(let i=0;i<12;i++){const a=i/12*TAU;spawnEnemy('blob',false,{x:clamp(p.x+Math.cos(a)*420,20,WORLD-20),y:clamp(p.y+Math.sin(a)*420,20,WORLD-20)});}banner('≈ ПРИЛИВ ×1.5');}
 else if(type==='meteor')banner('* МЕТЕОРЫ');else if(type==='fog')banner('= ТУМАН');else banner('✦ БЛАГОСЛОВЕНИЕ');}
function director(dt){G.spawnT-=dt;G.waveT-=dt;G.merchantT-=dt;G.towerT-=dt;G.chestT-=dt;G.guardT-=dt;G.evT-=dt;G.merchantCd=Math.max(0,(G.merchantCd||0)-dt);
 const t=G.t,E=BALANCE.enemies,BO=BALANCE.bosses,WV=BALANCE.waves,CH=BALANCE.chests;
 for(let i=0;i<BO.times.length;i++)if(G.bossIdx===i&&t>=BO.times[i]&&G.bossWarn<=0){G.bossWarn=2.2;G.bossWarnIdx=i;roar();banner('!!! ВНИМАНИЕ !!!');break;}
 if(G.merchantT<=0){G.merchantT=45;if(!G.merchant)spawnMerchant();}
 if(G.towerT<=0){G.towerT=75;spawnTower();}
 if(G.guardT<=0){G.guardT=75;spawnGuard();}
 if(G.evT<=0){G.evT=rnd(45,60);startEvent();}
 const bossLock=G.bossRef&&G.enemies.length>=12;
  if(G.spawnT<=0&&!bossLock){G.spawnT=lerp(E.spawnStart,E.spawnEnd,clamp(t/E.spawnRampT,0,1))/((1+((G.diff||1)-1)*E.diffSpawn)*(G.diffMode===2?BALANCE.chaos.spawn:1)*(1+(G.stage||0)*.1));
  const group=1+Math.floor(clamp(t/E.groupRampT,0,E.groupMax-1));
  for(let i=0;i<group&&G.enemies.length<E.cap;i++){
   const type=t<50?'blob':t<130?pickArr(['blob','blob','runner']):t<180?pickArr(['blob','runner','runner','brute']):pickArr(['blob','runner','brute','shooter','shooter','healer']);
   G.spawnCount++;
   const eliteEvery=Math.max(E.eliteMinEvery,E.eliteEvery-Math.floor(((G.diff||1)-1)*E.diffElite));
   spawnEnemy(type,t>E.eliteStartT&&G.spawnCount%eliteEvery===0);}}
 if(G.waveT<=0){G.waveT=WV.every;G.waveCount++;
  let spec=null;
  if(G.waveCount%5===0){spec=pickArr(['dense','fast','elite','brute']);banner('!! ОСОБАЯ ВОЛНА ×2');}
  let count=WV.count;if(spec==='dense')count*=2;
  for(let i=0;i<count&&G.enemies.length<E.cap;i++){
   const a=i/count*TAU,p=G.player,d=Math.hypot(W,H)/2+60;
   const type=spec==='brute'?'brute':(t<130?'blob':pickArr(['blob','runner','brute']));
   const e={x:clamp(p.x+Math.cos(a)*d,20,WORLD-20),y:clamp(p.y+Math.sin(a)*d,20,WORLD-20),r:11,hp:WV.hp*hpMul(),maxhp:WV.hp*hpMul(),spd:WV.spd,dmg:WV.dmg,xp:1,goldV:1,uid:uidN++,flash:0,stunT:0,slowT:0,slowM:1,kx:0,ky:0,dots:[],type:'wave',elite:false,boss:false,tier:Math.min(4,Math.floor(t/150)+1)};
   if(spec==='fast')e.spd*=1.5;
   if(spec==='elite'&&i%3===0){e.elite=true;e.hp*=3;e.maxhp=e.hp;e.r*=1.2;e.xp=4;e.goldV=6;}
   if(spec){e.xp*=2;e.goldV*=2;}
   G.enemies.push(e);}}}
/* ---------- tryCast ---------- */
function castMirages(n,dmg,col,elem){const p=G.player,ts=nearestEnemies(p.x,p.y,Math.max(1,n));if(!ts.length)return false;
 const pos=(G.mirrorPos&&G.mirrorPos.length)?G.mirrorPos:[p];
 for(let i=0;i<n;i++){const src=pos[i%pos.length],t=ts[i%ts.length],a=Math.atan2(t.y-src.y,t.x-src.x);
  G.bullets.push({x:src.x,y:src.y,vx:Math.cos(a)*420,vy:Math.sin(a)*420,r:5,kind:'pierce',elem:elem,dmg:dmg,pierce:0,life:1.2,hit:new Set(),col:col});}
 return true;}
function tryCast(id,lv){const p=G.player,c=SPELL_DEF[id].lv[lv-1],s=G.stats,area=Math.sqrt(s.area*(1+synSum('area')));
 switch(id){
 case'fireball':case'sunstorm':{const n=id==='sunstorm'?c.n:c.n;const ts=nearestEnemies(p.x,p.y,n);if(!ts.length)return false;
  for(const t of ts){const a=Math.atan2(t.y-p.y,t.x-p.x);G.bullets.push({x:p.x,y:p.y,vx:Math.cos(a)*430,vy:Math.sin(a)*430,r:id==='sunstorm'?8:6,kind:'fire',elem:'*',dmg:c.dmg*s.dmg,aoe:c.aoe*area,burn:c.burn*s.burnMult,pierce:0,life:1.6,hit:new Set(),col:'#ff9a3d'});}
  if(id==='sunstorm')explode(p.x,p.y,c.novaR*area,c.nova*s.dmg,{knock:200,shake:3});return true;}
 case'soularrow':case'soulreaper':{const n=id==='soulreaper'?c.n:c.n;const ts=nearestEnemies(p.x,p.y,n);if(!ts.length)return false;
  for(const t of ts){const a=Math.atan2(t.y-p.y,t.x-p.x);G.bullets.push({x:p.x,y:p.y,vx:Math.cos(a)*520,vy:Math.sin(a)*520,r:id==='soulreaper'?6:5,kind:'pierce',elem:'†',dmg:c.dmg*s.dmg,pierce:c.pierce,life:1.8,hit:new Set(),col:'#8ce99a'});}
  if(id==='soulreaper')explode(p.x,p.y,c.novaR*area,c.nova*s.dmg,{knock:180,shake:3});return true;}
 case'icelance':case'icestorm':{const ts=nearestEnemies(p.x,p.y,c.n);if(!ts.length)return false;
  for(const t of ts){const a=Math.atan2(t.y-p.y,t.x-p.x);G.bullets.push({x:p.x,y:p.y,vx:Math.cos(a)*560,vy:Math.sin(a)*560,r:6,kind:'pierce',elem:'^',slow:true,dmg:c.dmg*s.dmg,pierce:c.pierce,life:1.8,hit:new Set(),col:'#9fe8ff'});}
  if(id==='icestorm')for(let i=0;i<c.orbs;i++){const t=pickArr(ts),a=Math.atan2(t.y-p.y,t.x-p.x)+rnd(-.6,.6);G.orbs.push({x:p.x,y:p.y,vx:Math.cos(a)*95,vy:Math.sin(a)*95,r:17,dmg:20*s.dmg,life:4,tick:0});}
  return true;}
 case'boomer':{const ts=nearestEnemies(p.x,p.y,c.n);if(!ts.length)return false;
  for(const t of ts){const a=Math.atan2(t.y-p.y,t.x-p.x);G.bullets.push({x:p.x,y:p.y,vx:Math.cos(a)*430,vy:Math.sin(a)*430,r:7,kind:'pierce',elem:'»',dmg:c.dmg*s.dmg,pierce:999,life:1.5,maxLife:1.5,return:true,age:0,hit:new Set(),col:'#c99bff'});}return true;}
 case'mirror':return castMirages(c.n+s.mirrorBonus,c.dmg*s.dmg*(s.electro?1.4:1)*(1+synSum('minionDmg')),'#cfe0ff','@');
 case'avatar':return castMirages(c.n+s.mirrorBonus,c.dmg*s.dmg*(s.electro?1.4:1)*(1+synSum('minionDmg')),'#ffd7f2','@');
 case'arcane':{const n=c.n+s.projBonus+Math.round(synSum('proj'));const ts=nearestEnemies(p.x,p.y,n);if(!ts.length)return false;
  ts.forEach((t,i)=>{const a=Math.atan2(t.y-p.y,t.x-p.x)+(i-ts.length/2)*.4;G.bullets.push({x:p.x,y:p.y,vx:Math.cos(a)*260,vy:Math.sin(a)*260,r:5,kind:'arcane',elem:'✦',homing:true,dmg:c.dmg*s.dmg,pierce:0,life:2.6,hit:new Set(),col:'#c99bff'});});return true;}
 case'lightning':case'skywrath':case'stormlord':case'archmind':case'astrape':{
  const chains=(c.chains||0)+s.chainBonus+Math.round(synSum('chains'));
  let cur=nearestEnemy(p.x,p.y);if(!cur)return false;
  const hitSet=new Set();let dm=c.dmg*s.dmg;const pts=[[p.x,p.y]];
  for(let i=0;i<=chains&&cur;i++){hitSet.add(cur);pts.push([cur.x,cur.y]);dealDamage(cur,dm,{elem:'z'});cur.stunT=.2;dm*=.9;
   let nx=null,bd=1e18;for(const e of G.enemies){if(e.dead||hitSet.has(e))continue;const d=(e.x-cur.x)**2+(e.y-cur.y)**2;if(d<bd&&d<40000){bd=d;nx=e;}}cur=nx;}
  G.beams.push({pts,t:.2,dur:.2,col:'#eaf7ff'});
  const sn=c.stormN||0;if(sn){const ts=nearestEnemies(p.x,p.y,sn);
   for(const e of ts){G.beams.push({pts:[[e.x,e.y-420],[e.x,e.y]],t:.2,dur:.2,col:'#cfe9ff'});explode(e.x,e.y,(c.stormDmg?60:50)*area,(c.stormDmg||c.dmg)*s.dmg*.6,{shake:0});}}
  if(id==='archmind'){const a0=pickArr(nearestEnemies(p.x,p.y,6));if(a0){G.zones.push({type:'void',x:a0.x,y:a0.y,r:c.aoe*area,t:2,dur:2,dps:c.dmg*s.dmg*.5,pull:200,tick:0});}
   const ts=nearestEnemies(p.x,p.y,c.n||3);for(let i=0;i<(c.n||3);i++){const t=ts[i%ts.length],a=Math.atan2(t.y-p.y,t.x-p.x);G.bullets.push({x:p.x,y:p.y,vx:Math.cos(a)*260,vy:Math.sin(a)*260,r:5,kind:'arcane',elem:'✦',homing:true,dmg:c.dmg*s.dmg*.5,pierce:0,life:2.6,hit:new Set(),col:'#c99bff'});}}
  if(id==='astrape'){const ts=nearestEnemies(p.x,p.y,c.n);for(const t of ts){G.beams.push({pts:[[t.x,t.y-420],[t.x,t.y]],t:.25,dur:.25,col:'#eaf7ff'});explode(t.x,t.y,c.aoe*area,c.dmg*s.dmg,{knock:220,shake:4});}}
  sfx('zap');G.shake=Math.max(G.shake,4);return true;}
 case'storm':{const ts=nearestEnemies(p.x,p.y,c.n);if(!ts.length)return false;for(const e of ts){G.beams.push({pts:[[e.x+rnd(-20,20),e.y-420],[e.x,e.y]],t:.2,dur:.2,col:'#cfe9ff'});explode(e.x,e.y,46*Math.sqrt(s.area),c.dmg*s.dmg,{shake:0});}sfx('zap');return true;}
 case'meteor':{const ts=nearestEnemies(p.x,p.y,6);if(!ts.length)return false;for(let i=0;i<c.n;i++){const an=pickArr(ts);G.zones.push({type:'meteor',x:an.x+rnd(-14,14),y:an.y+rnd(-14,14),r:c.aoe*area,t:.9,dur:.9,dmg:c.dmg*s.dmg,burn:c.burn*s.burnMult});}return true;}
 case'plague':case'blackdeath':{const ts=nearestEnemies(p.x,p.y,4);if(!ts.length)return false;const a0=pickArr(ts);
  G.zones.push({type:'plague',x:a0.x,y:a0.y,r:(id==='blackdeath'?c.r:c.r)*area,dur:c.dur,tick:0,dps:c.dps*s.dmg});
  if(id==='blackdeath'){const near=G.enemies.filter(e=>!e.dead&&Math.hypot(e.x-p.x,e.y-p.y)<160*area);for(const e of near)dealDamage(e,c.drain*s.dmg,{elem:'†'});if(near.length)p.hp=Math.min(p.maxhp,p.hp+c.heal);}
  return true;}
 case'nova':{const near=G.enemies.filter(e=>!e.dead&&Math.hypot(e.x-p.x,e.y-p.y)<c.aoe*area*1.4);if(!near.length)return false;explode(p.x,p.y,c.aoe*area,c.dmg*s.dmg,{slow:c.slow,knock:220,shake:3});sfx('boom');return true;}
 case'lifedrain':{const near=G.enemies.filter(e=>!e.dead&&Math.hypot(e.x-p.x,e.y-p.y)<c.r*area);if(!near.length)return false;for(const e of near)dealDamage(e,c.dmg*s.dmg,{elem:'†'});p.hp=Math.min(p.maxhp,p.hp+c.heal);return true;}
 case'shield':case'archon':{const r=id==='archon'?c.aoe:c.aoe;const near=G.enemies.filter(e=>!e.dead&&Math.hypot(e.x-p.x,e.y-p.y)<r*area*1.2);if(!near.length)return false;explode(p.x,p.y,r*area,c.pulse*s.dmg,{knock:260,shake:4});sfx('boom');return true;}
 case'ball':{const ts=nearestEnemies(p.x,p.y,c.n);if(!ts.length)return false;for(let i=0;i<c.n;i++){const t=ts[i%ts.length],a=Math.atan2(t.y-p.y,t.x-p.x)+rnd(-.3,.3);G.orbs.push({x:p.x,y:p.y,vx:Math.cos(a)*95,vy:Math.sin(a)*95,r:c.r,dmg:c.dmg*s.dmg,life:4,tick:0});}return true;}
 case'cyclone':case'vortex':return true; /* пассивные, см. updateCyclone */
 case'ray':case'laserstorm':return true; /* пассивные, см. updateRay */
 case'aura':return true; /* пассивная, см. updateAura */
 case'ring':return true; /* пассивное, см. updateRing */
 case'skeletons':return true; /* пассивное, см. updateSkel */
 case'incineration':case'hellfire':case'sunlord':{const ts=nearestEnemies(p.x,p.y,4);if(!ts.length)return false;const a0=pickArr(ts);
  explode(a0.x,a0.y,c.aoe*area,c.dmg*s.dmg,{burn:(c.burn||14)*s.burnMult,knock:120,shake:2});
  const bn=id==='hellfire'?c.n:(c.boom||2);
  for(let i=0;i<bn;i++)G.zones.push({type:'delayed',t:.3*(i+1),x:a0.x+Math.cos(i/bn*TAU)*80,y:a0.y+Math.sin(i/bn*TAU)*80,r:c.aoe*area*.75,dmg:c.dmg*s.dmg*.6,col:'#ff9a3d'});
  return true;}
 case'lavazone':{const ts=nearestEnemies(p.x,p.y,4);if(!ts.length)return false;const a0=pickArr(ts);G.zones.push({type:'lava',x:a0.x,y:a0.y,r:c.r*area,dur:c.dur,tick:0,dps:c.dps*s.dmg,burn:c.burn*s.burnMult});return true;}
 case'flameblink':case'gravestep':case'stormstep':{const dx=Math.cos(p.face),dy=Math.sin(p.face);
  explode(p.x,p.y,c.aoe*area,c.dmg*s.dmg,{knock:140,shake:2,stun:c.stun||0});
  p.x=clamp(p.x+dx*c.dist,20,WORLD-20);p.y=clamp(p.y+dy*c.dist,20,WORLD-20);
  explode(p.x,p.y,c.aoe*area,c.dmg*s.dmg,{knock:140,shake:2,stun:c.stun||0});
  p.ifr=Math.max(p.ifr,.4);return true;}
 case'gravefield':{const ts=nearestEnemies(p.x,p.y,4);if(!ts.length)return false;const a0=pickArr(ts);G.zones.push({type:'grave',x:a0.x,y:a0.y,r:c.r*area,dur:c.dur,tick:0,dps:c.dps*s.dmg});return true;}
 case'staticfield':{const ts=nearestEnemies(p.x,p.y,4);if(!ts.length)return false;const a0=pickArr(ts);G.zones.push({type:'static',x:a0.x,y:a0.y,r:c.r*area,dur:c.dur,tick:0,dps:c.dps*s.dmg});return true;}
 case'tsunami':{const ts=nearestEnemies(p.x,p.y,c.n);if(!ts.length)return false;for(const t of ts){const a=Math.atan2(t.y-p.y,t.x-p.x);G.bullets.push({x:p.x,y:p.y,vx:Math.cos(a)*260,vy:Math.sin(a)*260,r:c.r,kind:'pierce',elem:'≈',slow:true,dmg:c.dmg*s.dmg,pierce:999,life:1.6,hit:new Set(),col:'#6ecbff'});}return true;}
 case'blizzard':case'etherblaze':{const ts=nearestEnemies(p.x,p.y,c.n);if(!ts.length)return false;
  for(const t of ts){explode(t.x,t.y,c.aoe*area,c.dmg*s.dmg,{slow:true,shake:0});
   if(id==='etherblaze')for(let i=0;i<2;i++)G.zones.push({type:'delayed',t:.25,x:t.x+rnd(-50,50),y:t.y+rnd(-50,50),r:c.aoe*area*.7,dmg:c.dmg*s.dmg*.8,col:'#ff9a3d'});}
  return true;}
 case'phoenix':{const near=G.enemies.filter(e=>!e.dead&&Math.hypot(e.x-p.x,e.y-p.y)<c.aoe*area*1.3);if(!near.length)return false;
  explode(p.x,p.y,c.aoe*area,c.dmg*s.dmg,{slow:true,knock:200,shake:3});
  const ts=nearestEnemies(p.x,p.y,c.n);for(const t of ts)G.zones.push({type:'delayed',t:.4,x:t.x,y:t.y,r:70*area,dmg:c.dmg*s.dmg*.6,col:'#ff9a3d'});return true;}
 case'lich':{const ts=nearestEnemies(p.x,p.y,c.n);if(!ts.length)return false;
  for(const t of ts){const a=Math.atan2(t.y-p.y,t.x-p.x);G.bullets.push({x:p.x,y:p.y,vx:Math.cos(a)*540,vy:Math.sin(a)*540,r:6,kind:'pierce',elem:'†',dmg:c.dmg*s.dmg,pierce:8,life:1.8,hit:new Set(),col:'#b18cff'});}
  const a0=pickArr(ts);G.zones.push({type:'plague',x:a0.x,y:a0.y,r:c.aoe*area*.8,dur:3,tick:0,dps:c.dps*s.dmg});
  explode(p.x,p.y,c.aoe*area*.7,c.dmg*s.dmg*.5,{knock:160,shake:3});p.hp=Math.min(p.maxhp,p.hp+c.heal);return true;}
 }return false;}
/* ---------- update ---------- */
function update(dt){const p=G.player,s=G.stats,P=BALANCE.player;
 G.t+=dt;if(!G.endless&&G.t>=600){winGame();return;}
 G.invertT=Math.max(0,(G.invertT||0)-dt);G.actIntroT=Math.max(0,(G.actIntroT||0)-dt);G.noiseT=Math.max(0,(G.noiseT||0)-dt);
 {const ai=Math.min(3,Math.floor(G.t/150));if(ai!==G.lastAct){G.lastAct=ai;sting();banner('АКТ '+(ai+1)+' — '+ACTS[ai].name);}}
 const PL=BALANCE.pets.levels;while(G.pets.length<PL.length&&p.level>=PL[G.pets.length])spawnPet();
 let dx=(keys.KeyD||keys.ArrowRight?1:0)-(keys.KeyA||keys.ArrowLeft?1:0);
 let dy=(keys.KeyS||keys.ArrowDown?1:0)-(keys.KeyW||keys.ArrowUp?1:0);
 if(!dx&&!dy&&mouse.down){const wx=G.cam.x+(mouse.x-W/2),wy=G.cam.y+(mouse.y-H/2);const d=Math.hypot(wx-p.x,wy-p.y);if(d>12){dx=(wx-p.x)/d;dy=(wy-p.y)/d;}}
 const dl=Math.hypot(dx,dy);
 if(dl>0){const sp=P.speed*s.spdMul*(G.mode==='shooter'?shootMods().spd:1);p.x+=dx/dl*sp*dt;p.y+=dy/dl*sp*dt;p.face=Math.atan2(dy,dx);}
 p.x=clamp(p.x,20,WORLD-20);p.y=clamp(p.y,20,WORLD-20);
  if(G.bossRef&&G.bossArena){const ba=G.bossArena,dx=p.x-ba.x,dy=p.y-ba.y,d=Math.hypot(dx,dy);
   if(d>ba.r&&d>.01){p.x=ba.x+dx/d*ba.r;p.y=ba.y+dy/d*ba.r;}}
  G.beamFx=Math.max(0,(G.beamFx||0)-dt);
  G.interT=Math.max(0,(G.interT||0)-dt);
  if(G.prep>0){G.prep-=dt;
   G.travT-=dt;if(G.travT<=0){G.travT=.9;spawnShooterEnemy();}
   if(G.prep<=0){G.prep=0;startShooter();}}
 p.ifr-=dt;G.hitFlash=Math.max(0,G.hitFlash-dt*1.4);
 p.hp=Math.min(p.maxhp,p.hp+(P.regen+s.regen)*dt);
 G.vampBudget=Math.min(P.vampCapPerSec,G.vampBudget+P.vampCapPerSec*dt);
 if(G.bossWarn>0){G.bossWarn-=dt;if(G.bossWarn<=0){spawnBoss(G.bossWarnIdx);G.bossWarn=0;}}
 G.ambT-=dt;if(G.ambT<=0){G.ambT=2.2;ambient(Math.min(3,Math.floor(G.t/150)));}
 G.logT-=dt;
 if(G.logT<=0){G.logT=10;G.telemetry.push({t:Math.round(G.t),hp:Math.round(p.hp),lv:p.level,k:G.kills,g:G.gold,en:G.enemies.length});}
 if(s.clockwork){G.clockT-=dt;if(G.clockT<=0){G.clockT=20;for(const e of G.enemies)if(!e.dead&&!e.boss)e.stunT=2;fxRing(p.x,p.y,40,320,'#7ee8fa',.6);banner('o ВРЕМЯ');}}
 if(G.ev){G.ev.dur-=dt;
  if(G.ev.type==='bless')p.hp=Math.min(p.maxhp,p.hp+1*dt);
  if(G.ev.type==='meteor'){G.ev.mt-=dt;if(G.ev.mt<=0){G.ev.mt=.5;const t=nearestEnemy(p.x,p.y);const x=t?t.x+rnd(-80,80):p.x+rnd(-200,200),y=t?t.y+rnd(-80,80):p.y+rnd(-200,200);G.zones.push({type:'meteor',x,y,r:70,t:.8,dur:.8,dmg:30*s.dmg,burn:10});}}
  if(G.ev.dur<=0)G.ev=null;}
 if(s.stormgem){s.stormgemT-=dt;if(s.stormgemT<=0){s.stormgemT=6;const ts=nearestEnemies(p.x,p.y,3);if(ts.length){for(const e of ts){G.beams.push({pts:[[e.x,e.y-380],[e.x,e.y]],t:.2,dur:.2,col:'#cfe9ff'});explode(e.x,e.y,40,40*s.dmg,{shake:0});}sfx('zap');}}}
 let cdrMul=s.cdr*(1-synSum('cdr'));if(s.accelerator)cdrMul*=Math.max(.55,1-Math.max(0,s.spdMul-1)*.6);
 for(const id in G.spells){const def=SPELL_DEF[id];if(!def.cd)continue;G.timers[id]=(G.timers[id]||0)-dt;if(G.timers[id]<=0)G.timers[id]=tryCast(id,G.spells[id])?def.cd*Math.max(.3,cdrMul):.15;}
 updateRing(dt);updateSkel(dt);updateAura(dt);updateRay(dt);updateCyclone(dt);updateMirages(dt);updatePets(dt);
  for(const sy of activeSynergies())if(!G.synShown.has(sy.id)){G.synShown.add(sy.id);G.synCard={sy,t:2.8};sfx('level');}
  if(G.synCard){G.synCard.t-=dt;if(G.synCard.t<=0)G.synCard=null;}
 for(const b of G.bullets){b.age=(b.age||0)+dt;b.life-=dt;if(b.life<=0){b.dead=true;continue;}
  if(b.return){if(!b.ret&&b.age>=b.maxLife*.5){b.ret=true;b.hit.clear();}
   if(b.ret){const a=Math.atan2(p.y-b.y,p.x-b.x);b.vx=Math.cos(a)*500;b.vy=Math.sin(a)*500;if(Math.hypot(p.x-b.x,p.y-b.y)<26){b.dead=true;continue;}}}
  if(b.homing){const t=nearestEnemy(b.x,b.y);if(t){const w=Math.atan2(t.y-b.y,t.x-b.x),cu=Math.atan2(b.vy,b.vx);let d=((w-cu+Math.PI*3)%TAU)-Math.PI;const a2=cu+d*6*dt;b.vx=Math.cos(a2)*340;b.vy=Math.sin(a2)*340;}}
  b.x+=b.vx*dt;b.y+=b.vy*dt;
  for(const e of G.enemies){if(e.dead||b.hit.has(e.uid))continue;
   if(Math.hypot(e.x-b.x,e.y-b.y)<e.r+b.r){b.hit.add(e.uid);
    if(b.kind==='fire'){explode(b.x,b.y,b.aoe,b.dmg,{burn:b.burn});b.dead=true;}
    else{dealDamage(e,b.dmg,{elem:b.elem});if(b.slow){e.slowT=2;e.slowM=.5;}b.pierce--;if(b.pierce<0)b.dead=true;}break;}}}
 G.bullets=G.bullets.filter(b=>!b.dead);
 for(const o of G.orbs){o.life-=dt;if(o.life<=0){o.dead=true;continue;}o.x+=o.vx*dt;o.y+=o.vy*dt;
  if(o.x<o.r||o.x>WORLD-o.r)o.vx*=-1;if(o.y<o.r||o.y>WORLD-o.r)o.vy*=-1;
  o.tick-=dt;if(o.tick<=0){o.tick=.28;for(const e of G.enemies){if(e.dead)continue;if(Math.hypot(e.x-o.x,e.y-o.y)<e.r+o.r){dealDamage(e,o.dmg,{elem:'O'});}}}}
 G.orbs=G.orbs.filter(o=>!o.dead);
 for(const e of G.enemies){if(e.dead)continue;
  e.flash-=dt;e.stunT-=dt;e.slowT-=dt;
  if(e.aff==='regen')e.hp=Math.min(e.maxhp,e.hp+e.maxhp*.03*dt);
  if(e.aff==='thorns'&&Math.hypot(p.x-e.x,p.y-e.y)<e.r+22)damagePlayer(e.dmg*.4);
  for(let i=e.dots.length-1;i>=0;i--){const d=e.dots[i];e.hp-=d.dps*dt;d.t-=dt;if(d.t<=0)e.dots.splice(i,1);}
  if(e.hp<=0){kill(e,'dot');continue;}
  if(e.sh){
   e.shPh+=dt*e.shF;const m=e.shMode||'sine';
   if(m==='straight')e.y+=e.shV*dt;
   else if(m==='sine'){e.x+=Math.sin(e.shPh)*e.shA*dt;e.y+=e.shV*dt;}
   else if(m==='dive'){const a=Math.atan2(p.y-e.y,p.x-e.x);e.x+=Math.cos(a)*e.shV*1.3*dt;e.y+=Math.sin(a)*e.shV*1.3*dt;}
   else if(m==='hover'){if(e.y<p.y-160)e.y+=e.shV*dt;else e.x+=Math.sin(e.shPh)*e.shA*dt;}
   e.x=clamp(e.x,20,WORLD-20);
   e.y+=Math.sin(e.shPh)*22*dt;
   if(e.shMode!=='dive'&&e.y>p.y-150)e.y-=140*dt;
   if(e.y<p.y-H/2-260)e.y+=80*dt;
   if(e.y>p.y+140){e.y=p.y-H/2-rnd(0,220);e.x=clamp(p.x+rnd(-W,W)*.8,30,WORLD-30);e.shootT=rnd(1,2);}
if(e.sent&&e.y<p.y+H/2){e.shootT-=dt;
     if(e.shootT<=0){e.shootT=1.6;const a=Math.atan2(p.y-e.y,p.x-e.x);
      for(let i=-2;i<=2;i++){const aa=a+i*.16;
       G.ebullets.push({x:e.x,y:e.y,vx:Math.cos(aa)*200,vy:Math.sin(aa)*200,r:6,dmg:e.dmg*.8,life:3});}}}
    else if((e.type==='shooter'||m==='hover')&&e.y<p.y+H/2){e.shootT-=dt;
     if(e.shootT<=0){e.shootT=rnd(1.2,2);const a=Math.atan2(p.y-e.y,p.x-e.x);
      if(m==='hover'&&G.stage>=2){for(let i=-1;i<=1;i++){const aa=a+i*.3;
       G.ebullets.push({x:e.x,y:e.y,vx:Math.cos(aa)*190,vy:Math.sin(aa)*190,r:5,dmg:e.dmg*.8,life:3});}}
      else G.ebullets.push({x:e.x,y:e.y,vx:Math.cos(a)*190,vy:Math.sin(a)*190,r:5,dmg:e.dmg*.8,life:3});}}}
  else if(e.spd>0&&e.stunT<=0){
   const a=Math.atan2(p.y-e.y,p.x-e.x),d=Math.hypot(p.x-e.x,p.y-e.y)||1;
   let sp=e.spd*(e.slowT>0?e.slowM:1);if(G.ev&&G.ev.type==='fog')sp*=.85;if(G.vowSpdMul)sp*=G.vowSpdMul;
   if(e.type==='shooter'){e.shootT=(e.shootT||2)-dt;const dir=d>300?1:d<220?-1:0;const sa=a+Math.PI/2*((e.uid%2)?1:-1);
    e.x+=(Math.cos(a)*dir*.7+Math.cos(sa)*.5)*sp*dt+e.kx*dt;e.y+=(Math.sin(a)*dir*.7+Math.sin(sa)*.5)*sp*dt+e.ky*dt;
    if(e.shootT<=0&&d<380){e.shootT=3.2;G.ebullets.push({x:e.x,y:e.y,vx:Math.cos(a)*180,vy:Math.sin(a)*180,r:5,dmg:8,life:2.5});}}
   else if(e.type==='healer'){e.healT=(e.healT||2.5)-dt;let ally=null,bd=1e18;
    for(const o of G.enemies){if(o===e||o.dead||o.type==='healer')continue;const dd=(o.x-e.x)**2+(o.y-e.y)**2;if(dd<bd&&o.hp<o.maxhp){bd=dd;ally=o;}}
    let dx2=0,dy2=0;
    if(ally&&bd<90000){const aa=Math.atan2(ally.y-e.y,ally.x-e.x);dx2=Math.cos(aa);dy2=Math.sin(aa);}
    else if(d<200){dx2=-Math.cos(a);dy2=-Math.sin(a);}
    e.x+=dx2*.8*sp*dt+e.kx*dt;e.y+=dy2*.8*sp*dt+e.ky*dt;
    if(e.healT<=0){e.healT=2.5;for(const o of G.enemies){if(o===e||o.dead)continue;if((o.x-e.x)**2+(o.y-e.y)**2<19600&&o.hp<o.maxhp)o.hp=Math.min(o.maxhp,o.hp+o.maxhp*.15);}}}
   else{e.x+=Math.cos(a)*sp*dt+e.kx*dt;e.y+=Math.sin(a)*sp*dt+e.ky*dt;}}
  const kd=Math.pow(.02,dt);e.kx*=kd;e.ky*=kd;e.x=clamp(e.x,15,WORLD-15);e.y=clamp(e.y,15,WORLD-15);
  if(e.boss||e.type==='tower'||e.type==='guard'){e.shootT-=dt;if(e.shootT<=0){
   const BO=BALANCE.bosses,TO=BALANCE.towers;
   if(e.type==='tower'){e.shootT=TO.shootEvery;const base=Math.atan2(p.y-e.y,p.x-e.x);
    for(let i=0;i<TO.projCount;i++){const a=base+(i-TO.projCount/2)*.2;G.ebullets.push({x:e.x,y:e.y,vx:Math.cos(a)*110,vy:Math.sin(a)*110,r:5,dmg:TO.projDmg,life:8});}}
   else if(e.type==='guard'){e.shootT=3;const cnt=3+G.bossIdx;
    for(let i=0;i<cnt;i++){const a=i/cnt*TAU+G.t;G.ebullets.push({x:e.x,y:e.y,vx:Math.cos(a)*120,vy:Math.sin(a)*120,r:8,dmg:16,life:8});}}
   else{e.shootT=BO.shootEvery;const cnt=BO.projCountBase+G.bossIdx*2;
    for(let i=0;i<cnt;i++){const a=i/cnt*TAU+G.t;G.ebullets.push({x:e.x,y:e.y,vx:Math.cos(a)*110,vy:Math.sin(a)*110,r:9,dmg:BO.projDmg,life:8});}}}}
  const E=BALANCE.enemies;
  if(Math.hypot(e.x-p.x,e.y-p.y)<e.r+p.r)damagePlayer(e.dmg*(1+G.t/E.dmgGrowthT)*(1+((G.diff||1)-1)*E.diffDmg));}
 const es=G.enemies,n=es.length;
 for(let i=0;i<n;i++){const a=es[i];if(a.dead||a.type==='tower')continue;
  for(let j=i+1;j<n;j++){const b=es[j];if(b.dead||b.type==='tower')continue;
   const dx2=b.x-a.x,dy2=b.y-a.y,rr=a.r+b.r,d2=dx2*dx2+dy2*dy2;
   if(d2<rr*rr&&d2>.01){const d=Math.sqrt(d2),pu=(rr-d)/2/d*.6;a.x-=dx2*pu;a.y-=dy2*pu;b.x+=dx2*pu;b.y+=dy2*pu;}}}
 G.enemies=G.enemies.filter(e=>!e.dead);
 for(const b of G.ebullets){b.life-=dt;b.x+=b.vx*dt;b.y+=b.vy*dt;
  if(b.life<=0||b.x<-60||b.x>WORLD+60||b.y<-60||b.y>WORLD+60){b.dead=true;continue;}
  if(Math.hypot(b.x-p.x,b.y-p.y)<b.r+p.r){damagePlayer(b.dmg);b.dead=true;}}
 G.ebullets=G.ebullets.filter(b=>!b.dead);
 for(const h of G.hearts){h.t+=dt;const d=Math.hypot(p.x-h.x,p.y-h.y);
  if(d<BALANCE.economy.heartMagnet){const a=Math.atan2(p.y-h.y,p.x-h.x);const sp=clamp(520-d,160,500);h.x+=Math.cos(a)*sp*dt;h.y+=Math.sin(a)*sp*dt;}
  if(d<p.r+10){h.dead=true;p.hp=Math.min(p.maxhp,p.hp+BALANCE.economy.heartHeal);sfx('heal');dmgText(p.x,p.y,'+'+BALANCE.economy.heartHeal,'#ff8fa3');}}
 G.hearts=G.hearts.filter(h=>!h.dead);
 for(const ch of G.chests){ch.t+=dt;if(Math.hypot(p.x-ch.x,p.y-ch.y)<36){ch.dead=true;openChest(ch);}}
 G.chests=G.chests.filter(c=>!c.dead);
 if(G.merchant&&G.merchantCd<=0&&Math.hypot(G.merchant.x-p.x,G.merchant.y-p.y)<48){openShop();}
 for(const z of G.zones){
  if(z.type==='meteor'){z.t-=dt;if(z.t<=0){z.dead=true;explode(z.x,z.y,z.r,z.dmg,{burn:z.burn,shake:6,boom:true});}}
  else if(z.type==='delayed'){z.t-=dt;if(z.t<=0){z.dead=true;explode(z.x,z.y,z.r,z.dmg,{knock:100});}}
  else if(z.type==='plague'){z.dur-=dt;z.tick-=dt;if(z.tick<=0){z.tick=.5;for(const e of G.enemies){if(e.dead)continue;if(Math.hypot(e.x-z.x,e.y-z.y)<z.r+e.r)dealDamage(e,z.dps*.5,{elem:'∵'});}}if(z.dur<=0)z.dead=true;}
  else if(z.type==='lava'){z.dur-=dt;z.tick-=dt;if(z.tick<=0){z.tick=.5;for(const e of G.enemies){if(e.dead)continue;if(Math.hypot(e.x-z.x,e.y-z.y)<z.r+e.r){dealDamage(e,z.dps*.5,{elem:'*'});addDot(e,z.burn,2);}}}if(z.dur<=0)z.dead=true;}
  else if(z.type==='grave'){z.dur-=dt;z.tick-=dt;if(z.tick<=0){z.tick=.5;for(const e of G.enemies){if(e.dead)continue;if(Math.hypot(e.x-z.x,e.y-z.y)<z.r+e.r){e.slowT=1.5;e.slowM=.5;dealDamage(e,z.dps*.5,{elem:'†'});}}}if(z.dur<=0)z.dead=true;}
  else if(z.type==='static'){z.dur-=dt;z.tick-=dt;if(z.tick<=0){z.tick=.5;for(const e of G.enemies){if(e.dead)continue;if(Math.hypot(e.x-z.x,e.y-z.y)<z.r+e.r){e.slowT=1;e.slowM=.6;dealDamage(e,z.dps*.5,{elem:'z'});}}}if(z.dur<=0)z.dead=true;}
  else if(z.type==='void'){z.t-=dt;z.tick-=dt;
   for(const e of G.enemies){if(e.dead||e.boss||e.type==='tower')continue;const d=Math.hypot(e.x-z.x,e.y-z.y);if(d<z.r*1.6&&d>1){const a=Math.atan2(z.y-e.y,z.x-e.x);e.x+=Math.cos(a)*z.pull*dt;e.y+=Math.sin(a)*z.pull*dt;}}
   if(z.tick<=0){z.tick=.4;for(const e of G.enemies){if(e.dead)continue;if(Math.hypot(e.x-z.x,e.y-z.y)<z.r)dealDamage(e,z.dps*.4,{elem:'O'});}}
   if(z.t<=0)z.dead=true;}
  else{z.t-=dt;if(z.t<=0)z.dead=true;}}
 G.zones=G.zones.filter(z=>!z.dead);
 for(const b of G.beams)b.t-=dt;G.beams=G.beams.filter(b=>b.t>0);
 for(const q of G.parts){q.t-=dt;q.x+=q.vx*dt;q.y+=q.vy*dt;q.vx*=.96;q.vy*=.96;}
 G.parts=G.parts.filter(q=>q.t>0);
 for(const t of G.texts){t.t-=dt;t.y-=34*dt;}G.texts=G.texts.filter(t=>t.t>0);
if(G.mode==='shooter'||G.prep>0)updateShooter(dt);else director(dt);
 const k=1-Math.pow(.001,dt);G.cam.x=lerp(G.cam.x,p.x,k);G.cam.y=lerp(G.cam.y,p.y,k);
 G.cam.x=clamp(G.cam.x,Math.min(W/2,WORLD/2),Math.max(WORLD-W/2,WORLD/2));
 G.cam.y=clamp(G.cam.y,Math.min(H/2,WORLD/2),Math.max(WORLD-H/2,WORLD/2));
 G.shake=Math.max(0,G.shake-26*dt);}
function updateRing(dt){if(!G.spells.ring)return;const p=G.player,c=SPELL_DEF.ring.lv[G.spells.ring-1];
 G.ringAng+=dt*2.2*(1+synSum('ringSpd'));G.ringTick-=dt;G.ringPos=[];
 for(let i=0;i<c.n;i++){const a=G.ringAng+i/c.n*TAU;G.ringPos.push({x:p.x+Math.cos(a)*c.r,y:p.y+Math.sin(a)*c.r});}
 if(G.ringTick<=0){G.ringTick=.4;const dm=c.dmg*G.stats.dmg*(1+synSum('minionDmg'));
  for(const f of G.ringPos)for(const e of G.enemies){if(e.dead)continue;if(Math.hypot(e.x-f.x,e.y-f.y)<e.r+14){dealDamage(e,dm,{elem:'*'});}}}}
function updateSkel(dt){if(!G.spells.skeletons)return;const p=G.player,c=SPELL_DEF.skeletons.lv[G.spells.skeletons-1];
 const need=c.n+G.stats.skelBonus+Math.round(synSum('skel'));
 while(G.minions.length<need)G.minions.push({off:rnd(0,TAU),bob:rnd(0,TAU)});G.minions.length=need;
 G.skelTick-=dt;const tick=G.skelTick<=0;if(tick)G.skelTick=.4;
 const dm=c.dmg*G.stats.dmg*(1+synSum('minionDmg'));
 for(const m of G.minions){const a=G.t*1.5*(1+synSum('ringSpd'))+m.off;m.x=p.x+Math.cos(a)*c.r;m.y=p.y+Math.sin(a)*c.r;m.bob+=dt*6;
  if(tick)for(const e of G.enemies){if(e.dead)continue;if(Math.hypot(e.x-m.x,e.y-m.y)<e.r+13)dealDamage(e,dm,{elem:'†'});}}}
function updateAura(dt){if(!G.spells.aura)return;const p=G.player,c=SPELL_DEF.aura.lv[G.spells.aura-1];
 G.auraTick-=dt;if(G.auraTick<=0){G.auraTick=.5;const dm=c.dps*.5*(1+synSum('minionDmg'));
  for(const e of G.enemies){if(e.dead)continue;if(Math.hypot(e.x-p.x,e.y-p.y)<c.r+e.r)dealDamage(e,dm,{elem:'∴'});}}}
function updateRay(dt){const p=G.player,s=G.stats;
 if(G.spells.laserstorm){const c=SPELL_DEF.laserstorm.lv[0];G.rayMode='laser';G.rayN=1;G.rayRange=c.range;
  G.rayAng+=dt*2.6*(1+synSum('ringSpd')*.5);G.rayTick-=dt;
  if(G.rayTick<=0){G.rayTick=.25;const dx=Math.cos(G.rayAng),dy=Math.sin(G.rayAng);
   for(const e of G.enemies){if(e.dead)continue;const px=e.x-p.x,py=e.y-p.y,pr=px*dx+py*dy;
    if(pr>0&&pr<c.range&&Math.abs(px*dy-py*dx)<e.r+c.width)dealDamage(e,c.dmg*s.dmg,{elem:'|'});}}}
 else if(G.spells.ray){const c=SPELL_DEF.ray.lv[G.spells.ray-1];const n=c.n+s.raysBonus;G.rayMode='ray';G.rayN=n;G.rayRange=c.range;
  G.rayAng+=dt*1.5*(1+synSum('ringSpd')*.5);G.rayTick-=dt;
  if(G.rayTick<=0){G.rayTick=.25;
   for(let i=0;i<n;i++){const a=G.rayAng+i/n*TAU,dx=Math.cos(a),dy=Math.sin(a);
    for(const e of G.enemies){if(e.dead)continue;const px=e.x-p.x,py=e.y-p.y,pr=px*dx+py*dy;
     if(pr>0&&pr<c.range&&Math.abs(px*dy-py*dx)<e.r+9)dealDamage(e,c.dmg*s.dmg,{elem:'|'});}}}}
 else{G.rayMode=null;G.rayN=0;}}
function updateMirages(dt){if(!G.spells.mirror&&!G.spells.avatar){G.mirrorPos=[];return;}
 const n=((G.spells.avatar?SPELL_DEF.avatar.lv[0].n:SPELL_DEF.mirror.lv[G.spells.mirror-1].n))+G.stats.mirrorBonus;
 G.mirrorAng+=dt*1.3;G.mirrorPos=[];
 for(let i=0;i<n;i++){const a=G.mirrorAng+i/n*TAU;G.mirrorPos.push({x:G.player.x+Math.cos(a)*56,y:G.player.y+Math.sin(a)*56});}}
function updateCyclone(dt){const p=G.player,s=G.stats;let par=null;
 if(G.spells.vortex)par=SPELL_DEF.vortex.lv[0];else if(G.spells.cyclone)par=SPELL_DEF.cyclone.lv[G.spells.cyclone-1];
 if(!par){G.cycPos=[];return;}
 G.cycAng+=dt*(G.spells.vortex?1.9:1.2)*(1+synSum('ringSpd')*.5);
 const orbR=G.spells.vortex?175:150;G.cycPos=[];
 for(let i=0;i<par.n;i++){const a=G.cycAng+i/par.n*TAU;G.cycPos.push({x:p.x+Math.cos(a)*orbR,y:p.y+Math.sin(a)*orbR,r:par.r});}
 G.cycTick-=dt;const pull=par.pull*(1+synSum('pull'));const dm=par.dmg*s.dmg*(s.electro?1.4:1)*(1+synSum('minionDmg'));
 if(G.cycTick<=0){G.cycTick=.4;
  for(const cp of G.cycPos)for(const e of G.enemies){if(e.dead||e.boss||e.type==='tower')continue;
   const d=Math.hypot(e.x-cp.x,e.y-cp.y);
   if(d<par.r+e.r){dealDamage(e,dm,{elem:'Ø'});if(d>6){const a=Math.atan2(cp.y-e.y,cp.x-e.x);e.x+=Math.cos(a)*pull*.4;e.y+=Math.sin(a)*pull*.4;}}}}}