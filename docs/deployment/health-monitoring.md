# Health Checks & Monitoring

## Health Endpoint (Backend)

The backend API provides a health check endpoint:

```bash
# Check service health
curl http://localhost:8000/health

# Response (200 OK)
{
  "database": "ok",
  "redis": "ok",
  "rabbitmq": "ok",
  "s3": "ok"
}
```

All dependencies must return `"ok"` for the service to be considered healthy.

### Individual Service Checks

**Database:**

```bash
curl http://localhost:8000/health/db
# Returns: {"status": "connected", "latency_ms": 5}
```

**Redis:**

```bash
curl http://localhost:8000/health/cache
# Returns: {"status": "connected", "latency_ms": 2}
```

**RabbitMQ (Celery):**

```bash
curl http://localhost:8000/health/celery
# Returns: {"status": "connected", "queue_depth": 0}
```

**S3:**

```bash
curl http://localhost:8000/health/storage
# Returns: {"status": "connected", "bucket": "plane-uploads"}
```

## Container Health Checks

All Docker containers define HEALTHCHECK directives:

```bash
# Check container health status
docker inspect plane-api | jq '.[0].State.Health'

# Output
{
  "Status": "healthy",
  "FailingStreak": 0,
  "Log": [
    {
      "Start": "2026-05-04T14:22:15.123456Z",
      "End": "2026-05-04T14:22:20.654321Z",
      "ExitCode": 0,
      "Output": ""
    }
  ]
}
```

### Health Status Values

| Status      | Meaning                        | Action                             |
| ----------- | ------------------------------ | ---------------------------------- |
| `healthy`   | Service responding normally    | No action needed                   |
| `unhealthy` | Service failing health checks  | Investigate logs; may need restart |
| `starting`  | First health check in progress | Wait 1-2 minutes                   |
| `none`      | No HEALTHCHECK defined         | Service assumes working            |

### Check All Services

```bash
# Quick status of all services
docker-compose ps

# Detailed health for each
for container in $(docker ps -q); do
  NAME=$(docker inspect --format '{{.Name}}' "$container" | sed 's|/||')
  HEALTH=$(docker inspect --format '{{json .State.Health.Status}}' "$container" 2>/dev/null || echo '"none"')
  echo "$NAME: $HEALTH"
done
```

## Container Logs

### View Logs

**All services:**

```bash
docker-compose logs -f
# Follow all logs in real-time
```

**Specific service:**

```bash
docker-compose logs -f api      # Django backend
docker-compose logs -f web      # React frontend
docker-compose logs -f worker   # Celery worker
docker-compose logs -f postgres # Database
```

**Limited tail:**

```bash
docker-compose logs --tail=50 api
# Last 50 lines
```

**Time range:**

```bash
docker-compose logs --since 10m api
# Logs from last 10 minutes
```

### Log Format

Structured logs are JSON-formatted for parsing:

```bash
# Pretty-print logs
docker-compose logs api | jq .

# Extract specific fields
docker-compose logs api | jq '.log' -r

# Filter by log level
docker-compose logs api | jq 'select(.level=="ERROR")'

# Count errors in last hour
docker-compose logs --since 60m api | jq 'select(.level=="ERROR")' | wc -l
```

### Common Log Patterns

**Database Connection Error:**

```
ERROR: could not connect to server: Connection refused
  Is the server running on host "postgres" (172.18.0.2) and accepting TCP connections on port 5432?
```

**Fix:** Check `DATABASE_URL` in `plane.env`, verify PostgreSQL is running.

**Redis Connection Error:**

```
ERROR: ConnectionError: Error 111 connecting to redis:6379. Connection refused.
```

**Fix:** Check `REDIS_URL`, ensure Redis container is running.

**Migration Error:**

```
ERROR: django.db.utils.OperationalError: relation "xyz" does not exist
```

**Fix:** Re-run migrations: `docker-compose run --rm api python manage.py migrate`

**Memory Warning:**

```
WARNING: Celery worker memory usage 78% — consider increasing container memory limit
```

**Fix:** Update docker-compose memory reservation.

## Deployment Audit Log

Track all deployments (automatic and manual):

```bash
# View deployment history
cat /opt/shb-deploy/plane-app/deploy-audit.log

# Format: timestamp | release_tag | uid:username | sha256 | exit_code
2026-05-04T14:22:15Z | prod/shb_v1.2.0 | 0:gitlab-runner | 5f9c4ab08... | 0
2026-05-03T10:15:30Z | prod/shb_v1.1.9 | 0:gitlab-runner | 3e8f2c1d9... | 0
```

**Interpret:**

- **exit_code 0** = successful deployment
- **uid:username** = who triggered deployment
- **sha256** = exact package deployed (for audit)

## Performance Monitoring

### CPU & Memory Usage

```bash
# Real-time stats
docker stats

# For specific containers
docker stats plane-api plane-web --no-stream
```

**Example output:**

```
CONTAINER ID        NAME                CPU %               MEM USAGE / LIMIT
abc123def456        plane-api           2.5%                384MiB / 2GiB
def456ghi789        plane-web           0.8%                127MiB / 1GiB
```

**Healthy ranges:**

- **API:** CPU 1-5%, Memory 300-500 MiB (baseline)
- **Web:** CPU 0-1%, Memory 100-200 MiB (minimal)
- **Worker:** CPU 5-15%, Memory 250-400 MiB (task-dependent)

### Database Query Performance

