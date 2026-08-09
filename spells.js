'use strict';
/* ===== spells.js: заклинания и пассивки (данные) =====
   Максимальный уровень = длина массива lv. combo:true — только эволюцией. */
const SPELL_DEF={
 fireball:{name:'Огненный шар',icon:'🔥',cd:1.05,lv:[{dmg:13,n:1,aoe:46,burn:0},{dmg:19,n:1,aoe:52,burn:9},{dmg:27,n:2,aoe:58,burn:15},{dmg:38,n:2,aoe:70,burn:22}]},
 ring:{name:'Кольцо магмы',icon:'🌀',lv:[{n:2,r:74,dmg:12},{n:3,r:86,dmg:18},{n:4,r:98,dmg:26}]},
 meteor:{name:'Метеор',icon:'☄️',cd:3.6,lv:[{dmg:46,aoe:78,n:1,burn:12},{dmg:66,aoe:90,n:2,burn:16},{dmg:90,aoe:102,n:2,burn:24}]},
 soularrow:{name:'Стрела души',icon:'👻',cd:.95,lv:[{dmg:11,n:1,pierce:3},{dmg:16,n:2,pierce:4},{dmg:23,n:2,pierce:6},{dmg:33,n:3,pierce:8}]},
 skeletons:{name:'Скелеты-стражи',icon:'💀',lv:[{n:2,dmg:10,r:62},{n:3,dmg:15,r:70},{n:4,dmg:21,r:80}]},
 plague:{name:'Чумное облако',icon:'☠️',cd:4.2,lv:[{dps:10,r:62,dur:3},{dps:18,r:74,dur:3.6},{dps:28,r:88,dur:4.2}]},
 deathburst:{name:'Взрыв душ',icon:'💥',lv:[{dmg:16,aoe:56},{dmg:26,aoe:66},{dmg:40,aoe:78}]},
 lifedrain:{name:'Жатва душ',icon:'🩸',cd:1.0,lv:[{dmg:8,r:92,heal:2},{dmg:13,r:112,heal:3},{dmg:20,r:132,heal:5}]},
 aura:{name:'Аура разложения',icon:'🫧',lv:[{r:80,dps:8},{r:95,dps:13},{r:110,dps:19}]},
 lightning:{name:'Цепная молния',icon:'⚡',cd:1.35,lv:[{dmg:16,chains:2},{dmg:23,chains:3},{dmg:32,chains:4},{dmg:44,chains:5}]},
 storm:{name:'Гроза',icon:'🌩️',cd:4.0,lv:[{n:4,dmg:30},{n:6,dmg:42},{n:8,dmg:56}]},
 ball:{name:'Шаровая молния',icon:'🔮',cd:2.8,lv:[{n:1,dmg:11,r:15},{n:2,dmg:16,r:17},{n:3,dmg:22,r:19}]},
 cyclone:{name:'Смерч',icon:'🌪️',lv:[{n:1,r:60,dmg:10,pull:90},{n:2,r:66,dmg:14,pull:110},{n:2,r:74,dmg:19,pull:130},{n:3,r:80,dmg:24,pull:150}]},
 arcane:{name:'Чародейские стрелы',icon:'✨',cd:1.0,lv:[{dmg:8,n:1},{dmg:10,n:2},{dmg:13,n:3},{dmg:17,n:4},{dmg:22,n:5}]},
 shield:{name:'Чародейский барьер',icon:'🛡️',cd:4.6,lv:[{armor:2,pulse:22,aoe:120},{armor:3,pulse:34,aoe:135},{armor:5,pulse:50,aoe:150}]},
 icelance:{name:'Ледяное копьё',icon:'❄️',cd:1.7,lv:[{dmg:18,n:1,pierce:5},{dmg:28,n:2,pierce:6},{dmg:42,n:2,pierce:9},{dmg:56,n:3,pierce:10}]},
 nova:{name:'Кольцо новы',icon:'💫',cd:3.2,lv:[{dmg:22,aoe:112},{dmg:34,aoe:132,slow:1},{dmg:52,aoe:155,slow:1}]},
 boomer:{name:'Астральный бумеранг',icon:'🪃',cd:1.6,lv:[{dmg:14,n:1},{dmg:20,n:2},{dmg:28,n:3}]},
 ray:{name:'Лучи хаоса',icon:'🔆',lv:[{n:2,dmg:6,range:250},{n:3,dmg:7,range:270},{n:4,dmg:8,range:290},{n:5,dmg:10,range:310}]},
 mirror:{name:'Двойники',icon:'👥',cd:.9,lv:[{n:1,dmg:9},{n:2,dmg:12},{n:2,dmg:16},{n:3,dmg:20}]},
 /* --- эволюции --- */
 sunstorm:{name:'Солнечная буря',icon:'🌞',cd:0.9,combo:true,lv:[{dmg:36,n:3,aoe:75,burn:22,nova:30,novaR:130}]},
 soulreaper:{name:'Жнец душ',icon:'⚰️',cd:1.4,combo:true,lv:[{dmg:30,n:5,pierce:8,nova:45,novaR:150}]},
 skywrath:{name:'Гнев небес',icon:'🌌',cd:1.6,combo:true,lv:[{dmg:44,chains:6,stormN:6,stormDmg:50}]},
 singularity:{name:'Сингулярность',icon:'🕳️',cd:2.5,combo:true,lv:[{dps:60,r:120,dur:3,pull:260}]},
 icestorm:{name:'Ледяной шторм',icon:'🌨️',cd:1.6,combo:true,lv:[{dmg:34,n:4,pierce:7,orbs:2}]},
 blackdeath:{name:'Чёрная смерть',icon:'🦠',cd:4.5,combo:true,lv:[{dps:45,r:110,dur:4,drain:25,heal:6}]},
 archon:{name:'Архонт',icon:'👑',cd:3.5,combo:true,lv:[{armor:6,pulse:70,aoe:190}]},
 laserstorm:{name:'Лазерный шторм',icon:'🌟',combo:true,lv:[{dmg:46,range:360,width:26}]},
 vortex:{name:'Великий вихрь',icon:'🌀',combo:true,lv:[{n:4,r:92,dmg:30,pull:230}]},
 avatar:{name:'Аватар',icon:'🎭',combo:true,lv:[{n:4,dmg:26}]},
};

const PASSIVE_DEF={
 pdmg:{name:'Руна силы',icon:'⚔️',max:3,desc:'+20% урона магии',apply:g=>g.stats.dmg+=.20},
 pcdr:{name:'Ускорение каста',icon:'⏳',max:3,desc:'−10% перезарядка',apply:g=>g.stats.cdr=Math.max(.5,g.stats.cdr-.10)},
 pspd:{name:'Поступь ветра',icon:'👢',max:2,desc:'+10% скорость',apply:g=>g.stats.spdMul+=.10},
 preg:{name:'Регенерация',icon:'💚',max:3,desc:'+1.5 HP/сек',apply:g=>g.stats.regen+=1.5},
 php:{name:'Живучесть',icon:'❤️',max:3,desc:'+25 макс. HP',apply:g=>{g.player.maxhp+=25;g.player.hp=Math.min(g.player.maxhp,g.player.hp+25);}},
 parea:{name:'Расширение',icon:'🌐',max:2,desc:'+15% область',apply:g=>g.stats.area+=.15},
 pxp:{name:'Мудрость',icon:'📖',max:2,desc:'+20% опыта и золота',apply:g=>{g.stats.xp+=.20;g.stats.gold+=.20;}},
 parm:{name:'Каменная кожа',icon:'🪨',max:3,desc:'+1 броня',apply:g=>g.stats.armor+=1},
};