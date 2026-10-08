# Deploying a Source Change - How It Works

The self-hosted instance runs from **locally built Docker images** (tagged
`plane-*:v<version>-local`, currently `v1.4.2-local`), not from the published
images on Docker Hub. Editing files in this repo therefore changes nothing on
its own - the affected image has to be rebuilt and its container recreated
before anyone sees the change.

The compose file, `plane.env` and the database live outside this repo, in the
instance folder (`C:\plane\plane-app` on the current host). The instance is
served on host port 90, and `APP_DOMAIN` / `CORS_ALLOWED_ORIGINS` in `plane.env`
are pinned to that exact origin.

## Key Points

1. **Build `web` and `space` from `git archive`, never from `.`** - a plain
   build context ships an app with no translations at all (see below)
2. **A green build is not proof** - verify the change in the served asset
3. **Keep the previous image around for rollback** - either a new version tag
   (upgrades) or a `-backup` tag (rebuilds on the same tag)
4. **Back up the database before any migration**, and rehearse migrations on a
   restored copy first
5. **Use `--no-deps`** - so only the containers you name are replaced
6. **Be patient after a recreate** - the API answers 502 for a minute or more
   while it starts, and assets are cached aggressively (hard-refresh)

## Which Image Do I Rebuild?

| What you changed                                                                                   | Rebuild | Build context             |
| -------------------------------------------------------------------------------------------------- | ------- | ------------------------- |
| `apps/web`, or any `packages/*` the web app bundles (`editor`, `ui`, `propel`, `utils`, `i18n`, …) | `web`   | `git archive` (repo root) |
| `apps/space` (public pages), or packages it bundles                                                | `space` | `git archive` (repo root) |
| `apps/admin`                                                                                       | `admin` | repo root                 |
| `apps/live` (real-time page collaboration server)                                                  | `live`  | repo root                 |
| `apps/api` (Django backend) - note `worker`, `beat-worker` and `migrator` run this same image      | `api`   | `apps/api`                |
| `apps/proxy` (Caddy)                                                                               | `proxy` | `apps/proxy`              |

A change to a shared package can affect more than one image. Editor node views
and CSS are client-side, so `web` alone is enough; a change to the editor
_schema_ (new node types or node attributes) also needs `live`, because that
server parses documents with the same schema.

An **upstream version upgrade** (e.g. v1.2.3 → v1.4.2) rebuilds all six, since
the frontends, `live` and the API must all be on the same version.

## The i18n Symlink Trap (web and space)

Since v1.4.2, `packages/i18n/locales` is a git **symlink** to `src/locales`, and
the built `@plane/i18n` loads every translation through it
(`import("../locales/<lang>/<ns>.json")`). This Windows checkout has
`core.symlinks=false`, so the "symlink" is a 11-byte text file containing
`src/locales`. A `docker build … .` sends that text file as-is, the bundler
finds no locale JSON, and the resulting app shows raw keys like
`home.title` everywhere - upstream strings included. **The build still
succeeds.**

Build from a tar of the commit instead; `git archive` writes real symlinks:

```bash
cd /c/plane/plane-src
git archive --format=tar HEAD | docker build -f apps/web/Dockerfile.web -t plane-web:v1.4.2-local -
git archive --format=tar HEAD | docker build -f apps/space/Dockerfile.space -t plane-space:v1.4.2-local -
```

This builds **the committed tree only** - commit (or at least `git stash` and
check out) what you want to ship first. Uncommitted edits are not included.

The same symlink is why a local `react-router dev` server on this machine shows
raw keys; that is a dev-only symptom and not a code bug.

## Rebuilding One Service (same version)

From Git Bash, using the `web` image as the example.

### 1. Tag a rollback image first

The rebuild reuses the same tag, so capture the working image **before**
building, or there is nothing to go back to:

```bash
docker tag plane-web:v1.4.2-local plane-web:v1.4.2-backup
```

### 2. Build from source

```bash
cd /c/plane/plane-src
# web / space: from git archive (see above)
git archive --format=tar HEAD | docker build -f apps/web/Dockerfile.web -t plane-web:v1.4.2-local -
# api: context is apps/api
docker build -f apps/api/Dockerfile.api -t plane-api:v1.4.2-local apps/api
# admin / live: repo root context
docker build -f apps/admin/Dockerfile.admin -t plane-admin:v1.4.2-local .
# proxy: context is apps/proxy
docker build -f apps/proxy/Dockerfile.ce -t plane-proxy:v1.4.2-local apps/proxy
```

