# Help Center screenshots

Captures screenshots of Shinhan Workspace and injects them into Help Center
articles. Runs against a **running instance** (web + api + object storage) and a
populated demo workspace. Auth is by **injected session cookie** (no SSO login form).

## Why this design

- The reader article HTML keeps `{{screenshot:NAME}}` placeholders in the markdown
  source (`apps/api/plane/db/fixtures/help_center/**`). The seed loader turns each
  into a marker `<p data-help-screenshot="NAME">`. This tool replaces markers with
  real `<img>` tags pointing at instance-global assets.
- **Asset IDs are minted per instance** → screenshots are captured + injected once
  per serving instance (not committed to git). Re-seeding content re-creates the
  placeholders, so **re-inject after any content re-seed**.

## One-time setup

```bash
cd tools/help-screenshots
npm install            # playwright JS pkg; browsers are already cached
```

## Capture + inject (run order matters)

```bash
# 1. Seed content (placeholders) + demo backdrop (in the api container)
docker exec planeso-api-1 sh -c 'cd /code && python manage.py seed_help_center'
docker exec planeso-api-1 sh -c 'cd /code && python manage.py seed_help_demo_data'

# 2. Mint a session cookie for the screenshot user
SHOT_COOKIE=$(docker exec planeso-api-1 sh -c 'cd /code && python manage.py make_help_session' | tail -1)

# 3. Capture (host; needs web :3000 + api :8000 reachable)
SHOT_COOKIE="$SHOT_COOKIE" npm run capture        # writes ./out/<name>.png
#   THEME=dark ...                                # optional dark-mode set

# 4. Inject (in the api container — needs Django + object storage)
docker exec planeso-api-1 sh -c 'rm -rf /tmp/help-shots && mkdir -p /tmp/help-shots'
docker cp out/. planeso-api-1:/tmp/help-shots/
docker exec planeso-api-1 sh -c 'cd /code && python manage.py inject_help_screenshots --dir /tmp/help-shots'
```

Open `/help` to verify images render (served via `/api/assets/v2/static/{id}/` →
vite `/uploads` proxy → MinIO).

## Adding more screenshots

`targets.json` is a list of `{name, path, wait}`. `name` must match a
`{{screenshot:NAME}}` placeholder in an article. `path` supports `{ws}` (workspace
slug), `{pid}` (first demo project id), `{uid}` (screenshot user id), resolved at
runtime from the API.

```json
{ "name": "danh-sach-du-an", "path": "/{ws}/projects/", "wait": 3000 }
```

### Interactive / God Mode targets (not yet scripted)

Many placeholders need a specific UI state — an open modal, a hover popover, a
pressed Cmd+K, or the God Mode admin app (`/god-mode`, instance-admin only). These
need per-target interaction steps in `capture.mjs` (e.g. click a button, wait for a
dialog) before `screenshot()`. The pilot registry covers the "navigate to a route"
targets; extend `capture.mjs` with an optional `steps` hook per target to cover the
interactive ones. Articles ship with text regardless — images are additive.

## Notes

- `make_help_session` works for any user via `--email`.
- The demo workspace (`help-demo`) and screenshot user
  (`help-screenshot@shinhan.local`) are isolated; never run `seed_help_demo_data`
  against a real tenant.
- `out/` and `node_modules/` are gitignored.
