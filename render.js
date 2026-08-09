'use strict';
/* ===== render.js: отрисовка, HUD, ввод, меню, главный цикл ===== */

(function buildMenu(){
 const row=$('classRow');
 for(const k in CLASSES){const C=CLASSES[k];const el=document.createElement('div');
  el.className='classCard';el.style.setProperty('--ac',C.color);
  const trail=C.pool.slice(0,4).map(id=>SPELL_DEF[id].icon).join(' ');
  const cbs=COMBOS.filter(c=>c.cls===k);
  const pet=PET_DEF[k];
  el.innerHTML=`<div class="ccGlyph">${C.letter}</div><div class="ccName">${C.name}</div>
   <div class="ccDesc">${C.desc}</div>
   <div class="ccStart">Старт: ${SPELL_DEF[C.start].icon} ${SPELL_DEF[C.start].name} · Питомец: ${pet.icon}</div>
   <div class="ccPath">${trail}</div>
   <div class="ccCombo">★ Эволюции: ${cbs.map(c=>c.icon+' '+c.name).join(' · ')||'—'}</div>
   <div class="ccCount">Свободный выбор магии · синергии из связок</div>
   <button class="testStart">🧪 ТЕСТИРОВАТЬ</button>`;
  el.onclick=()=>{initAudio();startGame(k,false);};
  el.querySelector('.testStart').addEventListener('click',ev=>{
   ev.stopPropagation();initAudio();startGame(k,true);});
  row.appendChild(el);}
 const rf=$('runeField'),runes='ᚠᚢᚦᚨᚱᚲᚷᚹᛉᛋᛏᛒᛖᛗᛚᛜᛞᛟ';
 for(let i=0;i<26;i++){const s=document.createElement('span');s.className='rune';s.textContent=runes[Math.random()*runes.length|0];
  s.style.left=rnd(0,100)+'%';s.style.top=rnd(30,110)+'%';s.style.fontSize=rnd(11,26)+'px';
  s.style.color=pickArr(['#ffd166','#7ee8fa','#c99bff','#8ce99a']);s.style.animationDuration=rnd(9,22)+'s';s.style.animationDelay=rnd(-20,0)+'s';rf.appendChild(s);}
})();

function hudTick(){const p=G.player;
 $('xpfill').style.width=(100*p.xp/p.xpNext)+'%';
 $('hpfill').style.width=(100*clamp(p.hp/p.maxhp,0,1))+'%';
 $('hpfill').classList.toggle('low',p.hp<p.maxhp*.3);
 $('hptext').textContent=`💨 ${Math.round(BALANCE.player.speed*G.stats.spdMul)} ск · 🛡 ${Math.round(getArmor())} броня · 🐾 ${G.pets.length}`;
 $('timer').textContent=fmt(G.t);
 $('pathInfo').textContent=(G.test?`🧪 ТЕСТ · ${G.speedMul.toFixed(1)}× · слож ${G.diff} · `:'')+`${G.cls.name} · синергий: ${activeSynergies().length}`;
 $('rightPan').innerHTML=`УРОВЕНЬ <b>${p.level}</b><br>УБИЙСТВ: <b>${G.kills}</b><br><span id="goldTxt">💰 ${G.gold}</span>`;
 $('flash').style.opacity=G.hitFlash>0?G.hitFlash:0;
 const bb=$('bossbar');
 if(G.bossRef&&!G.bossRef.dead){bb.classList.remove('hide');$('bossname').textContent='☠ '+G.bossRef.bossName;
  $('bossfill').style.width=(100*G.bossRef.hp/G.bossRef.maxhp)+'%';}
 else bb.classList.add('hide');}

