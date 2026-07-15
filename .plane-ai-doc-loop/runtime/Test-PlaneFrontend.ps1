param(
  [string]$PlanePath = ".",
  [string]$GitPath = "",
  [string]$NodePath = "",
  [string]$PnpmPath = "",
  [switch]$SkipInstall,
  [switch]$KeepWorktree
)

$ErrorActionPreference = "Stop"
$root = (Resolve-Path -LiteralPath $PlanePath).Path

function Resolve-Runtime {
  param(
    [string]$Name,
    [string]$ExplicitPath,
    [string]$BundledPattern
  )

  if ($ExplicitPath) {
    return (Resolve-Path -LiteralPath $ExplicitPath).Path
  }
  $command = Get-Command $Name -ErrorAction SilentlyContinue
  if ($command) {
    return $command.Source
  }
  $runtimeRoot = Join-Path $HOME ".cache\codex-runtimes"
  $bundled = Get-ChildItem -Path (Join-Path $runtimeRoot $BundledPattern) -File -ErrorAction SilentlyContinue |
    Sort-Object LastWriteTime -Descending |
    Select-Object -First 1
  if ($bundled) {
    return $bundled.FullName
  }
  return ""
}

if (-not (Test-Path -LiteralPath (Join-Path $root "pnpm-workspace.yaml") -PathType Leaf)) {
  throw "PlanePath does not look like the Plane repository root: $root"
}

$GitPath = Resolve-Runtime -Name "git" -ExplicitPath $GitPath -BundledPattern "*\dependencies\native\git\cmd\git.exe"
$NodePath = Resolve-Runtime -Name "node" -ExplicitPath $NodePath -BundledPattern "*\dependencies\node\bin\node.exe"
$PnpmPath = Resolve-Runtime -Name "pnpm" -ExplicitPath $PnpmPath -BundledPattern "*\dependencies\bin\fallback\pnpm.cmd"
if (-not $GitPath -or -not $NodePath -or -not $PnpmPath) {
  throw "Git, Node, and pnpm are required. Run Test-PlanePrerequisites.ps1 for details."
}

$frontendInputs = @(
  "apps",
  "packages",
  ".gitattributes",
  ".oxfmtrc.json",
  ".oxlintrc.json",
  "package.json",
  "pnpm-lock.yaml",
  "pnpm-workspace.yaml",
  "turbo.json",
  "tsconfig.json"
)
$auditRoot = Join-Path ([System.IO.Path]::GetTempPath()) "plane-frontend-audit-$([guid]::NewGuid().ToString('N'))"
$patchPath = "$auditRoot.patch"
$protectedStatusBefore = @(& $GitPath -c core.quotepath=false -c "safe.directory=$root" -C $root status --porcelain=v1 --untracked-files=all -- apps packages)
if ($LASTEXITCODE -ne 0) {
  throw "Unable to capture the initial protected source status: $LASTEXITCODE"
}
$created = $false
$originalPath = $env:PATH
$originalTelemetry = $env:TURBO_TELEMETRY_DISABLED
$originalConfigCount = $env:GIT_CONFIG_COUNT
$originalConfigKey0 = $env:GIT_CONFIG_KEY_0
$originalConfigValue0 = $env:GIT_CONFIG_VALUE_0
$originalConfigKey1 = $env:GIT_CONFIG_KEY_1
$originalConfigValue1 = $env:GIT_CONFIG_VALUE_1
$locationPushed = $false

