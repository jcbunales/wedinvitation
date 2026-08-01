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


## Background music

The Admin dashboard now has a **Background music** section. Choose an audio file, enter a title, and click **Upload music**. The public invitation shows a floating vinyl player in the lower-right corner. The site attempts to start the song when a guest clicks **Open invitation**; if the browser blocks playback, the guest can tap the vinyl disc.

When Supabase is enabled, run the updated `supabase-setup.sql` once. It adds `music_settings`, creates a public `wedding-media` Storage bucket (15 MB limit), and restricts upload/update/delete access to users listed in `wedding_admins`. In local mode the audio file is stored in IndexedDB in that browser only.


## Vintage stationery theme
The public wedding site uses a burgundy, olive, gold and warm-paper stationery treatment inspired by traditional printed invitation suites. Theme colours remain editable from the Admin dashboard.


## Arched menu update
The Home section uses arched vintage invitation cards. Back to menu returns directly to the section launcher, and the Home content uses a staggered entrance animation after the envelope opens.


## RSVP layout fix
The RSVP interface now uses a flexible lookup card. When a guest is found, the main form expands to a full-width response layout so attendance choices, guest counts, meal preference, plus-one, dietary notes, and actions do not become cramped. The companion card collapses into a horizontal summary on desktop and a stacked card on mobile.


## Venue + Details V3
- Redesigned Details as a cream stationery card with a centred floating monogram and separated content panels.
- Restored the Church illustration label as a translucent image overlay.
- Uses cache-busting asset names: styles-venue-details-v3.css and app-venue-details-v3.js.


Update: Details section redesigned to better match the theme, and hidden-section CSS fixed so the Details section no longer remains visible when other sections are opened.


V5 update: Details section restyled with a more formal luxury invitation look. Admin dashboard redesigned to match the wedding theme with a refined olive, burgundy, cream, and gold palette, plus improved responsive layouts for mobile and desktop.


V6 update: Fixed admin OE logo styling, guest CSV import button layout, schedule delete button layout, changed Details section accent cards to a cream palette, and refined the Details monogram.


V7 update: Floating admin button made translucent, admin emblem removed, guest list action buttons aligned, guest import button matched to other buttons, guest editor modal layout improved, and the Details section cards were forced back to a cream palette.


V8 update: Details section redesigned to better match the other wedding sections with a formal cream invitation-card layout, refined typography, a cleaner monogram, and improved mobile/desktop responsiveness.


V9 update: Details section restyled to look more like a classic invitation card, with a narrower centered paper layout, classic invitation wording, centered typography, and mobile/desktop refinements.


V10 update: Details section made more ornate and vintage with richer decorative flourishes and refined paper styling. The Add Guest modal is now properly centered within the viewport.


V11 update: Added a smooth drop-down entrance animation for the envelope when the website first loads. The envelope falls from above, settles with a soft bounce, then reveals the Open Invitation controls.


V12 update: Redesigned the intro envelope with a classier vintage treatment: richer olive tones, antique gold lining, refined flap/pocket styling, a more elegant OE wax seal, and a coordinated cream invitation insert.
