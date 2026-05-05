# Premium Design Patterns: Creative Arsenal

Pull from this library to avoid defaulting to generic UI. These patterns make interfaces visually striking and memorable.

> Framework note: Examples mention Framer Motion as an option for JS-driven patterns. GSAP/ThreeJS are alternatives for scroll storytelling. Never mix both in the same component tree.

---

## Vibe Archetypes (Pick One Before Designing)

Before writing code, commit to a vibe:

1. **Ethereal Glass** (SaaS / AI / Tech) — Deep OLED black `#050505`, radial mesh gradient orbs in background, vantablack cards with heavy `backdrop-blur-2xl`, wide geometric Grotesk typography
2. **Editorial Luxury** (Lifestyle / Real Estate / Agency) — Warm creams `#FDFBF7`, muted sage, or deep espresso. Variable serif for massive headings, subtle CSS noise/film-grain overlay for a physical paper feel
3. **Soft Structuralism** (Consumer / Health / Portfolio) — Silver-grey or pure white background, massive bold Grotesk, airy floating components with highly diffused ambient shadows

---

## Navigation

- **Mac Dock Magnification** — Nav icons scale fluidly on hover with spring physics
- **Magnetic Button** — Buttons physically pull toward the cursor using `useMotionValue` + `useTransform`
- **Gooey Menu** — Sub-items detach from main button like viscous liquid
- **Dynamic Island** — Pill-shaped component that morphs to show status/alerts
- **Fluid Island Nav** — Floating glass pill detached from top (`mt-6`, `mx-auto`, `rounded-full`). On mobile: hamburger lines fluidly rotate to form an X
- **Contextual Radial Menu** — Circular menu expanding at click coordinates
- **Mega Menu Reveal** — Full-screen dropdowns that stagger-fade complex content
- **Floating Speed Dial** — FAB that springs into a curved line of secondary actions

## Layout and Grids

- **Asymmetrical Bento** — Masonry-like CSS Grid with varying card sizes (`col-span-8 row-span-2` next to stacked `col-span-4` cards). Falls back to `grid-cols-1` on mobile
- **Z-Axis Cascade** — Elements stacked like physical cards with slight overlap and varying depths. Remove rotations below 768px
- **Editorial Split** — Massive typography on left half, scrollable image pills or staggered cards on right
- **Split Screen Scroll** — Two halves of the screen sliding in opposite directions on scroll
- **Curtain Reveal** — Hero section parting in the middle like a curtain on scroll
- **Masonry Layout** — Staggered grid without fixed row heights (Pinterest-style)
- **Chroma Grid** — Grid borders or tiles with subtle, continuously animating color gradients

## Cards and Containers

- **Double-Bezel (Doppelrand)** — Cards that look like machined hardware: outer shell (`bg-black/5`, `ring-1 ring-black/5`, `p-1.5`, `rounded-[2rem]`) wrapping an inner core with its own highlight and concentric radius (`rounded-[calc(2rem-0.375rem)]`)
- **Parallax Tilt Card** — 3D-tilting card tracking mouse coordinates
- **Spotlight Border Card** — Card borders that illuminate dynamically under the cursor
- **Glassmorphism Panel** — True frosted glass: `backdrop-blur` + 1px inner border (`border-white/10`) + inner shadow (`shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]`) to simulate edge refraction
- **Holographic Foil Card** — Iridescent rainbow reflections shifting on hover
- **Tinder Swipe Stack** — Physical stack of cards the user can swipe away
- **Morphing Modal** — Button that seamlessly expands into a full-screen dialog

## Scroll Animations

- **Sticky Scroll Stack** — Cards that stick to top and physically stack over each other during scroll
- **Horizontal Scroll Hijack** — Vertical scroll translates into smooth horizontal gallery pan
- **Zoom Parallax** — Central background image zooming in/out seamlessly as you scroll
- **Scroll Progress Path** — SVG lines that draw themselves as user scrolls
- **Staggered Entry** — Elements cascade in with slight delays, Y-translation + opacity fade. Use `staggerChildren` in Framer Motion or CSS `animation-delay: calc(var(--index) * 100ms)`. Never mount everything at once

## Galleries and Media

- **Coverflow Carousel** — 3D carousel with center focused, edges angled back
- **Drag-to-Pan Grid** — Boundless grid freely draggable in any direction
- **Accordion Image Slider** — Narrow strips that expand fully on hover
- **Hover Image Trail** — Mouse leaves a trail of popping/fading images
- **Glitch Effect Image** — Brief RGB-channel shift digital distortion on hover
- **Dome Gallery** — 3D gallery with panoramic dome feel

## Typography and Text

- **Kinetic Marquee** — Endless text bands that reverse direction or speed up on scroll
- **Text Mask Reveal** — Massive typography as a transparent window to video background
- **Text Scramble Effect** — Matrix-style character decoding on load or hover
- **Variable Font Animation** — Interpolate weight/width on scroll or hover for text that feels alive
- **Outlined-to-Fill Transition** — Text starts as stroke outline, fills with color on scroll entry
- **Circular Text Path** — Text curved along a spinning circular path
- **Kinetic Typography Grid** — Grid of letters that dodge or rotate away from cursor

## Micro-Interactions

- **Button-in-Button Trailing Icon** — Arrow icon nested inside its own circular wrapper (`w-8 h-8 rounded-full bg-black/5`) flush with button's inner right padding. Never a naked icon next to text
- **Particle Explosion Button** — CTAs shatter into particles on success
- **Directional Hover-Aware Button** — Hover fill enters from the exact side the mouse came from
- **Ripple Click Effect** — Visual waves rippling precisely from click coordinates
- **Skeleton Shimmer** — Shifting light reflections across placeholder boxes. Match layout shape exactly
- **Tactile Press Feedback** — On `:active`, use `scale(0.98)` or `translateY(1px)` to simulate physical push
- **Eyebrow Tags** — Microscopic pill badge before major headings (`rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.2em]`)

## Surfaces and Effects

- **Grain/Noise Overlay** — Fixed `pointer-events-none` pseudo-element at `z-50`. Never on scrolling containers
- **Colored Tinted Shadows** — Shadows carry background hue instead of generic black
- **Mesh Gradient Background** — Organic, lava-lamp-like animated color blobs
- **Lens Blur Depth** — Dynamic focus blurring background layers to highlight foreground action
- **Animated SVG Line Drawing** — Vectors draw their own contours in real-time
