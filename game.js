'use strict';
/* ===== game.js: состояние и игровая логика ===== */
const cv=$('cv'),ctx=cv.getContext('2d');
let W=0,H=0,DPR=1;
function resize(){DPR=Math.min(2,window.devicePixelRatio||1);W=innerWidth;H=innerHeight;
 cv.width=W*DPR;cv.height=H*DPR;ctx.setTransform(DPR,0,0,DPR,0,0);}
addEventListener('resize',resize);resize();

let actx=null,muted=false,lastPick=0;
function initAudio(){try{if(!actx)actx=new (window.AudioContext||window.webkitAudioContext)();if(actx.state==='suspended')actx.resume();}catch(e){}}
function beep(f0,f1,dur,type,vol,delay){if(!actx||muted)return;const t0=actx.currentTime+(delay||0);const o=actx.createOscillator(),g=actx.createGain();o.type=type||'sine';o.frequency.setValueAtTime(f0,t0);o.frequency.exponentialRampToValueAtTime(Math.max(1,f1),t0+dur);g.gain.setValueAtTime(vol||.12,t0);g.gain.exponentialRampToValueAtTime(.0001,t0+dur);o.connect(g).connect(actx.destination);o.start(t0);o.stop(t0+dur+.03);}
function sfx(k){switch(k){case'pickup':beep(700,1250,.08,'sine',.05);break;case'hurt':beep(220,85,.2,'square',.14);break;case'zap':beep(950,180,.12,'sawtooth',.07);break;case'boom':beep(170,38,.32,'sine',.22);break;case'heal':beep(420,840,.2,'sine',.09);break;case'choose':beep(520,760,.09,'triangle',.1);break;case'boss':beep(130,55,.55,'sawtooth',.2);break;case'coin':beep(1100,1600,.09,'triangle',.07);break;case'buy':beep(600,900,.12,'triangle',.1);break;case'pet':beep(660,990,.15,'triangle',.12);break;case'chest':beep(880,1320,.18,'triangle',.12);break;case'time':beep(1200,300,.4,'sine',.14);break;case'level':beep(523,523,.09,'triangle',.11);beep(659,659,.09,'triangle',.11,.09);beep(880,880,.16,'triangle',.11,.18);break;}}

let state='menu',G=null,uidN=1;
const keys={};const mouse={x:0,y:0,down:false};

function startGame(key,test){
 const C=CLASSES[key];const P=BALANCE.player,E=BALANCE.enemies;
 G={key,cls:C,t:0,kills:0,endless:!!test,gold:0,test:!!test,
  speedMul:1,diff:test?3:1,
  player:{x:WORLD/2,y:WORLD/2,r:13,hp:P.hp,maxhp:P.hp,level:1,xp:0,xpNext:BALANCE.xp.start,ifr:0,face:0},
  stats:{dmg:1,cdr:1,area:1,spdMul:1,regen:0,xp:1,gold:1,armor:0,vamp:0,phoenix:0,crit:false,critN:0,stormgem:false,stormgemT:6,burnMult:1,skelBonus:0,chainBonus:0,projBonus:0,
   raysBonus:0,mirrorBonus:0,tentacles:false,accelerator:false,genome:false,scythe:false,clockwork:false,electro:false},
  spells:{},passives:{},timers:{},pendLevel:0,choiceDelay:0,
  artifacts:[],combosAcquired:new Set(),pets:[],
  vampBudget:P.vampCapPerSec,hearts:[],killsSinceHeart:0,
  chests:[],chestT:35,shopOffers:[],
  enemies:[],bullets:[],ebullets:[],parts:[],texts:[],zones:[],beams:[],orbs:[],minions:[],
  spawnT:.5,waveT:BALANCE.waves.every,bossIdx:0,spawnCount:0,shake:0,hitFlash:0,
  ringAng:0,ringTick:0,skelTick:0,ringPos:[],auraTick:0,
  rayAng:0,rayTick:0,rayMode:null,rayN:0,rayRange:0,
  cycAng:0,cycTick:0,cycPos:[],
  mirrorAng:0,mirrorPos:[],clockT:20,
  merchantT:25,merchant:null,towerT:60,
  cam:{x:WORLD/2,y:WORLD/2},bossRef:null,
  dust:Array.from({length:70},()=>({x:rnd(0,WORLD),y:rnd(0,WORLD),r:rnd(.8,2),ph:rnd(0,TAU)})),
  deco:Array.from({length:6},(_,i)=>({x:rnd(200,WORLD-200),y:rnd(200,WORLD-200),r:rnd(90,190),s:rnd(.02,.07)*(i%2?1:-1),c:i%2?'rgba(126,232,250,.07)':'rgba(255,209,102,.06)'}))};
 G.spells[C.start]=1;
 const p0=G.player;
 for(let i=0;i<E.startRing;i++){const a=i/E.startRing*TAU+rnd(-.15,.15),d=rnd(E.startDistMin,E.startDistMax);
  spawnEnemy(i%5===0?'runner':'blob',false,
   {x:clamp(p0.x+Math.cos(a)*d,20,WORLD-20),y:clamp(p0.y+Math.sin(a)*d,20,WORLD-20)});}
 $('menu').classList.add('hide');['overOv','winOv','pauseOv','choice','shopOv','testOv'].forEach(i=>$(i).classList.add('hide'));
 $('game').classList.remove('hide');
 $('testBtn').classList.toggle('hide',!G.test);
 $('hint').style.opacity=1;setTimeout(()=>{if(G)$('hint').style.opacity=0;},8000);
 refreshBuildUI();state='play';
 banner(G.test?`🧪 ТЕСТ: ${C.name.toUpperCase()}`:`${C.name.toUpperCase()} ВЫХОДИТ НА АРЕНУ`,G.test?'#7ee8fa':C.color);
 console.log('[MS] старт игры:',C.name,'| тест:',G.test);}

function toMenu(){G=null;state='menu';$('game').classList.add('hide');['pauseOv','overOv','winOv','choice','shopOv','testOv'].forEach(i=>$(i).classList.add('hide'));$('menu').classList.remove('hide');}

function gainXP(v){const p=G.player;p.xp+=v*G.stats.xp;
 let leveled=false;
 while(p.xp>=p.xpNext){p.xp-=p.xpNext;p.level++;G.pendLevel++;
  p.xpNext=Math.round(BALANCE.xp.base*Math.pow(p.level,BALANCE.xp.power)+BALANCE.xp.add);
  p.hp=Math.min(p.maxhp,p.hp+BALANCE.player.healOnLevel);
  sfx('level');fxRing(p.x,p.y,10,60,G.cls.color,.4);
  banner(`⬆ УРОВЕНЬ ${p.level}!`,G.cls.color);
  leveled=true;}
 if(leveled)console.log('[MS] уровень →',p.level,'| очередь выбора:',G.pendLevel);}
function addGold(v){G.gold+=Math.round(v*G.stats.gold);if(performance.now()-lastPick>120){sfx('coin');lastPick=performance.now();}}

function spawnPet(){
 const d=PET_DEF[G.key];
 G.pets.push({x:G.player.x+rnd(-30,30),y:G.player.y+rnd(-30,30),r:9,col:d.col,ranged:d.ranged,
  t:0,shootT:rnd(0,.5),bob:rnd(0,TAU),orb:rnd(0,TAU)});
 banner(`🐾 ${d.name.toUpperCase()} ПРИСОЕДИНИЛСЯ!`,d.col);
 sfx('pet');fxRing(G.player.x,G.player.y,10,70,d.col,.5);
 refreshBuildUI();
 console.log('[MS] питомец выдан, всего:',G.pets.length);}
function updatePets(dt){const p=G.player;const PT=BALANCE.pets;
 const dmg=PT.baseDmg+p.level*PT.perLevel;
 for(const pet of G.pets){
  pet.bob+=dt*6;pet.t-=dt;
  const target=nearestEnemy(pet.x,pet.y);
  let dx2=0,dy2=0;
  if(target){
   const d=Math.hypot(target.x-pet.x,target.y-pet.y)||1;
   const a=Math.atan2(target.y-pet.y,target.x-pet.x);
   if(pet.ranged){
    const dir=d>240?1:d<150?-1:0;
    dx2=Math.cos(a)*dir;dy2=Math.sin(a)*dir;
    pet.shootT-=dt;
    if(pet.shootT<=0&&d<PT.shootRange){pet.shootT=PT.shootCd;
     G.bullets.push({x:pet.x,y:pet.y,vx:Math.cos(a)*380,vy:Math.sin(a)*380,r:4,kind:'pierce',dmg:dmg,pierce:0,life:.9,hit:new Set(),col:pet.col});}
   }else{
    dx2=Math.cos(a);dy2=Math.sin(a);
    if(d<target.r+pet.r+6&&pet.t<=0){pet.t=.5;dealDamage(target,dmg);burst(target.x,target.y,pet.col,3,90);}
   }
  }else{
   pet.orb+=dt*1.6;
   const ox=p.x+Math.cos(pet.orb)*48,oy=p.y+Math.sin(pet.orb)*48;
   const dd=Math.hypot(ox-pet.x,oy-pet.y);
   if(dd>6){dx2=(ox-pet.x)/dd;dy2=(oy-pet.y)/dd;}
  }
  const sp=pet.ranged?PT.rangedSpeed:PT.meleeSpeed;
  pet.x=clamp(pet.x+dx2*sp*dt,10,WORLD-10);
  pet.y=clamp(pet.y+dy2*sp*dt,10,WORLD-10);}}

