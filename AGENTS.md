# Agent Development Guide

## Commands

- `pnpm dev` - Start all dev servers (web:3000, admin:3001, space:3002, live:3100); the API runs in Docker via `docker-compose-local.yml` on :8000
- `pnpm build` - Build all packages and apps
- `pnpm check` - Run all checks (format, lint, types)
- `pnpm check:lint` - OxLint across all packages
- `pnpm check:types` - TypeScript type checking
- `pnpm fix` - Auto-fix format and lint issues
- `pnpm turbo run <command> --filter=<package>` - Target specific package/app

## Code Style

- **Imports**: Use `workspace:*` for internal packages, `catalog:` for external deps
- **TypeScript**: Strict mode enabled, all files must be typed
- **Formatting**: oxfmt, run `pnpm fix:format`
- **Linting**: OxLint with shared `.oxlintrc.json` config
- **Naming**: camelCase for variables/functions, PascalCase for components/types
- **Error Handling**: Use try-catch with proper error types, log errors appropriately
- **State Management**: MobX stores live in each app's `store/` folder (`apps/web/store`, `apps/space/store`, `apps/admin/store`); stores shared across apps go in `packages/shared-state`
- **Testing**: All features require unit tests, use existing test framework per package
- **Components**: Primitives come from the published `@makeplane/propel` npm package (`@makeplane/propel/components/*`, `elements/*`, `icons`); composite/Plane-specific components live in `@plane/blocks` (`packages/blocks`, subpath imports only, e.g. `@plane/blocks/toast`)

## Backend dependencies (uv)

`apps/api` dependencies are managed with [uv](https://docs.astral.sh/uv/): declared in `apps/api/pyproject.toml`, pinned in `apps/api/uv.lock` (commit both). Groups: `dev` and `test` (installed by default; they use `psycopg-binary`), `production` (gunicorn + the source-built `psycopg-c`; production image and migration-check only). Lint config lives in `apps/api/ruff.toml`.

- uv must be exactly the `required-version` in `apps/api/pyproject.toml` (`uv self update <version>`); bump it together with the uv image in both Dockerfiles
- Set up a local env: `cd apps/api && uv sync`
- Inside the dev/test containers, always pass `--inexact` (`uv sync --inexact`): uv targets the image's system Python there, and an exact sync would uninstall pip
- Add/upgrade a dependency: `uv add <pkg>==<version>` (or `--group test`/`--group dev`), or edit `pyproject.toml` and run `uv lock`
- Run tools: `uv run python manage.py ...`, `uv run ruff check .`

## Migrations

- Generate migrations with `uv run python manage.py makemigrations <app> -n <name>`. The command also rewrites `apps/api/migrations_lockfile.txt`; commit it with the migration and never edit it by hand
- A merge conflict in the lockfile means another PR added a migration to the same app first: merge `preview`, delete your migration, and run `makemigrations` again
- `migration-check.yml` fails a PR that touches migrations when the lockfile does not match the migration graph

## Backend tests (Docker)

The Django/pytest suite for `apps/api` runs in an isolated stack defined by `docker-compose-test.yml` at the repo root.

Prereq (once): `./setup.sh` — generates `apps/api/.env` from `.env.example`.

- Full suite: `docker compose -f docker-compose-test.yml up --build --abort-on-container-exit --exit-code-from api-tests`
- Subset: `docker compose -f docker-compose-test.yml run --rm --build api-tests pytest -m unit`
- Teardown: `docker compose -f docker-compose-test.yml down -v`

See `apps/api/tests/RUNNING_TESTS.md` for the full walkthrough and troubleshooting; see `apps/api/plane/tests/TESTING_GUIDE.md` for test conventions and fixtures.

## Translations

Strings live in `packages/i18n/src/locales/<lang>/<namespace>.json`; `en` is the source of truth and every locale must have the same keys. Use the `translate` skill when changing locale files, and run `pnpm --filter=@plane/i18n sync:check` (CI runs it with `--ci`).

## Pull requests

Open PRs against `preview`. New `.py`, `.ts` and `.tsx` files need the `COPYRIGHT.txt` header (checked in CI, see `COPYRIGHT_CHECK.md`).
