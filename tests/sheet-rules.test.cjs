const test=require('node:test');
const assert=require('node:assert/strict');
const r=require('../assets/js/sheet-rules.js');
test('damage consumes temporary HP, clamps HP at zero, and never heals',()=>{
 assert.deepEqual(r.hpChange('20','5','30',8,'damage'),{current:17,temporary:0});
 assert.deepEqual(r.hpChange('20','10','30',3,'damage'),{current:20,temporary:7});
 assert.deepEqual(r.hpChange('3','','30',50,'damage'),{current:0,temporary:0});
});
test('healing caps at maximum, preserves temporary HP, and rejects invalid values',()=>{
 assert.deepEqual(r.hpChange(25,4,30,20,'heal'),{current:30,temporary:4});
 assert.deepEqual(r.hpChange(40,4,30,2,'heal'),{current:40,temporary:4});
 for(const n of ['',-1,1.5,'oops'])assert.throws(()=>r.hpChange(10,0,30,n,'damage'));
 assert.throws(()=>r.hpChange('',0,30,4,'heal'));
});
test('attack bonuses handle proficiency, spells, offhands, and independent magic bonuses',()=>{
 const a={ability:'dex',proficient:true,hitBonus:1,damageBonus:1,addAbilityDamage:true};
 assert.deepEqual(r.attack(a,{dex:16},3),{hit:7,damage:4,mod:3,prof:3});
 assert.equal(r.attack({...a,proficient:false},{dex:16},3).hit,4);
 assert.equal(r.attack({...a,addAbilityDamage:false},{dex:16},3).damage,1);
 assert.equal(r.attack(a,{dex:''},3),null);
});
test('Bard and Druid resource transitions retain expended uses',()=>{
 const bard=(l,cha=16)=>r.classResources('Bard',l,cha)[0];
 assert.equal(bard(3).max,3);assert.equal(bard(3).recharge,'long');
 assert.equal(bard(5).recharge,'short');assert.match(bard(10).detail,/d10/);
 assert.equal(bard(1,8).max,1);assert.equal(r.remaining(bard(5,18).max,2),2);
 assert.deepEqual(r.classResources('Druid',1,10),[]);
 assert.equal(r.classResources('Druid',2,10)[0].max,2);
 assert.equal(r.classResources('Druid',20,10)[0].max,null);
 assert.deepEqual(r.classResources('Halfwit',3,10),[]);
 assert.deepEqual(r.classResources('Artificer',3,10),[]);
});
test('2014 long rest recovers only half total Hit Dice (minimum one)',()=>{
 assert.equal(r.hitDiceAfterLongRest(1,1),0);
 assert.equal(r.hitDiceAfterLongRest(3,3),2);
 assert.equal(r.hitDiceAfterLongRest(5,5),3);
 assert.equal(r.hitDiceAfterLongRest(20,19),9);
 assert.equal(r.hitDiceAfterLongRest(5,0),0);
 assert.equal(r.hitDieHealing(1,-3),0);
 assert.equal(r.hitDieHealing(1,3,true),6);
});
test('recharge never resets manual resources or long-rest resources on a short rest',()=>{
 assert.equal(r.restRecovers('manual','long'),false);
 assert.equal(r.restRecovers('long','short'),false);
 assert.equal(r.restRecovers('short','short'),true);
 assert.equal(r.restRecovers('long','long'),true);
});
