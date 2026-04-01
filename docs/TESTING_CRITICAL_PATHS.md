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

## Part 3B: Critical Path Classification (C0–C3) and Multi-Scenario Testing

### Path Criticality Levels

| Level | Definition | Test Requirement | Examples in Plane |
|-------|-----------|-----------------|-------------------|
| **C0** | Production-down if broken. Data loss or security breach. | Must have tests. Block merge without them. | Authentication, permissions, issue CRUD, soft-delete, payment/billing |
| **C1** | Core workflow broken. Users cannot complete primary tasks. | Should have tests. Strongly recommended. | Project creation, state transitions, cycle/module management, page editing, DnD reorder |
| **C2** | Feature degraded. Users can work around it. | Nice to have tests. Add when touching the code. | Notifications, webhooks, search, filters, sorting, analytics |
| **C3** | Cosmetic or minor. No workflow impact. | Tests optional. | Tooltips, empty states, avatar display, color themes |

### How to Structure Dependent Test Scenarios

Your test scenarios have **dependency chains** — you can't create an issue without a project, and you can't create a project without a workspace. Here's exactly how to handle this.

#### Strategy 1: Use Fixtures for Setup, Test Only the Target Action

The **correct** approach for most tests: use pytest fixtures for the dependency chain, and only assert on the action you're actually testing.

```python
# File: apps/api/plane/tests/contract/app/test_issue_crud.py

import pytest
from rest_framework import status
from plane.db.models import Issue, State

@pytest.mark.contract
class TestIssueCreate:
    """C0 Path: Issue creation — the core of the product"""

    @pytest.fixture
    def project_with_states(self, db, workspace, create_user):
        """Setup: workspace + project + default states (all via fixtures)"""
        from plane.db.models import Project, ProjectMember, State

        project = Project.objects.create(
            name="Test Project",
            identifier="TP",
            workspace=workspace,
            created_by=create_user,
        )
        ProjectMember.objects.create(
            project=project, member=create_user,
            workspace=workspace, role=20, is_active=True,
        )
        # Create the default states that project creation would normally create
        State.objects.create(
            name="Backlog", group="backlog", project=project,
            workspace=workspace, default=True, created_by=create_user,
        )
        State.objects.create(
            name="Done", group="completed", project=project,
            workspace=workspace, created_by=create_user,
        )
        return project

    @pytest.mark.django_db
    def test_create_issue_success(self, session_client, workspace, project_with_states):
        """C0: Happy path — create issue with required fields"""
        project = project_with_states
        backlog = State.objects.get(project=project, name="Backlog")

        url = f"/api/workspaces/{workspace.slug}/projects/{project.id}/issues/"
        response = session_client.post(url, {
            "name": "Fix login bug",
            "state": str(backlog.id),
            "priority": "high",
        }, format="json")

        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["name"] == "Fix login bug"
        assert response.data["priority"] == "high"

        # Verify DB state
        issue = Issue.objects.get(id=response.data["id"])
        assert issue.state == backlog
        assert issue.project == project

    @pytest.mark.django_db
    def test_create_issue_without_name_returns_400(self, session_client, workspace, project_with_states):
        """C0: Missing required field"""
        project = project_with_states
        url = f"/api/workspaces/{workspace.slug}/projects/{project.id}/issues/"

        response = session_client.post(url, {
            "priority": "high",
        }, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    @pytest.mark.django_db
    def test_create_issue_invalid_project_returns_404(self, session_client, workspace):
        """C0: Non-existent project"""
        fake_project_id = "00000000-0000-0000-0000-000000000000"
        url = f"/api/workspaces/{workspace.slug}/projects/{fake_project_id}/issues/"

        response = session_client.post(url, {
            "name": "Ghost issue",
        }, format="json")

        assert response.status_code == status.HTTP_404_NOT_FOUND
```

**Key principle**: The `project_with_states` fixture handles the entire dependency chain. Each test method only tests ONE behavior. The setup is invisible to the test — it just works.

#### Strategy 2: Multi-Step Workflow Tests for C0 Paths

For **critical workflows** where the sequence itself is what you're testing (e.g., "create project → create issue → transition state → verify notifications"), use a single test that walks through the steps:

