/* 2014 D&D 5e SRD-inspired summaries, not verbatim rulebook text.
   Descriptions are concise reminders; consult your table's sourcebooks for full mechanics.
   The existing 'features' field stores data and keeps legacy notes. */
(()=>{
 const storage=document.querySelector('#features textarea[name="features"]');
 const host=document.getElementById('features');
 if(!storage||!host)return;
 const libraryBase=[["Feat","Alert","Stay especially ready for danger: gain an initiative bonus and protections against being surprised while conscious."],["Feat","Athlete","Improve Strength or Dexterity and gain improved movement options for climbing, standing, and jumping."],["Feat","Actor","Improve Charisma and become skilled at impersonation, voices, and passing yourself off as others."],["Feat","Charger","Gain an extra offensive option after taking the Dash action."],["Feat","Crossbow Expert","Become more effective with crossbows in close quarters and with certain bonus-action attacks."],["Feat","Defensive Duelist","Use your reaction with a finesse weapon to improve your defense against one melee attack."],["Feat","Dual Wielder","Improve your two-weapon fighting options and gain a defensive benefit while wielding two weapons."],["Feat","Dungeon Delver","Improve your ability to find, avoid, and withstand dungeon traps and hidden threats."],["Feat","Durable","Improve Constitution and increase the minimum healing you receive from spending Hit Dice."],["Feat","Elemental Adept","Choose an elemental damage type and become more effective with spells of that type."],["Feat","Grappler","Gain additional options when grappling creatures."],["Feat","Great Weapon Master","Gain powerful attack options when using heavy melee weapons."],["Feat","Healer","Use a healer's kit to stabilize allies more effectively and restore hit points."],["Feat","Heavily Armored","Gain heavy armor training and improve Strength, if you meet the prerequisite."],["Feat","Heavy Armor Master","Reduce some incoming weapon damage while wearing heavy armor."],["Feat","Inspiring Leader","Bolster allies with a speech, granting temporary hit points after preparation."],["Feat","Keen Mind","Improve Intelligence and your ability to recall directions, time, and information."],["Feat","Lightly Armored","Gain light armor training and improve Strength or Dexterity."],["Feat","Linguist","Learn additional languages and become skilled at creating written ciphers."],["Feat","Lucky","Gain a limited pool of luck points that can influence certain d20 rolls."],["Feat","Mage Slayer","Gain reactions and defenses useful when fighting nearby spellcasters."],["Feat","Magic Initiate","Learn cantrips and a first-level spell from a chosen spellcasting class."],["Feat","Martial Adept","Learn combat maneuvers and gain a superiority die."],["Feat","Medium Armor Master","Improve how you use medium armor, including stealth and Dexterity benefits."],["Feat","Mobile","Increase speed and improve movement around enemies."],["Feat","Moderately Armored","Gain medium armor and shield training and improve Strength or Dexterity."],["Feat","Mounted Combatant","Improve your ability to fight while mounted and protect your mount."],["Feat","Observant","Improve Intelligence or Wisdom and gain heightened awareness and lip-reading ability."],["Feat","Polearm Master","Gain additional attacks and reactions with certain polearms."],["Feat","Resilient","Improve one ability score and gain proficiency in its saving throws."],["Feat","Ritual Caster","Learn to cast selected spells as rituals using a ritual book."],["Feat","Savage Attacker","Reroll melee weapon damage once per turn under certain conditions."],["Feat","Sentinel","Control enemy movement with opportunity attacks and reactions."],["Feat","Sharpshooter","Improve ranged weapon attacks, including range and cover interactions."],["Feat","Shield Master","Gain additional shield-based options for shoving and defense."],["Feat","Skilled","Gain proficiency in three skills or tools."],["Feat","Skulker","Improve hiding and stealthy ranged attacks."],["Feat","Spell Sniper","Increase spell attack range and learn an attack cantrip."],["Feat","Tavern Brawler","Improve unarmed and improvised fighting and gain grappling options."],["Feat","Tough","Increase maximum hit points based on character level."],["Feat","War Caster","Improve spellcasting while fighting and maintaining concentration."],["Feat","Weapon Master","Gain proficiency with additional weapons and improve Strength or Dexterity."],["Class Feature","Rage","Barbarian: enter a powerful combat state with benefits to strength-based fighting and resistance to some damage."],["Class Feature","Reckless Attack","Barbarian: trade defensive safety for advantage on strength-based melee attacks."],["Class Feature","Bardic Inspiration","Bard: grant an ally an inspiration die they can use on certain rolls."],["Class Feature","Jack of All Trades","Bard: add part of your proficiency bonus to eligible ability checks that do not already include it."],["Class Feature","Channel Divinity","Cleric or Paladin: invoke divine power for class- or domain-specific effects."],["Class Feature","Wild Shape","Druid: assume beast forms within the limits of your druid level and subclass."],["Class Feature","Druidic","Druid: know the secret language of druids."],["Class Feature","Action Surge","Fighter: take an additional action on your turn a limited number of times."],["Class Feature","Second Wind","Fighter: regain hit points using a bonus action."],["Class Feature","Ki","Monk: spend ki points on special martial techniques."],["Class Feature","Lay on Hands","Paladin: use a pool of healing power to restore hit points or cure certain conditions."],["Class Feature","Divine Smite","Paladin: expend a spell slot to deal extra radiant damage on a melee weapon hit."],["Class Feature","Favored Enemy","Ranger: gain knowledge and tracking benefits relating to selected enemies."],["Class Feature","Natural Explorer","Ranger: gain travel and exploration benefits in favored terrain."],["Class Feature","Sneak Attack","Rogue: deal extra damage when qualifying attack conditions are met."],["Class Feature","Cunning Action","Rogue: use a bonus action to Dash, Disengage, or Hide."],["Class Feature","Font of Magic","Sorcerer: use sorcery points to fuel flexible spellcasting."],["Class Feature","Metamagic","Sorcerer: modify spells using sorcery points."],["Class Feature","Eldritch Invocations","Warlock: gain selected supernatural abilities."],["Class Feature","Arcane Recovery","Wizard: recover some expended spell slots after a short rest."],["Species Trait","Darkvision","See in dim light and darkness within the range granted by your species."],["Species Trait","Fey Ancestry","Gain protection against magical sleep and certain charm effects."],["Species Trait","Trance","Elf: meditate instead of sleeping in the usual way."],["Species Trait","Lucky (Halfling)","Halfling: reroll certain natural 1s on d20 tests."],["Species Trait","Brave","Halfling: gain an advantage when resisting fear."],["Species Trait","Halfling Nimbleness","Halfling: move through the space of larger creatures."],["Species Trait","Dwarven Resilience","Dwarf: gain defenses against poison."],["Species Trait","Stonecunning","Dwarf: gain special knowledge relating to stonework."],["Species Trait","Gnome Cunning","Gnome: gain benefits on certain mental saving throws against magic."],["Species Trait","Relentless Endurance","Half-orc: sometimes remain at 1 hit point instead of dropping to 0."],["Species Trait","Savage Attacks","Half-orc: deal additional damage on certain critical melee weapon hits."],["Species Trait","Hellish Resistance","Tiefling: resist fire damage."],["Species Trait","Infernal Legacy","Tiefling: gain innate spells as you advance in level."],["Species Trait","Draconic Ancestry","Dragonborn: choose a dragon ancestry that determines breath weapon and resistance."],["Species Trait","Breath Weapon","Dragonborn: use an ancestry-based breath attack with limited uses."],["Species Trait","Damage Resistance","Gain resistance to a damage type determined by your species or ancestry."]].map(([category,name,description])=>({id:category+':'+name,category,name,description}));
 let state={items:[],notes:''};
 // Exact feat selection from the uploaded feats.json (PHB, XGE, TCE).
 // Keep existing original summaries; supplement XGE/TCE with original concise reminders.
 const allowedFeats=[["Actor","PHB"],["Alert","PHB"],["Athlete","PHB"],["Charger","PHB"],["Crossbow Expert","PHB"],["Defensive Duelist","PHB"],["Dual Wielder","PHB"],["Dungeon Delver","PHB"],["Durable","PHB"],["Elemental Adept","PHB"],["Grappler","PHB"],["Great Weapon Master","PHB"],["Healer","PHB"],["Heavily Armored","PHB"],["Heavy Armor Master","PHB"],["Inspiring Leader","PHB"],["Keen Mind","PHB"],["Lightly Armored","PHB"],["Linguist","PHB"],["Lucky","PHB"],["Mage Slayer","PHB"],["Magic Initiate","PHB"],["Martial Adept","PHB"],["Medium Armor Master","PHB"],["Mobile","PHB"],["Moderately Armored","PHB"],["Mounted Combatant","PHB"],["Observant","PHB"],["Polearm Master","PHB"],["Resilient","PHB"],["Ritual Caster","PHB"],["Savage Attacker","PHB"],["Sentinel","PHB"],["Sharpshooter","PHB"],["Shield Master","PHB"],["Skilled","PHB"],["Skulker","PHB"],["Spell Sniper","PHB"],["Tavern Brawler","PHB"],["Tough","PHB"],["War Caster","PHB"],["Weapon Master","PHB"],["Bountiful Luck","XGE"],["Dragon Fear","XGE"],["Dragon Hide","XGE"],["Drow High Magic","XGE"],["Dwarven Fortitude","XGE"],["Elven Accuracy","XGE"],["Fade Away","XGE"],["Fey Teleportation","XGE"],["Flames of Phlegethos","XGE"],["Infernal Constitution","XGE"],["Orcish Fury","XGE"],["Prodigy","XGE"],["Second Chance","XGE"],["Squat Nimbleness","XGE"],["Wood Elf Magic","XGE"],["Artificer Initiate","TCE"],["Chef","TCE"],["Crusher","TCE"],["Eldritch Adept","TCE"],["Fey Touched","TCE"],["Fighting Initiate","TCE"],["Gunner","TCE"],["Metamagic Adept","TCE"],["Piercer","TCE"],["Poisoner","TCE"],["Shadow Touched","TCE"],["Skill Expert","TCE"],["Slasher","TCE"],["Telekinetic","TCE"],["Telepathic","TCE"]];
 const existingByName=new Map(libraryBase.filter(x=>x.category==='Feat').map(x=>[x.name.toLowerCase(),x]));
 const supplementalFeatSummaries={"Bountiful Luck":"Halfling prerequisite. Use your reaction to let a nearby ally reroll a natural 1 on an attack, check, or save; briefly lose access to your own halfling Lucky trait.","Dragon Fear":"Dragonborn prerequisite. Increase Strength, Constitution, or Charisma; expend a breath weapon use to unleash a roar that can frighten nearby creatures.","Dragon Hide":"Dragonborn prerequisite. Improve Strength, Constitution, or Charisma; develop natural armor and claws usable for unarmed attacks.","Drow High Magic":"Drow prerequisite. Gain additional innate magic, including detect magic, levitate, and dispel magic, with limits on how often some spells can be cast.","Dwarven Fortitude":"Dwarf prerequisite. Increase Constitution and spend a Hit Die to regain hit points when taking the Dodge action.","Elven Accuracy":"Elf or half-elf prerequisite. Increase Dexterity, Intelligence, Wisdom, or Charisma; improve the reliability of qualifying attacks made with advantage.","Fade Away":"Gnome prerequisite. Increase Dexterity or Intelligence and briefly turn invisible as a reaction after taking damage.","Fey Teleportation":"High elf prerequisite. Increase Intelligence or Charisma, learn Sylvan, and gain a limited-use misty step teleport.","Flames of Phlegethos":"Tiefling prerequisite. Increase Intelligence or Charisma; enhance fire spell damage rolls and briefly surround yourself with retaliatory flames when casting fire spells.","Infernal Constitution":"Tiefling prerequisite. Increase Constitution and gain resistance to cold and poison damage, plus improved defenses against being poisoned.","Orcish Fury":"Half-orc prerequisite. Increase Strength or Constitution; add extra damage to a weapon hit occasionally and gain a reaction attack after using Relentless Endurance.","Prodigy":"Human, half-elf, or half-orc prerequisite. Learn a skill, a tool, and a language, and gain expertise in one proficient skill.","Second Chance":"Halfling prerequisite. Increase Dexterity, Constitution, or Charisma; use your reaction to force an attacker that hits you to reroll its attack.","Squat Nimbleness":"Dwarf or Small race prerequisite. Increase Strength or Dexterity, improve speed and Acrobatics or Athletics, and become harder to keep grappled.","Wood Elf Magic":"Wood elf prerequisite. Learn a druid cantrip and gain limited-use longstrider and pass without trace spells.","Artificer Initiate":"Learn an artificer cantrip and a first-level artificer spell; gain a tool proficiency and a way to use those tools as a spellcasting focus.","Chef":"Increase Constitution or Wisdom, gain cook's utensils proficiency, and prepare food that improves short-rest healing or grants temporary hit points.","Crusher":"Increase Strength or Constitution; move a creature when you deal bludgeoning damage and help allies exploit your critical bludgeoning hits.","Eldritch Adept":"Gain one eligible warlock eldritch invocation, subject to spellcasting and invocation prerequisites.","Fey Touched":"Increase Intelligence, Wisdom, or Charisma; learn misty step and one first-level divination or enchantment spell with limited free casting.","Fighting Initiate":"Prerequisite: martial weapon proficiency. Learn one fighter Fighting Style, with an option to replace it at certain levels.","Gunner":"Increase Dexterity, gain firearm proficiency, ignore firearm loading, and improve ranged attacks while enemies are nearby.","Metamagic Adept":"Prerequisite: Spellcasting or Pact Magic. Learn two sorcerer Metamagic options and gain a small pool of sorcery points for them.","Piercer":"Increase Strength or Dexterity; improve piercing damage rerolls and add extra damage on critical piercing hits.","Poisoner":"Improve your use of poison: bypass some poison resistance, apply poison quickly, and craft limited-use poisons with suitable supplies.","Shadow Touched":"Increase Intelligence, Wisdom, or Charisma; learn invisibility and one first-level illusion or necromancy spell with limited free casting.","Skill Expert":"Increase one ability score, gain proficiency in one skill, and gain expertise in a skill you are proficient with.","Slasher":"Increase Strength or Dexterity; reduce an enemy's speed when you deal slashing damage and hinder attacks after critical slashing hits.","Telekinetic":"Increase Intelligence, Wisdom, or Charisma; gain an enhanced, subtle mage hand and a bonus-action telekinetic shove.","Telepathic":"Increase Intelligence, Wisdom, or Charisma; communicate mentally with nearby creatures and gain limited-use detect thoughts."};
 const feats=allowedFeats.map(([name,source])=>{
  const existing=existingByName.get(name.toLowerCase());
  return existing||{id:'Feat:'+name,category:'Feat',name,description:supplementalFeatSummaries[name]||'Consult the sourcebook for this feat’s description and prerequisites.'};
 });
 const library=[...feats,...libraryBase.filter(x=>x.category!=='Feat')];
 const featAbilityOptions={"Athlete":["str","dex"],"Heavily Armored":["str"],"Heavy Armor Master":["str"],"Keen Mind":["int"],"Lightly Armored":["str","dex"],"Linguist":["int"],"Moderately Armored":["str","dex"],"Observant":["int","wis"],"Resilient":["str","dex","con","int","wis","cha"],"Tavern Brawler":["str","con"],"Weapon Master":["str","dex"],"Dragon Fear":["str","con","cha"],"Dragon Hide":["str","con","cha"],"Dwarven Fortitude":["con"],"Elven Accuracy":["dex","int","wis","cha"],"Fade Away":["dex","int"],"Fey Teleportation":["int","cha"],"Flames of Phlegethos":["int","cha"],"Infernal Constitution":["con"],"Orcish Fury":["str","con"],"Second Chance":["dex","con","cha"],"Squat Nimbleness":["str","dex"],"Chef":["con","wis"],"Crusher":["str","con"],"Fey Touched":["int","wis","cha"],"Gunner":["dex"],"Piercer":["str","dex"],"Shadow Touched":["int","wis","cha"],"Skill Expert":["str","dex","con","int","wis","cha"],"Slasher":["str","dex"],"Telekinetic":["int","wis","cha"],"Telepathic":["int","wis","cha"]};
 const abilityLabels={str:'Strength',dex:'Dexterity',con:'Constitution',int:'Intelligence',wis:'Wisdom',cha:'Charisma'};
 // Applied bonuses live in the same saved feat item as their chosen ability.
 // Scores already contain these bonuses on load, so never reapply them then.
 function changeAbility(ability,delta){
  if(!ability||!delta)return true;
  const input=document.querySelector('#abilities input[name="'+ability+'"]');
  if(!input||input.value.trim()===''||!Number.isFinite(Number(input.value)))return false;
  input.value=String(Number(input.value)+delta);
  input.dispatchEvent(new Event('input',{bubbles:true}));
  input.dispatchEvent(new Event('change',{bubbles:true}));
  return true;
 }
 const categories=['All','Feat','Class Feature','Species Trait'];
 const ui=document.createElement('div');ui.className='feature-library';host.prepend(ui);
 const unique=items=>(Array.isArray(items)?items:[]).filter(x=>x&&typeof x==='object'&&typeof x.name==='string').map(x=>({id:String(x.id||''),name:x.name,category:String(x.category||'Custom'),description:String(x.description||''),abilityChoice:typeof x.abilityChoice==='string'?x.abilityChoice:'',abilityApplied:x.abilityApplied===true})).filter((x,i,a)=>a.findIndex(y=>y.id&&x.id?y.id===x.id:y.name===x.name&&y.category===x.category)===i);
 function parse(raw){
  if(!raw.trim())return {items:[],notes:''};
  try{
   const parsed=JSON.parse(raw);
   if(parsed&&parsed.version===1&&Array.isArray(parsed.items))return {items:unique(parsed.items),notes:typeof parsed.notes==='string'?parsed.notes:''};
  }catch{}
  return {items:[],notes:raw}; // Preserve pre-picker text verbatim.
 }
 const save=()=>{storage.value=JSON.stringify({version:1,items:state.items,notes:state.notes});storage.dispatchEvent(new Event('input',{bubbles:true}));};
 function el(tag,cls,content){const node=document.createElement(tag);if(cls)node.className=cls;if(content!==undefined)node.textContent=content;return node;}
 function render(){
  ui.replaceChildren();
  for(const category of ['Feat','Class Feature','Species Trait','Custom']){
   const chosen=state.items.filter(item=>item.category===category);
   if(category==='Custom'&&!chosen.length)continue; // Retain saved homebrew cards without allowing new entries.
   const section=el('section','feature-group');
   const heading=el('div','feature-group-heading');
   heading.append(el('strong','',category==='Feat'?'Feats':category==='Class Feature'?'Class Features':category==='Species Trait'?'Species Traits':'Previously Saved Custom Features'));
   section.append(heading);
   const selected=el('div','feature-selected');
   if(!chosen.length)selected.append(el('span','feature-empty','None selected yet'));
   for(const item of chosen){
    const card=el('details','feature-card');
    const summary=el('summary','feature-card-summary');
    summary.append(el('span','feature-card-title',item.name));card.append(summary);
    const content=el('div','feature-card-body');
    content.append(el('p','',item.description||'No description provided.'));
    if(item.category==='Feat'&&featAbilityOptions[item.name]){
     const options=featAbilityOptions[item.name];
     const chooser=el('div','feat-ability-choice');
     chooser.append(el('strong','', 'Ability score increase (+1)'));
     const buttons=el('div','feat-ability-buttons');
     for(const ability of options){
      const button=el('button','feat-ability-button',abilityLabels[ability]);button.type='button';
      const selected=item.abilityApplied&&item.abilityChoice===ability;
      button.classList.toggle('selected',selected);button.setAttribute('aria-pressed',String(selected));
      button.addEventListener('click',()=>{
       if(selected)return;
       if(item.abilityApplied&&!changeAbility(item.abilityChoice,-1)){
        alert('Enter a valid ability score before changing this feat bonus.');return;
       }
       if(!changeAbility(ability,1)){
        if(item.abilityApplied)changeAbility(item.abilityChoice,1);
        alert('Enter a valid '+abilityLabels[ability]+' score first.');return;
       }
       item.abilityChoice=ability;item.abilityApplied=true;save();render();
      });buttons.append(button);
     }
     chooser.append(buttons);
     if(!item.abilityApplied)chooser.append(el('small','','Choose an ability to apply this feat’s +1 bonus.'));
     content.append(chooser);
    }
    const remove=el('button','feature-remove','Remove');remove.type='button';remove.setAttribute('aria-label','Remove '+item.name);
    remove.addEventListener('click',()=>{
     if(item.abilityApplied&&!changeAbility(item.abilityChoice,-1)){
      alert('Enter a valid ability score before removing this feat so its bonus can be reversed.');return;
     }
     state.items=state.items.filter(x=>x!==item);save();render();
    });
    content.append(remove);card.append(content);selected.append(card);
   }
   if(category!=='Custom'){
    const add=el('button','feature-add','✧ +');add.type='button';add.title='Add '+category.toLowerCase();add.setAttribute('aria-label','Add '+category.toLowerCase());add.setAttribute('aria-expanded','false');
    heading.append(add);
    const picker=el('div','feature-picker');picker.hidden=true;
    const search=el('input','feature-search');search.type='search';search.placeholder='Search '+(category==='Feat'?'feats':category==='Class Feature'?'class features':'species traits')+'…';search.setAttribute('aria-label','Search '+category.toLowerCase());
    const results=el('div','feature-results');results.setAttribute('aria-live','polite');
    const updateResults=()=>{
     results.replaceChildren();
     const query=search.value.trim().toLowerCase();
     const matches=library.filter(x=>x.category===category&&(x.name+' '+x.description).toLowerCase().includes(query));
     if(!matches.length)results.append(el('p','feature-empty','No matching features.'));
     for(const entry of matches){
      const option=el('button','feature-result');option.type='button';
      const already=state.items.some(x=>x.id===entry.id);option.disabled=already;
      option.append(el('strong','',entry.name),el('small','',already?'Already added':entry.category),el('span','',entry.description));
      option.addEventListener('click',()=>{state.items.push({...entry});save();render();});
      results.append(option);
     }
    };
    search.addEventListener('input',updateResults);
    picker.append(search,results);
    add.addEventListener('click',()=>{picker.hidden=!picker.hidden;add.setAttribute('aria-expanded',String(!picker.hidden));if(!picker.hidden){updateResults();search.focus();}});
    section.append(selected,picker);
   }else section.append(selected);
   ui.append(section);
  }
  // Keep previously saved notes in state/storage, but do not show the notes editor.
 }
 document.addEventListener('feywild:profile-loaded',()=>{state=parse(storage.value);render();});
 state=parse(storage.value);render();
})();
