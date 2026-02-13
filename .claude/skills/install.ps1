# Skills Installation Script for Windows (PowerShell)
# Installs all dependencies for Claude Code skills
#
# Exit codes (rustup model):
#   0 = Success (full or partial)
#   1 = Fatal error (no Python, broken venv)
#   2 = Partial success (some optional deps failed)

param(
    [switch]$SkipChocolatey = $false,
    [switch]$Help = $false,
    [switch]$Y = $false,           # Skip all prompts and auto-confirm
    [switch]$WithAdmin = $false,   # Use admin-requiring package managers (choco)
    [switch]$Resume = $false,      # Resume from previous interrupted installation
    [switch]$RetryFailed = $false, # Retry previously failed packages
    [ValidateSet("auto", "winget", "scoop", "choco")]
    [string]$PreferPackageManager = "auto"  # Preferred package manager (soft fallback to auto if unavailable)
)

# Configuration
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$VenvDir = Join-Path $ScriptDir ".venv"
$StateFile = Join-Path $ScriptDir ".install-state.json"
$LogDir = Join-Path $VenvDir "logs"
$ErrorSummaryFile = Join-Path $ScriptDir ".install-error-summary.json"

# Check for NON_INTERACTIVE environment variable
if ($env:NON_INTERACTIVE -eq "1") {
    $Y = $true
}

# ============================================================================
# Installation Tracking Variables
# ============================================================================
$Script:INSTALLED_CRITICAL = [System.Collections.ArrayList]::new()
$Script:INSTALLED_OPTIONAL = [System.Collections.ArrayList]::new()
$Script:FAILED_OPTIONAL = [System.Collections.ArrayList]::new()
$Script:SKIPPED_ADMIN = [System.Collections.ArrayList]::new()
$Script:FINAL_EXIT_CODE = 0

# ============================================================================
# Tracking Functions
# ============================================================================
function Track-Success {
    param(
        [string]$Category,  # "critical" or "optional"
        [string]$Name
    )
    if ($Category -eq "critical") {
        [void]$Script:INSTALLED_CRITICAL.Add($Name)
    } else {
        [void]$Script:INSTALLED_OPTIONAL.Add($Name)
    }
}

function Track-Failure {
    param(
        [string]$Category,  # "critical" or "optional"
        [string]$Name,
        [string]$Reason
    )
    if ($Category -eq "critical") {
        $Script:FINAL_EXIT_CODE = 1
    } else {
        [void]$Script:FAILED_OPTIONAL.Add("${Name}: ${Reason}")
        if ($Script:FINAL_EXIT_CODE -eq 0) {
            $Script:FINAL_EXIT_CODE = 2
        }
    }
}

function Track-Skipped {
    param(
        [string]$Name,
        [string]$Reason
    )
    [void]$Script:SKIPPED_ADMIN.Add("${Name}: ${Reason}")
}

# ============================================================================
# State Persistence Functions
# ============================================================================
function Initialize-State {
    if ($Resume -and (Test-Path $StateFile)) {
        Write-Info "Resuming from previous installation..."
        # Load state and validate preference consistency
        $state = Get-Content $StateFile -Raw | ConvertFrom-Json
        if ($state.PSObject.Properties['prefer_package_manager']) {
            if ($state.prefer_package_manager -ne $Script:PreferPackageManager) {
                Write-Warning "Preference changed from '$($state.prefer_package_manager)' to '$($Script:PreferPackageManager)'"
                Write-Warning "Using original preference: $($state.prefer_package_manager)"
                $Script:PreferPackageManager = $state.prefer_package_manager
            }
        }
        return
    }

    # Create fresh state
    $state = @{
        version = 1
        started_at = (Get-Date -Format "yyyy-MM-ddTHH:mm:ssZ")
        last_updated = (Get-Date -Format "yyyy-MM-ddTHH:mm:ssZ")
        prefer_package_manager = $Script:PreferPackageManager
        phases = @{
            chocolatey = "pending"
            system_deps = "pending"
            node_deps = "pending"
            python_env = "pending"
            verify = "pending"
        }
        packages = @{
            installed = @()
            failed = @()
            skipped = @()
        }
    }
    $state | ConvertTo-Json -Depth 5 | Set-Content $StateFile -Encoding UTF8
}

function Update-Phase {
    param(
        [string]$Phase,
        [string]$Status
    )
    if (-not (Test-Path $StateFile)) {
        return
    }

    $state = Get-Content $StateFile -Raw | ConvertFrom-Json
    $state.phases.$Phase = $Status
    $state.last_updated = (Get-Date -Format "yyyy-MM-ddTHH:mm:ssZ")
    $state | ConvertTo-Json -Depth 5 | Set-Content $StateFile -Encoding UTF8
}

function Test-PhaseDone {
    param([string]$Phase)
    if (-not (Test-Path $StateFile)) {
        return $false
    }
    $state = Get-Content $StateFile -Raw | ConvertFrom-Json
    return ($state.phases.$Phase -eq "done")
}

function Remove-StateFile {
    if (Test-Path $StateFile) {
        Remove-Item $StateFile -Force
        Write-Info "Installation state cleaned (success)"
    }
}

# Colors for output
function Write-Header {
    param([string]$Message)
    Write-Host ""
    Write-Host "===================================================" -ForegroundColor Blue
    Write-Host $Message -ForegroundColor Blue
    Write-Host "===================================================" -ForegroundColor Blue
    Write-Host ""
}

