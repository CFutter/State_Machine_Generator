import { useState, useEffect, useCallback } from "react";

const FONT = `@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700;900&family=Fira+Code:wght@400;500&display=swap');`;
const T = {
  bg:"#0a0a16",pn:"#111126",bd:"#252548",bh:"#3a3a6a",
  gd:"#d4a843",gdD:"#7a6528",gdB:"#f0d060",
  atk:"#ef4444",atkB:"#2a0f0f",buf:"#a855f7",bufB:"#1c0f2e",
  deb:"#f59e0b",debB:"#2a1f08",def:"#3b82f6",defB:"#0f1a2e",
  spc:"#6b7280",spcB:"#16161f",mix:"#ec4899",mixB:"#2a0f1f",
  tx:"#e8dcc8",txD:"#7a7590",txM:"#4a4568",
  prb:"#34d399",ed:"#4a4a75",edH:"#8a8ac0",strt:"#6366f1",
  tN:"#4ade80",tE:"#facc15",tB:"#f87171",
};
const MS = {
  attack:{c:T.atk,b:T.atkB,i:"⚔",l:"Attack"},buff:{c:T.buf,b:T.bufB,i:"✦",l:"Buff"},
  debuff:{c:T.deb,b:T.debB,i:"☠",l:"Debuff"},defend:{c:T.def,b:T.defB,i:"◈",l:"Block"},
  special:{c:T.spc,b:T.spcB,i:"◎",l:"Special"},mixed:{c:T.mix,b:T.mixB,i:"◆",l:"Mixed"},
  attack_debuff:{c:"#f97316",b:"#2a1508",i:"⚔☠",l:"Atk+Deb"},
  unknown:{c:"#a78bfa",b:"#1a1530",i:"?",l:"Unknown"},
  defend_buff:{c:"#818cf8",b:"#1a1a3a",i:"◈✦",l:"Def+Buf"},
};
const R=42;