```python
@pytest.mark.contract
class TestIssueStateTransitionWorkflow:
    """C0 Path: Complete issue lifecycle — create → update state → verify"""

    @pytest.mark.django_db
    def test_issue_lifecycle_state_transitions(self, session_client, workspace, create_user):
        """C0: Full lifecycle — Backlog → In Progress → Done"""

        # --- Step 1: Create project (gets default states) ---
        project_url = f"/api/workspaces/{workspace.slug}/projects/"
        resp = session_client.post(project_url, {
            "name": "Lifecycle Test", "identifier": "LCT",
        }, format="json")
        assert resp.status_code == 201
        project_id = resp.data["id"]

        # --- Step 2: Get the states created by project creation ---
        states_url = f"/api/workspaces/{workspace.slug}/projects/{project_id}/states/"
        resp = session_client.get(states_url)
        states = {s["name"]: s["id"] for s in resp.data}
        assert "Backlog" in states
        assert "In Progress" in states
        assert "Done" in states

        # --- Step 3: Create issue in Backlog ---
        issues_url = f"/api/workspaces/{workspace.slug}/projects/{project_id}/issues/"
        resp = session_client.post(issues_url, {
            "name": "Feature: dark mode",
            "state": states["Backlog"],
            "priority": "medium",
        }, format="json")
        assert resp.status_code == 201
        issue_id = resp.data["id"]
        assert resp.data["state"] == states["Backlog"]

        # --- Step 4: Move to In Progress ---
        issue_url = f"{issues_url}{issue_id}/"
        resp = session_client.patch(issue_url, {
            "state": states["In Progress"],
        }, format="json")
        assert resp.status_code == 200
        assert resp.data["state"] == states["In Progress"]

        # --- Step 5: Move to Done ---
        resp = session_client.patch(issue_url, {
            "state": states["Done"],
        }, format="json")
        assert resp.status_code == 200
        assert resp.data["state"] == states["Done"]

        # --- Step 6: Verify final DB state ---
        issue = Issue.objects.get(id=issue_id)
        done_state = State.objects.get(id=states["Done"])
        assert issue.state == done_state
```

#### Strategy 3: Parallel Scenarios — Same Setup, Different Outcomes

This is exactly your question: "I go to project A, create issue succeeds. I go to project B, issue create fails." The pattern is to **share the workspace fixture but create different project contexts**:

```python
@pytest.mark.contract
class TestIssueCreateAcrossProjects:
    """C1 Path: Issue creation works in one project, fails in another"""

    @pytest.fixture
    def two_projects(self, db, workspace, create_user):
        """Setup: One project where user is ADMIN, one where user is GUEST"""
        from plane.db.models import Project, ProjectMember, State

        # Project A — user is ADMIN (can create issues)
        project_a = Project.objects.create(
            name="Project A", identifier="PA",
            workspace=workspace, created_by=create_user,
        )
        ProjectMember.objects.create(
            project=project_a, member=create_user,
            workspace=workspace, role=20, is_active=True,  # ADMIN
        )
        State.objects.create(
            name="Backlog", group="backlog", project=project_a,
            workspace=workspace, default=True, created_by=create_user,
        )

        # Project B — user is GUEST (cannot create issues)
        other_user = User.objects.create(email="owner-b@plane.so")
        project_b = Project.objects.create(
            name="Project B", identifier="PB",
            workspace=workspace, created_by=other_user,
        )
        ProjectMember.objects.create(
            project=project_b, member=create_user,
            workspace=workspace, role=5, is_active=True,  # GUEST
        )
        State.objects.create(
            name="Backlog", group="backlog", project=project_b,
            workspace=workspace, default=True, created_by=other_user,
        )

        return project_a, project_b

    @pytest.mark.django_db
    def test_create_issue_succeeds_in_project_a(self, session_client, workspace, two_projects):
        """User is ADMIN in Project A — issue creation should succeed"""
        project_a, _ = two_projects
        backlog = State.objects.get(project=project_a, name="Backlog")

        url = f"/api/workspaces/{workspace.slug}/projects/{project_a.id}/issues/"
        resp = session_client.post(url, {
            "name": "Issue in A", "state": str(backlog.id),
        }, format="json")

        assert resp.status_code == 201
        assert Issue.objects.filter(project=project_a).count() == 1

    @pytest.mark.django_db
    def test_create_issue_fails_in_project_b(self, session_client, workspace, two_projects):
        """User is GUEST in Project B — issue creation should be forbidden"""
        _, project_b = two_projects
        backlog = State.objects.get(project=project_b, name="Backlog")

        url = f"/api/workspaces/{workspace.slug}/projects/{project_b.id}/issues/"
        resp = session_client.post(url, {
            "name": "Issue in B", "state": str(backlog.id),
        }, format="json")

        assert resp.status_code == 403
        assert Issue.objects.filter(project=project_b).count() == 0
```

#### Strategy 4: Parametrized Tests for Multiple Scenarios

When you have the **same action but different conditions**, use `@pytest.mark.parametrize` to avoid duplicating test methods:

