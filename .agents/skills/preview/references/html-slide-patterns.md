# Slide Deck Patterns

CSS patterns, JS engine, slide type layouts, transitions, navigation chrome, and curated presets for self-contained HTML slide presentations. All slides are viewport-fit (100dvh), single-file, same philosophy as scrollable pages.

**When to use slides:** Only when the user explicitly requests them — `--slides` flag on an existing prompt, or natural language like "as a slide deck." Never auto-select slide format.

**Before generating**, also read `./html-css-patterns.md` for shared patterns (Mermaid zoom controls, overflow protection, depth tiers, status badges) and `./html-libraries.md` for Mermaid theming, Chart.js, and font pairings. Those patterns apply to slides too — this file adds slide-specific patterns on top.

For presentation-grade output, consider invoking `/ck:ui-ux-pro-max` for richer style selection and distinctive font/palette pairing.

---

## Planning a Deck from a Source Document

When converting a plan, spec, review, or any structured document into slides, follow this process before writing any HTML. Skipping it leads to polished-looking decks that silently drop 30–40% of the source material.

**Step 1 — Inventory the source.** Read the entire source document and enumerate every section, subsection, card, table row, decision, specification, collapsible detail, and footnote. Count them. A plan with 7 sections, 6 decision cards, a 7-row file table, 4 presets, 6 technique guides, and an engine spec with 3 sub-specs and 2 collapsibles is ~25 distinct content items that all need slide real estate.

**Step 2 — Map source to slides.** Assign each inventory item to one or more slides. Every item must appear somewhere. Rules:
- If a section has 6 decisions, all 6 need slides — not the 2 that fit on one split slide.
- If a table has 7 rows, all 7 rows show up.
- Collapsible/expandable details in the source are not optional in the deck — they become their own slides.
- Subsections with multiple cards may need 2–3 slides to cover at readable density.
- Each plan section typically needs a divider slide + 1–3 content slides depending on density.

**Step 3 — Choose layouts.** For each planned slide, pick a slide type and spatial composition. Vary across the sequence (see Compositional Variety below). This is where narrative pacing happens — alternate dense slides with sparse ones.

**Step 4 — Plan images.** If `/ck:ai-multimodal` skill is available and image generation is appropriate, plan 2–4 images for the deck minimum. Target the **title slide** (16:9 background that sets the visual tone) and **one full-bleed slide** (immersive background for a key moment). Content slides with conceptual topics also benefit from a 1:1 illustration in the aside area. Generate these images early — before writing HTML — so you can embed them as base64 data URIs. See the Proactive Imagery section below. If image generation isn't available, degrade to CSS gradients and SVG decorations.

**Step 5 — Verify before writing HTML.** Scan the inventory from Step 1. Is anything unmapped? Would a reader of the source document notice something missing from the deck? If yes, add slides. A source document with 7 sections typically produces 18–25 slides, not 10–13.

**The test:** After generating the deck, a reader who has never seen the source document should be able to reconstruct every major point from the slides alone. If they'd miss entire sections, the deck is incomplete.

---

## Slide Engine Base

The deck is a scroll-snap container. Each slide is exactly one viewport tall.

```html
<body>
<div class="deck">
  <section class="slide slide--title"> ... </section>
  <section class="slide slide--content"> ... </section>
  <section class="slide slide--diagram"> ... </section>
  <!-- one <section> per slide -->
</div>
</body>
```

```css
/* Scroll-snap container */
.deck {
  height: 100dvh;
  overflow-y: auto;
  scroll-snap-type: y mandatory;
  scroll-behavior: smooth;
  -webkit-overflow-scrolling: touch;
}

/* Individual slide */
.slide {
  height: 100dvh;
  scroll-snap-align: start;
  overflow: hidden;
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: clamp(40px, 6vh, 80px) clamp(40px, 8vw, 120px);
  isolation: isolate; /* contain z-index stacking */
}
```

---

## Typography Scale

Slide typography is 2–3× larger than scrollable pages. Page-sized text on a viewport-sized canvas looks like a mistake.

```css
.slide__display {
  font-size: clamp(48px, 10vw, 120px);
  font-weight: 800;
  letter-spacing: -3px;
  line-height: 0.95;
  text-wrap: balance;
}

.slide__heading {
  font-size: clamp(28px, 5vw, 48px);
  font-weight: 700;
  letter-spacing: -1px;
  line-height: 1.1;
  text-wrap: balance;
}

.slide__body {
  font-size: clamp(16px, 2.2vw, 24px);
  line-height: 1.6;
  text-wrap: pretty;
}

.slide__label {
  font-family: var(--font-mono);
  font-size: clamp(10px, 1.2vw, 14px);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  color: var(--text-dim);
}

.slide__subtitle {
  font-family: var(--font-mono);
  font-size: clamp(14px, 1.8vw, 20px);
  color: var(--text-dim);
  letter-spacing: 0.5px;
}
```

| Element | Size range | Notes |
|---------|-----------|-------|
| Display (title slides) | 48–120px | `10vw` preferred, weight 800 |
| Section numbers | 100–240px | Ultra-light (weight 200), decorative |
| Headings | 28–48px | `5vw` preferred, weight 700 |
| Body / bullets | 16–24px | `2.2vw` preferred, 1.6 line-height |
| Code blocks | 14–18px | `1.8vw` preferred, mono |
| Quotes | 24–48px | `4vw` preferred, serif italic |
| Labels / captions | 10–14px | Mono, uppercase, dimmed |

