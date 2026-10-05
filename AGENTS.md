# Agent Development Guide

## Commands

- `pnpm dev` - Start frontend dev servers (web:3000, admin:3001, space:3002, live:3100)
- `pnpm build` - Build all packages and apps
- `pnpm check` - Run all checks (format, lint, types)
- `pnpm check:lint` - OxLint across all packages
- `pnpm check:types` - TypeScript type checking
- `pnpm fix` - Auto-fix format and lint issues
- `pnpm turbo run <command> --filter=<package>` - Target specific package/app

## Cloud Agent

`.cursor/environment.json` follows the local setup in CONTRIBUTING.md. The image is only the Cloud Agent toolchain: Node 22.22.0 (`.node-version`), pnpm 11.10.0, and Docker with fuse-overlayfs. It does not install Plane or boot the app.

`bash .cursor/install.sh` is a safe `./setup.sh`. It copies missing `.env` files from the examples, adds `SECRET_KEY` to `apps/api/.env` only when that line is absent, and runs `pnpm install --frozen-lockfile`. It also pulls and builds the images `docker-compose-local.yml` needs. It never overwrites an existing env file and never appends a second `SECRET_KEY`.

`bash .cursor/start.sh` runs `docker compose -f docker-compose-local.yml up -d` and waits until the API is healthy on :8000. The `frontend` terminal runs `pnpm dev` (web :3000, admin :3001, space :3002, live :3100). The `backend` terminal follows compose logs for the API, worker, and beat.

When `stack.sh` lands in the repo, install and start should call that script instead of these compose and pnpm steps.

Do not re-run `./setup.sh` on a checkout that already has `.env` files. It overwrites those files and appends another `SECRET_KEY`.

## Code Style

- **Imports**: Use `workspace:*` for internal packages, `catalog:` for external deps
- **TypeScript**: Strict mode enabled, all files must be typed
- **Formatting**: oxfmt, run `pnpm fix:format`
- **Linting**: OxLint with shared `.oxlintrc.json` config
- **Naming**: camelCase for variables/functions, PascalCase for components/types
- **Error Handling**: Use try-catch with proper error types, log errors appropriately
- **State Management**: MobX stores in `packages/shared-state`, reactive patterns
- **Testing**: All features require unit tests, use existing test framework per package
- **Components**: Primitives come from the published `@makeplane/propel` npm package (`@makeplane/propel/components/*`, `elements/*`, `icons`); composite/Plane-specific components live in `@plane/blocks` (`packages/blocks`, subpath imports only, e.g. `@plane/blocks/toast`)

## Backend tests (Docker)

The Django/pytest suite for `apps/api` runs in an isolated stack defined by `docker-compose-test.yml` at the repo root.

Prereq (once): `./setup.sh` — generates `apps/api/.env` from `.env.example`.

- Full suite: `docker compose -f docker-compose-test.yml up --build --abort-on-container-exit --exit-code-from api-tests`
- Subset: `docker compose -f docker-compose-test.yml run --rm api-tests pytest -m unit`
- Teardown: `docker compose -f docker-compose-test.yml down -v`

See `apps/api/tests/RUNNING_TESTS.md` for the full walkthrough and troubleshooting; see `apps/api/tests/TESTING_GUIDE.md` for test conventions and fixtures.
