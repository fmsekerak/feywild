# Character race assignments

Races are assigned by the site owner in `assets/js/character-details.js`. There is no race picker, search, source filter, or reset control on the character sheet. Edit the `race` and `raceSource` fields together to change an assignment:

| Character | Race | Source |
| --- | --- | --- |
| Mion | Puca | Custom; details pending (`raceSource: ""`) |
| Hayden | Human | Player's Handbook 2014 (`PHB`) |
| Ruin | Firbolg | Monsters of the Multiverse (`MPMM`) |
| Crotus | Satyr | Monsters of the Multiverse (`MPMM`) |

The Race & Lineage panel is a read-only reference. Linked races supply base walking speed: Human and Firbolg 30 feet, Satyr 35 feet. Puca keeps the existing 30-foot campaign fallback until its custom rules are provided; no Puca traits are invented. Race assignment is resolved from the character's displayed name using the same configuration as the header.

Ability increases, skill/language choices, feats, racial spells, natural armor, attacks, resistances, and conditional movement remain references, not automatic effects. Scores, features, spells, notes, HP, and inventory are not rewritten. The speed is a base value, not an exhaustion/armor/class/spell-adjusted total.

The bundled archive still contains all 296 source records and the 247-name deduplication helper remains available for future catalog use, but the sheet no longer exposes that list. It includes source/page references, structured facts, and trait names rather than sourcebook prose.

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

## Existing saves and failure recovery

No database migration is required. Old `raceSelection2014` and `race` values remain preserved in the original profile data when saving, but they do not override configured assignments. The sheet no longer renders or saves a race-selection input. Editing `character-details.js` changes the assignment after deployment without requiring players to select a race or save their character first.

A failed catalog fetch leaves the configured name visible, clears the linked race's derived speed rather than guessing, and offers **Retry race library**. Custom races retain their fallback independently of catalog availability. An invalid configured name/source combination displays an unavailable reference and leaves derived speed blank. Derived speed is excluded from the dirty snapshot because asynchronous loading is not an edit.

## Verification

```sh
node --test tests/race-library.test.cjs
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/path/to/chromium node tests/browser/race-library.cjs
```

The browser test uses real profile API handlers and an isolated SQLite D1 adapter. It checks all four assignments against conflicting saved race values, absence of picker controls, base speed, data preservation on save/reload, custom Puca, catalog failure/retry, and a 390-pixel mobile viewport. Production records are not used or modified.
