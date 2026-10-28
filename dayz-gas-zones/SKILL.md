---
name: dayz-gas-zones
description: Design DayZ contaminated (toxic gas) zones - static areas in cfgeffectarea.json and dynamic gas events - with radius, height, particles, safe logout positions and reward loot, and check that protective gear is obtainable and that zones don't cover spawns, events or bases.
---

# DayZ contaminated (gas) zones

## Static zones: cfgeffectarea.json
```json
{
  "Areas": [
    {
      "AreaName": "Ship-Bow",
      "Type": "ContaminatedArea_Static",
      "TriggerType": "ContaminatedTrigger",
      "Data": {
        "Pos": [13917, 0, 11178],          // x, (y ignored: 0), z
        "Radius": 75,                       // metres
        "PosHeight": 20, "NegHeight": 3,    // vertical extent above/below the ground
        "InnerPartDist": 80, "OuterOffset": 30,   // particle spacing / outer ring offset
        "ParticleName": "graphics/particles/contaminated_area_gas_bigass"
      },
      "PlayerData": {
        "AroundPartName": "graphics/particles/contaminated_area_gas_around",
        "TinyPartName": "graphics/particles/contaminated_area_gas_around_tiny",
        "PPERequesterType": "PPERequester_ContaminatedAreaTint"
      }
    }
  ],
  "SafePositions": [[x, z], …]   // where players who log in inside a zone are moved to
}
```
(The comments are explanation only; JSON can't contain them.)
- Copy the structure and particle names from an existing vanilla area rather than inventing fields. Other `Data` keys exist (ring counts, vertical layers); copy them from a vanilla map that uses them, or from Bohemia's wiki "DayZ:Contaminated_Areas_Configuration".
- Large zones are made of several overlapping areas, e.g. the vanilla ship wreck uses four.
- **SafePositions** must be outside every zone, on open ground. Keep a few near each zone.

## Dynamic zones
- An event (vanilla `StaticContaminatedArea` in `db/events.xml`) spawns `ContaminatedArea_Dynamic` at positions from `cfgeventspawns.xml`, preceded by an artillery-style warning. With `nominal` 0 it's off.
- Turning it on means `nominal`/`min`/`max`, `lifetime` (how long a zone lasts) and the position list. Check positions with the same clash checks as below.

## Reward loot
- `cfglimitsdefinition.xml` has the `ContaminatedArea` usage, and vanilla gives it to some high-value items. Check which items have it in `types.xml`, and whether the loot tables of buildings inside the zones can spawn them. Confirm in game: gas-zone loot is easy to get wrong.

## Ask first
1. **Static, dynamic, or both.** Where (a named place, coordinates, or let the analysis suggest), and how big.
2. **Intensity:** one area or a cluster, and the vertical extent (e.g. covering a bunker or a hilltop).
3. **Rewards:** which items, and how rare.
4. For dynamic zones: how often, how long, and where they may appear.

## Checks
- **Protection obtainable:** gas masks, filters, NBC suit parts and NBC packs must have `nominal` > 0 and a usage that actually spawns. Otherwise the zone is just a death trap.
- **Clashes:** no zone may cover a player spawn bubble (`cfgplayerspawnpoints.xml`), static event positions (heli crashes, custom camps), vehicle spawns, or the area of a common base-building spot. Report each with its distance.
- **SafePositions:** outside all zones, on land (check with the terrain heightmap and navmesh if available).
- **JSON:** the file parses, and the field names match vanilla.

## Write and test
- Commit first, edit, and check the JSON parses.
- Restart (dayz-server-check). In game, walk to the edge: you should see particles and a tint, and take damage without protection. Log out inside, then log back in to check the SafePositions move.
- Wipe `storage_1` only with the OK, and only when needed (e.g. to reset dynamic event state).
