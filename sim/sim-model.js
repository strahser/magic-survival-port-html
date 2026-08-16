'use strict';
function spellDps(id,lvl,t,st){
 const d=SPELL_DEF[id];if(!d)return 0;
 const c=d.lv[Math.min(lvl,d.lv.length)-1];if(!c)return 0;
 const targets=Math.min(3,1+t/150);
 const mm=1+(st.minion||0);
 if(id==='ring')return (c.dmg*c.n)/0.4*st.dmg*mm;
 if(id==='aura')return (c.dps||0)*targets*st.dmg*mm;
 if(id==='skeletons')return (c.dmg*c.n)/0.4*st.dmg*mm;
 if(id==='ray'||id==='laserstorm')return (c.dmg*(c.n||1))/0.25*st.dmg;
if(id==='cyclone'||id==='vortex')return (c.dmg*(c.n||1))/0.4*st.dmg*mm;
  if(c.dps)return (c.dps*(c.dur||3)/d.cd)*Math.min(targets,(c.n||1)+2)*st.dmg;
  if(d.cd)return ((c.dmg||0)*(c.n||1)/d.cd)*Math.min(targets,(c.n||1)+1)*st.dmg*(c.aoe?1.3:1);
 return (c.dmg||0)*(c.n||1)*st.dmg;}
function ownerSim(id){for(const k of CLASS_ORDER)if(CLASSES[k].pool.includes(id))return k;return null;}
function simRank(a){if(a.craftOnly)return'СБОРКА';if(a.cls)return'КЛАСС';if(a.req)return'ТИР+';return a.price>=130?'III':a.price>=90?'II':'I';}
function simPrice(a,t){const base={'I':70,'II':160,'III':420,'КЛАСС':240,'ТИР+':520}[simRank(a)]||a.price;return Math.round(base*(1+t/900));}
function artValue(a,st,dps,hpFrac){let v=0;const need=hpFrac<.8;
 if(a.id==='rune1')v+=.2*dps;if(a.id==='rune2')v+=.35*dps;if(a.id==='rune3')v+=.55*dps;
 if(a.id==='crit')v+=.25*dps;if(a.id.indexOf('chrono')===0)v+=.1*dps;if(a.id==='accelerator')v+=.1*dps;
 if(a.id==='vamp')v+=need?.5*dps:.1*dps;if(a.id==='amulet1')v+=need?.4*dps:.1*dps;
 if(a.id==='amulet2')v+=need?.6*dps:.1*dps;if(a.id==='stone')v+=need?.4*dps:.1*dps;
 if(a.id==='lens1')v+=.1*dps;if(a.id==='lens2')v+=.2*dps;if(a.id.indexOf('grim')===0)v+=.15*dps;
 if(['ember','lantern','conductor','prismc'].includes(a.id))v+=.2*dps;
 return v;}
function synMult(spells,level){let dmg=0,minion=0;
 for(const sy of SYNERGIES){
  const ok=sy.need.every(n=>n.type==='passive'?level>=8:(spells[n.id]||0)>=1);
  if(ok){dmg+=(sy.fx.dmg||0);minion+=(sy.fx.minionDmg||0);}}
 return{dmg,minion};}
