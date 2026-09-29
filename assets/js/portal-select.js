import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY } from "./supabase-config.js";
const db=createClient(SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY);
const grid=document.getElementById("portal-characters"),status=document.getElementById("portal-status");
async function load(){
 const {data,error}=await db.from("characters").select("id,name").order("name");
 if(error){status.textContent="Could not load characters. Check that the public inventory SQL migration has been run.";return;}
 const characters=data||[];
 if(!characters.length){status.textContent="No characters yet. Add characters in your Supabase Table Editor.";return;}
 for(const character of characters){
  const button=document.createElement("button");button.type="button";button.className="portal-character";
  const symbol=document.createElement("span");symbol.className="portal-character-symbol";symbol.setAttribute("aria-hidden","true");symbol.textContent=character.name.trim().toLowerCase()==="dm"?"♛":"✧";
  const name=document.createElement("strong");name.textContent=character.name;
  const caption=document.createElement("span");caption.textContent=character.name.trim().toLowerCase()==="dm"?"Enter as Dungeon Master":"Enter the Feywild";
  button.append(symbol,name,caption);
  button.addEventListener("click",()=>{sessionStorage.setItem("feywild-character-id",character.id);sessionStorage.setItem("feywild-character-name",character.name);location.href="home.html";});
  grid.append(button);
 }
 status.textContent="";
}
load();