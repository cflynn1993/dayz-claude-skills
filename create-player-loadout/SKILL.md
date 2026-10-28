---
name: create-player-loadout
description: Create DayZ fresh-spawn player loadouts as spawn gear presets (cfggameplay.json PlayerData.spawnGearPresetFiles). Asks for the survivor type, the loadout's theme, every slot's clothing and contents, weapons, condition, quickbar and how often each loadout appears, then validates classes, slots, cargo space and weights before writing the JSON.
---

# DayZ player loadouts (spawn gear presets)

Builds the gear a **fresh character** spawns with, using Bohemia's spawn gear preset system (DayZ 1.19+). Works on console and PC servers, with vanilla classes only. It doesn't affect characters that already exist; only new spawns and respawns after death use it.

Order of work: **read the current setup → ask → check → write → test**. Don't write files until the user has confirmed the summary table.

## How the system works (from Bohemia's scripts, 1.30)
The parser is `4_World/Classes/PlayerGearSpawn/CfgPlayerSpawnHandler.c` and `CfgPlayerSpawnDataJson.c` in the server's `dta\scripts.pbo`. That's the authority when anything here is unclear. Bohemia's wiki page "DayZ:Spawning_Gear_Configuration" documents the same format.

- **Registration:** `cfggameplay.json` → `PlayerData.spawnGearPresetFiles`, an array of paths relative to the mission folder (e.g. `"custom/loadout_hunter.json"`). `serverDZ.cfg` needs `enableCfgGameplayFile = 1`.
- **One preset per file.** Each file is one JSON object, not an array.
- **Choosing a preset:** on each fresh spawn, one valid preset is picked at random, weighted by `spawnWeight` across all files. So weights are relative to every other registered preset.
- **It replaces init.c:** when at least one preset loads, the mission's `init.c` `StartingEquipSetup()` is **not called at all**, and neither is the vanilla random clothing. Gear given there needs moving into a preset.
- **One broken file disables everything:** if any listed file fails to parse, loading stops and the server silently falls back to the vanilla/init.c spawn gear. Always validate the JSON.
- **Character model:** taken at random from the preset's `characterTypes`. **If `characterTypes` is empty or missing, the player's own choice from the character menu is used** (or a random one). Listing characters overrides what players picked.

## JSON reference
```json
{
  "spawnWeight": 1,                        // int >= 1, or the whole preset is skipped
  "name": "Hunter",                        // optional label
  "characterTypes": ["SurvivorM_Boris"],   // optional; empty = keep the player's chosen character
  "attachmentSlotItemSets": [              // what is worn/held, one entry per slot
    {
      "slotName": "Body",
      "discreteItemSets": [                // ONE of these is chosen per slot, by spawnWeight
        {
          "itemType": "HuntingJacket_Brown",  // "" = this option spawns nothing in the slot
          "spawnWeight": 3,                   // int >= 1, or this option is skipped
          "attributes": { "healthMin": 0.7, "healthMax": 1.0, "quantityMin": 1.0, "quantityMax": 1.0 },  // REQUIRED here
          "quickBarSlot": -1,                 // ALWAYS set it: missing = 0 = bound to quickbar key 1
          "complexChildrenTypes": [           // items put inside / attached, each with its own settings
            { "itemType": "BandageDressing", "attributes": { "healthMin": 1, "healthMax": 1, "quantityMin": 1, "quantityMax": 1 }, "quickBarSlot": 2 }
          ],
          "simpleChildrenTypes": ["Rag", "Matchbox"],   // plain list, gets this set's attributes...
          "simpleChildrenUseDefaultAttributes": false   // ...unless true (then default health/quantity)
        }
      ]
    }
  ],
  "discreteUnsortedItemSets": [            // optional; ONE set is chosen by spawnWeight
    {                                      // its items go anywhere they fit in the worn clothing
      "name": "Snacks", "spawnWeight": 1,
      "attributes": { "healthMin": 0.8, "healthMax": 1.0, "quantityMin": 0.5, "quantityMax": 1.0 },
      "complexChildrenTypes": [], "simpleChildrenTypes": ["Apple", "TunaCan"], "simpleChildrenUseDefaultAttributes": false
    }
  ]
}
```
(Comments are for explanation only. JSON allows no comments, so never write them into the file.)

