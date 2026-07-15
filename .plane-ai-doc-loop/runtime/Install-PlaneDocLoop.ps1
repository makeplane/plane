param(
  [Parameter(Mandatory = $true)]
  [string]$PlanePath,
  [switch]$Overwrite,
  [switch]$OverwriteSeedData
)

$ErrorActionPreference = "Stop"
$source = Split-Path -Parent $PSScriptRoot
$installedLayout = (Split-Path -Leaf $source) -eq ".plane-ai-doc-loop"
if ($installedLayout) {
  $source = Split-Path -Parent $source
}
$target = (Resolve-Path -LiteralPath $PlanePath).Path
$manifestPath = Join-Path $source ".plane-ai-doc-loop\manifest.json"

if (-not (Test-Path -LiteralPath (Join-Path $target "pnpm-workspace.yaml")) -or
    -not (Test-Path -LiteralPath (Join-Path $target "package.json"))) {
  throw "PlanePath does not look like the Plane repository root: $target"
}

if (-not (Test-Path -LiteralPath $manifestPath -PathType Leaf)) {
  throw "Loop package manifest is missing: $manifestPath"
}

$manifest = Get-Content -LiteralPath $manifestPath -Raw -Encoding UTF8 | ConvertFrom-Json
$managedPaths = @($manifest.managed_paths)
$userMaintainedPaths = @($manifest.user_maintained_paths)
if ($managedPaths.Count -eq 0) {
  throw "Loop package manifest contains no managed paths: $manifestPath"
}

$conflicts = @()
$installPaths = @()

foreach ($relativePath in $managedPaths) {
  $sourceProperty = if ($installedLayout) { $null } else { $manifest.source_paths.PSObject.Properties[$relativePath] }
  $sourceRelativePath = if ($sourceProperty) { $sourceProperty.Value } else { $relativePath }
  $sourcePath = Join-Path $source $sourceRelativePath
  $targetPath = Join-Path $target $relativePath

  if (-not (Test-Path -LiteralPath $sourcePath -PathType Leaf)) {
    throw "Managed source file is missing: $relativePath"
  }

  if (Test-Path -LiteralPath $targetPath -PathType Leaf) {
    $sourceHash = (Get-FileHash -LiteralPath $sourcePath -Algorithm SHA256).Hash
    $targetHash = (Get-FileHash -LiteralPath $targetPath -Algorithm SHA256).Hash
    if ($sourceHash -eq $targetHash) {
      continue
    }
    if ($relativePath -in $userMaintainedPaths -and -not $OverwriteSeedData) {
      Write-Host "Preserved user-maintained $relativePath"
      continue
    }
    if (-not $Overwrite) {
      $conflicts += $relativePath
      continue
    }
  }

  $installPaths += $relativePath
}

if ($conflicts.Count -gt 0) {
  $formatted = $conflicts | ForEach-Object { "  - $_" }
  throw "Installation stopped before writing because managed files already differ:`n$($formatted -join "`n")`nReview them, then re-run with -Overwrite only if replacement is intended. User-maintained seed data also requires -OverwriteSeedData."
}

foreach ($relativePath in @($manifest.obsolete_paths)) {
  $obsoletePath = Join-Path $target $relativePath
  if (-not (Test-Path -LiteralPath $obsoletePath -PathType Leaf)) {
    continue
  }
  if ($Overwrite) {
    Remove-Item -LiteralPath $obsoletePath -Force
    Write-Host "Removed obsolete $relativePath"
  } else {
    Write-Warning "Obsolete loop file remains at $relativePath. Re-run with -Overwrite to remove it."
  }
}

if ($Overwrite) {
  foreach ($relativePath in @($manifest.obsolete_directories)) {
    $obsoleteDirectory = Join-Path $target $relativePath
    if ((Test-Path -LiteralPath $obsoleteDirectory -PathType Container) -and
        -not (Get-ChildItem -LiteralPath $obsoleteDirectory -Force | Select-Object -First 1)) {
      Remove-Item -LiteralPath $obsoleteDirectory -Force
      Write-Host "Removed empty obsolete directory $relativePath"
    }
  }
}

foreach ($relativePath in $installPaths) {
  $sourceProperty = if ($installedLayout) { $null } else { $manifest.source_paths.PSObject.Properties[$relativePath] }
  $sourceRelativePath = if ($sourceProperty) { $sourceProperty.Value } else { $relativePath }
  $sourcePath = Join-Path $source $sourceRelativePath
  $targetPath = Join-Path $target $relativePath
  $targetDirectory = Split-Path -Parent $targetPath
  if (-not (Test-Path -LiteralPath $targetDirectory -PathType Container)) {
    New-Item -ItemType Directory -Path $targetDirectory -Force | Out-Null
  }
  Copy-Item -LiteralPath $sourcePath -Destination $targetPath -Force
  Write-Host "Installed $relativePath"
}

Write-Host ""
Write-Host "Plane AI documentation loop $($manifest.version) is installed in $target"
Write-Host "Files written: $($installPaths.Count); unchanged: $($managedPaths.Count - $installPaths.Count)"
Write-Host "Run:"
Write-Host "  powershell -ExecutionPolicy Bypass -File .plane-ai-doc-loop\runtime\Invoke-PlaneDocLoop.ps1 -PlanePath ."
