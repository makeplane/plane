# Research & Discovery: FamilyFlow Un-Dockerization

**Feature**: Un-Dockerize FamilyFlow for Single-Command Deployment  
**Date**: 2025-01-27  
**Phase**: 0 - Research & Discovery  
**Goal**: Enable running entire application stack with a single command on a Digital Ocean droplet

## 1. Single-Command Process Management

### Decision: Use PM2 for process orchestration

**Rationale**: PM2 (Process Manager 2) is a production-grade process manager for Node.js applications that can manage multiple processes (Django, Celery workers, Node.js services) from a single command. It provides process monitoring, auto-restart, log management, and clustering. PM2 can start all application services (API, workers, frontend) with a single `pm2 start ecosystem.config.js` command.

**Implementation Approach**:
- Create `ecosystem.config.js` file in repository root
- Configure PM2 to manage:
  - Django API server (via Gunicorn)
  - Celery worker
  - Celery beat scheduler
  - Frontend build server (or serve static files via Nginx)
- PM2 handles process dependencies, restart logic, and logging
- Single command: `pm2 start ecosystem.config.js`

**PM2 Benefits**:
- Process monitoring and auto-restart on crashes
- Log aggregation and rotation
- Cluster mode support for scaling
- Zero-downtime reloads
- Systemd integration for server startup
- Memory and CPU monitoring

**Alternatives Considered**:
- Supervisor: Python-based, works but less modern, more configuration required
- systemd: Native Linux, but requires separate service files per process, more complex
- Docker Compose: What we're removing - too heavy, network issues
- Custom shell scripts: No process monitoring, harder to maintain

## 2. Infrastructure Services Configuration

### Decision: Use system packages + cloud services where possible

**Rationale**: For a single-server deployment, we want to minimize external dependencies while maintaining production reliability. Some services (Redis, RabbitMQ) can run as system services, while others can use managed cloud alternatives.

**Redis**:
- **Option A (Recommended for single server)**: Install Redis via system package manager (`apt install redis-server` on Ubuntu/Debian)
  - Simple, reliable, no external dependency
  - Auto-starts with system via systemd
  - Local, low latency
- **Option B (For multi-server)**: Use managed Redis (Upstash, Railway Redis)
  - Better for scaling, but adds external dependency and network latency
  - For single droplet, Option A is preferred

**RabbitMQ**:
- **Option A (Recommended)**: Install RabbitMQ via system package (`apt install rabbitmq-server`)
  - Message broker for Celery task queue
  - Auto-starts with system
  - Local, reliable
- **Option B**: Use CloudAMQP or other managed service
  - Adds external dependency, not necessary for single server

**PostgreSQL**:
- **Decision**: Use Supabase (already configured) - no local PostgreSQL needed
- Supabase provides managed PostgreSQL with Row Level Security, backups, scaling
- Connection via `SUPABASE_DB_URL` environment variable

**Object Storage (MinIO replacement)**:
- **Option A**: Use Supabase Storage (recommended - already integrated)
  - Family avatars, file uploads
  - No additional service needed
- **Option B**: Use S3-compatible service (Digital Ocean Spaces, AWS S3)
  - Alternative if Supabase Storage doesn't meet needs

