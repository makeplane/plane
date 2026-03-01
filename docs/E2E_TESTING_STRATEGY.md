# E2E Testing Strategy for Plane EE

## Executive Summary

**Recommendation: Create a single `e2e/` package at the root level** rather than separate E2E tests per app.

**Framework: Playwright** over Vitest for E2E (Vitest is better suited for unit/component tests).

---

## The Core Question: Per-App vs Shared Package?

### Option A: Per-App E2E Tests
```
apps/
  web/e2e/
  admin/e2e/
  space/e2e/
```

### Option B: Shared E2E Package (Recommended)
```
e2e/                    # Root-level E2E package
├── playwright.config.ts
├── fixtures/           # Shared auth, workspace, data fixtures
├── pages/              # Page objects organized by app
│   ├── web/
│   ├── admin/
│   └── space/
├── tests/              # Test specs organized by app/feature
│   ├── web/
│   ├── admin/
│   ├── space/
│   └── cross-app/      # Tests spanning multiple apps
└── utils/              # Shared test utilities
```

---

## Why a Shared Package is Better for Plane

### 1. Cross-App User Journeys

Plane's apps are interconnected. Real user flows cross app boundaries:

| Journey | Apps Involved |
|---------|---------------|
| Instance setup → Create workspace → Use app | admin → web |
| Create project → Share publicly | web → space |
| Configure integrations → Use in project | admin → web |
| Team admin → User management → Project access | admin → web |

Per-app E2E tests can't naturally test these flows. A shared package can.

### 2. Shared Authentication Context

All three apps share the same auth system:
- Same Django backend (`apps/api`)
- Same session/token management
- Same user model

With a shared package:
```typescript
// fixtures/auth.ts - Used by all app tests
export const loginFixture = async ({ page, request }) => {
  // One auth implementation, shared across all tests
  await request.post('/api/v1/sign-in/', { ... });
};
```

Per-app would duplicate this logic 3 times.

### 3. Shared Test Data Setup

All apps operate on the same data:
- Workspaces
- Projects
- Issues/Work items
- Users & permissions

A shared package means one set of data builders:
```typescript
// utils/data-builders.ts
export const createWorkspace = async (api) => { ... };
export const createProject = async (api, workspaceSlug) => { ... };
export const createIssue = async (api, projectId) => { ... };
```

### 4. DRY Page Objects

Apps share UI patterns (both use `@plane/propel` and `@plane/ui`):
- Common navigation patterns
- Shared form components
- Consistent modals/dialogs

```typescript
// pages/common/modal.page.ts - Reused across apps
export class ModalPage {
  async confirm() { ... }
  async cancel() { ... }
}

// pages/web/project.page.ts
export class ProjectPage extends ModalPage { ... }

// pages/admin/settings.page.ts
export class SettingsPage extends ModalPage { ... }
```

### 5. Consistent Configuration

One `playwright.config.ts` managing:
- All three app base URLs
- Shared timeouts and retry policies
- Unified reporting
- Single CI/CD integration point

```typescript
// playwright.config.ts
export default defineConfig({
  projects: [
    { name: 'web', use: { baseURL: 'http://localhost:3000' } },
    { name: 'admin', use: { baseURL: 'http://localhost:3001' } },
    { name: 'space', use: { baseURL: 'http://localhost:3002' } },
    { name: 'cross-app', use: { ... } },  // Multi-app tests
  ],
});
```

### 6. Turbo Integration

A single E2E package integrates cleanly with Turbo:

```json
// turbo.json
{
  "tasks": {
    "test:e2e": {
      "dependsOn": ["web#build", "admin#build", "space#build"],
      "cache": false
    }
  }
}
```

Running tests:
```bash
pnpm turbo run test:e2e              # Run all E2E
pnpm turbo run test:e2e -- --project=web  # Run only web tests
```

---

## Why Not Per-App?