```python
@pytest.mark.contract
class TestIssueCreateValidation:
    """C0 Path: Issue creation validation — test multiple invalid inputs"""

    @pytest.mark.django_db
    @pytest.mark.parametrize("payload,expected_status,description", [
        # (input_data, expected_http_status, human_readable_description)
        ({}, 400, "empty payload"),
        ({"name": ""}, 400, "empty name"),
        ({"name": "x" * 10000}, 400, "name too long"),
        ({"name": "Valid", "priority": "INVALID"}, 400, "invalid priority value"),
        ({"name": "Valid", "state": "not-a-uuid"}, 400, "invalid state UUID"),
    ])
    def test_create_issue_validation(
        self, session_client, workspace, project_with_states,
        payload, expected_status, description
    ):
        """C0: Issue creation rejects invalid input — {description}"""
        project = project_with_states
        url = f"/api/workspaces/{workspace.slug}/projects/{project.id}/issues/"

        resp = session_client.post(url, payload, format="json")
        assert resp.status_code == expected_status, (
            f"Expected {expected_status} for {description}, got {resp.status_code}"
        )
```

#### Strategy 5: Permission Matrix Tests

For **C0 permission paths**, test all roles against all operations:

```python
@pytest.mark.contract
class TestIssuePermissionMatrix:
    """C0 Path: Verify role-based access for all issue operations"""

    @pytest.fixture
    def users_with_roles(self, db, workspace, project_with_states):
        """Create users with ADMIN, MEMBER, GUEST roles in the project"""
        from plane.db.models import ProjectMember, WorkspaceMember

        project = project_with_states
        users = {}

        for role_name, role_value in [("admin", 20), ("member", 15), ("guest", 5)]:
            user = User.objects.create(email=f"{role_name}@plane.so")
            user.set_password("password")
            user.save()
            WorkspaceMember.objects.create(
                workspace=workspace, member=user, role=role_value,
            )
            ProjectMember.objects.create(
                project=project, member=user,
                workspace=workspace, role=role_value, is_active=True,
            )
            users[role_name] = user

        return users

    @pytest.mark.django_db
    @pytest.mark.parametrize("role,can_create", [
        ("admin", True),
        ("member", True),
        ("guest", False),
    ])
    def test_issue_create_by_role(
        self, api_client, workspace, project_with_states,
        users_with_roles, role, can_create
    ):
        """C0: Issue create — ADMIN and MEMBER can, GUEST cannot"""
        project = project_with_states
        user = users_with_roles[role]
        api_client.force_authenticate(user=user)

        backlog = State.objects.get(project=project, name="Backlog")
        url = f"/api/workspaces/{workspace.slug}/projects/{project.id}/issues/"

        resp = api_client.post(url, {
            "name": f"Issue by {role}", "state": str(backlog.id),
        }, format="json")

        if can_create:
            assert resp.status_code == 201, f"{role} should be able to create issues"
        else:
            assert resp.status_code == 403, f"{role} should NOT be able to create issues"

    @pytest.mark.django_db
    @pytest.mark.parametrize("role,can_delete", [
        ("admin", True),
        ("member", True),
        ("guest", False),
    ])
    def test_issue_delete_by_role(
        self, api_client, workspace, project_with_states,
        users_with_roles, role, can_delete
    ):
        """C0: Issue delete — ADMIN and MEMBER can, GUEST cannot"""
        project = project_with_states
        backlog = State.objects.get(project=project, name="Backlog")

        # Create issue as admin first
        admin = users_with_roles["admin"]
        issue = Issue.objects.create(
            name="Delete me", project=project, state=backlog,
            workspace=workspace, created_by=admin, updated_by=admin,
        )

        # Try to delete as the test role
        user = users_with_roles[role]
        api_client.force_authenticate(user=user)
        url = f"/api/workspaces/{workspace.slug}/projects/{project.id}/issues/{issue.id}/"

        resp = api_client.delete(url)

        if can_delete:
            assert resp.status_code == 204, f"{role} should be able to delete issues"
        else:
            assert resp.status_code == 403, f"{role} should NOT be able to delete issues"
```

### Complete C0–C3 Classification — Every Feature in Plane

---

#### C0 — MUST TEST (Production Down / Data Loss / Security Breach)

If any of these break, users cannot work. Tests are mandatory before merging.

**Authentication & Authorization**

