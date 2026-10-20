# Stats & Abilities session tools

The sheet keeps its existing three independent columns, dark green/pink palette, and named-input Save Character workflow. No database migration is needed. Original profile keys, freeform attack notes, and legacy feature data remain intact.

## Included

- Damage/healing actions: temporary HP absorbs damage first; current HP cannot fall below zero; healing stops at maximum HP. Healing from zero clears death saves. Death-save failures, resistance, vulnerability, concentration checks, and massive damage are adjudicated during play.
- All 14 ordinary 2014 conditions, removable and expandable, plus cumulative exhaustion reminders. These are reminders; they do not secretly alter stored abilities, AC, speed, maximum HP, or concentration.
- Attack cards: player-selected ability and proficiency, damage dice/type, ability-to-damage toggle, separate extra attack/damage bonuses, range and notes. Original attack text stays available below the cards. Spells normally do not add the casting ability to damage; turn that toggle off when creating a spell attack.
- Built-in Bardic Inspiration and Druid Wild Shape counters, including level/CHA scaling and fifth-level Bard short-rest recharge. Other limited abilities can use named custom counters with an editable maximum and short/long/manual recharge. Changing class/level does not delete stored resource data or refill spent uses. Unlimited Wild Shape is represented at level 20.
- Hit Dice spent tracker; short-rest dice rolls with Constitution and Durable's minimum when selected. Extra healing from Song of Rest, Chef, or other effects is handled separately.
- Short/long rest preview with explicit Apply/Cancel. Escape cancels. Short rests restore qualifying resources and Warlock slots when selected. Long rests restore HP and selected spell slots, clear temporary HP/death saves, and recover half the total Hit Dice, rounded down, minimum one. Exhaustion drops by one only if the player marks sufficient food/drink. Conditions, Inspiration, concentration, Halfwit points and manual resources stay tracked.
- Compact skill rows with proficiency/expertise gems and calculated bonuses. The saving-throw subsection and skill breakdown dropdowns have been removed; previously saved saving-throw choices stay in profile data. Passive Perception includes Perception expertise.
- Inspiration point counter with gem styling and plus/minus controls, saved with the profile. Legacy checked/unchecked values become 1/0; multiple points support the campaign’s house rule.
- Unsaved status at the top and beside Save Character, including browser navigation protection. A failed save keeps the dirty state. Editing during a save leaves those newer edits dirty. Save stays disabled if initial profile loading fails.

All new state uses the existing JSON profile. Rest buttons update the local sheet; players still select **Save Character**. Level changes do not refill resources. Base armor/speed calculations retain the prior implementation's limits, explained in the sheet.

## Validation

Run arithmetic/progression tests:

```sh
node --test tests/*.test.cjs
```

With Playwright and Chromium installed, run the isolated browser regression:

```sh
node tests/browser/sheet-tools.cjs
```

`PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` can select an installed Chromium binary. `SHEET_SCREENSHOTS_DIR` optionally saves desktop/mobile screenshots into an existing directory. The browser suite serves this checkout locally and mocks API calls: it never writes to production D1.

Review in the Cloudflare preview: damage with temporary HP; heal; toggle conditions/skill proficiency and adjust Inspiration; create an attack; spend a resource; preview/cancel/apply rests; Save Character and reload. Check mobile and each character.

## Deferred

The complete Hayden Halfwit source import is on the backburner at Faith's request. The partial foundation remains; no missing class mechanics are inferred. Subclass-specific resource rules and other automatic class-feature grants need their own source review.

## Rules attribution

This work includes material taken from the System Reference Document 5.1 (“SRD 5.1”) by Wizards of the Coast LLC, available at https://dnd.wizards.com/resources/systems-reference-document. The SRD 5.1 is licensed under the Creative Commons Attribution 4.0 International License available at https://creativecommons.org/licenses/by/4.0/legalcode. The UI uses condensed explanations of 2014 mechanics.

The combat-statistic “How?” expanders have been removed. Skill breakdown dropdowns and the saving-throw subsection are also removed. Inspiration is in the character header, immediately to the left of Level.
