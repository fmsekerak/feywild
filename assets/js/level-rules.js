/* Single-class 2014-style progression tables. No subclass/multiclass assumptions.
   Spell slots use full/half-caster tables; Pact Magic is separate from Mystic Arcanum. */
(() => {
 const FULL=[
  [2],[3],[4,2],[4,3],[4,3,2],[4,3,3],[4,3,3,1],[4,3,3,2],
  [4,3,3,3,1],[4,3,3,3,2],[4,3,3,3,2,1],[4,3,3,3,2,1],
  [4,3,3,3,2,1,1],[4,3,3,3,2,1,1],[4,3,3,3,2,1,1,1],
  [4,3,3,3,2,1,1,1],[4,3,3,3,2,1,1,1,1],
  [4,3,3,3,3,1,1,1,1],[4,3,3,3,3,2,1,1,1],[4,3,3,3,3,2,2,1,1]
 ];
 const classes={
  artificer:{die:8,casting:'artificer'},
  barbarian:{die:12},bard:{die:8,casting:'full'},
  cleric:{die:8,casting:'full'},druid:{die:8,casting:'full'},
  fighter:{die:10},monk:{die:8},
  // Site-specific Himbo homebrew: retain the previously configured d10 hit die.
  himbo:{die:10},
  paladin:{die:10,casting:'half'},ranger:{die:10,casting:'half'},
  rogue:{die:8},sorcerer:{die:6,casting:'full'},
  warlock:{die:8,casting:'pact'},wizard:{die:6,casting:'full'}
 };
 const clean=value=>String(value||'').trim().toLowerCase();
 const atLevel=value=>{const n=Number(value);return Number.isInteger(n)&&n>=1&&n<=20?n:null;};
 const getClass=()=>clean(document.getElementById('profile-class')?.textContent);
 function classRule(value){
  const key=clean(value||getClass());
  return Object.hasOwn(classes,key)?classes[key]:null;
 }
 function slotsFor(value,levelValue){
  const level=atLevel(levelValue),rule=classRule(value);
  if(!level||!rule)return null;
  if(rule.casting==='full')return FULL[level-1].slice();
  if(rule.casting==='half')return level===1?[]:FULL[Math.ceil(level/2)-1].slice();
  if(rule.casting==='artificer')return FULL[Math.ceil(level/2)-1].slice();
  if(rule.casting==='pact'){
   const count=level>=17?4:level>=11?3:level>=2?2:1;
   const tier=Math.min(5,Math.ceil(level/2));
   return Array.from({length:tier},(_,i)=>i===tier-1?count:0);
  }
  return [];
 }
 function hpFor(value,levelValue,constitutionScore,tough=false){
  const rule=classRule(value),level=atLevel(levelValue);
  if(!rule||!level||constitutionScore===''||!Number.isFinite(Number(constitutionScore)))return null;
  const con=Math.floor((Number(constitutionScore)-10)/2);
  // Max hit die at first level, fixed-average per later level; each level earns at least 1 HP.
  return Math.max(1,rule.die+con)+(level-1)*Math.max(1,Math.floor(rule.die/2)+1+con)+(tough?level*2:0);
 }
 window.FEYWILD_LEVEL_RULES={atLevel,classRule,getClass,slotsFor,hpFor,proficiency:level=>2+Math.floor((level-1)/4)};
})();
