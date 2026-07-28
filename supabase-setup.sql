-- Fern Wedding Invitation - Supabase setup
-- Run this once in Supabase > SQL Editor.
-- Then create at least one email/password user in Authentication > Users.

create extension if not exists pgcrypto;

create table if not exists public.wedding_settings (
  id integer primary key default 1 check (id = 1),
  partner_one text not null default 'Olivia',
  partner_two text not null default 'Ethan',
  wedding_date date not null default '2026-08-24',
  wedding_time time not null default '16:00',
  rsvp_deadline date not null default '2026-07-01',
  venue_name text not null default 'The Garden Estate',
  venue_address text not null default '123 Bloomfield Road, Sydney NSW',
  map_link text default '',
  venue_notes text default '',
  welcome_message text default '',
  schedule jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

insert into public.wedding_settings (
  id, partner_one, partner_two, wedding_date, wedding_time, rsvp_deadline,
  venue_name, venue_address, map_link, venue_notes, welcome_message, schedule
)
values (
  1,
  'Olivia',
  'Ethan',
  '2026-08-24',
  '16:00',
  '2026-07-01',
  'The Garden Estate',
  '123 Bloomfield Road, Sydney NSW',
  'https://maps.google.com/?q=The+Garden+Estate+Sydney',
  'Complimentary parking is available on site. Please arrive 20–30 minutes before the ceremony begins.',
  'We are so excited to celebrate this chapter with you. Join us for a garden ceremony, dinner, drinks, dancing, and a night to remember.',
  '[{"time":"3:30 PM","title":"Guest arrival","note":"Please make your way to the garden ceremony area."},{"time":"4:00 PM","title":"Ceremony","note":"We say “I do” surrounded by our favourite people."},{"time":"5:00 PM","title":"Cocktail hour","note":"Drinks, canapés, photos, and time to mingle."},{"time":"6:15 PM","title":"Reception","note":"Dinner, speeches, cake, and dancing into the night."}]'::jsonb
)
on conflict (id) do nothing;

create table if not exists public.guests (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text default '',
  phone text default '',
  party_size integer not null default 1 check (party_size between 1 and 20),
  group_name text default '',
  admin_notes text default '',
  status text not null default 'Pending' check (status in ('Pending','Attending','Declined')),
  attending_count integer not null default 0 check (attending_count >= 0),
  meal_choice text default '',
  plus_one_name text default '',
  dietary_notes text default '',
  responded_at timestamptz,
  updated_at timestamptz not null default now()
);

create index if not exists guests_name_lower_idx on public.guests (lower(name));
create index if not exists guests_email_lower_idx on public.guests (lower(email));
create index if not exists guests_status_idx on public.guests (status);

-- Only users listed here are allowed to use the admin dashboard.
-- After creating your Auth user, copy its UUID and run:
-- insert into public.wedding_admins (user_id) values ('YOUR-AUTH-USER-UUID');
create table if not exists public.wedding_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.wedding_admins enable row level security;

create or replace function public.is_wedding_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.wedding_admins a
    where a.user_id = auth.uid()
  );
$$;

revoke execute on function public.is_wedding_admin() from public, anon;
grant execute on function public.is_wedding_admin() to authenticated;

alter table public.wedding_settings enable row level security;
alter table public.guests enable row level security;

-- Wedding details are public, but only signed-in admins can change them.
drop policy if exists "Public can read wedding settings" on public.wedding_settings;
create policy "Public can read wedding settings"
on public.wedding_settings for select
to anon, authenticated
using (true);

drop policy if exists "Authenticated admins can update wedding settings" on public.wedding_settings;
create policy "Authenticated admins can update wedding settings"
on public.wedding_settings for update
to authenticated
using ((select public.is_wedding_admin()))
with check ((select public.is_wedding_admin()));

drop policy if exists "Authenticated admins can insert wedding settings" on public.wedding_settings;
create policy "Authenticated admins can insert wedding settings"
on public.wedding_settings for insert
to authenticated
with check (id = 1 and (select public.is_wedding_admin()));

-- The guest table itself is never readable to anonymous visitors.
-- Signed-in users in this Supabase project can manage the dashboard.
drop policy if exists "Authenticated admins can read guests" on public.guests;
create policy "Authenticated admins can read guests"
on public.guests for select
to authenticated
using ((select public.is_wedding_admin()));

drop policy if exists "Authenticated admins can insert guests" on public.guests;
create policy "Authenticated admins can insert guests"
on public.guests for insert
to authenticated
with check ((select public.is_wedding_admin()));

