# Performance Analysis Guide

Comprehensive guide to analyzing web performance using Chrome DevTools Protocol, Puppeteer, and chrome-devtools skill.

## Table of Contents

- [Core Web Vitals](#core-web-vitals)
- [Performance Tracing](#performance-tracing)
- [Network Analysis](#network-analysis)
- [JavaScript Performance](#javascript-performance)
- [Rendering Performance](#rendering-performance)
- [Memory Analysis](#memory-analysis)
- [Optimization Strategies](#optimization-strategies)

---

## Core Web Vitals

### Overview

Core Web Vitals are Google's standardized metrics for measuring user experience:

- **LCP (Largest Contentful Paint)** - Loading performance (< 2.5s good)
- **FID (First Input Delay)** - Interactivity (< 100ms good)
- **CLS (Cumulative Layout Shift)** - Visual stability (< 0.1 good)

### Measuring with chrome-devtools-mcp

```javascript
// Start performance trace
await useTool('performance_start_trace', {
  categories: ['loading', 'rendering', 'scripting']
});

// Navigate to page
await useTool('navigate_page', {
  url: 'https://example.com'
});

// Wait for complete load
await useTool('wait_for', {
  waitUntil: 'networkidle'
});

// Stop trace and get data
await useTool('performance_stop_trace');

// Get AI-powered insights
const insights = await useTool('performance_analyze_insight');

// insights will include:
// - LCP timing
// - FID analysis
// - CLS score
// - Performance recommendations
```

### Measuring with Puppeteer

```javascript
import puppeteer from 'puppeteer';

const browser = await puppeteer.launch();
const page = await browser.newPage();

// Measure Core Web Vitals
await page.goto('https://example.com', {
  waitUntil: 'networkidle2'
});

const vitals = await page.evaluate(() => {
  return new Promise((resolve) => {
    const vitals = {
      LCP: null,
      FID: null,
      CLS: 0
    };

    // LCP
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      vitals.LCP = entries[entries.length - 1].renderTime ||
                   entries[entries.length - 1].loadTime;
    }).observe({ entryTypes: ['largest-contentful-paint'] });

    // FID
    new PerformanceObserver((list) => {
      vitals.FID = list.getEntries()[0].processingStart -
                   list.getEntries()[0].startTime;
    }).observe({ entryTypes: ['first-input'] });

    // CLS
    new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (!entry.hadRecentInput) {
          vitals.CLS += entry.value;
        }
      });
    }).observe({ entryTypes: ['layout-shift'] });

    // Wait 5 seconds for metrics
    setTimeout(() => resolve(vitals), 5000);
  });
});

console.log('Core Web Vitals:', vitals);
```

### Other Important Metrics

**TTFB (Time to First Byte)**
```javascript
const ttfb = await page.evaluate(() => {
  const [navigationEntry] = performance.getEntriesByType('navigation');
  return navigationEntry.responseStart - navigationEntry.requestStart;
});
```

**FCP (First Contentful Paint)**
```javascript
const fcp = await page.evaluate(() => {
  const paintEntries = performance.getEntriesByType('paint');
  const fcpEntry = paintEntries.find(e => e.name === 'first-contentful-paint');
  return fcpEntry ? fcpEntry.startTime : null;
});
```

**TTI (Time to Interactive)**
```javascript
// Requires lighthouse or manual calculation
const tti = await page.evaluate(() => {
  // Complex calculation based on network idle and long tasks
  // Best to use Lighthouse for accurate TTI
});
```

---

## Performance Tracing

### Chrome Trace Categories

**Loading:**
- Page load events
- Resource loading
- Parser activity

**Rendering:**
- Layout calculations
- Paint operations
- Compositing

**Scripting:**
- JavaScript execution
- V8 compilation
- Garbage collection

**Network:**
- HTTP requests
- WebSocket traffic
- Resource fetching

**Input:**
- User input processing
- Touch/scroll events

**GPU:**
- GPU operations
- Compositing work

### Record Performance Trace

**Using chrome-devtools-mcp:**
```javascript
// Start trace with specific categories
await useTool('performance_start_trace', {
  categories: ['loading', 'rendering', 'scripting', 'network']
});

// Perform actions
await useTool('navigate_page', { url: 'https://example.com' });
await useTool('wait_for', { waitUntil: 'networkidle' });

// Optional: Interact with page
await useTool('click', { uid: 'button-uid' });

// Stop trace
const traceData = await useTool('performance_stop_trace');

// Analyze trace
const insights = await useTool('performance_analyze_insight');
```

**Using Puppeteer:**
```javascript
// Start tracing
await page.tracing.start({
  path: 'trace.json',
  categories: [
    'devtools.timeline',
    'disabled-by-default-devtools.timeline',
    'disabled-by-default-v8.cpu_profiler'
  ]
});

// Navigate
await page.goto('https://example.com', {
  waitUntil: 'networkidle2'
});

// Stop tracing
await page.tracing.stop();

// Analyze in Chrome DevTools (chrome://tracing)
```

### Analyze Trace Data

**Key Metrics from Trace:**

1. **Main Thread Activity**
   - JavaScript execution time
   - Layout/reflow time
   - Paint time
   - Long tasks (> 50ms)

2. **Network Waterfall**
   - Request start times
   - DNS lookup
   - Connection time
   - Download time

3. **Rendering Pipeline**
   - DOM construction
   - Style calculation
   - Layout
   - Paint
   - Composite

**Common Issues to Look For:**
- Long tasks blocking main thread
- Excessive JavaScript execution
- Layout thrashing
- Unnecessary repaints
- Slow network requests
- Large bundle sizes

---

## Network Analysis

### Monitor Network Requests

**Using chrome-devtools-mcp:**
```javascript
// Navigate to page
await useTool('navigate_page', { url: 'https://example.com' });

// Wait for all requests
await useTool('wait_for', { waitUntil: 'networkidle' });

// List all requests
const requests = await useTool('list_network_requests', {
  resourceTypes: ['Document', 'Script', 'Stylesheet', 'Image', 'XHR', 'Fetch'],
  pageSize: 100
});

// Analyze specific request
for (const req of requests.requests) {
  const details = await useTool('get_network_request', {
    requestId: req.id
  });

  console.log({
    url: details.url,
    method: details.method,
    status: details.status,
    size: details.encodedDataLength,
    time: details.timing.receiveHeadersEnd - details.timing.requestTime,
    cached: details.fromCache
  });
}
```

**Using Puppeteer:**
```javascript
const requests = [];

// Capture all requests
page.on('request', (request) => {
  requests.push({
    url: request.url(),
    method: request.method(),
    resourceType: request.resourceType(),
    headers: request.headers()
  });
});

// Capture responses
page.on('response', (response) => {
  const request = response.request();
  console.log({
    url: response.url(),
    status: response.status(),
    size: response.headers()['content-length'],
    cached: response.fromCache(),
    timing: response.timing()
  });
});

await page.goto('https://example.com');
```

### Network Performance Metrics

**Calculate Total Page Weight:**
```javascript
let totalBytes = 0;
let resourceCounts = {};

page.on('response', async (response) => {
  const type = response.request().resourceType();
  const buffer = await response.buffer();

  totalBytes += buffer.length;
  resourceCounts[type] = (resourceCounts[type] || 0) + 1;
});

await page.goto('https://example.com');

console.log('Total size:', (totalBytes / 1024 / 1024).toFixed(2), 'MB');
console.log('Resources:', resourceCounts);
```

**Identify Slow Requests:**
```javascript
page.on('response', (response) => {
  const timing = response.timing();
  const totalTime = timing.receiveHeadersEnd - timing.requestTime;

  if (totalTime > 1000) { // Slower than 1 second
    console.log('Slow request:', {
      url: response.url(),
      time: totalTime.toFixed(2) + 'ms',
      size: response.headers()['content-length']
    });
  }
});
```

### Network Throttling

**Simulate Slow Connection:**
```javascript
// Using chrome-devtools-mcp
await useTool('emulate_network', {
  throttlingOption: 'Slow 3G'  // or 'Fast 3G', 'Slow 4G'
});

// Using Puppeteer
const client = await page.createCDPSession();
await client.send('Network.emulateNetworkConditions', {
  offline: false,
  downloadThroughput: 400 * 1024 / 8,  // 400 Kbps
  uploadThroughput: 400 * 1024 / 8,
  latency: 2000  // 2000ms RTT
});
```

---

## JavaScript Performance

### Identify Long Tasks

**Using Performance Observer:**
```javascript
await page.evaluate(() => {
  return new Promise((resolve) => {
    const longTasks = [];

    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        longTasks.push({
          name: entry.name,
          duration: entry.duration,
          startTime: entry.startTime
        });
      });
    });

    observer.observe({ entryTypes: ['longtask'] });

    // Collect for 10 seconds
    setTimeout(() => {
      observer.disconnect();
      resolve(longTasks);
    }, 10000);
  });
});
```

### CPU Profiling

**Using Puppeteer:**
```javascript
// Start CPU profiling
const client = await page.createCDPSession();
await client.send('Profiler.enable');
await client.send('Profiler.start');

// Navigate and interact
await page.goto('https://example.com');
await page.click('.button');

// Stop profiling
const { profile } = await client.send('Profiler.stop');

// Analyze profile (flame graph data)
// Import into Chrome DevTools for visualization
```

### JavaScript Coverage

**Identify Unused Code:**
```javascript
// Start coverage
await Promise.all([
  page.coverage.startJSCoverage(),
  page.coverage.startCSSCoverage()
]);

// Navigate
await page.goto('https://example.com');

// Stop coverage
const [jsCoverage, cssCoverage] = await Promise.all([
  page.coverage.stopJSCoverage(),
  page.coverage.stopCSSCoverage()
]);

// Calculate unused bytes
function calculateUnusedBytes(coverage) {
  let usedBytes = 0;
  let totalBytes = 0;

  for (const entry of coverage) {
    totalBytes += entry.text.length;
    for (const range of entry.ranges) {
      usedBytes += range.end - range.start - 1;
    }
  }

  return {
    usedBytes,
    totalBytes,
    unusedBytes: totalBytes - usedBytes,
    unusedPercentage: ((totalBytes - usedBytes) / totalBytes * 100).toFixed(2)
  };
}

console.log('JS Coverage:', calculateUnusedBytes(jsCoverage));
console.log('CSS Coverage:', calculateUnusedBytes(cssCoverage));
```

### Bundle Size Analysis

**Analyze JavaScript Bundles:**
```javascript
page.on('response', async (response) => {
  const url = response.url();
  const type = response.request().resourceType();

  if (type === 'script') {
    const buffer = await response.buffer();
    const size = buffer.length;

    console.log({
      url: url.split('/').pop(),
      size: (size / 1024).toFixed(2) + ' KB',
      gzipped: response.headers()['content-encoding'] === 'gzip'
    });
  }
});
```

---

## Rendering Performance

### Layout Thrashing Detection

**Monitor Layout Recalculations:**
```javascript
// Using Performance Observer
await page.evaluate(() => {
  return new Promise((resolve) => {
    const measurements = [];

    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.entryType === 'measure' &&
            entry.name.includes('layout')) {
          measurements.push({
            name: entry.name,
            duration: entry.duration,
            startTime: entry.startTime
          });
        }
      });
    });

    observer.observe({ entryTypes: ['measure'] });

    setTimeout(() => {
      observer.disconnect();
      resolve(measurements);
    }, 5000);
  });
});
```

### Paint and Composite Metrics

**Get Paint Metrics:**
```javascript
const paintMetrics = await page.evaluate(() => {
  const paints = performance.getEntriesByType('paint');
  return {
    firstPaint: paints.find(p => p.name === 'first-paint')?.startTime,
    firstContentfulPaint: paints.find(p => p.name === 'first-contentful-paint')?.startTime
  };
});
```

### Frame Rate Analysis

**Monitor FPS:**
```javascript
await page.evaluate(() => {
  return new Promise((resolve) => {
    let frames = 0;
    let lastTime = performance.now();

    function countFrames() {
      frames++;
      requestAnimationFrame(countFrames);
    }

    countFrames();

    setTimeout(() => {
      const now = performance.now();
      const elapsed = (now - lastTime) / 1000;
      const fps = frames / elapsed;
      resolve(fps);
    }, 5000);
  });
});
```

### Layout Shifts (CLS)

**Track Individual Shifts:**
```javascript
await page.evaluate(() => {
  return new Promise((resolve) => {
    const shifts = [];
    let totalCLS = 0;

    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (!entry.hadRecentInput) {
          totalCLS += entry.value;
          shifts.push({
            value: entry.value,
            time: entry.startTime,
            elements: entry.sources?.map(s => s.node)
          });
        }
      });
    });

    observer.observe({ entryTypes: ['layout-shift'] });

    setTimeout(() => {
      observer.disconnect();
      resolve({ totalCLS, shifts });
    }, 10000);
  });
});
```

---

## Memory Analysis

### Memory Metrics

**Get Memory Usage:**
```javascript
// Using chrome-devtools-mcp
await useTool('evaluate_script', {
  expression: `
    ({
      usedJSHeapSize: performance.memory?.usedJSHeapSize,
      totalJSHeapSize: performance.memory?.totalJSHeapSize,
      jsHeapSizeLimit: performance.memory?.jsHeapSizeLimit
    })
  `,
  returnByValue: true
});

// Using Puppeteer
const metrics = await page.metrics();
console.log({
  jsHeapUsed: (metrics.JSHeapUsedSize / 1024 / 1024).toFixed(2) + ' MB',
  jsHeapTotal: (metrics.JSHeapTotalSize / 1024 / 1024).toFixed(2) + ' MB',
  domNodes: metrics.Nodes,
  documents: metrics.Documents,
  jsEventListeners: metrics.JSEventListeners
});
```

### Memory Leak Detection

**Monitor Memory Over Time:**
```javascript
async function detectMemoryLeak(page, duration = 30000) {
  const samples = [];
  const interval = 1000; // Sample every second
  const samples_count = duration / interval;

  for (let i = 0; i < samples_count; i++) {
    const metrics = await page.metrics();
    samples.push({
      time: i,
      heapUsed: metrics.JSHeapUsedSize
    });

    await page.waitForTimeout(interval);
  }

  // Analyze trend
  const firstSample = samples[0].heapUsed;
  const lastSample = samples[samples.length - 1].heapUsed;
  const increase = ((lastSample - firstSample) / firstSample * 100).toFixed(2);

  return {
    samples,
    memoryIncrease: increase + '%',
    possibleLeak: increase > 50 // > 50% increase indicates possible leak
  };
}

const leakAnalysis = await detectMemoryLeak(page, 30000);
console.log('Memory Analysis:', leakAnalysis);
```

### Heap Snapshot

**Capture Heap Snapshot:**
```javascript
const client = await page.createCDPSession();

// Take snapshot
await client.send('HeapProfiler.enable');
const { result } = await client.send('HeapProfiler.takeHeapSnapshot');

// Snapshot is streamed in chunks
// Save to file or analyze programmatically
```

---

## Optimization Strategies

### Image Optimization

**Detect Unoptimized Images:**
```javascript
const images = await page.evaluate(() => {
  const images = Array.from(document.querySelectorAll('img'));
  return images.map(img => ({
    src: img.src,
    naturalWidth: img.naturalWidth,
    naturalHeight: img.naturalHeight,
    displayWidth: img.width,
    displayHeight: img.height,
    oversized: img.naturalWidth > img.width * 1.5 ||
               img.naturalHeight > img.height * 1.5
  }));
});

const oversizedImages = images.filter(img => img.oversized);
console.log('Oversized images:', oversizedImages);
```

### Font Loading

**Detect Render-Blocking Fonts:**
```javascript
const fonts = await page.evaluate(() => {
  return Array.from(document.fonts).map(font => ({
    family: font.family,
    weight: font.weight,
    style: font.style,
    status: font.status,
    loaded: font.status === 'loaded'
  }));
});

console.log('Fonts:', fonts);
```

### Third-Party Scripts

**Measure Third-Party Impact:**
```javascript
const thirdPartyDomains = ['googletagmanager.com', 'facebook.net', 'doubleclick.net'];

page.on('response', async (response) => {
  const url = response.url();
  const isThirdParty = thirdPartyDomains.some(domain => url.includes(domain));

  if (isThirdParty) {
    const buffer = await response.buffer();
    console.log({
      url: url,
      size: (buffer.length / 1024).toFixed(2) + ' KB',
      type: response.request().resourceType()
    });
  }
});
```

### Critical Rendering Path

**Identify Render-Blocking Resources:**
```javascript
await page.goto('https://example.com');

const renderBlockingResources = await page.evaluate(() => {
  const resources = performance.getEntriesByType('resource');
  return resources.filter(resource => {
    return (resource.initiatorType === 'link' &&
            resource.name.includes('.css')) ||
           (resource.initiatorType === 'script' &&
            !resource.name.includes('async'));
  }).map(r => ({
    url: r.name,
    duration: r.duration,
    startTime: r.startTime
  }));
});

console.log('Render-blocking resources:', renderBlockingResources);
```

### Lighthouse Integration

**Run Lighthouse Audit:**
```javascript
import lighthouse from 'lighthouse';
import { launch } from 'chrome-launcher';

// Launch Chrome
const chrome = await launch({ chromeFlags: ['--headless'] });

// Run Lighthouse
const { lhr } = await lighthouse('https://example.com', {
  port: chrome.port,
  onlyCategories: ['performance']
});

// Get scores
console.log({
  performanceScore: lhr.categories.performance.score * 100,
  metrics: {
    FCP: lhr.audits['first-contentful-paint'].displayValue,
    LCP: lhr.audits['largest-contentful-paint'].displayValue,
    TBT: lhr.audits['total-blocking-time'].displayValue,
    CLS: lhr.audits['cumulative-layout-shift'].displayValue,
    SI: lhr.audits['speed-index'].displayValue
  },
  opportunities: lhr.audits['opportunities']
});

await chrome.kill();
```

---

## Performance Budgets

### Set Performance Budgets

```javascript
const budgets = {
  // Core Web Vitals
  LCP: 2500,        // ms
  FID: 100,         // ms
  CLS: 0.1,         // score

  // Other metrics
  FCP: 1800,        // ms
  TTI: 3800,        // ms
  TBT: 300,         // ms

  // Resource budgets
  totalPageSize: 2 * 1024 * 1024,  // 2 MB
  jsSize: 500 * 1024,               // 500 KB
  cssSize: 100 * 1024,              // 100 KB
  imageSize: 1 * 1024 * 1024,       // 1 MB

  // Request counts
  totalRequests: 50,
  jsRequests: 10,
  cssRequests: 5
};

async function checkBudgets(page, budgets) {
  // Measure actual values
  const vitals = await measureCoreWebVitals(page);
  const resources = await analyzeResources(page);

  // Compare against budgets
  const violations = [];

  if (vitals.LCP > budgets.LCP) {
    violations.push(`LCP: ${vitals.LCP}ms exceeds budget of ${budgets.LCP}ms`);
  }

  if (resources.totalSize > budgets.totalPageSize) {
    violations.push(`Page size: ${resources.totalSize} exceeds budget of ${budgets.totalPageSize}`);
  }

  // ... check other budgets

  return {
    passed: violations.length === 0,
    violations
  };
}
```

---

## Automated Performance Testing

### CI/CD Integration

```javascript
// performance-test.js
import puppeteer from 'puppeteer';

async function performanceTest(url) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  // Measure metrics
  await page.goto(url, { waitUntil: 'networkidle2' });
  const metrics = await page.metrics();
  const vitals = await measureCoreWebVitals(page);

  await browser.close();

  // Check against thresholds
  const thresholds = {
    LCP: 2500,
    FID: 100,
    CLS: 0.1,
    jsHeapSize: 50 * 1024 * 1024  // 50 MB
  };

  const failed = [];
  if (vitals.LCP > thresholds.LCP) failed.push('LCP');
  if (vitals.FID > thresholds.FID) failed.push('FID');
  if (vitals.CLS > thresholds.CLS) failed.push('CLS');
  if (metrics.JSHeapUsedSize > thresholds.jsHeapSize) failed.push('Memory');

  if (failed.length > 0) {
    console.error('Performance test failed:', failed);
    process.exit(1);
  }

  console.log('Performance test passed');
}

performanceTest(process.env.TEST_URL);
```

---

## Best Practices

### Performance Testing Checklist

1. **Measure Multiple Times**
   - Run tests 3-5 times
   - Use median values
   - Account for variance

2. **Test Different Conditions**
   - Fast 3G
   - Slow 3G
   - Offline
   - CPU throttling

3. **Test Different Devices**
   - Mobile (low-end)
   - Mobile (high-end)
   - Desktop
   - Tablet

4. **Monitor Over Time**
   - Track metrics in CI/CD
   - Set up alerts for regressions
   - Create performance dashboards

5. **Focus on User Experience**
   - Prioritize Core Web Vitals
   - Test real user journeys
   - Consider perceived performance

6. **Optimize Critical Path**
   - Minimize render-blocking resources
   - Defer non-critical JavaScript
   - Optimize font loading
   - Lazy load images

---

## Resources

- [Web.dev Performance](https://web.dev/performance/)
- [Chrome DevTools Performance](https://developer.chrome.com/docs/devtools/performance/)
- [Core Web Vitals](https://web.dev/vitals/)
- [Lighthouse](https://developer.chrome.com/docs/lighthouse/)
- [WebPageTest](https://www.webpagetest.org/)