// ═══════════════════════════════════════
// ENEMY DATA (all values code-verified)
// ═══════════════════════════════════════
const EN=[
{id:"cultist",n:"Cultist",e:"🔮",t:"normal",d:"Infinite STR via Ritual.",hp:a=>a>=7?[50,56]:[48,54],
  s:[{id:"inc",n:"Incantation",t:"buff",dt:a=>`Ritual ${(a>=2?4:3)+(a>=17?1:0)}`},{id:"ds",n:"Dark Strike",t:"attack",dt:()=>"6 dmg"}],
  p:{_s:{x:100,y:235},inc:{x:330,y:235},ds:{x:600,y:235}},
  tr:()=>[{f:null,to:"inc",p:1,l:"Turn 1"},{f:"inc",to:"ds",p:1,l:"Always"},{f:"ds",to:"ds",p:1,l:"Forever"}],
  nt:["Deterministic: Ritual→Attack forever"],asc:[{lv:2,tx:"Ritual 3→4"},{lv:7,tx:"HP 48-54→50-56"},{lv:17,tx:"First Ritual +1"}]},
{id:"jaw_worm",n:"Jaw Worm",e:"🐛",t:"normal",d:"Mixes attacks with self-buffing.",hp:a=>a>=7?[42,46]:[40,44],
  s:[{id:"ch",n:"Chomp",t:"attack",dt:a=>a>=2?"12 dmg":"11 dmg"},{id:"th",n:"Thrash",t:"mixed",dt:()=>"7+5blk"},{id:"bl",n:"Bellow",t:"buff",dt:a=>a>=17?"+5STR+9blk":a>=2?"+3STR+9blk":"+3STR+6blk"}],
  p:{_s:{x:90,y:90},ch:{x:340,y:90},th:{x:160,y:355},bl:{x:560,y:355}},
  tr:()=>[{f:null,to:"ch",p:1,l:"Turn 1"},{f:"ch",to:"th",p:.3,l:"30%"},{f:"ch",to:"bl",p:.7,l:"70%"},{f:"th",to:"ch",p:.45,l:"45%"},{f:"th",to:"th",p:.3,l:"30%"},{f:"th",to:"bl",p:.25,l:"25%"},{f:"bl",to:"ch",p:.575,l:"57.5%"},{f:"bl",to:"th",p:.425,l:"42.5%"}],
  nt:["Can't Chomp/Bellow 2×","Can't Thrash 3×"],asc:[{lv:2,tx:"Chomp 11→12, Bellow blk 6→9"},{lv:7,tx:"HP 40-44→42-46"},{lv:17,tx:"Bellow STR +3→+5"}]},
{id:"red_louse",n:"Red Louse",e:"🪲",t:"normal",d:"Bites+STR. Curl Up.",hp:a=>a>=7?[11,16]:[10,15],
  s:[{id:"bi",n:"Bite",t:"attack",dt:a=>a>=2?"6-8 dmg":"5-7 dmg"},{id:"gr",n:"Grow",t:"buff",dt:a=>a>=17?"+4 STR":"+3 STR"}],
  p:{_s:{x:100,y:150},bi:{x:360,y:120},gr:{x:560,y:330}},
  tr:a=>a>=17?[{f:null,to:"bi",p:.75,l:"75%"},{f:null,to:"gr",p:.25,l:"25%"},{f:"bi",to:"bi",p:.75,l:"75%"},{f:"bi",to:"gr",p:.25,l:"25%"},{f:"gr",to:"bi",p:1,l:"Always"}]:[{f:null,to:"bi",p:.75,l:"75%"},{f:null,to:"gr",p:.25,l:"25%"},{f:"bi",to:"bi",p:.75,l:"75%"},{f:"bi",to:"gr",p:.25,l:"25%"},{f:"gr",to:"bi",p:.75,l:"75%"},{f:"gr",to:"gr",p:.25,l:"25%"}],
  nt:a=>a>=17?["Can't Grow 2×","Can't Bite 3×",`CurlUp: 9-12`]:["Can't same 3×",`CurlUp: ${a>=7?"4-8":"3-7"}`],
  asc:[{lv:2,tx:"Bite 5-7→6-8"},{lv:7,tx:"HP→11-16"},{lv:17,tx:"Grow+4, CurlUp 9-12"}]},
{id:"green_louse",n:"Green Louse",e:"🪳",t:"normal",d:"Bites+Weak. Curl Up.",hp:a=>a>=7?[12,18]:[11,17],
  s:[{id:"bi",n:"Bite",t:"attack",dt:a=>a>=2?"6-8 dmg":"5-7 dmg"},{id:"sw",n:"Spit Web",t:"debuff",dt:()=>"Weak 2"}],
  p:{_s:{x:100,y:150},bi:{x:360,y:120},sw:{x:560,y:330}},
  tr:a=>a>=17?[{f:null,to:"bi",p:.75,l:"75%"},{f:null,to:"sw",p:.25,l:"25%"},{f:"bi",to:"bi",p:.75,l:"75%"},{f:"bi",to:"sw",p:.25,l:"25%"},{f:"sw",to:"bi",p:1,l:"Always"}]:[{f:null,to:"bi",p:.75,l:"75%"},{f:null,to:"sw",p:.25,l:"25%"},{f:"bi",to:"bi",p:.75,l:"75%"},{f:"bi",to:"sw",p:.25,l:"25%"},{f:"sw",to:"bi",p:.75,l:"75%"},{f:"sw",to:"sw",p:.25,l:"25%"}],
  nt:a=>a>=17?["Can't Web 2×","Can't Bite 3×","CurlUp: 9-12"]:["Can't same 3×",`CurlUp: ${a>=7?"4-8":"3-7"}`],
  asc:[{lv:2,tx:"Bite 5-7→6-8"},{lv:7,tx:"HP→12-18"},{lv:17,tx:"CurlUp 9-12"}]},
{id:"fat_gremlin",n:"Fat Gremlin",e:"🍖",t:"normal",d:"Smash+Weak. Gang member.",hp:a=>a>=7?[14,18]:[13,17],
  s:[{id:"sm",n:"Smash",t:"attack_debuff",dt:a=>a>=17?`${a>=2?5:4}+Wk1+Fr1`:`${a>=2?5:4}+Wk1`}],
  p:{_s:{x:170,y:235},sm:{x:500,y:235}},tr:()=>[{f:null,to:"sm",p:1,l:"Always"},{f:"sm",to:"sm",p:1,l:"Forever"}],
  nt:["Single move","Flees when allies die"],asc:[{lv:2,tx:"4→5"},{lv:7,tx:"HP 13-17→14-18"},{lv:17,tx:"+Frail 1"}]},
{id:"sneaky_gremlin",n:"Sneaky Gremlin",e:"🗡",t:"normal",d:"Puncture only.",hp:a=>a>=7?[11,15]:[10,14],
  s:[{id:"pu",n:"Puncture",t:"attack",dt:a=>a>=2?"10 dmg":"9 dmg"}],
  p:{_s:{x:170,y:235},pu:{x:500,y:235}},tr:()=>[{f:null,to:"pu",p:1,l:"Always"},{f:"pu",to:"pu",p:1,l:"Forever"}],
  nt:["Single move","Flees"],asc:[{lv:2,tx:"9→10"},{lv:7,tx:"HP 10-14→11-15"}]},
{id:"mad_gremlin",n:"Mad Gremlin",e:"😡",t:"normal",d:"Angry: STR on hit.",hp:a=>a>=7?[21,25]:[20,24],
  s:[{id:"sc",n:"Scratch",t:"attack",dt:a=>a>=2?"5 dmg":"4 dmg"}],
  p:{_s:{x:170,y:235},sc:{x:500,y:235}},tr:()=>[{f:null,to:"sc",p:1,l:"Always"},{f:"sc",to:"sc",p:1,l:"Forever"}],
  nt:a=>[`Angry: +${a>=17?2:1} STR/hit`,"Flees"],asc:[{lv:2,tx:"4→5"},{lv:7,tx:"HP 20-24→21-25"},{lv:17,tx:"Angry 1→2"}]},
{id:"shield_gremlin",n:"Shield Gremlin",e:"🛡",t:"normal",d:"Shields allies.",hp:a=>a>=7?[13,17]:[12,15],
  s:[{id:"pr",n:"Protect",t:"defend",dt:a=>a>=17?"11 blk":a>=7?"8 blk":"7 blk"},{id:"ba",n:"Bash",t:"attack",dt:a=>a>=2?"8 dmg":"6 dmg"}],
  p:{_s:{x:100,y:150},pr:{x:360,y:120},ba:{x:560,y:330}},
  tr:()=>[{f:null,to:"pr",p:1,l:"Allies alive"},{f:"pr",to:"pr",p:1,l:"Allies alive"},{f:"pr",to:"ba",p:null,l:"Alone"},{f:"ba",to:"ba",p:1,l:"Forever"}],
  nt:["Shields random ally","Attacks alone"],asc:[{lv:2,tx:"Bash 6→8"},{lv:7,tx:"HP→13-17, Blk→8"},{lv:17,tx:"Blk→11"}]},
{id:"gremlin_wizard",n:"Gremlin Wizard",e:"🧙",t:"normal",d:"Charges then blasts.",hp:a=>a>=7?[22,26]:[21,25],
  s:[{id:"ch",n:"Charging",t:"unknown",dt:()=>"Unknown"},{id:"ul",n:"Ultimate Blast",t:"attack",dt:a=>a>=2?"30 dmg":"25 dmg"}],
  p:{_s:{x:100,y:200},ch:{x:340,y:120},ul:{x:600,y:330}},
  tr:a=>a>=17?[{f:null,to:"ch",p:1,l:"T1"},{f:"ch",to:"ch",p:null,l:"Chg<3"},{f:"ch",to:"ul",p:null,l:"Chg=3"},{f:"ul",to:"ul",p:1,l:"Every turn"}]:[{f:null,to:"ch",p:1,l:"T1"},{f:"ch",to:"ch",p:null,l:"Chg<3"},{f:"ch",to:"ul",p:null,l:"Chg=3"},{f:"ul",to:"ch",p:1,l:"Reset"}],
  nt:a=>a>=17?["Charges 2, fires 3rd","A17: no recharge","Flees"]:["Charges 2, fires 3rd","Flees"],
  asc:[{lv:2,tx:"25→30"},{lv:7,tx:"HP 21-25→22-26"},{lv:17,tx:"No recharge"}]},
{id:"acid_slime_l",n:"Acid Slime (L)",e:"🟢",t:"normal",d:"3-move + splits 50%.",hp:a=>a>=7?[68,72]:[65,69],
  s:[{id:"co",n:"Corrosive Spit",t:"attack_debuff",dt:a=>a>=2?"12+2Slimed":"11+2Slimed"},{id:"ta",n:"Tackle",t:"attack",dt:a=>a>=2?"18 dmg":"16 dmg"},{id:"li",n:"Lick",t:"debuff",dt:()=>"Weak 2"},{id:"sp",n:"Split",t:"special",dt:()=>"→2× Acid(M)"}],
  p:{_s:{x:70,y:70},co:{x:270,y:70},ta:{x:530,y:70},li:{x:530,y:310},sp:{x:270,y:390}},
  tr:()=>[{f:null,to:"co",p:.3,l:"30%"},{f:null,to:"ta",p:.4,l:"40%"},{f:null,to:"li",p:.3,l:"30%"},{f:"co",to:"ta",p:.45,l:"~45%"},{f:"co",to:"li",p:.3,l:"~30%"},{f:"co",to:"co",p:.25,l:"~25%"},{f:"ta",to:"co",p:.35,l:"~35%"},{f:"ta",to:"li",p:.35,l:"~35%"},{f:"ta",to:"ta",p:.3,l:"~30%"},{f:"li",to:"co",p:.4,l:"40%"},{f:"li",to:"ta",p:.6,l:"60%"},{f:"co",to:"sp",p:null,l:"HP≤50%"},{f:"ta",to:"sp",p:null,l:"HP≤50%"},{f:"li",to:"sp",p:null,l:"HP≤50%"}],
  nt:["Splits→2 Acid(M) at ≤50%","Acid Lick = Weak (not Frail!)"],asc:[{lv:2,tx:"Corr 11→12, Tackle 16→18"},{lv:7,tx:"HP 65-69→68-72"},{lv:17,tx:"Stricter repeats"}]},
{id:"acid_slime_m",n:"Acid Slime (M)",e:"🟩",t:"normal",d:"3-move: spit, tackle, weak.",hp:a=>a>=7?[29,34]:[28,32],
  s:[{id:"co",n:"Corrosive Spit",t:"attack_debuff",dt:a=>a>=2?"8+Slimed":"7+Slimed"},{id:"ta",n:"Tackle",t:"attack",dt:a=>a>=2?"12 dmg":"10 dmg"},{id:"li",n:"Lick",t:"debuff",dt:()=>"Weak 1"}],
  p:{_s:{x:80,y:80},co:{x:340,y:80},ta:{x:600,y:140},li:{x:400,y:370}},
  tr:()=>[{f:null,to:"co",p:.3,l:"30%"},{f:null,to:"ta",p:.4,l:"40%"},{f:null,to:"li",p:.3,l:"30%"},{f:"co",to:"ta",p:.4,l:"~40%"},{f:"co",to:"li",p:.3,l:"~30%"},{f:"co",to:"co",p:.3,l:"~30%"},{f:"ta",to:"co",p:.35,l:"~35%"},{f:"ta",to:"ta",p:.35,l:"~35%"},{f:"ta",to:"li",p:.3,l:"~30%"},{f:"li",to:"co",p:.4,l:"40%"},{f:"li",to:"ta",p:.6,l:"60%"}],
  nt:["Acid Lick = Weak (not Frail!)","Frail from Spike Slimes only"],asc:[{lv:2,tx:"Corr 7→8, Tackle 10→12"},{lv:7,tx:"HP 28-32→29-34"},{lv:17,tx:"Stricter"}]},
{id:"acid_slime_s",n:"Acid Slime (S)",e:"💚",t:"normal",d:"Alternates atk/weak.",hp:a=>a>=7?[9,13]:[8,12],
  s:[{id:"ta",n:"Tackle",t:"attack",dt:a=>a>=2?"4 dmg":"3 dmg"},{id:"li",n:"Lick",t:"debuff",dt:()=>"Weak 1"}],
  p:{_s:{x:100,y:150},ta:{x:360,y:120},li:{x:560,y:330}},
  tr:a=>a>=17?[{f:null,to:"ta",p:1,l:"Always"},{f:"ta",to:"li",p:1,l:"Alt"},{f:"li",to:"ta",p:1,l:"Alt"}]:[{f:null,to:"ta",p:.5,l:"50%"},{f:null,to:"li",p:.5,l:"50%"},{f:"ta",to:"li",p:1,l:"Alt"},{f:"li",to:"ta",p:1,l:"Alt"}],
  nt:a=>a>=17?["A17: Tackle first"]:["50/50 first, alternates"],asc:[{lv:2,tx:"3→4"},{lv:7,tx:"HP 8-12→9-13"},{lv:17,tx:"Starts Tackle"}]},
{id:"spike_slime_l",n:"Spike Slime (L)",e:"🔴",t:"normal",d:"Tackle+Slimed+Frail. Splits.",hp:a=>a>=7?[67,73]:[64,70],
  s:[{id:"ft",n:"Flame Tackle",t:"attack_debuff",dt:a=>a>=2?"18+2Slimed":"16+2Slimed"},{id:"fl",n:"Lick",t:"debuff",dt:a=>a>=17?"Frail 3":"Frail 2"},{id:"sp",n:"Split",t:"special",dt:()=>"→2× Spike(M)"}],
  p:{_s:{x:80,y:80},ft:{x:300,y:80},fl:{x:580,y:80},sp:{x:420,y:370}},
  tr:a=>a>=17?[{f:null,to:"ft",p:.3,l:"30%"},{f:null,to:"fl",p:.7,l:"70%"},{f:"ft",to:"fl",p:.7,l:"70%"},{f:"ft",to:"ft",p:.3,l:"30%"},{f:"fl",to:"ft",p:1,l:"Always"},{f:"ft",to:"sp",p:null,l:"HP≤50%"},{f:"fl",to:"sp",p:null,l:"HP≤50%"}]:[{f:null,to:"ft",p:.3,l:"30%"},{f:null,to:"fl",p:.7,l:"70%"},{f:"ft",to:"fl",p:.7,l:"70%"},{f:"ft",to:"ft",p:.3,l:"30%"},{f:"fl",to:"ft",p:.3,l:"30%"},{f:"fl",to:"fl",p:.7,l:"70%"},{f:"ft",to:"sp",p:null,l:"HP≤50%"},{f:"fl",to:"sp",p:null,l:"HP≤50%"}],
  nt:["Spike Lick = Frail!","Splits→2 Spike(M)"],asc:[{lv:2,tx:"Tackle 16→18"},{lv:7,tx:"HP 64-70→67-73"},{lv:17,tx:"Frail 2→3"}]},
{id:"spike_slime_m",n:"Spike Slime (M)",e:"🟥",t:"normal",d:"Tackle+Slimed. Frail.",hp:a=>a>=7?[29,34]:[28,32],
  s:[{id:"ft",n:"Flame Tackle",t:"attack_debuff",dt:a=>a>=2?"10+Slimed":"8+Slimed"},{id:"fl",n:"Lick",t:"debuff",dt:()=>"Frail 1"}],
  p:{_s:{x:100,y:150},ft:{x:360,y:120},fl:{x:560,y:330}},
  tr:a=>a>=17?[{f:null,to:"ft",p:.3,l:"30%"},{f:null,to:"fl",p:.7,l:"70%"},{f:"ft",to:"fl",p:.7,l:"70%"},{f:"ft",to:"ft",p:.3,l:"30%"},{f:"fl",to:"ft",p:1,l:"Always"}]:[{f:null,to:"ft",p:.3,l:"30%"},{f:null,to:"fl",p:.7,l:"70%"},{f:"ft",to:"fl",p:.7,l:"70%"},{f:"ft",to:"ft",p:.3,l:"30%"},{f:"fl",to:"ft",p:.3,l:"30%"},{f:"fl",to:"fl",p:.7,l:"70%"}],
  nt:["Spike Slime = Frail","Acid Slime = Weak"],asc:[{lv:2,tx:"Tackle 8→10"},{lv:7,tx:"HP 28-32→29-34"},{lv:17,tx:"Lick can't 2×"}]},
{id:"spike_slime_s",n:"Spike Slime (S)",e:"🔺",t:"normal",d:"Only attacks.",hp:a=>a>=7?[11,15]:[10,14],
  s:[{id:"ta",n:"Tackle",t:"attack",dt:a=>a>=2?"6 dmg":"5 dmg"}],p:{_s:{x:170,y:235},ta:{x:500,y:235}},
  tr:()=>[{f:null,to:"ta",p:1,l:"Always"},{f:"ta",to:"ta",p:1,l:"Forever"}],nt:["Single move"],asc:[{lv:2,tx:"5→6"},{lv:7,tx:"HP 10-14→11-15"}]},
{id:"fungi_beast",n:"Fungi Beast",e:"🍄",t:"normal",d:"Bites+STR. Spore Cloud.",hp:a=>a>=7?[24,28]:[22,28],
  s:[{id:"bi",n:"Bite",t:"attack",dt:()=>"6 dmg"},{id:"gr",n:"Grow",t:"buff",dt:a=>a>=17?`+${(a>=2?4:3)+1} STR`:a>=2?"+4 STR":"+3 STR"}],
  p:{_s:{x:100,y:150},bi:{x:360,y:120},gr:{x:560,y:330}},
  tr:()=>[{f:null,to:"bi",p:.6,l:"60%"},{f:null,to:"gr",p:.4,l:"40%"},{f:"bi",to:"bi",p:.6,l:"60%"},{f:"bi",to:"gr",p:.4,l:"40%"},{f:"gr",to:"bi",p:1,l:"Always"}],
  nt:["Spore Cloud: Vuln 2 on death","Can't Bite 3×, Grow 2×"],asc:[{lv:2,tx:"Grow +3→+4"},{lv:7,tx:"HP 22-28→24-28"},{lv:17,tx:"Grow +1 extra"}]},
{id:"looter",n:"Looter",e:"💰",t:"normal",d:"Steals gold, flees!",hp:a=>a>=7?[46,50]:[44,48],
  s:[{id:"mu",n:"Mug",t:"attack",dt:a=>a>=2?"11 dmg":"10 dmg"},{id:"lu",n:"Lunge",t:"attack",dt:a=>a>=2?"14 dmg":"12 dmg"},{id:"sm",n:"Smoke Bomb",t:"defend",dt:()=>"6 blk"},{id:"es",n:"Escape",t:"special",dt:()=>"Flees!"}],
  p:{_s:{x:60,y:80},mu:{x:230,y:80},lu:{x:470,y:80},sm:{x:470,y:310},es:{x:650,y:310}},
  tr:()=>[{f:null,to:"mu",p:1,l:"T1"},{f:"mu",to:"mu",p:null,l:"T2"},{f:"mu",to:"lu",p:.5,l:"50%"},{f:"mu",to:"sm",p:.5,l:"50%"},{f:"lu",to:"sm",p:1,l:"Always"},{f:"sm",to:"es",p:1,l:"Always"}],
  nt:a=>[`Steals ${a>=17?20:15}g per hit`,"Mug×2→Lunge or Smoke→Escape"],
  asc:[{lv:2,tx:"Mug 10→11, Lunge 12→14"},{lv:7,tx:"HP 44-48→46-50"},{lv:17,tx:"Steals 15→20"}]},
{id:"blue_slaver",n:"Blue Slaver",e:"⛓",t:"normal",d:"Stabs+rakes(Weak).",hp:a=>a>=7?[48,52]:[46,50],
  s:[{id:"st",n:"Stab",t:"attack",dt:a=>a>=2?"13 dmg":"12 dmg"},{id:"rk",n:"Rake",t:"attack_debuff",dt:a=>a>=17?`${a>=2?8:7}+Wk2`:`${a>=2?8:7}+Wk1`}],
  p:{_s:{x:100,y:150},st:{x:360,y:120},rk:{x:560,y:330}},
  tr:a=>a>=17?[{f:null,to:"st",p:.6,l:"60%"},{f:null,to:"rk",p:.4,l:"40%"},{f:"st",to:"st",p:.5,l:"~50%"},{f:"st",to:"rk",p:.5,l:"~50%"},{f:"rk",to:"st",p:1,l:"Always"}]:[{f:null,to:"st",p:.6,l:"60%"},{f:null,to:"rk",p:.4,l:"40%"},{f:"st",to:"st",p:.5,l:"~50%"},{f:"st",to:"rk",p:.5,l:"~50%"},{f:"rk",to:"st",p:.5,l:"~50%"},{f:"rk",to:"rk",p:.5,l:"~50%"}],
  nt:a=>a>=17?["Can't Rake 2×"]:["Can't Stab/Rake 3×"],asc:[{lv:2,tx:"Stab 12→13, Rake 7→8"},{lv:7,tx:"HP 46-50→48-52"},{lv:17,tx:"Rake Wk→2"}]},
{id:"red_slaver",n:"Red Slaver",e:"🔗",t:"normal",d:"Stabs, scrapes+Vuln, Entangles once.",hp:a=>a>=7?[48,52]:[46,50],
  s:[{id:"st",n:"Stab",t:"attack",dt:a=>a>=2?"14 dmg":"13 dmg"},{id:"sc",n:"Scrape",t:"attack_debuff",dt:a=>a>=17?`${a>=2?9:8}+Vln2`:`${a>=2?9:8}+Vln1`},{id:"en",n:"Entangle",t:"debuff",dt:()=>"Can't Atk"}],
  p:{_s:{x:70,y:90},st:{x:300,y:90},sc:{x:560,y:90},en:{x:420,y:370}},
  tr:()=>[{f:null,to:"st",p:1,l:"T1"},{f:"st",to:"sc",p:.4,l:"~40%"},{f:"st",to:"st",p:.35,l:"~35%"},{f:"st",to:"en",p:.25,l:"25%*"},{f:"sc",to:"st",p:.5,l:"~50%"},{f:"sc",to:"sc",p:.5,l:"~50%"},{f:"en",to:"st",p:.45,l:"~45%"},{f:"en",to:"sc",p:.55,l:"~55%"}],
  nt:["Stab T1 always","Entangle once (25%)"],asc:[{lv:2,tx:"Stab 13→14, Scrape 8→9"},{lv:7,tx:"HP 46-50→48-52"},{lv:17,tx:"Scrape Vln→2"}]},
// ═══ ELITES ═══
{id:"gremlin_nob",n:"Gremlin Nob",e:"👹",t:"elite",d:"Enrages on Skills.",hp:a=>a>=8?[85,90]:[82,86],
  s:[{id:"be",n:"Bellow",t:"buff",dt:a=>a>=18?"Enrage +3":"Enrage +2"},{id:"ru",n:"Rush",t:"attack",dt:a=>a>=3?"16 dmg":"14 dmg"},{id:"sb",n:"Skull Bash",t:"attack_debuff",dt:a=>a>=3?"8+Vln2":"6+Vln2"}],
  p:{_s:{x:90,y:90},be:{x:370,y:90},ru:{x:200,y:365},sb:{x:560,y:365}},
  tr:a=>a>=18?[{f:null,to:"be",p:1,l:"T1"},{f:"be",to:"sb",p:1,l:"Forced"},{f:"sb",to:"ru",p:1,l:"Rush"},{f:"ru",to:"ru",p:.5,l:"~50%"},{f:"ru",to:"sb",p:.5,l:"~50%"}]:[{f:null,to:"be",p:1,l:"T1"},{f:"be",to:"ru",p:.67,l:"67%"},{f:"be",to:"sb",p:.33,l:"33%"},{f:"ru",to:"ru",p:.67,l:"67%"},{f:"ru",to:"sb",p:.33,l:"33%"},{f:"sb",to:"ru",p:.67,l:"67%"},{f:"sb",to:"sb",p:.33,l:"33%"}],
  nt:a=>[`Actual dmg = base + STR (${a>=18?"+3":"+2"}/Skill)`,"Can't same 3×"],
  asc:[{lv:3,tx:"Rush 14→16, Bash 6→8"},{lv:8,tx:"HP 82-86→85-90"},{lv:18,tx:"Enrage+3, Bash forced"}]},
// ★ Lagavulin: Atk→Atk→Siphon cycle
{id:"lagavulin",n:"Lagavulin",e:"😴",t:"elite",d:"Sleeps. Atk×2→Siphon.",hp:a=>a>=7?[109,113]:[104,110],
  s:[{id:"sl",n:"Sleeping",t:"special",dt:()=>"Metal 8"},{id:"at",n:"Attack",t:"attack",dt:a=>a>=2?"20 dmg":"18 dmg"},{id:"si",n:"Siphon Soul",t:"debuff",dt:a=>a>=17?"-2STR-2DEX":"-1STR-1DEX"}],
  p:{_s:{x:90,y:90},sl:{x:370,y:90},at:{x:200,y:365},si:{x:560,y:365}},
  tr:()=>[{f:null,to:"sl",p:1,l:"Start"},{f:"sl",to:"sl",p:null,l:"≤3 turns"},{f:"sl",to:"at",p:null,l:"Wakes"},{f:"at",to:"at",p:null,l:"2nd Atk"},{f:"at",to:"si",p:1,l:"After 2"},{f:"si",to:"at",p:1,l:"Cycle"}],
  nt:["Wakes after 3 turns or dmg","Atk→Atk→Siphon (repeating)","8 Metallicize while asleep"],
  asc:[{lv:2,tx:"Atk 18→20"},{lv:7,tx:"HP 104-110→109-113"},{lv:17,tx:"Siphon -1→-2"}]},
// ★ Sentries: pos 0,2=Bolt first; pos 1=Beam first
{id:"sentry",n:"Sentry",e:"🔷",t:"elite",d:"Alt Bolt/Beam. 3 per enc.",hp:a=>a>=8?[39,45]:[38,42],
  s:[{id:"bo",n:"Bolt",t:"debuff",dt:a=>a>=18?"3 Dazed":"2 Dazed"},{id:"bm",n:"Beam",t:"attack",dt:a=>a>=3?"10 dmg":"9 dmg"}],
  p:{_s:{x:100,y:235},bo:{x:330,y:120},bm:{x:600,y:350}},
  tr:()=>[{f:null,to:"bo",p:.67,l:"Pos 1,3"},{f:null,to:"bm",p:.33,l:"Pos 2"},{f:"bo",to:"bm",p:1,l:"Alt"},{f:"bm",to:"bo",p:1,l:"Alt"}],
  nt:["Pos 1,3 (idx 0,2): Bolt first","Pos 2 (idx 1): Beam first","Each has Artifact 1"],
  asc:[{lv:3,tx:"Beam 9→10"},{lv:8,tx:"HP 38-42→39-45"},{lv:18,tx:"Dazed 2→3"}]},
// ═══ BOSSES ═══
{id:"guardian",n:"The Guardian",e:"⚙",t:"boss",d:"Mode Shift boss.",hp:a=>a>=9?[250,250]:[240,240],
  s:[{id:"ch",n:"Charge Up",t:"defend",dt:()=>"9 blk"},{id:"fb",n:"Fierce Bash",t:"attack",dt:a=>a>=4?"36 dmg":"32 dmg"},{id:"vs",n:"Vent Steam",t:"debuff",dt:()=>"Wk2+Vln2"},{id:"ww",n:"Whirlwind",t:"attack",dt:()=>"5×4"},{id:"cl",n:"Close Up",t:"buff",dt:a=>a>=19?"Sharp 4":"Sharp 3"},{id:"ro",n:"Roll",t:"attack",dt:a=>a>=4?"10 dmg":"9 dmg"},{id:"tw",n:"Twin Slam",t:"mixed",dt:()=>"8×2"}],
  p:{_s:{x:50,y:55},ch:{x:175,y:55},fb:{x:360,y:55},vs:{x:545,y:55},ww:{x:640,y:220},cl:{x:130,y:340},ro:{x:340,y:390},tw:{x:540,y:390}},
  tr:()=>[{f:null,to:"ch",p:1,l:"T1"},{f:"ch",to:"fb",p:1,l:"→"},{f:"fb",to:"vs",p:1,l:"→"},{f:"vs",to:"ww",p:1,l:"→"},{f:"ww",to:"ch",p:1,l:"Cycle"},{f:"ch",to:"cl",p:null,l:"Mode!"},{f:"fb",to:"cl",p:null,l:"Mode!"},{f:"vs",to:"cl",p:null,l:"Mode!"},{f:"ww",to:"cl",p:null,l:"Mode!"},{f:"cl",to:"ro",p:1,l:"Def"},{f:"ro",to:"tw",p:1,l:"→"},{f:"tw",to:"ww",p:1,l:"Opens"}],
  nt:a=>[`ModeShift after ${a>=19?40:a>=9?35:30}dmg (+10/cycle)`,"20blk+SharpHide on curl","TwinSlam reopens"],
  asc:[{lv:4,tx:"Bash 32→36, Roll 9→10"},{lv:9,tx:"HP 240→250, Thr 30→35"},{lv:19,tx:"Thr→40, Sharp 3→4"}]},
{id:"hexaghost",n:"Hexaghost",e:"👻",t:"boss",d:"Fixed 7-turn cycle.",hp:a=>a>=9?[264,264]:[250,250],
  s:[{id:"ac",n:"Activate",t:"unknown",dt:()=>"(HP/12+1)×6"},{id:"se",n:"Sear",t:"attack_debuff",dt:a=>`6+${a>=19?2:1}Burn`},{id:"ta",n:"Tackle",t:"attack",dt:a=>a>=4?"6×2":"5×2"},{id:"in",n:"Inflame",t:"defend_buff",dt:a=>`12blk+${a>=19?3:2}STR`},{id:"if",n:"Inferno",t:"attack_debuff",dt:a=>`${a>=4?3:2}×6+↑Burns`}],
  p:{_s:{x:50,y:110},ac:{x:200,y:55},se:{x:400,y:55},ta:{x:620,y:120},in:{x:600,y:350},if:{x:200,y:390}},
  tr:()=>[{f:null,to:"ac",p:1,l:"T1"},{f:"ac",to:"se",p:1,l:"T2"},{f:"se",to:"ta",p:null,l:"T3"},{f:"ta",to:"se",p:null,l:"T4"},{f:"se",to:"in",p:null,l:"T5"},{f:"in",to:"ta",p:null,l:"T6"},{f:"ta",to:"se",p:null,l:"T7"},{f:"se",to:"if",p:null,l:"All orbs"},{f:"if",to:"se",p:1,l:"Cycle"}],
  nt:["Activate→Sear→Tackle→Sear→Inflame→Tackle→Sear→Inferno","Inferno upgrades Burns"],
  asc:[{lv:4,tx:"Tackle 5→6, Inferno 2→3"},{lv:9,tx:"HP 250→264"},{lv:19,tx:"Sear 1→2 Burn, STR 2→3"}]},
{id:"slime_boss",n:"Slime Boss",e:"🟤",t:"boss",d:"Goop→Prep→Slam. Splits.",hp:a=>a>=9?[150,150]:[140,140],
  s:[{id:"go",n:"Goop Spray",t:"debuff",dt:a=>a>=19?"5 Slimed":"3 Slimed"},{id:"pr",n:"Preparing",t:"unknown",dt:()=>"Unknown"},{id:"sl",n:"Slam",t:"attack",dt:a=>a>=4?"38 dmg":"35 dmg"},{id:"sp",n:"Split",t:"special",dt:()=>"→Spike(L)+Acid(L)"}],
  p:{_s:{x:70,y:80},go:{x:250,y:80},pr:{x:460,y:80},sl:{x:640,y:210},sp:{x:350,y:370}},
  tr:()=>[{f:null,to:"go",p:1,l:"T1"},{f:"go",to:"pr",p:1,l:"→"},{f:"pr",to:"sl",p:1,l:"→"},{f:"sl",to:"go",p:1,l:"Cycle"},{f:"go",to:"sp",p:null,l:"HP≤50%"},{f:"pr",to:"sp",p:null,l:"HP≤50%"},{f:"sl",to:"sp",p:null,l:"HP≤50%"}],
  nt:["Splits→Spike(L)+Acid(L) at ≤50%","Goop→Prep→Slam cycle"],
  asc:[{lv:4,tx:"Slam 35→38"},{lv:9,tx:"HP 140→150"},{lv:19,tx:"Goop 3→5"}]},
];

