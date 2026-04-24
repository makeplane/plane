# Next.js Server Components

React Server Components (RSC) architecture, patterns, and best practices.

## Core Concepts

### Server Components (Default)

All components in `app/` directory are Server Components by default:

```tsx
// app/posts/page.tsx - Server Component
async function getPosts() {
  const res = await fetch('https://api.example.com/posts')
  return res.json()
}

export default async function PostsPage() {
  const posts = await getPosts()

  return (
    <div>
      {posts.map(post => (
        <article key={post.id}>{post.title}</article>
      ))}
    </div>
  )
}
```

**Benefits:**
- Fetch data on server (direct database access)
- Keep sensitive data/keys on server
- Reduce client-side JavaScript bundle
- Improve initial page load and SEO
- Cache results on server
- Stream content to client

**Limitations:**
- Cannot use React hooks (useState, useEffect, useContext)
- Cannot use browser APIs (window, localStorage)
- Cannot add event listeners (onClick, onChange)
- Cannot use React class components

### Client Components

Mark with `'use client'` directive at top of file:

```tsx
// components/counter.tsx - Client Component
'use client'

import { useState } from 'react'

export function Counter() {
  const [count, setCount] = useState(0)

  return (
    <button onClick={() => setCount(count + 1)}>
      Count: {count}
    </button>
  )
}
```

**Use Client Components for:**
- Interactive UI (event handlers)
- State management (useState, useReducer)
- Effects (useEffect, useLayoutEffect)
- Browser-only APIs (localStorage, geolocation)
- Custom React hooks
- Context consumers

## Composition Patterns

### Server Component as Wrapper

Best practice: Keep Server Components as parent, pass Client Components as children:

```tsx
// app/page.tsx - Server Component
import { ClientSidebar } from './sidebar'
import { ClientButton } from './button'

export default async function Page() {
  const data = await fetchData() // Server-side data fetch

  return (
    <div>
      <h1>Server-rendered heading</h1>
      <ClientSidebar />
      <ClientButton />
      <p>More server-rendered content: {data.title}</p>
    </div>
  )
}
```

### Passing Server Components to Client Components

Use children pattern to avoid making entire tree client-side:

```tsx
// app/page.tsx - Server Component
import { ClientProvider } from './client-provider'
import { ServerContent } from './server-content'

export default function Page() {
  return (
    <ClientProvider>
      <ServerContent /> {/* Stays as Server Component */}
    </ClientProvider>
  )
}

// client-provider.tsx - Client Component
'use client'

export function ClientProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState()

  return <div>{children}</div>
}

// server-content.tsx - Server Component
export async function ServerContent() {
  const data = await fetchData()
  return <p>{data.content}</p>
}
```

### Sharing Data Between Server Components

No need for props or context - just fetch data where needed:

```tsx
// lib/data.ts
export async function getUser() {
  const res = await fetch('https://api.example.com/user', {
    cache: 'force-cache' // Will dedupe automatically
  })
  return res.json()
}

// app/header.tsx
import { getUser } from '@/lib/data'

export async function Header() {
  const user = await getUser() // Fetch 1
  return <div>Welcome, {user.name}</div>
}

// app/profile.tsx
import { getUser } from '@/lib/data'

export async function Profile() {
  const user = await getUser() // Fetch 2 (deduped automatically)
  return <div>Email: {user.email}</div>
}
```

Next.js automatically dedupes identical fetch requests during render.

## Async Components

Server Components can be async functions:

```tsx
// app/posts/[id]/page.tsx
async function getPost(id: string) {
  const res = await fetch(`https://api.example.com/posts/${id}`)
  return res.json()
}

async function getComments(postId: string) {
  const res = await fetch(`https://api.example.com/posts/${postId}/comments`)
  return res.json()
}

export default async function Post({ params }: { params: { id: string } }) {
  // Parallel data fetching
  const [post, comments] = await Promise.all([
    getPost(params.id),
    getComments(params.id)
  ])

  return (
    <article>
      <h1>{post.title}</h1>
      <p>{post.content}</p>
      <CommentsList comments={comments} />
    </article>
  )
}
```

## Streaming with Suspense

Stream components as they resolve:

```tsx
// app/page.tsx
import { Suspense } from 'react'

async function SlowComponent() {
  await new Promise(resolve => setTimeout(resolve, 3000))
  return <div>Loaded after 3 seconds</div>
}

async function FastComponent() {
  await new Promise(resolve => setTimeout(resolve, 500))
  return <div>Loaded after 0.5 seconds</div>
}

export default function Page() {
  return (
    <div>
      <h1>Instant heading</h1>

      <Suspense fallback={<div>Loading fast...</div>}>
        <FastComponent />
      </Suspense>

      <Suspense fallback={<div>Loading slow...</div>}>
        <SlowComponent />
      </Suspense>
    </div>
  )
}
```

Benefits:
- Fast components render immediately
- Slow components don't block page
- Progressive enhancement
- Better perceived performance

## Context in Server/Client Components

### Problem: Context Requires Client Components

```tsx
// ❌ Won't work - Server Components can't use context
import { createContext } from 'react'