| Concern | Per-App Problem |
|---------|-----------------|
| **Code duplication** | Auth, fixtures, utilities copied 3x |
| **Cross-app tests** | Where do they live? Which app owns them? |
| **Configuration drift** | 3 configs to maintain, inevitably diverge |
| **CI complexity** | 3 separate test jobs, 3 separate reports |
| **Shared state** | Hard to share browser context across app boundaries |
| **Maintenance burden** | Updates needed in 3 places |

---

## Playwright vs Vitest for E2E

### Use Playwright for E2E

| Feature | Playwright |
|---------|------------|
| **Browser automation** | Native, first-class |
| **Multi-browser** | Chromium, Firefox, WebKit |
| **Network interception** | Built-in, powerful |
| **Visual testing** | Screenshot comparison |
| **Trace viewer** | Excellent debugging |
| **Cross-origin** | Handles multiple domains naturally |
| **Mobile emulation** | Device presets built-in |

### Use Vitest for Unit/Component Tests

Vitest is excellent for:
- Package unit tests (`@plane/services`, `@plane/utils`)
- Component tests with jsdom/happy-dom
- Fast, watch-mode development

But Vitest's browser mode is still maturing and lacks Playwright's E2E capabilities.

### Recommended Test Stack

```
┌─────────────────────────────────────────────────┐
│                    E2E Tests                     │
│            (Playwright - e2e/ package)           │
│    Full user journeys across web/admin/space     │
└─────────────────────────────────────────────────┘
                        ↑
┌─────────────────────────────────────────────────┐
│              Integration Tests                   │
│         (Vitest + MSW in each package)           │
│    Store + service integration, API mocking      │
└─────────────────────────────────────────────────┘
                        ↑
┌─────────────────────────────────────────────────┐
│                 Unit Tests                       │
│            (Vitest in each package)              │
│    Pure functions, components, utilities         │
└─────────────────────────────────────────────────┘
                        ↑
┌─────────────────────────────────────────────────┐
│              Component Stories                   │
│      (Storybook in @plane/propel, @plane/ui)     │
│    Visual component documentation & testing      │
└─────────────────────────────────────────────────┘
```

---

## Proposed Directory Structure

```
e2e/
├── package.json
├── playwright.config.ts
├── tsconfig.json
│
├── fixtures/
│   ├── auth.fixture.ts          # Login/session management
│   ├── workspace.fixture.ts     # Workspace creation/cleanup
│   ├── project.fixture.ts       # Project setup
│   └── base.fixture.ts          # Combines all fixtures
│
├── pages/
│   ├── common/
│   │   ├── modal.page.ts
│   │   ├── sidebar.page.ts
│   │   └── header.page.ts
│   ├── web/
│   │   ├── dashboard.page.ts
│   │   ├── project.page.ts
│   │   ├── issue.page.ts
│   │   └── settings.page.ts
│   ├── admin/
│   │   ├── instance.page.ts
│   │   ├── users.page.ts
│   │   └── ai-settings.page.ts
│   └── space/
│       ├── public-board.page.ts
│       └── issue-embed.page.ts
│
├── tests/
│   ├── web/
│   │   ├── auth/
│   │   │   ├── login.spec.ts
│   │   │   └── signup.spec.ts
│   │   ├── projects/
│   │   │   ├── create-project.spec.ts
│   │   │   └── project-settings.spec.ts
│   │   ├── issues/
│   │   │   ├── create-issue.spec.ts
│   │   │   ├── issue-detail.spec.ts
│   │   │   └── bulk-operations.spec.ts
│   │   └── real-time/
│   │       └── collaborative-editing.spec.ts
│   ├── admin/
│   │   ├── instance-setup.spec.ts
│   │   └── user-management.spec.ts
│   ├── space/
│   │   └── public-project.spec.ts
│   └── cross-app/
│       ├── admin-to-web-flow.spec.ts
│       └── web-to-space-sharing.spec.ts
│
├── utils/
│   ├── api-client.ts            # Direct API calls for test setup
│   ├── data-builders.ts         # Factory functions for test data
│   ├── selectors.ts             # Common selectors/test-ids
│   └── wait-helpers.ts          # Custom wait utilities
│
└── global-setup.ts              # One-time setup (DB seeding, etc.)
```

---

## Sample Implementation

