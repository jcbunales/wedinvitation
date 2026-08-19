-- V48: Add editable Gift Guide text to wedding settings.
-- Safe to run more than once.

alter table public.wedding_settings
  add column if not exists gift_guide text default '';

update public.wedding_settings
set gift_guide = 'Your presence is the greatest gift of all. Should you wish to bless us with a gift, a contribution toward our future together would be warmly appreciated.'
where coalesce(trim(gift_guide), '') = '';
