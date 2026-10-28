---
name: dayz-console-deploy
description: Check that a DayZ mission tested on a PC server is safe for a console (PlayStation/Xbox) community server - no mod classes, vanilla-only settings, matching game version, DLC caveats - then package the mission files and give upload steps for the host's file manager.
---

# DayZ console deploy

Console community servers (rented from hosts such as Nitrado) **can't run mods**, and usually let you edit only some mission files. A PC test server is a good staging area, as long as nothing PC-only slips through.

## 1. Ask first
1. **Host and platform:** PlayStation or Xbox, which host, which map, and which files the host lets you edit (often the mission XML/JSON files only; some also allow `init.c` or `serverDZ.cfg` options through their panel).
2. **Console game version:** consoles can lag PC by days after an update. Anything new must exist on console too.
3. **DLC:** does the console server own Frostline or Badlands content? DLC classes (`sakhal`, `nasdara`) may not be available or allowed there.

## 2. Checks
- **Mod classes:** no class in `types.xml`, `events.xml`, event groups, `cfgspawnabletypes.xml`, `cfgrandompresets.xml`, object spawner files, or spawn gear presets may come from a mod. Build the vanilla class list from the base game `addons\` PBOs only (plus DLC if confirmed), and flag everything else.
- **DLC classes:** list every class from `nasdara\addons\` or `sakhal\addons\` separately, so the user can decide.
- **Settings:** `cfggameplay.json` keys must exist in the console version (compare with Bohemia's vanilla file for that version). No keys or files added by mods.
- **PC-only pieces to leave out:** mod folders and their storage subfolders (e.g. `communityframework`), admin tool configs, `start_server.bat`, keys, `serverDZ.cfg` (hosts set this through their panel), and BattlEye settings.
- **Mission validator** (if there is one) passes with no ERRORs; all XML and JSON parse.
- **Size and performance:** large object-spawner files or very high nominals can behave worse on console hardware, so flag anything unusual.

## 3. Package
- Copy only the mission files the host allows into a clean folder, e.g. `deploy/<mission>_<YYYY-MM-DD>/`, keeping the folder structure (`db/`, `env/`, `custom/` …).
- **Exclude:** `storage_*`, `.git`, `*.bak*`, tools, skills, notes and `.dze` files.
- Add a `CHANGES.txt` listing what differs from Bohemia's vanilla mission for that version (from git: `git diff vanilla-<version> --stat`), so changes can be re-applied after a console update.
- Zip it, and report the file list and size.

## 4. Upload steps (tell the user; don't log in for them)
1. Stop the console server in the host's panel.
2. Back up the server's current mission files (the host's file manager or FTP download).
3. Upload the changed files to the same paths in the server's mission folder.
4. If loot or event changes need a fresh economy, wipe storage in the host's panel (only with the user's OK; it resets the world).
5. Start the server and check its log in the panel for "Type does not exist", JSON errors or crashes. Then join from a console and check the changes.

## After a console game update
Hosts may restore vanilla files. Re-check the version, re-run these checks against the new vanilla files (see dayz-update-merge), and re-upload.
