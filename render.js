'use strict';
const INK='#eaf7ff';const TIERCOL=['#5aa7ff','#7dd88a','#ffd166','#ff5f6d'];
const EGLYPH={blob:'Ω',runner:'Ψ',brute:'Ξ',wave:'∆',tower:'§',boss:'Ω',shooter:'λ',healer:'✚',guard:'Ω'};
function glyph(ch,x,y,size,alpha,glow,color){ctx.globalAlpha=alpha==null?1:alpha;ctx.font=size+'px VT323, monospace';ctx.textAlign='center';ctx.textBaseline='middle';if(glow){ctx.shadowColor='#bfe9ff';ctx.shadowBlur=glow;}ctx.fillStyle=color||INK;ctx.fillText(ch,x,y);ctx.shadowBlur=0;ctx.globalAlpha=1;}
function bGlyph(b){if(b.kind==='fire')return'*';if(b.homing)return'✦';if(b.return)return'»';if(b.kind==='pierce'){if(b.r>=15)return'≈';if(b.r<=4)return'·';if(b.slow)return'^';return'>';}return'*';}
function drawShooterBG(){const warp=G.shoot&&G.shoot.warp>0,dist=G.shoot?G.shoot.dist:0;
 const g=ctx.createLinearGradient(0,0,0,H);
 g.addColorStop(0,'#0b0b2e');g.addColorStop(.5,'#1b0b40');g.addColorStop(1,'#050512');
 ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
 for(let i=0;i<60;i++){const x=(i*97.3)%W,sp=(i%3===0?2.2:1.2),y=((i*211)+dist*sp)%H,sz=(i%3===0?2:1);
  ctx.fillStyle='#cfe9ff';ctx.fillRect(x,y,sz,sz);}
 const n=warp?60:10;
 for(let i=0;i<n;i++){const x=(i*173+dist*3)%W,y=((i*61)+dist*(warp?8:4))%H;
  ctx.fillStyle='#bfe9ff';ctx.fillRect(x,y,warp?3:2,warp?40:14);}
 ctx.globalAlpha=1;}
(function buildMenu(){const row=$('classRow');
 for(const k in CLASSES){const C=CLASSES[k];const el=document.createElement('div');el.className='classCard';
  const cbs=COMBOS.filter(c=>c.cls===k);
  el.innerHTML=`<div class="ccGlyph">${C.letter}</div><div class="ccName">${C.name}</div><div class="ccDesc">${C.desc}</div><div class="ccStart">старт: ${SPELL_DEF[C.start].icon} · пет: ¤</div><div class="ccCombo">сборка: ${cbs.map(c=>c.name).join(' → ')||'—'}</div><button class="testStart">[¤] ТЕСТ</button>`;
  el.onclick=()=>{initAudio();startGame(k,false);};
  el.querySelector('.testStart').addEventListener('click',ev=>{ev.stopPropagation();initAudio();startGame(k,true);});
  row.appendChild(el);}
 const rf=$('runeField'),runes='ΩΨΞ∆§†¤◊*~^.,:';
 for(let i=0;i<26;i++){const s=document.createElement('span');s.className='rune';s.textContent=runes[Math.random()*runes.length|0];s.style.left=rnd(0,100)+'%';s.style.top=rnd(30,110)+'%';s.style.fontSize=rnd(12,26)+'px';s.style.animationDuration=rnd(9,22)+'s';s.style.animationDelay=rnd(-20,0)+'s';rf.appendChild(s);}
 document.querySelectorAll('.diffBtn').forEach(b=>b.onclick=()=>{menuDiff=+b.dataset.d;document.querySelectorAll('.diffBtn').forEach(x=>x.classList.toggle('active',+x.dataset.d===menuDiff));});
 document.querySelectorAll('.vowBtn').forEach(b=>b.onclick=()=>{menuVow=b.dataset.v;document.querySelectorAll('.vowBtn').forEach(x=>x.classList.toggle('active',x.dataset.v===menuVow));});
 const dc=dailyCfg();$('dailyLabel').textContent='сегодня: '+CLASSES[dc.cls].name+' · '+(dc.vow?VOWS[dc.vow]:'без обета')+' · '+(dc.diff===2?'ХАОС':'норма')+' · '+dc.mut.name;
 $('dailyBtn').onclick=()=>{initAudio();const c=dailyCfg();startGame(c.cls,false,true);};
 $('achBtn').onclick=()=>{buildAch();$('achOv').classList.remove('hide');};
 $('achClose').onclick=()=>$('achOv').classList.add('hide');
 updateBestLine();})();
