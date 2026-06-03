# Deployment Walkthrough

Step-by-step guide for building, publishing, and deploying Plane SHB in the air-gapped environment.

---

## Prerequisites Checklist

One-time setup — confirm before first deploy:

- [ ] GitLab runner installed on dev server and prod server (see `docs/deployment/setup-runners.md`)
- [ ] `/etc/plane-release-deploy.env` created on each server (`chmod 0400`, runner-user owned)
- [ ] Deploy token created in GitLab (`read_package_registry` scope only) — pasted into `/etc/plane-release-deploy.env`
- [ ] Protected tag `prod/*` configured: GitLab → Settings → Repository → Protected tags → `prod/*` → Maintainer+
- [ ] `upload-release.env` configured on the internal upload machine (see Step 2 below)

---

## Three Deployment Strategies

| Strategy                      | When to use                             | Who triggers          |
| ----------------------------- | --------------------------------------- | --------------------- |
| **A. Auto Dev (CI Build)**    | Merge to `develop` — fast iteration     | Automatic             |
| **B. Local Build → Release**  | Build on Mac, deploy via GitLab Release | Developer (manual)    |
| **C. Server Build → Release** | Build on dev server from a tag          | Automatic on tag push |

---

## Strategy A — Auto Dev Deploy (merge to `develop`)

No manual steps needed. Used for continuous integration.

```
PR merged to develop
  → lint → test → build (on shb-dev runner)
  → deploy:dev (loads images, runs migrations, docker compose up)
  → release:publish:dev (publishes package to registry for later use)
```

**To trigger:** Merge a PR into `develop`.

**To watch:** GitLab → CI/CD → Pipelines → find latest pipeline on `develop` branch.

**To verify on dev server:**

```bash
docker compose -f docker-compose.yaml -f docker-compose.shb.yml ps
curl -sf http://localhost:3000/api/health/
cat /root/Documents/plane-offline-pack/plane-app/deploy-audit.log | tail -1
```

---

## Strategy B — Local Build → GitLab Release → Auto Deploy

Use when you build images on your Mac and need to deploy without SCP'ing files to the server.

### Step 1: Build on Mac

```bash
# In the repo root on your Mac
./scripts/build-shb-images.sh
```

Produces in `dist/`:

```
dist/.shb-version                      ← e.g. shb_v1.2.0
dist/plane-frontend-shb_v1.2.0.tar.gz  ← ~400 MB
dist/plane-admin-shb_v1.2.0.tar.gz     ← ~200 MB
dist/plane-backend-shb_v1.2.0.tar.gz   ← ~300 MB
```

Also note the current commit SHA — you'll need it:

```bash
git rev-parse HEAD
# e.g. a1b2c3d4e5f6... (copy the full 40-char SHA)
```

---

### Step 2: Transfer to internal upload machine

Transfer the `dist/` folder from Mac to the internal machine (USB, internal file share, etc.):

```
dist/
├── .shb-version
├── plane-frontend-shb_v1.2.0.tar.gz
├── plane-admin-shb_v1.2.0.tar.gz
└── plane-backend-shb_v1.2.0.tar.gz
```

Also transfer the repo's `scripts/` folder (needed by `upload-release.sh`).

---

### Step 3: Configure upload-release.env (one-time, per machine)

On the internal upload machine, in the repo root:

```bash
cp scripts/upload-release.env.example upload-release.env
nano upload-release.env
```

Fill in:

```bash
GITLAB_URL=http://gitlabvn.shinhan.com          # internal GitLab URL
CI_PROJECT_ID=12345                              # GitLab Settings → General → Project ID
GITLAB_PUBLISH_TOKEN=glpat-xxxxxxxxxxxxxxxxxxxx  # Project access token (write_package_registry + api)
CI_COMMIT_SHA=a1b2c3d4...                        # full SHA from git rev-parse HEAD (Step 1)
DIST_DIR=./dist                                  # path to the transferred dist/ folder
```

`upload-release.env` is gitignored — it never enters the repo.

> **How to get `GITLAB_PUBLISH_TOKEN`:**
> GitLab → Project Settings → Access Tokens → New token
> Scopes: `api` + `write_package_registry`
> Copy the token immediately — GitLab won't show it again.
> Store it **only** on this internal machine. Never paste into GitLab CI Variables.

---

### Step 4: Upload and trigger deploy

```bash
# For dev environment
bash scripts/upload-release.sh dev/shb_v1.2.0-build.5

# For prod environment (requires Maintainer permission to create prod/* tag)
bash scripts/upload-release.sh prod/shb_v1.2.0
```

The script:

1. Assembles the release package (zip of all 3 tar.gz + MANIFEST + deploy script)
2. Uploads to GitLab Generic Package Registry with SHA256 verification
3. Creates a GitLab Release with SHA256 embedded in the description
4. Creates the git tag via GitLab API → **this triggers the CI pipeline automatically**

