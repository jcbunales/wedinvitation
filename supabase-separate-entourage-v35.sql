-- Wedding Invitation V35 — Separate Entourage Supabase Fields
-- Run this once in Supabase > SQL Editor BEFORE deploying V35.
--
-- This migration is non-destructive:
--   • adds one text[] column for each entourage group;
--   • copies existing values from the old `entourage` JSON where possible;
--   • keeps the old JSON column for compatibility with previous versions.

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

-- Temporary helper used only to migrate names from the legacy entourage JSON.
create or replace function public._v35_entourage_names(p_entourage jsonb, p_role_regex text)
returns text[]
language sql
immutable
set search_path = ''
as $$
  select coalesce(array_agg(n.name order by e.item_ord, n.name_ord), '{}'::text[])
  from jsonb_array_elements(coalesce(p_entourage, '[]'::jsonb)) with ordinality as e(item, item_ord)
  cross join lateral jsonb_array_elements_text(
    case
      when jsonb_typeof(e.item -> 'names') = 'array' then e.item -> 'names'
      else '[]'::jsonb
    end
  ) with ordinality as n(name, name_ord)
  where lower(coalesce(e.item ->> 'role', '')) ~ p_role_regex;
$$;

-- Only backfill a new field when it is still empty, so re-running this migration
-- never overwrites information already entered through the V35 Admin dashboard.
update public.wedding_settings
set
  entourage_parents_groom = case when cardinality(entourage_parents_groom) = 0 then public._v35_entourage_names(entourage, 'parents?[[:space:]]+of[[:space:]]+the[[:space:]]+groom') else entourage_parents_groom end,
  entourage_parents_bride = case when cardinality(entourage_parents_bride) = 0 then public._v35_entourage_names(entourage, 'parents?[[:space:]]+of[[:space:]]+the[[:space:]]+bride') else entourage_parents_bride end,
  entourage_primary_sponsors = case when cardinality(entourage_primary_sponsors) = 0 then public._v35_entourage_names(entourage, '(primary|principal)[[:space:]]+sponsors?|ninong|ninang') else entourage_primary_sponsors end,
  entourage_maid_of_honor = case when cardinality(entourage_maid_of_honor) = 0 then public._v35_entourage_names(entourage, 'maid[[:space:]]+of[[:space:]]+honou?r') else entourage_maid_of_honor end,
  entourage_best_men = case when cardinality(entourage_best_men) = 0 then public._v35_entourage_names(entourage, 'best[[:space:]]+(man|men)') else entourage_best_men end,
  entourage_veil = case when cardinality(entourage_veil) = 0 then public._v35_entourage_names(entourage, '(^|[[:space:]])veil($|[[:space:]])') else entourage_veil end,
  entourage_cord = case when cardinality(entourage_cord) = 0 then public._v35_entourage_names(entourage, '(^|[[:space:]])cord($|[[:space:]])') else entourage_cord end,
  entourage_candle = case when cardinality(entourage_candle) = 0 then public._v35_entourage_names(entourage, '(^|[[:space:]])candle($|[[:space:]])') else entourage_candle end,
  entourage_groomsmen = case when cardinality(entourage_groomsmen) = 0 then public._v35_entourage_names(entourage, 'groomsman|groomsmen') else entourage_groomsmen end,
  entourage_bridesmaids = case when cardinality(entourage_bridesmaids) = 0 then public._v35_entourage_names(entourage, 'bridesmaids?') else entourage_bridesmaids end,
  entourage_ring_bearer = case when cardinality(entourage_ring_bearer) = 0 then public._v35_entourage_names(entourage, 'ring[[:space:]]+bearer') else entourage_ring_bearer end,
  entourage_coin_bearer = case when cardinality(entourage_coin_bearer) = 0 then public._v35_entourage_names(entourage, 'coin[[:space:]]+bearer') else entourage_coin_bearer end,
  entourage_bible_bearer = case when cardinality(entourage_bible_bearer) = 0 then public._v35_entourage_names(entourage, 'bible[[:space:]]+bearer') else entourage_bible_bearer end,
  entourage_flower_girls = case when cardinality(entourage_flower_girls) = 0 then public._v35_entourage_names(entourage, 'flower[[:space:]]+girls?') else entourage_flower_girls end
where id = 1;

drop function if exists public._v35_entourage_names(jsonb, text);
