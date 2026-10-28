---
name: dayz-server-check
description: Restart a local DayZ server safely (clean stop, optional storage_1 wipe, start_server.bat) and triage the RPT, script, ADM and VPP logs for real problems.
---

# DayZ server: restart and log check

## Paths (defaults; confirm with the user)
- Server: the DayZ Server install, by default `C:\Program Files (x86)\Steam\steamapps\common\DayZServer`
- Mission: `mpmissions\<mission>` (e.g. `dayzOffline.chernarusplus`), saved world `…\storage_1` (the number follows `instanceId` in `serverDZ.cfg`)
- Logs: `profiles\` (`DayZServer_x64_<date>.RPT`, `script_*.log`, `error_*.log`, `*.ADM`, `crash_*.log`) and `profiles\VPPAdminTools\Logging\`
- Start: the server's start script, e.g. `start_server.bat` running `DayZServer_x64.exe -config=serverDZ.cfg -profiles=profiles "-mod=@CF;@VPPAdminTools"` (your mod list may differ). Don't use Steam's Launch button or a plain shortcut; they skip the config and mods.

## Restart procedure
1. **Is it running?** If the newest RPT ends with `--- Termination successfully completed ---`, it's stopped. On Windows you can also run `tasklist /FI "IMAGENAME eq DayZServer_x64.exe"`.
2. **Stop cleanly:** close the server console window ("DayZ Console version …"), which saves and shuts down. Wait for the termination line. Don't kill the process: that leaves damaged save files ("File not closed"). If you can't close the window yourself, ask the user to.
3. **Wipe `storage_1` only when the user has asked**, and only while the server is stopped. Deleting it while the server runs locks files and gives "Failed to write [Storage]" errors. Wipe when a fresh loot fill or a fresh event spawn is needed (events and their state are saved).
4. **Commit** mission edits first and validate them (your mission validator if you have one, or check each file parses as XML). Outside git, back up with `<file>.bak-before-<tag>`.
5. **Start** `start_server.bat`. It's ready when the RPT shows `Player connect enabled`, about 90–110 s later.
6. Run the log check below.

## Log check
Read the newest RPT, plus script, error, ADM and VPP logs from the same run. Check the command line on RPT line 3 to confirm the mods.

**Report these:**
- **Loot fill:** `[CE][LootRespawner] … Initially (re)spawned:X, Nominal:Y, Total in Map: Z`. A fresh wipe gives X ≈ Y; a restored save gives X = 0.
- **Overtime:** `tests: … overtime:N`, and the `causing search overtime: "Item"` lines grouped by item.
  - A few at a fresh fill is normal.
  - Items repeating minutes later point to too few spots for their usage and tier; suggest lowering `nominal`/`min` and setting `restock` to 1800 or more.
- **Missing classes:** `Type 'X' will be ignored. (Type does not exist)` is often a wrong name. Check the exact class, e.g. `Glock_Tan` should be `Glock19_Tan`.
- **Loot tables:** `No group configured for 'X'` means no loot table for the class, or a case mismatch.
- **Events:** `[n] EventName` with its Primary/Secondary spawner lines, and `[CE][SpawnRandomLoot] (Event) :: Type … wanted … deloot`. Also "Wanting to spawn more loot than possible" and "Sum of container LootMax is lower than event child LootMax".
- **Infected allocation:** `[n] Infected… :: dmax … == N pcs` and the per-type min/max lines, e.g. when checking a custom secondary.
- **Vehicles:** `VehicleRespawner … Failed to spawn the requested amount`. Usually blocked spawn points; minor.
- **Saves:** `Failed to read/write [Storage]`, plus any `crash_*.log`.
- **Script errors:** `SCRIPT (E)` lines in the script log.
- **Mods:** e.g. VPPAdminTools lines, e.g. `credentials.txt was not found` or `Error parsing credentials.txt` (password not set), and `Adding Super Admin (<steamid>)`.
- **Players (ADM):** connected, disconnected, kicked, deaths.

**Known harmless, summarise in one line:**
- Ponds "Unknown object class", "No components in …", "Convex … selection faces"
- Translation and duplicate-text warnings, "Trying to access error value"
- "Can't load skeletons.anim.xml" for each mod
- Missing attachments and damage zones on animal models, and German Shepherd "cannot load material"
- `Xmas_Ammo_Small` empty preset (flares are on the ignore list)
- `CeramicPot_*` and a few zombie classes that don't exist in 1.30, `ChristmasTree` not spawnable
- `VehicleTransitBus` spawn points with no event, "5 groups have no points", "No Shutdown message present"
- "Programatically adding … to types" and "can not be saved because of non-saveable StorageCategory" for static event props (expected; see create-dynamic-event)

**Output:** first a verdict (running as expected or not), then a short table of real issues with evidence and the suggested fix, then the harmless line. Remember the log records counts, not exact items placed, so say when something needs checking in game.

## Common player-side issues
- **Kicked: "Client is missing a mod which is on the server":** join through the DayZ Launcher → Servers → LAN → double-click the server → "Setup DLCs and mods and join".
- **VPP Admin Tools (if installed):** End toggles the tools and shows the password box the first time; Home opens the toolbar only once the tools are on. On laptops, Fn+→ is End and Fn+← is Home, or rebind under Options → Controls → VPP. Super admins are listed in `profiles\VPPAdminTools\Permissions\SuperAdmins\SuperAdmins.txt`. The password goes on the first line of `credentials.txt` and is scrambled on the next start.
- **Temporary test spawn:** replace the `<fresh>` bubbles in `cfgplayerspawnpoints.xml` with one `<pos>`, set the search area to 8×8 and the minimum infected distance to 0. Restore it afterwards (`git checkout -- cfgplayerspawnpoints.xml`, or from a backup copy).
