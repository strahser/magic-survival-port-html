'use strict';
(function(){
 const S={fireball:'*',ring:'o',meteor:'v',incineration:'#',lavazone:'#',flameblink:'>',soularrow:'>',skeletons:'†',plague:'∵',deathburst:'%',lifedrain:'&',aura:'∴',gravestep:'<',gravefield:'=',lightning:'z',storm:'≡',ball:'O',cyclone:'Ø',tsunami:'≈',stormstep:'<',staticfield:'=',arcane:'✦',shield:'∩',icelance:'^',blizzard:'∆',nova:'◊',boomer:'»',ray:'|',mirror:'@'};
 for(const k in S)if(SPELL_DEF[k])SPELL_DEF[k].icon=S[k];
 const P={pdmg:'+',pcdr:'~',pspd:'<',preg:',',php:'+',parea:'=',pxp:'?',parm:'_'};
 for(const k in P)if(PASSIVE_DEF[k])PASSIVE_DEF[k].icon=P[k];
 const A={rune1:'+',rune2:'+',rune3:'+',chrono1:'~',chrono2:'~',chrono3:'~',boots1:'<',boots2:'<',amulet1:'+',amulet2:'+',lens1:'=',lens2:'=',grim1:'?',grim2:'?',vamp:'&',stone:'#',phoenix:'v',crit:'%',stormgem:'z',prism:'|',mirrorg:'@',tentacles:'%',blackcat:'?',accelerator:'>',genome:'∆',scythe:'/',clockwork:'o',amplifier:'=',electromag:'≡',ember:'*',lantern:'†',conductor:'z',prismc:'✦'};
 for(const a of ARTSHOP)if(A[a.id])a.icon=A[a.id];
 const CL={pyro:'*',necro:'†',storm:'z',arcane:'✦'};
 for(const k in CL)CLASSES[k].icon=CL[k];
 for(const k in PET_DEF)PET_DEF[k].icon='¤';
})();