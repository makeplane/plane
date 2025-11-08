# Deploying Plane to Dokploy

This guide will help you deploy your customized Plane instance (with telemetry and licensing removed) to Dokploy.

## 🎯 What's Different

This deployment includes:
- ✅ **No telemetry** - Zero external connections to telemetry.plane.so
- ✅ **Enterprise Edition** - All features enabled by default
- ✅ **No licensing restrictions** - All estimate systems, time tracking, active cycles, etc.
- ✅ **Dokploy-optimized** - Uses Traefik reverse proxy (no built-in proxy)

## 📋 Prerequisites

1. **Dokploy instance** running (VPS with Docker installed)
2. **Domain name** pointed to your Dokploy server
3. **Git repository** with your customized Plane code

## 🚀 Deployment Steps

### Step 1: Push Your Changes to Git

Make sure all your changes are committed and pushed:

```bash
# Check current branch
git branch

# Should show: claude/find-licensing-code-011CUuqSSD18pWdWJLTE2NBF

# Push to your repository
git push origin claude/find-licensing-code-011CUuqSSD18pWdWJLTE2NBF
```

### Step 2: Create Application in Dokploy

1. **Log in to Dokploy**
2. **Create New Application**
   - Name: `plane`
   - Type: `Docker Compose`

3. **Connect Git Repository**
   - Repository URL: Your forked Plane repo
   - Branch: `claude/find-licensing-code-011CUuqSSD18pWdWJLTE2NBF`

### Step 3: Configure Docker Compose

In Dokploy:

1. **Select docker-compose file**: `docker-compose.dokploy.yml`
2. **Set working directory**: `/` (root of repo)

### Step 4: Set Environment Variables

In Dokploy's Environment Variables section, add:

```bash
# Domain (Dokploy will auto-configure SSL)
APP_DOMAIN=your-domain.com
WEB_URL=https://your-domain.com

# Database credentials (generate strong passwords!)
POSTGRES_USER=plane
POSTGRES_PASSWORD=YOUR_SECURE_DB_PASSWORD_HERE
POSTGRES_DB=plane
DATABASE_URL=postgresql://plane:YOUR_SECURE_DB_PASSWORD_HERE@plane-db:5432/plane

# RabbitMQ credentials
RABBITMQ_USER=plane
RABBITMQ_PASSWORD=YOUR_SECURE_MQ_PASSWORD_HERE
RABBITMQ_VHOST=plane

# MinIO/S3 credentials
AWS_ACCESS_KEY_ID=YOUR_MINIO_ACCESS_KEY
AWS_SECRET_ACCESS_KEY=YOUR_MINIO_SECRET_KEY

# Application secrets (generate with: python -c "import secrets; print(secrets.token_hex(32))")
SECRET_KEY=YOUR_DJANGO_SECRET_KEY_60_CHARS_MIN
LIVE_SERVER_SECRET_KEY=YOUR_LIVE_SERVER_SECRET_32_CHARS

# CORS
CORS_ALLOWED_ORIGINS=https://your-domain.com

# Production settings
DEBUG=0
GUNICORN_WORKERS=2
USE_MINIO=1
API_KEY_RATE_LIMIT=60/minute
```

**Quick secret generation:**
```bash
# Django SECRET_KEY (60+ characters)
python -c "import secrets; print(secrets.token_hex(32))"

# LIVE_SERVER_SECRET_KEY (32 characters)
python -c "import secrets; print(secrets.token_hex(16))"
```

### Step 5: Configure Traefik (Dokploy's Reverse Proxy)

Dokploy should automatically configure Traefik based on the labels in `docker-compose.dokploy.yml`.

