# Testing Patterns

**Analysis Date:** 2026-05-03

## Overview

Test coverage is **highly uneven** across the monorepo and reflects three distinct subsystems:

| Surface                                                                                                                                                                                                                                  | Framework                            | Location                   | Status                                                                       |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------ | -------------------------- | ---------------------------------------------------------------------------- |
| `apps/live` (realtime server)                                                                                                                                                                                                            | Vitest 4                             | `apps/live/tests/`         | Active, ~2 test files                                                        |
| `packages/codemods` (jscodeshift transforms)                                                                                                                                                                                             | Vitest 4                             | `packages/codemods/tests/` | Active, ~2 spec files                                                        |
| `apps/web` E2E (Gantt timeline)                                                                                                                                                                                                          | Playwright                           | `apps/web/e2e/`            | Active, **single feature spec on `feature/timeline-dependency-drag`** branch |
| `apps/api` (Django REST + Celery)                                                                                                                                                                                                        | pytest + pytest-django + factory_boy | `apps/api/plane/tests/`    | Active, ~10+ test files across unit/contract/smoke                           |
| `apps/web`, `apps/admin`, `apps/space` (frontend logic & components)                                                                                                                                                                     | None                                 | —                          | **No JS unit/component test harness — do not invent one without asking.**    |
| `packages/ui`, `packages/propel`, `packages/editor`, `packages/services`, `packages/types`, `packages/utils`, `packages/hooks`, `packages/shared-state`, `packages/i18n`, `packages/logger`, `packages/decorators`, `packages/constants` | None                                 | —                          | **No test harness.** Storybook only (`pnpm --filter=@plane/ui storybook`).   |

**Implication:** when adding new code to apps/web/admin/space or shared TS packages, follow the _existing_ code's patterns and rely on `pnpm check` (lint + types + format) plus E2E and API tests as your safety net. Do not introduce Jest/Vitest into a package that lacks one without explicit instruction.

## Test Frameworks

### Vitest (apps/live, packages/codemods)

- **Version:** Vitest 4 (transitively pinned via root `pnpm.overrides`).
- **Config:** `apps/live/vitest.config.ts` (no config file in `packages/codemods` — uses defaults).
- **Globals enabled** in `apps/live` (`globals: true`), so `describe`/`it`/`expect` are auto-imported. `packages/codemods` imports them explicitly: `import { describe, it, expect } from "vitest"`.
- **Environment:** `node` for `apps/live`. None set in codemods (defaults to node).
- **Coverage provider:** `v8` (`apps/live`).
- **Run commands** (from each package directory or root with `--filter`):

  ```bash
  pnpm --filter=live test                # vitest run
  pnpm --filter=live test:watch          # vitest watch
  pnpm --filter=live test:coverage       # vitest run --coverage

  pnpm --filter=@plane/codemods run test # vitest run
  ```

### Playwright (apps/web E2E)

- **Config:** `apps/web/e2e/playwright.config.ts`.
- **Test directory:** `apps/web/e2e/specs/`.
- **Auth setup project:** `apps/web/e2e/auth/auth.setup.ts` (referenced by `setup` project) generates `apps/web/playwright/.auth/user.json` once and the `chromium` project reuses it via `storageState`.
- **Concurrency:** `fullyParallel: false`, `workers: 1` — the suite uses a single shared workspace/project, so parallel runs would race on data.
- **Retries:** `2` on CI (`process.env.CI`), `0` locally.
- **Reporters:** `list` + HTML report at `apps/web/playwright-report/`.
- **Tracing:** `on-first-retry`. Video: `retain-on-failure`. Screenshots: `only-on-failure`.
- **Browser:** Chromium with a `--host-resolver-rules=MAP localhost 127.0.0.1` launch arg (forces IPv4 in environments where `localhost` resolves to `::1`).
- **Run commands** (web `package.json`):

  ```bash
  pnpm --filter=web test:e2e           # playwright test --config=e2e/playwright.config.ts
  pnpm --filter=web test:e2e:ui        # --ui
  pnpm --filter=web test:e2e:debug     # --debug
  pnpm --filter=web test:e2e:install   # playwright install chromium
  ```

  No `pnpm dev` server is auto-started — bring up `docker compose -f docker-compose-local.yml up` and `pnpm dev` manually before running E2E. The base URL defaults to `http://localhost:3000` and is overridable via `E2E_BASE_URL`. A `apps/web/e2e/.env.e2e` file is loaded by the config if present (for `E2E_BASE_URL`, workspace slug, project id, etc.).

