---
name: web-frameworks
description: Build with Next.js (App Router, RSC, SSR, ISR), Turborepo monorepos. Use for React apps, server rendering, build optimization, caching strategies, shared dependencies.
license: MIT
version: 1.0.0
---

# Web Frameworks Skill Group

Comprehensive guide for building modern full-stack web applications using Next.js, Turborepo, and RemixIcon.

## Overview

This skill group combines three powerful tools for web development:

**Next.js** - React framework with SSR, SSG, RSC, and optimization features
**Turborepo** - High-performance monorepo build system for JavaScript/TypeScript
**RemixIcon** - Icon library with 3,100+ outlined and filled style icons

## When to Use This Skill Group

- Building new full-stack web applications with modern React
- Setting up monorepos with multiple apps and shared packages
- Implementing server-side rendering and static generation
- Optimizing build performance with intelligent caching
- Creating consistent UI with professional iconography
- Managing workspace dependencies across multiple projects
- Deploying production-ready applications with proper optimization

## Stack Selection Guide

### Single Application: Next.js + RemixIcon

Use when building a standalone application:
- E-commerce sites
- Marketing websites
- SaaS applications
- Documentation sites
- Blogs and content platforms

**Setup:**
```bash
npx create-next-app@latest my-app
cd my-app
npm install remixicon
```

### Monorepo: Next.js + Turborepo + RemixIcon

Use when building multiple applications with shared code:
- Microfrontends
- Multi-tenant platforms
- Internal tools with shared component library
- Multiple apps (web, admin, mobile-web) sharing logic
- Design system with documentation site

**Setup:**
```bash
npx create-turbo@latest my-monorepo
# Then configure Next.js apps in apps/ directory
# Install remixicon in shared UI packages
```

### Framework Features Comparison

| Feature | Next.js | Turborepo | RemixIcon |
|---------|---------|-----------|-----------|
| Primary Use | Web framework | Build system | UI icons |
| Best For | SSR/SSG apps | Monorepos | Consistent iconography |
| Performance | Built-in optimization | Caching & parallel tasks | Lightweight fonts/SVG |
| TypeScript | Full support | Full support | Type definitions available |

## Quick Start

### Next.js Application

```bash
# Create new project
npx create-next-app@latest my-app
cd my-app

# Install RemixIcon
npm install remixicon

# Import in layout
# app/layout.tsx
import 'remixicon/fonts/remixicon.css'

# Start development
npm run dev
```

### Turborepo Monorepo

```bash
# Create monorepo
npx create-turbo@latest my-monorepo
cd my-monorepo

# Structure:
# apps/web/          - Next.js application
# apps/docs/         - Documentation site
# packages/ui/       - Shared components with RemixIcon
# packages/config/   - Shared configs
# turbo.json         - Pipeline configuration

# Run all apps
npm run dev

# Build all packages
npm run build
```

### RemixIcon Integration

```tsx
// Webfont (HTML/CSS)
<i className="ri-home-line"></i>
<i className="ri-search-fill ri-2x"></i>

// React component
import { RiHomeLine, RiSearchFill } from "@remixicon/react"
<RiHomeLine size={24} />
<RiSearchFill size={32} color="blue" />
```

## Reference Navigation

**Next.js References:**
- [App Router Architecture](./references/nextjs-app-router.md) - Routing, layouts, pages, parallel routes
- [Server Components](./references/nextjs-server-components.md) - RSC patterns, client vs server, streaming
- [Data Fetching](./references/nextjs-data-fetching.md) - fetch API, caching, revalidation, loading states
- [Optimization](./references/nextjs-optimization.md) - Images, fonts, scripts, bundle analysis, PPR

**Turborepo References:**
- [Setup & Configuration](./references/turborepo-setup.md) - Installation, workspace config, package structure
- [Task Pipelines](./references/turborepo-pipelines.md) - Dependencies, parallel execution, task ordering
- [Caching Strategies](./references/turborepo-caching.md) - Local cache, remote cache, cache invalidation

**RemixIcon References:**
- [Integration Guide](./references/remix-icon-integration.md) - Installation, usage, customization, accessibility

## Common Patterns & Workflows

### Pattern 1: Full-Stack Monorepo