| # | Feature | What to Test | Test Type | Backend File |
|---|---------|-------------|-----------|-------------|
| 1 | Email/password sign-in | Valid credentials → 200 + session, invalid → 401 | Contract | `authentication/urls.py` |
| 2 | Email/password sign-up | New user creation, duplicate email rejection | Contract | `authentication/urls.py` |
| 3 | Magic link generation | Link created, stored in Redis, email sent | Contract | `authentication/urls.py` |
| 4 | Magic link sign-in | Valid token → session, expired → 401, reuse → 401 | Contract | `authentication/urls.py` |
| 5 | Sign-out | Session invalidated, token revoked | Contract | `authentication/urls.py` |
| 6 | Session authentication | Authenticated requests pass, unauthenticated → 401 | Contract | `app/permissions/base.py` |
| 7 | JWT authentication | Valid token → pass, expired → 401, malformed → 401 | Contract | `app/permissions/base.py` |
| 8 | API token authentication | Valid X-API-Key → pass, invalid → 401 | Contract | `api/urls/` |
| 9 | OAuth2 flows (Google, GitHub, GitLab) | Redirect URL, callback token exchange, user creation | Contract | `authentication/urls.py` |
| 10 | SAML SSO | Metadata endpoint, assertion validation | Contract | `authentication/urls.py` |
| 11 | OIDC SSO | Discovery, token exchange, user provisioning | Contract | `authentication/urls.py` |
| 12 | LDAP authentication | Bind + search, group sync, user creation | Contract | `authentication/urls.py` |
| 13 | Permission decorator (`allow_permission`) | ADMIN(20) passes, MEMBER(15) per-endpoint, GUEST(5) blocked | Unit + Contract | `app/permissions/base.py` |
| 14 | Workspace role enforcement | Workspace ADMIN vs MEMBER vs GUEST on all workspace ops | Contract (parametrize) | `app/views/workspace/` |
| 15 | Project role enforcement | Project ADMIN vs MEMBER vs GUEST on all project ops | Contract (parametrize) | `app/views/project/` |
| 16 | Cross-workspace isolation | User in workspace A cannot access workspace B resources | Contract | `app/views/` |

**Issue / Work Item Management (Core of the Product)**

| # | Feature | What to Test | Test Type | Backend File |
|---|---------|-------------|-----------|-------------|
| 17 | Create issue | POST → 201, required fields (name), default state assigned | Contract | `app/views/issue/base.py` |
| 18 | Get issue | GET → 200, response shape matches frontend expectations | Contract | `app/views/issue/base.py` |
| 19 | List issues | GET → 200, pagination, filter by state/priority/assignee | Contract | `app/views/issue/base.py` |
| 20 | Update issue | PATCH → 200, partial update (state, priority, assignees) | Contract | `app/views/issue/base.py` |
| 21 | Delete issue (soft) | DELETE → 204, `deleted_at` set, `objects` excludes it | Contract | `app/views/issue/base.py` |
| 22 | Issue state transitions | Backlog → In Progress → Done, state_id changes correctly | Contract (workflow) | `app/views/issue/base.py` |
| 23 | Issue with invalid state | POST with non-existent state_id → 400 | Contract | `app/views/issue/base.py` |
| 24 | Issue in non-existent project | POST → 404 | Contract | `app/views/issue/base.py` |
| 25 | Bulk issue operations | Bulk update state/priority/assignees, partial failure handling | Contract | `app/views/issue/base.py` |
| 26 | Issue relations | Link parent/child, blocking/blocked-by, duplicate | Contract | `app/views/issue/relation.py` |
| 27 | Issue permissions — create | ADMIN ✓, MEMBER ✓, GUEST ✗ | Contract (parametrize) | `app/views/issue/base.py` |
| 28 | Issue permissions — delete | ADMIN ✓, MEMBER ✓, GUEST ✗ | Contract (parametrize) | `app/views/issue/base.py` |
| 29 | Issue permissions — update | ADMIN ✓, MEMBER ✓, GUEST ✗ | Contract (parametrize) | `app/views/issue/base.py` |

**Project Management**

| # | Feature | What to Test | Test Type | Backend File |
|---|---------|-------------|-----------|-------------|
| 30 | Create project | POST → 201, auto-creates 5 default states + ProjectMember(ADMIN) | Contract | `app/views/project/base.py` |
| 31 | Get project | GET → 200, includes member count, cover image, lead | Contract | `app/views/project/base.py` |
| 32 | Update project | PATCH → 200, name/identifier/description changes | Contract | `app/views/project/base.py` |
| 33 | Delete project | DELETE → cascade soft-delete of all child objects | Contract | `app/views/project/base.py` |
| 34 | Duplicate identifier | POST with existing identifier → 400 (IntegrityError) | Contract | `app/views/project/base.py` |
| 35 | Project member add | POST → 201, role assignment correct | Contract | `app/views/project/member.py` |
| 36 | Project member remove | DELETE → 204, user loses access | Contract | `app/views/project/member.py` |
| 37 | Project permissions — create | Workspace ADMIN ✓, MEMBER ✓, GUEST ✗ | Contract (parametrize) | `app/views/project/base.py` |
| 38 | Project permissions — delete | Project ADMIN ✓, MEMBER ✗, GUEST ✗ | Contract (parametrize) | `app/views/project/base.py` |

**Workspace Management**

