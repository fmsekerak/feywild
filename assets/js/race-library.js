/* A source-aware race picker; compact selection stays in the existing profile. */
(() => {
 const root=document.getElementById('race-panel'),storage=document.getElementById('raceSelection2014');
 if(!root||!storage)return;
 const rules=window.FEYWILD_RACE_RULES,selected=document.getElementById('race-selected'),results=document.getElementById('race-results');
 const search=document.getElementById('race-search'),source=document.getElementById('race-source');
 const status=document.getElementById('race-status'),count=document.getElementById('race-result-count');
 const browse=document.getElementById('race-browse'),more=document.getElementById('race-more'),retry=document.getElementById('race-retry'),reset=document.getElementById('race-reset');
 const header=document.getElementById('profile-race'),sourceLabel=document.getElementById('profile-race-source');
 let catalog=null,profileLoaded=false,loading=false,limit=20,originalRace=header.textContent;
 const node=(tag,cls,text)=>{const el=document.createElement(tag);if(cls)el.className=cls;if(text!==undefined)el.textContent=text;return el;};
 const current=()=>{const s=rules.selection(storage.value);return s&&catalog?.races.find(r=>r.id===s.id);};
 window.FEYWILD_RACES={walkingSpeed:()=>{
  const s=rules.selection(storage.value);if(!s)return 30;
  return rules.walkingSpeed(current());
 }};
 function reference(race){
  const block=node('div','race-reference');
  const notes=[];
  if(race.npcOption)notes.push('DMG NPC option — check with your DM before using for a player character.');
  if(race.hasSubraces)notes.push('Subraces are available below; choose one for its additional traits.');
  if(race.hasVariants)notes.push('Some values are alternatives. Choose a named variant to narrow these options.');
  for(const note of notes)block.append(node('p','race-note',note));
  const dl=node('dl','race-facts');
  for(const [name,value] of rules.facts(race))dl.append(node('dt','',name),node('dd','',value));
  block.append(dl);
  if(race.traits.length){block.append(node('h5','','Trait references'));const traits=node('ul','race-traits');for(const name of race.traits)traits.append(node('li','',name));block.append(traits);}
  block.append(node('p','race-note','Trait effects, spell levels and uses, and movement restrictions follow the cited source. Only base walking speed is applied automatically.'));
  return block;
 }
 function sourceText(race){return race.sourceName+(race.page?' · p. '+race.page:'')+(race.baseSource&&race.baseSource!==race.source?' · base: '+catalog.sources[race.baseSource]:'');}
 function renderSelected(){
  const s=rules.selection(storage.value),race=current();selected.replaceChildren();
  reset.hidden=!storage.value;reset.disabled=!profileLoaded;
  if(!profileLoaded){selected.append(node('p','race-note','Loading character…'));return;}
  if(race){
   header.textContent=race.name;sourceLabel.textContent=race.source;
   selected.append(node('strong','race-selected-name',race.name),node('p','race-source-label',sourceText(race)));
   const details=node('details','race-selected-details');details.append(node('summary','','Race details'),reference(race));selected.append(details);
  }else{
   header.textContent=s?.name||originalRace;sourceLabel.textContent='';
   selected.append(node('strong','race-selected-name',header.textContent),node('p','race-note',s?'This saved race reference is unavailable. Your selection is preserved.': 'Choose a sourcebook version to link its race reference and walking speed.'));
  }
 }
 function choose(race){
  if(!profileLoaded||!catalog)return;
  storage.value=JSON.stringify({id:race.id,name:race.name});storage.dispatchEvent(new Event('input',{bubbles:true}));
  renderSelected();renderResults();document.dispatchEvent(new Event('feywild:race-changed'));
  status.textContent='Race selected. Save Character to keep this choice.';
  browse.open=false;document.getElementById('race-browse-summary').focus();
 }
 function renderResults(){
  results.replaceChildren();more.hidden=true;
  if(!catalog){count.textContent='';return;}
  const query=search.value.trim().toLowerCase(),saved=rules.selection(storage.value)?.id;
  const rows=catalog.races.filter(r=>(!source.value||r.source===source.value)&&(!query||[r.name,r.source,r.sourceName,...r.traits].join(' ').toLowerCase().includes(query)));
  count.textContent=rows.length+' matching '+(rows.length===1?'option':'options')+(rows.length>limit?' · showing '+limit:'');
  if(!rows.length)results.append(node('p','race-note','No races match. Try another name or sourcebook.'));
  for(const race of rows.slice(0,limit)){
   const card=node('article','race-card');card.dataset.raceId=race.id;
   const top=node('div','race-card-heading'),heading=node('div');heading.append(node('strong','',race.name),node('small','race-source-label',sourceText(race)));
   const button=node('button','race-select',saved===race.id?'Selected':'Choose');button.type='button';button.disabled=!profileLoaded||saved===race.id;button.setAttribute('aria-label','Choose '+race.name+' — '+race.source);button.setAttribute('aria-pressed',String(saved===race.id));button.addEventListener('click',()=>choose(race));top.append(heading,button);card.append(top);
   const details=node('details','race-preview');details.append(node('summary','','Preview traits'),reference(race));card.append(details);results.append(card);
  }
  more.hidden=rows.length<=limit;
 }
 function sync(){renderSelected();renderResults();document.dispatchEvent(new Event('feywild:race-changed'));}
 async function loadCatalog(){
  if(loading)return;loading=true;retry.hidden=true;status.textContent='Loading races…';
  try{
   const response=await fetch('assets/data/races-2014.json');if(!response.ok)throw Error('HTTP '+response.status);
   const data=await response.json();
   if(!data||!Array.isArray(data.races)||!data.races.length||!data.sources||data.races.some(r=>!r.id||!r.name||!r.sourceName||!Array.isArray(r.traits))||new Set(data.races.map(r=>r.id)).size!==data.races.length)throw Error('Invalid catalog');
   catalog=data;source.replaceChildren(new Option('All sourcebooks',''),...Object.entries(data.sources).sort((a,b)=>a[1].localeCompare(b[1])).map(([id,name])=>new Option(name,id)));
   search.disabled=false;source.disabled=false;status.textContent='';sync();
  }catch{status.textContent='Could not load the race library. Retry to view your race reference.';retry.hidden=false;sync();}
  finally{loading=false;}
 }
 document.getElementById('choose-race').addEventListener('click',()=>{
  document.getElementById('tab-stats').click();browse.open=true;root.scrollIntoView({block:'start',behavior:'smooth'});search.focus();
 });
 document.addEventListener('feywild:profile-loaded',()=>{profileLoaded=true;originalRace=header.textContent;sync();});
 reset.addEventListener('click',()=>{if(!profileLoaded)return;storage.value='';storage.dispatchEvent(new Event('input',{bubbles:true}));sync();status.textContent='Original race restored. Save Character to keep this choice.';});
 for(const control of [search,source])control.addEventListener(control===search?'input':'change',()=>{limit=20;renderResults();});
 more.addEventListener('click',()=>{limit+=20;renderResults();});
 retry.addEventListener('click',loadCatalog);
 renderSelected();loadCatalog();
})();