---

## Cinematic Transitions

IntersectionObserver adds `.visible` when a slide enters the viewport. Slides animate in once and stay visible when scrolling back.

```css
/* Slide entrance — fade + lift + subtle scale */
.slide {
  opacity: 0;
  transform: translateY(40px) scale(0.98);
  transition:
    opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1),
    transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}

.slide.visible {
  opacity: 1;
  transform: none;
}

/* Staggered child reveals — add .reveal to each content element */
.slide .reveal {
  opacity: 0;
  transform: translateY(20px);
  transition:
    opacity 0.5s cubic-bezier(0.16, 1, 0.3, 1),
    transform 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}

.slide.visible .reveal {
  opacity: 1;
  transform: none;
}

/* Stagger delays — up to 6 children per slide */
.slide.visible .reveal:nth-child(1) { transition-delay: 0.1s; }
.slide.visible .reveal:nth-child(2) { transition-delay: 0.2s; }
.slide.visible .reveal:nth-child(3) { transition-delay: 0.3s; }
.slide.visible .reveal:nth-child(4) { transition-delay: 0.4s; }
.slide.visible .reveal:nth-child(5) { transition-delay: 0.5s; }
.slide.visible .reveal:nth-child(6) { transition-delay: 0.6s; }

@media (prefers-reduced-motion: reduce) {
  .slide,
  .slide .reveal {
    opacity: 1 !important;
    transform: none !important;
    transition: none !important;
  }
}
```

---

## Navigation Chrome

All navigation is `position: fixed` with high z-index, layered above slides.

### Progress Bar

```css
.deck-progress {
  position: fixed;
  top: 0;
  left: 0;
  height: 3px;
  background: var(--accent);
  z-index: 100;
  transition: width 0.3s ease;
  pointer-events: none;
}
```

### Nav Dots

```css
.deck-dots {
  position: fixed;
  right: clamp(12px, 2vw, 24px);
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  gap: 8px;
  z-index: 100;
}

.deck-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--text-dim);
  opacity: 0.3;
  border: none;
  padding: 0;
  cursor: pointer;
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.deck-dot:hover { opacity: 0.6; }

.deck-dot.active {
  opacity: 1;
  transform: scale(1.5);
  background: var(--accent);
}
```

### Slide Counter

```css
.deck-counter {
  position: fixed;
  bottom: clamp(12px, 2vh, 24px);
  right: clamp(12px, 2vw, 24px);
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--text-dim);
  z-index: 100;
  font-variant-numeric: tabular-nums;
}
```

### Keyboard Hints

Auto-fade after first interaction or after 4 seconds.

```css
.deck-hints {
  position: fixed;
  bottom: clamp(12px, 2vh, 24px);
  left: 50%;
  transform: translateX(-50%);
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--text-dim);
  opacity: 0.6;
  z-index: 100;
  transition: opacity 0.5s ease;
  white-space: nowrap;
}

.deck-hints.faded {
  opacity: 0;
  pointer-events: none;
}
```

### Chrome Visibility on Mixed Backgrounds

For decks where some slides are light and some dark:

```css
/* Approach A: subtle backdrop on chrome elements */
.deck-dots,
.deck-counter {
  background: color-mix(in srgb, var(--bg) 70%, transparent 30%);
  padding: 6px;
  border-radius: 20px;
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
}

/* Approach B: text shadow for legibility on any background */
.deck-counter,
.deck-hints {
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
}
```

---

## SlideEngine JavaScript

Add once at the end of the page. Handles navigation, chrome updates, and scroll-triggered reveals. Event delegation ensures slide-internal interactions (Mermaid zoom, scrollable code, overflow tables) don't trigger slide navigation.