function Write-Success {
    param([string]$Message)
    Write-Host "[OK] $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARN] $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

function Write-Info {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Cyan
}

# Check if running as Administrator
function Test-Administrator {
    $currentUser = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($currentUser)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

# Check if command exists and is functional (not just in PATH)
# Validates: command exists, is not a broken alias, and responds to --version
function Test-Command {
    param([string]$Command)
    try {
        $cmd = Get-Command $Command -ErrorAction SilentlyContinue
        if (-not $cmd) {
            return $false
        }

        # Skip aliases that don't resolve to applications
        if ($cmd.CommandType -eq 'Alias') {
            $resolved = Get-Command $cmd.Definition -ErrorAction SilentlyContinue
            if (-not $resolved -or $resolved.CommandType -ne 'Application') {
                return $false
            }
        }

        # For package managers, verify they actually respond
        if ($Command -in @('winget', 'scoop', 'choco')) {
            $null = & $Command --version 2>$null
            return ($LASTEXITCODE -eq 0)
        }

        return $true
    } catch {
        return $false
    }
}

# Check if Visual Studio Build Tools are installed (not just in PATH)
# Returns $true if VS Build Tools are available for compilation
function Test-VSBuildTools {
    # Quick check: if cl.exe or gcc is in PATH, we're good
    if ((Test-Command "cl") -or (Test-Command "gcc")) {
        return $true
    }

    # Check via vswhere.exe (most reliable method for VS detection)
    $vswherePaths = @(
        "${env:ProgramFiles(x86)}\Microsoft Visual Studio\Installer\vswhere.exe",
        "${env:ProgramFiles}\Microsoft Visual Studio\Installer\vswhere.exe"
    )

    foreach ($vswhere in $vswherePaths) {
        if (Test-Path $vswhere) {
            try {
                # Check for any VS installation with C++ build tools
                $vsPath = & $vswhere -latest -requires Microsoft.VisualStudio.Component.VC.Tools.x86.x64 -property installationPath 2>$null
                if ($vsPath -and (Test-Path $vsPath)) {
                    return $true
                }
                # Fallback: check for any VS installation
                $vsPath = & $vswhere -latest -property installationPath 2>$null
                if ($vsPath -and (Test-Path $vsPath)) {
                    return $true
                }
            } catch {
                # vswhere failed, continue to fallback checks
            }
        }
    }

    # Fallback: check common VS Build Tools installation paths
    $commonPaths = @(
        "${env:ProgramFiles(x86)}\Microsoft Visual Studio\2022\BuildTools",
        "${env:ProgramFiles(x86)}\Microsoft Visual Studio\2022\Community",
        "${env:ProgramFiles(x86)}\Microsoft Visual Studio\2022\Professional",
        "${env:ProgramFiles(x86)}\Microsoft Visual Studio\2022\Enterprise",
        "${env:ProgramFiles(x86)}\Microsoft Visual Studio\2019\BuildTools",
        "${env:ProgramFiles(x86)}\Microsoft Visual Studio\2019\Community"
    )

    foreach ($vsPath in $commonPaths) {
        if (Test-Path $vsPath) {
            # Check if VC tools exist in this installation
            $vcToolsPath = Join-Path $vsPath "VC\Tools\MSVC"
            if (Test-Path $vcToolsPath) {
                return $true
            }
        }
    }

    return $false
}

# Find Python executable, handling Windows Store aliases
# Returns: hashtable with 'Path' and 'Version', or $null if not found
function Find-Python {
    # Priority 1: Check py launcher first (most reliable on Windows)
    $py = Get-Command py -ErrorAction SilentlyContinue
    if ($py) {
        try {
            $version = (& py --version 2>&1)
            if ($LASTEXITCODE -eq 0 -and $version -match 'Python') {
                return @{ Path = $py.Source; Version = $version; Command = "py" }
            }
        } catch { }
    }

    # Priority 2: Check common Python install paths
    $commonPaths = @(
        "$env:LOCALAPPDATA\Programs\Python\Python3*\python.exe",
        "$env:LOCALAPPDATA\Programs\Python\Python*\python.exe",
        "C:\Python3*\python.exe",
        "C:\Python*\python.exe",
        "$env:ProgramFiles\Python3*\python.exe",
        "$env:ProgramFiles\Python*\python.exe",
        "$env:ProgramFiles(x86)\Python3*\python.exe"
    )

    foreach ($pathPattern in $commonPaths) {
        $found = Get-Item $pathPattern -ErrorAction SilentlyContinue | Sort-Object Name -Descending | Select-Object -First 1
        if ($found) {
            try {
                $version = (& $found.FullName --version 2>&1)
                if ($LASTEXITCODE -eq 0 -and $version -match 'Python') {
                    return @{ Path = $found.FullName; Version = $version; Command = $found.FullName }
                }
            } catch { }
        }
    }

    # Priority 3: Check PATH but detect Windows Store alias
    $python = Get-Command python -ErrorAction SilentlyContinue
    if ($python) {
        # Detect Windows Store alias (points to WindowsApps)
        if ($python.Source -like "*WindowsApps*") {
            Write-Warning "Windows Store Python alias detected at: $($python.Source)"
            Write-Warning "This alias redirects to Microsoft Store instead of running Python."
            Write-Info "To fix this, either:"
            Write-Info "  1. Install Python from https://www.python.org/downloads/"
            Write-Info "  2. Or disable the alias: Settings > Apps > Advanced app settings > App execution aliases"
            Write-Info "     Then turn off 'python.exe' and 'python3.exe'"
            return $null
        }

        # Valid Python in PATH
        try {
            $version = (& python --version 2>&1)
            if ($LASTEXITCODE -eq 0 -and $version -match 'Python') {
                return @{ Path = $python.Source; Version = $version; Command = "python" }
            }
        } catch { }
    }

    # Priority 4: Try python3 command
    $python3 = Get-Command python3 -ErrorAction SilentlyContinue
    if ($python3 -and -not ($python3.Source -like "*WindowsApps*")) {
        try {
            $version = (& python3 --version 2>&1)
            if ($LASTEXITCODE -eq 0 -and $version -match 'Python') {
                return @{ Path = $python3.Source; Version = $version; Command = "python3" }
            }
        } catch { }
    }

    return $null
}

# Get available package manager with preference support (soft fallback to auto-detection)
# Priority for auto: winget > scoop > choco
function Get-PackageManager {
    param([string]$Preference = "auto")

    # If preference specified, try it first
    if ($Preference -ne "auto") {
        if (Test-Command $Preference) {
            return $Preference
        }
        # Auto-detect for better warning message
        $autoDetected = $null
        if (Test-Command "winget") { $autoDetected = "winget" }
        elseif (Test-Command "scoop") { $autoDetected = "scoop" }
        elseif (Test-Command "choco") { $autoDetected = "choco" }

        if ($autoDetected) {
            Write-Warning "Preferred '$Preference' not found, using auto-detected: $autoDetected"
            return $autoDetected
        } else {
            Write-Warning "Preferred '$Preference' not found, no package manager available"
            return $null
        }
    }

    # Auto-detection (priority: winget > scoop > choco)
    if (Test-Command "winget") { return "winget" }
    if (Test-Command "scoop") { return "scoop" }
    if (Test-Command "choco") { return "choco" }
    return $null
}

# Install package using available package manager
# Returns $true if installed, $false if failed
# Now with tracking support
function Install-WithPackageManager {
    param(
        [string]$DisplayName,
        [string]$WingetId,
        [string]$ChocoName,
        [string]$ScoopName,
        [string]$ManualUrl,
        [string]$Category = "optional"  # "critical" or "optional"
    )

    $pm = Get-PackageManager -Preference $Script:PreferPackageManager

    switch ($pm) {
        $null {
            # No package manager available - provide manual install guidance
            Write-Warning "$DisplayName not installed. No package manager available."
            Write-Info "Install manually from: $ManualUrl"
            Track-Failure -Category $Category -Name $DisplayName -Reason "no package manager"
            return $false
        }
        "winget" {
            Write-Info "Installing $DisplayName via winget..."
            # Try user scope first, fallback to machine scope
            winget install $WingetId --silent --accept-package-agreements --accept-source-agreements --scope user 2>$null
            if ($LASTEXITCODE -ne 0) {
                # Retry without scope restriction (some packages only support machine-wide)
                winget install $WingetId --silent --accept-package-agreements --accept-source-agreements 2>$null
            }
            if ($LASTEXITCODE -eq 0) {
                Write-Success "$DisplayName installed via winget"
                Track-Success -Category $Category -Name $DisplayName
                return $true
            }
        }
        "scoop" {
            Write-Info "Installing $DisplayName via scoop..."
            scoop install $ScoopName 2>$null
            if ($LASTEXITCODE -eq 0) {
                Write-Success "$DisplayName installed via scoop"
                Track-Success -Category $Category -Name $DisplayName
                return $true
            }
        }
        "choco" {
            if ($WithAdmin -and (Test-Administrator)) {
                Write-Info "Installing $DisplayName via chocolatey..."
                choco install $ChocoName -y 2>$null
                if ($LASTEXITCODE -eq 0) {
                    Write-Success "$DisplayName installed via chocolatey"
                    Track-Success -Category $Category -Name $DisplayName
                    return $true
                }
            } elseif (-not $WithAdmin) {
                Write-Info "${DisplayName}: skipped (no -WithAdmin flag)"
                Track-Skipped -Name $DisplayName -Reason "requires admin"
                return $false
            } else {
                Write-Warning "Chocolatey requires admin. Skipping $DisplayName..."
                Track-Skipped -Name $DisplayName -Reason "not running as admin"
                return $false
            }
        }
    }

    Write-Warning "$DisplayName not installed. Install manually from: $ManualUrl"
    Track-Failure -Category $Category -Name $DisplayName -Reason "installation failed"
    return $false
}

# Get user input with support for redirected stdin
function Get-UserInput {
    param(
        [string]$Prompt,
        [string]$Default = "N"
    )

    # Check if stdin is redirected (e.g., from Bash tool or piped input)
    if ([Console]::IsInputRedirected) {
        Write-Host "$Prompt " -NoNewline

        # Try to read from stdin without blocking
        $inputAvailable = $false
        try {
            $stdin = [Console]::In
            # Peek returns -1 if no data available
            if ($stdin.Peek() -ne -1) {
                $response = $stdin.ReadLine()
                $inputAvailable = $true
                Write-Host $response
            }
        } catch {
            # If peek fails, no input available
        }

        if ($inputAvailable -and $response) {
            return $response
        } else {
            # No input available, use default
            Write-Host $Default
            Write-Warning "No input detected (stdin redirected), using default: $Default"
            return $Default
        }
    } else {
        # Normal interactive mode - use standard Read-Host
        return Read-Host $Prompt
    }
}

# Install Chocolatey (optional - only if admin and no better PM available)
function Install-Chocolatey {
    if ($SkipChocolatey) {
        Write-Warning "Skipping Chocolatey installation (--SkipChocolatey flag)"
        return $false
    }

    if (Test-Command "choco") {
        Write-Success "Chocolatey already installed"
        return $true
    }

    # Check if we have winget/scoop - no need for choco then
    if ((Test-Command "winget") -or (Test-Command "scoop")) {
        $pm = Get-PackageManager -Preference $Script:PreferPackageManager
        Write-Info "Using $pm as package manager (Chocolatey not needed)"
        return $false
    }

    # Only try to install choco if we're admin and have no other PM
    if (-not (Test-Administrator)) {
        Write-Warning "No package manager found. Options:"
        Write-Info "  1. Run as Administrator to install Chocolatey"
        Write-Info "  2. Install winget (recommended): https://aka.ms/getwinget"
        Write-Info "  3. Install scoop: irm get.scoop.sh | iex"
        return $false
    }

    Write-Info "Installing Chocolatey package manager..."

    # Wrap Set-ExecutionPolicy in try-catch (may fail in some PS7 environments)
    try {
        Set-ExecutionPolicy Bypass -Scope Process -Force
    } catch {
        Write-Warning "Could not set execution policy: $($_.Exception.Message)"
        Write-Info "Continuing anyway - Chocolatey install may prompt for confirmation"
    }

    try {
        [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
        Invoke-Expression ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
        Write-Success "Chocolatey installed"
        return $true
    } catch {
        Write-Warning "Failed to install Chocolatey: $($_.Exception.Message)"
        return $false
    }
}

# Install system dependencies
function Install-SystemDeps {
    Write-Header "Installing System Dependencies"

    $pm = Get-PackageManager -Preference $Script:PreferPackageManager
    if ($pm) {
        Write-Info "Using package manager: $pm"
    } else {
        Write-Warning "No package manager found. Will provide manual install instructions."
    }

    # FFmpeg
    if (Test-Command "ffmpeg") {
        $ffmpegVersion = (ffmpeg -version 2>&1 | Select-Object -First 1)
        Write-Success "FFmpeg already installed ($ffmpegVersion)"
        Track-Success -Category "optional" -Name "FFmpeg"
    } else {
        $null = Install-WithPackageManager `
            -DisplayName "FFmpeg" `
            -WingetId "Gyan.FFmpeg" `
            -ChocoName "ffmpeg" `
            -ScoopName "ffmpeg" `
            -ManualUrl "https://ffmpeg.org/download.html" `
            -Category "optional"
    }

    # ImageMagick
    if (Test-Command "magick") {
        Write-Success "ImageMagick already installed"
        Track-Success -Category "optional" -Name "ImageMagick"
    } else {
        $null = Install-WithPackageManager `
            -DisplayName "ImageMagick" `
            -WingetId "ImageMagick.ImageMagick" `
            -ChocoName "imagemagick" `
            -ScoopName "imagemagick" `
            -ManualUrl "https://imagemagick.org/script/download.php" `
            -Category "optional"
    }

    # Docker (optional)
    if (Test-Command "docker") {
        $dockerVersion = (docker --version)
        Write-Success "Docker already installed ($dockerVersion)"
        Track-Success -Category "optional" -Name "Docker"
    } else {
        Write-Warning "Docker not found. Skipping (optional)..."
        Write-Info "Install Docker from: https://docs.docker.com/desktop/install/windows-install/"
    }
}

# Install Node.js and npm packages
function Install-NodeDeps {
    Write-Header "Installing Node.js Dependencies"

    # Check Node.js
    if (Test-Command "node") {
        $nodeVersion = (node --version)
        Write-Success "Node.js already installed ($nodeVersion)"
    } else {
        $installed = Install-WithPackageManager `
            -DisplayName "Node.js" `
            -WingetId "OpenJS.NodeJS.LTS" `
            -ChocoName "nodejs-lts" `
            -ScoopName "nodejs-lts" `
            -ManualUrl "https://nodejs.org/"

        if (-not $installed) {
            Write-Error "Node.js is required but could not be installed"
            Write-Info "Please install Node.js manually and re-run this script"
            exit 1
        }

        # Refresh PATH after Node.js install
        $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
    }

    # Install global npm packages
    Write-Info "Installing global npm packages..."

    $npmPackages = @(
        "rmbg-cli",
        "pnpm",
        "wrangler",
        "repomix"
    )

    foreach ($package in $npmPackages) {
        try {
            $installed = npm list -g $package 2>&1
            if ($LASTEXITCODE -eq 0) {
                Write-Success "$package already installed"
            } else {
                Write-Info "Installing $package..."
                npm install -g $package
                Write-Success "$package installed"
            }
        } catch {
            Write-Info "Installing $package..."
            npm install -g $package
            Write-Success "$package installed"
        }
    }

    # Install local npm packages for skills
    Write-Info "Installing local npm packages for skills..."

    # chrome-devtools
    $chromeDevToolsPath = Join-Path $ScriptDir "chrome-devtools\scripts"
    $chromePackageJson = Join-Path $chromeDevToolsPath "package.json"
    if ((Test-Path $chromeDevToolsPath) -and (Test-Path $chromePackageJson)) {
        Write-Info "Installing chrome-devtools dependencies..."
        Push-Location $chromeDevToolsPath
        npm install --quiet
        Pop-Location
        Write-Success "chrome-devtools dependencies installed"
    }

    # sequential-thinking
    $seqThinkingPath = Join-Path $ScriptDir "sequential-thinking"
    $seqPackageJson = Join-Path $seqThinkingPath "package.json"
    if ((Test-Path $seqThinkingPath) -and (Test-Path $seqPackageJson)) {
        Write-Info "Installing sequential-thinking dependencies..."
        Push-Location $seqThinkingPath
        npm install --quiet
        Pop-Location
        Write-Success "sequential-thinking dependencies installed"
    }

    # mcp-management
    $mcpManagementPath = Join-Path $ScriptDir "mcp-management\scripts"
    $mcpPackageJson = Join-Path $mcpManagementPath "package.json"
    if ((Test-Path $mcpManagementPath) -and (Test-Path $mcpPackageJson)) {
        Write-Info "Installing mcp-management dependencies..."
        Push-Location $mcpManagementPath
        npm install --quiet
        Pop-Location
        Write-Success "mcp-management dependencies installed"
    }

    # markdown-novel-viewer (marked, highlight.js, gray-matter)
    $novelViewerPath = Join-Path $ScriptDir "markdown-novel-viewer"
    $novelViewerPackageJson = Join-Path $novelViewerPath "package.json"
    if ((Test-Path $novelViewerPath) -and (Test-Path $novelViewerPackageJson)) {
        Write-Info "Installing markdown-novel-viewer dependencies..."
        Push-Location $novelViewerPath
        npm install --quiet
        Pop-Location
        Write-Success "markdown-novel-viewer dependencies installed"
    }

    # plans-kanban (gray-matter)
    $plansKanbanPath = Join-Path $ScriptDir "plans-kanban"
    $plansKanbanPackageJson = Join-Path $plansKanbanPath "package.json"
    if ((Test-Path $plansKanbanPath) -and (Test-Path $plansKanbanPackageJson)) {
        Write-Info "Installing plans-kanban dependencies..."
        Push-Location $plansKanbanPath
        npm install --quiet
        Pop-Location
        Write-Success "plans-kanban dependencies installed"
    }

    # Optional: Shopify CLI (ask user unless auto-confirming)
    $shopifyPath = Join-Path $ScriptDir "shopify"
    if (Test-Path $shopifyPath) {
        if ($Y) {
            Write-Info "Skipping Shopify CLI installation (optional, use -Y to install all)"
        } else {
            $confirmation = Get-UserInput -Prompt "Install Shopify CLI for Shopify skill? (y/N)" -Default "N"
            if ($confirmation -eq 'y' -or $confirmation -eq 'Y') {
                Write-Info "Installing Shopify CLI..."
                npm install -g @shopify/cli @shopify/theme
                Write-Success "Shopify CLI installed"
            }
        }
    }
}

# Try pip install with wheel-first fallback
# Returns $true if successful, $false otherwise
function Try-PipInstall {
    param(
        [string]$PackageSpec,
        [string]$LogFile
    )

    $packageName = ($PackageSpec -split '[=<>]')[0]

    # Phase 1: Try with prefer-binary (wheels first)
    $output = pip install $PackageSpec --prefer-binary 2>&1
    $output | Out-File -Append $LogFile -Encoding UTF8
    if ($LASTEXITCODE -eq 0) {
        return $true
    }

    # Phase 2: Check if we can build from source (uses vswhere for proper VS detection)
    if (-not (Test-VSBuildTools)) {
        Write-Warning "${packageName}: No wheel available, no build tools detected"
        Write-Info "Install Visual Studio Build Tools from: https://visualstudio.microsoft.com/visual-cpp-build-tools/"
        return $false
    }

    # Phase 3: Try source build
    Write-Info "Trying source build for $packageName..."
    $output = pip install $PackageSpec --no-binary $packageName 2>&1
    $output | Out-File -Append $LogFile -Encoding UTF8
    if ($LASTEXITCODE -eq 0) {
        Write-Success "$packageName installed (source build)"
        return $true
    }

    Write-Error "${packageName}: Both wheel and source build failed"
    return $false
}

# Setup Python virtual environment
function Setup-PythonEnv {
    Write-Header "Setting Up Python Environment"

    # Suppress pip version check notices that trigger PowerShell NativeCommandError
    # Set early to affect all pip operations in this function
    $env:PIP_DISABLE_PIP_VERSION_CHECK = "1"

    # Track successful and failed installations
    $successfulSkills = [System.Collections.ArrayList]::new()
    $failedSkills = [System.Collections.ArrayList]::new()

    # Find Python using robust detection (handles Windows Store aliases)
    $pythonInfo = Find-Python
    if ($pythonInfo) {
        Write-Success "Python found ($($pythonInfo.Version))"
        Write-Info "Using: $($pythonInfo.Command)"
        $pythonCmd = $pythonInfo.Command
    } else {
        Write-Error "Python not found or only Windows Store alias detected."
        Write-Info "Please install Python 3.7+ from: https://www.python.org/downloads/"
        Write-Info "Make sure to check 'Add Python to PATH' during installation"
        Track-Failure -Category "critical" -Name "Python" -Reason "not installed or Store alias"
        return  # Don't exit, return and let final report show
    }

    # Create virtual environment
    if (Test-Path $VenvDir) {
        # Verify venv is valid
        $activateScript = Join-Path $VenvDir "Scripts\Activate.ps1"
        $pythonExe = Join-Path $VenvDir "Scripts\python.exe"
        if ((Test-Path $activateScript) -and (Test-Path $pythonExe)) {
            Write-Success "Virtual environment already exists at $VenvDir"
        } else {
            Write-Warning "Virtual environment is corrupted. Recreating..."
            Remove-Item -Recurse -Force $VenvDir
            & $pythonCmd -m venv $VenvDir
            Write-Success "Virtual environment recreated"
        }
    } else {
        Write-Info "Creating virtual environment at $VenvDir..."
        & $pythonCmd -m venv $VenvDir
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Virtual environment created"
        } else {
            Write-Error "Failed to create virtual environment"
            Track-Failure -Category "critical" -Name "Python venv" -Reason "venv creation failed"
            return
        }
    }

    # Create log directory
    if (-not (Test-Path $LogDir)) {
        New-Item -ItemType Directory -Path $LogDir -Force | Out-Null
    }

    # Activate and install packages
    Write-Info "Activating virtual environment..."
    $activateScript = Join-Path $VenvDir "Scripts\Activate.ps1"

    if (Test-Path $activateScript) {
        & $activateScript
    } else {
        Write-Error "Failed to find activation script at $activateScript"
        Track-Failure -Category "critical" -Name "Python venv" -Reason "activation failed"
        return
    }

    # Upgrade pip with prefer-binary
    Write-Info "Upgrading pip..."
    $pipLogFile = Join-Path $LogDir "pip-upgrade.log"
    $venvPython = Join-Path $VenvDir "Scripts\python.exe"
    & $venvPython -m pip install --upgrade pip --prefer-binary 2>&1 | Tee-Object -FilePath $pipLogFile
    if ($LASTEXITCODE -eq 0) {
        Write-Success "pip upgraded successfully"
    } else {
        Write-Warning "pip upgrade failed (continuing anyway)"
        Write-Info "See log: $pipLogFile"
    }

    # Install dependencies from all skills' requirements.txt files
    Write-Info "Installing Python dependencies from all skills..."

    $installedCount = 0
    Get-ChildItem -Path $ScriptDir -Directory | ForEach-Object {
        $skillName = $_.Name

        # Skip .venv and document-skills
        if ($skillName -eq ".venv" -or $skillName -eq "document-skills") {
            return
        }

        # Install main requirements.txt with wheel-first approach
        $requirementsPath = Join-Path $_.FullName "scripts\requirements.txt"
        if (Test-Path $requirementsPath) {
            $skillLogFile = Join-Path $LogDir "install-${skillName}.log"
            Write-Info "Installing $skillName dependencies..."

            # Read requirements and install one-by-one for granular tracking
            $pkgSuccess = 0
            $pkgFail = 0
            Get-Content $requirementsPath | ForEach-Object {
                $line = $_.Trim()
                # Skip comments and empty lines
                if ($line -match '^#' -or [string]::IsNullOrWhiteSpace($line)) {
                    return
                }

                # Strip inline comments (e.g., "package>=1.0  # comment" -> "package>=1.0")
                $line = ($line -split '#')[0].Trim()
                if ([string]::IsNullOrWhiteSpace($line)) {
                    return
                }

                if (Try-PipInstall -PackageSpec $line -LogFile $skillLogFile) {
                    $pkgSuccess++
                } else {
                    $pkgFail++
                    Track-Failure -Category "optional" -Name "${skillName}:${line}" -Reason "Package install failed"
                }
            }

            if ($pkgFail -eq 0) {
                Write-Success "${skillName}: all $pkgSuccess packages installed"
                Track-Success -Category "optional" -Name $skillName
                [void]$successfulSkills.Add($skillName)
                $installedCount++
            } else {
                Write-Warning "${skillName}: $pkgSuccess installed, $pkgFail failed"
                [void]$failedSkills.Add($skillName)
            }
        }

        # Install test requirements.txt
        $testRequirementsPath = Join-Path $_.FullName "scripts\tests\requirements.txt"
        if (Test-Path $testRequirementsPath) {
            $testLogFile = Join-Path $LogDir "install-${skillName}-tests.log"
            Write-Info "Installing $skillName test dependencies..."

            pip install -r $testRequirementsPath --prefer-binary 2>&1 | Tee-Object -FilePath $testLogFile
            if ($LASTEXITCODE -eq 0) {
                Write-Success "$skillName test dependencies installed successfully"
            } else {
                Write-Warning "$skillName test dependencies failed to install"
            }
        }
    }

    # Install .claude/scripts requirements (contains pyyaml for generate_catalogs.py)
    $scriptsReqPath = Join-Path $ScriptDir "..\scripts\requirements.txt"
    if (Test-Path $scriptsReqPath) {
        $scriptsLogFile = Join-Path $LogDir "install-scripts.log"
        Write-Info "Installing .claude/scripts dependencies..."

        $pkgSuccess = 0
        $pkgFail = 0
        Get-Content $scriptsReqPath | ForEach-Object {
            $line = $_.Trim()
            if ($line -match '^#' -or [string]::IsNullOrWhiteSpace($line)) {
                return
            }
            $line = ($line -split '#')[0].Trim()
            if ([string]::IsNullOrWhiteSpace($line)) {
                return
            }

            if (Try-PipInstall -PackageSpec $line -LogFile $scriptsLogFile) {
                $pkgSuccess++
            } else {
                $pkgFail++
                Track-Failure -Category "optional" -Name "scripts:${line}" -Reason "Package install failed"
            }
        }

        if ($pkgFail -eq 0) {
            Write-Success ".claude/scripts: all $pkgSuccess packages installed"
            Track-Success -Category "optional" -Name "scripts"
        } else {
            Write-Warning ".claude/scripts: $pkgSuccess installed, $pkgFail failed"
        }
    }

    # Print installation summary (brief - final report comes later)
    Write-Header "Python Dependencies Installation Summary"

    if ($successfulSkills.Count -gt 0) {
        Write-Success "Successfully installed $($successfulSkills.Count) skill(s)"
    }

    if ($failedSkills.Count -gt 0) {
        Write-Warning "$($failedSkills.Count) skill(s) had package failures (see final report)"
    } elseif ($successfulSkills.Count -eq 0) {
        Write-Warning "No skill requirements.txt files found"
    } else {
        Write-Success "All Python dependencies installed successfully"
    }

    deactivate
}

# Verify installations
function Test-Installations {
    Write-Header "Verifying Installations"

    $tools = @{
        "ffmpeg" = "FFmpeg"
        "magick" = "ImageMagick"
        "node" = "Node.js"
        "npm" = "npm"
    }

    foreach ($tool in $tools.GetEnumerator()) {
        if (Test-Command $tool.Key) {
            Write-Success "$($tool.Value) is available"
        } else {
            Write-Warning "$($tool.Value) is not available"
        }
    }

    $npmPackages = @("rmbg", "pnpm", "wrangler", "repomix")
    foreach ($package in $npmPackages) {
        if (Test-Command $package) {
            Write-Success "$package CLI is available"
        } else {
            Write-Warning "$package CLI is not available"
        }
    }

    # Check Python packages
    if (Test-Path $VenvDir) {
        $activateScript = Join-Path $VenvDir "Scripts\Activate.ps1"
        & $activateScript

        try {
            python -c "import google.genai" 2>$null
            if ($LASTEXITCODE -eq 0) {
                Write-Success "google-genai Python package is available"
            } else {
                Write-Warning "google-genai Python package is not available"
            }
        } catch {
            Write-Warning "google-genai Python package is not available"
        }

        deactivate
    }
}

# ============================================================================
# Final Report Functions
# ============================================================================

function Get-RemediationCommands {
    $hasSudoSkipped = $Script:SKIPPED_ADMIN.Count -gt 0
    $hasPythonFailed = $Script:FAILED_OPTIONAL.Count -gt 0

    if (-not $hasSudoSkipped -and -not $hasPythonFailed) {
        return
    }

    Write-Host ""
    Write-Host "---------------------------------------------------" -ForegroundColor Blue
    Write-Host "Manual Installation Commands:" -ForegroundColor Blue
    Write-Host "---------------------------------------------------" -ForegroundColor Blue
    Write-Host ""

    if ($hasSudoSkipped) {
        Write-Host "# System packages (use winget or scoop):"
        foreach ($item in $Script:SKIPPED_ADMIN) {
            $pkg = ($item -split ':')[0]
            switch ($pkg) {
                "FFmpeg" { Write-Host "winget install Gyan.FFmpeg" }
                "ImageMagick" { Write-Host "winget install ImageMagick.ImageMagick" }
                default { Write-Host "# ${pkg}: see documentation" }
            }
        }
        Write-Host ""
    }

    if ($hasPythonFailed) {
        Write-Host "# Python packages (may require build tools):"
        Write-Host "# Install Visual Studio Build Tools: https://visualstudio.microsoft.com/visual-cpp-build-tools/"
        Write-Host ".\.claude\skills\.venv\Scripts\Activate.ps1"

        foreach ($item in $Script:FAILED_OPTIONAL) {
            $pkg = ($item -split ':')[0]
            # Extract package name from skill:package format
            if ($pkg -match ':') {
                $pkg = ($pkg -split ':')[1]
            }
            Write-Host "pip install $pkg"
        }
        Write-Host ""
    }
}

function Write-FinalReport {
    Write-Host ""
    Write-Host "===================================================" -ForegroundColor Blue
    Write-Host "           Installation Report" -ForegroundColor Blue
    Write-Host "===================================================" -ForegroundColor Blue
    Write-Host ""

    # Installed section
    $installedCount = $Script:INSTALLED_CRITICAL.Count + $Script:INSTALLED_OPTIONAL.Count
    if ($installedCount -gt 0) {
        Write-Host "Installed ($installedCount):" -ForegroundColor Green
        foreach ($item in $Script:INSTALLED_CRITICAL) {
            Write-Host "  [OK] $item" -ForegroundColor Green
        }
        foreach ($item in $Script:INSTALLED_OPTIONAL) {
            Write-Host "  [OK] $item" -ForegroundColor Green
        }
        Write-Host ""
    }

    # Skipped section
    if ($Script:SKIPPED_ADMIN.Count -gt 0) {
        Write-Host "Skipped ($($Script:SKIPPED_ADMIN.Count)):" -ForegroundColor Yellow
        foreach ($item in $Script:SKIPPED_ADMIN) {
            $name = ($item -split ':')[0]
            $reason = ($item -split ':')[1]
            Write-Host "  [~] $name ($reason)" -ForegroundColor Yellow
        }
        Write-Host ""
    }

    # Degraded/Failed section
    if ($Script:FAILED_OPTIONAL.Count -gt 0) {
        Write-Host "Degraded ($($Script:FAILED_OPTIONAL.Count)):" -ForegroundColor Red
        foreach ($item in $Script:FAILED_OPTIONAL) {
            $name = ($item -split ':')[0]
            $reason = ($item -split ':')[1]
            Write-Host "  [!] $name ($reason)" -ForegroundColor Red
        }
        Write-Host ""
    }

    # Remediation commands
    Get-RemediationCommands

    # Exit status line
    Write-Host "===================================================" -ForegroundColor Blue
    switch ($Script:FINAL_EXIT_CODE) {
        0 { Write-Host " Exit: 0 (success - all dependencies installed)" -ForegroundColor Green }
        1 { Write-Host " Exit: 1 (failed - critical dependencies missing)" -ForegroundColor Red }
        2 { Write-Host " Exit: 2 (partial - some optional deps failed)" -ForegroundColor Yellow }
    }
    Write-Host "===================================================" -ForegroundColor Blue
    Write-Host ""
}

function Write-ErrorSummary {
    # Only write if there are failures
    if ($Script:FINAL_EXIT_CODE -eq 0) {
        return
    }

    # Build JSON structure
    $summary = @{
        exit_code = $Script:FINAL_EXIT_CODE
        timestamp = (Get-Date -Format "yyyy-MM-ddTHH:mm:ssZ")
        critical_failures = @()
        optional_failures = @($Script:FAILED_OPTIONAL)
        skipped = @($Script:SKIPPED_ADMIN)
        remediation = @{
            winget_packages = "winget install Gyan.FFmpeg ImageMagick.ImageMagick"
            build_tools = "https://visualstudio.microsoft.com/visual-cpp-build-tools/"
            pip_retry = ".\.claude\skills\.venv\Scripts\Activate.ps1; pip install <package>"
        }
    }

    # Use Out-File with UTF8NoBOM for proper JSON encoding (PS 6+) or UTF8 (PS 5)
    $jsonContent = $summary | ConvertTo-Json -Depth 5
    if ($PSVersionTable.PSVersion.Major -ge 6) {
        $jsonContent | Out-File -FilePath $ErrorSummaryFile -Encoding utf8NoBOM -NoNewline
    } else {
        # PowerShell 5.x: Use .NET to write UTF-8 without BOM
        [System.IO.File]::WriteAllText($ErrorSummaryFile, $jsonContent, [System.Text.UTF8Encoding]::new($false))
    }
    Write-Info "Error summary written to: $ErrorSummaryFile"
}

# Print usage instructions (now just brief tips)
function Show-Usage {
    Write-Host "To use the Python virtual environment:" -ForegroundColor Green
    Write-Host "  .\.claude\skills\.venv\Scripts\Activate.ps1"
    Write-Host ""
    Write-Host "For more information, see:" -ForegroundColor Blue
    Write-Host "  .claude\skills\INSTALLATION.md"
    Write-Host ""
}

# Show help
function Show-Help {
    Write-Host "Claude Code Skills Installation Script for Windows"
    Write-Host ""
    Write-Host "Usage:"
    Write-Host "  .\install.ps1 [Options]"
    Write-Host ""
    Write-Host "Options:"
    Write-Host "  -Y                            Skip all prompts and auto-confirm installation"
    Write-Host "  -WithAdmin                    Use admin-requiring package managers (chocolatey)"
    Write-Host "  -Resume                       Resume from previous interrupted installation"
    Write-Host "  -RetryFailed                  Retry previously failed packages"
    Write-Host "  -SkipChocolatey               Skip Chocolatey installation (uses winget/scoop instead)"
    Write-Host "  -PreferPackageManager <PM>    Prefer specific package manager (auto|winget|scoop|choco)"
    Write-Host "                                Falls back to auto-detection if preferred PM unavailable"
    Write-Host "  -Help                         Show this help message"
    Write-Host ""
    Write-Host "Exit Codes:"
    Write-Host "  0  Success (all dependencies installed)"
    Write-Host "  1  Fatal error (critical dependencies missing)"
    Write-Host "  2  Partial success (some optional deps failed)"
    Write-Host ""
    Write-Host "Examples:"
    Write-Host "  .\install.ps1                              # Normal install (auto-detect PM)"
    Write-Host "  .\install.ps1 -PreferPackageManager scoop  # Prefer scoop, fallback to auto"
    Write-Host "  .\install.ps1 -PreferPackageManager winget # Use winget explicitly"
    Write-Host "  .\install.ps1 -Y                           # Non-interactive"
    Write-Host "  .\install.ps1 -WithAdmin                   # Use chocolatey if admin"
    Write-Host "  .\install.ps1 -Resume                      # Resume interrupted install"
    Write-Host ""
    Write-Host "Package Manager Priority:"
    Write-Host "  1. winget (recommended, no admin required)"
    Write-Host "  2. scoop (no admin required)"
    Write-Host "  3. chocolatey (requires admin + -WithAdmin flag)"
    Write-Host ""
    Write-Host "Requirements:"
    Write-Host "  - PowerShell 5.1 or higher"
    Write-Host "  - One of: winget, scoop, or chocolatey (admin)"
    Write-Host ""
}

# Main installation flow
function Main {
    if ($Help) {
        Show-Help
        exit 0
    }

    Write-Host ""  # Just add spacing, don't clear terminal
    Write-Header "Claude Code Skills Installation (Windows)"
    Write-Info "Script directory: $ScriptDir"

    # Store preference in script scope for functions to access
    $Script:PreferPackageManager = $PreferPackageManager

    # Show detected package manager
    $pm = Get-PackageManager -Preference $PreferPackageManager
    if ($pm) {
        Write-Success "Detected package manager: $pm"
    } else {
        Write-Warning "No package manager detected (winget, scoop, or choco)"
        Write-Info "Install winget: https://aka.ms/getwinget"
    }

    # Show mode info
    if ($PreferPackageManager -ne "auto") {
        Write-Info "Mode: prefer $PreferPackageManager (soft fallback to auto if unavailable)"
    }
    if ($WithAdmin) {
        Write-Info "Mode: with admin (chocolatey enabled)"
    } else {
        Write-Info "Mode: without admin (system packages may be skipped)"
    }
    if ($Resume) {
        Write-Info "Mode: resuming previous installation"
    }
    Write-Host ""

    # Confirm installation (skip if -Y flag or NON_INTERACTIVE env is set)
    if (-not $Y) {
        $confirmation = Get-UserInput -Prompt "This will install system packages and Node.js dependencies. Continue? (y/N)" -Default "N"
        if ($confirmation -ne 'y' -and $confirmation -ne 'Y') {
            Write-Warning "Installation cancelled"
            exit 0
        }
    } else {
        Write-Info "Auto-confirming installation (-Y flag or NON_INTERACTIVE mode)"
    }

    # Initialize state tracking
    Initialize-State

    # Phase 1: Chocolatey (optional)
    if (-not (Test-PhaseDone "chocolatey")) {
        Update-Phase "chocolatey" "running"
        $null = Install-Chocolatey
        Update-Phase "chocolatey" "done"
    }

    # Phase 2: System deps
    if (Test-PhaseDone "system_deps") {
        Write-Success "System deps: already processed (resume)"
    } else {
        Update-Phase "system_deps" "running"
        Install-SystemDeps
        Update-Phase "system_deps" "done"
    }

    # Phase 3: Node deps
    if (Test-PhaseDone "node_deps") {
        Write-Success "Node deps: already installed (resume)"
    } else {
        Update-Phase "node_deps" "running"
        Install-NodeDeps
        Update-Phase "node_deps" "done"
    }

    # Phase 4: Python env
    if (Test-PhaseDone "python_env") {
        Write-Success "Python env: already set up (resume)"
    } else {
        Update-Phase "python_env" "running"
        Setup-PythonEnv
        Update-Phase "python_env" "done"
    }

    # Phase 5: Verify
    Update-Phase "verify" "running"
    Test-Installations
    Update-Phase "verify" "done"

    # Print final report with all tracking info
    Write-FinalReport
    Show-Usage

    # Write error summary for CLI to parse
    Write-ErrorSummary

    # Clean state on complete success
    if ($Script:FINAL_EXIT_CODE -eq 0) {
        Remove-StateFile
    }

    exit $Script:FINAL_EXIT_CODE
}

# Run main function
Main
