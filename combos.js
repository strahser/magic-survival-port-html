'use strict';
function spellOwner(id){for(const k of CLASS_ORDER)if(CLASSES[k].pool.includes(id))return k;return null;}
function comboConditionsMet(c){return c.need.every(n=>n.type==='passive'?(G.passives[n.id]||0)>=n.lv:(G.spells[n.id]||0)>=n.lv);}
function availableCombos(){return COMBOS.filter(c=>!G.combosAcquired.has(c.id)&&(G.test||!c.cls||c.cls===G.key)&&comboConditionsMet(c));}
function consumedSpellIds(){const s=new Set();for(const c of COMBOS)if(G.combosAcquired.has(c.id))for(const n of c.need)if(n.type!=='passive')s.add(n.id);return s;}
function acquireCombo(c){for(const n of c.need)if(n.type!=='passive')delete G.spells[n.id];
 G.spells[c.id]=1;G.combosAcquired.add(c.id);
 if(G.track)G.track.evos++;
 if(c.need.every(n=>SPELL_DEF[n.id]&&SPELL_DEF[n.id].combo))G.runT2=1;
 G.player.hp=Math.min(G.player.maxhp,G.player.hp+BALANCE.player.healOnEvolution);
 banner(c.icon+' ЭВОЛЮЦИЯ: '+c.name+'!');sfx('level');
 fxRing(G.player.x,G.player.y,20,150,'#fff',.6);G.shake=Math.max(G.shake,6);}
function comboReqText(c){return c.need.map(n=>{const isP=n.type==='passive';const d=isP?PASSIVE_DEF[n.id]:SPELL_DEF[n.id];const cur=isP?(G.passives[n.id]||0):(G.spells[n.id]||0);return d.icon+(cur>=n.lv?'✔':cur+'/'+n.lv);}).join(' ');}
function buildComboPane(){let h='';for(const c of COMBOS){const on=G.combosAcquired.has(c.id);const own=!c.cls||c.cls===G.key||G.test;
 h+=`<div class="comboCard${on?' on':''}"${own?'':' style="opacity:.45"'}><div class="comboName">${c.icon} ${c.name}${c.cls?'':' · общая'}${on?' · АКТИВНА':''}</div><div class="req">${comboReqText(c)}</div><div class="ld">${c.desc}</div></div>`;}
 return h;}
function synergyActive(sy){return sy.need.every(n=>n.type==='passive'?!!G.passives[n.id]:!!G.spells[n.id]);}
function activeSynergies(){return SYNERGIES.filter(synergyActive);}
function synSum(k){let t=0;for(const sy of activeSynergies())t+=(sy.fx[k]||0);return t;}
function buildSynergyPane(){let h='';for(const sy of SYNERGIES){const on=synergyActive(sy);
 h+=`<div class="comboCard${on?' on':''}"><div class="comboName">${sy.icon} ${sy.name}${on?' · АКТИВНА':''}</div><div class="ld">${sy.desc}</div></div>`;}
 return h;}