```javascript
class SlideEngine {
  constructor() {
    this.deck = document.querySelector('.deck');
    this.slides = [...document.querySelectorAll('.slide')];
    this.current = 0;
    this.total = this.slides.length;
    this.buildChrome();
    this.bindEvents();
    this.observe();
    this.update();
  }

  buildChrome() {
    var bar = document.createElement('div');
    bar.className = 'deck-progress';
    document.body.appendChild(bar);
    this.bar = bar;

    var dots = document.createElement('div');
    dots.className = 'deck-dots';
    var self = this;
    this.slides.forEach(function(_, i) {
      var d = document.createElement('button');
      d.className = 'deck-dot';
      d.title = 'Slide ' + (i + 1);
      d.onclick = function() { self.goTo(i); };
      dots.appendChild(d);
    });
    document.body.appendChild(dots);
    this.dots = [].slice.call(dots.children);

    var ctr = document.createElement('div');
    ctr.className = 'deck-counter';
    document.body.appendChild(ctr);
    this.counter = ctr;

    var hints = document.createElement('div');
    hints.className = 'deck-hints';
    hints.textContent = '\u2190 \u2192 or scroll to navigate';
    document.body.appendChild(hints);
    this.hints = hints;
    this.hintTimer = setTimeout(function() {
      hints.classList.add('faded');
    }, 4000);
  }

  bindEvents() {
    var self = this;
    // Keyboard — skip if focus is inside interactive content
    document.addEventListener('keydown', function(e) {
      if (e.target.closest('.mermaid-wrap, .table-scroll, .code-scroll, input, textarea, [contenteditable]')) return;
      if (['ArrowDown', 'ArrowRight', ' ', 'PageDown'].includes(e.key)) {
        e.preventDefault(); self.next();
      } else if (['ArrowUp', 'ArrowLeft', 'PageUp'].includes(e.key)) {
        e.preventDefault(); self.prev();
      } else if (e.key === 'Home') {
        e.preventDefault(); self.goTo(0);
      } else if (e.key === 'End') {
        e.preventDefault(); self.goTo(self.total - 1);
      }
      self.fadeHints();
    });

    // Touch swipe
    var touchY;
    this.deck.addEventListener('touchstart', function(e) {
      touchY = e.touches[0].clientY;
    }, { passive: true });
    this.deck.addEventListener('touchend', function(e) {
      var dy = touchY - e.changedTouches[0].clientY;
      if (Math.abs(dy) > 50) { dy > 0 ? self.next() : self.prev(); }
    });
  }

  observe() {
    var self = this;
    var obs = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          self.current = self.slides.indexOf(entry.target);
          self.update();
        }
      });
    }, { threshold: 0.5 });
    this.slides.forEach(function(s) { obs.observe(s); });
  }

  goTo(i) {
    this.slides[Math.max(0, Math.min(i, this.total - 1))]
      .scrollIntoView({ behavior: 'smooth' });
  }

  next() { if (this.current < this.total - 1) this.goTo(this.current + 1); }
  prev() { if (this.current > 0) this.goTo(this.current - 1); }

  update() {
    this.bar.style.width = ((this.current + 1) / this.total * 100) + '%';
    var self = this;
    this.dots.forEach(function(d, i) { d.classList.toggle('active', i === self.current); });
    this.counter.textContent = (this.current + 1) + ' / ' + this.total;
  }

  fadeHints() {
    clearTimeout(this.hintTimer);
    this.hints.classList.add('faded');
  }
}
```

**Usage:** Instantiate after the DOM is ready and any libraries (Mermaid, Chart.js) have rendered. Always call `autoFit()` before `new SlideEngine()`.

```html
<script>
  document.addEventListener('DOMContentLoaded', function() {
    autoFit();
    new SlideEngine();
  });
</script>
```

---

## Auto-Fit

A single post-render function that handles all known content overflow cases. Call it after Mermaid/Chart.js render but before SlideEngine init.

```javascript
function autoFit() {
  // Mermaid SVGs: fill container instead of rendering at intrinsic size
  document.querySelectorAll('.mermaid svg').forEach(function(svg) {
    svg.removeAttribute('height');
    svg.style.width = '100%';
    svg.style.maxWidth = '100%';
    svg.style.height = 'auto';
    svg.parentElement.style.width = '100%';
  });

  // KPI values: visually scale down text that overflows card width
  document.querySelectorAll('.slide__kpi-val').forEach(function(el) {
    if (el.scrollWidth > el.clientWidth) {
      var s = el.clientWidth / el.scrollWidth;
      el.style.transform = 'scale(' + s + ')';
      el.style.transformOrigin = 'left top';
    }
  });

  // Blockquotes: reduce font proportionally for long text
  document.querySelectorAll('.slide--quote blockquote').forEach(function(el) {
    var len = el.textContent.trim().length;
    if (len > 100) {
      var scale = Math.max(0.5, 100 / len);
      var fs = parseFloat(getComputedStyle(el).fontSize);
      el.style.fontSize = Math.max(16, Math.round(fs * scale)) + 'px';
    }
  });
}
```

Three cases:
- **Mermaid:** SVGs render with fixed dimensions — force them to fill available width.
- **KPI values:** Long text strings at hero scale overflow card boundaries — `transform: scale()` shrinks visually without reflow.
- **Blockquotes:** Quotes longer than ~100 characters get proportionally smaller font.

---

## Slide Type Layouts

Each type has a defined HTML structure and CSS layout. Adapt colors, fonts, and spacing per aesthetic, but keep structural patterns consistent.

### Title Slide

Full-viewport hero. Background treatment via gradient, texture, or AI-generated image. 80–120px display type.

```html
<section class="slide slide--title">
  <svg class="slide__decor" ...><!-- optional decorative accent --></svg>
  <div class="slide__content reveal">
    <h1 class="slide__display">Deck Title</h1>
    <p class="slide__subtitle reveal">Subtitle or date</p>
  </div>
</section>
```

```css
.slide--title {
  justify-content: center;
  align-items: center;
  text-align: center;
}
```

### Section Divider

Oversized decorative number (200px+, ultra-light weight) with heading. Breathing room between topics.

```html
<section class="slide slide--divider">
  <span class="slide__number">02</span>
  <div class="slide__content">
    <h2 class="slide__heading reveal">Section Title</h2>
    <p class="slide__subtitle reveal">Optional subheading</p>
  </div>
</section>
```

```css
.slide--divider {
  justify-content: center;
}

.slide--divider .slide__number {
  font-size: clamp(100px, 22vw, 260px);
  font-weight: 200;
  line-height: 0.85;
  opacity: 0.08;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -55%);
  pointer-events: none;
  font-variant-numeric: tabular-nums;
}
```

### Content Slide

