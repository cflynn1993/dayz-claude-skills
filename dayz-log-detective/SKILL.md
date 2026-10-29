---
name: dayz-log-detective
description: Turn DayZ ADM/RPT/admin-tool logs into a report (sessions, deaths, PvP, heatmap) and flag suspicious patterns (kill distances, teleports, combat logging) as evidence only.
---

# DayZ log detective
Flags are evidence, never proof. Never kick or ban.

## Sources
- `profiles\*.ADM` (one per start) is the main source. The RPT gives crashes, kicks and BattlEye. Admin-tool logs (e.g. VPP) show admin teleports and spawns; exclude them from flags.
- **Richer logs** (`serverDZ.cfg`, needs a restart): `adminLogPlayerList = 1` (positions every 5 minutes, needed for movement checks), `adminLogPlayerHitsOnly = 0`, `adminLogPlacement = 1`, `adminLogBuildActions = 1`.

## ADM lines (check against the server's own logs)
- `HH:MM:SS | Player "N" (id=<hash>) is connecting`, then `(id=… pos=<x, z, y>) is connected` / `has been disconnected`
- `… [HP: n] hit by Infected|Wolf|Doberman|Player "B" (id=… pos=<…>) into Head(0) for n damage (Ammo/Melee) [with Weapon from n meters]`
- `Player "N" (DEAD) (…) killed by Player "B" (…) with Weapon from n meters`, or `killed by <animal>` / `Infected`
- `(DEAD) … died. Stats> Water … Energy … Bleed sources: n` is a death with no killer (bleeding, environment)
- `is unconscious`, `regained consciousness`, `is choosing to respawn`, `performed Emote…`, `##### PlayerList log`
- `pos=<x, z, height>`. Group players by `id` (stable) and show their last name.

## Analyses
Sessions and play time, peak players; deaths by cause, place and time since spawn; a PvP table (killer, victim, weapon, distance, place) and the longest kills; a heatmap on a grid with town labels (`CfgWorlds > Names`, or `towns()` in `tools/site_analysis` if present).

## Flags (adjustable thresholds)
- **Kill distance:** pistols or SMGs over 200 m, anything over 1,000 m, or many long-range hits without an optic.
- **Teleport-like:** consecutive positions implying more than 60 m/s (excluding respawns, connects and admin teleports).
- **Combat log:** a disconnect within 60 s of a player hit or a nearby kill.
- **Spawn killing:** kills within about 5 minutes of the victim spawning, near spawn areas.
- **Repeat victim:** the same killer and victim three or more times quickly.
- **Kill-rate outlier:** far above everyone else's kills per hour.

## Output
A summary, a flags table (player, what, when, where, evidence line), then stats. Offer an HTML report. **Privacy:** names and IDs stay local or with admins only. Suggest checks (gear, spectating, admin history); don't take action.
