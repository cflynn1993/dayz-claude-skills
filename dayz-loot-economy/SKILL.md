---
name: dayz-loot-economy
description: Edit a DayZ mission's loot economy safely: types.xml items, custom usage tags, mapgroupproto loot tables, animal/infected territories and mapgrouppos rotation conversion.
---

# DayZ loot economy edits

Applies to any mission folder (e.g. `DayZServer\mpmissions\dayzOffline.chernarusplus`). If it's a git repo with a CLAUDE.md or other notes, read them first.
- **Before editing:** commit, so `git status` is clean. Outside git, copy files to `<file>.bak-before-<tag>`.
- **After editing:** run your mission validator if you have one, or at least check each file parses as XML.
- Then restart and check the log with the dayz-server-check skill, and commit.

## Before adding or changing any item
- **Check the class exists** in the installed game, with exact case. Look in the `config.bin` files inside the server's `addons\`, `nasdara\addons\` and `sakhal\addons\` PBOs, or use DayZ Editor's object search. Known traps (1.30):
  - `Glock_Tan` doesn't exist; the class is `Glock19_Tan` (even Bohemia's Nasdara files use the wrong name).
  - `CeramicPot_*` doesn't exist in 1.30.
- Configs written by other AIs or from other maps often contain wrong names. Check every new name against the RPT ("Type does not exist").

## types.xml fields that matter
- `nominal`/`min`: the target and refill threshold. `restock`: seconds before a refill attempt. 1800 or more avoids repeated search overtime.
- `usage` (where it spawns) and `value` (tier). An item with tier tags only spawns where the area's tier matches; remove tier tags for loot meant for a specific event.
- `deloot="1"`: the item spawns **only** in event children with `deloot="1"` whose loot table usage matches. It's removed from normal map loot, which is why AK74/FAMAS/SVD are heli-crash-only. Never flag common items (food, matches, bandages) unless you mean to remove them from the map.
- Items with no usage tag can match any loot table (e.g. `MilitaryCap_Desert` is deloot with no usage).

## Loot unique to one place (custom usage tag)
1. Add `<usage name="MyTag"/>` to `cfglimitsdefinition.xml`.
2. In `mapgroupproto.xml`, give the target building groups `<usage name="MyTag"/>` and add categories (e.g. `food`) to their containers if needed.
3. Give the chosen items `<usage name="MyTag"/>` only, no tier tags, a small `nominal` (1–3) and `min` 0, plus `deloot="1"` if they'll only spawn through an event.
4. **Check against vanilla:** run the server, then check the RPT for `SpawnRandomLoot … deloot:` lines and no errors. Confirm the items in game.

## Search overtime fixes
Cause: too many items asked for in too few matching spots, e.g. Police Tier 3/4 on Chernarus. Lower `nominal`/`min`, raise `restock`, or widen usage or tier only if the user agrees to change which areas get the best loot. Test after a `storage_1` wipe so a fresh fill shows the real result.

## Animal and infected territories
- **Territory file** (`env/<name>_territories.xml`):
```xml
<territory-type><territory color="2801795072">
  <zone name="Rest" smin="0" smax="0" dmin="0" dmax="0" x="…" z="…" r="65"/>
  <zone name="HuntingGround" smin="0" smax="0" dmin="0" dmax="0" x="…" z="…" r="55"/>
</territory></territory-type>
```
  Use one territory per area, with a rest zone and roaming zones on land.
- **`cfgenvironment.xml`:** add `<file path="env/<name>_territories.xml"/>` and a block such as `<territory type="Herd" name="Dog" behavior="DZDogGroupBeh"><file usable="<name>_territories"/></territory>`. Copy the behaviour from the source map.
- **`db/events.xml` (Animal…):** `nominal` is the number of packs; `min`/`max` is the pack size. Copy the children (variants) from the source map and confirm they're in `types.xml`.
- **`cfgeventspawns.xml`:** add an empty `<event name="AnimalX" />`.
- **Town positions:** `config.bin` in `worlds_<map>.pbo` → `CfgWorlds > <World> > Names` (types Capital, City, Village). For "coastal", check distance to sea-level water in the navigation mesh, and keep zone centres off water. Some map labels sit in water: Chernogorsk's is in the harbour.
- **Verify:** the RPT shows `[n] AnimalX` with "Primary Spawner: Animal … active: yes" and `Create entity type '<variant>'` lines, with no territory errors.

## Permanently placed buildings (object spawner and mapgrouppos)
- **Object spawner JSON:** `{"Objects":[{"name":"Class","pos":[x,y,z],"ypr":[yaw,0,0],"scale":1.0,"enableCEPersistency":0}]}`. Add it to `cfggameplay.json` under `WorldsData.objectSpawnersArr`, and `serverDZ.cfg` needs `enableCfgGameplayFile = 1`. It's rebuilt every start, works on console, and isn't saved.
- **Loot for placed buildings:** add `mapgrouppos.xml` lines using DayZ Editor's own conversion:
  - `pos` = the object's world position
  - `rpy` = "roll pitch yaw" (e.g. `0 0 <yaw>`)
  - `a` = `90 − yaw`, or `−yaw − 270` when yaw ≤ −90

  Never copy the editor's yaw straight into `a`. A building must also have a loot table group in `mapgroupproto.xml` (exact case).
- Don't use `mapgrouppos` for buildings spawned by an event.
