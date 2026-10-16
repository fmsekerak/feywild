/* Compact proficiency and language picker, persisted in the existing D1 proficiencies field. */
(()=>{
 const field=document.querySelector('#proficiencies textarea[name="proficiencies"]');
 const root=document.getElementById('proficiencies');
 if(!field||!root)return;
 const skills=['Acrobatics','Animal Handling','Arcana','Athletics','Deception','History','Insight','Intimidation','Investigation','Medicine','Nature','Perception','Performance','Persuasion','Religion','Sleight of Hand','Stealth','Survival'];
 const tools=["Alchemist's Supplies","Brewer's Supplies","Calligrapher's Supplies","Carpenter's Tools","Cartographer's Tools","Cobbler's Tools","Cook's Utensils","Disguise Kit","Forgery Kit","Glassblower's Tools","Herbalism Kit","Jeweler's Tools","Leatherworker's Tools","Mason's Tools","Navigator's Tools","Painter's Supplies","Poisoner's Kit","Potter's Tools","Smith's Tools","Thieves' Tools","Tinker's Tools","Weaver's Tools","Woodcarver's Tools","Vehicles (Land)","Vehicles (Water)"];
 const instruments=['Bagpipes','Drum','Dulcimer','Flute','Lute','Lyre','Horn','Pan Flute','Shawm','Viol'];
 const combat=['Light Armor','Medium Armor','Heavy Armor','Shields','Simple Weapons','Martial Weapons','Club','Dagger','Dart','Handaxe','Javelin','Light Crossbow','Longbow','Longsword','Quarterstaff','Rapier','Scimitar','Shortbow','Shortsword','Sling','Spear','Warhammer'];
 const languages=['Common','Dwarvish','Elvish','Giant','Gnomish','Goblin','Halfling','Orc','Abyssal','Celestial','Draconic','Deep Speech','Infernal','Primordial','Sylvan','Undercommon','Druidic','Thieves’ Cant'];
 const options={proficiencies:[...skills,...tools,...instruments,...combat],languages};
 let state={proficiencies:[],languages:[]};
 const shell=document.createElement('div');shell.className='proficiency-picker';
 root.prepend(shell);
 const normalize=arr=>[...new Set((Array.isArray(arr)?arr:[]).filter(x=>typeof x==='string').map(x=>x.trim()).filter(Boolean))];
 function parse(raw){
  if(!raw.trim())return {proficiencies:[],languages:[]};
  try{
   const data=JSON.parse(raw);
   if(data&&typeof data==='object'&&!Array.isArray(data))return {proficiencies:normalize(data.proficiencies),languages:normalize(data.languages)};
  }catch{}
  // Older freeform text remains visible and editable as proficiency entries.
  return {proficiencies:normalize(raw.split(/[,;\n]+/)),languages:[]};
 }
 // Skill selections and the first proficiency gems share the existing saved
 // skill-* checkboxes. Never touch expertise or unrelated proficiencies.
 function syncSkill(name,enabled){
  if(!skills.includes(name))return;
  const input=[...document.querySelectorAll('#skills input.skill-rank-storage')].find(el=>el.name==='skill-'+name);
  if(!input||input.checked===enabled)return;
  input.checked=enabled;
  input.dispatchEvent(new Event('change',{bubbles:true}));
  document.dispatchEvent(new Event('feywild:skill-proficiency-synced'));
 }
 function syncSelectedSkills(){
  for(const name of skills){
   if(state.proficiencies.some(x=>x.toLowerCase()===name.toLowerCase()))syncSkill(name,true);
  }
 }
 function persist(){field.value=JSON.stringify(state);field.dispatchEvent(new Event('input',{bubbles:true}));}

 function render(){
  shell.replaceChildren();
  for(const [kind,title] of [['proficiencies','Proficiencies'],['languages','Languages']]){
   const section=document.createElement('section');section.className='proficiency-picker-group';
   const head=document.createElement('div');head.className='proficiency-picker-heading';
   const label=document.createElement('strong');label.textContent=title+':';
   const add=document.createElement('button');add.type='button';add.className='proficiency-add';add.textContent='✧ +';add.title='Add '+title.toLowerCase();add.setAttribute('aria-label','Add '+title.toLowerCase());
   head.append(label);section.append(head);
   const list=document.createElement('div');list.className='proficiency-tags';
   if(!state[kind].length){const empty=document.createElement('span');empty.className='proficiency-empty';empty.textContent='None selected yet';list.append(empty);}
   for(const item of state[kind]){
    const chip=document.createElement('span');chip.className='proficiency-tag';
    const name=document.createElement('span');name.textContent=item;
    const remove=document.createElement('button');remove.type='button';remove.textContent='×';remove.title='Remove '+item;remove.setAttribute('aria-label','Remove '+item);
    remove.addEventListener('click',()=>{state[kind]=state[kind].filter(x=>x!==item);if(kind==='proficiencies')syncSkill(item,false);persist();render();});
    chip.append(name,remove);list.append(chip);
   }
   list.append(add);section.append(list);
   const picker=document.createElement('div');picker.className='proficiency-popover';picker.hidden=true;
   const select=document.createElement('select');select.setAttribute('aria-label','Choose '+title.toLowerCase());
   const prompt=document.createElement('option');prompt.value='';prompt.textContent='Choose from list…';select.append(prompt);
   for(const option of options[kind]){const el=document.createElement('option');el.value=option;el.textContent=option;select.append(el);}
   const actions=document.createElement('div');actions.className='proficiency-popover-actions';
   const confirm=document.createElement('button');confirm.type='button';confirm.textContent='Add selection';
   const cancel=document.createElement('button');cancel.type='button';cancel.textContent='Cancel';
   const choose=()=>{
    const item=select.value.trim();
    if(!item){select.focus();return;}
    if(!state[kind].some(x=>x.toLowerCase()===item.toLowerCase()))state[kind].push(item);
    if(kind==='proficiencies')syncSkill(item,true);
    persist();render();
   };
   confirm.addEventListener('click',choose);
   cancel.addEventListener('click',()=>{picker.hidden=true;add.setAttribute('aria-expanded','false');add.focus();});
   actions.append(confirm,cancel);picker.append(select,actions);section.append(picker);
   add.setAttribute('aria-expanded','false');
   add.addEventListener('click',()=>{picker.hidden=!picker.hidden;add.setAttribute('aria-expanded',String(!picker.hidden));if(!picker.hidden)select.focus();});
   shell.append(section);
  }
 }
 function refresh(){state=parse(field.value);syncSelectedSkills();render();}
 document.addEventListener('feywild:profile-loaded',refresh);
 refresh();
})();
