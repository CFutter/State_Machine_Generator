import { useState, useEffect, useCallback } from "react";

const FONT_CSS = `@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700;900&family=Fira+Code:wght@400;500&display=swap');`;
const C = {bg:"#0a0a16",panel:"#111126",border:"#252548",borderHi:"#3a3a6a",gold:"#d4a843",goldDim:"#7a6528",goldBright:"#f0d060",attack:"#ef4444",attackBg:"#2a0f0f",buff:"#a855f7",buffBg:"#1c0f2e",debuff:"#f59e0b",debuffBg:"#2a1f08",defend:"#3b82f6",defendBg:"#0f1a2e",special:"#6b7280",specialBg:"#16161f",mixed:"#ec4899",mixedBg:"#2a0f1f",text:"#e8dcc8",textDim:"#7a7590",textMuted:"#4a4568",prob:"#34d399",edge:"#4a4a75",edgeHi:"#8a8ac0",startNode:"#6366f1",tagNormal:"#4ade80",tagElite:"#facc15",tagBoss:"#f87171"};
const MS = {attack:{color:C.attack,bg:C.attackBg,icon:"⚔",label:"Attack"},buff:{color:C.buff,bg:C.buffBg,icon:"✦",label:"Buff"},debuff:{color:C.debuff,bg:C.debuffBg,icon:"☠",label:"Debuff"},defend:{color:C.defend,bg:C.defendBg,icon:"◈",label:"Block"},special:{color:C.special,bg:C.specialBg,icon:"◎",label:"Special"},mixed:{color:C.mixed,bg:C.mixedBg,icon:"◆",label:"Mixed"},attack_debuff:{color:"#f97316",bg:"#2a1508",icon:"⚔☠",label:"Atk+Debuff"},unknown:{color:"#a78bfa",bg:"#1a1530",icon:"?",label:"Unknown"},defend_buff:{color:"#818cf8",bg:"#1a1a3a",icon:"◈✦",label:"Def+Buff"}};
const NR = 42;