/* --- выбор магии: вкладки школ --- */
function openChoice(){
 if(state!=='play'||!G||G.pendLevel<=0){console.warn('[MS] openChoice пропущен:',state,G&&G.pendLevel);return;}
 const actionable=
  Object.keys(SPELL_DEF).some(id=>!SPELL_DEF[id].combo&&(G.spells[id]||0)<SPELL_DEF[id].lv.length)||
  Object.keys(PASSIVE_DEF).some(id=>(G.passives[id]||0)<PASSIVE_DEF[id].max)||
  COMBOS.some(c=>c.cls===G.key&&!G.combosAcquired.has(c.id)&&comboConditionsMet(c));
 if(!actionable){
  G.player.hp=Math.min(G.player.maxhp,G.player.hp+G.player.maxhp*.2);
  G.pendLevel=0;sfx('heal');banner('✨ ПОЛНОЕ ВОССТАНОВЛЕНИЕ','#8ce99a');return;}
 state='choice';
 $('ctitle').textContent=`УРОВЕНЬ ${G.player.level} — ВЫБОР МАГИИ`;
 $('csub').textContent='Выберите школу. Эволюция открывается на максимуме компонентов.';
 const root=$('cards');root.innerHTML='';
 const bar=document.createElement('div');bar.className='choiceTabs';
 const pane=document.createElement('div');pane.className='choicePane';
 root.appendChild(bar);root.appendChild(pane);
 const sections=[];
 const myCombos=COMBOS.filter(c=>c.cls===G.key);
 if(myCombos.length)sections.push({key:'evo',label:'⭐ УЛЬТА',evo:true,build:()=>buildEvoGrid(myCombos)});
 for(const k of CLASS_ORDER)sections.push({key:k,label:`${CLASSES[k].icon} ${CLASSES[k].name}`,build:()=>buildSpellGrid(k)});
 sections.push({key:'pas',label:'✦ ПАССИВКИ',build:buildPassiveGrid});
 const tabs=[];
 sections.forEach((s,i)=>{
  const b=document.createElement('button');
  b.className='ctab'+(s.evo?' evoTab':'');b.textContent=s.label;
  b.onclick=()=>show(i);bar.appendChild(b);tabs.push(b);});
 function show(i){
  tabs.forEach((t,j)=>t.classList.toggle('active',i===j));
  pane.innerHTML='';pane.appendChild(sections[i].build());}
 let start=sections.findIndex(s=>s.key==='evo'&&myCombos.some(c=>comboConditionsMet(c)&&!G.combosAcquired.has(c.id)));
 if(start<0)start=Math.max(0,sections.findIndex(s=>s.key===G.key));
 show(start);
 $('choice').classList.remove('hide');}
function buildEvoGrid(list){
 const grid=document.createElement('div');grid.className='pickGrid';grid.style.width='100%';
 for(const c of list){
  const owned=G.combosAcquired.has(c.id);const ready=comboConditionsMet(c);
  const el=document.createElement('div');
  el.className='pickCard evo'+((owned||!ready)?' disabled':'');
  el.innerHTML=`<div class="pcIcon">${c.icon}</div><div class="pcName">${c.name}</div>
   <div class="pcLvl">${owned?'✔ ИЗУЧЕНА':ready?'⭐ ГОТОВА К СЛИЯНИЮ':comboReqText(c)}</div>
   <div class="pcDesc">${c.desc}</div>`;
  if(ready&&!owned)el.onclick=()=>pickCombo(c);
  grid.appendChild(el);}
 return grid;}
function buildSpellGrid(k){
 const grid=document.createElement('div');grid.className='pickGrid';grid.style.width='100%';
 const list=Object.keys(SPELL_DEF).filter(id=>!SPELL_DEF[id].combo&&spellOwner(id)===k);
 for(const id of list)grid.appendChild(spellCard(id));
 return grid;}
function buildPassiveGrid(){
 const grid=document.createElement('div');grid.className='pickGrid';grid.style.width='100%';
 for(const id in PASSIVE_DEF)grid.appendChild(passiveCard(id));
 return grid;}
function spellCard(id){
 const d=SPELL_DEF[id];const lvl=G.spells[id]||0;const mx=d.lv.length;const maxed=lvl>=mx;
 const el=document.createElement('div');
 el.className='pickCard'+(maxed?' disabled':lvl?' up':'');
 el.innerHTML=`<div class="pcIcon">${d.icon}</div><div class="pcName">${d.name}</div>
  <div class="pcLvl">${maxed?'МАКС':lvl?('УР '+R[lvl-1]+' → '+R[lvl]):'НОВОЕ'} · ${'●'.repeat(lvl)}${'○'.repeat(mx-lvl)}</div>
  <div class="pcDesc">${maxed?d.name+' достиг предела':spellDesc(id,lvl+1)}</div>`;
 if(!maxed)el.onclick=()=>pickSpell(id);
 return el;}
function passiveCard(id){
 const d=PASSIVE_DEF[id];const lvl=G.passives[id]||0;const maxed=lvl>=d.max;
 const el=document.createElement('div');
 el.className='pickCard'+(maxed?' disabled':lvl?' up':'');
 el.innerHTML=`<div class="pcIcon">${d.icon}</div><div class="pcName">${d.name}</div>
  <div class="pcLvl">${maxed?'МАКС':lvl?('УР '+R[lvl-1]+' → '+R[lvl]):'НОВОЕ'} · ${'●'.repeat(lvl)}${'○'.repeat(d.max-lvl)}</div>
  <div class="pcDesc">${d.desc}</div>`;
 if(!maxed)el.onclick=()=>pickPassive(id);
 return el;}
function pickSpell(id){if(state!=='choice')return;const d=SPELL_DEF[id];const lvl=G.spells[id]||0;
 if(lvl>=d.lv.length)return;
 G.spells[id]=lvl+1;
 banner(`${d.icon} ${d.name} ${R[lvl]}`,G.cls.color);
 finishChoice();}
function pickPassive(id){if(state!=='choice')return;const d=PASSIVE_DEF[id];const lvl=G.passives[id]||0;
 if(lvl>=d.max)return;
 G.passives[id]=lvl+1;d.apply(G);
 banner(`${d.icon} ${d.name} ${R[lvl]}`,'#7ee8fa');
 finishChoice();}
function pickCombo(c){if(state!=='choice')return;
 if(G.combosAcquired.has(c.id)||!comboConditionsMet(c))return;
 acquireCombo(c);finishChoice();}
function finishChoice(){refreshBuildUI();sfx('choose');G.pendLevel--;G.choiceDelay=.35;
 $('choice').classList.add('hide');state='play';}
function spellDesc(id,lv){const c=SPELL_DEF[id].lv[lv-1],L={dmg:'урон',n:'снарядов',aoe:'радиус',burn:'поджог/с',pierce:'пробитие',chains:'цепей',r:'радиус',heal:'лечение/тик',dps:'урон/сек',dur:'длительность',armor:'броня',pulse:'импульс',nova:'урон новы',novaR:'радиус новы',stormN:'ударов грома',stormDmg:'урон грома',pull:'притяжение',orbs:'сфер',drain:'жатва',range:'дальность',width:'ширина луча'},b=[];for(const k in L)if(c[k])b.push(`${L[k]}: ${c[k]}`);if(c.slow)b.push('замедление');return b.join(' · ');}

/* --- магазин: фиксированный ассортимент на визит --- */
function openShop(){
 state='shop';
 const owned=new Set(G.artifacts);
 const pool=ARTSHOP.filter(a=>!owned.has(a.id));
 const offers=[];
 const spec=pool.filter(a=>a.cls===G.key);
 if(spec.length)offers.push(spec[Math.random()*spec.length|0]);
 const rest=pool.filter(a=>!a.cls).sort(()=>Math.random()-.5);
 for(const a of rest){if(offers.length>=4)break;offers.push(a);}
 for(const a of pool.slice().sort(()=>Math.random()-.5)){if(offers.length>=4)break;if(!offers.includes(a))offers.push(a);}
 G.shopOffers=offers.map(a=>({a,sold:false}));
 renderShop();$('shopOv').classList.remove('hide');sfx('buy');}
