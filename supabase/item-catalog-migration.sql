-- Run once in Supabase SQL Editor. Keeps existing manually entered inventory intact.
create table if not exists public.item_catalog (
 id uuid primary key default gen_random_uuid(),
 name text not null unique check (length(trim(name)) between 1 and 120),
 description text not null default '',
 category text not null default 'Miscellaneous',
 rarity text not null default 'Common',
 created_at timestamptz not null default now()
);
alter table public.item_catalog enable row level security;
create policy "Signed in players browse catalog" on public.item_catalog for select to authenticated using (true);
create policy "DM adds catalog items" on public.item_catalog for insert to authenticated with check (public.is_dm());
create policy "DM edits catalog items" on public.item_catalog for update to authenticated using (public.is_dm()) with check (public.is_dm());
create policy "DM removes catalog items" on public.item_catalog for delete to authenticated using (public.is_dm());
alter table public.inventory_items add column if not exists catalog_item_id uuid references public.item_catalog(id) on delete restrict;
create index if not exists inventory_catalog_item_idx on public.inventory_items(catalog_item_id);
-- Require new inventory additions to select an existing catalog entry.
-- Existing legacy items without a catalog reference remain readable/editable.
create or replace function public.require_catalog_item()
returns trigger language plpgsql set search_path = '' as $$
begin
 if new.catalog_item_id is null then
  raise exception 'Choose an item from the item catalog';
 end if;
 select name, description into new.name, new.description
 from public.item_catalog where id = new.catalog_item_id;
 if not found then raise exception 'Catalog item not found'; end if;
 return new;
end;
$$;
drop trigger if exists inventory_catalog_insert on public.inventory_items;
create trigger inventory_catalog_insert before insert on public.inventory_items
for each row execute function public.require_catalog_item();
-- Sample items; replace or expand with your campaign-specific catalog.
insert into public.item_catalog(name, description, category, rarity) values
 ('Potion of Healing','Restores 2d4 + 2 hit points.','Potion','Common'),
 ('Rope (50 feet)','Hempen rope, 50 feet.','Adventuring Gear','Common'),
 ('Torch','Provides light when lit.','Adventuring Gear','Common')
on conflict (name) do nothing;
