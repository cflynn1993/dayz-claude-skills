# DayZ server skills for Claude Code

Eighteen skills that teach Claude Code how to work on a DayZ Community Server mission (the Central Economy XML files). They were built and tested on a Windows DayZ 1.30 server running Chernarus, using vanilla classes only (console-compatible), with Badlands and Frostline data installed.

See **SKILLS-GUIDE.md** for a plain-English explanation of each skill, example requests and safety notes.

| Skill | What it does |
|---|---|
| `create-dynamic-event` | New events: static event groups (camps, wrecks, checkpoints) or child events. Asks for the name, type, assets and XML values first, checks for clashes with other events, then installs from a DayZ Editor "Copy as Event Group" paste or designs the layout from map data. |
| `dayz-loot-economy` | Safe `types.xml` edits, custom usage tags, `mapgroupproto.xml` loot tables, animal and infected territories, object spawner and `mapgrouppos.xml` placement. |
| `dayz-loot-tuning` | Boost or cut loot by rule (category, usage, tier, name), with before/after tables and search-overtime checks. |
| `dayz-server-check` | Clean stop, optional storage wipe, restart, and triage of the RPT, script, ADM and VPP logs. |
| `dayz-update-merge` | After a DayZ update, merge Bohemia's new vanilla files into a git-tracked custom mission without losing your edits, and update mods and keys. |
| `dayz-vehicles` | Vehicle parts, cargo, counts, spawn points, and an admin supply truck without mods. |
| `create-player-loadout` | Fresh-spawn loadouts as Bohemia spawn gear presets (`cfggameplay.json` → `PlayerData.spawnGearPresetFiles`). Asks for the survivor type, theme, every slot's gear, weapons, condition, quickbar and how often it appears, then checks classes, slots, cargo space and weights before writing the JSON. No storage wipe needed. |
| `dayz-economy-audit` | Read-only loot health check: items that can never spawn, broken event loot, the 4-item container cap, overtime trends across many logs. Ranked report with suggested fixes. |
| `dayz-log-detective` | Turns ADM/RPT/admin-tool logs into a report (sessions, deaths and causes, PvP kills and distances, heatmap) and flags suspicious patterns (impossible kill distances, teleport-speed moves, combat logging) as evidence for admins. |
| `dayz-backup-rollback` | Safe storage snapshots with retention, full rollback after a crash or wipe mistake, and restoring a single character from `players.db`. |
| `dayz-restart-scheduler` | `db/messages.xml` welcome/tip/countdown messages and clean automatic restarts (in-game countdown + watchdog loop, or Task Scheduler), with optional backups. |
| `dayz-spawn-points` | Player spawn areas in `cfgplayerspawnpoints.xml` (fresh/hop/travel bubbles, distance and grid rules), placed with terrain data and checked against events, infected and gas zones. |
| `dayz-gas-zones` | Static (`cfgeffectarea.json`) and dynamic contaminated zones, safe logout positions, reward loot, and a check that protective gear is obtainable. |
| `dayz-season-weather` | Switchable weather and season profiles (winter, foggy autumn, long nights) using `cfgweather.xml`, temperatures, lighting and time settings, plus optional seasonal loot. |
| `dayz-custom-poi` | Permanent POIs and bunkers without mods: object spawner structures, loot via `mapgrouppos.xml`, and darkness/sound zones via `cfgundergroundtriggers.json`. |
| `dayz-gameplay-tuner` | Plain-English tuning of `cfggameplay.json`, `db/globals.xml` and `serverDZ.cfg` with hardcore/PvE/casual presets and before/after tables. |
| `dayz-console-deploy` | Checks a PC-tested mission is console-safe (no mod classes, DLC caveats, version match), packages the files and gives upload steps for the host's file manager. |
| `dayz-infected-tuning` | Infected territories, categories, caps and horde hotspots, with density maps and checks in the RPT allocation lines. |

## Install
Copy the eighteen folders into one of these:
- `.claude\skills\` inside your mission folder (for that project only), or
- `%USERPROFILE%\.claude\skills\` (for all projects).

Then open Claude Code in your mission folder and ask for the job, e.g. "check the server logs" or "add a new event". You can also run a skill as a slash command, e.g. `/dayz-server-check`.

## Map toolkit (optional, for designing events and POIs)
`tools/site_analysis/` is a small Node.js toolkit (Node 22+, no dependencies) that the event, POI and spawn skills use to read terrain heights, trees, buildings, roads and the navmesh straight from your own DayZ Server install. It picks flat, clear ground, places objects without floating or clipping, writes the event-group XML and verifies it, so DayZ Editor becomes optional. Copy the folder into your mission as `tools/site_analysis` and run `node prepare.js` once per map. See its README. No game files are included; everything is read from your install and cached in your user folder.

## Before you use them
- **Paths:** the skills assume the default Steam location (`C:\Program Files (x86)\Steam\steamapps\common\DayZServer`) and a mission such as `mpmissions\dayzOffline.chernarusplus`. Tell Claude if yours differ.
- **Git is strongly recommended.** Put the mission folder under git and tag Bohemia's stock files (e.g. `vanilla-1.30`), so every change is a reviewable, revertible commit. The update-merge skill relies on this.
- **Notes:** a `CLAUDE.md` in the mission folder listing your server's rules and custom content helps a lot. The skills check for one.
- **Validator:** the skills mention "your mission validator if you have one". Without one, Claude checks that the XML parses and then reads the server log.
- **Storage wipes:** the skills only wipe `storage_1` when you say so, and only while the server is stopped.

Use at your own risk on a test server first. Always back up (or commit) before letting any tool edit a live mission.