const ENEMIES = [
  // ═══ NORMAL ═══
  {id:"cultist",name:"Cultist",emoji:"🔮",type:"normal",desc:"Infinite STR scaling via Ritual.",hp:a=>a>=7?[50,56]:[48,54],
    states:[{id:"incantation",name:"Incantation",type:"buff",detail:a=>`Ritual ${(a>=2?4:3)+(a>=17?1:0)}`},{id:"dark_strike",name:"Dark Strike",type:"attack",detail:()=>"6 dmg"}],
    positions:{_start:{x:100,y:235},incantation:{x:330,y:235},dark_strike:{x:600,y:235}},
    transitions:()=>[{from:null,to:"incantation",prob:1,label:"Turn 1"},{from:"incantation",to:"dark_strike",prob:1,label:"Always"},{from:"dark_strike",to:"dark_strike",prob:1,label:"Forever"}],
    notes:["Deterministic: Ritual→Attack forever"],asc:[{level:2,text:"Ritual 3→4"},{level:7,text:"HP 48-54→50-56"},{level:17,text:"First Ritual +1"}]},

  {id:"jaw_worm",name:"Jaw Worm",emoji:"🐛",type:"normal",desc:"Mixes attacks with self-buffing.",hp:a=>a>=7?[42,46]:[40,44],
    states:[{id:"chomp",name:"Chomp",type:"attack",detail:a=>a>=2?"12 dmg":"11 dmg"},{id:"thrash",name:"Thrash",type:"mixed",detail:()=>"7 dmg +5 blk"},{id:"bellow",name:"Bellow",type:"buff",detail:a=>a>=17?"+5 STR +9 blk":a>=2?"+3 STR +9 blk":"+3 STR +6 blk"}],
    positions:{_start:{x:90,y:90},chomp:{x:340,y:90},thrash:{x:160,y:355},bellow:{x:560,y:355}},
    transitions:()=>[{from:null,to:"chomp",prob:1,label:"Turn 1"},{from:"chomp",to:"thrash",prob:.3,label:"30%"},{from:"chomp",to:"bellow",prob:.7,label:"70%"},{from:"thrash",to:"chomp",prob:.45,label:"45%"},{from:"thrash",to:"thrash",prob:.3,label:"30%"},{from:"thrash",to:"bellow",prob:.25,label:"25%"},{from:"bellow",to:"chomp",prob:.575,label:"57.5%"},{from:"bellow",to:"thrash",prob:.425,label:"42.5%"}],
    notes:["Can't Chomp/Bellow 2× in a row","Can't Thrash 3×"],asc:[{level:2,text:"Chomp 11→12, Bellow blk 6→9"},{level:7,text:"HP 40-44→42-46"},{level:17,text:"Bellow STR +3→+5"}]},

  {id:"red_louse",name:"Red Louse",emoji:"🪲",type:"normal",desc:"Bites + gains STR. Curl Up passive.",hp:a=>a>=7?[11,16]:[10,15],
    states:[{id:"bite",name:"Bite",type:"attack",detail:a=>a>=2?"6-8 dmg":"5-7 dmg"},{id:"grow",name:"Grow",type:"buff",detail:a=>a>=17?"+4 STR":"+3 STR"}],
    positions:{_start:{x:100,y:150},bite:{x:360,y:120},grow:{x:560,y:330}},
    transitions:a=>a>=17?[{from:null,to:"bite",prob:.75,label:"75%"},{from:null,to:"grow",prob:.25,label:"25%"},{from:"bite",to:"bite",prob:.75,label:"75%"},{from:"bite",to:"grow",prob:.25,label:"25%"},{from:"grow",to:"bite",prob:1,label:"Always"}]:[{from:null,to:"bite",prob:.75,label:"75%"},{from:null,to:"grow",prob:.25,label:"25%"},{from:"bite",to:"bite",prob:.75,label:"75%"},{from:"bite",to:"grow",prob:.25,label:"25%"},{from:"grow",to:"bite",prob:.75,label:"75%"},{from:"grow",to:"grow",prob:.25,label:"25%"}],
    notes:a=>a>=17?["Can't Grow 2×","Can't Bite 3×","Curl Up: 9-12"]:["Can't same 3×",`Curl Up: ${a>=7?"4-8":"3-7"}`],asc:[{level:2,text:"Bite 5-7→6-8"},{level:7,text:"HP→11-16, CurlUp→4-8"},{level:17,text:"Grow +4, CurlUp 9-12"}]},

  {id:"green_louse",name:"Green Louse",emoji:"🪳",type:"normal",desc:"Bites + applies Weak. Curl Up passive.",hp:a=>a>=7?[12,18]:[11,17],
    states:[{id:"bite",name:"Bite",type:"attack",detail:a=>a>=2?"6-8 dmg":"5-7 dmg"},{id:"spit_web",name:"Spit Web",type:"debuff",detail:()=>"Weak 2"}],
    positions:{_start:{x:100,y:150},bite:{x:360,y:120},spit_web:{x:560,y:330}},
    transitions:a=>a>=17?[{from:null,to:"bite",prob:.75,label:"75%"},{from:null,to:"spit_web",prob:.25,label:"25%"},{from:"bite",to:"bite",prob:.75,label:"75%"},{from:"bite",to:"spit_web",prob:.25,label:"25%"},{from:"spit_web",to:"bite",prob:1,label:"Always"}]:[{from:null,to:"bite",prob:.75,label:"75%"},{from:null,to:"spit_web",prob:.25,label:"25%"},{from:"bite",to:"bite",prob:.75,label:"75%"},{from:"bite",to:"spit_web",prob:.25,label:"25%"},{from:"spit_web",to:"bite",prob:.75,label:"75%"},{from:"spit_web",to:"spit_web",prob:.25,label:"25%"}],
    notes:a=>a>=17?["Can't Spit Web 2×","Can't Bite 3×","Curl Up: 9-12"]:["Can't same 3×",`Curl Up: ${a>=7?"4-8":"3-7"}`],asc:[{level:2,text:"Bite 5-7→6-8"},{level:7,text:"HP→12-18, CurlUp→4-8"},{level:17,text:"CurlUp 9-12, stricter"}]},

  {id:"fat_gremlin",name:"Fat Gremlin",emoji:"🍖",type:"normal",desc:"Smash: dmg + Weak. Gremlin Gang.",hp:a=>a>=7?[14,18]:[13,17],
    states:[{id:"smash",name:"Smash",type:"attack_debuff",detail:a=>a>=17?`${a>=2?5:4} +Wk1+Fr1`:`${a>=2?5:4} dmg +Wk1`}],
    positions:{_start:{x:170,y:235},smash:{x:500,y:235}},transitions:()=>[{from:null,to:"smash",prob:1,label:"Always"},{from:"smash",to:"smash",prob:1,label:"Forever"}],
    notes:["Single move","Flees when allies die"],asc:[{level:2,text:"Smash 4→5"},{level:7,text:"HP 13-17→14-18"},{level:17,text:"+Frail 1"}]},

  {id:"sneaky_gremlin",name:"Sneaky Gremlin",emoji:"🗡",type:"normal",desc:"Puncture only. High single-hit.",hp:a=>a>=7?[11,15]:[10,14],
    states:[{id:"puncture",name:"Puncture",type:"attack",detail:a=>a>=2?"10 dmg":"9 dmg"}],
    positions:{_start:{x:170,y:235},puncture:{x:500,y:235}},transitions:()=>[{from:null,to:"puncture",prob:1,label:"Always"},{from:"puncture",to:"puncture",prob:1,label:"Forever"}],
    notes:["Single move","Flees when allies die"],asc:[{level:2,text:"Puncture 9→10"},{level:7,text:"HP 10-14→11-15"}]},

  {id:"mad_gremlin",name:"Mad Gremlin",emoji:"😡",type:"normal",desc:"Attacks every turn. Angry passive.",hp:a=>a>=7?[21,25]:[20,24],
    states:[{id:"scratch",name:"Scratch",type:"attack",detail:a=>a>=2?"5 dmg":"4 dmg"}],
    positions:{_start:{x:170,y:235},scratch:{x:500,y:235}},transitions:()=>[{from:null,to:"scratch",prob:1,label:"Always"},{from:"scratch",to:"scratch",prob:1,label:"Forever"}],
    notes:a=>[`Angry: +${a>=17?2:1} STR per hit`,"Single move","Flees when allies die"],asc:[{level:2,text:"Scratch 4→5"},{level:7,text:"HP 20-24→21-25"},{level:17,text:"Angry 1→2"}]},

  {id:"shield_gremlin",name:"Shield Gremlin",emoji:"🛡",type:"normal",desc:"Shields allies. Attacks alone.",hp:a=>a>=7?[13,17]:[12,15],
    states:[{id:"protect",name:"Protect",type:"defend",detail:a=>a>=17?"11 blk":a>=7?"8 blk":"7 blk"},{id:"bash",name:"Bash",type:"attack",detail:a=>a>=2?"8 dmg":"6 dmg"}],
    positions:{_start:{x:100,y:150},protect:{x:360,y:120},bash:{x:560,y:330}},
    transitions:()=>[{from:null,to:"protect",prob:1,label:"Allies alive"},{from:"protect",to:"protect",prob:1,label:"Allies alive"},{from:"protect",to:"bash",prob:null,label:"Alone"},{from:"bash",to:"bash",prob:1,label:"Forever"}],
    notes:["Shields random ally","Attacks when last standing"],asc:[{level:2,text:"Bash 6→8"},{level:7,text:"HP→13-17, Blk→8"},{level:17,text:"Blk→11"}]},

  {id:"gremlin_wizard",name:"Gremlin Wizard",emoji:"🧙",type:"normal",desc:"Charges 2 turns, fires huge spell.",hp:a=>a>=7?[22,26]:[21,25],
    states:[{id:"charging",name:"Charging",type:"unknown",detail:()=>"Unknown"},{id:"ultimate",name:"Ultimate Blast",type:"attack",detail:a=>a>=2?"30 dmg":"25 dmg"}],
    positions:{_start:{x:100,y:200},charging:{x:340,y:120},ultimate:{x:600,y:330}},
    transitions:a=>a>=17?[{from:null,to:"charging",prob:1,label:"Turn 1"},{from:"charging",to:"charging",prob:null,label:"Charge<3"},{from:"charging",to:"ultimate",prob:null,label:"Charge=3"},{from:"ultimate",to:"ultimate",prob:1,label:"Every turn"}]:[{from:null,to:"charging",prob:1,label:"Turn 1"},{from:"charging",to:"charging",prob:null,label:"Charge<3"},{from:"charging",to:"ultimate",prob:null,label:"Charge=3"},{from:"ultimate",to:"charging",prob:1,label:"Reset"}],
    notes:a=>a>=17?["Charges 2, fires 3rd","A17+: fires every turn after","Flees"]:["Charges 2, fires 3rd, recharges","Flees"],asc:[{level:2,text:"Ultimate 25→30"},{level:7,text:"HP 21-25→22-26"},{level:17,text:"No recharge"}]},

  // ── SLIMES ──
  {id:"acid_slime_l",name:"Acid Slime (L)",emoji:"🟢",type:"normal",desc:"3-move AI + splits at 50% → 2× Acid (M).",hp:a=>a>=7?[68,72]:[65,69],
    states:[{id:"corrosive",name:"Corrosive Spit",type:"attack_debuff",detail:a=>a>=2?"12 dmg +2 Slimed":"11 dmg +2 Slimed"},{id:"tackle",name:"Tackle",type:"attack",detail:a=>a>=2?"18 dmg":"16 dmg"},{id:"lick",name:"Lick",type:"debuff",detail:()=>"Weak 2"},{id:"split",name:"Split",type:"special",detail:()=>"→ 2× Acid (M)"}],
    positions:{_start:{x:70,y:70},corrosive:{x:270,y:70},tackle:{x:530,y:70},lick:{x:530,y:310},split:{x:270,y:390}},
    transitions:()=>[{from:null,to:"corrosive",prob:.3,label:"30%"},{from:null,to:"tackle",prob:.4,label:"40%"},{from:null,to:"lick",prob:.3,label:"30%"},{from:"corrosive",to:"tackle",prob:.4,label:"~40%"},{from:"corrosive",to:"lick",prob:.3,label:"~30%"},{from:"corrosive",to:"corrosive",prob:.3,label:"~30%"},{from:"tackle",to:"corrosive",prob:.35,label:"~35%"},{from:"tackle",to:"lick",prob:.35,label:"~35%"},{from:"tackle",to:"tackle",prob:.3,label:"~30%"},{from:"lick",to:"corrosive",prob:.4,label:"40%"},{from:"lick",to:"tackle",prob:.6,label:"60%"},{from:"corrosive",to:"split",prob:null,label:"HP≤50%"},{from:"tackle",to:"split",prob:null,label:"HP≤50%"},{from:"lick",to:"split",prob:null,label:"HP≤50%"}],
    notes:["Splits→2 Acid Slime M at ≤50% HP","Children inherit current HP","Has Split power"],asc:[{level:2,text:"Corrosive 11→12, Tackle 16→18"},{level:7,text:"HP 65-69→68-72"},{level:17,text:"Stricter repeat rules"}]},

  {id:"acid_slime_m",name:"Acid Slime (M)",emoji:"🟩",type:"normal",desc:"3-move AI: corrosive spit, tackle, weak.",hp:a=>a>=7?[29,34]:[28,32],
    states:[{id:"corrosive",name:"Corrosive Spit",type:"attack_debuff",detail:a=>a>=2?"8 dmg +Slimed":"7 dmg +Slimed"},{id:"tackle",name:"Tackle",type:"attack",detail:a=>a>=2?"12 dmg":"10 dmg"},{id:"lick",name:"Lick",type:"debuff",detail:()=>"Weak 1"}],
    positions:{_start:{x:80,y:80},corrosive:{x:340,y:80},tackle:{x:600,y:140},lick:{x:400,y:370}},
    transitions:()=>[{from:null,to:"corrosive",prob:.3,label:"30%"},{from:null,to:"tackle",prob:.4,label:"40%"},{from:null,to:"lick",prob:.3,label:"30%"},{from:"corrosive",to:"tackle",prob:.4,label:"~40%"},{from:"corrosive",to:"lick",prob:.3,label:"~30%"},{from:"corrosive",to:"corrosive",prob:.3,label:"~30%"},{from:"tackle",to:"corrosive",prob:.35,label:"~35%"},{from:"tackle",to:"tackle",prob:.35,label:"~35%"},{from:"tackle",to:"lick",prob:.3,label:"~30%"},{from:"lick",to:"corrosive",prob:.4,label:"40%"},{from:"lick",to:"tackle",prob:.6,label:"60%"}],
    notes:["Acid Slime Lick = Weak (not Frail!)","Frail comes from Spike Slimes","Complex probability fallback"],asc:[{level:2,text:"Corrosive 7→8, Tackle 10→12"},{level:7,text:"HP 28-32→29-34"},{level:17,text:"Stricter"}]},

  {id:"acid_slime_s",name:"Acid Slime (S)",emoji:"💚",type:"normal",desc:"Alternates attack and Weak.",hp:a=>a>=7?[9,13]:[8,12],
    states:[{id:"tackle",name:"Tackle",type:"attack",detail:a=>a>=2?"4 dmg":"3 dmg"},{id:"lick",name:"Lick",type:"debuff",detail:()=>"Weak 1"}],
    positions:{_start:{x:100,y:150},tackle:{x:360,y:120},lick:{x:560,y:330}},
    transitions:a=>a>=17?[{from:null,to:"tackle",prob:1,label:"Always"},{from:"tackle",to:"lick",prob:1,label:"Alt"},{from:"lick",to:"tackle",prob:1,label:"Alt"}]:[{from:null,to:"tackle",prob:.5,label:"50%"},{from:null,to:"lick",prob:.5,label:"50%"},{from:"tackle",to:"lick",prob:1,label:"Alt"},{from:"lick",to:"tackle",prob:1,label:"Alt"}],
    notes:a=>a>=17?["A17: always Tackle first, alternates"]:["50/50 first, then alternates"],asc:[{level:2,text:"Tackle 3→4"},{level:7,text:"HP 8-12→9-13"},{level:17,text:"Always starts Tackle"}]},

  {id:"spike_slime_l",name:"Spike Slime (L)",emoji:"🔴",type:"normal",desc:"Tackle + Slimed + Frail. Splits at 50%.",hp:a=>a>=7?[67,73]:[64,70],
    states:[{id:"flame_tackle",name:"Flame Tackle",type:"attack_debuff",detail:a=>a>=2?"18 +2 Slimed":"16 +2 Slimed"},{id:"frail_lick",name:"Lick",type:"debuff",detail:a=>a>=17?"Frail 3":"Frail 2"},{id:"split",name:"Split",type:"special",detail:()=>"→ 2× Spike (M)"}],
    positions:{_start:{x:80,y:80},flame_tackle:{x:300,y:80},frail_lick:{x:580,y:80},split:{x:420,y:370}},
    transitions:a=>a>=17?[{from:null,to:"flame_tackle",prob:.3,label:"30%"},{from:null,to:"frail_lick",prob:.7,label:"70%"},{from:"flame_tackle",to:"frail_lick",prob:.7,label:"70%"},{from:"flame_tackle",to:"flame_tackle",prob:.3,label:"30%"},{from:"frail_lick",to:"flame_tackle",prob:1,label:"Always"},{from:"flame_tackle",to:"split",prob:null,label:"HP≤50%"},{from:"frail_lick",to:"split",prob:null,label:"HP≤50%"}]:[{from:null,to:"flame_tackle",prob:.3,label:"30%"},{from:null,to:"frail_lick",prob:.7,label:"70%"},{from:"flame_tackle",to:"frail_lick",prob:.7,label:"70%"},{from:"flame_tackle",to:"flame_tackle",prob:.3,label:"30%"},{from:"frail_lick",to:"flame_tackle",prob:.3,label:"30%"},{from:"frail_lick",to:"frail_lick",prob:.7,label:"70%"},{from:"flame_tackle",to:"split",prob:null,label:"HP≤50%"},{from:"frail_lick",to:"split",prob:null,label:"HP≤50%"}],
    notes:["Spike Slime Lick = Frail (not Weak!)","Splits→2 Spike M at ≤50% HP"],asc:[{level:2,text:"Tackle 16→18"},{level:7,text:"HP 64-70→67-73"},{level:17,text:"Frail 2→3, Lick can't 2×"}]},

  {id:"spike_slime_m",name:"Spike Slime (M)",emoji:"🟥",type:"normal",desc:"Tackle + Slimed and applies Frail.",hp:a=>a>=7?[29,34]:[28,32],
    states:[{id:"flame_tackle",name:"Flame Tackle",type:"attack_debuff",detail:a=>a>=2?"10 +Slimed":"8 +Slimed"},{id:"frail_lick",name:"Lick",type:"debuff",detail:()=>"Frail 1"}],
    positions:{_start:{x:100,y:150},flame_tackle:{x:360,y:120},frail_lick:{x:560,y:330}},
    transitions:a=>a>=17?[{from:null,to:"flame_tackle",prob:.3,label:"30%"},{from:null,to:"frail_lick",prob:.7,label:"70%"},{from:"flame_tackle",to:"frail_lick",prob:.7,label:"70%"},{from:"flame_tackle",to:"flame_tackle",prob:.3,label:"30%"},{from:"frail_lick",to:"flame_tackle",prob:1,label:"Always"}]:[{from:null,to:"flame_tackle",prob:.3,label:"30%"},{from:null,to:"frail_lick",prob:.7,label:"70%"},{from:"flame_tackle",to:"frail_lick",prob:.7,label:"70%"},{from:"flame_tackle",to:"flame_tackle",prob:.3,label:"30%"},{from:"frail_lick",to:"flame_tackle",prob:.3,label:"30%"},{from:"frail_lick",to:"frail_lick",prob:.7,label:"70%"}],
    notes:["Spike Slimes apply Frail","Acid Slimes apply Weak"],asc:[{level:2,text:"Tackle 8→10"},{level:7,text:"HP 28-32→29-34"},{level:17,text:"Lick can't 2×"}]},

  {id:"spike_slime_s",name:"Spike Slime (S)",emoji:"🔺",type:"normal",desc:"Only attacks.",hp:a=>a>=7?[11,15]:[10,14],
    states:[{id:"tackle",name:"Tackle",type:"attack",detail:a=>a>=2?"6 dmg":"5 dmg"}],
    positions:{_start:{x:170,y:235},tackle:{x:500,y:235}},transitions:()=>[{from:null,to:"tackle",prob:1,label:"Always"},{from:"tackle",to:"tackle",prob:1,label:"Forever"}],
    notes:["Single move"],asc:[{level:2,text:"Tackle 5→6"},{level:7,text:"HP 10-14→11-15"}]},

  {id:"fungi_beast",name:"Fungi Beast",emoji:"🍄",type:"normal",desc:"Bites + grows STR. Spore Cloud on death.",hp:a=>a>=7?[24,28]:[22,28],
    states:[{id:"bite",name:"Bite",type:"attack",detail:()=>"6 dmg"},{id:"grow",name:"Grow",type:"buff",detail:a=>a>=17?`+${(a>=2?4:3)+1} STR`:a>=2?"+4 STR":"+3 STR"}],
    positions:{_start:{x:100,y:150},bite:{x:360,y:120},grow:{x:560,y:330}},
    transitions:()=>[{from:null,to:"bite",prob:.6,label:"60%"},{from:null,to:"grow",prob:.4,label:"40%"},{from:"bite",to:"bite",prob:.6,label:"60%"},{from:"bite",to:"grow",prob:.4,label:"40%"},{from:"grow",to:"bite",prob:1,label:"Always"}],
    notes:["Spore Cloud: Vuln 2 on death","Can't Bite 3×, Can't Grow 2×"],asc:[{level:2,text:"Grow +3→+4"},{level:7,text:"HP 22-28→24-28"},{level:17,text:"Grow +1 extra"}]},

  // ── BATCH 3 ──
  {id:"looter",name:"Looter",emoji:"💰",type:"normal",desc:"Steals gold then flees. Kill fast!",hp:a=>a>=7?[46,50]:[44,48],
    states:[{id:"mug",name:"Mug",type:"attack",detail:a=>a>=2?"11 dmg":"10 dmg"},{id:"lunge",name:"Lunge",type:"attack",detail:a=>a>=2?"14 dmg":"12 dmg"},{id:"smoke_bomb",name:"Smoke Bomb",type:"defend",detail:()=>"6 block"},{id:"escape",name:"Escape",type:"special",detail:()=>"Flees!"}],
    positions:{_start:{x:60,y:80},mug:{x:230,y:80},lunge:{x:470,y:80},smoke_bomb:{x:470,y:310},escape:{x:650,y:310}},
    transitions:()=>[{from:null,to:"mug",prob:1,label:"Turn 1"},{from:"mug",to:"mug",prob:null,label:"Turn 2"},{from:"mug",to:"lunge",prob:.5,label:"50%"},{from:"mug",to:"smoke_bomb",prob:.5,label:"50%"},{from:"lunge",to:"smoke_bomb",prob:1,label:"Always"},{from:"smoke_bomb",to:"escape",prob:1,label:"Always"},{from:"escape",to:"escape",prob:1,label:"Gone"}],
    notes:a=>[`Steals ${a>=17?20:15} gold per Mug/Lunge hit`,"Mug×2 → 50/50 Lunge or Smoke Bomb","Gold returned on kill"],
    asc:[{level:2,text:"Mug 10→11, Lunge 12→14"},{level:7,text:"HP 44-48→46-50"},{level:17,text:"Steals 15→20 gold"}]},

  {id:"blue_slaver",name:"Blue Slaver",emoji:"⛓",type:"normal",desc:"Stabs and rakes with Weak.",hp:a=>a>=7?[48,52]:[46,50],
    states:[{id:"stab",name:"Stab",type:"attack",detail:a=>a>=2?"13 dmg":"12 dmg"},{id:"rake",name:"Rake",type:"attack_debuff",detail:a=>a>=17?`${a>=2?8:7} +Wk2`:`${a>=2?8:7} +Wk1`}],
    positions:{_start:{x:100,y:150},stab:{x:360,y:120},rake:{x:560,y:330}},
    transitions:a=>a>=17?[{from:null,to:"stab",prob:.6,label:"60%"},{from:null,to:"rake",prob:.4,label:"40%"},{from:"stab",to:"stab",prob:.5,label:"~50%"},{from:"stab",to:"rake",prob:.5,label:"~50%"},{from:"rake",to:"stab",prob:1,label:"Always"}]:[{from:null,to:"stab",prob:.6,label:"60%"},{from:null,to:"rake",prob:.4,label:"40%"},{from:"stab",to:"stab",prob:.5,label:"~50%"},{from:"stab",to:"rake",prob:.5,label:"~50%"},{from:"rake",to:"stab",prob:.5,label:"~50%"},{from:"rake",to:"rake",prob:.5,label:"~50%"}],
    notes:a=>a>=17?["Can't Rake 2×","Can't Stab 3×"]:["Can't Stab 3×","Can't Rake 3×"],
    asc:[{level:2,text:"Stab 12→13, Rake 7→8"},{level:7,text:"HP 46-50→48-52"},{level:17,text:"Rake Wk1→2, can't 2×"}]},

  {id:"red_slaver",name:"Red Slaver",emoji:"🔗",type:"normal",desc:"Stabs, scrapes+Vuln, Entangles once.",hp:a=>a>=7?[48,52]:[46,50],
    states:[{id:"stab",name:"Stab",type:"attack",detail:a=>a>=2?"14 dmg":"13 dmg"},{id:"scrape",name:"Scrape",type:"attack_debuff",detail:a=>a>=17?`${a>=2?9:8} +Vln2`:`${a>=2?9:8} +Vln1`},{id:"entangle",name:"Entangle",type:"debuff",detail:()=>"Can't Attack"}],
    positions:{_start:{x:70,y:90},stab:{x:300,y:90},scrape:{x:560,y:90},entangle:{x:420,y:370}},
    transitions:()=>[{from:null,to:"stab",prob:1,label:"Turn 1"},{from:"stab",to:"stab",prob:.35,label:"~35%"},{from:"stab",to:"scrape",prob:.4,label:"~40%"},{from:"stab",to:"entangle",prob:.25,label:"25%*"},{from:"scrape",to:"stab",prob:.5,label:"~50%"},{from:"scrape",to:"scrape",prob:.5,label:"~50%"},{from:"entangle",to:"stab",prob:.45,label:"~45%"},{from:"entangle",to:"scrape",prob:.55,label:"~55%"}],
    notes:a=>["Stab turn 1 always","Entangle used ONCE only (25% when eligible)",a>=17?"Can't Scrape 2×":"Can't Scrape 3×"],
    asc:[{level:2,text:"Stab 13→14, Scrape 8→9"},{level:7,text:"HP 46-50→48-52"},{level:17,text:"Scrape Vln1→2, can't 2×"}]},

  // ═══ ELITES ═══
  {id:"gremlin_nob",name:"Gremlin Nob",emoji:"👹",type:"elite",desc:"Enrages on Skills. Dmg shown scales with STR!",hp:a=>a>=8?[85,90]:[82,86],
    states:[{id:"bellow",name:"Bellow",type:"buff",detail:a=>a>=18?"Enrage +3/Skill":"Enrage +2/Skill"},{id:"rush",name:"Rush",type:"attack",detail:a=>a>=3?"16 dmg":"14 dmg"},{id:"skull_bash",name:"Skull Bash",type:"attack_debuff",detail:a=>a>=3?"8 +Vuln2":"6 +Vuln2"}],
    positions:{_start:{x:90,y:90},bellow:{x:370,y:90},rush:{x:200,y:365},skull_bash:{x:560,y:365}},
    transitions:a=>a>=18?[{from:null,to:"bellow",prob:1,label:"Turn 1"},{from:"bellow",to:"skull_bash",prob:1,label:"Guaranteed"},{from:"skull_bash",to:"rush",prob:1,label:"Then Rush"},{from:"rush",to:"rush",prob:.5,label:"~50%"},{from:"rush",to:"skull_bash",prob:.5,label:"~50%"}]:[{from:null,to:"bellow",prob:1,label:"Turn 1"},{from:"bellow",to:"rush",prob:.67,label:"67%"},{from:"bellow",to:"skull_bash",prob:.33,label:"33%"},{from:"rush",to:"rush",prob:.67,label:"67%"},{from:"rush",to:"skull_bash",prob:.33,label:"33%"},{from:"skull_bash",to:"rush",prob:.67,label:"67%"},{from:"skull_bash",to:"skull_bash",prob:.33,label:"33%"}],
    notes:a=>["In-game damage appears higher due to accumulated STR from Enrage","Base Rush="+`${a>=3?16:14}, but each Skill adds +${a>=18?3:2} STR`,...(a>=18?["A18: Bash forced if not in last 2","Can't Rush 3×"]:["Can't same 3×"])],
    asc:[{level:3,text:"Rush 14→16, Bash 6→8"},{level:8,text:"HP 82-86→85-90"},{level:18,text:"Enrage +3, Bash deterministic"}]},

  // ★ FIXED: Lagavulin attacks TWICE then Siphon (not alternating)
  {id:"lagavulin",name:"Lagavulin",emoji:"😴",type:"elite",desc:"Sleeps with 8 Metallicize. Attack×2 then Siphon.",hp:a=>a>=7?[109,113]:[104,110],
    states:[{id:"sleeping",name:"Sleeping",type:"special",detail:()=>"Metallicize 8"},{id:"attack",name:"Attack",type:"attack",detail:a=>a>=2?"20 dmg":"18 dmg"},{id:"siphon",name:"Siphon Soul",type:"debuff",detail:a=>a>=17?"-2 STR -2 DEX":"-1 STR -1 DEX"}],
    positions:{_start:{x:90,y:90},sleeping:{x:370,y:90},attack:{x:200,y:365},siphon:{x:560,y:365}},
    transitions:()=>[{from:null,to:"sleeping",prob:1,label:"Start"},{from:"sleeping",to:"sleeping",prob:null,label:"≤3 turns"},{from:"sleeping",to:"attack",prob:null,label:"Wakes"},{from:"attack",to:"attack",prob:null,label:"2nd Attack"},{from:"attack",to:"siphon",prob:1,label:"After 2 Atks"},{from:"siphon",to:"attack",prob:1,label:"Cycle"}],
    notes:["Wakes after 3 turns or on damage","8 Metallicize while asleep","Pattern: Attack→Attack→Siphon (repeating)","Not alternating — always 2 attacks before Siphon"],
    asc:[{level:2,text:"Attack 18→20"},{level:7,text:"HP 104-110→109-113"},{level:17,text:"Siphon -1→-2 STR/DEX"}]},

  {id:"sentry",name:"Sentry",emoji:"🔷",type:"elite",desc:"Alternates Bolt (Dazed) and Beam. 3 per encounter.",hp:a=>a>=8?[39,45]:[38,42],
    states:[{id:"bolt",name:"Bolt",type:"debuff",detail:a=>a>=18?"3 Dazed":"2 Dazed"},{id:"beam",name:"Beam",type:"attack",detail:a=>a>=3?"10 dmg":"9 dmg"}],
    positions:{_start:{x:100,y:235},bolt:{x:330,y:120},beam:{x:600,y:350}},
    transitions:()=>[{from:null,to:"bolt",prob:.5,label:"Even pos"},{from:null,to:"beam",prob:.5,label:"Odd pos"},{from:"bolt",to:"beam",prob:1,label:"Alt"},{from:"beam",to:"bolt",prob:1,label:"Alt"}],
    notes:["3 Sentries in encounter","Even-indexed→Bolt first, Odd→Beam first","Each has Artifact 1","Strictly alternates"],asc:[{level:3,text:"Beam 9→10"},{level:8,text:"HP 38-42→39-45"},{level:18,text:"Dazed 2→3"}]},

  // ═══ BOSSES ═══
  {id:"guardian",name:"The Guardian",emoji:"⚙",type:"boss",desc:"Mode Shift boss: curls up on damage threshold.",hp:a=>a>=9?[250,250]:[240,240],
    states:[{id:"charge_up",name:"Charge Up",type:"defend",detail:()=>"9 block"},{id:"fierce_bash",name:"Fierce Bash",type:"attack",detail:a=>a>=4?"36 dmg":"32 dmg"},{id:"vent_steam",name:"Vent Steam",type:"debuff",detail:()=>"Wk2 +Vln2"},{id:"whirlwind",name:"Whirlwind",type:"attack",detail:()=>"5 dmg ×4"},{id:"close_up",name:"Close Up",type:"buff",detail:a=>a>=19?"Sharp Hide 4":"Sharp Hide 3"},{id:"roll",name:"Roll Attack",type:"attack",detail:a=>a>=4?"10 dmg":"9 dmg"},{id:"twin_slam",name:"Twin Slam",type:"mixed",detail:()=>"8 dmg ×2"}],
    positions:{_start:{x:50,y:60},charge_up:{x:180,y:60},fierce_bash:{x:370,y:60},vent_steam:{x:560,y:60},whirlwind:{x:640,y:230},close_up:{x:130,y:330},roll:{x:340,y:380},twin_slam:{x:530,y:380}},
    transitions:()=>[{from:null,to:"charge_up",prob:1,label:"Turn 1"},{from:"charge_up",to:"fierce_bash",prob:1,label:"→"},{from:"fierce_bash",to:"vent_steam",prob:1,label:"→"},{from:"vent_steam",to:"whirlwind",prob:1,label:"→"},{from:"whirlwind",to:"charge_up",prob:1,label:"Cycle"},{from:"charge_up",to:"close_up",prob:null,label:"Mode Shift!"},{from:"fierce_bash",to:"close_up",prob:null,label:"Mode Shift!"},{from:"vent_steam",to:"close_up",prob:null,label:"Mode Shift!"},{from:"whirlwind",to:"close_up",prob:null,label:"Mode Shift!"},{from:"close_up",to:"roll",prob:1,label:"Def mode"},{from:"roll",to:"twin_slam",prob:1,label:"→"},{from:"twin_slam",to:"whirlwind",prob:1,label:"Opens up"}],
    notes:a=>[`Mode Shift: curls after ${a>=19?40:a>=9?35:30} dmg (+10 each)`,"Gains 20 block + Sharp Hide on curl","Twin Slam removes Sharp Hide, reopens","Cycle: Charge→Bash→Vent→Whirl ×4"],
    asc:[{level:4,text:"Bash 32→36, Roll 9→10"},{level:9,text:"HP 240→250, Threshold 30→35"},{level:19,text:"Threshold→40, Sharp Hide 3→4"}]},

  {id:"hexaghost",name:"Hexaghost",emoji:"👻",type:"boss",desc:"Fixed 7-turn cycle. Inferno upgrades Burns.",hp:a=>a>=9?[264,264]:[250,250],
    states:[{id:"activate",name:"Activate",type:"unknown",detail:()=>"Divider (HP/12+1)×6"},{id:"sear",name:"Sear",type:"attack_debuff",detail:a=>`6 dmg +${a>=19?2:1} Burn`},{id:"tackle",name:"Tackle",type:"attack",detail:a=>a>=4?"6 dmg ×2":"5 dmg ×2"},{id:"inflame",name:"Inflame",type:"defend_buff",detail:a=>`12 blk +${a>=19?3:2} STR`},{id:"inferno",name:"Inferno",type:"attack_debuff",detail:a=>`${a>=4?3:2} dmg ×6 +↑Burns`}],
    positions:{_start:{x:50,y:110},activate:{x:200,y:60},sear:{x:400,y:60},tackle:{x:620,y:120},inflame:{x:600,y:340},inferno:{x:200,y:380}},
    transitions:()=>[{from:null,to:"activate",prob:1,label:"T1"},{from:"activate",to:"sear",prob:1,label:"T2"},{from:"sear",to:"tackle",prob:null,label:"T3"},{from:"tackle",to:"sear",prob:null,label:"T4"},{from:"sear",to:"inflame",prob:null,label:"T5"},{from:"inflame",to:"tackle",prob:null,label:"T6"},{from:"tackle",to:"sear",prob:null,label:"T7"},{from:"sear",to:"inferno",prob:null,label:"Orbs lit"},{from:"inferno",to:"sear",prob:1,label:"Cycle"}],
    notes:["Cycle: Activate→Sear→Tackle→Sear→Inflame→Tackle→Sear→Inferno","Inferno upgrades all Burns in deck","Divider = (player HP/12+1) × 6 hits"],
    asc:[{level:4,text:"Tackle 5→6×2, Inferno 2→3×6"},{level:9,text:"HP 250→264"},{level:19,text:"Sear 1→2 Burn, STR 2→3"}]},

  {id:"slime_boss",name:"Slime Boss",emoji:"🟤",type:"boss",desc:"Sticky→Prep→Slam cycle. Splits at 50%.",hp:a=>a>=9?[150,150]:[140,140],
    states:[{id:"goop",name:"Goop Spray",type:"debuff",detail:a=>a>=19?"5 Slimed":"3 Slimed"},{id:"prep",name:"Preparing",type:"unknown",detail:()=>"Unknown"},{id:"slam",name:"Slam",type:"attack",detail:a=>a>=4?"38 dmg":"35 dmg"},{id:"split",name:"Split",type:"special",detail:()=>"→ Spike(L)+Acid(L)"}],
    positions:{_start:{x:70,y:80},goop:{x:250,y:80},prep:{x:460,y:80},slam:{x:640,y:210},split:{x:350,y:370}},
    transitions:()=>[{from:null,to:"goop",prob:1,label:"Turn 1"},{from:"goop",to:"prep",prob:1,label:"→"},{from:"prep",to:"slam",prob:1,label:"→"},{from:"slam",to:"goop",prob:1,label:"Cycle"},{from:"goop",to:"split",prob:null,label:"HP≤50%"},{from:"prep",to:"split",prob:null,label:"HP≤50%"},{from:"slam",to:"split",prob:null,label:"HP≤50%"}],
    notes:["Splits→Spike Slime L + Acid Slime L at ≤50%","Children inherit current HP","Cycle: Goop→Prep→Slam→repeat"],
    asc:[{level:4,text:"Slam 35→38"},{level:9,text:"HP 140→150"},{level:19,text:"Goop 3→5 Slimed"}]},
];

