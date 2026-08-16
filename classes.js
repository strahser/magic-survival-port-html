'use strict';
const CLASSES={
 pyro:{name:'Пиромант',icon:'*',color:'#ff8a3d',letter:'П',pool:['fireball','ring','meteor','nova','incineration','lavazone','flameblink'],desc:'Огонь: шары, кольцо, метеоры, лава, рывок.',start:'fireball'},
 necro:{name:'Некромант',icon:'†',color:'#8ce99a',letter:'Н',pool:['soularrow','skeletons','plague','deathburst','lifedrain','aura','gravestep','gravefield'],desc:'Некро: стрелы, скелеты, чума, аура, шаг.',start:'soularrow'},
 storm:{name:'Штормовой маг',icon:'z',color:'#6ecbff',letter:'Ш',pool:['lightning','ball','storm','cyclone','tsunami','stormstep','staticfield'],desc:'Шторм: молнии, гром, смерчи, цунами.',start:'lightning'},
 arcane:{name:'Архимаг',icon:'✦',color:'#c99bff',letter:'А',pool:['arcane','icelance','shield','nova','boomer','ray','mirror','blizzard'],desc:'Аркана: стрелы, лёд, барьер, лучи, двойники.',start:'arcane'}};
const CLASS_ORDER=['pyro','necro','storm','arcane'];
const VOWS={fury:'Обет ярости',greed:'Обет жадности',swift:'Обет скорости',stone:'Обет стойкости'};
const PET_DEF={
 pyro:{name:'Огненный элементаль',icon:'*',col:'#ff9a3d',ranged:false},
 necro:{name:'Костяной ворон',icon:'†',col:'#8ce99a',ranged:false},
 storm:{name:'Грозовой дух',icon:'z',col:'#6ecbff',ranged:true},
 arcane:{name:'Чародейский фамильяр',icon:'✦',col:'#c99bff',ranged:true}};
const BOSS_NAMES=['Пожиратель','Костяной колосс','Мать роя','Архилич'];