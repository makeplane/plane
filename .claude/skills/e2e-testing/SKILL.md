---
name: e2e-testing
description: "Build reliable, fast, and maintainable end-to-end test suites that provide confidence to ship code quickly and catch regressions before users do. Covers general E2E philosophy/patterns (Playwright, Cypress) plus a dedicated Playwright test-suite-building workflow (Page Object Model, auth state persistence, fixtures, visual regression, CI)."
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Grep
  - Glob
  - AskUserQuestion
  - ExitPlanMode
harness: universal
---

# E2E Testing Patterns

Build reliable, fast, and maintainable end-to-end test suites that provide confidence to ship code quickly and catch regressions before users do.

## Use this skill when

- Implementing end-to-end test automation
- Debugging flaky or unreliable tests
- Testing critical user workflows
- Setting up CI/CD test pipelines
- Testing across multiple browsers
- Validating accessibility requirements
- Testing responsive designs
- Establishing E2E testing standards
- Setting up Playwright from scratch in an existing project

## Do not use this skill when

- You only need unit or integration tests
- The environment cannot support stable UI automation
- You cannot provision safe test accounts or data

## Instructions

1. Identify critical user journeys and success criteria.
2. Build stable selectors and test data strategies.
3. Implement tests with retries, tracing, and isolation.
4. Run in CI with parallelization and artifact capture.

## Safety

- Avoid running destructive tests against production.
- Use dedicated test data and scrub sensitive output.

## Resources

- `references/implementation-playbook.md` for detailed E2E patterns and templates (Playwright + Cypress patterns, waiting strategies, network mocking, visual regression, accessibility testing, debugging).

---

## Playwright: Building a Test Suite

When the task is specifically "build a Playwright E2E suite for this project" (not just "write an E2E test"), use this more structured, interview-driven workflow instead of jumping straight to code.

### Phase 1: Explore (Plan Mode)

Enter plan mode. Before writing any tests, explore the existing project:

**Project structure**
- Tech stack: React, Next.js, Vue, SvelteKit, or other?
- Is Playwright already installed (`playwright.config.ts`, `@playwright/test` in package.json)?
- Existing test directories (`e2e/`, `tests/`, `__tests__/`)?
- Existing E2E tests in Cypress/Selenium (migration context)?
- Dev server command and port

**Application structure**
- Main routes/pages (router config, pages directory, route files)
- Auth flow (login page URL, auth API endpoints, token storage)
- Test IDs in components (`data-testid`, `data-test`, `data-cy`)
- API routes tests might need to seed data through
- `.env` files with test-specific environment variables

**CI/CD**
- Existing CI config (`.github/workflows/`, `.gitlab-ci.yml`, `Jenkinsfile`)
- Docker/docker-compose setup
- Staging/preview environment URL pattern

### Phase 2: Interview (ask_user_question)

Ask in rounds:

**Round 1 — Scope and critical flows:** which flows to test (auth, CRUD, checkout, admin), approximate app size (routes).

**Round 2 — Auth strategy for tests:** how the app authenticates (cookie/session, JWT/localStorage, OAuth/SSO, none) and how tests should authenticate (login via UI once + reuse `storageState` — recommended; API login in `beforeEach`; seeded tokens; or full login-UI-every-time).

**Round 3 — Test data and environment:** test data management (API seeding in fixtures — recommended; DB seeding; shared pre-populated staging; mocked responses) and target environment (local dev server — recommended; preview/staging URL; Docker Compose stack).

**Round 4 — CI and parallelization:** CI provider (GitHub Actions — recommended; GitLab CI; local-only; other) and visual regression needs (none — recommended; full-page screenshots; component screenshots).

> If the ask tool is unavailable, ask the same question in plain text and wait for the answer.

### Phase 3: Plan (plan mode)

write a concrete implementation plan covering directory structure, Playwright config (projects/browsers, base URL, retries, workers), auth setup (global setup for storageState or API-based auth), page objects, test fixtures, test suites per critical flow, and CI config (sharding, artifact upload, reporting). Present the plan via plan mode for approval.

> If the ask tool is unavailable, ask the same question in plain text and wait for the answer.

### Phase 4: Execute

After approval, implement in this order:

**1. Playwright config** — `testDir`, `fullyParallel`, CI-aware `retries`/`workers`/`reporter`, `use.baseURL`/`trace`/`screenshot`/`video`, a `setup` project for auth that other browser projects depend on, and `webServer` to auto-start the dev server.

**2. Auth setup (global)** — a `setup` test that logs in via the UI once and saves `page.context().storageState({ path: authFile })`; all authenticated projects declare `dependencies: ['setup']` and reuse that state.

**3. Custom fixtures** — extend `test` with page-object fixtures (`loginPage`, `dashboardPage`, ...) and an `api` fixture (a small SDK-style client) for seeding/cleaning test data directly against the backend rather than through the UI.

**4. Page Object Model** — one class per page, `Locator` fields built with role-based queries in the constructor, action methods (`goto`, `login`, `createResource`), and `expect*` assertion helpers.

**5. Test suites** — one file per critical flow. Unauthenticated flows (`auth.spec.ts`) override `storageState` to `{ cookies: [], origins: [] }`. Authenticated flows (`dashboard.spec.ts`, `crud.spec.ts`) use the shared fixtures; CRUD specs seed/clean their own data in `beforeEach`/`afterEach`.

