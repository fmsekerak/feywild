/* SRD 5.1 spell library: static, searchable, and saved with the existing D1 profile. */
(() => {
 const byId=id=>document.getElementById(id);
 const selected=byId("srdSpells");
 if(!selected)return;
 const search=byId("srd-spell-search"), level=byId("srd-spell-level"),
       school=byId("srd-spell-school"), klass=byId("srd-spell-class");
 const status=byId("srd-spell-status"), results=byId("srd-spell-results"),
       knownList=byId("srd-known-spells"), more=byId("srd-spell-more"),
       count=byId("srd-known-count"), preparedField=byId("srdPreparedSpells"), preparedCount=byId("srd-prepared-count"), knownFilter=byId("srd-known-filter");
 let spells=[], byIndex=new Map(), visible=6;
 const known=()=>new Set(selected.value.split(",").map(x=>x.trim()).filter(x=>byIndex.has(x)));
 const label=s=>s.level===0?"Cantrip":"Level "+s.level;
 const prepared=()=>new Set((preparedField.value||"").split(",").filter(Boolean));
 const setPrepared=ids=>{preparedField.value=[...ids].join(",")};
 const notifyChange=message=>setStatus(message+" · Select Save Character to keep it.");
 const setStatus=s=>{status.textContent=s};
 function addOptions(select,values,formatter=x=>x){
  for(const value of [...new Set(values)].sort((a,b)=>typeof a==="number"?a-b:String(a).localeCompare(String(b)))){
   if(select===level && value===0)continue;
   select.add(new Option(formatter(value),String(value)));
  }
 }
 function text(tag,content,cls){
  const node=document.createElement(tag);
  node.textContent=content;
  if(cls)node.className=cls;
  return node;
 }
 function spellCard(spell,isKnown){
  const card=document.createElement("article");card.className="srd-spell-card";
  const heading=text("h6",spell.name);
  const meta=text("p",label(spell)+" · "+spell.school+" · "+spell.classes.join(", "),"srd-spell-meta");
  const controls=document.createElement("div");controls.className="srd-spell-controls";
  if(isKnown){
   const isPrepared=prepared().has(spell.id);
   const prepare=document.createElement("button");prepare.type="button";
   prepare.className="srd-prepare-toggle"+(isPrepared?" is-prepared":"");
   prepare.textContent=isPrepared?"✓ Prepared":"◇ Prepare";
   prepare.setAttribute("aria-pressed",String(isPrepared));
   prepare.addEventListener("click",()=>{
    const ids=prepared();if(ids.has(spell.id))ids.delete(spell.id);else ids.add(spell.id);
    setPrepared(ids);render();notifyChange("Preparation updated");
   });
   controls.append(prepare);
   if(spell.level>0){
    const cast=document.createElement("button");cast.type="button";cast.className="srd-cast-button";
    const canCast=window.FEYWILD_SPELL_SLOTS?.remaining(spell.level)>0;
    cast.textContent="✦ Use level "+spell.level+" slot";cast.disabled=!canCast;
    cast.title=canCast?"Spend one level "+spell.level+" slot":"No slots available at this level";
    cast.addEventListener("click",()=>{
     if(!(window.FEYWILD_SPELL_SLOTS?.remaining(spell.level)>0))return;
     if(!window.confirm("Spend one level "+spell.level+" slot for "+spell.name+"?"))return;
     document.dispatchEvent(new CustomEvent("feywild:spend-slot",{detail:{level:spell.level}}));
     notifyChange("Spell slot expended");
    });
    controls.append(cast);
   }
  }
  const toggle=document.createElement("button");toggle.type="button";
  toggle.textContent=isKnown?"Remove from spellbook":"✧ Add to spellbook";
  toggle.setAttribute("aria-label",(isKnown?"Remove ":"Add ")+spell.name+(isKnown?" from":" to")+" spellbook");
  toggle.addEventListener("click",()=>{
   const ids=known();
   if(ids.has(spell.id))ids.delete(spell.id);else ids.add(spell.id);
   selected.value=[...ids].join(",");
   if(!ids.has(spell.id)){const p=prepared();p.delete(spell.id);setPrepared(p)}
   render();notifyChange("Spell selection changed");
  });
  const details=document.createElement("details");details.className="srd-spell-details";
  const summary=text("summary","Read spell details");
  details.append(summary);
  const stats=document.createElement("dl");
  const facts=[["Casting time",spell.castingTime],["Range",spell.range],["Components",spell.components+(spell.material?" ("+spell.material+")":"")],["Duration",spell.duration],["Ritual",spell.ritual?"Yes":"No"],["Concentration",spell.concentration?"Yes":"No"]];
  for(const [key,value] of facts){stats.append(text("dt",key),text("dd",value||"—"))}
  details.append(stats,text("p",spell.description,"srd-spell-description"));
  if(spell.higherLevel)details.append(text("p","At Higher Levels: "+spell.higherLevel,"srd-spell-description"));
  controls.append(toggle);
  const quick=text("p",[spell.castingTime,spell.range,spell.duration].filter(Boolean).join(" · "),"srd-spell-quick");
  const badges=document.createElement("div");badges.className="srd-spell-badges";
  for(const badge of [spell.concentration?"◈ Concentration":"",spell.ritual?"✧ Ritual":"",spell.components?"Components: "+spell.components:""].filter(Boolean)){
   badges.append(text("span",badge,"srd-spell-badge"));
  }
  card.append(heading,meta,quick,badges,controls,details);
  return card;
 }
 function render(){
  const saved=known();
  const prep=prepared();
  const savedSpells=spells.filter(s=>saved.has(s.id)&&(knownFilter.value==="all"||(knownFilter.value==="prepared"?prep.has(s.id):!prep.has(s.id))));
  preparedCount.textContent=spells.filter(s=>saved.has(s.id)&&prep.has(s.id)).length+" prepared";
  count.textContent="("+saved.size+")";
  knownList.replaceChildren();
  if(!savedSpells.length)knownList.append(text("p","No saved spells yet. Find one below and add it to your spellbook.","srd-spell-empty"));
  else savedSpells.forEach(s=>knownList.append(spellCard(s,true)));
  const query=search.value.trim().toLocaleLowerCase();
  const filtered=spells.filter(s=>(!query||(s.name+" "+s.description).toLocaleLowerCase().includes(query))&&(!level.value||String(s.level)===level.value)&&(!school.value||s.school===school.value)&&(!klass.value||s.classes.includes(klass.value)));
  results.replaceChildren();
  if(!filtered.length)results.append(text("p","No spells match those filters.","srd-spell-empty"));
  filtered.slice(0,visible).forEach(s=>results.append(spellCard(s,saved.has(s.id))));
  more.hidden=filtered.length<=visible;
  more.textContent="Show more spells ("+Math.max(0,filtered.length-visible)+" remaining)";
  if(!status.textContent.includes("changed"))setStatus(filtered.length+" spells match your search · "+spells.length+" SRD spells available.");
 }
 for(const control of [search,level,school,klass])control.addEventListener(control===search?"input":"change",()=>{visible=6;render()});
 more.addEventListener("click",()=>{visible+=20;render()});
 knownFilter.addEventListener("change",render);
 document.addEventListener("feywild:profile-loaded",render);
 document.addEventListener("feywild:slots-changed",render);
 fetch("assets/data/srd-2014-spells.json")
  .then(response=>{if(!response.ok)throw Error("Spell archive could not be loaded.");return response.json()})
  .then(data=>{
   if(!Array.isArray(data.spells))throw Error("Invalid spell archive.");
   spells=data.spells.sort((a,b)=>a.name.localeCompare(b.name));
   byIndex=new Map(spells.map(s=>[s.id,s]));
   addOptions(level,[...spells.map(s=>s.level)],n=>"Level "+n);
   addOptions(school,spells.map(s=>s.school));
   addOptions(klass,spells.flatMap(s=>s.classes));
   render();
  })
  .catch(error=>{setStatus(error.message);results.append(text("p","Please reload the page to try again.","srd-spell-empty"))});
})();
