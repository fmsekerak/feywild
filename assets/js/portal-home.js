const characterId=sessionStorage.getItem("feywild-character-id");
const characterName=sessionStorage.getItem("feywild-character-name");
if(!characterId){location.replace("index.html");}
else {
 const greeting=document.getElementById("portal-greeting");
 if(greeting)greeting.textContent="✧ Welcome, "+(characterName||"Adventurer")+"!";
}