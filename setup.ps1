param(
    [Parameter(ValueFromRemainingArguments = $true)]
    [string[]]$CommandArgs
)

$ErrorActionPreference = "Stop"

$script:RepoRoot = if ($PSScriptRoot) { $PSScriptRoot } else { (Get-Location).Path }
$script:ComposeFilePath = Join-Path $script:RepoRoot "docker-compose.yml"
$script:RootEnvPath = Join-Path $script:RepoRoot ".env"
$script:RootEnvExamplePath = Join-Path $script:RepoRoot ".env.example"
$script:PlaneEnvPath = Join-Path $script:RepoRoot "plane.env"
$script:ApiEnvPath = Join-Path $script:RepoRoot "apps\api\.env"
$script:ApiEnvExamplePath = Join-Path $script:RepoRoot "apps\api\.env.example"
$script:BackupRoot = Join-Path $script:RepoRoot "backup"

$script:ComposeExecutable = $null
$script:ComposePrefixArgs = @()
$script:LastComposeExitCode = 0

function Print-Header {
    try {
        Clear-Host
    } catch {
        # Non-interactive PowerShell hosts may not expose a clearable console.
    }

    @'
--------------------------------------------
 ____  _                          /////////
|  _ \| | __ _ _ __   ___         /////////
| |_) | |/ _` | '_ \ / _ \   /////    /////
|  __/| | (_| | | | |  __/   /////    /////
|_|   |_|\__,_|_| |_|\___|        ////
                                  ////
--------------------------------------------
Local Plane build from this repository
--------------------------------------------
'@ | Write-Host
}

function Initialize-ComposeCommand {
    if (Get-Command docker-compose -ErrorAction SilentlyContinue) {
        $script:ComposeExecutable = "docker-compose"
        $script:ComposePrefixArgs = @()
    } else {
        $script:ComposeExecutable = "docker"
        $script:ComposePrefixArgs = @("compose")
    }
}

function Invoke-Compose {
    param(
        [Parameter(Mandatory = $true)]
        [string[]]$Arguments
    )

    Push-Location $script:RepoRoot
    try {
        $allArgs = @($script:ComposePrefixArgs + $Arguments)
        & $script:ComposeExecutable @allArgs
        $script:LastComposeExitCode = $LASTEXITCODE
    } finally {
        Pop-Location
    }
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

function Get-EnvValue {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Key,
        [Parameter(Mandatory = $true)]
        [string]$File
    )

    if (-not (Test-Path -LiteralPath $File -PathType Leaf)) {
        return ""
    }

    $escapedKey = [regex]::Escape($Key)
    $line = @(Get-Content -LiteralPath $File) | Where-Object { $_ -match "^$escapedKey=" } | Select-Object -First 1
    if (-not $line) {
        return ""
    }

    return $line.Substring($Key.Length + 1).Trim('"')
}

function Update-EnvFile {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Key,
        [AllowEmptyString()]
        [string]$Value,
        [Parameter(Mandatory = $true)]
        [string]$File
    )

    if (-not (Test-Path -LiteralPath $File -PathType Leaf)) {
        throw "File not found: $File"
    }

    $lines = @(Get-Content -LiteralPath $File)
    $escapedKey = [regex]::Escape($Key)
    $found = $false

    for ($idx = 0; $idx -lt $lines.Count; $idx++) {
        if ($lines[$idx] -match "^$escapedKey=") {
            $lines[$idx] = "$Key=$Value"
            $found = $true
        }
    }

    if (-not $found) {
        $lines += "$Key=$Value"
    }

    $encoding = New-Object System.Text.UTF8Encoding -ArgumentList $false
    [System.IO.File]::WriteAllLines([System.IO.Path]::GetFullPath($File), $lines, $encoding)
}

function Initialize-LocalEnvFiles {
    if (-not (Test-Path -LiteralPath $script:ComposeFilePath -PathType Leaf)) {
        throw "docker-compose.yml not found at $($script:ComposeFilePath)"
    }

    if (-not (Test-Path -LiteralPath $script:RootEnvPath -PathType Leaf)) {
        if (Test-Path -LiteralPath $script:PlaneEnvPath -PathType Leaf) {
            Copy-Item -LiteralPath $script:PlaneEnvPath -Destination $script:RootEnvPath -Force
            Write-Host "Created .env from plane.env"
        } elseif (Test-Path -LiteralPath $script:RootEnvExamplePath -PathType Leaf) {
            Copy-Item -LiteralPath $script:RootEnvExamplePath -Destination $script:RootEnvPath -Force
            Write-Host "Created .env from .env.example"
        } else {
            throw "Neither .env, plane.env, nor .env.example exists in $($script:RepoRoot)"
        }
    }

    if (-not (Test-Path -LiteralPath $script:ApiEnvPath -PathType Leaf)) {
        if (Test-Path -LiteralPath $script:ApiEnvExamplePath -PathType Leaf) {
            Copy-Item -LiteralPath $script:ApiEnvExamplePath -Destination $script:ApiEnvPath -Force
            Write-Host "Created apps/api/.env from apps/api/.env.example"
        } else {
            throw "apps/api/.env does not exist and apps/api/.env.example was not found"
        }
    }

    $secretKey = Get-EnvValue "SECRET_KEY" $script:ApiEnvPath
    if ([string]::IsNullOrWhiteSpace($secretKey)) {
        Add-Utf8NoBomLine -Path $script:ApiEnvPath -Line "SECRET_KEY=`"$(New-SecretKey)`""
        Write-Host "Added SECRET_KEY to apps/api/.env"
    }

    $liveSecretKey = Get-EnvValue "LIVE_SERVER_SECRET_KEY" $script:ApiEnvPath
    if ([string]::IsNullOrWhiteSpace($liveSecretKey)) {
        Add-Utf8NoBomLine -Path $script:ApiEnvPath -Line "LIVE_SERVER_SECRET_KEY=`"$(New-SecretKey)`""
        Write-Host "Added LIVE_SERVER_SECRET_KEY to apps/api/.env"
    }
}

function Get-ComposeBaseArgs {
    return @("-f", $script:ComposeFilePath, "--env-file", $script:RootEnvPath)
}

function Build-LocalImages {
    param(
        [bool]$NoCache = $false
    )

    $builds = @(
        @{
            Name = "proxy"
            Tags = @("plane-proxy")
            Context = Join-Path $script:RepoRoot "apps\proxy"
            Dockerfile = Join-Path $script:RepoRoot "apps\proxy\Dockerfile.ce"
        },
        @{
            Name = "backend"
            Tags = @("plane-api", "plane-worker", "plane-beat-worker", "plane-migrator")
            Context = Join-Path $script:RepoRoot "apps\api"
            Dockerfile = Join-Path $script:RepoRoot "apps\api\Dockerfile.api"
        },
        @{
            Name = "web"
            Tags = @("plane-web")
            Context = $script:RepoRoot
            Dockerfile = Join-Path $script:RepoRoot "apps\web\Dockerfile.web"
        },
        @{
            Name = "admin"
            Tags = @("plane-admin")
            Context = $script:RepoRoot
            Dockerfile = Join-Path $script:RepoRoot "apps\admin\Dockerfile.admin"
        },
        @{
            Name = "space"
            Tags = @("plane-space")
            Context = $script:RepoRoot
            Dockerfile = Join-Path $script:RepoRoot "apps\space\Dockerfile.space"
        },
        @{
            Name = "live"
            Tags = @("plane-live")
            Context = $script:RepoRoot
            Dockerfile = Join-Path $script:RepoRoot "apps\live\Dockerfile.live"
        }
    )

    $env:DOCKER_BUILDKIT = "1"

    foreach ($build in $builds) {
        Write-Host ""
        Write-Host "***** BUILDING $($build.Name) *****"

        $buildArgs = @("build", "--progress=plain", "--build-arg", "DOCKER_BUILDKIT=1")
        if ($NoCache) {
            $buildArgs += "--no-cache"
        }

        foreach ($tag in $build.Tags) {
            $buildArgs += @("-t", $tag)
        }

        $buildArgs += @("-f", $build.Dockerfile, $build.Context)

        & docker @buildArgs
        if ($LASTEXITCODE -ne 0) {
            throw "Local Docker image build failed for '$($build.Name)'."
        }
    }
}

function Install-Plane {
    Write-Host "Building Plane Docker images from the current repository..."
    Write-Host "Repository: $($script:RepoRoot)"
    Write-Host ""

    Initialize-LocalEnvFiles
    Build-LocalImages

    Write-Host ""
    Write-Host "Local Plane images were built successfully."
    Write-Host "Start the project with: .\setup.ps1 start"
    Write-Host ""
}

function Start-Services {
    Initialize-LocalEnvFiles
    Build-LocalImages

    Invoke-Compose -Arguments @((Get-ComposeBaseArgs) + @("up", "-d", "--no-build", "--force-recreate"))
    if ($script:LastComposeExitCode -ne 0) {
        exit $script:LastComposeExitCode
    }

    $migratorContainerId = (& docker container ls -aq -f "name=plane-migrator" | Select-Object -First 1)
    if (-not [string]::IsNullOrWhiteSpace($migratorContainerId)) {
        $idx = 0
        while ((& docker inspect --format="{{.State.Status}}" $migratorContainerId 2>$null) -eq "running") {
            $dots = "." * $idx
            Write-Host -NoNewline "`r>> Waiting for Data Migration to finish$dots"
            $idx++
            Start-Sleep -Seconds 1
        }

        Write-Host "`r                                                        `r" -NoNewline
        $migratorExitCode = [int](& docker inspect --format="{{.State.ExitCode}}" $migratorContainerId)
        if ($migratorExitCode -ne 0) {
            Write-Host "Plane Server failed to start"
            Write-Host ""
            Write-Host "Please check the logs for the migrator service and resolve the issue."
            Write-Host "Logs: .\setup.ps1 logs migrator"
            exit 1
        }

        Write-Host "   Data Migration completed successfully"
    }

    $apiContainerId = (& docker container ls -q -f "name=api" | Select-Object -First 1)
    if ([string]::IsNullOrWhiteSpace($apiContainerId)) {
        Write-Host "   API container was not found. Check service status with: .\setup.ps1 status"
        exit 1
    }

    $apiReady = $true
    $maxWaitTime = 300
    $startTime = [DateTimeOffset]::Now.ToUnixTimeSeconds()
    $idx = 0

    Write-Host "   Waiting for API Service to be ready..."
    while ($true) {
        & docker exec $apiContainerId python3 -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/', timeout=3)" *> $null
        if ($LASTEXITCODE -eq 0) {
            break
        }

        $elapsedTime = [DateTimeOffset]::Now.ToUnixTimeSeconds() - $startTime
        if ($elapsedTime -gt $maxWaitTime) {
            Write-Host ""
            Write-Host "   API Service health check timed out after 5 minutes."
            $apiReady = $false
            break
        }

        $dots = "." * $idx
        Write-Host -NoNewline "`r>> Waiting for API Service to Start ($($elapsedTime)s)$dots"
        $idx++
        Start-Sleep -Seconds 1
    }

    Write-Host "`r                                                        `r" -NoNewline
    if ($apiReady) {
        Write-Host "   API Service started successfully"
    } else {
        Write-Host "   API Service did not respond to health-check - please verify manually."
    }

    Write-Host "   Plane Server started successfully"
    Write-Host ""
    Write-Host "   Web:   http://localhost"
    Write-Host "   Admin: http://localhost/god-mode/"
    Write-Host ""
}

