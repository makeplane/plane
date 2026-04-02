# RemixIcon Integration Guide

Installation, usage, customization, and accessibility for RemixIcon library.

## Overview

RemixIcon provides 3,100+ icons in outlined (-line) and filled (-fill) styles, built on 24x24px grid.

**Icon naming:** `ri-{name}-{style}`
- Examples: `ri-home-line`, `ri-heart-fill`, `ri-search-line`

## Installation

### NPM Package

```bash
# npm
npm install remixicon

# yarn
yarn add remixicon

# pnpm
pnpm install remixicon

# bun
bun add remixicon
```

### React Package

```bash
npm install @remixicon/react
```

### Vue 3 Package

```bash
npm install @remixicon/vue
```

### CDN

```html
<link
  href="https://cdn.jsdelivr.net/npm/remixicon@4.7.0/fonts/remixicon.css"
  rel="stylesheet"
/>
```

## Usage Methods

### 1. Webfont (HTML/CSS)

Import CSS and use class names:

```tsx
// Next.js - app/layout.tsx
import 'remixicon/fonts/remixicon.css'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>{children}</body>
    </html>
  )
}

// Use in components
<i className="ri-home-line"></i>
<i className="ri-search-fill"></i>
```

**With sizing classes:**
```html
<i className="ri-home-line ri-2x"></i>    <!-- 2em -->
<i className="ri-search-line ri-lg"></i>  <!-- 1.33em -->
<i className="ri-heart-fill ri-xl"></i>   <!-- 1.5em -->
```

**Available sizes:**
- `ri-xxs` (0.5em)
- `ri-xs` (0.75em)
- `ri-sm` (0.875em)
- `ri-1x` (1em)
- `ri-lg` (1.33em)
- `ri-xl` (1.5em)
- `ri-2x` through `ri-10x`
- `ri-fw` (fixed width)

### 2. React Components

```tsx
import { RiHomeLine, RiSearchFill, RiHeartLine } from "@remixicon/react"

export function MyComponent() {
  return (
    <div>
      <RiHomeLine size={24} />
      <RiSearchFill size={32} color="blue" />
      <RiHeartLine size="1.5em" className="icon" />
    </div>
  )
}
```

**Props:**
- `size` - Number (pixels) or string (em, rem)
- `color` - CSS color value
- `className` - CSS class
- Standard SVG props (onClick, style, etc.)

### 3. Vue 3 Components

```vue
<script setup lang="ts">
import { RiHomeLine, RiSearchFill } from "@remixicon/vue"
</script>

<template>
  <div>
    <RiHomeLine :size="24" />
    <RiSearchFill :size="32" color="blue" />
  </div>
</template>
```

### 4. Direct SVG

```tsx
// Download SVG file and import
import HomeIcon from '@/icons/home-line.svg'

export function Component() {
  return <img src={HomeIcon} alt="Home" width={24} height={24} />
}
```

### 5. SVG Sprite

```html
<svg className="icon">
  <use xlinkHref="path/to/remixicon.symbol.svg#ri-home-line"></use>
</svg>
```

```css
.icon {
  width: 24px;
  height: 24px;
  fill: currentColor;
}
```

## Icon Categories

20 semantic categories with 3,100+ icons:

**Navigation & UI:**
- Arrows (arrow-left, arrow-right, arrow-up-down)
- System (settings, delete, add, close, more)
- Editor (bold, italic, link, list, code)

**Communication:**
- Communication (chat, phone, mail, message)
- User (user, account, team, contacts)

**Media & Content:**
- Media (play, pause, volume, camera, video)
- Document (file, folder, article, draft)
- Design (brush, palette, magic, crop)

**Business & Commerce:**
- Business (briefcase, pie-chart, bar-chart)
- Finance (money, wallet, bank-card, coin)
- Map (map, pin, compass, navigation)

**Objects & Places:**
- Buildings (home, bank, hospital, store)
- Device (phone, laptop, tablet, printer)
- Food (restaurant, cake, cup, knife)
- Weather (sun, cloud, rain, moon)

