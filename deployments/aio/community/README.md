# Plane Community All-In-One (AIO) Docker Image

The Plane Community All-In-One Docker image packages all Plane services into a single container for easy deployment and testing. This image includes web interface, API server, background workers, live server, and more.

## What's Included

The AIO image contains the following services:

- **Proxy** (Port 80, 443): Caddy reverse proxy, the only exposed entry point
- **Web App**: Main Plane web interface, static files served by the proxy at `/`
- **Admin**: Instance admin (God mode), static files served by the proxy at `/god-mode`
- **Space** (internal port 3002): Public project spaces at `/spaces`
- **API Server** (internal port 3004): Backend API at `/api` and `/auth`
- **Live Server** (internal port 3005): Real-time collaboration at `/live`
- **Worker & Beat**: Background task processing
- **Migrator**: Runs database migrations at startup

## Prerequisites

### Required External Services

The AIO image requires these external services to be running:

- **PostgreSQL Database**: For data storage
- **Redis**: For caching and session management
- **RabbitMQ**: For message queuing
- **S3-Compatible Storage**: For file uploads (AWS S3 or MinIO)

### Required Environment Variables

You must provide these environment variables:

#### Core Configuration

- `DOMAIN_NAME`: Your domain name or IP address
- `DATABASE_URL`: PostgreSQL connection string
- `REDIS_URL`: Redis connection string
- `AMQP_URL`: RabbitMQ connection string
- `SECRET_KEY`: Django secret key (see [Security & Secrets](#security--secrets))
- `LIVE_SERVER_SECRET_KEY`: Live server secret (see [Security & Secrets](#security--secrets))

#### Storage Configuration

- `AWS_REGION`: AWS region (e.g., us-east-1)
- `AWS_ACCESS_KEY_ID`: S3 access key
- `AWS_SECRET_ACCESS_KEY`: S3 secret key
- `AWS_S3_BUCKET_NAME`: S3 bucket name
- `AWS_S3_ENDPOINT_URL`: S3 endpoint (optional, defaults to `https://s3.${AWS_REGION}.amazonaws.com`)

## Quick Start

### Basic Usage

```bash
docker run --name plane-aio --rm -it \
    -p 80:80 \
    -e DOMAIN_NAME=your-domain.com \
    -e DATABASE_URL=postgresql://user:pass@host:port/database \
    -e REDIS_URL=redis://host:port \
    -e AMQP_URL=amqp://user:pass@host:port/vhost \
    -e AWS_REGION=us-east-1 \
    -e AWS_ACCESS_KEY_ID=your-access-key \
    -e AWS_SECRET_ACCESS_KEY=your-secret-key \
    -e AWS_S3_BUCKET_NAME=your-bucket \
    -e SECRET_KEY=your-unique-secret-key \
    -e LIVE_SERVER_SECRET_KEY=your-unique-live-server-secret \
    makeplane/plane-aio-community:latest
```

### Example with IP Address

```bash
MYIP=192.168.68.169
docker run --name myaio --rm -it \
    -p 80:80 \
    -e DOMAIN_NAME=${MYIP} \
    -e DATABASE_URL=postgresql://plane:plane@${MYIP}:15432/plane \
    -e REDIS_URL=redis://${MYIP}:16379 \
    -e AMQP_URL=amqp://plane:plane@${MYIP}:15673/plane \
    -e AWS_REGION=us-east-1 \
    -e AWS_ACCESS_KEY_ID=5MV45J9NF5TEFZWYCRAX \
    -e AWS_SECRET_ACCESS_KEY=7xMqAiAHsf2UUjMH+EwICXlyJL9TO30m8leEaDsL \
    -e AWS_S3_BUCKET_NAME=plane-app \
    -e AWS_S3_ENDPOINT_URL=http://${MYIP}:19000 \
    -e FILE_SIZE_LIMIT=10485760 \
    -e SECRET_KEY=$(openssl rand -hex 32) \
    -e LIVE_SERVER_SECRET_KEY=$(openssl rand -hex 32) \
    makeplane/plane-aio-community:latest
```

## Configuration Options

### Optional Environment Variables

#### Network & Protocol

- `SITE_ADDRESS`: Server bind address (default: `:80`). Set it to your domain (e.g. `plane.example.com`) to have Caddy serve HTTPS on 443 with an automatic certificate.
- `APP_PROTOCOL`: `http` or `https` (default: `http`). Used to build `WEB_URL` and `CORS_ALLOWED_ORIGINS` from `DOMAIN_NAME`.

#### Security & Secrets

- `SECRET_KEY` (required): Django secret key. It also encrypts saved instance settings, so keep the same value across restarts and container recreation. No default is provided and none is generated.
- `LIVE_SERVER_SECRET_KEY` (required): Live server secret. No default is provided and none is generated.

Set both to unique, private values, either in `plane.env` (`variables.env`) or as environment variables. The container exits at startup if either is empty or still set to a default/placeholder value.

In v1.4.0 to v1.4.2 a container started without `SECRET_KEY` received a generated key that changed on every recreation. When upgrading such a container, read the current key from the running container's `/app/plane.env` and pass it as `SECRET_KEY`.

- `REDIS_SSL_CERT_REQS`: For a `rediss://` `REDIS_URL`, the Redis server certificate and hostname are verified by default (`required`). Set it to `none` to skip verification.
- `REDIS_SSL_CA_CERTS`: Path inside the container to a CA bundle, for a Redis server whose certificate is issued by a private CA. Mount the file with `-v`, for example `-v /path/to/redis-ca.pem:/certs/redis-ca.pem:ro -e REDIS_SSL_CA_CERTS=/certs/redis-ca.pem`.

#### File Handling

- `FILE_SIZE_LIMIT`: Maximum file upload size in bytes (default: `5242880` = 5MB)

#### API Configuration

- `API_KEY_RATE_LIMIT`: API key rate limit (default: `60/minute`)

## Port Mapping

The following ports are exposed:

- `80`: Main web interface (HTTP)
- `443`: HTTPS (only when `SITE_ADDRESS` is set to a domain)

## Volume Mounts

### Recommended Persistent Volumes

```bash
-v /path/to/logs:/app/logs
```

The image also declares `/app/data` as a volume, but no service writes to it today. Store `SECRET_KEY` and `LIVE_SERVER_SECRET_KEY` outside the container, and pass the same values every time you recreate it.

## Building the Image

To build the AIO image yourself:

```bash
cd deployments/aio/community
IMAGE_NAME=myplane-aio ./build.sh --release=v1.5.0
```

`build.sh` does not build the image itself. It prepares `dist/plane.env` and `dist/Caddyfile`, then prints the `docker build ... --build-arg PLANE_VERSION=<release>` command to run next.

Available build options:

- `--release`: Plane version to build (required)
- `--image-name`: Custom image name (default: `makeplane/plane-aio-community`, or the `IMAGE_NAME` env var)

## Troubleshooting

### Logs

All service logs are available in `/app/logs/`:

- Access logs: `/app/logs/access/`
- Error logs: `/app/logs/error/`

### Health Checks

The container runs multiple services managed by Supervisor. Check service status:

```bash
docker exec -it <container-name> supervisorctl status
```

### Common Issues

1. **Database Connection Failed**: Ensure PostgreSQL is accessible and credentials are correct
2. **Redis Connection Failed**: Verify Redis server is running and URL is correct
3. **File Upload Issues**: Check S3 credentials and bucket permissions

### Environment Validation

The container will validate required environment variables on startup and display helpful error messages if any are missing.

### Environment variable precedence

At startup the container writes the variables above into `/app/plane.env` and then exports every line of that file. Variables that the start script does not manage (`CERT_EMAIL`, `CERT_ACME_CA`, `CERT_ACME_DNS`, `DEBUG`, `GUNICORN_WORKERS`, `AUTHENTICATION_RATE_LIMIT`, `MINIO_ENDPOINT_SSL`, `WEBHOOK_ALLOWED_IPS`, `WEBHOOK_ALLOWED_HOSTS`, `API_BASE_URL`) keep the value from `/app/plane.env`, even if you pass them with `-e`. To change them, mount your own copy of the file: `-v /path/to/plane.env:/app/plane.env`.

## Production Considerations

- Use proper SSL certificates for HTTPS
- Configure proper backup strategies for data
- Monitor resource usage and scale accordingly
- Use external load balancer for high availability
- Regularly update to latest versions
- Secure your environment variables and secrets

## Support

For issues and support, see the [AIO self-hosting docs](https://developers.plane.so/self-hosting/methods/docker-aio), ask on the [Forum](https://forum.plane.so), or open a [GitHub issue](https://github.com/makeplane/plane/issues).
