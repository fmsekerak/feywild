-- Run AFTER deploying the public inventory and character portal, and after exporting a backup.
-- This removes ONLY obsolete application-side Google-account relationships.
-- It does NOT remove auth.users, character UUIDs, inventory item UUIDs or history IDs.
begin;

-- Remove old signed-in-only RLS policies before removing their helper functions.
drop policy if exists "Read own profile" on public.profiles;
drop policy if exists "Read assigned characters" on public.characters;
drop policy if exists "DM creates characters" on public.characters;
drop policy if exists "DM edits characters" on public.characters;
drop policy if exists "DM deletes characters" on public.characters;
drop policy if exists "Read own memberships" on public.character_members;
drop policy if exists "DM assigns members" on public.character_members;
drop policy if exists "DM unassigns members" on public.character_members;
drop policy if exists "Read authorized inventory" on public.inventory_items;
drop policy if exists "Add authorized inventory" on public.inventory_items;
drop policy if exists "Edit authorized inventory" on public.inventory_items;
drop policy if exists "Remove authorized inventory" on public.inventory_items;
drop policy if exists "Signed in players browse catalog" on public.item_catalog;
drop policy if exists "DM adds catalog items" on public.item_catalog;
drop policy if exists "DM edits catalog items" on public.item_catalog;
drop policy if exists "DM removes catalog items" on public.item_catalog;

-- Character membership and profiles are no longer read by the public website.
drop table if exists public.character_members;
drop table if exists public.profiles;
drop function if exists public.can_access_character(uuid);
drop function if exists public.is_dm();

-- Public inventory policies, item catalog, character rows and append-only audit remain intact.
commit;

-- Optional: Supabase Dashboard > Authentication > Providers > Google > Disable.
-- If you also want old Google auth.users accounts deleted, do that separately
-- through Authentication > Users after checking no other app uses them.
-- Do not delete the auth schema or the built-in anon/authenticated roles.
