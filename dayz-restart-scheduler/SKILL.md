---
name: dayz-restart-scheduler
description: Set up DayZ server messages (welcome, tips, restart countdown) in db/messages.xml and clean automatic restarts via countdown + watchdog loop or Task Scheduler, with optional backups.
---

# DayZ messages and scheduled restarts

## db/messages.xml (Bohemia's format is the comment in the file; wiki "DayZ:Server_Messages")
| Tag | Meaning |
|---|---|
| `<text>` | the message; `#name` = server name, `#tmin` = minutes left |
| `<repeat>N</repeat>` | show every N minutes |
| `<delay>N</delay>` | first show after N minutes (after connect, with onconnect) |
| `<onconnect>1</onconnect>` | show to each player after they join |
| `<deadline>N</deadline>` | count down to N minutes **after server start** |
| `<shutdown>1</shutdown>` | with deadline: **the server shuts itself down cleanly** |

```xml
<message><delay>2</delay><onconnect>1</onconnect><text>Welcome to #name. Restarts every 4 hours.</text></message>
<message><repeat>45</repeat><text>Tip: boil water before drinking it.</text></message>
<message><deadline>240</deadline><shutdown>1</shutdown><text>#name restarts in #tmin minutes.</text></message>
```
The deadline counts from start (every N hours = N×60) and can't follow clock times. Repeat tips no more often than every 30 minutes.

## Ask
When (an interval, or clock times); the warning text and times; whether to restart automatically; whether to back up between restarts; welcome, rules, Discord link and tips.

## Methods
- **Interval:** deadline + shutdown gives warnings and a clean exit (check for the termination line). A separate watchdog `restart_loop.bat` brings it back. Copy the start script's parameters exactly; `/wait` is what makes the loop work:
```bat
@echo off
cd /d "%~dp0"
:loop
start "" /wait DayZServer_x64.exe -config=serverDZ.cfg -port=2302 -profiles=profiles "-mod=@CF;@VPPAdminTools"
rem optional backup: robocopy "mpmissions\<mission>\storage_1" "storage_backups\<stamp>" /E
timeout /t 15 /nobreak
goto loop
```
- **Clock times:** a Task Scheduler (`schtasks /Create /SC DAILY /ST 06:00 …`) PowerShell script: `(Get-Process DayZServer_x64).CloseMainWindow()` → wait up to about 3 minutes for exit → optional backup → run the start script. Pair it with `<repeat>` warnings.
- **Never** `taskkill /F`.

## Write and test
Commit first and edit messages.xml, keeping the example comment; check it parses. **Test with a 10-minute deadline first:** countdown, clean termination, loop restart. Then set the real interval. Tell the user how to stop it (close the loop window or disable the task).
