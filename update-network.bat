@echo off
:: Plane Network Setup Script
:: Run this ONCE after connecting to WiFi to update all .env files with your current IP.
:: Run as: update-network.bat

echo Detecting WiFi IP address...

:: Get the WiFi IP
for /f "tokens=2 delims=: " %%a in ('ipconfig ^| findstr /i "IPv4" ^| findstr /v "169.254"') do (
    set "LAST_IP=%%a"
)

:: Use PowerShell for more reliable WiFi IP detection
for /f "delims=" %%a in ('powershell -NoProfile -Command "(Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.InterfaceAlias -eq 'WiFi' -and $_.IPAddress -notlike '169.*' }).IPAddress"') do set "WIFI_IP=%%a"

if "%WIFI_IP%"=="" (
    echo ERROR: Could not detect WiFi IP. Make sure you are connected to WiFi.
    pause
    exit /b 1
)

echo Detected WiFi IP: %WIFI_IP%
echo.
echo Updating all .env files...

:: --- apps\web\.env ---
(
echo VITE_API_BASE_URL="http://%WIFI_IP%:8000"
echo.
echo VITE_WEB_BASE_URL="http://%WIFI_IP%:3000"
echo.
echo VITE_ADMIN_BASE_URL="http://%WIFI_IP%:3001"
echo VITE_ADMIN_BASE_PATH="/god-mode"
echo.
echo VITE_SPACE_BASE_URL="http://%WIFI_IP%:3002"
echo VITE_SPACE_BASE_PATH="/spaces"
echo.
echo VITE_LIVE_BASE_URL="http://%WIFI_IP%:3100"
echo VITE_LIVE_BASE_PATH="/live"
) > apps\web\.env
echo [OK] apps\web\.env

:: --- apps\admin\.env ---
(
echo VITE_API_BASE_URL="http://%WIFI_IP%:8000"
echo.
echo VITE_WEB_BASE_URL="http://%WIFI_IP%:3000"
echo.
echo VITE_ADMIN_BASE_URL="http://%WIFI_IP%:3001"
echo VITE_ADMIN_BASE_PATH="/god-mode"
echo.
echo VITE_SPACE_BASE_URL="http://%WIFI_IP%:3002"
echo VITE_SPACE_BASE_PATH="/spaces"
echo.
echo VITE_LIVE_BASE_URL="http://%WIFI_IP%:3100"
echo VITE_LIVE_BASE_PATH="/live"
) > apps\admin\.env
echo [OK] apps\admin\.env

:: --- apps\space\.env ---
(
echo VITE_API_BASE_URL="http://%WIFI_IP%:8000"
echo.
echo VITE_WEB_BASE_URL="http://%WIFI_IP%:3000"
echo.
echo VITE_ADMIN_BASE_URL="http://%WIFI_IP%:3001"
echo VITE_ADMIN_BASE_PATH="/god-mode"
echo.
echo VITE_SPACE_BASE_URL="http://%WIFI_IP%:3002"
echo VITE_SPACE_BASE_PATH="/spaces"
echo.
echo VITE_LIVE_BASE_URL="http://%WIFI_IP%:3100"
echo VITE_LIVE_BASE_PATH="/live"
) > apps\space\.env
echo [OK] apps\space\.env

:: --- apps\live\.env ---
(
echo PORT=3100
echo API_BASE_URL="http://%WIFI_IP%:8000"
echo.
echo WEB_BASE_URL="http://%WIFI_IP%:3000"
echo.
echo LIVE_BASE_URL="http://%WIFI_IP%:3100"
echo LIVE_BASE_PATH="/live"
echo.
echo LIVE_SERVER_SECRET_KEY="secret-key"
echo.
echo REDIS_PORT=6379
echo REDIS_HOST=localhost
echo REDIS_URL="redis://localhost:6379/"
echo.
echo CORS_ALLOWED_ORIGINS="http://%WIFI_IP%:3000,http://%WIFI_IP%:3001,http://%WIFI_IP%:3002,http://localhost:3000,http://localhost:3001,http://localhost:3002"
) > apps\live\.env
echo [OK] apps\live\.env

:: --- apps\api\.env (only update IP references, preserve other settings) ---
powershell -NoProfile -Command "(Get-Content apps\api\.env) -replace '192\.\d+\.\d+\.\d+', '%WIFI_IP%' | Set-Content apps\api\.env"
echo [OK] apps\api\.env

echo.
echo ============================================
echo  All .env files updated to IP: %WIFI_IP%
echo ============================================
echo.
echo Next steps:
echo   1. docker compose -f docker-compose-local.yml up -d
echo   2. pnpm dev
echo.
echo Then open on other laptop: http://%WIFI_IP%:3000
echo.
pause