// ═══════════════════════════════════════
// ENCOUNTERS — CODE-VERIFIED with exact weights
// ═══════════════════════════════════════
const EC=[
  // WEAK POOL (first 3 fights) — all equal 25% weight
  {n:"Cultist",t:"weak",en:["cultist"],fl:"Fights 1-3 (weak pool)",wt:"25%"},
  {n:"Jaw Worm",t:"weak",en:["jaw_worm"],fl:"Fights 1-3 (weak pool)",wt:"25%"},
  {n:"2 Louse",t:"weak",en:["red_louse","green_louse"],fl:"Fights 1-3 (weak pool)",wt:"25%",
    dt:"2 random lice (50/50 Red or Green each)"},
  {n:"Small Slimes",t:"weak",en:["spike_slime_s","acid_slime_m","acid_slime_s","spike_slime_m"],fl:"Fights 1-3 (weak pool)",wt:"25%",
    dt:"50/50: SpikeS+AcidM or AcidS+SpikeM"},
  // STRONG POOL (fights 4+) — weights from code
  {n:"Blue Slaver",t:"strong",en:["blue_slaver"],fl:"Fights 4+ (strong pool)",wt:"12.5%"},
  {n:"Gremlin Gang",t:"strong",en:["mad_gremlin","sneaky_gremlin","fat_gremlin","shield_gremlin","gremlin_wizard"],fl:"Fights 4+",wt:"6.25%",
    dt:"4 gremlins from pool: 2×Warrior,2×Thief,2×Fat,1×Shield,1×Wizard"},
  {n:"Looter",t:"strong",en:["looter"],fl:"Fights 4+",wt:"12.5%"},
  {n:"Large Slime",t:"strong",en:["acid_slime_l","spike_slime_l"],fl:"Fights 4+",wt:"12.5%",
    dt:"50/50 Acid(L) or Spike(L)"},
  {n:"Lots of Slimes",t:"strong",en:["spike_slime_s","acid_slime_s"],fl:"Fights 4+",wt:"6.25%",
    dt:"5 slimes from pool: 3×SpikeS + 2×AcidS"},
  {n:"Exordium Thugs",t:"strong",en:["blue_slaver","red_slaver","cultist","looter","red_louse","green_louse","spike_slime_m","acid_slime_m"],fl:"Fights 4+",wt:"9.4%",
    dt:"WeakWild(Louse/SpikeM/AcidM) + StrongHuman(Cultist/Slaver/Looter)"},
  {n:"Exordium Wildlife",t:"strong",en:["fungi_beast","jaw_worm","red_louse","green_louse","spike_slime_m","acid_slime_m"],fl:"Fights 4+",wt:"9.4%",
    dt:"StrongWild(FungiBeast/JawWorm) + WeakWild(Louse/SpikeM/AcidM)"},
  {n:"Red Slaver",t:"strong",en:["red_slaver"],fl:"Fights 4+",wt:"6.25%"},
  {n:"3 Louse",t:"strong",en:["red_louse","green_louse"],fl:"Fights 4+",wt:"12.5%",
    dt:"3 random lice (50/50 each)"},
  {n:"2 Fungi Beasts",t:"strong",en:["fungi_beast"],fl:"Fights 4+",wt:"12.5%",dt:"Always exactly 2"},
  // ELITES — equal 33.3%
  {n:"Gremlin Nob",t:"elite",en:["gremlin_nob"],fl:"Elite nodes",wt:"33.3%"},
  {n:"Lagavulin",t:"elite",en:["lagavulin"],fl:"Elite nodes",wt:"33.3%"},
  {n:"3 Sentries",t:"elite",en:["sentry"],fl:"Elite nodes",wt:"33.3%"},
  // BOSSES — equal 33.3%
  {n:"The Guardian",t:"boss",en:["guardian"],fl:"Floor 16 boss",wt:"33.3%"},
  {n:"Hexaghost",t:"boss",en:["hexaghost"],fl:"Floor 16 boss",wt:"33.3%"},
  {n:"Slime Boss",t:"boss",en:["slime_boss"],fl:"Floor 16 boss",wt:"33.3%"},
  // EVENT encounters
  {n:"Lagavulin Event",t:"event",en:["lagavulin"],fl:"? room event",wt:"Event",dt:"Lagavulin starts asleep (no waking)"},
  {n:"Mushroom Lair",t:"event",en:["fungi_beast"],fl:"? room event (floor 7+)",wt:"Event",dt:"3 Fungi Beasts"},
];