function render(){const p=G.player,cam=G.cam;
 ctx.fillStyle='#070a15';ctx.fillRect(0,0,W,H);
 ctx.save();
 const shx=(Math.random()-.5)*G.shake,shy=(Math.random()-.5)*G.shake;
 ctx.translate(-cam.x+W/2+shx,-cam.y+H/2+shy);
 const lg=ctx.createRadialGradient(p.x,p.y,40,p.x,p.y,430);lg.addColorStop(0,'rgba(46,66,130,.22)');lg.addColorStop(1,'rgba(0,0,0,0)');
 ctx.fillStyle=lg;ctx.fillRect(p.x-440,p.y-440,880,880);
 ctx.strokeStyle='rgba(120,140,255,.05)';ctx.lineWidth=1;ctx.beginPath();
 for(let x=Math.floor((cam.x-W/2)/90)*90;x<cam.x+W/2;x+=90){ctx.moveTo(x,cam.y-H/2);ctx.lineTo(x,cam.y+H/2);}
 for(let y=Math.floor((cam.y-H/2)/90)*90;y<cam.y+H/2;y+=90){ctx.moveTo(cam.x-W/2,y);ctx.lineTo(cam.x+W/2,y);}
 ctx.stroke();
 for(const d of G.deco){ctx.save();ctx.translate(d.x,d.y);ctx.rotate(G.t*d.s);ctx.strokeStyle=d.c;ctx.lineWidth=1.5;ctx.setLineDash([12,16]);ctx.beginPath();ctx.arc(0,0,d.r,0,TAU);ctx.stroke();ctx.setLineDash([4,10]);ctx.beginPath();ctx.arc(0,0,d.r*.72,0,TAU);ctx.stroke();ctx.setLineDash([]);ctx.restore();}
 ctx.fillStyle='#aab6ff';for(const q of G.dust){ctx.globalAlpha=.1+.09*Math.sin(G.t*1.5+q.ph);ctx.beginPath();ctx.arc(q.x,q.y,q.r,0,TAU);ctx.fill();}ctx.globalAlpha=1;
 ctx.strokeStyle='rgba(255,120,120,.35)';ctx.lineWidth=3;ctx.setLineDash([18,12]);ctx.strokeRect(0,0,WORLD,WORLD);ctx.setLineDash([]);
 for(const z of G.zones){
  if(z.type==='plague'){ctx.fillStyle='rgba(140,233,154,.13)';ctx.beginPath();ctx.arc(z.x,z.y,z.r,0,TAU);ctx.fill();ctx.strokeStyle='rgba(140,233,154,.4)';ctx.lineWidth=1.5;ctx.stroke();}
  else if(z.type==='meteor'){const pr=1-z.t/z.dur;ctx.strokeStyle='rgba(255,120,80,.8)';ctx.lineWidth=2;ctx.beginPath();ctx.arc(z.x,z.y,z.r,0,TAU);ctx.stroke();ctx.fillStyle='rgba(255,140,70,.16)';ctx.beginPath();ctx.moveTo(z.x,z.y);ctx.arc(z.x,z.y,z.r,-Math.PI/2,-Math.PI/2+pr*TAU);ctx.fill();}
  else if(z.type==='void'){const pr=clamp(z.t/z.dur,0,1);
   ctx.fillStyle=`rgba(70,30,110,${.25+.2*pr})`;ctx.beginPath();ctx.arc(z.x,z.y,z.r,0,TAU);ctx.fill();
   ctx.strokeStyle=`rgba(201,155,255,${.7*pr+.2})`;ctx.lineWidth=2;
   ctx.beginPath();ctx.arc(z.x,z.y,z.r*(1+.08*Math.sin(G.t*8)),0,TAU);ctx.stroke();
   ctx.fillStyle='rgba(10,5,20,.85)';ctx.beginPath();ctx.arc(z.x,z.y,z.r*.4,0,TAU);ctx.fill();}
  else if(z.type==='fx'){const pr=1-z.t/z.dur,r=lerp(z.r0,z.r1,pr);ctx.globalAlpha=1-pr;ctx.strokeStyle=z.col;ctx.lineWidth=z.w;ctx.beginPath();ctx.arc(z.x,z.y,r,0,TAU);ctx.stroke();ctx.globalAlpha=1;}}
 if(G.merchant&&!G.merchant.used){const m=G.merchant;
  ctx.fillStyle='rgba(255,209,102,.15)';ctx.beginPath();ctx.arc(m.x,m.y,34+Math.sin(G.t*3)*4,0,TAU);ctx.fill();
  ctx.font='34px Rubik';ctx.textAlign='center';ctx.fillText('🧙',m.x,m.y+12);}
 for(const ch of G.chests){
  if(ch.golden){ctx.strokeStyle='rgba(255,209,102,.6)';ctx.lineWidth=2;
   ctx.beginPath();ctx.arc(ch.x,ch.y,20+Math.sin(ch.t*4)*3,0,TAU);ctx.stroke();}
  ctx.font='26px Rubik';ctx.textAlign='center';
  ctx.fillText('📦',ch.x,ch.y+9+Math.sin(ch.t*3)*2);}
 for(const h of G.hearts){
  ctx.save();ctx.shadowColor='#ff6b8a';ctx.shadowBlur=10;
  ctx.font='16px Rubik';ctx.textAlign='center';
  ctx.fillText('❤',h.x,h.y+5+Math.sin(h.t*5)*2);
  ctx.restore();}
 /* вихри */
 for(const cp of G.cycPos){
  ctx.save();ctx.translate(cp.x,cp.y);ctx.rotate(G.t*6);
  ctx.strokeStyle='rgba(140,233,154,.65)';ctx.lineWidth=3;
  ctx.beginPath();ctx.arc(0,0,cp.r,0,TAU*0.7);ctx.stroke();
  ctx.rotate(2.1);ctx.strokeStyle='rgba(110,203,255,.5)';ctx.lineWidth=2;
  ctx.beginPath();ctx.arc(0,0,cp.r*.65,0,TAU*0.7);ctx.stroke();
  ctx.restore();}
 for(const e of G.enemies){const a=Math.atan2(p.y-e.y,p.x-e.x);
  if(e.type==='tower'){ctx.fillStyle='#3a2f1a';ctx.fillRect(e.x-e.r*.7,e.y-e.r,e.r*1.4,e.r*2);
   ctx.strokeStyle='#ffd166';ctx.lineWidth=2;ctx.strokeRect(e.x-e.r*.7,e.y-e.r,e.r*1.4,e.r*2);
   ctx.fillStyle='#ffd166';ctx.beginPath();ctx.arc(e.x,e.y-e.r*.3,6+Math.sin(G.t*6)*2,0,TAU);ctx.fill();
   ctx.fillStyle='rgba(0,0,0,.5)';ctx.fillRect(e.x-e.r,e.y-e.r-12,e.r*2,5);
   ctx.fillStyle='#ffd166';ctx.fillRect(e.x-e.r,e.y-e.r-12,e.r*2*clamp(e.hp/e.maxhp,0,1),5);continue;}
  ctx.fillStyle=e.col;ctx.beginPath();ctx.arc(e.x,e.y,e.r,0,TAU);ctx.fill();
  ctx.strokeStyle=e.slowT>0?'rgba(150,220,255,.9)':e.elite?'#ffd166':'rgba(0,0,0,.4)';ctx.lineWidth=e.elite||e.boss?2.5:1.5;ctx.stroke();
  if(e.boss){ctx.strokeStyle='rgba(255,95,109,.4)';ctx.lineWidth=2;ctx.beginPath();ctx.arc(e.x,e.y,e.r+7+Math.sin(G.t*4)*3,0,TAU);ctx.stroke();}
  ctx.fillStyle='#0a0e1d';ctx.beginPath();ctx.arc(e.x+Math.cos(a-.5)*e.r*.45,e.y+Math.sin(a-.5)*e.r*.45,e.r*.16+1,0,TAU);ctx.arc(e.x+Math.cos(a+.5)*e.r*.45,e.y+Math.sin(a+.5)*e.r*.45,e.r*.16+1,0,TAU);ctx.fill();
  if(e.flash>0){ctx.fillStyle=`rgba(255,255,255,${e.flash*8})`;ctx.beginPath();ctx.arc(e.x,e.y,e.r,0,TAU);ctx.fill();}
  if(e.elite){ctx.fillStyle='rgba(0,0,0,.5)';ctx.fillRect(e.x-e.r,e.y-e.r-9,e.r*2,4);ctx.fillStyle='#ffd166';ctx.fillRect(e.x-e.r,e.y-e.r-9,e.r*2*clamp(e.hp/e.maxhp,0,1),4);}}
 for(const o of G.orbs){const gr=ctx.createRadialGradient(o.x,o.y,2,o.x,o.y,o.r+8);gr.addColorStop(0,'#eaf7ff');gr.addColorStop(.5,'rgba(126,200,255,.8)');gr.addColorStop(1,'rgba(126,200,255,0)');ctx.fillStyle=gr;ctx.beginPath();ctx.arc(o.x,o.y,o.r+8,0,TAU);ctx.fill();}
 for(const m of G.minions){ctx.fillStyle='#e8e3d0';ctx.beginPath();ctx.arc(m.x,m.y+Math.sin(m.bob)*2,9,0,TAU);ctx.fill();ctx.fillStyle='#1a1c2c';ctx.beginPath();ctx.arc(m.x-3,m.y-2+Math.sin(m.bob)*2,2,0,TAU);ctx.arc(m.x+3,m.y-2+Math.sin(m.bob)*2,2,0,TAU);ctx.fill();}
 for(const f of G.ringPos){const gr=ctx.createRadialGradient(f.x,f.y,1,f.x,f.y,15);gr.addColorStop(0,'#ffe9a3');gr.addColorStop(.5,'rgba(255,138,61,.85)');gr.addColorStop(1,'rgba(255,138,61,0)');ctx.fillStyle=gr;ctx.beginPath();ctx.arc(f.x,f.y,15,0,TAU);ctx.fill();}
 const blink=p.ifr>0&&(G.t*20|0)%2===0;
 if(!blink){
  if(G.spells.aura){const c=SPELL_DEF.aura.lv[G.spells.aura-1];
   ctx.fillStyle='rgba(140,233,154,.07)';ctx.beginPath();ctx.arc(p.x,p.y,c.r,0,TAU);ctx.fill();
   ctx.strokeStyle='rgba(140,233,154,.3)';ctx.lineWidth=1.5;ctx.stroke();}
  const gr=ctx.createRadialGradient(p.x,p.y,2,p.x,p.y,30);gr.addColorStop(0,G.cls.color);gr.addColorStop(1,'rgba(0,0,0,0)');
  ctx.globalAlpha=.5;ctx.fillStyle=gr;ctx.beginPath();ctx.arc(p.x,p.y,30,0,TAU);ctx.fill();ctx.globalAlpha=1;
  ctx.fillStyle=G.cls.color;ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,TAU);ctx.fill();ctx.strokeStyle='rgba(255,255,255,.75)';ctx.lineWidth=1.5;ctx.stroke();
  ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(p.x,p.y,p.r*.45,0,TAU);ctx.fill();
  const sx=p.x+Math.cos(p.face)*19,sy=p.y+Math.sin(p.face)*19;ctx.fillStyle='#ffd166';ctx.beginPath();ctx.arc(sx,sy,4+Math.sin(G.t*6),0,TAU);ctx.fill();
  if(G.spells.shield||G.spells.archon){ctx.strokeStyle='rgba(255,209,102,.55)';ctx.lineWidth=2;ctx.setLineDash([10,8]);ctx.lineDashOffset=-G.t*30;ctx.beginPath();ctx.arc(p.x,p.y,p.r+11,0,TAU);ctx.stroke();ctx.setLineDash([]);}}
 /* миражи */
 if(G.mirrorPos&&G.mirrorPos.length){
  for(const mp of G.mirrorPos){
   ctx.globalAlpha=.45;
   ctx.fillStyle=G.cls.color;ctx.beginPath();ctx.arc(mp.x,mp.y,11,0,TAU);ctx.fill();
   ctx.strokeStyle='rgba(255,255,255,.6)';ctx.lineWidth=1;ctx.stroke();
   ctx.globalAlpha=1;}}
 /* питомцы */
 for(const pet of G.pets){
  const gr=ctx.createRadialGradient(pet.x,pet.y,1,pet.x,pet.y,16);
  gr.addColorStop(0,pet.col);gr.addColorStop(1,'rgba(0,0,0,0)');
  ctx.globalAlpha=.4;ctx.fillStyle=gr;ctx.beginPath();ctx.arc(pet.x,pet.y,16,0,TAU);ctx.fill();ctx.globalAlpha=1;
  const by=pet.y+Math.sin(pet.bob)*2.5;
  ctx.fillStyle=pet.col;ctx.beginPath();ctx.arc(pet.x,by,pet.r,0,TAU);ctx.fill();
  ctx.strokeStyle='rgba(255,255,255,.7)';ctx.lineWidth=1.2;ctx.stroke();
  ctx.fillStyle='#0a0e1d';ctx.beginPath();ctx.arc(pet.x-3,by-2,1.6,0,TAU);ctx.arc(pet.x+3,by-2,1.6,0,TAU);ctx.fill();}
 /* HP под героем */
 {const bw=36;
  ctx.fillStyle='rgba(0,0,0,.55)';ctx.fillRect(p.x-bw/2,p.y+p.r+8,bw,5);
  ctx.fillStyle=p.hp<p.maxhp*.3?'#ff5f6d':'#7dd88a';
  ctx.fillRect(p.x-bw/2,p.y+p.r+8,bw*clamp(p.hp/p.maxhp,0,1),5);}
 /* лучи */
 if(G.rayMode){
  const w=G.rayMode==='laser'?26:6;
  for(let i=0;i<G.rayN;i++){
   const a=G.rayAng+(G.rayMode==='ray'?i/G.rayN*TAU:0);
   const x2=p.x+Math.cos(a)*G.rayRange,y2=p.y+Math.sin(a)*G.rayRange;
   ctx.strokeStyle=G.rayMode==='laser'?'rgba(255,209,102,.28)':'rgba(201,155,255,.22)';
   ctx.lineWidth=w+8;ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(x2,y2);ctx.stroke();
   ctx.strokeStyle=G.rayMode==='laser'?'rgba(255,235,170,.9)':'rgba(228,210,255,.85)';
   ctx.lineWidth=w*.35;ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(x2,y2);ctx.stroke();}}
 for(const b of G.bullets){ctx.fillStyle=b.col;ctx.beginPath();ctx.arc(b.x,b.y,b.r,0,TAU);ctx.fill();ctx.globalAlpha=.35;ctx.beginPath();ctx.arc(b.x-b.vx*.02,b.y-b.vy*.02,b.r*.8,0,TAU);ctx.fill();ctx.globalAlpha=1;}
 for(const b of G.ebullets){ctx.fillStyle='#ff5f6d';ctx.beginPath();ctx.arc(b.x,b.y,b.r,0,TAU);ctx.fill();ctx.strokeStyle='rgba(255,150,150,.6)';ctx.stroke();}
 for(const bm of G.beams){const a=bm.t/bm.dur;ctx.globalAlpha=a;ctx.strokeStyle=bm.col;ctx.lineWidth=3;ctx.shadowColor=bm.col;ctx.shadowBlur=10;ctx.beginPath();
  for(let i=0;i<bm.pts.length-1;i++){const[x1,y1]=bm.pts[i],[x2,y2]=bm.pts[i+1];ctx.moveTo(x1,y1);const mx=(x1+x2)/2+rnd(-9,9),my=(y1+y2)/2+rnd(-9,9);ctx.lineTo(mx,my);ctx.lineTo(x2,y2);}
  ctx.stroke();ctx.shadowBlur=0;ctx.globalAlpha=1;}
 ctx.globalCompositeOperation='lighter';
 for(const q of G.parts){ctx.globalAlpha=clamp(q.t/q.dur,0,1);ctx.fillStyle=q.col;ctx.beginPath();ctx.arc(q.x,q.y,q.r,0,TAU);ctx.fill();}
 ctx.globalCompositeOperation='source-over';ctx.globalAlpha=1;
 ctx.font='700 13px Rubik';ctx.textAlign='center';
 for(const t of G.texts){ctx.globalAlpha=clamp(t.t/.7,0,1);ctx.fillStyle='#000';ctx.fillText(t.txt,t.x+1,t.y+1);ctx.fillStyle=t.col;ctx.fillText(t.txt,t.x,t.y);}
 ctx.globalAlpha=1;ctx.restore();
 if(G.merchant&&!G.merchant.used&&state==='play'){const sx2=G.merchant.x-cam.x+W/2,sy2=G.merchant.y-cam.y+H/2;
  if(sx2<0||sx2>W||sy2<0||sy2>H){const cx=W/2,cy=H/2;const ang=Math.atan2(sy2-cy,sx2-cx);
   const ex=clamp(cx+Math.cos(ang)*10000,30,W-30),ey=clamp(cy+Math.sin(ang)*10000,60,H-30);
   ctx.save();ctx.translate(ex,ey);ctx.rotate(ang);ctx.fillStyle='#ffd166';
   ctx.beginPath();ctx.moveTo(14,0);ctx.lineTo(-8,-9);ctx.lineTo(-8,9);ctx.closePath();ctx.fill();ctx.restore();
   ctx.font='18px Rubik';ctx.textAlign='center';ctx.fillText('🧙',ex,ey-14);}}}

