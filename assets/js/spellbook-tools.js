/* Interactive spell slots, stored in the existing character profile D1 record. */
(() => {
 const root=document.getElementById("spell-slot-tracker");
 const field=document.getElementById("spellSlotTracker");
 if(!root||!field)return;
 const status=document.getElementById("spell-slot-status");
 const MAX=30;
 let slots={};
 const clamp=n=>Math.max(0,Math.min(MAX,Number.isFinite(n)?Math.floor(n):0));
 function read(){
  let parsed={};
  try{parsed=JSON.parse(field.value||"{}")}catch{}
  if(!parsed||typeof parsed!=="object"||Array.isArray(parsed))parsed={};
  slots={};
  for(let i=1;i<=9;i++){
   const row=parsed[i];
   const total=clamp(Number(row?.total));
   slots[i]={total,used:Math.min(total,clamp(Number(row?.used)))};
  }
 }
 function persist(message){
  field.value=JSON.stringify(slots);
  status.textContent=message||"Unsaved changes · Select Save Character";
  document.dispatchEvent(new Event("feywild:slots-changed"));
 }
 function render(){
  root.replaceChildren();
  for(let level=1;level<=9;level++){
   const slot=slots[level];
   const row=document.createElement("div");row.className="spell-slot-row";
   const title=document.createElement("span");title.className="spell-slot-label";title.textContent="Level "+level;
   const setting=document.createElement("label");setting.className="spell-slot-total-label";setting.textContent="Total";
   const input=document.createElement("input");input.type="number";input.min="0";input.max=String(MAX);input.step="1";input.value=String(slot.total);
   input.setAttribute("aria-label","Total level "+level+" spell slots");
   input.addEventListener("change",()=>{
    const n=Number(input.value);
    if(!Number.isInteger(n)||n<0||n>MAX){input.value=String(slot.total);return}
    slot.total=n;slot.used=Math.min(slot.used,n);persist();render();
   });
   setting.append(input);
   const crystals=document.createElement("div");crystals.className="spell-slot-crystals";
   crystals.setAttribute("aria-label","Level "+level+" slots");
   for(let index=0;index<slot.total;index++){
    const crystal=document.createElement("button");crystal.type="button";
    const spent=index>=slot.total-slot.used;
    crystal.className="spell-slot-crystal"+(spent?" spent":"");
    crystal.textContent="◆";
    crystal.setAttribute("aria-pressed",String(!spent));
    crystal.setAttribute("aria-label","Level "+level+" slot "+(index+1)+": "+(spent?"expended; restore":"available; expend"));
    crystal.title=spent?"Restore this slot":"Expend this slot";
    crystal.addEventListener("click",()=>{slot.used=clamp(slot.used+(spent?-1:1));persist();render()});
    crystals.append(crystal);
   }
   if(!slot.total){const empty=document.createElement("span");empty.className="spell-slot-empty";empty.textContent="No slots";crystals.append(empty)}
   const left=document.createElement("span");left.className="spell-slot-remaining";left.textContent=(slot.total-slot.used)+"/"+slot.total+" left";
   row.append(title,setting,crystals,left);root.append(row);
  }
 }
 function spend(level){
  const slot=slots[level];
  if(!slot||slot.used>=slot.total)return false;
  slot.used++;persist("Level "+level+" slot expended · Select Save Character");render();return true;
 }
 document.getElementById("spell-restore-all").addEventListener("click",()=>{
  if(!Object.values(slots).some(s=>s.used))return;
  if(!window.confirm("Restore all expended spell slots?"))return;
  for(const slot of Object.values(slots))slot.used=0;
  persist("All slots restored · Select Save Character");render();
 });
 document.addEventListener("feywild:profile-loaded",()=>{read();render();status.textContent="Slots loaded from character profile"});
 document.addEventListener("feywild:spend-slot",event=>{
  const level=Number(event.detail?.level);
  if(!Number.isInteger(level)||level<1||level>9)return;
  if(!spend(level))status.textContent="No level "+level+" slots remaining.";
 });
 window.FEYWILD_SPELL_SLOTS={
  remaining(level){const s=slots[level];return s?Math.max(0,s.total-s.used):0},
  spend
 };
 read();render();
})();
