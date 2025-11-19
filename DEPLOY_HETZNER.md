# Deploying Plane on Hetzner

This guide will help you deploy Plane on a Hetzner server using Docker.

## Prerequisites

- A Hetzner Cloud server (minimum 4GB RAM recommended, 8GB+ for production)
- Docker and Docker Compose installed
- Domain name (optional, can use IP address)
- Basic knowledge of Linux and Docker

## Quick Start

### 1. Install Docker and Docker Compose

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo apt install docker-compose-plugin -y

# Add your user to docker group (optional, to run without sudo)
sudo usermod -aG docker $USER
newgrp docker
```

### 2. Clone and Setup Plane

```bash
# Clone the repository
git clone https://github.com/makeplane/plane.git
cd plane

# Copy environment file
cp .env.hetzner.example .env

# Edit the environment file
nano .env
```

### 3. Configure Environment Variables

Edit `.env` file with your configuration:

**Required settings:**
- `DOMAIN_NAME`: Your domain or Hetzner server IP
- `POSTGRES_PASSWORD`: Strong password for PostgreSQL
- `RABBITMQ_PASSWORD`: Strong password for RabbitMQ
- `SECRET_KEY`: Django secret key (generate with: `openssl rand -hex 32`)
- `LIVE_SERVER_SECRET_KEY`: Live server secret (generate with: `openssl rand -hex 32`)

**Storage options:**

**Option A: Hetzner Object Storage (Recommended)**
```env
AWS_REGION=fsn1
AWS_ACCESS_KEY_ID=your-hetzner-object-storage-key
AWS_SECRET_ACCESS_KEY=your-hetzner-object-storage-secret
AWS_S3_BUCKET_NAME=plane-uploads
AWS_S3_ENDPOINT_URL=https://fsn1.your-objectstorage.com
USE_MINIO=0
```

**Option B: Local MinIO (for testing)**
```env
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=minioadmin
AWS_SECRET_ACCESS_KEY=minioadmin
AWS_S3_BUCKET_NAME=plane-uploads
AWS_S3_ENDPOINT_URL=http://minio:9000
USE_MINIO=1
```

### 4. Deploy Plane

**Option 1: Using Docker Compose (Recommended)**

```bash
# Start all services
docker compose -f docker-compose.hetzner.yml up -d

# If using local MinIO, add --profile minio:
# docker compose --profile minio -f docker-compose.hetzner.yml up -d

# View logs
docker compose -f docker-compose.hetzner.yml logs -f

# Check status
docker compose -f docker-compose.hetzner.yml ps
```

**Option 2: Using the All-In-One Dockerfile**

```bash
# Build the image
docker build -f Dockerfile.hetzner -t plane-hetzner .

# Run the container
docker run -d \
  --name plane-app \
  -p 80:80 -p 443:443 \
  --env-file .env \
  -v plane_logs:/app/logs \
  -v plane_data:/app/data \
  plane-hetzner
```

### 5. Access Plane

1. **Initial Setup:**
   - Open `http://your-domain.com/god-mode/` (or `http://your-ip/god-mode/`)
   - Register as instance admin

2. **Main Application:**
   - Access at `http://your-domain.com` (or `http://your-ip`)

## Using Hetzner Object Storage

1. Create a Hetzner Object Storage bucket in the Hetzner Cloud Console
2. Generate access keys
3. Update your `.env` file with the credentials:
   ```env
   AWS_REGION=fsn1  # or your region
   AWS_ACCESS_KEY_ID=your-key
   AWS_SECRET_ACCESS_KEY=your-secret
   AWS_S3_BUCKET_NAME=your-bucket-name
   AWS_S3_ENDPOINT_URL=https://fsn1.your-objectstorage.com
   ```

## SSL/HTTPS Setup

### Option 1: Let's Encrypt (Automatic)

1. Set your domain in `.env`:
   ```env
   DOMAIN_NAME=your-domain.com
   APP_PROTOCOL=https
   CERT_EMAIL=your-email@example.com
   ```

2. Point your domain to your Hetzner server IP

3. Restart the container:
   ```bash
   docker compose -f docker-compose.hetzner.yml restart plane
   ```

### Option 2: Manual SSL Certificate

1. Obtain SSL certificates (e.g., from Let's Encrypt using certbot)
2. Mount certificates in docker-compose.yml
3. Configure Caddy to use the certificates

## Maintenance

### View Logs

```bash
# All services
docker compose -f docker-compose.hetzner.yml logs -f

# Specific service
docker compose -f docker-compose.hetzner.yml logs -f plane

# Application logs inside container
docker exec -it plane-app tail -f /app/logs/access/api.log
```

### Backup Database

```bash
# Create backup
docker exec plane-postgres pg_dump -U plane plane > backup_$(date +%Y%m%d).sql

# Restore backup
cat backup_20240101.sql | docker exec -i plane-postgres psql -U plane plane
```

### Update Plane

```bash
# Pull latest changes
git pull

# Rebuild and restart
docker compose -f docker-compose.hetzner.yml build
docker compose -f docker-compose.hetzner.yml up -d

# Run migrations (if needed)
docker compose -f docker-compose.hetzner.yml exec plane python /app/backend/manage.py migrate
```

### Stop Services

```bash
docker compose -f docker-compose.hetzner.yml down

# Remove volumes (WARNING: deletes data)
docker compose -f docker-compose.hetzner.yml down -v
```

## Troubleshooting

### Container won't start

```bash
# Check logs
docker compose -f docker-compose.hetzner.yml logs plane

# Check container status
docker compose -f docker-compose.hetzner.yml ps
```

### Database connection issues

```bash
# Test database connection
docker compose -f docker-compose.hetzner.yml exec postgres psql -U plane -d plane -c "SELECT 1;"

# Check DATABASE_URL in .env matches container name
```

### Port already in use

```bash
# Check what's using the port
sudo netstat -tulpn | grep :80

# Change ports in .env
HTTP_PORT=8080
HTTPS_PORT=8443
```

### Memory issues

- Ensure your Hetzner server has at least 4GB RAM
- Monitor memory usage: `free -h`
- Consider upgrading to a larger server

## Security Recommendations

1. **Change default passwords** in `.env`
2. **Use strong SECRET_KEY** (generate with `openssl rand -hex 32`)
3. **Enable firewall:**
   ```bash
   sudo ufw allow 22/tcp
   sudo ufw allow 80/tcp
   sudo ufw allow 443/tcp
   sudo ufw enable
   ```
4. **Use HTTPS** in production
5. **Regular backups** of database and volumes
6. **Keep Docker and system updated**

## Performance Optimization

1. **Use Hetzner Object Storage** instead of local MinIO for production
2. **Enable Redis caching** (already included)
3. **Use external PostgreSQL** (Hetzner Managed Database) for better performance
4. **Monitor resource usage:**
   ```bash
   docker stats
   ```

## Support

- [Plane Documentation](https://developers.plane.so/)
- [Plane Discord](https://discord.com/invite/A92xrEGCge)
- [GitHub Issues](https://github.com/makeplane/plane/issues)