function updateBestLine(){try{
 const n=JSON.parse(localStorage.getItem('ms_best_norm')||'null');
 const c=JSON.parse(localStorage.getItem('ms_best_chaos')||'null');
 const vn=v=>v?(VOWS[v]||v):'';let s='';
 if(n)s+='норма'+(vn(n.vow)?'·'+vn(n.vow):'')+' — '+fmt(n.t)+' · '+n.k+' уб · LV'+n.l+' · побед '+n.w+'  ';
 if(c)s+='хаос'+(vn(c.vow)?'·'+vn(c.vow):'')+' — '+fmt(c.t)+' · '+c.k+' уб · LV'+c.l+' · побед '+c.w;
 $('bestLine').textContent=s||'рекордов пока нет';}catch(e){$('bestLine').textContent='';}}
function buildAch(){const m=loadMeta();
 let h=`<div class="listRow"><div class="li">@</div><div class="ln">забегов/побед</div><div class="ll">${m.runs}/${m.wins}</div></div><div class="listRow"><div class="li">Ω</div><div class="ln">убийств</div><div class="ll">${m.kills}</div></div><div class="listRow"><div class="li">~</div><div class="ln">время</div><div class="ll">${fmt(m.time)}</div></div><div class="secHead">ДОСТИЖЕНИЯ</div>`;
 for(const a of ACH){const on=m.ach[a.id];h+=`<div class="listRow" style="${on?'':'opacity:.4'}"><div class="li">${on?'✦':'·'}</div><div class="ln">${a.name}<br><span class="ld">${a.desc}</span></div><div class="ll">${on?'✔':''}</div></div>`;}
 $('achPane').innerHTML=h;}
function barStr(f,len){const n=Math.round(clamp(f,0,1)*len);return'█'.repeat(n)+'░'.repeat(len-n);}
function hudTick(){const p=G.player;
 $('hudline').textContent=`HP ${barStr(p.hp/p.maxhp,14)} ${Math.ceil(p.hp)}  XP ${barStr(p.xp/p.xpNext,10)}  ${fmt(G.t)}  $${G.gold}  LV${p.level}`;
 $('hudsub').textContent=`${G.cls.icon} ${G.cls.name} · син:${activeSynergies().length} · пет:${G.pets.length} · ${G.diffMode===2?'ХАОС':'норма'}${G.vow?' · '+VOWS[G.vow]:''}${G.ev?' · '+({meteor:'*',fog:'=',tide:'≈',bless:'✦'}[G.ev.type]):''}`;
 $('flash').style.opacity=G.hitFlash>0?G.hitFlash:0;
 const bl=$('bossline');
 if(G.bossRef&&!G.bossRef.dead){bl.classList.remove('hide');
  const af=G.bossRef.aff?({fast:'»',regen:'+',thorns:'∗',split:'÷'}[G.bossRef.aff]+' '):'';
  bl.textContent=`[[Ω]] ${af}${G.bossRef.bossName} ${barStr(G.bossRef.hp/G.bossRef.maxhp,20)}`;}
 else bl.classList.add('hide');}
function drawLog(){const now=G.t;const items=G.log.filter(l=>now-l.t<6).slice(-6);let y=H-150;ctx.textAlign='left';
 for(let i=items.length-1;i>=0;i--){const l=items[i],age=now-l.t;ctx.globalAlpha=clamp(1-age/6,0,1)*.85;ctx.font='15px VT323, monospace';ctx.textBaseline='middle';ctx.fillStyle=INK;ctx.fillText('> '+l.txt,14,y);y-=17;}ctx.globalAlpha=1;}
