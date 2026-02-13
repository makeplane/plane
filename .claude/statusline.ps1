#Requires -Version 5.1
# Custom Claude Code statusline for PowerShell
# Cross-platform support: Windows PowerShell 5.1+, PowerShell Core 7+
# Theme: detailed | Features: directory, git, model, usage, session, tokens
#
# Context Window Calculation:
# - 100% = compaction threshold (not model limit)
# - Self-calibrates via PreCompact hook
# - Falls back to smart defaults based on window size

# Set UTF-8 encoding
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

# Calibration file path (now in ck/ namespace - fixes #178)
$CalibrationPath = Join-Path (Join-Path $env:TEMP "ck") "calibration.json"

# Time conversion functions
function ConvertTo-Epoch {
    param([string]$Timestamp)

    try {
        $dt = [DateTime]::Parse($Timestamp).ToUniversalTime()
        $epoch = [DateTimeOffset]::new($dt).ToUnixTimeSeconds()
        return $epoch
    }
    catch {
        return 0
    }
}

function Format-TimeHM {
    param([long]$Epoch)

    try {
        $dt = [DateTimeOffset]::FromUnixTimeSeconds($Epoch).LocalDateTime
        return $dt.ToString("HH:mm")
    }
    catch {
        return "00:00"
    }
}

# Get smart default compact threshold based on context window size
# Research-based defaults:
# - 200k window: ~80% (160k) - confirmed from GitHub issues
# - 500k window: ~60% (300k) - estimated
# - 1M window: ~33% (330k) - derived from user observations
function Get-DefaultCompactThreshold {
    param([int]$ContextWindowSize)

    # Known thresholds (autocompact buffer = 22.5% for 200k)
    $KnownThresholds = @{
        200000 = 155000   # 77.5% - confirmed via /context
        1000000 = 330000  # 33% - 1M beta window
    }

    # Exact match
    if ($KnownThresholds.ContainsKey($ContextWindowSize)) {
        return $KnownThresholds[$ContextWindowSize]
    }

    # Tiered defaults based on window size
    if ($ContextWindowSize -ge 1000000) {
        return [Math]::Floor($ContextWindowSize * 0.33)
    }
    else {
        # Default: ~77.5% for standard windows (200k confirmed)
        return [Math]::Floor($ContextWindowSize * 0.775)
    }
}

# Read calibrated threshold from file if available
function Get-CompactThreshold {
    param([int]$ContextWindowSize)

    # Try to read calibration file
    if (Test-Path $CalibrationPath) {
        try {
            $calibration = Get-Content $CalibrationPath -Raw | ConvertFrom-Json
            $key = [string]$ContextWindowSize
            if ($calibration.$key -and $calibration.$key.threshold -gt 0) {
                return [int]$calibration.$key.threshold
            }
        }
        catch {
            # Silent fail - use defaults
        }
    }

    # Fall back to smart defaults
    return Get-DefaultCompactThreshold $ContextWindowSize
}

function Get-ProgressBar {
    param(
        [int]$Percent = 0,
        [int]$Width = 12
    )

    if ($Percent -lt 0) { $Percent = 0 }
    if ($Percent -gt 100) { $Percent = 100 }

    $filled = [Math]::Round($Percent * $Width / 100)
    $empty = $Width - $filled

    # ▰ (U+25B0) filled, ▱ (U+25B1) empty - smooth horizontal rectangles
    $bar = ("▰" * $filled) + ("▱" * $empty)
    return $bar
}

# Get severity emoji based on percentage (no color codes)
function Get-SeverityEmoji {
    param([int]$Percent)

    if ($Percent -ge 90) {
        return "🔴"      # Critical
    }
    elseif ($Percent -ge 70) {
        return "🟡"      # Warning
    }
    else {
        return "🟢"      # Healthy
    }
}

# Read JSON from stdin
try {
    $inputLines = @()
    while ($null -ne ($line = [Console]::In.ReadLine())) {
        $inputLines += $line
    }
    $inputJson = $inputLines -join "`n"

    if ([string]::IsNullOrWhiteSpace($inputJson)) {
        Write-Error "No input provided"
        exit 1
    }

    $data = $inputJson | ConvertFrom-Json
}
catch {
    Write-Error "Failed to parse JSON input: $_"
    exit 1
}

# Extract basic information
$currentDir = "unknown"
if ($data.workspace.current_dir) {
    $currentDir = $data.workspace.current_dir
}
elseif ($data.cwd) {
    $currentDir = $data.cwd
}

