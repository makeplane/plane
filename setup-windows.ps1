# Plane Project Setup Script for Windows (PowerShell)
# This script prepares the local development environment by setting up all necessary .env files
# https://github.com/makeplane/plane

# Requires PowerShell 5.1 or higher
#Requires -Version 5.1

# Set error action preference
$ErrorActionPreference = "Stop"

# Print header
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Blue
Write-Host "                   Plane - Project Management Tool                    " -ForegroundColor Blue
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Blue
Write-Host "Setting up your development environment..." -ForegroundColor Cyan
Write-Host ""

# Function to copy environment files
function Copy-EnvFile {
    param (
        [string]$Source,
        [string]$Destination
    )

    if (-Not (Test-Path $Source)) {
        Write-Host "✗ Error: Source file $Source does not exist." -ForegroundColor Red
        return $false
    }

    try {
        Copy-Item -Path $Source -Destination $Destination -Force
        Write-Host "✓ Copied $Destination" -ForegroundColor Green
        return $true
    }
    catch {
        Write-Host "✗ Failed to copy $Destination : $_" -ForegroundColor Red
        return $false
    }
}

# Function to generate random secret key
function New-SecretKey {
    param (
        [int]$Length = 50
    )

    $chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
    $secret = -join ((1..$Length) | ForEach-Object { Get-Random -InputObject $chars.ToCharArray() })
    return $secret
}

# Check prerequisites
Write-Host "Checking prerequisites..." -ForegroundColor Yellow
Write-Host ""

# Check Node.js
try {
    $nodeVersion = node --version
    Write-Host "✓ Node.js found: $nodeVersion" -ForegroundColor Green

    # Parse version and check if it's >= 22.18.0
    $versionMatch = $nodeVersion -match 'v(\d+)\.(\d+)\.(\d+)'
    if ($versionMatch) {
        $major = [int]$matches[1]
        $minor = [int]$matches[2]

        if ($major -lt 22 -or ($major -eq 22 -and $minor -lt 18)) {
            Write-Host "⚠ Warning: Node.js version should be >= 22.18.0. Current: $nodeVersion" -ForegroundColor Yellow
            Write-Host "  Download from: https://nodejs.org/" -ForegroundColor Yellow
        }
    }
}
catch {
    Write-Host "✗ Node.js not found. Please install Node.js >= 22.18.0" -ForegroundColor Red
    Write-Host "  Download from: https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

# Check Docker
try {
    $dockerVersion = docker --version
    Write-Host "✓ Docker found: $dockerVersion" -ForegroundColor Green
}
catch {
    Write-Host "✗ Docker not found. Please install Docker Desktop" -ForegroundColor Red
    Write-Host "  Download from: https://www.docker.com/products/docker-desktop/" -ForegroundColor Yellow
    exit 1
}

# Check if Docker is running
try {
    docker info | Out-Null
    Write-Host "✓ Docker is running" -ForegroundColor Green
}
catch {
    Write-Host "✗ Docker is not running. Please start Docker Desktop" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Setting up environment files..." -ForegroundColor Yellow
Write-Host ""

# Array of services
$services = @("", "web", "api", "space", "admin", "live")
$success = $true

# Copy environment files
foreach ($service in $services) {
    if ($service -eq "") {
        # Handle root .env file
        $prefix = ".\"
    }
    else {
        # Handle service .env files in apps folder
        $prefix = ".\apps\$service\"
    }

    $source = "${prefix}.env.example"
    $destination = "${prefix}.env"

    if (-Not (Copy-EnvFile -Source $source -Destination $destination)) {
        $success = $false
    }
}

Write-Host ""

# Generate SECRET_KEY for Django
if (Test-Path ".\apps\api\.env") {
    Write-Host "Generating Django SECRET_KEY..." -ForegroundColor Yellow

    try {
        $secretKey = New-SecretKey -Length 50

        if ($secretKey) {
            Add-Content -Path ".\apps\api\.env" -Value "`nSECRET_KEY=`"$secretKey`""
            Write-Host "✓ Added SECRET_KEY to apps\api\.env" -ForegroundColor Green
        }
        else {
            Write-Host "✗ Failed to generate SECRET_KEY" -ForegroundColor Red
            $success = $false
        }
    }
    catch {
        Write-Host "✗ Error generating SECRET_KEY: $_" -ForegroundColor Red
        $success = $false
    }
}
else {
    Write-Host "✗ apps\api\.env not found. SECRET_KEY not added." -ForegroundColor Red
    $success = $false
}

Write-Host ""

# Enable pnpm
Write-Host "Enabling pnpm..." -ForegroundColor Yellow
try {
    corepack enable
    corepack prepare pnpm@10.21.0 --activate
    $pnpmVersion = pnpm --version
    Write-Host "✓ pnpm enabled: v$pnpmVersion" -ForegroundColor Green
}
catch {
    Write-Host "✗ Failed to enable pnpm: $_" -ForegroundColor Red
    Write-Host "  Try running: corepack enable" -ForegroundColor Yellow
    $success = $false
}

Write-Host ""

# Install dependencies
if ($success) {
    Write-Host "Installing Node.js dependencies (this may take a few minutes)..." -ForegroundColor Yellow
    Write-Host ""

    try {
        pnpm install
        Write-Host ""
        Write-Host "✓ Dependencies installed successfully!" -ForegroundColor Green
    }
    catch {
        Write-Host "✗ Failed to install dependencies: $_" -ForegroundColor Red
        $success = $false
    }
}

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Blue

# Summary
if ($success) {
    Write-Host ""
    Write-Host "✓ Environment setup completed successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "1. Review the .env files in each folder if needed" -ForegroundColor White
    Write-Host "2. Start Docker services:" -ForegroundColor White
    Write-Host "   docker compose -f docker-compose-local.yml up -d" -ForegroundColor Yellow
    Write-Host "3. Start the development servers:" -ForegroundColor White
    Write-Host "   pnpm dev" -ForegroundColor Yellow
    Write-Host "4. Register as instance admin:" -ForegroundColor White
    Write-Host "   http://localhost:3001/god-mode/" -ForegroundColor Yellow
    Write-Host "5. Access the main app:" -ForegroundColor White
    Write-Host "   http://localhost:3000" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "For detailed setup instructions, see SETUP_GUIDE.md" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Happy coding! 🚀" -ForegroundColor Green
    Write-Host ""
}
else {
    Write-Host ""
    Write-Host "✗ Some issues occurred during setup. Please check the errors above." -ForegroundColor Red
    Write-Host ""
    Write-Host "For help, visit:" -ForegroundColor Yellow
    Write-Host "- Documentation: https://developers.plane.so/" -ForegroundColor Cyan
    Write-Host "- GitHub: https://github.com/makeplane/plane" -ForegroundColor Cyan
    Write-Host "- Discord: https://discord.com/invite/A92xrEGCge" -ForegroundColor Cyan
    Write-Host ""
    exit 1
}
