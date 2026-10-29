---
name: dayz-custom-poi
description: Build permanent DayZ POIs and bunkers without mods - object spawner structures, mapgrouppos loot and cfgundergroundtriggers darkness zones - placed with terrain analysis.
---

# DayZ custom POIs and bunkers (permanent; for rotating ones use create-dynamic-event)

## Building blocks
- **Object spawner** (`cfggameplay.json` `WorldsData.objectSpawnersArr`, needs `enableCfgGameplayFile = 1`): `{"Objects":[{"name":"Land_…","pos":[x,y,z],"ypr":[yaw,pitch,roll],"scale":1,"enableCEPersistency":0}]}`. Rebuilt every start and not saved; works on console. Yaw: 0 north, 90 east. y = terrain − bbox min y. Existing map objects can't be removed without mods.
- **Loot** (`mapgrouppos.xml`): `pos` = world position, `rpy="0 0 <yaw>"`, `a = 90 − yaw` (or `−yaw − 270` when yaw ≤ −90). The building needs a case-exact `mapgroupproto.xml` group, with `lootmax` on every container (none means a cap of 4). `StaticObj_` props have no loot points.
- **Underground** (`cfgundergroundtriggers.json`): `{"Triggers":[{"Position":[x,y,z],"Orientation":[0,0,0],"Size":[w,h,d],"EyeAccommodation":0,"InterpolationSpeed":1,"AmbientSoundSet":"Underground_SoundSet","Breadcrumbs":[]}]}`.
  - Inner triggers (EyeAccommodation 0) are the dark rooms.
  - Entrance triggers list breadcrumbs `{"Position","EyeAccommodation":0–1,"UseRaycast":0|1,"Radius":-1}` that fade the light along the path.
  - Copy the patterns from vanilla maps with bunkers (Livonia `dayzOffline.enoch`, Sakhal, Badlands).
  - `WorldsData.bunkerBroadcastEnabled` and `playerRestrictedAreaFiles` also exist.

## Ask
What (outpost, ruins, bunker, village, admin area); where; loot (none, building, or custom usage via dayz-loot-economy); object budget (tens, not hundreds).

## Design
- Use `tools/site_analysis` (heights, obstacles, slope, `conflicts.js`). The `layout.js` `Camp` solver works for structures too; export to object spawner JSON from its items (name, pos, ypr).
- Prefer `Land_` buildings with interiors and loot, with `_DE`/static props for decoration, and check every class with exact case.
- Bunkers: entrance, tunnel, sewer and cellar models in a hillside, plus triggers. Test for clipping and falling through terrain.
- Write an optional `.dze` for visual review.

## Write and test
Commit; add `custom/<poi>.json` to `objectSpawnersArr`, `mapgrouppos` lines only for looted buildings, and the triggers; parse-check everything. Restart: no "Type does not exist". In game, check collisions, loot (it fills over time, or at once after a wipe with the OK) and the darkness. Update the notes.
