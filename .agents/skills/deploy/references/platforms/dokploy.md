# Dokploy (Self-Hosted)

## Setup
```bash
# Install on VPS
curl -sSL https://dokploy.com/install.sh | sh
```

## Deploy
```bash
# Via CLI
dokploy app deploy <app-id>

# Or via webhook trigger / dashboard
```

## Detection
- `dokploy.yml`, Dockerfile, `docker-compose.yml`

## Free Tier
- Free (self-hosted, open-source)
- VPS cost only

## Rollback
Via dashboard: select previous deployment

## Best For
Alternative to Coolify. Docker Compose native support, multi-server Docker Swarm.
Traefik for reverse proxy/SSL. Supports MySQL, PostgreSQL, MongoDB, Redis, MariaDB.
