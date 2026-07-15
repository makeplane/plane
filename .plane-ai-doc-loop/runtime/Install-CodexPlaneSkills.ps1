param(
  [string]$SourceRoot = "",
  [string]$CodexHome = "",
  [switch]$Overwrite
)

$ErrorActionPreference = "Stop"
if (-not $SourceRoot) {
  $SourceRoot = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot "..")).Path
} else {
  $SourceRoot = (Resolve-Path -LiteralPath $SourceRoot).Path
}
if (-not $CodexHome) {
  $CodexHome = if ($env:CODEX_HOME) { $env:CODEX_HOME } else { Join-Path $HOME ".codex" }
}

$sourceSkills = Join-Path $SourceRoot ".agents\skills"
$targetSkills = Join-Path $CodexHome "skills"
$skillNames = @("plane-project-understand", "plane-doc-code-loop", "plane-doc-consistency-review")

if (-not (Test-Path -LiteralPath $sourceSkills -PathType Container)) {
  throw "Versioned Plane skills are missing: $sourceSkills"
}
if (-not (Test-Path -LiteralPath $targetSkills -PathType Container)) {
  New-Item -ItemType Directory -Path $targetSkills -Force | Out-Null
}

$conflicts = @()
foreach ($name in $skillNames) {
  $source = Join-Path $sourceSkills $name
  $target = Join-Path $targetSkills $name
  if (-not (Test-Path -LiteralPath (Join-Path $source "SKILL.md") -PathType Leaf)) {
    throw "Invalid source skill: $source"
  }
  if ((Test-Path -LiteralPath $target) -and -not $Overwrite) {
    $conflicts += $target
  }
}

if ($conflicts.Count -gt 0) {
  throw "Codex skill installation stopped before writing because targets exist:`n$($conflicts -join "`n")`nReview them, then re-run with -Overwrite."
}

foreach ($name in $skillNames) {
  $source = Join-Path $sourceSkills $name
  $target = Join-Path $targetSkills $name
  if (Test-Path -LiteralPath $target) {
    Remove-Item -LiteralPath $target -Recurse -Force
  }
  Copy-Item -LiteralPath $source -Destination $targetSkills -Recurse -Force
  Write-Host "Installed Codex skill $name"
}

Write-Host ""
Write-Host "Installed $($skillNames.Count) Plane skills into $targetSkills"
Write-Host "They are available to Codex and ChatGPT Desktop in the next task."
