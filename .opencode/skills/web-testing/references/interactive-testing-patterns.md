# Interactive Testing Patterns

## Form Testing

```javascript
// Text input validation
test('validates email format', async ({ page }) => {
  await page.fill('[name="email"]', 'invalid');
  await page.click('button[type="submit"]');
  await expect(page.locator('.error')).toContainText('Invalid email');
});

// Select dropdowns
await page.selectOption('select#country', 'US');
await page.selectOption('select#country', { label: 'United States' });
await page.selectOption('select#tags', ['tag1', 'tag2']); // Multi-select

// Checkboxes & radios
await page.check('input[name="terms"]');
await expect(page.locator('input[name="terms"]')).toBeChecked();
await page.uncheck('input[name="newsletter"]');
await page.check('input[value="premium"]'); // Radio

// File uploads
await page.setInputFiles('input[type="file"]', 'path/to/file.pdf');
await page.setInputFiles('input[type="file"]', ['file1.pdf', 'file2.pdf']);

// Date picker
await page.fill('input[type="date"]', '2025-12-25');
await page.click('.date-picker-trigger');
await page.click('.calendar-day:text("25")');
```

## Keyboard Navigation

```javascript
test('keyboard accessibility', async ({ page }) => {
  await page.keyboard.press('Tab');
  await expect(page.locator(':focus')).toHaveAttribute('data-testid', 'first-btn');
  await page.keyboard.press('Enter'); // Activate
  await page.keyboard.press('Escape'); // Close modal
  await page.keyboard.press('Shift+Tab'); // Navigate backward
});
```

## Drag & Drop

```javascript
await page.dragAndDrop('#source', '#target');

// Manual control
const source = page.locator('#draggable');
await source.hover();
await page.mouse.down();
await page.locator('#dropzone').hover();
await page.mouse.up();
```

## Hover & Modals

```javascript
await button.hover();
await expect(page.locator('.tooltip')).toBeVisible();

// Modal workflow
await page.click('button:text("Open")');
await expect(page.locator('[role="dialog"]')).toBeVisible();
await page.click('[aria-label="Close"]');
await expect(page.locator('[role="dialog"]')).not.toBeVisible();
```

## Scroll & Wait Patterns

```javascript
await page.locator('#footer').scrollIntoViewIfNeeded();
await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

// Wait patterns
await page.waitForLoadState('networkidle');
await Promise.all([page.waitForResponse('**/api/data'), page.click('button.load')]);
```

## Disable Animations

```javascript
await page.addStyleTag({
  content: '* { animation-duration: 0s !important; transition-duration: 0s !important; }'
});
```
