---
name: nextjs-best-practices
description: Next.js App Router principles. Server Components, data fetching, routing patterns.
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
disallowed-tools:
  - WebFetch
  - WebSearch
harness: universal
---

# Next.js Best Practices

> Principles for Next.js App Router development.

---

## 1. Server vs Client Components

### Decision Tree

```
Does it need...?
│
├── useState, useEffect, event handlers
│   └── Client Component ('use client')
│
├── Direct data fetching, no interactivity
│   └── Server Component (default)
│
└── Both? 
    └── Split: Server parent + Client child
```

### By Default

| Type | Use |
|------|-----|
| **Server** | Data fetching, layout, static content |
| **Client** | Forms, buttons, interactive UI |

---

## 2. Data Fetching Patterns

### Fetch Strategy

| Pattern | Use |
|---------|-----|
| **Default** | Static (cached at build) |
| **Revalidate** | ISR (time-based refresh) |
| **No-store** | Dynamic (every request) |

### Data Flow

| Source | Pattern |
|--------|---------|
| Database | Server Component fetch |
| API | fetch with caching |
| User input | Client state + server action |

---

## 3. Routing Principles

### File Conventions

| File | Purpose |
|------|---------|
| `page.tsx` | Route UI |
| `layout.tsx` | Shared layout |
| `loading.tsx` | Loading state |
| `error.tsx` | Error boundary |
| `not-found.tsx` | 404 page |

### Route Organization

| Pattern | Use |
|---------|-----|
| Route groups `(name)` | Organize without URL |
| Parallel routes `@slot` | Multiple same-level pages |
| Intercepting `(.)` | Modal overlays |

---

## 4. API Routes

### Route Handlers

| Method | Use |
|--------|-----|
| GET | Read data |
| POST | Create data |
| PUT/PATCH | Update data |
| DELETE | Remove data |

### Best Practices

- Validate input with Zod
- Return proper status codes
- Handle errors gracefully
- Use Edge runtime when possible

---

## 5. Performance Principles

### Image Optimization

- Use next/image component
- Set priority for above-fold
- Provide blur placeholder
- Use responsive sizes

### Bundle Optimization

- Dynamic imports for heavy components
- Route-based code splitting (automatic)
- Analyze with bundle analyzer

---

## 6. Metadata

### Static vs Dynamic

| Type | Use |
|------|-----|
| Static export | Fixed metadata |
| generateMetadata | Dynamic per-route |

### Essential Tags

- title (50-60 chars)
- description (150-160 chars)
- Open Graph images
- Canonical URL

---

## 7. Caching Strategy

### Cache Layers

| Layer | Control |
|-------|---------|
| Request | fetch options |
| Data | revalidate/tags |
| Full route | route config |

### Revalidation

| Method | Use |
|--------|-----|
| Time-based | `revalidate: 60` |
| On-demand | `revalidatePath/Tag` |
| No cache | `no-store` |

---

## 8. Server Actions

### Use Cases

- Form submissions
- Data mutations
- Revalidation triggers

### Best Practices

- Mark with 'use server'
- Validate all inputs
- Return typed responses
- Handle errors

---

## 9. Anti-Patterns

| ❌ Don't | ✅ Do |
|----------|-------|
| 'use client' everywhere | Server by default |
| Fetch in client components | Fetch in server |
| Skip loading states | Use loading.tsx |
| Ignore error boundaries | Use error.tsx |
| Large client bundles | Dynamic imports |

---

## 10. Project Structure

```
app/
├── (marketing)/     # Route group
│   └── page.tsx
├── (dashboard)/
│   ├── layout.tsx   # Dashboard layout
│   └── page.tsx
├── api/
│   └── [resource]/
│       └── route.ts
└── components/
    └── ui/
```

---

## 11. API Route Testing & Validation

Comprehensive testing strategy for API routes, complementing the API Routes section above (§4).

### Test categories

| Category | Coverage |
|----------|----------|
| Basic functionality | 200/201 status codes, valid JSON responses |
| Authentication | 401 unauthenticated, 403 invalid token, authorized access |
| Input validation | Per-field invalid/valid value pairs (email, phone, age, required) |
| Error handling | Malformed JSON, missing Content-Type, timeouts, DB connection errors |
| Performance | Response time budget, concurrent requests, rate-limit enforcement (429) |

```javascript
describe('API Route: /api/[route-path]', () => {
  test('should return 200 for valid request', async () => {
    const response = await fetch('/api/[route-path]');
    expect(response.status).toBe(200);
  });
  test('should reject invalid data with 400', async () => {
    const response = await fetch('/api/[route-path]', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ invalid: 'field' }),
    });
    expect(response.status).toBe(400);
  });
});
```

### Manual testing

