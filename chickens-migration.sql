-- ================================================================
-- FarmHand — Chickens & Breed Migration
-- Run in: Supabase Dashboard → SQL Editor → New snippet
-- Adds breed column to fh_animals (works for all species)
-- Safe to run — existing rows default to null
-- ================================================================

alter table fh_animals
  add column if not exists breed text;

create index if not exists idx_fh_animals_breed on fh_animals(breed);
