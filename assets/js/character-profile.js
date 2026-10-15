const $=id=>document.getElementById(id);
const selectedId=sessionStorage.getItem("feywild-character-id");
if(!selectedId || (sessionStorage.getItem("feywild-character-name") || "").trim().toLowerCase() === "dm")location.replace("home.html");
const labelize=s=>s.replace(/([A-Z])/g," $1").replace(/^./,x=>x.toUpperCase());
function field(name,label=labelize(name),type="text",parent){const wrap=document.createElement("label");wrap.className="field";wrap.textContent=label;const input=document.createElement(type==="textarea"?"textarea":"input");input.name=name;if(type!=="textarea")input.type=type;wrap.append(input);$(parent).append(wrap);return input}
function add(names,parent,type="text"){names.forEach(name=>field(name,undefined,type,parent))}

add(["str","dex","con","int","wis","cha"],"abilities","number");
/* Live D&D ability modifiers, calculated locally from existing scores.
   These are display-only and never added to the saved profile payload. */
document.querySelectorAll("#abilities input[name]").forEach(input=>{
 const output=document.createElement("output");
 output.className="ability-modifier";
 output.setAttribute("aria-label",labelize(input.name)+" modifier");
 const update=()=>{
  const raw=input.value.trim();
  const score=Number(raw);
  if(!raw || !Number.isFinite(score)){output.textContent="Modifier —";return}
  const modifier=Math.floor((score-10)/2);
  output.textContent="Modifier "+(modifier>=0?"+":"")+modifier;
 };
 input.closest(".field").append(output);
 input.addEventListener("input",update);
 update();
});

const skills=["Acrobatics","Animal Handling","Arcana","Athletics","Deception","History","Insight","Intimidation","Investigation","Medicine","Nature","Perception","Performance","Persuasion","Religion","Sleight of Hand","Stealth","Survival"];
/* Two crystal marks per skill: 0 = untrained, 1 = proficient, 2 = expertise.
   Preserve legacy skill-* checkboxes; only add skillExpert-* for the second mark. */
const skillAbilities={
 "Acrobatics":"dex","Animal Handling":"wis","Arcana":"int","Athletics":"str",
 "Deception":"cha","History":"int","Insight":"wis","Intimidation":"cha",
 "Investigation":"int","Medicine":"wis","Nature":"int","Perception":"wis",
 "Performance":"cha","Persuasion":"cha","Religion":"int","Sleight of Hand":"dex",
 "Stealth":"dex","Survival":"wis"
};
const skillWrap=$("skills");
const skillRows=[];
skills.forEach(name=>{
 const row=document.createElement("div");
 row.className="skill-rank-row";
 const legacy=document.createElement("input");
 legacy.type="checkbox";legacy.name="skill-"+name;legacy.className="skill-rank-storage";
 legacy.setAttribute("aria-label",name+" proficiency (saved)");
 const expert=document.createElement("input");
 expert.type="checkbox";expert.name="skillExpert-"+name;expert.className="skill-rank-storage";
 expert.setAttribute("aria-label",name+" expertise (saved)");
 const title=document.createElement("span");title.className="skill-rank-name";title.textContent=name;
 const ability=document.createElement("span");ability.className="skill-rank-ability";ability.textContent=skillAbilities[name].toUpperCase();
 const controls=document.createElement("span");controls.className="skill-rank-controls";controls.setAttribute("role","group");controls.setAttribute("aria-label",name+" training");
 const marks=[1,2].map(rank=>{
  const button=document.createElement("button");
  button.type="button";button.className="skill-rank-gem";
  button.textContent="✦";
  button.title=rank===1?"Toggle proficiency":"Toggle expertise";
  controls.append(button);
  return button;
 });
 const bonus=document.createElement("output");bonus.className="skill-rank-bonus";bonus.setAttribute("aria-label",name+" skill modifier");
 function getRank(){return expert.checked?2:legacy.checked?1:0}
 function update(){
  const rank=getRank();
  marks.forEach((button,i)=>{
   const lit=rank>i;
   button.classList.toggle("lit",lit);
   button.setAttribute("aria-pressed",String(lit));
   button.setAttribute("aria-label",name+": "+(i===0?"Proficient":"Expertise")+(lit?" selected":" not selected"));
  });
  const raw=document.querySelector('#abilities input[name="'+skillAbilities[name]+'"]')?.value.trim();
  const profRaw=document.querySelector('#proficiencies input[name="proficiencyBonus"]')?.value.trim();
  if(!raw||!Number.isFinite(Number(raw))){bonus.textContent="—";return}
  const mod=Math.floor((Number(raw)-10)/2);
  const prof=profRaw&&Number.isFinite(Number(profRaw))?Number(profRaw):0;
  const total=mod+rank*prof;
  bonus.textContent=(total>=0?"+":"")+total;
 }
 function setRank(rank){
  legacy.checked=rank>=1;expert.checked=rank>=2;
  legacy.dispatchEvent(new Event("change",{bubbles:true}));
  update();
 }
 marks.forEach((button,i)=>button.addEventListener("click",()=>{
  const rank=i+1;
  setRank(getRank()===rank?rank-1:rank);
 }));
 row.append(legacy,expert,title,ability,controls,bonus);
 skillWrap.append(row);
 skillRows.push(update);
});
function refreshSkillRanks(){skillRows.forEach(update)}
document.querySelectorAll('#abilities input[name]').forEach(input=>input.addEventListener("input",refreshSkillRanks));
document.addEventListener("feywild:profile-loaded",refreshSkillRanks);
document.addEventListener("feywild:combat-calculated",refreshSkillRanks);

