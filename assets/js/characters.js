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
 status("Gathering the adventurers...");
 const { data, error } = await db.from("characters").select("id,name").order("name");
 if (error) { status("Unable to load characters: " + errorText(error) + ". Has the public inventory SQL been run?"); return; }
 const picker = $("character");
 picker.replaceChildren(new Option("Choose your character", ""));
 for (const character of data || []) picker.add(new Option(character.name, character.id));
 status(data?.length ? "Choose any character to open their satchel. Changes are saved automatically." :
  "No characters yet. Add one in the Supabase Table Editor.");
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
 show("inventory", !!currentCharacter);
 $("items").replaceChildren();
 $("history").replaceChildren();
 $("character-name").textContent = name || "";
 if (currentCharacter) await Promise.all([loadItems(),loadHistory()]);
}
$("character").addEventListener("change", async event => {
 await selectCharacter(event.target.value,event.target.selectedOptions[0]?.textContent);
});
async function loadHistory() {
 const selected = currentCharacter;
 const { data, error } = await db.from("inventory_history")
  .select("action,item_name,old_quantity,new_quantity,changed_at")
  .eq("character_id",selected).order("changed_at",{ascending:false}).limit(50);
 if (selected !== currentCharacter) return;
 const list = $("history"); list.replaceChildren();
 if (error) { status("Unable to load history: " + errorText(error)); return; }
 if (!data.length) { const empty=document.createElement("li"); empty.textContent="No changes recorded yet.";list.append(empty);return; }
 for (const change of data) {
  const row=document.createElement("li");
  const when=new Date(change.changed_at).toLocaleString();
  const detail=change.action==="added" ? "Added ×"+change.new_quantity :
   change.action==="removed" ? "Removed ×"+change.old_quantity :
   "Changed ×"+change.old_quantity+" → ×"+change.new_quantity;
  row.textContent=when+" · "+change.item_name+" · "+detail;
  list.append(row);
 }
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
    if (error) status(errorText(error)); else await Promise.all([loadItems(),loadHistory()]);
    button.disabled = false;
   }); actions.append(button);
  }
  const remove = document.createElement("button"); remove.type = "button"; remove.textContent = "Remove";
  remove.addEventListener("click", async () => {
   if (!confirm("Remove "+item.name+"?")) return;
   remove.disabled = true;
   const { error } = await db.from("inventory_items").delete().eq("id",item.id).eq("character_id",selected);
   if (error) status(errorText(error)); else await Promise.all([loadItems(),loadHistory()]);
   remove.disabled = false;
  });
  actions.append(remove); li.append(info,actions); list.append(li);
 }
 status(data.length ? "Inventory loaded." : "Your satchel is empty. Add your first item!");
}
$("add-item").addEventListener("submit", async event => {
 event.preventDefault(); if (!currentCharacter) return;
 const button = event.currentTarget.querySelector("button"); button.disabled = true;
 const quantity = Number($("item-quantity").value);
 if (!Number.isInteger(quantity) || quantity < 1 || quantity > 999999) { status("Enter a valid quantity."); button.disabled = false; return; }
 const { error } = await db.from("inventory_items").insert({
  character_id:currentCharacter, catalog_item_id:$("catalog-item").value, quantity
 });
 if (error) status(errorText(error)); else { event.target.reset(); renderCatalog(); await Promise.all([loadItems(),loadHistory()]); }
 button.disabled = false;
});
initialize();
