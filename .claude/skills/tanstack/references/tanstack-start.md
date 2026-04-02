# TanStack Start Reference

## CLI Commands
```bash
npm create @tanstack/start@latest         # scaffold project
npm run dev                               # vite dev server
npm run build                             # production build
NITRO_PRESET=cloudflare-workers npm run build  # deploy target
```

## app.config.ts
```ts
import { defineConfig } from '@tanstack/react-start/config'
export default defineConfig({
  server: { preset: 'node-server' }, // or 'cloudflare-workers', 'vercel', etc.
  tsr: { autoCodeSplitting: true },
})
```

## File-Based Routing Conventions
| Pattern | Route |
|---------|-------|
| `index.tsx` | `/` |
| `about.tsx` | `/about` |
| `posts.$postId.tsx` | `/posts/:postId` |
| `posts_.tsx` | Layout for `/posts/*` |
| `_layout.tsx` | Pathless layout group |
| `__root.tsx` | Root layout (required) |

`routeTree.gen.ts` is auto-generated — never edit manually.

## createFileRoute
```ts
export const Route = createFileRoute('/posts/$postId')({
  validateSearch: z.object({ page: z.number().optional() }),
  loader: async ({ params, context }) => fetchPost(params.postId),
  pendingComponent: () => <Spinner />,
  errorComponent: ({ error }) => <ErrorDisplay error={error} />,
  component: PostComponent,
})
```

## createServerFn
```ts
const serverFn = createServerFn({ method: 'GET' })
  .validator(z.object({ id: z.string() }))
  .middleware([authMiddleware])
  .handler(async ({ data, context }) => {
    // context.user available from middleware
    return db.find(data.id)
  })

// Call from client or loader:
const result = await serverFn({ data: { id: '123' } })
```

## Middleware
```ts
import { createMiddleware } from '@tanstack/react-start'

export const authMiddleware = createMiddleware()
  .server(async ({ next, context }) => {
    const session = await getSession(context.request)
    if (!session) throw redirect({ to: '/login' })
    return next({ context: { user: session.user } })
  })
```

Chain: `serverFn.middleware([logger, auth, rateLimit])`

## API Routes
```ts
// src/routes/api/health.ts
import { createAPIFileRoute } from '@tanstack/react-start/api'
export const APIRoute = createAPIFileRoute('/api/health')({
  GET: () => new Response(JSON.stringify({ ok: true })),
  POST: async ({ request }) => {
    const body = await request.json()
    return new Response(JSON.stringify(body))
  },
})
```

## SSR Configuration
Default: client-side SPA. Opt-in SSR per route:
```ts
export const Route = createFileRoute('/')({
  ssr: true,           // enable SSR for this route
  ssr: { streaming: true }, // enable streaming SSR
})
```

## Deploy Targets (Nitro Presets)
node-server, cloudflare-workers, cloudflare-pages, vercel, netlify, deno, bun, aws-lambda

## Key Packages
- `@tanstack/react-start` — framework
- `@tanstack/react-router` — routing (bundled)
- `@tanstack/react-query` — data fetching (optional but recommended)
- `vinxi` / `nitro` — server runtime (bundled)
