import {EQUIPMENT_TYPES,equipmentForItem,equippedItems,calculateArmorClass,equipmentDescription} from './equipment-rules.js';
const $ = id => document.getElementById(id);
const api=async(path,options={})=>{
 const response=await fetch(path,{cache:"no-store",...options});
 let data;try{data=await response.json()}catch{throw Error("Unable to read server response.");}
 if(!response.ok)throw Error(data?.error||"Request failed.");
 return data;
};
const jsonBody=value=>({headers:{"Content-Type":"application/json"},body:JSON.stringify(value)});
let currentCharacter = null;
let catalog = [];
let inventoryItems=[],equipmentReady=false,busy=false;
const node=(tag,className,text)=>{const el=document.createElement(tag);if(className)el.className=className;if(text!==undefined)el.textContent=text;return el;};
// The combat calculator consumes only confirmed inventory state, never drafts.
window.FEYWILD_EQUIPMENT={armorClass:dex=>equipmentReady?calculateArmorClass(inventoryItems,dex):null};
function publishEquipment(){document.dispatchEvent(new Event('feywild:equipment-changed'));renderEquipped();}
function setBusy(value){
 busy=value;
 document.querySelectorAll('#items button,#items input,#items select,#equipped-gear button,#add-item button').forEach(el=>el.disabled=value);
}
function renderEquipped(){
 const root=$('equipped-gear');if(!root)return;
 root.replaceChildren();
 if(!equipmentReady){root.append(node('p','equipment-empty','Equipment unavailable until inventory loads.'));return;}
 const active=equippedItems(inventoryItems);
 if(!active.length)root.append(node('p','equipment-empty','No items equipped.'));
 const list=node('ul','equipped-gear-list');
 for(const item of active){
  const row=node('li','equipped-gear-row'),info=node('div');
  info.append(node('strong','',item.name),node('span','equipment-effect',equipmentDescription(item.equipment)));
  const remove=node('button','','Unequip');remove.type='button';remove.disabled=busy;remove.setAttribute('aria-label','Unequip '+item.name);
  remove.addEventListener('click',()=>saveEquipment(item,{...item.equipment,equipped:false}));
  row.append(info,remove);list.append(row);
 }
 root.append(list);
 const raw=document.querySelector('#abilities [name="dex"]')?.value.trim();
 const dex=raw&&Number.isFinite(Number(raw))?Math.floor((Number(raw)-10)/2):null;
 root.append(node('p','equipment-ac-summary',calculateArmorClass(inventoryItems,dex).description));
}
document.addEventListener('feywild:combat-calculated',renderEquipped);
function equipmentStatus(message,error=false){
 const el=$('equipment-status');if(el){el.textContent=message;el.classList.toggle('equipment-error',error);}
}
async function mutateInventory(action){
 if(busy)return false;
 setBusy(true);let written=false;
 try{
  await action();written=true;await loadItems();
  equipmentStatus('Equipment saved.');return true;
 }catch(error){
  if(written){equipmentReady=false;publishEquipment();}
  const message=written?'Change saved, but inventory could not refresh. Select Retry inventory.':errorText(error);
  status(message);equipmentStatus(message,true);
  for(const id of ['equipment-retry','inventory-retry'])if($(id))$(id).hidden=false;
  return false;
 }finally{setBusy(false);renderItems();renderEquipped();}
}
function saveEquipment(item,settings){
 if(!equipmentReady)return Promise.resolve(false);
 return mutateInventory(()=>api('/api/inventory/equipment',{method:'PATCH',...jsonBody({character_id:currentCharacter,item_id:item.id,type:settings.type,bonus:settings.bonus,equipped:settings.equipped})}));
}
function equipmentControls(item){
 const wrap=node('div','inventory-equipment');
 const toggle=node('button','equipment-toggle',item.equipment.equipped?'Unequip':'Equip');toggle.type='button';
 toggle.disabled=busy||!equipmentReady||item.quantity<1;toggle.setAttribute('aria-pressed',String(item.equipment.equipped));
 toggle.setAttribute('aria-label',(item.equipment.equipped?'Unequip ':'Equip ')+item.name);
 toggle.addEventListener('click',()=>saveEquipment(item,{...item.equipment,equipped:!item.equipment.equipped}));
 wrap.append(toggle,node('span','equipment-effect',equipmentDescription(item.equipment)));
 const details=node('details','equipment-settings');details.append(node('summary','','Equipment settings'));
 const form=node('form','equipment-settings-form');
 const typeLabel=node('label','','Type'),type=node('select');type.setAttribute('aria-label',item.name+' equipment type');
 for(const [key,rule] of Object.entries(EQUIPMENT_TYPES))type.add(new Option(rule.label,key));
 type.value=item.equipment.type;typeLabel.append(type);
 const bonusLabel=node('label','','Magic AC bonus'),bonus=node('input');bonus.type='number';bonus.min='0';bonus.max='3';bonus.step='1';bonus.required=true;bonus.value=String(item.equipment.bonus);bonus.setAttribute('aria-label',item.name+' magic AC bonus');
 bonusLabel.append(bonus);
 const updateBonus=()=>{bonusLabel.hidden=EQUIPMENT_TYPES[type.value].slot==='gear';if(bonusLabel.hidden)bonus.value='0';};
 type.addEventListener('change',updateBonus);updateBonus();
 const help=node('p','equipment-settings-hint','Choose armor or shield rules for custom names. Other gear and weapons are listed on the sheet without automatic effects.');
 const save=node('button','','Save settings');save.type='submit';
 type.disabled=bonus.disabled=save.disabled=busy||!equipmentReady;
 form.append(typeLabel,bonusLabel,help,save);
 form.addEventListener('submit',event=>{event.preventDefault();if(form.reportValidity())saveEquipment(item,{type:type.value,bonus:Number(bonus.value),equipped:item.equipment.equipped});});
 details.append(form);wrap.append(details);return wrap;
}
const status = message => { $("status").textContent = message; };
const show = (id, visible) => { $(id).hidden = !visible; };
const errorText = err => err?.message || "Something went wrong. Please try again.";
async function initialize() {
 const selectedId=sessionStorage.getItem("feywild-character-id");
 if(!selectedId){location.replace("index.html");return;}
 status("Opening your satchel...");
 let data;
 try{
  const characters=await api("/api/inventory/characters");
  // Browser storage always returns strings; API IDs may arrive as numbers.
  // Recover a stale ID using the selected character name when possible.
  const selectedName=(sessionStorage.getItem("feywild-character-name")||"").trim().toLowerCase();
  data=characters.find(character=>String(character.id)===String(selectedId));
  if(!data && selectedName) data=characters.find(character=>character.name.trim().toLowerCase()===selectedName);
 }catch(error){status("Unable to prepare inventory: "+errorText(error));equipmentStatus('Inventory could not load. Select Retry inventory.',true);for(const id of ['equipment-retry','inventory-retry'])if($(id))$(id).hidden=false;return;}
 if(!data){sessionStorage.removeItem("feywild-character-id");sessionStorage.removeItem("feywild-character-name");location.replace("index.html");return;}
 // Accept the existing database's safe character IDs, not only UUIDs.
 if(!/^[a-zA-Z0-9_-]{1,128}$/.test(String(data.id))){
  status("This character has an invalid inventory ID. Please select your character again.");
  return;
 }
 await selectCharacter(String(data.id),data.name);
 await loadCatalog();
}
async function loadCatalog() {
 let data;
 try{data=await api("/api/inventory/catalog")}catch(error){status("Could not load item catalog: "+errorText(error));return;}
 catalog = data || []; renderCatalog();
}
function renderCatalog() {
 const search = $("item-search").value.trim().toLowerCase();
 const picker = $("catalog-item"), selected = picker.value;
 picker.replaceChildren(new Option("Select an item", ""));
 for (const item of catalog.filter(x => [x.name,x.description,x.category,x.rarity].some(v => v.toLowerCase().includes(search)))) {
  picker.add(new Option(item.name + " · " + item.category + " · " + item.rarity, item.id));
 }
 if (catalog.some(x => x.id === selected) && [...picker.options].some(x => x.value === selected)) picker.value = selected;
 showCatalogDescription();
}
function showCatalogDescription() {
 const item = catalog.find(x => x.id === $("catalog-item").value);
 $("catalog-description").textContent = item ? item.description : "";
}
$("item-search").addEventListener("input", renderCatalog);
$("catalog-item").addEventListener("change", showCatalogDescription);

