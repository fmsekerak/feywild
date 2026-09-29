# Integer character IDs: one-time migration

This changes ONLY character IDs. New `characters` has exactly `id integer GENERATED ALWAYS AS IDENTITY` (starting at 1) and `name text`. `inventory_items.character_id` and `inventory_history.character_id` become integers. Existing character inventories and history are remapped automatically; history for previously deleted characters keeps its name and receives a NULL character ID. Item IDs and catalog IDs stay UUIDs.

**Order matters:**
1. Export `characters`, `inventory_items`, and `inventory_history` as independent CSV backups, and stop all inventory edits during the change.
2. Make sure the public inventory/history migration is installed. Run `supabase/remove-google-auth-legacy.sql` first if you haven't already. Its old membership table cannot coexist with the new ID type.
3. Merge/deploy this PR's JavaScript compatibility change. During the brief gap before SQL runs, existing UUID character IDs will still work. Do not use the site during the migration.
4. Run **`supabase/integer-character-ids.sql` once** in Supabase SQL Editor. It runs inside one transaction, and errors should roll back the changes. Do not manually delete your existing characters or inventory.
5. Reload the character-selection page, choose a character again (previous browser-tab selection IDs are invalid), and verify existing inventory, new item addition, quantity changes, deletion, and Adventure Log.

**Notes:** IDs are allocated starting at 1 in the old characters' creation order. They may not match any old display order or old UUID. `characters` has no portrait, created_at, or other columns after migration. The history table still stores its own audit-row ID and item UUID because those serve different purposes. Do not rerun historical `schema.sql` or `public-inventory-audit.sql` after this migration: they describe the old UUID schema.