```bash
curl -X POST "http://localhost:3000/api/[route-path]" \
  -H "Content-Type: application/json" -d '{"key":"value"}'
curl -X GET "http://localhost:3000/api/protected-route" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

Also generate Postman/Thunder Client collections for interactive testing when a team needs shareable, non-CLI test flows.

### Test environment

```javascript
// jest.config.js
module.exports = {
  testEnvironment: 'node',
  collectCoverageFrom: ['pages/api/**/*.{js,ts}', 'app/api/**/*.{js,ts}'],
  coverageThreshold: { global: { branches: 70, functions: 70, lines: 70, statements: 70 } },
};
```

Use `node-mocks-http` for handler-level mocking (`createMocks({ method, url })`), a shared `test/fixtures` module for valid/invalid payloads, and reset the test DB in `beforeEach`. Wire into CI (GitHub Actions: `npm run test:api` + coverage upload) so regressions fail the PR.

---

## 12. Component Generation & Project Structure

Scaffolding pattern for new components, consistent with the project structure in §10.

### File structure

```
components/[ComponentName]/
├── index.ts                    # Barrel export
├── [ComponentName].tsx         # Main component
├── [ComponentName].module.css  # Component styles (or Tailwind classes)
├── [ComponentName].test.tsx    # Unit tests
├── [ComponentName].stories.tsx # Storybook story (if Storybook detected)
└── types.ts                    # Prop types
```

### Templates by type

- **Server component** (default): no `'use client'`, no hooks, may fetch data directly.
- **Client component**: `'use client'` at top, owns interactive state (`useState`, event handlers).
- **Page component**: exports `metadata: Metadata`, receives `{ params, searchParams }`.
- **Layout component**: wraps `children`, owns shared chrome (header/footer), no page-specific logic.

```typescript
// Client component skeleton
'use client';
import { FC, useState } from 'react';
interface ComponentNameProps { children?: React.ReactNode; onClick?: () => void; className?: string; }
export const ComponentName: FC<ComponentNameProps> = ({ children, onClick, className = '' }) => {
  const [isActive, setIsActive] = useState(false);
  return <button className={className} onClick={() => { setIsActive(!isActive); onClick?.(); }}>{children}</button>;
};
export default ComponentName;
```

### Checklist

- [ ] Follows project naming/structure conventions
- [ ] Props typed in `types.ts`
- [ ] Unit tests cover render, interaction, and accessibility (`toHaveAccessibleName`, keyboard nav)
- [ ] Storybook story added if Storybook is present in the repo
- [ ] Tailwind classes used instead of CSS modules if Tailwind is detected in the project

---

## 13. Middleware Implementation Patterns

`middleware.ts` at project root runs at the edge before rendering — request-level concerns that don't belong in components or route handlers.

### Base structure

```typescript
// middleware.ts
import { NextRequest, NextResponse } from 'next/server';
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  // 1. security headers, 2. rate limit, 3. auth (if protected route), 4. redirects
  return NextResponse.next();
}
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
```

### Common middleware types

| Type | Pattern |
|------|---------|
| **Auth** | Extract JWT from cookie/header → `jwtVerify` → inject `x-user-id`/`x-user-role` headers → redirect to `/login` on failure |
| **Rate limiting** | In-memory `Map` keyed by client IP for single-instance; swap for Redis once running >1 instance. Return 429 with `Retry-After` on limit breach |
| **Security headers** | `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, HSTS, `Referrer-Policy`, CSP |
| **CORS** | Handle `OPTIONS` preflight explicitly; set `Access-Control-Allow-*` headers conditionally by origin allowlist |
| **Redirects/rewrites** | Rule table of `{ source, destination, permanent?, conditions? }`; supports regex source, conditional rules (role-gated, maintenance mode) |
| **A/B testing** | Hash `userId + testName` → bucket into variant; persist via cookie for session consistency |
| **Feature flags** | Percentage rollout + user-group/geo targeting; expose via `x-feature-flags` response header |

### Composition

Chain middleware functions rather than nesting conditionals — run each in sequence, short-circuit on redirect (3xx) or error (4xx/5xx) responses, otherwise pass the accumulated response forward.

### Testing

```typescript
it('redirects unauthenticated users from protected routes', async () => {
  const response = await middleware(new NextRequest('http://localhost:3000/dashboard'));
  expect(response.status).toBe(302);
  expect(response.headers.get('location')).toContain('/login');
});
```

---

## 14. Migration Guide: Pages Router → App Router / JS → TS / Class → Hooks

### Pre-migration checklist

- [ ] Update to latest Next.js version; run full test suite for a baseline
- [ ] Check for blockers: custom `server.js`, `pages/_document` with `getInitialProps`, existing `middleware.ts`
- [ ] Create a backup (`tar` excluding `node_modules`/`.next`/`.git`)

### Pages → App Router

| Old | New |
|-----|-----|
| `pages/_app.tsx` | `app/layout.tsx` (root layout) |
| `pages/index.tsx` | `app/page.tsx` |
| `getServerSideProps` | Server Component with direct `await fetch(...)` |
| `getStaticProps` (+ `revalidate`) | Server Component fetch with `{ next: { revalidate: N } }` |
| `pages/api/*.ts` (method-switch handler) | `app/api/*/route.ts` exporting `GET`/`POST`/etc. |
| `<Head>` | `export const metadata: Metadata = {...}` or `generateMetadata()` |