const EC_C={weak:"#60a5fa",strong:"#fb923c",elite:T.tE,boss:T.tB,event:"#c084fc"};
const EC_L={weak:"Weak (1-3)",strong:"Strong (4+)",elite:"Elite",boss:"Boss",event:"Event"};

// ═══════════════════════════════════════
// SVG
// ═══════════════════════════════════════
function cE(a,b,cv=.35){const dx=b.x-a.x,dy=b.y-a.y,d=Math.sqrt(dx*dx+dy*dy);if(!d)return null;const an=Math.atan2(dy,dx),nr=a.r||R+4,nT=b.r||R+4,nx=-dy/d,ny=dx/d,o=cv*55;const sx=a.x+nr*Math.cos(an+cv*.18),sy=a.y+nr*Math.sin(an+cv*.18),ex=b.x-nT*Math.cos(an-cv*.18),ey=b.y-nT*Math.sin(an-cv*.18),mx=(sx+ex)/2+nx*o,my=(sy+ey)/2+ny*o;return{pa:`M ${sx} ${sy} Q ${mx} ${my} ${ex} ${ey}`,lx:(sx+2*mx+ex)/4,ly:(sy+2*my+ey)/4,ex,ey,ea:Math.atan2(ey-my,ex-mx)};}
function sL(n,d){const cx=n.x,cy=n.y,r=R+4;if(d==="top")return{pa:`M ${cx-12} ${cy-r} C ${cx-50} ${cy-r-60},${cx+50} ${cy-r-60},${cx+12} ${cy-r}`,lx:cx,ly:cy-r-46,ex:cx+12,ey:cy-r,ea:.45};if(d==="right")return{pa:`M ${cx+r} ${cy-12} C ${cx+r+60} ${cy-50},${cx+r+60} ${cy+50},${cx+r} ${cy+12}`,lx:cx+r+46,ly:cy,ex:cx+r,ey:cy+14,ea:Math.PI*.65};return{pa:`M ${cx+12} ${cy+r} C ${cx+50} ${cy+r+60},${cx-50} ${cy+r+60},${cx-12} ${cy+r}`,lx:cx,ly:cy+r+46,ex:cx-12,ey:cy+r,ea:Math.PI+.45};}
function aH(x,y,a){const s=7,a1=a+Math.PI*.8,a2=a-Math.PI*.8;return`M ${x} ${y} L ${x+s*Math.cos(a1)} ${y+s*Math.sin(a1)} L ${x+s*Math.cos(a2)} ${y+s*Math.sin(a2)} Z`;}

