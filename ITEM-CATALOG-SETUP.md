# Shared inventory item catalog

This update adds a central `item_catalog` table. Players search and choose existing items instead of typing item names and descriptions.

## Install (required before merging)
1. In your Feywild Supabase project open SQL Editor > New query.
2. Copy and run `supabase/item-catalog-migration.sql` from this branch. It preserves existing inventories and creates a starter catalog of three items.
3. After deployment, sign in as DM and click **Import / update crafting recipes** on the character page. This imports items from the same published Google Sheet as the existing crafting search page. Re-run after spreadsheet changes (manual sync, not automatic). In Table Editor > item_catalog, you can also add your own campaign items. Required: name; optional: description, category, rarity. Only trusted DM/admin SQL or an authenticated DM with the database's DM permission can edit the catalog.
4. Merge the pull request and wait for Cloudflare to deploy. Hard-refresh `https://intothefeywild.com/characters.html`, sign in, choose a character, and search for Potion of Healing.
5. Add it, refresh, and verify the inventory still shows it.

Existing inventory rows are retained even if they were typed manually. New inventory additions must use the catalog. If the migration has not run, the new picker will display a database error and cannot add items.

## Security
Catalog reading is limited to authenticated users. Catalog edits require `public.is_dm()`. Existing inventory RLS still limits access to assigned characters and DMs. Do not publish secret/service-role keys.

## Future improvements
A full DM-facing catalog editor could be added later. Crafting imports are manual and use the published Google Sheet; they do not automatically sync in the background. This initial version intentionally does not import crafting recipes as inventory items automatically.
