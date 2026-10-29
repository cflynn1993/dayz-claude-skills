# DayZ server skills: what each one does

A plain-English guide to the 18 skills. You don't have to name a skill: describe the job ("my loot feels broken", "add a camp near Vybor"), and Claude Code picks the right one. You can also run one directly as a slash command, e.g. `/dayz-economy-audit`.

**Safety rules every skill follows:**
- It asks before anything destructive. Storage wipes only happen when you say so, and only while the server is stopped.
- It stops the server cleanly (closes the console window), never kills it.
- It commits to git before editing, if your mission is a git repo, so any change can be undone.
- It edits files in place without reformatting them, and checks they still parse afterwards.

## Quick picker

| I want to… | Skill |
|---|---|
| Check my server after a restart, or read the logs | `dayz-server-check` |
| Find loot that's broken or never spawns | `dayz-economy-audit` |
| Change, add or move loot items | `dayz-loot-economy` |
| Boost or cut loot by category or tier | `dayz-loot-tuning` |
| Add a camp, wreck site or other event | `create-dynamic-event` |
| Build something permanent (outpost, bunker) | `dayz-custom-poi` |
| Change starting gear | `create-player-loadout` |
| Change where players spawn | `dayz-spawn-points` |
| Change vehicle spawns or parts | `dayz-vehicles` |
| Tune infected numbers or hordes | `dayz-infected-tuning` |
| Add or change gas zones | `dayz-gas-zones` |
| Change weather or seasons | `dayz-season-weather` |
| Change stamina, building, map or other settings | `dayz-gameplay-tuner` |
| Set up restart messages and automatic restarts | `dayz-restart-scheduler` |
| Back up or roll back the world | `dayz-backup-rollback` |
| See who's killing whom and spot cheaters | `dayz-log-detective` |
| Update after a DayZ patch | `dayz-update-merge` |
| Move my mission to a console server | `dayz-console-deploy` |

---

## Running the server

### dayz-server-check
**For:** restarting the server safely and reading the logs afterwards.
**Try:** "Restart the server and check the logs", "Wipe storage and restart", "Why did players get kicked?"
**What it does:**
- Stops the server cleanly and wipes the storage folder only if you ask.
- Starts it with your start script and waits for it to be ready.
- Reads the RPT, script, admin and admin-tool logs.
**You get:** a verdict (running fine or not), a short table of real problems with evidence and fixes, and a one-line summary of the harmless warnings DayZ always prints.
**Changes:** nothing in your files. Restarts the server; wipes only if asked.

### dayz-restart-scheduler
**For:** in-game messages and automatic, clean restarts.
**Try:** "Restart every 4 hours with warnings", "Add a welcome message and our Discord link", "Restart at 6am and 6pm".
**Asks:** how often or at what times, the warning text and timings, whether to restart automatically, and whether to back up between restarts.
**Changes:** `db/messages.xml` (welcome, tips, countdown). It also creates a restart loop batch file or a Windows scheduled task. You test with a short countdown first.

### dayz-backup-rollback
**For:** protecting the saved world and undoing disasters.
**Try:** "Back up the world nightly and keep a week", "Roll back to last night", "A player lost their gear to a bug; restore their character."
**What it does:**
- Snapshots the storage folder while the server is stopped, and deletes old snapshots on a schedule.
- Restores a whole snapshot, moving the current world aside first.
- Restores one player's character from an older `players.db`, and warns about duplicating gear.
**Changes:** only backup folders, unless you ask for a restore. A restore rolls everyone back to the snapshot time.

### dayz-update-merge
**For:** after Steam updates DayZ, bringing in Bohemia's new files without losing your edits.
**Try:** "DayZ updated to 1.31, merge it."
**What it does:**
- Records Bohemia's new vanilla files as their own git commit, then merges them into your mission.
- Where you and Bohemia changed the same entry, it shows both and asks rather than guessing.
- Checks for renamed or removed items, and updates mods and keys.
**Needs:** the mission in git, with a tag on the old vanilla files.

### dayz-console-deploy
**For:** moving a mission tested on PC to a console (PlayStation/Xbox) community server.
**Try:** "Get this ready for our Nitrado PS5 server."
**What it does:**
- Flags anything console servers can't use: mod classes, DLC items the console server may not have, settings from a newer version.
- Packages only the mission files your host lets you edit, plus a list of changes from vanilla.
- Gives you the upload steps.
**Changes:** nothing on the live server; it builds a package for you to upload.

## Loot

### dayz-economy-audit
**For:** finding loot problems DayZ never reports clearly.
**Try:** "Audit my loot", "Why does X never spawn?", "Check the economy before I go live."
**Finds:**
- items that can never spawn (no matching building usage or category)
- event loot with nowhere to spawn
- containers silently capped at 4 items
- typos and missing classes
- overtime that keeps repeating across many logs
**You get:** a ranked report with the biggest wins first. **Read-only:** it fixes nothing until you choose what to fix.

### dayz-loot-economy
**For:** careful, individual loot edits.
**Try:** "Add the SVD to military loot", "Make these items spawn only at my event", "Add a dog territory along the coast."
**Covers:**
- `types.xml` items, and custom usage tags for loot unique to one place
- building loot tables (`mapgroupproto.xml`)
- animal and infected territories
- loot for permanently placed buildings
**Checks:** every class name against the real game, with exact case.

