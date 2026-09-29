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
 const { data: { session }, error } = await db.auth.getSession();
 if (error) { status(errorText(error)); return; }
 show("auth", !session); show("signed-in", !!session);
 if (!session) { status("Sign in with Google to access your characters."); return; }
 $("account").textContent = session.user.email || "Signed in";
 await Promise.all([loadCharacters(), loadCatalog(), checkDm()]);
}
$("login").addEventListener("click", async () => {
 const { error } = await db.auth.signInWithOAuth({
  provider: "google", options: { redirectTo: new URL("characters.html", location.href).href }
 });
 if (error) status(errorText(error));
});
$("logout").addEventListener("click", async () => {
 const { error } = await db.auth.signOut();
 if (error) status(errorText(error));
 else { currentCharacter = null; $("items").replaceChildren(); show("inventory",false); await initialize(); }
});
db.auth.onAuthStateChange(() => { setTimeout(initialize, 0); });
// The crafting search page uses this same published spreadsheet.
const CRAFTING_CSV = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTGEGjryoMoYyFZIWPFrYLLO9M9Z0zq0lbIB4xIe-_-VqRwAQ6KP2ley9HpuDokO9i07lbDD4CnKqVT/pub?gid=1358917249&single=true&output=csv";
async function checkDm() {
 const { data, error } = await db.rpc("is_dm");
 if (!error) show("catalog-admin", data === true);
}
function parseCsv(text) {
 const rows = []; let row=[], field="", quoted=false;
 for (let i=0;i<text.length;i++) {
  const ch=text[i];
  if (ch==='"') { if (quoted && text[i+1]==='"') {field+='"';i++;} else quoted=!quoted; }
  else if (ch==="," && !quoted) {row.push(field);field="";}
  else if ((ch==="\\r"||ch==="\\n")&&!quoted) {
   if(ch==="\\r"&&text[i+1]==="\\n") i++;
   row.push(field);if(row.some(x=>x.trim()))rows.push(row);row=[];field="";
  } else field+=ch;
 }
 if(quoted)throw Error("Unclosed quoted field in crafting spreadsheet");
 if(field||row.length){row.push(field);if(row.some(x=>x.trim()))rows.push(row);}
 const headers=(rows.shift()||[]).map(x=>x.replace(/^\\uFEFF/,"").trim().toLowerCase().replace(/\\(.*?\\)/g,"").replace(/\\s+/g,"_").replace(/[^\\w]/g,""));
 return rows.map(r=>Object.fromEntries(headers.map((h,i)=>[h,(r[i]||"").trim()])));
}
$("sync-crafting").addEventListener("click", async () => {
 const button=$("sync-crafting");button.disabled=true;status("Importing crafting recipes...");
 try {
  const response=await fetch(CRAFTING_CSV,{cache:"no-store"});
  if(!response.ok)throw Error("Could not fetch crafting spreadsheet ("+response.status+")");
  const csv=await response.text();
  if(/^\\s*<!doctype html|^\\s*<html/i.test(csv))throw Error("Spreadsheet returned HTML, not CSV");
  const recipes=parseCsv(csv), unique=new Map();
  for(const recipe of recipes){
   const name=(recipe.name||recipe.item_name||"").trim();
   if(!name)continue;
   const professionKey=Object.keys(recipe).find(k=>/profess|branch|category|crafting_type|type_of_craft/.test(k)&&recipe[k]);
   const rarityKey=Object.keys(recipe).find(k=>/rarity/.test(k)&&recipe[k]);
   const category=professionKey?recipe[professionKey]:"Crafting";
   const rarity=rarityKey?recipe[rarityKey]:"Common";
   // Keep the existing description column; crafting details remain on the crafting page.
   unique.set(name.toLowerCase(),{name,description:recipe.description||"",category:category.slice(0,200),rarity:rarity.slice(0,100)});
  }
  if(!unique.size)throw Error("No named recipes were found in the spreadsheet");
  const rows=[...unique.values()];
  // Upsert in small batches; database RLS permits only DMs to import.
  for(let i=0;i<rows.length;i+=100){
   const {error}=await db.from("item_catalog").upsert(rows.slice(i,i+100),{onConflict:"name"});
   if(error)throw error;
  }
  await loadCatalog();
  status("Imported or updated "+rows.length+" crafting items. They are now available to select.");
 } catch(error){status("Import failed: "+errorText(error));}
 finally{button.disabled=false;}
});
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
async function loadCharacters() {
 const { data, error } = await db.from("characters").select("id,name").order("name");
 if (error) { status(errorText(error)); return; }
 const select = $("character"); select.replaceChildren(new Option("Choose your character", ""));
 for (const character of data) select.add(new Option(character.name, character.id));
 status(data.length ? "Choose your character to see their satchel." : "Your Google login worked! Ask your DM to approve your account and assign a character.");
}
$("character").addEventListener("change", async e => {
 currentCharacter = e.target.value || null; show("inventory", !!currentCharacter);
 $("items").replaceChildren(); $("character-name").textContent = e.target.selectedOptions[0]?.textContent || "";
 if (currentCharacter) await loadItems();
});
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
 if (error) status(errorText(error)); else { event.target.reset(); renderCatalog(); await loadItems(); }
 button.disabled = false;
});
initialize();