function drawRadar(){const rw=120,rh=66,ox=W-rw-14,oy=56;
 for(let x=0;x<=rw;x+=10){glyph('·',ox+x,oy,10,.5);glyph('·',ox+x,oy+rh,10,.5);}
 for(let y=0;y<=rh;y+=11){glyph('·',ox,oy+y,10,.5);glyph('·',ox+rw,oy+y,10,.5);}
 const cells={},ctier={};
 for(const e of G.enemies){const cx=Math.min(19,Math.floor(e.x/WORLD*20)),cy=Math.min(10,Math.floor(e.y/WORLD*11));const k=cx+','+cy;cells[k]=(cells[k]||0)+1;ctier[k]=Math.max(ctier[k]||0,e.tier||1);}
 for(const k in cells){const[cx,cy]=k.split(',').map(Number);const n=cells[k],tr=ctier[k];
  const col=G.settings.color?TIERCOL[tr-1]:null;
  glyph(n>6?'#':n>3?'*':n>1?':':'·',ox+cx*6+3,oy+cy*6+3,11,.5+tr*.12,0,col);}
 if(G.bossRef&&!G.bossRef.dead){glyph('Ω',ox+rw/2,oy+rh/2,14,1,4);}
 ctx.font='13px VT323, monospace';ctx.textAlign='left';ctx.textBaseline='top';ctx.fillStyle='#7d8fa8';
 ctx.fillText('АКТ '+(Math.min(3,Math.floor(G.t/150))+1)+' '+ACTS[Math.min(3,Math.floor(G.t/150))].name,ox,oy+rh+6);}
function drawPointer(wx,wy,ch,color){const sx=wx-G.cam.x+W/2,sy=wy-G.cam.y+H/2;
 if(sx>20&&sx<W-20&&sy>60&&sy<H-20)return;
 const cx=W/2,cy=H/2,ang=Math.atan2(sy-cy,sx-cx);
 const ex=clamp(cx+Math.cos(ang)*10000,30,W-30),ey=clamp(cy+Math.sin(ang)*10000,70,H-30);
 ctx.save();ctx.translate(ex,ey);ctx.rotate(ang);ctx.fillStyle=color;ctx.shadowColor=color;ctx.shadowBlur=10;
 ctx.beginPath();ctx.moveTo(14,0);ctx.lineTo(-8,-9);ctx.lineTo(-8,9);ctx.closePath();ctx.fill();ctx.restore();
 ctx.font='18px VT323, monospace';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle=color;ctx.fillText(ch,ex,ey-16);}
