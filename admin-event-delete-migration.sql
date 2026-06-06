-- Allow authenticated FarmHand admins to delete an animal event while
-- emulating a specific user's farm in Write Mode.
create or replace function public.delete_event_admin(
  target_event_id uuid,
  target_user_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  deleted_event_id uuid;
begin
  if not exists (
    select 1
    from public.fh_user_profiles
    where id = auth.uid()
      and is_admin = true
  ) then
    raise exception 'Admin access required';
  end if;

  delete from public.fh_animal_events
  where id = target_event_id
    and user_id = target_user_id
  returning id into deleted_event_id;

  if deleted_event_id is null then
    raise exception 'Event not found for this user';
  end if;

  return deleted_event_id;
end;
$$;

revoke all on function public.delete_event_admin(uuid, uuid) from public;
grant execute on function public.delete_event_admin(uuid, uuid) to authenticated;

-- Update event fields while emulating a user's farm in Write Mode.
create or replace function public.update_event_admin(
  target_event_id uuid,
  target_user_id uuid,
  payload jsonb
)
returns public.fh_animal_events
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_event public.fh_animal_events;
begin
  if not exists (
    select 1
    from public.fh_user_profiles
    where id = auth.uid()
      and is_admin = true
  ) then
    raise exception 'Admin access required';
  end if;

  update public.fh_animal_events
  set
    event_date = coalesce((payload->>'event_date')::date, event_date),
    notes = case when payload ? 'notes' then nullif(payload->>'notes', '') else notes end,
    photo_url = case when payload ? 'photo_url' then nullif(payload->>'photo_url', '') else photo_url end
  where id = target_event_id
    and user_id = target_user_id
  returning * into updated_event;

  if updated_event.id is null then
    raise exception 'Event not found for this user';
  end if;

  return updated_event;
end;
$$;

revoke all on function public.update_event_admin(uuid, uuid, jsonb) from public;
grant execute on function public.update_event_admin(uuid, uuid, jsonb) to authenticated;