### pytest (apps/api)

- **Config:** `apps/api/pytest.ini`.
- **Settings module:** `DJANGO_SETTINGS_MODULE = plane.settings.test` (set in pytest.ini, not via env var).
- **Default flags:** `--strict-markers --reuse-db --nomigrations -vs`. `--reuse-db` caches the test DB across runs; combined with `--nomigrations` it bootstraps schema directly from models for speed. **If you add a model field, drop the test DB or pass `--create-db` once.**
- **Discovery:** `python_files = test_*.py`, `python_classes = Test*`, `python_functions = test_*`.
- **Markers** (declared in pytest.ini, enforced by `--strict-markers`):
  - `unit` — model/serializer/utility tests (isolated)
  - `contract` — API endpoint tests (`tests/contract/api/` for external API, `tests/contract/app/` for web app API)
  - `smoke` — basic end-to-end tests against a `live_server` fixture
  - `slow` — slow tests that may be skipped in some contexts
- **Runner wrapper:** `apps/api/run_tests.py` — see Run commands below. **Do not use `apps/api/run_tests.sh`** (it delegates to a missing path).

## Test File Organization

### apps/live

```
apps/live/tests/
├── lib/pdf/pdf-rendering.test.ts
└── services/pdf-export/effect-utils.test.ts
```

- Mirrors the `src/` directory layout. New tests for `apps/live/src/foo/bar.ts` belong at `apps/live/tests/foo/bar.test.ts`.
- Path alias `@` resolves to `apps/live/src/` inside tests (`apps/live/vitest.config.ts:18`). Import production code via `@/services/pdf-export/effect-utils`, not relative paths.
- Vitest discovery glob: `tests/**/*.test.ts` and `tests/**/*.spec.ts`.

### packages/codemods

```
packages/codemods/tests/
├── function-declaration.spec.ts
└── remove-directives.spec.ts
```

- One spec file per transformer, sibling-imported (`import * as transformer from "../remove-directives"`).
- No alias setup — relative imports are the convention since the package is small.

### apps/web/e2e

```
apps/web/e2e/
├── auth/
│   └── auth.setup.ts        # Logs in once, persists storageState
├── fixtures/
│   ├── api.ts               # Authenticated APIRequestContext + issue CRUD helpers
│   ├── env.ts               # E2E env vars (workspaceSlug, projectId, apiBaseURL)
│   └── test-fixtures.ts     # Composes Page Object + API fixtures into Playwright `test`
├── pages/
│   └── timeline.page.ts     # Page Object Model for the Gantt timeline
├── specs/
│   └── timeline-dependency-drag.spec.ts
├── playwright.config.ts
└── README.md
```

- **Page Object Model** convention: one class per screen/feature, e.g. `TimelinePage` (`apps/web/e2e/pages/timeline.page.ts:6`). Page methods do all DOM interaction; specs only assert.
- **Fixtures over `beforeEach`**: composed in `apps/web/e2e/fixtures/test-fixtures.ts` via `base.extend<Fixtures>({ ... })`. Each spec imports `import { test, expect } from "../fixtures/test-fixtures"`. Cleanup runs after `use(...)` and uses `Promise.allSettled` so failures still tear down.

### apps/api