drop policy if exists "Authenticated admins can update guests" on public.guests;
create policy "Authenticated admins can update guests"
on public.guests for update
to authenticated
using ((select public.is_wedding_admin()))
with check ((select public.is_wedding_admin()));

drop policy if exists "Authenticated admins can delete guests" on public.guests;
create policy "Authenticated admins can delete guests"
on public.guests for delete
to authenticated
using ((select public.is_wedding_admin()));

-- Anonymous guest lookup: exact full name OR exact email only.
-- SECURITY DEFINER lets the function read the protected guest table without
-- granting anonymous SELECT on the whole table.
create or replace function public.lookup_guest(p_query text)
returns table (
  id uuid,
  name text,
  party_size integer,
  status text,
  attending_count integer,
  meal_choice text,
  plus_one_name text,
  dietary_notes text,
  responded_at timestamptz
)
language sql
security definer
set search_path = ''
as $$
  select
    g.id, g.name, g.party_size, g.status, g.attending_count,
    g.meal_choice, g.plus_one_name, g.dietary_notes, g.responded_at
  from public.guests g
  where lower(trim(g.name)) = lower(trim(p_query))
     or (g.email <> '' and lower(trim(g.email)) = lower(trim(p_query)))
  limit 1;
$$;

create or replace function public.submit_rsvp(
  p_guest_id uuid,
  p_status text,
  p_attending_count integer,
  p_meal_choice text default '',
  p_plus_one_name text default '',
  p_dietary_notes text default ''
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_party_size integer;
begin
  if p_status not in ('Attending', 'Declined') then
    raise exception 'Invalid RSVP status';
  end if;

  select party_size into v_party_size
  from public.guests
  where id = p_guest_id;

  if v_party_size is null then
    raise exception 'Invitation not found';
  end if;

  if p_status = 'Attending' and (p_attending_count < 1 or p_attending_count > v_party_size) then
    raise exception 'Invalid attending count';
  end if;

  update public.guests
  set
    status = p_status,
    attending_count = case when p_status = 'Attending' then p_attending_count else 0 end,
    meal_choice = case when p_status = 'Attending' then coalesce(p_meal_choice, '') else '' end,
    plus_one_name = case when p_status = 'Attending' then coalesce(p_plus_one_name, '') else '' end,
    dietary_notes = coalesce(p_dietary_notes, ''),
    responded_at = now(),
    updated_at = now()
  where id = p_guest_id;

  return true;
end;
$$;

create or replace function public.public_rsvp_stats()
returns table (attending integer, responses integer)
language sql
security definer
set search_path = ''
as $$
  select
    coalesce(sum(case when status = 'Attending' then attending_count else 0 end), 0)::integer,
    count(*) filter (where status <> 'Pending')::integer
  from public.guests;
$$;

-- Restrict function execution explicitly.
revoke execute on function public.lookup_guest(text) from public;
revoke execute on function public.submit_rsvp(uuid,text,integer,text,text,text) from public;
revoke execute on function public.public_rsvp_stats() from public;

grant execute on function public.lookup_guest(text) to anon, authenticated;
grant execute on function public.submit_rsvp(uuid,text,integer,text,text,text) to anon, authenticated;
grant execute on function public.public_rsvp_stats() to anon, authenticated;

-- Data API grants. RLS still controls which rows each role can access.
revoke all on public.wedding_admins from anon, authenticated;
grant select on public.wedding_settings to anon, authenticated;
grant insert, update on public.wedding_settings to authenticated;
grant select, insert, update, delete on public.guests to authenticated;

-- Optional sample guests. Delete these rows before launch if you do not want demo records.
insert into public.guests (name,email,phone,party_size,group_name,status,attending_count,meal_choice,plus_one_name,dietary_notes,responded_at)
select * from (values
  ('Alex Morgan','alex@example.com','0412 345 678',2,'Friends','Attending',2,'Chicken','Jordan Lee','No peanuts please','2026-06-18T08:45:00Z'::timestamptz),
  ('Sophie & Daniel Tan','sophie@example.com','',2,'Family','Pending',0,'','','',null::timestamptz),
  ('Mia Wilson','mia@example.com','',1,'Friends','Declined',0,'','','Travelling overseas that week','2026-06-15T03:10:00Z'::timestamptz)
) as demo(name,email,phone,party_size,group_name,status,attending_count,meal_choice,plus_one_name,dietary_notes,responded_at)
where not exists (select 1 from public.guests);
