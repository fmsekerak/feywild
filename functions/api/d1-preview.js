// Read-only D1 preview of the already-public character and inventory data.
// No writes, history or DM-only information are exposed here.
export async function onRequestGet({ env }) {
  if (!env.DB) return Response.json({error:"D1 not configured"},{status:503});
  try {
    const [characters, catalog, inventory] = await Promise.all([
      env.DB.prepare("SELECT id,name FROM characters ORDER BY name").all(),
      env.DB.prepare("SELECT id,name,description,category,rarity FROM item_catalog ORDER BY name").all(),
      env.DB.prepare("SELECT id,character_id,name,description,quantity FROM inventory_items ORDER BY name").all()
    ]);
    return Response.json({characters:characters.results,catalog:catalog.results,inventory:inventory.results},{
      headers:{"Cache-Control":"no-store","X-Content-Type-Options":"nosniff"}
    });
  } catch {
    return Response.json({error:"Could not load D1 preview data"},{status:503});
  }
}