function Stop-Services {
    Initialize-LocalEnvFiles
    Invoke-Compose -Arguments @((Get-ComposeBaseArgs) + @("down"))
}

function Restart-Services {
    Stop-Services
    Start-Services
}

function Rebuild-Services {
    Initialize-LocalEnvFiles
    Write-Host "Rebuilding local images without cache..."
    Build-LocalImages -NoCache $true
}

function View-SpecificLogs {
    param(
        [Parameter(Mandatory = $true)]
        [string]$ServiceName
    )

    Initialize-LocalEnvFiles
    Invoke-Compose -Arguments @((Get-ComposeBaseArgs) + @("logs", "-f", $ServiceName))
}

function View-Logs {
    param(
        [string]$ServiceName
    )

    if ([string]::IsNullOrWhiteSpace($ServiceName)) {
        Write-Host "Usage: .\setup.ps1 logs <service>"
        Write-Host "Services: web, admin, space, api, worker, beat-worker, migrator, proxy, redis, postgres, minio, rabbitmq"
        return
    }

    switch ($ServiceName.ToLowerInvariant()) {
        "web" { View-SpecificLogs "web" }
        "admin" { View-SpecificLogs "admin" }
        "space" { View-SpecificLogs "space" }
        "api" { View-SpecificLogs "api" }
        "worker" { View-SpecificLogs "worker" }
        "beat-worker" { View-SpecificLogs "beat-worker" }
        "migrator" { View-SpecificLogs "migrator" }
        "proxy" { View-SpecificLogs "proxy" }
        "redis" { View-SpecificLogs "plane-redis" }
        "postgres" { View-SpecificLogs "plane-db" }
        "minio" { View-SpecificLogs "plane-minio" }
        "rabbitmq" { View-SpecificLogs "plane-mq" }
        default { Write-Host "INVALID SERVICE NAME SUPPLIED" }
    }
}