function closeShop(){$('shopOv').classList.add('hide');if(state==='shop')state='play';G.merchant=null;}
function renderShop(){
 $('shopGoldBig').textContent=`💰 ${G.gold} золота`;
 $('shopNote').textContent='Ассортимент фиксирован до ухода торговца.';
 const box=$('shopItems');box.innerHTML='';
 G.shopOffers.forEach(o=>{
  const a=o.a;
  const el=document.createElement('div');el.className='shopItem'+(a.cls?' spec':'');
  el.innerHTML=`${a.cls?'<div class="siTag">КЛАССОВЫЙ</div>':''}<div class="siIcon">${a.icon}</div>
   <div class="siName">${a.name}</div><div class="siDesc">${a.desc}</div>
   <button class="buyBtn" ${(o.sold||G.gold<a.price)?'disabled':''}>${o.sold?'КУПЛЕНО':a.price+' 💰'}</button>`;
  el.querySelector('.buyBtn').onclick=()=>{
   if(o.sold||G.gold<a.price)return;
   G.gold-=a.price;a.apply(G);G.artifacts.push(a.id);
   sfx('buy');refreshBuildUI();renderShop();};
  box.appendChild(el);});
 if(!G.shopOffers.length)box.innerHTML='<div class="emptyMsg">Торговец всё распродал ранее.</div>';}

/* --- сундуки --- */
function openChest(ch){
 const CH=BALANCE.chests;
 if(ch.golden){
  const owned=new Set(G.artifacts);
  const pool=ARTSHOP.filter(a=>!owned.has(a.id));
  if(pool.length){const a=pool[Math.random()*pool.length|0];
   a.apply(G);G.artifacts.push(a.id);
   banner(`✨ ЗОЛОТОЙ СУНДУК: ${a.icon} ${a.name}!`,'#ffd166');}
  else{G.gold+=CH.goldenGold;banner(`✨ ЗОЛОТОЙ СУНДУК: +${CH.goldenGold}💰`,'#ffd166');}
 }else{
  const gold=CH.goldMin+Math.round(G.t*CH.goldPerMin);
  G.gold+=gold;
  G.hearts.push({x:ch.x,y:ch.y-12,t:0});
  banner(`📦 СУНДУК: +${gold}💰 и сердце`,'#ffd166');
 }
 sfx('chest');refreshBuildUI();}

/* --- HUD, баннеры, пауза --- */
function refreshBuildUI(){
 const sk=$('skills');sk.innerHTML='';
 for(const id in G.spells){const d=SPELL_DEF[id],c=document.createElement('div');
  c.className='chip'+(d.combo?' cmb':'');
  c.style.borderColor=d.combo?'#ffd166':G.cls.color;c.title=d.name;
  c.innerHTML=`<span>${d.icon}</span><b>${d.combo?'★':R[G.spells[id]-1]}</b>`;sk.appendChild(c);}
 if(G.pets.length){const c=document.createElement('div');c.className='chip';
  c.style.borderColor=PET_DEF[G.key].col;c.title='Питомцы (уровни '+BALANCE.pets.levels.join('/')+')';
  c.innerHTML=`<span>🐾</span><b>×${G.pets.length}</b>`;sk.appendChild(c);}
 const pb=$('passivesBar');pb.innerHTML='';
 for(const id in G.passives){const d=PASSIVE_DEF[id],c=document.createElement('div');c.className='chip pas';
  c.style.borderColor='#7ee8fa';c.title=d.name;
  c.innerHTML=`<span>${d.icon}</span><b>${R[G.passives[id]-1]}</b>`;pb.appendChild(c);}
 const sb=$('synBar');sb.innerHTML='';
 for(const sy of activeSynergies()){const c=document.createElement('div');c.className='chip syn';
  c.title='СИНЕРГИЯ: '+sy.name+' — '+sy.desc;
  c.innerHTML=`<span>${sy.icon}</span>`;sb.appendChild(c);}
 const ar=$('arts');ar.innerHTML='';
 for(const id of G.artifacts){const a=ARTSHOP.find(x=>x.id===id);if(!a)continue;
  const c=document.createElement('div');c.className='chip';c.style.borderColor='#ffd166';c.title=a.name;
  c.innerHTML=`<span>${a.icon}</span>`;ar.appendChild(c);}}
function banner(txt,col){const b=$('banner');b.textContent=txt;b.style.color=col||'#fff';b.classList.remove('show');void b.offsetWidth;b.classList.add('show');}
function setPause(on){if(on){state='pause';buildPause();$('pauseOv').classList.remove('hide');}
 else{state='play';$('pauseOv').classList.add('hide');}}
function buildPause(){
 let m='';
 const groups=[...CLASS_ORDER.map(k=>({key:k,title:CLASSES[k].name,color:CLASSES[k].color})),{key:null,title:'Общее',color:'var(--gold)'}];
 const learned=Object.keys(G.spells);
 if(learned.length){
  m+='<div class="secHead" style="color:var(--gold)">ИЗУЧЕННАЯ МАГИЯ</div>';
  for(const g of groups){
   const list=learned.filter(id=>SPELL_DEF[id].combo?(g.key===null):(spellOwner(id)===g.key));
   if(!list.length)continue;
   m+=`<div style="color:${g.color};font-family:'Russo One';font-size:11px;margin:10px 0 4px">${g.title.toUpperCase()}</div>`;
   for(const id of list){const d=SPELL_DEF[id];const l=G.spells[id];const mx=d.lv.length;
    const next=l<mx?`<br><span style="color:var(--dim)">ур ${l+1}: ${spellDesc(id,l+1)}</span>`:'';
    m+=`<div class="listRow"><div class="li">${d.icon}</div><div class="ln">${d.name}${d.combo?' <span style="color:var(--gold)">★</span>':''}<br><span class="ld">${spellDesc(id,l)}${next}</span></div><div class="ll">УР ${l}/${mx}</div></div>`;}}}
 const ps=Object.keys(G.passives);
 if(ps.length){m+='<div class="secHead" style="color:var(--cyan)">ПАССИВНАЯ МАГИЯ</div>';
  for(const id of ps){const d=PASSIVE_DEF[id];m+=`<div class="listRow"><div class="li">${d.icon}</div><div class="ln">${d.name}<br><span class="ld">${d.desc}</span></div><div class="ll">УР ${G.passives[id]}/${d.max}</div></div>`;}}
 if(G.pets.length){const pd=PET_DEF[G.key];
  m+='<div class="secHead" style="color:'+pd.col+'">ПИТОМЦЫ</div>';
  m+=`<div class="listRow"><div class="li">🐾</div><div class="ln">${pd.name} (${pd.ranged?'дальний бой':'ближний бой'})<br><span class="ld">Урон растёт с уровнем · сейчас ≈ ${Math.round(BALANCE.pets.baseDmg+G.player.level*BALANCE.pets.perLevel)}</span></div><div class="ll">×${G.pets.length}</div></div>`;}
 const consumed=consumedSpellIds();
 const unlearned=Object.keys(SPELL_DEF).filter(id=>!G.spells[id]&&!SPELL_DEF[id].combo&&!consumed.has(id));
 if(unlearned.length){m+='<div class="secHead" style="color:var(--dim)">СПРАВОЧНИК (НЕ ИЗУЧЕНО)</div>';
  for(const g of groups){if(g.key===null)continue;
   const list=unlearned.filter(id=>spellOwner(id)===g.key);
   if(!list.length)continue;
   m+=`<div style="color:${g.color};font-family:'Russo One';font-size:11px;margin:10px 0 4px">${g.title.toUpperCase()}</div>`;
   for(const id of list){const d=SPELL_DEF[id];
    m+=`<div class="listRow" style="opacity:.55"><div class="li">${d.icon}</div><div class="ln">${d.name}<br><span class="ld">${spellDesc(id,1)}</span></div></div>`;}}}
 $('tab-magic').innerHTML=m||'<div class="emptyMsg">Пока ничего</div>';
 $('tab-combos').innerHTML=buildComboPane();
 $('tab-syn').innerHTML=buildSynergyPane();
 let a='';
 if(G.artifacts.length){for(const id of G.artifacts){const x=ARTSHOP.find(q=>q.id===id);
  a+=`<div class="listRow"><div class="li">${x.icon}</div><div class="ln">${x.name}<br><span class="ld">${x.desc}</span></div></div>`;}}
 else a='<div class="emptyMsg">Артефакты не куплены.<br>Ищите торговца и сундуки на арене.</div>';
 $('tab-arts').innerHTML=a;}

/* --- бой --- */
function nearestEnemies(x,y,n){const es=G.enemies;if(!es.length)return[];return es.map(e=>[(e.x-x)**2+(e.y-y)**2,e]).sort((a,b)=>a[0]-b[0]).slice(0,n).map(p=>p[1]);}
function nearestEnemy(x,y){let best=null,bd=1e18;for(const e of G.enemies){const d=(e.x-x)**2+(e.y-y)**2;if(d<bd){bd=d;best=e;}}return best;}
function addDot(e,dps,dur){if(e.dots.length<6)e.dots.push({dps:dps*G.stats.dmg,t:dur});}
function fxRing(x,y,r0,r1,col,dur){G.zones.push({type:'fx',x,y,r0,r1,t:dur,dur,col,w:3});}
function burst(x,y,col,n,sp){if(G.parts.length>520)return;for(let i=0;i<n;i++){const a=rnd(0,TAU),v=rnd(.2,1)*(sp||120);G.parts.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,t:rnd(.25,.6),dur:.6,col,r:rnd(1.5,3.5)});}}
function dmgText(x,y,v,col){if(G.texts.length>70)return;G.texts.push({x:x+rnd(-8,8),y:y-10,txt:String(Math.round(v)),col:col||'#ffd166',t:.7});}
function getArmor(){return G.stats.armor+synSum('armor')
 +(G.spells.shield?SPELL_DEF.shield.lv[G.spells.shield-1].armor:0)
 +(G.spells.archon?SPELL_DEF.archon.lv[G.spells.archon-1].armor:0);}
