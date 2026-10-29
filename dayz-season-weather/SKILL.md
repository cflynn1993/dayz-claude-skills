---
name: dayz-season-weather
description: Create switchable DayZ weather and season profiles (winter, fog, long nights) via cfgweather.xml, cfggameplay temperatures and lighting, serverDZ.cfg time and optional seasonal loot.
---

# DayZ seasons and weather profiles

## Settings
- **`cfgweather.xml`:**
  - `<weather reset="1" enable="1">`: `reset` ignores saved weather on restart; `enable="0"` means vanilla weather.
  - Per phenomenon (`overcast`, `fog`, `rain`, `windMagnitude`, `windDirection`, `snowfall`): `<current actual time duration/>` (start value; seconds to reach it and hold it), `<limits min max/>` (0–1, wind in m/s), `<timelimits/>` (seconds between changes), `<changelimits/>` (change size).
  - `rain` and `snowfall` also have `<thresholds min max end/>` (the overcast band they need). `<storm density threshold timeout/>` is lightning.
  - Snow on maps that don't normally have it may not show; test it.
- **`cfggameplay.json` → `WorldsData`** (needs `enableCfgGameplayFile = 1`): `environmentMinTemps`/`environmentMaxTemps` (12 values, Jan–Dec, °C; they drive freezing), `wetnessWeightModifiers` (5), `lightingConfig` (0 bright nights, 1 dark).
- **`serverDZ.cfg`** (needs a restart): `serverTime` (`"SystemTime"` or `"YYYY/MM/DD/HH/MM"`, which sets the month and season), `serverTimeAcceleration`, `serverNightTimeAcceleration` (a multiplier on top), `serverTimePersistent`, `lightingConfig`.
- **Seasonal loot:** `cfgignorelist.xml` blocks classes (vanilla blocks the Christmas and Halloween items). Unblock them and give them a nominal to switch them on.

## Ask
Which profiles; survival pressure or just atmosphere; seasonal loot; manual or scheduled switching.

## Build and switch
- Store each profile as `profiles/weather/<name>/cfgweather.xml` plus a note with its `WorldsData` and `serverDZ.cfg` values. **Save the current setup as `default` first.**
- Plausible values: winter max temperatures about 0–5 °C; thick fog limit about 0.5 (0.8+ is near zero visibility); showers 0.3–0.6.
- Show a table comparing each profile with the current settings.
- **Apply:** copy its `cfgweather.xml` in, edit only those `WorldsData` keys and `serverDZ.cfg` lines, and commit "season: <name>". To go back, `git revert` or apply `default`.
- **Schedule:** a Task Scheduler script inside the restart routine (dayz-restart-scheduler), since every change needs a restart.

## Test
Check the RPT has no weather or cfggameplay errors. In game: start weather matches `current`, temperatures feel right, snow shows if wanted. No wipe is needed, except to fill seasonal loot at once (ask first).