### dayz-loot-tuning
**For:** changing lots of loot at once by rule.
**Try:** "Boost food 50%", "Halve Tier 4 military", "More ammo but fewer guns."
**What it does:**
- Turns your request into rules (category, usage, tier, name pattern) and applies them.
- Shows before/after tables, and warns if the map can't hold that much loot (search overtime).
- Leaves event-only and custom loot alone unless you name it.
**Changes:** `types.xml` numbers only, in one commit you can revert.

## Events and places

### create-dynamic-event
**For:** new events: camps, wreck sites, checkpoints, or anything the economy spawns and rotates.
**Try:** "Create a refugee camp near Myshkino", "Add a crashed convoy event at these coordinates."
**Asks:**
- the event name, and whether it's an event group (a fixed layout) or a child event (items or wrecks from a list)
- a description of what it should include
- how many positions and how many active at once
- the XML values, with suggested defaults and plain-English explanations of each radius
**Checks:** clashes with nearby events, player spawns, gas zones, territories and roads, plus shared infected pools and loot limits.
**Can design without DayZ Editor:** using the included `tools/site_analysis` toolkit (Node.js), it reads your own server's map data (terrain heights, trees, buildings, roads) and picks flat, clear ground. It places every tent and prop without floating or clipping, writes the event files directly and verifies them afterwards. Opening the layout in DayZ Editor is optional.

### dayz-custom-poi
**For:** permanent structures that exist every restart: outposts, ruins, survivor villages, bunkers.
**Try:** "Build a small military outpost on the hill east of Zelenogorsk", "Make an underground bunker."
**Uses:** object spawner files for the structures, `mapgrouppos.xml` for their loot, and underground triggers for darkness and echo inside bunkers, modelled on the vanilla bunkers on other maps.
**Note:** vanilla can't remove existing map objects, so POIs are built around them.

### dayz-gas-zones
**For:** toxic gas areas.
**Try:** "Add a gas zone around the Pavlovo base", "Turn on dynamic gas events", "Make the gas zone loot better."
**What it does:**
- Covers static zones (size, height, particles) and dynamic gas events.
- Sets safe positions for players who log out inside a zone, and the reward loot.
- Checks that gas masks and NBC gear can actually spawn, and that no zone covers spawns, events or bases.

### dayz-spawn-points
**For:** where players spawn.
**Try:** "Add inland spawns", "Fewer spawns in Cherno", "Stop spawn-killing on the coast."
**Covers:** fresh, hop and travel spawn areas, distance rules (from infected and other players), and slope limits. It can pick spawn areas from terrain data and checks them against gas zones, events and high-tier infected areas.
**Note:** vanilla can't link a spawn area to a particular starting loadout.

## Players

### create-player-loadout
**For:** the gear fresh characters spawn with.
**Try:** "Make a hunter start for 1 in 4 players", "Give everyone a knife and a canteen."
**Asks:**
- the survivor type: keep the player's chosen character, male or female only, or specific characters
- the theme, and how common it should be
- every clothing slot, what's inside each item, weapons with magazine and attachments, condition, quickbar keys, and random bonus items
**Checks:** that items exist and fit their slot, cargo space, magazines and attachments, weights and JSON.
**Good to know:**
- These presets replace any starting gear set in `init.c`.
- Listing characters overrides what players picked in the menu.
- One broken file disables every preset.
- No storage wipe is needed.

### dayz-log-detective
**For:** understanding what happened on your server.
**Try:** "Who's been killing everyone?", "Show me last week's deaths on a map", "Check this player for cheating."
**You get:**
- sessions and play time, deaths by cause, PvP kills with weapons and distances, and a death heatmap
- flags for impossible kill distances, teleport-speed movement, combat logging and spawn killing
**Note:** flags are evidence to review, never proof, and it never bans anyone. Logs contain player names, so keep reports private. Turning on extra admin logging in `serverDZ.cfg` gives better results.

## World and gameplay

### dayz-infected-tuning
**For:** how many infected, and where.
**Try:** "Quieter countryside but dangerous towns", "A horde at the military base", "Fewer infected for performance."
**What it does:**
- Maps the current infected zones, then changes them by rule or zone by zone.
- Explains the server-wide cap and the small pools for event infected.
- Checks the result in the log's allocation lines.

### dayz-season-weather
**For:** atmosphere and survival pressure.
**Try:** "Make a winter profile", "Foggy autumn for Halloween with pumpkins", "Longer, darker nights."
**What it does:**
- Builds named profiles from weather, monthly temperatures, night lighting and time speed.
- Saves your current setup as "default" first, then switches profiles on request or on a schedule.
- Can switch seasonal loot on.

### dayz-gameplay-tuner
**For:** the game's settings, explained in plain English.
**Try:** "Make it more hardcore", "Make building easier", "Stop combat logging", "Show player position on the map."
**Covers:** stamina, movement, base-building checks, map, UI, vehicles, code locks, cleanup timers, login/logout timers, infected and animal caps, 3rd person and crosshair. It offers hardcore, PvE and casual presets and shows a before/after table of exactly what changes.

### dayz-vehicles
**For:** cars, trucks and boats.
**Try:** "Spawn vehicles complete", "More boats", "Add vehicle spawns at the Zelenogorsk car park", "Make an admin supply truck."
**What it does:**
- Changes which parts and cargo vehicles spawn with, how many of each type, and where they spawn.
- Can build a supply truck reserved for admins, without mods.
- Warns about server load, and points out that vehicles already in the save won't change until they respawn.

---

**Where to start:** run `dayz-server-check` after any change, use `dayz-economy-audit` once to see the state of your loot, and set up `dayz-backup-rollback` before making big changes. Test everything on a test server first.