```
apps/api/plane/tests/
├── README.md
├── TESTING_GUIDE.md
├── apps.py
├── conftest.py              # Shared fixtures: api_client, api_key_client, session_client, workspace, ...
├── conftest_external.py
├── factories.py             # factory_boy: UserFactory, WorkspaceFactory, ProjectFactory, ...
├── unit/
│   ├── bg_tasks/test_*.py
│   ├── middleware/test_db_routing.py
│   ├── models/test_*.py
│   ├── serializers/test_*.py
│   ├── settings/test_storage.py
│   └── utils/test_*.py
├── contract/
│   ├── api/                 # External API (/api/v1/, X-Api-Key auth)
│   │   ├── test_cycles.py
│   │   └── test_labels.py
│   └── app/                 # Web app API (/api/, session auth)
│       ├── test_workspace_app.py
│       ├── test_authentication.py
│       ├── test_project_app.py
│       └── test_api_token.py
└── smoke/
    └── test_auth_smoke.py
```

- See `apps/api/plane/tests/README.md` and `apps/api/plane/tests/TESTING_GUIDE.md` for the maintainer-authored guide.
- **API vs App split**: external API tests use `api_key_client` (X-Api-Key); web app API tests use `session_client` (CSRF disabled, `force_authenticate`).

## Test Structure Patterns

### Vitest (apps/live example)

```typescript
// apps/live/tests/services/pdf-export/effect-utils.test.ts
import { describe, it, expect, assert } from "vitest";
import { Effect, Duration, Either } from "effect";
import { withTimeoutAndRetry, recoverWithDefault, tryAsync } from "@/services/pdf-export/effect-utils";

describe("effect-utils", () => {
  describe("withTimeoutAndRetry", () => {
    it("should succeed when effect completes within timeout", async () => {
      const effect = Effect.succeed("success");
      const wrapped = withTimeoutAndRetry("test-operation")(effect);
      const result = await Effect.runPromise(wrapped);
      expect(result).toBe("success");
    });

    it("should fail with PdfTimeoutError when effect exceeds timeout", async () => {
      const slowEffect = Effect.gen(function* () {
        yield* Effect.sleep(Duration.millis(500));
        return "success";
      });
      const wrapped = withTimeoutAndRetry("test-operation", { timeoutMs: 50, maxRetries: 0 })(slowEffect);
      const result = await Effect.runPromise(Effect.either(wrapped));
      assert(Either.isLeft(result), "Expected Left but got Right");
      expect(result.left).toBeInstanceOf(PdfTimeoutError);
    });
  });
});
```

- **Nested `describe` blocks** name the function under test (outer) and the behavior (inner).
- **Test names start with `should …`** (lowercase, English).
- **`assert(...)` from Vitest** for type-narrowing assertions before `expect` chains (`Either.isLeft(result)` narrows the union).
- **Async tests use `async (): Promise<void>` arrows** and `await` rather than callbacks.

### Vitest (codemods example)

```typescript
// packages/codemods/tests/remove-directives.spec.ts
import { describe, it, expect } from "vitest";
import { applyTransform } from "@hypermod/utils";
import * as transformer from "../remove-directives";

describe("remove-directives", () => {
  it("should remove 'use client' directive", async () => {
    const result = await applyTransform(transformer, `...input...`, { parser: "tsx" });
    expect(result).toMatchInlineSnapshot(`"...expected output..."`);
  });
});
```

- **`@hypermod/utils.applyTransform`** is the standard runner for jscodeshift transformers.
- **Inline snapshots** (`toMatchInlineSnapshot`) are the assertion style; Vitest will auto-update them with `vitest run -u`.
- Specify `parser` per case (`"ts"` vs `"tsx"`).

### Playwright (E2E)

