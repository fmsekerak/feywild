/* Read-only race reference, assigned by the owner in character-details.js. */
(() => {
 const root=document.getElementById('race-panel');if(!root)return;
 const rules=window.FEYWILD_RACE_RULES,selected=document.getElementById('race-selected');
 const status=document.getElementById('race-status'),retry=document.getElementById('race-retry');
 const header=document.getElementById('profile-race'),sourceLabel=document.getElementById('profile-race-source');
 let catalog=null,loading=false;
 const node=(tag,cls,text)=>{const el=document.createElement(tag);if(cls)el.className=cls;if(text!==undefined)el.textContent=text;return el;};
 function assignment(){
  const name=document.getElementById('characterName').textContent.trim().toLowerCase();
  const entries=window.FEYWILD_CHARACTER_DETAILS||{};
  const key=Object.keys(entries).find(key=>key.trim().toLowerCase()===name);
  return entries[key]||{race:header.textContent,raceSource:''};
 }
 const current=()=>{const assigned=assignment();return catalog?.races.find(r=>r.name===assigned.race&&r.source===assigned.raceSource);};
 window.FEYWILD_RACES={walkingSpeed:()=>{
  // Keep the existing campaign fallback for custom races until their rules arrive.
  if(!assignment().raceSource)return 30;
  return rules.walkingSpeed(current());
 }};
 function reference(race){
  const block=node('div','race-reference'),dl=node('dl','race-facts');
  for(const [name,value] of rules.facts(race))dl.append(node('dt','',name),node('dd','',value));
  block.append(dl);
  if(race.traits.length){block.append(node('h5','','Trait references'));const traits=node('ul','race-traits');for(const name of race.traits)traits.append(node('li','',name));block.append(traits);}
  block.append(node('p','race-note','Trait effects, spell levels and uses, and movement restrictions follow the cited source. Only base walking speed is applied automatically.'));
  return block;
 }
 function render(){
  const assigned=assignment(),race=current();selected.replaceChildren();
  header.textContent=assigned.race||'—';sourceLabel.textContent=race?.source||'';
  selected.append(node('strong','race-selected-name',header.textContent));
  if(!assigned.raceSource){
   selected.append(node('p','race-note','Custom race — details will be added later.'));
  }else if(race){
   selected.append(node('p','race-source-label',race.sourceName+(race.page?' · p. '+race.page:'')));
   const details=node('details','race-selected-details');details.append(node('summary','','Race details'),reference(race));selected.append(details);
  }else{
   selected.append(node('p','race-note',loading?'Loading race reference…':'Race reference unavailable.'));
  }
  retry.hidden=!assigned.raceSource||loading||!!race||!!catalog;
  document.dispatchEvent(new Event('feywild:race-changed'));
 }
 async function loadCatalog(){
  if(loading)return;loading=true;status.textContent='';render();
  try{
   const response=await fetch('assets/data/races-2014.json');if(!response.ok)throw Error('HTTP '+response.status);
   const data=await response.json();
   if(!data||!Array.isArray(data.races)||!data.races.length||data.races.some(r=>!r.id||!r.name||!r.sourceName||!Array.isArray(r.traits))||new Set(data.races.map(r=>r.id)).size!==data.races.length)throw Error('Invalid catalog');
   catalog=data;
  }catch{if(assignment().raceSource)status.textContent='Could not load the race reference. Please retry.';}
  finally{loading=false;render();}
 }
 document.addEventListener('feywild:profile-loaded',render);
 retry.addEventListener('click',loadCatalog);
 loadCatalog();
})();
