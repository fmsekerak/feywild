export const json=(body,status=200)=>Response.json(body,{status,headers:{"Cache-Control":"no-store","X-Content-Type-Options":"nosniff"}});
export const validId=value=>(typeof value==="string"||typeof value==="number")&&/^[a-zA-Z0-9_-]{1,128}$/.test(String(value));
export async function parseBody(request){try{return await request.json()}catch{return null}}
export function errorResponse(){return json({error:"Inventory request failed."},500)}
