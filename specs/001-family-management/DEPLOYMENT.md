# Deployment Guide: FamilyFlow Native Deployment

**Feature**: FamilyFlow - Agile Home Management  
**Target Platform**: Digital Ocean Droplet (Ubuntu 22.04 LTS)  
**Date**: 2025-12-13

## Overview

This guide provides step-by-step instructions for deploying FamilyFlow on a Digital Ocean droplet using native (non-Docker) process management with PM2. The deployment uses:

- **Process Management**: PM2 (Node.js process manager)
- **Database**: Supabase (PostgreSQL)
- **Cache/Queue**: Redis (local installation - used for caching and Celery message broker)
- **Web Server** (Optional): Nginx (reverse proxy, SSL termination)

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Initial Server Setup](#initial-server-setup)
3. [Infrastructure Services](#infrastructure-services)
   - [Redis Installation](#redis-installation)
   - [Systemd Service Configuration](#systemd-service-configuration)
4. [Application Deployment](#application-deployment)
5. [PM2 Configuration](#pm2-configuration)
6. [Nginx Configuration (Optional)](#nginx-configuration-optional)
7. [SSL/TLS Setup](#ssltls-setup)
8. [Monitoring & Maintenance](#monitoring--maintenance)
9. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Digital Ocean Droplet

- **OS**: Ubuntu 22.04 LTS
- **Minimum Specs**: 2 CPU, 4GB RAM
- **Recommended Specs**: 4 CPU, 8GB RAM
- **SSH Access**: Root or sudo user access

### External Services

- **Supabase Account**: For PostgreSQL database
- **Domain Name** (Optional): For SSL certificates and custom domain

---

## Initial Server Setup

### Step 1: Provision Droplet

1. Create a new Digital Ocean droplet with Ubuntu 22.04 LTS
2. Note the droplet IP address
3. SSH into the droplet:

```bash
ssh root@your-droplet-ip
```

### Step 2: Run Initial Setup Script

The `setup-server.sh` script automates the installation of all system dependencies:

```bash
# On your local machine
scp setup-server.sh root@your-droplet-ip:/root/
ssh root@your-droplet-ip

# On the droplet
chmod +x setup-server.sh
./setup-server.sh
```

This script installs:
- Node.js 22+
- Python 3.12
- pnpm
- PM2
- Redis (for caching and Celery broker)
- Nginx (optional)

---

## Infrastructure Services

### Redis Installation

Redis is used for caching and as the Celery message broker.

#### Installation (Ubuntu 22.04)

```bash
# Update package list
sudo apt update

# Install Redis
sudo apt install -y redis-server

# Verify installation
redis-cli --version
```

#### Configuration

Redis default configuration is suitable for most deployments. Optional customizations:

```bash
# Edit Redis configuration (optional)
sudo nano /etc/redis/redis.conf

# Common settings to adjust:
# - maxmemory: Maximum memory usage (e.g., "256mb")
# - maxmemory-policy: Eviction policy (e.g., "allkeys-lru")
# - bind: Listen address (default: 127.0.0.1 for localhost only)

# Restart Redis after configuration changes
sudo systemctl restart redis-server
```

#### Verification

```bash
# Test Redis connection
redis-cli ping
# Should return: PONG

# Check Redis status
sudo systemctl status redis-server
```

#### Connection String

For local Redis installation:

```bash
# Default connection (localhost, port 6379, database 0)
REDIS_URL=redis://localhost:6379/0

# With password (if configured)
REDIS_URL=redis://:password@localhost:6379/0

# Custom database
REDIS_URL=redis://localhost:6379/1
```

---

### Systemd Service Configuration

Redis is installed as a systemd service and should be configured to start automatically on boot.

#### Enable Auto-Start

```bash
# Enable Redis to start on boot
sudo systemctl enable redis-server

# Verify service is enabled
sudo systemctl is-enabled redis-server
# Should return: enabled
```

#### Service Management Commands

```bash
# Start service
sudo systemctl start redis-server

# Stop service
sudo systemctl stop redis-server

# Restart service
sudo systemctl restart redis-server

# Check service status
sudo systemctl status redis-server

# View service logs
sudo journalctl -u redis-server -f
```

#### Verify Service Starts on Boot

After enabling the service, reboot the server to verify:

```bash
# Reboot server
sudo reboot

# After reboot, SSH back in and verify service is running
sudo systemctl status redis-server
```

---

## Application Deployment

### Step 1: Clone Repository

```bash
# Create application directory
mkdir -p /opt/familyflow
cd /opt/familyflow

# Clone your repository
git clone https://github.com/your-username/scrumfamily.git .

# Or if using SSH
git clone git@github.com:your-username/scrumfamily.git .
```

### Step 2: Configure Environment Variables

```bash
# Copy environment template
cp apps/api/.env.example apps/api/.env

# Edit environment file
nano apps/api/.env
```

**Required Environment Variables**:

```bash
# Supabase Database
SUPABASE_DB_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres?sslmode=require
SUPABASE_URL=https://[PROJECT_REF].supabase.co
SUPABASE_PROJECT_REF=[PROJECT_REF]
SUPABASE_ANON_KEY=[ANON_KEY]
SUPABASE_SERVICE_ROLE_KEY=[SERVICE_ROLE_KEY]

# Redis (local installation)
REDIS_URL=redis://localhost:6379/0

# Redis is used for both caching and Celery message broker
# No additional message broker configuration needed

# Django Settings
SECRET_KEY=[generate-a-secret-key]
DEBUG=0
ALLOWED_HOSTS=your-domain.com,www.your-domain.com,localhost

# Application URLs
WEB_URL=https://your-domain.com
API_BASE_URL=https://api.your-domain.com

# Gunicorn Workers (production)
GUNICORN_WORKERS=4
```

**Generate Django Secret Key**:

```bash
python3.12 -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

### Step 3: Install Dependencies

```bash
# Install Python dependencies
cd apps/api
pip install -r requirements/production.txt

# Install Node.js dependencies (from repo root)
cd /opt/familyflow
pnpm install --frozen-lockfile
```

### Step 4: Test Database Connection (Optional but Recommended)

Before running migrations, verify your Supabase connection is working:

```bash
cd /opt/familyflow/apps/api

# Run Supabase connection test
python3 bin/test-supabase-connection.py
```

This test script verifies:
- Environment variables are loaded correctly
- Connection string is parsed properly
- SSL mode is configured correctly
- Database connectivity works

If the test fails, check:
- Your `SUPABASE_DB_URL` or `DATABASE_URL` is correct
- The connection string includes `?sslmode=require`
- Your Supabase project allows connections from your server's IP
- Network connectivity to Supabase

### Step 5: Run Database Migrations

```bash
cd /opt/familyflow/apps/api

# Run migrations
python manage.py migrate --settings=plane.settings.production

# Or use the migrator script
./bin/entrypoint-migrator.sh --settings=plane.settings.production
```

### Step 6: Build Frontend

```bash
cd /opt/familyflow/apps/web

# Build frontend
pnpm build

# Collect static files (Django)
cd ../api
python manage.py collectstatic --noinput --settings=plane.settings.production
```

### Step 7: Deploy Using Deployment Script

```bash
cd /opt/familyflow

# Make deployment script executable
chmod +x deploy.sh

# Run deployment
./deploy.sh production
```

The deployment script will:
1. Pull latest code
2. Install/update dependencies
3. Run database migrations
4. Build frontend
5. Collect static files
6. Restart PM2 processes

---

## PM2 Configuration

### PM2 Ecosystem File

The `ecosystem.config.js` file defines all application processes:

- **API Server**: Django with Gunicorn (production) or runserver (development)
- **Celery Worker**: Background task processing
- **Celery Beat**: Scheduled task execution
- **Frontend**: Static file serving (if not using Nginx)

### Production Deployment with PM2

```bash
cd /opt/familyflow

# Start all processes
pm2 start ecosystem.config.js --env production

# View process status
pm2 status

# View logs
pm2 logs

# View logs for specific process
pm2 logs api
pm2 logs celery-worker
pm2 logs celery-beat
```

### Local Development with PM2

For local development, PM2 can manage all services with development settings:

```bash
# Start all services in development mode
pm2 start ecosystem.config.js --env development

# Development mode uses:
# - Django runserver (instead of Gunicorn)
# - DEBUG=1
# - Local settings module
# - Hot reload enabled for frontend

# View development logs
pm2 logs

# Stop all services
pm2 stop all

# Delete all processes
pm2 delete all
```

**Development vs Production PM2 Configs**:

The `ecosystem.config.js` uses environment-specific configurations:

- **Development** (`--env development`):
  - `DJANGO_SETTINGS_MODULE=plane.settings.local`
  - `DEBUG=1`
  - Uses Django runserver (entrypoint script detects development mode)
  - Frontend runs in dev mode with hot reload

- **Production** (`--env production`):
  - `DJANGO_SETTINGS_MODULE=plane.settings.production`
  - `DEBUG=0`
  - Uses Gunicorn with multiple workers
  - Frontend serves built static files

**Alternative: Manual Development Servers**

If you prefer running services manually during development:

```bash
# Terminal 1: Django API
cd apps/api
python manage.py runserver

# Terminal 2: Celery Worker
cd apps/api
celery -A plane worker -l info

# Terminal 3: Celery Beat
cd apps/api
celery -A plane beat -l info

# Terminal 4: Frontend
cd apps/web
pnpm dev
```

PM2 is recommended for consistency between development and production environments.

### PM2 Systemd Integration

To ensure PM2 processes start automatically on server reboot, integrate PM2 with systemd:

```bash
# Generate systemd startup script
pm2 startup

# This will output a command like:
# sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u your-user --hp /home/your-user

# Run the command that PM2 outputs
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u root --hp /root

# Save current PM2 process list
pm2 save
```

**What this does**:
- Creates a systemd service file at `/etc/systemd/system/pm2-root.service`
- Enables the service to start on boot
- Automatically restarts all saved PM2 processes on reboot

**Verify systemd integration**:

```bash
# Check PM2 systemd service
sudo systemctl status pm2-root

# Enable service (if not already enabled)
sudo systemctl enable pm2-root

# Test by rebooting
sudo reboot

# After reboot, verify processes are running
pm2 status
```

### PM2 Process Management

```bash
# Stop all processes
pm2 stop all

# Restart all processes
pm2 restart all

# Reload all processes (zero-downtime restart)
pm2 reload all

# Delete all processes
pm2 delete all

# Monitor processes (real-time dashboard)
pm2 monit

# View detailed process info
pm2 show api

# Restart specific process
pm2 restart api

# View process logs
pm2 logs api --lines 100

# Clear all logs
pm2 flush
```

### PM2 Logs

PM2 logs are stored in `~/.pm2/logs/`:

```bash
# View log directory
ls -la ~/.pm2/logs/

# Log files:
# - api-out.log: Standard output
# - api-error.log: Standard error
# - api-combined.log: Combined logs
# - celery-worker-out.log
# - celery-worker-error.log
# etc.
```

---

## Nginx Configuration (Optional)

Nginx can be used as a reverse proxy for SSL termination, load balancing, and static file serving.

### Installation

Nginx is installed by the `setup-server.sh` script, or install manually:

```bash
sudo apt install -y nginx
sudo systemctl enable nginx
sudo systemctl start nginx
```

### Basic Reverse Proxy Configuration

Create Nginx configuration file:

```bash
sudo nano /etc/nginx/sites-available/familyflow
```

**Example Configuration**:

```nginx
# Upstream for Django API
upstream django {
    server 127.0.0.1:8000;
}

# HTTP server (redirects to HTTPS)
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    
    # Redirect all HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

# HTTPS server
server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;

    # SSL certificates (configured via Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    
    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Maximum upload size
    client_max_body_size 10M;

    # API proxy
    location /api/ {
        proxy_pass http://django;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # WebSocket support (if needed)
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    # Static files (Django)
    location /static/ {
        alias /opt/familyflow/apps/api/staticfiles/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # Media files (uploads)
    location /media/ {
        alias /opt/familyflow/apps/api/media/;
        expires 7d;
    }

    # Frontend (if serving from Django or separate frontend server)
    location / {
        # Option 1: Serve from Django (if Django serves frontend)
        proxy_pass http://django;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Option 2: Serve static files directly
        # root /opt/familyflow/apps/web/dist;
        # try_files $uri $uri/ /index.html;
    }
}
```

### Enable Configuration

```bash
# Create symlink to enable site
sudo ln -s /etc/nginx/sites-available/familyflow /etc/nginx/sites-enabled/

# Remove default site (optional)
sudo rm /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

### Static File Serving

If using Nginx for static files, ensure Django static files are collected:

```bash
cd /opt/familyflow/apps/api
python manage.py collectstatic --noinput --settings=plane.settings.production
```

Update Django settings to disable static file serving (Nginx handles it):

```python
# In plane/settings/production.py
STATIC_ROOT = '/opt/familyflow/apps/api/staticfiles/'
# Remove or comment out STATICFILES_DIRS if using Nginx
```

---

## SSL/TLS Setup

### Option 1: Let's Encrypt (Recommended)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Certbot will automatically:
# - Obtain certificates
# - Update Nginx configuration
# - Set up auto-renewal

# Test auto-renewal
sudo certbot renew --dry-run
```

### Option 2: Manual Certificate Upload

If you have SSL certificates from another provider:

```bash
# Create certificate directory
sudo mkdir -p /etc/nginx/ssl

# Upload certificates (via SCP)
scp certificate.crt root@your-droplet-ip:/etc/nginx/ssl/
scp private.key root@your-droplet-ip:/etc/nginx/ssl/

# Update Nginx configuration
sudo nano /etc/nginx/sites-available/familyflow
# Update ssl_certificate and ssl_certificate_key paths

# Reload Nginx
sudo systemctl reload nginx
```

---

## Security Hardening

### Firewall Configuration (UFW)

Configure the firewall to allow only necessary ports:

```bash
# Enable UFW
sudo ufw enable

# Allow SSH (IMPORTANT: Do this first!)
sudo ufw allow 22/tcp

# Allow HTTP and HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Deny all other incoming connections
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Check firewall status
sudo ufw status verbose
```

**Important**: Always allow SSH (port 22) before enabling the firewall, or you may lock yourself out!

### SSH Key Setup

**Disable password authentication and use SSH keys**:

1. Generate SSH key pair on your local machine (if you don't have one):
   ```bash
   ssh-keygen -t ed25519 -C "your-email@example.com"
   ```

2. Copy public key to server:
   ```bash
   ssh-copy-id user@your-server-ip
   ```

3. On the server, edit SSH configuration:
   ```bash
   sudo nano /etc/ssh/sshd_config
   ```

4. Set these security options:
   ```
   PasswordAuthentication no
   PubkeyAuthentication yes
   PermitRootLogin no  # If not using root user
   ```

5. Restart SSH service:
   ```bash
   sudo systemctl restart sshd
   ```

6. Test SSH connection before closing your current session:
   ```bash
   # In a new terminal, test connection
   ssh user@your-server-ip
   ```

### Non-Root User Execution

**Run application as non-root user** (recommended for security):

1. Create application user:
   ```bash
   sudo adduser familyflow
   sudo usermod -aG sudo familyflow  # Add sudo privileges if needed
   ```

2. Set up application directory with proper permissions:
   ```bash
   sudo mkdir -p /opt/familyflow
   sudo chown -R familyflow:familyflow /opt/familyflow
   ```

3. Clone repository as application user:
   ```bash
   sudo -u familyflow git clone your-repo-url /opt/familyflow
   ```

4. Run PM2 as application user:
   ```bash
   sudo -u familyflow pm2 start ecosystem.config.js --env production
   sudo -u familyflow pm2 save
   sudo -u familyflow pm2 startup
   # Execute the generated command
   ```

5. Update systemd service to run as application user (if needed):
   ```bash
   sudo systemctl edit pm2-familyflow
   # Add:
   # [Service]
   # User=familyflow
   # Group=familyflow
   ```

### Environment Variable Security

- **Never commit `.env` files** to version control
- Use strong, unique `SECRET_KEY` values
- Rotate secrets regularly
- Use environment-specific `.env` files
- Restrict file permissions:
  ```bash
  chmod 600 apps/api/.env
  chmod 600 apps/web/.env
  ```

### SSL/TLS Configuration

Always use HTTPS in production:

- Configure Nginx with SSL certificates (Let's Encrypt)
- Set `SECURE_PROXY_SSL_HEADER` in Django settings
- Use `ALLOWED_HOSTS` to restrict valid domains
- Enable HSTS headers

### Regular Security Updates

```bash
# Update system packages regularly
sudo apt update
sudo apt upgrade -y

# Update Node.js and Python packages
cd /opt/familyflow
pnpm update
cd apps/api
pip install --upgrade -r requirements/production.txt
```

### Database Security

- Use Supabase connection pooling
- Enable Row Level Security (RLS) policies
- Use strong database passwords
- Restrict database access by IP (if possible)
- Regularly backup database

### Application Security

- Keep Django and dependencies updated
- Enable Django security middleware
- Use CSRF protection
- Set secure cookie flags
- Implement rate limiting
- Monitor logs for suspicious activity

---

## Monitoring & Maintenance

### Health Checks

```bash
# Check API health
curl http://localhost:8000/api/health

# Check Redis
redis-cli ping


# Check PM2 processes
pm2 status

# Check system resources
htop
df -h
free -h
```

### Log Monitoring

```bash
# PM2 logs (real-time)
pm2 logs --lines 50

# Nginx access logs
sudo tail -f /var/log/nginx/access.log

# Nginx error logs
sudo tail -f /var/log/nginx/error.log

# System logs
sudo journalctl -u pm2-root -f
sudo journalctl -u redis-server -f
```

### Backup Strategy

```bash
# Database backups (Supabase handles this, but manual backup example)
# pg_dump $SUPABASE_DB_URL > backup.sql

# Application code backups
# Git repository serves as backup

# Environment variable backup
# Copy .env files to secure location (not in Git)
```

---

## Troubleshooting

### PM2 Processes Not Starting

```bash
# Check PM2 logs
pm2 logs

# Check process status
pm2 status

# Restart all processes
pm2 restart all

# Check if systemd service is enabled
sudo systemctl status pm2-root
```

### Database Connection Issues

```bash
# Verify Supabase connection string
echo $SUPABASE_DB_URL

# Test connection
psql $SUPABASE_DB_URL -c "SELECT 1"

# Check IP allowlist in Supabase dashboard
```

### Redis Connection Issues

```bash
# Check Redis status
sudo systemctl status redis-server

# Test Redis connection
redis-cli ping

# Check Redis logs
sudo journalctl -u redis-server -n 50

# Verify REDIS_URL in .env
cat apps/api/.env | grep REDIS_URL
```


### Nginx Issues

```bash
# Test Nginx configuration
sudo nginx -t

# Check Nginx status
sudo systemctl status nginx

# View Nginx error logs
sudo tail -f /var/log/nginx/error.log

# Reload Nginx after configuration changes
sudo systemctl reload nginx
```

### Port Already in Use

```bash
# Find process using port 8000
sudo lsof -i :8000

# Kill process (if needed)
sudo kill -9 <PID>

# Or change port in ecosystem.config.js
```

### Permission Issues

```bash
# Ensure PM2 user has permissions
sudo chown -R $USER:$USER /opt/familyflow

# Check file permissions
ls -la /opt/familyflow/apps/api/bin/entrypoint-*.sh

# Make scripts executable (if needed)
chmod +x /opt/familyflow/apps/api/bin/entrypoint-*.sh
```

---

## Connection String Examples

### Redis

```bash
# Local installation (default)
REDIS_URL=redis://localhost:6379/0

# With password
REDIS_URL=redis://:password@localhost:6379/0

# Custom database
REDIS_URL=redis://localhost:6379/1

# Remote Redis (if using managed Redis service)
REDIS_URL=redis://:password@redis-host:6379/0
```


### Supabase Database

```bash
# Connection string from Supabase dashboard
SUPABASE_DB_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres?sslmode=require

# Alternative format
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres?sslmode=require
```

---

## Summary Checklist

- [ ] Digital Ocean droplet provisioned
- [ ] Initial server setup completed (`setup-server.sh`)
- [ ] Redis installed and running
- [ ] Systemd services enabled for auto-start
- [ ] Application repository cloned
- [ ] Environment variables configured (`.env` file)
- [ ] Database migrations run
- [ ] Frontend built
- [ ] PM2 processes started
- [ ] PM2 systemd integration configured
- [ ] Nginx configured (optional)
- [ ] SSL certificates installed (optional)
- [ ] Health checks passing
- [ ] Monitoring setup

---

## Troubleshooting

This section covers common issues encountered during deployment and their solutions.

### PM2 Process Issues

#### Processes Not Starting

**Symptoms**: `pm2 start ecosystem.config.js` fails or processes show as "errored"

**Solutions**:
1. Check PM2 logs:
   ```bash
   pm2 logs
   ```

2. Verify entrypoint scripts are executable:
   ```bash
   chmod +x apps/api/bin/entrypoint-*.sh
   ```

3. Check environment variables:
   ```bash
   # Verify .env file exists and is configured
   cat apps/api/.env
   ```

4. Test database connection:
   ```bash
   cd apps/api
   python manage.py check --database default
   ```

5. Verify Redis is running:
   ```bash
   systemctl status redis-server
   redis-cli ping
   ```

#### Processes Keep Restarting

**Symptoms**: PM2 processes restart repeatedly (high restart count)

**Solutions**:
1. Check error logs for the specific process:
   ```bash
   pm2 logs <process-name> --err --lines 50
   ```

2. Verify database connectivity:
   ```bash
   cd apps/api
   python manage.py wait_for_db
   ```

3. Check for port conflicts:
   ```bash
   # Check if ports are already in use
   netstat -tulpn | grep -E ':(8000|3000|5672|6379)'
   ```

4. Review PM2 configuration:
   ```bash
   pm2 describe <process-name>
   ```

### Database Connection Issues

#### Cannot Connect to Supabase

**Symptoms**: Database connection errors, migration failures

**Solutions**:
1. Verify `SUPABASE_DB_URL` is correctly formatted:
   ```bash
   # Should be in format:
   # postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres?sslmode=require
   echo $SUPABASE_DB_URL
   ```

2. Test connection manually:
   ```bash
   cd apps/api
   python manage.py dbshell
   ```

3. Check Supabase dashboard for:
   - Database is active
   - Connection pool limits
   - IP restrictions (if configured)

4. Verify SSL mode:
   - Supabase requires `sslmode=require` in connection string

### Frontend Build Issues

#### Build Fails

**Symptoms**: `pnpm build` fails with errors

**Solutions**:
1. Clear build cache:
   ```bash
   cd apps/web
   rm -rf node_modules/.cache
   rm -rf build
   pnpm build
   ```

2. Check Node.js version:
   ```bash
   node --version  # Should be 22+
   ```

3. Verify environment variables:
   ```bash
   # Check VITE_API_BASE_URL is set
   cat apps/web/.env
   ```

4. Check for TypeScript errors:
   ```bash
   cd apps/web
   pnpm check:types
   ```

### Migration Issues

#### Migrations Fail

**Symptoms**: `python manage.py migrate` fails

**Solutions**:
1. Check database permissions:
   ```bash
   cd apps/api
   python manage.py showmigrations
   ```

2. Verify database schema:
   ```bash
   python manage.py dbshell
   \dt  # List tables
   ```

3. Reset migrations (if safe):
   ```bash
   # WARNING: Only in development
   python manage.py migrate --fake-initial
   ```

4. Check for migration conflicts:
   ```bash
   python manage.py makemigrations --dry-run
   ```

### PM2 Process Management

#### PM2 Processes Not Starting

**Symptoms**: `pm2 start ecosystem.config.js` fails or processes show as "errored"

**Solutions**:
1. Check PM2 logs for detailed error messages:
   ```bash
   pm2 logs
   pm2 logs [process-name] --err --lines 50
   ```

2. Verify entrypoint scripts are executable:
   ```bash
   chmod +x apps/api/bin/entrypoint-*.sh
   ```

3. Check process status:
   ```bash
   pm2 status
   pm2 describe [process-name]
   ```

4. Verify environment variables are loaded:
   ```bash
   # Check if .env files exist
   ls -la apps/api/.env apps/web/.env
   ```

5. Test individual process startup:
   ```bash
   # Test API process manually
   cd apps/api
   ./bin/entrypoint-api.sh
   ```

#### PM2 Log Locations

PM2 logs are stored in `~/.pm2/logs/`:
- `api-error.log` - API error logs
- `api-out.log` - API output logs
- `api-combined.log` - Combined API logs
- `celery-worker-error.log` - Worker error logs
- `celery-worker-out.log` - Worker output logs
- `celery-beat-error.log` - Beat scheduler error logs
- `web-error.log` - Frontend error logs
- `web-out.log` - Frontend output logs

View logs:
```bash
# View all logs
pm2 logs

# View specific process logs
pm2 logs api
pm2 logs celery-worker

# View last 100 lines
pm2 logs --lines 100

# Follow logs in real-time
pm2 logs --lines 0
```

#### PM2 Restart Procedures

**Graceful Restart** (zero-downtime):
```bash
pm2 reload all
# Or reload specific process
pm2 reload api
```

**Full Restart**:
```bash
pm2 restart all
# Or restart specific process
pm2 restart api
```

**Stop and Start**:
```bash
pm2 stop all
pm2 start ecosystem.config.js --env production
```

**Delete and Recreate** (clean slate):
```bash
pm2 delete all
pm2 start ecosystem.config.js --env production
pm2 save
```

#### PM2 Auto-Start Not Working

**Symptoms**: PM2 processes don't start after server reboot

**Solutions**:
1. Verify PM2 startup is configured:
   ```bash
   pm2 startup
   # Execute the generated command as root
   ```

2. Check systemd service:
   ```bash
   systemctl status pm2-$(whoami)
   ```

3. Verify PM2 save:
   ```bash
   pm2 save
   ls -la ~/.pm2/dump.pm2
   ```

4. Test systemd service:
   ```bash
   sudo systemctl enable pm2-$(whoami)
   sudo systemctl start pm2-$(whoami)
   ```

5. Check systemd service logs:
   ```bash
   journalctl -u pm2-$(whoami) -f
   ```

### Port Conflicts

**Symptoms**: "Address already in use" errors

**Solutions**:
1. Find process using port:
   ```bash
   # For port 8000 (API)
   lsof -i :8000
   # Or
   netstat -tulpn | grep 8000
   ```

2. Kill conflicting process:
   ```bash
   kill -9 <PID>
   ```

3. Change port in configuration:
   ```bash
   # In apps/api/.env
   PORT=8001
   ```

### Environment Variable Issues

#### Variables Not Loading

**Symptoms**: Application uses wrong/default values

**Solutions**:
1. Verify .env file location:
   ```bash
   # Should be in apps/api/.env
   ls -la apps/api/.env
   ```

2. Check .env file syntax:
   ```bash
   # No spaces around =
   # Correct: KEY=value
   # Wrong: KEY = value
   ```

3. Verify Django loads .env:
   ```bash
   cd apps/api
   python manage.py shell
   >>> import os
   >>> os.environ.get('SECRET_KEY')
   ```

4. Check PM2 environment loading:
   ```bash
   # In ecosystem.config.js, verify env_file is set
   env_file: "./apps/api/.env"
   ```

### Static Files Not Serving

**Symptoms**: CSS/JS files return 404

**Solutions**:
1. Collect static files:
   ```bash
   cd apps/api
   python manage.py collectstatic --noinput
   ```

2. Verify STATIC_ROOT in settings:
   ```bash
   # Should be set in production settings
   python manage.py shell
   >>> from django.conf import settings
   >>> settings.STATIC_ROOT
   ```

3. Check Nginx configuration (if using):
   ```bash
   # Verify static file location in Nginx config
   cat /etc/nginx/sites-available/default
   ```

### Performance Issues

#### High Memory Usage

**Symptoms**: Server runs out of memory

**Solutions**:
1. Monitor PM2 processes:
   ```bash
   pm2 monit
   ```

2. Reduce Gunicorn workers:
   ```bash
   # In apps/api/.env
   GUNICORN_WORKERS=2  # Reduce from default 4
   ```

3. Check for memory leaks:
   ```bash
   pm2 logs --lines 100 | grep -i memory
   ```

#### Slow Response Times

**Solutions**:
1. Check database query performance:
   ```bash
   # Enable query logging in Django settings
   DEBUG=True  # Temporarily
   ```

2. Verify Redis caching:
   ```bash
   redis-cli ping
   redis-cli info stats
   ```

3. Check network latency:
   ```bash
   # Test Supabase connection speed
   ping db.[PROJECT_REF].supabase.co
   ```

### SSL/HTTPS Issues

#### Certificate Errors

**Solutions**:
1. Verify Let's Encrypt certificate:
   ```bash
   sudo certbot certificates
   ```

2. Check Nginx SSL configuration:
   ```bash
   sudo nginx -t
   sudo systemctl reload nginx
   ```

3. Verify certificate renewal:
   ```bash
   sudo certbot renew --dry-run
   ```

### Getting Help

If issues persist:

1. Check logs:
   ```bash
   pm2 logs
   tail -f apps/api/logs/plane-error.log
   ```

2. Review deployment documentation:
   - `specs/001-family-management/DEPLOYMENT.md`
   - `specs/001-family-management/quickstart.md`

3. Run verification scripts:
   ```bash
   ./bin/verify-deploy-script.sh --dry-run
   ./bin/verify-production-config.sh
   ./bin/verify-pm2-autostart.sh
   ```

4. Check system resources:
   ```bash
   df -h  # Disk space
   free -h  # Memory
   top  # CPU/Memory usage
   ```

---

## Next Steps

After successful deployment:

1. Set up monitoring and alerting
2. Configure automated backups
3. Set up CI/CD pipeline (optional)
4. Configure domain DNS records
5. Test all application features
6. Set up log aggregation (optional)

---

## Additional Resources

- [PM2 Documentation](https://pm2.keymetrics.io/docs/usage/quick-start/)
- [Redis Documentation](https://redis.io/docs/)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)
- [Digital Ocean Droplet Guide](https://www.digitalocean.com/community/tutorials/initial-server-setup-with-ubuntu-22-04)
- [Supabase Documentation](https://supabase.com/docs)

