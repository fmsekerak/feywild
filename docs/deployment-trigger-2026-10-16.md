# Cloudflare Pages production deployment check

This documentation-only commit is intended to trigger a new GitHub `main` build after merging.

- Production branch: `main`
- Verify the latest production deployment commit matches the new merge commit.
- Confirm that the Features & Traits picker appears on the character sheet.
- No website behavior, database schema, or character data is changed by this file.

If the production deployment does not start after merge, investigate the Cloudflare Pages Git integration and build triggers rather than redeploying an older preview.