| # | Feature | What to Test | Test Type | Backend File |
|---|---------|-------------|-----------|-------------|
| 39 | Create workspace | POST → 201, owner becomes ADMIN member | Contract | `app/views/workspace/base.py` |
| 40 | Slug uniqueness | POST with existing slug → 400 | Contract | `app/views/workspace/base.py` |
| 41 | Invite member | POST → invitation created, email sent | Contract | `app/views/workspace/invite.py` |
| 42 | Remove member | DELETE → member removed, loses all project access | Contract | `app/views/workspace/member.py` |
| 43 | Workspace delete | DELETE → cascade soft-delete everything | Contract | `app/views/workspace/base.py` |

**State Management**

| # | Feature | What to Test | Test Type | Backend File |
|---|---------|-------------|-----------|-------------|
| 44 | Create state | POST → 201, group valid (backlog/unstarted/started/completed/cancelled) | Contract | `app/views/state.py` |
| 45 | Set default state | POST → default flag toggled, old default cleared | Contract | `app/views/state.py` |
| 46 | Delete state | DELETE → 400 if issues exist in this state (protect data) | Contract | `app/views/state.py` |
| 47 | State group validation | POST with invalid group → 400 | Unit | `db/models/state.py` |

**Soft Deletion System**

| # | Feature | What to Test | Test Type | Backend File |
|---|---------|-------------|-----------|-------------|
| 48 | `Model.objects` excludes deleted | Query returns only `deleted_at=NULL` records | Unit | `db/models/` |
| 49 | `Model.all_objects` includes deleted | Query returns all records regardless of `deleted_at` | Unit | `db/models/` |
| 50 | Cascade soft-delete | Deleting project soft-deletes all child issues | Unit (Celery) | `bgtasks/deletion_task.py` |
| 51 | Restore soft-deleted | Set `deleted_at=None` restores record | Unit | `db/models/` |

**External API (Third-party)**

| # | Feature | What to Test | Test Type | Backend File |
|---|---------|-------------|-----------|-------------|
| 52 | External issue CRUD | API key auth → create/read/update/delete issues | Contract | `api/views/` |
| 53 | External work items | List with filters, pagination | Contract | `api/views/` |
| 54 | Rate limiting | Excessive requests → 429 | Contract | `api/views/` |

---

#### C1 — SHOULD TEST (Core Workflow Broken, Partial Workarounds)

Primary workflows are impacted but users can work around with alternative methods.

**Cycle Management**

| # | Feature | What to Test | Test Type | Backend File |
|---|---------|-------------|-----------|-------------|
| 55 | Create cycle | POST → 201, dates valid, no overlap | Contract | `app/views/cycle/base.py` |
| 56 | Add issues to cycle | POST → 201, issues linked correctly | Contract | `app/views/cycle/issue.py` |
| 57 | Cycle date validation | Start > End → 400 | Contract | `app/views/cycle/base.py` |
| 58 | Archive cycle | POST → cycle archived, issues remain | Contract | `app/views/cycle/base.py` |
| 59 | Cycle progress | GET → correct completion percentage | Contract | `app/views/cycle/base.py` |
| 60 | Cycle permissions | ADMIN ✓, MEMBER ✓, GUEST ✗ for create/delete | Contract (parametrize) | `app/views/cycle/base.py` |

**Module Management**

| # | Feature | What to Test | Test Type | Backend File |
|---|---------|-------------|-----------|-------------|
| 61 | Create module | POST → 201, name/dates/status | Contract | `app/views/module/base.py` |
| 62 | Add issues to module | POST → 201, issue-module link created | Contract | `app/views/module/issue.py` |
| 63 | Module status transitions | backlog → in-progress → completed | Contract | `app/views/module/base.py` |
| 64 | Archive module | POST → module archived | Contract | `app/views/module/base.py` |

**Page / Wiki Management**

| # | Feature | What to Test | Test Type | Backend File |
|---|---------|-------------|-----------|-------------|
| 65 | Create page | POST → 201, workspace/project scoped correctly | Contract | `app/views/page/base.py` |
| 66 | Update page | PATCH → 200, description changes saved | Contract | `app/views/page/base.py` |
| 67 | Lock/unlock page | POST/DELETE lock → only owner can edit when locked | Contract | `app/views/page/base.py` |
| 68 | Archive page | POST → page archived but recoverable | Contract | `app/views/page/base.py` |
| 69 | Page access control | Private page → only creator sees it; Public → all members | Contract | `app/views/page/base.py` |

**Labels**

| # | Feature | What to Test | Test Type | Backend File |
|---|---------|-------------|-----------|-------------|
| 70 | Create label | POST → 201, unique name per project | Contract | `app/views/label.py` |
| 71 | Assign label to issue | PATCH issue with label IDs | Contract | `app/views/issue/base.py` |
| 72 | Delete label | DELETE → label removed from all issues | Contract | `app/views/label.py` |

