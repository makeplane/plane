# Performance Guardrails

Rules for maintaining smooth animation and rendering performance. These prevent the most common causes of mobile frame drops and layout thrashing.

---

## GPU-Safe Animations

**Only animate these properties:**
- `transform` (translate, scale, rotate)
- `opacity`

**Never animate:**
- `top`, `left`, `right`, `bottom` — triggers layout reflow
- `width`, `height` — triggers layout + paint
- `margin`, `padding` — triggers layout
- `background-color` — triggers paint (acceptable for color transitions, but avoid on frequently animating elements)

**Why:** CSS `transform` and `opacity` are composited on the GPU and don't trigger layout or paint. All other properties cause the browser to recalculate layout on every frame — catastrophic on mobile.

```css
/* Good */
.card { transform: translateY(0); transition: transform 300ms; }
.card:hover { transform: translateY(-4px); }

/* Bad */
.card { top: 0; transition: top 300ms; }
.card:hover { top: -4px; }
```

---

## Blur Constraints

**Apply `backdrop-blur` only to:**
- Fixed-position elements (sticky navbars, overlays)
- Modals and dialogs
- Elements that don't scroll with content

**Never apply blur to:**
- Scrolling containers
- Large content areas
- Elements inside `overflow: auto/scroll` parents

**Why:** `backdrop-blur` triggers continuous GPU compositing on every scroll frame. On a scrolling container with 20+ cards, this causes severe frame drops on mid-range and low-end mobile.

```css
/* Good — fixed nav */
.navbar { position: fixed; backdrop-filter: blur(12px); }

/* Bad — scrolling card list */
.card-list .card { backdrop-filter: blur(8px); } /* kills mobile perf */
```

---

## Grain and Noise Overlays

**Correct implementation:**
```css
/* Fixed, pointer-events-none pseudo-element only */
body::after {
  content: '';
  position: fixed;
  inset: 0;
  z-index: 50;
  pointer-events: none;
  background-image: url("data:image/svg+xml,..."); /* or CSS noise */
  opacity: 0.03;
}
```

**Never attach grain/noise to:**
- Scrolling containers
- Individual cards or sections
- Any element with `position: relative` inside a scroll context

---

## Z-Index Discipline

**Use systemic layers only. Establish a scale in your theme/variables:**

```css
:root {
  --z-base: 0;
  --z-card: 10;
  --z-sticky: 100;
  --z-overlay: 200;
  --z-modal: 300;
  --z-tooltip: 400;
  --z-notification: 500;
}
```

**Never:**
- Use arbitrary values like `z-[9999]` or `z-50` unprompted
- Stack z-indexes without a documented reason
- Use z-index to fix stacking without understanding the stacking context

---

## Framer Motion Performance

**Use `useMotionValue` + `useTransform` for continuous animations:**
```jsx
// Good — runs outside React render cycle
const mouseX = useMotionValue(0);
const rotateY = useTransform(mouseX, [-300, 300], [-15, 15]);

// Bad — triggers re-render on every mouse move
const [rotation, setRotation] = useState(0);
```

**For perpetual/infinite animations:**
- Wrap in `React.memo` to prevent parent re-renders
- Extract as isolated leaf client components
- Use `<AnimatePresence>` for enter/exit — don't conditionally render without it

**For scroll-driven reveals:**
- Use `whileInView` or `IntersectionObserver`
- Never use `window.addEventListener('scroll')` — causes continuous reflows

**For staggered children:**
- Parent `variants` and children MUST be in the same Client Component tree
- If data is async, pass it as props into a centralized parent motion wrapper

---

## RSC Safety (Next.js)

- Global state (Context, providers) works **only** in Client Components
- Wrap providers in a `"use client"` component
- If a section uses Framer Motion or any interactive hook, extract it as an isolated leaf component with `'use client'` at the top
- Server Components render static layout only

---

## Mobile Override Rules

For any asymmetric or complex layout, apply aggressive mobile fallback below 768px:

```jsx
// All asymmetric layouts collapse to single column
<div className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr] gap-6">
```

- Remove all rotations, negative margins, and overlaps below `md:`
- Replace `h-screen` with `min-h-[100dvh]` — prevents iOS Safari viewport jumping
- Never use `overflow: hidden` on `html`/`body` without testing on actual mobile
- Test horizontal scroll — asymmetric layouts often cause unintentional x-overflow on small screens

---

## `will-change` Guidance

Use sparingly. `will-change: transform` tells the browser to promote the element to its own GPU layer:

- Apply only to elements that are **actively animating**
- Remove after animation completes (or use `:hover` scoping)
- Never apply globally — creates excessive GPU memory pressure

```css
/* Good — scoped to hover state */
.card:hover { will-change: transform; }

/* Bad — always promoted */
.card { will-change: transform; }
```
