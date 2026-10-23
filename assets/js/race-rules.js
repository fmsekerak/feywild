/* Factual race reference formatting. Selection changes only base walking speed. */
(function(root){
 'use strict';
 const abilities={str:'STR',dex:'DEX',con:'CON',int:'INT',wis:'WIS',cha:'CHA'};
 const sizes={T:'Tiny',S:'Small',M:'Medium',L:'Large',H:'Huge',G:'Gargantuan'};
 const options={any:'any choice',anyStandard:'standard language',anyArtisansTool:"artisan’s tool",anyMusicalInstrument:'musical instrument',anySkill:'skill',anyTool:'tool',other:'other language (see source)'};
 const arr=x=>x==null?[]:Array.isArray(x)?x:[x];
 const label=s=>{
  const text=String(s).split('|')[0].split('#')[0];
  return options[text]||abilities[text]||text.replace(/\b\w/g,c=>c.toUpperCase());
 };
 function choice(value){return arr(value).map(v=>'Choose '+(v.count||1)+' from '+arr(v.from).map(label).join(', ')).join('; ');}
 function grants(rows){return arr(rows).map(row=>Object.entries(row).map(([k,v])=>{
  if(k==='choose')return choice(v);
  if(v===true)return label(k);
  if(typeof v==='number')return 'Choose '+v+' '+(options[k]||label(k));
  return '';
 }).filter(Boolean).join('; ')).join(' OR ');}
 function abilityText(race){
  if(race.lineage==='VRGR'&&!race.ability)return '+2 to one ability and +1 to a different ability, or +1 to three different abilities (maximum 20).';
  return arr(race.ability).map(row=>Object.entries(row).map(([k,v])=>k==='choose'?
   (v.amount??1)>=0?'+'+(v.amount??1)+' to '+(v.count||1)+' choice(s): '+arr(v.from).map(label).join(', '):String(v.amount)+' to '+(v.count||1)+' choice(s): '+arr(v.from).map(label).join(', '):
   (v>=0?'+':'')+v+' '+label(k)).join('; ')).join(' OR ');
 }
 function walkingSpeed(race){const n=typeof race?.speed==='number'?race.speed:race?.speed?.walk;return Number.isFinite(n)&&n>=0?n:null;}
 function movement(race){const speed=typeof race.speed==='number'?{walk:race.speed}:race.speed||{};
  return Object.entries(speed).map(([k,v])=>label(k)+' '+(v===true?'equal to walking speed':v+' ft')).join(' · ');
 }
 function damage(values){return arr(values).map(v=>typeof v==='string'?label(v):v.choose?choice(v.choose):'Conditional; see source').join(', ');}
 function spellNames(race){
  const names=new Set();let hasChoice=false;
  function visit(value){
   if(typeof value==='string'){names.add(label(value));return;}
   if(Array.isArray(value)){value.forEach(visit);return;}
   if(value&&typeof value==='object')for(const [k,v] of Object.entries(value)){
    if(['choose','all'].includes(k)){hasChoice=true;continue;}
    if(['ability','name','resourceName'].includes(k))continue;
    visit(v);
   }
  }
  for(const group of race.additionalSpells||[])for(const key of ['known','innate','expanded','prepared'])if(group[key])visit(group[key]);
  return [...names,...(hasChoice?['Additional spell choice (see source)']:[])].join(', ');
 }
 function facts(race){
  const rows=[];const add=(name,value)=>{if(value)rows.push([name,value]);};
  add('Size',arr(race.size).map(s=>sizes[s]||s).join(' or '));
  add('Creature type',arr(race.creatureTypes||['humanoid']).map(label).join(' or '));
  add('Movement',movement(race));add('Ability increases',abilityText(race));
  add('Senses',[race.darkvision?'Darkvision '+race.darkvision+' ft':'',race.blindsight?'Blindsight '+race.blindsight+' ft':''].filter(Boolean).join(' · '));
  add('Damage resistance',damage(race.resist));add('Damage immunity',damage(race.immune));add('Damage vulnerability',damage(race.vulnerable));add('Condition immunity',damage(race.conditionImmune));
  for(const [key,title] of [['skillProficiencies','Skills'],['toolProficiencies','Tools'],['languageProficiencies','Languages'],['weaponProficiencies','Weapons'],['armorProficiencies','Armor'],['skillToolLanguageProficiencies','Training choices']])add(title,grants(race[key]));
  if(!race.languageProficiencies&&race.lineage==='VRGR')add('Languages','Common and one other language agreed with your DM.');
  add('Feats',grants(race.feats));add('Spell references',spellNames(race));return rows;
 }
 // One visible entry per race/subrace/variant name. Keep the full catalog for saved IDs.
 // Prefer the later 2014-era reprints; setting-specific names remain distinct.
 const sourcePriority=['MPMM','EGW','MOT','ERLW','GGR','MTF','PSD','PSA','PSK','PSZ','VGM','WBtW','EEPC','TTP','PHB','DMG'];
 function browsableRaces(races){
  const groups=new Map();
  const rank=r=>{const index=sourcePriority.indexOf(r.source);return (r.npcOption?1000:0)+(index<0?100:index);};
  for(const race of races){
   const name=race.name.trim().toLowerCase().replace(/\s+/g,' '),current=groups.get(name);
   if(!current||rank(race)<rank(current)||(rank(race)===rank(current)&&race.source.localeCompare(current.source)<0))groups.set(name,race);
  }
  return [...groups.values()].sort((a,b)=>a.name.localeCompare(b.name)||a.source.localeCompare(b.source));
 }
 function selection(raw){try{const x=JSON.parse(raw||'null');return x&&typeof x.id==='string'&&x.id.length<=300?{id:x.id,name:typeof x.name==='string'?x.name.slice(0,180):''}:null;}catch{return null;}}
 const api={walkingSpeed,movement,abilityText,grants,facts,selection,browsableRaces};
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root)root.FEYWILD_RACE_RULES=api;
})(typeof window==='object'?window:null);
