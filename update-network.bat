@echo off
:: Plane Network Setup Script
:: Run this ONCE to update all .env files with your current Computer Name and IP.
:: Run as: update-network.bat

echo Detecting WiFi IP address...

for /f "delims=" %%a in ('powershell -NoProfile -Command "(Get-NetIPAddress -AddressFamily IPv4 -InterfaceAlias WiFi).IPAddress"') do set "WIFI_IP=%%a"

if "%WIFI_IP%"=="" (
    echo WARNING: Could not detect WiFi IP. Using localhost as fallback.
    set "WIFI_IP=127.0.0.1"
)

:: Get lowercase computer name and set Hostname with .local suffix for reliable mDNS
for /f "delims=" %%a in ('powershell -NoProfile -Command "$env:COMPUTERNAME.ToLower()"') do set "COMPUTER_NAME=%%a"
set "HOSTNAME=%COMPUTER_NAME%.local"

echo Detected WiFi IP: %WIFI_IP%
echo Computer Name: %COMPUTER_NAME%
echo Hostname (mDNS): %HOSTNAME%
echo.
echo Updating all .env files with Hostname: %HOSTNAME%...

:: --- apps\web\.env ---
(
echo VITE_API_BASE_URL="http://%HOSTNAME%:8000"
echo.
echo VITE_WEB_BASE_URL="http://%HOSTNAME%:3000"
echo.
echo VITE_ADMIN_BASE_URL="http://%HOSTNAME%:3001"
echo VITE_ADMIN_BASE_PATH="/god-mode"
echo.
echo VITE_SPACE_BASE_URL="http://%HOSTNAME%:3002"
echo VITE_SPACE_BASE_PATH="/spaces"
echo.
echo VITE_LIVE_BASE_URL="http://%HOSTNAME%:3100"
echo VITE_LIVE_BASE_PATH="/live"
) > apps\web\.env
echo [OK] apps\web\.env

:: --- apps\admin\.env ---
(
echo VITE_API_BASE_URL="http://%HOSTNAME%:8000"
echo.
echo VITE_WEB_BASE_URL="http://%HOSTNAME%:3000"
echo.
echo VITE_ADMIN_BASE_URL="http://%HOSTNAME%:3001"
echo VITE_ADMIN_BASE_PATH="/god-mode"
echo.
echo VITE_SPACE_BASE_URL="http://%HOSTNAME%:3002"
echo VITE_SPACE_BASE_PATH="/spaces"
echo.
echo VITE_LIVE_BASE_URL="http://%HOSTNAME%:3100"
echo VITE_LIVE_BASE_PATH="/live"
) > apps\admin\.env
echo [OK] apps\admin\.env

:: --- apps\space\.env ---
(
echo VITE_API_BASE_URL="http://%HOSTNAME%:8000"
echo.
echo VITE_WEB_BASE_URL="http://%HOSTNAME%:3000"
echo.
echo VITE_ADMIN_BASE_URL="http://%HOSTNAME%:3001"
echo VITE_ADMIN_BASE_PATH="/god-mode"
echo.
echo VITE_SPACE_BASE_URL="http://%HOSTNAME%:3002"
echo VITE_SPACE_BASE_PATH="/spaces"
echo.
echo VITE_LIVE_BASE_URL="http://%HOSTNAME%:3100"
echo VITE_LIVE_BASE_PATH="/live"
) > apps\space\.env
echo [OK] apps\space\.env

:: --- apps\live\.env ---
(
echo PORT=3100
echo API_BASE_URL="http://%HOSTNAME%:8000"
echo.
echo WEB_BASE_URL="http://%HOSTNAME%:3000"
echo.
echo LIVE_BASE_URL="http://%HOSTNAME%:3100"
echo LIVE_BASE_PATH="/live"
echo.
echo LIVE_SERVER_SECRET_KEY="secret-key"
echo.
echo REDIS_PORT=6379
echo REDIS_HOST=localhost
echo REDIS_URL="redis://localhost:6379/"
echo.
echo CORS_ALLOWED_ORIGINS="http://%HOSTNAME%:3000,http://%HOSTNAME%:3001,http://%HOSTNAME%:3002,http://%COMPUTER_NAME%:3000,http://%COMPUTER_NAME%:3001,http://%COMPUTER_NAME%:3002,http://localhost:3000,http://localhost:3001,http://localhost:3002,http://%WIFI_IP%:3000,http://%WIFI_IP%:3001,http://%WIFI_IP%:3002"
) > apps\live\.env
echo [OK] apps\live\.env

:: --- apps\api\.env (only update Hostname/IP references, preserve other settings) ---
powershell -NoProfile -Command "$content = Get-Content apps\api\.env; $content = $content -replace 'CORS_ALLOWED_ORIGINS=\".*\"', 'CORS_ALLOWED_ORIGINS=\"http://localhost:3000,http://localhost:3001,http://localhost:3002,http://localhost:3100,http://%HOSTNAME%:3000,http://%HOSTNAME%:3001,http://%HOSTNAME%:3002,http://%HOSTNAME%:3100,http://%COMPUTER_NAME%:3000,http://%COMPUTER_NAME%:3001,http://%COMPUTER_NAME%:3002,http://%COMPUTER_NAME%:3100,http://%WIFI_IP%:3000,http://%WIFI_IP%:3001,http://%WIFI_IP%:3002,http://%WIFI_IP%:3100\"'; $content = $content -replace 'WEB_URL=\".*\"', 'WEB_URL=\"http://%HOSTNAME%:8000\"'; $content = $content -replace 'ADMIN_BASE_URL=\".*\"', 'ADMIN_BASE_URL=\"http://%HOSTNAME%:3001\"'; $content = $content -replace 'SPACE_BASE_URL=\".*\"', 'SPACE_BASE_URL=\"http://%HOSTNAME%:3002\"'; $content = $content -replace 'APP_BASE_URL=\".*\"', 'APP_BASE_URL=\"http://%HOSTNAME%:3000\"'; $content = $content -replace 'LIVE_BASE_URL=\".*\"', 'LIVE_BASE_URL=\"http://%HOSTNAME%:3100\"'; $content | Set-Content apps\api\.env"
echo [OK] apps\api\.env

echo.
echo ============================================
echo  All .env files updated to Hostname: %HOSTNAME%
echo  (and registered current IP: %WIFI_IP%)
echo ============================================
echo.
echo Next steps:
echo   1. docker compose -f docker-compose-local.yml up -d
echo   2. pnpm dev
echo.
echo Then open on other laptop: http://%HOSTNAME%:3000
echo.
pause