- **Slot names on a survivor:** `Headgear`, `Mask`, `Eyewear`, `Gloves`, `Armband`, `Vest`, `Body`, `Back`, `Hips`, `Legs`, `Feet`, `Shoulder` (alias `shoulderL`, a rifle on the back), `Melee` (alias `shoulderR`, a second long item), `Hands` (spawned in hands). Don't use `Head`, `LeftHand` or `Splint_Right`. A slot not listed keeps vanilla's empty state.
- **`complexChildrenTypes`** take the same fields as a slot set except `spawnWeight`, and can nest: a weapon in `Shoulder` can have a magazine, an optic and a suppressor as children, and the optic can have a battery child.
- **Weapons:** a magazine child is attached and loaded to its `quantity`. For weapons with internal magazines (e.g. Mosin, SKS, shotguns), give the ammo type as a child, and it's chambered/loaded instead.
- **`attributes`:** values are 0–1.
  - `health`: 1.0 pristine, about 0.7 worn, about 0.5 damaged, about 0.3 badly damaged.
  - `quantity`: the fill fraction for magazines, water, fuel, food portions and stacks. It's rounded, and for items destroyed at 0 it never drops to 0.
  - A random value is picked between min and max on each spawn.
- **`quickBarSlot`:** 0–9, matching keys 1–0. Use each slot at most once per preset.
- **Items that don't fit** anywhere are silently skipped (`FAILED spawning item … fits in no cargo`). Check cargo space (below).

## 1. Read the current setup first
- `serverDZ.cfg`: `enableCfgGameplayFile`.
- `cfggameplay.json` → `PlayerData.spawnGearPresetFiles`. Read every listed file and summarise the existing presets with their weights as percentages.
- `init.c` `StartingEquipSetup()`. If presets exist it's already bypassed; if not, it shows the server's current starting gear.
- The mission's notes (e.g. a CLAUDE.md) for server style: hardcore, console-only, mods.

## 2. Ask
Use the AskUserQuestion tool where available (up to 4 questions per call); otherwise ask in chat. Offer sensible defaults, but don't guess.

**Round 1: the loadout**
1. **Name and purpose.** For example a themed archetype (hunter, medic, refugee, office worker), a seasonal start, or a new default. One preset or several variants?
2. **Survivor type.** Which characters can spawn with it:
   - **Player's choice:** keep the character the player picked; `characterTypes` stays empty. Recommend this unless the theme needs specific characters.
   - Male only (20 `SurvivorM_*`), or female only (11 `SurvivorF_*`).
   - Specific characters by name. Male: Mirek, Boris, Cyril, Denis, Elias, Francis, Guo, Hassan, Indar, Jose, Kaito, Lewis, Manua, Niki, Oliver, Peter, Quinn, Rolf, Seth, Taiki. Female: Eva, Frida, Gabi, Helga, Irena, Judy, Keiko, Linda, Maria, Naomi, Baty.
3. **How common.** Its share of all fresh spawns, e.g. "1 in 4". Convert that into `spawnWeight` against the existing presets, and say whether existing presets stay, change weight or are removed.
4. **Power level.** Bare (vanilla-like), modest (tools and food), or geared (weapon and armour). Also whether starting firearms or military items are acceptable on this server.

