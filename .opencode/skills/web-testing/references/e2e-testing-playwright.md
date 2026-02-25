# E2E Testing with Playwright

## Setup

```bash
npm init playwright@latest
npx playwright install
```

## Test Structure

```typescript
import { test, expect } from '@playwright/test';

test.describe('User Login', () => {
  test('should login successfully', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill('user@example.com');
    await page.getByLabel('Password').fill('password123');
    await page.getByRole('button', { name: 'Login' }).click();
    await expect(page).toHaveURL('/dashboard');
  });
});
```

## Selector Priority (Accessibility-First)

1. `getByRole('button', { name: 'Submit' })` - Most preferred
2. `getByLabel('Email')` - Form fields
3. `getByPlaceholderText('Search')` - Inputs
4. `getByText('Welcome')` - Static text
5. `getByTestId('submit-btn')` - Last resort

## Advanced Fixtures

### Worker-Scoped Authentication

```typescript
// fixtures/auth.ts
export const test = baseTest.extend<{ authPage: Page }>({
  authPage: [async ({ browser, request }, use, testInfo) => {
    // API login per worker
    const res = await request.post('/api/auth', {
      data: { email: 'test@example.com', password: 'pass' }
    });
    const { token } = await res.json();

    const context = await browser.newContext();
    await context.addCookies([
      { name: 'token', value: token, domain: 'localhost', path: '/' }
    ]);
    const page = await context.newPage();
    await use(page);
    await context.close();
  }, { scope: 'worker' }]
});
```

### Database Seeding Fixture

```typescript
// See ./database-testing.md for Testcontainers patterns
```

## Network Patterns

### Wait for API

```typescript
const responsePromise = page.waitForResponse('**/api/users');
await page.click('button:text("Load")');
await responsePromise;
```

### Mock API

```typescript
await page.route('**/api/users', route =>
  route.fulfill({ status: 200, body: JSON.stringify([]) })
);
```

## Configuration

```typescript
export default defineConfig({
  workers: process.env.CI ? 1 : undefined,
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  use: {
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
    video: 'retain-on-failure',
  },
});
```

## Sharding (CI)

```bash
npx playwright test --shard=1/4
npx playwright test --shard=2/4
```

## Commands

```bash
npx playwright test                    # Run all
npx playwright test --ui               # UI mode
npx playwright test --project=chromium # Specific browser
npx playwright codegen https://example.com  # Generate
npx playwright show-report             # View report
```

## Related

- `./playwright-component-testing.md` - CT patterns
- `./playwright-fixtures-advanced.md` - Complex fixtures
- `./database-testing.md` - DB fixtures
