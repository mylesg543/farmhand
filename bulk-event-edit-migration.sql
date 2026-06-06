-- Give events created together a durable identity so they can be edited together.
alter table public.fh_animal_events
  add column if not exists batch_id uuid;

create index if not exists idx_fh_events_batch
  on public.fh_animal_events(user_id, batch_id)
  where batch_id is not null;

-- Create a complete event batch while an admin is emulating a farm.
create or replace function public.add_event_batch_admin(
  target_user_id uuid,
  payload jsonb
)
returns setof public.fh_animal_events
language plpgsql
security definer
set search_path = public
as $$
declare
  event_row jsonb;
  inserted_event public.fh_animal_events;
begin
  if not exists (
    select 1
    from public.fh_user_profiles
    where id = auth.uid()
      and is_admin = true
  ) then
    raise exception 'Admin access required';
  end if;

  for event_row in select value from jsonb_array_elements(payload)
  loop
    insert into public.fh_animal_events (
      animal_id,
      event_type,
      event_date,
      notes,
      user_id,
      batch_id
    )
    values (
      (event_row->>'animal_id')::uuid,
      (event_row->>'event_type')::public.fh_event_type,
      coalesce((event_row->>'event_date')::date, current_date),
      nullif(event_row->>'notes', ''),
      target_user_id,
      (event_row->>'batch_id')::uuid
    )
    returning * into inserted_event;

    return next inserted_event;
  end loop;
end;
$$;

revoke all on function public.add_event_batch_admin(uuid, jsonb) from public;
grant execute on function public.add_event_batch_admin(uuid, jsonb) to authenticated;

-- Return the current event table shape, including batch metadata, in admin emulation.
create or replace function public.get_user_events_with_batches_admin(
  target_user_id uuid
)
returns setof public.fh_animal_events
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1
    from public.fh_user_profiles
    where id = auth.uid()
      and is_admin = true
  ) then
    raise exception 'Admin access required';
  end if;

  return query
  select *
  from public.fh_animal_events
  where user_id = target_user_id
  order by event_date desc, created_at desc;
end;
$$;

revoke all on function public.get_user_events_with_batches_admin(uuid) from public;
grant execute on function public.get_user_events_with_batches_admin(uuid) to authenticated;

-- Update every event in a batch while an admin is emulating a farm in Write Mode.
create or replace function public.update_event_batch_admin(
  target_batch_id uuid,
  target_user_id uuid,
  payload jsonb
)
returns setof public.fh_animal_events
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1
    from public.fh_user_profiles
    where id = auth.uid()
      and is_admin = true
  ) then
    raise exception 'Admin access required';
  end if;

  return query
  update public.fh_animal_events
  set
    event_date = coalesce((payload->>'event_date')::date, event_date),
    notes = case when payload ? 'notes' then nullif(payload->>'notes', '') else notes end
  where batch_id = target_batch_id
    and user_id = target_user_id
  returning *;

  if not found then
    raise exception 'Bulk event not found for this user';
  end if;
end;
$$;

revoke all on function public.update_event_batch_admin(uuid, uuid, jsonb) from public;
grant execute on function public.update_event_batch_admin(uuid, uuid, jsonb) to authenticated;

notify pgrst, 'reload schema';
