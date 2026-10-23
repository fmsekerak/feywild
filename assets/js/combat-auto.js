/* Single-class combat progression with explicit manual HP override.
   Keep existing combat fields and D1 keys. Never reset current/temporary HP. */
(() => {
 const byName=(group,name)=>document.querySelector('#'+group+' [name="'+name+'"]');
 const ability=name=>byName('abilities',name);
 const combat=name=>byName('combat',name);
 const level=document.getElementById('characterLevel');
 const rules=window.FEYWILD_LEVEL_RULES;
 const proficiency=byName('combat-defense','proficiencyBonus');
 const perception=document.querySelector('#skills [name="skill-Perception"]');
 const perceptionExpert=document.querySelector('#skills [name="skillExpert-Perception"]');
 const mode=document.getElementById('hpCalculationMode');
 const manual=document.getElementById('manualMaxHp');
 const manualLabel=document.getElementById('manual-hp-label');
 const note=document.getElementById('hp-progression-note');
 const features=document.querySelector('#features [name="features"]');
 const name=(sessionStorage.getItem('feywild-character-name')||'').trim().toLowerCase();
 const sampleScores={
  ruin:{str:10,dex:14,con:14,int:12,wis:16,cha:10},
  crotus:{str:10,dex:14,con:12,int:12,wis:10,cha:16},
  hayden:{str:16,dex:14,con:16,int:10,wis:12,cha:10}
 };
 const scoreModifier=key=>{
  const raw=ability(key)?.value.trim();
  if(!raw||!Number.isFinite(Number(raw)))return null;
  return Math.floor((Number(raw)-10)/2);
 };
 const display=n=>n>=0?'+'+n:String(n);
 for(const key of ['maxHp','hitDice','armorClass','initiative','speed']){
  const input=combat(key);
  if(input){input.readOnly=true;input.title='Calculated from scores and character progression where supported';}
 }
 const passive=byName('combat-defense','passivePerception');
 if(combat('armorClass'))combat('armorClass').title='Calculated from equipped armor, shield, and Dexterity';
 if(passive){passive.readOnly=true;passive.title='10 + Wisdom modifier + Perception proficiency';}
 function toughSelected(){
  try{
   const parsed=JSON.parse(features?.value||'{}');
   return Array.isArray(parsed?.items)&&parsed.items.some(item=>item.category==='Feat'&&item.name==='Tough');
  }catch{return false;}
 }
 function calculate(){
  const rule=rules?.classRule(),levelValue=rules?.atLevel(level?.value);
  const constitution=scoreModifier('con'),dexterity=scoreModifier('dex'),wisdom=scoreModifier('wis');
  const maximum=combat('maxHp'),hitDice=combat('hitDice');
  if(mode&&manualLabel)manualLabel.hidden=mode.value!=='manual';
  if(rule&&levelValue&&hitDice)hitDice.value=levelValue+'d'+rule.die;
  if(mode?.value==='auto'){
   const hp=rules?.hpFor(null,levelValue,ability('con')?.value?.trim()||'',toughSelected());
   if(hp!==null&&hp!==undefined&&maximum)maximum.value=String(hp);
   if(note)note.textContent=rule?'2014 fixed-average HP (+ Constitution each level'+(toughSelected()?', including Tough feat':'')+'). Rolled HP or other bonuses? Choose Manual.':'Custom class: choose Manual HP until its hit die is configured.';
  }else{
   const chosen=Number(manual?.value);
   if(maximum&&manual?.value!==''&&Number.isInteger(chosen)&&chosen>=1&&chosen<=99999)maximum.value=String(chosen);
   if(note)note.textContent=rule?'Manual HP keeps your chosen maximum when you change level. Hit Dice still follow your class.':'Custom class: maximum HP and Hit Dice remain as saved.';
  }
  const armor=window.FEYWILD_EQUIPMENT?.armorClass(dexterity);
  if(combat('armorClass'))combat('armorClass').value=armor?.value===null||armor?.value===undefined?'':String(armor.value);
  if(combat('initiative'))combat('initiative').value=dexterity===null?'':display(dexterity);
  // Selected race supplies base walking speed; conditional movement remains a reference.
  const speed=window.FEYWILD_RACES?window.FEYWILD_RACES.walkingSpeed():30;
  if(combat('speed'))combat('speed').value=speed===null?'':String(speed);
  if(passive)passive.value=wisdom===null?'':String(10+wisdom+((perceptionExpert?.checked?2:perception?.checked?1:0)*Number(proficiency?.value||0)));
  document.dispatchEvent(new Event('feywild:combat-calculated'));
 }
 mode?.addEventListener('change',()=>{
  if(mode.value==='auto'&&!rules?.classRule()){
   mode.value='manual';
   if(note)note.textContent='This homebrew class needs a hit die before HP can be automated.';
  }
  if(mode.value==='manual'&&manual&&!manual.value)manual.value=combat('maxHp')?.value||'';
  calculate();
 });
 manual?.addEventListener('input',calculate);
 document.addEventListener('feywild:profile-loaded',()=>{
  if(name!=='mion'&&sampleScores[name]){
   for(const [key,score] of Object.entries(sampleScores[name])){
    const input=ability(key);
    if(input&&!input.value.trim()){input.value=String(score);input.dispatchEvent(new Event('input',{bubbles:true}));}
   }
  }
  if(!rules?.classRule()&&mode)mode.value='manual';
  calculate();
 });
 document.addEventListener('feywild:level-changed',calculate);
 document.addEventListener('feywild:equipment-changed',calculate);
 document.addEventListener('feywild:race-changed',calculate);
 document.querySelectorAll('#abilities input[name]').forEach(input=>input.addEventListener('input',calculate));
 features?.addEventListener('input',calculate);
 perception?.addEventListener('change',calculate);
 perceptionExpert?.addEventListener('change',calculate);
 proficiency?.addEventListener('input',calculate);
 calculate();
})();
