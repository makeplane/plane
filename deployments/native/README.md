# Native (systemd) deployment

Runs Plane directly on an Ubuntu 24.04 host, without Docker, and redeploys on every push to `production`.

| Piece | Runs as | Listens on |
| --- | --- | --- |
| Caddy (`caddy`) | caddy | `:3356` (behind the TLS terminator) |
| API, gunicorn (`plane-api`) | plane | `127.0.0.1:8100` |
| Celery worker / beat (`plane-worker`, `plane-beat`) | plane | – |
| Space SSR (`plane-space`) | plane | `127.0.0.1:3102` |
| Live (`plane-live`) | plane | `127.0.0.1:3100` |
| Web, admin | static files served by Caddy | – |
| PostgreSQL 18, Redis, RabbitMQ | packages | localhost |
| Silo, an S3-compatible MinIO fork (`silo`) | silo | `127.0.0.1:9100` (console on `:9101`) |

## Layout

```
/opt/plane/
  repo.git/             bare mirror of origin, fetches only `production`
  releases/<sha>/       one built release per commit (last 5 kept)
  current -> releases/<sha>
  shared/api.env        backend + celery env      (root:plane 640)
  shared/live.env       live server env
  node/, bin/uv         pinned Node 22 and uv, private to Plane
  bin/deploy            deploy.sh, root-owned
  backups/              database dumps
/etc/default/silo       object storage credentials
```

## Deploys

`.github/workflows/deploy-production.yml` runs on the self-hosted runner (label `plane-prod`, user `gh-runner`) and calls `sudo -u plane /opt/plane/bin/deploy <sha>`. `deploy.sh`:

1. Refuses any commit that isn't on `origin/production`.
2. Builds the backend (`uv sync`) and frontends (`pnpm turbo build`) into `releases/<sha>`.
3. Runs migrations and instance setup.
4. Switches the `current` link and restarts `plane.target`.
5. Health-checks the API, web, admin and space, and switches back to the previous release if a check fails. Migrations are not reverted.

The runner user can do nothing else. `plane` may only run `systemctl restart plane.target` as root.

**Ship a change:** merge or push into `production`.
**Re-run or roll back:** run the workflow manually (Actions → Deploy production) on `production`, or on the server run `sudo -u plane /opt/plane/bin/deploy <older-sha-on-production>`.
**Logs:** `journalctl -u plane-api -f` (likewise `plane-worker`, `plane-beat`, `plane-space`, `plane-live`, `caddy`, `silo`).

Changes to `deploy.sh`, the systemd units or the Caddyfile only take effect after re-running `setup-host.sh`, because the installed copies are root-owned and a push can't modify them.

## First-time install

1. `sudo RUNNER_TOKEN=<token> bash deployments/native/setup-host.sh`. Installs packages, services and the runner, and pre-builds the current `production` commit. The live site is untouched.
2. `sudo bash deployments/native/import-data.sh`. Cutover: dumps the old Docker database, restores it natively, copies the uploads, starts Caddy and deploys.
3. If needed, `sudo bash deployments/native/rollback-to-docker.sh`.