**Issue Comments**

| # | Feature | What to Test | Test Type | Backend File |
|---|---------|-------------|-----------|-------------|
| 73 | Create comment | POST → 201, linked to correct issue | Contract | `app/views/issue/comment.py` |
| 74 | Update comment | PATCH → 200, only author can edit | Contract | `app/views/issue/comment.py` |
| 75 | Delete comment | DELETE → 204, soft-deleted | Contract | `app/views/issue/comment.py` |

**Issue Filtering & Sorting**

| # | Feature | What to Test | Test Type | Backend File |
|---|---------|-------------|-----------|-------------|
| 76 | Filter by state | GET ?state=uuid → only matching issues | Contract | `app/views/issue/base.py` |
| 77 | Filter by priority | GET ?priority=high → correct results | Contract | `app/views/issue/base.py` |
| 78 | Filter by assignee | GET ?assignees=uuid → correct results | Contract | `app/views/issue/base.py` |
| 79 | Group by state | GET ?group_by=state → grouped response | Contract | `app/views/issue/base.py` |
| 80 | Order by created_at | GET ?order_by=-created_at → correct order | Contract | `app/views/issue/base.py` |

**DnD / Sort Order Logic**

| # | Feature | What to Test | Test Type | Frontend File |
|---|---------|-------------|-----------|-------------|
| 81 | Sort order calculation | Place item between two items → correct fractional value | Unit (Vitest) | `apps/web/.../utils.ts` |
| 82 | Cross-group move | Move issue from "In Progress" to "Done" → state_id updates | Unit (Vitest) | `apps/web/.../utils.ts` |
| 83 | Reorder within group | Drag issue up/down → sort_order recalculated | Unit (Vitest) | `apps/web/.../utils.ts` |
| 84 | Nested reorder (favorites) | Make child / reorder → parent_id and sort_order correct | Unit (Vitest) | `apps/web/.../utils.ts` |

**MobX Store Logic**

| # | Feature | What to Test | Test Type | Frontend File |
|---|---------|-------------|-----------|-------------|
| 85 | Filter store — apply filter | `updateFilter("priority", ["high"])` → activeFilters correct | Unit (Vitest) | `shared-state/store/work-item-filters/` |
| 86 | Filter store — clear all | `clearAllFilters()` → empty filters | Unit (Vitest) | `shared-state/store/work-item-filters/` |
| 87 | Filter store — serialization | Filters round-trip to/from URL query params | Unit (Vitest) | `shared-state/store/work-item-filters/` |
| 88 | Rich filter helpers | Complex filter DSL parsing and evaluation | Unit (Vitest) | `shared-state/store/rich-filters/` |

**Workspace Settings**

| # | Feature | What to Test | Test Type | Backend File |
|---|---------|-------------|-----------|-------------|
| 89 | Member role change | PATCH → role updated, correct access | Contract | `app/views/workspace/member.py` |
| 90 | Webhook CRUD | Create, update, delete webhooks | Contract | `app/views/webhook.py` |
| 91 | API token CRUD | Create, list, revoke tokens | Contract | `app/views/api_token.py` |

**Project Settings**

| # | Feature | What to Test | Test Type | Backend File |
|---|---------|-------------|-----------|-------------|
| 92 | Feature toggles | Enable/disable cycles, modules, pages, intake | Contract | `app/views/project/base.py` |
| 93 | Estimates configuration | Set estimation system (Fibonacci, T-shirt) | Contract | `app/views/estimate.py` |

**Templates (EE)**

| # | Feature | What to Test | Test Type | Backend File |
|---|---------|-------------|-----------|-------------|
| 94 | Create work item template | POST → 201, template saved with all fields | Contract | `ee/views/template/` |
| 95 | Create issue from template | POST → 201, issue inherits template values | Contract | `ee/views/template/` |

---

#### C2 — NICE TO HAVE (Feature Degraded, Workaround Exists)

Users can work around these. Test when touching the code.

**Background Tasks / Side Effects**

| # | Feature | What to Test | Test Type | Backend File |
|---|---------|-------------|-----------|-------------|
| 96 | Activity tracking | Issue update → activity record created | Unit (Celery) | `bgtasks/issue_activities_task.py` |
| 97 | Notification delivery | Issue assigned → notification for assignee | Unit (Celery) | `bgtasks/notification_task.py` |
| 98 | Webhook firing | Issue change → webhook POST to URL | Unit (Celery) | `bgtasks/webhook_task.py` |
| 99 | Email notification | Mention in comment → email sent | Unit (Celery) | `bgtasks/email_notification_task.py` |
| 100 | Auto-archive | Issue idle > N days → auto-archived | Unit (Celery) | `bgtasks/issue_automation_task.py` |
| 101 | Auto-close | Issue idle > N days → auto-closed | Unit (Celery) | `bgtasks/issue_automation_task.py` |

