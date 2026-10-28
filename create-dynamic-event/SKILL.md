---
name: create-dynamic-event
description: Create a DayZ dynamic event (events.xml / cfgeventspawns.xml, plus cfgeventgroups.xml for event groups). Starts by asking for the event name, whether it's an event group, an asset prompt and the XML attribute values, then reports clashes with other events and radius settings before installing from a DayZ Editor 'Copy as Event Group' paste or a designed .dze layout.
---

# DayZ dynamic event: ask, check, design, install

Order of work: **ask → check clashes → design or import → install → test**. Don't write mission files until the user has answered the questions and seen the clash report.

## 1. Ask first

Use the AskUserQuestion tool where available (up to 4 questions per call); otherwise ask in chat. Don't guess these.

**Round 1: what is it?**
1. **Event name.** Suggest one in the mission's style (`Static<Theme>`, e.g. `StaticHeliCrash`, `StaticMilitaryConvoy`). Check it isn't already an event name in `db/events.xml` or `cfgeventspawns.xml`, or a group name in `cfgeventgroups.xml`. Names are case-sensitive.
2. **Is it an event group?**
   - **Event group:** a fixed layout of buildings and props, spawned as one unit (`cfgeventgroups.xml` group plus `group="…"` on each spawn position). Then ask the source: a DayZ Editor "Copy as Event Group" paste (Mode A) or design it here (Mode B).
   - **Child event:** the economy spawns items, vehicles or wrecks from the `<children>` list in `events.xml` at the spawn positions (like `StaticHeliCrash` or the vehicle events). There's no group.
   - **New position or group for an existing event:** add a `<pos>` (and for groups a new uniquely named group) under that event instead of making a new one.
3. **Asset prompt.** Ask for a description of what the event should be and include:
   - theme and atmosphere
   - structures and props, preferred asset sets (vanilla, Badlands/`nasdara`, Frostline/`sakhal`) and anything to avoid
   - size (object count)
   - loot (none, normal building loot, or event-only loot)
   - infected or animals
   - location(s): exact coordinates, a region to search, or several candidate positions
4. **How many spawn positions, and how many active at once?** This sets `nominal` against the number of positions.

**Round 2: XML attribute values.** Before asking, read the closest existing event (vanilla or custom) and propose its values. Show them as a table with a one-line reason each, and ask the user to accept or change them. Ask about every value that has no obvious default; don't leave required values unasked.

| File | Values |
|---|---|
| `db/events.xml` | `nominal`, `min`, `max`, `lifetime`, `restock`, `saferadius`, `distanceradius`, `cleanupradius`, `secondary` (or none), `flags deletable / init_random / remove_damaged`, `position` (`fixed` / `player`), `limit` (`child` / `parent` / `custom` / `mixed`), `active` |
| `db/events.xml` children (child events) | per child `type`, `min`, `max`, `lootmin`, `lootmax` |
| `cfgeventspawns.xml` | `<zone smin smax dmin dmax r>` (infected per enabled child; one zone per event, shared by all its positions), each `<pos x z a y>` (`a="0"` for groups) |
| `cfgeventgroups.xml` children | `deloot`, `lootmin`, `lootmax`, `spawnsecondary` (props `lootmax="0"`, `spawnsecondary="false"`) |
| `db/types.xml` | only for spawnable items used as props: nominal 0, lifetime matching the event |

What the radius values mean, so the user can choose:
- `saferadius`: the event won't spawn while a player is this close.
- `distanceradius`: minimum distance between two instances of the same event. If the positions are closer than this, fewer than `nominal` can be active. With `nominal` above 1 it must not be 0: at 0, two instances can spawn on the same position, on top of each other. Vanilla static events use 1000.
- `cleanupradius`: the event isn't cleaned up while a player is this close.
- `lifetime`: seconds until the instance can be removed and respawned elsewhere. `restock` is the wait before a new one.

## 2. Check clashes and report them

Before writing anything, give the user a short table: the clash, the evidence (names, distances) and a suggested fix. Then ask how to resolve anything that matters. Check:

- **Names:**
  - the event name is not already used
  - each group name is unique; for several groups under one event, use location names as vanilla does (`Abandoned_Cherno`, `Block_Zeleno`)
  - the secondary exists, or is new
