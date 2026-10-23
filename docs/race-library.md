# 2014 race library

Use **Choose race** in the character header, or **Race & Lineage → Browse races & subraces** in Stats & Abilities. Search names/traits, filter by sourcebook, preview a reference, and choose an option. **Save Character** persists the choice. **Use original race** restores the character's existing default and clears the catalog selection.

The source archive contains **296 options from 29 sources**: the 134 base records in the pinned data file, 98 subrace records (five unnamed standard records are merged into their parent), and 69 named variants. The picker shows **247 distinct names**, hiding 49 repeated sourcebook versions. It prefers Monsters of the Multiverse reprints and later 2014-era sources for repeated names. Named subraces and variants remain available. All 296 source records remain available internally so existing saved selections keep their original traits and speed. These counts describe race/subrace/variant options, not distinct species. It includes older and reprinted versions, setting supplements, Plane Shift publications, and clearly marked DMG NPC options. It does not claim to include every homebrew race or every later publication.

## What selection does

- Updates the character header and source abbreviation.
- Supplies base walking speed to Combat Statistics; Satyr and Wood Elf use 35 feet, for example.
- Shows a factual reference for size, creature type, movement, ability increases, senses, resistances, proficiencies, racial spell names, and trait names when available in the source data.
- Identifies entries with subraces or alternate trait choices rather than treating all alternatives as simultaneous benefits.

Ability increases, skill/language choices, feats, racial spells, natural armor, attacks, condition/damage resistances, and conditional movement are **references, not automatically applied effects**. They must still be configured or adjudicated using the cited source. The walking-speed value is a base value, not an exhaustion/armor/class/spell-adjusted total. Existing skills, ability scores, features, spell selections, notes, HP, and inventory are not rewritten by race selection. The race panel does not copy traits into the existing editable Features & Traits field.

No sourcebook is silently assigned to an existing character. Mion's Puca and other existing custom/default identities continue to work. The existing Crotus default spelling is corrected from Saytr to Satyr. Characters without an explicit selection retain the existing 30-foot fallback. New choices use the preferred visible version. Existing selections are never automatically switched to that version. The source filter lists only books with visible choices.

## Source data and reproduction

Source: [5etools 2014 races.json](https://github.com/5etools-mirror-3/5etools-2014-src/blob/e51b3c0707786370e7444d55a9d5a2086bdec591/data/races.json).
Pinned commit: `e51b3c0707786370e7444d55a9d5a2086bdec591`.
Sourcebook titles are indexed in `scripts/race-sources.json` from that revision's `js/parser.js`.

`assets/data/races-2014.json` contains names, source/page references and structured mechanics. It does not include book descriptions, lore, artwork or the original prose entries. The user-facing fact labels and formatting are original. The upstream software license is not presented as a license for publisher-owned book text. Original sourcebook references are retained for rule details that are not modeled by the structured fields.

The importer resolves internal copies, merges base/subrace traits and ability records, handles replacement/removal of inherited traits, and expands named variants. Unsupported copy operations and unresolved parents fail the build. Download the pinned raw JSON locally, then run:

```sh
node scripts/import-races.cjs /path/to/races.json
```

The CLI verifies a canonical input checksum before writing the catalog. To update the source revision, review the new format and adjust the pinned commit/checksum and coverage tests deliberately. The original downloaded source JSON is not committed. Site runtime uses the bundled file and does not call 5etools or GitHub.

## Saving and failure recovery

No database migration is required. One compact `raceSelection2014` JSON string containing the selected ID and display name is saved through the existing profile endpoint. Different source versions have different IDs. No live database values are changed on deployment.

Unrecognized saved IDs remain intact, display their saved name, and leave derived speed blank. A failed catalog fetch also preserves the selection and provides **Retry race library**. Derived speed is excluded from the dirty snapshot because asynchronous catalog loading is not an edit; the race-selection field itself remains tracked. Choosing a race before the profile is loaded is disabled.

## Verification

```sh
node --test tests/race-library.test.cjs tests/equipment.test.cjs tests/level-rules.test.cjs tests/sheet-rules.test.cjs
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/path/to/chromium node tests/browser/race-library.cjs
```

The browser test runs real profile APIs against an isolated in-memory SQLite D1 adapter. It covers search/source filters, pagination, selection/speed, saved data preservation, save/reload, reset, unavailable/unknown entries, retry, custom Puca identity, and a 390-pixel mobile viewport. No production records are used or modified.