function render(){const p=G.player,cam=G.cam;
 cv.style.filter=(G.invertT>0)?'invert(1)':'';
ctx.fillStyle='rgba(0,0,0,.5)';ctx.fillRect(0,0,W,H);
  if(G.mode==='shooter')drawShooterBG();
  ctx.save();
  const sh=(G.settings&&G.settings.shake)?G.shake:0;
  ctx.translate(-cam.x+W/2+(Math.random()-.5)*sh,-cam.y+H/2+(Math.random()-.5)*sh);
  if(G.mode!=='shooter'){const F=ACTS[Math.min(3,Math.floor(G.t/150))].floor;
  const lg=ctx.createRadialGradient(p.x,p.y,10,p.x,p.y,180);lg.addColorStop(0,'rgba(220,245,255,.2)');lg.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=lg;ctx.fillRect(p.x-190,p.y-190,380,380);
  for(const q of G.dust)glyph(q.ph>TAU/2?F[0]:F[1],q.x,q.y,14,.14+.08*Math.sin(G.t*1.5+q.ph));
  for(const d of G.deco){const n=Math.floor(d.r/6);for(let i=0;i<n;i++){const a=i/n*TAU+G.t*d.s;glyph('·',d.x+Math.cos(a)*d.r,d.y+Math.sin(a)*d.r,12,.1);}}
  {const st=26;for(let x=0;x<=WORLD;x+=st){glyph('·',x,0,14,.5);glyph('·',x,WORLD,14,.5);}for(let y=0;y<=WORLD;y+=st){glyph('·',0,y,14,.5);glyph('·',WORLD,y,14,.5);}}
  }
 if(G.bossRef&&G.bossArena){const ba=G.bossArena;
   ctx.strokeStyle='rgba(255,95,109,.55)';ctx.lineWidth=2;ctx.setLineDash([9,9]);
   ctx.beginPath();ctx.arc(ba.x,ba.y,ba.r,0,TAU);ctx.stroke();ctx.setLineDash([]);}
  for(const z of G.zones){
  if(z.type==='plague'){ctx.fillStyle='rgba(140,233,154,.13)';ctx.beginPath();ctx.arc(z.x,z.y,z.r,0,TAU);ctx.fill();}
  else if(z.type==='lava'){ctx.fillStyle='rgba(255,138,61,.14)';ctx.beginPath();ctx.arc(z.x,z.y,z.r,0,TAU);ctx.fill();}
  else if(z.type==='grave'){ctx.fillStyle='rgba(140,233,154,.12)';ctx.beginPath();ctx.arc(z.x,z.y,z.r,0,TAU);ctx.fill();}
  else if(z.type==='static'){ctx.fillStyle='rgba(159,232,255,.12)';ctx.beginPath();ctx.arc(z.x,z.y,z.r,0,TAU);ctx.fill();}
  else if(z.type==='meteor'){glyph('!',z.x,z.y,26,.9,10);}
  else if(z.type==='delayed'){glyph('×',z.x,z.y,18,.7,6);}
  else if(z.type==='void'){glyph('O',z.x,z.y,22,.9,12);}
  else if(z.type==='fx'){const pr=1-z.t/z.dur,r=lerp(z.r0,z.r1,pr);ctx.globalAlpha=1-pr;ctx.strokeStyle=z.col||'#fff';ctx.lineWidth=2;ctx.beginPath();ctx.arc(z.x,z.y,r,0,TAU);ctx.stroke();ctx.globalAlpha=1;}}
if(G.mode!=='shooter'){const GOLD='#ffd166';
  if(G.merchant&&!G.merchant.used){glyph('£',G.merchant.x,G.merchant.y,40,1,18,GOLD);
   ctx.strokeStyle=GOLD;ctx.globalAlpha=.5+.3*Math.sin(G.t*4);ctx.beginPath();ctx.arc(G.merchant.x,G.merchant.y,30+Math.sin(G.t*4)*4,0,TAU);ctx.stroke();ctx.globalAlpha=1;}
  for(const ch of G.chests){const c=ch.golden?GOLD:'#8ce99a';
   glyph(ch.golden?'¤':'◊',ch.x,ch.y,ch.golden?32:26,1,14,c);
   ctx.strokeStyle=c;ctx.globalAlpha=.5+.3*Math.sin(ch.t*4);ctx.beginPath();ctx.arc(ch.x,ch.y,22+Math.sin(ch.t*4)*3,0,TAU);ctx.stroke();ctx.globalAlpha=1;}
  for(const h of G.hearts)glyph('+',h.x,h.y+Math.sin(h.t*5)*2,20,.95,10);}
 for(const cp of G.cycPos){glyph('Ø',cp.x,cp.y,26,.9,10);}
 for(const e of G.enemies){const g=EGLYPH[e.type]||'Ω';const jx=e.flash>0?rnd(-2,2):0,jy=e.flash>0?rnd(-2,2):0;
  if(e.boss)glyph('[[Ω]]',e.x,e.y,40,.98,18,'#ff5f6d');
  else if(e.type==='tower')glyph('#§#',e.x,e.y,28,.95,12);
  else if(e.type==='guard')glyph('[Ω]',e.x+jx,e.y+jy,30,.95,12);
  else if(e.elite)glyph('['+g+']',e.x+jx,e.y+jy,24,.95,12);
  else{const tr=e.tier||1,ta=[.5,.7,.85,1][tr-1],tsz=[1,1.06,1.12,1.2][tr-1];
   const col=G.settings.color?TIERCOL[tr-1]:null;
   glyph(g,e.x+jx,e.y+jy,(e.type==='brute'?24:20)*tsz,e.slowT>0?.6:ta,e.slowT>0?0:6,col);
   if(tr>=4){glyph('·',e.x-e.r-6,e.y,12,ta,0,col);glyph('·',e.x+e.r+6,e.y,12,ta,0,col);}}
  if(e.flash>0)glyph('*',e.x,e.y,26,.9,10);
  if(e.aff)glyph({fast:'»',regen:'+',thorns:'∗',split:'÷'}[e.aff],e.x,e.y-e.r-12,15,.9,6);}
 for(const o of G.orbs)glyph('O',o.x,o.y,20,.9,10);
 for(const m of G.minions)glyph('†',m.x,m.y+Math.sin(m.bob)*2,18,.9,6);
 for(const f of G.ringPos)glyph('*',f.x,f.y,20,.95,10);
 if(G.mirrorPos)for(const mp of G.mirrorPos)glyph('@',mp.x,mp.y,18,.4,4);
 for(const pet of G.pets)glyph('¤',pet.x,pet.y+Math.sin(pet.bob)*2.5,18,.9,8);
if(G.mode==='shooter'){glyph('▲',p.x,p.y,36,1,20);
    const n=8,filled=Math.round(clamp(p.hp/p.maxhp,0,1)*n);
    glyph('['+'█'.repeat(filled)+'░'.repeat(n-filled)+']',p.x,p.y+30,12,.8);
    if(G.shipShield>0){ctx.save();ctx.strokeStyle='#8ce99a';ctx.lineWidth=3;ctx.shadowColor='#8ce99a';ctx.shadowBlur=12;ctx.beginPath();ctx.arc(p.x,p.y,34+Math.sin(G.t*6)*4,0,TAU);ctx.stroke();ctx.restore();}
    let bx=p.x-58;
    if(G.boost.rate>0){glyph('▲▲',bx,p.y+46,13,.9,6);bx+=22;}
    if(G.boost.spread>0){glyph('≡',bx,p.y+46,13,.9,6);bx+=22;}
    if(G.shipShield>0){glyph('◯',bx,p.y+46,13,.9,6);}
    for(const bo of G.boosts)glyph(['▲▲','≡','◯'][bo.ty],bo.x,bo.y+Math.sin(bo.t*3)*5,20,.95,10,boostColor(bo.ty));}
  else if(!(p.ifr>0&&(G.t*20|0)%2===0)){glyph('@',p.x,p.y,44,1,22);
  const n=8,filled=Math.round(clamp(p.hp/p.maxhp,0,1)*n);
  glyph('['+'█'.repeat(filled)+'░'.repeat(n-filled)+']',p.x,p.y+30,12,.8);
  if(G.spells.shield||G.spells.archon)glyph('∩',p.x,p.y-p.r-12,14,.7);}
 if(G.rayMode){const step=26,chars=['~','~','^','*'];
  for(let i=0;i<G.rayN;i++){const a=G.rayAng+(G.rayMode==='ray'?i/G.rayN*TAU:0),dx=Math.cos(a),dy=Math.sin(a);
   for(let d=step,ci=0;d<G.rayRange;d+=step,ci++){const j=(G.rayMode==='laser'?rnd(-3,3):rnd(-1.5,1.5));
    glyph(G.rayMode==='laser'?'*':chars[ci%4],p.x+dx*d-dy*j,p.y+dy*d+dx*j,G.rayMode==='laser'?22:16,clamp(1-d/G.rayRange,.15,1)*.9,G.rayMode==='laser'?10:5);}}}
 for(const b of G.bullets){const g=bGlyph(b);glyph(g,b.x-b.vx*.03,b.y-b.vy*.03,14,.3);glyph(g,b.x-b.vx*.015,b.y-b.vy*.015,16,.55);glyph(g,b.x,b.y,18,.95,8);}
 for(const b of G.ebullets)glyph('o',b.x,b.y,16,.9,6);
 for(const bm of G.beams){const a=bm.t/bm.dur;ctx.globalAlpha=a;ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.shadowColor='#bfe9ff';ctx.shadowBlur=10;ctx.beginPath();
  for(let i=0;i<bm.pts.length-1;i++){const[x1,y1]=bm.pts[i],[x2,y2]=bm.pts[i+1];ctx.moveTo(x1,y1);const mx=(x1+x2)/2+rnd(-9,9),my=(y1+y2)/2+rnd(-9,9);ctx.lineTo(mx,my);ctx.lineTo(x2,y2);glyph('z',mx,my,16,a);}
  ctx.stroke();ctx.shadowBlur=0;ctx.globalAlpha=1;}
 for(const q of G.parts)glyph(q.ch||(q.r>2.5?'*':'·'),q.x,q.y,q.r>2.5?16:12,clamp(q.t/q.dur,0,1));
 for(const t of G.texts){ctx.globalAlpha=clamp(t.t/.7,0,1);ctx.font='16px VT323, monospace';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle=t.col;ctx.fillText(t.txt,t.x,t.y);}
 ctx.globalAlpha=1;ctx.restore();
if(G.mode==='shooter'&&G.shoot){const pr=G.shoot.dist/G.shoot.goal;
   ctx.font='18px VT323, monospace';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='#ffd166';
   let comboTxt='';if(G.comboBoost&&G.comboBoost.rate>0)comboTxt+=' ▲▲';
   if(G.comboBoost&&G.comboBoost.spread>0)comboTxt+=' ≡';
   ctx.fillText('ГИПЕРПРЫЖОК '+Math.round(pr*100)+'%  ⚡'+(G.sparks||0)+comboTxt,W/2,74);
   ctx.strokeStyle='#5aa7ff';ctx.lineWidth=4;
   ctx.strokeRect(W/2-150,H-34,300,8);
   ctx.fillStyle='#5aa7ff';ctx.fillRect(W/2-150,H-34,300*clamp(pr,0,1),8);}
 drawLog();drawRadar();
 if(G.settings.pointers){if(G.merchant&&!G.merchant.used)drawPointer(G.merchant.x,G.merchant.y,'£','#ffd166');
  for(const ch of G.chests)drawPointer(ch.x,ch.y,ch.golden?'¤':'◊',ch.golden?'#ffd166':'#8ce99a');}
 if(G.bossWarn>0){ctx.save();ctx.globalAlpha=.6+.4*Math.sin(G.t*18);ctx.font='44px VT323, monospace';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='#ff5f6d';ctx.shadowColor='#ff5f6d';ctx.shadowBlur=18;ctx.fillText('!!! ВНИМАНИЕ !!!',W/2,110);ctx.restore();}
 if(G.ev&&G.ev.type==='fog'){const g2=ctx.createRadialGradient(W/2,H/2,120,W/2,H/2,Math.max(W,H)*.6);g2.addColorStop(0,'rgba(0,0,0,0)');g2.addColorStop(1,'rgba(0,0,0,.85)');ctx.fillStyle=g2;ctx.fillRect(0,0,W,H);}
 if(G.beamFx>0){const a=clamp(G.beamFx/2,0,1);
  for(let i=0;i<10;i++){const y=H*(i+.5)/10,len=W*.6*a;
   ctx.globalAlpha=a*.5;ctx.fillStyle='#ffd166';ctx.fillRect(W-len,y-2,len,4);}
  ctx.globalAlpha=1;}
 if(G.prep>0){const f=1-G.prep/2.4;
  for(let i=0;i<14;i++){const x=(i+.5)/14*W,hgt=H*f*((i%3===0)?1:.7);
   ctx.globalAlpha=.25+.3*f;ctx.fillStyle='#bfe9ff';ctx.fillRect(x-2,H-hgt,4,hgt);}
  ctx.globalAlpha=1;ctx.font='40px VT323, monospace';ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.fillStyle='#fff';ctx.shadowColor='#7ee8fa';ctx.shadowBlur=16;
  ctx.fillText('ПРИГОТОВЬСЯ К ГИПЕРПРЫЖКУ',W/2,H/2);ctx.shadowBlur=0;}
 const sc=$('synCard');
 if(G.synCard){const sy=G.synCard.sy;sc.classList.remove('hide');
  sc.innerHTML=`<div class="scIcon">${sy.icon}</div><div class="scName">~ ${sy.name}</div><div class="scDesc">${sy.desc}</div><div class="scNeeds">${sy.need.map(n=>{
   if(n.type==='passive')return `<span class="scNeed" style="color:#8ce99a">✦ ${PASSIVE_DEF[n.id].name}</span>`;
   const ow=spellOwner(n.id);return `<span class="scNeed" style="color:${ow?CLASSES[ow].color:'#fff'}">${SPELL_DEF[n.id].icon} ${SPELL_DEF[n.id].name}</span>`;}).join(' + ')}</div>`;}
else sc.classList.add('hide');
  if(G.interT>0){const a=clamp(G.interT/1.6,0,1);
   ctx.fillStyle='rgba(0,0,0,'+(a*.85)+')';ctx.fillRect(0,0,W,H);
   ctx.globalAlpha=a;ctx.font='52px VT323, monospace';ctx.textAlign='center';ctx.textBaseline='middle';
   ctx.fillStyle='#fff';ctx.shadowColor='#7ee8fa';ctx.shadowBlur=20;
   ctx.fillText('СЦЕНА '+(G.stage+1),W/2,H/2);ctx.shadowBlur=0;ctx.globalAlpha=1;}}
