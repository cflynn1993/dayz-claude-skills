---
name: dayz-backup-rollback
description: Back up and restore a DayZ server's saved world (storage folder) safely - scheduled snapshots with retention, full rollback after a crash or wipe mistake, and restoring a single player's character from players.db.
---

# DayZ backup and rollback

The saved world lives in `mpmissions\<mission>\storage_<instanceId>\`; the number is `instanceId` in `serverDZ.cfg`, usually `storage_1`. The mission files themselves should be in git, which is a separate job.

## What's in the storage folder
- `data\`: world items, buildings, vehicles and events (`*.bin`, with `.001`/`.002` rotating copies the server writes itself).
- `players.db`: characters (SQLite, see below).
- `spawnpoints.bin`: cached generated spawn points.
- Mod folders, e.g. `communityframework\`.
- `backup\`: the server's own rotating copies. Check their timestamps; don't rely on them as your backups.

## Golden rules
- **Snapshot or restore only while the server is stopped** (cleanly: close the console window, wait for `Termination successfully completed`). Copying a running server's files gives a half-written snapshot.
- Never edit, delete or restore storage without the user's OK. Restoring overwrites everything players did since the snapshot, which is effectively a rollback for everyone.
- Before any restore, move the current storage aside rather than deleting it.

## Snapshots
- Location: outside the mission folder, e.g. `DayZServer\storage_backups\<mission>_<YYYY-MM-DD_HHMM>[_label]\`.
- **Manual:** stop cleanly, copy the whole storage folder, start again.
- **Scheduled:** best done inside the restart cycle (see dayz-restart-scheduler): server shuts down, snapshot is taken, server starts. In a batch restart loop, add a `robocopy "<storage>" "<backups>\<stamp>" /E` step between the exit and the next start. With Task Scheduler, run a PowerShell script that stops the server cleanly, waits for the process to exit, copies, then starts it.
- **Retention:** keep for example the last 7 daily and 4 weekly copies, and delete older ones automatically. A storage folder is usually 5–50 MB.
- Write a small `README.txt` or log line with each snapshot: date, game version, and why (e.g. "before wipe", "nightly").

## Full rollback
1. Stop the server cleanly.
2. Move the current storage folder aside (e.g. `<backups>\<mission>_<stamp>_before-rollback`).
3. Copy the chosen snapshot back as `storage_<instanceId>`.
4. Start the server, and check the RPT: `[CE][Storage] … valid:yes` lines, item counts restored, no `Failed to read [Storage]`.
5. Tell players the time of the snapshot, since anything after it is gone.

## Restoring one player's character
`players.db` is SQLite with a table `Players(Id INTEGER, Alive INTEGER, UID CHAR(64), Data BLOB)`. `UID` is the same hash shown as `id=` in the ADM log, and `Data` holds the whole character, including inventory.
1. Stop the server cleanly, and make a fresh snapshot first.
2. Find the player's UID in the ADM log, and pick a snapshot from before the incident.
3. In a copy of the snapshot's `players.db`, read that UID's `Alive` and `Data`. Write them into the live `players.db` row for the same UID. Use Node 22+ `node:sqlite`, the `sqlite3` command-line tool, or DB Browser for SQLite.
4. Start the server, and have the player log in and check.
- **Dupe warning:** if the player's old body (with its gear) still exists in the world, restoring their character duplicates that gear. Check the death location first, or accept it.
- Only restore for genuine bugs or server faults, and keep a note of who was restored and why.