Migrate incrementally — Pages and App routers coexist during transition; move one route/section at a time, testing after each.

### JS → TS

Base `tsconfig.json`: `strict: true`, `allowJs: true` during transition, `paths: { "@/*": ["./*"] }`. Rename `.js`→`.ts` / `.jsx`→`.tsx` (detect JSX presence to pick extension) and add types incrementally — don't block the migration on full strictness immediately; land with looser types and tighten in follow-ups.

### Class components → Hooks

| Class pattern | Hook equivalent |
|----------------|------------------|
| `this.state = {...}` / `setState` | `useState` |
| `componentDidMount` | `useEffect(fn, [])` |
| `componentDidUpdate` (prop-dependent) | `useEffect(fn, [dep])` |
| `componentWillUnmount` | `useEffect(() => () => cleanup(), [])` |
| `static contextType` | `useContext(Context)` |

### Post-migration validation

```bash
npm run build && npx tsc --noEmit && npm test
```
Keep the old `pages/` directory until the build, type-check, and test suite are all green on the new structure — then remove it.

---

## 15. Project Scaffolding & Initialization

Baseline for new Next.js projects — pairs with §10's structure and §1–9's patterns.

### `next.config.js` starting point

```javascript
const nextConfig = {
  experimental: { optimizePackageImports: ['lucide-react', '@heroicons/react'] },
  images: { formats: ['image/webp', 'image/avif'], deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840] },
  async headers() {
    return [{ source: '/(.*)', headers: [
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
    ]}];
  },
};
```

### Directory layout

```
app/ (globals.css, layout.tsx, page.tsx, api/)
components/ui/
lib/
public/
types/
.env.local  .env.example  .gitignore
```

### Dependencies

- **Production**: `next`, `react`, `react-dom`
- **Dev**: `eslint`, `eslint-config-next`, `typescript` + `@types/*` (if TS), `tailwindcss`/`prettier`/`husky`+`lint-staged` (optional)

### `package.json` scripts

```json
{ "scripts": { "dev": "next dev", "build": "next build", "lint": "next lint", "type-check": "tsc --noEmit", "format": "prettier --write ." } }
```

### Post-scaffold verification

```bash
npm install && npm run build && npm run lint && npm run type-check
```

---

## 16. Parallel Routes, Intercepting Routes & Streaming (Implementation Patterns)

Concrete implementation code for the route types introduced in §3 (Parallel routes `@slot`, Intercepting `(.)`) and the streaming approach in §5, plus Route Handler CRUD shape.

### Parallel routes

```typescript
// app/dashboard/layout.tsx
export default function DashboardLayout({ children, analytics, team }: {
  children: React.ReactNode; analytics: React.ReactNode; team: React.ReactNode;
}) {
  return (
    <div className="dashboard-grid">
      <main>{children}</main>
      <aside>{analytics}</aside>
      <aside>{team}</aside>
    </div>
  );
}
// app/dashboard/@analytics/page.tsx — independent loading state via @analytics/loading.tsx
export default async function AnalyticsSlot() {
  const stats = await getAnalytics();
  return <AnalyticsChart data={stats} />;
}
```

### Intercepting routes (modal pattern)

```
app/
├── @modal/(.)photos/[id]/page.tsx   # Intercept — renders as modal over current route
├── @modal/default.tsx
├── photos/[id]/page.tsx             # Full page — direct navigation/refresh
└── layout.tsx                        # Renders both {children} and {modal}
```

Direct navigation (refresh, deep link) renders the full page; client-side navigation from a listing renders the intercepted modal version instead — same URL, different UI depending on navigation origin.

### Streaming with Suspense

```typescript
export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await getProduct(id); // blocking — needed for initial paint

  return (
    <div>
      <ProductHeader product={product} />
      <Suspense fallback={<ReviewsSkeleton />}>
        <Reviews productId={id} />       {/* streams in independently */}
      </Suspense>
      <Suspense fallback={<RecommendationsSkeleton />}>
        <Recommendations productId={id} /> {/* slow ML call — doesn't block the rest */}
      </Suspense>
    </div>
  );
}
```

Each `Suspense`-wrapped async component fetches its own data and streams in independently — put the slowest/least-critical data (recommendations, related content) in the deepest boundaries so the page becomes interactive sooner.

### Route Handler CRUD shape

```typescript
// app/api/products/route.ts
export async function GET(request: NextRequest) {
  const category = request.nextUrl.searchParams.get('category');
  const products = await db.product.findMany({ where: category ? { category } : undefined, take: 20 });
  return NextResponse.json(products);
}
export async function POST(request: NextRequest) {
  const product = await db.product.create({ data: await request.json() });
  return NextResponse.json(product, { status: 201 });
}
```

---

> **Remember:** Server Components are the default for a reason. Start there, add client only when needed.
