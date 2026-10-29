---
name: dayz-economy-audit
description: Read-only DayZ loot audit - items that can never spawn, broken event loot, container caps, overtime trends across all RPTs - as a ranked report with suggested fixes.
---

# DayZ economy audit (read-only)
Report first. Fixes go through dayz-loot-economy or dayz-loot-tuning, and only with the user's OK.

## Gather
- `db/types.xml`, `db/events.xml`, `cfgeventgroups.xml`, `cfgeventspawns.xml`, `mapgroupproto.xml`, `mapgrouppos.xml`, `cfglimitsdefinition*.xml`, `cfgspawnabletypes.xml`, `cfgrandompresets.xml`, `cfgignorelist.xml`, and `cfgeconomycore.xml` (extra `<ce>` type files).
- Game classes (`config.bin` or a class list) and **all** RPTs. Run the mission validator if there is one.
- Parse the XML, but never write it back with a parser.

## Checks
**High (never spawns):**
- `nominal` > 0 with no proto group that has both the item's usage and a container with its category (no usage = matches anything)
- `deloot="1"` items whose usage has no `deloot="1"` event child loot table
- unknown or non-spawnable classes (RPT `will be ignored`)
- case-mismatched proto groups, and `mapgrouppos.xml` buildings with no group
- **a `<container>` without `lootmax` (capped at 4)**, and event child `lootmax` above the container sum
- missing classes or presets in `cfgspawnabletypes`/`cfgrandompresets`

**Medium:**
- min > nominal; nominal > 0 with restock 0 and min > 0; lifetime under 300 s or over 14 days
- **overtime pressure:** summed nominal per usage against points (points per proto group × buildings in `mapgrouppos`); flag over about 40%
- **RPT trend:** overtime counts per item across runs, and `Initially (re)spawned` well below nominal after a wipe
- duplicate `<type>` entries across override files

**Low:** no category, unused usage or value tags, ignore-list entries still in types.

## Report
A verdict, then a table (severity, item or group, evidence with file:line or an RPT quote, fix), with repeats grouped. Then the 3–5 biggest wins. Offer an HTML table for long reports and keep it local. After fixes: commit, wipe (with the OK), restart and re-run to compare.
