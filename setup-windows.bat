@echo off
REM Plane Project Setup Script for Windows (Batch)
REM This is a simple launcher that calls the PowerShell script
REM https://github.com/makeplane/plane

setlocal enabledelayedexpansion

echo.
echo ===============================================================================
echo                    Plane - Project Management Tool
echo ===============================================================================
echo.

REM Check if PowerShell is available
where powershell >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] PowerShell not found. Please install PowerShell.
    echo.
    pause
    exit /b 1
)

echo Starting PowerShell setup script...
echo.

REM Run the PowerShell script with execution policy bypass
powershell -ExecutionPolicy Bypass -File "%~dp0setup-windows.ps1"

if %ERRORLEVEL% neq 0 (
    echo.
    echo [ERROR] Setup failed. Please check the errors above.
    echo.
    pause
    exit /b 1
)

echo.
pause
