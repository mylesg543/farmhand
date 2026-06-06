-- ================================================================
-- FarmHand Database Setup
-- All tables are prefixed with fh_ so they never conflict
-- with any existing tables in your Supabase project.
--
-- HOW TO RUN:
--   Supabase Dashboard → SQL Editor → New query
--   Paste ALL of this → click Run
-- ================================================================

-- 1. Extensions
create extension if not exists "pgcrypto";

-- 2. Enums (drop and recreate safely)
do $$ begin
  create type fh_animal_sex    as enum ('ram', 'ewe', 'wether', 'male', 'female', 'castrated');
exception when duplicate_object then null; end $$;

do $$ begin
  create type fh_animal_status as enum ('alive', 'sold', 'deceased');
exception when duplicate_object then null; end $$;

do $$ begin
  create type fh_event_type as enum (
    'hoof_trimming', 'vaccination', 'sickness',
    'do_not_breed', 'lambing', 'tail_banding', 'sale', 'death', 'custom'
  );
exception when duplicate_object then null; end $$;

-- 3. fh_animals — all animals across all species
create table if not exists fh_animals (
  id          uuid primary key default gen_random_uuid(),
  species     text not null default 'sheep',     -- sheep, chickens, cows, pigs, goats
  name        text not null,
  tag_number  text not null,
  sex         text not null default 'ewe',
  birth_date  date,
  status      fh_animal_status not null default 'alive',
  notes       text,
  photo_url   text,
  breeding_status text,
  breeding_restriction_reason text,
  breeding_restriction_date date,
  sire_id     uuid references fh_animals(id) on delete set null,
  dam_id      uuid references fh_animals(id) on delete set null,
  created_at  timestamptz not null default now(),
  unique(species, tag_number)                    -- tag numbers unique per species
);

-- 4. fh_animal_events — event history for any animal
create table if not exists fh_animal_events (
  id          uuid primary key default gen_random_uuid(),
  animal_id   uuid not null references fh_animals(id) on delete cascade,
  event_type  fh_event_type not null,
  event_date  date not null default current_date,
  notes       text,
  created_at  timestamptz not null default now()
);

-- 5. fh_feed_costs — feed/food cost tracking per species
create table if not exists fh_feed_costs (
  id          uuid primary key default gen_random_uuid(),
  species     text not null,                     -- sheep, chickens, cows, etc.
  description text not null,
  amount      numeric(10, 2) not null check (amount > 0),
  date        date not null default current_date,
  created_at  timestamptz not null default now()
);

-- 6. Indexes for fast queries
create index if not exists idx_fh_animals_species       on fh_animals(species);
create index if not exists idx_fh_animals_status        on fh_animals(status);
create index if not exists idx_fh_animals_sire          on fh_animals(sire_id);
create index if not exists idx_fh_animals_dam           on fh_animals(dam_id);
create index if not exists idx_fh_events_animal         on fh_animal_events(animal_id);
create index if not exists idx_fh_events_date           on fh_animal_events(event_date);
create index if not exists idx_fh_costs_species         on fh_feed_costs(species);
create index if not exists idx_fh_costs_date            on fh_feed_costs(date);

-- ================================================================
-- Storage bucket setup
-- Run AFTER creating the bucket manually in the Supabase UI:
--   Storage → New bucket → name: fh-animal-photos → Public ON
-- Then run these two lines:
-- ================================================================

-- create policy "Public photo read"
--   on storage.objects for select
--   using ( bucket_id = 'fh-animal-photos' );

-- create policy "Allow photo uploads"
--   on storage.objects for insert
--   with check ( bucket_id = 'fh-animal-photos' );

-- ================================================================
-- Optional: seed some test data to verify everything works
-- Uncomment and run after the tables are created:
-- ================================================================

-- insert into fh_animals (species, name, tag_number, sex, birth_date, status, notes)
-- values
--   ('sheep', 'Bella', 'TAG-001', 'ewe', '2021-03-15', 'alive', 'Very calm, great mother.'),
--   ('sheep', 'Duke',  'TAG-002', 'ram', '2020-01-10', 'alive', 'Strong. Used for breeding.');

-- insert into fh_feed_costs (species, description, amount, date)
-- values
--   ('sheep',    'Hay bale x10',         85.00, current_date),
--   ('chickens', 'Layer pellets 20kg',   28.00, current_date);
