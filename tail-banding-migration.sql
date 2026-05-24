-- FarmHand - Tail Banding event type
-- Run in Supabase SQL Editor before saving Tail Banding events
-- if fh_animal_events.event_type is backed by the fh_event_type enum.

alter type fh_event_type add value if not exists 'tail_banding';
