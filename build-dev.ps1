# =============================================================================
# build-dev.ps1 — Build Plane artifacts on Windows dev machine for RHEL server
#
# Usage:
#   .\build-dev.ps1 all              Build + export ALL images
#   .\build-dev.ps1 api              Pack API source (no image rebuild)
#   .\build-dev.ps1 web              Extract web static files
#   .\build-dev.ps1 admin            Extract admin static files
#   .\build-dev.ps1 space            Rebuild space image
#   .\build-dev.ps1 live             Rebuild live image
#   .\build-dev.ps1 api web          Multiple targets
#
# Output: all artifacts saved to .\dist-images\
# After build, use FileZilla SFTP to copy files to server
# =============================================================================

param(
    [Parameter(Position=0)]
    [string[]]$Targets
)

$ErrorActionPreference = "Stop"
$PLATFORM = "linux/amd64"
$DIST = ".\dist-images"

function Write-Log($msg) { Write-Host "[BUILD] $msg" -ForegroundColor Green }
function Write-Warn($msg) { Write-Host "[WARN] $msg" -ForegroundColor Yellow }
function Write-Err($msg) { Write-Host "[ERROR] $msg" -ForegroundColor Red }

function Show-Usage {
    Write-Host @"
Usage: .\build-dev.ps1 [all|api|web|admin|space|live] ...

Targets:
  all    - Build + export ALL Docker images (first-time deploy)
  api    - Pack API Python source only (no image rebuild, fast)
  web    - Extract web static files from Docker build
  admin  - Extract admin static files from Docker build
  space  - Rebuild space Docker image
  live   - Rebuild live Docker image

Output: $DIST\
"@
    exit 1
}

# Create output directory
if (-not (Test-Path $DIST)) { New-Item -ItemType Directory -Path $DIST | Out-Null }

function Build-All {
    Write-Log "Building ALL images for $PLATFORM..."

    Write-Log "Building plane-api..."
    docker build --platform $PLATFORM -f apps/api/Dockerfile.api -t plane-api:latest ./apps/api
    if ($LASTEXITCODE -ne 0) { throw "Failed to build plane-api" }

    Write-Log "Building plane-web..."
    docker build --platform $PLATFORM -f apps/web/Dockerfile.web -t plane-web:latest .
    if ($LASTEXITCODE -ne 0) { throw "Failed to build plane-web" }

    Write-Log "Building plane-admin..."
    docker build --platform $PLATFORM -f apps/admin/Dockerfile.admin -t plane-admin:latest .
    if ($LASTEXITCODE -ne 0) { throw "Failed to build plane-admin" }

    Write-Log "Building plane-space..."
    docker build --platform $PLATFORM -f apps/space/Dockerfile.space -t plane-space:latest .
    if ($LASTEXITCODE -ne 0) { throw "Failed to build plane-space" }

    Write-Log "Building plane-live..."
    docker build --platform $PLATFORM -f apps/live/Dockerfile.live -t plane-live:latest .
    if ($LASTEXITCODE -ne 0) { throw "Failed to build plane-live" }

    Write-Log "Building plane-proxy..."
    docker build --platform $PLATFORM -f apps/proxy/Dockerfile.ce -t plane-proxy:latest ./apps/proxy
    if ($LASTEXITCODE -ne 0) { throw "Failed to build plane-proxy" }

    Write-Log "Exporting images to $DIST\ ..."
    $images = @("plane-api", "plane-web", "plane-admin", "plane-space", "plane-live", "plane-proxy")
    foreach ($img in $images) {
        Write-Log "  Saving $img..."
        docker save "${img}:latest" | gzip > "$DIST\$img.tar.gz"
        if ($LASTEXITCODE -ne 0) { throw "Failed to save $img" }
    }

    Write-Log ""
    Write-Log "=== BUILD COMPLETE ==="
    Get-ChildItem "$DIST\*.tar.gz" | Format-Table Name, @{N="Size(MB)";E={[math]::Round($_.Length/1MB,1)}}
    Write-Log ""
    Write-Log "=== SFTP UPLOAD GUIDE ==="
    Write-Log "Copy ALL .tar.gz files   -> server:/opt/plane/images/"
    Write-Log "Copy docker-compose.yml  -> server:/opt/plane/"
    Write-Log "Copy .env                -> server:/opt/plane/"
    Write-Log "Copy apps\api\.env       -> server:/opt/plane/apps/api/.env"
    Write-Log "Copy deploy-server.sh    -> server:/opt/plane/"
    Write-Log "Then SSH: cd /opt/plane && ./deploy-server.sh all"
}

