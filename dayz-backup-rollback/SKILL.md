---
name: dayz-backup-rollback
description: Back up and restore a DayZ server's saved world - scheduled storage snapshots with retention, full rollback, and restoring one character from players.db.
---

# DayZ backup and rollback
The saved world is `mpmissions\<mission>\storage_<instanceId>\` (`instanceId` is in `serverDZ.cfg`):
- `data\*.bin`, with `.001`/`.002` rotating copies
- `players.db`
- `spawnpoints.bin` (cache)
- mod folders (e.g. `communityframework\`)
- `backup\`: the server's own copies; check timestamps and don't rely on them

## Rules
- Snapshot or restore **only while the server is cleanly stopped**. A running server's files give a broken copy.
- Never restore, delete or edit storage without the user's OK. A restore rolls everyone back.
- Move the current storage aside before restoring; never delete it.

## Snapshots
- Put them outside the mission: `DayZServer\storage_backups\<mission>_<YYYY-MM-DD_HHMM>[_label]\`, with a note (date, game version, reason).
- **Manual:** stop cleanly, copy the folder, start again.
- **Scheduled:** within the restart cycle (dayz-restart-scheduler). Use `robocopy <storage> <dest> /E` between exit and start in the watchdog loop, or a Task Scheduler script that stops cleanly, waits, copies and starts.
- **Retention:** e.g. 7 daily + 4 weekly, deleting older ones automatically. Each is about 5–50 MB.

## Full rollback
Stop cleanly → move current storage to `…_before-rollback` → copy the snapshot back as `storage_<n>` → start → check the RPT (`[CE][Storage] … valid:yes`, item counts, no `Failed to read`) → tell players the snapshot time.

## One character
`players.db` is SQLite: `Players(Id INTEGER, Alive INTEGER, UID CHAR(64), Data BLOB)`. `UID` is the ADM log's `id=` hash, and `Data` holds the whole character including inventory.
1. Stop cleanly and take a fresh snapshot.
2. Find the UID in the ADM log and pick a snapshot from before the incident.
3. Copy that UID's `Alive` and `Data` from the snapshot's `players.db` into the live row. Use Node 22+ `node:sqlite`, `sqlite3`, or DB Browser for SQLite.
4. Start, and have the player check.

**Dupe risk:** if their old body still holds the gear, restoring duplicates it. Only restore for genuine bugs or faults, and log who and why.
