---
name: dayz-loot-tuning
description: Boost or cut DayZ loot by rule (category, usage, tier, tag, name pattern) with multipliers in types.xml, before/after tables, overtime checks and one-commit rollback.
---

# DayZ loot tuning by rule

## 1. Rules
Turn the request into a table (rule | selects | multiplier), e.g. food → `category food` → nominal and min ×1.5. Selectors: category, usage, value (tier), tag, name regex, or a list. By default the first matching rule wins, and values multiply from the **current** numbers. Use "×N of vanilla" to start from the `vanilla-<version>` git tag instead.

**Excluded unless named:** `deloot="1"` items (event-only), `nominal` 0, `crafted="1"`, and custom content in the mission notes.

## 2. Apply
- Edit the numbers inside each `<type>` in place. Never re-save with an XML library, which reformats the whole file.
- Round half up. Keep min ≤ nominal. Items with nominal ≥ 1 stay ≥ 1, and items with min ≥ 1 keep min ≥ 1 when boosting.
- Change `restock`/`lifetime` only if asked.
- Commit first; the rules table goes in the commit message, so `git revert` undoes everything.

## 3. Show
Per rule: items changed, total nominal before → after, the five biggest changes, and the map-wide `count_in_map` total before → after.

## 4. Overtime safety
- Warn if the map total rises by more than about 30%, or a usage+tier group by more than about 50%.
- Don't boost items already "causing search overtime" in recent RPTs; suggest cutting them instead.
- **After:** wipe (with the OK), restart and check that `Initially (re)spawned` ≈ the new nominal and overtime didn't grow. If a group overtimes, scale it back.

## 5. Profiles (optional)
Rule sets can live as git branches or tags (switch with `git checkout <profile> -- db/types.xml`) or as JSON rules re-applied from the vanilla tag. Only use separate `<ce folder>` types files after confirming in the RPT that they take effect.
