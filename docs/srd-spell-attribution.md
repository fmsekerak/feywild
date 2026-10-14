# SRD 5.1 Spell Library — Sources and Attribution

This website bundles a normalized, static JSON copy of **319 spells** from the **2014 D&D System Reference Document 5.1** at `assets/data/srd-2014-spells.json`.

## Copyright and license

This work includes material taken from the **System Reference Document 5.1 (“SRD 5.1”) by Wizards of the Coast LLC**, available at https://dnd.wizards.com/resources/systems-reference-document.

SRD 5.1 is licensed under the **Creative Commons Attribution 4.0 International License (CC BY 4.0)**: https://creativecommons.org/licenses/by/4.0/legalcode

The data was transformed from the English 2014 spell records in the 5e-bits/5e-database repository:
https://github.com/5e-bits/5e-database/blob/main/src/2014/en/5e-SRD-Spells.json

That project's code and JSON structure are MIT licensed; its README also references the Open Gaming License for underlying material. This integration uses only the SRD 5.1 spell subset and provides the CC BY 4.0 attribution above. The source data was transformed by retaining spell name, level, school, classes, casting time, range, components, material, duration, ritual/concentration flags, description, and higher-level text. Other fields were omitted. No non-SRD 5etools book material was imported.

The website is an unofficial fan tool and is not affiliated with or endorsed by Wizards of the Coast LLC.

## Implementation

- `assets/data/srd-2014-spells.json`: static local search database; no third-party runtime requests.
- `assets/js/spell-library.js`: filters, expandable spell details, and a saved-spell selection list.
- `assets/css/spell-library.css`: responsive styling.
- Saved spell IDs are stored as a comma-separated value in the existing character-profile D1 record under `srdSpells`. The existing **Save Character** button persists changes. There is no database migration.
- Existing freeform spell notes, cantrips, and spell slots remain untouched.

**Important:** The site does not automatically enforce class spell eligibility or character level. The class filter is for browsing only; the DM and players decide what spells a character can learn or prepare.