No `--build-arg` values are needed. The `VITE_*` build args default to empty,
meaning "same origin" - correct here, because the proxy serves the API and the
frontend from the same host and port.

Rough timings on this machine (warm cache): api ~3.5 min, web ~3-4 min,
space ~5 min, admin ~2.5 min, live ~5 min, proxy ~2.5 min.

**The frontend builds typecheck.** `packages/editor`'s build script is
`tsc && tsdown`, so a type error fails the build and leaves the running
container untouched. Look for `Tasks: N successful, N total` near the end. A
failure names the package, for example `Failed: @plane/editor#build`, with the
`tsc` error above it.

### 3. Recreate only that container

```bash
cd /c/plane/plane-app
docker compose --env-file plane.env -f docker-compose.yaml up -d --force-recreate --no-deps web
```

`--no-deps` matters: without it, Compose can restart the API, database and other
services this one depends on. With it, only the web container is replaced and no
data is touched.

For an `api` change, recreate `api`, `worker` **and** `beat-worker` (all three
run the image). If the change adds or changes a Celery beat schedule entry,
`beat-worker` must be recreated or the new schedule is never picked up. If the
change has migrations, run them first - see the upgrade procedure below.

### 4. Verify before trusting it

Confirm the container picked up the new image rather than a cached one:

```bash
docker inspect --format '{{.Image}}' plane-app-web-1
docker images --format "{{.ID}} {{.Repository}}:{{.Tag}}" | grep plane-web
```

The id from the first command should match the `plane-web:v1.4.2-local` row.

Then prove the change reaches a browser. Pick a string only your change could
have introduced, find which asset carries it **inside the image**, then fetch
that asset over HTTP:

```bash
# 1. locate the asset (filenames are content-hashed, so look it up every time)
MSYS_NO_PATHCONV=1 docker run --rm --entrypoint sh plane-web:v1.4.2-local \
  -c "grep -rl 'your-marker-string' /usr/share/nginx/html/assets"

# 2. fetch it the way a browser will
curl -sS http://localhost:90/assets/<file-from-step-1> | grep -c 'your-marker-string'
```

A non-zero count is real end-to-end proof. "The build succeeded" is not - a
stale layer or a cached container can both produce a green build containing
none of your code.

**Also check a translation string** (any English UI text from
`packages/i18n/src/locales/en/*.json`, e.g. `delete this sticky`). If it is
missing, the image was built from a plain context - see the symlink trap.

For the API, an unauthenticated request to a new endpoint should return
**401**, not 404:

```bash
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:90/api/workspaces/x/time-entries/timer/
```

### 5. Hard-refresh the browser

Press **Ctrl+Shift+R** on the site, or you will be looking at cached files and
concluding your change did nothing. This is the easiest half hour to waste here.

## Upgrading to a New Version (or Deploying Migrations)

The instance folder holds the scripts used for the v1.2.3 → v1.4.2 upgrade:
`deploy-v1.4.2.sh` and `rollback-v1.2.3.sh`. Use them as the template for the
next upgrade. The steps:

### 1. Build every image under a new version tag

Build all six as above, tagged with the new version (e.g. `v1.4.2-local`). The
old images keep their tag (`v1.2.3-local`), so they _are_ the rollback - no
`-backup` tags needed. Nothing running is affected yet.

Check the upstream compose for changes worth carrying over:

```bash
git diff <old-base> <new-base> -- deployments/cli/community/docker-compose.yml deployments/cli/community/variables.env
```

v1.4.2 only added optional variables (`WEBHOOK_ALLOWED_IPS`,
`WEBHOOK_ALLOWED_HOSTS`, `AUTHENTICATION_RATE_LIMIT`) and dropped the default
`SECRET_KEY` / `LIVE_SERVER_SECRET_KEY` values. Our `plane.env` sets its own
secrets, so only the image tags in `docker-compose.yaml` needed changing.

### 2. Back up the database

```bash
cd /c/plane/plane-app
docker exec plane-app-plane-db-1 sh -c 'PGPASSWORD="$POSTGRES_PASSWORD" pg_dump -h localhost -U "$POSTGRES_USER" -Fc "$POSTGRES_DB"' \
  > backups/before-<change>-$(date +%Y%m%d-%H%M%S).dump
```

The plain `docker exec … pg_dump -U plane plane` fails with
`fe_sendauth: no password supplied`: the container's environment sets
`PGHOST=plane-db`, so `pg_dump` connects over TCP and needs the password. The
command above uses the container's own `$POSTGRES_PASSWORD` and `-h localhost`,
so no secret has to be copied out of `plane.env`.

