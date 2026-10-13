import {json,errorResponse} from "../_lib/inventory.js";
export async function onRequestGet({env}){try{const r=await env.DB.prepare("SELECT id,name,description,category,rarity FROM item_catalog ORDER BY name").all();return json(r.results)}catch{return errorResponse()}}
