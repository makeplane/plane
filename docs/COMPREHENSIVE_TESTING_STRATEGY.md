# Comprehensive Testing Strategy for Plane

## Context

The Plane monorepo has virtually no automated testing enforcement. Backend has 68 test files but they **never run in CI** — only Ruff linting runs. Frontend has **zero tests** across web/admin/space apps, zero tests in MobX stores, zero tests in the service layer, and zero in component libraries. CI currently runs only format/lint/type checks. The result: regressions ship to production, team lacks confidence pushing, and customers are impacted.

This plan establishes a layered testing strategy that catches regressions **without slowing down development**. It is phased so the team gets immediate value before committing to large test-writing efforts.

---

## Part 0: Exact Packages to Use

### Backend (Python) — Testing Stack

| Package | Version | Purpose | Install |
|---------|---------|---------|---------|
| `pytest` | 7.4.0 | Test runner (already installed) | `requirements/test.txt` |
| `pytest-django` | 4.5.2 | Django integration, `@pytest.mark.django_db` (already installed) | `requirements/test.txt` |
| `pytest-cov` | 4.1.0 | Coverage reporting (already installed) | `requirements/test.txt` |
| `pytest-xdist` | 3.3.1 | Parallel test execution via `-n auto` (already installed) | `requirements/test.txt` |
| `pytest-mock` | 3.11.1 | `mocker` fixture for clean mocking (already installed) | `requirements/test.txt` |
| `factory-boy` | 3.3.0 | Test data factories (already installed) | `requirements/test.txt` |
| `freezegun` | 1.2.2 | Time travel for date-dependent tests (already installed) | `requirements/test.txt` |
| `coverage` | 7.2.7 | Coverage measurement (already installed) | `requirements/test.txt` |
| `httpx` | 0.24.1 | Async HTTP testing (already installed) | `requirements/test.txt` |

**You already have all Python testing packages installed.** The file is `apps/api/requirements/test.txt`. Nothing new needs to be added. The issue is not missing packages — it's that these are never run in CI.

**Do NOT add**: `unittest` (use pytest instead), `nose` (deprecated), `selenium` (use Playwright for E2E), `responses` (use `pytest-mock` or `httpx` mocking instead), `pytest-factoryboy` (factory-boy standalone is sufficient).

### Frontend (TypeScript) — Testing Stack

| Package | Version | Purpose | Where to Install |
|---------|---------|---------|-----------------|
| `vitest` | `^4.0.8` | Test runner (already in `apps/live`, `packages/codemods`) | Each package that needs tests |
| `@vitest/coverage-v8` | `^4.0.8` | Coverage for Vitest (already in `apps/live`) | Each package that needs coverage |
| `happy-dom` | latest | Lightweight DOM environment for component tests | Packages testing React components |
| `@testing-library/react` | `^16.x` | React component testing utilities | `packages/propel`, `apps/web` (Phase 3+) |
| `@testing-library/user-event` | `^14.x` | Simulating user interactions (click, type, drag) | Same as above |
| `@testing-library/jest-dom` | `^6.x` | Custom DOM matchers (`toBeVisible`, `toHaveClass`) | Same as above |
| `msw` | `^2.x` | API mocking (Mock Service Worker) | `apps/web` (Phase 4 only, for E2E) |
| `@playwright/test` | `^1.49.x` | E2E browser testing | `apps/web` (Phase 4 only) |
| `@storybook/test` | `^10.x` | Storybook interaction testing | `packages/propel` (Phase 3) |

**Install order by phase**:
- **Phase 1**: `vitest` only (already available) → add to `packages/utils`, `packages/shared-state`
- **Phase 2**: No new packages — just use vitest
- **Phase 3**: `happy-dom`, `@testing-library/react`, `@testing-library/user-event`, `@testing-library/jest-dom`, `@storybook/test`
- **Phase 4**: `@playwright/test`, `msw`

**Do NOT install**: `jest` (inconsistent with existing vitest setup — silo already uses Jest but new tests should use Vitest), `cypress` (Playwright is better for your collaborative editing multi-tab needs), `enzyme` (dead project), `react-test-renderer` (deprecated in React 18), `jsdom` (use `happy-dom` instead — 2-3x faster).

