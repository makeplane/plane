# Deployment Workflow

## Overview

Two deployment strategies are available, chosen based on the use case:

| Strategy     | Trigger            | Speed                      | Use Case                       |
| ------------ | ------------------ | -------------------------- | ------------------------------ |
| **Auto Dev** | Merge to `develop` | Fast (artifacts cached)    | Continuous integration testing |
| **Release**  | Manual job trigger | Slower (download + verify) | Validated releases, production |

Both strategies produce identical deployments — they differ only in artifact source.

## Strategy 1: Automatic Dev Deploy (CI Artifacts)

Fastest path for continuous integration. Runs automatically after merge to `develop`.

### Flow

```
1. Developer merges PR to develop
   ↓
2. GitLab CI/CD triggers pipeline
   - lint → test → build → deploy:dev
   ↓
3. Build stage produces 3 docker images:
   - plane-frontend-shb_vX.Y.Z.tar.gz
   - plane-admin-shb_vX.Y.Z.tar.gz
   - plane-backend-shb_vX.Y.Z.tar.gz
   ↓
4. deploy:dev job (runs on shb-dev runner):
   - Copies artifacts to /tmp/plane-deploy/
   - Runs scripts/ci-deploy.sh locally
   - Loads images, runs migrations, docker-compose up
   ↓
5. Result: Dev server updated with latest code
   Duration: ~15-20 minutes (build time varies)
```

### Trigger Requirements

- Branch: `develop`
- Runner: `shb-dev` (shell executor, on dev server)
- No manual action needed
- Artifacts expire after 1 day

### Monitoring Deployment

```bash
# SSH to dev server
ssh dev-server

# Watch deployment progress
tail -f /opt/shb-deploy/plane-app/deploy-audit.log

# Check service health
docker-compose -f /opt/shb-deploy/plane-app/docker-compose.yaml ps

# View container logs
docker-compose -f /opt/shb-deploy/plane-app/docker-compose.yaml logs -f api web

# Health check
curl http://localhost:8000/health
curl http://localhost/
```

### When to Use

- **Development iterations:** Multiple merges per day
- **Feature testing:** Validate changes on shared dev environment
- **CI/CD validation:** Ensure pipeline itself works
- **Not for production:** Use release strategy instead

## Strategy 2: Release-Based Deploy (GitLab Package Registry)

Slower but more controlled. Publishes immutable release packages, triggered manually.

### Release Workflow

#### Phase 1: Build & Publish Release Package

Triggered when you create a tag matching the release pattern.

**For Dev Release:**

```bash
# No explicit tag needed — automatic on merge to preview
# But you can also trigger manually with: dev/shb_v1.2.0-build.123
```

**For Prod Release (Maintainer+ only):**

```bash
# Create protected tag (must be Maintainer or Owner)
git tag prod/shb_v1.2.0
git push origin prod/shb_v1.2.0

# Pipeline auto-triggers:
# build:web:shell → build:admin:shell → build:api:shell
#   ↓
# release:publish:prod (assembles zip, publishes to GitLab)
```

**What happens:**

1. Images rebuilt from exact commit
2. `publish-gitlab-release-package.sh` creates zip:
   - `plane-shb-release-shb_vX.Y.Z.zip` (contains 3 tarballs + docker-compose.shb.yml + scripts)
   - MANIFEST with version, architecture, image list
3. SHA256 checksum computed
4. Package uploaded to GitLab Generic Package Registry
5. GitLab Release created with SHA256 in description

Example Release on GitLab:

```
Release: prod/shb_v1.2.0
Description:
  Release prod/shb_v1.2.0 — commit abc123def456
  SHA256: 5f9c4ab08cac7457e9111a30e4664882556e518d66660e7b52b5c604d89f28f4

Artifacts:
  plane-shb-release-shb_v1.2.0.zip (700 MB)
  plane-shb-release-shb_v1.2.0.SHA256SUMS
```

#### Phase 2: Manual Deploy Trigger

**For Dev Release:**

1. Go to GitLab UI: CI/CD → Pipelines
2. Find release pipeline (tag: `dev/shb_v1.2.0-build.123`)
3. Scroll to `deploy:dev:release` job (currently manual)
4. Click "▶ Play" button
5. System deploys to dev server

**For Prod Release:**

1. Go to GitLab UI: CI/CD → Pipelines
2. Find release pipeline (tag: `prod/shb_v1.2.0`)
3. Scroll to `deploy:prod:release` job (currently manual)
4. Click "▶ Play" button
5. System deploys to prod server (requires Maintainer status)

### Deploy Job Details

