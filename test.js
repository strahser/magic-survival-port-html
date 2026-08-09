'use strict';
/* ===== test.js: стенд (тестовый режим) ===== */

function openTest(){if(!G||!G.test)return;state='test';syncTestControls();buildTestPanel();$('testOv').classList.remove('hide');}
function closeTest(){$('testOv').classList.add('hide');if(state==='test')state='play';}
function syncTestControls(){
 $('spdSlider').value=G.speedMul;$('spdVal').textContent=G.speedMul.toFixed(1)+'×';
 $('diffSlider').value=G.diff;$('diffVal').textContent=G.diff;}

function buildTestPanel(){
 /* заклинания, сгруппированные по школам */
 const sp=$('testSpells');sp.innerHTML='';
 for(const k of CLASS_ORDER){
  const list=Object.keys(SPELL_DEF).filter(id=>!SPELL_DEF[id].combo&&spellOwner(id)===k);
  if(!list.length)continue;
  const h=document.createElement('div');h.className='tGroup';h.style.color=CLASSES[k].color;
  h.textContent=CLASSES[k].name.toUpperCase();sp.appendChild(h);
  for(const id of list){const d=SPELL_DEF[id];const on=!!G.spells[id];
   const b=document.createElement('button');b.className='tbtn'+(on?' on':'');
   b.innerHTML=`${d.icon} ${d.name} <span style="float:right">${on?'✔ МАКС':'+'}</span>`;
   b.onclick=()=>{if(G.spells[id])delete G.spells[id];else G.spells[id]=d.lv.length;
    refreshBuildUI();buildTestPanel();};
   sp.appendChild(b);}}
 /* комбинации по школам + общие */
 const cb=$('testCombos');cb.innerHTML='';
 for(const k of [...CLASS_ORDER,null]){
  const list=COMBOS.filter(c=>c.cls===k);
  if(!list.length)continue;
  const h=document.createElement('div');h.className='tGroup';
  h.style.color=k?CLASSES[k].color:'var(--gold)';
  h.textContent=k?CLASSES[k].name.toUpperCase():'ОБЩИЕ';cb.appendChild(h);
  for(const c of list){const on=!!G.spells[c.id];
   const b=document.createElement('button');b.className='tbtn'+(on?' on':'');
   b.innerHTML=`${c.icon} ${c.name} <span style="float:right">${on?'✔':'+'}</span>`;
   b.title=c.need.map(n=>`${(n.type==='passive'?PASSIVE_DEF[n.id]:SPELL_DEF[n.id]).name} ур ${n.lv}`).join(' + ');
   b.onclick=()=>{if(G.spells[c.id]){delete G.spells[c.id];G.combosAcquired.delete(c.id);}
    else{G.spells[c.id]=1;G.combosAcquired.add(c.id);}
    refreshBuildUI();buildTestPanel();};
   cb.appendChild(b);}}}

/* --- кнопки стенда --- */
$('testBtn').onclick=()=>{if(state==='play')openTest();};
$('testClose').onclick=closeTest;
$('testReset').onclick=()=>{G.spells={};G.spells[G.cls.start]=1;G.combosAcquired.clear();
 refreshBuildUI();buildTestPanel();banner('СБРОС БИЛДА','#7ee8fa');};
$('testClear').onclick=()=>{G.enemies=[];G.ebullets=[];G.bullets=[];G.orbs=[];
 G.zones=G.zones.filter(z=>z.type==='fx');banner('АРЕНА ОЧИЩЕНА','#7ee8fa');};
$('spdSlider').addEventListener('input',e=>{if(!G)return;
 G.speedMul=parseFloat(e.target.value);$('spdVal').textContent=G.speedMul.toFixed(1)+'×';});
$('diffSlider').addEventListener('input',e=>{if(!G)return;
 G.diff=parseInt(e.target.value);$('diffVal').textContent=G.diff;});