const characterLevel=field("characterLevel","Character Level","number","combat");
characterLevel.closest(".field").hidden=true;
characterLevel.readOnly=true;
characterLevel.min="1";characterLevel.max="20";characterLevel.step="1";
characterLevel.placeholder="1–20";
add(["proficiencies"],"proficiencies","textarea");add(["proficiencyBonus","passivePerception"],"proficiencies");
const proficiencyBonus=document.querySelector('#proficiencies input[name="proficiencyBonus"]');
proficiencyBonus.addEventListener("input",refreshSkillRanks);
proficiencyBonus.readOnly=true;
proficiencyBonus.title="Automatically calculated from character level (D&D 5e)";
function updateProficiency(){
 const raw=characterLevel.value.trim(),n=Number(raw);
 const valid=raw!==""&&Number.isInteger(n)&&n>=1&&n<=20;
 if(!valid){if(raw!=="")characterLevel.setCustomValidity("Enter a whole-number level from 1 to 20.");else characterLevel.setCustomValidity("");return;}
 characterLevel.setCustomValidity("");
 proficiencyBonus.value=String(2+Math.floor((n-1)/4));
 proficiencyBonus.dispatchEvent(new Event("input",{bubbles:true}));
}
characterLevel.addEventListener("input",updateProficiency);

add(["maxHp","currentHp","temporaryHp"],"combat-hp");
// Max HP is calculated, so show it as a stat rather than a text field.
// Retain the hidden named input for existing D1 load/save and combat automation.
const maxHpInput=document.querySelector('#combat-hp input[name="maxHp"]');
if(maxHpInput){
 const wrap=maxHpInput.closest(".field");
 wrap.classList.add("max-hp-stat");
 const display=document.createElement("output");
 display.className="max-hp-value";
 display.setAttribute("aria-label","Calculated maximum hit points");
 display.textContent="—";
 wrap.append(display);
 const refresh=()=>{display.textContent=maxHpInput.value.trim()||"—";};
 maxHpInput.addEventListener("input",refresh);
 document.addEventListener("feywild:profile-loaded",refresh);
 // The existing combat calculator sets input.value directly without an input event.
 // A targeted event from the calculator below keeps the display current.
 document.addEventListener("feywild:combat-calculated",refresh);
 refresh();
}

