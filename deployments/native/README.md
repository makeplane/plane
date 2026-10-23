# Native (systemd) deployment

Runs Plane directly on an Ubuntu 24.04 host, without Docker, and redeploys on every push to `production`.

| Piece                                               | Runs as                      | Listens on                            |
| --------------------------------------------------- | ---------------------------- | ------------------------------------- |
| Caddy (`caddy`)                                     | caddy                        | `:3356` (behind the TLS terminator)   |
| API, gunicorn (`plane-api`)                         | plane                        | `127.0.0.1:8100`                      |
| Celery worker / beat (`plane-worker`, `plane-beat`) | plane                        | –                                     |
| Space SSR (`plane-space`)                           | plane                        | `127.0.0.1:3102`                      |
| Live (`plane-live`)                                 | plane                        | `127.0.0.1:3100`                      |
| Web, admin                                          | static files served by Caddy | –                                     |
| PostgreSQL 18, Redis, RabbitMQ                      | packages                     | localhost                             |
| Silo, an S3-compatible MinIO fork (`silo`)          | silo                         | `127.0.0.1:9100` (console on `:9101`) |

## Layout

```
/opt/plane/
  repo.git/             bare mirror of origin, fetches only `production`
  releases/<sha>/       one built release per commit (last 5 kept)
  releases/current      -> <sha>, switched by each deploy
  current -> releases/current   (fixed, root-owned; what systemd and Caddy use)
  shared/api.env        backend + celery env      (root:plane 640)
  shared/live.env       live server env
  node/, bin/uv         pinned Node 22 and uv, private to Plane
  bin/deploy            deploy.sh, root-owned
  backups/              database dumps
/etc/default/silo       object storage credentials
```

## Deploys

`.github/workflows/deploy-production.yml` runs on a GitHub-hosted runner and connects over SSH as `plane-ci`, sending only the commit sha. That key is pinned in `authorized_keys` to `/opt/plane/bin/ci-deploy`, which runs `sudo -u plane /opt/plane/bin/deploy <sha>`. `deploy.sh`:

1. Refuses any commit that isn't on `origin/production`.
2. Builds the backend (`uv sync`) and frontends (`pnpm turbo build`) into `releases/<sha>`.
3. Runs migrations and instance setup.
4. Switches the `current` link and restarts `plane.target`.
5. Health-checks the API, web, admin and space, and switches back to the previous release if a check fails. Migrations are not reverted.

The CI key can do nothing else. `plane` may only run `systemctl restart plane.target` as root.

**Ship a change:** merge or push into `production`.
**Re-run or roll back:** run the workflow manually (Actions → Deploy production) on `production`, or on the server run `sudo -u plane /opt/plane/bin/deploy <older-sha-on-production>`.
**Logs:** `journalctl -u plane-api -f` (likewise `plane-worker`, `plane-beat`, `plane-space`, `plane-live`, `caddy`, `silo`).

Changes to `deploy.sh`, the systemd units or the Caddyfile only take effect after re-running `setup-host.sh`, because the installed copies are root-owned and a push can't modify them.

## First-time install

1. `sudo bash deployments/native/setup-host.sh`. Installs packages and services, creates the CI deploy key, and pre-builds the current `production` commit. The live site is untouched. It ends by printing the four `DEPLOY_SSH_*` repo secrets to add on GitHub.
2. `sudo bash deployments/native/import-data.sh`. Cutover: dumps the old Docker database, restores it natively, copies the uploads, starts Caddy and deploys.
3. If needed, `sudo bash deployments/native/rollback-to-docker.sh`.
