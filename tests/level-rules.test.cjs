/* Run with: node --test tests/level-rules.test.cjs */
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const source=fs.readFileSync(path.join(__dirname,'../assets/js/level-rules.js'),'utf8');
const fakeWindow={};
vm.runInNewContext(source,{
 window:fakeWindow,
 document:{getElementById:()=>({textContent:'Druid'})}
});
const rules=fakeWindow.FEYWILD_LEVEL_RULES;
const equal=(actual,expected)=>assert.deepEqual(Array.from(actual??[],Number),expected);
test('2014 full casters advance to level-nine spell slots',()=>{
 equal(rules.slotsFor('Druid',1),[2]);
 equal(rules.slotsFor('Bard',3),[4,2]);
 equal(rules.slotsFor('Wizard',20),[4,3,3,3,3,2,2,1,1]);
});
test('paladin, ranger and artificer use their own half-caster start levels',()=>{
 equal(rules.slotsFor('Paladin',1),[]);
 equal(rules.slotsFor('Paladin',3),[3]);
 equal(rules.slotsFor('Ranger',5),[4,2]);
 equal(rules.slotsFor('Artificer',1),[2]);
 equal(rules.slotsFor('Artificer',5),[4,2]);
});
test('warlock Pact Magic does not invent Mystic Arcanum slots',()=>{
 equal(rules.slotsFor('Warlock',1),[1]);
 equal(rules.slotsFor('Warlock',3),[0,2]);
 equal(rules.slotsFor('Warlock',11),[0,0,0,0,3]);
 equal(rules.slotsFor('Warlock',17),[0,0,0,0,4]);
});
test('noncasting and custom classes do not silently receive spell slots',()=>{
 equal(rules.slotsFor('Monk',15),[]);
 equal(rules.slotsFor('Halfwit',3),[]);
 assert.equal(rules.slotsFor('Unknown Homebrew',3),null);
});
test('fixed-average HP, Tough and proficiency increase with level',()=>{
 assert.equal(rules.hpFor('Druid',1,16),11);
 assert.equal(rules.hpFor('Druid',3,16),27);
 assert.equal(rules.hpFor('Druid',3,16,true),33);
 assert.equal(rules.hpFor('Halfwit',3,16),31);
 assert.equal(rules.proficiency(1),2);
 assert.equal(rules.proficiency(5),3);
 assert.equal(rules.proficiency(17),6);
});
test('reject invalid levels and unknown hit dice',()=>{
 assert.equal(rules.atLevel(0),null);
 assert.equal(rules.atLevel(21),null);
 assert.equal(rules.atLevel(2.5),null);
 assert.equal(rules.hpFor('Unknown Homebrew',5,16),null);
});
