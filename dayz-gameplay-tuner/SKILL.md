---
name: dayz-gameplay-tuner
description: Explain and tune DayZ settings in plain English - cfggameplay.json, db/globals.xml, serverDZ.cfg - with hardcore/PvE/casual presets and before/after tables.
---

# DayZ gameplay settings
Only use keys that exist in the game version (a typo is ignored or breaks the JSON). Check against a validator reference or wiki "DayZ:Gameplay_Settings".

## cfggameplay.json (needs `enableCfgGameplayFile = 1`)
- **GeneralData:** `disableBaseDamage`, `disableContainerDamage`, `disableRespawnDialog`, `disableRespawnInUnconsciousness`.
- **PlayerData:**
  - `disablePersonalLight`
  - `StaminaData`: max, sprint drain, weight threshold and penalty per kg, melee, vault, ladder, swim
  - `ShockHandlingData` (unconsciousness recovery), `MovementData` (inertia, turning), `DrowningData`
  - `WeaponObstructionData`
  - `spawnGearPresetFiles` (see create-player-loadout)
- **WorldsData:** `lightingConfig`, `objectSpawnersArr`, `environmentMin/MaxTemps` (12 months), `wetnessWeightModifiers`, `bunkerBroadcastEnabled`, `playerRestrictedAreaFiles`.
- **BaseBuildingData:** `HologramData` and `ConstructionData` switches that turn off placement checks (collision, height, terrain, roof, underwater, cold area…). More freedom, more glitch-building.
- **UIData:** `use3DMap`, `HitIndicationData`. **MapData:** `ignoreMapOwnership`, `ignoreNavItemsOwnership`, `displayPlayerPosition`, `displayNavInfo`.
- **VehicleData:** boat decay, wheel detach and damage. **ExternalLockData:** code lock protection stages and times. **SandstormData** (Badlands).

## db/globals.xml
- `TimeLogin`/`TimeLogout`: higher means less combat logging.
- `CleanupLifetimeDeadPlayer`/`…DeadInfected`/`…DeadAnimal`/`…Ruined`/`…Default`: how long bodies and ruined items stay.
- `ZombieMaxCount`, `AnimalMaxCount`: performance levers.
- `LootDamageMin`/`Max`, `FlagRefreshFrequency`/`MaxDuration` (base decay), `RestartSpawn`, `IdleMode…`.

## serverDZ.cfg (restart)
`disable3rdPerson`, `disableCrosshair`, `disablePersonalLight`, `lightingConfig`, time acceleration, `maxPlayers`, `loginQueueConcurrentPlayers`. Never print or change passwords.

## Ask
The style (hardcore / PvE-casual / specific tweaks), which areas, what must not change, and any problem to solve (glitch bases, bodies, combat logging).

## Presets (starting points; then show exact numbers)
- **Hardcore:**
  - stamina max down, kg penalty up, `TimeLogout` 30+
  - `disable3rdPerson=1`, `disableCrosshair=1`, `lightingConfig=1`
  - map ownership required
- **PvE/casual:** more stamina, player position shown, map ownership ignored, base damage off.
- **Builder:** relax only the named hologram checks, and warn about glitching.

## Apply and test
Commit; edit only the changed keys and keep the formatting; parse-check. Show a before/after table (setting, old, new, what players notice). Restart and check for no cfggameplay errors, then test in game. No wipe is needed.