function activeRays(){
 if(G.spells.laserstorm)return 1;
 if(G.spells.ray)return SPELL_DEF.ray.lv[G.spells.ray-1].n+G.stats.raysBonus;
 return 0;}
function dealDamage(e,dmg,o){o=o||{};if(e.dead)return;
 dmg*=(1+synSum('dmg'));
 if(G.stats.tentacles){const r=activeRays();if(r>0)dmg*=(1+.06*r);}
 if(G.stats.crit){G.stats.critN++;if(G.stats.critN%4===0){dmg*=2;dmgText(e.x,e.y-14,dmg,'#ffd166');}}
 if(G.stats.scythe&&!e.elite&&!e.boss&&Math.random()<.08){
  e.hp=0;dmgText(e.x,e.y,'⚰ КАЗНЬ','#ff8a8a');}
 else e.hp-=dmg;
 e.flash=.09;if(dmg>=10||G.texts.length<35)dmgText(e.x,e.y,dmg);
 if(e.hp<=0)kill(e,o.src);}
function kill(e,src){if(e.dead)return;e.dead=true;G.kills++;
 gainXP(e.xp);addGold(e.goldV||e.xp);
 const vamp=G.stats.vamp+synSum('vamp');
 if(vamp>0&&G.vampBudget>0){
  const h=Math.min(vamp,G.vampBudget);
  G.vampBudget-=h;
  G.player.hp=Math.min(G.player.maxhp,G.player.hp+h);}
 G.killsSinceHeart++;
 if(G.killsSinceHeart>=BALANCE.economy.heartEveryKills){
  G.killsSinceHeart=0;G.hearts.push({x:e.x,y:e.y,t:0});}
 burst(e.x,e.y,e.boss?'#ff9a6a':e.elite?'#ffd166':'#9aa6e8',e.boss?40:e.elite?16:7,e.boss?260:120);
 if(e.type==='tower'){const TO=BALANCE.towers;
  addGold(TO.gold);G.player.hp=Math.min(G.player.maxhp,G.player.hp+TO.heal);
  banner(`🗼 БАШНЯ РАЗРУШЕНА: +${TO.gold}💰 +${TO.heal}HP`,'#ffd166');G.shake=Math.max(G.shake,10);sfx('boom');}
 if(src!=='burst'&&G.spells.deathburst){const c=SPELL_DEF.deathburst.lv[G.spells.deathburst-1];
  areaDamage(e.x,e.y,c.aoe*Math.sqrt(G.stats.area*(1+synSum('area'))),c.dmg*G.stats.dmg,{src:'burst',col:'#b18cff'});}
 if(e.boss){G.bossRef=null;G.shake=Math.max(G.shake,12);sfx('boom');banner('БОСС ПОВЕРЖЕН +40💰','#ffd166');
  addGold(40);spawnMerchant();}}
function areaDamage(x,y,r,dmg,o){o=o||{};for(const e of G.enemies){if(e.dead)continue;
 if(Math.hypot(e.x-x,e.y-y)<r+e.r){dealDamage(e,dmg,o);
  if(o.burn)addDot(e,o.burn*(1+synSum('burn')),2.5);
  if(o.slow){e.slowT=2;e.slowM=.5;}
  if(o.knock!==false){const a=Math.atan2(e.y-y,e.x-x),k=o.knock||150;e.kx+=Math.cos(a)*k;e.ky+=Math.sin(a)*k;}}}}
function explode(x,y,r,dmg,o){o=o||{};areaDamage(x,y,r,dmg,o);fxRing(x,y,r*.25,r,o.col||'#ffb45e',.3);burst(x,y,o.col||'#ffb45e',10,150);G.shake=Math.max(G.shake,o.shake||2);if(o.boom)sfx('boom');}
function damagePlayer(d){const p=G.player;if(p.ifr>0||state!=='play')return;
 if(G.test)return;
 d=Math.max(1,Math.round(d-getArmor()));p.hp-=d;p.ifr=BALANCE.player.ifr;G.hitFlash=.4;G.shake=Math.max(G.shake,6);sfx('hurt');dmgText(p.x,p.y,d,'#ff7b7b');
 if(p.hp<=0){if(G.stats.phoenix>0){G.stats.phoenix--;p.hp=p.maxhp*.5;p.ifr=2;banner('🪶 ПЕРО ФЕНИКСА ВОЗРОДИЛО ВАС','#ff9a6a');G.shake=10;sfx('level');return;}p.hp=0;gameOver();}}
function gameOver(){state='over';
 $('statOver').innerHTML=`<span>Класс</span><b>${G.cls.name}</b><span>Время</span><b>${fmt(G.t)}</b><span>Убийств</span><b>${G.kills}</b><span>Уровень</span><b>${G.player.level}</b><span>Золото</span><b>${G.gold}</b>`;
 $('overOv').classList.remove('hide');}
function winGame(){state='win';
 $('statWin').innerHTML=`<span>Класс</span><b>${G.cls.name}</b><span>Убийств</span><b>${G.kills}</b><span>Уровень</span><b>${G.player.level}</b><span>Золото</span><b>${G.gold}</b>`;
 $('winOv').classList.remove('hide');sfx('level');}

/* --- спавн --- */
function spawnPos(){const p=G.player,a=rnd(0,TAU),d=Math.hypot(W,H)/2+80;return{x:clamp(p.x+Math.cos(a)*d,20,WORLD-20),y:clamp(p.y+Math.sin(a)*d,20,WORLD-20)};}
function hpMul(){const t=G.t,E=BALANCE.enemies;
 let base=1+t*E.hpGrowth+Math.pow(t/60,2)*E.hpCurve;
 if(G.stats.genome)base*=.85;
 return base*(1+((G.diff||1)-1)*E.diffHp);}
function spawnEnemy(type,elite,pos){const p=pos||spawnPos(),m=hpMul(),E=BALANCE.enemies;
 const sd=1+G.t/E.spdGrowth;
 let b;
 if(type==='runner')b=E.runner;else if(type==='brute')b=E.brute;else b=E.blob;
 const cols={blob:'#6ea0ff',runner:'#7ee8fa',brute:'#c473ff'};
 let e={x:p.x,y:p.y,r:b.r,hp:b.hp*m,spd:b.spd*sd,dmg:b.dmg,xp:b.xp,col:cols[type]||cols.blob};
 Object.assign(e,{uid:uidN++,maxhp:e.hp,flash:0,stunT:0,slowT:0,slowM:1,kx:0,ky:0,dots:[],type,elite:false,boss:false,goldV:b.gold});
 if(elite){const el=E.elite;e.hp*=el.hpMul;e.maxhp=e.hp;e.dmg*=el.dmgMul;e.r*=el.rMul;e.xp=el.xp;e.goldV=el.gold;e.elite=true;}
 G.enemies.push(e);}
function spawnBoss(){const BO=BALANCE.bosses;const i=G.bossIdx++,pos=spawnPos();
 const e={x:pos.x,y:pos.y,r:34,hp:BO.hp[i],maxhp:BO.hp[i],spd:BO.spd+i*5,dmg:BO.dmg,xp:40,goldV:40,uid:uidN++,flash:0,stunT:0,slowT:0,slowM:1,kx:0,ky:0,dots:[],type:'boss',elite:false,boss:true,shootT:2.5,bossName:BOSS_NAMES[i],col:'#ff5f6d'};
 G.enemies.push(e);G.bossRef=e;sfx('boss');G.shake=Math.max(G.shake,8);banner(`⚠ БОСС: ${BOSS_NAMES[i].toUpperCase()}`,'#ff5f6d');}
function spawnMerchant(){const p=G.player,a=rnd(0,TAU),d=rnd(280,460);
 G.merchant={x:clamp(p.x+Math.cos(a)*d,40,WORLD-40),y:clamp(p.y+Math.sin(a)*d,40,WORLD-40),used:false};
 banner('🧙 ТОРГОВЕЦ ПОЯВИЛСЯ РЯДОМ','#ffd166');sfx('coin');}
