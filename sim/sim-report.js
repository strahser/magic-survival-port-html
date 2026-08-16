'use strict';
let lastReport=null;
function getReport(){return lastReport;}
function runSuite(){
 const EFS=[[.8,.9],[.9,1],[1,1],[1.1,1],[1.2,1.1]];
 const rep={classes:{},overall:{}};
 let txt='=== БАЛАНС-ОТЧЁТ (полная модель) ===\n';
 let totN=0,totC=0;
 for(const ck of CLASS_ORDER){
  const nR=Array.from({length:10},(_,i)=>runSim(ck,{diff:1,vow:'',eff:EFS[i%5][0],foe:EFS[i%5][1]}));
  const cR=Array.from({length:10},(_,i)=>runSim(ck,{diff:2,vow:'',eff:EFS[i%5][0],foe:EFS[i%5][1]}));
  const sN=Math.round(nR.reduce((a,m)=>a+gradeScore(m),0)/10);
  const sC=Math.round(cR.reduce((a,m)=>a+gradeScore(m),0)/10);
  totN+=sN;totC+=sC;
  const sv=nR.map(m=>m.surv);
  rep.classes[ck]={norma:sN,chaos:sC,survP50:pct(sv,.5),artifacts:Math.round(nR.reduce((a,m)=>a+m.bought,0)/10),goldEarned:Math.round(nR.reduce((a,m)=>a+m.goldEarned,0)/10),goldSpent:Math.round(nR.reduce((a,m)=>a+m.goldSpent,0)/10)};
  txt+=`\n${CLASSES[ck].name}\n  НОРМА [${letter(sN)} ${sN}] p10/p50/p90: ${fmt(pct(sv,.1))}/${fmt(pct(sv,.5))}/${fmt(pct(sv,.9))} · артеф.~${rep.classes[ck].artifacts} · золото ~${rep.classes[ck].goldEarned} (трат ~${rep.classes[ck].goldSpent})\n`;
  txt+=`  ХАОС  [${letter(sC)} ${sC}] p50: ${fmt(pct(cR.map(m=>m.surv),.5))}\n`;
  txt+='  минуты(▼·▲):'+hm(runSim(ck,{diff:1,vow:'',eff:1,foe:1}))+'\n';}
 const on=Math.round(totN/4),oc=Math.round(totC/4);
 rep.overall={norma:on,chaos:oc};
 txt+=`\n=== ИТОГ: НОРМА ${on} [${letter(on)}] · ХАОС ${oc} [${letter(oc)}] ===\n`;
let vt='Обеты (Архимаг): ';
  for(const v of['fury','greed','swift','stone']){
   const r=Array.from({length:5},(_,i)=>runSim('arcane',{diff:1,vow:v,eff:.9+[0,.05,.1,.15,.2][i],foe:1}));
  const s=Math.round(r.reduce((a,m)=>a+gradeScore(m),0)/5);
  vt+=`${VOWS[v]}:[${letter(s)}${s}] `;}
 txt+='\n'+vt+'\n\nРекомендации:\n'+advise(CLASS_ORDER.map(c=>runSim(c,{diff:1,vow:'',eff:1,foe:1}))).map(x=>'• '+x).join('\n');
 const at=autoTune();
 txt+='\n\nАвтоподбор: '+Math.round(at.cur)+' → '+Math.round(at.best.score)+'\n';
 if(at.best.score>at.cur+1)txt+='• balance.js: hpCurve→'+at.best.hc+', dmgGrowthT→'+at.best.dg+', healOnLevel→'+at.best.hl+'\n';
 else txt+='• параметры близки к оптимуму\n';
 rep.autotune=at.best;lastReport=rep;
 return txt;}