/* --- ввод --- */
addEventListener('keydown',e=>{initAudio();
 if(e.code==='KeyM'){muted=!muted;$('muteBtn').textContent=muted?'🔇':'🔊';return;}
 if(G&&G.test&&e.code==='KeyT'){
  if(state==='play')openTest();else if(state==='test')closeTest();return;}
 if(e.code==='Escape'){
  if(state==='play')setPause(true);
  else if(state==='pause')setPause(false);
  else if(state==='shop')closeShop();
  else if(state==='test')closeTest();
  return;}
 keys[e.code]=true;});
addEventListener('keyup',e=>keys[e.code]=false);
addEventListener('mousemove',e=>{mouse.x=e.clientX;mouse.y=e.clientY;});
addEventListener('mousedown',e=>{initAudio();if(e.target===cv)mouse.down=true;});
addEventListener('mouseup',()=>mouse.down=false);
addEventListener('touchstart',e=>{initAudio();if(e.target===cv){mouse.down=true;mouse.x=e.touches[0].clientX;mouse.y=e.touches[0].clientY;}},{passive:true});
addEventListener('touchmove',e=>{mouse.x=e.touches[0].clientX;mouse.y=e.touches[0].clientY;},{passive:true});
addEventListener('touchend',()=>mouse.down=false);
addEventListener('blur',()=>{if(state==='play')setPause(true);});
addEventListener('error',e=>console.error('[MS ошибка]',e.message,e.filename+':'+e.lineno));

