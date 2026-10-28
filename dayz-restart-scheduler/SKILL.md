---
name: dayz-restart-scheduler
description: Set up DayZ server messages (welcome, recurring tips, restart countdown) in db/messages.xml and automatic clean restarts - in-game countdown with clean shutdown, a watchdog loop or Task Scheduler to bring the server back, and optional backups between restarts.
---

# DayZ messages and scheduled restarts

## db/messages.xml
Vanilla ships the format as a comment inside the file (Bohemia's wiki: "DayZ:Server_Messages"). Each `<message>` is one entry:

| Tag | Meaning |
|---|---|
| `<text>` | The message. `#name` = server name, `#tmin` = minutes left before a deadline/shutdown. |
| `<repeat>N</repeat>` | Show every N minutes. |
| `<delay>N</delay>` | First show N minutes after start (or after connect, with `onconnect`). |
| `<onconnect>1</onconnect>` | Show to each player after they join. |
| `<deadline>N</deadline>` | Count down to N minutes **after server start**, repeating the message as it gets close. |
| `<shutdown>1</shutdown>` | With `deadline`, **the server shuts itself down** at the deadline. |

Examples:
```xml
<message><delay>2</delay><onconnect>1</onconnect><text>Welcome to #name. Restarts every 4 hours.</text></message>
<message><repeat>45</repeat><text>Tip: boil water before drinking it.</text></message>
<message><deadline>240</deadline><shutdown>1</shutdown><text>#name restarts in #tmin minutes.</text></message>
```
- The deadline counts from **server start**, so restarting every N hours means `deadline` N×60. It can't target clock times (e.g. "06:00"); use Task Scheduler for that.
- Keep tips short, and don't repeat more often than every 30 minutes.

## Ask first
1. **When:** every N hours from start, or at fixed clock times (e.g. 00:00, 06:00, 12:00, 18:00)?
2. **Warning text and timing:** for example 30, 15, 5 and 1 minutes before.
3. **Bring it back automatically?** And take a backup between stop and start (see dayz-backup-rollback)?
4. **Messages:** welcome text, rules, a Discord link, recurring tips.

## Restart methods
**A. Interval restarts (in-game countdown, then a clean shutdown, then a watchdog):**
- The messages.xml `deadline` + `shutdown` gives players warnings and closes the server normally. Check the RPT ends with `Termination successfully completed`.
- A watchdog batch file starts the server again whenever it exits. Make it a separate file (e.g. `restart_loop.bat`), so the existing start script stays as it is:
```bat
@echo off
cd /d "%~dp0"
:loop
start "" /wait DayZServer_x64.exe -config=serverDZ.cfg -port=2302 -profiles=profiles "-mod=@CF;@VPPAdminTools"
rem optional: robocopy "mpmissions\<mission>\storage_1" "storage_backups\%date:~-4%-%date:~3,2%-%date:~0,2%_%time:~0,2%%time:~3,2%" /E
timeout /t 15 /nobreak
goto loop
```
  Copy the exact parameters from the existing start script. The `/wait` is what makes the loop work. The date format in the optional backup line depends on Windows' region settings, so test it.

**B. Clock-time restarts (Task Scheduler):** a PowerShell script that sends a close to the server console window (`(Get-Process DayZServer_x64).CloseMainWindow()`), waits for the process to exit (up to about 3 minutes), optionally backs up, then runs the start script. Register it with `schtasks /Create /SC DAILY /ST 06:00 …`, or in the Task Scheduler UI, for each time. Pair it with `<repeat>` warning messages, since `deadline` can't follow clock times.

Never kill the process (`taskkill /F`), which damages save files.

## Write and test
- Commit first. Edit `db/messages.xml` (keep Bohemia's example comment) and check it parses.
- **Test with a short deadline first** (e.g. 10 minutes): join, watch the countdown, confirm a clean termination and that the loop restarts it. Then set the real interval.
- Tell the user which method is active and how to stop it: close the loop window, or disable the scheduled task.
