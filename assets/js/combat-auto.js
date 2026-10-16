/* Level-three campaign combat automation.
   Uses existing saved scores; sample scores only fill empty fields for non-Mion characters.
   Armor/shields and class features are intentionally excluded until equipment is modeled. */
(() => {
 const byName=(group,name)=>document.querySelector('#'+group+' [name="'+name+'"]');
 const ability=name=>byName('abilities',name);
 const combat=name=>byName('combat',name);
 const level=combat('characterLevel');
 const proficiency=byName('combat-defense','proficiencyBonus');
 const perception=document.querySelector('#skills [name="skill-Perception"]');
 const name=(sessionStorage.getItem('feywild-character-name')||'').trim().toLowerCase();
 const classDice={mion:8,ruin:8,crotus:8,hayden:10};
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
 const autoFields=['maxHp','hitDice','armorClass','initiative','speed'];
 autoFields.forEach(key=>{
   const input=combat(key);
   if(input){input.readOnly=true;input.title='Automatically calculated for the level-3 campaign; equipment modifiers are not yet included';}
 });
 if(level){level.readOnly=true;level.title='Campaign level is currently set to 3';}
 const passive=byName('combat-defense','passivePerception');
 if(passive){passive.readOnly=true;passive.title='10 + Wisdom modifier + Perception proficiency (if selected)';}
 function calculate(){
   const hitDie=classDice[name];
   const constitution=scoreModifier('con'),dexterity=scoreModifier('dex'),wisdom=scoreModifier('wis');
   if(level&&level.value!=='3'){level.value='3';level.dispatchEvent(new Event('input',{bubbles:true}));}
   const levelDisplay=document.getElementById('characterLevelDisplay');
   if(levelDisplay)levelDisplay.textContent='3';
   if(hitDie){
     combat('hitDice').value='3d'+hitDie;
     combat('maxHp').value=constitution===null?'':String(Math.max(1,3*(hitDie+constitution)));
   }
   combat('armorClass').value=dexterity===null?'':String(10+dexterity);
   combat('initiative').value=dexterity===null?'':display(dexterity);
   // Temporary campaign walking speed; update once racial speeds are configured.
   combat('speed').value='30';
   if(passive)passive.value=wisdom===null?'':String(10+wisdom+(perception?.checked?Number(proficiency?.value||0):0));
   document.dispatchEvent(new Event('feywild:combat-calculated'));
 }
 document.addEventListener('feywild:profile-loaded',()=>{
   if(name!=='mion'&&sampleScores[name]){
     for(const [key,score] of Object.entries(sampleScores[name])){
       const input=ability(key);
       if(input&&!input.value.trim()){input.value=String(score);input.dispatchEvent(new Event('input',{bubbles:true}));}
     }
   }
   calculate();
 });
 document.querySelectorAll('#abilities input[name]').forEach(input=>input.addEventListener('input',calculate));
 perception?.addEventListener('change',calculate);
 proficiency?.addEventListener('input',calculate);
 calculate();
})();
