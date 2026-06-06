-- FarmHand - persistent Do Not Breed flag
-- Run in the Supabase SQL Editor before using the Do Not Breed event.

alter type public.fh_event_type add value if not exists 'do_not_breed';

alter table public.fh_animals
  add column if not exists breeding_status text,
  add column if not exists breeding_restriction_reason text,
  add column if not exists breeding_restriction_date date;

