# Shadow DOM & Web Components Testing

## Challenges

- CSS encapsulation breaks selectors
- Elements hidden from DOM queries
- XPath doesn't penetrate shadow boundaries

## Tool Support

| Tool | Support | Method |
|------|---------|--------|
| Playwright | Native | `>>` piercing selector |
| Cypress | Good | `.shadow()` command |
| Selenium | Limited | JS execution |
| Axe | v5.7+ | API support |

## Playwright Shadow Piercing

```javascript
const input = page.locator('my-component >> .internal-input');
const button = page.locator('comp-a >> comp-b >> button');
const el = page.locator('custom-element >> button:has-text("Click me")');
```

## Cypress Shadow DOM

```javascript
cy.get('my-component').shadow().find('.internal-button').click();

// Enable globally: { includeShadowDom: true }
```

## Selenium Workaround

```javascript
const shadowHost = driver.findElement(By.css('my-component'));
const shadowRoot = driver.executeScript('return arguments[0].shadowRoot', shadowHost);
const button = shadowRoot.findElement(By.css('button'));
```

## Page Object Pattern

```typescript
export class MyComponentPO {
  constructor(private page: Page) {}

  async fillEmail(email: string) {
    await this.page.locator('my-form >> input[type="email"]').fill(email);
  }

  async submit() {
    await this.page.locator('my-form >> button[type="submit"]').click();
  }
}
```

## Best Practices

1. Request `open` shadow roots when possible
2. Encapsulate shadow traversal in page objects
3. Avoid deep nesting (increases complexity)

## Debugging

```javascript
const contents = await page.evaluate(() => {
  return document.querySelector('my-component').shadowRoot.innerHTML;
});
```
