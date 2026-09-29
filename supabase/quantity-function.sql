-- Run after schema.sql. Atomic increments prevent lost updates from multiple devices.
create or replace function public.adjust_inventory_quantity(item_id uuid, amount integer)
returns void language plpgsql security invoker set search_path = '' as $$
begin
 if amount not in (-1,1) then raise exception 'Invalid adjustment'; end if;
 update public.inventory_items
 set quantity = quantity + amount
 where id = item_id and quantity + amount between 0 and 999999;
 if not found then raise exception 'Item unavailable or quantity limit reached'; end if;
end;
$$;
revoke all on function public.adjust_inventory_quantity(uuid,integer) from public;
grant execute on function public.adjust_inventory_quantity(uuid,integer) to authenticated;