**Verify these settings in Dokploy:**
- ✅ Enable HTTPS/SSL
- ✅ Auto SSL Certificate (Let's Encrypt)
- ✅ Domain: `your-domain.com`

### Step 6: Deploy!

1. Click **Deploy** in Dokploy
2. Monitor the deployment logs
3. Wait for all containers to start (5-10 minutes first time)

### Step 7: Initialize the Application

Once deployed, access your application:

1. Navigate to `https://your-domain.com`
2. **First-time setup**:
   - Create admin account
   - Configure workspace

## 🔧 Post-Deployment Configuration

### Access MinIO Console (Optional)

MinIO console is available at: `https://minio.your-domain.com`

**Login credentials:**
- Username: Value of `AWS_ACCESS_KEY_ID`
- Password: Value of `AWS_SECRET_ACCESS_KEY`

### Verify All Features Are Enabled

Test these features to confirm everything works:

✅ **Estimate Systems**
- Go to Project Settings → Estimates
- All 3 systems should be available: Points, Categories, **Time**

✅ **Time Tracking**
- Go to Project Settings → Features
- Time Tracking should show as enabled (no Pro badge)

✅ **Workspace Active Cycles**
- Navigate to workspace active cycles
- Should work without upgrade prompt

✅ **Bulk Operations**
- Select multiple issues
- Bulk operations available (no upgrade banner)

## 🛠 Troubleshooting

### Container Won't Start

Check logs in Dokploy:
```bash
# View specific container logs
docker logs plane-api
docker logs plane-web
docker logs plane-db
```

### Database Connection Issues

Verify DATABASE_URL format:
```
postgresql://plane:PASSWORD@plane-db:5432/plane
```

### MinIO/Upload Issues

1. Check MinIO is running: `docker ps | grep minio`
2. Verify `AWS_S3_ENDPOINT_URL=http://plane-minio:9000`
3. Check credentials match between MinIO and app

### SSL Certificate Issues

Dokploy uses Let's Encrypt. Make sure:
1. Domain DNS points to your server
2. Ports 80 and 443 are open
3. Traefik is configured correctly

## 📊 Container Overview

| Container | Purpose | Port |
|-----------|---------|------|
| `plane-web` | Main frontend (Next.js) | 3000 |
| `plane-admin` | Admin panel | 3000 |
| `plane-space` | Public space | 3000 |
| `plane-api` | Django API backend | 8000 |
| `plane-worker` | Background jobs | - |
| `plane-beat-worker` | Scheduled tasks | - |
| `plane-live` | Real-time collaboration | 3000 |
| `plane-db` | PostgreSQL database | 5432 |
| `plane-redis` | Cache/sessions | 6379 |
| `plane-mq` | RabbitMQ queue | 5672 |
| `plane-minio` | S3-compatible storage | 9000 |

## 🔐 Security Recommendations

1. **Change all default passwords** in environment variables
2. **Use strong random strings** for SECRET_KEY and LIVE_SERVER_SECRET_KEY
3. **Enable firewall** - Only allow ports 80, 443, and 22 (SSH)
4. **Regular backups** - Set up automated backups for:
   - PostgreSQL database (`pgdata` volume)
   - MinIO uploads (`uploads` volume)
5. **Keep Docker images updated** - Rebuild regularly for security patches

## 📦 Volumes (Persistent Data)

These volumes contain important data - **backup regularly**:

```yaml
volumes:
  pgdata:           # PostgreSQL database
  redisdata:        # Redis cache (can be ephemeral)
  uploads:          # User uploads (MinIO)
  rabbitmq_data:    # RabbitMQ queue data
  api-logs:         # API logs
  worker-logs:      # Worker logs
  beat-logs:        # Beat worker logs
  migrator-logs:    # Migrator logs
```

## 🔄 Updating the Application

To update after making changes:

1. **Commit and push changes**:
   ```bash
   git add .
   git commit -m "Your update message"
   git push
   ```

2. **Redeploy in Dokploy**:
   - Click "Redeploy" in Dokploy UI
   - Dokploy will pull latest code and rebuild

3. **Run migrations** (if database changes):
   ```bash
   docker exec plane-migrator ./bin/docker-entrypoint-migrator.sh
   ```

## 🎉 Success!

Your Plane instance should now be running at `https://your-domain.com` with:
- ✅ All features enabled
- ✅ No telemetry or license checks
- ✅ SSL/TLS encryption via Let's Encrypt
- ✅ Enterprise Edition functionality

## 📞 Support

If you encounter issues:
1. Check Dokploy logs
2. Verify environment variables
3. Review this guide
4. Check Plane documentation: https://docs.plane.so

## ⚠️ Important Notes

- **No telemetry**: This build has all telemetry removed (no connections to telemetry.plane.so)
- **Enterprise features**: All features are enabled by default
- **Self-hosted**: You're responsible for backups, security, and maintenance
- **Dokploy manages**: SSL certificates, reverse proxy, and container orchestration
