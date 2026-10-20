/* Session tools use the existing named-input profile save, never a second database write. */
(() => {
 'use strict';
 const R=window.FEYWILD_SHEET_RULES,L=window.FEYWILD_LEVEL_RULES;
 const $=id=>document.getElementById(id),named=name=>[...document.querySelectorAll('[name]')].find(el=>el.name===name);
 const make=(tag,text,cls)=>{const el=document.createElement(tag);if(text!==undefined)el.textContent=text;if(cls)el.className=cls;return el;};
 const button=(text,action,label)=>{const b=make('button',text);b.type='button';if(label)b.setAttribute('aria-label',label);b.addEventListener('click',action);return b;};
 const input=(type,value)=>{const el=make('input');el.type=type;el.value=value??'';return el;};
 const label=(text,el)=>{const wrap=make('label',text);if(!el.hasAttribute('aria-label'))el.setAttribute('aria-label',text.trim());wrap.append(el);return wrap;};
 const number=(value,min,max)=>{const el=input('number',value);el.min=String(min);el.max=String(max);el.step='1';return el;};
 const select=(options,value)=>{const el=make('select');for(const [key,text]of options)el.add(new Option(text,key));el.value=value;return el;};
 const store=make('input');store.type='hidden';store.name='sheetSessionTools';store.id='sheetSessionTools';$('stats').append(store);
 let data={version:1,conditions:[],exhaustion:0,resources:{},customResources:[],attacks:[],hitDiceSpent:0};
 let loaded=false;
 const emit=el=>el.dispatchEvent(new Event('input',{bubbles:true}));
 const inspiration=$('inspiration2014');
 function inspirationPoints(){
  if(inspiration.value==='true')return 1;
  if(inspiration.value==='false')return 0;
  return R.integer(inspiration.value,0,99999)??0;
 }
 function renderInspiration(){
  const count=inspirationPoints();inspiration.value=String(count);
  $('inspiration-count').textContent=String(count);
  $('inspiration-count').classList.toggle('lit',count>0);
  $('inspiration-minus').disabled=count===0;
  $('inspiration-plus').disabled=count===99999;
 }
 function changeInspiration(delta){
  if(!loaded)return;
  inspiration.value=String(Math.max(0,Math.min(99999,inspirationPoints()+delta)));
  renderInspiration();emit(inspiration);
 }
 $('inspiration-minus').addEventListener('click',()=>changeInspiration(-1));
 $('inspiration-plus').addEventListener('click',()=>changeInspiration(1));

 function persist(){store.value=JSON.stringify(data);emit(store);}
 const level=()=>L.atLevel($('characterLevel').value),className=()=>L.getClass();
 const score=key=>named(key)?.value??'';
 const scores=()=>Object.fromEntries(['str','dex','con','int','wis','cha'].map(key=>[key,score(key)]));
 const set=(name,value)=>{const el=named(name);if(el){el.value=String(value);emit(el);}};
 function read(){
  try{const parsed=JSON.parse(store.value||'{}');if(parsed&&typeof parsed==='object'&&!Array.isArray(parsed))data={...data,...parsed};}catch{}
  data.conditions=Array.isArray(data.conditions)?data.conditions.filter(x=>typeof x==='string'):[];
  data.exhaustion=R.integer(data.exhaustion,0,6)??0;
  data.resources=data.resources&&typeof data.resources==='object'&&!Array.isArray(data.resources)?data.resources:{};
  data.customResources=Array.isArray(data.customResources)?data.customResources.filter(x=>x&&typeof x==='object'&&typeof x.id==='string'):[];
  data.attacks=Array.isArray(data.attacks)?data.attacks.filter(x=>x&&typeof x==='object'):[];
  data.hitDiceSpent=R.integer(data.hitDiceSpent,0,99)??0;
 }
 function currentResources(){return [...R.classResources(className(),level(),score('cha')),...data.customResources];}
 function resourceSpent(id){return R.integer(data.resources[id]?.spent,0,99999)??0;}
 function resourceRemaining(resource){return R.remaining(resource.max,resourceSpent(resource.id));}
 function resourceChange(resource,delta){
  const previous=resourceRemaining(resource);if(previous===null)return;
  const next=Math.max(0,Math.min(resource.max,previous+delta));
  data.resources[resource.id]={...data.resources[resource.id],spent:resource.max-next};persist();renderResources();
 }
 // Health actions keep all class calculations and manual maximum settings intact.
 function changeHP(kind){
  try{
   const next=R.hpChange(named('currentHp').value,named('temporaryHp').value,named('maxHp').value,$('sheet-hp-amount').value,kind);
   const was=R.integer(named('currentHp').value);
   set('currentHp',next.current);set('temporaryHp',next.temporary);
   if(was===0&&next.current>0)clearDeathSaves();
   $('sheet-hp-status').textContent=(kind==='heal'?'Healing applied':'Damage applied')+': '+next.current+' HP, '+next.temporary+' temporary HP. Select Save Character.';
  }catch(e){$('sheet-hp-status').textContent=e.message;}
 }
 function clearDeathSaves(){set('deathSaves',JSON.stringify({successes:0,failures:0}));document.dispatchEvent(new Event('feywild:death-saves-changed'));}
 $('sheet-damage').addEventListener('click',()=>changeHP('damage'));
 $('sheet-heal').addEventListener('click',()=>changeHP('heal'));
 // Conditions remain reminders: no hidden modifiers are applied to base statistics.
 function renderConditions(){
  const root=$('sheet-conditions');root.replaceChildren();
  const choose=select([['','Add condition…'],...Object.keys(R.CONDITIONS).map(x=>[x,x])],'');
  choose.setAttribute('aria-label','Add condition');
  choose.addEventListener('change',()=>{if(choose.value&&!data.conditions.includes(choose.value))data.conditions.push(choose.value);persist();renderConditions();});
  root.append(choose);
  for(const name of data.conditions){
   const row=make('div',undefined,'sheet-condition');const details=make('details');details.append(make('summary',name),make('p',R.CONDITIONS[name]||'Saved condition; consult the DM for its effects.'));
   row.append(details,button('×',()=>{data.conditions=data.conditions.filter(x=>x!==name);persist();renderConditions();},'Remove '+name));root.append(row);
  }
  const exhaustion=select(R.EXHAUSTION.map((text,i)=>[String(i),i+' — '+text]),String(data.exhaustion));
  exhaustion.addEventListener('change',()=>{data.exhaustion=Number(exhaustion.value);persist();renderConditions();});
  root.append(label('Exhaustion ',exhaustion));
  if(data.exhaustion)root.append(make('p','Cumulative effects: '+R.EXHAUSTION.slice(1,data.exhaustion+1).join('; ')+'.','combat-hint'));
  root.append(make('p','2014 rules reminders. Apply advantage, disadvantage, speed and maximum-HP effects during play; base stats and concentration are not changed automatically.','combat-hint'));
  const source=make('details');source.append(make('summary','Rules source'));
  const attribution=make('p','This work includes material taken from the System Reference Document 5.1 (“SRD 5.1”) by Wizards of the Coast LLC, available at https://dnd.wizards.com/resources/systems-reference-document. The SRD 5.1 is licensed under the Creative Commons Attribution 4.0 International License available at https://creativecommons.org/licenses/by/4.0/legalcode. These are condensed 2014 rules reminders.');
  const link=make('a','Read the 2014 rules');link.href='https://www.dndbeyond.com/sources/dnd/basic-rules-2014';link.target='_blank';link.rel='noopener noreferrer';source.append(attribution,link);root.append(source);
 }
 function renderResources(){
  const root=$('sheet-resources');root.replaceChildren();
  for(const resource of currentResources()){
   const card=make('div',undefined,'sheet-resource');card.append(make('strong',resource.name));
   const row=make('div',undefined,'sheet-inline');const left=resourceRemaining(resource);
   row.append(make('output',left===null?'Unlimited':left+' / '+resource.max+' remaining'));
   if(left!==null)row.append(button('−',()=>resourceChange(resource,-1),'Spend '+resource.name),button('+',()=>resourceChange(resource,1),'Restore '+resource.name));
   card.append(row,make('p',resource.detail||'Refresh: '+(resource.recharge==='short'?'short or long rest':resource.recharge==='long'?'long rest':'manual'),'combat-hint'));
   if(data.customResources.includes(resource)){
    const max=number(resource.max,0,999);max.setAttribute('aria-label',resource.name+' maximum');
    max.addEventListener('change',()=>{const n=R.integer(max.value,0,999);if(n===null){max.value=resource.max;return;}resource.max=n;persist();renderResources();});
    const recharge=select([['short','Short / long rest'],['long','Long rest'],['manual','Manual']],resource.recharge);
    recharge.addEventListener('change',()=>{resource.recharge=recharge.value;persist();});
    card.append(label('Maximum ',max),label('Refresh ',recharge),button('Remove',()=>{if(!confirm('Remove '+resource.name+' tracker?'))return;data.customResources=data.customResources.filter(x=>x!==resource);persist();renderResources();}));
   }
   root.append(card);
  }
  const hd=make('div',undefined,'sheet-resource');const die=L.classRule()?.die,l=level();
  const spent=number(Math.min(data.hitDiceSpent,l??0),0,l??20);spent.setAttribute('aria-label','Spent Hit Dice');
  spent.addEventListener('change',()=>{const n=R.integer(spent.value,0,l);if(n===null){spent.value=Math.min(data.hitDiceSpent,l);return;}data.hitDiceSpent=n;persist();renderResources();});
  hd.append(make('strong','Hit Dice'),make('p',l&&die?Math.max(0,l-data.hitDiceSpent)+' / '+l+'d'+die+' available':'Class Hit Die unavailable'),label('Spent ',spent));root.append(hd);
  const add=make('details');add.append(make('summary','+ Add a resource'));
  const title=input('text','');title.maxLength=80;const maximum=number(1,0,999),recharge=select([['long','Long rest'],['short','Short / long rest'],['manual','Manual']],'long');
  const error=make('p');error.setAttribute('role','status');
  add.append(label('Name ',title),label('Maximum uses ',maximum),label('Refresh ',recharge),button('Add tracker',()=>{
   const max=R.integer(maximum.value,0,999);if(!title.value.trim()||max===null){error.textContent='Enter a name and a whole-number maximum from 0 to 999.';return;}
   data.customResources.push({id:'custom-'+crypto.randomUUID(),name:title.value.trim(),max,recharge:recharge.value});persist();renderResources();
  }),error);root.append(add);
  root.append(make('p','Built-in counters follow class and level. Add other feature trackers using their listed maximum and recharge. Spent uses stay spent when level or abilities change.','combat-hint'));
 }
 // Keep the original attacks text as notes; structured cards use a separate saved key.
 const attackRoot=make('div',undefined,'sheet-tools');attackRoot.id='sheet-attacks';$('attacks').prepend(attackRoot);
 const attackOutputs=[];
 function refreshAttackBonuses(){
  for(const {card,out} of attackOutputs){
   const calc=R.attack(card,scores(),named('proficiencyBonus').value);
   out.textContent=calc?'To hit '+R.signed(calc.hit)+' · Damage '+(card.damageDice||'—')+(calc.damage?R.signed(calc.damage):'')+(card.damageType?' '+card.damageType:''):'Enter the associated ability score and bonuses to calculate this attack.';
   out.title=calc?card.ability.toUpperCase()+' '+R.signed(calc.mod)+(card.proficient?' + proficiency '+calc.prof:'')+' + attack bonus '+card.hitBonus+' = '+R.signed(calc.hit):'';
  }
 }
 function renderAttacks(){
  attackRoot.replaceChildren();attackOutputs.length=0;
  for(const card of data.attacks){
   const box=make('article',undefined,'sheet-attack');const heading=make('strong',card.name||'Attack'),out=make('output');out.className='sheet-attack-result';
   const detail=make('details');detail.append(make('summary','Edit attack'));
   const name=input('text',card.name);name.maxLength=80;
   name.addEventListener('input',()=>{card.name=name.value;heading.textContent=name.value||'Attack';persist();});
   const ability=select(['str','dex','con','int','wis','cha'].map(x=>[x,x.toUpperCase()]),card.ability||'str');
   ability.addEventListener('change',()=>{card.ability=ability.value;persist();refreshAttackBonuses();});
   const prof=input('checkbox');prof.checked=!!card.proficient;prof.addEventListener('change',()=>{card.proficient=prof.checked;persist();refreshAttackBonuses();});
   const addMod=input('checkbox');addMod.checked=!!card.addAbilityDamage;addMod.addEventListener('change',()=>{card.addAbilityDamage=addMod.checked;persist();refreshAttackBonuses();});
   detail.append(label('Name ',name),label('Ability ',ability),label('Proficient ',prof),label('Add ability to damage ',addMod));
   for(const [key,text,numeric]of [['damageDice','Damage dice (e.g. 1d8)',false],['damageType','Damage type',false],['hitBonus','Extra attack bonus',true],['damageBonus','Extra damage bonus',true],['range','Range / reach',false],['notes','Notes / limitations',false]]){
    const el=numeric?number(card[key]??0,-99,99):input('text',card[key]||'');if(!numeric)el.maxLength=300;
    el.addEventListener('input',()=>{card[key]=el.value;persist();refreshAttackBonuses();if(key==='range'||key==='notes')info.textContent=[card.range,card.notes].filter(Boolean).join(' · ');});detail.append(label(text+' ',el));
   }
   detail.append(button('Remove attack',()=>{if(!confirm('Remove '+(card.name||'this attack')+'?'))return;data.attacks=data.attacks.filter(x=>x!==card);persist();renderAttacks();}));
   const info=make('p',[card.range,card.notes].filter(Boolean).join(' · '),'combat-hint');
   box.append(heading,out,info,detail);attackRoot.append(box);attackOutputs.push({card,out});
  }
  attackRoot.append(button('+ Add attack',()=>{data.attacks.push({name:'New attack',ability:'str',proficient:false,damageDice:'1d6',damageType:'',hitBonus:0,damageBonus:0,addAbilityDamage:true,range:'',notes:''});persist();renderAttacks();attackRoot.querySelector('article:last-of-type details').open=true;}));
  attackRoot.append(make('p','Choose the ability, training and damage dice for each weapon or spell. For spells, turn off ability-to-damage unless a feature adds it. Extra bonuses support magic weapons and other effects.','combat-hint'));
  refreshAttackBonuses();
 }
 // Six independently selectable saving-throw proficiencies; no automatic class grants.
 function createSavingThrows(){
  const container=make('section',undefined,'sheet-tools sheet-saving-throws');container.append(make('h5','Saving Throws'));
  for(const key of ['str','dex','con','int','wis','cha']){
   const check=input('checkbox');check.name='savingThrowProficient-'+key;check.className='sheet-save-storage';
   const row=make('div',undefined,'sheet-saving-row'),out=make('output'),explain=make('details');
   const toggle=button('✦',()=>{check.checked=!check.checked;check.dispatchEvent(new Event('change',{bubbles:true}));refresh();},key.toUpperCase()+' saving throw proficiency');toggle.className='skill-rank-gem';
   const summary=make('summary',key.toUpperCase()+' save'),breakdown=make('p');explain.append(summary,breakdown);
   function refresh(){const mod=R.modifier(score(key)),prof=Number(named('proficiencyBonus').value)||0,total=mod===null?null:mod+(check.checked?prof:0);out.textContent=total===null?'—':R.signed(total);toggle.classList.toggle('lit',check.checked);toggle.setAttribute('aria-pressed',String(check.checked));breakdown.textContent=mod===null?'Enter '+key.toUpperCase()+' to calculate.':key.toUpperCase()+' '+R.signed(mod)+(check.checked?' + proficiency '+prof:' (no proficiency)')+' = '+R.signed(total);}
   row.append(explain,toggle,out,check);container.append(row);document.addEventListener('feywild:combat-calculated',refresh);document.addEventListener('feywild:profile-loaded',refresh);check.addEventListener('change',refresh);refresh();
  }
  container.append(make('p','Select a gem to mark saving-throw proficiency from your class or features. Existing choices are kept; class proficiencies are not granted automatically.','combat-hint'));
  $('skills').after(container);
 }
 createSavingThrows();
 function refreshExplanations(){
  for(const row of document.querySelectorAll('.skill-rank-row')){
   const key=row.querySelector('.skill-rank-ability').textContent.toLowerCase(),name=row.querySelector('.skill-rank-name').textContent;
   let details=row.querySelector('.sheet-skill-explanation');
   if(!details){details=make('details',undefined,'sheet-skill-explanation');const summary=make('summary',name);row.querySelector('.skill-rank-name').replaceWith(details);summary.className='skill-rank-name';details.append(summary,make('p'));}
   const mod=R.modifier(score(key)),rank=named('skillExpert-'+name)?.checked?2:named('skill-'+name)?.checked?1:0,prof=Number(named('proficiencyBonus').value)||0;
   details.querySelector('p').textContent=mod===null?'Enter '+key.toUpperCase()+' to calculate.':key.toUpperCase()+' '+R.signed(mod)+' + '+(rank===2?'expertise (2 × '+prof+')':rank===1?'proficiency '+prof:'no proficiency')+' = '+R.signed(mod+rank*prof);
  }

 }
 // Rest preview is read-only until Apply. Rolled dice stay fixed within a preview.
 const dialog=$('sheet-rest-dialog');let rest=null;
 function hasFeat(name){try{return JSON.parse(named('features').value).items?.some(x=>x.category==='Feat'&&x.name===name);}catch{return false;}}
 function restSnapshot(){return JSON.stringify({level:level(),class:className(),con:score('con'),hp:named('currentHp').value,max:named('maxHp').value,temp:named('temporaryHp').value,session:store.value,slots:$('spellSlotTracker').value,mode:$('spellSlotMode').value,features:named('features').value});}
 function openRest(kind){
  if(!loaded)return;
  const max=R.integer(named('maxHp').value,1),hp=R.integer(named('currentHp').value),con=R.modifier(score('con')),l=level(),die=L.classRule()?.die;
  $('sheet-rest-error').textContent='';
  if(max===null||hp===null||!l||con===null||!die){$('sheet-hp-status').textContent='Enter valid HP, level and Constitution before resting.';return;}
  if(kind==='short'&&hp===0){$('sheet-hp-status').textContent='At 0 HP, resolve recovery with the DM before using a short rest.';return;}
  rest={kind,max,hp,con,l,die,rolls:[],count:0,snapshot:restSnapshot()};
  $('sheet-rest-title').textContent=kind==='short'?'☾ Short Rest':'☾ Long Rest';
  const root=$('sheet-rest-content');root.replaceChildren();
  root.append(make('p',kind==='short'?'At least 1 hour of light activity. Choose how many Hit Dice to spend; rolls include Constitution.':'At least 8 hours, with the required sleep/light activity. Apply only when eligible (at least 1 HP at the start, and no long-rest benefit in the last 24 hours).'));
  if(kind==='short'){
   const count=number(0,0,Math.max(0,l-data.hitDiceSpent));count.id='sheet-rest-dice';
   count.addEventListener('change',()=>{
    const n=R.integer(count.value,0,Math.max(0,l-data.hitDiceSpent));if(n===null){count.value=rest.count;return;}
    rest.count=n;while(rest.rolls.length<n)rest.rolls.push(1+Math.floor(crypto.getRandomValues(new Uint32Array(1))[0]/4294967296*die));refreshRestPreview();
   });root.append(label('Hit Dice to spend ',count));
   root.append(make('p','Healing uses base Hit Die + CON'+(hasFeat('Durable')?' with Durable minimum':'')+'. Apply Song of Rest, Chef or other additional healing separately.','combat-hint'));
  }
  const slots=input('checkbox');slots.id='sheet-rest-slots';slots.checked=kind==='long'||className()==='warlock';
  const shortSlots=kind==='short'&&className()!=='warlock';slots.disabled=shortSlots;slots.addEventListener('change',refreshRestPreview);
  root.append(label('Restore spell slots'+(shortSlots?' (ordinary slots need a long rest)':''),slots));
  if($('spellSlotMode').value==='manual')root.append(make('p','Slots use your manual totals. Uncheck restoration if your house rules use a different recharge.','combat-hint'));
  if(kind==='long'){
   const food=input('checkbox');food.id='sheet-rest-food';food.checked=false;food.addEventListener('change',refreshRestPreview);root.append(label('Ate and drank enough: reduce exhaustion by 1 ',food));
  }
  const preview=make('div');preview.id='sheet-rest-preview';preview.setAttribute('aria-live','polite');root.append(preview);
  root.append(make('p','Other conditions, Inspiration, concentration, homebrew points and manual-recharge resources stay as tracked. Select Save Character after applying.','combat-hint'));
  refreshRestPreview();dialog.showModal();
 }
 function restHP(){return rest.kind==='long'?rest.max:rest.hp>=rest.max?rest.hp:Math.min(rest.max,rest.hp+rest.rolls.slice(0,rest.count).reduce((sum,n)=>sum+R.hitDieHealing(n,rest.con,hasFeat('Durable')),0));}
 function refreshRestPreview(){
  if(!rest)return;
  const root=$('sheet-rest-preview');root.replaceChildren();const list=make('ul');
  list.append(make('li','HP: '+rest.hp+' → '+restHP()+(rest.kind==='short'&&rest.count?' (rolled '+rest.rolls.slice(0,rest.count).join(', ')+'; CON '+R.signed(rest.con)+' each)':'')));
  const spent=rest.kind==='long'?R.hitDiceAfterLongRest(rest.l,data.hitDiceSpent):data.hitDiceSpent+rest.count;
  list.append(make('li','Available Hit Dice: '+Math.max(0,rest.l-data.hitDiceSpent)+' → '+Math.max(0,rest.l-spent)));
  if(rest.kind==='long')list.append(make('li','Temporary HP: '+(named('temporaryHp').value||0)+' → 0; death saves cleared.'));
  for(const resource of currentResources())if(R.restRecovers(resource.recharge,rest.kind)&&resource.max!==null)list.append(make('li',resource.name+': '+resourceRemaining(resource)+' → '+resource.max));
  list.append(make('li',$('sheet-rest-slots').checked?'Restore all tracked spell slots to their current totals.':'Spell slots stay as tracked.'));
  if($('sheet-rest-food')?.checked)list.append(make('li','Exhaustion: '+data.exhaustion+' → '+Math.max(0,data.exhaustion-1)));
  root.append(list);
 }
 $('sheet-short-rest').addEventListener('click',()=>openRest('short'));
 $('sheet-long-rest').addEventListener('click',()=>openRest('long'));
 $('sheet-rest-cancel').addEventListener('click',()=>dialog.close());
 $('sheet-rest-apply').addEventListener('click',()=>{
  if(!rest)return;
  if(rest.snapshot!==restSnapshot()){$('sheet-rest-error').textContent='Character values changed. Cancel and reopen the rest for a fresh preview.';return;}
  set('currentHp',restHP());
  if(rest.kind==='long'){
   set('temporaryHp',0);clearDeathSaves();data.hitDiceSpent=R.hitDiceAfterLongRest(rest.l,data.hitDiceSpent);
   if($('sheet-rest-food')?.checked)data.exhaustion=Math.max(0,data.exhaustion-1);
  }else{data.hitDiceSpent+=rest.count;if(rest.hp===0&&restHP()>0)clearDeathSaves();}
  for(const resource of currentResources())if(R.restRecovers(resource.recharge,rest.kind))data.resources[resource.id]={...data.resources[resource.id],spent:0};
  if($('sheet-rest-slots').checked)window.FEYWILD_SPELL_SLOTS?.restoreAll();
  persist();renderResources();renderConditions();dialog.close();$('sheet-hp-status').textContent=(rest.kind==='long'?'Long':'Short')+' rest applied. Select Save Character.';rest=null;
 });
 document.addEventListener('feywild:profile-loaded',()=>{
  read();renderInspiration();loaded=true;for(const id of ['sheet-toolbar','sheet-hp-controls','sheet-conditions-panel','sheet-resources-panel'])$(id).hidden=false;
  renderConditions();renderResources();renderAttacks();refreshExplanations();
 });
 document.addEventListener('feywild:combat-calculated',()=>{if(loaded){refreshAttackBonuses();refreshExplanations();}});
 document.addEventListener('feywild:level-changed',()=>{if(loaded)renderResources();});
 document.addEventListener('input',event=>{if(loaded&&event.target.name==='cha')renderResources();});
 document.addEventListener('change',event=>{if(loaded&&event.target.name?.startsWith('skill'))refreshExplanations();});
 // Expose only small read-only hooks useful to the existing sheet and browser checks.
 window.FEYWILD_SESSION_TOOLS={ready:()=>loaded};
})();