---

### Step 5: Watch the pipeline

Go to GitLab → CI/CD → Pipelines → find the pipeline for your tag.

**For `dev/shb_v1.2.0-build.5`:**

```
deploy:dev:release   → shb-dev runner pulls package from registry → deploys to dev server
```

**For `prod/shb_v1.2.0`:**

```
deploy:prod:release  → shb-prod runner pulls package from registry → deploys to prod server
```

Both jobs run `scripts/deploy-from-internal-gitlab-release.sh` which:

1. Fetches Release metadata (SHA256 anchor)
2. Downloads zip from Package Registry using deploy token
3. Verifies SHA256 — aborts if mismatch
4. Loads Docker images
5. Runs `deploy-shb.sh` (migrations + docker compose up)
6. Archives previous package (rollback point)
7. Writes audit log entry

---

### Step 6: Verify

```bash
# On the server (or watch in GitLab job logs)
docker compose -f docker-compose.yaml -f docker-compose.shb.yml ps
curl -sf http://localhost:3000/api/health/
cat /root/Documents/plane-offline-pack/plane-app/deploy-audit.log | tail -1
```

---

## Strategy C — Server Build → Release (tag-triggered)

Used when you want the CI server (shb-dev) to rebuild images from a specific commit.

**For dev:**

```
# GitLab → Repository → Tags → New tag
Tag: dev/shb_v1.2.0-build.5
Create from: develop (or specific commit SHA)

Pipeline: build:web:shell → build:admin:shell → build:api:shell
        → release:publish:dev → deploy:dev:release (auto)
```

**For prod (Maintainer+ only):**

```
# GitLab → Repository → Tags → New tag
Tag: prod/shb_v1.2.0
Create from: preview branch

Pipeline: build:web:shell → build:admin:shell → build:api:shell
        → release:publish:prod → deploy:prod:release (auto)
```

> Prod tag creation restricted to Maintainer+.
> Settings → Repository → Protected tags → `prod/*` → Maintainer.

---

## GitLab Operations Reference

### View pipelines

GitLab → CI/CD → Pipelines

### View releases and packages

GitLab → Deploy → Releases
GitLab → Deploy → Package Registry → `plane-shb-release`

### Re-run a failed job

GitLab → CI/CD → Pipelines → click failed job → Retry

### Trigger deploy manually (if `when: manual`)

GitLab → CI/CD → Pipelines → find pipeline → click ▶ Play on the job

### Create a tag in GitLab UI

GitLab → Repository → Tags → New tag

- Tag name: `dev/shb_v1.2.0-build.5` or `prod/shb_v1.2.0`
- Create from: branch or commit SHA

---

## Rollback

```bash
# On the server — list archived packages (last 3 kept automatically)
ls /root/Documents/plane-offline-pack/plane-app/archive/

# Extract and redeploy a previous release
mkdir -p /tmp/rollback-pkg
unzip /root/Documents/plane-offline-pack/plane-app/archive/<previous-release>.zip -d /tmp/rollback-pkg/

PLANE_DIR=/root/Documents/plane-offline-pack/plane-app \
  bash /tmp/rollback-pkg/*/scripts/deploy-shb.sh \
    /tmp/rollback-pkg/*/dist \
    /root/Documents/plane-offline-pack/plane-app/plane.env \
    /root/Documents/plane-offline-pack/plane-app/docker-compose.yaml

curl -sf http://localhost:3000/api/health/
```

---

## Troubleshooting

| Problem                                    | Fix                                                                                                 |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------- |
| `gitlabvn.shinhan.com` — DNS lookup failed | Add to `/etc/hosts`: `<GITLAB_LAN_IP> gitlabvn.shinhan.com`                                         |
| `upload-release.env not found`             | `cp scripts/upload-release.env.example upload-release.env` and fill it in                           |
| `CI_COMMIT_SHA is not a valid full SHA`    | Run `git rev-parse HEAD` on your Mac at the exact commit you built from                             |
| Runner not picking up jobs                 | GitLab → Settings → CI/CD → Runners → verify `shb-dev` / `shb-prod` tags match                      |
| `RELEASE_TAG must be set explicitly`       | The deploy env file on the server is missing `RELEASE_TAG` — CI variable overrides it automatically |
| SHA256 mismatch on deploy                  | Archive corrupt in transit — re-upload with `upload-release.sh`                                     |
| Package upload fails (413)                 | GitLab `client_max_body_size` too small — ask GitLab admin to increase                              |
| `Image not available after load`           | tar.gz corrupt — rebuild with `build-shb-images.sh` and re-upload                                   |
| `No space left on device`                  | Needs 4 GB free on `PLANE_DIR` partition — `docker system prune -a` on the server                   |

---

**Last updated:** 2026-05-07
