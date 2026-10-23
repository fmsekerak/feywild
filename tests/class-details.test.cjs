const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const data=JSON.parse(fs.readFileSync(path.join(__dirname,'../assets/data/artificer-2014.json'),'utf8'));
const window={};vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../assets/js/level-rules.js'),'utf8'),{window,document:{getElementById:()=>({textContent:'Artificer'})}});
test('reference progression agrees with live slot calculations at every level',()=>{
 assert.equal(data.progression.length,20);
 for(const row of data.progression){
  const slots=Array.from(window.FEYWILD_LEVEL_RULES.slotsFor('Artificer',row.level));
  while(slots.length<5)slots.push(0);assert.deepEqual(row.slots,slots,'Level '+row.level);
 }
 for(const [level,known,items,cantrips] of [[1,0,0,2],[2,4,2,2],[6,6,3,2],[10,8,4,3],[14,10,5,4],[18,12,6,4],[20,12,6,4]]){
  const row=data.progression[level-1];assert.deepEqual([row.level,row.known,row.items,row.cantrips],[level,known,items,cantrips]);
 }
});
test('all specialist milestones and spell pairs are covered without selecting a default',()=>{
 assert.deepEqual(data.subclasses.map(s=>s.name),['Alchemist','Armorer','Artillerist','Battle Smith']);
 for(const s of data.subclasses){
  assert.deepEqual([...new Set(s.features.map(f=>f.level))],[3,5,9,15]);
  assert.deepEqual(s.spells.map(s=>s.level),[3,5,9,13,17]);
  assert.ok(s.spells.every(s=>s.names.length===2));
 }
 assert.deepEqual(data.features.filter(f=>f.name==='Ability Score Improvement').map(f=>f.level),[4,8,12,16,19]);
 for(const name of ['Magical Tinkering','Spellcasting','Infuse Item','The Right Tool for the Job','Tool Expertise','Flash of Genius','Magic Item Adept','Spell-Storing Item','Magic Item Savant','Magic Item Master','Soul of Artifice'])assert.ok(data.features.some(f=>f.name===name),name);
});
test('infusion catalog includes all options, prerequisites, replication tiers and companion references',()=>{
 assert.equal(data.infusions.length,16);assert.equal(new Set(data.infusions.map(i=>i.id)).size,16);
 assert.equal(data.infusions.find(i=>i.name==='Arcane Propulsion Armor').level,14);
 assert.equal(data.infusions.find(i=>i.name==='Helm of Awareness').level,10);
 assert.equal(data.infusions.find(i=>i.name==='Homunculus Servant').attunement,false);
 assert.deepEqual(data.replicas.map(r=>r.level),[2,6,10,14]);
 assert.deepEqual(data.replicas.map(r=>r.items.length),[8,8,22,13]);
 assert.deepEqual(data.companions.map(c=>c.name),['Homunculus Servant','Steel Defender']);
});
test('spell-name index covers PHB, Xanathar and Tasha entries, including rituals',()=>{
 assert.equal(data.spells.length,95);assert.equal(new Set(data.spells.map(s=>s.name)).size,95);
 for(const [name,source] of [['Cure Wounds','PHB'],['Absorb Elements','XGE'],['Booming Blade','TCE']])assert.ok(data.spells.some(s=>s.name===name&&s.source===source));
 assert.equal(data.spells.find(s=>s.name==='Identify').ritual,true);
 assert.ok(data.spells.every(s=>s.level>=0&&s.level<=5));
 assert.equal(JSON.stringify(data).includes('{@'),false,'No upstream renderer tags');
});
