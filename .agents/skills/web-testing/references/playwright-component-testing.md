# Playwright Component Testing

## Status

**Production-ready** as of 2024. No longer experimental.

## Setup

```bash
npm init playwright@latest -- --ct
```

## Configuration

```typescript
// playwright-ct.config.ts
import { defineConfig, devices } from '@playwright/experimental-ct-react';

export default defineConfig({
  testDir: './src',
  use: {
    ctPort: 3100,
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
});
```

## Basic Test

```typescript
import { test, expect } from '@playwright/experimental-ct-react';
import { Button } from './Button';

test('renders button with text', async ({ mount }) => {
  const component = await mount(<Button>Click me</Button>);
  await expect(component).toContainText('Click me');
});

test('handles click event', async ({ mount }) => {
  let clicked = false;
  const component = await mount(
    <Button onClick={() => clicked = true}>Click</Button>
  );
  await component.click();
  expect(clicked).toBe(true);
});
```

## With Props and State

```typescript
test('counter increments', async ({ mount }) => {
  const component = await mount(<Counter initial={0} />);
  await expect(component.getByTestId('count')).toHaveText('0');
  await component.getByRole('button', { name: 'Increment' }).click();
  await expect(component.getByTestId('count')).toHaveText('1');
});
```

## Visual Regression

```typescript
test('button styles', async ({ mount }) => {
  const component = await mount(<Button variant="primary">Submit</Button>);
  await expect(component).toHaveScreenshot('button-primary.png');
});
```

## Mocking

```typescript
test('with mocked data', async ({ mount }) => {
  const component = await mount(
    <UserContext.Provider value={{ user: { name: 'Test' } }}>
      <Profile />
    </UserContext.Provider>
  );
  await expect(component).toContainText('Test');
});
```

## When to Use CT vs E2E

| Use CT When | Use E2E When |
|-------------|--------------|
| Testing isolated components | Testing user flows |
| Visual regression on components | Navigation, routing |
| Component interactions | Full page behavior |
| Fast feedback during dev | Integration with backend |

## When to Use CT vs Vitest

| Use CT When | Use Vitest When |
|-------------|-----------------|
| Real browser needed | Speed is priority |
| Cross-browser testing | Unit testing logic |
| CSS/layout verification | Mocking is simpler |
| Complex DOM interactions | jsdom is sufficient |

## Limitations

- Complex object passing requires serialization
- Slower than jsdom-based tests
- Watch mode less efficient than Vitest

## Commands

```bash
npx playwright test -c playwright-ct.config.ts
npx playwright test -c playwright-ct.config.ts --ui
```
