---
name: performance
description: Performance profiling and optimization — measurement, bottleneck analysis, Core Web Vitals (LCP/INP/CLS), performance budgets, caching/image/font/third-party optimization, and load testing (k6). Measure, analyze, optimize — in that order.
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
disallowed-tools:
  - WebFetch
  - WebSearch
harness: universal
---

# Performance

> Measure, analyze, optimize - in that order.

## Runtime Scripts

**Execute these for automated profiling:**

| Script | Purpose | Usage |
|--------|---------|-------|
| `scripts/lighthouse_audit.py` | Lighthouse performance audit | `python scripts/lighthouse_audit.py https://example.com` |

---

## 1. Core Web Vitals

### Targets

| Metric | Good | Needs work | Poor | Measures |
|--------|------|------------|------|----------|
| **LCP** | ≤ 2.5s | 2.5s–4s | > 4s | Loading |
| **INP** | ≤ 200ms | 200ms–500ms | > 500ms | Interactivity |
| **CLS** | ≤ 0.1 | 0.1–0.25 | > 0.25 | Stability |

Google measures at the **75th percentile** — 75% of page visits must meet "Good".

### When to Measure

| Stage | Tool |
|-------|------|
| Development | Local Lighthouse |
| CI/CD | Lighthouse CI |
| Production | RUM (Real User Monitoring) |

### LCP: Largest Contentful Paint

Usually a hero image/video, large text block, background image, or `<svg>`.

**Common issues and fixes:**

1. **Slow TTFB (> 800ms)** → CDN, edge caching, optimized backend, edge rendering.
2. **Render-blocking resources** → inline critical CSS (< 14KB), defer the rest with `<link rel="preload" as="style" onload="this.rel='stylesheet'">`.
3. **Slow resource load** → `<link rel="preload" href="/hero.webp" as="image" fetchpriority="high">` plus `fetchpriority="high"` / `loading="eager"` / `decoding="sync"` on the `<img>` itself.
4. **Client-side rendering delays** → SSR/SSG instead of fetching content in `useEffect`.

```javascript
// Identify your LCP element
new PerformanceObserver((list) => {
  const last = list.getEntries().at(-1);
  console.log('LCP element:', last.element, 'time:', last.startTime);
}).observe({ type: 'largest-contentful-paint', buffered: true });
```

**Checklist:** TTFB < 800ms · LCP image preloaded + `fetchpriority="high"` · optimized (WebP/AVIF, correct size) · critical CSS inlined (< 14KB) · no render-blocking JS in `<head>` · fonts don't block text (`font-display: swap`) · LCP element present in initial HTML.

See `references/LCP.md` for the deeper reference (TTFB solutions, framework-specific tips for Next.js/Nuxt/Astro, debugging, issue-impact table).

### INP: Interaction to Next Paint

Measures responsiveness across ALL interactions (worst interaction, 98th percentile on high-traffic pages). `Total INP = Input Delay + Processing Time + Presentation Delay` (targets: < 50ms / < 100ms / < 50ms).

**Common issues:**
- **Long tasks blocking main thread** → chunk work and yield (`await new Promise(r => setTimeout(r, 0))` or `scheduler.yield()`).
- **Heavy event handlers** → give immediate visual feedback, defer heavy work via `requestAnimationFrame`/`requestIdleCallback`.
- **Third-party scripts** → lazy-load on interaction/visibility instead of eager `<script src>`.
- **Excessive re-renders (React/Vue)** → `React.memo`, `useTransition`.

```javascript
// Identify slow interactions
new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    if (entry.duration > 200) console.warn('Slow interaction:', entry.name, entry.duration, entry.target);
  }
}).observe({ type: 'event', buffered: true, durationThreshold: 16 });
```

**Checklist:** no tasks > 50ms on main thread · event handlers < 100ms · immediate visual feedback · heavy work deferred via `requestIdleCallback` · third-party scripts don't block interactions · debounced input handlers · Web Workers for CPU-heavy work.

### CLS: Cumulative Layout Shift

`impact fraction × distance fraction`. Causes: images without dimensions, ads/iframes without reserved space, dynamically-injected content above the fold, web-font FOUT, animations that touch layout properties instead of `transform`/`opacity`.

```html
<img src="photo.jpg" alt="Photo" width="800" height="600">
<div style="aspect-ratio: 16/9;"><iframe style="width:100%;height:100%" src="..."></iframe></div>
```

