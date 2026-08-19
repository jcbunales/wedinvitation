-- V52 compatibility / schema sync
-- Safe to run more than once. This does not delete existing wedding or guest data.

alter table public.wedding_settings add column if not exists gift_guide text default '';
alter table public.wedding_settings add column if not exists faqs jsonb not null default '[]'::jsonb;
alter table public.wedding_settings add column if not exists event_details jsonb not null default '{"reception":{"date":"","time":"","address":""},"preparation":{"venue":"","address":"","date":""}}'::jsonb;
alter table public.wedding_settings add column if not exists entourage jsonb not null default '[]'::jsonb;
alter table public.wedding_settings add column if not exists entourage_parents_groom text[] not null default '{}'::text[];
alter table public.wedding_settings add column if not exists entourage_parents_bride text[] not null default '{}'::text[];
alter table public.wedding_settings add column if not exists entourage_primary_sponsors text[] not null default '{}'::text[];
alter table public.wedding_settings add column if not exists entourage_maid_of_honor text[] not null default '{}'::text[];
alter table public.wedding_settings add column if not exists entourage_best_men text[] not null default '{}'::text[];
alter table public.wedding_settings add column if not exists entourage_veil text[] not null default '{}'::text[];
alter table public.wedding_settings add column if not exists entourage_cord text[] not null default '{}'::text[];
alter table public.wedding_settings add column if not exists entourage_candle text[] not null default '{}'::text[];
alter table public.wedding_settings add column if not exists entourage_groomsmen text[] not null default '{}'::text[];
alter table public.wedding_settings add column if not exists entourage_bridesmaids text[] not null default '{}'::text[];
alter table public.wedding_settings add column if not exists entourage_ring_bearer text[] not null default '{}'::text[];
alter table public.wedding_settings add column if not exists entourage_coin_bearer text[] not null default '{}'::text[];
alter table public.wedding_settings add column if not exists entourage_bible_bearer text[] not null default '{}'::text[];
alter table public.wedding_settings add column if not exists entourage_flower_girls text[] not null default '{}'::text[];
alter table public.wedding_settings add column if not exists dress_motif text default '';
alter table public.wedding_settings add column if not exists theme_colors jsonb;
alter table public.wedding_settings add column if not exists music_settings jsonb;
alter table public.wedding_settings add column if not exists schedule jsonb not null default '[]'::jsonb;

-- Ensure row 1 exists without overwriting an existing row.
insert into public.wedding_settings (id)
values (1)
on conflict (id) do nothing;

-- Populate starter FAQs only when the FAQ column is still empty.
update public.wedding_settings
set faqs = '[
  {"question":"What time should I arrive?","answer":"Please arrive 20–30 minutes before the ceremony so everyone can be seated comfortably."},
  {"question":"Can I bring a plus one?","answer":"Please refer to your invitation or RSVP record for the number of seats reserved for your party."},
  {"question":"Is parking available?","answer":"Please check the Venue section for the latest parking and arrival information."}
]'::jsonb
where id = 1 and (faqs is null or faqs = '[]'::jsonb);

-- Ask PostgREST to refresh its schema cache after adding columns.
select pg_notify('pgrst', 'reload schema');
