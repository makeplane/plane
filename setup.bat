@echo off
setlocal EnableExtensions EnableDelayedExpansion

REM Plane Project Setup Script (Windows CMD)
REM This script prepares the local development environment by setting up all necessary .env files
REM https://github.com/makeplane/plane

REM Enable ANSI colors when supported
for /f "delims=" %%E in ('echo prompt $E^| cmd') do set "ESC=%%E"
set "GREEN=%ESC%[32m"
set "BLUE=%ESC%[34m"
set "YELLOW=%ESC%[33m"
set "RED=%ESC%[31m"
set "BOLD=%ESC%[1m"
set "NC=%ESC%[0m"

set "SUCCESS=true"

echo %BOLD%%BLUE%━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━%NC%
echo %BOLD%%BLUE%                   Plane - Project Management Tool                    %NC%
echo %BOLD%%BLUE%━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━%NC%
echo %BOLD%Setting up your development environment...%NC%
echo.

echo %YELLOW%Setting up environment files...%NC%

call :copy_env_file ".\.env.example" ".\.env"
call :copy_env_file ".\apps\web\.env.example" ".\apps\web\.env"
call :copy_env_file ".\apps\api\.env.example" ".\apps\api\.env"
call :copy_env_file ".\apps\space\.env.example" ".\apps\space\.env"
call :copy_env_file ".\apps\admin\.env.example" ".\apps\admin\.env"
call :copy_env_file ".\apps\live\.env.example" ".\apps\live\.env"

if exist ".\apps\api\.env" (
    echo.
    echo %YELLOW%Generating Django SECRET_KEY...%NC%
    for /f "usebackq delims=" %%K in (`powershell -NoProfile -Command "$chars='abcdefghijklmnopqrstuvwxyz0123456789'.ToCharArray(); -join (1..50 ^| ForEach-Object { $chars[(Get-Random -Minimum 0 -Maximum $chars.Length)] })"`) do set "SECRET_KEY=%%K"

    if not defined SECRET_KEY (
        echo %RED%Error: Failed to generate SECRET_KEY.%NC%
        set "SUCCESS=false"
    ) else (
        >> ".\apps\api\.env" echo SECRET_KEY="!SECRET_KEY!"
        echo %GREEN%√%NC% Added SECRET_KEY to apps/api/.env
    )
) else (
    echo %RED%x%NC% apps/api/.env not found. SECRET_KEY not added.
    set "SUCCESS=false"
)

call corepack enable pnpm
if errorlevel 1 set "SUCCESS=false"

call pnpm install
if errorlevel 1 set "SUCCESS=false"

echo.
echo %YELLOW%Setup status:%NC%
if /I "%SUCCESS%"=="true" (
    echo %GREEN%√%NC% Environment setup completed successfully!
    echo.
    echo %BOLD%Next steps:%NC%
    echo 1. Review the .env files in each folder if needed
    echo 2. Start the services with: docker compose -f docker-compose-local.yml up -d
    echo.
    echo %GREEN%Happy coding! 🚀%NC%
    exit /b 0
) else (
    echo %RED%x%NC% Some issues occurred during setup. Please check the errors above.
    echo.
    echo For help, visit: %BLUE%https://github.com/makeplane/plane%NC%
    exit /b 1
)

:copy_env_file
set "SOURCE=%~1"
set "DESTINATION=%~2"

if not exist "%SOURCE%" (
    echo %RED%Error: Source file %SOURCE% does not exist.%NC%
    set "SUCCESS=false"
    goto :eof
)

copy /Y "%SOURCE%" "%DESTINATION%" >nul
if errorlevel 1 (
    echo %RED%x%NC% Failed to copy %DESTINATION%
    set "SUCCESS=false"
) else (
    echo %GREEN%√%NC% Copied %DESTINATION%
)
goto :eof