const ThemeContext = createContext()

export default function Layout({ children }) {
  return (
    <ThemeContext.Provider value="dark">
      {children}
    </ThemeContext.Provider>
  )
}
```

### Solution: Create Client Component Wrapper

```tsx
// app/providers.tsx - Client Component
'use client'

import { createContext, useContext } from 'react'

const ThemeContext = createContext('light')

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <ThemeContext.Provider value="dark">
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}

// app/layout.tsx - Server Component
import { ThemeProvider } from './providers'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
```

## Third-Party Component Integration

Many third-party components need client-side features:

```tsx
// components/carousel.tsx
'use client'

import 'slick-carousel/slick/slick.css'
import Slider from 'react-slick'

export function Carousel({ children }) {
  return <Slider>{children}</Slider>
}

// app/page.tsx - Server Component
import { Carousel } from '@/components/carousel'

export default function Page() {
  return (
    <Carousel>
      <div>Slide 1</div>
      <div>Slide 2</div>
    </Carousel>
  )
}
```

## Server Actions

Call server-side functions from Client Components:

```tsx
// app/actions.ts
'use server'

import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'

export async function createPost(formData: FormData) {
  const title = formData.get('title') as string
  const content = formData.get('content') as string

  await db.post.create({
    data: { title, content }
  })

  revalidatePath('/posts')
}

// app/new-post/page.tsx
import { createPost } from '@/app/actions'

export default function NewPost() {
  return (
    <form action={createPost}>
      <input name="title" required />
      <textarea name="content" required />
      <button type="submit">Create Post</button>
    </form>
  )
}
```

With Client Component:
```tsx
// components/post-form.tsx
'use client'

import { createPost } from '@/app/actions'
import { useFormStatus } from 'react-dom'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button type="submit" disabled={pending}>
      {pending ? 'Creating...' : 'Create Post'}
    </button>
  )
}

export function PostForm() {
  return (
    <form action={createPost}>
      <input name="title" required />
      <textarea name="content" required />
      <SubmitButton />
    </form>
  )
}
```

## When to Use Each Component Type

### Use Server Components When:
- Fetching data from database or API
- Accessing backend resources directly
- Keeping sensitive information on server (tokens, keys)
- Reducing client-side JavaScript
- Rendering static content
- No interactivity needed

### Use Client Components When:
- Adding interactivity (onClick, onChange)
- Managing state (useState, useReducer)
- Using lifecycle effects (useEffect)
- Using browser-only APIs (localStorage, navigator)
- Using custom React hooks
- Using React Context
- Using third-party libraries requiring client features

## Best Practices

1. **Default to Server Components** - Only use 'use client' when needed
2. **Move Client Components to leaves** - Keep them as deep as possible in tree
3. **Pass Server Components as children** - Avoid turning entire trees client-side
4. **Share data via fetch** - Let Next.js dedupe requests automatically
5. **Use Suspense for streaming** - Improve perceived performance
6. **Separate client logic** - Extract client-only code to separate files
7. **Minimize client bundle** - Less JavaScript = faster page loads

## Common Patterns

### Protected Content

```tsx
// app/dashboard/page.tsx - Server Component
import { redirect } from 'next/navigation'
import { getUser } from '@/lib/auth'

export default async function Dashboard() {
  const user = await getUser()

  if (!user) {
    redirect('/login')
  }

  return <div>Welcome, {user.name}</div>
}
```

### Optimistic Updates

```tsx
// components/like-button.tsx
'use client'

import { useOptimistic } from 'react'
import { likePost } from '@/app/actions'

export function LikeButton({ postId, initialLikes }) {
  const [optimisticLikes, addOptimisticLike] = useOptimistic(
    initialLikes,
    (state, amount) => state + amount
  )

  return (
    <button
      onClick={async () => {
        addOptimisticLike(1)
        await likePost(postId)
      }}
    >
      Likes: {optimisticLikes}
    </button>
  )
}
```

### Loading States with Streaming

```tsx
// app/dashboard/page.tsx
import { Suspense } from 'react'

async function RevenueChart() {
  const data = await fetchRevenue() // Slow query
  return <Chart data={data} />
}

async function RecentSales() {
  const sales = await fetchSales() // Fast query
  return <SalesTable sales={sales} />
}

export default function Dashboard() {
  return (
    <div>
      <h1>Dashboard</h1>

      <Suspense fallback={<ChartSkeleton />}>
        <RevenueChart />
      </Suspense>

      <Suspense fallback={<TableSkeleton />}>
        <RecentSales />
      </Suspense>
    </div>
  )
}
```
