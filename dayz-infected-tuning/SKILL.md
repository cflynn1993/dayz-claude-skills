---
name: dayz-infected-tuning
description: Tune DayZ infected density and placement - zombie_territories zones, Infected* events, caps and secondary pools - with density maps and RPT allocation checks.
---

# DayZ infected tuning

## How it works
- **`env/zombie_territories.xml`:** `<zone name="InfectedVillage" smin smax dmin dmax x z r/>`, where `s` = static (standing or sitting) count, `d` = dynamic (wandering), and `r` the circle radius.
- **Categories:** each zone `name` matches an `Infected…` event in `db/events.xml`, whose `<children>` set the classes by weight. Vanilla Chernarus: Village, Solitude, Industrial, City, Religious, Army, ArmyHard, Medic, Police, Firefighter, Spooky, NBC, Prisoner (some maps add tiers).
- **Caps:**
  - `db/globals.xml` `ZombieMaxCount` limits the server
  - each event's share shows in the RPT as `[n] InfectedX :: dmax … == N pcs` with per-type min/max lines
  - infected spawn only near players (`ZoneSpawnDist`)
- **Event infected:** from the event's `<secondary>` and the `<zone>` in `cfgeventspawns.xml`. Without a territory zone they get about 1% of the map's infected (about 7 on Chernarus), shared by all instances.

## Ask
The goal (quiet countryside / dangerous towns, more or fewer, a horde hotspot, themed areas, performance); the areas; the player count and how far the cap can go.

## Plan
- Summarise zones by category and region and render a density map (circles sized by r, coloured by dmax, town names from `CfgWorlds > Names` or `tools/site_analysis` `towns()`).
- Change by rule (e.g. Village d ×0.6, City ×1.3) or by zone (a hotspot: higher dmax and slightly larger r). Keep min ≤ max.
- New zones: a fitting category, away from spawn bubbles and custom events.
- If demand rises a lot, `ZombieMaxCount` may cap it. Only raise the cap if the user accepts the performance cost.
- Changing which classes appear: edit that event's children (classes must exist), or add a new category with its own event.

## Apply and test
Commit; edit numbers in place; parse-check; show a before/after table per category and region. Restart (no wipe). In the RPT allocation block, no wanted type should be 0. In game, compare the hotspot with a quiet area.
