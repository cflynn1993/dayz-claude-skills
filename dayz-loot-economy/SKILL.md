---
name: dayz-loot-economy
description: Edit DayZ loot safely - types.xml items, custom usage tags, mapgroupproto loot tables, animal/infected territories, object spawner and mapgrouppos placement.
---

# DayZ loot economy edits
Standard workflow: commit first → edit in place (never reformat) → validate or parse-check → restart and check (dayz-server-check) → commit.

## Every item
- **Exists with exact case:** game `config.bin` (`addons\`, `nasdara\addons\`, `sakhal\addons\`), a class list, or the RPT "Type does not exist". Configs from other AIs or maps often have wrong names (e.g. `Glock_Tan` → `Glock19_Tan`; `CeramicPot_*` doesn't exist in 1.30).

## types.xml
- `nominal`/`min`: the target and the refill threshold. `restock`: seconds between refill attempts (≥ 1800 avoids repeated overtime). `lifetime`: seconds on the ground.
- `usage` (where it spawns) and `value` (tier). Tier tags restrict an item to matching areas; event loot has none.
- **`deloot="1"`:** spawns only in event children with `deloot="1"` whose loot table usage matches, so it's removed from map loot. Never set it on common items unless the user wants them off the map.
- Items with no usage can match any loot table.

## Loot unique to one place
1. Declare `<usage name="Tag"/>` in `cfglimitsdefinition.xml`.
2. Give the building groups in `mapgroupproto.xml` `<usage name="Tag"/>`, with categories in their containers. **Group names are case-sensitive**, and every `<container>` needs its own `lootmax` (none means a cap of 4).
3. Items get that usage only, no tiers, `min` 0, `nominal` 1–3, plus `deloot="1"` if they're event-only.
4. Check the RPT for `SpawnRandomLoot … deloot` and errors, then confirm in game.

## Search overtime
Too many items for too few spots. Lower nominal/min and raise restock. Only widen usage or tiers if the user agrees. Test after a wipe (with the OK).

## Territories (animals, infected)
- **`env/<name>_territories.xml`:** `<territory-type><territory color="…"><zone name="Rest|HuntingGround|…" smin smax dmin dmax x z r/></territory></territory-type>`. One territory per area, zones on land.
- **`cfgenvironment.xml`:** add `<file path="env/<name>_territories.xml"/>` and a `<territory type name behavior><file usable="<name>_territories"/></territory>` block; copy the behaviour from the source map.
- **`db/events.xml`:** `nominal` = packs, `min`/`max` = pack size; children are the variants, which must be in types.xml.
- **`cfgeventspawns.xml`:** `<event name="AnimalX" />`.
- **Towns:** `CfgWorlds > <World> > Names` in `worlds_<map>.pbo`. Keep zones off water; some labels sit in water.
- **Check:** `[n] AnimalX` Primary Spawner Animal active, `Create entity type`, and no territory errors.

## Permanently placed buildings
- **Object spawner:** `{"Objects":[{"name","pos":[x,y,z],"ypr":[yaw,0,0],"scale":1,"enableCEPersistency":0}]}` registered in `cfggameplay.json` `WorldsData.objectSpawnersArr` (needs `enableCfgGameplayFile = 1`). It's rebuilt every start and not saved, and works on console.
- **Loot:** `mapgrouppos.xml` lines with `pos` = world position, `rpy="0 0 <yaw>"` and `a = 90 − yaw` (or `−yaw − 270` when yaw ≤ −90). Never use the editor yaw as `a`. The building needs a case-exact proto group.
- Not for buildings spawned by an event.
