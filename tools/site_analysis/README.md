# site_analysis: DayZ map analysis and event layout toolkit

Reads terrain, map objects, roads and the navmesh straight from a DayZ Server install, so events and POIs can be designed and installed without opening DayZ Editor. Needs Node.js 22+ and no other dependencies. No game data is stored in the repo: derived data is cached per map in `%USERPROFILE%\.dayz-site-cache\<world>\` (about 190 MB for Chernarus).

## Settings (environment variables, all optional)
| Variable | Default |
|---|---|
| `DAYZ_SERVER` | `C:/Program Files (x86)/Steam/steamapps/common/DayZServer` |
| `DAYZ_WORLD` | `chernarusplus` (the `worlds_<world>.pbo` name) |
| `DAYZ_MISSION` | two folders above this one (the mission root) |
| `DAYZ_CACHE` | `%USERPROFILE%/.dayz-site-cache/<world>` |

## Commands
```
node prepare.js [--force]                        # build the cache (~5 s); re-run after a DayZ update
node site.js map <x> <z> <r> out.png [res]        # site map: slope classes, obstacles, roads, 50 m grid; lists structures
node site.js patches <x> <z> <r> out.png [rad] [range]   # flat, clear patches (area, trees nearby, road distance)
R=300 node conflicts.js <x,z> [...]               # nearby event spawns, player spawns, gas zones, territories, object spawners
node example_design.js                            # layout solver demo: prints event group XML + pos line, writes a plan PNG
node verify.js <GroupName> [...]                   # check an installed event group (classes, loot tables, terrain fit, collisions, roads)
```
PNG maps are north-up. Slope colours: pale under 4%, yellow 4–7%, orange 7–12%, red-brown over 12%.

## Modules
- `lib.js`: config, PBO reader, rapified `config.bin` parser, ODOL bounding boxes.
- `prepare.js`: reads `<world>.wrp` (model list, object records, LZO heightmap), the navmesh tile index, `CfgWorlds` towns and a class index (model, scope, slots, sizes, magazines).
- `world.js`: `height(x,z)` (exact terrain), `query()` objects, `navRegion()`, `cls()`/`cfgVal()` with inheritance, `bboxClass()`, `towns()`.
- `site.js`: obstacle raster (trees, bushes, rocks, walls, buildings, water, road ±8 m, rail ±7 m), PNG render, patch finder.
- `layout.js`: `Camp` solver. Each intent is nudged to the nearest pose with no world or camp overlap, an acceptable floor slope and no floating. It exports `toEventGroup()` (vanilla `<!--pos-->` header + children), `toDze()` and `render()`.

## Conventions
- Event group child `a` = world yaw (0 north, 90 east). Children's x/z/y are offsets from the first item (the anchor), and the spawn `<pos>` keeps `a="0"`.
- Object y = lowest terrain under the footprint − bounding-box min y. Tents use the lowest point of their floor, so the uphill side is slightly buried rather than floating.
- Collision uses bounding boxes (conservative). Bushes count at 60% size, trees as trunk (0.9 m) plus a soft canopy.
