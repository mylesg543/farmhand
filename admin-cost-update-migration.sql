-- Allow FarmHand admins in Write Mode to edit an expense for the emulated farm.
create or replace function public.update_cost_admin(
  target_cost_id uuid,
  target_user_id uuid,
  payload jsonb
)
returns public.fh_feed_costs
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_cost public.fh_feed_costs;
begin
  if not exists (
    select 1
    from public.fh_user_profiles
    where id = auth.uid()
      and is_admin = true
  ) then
    raise exception 'Admin access required';
  end if;

  update public.fh_feed_costs
  set
    species = coalesce(nullif(payload->>'species', ''), species),
    category = coalesce(nullif(payload->>'category', ''), category),
    description = coalesce(nullif(payload->>'description', ''), description),
    amount = coalesce((payload->>'amount')::numeric, amount),
    date = coalesce((payload->>'date')::date, date)
  where id = target_cost_id
    and user_id = target_user_id
  returning * into updated_cost;

  if updated_cost.id is null then
    raise exception 'Expense not found for this user';
  end if;

  return updated_cost;
end;
$$;

revoke all on function public.update_cost_admin(uuid, uuid, jsonb) from public;
grant execute on function public.update_cost_admin(uuid, uuid, jsonb) to authenticated;

notify pgrst, 'reload schema';
