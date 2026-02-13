# Next.js Optimization

Performance optimization techniques for images, fonts, scripts, and bundles.

## Image Optimization

### Next.js Image Component

Automatic optimization with modern formats (WebP, AVIF):

```tsx
import Image from 'next/image'

export default function Page() {
  return (
    <>
      {/* Local image */}
      <Image
        src="/hero.jpg"
        alt="Hero image"
        width={1200}
        height={600}
        priority // Load immediately, no lazy loading
      />

      {/* Remote image */}
      <Image
        src="https://example.com/photo.jpg"
        alt="Photo"
        width={800}
        height={600}
        quality={90} // 1-100, default 75
      />

      {/* Responsive fill */}
      <div style={{ position: 'relative', width: '100%', height: '400px' }}>
        <Image
          src="/background.jpg"
          alt="Background"
          fill
          style={{ objectFit: 'cover' }}
          sizes="100vw"
        />
      </div>

      {/* With blur placeholder */}
      <Image
        src="/profile.jpg"
        alt="Profile"
        width={200}
        height={200}
        placeholder="blur"
        blurDataURL="data:image/jpeg;base64,..." // Or use static import
      />
    </>
  )
}
```

### Image Props Reference

**Required:**
- `src` - Image path (string or static import)
- `alt` - Alt text for accessibility
- `width`, `height` - Dimensions (required unless using `fill`)

**Optional:**
- `fill` - Fill parent container (makes width/height optional)
- `sizes` - Responsive sizes hint for srcset
- `quality` - 1-100 (default 75)
- `priority` - Disable lazy loading, preload image
- `placeholder` - 'blur' | 'empty' (default 'empty')
- `blurDataURL` - Data URL for blur placeholder
- `loading` - 'lazy' | 'eager' (default 'lazy')
- `style` - CSS styles
- `className` - CSS class
- `onLoad` - Callback when loaded

### Responsive Images with Sizes

```tsx
<Image
  src="/hero.jpg"
  alt="Hero"
  fill
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
/>
```

This tells browser:
- Mobile (<768px): Use 100% viewport width
- Tablet (768-1200px): Use 50% viewport width
- Desktop (>1200px): Use 33% viewport width

### Static Import for Local Images

```tsx
import heroImage from '@/public/hero.jpg'

<Image
  src={heroImage}
  alt="Hero"
  placeholder="blur" // Automatically generated
  // No width/height needed - inferred from import
/>
```

### Remote Image Configuration

```js
// next.config.js
module.exports = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'example.com',
        pathname: '/images/**',
      },
      {
        protocol: 'https',
        hostname: 'cdn.example.com',
      }
    ],
    // Device sizes for srcset
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    // Image sizes for srcset
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // Supported formats
    formats: ['image/webp'],
    // Cache optimization images for 60 days
    minimumCacheTTL: 60 * 60 * 24 * 60,
  }
}
```

## Font Optimization

### Google Fonts

Automatic optimization with zero layout shift:

```tsx
// app/layout.tsx
import { Inter, Roboto_Mono, Playfair_Display } from 'next/font/google'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

const robotoMono = Roboto_Mono({
  subsets: ['latin'],
  display: 'swap',
  weight: ['400', '700'],
  variable: '--font-roboto-mono',
})

const playfair = Playfair_Display({
  subsets: ['latin'],
  display: 'swap',
  weight: ['400', '700', '900'],
  style: ['normal', 'italic'],
})

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${robotoMono.variable}`}>
      <body className={inter.className}>{children}</body>
    </html>
  )
}
```

Use CSS variables:
```css
.code {
  font-family: var(--font-roboto-mono);
}
```

### Local Fonts

```tsx
import localFont from 'next/font/local'

const myFont = localFont({
  src: [
    {
      path: './fonts/my-font-regular.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: './fonts/my-font-bold.woff2',
      weight: '700',
      style: 'normal',
    }
  ],
  variable: '--font-my-font',
  display: 'swap',
})

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={myFont.variable}>
      <body>{children}</body>
    </html>
  )
}
```

### Font Display Strategies

```tsx
const font = Inter({
  display: 'swap', // Show fallback immediately, swap when loaded (recommended)
  // display: 'optional', // Only use font if available immediately
  // display: 'block', // Hide text until font loads (max 3s)
  // display: 'fallback', // Show fallback briefly, swap if loaded quickly
  // display: 'auto', // Browser default
})
```

## Script Optimization

### Script Component

Control loading behavior:

```tsx
import Script from 'next/script'

