// Public character profiles, like the site's intentionally open inventories.
// NEVER use this endpoint for DM secrets or private campaign data.
const respond=(data,status=200)=>Response.json(data,{status,headers:{"Cache-Control":"no-store","X-Content-Type-Options":"nosniff"}});
const validId=x=>(typeof x==="string"||typeof x==="number")&&/^[a-zA-Z0-9_-]{1,128}$/.test(String(x));
export async function onRequestGet({request,env}){
 const id=new URL(request.url).searchParams.get("character_id");
 if(!validId(id))return respond({error:"Invalid character."},400);
 try{
  const character=await env.DB.prepare("SELECT id,name FROM characters WHERE id=?").bind(id).first();
  if(!character)return respond({error:"Character not found."},404);
  const row=await env.DB.prepare("SELECT data_json FROM character_data WHERE character_id=? AND section='profile'").bind(id).first();
  return respond({character,data:row?JSON.parse(row.data_json):{}});
 }catch{return respond({error:"Unable to load character profile."},500)}
}
export async function onRequestPut({request,env}){
 const body=await request.json().catch(()=>null);
 if(!body||!validId(body.character_id)||!body.data||typeof body.data!=="object"||Array.isArray(body.data))return respond({error:"Invalid profile."},400);
 const entries=Object.entries(body.data);
 if(entries.length>120||entries.some(([k,v])=>k.length>70||!(/^[a-zA-Z][a-zA-Z0-9 -]*$/.test(k))||!(typeof v==="string"||typeof v==="boolean")||(typeof v==="string"&&v.length>8000)))return respond({error:"Profile contains invalid or oversized fields."},400);
 const serialized=JSON.stringify(body.data);
 if(serialized.length>50000)return respond({error:"Profile is too large."},413);
 try{
  const character=await env.DB.prepare("SELECT id FROM characters WHERE id=?").bind(body.character_id).first();
  if(!character)return respond({error:"Character not found."},404);
  await env.DB.prepare("INSERT INTO character_data(character_id,section,data_json) VALUES(?,'profile',?) ON CONFLICT(character_id,section) DO UPDATE SET data_json=excluded.data_json,updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now')").bind(body.character_id,serialized).run();
  return respond({ok:true});
 }catch{return respond({error:"Unable to save character profile."},500)}
}
