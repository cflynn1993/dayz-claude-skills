---
name: dayz-vehicles
description: Change DayZ vehicle spawns console-safely - complete or partial parts, cargo, counts, new spawn points and an admin supply truck - via cfgspawnabletypes, events.xml and cfgeventspawns.xml.
---

# DayZ vehicles (vanilla classes only)
Standard workflow: commit → edit in place → validate → dayz-server-check.

## How they spawn
- **`db/events.xml`:** one event per family (`VehicleCivilianSedan`, `VehicleSedan02`, `VehicleHatchback02`, `VehicleOffroadHatchback`, `VehicleOffroad02`, `VehicleTruck01`, `VehicleMotorbike`, `VehicleBoat`, …). Position fixed, limit mixed, lifetime 259200. `nominal`/`min`/`max` set the family total, and each `<child type min max>` one colour variant.
- **`cfgeventspawns.xml`:** `<pos x z a/>` points with no group or zone. Here **`a` is the heading** (it matters). Chernarus has about 55–110 per family.
- **`db/types.xml`:** vehicles have nominal 0; the event sets the count.
- **`cfgspawnabletypes.xml`:** per class, `<attachments chance><item name chance/></attachments>` blocks per part (wheels and spare, radiator, battery, plugs, lights, doors, hood, trunk), plus optional `<cargo chance preset/>` and `<damage min max/>`. Part names differ per vehicle; read them from the existing block or vanilla. Each colour variant is its own `<type>`.

## Jobs
- **Complete or partial:** set the item `chance` values per part for each variant. Fluids aren't set here; check them in game.
- **Counts:** keep children's totals consistent with `nominal`. `nominal` must not exceed the number of points (add points if it does). Mention server load above about +50%.
- **New points:** flat open ground, at least about 6 m from buildings, walls, trees and other points. `a` along the road. Boats need open water near shore. Coordinates come from VPP, or from a car placed in DayZ Editor (heading = yaw 0–360). Check against other events and spawns.
- **Admin supply truck:**
  1. Reserve a variant (e.g. `Truck_01_Covered_Orange`): remove it from `VehicleTruck01`'s children and rebalance the others.
  2. Add a `VehicleAdminTruck` event: nominal, min and max 1; lifetime 259200; radii 0; position fixed; limit child; one child.
  3. Add a pos at the admin base.
  4. In `cfgspawnabletypes`, give it all parts at 1.00 plus cargo (items at chance 1.00, or presets). Items that don't fit are dropped silently.

  It respawns only when destroyed. Spawning things with VPP is the quick alternative.

## Test
Vehicles are saved, so part and cargo changes only affect new spawns; a wipe (with the OK) shows them at once. Check the RPT: `[n] VehicleX` lines, no `Failed to spawn the requested amount` for edited events, and no "Type does not exist". In game, drive one and check cargo.