**Search & Analytics**

| # | Feature | What to Test | Test Type | Backend File |
|---|---------|-------------|-----------|-------------|
| 102 | Issue search | Search by name returns correct results | Contract | `app/views/search.py` |
| 103 | Cycle analytics | Completion %, burndown data correct | Contract | `app/views/cycle/base.py` |
| 104 | Module progress | Progress calculation based on issue states | Unit | `app/views/module/base.py` |
| 105 | Workspace analytics | Issue distribution by state/priority/label | Contract | `app/views/analytic.py` |

**Imports & Exports**

| # | Feature | What to Test | Test Type | Backend File |
|---|---------|-------------|-----------|-------------|
| 106 | CSV import | File parsed, issues created with correct mapping | Unit (Celery) | `bgtasks/importer_task.py` |
| 107 | Jira import | Jira JSON mapped to Plane models | Unit | `silo/apps/jira/` |
| 108 | Linear import | Linear data mapped correctly | Unit | `silo/apps/linear/` |
| 109 | Data export | Export generates downloadable file | Unit (Celery) | `bgtasks/exporter_handler.py` |

**Intake / Public Forms**

| # | Feature | What to Test | Test Type | Backend File |
|---|---------|-------------|-----------|-------------|
| 110 | Create intake form | POST → 201, form config saved | Contract | `app/views/intake/` |
| 111 | Public submission | Anonymous POST → intake item created | Contract | `space/urls/` |
| 112 | Convert to issue | Intake item → issue in project | Contract | `app/views/intake/` |

**Epics (EE)**

| # | Feature | What to Test | Test Type | Backend File |
|---|---------|-------------|-----------|-------------|
| 113 | Create epic | POST → 201, issue_type is epic | Contract | `ee/views/epic/` |
| 114 | Add child issues | Link issues as children of epic | Contract | `ee/views/epic/` |
| 115 | Epic progress | Calculated from child issue states | Unit | `ee/views/epic/` |

**Automations**

| # | Feature | What to Test | Test Type | Backend File |
|---|---------|-------------|-----------|-------------|
| 116 | Create automation rule | POST → 201, trigger + action saved | Contract | `automations/` |
| 117 | Trigger evaluation | Issue matches condition → action fires | Unit | `automations/` |
| 118 | Auto-assign action | Trigger → assignee set on issue | Unit | `automations/` |
| 119 | Auto-label action | Trigger → label applied | Unit | `automations/` |

**Initiatives (EE)**

| # | Feature | What to Test | Test Type | Backend File |
|---|---------|-------------|-----------|-------------|
| 120 | Create initiative | POST → 201, scope and timeline saved | Contract | `ee/views/initiative/` |
| 121 | Initiative scope | Add/remove projects from initiative | Contract | `ee/views/initiative/` |

**Teamspaces (EE)**

| # | Feature | What to Test | Test Type | Backend File |
|---|---------|-------------|-----------|-------------|
| 122 | Create teamspace | POST → 201, multi-project container | Contract | `ee/views/teamspace/` |
| 123 | Teamspace members | Add/remove members, role enforcement | Contract | `ee/views/teamspace/` |

**Dashboards (EE)**

| # | Feature | What to Test | Test Type | Backend File |
|---|---------|-------------|-----------|-------------|
| 124 | Create dashboard | POST → 201, widget config saved | Contract | `ee/views/dashboard/` |
| 125 | Dashboard data | GET → correct aggregation from issues | Contract | `ee/views/dashboard/` |

**Customers (EE)**

| # | Feature | What to Test | Test Type | Backend File |
|---|---------|-------------|-----------|-------------|
| 126 | Create customer | POST → 201, customer data saved | Contract | `ee/views/customer/` |
| 127 | Link customer to issues | Customer requests tracked | Contract | `ee/views/customer/` |

**Frontend Utilities**

