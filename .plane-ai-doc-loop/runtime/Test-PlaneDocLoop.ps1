param(
  [string]$PlanePath = ".",
  [string]$PythonPath = "",
  [string]$GitPath = "",
  [switch]$SkipImpact
)

$ErrorActionPreference = "Stop"
$root = (Resolve-Path -LiteralPath $PlanePath).Path
$manifestPath = Join-Path $root ".plane-ai-doc-loop\manifest.json"
$invokePath = Join-Path $root ".plane-ai-doc-loop\runtime\Invoke-PlaneDocLoop.ps1"

if (-not (Test-Path -LiteralPath $manifestPath -PathType Leaf)) {
  throw "Plane AI loop manifest is not installed: $manifestPath"
}

$manifest = Get-Content -LiteralPath $manifestPath -Raw -Encoding UTF8 | ConvertFrom-Json
$missing = @($manifest.managed_paths | Where-Object { -not (Test-Path -LiteralPath (Join-Path $root $_) -PathType Leaf) })
if ($missing.Count -gt 0) {
  throw "Installed loop is incomplete. Missing: $($missing -join ', ')"
}

$invokeArguments = @{
  PlanePath = $root
  SkipImpact = $SkipImpact
}
if ($PythonPath) {
  $invokeArguments.PythonPath = $PythonPath
}
if ($GitPath) {
  $invokeArguments.GitPath = $GitPath
}

& $invokePath @invokeArguments

$generatedPaths = @($manifest.generated_paths)
if ($SkipImpact) {
  $generatedPaths = @($generatedPaths | Where-Object { $_ -notmatch "change[_-]impact" })
}

$missingGenerated = @($generatedPaths | Where-Object { -not (Test-Path -LiteralPath (Join-Path $root $_) -PathType Leaf) })
if ($missingGenerated.Count -gt 0) {
  throw "Loop did not generate expected outputs: $($missingGenerated -join ', ')"
}

foreach ($relativePath in @("docs/semantic/local_scan.json", "docs/semantic/change_impact.json")) {
  if ($SkipImpact -and $relativePath -match "change_impact") {
    continue
  }
  Get-Content -LiteralPath (Join-Path $root $relativePath) -Raw -Encoding UTF8 | ConvertFrom-Json | Out-Null
}

if (-not $GitPath) {
  $git = Get-Command git -ErrorAction SilentlyContinue
  if ($git) {
    $GitPath = $git.Source
  } else {
    $runtimeRoot = Join-Path $HOME ".cache\codex-runtimes"
    $bundled = Get-ChildItem -Path (Join-Path $runtimeRoot "*\dependencies\native\git\cmd\git.exe") -File -ErrorAction SilentlyContinue |
      Sort-Object LastWriteTime -Descending |
      Select-Object -First 1
    if ($bundled) {
      $GitPath = $bundled.FullName
    }
  }
}

if (-not $GitPath) {
  throw "Git was not found for the protected source check. Pass -GitPath or install Git."
}

$gateTestPath = Join-Path $root ".plane-ai-doc-loop\runtime\test_doc_gate.py"
if ($PythonPath) {
  & $PythonPath $gateTestPath --git $GitPath
} else {
  $python = Get-Command python -ErrorAction SilentlyContinue
  $py = Get-Command py -ErrorAction SilentlyContinue
  if ($python) {
    & $python.Source $gateTestPath --git $GitPath
  } elseif ($py) {
    & $py.Source -3 $gateTestPath --git $GitPath
  } else {
    $runtimeRoot = Join-Path $HOME ".cache\codex-runtimes"
    $bundledPython = Get-ChildItem -Path (Join-Path $runtimeRoot "*\dependencies\python\python.exe") -File -ErrorAction SilentlyContinue |
      Sort-Object LastWriteTime -Descending |
      Select-Object -First 1
    if (-not $bundledPython) {
      throw "Python was not found for documentation gate integration tests."
    }
    & $bundledPython.FullName $gateTestPath --git $GitPath
  }
}
if ($LASTEXITCODE -ne 0) {
  throw "Documentation gate integration tests failed with exit code $LASTEXITCODE"
}

$coldStartTestPath = Join-Path $root ".plane-ai-doc-loop\runtime\test_ci_cold_start.py"
if ($PythonPath) {
  & $PythonPath $coldStartTestPath --root $root --git $GitPath
} elseif ($python) {
  & $python.Source $coldStartTestPath --root $root --git $GitPath
} elseif ($py) {
  & $py.Source -3 $coldStartTestPath --root $root --git $GitPath
} else {
  & $bundledPython.FullName $coldStartTestPath --root $root --git $GitPath
}
if ($LASTEXITCODE -ne 0) {
  throw "CI cold-start integration test failed with exit code $LASTEXITCODE"
}

$protectedStatus = & $GitPath -c "safe.directory=$root" -C $root status --porcelain=v1 --untracked-files=all -- apps packages
if ($LASTEXITCODE -ne 0) {
  throw "Git protected source check failed with exit code $LASTEXITCODE"
}
if ($protectedStatus) {
  throw "Plane business source changed unexpectedly:`n$($protectedStatus -join "`n")"
}

Write-Host ""
Write-Host "Plane AI documentation loop acceptance passed."
Write-Host "Version: $($manifest.version)"
Write-Host "Managed files: $(@($manifest.managed_paths).Count)"
Write-Host "Generated files checked: $($generatedPaths.Count)"
Write-Host "Protected Plane source roots are unchanged: apps, packages"
