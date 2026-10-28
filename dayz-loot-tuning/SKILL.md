---
name: dayz-loot-tuning
description: Boost or reduce DayZ loot by rule (category, usage, tier, tag or name pattern) with multipliers in types.xml, with a before/after table, overtime safety checks and easy rollback.
---

# DayZ loot tuning by rule

For requests like "boost food 50%", "halve Tier 4 military", "more ammo but fewer guns", "loot like ScaleSpeeder's boosted files". Change many `types.xml` entries by **rule**, never by hand one at a time.

## 1. Pin down the rules
Turn the request into explicit rules and confirm them with the user if anything is ambiguous:

| Rule | Selects items where | Multiplier |
|---|---|---|
| e.g. food | `<category name="food">` | nominal ×1.5, min ×1.5 |
| e.g. top-tier military | usage `Military` AND value `Tier4` | nominal ×0.7 |
| e.g. 9 mm | name matches `^(Ammo|Mag)_.*9x19` | nominal ×2 |

Selectors: category, usage, value (tier), tag, name regex, or an explicit list. Several rules can apply: say whether they multiply together or the first match wins (default: the first match wins, in table order).

**Base:** multiply from the **current** values by default. If the user says "×1.5 of vanilla", read the numbers from the `vanilla-<version>` git tag, so repeated tuning doesn't compound.

**Always excluded unless the user names them:**
- `deloot="1"` items (event-only loot, e.g. heli crash guns, or loot for a custom event)
- `nominal` 0 (vehicles, infected, animals, props, crafted-only)
- `crafted="1"` items
- custom content listed in the mission's notes (e.g. a CLAUDE.md), if it has any

## 2. Apply the change safely
- **Edit the text in place.** Work through each `<type name="…">…</type>` block and replace only the numbers inside `<nominal>`, `<min>` (and `<restock>`/`<lifetime>` if asked). Never re-save the file with ElementTree; that reformats 30,000 lines and wrecks the diff.
- **Rounding:** round half up.
- **Keep the logic valid:**
  - min ≤ nominal
  - an item that had nominal ≥ 1 keeps at least 1 unless the user asked to remove it
  - an item that had min ≥ 1 keeps min ≥ 1 when boosting
- **Optional extras** (only when asked): a lower `restock` refills faster; a longer `lifetime` keeps items on the ground longer.
- Commit to git first, so `git revert` undoes the whole tuning in one step. Put the rules table in the commit message.

## 3. Show the before/after
Before committing, show a table per rule: number of items changed, total nominal before → after, the five biggest changes. Add a line for the map-wide total of `count_in_map` items, before → after.

## 4. Overtime safety
The map only has so many loot spots for each usage and tier. Raising `nominal` past that doesn't add loot; it causes **search overtime**, and loot of that kind refills slower.
- **Warn before applying** if the map-wide total rises by more than about 30%, or a single usage+tier group rises by more than about 50%.
- **Check the latest RPT** for items already "causing search overtime" (on Chernarus this is often police Tier 3/4). Don't boost those further; suggest lowering them instead.
- **After the change:** wipe `storage_1` (with the user's OK) so the fresh fill shows the real result, restart, and check with dayz-server-check:
  - `Initially (re)spawned:X, Nominal:Y` should be close to the new total
  - overtime lines should not grow
  - if a group overtimes, scale that rule back and repeat

## 5. Switchable profiles (optional)
If the user wants packs they can switch on and off ("weekend boost", "hardcore"), save each rule set as a git branch or a tagged commit and switch with `git checkout <profile> -- db/types.xml`. Or store the rules as JSON in `tools/loot_profiles/` and re-run the tuning from the vanilla tag.

A separate types file loaded through `cfgeconomycore.xml` `<ce folder>` is another way to layer overrides. Only use that after confirming in the RPT that the override takes effect, because duplicates across files are easy to get wrong.

## 6. Finish
Validate (your mission validator if you have one, or check each file parses as XML), show `git diff --stat`, commit with the rules table, and remind the user that already-spawned loot stays until it despawns, unless `storage_1` is wiped.
