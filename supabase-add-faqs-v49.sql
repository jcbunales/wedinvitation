-- V49: add editable FAQs to wedding settings.
-- Run once in Supabase > SQL Editor before saving FAQ changes from Admin.
-- Safe to run more than once.

alter table public.wedding_settings
  add column if not exists faqs jsonb not null default '[]'::jsonb;

-- Seed example FAQs only when the field is currently empty.
update public.wedding_settings
set faqs = '[
  {"question":"What time should I arrive?","answer":"Please arrive 20–30 minutes before the ceremony so everyone can be comfortably seated before we begin."},
  {"question":"Can I bring a plus one?","answer":"Please refer to the names listed on your invitation and RSVP. If a plus one is included, you will be able to confirm them when responding."},
  {"question":"What should I wear?","answer":"Please visit the Attire section for our dress code and wedding motif colours."},
  {"question":"Is parking available?","answer":"Please check the Venue section for the latest location, parking, and arrival information."},
  {"question":"When should I RSVP?","answer":"Kindly submit your response by the RSVP deadline shown on the invitation."}
]'::jsonb
where id = 1 and (faqs is null or faqs = '[]'::jsonb);