function runSim(clsKey,cfg){
  cfg=cfg||{diff:1,vow:'',eff:1,foe:1};
  let _s=(cfg.seed||Math.floor((cfg.eff||1)*1e6+((cfg.foe||1)*1e5)))>>>0;
  const rnd=()=>{_s=(_s*1664525+1013904223)>>>0;return _s/4294967296;};
 const C=CLASSES[clsKey],E=BALANCE.enemies,BO=BALANCE.bosses,WV=BALANCE.waves;
 const st={dmg:1,cdr:1,area:1,spdMul:1,regen:0,xp:1,gold:1,vamp:0,minion:0,armor:0};
 let maxhp=BALANCE.player.hp;
 if(cfg.vow==='fury'){st.dmg*=1.3;maxhp=Math.round(maxhp*.75);}
 if(cfg.vow==='swift')st.dmg*=.85;
 if(cfg.vow==='stone'){maxhp=Math.round(maxhp*1.4);st.armor+=1;st.dmg*=.8;}
let hp=maxhp,level=1,xp=0,xpNext=BALANCE.xp.start;
  const spells={};spells[C.start]=1;const evolved={};
  let gold=0,bought=0,goldEarned=0,goldSpent=0;const boughtIds=[];
 const fakeG={stats:st,player:{maxhp:maxhp,hp:maxhp}};
 let backlog=0,surv=600,hpFrac=1,bossIdx=0;
 let waveNext=40,waveCount=0,guardNext=60,evNext=40,evType='',evEnd=0;
 const ratios=[],boss=[];
 const xpMul=(cfg.diff===2?1.5:1)*(cfg.vow==='greed'?1.5:1);
 const foeHpMul=(cfg.diff===2?1.5:1)*(cfg.vow==='greed'?1.2:1)*cfg.foe;
 const foeDmgMul=(cfg.diff===2?1.35:1)*(cfg.vow==='greed'?1.1:1);
 const spawnMul=(cfg.diff===2?1.25:1);
 for(let t=0;t<600;t++){
  const spawnT=lerp(E.spawnStart,E.spawnEnd,clamp(t/E.spawnRampT,0,1))/spawnMul;
  const group=1+Math.floor(clamp(t/E.groupRampT,0,E.groupMax-1));
  const spawnRate=group/spawnT;
  const hpMul=(1+t*E.hpGrowth+Math.pow(t/60,2)*E.hpCurve)*foeHpMul;
  const avgHp=E.blob.hp*hpMul;const hpPool=spawnRate*avgHp;
if(t>=waveNext){waveNext+=40;waveCount++;
    if(waveCount%5===0){gold+=30*st.gold;goldEarned+=30*st.gold;backlog+=WV.count*avgHp*0.6;}}
   if(t>=guardNext){guardNext+=75;gold+=60*st.gold;goldEarned+=60*st.gold;backlog+=140*hpMul;}
  if(t>=evNext){evNext+=50;evEnd=t+9;evType=['bless','tide','meteor','fog'][rnd()*4|0];}
  const evOn=t<evEnd;let dpsEv=1,incEv=1,goldEv=0;
  if(evOn){if(evType==='bless')dpsEv=1.25;
   if(evType==='meteor')dpsEv*=1.1;
   if(evType==='fog')incEv=.85;
   if(evType==='tide'){goldEv=.5;incEv*=1.15;}}
  const sm=synMult(spells,level);st.minion=sm.minion;
  let dps=0;for(const id in spells)dps+=spellDps(id,spells[id],t,st);
  dps*=(1+sm.dmg)*(st.crit?1.2:1)*(st.accelerator?1.1:1)/st.cdr*dpsEv*cfg.eff;
  if(t%60===59)ratios.push({t,r:dps/Math.max(1,hpPool)});
  const kills=Math.min(spawnRate,dps/avgHp);
  xp+=kills*xpMul*st.xp;
gold+=(kills*1+0.9)*st.gold*(1+goldEv);goldEarned+=(kills*1+0.9)*st.gold*(1+goldEv);
   {const owned=new Set(boughtIds);let best=null,bestR=0;
    for(const a of ARTSHOP){if(a.craftOnly||owned.has(a.id))continue;if(a.req&&!owned.has(a.req))continue;
     const p=simPrice(a,t);if(p>gold)continue;
     const r=artValue(a,st,dps,hp/maxhp)/p;
     if(r>bestR){bestR=r;best=a;}}
    if(best){const bp=simPrice(best,t);gold-=bp;goldSpent+=bp;best.apply(fakeG);maxhp=fakeG.player.maxhp;boughtIds.push(best.id);bought++;}}
  while(xp>=xpNext){xp-=xpNext;level++;
   xpNext=Math.round(BALANCE.xp.base*Math.pow(level,BALANCE.xp.power)+BALANCE.xp.add);
if(level%4===0)st.dmg+=.2;
    else{let openId=null;
     if(level>=8)for(const c of COMBOS){if(evolved[c.id])continue;if(c.cls&&c.cls!==clsKey)continue;
      const need=c.need.filter(n=>n.type!=='passive');
      if(!need.every(n=>spells[n.id]||C.pool.includes(n.id)))continue;
      if(need.every(n=>(spells[n.id]||0)>=1)){
       const miss=need.find(n=>(spells[n.id]||0)<n.lv);
       if(miss){openId=miss.id;break;}}}
     if(openId){spells[openId]=(spells[openId]||0)+1;}
     else{let bestId=null,bestGain=0;
      const comboNeed={};
      for(const c of COMBOS){if(c.cls&&c.cls!==clsKey)continue;
       const need=c.need.filter(n=>n.type!=='passive');
       if(!need.every(n=>spells[n.id]||C.pool.includes(n.id)))continue;
       for(const n of need){if(!comboNeed[n.id]||comboNeed[n.id]<n.lv)comboNeed[n.id]=n.lv;}}
      for(const id in spells){const d=SPELL_DEF[id];if(d.combo)continue;const cur=spells[id];if(cur>=d.lv.length)continue;
       let g=spellDps(id,cur+1,t,st)-spellDps(id,cur,t,st);if(cur<(comboNeed[id]||0))g*=5;
       if(g>bestGain){bestGain=g;bestId=id;}}
      for(const id of C.pool){if(spells[id])continue;let g=spellDps(id,1,t,st);if(comboNeed[id])g*=1.5;
       if(g>bestGain){bestGain=g;bestId=id;}}
      if(bestId)spells[bestId]=(spells[bestId]||0)+1;else st.dmg+=.2;}}
   for(const c of COMBOS){
    if(evolved[c.id])continue;
    if(c.cls&&c.cls!==clsKey)continue;
    if(c.need.every(n=>n.type==='passive'?level>=10:(spells[n.id]||0)>=n.lv)){
     evolved[c.id]=1;
     for(const n of c.need)if(n.type!=='passive')delete spells[n.id];
     spells[c.id]=1;}}
   hp=Math.min(maxhp,hp+BALANCE.player.healOnLevel);}
  st.armor=Math.min(E.armorCap,Math.floor(t/150)+(spells.shield?2:0)+(cfg.vow==='stone'?1:0));
  backlog=Math.max(0,backlog+hpPool-dps);
  const alive=Math.min(E.cap,backlog/avgHp);
  const avgDmg=E.blob.dmg*(1+t/E.dmgGrowthT)*foeDmgMul;
  const pspd=BALANCE.player.speed*st.spdMul;
  const catchF=clamp(E.blob.spd*(1+t/E.spdGrowth)/pspd,0,1)*0.35*(t<10?0.5:1);   // кайт: догоняют редко (калибровка по живому логу)
  const hitRate=alive>0.5?(1/BALANCE.player.ifr)*catchF:0;      // не чаще i-frames
  const incoming=hitRate*Math.max(1,avgDmg-st.armor)*incEv;
  const heal=st.regen+(st.vamp?4:0)+kills*BALANCE.economy.heartHeal/BALANCE.economy.heartEveryKills;
  hp+=heal-incoming;if(hp>maxhp)hp=maxhp;
  if(hp<=0){surv=t;hpFrac=0;break;}
  if(bossIdx<BO.times.length&&t>=BO.times[bossIdx]){boss.push(BO.hp[bossIdx]/Math.max(1,dps));bossIdx++;}
  hpFrac=hp/maxhp;}
 return{cls:clsKey,surv,hpFrac,ratios,boss,level,bought,goldEarned,goldSpent,goldFinal:gold};}