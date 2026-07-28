# Fern Wedding Invitation Website

A responsive botanical wedding invitation with an animated envelope, RSVP lookup, guest list, confirmation dashboard, venue details, schedule, CSV export, JSON backup, and optional Supabase cloud storage.

## Files

- `index.html` — website and admin interface
- `styles.css` — responsive layout + envelope animation
- `app.js` — RSVP/admin logic and local/Supabase data adapter
- `supabase-config.js` — the only file you edit to connect the website to Supabase
- `supabase-setup.sql` — creates the database tables, security policies, and RSVP functions

## Test locally

Open `index.html` in a browser. With Supabase disabled, the website uses browser `localStorage` and the demo admin passcode is:

`wedding2026`

Local mode is useful for testing only. Data saved in local mode exists only in that browser/device.

## Connect Supabase for GitHub Pages

### 1. Create a Supabase project

Create a project at Supabase.

### 2. Create the database

Open **SQL Editor** in Supabase, paste the full contents of `supabase-setup.sql`, and run it once.

This creates:

- `wedding_settings`
- `guests`
- `wedding_admins`
- secure guest lookup function
- secure RSVP submission function
- public RSVP statistics function
- Row Level Security policies

### 3. Create your admin login

In Supabase go to **Authentication → Users** and create an email/password user.

Copy that user's UUID, then run this in the SQL Editor:

```sql
insert into public.wedding_admins (user_id)
values ('YOUR-AUTH-USER-UUID');
```

Only users listed in `wedding_admins` can read/manage the full guest list or change wedding settings.

### 4. Add the Supabase connection

Open `supabase-config.js` and change:

```js
window.WEDDING_SUPABASE_CONFIG = {
  enabled: true,
  url: "https://YOUR_PROJECT.supabase.co",
  publishableKey: "sb_publishable_YOUR_KEY"
};
```

Get the Project URL and publishable key from your Supabase project settings.

**Do not put a secret key or service-role key in this file.** GitHub Pages is public, so only the publishable browser key belongs here.

### 5. Remove demo guests

The setup SQL inserts a few sample guests only when the guest table is empty. Delete them from the website Admin dashboard before launch, or remove the sample insert section from `supabase-setup.sql` before running it.

### 6. Upload to GitHub Pages

Upload these files to the repository used by GitHub Pages:

```text
index.html
styles.css
app.js
supabase-config.js
```

`supabase-setup.sql` does not need to be publicly hosted for the website to run, although keeping it in a private/source repository can be useful.

## How cloud mode works

Public visitors can:

- read wedding details
- find an invitation using an exact full name or exact email
- submit/update their RSVP
- see aggregate RSVP counts

Public visitors cannot directly read the `guests` table.

Admin users sign in with Supabase Auth and can:

- manage all guests
- edit wedding details and venue information
- view confirmations
- export CSV/JSON
- import backups

## Envelope animation

The opening screen uses a layered envelope structure:

1. envelope back
2. invitation card tucked inside
3. front pocket
4. folding flap
5. wax seal

The card is sized and positioned inside the pocket in the closed state, then moves above the pocket only during the opening sequence. Separate mobile sizing is included to prevent card/flap overlap on narrow screens.
