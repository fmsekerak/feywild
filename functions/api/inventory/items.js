import {json,validId,parseBody,errorResponse} from "../_lib/inventory.js";
export async function onRequestGet({request,env}){
 const characterId=new URL(request.url).searchParams.get("character_id");
 if(!validId(characterId))return json({error:"Invalid character ID."},400);
 try{const r=await env.DB.prepare("SELECT id,name,description,quantity FROM inventory_items WHERE character_id=? ORDER BY name").bind(characterId).all();return json(r.results)}catch{return errorResponse()}
}
export async function onRequestPost({request,env}){
 const b=await parseBody(request);
 if(!b||!validId(b.character_id)||!validId(b.catalog_item_id)||!Number.isInteger(b.quantity)||b.quantity<1||b.quantity>999999)return json({error:"Invalid item, character or quantity."},400);
 try{
  // Look up both records explicitly instead of relying on INSERT ... SELECT
  // and its driver-specific changes count to distinguish missing records.
  const character=await env.DB.prepare("SELECT id FROM characters WHERE id=?").bind(b.character_id).first();
  if(!character)return json({error:"Selected character was not found. Please switch characters and try again."},404);
  const item=await env.DB.prepare("SELECT id,name,description FROM item_catalog WHERE id=?").bind(b.catalog_item_id).first();
  if(!item)return json({error:"This catalog item is no longer available. Refresh the page and select it again."},404);
  const id=crypto.randomUUID();
  await env.DB.prepare("INSERT INTO inventory_items(id,character_id,catalog_item_id,name,description,quantity) VALUES(?,?,?,?,?,?)")
    .bind(id,character.id,item.id,item.name,item.description,b.quantity).run();
  return json({id},201);
 }catch{return errorResponse()}
}
