# Deploying Plane on Hetzner with EasyPanel

This guide will help you deploy Plane on a Hetzner server using EasyPanel, a modern hosting panel that simplifies Docker deployments.

## Prerequisites

- Hetzner Cloud server (minimum 4GB RAM, 8GB+ recommended)
- Domain name (optional, can use IP address)
- Basic knowledge of EasyPanel

## Step 1: Set Up Hetzner Server

1. Create a Hetzner Cloud server (Ubuntu 22.04 recommended)
2. Choose at least 4GB RAM (8GB+ for production)
3. Note your server IP address

## Step 2: Install EasyPanel

SSH into your Hetzner server and run:

```bash
curl -sSL https://get.easypanel.io | bash
```

After installation, access EasyPanel at:
- `http://your-server-ip:3000`

## Step 3: Deploy Plane in EasyPanel

### Option A: Using Docker Compose (Recommended)

1. **Create a New Project in EasyPanel:**
   - Click "New Project"
   - Name it "plane" or "plane-app"

2. **Add Docker Compose Service:**
   - Click "Add Service"
   - Select "Docker Compose" or "App" service type
   - Choose "From Compose File"

3. **Upload or Paste Compose File:**
   - Use the `docker-compose.easypanel.yml` file from this repo
   - Or paste the content directly into EasyPanel

4. **Configure Environment Variables:**
   - EasyPanel will show you all the environment variables
   - Fill in the required values (see below)

### Option B: Using Pre-built Image (Simpler)

1. **Create New Project:**
   - Click "New Project" → Name it "plane"

2. **Add App Service:**
   - Click "Add Service" → Select "App"
   - Choose "Docker Image"

3. **Configure Image:**
   - Image: `artifacts.plane.so/makeplane/plane-aio-community:latest`
   - Port: `80` (HTTP) and `443` (HTTPS)

4. **Set Environment Variables:**
   - Add all required environment variables (see below)

## Step 4: Configure Environment Variables

In EasyPanel, you'll need to set these environment variables:

### Required Variables

```env
# Domain Configuration
DOMAIN_NAME=your-domain.com
# Or use IP: DOMAIN_NAME=123.45.67.89

# Database (if using included postgres service)
POSTGRES_USER=plane
POSTGRES_PASSWORD=your-secure-password
POSTGRES_DB=plane
DATABASE_URL=postgresql://plane:your-secure-password@postgres:5432/plane

# Redis (if using included redis service)
REDIS_URL=redis://redis:6379

# RabbitMQ (if using included rabbitmq service)
RABBITMQ_USER=plane
RABBITMQ_PASSWORD=your-secure-password
RABBITMQ_VHOST=plane
AMQP_URL=amqp://plane:your-secure-password@rabbitmq:5672/plane

# S3 Storage (Hetzner Object Storage recommended)
AWS_REGION=fsn1
AWS_ACCESS_KEY_ID=your-hetzner-object-storage-key
AWS_SECRET_ACCESS_KEY=your-hetzner-object-storage-secret
AWS_S3_BUCKET_NAME=plane-uploads
AWS_S3_ENDPOINT_URL=https://fsn1.your-objectstorage.com
USE_MINIO=0

# Security Keys (generate with: openssl rand -hex 32)
SECRET_KEY=your-50-char-secret-key
LIVE_SERVER_SECRET_KEY=your-live-server-secret-key
```

### Optional Variables

```env
# File Uploads
FILE_SIZE_LIMIT=5242880

# API Rate Limiting
API_KEY_RATE_LIMIT=60/minute

# SSL/TLS (for HTTPS)
CERT_EMAIL=your-email@example.com
APP_PROTOCOL=https

# CORS
CORS_ALLOWED_ORIGINS=http://your-domain.com,https://your-domain.com
```

## Step 5: Using External Services (Optional)

EasyPanel makes it easy to use external services. You can:

### Use Hetzner Managed Database

1. Create a PostgreSQL database in Hetzner Cloud Console
2. Update `DATABASE_URL` in EasyPanel:
   ```
   DATABASE_URL=postgresql://user:pass@db.your-project.db.cloud.hetzner.com:5432/plane
   ```