// ★ FIXED: Added missing encounters
const ENC = [
  {name:"Jaw Worm",type:"normal",enemies:["jaw_worm"],desc:"Always first fight"},
  {name:"Cultist",type:"normal",enemies:["cultist"]},
  {name:"2 Louse",type:"normal",enemies:["red_louse","green_louse"],desc:"Random Red/Green"},
  {name:"3 Louse",type:"normal",enemies:["red_louse","green_louse"],desc:"3 random Red/Green mix"},
  {name:"Jaw Worm + Louse",type:"normal",enemies:["jaw_worm","red_louse","green_louse"],desc:"Jaw Worm with a Louse"},
  {name:"Small Slimes",type:"normal",enemies:["acid_slime_s","spike_slime_s"]},
  {name:"Gremlin Gang",type:"normal",enemies:["mad_gremlin","sneaky_gremlin","fat_gremlin","shield_gremlin","gremlin_wizard"],desc:"3-4 random"},
  {name:"Large Slime",type:"normal",enemies:["spike_slime_l","acid_slime_l"]},
  {name:"Lots of Slimes",type:"normal",enemies:["acid_slime_s","spike_slime_s","acid_slime_m","spike_slime_m"]},
  {name:"Fungi Beast(s)",type:"normal",enemies:["fungi_beast"]},
  {name:"Looter",type:"normal",enemies:["looter"]},
  {name:"Exordium Thugs",type:"normal",enemies:["red_slaver","blue_slaver"],desc:"Slaver pair"},
  {name:"Blue Slaver",type:"normal",enemies:["blue_slaver"]},
  {name:"Red Slaver",type:"normal",enemies:["red_slaver"]},
  {name:"Gremlin Nob",type:"elite",enemies:["gremlin_nob"]},
  {name:"Lagavulin",type:"elite",enemies:["lagavulin"]},
  {name:"3 Sentries",type:"elite",enemies:["sentry"]},
  {name:"The Guardian",type:"boss",enemies:["guardian"]},
  {name:"Hexaghost",type:"boss",enemies:["hexaghost"]},
  {name:"Slime Boss",type:"boss",enemies:["slime_boss"]},
];

