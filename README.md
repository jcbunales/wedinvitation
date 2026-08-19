# Wedding Invitation Website

Clean production build of the wedding invitation website.

## Main files

- `index.html` — website markup
- `styles.css` — consolidated site styles
- `app.js` — wedding data, admin, RSVP, Supabase integration, and public rendering
- `navigation.js` — public section navigation
- `supabase-config.js` — Supabase project configuration
- `assets/` — images currently used by the website

## Supabase

For a new database, run `supabase-setup.sql` in the Supabase SQL Editor.

For an existing database created before the newer venue/entourage updates, keep and run the relevant migration files if they have not already been applied:

- `supabase-add-event-details.sql`
- `supabase-separate-entourage-v35.sql`

Do not put a Supabase service-role key in `supabase-config.js`; use the browser-safe publishable/anon key expected by the site.


## V48 Gift Guide
Run `supabase-add-gift-guide-v48.sql` once in Supabase SQL Editor to enable the editable Gift Guide text field.

## V49 FAQs

The public invitation includes an editable FAQs section. In **Admin → Wedding details**, enter one FAQ per line using `Question | Answer`. If Supabase is enabled, run `supabase-add-faqs-v49.sql` once in the Supabase SQL Editor before saving FAQ changes.