function SN({st,po,asc,hv,oH,oL}){const s=MS[st.t]||MS.special,isH=hv===st.id,dt=st.dt(asc);
  return(<g onMouseEnter={()=>oH(st.id)} onMouseLeave={oL} style={{cursor:"pointer"}}>{isH&&<circle cx={po.x} cy={po.y} r={R+6} fill="none" stroke={s.c} strokeWidth="2" opacity=".4" style={{filter:`drop-shadow(0 0 8px ${s.c})`}}/>}<circle cx={po.x} cy={po.y} r={R} fill={s.b} stroke={s.c} strokeWidth={isH?2.5:1.5} opacity={isH?1:.9}/><text x={po.x} y={po.y-10} textAnchor="middle" fontSize="12" fill={s.c} fontFamily="'Fira Code',monospace">{s.i}</text><text x={po.x} y={po.y+5} textAnchor="middle" fontSize="9" fill={T.tx} fontFamily="'Cinzel',serif" fontWeight="700">{st.n}</text><text x={po.x} y={po.y+17} textAnchor="middle" fontSize="7.5" fill={s.c} fontFamily="'Fira Code',monospace" fontWeight="500">{dt}</text></g>);}

function EP({e,hv,fI,tI}){const rl=hv&&(hv===fI||hv===tI),ec=rl?T.edH:T.ed,pc=rl?T.gdB:T.prb,op=hv?(rl?1:.15):.6;
  return(<g opacity={op}><path d={e.pa} fill="none" stroke={ec} strokeWidth={rl?2:1.2} strokeDasharray={e.da?"5,4":"none"}/>{e.ex!=null&&<path d={aH(e.ex,e.ey,e.ea)} fill={ec}/>}{e.l&&<><rect x={e.lx-e.l.length*2.8-3} y={e.ly-6.5} width={e.l.length*5.6+6} height={13} rx="3" fill={T.bg} opacity=".92"/><text x={e.lx} y={e.ly+2.5} textAnchor="middle" fontSize="8" fill={pc} fontFamily="'Fira Code',monospace" fontWeight="500">{e.l}</text></>}</g>);}

