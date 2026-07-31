# Fern Wedding Invitation Website

A responsive wedding invitation website with a built-in guest and RSVP manager.

## Features
- Botanical cream/sage invitation design inspired by elegant fern stationery
- Wedding date/time and live countdown
- Venue details and Google Maps link
- Editable wedding schedule
- RSVP lookup by guest name or email
- Attendance, party count, meal choice, plus-one name, dietary notes/messages
- Admin dashboard with guest list and RSVP confirmation list
- Search/filter guests
- Add, edit, and delete guest records
- Change wedding details from the dashboard
- Export RSVP list to CSV
- Export/import complete JSON backup
- Persistent browser storage using `localStorage`

## Open the website
Double-click `index.html`, or host the folder with any static web server.

## Admin access
Default passcode: `wedding2026`

You can change the passcode under **Admin → Wedding details**.

## Important note about storage
This version stores data in the browser's `localStorage`. That is ideal for a self-contained demo/prototype, but it does **not** synchronise guest responses between different devices.

For a public production wedding site, connect the interface to a real database/backend such as Supabase, Firebase, or your own API. The admin authentication should also move to a secure server-side login rather than a browser passcode.

## Opening animation
The website now begins with an animated wedding envelope. Guests click **Open invitation** to lift the card from the envelope and reveal the full website. The names and wedding date on the animated card stay in sync with the Wedding Admin settings.


## Multiple entourage members

In **Admin → Wedding details → Entourage**, enter one role per line. Use a semicolon (`;`) between multiple people in the same role. Example:

```text
Bridesmaids | Anna Cruz; Maria Santos; Grace Lee; Julia Reyes
Groomsmen | James Lee; Noah Smith; Ethan Reyes; Lucas Chen
```

The public entourage section automatically renders group members in a responsive grid and stacks them vertically on small screens. Existing older entries using `·` separators remain supported.


## Theme color picker

Open **Admin > Wedding details > Theme colors** to change the primary olive, accent burgundy, background cream, and gold detail colors without editing CSS. The page previews changes immediately; press **Save wedding details** to persist them.

If Supabase was already configured before this version, run the updated `supabase-setup.sql` once in the Supabase SQL Editor. It safely adds the `theme_colors` column (plus the entourage/dress columns if your older database is missing them) without deleting existing records.
