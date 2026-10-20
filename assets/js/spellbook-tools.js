/* Spell crystals and class-level totals, saved inside the existing D1 profile. */
(() => {
 const root=document.getElementById('spell-slot-tracker');
 const field=document.getElementById('spellSlotTracker');
 if(!root||!field)return;
 const status=document.getElementById('spell-slot-status');
 const mode=document.getElementById('spellSlotMode');
 const hint=document.getElementById('spell-slot-mode-hint');
 const backup=document.getElementById('spellSlotManualBackup');
 const level=document.getElementById('characterLevel');
 const rules=window.FEYWILD_LEVEL_RULES;
 const MAX=30;
 let slots={},previousMode='manual',profileLoaded=false;
 const clamp=n=>Math.max(0,Math.min(MAX,Number.isFinite(n)?Math.floor(n):0));
 function parse(value){
  let parsed={};
  try{parsed=JSON.parse(value||'{}')}catch{}
  if(!parsed||typeof parsed!=='object'||Array.isArray(parsed))parsed={};
  const result={};
  for(let i=1;i<=9;i++){
   const row=parsed[i],total=clamp(Number(row?.total));
   result[i]={total,used:Math.min(total,clamp(Number(row?.used)))};
  }
  return result;
 }
 function read(){slots=parse(field.value);}
 function persist(message){
  field.value=JSON.stringify(slots);
  status.textContent=message||'Unsaved changes · Select Save Character';
  document.dispatchEvent(new Event('feywild:slots-changed'));
 }
 function classSlots(){return rules?.slotsFor(null,level?.value);}
 function updateHint(){
  if(!hint)return;
  if(mode.value==='manual')hint.textContent='Custom spell slot totals. Changing level will not overwrite them.';
  else if(rules?.getClass()==='warlock')hint.textContent='Warlock Pact Magic slots (short-rest recharge); Mystic Arcanum uses are not included.';
  else hint.textContent='2014 single-class slot totals. Expended slots are kept when you change level.';
 }
 function applyAutomatic(){
  const totals=classSlots();
  if(totals===null){
   mode.value='manual';previousMode='manual';
   if(hint)hint.textContent='Unknown class: use Manual totals until this class is configured.';
   return false;
  }
  for(let i=1;i<=9;i++){
   const total=clamp(totals[i-1]||0);
   slots[i]={total,used:Math.min(total,slots[i]?.used||0)};
  }
  persist('Class and level slot totals updated · Select Save Character');
  return true;
 }
 function render(){
  updateHint();
  root.replaceChildren();
  for(let spellLevel=1;spellLevel<=9;spellLevel++){
   const slot=slots[spellLevel];
   const row=document.createElement('div');row.className='spell-slot-row';
   const title=document.createElement('span');title.className='spell-slot-label';title.textContent='Level '+spellLevel;
   const setting=document.createElement('label');setting.className='spell-slot-total-label';setting.textContent='Total';
   const input=document.createElement('input');input.type='number';input.min='0';input.max=String(MAX);input.step='1';input.value=String(slot.total);
   input.readOnly=mode.value==='auto';input.title=input.readOnly?'Set by class and level':'Custom slot total';
   input.setAttribute('aria-label','Total level '+spellLevel+' spell slots');
   input.addEventListener('change',()=>{
    if(mode.value==='auto')return;
    const n=Number(input.value);
    if(!Number.isInteger(n)||n<0||n>MAX){input.value=String(slot.total);return}
    slot.total=n;slot.used=Math.min(slot.used,n);persist();render();
   });
   setting.append(input);
   const crystals=document.createElement('div');crystals.className='spell-slot-crystals';
   crystals.setAttribute('aria-label','Level '+spellLevel+' slots');
   for(let index=0;index<slot.total;index++){
    const crystal=document.createElement('button');crystal.type='button';
    const spent=index>=slot.total-slot.used;
    crystal.className='spell-slot-crystal'+(spent?' spent':'');
    crystal.textContent='◆';
    crystal.setAttribute('aria-pressed',String(!spent));
    crystal.setAttribute('aria-label','Level '+spellLevel+' slot '+(index+1)+': '+(spent?'expended; restore':'available; expend'));
    crystal.title=spent?'Restore this slot':'Expend this slot';
    crystal.addEventListener('click',()=>{slot.used=clamp(slot.used+(spent?-1:1));persist();render()});
    crystals.append(crystal);
   }
   if(!slot.total){const empty=document.createElement('span');empty.className='spell-slot-empty';empty.textContent='No slots';crystals.append(empty)}
   const left=document.createElement('span');left.className='spell-slot-remaining';left.textContent=(slot.total-slot.used)+'/'+slot.total+' left';
   row.append(title,setting,crystals,left);root.append(row);
  }
 }
 function spend(spellLevel){
  const slot=slots[spellLevel];
  if(!slot||slot.used>=slot.total)return false;
  slot.used++;persist('Level '+spellLevel+' slot expended · Select Save Character');render();return true;
 }
 mode.addEventListener('change',()=>{
  if(mode.value==='auto'){
   const totals=classSlots();
   if(totals===null){mode.value='manual';updateHint();return}
   if(previousMode==='manual')backup.value=JSON.stringify(slots);
   applyAutomatic();
  }else if(previousMode==='auto'&&backup.value){
   slots=parse(backup.value);persist('Your previous manual slot totals restored · Select Save Character');
  }
  previousMode=mode.value;render();
 });
 document.getElementById('spell-restore-all').addEventListener('click',()=>{
  if(!Object.values(slots).some(s=>s.used))return;
  if(!window.confirm('Restore all expended spell slots?'))return;
  for(const slot of Object.values(slots))slot.used=0;
  persist('All slots restored · Select Save Character');render();
 });
 document.addEventListener('feywild:profile-loaded',()=>{
  read();
  profileLoaded=true;
  previousMode=mode.value;
  if(mode.value==='auto')applyAutomatic();
  render();
  if(mode.value==='manual')status.textContent='Manual slots loaded from character profile';
 });
 document.addEventListener('feywild:level-changed',()=>{
  if(!profileLoaded)return;
  if(mode.value==='auto'){if(applyAutomatic())render();}
  else updateHint();
 });
 document.addEventListener('feywild:spend-slot',event=>{
  const spellLevel=Number(event.detail?.level);
  if(!Number.isInteger(spellLevel)||spellLevel<1||spellLevel>9)return;
  if(!spend(spellLevel))status.textContent='No level '+spellLevel+' slots remaining.';
 });
 window.FEYWILD_SPELL_SLOTS={
  remaining(spellLevel){const s=slots[spellLevel];return s?Math.max(0,s.total-s.used):0},
  spend
 };
 read();render();
})();
