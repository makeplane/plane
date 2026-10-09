# 🚀 Quick Start Guide - Windows

Get Plane running on your Windows machine in under 30 minutes!

---

## ⚡ Prerequisites

Before starting, ensure you have:

- ✅ **Windows 10 or 11** (64-bit)
- ✅ **16 GB RAM** (minimum 12 GB)
- ✅ **20 GB free disk space**
- ✅ **Admin rights** on your computer

---

## 📦 Step 1: Install Prerequisites (First Time Only)

### 1.1 Install Node.js

1. Download Node.js **v22.18.0 or higher** from [nodejs.org](https://nodejs.org/)
2. Run the installer with default options
3. Restart your terminal/PowerShell
4. Verify installation:
   ```powershell
   node --version
   ```
   Should show: `v22.18.0` or higher

### 1.2 Install Docker Desktop

1. Download from [docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop/)
2. Run installer
3. **Restart your computer** (required)
4. Start Docker Desktop (wait for it to fully start)
5. Verify Docker is running:
   ```powershell
   docker --version
   ```

### 1.3 Install Git

1. Download from [git-scm.com](https://git-scm.com/)
2. Install with default settings
3. Verify:
   ```powershell
   git --version
   ```

---

## 🛠️ Step 2: Set Up the Project

### 2.1 Clone the Repository

Open **PowerShell** or **Command Prompt**:

```powershell
# Clone the repository
git clone https://github.com/makeplane/plane.git plane-project

# Navigate into the directory
cd plane-project
```

### 2.2 Run the Setup Script

**Option A: Using PowerShell (Recommended)**

```powershell
# Run the setup script
.\setup-windows.ps1
```

**Option B: Using Batch File**

```cmd
# Double-click setup-windows.bat in File Explorer
# OR run in Command Prompt:
setup-windows.bat
```

This will:
- ✅ Check prerequisites
- ✅ Create environment files
- ✅ Generate security keys
- ✅ Install dependencies (takes 5-10 minutes)

**⏰ Go grab a coffee while dependencies install!**

---

## 🚀 Step 3: Start the Application

### 3.1 Start Docker Services

In PowerShell/CMD:

```powershell
docker compose -f docker-compose-local.yml up -d
```

This starts:
- PostgreSQL database
- Redis cache
- RabbitMQ message queue
- MinIO file storage

**Wait ~30 seconds** for all services to start.

Verify services are running:
```powershell
docker compose -f docker-compose-local.yml ps
```

You should see all services with status "Up".

### 3.2 Start Development Servers

In a **new PowerShell/CMD window**:

```powershell
pnpm dev
```

This starts all frontend applications:
- **Web app** (main dashboard) - port 3000
- **Admin panel** - port 3001
- **Space** (public sharing) - port 3002
- **Live server** (real-time) - port 3100

**Wait ~2-3 minutes** for the build to complete.

You'll see output like:
```
✓ Built in XXXXms
Local:   http://localhost:3000/
```

---

## 🌐 Step 4: Access the Application

### 4.1 Register as Instance Admin

1. Open your browser to: **http://localhost:3001/god-mode/**
2. Fill in the registration form:
   - Email
   - Password
   - Name
3. Click **"Submit"**

This creates your admin account.

### 4.2 Log In to Main App

1. Open: **http://localhost:3000**
2. Log in with the same credentials from step 4.1
3. Create your first workspace
4. Start creating projects and issues!

---

## 🎉 You're Done!

### Application URLs

| Service | URL | Description |
|---------|-----|-------------|
| **Main App** | http://localhost:3000 | Your dashboard |
| **Admin Panel** | http://localhost:3001/god-mode/ | System settings |
| **API Docs** | http://localhost:8000/api/schema/swagger-ui/ | API documentation |
| **MinIO** | http://localhost:9090 | File storage (login: access-key/secret-key) |

---

## 🔧 Common Issues & Solutions

### Issue: "Port 3000 is already in use"

**Solution:**
```powershell
# Find what's using the port
netstat -ano | findstr :3000

# Kill the process (replace <PID> with the number shown)
taskkill /PID <PID> /F
```

### Issue: Docker won't start

**Solution:**
1. Open Docker Desktop
2. Wait for "Docker Desktop is running" message
3. Try the docker command again

### Issue: "pnpm: command not found"

**Solution:**
```powershell
# Enable pnpm
corepack enable
corepack prepare pnpm@10.21.0 --activate

# Verify
pnpm --version
```

### Issue: Out of memory errors

**Solution:**
1. Open Docker Desktop
2. Go to: Settings → Resources → Advanced
3. Increase Memory to **8 GB** (or more)
4. Click **"Apply & Restart"**

### Issue: Slow performance

**Solutions:**
- Close unnecessary applications
- Ensure you have at least 12 GB RAM
- Check if antivirus is scanning Docker folders (add to exclusions)

---

## 🛑 Stopping the Application

When you're done for the day:

### Stop Development Servers
Press `Ctrl + C` in the PowerShell window running `pnpm dev`

### Stop Docker Services
```powershell
docker compose -f docker-compose-local.yml down
```

### To Restart Later
```powershell
# Start Docker services
docker compose -f docker-compose-local.yml up -d

# Start dev servers (in a new window)
pnpm dev
```

---

## 📚 Next Steps

Now that you have Plane running:

1. **Explore the app** - Create projects, issues, cycles
2. **Read the guides**:
   - [SETUP_GUIDE.md](./SETUP_GUIDE.md) - Detailed technical setup
   - [REBRANDING_GUIDE.md](./REBRANDING_GUIDE.md) - Customization guide
3. **Start customizing** - Change colors, logo, features
4. **Deploy to production** - When ready, follow deployment guide

---

## 🆘 Need Help?

- **Detailed Setup:** See [SETUP_GUIDE.md](./SETUP_GUIDE.md)
- **Customization:** See [REBRANDING_GUIDE.md](./REBRANDING_GUIDE.md)
- **Official Docs:** https://developers.plane.so/
- **Discord:** https://discord.com/invite/A92xrEGCge

---

## 💡 Pro Tips

### Tip 1: Use VS Code
Install [Visual Studio Code](https://code.visualstudio.com/) for the best development experience.

Recommended extensions:
- ESLint
- Prettier
- Tailwind CSS IntelliSense

### Tip 2: Keep Docker Running
For faster startups, keep Docker Desktop running in the background.

### Tip 3: Use Multiple Terminal Windows
- Window 1: Docker logs (`docker compose logs -f`)
- Window 2: Development servers (`pnpm dev`)
- Window 3: Commands and Git operations

### Tip 4: Windows Terminal
Use [Windows Terminal](https://aka.ms/terminal) for a better command-line experience.

---

Happy coding! 🎉