### 3. Check the recorded migrations against the code

```bash
docker exec plane-app-plane-db-1 sh -c 'PGPASSWORD="$POSTGRES_PASSWORD" psql -h localhost -U "$POSTGRES_USER" -d "$POSTGRES_DB" \
  -Atc "select name from django_migrations where app='"'"'db'"'"' order by id desc limit 8;"'
ls /c/plane/plane-src/apps/api/plane/db/migrations | sort | tail -8
```

Every recorded name must exist in the code. **Fork migrations get renumbered
when we rebase onto a new upstream release**, and the database still has the
old names. Django then refuses to migrate (`InconsistentMigrationHistory`, or a
`table already exists` error halfway through).

What happened in the v1.4.2 upgrade, and the fix:

- The database had our `db.0121_issuepage` and
  `db.0122_issuepage_single_page_per_issue` (cut against v1.2.3, where 0120 was
  the leaf).
- v1.4.2 ships its own, different `0121_alter_estimate_type` and
  `0122_alter_draftissue_assignees_alter_issue_assignees_and_more`; ours became
  `0123_issuepage` / `0124_issuepage_single_page_per_issue`, identical except
  for their `dependencies`.
- Renaming the rows is **not** enough: 0123 would be recorded as applied while
  its parent (upstream 0122) is not, and Django rejects that history.
