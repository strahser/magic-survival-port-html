'use strict';
/* ===== combos.js: логика эволюций и синергий ===== */

function spellOwner(id){for(const k of CLASS_ORDER){if(CLASSES[k].pool.includes(id))return k;}return null;}

function comboConditionsMet(c){
 return c.need.every(n=>{
  if(n.type==='passive')return (G.passives[n.id]||0)>=n.lv;
  return (G.spells[n.id]||0)>=n.lv;});}
function availableCombos(){
 return COMBOS.filter(c=>!G.combosAcquired.has(c.id)
  &&(G.test||!c.cls||c.cls===G.key)&&comboConditionsMet(c));}
function consumedSpellIds(){
 const s=new Set();
 for(const c of COMBOS){
  if(G.combosAcquired.has(c.id))
   for(const n of c.need)if(n.type!=='passive')s.add(n.id);}
 return s;}
function acquireCombo(c){
 for(const n of c.need)if(n.type!=='passive')delete G.spells[n.id];
 G.spells[c.id]=1;G.combosAcquired.add(c.id);
 G.player.hp=Math.min(G.player.maxhp,G.player.hp+BALANCE.player.healOnEvolution);
 banner(`${c.icon} ЭВОЛЮЦИЯ: ${c.name}!`,'#ffd166');
 sfx('level');
 fxRing(G.player.x,G.player.y,20,150,'#ffd166',.6);
 fxRing(G.player.x,G.player.y,10,80,'#8ce99a',.5);
 G.shake=Math.max(G.shake,6);
 console.log('[MS] эволюция изучена:',c.name);}
function comboReqText(c){
 return c.need.map(n=>{
  const isP=n.type==='passive';const d=isP?PASSIVE_DEF[n.id]:SPELL_DEF[n.id];
  const cur=isP?(G.passives[n.id]||0):(G.spells[n.id]||0);
  return `${d.icon}${cur>=n.lv?'✔':cur+'/'+n.lv}`;}).join('  ');}
function buildComboPane(){
 let html='';
 for(const c of COMBOS){
  const acquired=G.combosAcquired.has(c.id);
  const own=c.cls===G.key||G.test;
  const req=c.need.map(n=>{
   const isP=n.type==='passive';
   const d=isP?PASSIVE_DEF[n.id]:SPELL_DEF[n.id];
   const cur=isP?(G.passives[n.id]||0):(G.spells[n.id]||0);
   const met=acquired||cur>=n.lv;
   return `<div class="req" style="color:${met?'#7dd88a':'var(--dim)'}">${met?'✔':'○'} ${d.icon} ${d.name}${isP?' (пассивка)':''} — ур ${n.lv}${met?'':' (сейчас '+cur+')'}</div>`;}).join('');
  html+=`<div class="comboCard${acquired?' on':''}"${own?'':' style="opacity:.45"'}>
   <div style="display:flex;align-items:center;gap:10px">
    <div style="font-size:30px">${c.icon}</div>
    <div style="flex:1"><span class="comboName" style="color:${acquired?'var(--gold)':'var(--text)'}">${c.name}</span>
     <span style="color:var(--dim);font-size:11px"> · ${c.cls?CLASSES[c.cls].name:'Любой класс'}${own?'':' (не ваш класс)'}</span>
     ${acquired?'<span style="color:var(--gold);font-size:11px"> · АКТИВНА</span>':''}</div>
   </div>
   <div style="margin-top:8px">${req}</div>
   <div class="ld" style="margin-top:6px">${c.desc}</div>
  </div>`;}
 return html||'<div class="emptyMsg">Эволюций нет</div>';}

function synergyActive(sy){
 return sy.need.every(n=>n.type==='passive'?!!G.passives[n.id]:!!G.spells[n.id]);}
function activeSynergies(){return SYNERGIES.filter(synergyActive);}
function synSum(k){let t=0;for(const sy of activeSynergies())t+=(sy.fx[k]||0);return t;}
function buildSynergyPane(){
 let html='';
 for(const sy of SYNERGIES){
  const on=synergyActive(sy);
  const req=sy.need.map(n=>{
   const isP=n.type==='passive';const d=isP?PASSIVE_DEF[n.id]:SPELL_DEF[n.id];
   const has=isP?!!G.passives[n.id]:!!G.spells[n.id];
   return `<span style="color:${has?'#7dd88a':'var(--dim)'}">${has?'✔':'○'} ${d.icon} ${d.name}${isP?' (пассивка)':''}</span>`;}).join(' &nbsp;+&nbsp; ');
  html+=`<div class="comboCard${on?' on':''}">
   <div style="display:flex;align-items:center;gap:10px">
    <div style="font-size:26px">${sy.icon}</div>
    <div style="flex:1"><span class="comboName" style="color:${on?'var(--gold)':'var(--text)'}">${sy.name}</span>
    ${on?'<span style="color:var(--gold);font-size:11px"> · АКТИВНА</span>':''}</div></div>
   <div class="req" style="margin-top:6px">${req}</div>
   <div class="ld" style="margin-top:4px;color:${on?'var(--gold)':'var(--dim)'}">Бонус: ${sy.desc}</div></div>`;}
 return html||'<div class="emptyMsg">Синергий нет</div>';}