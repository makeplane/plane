# Rollback & Recovery

## Automatic Archive System

Every deployment automatically archives the previous release package for instant rollback.

```
Deploy prod/shb_v1.2.0
  ↓
Script extracts and loads images
  ↓
Scripts runs migrations + docker-compose up
  ↓
If successful: archive prod/shb_v1.2.0-plane-shb-release.zip
  ↓
Keep last ARCHIVE_KEEP releases (default: 3)
  ↓
Older archives automatically deleted
```

### Archive Location

```bash
# View all archived releases
ls -lh /opt/shb-deploy/plane-app/archive/

# Example output
-rw-r--r-- 1 gitlab-runner gitlab-runner  700M May 3 14:22 prod-shb_v1.1.9-plane-shb-release.zip
-rw-r--r-- 1 gitlab-runner gitlab-runner  705M Apr 29 10:15 prod-shb_v1.1.8-plane-shb-release.zip
-rw-r--r-- 1 gitlab-runner gitlab-runner  702M Apr 25 08:44 prod-shb_v1.1.7-plane-shb-release.zip
```

### Archive Retention Policy

Configured in `/etc/plane-release-deploy.env`:

```env
# Number of archived releases to keep (default: 3)
ARCHIVE_KEEP=3
```

Adjust for longer retention:

```bash
# Increase retention to 5
sudo nano /etc/plane-release-deploy.env
# Change: ARCHIVE_KEEP=5
sudo chown gitlab-runner:gitlab-runner /etc/plane-release-deploy.env
sudo chmod 0400 /etc/plane-release-deploy.env
```

## Rollback Procedure

### Quick Rollback (Immediate)

When you need to revert to a previous release immediately:

```bash
# SSH to target server (dev or prod)
ssh prod-server

# List available archived releases
ls -lh /opt/shb-deploy/plane-app/archive/

# Extract the desired archive to a temp location
# Example: rolling back from v1.2.0 to v1.1.9
ARCHIVE_FILE="/opt/shb-deploy/plane-app/archive/prod-shb_v1.1.9-plane-shb-release.zip"
ROLLBACK_DIR="/tmp/rollback-v1.1.9"

unzip -q "${ARCHIVE_FILE}" -d "${ROLLBACK_DIR}"

# Run the deploy script from the archived release
bash "${ROLLBACK_DIR}/release-stage-*/scripts/deploy-shb.sh" \
  "${ROLLBACK_DIR}/release-stage-*/dist" \
  "/opt/shb-deploy/plane-app/plane.env" \
  "/opt/shb-deploy/plane-app/docker-compose.yaml"

# Verify rollback succeeded
docker-compose -f /opt/shb-deploy/plane-app/docker-compose.yaml ps
curl https://app.example.com/health
```

### Step-by-Step Rollback

If you need to roll back with verification at each step:

**Step 1: Stop Current Services**

```bash
docker-compose -f /opt/shb-deploy/plane-app/docker-compose.yaml down

# Verify all containers stopped
docker-compose -f /opt/shb-deploy/plane-app/docker-compose.yaml ps
```

**Step 2: Prepare Archived Release**

```bash
# Find the target release
ls -lh /opt/shb-deploy/plane-app/archive/ | grep "shb_v1.1.9"

# Extract to temp directory
ARCHIVE="/opt/shb-deploy/plane-app/archive/prod-shb_v1.1.9-plane-shb-release.zip"
unzip -q "${ARCHIVE}" -d /tmp/rollback-v1.1.9

# Verify extraction
ls -la /tmp/rollback-v1.1.9/
# Should show: release-stage-shb_v1.1.9/
```

**Step 3: Load Docker Images**

```bash
# Change to extracted directory
cd /tmp/rollback-v1.1.9/release-stage-shb_v1.1.9

# Load images one by one with verification
for TAR in dist/*.tar.gz; do
  echo "Loading $(basename $TAR)..."
  docker load < "${TAR}"
  echo "  ✓ Loaded"
done

# Verify all images present
docker image ls | grep makeplane
```

**Step 4: Run Database Migrations (Backward-Compatible)**

```bash
# Get the compose file path
COMPOSE_FILE="/opt/shb-deploy/plane-app/docker-compose.yaml"

# Set environment (read from plane.env)
set -a
source /opt/shb-deploy/plane-app/plane.env
set +a

# Run migrations (these should be safe to run multiple times)
docker-compose -f "${COMPOSE_FILE}" run --rm api python manage.py migrate
```

**Step 5: Start Services**

```bash
docker-compose -f /opt/shb-deploy/plane-app/docker-compose.yaml up -d

# Wait for services to be healthy
sleep 30

# Check status
docker-compose -f /opt/shb-deploy/plane-app/docker-compose.yaml ps
```

**Step 6: Verify Rollback**

