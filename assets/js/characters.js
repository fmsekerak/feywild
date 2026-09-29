import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from "./supabase-config.js";
const $ = id => document.getElementById(id);
const db = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
let currentCharacter = null;
const status = message => { $("status").textContent = message; };
const show = (id, visible) => { $(id).hidden = !visible; };
const errorText = err => err?.message || "Something went wrong. Please try again.";
async function initialize() {
 const { data: { session }, error } = await db.auth.getSession();
 if (error) { status(errorText(error)); return; }
 show("auth", !session); show("signed-in", !!session);
 if (!session) { status("Sign in with Google to access your characters."); return; }
 $("account").textContent = session.user.email || "Signed in";
 await loadCharacters();
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
  character_id:currentCharacter, name:$("item-name").value.trim(),
  description:$("item-description").value.trim(), quantity
 });
 if (error) status(errorText(error)); else { event.target.reset(); await loadItems(); }
 button.disabled = false;
});
initialize();