```
my-monorepo/
├── apps/
│   ├── web/              # Customer-facing Next.js app
│   ├── admin/            # Admin dashboard Next.js app
│   └── docs/             # Documentation site
├── packages/
│   ├── ui/               # Shared UI with RemixIcon
│   ├── api-client/       # API client library
│   ├── config/           # ESLint, TypeScript configs
│   └── types/            # Shared TypeScript types
└── turbo.json            # Build pipeline
```

**turbo.json:**
```json
{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "!.next/cache/**", "dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {},
    "test": {
      "dependsOn": ["build"]
    }
  }
}
```

### Pattern 2: Shared Component Library

```tsx
// packages/ui/src/button.tsx
import { RiLoader4Line } from "@remixicon/react"

export function Button({ children, loading, icon }) {
  return (
    <button>
      {loading ? <RiLoader4Line className="animate-spin" /> : icon}
      {children}
    </button>
  )
}

// apps/web/app/page.tsx
import { Button } from "@repo/ui/button"
import { RiHomeLine } from "@remixicon/react"

export default function Page() {
  return <Button icon={<RiHomeLine />}>Home</Button>
}
```

### Pattern 3: Optimized Data Fetching

```tsx
// app/posts/[slug]/page.tsx
import { notFound } from 'next/navigation'

// Static generation at build time
export async function generateStaticParams() {
  const posts = await getPosts()
  return posts.map(post => ({ slug: post.slug }))
}

// Revalidate every hour
async function getPost(slug: string) {
  const res = await fetch(`https://api.example.com/posts/${slug}`, {
    next: { revalidate: 3600 }
  })
  if (!res.ok) return null
  return res.json()
}

export default async function Post({ params }: { params: { slug: string } }) {
  const post = await getPost(params.slug)
  if (!post) notFound()

  return <article>{post.content}</article>
}
```

### Pattern 4: Monorepo CI/CD Pipeline

```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 18
      - run: npm install
      - run: npx turbo run build test lint
        env:
          TURBO_TOKEN: ${{ secrets.TURBO_TOKEN }}
          TURBO_TEAM: ${{ secrets.TURBO_TEAM }}
```

## Utility Scripts

Python utilities in `scripts/` directory:

**nextjs-init.py** - Initialize Next.js project with best practices
**turborepo-migrate.py** - Convert existing monorepo to Turborepo

Usage examples:
```bash
# Initialize new Next.js app with TypeScript and recommended setup
python scripts/nextjs-init.py --name my-app --typescript --app-router

# Migrate existing monorepo to Turborepo with dry-run
python scripts/turborepo-migrate.py --path ./my-monorepo --dry-run

# Run tests
cd scripts/tests
pytest
```

## Best Practices

**Next.js:**
- Default to Server Components, use Client Components only when needed
- Implement proper loading and error states
- Use Image component for automatic optimization
- Set proper metadata for SEO
- Leverage caching strategies (force-cache, revalidate, no-store)

**Turborepo:**
- Structure monorepo with clear separation (apps/, packages/)
- Define task dependencies correctly (^build for topological)
- Configure outputs for proper caching
- Enable remote caching for team collaboration
- Use filters to run tasks on changed packages only

**RemixIcon:**
- Use line style for minimal interfaces, fill for emphasis
- Maintain 24x24 grid alignment for crisp rendering
- Provide aria-labels for accessibility
- Use currentColor for flexible theming
- Prefer webfonts for multiple icons, SVG for single icons

## Resources

- Next.js: https://nextjs.org/docs/llms.txt
- Turborepo: https://turbo.build/repo/docs
- RemixIcon: https://remixicon.com

## Implementation Checklist

Building with this stack:

- [ ] Create project structure (single app or monorepo)
- [ ] Configure TypeScript and ESLint
- [ ] Set up Next.js with App Router
- [ ] Configure Turborepo pipeline (if monorepo)
- [ ] Install and configure RemixIcon
- [ ] Implement routing and layouts
- [ ] Add loading and error states
- [ ] Configure image and font optimization
- [ ] Set up data fetching patterns
- [ ] Configure caching strategies
- [ ] Add API routes as needed
- [ ] Implement shared component library (if monorepo)
- [ ] Configure remote caching (if monorepo)
- [ ] Set up CI/CD pipeline
- [ ] Configure deployment platform