Heading + bullets or paragraphs. Asymmetric layout — content offset to one side. Max 5–6 bullets (2 lines each).

```html
<section class="slide slide--content">
  <div class="slide__inner">
    <div class="slide__text">
      <h2 class="slide__heading reveal">Heading</h2>
      <ul class="slide__bullets">
        <li class="reveal">First point</li>
        <li class="reveal">Second point</li>
      </ul>
    </div>
    <div class="slide__aside reveal">
      <!-- optional: illustration, icon, mini-diagram, accent SVG -->
    </div>
  </div>
</section>
```

```css
.slide--content .slide__inner {
  display: grid;
  grid-template-columns: 3fr 2fr;
  gap: clamp(24px, 4vw, 60px);
  align-items: center;
  width: 100%;
}

/* For right-heavy variant: swap to 2fr 3fr */
.slide--content .slide__bullets {
  list-style: none;
  padding: 0;
}

.slide--content .slide__bullets li {
  padding: 8px 0 8px 20px;
  position: relative;
  font-size: clamp(16px, 2vw, 22px);
  line-height: 1.6;
  color: var(--text-dim);
}

.slide--content .slide__bullets li::before {
  content: '';
  position: absolute;
  left: 0;
  top: 18px;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--accent);
}
```

### Split Slide

Asymmetric two-panel (60/40 or 70/30). Before/after, text+diagram, text+image. Zero padding on the slide — panels fill edge to edge.

```html
<section class="slide slide--split">
  <div class="slide__panels">
    <div class="slide__panel slide__panel--primary">
      <h2 class="slide__heading reveal">Left Panel</h2>
      <div class="slide__body reveal">Content...</div>
    </div>
    <div class="slide__panel slide__panel--secondary">
      <!-- diagram, image, code block, or contrasting content -->
    </div>
  </div>
</section>
```

```css
.slide--split {
  padding: 0;
}

.slide--split .slide__panels {
  display: grid;
  grid-template-columns: 3fr 2fr;
  height: 100%;
}

.slide--split .slide__panel {
  padding: clamp(40px, 6vh, 80px) clamp(32px, 4vw, 60px);
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.slide--split .slide__panel--primary {
  background: var(--surface);
}

.slide--split .slide__panel--secondary {
  background: var(--surface2);
}
```

### Diagram Slide

Full-viewport Mermaid diagram. Max 8–10 nodes (presentation scale — fewer, larger than page diagrams). Zoom controls from `html-css-patterns.md` apply here.

**When to use Mermaid vs CSS in slides:**
- **Use Mermaid** for complex graphs: 8+ nodes, branching paths, cycles, multiple edge crossings.
- **Use CSS Pipeline** (below) for simple linear flows: A → B → C → D sequences. CSS cards give full control over sizing and fill the viewport naturally.
- **Never leave a small Mermaid diagram alone on a slide.** If the diagram is small, either switch to CSS, or pair it with supporting content in a split layout.

```html
<section class="slide slide--diagram">
  <h2 class="slide__heading reveal">Diagram Title</h2>
  <div class="mermaid-wrap reveal" style="flex:1; min-height:0;">
    <div class="zoom-controls">
      <button onclick="zoomDiagram(this,1.2)" title="Zoom in">+</button>
      <button onclick="zoomDiagram(this,0.8)" title="Zoom out">&minus;</button>
      <button onclick="resetZoom(this)" title="Reset">&#8634;</button>
      <button onclick="openDiagramFullscreen(this)" title="Open full size in new tab">&#x26F6;</button>
    </div>
    <pre class="mermaid">
      graph TD
        A --> B
    </pre>
  </div>
</section>
```

```css
.slide--diagram {
  padding: clamp(24px, 4vh, 48px) clamp(24px, 4vw, 60px);
}

.slide--diagram .slide__heading {
  margin-bottom: clamp(8px, 1.5vh, 20px);
}

.slide--diagram .mermaid-wrap {
  border-radius: 12px;
  overflow: auto;
  display: flex;
  align-items: center;
  justify-content: center;
}

.slide--diagram .mermaid-wrap .mermaid {
  transform-origin: center center;
}

/* Auto-fit SVG to container */
.slide--diagram .mermaid svg {
  width: 100% !important;
  height: auto !important;
  max-width: 100% !important;
}

/* Mermaid overrides for presentation scale */
.slide--diagram .mermaid .nodeLabel {
  font-size: 18px !important;
}

.slide--diagram .mermaid .edgeLabel {
  font-size: 14px !important;
}

.slide--diagram .mermaid .node rect,
.slide--diagram .mermaid .node circle,
.slide--diagram .mermaid .node polygon {
  stroke-width: 2px;
}

.slide--diagram .mermaid .edge-pattern-solid {
  stroke-width: 2px;
}
```

### CSS Pipeline Slide

For simple linear flows (build steps, deployment stages, data pipelines) where Mermaid would render too small. CSS cards with arrow connectors give full control over sizing and fill the viewport naturally.

