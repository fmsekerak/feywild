-- Run once in Supabase SQL Editor BEFORE deploying the public inventory page.
-- IMPORTANT: anyone with the website URL can change any character's inventory.
-- Existing character and inventory data is preserved.
begin;
-- Public visitors may only read characters and catalog entries.
grant usage on schema public to anon;
grant select on public.characters, public.item_catalog to anon;
create policy "Public reads character names" on public.characters for select to anon using (true);
create policy "Public browses item catalog" on public.item_catalog for select to anon using (true);

-- Allow shared inventory changes, but keep the catalog and character administration private.
grant select, insert, update, delete on public.inventory_items to anon;
create policy "Public reads shared inventory" on public.inventory_items for select to anon using (true);
create policy "Public adds shared inventory" on public.inventory_items for insert to anon with check (true);
create policy "Public edits shared inventory" on public.inventory_items for update to anon using (true) with check (true);
create policy "Public removes shared inventory" on public.inventory_items for delete to anon using (true);

-- Append-only server-generated audit. Never grant INSERT/UPDATE/DELETE to site visitors.
create table if not exists public.inventory_history (
 id bigint generated always as identity primary key,
 changed_at timestamptz not null default now(),
 action text not null check (action in ('added','updated','removed')),
 character_id uuid not null,
 character_name text not null,
 item_id uuid not null,
 item_name text not null,
 old_quantity integer,
 new_quantity integer,
 old_description text,
 new_description text
);
create index if not exists inventory_history_character_time
 on public.inventory_history(character_id, changed_at desc);
alter table public.inventory_history enable row level security;
revoke all on public.inventory_history from public, anon, authenticated;
grant select on public.inventory_history to anon, authenticated;
create policy "Anyone can read inventory history" on public.inventory_history
 for select to anon, authenticated using (true);

create or replace function public.log_inventory_change()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
 old_item public.inventory_items%rowtype;
 new_item public.inventory_items%rowtype;
 char_name text;
begin
 if tg_op = 'INSERT' then
  new_item := new;
 elsif tg_op = 'DELETE' then
  old_item := old;
 else
  old_item := old;
  new_item := new;
  if old_item is not distinct from new_item then return new; end if;
 end if;
 select c.name into char_name from public.characters c
 where c.id = coalesce(new_item.character_id,old_item.character_id);
 insert into public.inventory_history
 (action,character_id,character_name,item_id,item_name,old_quantity,new_quantity,old_description,new_description)
 values (
  case tg_op when 'INSERT' then 'added' when 'DELETE' then 'removed' else 'updated' end,
  coalesce(new_item.character_id,old_item.character_id),
  coalesce(char_name,'Unknown character'),
  coalesce(new_item.id,old_item.id),
  coalesce(new_item.name,old_item.name),
  case when tg_op='INSERT' then null else old_item.quantity end,
  case when tg_op='DELETE' then null else new_item.quantity end,
  case when tg_op='INSERT' then null else old_item.description end,
  case when tg_op='DELETE' then null else new_item.description end
 );
 if tg_op='DELETE' then return old; else return new; end if;
end;
$$;
revoke all on function public.log_inventory_change() from public, anon, authenticated;
drop trigger if exists audit_inventory_changes on public.inventory_items;
create trigger audit_inventory_changes
 after insert or update or delete on public.inventory_items
 for each row execute function public.log_inventory_change();

-- Atomic +/- quantity updates for anonymous visitors.
grant execute on function public.adjust_inventory_quantity(uuid,integer) to anon;
commit;

-- Historical changes from before this migration cannot be reconstructed.
-- To capture a baseline of all CURRENT inventory, run this once after the migration:
insert into public.inventory_history
(action,character_id,character_name,item_id,item_name,old_quantity,new_quantity,old_description,new_description)
select 'added',i.character_id,c.name,i.id,i.name,null,i.quantity,null,i.description
from public.inventory_items i join public.characters c on c.id=i.character_id;
-- IMPORTANT: the baseline INSERT above is NOT idempotent. Run this entire file only once.
