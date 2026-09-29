# Feywild character inventory setup

This feature is prepared but NOT LIVE until you configure Supabase and merge this branch.

1. Create a Supabase project. In Authentication > Providers enable Google.
2. Create a Google Cloud OAuth web application. Add the Supabase callback URL shown under the Google provider as an authorized redirect URI. Add your website domain as an authorized JavaScript origin where applicable. Paste the Google client ID and secret into Supabase (NEVER into GitHub).
3. Under Supabase Authentication > URL Configuration set your website's public Site URL and add your exact deployed `characters.html` URL to Redirect URLs. For GitHub Pages project sites, the path may include /feywild/.
4. Run `supabase/schema.sql`, then `supabase/quantity-function.sql` in the Supabase SQL editor.
5. Copy `assets/js/supabase-config.example.js` to `assets/js/supabase-config.js`. Fill in your project URL and PUBLISHABLE key (not a secret or service-role key). Commit only the publishable key. Do not publish this page until RLS is enabled.
6. Visit the deployed characters page and sign in with your own Google account. In Supabase Authentication > Users copy your UUID. In SQL editor:
   insert into public.profiles(id, display_name, is_dm) values ('YOUR_UUID', 'DM', true);
7. Players sign in with Google once, then you find their UUID in Authentication > Users. For each approved player, in SQL editor:
   insert into public.profiles(id,display_name) values ('PLAYER_UUID','Player');
   insert into public.characters(name) values ('Character name') returning id;
   insert into public.character_members(character_id,user_id) values ('CHARACTER_UUID','PLAYER_UUID');
   (Use actual UUIDs returned from Supabase, not these placeholders.)
8. Optionally disable new signups AFTER all your players have signed in. Unassigned Google accounts cannot see or edit inventories because of RLS.
9. Add a Characters link to your existing navigation, or use the new link on the homepage after merge.

Security: RLS is the authorization boundary; a character selection dropdown is not. Keep Google OAuth secrets and Supabase service-role keys out of the repository. Protect your Google and Supabase admin accounts with MFA. Back up inventory periodically. This first version does not yet include item audit history, currency, or a graphical DM admin dashboard. Use the Supabase SQL editor to approve users and assign characters.
