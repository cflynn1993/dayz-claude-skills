---
name: dayz-gameplay-tuner
description: Explain and tune DayZ gameplay settings in plain English - cfggameplay.json (stamina, movement, base building, map, UI, vehicles, locks), db/globals.xml (cleanup, login timers, infected and animal caps) and serverDZ.cfg options - with hardcore/PvE/casual presets and a before/after table.
---

# DayZ gameplay settings tuner

## Where the settings live
| File | Needs | Examples |
|---|---|---|
| `cfggameplay.json` | `enableCfgGameplayFile = 1` in `serverDZ.cfg` | stamina, movement, base building checks, map, UI, vehicles, locks |
| `db/globals.xml` | nothing | cleanup timers, login/logout time, infected and animal caps, loot damage |
| `serverDZ.cfg` | server restart | 3rd person, crosshair, time, lighting, max players |

Only use settings that exist in the game version. A missing or misspelled key is silently ignored, or breaks the JSON. Check against the mission validator's reference, if there is one, or Bohemia's wiki "DayZ:Gameplay_Settings".

## cfggameplay.json sections (plain English)
- **GeneralData:**
  - `disableBaseDamage`: base walls and gates can't be damaged.
  - `disableContainerDamage`: tents and barrels can't be damaged.
  - `disableRespawnDialog`, `disableRespawnInUnconsciousness`: respawn options.
- **PlayerData:**
  - `disablePersonalLight`
  - `StaminaData`: max stamina, sprint drain, weight limit and penalty per kg, melee, vaulting and ladder costs
  - `ShockHandlingData`: how fast shock or unconsciousness recovers
  - `MovementData`: inertia and turn speed
  - `DrowningData`
  - `WeaponObstructionData`: whether walls push weapons aside
  - `spawnGearPresetFiles`: see create-player-loadout
- **WorldsData:**
  - `lightingConfig` (night brightness)
  - `objectSpawnersArr` (see dayz-custom-poi)
  - `environmentMinTemps` / `environmentMaxTemps` (12 monthly values, see dayz-season-weather)
  - `wetnessWeightModifiers`, `bunkerBroadcastEnabled`, `playerRestrictedAreaFiles`
- **BaseBuildingData:** `HologramData` and `ConstructionData` switches that turn off placement checks (collision, height, terrain, roof, underwater, cold area, …). More freedom for builders, but more glitch-building.
- **UIData:** `use3DMap`, `HitIndicationData` (hit direction indicator style and duration).
- **MapData:** `ignoreMapOwnership` (see the map without owning one), `ignoreNavItemsOwnership`, `displayPlayerPosition`, `displayNavInfo`.
- **VehicleData:** boat decay, and whether wheels can be detached or damaged.
- **ExternalLockData:** protection stages and timing for code locks.
- **SandstormData** (Badlands): how often sandstorms happen.

## db/globals.xml highlights
- `TimeLogin` / `TimeLogout`: seconds before joining or leaving. Higher means less combat logging.
- `CleanupLifetimeDeadPlayer`, `…DeadInfected`, `…DeadAnimal`, `…Ruined`, `…Default`: how long bodies and ruined items stay.
- `ZombieMaxCount`, `AnimalMaxCount`: server-wide caps (a performance lever).
- `LootDamageMin` / `LootDamageMax`: the condition range of spawned loot.
- `FlagRefreshFrequency` / `FlagRefreshMaxDuration`: how long territory flags keep a base from decaying.
- `RestartSpawn`, `IdleModeCountdown`, `IdleModeStartup`.

## serverDZ.cfg highlights
- `disable3rdPerson`, `disableCrosshair`, `disablePersonalLight`, `lightingConfig`
- `serverTimeAcceleration`, `serverNightTimeAcceleration`, `maxPlayers`, `loginQueueConcurrentPlayers`
- Never print or change passwords.

## Ask first
1. **Style:** hardcore (heavier stamina, no 3rd person, dark nights, long logout timer), PvE or casual (lighter stamina, map position shown, easier building), or specific tweaks only.
2. **Which areas** to change, and anything that must not change.
3. Any **known problem**, e.g. "bases get glitched", "too many bodies", "combat logging".

## Presets (starting points, then show the exact numbers)
- **Hardcore:**
  - `staminaMax` down, `staminaKgToStaminaPercentPenalty` up, `TimeLogout` 30+
  - `disable3rdPerson = 1`, `disableCrosshair = 1`, `lightingConfig = 1`
  - map ownership required
- **PvE / casual:**
  - more stamina, `displayPlayerPosition` true, `ignoreMapOwnership` true, base damage off
  - shorter body cleanup if there are many players
- **Builder-friendly:** relax only the specific hologram checks the user names, and warn about glitch-building.

## Apply and test
- Commit first. Edit only the keys being changed, keep each file's formatting, and check the JSON or XML parses.
- Show a before/after table: setting, old value, new value, and what players will notice.
- Restart (dayz-server-check). The RPT should show no cfggameplay parse errors. Check the main changes in game; no storage wipe is needed.