// ═══ SVG ═══
function cE(f,t,cv=.35){const dx=t.x-f.x,dy=t.y-f.y,d=Math.sqrt(dx*dx+dy*dy);if(!d)return null;const a=Math.atan2(dy,dx),nr=f.r||NR+4,nT=t.r||NR+4,nx=-dy/d,ny=dx/d,o=cv*55;const sx=f.x+nr*Math.cos(a+cv*.18),sy=f.y+nr*Math.sin(a+cv*.18),ex=t.x-nT*Math.cos(a-cv*.18),ey=t.y-nT*Math.sin(a-cv*.18),mx=(sx+ex)/2+nx*o,my=(sy+ey)/2+ny*o;return{path:`M ${sx} ${sy} Q ${mx} ${my} ${ex} ${ey}`,lx:(sx+2*mx+ex)/4,ly:(sy+2*my+ey)/4,ex,ey,ea:Math.atan2(ey-my,ex-mx)};}
function sL(n,d="top"){const cx=n.x,cy=n.y,r=NR+4;if(d==="top")return{path:`M ${cx-12} ${cy-r} C ${cx-50} ${cy-r-65},${cx+50} ${cy-r-65},${cx+12} ${cy-r}`,lx:cx,ly:cy-r-50,ex:cx+12,ey:cy-r,ea:.45};if(d==="right")return{path:`M ${cx+r} ${cy-12} C ${cx+r+65} ${cy-50},${cx+r+65} ${cy+50},${cx+r} ${cy+12}`,lx:cx+r+50,ly:cy,ex:cx+r,ey:cy+12,ea:Math.PI*.65};return{path:`M ${cx+12} ${cy+r} C ${cx+50} ${cy+r+65},${cx-50} ${cy+r+65},${cx-12} ${cy+r}`,lx:cx,ly:cy+r+50,ex:cx-12,ey:cy+r,ea:Math.PI+.45};}
function aH(x,y,a){const s=7,a1=a+Math.PI*.8,a2=a-Math.PI*.8;return`M ${x} ${y} L ${x+s*Math.cos(a1)} ${y+s*Math.sin(a1)} L ${x+s*Math.cos(a2)} ${y+s*Math.sin(a2)} Z`;}