**Development & Logos:**
- Development (code, terminal, bug, git-branch)
- Logos (github, twitter, facebook, google)

**Health & Medical:**
- Health (heart-pulse, capsule, stethoscope)

## Common Patterns

### Navigation Menu

```tsx
// Webfont approach
export function Navigation() {
  return (
    <nav>
      <a href="/home">
        <i className="ri-home-line"></i>
        <span>Home</span>
      </a>
      <a href="/search">
        <i className="ri-search-line"></i>
        <span>Search</span>
      </a>
      <a href="/profile">
        <i className="ri-user-line"></i>
        <span>Profile</span>
      </a>
    </nav>
  )
}

// React component approach
import { RiHomeLine, RiSearchLine, RiUserLine } from "@remixicon/react"

export function Navigation() {
  return (
    <nav>
      <a href="/home">
        <RiHomeLine size={20} />
        <span>Home</span>
      </a>
      <a href="/search">
        <RiSearchLine size={20} />
        <span>Search</span>
      </a>
      <a href="/profile">
        <RiUserLine size={20} />
        <span>Profile</span>
      </a>
    </nav>
  )
}
```

### Button with Icon

```tsx
import { RiDownloadLine } from "@remixicon/react"

export function DownloadButton() {
  return (
    <button className="btn-primary">
      <RiDownloadLine size={18} />
      <span>Download</span>
    </button>
  )
}
```

### Status Indicators

```tsx
import {
  RiCheckboxCircleFill,
  RiErrorWarningFill,
  RiAlertFill,
  RiInformationFill
} from "@remixicon/react"

type Status = 'success' | 'error' | 'warning' | 'info'

export function StatusIcon({ status }: { status: Status }) {
  const icons = {
    success: <RiCheckboxCircleFill color="green" size={20} />,
    error: <RiErrorWarningFill color="red" size={20} />,
    warning: <RiAlertFill color="orange" size={20} />,
    info: <RiInformationFill color="blue" size={20} />
  }

  return icons[status]
}
```

### Input with Icon

```tsx
import { RiSearchLine } from "@remixicon/react"

export function SearchInput() {
  return (
    <div className="input-group">
      <RiSearchLine size={20} className="input-icon" />
      <input type="text" placeholder="Search..." />
    </div>
  )
}
```

```css
.input-group {
  position: relative;
}

.input-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #666;
}

input {
  padding-left: 40px;
}
```

### Dynamic Icon Selection

```tsx
import { RiHomeLine, RiHeartFill, RiStarLine } from "@remixicon/react"

const iconMap = {
  home: RiHomeLine,
  heart: RiHeartFill,
  star: RiStarLine,
}

export function DynamicIcon({ name, size = 24 }: { name: string; size?: number }) {
  const Icon = iconMap[name]
  return Icon ? <Icon size={size} /> : null
}

// Usage
<DynamicIcon name="home" size={24} />
```

## Styling & Customization

### Color

```tsx
// Inherit from parent
<i className="ri-home-line" style={{ color: 'blue' }}></i>

// React component
<RiHomeLine color="blue" />
<RiHomeLine color="#ff0000" />
<RiHomeLine color="rgb(255, 0, 0)" />
```

### Size

```tsx
// CSS class
<i className="ri-home-line ri-2x"></i>

// Inline style
<i className="ri-home-line" style={{ fontSize: '32px' }}></i>

// React component
<RiHomeLine size={32} />
<RiHomeLine size="2em" />
```

### Responsive Sizing

```css
.icon {
  font-size: 24px;
}

@media (max-width: 768px) {
  .icon {
    font-size: 20px;
  }
}
```

### Animations

```css
.spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
```

```tsx
<i className="ri-loader-4-line spin"></i>
```

### Hover Effects

```css
.icon-button {
  transition: color 0.2s;
}

.icon-button:hover {
  color: #007bff;
}
```

## Accessibility

### Provide Labels