```typescript
// apps/web/e2e/specs/timeline-dependency-drag.spec.ts
import { test, expect } from "../fixtures/test-fixtures";

test.describe("timeline dependency drag", () => {
  test("#1 right handle drag to left edge creates blocking relation", async ({ page, timeline, issuePair }) => {
    const { src, tgt } = issuePair;

    const responsePromise = page.waitForResponse(
      (r) => r.url().includes(`/issues/${src.id}/issue-relation/`) && r.request().method() === "POST",
      { timeout: 10_000 }
    );

    await timeline.dragRightTo(src.id, tgt.id);

    const resp = await responsePromise;
    expect(resp.status()).toBe(201);
    expect(resp.request().postDataJSON()).toMatchObject({
      relation_type: "blocking",
      issues: [tgt.id],
    });

    await expect(page.locator(`[data-dependency-key="${src.id}-blocking-${tgt.id}"]`)).toBeVisible();
  });
});
```

- **`test.describe` block per feature**, `test("#N description", ...)` per scenario. The `#N` numbers map to manual test cases in the spec doc.
- **Fixtures destructured from `{ page, timeline, issuePair }`** — never call `new TimelinePage(page)` inside a test.
- **Network assertions via `page.waitForResponse`** filtered by URL regex + method, then assert `status()` and `request().postDataJSON()` payload via `toMatchObject`.
- **DOM assertions via `data-*` attributes** (`data-block-id`, `data-dependency-key`, `aria-label`). Tests deliberately avoid CSS class selectors.
- **Japanese inline comments** are common in this directory; preserve them when editing.

### pytest (apps/api)

```python
# apps/api/plane/tests/contract/api/test_cycles.py
import pytest
from rest_framework import status

@pytest.mark.contract
class TestCycleListCreateAPIEndpoint:
    """Test Cycle List and Create API Endpoint"""

    def get_cycle_url(self, workspace_slug, project_id):
        return f"/api/v1/workspaces/{workspace_slug}/projects/{project_id}/cycles/"

    @pytest.mark.django_db
    def test_create_cycle_success(self, api_key_client, workspace, project, cycle_data):
        url = self.get_cycle_url(workspace.slug, project.id)
        response = api_key_client.post(url, cycle_data, format="json")
        assert response.status_code == status.HTTP_201_CREATED
```

```python
# apps/api/plane/tests/unit/utils/test_uuid.py
@pytest.mark.unit
class TestUUIDUtils:
    """Test the UUID utilities"""

    def test_is_valid_uuid_with_valid_uuid(self):
        valid_uuid = str(uuid.uuid4())
        assert is_valid_uuid(valid_uuid) is True
```