function spawnTower(){const TO=BALANCE.towers;const p=G.player,a=rnd(0,TAU),d=rnd(260,420);
 const x=clamp(p.x+Math.cos(a)*d,40,WORLD-40),y=clamp(p.y+Math.sin(a)*d,40,WORLD-40);
 const hp=TO.hp*hpMul();
 G.enemies.push({x,y,r:24,hp,maxhp:hp,spd:0,dmg:16,xp:TO.xp,goldV:10,uid:uidN++,flash:0,stunT:0,slowT:0,slowM:1,kx:0,ky:0,dots:[],type:'tower',elite:false,boss:false,shootT:1.6,col:'#ffd166'});
 banner('🗼 ВОЗВЕДЕНА БАШНЯ — разрушьте её!','#ff9a6a');sfx('boss');}
function director(dt){G.spawnT-=dt;G.waveT-=dt;G.merchantT-=dt;G.towerT-=dt;G.chestT-=dt;
 const t=G.t,E=BALANCE.enemies,BO=BALANCE.bosses,WV=BALANCE.waves,CH=BALANCE.chests;
 for(let i=0;i<BO.times.length;i++)if(G.bossIdx===i&&t>=BO.times[i]){spawnBoss();break;}
 if(G.merchantT<=0){G.merchantT=45;if(!G.merchant)spawnMerchant();}
 if(G.towerT<=0){G.towerT=75;spawnTower();}
 if(G.chestT<=0&&G.chests.length<CH.maxOnField){
  G.chestT=rnd(CH.everyMin,CH.everyMax);
  const p=G.player,a=rnd(0,TAU),d=rnd(220,420);
  const golden=Math.random()<CH.goldenChance;
  G.chests.push({x:clamp(p.x+Math.cos(a)*d,40,WORLD-40),y:clamp(p.y+Math.sin(a)*d,40,WORLD-40),golden,t:0});
  banner(golden?'✨ ЗОЛОТОЙ СУНДУК ПОЯВИЛСЯ':'📦 СУНДУК ПОЯВИЛСЯ','#ffd166');}
 if(G.spawnT<=0){
  G.spawnT=lerp(E.spawnStart,E.spawnEnd,clamp(t/E.spawnRampT,0,1))/(1+((G.diff||1)-1)*E.diffSpawn);
  const group=1+Math.floor(clamp(t/E.groupRampT,0,E.groupMax-1));
  for(let i=0;i<group&&G.enemies.length<E.cap;i++){
   const type=t<50?'blob':t<130?pickArr(['blob','blob','runner']):pickArr(['blob','runner','runner','brute']);
   G.spawnCount++;
   const eliteEvery=Math.max(E.eliteMinEvery,E.eliteEvery-Math.floor(((G.diff||1)-1)*E.diffElite));
   const elite=t>E.eliteStartT&&G.spawnCount%eliteEvery===0;spawnEnemy(type,elite);}}
 if(G.waveT<=0){G.waveT=WV.every;banner('🌊 ВОЛНА!','#6ecbff');
  for(let i=0;i<WV.count&&G.enemies.length<E.cap;i++){const a=i/WV.count*TAU,p=G.player,d=Math.hypot(W,H)/2+60;
   G.enemies.push({x:clamp(p.x+Math.cos(a)*d,20,WORLD-20),y:clamp(p.y+Math.sin(a)*d,20,WORLD-20),r:11,hp:WV.hp*hpMul(),maxhp:WV.hp*hpMul(),spd:WV.spd,dmg:WV.dmg,xp:1,goldV:1,uid:uidN++,flash:0,stunT:0,slowT:0,slowM:1,kx:0,ky:0,dots:[],type:'wave',elite:false,boss:false,col:'#ffb45e'});}}}

/* --- заклинания --- */
function castMirages(n,dmg,col){
 const p=G.player;const ts=nearestEnemies(p.x,p.y,Math.max(1,n));
 if(!ts.length)return false;
 const pos=(G.mirrorPos&&G.mirrorPos.length)?G.mirrorPos:[p];
 for(let i=0;i<n;i++){
  const src=pos[i%pos.length];
  const t=ts[i%ts.length];
  const a=Math.atan2(t.y-src.y,t.x-src.x);
  G.bullets.push({x:src.x,y:src.y,vx:Math.cos(a)*420,vy:Math.sin(a)*420,r:5,kind:'pierce',dmg:dmg,pierce:0,life:1.2,hit:new Set(),col:col});}
 return true;}