function SN({state,pos,asc,hov,onH,onL}){const s=MS[state.type]||MS.special,isH=hov===state.id,det=state.detail(asc);
  return(<g onMouseEnter={()=>onH(state.id)} onMouseLeave={onL} style={{cursor:"pointer"}}>{isH&&<circle cx={pos.x} cy={pos.y} r={NR+6} fill="none" stroke={s.color} strokeWidth="2" opacity=".4" style={{filter:`drop-shadow(0 0 8px ${s.color})`}}/>}<circle cx={pos.x} cy={pos.y} r={NR} fill={s.bg} stroke={s.color} strokeWidth={isH?2.5:1.5} opacity={isH?1:.9}/><text x={pos.x} y={pos.y-11} textAnchor="middle" fontSize="13" fill={s.color} fontFamily="'Fira Code',monospace">{s.icon}</text><text x={pos.x} y={pos.y+4} textAnchor="middle" fontSize="9.5" fill={C.text} fontFamily="'Cinzel',serif" fontWeight="700">{state.name}</text><text x={pos.x} y={pos.y+17} textAnchor="middle" fontSize="8" fill={s.color} fontFamily="'Fira Code',monospace" fontWeight="500">{det}</text></g>);}

function EP({e,hov,fId,tId}){const rel=hov&&(hov===fId||hov===tId),ec=rel?C.edgeHi:C.edge,pc=rel?C.goldBright:C.prob,op=hov?(rel?1:.18):.65;
  return(<g opacity={op}><path d={e.path} fill="none" stroke={ec} strokeWidth={rel?2:1.3} strokeDasharray={e.dash?"5,4":"none"}/>{e.ex!=null&&<path d={aH(e.ex,e.ey,e.ea)} fill={ec}/>}{e.label&&<><rect x={e.lx-e.label.length*2.9-3} y={e.ly-7} width={e.label.length*5.8+6} height={14} rx="3" fill={C.bg} opacity=".9"/><text x={e.lx} y={e.ly+3} textAnchor="middle" fontSize="8.5" fill={pc} fontFamily="'Fira Code',monospace" fontWeight="500">{e.label}</text></>}</g>);}

