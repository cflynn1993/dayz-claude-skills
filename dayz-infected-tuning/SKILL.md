---
name: dayz-infected-tuning
description: Tune DayZ infected density and placement - zombie_territories.xml zones, the Infected* events behind them, server-wide caps and secondary-event pools - with density maps, horde hotspots and profiles like "quiet countryside, dangerous towns", checked in the RPT allocation lines.
---

# DayZ infected tuning

## How infected spawn
- **`env/zombie_territories.xml`:** zones of the form `<zone name="InfectedVillage" smin smax dmin dmax x z r/>`.
  - `name` is the infected category.
  - `smin`/`smax`: the static (standing or sitting) infected count range.
  - `dmin`/`dmax`: the dynamic (wandering) count range.
  - `x`, `z`, `r`: the circle.
- **Categories:** each zone `name` matches an `Infected…` event in `db/events.xml` (e.g. `InfectedVillage`, `InfectedCity`, `InfectedArmy`, `InfectedMedic`). That event's `<children>` set which infected classes appear, by weight. Vanilla Chernarus uses Village, Solitude, Industrial, City, Religious, Army, ArmyHard, Medic, Police, Firefighter, Spooky, NBC and Prisoner, and some maps add tiers (e.g. `InfectedVillageTier1`).
- **Caps:**
  - `db/globals.xml` `ZombieMaxCount` limits the whole server.
  - Each infected event has its own share, shown in the RPT as `[n] InfectedX :: dmax: … % == N pcs` with per-type `min`/`max` lines.
  - Infected only spawn near players (`ZoneSpawnDist` in globals.xml).
- **Event secondaries:** infected around events (heli crashes, custom camps) come from the event's `<secondary>` and the `<zone>` in `cfgeventspawns.xml`. A secondary with no territory zone gets only about 1% of the map's infected (about 7 on Chernarus), shared by all instances.

## Ask first
1. **Goal:** for example "quiet countryside, dangerous towns", more or fewer infected overall, a horde hotspot (a town, the military base), themed areas (more medics at hospitals), or performance relief.
2. **Areas:** named towns or regions, or the whole map.
3. **Limits:** the player count and server performance, which decide how high `ZombieMaxCount` can go.

## Plan with data
- Parse all zones and summarise them by category and region (counts, the summed `dmax`/`smax`). Render a density map (circles sized by `r`, coloured by `dmax`) with town names from `CfgWorlds > Names` in `worlds_<map>.pbo`.
- Make changes by rule, e.g. "Village zones ×0.6 `dmin`/`dmax`, City ×1.3", or by zone (a horde hotspot = higher `dmax` and a slightly bigger `r` on a few zones). Keep min ≤ max.
- A new zone needs a sensible category (whose infected suit the place), must avoid player spawn bubbles, and should not overlap custom event areas unless intended.
- **Totals vs caps:** if the summed demand rises a lot, `ZombieMaxCount` may cap it anyway. Say so, and only raise the cap if the user accepts the performance cost.
- To change *which* infected appear somewhere, edit that `Infected…` event's children (class names must exist; check against the game config), or make a new category with its own event.

## Apply and test
- Commit first. Edit the numbers in place (never reformat the file), and check it parses.
- Show a before/after table per category and region, plus the changed zones.
- Restart (dayz-server-check). No wipe is needed. In the RPT allocation block, each changed category's `== N pcs` and per-type `min`/`max` should show no 0s for wanted types. In game, visit the hotspot and a "quiet" area to compare.
