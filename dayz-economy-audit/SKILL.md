---
name: dayz-economy-audit
description: Audit a DayZ mission's loot economy for silent failures - items that can never spawn, broken event loot, container caps, overtime trends across many RPTs - and produce a ranked report with suggested fixes. Read-only until the user approves changes.
---

# DayZ economy health audit

Finds loot problems that DayZ never reports clearly, before players notice. **Read-only:** report first. Fixes go through dayz-loot-economy or dayz-loot-tuning, and only once the user agrees.

## 1. Gather
- Mission files: `db/types.xml`, `db/events.xml`, `cfgeventgroups.xml`, `cfgeventspawns.xml`, `mapgroupproto.xml`, `mapgrouppos.xml`, `cfglimitsdefinition.xml` (plus `cfglimitsdefinitionuser.xml`), `cfgspawnabletypes.xml`, `cfgrandompresets.xml`, `cfgignorelist.xml`, and `cfgeconomycore.xml` (extra `<ce folder>` files can override types).
- Game classes: `config.bin` in the server's `addons\` (and DLC `nasdara\addons\`, `sakhal\addons\`) PBOs, or a class list if the mission keeps one. Watch the case.
- **All** RPT logs in `profiles\`, not just the newest one, for trends.
- If the mission has a validator, run it first and include its ERRORs.

Parse the XML properly (ElementTree or a DOM parser), and never write it back with those tools; they reformat whole files.

## 2. Checks (with severity)
**High: loot that silently never spawns**
- `nominal` > 0, but no `mapgroupproto.xml` group has a matching `usage` **and** a container with the item's `category`. Items with no usage can match anything.
- `deloot="1"` items whose usage has no event child loot table (a `deloot="1"` child in `cfgeventgroups.xml` or an event `<child>`). They can never spawn.
- Class not in the game, or not spawnable (scope < 2): the RPT says `Type 'X' will be ignored`.
- `mapgroupproto.xml` group names that don't match a class exactly (they're case-sensitive), and buildings in `mapgrouppos.xml` with no group.
- A `<container>` with no `lootmax` attribute: the game caps it at 4 items, whatever its points or the group `lootmax` (RPT `containermaxsum: 4`).
- An event child's `lootmax` above the sum of its container `lootmax` values (RPT "Sum of container LootMax is lower than event child LootMax", "Wanting to spawn more loot than possible").
- `cfgspawnabletypes.xml` or `cfgrandompresets.xml` naming classes or presets that don't exist.

**Medium: imbalance**
- `min` > `nominal`; `nominal` > 0 with `restock` 0 and `min` > 0 (never refills); extreme `lifetime` values (under 300, or above 14 days for loot).
- **Overtime pressure:** for each usage (and tier, where known), compare the summed `nominal` against the number of loot points that can take it. Count points per building group in `mapgroupproto.xml`, times the number of those buildings in `mapgrouppos.xml`, ignoring custom per-event points. Flag groups whose nominal is above about 40% of their points.
- **RPT trend:** `causing search overtime: "Item"` counted per item across all logs. Items repeating minutes after start, or in many runs, are real problems; a few at a fresh fill are normal. Also track `Initially (re)spawned:X, Nominal:Y`, where X well below Y after a wipe means unfillable items.
- Duplicate `<type>` entries across `types.xml` and any `<ce>` override files.

**Low: tidiness**
- Items with no `category` (they won't match category-restricted containers), unused usage or value tags in `cfglimitsdefinition.xml`, and `cfgignorelist.xml` entries that are still in `types.xml`.

## 3. Report
- Start with a one-line verdict, then a table: severity, item or group, evidence (file and line, or RPT quote), and the suggested fix. Group repeated items, e.g. "14 clothing items, same cause".
- Add a short "biggest wins" list: the 3–5 fixes that recover the most loot or remove the most overtime.
- For a long report, offer an HTML page (a filterable table). Keep it local unless the user wants to share it.
- Don't edit anything. Ask which fixes to apply, then use dayz-loot-economy or dayz-loot-tuning.

## 4. After fixes
Commit, wipe `storage_1` only with the user's OK, restart, and re-run the audit to compare the before and after counts.
