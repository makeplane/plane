if ( -not (Get-Module -ListAvailable -Name posh-git )) {
    Write-Host "Module does not exist"
    Install-Module Posh-Git -Scope CurrentUser -Force
}
Import-Module posh-git

if ($PSVersionTable.Platform -eq 'Unix') {
    $logPath = '/tmp'
}
else {
    $logPath = 'C:\Logs' #log path location
}

$logFile = "$logPath\plane_auto_install.log" #log file

#verify if log directory path is present. if not, create it.
try {
    if (-not (Test-Path -Path $logPath -ErrorAction Stop )) {
        # Output directory not found. Creating...
        New-Item -ItemType Directory -Path $logPath -ErrorAction Stop | Out-Null
        New-Item -ItemType File -Path $logFile -ErrorAction Stop | Out-Null
    }
}
catch {
    throw
}

Add-Content -Path $logFile -Value "[INFO] Starting Setup"

if ($PSVersionTable.Platform -eq 'Unix') {
    $logPath = '/tmp'
}
else {
    $logPath = 'C:\Logs' #log path location
}

$logFile = "$logPath\plane_auto_install.log" #log file

#verify if log directory path is present. if not, create it.
try {
    if (-not (Test-Path -Path $logPath -ErrorAction Stop )) {
        # Output directory not found. Creating...
        New-Item -ItemType Directory -Path $logPath -ErrorAction Stop | Out-Null
        New-Item -ItemType File -Path $logFile -ErrorAction Stop | Out-Null
    }
}
catch {
    throw
}

Add-Content -Path $logFile -Value "[INFO] Starting Setup"

Write-Output("What do you want to do:")
Write-Output("[1] Install Plane over docker-hub")
Write-Output("[2] Download and install Plane from source code")
Write-Output("[3] Exit")
[int]$i = Read-Host "Select an Option[1-3]"
if ($i -eq 3) {
    Write-Output("Exiting")
    exit
}

if ($i -eq 1) {
    Add-Content -Path $logFile -Value "[INFO] Starting Docker Hub Installation"
    "curl https://raw.githubusercontent.com/makeplane/plane/develop/.env.example --output .env.example" | cmd.exe
    "curl https://raw.githubusercontent.com/makeplane/plane/develop/setup.sh --output setup.sh" | cmd.exe

    [string]$host = Read-Host -Promopt "Enter the host url [http://localhost]"
    '"C:\Program Files\Git\bin\sh.exe" ./setup.sh ' + $host | cmd

    "docker compose -f docker-compose-hub.yml up -d" | cmd.exe
    Write-Output("You dont have to run this script again. You can start plane by running the following command:")
    Write-Output("docker compose -f docker-compose-hub.yml up -d")
}
elseif ($i -eq 2) {
    Add-Content -Path $logFile -Value "[INFO] Starting local Docker Installation"
    
    if (Test-Path "plane" -PathType Container) {
        Add-Content -Path $logFile -Value "[INFO] Trying Removing Old Plane"
        Write-Output("Plane is already installed. Do you want to reinstall it? [yes/all/no]")
        Remove-Item -Path "plane" -Confirm -Force -Recurse -ErrorAction Stop | Out-Null
    } 
    Add-Content -Path $logFile -Value "[INFO] Cloning Github Repo"
    git clone https://github.com/makeplane/plane.git

    Set-Location "plane"
    git checkout master

    Add-Content -Path $logFile -Value "[INFO] Setting Setup.sh up"

    [string]$host = Read-Host -Promopt "Enter the host url [http://localhost]"
    '"C:\Program Files\Git\bin\sh.exe" ./setup.sh ' + $host | cmd
    
    Get-Content -Path ".env" | ForEach-Object {
        $line = $_ -split "="
        if ($line.Length -ge 2) {
            $variable = $line[0].Trim()
            $value = $line[1..($line.Length - 1)] -join "="
            Set-Item -Path "Env:\$variable" -Value $value
        }
    }
    
    'docker-compose up -d' | cmd

    Write-Output("You dont have to run this script again. You can start plane by running the following command:")
    Write-Output("docker-compose up -d")
}
Set-Location ..

Write-Output("Plane is now installed. You can access it at $host")


Add-Content -Path $logFile -Value "[INFO] Finished Installation"
Read-Host -Prompt "Press Enter to Close"