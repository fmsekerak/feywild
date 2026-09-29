-- Run once in your Supabase SQL editor. Never put service-role keys in this repository.
create extension if not exists pgcrypto;
create table public.profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 display_name text,
 is_dm boolean not null default false
);
create table public.characters (
 id uuid primary key default gen_random_uuid(),
 name text not null,
 portrait_url text,
 created_at timestamptz not null default now()
);
create table public.character_members (
 character_id uuid not null references public.characters(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 primary key(character_id,user_id)
);
create table public.inventory_items (
 id uuid primary key default gen_random_uuid(),
 character_id uuid not null references public.characters(id) on delete cascade,
 name text not null check (length(trim(name)) between 1 and 120),
 description text not null default '',
 quantity integer not null default 1 check (quantity between 0 and 999999),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create index on public.inventory_items(character_id);
create index on public.character_members(user_id);
create function public.is_dm() returns boolean language sql stable security definer set search_path = '' as $$
 select exists(select 1 from public.profiles where id = (select auth.uid()) and is_dm = true);
$$;
create function public.can_access_character(cid uuid) returns boolean language sql stable security definer set search_path = '' as $$
 select public.is_dm() or exists(select 1 from public.character_members where character_id = cid and user_id = (select auth.uid()));
$$;
revoke all on function public.is_dm() from public;
revoke all on function public.can_access_character(uuid) from public;
grant execute on function public.is_dm(), public.can_access_character(uuid) to authenticated;
alter table public.profiles enable row level security;
alter table public.characters enable row level security;
alter table public.character_members enable row level security;
alter table public.inventory_items enable row level security;
create policy "Read own profile" on public.profiles for select to authenticated using (id = (select auth.uid()));
create policy "Read assigned characters" on public.characters for select to authenticated using (public.can_access_character(id));
create policy "DM creates characters" on public.characters for insert to authenticated with check (public.is_dm());
create policy "DM edits characters" on public.characters for update to authenticated using (public.is_dm()) with check (public.is_dm());
create policy "DM deletes characters" on public.characters for delete to authenticated using (public.is_dm());
create policy "Read own memberships" on public.character_members for select to authenticated using (user_id = (select auth.uid()) or public.is_dm());
create policy "DM assigns members" on public.character_members for insert to authenticated with check (public.is_dm());
create policy "DM unassigns members" on public.character_members for delete to authenticated using (public.is_dm());
create policy "Read authorized inventory" on public.inventory_items for select to authenticated using (public.can_access_character(character_id));
create policy "Add authorized inventory" on public.inventory_items for insert to authenticated with check (public.can_access_character(character_id));
create policy "Edit authorized inventory" on public.inventory_items for update to authenticated using (public.can_access_character(character_id)) with check (public.can_access_character(character_id));
create policy "Remove authorized inventory" on public.inventory_items for delete to authenticated using (public.can_access_character(character_id));
create function public.touch_inventory() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;
create trigger touch_inventory before update on public.inventory_items for each row execute function public.touch_inventory();
-- After your first Google login, manually approve your own account:
-- insert into public.profiles (id, display_name, is_dm)
-- values ('YOUR_AUTH_USERS_UUID', 'Dungeon Master', true);
-- For players: insert profiles with is_dm=false, then insert character_members.
-- Only perform these admin inserts using Supabase SQL editor or trusted server.
