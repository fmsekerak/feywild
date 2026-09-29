# Public shared inventory setup

**Run the database migration before merging/deploying this PR.**

1. Optional but strongly recommended: export `characters`, `inventory_items`, and `item_catalog` from Supabase Table Editor as CSV and store copies somewhere private.
2. In Supabase Dashboard → SQL Editor, open and run the entire `supabase/public-inventory-audit.sql` script **once**. It retains existing inventory and catalog data, opens character/inventory browsing and editing to anonymous visitors, creates an append-only database-triggered history, and records a one-time baseline of all currently held items.
3. Confirm `inventory_history` exists in Table Editor and has baseline rows for your existing items. Then merge the PR and let Cloudflare deploy.
4. Test adding, incrementing, decrementing, and deleting a test item on a test character. Check that the Adventure Log updates and that `inventory_history` captures each operation. Test in a private browser window without signing in.

**Important limitations and safeguards**

- This is intentionally a **public, shared inventory**. Anyone with the site or public Supabase URL can read all character names and inventories and edit/delete any inventory item. Avoid putting sensitive personal information in character names or descriptions.
- The Adventure Log records server timestamps, item identity, character, old/new quantities, and descriptions, including deletions. It is append-only for normal website visitors, and survives removal of inventory rows. It **cannot identify who** changed an item without authentication.
- The log is a history, **not an independent disaster-recovery backup**. A Supabase project owner, database compromise, or database loss can affect both inventory and log. Export CSV backups regularly or configure an independent scheduled backup.
- The former DM-only **crafting import button is removed** because allowing it publicly would permit catalog vandalism. Existing imported catalog entries remain. Future catalog imports should run via trusted Supabase SQL Editor or a separately secured server-side admin flow.
- Do **not** delete Supabase Auth users or drop existing tables; they may still contain your previous membership data and old policies. Google is removed from the **website flow**, but you may separately disable Google in Supabase Authentication → Providers after verifying this works.
- The SQL file is a one-time migration; rerunning the baseline section would create duplicate baseline history rows. If you need to retry after partial execution, inspect the error before rerunning.
