---
name: dayz-gas-zones
description: Design DayZ contaminated zones - static areas in cfgeffectarea.json and dynamic gas events - with safe logout positions and rewards, checking gear availability and clashes.
---

# DayZ contaminated zones

## Static: cfgeffectarea.json
```json
{"Areas": [{"AreaName": "Ship-Bow", "Type": "ContaminatedArea_Static", "TriggerType": "ContaminatedTrigger",
  "Data": {"Pos": [13917, 0, 11178], "Radius": 75, "PosHeight": 20, "NegHeight": 3, "InnerPartDist": 80, "OuterOffset": 30,
           "ParticleName": "graphics/particles/contaminated_area_gas_bigass"},
  "PlayerData": {"AroundPartName": "graphics/particles/contaminated_area_gas_around",
                 "TinyPartName": "graphics/particles/contaminated_area_gas_around_tiny",
                 "PPERequesterType": "PPERequester_ContaminatedAreaTint"}}],
 "SafePositions": [[x, z], …]}
```
- `Pos` is x, 0, z. `PosHeight` and `NegHeight` are the vertical extent. Large zones are several overlapping areas (the vanilla ship uses 4).
- Copy fields and particles from vanilla areas; other `Data` keys (rings, vertical layers) come from vanilla maps or wiki "DayZ:Contaminated_Areas_Configuration".
- `SafePositions`: where players who log in inside a zone are moved to. They must be outside all zones, on open land.

## Dynamic
Vanilla `StaticContaminatedArea` (`db/events.xml`) spawns `ContaminatedArea_Dynamic` at `cfgeventspawns.xml` positions after a warning; nominal 0 means off. Enabling it means setting nominal, min, max, lifetime (zone duration) and the positions.

## Rewards
Items with the `ContaminatedArea` usage (declared in `cfglimitsdefinition.xml`). Check which loot tables in the zones can spawn them, and confirm in game.

## Ask
Static, dynamic or both; place and size; one area or a cluster, and the height; rewards and rarity; for dynamic: frequency, duration and allowed places.

## Check
- **Protection obtainable:** gas masks, filters, NBC suit parts and NBC packs have nominal > 0 and a usage that actually spawns.
- **Clashes:** no zone may cover player spawn bubbles, static events, vehicle spawns or common base spots (`tools/site_analysis/conflicts.js` if present). SafePositions must be on land and outside zones. The JSON parses.

## Write and test
Commit, edit, parse-check, restart. In game: particles and tint at the edge, damage without protection, and logging out and back in inside a zone moves you to a SafePosition. Wipe only with the OK when dynamic state needs resetting.