try {
  & $GitPath -c "safe.directory=$root" -c core.autocrlf=false -C $root worktree add --quiet --detach $auditRoot HEAD
  if ($LASTEXITCODE -ne 0) {
    throw "Unable to create LF audit worktree: $LASTEXITCODE"
  }
  $created = $true

  & $GitPath -c "safe.directory=$root" -c core.autocrlf=true -C $root diff --binary --full-index "--output=$patchPath" HEAD -- @frontendInputs
  if ($LASTEXITCODE -ne 0) {
    throw "Unable to capture tracked frontend changes: $LASTEXITCODE"
  }
  if ((Test-Path -LiteralPath $patchPath -PathType Leaf) -and (Get-Item -LiteralPath $patchPath).Length -gt 0) {
    & $GitPath -c "safe.directory=$auditRoot" -C $auditRoot apply --whitespace=nowarn $patchPath
    if ($LASTEXITCODE -ne 0) {
      throw "Unable to apply tracked frontend changes to the LF audit worktree: $LASTEXITCODE"
    }
  }

  $untracked = @(& $GitPath -c core.quotepath=false -c "safe.directory=$root" -C $root ls-files --others --exclude-standard -- @frontendInputs)
  if ($LASTEXITCODE -ne 0) {
    throw "Unable to enumerate untracked frontend changes: $LASTEXITCODE"
  }
  foreach ($relativePath in $untracked) {
    $sourcePath = Join-Path $root $relativePath
    $targetPath = Join-Path $auditRoot $relativePath
    $targetDirectory = Split-Path -Parent $targetPath
    if (-not (Test-Path -LiteralPath $targetDirectory -PathType Container)) {
      New-Item -ItemType Directory -Path $targetDirectory -Force | Out-Null
    }
    Copy-Item -LiteralPath $sourcePath -Destination $targetPath -Force
  }
  if ($untracked.Count -gt 0) {
    & $GitPath -c "safe.directory=$auditRoot" -c core.autocrlf=true -C $auditRoot add -- @untracked
    if ($LASTEXITCODE -ne 0) {
      throw "Unable to normalize untracked frontend changes: $LASTEXITCODE"
    }
    & $GitPath -c "safe.directory=$auditRoot" -c core.autocrlf=false -C $auditRoot checkout-index --force -- @untracked
    if ($LASTEXITCODE -ne 0) {
      throw "Unable to materialize normalized frontend changes: $LASTEXITCODE"
    }
  }

  $env:PATH = "$(Split-Path -Parent $NodePath);$(Split-Path -Parent $PnpmPath);$(Split-Path -Parent $GitPath);$originalPath"
  $env:TURBO_TELEMETRY_DISABLED = "1"
  $env:GIT_CONFIG_COUNT = "2"
  $env:GIT_CONFIG_KEY_0 = "safe.directory"
  $env:GIT_CONFIG_VALUE_0 = $auditRoot
  $env:GIT_CONFIG_KEY_1 = "core.autocrlf"
  $env:GIT_CONFIG_VALUE_1 = "false"
  Push-Location -LiteralPath $auditRoot
  $locationPushed = $true

  $eolStatus = @(& $GitPath -C $auditRoot ls-files --eol -- "packages/constants/package.json" "packages/utils/src/array.ts")
  $nonLfPaths = @($eolStatus | Where-Object { $_ -notmatch "w/lf" })
  if ($LASTEXITCODE -ne 0 -or $nonLfPaths.Count -gt 0) {
    throw "LF audit worktree validation failed: $($eolStatus -join '; ')"
  }

  if (-not $SkipInstall) {
    & $PnpmPath install --frozen-lockfile
    if ($LASTEXITCODE -ne 0) {
      throw "pnpm install failed with exit code $LASTEXITCODE"
    }
  }
  & $PnpmPath check
  if ($LASTEXITCODE -ne 0) {
    throw "pnpm check failed with exit code $LASTEXITCODE"
  }

  $protectedStatus = @(& $GitPath -c core.quotepath=false -c "safe.directory=$root" -C $root status --porcelain=v1 --untracked-files=all -- apps packages)
  if ($LASTEXITCODE -ne 0) {
    throw "Protected source status check failed with exit code $LASTEXITCODE"
  }
  if (($protectedStatusBefore -join "`n") -ne ($protectedStatus -join "`n")) {
    throw "Main Plane business source status changed during frontend audit.`nBefore:`n$($protectedStatusBefore -join "`n")`nAfter:`n$($protectedStatus -join "`n")"
  }

  Write-Host ""
  Write-Host "Plane frontend acceptance passed in isolated LF worktree."
  Write-Host "Main Plane source roots remain unchanged: apps, packages"
} finally {
  if ($locationPushed) {
    Pop-Location
  }
  $env:PATH = $originalPath
  $env:TURBO_TELEMETRY_DISABLED = $originalTelemetry
  $env:GIT_CONFIG_COUNT = $originalConfigCount
  $env:GIT_CONFIG_KEY_0 = $originalConfigKey0
  $env:GIT_CONFIG_VALUE_0 = $originalConfigValue0
  $env:GIT_CONFIG_KEY_1 = $originalConfigKey1
  $env:GIT_CONFIG_VALUE_1 = $originalConfigValue1
  if (Test-Path -LiteralPath $patchPath -PathType Leaf) {
    Remove-Item -LiteralPath $patchPath -Force
  }
  if ($created -and -not $KeepWorktree) {
    if (Test-Path -LiteralPath $auditRoot) {
      & $NodePath -e "require('node:fs').rmSync(process.argv[1],{recursive:true,force:true,maxRetries:5,retryDelay:200})" $auditRoot
      if ($LASTEXITCODE -ne 0 -or (Test-Path -LiteralPath $auditRoot)) {
        throw "Unable to remove the LF audit worktree: $auditRoot"
      }
    }
    & $GitPath -c "safe.directory=$root" -C $root worktree prune
    if ($LASTEXITCODE -ne 0) {
      throw "Unable to prune the LF audit worktree record: $LASTEXITCODE"
    }
  } elseif ($created) {
    Write-Host "Kept LF audit worktree: $auditRoot"
  }
}