function Diag({en,asc,hv,sH}){const po=en.p,tr=typeof en.tr==="function"?en.tr(asc):en.tr;
  const prs=new Set();tr.forEach(t=>{if(t.f&&t.to&&t.f!==t.to)prs.add(`${t.f}->${t.to}`);});
  const edges=tr.map(t=>{const fp=t.f?po[t.f]:po._s,tp=po[t.to];if(!fp||!tp)return null;
    if(t.f&&t.f===t.to){const dir=tp.y<=170?"top":tp.x>=520?"right":"bottom";const l=sL(tp,dir);return{...l,l:t.l,fI:t.f,tI:t.to,da:t.p===null};}
    const rv=t.f&&prs.has(`${t.to}->${t.f}`);const ed=cE({...fp,r:t.f?R+4:14},{...tp,r:R+4},rv?.5:.3);
    if(!ed)return null;return{pa:ed.pa,lx:ed.lx,ly:ed.ly,ex:ed.ex,ey:ed.ey,ea:ed.ea,l:t.l,fI:t.f,tI:t.to,da:t.p===null};}).filter(Boolean);
  return(<svg viewBox="0 0 720 450" preserveAspectRatio="xMidYMid meet" style={{width:"100%",height:"100%",display:"block"}}><defs><pattern id="gd" width="30" height="30" patternUnits="userSpaceOnUse"><path d="M 30 0 L 0 0 0 30" fill="none" stroke={T.bd} strokeWidth=".3" opacity=".3"/></pattern></defs><rect width="720" height="450" fill="url(#gd)" opacity=".5"/>
    {edges.map((e,i)=><EP key={i} e={e} hv={hv} fI={e.fI} tI={e.tI}/>)}
    <g><circle cx={po._s.x} cy={po._s.y} r={11} fill={T.strt} opacity=".8"/><text x={po._s.x} y={po._s.y+3} textAnchor="middle" fontSize="6" fill="#fff" fontFamily="'Fira Code',monospace" fontWeight="500">START</text></g>
    {en.s.map(s=><SN key={s.id} st={s} po={po[s.id]} asc={asc} hv={hv} oH={sH} oL={()=>sH(null)}/>)}</svg>);}

