# Airgapped Installation Instructions

This build allows for Plane to be installed locally in an offline environment.

## Prerequisites

- Docker installed and running
  - Version 24 or higher required
  - Must be running and accessible
- Docker Compose
  - Either `docker-compose` or `docker compose` command must be available
- Required files:
  - A tarball of all the images (all-images.tar)
  - A docker-compose.yml file
  - A plane.env file

## Required Files

- `docker-compose.yml` - Docker Compose configuration for service orchestration
- `plane.env` - Default configuration file containing environment variables
- `admin-commercial-<version>.tar` - Docker image for admin service
- `backend-commercial-<version>.tar` - Docker image for api/worker/beat-worker/migrator service
- `email-commercial-<version>.tar` - Docker image for email service
- `live-commercial-<version>.tar` - Docker image for live service
- `monitor-commercial-<version>.tar` - Docker image for monitor service
- `proxy-commercial-<version>.tar` - Docker image for plane-proxy service
- `silo-commercial-<version>.tar` - Docker image for silo service
- `space-commercial-<version>.tar` - Docker image for space service
- `web-commercial-<version>.tar` - Docker image for web service
- `minio-latest.tar` - Docker image for plane-minio service
- `postgres-15.7-alpine.tar` - Docker image for plane-db service
- `rabbitmq-3.13.6-management-alpine.tar` - Docker image for plane-mq service
- `valkey-7.2.5-alpine.tar` - Docker image for plane-redis service

## Installation Process

1. Run the installation script:
   ```bash
   bash ./install.sh
   ```

2. The script will:
   - Check for required prerequisites
   - Ask for installation directory (default: ./plane)
   - Ask for domain/IP address (default: 127.0.0.1)
   - Create necessary directory structure
   - Load Docker images
   - Configure environment variables

3. The installation will create the following directory structure:
   ```
   <installation_directory>/
   ├── docker-compose.yml
   ├── plane.env
   ├── data/
   └── logs/
   ```

## Environment Variables

The following key environment variables are automatically configured during installation:

- `MACHINE_SIGNATURE` - A unique UUID generated for your installation
- `DOMAIN_NAME` - The domain or IP address where Plane will be accessible
- `WEB_URL` - The full URL where Plane will be accessible (e.g., http://your-domain)
- `CORS_ALLOWED_ORIGINS` - Allowed origins for CORS (Cross-Origin Resource Sharing)

## Post-Installation Steps

After installation completes, follow these steps to start Plane:

1. Switch to the installation directory:
   ```bash
   cd <installation_directory>
   ```

2. Start the services:
   ```bash
   docker compose -f docker-compose.yml --env-file plane.env up -d
   ```

3. Monitor the migration process:
   ```bash
   docker compose logs -f migrator
   ```

4. Once migration completes, monitor the API service:
   ```bash
   docker compose logs -f api
   ```

5. Access Plane at http://your-domain-or-ip

## Support

If you encounter any issues during installation or need assistance:

- Read our Docs: [Docs](https://docs.plane.so/)
- Email our support team: support@plane.so
