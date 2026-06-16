# WinSecOps Local Development Setup Guide (Windows)

This guide provides step-by-step instructions for setting up the WinSecOps local development environment from scratch on a new Windows laptop. Since the default `setup.sh` script is designed for Linux/macOS bash environments, these instructions are tailored to work natively on Windows via PowerShell.

## 📋 Prerequisites

Before starting, ensure you have the following installed on your laptop:

1. **Node.js** (v22.18.0 or higher) - Includes `npm`
2. **Python** (v3.8 or higher)
3. **Docker Desktop** (Make sure it is running)
4. **Git**

---

## 🚀 Step-by-Step Installation

### 1. Clone the Repository

Open PowerShell and run:

```powershell
git clone https://github.com/makePlane/plane.git
cd plane
```

### 2. Setup Environment Variables

WinSecOps requires `.env` files in multiple directories. We need to copy the `.env.example` files to `.env` and generate a unique Django Secret Key.

Run this exact block of code in your PowerShell (while inside the `WinSecOps` directory):

```powershell
# Copy all .env.example files to .env
$services = @("", "apps/web/", "apps/api/", "apps/space/", "apps/admin/", "apps/live/")
foreach ($service in $services) {
    Copy-Item "$($service).env.example" "$($service).env" -Force
}

# Generate a random 50-character SECRET_KEY for Django and append it
$secret = -join ((48..57) + (97..122) | Get-Random -Count 50 | % {[char]$_})
Add-Content "apps/api/.env" "`nSECRET_KEY=`"$secret`""

Write-Host "Environment variables configured successfully!" -ForegroundColor Green
```

### 3. Install Package Manager (pnpm)

WinSecOps uses `pnpm` to manage its monorepo packages. Install it globally via npm:

```powershell
npm install -g pnpm
```

### 4. Install Dependencies
  
Install all required Node modules for the frontend and shared packages:

```powershell
pnpm install
```

### 5. Start Backend Services (Docker)

Start the PostgreSQL, Redis, RabbitMQ, MinIO, and API containers in the background.

```powershell
docker compose -f docker-compose-local.yml up -d
```

> [!WARNING]
> **Important First-Time Note:** The very first time you run this command, Docker has to compile Python dependencies (including Rust and LLVM) from source on Alpine Linux. **This can take 15 to 30 minutes.** You will not see any containers in Docker Desktop until the image building phase is 100% complete. Be patient!

### 6. Start Frontend Servers

Open a **new** PowerShell window (keep it inside the `WinSecOps` folder) and run the dev servers:

```powershell
pnpm dev
```

_(This will start the Web app on port 3000 and the Admin app on port 3001)._

---

## 🏁 Finalizing Setup

Once the Docker containers finally appear in Docker Desktop and show as "Running", and `pnpm dev` has compiled successfully, you can access the application:

1. **Register Admin:** Go to [http://localhost:3001/god-mode/](http://localhost:3001/god-mode/) in your browser. Register yourself to create the instance admin account.
2. **Login to App:** Go to [http://localhost:3000](http://localhost:3000) and log in with the credentials you just created.

You're all set! 🚀
