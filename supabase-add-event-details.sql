-- Add Reception and Preparation Venue fields to an existing Fern Wedding Invitation Supabase project.
-- Safe to run more than once. Existing guest and RSVP data are not changed.

alter table public.wedding_settings
add column if not exists event_details jsonb not null default
'{"reception":{"date":"","time":"","address":""},"preparation":{"venue":"","address":"","date":""}}'::jsonb;
