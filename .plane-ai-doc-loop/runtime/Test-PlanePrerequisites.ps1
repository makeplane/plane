param(
  [string]$PlanePath = ".",
  [switch]$RequireApplicationStack,
  [switch]$ProbeDockerEngine
)

$ErrorActionPreference = "Stop"
$root = (Resolve-Path -LiteralPath $PlanePath).Path
$packagePath = Join-Path $root "package.json"
$manifestPath = Join-Path $root ".plane-ai-doc-loop\manifest.json"

if (-not (Test-Path -LiteralPath $packagePath -PathType Leaf)) {
  throw "Plane package.json is missing: $packagePath"
}

function Resolve-Runtime {
  param(
    [string]$Name,
    [string]$BundledPattern
  )

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

function Get-VersionText {
  param(
    [string]$Path,
    [string[]]$Arguments
  )

  if (-not $Path) {
    return ""
  }
  $previousErrorActionPreference = $ErrorActionPreference
  try {
    $ErrorActionPreference = "Continue"
    $output = @(& $Path @Arguments 2>&1)
    $exitCode = $LASTEXITCODE
  } finally {
    $ErrorActionPreference = $previousErrorActionPreference
  }
  if ($exitCode -ne 0 -or $output.Count -eq 0) {
    return ""
  }
  return ($output[0].ToString()).Trim()
}

function Get-NumericVersion {
  param([string]$Text)

  $match = [regex]::Match($Text, "(?<version>\d+(?:\.\d+){1,3})")
  if (-not $match.Success) {
    return $null
  }
  return [version]$match.Groups["version"].Value
}

$package = Get-Content -LiteralPath $packagePath -Raw -Encoding UTF8 | ConvertFrom-Json
$requiredNodeText = "$($package.engines.node)"
$requiredNodeMatch = [regex]::Match($requiredNodeText, "(?<version>\d+(?:\.\d+){1,3})")
$requiredNode = if ($requiredNodeMatch.Success) { [version]$requiredNodeMatch.Groups["version"].Value } else { [version]"22.18.0" }

$gitPath = Resolve-Runtime -Name "git" -BundledPattern "*\dependencies\native\git\cmd\git.exe"
$pythonPath = Resolve-Runtime -Name "python" -BundledPattern "*\dependencies\python\python.exe"
$nodePath = Resolve-Runtime -Name "node" -BundledPattern "*\dependencies\node\bin\node.exe"
$pnpmPath = Resolve-Runtime -Name "pnpm" -BundledPattern "*\dependencies\bin\fallback\pnpm.cmd"
$dockerPath = Resolve-Runtime -Name "docker" -BundledPattern "*\dependencies\bin\fallback\docker.exe"
if (-not $dockerPath) {
  $dockerDesktopCli = Join-Path $env:ProgramFiles "Docker\Docker\resources\bin\docker.exe"
  if (Test-Path -LiteralPath $dockerDesktopCli -PathType Leaf) {
    $dockerPath = $dockerDesktopCli
  }
}

$gitVersionText = Get-VersionText -Path $gitPath -Arguments @("--version")
$pythonVersionText = Get-VersionText -Path $pythonPath -Arguments @("--version")
$nodeVersionText = Get-VersionText -Path $nodePath -Arguments @("--version")
$pnpmVersionText = ""
if ($pnpmPath) {
  $originalPath = $env:PATH
  try {
    if ($nodePath) {
      $env:PATH = "$(Split-Path -Parent $nodePath);$env:PATH"
    }
    $pnpmVersionText = Get-VersionText -Path $pnpmPath -Arguments @("--version")
  } finally {
    $env:PATH = $originalPath
  }
}

$nodeVersion = Get-NumericVersion -Text $nodeVersionText
$nodeReady = $null -ne $nodeVersion -and $nodeVersion -ge $requiredNode
$vcRuntimePaths = @(
  (Join-Path $env:SystemRoot "System32\vcruntime140.dll"),
  (Join-Path $env:SystemRoot "System32\vcruntime140_1.dll"),
  (Join-Path $env:SystemRoot "System32\msvcp140.dll")
)
$vcRuntimeReady = @($vcRuntimePaths | Where-Object { Test-Path -LiteralPath $_ -PathType Leaf }).Count -eq $vcRuntimePaths.Count
$dockerInstalled = [bool]$dockerPath
$dockerRunning = $false
$dockerProbeAttempted = $ProbeDockerEngine -or $RequireApplicationStack
if ($dockerInstalled -and $dockerProbeAttempted) {
  $probeOutput = Join-Path $env:TEMP "plane-docker-info-$PID.out"
  $probeError = Join-Path $env:TEMP "plane-docker-info-$PID.err"
  try {
    $process = Start-Process -FilePath $dockerPath -ArgumentList @("info", "--format", "{{.ServerVersion}}") `
      -RedirectStandardOutput $probeOutput -RedirectStandardError $probeError -PassThru -WindowStyle Hidden
    if ($process.WaitForExit(10000)) {
      $dockerRunning = $process.ExitCode -eq 0 -and
        (Test-Path -LiteralPath $probeOutput -PathType Leaf) -and
        -not [string]::IsNullOrWhiteSpace((Get-Content -LiteralPath $probeOutput -Raw -ErrorAction SilentlyContinue))
    } else {
      Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
    }
  } finally {
    Remove-Item -LiteralPath $probeOutput, $probeError -Force -ErrorAction SilentlyContinue
  }
}

$wslCommand = Get-Command wsl.exe -ErrorAction SilentlyContinue
$wslDistributionReady = $false
if ($wslCommand) {
  $previousErrorActionPreference = $ErrorActionPreference
  try {
    $ErrorActionPreference = "Continue"
    & $wslCommand.Source --list --quiet *> $null
    $wslDistributionReady = $LASTEXITCODE -eq 0
  } finally {
    $ErrorActionPreference = $previousErrorActionPreference
  }
}

$loopReady = (Test-Path -LiteralPath $manifestPath -PathType Leaf) -and [bool]$gitPath -and [bool]$pythonPath
$windowsFrontendReady = $loopReady -and $nodeReady -and [bool]$pnpmPath -and $vcRuntimeReady
$localContainerStackReady = $dockerRunning
$workflowPath = Join-Path $root ".github\workflows\plane-ai-doc-loop.yml"
$remoteBackendCiReady = (Test-Path -LiteralPath $workflowPath -PathType Leaf) -and
  (Test-Path -LiteralPath (Join-Path $root "docker-compose-test.yml") -PathType Leaf)
$applicationReady = $windowsFrontendReady -and $localContainerStackReady

$rows = @(
  [PSCustomObject]@{ Component = "AI doc loop"; Ready = $loopReady; Version = if (Test-Path -LiteralPath $manifestPath) { (Get-Content -LiteralPath $manifestPath -Raw -Encoding UTF8 | ConvertFrom-Json).version } else { "missing" }; Source = $manifestPath },
  [PSCustomObject]@{ Component = "Git"; Ready = [bool]$gitPath; Version = $gitVersionText; Source = $gitPath },
  [PSCustomObject]@{ Component = "Python"; Ready = [bool]$pythonPath; Version = $pythonVersionText; Source = $pythonPath },
  [PSCustomObject]@{ Component = "Node"; Ready = $nodeReady; Version = "$nodeVersionText (required $requiredNodeText)"; Source = $nodePath },
  [PSCustomObject]@{ Component = "pnpm"; Ready = [bool]$pnpmPath; Version = "$pnpmVersionText (project $($package.packageManager))"; Source = $pnpmPath },
  [PSCustomObject]@{ Component = "VC++ runtime"; Ready = $vcRuntimeReady; Version = if ($vcRuntimeReady) { (Get-Item -LiteralPath $vcRuntimePaths[0]).VersionInfo.FileVersion } else { "Microsoft Visual C++ 2015-2022 x64 is missing" }; Source = $vcRuntimePaths[0] },
  [PSCustomObject]@{ Component = "Docker engine"; Ready = $dockerRunning; Version = if (-not $dockerInstalled) { "not installed; optional for Windows frontend workflow" } elseif (-not $dockerProbeAttempted) { "installed; stopped/not probed by default" } elseif ($dockerRunning) { "running" } else { "installed; engine unavailable" }; Source = $dockerPath },
  [PSCustomObject]@{ Component = "WSL command"; Ready = [bool]$wslCommand; Version = if ($wslDistributionReady) { "distribution available" } elseif ($wslCommand) { "available; separate distribution not required by Docker Desktop" } else { "not installed" }; Source = if ($wslCommand) { $wslCommand.Source } else { "" } }
)

$rows | Format-Table -AutoSize
Write-Host ""
Write-Host "AI documentation loop ready: $loopReady"
Write-Host "Windows frontend checks ready: $windowsFrontendReady"
Write-Host "Remote backend CI configured: $remoteBackendCiReady"
Write-Host "Optional local Docker stack ready: $localContainerStackReady"
if (-not $localContainerStackReady) {
  Write-Host "Local Docker is optional. Keep it stopped and run backend pytest in GitHub Actions on ubuntu-latest."
}

if ($RequireApplicationStack -and -not $applicationReady) {
  exit 2
}
