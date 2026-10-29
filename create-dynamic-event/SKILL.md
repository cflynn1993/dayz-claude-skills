---
name: create-dynamic-event
description: Create a DayZ event (event group or child event) - asks name, type, assets and XML values, reports clashes, then designs it from map data or installs a DayZ Editor "Copy as Event Group" paste.
---

# DayZ event: ask → check clashes → design/import → install → test
No mission edits until the user has answered and seen the clash report. Standard workflow: commit first, edit in place before closing tags (`</eventgroupdef>`, `</eventposdef>`, `</events>`), validate, test with dayz-server-check.

## 1. Ask (AskUserQuestion if available, else chat)
1. **Name:** suggest `Static<Theme>`, and check it's unused in `db/events.xml`, `cfgeventspawns.xml` and `cfgeventgroups.xml` (case-sensitive).
2. **Type:**
   - **event group:** a fixed layout; source is an editor paste or designed here
   - **child event:** `<children>` items or wrecks, like `StaticHeliCrash`
   - **new position or group** for an existing event
3. **Asset prompt:** theme, structures and props, asset sets (vanilla / Badlands `nasdara` / Frostline `sakhal`), size, loot (none / building / event-only), infected or animals, location(s).
4. **Positions:** how many, and how many active at once.

**Round 2: XML values.** Propose values from the closest existing event as a table with reasons, and ask about any without an obvious default:

| Where | Values |
|---|---|
| `db/events.xml` | nominal, min, max, lifetime, restock, saferadius, distanceradius, cleanupradius, secondary, flags (deletable, init_random, remove_damaged), position, limit, active |
| `db/events.xml` children (child events) | type, min, max, lootmin, lootmax |
| `cfgeventspawns.xml` | `<zone smin smax dmin dmax r>` (one per event, shared by all positions), `<pos x z a y>` |
| `cfgeventgroups.xml` children | deloot, lootmin, lootmax, spawnsecondary |

What the radius values mean:
- `saferadius`: no spawn while a player is this close.
- `distanceradius`: minimum distance between instances. With nominal > 1 it must not be 0, or instances stack on one position (vanilla uses 1000).
- `cleanupradius`: no cleanup while a player is this close.
- `lifetime`: seconds until the instance can respawn elsewhere.

## 2. Clash report (table: clash, evidence, fix; then ask)
- **Duplicate names.** Groups under one event get location names, like vanilla (`Abandoned_Cherno`).
- **Event spawns** within max(300 m, the radii), by name and distance: heli crashes, gas zones (check nominal), police/convoy events, vehicle spawns.
- **Own radii:**
  - nominal > number of positions
  - positions closer together than `distanceradius`
  - a `saferadius` blocked by spawns or towns
  - a `cleanupradius` covering another event
- **Shared infected pool:** a secondary with no territory zone gets about 1% of the map's infected (about 7 on Chernarus), shared by every instance.
- **Player spawns** within 300 m, **territories**, **effect areas**, **object spawners**.
- **Roads and rails:** within 8 m of road centre lines or 7 m of rails.
- **Loot:** `deloot="1"` children need matching event-only items; child lootmax must not exceed the container total.
- `tools/site_analysis/conflicts.js <x,z>` lists most of these.

## 3a. Design from map data (no DayZ Editor needed)
Use `tools/site_analysis/` (see its README):
1. `node prepare.js` builds the cache, once per map or DayZ update.
2. `site.js map|patches` shows slope, obstacles and flat clear patches; compare candidates, then run `conflicts.js` on the chosen site.
3. Write a design script like `example_design.js`. The first item is the anchor; mark tents `tent: true`, items with loot `loot: [max, min]` and secondary-enabled items `sec: true`. The `Camp` solver gives every item a valid pose, with no floating.
4. `toEventGroup()` returns the group XML (with the vanilla `<!--pos-->` header) and the `<pos>` line. `render()` writes a plan PNG. `toDze()` writes an optional DayZ Editor file for visual review.
5. After installing, `verify.js <GroupName>` checks references, classes, loot tables, terrain fit, collisions and roads.

Layout rules:
- walkways about 1.2 m between tent boxes
- tent floor height change ≤ 0.6 m, small props ≤ 0.15 m (children can't pitch or roll)
- no permanent lights; avoid trees, water and steep ground

## 3b. Import an editor paste
- The right-clicked object is the anchor at 0,0. Offsets aren't rotated, and a child's `a` is its world yaw, so `<pos a="0">`.
- Child y is relative to the anchor; the pos y is the anchor's absolute height.
- Rename `EditorExport`/`EditorGroup0`, and rewrite the editor's default `deloot="1" lootmax="3" lootmin="1"`.

## 4. Install rules
- **Classes:**
  - exact case, checked against the game `config.bin` (or a class list); prefer vanilla `_DE` props (saved with the event)
  - static `Land_`/`StaticObj_` classes without `_DE` spawn anyway ("Programatically adding…"); don't add them to types.xml
  - spawnable items used as props (e.g. `FireplaceTandoor`) need a types entry: nominal 0, lifetime = the event's, deloot 0
- **Loot:**
  - `deloot="0"` = normal building loot; `deloot="1"` = only items flagged deloot whose usage matches the loot table
  - props: `lootmax="0" lootmin="0" spawnsecondary="false"`
  - `mapgroupproto.xml` group names are case-sensitive
  - a `<container>` without its own `lootmax` is capped at 4
  - don't add `mapgrouppos.xml` lines for event buildings
- **Secondary:** one per event, no per-child override. A themed mix goes in one custom secondary (child `min` = % weight, totalling 100).
- **Write:**
  - `cfgeventgroups.xml`: a `<!--pos x z a y group/-->` header copied from the spawn line, then `<group name>`; no free-text comments
  - `cfgeventspawns.xml`: `<event name><zone/><pos x z a="0" y group/>…</event>`
  - `db/events.xml`: like `StaticMilitaryConvoy` (position fixed, limit child, `<children/>`), or with `<children>` for child events
  - update the mission notes
- **Test (dayz-server-check; wipe only with the OK):**
  - `[n] EVENT` Static spawner active, and the secondary line
  - one `SpawnRandomLoot (EVENT)` line per looted child
  - the secondary `== N pcs` with no type at 0
  - no "No group configured", "Type does not exist", "Sum of container LootMax…" or "Wanting to spawn more…" lines
- **Persistence:** non-`_DE` structures aren't saved. After a restart they vanish until `lifetime` ends while their loot stays; a short lifetime (e.g. 2100) limits the gap.

## Data notes (if the toolkit is missing)
- **Terrain:** use the WRP heightmap, not the navmesh (±0.6 m). It's an LZO1X float grid (2048² on Chernarus) ending just before the `\data\layers\` rvmat list.
- **WRP objects:** 64-byte records at any byte alignment: id, model, 9 rotation floats, x, y, z.
- **Navmesh:** `VAND` tiles with a 104-byte header and no detail meshes.
- **P3D bounding box:** min corner at `12 + 4×LODs + 48`. Object y = terrain − bbox min y.