| # | Feature | What to Test | Test Type | Frontend File |
|---|---------|-------------|-----------|-------------|
| 128 | Date formatting | `renderFormattedDate` — valid, null, invalid inputs | Unit (Vitest) | `packages/utils/src/datetime.ts` |
| 129 | Date comparison | `isAfter`, `isBefore`, edge cases | Unit (Vitest) | `packages/utils/src/datetime.ts` |
| 130 | Timezone handling | UTC → local → UTC round-trip | Unit (Vitest) | `packages/utils/src/datetime.ts` |
| 131 | String manipulation | Slug generation, truncation, sanitization | Unit (Vitest) | `packages/utils/src/string.ts` |
| 132 | URL parsing | Extract workspace/project from URL | Unit (Vitest) | `packages/utils/src/url.ts` |
| 133 | Array utilities | Dedup, sort, group-by helpers | Unit (Vitest) | `packages/utils/src/array.ts` |
| 134 | Validation helpers | Email, URL, UUID validation | Unit (Vitest) | `packages/utils/src/validation.ts` |
| 135 | Permission utilities | Role check helpers on frontend | Unit (Vitest) | `packages/utils/src/permission/` |
| 136 | Cycle helpers | Cycle status calculation from dates | Unit (Vitest) | `packages/utils/src/cycle.ts` |
| 137 | Module helpers | Module progress calculation | Unit (Vitest) | `packages/utils/src/module.ts` |
| 138 | Filter utilities | Filter composition, serialization | Unit (Vitest) | `packages/utils/src/filter.ts` |
| 139 | Color utilities | Hex validation, contrast calculation | Unit (Vitest) | `packages/utils/src/color.ts` |

**Recurring Work Items (EE)**

| # | Feature | What to Test | Test Type | Backend File |
|---|---------|-------------|-----------|-------------|
| 140 | Create recurring rule | POST → 201, schedule saved | Contract | `ee/views/recurring/` |
| 141 | Recurrence execution | Scheduled job → new issue created | Unit (Celery) | `ee/bgtasks/recurring_work_item.py` |

**Worklogs / Time Tracking (EE)**

| # | Feature | What to Test | Test Type | Backend File |
|---|---------|-------------|-----------|-------------|
| 142 | Log time | POST → 201, hours/minutes saved | Contract | `ee/views/worklog/` |
| 143 | Worklog summary | GET → correct aggregation per issue | Contract | `ee/views/worklog/` |

**Integrations**

| # | Feature | What to Test | Test Type | Backend/Silo File |
|---|---------|-------------|-----------|-------------|
| 144 | GitHub integration | Install, sync issues, PR links | Unit | `silo/apps/github/` |
| 145 | Slack integration | Install, notifications, slash commands | Unit | `silo/apps/slack/` |
| 146 | GitLab integration | Install, sync issues | Unit | `silo/apps/gitlab/` |

**Real-time (Socket.IO)**

| # | Feature | What to Test | Test Type | File |
|---|---------|-------------|-----------|------|
| 147 | Issue update broadcast | Issue change → Socket.IO event to workspace | Integration | `apps/live/socket-io/` |
| 148 | Notification push | New notification → real-time push to user | Integration | `apps/live/socket-io/` |

**GraphQL**

| # | Feature | What to Test | Test Type | Backend File |
|---|---------|-------------|-----------|-------------|
| 149 | Issue query | GraphQL query returns correct issue data | Contract | `graphql/` |
| 150 | Issue mutation | GraphQL mutation creates/updates issue | Contract | `graphql/` |

**Plane Intelligence (AI)**

| # | Feature | What to Test | Test Type | File |
|---|---------|-------------|-----------|------|
| 151 | Grammar check | Text → corrections returned | Integration | `apps/pi/` |
| 152 | Rephrase | Text → rephrased version | Integration | `apps/pi/` |

---

#### C3 — OPTIONAL (Cosmetic / No Workflow Impact)

No tests needed unless specifically requested. Visual testing via Storybook.

| # | Feature | Why Skip Testing |
|---|---------|-----------------|
| 153 | Empty state illustrations | Pure visual, no logic |
| 154 | Avatar display | CSS/image rendering |
| 155 | Tooltip content | Static text |
| 156 | Color themes / dark mode | CSS variables, test via Storybook visual regression |
| 157 | Loading spinners | Animation, no logic |
| 158 | Breadcrumb navigation | Pure presentational |
| 159 | Keyboard shortcuts (Power-K) | UI convenience, not business logic |
| 160 | Onboarding tour | Static walkthrough |
| 161 | Emoji picker | Third-party component wrapper |
| 162 | Icon picker | Third-party component wrapper |
| 163 | Workspace selector UI | Simple routing, no data mutation |
| 164 | Profile display | Read-only, no mutations |
| 165 | License info display | Read-only |
| 166 | Stickies / workspace notes | Low-impact personal notes |
| 167 | Page transitions / animations | CSS, no logic |
| 168 | Separator / divider components | Pure visual |
| 169 | Skeleton loading states | Pure visual |
| 170 | Badge / pill components | Pure visual |

---

**Summary: 170 test paths total**

| Level | Count | Effort | When |
|-------|-------|--------|------|
| **C0** | 54 paths | Phase 1-2 (first 2 weeks) | Must test before merge |
| **C1** | 40 paths | Phase 2-3 (weeks 2-4) | Should test, strongly recommended |
| **C2** | 58 paths | Phase 3+ (ongoing) | Test when touching the code |
| **C3** | 18 paths | Phase 4 (optional) | Skip or Storybook visual only |

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