```css
@font-face { font-family: 'Custom'; src: url('custom.woff2') format('woff2'); font-display: optional; }
.animate { transition: transform 0.3s; } /* not height/width */
```

```javascript
// Track layout shifts
new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    if (!entry.hadRecentInput) console.log('Layout shift:', entry.value, entry.sources);
  }
}).observe({ type: 'layout-shift', buffered: true });
```

**Checklist:** images/videos/embeds all have reserved space · ads have min-height containers · fonts use `font-display: optional` or matched fallback metrics · dynamic content inserted below viewport · animations use transform/opacity only.

### Framework quick fixes

**Next.js** — `<Image priority fill>` for LCP; `dynamic(() => import('./Heavy'), { ssr: false })` for INP; `Image` handles CLS dimensions automatically.
**React** — preload LCP image in `<head>`; `useTransition` for INP; always specify `<img>` dimensions for CLS.
**Vue/Nuxt** — `<NuxtImg preload loading="eager">` for LCP; async components for INP; `aspect-ratio` CSS for CLS.

### Field measurement

```javascript
import {onLCP, onINP, onCLS} from 'web-vitals';
function sendToAnalytics({name, value, rating}) {
  gtag('event', name, { event_category: 'Web Vitals', value: Math.round(name === 'CLS' ? value * 1000 : value), event_label: rating });
}
onLCP(sendToAnalytics); onINP(sendToAnalytics); onCLS(sendToAnalytics);
```

---

## 2. Profiling Workflow

### The 4-Step Process

```
1. BASELINE → Measure current state
2. IDENTIFY → Find the bottleneck
3. FIX → Make targeted change
4. VALIDATE → Confirm improvement
```

### Profiling Tool Selection

| Problem | Tool |
|---------|------|
| Page load | Lighthouse |
| Bundle size | Bundle analyzer |
| Runtime | DevTools Performance |
| Memory | DevTools Memory |
| Network | DevTools Network |

---

## 3. Performance Budget

| Resource | Budget | Rationale |
|----------|--------|-----------|
| Total page weight | < 1.5 MB | 3G loads in ~4s |
| JavaScript (compressed) | < 300 KB | Parsing + execution time |
| CSS (compressed) | < 100 KB | Render blocking |
| Images (above-fold) | < 500 KB | LCP impact |
| Fonts | < 100 KB | FOIT/FOUT prevention |
| Third-party | < 200 KB | Uncontrolled latency |

### Key metrics targets

| Metric | Target | Tool |
|--------|--------|------|
| LCP | < 2.5s | Lighthouse, CrUX |
| FCP | < 1.8s | Lighthouse |
| Speed Index | < 3.4s | Lighthouse |
| TBT | < 200ms | Lighthouse |
| TTI | < 3.8s | Lighthouse |

```bash
npx lighthouse https://example.com --output html --output-path report.html
```

---

## 4. Bundle Analysis

### What to Look For

| Issue | Indicator |
|-------|-----------|
| Large dependencies | Top of bundle |
| Duplicate code | Multiple chunks |
| Unused code | Low coverage |
| Missing splits | Single large chunk |

### Optimization Actions

| Finding | Action |
|---------|--------|
| Big library | Import specific modules |
| Duplicate deps | Dedupe, update versions |
| Route in main | Code split |
| Unused exports | Tree shake |

```javascript
// Route/component/feature-based splitting
const Dashboard = lazy(() => import('./Dashboard'));
if (user.isPremium) { const PremiumFeatures = await import('./PremiumFeatures'); }

// Tree shaking — import only what's needed
import debounce from 'lodash/debounce'; // not: import _ from 'lodash'
```

---

## 5. Critical Rendering Path

**Server response** — TTFB < 800ms (CDN, caching, efficient backend); Gzip/Brotli compression (Brotli preferred, 15-20% smaller); HTTP/2 or HTTP/3; edge-cache HTML where possible.

