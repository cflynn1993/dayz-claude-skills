---
name: dayz-log-detective
description: Analyse DayZ admin (.ADM), RPT and admin-tool logs into a player activity report - sessions, deaths and causes, PvP kills and distances, death heatmap - and flag suspicious patterns (impossible kill distances, teleport-speed moves, combat logging) as evidence for the admin to review.
---

# DayZ log detective

Turns raw logs into a readable report for an admin. **Flags are evidence, never proof.** Present them as "worth a look", and never ban or kick anyone yourself.

## Sources
- `profiles\*.ADM`: the admin log, one per server start. The main source.
- `profiles\DayZServer_x64_*.RPT`: crashes, disconnect reasons, BattlEye lines.
- Admin tool logs, if present (e.g. `profiles\VPPAdminTools\Logging\`): teleports, spawns and kicks done by admins. Use these to rule out "suspicious" moves that an admin made.

**`serverDZ.cfg` settings that make the ADM log richer** (suggest them; changing them needs a restart):
- `adminLogPlayerList = 1`: everyone's position every 5 minutes. Needed for movement and teleport checks.
- `adminLogPlayerHitsOnly = 0`: all hits, not just player-on-player.
- `adminLogPlacement = 1` and `adminLogBuildActions = 1`: placing, building and dismantling, for base raid questions.

## ADM line formats (check against the server's own logs; wording changes between versions)
- `HH:MM:SS | Player "Name" (id=<hash>) is connecting` / `... (id=<hash> pos=<x, z, y>) is connected` / `has been disconnected`
- `Player "Name" (id=… pos=<…>)[HP: N] hit by Infected|Wolf|Doberman|Player "Other" (id=… pos=<…>) into Head(0) for N damage (AmmoOrMeleeType) [with Weapon from N meters]`
- `Player "Name" (DEAD) (id=… pos=<…>) killed by Player "Other" (id=… pos=<…>) with Weapon from N meters`, or `killed by <Animal class>` / `Infected`
- `Player "Name" (DEAD) (id=… pos=<…>) died. Stats> Water: … Energy: … Bleed sources: N`, a death with no killer line (bleeding, starving, fall, environment)
- `is unconscious`, `regained consciousness`, `is choosing to respawn`, `performed Emote…`, and `##### PlayerList log` blocks when enabled
- `pos=<x, z, y>`: x and z are map coordinates in metres; the third value is height.

The `id=` hash is stable per player; the name can change. Group by id, and show the last-used name.

## Analyses
1. **Sessions:** joins, leaves, time played per player, and peak concurrent players per day.
2. **Deaths:** by cause (players, infected, animals, bleeding or environment, unknown), by place, and by time since spawn ("died within 5 minutes" shows a hard coast or a spawn-killer).
3. **PvP:** a kill table (killer, victim, weapon, distance, place), most-used weapons, and the longest kills.
4. **Heatmap:** death and kill locations on a map grid. Label towns from `CfgWorlds > <World> > Names` in `worlds_<map>.pbo`, or render over a map image if the user supplies one.

## Suspicious-pattern flags (thresholds are starting points; tell the user they're adjustable)
- **Kill distance** beyond what the weapon realistically reaches (e.g. pistols or SMGs over 200 m, any weapon over 1,000 m), or many hits from long range with no optic weapon.
- **Teleport-like moves:** consecutive positions for one player (from PlayerList or event lines) implying a speed above about 60 m/s, the top speed of a vehicle. Exclude respawns, connects, and admin teleports from the admin tool log.
- **Combat logging:** a disconnect within about 60 s of taking a player hit, or of a player kill nearby.
- **Spawn killing:** repeated kills of players within about 5 minutes of their spawn near coastal spawn areas.
- **Repeat victim:** the same killer and victim pair three or more times in a short period.
- **Kill rate outlier:** a player far above everyone else's kills per hour.

## Output
- A one-line summary, then a table of flags (player, what, when, where, the evidence line), then the stats.
- Offer an HTML report with a filterable kills table and a heatmap.
- **Privacy:** logs contain player names and IDs. Keep the report local, or share it only with the server's admins. Don't publish it publicly unless the user wants to and has the players' consent.
- Never act on players. Suggest what to check: their gear, spectating, or admin-tool history.
