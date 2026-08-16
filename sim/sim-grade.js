'use strict';
function bandFor(t){return t<120?[1.2,2.6]:t<300?[1.05,2.0]:[0.95,1.6];}
function pct(a,p){a=a.slice().sort((x,y)=>x-y);return a[Math.min(a.length-1,Math.floor(p*(a.length-1)))];}
function hm(m){let s='';for(const c of m.ratios){const[lo,hi]=bandFor(c.t);
 s+=' '+Math.round(c.t/60)+(c.r<lo?'▼':c.r>hi?'▲':'·');}return s;}
function gradeScore(m){
 let s=100;
 for(const c of m.ratios){const[lo,hi]=bandFor(c.t);
  if(c.r<lo)s-=(lo-c.r)*40; if(c.r>hi)s-=(c.r-hi)*25;}
 if(m.surv<600)s-=(600-m.surv)/600*40; else if(m.hpFrac>0.85)s-=8;
 for(const b of m.boss){if(b>25)s-=8; if(b<4)s-=4;}
 return clamp(Math.round(s),0,100);}
function letter(s){return s>=90?'S':s>=75?'A':s>=60?'B':s>=40?'C':'D';}
function advise(all){
 const out=[];
 const late=all.reduce((a,m)=>a+(m.ratios[4]?m.ratios[4].r:1),0)/all.length;
 const early=all.reduce((a,m)=>a+(m.ratios[0]?m.ratios[0].r:1),0)/all.length;
 const surv=all.reduce((a,m)=>a+m.surv,0)/all.length;
 if(late<0.95)out.push('лейт: не хватает DPS → усиль комбо/пассивки или снизь hpCurve');
 if(early>2.6)out.push('старт слишком лёгкий → подними hpGrowth или снизь базовый урон');
 if(surv<540)out.push('выживаемость низкая → подними хил/броню или снизь dmgGrowthT');
 if(!out.length)out.push('коридоры соблюдены — баланс в допуске');
 return out;}