# Runner Registration & Token Setup

## Runner Requirements

Both dev and prod runners must be:

- **OS:** Linux (preferably Ubuntu 22.04+)
- **Architecture:** x86_64 / amd64 (target servers are amd64)
- **Docker:** Installed and accessible to runner user
- **Utilities:** `curl`, `zip`, `unzip` available in PATH
- **Network:** Access to internal GitLab (optional if building offline)

## Dev Runner Registration (shb-dev)

This runner executes on the **development server** where images are built and tested.

### Step 1: Generate Registration Token

```
GitLab UI → Admin → Runners → Create instance runner
Type: Shell executor
Description: Plane SHB Dev Runner
Save → Copy registration token
```

### Step 2: Register on Dev Server

```bash
# SSH to dev server
ssh dev-server

# Register runner (interactive)
sudo gitlab-runner register \
  --url https://gitlab.internal.example.com \
  --registration-token <REGISTRATION_TOKEN> \
  --executor shell \
  --shell-script bash \
  --description "Plane SHB Dev Runner" \
  --tag-list "shb-dev,shell,deploy" \
  --protected true \
  --run-untagged false

# Verify
sudo gitlab-runner list
```

### Step 3: Configure Runner User

```bash
# Runner executes as 'gitlab-runner' by default
# Ensure it can access Docker
sudo usermod -aG docker gitlab-runner

# Create deploy directory (owned by runner)
sudo mkdir -p /opt/shb-deploy/plane-app
sudo chown gitlab-runner:gitlab-runner /opt/shb-deploy/plane-app
sudo chmod 0755 /opt/shb-deploy/plane-app

# Test Docker access
sudo -u gitlab-runner docker ps
```

## Prod Runner Registration (shb-prod)

This runner executes on the **production server** with restricted permissions.

### Step 1: Generate Registration Token

Same as dev runner above.

### Step 2: Register on Prod Server

```bash
# SSH to prod server
ssh prod-server

# Register with deploy-only tag
sudo gitlab-runner register \
  --url https://gitlab.internal.example.com \
  --registration-token <REGISTRATION_TOKEN> \
  --executor shell \
  --shell-script bash \
  --description "Plane SHB Prod Runner" \
  --tag-list "shb-prod,shell,deploy-only" \
  --protected true \
  --run-untagged false
```

### Step 3: Configure Runner User

```bash
# Same setup as dev runner
sudo usermod -aG docker gitlab-runner
sudo mkdir -p /opt/shb-deploy/plane-app
sudo chown gitlab-runner:gitlab-runner /opt/shb-deploy/plane-app

# Test
sudo -u gitlab-runner docker ps
```

## Token Provisioning

### Deploy Token (Read-Only)

Created for each environment to download release packages from GitLab Generic Package Registry.

**Create in GitLab UI:**

```
Settings → Repository → Deploy tokens
Name: plane-release-deploy-dev (or prod)
Scopes: read_package_registry (ONLY — uncheck all others)
Expiry: 90 days
```

**Copy the token value** — you'll need it for `/etc/plane-release-deploy.env`

Example: `gldt-xxxxxxxxxxxxxxxxxxxx`

### Publish Token (Write Access)

Created once for the project to publish release packages to GitLab Generic Package Registry.

**Create in GitLab UI:**

```
Settings → Access Tokens
Name: plane-release-publish
Scopes: write_package_registry, api
Expiry: 90 days
```

**Store in GitLab CI/CD Variables:**

1. Go to: Settings → CI/CD → Variables
2. Click "Add variable"
3. **Key:** `GITLAB_PUBLISH_TOKEN`
4. **Value:** Paste token from above
5. **Protected:** Yes (only on main, develop, preview branches)
6. **Masked:** Yes (hidden in logs)
7. **Expand:** No
8. Save

## Token Rotation Runbook

When tokens approach expiration:

### 1. Create New Deploy Token

```
Settings → Repository → Deploy tokens
Create new token (same scope as old)
Note expiration date
```

### 2. Update Each Runner's Env File

```bash
# On dev server
sudo nano /etc/plane-release-deploy.env
# Update DEPLOY_TOKEN=gldt-new...
sudo chown gitlab-runner:gitlab-runner /etc/plane-release-deploy.env
sudo chmod 0400 /etc/plane-release-deploy.env

# Repeat for prod server
ssh prod-server
sudo nano /etc/plane-release-deploy.env
sudo chown gitlab-runner:gitlab-runner /etc/plane-release-deploy.env
sudo chmod 0400 /etc/plane-release-deploy.env
```

### 3. Rotate Publish Token

```
Settings → Access Tokens
Revoke old token
Create new token (same scopes)
Update GITLAB_PUBLISH_TOKEN CI/CD variable
```

### 4. Verify

```bash
# Test dev deploy with new token
# Trigger: deploy:dev:release with RELEASE_TAG=dev/shb_v1.2.0-build.999

# Logs should show successful download and deployment
```

## Runner Verification

### Check Runner Status

```bash
# From any runner machine
sudo gitlab-runner verify

# Output should show all registered runners with ✓ alive
```

### Monitor Active Jobs

```bash
# View runner logs
sudo journalctl -u gitlab-runner -f

# Specific output
sudo gitlab-runner status
```

### Troubleshooting

**Runner not picking up jobs:**

- Verify tags match job definition in `.gitlab-ci.yml`
- Check `--run-untagged false` setting
- Confirm runner is marked "Protected"

**Token auth errors:**

- Verify token is not expired
- Check DEPLOY_TOKEN in `/etc/plane-release-deploy.env` matches GitLab
- Ensure token scopes: `read_package_registry` only

**Docker permission denied:**

- Confirm `gitlab-runner` user is in `docker` group: `id gitlab-runner`
- Restart runner: `sudo systemctl restart gitlab-runner`

**Last Updated:** 2026-05-04
