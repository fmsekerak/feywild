import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from "./supabase-config.js";
const $ = id => document.getElementById(id);
const db = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
let currentCharacter = null;
let catalog = [];
const status = message => { $("status").textContent = message; };
const show = (id, visible) => { $(id).hidden = !visible; };
const errorText = err => err?.message || "Something went wrong. Please try again.";
async function initialize() {
 const selectedId=sessionStorage.getItem("feywild-character-id");
 if(!selectedId){location.replace("index.html");return;}
 status("Opening your satchel...");
 // Keep the inventory accessible under the public Supabase policies.
 const {data:{session},error:sessionError}=await db.auth.getSession();
 if(sessionError){status("Unable to prepare inventory: "+errorText(sessionError));return;}
 if(session){const {error}=await db.auth.signOut({scope:"local"});if(error){status(errorText(error));return;}}
 const {data,error}=await db.from("characters").select("id,name").eq("id",selectedId).maybeSingle();
 if(error||!data){sessionStorage.removeItem("feywild-character-id");sessionStorage.removeItem("feywild-character-name");location.replace("index.html");return;}
 await selectCharacter(data.id,data.name);
 await loadCatalog();
}
async function loadCatalog() {
 const { data, error } = await db.from("item_catalog").select("id,name,description,category,rarity").order("name");
 if (error) { status("Could not load item catalog: " + errorText(error)); return; }
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
 if (currentCharacter) await loadItems();
}
async function loadItems() {
 const selected = currentCharacter;
 const { data, error } = await db.from("inventory_items").select("id,name,description,quantity").eq("character_id", selected).order("name");
 if (selected !== currentCharacter) return;
 if (error) { status(errorText(error)); return; }
 const list = $("items"); list.replaceChildren();
 for (const item of data) {
  const li = document.createElement("li"); li.className = "inventory-row";
  const info = document.createElement("div"), name = document.createElement("strong"), description = document.createElement("p");
  name.textContent = item.name + " × " + item.quantity; description.textContent = item.description;
  info.append(name, description);
  const actions = document.createElement("div"); actions.className = "item-actions";
  for (const [label,change] of [["−",-1],["+",1]]) {
   const button = document.createElement("button"); button.type = "button"; button.textContent = label;
   button.setAttribute("aria-label", label === "+" ? "Increase "+item.name : "Decrease "+item.name);
   button.addEventListener("click", async () => {
    button.disabled = true;
    const { error } = await db.rpc("adjust_inventory_quantity", { item_id:item.id, amount:change });
    if (error) status(errorText(error)); else await loadItems();
    button.disabled = false;
   }); actions.append(button);
  }
  const remove = document.createElement("button"); remove.type = "button"; remove.textContent = "Remove";
  remove.addEventListener("click", async () => {
   if (!confirm("Remove "+item.name+"?")) return;
   remove.disabled = true;
   const { error } = await db.from("inventory_items").delete().eq("id",item.id).eq("character_id",selected);
   if (error) status(errorText(error)); else await loadItems();
   remove.disabled = false;
  });
  actions.append(remove); li.append(info,actions); list.append(li);
 }
 status(data.length ? "" : "Your satchel is empty. Add your first item!");
}
$("add-item").addEventListener("submit", async event => {
 event.preventDefault(); if (!currentCharacter) return;
 const button = event.currentTarget.querySelector("button"); button.disabled = true;
 const quantity = Number($("item-quantity").value);
 if (!Number.isInteger(quantity) || quantity < 1 || quantity > 999999) { status("Enter a valid quantity."); button.disabled = false; return; }
 const { error } = await db.from("inventory_items").insert({
  character_id:currentCharacter, catalog_item_id:$("catalog-item").value, quantity
 });
 if (error) status(errorText(error)); else { event.target.reset(); renderCatalog(); await loadItems(); }
 button.disabled = false;
});
initialize();