function Backup-ContainerDir {
    param(
        [Parameter(Mandatory = $true)]
        [string]$BackupFolder,
        [Parameter(Mandatory = $true)]
        [string]$ContainerName,
        [Parameter(Mandatory = $true)]
        [string]$ContainerDataDir,
        [Parameter(Mandatory = $true)]
        [string]$ServiceFolder
    )

    Write-Host "Backing up $ContainerName data..."
    $containerId = (& docker compose -f $script:ComposeFilePath ps -q $ContainerName)
    if ([string]::IsNullOrWhiteSpace($containerId)) {
        Write-Host "Error: $ContainerName container not found. Make sure the services are running."
        return $false
    }

    $targetDir = Join-Path $BackupFolder $ServiceFolder
    New-Item -ItemType Directory -Path $targetDir -Force | Out-Null

    & docker cp "$($containerId):$ContainerDataDir/." $targetDir
    if ($LASTEXITCODE -ne 0) {
        Remove-Item -LiteralPath $targetDir -Recurse -Force
        return $false
    }

    Compress-Archive -LiteralPath $targetDir -DestinationPath (Join-Path $BackupFolder "$ServiceFolder.zip") -Force
    Remove-Item -LiteralPath $targetDir -Recurse -Force
    return $true
}

function Backup-Data {
    Initialize-LocalEnvFiles
    $datetime = Get-Date -Format "yyyyMMdd-HHmm"
    $backupFolder = Join-Path $script:BackupRoot $datetime
    New-Item -ItemType Directory -Path $backupFolder -Force | Out-Null

    if (-not (Backup-ContainerDir $backupFolder "plane-db" "/var/lib/postgresql/data" "pgdata")) { exit 1 }
    if (-not (Backup-ContainerDir $backupFolder "plane-minio" "/export" "uploads")) { exit 1 }
    if (-not (Backup-ContainerDir $backupFolder "plane-mq" "/var/lib/rabbitmq" "rabbitmq_data")) { exit 1 }
    if (-not (Backup-ContainerDir $backupFolder "plane-redis" "/data" "redisdata")) { exit 1 }

    Write-Host ""
    Write-Host "Backup completed successfully. Backup files are stored in $backupFolder"
    Write-Host ""
}

