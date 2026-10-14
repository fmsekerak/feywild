/* Feywild SRD spellbook: searchable archive, grouped journal, casting tools. */
(() => {
 const $=id=>document.getElementById(id);
 const selected=$("srdSpells");if(!selected)return;
 const preparedField=$("srdPreparedSpells"),favoritesField=$("srdFavoriteSpells"),concentrationField=$("srdConcentration");
 const search=$("srd-spell-search"),level=$("srd-spell-level"),school=$("srd-spell-school"),klass=$("srd-spell-class");
 const status=$("srd-spell-status"),results=$("srd-spell-results"),knownList=$("srd-known-spells"),more=$("srd-spell-more");
 const count=$("srd-known-count"),preparedCount=$("srd-prepared-count"),knownFilter=$("srd-known-filter"),compact=$("srd-compact-mode");
 const activeName=$("srd-concentration-name"),endConcentration=$("srd-end-concentration");
 const abilitySelect=$("srd-casting-ability"),dcOutput=$("srd-calculated-dc"),attackOutput=$("srd-calculated-attack");
 let spells=[],lookup=new Map(),visible=6,expandedLevels=new Set();
 const split=field=>new Set((field.value||"").split(",").map(x=>x.trim()).filter(Boolean));
 const store=(field,values)=>{field.value=[...values].join(",")};
 const known=()=>split(selected),prepared=()=>split(preparedField),favorites=()=>split(favoritesField);
 const text=(tag,value,cls)=>{const el=document.createElement(tag);el.textContent=value;if(cls)el.className=cls;return el};
 const button=(value,fn,cls)=>{const el=text("button",value,cls);el.type="button";el.addEventListener("click",fn);return el};
 const label=s=>s.level===0?"Cantrips":"Level "+s.level;
 const schoolGlyphs={Abjuration:"⛨",Conjuration:"✧",Divination:"◉",Enchantment:"♡",Evocation:"✦",Illusion:"☾",Necromancy:"☽",Transmutation:"◇"};
 const glyph=s=>schoolGlyphs[s.school]||"✧";
 function changed(message){status.textContent=message+" · Select Save Character to keep it."}
 function currentConcentration(){return concentrationField.value.trim()}
 function updateConcentration(){
  const spell=lookup.get(currentConcentration());
  activeName.textContent=spell?spell.name+" · "+spell.duration:"No concentration spell active.";
  endConcentration.hidden=!spell;
 }
 function setConcentration(id){
  concentrationField.value=id;
  updateConcentration();render();
  changed(id?"Concentration started":"Concentration ended");
 }
 endConcentration.addEventListener("click",()=>setConcentration(""));
 function calculate(){
  const ability=abilitySelect.value;
  const raw=$("abilities")?.querySelector('input[name="'+ability+'"]')?.value.trim();
  const proficiency=$('proficiencies')?.querySelector('input[name="proficiencyBonus"]')?.value.trim();
  const score=Number(raw),bonus=Number(proficiency);
  if(!ability||!raw||!proficiency||!Number.isFinite(score)||!Number.isFinite(bonus)){
   dcOutput.textContent="—";attackOutput.textContent="—";return;
  }
  const modifier=Math.floor((score-10)/2);
  dcOutput.textContent=String(8+bonus+modifier);
  const attack=bonus+modifier;
  attackOutput.textContent=(attack>=0?"+":"")+attack;
 }
 abilitySelect.addEventListener("change",()=>{
  const profile=$("spellcasting")?.querySelector('input[name="spellAbility"]');
  if(profile)profile.value=abilitySelect.value;
  calculate();
  changed("Spellcasting ability updated");
 });
 document.querySelectorAll('#abilities input[name],#proficiencies input[name="proficiencyBonus"]').forEach(input=>input.addEventListener("input",calculate));
 function syncAbility(){
  const raw=$("spellcasting")?.querySelector('input[name="spellAbility"]')?.value.trim().toLowerCase()||"";
  const aliases={intelligence:"int",wisdom:"wis",charisma:"cha",strength:"str",dexterity:"dex",constitution:"con"};
  abilitySelect.value=aliases[raw]||(["int","wis","cha","str","dex","con"].includes(raw)?raw:"");
  calculate();
 }
 function options(select,values,formatter=x=>x){
  for(const value of [...new Set(values)].sort((a,b)=>typeof a==="number"?a-b:String(a).localeCompare(String(b)))){
   if(select===level&&value===0)continue;
   select.add(new Option(formatter(value),String(value)));
  }
 }
 function spellCard(spell,isKnown){
  const card=document.createElement("article");card.className="srd-spell-card";
  card.dataset.school=spell.school.toLowerCase().replace(/[^a-z]/g,"");
  const heading=document.createElement("div");heading.className="srd-spell-heading";
  const icon=text("span",glyph(spell),"srd-school-icon");icon.title=spell.school;icon.setAttribute("aria-label",spell.school+" school");
  heading.append(icon,text("h6",spell.name));
  if(isKnown){
   const fav=favorites().has(spell.id);
   const favorite=button(fav?"♥":"♡",()=>{
    const ids=favorites();if(ids.has(spell.id))ids.delete(spell.id);else ids.add(spell.id);
    store(favoritesField,ids);render();changed("Favorites updated");
   },"srd-favorite-toggle");
   favorite.setAttribute("aria-label",(fav?"Remove ":"Add ")+spell.name+(fav?" from favorites":" to favorites"));
   favorite.setAttribute("aria-pressed",String(fav));
   heading.append(favorite);
  }
  const meta=text("p",label(spell)+" · "+spell.school+" · "+spell.classes.join(", "),"srd-spell-meta");
  const quick=text("p",[spell.castingTime,spell.range,spell.duration].filter(Boolean).join(" · "),"srd-spell-quick");
  const badges=document.createElement("div");badges.className="srd-spell-badges";
  for(const badge of [spell.concentration?"◈ Concentration":"",spell.ritual?"✧ Ritual":"",spell.components?"Components: "+spell.components:""].filter(Boolean))badges.append(text("span",badge,"srd-spell-badge"));
  const controls=document.createElement("div");controls.className="srd-spell-controls";
  if(isKnown){
   const isPrepared=prepared().has(spell.id);
   const prep=button(isPrepared?"✓ Prepared":"◇ Prepare",()=>{
    const ids=prepared();if(ids.has(spell.id))ids.delete(spell.id);else ids.add(spell.id);
    store(preparedField,ids);render();changed("Preparation updated");
   },"srd-prepare-toggle"+(isPrepared?" is-prepared":""));
   prep.setAttribute("aria-pressed",String(isPrepared));controls.append(prep);
   if(spell.concentration){
    const active=currentConcentration()===spell.id;
    const focus=button(active?"◈ End Concentration":"◈ Concentrate",()=>{
     if(active){setConcentration("");return}
     const previous=lookup.get(currentConcentration());
     if(previous&&!window.confirm("Replace concentration on "+previous.name+" with "+spell.name+"?"))return;
     setConcentration(spell.id);
    },"srd-concentration-toggle"+(active?" is-active":""));
    focus.setAttribute("aria-pressed",String(active));controls.append(focus);
   }
   if(spell.level>0){
    const casting=document.createElement("label");casting.className="srd-upcast-label";casting.textContent="Slot";
    const slotSelect=document.createElement("select");slotSelect.setAttribute("aria-label","Slot level for "+spell.name);
    for(let i=spell.level;i<=9;i++)slotSelect.add(new Option("Level "+i,String(i)));
    casting.append(slotSelect);controls.append(casting);
    const cast=button("✦ Use slot",()=>{
     const chosen=Number(slotSelect.value);
     if(!(window.FEYWILD_SPELL_SLOTS?.remaining(chosen)>0))return;
     const previous=spell.concentration?lookup.get(currentConcentration()):null;
     const switching=previous&&previous.id!==spell.id;
     const question="Spend one level "+chosen+" slot for "+spell.name+"?"+(switching?" This will replace concentration on "+previous.name+".":"");
     if(!window.confirm(question))return;
     const success=window.FEYWILD_SPELL_SLOTS?.spend(chosen);
     if(!success)return;
     if(spell.concentration)concentrationField.value=spell.id;
     render();changed("Spell slot expended");
    },"srd-cast-button");
    const updateCast=()=>{cast.disabled=!(window.FEYWILD_SPELL_SLOTS?.remaining(Number(slotSelect.value))>0)};
    slotSelect.addEventListener("change",updateCast);updateCast();controls.append(cast);
   }
  }
  const toggle=button(isKnown?"Remove from spellbook":"✧ Add to spellbook",()=>{
   const ids=known();if(ids.has(spell.id))ids.delete(spell.id);else ids.add(spell.id);
   store(selected,ids);
   if(!ids.has(spell.id)){
    for(const field of [preparedField,favoritesField]){const values=split(field);values.delete(spell.id);store(field,values)}
    if(currentConcentration()===spell.id)concentrationField.value="";
   }
   render();changed("Spell selection changed");
  });
  toggle.setAttribute("aria-label",(isKnown?"Remove ":"Add ")+spell.name+(isKnown?" from":" to")+" spellbook");
  controls.append(toggle);
  const details=document.createElement("details");details.className="srd-spell-details";
  details.append(text("summary","Read spell details"));
  const stats=document.createElement("dl");
  for(const [key,value] of [["Casting time",spell.castingTime],["Range",spell.range],["Components",spell.components+(spell.material?" ("+spell.material+")":"")],["Duration",spell.duration],["Ritual",spell.ritual?"Yes":"No"],["Concentration",spell.concentration?"Yes":"No"]]){
   stats.append(text("dt",key),text("dd",value||"—"));
  }
  details.append(stats,text("p",spell.description,"srd-spell-description"));
  if(spell.higherLevel)details.append(text("p","At Higher Levels: "+spell.higherLevel,"srd-spell-description"));
  card.append(heading,meta,quick,badges,controls,details);return card;
 }
 function render(){
  const saved=known(),prep=prepared(),favs=favorites();
  const savedSpells=spells.filter(s=>saved.has(s.id)&&(knownFilter.value==="all"||(knownFilter.value==="prepared"?prep.has(s.id):knownFilter.value==="unprepared"?!prep.has(s.id):favs.has(s.id))));
  count.textContent="("+saved.size+")";
  preparedCount.textContent=spells.filter(s=>saved.has(s.id)&&prep.has(s.id)).length+" prepared";
  knownList.classList.toggle("srd-compact",compact.checked);
  results.classList.toggle("srd-compact",compact.checked);
  knownList.replaceChildren();
  if(!savedSpells.length)knownList.append(text("p",saved.size?"No spells match this saved-spell filter.":"No saved spells yet. Find one below and add it to your spellbook.","srd-spell-empty"));
  const levels=[...new Set(savedSpells.map(s=>s.level))].sort((a,b)=>a-b);
  for(const n of levels){
   const group=document.createElement("details");group.className="srd-spell-level-group";group.open=!expandedLevels.has(n);
   const summary=text("summary",label({level:n})+" ("+savedSpells.filter(s=>s.level===n).length+")");
   summary.addEventListener("click",()=>{if(group.open)expandedLevels.add(n);else expandedLevels.delete(n)});
   const cards=document.createElement("div");cards.className="spell-library-results srd-level-cards";
   savedSpells.filter(s=>s.level===n).forEach(s=>cards.append(spellCard(s,true)));
   group.append(summary,cards);knownList.append(group);
  }
  const query=search.value.trim().toLocaleLowerCase();
  const filtered=spells.filter(s=>(!query||(s.name+" "+s.description).toLocaleLowerCase().includes(query))&&(!level.value||String(s.level)===level.value)&&(!school.value||s.school===school.value)&&(!klass.value||s.classes.includes(klass.value)));
  results.replaceChildren();
  if(!filtered.length)results.append(text("p","No spells match those filters.","srd-spell-empty"));
  filtered.slice(0,visible).forEach(s=>results.append(spellCard(s,saved.has(s.id))));
  more.hidden=filtered.length<=visible;more.textContent="Show more spells ("+Math.max(0,filtered.length-visible)+" remaining)";
  updateConcentration();
  if(!status.textContent.includes(" · Select Save Character"))status.textContent=filtered.length+" spells match your search · "+spells.length+" SRD spells available.";
 }
 for(const control of [search,level,school,klass])control.addEventListener(control===search?"input":"change",()=>{visible=6;render()});
 more.addEventListener("click",()=>{visible+=20;render()});
 knownFilter.addEventListener("change",render);
 compact.addEventListener("change",render);
 document.addEventListener("feywild:profile-loaded",()=>{syncAbility();render()});
 document.addEventListener("feywild:slots-changed",render);
 fetch("assets/data/srd-2014-spells.json").then(r=>{if(!r.ok)throw Error("Spell archive could not be loaded.");return r.json()}).then(data=>{
  if(!Array.isArray(data.spells))throw Error("Invalid spell archive.");
  spells=data.spells.sort((a,b)=>a.name.localeCompare(b.name));lookup=new Map(spells.map(s=>[s.id,s]));
  options(level,spells.map(s=>s.level),n=>"Level "+n);
  options(school,spells.map(s=>s.school));options(klass,spells.flatMap(s=>s.classes));
  render();
 }).catch(e=>{status.textContent=e.message;results.append(text("p","Please reload the page to try again.","srd-spell-empty"))});
 syncAbility();
})();