- **Other events near each position:** every `<pos>` in `cfgeventspawns.xml` within max(300 m, this event's `saferadius`, `cleanupradius`, `distanceradius`), listed by event name and distance. Watch especially for:
  - `StaticHeliCrash`, `StaticContaminatedArea` (check its nominal: 0 means inactive), police and convoy events
  - vehicle spawns: keep layouts clear of their footprint and don't block roads
- **This event's own radii:**
  - `nominal` greater than the number of positions
  - positions closer together than `distanceradius`
  - a `saferadius` so large that a nearby player spawn or town stops it ever spawning
  - a `cleanupradius` covering another event's area
- **Shared infected pool:** each secondary gets about 1% of the map's infected (about 7 on Chernarus) unless it has a territory zone. Sharing a secondary between events, or using several positions of one event, splits those 7. Say how many each instance will roughly get.
- **Player spawns** (`cfgplayerspawnpoints.xml`) within 300 m.
- **Territories** (`env/*_territories.xml`) the event overlaps: infected zones add infected, and animal zones add wolves, bears etc.
- **Effect areas** (`cfgeffectarea.json`).
- **Object spawners** (`cfggameplay.json` → `objectSpawnersArr`).
- **Roads and rails:** within 8 m of road centre lines or 7 m of rails (see site data).
- **Loot economy:**
  - `deloot="1"` children need event-only items with a matching usage
  - more loot points spread the same item nominal further
  - per-child `lootmax` must not exceed the loot table container total

## Server paths (defaults; confirm with the user)
- Server: the DayZ Server install, by default `C:\Program Files (x86)\Steam\steamapps\common\DayZServer`
- Mission: `mpmissions\<mission>` (e.g. `dayzOffline.chernarusplus`). If it's a git repo with a CLAUDE.md or other notes, read them first.
- Editor projects: DayZ Editor saves `.dze` files in `Documents\DayZ\Editor` in the user's profile.
- Start the server with its start script (e.g. `start_server.bat`), not Steam's Launch button, which skips the server config and mods.

## 3. Install

### Commit first
Make sure `git status` is clean before editing. Outside a git repo, copy each file to `<file>.bak-before-<event-name>` instead. After editing, run your mission validator if you have one, or at least check each file parses as XML. Insert new entries just before the closing tag (`</eventgroupdef>`, `</eventposdef>`, `</events>`); never reformat the files.

### Read the editor export correctly (event groups)
```xml
<event name="EditorExport"> <zone .../> <pos x z a="0" y group="EditorGroup0"/> </event>
<group name="EditorGroup0"> <child type x z a y .../> ... </group>
```
- The right-clicked object is the anchor at x=0, z=0.
- Children's x/y/z offsets are **not rotated**, and each child's `a` is its own world yaw. So the spawn `<pos>` must keep `a="0"`, or the layout twists.
- Children's y is relative to the anchor; the `<pos>` y is the anchor's absolute height.
- Rename `EditorExport` and `EditorGroup0` to the agreed names. The `group="..."` on the pos line must match the group name, and the group gets the vanilla `<!--pos …/-->` header (see "Write the entries").
- The editor sets every child to `deloot="1" lootmax="3" lootmin="1"`. Always rewrite these with the agreed loot values.

### Classes
- Every class must exist in the installed game with exact case: a class list if you keep one, the editor's object search, or the `config.bin` files inside the server's `addons\`, `nasdara\addons\` and `sakhal\addons\` PBOs.
- Prefer a vanilla `_DE` version where one exists (e.g. `Land_Wreck_S1023_Medic_Beige_DE`, `Land_Wreck_hb01_aban1_blue_DE`, `StaticObj_Bucket_Red_DE`, `StaticObj_Furniture_PlasticBucket_DE`). Vanilla `_DE` classes are already in `types.xml` and are saved with the event.
- Static `Land_`/`StaticObj_` classes with no `_DE` version still spawn: the server adds them to the event itself and logs "Programatically adding … please manually define in types.xml". Adding them to `types.xml` does **not** help ("Not spawnable. Scope is not public"), so don't.
- Spawnable items used as props (e.g. `FireplaceTandoor`) do need a `types.xml` entry: nominal 0, lifetime matching the event, deloot 0.

### Loot per child
- `deloot="0"` means normal loot from the building's loot table (usage/category in `mapgroupproto.xml`).
- `deloot="1"` means only items flagged `deloot="1"` in `types.xml` **and** matching the loot table's usage. For loot unique to this event, give the loot table and the items a custom usage tag (see the dayz-loot-economy skill).
- Props: `lootmax="0" lootmin="0"`. Buildings with loot points: `lootmax` no higher than that building's container total in `mapgroupproto.xml`. Otherwise the log shows "Wanting to spawn more loot than possible".
- A `<container>` with no `lootmax` attribute is capped at 4 items (RPT `containermaxsum: 4`), even with more points or a higher group `lootmax`. To raise capacity, add points and set `lootmax` on both the group and the container.
- Loot table group names are **case-sensitive** and must match the class exactly (Nasdara's loot tables say `Land_Tradtent_*`, but the class is `Land_TradTent_*`). If the map's `mapgroupproto.xml` has no group for a building, copy it from another mission and fix the case. Check usages/categories exist in `cfglimitsdefinition.xml`.
- Don't add `mapgrouppos.xml` lines for event buildings; that's only for permanently placed buildings.

### Infected or animal secondary
- One `<secondary>` per event in `events.xml`. There's no per-child or per-position override; the only per-child option is `spawnsecondary="true|false"`.
- Set `spawnsecondary="false"` on props, and leave it on only for the few children the infected should gather around.
- A secondary event with no infected zone in `zombie_territories.xml` gets only the minimum 1% share of the map's infected (about 7 on Chernarus), split between its child types (`min` = % weight, totalling 100). Check the RPT allocation block `[n] <Secondary> :: dmax … == N pcs` and the per-type `min/max` lines. If types show 0, trim the list or rebalance and re-check. Raising the cap needs a territory zone, which then spawns those infected there even when the event is absent.
- To mix themes (e.g. Nasdaran villagers plus medics), make one custom secondary with the combined child list rather than a separate event.

### Write the entries
- `cfgeventgroups.xml` (groups only): the `<group name="GROUP">` children, inside `</eventgroupdef>`. Put a vanilla header comment directly above each group: a copy of its `cfgeventspawns.xml` `<pos>` line with the same values, written as `<!--pos x="…" z="…" a="0" y="…" group="GROUP"/-->`. Vanilla sometimes includes `deloot`/`lootmax`/`lootmin` in it, e.g. `<!--pos deloot="1" lootmax="4" lootmin="2" x="3518.464" z="9122.509" a="0" y="310.821" group="Traffic_Vybor"/-->`. Use no free-text comments here; descriptions go in CLAUDE.md's custom-content table. If a position changes, update the header too.
- `cfgeventspawns.xml`: `<event name="EVENT"><zone …/><pos x z a="0" y group="GROUP"/> …</event>`, inside `</eventposdef>`. One `<pos>` per position; several groups can share one event.
- `db/events.xml`, with the agreed values. For a static event group, model it on vanilla `StaticMilitaryConvoy`:
```xml
<event name="EVENT">
  <nominal>1</nominal><min>0</min><max>0</max>
  <lifetime>14400</lifetime><restock>0</restock>
  <saferadius>100</saferadius><distanceradius>0</distanceradius><cleanupradius>200</cleanupradius>
  <secondary>OPTIONAL</secondary>
  <flags deletable="0" init_random="0" remove_damaged="0"/>
  <position>fixed</position><limit>child</limit><active>1</active>
  <children/>
</event>
```
  For a child event, fill `<children>` with `<child lootmax lootmin max min type/>` lines instead (see `StaticHeliCrash`).
- `db/types.xml`: only the spawnable items from the Classes step.
- If the mission keeps notes (e.g. a "custom content" table in a CLAUDE.md), update them.

## 4. Test
Use the dayz-server-check skill: stop the server, wipe `storage_1` (only with the user's OK), start it, then check the RPT for:
- `[n] EVENT` with "Primary Spawner: Static … active: yes" (and the secondary spawner line, if any)
- one `[CE][SpawnRandomLoot] (EVENT) :: Type: …` line per looted child, with the `deloot` value you set
- the secondary's `== N pcs` allocation, with every type at least 1
- no "No group configured", "Type does not exist" or "Wanting to spawn more loot than possible" lines

Then commit.

### Tell the user about persistence
Static children that aren't `_DE` aren't saved ("can not be saved because of non-saveable StorageCategory"). After a restart the buildings vanish but their loot stays, and the server still counts the event as active until its lifetime ends. Options: accept it and wipe while testing; remove loot from those children; or move the structures to the object spawner (rebuilt every start) with loot via `mapgrouppos.xml`.

## Mode B: design a layout and write a .dze

Only for event groups the user wants designed. Base the asset choice on the Round 1 prompt.

1. **Site data:**
   - Town positions: `config.bin` in `addons\worlds_<map>.pbo`, `CfgWorlds > <World> > Names` (class, type, position).
   - **Terrain heights: use the WRP heightmap, not the navmesh.** In `ChernarusPlus.wrp` (OPRW version 32), the elevation is an LZO1X-compressed float array, 2048 × 2048 (7.5 m cells, index = z × 2048 + x). The stream ends with the LZO end marker `11 00 00` just before the material (`.rvmat`) list; find its start by decompressing from just after each earlier `11 00 00` until one yields exactly 16,777,216 bytes. Interpolate within each cell. Navmesh polygon heights are 0.2 m off on average and up to ±0.6 m, because DayZ navmeshes have no detail meshes.
   - Walkable ground and water: the navigation mesh in `addons\worlds_<map>_nav.pbo` (`navmesh.nm`), split into 50 m tiles marked by the bytes `VAND`. Each tile has a 104-byte header (x and z tile index at bytes 8 and 12, polygon count at 24, vertex count at 28, max links at 32, detail-mesh count at 36 = 0), then vertices of 3 floats (x, height, z), then 32-byte polygons (vertex list at bytes 4–15, vertex count at byte 30, area type at byte 31: 1 = ground, 5 = water).
   - World objects, including trees, buildings, walls, roads and rails, are in the `.wrp`.
     - The model list starts at the first `dz\plants\…` string, preceded by its count.
     - After it comes a classed-object list: count, then per entry class name, model path, x, height, z, and 8 bytes.
     - Then 64-byte object records at arbitrary byte alignment: id, model index, 9 rotation floats (aside xyz, up xyz, dir xyz), x, y, z, flags, 0. Find them by scanning for a valid model index, orthonormal rotation and an in-map position.
     - Roads are ordinary records of `dz\structures\roads\parts\…` models; their centre line runs along the model's z axis.
     - Stay at least 8 m from road centre lines and 7 m from rails.
   - Footprints: rotate each model's bounding box (below) by its record's aside/dir vectors. For trees, block about 1 m around the trunk and treat the canopy as soft.
2. **Choosing the spot:** map slope and the obstacles above, find flat clear patches large enough for the layout, and compare candidates. Then run the clash check (section 2) on the chosen position before designing.
3. **Classes:** confirm each exists and note which `.pbo` it comes from. Base `addons` classes are safest for console; Badlands (`nasdara`) and Frostline (`sakhal`) content needs testing there.
4. **Heights:** read each model's bounding box from its `.p3d` (ODOL format). The minimum corner is at byte `12 + 4×LODcount + 48`, with the maximum 12 bytes after. Object y = lowest terrain height under the footprint − bounding-box minimum y, so nothing floats.
5. **Layout:**
   - keep clusters tight, and leave walkways between tents (at least about 1.2 m between guy-rope boxes)
   - avoid trees, water and steep ground (under about 0.5 m height change across a tent's floor, and under 0.15 m for small props, since children can't be pitched or rolled)
   - put no permanent lights in
6. **Rotation:** DayZ Editor, event groups (`a`) and the object spawner use yaw in degrees from −180 to 180, where 0 faces north and 90 faces east, stored as `[yaw, 0, 0]` in the editor.
7. **Write the `.dze` as JSON** to the Editor folder, with the camera about 45 m above the ground (a fixed y of 40 is underground on high terrain):
```json
{"MapName":"ChernarusPlus","CameraPosition":[x,groundY+45,z],
 "EditorObjects":[{"Type":"Class","DisplayName":"Class","Position":[x,y,z],"Orientation":[yaw,0,0],"Scale":1.0,"AttachmentMap":{},"Model":"","Flags":30}],
 "EditorHiddenObjects":[],"CameraTracks":[]}
```
8. **Hand over:** the user opens it in the editor (File → Open), adjusts it, snaps it to the ground if needed, right-clicks the anchor and chooses Copy as Event Group. Then run Install.