function tryCast(id,lv){const p=G.player,c=SPELL_DEF[id].lv[lv-1],s=G.stats,
 area=Math.sqrt(s.area*(1+synSum('area')));
 switch(id){
 case'fireball':{const ts=nearestEnemies(p.x,p.y,c.n);if(!ts.length)return false;for(const t of ts){const a=Math.atan2(t.y-p.y,t.x-p.x);G.bullets.push({x:p.x,y:p.y,vx:Math.cos(a)*430,vy:Math.sin(a)*430,r:6,kind:'fire',dmg:c.dmg*s.dmg,aoe:c.aoe*area,burn:c.burn*s.burnMult,pierce:0,life:1.6,hit:new Set(),col:'#ff9a3d'});}return true;}
 case'soularrow':{const ts=nearestEnemies(p.x,p.y,c.n);if(!ts.length)return false;for(const t of ts){const a=Math.atan2(t.y-p.y,t.x-p.x);G.bullets.push({x:p.x,y:p.y,vx:Math.cos(a)*520,vy:Math.sin(a)*520,r:5,kind:'pierce',dmg:c.dmg*s.dmg,pierce:c.pierce,life:1.8,hit:new Set(),col:'#8ce99a'});}return true;}
 case'icelance':{const ts=nearestEnemies(p.x,p.y,c.n);if(!ts.length)return false;for(const t of ts){const a=Math.atan2(t.y-p.y,t.x-p.x);G.bullets.push({x:p.x,y:p.y,vx:Math.cos(a)*560,vy:Math.sin(a)*560,r:6,kind:'pierce',slow:true,dmg:c.dmg*s.dmg,pierce:c.pierce,life:1.8,hit:new Set(),col:'#9fe8ff'});}return true;}
 case'boomer':{const ts=nearestEnemies(p.x,p.y,c.n);if(!ts.length)return false;
  for(const t of ts){const a=Math.atan2(t.y-p.y,t.x-p.x);
   G.bullets.push({x:p.x,y:p.y,vx:Math.cos(a)*430,vy:Math.sin(a)*430,r:7,kind:'pierce',dmg:c.dmg*s.dmg,pierce:999,life:1.5,maxLife:1.5,return:true,age:0,hit:new Set(),col:'#c99bff'});}
  return true;}
 case'mirror':{const mc=SPELL_DEF.mirror.lv[lv-1];
  return castMirages(mc.n+s.mirrorBonus,mc.dmg*s.dmg*(s.electro?1.4:1)*(1+synSum('minionDmg')),'#cfe0ff');}
 case'avatar':{const mc=SPELL_DEF.avatar.lv[0];
  return castMirages(mc.n+s.mirrorBonus,mc.dmg*s.dmg*(s.electro?1.4:1)*(1+synSum('minionDmg')),'#ffd7f2');}
 case'arcane':{const n=c.n+s.projBonus+Math.round(synSum('proj'));const ts=nearestEnemies(p.x,p.y,n);if(!ts.length)return false;ts.forEach((t,i)=>{const a=Math.atan2(t.y-p.y,t.x-p.x)+(i-ts.length/2)*.4;G.bullets.push({x:p.x,y:p.y,vx:Math.cos(a)*260,vy:Math.sin(a)*260,r:5,kind:'arcane',homing:true,dmg:c.dmg*s.dmg,pierce:0,life:2.6,hit:new Set(),col:'#c99bff'});});return true;}
 case'lightning':{let cur=nearestEnemy(p.x,p.y);if(!cur)return false;const hitSet=new Set(),pts=[[p.x,p.y]];let dmg=c.dmg*s.dmg;const chains=c.chains+s.chainBonus+Math.round(synSum('chains'));
  for(let i=0;i<=chains&&cur;i++){hitSet.add(cur);pts.push([cur.x,cur.y]);dealDamage(cur,dmg);cur.stunT=.2;burst(cur.x,cur.y,'#9fd8ff',4,90);dmg*=.9;
   let next=null,bd=1e18;for(const e of G.enemies){if(e.dead||hitSet.has(e))continue;const d=(e.x-cur.x)**2+(e.y-cur.y)**2;if(d<bd&&d<40000){bd=d;next=e;}}cur=next;}
  G.beams.push({pts,t:.18,dur:.18,col:'#9fd8ff'});sfx('zap');return true;}
 case'storm':{const ts=nearestEnemies(p.x,p.y,c.n);if(!ts.length)return false;for(const e of ts){G.beams.push({pts:[[e.x+rnd(-20,20),e.y-420],[e.x,e.y]],t:.2,dur:.2,col:'#cfe9ff'});explode(e.x,e.y,46*Math.sqrt(s.area),c.dmg*s.dmg,{col:'#9fd8ff',shake:0});}sfx('zap');G.shake=Math.max(G.shake,3);return true;}
 case'meteor':{const ts=nearestEnemies(p.x,p.y,6);if(!ts.length)return false;for(let i=0;i<c.n;i++){const anchor=pickArr(ts);const near=G.enemies.filter(e=>!e.dead&&Math.hypot(e.x-anchor.x,e.y-anchor.y)<90).slice(0,3);const cx=near.reduce((s,e)=>s+e.x,0)/(near.length||1),cy=near.reduce((s,e)=>s+e.y,0)/(near.length||1);G.zones.push({type:'meteor',x:cx+rnd(-14,14),y:cy+rnd(-14,14),r:c.aoe*area,t:.9,dur:.9,dmg:c.dmg*s.dmg,burn:c.burn*s.burnMult});}return true;}
 case'plague':{const ts=nearestEnemies(p.x,p.y,4);if(!ts.length)return false;const a=pickArr(ts);G.zones.push({type:'plague',x:a.x,y:a.y,r:c.r*area,dur:c.dur,tick:0,dps:c.dps*s.dmg});return true;}
 case'nova':{const near=G.enemies.filter(e=>!e.dead&&Math.hypot(e.x-p.x,e.y-p.y)<c.aoe*area*1.4);if(!near.length)return false;explode(p.x,p.y,c.aoe*area,c.dmg*s.dmg,{col:'#c99bff',slow:c.slow,knock:220,shake:3});sfx('boom');return true;}
 case'lifedrain':{const near=G.enemies.filter(e=>!e.dead&&Math.hypot(e.x-p.x,e.y-p.y)<c.r*area);if(!near.length)return false;for(const e of near)dealDamage(e,c.dmg*s.dmg);p.hp=Math.min(p.maxhp,p.hp+c.heal);fxRing(p.x,p.y,c.r*area*.3,c.r*area,'#ff6b8a',.35);return true;}
 case'shield':{const near=G.enemies.filter(e=>!e.dead&&Math.hypot(e.x-p.x,e.y-p.y)<c.aoe*area*1.2);if(!near.length)return false;explode(p.x,p.y,c.aoe*area,c.pulse*s.dmg,{col:'#7ee8fa',knock:260,shake:4});sfx('boom');return true;}
 case'ball':{const ts=nearestEnemies(p.x,p.y,c.n);if(!ts.length)return false;for(let i=0;i<c.n;i++){const t=ts[i%ts.length],a=Math.atan2(t.y-p.y,t.x-p.x)+rnd(-.3,.3);G.orbs.push({x:p.x,y:p.y,vx:Math.cos(a)*95,vy:Math.sin(a)*95,r:c.r,dmg:c.dmg*s.dmg,life:4,tick:0});}return true;}
 case'sunstorm':{const ts=nearestEnemies(p.x,p.y,c.n);if(!ts.length)return false;
  for(const t of ts){const a=Math.atan2(t.y-p.y,t.x-p.x);
   G.bullets.push({x:p.x,y:p.y,vx:Math.cos(a)*430,vy:Math.sin(a)*430,r:8,kind:'fire',dmg:c.dmg*s.dmg,aoe:c.aoe*area,burn:c.burn*s.burnMult,pierce:0,life:1.6,hit:new Set(),col:'#ffd166'});}
  explode(p.x,p.y,c.novaR*area,c.nova*s.dmg,{col:'#ffb45e',knock:200,shake:3});return true;}
 case'soulreaper':{const ts=nearestEnemies(p.x,p.y,c.n);if(!ts.length)return false;
  for(const t of ts){const a=Math.atan2(t.y-p.y,t.x-p.x);
   G.bullets.push({x:p.x,y:p.y,vx:Math.cos(a)*540,vy:Math.sin(a)*540,r:6,kind:'pierce',dmg:c.dmg*s.dmg,pierce:c.pierce,life:1.8,hit:new Set(),col:'#b18cff'});}
  explode(p.x,p.y,c.novaR*area,c.nova*s.dmg,{col:'#b18cff',knock:180,shake:3});return true;}
 case'skywrath':{let cur=nearestEnemy(p.x,p.y);if(!cur)return false;
  {const hitSet=new Set();let dm=c.dmg*s.dmg;const pts=[[p.x,p.y]];
   for(let i=0;i<=c.chains&&cur;i++){hitSet.add(cur);pts.push([cur.x,cur.y]);dealDamage(cur,dm);cur.stunT=.25;burst(cur.x,cur.y,'#cfe9ff',5,110);dm*=.92;
    let next=null,bd=1e18;for(const e of G.enemies){if(e.dead||hitSet.has(e))continue;const d=(e.x-cur.x)**2+(e.y-cur.y)**2;if(d<bd&&d<40000){bd=d;next=e;}}cur=next;}
   G.beams.push({pts,t:.22,dur:.22,col:'#cfe9ff'});}
  {const ts=nearestEnemies(p.x,p.y,c.stormN);
   for(const e of ts){G.beams.push({pts:[[e.x+rnd(-20,20),e.y-420],[e.x,e.y]],t:.22,dur:.22,col:'#eaf7ff'});explode(e.x,e.y,50*area,c.stormDmg*s.dmg,{col:'#9fd8ff',shake:0});}}
  sfx('zap');G.shake=Math.max(G.shake,5);return true;}
 case'singularity':{const ts=nearestEnemies(p.x,p.y,5);if(!ts.length)return false;
  const anchor=pickArr(ts);
  G.zones.push({type:'void',x:anchor.x,y:anchor.y,r:c.r*area,t:c.dur,dur:c.dur,dps:c.dps*s.dmg,pull:c.pull*(1+synSum('pull')),tick:0});
  sfx('boom');return true;}
 case'icestorm':{const ts=nearestEnemies(p.x,p.y,c.n);if(!ts.length)return false;
  for(const t of ts){const a=Math.atan2(t.y-p.y,t.x-p.x);
   G.bullets.push({x:p.x,y:p.y,vx:Math.cos(a)*560,vy:Math.sin(a)*560,r:6,kind:'pierce',slow:true,dmg:c.dmg*s.dmg,pierce:c.pierce,life:1.8,hit:new Set(),col:'#9fe8ff'});}
  for(let i=0;i<c.orbs;i++){const t=pickArr(ts);const a=Math.atan2(t.y-p.y,t.x-p.x)+rnd(-.6,.6);
   G.orbs.push({x:p.x,y:p.y,vx:Math.cos(a)*95,vy:Math.sin(a)*95,r:17,dmg:20*s.dmg,life:4,tick:0});}
  return true;}
 case'blackdeath':{const ts=nearestEnemies(p.x,p.y,5);if(!ts.length)return false;
  const anchor=pickArr(ts);
  G.zones.push({type:'plague',x:anchor.x,y:anchor.y,r:c.r*area,dur:c.dur,tick:0,dps:c.dps*s.dmg});
  const near=G.enemies.filter(e=>!e.dead&&Math.hypot(e.x-p.x,e.y-p.y)<160*area);
  for(const e of near)dealDamage(e,c.drain*s.dmg);
  if(near.length)p.hp=Math.min(p.maxhp,p.hp+c.heal);
  fxRing(p.x,p.y,30,160*area,'#8ce99a',.4);return true;}
 case'archon':{const near=G.enemies.filter(e=>!e.dead&&Math.hypot(e.x-p.x,e.y-p.y)<c.aoe*area*1.2);
  if(!near.length)return false;
  explode(p.x,p.y,c.aoe*area,c.pulse*s.dmg,{col:'#ffd166',knock:320,shake:5});
  fxRing(p.x,p.y,p.r+10,c.aoe*area,'#ffd166',.5);sfx('boom');return true;}
 }return false;}

