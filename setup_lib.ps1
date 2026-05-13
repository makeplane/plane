$ErrorActionPreference = "Stop"

$script:RepoRoot = if ($PSScriptRoot) { $PSScriptRoot } else { (Get-Location).Path }

function Resolve-RepoPath {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Path
    )

    if ([System.IO.Path]::IsPathRooted($Path)) {
        return $Path
    }

    return Join-Path $script:RepoRoot $Path
}

function Write-Status {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Message,
        [string]$Color = "White"
    )

    Write-Host $Message -ForegroundColor $Color
}

function Copy-EnvFile {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Source,
        [Parameter(Mandatory = $true)]
        [string]$Destination
    )

    if (-not (Test-Path -LiteralPath $Source -PathType Leaf)) {
        Write-Host -NoNewline "[X] " -ForegroundColor Red
        Write-Host "Source file $Source does not exist."
        return $false
    }

    $destinationParent = Split-Path -Parent $Destination
    if (-not [string]::IsNullOrWhiteSpace($destinationParent)) {
        New-Item -ItemType Directory -Path $destinationParent -Force | Out-Null
    }

    Copy-Item -LiteralPath $Source -Destination $Destination -Force

    if ($?) {
        Write-Host -NoNewline "[OK] " -ForegroundColor Green
        Write-Host "Copied $Destination"
        return $true
    }

    Write-Host -NoNewline "[X] " -ForegroundColor Red
    Write-Host "Failed to copy $Destination"
    return $false
}

function Add-Utf8NoBomLine {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Path,
        [Parameter(Mandatory = $true)]
        [string]$Line
    )

    $fullPath = [System.IO.Path]::GetFullPath($Path)
    $parent = [System.IO.Path]::GetDirectoryName($fullPath)
    if (-not [string]::IsNullOrWhiteSpace($parent)) {
        [System.IO.Directory]::CreateDirectory($parent) | Out-Null
    }

    $encoding = New-Object System.Text.UTF8Encoding -ArgumentList $false
    [System.IO.File]::AppendAllText($fullPath, $Line + [Environment]::NewLine, $encoding)
}

function New-SecretKey {
    $chars = "abcdefghijklmnopqrstuvwxyz0123456789"
    $bytes = New-Object byte[] 50
    $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()

    try {
        $rng.GetBytes($bytes)
    } finally {
        $rng.Dispose()
    }

    $secretChars = foreach ($byte in $bytes) {
        $chars[[int]($byte % $chars.Length)]
    }

    return -join $secretChars
}

Write-Host "======================================================================" -ForegroundColor Blue
Write-Host "                   Plane - Project Management Tool                    " -ForegroundColor Blue
Write-Host "======================================================================" -ForegroundColor Blue
Write-Host "Setting up your development environment..."
Write-Host ""

$env:LC_ALL = "C"
$env:LC_CTYPE = "C"

Write-Status "Setting up environment files..." Yellow

$services = @("", "web", "api", "space", "admin", "live")
$success = $true

foreach ($service in $services) {
    if ([string]::IsNullOrEmpty($service)) {
        $prefix = "."
    } else {
        $prefix = Join-Path "apps" $service
    }

    $source = Resolve-RepoPath (Join-Path $prefix ".env.example")
    $destination = Resolve-RepoPath (Join-Path $prefix ".env")

    if (-not (Copy-EnvFile $source $destination)) {
        $success = $false
    }
}

$apiEnvPath = Resolve-RepoPath (Join-Path (Join-Path "apps" "api") ".env")
if (Test-Path -LiteralPath $apiEnvPath -PathType Leaf) {
    Write-Host ""
    Write-Status "Generating Django SECRET_KEY..." Yellow
    $secretKey = New-SecretKey

    if ([string]::IsNullOrWhiteSpace($secretKey)) {
        Write-Status "Error: Failed to generate SECRET_KEY." Red
        $success = $false
    } else {
        Add-Utf8NoBomLine -Path $apiEnvPath -Line "SECRET_KEY=`"$secretKey`""
        Write-Host -NoNewline "[OK] " -ForegroundColor Green
        Write-Host "Added SECRET_KEY to apps/api/.env"
    }

    $liveSecretKey = New-SecretKey
    Add-Utf8NoBomLine -Path $apiEnvPath -Line "LIVE_SERVER_SECRET_KEY=`"$liveSecretKey`""
    Write-Host -NoNewline "[OK] " -ForegroundColor Green
    Write-Host "Added LIVE_SERVER_SECRET_KEY to apps/api/.env"
} else {
    Write-Host -NoNewline "[X] " -ForegroundColor Red
    Write-Host "apps/api/.env not found. SECRET_KEY not added."
    $success = $false
}

Push-Location $script:RepoRoot
try {
    & corepack enable pnpm
    if ($LASTEXITCODE -ne 0) {
        $success = $false
    }

    & pnpm install
    if ($LASTEXITCODE -ne 0) {
        $success = $false
    }
} finally {
    Pop-Location
}

Write-Host ""
Write-Status "Setup status:" Yellow

if ($success) {
    Write-Host -NoNewline "[OK] " -ForegroundColor Green
    Write-Host "Environment setup completed successfully!"
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor White
    Write-Host "1. Review the .env files in each folder if needed"
    Write-Host "2. Start the services with: .\setup.ps1 start"
    Write-Host ""
    Write-Status "Happy coding!" Green
} else {
    Write-Host -NoNewline "[X] " -ForegroundColor Red
    Write-Host "Some issues occurred during setup. Please check the errors above."
    Write-Host ""
    Write-Host "Check the local setup scripts and Docker logs for details." -ForegroundColor Blue
    exit 1
}