- **Class-based tests** named `Test<Subject>` with `test_<scenario>` methods. (Required by pytest.ini's `python_classes = Test*` and `python_functions = test_*`.)
- **Marker on the class**, not on each method, when all methods share the same category. `@pytest.mark.django_db` goes on individual methods that need DB access (or use a fixture that does).
- **`force_authenticate(user=...)`** for app API tests (`session_client` fixture); **`HTTP_X_API_KEY` header** for external API tests (`api_key_client` fixture).
- **Plain `assert` statements** with optional message strings — no `unittest.TestCase`-style assertions.
- **URL helper methods** like `get_cycle_url(...)` keep tests DRY when several methods share an endpoint.

## Mocking

### Vitest

- `apps/live` uses **dependency injection at function boundaries** rather than module mocking. The `effect-utils` tests pass real `Effect` programs and observe behavior; no `vi.mock()` is used.
- For HTTP/Redis, `apps/live` tests should construct fakes (e.g. an in-memory Redis adapter) and pass them in. There is no project convention yet for mocking Hocuspocus — add one as needed and document.
- `vi.mock()`, `vi.spyOn()`, and `vi.fn()` are all available; use them sparingly to keep tests readable.

### Playwright

- **No mocking of the API.** Tests run against a real Django backend (`docker-compose-local.yml` stack) and create real data via the `Api` fixture.
- **`apps/web/e2e/fixtures/api.ts`** authenticates with the persisted storageState, fetches a CSRF token from `/auth/get-csrf-token/`, and exposes typed CRUD helpers (`createIssue`, `deleteIssue`). Each test gets its own `api` instance and disposes it after use.
- **`issuePair` fixture** creates two issues with unique names per test (`e2e-src-${suffix}-${Date.now()}`) and tears them down with `Promise.allSettled` so failures don't leak data.
- **DOM event simulation:** mouse drag uses `dispatchEvent("mousedown", ...)` to bypass `pointer-events:none` on hidden Gantt handles, then `page.mouse.move(...)` + `page.mouse.up()` to drive the document-level listeners (`apps/web/e2e/pages/timeline.page.ts:48`).

### pytest

Per `apps/api/plane/tests/TESTING_GUIDE.md`:

- **`mock_redis`** — mocks Redis interactions
- **`mock_elasticsearch`** — mocks Elasticsearch interactions
- **`mock_celery`** — mocks Celery task execution

Use these fixtures rather than monkey-patching at the module level. Real Redis/Elasticsearch/Celery integrations are tested only in `smoke` tests against `plane_server` (the `live_server` alias).

### Factories (apps/api)

`apps/api/plane/tests/factories.py` provides factory_boy factories for common fixtures:

```python
from plane.tests.factories import UserFactory, WorkspaceFactory

user = UserFactory()
workspace = WorkspaceFactory(owner=user)
users = UserFactory.create_batch(5)
```

Available factories include `UserFactory`, `WorkspaceFactory`, `WorkspaceMemberFactory`, `ProjectFactory`, `ProjectMemberFactory`. **Prefer factories over hand-built `Model.objects.create(...)`** for new tests; the existing `conftest.py` fixtures predate factory_boy and use direct `objects.create` — that's fine to maintain, but new fixtures should use factories.

## Fixtures

### Vitest

No shared fixture infrastructure — tests construct what they need inline. Mirror the production module under `tests/` and use `import` to bring in helpers.

### Playwright (`apps/web/e2e/fixtures/test-fixtures.ts`)

```typescript
type Fixtures = {
  api: Api;
  issuePair: { src: CreatedIssue; tgt: CreatedIssue };
  timeline: TimelinePage;
};

export const test = base.extend<Fixtures>({
  api: async ({}, use) => {
    const api = await createApi();
    await use(api);
    await api.dispose();
  },
  issuePair: async ({ api }, use, testInfo) => {
    const suffix = `${testInfo.title.replace(/\s+/g, "-").slice(0, 40)}-${Date.now()}`;
    const [src, tgt] = await Promise.all([
      api.createIssue(`e2e-src-${suffix}`, { start: 0, end: 3 }),
      api.createIssue(`e2e-tgt-${suffix}`, { start: 4, end: 7 }),
    ]);
    await use({ src, tgt });
    await Promise.allSettled([api.deleteIssue(src.id), api.deleteIssue(tgt.id)]);
  },
  timeline: async ({ page, issuePair }, use) => {
    const tp = new TimelinePage(page);
    await tp.gotoIssueGantt();
    await tp.waitForBlock(issuePair.src.id);
    await tp.waitForBlock(issuePair.tgt.id);
    await use(tp);
  },
});
```

- Fixtures **compose**: `timeline` depends on `issuePair` which depends on `api`.
- **Cleanup runs after `use(...)` returns** and uses `Promise.allSettled` so failed teardown of one resource doesn't block another.
- **Test-specific suffixes** (`testInfo.title`) keep created data identifiable when triaging leaks.

### pytest (`apps/api/plane/tests/conftest.py`)

Top-level fixtures:

| Fixture                     | Purpose                                                                             |
| --------------------------- | ----------------------------------------------------------------------------------- |
| `api_client`                | Unauthenticated DRF `APIClient`                                                     |
| `user_data`                 | Standard user dict (`email`, `password`, `first_name`, `last_name`)                 |
| `create_user`               | Creates a `User` with `set_password`                                                |
| `api_token`                 | Creates an `APIToken` for `create_user`                                             |
| `api_key_client`            | `APIClient` with `HTTP_X_API_KEY=token.token` — for **external API** tests          |
| `session_client`            | `APIClient` with `force_authenticate(user=create_user)` — for **web app API** tests |
| `create_bot_user`           | Bot user with unique email                                                          |
| `api_token_data`            | Sample token payload (label, description, expired_at)                               |
| `create_api_token_for_user` | Token bound to `create_user` with `user_type=0`                                     |
| `plane_server`              | Aliases `live_server` to avoid name clashes — used by `smoke` tests                 |
| `workspace`                 | `Workspace` + `WorkspaceMember(role=20)` for `create_user`                          |

Resource-specific fixtures (e.g. `project`, `cycle_data`, `create_cycle`) live next to the tests that use them — see `apps/api/plane/tests/contract/api/test_cycles.py:14`.

## Coverage

### apps/live

```bash
pnpm --filter=live test:coverage
```

`apps/live/vitest.config.ts:9` configures v8 coverage with `text`, `json`, `html` reporters covering `src/**/*.ts` excluding `.d.ts` and `types.ts` files. **No threshold is enforced.**

### apps/api

```bash
cd apps/api && python run_tests.py --coverage    # term + html
```

`apps/api/run_tests.py:38` runs `pytest --cov=plane --cov-report=term --cov-report=html`, then enforces:

```bash
python -m coverage report --fail-under=90
```

**Coverage threshold is 90%.** If your change drops coverage below 90%, the runner exits non-zero. The TESTING_GUIDE.md explicitly says "Aim for ≥90% code coverage for critical components."

### Playwright

No coverage instrumentation — Playwright produces a trace + HTML report, not coverage.

### packages/codemods

No coverage configured.

## Test Types

### Unit Tests

- **apps/live**: pure-function tests in `tests/lib/` and `tests/services/` mirroring `src/`.
- **apps/api**: anything under `tests/unit/` with `@pytest.mark.unit`. Test models, serializers, utility functions in isolation.
- **packages/codemods**: every transformer should have a `*.spec.ts` with snapshot tests of representative inputs.

### Contract Tests (apps/api)

Two flavors:

- **`tests/contract/api/`** — external API at `/api/v1/`, X-Api-Key auth, `@pytest.mark.contract` + `@pytest.mark.django_db`, `api_key_client` fixture.
- **`tests/contract/app/`** — web app API at `/api/`, session auth, `session_client` fixture.

Test the contract: status codes, response shapes, validation errors. Do not duplicate Django/DRF behavior tests.

### Smoke Tests (apps/api)

`tests/smoke/` — basic end-to-end flows (login, create workspace, etc.) that boot a `plane_server` fixture (`live_server`) and hit it with the `requests` library. Marked `@pytest.mark.smoke`. Use sparingly; smoke tests are slow.

### E2E Tests (apps/web)

Playwright-driven user flows. Currently scoped to **timeline dependency drag** (`apps/web/e2e/specs/timeline-dependency-drag.spec.ts`) on the `feature/timeline-dependency-drag` branch. Each spec creates real data via the API fixture, drives the UI, and asserts both the network request and the resulting DOM state.

### Integration Tests

There is no formal "integration" tier. Cross-module behavior is covered via:

- contract tests (frontend-to-backend HTTP contracts implicitly)
- smoke tests (end-to-end flows in apps/api)
- E2E tests (full-stack browser tests)

## Common Patterns

### Async Testing

**Vitest:**

```typescript
it("should resolve on success", async () => {
  const result = await Effect.runPromise(wrapped);
  expect(result).toBe("success");
});
```

**Playwright:**

```typescript
const responsePromise = page.waitForResponse(
  (r) => r.url().includes("/issue-relation/") && r.request().method() === "POST",
  { timeout: 10_000 }
);
await timeline.dragRightTo(src.id, tgt.id);
const resp = await responsePromise;
```

Always set up `waitForResponse` **before** the action that triggers the network request — otherwise you race the response.

**pytest:** Django views are synchronous; tests are synchronous. For Celery tasks, use the `mock_celery` fixture.

### Error Testing

**Vitest:**

```typescript
const result = await Effect.runPromise(Effect.either(wrapped));
assert(Either.isLeft(result), "Expected Left but got Right");
expect(result.left).toBeInstanceOf(PdfTimeoutError);
```

**pytest:**

```python
def test_create_cycle_invalid_dates(self, api_key_client, workspace, project):
    response = api_key_client.post(url, {"start_date": "2030-01-01", "end_date": "2020-01-01"})
    assert response.status_code == status.HTTP_400_BAD_REQUEST
```

### Test Data

- **TS:** inline literals; create helpers in `tests/helpers/` only when reused across many specs.
- **Python:** factory_boy factories from `apps/api/plane/tests/factories.py`, or per-test fixtures in module-local `conftest.py`/test files.
- **E2E:** API helpers in `apps/web/e2e/fixtures/api.ts` (`createIssue`, `deleteIssue`). Add new helpers there as they're needed.

## Pre-commit and CI Gates

### Pre-commit

`.husky/pre-commit` → `pnpm lint-staged`:

- All staged `.{js,jsx,ts,tsx,cjs,mjs,cts,mts,json,css,md}` → `oxfmt --no-error-on-unmatched-pattern`
- All staged `.{js,jsx,ts,tsx,cjs,mjs,cts,mts}` → `oxlint --fix --deny-warnings`

**Tests do not run pre-commit** — they are too slow. Run them locally before pushing.

### CI — Frontend (`.github/workflows/pull-request-build-lint-web-apps.yml`)

Triggered on pull requests to `preview`. Three parallel jobs scoped via `--affected`:

1. **`check:format`** — `pnpm turbo run check:format --affected` (oxfmt --check)
2. **`build`** — `pnpm turbo run build --affected` (required by `check:types`)
3. **`check:lint`** — `pnpm turbo run check:lint --affected` (oxlint with per-package `--max-warnings`)
4. **`check:types`** — `pnpm turbo run check:types --affected` (after `build`)

**Vitest tests for `apps/live` and `packages/codemods` are not in CI.** Run them locally.

**Playwright tests are not in CI.** They require the full docker stack and a logged-in workspace; run locally with `pnpm --filter=web test:e2e`.

### CI — Backend (`.github/workflows/pull-request-build-lint-api.yml`)

Triggered on PRs to `preview` when files under `apps/api/**` change:

- **`lint-api`** — `ruff check --fix apps/api`

**pytest is not in CI.** Run via `apps/api/run_tests.py` locally.

### Other CI

- `.github/workflows/copyright-check.yml` enforces the file header block on TS/Python files.
- `.github/workflows/codeql.yml` runs CodeQL security analysis.

## Run Commands Cheat Sheet

```bash
# Vitest
pnpm --filter=live test                 # apps/live unit tests
pnpm --filter=live test:watch
pnpm --filter=live test:coverage
pnpm --filter=@plane/codemods run test  # codemod transformer tests

# Playwright (apps/web)
pnpm --filter=web test:e2e:install      # one-time chromium install
pnpm --filter=web test:e2e              # full run
pnpm --filter=web test:e2e:ui           # interactive UI mode
pnpm --filter=web test:e2e:debug        # debug mode

# pytest (apps/api)
cd apps/api && python run_tests.py                  # all
cd apps/api && python run_tests.py -u               # unit only
cd apps/api && python run_tests.py -c               # contract only
cd apps/api && python run_tests.py -s               # smoke only
cd apps/api && python run_tests.py --coverage       # coverage with --fail-under=90
cd apps/api && python run_tests.py --parallel       # pytest-xdist -n auto
cd apps/api && DJANGO_SETTINGS_MODULE=plane.settings.test pytest plane/tests/unit/utils/test_uuid.py::TestUUIDUtils::test_is_valid_uuid_with_valid_uuid

# Whole-repo gate (does NOT run tests)
pnpm check                              # check:format + check:lint + check:types
```

---

_Testing analysis: 2026-05-03_
