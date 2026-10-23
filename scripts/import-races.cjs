/* Build a factual race index from a pinned 5etools 2014 races.json download.
   Usage: node scripts/import-races.cjs /path/to/races.json
   Book prose, artwork, lore and descriptions are deliberately not published.
   Unsupported inheritance operations fail the build rather than silently losing data. */
const fs=require('node:fs'),path=require('node:path');
const SOURCES=require('./race-sources.json');
const INPUT_SHA256='7d4e55008d6ed5771e8f7b4d0147503c8ac20b4fc0f3e9185b7e8be89ae1f3e9';
const UPSTREAM_COMMIT='e51b3c0707786370e7444d55a9d5a2086bdec591';
const FIELDS=['name','source','page','raceName','raceSource','size','speed','ability','lineage','darkvision','blindsight','resist','immune','vulnerable','conditionImmune','creatureTypes','skillProficiencies','toolProficiencies','languageProficiencies','weaponProficiencies','armorProficiencies','skillToolLanguageProficiencies','additionalSpells','feats'];
const clone=x=>structuredClone(x);
const array=x=>x===undefined?[]:Array.isArray(x)?x:[x];
const key=r=>[r.name||'',r.source,r.raceName||'',r.raceSource||''].join('|');
function entryNames(entries){return array(entries).filter(e=>e&&typeof e==='object'&&e.name).map(e=>({name:e.name,...(e.data?.overwrite?{overwrite:e.data.overwrite}:{})}));}
function modifications(base,mods){
 for(const [field,operations] of Object.entries(mods||{})){
  if(field!=='entries')throw Error('Unsupported modification: '+field);
  for(const op of array(operations)){
   if(op.mode==='replaceTxt')continue; // Only prose changes; no published prose.
   const items=entryNames(array(op.items));
   if(op.mode==='appendArr'){base.entries.push(...items);continue;}
   if(op.mode==='removeArr'){const names=array(op.names);base.entries=base.entries.filter(e=>!names.includes(e.name));continue;}
   if(op.mode==='replaceArr'){
    const i=base.entries.findIndex(e=>e.name===op.replace);
    if(i<0)throw Error('Missing trait to replace: '+base.name+' / '+op.replace);
    base.entries.splice(i,1,...items);continue;
   }
   throw Error('Unsupported modification mode: '+op.mode);
  }
 }
 return base;
}
function resolveCopies(rows){
 const cache=new Map(),pending=new Set();
 function resolve(row){
  const k=key(row);if(cache.has(k))return clone(cache.get(k));if(pending.has(k))throw Error('Copy cycle: '+k);pending.add(k);
  let result={entries:[]};
  if(row._copy){const target=rows.find(r=>key(r)===key(row._copy));if(!target)throw Error('Missing copy: '+k);result=resolve(target);delete result._versions;modifications(result,row._copy._mod);}
  for(const field of FIELDS)if(Object.hasOwn(row,field))result[field]=clone(row[field]);
  if(row.entries)result.entries=entryNames(row.entries);
  if(row.overwrite)result.overwrite=clone(row.overwrite);
  if(row._versions)result._versions=clone(row._versions);
  pending.delete(k);cache.set(k,result);return clone(result);
 }
 return rows.map(resolve);
}
function mergeSubrace(base,sub){
 const result=clone(base);delete result._versions;
 for(const field of FIELDS){
  if(!Object.hasOwn(sub,field)||['name','raceName','raceSource'].includes(field))continue;
  if(field==='ability'&&base.ability&&sub.ability&&!sub.overwrite?.ability){
   if(base.ability.length!==1||sub.ability.length!==1)throw Error('Ambiguous ability merge');
   result.ability=[{...base.ability[0],...sub.ability[0]}];
  }else if(['skillProficiencies','languageProficiencies','toolProficiencies','weaponProficiencies','armorProficiencies'].includes(field)&&base[field]&&sub[field]&&!sub.overwrite?.[field]){
   result[field]=base[field].flatMap(a=>sub[field].map(b=>({...a,...b})));
  }else result[field]=clone(sub[field]);
 }
 result.name=sub.name?`${base.name} (${sub.name})`:base.name;
 result.baseName=base.name;result.baseSource=base.source;
 for(const entry of sub.entries||[]){const target=entry.overwrite||entry.name;const at=result.entries.findIndex(e=>e.name===target);if(at>=0)result.entries.splice(at,1,clone(entry));else result.entries.push(clone(entry));}
 result.kind=sub.name?'subrace':'race';
 if(sub._versions)result._versions=clone(sub._versions);
 return result;
}
function versions(row){
 const results=[];
 for(const version of row._versions||[]){
  const values=version._abstract?version._implementations.map(impl=>{
   const vars=impl._variables||{};
   const raw=JSON.stringify(version._abstract).replace(/\{\{([^}]+)\}\}/g,(_,name)=>{
    if(typeof vars[name]!=='string')throw Error('Missing version variable: '+name);return vars[name];
   });
   return {...JSON.parse(raw),...Object.fromEntries(Object.entries(vars).filter(([k])=>FIELDS.includes(k))),...Object.fromEntries(Object.entries(impl).filter(([k])=>k!=='_variables'))};
  }):[version];
  for(const value of values){
   const result=clone(row);delete result._versions;modifications(result,value._mod);
   for(const field of FIELDS)if(Object.hasOwn(value,field))result[field]=clone(value[field]);
   // Subrace variants sometimes provide a suffix, sometimes a full race name.
   if(row.baseName&&!result.name.startsWith(row.baseName))result.name=`${row.baseName} (${result.name})`;
   result.kind='variant';result.variantOf=row.name;results.push(result);
  }
 }
 return results;
}
function build(input){
 if(!Array.isArray(input.race)||!Array.isArray(input.subrace))throw Error('Expected race and subrace arrays');
 const bases=resolveCopies(input.race),subs=resolveCopies(input.subrace),all=[];
 for(const base of bases){
  const children=subs.filter(s=>s.raceName===base.name&&s.raceSource===base.source);
  const standard=children.find(s=>!s.name);
  const resolved=standard?mergeSubrace(base,standard):{...base,kind:'race'};
  resolved.hasSubraces=children.some(s=>s.name);all.push(resolved,...versions(resolved));
  for(const child of children.filter(s=>s.name)){const r=mergeSubrace(base,child);all.push(r,...versions(r));}
 }
 for(const sub of subs)if(!bases.some(b=>b.name===sub.raceName&&b.source===sub.raceSource))throw Error('Missing parent: '+key(sub));
 const ids=new Set();
 const races=all.map(r=>{
  if(!SOURCES[r.source])throw Error('Unknown source '+r.source);
  const id=encodeURIComponent(r.name.toLowerCase())+'|'+r.source;
  if(ids.has(id))throw Error('Duplicate '+id);ids.add(id);
  const traits=[...new Set(r.entries.map(e=>e.name))].filter(n=>!['Age','Alignment','Size','Speed','Languages','Language','Creature Type'].includes(n));
  const fields=Object.fromEntries(FIELDS.filter(k=>Object.hasOwn(r,k)&&!['raceName','raceSource'].includes(k)).map(k=>[k,r[k]]));
  return {id,...fields,kind:r.kind,sourceName:SOURCES[r.source],traits,
   ...(r.baseName?{baseName:r.baseName,baseSource:r.baseSource}:{}),
   ...(r.hasSubraces?{hasSubraces:true}:{}),...(r._versions?{hasVariants:true}:{}),...(r.variantOf?{variantOf:r.variantOf}:{}),
   ...(r.source==='DMG'&&r.page===282?{npcOption:true}:{})};
 }).sort((a,b)=>a.name.localeCompare(b.name)||a.source.localeCompare(b.source));
 return {version:1,upstream:{repository:'5etools-mirror-3/5etools-2014-src',commit:UPSTREAM_COMMIT,path:'data/races.json'},content:'Factual index and structured mechanics; book prose is not included. Trait names refer to their cited sourcebook.',sources:SOURCES,races};
}
if(require.main===module){const input=JSON.parse(fs.readFileSync(process.argv[2],'utf8'));if(require('node:crypto').createHash('sha256').update(JSON.stringify(input)).digest('hex')!==INPUT_SHA256)throw Error('Input does not match the pinned source revision');const result=build(input);const dest=path.resolve(__dirname,'../assets/data/races-2014.json');fs.writeFileSync(dest,JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({races:result.races.length,sources:Object.keys(SOURCES).length,dest}));}
module.exports={build,mergeSubrace,resolveCopies,versions};
