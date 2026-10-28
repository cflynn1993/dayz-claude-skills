---
name: dayz-custom-poi
description: Build permanent custom points of interest without mods - object spawner structures (bunkers, outposts, ruins), loot via mapgrouppos, and underground darkness/sound zones via cfgundergroundtriggers.json - placed with terrain and map-object analysis.
---

# DayZ custom POIs and bunkers (no mods)

For **permanent** structures that exist every restart. For temporary or rotating ones, use create-dynamic-event (an event group) instead.

## Building blocks
**Object spawner** (`cfggameplay.json` → `WorldsData.objectSpawnersArr`, needs `enableCfgGameplayFile = 1`):
```json
{"Objects": [{"name": "Land_Mil_Barracks1", "pos": [x, y, z], "ypr": [yaw, pitch, roll], "scale": 1.0, "enableCEPersistency": 0}]}
```
- The objects are rebuilt every start and not saved. This works on console. `yaw` is in degrees, 0 = north, 90 = east.
- `y` is the world height of the model's origin: terrain height minus the model's bounding-box minimum y (see create-dynamic-event, "Heights").
- You can't delete or hide existing map objects without mods. Build around them.

**Loot in placed buildings** (`mapgrouppos.xml`):
- One line per building: `pos` = world position, `rpy` = `"0 0 <yaw>"`, `a` = `90 − yaw` (or `−yaw − 270` when yaw ≤ −90). Never use the editor's yaw directly as `a`.
- The building class needs a case-exact group in `mapgroupproto.xml`, with a `lootmax` on each container (no `lootmax` means a cap of 4).
- Static props (`StaticObj_…`) have no loot points. Use `Land_…` buildings that have loot tables.

**Underground zones** (`cfgundergroundtriggers.json`, mission root):
```json
{"Triggers": [
  {"Position": [x, y, z], "Orientation": [0, 0, 0], "Size": [w, h, d],
   "EyeAccommodation": 0, "InterpolationSpeed": 1, "AmbientSoundSet": "Underground_SoundSet",
   "Breadcrumbs": []}
]}
```
- An "inner" trigger (`EyeAccommodation` 0, which means full darkness adaptation) covers the dark rooms.
- "Transition" triggers at entrances list `Breadcrumbs` (`{"Position": [...], "EyeAccommodation": 0–1, "UseRaycast": 0|1, "Radius": -1}`) that fade the light from outside to inside along the path.
- Copy the patterns from a vanilla map that has bunkers (Livonia's `dayzOffline.enoch\cfgundergroundtriggers.json`, Sakhal's, Badlands').
- `WorldsData.bunkerBroadcastEnabled` and `playerRestrictedAreaFiles` also exist in `cfggameplay.json`, for vanilla bunker broadcasts and no-go areas.

## Ask first
1. **What:** for example a military outpost, a ruined monastery, an underground bunker, a survivor village, or an admin area.
2. **Where:** a named place or coordinates, or let the analysis suggest flat, clear ground.
3. **Loot:** none, normal building loot, or custom usage loot (see dayz-loot-economy).
4. **Size and performance budget:** the number of objects (aim for tens, not hundreds).

## Design and place
- Use the site analysis from create-dynamic-event: heightmap heights, map objects (trees, buildings, roads), slopes, and clashes with events and spawns.
- Prefer real buildings with interiors and loot tables (`Land_…`) and `_DE`/static props for decoration. Check every class in the game config, with exact case.
- For a "bunker" on a map with no underground models, use enterable structures (e.g. a bunker entrance, tunnels, sewer and cellar models) placed into a hillside, plus underground triggers for darkness and sound. Test thoroughly: clipping and falling through terrain are common.
- Write a `.dze` for DayZ Editor review if the user wants to adjust it visually, then export as an object spawner JSON.

## Write and test
- Commit first. Add `custom/<poi>.json` and register it in `objectSpawnersArr`. Add `mapgrouppos.xml` lines only for buildings that need loot. Add the triggers. Check all files parse.
- Restart (dayz-server-check). The RPT should show no "Type does not exist" lines. In game, walk through it: check collisions, that loot spawns (it fills over time, or immediately after a storage wipe with the OK), and the darkness transitions.
- Update the mission's notes (custom content).
