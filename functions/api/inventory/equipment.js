import {json,validId,parseBody,errorResponse} from '../_lib/inventory.js';
import {EQUIPMENT_TYPES,validEquipment} from '../../../assets/js/equipment-rules.js';

// Equipment is its own section, so Save Character cannot overwrite equip changes.
export async function onRequestPatch({request,env}){
 const body=await parseBody(request);
 if(!body||!validId(body.character_id)||!validId(body.item_id)||!validEquipment(body))return json({error:'Invalid equipment settings.'},400);
 const {character_id:character,item_id:id,type,bonus,equipped}=body;
 const slot=EQUIPMENT_TYPES[type].slot,section='equipment:'+id;
 const settings=JSON.stringify({type,bonus,equipped,slot});
 try{
  const statements=[];
  // D1 batch is transactional. Check ownership/quantity in both statements so
  // a removed/empty item cannot displace armor or a shield during an equip race.
  if(equipped&&slot!=='gear')statements.push(env.DB.prepare(`
   UPDATE character_data SET data_json=json_set(data_json,'$.equipped',json('false')),
    updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now')
   WHERE character_id=? AND section GLOB 'equipment:*' AND section<>?
    AND json_extract(data_json,'$.slot')=? AND json_extract(data_json,'$.equipped')=1
    AND EXISTS(SELECT 1 FROM inventory_items WHERE id=? AND character_id=? AND quantity>0)
  `).bind(character,section,slot,id,character));
  statements.push(env.DB.prepare(`
   INSERT INTO character_data(character_id,section,data_json)
   SELECT character_id,?,? FROM inventory_items WHERE id=? AND character_id=? AND (?=0 OR quantity>0)
   ON CONFLICT(character_id,section) DO UPDATE SET data_json=excluded.data_json,
    updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now')
  `).bind(section,settings,id,character,equipped?1:0));
  const results=await env.DB.batch(statements);
  if(results.at(-1).meta.changes!==1)return json({error:'Item is missing or has no remaining quantity. Refresh your inventory.'},409);
  return json({ok:true});
 }catch{return errorResponse();}
}