async function selectCharacter(id, name) {
 currentCharacter = id || null;
 if(currentCharacter){sessionStorage.setItem("feywild-character-id",String(currentCharacter));sessionStorage.setItem("feywild-character-name",name||"Adventurer");}
 show("inventory", !!currentCharacter);
 $("items").replaceChildren();
 $("inventory-title").textContent = name ? name.trim().replace(/(?:s|S)$/, match => match) + (/[sS]$/.test(name.trim()) ? "’" : "’s") + " Inventory" : "Your Inventory";
 if (currentCharacter)try{await loadItems();}catch(error){status(errorText(error));equipmentStatus('Inventory could not load. Select Retry inventory.',true);for(const id of ['equipment-retry','inventory-retry'])if($(id))$(id).hidden=false;}
}
async function loadItems() {
 const selected = currentCharacter;
 const data=await api("/api/inventory/items?character_id="+encodeURIComponent(selected));
 if(selected!==currentCharacter)return;
 if(!Array.isArray(data))throw Error('Inventory returned an unexpected response.');
 inventoryItems=data.map(item=>({...item,equipment:equipmentForItem(item,item.equipment)}));
 equipmentReady=true;
 for(const id of ['equipment-retry','inventory-retry'])if($(id))$(id).hidden=true;
 renderItems();publishEquipment();
 status(data.length ? "" : "Your satchel is empty. Add your first item!");
 equipmentStatus('Equipment changes save automatically.');
}
function renderItems(){
 const list = $("items"); list.replaceChildren();
 for (const item of inventoryItems) {
  const li = document.createElement("li"); li.className = "inventory-row";
  li.classList.toggle('is-equipped',item.equipment.equipped);li.dataset.itemId=item.id;
  const info = document.createElement("div"), name = document.createElement("strong"), description = document.createElement("p");
  name.textContent = item.name + " × " + item.quantity; description.textContent = item.description;
  info.append(name, description,equipmentControls(item));
  const actions = document.createElement("div"); actions.className = "item-actions";
  for (const [label,change] of [["−",-1],["+",1]]) {
   const button = document.createElement("button"); button.type = "button"; button.textContent = label;
   button.setAttribute("aria-label", label === "+" ? "Increase "+item.name : "Decrease "+item.name);
   button.addEventListener("click", async () => {
    await mutateInventory(()=>api("/api/inventory/items/"+encodeURIComponent(item.id),{method:"PATCH",...jsonBody({character_id:currentCharacter,amount:change})}));
   }); actions.append(button);
   button.disabled=busy;
  }
  const remove = document.createElement("button"); remove.type = "button"; remove.textContent = "Remove";
  remove.addEventListener("click", async () => {
   if (!confirm("Remove "+item.name+"?")) return;
   await mutateInventory(()=>api("/api/inventory/items/"+encodeURIComponent(item.id),{method:"DELETE",...jsonBody({character_id:currentCharacter})}));
  });
  remove.disabled=busy;
  actions.append(remove); li.append(info,actions); list.append(li);
 }
}
$("add-item").addEventListener("submit", async event => {
 event.preventDefault(); if (!currentCharacter) return;
 if(busy)return;
 const button = event.currentTarget.querySelector("button");
 const quantity = Number($("item-quantity").value);
 if (!Number.isInteger(quantity) || quantity < 1 || quantity > 999999) { status("Enter a valid quantity."); button.disabled = false; return; }
 const saved=await mutateInventory(()=>api("/api/inventory/items",{method:"POST",...jsonBody({character_id:currentCharacter,catalog_item_id:$("catalog-item").value,quantity})}));
 if(saved){
  event.target.reset();renderCatalog();
 }
 button.disabled = false;
});
for(const id of ['equipment-retry','inventory-retry'])$(id)?.addEventListener('click',async()=>{
 if(busy)return;setBusy(true);
 try{if(currentCharacter)await loadItems();else await initialize();}
 catch(error){status(errorText(error));equipmentStatus(errorText(error),true);}
 finally{setBusy(false);renderItems();renderEquipped();}
});
// Refresh when returning from another browser tab where gear may have changed.
document.addEventListener('visibilitychange',async()=>{
 if(document.visibilityState!=='visible'||!currentCharacter||busy)return;
 setBusy(true);
 try{await loadItems();}catch{equipmentReady=false;publishEquipment();equipmentStatus('Inventory could not refresh. Select Retry inventory.',true);for(const id of ['equipment-retry','inventory-retry'])if($(id))$(id).hidden=false;}
 finally{setBusy(false);renderItems();renderEquipped();}
});
initialize();
