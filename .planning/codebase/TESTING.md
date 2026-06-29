---
last_mapped: 2026-06-29
focus: quality
---

# Testing

## Root Checks

- `pnpm check` runs Turbo `check`, which depends on `check:format`, `check:lint`, and `check:types` according to `turbo.json`.
- `pnpm check:lint` runs OxLint across workspace packages.
- `pnpm check:types` runs TypeScript checks, with package-specific scripts.
- `pnpm fix` delegates to format and lint fixes.
- Turbo uses `.npmrc`, `.oxfmtrc.json`, and `.oxlintrc.json` as global dependencies.

## Frontend And Package Tests

- Not every frontend package has a test script; many packages rely on build/lint/type checks.
- `apps/live` has Vitest configured in `apps/live/vitest.config.ts`.
  - Includes: `tests/**/*.test.ts`, `tests/**/*.spec.ts`.
  - Environment: Node.
  - Coverage: V8, including `src/**/*.ts`.
- `packages/codemods` has Vitest configured in `packages/codemods/vitest.config.ts`.
- Existing codemod tests include `packages/codemods/tests/function-declaration.spec.ts` and `packages/codemods/tests/remove-directives.spec.ts`.
- Shared UI has Storybook via `packages/ui/package.json`; use `pnpm --filter=@plane/ui storybook` for isolated component development.

## API Tests

- Django/pytest config is in `apps/api/pytest.ini`.
- Test settings use `DJANGO_SETTINGS_MODULE = plane.settings.test`.
- Test file discovery:
  - files: `test_*.py`
  - classes: `Test*`
  - functions: `test_*`
- Markers:
  - `unit`
  - `contract`
  - `smoke`
  - `slow`
- Default pytest addopts include strict markers, database reuse, disabled migrations, and verbose output.
- Test documentation is in `apps/api/tests/RUNNING_TESTS.md` and `apps/api/tests/TESTING_GUIDE.md`.
- API tests run through Docker using the repo-root `docker-compose-test.yml`.

## API Test Commands

- Full API suite:
  - `docker compose -f docker-compose-test.yml up --build --abort-on-container-exit --exit-code-from api-tests`
- Unit subset:
  - `docker compose -f docker-compose-test.yml run --rm api-tests pytest -m unit`
- Teardown:
  - `docker compose -f docker-compose-test.yml down -v`
- First-run prerequisite:
  - `./setup.sh` to generate `apps/api/.env` from example files.

## CI

- API lint workflow: `.github/workflows/pull-request-build-lint-api.yml`.
  - Runs Ruff for changes under `apps/api/**`.
- Web app workflow: `.github/workflows/pull-request-build-lint-web-apps.yml`.
  - Runs pnpm install, formatting, builds, lint, and type checks using Turbo affected mode.
- Additional workflows include CodeQL, i18n sync check, copyright check, build branch, version checks, and React Doctor.

## Testing Gaps And Risks

- Most React app/package coverage appears to be lint/type/build driven rather than unit-test driven.
- `packages/ui` has Storybook stories but no broad automated visual regression setup visible in the local package scripts.
- `packages/shared-state` has strict linting but no visible package-local test script in its manifest.
- API tests are Docker-dependent; planning phases touching backend logic should budget time for compose startup and teardown.
- Live service has focused Vitest support and is a good place to add tests for collaboration/server changes.

## Practical Verification Guidance

- Frontend-only changes: run targeted `pnpm turbo run check --filter=<package>` when possible, then broaden to `pnpm check` for shared-package changes.
- API changes: run the smallest relevant pytest marker/file through `docker-compose-test.yml`, then broaden if touching shared models/middleware/auth.
- Cross-service changes involving pages/editor/live collaboration should include at least TypeScript checks for affected packages and relevant live/API tests.