/* ввод */
addEventListener('keydown',e=>{initAudio();
 if(state==='intro'){skipIntro();return;}
 if(e.code==='KeyM'){muted=!muted;$('muteBtn').textContent=muted?'[M]тихо':'[M]звук';return;}
 if(G&&G.test&&e.code==='KeyT'){if(state==='play')openTest();else if(state==='test')closeTest();return;}
 if(e.code==='Escape'){if(state==='play')setPause(true);else if(state==='pause')setPause(false);else if(state==='shop')closeShop();else if(state==='test')closeTest();return;}
 keys[e.code]=true;});
addEventListener('keyup',e=>keys[e.code]=false);
addEventListener('mousemove',e=>{mouse.x=e.clientX;mouse.y=e.clientY;});
addEventListener('mousedown',e=>{initAudio();if(state==='intro'){skipIntro();return;}if(e.target===cv)mouse.down=true;});
addEventListener('mouseup',()=>mouse.down=false);
addEventListener('touchstart',e=>{initAudio();if(e.target===cv){mouse.down=true;mouse.x=e.touches[0].clientX;mouse.y=e.touches[0].clientY;}},{passive:true});
addEventListener('touchmove',e=>{mouse.x=e.touches[0].clientX;mouse.y=e.touches[0].clientY;},{passive:true});
addEventListener('touchend',()=>mouse.down=false);
addEventListener('blur',()=>{if(state==='play')setPause(true);});
addEventListener('error',e=>console.error('[MS]',e.message));
/* кнопки */
$('muteBtn').onclick=()=>{muted=!muted;$('muteBtn').textContent=muted?'[M]тихо':'[M]звук';};
$('resumeBtn').onclick=()=>setPause(false);
$('pauseMenuBtn').onclick=toMenu;
$('overRestart').onclick=()=>startGame(G.key,G.test,G.daily);
$('overMenu').onclick=toMenu;
$('winGo').onclick=()=>{G.endless=true;$('winOv').classList.add('hide');state='play';banner('∞ БЕСКОНЕЧНО');};
$('winMenu').onclick=toMenu;
 $('shopClose').onclick=closeShop;
 $('treeSkip').onclick=closeTreeChoice;
