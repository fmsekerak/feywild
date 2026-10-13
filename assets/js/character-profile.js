const $=id=>document.getElementById(id);
const selectedId=sessionStorage.getItem("feywild-character-id");
if(!selectedId)location.replace("index.html");
const labelize=s=>s.replace(/([A-Z])/g," $1").replace(/^./,x=>x.toUpperCase());
function field(name,label=labelize(name),type="text",parent){const wrap=document.createElement("label");wrap.className="field";wrap.textContent=label;const input=document.createElement(type==="textarea"?"textarea":"input");input.name=name;if(type!=="textarea")input.type=type;wrap.append(input);$(parent).append(wrap);return input}
function add(names,parent,type="text"){names.forEach(name=>field(name,undefined,type,parent))}

add(["str","dex","con","int","wis","cha"],"abilities","number");
const skills=["Acrobatics","Animal Handling","Arcana","Athletics","Deception","History","Insight","Intimidation","Investigation","Medicine","Nature","Perception","Performance","Persuasion","Religion","Sleight of Hand","Stealth","Survival"];
const skillWrap=$("skills");skills.forEach(name=>{const label=document.createElement("label"),input=document.createElement("input");input.type="checkbox";input.name="skill-"+name;label.append(input,document.createTextNode(name));skillWrap.append(label)});
add(["proficiencies"],"proficiencies","textarea");add(["proficiencyBonus","passivePerception"],"proficiencies");
add(["maxHp","currentHp","temporaryHp","hitDice","armorClass","initiative","speed","deathSaves"],"combat");
add(["attacks"],"attacks","textarea");add(["equipment"],"equipment","textarea");
add(["personality","ideals","bonds","flaws"],"personality","textarea");add(["features"],"features","textarea");
add(["age","eyes","height","skin","weight","hair"],"appearanceDetails");add(["appearance"],"appearanceNotes","textarea");add(["allies"],"allies","textarea");add(["backstory"],"backstory","textarea");add(["additionalFeatures","treasure"],"extras","textarea");
add(["spellClass","spellAbility","spellSave","spellAttack"],"spellcasting");add(["cantrips"],"cantrips","textarea");add(["spellNotes"],"spellNotes","textarea");
for(let level=1;level<=9;level++){const card=document.createElement("article");card.className="satchel-panel profile-panel";card.innerHTML="<h4>✧ Level "+level+" Spells</h4>";const id="level-"+level;card.id=id;$("spellLevels").append(card);field("slots-"+level,"Spell slots", "text",id);field("spells-"+level,"Spells","textarea",id)}
document.querySelectorAll(".profile-tabs button").forEach(button=>button.addEventListener("click",()=>{document.querySelectorAll(".profile-tabs button").forEach(x=>x.setAttribute("aria-selected",String(x===button)));document.querySelectorAll(".profile-pane").forEach(p=>{p.classList.toggle("active",p.id===button.dataset.tab);p.hidden=p.id!==button.dataset.tab})}));
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
async function load(){try{const response=await fetch("/api/character-profile?character_id="+encodeURIComponent(selectedId),{cache:"no-store"});const payload=await response.json();if(!response.ok)throw Error(payload.error||"Could not load profile");originalData=payload.data||{};renderIdentity(payload.character,originalData);inputs().forEach(el=>{if(Object.hasOwn(payload.data,el.name)){if(el.type==="checkbox")el.checked=!!payload.data[el.name];else el.value=payload.data[el.name]}});$("saveStatus").textContent="♡ Profile loaded from Cloudflare D1"}catch(e){$("saveStatus").textContent="Profile data could not load: "+e.message+". Character header is still available."}}
$("saveProfile").addEventListener("click",async()=>{const button=$("saveProfile");button.disabled=true;$("saveStatus").textContent="Saving to D1…";const data={...originalData};inputs().forEach(el=>{if(el.name==="characterName")return;data[el.name]=el.type==="checkbox"?el.checked:el.value});try{const response=await fetch("/api/character-profile",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({character_id:selectedId,data})});const result=await response.json();if(!response.ok)throw Error(result.error||"Save failed");originalData=data;$("saveStatus").textContent="♡ Saved to Cloudflare D1"}catch(e){$("saveStatus").textContent=e.message}finally{button.disabled=false}});
load();