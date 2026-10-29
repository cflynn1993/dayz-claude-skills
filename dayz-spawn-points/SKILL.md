---
name: dayz-spawn-points
description: Design DayZ player spawns in cfgplayerspawnpoints.xml (fresh/hop/travel bubbles, distance and grid rules) using terrain data, checked against events, infected and gas zones.
---

# DayZ player spawn points

## Format
Sections: `<fresh>` (new characters), `<hop>` (players from another server), `<travel>` (keep it as vanilla unless asked). Each has:
- `<spawn_params>`: `min/max_dist_infected`, `min/max_dist_player` (anti spawn-kill), `min/max_dist_static`
- `<generator_params>`: `grid_density`, `grid_width`/`grid_height` (candidate area per bubble), `min/max_dist_static`, `min/max_steepness`
- `<group_params>`: `enablegroups` (vanilla false), `groups_as_regular`, `lifetime`, `counter`
- `<generator_posbubbles><group name="Place"><pos x z/>…</group></generator_posbubbles>`

Candidates are generated around each bubble, filtered by steepness, then by the distance rules at spawn time. Generated points are cached in `storage_<n>\spawnpoints.bin`; if changes don't apply, stop the server and delete it (with the OK).

## Ask
The goal (rebalance, inland or harder starts, themed starts, fewer in one town, anti spawn-kill); which sections; areas and bubble counts; distance and slope rules.

## Placing bubbles
- On land, flat-ish, not in buildings or dense forest, using terrain, objects and navmesh water. With `tools/site_analysis`: `site.js map|patches`, `world.height()`.
- **Clashes:** gas zones (`cfgeffectarea.json` + radius, dynamic gas positions), military or high-tier infected territories, static event positions, vehicle points. `conflicts.js <x,z>` lists most; report distances.
- Spread bubbles out (close ones compete for points) and name groups by place.

## Write and test
Commit; edit only the changed sections (4-space indent); parse-check; show a before/after table (groups and bubbles per section, rules). Restart (delete `spawnpoints.bin` only with the OK), respawn fresh several times, and compare the ADM `is connected` positions. Vanilla can't tie a spawn area to a loadout.
