---
name: dayz-vehicles
description: Change DayZ vehicle spawns console-safely - complete or partial vehicles, cargo, counts, new spawn positions and an admin supply truck - via cfgspawnabletypes, events.xml and cfgeventspawns.xml.
---

# DayZ vehicles

Covers vehicle and boat spawns on vanilla classes only (console compatible). Commit before editing. Validate afterwards (your mission validator if you have one, or check each file parses as XML).

## How vehicles spawn (vanilla 1.30 Chernarus)
- **`db/events.xml`:** one event per vehicle family, e.g. `VehicleCivilianSedan`, `VehicleSedan02`, `VehicleHatchback02`, `VehicleOffroadHatchback`, `VehicleOffroad02`, `VehicleTruck01`, `VehicleMotorbike`, `VehicleBoat`.
  - Settings: `position fixed`, `limit mixed`, lifetime 259200.
  - `nominal`/`min`/`max` set the total of that family. Each `<child type min max>` sets the count for one colour variant (e.g. `CivilianSedan`, `CivilianSedan_Black`, `CivilianSedan_Wine`).
- **`cfgeventspawns.xml`:** `<event name="VehicleX">` holds `<pos x z a/>` spawn points, with no `group` and no `zone`. Here **`a` is the vehicle's heading in degrees** and does matter (unlike event groups). Chernarus has about 55–110 points per family.
- **`db/types.xml`:** vehicle classes have `nominal` 0 and lifetime 259200. The event controls the count, not types.
- **`cfgspawnabletypes.xml`:** what each vehicle class spawns with:
```xml
<type name="CivilianSedan">
    <attachments chance="1.00">            <!-- chance this slot block is considered -->
        <item name="CivSedanWheel" chance="0.80"/>   <!-- chance the part appears -->
    </attachments>
    ...one block per part: wheels (+ spare), CarRadiator, CarBattery/TruckBattery,
       SparkPlug/GlowPlug, HeadlightH7 x2, each door, hood, trunk
    <cargo chance="0.5" preset="mixArmy"/>      <!-- optional: preset from cfgrandompresets.xml -->
    <damage min="0.0" max="0.3"/>               <!-- optional: spawn health -->
</type>
```
- **Some custom missions** already set every vehicle part to `chance="1.00"`, so all vehicles spawn complete. Vanilla uses about 0.3–0.8. Check the current values before "making vehicles complete".

## Jobs

### Complete or partial vehicles
Set the item `chance` values per part for the chosen classes. Read each class's real part list from its existing block, a `vanilla-<version>` git tag, or Bohemia's Central Economy repo, because part names differ per vehicle (e.g. `Truck_01_Wheel`, `Hatchback_02_Door_1_1`). Do every colour variant the user means, since each is its own `<type>`. Fluids (fuel, oil, coolant, brake) aren't set here; tell the user to check them in game.

### More or fewer vehicles
- Change the event's `nominal`/`min`/`max` and the children's `min`/`max`, keeping child totals consistent with `nominal`.
- `nominal` must not exceed the number of `<pos>` points for that event. If it does, add points.
- More vehicles add server load and more persistent objects. Mention that above about +50%.

### New spawn positions
- Add `<pos x z a/>` lines to the family's event in `cfgeventspawns.xml`.
- Pick flat, open ground: roads, car parks, farm yards. Keep at least about 6 m from buildings, walls, trees and other points. A vehicle spawned into an object can be damaged or flung.
- Set `a` along the road direction.
- Boats need open water close to shore (navmesh water area, or copy the style of existing boat points).
- Getting coordinates: the user can stand there in game and read them from VPP, or place a car in DayZ Editor and copy its position and heading (heading = editor yaw, 0–360).
- Check the new points aren't near other events' spawn points or player fresh-spawn areas.

### Admin supply truck (ScaleSpeeder-style, no mods)
`cfgspawnabletypes` applies to a whole class, so use a colour variant **reserved for admins**:
1. Pick a variant, e.g. `Truck_01_Covered_Orange`. Remove it from `VehicleTruck01`'s children, and re-balance the other children so the family total is unchanged.
2. Add an event:
```xml
<event name="VehicleAdminTruck">
    <nominal>1</nominal><min>1</min><max>1</max>
    <lifetime>259200</lifetime><restock>0</restock>
    <saferadius>0</saferadius><distanceradius>0</distanceradius><cleanupradius>0</cleanupradius>
    <flags deletable="0" init_random="0" remove_damaged="1"/>
    <position>fixed</position><limit>child</limit><active>1</active>
    <children><child lootmax="0" lootmin="0" max="1" min="1" type="Truck_01_Covered_Orange"/></children>
</event>
```
3. Add `<event name="VehicleAdminTruck"><pos x z a/></event>` at the admin base in `cfgeventspawns.xml`.
4. Give that variant's `cfgspawnabletypes` entry all parts at 1.00, plus `<cargo>` blocks with the supplies, either as items at `chance="1.00"` or via presets in `cfgrandompresets.xml`. Cargo space is limited, so a few full stacks (nails, planks, tools) beat many items. Items that don't fit are silently dropped.
5. The truck respawns only after it's destroyed or despawns. To resupply, wipe it or spawn items with VPP.

VPP can also spawn vehicles and items directly. Mention that as the quick option if this is just for one admin.

## Test
- Vehicles are saved in `storage_1`, so changes to parts or cargo only apply to newly spawned vehicles. Wipe `storage_1` (with the user's OK) to see them straight away.
- Restart (dayz-server-check), then check the RPT:
  - `[n] VehicleX` spawner lines
  - no `VehicleRespawner … Failed to spawn the requested amount` for the edited event (blocked or too few points)
  - no "Type does not exist"
- Check in game: drive one, open the cargo, and confirm the admin truck spawned at its point.
