# Cloudflare D1 migration (preparation only)

This schema is the first step, **not a completed migration**. The live site still uses Supabase.

1. In Cloudflare D1, open `feywild-db` → Console and execute `schema.sql` on the empty database (or use Wrangler with the configured database binding).
2. Export and back up Supabase tables **before** transferring any records. Preserve original character, catalog and inventory IDs so existing references remain valid.
3. Import data only after verifying the existing Supabase schema and writing an idempotent export/import process. The D1 inventory triggers create history entries during imports; historical rows require a deliberate deduplication/backfill plan.
4. Build Pages Functions using `context.env.DB` and enforce server-side authorization **before** enabling any DM/private endpoints. The current DM selector uses sessionStorage and is not secure authentication.
5. Test read/write operations, backups, history and rollback in a preview deployment; only then switch the frontend and retire Supabase.

**Important:** D1 database bindings do not expose data to client-side JavaScript. Do not put API tokens or service secrets in public HTML/JS. The audit table is intentionally not exposed to players. Database history is not a substitute for scheduled backups.