```html
<section class="slide" style="background-image:radial-gradient(...);">
  <p class="slide__label reveal">Pipeline Label</p>
  <h2 class="slide__heading reveal">Pipeline Title</h2>
  <div class="pipeline reveal">
    <div class="pipeline__step" style="border-top-color:var(--accent);">
      <div class="pipeline__num">01</div>
      <div class="pipeline__name">Step Name</div>
      <div class="pipeline__desc">What this step produces or does</div>
      <div class="pipeline__file">output-file.md</div>
    </div>
    <div class="pipeline__arrow">
      <svg viewBox="0 0 24 24" width="20" height="20"><path d="M5 12h14m-4-4l4 4-4 4" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
    </div>
    <div class="pipeline__step"> ... </div>
    <!-- repeat step + arrow pairs -->
  </div>
</section>
```

```css
.pipeline {
  display: flex;
  align-items: stretch;
  gap: 0;
  flex: 1;
  min-height: 0;
  margin-top: clamp(12px, 2vh, 24px);
}

.pipeline__step {
  flex: 1;
  background: var(--surface);
  border: 1px solid var(--border);
  border-top: 3px solid var(--accent);
  border-radius: 10px;
  padding: clamp(14px, 2.5vh, 28px) clamp(12px, 1.5vw, 22px);
  display: flex;
  flex-direction: column;
  min-width: 0;
  overflow-wrap: break-word;
}

.pipeline__num {
  font-size: clamp(10px, 1.2vw, 13px);
  font-weight: 600;
  color: var(--accent);
  letter-spacing: 1px;
}

.pipeline__name {
  font-size: clamp(16px, 2vw, 24px);
  font-weight: 700;
  margin: clamp(4px, 0.8vh, 8px) 0;
}

.pipeline__desc {
  font-size: clamp(12px, 1.3vw, 16px);
  color: var(--text-dim);
  line-height: 1.5;
  flex: 1;
}

.pipeline__file {
  font-size: clamp(10px, 1.1vw, 12px);
  color: var(--accent);
  background: var(--accent-dim);
  padding: 3px 8px;
  border-radius: 4px;
  margin-top: clamp(8px, 1.5vh, 16px);
  align-self: flex-start;
}

.pipeline__arrow {
  display: flex;
  align-items: center;
  padding: 0 clamp(3px, 0.4vw, 6px);
  color: var(--accent);
  flex-shrink: 0;
  opacity: 0.4;
}

@media (max-width: 768px) {
  .pipeline { flex-direction: column; }
  .pipeline__arrow { justify-content: center; padding: 4px 0; transform: rotate(90deg); }
}
```

Max 5–6 steps — beyond that, split across two slides.

### Dashboard Slide

KPI cards at presentation scale (48–64px hero numbers). Mini-charts via Chart.js or SVG sparklines. Max 6 KPIs.

```html
<section class="slide slide--dashboard">
  <h2 class="slide__heading reveal">Metrics Overview</h2>
  <div class="slide__kpis">
    <div class="slide__kpi reveal">
      <div class="slide__kpi-val" style="color:var(--accent)">247</div>
      <div class="slide__kpi-label">Lines Added</div>
    </div>
  </div>
</section>
```

```css
.slide--dashboard .slide__kpis {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(clamp(140px, 20vw, 220px), 1fr));
  gap: clamp(12px, 2vw, 24px);
}

.slide__kpi {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: clamp(16px, 3vh, 32px) clamp(16px, 2vw, 24px);
  min-width: 0;
  overflow: hidden;
}

.slide__kpi-val {
  font-size: clamp(36px, 6vw, 64px);
  font-weight: 800;
  letter-spacing: -1.5px;
  line-height: 1.1;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.slide__kpi-label {
  font-family: var(--font-mono);
  font-size: clamp(9px, 1.2vw, 13px);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  color: var(--text-dim);
  margin-top: 8px;
}
```

**KPI hero values should be short** — numbers, percentages, 1–3 word labels. Ideal length is 1–6 characters. Longer strings break the layout at 64px — put them in the label instead. `autoFit()` will scale down overflows as a safety net.

### Table Slide

18–20px cell text for projection readability. Max 8 rows per slide — overflow paginates to the next slide.

```html
<section class="slide slide--table">
  <h2 class="slide__heading reveal">Data Title</h2>
  <div class="table-wrap reveal" style="flex:1; min-height:0;">
    <div class="table-scroll">
      <table class="data-table"> ... </table>
    </div>
  </div>
</section>
```

```css
.slide--table {
  padding: clamp(24px, 4vh, 48px) clamp(24px, 4vw, 60px);
}

.slide--table .data-table {
  font-size: clamp(14px, 1.8vw, 20px);
}

.slide--table .data-table th {
  font-size: clamp(10px, 1.3vw, 14px);
  padding: clamp(8px, 1.5vh, 14px) clamp(12px, 2vw, 20px);
}

.slide--table .data-table td {
  padding: clamp(10px, 1.5vh, 16px) clamp(12px, 2vw, 20px);
}
```

### Code Slide

18px mono on a recessed dark background. Max 10 lines. Floating filename label.

```html
<section class="slide slide--code">
  <h2 class="slide__heading reveal">What Changed</h2>
  <div class="slide__code-block reveal">
    <span class="slide__code-filename">worker.ts</span>
    <pre><code>function processQueue(items) {
  // highlighted code here
}</code></pre>
  </div>
</section>
```

