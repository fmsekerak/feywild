/* Run with: node --test tests/halfwit-class.test.cjs */
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const classData=JSON.parse(fs.readFileSync(path.join(__dirname,'../assets/data/halfwit-class.json'),'utf8'));
const source=fs.readFileSync(path.join(__dirname,'../assets/js/level-rules.js'),'utf8');
const fakeWindow={};
vm.runInNewContext(source,{window:fakeWindow,document:{getElementById:()=>({textContent:'Halfwit'})}});
const rules=fakeWindow.FEYWILD_LEVEL_RULES;
test('Halfwit uses verified class identity and hit die',()=>{
 assert.equal(classData.title,'Halfwit');
 assert.equal(classData.hitDie,10);
 assert.equal(rules.classRule('Halfwit').die,10);
 assert.equal(rules.classRule('Himbo'),null);
 assert.equal(rules.hpFor('Halfwit',3,16),31);
 assert.deepEqual(Array.from(rules.slotsFor('Halfwit',3)),[]);
});
test('verified saving throws and early progression remain documented',()=>{
 assert.deepEqual(classData.savingThrowProficiencies,['Constitution','Charisma']);
 assert.deepEqual(classData.resource.knownMaximumByLevel,{'1':1,'2':2,'3':2,'4':3,'14':8,'15':8,'16':9,'17':9});
 assert.deepEqual(classData.knownMilestones.find(item=>item.level===1).features,['Idiotic Fighter','Ditsy Charm']);
 assert.deepEqual(classData.knownMilestones.find(item=>item.level===2).features,['Stumbling Luck']);
 assert.deepEqual(classData.knownMilestones.find(item=>item.level===3).features,['Idiotic Trope']);
});
test('unknown resource maxima are absent instead of fabricated',()=>{
 assert.equal(classData.resource.knownMaximumByLevel['5'],undefined);
 assert.equal(classData.resource.knownMaximumByLevel['20'],undefined);
 assert.match(classData.completeness,/partial/i);
 assert.match(classData.source,/dandwiki\.com\/wiki\/Halfwit_/);
});