**Icon-only buttons:**
```tsx
<button aria-label="Search">
  <i className="ri-search-line"></i>
</button>

// Or with React
<button aria-label="Search">
  <RiSearchLine size={20} />
</button>
```

### Decorative Icons

Hide from screen readers:

```tsx
<span aria-hidden="true">
  <i className="ri-star-fill"></i>
</span>

// React
<span aria-hidden="true">
  <RiStarFill size={16} />
</span>
```

### Icon with Text

```tsx
<button>
  <RiDownloadLine size={18} aria-hidden="true" />
  <span>Download</span>
</button>
```

Text provides context, icon is decorative.

## Framework Integration

### Next.js

```tsx
// app/layout.tsx
import 'remixicon/fonts/remixicon.css'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>{children}</body>
    </html>
  )
}

// app/page.tsx
import { RiHomeLine } from "@remixicon/react"

export default function Page() {
  return <RiHomeLine size={24} />
}
```

### Tailwind CSS

```tsx
<i className="ri-home-line text-2xl text-blue-500"></i>

<RiHomeLine size={24} className="text-blue-500 hover:text-blue-600" />
```

### CSS Modules

```tsx
import styles from './component.module.css'
import 'remixicon/fonts/remixicon.css'

export function Component() {
  return <i className={`ri-home-line ${styles.icon}`}></i>
}
```

## Performance Considerations

### Webfont (Recommended for Multiple Icons)

**Pros:**
- Single HTTP request
- All icons available
- Easy to use

**Cons:**
- 179KB WOFF2 file
- Loads all icons even if unused

**Best for:** Apps using 10+ different icons

### Individual SVG (Recommended for Few Icons)

**Pros:**
- Only load what you need
- Smallest bundle size
- Tree-shakeable with React package

**Cons:**
- Multiple imports

**Best for:** Apps using 1-5 icons

### React/Vue Package

**Pros:**
- Tree-shakeable (only imports used icons)
- TypeScript support
- Component API

**Cons:**
- Slightly larger than raw SVG
- Requires React/Vue

**Best for:** React/Vue apps with TypeScript

## Troubleshooting

### Icons Not Displaying

**Check CSS import:**
```tsx
import 'remixicon/fonts/remixicon.css'
```

**Verify class name:**
```html
<!-- Correct -->
<i className="ri-home-line"></i>

<!-- Incorrect -->
<i className="ri-home"></i>
<i className="home-line"></i>
```

**Check font loading:**
```css
/* Ensure font-family is applied */
[class^="ri-"], [class*=" ri-"] {
  font-family: "remixicon" !important;
}
```

### Icons Look Blurry

Use multiples of 24px for crisp rendering:

```tsx
// Good
<RiHomeLine size={24} />
<RiHomeLine size={48} />

// Bad (breaks pixel grid)
<RiHomeLine size={20} />
<RiHomeLine size={30} />
```

### Wrong Icon Size

**Set parent font-size:**
```css
.icon-container {
  font-size: 24px;
}
```

**Or use size prop:**
```tsx
<RiHomeLine size={24} />
```

## Best Practices

1. **Choose style consistently** - Use line or fill throughout app
2. **Maintain 24px grid** - Use sizes: 24, 48, 72, 96px
3. **Provide accessibility** - Add aria-labels to icon-only buttons
4. **Use currentColor** - Icons inherit text color by default
5. **Optimize bundle** - Use React package for tree-shaking
6. **Cache webfonts** - CDN or long cache headers
7. **Lazy load icons** - Dynamic import for heavy icon sets
8. **Test on devices** - Ensure icons scale properly
9. **Document usage** - Create icon component library
10. **Version lock** - Pin RemixIcon version for consistency

## Resources

- Website: https://remixicon.com
- GitHub: https://github.com/Remix-Design/RemixIcon
- React Package: @remixicon/react
- Vue Package: @remixicon/vue
- License: Apache 2.0
- Total Icons: 3,100+
- Current Version: 4.7.0