export default function Page() {
  return (
    <>
      {/* Load after page is interactive (recommended for analytics) */}
      <Script
        src="https://www.googletagmanager.com/gtag/js"
        strategy="afterInteractive"
      />

      {/* Load while page is idle (lowest priority) */}
      <Script
        src="https://connect.facebook.net/en_US/sdk.js"
        strategy="lazyOnload"
      />

      {/* Load before page is interactive (use sparingly) */}
      <Script
        src="https://maps.googleapis.com/maps/api/js"
        strategy="beforeInteractive"
      />

      {/* Inline script with strategy */}
      <Script id="analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
        `}
      </Script>

      {/* With onLoad callback */}
      <Script
        src="https://example.com/sdk.js"
        onLoad={() => console.log('Script loaded')}
        onError={(e) => console.error('Script failed', e)}
      />
    </>
  )
}
```

**Strategy options:**
- `beforeInteractive` - Load before page interactive (blocking)
- `afterInteractive` - Load after page interactive (default)
- `lazyOnload` - Load during idle time
- `worker` - Load in web worker (experimental)

## Bundle Optimization

### Analyzing Bundle Size

```bash
# Install bundle analyzer
npm install @next/bundle-analyzer

# Create next.config.js wrapper
```

```js
// next.config.js
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

module.exports = withBundleAnalyzer({
  // Your Next.js config
})
```

```bash
# Run analysis
ANALYZE=true npm run build
```

### Dynamic Import (Code Splitting)

Split code and load on-demand:

```tsx
import dynamic from 'next/dynamic'

// Dynamic import with loading state
const DynamicChart = dynamic(() => import('@/components/chart'), {
  loading: () => <div>Loading chart...</div>,
  ssr: false, // Disable SSR for this component
})

export default function Dashboard() {
  return (
    <div>
      <h1>Dashboard</h1>
      <DynamicChart />
    </div>
  )
}
```

Named exports:
```tsx
const DynamicComponent = dynamic(
  () => import('@/components/hello').then(mod => mod.Hello)
)
```

Multiple components:
```tsx
const DynamicHeader = dynamic(() => import('@/components/header'))
const DynamicFooter = dynamic(() => import('@/components/footer'))
```

### Tree Shaking

Import only what you need:

```tsx
// ❌ Bad - imports entire library
import _ from 'lodash'
const result = _.debounce(fn, 300)

// ✅ Good - imports only debounce
import debounce from 'lodash/debounce'
const result = debounce(fn, 300)

// ❌ Bad
import * as Icons from 'react-icons/fa'
<Icons.FaHome />

// ✅ Good
import { FaHome } from 'react-icons/fa'
<FaHome />
```

## Partial Prerendering (PPR)

Experimental: Combine static and dynamic rendering in same route.

```js
// next.config.js
module.exports = {
  experimental: {
    ppr: true,
  }
}
```

```tsx
// app/page.tsx
import { Suspense } from 'react'

// Static shell
export default function Page() {
  return (
    <div>
      <header>Static Header</header>

      {/* Dynamic content with Suspense boundary */}
      <Suspense fallback={<div>Loading...</div>}>
        <DynamicContent />
      </Suspense>

      <footer>Static Footer</footer>
    </div>
  )
}

// Dynamic component
async function DynamicContent() {
  const data = await fetch('https://api.example.com/data', {
    cache: 'no-store'
  }).then(r => r.json())

  return <div>{data.content}</div>
}
```

Static shell loads instantly, dynamic content streams in.

## Metadata Optimization

### Static Metadata

```tsx
// app/page.tsx
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'My Page',
  description: 'Page description',
  keywords: ['next.js', 'react', 'javascript'],
  openGraph: {
    title: 'My Page',
    description: 'Page description',
    images: ['/og-image.jpg'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'My Page',
    description: 'Page description',
    images: ['/twitter-image.jpg'],
  },
  alternates: {
    canonical: 'https://example.com/page',
  },
  robots: {
    index: true,
    follow: true,
  },
}
```

### Dynamic Metadata

```tsx
// app/blog/[slug]/page.tsx
export async function generateMetadata({ params }): Promise<Metadata> {
  const post = await getPost(params.slug)

  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      images: [post.coverImage],
      type: 'article',
      publishedTime: post.publishedAt,
      authors: [post.author.name],
    },
  }
}
```

### Metadata Files

Create these files in `app/` directory:

- `favicon.ico` - Favicon
- `icon.png` / `icon.jpg` - App icon
- `apple-icon.png` - Apple touch icon
- `opengraph-image.png` - Open Graph image
- `twitter-image.png` - Twitter card image
- `robots.txt` - Robots file
- `sitemap.xml` - Sitemap

Or generate dynamically:
```tsx
// app/sitemap.ts
export default async function sitemap() {
  const posts = await getPosts()

  return [
    {
      url: 'https://example.com',
      lastModified: new Date(),
    },
    ...posts.map(post => ({
      url: `https://example.com/blog/${post.slug}`,
      lastModified: post.updatedAt,
    }))
  ]
}
```

## Performance Best Practices

1. **Use Image component** - Automatic optimization, lazy loading, modern formats
2. **Optimize fonts** - Use next/font to eliminate layout shift
3. **Dynamic imports** - Code split large components and third-party libraries
4. **Analyze bundle** - Identify and eliminate large dependencies
5. **Proper caching** - Use ISR for semi-static content
6. **Streaming with Suspense** - Load fast content first, stream slow content
7. **Minimize JavaScript** - Default to Server Components
8. **Prefetch links** - Next.js prefetches Link components in viewport
9. **Use Script component** - Control third-party script loading
10. **Compress assets** - Enable compression in hosting platform
11. **Use CDN** - Deploy to edge network (Vercel, Cloudflare)
12. **Monitor metrics** - Track Core Web Vitals (LCP, FID, CLS)