function TB({t}){const c={normal:T.tN,elite:T.tE,boss:T.tB}[t]||T.txD;return<span style={{fontSize:"7px",fontFamily:"'Fira Code',monospace",color:c,border:`1px solid ${c}40`,borderRadius:"3px",padding:"1px 4px",textTransform:"uppercase",letterSpacing:"1px"}}>{t}</span>;}

// ═══════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════
const App = () => {
  const [sel,setSel]=useState("cultist");
  const [asc,setAsc]=useState(0);
  const [hv,setHv]=useState(null);
  const [srch,setSrch]=useState("");
  const [ft,setFt]=useState("all");
  const [shE,setShE]=useState(false);

  const en=EN.find(e=>e.id===sel);
  const hp=en.hp(asc);
  const nt=typeof en.nt==="function"?en.nt(asc):en.nt;
  const aE=en.asc.filter(e=>asc>=e.lv),iE=en.asc.filter(e=>asc<e.lv);

  useEffect(()=>{const s=document.createElement("style");s.textContent=FONT+`::-webkit-scrollbar{width:5px}::-webkit-scrollbar-track{background:${T.bg}}::-webkit-scrollbar-thumb{background:${T.bd};border-radius:3px}input[type=range]{height:6px}*{margin:0;padding:0;box-sizing:border-box}`;document.head.appendChild(s);return()=>document.head.removeChild(s);},[]);

  const filt=EN.filter(e=>(ft==="all"||e.t===ft)&&(!srch||e.n.toLowerCase().includes(srch.toLowerCase())));
  const grp={normal:[],elite:[],boss:[]};filt.forEach(e=>{if(grp[e.t])grp[e.t].push(e);});
  const pick=useCallback(id=>{setSel(id);setHv(null);},[]);

  return(<div style={{width:"100vw",height:"100vh",background:T.bg,color:T.tx,fontFamily:"'Cinzel',serif",display:"flex",flexDirection:"column",overflow:"hidden"}}>
    {/* Header */}
    <div style={{padding:"8px 14px 6px",background:`linear-gradient(180deg,#12122a,${T.bg})`,borderBottom:`1px solid ${T.bd}`,display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:"6px",flexShrink:0}}>
      <div style={{display:"flex",alignItems:"baseline",gap:"8px"}}><span style={{fontSize:"15px",color:T.gd,fontWeight:900}}>⚔ STS</span><span style={{fontSize:"11px",color:T.txD}}>Act 1 — Enemy AI</span><span style={{fontSize:"8px",color:T.txM,fontFamily:"'Fira Code',monospace"}}>{EN.length} enemies</span></div>
      <button onClick={()=>setShE(!shE)} style={{padding:"3px 10px",borderRadius:"4px",fontSize:"10px",fontFamily:"'Cinzel',serif",cursor:"pointer",border:`1.5px solid ${shE?T.gd:T.bd}`,background:shE?`${T.gd}18`:T.pn,color:shE?T.gd:T.txD}}>{shE?"◀ Enemies":"Encounters ▶"}</button>
    </div>

    <div style={{flex:1,display:"flex",minHeight:0,overflow:"hidden"}}>
      {/* Sidebar */}
      <div style={{width:"195px",minWidth:"195px",borderRight:`1px solid ${T.bd}`,background:T.pn,display:"flex",flexDirection:"column",overflowY:"auto",flexShrink:0}}>
        {!shE?(<>
          <div style={{padding:"7px 7px 4px"}}>
            <input type="text" value={srch} onChange={e=>setSrch(e.target.value)} placeholder="Search..." style={{width:"100%",padding:"4px 6px",borderRadius:"4px",border:`1px solid ${T.bd}`,background:T.bg,color:T.tx,fontSize:"10px",fontFamily:"'Fira Code',monospace",outline:"none"}}/>
            <div style={{display:"flex",gap:"2px",marginTop:"4px"}}>{["all","normal","elite","boss"].map(t=><button key={t} onClick={()=>setFt(t)} style={{flex:1,padding:"2px",fontSize:"7px",fontFamily:"'Fira Code',monospace",borderRadius:"3px",cursor:"pointer",border:`1px solid ${ft===t?T.gd:T.bd}`,background:ft===t?`${T.gd}18`:"transparent",color:ft===t?T.gd:T.txM,textTransform:"uppercase"}}>{t}</button>)}</div>
          </div>
          <div style={{flex:1,overflowY:"auto",padding:"1px 4px 4px"}}>{["normal","elite","boss"].map(type=>{const items=grp[type];if(!items?.length)return null;return(<div key={type} style={{marginBottom:"4px"}}><div style={{fontSize:"7px",color:T.txM,letterSpacing:"1.5px",padding:"2px 2px 1px",textTransform:"uppercase"}}>{type==="normal"?"Normal":type==="elite"?"Elites":"Bosses"}</div>
            {items.map(e=><button key={e.id} onClick={()=>pick(e.id)} style={{display:"flex",alignItems:"center",gap:"4px",width:"100%",padding:"3px 6px",borderRadius:"4px",textAlign:"left",cursor:"pointer",border:sel===e.id?`1.5px solid ${T.gd}`:"1px solid transparent",background:sel===e.id?`${T.gd}12`:"transparent",color:sel===e.id?T.gd:T.txD,fontSize:"10.5px",fontFamily:"'Cinzel',serif",fontWeight:sel===e.id?700:400}}><span style={{fontSize:"11px"}}>{e.e}</span><span>{e.n}</span></button>)}</div>);})}</div>
        </>):(
          <div style={{flex:1,overflowY:"auto",padding:"6px"}}>
            <div style={{fontSize:"7px",color:T.txM,letterSpacing:"1.5px",padding:"2px 0 4px",textTransform:"uppercase"}}>Encounters (code-verified)</div>
            {["weak","strong","elite","boss","event"].map(pool=>{const items=EC.filter(e=>e.t===pool);if(!items.length)return null;const pc=EC_C[pool];
              return(<div key={pool} style={{marginBottom:"6px"}}><div style={{fontSize:"7.5px",color:pc,letterSpacing:"1px",padding:"2px 0",textTransform:"uppercase",borderBottom:`1px solid ${pc}30`,marginBottom:"2px"}}>{EC_L[pool]}</div>
                {items.map((enc,i)=>(<div key={i} style={{padding:"4px 6px",marginBottom:"2px",borderRadius:"4px",border:`1px solid ${T.bd}`,background:T.bg}}>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}><span style={{fontSize:"10px",color:T.tx,fontWeight:600}}>{enc.n}</span><span style={{fontSize:"7px",color:pc,fontFamily:"'Fira Code',monospace"}}>{enc.wt}</span></div>
                  <div style={{fontSize:"7px",color:T.txM,fontFamily:"'Fira Code',monospace"}}>{enc.fl}</div>
                  {enc.dt&&<div style={{fontSize:"7px",color:T.txD,fontFamily:"'Fira Code',monospace",fontStyle:"italic",marginTop:"1px"}}>{enc.dt}</div>}
                  <div style={{display:"flex",gap:"2px",marginTop:"2px",flexWrap:"wrap"}}>{enc.en.slice(0,4).map(eid=>{const e2=EN.find(e=>e.id===eid);if(!e2)return null;return<button key={eid} onClick={()=>{pick(eid);setShE(false);}} style={{padding:"1px 5px",borderRadius:"3px",fontSize:"8px",border:`1px solid ${T.bh}`,background:"#181838",color:T.txD,cursor:"pointer",fontFamily:"'Cinzel',serif"}}>{e2.e}{e2.n}</button>;})}{enc.en.length>4&&<span style={{fontSize:"7px",color:T.txM}}>+{enc.en.length-4} more</span>}</div>
                </div>))}</div>);
            })}
            <div style={{fontSize:"7px",color:T.txM,fontFamily:"'Fira Code',monospace",padding:"4px 0",lineHeight:"1.4"}}>
              Anti-repeat: no same encounter back-to-back or within 2. First strong has exclusions based on last weak.
            </div>
          </div>
        )}
      </div>

      {/* Main */}
      <div style={{flex:1,display:"flex",flexDirection:"column",minWidth:0,overflow:"hidden"}}>
        {/* Controls */}
        <div style={{padding:"6px 12px",background:`${T.pn}cc`,borderBottom:`1px solid ${T.bd}`,display:"flex",alignItems:"center",gap:"14px",flexWrap:"wrap",flexShrink:0}}>
          <div style={{display:"flex",alignItems:"center",gap:"4px"}}><span style={{fontSize:"13px"}}>{en.e}</span><span style={{fontSize:"12.5px",fontWeight:700,color:T.gd}}>{en.n}</span><TB t={en.t}/></div>
          <div style={{display:"flex",alignItems:"center",gap:"6px"}}><span style={{fontSize:"8.5px",color:T.txM,letterSpacing:"1px"}}>ASC</span><input type="range" min="0" max="20" value={asc} onChange={e=>setAsc(+e.target.value)} style={{width:"110px",accentColor:T.gd,cursor:"pointer"}}/><span style={{fontFamily:"'Fira Code',monospace",fontSize:"12px",color:T.gd,fontWeight:700,minWidth:"18px",textAlign:"center"}}>{asc}</span></div>
          <div style={{display:"flex",alignItems:"center",gap:"3px"}}><span style={{fontSize:"8.5px",color:T.txM}}>HP</span><span style={{fontFamily:"'Fira Code',monospace",fontSize:"11px",color:T.atk,fontWeight:500}}>{hp[0]===hp[1]?hp[0]:`${hp[0]}–${hp[1]}`}</span></div>
          <div style={{fontSize:"10px",color:T.txD,fontStyle:"italic",flex:1,textAlign:"right"}}>{en.d}</div>
        </div>
        {/* Diagram */}
        <div style={{flex:1,padding:"2px 6px",minHeight:0,overflow:"hidden"}}><Diag en={en} asc={asc} hv={hv} sH={setHv}/></div>
        {/* Bottom */}
        <div style={{padding:"6px 12px",background:T.pn,borderTop:`1px solid ${T.bd}`,display:"flex",gap:"14px",flexWrap:"wrap",alignItems:"flex-start",flexShrink:0}}>
          <div style={{flex:2,minWidth:"200px"}}><div style={{fontSize:"7.5px",color:T.txM,marginBottom:"2px",letterSpacing:"1.5px"}}>ASCENSION EFFECTS</div>
            <div style={{display:"flex",flexWrap:"wrap",gap:"1px 8px"}}>{aE.map((e,i)=><div key={i} style={{fontSize:"9px",color:T.prb,fontFamily:"'Fira Code',monospace"}}>✓ <span style={{color:T.gdD}}>A{e.lv}:</span> {e.tx}</div>)}{iE.map((e,i)=><div key={i} style={{fontSize:"9px",color:T.txM,fontFamily:"'Fira Code',monospace"}}>✗ A{e.lv}: {e.tx}</div>)}</div></div>
          {nt.length>0&&<div style={{flex:1,minWidth:"140px"}}><div style={{fontSize:"7.5px",color:T.txM,marginBottom:"2px",letterSpacing:"1.5px"}}>BEHAVIOR</div>{nt.map((n2,i)=><div key={i} style={{fontSize:"9px",color:T.txD,fontFamily:"'Fira Code',monospace",marginBottom:"1px"}}>• {n2}</div>)}</div>}
          <div style={{minWidth:"100px"}}><div style={{fontSize:"7.5px",color:T.txM,marginBottom:"2px",letterSpacing:"1.5px"}}>TYPES</div><div style={{display:"flex",flexWrap:"wrap",gap:"1px 6px"}}>{Object.entries(MS).map(([k,s])=><div key={k} style={{fontSize:"8px",color:s.c,fontFamily:"'Fira Code',monospace",display:"flex",alignItems:"center",gap:"2px"}}><span style={{width:"6px",height:"6px",borderRadius:"50%",background:s.b,border:`1.5px solid ${s.c}`,display:"inline-block"}}/>{s.l}</div>)}</div></div>
        </div>
      </div>
    </div>
  </div>);
};

export default App;