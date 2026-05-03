-- ================================================================
-- FarmHand — Plants Taxonomy Migration
-- Run in: Supabase Dashboard → SQL Editor → New query
-- Adds category/subtype/subspecies columns to fh_plants
-- Safe to run — uses IF NOT EXISTS / ADD COLUMN IF NOT EXISTS
-- ================================================================

alter table fh_plants
  add column if not exists plant_category   text default 'other',
  add column if not exists plant_subtype    text,
  add column if not exists plant_subspecies text;

-- Index for filtering by category
create index if not exists idx_fh_plants_category on fh_plants(plant_category);
