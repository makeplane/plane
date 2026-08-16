# P10A Coordinated Production Release, Deployment & Rollback

## Summary

P10A adds a **manual, atomic production release path** on top of P9B image integrity.

- All six Plane app images are built from one git SHA (existing Branch Build CE).
- The build job writes a **release manifest** (refs + digests + SHA) as a GitHub Actions artifact. Manifests are not committed to git.
- **Deploy Production** is a separate `workflow_dispatch` workflow. It never runs on pull requests and never deploys after a partial image publish.
- The VPS pulls **by digest**, retags to the operator-controlled `PLANE_IMAGE_*` values, runs `migrator`, then recreates **application** containers together.
- Data-store volumes are not destroyed. Watchtower stays disabled.
- Rollback restores a previous **complete** manifest. Database migrations are not reversed.

P9B (PR #19, merge `822f47ef0d`) is on `preview`. This phase does not add product domains, commercial services, or fake license state.

## Release architecture

```
Branch Build CE (preview push or workflow_dispatch)
  checkout github.sha
  build/push frontend, admin, space, live, backend, proxy
  collect digests
  write plane-release-manifest.json
  upload artifact  (no SSH, no production environment)
        ↓
operator starts Deploy Production with that build run ID
        ↓
validate manifest + run conclusion
        ↓
SSH to VPS (GitHub environment: production)
        ↓
snapshot currently running identity
        ↓
docker pull repo@sha256:…  (not the mutable tag)
docker tag onto PLANE_IMAGE_* refs
verify local RepoDigests == manifest
        ↓
migrator (existing service, --no-deps)
        ↓
compose up -d --no-deps --force-recreate
  web admin space api worker beat-worker live proxy
        ↓
health + policy + build_revision + digest + smoke
        ↓
success record under $PLANE_DEPLOY_DIR/releases/
```

If any required image build fails, Branch Build CE never uploads a complete manifest and Deploy Production cannot start from that run. Production stays untouched.

A later push to the same mutable tag (for example `hizidan/projects:plane-web-prod`) is a **different release**. Deployment identity is digest + `org.opencontainers.image.revision`, not the tag string.

## Manifest format

Artifact name: `plane-release-manifest`  
File: `plane-release-manifest.json`

```json
{
  "schema_version": 1,
  "revision": "40-character-git-sha",
  "built_at": "2026-08-16T00:00:00Z",
  "repository": "AFZidan/plane",
  "images": {
    "frontend": { "ref": "hizidan/projects:plane-web-prod", "digest": "sha256:…" },
    "admin": { "ref": "…", "digest": "sha256:…" },
    "space": { "ref": "…", "digest": "sha256:…" },
    "live": { "ref": "…", "digest": "sha256:…" },
    "backend": { "ref": "…", "digest": "sha256:…" },
    "proxy": { "ref": "…", "digest": "sha256:…" }
  }
}
```

No secrets. Use each `PLANE_IMAGE_*` value verbatim; never append SHA, `latest`, or `APP_VERSION`.

API, worker, beat-worker, and migrator all use `PLANE_IMAGE_BACKEND`.

## Build workflow changes

`.github/workflows/build-branch.yml` keeps P9B behavior (exact checkout, OCI labels, verbatim image refs, digest reporting) and now:

1. Generates the manifest with `deployments/production/plane_release.py generate`.
2. Uploads it as `plane-release-manifest`.
3. Still does **not** SSH and does **not** use the `production` environment.

## Deployment workflow

`.github/workflows/deploy-production.yml`

- Trigger: **manual** `workflow_dispatch` only (`deploy` or `rollback`).
- Concurrency: `group: plane-production`, `cancel-in-progress: false` (queued, never cancelled mid-mutation).
- `prepare` job: no production secrets. For deploy, requires a numeric Branch Build CE run ID whose conclusion is success, downloads that run’s manifest, and checks `manifest.revision == run.headSha`.
- `deploy` job: `environment: production` (SSH secrets). Copies compose + scripts (never `.env`). Runs `deploy.sh` or `rollback.sh`.

Refusing to deploy “whatever the tags currently point at” is intentional.

## GitHub Variables

| Variable               | Where      | Purpose                                                           |
| ---------------------- | ---------- | ----------------------------------------------------------------- |
| `PLANE_IMAGE_FRONTEND` | repository | Full image ref, tag included                                      |
| `PLANE_IMAGE_SPACE`    | repository |                                                                   |
| `PLANE_IMAGE_ADMIN`    | repository |                                                                   |
| `PLANE_IMAGE_LIVE`     | repository |                                                                   |
| `PLANE_IMAGE_BACKEND`  | repository | Shared by api/worker/beat-worker/migrator                         |
| `PLANE_IMAGE_PROXY`    | repository |                                                                   |
| `PROD_APP_URL`         | repository | Public origin for health checks, e.g. `https://plane.example.com` |

Optional AIO variables remain build-only (`PLANE_IMAGE_AIO`, `PLANE_IMAGE_AIO_FEATURE`).

## GitHub Secrets

### Repository (build only)

| Secret               | Used by         |
| -------------------- | --------------- |
| `DOCKERHUB_USERNAME` | Branch Build CE |
| `DOCKERHUB_TOKEN`    | Branch Build CE |

These must **not** be granted to pull-request jobs beyond existing build workflows. Deploy Production does not receive Docker Hub tokens; the VPS uses its existing Hub login.

### Environment `production` (deploy only)

Create a GitHub Environment named `production` and store:

| Secret                 | Required | Purpose                      |
| ---------------------- | -------- | ---------------------------- |
| `PROD_HOST`            | yes      | VPS hostname                 |
| `PROD_USER`            | yes      | SSH user                     |
| `PROD_SSH_KEY`         | yes      | Private key                  |
| `PROD_PORT`            | no       | Default 22                   |
| `PROD_DEPLOY_DIR`      | no       | Default `/opt/plane`         |
| `PROD_SSH_KNOWN_HOSTS` | no       | Preferred over `ssh-keyscan` |

Enable required reviewers on that environment if the org allows it. Production SSH credentials must not be copied into Branch Build CE.

## Production server

Assume the host already has:

- this repository (or at least `docker-compose.yml`, `docker-compose-prod.yml`, `.env`)
- Docker + Compose
- Docker Hub auth if images are private
- `jq`, `curl`, `python3`, `git` (git used to sync compose files to the release SHA)

Host packages: `sudo apt-get install -y jq curl python3 git rsync`

Do **not** overwrite `.env` from GitHub. Do **not** copy `.env.prod.example` over production `.env`.

`PLANE_RELEASES_DIR` defaults to `$PLANE_DEPLOY_DIR/releases` when invoked from the workflow (`/opt/plane/releases` if `PROD_DEPLOY_DIR` is `/opt/plane`). Keep 10 records. Records contain refs, digests, revision, timestamps — not secrets.

## Digest verification

On the host, `deploy.sh`:

1. `docker pull <repository>@sha256:…` for each component.
2. `docker tag` onto the operator tag from the manifest `ref`.
3. `docker image inspect` → `RepoDigests` compared to the manifest.
4. Recreates containers with `PULL_POLICY=never` so Compose cannot replace the digest with a newer mutable tag.

Mismatch → **stop before recreating containers**.

## Migration sequence

1. Ensure `plane-db`, `plane-redis`, `plane-mq`, `plane-minio` are healthy (`up -d --no-recreate`, never `down -v`).
2. `docker compose --env-file .env -f docker-compose-prod.yml run --rm --no-deps migrator`
3. If migrator fails: abort. Application containers are not recreated. **Migrations are not reversed.**
4. Recreate application services only.

## Health verification

Failed checks fail the GitHub job.

- Containers running: `web`, `admin`, `space`, `api`, `bgworker`, `beatworker`, `plane-live`, `proxy`
- Running image digests match the manifest
- `GET $PROD_APP_URL/api/instances/`
  - `capabilities.policy.self_hosted == true`
  - `commercial_gating == false`
  - `feature_tier == "unlimited"`
  - `config.build_revision` equals the release SHA
- Frontend HTTP 2xx on `/`
- Bounded smoke: `/`, `/signin`, `/api/instances/` must not 5xx. No production data is created.

Workspace Settings / Worklogs / Import Hub / Active Cycles remain SPA routes served by the same frontend; this phase does not log in as a user.

If health fails **after** migrator succeeded, the job fails visibly. Application rollback is **manual** because the schema may already have moved forward.

## Rollback

GitHub: Deploy Production → action `rollback` → `rollback_release_id` = directory name under `releases/` (printed in the deploy log).

Host:

```bash
export PLANE_DEPLOY_DIR=/opt/plane
export PLANE_APP_URL=https://plane.example.com
export PLANE_RELEASES_DIR=/opt/plane/releases
bash deployments/production/rollback.sh --release-id 20260816T010203Z-aabbccddeeff
```

Rollback pulls that **complete** image set and recreates app containers. It does **not** run migrator unless `--run-migrator` is passed. Django migrations are not automatically reversed. If a release added a non-backward-compatible migration, application rollback without a DB plan can fail; restore from an external DB backup using existing operational practice — this is not a product backup/restore feature.

## Exact deployment commands

After merging this PR and configuring secrets:

1. Run **Branch Build CE** on `preview` (push or `workflow_dispatch`). Note the run ID and the summary table of refs/digests.
2. Actions → **Deploy Production** → `deploy` → paste `build_run_id`.
3. Confirm the job summary: source SHA, migration succeeded, health succeeded, record path.

Host-only equivalent (same scripts the workflow copies):

```bash
export PLANE_DEPLOY_DIR=/opt/plane
export PLANE_APP_URL=https://plane.example.com
export PLANE_RELEASES_DIR=/opt/plane/releases
# manifest copied from the GitHub artifact
bash /opt/plane/deployments/production/deploy.sh \
  --manifest /opt/plane/plane-release-manifest.json
```

Compose topology remains P9B: root `docker-compose.yml` plus include alias `docker-compose-prod.yml`. Fail-closed `PLANE_IMAGE_*`. No `makeplane/*` app fallback.

## Post-P9B secret rotation (operators)

P9B found live-looking secrets in git history / old Compose dumps. Rotate **on the host** if those values were used. Do not commit replacements.

- `SECRET_KEY`
- `LIVE_SERVER_SECRET_KEY`
- `AES_SECRET_KEY`
- `MACHINE_SIGNATURE`
- webhook secrets
- OAuth / API credentials
- Docker Hub token if exposure is suspected

This repository does not generate or rotate those values.

## Concurrency and Watchtower

Two production deploys cannot run at once (`cancel-in-progress: false`). Watchtower must stay disabled; `deploy.sh` refuses if a `watchtower` container is running or app containers still have `com.centurylinklabs.watchtower.enable=true`.

## Tests

Release helpers (no production host): **20 passed** in 2.585s.

```bash
python3 deployments/production/test_plane_release.py -v
bash -n deployments/production/common.sh
bash -n deployments/production/deploy.sh
bash -n deployments/production/rollback.sh
bash -n deployments/production/healthcheck.sh
```

These cover manifest generation, missing-component/makeplane rejection, digest mismatch abort, compose fail-fast, compose with dummy refs (no `makeplane/*`, no Watchtower), and workflow isolation (production SSH not on Branch Build CE).

Backend Docker regression: **93 passed** in 1016.42s (self-hosted policy, Worklogs, Active Cycles, bulk archive, Jira importer, capabilities/readiness). RabbitMQ became healthy before pytest; no startup-race rerun was required.

Frontend: `oxfmt --check` on the new docs, `web check:format` pass, `web check:types` pass (11 tasks, cache hit). No application TS/JS changed; oxlint had no new frontend surface.

## Remaining source-absent features

Unchanged from P9B. Do not fabricate Templates, Initiatives, Wiki, Teamspaces, Customers, Connections, dashboards, Pi Chat, or extra importers.

## Out of scope

Automatic deploy on every preview push, Watchtower, commercial Compose restore, secret rotation from CI, reversing Django migrations, merging this PR.
