# P9A Production Self-Hosted Deployment, Upgrade Readiness & Custom Docker Hub Images

## Summary

P9A is operations-only. It points the Community install/upgrade path and image-build CI at this fork (`AFZidan/plane`, Docker Hub namespace `afzidan`) instead of `makeplane`, waits on healthy data stores before API/workers start, and documents how to publish and pull custom images. No product domains were added. No fake license or billing state was introduced.

P8B (PR #14, merge `5c5e443b85`) is on `preview`. `git remote -v` confirms `origin` is `AFZidan/plane` and `upstream` is `makeplane/plane`. PRs for this fork must target `origin` / `preview`.

## Image references

Plane application images are full `username/repo-name:tag-name` refs from GitHub Actions repository variables. Official data-store images (Postgres, Valkey, RabbitMQ, MinIO) are hardcoded in Compose and only pulled.

Set GitHub Actions repository variables:

- `PLANE_IMAGE_FRONTEND`, `PLANE_IMAGE_SPACE`, `PLANE_IMAGE_ADMIN`, `PLANE_IMAGE_LIVE`, `PLANE_IMAGE_BACKEND`, `PLANE_IMAGE_PROXY`
- `PLANE_IMAGE_AIO` (AIO build/release), `PLANE_IMAGE_AIO_FEATURE` (optional Feature Preview workflow)

`Branch Build CE` pushes each `PLANE_IMAGE_*` value as the Docker tag (exact `username/repo-name:tag-name`). It does not retag with the git branch name. After a successful run, Hub must show those tags (for example `aitechau/project:plane-admin-prod`), not a single `…:preview` tag shared by every app. The workflow stamps the same refs into `deployments/cli/community/variables.env` on the published assets. Install refuses to continue if any Plane image key is empty in `plane.env`.

## Defaults

| Setting                           | Previous (upstream)   | This fork                      |
| --------------------------------- | --------------------- | ------------------------------ |
| Application images                | `makeplane/plane-*:…` | GitHub repository variables    |
| GitHub repo for install downloads | `makeplane/plane`     | `AFZidan/plane`                |
| Install branch fallback           | `master`              | `preview`                      |
| Buildx cloud endpoint             | `makeplane/plane-dev` | none (docker-container driver) |

```bash
export GH_REPO=AFZidan/plane
export BRANCH=preview
```

## Docker Hub publish

Required GitHub secrets: `DOCKERHUB_USERNAME`, `DOCKERHUB_TOKEN`. Required repository variables: the `PLANE_IMAGE_*` list above. Those variable values must match the tags production Compose pulls. Push to `preview` or run **Branch Build CE** manually. ARM64 uses QEMU in `docker-container`.

## Upgrade readiness

- `./setup.sh upgrade` (install.sh) still archives compose/env, downloads new compose + `variables.env`, and merges previous `plane.env` keys.
- Downloads use `GH_REPO=AFZidan/plane` and fallback raw `preview` paths.
- `APP_RELEASE=stable` still tries GitHub latest release; this fork should keep `preview` until a tagged release exists.
- Migrator remains `on-failure`. API entrypoint still `wait_for_db` / `wait_for_migrations`.
- API/worker/beat now wait until Postgres, Valkey, and RabbitMQ healthchecks pass. API has an HTTP healthcheck on `/`.
- MinIO is pinned to `minio/minio:RELEASE.2024-12-18T13-15-44Z` in Community Compose.

Infrastructure backup/restore scripts (`restore.sh`, `restore-airgapped.sh`) are unchanged. No in-product backup UI.

## Production hardening (existing stack)

- Root `docker-compose.yml` is the production file: Hub images from `.env` (`PLANE_IMAGE_*`), no build context, no repo checkout. Pair it with `.env` copied from `.env.example`. Local source builds remain in `docker-compose-local.yml`.
- `ALLOWED_HOSTS` and `AUTHENTICATION_RATE_LIMIT` passed into API containers.
- `GUNICORN_WORKERS` is env-driven (default 1).
- `pull_policy` from `PULL_POLICY` (default `if_not_present`).
- `SECRET_KEY` / `LIVE_SERVER_SECRET_KEY` placeholders remain; Django already logs critically if `SECRET_KEY=change-this-key-on-deployment`.
- Admin Readiness is unchanged (P3B/P8A). Operators still configure SMTP/OAuth/AI/storage without exposing secrets.

Not changed: RBAC, webhook SSRF, throttles, upload limits, signed URLs.

## Validation

```bash
PULL_POLICY=if_not_present SECRET_KEY=test LIVE_SERVER_SECRET_KEY=test \
  PLANE_IMAGE_FRONTEND=example/plane-frontend:tag \
  PLANE_IMAGE_SPACE=example/plane-space:tag \
  PLANE_IMAGE_ADMIN=example/plane-admin:tag \
  PLANE_IMAGE_LIVE=example/plane-live:tag \
  PLANE_IMAGE_BACKEND=example/plane-backend:tag \
  PLANE_IMAGE_PROXY=example/plane-proxy:tag \
  docker compose -f deployments/cli/community/docker-compose.yml config --quiet
# community compose: OK

docker compose -f docker-compose.yml config --quiet
# root compose: OK

docker compose -f docker-compose-test.yml config --quiet
# test compose: OK
```

No live Docker Hub push was performed from this environment (requires `DOCKERHUB_TOKEN` and repository image variables).

## Files changed

- `deployments/cli/community/docker-compose.yml`
- `deployments/cli/community/install.sh`
- `deployments/cli/community/variables.env`
- `deployments/cli/community/README.md`
- `deployments/swarm/community/swarm.sh`
- `deployments/aio/community/Dockerfile`
- `deployments/aio/community/build.sh`
- `deployments/aio/community/README.md`
- `.github/workflows/build-branch.yml`
- `.github/workflows/feature-deployment.yml`
- `docker-compose.yml`
- `.env.example`
- `setup.sh`
- `docs/implementations/p9a-production-self-host-readiness.md`

## Out of scope

Templates, Initiatives, Teamspaces, Wiki, Customers, Connections, extra importers, dashboards, Pi Chat, SAML/OIDC/LDAP/SCIM, in-product backup/restore, Kubernetes chart rewrite, fake billing.
