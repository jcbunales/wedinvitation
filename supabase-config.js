/*
  Supabase connection for GitHub Pages
  ------------------------------------
  1. Create a Supabase project.
  2. Run supabase-setup.sql in the Supabase SQL Editor.
  3. Create your admin user in Authentication > Users.
  4. Add that user's UUID to public.wedding_admins (see README.md).
  5. Paste the Project URL + PUBLISHABLE key below.
  6. Set enabled to true.

  IMPORTANT: Use a PUBLISHABLE key (sb_publishable_...) here.
  Never place a secret/service-role key in a public GitHub Pages repository.
*/
window.WEDDING_SUPABASE_CONFIG = {
  enabled: true,
  url: "https://biuheptwrsggwblrynrb.supabase.co",
  publishableKey: "sb_publishable_p4tGSYPLqBwEQCyYepEzLw_Yvh7ASJZ"
};
