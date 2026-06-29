# Hangar — frontend dev launcher
# Portable Node 22 ko is session ke PATH mein daalta hai (system PATH ko nahi chherta),
# phir saari frontend apps (web/admin/space/live) start karta hai.
#
# Usage:  powershell -ExecutionPolicy Bypass -File .\dev.ps1
#   ya:   .\dev.ps1   (agar execution policy allow kare)

$ErrorActionPreference = "Stop"
$NodeDir = "D:\dev-ledger\node22"

if (-not (Test-Path "$NodeDir\node.exe")) {
    Write-Host "Node 22 nahi mila: $NodeDir" -ForegroundColor Red
    Write-Host "Portable Node 22 wahan extract karein, ya path is script mein update karein." -ForegroundColor Yellow
    exit 1
}

$env:PATH = "$NodeDir;" + $env:PATH
$env:HUSKY = "0"                                  # git hooks install skip karo (dev ke liye zaroori nahi)
$env:npm_config_verify_deps_before_run = "false"  # har script pe dobara install na karo
Write-Host "Using Node $(node --version)" -ForegroundColor Green
Write-Host "Starting Hangar frontend (web:3000, admin:3001, space:3002, live:3100)..." -ForegroundColor Cyan

pnpm dev
