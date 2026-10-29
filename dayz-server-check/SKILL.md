---
name: dayz-server-check
description: Restart a DayZ server safely (clean stop, optional storage wipe, start script) and triage the RPT, script, ADM and admin-tool logs into a verdict plus real issues.
---

# DayZ restart and log check

## Restart
1. **Running?** The newest RPT ending with `--- Termination successfully completed ---` means stopped; otherwise check `tasklist /FI "IMAGENAME eq DayZServer_x64.exe"`.
2. **Stop cleanly:** close the server console window (`(Get-Process DayZServer_x64).CloseMainWindow()`) and wait for the termination line. **Never kill it**, which damages saves. If that isn't possible, ask the user to close it.
3. **Wipe** `storage_<instanceId>` only when the user asks, and only while stopped. Prefer moving it aside (a dated backup) over deleting. It's needed for a fresh loot fill or event respawn.
4. Edits are committed and validated.
5. **Start** with the server's start script (not Steam's Launch button, which skips the config and mods). It's ready at `Player connect enabled`, after about 60–110 s.

## Log check
Read the newest RPT, plus the script, error, ADM and admin-tool logs from the same run. RPT line 3 shows the command line and mods.

**Report:**
- **Loot fill:** `[CE][LootRespawner] … Initially (re)spawned:X, Nominal:Y`. X ≈ Y after a wipe; X = 0 on a restored save.
- **Overtime:** `causing search overtime: "Item"` grouped by item. A few at a fresh fill is normal. Repeats later mean too few spots: lower nominal/min and set restock ≥ 1800.
- **Classes:** `Type 'X' will be ignored. (Type does not exist)`, usually a wrong name or case.
- **Loot tables:** `No group configured for 'X'` means a missing or wrong-case `mapgroupproto.xml` group.
- **Events:**
  - `[n] Event` with its Primary and Secondary spawner lines
  - `[CE][SpawnRandomLoot] (Event) :: Type … wanted … deloot … containermaxsum`
  - "Wanting to spawn more loot than possible", and "Sum of container LootMax is lower than event child LootMax" (often a container without `lootmax`, which means a cap of 4)
- **Infected:** `[n] Infected… :: dmax … == N pcs` and the per-type min/max lines.
- **Vehicles:** `VehicleRespawner … Failed to spawn the requested amount` means blocked points; minor.
- **Saves:** `Failed to read/write [Storage]`, `valid:NO` (normal right after a wipe), "Restoring file" after an unclean stop, and any `crash_*.log`.
- **Scripts:** `SCRIPT (E)`.
- **Mods:** admin-tool lines, e.g. VPP `credentials.txt` problems and `Adding Super Admin`.
- **Players (ADM):** connects, disconnects, kicks, deaths and positions.
- **Unexpected stop with no termination line or crash log:** check the Windows event log for a BlueScreen or app crash at that time.

**Known harmless, one line:**
- pond "Unknown object class", "No components in…", "Convex … selection faces", lightning-conductor and washing-machine "thing"
- translation and duplicate-text warnings, "Trying to access error value", "Can't load skeletons.anim.xml"
- animal model attachment and damage-zone warnings
- `CeramicPot_*`, `ChristmasTree`, `Static_FrozenScientist_DE`, `ZmbM_takiCitizenUrbanB_BlueBright`
- `VehicleTransitBus` points, "5 groups have no points", "No Shutdown message present"
- "Programatically adding … to types" and "non-saveable StorageCategory" for static event props

**Output:** a verdict, then a table of real issues with evidence and fixes, then the harmless line. Logs show counts, not exact items, so say what needs checking in game.

## Player-side
- **"Client is missing a mod":** join through DayZ Launcher → Servers → LAN → "Setup DLCs and mods and join".
- **VPP:** End toggles the tools and shows the password box the first time; Home opens the toolbar. On laptops, Fn+→ / Fn+←. The password goes on line 1 of `credentials.txt`; super admins are in `profiles\VPPAdminTools\Permissions\SuperAdmins\SuperAdmins.txt`.
- **Test spawn:** replace the `<fresh>` bubbles in `cfgplayerspawnpoints.xml` with one `<pos>`, set the area to 8×8 and the minimum infected distance to 0. Restore it afterwards.
