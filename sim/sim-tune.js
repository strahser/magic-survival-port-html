'use strict';
function evalCfg(p){
 const E=BALANCE.enemies,P=BALANCE.player;
 const save={hc:E.hpCurve,dg:E.dmgGrowthT,hl:P.healOnLevel};
 E.hpCurve=p.hc;E.dmgGrowthT=p.dg;P.healOnLevel=p.hl;
 let tot=0;for(const ck of CLASS_ORDER)tot+=gradeScore(runSim(ck,{diff:1,vow:'',eff:1,foe:1}));
 E.hpCurve=save.hc;E.dmgGrowthT=save.dg;P.healOnLevel=save.hl;
 return tot/4;}
function autoTune(){
 const E=BALANCE.enemies,P=BALANCE.player;
 const cur=evalCfg({hc:E.hpCurve,dg:E.dmgGrowthT,hl:P.healOnLevel});
 let best={score:cur,hc:E.hpCurve,dg:E.dmgGrowthT,hl:P.healOnLevel};
 for(const hc of[0.03,0.04,0.055])for(const dg of[500,600,700])for(const hl of[13,15,18]){
  const s=evalCfg({hc,dg,hl});
  if(s>best.score)best={score:s,hc,dg,hl};}
 return{cur,best};}