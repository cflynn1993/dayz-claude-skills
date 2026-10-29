---
name: create-player-loadout
description: Create DayZ fresh-spawn loadouts (spawn gear presets in cfggameplay.json) - asks survivor type, theme, per-slot gear, weapons, condition, quickbar and weight, then validates before writing JSON.
---

# DayZ spawn gear presets
Affects only new characters, so no wipe is needed. Order: read the current setup → ask → check → write → test. Parser: `CfgPlayerSpawnHandler.c` and `CfgPlayerSpawnDataJson.c` in `dta\scripts.pbo` (that's the authority; the wiki page is "DayZ:Spawning_Gear_Configuration").

## How it behaves
- `cfggameplay.json` → `PlayerData.spawnGearPresetFiles`: paths relative to the mission, **one preset object per file**, and `enableCfgGameplayFile = 1`.
- Each fresh spawn picks one valid preset, weighted by `spawnWeight` across all files.
- When any preset loads, `init.c` `StartingEquipSetup()` and the vanilla random clothes are **skipped**.
- **One unparseable file disables every preset** (silent fallback to vanilla gear).
- `characterTypes` set → a random character from the list; empty → **the player's own menu choice** is kept.

## JSON (no comments allowed in the real file)
```json
{"spawnWeight": 1, "name": "Hunter", "characterTypes": [],
 "attachmentSlotItemSets": [{"slotName": "Body", "discreteItemSets": [
   {"itemType": "HuntingJacket_Brown", "spawnWeight": 3,
    "attributes": {"healthMin": 0.7, "healthMax": 1.0, "quantityMin": 1.0, "quantityMax": 1.0},
    "quickBarSlot": -1,
    "complexChildrenTypes": [{"itemType": "BandageDressing", "attributes": {"healthMin": 1, "healthMax": 1, "quantityMin": 1, "quantityMax": 1}, "quickBarSlot": 2}],
    "simpleChildrenTypes": ["Rag"], "simpleChildrenUseDefaultAttributes": false}]}],
 "discreteUnsortedItemSets": [{"name": "Snacks", "spawnWeight": 1,
   "attributes": {"healthMin": 0.8, "healthMax": 1.0, "quantityMin": 0.5, "quantityMax": 1.0},
   "complexChildrenTypes": [], "simpleChildrenTypes": ["Apple"], "simpleChildrenUseDefaultAttributes": false}]}
```
- **spawnWeight:** an int ≥ 1 on every preset and set, or it's skipped. One `discreteItemSets` entry is chosen per slot, and one unsorted set per preset.
- **itemType:** `""` means that option spawns nothing in the slot.
- **attributes:** required on slot sets. Values 0–1, randomised between min and max.
  - health: 1 pristine, 0.7 worn, 0.5 damaged, 0.3 badly damaged
  - quantity: the fill fraction for magazines, liquids and stacks, rounded, never 0 for items destroyed when empty
- **quickBarSlot:** 0–9 = keys 1–0. **Always write it**: a missing value means 0 (key 1). Use `-1` for none, and each key at most once.
- **Slots:** Headgear, Mask, Eyewear, Gloves, Armband, Vest, Body, Back, Hips, Legs, Feet, Shoulder (`shoulderL`), Melee (`shoulderR`), Hands. Not Head, LeftHand or Splint_Right.
- **Children:**
  - `complexChildrenTypes` nest, with their own attributes and quickbar slot (e.g. weapon → magazine, optic → battery)
  - `simpleChildrenTypes` take the parent set's attributes, unless `simpleChildrenUseDefaultAttributes` is true
  - unsorted set items go anywhere they fit
- **Weapons:** a magazine child is attached and loaded to its quantity. Internal-magazine weapons (Mosin, SKS, shotguns) take the ammo type as a child.
- **Items that don't fit are dropped silently.**

## Ask
1. **Name and purpose:** archetype, seasonal, or new default; one preset or variants.
2. **Survivor type:**
   - the player's choice (empty, recommended)
   - male only (20 `SurvivorM_`) or female only (11 `SurvivorF_`)
   - named characters. M: Mirek Boris Cyril Denis Elias Francis Guo Hassan Indar Jose Kaito Lewis Manua Niki Oliver Peter Quinn Rolf Seth Taiki. F: Eva Frida Gabi Helga Irena Judy Keiko Linda Maria Naomi Baty.
3. **Share of spawns:** convert it to weights against the existing presets, and say whether those are kept, reweighted or removed.
4. **Power level:** bare, modest or geared; firearms or military items allowed?
5. **Per slot** (nothing is fine): item or weighted alternatives, condition, contents with condition and fill, weapons (slot, magazine and fill, attachments, spare ammo), quickbar keys, a random extras pool.
6. **Confirm:** a table of each preset's chance in %, characters, per-slot items with chance and condition, contents, keys, random sets and check results.

## Check
- **Classes:** exist with exact case and scope 2; vanilla only on console; flag DLC items.
- **Fit:**
  - slots: the item's `inventorySlot[]` includes the slot
  - attachments: in the parent's `attachments[]`
  - magazines: in the weapon's `magazines[]` (or `chamberableFrom[]` for loose ammo)
  - `tools/site_analysis` `world.cfgVal(cls, key)` follows inheritance
- **Cargo:** children's `itemSize` against the parent's `itemsCargoSize` (area check, plus long items).
- **Required fields** and value ranges, final weights, and economy impact (starting guns or rare items bypass the loot economy).
- **JSON:** parse every file after writing.

## Write and test
- Commit first. Write `custom/loadout_<name>.json` (2-space indent), add it to `spawnGearPresetFiles` (edit only that array), and update the notes.
- Restart. Check the RPT and script log for `Failed to load PlayerSpawnPreset`, JSON errors, `Wrong slot name used`, `FAILED spawning item`, `Invalid spawn weight` and `Failed to create character` (some are debug-only).
- In game, spawn fresh a few times: check gear, contents, condition, magazine fill, quickbar and character model.
- **Known issues** (feedback tracker T190552): listing `characterTypes` replaces the player's menu choice, and quickbar bindings may not always apply. Players can't choose a preset.
