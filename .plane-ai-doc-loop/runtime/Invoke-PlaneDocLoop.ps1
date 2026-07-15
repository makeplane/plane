param(
  [string]$PlanePath = ".",
  [string]$DiffBase = "",
  [string]$PythonPath = "",
  [string]$GitPath = "",
  [switch]$SkipImpact
)

$ErrorActionPreference = "Stop"
$root = (Resolve-Path -LiteralPath $PlanePath).Path

function Resolve-PythonRuntime {
  if ($PythonPath) {
    if (-not (Test-Path -LiteralPath $PythonPath -PathType Leaf)) {
      throw "PythonPath does not exist: $PythonPath"
    }
    return @{ Path = (Resolve-Path -LiteralPath $PythonPath).Path; Prefix = @() }
  }

  $python = Get-Command python -ErrorAction SilentlyContinue
  if ($python) {
    return @{ Path = $python.Source; Prefix = @() }
  }

  $py = Get-Command py -ErrorAction SilentlyContinue
  if ($py) {
    return @{ Path = $py.Source; Prefix = @("-3") }
  }

  $runtimeRoot = Join-Path $HOME ".cache\codex-runtimes"
  $bundled = Get-ChildItem -Path (Join-Path $runtimeRoot "*\dependencies\python\python.exe") -File -ErrorAction SilentlyContinue |
    Sort-Object LastWriteTime -Descending |
    Select-Object -First 1
  if ($bundled) {
    return @{ Path = $bundled.FullName; Prefix = @() }
  }

  throw "Python was not found. Pass -PythonPath or install Python 3.8+."
}

function Resolve-GitRuntime {
  if ($GitPath) {
    if (-not (Test-Path -LiteralPath $GitPath -PathType Leaf)) {
      throw "GitPath does not exist: $GitPath"
    }
    return (Resolve-Path -LiteralPath $GitPath).Path
  }

  $git = Get-Command git -ErrorAction SilentlyContinue
  if ($git) {
    return $git.Source
  }

  $runtimeRoot = Join-Path $HOME ".cache\codex-runtimes"
  $bundled = Get-ChildItem -Path (Join-Path $runtimeRoot "*\dependencies\native\git\cmd\git.exe") -File -ErrorAction SilentlyContinue |
    Sort-Object LastWriteTime -Descending |
    Select-Object -First 1
  if ($bundled) {
    return $bundled.FullName
  }

  throw "Git was not found. Pass -GitPath or install Git."
}

function Invoke-Python {
  param([string[]]$Arguments)

  $runtimeArguments = @($script:PythonRuntime.Prefix) + $Arguments
  & $script:PythonRuntime.Path @runtimeArguments
  if ($LASTEXITCODE -ne 0) {
    throw "Python command failed with exit code ${LASTEXITCODE}: $($Arguments -join ' ')"
  }
}

if (-not (Test-Path -LiteralPath (Join-Path $root "pnpm-workspace.yaml"))) {
  throw "PlanePath does not look like the Plane repository root: $root"
}

$script:PythonRuntime = Resolve-PythonRuntime
$resolvedGitPath = if ($SkipImpact) { "" } else { Resolve-GitRuntime }

Write-Host "Python runtime: $($script:PythonRuntime.Path)"
if ($resolvedGitPath) {
  Write-Host "Git runtime: $resolvedGitPath"
}

Push-Location $root
try {
  Invoke-Python @(".plane-ai-doc-loop/runtime/validate_skills.py", "--root", $root)
  Invoke-Python @(".plane-ai-doc-loop/runtime/validate_workflow.py", "--root", $root)
  Invoke-Python @(".plane-ai-doc-loop/runtime/validate_semantic.py", "--root", $root, "--strict-paths", "--require-baseline")
  Invoke-Python @(".plane-ai-doc-loop/runtime/plane_repo_snapshot.py", "--root", $root)
  if (-not $SkipImpact) {
    if ($DiffBase) {
      Invoke-Python @(".plane-ai-doc-loop/runtime/impact_from_git_diff.py", "--root", $root, "--base", $DiffBase, "--git", $resolvedGitPath)
    } else {
      Invoke-Python @(".plane-ai-doc-loop/runtime/impact_from_git_diff.py", "--root", $root, "--git", $resolvedGitPath)
    }
  }
  Invoke-Python @(".plane-ai-doc-loop/runtime/validate_semantic.py", "--root", $root, "--strict-paths", "--require-baseline", "--require-generated")

  Write-Host ""
  Write-Host "Plane AI documentation loop completed."
  Write-Host "Next:"
  Write-Host "  1. Ask Codex or ChatGPT Desktop to use `$plane-project-understand for docs/semantic/local_scan.json."
  Write-Host "  2. For a feature, fill docs/ai/change-request-template.md, then use `$plane-doc-code-loop."
  Write-Host "  3. Before committing, use `$plane-doc-consistency-review and run pnpm/Docker checks."
} finally {
  Pop-Location
}
