# Accessibility Testing (a11y)

## WCAG 2.1 AA Checklist

### Perceivable
- [ ] Images have meaningful alt text
- [ ] Color not sole conveyance method
- [ ] Contrast ratio 4.5:1 (text)
- [ ] Text resizable to 200%

### Operable
- [ ] All functions keyboard accessible
- [ ] Visible focus indicators
- [ ] Skip navigation links
- [ ] No keyboard traps

### Understandable
- [ ] Language attribute set
- [ ] Labels for form inputs
- [ ] Error messages clear

### Robust
- [ ] Valid HTML
- [ ] ARIA landmarks correct

## Playwright + axe-core

```typescript
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('page is accessible', async ({ page }) => {
  await page.goto('http://localhost:3000');
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});

test('WCAG AA compliant', async ({ page }) => {
  await page.goto('http://localhost:3000');
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2aa'])
    .analyze();
  expect(results.violations).toEqual([]);
});
```

## Component Testing (Jest)

```typescript
import { axe, toHaveNoViolations } from 'jest-axe';
expect.extend(toHaveNoViolations);

test('Button accessible', async () => {
  const { container } = render(<Button>Click</Button>);
  expect(await axe(container)).toHaveNoViolations();
});
```

## Manual Testing

- [ ] Tab through all interactive elements
- [ ] Shift+Tab navigates backward
- [ ] Enter/Space activates buttons
- [ ] Escape closes modals
- [ ] Screen reader announces content

## CLI Tools

```bash
npx @axe-core/cli https://example.com
npx lighthouse https://example.com --only-categories=accessibility
npx pa11y https://example.com
```

## CI Integration

```yaml
- name: Accessibility Tests
  run: npx playwright test --grep @a11y
```

## Resources
- axe rules: https://dequeuniversity.com/rules/axe/
- WCAG checklist: https://www.a11yproject.com/checklist/