function Build-Api {
    Write-Log "Packing API source..."

    # Use tar via Docker to ensure linux-compatible tar.gz
    docker run --rm -v "${PWD}/apps/api:/src" -v "${PWD}/${DIST}:/out" `
        alpine sh -c "cd /src && tar czf /out/api-source.tar.gz --exclude='__pycache__' --exclude='.env' --exclude='*.pyc' --exclude='.git' --exclude='node_modules' ."
    if ($LASTEXITCODE -ne 0) { throw "Failed to pack API source" }

    $size = (Get-Item "$DIST\api-source.tar.gz").Length / 1MB
    Write-Log "API source packed: $([math]::Round($size,1)) MB"
    Write-Log ""
    Write-Log "=== SFTP UPLOAD GUIDE ==="
    Write-Log "Copy $DIST\api-source.tar.gz -> server:/opt/plane/"
    Write-Log "Then SSH: cd /opt/plane && ./deploy-server.sh api"
}

function Build-Web {
    Write-Log "Building Web static files..."
    docker build --platform $PLATFORM -f apps/web/Dockerfile.web --target installer -t plane-web-builder:latest .
    if ($LASTEXITCODE -ne 0) { throw "Failed to build web" }

    docker rm -f tmp-web 2>$null
    docker create --name tmp-web plane-web-builder:latest
    if (Test-Path "$DIST\web-client") { Remove-Item -Recurse -Force "$DIST\web-client" }
    docker cp tmp-web:/app/apps/web/build/client "$DIST\web-client\"
    docker rm tmp-web

    # Use Docker alpine to create linux-compatible tar.gz
    docker run --rm -v "${PWD}/${DIST}/web-client:/src" -v "${PWD}/${DIST}:/out" `
        alpine sh -c "cd /src && tar czf /out/web-client.tar.gz ."
    if ($LASTEXITCODE -ne 0) { throw "Failed to pack web client" }

    $size = (Get-Item "$DIST\web-client.tar.gz").Length / 1MB
    Write-Log "Web client packed: $([math]::Round($size,1)) MB"
    Write-Log ""
    Write-Log "=== SFTP UPLOAD GUIDE ==="
    Write-Log "Copy $DIST\web-client.tar.gz -> server:/opt/plane/"
    Write-Log "Then SSH: cd /opt/plane && ./deploy-server.sh web"
}

function Build-Admin {
    Write-Log "Building Admin static files..."
    docker build --platform $PLATFORM -f apps/admin/Dockerfile.admin --target installer -t plane-admin-builder:latest .
    if ($LASTEXITCODE -ne 0) { throw "Failed to build admin" }

    docker rm -f tmp-admin 2>$null
    docker create --name tmp-admin plane-admin-builder:latest
    if (Test-Path "$DIST\admin-client") { Remove-Item -Recurse -Force "$DIST\admin-client" }
    docker cp tmp-admin:/app/apps/admin/build/client "$DIST\admin-client\"
    docker rm tmp-admin

    docker run --rm -v "${PWD}/${DIST}/admin-client:/src" -v "${PWD}/${DIST}:/out" `
        alpine sh -c "cd /src && tar czf /out/admin-client.tar.gz ."
    if ($LASTEXITCODE -ne 0) { throw "Failed to pack admin client" }

    $size = (Get-Item "$DIST\admin-client.tar.gz").Length / 1MB
    Write-Log "Admin client packed: $([math]::Round($size,1)) MB"
    Write-Log ""
    Write-Log "=== SFTP UPLOAD GUIDE ==="
    Write-Log "Copy $DIST\admin-client.tar.gz -> server:/opt/plane/"
    Write-Log "Then SSH: cd /opt/plane && ./deploy-server.sh admin"
}

function Build-Space {
    Write-Log "Building Space image..."
    docker build --platform $PLATFORM -f apps/space/Dockerfile.space -t plane-space:latest .
    if ($LASTEXITCODE -ne 0) { throw "Failed to build space" }

    docker save plane-space:latest | gzip > "$DIST\plane-space.tar.gz"

    $size = (Get-Item "$DIST\plane-space.tar.gz").Length / 1MB
    Write-Log "Space image: $([math]::Round($size,1)) MB"
    Write-Log ""
    Write-Log "=== SFTP UPLOAD GUIDE ==="
    Write-Log "Copy $DIST\plane-space.tar.gz -> server:/opt/plane/images/"
    Write-Log "Then SSH: cd /opt/plane && ./deploy-server.sh space"
}

function Build-Live {
    Write-Log "Building Live image..."
    docker build --platform $PLATFORM -f apps/live/Dockerfile.live -t plane-live:latest .
    if ($LASTEXITCODE -ne 0) { throw "Failed to build live" }

    docker save plane-live:latest | gzip > "$DIST\plane-live.tar.gz"

    $size = (Get-Item "$DIST\plane-live.tar.gz").Length / 1MB
    Write-Log "Live image: $([math]::Round($size,1)) MB"
    Write-Log ""
    Write-Log "=== SFTP UPLOAD GUIDE ==="
    Write-Log "Copy $DIST\plane-live.tar.gz -> server:/opt/plane/images/"
    Write-Log "Then SSH: cd /opt/plane && ./deploy-server.sh live"
}

# --- Main ---

if (-not $Targets -or $Targets.Count -eq 0) { Show-Usage }

foreach ($target in $Targets) {
    switch ($target) {
        "all"   { Build-All }
        "api"   { Build-Api }
        "web"   { Build-Web }
        "admin" { Build-Admin }
        "space" { Build-Space }
        "live"  { Build-Live }
        default {
            Write-Err "Unknown target: $target"
            Show-Usage
        }
    }
}
