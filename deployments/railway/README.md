# Railway

How the `Plane Deck` Railway project is wired to this repository. Railway has
deprecated config-as-code (`railway.json`), so these settings live in each
service's dashboard settings; this file is the record of them. The successor is
Infrastructure as Code (`.railway/railway.ts`, applied with
`railway config apply`), which can adopt these services by name later.

Every app service is connected to the same repo and branch. Connecting a
service to the repo with no Dockerfile path makes Railway detect the pnpm
workspace and run `turbo run start` for every app inside one container, so
the Dockerfile path must be set before the first deploy.

## Services

| Service     | Root directory | Dockerfile path                   | Start command                       | Pre-deploy command                    | Healthcheck       |
| ----------- | -------------- | --------------------------------- | ----------------------------------- | ------------------------------------- | ----------------- |
| Proxy       | `/`            | `apps/proxy/Dockerfile.railway.ce`| (image default)                     |                                       | `/api/instances/` |
| Web         | `/`            | `apps/web/Dockerfile.web`         | (image default)                     |                                       | `/`               |
| Admin       | `/`            | `apps/admin/Dockerfile.admin`     | (image default)                     |                                       |                   |
| Space       | `/`            | `apps/space/Dockerfile.space`     | (image default)                     |                                       | `/spaces/`        |
| Live        | `/`            | `apps/live/Dockerfile.live`       | (image default)                     |                                       |                   |
| API         | `apps/api`     | `Dockerfile.api`                  | (image default)                     | `./bin/docker-entrypoint-migrator.sh` | `/api/instances/` |
| Worker      | `apps/api`     | `Dockerfile.api`                  | `./bin/docker-entrypoint-worker.sh` |                                       |                   |
| Beat Worker | `apps/api`     | `Dockerfile.api`                  | `./bin/docker-entrypoint-beat.sh`   |                                       |                   |

`Dockerfile.api` copies `./bin`, so its build context is `apps/api` and the
three services that use it need that root directory. Every other Dockerfile
copies paths relative to the repository root.

Migrations run as the API's pre-deploy command. The API, worker and beat
entrypoints all block on `wait_for_migrations`, so without it every one of them
hangs at boot.

Railway rejects BuildKit cache mounts unless their id carries the literal
service id, and variables are not allowed in the id, so the Dockerfiles carry
no `--mount=type=cache` flags.

## Variables that matter

Railway's private network is IPv6-only. The API entrypoint binds gunicorn to
`BIND_HOST`, which is `[::]` on Railway; the other apps already listen on all
interfaces.

Only `Proxy` has a public domain. It reaches the other services over the
private network through these variables (see
`apps/proxy/Caddyfile.railway.ce`):

```
WEB_ENDPOINT=http://web.railway.internal:3000
ADMIN_ENDPOINT=http://admin.railway.internal:3000
SPACES_ENDPOINT=http://space.railway.internal:3001
LIVE_ENDPOINT=http://live.railway.internal:3000
API_ENDPOINT=http://api.railway.internal:8000
BUCKET_ENDPOINT=http://bucket.railway.internal:9000
BUCKET_NAME=uploads
```

Space listens on its `PORT` variable (3001); Web and Admin listen on 3000
regardless of `PORT`. Live needs `LIVE_BASE_PATH=/live`,
`LIVE_SERVER_SECRET_KEY` (a reference to the API's `SECRET_KEY`),
`API_BASE_URL` and `REDIS_URL`.

The web, admin and space bundles are built with empty `VITE_*_BASE_URL` build
args, so they call `<origin>/api`, `<origin>/god-mode`, `<origin>/spaces` and
`<origin>/live`. That only works when a single origin fronts everything, which
is what the proxy provides. Do not give Web, Admin or Space their own public
domains.

## Static asset rate limit

The Web and Admin images rate-limit static requests per client IP in their
Caddyfiles. The default ceiling is 3000 requests per minute; the upstream value
of 300 is low enough that a single browser loading the SPA trips it and gets
429 responses. Override with the `RATE_LIMIT_EVENTS` and `RATE_LIMIT_WINDOW`
service variables on Web and Admin if a different ceiling is wanted.

## File uploads

Uploads never pass through the API. The API answers `/api/assets/...` with a
presigned POST whose URL is built from the `Host` header it received, and the
browser posts the file straight to `<that host>/uploads`. The proxy therefore
passes the client `Host` through to every upstream (no `header_up Host`), and
routes both `/uploads` (the POST target) and `/uploads/*` (object reads) to the
Bucket service. The same `Host` rule keeps OAuth callback URLs correct.

The API service still carries a set of `S3_*` variables pointing at a
Cloudflare R2 bucket. Plane reads only the `AWS_*` variables, so those are
unused unless the storage settings are changed to consume them.
