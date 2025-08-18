# Plane Commercial All-In-One (AIO) Docker Image

The Plane Commercial All-In-One Docker image packages all Plane services into a single container for easy deployment and testing. This image includes web interface, API server, background workers, live server, email server, and more.

## What's Included

The AIO image contains the following services:
- **Web App** (Port 3001): Main Plane web interface
- **Space** (Port 3002): Public project spaces
- **Admin** (Port 3003): Administrative interface  
- **API Server** (Port 3004): Backend API
- **Live Server** (Port 3005): Real-time collaboration
- **Silo** (Port 3006): Integration services
- **Monitor** (Port 3007): Feature flags and payments
- **Email Server** (Ports 10025, 10465, 10587): SMTP server for notifications
- **Proxy** (Port 80, 20025, 20465, 20587): Caddy reverse proxy
- **Worker & Beat**: Background task processing

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

#### Storage Configuration
- `AWS_REGION`: AWS region (e.g., us-east-1)
- `AWS_ACCESS_KEY_ID`: S3 access key
- `AWS_SECRET_ACCESS_KEY`: S3 secret key
- `AWS_S3_BUCKET_NAME`: S3 bucket name
- `AWS_S3_ENDPOINT_URL`: S3 endpoint (optional, defaults to AWS)

## Quick Start

### Basic Usage
```bash
docker run --name plane-aio --rm -it \
    -p 80:80 \
    -p 20025:20025 \
    -p 20465:20465 \
    -p 20587:20587 \
    -e DOMAIN_NAME=your-domain.com \
    -e DATABASE_URL=postgresql://user:pass@host:port/database \
    -e REDIS_URL=redis://host:port \
    -e AMQP_URL=amqp://user:pass@host:port/vhost \
    -e AWS_REGION=us-east-1 \
    -e AWS_ACCESS_KEY_ID=your-access-key \
    -e AWS_SECRET_ACCESS_KEY=your-secret-key \
    -e AWS_S3_BUCKET_NAME=your-bucket \
    plane-aio-commercial:latest
```

### Example with IP Address
```bash
MYIP=192.168.68.169
docker run --name myaio --rm -it \
    -p 80:80 \
    -p 20025:20025 \
    -p 20465:20465 \
    -p 20587:20587 \
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
    plane-aio-commercial:latest
```

## Configuration Options

### Optional Environment Variables

#### Network & Protocol
- `SITE_ADDRESS`: Server bind address (default: `:80`)
- `APP_PROTOCOL`: Protocol to use (`http` or `https`, default: `http`)

#### Email Configuration  
- `INTAKE_EMAIL_DOMAIN`: Domain for intake emails (default: `intake.<DOMAIN_NAME>`)
- `LISTEN_SMTP_PORT_25`: SMTP port 25 mapping (default: `20025`)
- `LISTEN_SMTP_PORT_465`: SMTP port 465 mapping (default: `20465`) 
- `LISTEN_SMTP_PORT_587`: SMTP port 587 mapping (default: `20587`)
- `SMTP_DOMAIN`: SMTP server domain (default: `0.0.0.0`)
- `TLS_CERT_PATH`: Path to TLS certificate file (optional)
- `TLS_PRIV_KEY_PATH`: Path to TLS private key file (optional)

#### Security & Secrets
- `MACHINE_SIGNATURE`: Unique machine identifier (auto-generated if not provided)
- `SECRET_KEY`: Django secret key (default provided)
- `SILO_HMAC_SECRET_KEY`: Silo HMAC secret (default provided)
- `AES_SECRET_KEY`: AES encryption key (default provided)
- `LIVE_SERVER_SECRET_KEY`: Live server secret (default provided)

#### File Handling
- `FILE_SIZE_LIMIT`: Maximum file upload size in bytes (default: `5242880` = 5MB)

#### Integration Callbacks
- `INTEGRATION_CALLBACK_BASE_URL`: Base URL for OAuth callbacks

#### API Configuration
- `API_KEY_RATE_LIMIT`: API key rate limit (default: `60/minute`)

#### Third-party Integrations
- `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`: GitHub integration
- `GITHUB_APP_NAME`, `GITHUB_APP_ID`, `GITHUB_PRIVATE_KEY`: GitHub App integration
- `SLACK_CLIENT_ID`, `SLACK_CLIENT_SECRET`: Slack integration  
- `GITLAB_CLIENT_ID`, `GITLAB_CLIENT_SECRET`: GitLab integration

## Port Mapping

The following ports are exposed:
- `80`: Main web interface (HTTP)
- `443`: HTTPS (if SSL configured)
- `20025`: SMTP port 25
- `20465`: SMTP port 465 (SSL/TLS)
- `20587`: SMTP port 587 (STARTTLS)

## Volume Mounts

### Recommended Persistent Volumes
```bash
-v /path/to/logs:/app/logs \
-v /path/to/data:/app/data 
```

### Workspace License DB
```bash
-v /path/to/monitordb:/app/monitor
```

### SSL Certificate Support
For HTTPS support, mount certificates:
```bash
-v /path/to/certs:/app/email/tls
```

## Building the Image

To build the AIO image yourself:

```bash
cd deploy/aio/commercial
./build.sh --release=v1.11.1 
```

Available build options:
- `--release`: Plane version to build (required)
- `--image-name`: Custom image name (default: `plane-aio-commercial`)

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
4. **Email Not Working**: Verify SMTP port mappings and domain configuration

### Environment Validation
The container will validate required environment variables on startup and display helpful error messages if any are missing.

## Production Considerations

- Use proper SSL certificates for HTTPS
- Configure proper backup strategies for data
- Monitor resource usage and scale accordingly
- Use external load balancer for high availability
- Regularly update to latest versions
- Secure your environment variables and secrets

## Support

For issues and support, please refer to the official Plane documentation or contact support through your commercial license.