### package.json

```json
{
  "name": "@plane/e2e",
  "private": true,
  "scripts": {
    "test": "playwright test",
    "test:web": "playwright test --project=web",
    "test:admin": "playwright test --project=admin",
    "test:space": "playwright test --project=space",
    "test:cross-app": "playwright test --project=cross-app",
    "test:ui": "playwright test --ui",
    "report": "playwright show-report"
  },
  "devDependencies": {
    "@playwright/test": "^1.40.0",
    "@plane/types": "workspace:*",
    "dotenv": "^16.3.1"
  }
}
```

### playwright.config.ts

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html'],
    ['list'],
    ...(process.env.CI ? [['github']] : []),
  ],

  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
  },

  projects: [
    // Auth setup - runs first
    { name: 'setup', testMatch: /.*\.setup\.ts/ },

    // Web app tests
    {
      name: 'web',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: 'http://localhost:3000',
        storageState: 'playwright/.auth/user.json',
      },
      dependencies: ['setup'],
      testMatch: /tests\/web\/.*/,
    },

    // Admin app tests
    {
      name: 'admin',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: 'http://localhost:3001',
        storageState: 'playwright/.auth/admin.json',
      },
      dependencies: ['setup'],
      testMatch: /tests\/admin\/.*/,
    },

    // Space app tests
    {
      name: 'space',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: 'http://localhost:3002',
      },
      testMatch: /tests\/space\/.*/,
    },

    // Cross-app tests
    {
      name: 'cross-app',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'playwright/.auth/user.json',
      },
      dependencies: ['setup'],
      testMatch: /tests\/cross-app\/.*/,
    },
  ],

  // Start services before tests
  webServer: [
    {
      command: 'pnpm --filter web dev',
      url: 'http://localhost:3000',
      reuseExistingServer: !process.env.CI,
    },
    {
      command: 'pnpm --filter admin dev',
      url: 'http://localhost:3001',
      reuseExistingServer: !process.env.CI,
    },
    {
      command: 'pnpm --filter space dev',
      url: 'http://localhost:3002',
      reuseExistingServer: !process.env.CI,
    },
  ],
});
```

### fixtures/auth.fixture.ts

```typescript
import { test as base, expect } from '@playwright/test';

type AuthFixtures = {
  authenticatedPage: Page;
  adminPage: Page;
};

export const test = base.extend<AuthFixtures>({
  authenticatedPage: async ({ browser }, use) => {
    const context = await browser.newContext({
      storageState: 'playwright/.auth/user.json',
    });
    const page = await context.newPage();
    await use(page);
    await context.close();
  },

  adminPage: async ({ browser }, use) => {
    const context = await browser.newContext({
      storageState: 'playwright/.auth/admin.json',
    });
    const page = await context.newPage();
    await use(page);
    await context.close();
  },
});

export { expect };
```

### Example Test: tests/web/projects/create-project.spec.ts

```typescript
import { test, expect } from '../../../fixtures/base.fixture';
import { ProjectPage } from '../../../pages/web/project.page';

test.describe('Project Creation', () => {
  test('should create a new project', async ({ authenticatedPage }) => {
    const projectPage = new ProjectPage(authenticatedPage);

    await projectPage.goto();
    await projectPage.clickCreateProject();

    await projectPage.fillProjectName('Test Project');
    await projectPage.selectProjectType('software');
    await projectPage.submit();

    await expect(projectPage.projectTitle).toHaveText('Test Project');
  });

  test('should show validation errors for empty name', async ({ authenticatedPage }) => {
    const projectPage = new ProjectPage(authenticatedPage);

    await projectPage.goto();
    await projectPage.clickCreateProject();
    await projectPage.submit();

    await expect(projectPage.nameError).toBeVisible();
  });
});
```

### Example Cross-App Test: tests/cross-app/web-to-space-sharing.spec.ts

```typescript
import { test, expect } from '../../fixtures/base.fixture';
import { ProjectPage } from '../../pages/web/project.page';
import { PublicBoardPage } from '../../pages/space/public-board.page';

