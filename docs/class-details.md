# Character class reference

The Class Details tab follows the hardcoded class in `assets/js/character-details.js`. Its first full reference is Mion’s **2014 Artificer**, using the 2020 Tasha’s Cauldron of Everything version (not the revised 2025 Artificer). Other characters get their own class name, Hit Die, level and proficiency overview, with an explicit coverage message. Hayden’s existing Halfwit section remains unchanged in Stats & Abilities; expanding that homebrew class remains deferred.

## Coverage

- Core features through level 20, ASIs, starting proficiencies/equipment and multiclass reference.
- All four specialists: Alchemist, Armorer, Artillerist, Battle Smith; features and all five specialist-spell pairs each.
- All 16 Tasha’s infusion options, level/item/attunement requirements, and the four named replication tables (51 items). The common-item alternative is described; individual magic-item descriptions are not duplicated.
- Spell preparation, tools, rituals, live DC/attack and preparation allowance; 95 spell **names** from PHB/XGE/TCE. Later setting-specific spells and spell descriptions are outside this index. Existing SRD Spellbook coverage is unchanged.
- Elixir effects, both armor models, cannon modes, Steel Defender and Homunculus Servant statistics.
- Base progression for every level. Prepared spells round half the level down; Artificer spell-slot progression rounds it up. Armorer’s two additional active infusions are shown separately from the base cap after level 9.

The bundled JSON contains independently written, compact rules summaries and factual tables. It does not contain sourcebook prose or artwork. Primary rules source: [Tasha’s Cauldron of Everything](https://www.dndbeyond.com/sources/dnd/tcoe), pp. 9–23. Numerical tables, identifiers and completeness were cross-checked against `5etools-mirror-3/5etools-2014-src` at commit `e51b3c0707786370e7444d55a9d5a2086bdec591`:

- `data/class/class-artificer.json`
- Artificer entries in `data/optionalfeatures.json`
- `data/bestiary/bestiary-tce.json` (two companions)
- `data/generated/gendata-spell-source-lookup.json` and PHB/XGE/TCE spell files. Include both `class` and `classVariant` Artificer membership; XGE spells use the latter.

## Saving and automation

`classSpecialist2014` stores only an explicit selection, e.g. `artificer:armorer`. Its hidden input exists before profile loading, so asynchronous reference fetching cannot erase a saved value. Unknown values survive until deliberately replaced. No default specialist is selected. Selection is unavailable before level 3 and before profile loading completes. Lowering level preserves the choice but removes the Armorer infusion-cap bonus below level 9.

Search, level filter and specialist browsing are unnamed controls and never dirty or save the profile. “Use this specialist” records the choice; the normal Save Character workflow persists it. Reference rendering never changes ability scores, gear, HP, features, spells, proficiencies or resource trackers. Selecting a specialist **does not** automatically grant attacks, companion records, prepared spellbook entries or equipment bonuses. This distinction is stated on the tab. No D1 migration or API changes are needed.

Fetch failures offer retry and preserve profile fields. Live totals follow character level and INT; missing INT displays an em dash for dependent totals. Features default to current-and-earlier levels; All levels includes later unlocks with labels. The progression table scrolls inside its panel on narrow screens.

## Local verification

```sh
node --test tests/class-details.test.cjs tests/level-rules.test.cjs tests/sheet-rules.test.cjs tests/equipment.test.cjs tests/race-library.test.cjs
node tests/browser/class-details.cjs
```

Browser integration requires Node 22+, Playwright and Chromium (optionally set `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`). It uses the actual profile API with a local in-memory SQLite D1 adapter, never production data. Covers browse/selection separation, all four specialists, saved/unknown choices, level/INT updates, failure/retry, data preservation, other classes and mobile overflow.
