# Agent Development Guide

## Commands

- `pnpm dev` - Start all dev servers (web:3000, admin:3001)
- `pnpm build` - Build all packages and apps
- `pnpm check` - Run all checks (format, lint, types)
- `pnpm check:lint` - OxLint across all packages
- `pnpm check:types` - TypeScript type checking
- `pnpm fix` - Auto-fix format and lint issues
- `pnpm turbo run <command> --filter=<package>` - Target specific package/app
- `pnpm --filter=@plane/ui storybook` - Start Storybook on port 6006

## Team Operations Dashboard QA (local)

Isolated stack: API **http://localhost:8100**, web **http://localhost:3100/acme-qa/dashboards/** (not `pnpm dev` on :3000).

Web loads **`apps/web/.env.dashboard-qa`** via `--mode dashboard-qa`: **`VITE_API_BASE_URL` is empty** — `/api` and `/auth` are proxied to `:8100` on the dev server so **login CSRF stays same-origin**. Open **http://localhost:3100** only.

- `make dashboard-qa` — Docker stack + seed + web (foreground)
- `make dashboard-qa-restart` — **soft** `docker restart` QA API only (keeps DB + Redis sessions)
- `make dashboard-qa-rebuild-api` — rebuild API Docker image after **`apps/api` Python** changes (no seed)
- `make dashboard-qa-status` — health check
- `make dashboard-qa-seed` — **destructive to login sessions** (Redis flush + re-seed); use only if instance broken
- Same via `pnpm dashboard-qa`, `pnpm dashboard-qa:restart`, `pnpm dashboard-qa:status`

While developing: **save files** — web on `:3100` hot-reloads. Do **not** run restart/reseed for normal UI work.

Login: `alice@acme.so` / `password123`, workspace `acme-qa`.

## Code Style

- **Imports**: Use `workspace:*` for internal packages, `catalog:` for external deps
- **TypeScript**: Strict mode enabled, all files must be typed
- **Formatting**: oxfmt, run `pnpm fix:format`
- **Linting**: OxLint with shared `.oxlintrc.json` config
- **Naming**: camelCase for variables/functions, PascalCase for components/types
- **Error Handling**: Use try-catch with proper error types, log errors appropriately
- **State Management**: MobX stores in `packages/shared-state`, reactive patterns
- **Testing**: All features require unit tests, use existing test framework per package
- **Components**: Build in `@plane/ui` with Storybook for isolated development

## Backend tests (Docker)

The Django/pytest suite for `apps/api` runs in an isolated stack defined by `docker-compose-test.yml` at the repo root.

Prereq (once): `./setup.sh` — generates `apps/api/.env` from `.env.example`.

- Full suite: `docker compose -f docker-compose-test.yml up --build --abort-on-container-exit --exit-code-from api-tests`
- Subset: `docker compose -f docker-compose-test.yml run --rm api-tests pytest -m unit`
- Teardown: `docker compose -f docker-compose-test.yml down -v`

See `apps/api/tests/RUNNING_TESTS.md` for the full walkthrough and troubleshooting; see `apps/api/tests/TESTING_GUIDE.md` for test conventions and fixtures.