```bash
# Health check
curl https://app.example.com/health

# Check logs for errors
docker-compose -f /opt/shb-deploy/plane-app/docker-compose.yaml logs --tail=50

# Quick functionality test
curl -s https://app.example.com/auth/sign-in | grep -q "login" && echo "✓ Frontend loads"
curl -s https://app.example.com/api/v1/workspaces -H "Authorization: Bearer $TOKEN" | jq .
```

**Step 7: Clean Up Temp Files**

```bash
rm -rf /tmp/rollback-v1.1.9
```

## Rollback via GitLab CI (Alternative)

If you prefer to trigger rollback through CI/CD UI instead of SSH:

1. Go to GitLab UI: CI/CD → Pipelines
2. Find the pipeline of the **previous good release**
3. Scroll to `deploy:prod:release` job
4. Click "▶ Play" to re-trigger

This downloads the exact same archive and re-runs the full deployment flow.

## Emergency Procedures

### When Archive is Missing or Corrupt

If the desired archive is unavailable or damaged:

**Option 1: Rebuild from Git**

```bash
# Create a new release tag from an old commit
git tag prod/shb_v1.1.9-recovery <commit-hash>
git push origin prod/shb_v1.1.9-recovery

# Trigger pipeline, build, publish, deploy as normal
# Then delete recovery tag
git tag -d prod/shb_v1.1.9-recovery
git push origin --delete prod/shb_v1.1.9-recovery
```

**Option 2: Manual Deployment**

If you have images built and cached locally:

```bash
# Load cached images
docker load < /path/to/cached/plane-frontend-shb_v1.1.9.tar.gz
docker load < /path/to/cached/plane-admin-shb_v1.1.9.tar.gz
docker load < /path/to/cached/plane-backend-shb_v1.1.9.tar.gz

# Create docker-compose file with correct image tags
# Then: docker-compose up -d
```

### Partial Failure (Some Services Won't Start)

```bash
# Check individual service logs
docker-compose logs api
docker-compose logs web
docker-compose logs postgres

# Common issues:
# - Database connection failed → check DATABASE_URL in plane.env
# - Redis unreachable → check REDIS_URL
# - Images not found → re-load all tarballs

# Retry migrations if database issue
docker-compose run --rm api python manage.py migrate

# Restart services if logs show transient errors
docker-compose restart
```

### Insufficient Disk Space

```bash
# Check available space
df -h /opt/shb-deploy/plane-app

# Free up space: delete old archives
# WARNING: This prevents rollback to very old releases
ls -t /opt/shb-deploy/plane-app/archive/*.zip | tail -n +4 | xargs rm -f

# Verify
ls -lh /opt/shb-deploy/plane-app/archive/

# Alternatively: expand disk or increase retention value
```

## Audit Trail

Every deployment and rollback is logged:

```bash
# View deployment history
cat /opt/shb-deploy/plane-app/deploy-audit.log

# Example output
2026-05-04T14:22:15Z | prod/shb_v1.2.0          | 0:gitlab-runner | 5f9c4ab08cac7457e9111a30e4664882556e518d66660e7b52b5c604d89f28f4 | 0
2026-05-03T10:15:30Z | prod/shb_v1.1.9          | 0:gitlab-runner | 3e8f2c1d9b4a6f5e2c8d7a9b3e1f4c5d6e7a8b9c0d1e2f3a4b5c6d7e8f9a0b | 0
2026-04-29T08:44:22Z | prod/shb_v1.1.8          | 0:gitlab-runner | 7c2a1e9d4f5b8c3e6d1a9f2c5e8b1d4a7f0c3e6a9d2f5b8c1e4a7d0f3c6a9 | 0

# Format: timestamp | release_tag | uid:username | sha256_of_archive | exit_code
```

Use audit log to:

- Trace who deployed what and when
- Find exact release tag and SHA256
- Verify deployment succeeded (exit_code 0)

## Rollback Testing

Periodically test rollback procedures to ensure they work:

```bash
# On non-prod environment (dev)
# 1. Deploy current version (e.g., prod/shb_v1.2.0)
# 2. Make a change and deploy next version (prod/shb_v1.2.1)
# 3. Roll back to v1.2.0 using archive
# 4. Verify all services healthy and data intact
```

## Prevention: Blue-Green Deployment

For zero-downtime rollback, deploy new version to separate infrastructure:

```yaml
# docker-compose.blue.yml (running version)
# docker-compose.green.yml (new version, not yet receiving traffic)

# Test green
docker-compose -f docker-compose.green.yml up -d
# Run smoke tests against green

# If OK: switch traffic to green
# If failed: keep blue running, delete green

# Previous blue becomes new archive
```

This requires load balancer configuration (outside scope of this guide).

**Last Updated:** 2026-05-04