/* --- главный апдейт мира --- */
function update(dt){const p=G.player,s=G.stats,P=BALANCE.player;
 G.t+=dt;if(!G.endless&&G.t>=600){winGame();return;}
 const PL=BALANCE.pets.levels;
 while(G.pets.length<PL.length&&p.level>=PL[G.pets.length])spawnPet();
 let dx=(keys.KeyD||keys.ArrowRight?1:0)-(keys.KeyA||keys.ArrowLeft?1:0);
 let dy=(keys.KeyS||keys.ArrowDown?1:0)-(keys.KeyW||keys.ArrowUp?1:0);
 if(!dx&&!dy&&mouse.down){const wx=G.cam.x+(mouse.x-W/2),wy=G.cam.y+(mouse.y-H/2);const d=Math.hypot(wx-p.x,wy-p.y);if(d>12){dx=(wx-p.x)/d;dy=(wy-p.y)/d;}}
 const dl=Math.hypot(dx,dy);
 if(dl>0){const sp=P.speed*s.spdMul;p.x+=dx/dl*sp*dt;p.y+=dy/dl*sp*dt;p.face=Math.atan2(dy,dx);}
 p.x=clamp(p.x,20,WORLD-20);p.y=clamp(p.y,20,WORLD-20);
 p.ifr-=dt;G.hitFlash=Math.max(0,G.hitFlash-dt*1.4);
 p.hp=Math.min(p.maxhp,p.hp+(P.regen+s.regen)*dt);
 G.vampBudget=Math.min(P.vampCapPerSec,G.vampBudget+P.vampCapPerSec*dt);
 /* хронометр: стоп-время */
 if(s.clockwork){G.clockT-=dt;
  if(G.clockT<=0){G.clockT=20;
   for(const e of G.enemies){if(!e.dead&&!e.boss)e.stunT=2;}
   fxRing(p.x,p.y,40,320,'#7ee8fa',.6);banner('⏱️ ВРЕМЯ ОСТАНОВЛЕНО','#7ee8fa');sfx('time');}}
 /* миражи: позиции */
 if(G.spells.mirror||G.spells.avatar){
  G.mirrorAng+=dt*1.1;
  const n=G.spells.avatar?(SPELL_DEF.avatar.lv[0].n+s.mirrorBonus):(SPELL_DEF.mirror.lv[(G.spells.mirror||1)-1].n+s.mirrorBonus);
  G.mirrorPos=[];
  for(let i=0;i<n;i++){const a=G.mirrorAng+i/n*TAU;
   G.mirrorPos.push({x:p.x+Math.cos(a)*36,y:p.y+Math.sin(a)*36});}}
 else G.mirrorPos=[];
 /* сердца */
 const EC=BALANCE.economy;
 for(const h of G.hearts){h.t+=dt;
  const d=Math.hypot(p.x-h.x,p.y-h.y);
  if(d<EC.heartMagnet){const a=Math.atan2(p.y-h.y,p.x-h.x);const sp=clamp(520-d,160,500);
   h.x+=Math.cos(a)*sp*dt;h.y+=Math.sin(a)*sp*dt;}
  if(d<p.r+10){h.dead=true;p.hp=Math.min(p.maxhp,p.hp+EC.heartHeal);sfx('heal');
   dmgText(p.x,p.y,'+'+EC.heartHeal,'#ff8fa3');}}
 G.hearts=G.hearts.filter(h=>!h.dead);
 /* сундуки */
 for(const ch of G.chests){ch.t+=dt;
  if(Math.hypot(p.x-ch.x,p.y-ch.y)<36){ch.dead=true;openChest(ch);}}
 G.chests=G.chests.filter(c=>!c.dead);
 if(G.merchant&&!G.merchant.used){if(Math.hypot(G.merchant.x-p.x,G.merchant.y-p.y)<48){G.merchant.used=true;openShop();}}
 if(s.stormgem){s.stormgemT-=dt;if(s.stormgemT<=0){s.stormgemT=6;const ts=nearestEnemies(p.x,p.y,3);
  if(ts.length){for(const e of ts){G.beams.push({pts:[[e.x,e.y-380],[e.x,e.y]],t:.2,dur:.2,col:'#cfe9ff'});explode(e.x,e.y,40,40*s.dmg,{col:'#9fd8ff',shake:0});}sfx('zap');}}}
 let cdrMul=s.cdr*(1-synSum('cdr'));
 if(s.accelerator)cdrMul*=Math.max(.55,1-Math.max(0,s.spdMul-1)*.6);
 for(const id in G.spells){const def=SPELL_DEF[id];if(!def.cd)continue;G.timers[id]=(G.timers[id]||0)-dt;if(G.timers[id]<=0)G.timers[id]=tryCast(id,G.spells[id])?def.cd*Math.max(.3,cdrMul):.15;}
 updateRing(dt);updateSkel(dt);updateAura(dt);updateRay(dt);updateCyclone(dt);updatePets(dt);
 for(const b of G.bullets){b.age=(b.age||0)+dt;b.life-=dt;
  if(b.life<=0){b.dead=true;continue;}
  if(b.return){
   if(!b.ret&&b.age>=b.maxLife*.5){b.ret=true;b.hit.clear();}
   if(b.ret){const a=Math.atan2(p.y-b.y,p.x-b.x);b.vx=Math.cos(a)*500;b.vy=Math.sin(a)*500;
    if(Math.hypot(p.x-b.x,p.y-b.y)<26){b.dead=true;continue;}}}
  if(b.homing){const t=nearestEnemy(b.x,b.y);if(t){const want=Math.atan2(t.y-b.y,t.x-b.x),cur=Math.atan2(b.vy,b.vx);let d=((want-cur+Math.PI*3)%TAU)-Math.PI;const a2=cur+d*6*dt;const sp=340;b.vx=Math.cos(a2)*sp;b.vy=Math.sin(a2)*sp;}}
  b.x+=b.vx*dt;b.y+=b.vy*dt;
  for(const e of G.enemies){if(e.dead||b.hit.has(e.uid))continue;
   if(Math.hypot(e.x-b.x,e.y-b.y)<e.r+b.r){b.hit.add(e.uid);
    if(b.kind==='fire'){explode(b.x,b.y,b.aoe,b.dmg,{burn:b.burn,col:'#ffb45e'});b.dead=true;}
    else{dealDamage(e,b.dmg);if(b.slow){e.slowT=2;e.slowM=.5;}burst(b.x,b.y,b.col,3,80);b.pierce--;if(b.pierce<0)b.dead=true;}break;}}}
 G.bullets=G.bullets.filter(b=>!b.dead);
 for(const o of G.orbs){o.life-=dt;if(o.life<=0){o.dead=true;continue;}o.x+=o.vx*dt;o.y+=o.vy*dt;
  if(o.x<o.r||o.x>WORLD-o.r)o.vx*=-1;if(o.y<o.r||o.y>WORLD-o.r)o.vy*=-1;
  o.tick-=dt;if(o.tick<=0){o.tick=.28;for(const e of G.enemies){if(e.dead)continue;if(Math.hypot(e.x-o.x,e.y-o.y)<e.r+o.r){dealDamage(e,o.dmg);burst(e.x,e.y,'#9fd8ff',2,70);}}}}
 G.orbs=G.orbs.filter(o=>!o.dead);
 for(const e of G.enemies){if(e.dead)continue;
  e.flash-=dt;e.stunT-=dt;e.slowT-=dt;
  for(let i=e.dots.length-1;i>=0;i--){const d=e.dots[i];e.hp-=d.dps*dt;d.t-=dt;if(d.t<=0)e.dots.splice(i,1);}
  if(e.hp<=0){kill(e,'dot');continue;}
  if(e.spd>0&&e.stunT<=0){const a=Math.atan2(p.y-e.y,p.x-e.x),sp=e.spd*(e.slowT>0?e.slowM:1);e.x+=Math.cos(a)*sp*dt+e.kx*dt;e.y+=Math.sin(a)*sp*dt+e.ky*dt;}
  const kd=Math.pow(.02,dt);e.kx*=kd;e.ky*=kd;e.x=clamp(e.x,15,WORLD-15);e.y=clamp(e.y,15,WORLD-15);
  if(e.boss||e.type==='tower'){e.shootT-=dt;if(e.shootT<=0){
   const BO=BALANCE.bosses,TO=BALANCE.towers;
   if(e.type==='tower'){e.shootT=TO.shootEvery;
    const base=Math.atan2(p.y-e.y,p.x-e.x);
    for(let i=0;i<TO.projCount;i++){const a=base+(i-TO.projCount/2)*.2;
     G.ebullets.push({x:e.x,y:e.y,vx:Math.cos(a)*140,vy:Math.sin(a)*140,r:7,dmg:TO.projDmg,life:14});}}
   else{e.shootT=BO.shootEvery;
    const cnt=BO.projCountBase+G.bossIdx*2;
    for(let i=0;i<cnt;i++){const a=i/cnt*TAU+G.t;
     G.ebullets.push({x:e.x,y:e.y,vx:Math.cos(a)*140,vy:Math.sin(a)*140,r:7,dmg:BO.projDmg,life:14});}}}}
  const E=BALANCE.enemies;
  if(Math.hypot(e.x-p.x,e.y-p.y)<e.r+p.r)damagePlayer(e.dmg*(1+G.t/E.dmgGrowthT)*(1+((G.diff||1)-1)*E.diffDmg));}
 const es=G.enemies,n=es.length;
 for(let i=0;i<n;i++){const a=es[i];if(a.dead||a.type==='tower')continue;
  for(let j=i+1;j<n;j++){const b=es[j];if(b.dead||b.type==='tower')continue;
   const dx2=b.x-a.x,dy2=b.y-a.y,rr=a.r+b.r,d2=dx2*dx2+dy2*dy2;
   if(d2<rr*rr&&d2>.01){const d=Math.sqrt(d2),push=(rr-d)/2/d*.6;a.x-=dx2*push;a.y-=dy2*push;b.x+=dx2*push;b.y+=dy2*push;}}}
 G.enemies=G.enemies.filter(e=>!e.dead);
 for(const b of G.ebullets){b.life-=dt;b.x+=b.vx*dt;b.y+=b.vy*dt;
  if(b.life<=0||b.x<-60||b.x>WORLD+60||b.y<-60||b.y>WORLD+60){b.dead=true;continue;}
  if(Math.hypot(b.x-p.x,b.y-p.y)<b.r+p.r){damagePlayer(b.dmg);b.dead=true;}}
 G.ebullets=G.ebullets.filter(b=>!b.dead);
 for(const z of G.zones){
  if(z.type==='meteor'){z.t-=dt;if(z.t<=0){z.dead=true;explode(z.x,z.y,z.r,z.dmg,{burn:z.burn,col:'#ffcf6e',shake:6,boom:true});burst(z.x,z.y,'#ffcf6e',18,220);}}
  else if(z.type==='plague'){z.dur-=dt;z.tick-=dt;if(z.tick<=0){z.tick=.5;for(const e of G.enemies){if(e.dead)continue;if(Math.hypot(e.x-z.x,e.y-z.y)<z.r+e.r)dealDamage(e,z.dps*.5,{src:'plague'});}}
   if(Math.random()<.3)G.parts.push({x:z.x+rnd(-z.r,z.r)*.8,y:z.y+rnd(-z.r,z.r)*.8,vx:rnd(-8,8),vy:rnd(-26,-10),t:.7,dur:.7,col:'#8ce99a',r:rnd(1.5,3)});
   if(z.dur<=0)z.dead=true;}
  else if(z.type==='void'){z.t-=dt;z.tick-=dt;
   for(const e of G.enemies){if(e.dead||e.boss||e.type==='tower')continue;
    const d=Math.hypot(e.x-z.x,e.y-z.y);
    if(d<z.r*1.6&&d>1){const a=Math.atan2(z.y-e.y,z.x-e.x);const pull=z.pull*dt;
     e.x+=Math.cos(a)*pull;e.y+=Math.sin(a)*pull;}}
   if(z.tick<=0){z.tick=.4;
    for(const e of G.enemies){if(e.dead)continue;
     if(Math.hypot(e.x-z.x,e.y-z.y)<z.r)dealDamage(e,z.dps*.4,{src:'void'});}}
   if(Math.random()<.6)G.parts.push({x:z.x+rnd(-z.r,z.r),y:z.y+rnd(-z.r,z.r),vx:rnd(-15,15),vy:rnd(-15,15),t:.5,dur:.5,col:'#c99bff',r:rnd(1,3)});
   if(z.t<=0)z.dead=true;}
  else{z.t-=dt;if(z.t<=0)z.dead=true;}}
 G.zones=G.zones.filter(z=>!z.dead);
 for(const b of G.beams)b.t-=dt;G.beams=G.beams.filter(b=>b.t>0);
 for(const q of G.parts){q.t-=dt;q.x+=q.vx*dt;q.y+=q.vy*dt;q.vx*=.96;q.vy*=.96;}
 G.parts=G.parts.filter(q=>q.t>0);
 for(const t of G.texts){t.t-=dt;t.y-=34*dt;}G.texts=G.texts.filter(t=>t.t>0);
 director(dt);
 const k=1-Math.pow(.001,dt);G.cam.x=lerp(G.cam.x,p.x,k);G.cam.y=lerp(G.cam.y,p.y,k);
 G.cam.x=clamp(G.cam.x,Math.min(W/2,WORLD/2),Math.max(WORLD-W/2,WORLD/2));
 G.cam.y=clamp(G.cam.y,Math.min(H/2,WORLD/2),Math.max(WORLD-H/2,WORLD/2));
 G.shake=Math.max(0,G.shake-26*dt);}
