# Inventory equipment

In the Character Sheet's Inventory tab, use **Equip** / **Unequip** on an item.
The Stats & Abilities tab lists confirmed choices under **Equipped Gear** and
updates the Armor Class tile immediately. Equipment saves automatically;
**Save Character** continues to save ability scores, notes, and other profile fields.

## Supported rules

- One suit of armor and one shield can contribute at a time. Equipping a
  replacement removes the previous item from that slot atomically.
- Unarmored AC is 10 + Dexterity modifier. Light armor adds full Dexterity;
  medium armor caps the modifier at +2 (negative modifiers still apply);
  heavy armor ignores Dexterity. Shields add +2.
- Standard armor/shield names are recognized, including simple +1/+2/+3 names.
- **Equipment settings** lets players map a custom item name to a standard
  armor type or shield and set a 0–3 magic AC bonus. The choice survives unequipping.
- Weapons and other gear can be equipped and shown, but do not create attacks
  or automatically apply other effects. Attunement, rings/cloaks, class/feat/spell
  AC bonuses, alternative AC formulas, armor proficiency penalties, stealth
  disadvantage, hand limits, and armor speed penalties remain manual.
- Removing an item or reducing its quantity to zero unequips it. Increasing
  quantity later does not automatically re-equip it. Equipping uses one item
  from an inventory row; quantity is not consumed.
- If inventory cannot load, AC displays a dash until **Retry inventory** succeeds
  instead of treating an unknown loadout as unarmored.

Rules reference: [D&D Basic Rules 2014 — Equipment](https://www.dndbeyond.com/sources/dnd/basic-rules-2014/equipment#ArmorandShields).
The implementation uses numeric armor mechanics and original UI summaries.

## Storage and deployment

No schema migration or SQL setup is needed. This uses the existing
`character_data` table with sections named `equipment:<inventory item ID>`.
Each record contains a validated type, bonus, equipped boolean, and server-derived slot.
The existing `profile` section is independent, so stale profile saves cannot revert equipment.
No live character values are changed by deploying this code; existing items start unequipped.
The API retains the site's intentionally public inventory-editing model.

`PATCH /api/inventory/equipment` validates item ownership, quantity, type, and
bonus. Armor/shield replacement and quantity/deletion cleanup use D1 batch
transactions. GET inventory joins these records onto existing items. Derived AC
may still be included in legacy profile saves, but reload always recalculates
it from equipment and scores; it is excluded from the profile dirty indicator.

Equipment changes are serialized in the current page. Returning to a visible
browser tab refreshes inventory to pick up changes made elsewhere. Failed writes
retain the last confirmed state; a failed refresh after a successful write shows
a retry message and clears derived AC until confirmation.

## Local verification

With Node 22+ (including `node:sqlite`):

```sh
node --test tests/equipment.test.cjs
```

With Playwright and Chromium available:

```sh
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/path/to/chromium node tests/browser/equipment.cjs
```

The browser test runs real API handlers against an isolated in-memory SQLite
database implementing D1's statement/batch interface. It never calls production.
It covers equip replacement, shield limits, custom armor, failed writes and refreshes,
quantity/deletion cleanup, Dexterity changes, reload, profile saving, and mobile layout.