test.describe('Public Project Sharing', () => {
  test('should share project and view in space', async ({ authenticatedPage, context }) => {
    // Step 1: Create project and enable public access in web app
    const projectPage = new ProjectPage(authenticatedPage);
    await projectPage.goto();
    const project = await projectPage.createProject({ name: 'Public Test' });

    await projectPage.openSettings();
    await projectPage.enablePublicAccess();
    const publicUrl = await projectPage.getPublicUrl();

    // Step 2: Open new page and view in space app (unauthenticated)
    const spacePage = await context.newPage();
    const publicBoard = new PublicBoardPage(spacePage);

    await publicBoard.goto(publicUrl);

    // Verify public view shows project
    await expect(publicBoard.projectName).toHaveText('Public Test');
    await expect(publicBoard.issueList).toBeVisible();
  });
});
```

---

## Turbo Integration

### turbo.json additions

```json
{
  "tasks": {
    "test:e2e": {
      "cache": false,
      "persistent": false,
      "dependsOn": ["^build"],
      "env": ["CI", "PLAYWRIGHT_*"]
    },
    "test:e2e:web": {
      "cache": false,
      "dependsOn": ["web#build"]
    },
    "test:e2e:admin": {
      "cache": false,
      "dependsOn": ["admin#build"]
    },
    "test:e2e:space": {
      "cache": false,
      "dependsOn": ["space#build"]
    }
  }
}
```

### Root package.json scripts

```json
{
  "scripts": {
    "test:e2e": "turbo run test:e2e",
    "test:e2e:web": "pnpm --filter @plane/e2e test:web",
    "test:e2e:admin": "pnpm --filter @plane/e2e test:admin",
    "test:e2e:space": "pnpm --filter @plane/e2e test:space"
  }
}
```

---

## CI/CD Integration

### GitHub Actions Example

```yaml
name: E2E Tests

on:
  pull_request:
  push:
    branches: [develop, main]

jobs:
  e2e:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        ports:
          - 5432:5432
      redis:
        image: valkey/valkey:7
        ports:
          - 6379:6379

    steps:
      - uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v2

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install

      - name: Install Playwright browsers
        run: pnpm --filter @plane/e2e exec playwright install --with-deps

      - name: Build apps
        run: pnpm build

      - name: Start API server
        run: |
          cd apps/api
          python manage.py migrate
          python manage.py runserver &
        env:
          DATABASE_URL: postgres://postgres:postgres@localhost:5432/plane
          REDIS_URL: redis://localhost:6379

      - name: Run E2E tests
        run: pnpm test:e2e

      - name: Upload test results
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: e2e/playwright-report/
```

---

## Migration Path

### Phase 1: Foundation (Week 1)
1. Create `e2e/` directory with config
2. Set up Playwright with projects
3. Implement auth fixtures
4. Write first smoke test (login flow)

### Phase 2: Core Workflows (Weeks 2-3)
1. Implement page objects for web app
2. Add project/issue CRUD tests
3. Add admin instance setup tests
4. Add space public view tests

### Phase 3: Advanced Scenarios (Weeks 4-5)
1. Cross-app flow tests
2. Real-time collaboration tests
3. Integration tests (OAuth, webhooks)
4. Visual regression setup

### Phase 4: CI/CD (Week 6)
1. GitHub Actions workflow
2. Test parallelization
3. Reporting dashboard
4. Flaky test management

---

## Summary

| Aspect | Recommendation |
|--------|----------------|
| **Structure** | Single `e2e/` package at root |
| **Framework** | Playwright for E2E |
| **Unit/Component** | Vitest (per-package) |
| **Organization** | Page Object Model, tests grouped by app |
| **Cross-app** | Dedicated `tests/cross-app/` directory |
| **CI** | Single job, parallelized by project |

This approach gives you:
- Single source of truth for E2E tests
- Shared fixtures and utilities (DRY)
- Natural support for cross-app user journeys
- Clean Turbo integration
- Simple CI/CD setup
- Flexibility to run all or specific app tests

The shared package approach scales better as Plane grows and as the apps become more interconnected.
