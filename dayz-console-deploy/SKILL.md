---
name: dayz-console-deploy
description: Check a PC-tested DayZ mission is console-safe (no mod classes, DLC caveats, version match), package the allowed files and give upload steps for the host.
---

# DayZ console deploy
Console community servers (e.g. Nitrado) can't run mods and usually expose only the mission XML/JSON files.

## Ask
PlayStation or Xbox, the host, the map, and which files the host lets you edit (some allow `init.c` or panel settings); the console game version (it can lag PC); and whether the server owns Frostline or Badlands (DLC classes may be unavailable).

## Check
- **Mod classes:** no class in types, events, event groups, spawnabletypes, random presets, object spawners or spawn gear presets may come from a mod. Build the vanilla list from base `addons\` only (plus DLC if confirmed).
- **DLC classes:** list every class from `nasdara\`/`sakhal\addons\` separately, for the user to decide.
- **Settings:** `cfggameplay.json` keys exist in the console version; no mod files or keys.
- **Leave out:** mod folders and their storage subfolders, admin-tool configs, start scripts, keys, `serverDZ.cfg` (the host's panel sets it), BattlEye settings.
- The validator (if any) passes, and all XML/JSON parses. Flag very large object spawners or nominals.

## Package
Copy the allowed files into `deploy/<mission>_<date>/`, keeping the structure. Exclude `storage_*`, `.git`, `*.bak*`, tools, skills, notes and `.dze` files. Add `CHANGES.txt` (e.g. `git diff vanilla-<ver> --stat`), zip it, and report the files and size.

## Upload (tell the user; don't log in for them)
Stop the server in the panel → back up its mission files → upload to the same paths → wipe storage in the panel only if needed and with the OK → start → check the panel log for "Type does not exist", JSON errors and crashes → test from a console. After a console update hosts may restore vanilla files, so re-run the checks (dayz-update-merge) and re-upload.