3. Remove the `postgres` service from docker-compose

### Use Hetzner Object Storage

1. Create Object Storage bucket in Hetzner Cloud Console
2. Generate access keys
3. Set in EasyPanel:
   ```env
   AWS_REGION=fsn1
   AWS_ACCESS_KEY_ID=your-key
   AWS_SECRET_ACCESS_KEY=your-secret
   AWS_S3_BUCKET_NAME=plane-uploads
   AWS_S3_ENDPOINT_URL=https://fsn1.your-objectstorage.com
   USE_MINIO=0
   ```

### Use External Redis

1. Create Redis instance (or use Hetzner Managed Redis if available)
2. Update `REDIS_URL` in EasyPanel
3. Remove the `redis` service from docker-compose

## Step 6: Deploy and Access

1. **Deploy:**
   - Click "Deploy" or "Save" in EasyPanel
   - Wait for services to start (may take a few minutes)

2. **Check Logs:**
   - Click on the `plane` service
   - View logs to ensure everything started correctly

3. **Access Plane:**
   - Initial setup: `http://your-domain.com/god-mode/` (or `http://your-ip/god-mode/`)
   - Register as instance admin
   - Main app: `http://your-domain.com` (or `http://your-ip`)

## Step 7: Configure Domain & SSL (Optional)

### Using EasyPanel's Built-in SSL

1. In EasyPanel, go to your project
2. Add a domain in the domain settings
3. EasyPanel can automatically configure SSL with Let's Encrypt

### Manual Domain Configuration

1. Point your domain to your Hetzner server IP
2. In EasyPanel, update environment variables:
   ```env
   DOMAIN_NAME=your-domain.com
   APP_PROTOCOL=https
   CERT_EMAIL=your-email@example.com
   ```
3. Restart the service

## Troubleshooting

### Service Won't Start

1. **Check Logs in EasyPanel:**
   - Click on the service → View logs
   - Look for error messages

2. **Common Issues:**
   - Missing environment variables
   - Database connection errors
   - Port conflicts

### Database Connection Issues

- Verify `DATABASE_URL` is correct
- Check if postgres service is running
- Ensure network connectivity between services

### Can't Access Plane

- Check if port 80/443 is open in Hetzner firewall
- Verify domain DNS is pointing to server
- Check EasyPanel service status

### Memory Issues

- Ensure server has at least 4GB RAM
- Monitor resource usage in EasyPanel dashboard
- Consider upgrading server size

## EasyPanel-Specific Tips

1. **Volumes:**
   - EasyPanel automatically manages volumes
   - Data persists across restarts
   - Backup volumes regularly

2. **Updates:**
   - To update Plane, change the image tag in EasyPanel
   - Or rebuild from source if using Dockerfile

3. **Monitoring:**
   - Use EasyPanel's built-in monitoring
   - Check service health status
   - View resource usage

4. **Backups:**
   - EasyPanel can help with volume backups
   - Or use Hetzner's backup service
   - Regularly backup PostgreSQL database

## Quick Reference: Environment Variables Template

Copy this into EasyPanel's environment variables section:

```env
DOMAIN_NAME=your-domain.com
POSTGRES_USER=plane
POSTGRES_PASSWORD=change-me
POSTGRES_DB=plane
DATABASE_URL=postgresql://plane:change-me@postgres:5432/plane
REDIS_URL=redis://redis:6379
RABBITMQ_USER=plane
RABBITMQ_PASSWORD=change-me
RABBITMQ_VHOST=plane
AMQP_URL=amqp://plane:change-me@rabbitmq:5672/plane
AWS_REGION=fsn1
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
AWS_S3_BUCKET_NAME=plane-uploads
AWS_S3_ENDPOINT_URL=https://fsn1.your-objectstorage.com
USE_MINIO=0
SECRET_KEY=generate-with-openssl-rand-hex-32
LIVE_SERVER_SECRET_KEY=generate-with-openssl-rand-hex-32
FILE_SIZE_LIMIT=5242880
```

## Support

- [EasyPanel Documentation](https://easypanel.io/docs)
- [Plane Documentation](https://developers.plane.so/)
- [Plane Discord](https://discord.com/invite/A92xrEGCge)

