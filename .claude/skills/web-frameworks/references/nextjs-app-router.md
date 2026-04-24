# Next.js App Router Architecture

Modern file-system based routing with React Server Components support.

## File Conventions

Special files define route behavior:

- `page.tsx` - Page UI, makes route publicly accessible
- `layout.tsx` - Shared UI wrapper for segment and children
- `loading.tsx` - Loading UI, automatically wraps page in Suspense
- `error.tsx` - Error UI, wraps page in Error Boundary
- `not-found.tsx` - 404 UI for route segment
- `route.ts` - API endpoint (Route Handler)
- `template.tsx` - Re-rendered layout (doesn't preserve state)
- `default.tsx` - Fallback for parallel routes

## Basic Routing

### Static Routes

```
app/
├── page.tsx              → /
├── about/
│   └── page.tsx         → /about
├── blog/
│   └── page.tsx         → /blog
└── contact/
    └── page.tsx         → /contact
```

### Dynamic Routes

Single parameter:
```tsx
// app/blog/[slug]/page.tsx
export default function BlogPost({ params }: { params: { slug: string } }) {
  return <h1>Post: {params.slug}</h1>
}
// Matches: /blog/hello-world, /blog/my-post
```

Catch-all segments:
```tsx
// app/shop/[...slug]/page.tsx
export default function Shop({ params }: { params: { slug: string[] } }) {
  return <h1>Category: {params.slug.join('/')}</h1>
}
// Matches: /shop/clothes, /shop/clothes/shirts, /shop/clothes/shirts/red
```

Optional catch-all:
```tsx
// app/docs/[[...slug]]/page.tsx
// Matches: /docs, /docs/getting-started, /docs/api/reference
```

## Layouts

### Root Layout (Required)

Must include `<html>` and `<body>` tags:

```tsx
// app/layout.tsx
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <header>Global Header</header>
        {children}
        <footer>Global Footer</footer>
      </body>
    </html>
  )
}
```

### Nested Layouts

```tsx
// app/dashboard/layout.tsx
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div>
      <nav>Dashboard Navigation</nav>
      <main>{children}</main>
    </div>
  )
}
```

Layout characteristics:
- Preserve state during navigation
- Do not re-render on navigation between child routes
- Can fetch data
- Cannot access pathname or searchParams (use Client Component)

## Route Groups

Organize routes without affecting URL structure:

```
app/
├── (marketing)/          # Group without URL segment
│   ├── about/page.tsx   → /about
│   ├── blog/page.tsx    → /blog
│   └── layout.tsx       # Marketing layout
├── (shop)/
│   ├── products/page.tsx → /products
│   ├── cart/page.tsx     → /cart
│   └── layout.tsx       # Shop layout
└── layout.tsx           # Root layout
```

Use cases:
- Multiple root layouts
- Organize code by feature/team
- Different layouts for different sections

## Parallel Routes

Render multiple pages simultaneously in same layout:

```
app/
├── @team/               # Named slot
│   └── page.tsx
├── @analytics/          # Named slot
│   └── page.tsx
├── page.tsx             # Default children
└── layout.tsx           # Consumes slots
```

```tsx
// app/layout.tsx
export default function Layout({
  children,
  team,
  analytics,
}: {
  children: React.ReactNode
  team: React.ReactNode
  analytics: React.ReactNode
}) {
  return (
    <>
      {children}
      <div className="grid grid-cols-2">
        {team}
        {analytics}
      </div>
    </>
  )
}
```

Use cases:
- Split views (dashboards)
- Modals
- Conditional rendering based on auth state

## Intercepting Routes

Intercept navigation to show content in different context:

```
app/
├── feed/
│   └── page.tsx
├── photo/
│   └── [id]/
│       └── page.tsx      # Full photo page
└── (..)photo/            # Intercepts /photo/[id]
    └── [id]/
        └── page.tsx      # Modal photo view
```

Matching conventions:
- `(.)` - Match same level
- `(..)` - Match one level above
- `(..)(..)` - Match two levels above
- `(...)` - Match from app root

Use case: Display modal when navigating from feed, show full page when URL accessed directly

## Loading States

### Loading File

Automatically wraps page in Suspense:

```tsx
// app/dashboard/loading.tsx
export default function Loading() {
  return <div className="spinner">Loading dashboard...</div>
}
```

### Manual Suspense

Fine-grained control:

```tsx
// app/page.tsx
import { Suspense } from 'react'

async function Posts() {
  const posts = await fetchPosts()
  return <PostsList posts={posts} />
}

export default function Page() {
  return (
    <div>
      <h1>My Blog</h1>
      <Suspense fallback={<div>Loading posts...</div>}>
        <Posts />
      </Suspense>
    </div>
  )
}
```

## Error Handling

### Error File

Wraps segment in Error Boundary:

```tsx
// app/error.tsx
'use client' // Error components must be Client Components

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div>
      <h2>Something went wrong!</h2>
      <p>{error.message}</p>
      <button onClick={() => reset()}>Try again</button>
    </div>
  )
}
```

### Global Error

Catches errors in root layout:

```tsx
// app/global-error.tsx
'use client'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html>
      <body>
        <h2>Application Error!</h2>
        <button onClick={() => reset()}>Try again</button>
      </body>
    </html>
  )
}
```

### Not Found

```tsx
// app/blog/[slug]/page.tsx
import { notFound } from 'next/navigation'

export default async function Post({ params }: { params: { slug: string } }) {
  const post = await getPost(params.slug)

  if (!post) {
    notFound() // Triggers not-found.tsx
  }

  return <article>{post.content}</article>
}

// app/blog/[slug]/not-found.tsx
export default function NotFound() {
  return <h2>Post not found</h2>
}
```

## Navigation

### Link Component

```tsx
import Link from 'next/link'

// Basic link
<Link href="/about">About</Link>

// Dynamic route
<Link href={`/blog/${post.slug}`}>Read Post</Link>

// With object
<Link href={{
  pathname: '/blog/[slug]',
  query: { slug: 'hello-world' },
}}>
  Read Post
</Link>

// Prefetch control
<Link href="/dashboard" prefetch={false}>
  Dashboard
</Link>

// Replace history
<Link href="/search" replace>
  Search
</Link>
```

### useRouter Hook (Client)

```tsx
'use client'

import { useRouter } from 'next/navigation'

export function NavigateButton() {
  const router = useRouter()

  return (
    <>
      <button onClick={() => router.push('/dashboard')}>Dashboard</button>
      <button onClick={() => router.replace('/login')}>Login</button>
      <button onClick={() => router.refresh()}>Refresh</button>
      <button onClick={() => router.back()}>Back</button>
      <button onClick={() => router.forward()}>Forward</button>
    </>
  )
}
```

### Programmatic Navigation (Server)

```tsx
import { redirect } from 'next/navigation'

export default async function Page() {
  const session = await getSession()

  if (!session) {
    redirect('/login')
  }

  return <div>Protected content</div>
}
```

## Accessing Route Information

### searchParams (Server)

```tsx
// app/shop/page.tsx
export default function Shop({
  searchParams,
}: {
  searchParams: { sort?: string; filter?: string }
}) {
  const sort = searchParams.sort || 'newest'
  const filter = searchParams.filter

  return <div>Showing: {filter}, sorted by {sort}</div>
}
// Accessed via: /shop?sort=price&filter=shirts
```

### useSearchParams (Client)

```tsx
'use client'

import { useSearchParams } from 'next/navigation'

export function SearchFilter() {
  const searchParams = useSearchParams()
  const query = searchParams.get('q')

  return <div>Search query: {query}</div>
}
```

### usePathname (Client)

```tsx
'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'

export function Navigation() {
  const pathname = usePathname()

  return (
    <nav>
      <Link href="/" className={pathname === '/' ? 'active' : ''}>
        Home
      </Link>
      <Link href="/about" className={pathname === '/about' ? 'active' : ''}>
        About
      </Link>
    </nav>
  )
}
```

## Project Structure Best Practices

```
app/
├── (auth)/                 # Route group for auth pages
│   ├── login/
│   ├── signup/
│   └── layout.tsx         # Auth layout
├── (dashboard)/           # Route group for dashboard
│   ├── dashboard/
│   ├── settings/
│   └── layout.tsx         # Dashboard layout
├── api/                   # API routes
│   ├── auth/
│   └── posts/
├── _components/           # Private folder (not routes)
│   ├── header.tsx
│   └── footer.tsx
├── _lib/                  # Private utilities
│   ├── auth.ts
│   └── db.ts
├── layout.tsx             # Root layout
├── page.tsx               # Home page
├── loading.tsx
├── error.tsx
└── not-found.tsx
```

Use underscore prefix for folders that shouldn't be routes.
