const test=require('node:test'),assert=require('node:assert/strict');
const catalog=require('../assets/data/races-2014.json'),rules=require('../assets/js/race-rules.js');
const importer=require('../scripts/import-races.cjs');
const find=(name,source)=>{const race=catalog.races.find(r=>r.name===name&&r.source===source);assert.ok(race,`${name} ${source}`);return race;};
test('complete pinned index has unique source-aware identities and no book prose',()=>{
 assert.equal(catalog.races.length,296);assert.equal(Object.keys(catalog.sources).length,29);
 assert.equal(new Set(catalog.races.map(r=>r.id)).size,296);
 for(const r of catalog.races){assert.ok(catalog.sources[r.source]);assert.ok(Number.isFinite(rules.walkingSpeed(r)));assert.ok(rules.facts(r).every(row=>row.length===2&&typeof row[1]==='string'));assert.ok(!r.entries&&!r._copy&&!r._versions&&!r.description);}
});
test('Firbolg, Fairy and Satyr versions remain distinct',()=>{
 assert.deepEqual(find('Firbolg','VGM').ability,[{str:1,wis:2}]);assert.equal(find('Firbolg','MPMM').lineage,'VRGR');
 assert.equal(rules.walkingSpeed(find('Satyr','MOT')),35);assert.equal(rules.walkingSpeed(find('Satyr','MPMM')),35);
 assert.match(rules.movement(find('Fairy','WBtW')),/Fly equal to walking speed/);assert.deepEqual(find('Fairy','MPMM').creatureTypes,['fey']);
 assert.notEqual(find('Fairy','WBtW').id,find('Fairy','MPMM').id);
});
test('subraces inherit base mechanics; replacement traits replace rather than stack',()=>{
 const wood=find('Elf (Wood)','PHB');assert.deepEqual(wood.ability,[{dex:2,wis:1}]);assert.equal(wood.darkvision,60);assert.equal(rules.walkingSpeed(wood),35);assert.ok(wood.traits.includes('Fey Ancestry'));assert.ok(wood.traits.includes('Mask of the Wild'));
 const drow=find('Elf (Drow)','PHB');assert.equal(drow.darkvision,120);assert.ok(drow.traits.includes('Superior Darkvision'));assert.ok(!drow.traits.includes('Darkvision'));
 const human=find('Human','PHB');assert.equal(human.ability[0].str,1);
 const variant=find('Human (Variant)','PHB');assert.equal(variant.ability[0].str,undefined);assert.equal(variant.ability[0].choose.count,2);
 const winged=find('Tiefling (Variant; Winged)','SCAG');assert.equal(winged.additionalSpells,null);assert.ok(!winged.traits.includes('Infernal Legacy'));assert.ok(winged.traits.includes('Winged'));
});
test('copied races and expanded variants have the correct selected traits',()=>{
 assert.ok(find('Goblin (Dankwood)','AWM').traits.includes('Speak with Small Beasts'));assert.ok(!find('Goblin (Dankwood)','AWM').traits.includes('Fury of the Small'));
 assert.deepEqual(find('Dragonborn (Chromatic; Red)','FTD').resist,['fire']);assert.deepEqual(find('Dragonborn (Gem; Amethyst)','FTD').resist,['force']);
 const skill=find('Custom Lineage; Skill Proficiency','TCE');assert.equal(skill.darkvision,null);
 const vision=find('Custom Lineage; Darkvision','TCE');assert.equal(vision.skillProficiencies,null);
 assert.equal(find('Kobold; Defiance','MPMM').additionalSpells,null);
});
test('selection parsing preserves identifiers without trusting malformed saved values',()=>{
 assert.deepEqual(rules.selection('{"id":"firbolg|VGM","name":"Firbolg"}'),{id:'firbolg|VGM',name:'Firbolg'});
 for(const value of ['',null,'broken','null','{}','[]','{"id":5}'])assert.equal(rules.selection(value),null);
 assert.equal(rules.walkingSpeed(null),null);
});
test('import fails on an unresolved copy or unrecognized inheritance operation',()=>{
 assert.throws(()=>importer.build({race:[{name:'Missing',source:'PHB',_copy:{name:'No parent',source:'PHB'}}],subrace:[]}),/Missing copy/);
 assert.throws(()=>importer.resolveCopies([{name:'Base',source:'PHB',entries:[]},{name:'Copy',source:'PHB',_copy:{name:'Base',source:'PHB',_mod:{entries:{mode:'unknown'}}}}]),/Unsupported/);
});
