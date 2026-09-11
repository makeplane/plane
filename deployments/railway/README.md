# Railway

Per-service Railway config-as-code for deploying this repository. Railway builds
one service per config file; there is no single root `railway.json` on purpose,
because connecting the repo to a service without one makes Railway detect the
pnpm workspace and run `turbo run start` for every app inside one container.

## Services

Each service points at the same GitHub repo and branch. Set these in the
service's **Settings**:

| Service     | Root directory | Config file path                       | Listens on |
| ----------- | -------------- | -------------------------------------- | ---------- |
| proxy       | `/`            | `deployments/railway/proxy.json`       | `$PORT`    |
| web         | `/`            | `deployments/railway/web.json`         | 3000       |
| admin       | `/`            | `deployments/railway/admin.json`       | 3000       |
| space       | `/`            | `deployments/railway/space.json`       | 3000       |
| live        | `/`            | `deployments/railway/live.json`        | `$PORT`    |
| api         | `apps/api`     | `deployments/railway/api.json`         | `$PORT`    |
| worker      | `apps/api`     | `deployments/railway/worker.json`      | none       |
| beat-worker | `apps/api`     | `deployments/railway/beat-worker.json` | none       |

The `api`, `worker` and `beat-worker` services share `Dockerfile.api`, whose
build context is `apps/api` (it copies `./bin`), so their root directory must
be `apps/api`. Every other Dockerfile copies paths relative to the repository
root, so those services keep `/`.

If Railway cannot find a config file for a service whose root directory is
`apps/api`, the path is being resolved relative to that directory; use the
equivalent manual settings instead:

| Service     | Dockerfile path  | Start command                        | Pre-deploy command                     |
| ----------- | ---------------- | ------------------------------------ | -------------------------------------- |
| api         | `Dockerfile.api` | (image default)                      | `./bin/docker-entrypoint-migrator.sh`  |
| worker      | `Dockerfile.api` | `./bin/docker-entrypoint-worker.sh`  |                                        |
| beat-worker | `Dockerfile.api` | `./bin/docker-entrypoint-beat.sh`    |                                        |

Migrations run as the API's pre-deploy command. The API, worker and beat
entrypoints all block on `wait_for_migrations`, so without it every one of them
hangs at boot.

## Public traffic

Only `proxy` gets a public domain. It reaches the other services over the
project's private network; set these variables on it (see
`apps/proxy/Caddyfile.railway.ce`):

```
WEB_ENDPOINT=web.railway.internal:3000
ADMIN_ENDPOINT=admin.railway.internal:3000
SPACES_ENDPOINT=space.railway.internal:3000
LIVE_ENDPOINT=live.railway.internal:3000
API_ENDPOINT=api.railway.internal:8000
BUCKET_ENDPOINT=bucket.railway.internal:9000
BUCKET_NAME=uploads
```

Adjust the hostnames to your service names and set `PORT=3000` on `live` and
`PORT=8000` on `api` so the ports above hold. `web`, `admin` and `space` listen
on 3000 regardless of `PORT`.

The web, admin and space bundles are built with empty `VITE_*_BASE_URL` build
args, so they call `<origin>/api`, `<origin>/god-mode`, `<origin>/spaces` and
`<origin>/live`. That only works when a single origin fronts everything, which
is what the proxy provides. Do not give `web`, `admin` or `space` their own
public domains.
