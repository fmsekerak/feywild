import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY } from "./supabase-config.js";
const db=createClient(SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY);
const grid=document.getElementById("portal-characters"),dmGrid=document.getElementById("portal-dm"),dmSection=document.getElementById("portal-dm-section"),status=document.getElementById("portal-status");
async function load(){
 // A previously saved Google session should not hide characters behind old RLS.
 const {data:{session},error:sessionError}=await db.auth.getSession();
 if(sessionError){status.textContent="Could not prepare character selection. Refresh and try again.";return;}
 if(session){
  const {error:signOutError}=await db.auth.signOut({scope:"local"});
  if(signOutError){status.textContent="Could not clear your old session. Clear this site's browser data and reload.";return;}
 }
 const {data,error}=await db.from("characters").select("id,name").order("name");
 if(error){status.textContent="Could not load characters. Check that the public inventory SQL migration has been run.";return;}
 const characters=data||[];
 if(!characters.length){status.textContent="No characters yet. Add characters in your Supabase Table Editor.";return;}
 for(const character of characters){
  const button=document.createElement("button");button.type="button";button.className="portal-character";
  const theme=character.name.trim().toLowerCase();
  if(["mion","ruin","crotus","hayden","dm"].includes(theme)) button.classList.add("portal-theme-"+theme);
  const symbol=document.createElement("span");symbol.className="portal-character-symbol";symbol.setAttribute("aria-hidden","true");const icons={mion:"🦊",ruin:"🌸",crotus:"🐐",hayden:"❄",dm:"🐉"};
  if(Object.hasOwn(icons,theme)){
   const portrait=document.createElement("img");
   portrait.src="assets/images/"+theme+"-icon.png";
   portrait.alt="";portrait.className="portal-character-portrait";
   portrait.decoding="async";
   portrait.onerror=()=>{portrait.remove();symbol.textContent=icons[theme];};
   symbol.append(portrait);
  }else symbol.textContent="✧";
  const name=document.createElement("strong");name.textContent=character.name;
  button.append(symbol,name);
  button.addEventListener("click",()=>{sessionStorage.setItem("feywild-character-id",character.id);sessionStorage.setItem("feywild-character-name",character.name);location.href="home.html";});
  if(character.name.trim().toLowerCase()==="dm") { dmSection.hidden=false;dmGrid.append(button); }
  else grid.append(button);
 }
 status.textContent="";
}
load();