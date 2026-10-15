const grid=document.getElementById("portal-characters"),dmGrid=document.getElementById("portal-dm"),dmSection=document.getElementById("portal-dm-section"),status=document.getElementById("portal-status");
async function load(){
 let characters;
 try{
  const response=await fetch("/api/inventory/characters",{cache:"no-store"});
  if(!response.ok)throw Error("Could not load characters.");
  characters=await response.json();
 }catch{status.textContent="Could not load characters. Please refresh and try again.";return;}
 if(!characters.length){status.textContent="No characters found in the database.";return;}
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
  button.addEventListener("click",()=>{sessionStorage.setItem("feywild-character-id",character.id);sessionStorage.setItem("feywild-character-name",character.name);location.href=theme==="dm"?"home.html":"character-profile.html";});
  if(character.name.trim().toLowerCase()==="dm") { dmSection.hidden=false;dmGrid.append(button); }
  else grid.append(button);
 }
 status.textContent="";
}
load();