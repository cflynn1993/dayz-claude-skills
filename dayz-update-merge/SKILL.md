---
name: dayz-update-merge
description: After a DayZ update, merge Bohemia's new vanilla mission files into a git-tracked custom mission without losing edits, update mods and keys, and report new or removed classes.
---

# DayZ update merge
Goal: Bohemia's changes come in, the user's edits stay, and every clash is shown to the user rather than silently decided.

## 0. Before
- The server is stopped. Read the patch notes: is a wipe required, are items renamed or removed, are there new events?
- `git status`: if Steam overwrote mission files, they're the new vanilla versions. Don't commit them; `git stash push -m "steam-<ver>-overwrite"` and keep them for step 1.

## 1. Pristine vanilla
Best source: `github.com/BohemiaInteractive/DayZ-Central-Economy`, folder `dayzOffline.<map>`. It has no tags, so use the commit that mentions the version. Clone it outside the mission and cross-check against the Steam-overwritten stash. Badlands reference files come from Steam's `mpmissions\dayzOffline.nasdara`. If GitHub lags, build the set from Steam's fresh files plus the old vanilla tag, and say so.

## 2. Vanilla commit
```
git branch vanilla vanilla-<old>          # first time only
git worktree add ../_vanilla_wt vanilla   # replace tracked files with the new vanilla (skip areaflags.map, storage_*)
git add -A && git commit -m "Vanilla <ver> (Bohemia stock)" && git tag vanilla-<ver>
git worktree remove ../_vanilla_wt
```
Summarise `git diff vanilla-<old> vanilla-<ver> --stat` for the user.

## 3. Merge
`git merge vanilla -m "Merge vanilla <ver>"`. Resolve conflicts **by entry** (`<type>`, `<event>`, `<group>` and so on), comparing old vanilla, new vanilla and yours:
- yours == old → take the new
- new == old → keep yours
- both changed → **list it for the user** with all three values and a suggestion (usually keep their tuning and adopt new fields)

If Bohemia reformatted a file, abort and do a scripted three-way merge per entry, keeping Bohemia's order, the user's custom entries and the indentation. Then `git merge -s ours --no-commit vanilla`, overwrite and commit. Custom content in the notes must survive; check each item.

## 4. Review
Rebuild the class list and run the validator if the mission has them. Otherwise check the RPT for "Type does not exist". Report:
- new classes in vanilla types (and whether they spawn in the mission)
- removed classes the mission still uses
- changed vanilla events and spawns
- every "both changed" resolution
- notes that need updating

## 5. Mods and keys
For each mod in the start script, compare `meta.cpp` `timestamp` in `steamapps\workshop\content\221100\<id>\` with `DayZServer\@<Mod>\`. If they differ, replace the whole folder (delete it first) and copy `keys\*.bikey` into `DayZServer\keys\`. Client versions must match, or players get kicked.

## 6. Test
dayz-server-check; wipe only if the patch requires it or the user asks. Check for "Type does not exist", overtime from changed vanilla numbers, and that each custom event still spawns. Commit.

**Optional (ask first):** renaming the custom mission (e.g. `dayzOffline.chernarusplus_custom`, with `template=` in `serverDZ.cfg`) stops Steam overwriting it and leaves a clean vanilla folder beside it.
