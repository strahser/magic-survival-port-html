'use strict';
/* ===== data.js: утилиты и базовые константы ===== */
const TAU=Math.PI*2,WORLD=2400;
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
const lerp=(a,b,t)=>a+(b-a)*t;
const rnd=(a,b)=>a+Math.random()*(b-a);
const pickArr=a=>a[Math.random()*a.length|0];
const fmt=t=>`${String(t/60|0).padStart(2,'0')}:${String(t%60|0).padStart(2,'0')}`;
const R=['I','II','III','IV','V'];
const $=id=>document.getElementById(id);