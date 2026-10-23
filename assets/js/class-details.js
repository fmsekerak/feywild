/* 2014 Artificer reference. Browsing never writes profile data or applies bonuses. */
(() => {
 'use strict';
 const $=id=>document.getElementById(id),rules=window.FEYWILD_LEVEL_RULES;
 const saved=$('classSpecialist2014'),view=$('class-specialist-view');
 let data=null,loading=false,ready=false;
 const el=(tag,text,cls)=>{const node=document.createElement(tag);if(text!==undefined)node.textContent=text;if(cls)node.className=cls;return node;};
 const level=()=>rules.atLevel($('characterLevel').value)||1;
 const className=()=>rules.getClass();
 const intMod=()=>{const raw=document.querySelector('[name="int"]')?.value?.trim();const n=Number(raw);return raw&&Number.isFinite(n)&&n>=1&&n<=30?Math.floor((n-10)/2):null;};
 const chosen=()=>data?.subclasses.find(s=>saved.value==='artificer:'+s.id);
 const all=()=>$('class-level-filter').value==='all';
 const visible=f=>all()||f.level<=level();
 const signed=n=>n===null?'—':(n>=0?'+':'')+n;
 function metric(label,value){const box=el('div',undefined,'class-metric');box.append(el('span',label),el('strong',String(value)));return box;}
 function facts(rows){const dl=el('dl',undefined,'class-facts');for(const [name,text] of rows)dl.append(el('dt',name),el('dd',text));return dl;}
 function table(headers,rows,label){const wrap=el('div',undefined,'class-table-scroll');wrap.tabIndex=0;wrap.setAttribute('role','region');wrap.setAttribute('aria-label',label);const t=el('table'),head=el('thead'),tr=el('tr');for(const h of headers){const th=el('th',h);th.scope='col';tr.append(th);}head.append(tr);const body=el('tbody');for(const row of rows){const r=el('tr');for(const value of row)r.append(el('td',String(value)));body.append(r);}t.append(head,body);wrap.append(t);return wrap;}
 function card(f,key,context=''){const box=el('details',undefined,'class-reference-card'+(f.level>level()?' class-future':''));box.dataset.classKey=key;const title=el('summary',f.name),status=f.level>level()?'Later':'Available';title.append(el('small',`${context?context+' · ':''}${status} · Level ${f.level}`));box.append(title);for(const p of f.paragraphs||[])box.append(el('p',p));return box;}
 function replaceKeepingOpen(id,nodes){const root=$(id),open=new Set([...root.querySelectorAll('details[open][data-class-key]')].map(n=>n.dataset.classKey));root.replaceChildren(...nodes);for(const node of root.querySelectorAll('details[data-class-key]'))if(open.has(node.dataset.classKey))node.open=true;}
 function renderSummary(){
  const lvl=level(),name=className(),pb=rules.proficiency(lvl),mod=intMod();
  $('class-details-title').textContent='✧ '+($('profile-class').textContent||'Class')+' ✧';
  $('class-details-edition').textContent=name==='artificer'?'2014 rules · Tasha’s Cauldron of Everything':'Class overview';
  if(name!=='artificer'||!data){$('class-summary').replaceChildren(metric('Class level',lvl),metric('Hit Die',rules.classRule(name)?'d'+rules.classRule(name).die:'—'),metric('Proficiency bonus',signed(pb)));return;}
  const row=data.progression[lvl-1],extra=chosen()?.id==='armorer'&&lvl>=9?2:0;
  const prepared=mod===null?'—':Math.max(1,mod+Math.floor(lvl/2));
  $('class-summary').replaceChildren(metric('Artificer level',lvl),metric('Proficiency bonus',signed(pb)),metric('Spell save DC',mod===null?'—':8+pb+mod),metric('Spell attack',mod===null?'—':signed(pb+mod)),metric('Prepared spells¹',prepared),metric('Cantrips known',row.cantrips),metric('Infusions known',row.known),metric('Infused items',row.items+(extra?' + 2 armor':'')));
 }
 function renderFeatures(){replaceKeepingOpen('class-features',data.features.filter(visible).map((f,i)=>card(f,'core:'+f.level+':'+f.name)));}
 function renderSpecialists(){
  const selected=chosen(),lvl=level();
  $('class-specialist-status').textContent=selected?'Chosen specialist: '+selected.name+(lvl<3?' · Unlocks at level 3':''):saved.value?'Saved specialist is not recognized by this reference. It will be preserved unless you choose a replacement.':'No specialist chosen'+(lvl<3?' · Unlocks at level 3':'');
  $('class-use-specialist').disabled=!ready||lvl<3||!data.subclasses.some(s=>s.id===view.value)||selected?.id===view.value;
  const cards=data.subclasses.filter(s=>!view.value||s.id===view.value).map(s=>{
   const selectedHere=selected?.id===s.id;
   const box=card({name:s.name,level:3},'specialist:'+s.id,selectedHere?'Chosen specialist':'Preview');box.classList.add('class-specialist');if(view.value)box.open=true;
   const spells=s.spells.filter(visible);if(spells.length){box.append(el('p','Specialist spells are always prepared at the listed Artificer levels and do not count against your preparation limit.'),table(['Artificer level','Always-prepared spells'],spells.map(r=>[r.level,r.names.join(', ')]),s.name+' spells'));}
   const features=s.features.filter(visible);if(!features.length)box.append(el('p','Specialist features unlock at level 3. Choose “All levels” to preview them.'));
   for(const f of features)box.append(card(f,s.id+':'+f.level+':'+f.name,selectedHere?'':'Preview'));
   return box;
  });replaceKeepingOpen('class-specialists',cards);
 }
 function renderInfusions(){
  const q=$('class-infusion-search').value.trim().toLowerCase();
  const filtered=data.infusions.filter(f=>visible(f)&&[f.name,f.item,...f.paragraphs].join(' ').toLowerCase().includes(q));
  replaceKeepingOpen('class-infusions',filtered.map(f=>{const box=card(f,'infusion:'+f.id);const p=el('p',f.item+' · Attunement: '+(f.attunement===null?'depends on item':f.attunement?'required':'not required'),'class-note');box.insertBefore(p,box.children[1]);return box;}));
  $('class-infusion-count').textContent=filtered.length+' of '+data.infusions.length+' infusion options'+(!all()?' · current level':' · all levels')+(filtered.length?'':' · No matches');
  $('class-replicas').replaceChildren(...data.replicas.filter(visible).map(group=>{const box=el('section');box.append(el('h5','Level '+group.level+'+'),table(['Magic item','Attunement'],group.items.map(i=>[i.name,i.attunement?'Required':'No']),`Replicable items at level ${group.level}`));return box;}));
  if(level()<2&&!all())$('class-replicas').append(el('p','Infusions unlock at Artificer level 2.'));
 }
 function renderCompanions(){
  const lvl=level(),mod=intMod(),pb=rules.proficiency(lvl);
  replaceKeepingOpen('class-companions',data.companions.map(c=>{
   const hom=c.id==='homunculus',box=el('details',undefined,'class-reference-card');box.dataset.classKey=c.id;box.append(el('summary',c.name));
   box.append(el('p',`At your level · HP ${mod===null?'—':hom?1+mod+lvl:2+mod+5*lvl} · AC ${hom?13:lvl>=15?17:15} · Attack ${mod===null?'—':signed(pb+mod)} · Damage ${hom?'1d4':'1d8'} + ${pb}`, 'class-note'),facts(c.facts));return box;
  }));
 }
 function renderProgression(){
  const rows=data.progression.map(r=>[r.level,'+'+rules.proficiency(r.level),r.known,r.items,r.cantrips,...r.slots.map(v=>v||'—'),data.features.filter(f=>f.level===r.level).map(f=>f.name).join(', ')||'—']);
  const grid=table(['Level','PB','Known infusions','Infused items','Cantrips','1st','2nd','3rd','4th','5th','Features'],rows,'Artificer level progression');
  const t=grid.querySelector('table');t.prepend(el('caption','Base class totals · spell slots by spell level · Armorer’s two extra armor infusions are separate.'));
  grid.querySelectorAll('tbody tr')[level()-1].setAttribute('aria-current','true');$('class-progression').replaceChildren(grid);
 }
 function render(){
  renderSummary();const supported=className()==='artificer';$('artificer-reference').hidden=!supported||!data;
  if(!supported){$('class-status').textContent=className()==='halfwit'?'Hayden’s existing Halfwit reference and Stupidity Points remain in Stats & Abilities. The full homebrew reference is still on the backburner.':'The detailed reference currently covers Artificer. Your class resources and selected features remain in Stats & Abilities.';$('class-retry').hidden=true;return;}
  if(!data)return;
  $('class-status').textContent='¹ Prepared spells exclude cantrips and specialist spells. Totals follow your current level and Intelligence.';
  renderFeatures();renderSpecialists();renderInfusions();renderCompanions();renderProgression();
 }
 async function load(){
  if(loading)return;loading=true;$('class-retry').hidden=true;
  if(className()==='artificer')$('class-status').textContent='Loading class reference…';
  try{
   const response=await fetch('assets/data/artificer-2014.json');if(!response.ok)throw Error('Class reference unavailable');const next=await response.json();
   if(next.schemaVersion!==1||next.id!=='artificer'||next.progression?.length!==20||next.subclasses?.length!==4||!Array.isArray(next.infusions))throw Error('Invalid class reference');
   data=next;view.replaceChildren(new Option('All specialists',''),...data.subclasses.map(s=>new Option(s.name,s.id)));view.value=chosen()?.id||'';
   $('class-basics').replaceChildren(facts(data.basics));$('class-casting').replaceChildren(facts(data.casting));
   $('class-spell-index').replaceChildren(...Array.from({length:6},(_,lvl)=>{const section=el('section'),list=el('ul',undefined,'class-spell-list');section.append(el('h5',lvl?'Level '+lvl:'Cantrips'));for(const s of data.spells.filter(s=>s.level===lvl)){const li=el('li',s.name+(s.ritual?' · R':''));li.append(el('small',' · '+s.source));list.append(li);}section.append(list);return section;}));render();
  }catch(error){if(className()==='artificer'){$('class-status').textContent='Class reference could not load. Your saved character and specialist choice are preserved.';$('class-retry').hidden=false;}}
  finally{loading=false;}
 }
 $('class-level-filter').addEventListener('change',()=>{if(data)render();});
 view.addEventListener('change',()=>{if(data)renderSpecialists();});
 $('class-infusion-search').addEventListener('input',()=>{if(data)renderInfusions();});
 $('class-use-specialist').addEventListener('click',()=>{
  if(!ready||className()!=='artificer'||level()<3||!data?.subclasses.some(s=>s.id===view.value))return;
  saved.value='artificer:'+view.value;saved.dispatchEvent(new Event('input',{bubbles:true}));render();
 });
 $('class-open-spells').addEventListener('click',()=>{$('tab-spells').click();$('tab-spells').focus();});
 $('class-retry').addEventListener('click',load);
 document.addEventListener('feywild:profile-loaded',()=>{ready=true;view.value=chosen()?.id||'';render();});
 $('characterLevel').addEventListener('change',render);
 document.querySelector('[name="int"]')?.addEventListener('input',()=>{renderSummary();if(data&&className()==='artificer')renderCompanions();});
 render();load();
})();
