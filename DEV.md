# Local development

Notes for hacking on this fork locally. Upstream's flow is in
`CONTRIBUTING.md`; this file documents the deltas plus the helper
scripts we ship.

## Layout

|                                     | Where it runs                                                           | Why                                                                                          |
| ----------------------------------- | ----------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| postgres / redis / rabbitmq / minio | docker (via `docker-compose-local.yml` + `docker-compose.override.yml`) | upstream-default backing services; we just remap ports to dodge collisions                   |
| api / worker / beat / migrator      | host (PyCharm Django run config)                                        | so PyCharm's normal Django debugger Just Works — remote pydevd inside docker was too fragile |
| web / admin / space / live          | host (`pnpm dev` via `zstart`)                                          | Vite HMR, fast iteration                                                                     |

## One-time setup

```bash
brew install python@3.12 pnpm uv
./zstart                 # generates .env files + brings up everything
./zstart deps            # if you only want backing services (PyCharm runs api)
```

`zstart` is idempotent. Re-run it anytime.

## Day-to-day

```bash
./zstart                 # everything (deps in docker, frontends via pnpm)
./zstart status          # what's running
./zstart logs api        # docker logs for one service
./zstart logs frontends  # tail pnpm dev log
./zstart restart api     # restart api container (host-mode: just rerun PyCharm)
./zstart shell api       # bash into api container
./zstart stop            # stop everything
```

## Ports

| Port        | Service                    | Source of truth           |
| ----------- | -------------------------- | ------------------------- |
| 3000        | web                        | Vite                      |
| 3001        | admin (god-mode)           | Vite                      |
| 3002        | space                      | Vite                      |
| 3100        | live                       | Vite                      |
| 5432        | postgres                   | docker                    |
| 5672        | rabbitmq                   | docker (override exposes) |
| 6479        | redis (remapped from 6379) | docker (override)         |
| 8800        | host-mode Django api       | PyCharm run config        |
| 9000 / 9090 | minio / minio console      | docker                    |

## PyCharm Django run config

| Field              | Value                                                           |
| ------------------ | --------------------------------------------------------------- |
| Working directory  | `apps/api`                                                      |
| Python interpreter | `apps/api/.venv/bin/python`                                     |
| Host / Port        | `0.0.0.0` / `8800`                                              |
| Env file           | `apps/api/.env`                                                 |
| Settings module    | (left blank — set via `DJANGO_SETTINGS_MODULE` in the env file) |

The env file declares `DJANGO_SETTINGS_MODULE=plane.settings.local`
plus all DB/Redis/MQ/CORS values, so the run config picks it up without
extra wiring.

## What `./zfix-env` does

Plane's `setup.sh` writes `.env` files using docker-network hostnames
(`plane-db`, `plane-redis`, `plane-mq`) and bash `${...}`-interpolated
URLs. PyCharm/Django read .env without shell interpolation, so we
patch:

- `POSTGRES_HOST`, `REDIS_HOST`, `RABBITMQ_HOST` → `localhost`
- `REDIS_PORT` → `6479` (matches override)
- `DATABASE_URL` and `REDIS_URL` → literal strings (no `${VAR}`)
- frontend `VITE_API_BASE_URL` → `http://localhost:8800`
- ensures `DJANGO_SETTINGS_MODULE=plane.settings.local` is set

`zstart` runs this automatically; you only need it directly if you
re-ran `setup.sh` and want the patches reapplied.

## Bootstrap: register the instance

After the first `./zstart`, the Django api needs an `Instance` row
before god-mode will render anything but a spinner. `zstart` runs
this for you, but if you ever need to do it by hand:

```bash
cd apps/api
.venv/bin/python manage.py register_instance "local-dev-machine"
```

Then visit http://localhost:3001/god-mode/ to create the first admin.

## Why we patched `apps/admin/vite.config.ts`

`@base-ui-components/react/toast` (used via `@plane/propel`) breaks
esbuild's dep optimizer — vite logs _"file does not exist in optimize
deps directory"_ and the route 504s. Excluding via `optimizeDeps.exclude`
falls back to native ESM and the toast loads.

If new transitive deps cause similar 504s, add them to the same array.

## Why some 504s feel sticky

When vite re-optimizes (a new transitive dep gets discovered → cache
file changes → hash bumps), in-flight HTML in the browser references
the old hash and 504s on dep requests. Hard refresh in Chrome works;
**Safari** sometimes doesn't pick up the new manifest. Use Chrome for
local dev.

## What's _not_ in our setup

- Docker-side api/worker/beat/migrator (runs on host)
- The proxy container (hit each Vite server directly: 3000/3001/3002/3100)
- pydevd-pycharm running inside the api container (host-mode is simpler)