Both `deploy:dev:release` and `deploy:prod:release` run the same script:

**Script:** `scripts/deploy-from-internal-gitlab-release.sh`

**What it does:**

```bash
[1/8] Fetch Release metadata from GitLab API
      ↓ Extract SHA256 from release description
[2/8] Download package zip from GenericPackageRegistry
[3/8] Verify checksum matches release metadata
[4/8] Extract zip → validate MANIFEST
[5/8] Load Docker images from tar.gz files
[6/8] Run deploy-shb.sh (migrations, compose up)
[7/8] Archive previous release (for rollback)
[8/8] Log audit entry (timestamp, user, SHA256, status)
```

### Monitoring Deployment

```bash
# Option 1: Watch job logs in GitLab UI
# GitLab → CI/CD → Pipelines → deploy:prod:release → Logs

# Option 2: SSH to server and watch locally
ssh prod-server
tail -f /opt/shb-deploy/plane-app/deploy-audit.log

# Option 3: Check deployment status
docker-compose -f /opt/shb-deploy/plane-app/docker-compose.yaml ps
curl https://jms.shinhan.com.vn/health
```

### When to Use

- **Controlled deployments:** Explicit tag for each release
- **Production updates:** Only Maintainer can trigger
- **Validation releases:** Test before going to prod
- **Rollback safety:** Previous releases archived locally
- **Audit trail:** Every deployment logged with user, timestamp, SHA256

## Comparison Table

| Aspect           | Auto Dev          | Release Deploy             |
| ---------------- | ----------------- | -------------------------- |
| Trigger          | Auto on merge     | Manual job button          |
| Artifacts        | Cache in CI       | GitLab Package Registry    |
| Immutability     | Latest build      | Exact tagged commit        |
| Deployment speed | ~15-20 min        | ~10-15 min (download only) |
| Suitable for     | Continuous dev    | Production                 |
| Audit trail      | Implicit (commit) | Explicit (deployment log)  |
| Rollback         | Previous commit   | Previous zip archive       |

## Deployment Checklist

### Before Auto Dev Merge

- [ ] All tests passing locally (`pnpm test`, `python run_tests.py`)
- [ ] Linting passes (`pnpm check:lint`)
- [ ] No hardcoded secrets in code
- [ ] PR reviewed and approved

### Before Release Deploy

- [ ] Feature complete and tested on dev
- [ ] Staging/prod config reviewed
- [ ] Database migrations are backward compatible
- [ ] Release notes prepared
- [ ] Previous release(s) archived (automatic)
- [ ] Team notified of planned deployment
- [ ] Maintenance window scheduled (if needed)

### After Deploy (Any Strategy)

1. **Smoke Tests:**

   ```bash
   # Check services are running
   curl https://app.example.com/health

   # Verify key pages load
   curl https://app.example.com/auth/sign-in
   curl https://app.example.com/api/v1/workspaces
   ```

2. **Health Check:**

   ```bash
   # SSH to server and check container health
   docker-compose ps  # All should be "Up"
   docker-compose logs --tail=50  # Check for errors
   ```

3. **User Acceptance:**
   - Test basic workflows in the UI
   - Verify data integrity (no missing records)
   - Check background jobs (Celery) are processing

4. **Audit Trail:**
   ```bash
   # View deployment record
   tail /opt/shb-deploy/plane-app/deploy-audit.log
   ```

## Troubleshooting

### Deployment Fails — "Image not available after load"

**Cause:** Docker image corrupted during download or extraction

**Fix:**

```bash
# Clean up and re-trigger
docker system prune -a  # Remove all images
# Re-trigger deploy:*:release job in GitLab UI
```

### Deployment Hangs on Migrations

**Cause:** Large schema migration blocking other services

**Fix:**

```bash
# Check migration status
docker-compose logs -f api

# If blocked, kill and retry (down migrations are safe)
docker-compose down
docker-compose up -d

# View logs
docker-compose logs api
```

### No Archive Kept After Deployment

**Cause:** Archive retention policy or permissions issue

**Fix:**

```bash
# Verify archive directory exists and is writable
ls -ld /opt/shb-deploy/plane-app/archive

# Fix permissions if needed
sudo chown gitlab-runner:gitlab-runner /opt/shb-deploy/plane-app/archive
sudo chmod 0755 /opt/shb-deploy/plane-app/archive

# Check ARCHIVE_KEEP setting in /etc/plane-release-deploy.env
sudo grep ARCHIVE_KEEP /etc/plane-release-deploy.env
```

### Rollback from Previous Release

See [Rollback & Recovery](./rollback.md)

**Last Updated:** 2026-05-04
