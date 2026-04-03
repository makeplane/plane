# Performance & Core Web Vitals Testing

## Core Web Vitals (2024 Targets)

| Metric | Target | Description |
|--------|--------|-------------|
| LCP | < 2.5s | Largest Contentful Paint |
| CLS | < 0.1 | Cumulative Layout Shift |
| INP | < 200ms | Interaction to Next Paint (replaced FID) |

## Lighthouse CI Setup

```json
// lighthouserc.json
{
  "ci": {
    "collect": {
      "url": ["http://localhost:3000", "http://localhost:3000/dashboard"],
      "numberOfRuns": 3
    },
    "assert": {
      "preset": "lighthouse:recommended",
      "assertions": {
        "categories:performance": ["error", { "minScore": 0.9 }],
        "largest-contentful-paint": ["warn", { "maxNumericValue": 2500 }],
        "cumulative-layout-shift": ["error", { "maxNumericValue": 0.1 }],
        "interactive": ["warn", { "maxNumericValue": 3800 }]
      }
    },
    "upload": {
      "target": "temporary-public-storage"
    }
  }
}
```

## GitHub Actions Integration

```yaml
performance:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - run: npm ci && npm run build
    - run: npm install -g @lhci/cli
    - run: lhci autorun
      env:
        LHCI_GITHUB_APP_TOKEN: ${{ secrets.LHCI_TOKEN }}
```

## Playwright Performance Test

```typescript
test('measure Core Web Vitals', async ({ page }) => {
  await page.goto('/');

  const metrics = await page.evaluate(() => {
    return new Promise((resolve) => {
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lcp = entries.find(e => e.entryType === 'largest-contentful-paint');
        resolve({ lcp: lcp?.startTime });
      }).observe({ type: 'largest-contentful-paint', buffered: true });
    });
  });

  expect(metrics.lcp).toBeLessThan(2500);
});
```

## INP Measurement

```typescript
test('interaction responsiveness', async ({ page }) => {
  await page.goto('/');

  const inp = await page.evaluate(() => {
    return new Promise((resolve) => {
      let maxINP = 0;
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          maxINP = Math.max(maxINP, entry.duration);
        }
        resolve(maxINP);
      }).observe({ type: 'event', buffered: true, durationThreshold: 16 });

      // Trigger interactions
      document.querySelector('button')?.click();
      setTimeout(() => resolve(maxINP), 1000);
    });
  });

  expect(inp).toBeLessThan(200);
});
```

## Quick Commands

```bash
npx lighthouse https://example.com --output=json
npx @lhci/cli autorun
npx bundlesize                    # Bundle size check
npx webpack-bundle-analyzer stats.json
```

## Optimization Checklist

### LCP
- [ ] Lazy load below-fold images
- [ ] Preload critical resources (`<link rel="preload">`)
- [ ] Use CDN for static assets
- [ ] Optimize server response time

### CLS
- [ ] Set explicit width/height on images
- [ ] Reserve space for dynamic content
- [ ] Use `font-display: swap` or `optional`
- [ ] Avoid inserting content above existing

### INP
- [ ] Break long JavaScript tasks (<50ms)
- [ ] Use `requestIdleCallback` for non-critical work
- [ ] Implement code splitting
- [ ] Debounce rapid user interactions
