# Puppeteer Quick Reference

Complete guide to browser automation with Puppeteer - a high-level API over Chrome DevTools Protocol.

## Table of Contents

- [Setup](#setup)
- [Browser & Page Management](#browser--page-management)
- [Navigation](#navigation)
- [Element Interaction](#element-interaction)
- [JavaScript Execution](#javascript-execution)
- [Screenshots & PDFs](#screenshots--pdfs)
- [Network Interception](#network-interception)
- [Device Emulation](#device-emulation)
- [Performance](#performance)
- [Common Patterns](#common-patterns)

---

## Setup

### Installation

```bash
# Install Puppeteer
npm install puppeteer

# Install core only (bring your own Chrome)
npm install puppeteer-core
```

### Basic Usage

```javascript
import puppeteer from 'puppeteer';

// Launch browser
const browser = await puppeteer.launch({
  headless: true,
  args: ['--no-sandbox']
});

// Open page
const page = await browser.newPage();

// Navigate
await page.goto('https://example.com');

// Do work...

// Cleanup
await browser.close();
```

---

## Browser & Page Management

### Launch Browser

```javascript
const browser = await puppeteer.launch({
  // Visibility
  headless: false,              // Show browser UI
  headless: 'new',              // New headless mode (Chrome 112+)

  // Chrome location
  executablePath: '/path/to/chrome',
  channel: 'chrome',            // or 'chrome-canary', 'chrome-beta'

  // Browser context
  userDataDir: './user-data',   // Persistent profile

  // Window size
  defaultViewport: {
    width: 1920,
    height: 1080,
    deviceScaleFactor: 1,
    isMobile: false
  },

  // Advanced options
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-web-security',
    '--disable-features=IsolateOrigins',
    '--disable-site-isolation-trials',
    '--start-maximized'
  ],

  // Debugging
  devtools: true,               // Open DevTools automatically
  slowMo: 250,                  // Slow down by 250ms per action

  // Network
  proxy: {
    server: 'http://proxy.com:8080'
  }
});
```

### Connect to Running Browser

```javascript
// Launch Chrome with debugging
// google-chrome --remote-debugging-port=9222

const browser = await puppeteer.connect({
  browserURL: 'http://localhost:9222',
  // or browserWSEndpoint: 'ws://localhost:9222/devtools/browser/...'
});
```

### Page Management

```javascript
// Create new page
const page = await browser.newPage();

// Get all pages
const pages = await browser.pages();

// Close page
await page.close();

// Multiple pages
const page1 = await browser.newPage();
const page2 = await browser.newPage();

// Switch between pages
await page1.bringToFront();
```

### Browser Context (Incognito)

```javascript
// Create isolated context
const context = await browser.createBrowserContext();
const page = await context.newPage();

// Cleanup context
await context.close();
```

---

## Navigation

### Basic Navigation

```javascript
// Navigate to URL
await page.goto('https://example.com');

// Navigate with options
await page.goto('https://example.com', {
  waitUntil: 'networkidle2',    // or 'load', 'domcontentloaded', 'networkidle0'
  timeout: 30000                 // Max wait time (ms)
});

// Reload page
await page.reload({ waitUntil: 'networkidle2' });

// Navigation history
await page.goBack();
await page.goForward();

// Wait for navigation
await page.waitForNavigation({
  waitUntil: 'networkidle2'
});
```

### Wait Until Options

- `load` - Wait for load event
- `domcontentloaded` - Wait for DOMContentLoaded event
- `networkidle0` - Wait until no network connections for 500ms
- `networkidle2` - Wait until max 2 network connections for 500ms

---

## Element Interaction

### Selectors

```javascript
// CSS selectors
await page.$('#id');
await page.$('.class');
await page.$('div > p');

// XPath
await page.$x('//button[text()="Submit"]');

// Get all matching elements
await page.$$('.item');
await page.$$x('//div[@class="item"]');
```

### Click Elements

```javascript
// Click by selector
await page.click('.button');

// Click with options
await page.click('.button', {
  button: 'left',           // or 'right', 'middle'
  clickCount: 1,            // 2 for double-click
  delay: 100                // Delay between mousedown and mouseup
});

// ElementHandle click
const button = await page.$('.button');
await button.click();
```

### Type Text

```javascript
// Type into input
await page.type('#search', 'query text');

// Type with delay
await page.type('#search', 'slow typing', { delay: 100 });

// Clear and type
await page.$eval('#search', el => el.value = '');
await page.type('#search', 'new text');
```

### Form Interaction

```javascript
// Fill input
await page.type('#username', 'john@example.com');
await page.type('#password', 'secret123');

// Select dropdown option
await page.select('#country', 'US');           // By value
await page.select('#country', 'USA', 'UK');    // Multiple

// Check/uncheck checkbox
await page.click('input[type="checkbox"]');

// Choose radio button
await page.click('input[value="option2"]');

// Upload file
const input = await page.$('input[type="file"]');
await input.uploadFile('/path/to/file.pdf');

// Submit form
await page.click('button[type="submit"]');
await page.waitForNavigation();
```

### Hover & Focus

```javascript
// Hover over element
await page.hover('.menu-item');

// Focus element
await page.focus('#input');

// Blur
await page.$eval('#input', el => el.blur());
```

### Drag & Drop

```javascript
const source = await page.$('.draggable');
const target = await page.$('.drop-zone');

await source.drag(target);
await source.drop(target);
```

---

## JavaScript Execution

### Evaluate in Page Context

```javascript
// Execute JavaScript
const title = await page.evaluate(() => document.title);

// With arguments
const text = await page.evaluate(
  (selector) => document.querySelector(selector).textContent,
  '.heading'
);

// Return complex data
const data = await page.evaluate(() => ({
  title: document.title,
  url: location.href,
  cookies: document.cookie
}));

// With ElementHandle
const element = await page.$('.button');
const text = await page.evaluate(el => el.textContent, element);
```

### Query & Modify DOM

```javascript
// Get element property
const value = await page.$eval('#input', el => el.value);

// Get multiple elements
const items = await page.$$eval('.item', elements =>
  elements.map(el => el.textContent)
);

// Modify element
await page.$eval('#input', (el, value) => {
  el.value = value;
}, 'new value');

// Add class
await page.$eval('.element', el => el.classList.add('active'));
```

### Expose Functions

```javascript
// Expose Node.js function to page
await page.exposeFunction('md5', (text) =>
  crypto.createHash('md5').update(text).digest('hex')
);

// Call from page context
const hash = await page.evaluate(async () => {
  return await window.md5('hello world');
});
```

---

## Screenshots & PDFs

### Screenshots

```javascript
// Full page screenshot
await page.screenshot({
  path: 'screenshot.png',
  fullPage: true
});

// Viewport screenshot
await page.screenshot({
  path: 'viewport.png',
  fullPage: false
});

// Element screenshot
const element = await page.$('.chart');
await element.screenshot({
  path: 'chart.png'
});

// Screenshot options
await page.screenshot({
  path: 'page.png',
  type: 'png',              // or 'jpeg', 'webp'
  quality: 80,              // JPEG quality (0-100)
  clip: {                   // Crop region
    x: 0,
    y: 0,
    width: 500,
    height: 500
  },
  omitBackground: true      // Transparent background
});

// Screenshot to buffer
const buffer = await page.screenshot();
```

### PDF Generation

```javascript
// Generate PDF
await page.pdf({
  path: 'page.pdf',
  format: 'A4',             // or 'Letter', 'Legal', etc.
  printBackground: true,
  margin: {
    top: '1cm',
    right: '1cm',
    bottom: '1cm',
    left: '1cm'
  }
});

// Custom page size
await page.pdf({
  path: 'custom.pdf',
  width: '8.5in',
  height: '11in',
  landscape: true
});

// Header and footer
await page.pdf({
  path: 'report.pdf',
  displayHeaderFooter: true,
  headerTemplate: '<div style="font-size:10px;">Header</div>',
  footerTemplate: '<div style="font-size:10px;">Page <span class="pageNumber"></span></div>'
});
```

---

## Network Interception

### Request Interception

```javascript
// Enable request interception
await page.setRequestInterception(true);

// Intercept requests
page.on('request', (request) => {
  // Block specific resource types
  if (request.resourceType() === 'image') {
    request.abort();
  }
  // Block URLs
  else if (request.url().includes('ads')) {
    request.abort();
  }
  // Modify request
  else if (request.url().includes('api')) {
    request.continue({
      headers: {
        ...request.headers(),
        'Authorization': 'Bearer token'
      }
    });
  }
  // Continue normally
  else {
    request.continue();
  }
});
```

### Mock Responses

```javascript
await page.setRequestInterception(true);

page.on('request', (request) => {
  if (request.url().includes('/api/user')) {
    request.respond({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: 1,
        name: 'Mock User'
      })
    });
  } else {
    request.continue();
  }
});
```

### Monitor Network

```javascript
// Track requests
page.on('request', (request) => {
  console.log('Request:', request.method(), request.url());
});

// Track responses
page.on('response', (response) => {
  console.log('Response:', response.status(), response.url());
});

// Track failed requests
page.on('requestfailed', (request) => {
  console.log('Failed:', request.failure().errorText, request.url());
});

// Get response body
page.on('response', async (response) => {
  if (response.url().includes('/api/data')) {
    const json = await response.json();
    console.log('API Data:', json);
  }
});
```

---

## Device Emulation

### Predefined Devices

```javascript
import { devices } from 'puppeteer';

// Emulate iPhone
const iPhone = devices['iPhone 13 Pro'];
await page.emulate(iPhone);

// Common devices
const iPad = devices['iPad Pro'];
const pixel = devices['Pixel 5'];
const galaxy = devices['Galaxy S9+'];

// Navigate after emulation
await page.goto('https://example.com');
```

### Custom Device

```javascript
await page.emulate({
  viewport: {
    width: 375,
    height: 812,
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
    isLandscape: false
  },
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)...'
});
```

### Viewport Only

```javascript
await page.setViewport({
  width: 1920,
  height: 1080,
  deviceScaleFactor: 1
});
```

### Geolocation

```javascript
// Set geolocation
await page.setGeolocation({
  latitude: 37.7749,
  longitude: -122.4194,
  accuracy: 100
});

// Grant permissions
const context = browser.defaultBrowserContext();
await context.overridePermissions('https://example.com', ['geolocation']);
```

### Timezone & Locale

```javascript
// Set timezone
await page.emulateTimezone('America/New_York');

// Set locale
await page.emulateMediaType('screen');
await page.evaluateOnNewDocument(() => {
  Object.defineProperty(navigator, 'language', {
    get: () => 'en-US'
  });
});
```

---

## Performance

### CPU & Network Throttling

```javascript
// CPU throttling
const client = await page.createCDPSession();
await client.send('Emulation.setCPUThrottlingRate', { rate: 4 });

// Network throttling
await page.emulateNetworkConditions({
  offline: false,
  downloadThroughput: 1.5 * 1024 * 1024 / 8, // 1.5 Mbps
  uploadThroughput: 750 * 1024 / 8,           // 750 Kbps
  latency: 40                                  // 40ms RTT
});

// Predefined profiles
await page.emulateNetworkConditions(
  puppeteer.networkConditions['Fast 3G']
);

// Disable throttling
await page.emulateNetworkConditions({
  offline: false,
  downloadThroughput: -1,
  uploadThroughput: -1,
  latency: 0
});
```

### Performance Metrics

```javascript
// Get metrics
const metrics = await page.metrics();
console.log(metrics);
// {
//   Timestamp, Documents, Frames, JSEventListeners,
//   Nodes, LayoutCount, RecalcStyleCount,
//   LayoutDuration, RecalcStyleDuration,
//   ScriptDuration, TaskDuration,
//   JSHeapUsedSize, JSHeapTotalSize
// }
```

### Performance Tracing

```javascript
// Start tracing
await page.tracing.start({
  path: 'trace.json',
  categories: [
    'devtools.timeline',
    'disabled-by-default-devtools.timeline'
  ]
});

// Navigate
await page.goto('https://example.com');

// Stop tracing
await page.tracing.stop();

// Analyze trace in chrome://tracing
```

### Coverage (Code Usage)

```javascript
// Start JS coverage
await page.coverage.startJSCoverage();

// Start CSS coverage
await page.coverage.startCSSCoverage();

// Navigate
await page.goto('https://example.com');

// Stop and get coverage
const jsCoverage = await page.coverage.stopJSCoverage();
const cssCoverage = await page.coverage.stopCSSCoverage();

// Calculate unused bytes
let totalBytes = 0;
let usedBytes = 0;
for (const entry of [...jsCoverage, ...cssCoverage]) {
  totalBytes += entry.text.length;
  for (const range of entry.ranges) {
    usedBytes += range.end - range.start - 1;
  }
}

console.log(`Used: ${usedBytes / totalBytes * 100}%`);
```

---

## Common Patterns

### Wait for Elements

```javascript
// Wait for selector
await page.waitForSelector('.element', {
  visible: true,
  timeout: 5000
});

// Wait for XPath
await page.waitForXPath('//button[text()="Submit"]');

// Wait for function
await page.waitForFunction(
  () => document.querySelector('.loading') === null,
  { timeout: 10000 }
);

// Wait for timeout
await page.waitForTimeout(2000);
```

### Handle Dialogs

```javascript
// Alert, confirm, prompt
page.on('dialog', async (dialog) => {
  console.log(dialog.type(), dialog.message());

  // Accept
  await dialog.accept();
  // or reject
  // await dialog.dismiss();
  // or provide input for prompt
  // await dialog.accept('input text');
});
```

### Handle Downloads

```javascript
// Set download path
const client = await page.createCDPSession();
await client.send('Page.setDownloadBehavior', {
  behavior: 'allow',
  downloadPath: '/path/to/downloads'
});

// Trigger download
await page.click('a[download]');
```

### Multiple Pages (Tabs)

```javascript
// Listen for new pages
browser.on('targetcreated', async (target) => {
  if (target.type() === 'page') {
    const newPage = await target.page();
    console.log('New page opened:', newPage.url());
  }
});

// Click link that opens new tab
const [newPage] = await Promise.all([
  new Promise(resolve => browser.once('targetcreated', target => resolve(target.page()))),
  page.click('a[target="_blank"]')
]);

console.log('New page URL:', newPage.url());
```

### Frames (iframes)

```javascript
// Get all frames
const frames = page.frames();

// Find frame by name
const frame = page.frames().find(f => f.name() === 'myframe');

// Find frame by URL
const frame = page.frames().find(f => f.url().includes('example.com'));

// Main frame
const mainFrame = page.mainFrame();

// Interact with frame
await frame.click('.button');
await frame.type('#input', 'text');
```

### Infinite Scroll

```javascript
async function autoScroll(page) {
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      let totalHeight = 0;
      const distance = 100;
      const timer = setInterval(() => {
        const scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;

        if (totalHeight >= scrollHeight) {
          clearInterval(timer);
          resolve();
        }
      }, 100);
    });
  });
}

await autoScroll(page);
```

### Cookies

```javascript
// Get cookies
const cookies = await page.cookies();

// Set cookies
await page.setCookie({
  name: 'session',
  value: 'abc123',
  domain: 'example.com',
  path: '/',
  httpOnly: true,
  secure: true,
  sameSite: 'Strict'
});

// Delete cookies
await page.deleteCookie({ name: 'session' });
```

### Local Storage

```javascript
// Set localStorage
await page.evaluate(() => {
  localStorage.setItem('key', 'value');
});

// Get localStorage
const value = await page.evaluate(() => {
  return localStorage.getItem('key');
});

// Clear localStorage
await page.evaluate(() => localStorage.clear());
```

### Error Handling

```javascript
try {
  await page.goto('https://example.com', {
    waitUntil: 'networkidle2',
    timeout: 30000
  });
} catch (error) {
  if (error.name === 'TimeoutError') {
    console.error('Page load timeout');
  } else {
    console.error('Navigation failed:', error);
  }

  // Take screenshot on error
  await page.screenshot({ path: 'error.png' });
}
```

### Stealth Mode (Avoid Detection)

```javascript
// Hide automation indicators
await page.evaluateOnNewDocument(() => {
  // Override navigator.webdriver
  Object.defineProperty(navigator, 'webdriver', {
    get: () => false
  });

  // Mock chrome object
  window.chrome = {
    runtime: {}
  };

  // Mock permissions
  const originalQuery = window.navigator.permissions.query;
  window.navigator.permissions.query = (parameters) => (
    parameters.name === 'notifications' ?
      Promise.resolve({ state: 'granted' }) :
      originalQuery(parameters)
  );
});

// Set realistic user agent
await page.setUserAgent(
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
);
```

---

## Debugging Tips

### Take Screenshots on Error

```javascript
page.on('pageerror', async (error) => {
  console.error('Page error:', error);
  await page.screenshot({ path: `error-${Date.now()}.png` });
});
```

### Console Logging

```javascript
// Forward console to Node
page.on('console', (msg) => {
  console.log('PAGE LOG:', msg.text());
});
```

### Slow Down Execution

```javascript
const browser = await puppeteer.launch({
  slowMo: 250  // 250ms delay between actions
});
```

### Keep Browser Open

```javascript
const browser = await puppeteer.launch({
  headless: false,
  devtools: true
});

// Prevent auto-close
await page.evaluate(() => debugger);
```

---

## Best Practices

1. **Always close browser:** Use try/finally or process cleanup
2. **Wait appropriately:** Use waitForSelector, not setTimeout
3. **Handle errors:** Wrap navigation in try/catch
4. **Optimize selectors:** Use specific selectors for reliability
5. **Avoid race conditions:** Wait for navigation after clicks
6. **Reuse pages:** Don't create new pages unnecessarily
7. **Set timeouts:** Always specify reasonable timeouts
8. **Clean up:** Close unused pages and contexts

---

## Resources

- [Puppeteer Documentation](https://pptr.dev/)
- [Puppeteer API](https://pptr.dev/api)
- [Puppeteer Examples](https://github.com/puppeteer/puppeteer/tree/main/examples)
- [Awesome Puppeteer](https://github.com/transitive-bullshit/awesome-puppeteer)
