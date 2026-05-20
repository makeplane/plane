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
$script:MailStackDir = Join-Path $script:RepoRoot "mail-stack"
$script:MailComposeFilePath = Join-Path $script:MailStackDir "docker-compose.yml"
$script:MailEnvPath = Join-Path $script:MailStackDir ".env"
$script:MailEnvExamplePath = Join-Path $script:MailStackDir ".env.example"
$script:ForgejoStackDir = Join-Path $script:RepoRoot "forgejo-stack"
$script:ForgejoComposeFilePath = Join-Path $script:ForgejoStackDir "docker-compose.yml"
$script:ForgejoEnvPath = Join-Path $script:ForgejoStackDir ".env"
$script:ForgejoEnvExamplePath = Join-Path $script:ForgejoStackDir ".env.example"
$script:BackupRoot = Join-Path $script:RepoRoot "backup"

$script:ComposeExecutable = $null
$script:ComposePrefixArgs = @()
$script:LastComposeExitCode = 0

function Print-Header {
    try {
        Clear-Host
    } catch {
        # Some non-interactive PowerShell hosts do not expose a clearable console.
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

function Invoke-ComposeInDir {
    param(
        [Parameter(Mandatory = $true)]
        [string]$WorkingDirectory,
        [Parameter(Mandatory = $true)]
        [string[]]$Arguments
    )

    Push-Location $WorkingDirectory
    try {
        $allArgs = @($script:ComposePrefixArgs + $Arguments)
        & $script:ComposeExecutable @allArgs
        $script:LastComposeExitCode = $LASTEXITCODE
    } finally {
        Pop-Location
    }
}

function Get-ComposeOutput {
    param(
        [Parameter(Mandatory = $true)]
        [string[]]$Arguments
    )

    Push-Location $script:RepoRoot
    try {
        $allArgs = @($script:ComposePrefixArgs + $Arguments)
        $output = & $script:ComposeExecutable @allArgs 2>&1
        $script:LastComposeExitCode = $LASTEXITCODE
        return $output
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

    $encoding = New-Object System.Text.UTF8Encoding -ArgumentList $false
    [System.IO.File]::AppendAllText([System.IO.Path]::GetFullPath($Path), $Line + [Environment]::NewLine, $encoding)
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

function Get-MailComposeArgs {
    return @("-f", $script:MailComposeFilePath, "--env-file", $script:RootEnvPath, "--env-file", $script:MailEnvPath)
}

function Get-ForgejoComposeArgs {
    return @("-f", $script:ForgejoComposeFilePath, "--env-file", $script:RootEnvPath, "--env-file", $script:ForgejoEnvPath)
}

function Ensure-SharedDockerResources {
    & docker network inspect plane_default *> $null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Creating shared Docker network: plane_default"
        & docker network create plane_default *> $null
    }

    & docker volume inspect plane_caddy-data *> $null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Creating shared Docker volume: plane_caddy-data"
        & docker volume create plane_caddy-data *> $null
    }
}

function Initialize-MailEnvFiles {
    Initialize-LocalEnvFiles

    if (-not (Test-Path -LiteralPath $script:MailComposeFilePath -PathType Leaf)) {
        throw "mail-stack/docker-compose.yml not found at $($script:MailComposeFilePath)"
    }

    if (-not (Test-Path -LiteralPath $script:MailEnvPath -PathType Leaf)) {
        if (Test-Path -LiteralPath $script:MailEnvExamplePath -PathType Leaf) {
            Copy-Item -LiteralPath $script:MailEnvExamplePath -Destination $script:MailEnvPath -Force
            Write-Host "Created mail-stack/.env from mail-stack/.env.example"
        } else {
            throw "mail-stack/.env does not exist and mail-stack/.env.example was not found"
        }
    }

    $mailDomain = Get-EnvValue "MAIL_DOMAIN" $script:MailEnvPath
    if ([string]::IsNullOrWhiteSpace($mailDomain)) {
        $mailDomain = Get-EnvValue "MAIL_DOMAIN" $script:RootEnvPath
        if (-not [string]::IsNullOrWhiteSpace($mailDomain)) {
            Update-EnvFile "MAIL_DOMAIN" $mailDomain $script:MailEnvPath
        }
    }

    $mailDomain = Get-EnvValue "MAIL_DOMAIN" $script:MailEnvPath
    if ([string]::IsNullOrWhiteSpace($mailDomain)) {
        throw "MAIL_DOMAIN is not set. Set it in .env and mail-stack/.env before starting the mail stack."
    }
}

function Initialize-ForgejoEnvFiles {
    Initialize-LocalEnvFiles

    if (-not (Test-Path -LiteralPath $script:ForgejoComposeFilePath -PathType Leaf)) {
        throw "forgejo-stack/docker-compose.yml not found at $($script:ForgejoComposeFilePath)"
    }

    if (-not (Test-Path -LiteralPath $script:ForgejoEnvPath -PathType Leaf)) {
        if (Test-Path -LiteralPath $script:ForgejoEnvExamplePath -PathType Leaf) {
            Copy-Item -LiteralPath $script:ForgejoEnvExamplePath -Destination $script:ForgejoEnvPath -Force
            Write-Host "Created forgejo-stack/.env from forgejo-stack/.env.example"
        } else {
            throw "forgejo-stack/.env does not exist and forgejo-stack/.env.example was not found"
        }
    }

    $postgresPassword = Get-EnvValue "POSTGRES_PASSWORD" $script:ForgejoEnvPath
    if ([string]::IsNullOrWhiteSpace($postgresPassword) -or $postgresPassword.StartsWith("replace_with_")) {
        $postgresPassword = New-SecretKey
        Update-EnvFile "POSTGRES_PASSWORD" $postgresPassword $script:ForgejoEnvPath
        Write-Host "Generated POSTGRES_PASSWORD in forgejo-stack/.env"
    }

    $forgejoDbPassword = Get-EnvValue "FORGEJO_DB_PASSWORD" $script:ForgejoEnvPath
    if ([string]::IsNullOrWhiteSpace($forgejoDbPassword) -or $forgejoDbPassword.StartsWith("replace_with_")) {
        Update-EnvFile "FORGEJO_DB_PASSWORD" $postgresPassword $script:ForgejoEnvPath
        Write-Host "Set FORGEJO_DB_PASSWORD to match POSTGRES_PASSWORD in forgejo-stack/.env"
    } elseif ($forgejoDbPassword -ne $postgresPassword) {
        Write-Host "WARNING: FORGEJO_DB_PASSWORD differs from POSTGRES_PASSWORD. Forgejo may not be able to connect to its database."
    }

    $smtpPassword = Get-EnvValue "SMTP_PASSWORD" $script:ForgejoEnvPath
    if ([string]::IsNullOrWhiteSpace($smtpPassword) -or $smtpPassword.StartsWith("replace_with_")) {
        Write-Host "WARNING: SMTP_PASSWORD is not configured in forgejo-stack/.env. Forgejo can start, but mail notifications will fail until git@MAIL_DOMAIN exists in the mail stack."
    }

    $gitDomain = Get-EnvValue "GIT_DOMAIN" $script:RootEnvPath
    if ([string]::IsNullOrWhiteSpace($gitDomain)) {
        throw "GIT_DOMAIN is not set in .env."
    }

    New-Item -ItemType Directory -Force -Path (Join-Path $script:ForgejoStackDir "data\forgejo") | Out-Null
    New-Item -ItemType Directory -Force -Path (Join-Path $script:ForgejoStackDir "data\postgres") | Out-Null
    New-Item -ItemType Directory -Force -Path (Join-Path $script:ForgejoStackDir "backups") | Out-Null
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
    Write-Host "   API:   http://localhost:8000"
    Write-Host ""
}

function Start-MailServices {
    Initialize-MailEnvFiles
    Ensure-SharedDockerResources

    Write-Host "Starting mail stack..."
    Invoke-ComposeInDir -WorkingDirectory $script:MailStackDir -Arguments @((Get-MailComposeArgs) + @("up", "-d", "--build"))
    if ($script:LastComposeExitCode -ne 0) {
        exit $script:LastComposeExitCode
    }

    $mailDomain = Get-EnvValue "MAIL_DOMAIN" $script:MailEnvPath
    Write-Host "   Mail stack started"
    Write-Host "   SMTP:    mail.$($mailDomain):587"
    Write-Host "   IMAPS:   mail.$($mailDomain):993"
    Write-Host "   Webmail: https://webmail.$($mailDomain)"
    Write-Host ""
}

function Start-GitServices {
    Initialize-ForgejoEnvFiles
    Ensure-SharedDockerResources

    Write-Host "Starting Forgejo git stack..."
    Invoke-ComposeInDir -WorkingDirectory $script:ForgejoStackDir -Arguments @((Get-ForgejoComposeArgs) + @("up", "-d"))
    if ($script:LastComposeExitCode -ne 0) {
        exit $script:LastComposeExitCode
    }

    $gitDomain = Get-EnvValue "GIT_DOMAIN" $script:RootEnvPath
    Write-Host "   Git stack started"
    Write-Host "   Web: https://git.$($gitDomain)"
    Write-Host "   SSH: git@git.$($gitDomain):2222"
    Write-Host ""
}

function Start-AllServices {
    Start-Services
    Start-MailServices
    Start-GitServices
}

function Stop-Services {
    Initialize-LocalEnvFiles
    Invoke-Compose -Arguments @((Get-ComposeBaseArgs) + @("down"))
}

function Stop-MailServices {
    Initialize-MailEnvFiles
    Invoke-ComposeInDir -WorkingDirectory $script:MailStackDir -Arguments @((Get-MailComposeArgs) + @("down"))
}

function Stop-GitServices {
    Initialize-ForgejoEnvFiles
    Invoke-ComposeInDir -WorkingDirectory $script:ForgejoStackDir -Arguments @((Get-ForgejoComposeArgs) + @("down"))
}

function Stop-AllServices {
    Stop-GitServices
    Stop-MailServices
    Stop-Services
}

function Restart-Services {
    Stop-Services
    Start-Services
}

function Restart-MailServices {
    Stop-MailServices
    Start-MailServices
}

function Restart-GitServices {
    Stop-GitServices
    Start-GitServices
}

function Restart-AllServices {
    Stop-AllServices
    Start-AllServices
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

function View-StackLogs {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Stack,
        [string]$ServiceName = ""
    )

    switch ($Stack.ToLowerInvariant()) {
        "plane" {
            if ([string]::IsNullOrWhiteSpace($ServiceName)) {
                Initialize-LocalEnvFiles
                Invoke-Compose -Arguments @((Get-ComposeBaseArgs) + @("logs", "-f"))
            } else {
                View-Logs $ServiceName
            }
        }
        "mail" {
            Initialize-MailEnvFiles
            if ([string]::IsNullOrWhiteSpace($ServiceName)) {
                Invoke-ComposeInDir -WorkingDirectory $script:MailStackDir -Arguments @((Get-MailComposeArgs) + @("logs", "-f"))
            } else {
                Invoke-ComposeInDir -WorkingDirectory $script:MailStackDir -Arguments @((Get-MailComposeArgs) + @("logs", "-f", $ServiceName))
            }
        }
        "git" {
            Initialize-ForgejoEnvFiles
            if ([string]::IsNullOrWhiteSpace($ServiceName)) {
                Invoke-ComposeInDir -WorkingDirectory $script:ForgejoStackDir -Arguments @((Get-ForgejoComposeArgs) + @("logs", "-f"))
            } else {
                Invoke-ComposeInDir -WorkingDirectory $script:ForgejoStackDir -Arguments @((Get-ForgejoComposeArgs) + @("logs", "-f", $ServiceName))
            }
        }
        "forgejo" {
            View-StackLogs "git" $ServiceName
        }
        "all" {
            Write-Host "Streaming Plane logs. Open another terminal for mail/git logs if needed."
            Initialize-LocalEnvFiles
            Invoke-Compose -Arguments @((Get-ComposeBaseArgs) + @("logs", "-f"))
        }
        default {
            Write-Host "INVALID STACK NAME SUPPLIED"
        }
    }
}

function View-Logs {
    param(
        [string]$ServiceName
    )

    if ([string]::IsNullOrWhiteSpace($ServiceName)) {
        Write-Host ""
        Write-Host "Select a Service you want to view the logs for:"
        Write-Host "   1) Web"
        Write-Host "   2) Space"
        Write-Host "   3) API"
        Write-Host "   4) Worker"
        Write-Host "   5) Beat-Worker"
        Write-Host "   6) Migrator"
        Write-Host "   7) Proxy"
        Write-Host "   8) Redis"
        Write-Host "   9) Postgres"
        Write-Host "   10) Minio"
        Write-Host "   11) RabbitMQ"
        Write-Host "   0) Back to Main Menu"
        Write-Host ""

        $selection = Read-Host "Service"
        $selectionNumber = 0
        while (-not [int]::TryParse($selection, [ref]$selectionNumber) -or $selectionNumber -lt 0 -or $selectionNumber -gt 11) {
            Write-Host "Invalid selection. Please enter a number between 0 and 11."
            $selection = Read-Host "Service"
        }

        switch ($selectionNumber) {
            1 { View-SpecificLogs "web" }
            2 { View-SpecificLogs "space" }
            3 { View-SpecificLogs "api" }
            4 { View-SpecificLogs "worker" }
            5 { View-SpecificLogs "beat-worker" }
            6 { View-SpecificLogs "migrator" }
            7 { View-SpecificLogs "proxy" }
            8 { View-SpecificLogs "plane-redis" }
            9 { View-SpecificLogs "plane-db" }
            10 { View-SpecificLogs "plane-minio" }
            11 { View-SpecificLogs "plane-mq" }
            0 { Invoke-AskForAction @() }
            default { Write-Host "INVALID SERVICE NAME SUPPLIED" }
        }
    } else {
        switch ($ServiceName.ToLowerInvariant()) {
            "web" { View-SpecificLogs "web" }
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
}

function Show-Status {
    Initialize-LocalEnvFiles
    Invoke-Compose -Arguments @((Get-ComposeBaseArgs) + @("ps"))
}

function Show-MailStatus {
    Initialize-MailEnvFiles
    Invoke-ComposeInDir -WorkingDirectory $script:MailStackDir -Arguments @((Get-MailComposeArgs) + @("ps"))
}

function Show-GitStatus {
    Initialize-ForgejoEnvFiles
    Invoke-ComposeInDir -WorkingDirectory $script:ForgejoStackDir -Arguments @((Get-ForgejoComposeArgs) + @("ps"))
}

function Show-AllStatus {
    Write-Host ""
    Write-Host "Plane:"
    Show-Status
    Write-Host ""
    Write-Host "Mail:"
    Show-MailStatus
    Write-Host ""
    Write-Host "Git:"
    Show-GitStatus
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
    $containerId = (Get-ComposeOutput -Arguments @((Get-ComposeBaseArgs) + @("ps", "-q", $ContainerName)) | Select-Object -First 1)
    if ([string]::IsNullOrWhiteSpace($containerId)) {
        Write-Host "Error: $ContainerName container not found. Make sure the services are running."
        return $false
    }

    $serviceBackupPath = Join-Path $BackupFolder $ServiceFolder
    New-Item -ItemType Directory -Force -Path $serviceBackupPath | Out-Null

    Write-Host "Copying $ContainerName data directory..."
    & docker cp -q "$($containerId):$ContainerDataDir/." "$serviceBackupPath/"
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Error: Failed to copy $ServiceFolder data"
        Remove-Item -LiteralPath $serviceBackupPath -Recurse -Force -ErrorAction SilentlyContinue
        return $false
    }

    Push-Location $BackupFolder
    try {
        & tar -czf "$ServiceFolder.tar.gz" "$ServiceFolder/"
        $tarStatus = $LASTEXITCODE
        if ($tarStatus -eq 0) {
            Remove-Item -LiteralPath $ServiceFolder -Recurse -Force
        }
    } finally {
        Pop-Location
    }

    if ($tarStatus -ne 0) {
        Write-Host "Error: Failed to create tar archive"
        return $false
    }

    Write-Host "Successfully backed up $ServiceFolder data"
    return $true
}

function Backup-Data {
    Initialize-LocalEnvFiles

    $datetime = Get-Date -Format "yyyyMMdd-HHmm"
    $backupFolder = Join-Path $script:BackupRoot $datetime
    New-Item -ItemType Directory -Force -Path $backupFolder | Out-Null

    if (-not (Backup-ContainerDir $backupFolder "plane-db" "/var/lib/postgresql/data" "pgdata")) { exit 1 }
    if (-not (Backup-ContainerDir $backupFolder "plane-minio" "/export" "uploads")) { exit 1 }
    if (-not (Backup-ContainerDir $backupFolder "plane-mq" "/var/lib/rabbitmq" "rabbitmq_data")) { exit 1 }
    if (-not (Backup-ContainerDir $backupFolder "plane-redis" "/data" "redisdata")) { exit 1 }

    Write-Host ""
    Write-Host "Backup completed successfully. Backup files are stored in $backupFolder"
    Write-Host ""
}

function Normalize-Target {
    param(
        [string]$Target = "plane"
    )

    if ([string]::IsNullOrWhiteSpace($Target)) {
        return "plane"
    }

    switch ($Target.ToLowerInvariant()) {
        "plane" { return "plane" }
        "mail" { return "mail" }
        "email" { return "mail" }
        "smtp" { return "mail" }
        "git" { return "git" }
        "forgejo" { return "git" }
        "gitea" { return "git" }
        "all" { return "all" }
        "full" { return "all" }
        default { return $Target.ToLowerInvariant() }
    }
}

function Start-Target {
    param([string]$Target = "plane")

    switch (Normalize-Target $Target) {
        "plane" { Start-Services }
        "mail" { Start-MailServices }
        "git" { Start-GitServices }
        "all" { Start-AllServices }
        default { Write-Host "INVALID TARGET SUPPLIED. Use: plane, mail, git, all" }
    }
}

function Stop-Target {
    param([string]$Target = "plane")

    switch (Normalize-Target $Target) {
        "plane" { Stop-Services }
        "mail" { Stop-MailServices }
        "git" { Stop-GitServices }
        "all" { Stop-AllServices }
        default { Write-Host "INVALID TARGET SUPPLIED. Use: plane, mail, git, all" }
    }
}

function Restart-Target {
    param([string]$Target = "plane")

    switch (Normalize-Target $Target) {
        "plane" { Restart-Services }
        "mail" { Restart-MailServices }
        "git" { Restart-GitServices }
        "all" { Restart-AllServices }
        default { Write-Host "INVALID TARGET SUPPLIED. Use: plane, mail, git, all" }
    }
}

function Status-Target {
    param([string]$Target = "plane")

    switch (Normalize-Target $Target) {
        "plane" { Show-Status }
        "mail" { Show-MailStatus }
        "git" { Show-GitStatus }
        "all" { Show-AllStatus }
        default { Write-Host "INVALID TARGET SUPPLIED. Use: plane, mail, git, all" }
    }
}

function Invoke-AskForAction {
    param(
        [string[]]$Arguments
    )

    $defaultAction = ""
    if ($Arguments -and $Arguments.Count -gt 0) {
        $defaultAction = $Arguments[0].ToLowerInvariant()
    }

    $action = ""
    if ([string]::IsNullOrWhiteSpace($defaultAction)) {
        Write-Host ""
        Write-Host "Select a Action you want to perform:"
        Write-Host "   1) Install / Build local images"
        Write-Host "   2) Start all (Plane + mail + git)"
        Write-Host "   3) Start Plane only"
        Write-Host "   4) Start mail server only"
        Write-Host "   5) Start git server only"
        Write-Host "   6) Stop all"
        Write-Host "   7) Stop Plane only"
        Write-Host "   8) Stop mail server only"
        Write-Host "   9) Stop git server only"
        Write-Host "   10) Restart all"
        Write-Host "   11) Restart Plane only"
        Write-Host "   12) Restart mail server only"
        Write-Host "   13) Restart git server only"
        Write-Host "   14) Rebuild Plane images without cache"
        Write-Host "   15) View Logs"
        Write-Host "   16) Backup Plane Data"
        Write-Host "   17) Status"
        Write-Host "   18) Exit"
        Write-Host ""

        $action = Read-Host "Action [3]"
        while (-not [string]::IsNullOrWhiteSpace($action)) {
            $actionNumber = 0
            if ([int]::TryParse($action, [ref]$actionNumber) -and $actionNumber -ge 1 -and $actionNumber -le 18) {
                break
            }

            Write-Host "${action}: invalid selection."
            $action = Read-Host "Action [3]"
        }

        if ([string]::IsNullOrWhiteSpace($action)) {
            $action = "3"
        }

        Write-Host ""
    }

    if ($action -eq "1" -or $defaultAction -eq "install" -or $defaultAction -eq "build") {
        Install-Plane
    } elseif ($action -eq "2") {
        Start-Target "all"
    } elseif ($action -eq "3" -or $defaultAction -eq "start" -or $defaultAction -eq "up") {
        $target = if ($Arguments -and $Arguments.Count -gt 1) { $Arguments[1] } else { "plane" }
        Start-Target $target
    } elseif ($action -eq "4") {
        Start-Target "mail"
    } elseif ($action -eq "5") {
        Start-Target "git"
    } elseif ($action -eq "6") {
        Stop-Target "all"
    } elseif ($action -eq "7" -or $defaultAction -eq "stop" -or $defaultAction -eq "down") {
        $target = if ($Arguments -and $Arguments.Count -gt 1) { $Arguments[1] } else { "plane" }
        Stop-Target $target
    } elseif ($action -eq "8") {
        Stop-Target "mail"
    } elseif ($action -eq "9") {
        Stop-Target "git"
    } elseif ($action -eq "10") {
        Restart-Target "all"
    } elseif ($action -eq "11" -or $defaultAction -eq "restart") {
        $target = if ($Arguments -and $Arguments.Count -gt 1) { $Arguments[1] } else { "plane" }
        Restart-Target $target
    } elseif ($action -eq "12") {
        Restart-Target "mail"
    } elseif ($action -eq "13") {
        Restart-Target "git"
    } elseif ($action -eq "14" -or $defaultAction -eq "rebuild") {
        Rebuild-Services
    } elseif ($action -eq "15" -or $defaultAction -eq "logs") {
        $firstLogArg = ""
        if ($Arguments -and $Arguments.Count -gt 1) {
            $firstLogArg = $Arguments[1]
        }

        if ([string]::IsNullOrWhiteSpace($firstLogArg)) {
            View-Logs
        } else {
            $logTarget = Normalize-Target $firstLogArg
            if (@("plane", "mail", "git", "all") -contains $logTarget) {
                $serviceName = ""
                if ($Arguments -and $Arguments.Count -gt 2) {
                    $serviceName = $Arguments[2]
                }
                View-StackLogs $logTarget $serviceName
            } else {
                View-Logs $firstLogArg
            }
        }
    } elseif ($action -eq "16" -or $defaultAction -eq "backup") {
        Backup-Data
    } elseif ($action -eq "17" -or $defaultAction -eq "status" -or $defaultAction -eq "ps") {
        $target = if ($Arguments -and $Arguments.Count -gt 1) { $Arguments[1] } else { "plane" }
        Status-Target $target
    } elseif ($action -eq "18") {
        exit 0
    } else {
        Write-Host "INVALID ACTION SUPPLIED"
    }
}

Initialize-ComposeCommand
Print-Header
Invoke-AskForAction $CommandArgs