- The fix, run with the new API image:
  1. delete the two old rows,
  2. `migrate db 0122_alter_draftissue_assignees_alter_issue_assignees_and_more`
     (applies upstream's 0121/0122 - field alterations only),
  3. `migrate db 0124_issuepage_single_page_per_issue --fake` (the tables and
     constraints already exist),
  4. `migrate` (everything else).

Before faking, confirm the renumbered files differ only in `dependencies`:

```bash
diff <(git show <old-base>:apps/api/plane/db/migrations/0121_issuepage.py) apps/api/plane/db/migrations/0123_issuepage.py
```

### 4. Rehearse the migration on a restored copy

```bash
docker network create mig-trial
docker run -d --name mig-trial-db --network mig-trial \
  -e POSTGRES_USER=plane -e POSTGRES_PASSWORD=plane -e POSTGRES_DB=plane postgres:15.7-alpine
docker exec -i mig-trial-db pg_restore -U plane -d plane --no-owner < backups/<dump>
MSYS_NO_PATHCONV=1 docker run --rm --network mig-trial \
  -e DATABASE_URL=postgresql://plane:plane@mig-trial-db/plane -e SECRET_KEY=trial-only \
  --entrypoint bash plane-api:v1.4.2-local -c 'python manage.py migrate && python manage.py makemigrations --check --dry-run'
docker rm -f mig-trial-db && docker network rm mig-trial
```

`makemigrations --check` should print `No changes detected`. Wait for
`pg_isready` before restoring.

### 5. Deploy

1. Point `docker-compose.yaml` at the new tags (keep a copy of the old file in
   `backups/`).
2. Stop the writers: `docker compose … stop api worker beat-worker live`. The
   web app stays up and shows errors for the few minutes this takes.
3. Run migrations through the migrator service, so it gets the real
   environment:
   ```bash
   MSYS_NO_PATHCONV=1 docker compose --env-file plane.env -f docker-compose.yaml \
     run --rm --no-deps --entrypoint bash migrator -c 'python manage.py wait_for_db && python manage.py migrate'
   ```
4. Recreate everything:
   `docker compose … up -d --force-recreate --no-deps api worker beat-worker live web space admin proxy`.
5. Wait. The API container runs its startup tasks before gunicorn listens, and
   the proxy returns **502** until it does - a minute or more. Poll
   `http://localhost:90/api/instances/` for 200 rather than concluding it's
   broken.
6. Verify as in step 4 of the rebuild section. New beat tasks appear in the
   database scheduler once `beat-worker` restarts:
   ```bash
   docker exec plane-app-plane-db-1 sh -c 'PGPASSWORD="$POSTGRES_PASSWORD" psql -h localhost -U "$POSTGRES_USER" -d "$POSTGRES_DB" \
     -Atc "select name, enabled from django_celery_beat_periodictask order by name;"'
   ```

## Rolling Back

**Same-version rebuild:**

```bash
docker tag plane-web:v1.4.2-backup plane-web:v1.4.2-local
cd /c/plane/plane-app
docker compose --env-file plane.env -f docker-compose.yaml up -d --force-recreate --no-deps web
```

Takes a few seconds. Substitute the relevant image name for other services.

**Version upgrade:** restore the old `docker-compose.yaml` from `backups/` and
recreate the containers. If the new version's migrations are the problem, also
restore the pre-upgrade dump (`pg_restore --clean --if-exists --no-owner`) and
drop tables the new version created that the dump doesn't know about.
`rollback-v1.2.3.sh` in the instance folder does all of this for the v1.4.2
upgrade. Anything written after the upgrade is lost.

## Choosing a Marker String

Step 4 only works if the marker survives into the bundle. Two traps:

- **A CSS class name is a good marker.** It appears verbatim in the compiled
  stylesheet. So is UI text from the English locale files.
- **An exported constant is a bad marker.** The bundler keeps cross-module
  constants as minified variables, so the config site compiles to `char: t4`,
  not `char: "#]@"` - grepping the obvious expression finds nothing even when
  the change is present. Anchor on a neighbouring unique string instead (a
  plugin key, an error message) and read the surrounding characters:

  ```bash
  MSYS_NO_PATHCONV=1 docker run --rm --entrypoint sh plane-web:v1.4.2-local -c '
    F=$(grep -rl "page-embed-suggestion" /usr/share/nginx/html/assets/*.js | head -1)
    grep -o -E ".{30}page-embed-suggestion" "$F"'
  ```

  which prints something like `t4="#]@",AH=new _e("page-embed-suggestion`,
  showing the constant's real value next to the anchor.

## Notes and Gotchas

- **`MSYS_NO_PATHCONV=1` for `docker run`/`docker compose run` from Git Bash**
  whenever an argument is a container path (`/usr/share/...`, `/code/...`).
  Git Bash otherwise rewrites it into a Windows path and the command fails or,
  worse, silently does the wrong thing.
- **`COPY . . CACHED` is usually a red herring.** BuildKit reports the layer as
  cached even when the build genuinely picks up your edits. Do not chase it -
  confirm via the built artifact instead. Only `.git`, `node_modules` and build
  outputs are excluded from the context (see `.dockerignore`).
- **The container reports `health: starting` for 10-15 seconds** after a
  recreate, and the API itself takes longer (see the 502 note above). Re-check
  before concluding anything is wrong.
- **Local tooling.** `pnpm` is not on the system `PATH`; corepack provides it
  via a shim in `~/bin` (`corepack enable --install-directory ~/bin pnpm`;
  plain `corepack enable` needs admin rights). The husky pre-commit hook runs
  `pnpm lint-staged`, so it needs that shim. `node_modules` is installed, so
  `apps/web/node_modules/.bin/tsc --noEmit` (after `react-router typegen`)
  typechecks the web app without a Docker build.
- **Line endings.** The checkout is CRLF (`core.autocrlf=true`) while `oxfmt`
  expects LF, so `oxfmt --check` reports failures on files that are perfectly
  fine. Do **not** "fix" these - running `oxfmt` in write mode rewrites whole
  files to LF and buries the real change in thousands of lines of noise. To
  check a file honestly, strip the carriage returns into a copy first:

  ```bash
  tr -d '\r' < file.ts > /tmp/file.ts && npx oxfmt@0.35.0 --check /tmp
  ```

- **Tests.** `packages/utils` has a vitest suite (`pnpm --filter @plane/utils
test`); `apps/live` has its own. `packages/editor` has no tests. API tests run
  in Docker via `docker-compose-test.yml` - never against the `plane-app-*`
  containers.
- **A local dev server is awkward here.** `CORS_ALLOWED_ORIGINS` is pinned to
  the instance's origin, so a Vite dev server on `localhost:3000` is refused by
  the API until that variable is widened and the API containers restarted.
  Rebuilding the image needs no config changes, which is why it is the route
  documented above.

## Reference Files

- [apps/web/Dockerfile.web](../apps/web/Dockerfile.web) - the web image build
- [apps/api/bin/docker-entrypoint-migrator.sh](../apps/api/bin/docker-entrypoint-migrator.sh) - what the migrator runs
- [turbo.json](../turbo.json) - task graph used by `turbo run build`
- [docs/linting.md](./linting.md) - lint and format tooling
- `C:\plane\plane-app\deploy-v1.4.2.sh` / `rollback-v1.2.3.sh` - the scripts
  used for the v1.4.2 upgrade (outside the repo)
