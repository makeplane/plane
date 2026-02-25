# Test Flakiness Mitigation

## Root Causes

- Timing mismatches (hard waits)
- Non-isolated tests (shared state)
- Network instability
- Animation timing

## Explicit Waits (Not Hard Waits)

```javascript
// BAD: Hard wait
await new Promise(r => setTimeout(r, 500));

// GOOD: Wait for condition
await page.waitForSelector('.success', { timeout: 10000 });
await expect(page.locator('.count')).toContainText('5');

// BEST: Playwright auto-wait
await page.getByRole('button', { name: /submit/i }).click();
```

## Wait Timeout Guidelines

| Scenario | Timeout |
|----------|---------|
| Page load | 10-15s |
| Element visibility | 5-10s |
| API responses | 30-60s |

## Retry Strategies

```javascript
// Playwright built-in
test.describe.configure({ retries: 3 });

// Per-test
test('flaky test', async ({ page }) => { /* */ }, { retries: 3 });

// Exponential backoff
async function retryWithBackoff(fn, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try { return await fn(); }
    catch (e) {
      if (i === maxRetries - 1) throw e;
      await new Promise(r => setTimeout(r, Math.pow(2, i) * 1000));
    }
  }
}
```

## Test Isolation

```javascript
// BAD: Dependent tests
let userId;
test('create', async () => { userId = await createUser(); });
test('load', async () => { await loadUser(userId); }); // Depends on previous!

// GOOD: Independent
test('create and load', async ({ page }) => {
  const userId = await createUser(page);
  await loadUser(page, userId);
});
```

## Disable Animations

```css
* { animation-duration: 0s !important; transition-duration: 0s !important; }
```

## Network Stability

```javascript
await page.route('**/external-api/**', route =>
  route.fulfill({ status: 200, body: '{}' })
);
```

## Flakiness Detection

```bash
npx playwright test --repeat-each=5
```
