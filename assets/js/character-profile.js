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
const skillWrap=$("skills");skills.forEach(name=>{const label=document.createElement("label"),input=document.createElement("input");input.type="checkbox";input.name="skill-"+name;label.append(input,document.createTextNode(name));skillWrap.append(label)});
const characterLevel=field("characterLevel","Character Level","number","combat");
characterLevel.min="1";characterLevel.max="20";characterLevel.step="1";
characterLevel.placeholder="1–20";
add(["proficiencies"],"proficiencies","textarea");add(["proficiencyBonus","passivePerception"],"proficiencies");
const proficiencyBonus=document.querySelector('#proficiencies input[name="proficiencyBonus"]');
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

add(["maxHp","currentHp","temporaryHp","hitDice","armorClass","initiative","speed","deathSaves"],"combat");
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
async function load(){try{const response=await fetch("/api/character-profile?character_id="+encodeURIComponent(selectedId),{cache:"no-store"});const payload=await response.json();if(!response.ok)throw Error(payload.error||"Could not load profile");originalData=payload.data||{};renderIdentity(payload.character,originalData);inputs().forEach(el=>{if(Object.hasOwn(payload.data,el.name)){if(el.type==="checkbox")el.checked=!!payload.data[el.name];else el.value=payload.data[el.name]}});document.querySelectorAll("#abilities input[name]").forEach(el=>el.dispatchEvent(new Event("input")));updateProficiency();document.dispatchEvent(new Event("feywild:profile-loaded"));$("saveStatus").textContent="♡ Profile loaded from Cloudflare D1"}catch(e){$("saveStatus").textContent="Profile data could not load: "+e.message+". Character header is still available."}}
$("saveProfile").addEventListener("click",async()=>{const button=$("saveProfile");button.disabled=true;$("saveStatus").textContent="Saving to D1…";if(!characterLevel.checkValidity()){characterLevel.reportValidity();button.disabled=false;$("saveStatus").textContent="Enter a character level between 1 and 20.";return;}const data={...originalData};inputs().forEach(el=>{if(el.name==="characterName")return;data[el.name]=el.type==="checkbox"?el.checked:el.value});try{const response=await fetch("/api/character-profile",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({character_id:selectedId,data})});const result=await response.json();if(!response.ok)throw Error(result.error||"Save failed");originalData=data;$("saveStatus").textContent="♡ Saved to Cloudflare D1"}catch(e){$("saveStatus").textContent=e.message}finally{button.disabled=false}});
load();