### Why These Specific Choices

- **Vitest over Jest**: Already adopted in `apps/live` and `packages/codemods`. Native Vite compatibility (your build tool). Same API as Jest so the team won't need to learn new syntax. Faster than Jest due to native ESM support.
- **happy-dom over jsdom**: 2-3x faster DOM simulation. Lighter memory footprint. Sufficient for component tests. (jsdom is only needed if you test browser APIs not supported by happy-dom — which Plane doesn't.)
- **Playwright over Cypress**: Multi-tab support needed for collaborative editing (Hocuspocus). Better parallel execution. Native browser contexts. Better performance. Cypress cannot test multi-tab scenarios at all.
- **MSW over nock/axios-mock-adapter**: MSW intercepts at the network level, not the library level. This means your tests work regardless of whether you use axios, fetch, or anything else. Also works in both Node and browser environments.

---

## Part 1: Testing Philosophy — What to Test and What NOT to Test

### The "Types Replace Tests" Claim — Addressed

**What TypeScript strict mode DOES catch** (~30% of what tests catch):
- Null/undefined access, wrong argument types, missing required fields, incorrect return types

**What types CANNOT catch** (the other 70% — where your regressions live):
- **API contract drift**: A Django serializer field rename passes all Python linting but silently breaks the frontend
- **Permission logic**: Types can't verify that a GUEST user cannot delete a project
- **Business rules**: "When an issue moves to Done, notify subscribers" — types can't verify side effects
- **MobX computed values**: Types verify the shape, not whether the computation is correct
- **Edge cases**: Empty arrays, boundary dates, Unicode in slugs, concurrent modifications

**Verdict**: Tighten TypeScript strictness (free wins), but types are NOT a substitute for behavioral tests. The highest-risk regressions in Plane are behavioral.

### What to Test (High ROI)

| Layer | What to Test | Why |
|-------|-------------|-----|
| API endpoints | Request → Response shape, status codes | This is the FE/BE contract — #1 regression source |
| Permissions | Role-based access (ADMIN/MEMBER/GUEST/non-member) | Security regressions are the worst kind |
| Serializers | Field presence, validation, read-only enforcement | Shape changes break the frontend |
| Celery tasks | Core logic (notification, webhook, deletion) | These fail silently in production |
| `@plane/utils` | Pure utility functions (dates, strings, validation) | Easiest to test, used everywhere |
| `@plane/shared-state` | MobX store actions and computed values | Business logic with no DOM dependency |
| Bug fixes | Reproduce the bug before fixing | If it broke once, it will break again |

### What NOT to Test (Low ROI — Skip These)

- Thin DRF ViewSet wrappers with no custom logic
- Purely presentational React components (just divs with Tailwind)
- Auto-generated migrations
- Simple pass-through axios service methods
- Import/export barrel files (`index.ts`)
- CSS/styling-only changes

---

## Part 2: Implementation Plan

### Phase 1: Quick Wins (2-3 days) — Immediate Regression Catching

**Goal**: Activate existing tests in CI + add first frontend tests. Zero new backend test code needed.

#### 1.1 Run existing backend tests in CI

**File**: `.github/workflows/pull-request-build-lint-api.yml`

Add a `test-api` job after the existing `lint-api` job with PostgreSQL 15 and Redis service containers. Run `pytest -m "unit or contract" --tb=short -q` against the existing 68 test files using `DJANGO_SETTINGS_MODULE=plane.settings.test`.

This is the single highest-impact change — it activates tests that already exist but nobody enforces.

#### 1.2 Optimize test settings for speed

**File**: `apps/api/plane/settings/test.py`

Add:
```python
PASSWORD_HASHERS = ["django.contrib.auth.hashers.MD5PasswordHasher"]
CELERY_TASK_ALWAYS_EAGER = True
CELERY_TASK_EAGER_PROPAGATES = True
```

MD5 password hashing makes user creation ~10x faster in tests. Eager Celery makes tasks execute synchronously (no broker needed).

#### 1.3 Add first frontend tests — `@plane/utils`

**Files to create/modify**:
- `packages/utils/vitest.config.ts` (new — use `apps/live/vitest.config.ts` as template, `environment: "node"`)
- `packages/utils/package.json` (add `"test": "vitest run"` script, add `vitest` devDependency)
- `packages/utils/src/__tests__/datetime.test.ts` (new — 10-15 tests for most-used date functions)
- `packages/utils/src/__tests__/string.test.ts` (new — 5-10 tests)

These are pure functions, no DOM, no mocking. Easiest possible frontend tests.

#### 1.4 Add frontend test job to CI

**File**: `.github/workflows/pull-request-build-lint-web-apps.yml`

Add a `test` job (needs `build`) that runs `pnpm turbo run test --affected`. Since `turbo.json` already defines a `test` task with `dependsOn: ["^build"]`, this works out of the box once packages have test scripts.

#### 1.5 Do NOT add tests to pre-commit hooks

Keep the pre-commit hook as-is (Prettier + ESLint via `lint-staged`). Tests need Postgres/Redis (backend) or built packages (frontend) — they belong in CI only.

---

### Phase 2: Foundation (1-2 weeks) — Cover the Riskiest Areas

**Goal**: Test permissions, critical API endpoints, MobX stores, and add missing factories.

#### 2.1 Add missing test factories

**File**: `apps/api/plane/tests/factories.py`

Add factories for: `StateFactory`, `IssueFactory` (depends on StateFactory), `LabelFactory`, `CycleFactory`, `ModuleFactory`, `CommentFactory`. Follow the existing pattern (DjangoModelFactory, uuid4 IDs, LazyFunction timestamps).

These factories are needed for all subsequent contract tests.

#### 2.2 Permission contract tests (highest security value)

**New files**:
- `apps/api/plane/tests/contract/app/test_issue_permissions.py`
- `apps/api/plane/tests/contract/app/test_project_permissions.py`
- `apps/api/plane/tests/contract/app/test_page_permissions.py`

For each permission-protected endpoint, test:
- ADMIN can perform the action
- MEMBER can/cannot (depending on the decorator)
- GUEST is denied (403)
- Non-member is denied (403)

Pattern: Create users with different roles using factories, authenticate each, hit the endpoint, assert status code.

#### 2.3 Issue CRUD contract tests

**New file**: `apps/api/plane/tests/contract/app/test_issue_crud.py`

Test the full issue lifecycle:
- Create issue (201), with all field types
- Get issue (200), verify response shape
- List issues with filters (200)
- Update issue (200), verify fields changed
- Soft delete issue (204), verify `deleted_at` set
- Error cases: invalid state (400), bad project ID (404), missing name (400)

Issues are the core of the product — this is where most regressions live.

#### 2.4 MobX store tests

**Files to create/modify**:
- `packages/shared-state/vitest.config.ts` (new)
- `packages/shared-state/package.json` (add test script + vitest)
- `packages/shared-state/src/store/__tests__/filter.store.test.ts` (new)

MobX stores are plain classes — instantiate, call actions, assert on observables/computeds. No DOM rendering needed. Focus on:
- Filter stores (most complex computed logic)
- Any store with non-trivial `computed` or `action` methods

#### 2.5 Tighten TypeScript strictness (free regression prevention)

**File**: `apps/web/tsconfig.json`

Re-enable these disabled strict checks one at a time:
1. `noImplicitReturns: true` (catches functions that forget to return)
2. `noUnusedLocals: true` (catches dead code)

Fix resulting errors. These are free catches that cost nothing at runtime. Do NOT try to enable all 6 disabled checks at once — do them incrementally across PRs.

---

### Phase 3: Coverage Expansion (2-4 weeks, ongoing)

**Goal**: Systematically increase coverage for critical backend modules.

#### 3.1 Serializer unit tests

For each serializer in `apps/api/plane/app/serializers/`:
- Verify correct fields in output
- Verify read-only fields can't be set
- Verify required field validation
- Verify nested serializer expansion

Priority order: IssueSerializer > ProjectSerializer > WorkspaceSerializer > CycleSerializer > ModuleSerializer

#### 3.2 Celery task unit tests

Priority tasks to test (based on impact of silent failure):
1. `issue_activities_task.py` — Activity tracking on every issue change
2. `notification_task.py` — Notification delivery
3. `webhook_task.py` — External webhook delivery
4. `deletion_task.py` — Cascade soft-deletion
5. `issue_automation_task.py` — Auto-close, auto-archive, auto-remind

Use existing pattern from `tests/unit/bg_tasks/` — call the task function directly (not `.delay()`), mock external dependencies with `conftest_external.py` fixtures.

#### 3.3 Coverage reporting in CI

Add `pytest --cov=plane --cov-report=xml` to the CI test command. Upload to Codecov. Show coverage diff as a PR comment. Do NOT set blocking gates yet — just make coverage visible.

#### 3.4 Storybook interaction tests for `@plane/propel`

Add `play` functions to existing stories for interactive components:
- Button, Dialog, Combobox, Command, Menu, Input, Switch, Tabs (10 components)
- Run via Storybook test runner in CI
- Skip purely visual components (Badge, Spinner, Skeleton, Separator)

#### 3.5 Frontend utility expansion

As developers touch files in `@plane/utils`, they add tests for functions they modify. Target: full coverage of `datetime.ts`, `string.ts`, `array.ts`, `validation.ts`.

---

### Phase 4: Advanced (Month 2+)

**Goal**: Full deployment confidence with E2E and visual regression.

#### 4.1 Playwright E2E tests (5 critical flows only)

Set up Playwright in `apps/web`. Test only:
1. Sign in → Sign out
2. Create workspace → Create project → Create issue
3. Update issue (state, assignee, priority)
4. Create and edit a page
5. Search for an issue

Use Playwright (not Cypress) — better multi-tab support needed for collaborative editing features.

#### 4.2 Drag-and-Drop Testing Strategy

Your codebase uses **Atlassian Pragmatic Drag and Drop** (`@atlaskit/pragmatic-drag-and-drop` v1.7.7) across 50+ files with 9+ distinct use cases: Kanban board, list views, sidebar projects, favorites (nested), timeline/Gantt, pages, labels, widgets, and base layouts. This is very complex DnD with cross-container dragging, nested hierarchies, auto-scrolling, and custom drag previews.

**The DnD testing strategy has 3 layers:**

**Layer 1: Unit test the sort/order logic (Vitest, Phase 2)**

The DnD operations ultimately call pure functions that calculate new sort orders. These are the most regression-prone part and the easiest to test. Test the functions that compute:
- New `sort_order` values when an item is moved between positions
- Fractional sort order calculations (the `getInstructionFromPayload` logic)
- "Make child" vs "reorder above/below" instruction resolution
- Cross-group moves (e.g., moving an issue from "In Progress" column to "Done" column — the state change logic)

These are pure functions that take a source position, destination position, and list of items, and return the new order. No DOM needed.

```typescript
// Example: test the sort order calculation
import { describe, it, expect } from "vitest";
import { getNewSortOrder } from "../helpers";

describe("getNewSortOrder", () => {
  it("places item between two existing items", () => {
    const result = getNewSortOrder(10000, 20000, "reorder-above");
    expect(result).toBeGreaterThan(10000);
    expect(result).toBeLessThan(20000);
  });

  it("places item at end when no next item", () => {
    const result = getNewSortOrder(10000, undefined, "reorder-below");
    expect(result).toBeGreaterThan(10000);
  });

  it("handles cross-group move with state change", () => {
    const result = handleGroupMove({
      sourceGroupId: "in-progress",
      destinationGroupId: "done",
      issueId: "issue-1",
    });
    expect(result.newState).toBe("done");
    expect(result.sortOrder).toBeDefined();
  });
});
```

**Key files containing sort/order logic to test**:
- `apps/web/core/components/issues/issue-layouts/utils.ts` — sort order utilities
- `apps/web/helpers/` — any DnD helper functions
- `packages/shared-state/` — store methods that handle reorder mutations

**Layer 2: Integration test the DnD hooks (Vitest + happy-dom, Phase 3)**

Test the custom hooks (`useGroupIssuesDragNDrop`, `useAutoScroller`) that wire up Pragmatic DnD. These hooks set up `draggable()`, `dropTargetForElements()`, and `combine()` from `@atlaskit/pragmatic-drag-and-drop`. Test them using `@testing-library/react`'s `renderHook`:

```typescript
import { renderHook } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

describe("useGroupIssuesDragNDrop", () => {
  it("registers drag source on mount", () => {
    const ref = { current: document.createElement("div") };
    const { result } = renderHook(() =>
      useGroupIssuesDragNDrop({ elementRef: ref, issueId: "test-1", groupId: "group-1" })
    );
    expect(result.current.isDragging).toBe(false);
  });

  it("calls onDrop callback with correct payload on drop", () => {
    const onDrop = vi.fn();
    // ... simulate the pragmatic-dnd lifecycle
  });
});
```

**Important**: You do NOT need to simulate actual mouse drag gestures at this layer. Pragmatic DnD exposes programmatic APIs (`triggerPostMoveFlash`, event data types) that you can use to test the hook logic without DOM drag simulation.

**Layer 3: E2E test the critical DnD flows (Playwright, Phase 4)**

This is where you test actual mouse-driven drag-and-drop in a real browser. Only test the 3 most critical DnD flows:

1. **Kanban board**: Drag issue from "In Progress" to "Done" → verify issue state changes
2. **List view**: Drag issue to reorder → verify new position persists after reload
3. **Sidebar**: Drag project to reorder → verify new order persists

Playwright has built-in DnD support:

```typescript
import { test, expect } from "@playwright/test";

test("kanban: drag issue from In Progress to Done", async ({ page }) => {
  await page.goto("/workspace/project/issues?layout=kanban");

  const sourceIssue = page.locator('[data-testid="issue-card-ISSUE-1"]');
  const targetColumn = page.locator('[data-testid="kanban-column-done"]');

  // Playwright's native drag-and-drop
  await sourceIssue.dragTo(targetColumn);

  // Verify the issue moved
  await expect(targetColumn.locator('[data-testid="issue-card-ISSUE-1"]')).toBeVisible();

  // Verify API was called to update state
  // (check via page.waitForResponse or verify after page reload)
  await page.reload();
  await expect(targetColumn.locator('[data-testid="issue-card-ISSUE-1"]')).toBeVisible();
});
```

**Critical for DnD E2E**: Add `data-testid` attributes to your DnD elements (issue cards, kanban columns, list rows, sidebar items). Without stable selectors, DnD E2E tests will be brittle and break on every UI change. This is a prerequisite — add `data-testid` to DnD elements in Phase 3 so they're ready for Phase 4 E2E.

**What NOT to test in DnD**:
- Don't test the Pragmatic DnD library itself (Atlassian tests it)
- Don't test drag visual effects (ghost images, drop indicators) — these are CSS
- Don't test auto-scroll acceleration zones — this is library behavior
- Don't test keyboard DnD accessibility at the E2E level initially (add later)
- Don't test every possible drag combination — test the 3 critical paths above

#### 4.3 Visual regression testing

Use Chromatic or Percy with existing Storybook stories. Catches CSS/layout regressions automatically on PRs.

#### 4.3 Coverage gates (only after Phase 3 baseline)

- Overall: 30% minimum (blocks merge)
- New code in PRs: 60% minimum (advisory)
- Permissions module: 50% minimum (blocks merge)
- Serializers: 40% minimum (blocks merge)

---

## Part 3: Elaborate Do's and Don'ts

### THE DO'S

#### General

- **DO write a test BEFORE fixing a bug.** Reproduce the bug as a failing test first. Then fix the code. This is the single most valuable testing habit — it guarantees the bug never comes back. Every production incident should leave behind a test.
- **DO test at the lowest level that catches the regression.** If a bug is in a utility function, write a unit test — not an E2E test. Lower-level tests run faster and give more precise failure messages.
- **DO keep tests fast.** A test suite that takes 20 minutes will be ignored. Target: backend tests < 5 minutes, frontend tests < 2 minutes. Use `pytest-xdist -n auto` for parallel backend tests.
- **DO run tests before marking a PR as ready for review.** Not in pre-commit (too slow), but before clicking "Ready for review." CI will enforce this, but catching failures before review saves everyone time.
- **DO treat test failures as blockers.** If CI tests fail, the PR does not merge. No exceptions. No "I'll fix it in the next PR." This is the core culture change.
- **DO test the boundaries, not the internals.** Test what your function/endpoint/store does (inputs → outputs), not how it does it. Internal refactors should not break tests.
- **DO use descriptive test names that explain the scenario.** `test_guest_cannot_delete_project` tells you exactly what broke. `test_delete_3` tells you nothing.
- **DO co-locate tests near the code they test.** `packages/utils/src/__tests__/datetime.test.ts` next to `packages/utils/src/datetime.ts`. Backend tests go in `apps/api/plane/tests/` (already organized this way).

#### Backend-Specific Do's

- **DO use factories for all test data.** Use `UserFactory()`, `WorkspaceFactory()`, `IssueFactory()` from `apps/api/plane/tests/factories.py`. Factories are composable, consistent, and self-documenting. They handle all required fields so your test only specifies what's relevant.
- **DO use `@pytest.mark.django_db` on every test that touches the database.** Without it, pytest-django will block DB access and the test will fail with a confusing error.
- **DO use `@pytest.mark.unit` or `@pytest.mark.contract` on every test class.** This allows running subsets: `pytest -m unit` for fast feedback, `pytest -m contract` for API verification.
- **DO test permissions with at least 3 roles.** Every permission-protected endpoint needs: ADMIN (can), MEMBER (can/can't depending on the endpoint), GUEST (cannot). This is your security net.
- **DO mock external services, never call them.** Use `conftest_external.py` fixtures (`mock_redis`, `mock_celery`, `mock_elasticsearch`, `mock_mongodb`). Tests must run without Docker infrastructure.
- **DO use `freezegun` for anything time-dependent.** Never use `datetime.now()` in assertions. Time-dependent tests are the #1 source of flaky tests.
- **DO test soft-delete behavior explicitly.** Verify that `Model.objects` excludes deleted records and `Model.all_objects` includes them. Plane's soft-delete system is a common source of subtle bugs.
- **DO test error responses, not just success.** A 400 response with the wrong error message is a bug. Test that `response.data` contains the expected error structure.

#### Frontend-Specific Do's

- **DO use Vitest for all new frontend tests.** It's already adopted in `apps/live` and `packages/codemods`. Do not introduce Jest for new tests.
- **DO test MobX stores as plain classes.** Instantiate the store, call actions, assert on observables/computeds. No React rendering needed. This is the highest-ROI frontend test.
- **DO test pure utility functions first.** `@plane/utils` functions (date formatting, string manipulation, validation) are the easiest tests to write — zero dependencies, zero mocking.
- **DO add `data-testid` attributes to interactive elements.** Especially DnD elements (issue cards, kanban columns, list rows), form inputs, and navigation items. These are essential for E2E tests later and cost nothing now.
- **DO use `vi.mock()` for service layer mocking in store tests.** Mock `@plane/services` at the import level when testing MobX stores. Don't mock individual axios calls.
- **DO test computed values that derive complex state.** If a MobX `computed` does more than return a property (filtering, sorting, aggregating), it needs a test. These are the computations that break silently during refactors.

#### DnD-Specific Do's

- **DO test the sort-order calculation functions as unit tests.** These are pure functions — easiest to test and most likely to regress.
- **DO test cross-group moves at the logic level.** When an issue is dragged from "In Progress" to "Done," the state update logic should be tested as a unit, separate from the drag gesture.
- **DO add `data-testid` to all DnD targets** (kanban columns, list rows, sidebar items, favorites tree nodes). Format: `data-testid="kanban-column-{groupId}"`, `data-testid="issue-card-{issueId}"`.
- **DO test that DnD results persist after page reload** in E2E tests. The drag gesture is cosmetic — the real test is whether the backend saved the new order.

---

### THE DON'TS

#### General

- **DON'T test implementation details.** If your test breaks when you rename a private variable or refactor internal logic without changing behavior, the test is wrong. Test behavior (inputs → outputs), not structure.
- **DON'T write tests for code you haven't read.** Understand what the function/endpoint does before deciding what to test. Reading the code first prevents you from writing tests that assert the wrong thing.
- **DON'T aim for 100% coverage.** Coverage is a vanity metric. 100% coverage with bad assertions catches nothing. Target 40-60% coverage on critical paths with meaningful assertions.
- **DON'T test third-party library behavior.** Don't test that React renders a `<div>`, that MobX tracks observables, that Pragmatic DnD fires drag events, or that Django REST Framework serializes JSON. These libraries have their own tests.
- **DON'T write flaky tests.** A test that fails randomly is worse than no test — it erodes trust in the test suite. Common causes: time-dependent logic (use `freezegun`), random IDs (use factory sequences), async race conditions (use proper awaits). If a test is flaky, fix it or delete it immediately.
- **DON'T write slow tests.** Each test should run in < 500ms. If it's slower, you're testing at the wrong level (probably E2E when you should be unit testing). The entire suite should be < 5 minutes.
- **DON'T use `sleep()` or `time.sleep()` in tests.** Ever. Use `freezegun` for time-based logic, `await` for async operations, and polling with timeouts for E2E waits.
- **DON'T commit tests that are skipped/disabled.** `@pytest.mark.skip` and `it.skip` are for temporary debugging only. Don't merge PRs with skipped tests — either fix them or delete them.
- **DON'T duplicate test coverage across layers.** If you have a contract test that verifies issue creation works, you don't also need a unit test for the create view method AND an E2E test that creates an issue. One comprehensive contract test is enough for that path.
- **DON'T write tests as an afterthought.** If a PR adds a new API endpoint or modifies permission logic, the tests should be in the same PR — not "I'll add tests later." Later never comes.
- **DON'T block PR merges for coverage numbers alone.** Coverage gates should be advisory first (Phase 1-3). Only make them blocking in Phase 4 once the team has the habit.

#### Backend-Specific Don'ts

- **DON'T use `Model.objects.create()` directly in tests.** Use factories. Raw creation is verbose, error-prone (you'll forget a required field), and doesn't scale. Factories handle all defaults.
- **DON'T test Django admin views.** Unless you have custom admin logic, Django admin is tested by Django itself.
- **DON'T test auto-generated migrations.** Migrations are generated by Django and validated by `makemigrations --check`. They don't need separate tests.
- **DON'T mock the database.** Use `@pytest.mark.django_db` with the real (test) database. Mocking QuerySets is brittle and doesn't catch actual query bugs. The `--reuse-db` flag in pytest.ini makes this fast.
- **DON'T test URL routing.** If you have `path("/issues/", IssueViewSet)` — don't test that `/issues/` maps to `IssueViewSet`. Test the endpoint behavior instead.
- **DON'T call `.delay()` on Celery tasks in tests.** Call the task function directly: `my_task(arg1, arg2)` instead of `my_task.delay(arg1, arg2)`. The `CELERY_TASK_ALWAYS_EAGER` setting handles this, but direct calls are clearer.
- **DON'T test raw SQL or ORM query construction.** Test the results of the query (what data comes back), not how the query is constructed.
- **DON'T over-mock.** If your test mocks 5+ things, you're probably testing at the wrong level. A contract test that hits the real view → serializer → model chain with only external services mocked is more valuable than a unit test where everything is mocked.
- **DON'T use `TestCase` or `unittest.TestCase`.** Use pytest functions or classes with `@pytest.mark` decorators. Pytest is the standard for this repo and `TestCase` doesn't work well with pytest fixtures.

#### Frontend-Specific Don'ts

- **DON'T test React component rendering.** Testing that `<Button>Click</Button>` renders `<button>Click</button>` adds zero value. The component exists — it renders. Test behavior: what happens when you click it.
- **DON'T snapshot test.** Snapshot tests are the worst ROI test in a codebase like Plane. They break on every UI change, nobody reads the diffs, and everyone just runs `--update-snapshot`. They don't catch bugs — they create noise.
- **DON'T test Tailwind CSS classes.** Don't assert that a component has `className="bg-blue-500"`. Styling is tested visually (Storybook + visual regression) or not at all.
- **DON'T test simple pass-through service methods.** The `@plane/services` layer wraps axios. Testing that `issueService.getIssue(id)` calls `axios.get(/issues/${id})` is testing axios, not your code. Test the backend contract instead.
- **DON'T use `jsdom` when `happy-dom` works.** `happy-dom` is 2-3x faster. Only fall back to jsdom if you need a browser API that happy-dom doesn't support (rare in Plane's codebase).
- **DON'T write component integration tests before unit tests exist.** Get unit tests for utils, stores, and helpers first (Phase 1-2). Component integration tests are Phase 3+.
- **DON'T install Jest for new test files.** Use Vitest. Jest is only in `apps/silo` for legacy reasons. All new tests use Vitest for consistency.

#### DnD-Specific Don'ts

- **DON'T test the Pragmatic DnD library itself.** Don't test that `draggable()` makes an element draggable, that `dropTargetForElements()` registers a drop target, or that `combine()` merges cleanups. Atlassian tests their library.
- **DON'T test drag visual effects.** Ghost images, drop indicators, highlight animations — these are CSS and library behavior. Not worth testing.
- **DON'T test auto-scroll zones.** The auto-scroll behavior (15% threshold, 5% = 2x speed) is Pragmatic DnD's responsibility. Don't test it.
- **DON'T test every DnD combination.** 50+ files use DnD. Testing every possible drag source → drop target combination is impossible and unnecessary. Test the 3 critical flows in E2E and the sort-order logic as unit tests.
- **DON'T simulate mouse events manually for DnD tests.** Use Playwright's `dragTo()` for E2E. For unit tests, test the callback functions directly — don't try to fire synthetic `dragstart`/`drop` events.
- **DON'T write DnD E2E tests without `data-testid` selectors.** Using CSS selectors or text content for DnD targets makes tests extremely brittle. Add `data-testid` first, then write E2E tests.

---

### Test naming conventions

**Backend (Python)**:
```
tests/unit/models/test_<model>.py         → class Test<Model>Model
tests/unit/serializers/test_<name>.py     → class Test<Name>Serializer
tests/contract/app/test_<feature>.py      → class Test<Feature>Endpoints
Method: test_<action>_<condition>_<result> → test_create_issue_without_name_returns_400
```

**Frontend (TypeScript)**:
```
packages/<pkg>/src/__tests__/<module>.test.ts
describe("<module>") → it("<behavior>")
```

### Test data

- **Backend**: Always use factories from `tests/factories.py`. Never use raw `Model.objects.create()` in test methods.
- **Frontend**: Use plain object literals with factory helper functions in `__test-utils__/factories.ts`.

---

## Part 4: Summary — What Changes Where

| File/Area | Change | Phase |
|-----------|--------|-------|
| `.github/workflows/pull-request-build-lint-api.yml` | Add `test-api` job with Postgres+Redis services | 1 |
| `apps/api/plane/settings/test.py` | Add MD5 hasher + eager Celery | 1 |
| `packages/utils/vitest.config.ts` + tests | First frontend tests (pure functions) | 1 |
| `.github/workflows/pull-request-build-lint-web-apps.yml` | Add `test` job after build | 1 |
| `apps/api/plane/tests/factories.py` | Add State, Issue, Label, Cycle, Module factories | 2 |
| `apps/api/plane/tests/contract/app/test_*_permissions.py` | Permission tests for issues, projects, pages | 2 |
| `apps/api/plane/tests/contract/app/test_issue_crud.py` | Full issue lifecycle contract tests | 2 |
| `packages/shared-state/` | Vitest config + MobX store tests | 2 |
| `apps/web/tsconfig.json` | Re-enable `noImplicitReturns`, `noUnusedLocals` | 2 |
| Serializer tests, Celery task tests, coverage reporting | Systematic expansion | 3 |
| Storybook interaction tests (`@plane/propel`) | `play` functions on 10 interactive components | 3 |
| Playwright E2E (5 flows), visual regression, coverage gates | Full confidence | 4 |

---

## Part 5: Verification

After each phase, verify:

**Phase 1**:
- Push a PR touching `apps/api/` → backend tests run and pass in GitHub Actions
- Push a PR touching `packages/utils/` → frontend tests run and pass in GitHub Actions
- Break a utility function intentionally → CI catches it and blocks the PR

**Phase 2**:
- Change a permission decorator → permission test fails in CI
- Modify an issue serializer field → contract test catches the shape change
- Modify a MobX filter store computed → store test catches incorrect computation

**Phase 3**:
- PR comments show coverage diff
- Serializer field additions come with tests
- Celery task logic changes come with tests

**Phase 4**:
- 5 critical user flows pass in Playwright before every deploy
- Storybook visual changes are caught by Chromatic/Percy
- Coverage gates prevent regression below baseline
