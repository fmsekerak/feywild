-- ONE-TIME MIGRATION. Export characters, inventory_items, inventory_history FIRST.
-- Run after remove-google-auth-legacy.sql. Stop all inventory edits during migration.
-- The new characters table has EXACTLY id integer GENERATED ALWAYS AS IDENTITY and name.
-- Existing character inventory and history are remapped in one transaction.
begin;
set local lock_timeout = '10s';
lock table public.characters, public.inventory_items, public.inventory_history in access exclusive mode;

do $$
begin
 if to_regclass('public.character_members') is not null then
  raise exception 'Run remove-google-auth-legacy.sql first (character_members still exists)';
 end if;
 if (select data_type from information_schema.columns
     where table_schema='public' and table_name='characters' and column_name='id') <> 'uuid' then
  raise exception 'Expected UUID characters.id; migration may already have been run';
 end if;
end $$;

-- Temporarily remove trigger; recreate against the new integer character table below.
drop trigger if exists audit_inventory_changes on public.inventory_items;
drop function if exists public.log_inventory_change();

-- Keep old rows until ALL dependent data has been converted.
alter table public.characters rename to characters_uuid_old;
alter table public.characters_uuid_old rename constraint characters_pkey to characters_uuid_old_pkey;
create table public.characters (
 id integer generated always as identity (start with 1 increment by 1) primary key,
 name text not null
);
-- Stable, deterministic mapping for existing characters.
create temporary table character_id_map (
 old_id uuid primary key, new_id integer not null unique
) on commit drop;
with inserted as (
 insert into public.characters(name)
 select name from public.characters_uuid_old order by created_at, id
 returning id, name
)
-- Duplicate names are allowed; mapping by name would be ambiguous. Instead use
-- a temporary ordered staging map before insert (handled below).
select 1;
-- Rebuild inserted characters deterministically with row numbers paired to IDs.
-- The block above inserted the rows; pair via row order of old created_at/id and
-- the sequential new identity IDs, which start at 1 on this newly created table.
insert into character_id_map(old_id,new_id)
select old_id, rn from (
 select id old_id, row_number() over(order by created_at,id)::integer rn
 from public.characters_uuid_old
) ordered;

-- Replace the old UUID foreign key before changing inventory column.
alter table public.inventory_items drop constraint if exists inventory_items_character_id_fkey;
alter table public.inventory_items add column character_id_new integer;
update public.inventory_items i set character_id_new=m.new_id
from character_id_map m where i.character_id=m.old_id;
do $$ begin
 if exists(select 1 from public.inventory_items where character_id_new is null) then
  raise exception 'Unmapped inventory character: transaction rolled back';
 end if;
end $$;
alter table public.inventory_items drop column character_id;
alter table public.inventory_items rename column character_id_new to character_id;
alter table public.inventory_items alter column character_id set not null;
alter table public.inventory_items add constraint inventory_items_character_id_fkey
 foreign key(character_id) references public.characters(id) on delete cascade;
create index if not exists inventory_items_character_id_idx on public.inventory_items(character_id);

-- Preserve history of deleted characters: those rows retain character_name and
-- receive NULL character_id because their original character no longer exists.
alter table public.inventory_history add column character_id_new integer;
update public.inventory_history h set character_id_new=m.new_id
from character_id_map m where h.character_id=m.old_id;
alter table public.inventory_history drop column character_id;
alter table public.inventory_history rename column character_id_new to character_id;
create index if not exists inventory_history_character_id_idx
 on public.inventory_history(character_id,changed_at desc);

-- Keep the public RLS rules and table grants that were on the OLD characters table.
alter table public.characters enable row level security;
grant select on public.characters to anon;
create policy "Public reads character names" on public.characters for select to anon using (true);
-- Never grant public character editing.
revoke insert,update,delete on public.characters from anon;

create or replace function public.log_inventory_change()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
 old_item public.inventory_items%rowtype;
 new_item public.inventory_items%rowtype;
 char_name text;
begin
 if tg_op = 'INSERT' then new_item := new;
 elsif tg_op = 'DELETE' then old_item := old;
 else
  old_item := old; new_item := new;
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
create trigger audit_inventory_changes
 after insert or update or delete on public.inventory_items
 for each row execute function public.log_inventory_change();

-- Remove old UUID character rows/table only after all mappings succeeded.
drop table public.characters_uuid_old;
commit;

-- After committing: refresh the website, then verify character cards, inventory,
-- and Adventure Log. Old tab selections are invalidated by the companion JS update.
-- Item IDs and catalog IDs intentionally remain UUIDs; only CHARACTER IDs change.
