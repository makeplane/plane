# Deploying a Source Change - How It Works

The self-hosted instance runs from **locally built Docker images** (tagged
`*:v1.2.3-local`), not from the published images on `artifacts.plane.so`.
Editing files in this repo therefore changes nothing on its own - the affected
image has to be rebuilt and its container recreated before anyone sees the
change.

The compose file, `plane.env` and the database live outside this repo, in the
instance folder (`C:\plane\plane-app` on the current host). The instance is
served on host port 90, and `APP_DOMAIN` / `CORS_ALLOWED_ORIGINS` in `plane.env`
are pinned to that exact origin.

## Key Points

1. **A green build is not proof** - verify the change in the served asset
2. **Tag a rollback image before building** - the rebuild reuses the same tag
3. **Use `--no-deps`** - so only the one container is replaced
4. **Hard-refresh afterwards** - assets are cached aggressively

## Which Image Do I Rebuild?

| What you changed | Rebuild |
| --- | --- |
| `apps/web`, or any `packages/*` the web app bundles (`editor`, `ui`, `propel`, `utils`, …) | `web` |
| `apps/live` (real-time page collaboration server) | `live` |
| `apps/api` (Django backend) | `api` - note `worker`, `beat-worker` and `migrator` run this same image |
| `apps/admin` / `apps/space` | `admin` / `space` |

A change to a shared package can affect more than one image. Editor node views
and CSS are client-side, so `web` alone is enough; a change to the editor
*schema* (new node types or node attributes) also needs `live`, because that
server parses documents with the same schema.

## How to Run It

From Git Bash, using the `web` image as the example.

### 1. Tag a rollback image first

The rebuild reuses the same tag, so capture the working image **before**
building, or there is nothing to go back to:

```bash
docker tag plane-web:v1.2.3-local plane-web:v1.2.3-backup
```

### 2. Build from source

```bash
cd /c/plane/plane-src
docker build -f apps/web/Dockerfile.web -t plane-web:v1.2.3-local .
```

No `--build-arg` values are needed. The `VITE_*` build args default to empty,
meaning "same origin" - correct here, because the proxy serves the API and the
frontend from the same host and port.

Expect roughly 2-5 minutes warm, longer on a cold Docker cache.

**This build typechecks.** `packages/editor`'s build script is `tsc && tsdown`,
so a type error fails the build and leaves the running container untouched.
Look for `Tasks: 11 successful, 11 total` near the end. A failure names the
package, for example `Failed: @plane/editor#build`, with the `tsc` error above
it. Treat this as the typecheck - there is no local `node_modules` to run
`tsc` against by hand.

### 3. Recreate only that container

```bash
cd /c/plane/plane-app
docker compose --env-file plane.env -f docker-compose.yaml up -d --force-recreate --no-deps web
```

`--no-deps` matters: without it, Compose can restart the API, database and other
services this one depends on. With it, only the web container is replaced and no
data is touched.

### 4. Verify before trusting it

Confirm the container picked up the new image rather than a cached one:

```bash
docker inspect --format '{{.Image}}' plane-app-web-1
docker images --format "{{.ID}} {{.Repository}}:{{.Tag}}" | grep plane-web
```

The id from the first command should match the `plane-web:v1.2.3-local` row.

Then prove the change reaches a browser. Pick a string only your change could
have introduced, find which asset carries it **inside the image**, then fetch
that asset over HTTP:

```bash
# 1. locate the asset (filenames are content-hashed, so look it up every time)
docker run --rm --entrypoint sh plane-web:v1.2.3-local \
  -c "grep -rl 'your-marker-string' /usr/share/nginx/html/assets"

# 2. fetch it the way a browser will
curl -sS http://localhost:90/assets/<file-from-step-1> | grep -c 'your-marker-string'
```

A non-zero count is real end-to-end proof. "The build succeeded" is not - a
stale layer or a cached container can both produce a green build containing
none of your code.

### 5. Hard-refresh the browser

Press **Ctrl+Shift+R** on the site, or you will be looking at cached files and
concluding your change did nothing. This is the easiest half hour to waste here.

## Rolling Back

```bash
docker tag plane-web:v1.2.3-backup plane-web:v1.2.3-local
cd /c/plane/plane-app
docker compose --env-file plane.env -f docker-compose.yaml up -d --force-recreate --no-deps web
```

Takes a few seconds. Substitute the relevant image name for other services.

## Choosing a Marker String

Step 4 only works if the marker survives into the bundle. Two traps:

- **A CSS class name is a good marker.** It appears verbatim in the compiled
  stylesheet.
- **An exported constant is a bad marker.** The bundler keeps cross-module
  constants as minified variables, so the config site compiles to `char: t4`,
  not `char: "#]@"` - grepping the obvious expression finds nothing even when
  the change is present. Anchor on a neighbouring unique string instead (a
  plugin key, an error message) and read the surrounding characters:

  ```bash
  docker run --rm --entrypoint sh plane-web:v1.2.3-local -c '
    F=$(grep -rl "page-embed-suggestion" /usr/share/nginx/html/assets/*.js | head -1)
    grep -o -E ".{30}page-embed-suggestion" "$F"'
  ```

  which prints something like `t4="#]@",AH=new _e("page-embed-suggestion`,
  showing the constant's real value next to the anchor.

## Notes and Gotchas

- **`COPY . . CACHED` is usually a red herring.** BuildKit reports the layer as
  cached even when the build genuinely picks up your edits. Do not chase it -
  confirm via the built artifact instead. Only `.git`, `node_modules` and build
  outputs are excluded from the context (see `.dockerignore`), so source edits
  are always sent.
- **The container reports `health: starting` for 10-15 seconds** after a
  recreate. Re-check before concluding anything is wrong.
- **No local `node_modules`.** This checkout has never had `pnpm install` run in
  it, and `pnpm` is not on `PATH` - use `corepack pnpm` if you want it. The
  Docker build installs dependencies inside the image, so a local install is
  **not** needed just to deploy.
- **Line endings.** The checkout is CRLF (`core.autocrlf=true`) while `oxfmt`
  expects LF, so `oxfmt --check` reports failures on files that are perfectly
  fine. Do **not** "fix" these - running `oxfmt` in write mode rewrites whole
  files to LF and buries the real change in thousands of lines of noise. To
  check a file honestly, strip the carriage returns into a copy first:

  ```bash
  tr -d '\r' < file.ts > /tmp/file.ts && npx oxfmt@0.35.0 --check /tmp
  ```

- **Linting without an install** works via `npx oxlint@1.51.0 <paths>`.
- **`packages/editor` has no tests.** No test script, no vitest config, and no
  test files anywhere under `packages/`. `apps/live` is the only package with a
  test setup (vitest). Adding a unit test to the editor package means
  introducing test infrastructure to it first.
- **A local dev server is awkward here.** `CORS_ALLOWED_ORIGINS` is pinned to
  the instance's origin, so a Vite dev server on `localhost:3000` is refused by
  the API until that variable is widened and the API containers restarted.
  Rebuilding the image needs no config changes, which is why it is the route
  documented above.

## Reference Files

- [apps/web/Dockerfile.web](../apps/web/Dockerfile.web) - the web image build
- [turbo.json](../turbo.json) - task graph used by `turbo run build`
- [docs/linting.md](./linting.md) - lint and format tooling