# Replace home directory with ~
$homeDir = $env:USERPROFILE
if (-not $homeDir) {
    $homeDir = $env:HOME
}
if ($homeDir -and $currentDir.StartsWith($homeDir)) {
    $currentDir = $currentDir.Replace($homeDir, "~")
}

$modelName = "Claude"
if ($data.model.display_name) {
    $modelName = $data.model.display_name
}

$modelVersion = ""
if ($data.model.version -and $data.model.version -ne "null") {
    $modelVersion = $data.model.version
}

# Git branch detection
$gitBranch = ""
try {
    $null = git rev-parse --git-dir 2>$null
    if ($LASTEXITCODE -eq 0) {
        $gitBranch = git branch --show-current 2>$null
        if ([string]::IsNullOrWhiteSpace($gitBranch)) {
            $gitBranch = git rev-parse --short HEAD 2>$null
        }
    }
}
catch {
    # Not in a git repository
}

# Context window usage (Claude Code v2.0.65+)
# Calculate percentage against COMPACT THRESHOLD, not model limit
# 100% = compaction imminent
$contextPercent = 0
$contextText = ""

$contextInput = 0
$contextOutput = 0
$contextSize = 0

if ($data.context_window) {
    $contextInput = [int]($data.context_window.total_input_tokens ?? 0)
    $contextOutput = [int]($data.context_window.total_output_tokens ?? 0)
    $contextSize = [int]($data.context_window.context_window_size ?? 0)
}

if ($contextSize -gt 0) {
    $contextTotal = $contextInput + $contextOutput
    $compactThreshold = Get-CompactThreshold $contextSize

    # Calculate percentage against compact threshold
    $contextPercent = [Math]::Floor($contextTotal * 100 / $compactThreshold)
    # Clamp to 100% max to handle edge cases
    if ($contextPercent -gt 100) { $contextPercent = 100 }

    # Get severity emoji and progress bar
    $severityEmoji = Get-SeverityEmoji $contextPercent
    $bar = Get-ProgressBar $contextPercent 12
    $contextText = "$severityEmoji $bar ${contextPercent}%"
}

# Session timer
$sessionText = ""

try {
    # Try npx first, then ccusage
    $blocksOutput = $null
    try {
        $blocksOutput = npx ccusage@latest blocks --json 2>$null
    }
    catch {
        try {
            $blocksOutput = ccusage blocks --json 2>$null
        }
        catch {
            # ccusage not available
        }
    }

    if ($blocksOutput) {
        $blocks = $blocksOutput | ConvertFrom-Json
        $activeBlock = $blocks.blocks | Where-Object { $_.isActive -eq $true } | Select-Object -First 1

        if ($activeBlock) {
            # Session time calculation
            $resetTimeStr = $activeBlock.usageLimitResetTime
            if (-not $resetTimeStr) {
                $resetTimeStr = $activeBlock.endTime
            }
            $startTimeStr = $activeBlock.startTime

            if ($resetTimeStr -and $startTimeStr) {
                $startSec = ConvertTo-Epoch $startTimeStr
                $endSec = ConvertTo-Epoch $resetTimeStr
                $nowSec = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()

                $total = $endSec - $startSec
                if ($total -lt 1) { $total = 1 }

                $elapsed = $nowSec - $startSec
                if ($elapsed -lt 0) { $elapsed = 0 }
                if ($elapsed -gt $total) { $elapsed = $total }

                $remaining = $endSec - $nowSec
                if ($remaining -lt 0) { $remaining = 0 }

                if ($remaining -gt 0 -and $remaining -lt 18000) {
                    $rh = [Math]::Floor($remaining / 3600)
                    $rm = [Math]::Floor(($remaining % 3600) / 60)
                    $endHM = Format-TimeHM $endSec
                    $sessionText = "${rh}h ${rm}m until reset at ${endHM}"
                }
            }
        }
    }
}
catch {
    # Silent fail - ccusage not available
}

# Render statusline (no ANSI colors - emoji only)
$output = ""
$output += "📁 ${currentDir}"

# Git branch
if ($gitBranch) {
    $output += "  🌿 ${gitBranch}"
}

# Model
$output += "  🤖 ${modelName}"

# Model version
if ($modelVersion) {
    $output += " ${modelVersion}"
}

# Session time
if ($sessionText) {
    $output += "  ⌛ ${sessionText}"
}

# Context window usage (Claude Code v2.0.65+)
if ($contextText) {
    $output += "  $contextText"
}

Write-Host $output