```css
.slide--code {
  align-items: center;
}

.slide__code-block {
  background: var(--code-bg, #1a1a2e);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: clamp(24px, 4vh, 48px) clamp(24px, 4vw, 48px);
  max-width: 900px;
  width: 100%;
  position: relative;
}

.slide__code-filename {
  position: absolute;
  top: -12px;
  left: 24px;
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 600;
  padding: 4px 12px;
  border-radius: 4px;
  background: var(--accent);
  color: var(--bg);
}

.slide__code-block pre {
  margin: 0;
  overflow-x: auto;
}

.slide__code-block code {
  font-family: var(--font-mono);
  font-size: clamp(14px, 1.6vw, 18px);
  line-height: 1.7;
  color: var(--code-text, #e6edf3);
}
```

### Quote Slide

36–48px serif with dramatic line-height. Generous whitespace is the design.

```html
<section class="slide slide--quote">
  <div class="slide__quote-mark reveal">&ldquo;</div>
  <blockquote class="reveal">
    The best code is the code you don't have to write.
  </blockquote>
  <cite class="reveal">&mdash; Someone Wise</cite>
</section>
```

```css
.slide--quote {
  justify-content: center;
  align-items: center;
  text-align: center;
  padding: clamp(60px, 10vh, 120px) clamp(60px, 12vw, 200px);
}

.slide__quote-mark {
  font-size: clamp(80px, 14vw, 180px);
  line-height: 0.5;
  opacity: 0.08;
  font-family: Georgia, serif;
  pointer-events: none;
  margin-bottom: -20px;
}

.slide--quote blockquote {
  font-size: clamp(24px, 4vw, 48px);
  font-weight: 400;
  line-height: 1.35;
  font-style: italic;
  margin: 0;
}

.slide--quote cite {
  font-family: var(--font-mono);
  font-size: clamp(11px, 1.4vw, 14px);
  font-style: normal;
  margin-top: clamp(16px, 3vh, 32px);
  display: block;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  color: var(--text-dim);
}
```

### Full-Bleed Slide

Background image or CSS gradient dominates the viewport. Text overlay with gradient scrim ensuring contrast. Zero slide padding.

```html
<section class="slide slide--bleed">
  <div class="slide__bg" style="background-image:url('data:image/png;base64,...')"></div>
  <div class="slide__scrim"></div>
  <div class="slide__content">
    <h2 class="slide__heading reveal">Headline Over Image</h2>
    <p class="slide__subtitle reveal">Supporting text</p>
  </div>
</section>
```

```css
.slide--bleed {
  padding: 0;
  justify-content: flex-end;
  color: #ffffff;
}

.slide__bg {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center;
  z-index: 0;
}

.slide__scrim {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.7) 0%, rgba(0, 0, 0, 0.1) 50%, transparent 100%);
  z-index: 1;
}

.slide--bleed .slide__content {
  position: relative;
  z-index: 2;
  padding: clamp(40px, 6vh, 80px) clamp(40px, 8vw, 120px);
}

/* When no generated image, use a bold CSS gradient background */
.slide__bg--gradient {
  background: linear-gradient(135deg, var(--accent) 0%, color-mix(in srgb, var(--accent) 60%, var(--bg) 40%) 100%);
}
```

---

## Decorative SVG Elements

Inline SVG accents lift slides from functional to editorial. Use sparingly — one or two per slide, never on every slide.

### Corner Accent

```html
<svg class="slide__decor slide__decor--corner" width="120" height="120" viewBox="0 0 120 120">
  <line x1="120" y1="0" x2="120" y2="40" stroke="var(--accent)" stroke-width="2" opacity="0.2"/>
  <line x1="80" y1="0" x2="120" y2="0" stroke="var(--accent)" stroke-width="2" opacity="0.2"/>
</svg>
```

```css
.slide__decor {
  position: absolute;
  pointer-events: none;
  z-index: 0;
}

.slide__decor--corner {
  top: 0;
  right: 0;
}
```

### Section Divider Mark

```html
<svg class="slide__decor slide__decor--divider" width="200" height="20" viewBox="0 0 200 20">
  <line x1="0" y1="10" x2="85" y2="10" stroke="var(--accent)" stroke-width="1" opacity="0.3"/>
  <rect x="92" y="3" width="14" height="14" transform="rotate(45 99 10)" fill="none" stroke="var(--accent)" stroke-width="1" opacity="0.3"/>
  <line x1="115" y1="10" x2="200" y2="10" stroke="var(--accent)" stroke-width="1" opacity="0.3"/>
</svg>
```

### Geometric Background Pattern

```css
/* Faint grid dots behind a slide */
.slide--with-grid::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image: radial-gradient(circle, var(--border) 1px, transparent 1px);
  background-size: 32px 32px;
  opacity: 0.5;
  pointer-events: none;
  z-index: 0;
}
```

### Per-Slide Background Variation

Vary gradient direction across slides to create visual rhythm.

```css
.slide:nth-child(odd) {
  background-image: radial-gradient(ellipse at 20% 80%, var(--accent-dim) 0%, transparent 50%);
}

.slide:nth-child(even) {
  background-image: radial-gradient(ellipse at 80% 20%, var(--accent-dim) 0%, transparent 50%);
}
```

---

## Proactive Imagery

Slides should reach for visuals before defaulting to text alone.

**AI image generation:** If `/ck:ai-multimodal` skill is available, use it to generate images for the deck. For any deck over 10 slides, target a minimum of 2–4 images. Priority order:

