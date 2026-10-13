// Cloudflare Pages Function: checks the D1 binding without exposing records.
// GET /api/d1-status
export async function onRequestGet({ env }) {
  if (!env.DB) {
    return Response.json({ ok: false, message: "D1 binding DB is missing." }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
  try {
    const result = await env.DB.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name IN ('characters', 'item_catalog', 'inventory_items', 'inventory_history', 'character_data', 'campaign_entries')").all();
    const names = new Set((result.results || []).map(row => row.name));
    return Response.json({
      ok: names.size === 6,
      databaseConnected: true,
      schemaReady: names.size === 6,
      tablesFound: names.size,
      expectedTables: 6
    }, { status: names.size === 6 ? 200 : 503, headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ ok: false, message: "Could not query D1. Check the binding and schema." }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