function updateRing(dt){if(!G.spells.ring)return;const p=G.player,c=SPELL_DEF.ring.lv[G.spells.ring-1];
 G.ringAng+=dt*2.2*(1+synSum('ringSpd'));G.ringTick-=dt;G.ringPos=[];
 for(let i=0;i<c.n;i++){const a=G.ringAng+i/c.n*TAU;G.ringPos.push({x:p.x+Math.cos(a)*c.r,y:p.y+Math.sin(a)*c.r});}
 if(G.ringTick<=0){G.ringTick=.4;const dm=c.dmg*G.stats.dmg*(1+synSum('minionDmg'));
  for(const f of G.ringPos)for(const e of G.enemies){if(e.dead)continue;if(Math.hypot(e.x-f.x,e.y-f.y)<e.r+14){dealDamage(e,dm);burst(e.x,e.y,'#ff9a3d',2,70);}}}}
function updateSkel(dt){if(!G.spells.skeletons)return;const p=G.player,c=SPELL_DEF.skeletons.lv[G.spells.skeletons-1];
 const need=c.n+G.stats.skelBonus+Math.round(synSum('skel'));
 while(G.minions.length<need)G.minions.push({off:rnd(0,TAU),bob:rnd(0,TAU)});G.minions.length=need;
 G.skelTick-=dt;const tick=G.skelTick<=0;if(tick)G.skelTick=.4;
 const dm=c.dmg*G.stats.dmg*(1+synSum('minionDmg'));
 for(const m of G.minions){const a=G.t*1.5*(1+synSum('ringSpd'))+m.off;
  m.x=p.x+Math.cos(a)*c.r;m.y=p.y+Math.sin(a)*c.r;m.bob+=dt*6;
  if(tick)for(const e of G.enemies){if(e.dead)continue;if(Math.hypot(e.x-m.x,e.y-m.y)<e.r+13){dealDamage(e,dm);burst(e.x,e.y,'#d7ffe0',2,70);}}}}
function updateAura(dt){if(!G.spells.aura)return;const p=G.player,c=SPELL_DEF.aura.lv[G.spells.aura-1];
 G.auraTick-=dt;
 if(G.auraTick<=0){G.auraTick=.5;
  const dm=c.dps*.5*(1+synSum('minionDmg'));
  for(const e of G.enemies){if(e.dead)continue;
   if(Math.hypot(e.x-p.x,e.y-p.y)<c.r+e.r)dealDamage(e,dm,{src:'aura'});}}}
/* --- лучи (обычные и Лазерный шторм) --- */
function updateRay(dt){const p=G.player,s=G.stats;
 if(G.spells.laserstorm){
  const c=SPELL_DEF.laserstorm.lv[0];
  G.rayMode='laser';G.rayN=1;G.rayRange=c.range;
  G.rayAng+=dt*2.6*(1+synSum('ringSpd')*.5);
  G.rayTick-=dt;
  if(G.rayTick<=0){G.rayTick=.25;
   const dx=Math.cos(G.rayAng),dy=Math.sin(G.rayAng);
   for(const e of G.enemies){if(e.dead)continue;
    const px=e.x-p.x,py=e.y-p.y;const proj=px*dx+py*dy;
    if(proj>0&&proj<c.range){const perp=Math.abs(px*dy-py*dx);
     if(perp<e.r+c.width)dealDamage(e,c.dmg*s.dmg);}}}
 }else if(G.spells.ray){
  const c=SPELL_DEF.ray.lv[G.spells.ray-1];
  const n=c.n+s.raysBonus;
  G.rayMode='ray';G.rayN=n;G.rayRange=c.range;
  G.rayAng+=dt*1.5*(1+synSum('ringSpd')*.5);
  G.rayTick-=dt;
  if(G.rayTick<=0){G.rayTick=.25;
   for(let i=0;i<n;i++){const a=G.rayAng+i/n*TAU;
    const dx=Math.cos(a),dy=Math.sin(a);
    for(const e of G.enemies){if(e.dead)continue;
     const px=e.x-p.x,py=e.y-p.y;const proj=px*dx+py*dy;
     if(proj>0&&proj<c.range){const perp=Math.abs(px*dy-py*dx);
      if(perp<e.r+9)dealDamage(e,c.dmg*s.dmg);}}}}}
 else{G.rayMode=null;G.rayN=0;}}
/* --- вихри (Смерч и Великий вихрь) --- */
function updateCyclone(dt){const p=G.player,s=G.stats;
 let par=null;
 if(G.spells.vortex)par=SPELL_DEF.vortex.lv[0];
 else if(G.spells.cyclone)par=SPELL_DEF.cyclone.lv[G.spells.cyclone-1];
 if(!par){G.cycPos=[];return;}
 const spd=(G.spells.vortex?1.9:1.2)*(1+synSum('ringSpd')*.5);
 G.cycAng+=dt*spd;
 const orbR=G.spells.vortex?175:150;
 G.cycPos=[];
 for(let i=0;i<par.n;i++){const a=G.cycAng+i/par.n*TAU;
  G.cycPos.push({x:p.x+Math.cos(a)*orbR,y:p.y+Math.sin(a)*orbR,r:par.r});}
 G.cycTick-=dt;
 const pull=par.pull*(1+synSum('pull'));
 const dm=par.dmg*s.dmg*(s.electro?1.4:1)*(1+synSum('minionDmg'));
 if(G.cycTick<=0){G.cycTick=.4;
  for(const cp of G.cycPos){
   for(const e of G.enemies){if(e.dead||e.boss||e.type==='tower')continue;
    const d=Math.hypot(e.x-cp.x,e.y-cp.y);
    if(d<par.r+e.r){dealDamage(e,dm);
     if(d>6){const a=Math.atan2(cp.y-e.y,cp.x-e.x);
      e.x+=Math.cos(a)*pull*.4;e.y+=Math.sin(a)*pull*.4;}}}}}}