function Diagram({enemy,asc,hov,setHov}){const pos=enemy.positions,trans=typeof enemy.transitions==="function"?enemy.transitions(asc):enemy.transitions;
  const pairs=new Set();trans.forEach(t=>{if(t.from&&t.to&&t.from!==t.to)pairs.add(`${t.from}->${t.to}`);});
  const edges=trans.map(t=>{const fp=t.from?pos[t.from]:pos._start,tp=pos[t.to];if(!fp||!tp)return null;
    if(t.from&&t.from===t.to){const dir=tp.y<=180?"top":tp.x>=520?"right":"bottom";const l=sL(tp,dir);return{...l,label:t.label,fId:t.from,tId:t.to,dash:t.prob===null};}
    const rev=t.from&&pairs.has(`${t.to}->${t.from}`);const ed=cE({...fp,r:t.from?NR+4:15},{...tp,r:NR+4},rev?.5:.3);
    if(!ed)return null;return{path:ed.path,lx:ed.lx,ly:ed.ly,ex:ed.ex,ey:ed.ey,ea:ed.ea,label:t.label,fId:t.from,tId:t.to,dash:t.prob===null};}).filter(Boolean);
  return(<svg viewBox="0 0 730 460" style={{width:"100%",height:"100%"}}><defs><pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse"><path d="M 30 0 L 0 0 0 30" fill="none" stroke={C.border} strokeWidth=".3" opacity=".3"/></pattern></defs><rect width="730" height="460" fill="url(#grid)" opacity=".5"/>
    {edges.map((e,i)=><EP key={i} e={e} hov={hov} fId={e.fId} tId={e.tId}/>)}
    <g><circle cx={pos._start.x} cy={pos._start.y} r={12} fill={C.startNode} opacity=".8"/><text x={pos._start.x} y={pos._start.y+3} textAnchor="middle" fontSize="6.5" fill="#fff" fontFamily="'Fira Code',monospace" fontWeight="500">START</text></g>
    {enemy.states.map(s=><SN key={s.id} state={s} pos={pos[s.id]} asc={asc} hov={hov} onH={setHov} onL={()=>setHov(null)}/>)}</svg>);}

function TB({type}){const c={normal:C.tagNormal,elite:C.tagElite,boss:C.tagBoss}[type]||C.textDim;return<span style={{fontSize:"7.5px",fontFamily:"'Fira Code',monospace",color:c,border:`1px solid ${c}40`,borderRadius:"3px",padding:"1px 5px",textTransform:"uppercase",letterSpacing:"1px"}}>{type}</span>;}

// ═══ MAIN ═══
const App = () => {
  const [selId,setSelId]=useState("cultist");
  const [asc,setAsc]=useState(0);
  const [hov,setHov]=useState(null);
  const [search,setSearch]=useState("");
  const [fType,setFType]=useState("all");
  const [showEnc,setShowEnc]=useState(false);

  const enemy=ENEMIES.find(e=>e.id===selId);
  const hp=enemy.hp(asc);
  const notes=typeof enemy.notes==="function"?enemy.notes(asc):enemy.notes;
  const aE=enemy.asc.filter(e=>asc>=e.level),iE=enemy.asc.filter(e=>asc<e.level);

  useEffect(()=>{const s=document.createElement("style");s.textContent=FONT_CSS+`::-webkit-scrollbar{width:5px}::-webkit-scrollbar-track{background:${C.bg}}::-webkit-scrollbar-thumb{background:${C.border};border-radius:3px}input[type=range]{height:6px}`;document.head.appendChild(s);return()=>document.head.removeChild(s);},[]);

  const filtered=ENEMIES.filter(e=>(fType==="all"||e.type===fType)&&(!search||e.name.toLowerCase().includes(search.toLowerCase())));
  const grouped={normal:[],elite:[],boss:[]};filtered.forEach(e=>{if(grouped[e.type])grouped[e.type].push(e);});
  const sel=useCallback(id=>{setSelId(id);setHov(null);},[]);

  return(<div style={{minHeight:"100vh",background:C.bg,color:C.text,fontFamily:"'Cinzel',serif",display:"flex",flexDirection:"column"}}>
    <div style={{padding:"10px 16px 8px",background:`linear-gradient(180deg,#12122a 0%,${C.bg} 100%)`,borderBottom:`1px solid ${C.border}`,display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:"8px"}}>
      <div style={{display:"flex",alignItems:"baseline",gap:"10px"}}><span style={{fontSize:"16px",color:C.gold,fontWeight:900,letterSpacing:"1px"}}>⚔ STS</span><span style={{fontSize:"11.5px",color:C.textDim}}>Act 1 — Enemy AI Visualizer</span><span style={{fontSize:"8.5px",color:C.textMuted,fontFamily:"'Fira Code',monospace"}}>{ENEMIES.length} enemies</span></div>
      <button onClick={()=>setShowEnc(!showEnc)} style={{padding:"4px 11px",borderRadius:"5px",fontSize:"10.5px",fontFamily:"'Cinzel',serif",cursor:"pointer",border:`1.5px solid ${showEnc?C.gold:C.border}`,background:showEnc?`${C.gold}18`:C.panel,color:showEnc?C.gold:C.textDim}}>{showEnc?"◀ Enemies":"Encounters ▶"}</button>
    </div>
    <div style={{flex:1,display:"flex",minHeight:0}}>
      <div style={{width:"200px",minWidth:"200px",borderRight:`1px solid ${C.border}`,background:C.panel,display:"flex",flexDirection:"column",overflowY:"auto"}}>
        {!showEnc?(<><div style={{padding:"8px 8px 5px"}}><input type="text" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search..." style={{width:"100%",boxSizing:"border-box",padding:"5px 7px",borderRadius:"4px",border:`1px solid ${C.border}`,background:C.bg,color:C.text,fontSize:"10.5px",fontFamily:"'Fira Code',monospace",outline:"none"}}/>
          <div style={{display:"flex",gap:"3px",marginTop:"5px"}}>{["all","normal","elite","boss"].map(t=><button key={t} onClick={()=>setFType(t)} style={{flex:1,padding:"2px 0",fontSize:"7.5px",fontFamily:"'Fira Code',monospace",borderRadius:"3px",cursor:"pointer",border:`1px solid ${fType===t?C.gold:C.border}`,background:fType===t?`${C.gold}18`:"transparent",color:fType===t?C.gold:C.textMuted,textTransform:"uppercase"}}>{t}</button>)}</div></div>
          <div style={{flex:1,overflowY:"auto",padding:"1px 5px 6px"}}>{["normal","elite","boss"].map(type=>{const items=grouped[type];if(!items?.length)return null;return(<div key={type} style={{marginBottom:"5px"}}><div style={{fontSize:"7.5px",color:C.textMuted,letterSpacing:"1.5px",padding:"3px 3px 1px",textTransform:"uppercase"}}>{type==="normal"?"Normal":type==="elite"?"Elites":"Bosses"}</div>
            {items.map(e=><button key={e.id} onClick={()=>sel(e.id)} style={{display:"flex",alignItems:"center",gap:"5px",width:"100%",padding:"4px 7px",borderRadius:"4px",textAlign:"left",cursor:"pointer",border:selId===e.id?`1.5px solid ${C.gold}`:"1px solid transparent",background:selId===e.id?`${C.gold}12`:"transparent",color:selId===e.id?C.gold:C.textDim,fontSize:"11px",fontFamily:"'Cinzel',serif",fontWeight:selId===e.id?700:400,transition:"all .15s"}}><span style={{fontSize:"12px"}}>{e.emoji}</span><span>{e.name}</span></button>)}</div>);})}</div>
        </>):(
          <div style={{flex:1,overflowY:"auto",padding:"7px"}}><div style={{fontSize:"7.5px",color:C.textMuted,letterSpacing:"1.5px",padding:"2px 0 5px",textTransform:"uppercase"}}>Act 1 Encounters</div>
            {ENC.map((enc,i)=><div key={i} style={{padding:"6px 8px",marginBottom:"3px",borderRadius:"5px",border:`1px solid ${C.border}`,background:C.bg}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}><span style={{fontSize:"10.5px",color:C.text,fontWeight:600}}>{enc.name}</span><TB type={enc.type}/></div>
              {enc.desc&&<div style={{fontSize:"8px",color:C.textMuted,fontFamily:"'Fira Code',monospace"}}>{enc.desc}</div>}
              <div style={{display:"flex",gap:"3px",marginTop:"3px",flexWrap:"wrap"}}>{enc.enemies.map(eid=>{const en=ENEMIES.find(e=>e.id===eid);if(!en)return null;return<button key={eid} onClick={()=>{sel(eid);setShowEnc(false);}} style={{padding:"2px 6px",borderRadius:"3px",fontSize:"9px",border:`1px solid ${C.borderHi}`,background:"#181838",color:C.textDim,cursor:"pointer",fontFamily:"'Cinzel',serif"}}>{en.emoji} {en.name}</button>;})}</div></div>)}
          </div>)}
      </div>
      <div style={{flex:1,display:"flex",flexDirection:"column",minWidth:0}}>
        <div style={{padding:"8px 14px",background:`${C.panel}cc`,borderBottom:`1px solid ${C.border}`,display:"flex",alignItems:"center",gap:"16px",flexWrap:"wrap"}}>
          <div style={{display:"flex",alignItems:"center",gap:"5px"}}><span style={{fontSize:"14px"}}>{enemy.emoji}</span><span style={{fontSize:"13.5px",fontWeight:700,color:C.gold}}>{enemy.name}</span><TB type={enemy.type}/></div>
          <div style={{display:"flex",alignItems:"center",gap:"7px"}}><span style={{fontSize:"9px",color:C.textMuted,letterSpacing:"1px"}}>ASC</span><input type="range" min="0" max="20" value={asc} onChange={e=>setAsc(+e.target.value)} style={{width:"120px",accentColor:C.gold,cursor:"pointer"}}/><span style={{fontFamily:"'Fira Code',monospace",fontSize:"13px",color:C.gold,fontWeight:700,minWidth:"20px",textAlign:"center"}}>{asc}</span></div>
          <div style={{display:"flex",alignItems:"center",gap:"4px"}}><span style={{fontSize:"9px",color:C.textMuted}}>HP</span><span style={{fontFamily:"'Fira Code',monospace",fontSize:"12px",color:C.attack,fontWeight:500}}>{hp[0]===hp[1]?hp[0]:`${hp[0]}–${hp[1]}`}</span></div>
          <div style={{fontSize:"10.5px",color:C.textDim,fontStyle:"italic",flex:1,textAlign:"right"}}>{enemy.desc}</div>
        </div>
        <div style={{flex:1,padding:"4px 8px",minHeight:"280px"}}><Diagram enemy={enemy} asc={asc} hov={hov} setHov={setHov}/></div>
        <div style={{padding:"8px 14px",background:C.panel,borderTop:`1px solid ${C.border}`,display:"flex",gap:"16px",flexWrap:"wrap",alignItems:"flex-start"}}>
          <div style={{flex:2,minWidth:"220px"}}><div style={{fontSize:"8px",color:C.textMuted,marginBottom:"3px",letterSpacing:"1.5px"}}>ASCENSION EFFECTS</div>
            <div style={{display:"flex",flexWrap:"wrap",gap:"1px 10px"}}>{aE.map((e,i)=><div key={i} style={{fontSize:"9.5px",color:C.prob,fontFamily:"'Fira Code',monospace"}}><span style={{marginRight:"2px"}}>✓</span><span style={{color:C.goldDim,marginRight:"2px"}}>A{e.level}:</span>{e.text}</div>)}{iE.map((e,i)=><div key={i} style={{fontSize:"9.5px",color:C.textMuted,fontFamily:"'Fira Code',monospace"}}><span style={{marginRight:"2px"}}>✗</span><span style={{marginRight:"2px"}}>A{e.level}:</span>{e.text}</div>)}</div></div>
          {notes.length>0&&<div style={{flex:1,minWidth:"160px"}}><div style={{fontSize:"8px",color:C.textMuted,marginBottom:"3px",letterSpacing:"1.5px"}}>BEHAVIOR NOTES</div>{notes.map((n,i)=><div key={i} style={{fontSize:"9.5px",color:C.textDim,fontFamily:"'Fira Code',monospace",marginBottom:"1px"}}>• {n}</div>)}</div>}
          <div style={{minWidth:"110px"}}><div style={{fontSize:"8px",color:C.textMuted,marginBottom:"3px",letterSpacing:"1.5px"}}>MOVE TYPES</div><div style={{display:"flex",flexWrap:"wrap",gap:"1px 8px"}}>{Object.entries(MS).map(([k,s])=><div key={k} style={{fontSize:"8.5px",color:s.color,fontFamily:"'Fira Code',monospace",display:"flex",alignItems:"center",gap:"2px"}}><span style={{width:"7px",height:"7px",borderRadius:"50%",background:s.bg,border:`1.5px solid ${s.color}`,display:"inline-block"}}/>{s.label}</div>)}</div></div>
        </div>
      </div>
    </div>
  </div>);
};

export default App;