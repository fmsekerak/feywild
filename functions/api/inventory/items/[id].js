import {json,validId,parseBody,errorResponse} from "../../_lib/inventory.js";
export async function onRequestPatch({params,request,env}){
 if(!validId(params.id))return json({error:"Invalid item ID."},400);
 const b=await parseBody(request);
 if(!b||!validId(b.character_id)||!Number.isInteger(b.amount)||![1,-1].includes(b.amount))return json({error:"Invalid quantity adjustment."},400);
 try{
  const result=await env.DB.prepare(`UPDATE inventory_items SET quantity=quantity+?,updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now')
  WHERE id=? AND character_id=? AND quantity+? BETWEEN 0 AND 999999`).bind(b.amount,params.id,b.character_id,b.amount).run();
  if(result.meta.changes!==1)return json({error:"Item not found or quantity limit reached."},409);
  return json({ok:true});
 }catch{return errorResponse()}
}
export async function onRequestDelete({params,request,env}){
 if(!validId(params.id))return json({error:"Invalid item ID."},400);
 const b=await parseBody(request);
 if(!b||!validId(b.character_id))return json({error:"Invalid character ID."},400);
 try{
  const result=await env.DB.prepare("DELETE FROM inventory_items WHERE id=? AND character_id=?").bind(params.id,b.character_id).run();
  if(result.meta.changes!==1)return json({error:"Item not found."},404);
  return json({ok:true});
 }catch{return errorResponse()}
}
