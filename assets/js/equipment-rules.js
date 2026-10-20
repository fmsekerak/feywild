/* 2014 armor arithmetic, shared by the inventory API and character sheet.
   Source: SRD 5.1 / Basic Rules 2014, Equipment (see docs/equipment.md). */
export const EQUIPMENT_TYPES = Object.freeze({
 gear: {label:'Other gear',slot:'gear'},
 weapon: {label:'Weapon',slot:'gear'},
 padded: {label:'Padded armor',slot:'armor',base:11,dex:'full'},
 leather: {label:'Leather armor',slot:'armor',base:11,dex:'full'},
 'studded-leather': {label:'Studded leather',slot:'armor',base:12,dex:'full'},
 hide: {label:'Hide armor',slot:'armor',base:12,dex:'capped'},
 'chain-shirt': {label:'Chain shirt',slot:'armor',base:13,dex:'capped'},
 'scale-mail': {label:'Scale mail',slot:'armor',base:14,dex:'capped'},
 breastplate: {label:'Breastplate',slot:'armor',base:14,dex:'capped'},
 'half-plate': {label:'Half plate',slot:'armor',base:15,dex:'capped'},
 'ring-mail': {label:'Ring mail',slot:'armor',base:14,dex:'none'},
 'chain-mail': {label:'Chain mail',slot:'armor',base:16,dex:'none'},
 splint: {label:'Splint armor',slot:'armor',base:17,dex:'none'},
 plate: {label:'Plate armor',slot:'armor',base:18,dex:'none'},
 shield: {label:'Shield',slot:'shield',base:2}
});
const weapons=new Set(['club','dagger','greatclub','handaxe','javelin','light hammer','mace','quarterstaff','sickle','spear','light crossbow','crossbow, light','dart','shortbow','sling','battleaxe','flail','glaive','greataxe','greatsword','halberd','lance','longsword','maul','morningstar','pike','rapier','scimitar','shortsword','trident','war pick','warhammer','whip','blowgun','hand crossbow','crossbow, hand','heavy crossbow','crossbow, heavy','longbow','net']);
const normalize=name=>String(name||'').trim().toLowerCase().replace(/armour/g,'armor').replace(/[-–]/g,' ').replace(/\s+/g,' ');
export function inferEquipment(name){
 let text=normalize(name),bonus=0;
 const magic=text.match(/^(?:\+([1-3])\s+)(.+)$|^(.+?)[,\s]+\+([1-3])$/);
 if(magic){bonus=Number(magic[1]||magic[4]);text=(magic[2]||magic[3]).trim();}
 for(const [type,rule] of Object.entries(EQUIPMENT_TYPES)){
  if(rule.slot==='gear')continue;
  if([normalize(rule.label),normalize(type),normalize(rule.label).replace(/ armor$/,''),normalize(type)+' armor'].includes(text))return {type,bonus};
 }
 return {type:weapons.has(text)?'weapon':'gear',bonus:0};
}
export function validEquipment(value){
 if(!value||typeof value!=='object'||!Object.hasOwn(EQUIPMENT_TYPES,value.type)||typeof value.equipped!=='boolean'||!Number.isInteger(value.bonus)||value.bonus<0||value.bonus>3)return false;
 return EQUIPMENT_TYPES[value.type].slot!=='gear'||value.bonus===0;
}
export function equipmentForItem(item,stored){
 let parsed=stored;
 if(typeof stored==='string'){try{parsed=JSON.parse(stored);}catch{parsed=null;}}
 const settings=validEquipment(parsed)?parsed:{...inferEquipment(item.name),equipped:false};
 return {type:settings.type,bonus:settings.bonus,slot:EQUIPMENT_TYPES[settings.type].slot,equipped:settings.equipped&&Number(item.quantity)>0};
}
export function equippedItems(items){
 return items.filter(item=>Number(item.quantity)>0&&validEquipment(item.equipment)&&item.equipment.equipped);
}
export function calculateArmorClass(items,dexModifier){
 const active=equippedItems(items);
 const armor=active.find(item=>EQUIPMENT_TYPES[item.equipment.type].slot==='armor');
 const shield=active.find(item=>EQUIPMENT_TYPES[item.equipment.type].slot==='shield');
 const rule=armor?EQUIPMENT_TYPES[armor.equipment.type]:{base:10,dex:'full'};
 const dex=rule.dex==='none'?0:Number.isFinite(dexModifier)?(rule.dex==='capped'?Math.min(2,dexModifier):dexModifier):null;
 if(dex===null)return {value:null,description:'Enter Dexterity to calculate AC.'};
 const armorBonus=armor?.equipment.bonus||0,shieldBonus=shield?2+shield.equipment.bonus:0;
 const value=rule.base+dex+armorBonus+shieldBonus;
 const terms=[(armor?armor.name:'Unarmored')+' '+(rule.base+armorBonus)];
 if(rule.dex!=='none')terms.push((dex<0?'− '+Math.abs(dex):'+ '+dex)+' DEX'+(rule.dex==='capped'?' (max +2)':''));
 if(shield)terms.push('+ '+shieldBonus+' shield');
 return {value,description:terms.join(' ')+' = '+value+' AC'};
}
export function equipmentDescription(settings){
 const rule=EQUIPMENT_TYPES[settings.type];
 if(!rule)return '';
 if(rule.slot==='gear')return rule.label+' · no automatic bonuses';
 if(rule.slot==='shield')return 'Shield · +'+(2+settings.bonus)+' AC';
 return rule.label+' · '+(rule.base+settings.bonus)+(rule.dex==='none'?' AC':rule.dex==='capped'?' + DEX (max +2) AC':' + DEX AC');
}
