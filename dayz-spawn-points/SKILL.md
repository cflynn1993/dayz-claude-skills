---
name: dayz-spawn-points
description: Design DayZ player spawn areas in cfgplayerspawnpoints.xml - fresh, hop and travel bubbles, distance and grid rules, themed or inland starts - using terrain and map-object data to pick safe, sensible spots and checking clashes with events, infected and gas zones.
---

# DayZ player spawn points

## File format (cfgplayerspawnpoints.xml)
Three sections with the same structure:
- `<fresh>`: new characters.
- `<hop>`: players who recently played on another server (the anti server-hopping rules).
- `<travel>`: used by the game for characters arriving by travel. Keep it like vanilla unless asked.

```xml
<fresh>
  <spawn_params>                 <!-- how far a chosen point must be from things (metres) -->
    <min_dist_infected>30</min_dist_infected> <max_dist_infected>70</max_dist_infected>
    <min_dist_player>65</min_dist_player>     <max_dist_player>150</max_dist_player>
    <min_dist_static>0</min_dist_static>      <max_dist_static>2</max_dist_static>
  </spawn_params>
  <generator_params>             <!-- grid of candidate points generated around each bubble -->
    <grid_density>4</grid_density> <grid_width>200</grid_width> <grid_height>200</grid_height>
    <min_dist_static>0</min_dist_static> <max_dist_static>2</max_dist_static>
    <min_steepness>-45</min_steepness>   <max_steepness>45</max_steepness>
  </generator_params>
  <group_params>                 <!-- group spawning; vanilla keeps it off -->
    <enablegroups>false</enablegroups> <groups_as_regular>true</groups_as_regular>
    <lifetime>120</lifetime> <counter>2</counter>
  </group_params>
  <generator_posbubbles>
    <group name="WestCherno"> <pos x="6063.0" z="1931.9"/> … </group>
  </generator_posbubbles>
</fresh>
```
- Each `<pos>` is a bubble centre. Candidate points are generated in a `grid_width` × `grid_height` area around it, then filtered by steepness and by the distance rules when a player spawns.
- `min_dist_player` keeps spawns apart from other players (anti spawn-killing); `max_dist_infected` keeps infected nearby for tension.
- The server caches generated points in `storage_<n>\spawnpoints.bin`. If changes don't seem to apply, stop the server and delete that file (with the user's OK); it's rebuilt on start.

## Ask first
1. **Goal:** rebalance the coast, inland or harder starts, themed starts (e.g. near a custom event), fewer spawns in one town, or anti spawn-kill tuning.
2. **Which sections:** fresh only, or hop/travel too?
3. **Areas:** named towns or regions, or let the analysis suggest them. How many bubbles each.
4. **Rules:** distance to players and infected, and how steep the ground can be.

## Choose bubble centres properly
Use the same map data as the create-dynamic-event skill's site analysis: the WRP heightmap, objects, roads and navmesh water.
- On land (navmesh ground, not water), not inside buildings or dense forest, and not on steep slopes. Check `grid_width`/`grid_height` × the slope limits will leave enough candidates.
- **Clashes:** keep clear of contaminated zones (`cfgeffectarea.json` areas plus their radius, and dynamic gas event positions), military or high-tier infected territories, static event positions (heli crashes, custom camps), and vehicle spawn points. Report each with its distance.
- Spread bubbles so the player-distance rules can be met. Several bubbles close together just compete for the same points.
- Name groups by place (`InlandVybor`, `CoastKamyshovo`), as vanilla does.

## Write and test
- Commit first. Edit only the sections being changed, keeping the 4-space indentation. Check the file still parses.
- Show a before/after table: groups and bubble counts per section, and the changed rules.
- Restart the server (dayz-server-check); delete `spawnpoints.bin` only with the OK. Respawn several times as a fresh character, and check the ADM `is connected` positions land where intended.
- Note: vanilla can't tie a spawn area to a specific loadout. Spawn gear presets are picked at random, separately.
