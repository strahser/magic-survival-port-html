'use strict';
/* ============================================================
   balance.js — все ЧИСЛА баланса. Правьте и перезагружайте.
   ============================================================ */
const BALANCE={
 player:{
  hp:100,speed:175,regen:0,ifr:0.55,
  healOnLevel:8,healOnEvolution:30,
  vampCapPerSec:4,        // предел вампиризма, HP/сек
 },
 xp:{base:6,power:1.4,add:4,start:10},
 enemies:{
  blob:{hp:11,spd:64,dmg:9,xp:1,gold:1,r:12},
  runner:{hp:7,spd:122,dmg:7,xp:1,gold:1,r:9},
  brute:{hp:40,spd:42,dmg:15,xp:3,gold:3,r:20},
  elite:{hpMul:4.5,dmgMul:1.6,rMul:1.35,xp:6,gold:8},
  hpGrowth:0.032,hpCurve:0.09,
  dmgGrowthT:560,spdGrowth:800,
  spawnStart:0.95,spawnEnd:0.26,spawnRampT:480,
  groupMax:4,groupRampT:120,
  eliteEvery:20,eliteMinEvery:8,eliteStartT:120,
  cap:320,
  startRing:14,startDistMin:330,startDistMax:540,
  diffHp:0.35,diffDmg:0.12,diffSpawn:0.20,diffElite:1.5,
 },
 waves:{every:40,count:18,hp:8,dmg:9,spd:82},
 bosses:{times:[100,210,320,430],hp:[520,1200,2400,4000],dmg:24,spd:48,projDmg:12,shootEvery:2.6,projCountBase:8},
 towers:{hp:180,gold:45,heal:30,xp:10,projDmg:13,shootEvery:2.2,projCount:6},
 economy:{
  heartEveryKills:30,heartHeal:12,heartMagnet:260,
 },
 chests:{
  everyMin:45,everyMax:65,   // период появления
  maxOnField:2,
  goldenChance:0.25,         // шанс золотого сундука (артефакт)
  goldMin:30,goldPerMin:0.1, // золото обычного: goldMin + t*goldPerMin
  goldenGold:120,            // компенсация, если артефакты кончились
 },
 pets:{
  levels:[10,15,20],
  baseDmg:8,perLevel:0.7,
  meleeSpeed:215,rangedSpeed:195,
  shootCd:1.0,shootRange:320,
 },
};