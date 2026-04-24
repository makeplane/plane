# Cross-Browser & Responsive Testing

## Browser Coverage

| Browser | Priority |
|---------|----------|
| Chrome | Mandatory |
| Safari | Mandatory (mobile) |
| Edge | Mandatory |
| Firefox | Recommended |

## Device Breakpoints

| Device | Viewport | Priority |
|--------|----------|----------|
| Mobile S | 320px | High |
| Mobile M | 375px | High |
| Tablet | 768px | High |
| Laptop | 1024px | High |
| Desktop | 1440px | High |

## Playwright Config

```typescript
import { devices } from '@playwright/test';

export default defineConfig({
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    { name: 'mobile-chrome', use: { ...devices['Pixel 5'] } },
    { name: 'mobile-safari', use: { ...devices['iPhone 12'] } },
  ],
});
```

## Responsive Checklist

### Layout
- [ ] Content reflows at all breakpoints
- [ ] No horizontal scrolling on mobile
- [ ] Navigation transforms to mobile menu
- [ ] Touch targets 44px minimum

### Forms
- [ ] Input fields usable on mobile
- [ ] Touch keyboard doesn't obscure inputs
- [ ] Date pickers mobile-friendly

### Interactive
- [ ] Hover states have touch alternatives
- [ ] Modals size appropriate per device

## Browser-Specific Issues

- **Safari**: flexbox gap, date input, WebP
- **Firefox**: CSS grid subgrid, custom scrollbars
- **Edge**: Same as Chromium (verify anyway)

## Commands

```bash
npx playwright test --project=chromium
npx playwright test --project=mobile-chrome --project=mobile-safari
```

## Testing Services

- **BrowserStack**: Real device cloud
- **Sauce Labs**: Cross-browser cloud
- **Playwright**: Local emulation (free)