1. **Title slide** (always): background image that sets the deck's visual tone. Use 16:9 aspect ratio. Match the topic and palette.
2. **Full-bleed slide** (always if deck has one): immersive background for the deck's visual anchor moment.
3. **Content slides with conceptual topics** (1–2 if the deck has room): illustration in the `.slide__aside` area. Use 1:1 aspect ratio.

**Generate images before writing HTML** so they're ready to embed as base64 data URIs:

```bash
# Use /ck:ai-multimodal skill for image generation if needed
# Embed result as: <div class="slide__bg" style="background-image:url('data:image/png;base64,...')"></div>
```

**Prompt craft for slides:** Be specific about style, dominant colors, and mood. Pull colors from the preset's CSS variables. Examples:
- Terminal Mono: "dark abstract circuit board pattern, green traces on near-black, minimal, technical"
- Midnight Editorial: "deep navy abstract composition, warm gold accent light, cinematic depth of field"
- Warm Signal: "warm cream textured paper with terracotta geometric accents, confident modern design"

**When image generation isn't available:** Degrade gracefully to CSS gradients and SVG decorations. Use the `.slide__bg--gradient` pattern with bold `linear-gradient` or `radial-gradient` backgrounds. Note the fallback in an HTML comment (`<!-- image generation unavailable, using CSS gradient fallback -->`).

**Inline data visualizations:** Proactively add SVG sparklines next to numbers, mini-charts on dashboard slides, and small Mermaid diagrams on split slides. A number with a sparkline next to it tells a better story than a number alone.

---

## Compositional Variety

Consecutive slides must vary their spatial approach. Three centered slides in a row means push one off-axis.

**Composition patterns to alternate between:**
- Centered (title slides, quotes)
- Left-heavy: content on the left 60%, breathing room on the right
- Right-heavy: content on the right 60%, visual or whitespace on the left
- Edge-aligned: content pushed to bottom or top, large empty space opposite
- Split: two distinct panels filling the viewport
- Full-bleed: background dominates, minimal overlaid text

Plan the slide sequence considering layout rhythm, not just content order. Assign a composition to each slide before writing HTML.

---

## Presentation Readability

Slides get projected, screen-shared, viewed at distance:

- **Minimum body text: 16px.** Nothing smaller except labels and captions.
- **One focal point per slide.** Not three competing elements.
- **Higher contrast than pages.** Dimmed text (`--text-dim`) should still be easily readable at distance.
- **Nav chrome opacity.** Dots and progress bar must be visible on any slide background. Use the backdrop blur or text-shadow approach from the Nav Chrome section.
- **Simpler Mermaid diagrams.** Max 8–10 nodes, 18px+ labels, 2px+ edges.

---

## Content Density Limits

Each slide must fit in exactly 100dvh. If content exceeds these limits, split across multiple slides — never scroll within a slide.

| Slide type | Max content |
|-----------|-------------|
| Title | 1 heading + 1 subtitle |
| Section Divider | 1 number + 1 heading + optional subhead |
| Content | 1 heading + 5–6 bullets (max 2 lines each) |
| Split | 1 heading + 2 panels, each follows its inner type's limits |
| Diagram | 1 heading + 1 Mermaid diagram (max 8–10 nodes) |
| Dashboard | 1 heading + 6 KPI cards. Hero values ≤6 chars. |
| Table | 1 heading + 8 rows; overflow paginates to next slide |
| Code | 1 heading + 10 lines of code |
| Quote | 1 short quote (~25 words / ~150 chars max) + 1 attribution |
| Full-Bleed | 1 heading + 1 subtitle over background |

---

## Responsive Height Breakpoints

Height-based scaling is more critical for slides than width.

```css
/* Compact viewports */
@media (max-height: 700px) {
  .slide {
    padding: clamp(24px, 4vh, 40px) clamp(32px, 6vw, 80px);
  }
  .slide__display { font-size: clamp(36px, 8vw, 72px); }
  .slide--divider .slide__number { font-size: clamp(80px, 16vw, 160px); }
}

/* Small tablets / landscape phones */
@media (max-height: 600px) {
  .slide__decor { display: none; }
  .slide--quote { padding: clamp(32px, 6vh, 60px) clamp(40px, 8vw, 100px); }
  .slide__quote-mark { display: none; }
}

/* Aggressive: landscape phones */
@media (max-height: 500px) {
  .slide {
    padding: clamp(16px, 3vh, 24px) clamp(24px, 5vw, 48px);
  }
  .deck-dots { display: none; }
  .slide__display { font-size: clamp(28px, 7vw, 48px); }
}

/* Width breakpoint for grids */
@media (max-width: 768px) {
  .slide--content .slide__inner { grid-template-columns: 1fr; }
  .slide--content .slide__aside { display: none; }
  .slide--split .slide__panels { grid-template-columns: 1fr; }
  .slide--dashboard .slide__kpis { grid-template-columns: repeat(2, 1fr); }
}
```

---

## Curated Presets

Starting points to riff on. Each defines a font pairing, palette, and background treatment. Different decks with the same preset should still feel distinct.

### Midnight Editorial

Deep navy, serif display, warm gold accents. Cinematic, premium. Dark-first.

