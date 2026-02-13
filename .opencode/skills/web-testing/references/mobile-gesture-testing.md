# Mobile Gesture Testing

## Touch Gestures

### Single-Finger

```javascript
await page.tap('button.submit');                    // Tap
await page.locator('button').click({ delay: 1000 }); // Long press

// Swipe simulation
await page.evaluate(() => {
  const el = document.querySelector('.carousel');
  el.dispatchEvent(new TouchEvent('touchstart', { touches: [{ clientX: 200, clientY: 100 }] }));
  el.dispatchEvent(new TouchEvent('touchend', { touches: [{ clientX: 50, clientY: 100 }] }));
});
```

### Multi-Finger (Pinch/Zoom)

```javascript
await page.evaluate(() => {
  const el = document.querySelector('[data-zoomable]');
  const touch1 = { identifier: 0, clientX: 100, clientY: 100 };
  const touch2 = { identifier: 1, clientX: 120, clientY: 100 };
  el.dispatchEvent(new TouchEvent('touchstart', { touches: [touch1, touch2] }));
  touch1.clientX = 50; touch2.clientX = 170; // Fingers apart = zoom in
  el.dispatchEvent(new TouchEvent('touchmove', { touches: [touch1, touch2] }));
});
```

## Orientation Testing

```javascript
const orientations = [
  { width: 390, height: 844 },  // Portrait
  { width: 844, height: 390 },  // Landscape
];

for (const size of orientations) {
  await page.setViewportSize(size);
  await expect(page).toHaveScreenshot(`mobile-${size.width}.png`);
}
```

## Device Emulation

```typescript
// playwright.config.ts
import { devices } from '@playwright/test';

export default defineConfig({
  projects: [
    { name: 'mobile-chrome', use: { ...devices['Pixel 5'] } },
    { name: 'mobile-safari', use: { ...devices['iPhone 12'] } },
  ],
});
```

## Touch Target Checklist

- [ ] Minimum 44x44px touch targets
- [ ] No overlapping touch areas
- [ ] Sufficient spacing between buttons
- [ ] Swipe gestures have clear affordances

## Real Device Gaps

Emulators miss: network throttling, touch latency, gesture recognition variations.

**Minimum real device testing:** iPhone (Safari iOS), Android flagship (Chrome)

## Device Farm Services

| Service | Devices |
|---------|---------|
| BrowserStack | 3000+ |
| Sauce Labs | 2000+ |
| AWS Device Farm | 200+ |

## Commands

```bash
npx playwright test --project=mobile-chrome --project=mobile-safari
```