document.querySelectorAll('.tabbtn').forEach(b=>b.onclick=()=>{document.querySelectorAll('.tabbtn').forEach(x=>x.classList.remove('active'));b.classList.add('active');const t=b.dataset.tab;
 ['magic','combos','syn','stats','arts','tree'].forEach(x=>$('tab-'+x).classList.toggle('hide',x!==t));});
function syncSetBtns(){if(!G)return;
 $('setShake').textContent='тряска: '+(G.settings.shake?'вкл':'выкл');
 $('setDmg').textContent='цифры: '+(G.settings.dmg?'вкл':'выкл');
 $('setRank').textContent='ранги: '+(G.settings.color?'цвет':'ч/б');
 $('setAmb').textContent='фон: '+(G.settings.amb?'вкл':'выкл');
 $('setSnd').textContent='звук: '+(muted?'выкл':'вкл');
 $('setPoint').textContent='указатели: '+(G.settings.pointers?'вкл':'выкл');}
$('setShake').onclick=()=>{G.settings.shake=!G.settings.shake;saveSet();syncSetBtns();};
$('setDmg').onclick=()=>{G.settings.dmg=!G.settings.dmg;saveSet();syncSetBtns();};
$('setRank').onclick=()=>{G.settings.color=!G.settings.color;saveSet();syncSetBtns();};
$('setAmb').onclick=()=>{G.settings.amb=!G.settings.amb;saveSet();syncSetBtns();};
$('setSnd').onclick=()=>{muted=!muted;$('muteBtn').textContent=muted?'[M]тихо':'[M]звук';saveSet();syncSetBtns();};
$('setPoint').onclick=()=>{G.settings.pointers=!G.settings.pointers;saveSet();syncSetBtns();};
/* цикл */
let last=0;
function frame(ts){requestAnimationFrame(frame);
 const now=ts*.001;const dt=Math.min(.05,(now-last)||.016);last=now;
 if(!G)return;
 if(state==='over'||state==='win'){
  for(const q of G.parts){q.t-=dt;q.x+=q.vx*dt;q.y+=q.vy*dt;q.vx*=.96;q.vy*=.96;}
  G.parts=G.parts.filter(q=>q.t>0);
  for(const t of G.texts){t.t-=dt;t.y-=34*dt;}G.texts=G.texts.filter(t=>t.t>0);}
 if(state==='play'){
  if(G.test)G.pendLevel=0;
  if(G.choiceDelay>0){G.choiceDelay-=dt;if(G.choiceDelay<0)G.choiceDelay=0;}
  if(G.pendLevel>0&&G.choiceDelay<=0&&!G.test)openChoice();
  else update(Math.min(.15,dt*(G.speedMul||1)));}
 render();hudTick();}
requestAnimationFrame(frame);