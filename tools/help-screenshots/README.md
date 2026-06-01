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

> **Images ship with the repo.** Screenshots that match a `{{screenshot:NAME}}`
> marker live committed under `apps/api/plane/db/fixtures/help_center/_screenshots/`.
> `seed_help_center` injects them automatically, so **deploying needs only**
> `seed_help_center` (no capture, works offline/air-gapped). This tool is for
> **maintainers refreshing** that committed set after a UI change.

## Refresh the committed screenshots (maintainer)

```bash
# 1. Seed content (placeholders) + demo backdrop (in the api container)
docker exec planeso-api-1 sh -c 'cd /code && python manage.py seed_help_center --skip-screenshots'
docker exec planeso-api-1 sh -c 'cd /code && python manage.py seed_help_demo_data'

# 2. Mint a session cookie for the screenshot user
SHOT_COOKIE=$(docker exec planeso-api-1 sh -c 'cd /code && python manage.py make_help_session' | tail -1)

# 3. Capture (host; needs web :3000 + api :8000 reachable)
SHOT_COOKIE="$SHOT_COOKIE" npm run capture        # writes ./out/<name>.png
#   SHOT_ONLY="name1,name2" ...                    # capture only specific targets
#   THEME=dark ...                                 # optional dark-mode set

# 4. Promote the new/updated PNGs into the committed set, then commit
cp out/<name>.png ../../apps/api/plane/db/fixtures/help_center/_screenshots/
git add apps/api/plane/db/fixtures/help_center/_screenshots/

# 5. Inject the committed set (default dir is _screenshots/; seed does this for you)
docker exec planeso-api-1 sh -c 'cd /code && python manage.py inject_help_screenshots'
```

Open `/help` to verify images render (served via `/api/assets/v2/static/{id}/` →
vite `/uploads` proxy → MinIO).

### Idempotency & cleanup

- **Re-seeding refreshes article bodies from source**, which restores the raw
  `data-help-screenshot` markers and drops any previously-injected `<img>`. Always
  run `inject_help_screenshots` *after* `seed_help_center`, never before. Re-running
  inject supersedes the prior asset for each `(article, name)` (old one soft-deleted),
  so images stay stable and never duplicate.
- **The loader is additive — it does not prune.** Articles in the DB whose slug is no
  longer in the source tree (e.g. old hand-seeded or God-Mode-authored rows) are left
  untouched, so re-seeding can never delete content an admin added in the UI. Remove a
  retired seeded article by soft-deleting it explicitly (`HelpArticle.objects
  .filter(slug=...).first().delete()` — reversible via `deleted_at`).

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