**Nginx (Optional)**:
- Serve frontend static files
- Reverse proxy for API
- SSL termination (with Let's Encrypt)
- Not strictly required if using PM2 to serve everything, but recommended for production

## 3. Digital Ocean Droplet Deployment

### Decision: Single Ubuntu 22.04 LTS droplet with systemd services

**Rationale**: Digital Ocean provides reliable, affordable VPS hosting. Ubuntu 22.04 LTS is stable, well-supported, and has good package availability. Single droplet keeps costs low while maintaining simplicity.

**Server Requirements**:
- **Minimum**: 2 CPU, 4GB RAM, 50GB SSD (for dev/small families)
- **Recommended**: 4 CPU, 8GB RAM, 100GB SSD (for production/multiple families)
- **OS**: Ubuntu 22.04 LTS (or Debian 12)

**Deployment Steps**:
1. Provision Digital Ocean droplet
2. Install system dependencies (Node.js 22+, Python 3.12, Redis, RabbitMQ, Nginx)
3. Clone repository
4. Configure environment variables (`.env` file)
5. Install application dependencies (`pnpm install`, `pip install -r requirements.txt`)
6. Run database migrations
7. Build frontend (`pnpm build`)
8. Start services with PM2
9. Configure systemd to auto-start PM2 on boot
10. Configure Nginx (optional) for reverse proxy and SSL

**Process Management Flow**:
```
System Boot
  → systemd starts PM2 daemon
  → PM2 starts all application processes (API, workers, frontend)
  → Services connect to Supabase, Redis, RabbitMQ
  → Application ready
```

**Single Command Execution**:
- Development: `pm2 start ecosystem.config.js`
- Production: PM2 automatically starts on server boot via systemd
- Manual restart: `pm2 restart all` or `pm2 restart ecosystem.config.js`

## 4. Environment Configuration

### Decision: Single `.env` file per environment (local vs production)

**Rationale**: Keep environment variables in `.env` file (never committed). Digital Ocean droplet will have its own `.env` file with production values. Local development uses different `.env` file.

**Environment Variables Required**:
- **Supabase**: `SUPABASE_DB_URL`, `SUPABASE_URL`, `SUPABASE_PROJECT_REF`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- **Redis**: `REDIS_URL=redis://localhost:6379/0` (local) or cloud Redis URL
- **RabbitMQ**: Connection string or use default local installation
- **Django**: `SECRET_KEY`, `DEBUG=False` (production), `ALLOWED_HOSTS`
- **Storage**: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` (for Supabase Storage or S3)
- **Frontend**: `VITE_API_BASE_URL` (API endpoint URL)

**Configuration Management**:
- `.env.example` template in repository (documented, never committed)
- Actual `.env` file created on server during deployment
- Use Digital Ocean App Platform secrets or manual file creation

## 5. Build and Deployment Automation

### Decision: Create deployment script for Digital Ocean droplet

**Rationale**: Manual deployment is error-prone. A single deployment script ensures consistent setup across environments and simplifies updates.

**Deployment Script (`deploy.sh`)**:
```bash
#!/bin/bash
# 1. Pull latest code
# 2. Install/update dependencies
# 3. Run database migrations
# 4. Build frontend
# 5. Collect static files (Django)
# 6. Restart PM2 processes
```

**Update Workflow**:
1. Push code to Git repository
2. SSH into Digital Ocean droplet
3. Run `./deploy.sh` (or configure CI/CD to do this automatically)
4. Script handles all update steps
5. PM2 gracefully reloads processes

**CI/CD Integration (Optional)**:
- GitHub Actions can SSH into droplet and run deployment script
- Or use Digital Ocean App Platform for automated deployments (but that adds complexity)
- For MVP, manual deployment via script is acceptable

## 6. Service Startup Dependencies

### Decision: PM2 handles dependency ordering via `wait_ready` and startup delays

**Rationale**: Services have dependencies (API needs database, workers need Redis/RabbitMQ). PM2 can wait for services to be ready before starting dependent processes.

**Startup Order**:
1. Redis (system service, always running)
2. RabbitMQ (system service, always running)
3. Django migrations (one-time on deploy)
4. API server (waits for DB connection)
5. Celery worker (waits for Redis/RabbitMQ)
6. Celery beat (waits for Redis/RabbitMQ)
7. Frontend server (or static files via Nginx)

**PM2 Configuration**:
- Use `wait_ready: true` for API server
- Use `listen_timeout: 10000` for startup delays
- Use `autorestart: true` for all processes
- Use `max_restarts: 10` for crash protection

## 7. Logging and Monitoring

### Decision: PM2 handles logging, optional external monitoring

**Rationale**: PM2 provides built-in log management. For production, can add external monitoring later.

**PM2 Logging**:
- All process logs go to `~/.pm2/logs/`
- Log rotation handled by PM2
- View logs: `pm2 logs`
- Monitor: `pm2 monit`

**Optional Monitoring**:
- Sentry (already in codebase) for error tracking
- PM2 Plus (optional paid service) for advanced monitoring
- Custom health check endpoint for uptime monitoring

## 8. Security Considerations

### Decision: Follow standard server security practices

**Rationale**: Non-Dockerized deployment requires standard Linux server security.

**Security Measures**:
- Firewall (UFW) configured to allow only necessary ports (80, 443, 22)
- SSH key authentication only (disable password auth)
- Keep system packages updated
- Use Nginx reverse proxy with SSL (Let's Encrypt)
- Run services as non-root user
- Environment variables secured (file permissions 600)
- Regular security updates

**Database Security**:
- Supabase handles database security (SSL required, RLS policies)
- Use strong `SECRET_KEY` in Django
- Set `DEBUG=False` in production
- Configure `ALLOWED_HOSTS` correctly

## Summary

**Single Command**: `pm2 start ecosystem.config.js` (or `pm2 start ecosystem.config.js --env production`)

**Infrastructure**:
- Redis: Local system service (`redis-server`)
- RabbitMQ: Local system service (`rabbitmq-server`)
- PostgreSQL: Supabase (cloud, already configured)
- Storage: Supabase Storage (cloud, already configured)

**Process Management**: PM2 orchestrates all application processes

**Deployment**: Digital Ocean droplet with Ubuntu 22.04 LTS, automated via deployment script

**Benefits**:
- No Docker overhead or network issues
- Simple single-command startup
- Production-ready process management
- Easy to debug and monitor
- Lower resource usage than Docker
