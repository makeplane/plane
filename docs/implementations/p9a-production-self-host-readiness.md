# P9A Production Self-Hosted Deployment, Upgrade Readiness & Custom Docker Hub Images

## Summary

P9A is operations-only. It points the Community install/upgrade path and image-build CI at this fork (`AFZidan/plane`, Docker Hub namespace `afzidan`) instead of `makeplane`, waits on healthy data stores before API/workers start, and documents how to publish and pull custom images. No product domains were added. No fake license or billing state was introduced.

P8B (PR #14, merge `5c5e443b85`) is on `preview`. `git remote -v` confirms `origin` is `AFZidan/plane` and `upstream` is `makeplane/plane`. PRs for this fork must target `origin` / `preview`.

## Defaults

| Setting                           | Previous (upstream)   | This fork                                                                                |
| --------------------------------- | --------------------- | ---------------------------------------------------------------------------------------- |
| Docker Hub owner                  | `makeplane`           | `afzidan` (`DOCKERHUB_USER` / `vars.DOCKERHUB_NAMESPACE` / `secrets.DOCKERHUB_USERNAME`) |
| GitHub repo for install downloads | `makeplane/plane`     | `AFZidan/plane`                                                                          |
| Install branch fallback           | `master`              | `preview`                                                                                |
| App image tag                     | `stable`              | `preview`                                                                                |
| Buildx cloud endpoint             | `makeplane/plane-dev` | none (docker-container driver)                                                           |

Override at install time:

```bash
export DOCKERHUB_USER=afzidan
export APP_RELEASE=preview
export GH_REPO=AFZidan/plane
export BRANCH=preview
```

## Docker Hub publish

`Branch Build CE` (`.github/workflows/build-branch.yml`) still uses `makeplane/actions/build-push` but sets `docker-image-owner` from:

1. `vars.DOCKERHUB_NAMESPACE` if set
2. else `secrets.DOCKERHUB_USERNAME`
3. else `afzidan`

Images:

- `plane-frontend`, `plane-space`, `plane-admin`, `plane-live`, `plane-backend`, `plane-proxy`
- AIO `plane-aio-community` (when AIO/release is requested), assembled from the same owner via `DOCKERHUB_USER` build-arg

Required GitHub secrets: `DOCKERHUB_USERNAME`, `DOCKERHUB_TOKEN`. Push to `preview` or run the workflow manually. ARM64 no longer depends on Makeplane Docker Build Cloud; it uses QEMU in `docker-container`.

Community Compose previously hardcoded `makeplane/...` even though `install.sh` exported `DOCKERHUB_USER`. Images now interpolate `${DOCKERHUB_USER:-afzidan}/...`.

## Upgrade readiness

- `./setup.sh upgrade` (install.sh) still archives compose/env, downloads new compose + `variables.env`, and merges previous `plane.env` keys.
- Downloads use `GH_REPO=AFZidan/plane` and fallback raw `preview` paths.
- `APP_RELEASE=stable` still tries GitHub latest release; this fork should keep `preview` until a tagged release exists.
- Migrator remains `on-failure`. API entrypoint still `wait_for_db` / `wait_for_migrations`.
- API/worker/beat now wait until Postgres, Valkey, and RabbitMQ healthchecks pass. API has an HTTP healthcheck on `/`.
- MinIO is pinned to `RELEASE.2024-12-18T13-15-44Z` (no floating `latest`).

Infrastructure backup/restore scripts (`restore.sh`, `restore-airgapped.sh`) are unchanged. No in-product backup UI.

## Production hardening (existing stack)

- Data-service healthchecks on Community Compose and root `docker-compose.yml`.
- `ALLOWED_HOSTS` and `AUTHENTICATION_RATE_LIMIT` passed into API containers.
- `GUNICORN_WORKERS` is env-driven (default 1).
- `pull_policy` from `PULL_POLICY` (default `if_not_present`).
- `SECRET_KEY` / `LIVE_SERVER_SECRET_KEY` placeholders remain; Django already logs critically if `SECRET_KEY=change-this-key-on-deployment`.
- Admin Readiness is unchanged (P3B/P8A). Operators still configure SMTP/OAuth/AI/storage without exposing secrets.

Not changed: RBAC, webhook SSRF, throttles, upload limits, signed URLs.

## Validation

```bash
DOCKERHUB_USER=afzidan APP_RELEASE=preview PULL_POLICY=if_not_present \
  SECRET_KEY=test LIVE_SERVER_SECRET_KEY=test \
  docker compose -f deployments/cli/community/docker-compose.yml config --quiet
# community compose: OK

docker compose -f docker-compose.yml config --quiet
# root compose: OK
```

Resolved app images are `afzidan/plane-*:preview`. No live Docker Hub push was performed from this environment (requires `DOCKERHUB_TOKEN`).

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
