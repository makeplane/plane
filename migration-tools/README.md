# Questimus Migration Tools

Tooling for migrating Karol's local markdown tickets/plans into Questimus (Plane fork).
Part of the plan in [`../migration-karol.md`](../migration-karol.md) — read that first.

## Prerequisites

- Node.js 18+ (built-in `fetch`, `FormData`, `Blob`)
- `npm install` in this folder (deps: `gray-matter`, `marked`, `glob`)
- A running Questimus instance (default `http://localhost:7000`)
- An API token: `QUESTIMUS_TOKEN` env var (or `apiKey` in the config file)
- **Pages/projects need the fork change** (migration-karol.md §7.4): add
  `plane.app.middleware.api_authentication.APIKeyAuthentication` to
  `DEFAULT_AUTHENTICATION_CLASSES` in `apps/api/plane/settings/common.py`.
  Without it, only the v1 work-item/state/label endpoints work (token auth).

## Scripts

| Script | Purpose |
|---|---|
| `setup-workspace.js` | Idempotent: ensure projects, states, labels exist (`config/setup.json` = all 10 projects for Phase 1; normalizes Plane's default states to Karol's set) |
| `import-issues.js` | Two-pass importer: markdown tickets/plans → work-items (+ relations) |
| `import-pages.js` | Importer: markdown plan/SP/review docs → pages |
| `import-now.js` | Routes Now.md checkbox items to per-project issues (`config/now-routing.json`) |
| `smoke-test.js` | Phase 1 hierarchy smoke test (Plan → SP → T → Ticket + relation + 409-dedup + created_at + main-API page; `--delete-project` flag) |

All scripts: `--config <file>` + `--dry-run` (print only, no API calls).

## Usage

```powershell
# 1. Setup (creates projects/states/labels/modules if missing)
$env:QUESTIMUS_TOKEN = "plane_api_..."
node setup-workspace.js --config config/legaliosa-v2.json --dry-run
node setup-workspace.js --config config/legaliosa-v2.json

# 2. Import tickets (dry-run first!)
node import-issues.js --config config/legaliosa-v2.json --dry-run
node import-issues.js --config config/legaliosa-v2.json

# 3. Import plan docs as pages
node import-pages.js --config config/legaliosa-v2.json --dry-run
node import-pages.js --config config/legaliosa-v2.json
```

## Idempotency

- Work-items: the v1 API returns **409 + existing id** when `external_source` +
  `external_id` already exist — the importer treats that as "already imported".
- A local state file (`state/<name>.json`) maps source path → work-item id and is
  used to resolve `blocked_by` relations and skip re-imports.
- Pages: state file maps source path → page id.

## Notes

- Descriptions are sent as `description_html` (markdown converted with `marked`;
  the server sanitizes HTML).
- Original ticket `created` dates are preserved via `created_at` (normalized to
  ISO — the v1 serializer rejects date-only strings).
- **Estimates (v1) are NOT paginated lists:** `GET .../estimates/` returns a
  single object (404 if none), `POST .../estimates/` returns 409 if one exists,
  `GET .../estimate-points/` returns a plain array, and
  `POST .../estimate-points/` is a **bulk create expecting a list** — the client
  handles all of these.
- Bot users + tokens are created with the Django management command
  `db/create_bot_user.py` (copy into `apps/api/plane/db/management/commands/` and
  run inside the api container; **re-copy after every api rebuild** — the
  container has no bind mounts).