```css
:root {
  --font-body: 'Instrument Serif', Georgia, serif;
  --font-mono: 'JetBrains Mono', 'SF Mono', monospace;
  --bg: #0f1729;
  --surface: #162040;
  --surface2: #1d2b52;
  --surface-elevated: #243362;
  --border: rgba(200, 180, 140, 0.08);
  --border-bright: rgba(200, 180, 140, 0.16);
  --text: #e8e4d8;
  --text-dim: #9a9484;
  --accent: #d4a73a;
  --accent-dim: rgba(212, 167, 58, 0.1);
  --code-bg: #0a0f1e;
  --code-text: #d4d0c4;
}
@media (prefers-color-scheme: light) {
  :root {
    --bg: #faf8f2;
    --surface: #ffffff;
    --surface2: #f5f0e6;
    --surface-elevated: #fffdf5;
    --border: rgba(30, 30, 50, 0.08);
    --border-bright: rgba(30, 30, 50, 0.16);
    --text: #1a1814;
    --text-dim: #7a7468;
    --accent: #b8860b;
    --accent-dim: rgba(184, 134, 11, 0.08);
    --code-bg: #2a2520;
    --code-text: #e8e4d8;
  }
}
```

Background: radial gold glow at top center. Decorative corner marks in gold.

### Warm Signal

Cream paper, bold sans, terracotta/coral accents. Confident and modern. Light-first.

```css
:root {
  --font-body: 'Plus Jakarta Sans', system-ui, sans-serif;
  --font-mono: 'Azeret Mono', 'SF Mono', monospace;
  --bg: #faf6f0;
  --surface: #ffffff;
  --surface2: #f5ece0;
  --surface-elevated: #fffdf5;
  --border: rgba(60, 40, 20, 0.08);
  --border-bright: rgba(60, 40, 20, 0.16);
  --text: #2c2a25;
  --text-dim: #7c756a;
  --accent: #c2410c;
  --accent-dim: rgba(194, 65, 12, 0.08);
  --code-bg: #2c2520;
  --code-text: #f5ece0;
}
@media (prefers-color-scheme: dark) {
  :root {
    --bg: #1c1916;
    --surface: #262220;
    --surface2: #302b28;
    --surface-elevated: #3a3430;
    --border: rgba(200, 180, 160, 0.08);
    --border-bright: rgba(200, 180, 160, 0.16);
    --text: #f0e8dc;
    --text-dim: #a09888;
    --accent: #e85d2a;
    --accent-dim: rgba(232, 93, 42, 0.1);
    --code-bg: #141210;
    --code-text: #f0e8dc;
  }
}
```

Background: warm radial glow at bottom left. Terracotta accent borders on cards.

### Terminal Mono

Dark, monospace everything, green/cyan accents, faint grid. Developer-native. Dark-first.

```css
:root {
  --font-body: 'Geist Mono', 'SF Mono', Consolas, monospace;
  --font-mono: 'Geist Mono', 'SF Mono', Consolas, monospace;
  --bg: #0a0e14;
  --surface: #12161e;
  --surface2: #1a1f2a;
  --surface-elevated: #222836;
  --border: rgba(80, 250, 123, 0.06);
  --border-bright: rgba(80, 250, 123, 0.12);
  --text: #c8d6e5;
  --text-dim: #5a6a7a;
  --accent: #50fa7b;
  --accent-dim: rgba(80, 250, 123, 0.08);
  --code-bg: #060a10;
  --code-text: #c8d6e5;
}
@media (prefers-color-scheme: light) {
  :root {
    --bg: #f4f6f8;
    --surface: #ffffff;
    --surface2: #eaecf0;
    --surface-elevated: #f8f9fa;
    --border: rgba(0, 80, 40, 0.08);
    --border-bright: rgba(0, 80, 40, 0.16);
    --text: #1a2332;
    --text-dim: #5a6a7a;
    --accent: #0d7a3e;
    --accent-dim: rgba(13, 122, 62, 0.08);
    --code-bg: #1a2332;
    --code-text: #c8d6e5;
  }
}
```

Background: faint dot grid. Everything monospace.

### Swiss Clean

White, geometric sans, single bold accent, visible grid. Minimal and precise. Light-first.

```css
:root {
  --font-body: 'DM Sans', system-ui, sans-serif;
  --font-mono: 'Fira Code', 'SF Mono', monospace;
  --bg: #ffffff;
  --surface: #f8f8f8;
  --surface2: #f0f0f0;
  --surface-elevated: #ffffff;
  --border: rgba(0, 0, 0, 0.08);
  --border-bright: rgba(0, 0, 0, 0.16);
  --text: #111111;
  --text-dim: #666666;
  --accent: #0055ff;
  --accent-dim: rgba(0, 85, 255, 0.06);
  --code-bg: #18181b;
  --code-text: #e4e4e7;
}
@media (prefers-color-scheme: dark) {
  :root {
    --bg: #111111;
    --surface: #1a1a1a;
    --surface2: #222222;
    --surface-elevated: #2a2a2a;
    --border: rgba(255, 255, 255, 0.08);
    --border-bright: rgba(255, 255, 255, 0.16);
    --text: #f0f0f0;
    --text-dim: #888888;
    --accent: #3b82f6;
    --accent-dim: rgba(59, 130, 246, 0.08);
    --code-bg: #0a0a0a;
    --code-text: #e4e4e7;
  }
}
```

Background: subtle grid lines. Typography is geometric and precise.