**Resource hints:**
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preload" href="/hero.webp" as="image" fetchpriority="high">
<link rel="preload" href="/font.woff2" as="font" type="font/woff2" crossorigin>
```

**JavaScript loading:**
```html
<script defer src="/app.js"></script>          <!-- preferred over parser-blocking -->
<script async src="/analytics.js"></script>    <!-- independent scripts -->
<script type="module" src="/app.mjs"></script>  <!-- deferred by default -->
```

---

## 6. Image Optimization

| Format | Use case | Browser support |
|--------|----------|-----------------|
| AVIF | Photos, best compression | 92%+ |
| WebP | Photos, good fallback | 97%+ |
| PNG | Graphics with transparency | Universal |
| SVG | Icons, logos, illustrations | Universal |

```html
<picture>
  <source type="image/avif" srcset="hero-400.avif 400w, hero-800.avif 800w" sizes="(max-width: 600px) 100vw, 50vw">
  <source type="image/webp" srcset="hero-400.webp 400w, hero-800.webp 800w" sizes="(max-width: 600px) 100vw, 50vw">
  <img src="hero-800.jpg" width="1200" height="600" alt="Hero image" loading="lazy" decoding="async">
</picture>

<!-- Above-fold LCP image: eager + high priority. Below-fold: loading="lazy" -->
<img src="hero.webp" fetchpriority="high" loading="eager" decoding="sync" alt="Hero">
```

---

## 7. Font Optimization

```css
body { font-family: 'Custom Font', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }

@font-face {
  font-family: 'Custom Font';
  src: url('/fonts/custom.woff2') format('woff2');
  font-display: swap; /* or optional for non-critical */
  unicode-range: U+0000-00FF; /* Subset to Latin */
}

/* Variable fonts — one file instead of multiple weights */
@font-face {
  font-family: 'Inter';
  src: url('/fonts/Inter-Variable.woff2') format('woff2-variations');
  font-weight: 100 900;
  font-display: swap;
}
```

`<link rel="preload" href="/fonts/heading.woff2" as="font" type="font/woff2" crossorigin>` for critical fonts.

---

## 8. Caching & Delivery Optimization

```
# HTML (short or no cache)
Cache-Control: no-cache, must-revalidate

# Static assets with hash (immutable)
Cache-Control: public, max-age=31536000, immutable

# Static assets without hash
Cache-Control: public, max-age=86400, stale-while-revalidate=604800

# API responses
Cache-Control: private, max-age=0, must-revalidate
```

```javascript
// Service worker — cache-first for static assets
self.addEventListener('fetch', (event) => {
  if (['image', 'style', 'script'].includes(event.request.destination)) {
    event.respondWith(
      caches.match(event.request).then((cached) => cached || fetch(event.request).then((response) => {
        const clone = response.clone();
        caches.open('static-v1').then((cache) => cache.put(event.request, clone));
        return response;
      }))
    );
  }
});
```

### Application & Distributed Caching (Redis)

For data that's expensive to compute or fetch (DB queries, external API calls, expensive aggregations), cache at the application layer:

- **In-memory (single instance)** — fastest, but doesn't share across nodes; fine for low-traffic or single-instance deploys.
- **Redis / Memcached (distributed)** — shared cache across all instances; required once you run more than one app server. Use structured key namespacing (`user:123:profile`, `product:456:reviews`) so bulk invalidation by prefix is possible.
- **Cache-aside pattern** — app checks cache first, falls back to source on miss, writes result back to cache with a TTL. Simplest and most common pattern.
- **Write-through** — writes go to cache and source together; keeps cache always warm at the cost of write latency.
- **Invalidation** — prefer short TTLs + cache-aside over trying to invalidate perfectly; for correctness-critical data, invalidate explicitly on write (delete the key) rather than trying to update it in place.
- **Cache stampede protection** — for hot keys, use a lock/single-flight pattern (only one request repopulates on miss, others wait) or serve slightly-stale data (app-level stale-while-revalidate) instead of letting every concurrent request hit the source simultaneously on expiry.

### CDN and Edge Caching

Push static and cacheable dynamic content to edge locations close to users (Cloudflare, Akamai, Fastly, CloudFront):

- **Static assets** (JS/CSS/images/fonts with content hashes in the filename) — `Cache-Control: public, max-age=31536000, immutable`, safe to cache forever since the filename changes on update.
- **HTML/API responses that can be edge-cached** — shorter TTL with `stale-while-revalidate` so the edge serves a slightly stale response while refreshing in the background rather than blocking on origin.
- **Compression at the edge** — enable Brotli/Gzip at the CDN so origin doesn't have to; check the CDN applies it to your content types (some default to excluding certain MIME types).
- **Purging** — invalidate by path or by tag/surrogate-key on deploy; tag-based purging (Fastly surrogate keys, Cloudflare cache tags) lets you invalidate "all pages using this component" without a full cache wipe.
- **Origin shielding** — route all edge-cache-miss traffic through a single shield region before hitting origin, so origin sees one request per miss instead of one per edge PoP.
- **Image optimization at the edge** — many CDNs offer on-the-fly resize/format conversion (WebP/AVIF) via URL parameters — cheaper than pre-generating every size at build time.

---

## 9. Runtime Profiling & Optimization

### Performance Tab Analysis

| Pattern | Meaning |
|---------|---------|
| Long tasks (>50ms) | UI blocking |
| Many small tasks | Possible batching opportunity |
| Layout/paint | Rendering bottleneck |
| Script | JavaScript execution |

### Memory Tab Analysis

| Pattern | Meaning |
|---------|---------|
| Growing heap | Possible leak |
| Large retained | Check references |
| Detached DOM | Not cleaned up |

### Common Bottlenecks by Symptom

| Symptom | Likely Cause |
|---------|--------------|
| Slow initial load | Large JS, render blocking |
| Slow interactions | Heavy event handlers |
| Jank during scroll | Layout thrashing |
| Growing memory | Leaks, retained refs |

**Avoid layout thrashing** — batch all DOM reads, then all writes:
```javascript
// ❌ Forces multiple reflows
elements.forEach(el => { const h = el.offsetHeight; el.style.height = h + 10 + 'px'; });

