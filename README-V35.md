# V35 — Separate Entourage Supabase Storage

The Entourage editor remains separated in Admin, and V35 now persists each group to its own Supabase `text[]` column in `wedding_settings`.

## Required Supabase migration

Before deploying V35, open **Supabase → SQL Editor** and run:

`supabase-separate-entourage-v35.sql`

The migration is non-destructive. It adds separate entourage columns, copies existing compatible values from the legacy `entourage` JSON field when the new columns are empty, and keeps the old JSON field for backwards compatibility.

## Separate fields

- Parents of the Groom
- Parents of the Bride
- Primary Sponsors
- Maid of Honor
- Best Men
- Veil
- Cord
- Candle
- Groomsmen
- Bridesmaids
- Ring Bearer
- Coin Bearer
- Bible Bearer
- Flower Girls

The website reads the new columns first. The legacy JSON remains as a fallback and is kept in sync when V35 saves wedding settings.
