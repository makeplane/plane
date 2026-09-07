# Migrating to the restructured deployment

Three migrations live here:

- [**From the pre-rename deployment**](#from-the-pre-rename-deployment) — the stack is already
  this fork, but under the old names: `plane-db`/`plane-redis`/`plane-mq`/`plane-minio` services,
  a `plane` database owned by a `plane` role, and `deployments/virex/`. **Read this first if you
  are pulling the rename commit onto a running server.**
- [**From the previous layout of this repository**](#from-the-previous-layout) — you already run
  this fork with `docker compose -f docker-compose.yml -f deployments/hgn/docker-compose.prod.yml`.
- [**From a stock Plane install**](#from-a-stock-plane-install) — the box runs upstream Plane from
  Docker Hub images and you want this fork's data-preserving replacement.

Then: [what changed and why](#what-changed), and
[how to merge upstream afterwards](#merging-upstream-after-this-change).

---

## From the pre-rename deployment

The rename touches four things the running stack cares about: the **compose service names**, the
**Postgres role and database**, the **RabbitMQ vhost**, and the **compose project name** that
prefixes every volume. Nothing about the data changes — but the names the containers look for do,
so this has to be done in one sitting rather than discovered at `up` time.

Budget 15 minutes plus a rebuild. Do it with the stack down.

### 1. Back up, then stop

```bash
cd /opt/workspaces
deployments/workspaces/backup.sh ~/pre-rename        # or your usual backup path
docker compose down                                  # NOT down -v
```

### 2. Check the volume prefix before anything else

`COMPOSE_PROJECT_NAME` is what prefixes the volumes, and the template now pins it to
`workspaces`. Look at what is actually on disk:

```bash
docker volume ls --format '{{.Name}}' | grep -E 'pgdata|uploads'
```

- **`workspaces_pgdata`** — nothing to do. The template's value already matches. (This is the
  common case: the prefix came from the `/opt/workspaces` checkout directory.)
- **`virex_pgdata`** — either keep `COMPOSE_PROJECT_NAME=virex` in `.env` (simplest, and the
  service names still rename cleanly), or move the data to the new prefix:

  ```bash
  for v in pgdata uploads redisdata rabbitmq_data proxy_data proxy_config; do
    docker volume create "workspaces_$v"
    docker run --rm -v "virex_$v":/from -v "workspaces_$v":/to \
      alpine:3.20 sh -c 'cd /from && cp -a . /to'
  done
  ```

  Only remove the old volumes once the stack is up and verified.

### 3. Rename the Postgres role and database

The compose defaults are now `workspaces`/`workspaces`; the volume still holds `plane`/`plane`.
Both renames are metadata-only — no dump, no restore, no downtime beyond the stack being down.

Bring up just the database on its **old** credentials, then rename:

```bash
POSTGRES_USER=plane POSTGRES_DB=plane docker compose up -d workspaces-db
sleep 5

docker compose exec -T workspaces-db psql -U plane -d postgres <<'SQL'
ALTER DATABASE plane RENAME TO workspaces;
ALTER ROLE plane RENAME TO workspaces;
SQL
```

> [!IMPORTANT]
> `ALTER ROLE … RENAME TO` **clears the password if it was stored as MD5** (Postgres includes the
> role name in an MD5 hash). It prints `NOTICE: MD5 password cleared because of role rename` when
> it does. Set it again immediately, to the same `POSTGRES_PASSWORD` already in `.env`, so nothing
> else has to change:
>
> ```bash
> docker compose exec -T workspaces-db \
>   psql -U workspaces -d postgres -c "ALTER ROLE workspaces WITH PASSWORD 'THE_EXISTING_POSTGRES_PASSWORD';"
> ```

Then stop it again: `docker compose down`.

If you would rather not rename the database at all, that is supported — keep `POSTGRES_USER=plane`
and `POSTGRES_DB=plane` in `.env` and skip this step. The service is still called `workspaces-db`;
only the credentials inside the volume stay as they were.

### 4. The RabbitMQ vhost

`RABBITMQ_DEFAULT_VHOST` only creates the vhost on a **first** boot, so pointing the broker at a
`workspaces` vhost that does not exist makes every Celery connection fail. Celery queues hold
nothing that needs preserving, so the simplest fix is to discard the broker volume:

```bash
docker volume rm ${COMPOSE_PROJECT_NAME:-workspaces}_rabbitmq_data
```

Or, to keep it, create the vhost by hand instead:

```bash
docker compose up -d workspaces-mq && sleep 20
docker compose exec workspaces-mq rabbitmqctl add_vhost workspaces
docker compose exec workspaces-mq rabbitmqctl set_permissions -p workspaces workspaces '.*' '.*' '.*'
```

As with the database, keeping `RABBITMQ_VHOST=plane` in `.env` is also a valid answer.

### 5. Update `.env`

`COMPOSE_FILE` is the one line that is broken outright — `deployments/virex/` no longer exists.

| Variable                                                                       | Old                               | New                                    |
| ------------------------------------------------------------------------------ | --------------------------------- | -------------------------------------- |
| `COMPOSE_FILE`                                                                 | `…:deployments/virex/compose.yml` | `…:deployments/workspaces/compose.yml` |
| `COMPOSE_PROJECT_NAME`                                                         | `virex`                           | `workspaces` (see step 2)              |
| `APP_DOMAIN`                                                                   | `virex.hgsoftware.com.np`         | `workspaces.hgsoftware.com.np`         |
| `WEB_URL`, `APP_BASE_URL`, `ADMIN_BASE_URL`, `SPACE_BASE_URL`, `LIVE_BASE_URL` | `https://virex.…`                 | `https://workspaces.…`                 |
| `CORS_ALLOWED_ORIGINS`                                                         | `https://virex.…`                 | `https://workspaces.…`                 |
| `POSTGRES_USER`, `POSTGRES_DB`                                                 | `plane`                           | `workspaces` (only if you did step 3)  |
| `RABBITMQ_USER`, `RABBITMQ_VHOST`                                              | `plane`                           | `workspaces` (only if you did step 4)  |

Leave every secret exactly as it is. `SECRET_KEY` in particular still decrypts the instance
configuration rows.

### 6. Host nginx and DNS

`deployments/workspaces/nginx.conf` now carries `workspaces.hgsoftware.com.np` and the
`$workspaces_connection_upgrade` map. Point DNS at the box, issue the certificate, install the
file, reload:

```bash
dig +short workspaces.hgsoftware.com.np
sudo certbot --nginx -d workspaces.hgsoftware.com.np
sudo cp deployments/workspaces/nginx.conf /etc/nginx/sites-available/workspaces.conf
sudo ln -sf /etc/nginx/sites-available/workspaces.conf /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

Keep the old server block serving a redirect for as long as anyone still has the old URL.

### 7. Bring it up and verify

```bash
docker compose up -d --build
deployments/workspaces/verify.sh https://workspaces.hgsoftware.com.np
```

### 8. Re-point anything outside the stack

- **Outgoing webhooks** now send `X-Workspaces-Delivery`, `X-Workspaces-Event` and
  `X-Workspaces-Signature` instead of the `X-Plane-*` names. Any receiver that reads those headers
  — signature verification especially — must be updated, or it will silently reject every
  delivery. Check `Settings → Webhooks` for configured endpoints before you cut over.
- **Bookmarks, integrations and OAuth redirect URIs** that hard-code the old host.
- Application log files are now `workspaces-error.log` / `workspaces-debug.log`; update any log
  shipper that globs on the old names.

---

## From the previous layout

Nothing about the running stack changes: same services, same volumes, same images, same Postgres.
What changes is which files describe it and where configuration lives. Budget 20 minutes plus a
rebuild.

### 1. Back up first

```bash
cd /opt/workspaces
docker compose -f docker-compose.yml -f deployments/hgn/docker-compose.prod.yml \
  exec -T plane-db pg_dump -U plane plane | gzip > ~/pre-restructure.sql.gz
# <old-prefix> is whatever `docker volume ls` shows -- step 2 explains why it matters
docker run --rm -v <old-prefix>_uploads:/data -v ~:/backup \
  alpine:3.20 tar czf /backup/pre-restructure-uploads.tar.gz -C /data .
```

### 2. Record the project name, before anything else

**This is the step that loses data if skipped.** The volume prefix is the compose project name. It
used to come from the checkout directory; the template now pins it to `workspaces`. On a box whose
checkout already lived in `/opt/workspaces` the prefix was _already_ `workspaces`, so the pinned
value matches and nothing moves — but do not assume it. If the prefix on disk is anything else and
you start with the template unedited, Compose looks for `workspaces_pgdata`, finds nothing, creates
it empty, and the stack comes up as a brand-new install with every project and user apparently
gone. The data is still there, under the old prefix, but nothing is reading it.

So look first:

```bash
docker volume ls --format '{{.Name}}' | grep -E 'pgdata|uploads'
# workspaces_pgdata
# workspaces_uploads      ← prefix is "workspaces": matches the template, nothing to do
```

Whatever that prefix is, `COMPOSE_PROJECT_NAME` in the new `.env` must equal it. Set it before the
first `up`, not after. Renaming volumes afterwards is possible but means a dump and restore.

Only a genuinely fresh install should assume the template's `workspaces` without checking.

### 3. Keep the old secrets

`SECRET_KEY` in particular: it decrypts the instance configuration rows in the database. A new one
invalidates every session and breaks the stored SMTP and OAuth settings.

```bash
grep -E '^(SECRET_KEY|POSTGRES_PASSWORD|RABBITMQ_PASSWORD|AWS_ACCESS_KEY_ID|AWS_SECRET_ACCESS_KEY|LIVE_SERVER_SECRET_KEY|ODOO_BASE_URL|ODOO_API_KEY)=' \
  .env apps/api/.env > ~/old-secrets.txt
cat ~/old-secrets.txt
```

`LIVE_SERVER_SECRET_KEY` will not be there — the old layout never passed one to the live server,
which is why collaborative editing did not work. Generate a fresh one; nothing depends on its
previous value.

### 4. Stop the stack and pull

```bash
docker compose -f docker-compose.yml -f deployments/hgn/docker-compose.prod.yml down
mv .env .env.pre-restructure          # keep it until the new stack is verified
git pull
```

### 5. Write the new `.env`

```bash
deployments/workspaces/init-env.sh your.real.domain
```

Then carry the old values across, editing `.env`:

| Copy from                                                | Into `.env`            |
| -------------------------------------------------------- | ---------------------- |
| old `apps/api/.env` `SECRET_KEY`                         | `SECRET_KEY`           |
| old `.env` `POSTGRES_PASSWORD`                           | `POSTGRES_PASSWORD`    |
| old `.env` `RABBITMQ_PASSWORD`                           | `RABBITMQ_PASSWORD`    |
| old `.env` `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` | the same two           |
| old `apps/api/.env` `ODOO_BASE_URL` / `ODOO_API_KEY`     | the same two           |
| the prefix from step 2                                   | `COMPOSE_PROJECT_NAME` |
| old `.env` `LISTEN_HTTP_PORT`                            | `LISTEN_HTTP_PORT`     |

The Postgres, RabbitMQ and MinIO passwords must match what is already inside the volumes, or those
services reject the credentials on start-up.

Two values are _not_ carried over, because their old values were wrong:

- **`TRUSTED_PROXIES`** was `0.0.0.0/0`. The template ships `private_ranges`, which is correct
  behind the host nginx and stops clients spoofing their own IP.
- **`CORS_ALLOWED_ORIGINS`** and the five `*_BASE_URL` values are now derived from `APP_DOMAIN`.
  Check the derived values look right rather than pasting the old ones.

`apps/api/.env` is no longer read in production. Leave it for development or delete it; the
production stack does not look at it.

### 6. Start and verify

```bash
docker compose up -d --build
deployments/workspaces/verify.sh https://your.real.domain
```

Note there are no `-f` flags: `COMPOSE_FILE` in `.env` supplies them.

`verify.sh` should report 0 failures. If it reports that the proxy is not on loopback, or that
`workspaces-db` holds unrelated secrets, `COMPOSE_FILE` is not being picked up — check you are in the
repository root and that `.env` has all three files listed.

### 7. Update the host nginx

The vhost template was renamed and gained gzip and a hardened upgrade map. Your installed copy
still works, so this is optional, but the new one is what the guide describes:

```bash
sudo cp deployments/workspaces/nginx.conf /etc/nginx/sites-available/workspaces.conf
sudo ln -sf /etc/nginx/sites-available/workspaces.conf /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/workspaces.conf   # the old symlink, if you had one
sudo nginx -t && sudo systemctl reload nginx
```

If you previously put the `map $http_upgrade $connection_upgrade` block in
`/etc/nginx/conf.d/upgrade-map.conf`, the new vhost no longer needs it — it declares its own map
under a vhost-specific name. Leaving the old file in place is harmless unless another site uses it.

### 8. Clean up

Once `verify.sh` passes and someone has signed in:

```bash
rm ~/old-secrets.txt .env.pre-restructure
```

### Rolling back

```bash
git checkout <the commit before the restructure>
mv .env.pre-restructure .env
docker compose -f docker-compose.yml -f deployments/hgn/docker-compose.prod.yml up -d --build
```

The volumes are untouched throughout, so this loses nothing.

---

## From a stock Plane install

The box runs upstream Plane (Docker Hub images, most likely installed by upstream's `setup.sh`) and
you want this fork instead, keeping the data.

### 1. Survey what is there

```bash
deployments/workspaces/inspect-existing.sh          # assumes /opt/plane
OLD_DIR=/var/plane deployments/workspaces/inspect-existing.sh
```

Read-only: it changes nothing. Three things in its output decide whether this is possible:

- **Postgres major version** must be 15, matching `postgres:15.7-alpine`. A 14 or 16 install needs
  a dump-and-restore across versions, not a volume reuse.
- **The last applied `db` migration** must be at or below this fork's latest (the script prints
  both). Upstream ahead of the fork means the fork's code would run against a newer schema.
- **`SECRET_KEY`** must be recoverable from the old env file. Without it the encrypted instance
  configuration rows are unreadable and the instance has to be reconfigured by hand.

### 2. Dump, don't share volumes

Point the new stack at a _copy_, so the old install stays bootable if you need to fall back.

```bash
OLD_DB=$(docker ps --format '{{.Names}}' | grep -E 'plane.*db|db.*plane' | head -1)
docker exec -t "$OLD_DB" pg_dump -U plane -d plane --no-owner --no-privileges | gzip > ~/stock-plane.sql.gz
docker run --rm -v <old_project>_uploads:/data -v ~:/backup \
  alpine:3.20 tar czf /backup/stock-uploads.tar.gz -C /data .
```

### 3. Stop the old stack and free the ports

```bash
cd /opt/plane && docker compose down          # or the old install's own command
```

Keep its volumes. Do not `down -v`.

### 4. Install this fork

Follow [`DEPLOYMENT.md`](../../DEPLOYMENT.md) §2 through §4, with one change in §3: after
`init-env.sh`, replace the generated `SECRET_KEY` with the old install's, and set
`COMPOSE_PROJECT_NAME` to something _different_ from the old prefix so the two sets of volumes
cannot collide.

### 5. Load the data, then start the rest

```bash
docker compose up -d workspaces-db workspaces-minio
gunzip -c ~/stock-plane.sql.gz | docker compose exec -T workspaces-db psql -U workspaces -d workspaces
docker run --rm -v ${COMPOSE_PROJECT_NAME}_uploads:/data -v ~:/backup \
  alpine:3.20 tar xzf /backup/stock-uploads.tar.gz -C /data

docker compose up -d --build       # migrator brings the schema up to 0123
deployments/workspaces/verify.sh https://your.real.domain
```

### 6. Apply the Engineering Operations workflow

The migration creates the tables; the bootstrap creates the workflow the dashboards are phrased in.
Skip it and everything loads, nothing errors, and every number is zero. See
[`DEPLOYMENT.md` §7a](../../DEPLOYMENT.md#7a-apply-the-workflow-to-your-workspace).

---

## What changed

### Deleted

**Deployment paths that could only ever install stock Plane.** Each assembles or downloads
`makeplane/*` images published from upstream's Docker Hub account. This fork's code is not in those
images and the fork publishes none of its own, so none of these could deploy it.

| Path                                               | What it was                                                                                                                                            | Why it is gone                                                                                                                                                                                                                                                                       |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `deployments/cli/**` (14 files)                    | Upstream's interactive installer: `install.sh`, a compose file of `makeplane/*` images, `variables.env`, restore scripts, a README and its screenshots | Downloads its compose file and env template from `github.com/makeplane/plane` releases and pulls upstream images. `build.yml`'s `context: ../../` resolved to `<repo>/deployments`, which has no `apps/`, so its build-locally branch could not work from either location it is used |
| `deployments/aio/**` (6 files)                     | All-in-one single-container image                                                                                                                      | Its Dockerfile's only sources are `makeplane/plane-*:${PLANE_VERSION}`. There is no build-from-source stage                                                                                                                                                                          |
| `deployments/swarm/**`                             | `swarm.sh`, Docker Swarm deployment                                                                                                                    | Downloads upstream's compose file and runs `docker stack deploy`. This fork targets single-host Compose behind nginx                                                                                                                                                                 |
| `deployments/kubernetes/**`                        | A five-line README                                                                                                                                     | Links to upstream's Helm chart on Artifact Hub, which deploys `makeplane/*` images                                                                                                                                                                                                   |
| `apps/proxy/Caddyfile.aio.ce`                      | Caddyfile for the AIO image                                                                                                                            | Its only consumer was `deployments/aio/community/build.sh`                                                                                                                                                                                                                           |
| `deployments/cli/community/restore.sh`             | Volume restore                                                                                                                                         | Hard-codes the `plane-app` project prefix, so it exits 1 before doing anything on this fork's volumes                                                                                                                                                                                |
| `deployments/cli/community/restore-airgapped.sh`   | Restore for Plane's commercial air-gapped edition                                                                                                      | A product this fork does not ship, and broken as shipped: line 2 is `+set -euo pipefail`, and its quoted glob makes the loop iterate the literal string `*.tar.gz`                                                                                                                   |
| `deployments/cli/community/migration-0.13-0.14.sh` | One-time v0.13.2 → v0.14 volume migration                                                                                                              | The fork is at 1.4.2                                                                                                                                                                                                                                                                 |

Replacement for the two useful ones: `deployments/workspaces/backup.sh`, and the restore procedure in
[`DEPLOYMENT.md` §9](../../DEPLOYMENT.md#restoring-a-backup) — both keyed on
`COMPOSE_PROJECT_NAME` rather than a hard-coded prefix.

**Image-publishing CI.**

| File                                       | Why it is gone                                                                                                                                                                                                                               |
| ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `.github/workflows/build-branch.yml`       | Publishes `makeplane/*` images to upstream's Docker Hub, needs `DOCKERHUB_*` secrets the fork does not have, and triggers on push to `preview` — the fork's working branch. Half its jobs referenced `deployments/aio` and `deployments/cli` |
| `.github/workflows/feature-deployment.yml` | Builds `./aio/Dockerfile-app`, a path that does not exist in the repository, and deploys via Helm to upstream's Tailscale-reachable preview cluster                                                                                          |

The other seven workflows — lint, types, CodeQL, i18n, copyright, react-doctor, check-version — are
untouched. If a fork-owned image pipeline is ever wanted, `build-branch.yml` is the template and is
one `git show` away.

**Superseded by this restructure.**

| File                                      | Replaced by                                                                                                                                                                                                                                                                                                 |
| ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `deployments/hgn/` (the whole directory)  | `deployments/workspaces/` — the project is Workspaces, and the edge overlay is named for the site it serves rather than the organisation                                                                                                                                                                    |
| `deployments/hgn/docker-compose.prod.yml` | `deployments/production/compose.yml` (how it runs safely) + `deployments/workspaces/compose.yml` (where traffic enters)                                                                                                                                                                                     |
| `deployments/hgn/nginx-workspaces.conf`   | `deployments/workspaces/nginx.conf` — renamed, plus gzip, HSTS and a vhost-scoped upgrade map                                                                                                                                                                                                               |
| `deployments/hgn/DEPLOYMENT.md`           | Folded into `DEPLOYMENT.md`. About half of it duplicated the root guide verbatim, its own preamble declared two sections out of date, it described the overlay as only a port change when it also carried the health checks, and it linked `../../deployment.md`, which 404s on a case-sensitive filesystem |
| `Deployment.md`                           | `DEPLOYMENT.md` — a case rename, matching `README.md`, `CONTRIBUTING.md`, `AGENTS.md`. **On a case-insensitive checkout (macOS, Windows) this arrives as a rename git may not apply cleanly** — if `git pull` leaves both or neither, `git checkout -- DEPLOYMENT.md`                                       |

**Dead configuration.**

| File                                                                                                            | Why it is gone                                                                                                                                                                                                                                  |
| --------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/space/nginx/nginx.conf`                                                                                   | No Dockerfile copies it. `apps/space/Dockerfile.space` serves the app with `react-router-serve`                                                                                                                                                 |
| `apps/web/Dockerfile.dev`, `apps/admin/Dockerfile.dev`, `apps/space/Dockerfile.dev`, `apps/live/Dockerfile.dev` | No compose file, workflow or document references any of them. `CONTRIBUTING.md` runs the frontends with `pnpm dev` on the host. `apps/api/Dockerfile.dev` is kept — it is used by both `docker-compose-local.yml` and `docker-compose-test.yml` |
| `.idx/dev.nix`                                                                                                  | Unreferenced Google Project IDX config pinning Node 20 against the repository's Node 22 (`.node-version`, `package.json`)                                                                                                                       |

### Modified

| File                                         | Change                                                                                                                                                                                                                                                                                                                                                    | Why                                                                                                                                                                                            |
| -------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `docker-compose.yml`                         | Rewritten: one anchor for the four Django roles instead of four copies; explicit environment for `live`, `proxy`, `workspaces-db`, `workspaces-mq`, `workspaces-minio`; all seven Caddy variables; fail-fast `${VAR:?}` on the six secrets; MinIO pinned to `RELEASE.2025-09-07T16-13-09Z`; `proxy_data`/`proxy_config` volumes; `container_name` dropped | The base file both duplicated blocks and starved three containers of their configuration. Detail in [architecture.md](architecture.md#rewriting-the-root-compose-file-rather-than-patching-it) |
| `apps/proxy/Caddyfile.ce`                    | Inline defaults on `FILE_SIZE_LIMIT`, `BUCKET_NAME` and `SITE_ADDRESS`; `caddy fmt`                                                                                                                                                                                                                                                                       | Without the `SITE_ADDRESS` default the config is rejected outright — the outage that started this. `caddy fmt` silences a warning Caddy logs on every boot                                     |
| `.env.example`                               | One line: `LIVE_SERVER_SECRET_KEY`                                                                                                                                                                                                                                                                                                                        | The base compose file now requires it; the live server exits without it                                                                                                                        |
| `apps/api/.env.example`                      | Comment text only                                                                                                                                                                                                                                                                                                                                         | It asserted that Compose never expands `${…}` inside an `env_file`. That is false on Compose 2.24+. The advice it justified is still correct, for a different reason                           |
| `deployments/workspaces/inspect-existing.sh` | Derives the fork's latest migration instead of hard-coding `0122`; header points at this guide                                                                                                                                                                                                                                                            | It was stale by one migration on the day it was written, and no document told anyone when to run it                                                                                            |

### Added

| File                                  | Purpose                                                                                                                  |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `deployments/production/compose.yml`  | Health checks, start-up ordering, log rotation                                                                           |
| `deployments/workspaces/compose.yml`  | Caddy on loopback, `TRUSTED_PROXIES=private_ranges`                                                                      |
| `deployments/workspaces/.env.example` | The production configuration template — the single source of truth                                                       |
| `deployments/workspaces/init-env.sh`  | Generates `.env`: fills the domain, generates six secrets, `chmod 600`, checks the Compose version, validates the result |
| `deployments/workspaces/verify.sh`    | The regression checklist, executable. 51 checks; exit code is the failure count                                          |
| `deployments/workspaces/backup.sh`    | Postgres dump + uploads tar, checksummed and rotated                                                                     |
| `deployments/workspaces/nginx.conf`   | Host nginx vhost, validated against nginx 1.24 and 1.28                                                                  |
| `DEPLOYMENT.md`                       | The one deployment guide                                                                                                 |
| `docs/deployment/architecture.md`     | Why the files look like this                                                                                             |
| `docs/deployment/migration.md`        | This document                                                                                                            |

---

## Merging upstream after this change

Add the upstream remote once:

```bash
git remote add upstream https://github.com/makeplane/plane.git
git fetch upstream
```

Then a merge behaves as follows.

**Deleted directories come back as modify/delete conflicts** whenever upstream edits them. Expect
this for `deployments/cli/**`, `deployments/aio/**` and `.github/workflows/build-branch.yml`,
which upstream touches regularly. The resolution is always the same:

```bash
git rm -r deployments/cli deployments/aio deployments/swarm deployments/kubernetes
git rm .github/workflows/build-branch.yml .github/workflows/feature-deployment.yml
git rm apps/proxy/Caddyfile.aio.ce apps/space/nginx/nginx.conf
git rm apps/web/Dockerfile.dev apps/admin/Dockerfile.dev apps/space/Dockerfile.dev apps/live/Dockerfile.dev
```

**Two files will genuinely conflict** and need reading: `docker-compose.yml` and
`apps/proxy/Caddyfile.ce`. Upstream has touched the compose file once since 2025-09 and the
Caddyfile four times, so this is rare but real. When resolving the Caddyfile, keep the `{$VAR:default}`
forms; when resolving the compose file, keep the anchor and the explicit `environment` blocks, and
check whether upstream added a service that needs adding to both overlays.

**Then re-run the gate.** Every one of these should pass before the merge is committed:

```bash
docker compose config --quiet                                    # production chain
docker compose -f docker-compose.yml config --quiet              # base alone
docker compose -f docker-compose-local.yml config --quiet        # dev
docker compose -f docker-compose-test.yml config --quiet         # test
docker run --rm -v "$PWD/apps/proxy/Caddyfile.ce:/c:ro" caddy:2.11-alpine \
  caddy validate --config /c --adapter caddyfile                 # with no environment at all
docker compose up -d --build && deployments/workspaces/verify.sh https://your.domain
```

The Caddy check with an empty environment is the one that would have caught the original outage.