```bash
# SSH to postgres container
docker-compose exec postgres psql -U plane -d plane

# Inside psql prompt, enable query timing
\timing

# View slow queries (slow_query_log if enabled)
SELECT query, calls, mean_exec_time, total_exec_time
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;
```

### API Response Times

```bash
# Check response time to health endpoint
time curl http://localhost:8000/health

# Check response time to public endpoints
ab -n 100 -c 10 http://localhost/

# Use curl verbose to see timing breakdown
curl -w "
  Total time: %{time_total}
  Connect: %{time_connect}
  DNS: %{time_namelookup}
  Redirect: %{time_redirect}
\n" -o /dev/null -s http://localhost:8000/health
```

## Celery Background Jobs

### Check Celery Status

```bash
# Inspect worker status
docker-compose exec worker celery -A plane inspect active

# Output shows currently executing tasks
{
  "celery@worker-1": {
    "active": [
      {
        "name": "plane.tasks.send_email_notification",
        "id": "abc-123-def-456",
        "args": "[user_id=42]",
        "kwargs": "{}",
        "type": "task",
        "hostname": "celery@worker-1",
        "time_start": 1234567890.1,
        "acknowledged": true,
        "exchange": "celery",
        "delivery_info": {...}
      }
    ]
  }
}
```

### Monitor Queue Depth

```bash
# Check pending tasks in RabbitMQ queue
docker-compose exec rabbitmq rabbitmqctl list_queues

# Output
Listing queues ...
celery          0
celery.pidbox   0
```

If queue depth grows unbounded:

- Celery worker may have crashed → restart: `docker-compose restart worker`
- Too many tasks → scale workers: add more replicas in docker-compose
- Task deadlock → check logs: `docker-compose logs -f worker`

### Restart Celery if Stuck

```bash
# Kill existing worker
docker-compose down

# Rebuild and restart
docker-compose up -d

# Verify new worker is processing
docker-compose logs -f worker
```

## PostgreSQL Monitoring

### Connection Count

```bash
# Check open connections
docker-compose exec postgres psql -U plane -d plane -c \
  "SELECT count(*) as open_connections FROM pg_stat_activity;"

# Healthy range: 5-20 (depending on app intensity)
# Warning: >50 → may have connection leak
```

### Database Size

```bash
docker-compose exec postgres psql -U plane -d plane -c \
  "SELECT pg_size_pretty(pg_database_size('plane'));"

# Expected: 1-5 GB depending on data age
```

### Backup Status

```bash
# If automated backups are configured
ls -lh /opt/backups/plane-*.sql.gz | tail -5

# Should have recent backup (last 24 hours)
```

## Redis Monitoring

### Memory Usage

```bash
# Check Redis memory
docker-compose exec redis redis-cli info memory

# Key output
used_memory_human:42M           # Total memory
used_memory_peak_human:45M      # Peak usage
maxmemory:500M                  # Limit (if set)
```

**Fix if approaching limit:**

```bash
# Increase memory reservation in docker-compose
redis:
  deploy:
    resources:
      limits:
        memory: 1G  # Increase from 500M
```

### Eviction Policy

```bash
# If maxmemory-policy is set to eviction, keys may be deleted!
docker-compose exec redis redis-cli config get maxmemory-policy

# Better policy: "noeviction" (error on full) or "allkeys-lru" (delete least-used)
```

## Alerting Strategy

Set up monitoring to alert on:

| Metric                        | Threshold              | Action                                 |
| ----------------------------- | ---------------------- | -------------------------------------- |
| Health endpoint returns error | Any                    | Page on-call                           |
| Container unhealthy           | 2 consecutive failures | Restart container                      |
| CPU usage                     | >80% sustained         | Investigate process; scale if needed   |
| Memory usage                  | >85% of limit          | OOM imminent; increase limit           |
| Database size                 | >80% disk              | Archive old data; add storage          |
| API response time             | >5s p95                | Check database locks; optimize queries |
| Celery queue depth            | >1000 tasks            | Increase worker count                  |

## Quick Health Check Script

Save as `health-check.sh` on each server:

```bash
#!/bin/bash
set -euo pipefail

echo "=== Plane SHB Health Check ==="
echo

# 1. API endpoint
echo -n "API health: "
curl -sf http://localhost:8000/health > /dev/null && echo "✓ OK" || echo "✗ FAILED"

# 2. Frontend
echo -n "Frontend: "
curl -sf http://localhost/ > /dev/null && echo "✓ OK" || echo "✗ FAILED"

# 3. Container status
echo "Container status:"
docker-compose ps | grep -E "(Up|Exited)" | awk '{print "  " $1 ": " $6}'

# 4. Deployment audit
echo "Last deployment:"
tail -1 /opt/shb-deploy/plane-app/deploy-audit.log

# 5. Disk space
echo "Disk space:"
df -h /opt/shb-deploy/plane-app | awk 'NR>1 {printf "  %s used, %s available\n", $3, $4}'

echo
echo "=== End Health Check ==="
```

Usage:

```bash
chmod +x health-check.sh
./health-check.sh

# Output
=== Plane SHB Health Check ===

API health: ✓ OK
Frontend: ✓ OK
Container status:
  plane-api: Up
  plane-web: Up
  plane-worker: Up
  postgres: Up

Last deployment:
2026-05-04T14:22:15Z | prod/shb_v1.2.0 | 0:gitlab-runner | 5f9c4ab08... | 0

Disk space:
  23G used, 127G available

=== End Health Check ===
```

**Last Updated:** 2026-05-04