// ✅ Batch reads, then batch writes
const heights = elements.map(el => el.offsetHeight);
elements.forEach((el, i) => { el.style.height = heights[i] + 10 + 'px'; });
```

**Debounce expensive operations:**
```javascript
function debounce(fn, delay) { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), delay); }; }
window.addEventListener('scroll', debounce(handleScroll, 100));
```

**Use `requestAnimationFrame`, not `setInterval`, for animation:**
```javascript
function animate() { /* animation logic */ requestAnimationFrame(animate); }
requestAnimationFrame(animate);
```

**Virtualize long lists** (> 100 items) — `react-window`, `vue-virtual-scroller`, or native CSS `content-visibility: auto`.

---

## 10. Third-Party Scripts

```javascript
// Delay until near-viewport or interaction instead of eager loading
document.addEventListener('DOMContentLoaded', () => {
  const observer = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) {
      const script = document.createElement('script');
      script.src = 'https://widget.example.com/embed.js';
      document.body.appendChild(script);
      observer.disconnect();
    }
  });
  observer.observe(document.querySelector('#widget-container'));
});
```

**Facade pattern** — show a static placeholder (e.g. a video thumbnail with a play button) and only load the heavy embed script on click/interaction.

---

## 11. Quick Win Priorities

| Priority | Action | Impact |
|----------|--------|--------|
| 1 | Enable compression | High |
| 2 | Lazy load images | High |
| 3 | Code split routes | High |
| 4 | Cache static assets | Medium |
| 5 | Optimize images | Medium |

## 12. Anti-Patterns

| ❌ Don't | ✅ Do |
|----------|-------|
| Guess at problems | Profile first |
| Micro-optimize | Fix biggest issue |
| Optimize early | Optimize when needed |
| Ignore real users | Use RUM data |

---

## 13. Load Testing (k6)

k6 is a developer-centric load testing tool for HTTP APIs, WebSocket endpoints, and browser scenarios. Use it to validate system performance under load, identify bottlenecks, ensure SLA compliance, or catch performance regressions before deployment — complements the front-end-focused profiling above with backend/API-side load behavior.

### Installation

```bash
# macOS
brew install k6
# Windows
choco install k6
# Linux — see https://k6.io/docs/get-started/installation/ for the signed apt repo setup
```

### Quick start

```javascript
// simple-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = { vus: 10, duration: '30s' };

