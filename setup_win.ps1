# Plane Project Setup Script for Windows 11
# This script prepares the local development environment by setting up all necessary .env files
# Usage: Right-click > "Run with PowerShell" or execute: powershell -ExecutionPolicy Bypass -File setup_win.ps1

$ErrorActionPreference = "Continue"
$success = $true

# Print header
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Blue
Write-Host "                   Plane - Project Management Tool                    " -ForegroundColor Blue
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Blue
Write-Host "Setting up your development environment...`n"

# Function to handle file copying with error checking
function Copy-EnvFile {
    param(
        [string]$Source,
        [string]$Destination
    )
    if (-not (Test-Path $Source)) {
        Write-Host "X Error: Source file $Source does not exist." -ForegroundColor Red
        return $false
    }
    try {
        Copy-Item -Path $Source -Destination $Destination -Force
        Write-Host "  Copied $Destination" -ForegroundColor Green
        return $true
    } catch {
        Write-Host "X Failed to copy $Destination" -ForegroundColor Red
        return $false
    }
}

# Copy all environment example files
Write-Host "Setting up environment files..." -ForegroundColor Yellow
$services = @("", "web", "api", "space", "admin", "live")

foreach ($service in $services) {
    if ($service -eq "") {
        $prefix = ".\"
    } else {
        $prefix = ".\apps\$service\"
    }
    $result = Copy-EnvFile -Source "${prefix}.env.example" -Destination "${prefix}.env"
    if (-not $result) { $success = $false }
}

# Generate SECRET_KEY for Django
$apiEnv = ".\apps\api\.env"
if (Test-Path $apiEnv) {
    Write-Host "`nGenerating Django SECRET_KEY..." -ForegroundColor Yellow
    $chars = "abcdefghijklmnopqrstuvwxyz0123456789"
    $secretKey = -join (1..50 | ForEach-Object { $chars[(Get-Random -Maximum $chars.Length)] })

    if ([string]::IsNullOrEmpty($secretKey)) {
        Write-Host "X Error: Failed to generate SECRET_KEY." -ForegroundColor Red
        $success = $false
    } else {
        Add-Content -Path $apiEnv -Value "SECRET_KEY=`"$secretKey`""
        Write-Host "  Added SECRET_KEY to apps/api/.env" -ForegroundColor Green
    }
} else {
    Write-Host "X apps/api/.env not found. SECRET_KEY not added." -ForegroundColor Red
    $success = $false
}

# Activate pnpm (version set in package.json)
Write-Host "`nActivating pnpm via corepack..." -ForegroundColor Yellow
try {
    corepack enable pnpm
    Write-Host "  corepack enable pnpm succeeded" -ForegroundColor Green
} catch {
    Write-Host "X corepack enable pnpm failed: $_" -ForegroundColor Red
    $success = $false
}

# Install Node dependencies
Write-Host "`nInstalling Node dependencies..." -ForegroundColor Yellow
try {
    pnpm install
    if ($LASTEXITCODE -ne 0) { throw "pnpm install exited with code $LASTEXITCODE" }
    Write-Host "  pnpm install succeeded" -ForegroundColor Green
} catch {
    Write-Host "X pnpm install failed: $_" -ForegroundColor Red
    $success = $false
}

# Summary
Write-Host "`nSetup status:" -ForegroundColor Yellow
if ($success) {
    Write-Host "  Environment setup completed successfully!`n" -ForegroundColor Green
    Write-Host "Next steps:"
    Write-Host "1. Review the .env files in each folder if needed"
    Write-Host "2. Start the services with: docker compose -f docker-compose-local.yml up -d"
    Write-Host "`nHappy coding!" -ForegroundColor Green
} else {
    Write-Host "X Some issues occurred during setup. Please check the errors above.`n" -ForegroundColor Red
    Write-Host "For help, visit: https://github.com/makeplane/plane" -ForegroundColor Blue
    exit 1
}
