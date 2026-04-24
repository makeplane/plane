# Visual Regression Testing

## Playwright Screenshot Comparison

```typescript
import { test, expect } from '@playwright/test';

test('homepage visual', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await expect(page).toHaveScreenshot('homepage.png');
});

test('component visual', async ({ page }) => {
  await page.goto('http://localhost:3000');
  const header = page.locator('header');
  await expect(header).toHaveScreenshot('header.png');
});

test('with threshold', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await expect(page).toHaveScreenshot('page.png', {
    maxDiffPixels: 100,
    maxDiffPixelRatio: 0.01,
  });
});
```

## Configuration

```typescript
// playwright.config.ts
export default defineConfig({
  expect: {
    toHaveScreenshot: { maxDiffPixels: 50, threshold: 0.2 },
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['iPhone 12'] } },
  ],
});
```

## Commands

```bash
npx playwright test --update-snapshots        # Update all
npx playwright test visual.spec.ts -u         # Update specific
```

## Workflow

1. **Baseline**: First run creates reference screenshots
2. **Compare**: Subsequent runs compare against baseline
3. **Review**: Check diff images on failure
4. **Approve**: Update snapshots if change is intentional

## Best Practices

- Test critical UI components individually
- Use consistent viewport sizes
- Disable animations: `animation-duration: 0s !important`
- Mock dynamic content (dates, random data)
- Run on CI with consistent environment

## Third-Party Tools

| Tool | Use Case |
|------|----------|
| Percy | Cloud-based, BrowserStack integration |
| Chromatic | Storybook visual testing |
| Playwright | Built-in, no vendor lock-in |

## CI Integration

```yaml
- name: Visual Tests
  run: npx playwright test --grep @visual
- uses: actions/upload-artifact@v4
  if: failure()
  with:
    name: visual-diffs
    path: test-results/
```

## Visual vs Accessibility

| Aspect | Visual | Accessibility |
|--------|--------|---------------|
| Catches | Layout, colors | Semantic, ARIA |
| Method | Pixel diff | DOM analysis |

**Use both**: Visual misses semantic issues, a11y misses layout bugs.
