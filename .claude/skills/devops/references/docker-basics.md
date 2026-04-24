# Docker Basics

Core concepts and workflows for Docker containerization.

## Core Concepts

**Containers:** Lightweight, isolated processes bundling apps with dependencies. Ephemeral by default.

**Images:** Read-only blueprints for containers. Layered filesystem for reusability.

**Volumes:** Persistent storage surviving container deletion.

**Networks:** Enable container communication.

## Dockerfile Best Practices

### Essential Instructions
```dockerfile
FROM node:20-alpine              # Base image (use specific versions)
WORKDIR /app                     # Working directory
COPY package*.json ./            # Copy dependency files first
RUN npm install --production     # Execute build commands
COPY . .                         # Copy application code
ENV NODE_ENV=production          # Environment variables
EXPOSE 3000                      # Document exposed ports
USER node                        # Run as non-root (security)
CMD ["node", "server.js"]        # Default command
```

### Multi-Stage Builds (Production)
```dockerfile
# Stage 1: Build
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Production
FROM node:20-alpine AS production
WORKDIR /app
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
USER node
EXPOSE 3000
CMD ["node", "dist/server.js"]
```

Benefits: Smaller images, improved security, no build tools in production.

### .dockerignore
```
node_modules
.git
.env
*.log
.DS_Store
README.md
docker-compose.yml
dist
coverage
```

## Building Images

```bash
# Build with tag
docker build -t myapp:1.0 .

# Build targeting specific stage
docker build -t myapp:dev --target build .

# Build for multiple platforms
docker buildx build --platform linux/amd64,linux/arm64 -t myapp:1.0 .

# View layers
docker image history myapp:1.0
```

## Running Containers

```bash
# Basic run
docker run myapp:1.0

# Background (detached)
docker run -d --name myapp myapp:1.0

# Port mapping (host:container)
docker run -p 8080:3000 myapp:1.0

# Environment variables
docker run -e NODE_ENV=production myapp:1.0

# Volume mount (named volume)
docker run -v mydata:/app/data myapp:1.0

# Bind mount (development)
docker run -v $(pwd)/src:/app/src myapp:1.0

# Resource limits
docker run --memory 512m --cpus 0.5 myapp:1.0

# Interactive terminal
docker run -it myapp:1.0 /bin/sh
```

## Container Management

```bash
# List containers
docker ps
docker ps -a

# Logs
docker logs myapp
docker logs -f myapp          # Follow
docker logs --tail 100 myapp  # Last 100 lines

# Execute command
docker exec myapp ls /app
docker exec -it myapp /bin/sh  # Interactive shell

# Stop/start
docker stop myapp
docker start myapp

# Remove
docker rm myapp
docker rm -f myapp  # Force remove running

# Inspect
docker inspect myapp

# Monitor resources
docker stats myapp

# Copy files
docker cp myapp:/app/logs ./logs
```

## Volume Management

```bash
# Create volume
docker volume create mydata

# List volumes
docker volume ls

# Remove volume
docker volume rm mydata

# Remove unused volumes
docker volume prune
```

## Network Management

```bash
# Create network
docker network create my-network

# List networks
docker network ls

# Connect container
docker network connect my-network myapp

# Disconnect
docker network disconnect my-network myapp
```

## Language-Specific Dockerfiles

### Node.js
```dockerfile
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
USER node
CMD ["node", "dist/server.js"]
```

### Python
```dockerfile
FROM python:3.11-slim AS build
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

FROM python:3.11-slim
WORKDIR /app
COPY --from=build /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY . .
RUN adduser --disabled-password appuser
USER appuser
CMD ["python", "app.py"]
```

### Go
```dockerfile
FROM golang:1.21-alpine AS build
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 go build -o main .

FROM scratch
COPY --from=build /app/main /main
CMD ["/main"]
```

## Security Hardening

```dockerfile
# Use specific versions
FROM node:20.11.0-alpine3.19

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Set ownership
COPY --chown=nodejs:nodejs . .

# Switch to non-root
USER nodejs
```

## Troubleshooting

### Container exits immediately
```bash
docker logs myapp
docker run -it myapp /bin/sh
docker run -it --entrypoint /bin/sh myapp
```

### Cannot connect
```bash
docker ps
docker port myapp
docker network inspect bridge
docker inspect myapp | grep IPAddress
```

### Out of disk space
```bash
docker system df
docker system prune -a
docker volume prune
```

### Build cache issues
```bash
docker build --no-cache -t myapp .
docker builder prune
```

## Best Practices

- Use specific image versions, not `latest`
- Run as non-root user
- Multi-stage builds to minimize size
- Implement health checks
- Set resource limits
- Keep images under 500MB
- Scan for vulnerabilities: `docker scout cves myapp:1.0`

## Quick Reference

| Task | Command |
|------|---------|
| Build | `docker build -t myapp:1.0 .` |
| Run | `docker run -d -p 8080:3000 myapp:1.0` |
| Logs | `docker logs -f myapp` |
| Shell | `docker exec -it myapp /bin/sh` |
| Stop | `docker stop myapp` |
| Remove | `docker rm myapp` |
| Clean | `docker system prune -a` |

## Resources

- Docs: https://docs.docker.com
- Best Practices: https://docs.docker.com/develop/dev-best-practices/
- Dockerfile Reference: https://docs.docker.com/engine/reference/builder/
