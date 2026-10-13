# Cloudflare D1 — Feywild

The **live** character selector and inventory now use Cloudflare D1, through Cloudflare Pages Functions. The Pages D1 binding must be named `DB` and point to `feywild-db`.

## Data and routes
- `cloudflare/schema.sql` defines the six tables: `characters`, `item_catalog`, `inventory_items`, `inventory_history`, `character_data`, and `campaign_entries`.
- `GET /api/inventory/characters`: public character list.
- `GET /api/inventory/catalog`: public catalog.
- `GET /api/inventory/items?character_id=...`: public character inventory.
- `POST /api/inventory/items`: add catalog item to a character.
- `PATCH /api/inventory/items/:id`: adjust quantity by ±1.
- `DELETE /api/inventory/items/:id`: remove item.
- `/d1-preview.html` and `/api/d1-status` are migration diagnostics.

**Security:** All inventory editing is intentionally public, by site owner choice. Anyone can edit any character's inventory. Never expose `campaign_entries`, private character details, or DM notes through these unauthenticated routes. The current DM selection uses browser sessionStorage and **does not authenticate a Dungeon Master**. Implement server-verified authentication and authorization before DM-private APIs.

## Backups and rollback
- Preserve the Supabase project and the original CSV exports as a **historical snapshot**, not an automatically updated backup. New D1 changes are not replicated to Supabase.
- Regularly export/back up the D1 database separately; inventory history is an audit log, not a backup.
- D1 triggers should be present: `inventory_log_insert`, `inventory_log_update`, `inventory_log_delete`. They record inventory changes.
- To roll back the frontend to Supabase, restore the old frontend and configuration **and reconcile newer D1 writes first**. Reverting a PR alone will not migrate D1 changes back.

## Useful checks in D1 Console
```sql
SELECT name FROM sqlite_master WHERE type='trigger' AND name LIKE 'inventory_log_%';
SELECT action,item_name,old_quantity,new_quantity,changed_at FROM inventory_history ORDER BY changed_at DESC LIMIT 10;
SELECT COUNT(*) FROM characters;
SELECT COUNT(*) FROM item_catalog;
```

Do not commit CSV exports, private D1 dumps, or credentials to the public GitHub repository.