**Round 2: per slot** (go through the slots; "nothing" is a valid answer)
- **Clothing and gear:** `Headgear`, `Mask`, `Eyewear`, `Gloves`, `Armband`, `Vest`, `Body`, `Legs`, `Feet`, `Back` (bag), `Hips` (belt). For each, ask for a fixed item or random alternatives with weights (e.g. 3 jacket colours), and its condition.
- **Contents:** what goes in which clothing item (each item's `complexChildrenTypes` / `simpleChildrenTypes`). Ask for each item's condition and fill: food portions, water level, ammo count, battery charge.
- **Weapons:** melee or firearm, and in `Hands`, `Shoulder` or `Melee`. For firearms, ask for the magazine and how full it is, attachments (optic, suppressor, buttstock, handguard, light), spare magazines or loose ammo in cargo, and condition.
- **Quickbar:** which items go on which keys (1–0).
- **Random extras:** a `discreteUnsortedItemSets` pool, where one set is chosen per spawn (e.g. "either a can of beans or 2 apples"). Ask what the alternatives and weights are.

**Round 3: confirm.** Show a summary table before writing:
- each preset with its chance in %
- characters
- per slot: item(s) with chance and condition, contents, quickbar keys
- the random sets
- the check results (below)

## 3. Check before writing
- **Classes:** every `itemType` and child exists with exact case and is spawnable (scope 2), checked against `config.bin` in the server PBOs, a class list if you keep one, or the RPT. Use vanilla classes only on console servers, and flag DLC-only items (Badlands `nasdara`, Frostline `sakhal`).
- **Slot fit:** the item's config `inventorySlot[]` must include the slot (e.g. a vest in `Vest`, a backpack in `Back`, a rifle in `Shoulder`/`Melee`). Attachments must match the parent's `attachments[]`, and magazines the weapon's `magazines[]` (or `chamberableFrom[]` for loose ammo).
- **Cargo space:** add up the children's `itemSize[]` against each parent's `itemsCargoSize[]` (width × height). A rough area check is enough, plus flagging long items (e.g. a 1×4 or 2×5) that can't fit a small grid. Anything that doesn't fit is silently dropped.
- **Required fields:**
  - `spawnWeight` ≥ 1 on every preset and set
  - `attributes` on every slot set
  - `quickBarSlot` written explicitly everywhere (`-1` for none), with no key used twice
  - health and quantity between 0 and 1, with min ≤ max
- **Weights:** show the final chance of each preset, and of each alternative within its slot.
- **Economy and balance:**
  - starting firearms or rare items bypass the loot economy, so say so
  - event-only or `deloot="1"` items given here exist outside their intended source
  - items with `nominal` 0 still spawn here
- **JSON:** parse the file (e.g. with Node or PowerShell `ConvertFrom-Json`) after writing it. One bad file disables all presets.

## 4. Write
- Commit first, so `git status` is clean (outside git, back up `cfggameplay.json`).
- Save each preset as its own file in the mission, e.g. `custom/loadout_<name>.json`, with 2-space indentation and no comments.
- Add the paths to `PlayerData.spawnGearPresetFiles` in `cfggameplay.json`. Edit only that array, keep the file's formatting, and check it still parses.
- Make sure `serverDZ.cfg` has `enableCfgGameplayFile = 1`.
- Update the mission's notes (e.g. a CLAUDE.md custom-content table).
- Run the mission validator if there is one (it may check `cfggameplay.json`), then commit with the preset summary in the message.

## 5. Test
- Restart the server (see dayz-server-check). **No storage wipe is needed**; only new characters are affected.
- Check the RPT and script log for `Failed to load PlayerSpawnPreset data`, JSON parse errors, `Wrong slot name used`, `FAILED spawning item`, `Invalid spawn weight` and `Failed to create character from type`. Some of these are debug-only messages, so silence isn't proof.
- In game, spawn as a fresh character a few times (respawn after death, or with a new character), e.g. using an admin tool or a temporary test spawn point. Check:
  - the clothing, contents, condition and magazine fill
  - the quickbar keys
  - that the character model matches the survivor-type choice
- Remember that the chance of each preset only shows over many spawns.

## Known issues to tell the user about
- When presets list `characterTypes`, the character a player picks in the menu is replaced. A Bohemia feedback tracker report (T190552) describes this as the "custom respawn" choice being ignored. Leaving `characterTypes` empty keeps the player's choice.
- The same report says quickbar bindings don't always apply. Treat quickbar keys as a nice-to-have and check them in game.
- Players can't choose between presets. The game always picks one at random by weight.