add(["armorClass","initiative","speed","hitDice"],"combat-defense");
// Display automatically calculated defenses as static ability-style stats.
// Keep the named inputs in the DOM for existing D1 load/save and calculations.
document.querySelectorAll('#combat-defense input[name]').forEach(input=>{
 const tile=input.closest(".field");
 tile.classList.add("defense-stat");
 const value=document.createElement("output");
 value.className="defense-stat-value";
 value.setAttribute("aria-label",tile.firstChild?.textContent?.trim()||input.name);
 value.textContent="—";
 tile.append(value);
 const refresh=()=>{value.textContent=input.value.trim()||"—";};
 input.addEventListener("input",refresh);
 document.addEventListener("feywild:profile-loaded",refresh);
 document.addEventListener("feywild:combat-calculated",refresh);
 refresh();
});
const deathSavesField=field("deathSaves","Death Saves","text","combat-death-data");
add(["attacks"],"attacks","textarea");add(["equipment"],"equipment","textarea");
add(["personality","ideals","bonds","flaws"],"personality","textarea");add(["features"],"features","textarea");
add(["age","eyes","height","skin","weight","hair"],"appearanceDetails");add(["appearance"],"appearanceNotes","textarea");add(["allies"],"allies","textarea");add(["backstory"],"backstory","textarea");add(["additionalFeatures","treasure"],"extras","textarea");
add(["spellClass","spellAbility","spellSave","spellAttack"],"spellcasting");
for(const name of ["spellAbility","spellSave","spellAttack"]){
 const input=document.querySelector('#spellcasting input[name="'+name+'"]');
 if(input){input.readOnly=true;input.title="Automatically calculated from character class, ability score and proficiency bonus";}
}
// Legacy cantrips and spellNotes remain in originalData, but no longer render.
// Legacy per-level spell fields are no longer rendered. Existing saved values
// remain in originalData and are preserved by the profile save workflow.
document.querySelectorAll(".profile-tabs button").forEach(button=>button.addEventListener("click",()=>{document.querySelectorAll(".profile-tabs button").forEach(x=>x.setAttribute("aria-selected",String(x===button)));document.querySelectorAll(".profile-pane").forEach(p=>{p.classList.toggle("active",p.id===button.dataset.tab);p.hidden=p.id!==button.dataset.tab})}));
// Equipment notes can open the embedded inventory without navigating away.
document.querySelectorAll("[data-open-inventory]").forEach(control=>control.addEventListener("click",()=>{
 document.getElementById("tab-inventory").click();
 document.getElementById("tab-inventory").focus();
}));
// Direct links to the inventory open the matching character-sheet tab.
function openRequestedTab(){
 const tabName=location.hash.slice(1);
 const tab=document.querySelector('.profile-tabs button[data-tab="'+tabName+'"]');
 if(tab)tab.click();
}
window.addEventListener("hashchange",openRequestedTab);
openRequestedTab();
const inputs=()=>[...document.querySelectorAll("input[name],textarea[name]")];
let originalData={};
function renderIdentity(character,data={}){
 const name=(character?.name||sessionStorage.getItem("feywild-character-name")||"Adventurer").trim();
 $("characterName").textContent=name;
 const entries=window.FEYWILD_CHARACTER_DETAILS||{};
 const matchedName=Object.keys(entries).find(key=>key.trim().toLowerCase()===name.toLowerCase());
 const hardcoded=matchedName?entries[matchedName]:{};
 const portrait=$("characterPortraitImage");
 const fallback=$("characterPortraitFallback");
 const imagePath=typeof hardcoded.portrait==="string"?hardcoded.portrait.trim():"";
 portrait.hidden=true;
 portrait.removeAttribute("src");
 fallback.hidden=false;
 if(imagePath && !/^(?:https?:|\/\/|data:|javascript:)/i.test(imagePath) && imagePath.startsWith("assets/images/")){
  portrait.onload=()=>{portrait.hidden=false;fallback.hidden=true};
  portrait.onerror=()=>{portrait.hidden=true;fallback.hidden=false};
  portrait.alt=name+" portrait";
  portrait.src=imagePath;
 }
 for(const key of ["class","race","background","alignment"]){
  const value=hardcoded[key]||data[key]||"—";
  $("profile-"+key).textContent=value;
 }
}
// Show hardcoded identity immediately, independently of the profile API.
renderIdentity(null,{});
async function load(){try{const response=await fetch("/api/character-profile?character_id="+encodeURIComponent(selectedId),{cache:"no-store"});const payload=await response.json();if(!response.ok)throw Error(payload.error||"Could not load profile");originalData=payload.data||{};renderIdentity(payload.character,originalData);inputs().forEach(el=>{if(Object.hasOwn(payload.data,el.name)){if(el.type==="checkbox")el.checked=!!payload.data[el.name];else el.value=payload.data[el.name]}});document.querySelectorAll("#abilities input[name]").forEach(el=>el.dispatchEvent(new Event("input")));updateProficiency();document.dispatchEvent(new Event("feywild:profile-loaded"));refreshSkillRanks();$("saveStatus").textContent=""}catch(e){$("saveStatus").textContent="Profile data could not load: "+e.message+". Character header is still available."}}
$("saveProfile").addEventListener("click",async()=>{const button=$("saveProfile");button.disabled=true;$("saveStatus").textContent="Saving to D1…";if(!characterLevel.checkValidity()){characterLevel.reportValidity();button.disabled=false;$("saveStatus").textContent="Enter a character level between 1 and 20.";return;}const data={...originalData};inputs().forEach(el=>{if(el.name==="characterName")return;data[el.name]=el.type==="checkbox"?el.checked:el.value});try{const response=await fetch("/api/character-profile",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({character_id:selectedId,data})});const result=await response.json();if(!response.ok)throw Error(result.error||"Save failed");originalData=data;$("saveStatus").textContent="♡ Saved to Cloudflare D1"}catch(e){$("saveStatus").textContent=e.message}finally{button.disabled=false}});
load();