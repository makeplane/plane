@echo off
REM uninstall.cmd -- remove the chrome-profile shim and (optionally) the user
REM config on Windows. Mirrors uninstall.sh.
REM
REM What this removes:
REM   - %PREFIX%\bin\chrome-profile.cmd (the shim install.cmd wrote)
REM   - %APPDATA%\chrome-profile\profiles.json (only with /purge)
REM
REM What this does NOT remove:
REM   - The skill files themselves under %USERPROFILE%\.agents\skills\.
REM     Use `npx skills remove chrome-profile` for that.
REM   - Chrome data, cookies, or any profile.
REM
REM Usage:
REM   uninstall.cmd            remove shim only (config preserved)
REM   uninstall.cmd /purge     also delete profiles.json under %APPDATA%

setlocal

if "%PREFIX%"=="" set "PREFIX=%USERPROFILE%\.local"
set "BIN_DIR=%PREFIX%\bin"
set "SHIM=%BIN_DIR%\chrome-profile.cmd"

set "PURGE=0"
if /I "%~1"=="/purge" set "PURGE=1"
if /I "%~1"=="--purge" set "PURGE=1"
if /I "%~1"=="-p" set "PURGE=1"

if exist "%SHIM%" (
  del /F /Q "%SHIM%" >nul
  echo [+] removed shim: %SHIM%
) else (
  echo [=] no shim at %SHIM% ^(already removed?^)
)

REM Python's XDG fallback on Windows is %APPDATA% via Path.home()/.config; the
REM CLI uses ~/.config too, but on Windows that resolves to %USERPROFILE%\.config.
set "CFG_DIR=%USERPROFILE%\.config\chrome-profile"
if "%PURGE%"=="1" (
  if exist "%CFG_DIR%" (
    rmdir /S /Q "%CFG_DIR%"
    echo [+] purged config: %CFG_DIR%
  ) else (
    echo [=] no config dir at %CFG_DIR%
  )
) else (
  if exist "%CFG_DIR%" echo [*] preserved config: %CFG_DIR%  ^(use /purge to remove^)
)

echo.
echo [*] To also remove the skill files, run:
echo     npx skills remove chrome-profile
endlocal
