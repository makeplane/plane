# Bento 2.0 Motion Engine

Architecture for modern SaaS dashboards and feature sections. Goes beyond static cards — enforces a "Vercel-core meets Dribbble-clean" aesthetic with perpetual physics.

Use when generating: SaaS dashboards, feature showcase grids, marketing bento sections, product landing pages with interactive demos.

---

## Core Design Philosophy

**Aesthetic:** High-end, minimal, functional. Every card feels alive.

**Palette:**
- Background: `#f9fafb` (light) or `#050505` (dark)
- Cards: pure white `#ffffff` (light) / vantablack with `bg-white/5` (dark)
- Card borders: `border border-slate-200/50` (light) / `border border-white/10` (dark)

**Surfaces:**
- All major containers use `rounded-[2.5rem]`
- Diffusion shadow: `shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)]` — depth without clutter
- Card titles and descriptions sit **outside and below** the card (gallery-style presentation)
- Card interior: generous `p-8` or `p-10` padding

**Typography:**
- Font stack: `Geist`, `Satoshi`, or `Cabinet Grotesk` only
- Header tracking: `tracking-tight`
- Never Inter in a Bento context

**Double-Bezel structure for premium cards:**
- Outer shell: `bg-black/5 ring-1 ring-black/5 p-1.5 rounded-[2rem]`
- Inner core: own background + `shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)]` + `rounded-[calc(2rem-0.375rem)]`

---

## Animation Engine Specs

All cards MUST contain **Perpetual Micro-Interactions**. The dashboard must always feel alive.

**Spring Physics (no linear easing):**
```js
// Use for all interactive elements
{ type: "spring", stiffness: 100, damping: 20 }
```

**Layout Transitions:**
- Use Framer Motion `layout` and `layoutId` props for smooth reordering, resizing, and shared element transitions

**Infinite Loops:**
- Every card has an active state that loops infinitely: Pulse, Typewriter, Float, or Carousel

**Performance isolation (critical):**
- Every perpetual animation MUST be wrapped in `React.memo`
- Extract each animated card as its own isolated leaf `'use client'` component
- Never trigger re-renders in the parent layout

**AnimatePresence:**
- Wrap all dynamic lists — enables proper enter/exit animations

---

## Grid Structure

Typical layout: Row 1 = 3 columns | Row 2 = 2 columns (70/30 split)

```jsx
<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
  {/* Row 1: 3 equal cards */}
  <IntelligentListCard />
  <CommandInputCard />
  <LiveStatusCard />
</div>
<div className="grid grid-cols-1 md:grid-cols-[70%_30%] gap-6 mt-6">
  {/* Row 2: wide data stream + contextual UI */}
  <WideDataStreamCard />
  <ContextualUICard />
</div>
```

Mobile: all cards collapse to `grid-cols-1` with `gap-6`. No horizontal overflow.

---

## The 5 Card Archetypes

### 1. Intelligent List
A vertical stack of items with an infinite auto-sorting loop.

- Items swap positions using `layoutId` — simulates AI prioritizing tasks in real-time
- Smooth position swaps on a ~3s interval
- Spring-based position transitions for a weighted, physical feel
- Use case: task lists, priority queues, leaderboards

### 2. Command Input
A search/AI bar with a multi-step Typewriter Effect.

- Cycles through 3-5 complex prompts
- Blinking cursor between prompts
- "Processing" state: shimmering loading gradient on the input
- On "completion": brief checkmark animation before next cycle
- Use case: AI search demos, command palette teasers

### 3. Live Status
A scheduling or status interface with breathing indicators.

- Status dots with infinite `scale` pulse animation (`1.0 → 1.2 → 1.0`, 2s loop)
- Pop-up notification badge with overshoot spring: appears, stays 3s, vanishes
- Badge entrance: `scale: [0, 1.2, 1]` with overshoot spring physics
- Use case: scheduling UIs, monitoring dashboards, live feed indicators

### 4. Wide Data Stream
A horizontal infinite carousel of data cards or metrics.

- Seamless loop using `x: ["0%", "-50%"]` with duplicate items for continuity
- Speed feels effortless — not urgent, not slow (~20-30s per full cycle)
- Cards show metrics, user avatars, status chips, mini sparklines
- Use case: social proof logos, metric streams, activity feeds

### 5. Contextual UI (Focus Mode)
A document or content view that highlights and reveals tools.

- Staggered text block highlight animation (sequential word/line highlights, 300ms stagger)
- After highlight completes: float-in of a floating action toolbar
- Toolbar entrance: `y: [20, 0]` + `opacity: [0, 1]` with spring, staggered micro-icons
- Toolbar holds 3-5 action icons with individual hover states
- Use case: editor demos, AI annotation tools, document review flows

---

## Pre-Flight Checklist

Before shipping a Bento section:

- [ ] Global state used only to avoid deep prop-drilling, not arbitrarily
- [ ] Mobile layout collapses to single column with `w-full px-4`
- [ ] Full-height sections use `min-h-[100dvh]` not `h-screen`
- [ ] All `useEffect` animations have cleanup functions
- [ ] Empty, loading, and error states provided for each card
- [ ] Generic card borders replaced with spacing/dividers where appropriate
- [ ] Every perpetual animation isolated in its own memoized Client Component
- [ ] No `window.addEventListener('scroll')` — use `whileInView` or `IntersectionObserver`
- [ ] No arbitrary z-index values
- [ ] `backdrop-blur` only on fixed/sticky elements, never scrolling cards
