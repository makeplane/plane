# Environment File Configuration

## Overview

Each runner server needs a single configuration file: `/etc/plane-release-deploy.env` containing deploy credentials and paths.

**Security:**

- File permissions: `0400` (read-only for owner)
- Owner: `gitlab-runner` (runner's OS user)
- Never committed to git or stored in CI variables
- Rotated on token expiration

## Setup Process

### Step 1: Copy Template

```bash
# On dev server
sudo cp scripts/plane-release-deploy.env.example /etc/plane-release-deploy.env

# On prod server
sudo cp scripts/plane-release-deploy.env.example /etc/plane-release-deploy.env
```

### Step 2: Edit with Real Values

```bash
sudo nano /etc/plane-release-deploy.env
```

Replace placeholders:

```env
# Internal GitLab base URL (no trailing slash)
GITLAB_URL=https://gitlab.internal.example.com

# Find in GitLab UI: Settings → General → Project ID
PROJECT_ID=12345

# Package name — must match .gitlab-ci.yml PACKAGE_NAME variable
PACKAGE_NAME=plane-shb-release

# Deploy token from: Settings → Repository → Deploy tokens
# Scope: read_package_registry ONLY
DEPLOY_TOKEN=gldt-xxxxxxxxxxxxxxxxxxxx

# Environment identifier — controls which tag prefix is accepted
#   dev  → accepts dev/* tags only
#   prod → accepts prod/* tags only
TARGET_ENV=dev

# Deployment directory (must match .gitlab-ci.yml PLANE_DIR)
PLANE_DIR=/opt/shb-deploy/plane-app

# Number of archived releases to keep for rollback (default: 3)
ARCHIVE_KEEP=3

# Optional: Set if overriding via env file instead of CI variable
# CI variables take precedence over this file value
# RELEASE_TAG=dev/shb_v1.2.0-build.5
```

### Step 3: Secure File

```bash
# Set ownership
sudo chown gitlab-runner:gitlab-runner /etc/plane-release-deploy.env

# Set restrictive permissions (read-only for owner, nothing for others)
sudo chmod 0400 /etc/plane-release-deploy.env

# Verify
ls -la /etc/plane-release-deploy.env
# Should show: -r--------  1 gitlab-runner gitlab-runner
```

## File Contents Reference

### GITLAB_URL

**Format:** `https://gitlab.internal.example.com` (no trailing slash)

Used to construct API URLs for downloading packages and fetching release metadata.

### PROJECT_ID

**Find in GitLab UI:**

```
Settings → General → Project ID
```

Example: `12345`

**Note:** Different from project path; must be numeric ID.

### PACKAGE_NAME

**Must match** `.gitlab-ci.yml` variable:

```yaml
variables:
  PACKAGE_NAME: "plane-shb-release"
```

Packages in GitLab Registry are organized by this name and version.

### DEPLOY_TOKEN

**Create in GitLab UI:**

```
Settings → Repository → Deploy tokens
Name: plane-release-deploy-{env}
Scopes: read_package_registry (ONLY)
Expiry: 90 days (with rotation reminder)
```

Example: `gldt-xxxxxxxxxxxxxxxxxxxx`

**Security Notes:**

- Must have `read_package_registry` scope ONLY (not api, not write)
- Different from CI publish token
- Expires after 90 days — implement rotation calendar

### TARGET_ENV

**Valid values:** `dev` or `prod`

Controls tag validation — prevents accidentally deploying dev release to production:

```bash
# If TARGET_ENV=prod, only prod/* tags are accepted
# If TARGET_ENV=dev, dev/* tags preferred (warning on mismatch)
```

### PLANE_DIR

**Must match** `.gitlab-ci.yml`:

```yaml
variables:
  PLANE_DIR: "/opt/shb-deploy/plane-app"
```

This is where releases are extracted and docker-compose runs.

**Permissions:**

```bash
sudo mkdir -p /opt/shb-deploy/plane-app
sudo chown gitlab-runner:gitlab-runner /opt/shb-deploy/plane-app
sudo chmod 0755 /opt/shb-deploy/plane-app
```

### ARCHIVE_KEEP

**Default:** `3` (keep last 3 releases)

After each deployment, previous releases are archived in `${PLANE_DIR}/archive/`. Old archives beyond this limit are deleted automatically.

```bash
# View archives
ls -lh /opt/shb-deploy/plane-app/archive/

# Manually increase retention
# Edit /etc/plane-release-deploy.env
ARCHIVE_KEEP=5  # Keep last 5 instead
```

### RELEASE_TAG (Optional)

**Set via:** CI variable (takes precedence) or this file

Most deployments pass RELEASE_TAG as a CI variable when triggering the job:

```bash
# Manual trigger in GitLab UI
# Job: deploy:dev:release
# Variable: RELEASE_TAG=dev/shb_v1.2.0-build.123
```

If set in env file, provides a fallback — but CI variable always overrides.

**Never** omitted in either location — the script enforces explicit releases.

## Offline Dependency Cache

If your environment has limited internet access, pre-populate the cache on dev server:

```bash
# Create cache directory
sudo mkdir -p /opt/plane-cache
sudo chown gitlab-runner:gitlab-runner /opt/plane-cache
sudo chmod 0755 /opt/plane-cache

# Ops team maintains:
# 1. pnpm cache (from ~/.pnpm-store on a working dev env)
# 2. pip packages (requirements/*.txt wheel files)
# 3. docker layer cache (pulled images stored locally)
```

Reference in `.gitlab-ci.yml`:

```yaml
variables:
  PLANE_CACHE_DIR: "/opt/plane-cache"
```

## Verification Checklist

After setup, verify the configuration:

```bash
# File exists and is readable only by owner
ls -la /etc/plane-release-deploy.env
# Expected: -r--------  1 gitlab-runner gitlab-runner  ...

# Source the file (test parsing)
sudo -u gitlab-runner bash -c 'set -a; source /etc/plane-release-deploy.env; echo "✓ Env loaded"'

# Verify required variables
sudo -u gitlab-runner bash -c '
  source /etc/plane-release-deploy.env
  for VAR in GITLAB_URL PROJECT_ID PACKAGE_NAME DEPLOY_TOKEN TARGET_ENV PLANE_DIR; do
    [ -n "${!VAR}" ] && echo "✓ $VAR is set" || echo "✗ $VAR is MISSING"
  done
'

# Verify directory permissions
ls -ld /opt/shb-deploy/plane-app
# Expected: drwxr-xr-x  gitlab-runner gitlab-runner

# Test API connectivity (requires curl)
sudo -u gitlab-runner bash -c '
  source /etc/plane-release-deploy.env
  curl -sf --header "Deploy-Token: $DEPLOY_TOKEN" \
    "$GITLAB_URL/api/v4/projects/$PROJECT_ID/releases" \
    && echo "✓ GitLab API access OK" \
    || echo "✗ GitLab API access FAILED (check token/URL)"
'
```

## Troubleshooting

### "Permission denied" reading env file

```bash
# Fix: Ensure gitlab-runner user can read the file
sudo chown gitlab-runner:gitlab-runner /etc/plane-release-deploy.env
sudo chmod 0400 /etc/plane-release-deploy.env
```

### "DEPLOY_TOKEN must be set" error

```bash
# Verify token is in the file
sudo grep DEPLOY_TOKEN /etc/plane-release-deploy.env

# If blank, you copied the template without editing
# Edit with real value from GitLab UI
```

### "GitLab API access FAILED"

Check three things:

1. **URL:** Ping the GitLab server: `ping gitlab.internal.example.com`
2. **Token:** Verify it's current (not expired): GitLab UI → Settings → Repository → Deploy tokens
3. **Scope:** Confirm token has `read_package_registry` scope (check GitLab UI)

### Deployment directory permission errors

```bash
# Runner user needs write access to PLANE_DIR
sudo chown gitlab-runner:gitlab-runner /opt/shb-deploy/plane-app
sudo chmod 0755 /opt/shb-deploy/plane-app

# Verify
sudo -u gitlab-runner touch /opt/shb-deploy/plane-app/test.txt
sudo rm /opt/shb-deploy/plane-app/test.txt
```

**Last Updated:** 2026-05-04