/* --- кнопки --- */
$('muteBtn').onclick=()=>{muted=!muted;$('muteBtn').textContent=muted?'🔇':'🔊';};
$('resumeBtn').onclick=()=>setPause(false);
$('pauseMenuBtn').onclick=toMenu;
$('overRestart').onclick=()=>startGame(G.key,G.test);
$('overMenu').onclick=toMenu;
$('winGo').onclick=()=>{G.endless=true;$('winOv').classList.add('hide');state='play';banner('БЕСКОНЕЧНЫЙ РЕЖИМ','#ff8a8a');};
$('winMenu').onclick=toMenu;
$('shopClose').onclick=closeShop;
document.querySelectorAll('.tabbtn').forEach(b=>b.onclick=()=>{
 document.querySelectorAll('.tabbtn').forEach(x=>x.classList.remove('active'));b.classList.add('active');
 const t=b.dataset.tab;
 $('tab-magic').classList.toggle('hide',t!=='magic');
 $('tab-combos').classList.toggle('hide',t!=='combos');
 $('tab-syn').classList.toggle('hide',t!=='syn');
 $('tab-arts').classList.toggle('hide',t!=='arts');});

/* --- главный цикл --- */
let last=0;
function frame(ts){requestAnimationFrame(frame);
 const now=ts*.001;const dt=Math.min(.05,(now-last)||.016);last=now;
 if(!G)return;
 if(state==='play'){
  if(G.test)G.pendLevel=0;
  if(G.choiceDelay>0){G.choiceDelay-=dt;if(G.choiceDelay<0)G.choiceDelay=0;}
  if(G.pendLevel>0&&G.choiceDelay<=0&&!G.test)openChoice();
  else update(Math.min(.15,dt*(G.speedMul||1)));
 }
 render();hudTick();}
requestAnimationFrame(frame);