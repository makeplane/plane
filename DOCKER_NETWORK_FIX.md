# Docker Network Configuration Guide

This guide helps prevent Docker from interfering with your browser's internet connectivity on macOS.

## Quick Fix Steps

### 1. Docker Desktop Settings

1. **Open Docker Desktop** → Click the gear icon (⚙️) or go to Settings
2. **Resources → Network**:
   - ✅ Check "Enable VPN compatibility mode" (if available)
   - ✅ Uncheck "Use kernel networking" (if checked)
3. **Resources → Advanced**:
   - Set CPU and Memory limits appropriately (Docker shouldn't consume all resources)
4. **General**:
   - ✅ Uncheck "Send usage statistics" (optional, for privacy)

### 2. Reset Docker Network (if issues persist)

1. **Docker Desktop** → **Troubleshoot** tab
2. Click **"Reset to factory defaults"** or **"Clean / Purge data"**
3. Restart Docker Desktop

### 3. Configure System DNS (if DNS issues persist)

1. **System Preferences** → **Network**
2. Select your active connection (Wi-Fi or Ethernet)
3. Click **Advanced** → **DNS** tab
4. Add Google DNS servers:
   - `8.8.8.8`
   - `8.8.4.4`
5. Click **OK** and **Apply**

### 4. Flush DNS Cache (macOS)

```bash
sudo dscacheutil -flushcache
sudo killall -HUP mDNSResponder
```

### 5. Restart Network Services

```bash
# Restart Docker networking
docker network prune -f

# Restart Docker Desktop completely (quit the app and restart)
```

## What We Changed in docker-compose-local.yml

The `docker-compose-local.yml` file now includes:

- **Custom subnet**: `172.25.0.0/16` - Uses a dedicated IP range that shouldn't conflict with your local network
- **Custom gateway**: `172.25.0.1` - Isolated gateway for Docker containers
- **Bridge driver options**: Properly configured network bridge with isolation enabled

## Testing the Fix

1. **Stop all Docker containers**:
   ```bash
   docker compose -f docker-compose-local.yml down
   ```

2. **Test browser connectivity** (should work now)

3. **Start Docker containers**:
   ```bash
   docker compose -f docker-compose-local.yml up -d
   ```

4. **Test browser connectivity again** (should still work)

## If Problems Persist

### Option 1: Use Host Network Mode (Advanced)

You can modify services to use `network_mode: "host"`, but this is not recommended as it removes network isolation and can cause port conflicts.

### Option 2: Limit Container Network Access

Only start the services you need:

```bash
# Start only database and Redis
docker compose -f docker-compose-local.yml up -d plane-db plane-redis

# Start API only when needed
docker compose -f docker-compose-local.yml up api
```

### Option 3: Check for Port Conflicts

```bash
# Check what's using common ports
lsof -i :80    # HTTP
lsof -i :443   # HTTPS
lsof -i :53    # DNS

# Check Docker port bindings
docker ps --format "table {{.Names}}\t{{.Ports}}"
```

## Common Causes

1. **Docker Desktop VPN mode** - Disable if not using VPN
2. **DNS server conflicts** - Docker might override system DNS
3. **Network interface conflicts** - Docker creates virtual network interfaces
4. **Port binding conflicts** - Containers binding to host ports
5. **Resource exhaustion** - Docker consuming too much CPU/memory

## Prevention

- Regularly update Docker Desktop
- Monitor Docker resource usage
- Use specific IP ranges for Docker networks (as we've configured)
- Avoid binding containers to ports 80, 443, or 53 unless necessary