function Show-Status {
    Initialize-LocalEnvFiles
    Invoke-Compose -Arguments @((Get-ComposeBaseArgs) + @("ps"))
}

function Show-Help {
    Write-Host "Usage: .\setup.ps1 <action>"
    Write-Host ""
    Write-Host "Actions:"
    Write-Host "  install, build     Build local Docker images from this repository"
    Write-Host "  start, up          Build local images and start services"
    Write-Host "  stop, down         Stop services"
    Write-Host "  restart            Restart services"
    Write-Host "  rebuild            Rebuild local images without cache"
    Write-Host "  logs <service>     Follow logs for a service"
    Write-Host "  backup             Backup service data"
    Write-Host "  status, ps         Show compose status"
}

function Invoke-Action {
    param(
        [string[]]$Args
    )

    $action = if ($Args.Count -gt 0) { $Args[0].ToLowerInvariant() } else { "start" }

    switch ($action) {
        "install" { Install-Plane }
        "build" { Install-Plane }
        "start" { Start-Services }
        "up" { Start-Services }
        "stop" { Stop-Services }
        "down" { Stop-Services }
        "restart" { Restart-Services }
        "rebuild" { Rebuild-Services }
        "logs" { View-Logs ($Args | Select-Object -Skip 1 -First 1) }
        "backup" { Backup-Data }
        "status" { Show-Status }
        "ps" { Show-Status }
        "help" { Show-Help }
        "--help" { Show-Help }
        "-h" { Show-Help }
        default {
            Write-Host "INVALID ACTION SUPPLIED: $action"
            Show-Help
            exit 1
        }
    }
}

Initialize-ComposeCommand
Print-Header
Invoke-Action $CommandArgs
