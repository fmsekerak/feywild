export const json=(body,status=200)=>Response.json(body,{status,headers:{"Cache-Control":"no-store","X-Content-Type-Options":"nosniff"}});
export const validId=value=>typeof value==="string"&&/^[a-f0-9-]{36}$/i.test(value);
export async function parseBody(request){try{return await request.json()}catch{return null}}
export function errorResponse(){return json({error:"Inventory request failed."},500)}
