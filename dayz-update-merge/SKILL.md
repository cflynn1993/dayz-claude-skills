---
name: dayz-update-merge
description: After a DayZ game update, bring the new vanilla mission files into a git-tracked custom mission without losing custom edits, update mods and keys, and report new or removed classes.
---

# DayZ update merge

Use after Steam updates DayZ / DayZ Server (e.g. 1.30 → 1.31). The goal: Bohemia's changes come in, the user's edits stay, and every clash is shown to the user rather than silently decided.

## Expected repo layout (confirm with `git log --oneline --decorate`)
- Mission: e.g. `DayZServer\mpmissions\dayzOffline.chernarusplus`, as a git repo (with a CLAUDE.md or other notes if you keep them).
- A `vanilla-<version>` tag (e.g. `vanilla-1.30`) on Bohemia's stock files, optionally a tag for any big overhaul you started from, and `main` for everything since. If there's no vanilla tag yet, create one from Bohemia's files for the current version before the first merge.
- Not tracked: `storage_1\`, `*.bak*`, `areaflags.map`.

## 0. Before starting
- The server must be stopped (see dayz-server-check).
- Note the new version number and read the patch notes for: storage wipe required, renamed or removed items, new events.
- Run `git status`. **If Steam overwrote mission files**, they show as modified: they're the new vanilla versions, and your edits in them are gone from the working copy. Don't commit them. Run `git stash push -m "steam-<version>-overwrite"` to put them aside and get your versions back. They're useful for step 1.

## 1. Get pristine new vanilla files
Best source: Bohemia's official Central Economy repo, `https://github.com/BohemiaInteractive/DayZ-Central-Economy`, folder `dayzOffline.chernarusplus`. It has no release tags, so use the latest `master` commit once its history mentions the new version, or pick the matching commit from `git log`. Clone it to a temp folder outside the mission. (It has no Badlands/`nasdara` folder; Badlands reference files come from `mpmissions\dayzOffline.nasdara`, which Steam keeps updated.)
- Check it against the Steam-overwritten files from step 0 if there are any (`git diff stash@{0} -- <file>` versus the clone). They should match. If GitHub isn't updated yet, wait, or build the vanilla set from Steam's fresh copies plus the previous vanilla tag for files Steam didn't touch, and tell the user that's what you did.

## 2. Record the new vanilla as its own commit
```
git branch vanilla vanilla-1.30            # first time only; later updates reuse the branch
git worktree add ../_vanilla_wt vanilla
# in ../_vanilla_wt: delete all tracked files, copy in the new vanilla files
#   (skip areaflags.map and storage_*), then:
git add -A && git commit -m "Vanilla <version> dayzOffline.chernarusplus (Bohemia stock)"
git tag vanilla-<version>
git worktree remove ../_vanilla_wt
```
`git diff vanilla-1.30 vanilla-<version> --stat` now shows exactly what Bohemia changed. Summarise it for the user before merging.

## 3. Merge into main
`git merge vanilla -m "Merge vanilla <version>"`

- **No conflicts:** Bohemia's changes landed wherever you hadn't edited, and your edits stayed. Still do the review in step 4.
- **Conflicts:** resolve **by entry, not by line**. A git line conflict in `types.xml` usually means both sides touched the same `<type>`.
  For each conflicted entry (`<type name>`, `<event name>`, `<group name>`, spawnable `<type name>`, proto `<group name>`), compare three versions: old vanilla (`vanilla-<old>`), new vanilla, and yours (`main` before the merge).
  - yours == old vanilla → take new vanilla
  - new vanilla == old vanilla → keep yours
  - both changed → **list it for the user** with all three values, and suggest an outcome (usually keep the user's tuning but adopt new fields or children). Don't guess silently.
- **If Bohemia reformatted a whole file** (huge conflict), abort (`git merge --abort`). Do a scripted three-way merge by entry name instead: parse all three versions with ElementTree, apply the rules above per entry, write new entries in Bohemia's order, keep your custom entries (the CLAUDE.md custom content table), and keep the file's indentation style. Then commit that as the merge result: `git merge -s ours --no-commit vanilla`, overwrite the files, `git commit`.
- Custom content (e.g. custom events, secondaries, territories and usage tags, ideally listed in the mission's notes) must survive. Check each item afterwards.

## 4. Review and report
1. If you keep a class list (e.g. built from the game's `config.bin` files), rebuild it and commit it.
2. Run your mission validator if you have one; otherwise start the server and check the RPT for "Type does not exist". Bohemia sometimes renames items.
3. Report to the user:
   - new classes in Bohemia's types (names in new vanilla types not in old) and whether they now spawn in the mission
   - classes Bohemia removed that the mission still references
   - new or changed vanilla events and spawn points
   - each "both changed" entry and how it was resolved
   - notes that need updating (e.g. game version and new traps in a CLAUDE.md)
4. `areaflags.map` and the `mapgroupcluster*.xml` files: if Steam updated them in place, nothing to do. If the mission ever moves to a renamed folder, copy the new ones over.

## 5. Mods and keys
Workshop updates don't reach the server copies.
- For each mod in the start script (e.g. `@CF`, `@VPPAdminTools`), compare `meta.cpp` `timestamp` in `steamapps\workshop\content\221100\<id>\` with `DayZServer\@<Mod>\meta.cpp`.
- If they differ, replace the whole `@<Mod>` folder with the workshop copy (remove old files first, so dropped PBOs don't linger), and copy its `keys\*.bikey` into `DayZServer\keys\`.
- Mod and game versions must match the client, or players get kicked. The DayZ Launcher's "Setup DLCs and mods and join" fixes the client side.

## 6. Test
Use dayz-server-check. Wipe `storage_1` only if the patch notes require it or the user asks. Check for "Type does not exist", search overtime caused by changed vanilla numbers, and that each custom event still spawns (its `[n] <EventName>` spawner lines). Then commit.

## One-off suggestion (ask before doing)
Steam may overwrite files in `dayzOffline.chernarusplus` on every update. Renaming the custom mission (e.g. `dayzOffline.chernarusplus_custom`, with `template=` in `serverDZ.cfg` changed to match) stops that. Steam then keeps a clean vanilla folder beside it, which also makes a ready-made source for step 1. Paths in CLAUDE.md, the skills and `start_server.bat` usage must be updated if this is done.
