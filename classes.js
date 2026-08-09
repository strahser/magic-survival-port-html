'use strict';
/* ===== classes.js: классы, питомцы, боссы (данные) ===== */
const CLASSES={
 pyro:{name:'Пиромант',icon:'🔥',color:'#ff8a3d',letter:'П',pool:['fireball','ring','meteor','nova'],
  desc:'Дальний бой и взрывы по площади. Сжигает толпы дотла.',start:'fireball'},
 necro:{name:'Некромант',icon:'💀',color:'#8ce99a',letter:'Н',pool:['soularrow','skeletons','plague','deathburst','lifedrain','aura'],
  desc:'Стрелы душ, скелеты, чума и аура разложения. Побеждает числом и измором.',start:'soularrow'},
 storm:{name:'Штормовой маг',icon:'⚡',color:'#6ecbff',letter:'Ш',pool:['lightning','ball','storm','cyclone'],
  desc:'Молнии, гром и орбитальные смерчи. Быстрая зачистка плотных волн.',start:'lightning'},
 arcane:{name:'Архимаг',icon:'🔮',color:'#c99bff',letter:'А',pool:['arcane','icelance','shield','nova','boomer','ray','mirror'],
  desc:'Стрелы, лёд, барьер, лучи и двойники. Максимальная зрелищность.',start:'arcane'},
};
const CLASS_ORDER=['pyro','necro','storm','arcane'];

const PET_DEF={
 pyro:{name:'Огненный элементаль',icon:'🔥',col:'#ff9a3d',ranged:false},
 necro:{name:'Костяной ворон',icon:'🦴',col:'#8ce99a',ranged:false},
 storm:{name:'Грозовой дух',icon:'⚡',col:'#6ecbff',ranged:true},
 arcane:{name:'Чародейский фамильяр',icon:'✨',col:'#c99bff',ranged:true},
};

const BOSS_NAMES=['Пожиратель','Костяной колосс','Мать роя','Архилич'];