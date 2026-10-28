---
name: dayz-season-weather
description: Create switchable DayZ season and weather profiles (e.g. winter, foggy autumn, long nights, summer) using cfgweather.xml, cfggameplay.json temperatures and lighting, and serverDZ.cfg time settings, with optional seasonal loot, saved as git profiles that can be switched or scheduled.
---

# DayZ seasons and weather profiles

## The settings involved
**`cfgweather.xml`** (mission root):
- `<weather reset="1" enable="1">`. `reset="1"` ignores saved weather on restart so the profile's starting values apply. `enable="0"` turns custom weather off (vanilla behaviour).
- Each phenomenon (`overcast`, `fog`, `rain`, `windMagnitude`, `windDirection`, `snowfall`) has:
  - `<current actual time duration/>`: the start value, and seconds to reach it and hold it
  - `<limits min max/>`: the allowed range; intensities are 0–1, and wind speed is m/s
  - `<timelimits min max/>`: seconds between changes
  - `<changelimits min max/>`: how big a change can be
  - `rain` and `snowfall` also have `<thresholds min max end/>`: the overcast band in which they can happen
- `<storm density threshold timeout/>`: lightning.
- Snow on maps that don't normally have it (e.g. Chernarus) is not guaranteed to show; test in game.

**`cfggameplay.json` → `WorldsData`** (needs `enableCfgGameplayFile = 1`):
- `environmentMinTemps` / `environmentMaxTemps`: 12 values each, January to December, in °C. They drive freezing and heat.
- `wetnessWeightModifiers`: 5 values for how wet clothing adds weight.
- `lightingConfig`: 0 brighter nights, 1 darker.

**`serverDZ.cfg`** (needs a restart):
- `serverTime` (`"SystemTime"` or `"YYYY/MM/DD/HH/MM"`, which sets the in-game date, and so the season's sun and temperature month).
- `serverTimeAcceleration`, `serverNightTimeAcceleration` (a multiplier on top), `serverTimePersistent`, `lightingConfig`.

**Seasonal loot (optional):**
- `cfgignorelist.xml` blocks classes completely (vanilla lists the Christmas and Halloween items).
- Moving an item out of the ignore list and giving it a `nominal` turns it on.

## Ask first
1. **Which profiles:** e.g. "Winter" (cold temperatures, overcast, fog, snow attempts, darker nights), "Foggy autumn", "Summer" (clear, warm), "Long nights" (slower night acceleration, dark lighting), or "Storm week".
2. **Gameplay intent:** survival pressure (cold, wet) or just atmosphere?
3. **Seasonal loot:** none, or e.g. Halloween pumpkins or Christmas gifts.
4. **Switching:** manual on request, or scheduled (e.g. winter from 1 December)?

## Build profiles
- Store each profile as files in the repo, e.g. `profiles/weather/<name>/cfgweather.xml` plus a small JSON or markdown note with the `WorldsData` values and the `serverDZ.cfg` lines it needs.
- Keep values plausible: winter max temperatures around 0–5 °C; fog `limits.max` up to about 0.5 for "thick" (0.8+ is near zero visibility); rain `limits.max` 0.3–0.6 for showers.
- Show a table comparing each profile with the current settings.

## Switching
- **Applying a profile** copies its `cfgweather.xml` over the mission's, edits only `WorldsData` temperatures and lighting in `cfggameplay.json` (keep its formatting), and edits the named lines in `serverDZ.cfg`. Commit with "season: <name>".
- **Going back** is `git revert` or applying the "default" profile, which is saved from the current settings before the first change.
- **Scheduling:** a small script per profile run by Task Scheduler on the date, which works best inside the restart routine (see dayz-restart-scheduler), since every change needs a restart.

## Test
- Restart (dayz-server-check), and check the RPT for weather or cfggameplay parse errors.
- In game: the weather at start matches the `current` values, temperatures feel right (check the heat buffer when wet), and snow actually shows, if wanted.
- No storage wipe is needed, except for seasonal loot, which only fills over time unless storage is wiped (ask first).
