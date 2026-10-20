/* Run: node --test tests/equipment.test.cjs (Node 22+ with node:sqlite). */
const test=require('node:test'),assert=require('node:assert/strict');
const database=require('./helpers/equipment-db.cjs');
const rules=import('../assets/js/equipment-rules.js');
const endpoints=Promise.all([
 import('../functions/api/inventory/equipment.js'),import('../functions/api/inventory/items.js'),
 import('../functions/api/inventory/items/[id].js'),import('../functions/api/character-profile.js')
]);
const request=(body,method='PATCH')=>new Request('https://feywild.test/api/inventory/equipment',{method,headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
async function equip(ctx,id,type,bonus=0,equipped=true,character='1'){
 const [endpoint]=await endpoints;return endpoint.onRequestPatch({env:ctx.env,request:request({character_id:character,item_id:id,type,bonus,equipped})});
}
async function items(ctx,character='1'){
 const [,endpoint]=await endpoints;const response=await endpoint.onRequestGet({env:ctx.env,request:new Request('https://feywild.test/api/inventory/items?character_id='+character)});
 assert.equal(response.status,200);return response.json();
}
test('armor AC handles negative DEX, medium caps, heavy armor, and one shield',async()=>{
 const {calculateArmorClass}=await rules;
 const item=(id,type,bonus=0)=>({id,name:id,quantity:1,equipment:{type,bonus,equipped:true}});
 assert.equal(calculateArmorClass([],3).value,13);
 assert.equal(calculateArmorClass([item('leather','leather')],-2).value,9);
 assert.equal(calculateArmorClass([item('half plate','half-plate')],5).value,17);
 assert.equal(calculateArmorClass([item('hide','hide')],-2).value,10);
 assert.equal(calculateArmorClass([item('plate','plate')],-2).value,18);
 assert.equal(calculateArmorClass([item('plate','plate')],null).value,18);
 assert.equal(calculateArmorClass([item('leather','leather')],null).value,null);
 assert.equal(calculateArmorClass([item('armor','studded-leather',1),item('shield','shield',2)],3).value,20);
 assert.equal(calculateArmorClass([item('first','shield'),item('second','shield')],3).value,15);
 assert.equal(calculateArmorClass([{...item('empty','plate'),quantity:0}],3).value,13);
});
test('names are inferred conservatively and other gear never invents AC bonuses',async()=>{
 const {inferEquipment,equipmentForItem,validEquipment}=await rules;
 assert.deepEqual(inferEquipment('Studded Leather Armor +1'),{type:'studded-leather',bonus:1});
 assert.deepEqual(inferEquipment('+2 Shield'),{type:'shield',bonus:2});
 assert.deepEqual(inferEquipment('Chain Mail, +3'),{type:'chain-mail',bonus:3});
 assert.deepEqual(inferEquipment('Cloak of Protection'),{type:'gear',bonus:0});
 assert.deepEqual(inferEquipment('Shield-shaped Cookie'),{type:'gear',bonus:0});
 assert.equal(inferEquipment('Rapier').type,'weapon');
 assert.equal(equipmentForItem({name:'Leather',quantity:1},'bad JSON').equipped,false);
 assert.equal(equipmentForItem({name:'Leather',quantity:0},{type:'leather',bonus:0,equipped:true}).equipped,false);
 assert.equal(validEquipment({type:'gear',bonus:1,equipped:true}),false);
});
test('equipment persists separately, armor replaces armor, and shields do not stack',async t=>{
 const ctx=database();t.after(()=>ctx.db.close());
 ctx.add('leather','Leather');ctx.add('plate','Plate');ctx.add('shield1','Shield');ctx.add('shield2','Shield +1');ctx.add('wand','Wand');
 assert.equal((await equip(ctx,'leather','leather')).status,200);
 assert.equal((await equip(ctx,'plate','plate')).status,200);
 assert.equal((await equip(ctx,'shield1','shield')).status,200);
 assert.equal((await equip(ctx,'shield2','shield',1)).status,200);
 assert.equal((await equip(ctx,'wand','gear')).status,200);
 let loaded=await items(ctx);
 assert.deepEqual(loaded.filter(x=>x.equipment.equipped).map(x=>x.id).sort(),['plate','shield2','wand']);
 assert.equal((await rules).calculateArmorClass(loaded,3).value,21);
 const [,,,profile]=await endpoints;
 assert.equal((await profile.onRequestPut({env:ctx.env,request:request({character_id:'1',data:{armorClass:'10',equipment:'Legacy notes',customLegacy:'preserved'}},'PUT')})).status,200);
 assert.equal((await items(ctx)).filter(x=>x.equipment.equipped).length,3);
 assert.equal((await equip(ctx,'shield2','shield',1,false)).status,200);
 assert.equal((await rules).calculateArmorClass(await items(ctx),3).value,18);
});
test('invalid or foreign equipment cannot displace the character armor',async t=>{
 const ctx=database();t.after(()=>ctx.db.close());ctx.add('own','Leather');ctx.add('foreign','Plate','2');ctx.add('empty','Plate','1',0);
 await equip(ctx,'own','leather');
 for(const id of ['foreign','empty','missing'])assert.equal((await equip(ctx,id,'plate')).status,409);
 for(const [type,bonus] of [['not-armor',0],['plate',4],['plate',-1],['plate',1.5],['gear',2],['__proto__',0]])assert.equal((await equip(ctx,'own',type,bonus)).status,400);
 assert.equal((await items(ctx)).find(x=>x.id==='own').equipment.equipped,true);
 assert.equal((await equip(ctx,'foreign','plate',0,true,'2')).status,200);
 assert.equal((await items(ctx)).find(x=>x.id==='own').equipment.equipped,true);
});
test('zero quantity unequips permanently and deletion removes equipment records',async t=>{
 const ctx=database();t.after(()=>ctx.db.close());ctx.add('armor','Plate');await equip(ctx,'armor','plate');
 const [,,endpoint]=await endpoints;
 const patch=amount=>endpoint.onRequestPatch({env:ctx.env,params:{id:'armor'},request:request({character_id:'1',amount})});
 assert.equal((await patch(-1)).status,200);
 assert.equal((await items(ctx))[0].equipment.equipped,false);
 assert.equal((await patch(1)).status,200);
 assert.equal((await items(ctx))[0].equipment.equipped,false);
 await equip(ctx,'armor','plate');
 assert.equal((await endpoint.onRequestDelete({env:ctx.env,params:{id:'armor'},request:request({character_id:'1'},'DELETE')})).status,200);
 assert.deepEqual(await items(ctx),[]);
 assert.equal(ctx.db.prepare("SELECT COUNT(*) AS n FROM character_data WHERE section='equipment:armor'").get().n,0);
 assert.equal(ctx.db.prepare('SELECT COUNT(*) AS n FROM inventory_history').get().n,4);
});
test('custom armor settings are retained while unequipped',async t=>{
 const ctx=database();t.after(()=>ctx.db.close());ctx.add('custom','Moonweave Vest');
 assert.equal((await equip(ctx,'custom','studded-leather',2,false)).status,200);
 const loaded=await items(ctx);assert.equal(loaded[0].equipment.type,'studded-leather');assert.equal(loaded[0].equipment.bonus,2);assert.equal(loaded[0].equipment.equipped,false);
});
test('a failed equipment transaction leaves previously equipped armor intact',async t=>{
 const ctx=database();t.after(()=>ctx.db.close());ctx.add('leather','Leather');ctx.add('plate','Plate');
 await equip(ctx,'leather','leather');
 ctx.db.exec("CREATE TRIGGER fail_equipment BEFORE INSERT ON character_data WHEN NEW.section='equipment:plate' BEGIN SELECT RAISE(ABORT,'simulated write failure'); END");
 assert.equal((await equip(ctx,'plate','plate')).status,500);
 assert.equal((await items(ctx)).find(x=>x.id==='leather').equipment.equipped,true);
});