export default function () {
  const res = http.get('https://httpbin.test.k6.io/get');
  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });
  sleep(1);
}
```

Run with `k6 run simple-test.js`.

### Test types and configuration

| Type | Use Case | Configuration |
|------|----------|---------------|
| Smoke Test | Verify basic functionality | Low VUs (1-5), short duration |
| Load Test | Normal expected load | Target VUs based on traffic |
| Stress Test | Find breaking point | Ramp beyond capacity |
| Spike Test | Sudden traffic spikes | Rapid increase/decrease |
| Soak Test | Long-term stability | Extended duration |

```javascript
export const options = {
  vus: 100,
  stages: [
    { duration: '30s', target: 20 },
    { duration: '1m', target: 100 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'],
    http_req_failed: ['rate<0.01'],
  },
};
```

### HTTP, request chaining, and parameterized data

```javascript
import http from 'k6/http';
import { check } from 'k6';
import { SharedArray } from 'k6/data';

// Login, extract token, use in subsequent requests
export default function () {
  const loginRes = http.post('https://api.example.com/login', JSON.stringify({ email: 'test@example.com', password: 'password123' }));
  const token = loginRes.json('access_token');
  const res = http.get('https://api.example.com/profile', { headers: { Authorization: `Bearer ${token}` } });
  check(res, { 'profile loaded': (r) => r.status === 200 });
}

// Parameterize with shared, once-loaded data (users.json / users.csv)
const users = new SharedArray('users', function () { return JSON.parse(open('./users.json')); });
```

### Browser and WebSocket testing

```javascript
import { browser } from 'k6/browser';
export const options = { scenarios: { browser_test: { executor: 'constant-vus', vus: 5, duration: '30s', browser: { type: 'chromium' } } } };
export default async function () {
  const page = await browser.newPage();
  try { await page.goto('https://example.com'); await page.click('button[data-testid="submit"]'); }
  finally { await page.close(); }
}
```

```javascript
import ws from 'k6/ws';
ws.connect('wss://echo.websocket.org', {}, function (socket) {
  socket.on('open', () => socket.send('Hello WebSocket'));
  socket.on('message', (data) => { /* check(data, {...}) */ });
  socket.setTimeout(() => socket.close(), 5000);
});
```

### Custom metrics and thresholds

```javascript
import { Counter, Trend, Rate, Gauge } from 'k6/metrics';
const myCounter = new Counter('api_calls_total');
const responseTime = new Trend('response_time');
const errorRate = new Rate('error_rate');

export default function () {
  const res = http.get('https://api.example.com/data');
  myCounter.add(1);
  responseTime.add(res.timings.duration);
  errorRate.add(res.status !== 200);
}
```

Thresholds double as SLA gates — e.g. `http_req_duration: ['p(95)<500']`, `http_req_failed: ['rate<0.01']`, `http_reqs: ['rate>100']` — and can abort a CI run on breach.

### CI/CD integration

```yaml
# .github/workflows/load-test.yml
on:
  push: { branches: [main] }
  schedule: [{ cron: '0 2 * * *' }]
jobs:
  load-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: grafana/k6-action@v0.2.0
      - run: k6 run --out json=results.json load-test.js
        env: { API_TOKEN: ${{ secrets.API_TOKEN }} }
      - uses: actions/upload-artifact@v4
        if: ${{ !cancelled() }}
        with: { name: k6-results, path: results.json }
```

### Interpreting results

| Metric | Description | Good | Warning | Bad |
|--------|-------------|------|---------|-----|
| http_req_duration (p95) | 95% response time | < 300ms | 300-500ms | > 500ms |
| http_req_failed | Error rate | < 0.1% | 0.1-1% | > 1% |
| http_reqs | Requests/sec | Meeting target | Near limit | At limit |
| vus | Virtual users | Stable | Gradual increase | Unexpected spike |

### Best practices

- Start with a smoke test (1-5 VUs) before scaling up.
- Use realistic, parameterized data and behaviors.
- Set thresholds that match your actual SLA and business requirements.
- Include ramp-up time (warm up dependent systems).
- Monitor downstream/external dependencies, not just your own API.
- Tag requests (`tags: { endpoint: 'users' }`) for granular analysis.
- Keep one test file per scenario.

### Common pitfalls

- **Tests pass locally but fail in CI** → ensure CI has comparable resources/network conditions.
- **Inconsistent results between runs** → check for external dependencies, random data, or test-data pollution.
- **k6 runs out of memory** → use `SharedArray` for large data, reduce VUs, or set `--max-memory`.
- **Thresholds too strict** → start relaxed, tighten based on historical data.

---

## 14. Next.js Bundle Analysis & Optimization

Framework-specific companion to the general Bundle Analysis section above — webpack tooling and thresholds specific to Next.js.

### Setup

```bash
npm install --save-dev @next/bundle-analyzer
```
```javascript
// next.config.js
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});
module.exports = withBundleAnalyzer({
  experimental: { optimizePackageImports: ['lucide-react', 'date-fns', 'lodash'] },
});
```
```json
// package.json
{ "scripts": { "analyze": "cross-env ANALYZE=true next build" } }
```

Run with `ANALYZE=true npm run build` (or `npm run analyze`) — opens an interactive treemap of client, server, and shared chunks.

### Size thresholds (budgets)

| Metric | Warning | Error |
|--------|---------|-------|
| First Load JS | 200 KB | 300 KB |
| Individual chunk | 150 KB | 250 KB |
| Total bundle | 1 MB | 2 MB |

Enforce with a CI step (`nextjs-bundle-analysis` GitHub Action or a custom script comparing `.next/analyze/*.json` output against these thresholds) so regressions fail the PR rather than getting noticed in production.

### Code-splitting and tree-shaking

```typescript
// Dynamic import for large, non-critical components
const HeavyComponent = dynamic(() => import('./HeavyComponent'), { ssr: false, loading: () => <Skeleton /> });
```
```javascript
// Tree-shakable imports — not the whole library
import { debounce } from 'lodash/debounce';   // not: import _ from 'lodash'
import { format } from 'date-fns';            // not: import moment from 'moment'
```
`experimental.optimizePackageImports` in `next.config.js` auto-applies this transform for a configured list of packages without touching import statements.

### Core Web Vitals impact

Bundle size directly affects LCP (parse/execute time delays hydration) and, on lower-end devices, INP (large main-thread JS blocks input handling). Treat bundle-size regressions as a Core Web Vitals regression, not a separate concern — see the Core Web Vitals section above for measurement.

---

## 15. Next.js Performance Audit Framework

End-to-end audit methodology for Next.js apps — how to *measure and diagnose*, complementing the general optimization techniques above (§1–13) and the Next.js-specific bundle tooling in §14.

### Audit steps

1. **Lighthouse** — desktop + mobile passes: `lighthouse http://localhost:3000 --preset=perf --output=html --output=json`. Mobile pass adds `--form-factor=mobile --throttling-method=devtools`.
2. **Bundle analysis** — `ANALYZE=true npm run build` (see §14); check `.next/static/chunks/` for oversized chunks, `npm ls --depth=0` for duplicate/UNMET dependencies.
3. **Runtime profiling** — Core Web Vitals via `PerformanceObserver` (see §1); cold-start timing from `vercel logs` or dashboard Runtime Logs on Vercel deploys.
4. **Image audit** — check `next/image` adoption vs raw `<img>`, `priority` on above-fold images, `sizes` prop correctness for responsive variants.
5. **Third-party script audit** — flag eager `<script src>` tags for widgets/analytics; recommend lazy-load on interaction/visibility (facade pattern, §10).
6. **Network** — TTFB, HTTP/2/3, edge-cache hit rate for cacheable routes.

### RUM wiring

```typescript
export function reportWebVitals({ id, name, value }: any) {
  if (typeof window !== 'undefined') {
    fetch('/api/analytics/web-vitals', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, name, value, url: window.location.href, timestamp: Date.now() }),
    }).catch(console.error);
  }
}
```
Wire into `app/layout.tsx` (or `_app.tsx` on Pages Router) via `export { reportWebVitals }`. On Vercel, prefer the built-in Analytics/Speed Insights (see `vercel-deployment` skill's Monitoring section) over a hand-rolled endpoint unless custom metrics are needed.

### CI regression gate

```yaml
# .github/workflows/performance.yml
jobs:
  lighthouse:
    steps:
      - run: npm run build && npm start & npx wait-on http://localhost:3000
      - run: npx @lhci/cli@0.12.x autorun
        env: { LHCI_GITHUB_APP_TOKEN: ${{ secrets.LHCI_GITHUB_APP_TOKEN }} }
```

### Report structure

Executive summary (score 0–100, Core Web Vitals status) → detailed breakdown per area (loading, runtime, bundle, images, CSS/JS) → prioritized action plan (immediate / moderate / long-term) → monitoring setup confirmation. Treat this as the audit *output format*, not a fixed script — adapt to what the specific app's numbers show.

---

> **Remember:** The fastest code is code that doesn't run. Remove before optimizing.
