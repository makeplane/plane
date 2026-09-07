# Deployment architecture

Why the deployment files look the way they do. [`DEPLOYMENT.md`](../../DEPLOYMENT.md) is the
operator's guide; this document is the reasoning behind it, for whoever has to change it or merge
upstream Plane into it.

---

## The problem this solves

This repository is a fork of [makeplane/plane](https://github.com/makeplane/plane). Upstream ships
five deployment paths — a build-from-source compose file, a CLI installer, an all-in-one image, a
Swarm script, and a Helm chart — and four of them deploy `makeplane/*` images published from
upstream's Docker Hub account. **This fork's code is not in those images**, so four of the five
could never deploy it. They nevertheless contributed environment templates, compose files and
scripts that looked authoritative, which is how the configuration drifted apart.

The concrete failure was in the proxy. `apps/proxy/Caddyfile.ce` ends with:

```caddyfile
{$SITE_ADDRESS} {
	import workspaces_proxy
}
```

The root compose file passed the proxy container exactly two variables, `FILE_SIZE_LIMIT` and
`BUCKET_NAME`. With `SITE_ADDRESS` absent the site block has no address, which makes it a second
key-less block after the global options block, and Caddy refuses the whole configuration:

```text
Error: adapting config using caddyfile: server block without any key is global
configuration, and if used, it must be first
```

Upstream's CLI compose file passed all seven proxy variables through a YAML anchor and so never hit
this. The build-from-source path — the only one this fork can use — passed two. That gap is the
shape of the whole problem: **the deployment path the fork actually uses was the least maintained
one**, because upstream's attention went to the image-based paths.

Three more instances of the same gap, all found while fixing the first:

- The `live` service received **no** environment at all. `apps/live/src/env.ts` validates its
  environment with zod and calls `process.exit(1)` when `API_BASE_URL` or `LIVE_SERVER_SECRET_KEY`
  is missing, so collaborative editing could never have worked in this deployment path.
- `workspaces-db` and `workspaces-mq` were handed the entire root `.env` via `env_file`, so the database
  container held the MinIO credentials and the ACME settings.
- Nothing in the repository recorded that production needs two compose files. The guide told the
  operator to define a shell alias.

---

## The design

Three compose files, one environment file, one command.

```text
docker-compose.yml                      base    what exists, how it builds, what each container gets
  + deployments/production/compose.yml  prod    health checks, ordering, log rotation
  + deployments/workspaces/compose.yml         edge    Caddy on loopback, trust the host nginx
```

Each file answers exactly one question, and the questions are independent:

| File                                 | Question                     | Would change if…                                             |
| ------------------------------------ | ---------------------------- | ------------------------------------------------------------ |
| `docker-compose.yml`                 | What is this system made of? | a service is added, or an image changes                      |
| `deployments/production/compose.yml` | How does it run safely?      | a health check or start-up dependency changes                |
| `deployments/workspaces/compose.yml` | Where does traffic enter?    | the edge changes (a second site, a different TLS terminator) |

The split is by _reason to change_, not by environment. That is why the production overlay carries
no site-specific detail: a second deployment of this fork on a different edge reuses it unchanged
and writes only its own edge file.

### One obvious entry point

`.env` carries `COMPOSE_FILE`, so the file chain is a property of the checkout rather than of one
operator's shell:

```dotenv
COMPOSE_FILE=docker-compose.yml:deployments/production/compose.yml:deployments/workspaces/compose.yml
COMPOSE_PATH_SEPARATOR=:
COMPOSE_PROJECT_NAME=workspaces
```

Every documented command is then plain `docker compose …`. This matters more than it looks: the
previous entry point was a `dcw` alias appended to one user's `~/.bashrc`, which is unavailable to
cron, systemd, `sudo`, a second operator, and any script — and Ubuntu's default `.bashrc` returns
early for non-interactive shells, so even `ssh host 'dcw ps'` would fail. An alias also fails
_open_: `docker compose up -d` without it silently starts the base file alone, and Caddy takes
ports 80 and 443 away from nginx.

`COMPOSE_PROJECT_NAME` is pinned for a related reason. Without it the project name comes from the
directory, so a checkout in `/opt/workspaces-new` addresses different volumes than one in
`/opt/workspaces` — a rename or a re-clone silently starts with an empty database.

An explicit `-f` still wins over `COMPOSE_FILE`, which is what keeps the development and test
stacks working on a server whose `.env` is the production one.

Setting `COMPOSE_FILE` has a second effect worth knowing: it also **suppresses the automatically
loaded `docker-compose.override.yml`**. That file does not exist in this repository, and with
`COMPOSE_FILE` set it could not take effect if someone added one — verified:

| Situation                                    | What loads                        |
| -------------------------------------------- | --------------------------------- |
| No `COMPOSE_FILE`, an override file present  | base **+ the override, silently** |
| `COMPOSE_FILE` set, an override file present | exactly the listed files          |
| `docker compose -f <file>`                   | exactly that file                 |

So the production stack is composed of precisely the three files `.env` names, and nothing a
stray file in the working directory can change. That is the difference between a deployment you
can reason about from the repository and one you have to inspect the server to understand.

### One configuration file

`.env` in the repository root is the only file an operator edits. Three mechanisms carry values
from it into containers, chosen per service:

**The Django roles** (`api`, `worker`, `beat-worker`, `migrator`) get `env_file: .env` — the whole
file. Django reads roughly ninety settings straight from `os.environ`, most of them optional
(`EMAIL_*`, `GITHUB_*`, `SENTRY_*`, read replicas, retention windows). Enumerating them in compose
would be a second, permanently stale copy of `apps/api/workspaces/settings/common.py`. Passing the file
means any Django setting can be configured by adding one line to `.env`, with no compose edit.

The cost is that these four containers also see `COMPOSE_FILE`, `LISTEN_HTTP_PORT` and
`SITE_ADDRESS`, which Django ignores. That is accepted: they are not secrets, and the alternative
costs far more.

**Everything else** gets an explicit `environment:` allow-list. `workspaces-db` receives four variables,
`workspaces-mq` three, `workspaces-minio` two, `proxy` seven, `live` four. Nothing else reaches them. This is
the half that was wrong before, in both directions — infrastructure containers held credentials
they had no use for, while the proxy and the live server were starved of the ones they required.

**Build arguments**: none are passed. The frontend Dockerfiles default every `VITE_*` base URL to
the empty string, which makes the built apps address the API relatively, on whatever origin serves
them. That is exactly right behind a single-origin path-routing proxy, and it is why one image
works for any domain — the domain is not baked in.

### Defaults live where the reader looks

Three layers, deliberately:

- **Wiring defaults** in `docker-compose.yml` — `POSTGRES_HOST: ${POSTGRES_HOST:-workspaces-db}`. These
  are properties of the topology, not decisions. Overriding one points the stack at an external
  database.
- **Fail-fast guards** for values with no safe default — `${POSTGRES_PASSWORD:?set POSTGRES_PASSWORD in .env}`.
  A blank secret stops `docker compose config` with a message naming the variable and the file,
  rather than starting a database with no password.
- **Application defaults** stay in Django and in the Caddyfile. Compose does not restate them.

### Caddy

`apps/proxy/Caddyfile.ce` gains inline defaults on the three placeholders it cannot parse without:

```caddyfile
max_size {$FILE_SIZE_LIMIT:5242880}
reverse_proxy /{$BUCKET_NAME:uploads}/* workspaces-minio:9000
{$SITE_ADDRESS::80} { … }
```

so `caddy validate` passes with an empty environment. That is a safety net, not the mechanism —
**Caddy's `{$VAR:default}` fires only when a variable is absent, never when it is set and empty**:

```text
$ SITE_ADDRESS= caddy validate --config Caddyfile
Error: server block without any key is global configuration…
```

An operator who writes `SITE_ADDRESS=` in `.env` would therefore reproduce the original outage
exactly. So compose also passes all seven variables with `${VAR:-default}`, which _does_ substitute
for the empty string. Belt and braces, and the report of an empty value is a Compose-level default
rather than a Caddy parse error.

`TRUSTED_PROXIES` defaults to `0.0.0.0/0` in the base file (Caddy is the edge there and sees real
client IPs) and is narrowed to `private_ranges` by the Workspaces overlay (nginx reaches Caddy over the
docker bridge). Behind nginx the wide value would let any client spoof `X-Forwarded-For` and
forge its own IP in Django's logs and rate limits.

### Health checks and ordering

`depends_on` in the base file is start-order only: it waits for a container to exist, not for
Postgres to accept connections. The production overlay replaces that with conditions.

| Service                 | Check                               | Why this one                                                                                                                                                                                  |
| ----------------------- | ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `workspaces-db`         | `pg_isready`                        | —                                                                                                                                                                                             |
| `workspaces-redis`      | `valkey-cli ping`                   | The image ships `valkey-cli`; there is no `redis-cli` to fall back to                                                                                                                         |
| `workspaces-mq`         | `rabbitmq-diagnostics -q ping`      | 90 s `start_period`: the slowest service to boot on a small VPS                                                                                                                               |
| `workspaces-minio`      | `curl /minio/health/live`           | `curl` is in the image; `mc ready local` needs an alias the entrypoint does not configure                                                                                                     |
| `api`                   | `python urllib` against `:8000/`    | The image has no HTTP client, and `workspaces.web.urls` answers `{"status": "OK"}` unauthenticated. 120 s `start_period` covers `collectstatic`, `register_instance` and `configure_instance` |
| `live`                  | `wget /live/health`                 | `wget` is in `node:22-alpine`                                                                                                                                                                 |
| `proxy`                 | `curl` Caddy's admin API on `:2019` | Reports whether Caddy loaded a config, without coupling proxy health to the apps behind it                                                                                                    |
| `web`, `admin`, `space` | in the image already                | Their Dockerfiles carry `HEALTHCHECK`; Compose surfaces it                                                                                                                                    |
| `worker`, `beat-worker` | none                                | They serve no HTTP. A check that cannot pass is worse than none                                                                                                                               |

`api`, `worker` and `beat-worker` additionally wait on `migrator: service_completed_successfully`.
A failed migration then stops the deploy, instead of leaving a running api on a half-migrated
schema. The entrypoints' own `wait_for_migrations` polling still runs and is now redundant — it is
left alone because it is upstream application code and harmless.

There is no `HEALTHCHECK` in `apps/api/Dockerfile.api` on purpose: one image serves four roles and
three of them do not listen on 8000, so a baked-in check would mark them permanently unhealthy.

---

## Deployment tree

```text
.
├── DEPLOYMENT.md                       the operator's guide
├── docker-compose.yml                  BASE   services, images, configuration fan-out
├── docker-compose-local.yml            DEV    infra + api in Docker, frontends via pnpm dev
├── docker-compose-test.yml             TEST   api pytest stack, tmpfs, self-contained
├── setup.sh                            DEV    bootstrap: env files + SECRET_KEY + pnpm install
├── .env.example                        DEV    root template (upstream)
├── deployments/
│   ├── production/
│   │   └── compose.yml                 PROD   health checks, ordering, log rotation
│   └── workspaces/
│       ├── compose.yml                 EDGE   Caddy on loopback, trust the host nginx
│       ├── .env.example                       the production configuration template
│       ├── nginx.conf                         host nginx vhost
│       ├── init-env.sh                        first command: generate .env
│       ├── verify.sh                          post-deploy checks, exit code = failures
│       ├── backup.sh                          Postgres + uploads, rotated
│       └── inspect-existing.sh                read-only survey of an install being migrated
├── docs/deployment/
│   ├── architecture.md                 this file
│   └── migration.md                    old layout → this one; stock Plane → this fork
└── apps/
    ├── proxy/{Caddyfile.ce,Dockerfile.ce}     the stack's path-routing proxy
    ├── api/{Dockerfile.api,Dockerfile.dev,bin/*.sh,.env.example}
    ├── web/{Dockerfile.web,caddy/Caddyfile}
    ├── admin/{Dockerfile.admin,caddy/Caddyfile}
    ├── space/Dockerfile.space
    └── live/Dockerfile.live
```

Every file above is reachable from a documented command. `deployments/` went from 26 tracked files
to 8, and all 8 are used by the one deployment this fork performs.

---

## Dependency graph

### Files

```text
.env  ──COMPOSE_FILE──┬─▶ docker-compose.yml ──build──▶ apps/*/Dockerfile.*
  │                   │            │
  │                   │            └──config──▶ apps/proxy/Caddyfile.ce
  │                   ├─▶ deployments/production/compose.yml
  │                   └─▶ deployments/workspaces/compose.yml
  │
  ├──env_file────────────▶ api · worker · beat-worker · migrator
  └──${...} interpolation─▶ every other service's environment allow-list

deployments/workspaces/.env.example ──init-env.sh──▶ .env
deployments/workspaces/nginx.conf   ──copied by hand──▶ /etc/nginx/sites-available/  (not read from the repo)
deployments/workspaces/verify.sh    ──reads──▶ docker compose ps / exec, and the public URL
```

### Runtime

```text
                    host nginx :80/:443        (TLS, gzip, websocket upgrade, body limit)
                            │ 127.0.0.1:8080
                            ▼
                    proxy (Caddy)              ← SITE_ADDRESS, TRUSTED_PROXIES, FILE_SIZE_LIMIT,
                            │                     BUCKET_NAME, CERT_*
        ┌──────────┬────────┼────────┬──────────┬─────────────┐
        ▼          ▼        ▼        ▼          ▼             ▼
      web       admin     space    live       api      workspaces-minio
       /*     /god-mode  /spaces   /live   /api /auth      /uploads
                                     │      /static
                                     │        │
                                     └────────┤
                                              ▼
                           ┌──────────────────┼──────────────────┐
                           ▼                  ▼                  ▼
                      workspaces-db          workspaces-redis          workspaces-mq
                           ▲                  ▲                  ▲
                           └──────── worker · beat-worker ───────┘
                                              │
                                    migrator (runs once, exits 0)
```

Start-up order, enforced by the production overlay:

```text
workspaces-db · workspaces-redis · workspaces-mq · workspaces-minio   →  healthy
                     migrator                     →  exits 0
              api · worker · beat-worker          →  api healthy
                    live  →  proxy
```

### Environment

Generated from `docker compose config` against the shipped template, so it reflects what actually
reaches each container rather than what the templates claim.

<!-- Regenerate: docker compose config --format json -->

| Variable                    | Containers that receive it        | Consumed by                          |
| --------------------------- | --------------------------------- | ------------------------------------ |
| `ADMIN_BASE_URL`            | _django roles_                    | Django settings                      |
| `API_KEY_RATE_LIMIT`        | _django roles_                    | Django settings                      |
| `APP_BASE_URL`              | _django roles_                    | Django settings                      |
| `APP_DOMAIN`                | _django roles_                    | Compose only (builds the URLs below) |
| `AUTHENTICATION_RATE_LIMIT` | _django roles_                    | Django settings                      |
| `AWS_ACCESS_KEY_ID`         | _django roles_, workspaces-minio¹ | Django settings                      |
| `AWS_REGION`                | _django roles_                    | Django settings                      |
| `AWS_S3_BUCKET_NAME`        | _django roles_, proxy¹            | Django settings, Caddyfile           |
| `AWS_SECRET_ACCESS_KEY`     | _django roles_, workspaces-minio¹ | Django settings                      |
| `COMPOSE_FILE`              | _django roles_                    | Compose only                         |
| `COMPOSE_PATH_SEPARATOR`    | _django roles_                    | Compose only                         |
| `COMPOSE_PROJECT_NAME`      | _django roles_                    | Compose only                         |
| `CORS_ALLOWED_ORIGINS`      | _django roles_                    | Django settings                      |
| `DEBUG`                     | _django roles_                    | Django settings                      |
| `FILE_SIZE_LIMIT`           | _django roles_, proxy             | Django settings, Caddyfile           |
| `GUNICORN_WORKERS`          | _django roles_                    | api entrypoint                       |
| `LISTEN_HTTP_PORT`          | _django roles_                    | Compose only (the published port)    |
| `LIVE_BASE_URL`             | _django roles_                    | Django settings                      |
| `LIVE_SERVER_SECRET_KEY`    | _django roles_, live              | live server                          |
| `ODOO_API_KEY`              | _django roles_                    | Django settings                      |
| `ODOO_BASE_URL`             | _django roles_                    | Django settings                      |
| `POSTGRES_DB`               | _django roles_, workspaces-db     | Django settings                      |
| `POSTGRES_PASSWORD`         | _django roles_, workspaces-db     | Django settings                      |
| `POSTGRES_USER`             | _django roles_, workspaces-db     | Django settings                      |
| `RABBITMQ_PASSWORD`         | _django roles_, workspaces-mq¹    | Django settings                      |
| `RABBITMQ_USER`             | _django roles_, workspaces-mq¹    | Django settings                      |
| `RABBITMQ_VHOST`            | _django roles_, workspaces-mq¹    | Django settings                      |
| `SECRET_KEY`                | _django roles_                    | Django settings                      |
| `SITE_ADDRESS`              | _django roles_, proxy             | Caddyfile                            |
| `SPACE_BASE_URL`            | _django roles_                    | Django settings                      |
| `TRUSTED_PROXIES`           | _django roles_, proxy             | Caddyfile                            |
| `USE_MINIO`                 | _django roles_                    | Django settings                      |
| `WEB_URL`                   | _django roles_                    | Django settings                      |

_django roles_ = `api`, `worker`, `beat-worker`, `migrator`.

¹ Delivered under a different key name, because the image expects one:
`AWS_ACCESS_KEY_ID` → `MINIO_ROOT_USER`, `AWS_SECRET_ACCESS_KEY` → `MINIO_ROOT_PASSWORD`,
`RABBITMQ_*` → `RABBITMQ_DEFAULT_*`, `AWS_S3_BUCKET_NAME` → `BUCKET_NAME`. Compose is where one
entered value fans out to both the service that owns the credential and the client that uses it,
so the two cannot drift.

### The seven variables the brief singled out

| Variable          | Where set                 | Reaches        | Unset                            | Set but empty                                                     |
| ----------------- | ------------------------- | -------------- | -------------------------------- | ----------------------------------------------------------------- |
| `SITE_ADDRESS`    | `.env`                    | proxy          | Caddyfile default `:80`          | **Caddy refuses the config** — compose's `:-` default prevents it |
| `CERT_EMAIL`      | `.env` (blank)            | proxy          | no ACME contact                  | same; blank is the normal value behind nginx                      |
| `CERT_ACME_CA`    | `.env`                    | proxy          | Caddyfile default: Let's Encrypt | **breaks the global block** — compose default prevents it         |
| `CERT_ACME_DNS`   | `.env` (blank)            | proxy          | no DNS challenge                 | same; blank is normal                                             |
| `TRUSTED_PROXIES` | `.env`                    | proxy          | Caddyfile default `0.0.0.0/0`    | breaks `trusted_proxies static`                                   |
| `FILE_SIZE_LIMIT` | `.env`                    | proxy + django | Caddyfile default 5 MB           | **`request_body` parse error** — compose default prevents it      |
| `BUCKET_NAME`     | from `AWS_S3_BUCKET_NAME` | proxy          | Caddyfile default `uploads`      | routes collapse to `/` and `//*`; uploads 404                     |

The pattern is uniform, and it is the single most useful thing to know about this Caddyfile: **an
empty value is not the same as an absent one.** Compose closes the gap for all seven.

`FILE_SIZE_LIMIT` has a third consumer that compose cannot reach — `client_max_body_size` in
`deployments/workspaces/nginx.conf`, which lives on the host. nginx rejects an oversized body before Caddy
or Django see it, so the two must be kept in step by hand. `verify.sh` tests the boundary.

---

## Decisions, and what was rejected

### Rewriting the root compose file rather than patching it

Upstream's root compose repeats the same eight-line block four times for `api`, `worker`,
`beat-worker` and `migrator`. The brief asks for duplicated environment and service blocks to be
removed, so those four now share a YAML anchor and differ only by `command:`.

_Rejected: minimal edits._ Two one-line fixes (`SITE_ADDRESS`, and an environment for `live`) would
have made the stack start, and would have left the duplication, the missing health checks, the
credential over-sharing and the unpinned MinIO image in place. The brief is explicit that running
is not the goal.

The cost is merge friction on this one file. It is small and measurable: upstream has touched
`docker-compose.yml` **once** since 2025-09 (a Valkey version bump). A conflict there is a
three-line reconciliation. The same rewrite applied to `apps/api/` would not have been worth it,
which is why nothing there changed.

### Two upstream files changed, and why

| File                      | Change                                             | Why it had to be upstream's file                                     |
| ------------------------- | -------------------------------------------------- | -------------------------------------------------------------------- |
| `apps/proxy/Caddyfile.ce` | inline defaults on three placeholders; `caddy fmt` | It is the file Caddy parses. A default cannot be added anywhere else |
| `docker-compose.yml`      | rewritten as described                             | It is the base of the file chain                                     |

Both are also genuine upstream bugs — the proxy misconfiguration and the `live` service's missing
environment affect anyone using upstream's build-from-source path — so both are candidates for a
pull request that would erase the diff entirely.

`apps/api/.env.example` was also corrected, but only its comments: the previous text asserted that
Compose never expands `${…}` inside an `env_file`, which is false on Compose 2.24 and newer
(verified on 5.5.1 — a placeholder resolves against the same file and then against the project
`.env`). The advice it justified is still right for a different reason, so the advice stayed and
the reason was fixed.

### Keeping the development and test stacks exactly as they are

`docker-compose-local.yml`, `docker-compose-test.yml`, `setup.sh` and the per-app `.env.example`
files are untouched. Development genuinely needs per-app env files, because Vite reads
`apps/web/.env` at build time and the live server's `dotenv` reads `apps/live/.env` — that is not
duplication, it is how those tools work. Folding them into the root `.env` would change every
contributor's workflow, break `CONTRIBUTING.md` and `AGENTS.md`, and buy nothing: production does
not use them.

The single change is one line added to `.env.example`, `LIVE_SERVER_SECRET_KEY`, because the base
compose file now requires it.

### Deleting four deployment paths instead of documenting them as unused

The brief forbids "just in case" files. Every deleted path could only ever deploy `makeplane/*`
images, i.e. stock Plane; keeping them would mean maintaining a banner on each explaining it does
not work here.

The cost is honest: deleting an upstream-tracked file produces a modify/delete conflict the next
time upstream edits it. Upstream touches `deployments/cli` and `deployments/aio` roughly 22 times a
year, so expect this. The resolution is always `git rm -r <path>` — see
[`migration.md`](migration.md#merging-upstream-after-this-change). Nothing is lost: every deleted
file is one `git show` away.

### One command, not a wrapper script

A `deployments/workspaces/compose.sh` wrapper was considered and rejected in favour of `COMPOSE_FILE` in
`.env`. A wrapper is a second thing to learn, does not help anyone who types `docker compose` out
of habit, and does not fix `docker compose` invoked by tooling. Putting the chain in `.env` makes
the _default_ correct instead of adding an alternative to it.

### Alternatives weighed for the environment model

Three were designed and scored against the brief before this one was built:

- **Upstream-first**: keep upstream's root compose, put every change in the site overlay. Best merge
  story; worst on "configuration is centralized" — the overlay has to re-point `env_file` per
  service with `!override`, which is subtle and easy to get wrong.
- **Single-source**: one env file, everything explicit in anchors, per-app env files deleted.
  Cleanest centralization; changes the contributor workflow and diverges most from upstream.
- **Operator-first**: fold the loopback bind into the root file so there is one file and one
  command. Best entry point; loses the separation between "base" and "site", which the brief asks
  for by name.

What is built takes the entry point from the third, the explicit fan-out from the second, and the
"leave dev and test alone" discipline from the first.

---

## Validation

Nothing here is asserted from reading. Each was run against this repository with a Docker daemon,
`docker compose` 5.5.1, `caddy` 2.11.4 and `nginx` 1.24/1.28.

| Check                                                                                                        | Result                                                                                                                           |
| ------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------- |
| `docker compose config` — base alone, and all three files                                                    | valid                                                                                                                            |
| Blank secrets in `.env`                                                                                      | refused, naming each variable and the file                                                                                       |
| Cold boot: `down -v` then `up -d --wait` from destroyed volumes                                              | all 12 services healthy, `migrator` exited 0                                                                                     |
| `caddy validate` — no env, empty env, full env                                                               | valid in all three                                                                                                               |
| `nginx -t` on the vhost — nginx 1.24 and 1.28                                                                | passes (1.28 warns that `listen … http2` is deprecated; the form is kept because Ubuntu 22.04's 1.18 does not accept `http2 on`) |
| Routing: `/`, deep link, `/god-mode/`, `/spaces/`, `/api/instances/`, `/auth/…`, `/live/health`, `/uploads/` | all answer correctly through nginx and directly at Caddy                                                                         |
| `http://` → `https://` redirect, HSTS                                                                        | 301, header present                                                                                                              |
| Sign-in probe through nginx (`X-Forwarded-Proto: https`)                                                     | 302 — Django accepts the origin                                                                                                  |
| The same probe straight at Caddy without the header                                                          | CSRF failure — proves the header is what makes it work                                                                           |
| Upload of `FILE_SIZE_LIMIT + 1KB`                                                                            | 413 at nginx, and 413 at Caddy when nginx is bypassed                                                                            |
| WebSocket upgrade on `/live/collaboration`                                                                   | 101                                                                                                                              |
| Env propagation, per container                                                                               | as tabulated above; `workspaces-db` holds no unrelated secrets                                                                   |
| `engineering-ops-*` periodic tasks                                                                           | 4 registered and enabled                                                                                                         |
| Migration `0123_engineering_operations`                                                                      | applied                                                                                                                          |

`deployments/workspaces/verify.sh` runs 51 of these on a live deployment and exits with the number of
failures.
