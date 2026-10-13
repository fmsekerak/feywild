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
  const id=crypto.randomUUID();
  const result=await env.DB.prepare(`INSERT INTO inventory_items(id,character_id,catalog_item_id,name,description,quantity)
  SELECT ?,c.id,i.id,i.name,i.description,? FROM characters c CROSS JOIN item_catalog i WHERE c.id=? AND i.id=?`).bind(id,b.quantity,b.character_id,b.catalog_item_id).run();
  if(result.meta.changes!==1)return json({error:"Character or catalog item not found."},404);
  return json({id},201);
 }catch{return errorResponse()}
}