**6. Visual regression (if selected)** — `expect(page).toHaveScreenshot(...)` with `maxDiffPixelRatio`, for full pages and individual components (e.g. navigation).

**7. GitHub Actions CI** — matrix-sharded job (`shard: [1/4, 2/4, 3/4, 4/4]`), `npx playwright install --with-deps chromium`, `npx playwright test --shard=${{ matrix.shard }}`, and artifact upload for both the HTML report and `test-results/` on every run (not just failure).

### Directory structure reference

```
e2e/
├── .auth/
│   └── user.json            # Saved auth state (gitignored)
├── fixtures.ts              # Custom test fixtures and API client
├── pages/
│   ├── login-page.ts
│   ├── dashboard-page.ts
│   └── resource-page.ts
├── auth.setup.ts             # Global auth setup (runs once)
├── auth.spec.ts
├── dashboard.spec.ts
├── crud.spec.ts
└── visual.spec.ts            # Optional
playwright.config.ts
```

### Playwright best practices

**Use role-based locators first** — prefer `getByRole()`, `getByLabel()`, `getByText()` over CSS selectors or raw test IDs; they mirror how users interact with the page and catch accessibility issues. Fall back to `getByTestId()` when role-based doesn't work. Avoid `.locator('.btn-primary')` / `#id` selectors — fragile, breaks on refactors.

**Wait for network/state, never timers** — never `page.waitForTimeout()`. Wait for `waitForResponse`, element visibility (`expect(...).toBeVisible()`), `toHaveURL`, or a spinner going hidden.

**Isolate test data** — each test seeds its own data via the `api` fixture and cleans up in `afterEach`, even on failure.

**Tag tests for selective runs** — `test('checkout flow @slow @checkout', ...)`; run `--grep @checkout` or skip with `--grep-invert @slow`.

**`.gitignore`** — `e2e/.auth/`, `test-results/`, `playwright-report/`, `blob-report/`.

### Checklist before finishing

- [ ] `playwright.config.ts` has `webServer` configured to start the dev server
- [ ] Auth setup saves storageState and all test projects depend on it
- [ ] Page objects use role-based locators (`getByRole`, `getByLabel`, `getByText`)
- [ ] No `waitForTimeout()` calls — only wait for elements, URLs, or responses
- [ ] Tests create and clean up their own data (no shared mutable state)
- [ ] CI config has sharding for parallel execution
- [ ] Trace, screenshot, and video are captured on failure for debugging
- [ ] `.auth/` directory is in `.gitignore`
- [ ] `npx playwright test` passes locally before pushing

## Visual Regression Testing

Catch unintended UI changes by comparing screenshots against an approved baseline, on top of (not instead of) functional E2E coverage.

### Tool options

| Tool | Model | Notes |
|------|-------|-------|
| **Percy** | Hosted diffing service (BrowserStack) | Integrates with Playwright/Cypress via SDK; handles cross-browser rendering and diff review UI; paid SaaS |
| **BackstopJS** | Self-hosted, config-driven | Puppeteer/Playwright engine under the hood; local diff reports (HTML); free, more setup |
| **Playwright's built-in `toHaveScreenshot()`** | Self-hosted, no extra service | Simplest option if already on Playwright — see the Playwright section above for direct usage |
| **Chromatic** | Hosted, Storybook-native | Best fit when components are already documented in Storybook |

### Percy setup (Playwright/Cypress)

```bash
npm install --save-dev @percy/cli @percy/playwright   # or @percy/cypress
```
```javascript
// in a Playwright test
import percySnapshot from '@percy/playwright';
test('homepage visual', async ({ page }) => {
  await page.goto('/');
  await percySnapshot(page, 'Homepage');
});
```
Run via `npx percy exec -- npx playwright test` (Percy wraps the test run to intercept snapshots and upload them). Requires a `PERCY_TOKEN` env var from the Percy project settings — store it as a CI secret, never hardcode it.

### BackstopJS setup

```bash
npm install --save-dev backstopjs
npx backstop init
```
```json
// backstop.json (excerpt)
{
  "scenarios": [
    { "label": "Homepage", "url": "http://localhost:3000", "selectors": ["document"] }
  ],
  "viewports": [
    { "label": "desktop", "width": 1280, "height": 800 },
    { "label": "mobile", "width": 375, "height": 667 }
  ]
}
```
```bash
npx backstop reference   # capture baseline
npx backstop test        # compare against baseline, generates HTML diff report
npx backstop approve     # accept current state as new baseline after review
```

### Practices

- Snapshot stable, deterministic states — mock dates/random data, disable animations (`prefers-reduced-motion` or a CSS override in test mode), wait for fonts/images to finish loading before capturing.
- Set a diff threshold (`maxDiffPixelRatio` / BackstopJS's `misMatchThreshold`) rather than requiring pixel-perfect matches — anti-aliasing and sub-pixel rendering differ across CI runners.
- Snapshot both full pages (catch layout regressions) and individual components (catch isolated style regressions, faster to review).
- Gate on CI (PR check) with a human-reviewed approval step for intentional visual changes — never auto-approve diffs.
- Keep baselines in version control or a dedicated storage bucket, not local-only — otherwise every contributor has a different "baseline".
