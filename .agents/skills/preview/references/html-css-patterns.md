# CSS Patterns for HTML Diagrams

Reusable patterns for layout, connectors, theming, and visual effects in self-contained HTML diagrams.

## Theme Setup

Always define both light and dark palettes via custom properties. Start with whichever fits the chosen aesthetic, ensure both work.

**Palette cohesion rule:** Background, text, and accent colors must belong to the same color family. A warm palette (terracotta, cream, sage) should have warm grays for text-dim and warm-tinted borders — never mix warm accents with cool GitHub-gray backgrounds. Each page should feel like one intentional color story, not a generic template with an accent color dropped on top.

**Semantic color richness:** Define 5-6 semantic colors per palette, not just 3 node colors. Richer palettes give the page visual variety without clashing. Include status colors (--green, --red/danger, --amber) and secondary accents (--sage, --teal, --plum) so different sections can have distinct character while staying harmonious.

Light is the default. Dark activates via OS preference (`@media`) OR manual toggle (`[data-theme="dark"]`). The `[data-theme]` selector has higher specificity, so a manual toggle always wins.

```css
/* ── Light (default) ── */
:root {
  --font-body: 'IBM Plex Sans', system-ui, sans-serif;
  --font-mono: 'IBM Plex Mono', 'SF Mono', Consolas, monospace;

  --bg: #faf7f5;
  --surface: #ffffff;
  --surface2: #f5f0ec;
  --surface-elevated: #fff9f5;
  --border: rgba(0, 0, 0, 0.07);
  --border-bright: rgba(0, 0, 0, 0.14);
  --text: #292017;
  --text-dim: #8a7e72;
  --text-bright: #1a1510;
  --accent: #c2410c;
  --accent-dim: rgba(194, 65, 12, 0.07);

  --node-a: #c2410c;
  --node-a-dim: rgba(194, 65, 12, 0.07);
  --node-b: #4d7c0f;
  --node-b-dim: rgba(77, 124, 15, 0.07);
  --node-c: #0f766e;
  --node-c-dim: rgba(15, 118, 110, 0.07);

  --green: #4d7c0f;
  --green-dim: rgba(77, 124, 15, 0.07);
  --red: #b91c1c;
  --red-dim: rgba(185, 28, 28, 0.07);
  --amber: #b45309;
  --amber-dim: rgba(180, 83, 9, 0.07);
  --sage: #65a30d;
  --sage-dim: rgba(101, 163, 13, 0.07);
  --teal: #0f766e;
  --teal-dim: rgba(15, 118, 110, 0.07);
  --plum: #9f1239;
  --plum-dim: rgba(159, 18, 57, 0.07);
}

/* ── Dark (OS preference fallback) ── */
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --bg: #1a1412;
    --surface: #231d1a;
    --surface2: #2e2622;
    --surface-elevated: #352d28;
    --border: rgba(255, 255, 255, 0.06);
    --border-bright: rgba(255, 255, 255, 0.12);
    --text: #ede5dd;
    --text-dim: #a69889;
    --text-bright: #faf5f0;
    --accent: #fb923c;
    --accent-dim: rgba(251, 146, 60, 0.12);

    --node-a: #fb923c;
    --node-a-dim: rgba(251, 146, 60, 0.12);
    --node-b: #a3e635;
    --node-b-dim: rgba(163, 230, 53, 0.1);
    --node-c: #5eead4;
    --node-c-dim: rgba(94, 234, 212, 0.1);

    --green: #a3e635;
    --green-dim: rgba(163, 230, 53, 0.1);
    --red: #fca5a5;
    --red-dim: rgba(252, 165, 165, 0.1);
    --amber: #fbbf24;
    --amber-dim: rgba(251, 191, 36, 0.1);
    --sage: #bef264;
    --sage-dim: rgba(190, 242, 100, 0.1);
    --teal: #5eead4;
    --teal-dim: rgba(94, 234, 212, 0.1);
    --plum: #fda4af;
    --plum-dim: rgba(253, 164, 175, 0.1);
  }
}

/* ── Dark (manual toggle override) ── */
[data-theme="dark"] {
  --bg: #1a1412;
  --surface: #231d1a;
  --surface2: #2e2622;
  --surface-elevated: #352d28;
  --border: rgba(255, 255, 255, 0.06);
  --border-bright: rgba(255, 255, 255, 0.12);
  --text: #ede5dd;
  --text-dim: #a69889;
  --text-bright: #faf5f0;
  --accent: #fb923c;
  --accent-dim: rgba(251, 146, 60, 0.12);

  --node-a: #fb923c;
  --node-a-dim: rgba(251, 146, 60, 0.12);
  --node-b: #a3e635;
  --node-b-dim: rgba(163, 230, 53, 0.1);
  --node-c: #5eead4;
  --node-c-dim: rgba(94, 234, 212, 0.1);

  --green: #a3e635;
  --green-dim: rgba(163, 230, 53, 0.1);
  --red: #fca5a5;
  --red-dim: rgba(252, 165, 165, 0.1);
  --amber: #fbbf24;
  --amber-dim: rgba(251, 191, 36, 0.1);
  --sage: #bef264;
  --sage-dim: rgba(190, 242, 100, 0.1);
  --teal: #5eead4;
  --teal-dim: rgba(94, 234, 212, 0.1);
  --plum: #fda4af;
  --plum-dim: rgba(253, 164, 175, 0.1);
}
```

**How it works:** `:root` = light default. `@media (prefers-color-scheme: dark)` with `:root:not([data-theme="light"])` respects OS preference unless user explicitly chose light. `[data-theme="dark"]` forces dark regardless of OS. No JS needed for the CSS — toggle button JS just sets the attribute.

**Choosing a different palette:** The above is the warm default. For other aesthetics, pick a preset from `html-design-guidelines.md` and extend it with the same semantic color structure (--green, --red, --amber, --sage, --teal, --plum). Every preset in that file defines the core variables; add the semantic layer on top to maintain richness. When using a different preset, replicate the three-tier pattern above (`:root` light, `@media` dark with `:not([data-theme="light"])`, `[data-theme="dark"]` override).

## Theme Toggle Button (MANDATORY)

**MUST include a theme toggle button in EVERY generated HTML page. This is non-negotiable — pages without the toggle are considered incomplete.** Place it fixed in the top-right corner.

### CSS

```css
.theme-toggle {
  position: fixed;
  top: 16px;
  right: 16px;
  z-index: 300;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--text-dim);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  transition: background 0.15s, color 0.15s;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
}
.theme-toggle:hover {
  background: var(--surface2);
  color: var(--text);
}
```

### HTML + JS

Place the button as the first child of `<body>`. The script detects OS preference on load and persists manual choice in `localStorage`.

```html
<button class="theme-toggle" id="themeToggle" title="Toggle theme" aria-label="Toggle light/dark theme"></button>

<script>
(function() {
  var toggle = document.getElementById('themeToggle');
  var saved = localStorage.getItem('theme');
  var initial = saved || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  if (saved) document.documentElement.setAttribute('data-theme', initial);
  toggle.textContent = initial === 'dark' ? '\u2600' : '\u263E';
  toggle.addEventListener('click', function() {
    var current = document.documentElement.getAttribute('data-theme')
      || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    var next = current === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
    toggle.textContent = next === 'dark' ? '\u2600' : '\u263E';
  });
})();
</script>
```

**Symbols:** `\u2600` = sun (shown in dark mode — click to go light), `\u263E` = moon (shown in light mode — click to go dark). No emoji — these are Unicode dingbats that render consistently across platforms.

## Typography Floor

Minimum readable font sizes for generated HTML pages. Smaller sizes strain readability, especially on high-DPI screens.

| Element | Minimum | Recommended |
|---------|---------|-------------|
| Body / card content | 15px | 15–16px |
| Code blocks | 14px | 14px |
| Table cells | 14px | 14–15px |
| Table headers (mono uppercase) | 12px | 12px |
| List items | 14px | 15px |
| Section labels (mono uppercase) | 11px | 12px |
| Card labels (mono uppercase) | 11px | 11px |
| Status badges (mono) | 12px | 12px |
| TOC links | 11px | 12px |
| Callout body | 15px | 16px |

Monospace uppercase labels are allowed at 11px because letter-spacing and uppercase improve legibility at small sizes. Body text and content must stay at 14px+.

## Background Atmosphere

Flat backgrounds feel dead. Use subtle gradients or patterns.

```css
/* Radial glow behind focal area */
body {
  background: var(--bg);
  background-image: radial-gradient(ellipse at 50% 0%, var(--accent-dim) 0%, transparent 60%);
}

/* Faint dot grid */
body {
  background-color: var(--bg);
  background-image: radial-gradient(circle, var(--border) 1px, transparent 1px);
  background-size: 24px 24px;
}

/* Diagonal subtle lines */
body {
  background-color: var(--bg);
  background-image: repeating-linear-gradient(
    -45deg, transparent, transparent 40px,
    var(--border) 40px, var(--border) 41px
  );
}

/* Gradient mesh (pick 2-3 positioned radials) */
body {
  background: var(--bg);
  background-image:
    radial-gradient(at 20% 20%, var(--node-a-dim) 0%, transparent 50%),
    radial-gradient(at 80% 60%, var(--node-b-dim) 0%, transparent 50%);
}
```

## Link Styling

**Never rely on browser default link colors.** The default blue (`#0000EE`) has poor contrast on dark backgrounds. Style links with `color: var(--accent)` and keep underlines for discoverability. On dark backgrounds, use bright accents from the palette (`--node-a`, `--teal`, `--sage`). On light backgrounds, use deeper tones (`--accent`, `--node-b`, `--node-c`). Always use palette variables — never hardcode hex values for links.

## Section / Card Components

The fundamental building block. A colored card representing a system component, pipeline step, or data entity.

**IMPORTANT: Never use `.node` as a CSS class name.** Mermaid.js internally uses `.node` on its SVG `<g>` elements with `transform: translate(x, y)` for positioning. Any page-level `.node` styles (hover transforms, box-shadows, transitions) will leak into Mermaid diagrams and break their layout. Use `.ve-card` instead (namespaced to avoid collisions with CSS frameworks like Bootstrap/Tailwind that also use `.card`).

```css
.ve-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 16px 20px;
  position: relative;
}

/* Colored accent border (left or top) */
.ve-card--accent-a {
  border-left: 3px solid var(--node-a);
}

/* --- Depth tiers: vary card depth to signal importance --- */

/* Elevated: KPIs, key sections, anything that should pop */
.ve-card--elevated {
  background: var(--surface-elevated);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.04);
}

/* Recessed: code blocks, secondary content, detail panels */
.ve-card--recessed {
  background: color-mix(in srgb, var(--bg) 70%, var(--surface) 30%);
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.06);
  border-color: var(--border);
}

/* Hero: executive summaries, focal elements — demands attention */
.ve-card--hero {
  background: color-mix(in srgb, var(--surface) 92%, var(--accent) 8%);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.04);
  border-color: color-mix(in srgb, var(--border) 50%, var(--accent) 50%);
}

/* Glass: special-occasion overlay effect (use sparingly) */
.ve-card--glass {
  background: color-mix(in srgb, var(--surface) 60%, transparent 40%);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-color: rgba(255, 255, 255, 0.1);
}

/* Section label (monospace, uppercase) */
.ve-card__label {
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  color: var(--node-a);
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  gap: 8px;
}

/* Colored dot indicator */
.ve-card__label::before {
  content: '';
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: currentColor;
}
```

## Code Blocks

Code blocks need explicit whitespace preservation and a max-height constraint. Without these, code runs together and long files overwhelm the page.

### Basic Pattern

```css
.code-block {
  font-family: var(--font-mono);
  font-size: 14px;
  line-height: 1.5;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 16px;
  overflow-x: auto;
  /* CRITICAL: preserve line breaks and indentation */
  white-space: pre-wrap;
  word-break: break-word;
}

/* Constrain height for long code */
.code-block--scroll {
  max-height: 400px;
  overflow-y: auto;
}
```

```html
<pre class="code-block code-block--scroll"><code>// Your code here
function example() {
  return true;
}</code></pre>
```

### With File Header

```css
.code-file {
  border: 1px solid var(--border);
  border-radius: 8px;
  overflow: hidden;
}

.code-file__header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: var(--surface);
  border-bottom: 1px solid var(--border);
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--text-dim);
}

.code-file__body {
  font-family: var(--font-mono);
  font-size: 14px;
  line-height: 1.5;
  padding: 16px;
  background: var(--surface-elevated);
  white-space: pre-wrap;
  word-break: break-word;
  max-height: 500px;
  overflow: auto;
}
```

```html
<div class="code-file">
  <div class="code-file__header">
    <span>src/extension.ts</span>
  </div>
  <pre class="code-file__body"><code>export function activate() {
  // ...
}</code></pre>
</div>
```

### Implementation Plans: Don't Dump Full Files

For implementation plans and architecture docs, **don't display entire source files inline**. Instead:

1. **Show structure, not code:**
   ```html
   <div class="file-structure">
     <div class="file-structure__path">src/extension.ts</div>
     <ul class="file-structure__outline">
       <li><code>activate()</code> — Entry point</li>
       <li><code>clearState()</code> — Reset extension state</li>
     </ul>
   </div>
   ```

2. **Use collapsible sections for full code:**
   ```html
   <details class="collapsible">
     <summary>Full implementation (87 lines)</summary>
     <pre class="code-file__body"><code>...</code></pre>
   </details>
   ```

3. **Show key snippets only** — the 5-10 lines illustrating core logic.

**Anti-patterns:**
- Displaying full source files inline (100+ lines overwhelming the page)
- Code blocks without `white-space: pre-wrap` (code runs together)
- No height constraint on long code (page becomes endless scroll)

## Directory Tree

For file structures, use `<pre>` with monospace + `white-space: pre`. Tree connectors (`├──`, `└──`, `│`) only work when vertically aligned.

```css
.dir-tree {
  font-family: var(--font-mono);
  font-size: 13px;
  line-height: 1.7;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 16px 20px;
  overflow-x: auto;
  white-space: pre;
}

.dir-tree .ann { color: var(--text-dim); font-size: 11px; font-style: italic; }
.dir-tree .hl  { color: var(--accent); font-weight: 600; }
```

```html
<pre class="dir-tree">my-project/
├── src/
│   ├── <span class="hl">index.ts</span>       <span class="ann">— entry point</span>
│   └── utils/
└── README.md</pre>
```

**Never** render tree connectors inside wrapping text, flex children, or grid items — vertical pipes lose alignment and the hierarchy becomes unreadable.

## Overflow Protection

Grid and flex children default to `min-width: auto`, which prevents them from shrinking below their content width.

### Global rules

```css
/* Every grid/flex child must be able to shrink */
.grid > *, .flex > *,
[style*="display: grid"] > *,
[style*="display: flex"] > * {
  min-width: 0;
}

/* Long text wraps instead of overflowing */
body {
  overflow-wrap: break-word;
}
```

### Side-by-side comparison panels

```css
.comparison {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.comparison > * {
  min-width: 0;
  overflow-wrap: break-word;
}

@media (max-width: 768px) {
  .comparison { grid-template-columns: 1fr; }
}
```

### Never use `display: flex` on `<li>` for marker characters

Using `display: flex` on a list item creates an anonymous flex item for the remaining text. That anonymous item gets `min-width: auto` and you **cannot** set `min-width: 0` on anonymous boxes. Lines with many inline `<code>` badges will overflow with no CSS fix possible.

Use absolute positioning for markers instead:

```css
/* WRONG — causes overflow with inline code badges */
li {
  display: flex;
  align-items: baseline;
  gap: 6px;
}
li::before {
  content: '›';
  flex-shrink: 0;
}

/* RIGHT — text wraps normally */
li {
  padding-left: 14px;
  position: relative;
}
li::before {
  content: '›';
  position: absolute;
  left: 0;
}
```

### List markers overlapping container borders

```css
/* RIGHT — use inside positioning or adequate padding */
.card ol, .card ul {
  list-style-position: inside;
}

/* OR — adequate padding for outside markers */
.card ol, .card ul {
  padding-left: 2em;
}

/* OR — custom markers with absolute positioning */
.card ol {
  list-style: none;
  padding-left: 0;
  counter-reset: item;
}
.card ol li {
  counter-increment: item;
  padding-left: 2em;
  position: relative;
}
.card ol li::before {
  content: counter(item) ".";
  position: absolute;
  left: 0;
  color: var(--accent);
  font-weight: 600;
}
```

**Rule of thumb:** Any `<ol>` or `<ul>` inside a bordered container needs either `list-style-position: inside` or `padding-left: 2em` minimum.

## Mermaid Containers

Mermaid diagrams have two common layout issues: they render too small to read, and they left-align leaving awkward dead space.

### Centering (Required)

```css
/* WRONG — diagram hugs left edge */
.mermaid-container {
  padding: 24px;
  border: 1px solid var(--border);
}

/* RIGHT — diagram centers in container */
.mermaid-wrap {
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 24px;
  border: 1px solid var(--border);
}
```

### Scaling Small Diagrams

**1. Increase fontSize in themeVariables** (most effective):
```javascript
mermaid.initialize({
  theme: 'base',
  themeVariables: {
    fontSize: '18px',  // default 16px, bump to 18-20px for complex diagrams
  }
});
```

**2. CSS zoom** for diagrams that still render too small:
```css
.mermaid-wrap--scaled .mermaid {
  zoom: 1.3;
}
```

**3. Constrain container width** so the diagram doesn't float in dead space:
```css
.mermaid-wrap--constrained {
  max-width: 800px;
  margin: 0 auto;
}
```

**Rule of thumb:** If the diagram has 10+ nodes or text is smaller than 12px rendered, increase fontSize to 18-20px or apply CSS zoom.

### Zoom Controls — Full Pattern

Add zoom controls to every `.mermaid-wrap` container.

```css
.mermaid-wrap {
  position: relative;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 32px 24px;
  overflow: auto;
  /* CRITICAL: center the diagram */
  display: flex;
  justify-content: center;
  align-items: center;
  /* Prevent vertical flowcharts from compressing */
  min-height: 400px;
}

.mermaid-wrap--compact { min-height: 200px; }
.mermaid-wrap--tall { min-height: 600px; }

.zoom-controls {
  position: absolute;
  top: 8px;
  right: 8px;
  display: flex;
  gap: 2px;
  z-index: 10;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 2px;
}

.zoom-controls button {
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  color: var(--text-dim);
  font-family: var(--font-mono);
  font-size: 14px;
  cursor: pointer;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s ease, color 0.15s ease;
}

.zoom-controls button:hover {
  background: var(--border);
  color: var(--text);
}

.mermaid-wrap { cursor: grab; }
.mermaid-wrap.is-panning { cursor: grabbing; user-select: none; }

/* Multi-diagram structure */
.diagram-shell {
  position: relative;
}

.diagram-shell__hint {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--text-dim);
  margin-bottom: 8px;
  opacity: 0.7;
}

.mermaid-viewport {
  position: relative;
  overflow: hidden;
  width: 100%;
  height: 100%;
  min-height: 300px;
}

.mermaid-canvas {
  position: absolute;
  top: 0;
  left: 0;
}

.zoom-label {
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--text-dim);
  padding: 0 6px;
  white-space: nowrap;
}
```

**How the zoom/pan engine works:** The SVG is rendered into `.mermaid-canvas` which is absolutely positioned inside `.mermaid-viewport`. Zooming sets the SVG's `width` and `height` styles directly. Panning applies `transform: translate()` to the canvas. The viewport has `overflow: hidden` to clip panned content.

### HTML Structure

```html
<section class="diagram-shell">
  <p class="diagram-shell__hint">
    Ctrl/Cmd + wheel to zoom. Scroll to pan. Drag to pan when zoomed. Double-click to fit.
  </p>
  <div class="mermaid-wrap">
    <div class="zoom-controls">
      <button type="button" data-action="zoom-in" title="Zoom in">+</button>
      <button type="button" data-action="zoom-out" title="Zoom out">&minus;</button>
      <button type="button" data-action="zoom-fit" title="Smart fit">&#8634;</button>
      <button type="button" data-action="zoom-one" title="1:1 zoom">1:1</button>
      <button type="button" data-action="zoom-expand" title="Open full size">&#x26F6;</button>
      <span class="zoom-label">Loading...</span>
    </div>
    <div class="mermaid-viewport">
      <div class="mermaid mermaid-canvas"></div>
    </div>
  </div>
  <script type="text/plain" class="diagram-source">
    graph TD
      A --> B
  </script>
</section>
```

Use one `.diagram-shell` per diagram. The source Mermaid text lives in `<script type="text/plain" class="diagram-source">`, so multiple diagrams can coexist without ID collisions.

### JavaScript (Closure-Based)

```javascript
const config = { /* fitPadding, zoom bounds, readabilityFloor */ };
const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
let activeDrag = null;

addEventListener('mousemove', (e) => activeDrag?.onMove(e));
addEventListener('mouseup', () => { activeDrag?.onEnd(); activeDrag = null; });

function initDiagram(shell) {
  const wrap = shell.querySelector('.mermaid-wrap');
  const viewport = shell.querySelector('.mermaid-viewport');
  const canvas = shell.querySelector('.mermaid-canvas');
  const source = shell.querySelector('.diagram-source');
  const label = shell.querySelector('.zoom-label');

  if (!wrap || !viewport || !canvas || !source || !label) {
    console.error('initDiagram: missing required elements in', shell);
    return;
  }

  // Per-diagram state in closure
  let zoom = 1;
  let panX = 0;
  let panY = 0;

  async function render() {
    try {
      const code = source.textContent.trim();
      if (!code) { label.textContent = 'Error: Empty source'; return; }
      const id = 'diagram-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8);
      const { svg } = await mermaid.render(id, code);
      canvas.innerHTML = svg;
      // wire controls, fit, zoom/pan/touch handlers scoped to this shell
    } catch (err) {
      console.error('Mermaid render failed:', err);
      label.textContent = 'Error: ' + (err.message || 'Render failed');
    }
  }

  render();
}

document.querySelectorAll('.diagram-shell').forEach(initDiagram);
```

This pattern removes all hardcoded IDs and supports unlimited diagrams per page. For the full implementation (smart fit, pinch zoom, shared drag state), use the full template from the skill's `templates/` directory.

**⚠️ Never use bare `<pre class="mermaid">`.** It renders but has no zoom/pan controls — diagrams become tiny and unusable. Always use the full `diagram-shell` pattern above.

## Grid Layouts

### Architecture Diagram (2-column with sidebar)
```css
.arch-grid {
  display: grid;
  grid-template-columns: 260px 1fr;
  grid-template-rows: auto;
  gap: 20px;
  max-width: 1100px;
  margin: 0 auto;
}

.arch-grid__sidebar { grid-column: 1; }
.arch-grid__main { grid-column: 2; }
.arch-grid__full { grid-column: 1 / -1; }
```

### Pipeline (horizontal steps)
```css
.pipeline {
  display: flex;
  align-items: stretch;
  gap: 0;
  overflow-x: auto;
  padding-bottom: 8px;
}

.pipeline__step {
  min-width: 130px;
  flex-shrink: 0;
}

.pipeline__arrow {
  display: flex;
  align-items: center;
  padding: 0 4px;
  color: var(--border-bright);
  font-size: 18px;
  flex-shrink: 0;
}

/* Parallel branch within a pipeline */
.pipeline__parallel {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
```

### Card Grid (dashboard / metrics)
```css
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 16px;
}
```

### Data Tables

Use real `<table>` elements for tabular data. Wrap in a scrollable container for wide tables.

```css
/* Scrollable wrapper for wide tables */
.table-wrap {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 12px;
  overflow: hidden;
}

.table-scroll {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

/* Base table */
.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
  line-height: 1.5;
}

/* Header */
.data-table thead {
  position: sticky;
  top: 0;
  z-index: 2;
}

.data-table th {
  background: var(--surface-elevated, var(--surface));
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: var(--text-dim);
  text-align: left;
  padding: 12px 16px;
  border-bottom: 2px solid var(--border-bright);
  white-space: nowrap;
}

/* Cells */
.data-table td {
  padding: 12px 16px;
  border-bottom: 1px solid var(--border);
  vertical-align: top;
  color: var(--text);
}

/* Let text-heavy columns wrap naturally */
.data-table .wide {
  min-width: 200px;
  max-width: 500px;
}

/* Right-align numeric columns */
.data-table td.num,
.data-table th.num {
  text-align: right;
  font-variant-numeric: tabular-nums;
  font-family: var(--font-mono);
}

/* Alternating rows */
.data-table tbody tr:nth-child(even) {
  background: var(--accent-dim);
}

/* Row hover */
.data-table tbody tr {
  transition: background 0.15s ease;
}

.data-table tbody tr:hover {
  background: var(--border);
}

/* Last row: no bottom border */
.data-table tbody tr:last-child td {
  border-bottom: none;
}

/* Code inside cells */
.data-table code {
  font-family: var(--font-mono);
  font-size: 11px;
  background: var(--accent-dim);
  color: var(--accent);
  padding: 1px 5px;
  border-radius: 3px;
}

/* Secondary detail text */
.data-table small {
  display: block;
  color: var(--text-dim);
  font-size: 11px;
  margin-top: 2px;
}
```

#### Status Indicators

Styled spans for match/gap/warning states. Never use emoji.

```css
.status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 500;
  padding: 3px 10px;
  border-radius: 6px;
  white-space: nowrap;
}

.status--match {
  background: var(--green-dim, rgba(5, 150, 105, 0.1));
  color: var(--green, #059669);
}

.status--gap {
  background: var(--red-dim, rgba(239, 68, 68, 0.1));
  color: var(--red, #ef4444);
}

.status--warn {
  background: var(--orange-dim, rgba(217, 119, 6, 0.1));
  color: var(--orange, #d97706);
}

.status--info {
  background: var(--accent-dim);
  color: var(--accent);
}

/* Dot variant (compact, no text) */
.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
}

.status-dot--match { background: var(--green, #059669); }
.status-dot--gap { background: var(--red, #ef4444); }
.status-dot--warn { background: var(--orange, #d97706); }
```

Usage in table cells:
```html
<td><span class="status status--match">Match</span></td>
<td><span class="status status--gap">Gap</span></td>
<td><span class="status status--warn">Partial</span></td>
```

#### Table Summary Row

```css
.data-table tfoot td {
  background: var(--surface-elevated, var(--surface));
  font-weight: 600;
  font-size: 12px;
  border-top: 2px solid var(--border-bright);
  border-bottom: none;
  padding: 12px 16px;
}
```

#### Sticky First Column (for very wide tables)

```css
.data-table th:first-child,
.data-table td:first-child {
  position: sticky;
  left: 0;
  z-index: 1;
  background: var(--surface);
}

.data-table tbody tr:nth-child(even) td:first-child {
  background: color-mix(in srgb, var(--surface) 95%, var(--accent) 5%);
}
```

## Connectors

### CSS Arrow (vertical, between stacked sections)
```css
.flow-arrow {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  color: var(--text-dim);
  font-family: var(--font-mono);
  font-size: 12px;
  padding: 6px 0;
}

.flow-arrow svg {
  width: 20px;
  height: 20px;
  fill: none;
  stroke: var(--border-bright);
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}
```

Down arrow SVG (reuse inline):
```html
<svg viewBox="0 0 20 20"><path d="M10 4 L10 16 M6 12 L10 16 L14 12"/></svg>
```

### CSS Arrow (horizontal, between inline steps)
```css
.h-arrow::after {
  content: '→';
  color: var(--border-bright);
  font-size: 18px;
  padding: 0 4px;
}
```

### SVG Curved Connector (between arbitrary nodes)
```html
<svg class="connectors" style="position:absolute;inset:0;width:100%;height:100%;pointer-events:none;">
  <path d="M 150,100 C 150,200 350,100 350,200" fill="none" stroke="var(--accent)" stroke-width="1.5" stroke-dasharray="4 3"/>
  <!-- Arrowhead -->
  <polygon points="348,195 352,205 356,195" fill="var(--accent)"/>
</svg>
```

Position the parent container as `position: relative` to scope the SVG overlay.

## Animations

### Staggered Fade-In on Load

Define the keyframe once, then stagger via a `--i` CSS variable set per element.

```css
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}

.ve-card {
  animation: fadeUp 0.4s ease-out both;
  animation-delay: calc(var(--i, 0) * 0.05s);
}
```

Set `--i` per element to control stagger order:
```html
<div class="ve-card" style="--i: 0">First</div>
<div class="ve-card" style="--i: 1">Second</div>
<div class="ve-card" style="--i: 2">Third</div>
```

### Hover Lift
```css
.ve-card {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.ve-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}
```

### Scale-Fade (for KPI cards, badges)

```css
@keyframes fadeScale {
  from { opacity: 0; transform: scale(0.92); }
  to { opacity: 1; transform: scale(1); }
}

.kpi-card {
  animation: fadeScale 0.35s ease-out both;
  animation-delay: calc(var(--i, 0) * 0.06s);
}
```

### SVG Draw-In (for connectors, path elements)

```css
@keyframes drawIn {
  from { stroke-dashoffset: var(--path-length); }
  to { stroke-dashoffset: 0; }
}

/* Set --path-length to the path's getTotalLength() value */
.connector path {
  stroke-dasharray: var(--path-length);
  animation: drawIn 0.8s ease-in-out both;
  animation-delay: calc(var(--i, 0) * 0.1s);
}
```

### CSS Counter (hero numbers without JS)

Uses `@property` to animate a custom property as an integer. Falls back to showing the final value in browsers without `@property` support.

```css
@property --count {
  syntax: '<integer>';
  initial-value: 0;
  inherits: false;
}

@keyframes countUp {
  to { --count: var(--target); }
}

.kpi-card__value--animated {
  --target: 247;
  counter-reset: val var(--count);
  animation: countUp 1.2s ease-out forwards;
}

.kpi-card__value--animated::after {
  content: counter(val);
}
```

### Choreography

Mix animation types by element role:
- **Cards**: `fadeUp` — default entrance, reliable and subtle
- **KPI / badges**: `fadeScale` — scale draws the eye to important numbers
- **SVG connectors**: `drawIn` — reveals flow direction, pairs with card stagger
- **Hero numbers**: `countUp` — counting motion signals "this number matters"
- **Stagger timing**: `calc(var(--i) * 0.06s)` with lower `--i` on important elements (appear first)

### Respect Reduced Motion
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

## Sparklines and Simple Charts (Pure SVG)

```html
<!-- Sparkline -->
<svg viewBox="0 0 100 30" style="width:100px;height:30px;">
  <polyline points="0,25 15,20 30,22 45,10 60,15 75,5 90,12 100,8"
    fill="none" stroke="var(--accent)" stroke-width="1.5" stroke-linecap="round"/>
</svg>

<!-- Progress bar -->
<div style="height:6px;background:var(--border);border-radius:3px;overflow:hidden;">
  <div style="height:100%;width:72%;background:var(--accent);border-radius:3px;"></div>
</div>
```

## Responsive Breakpoint

Include a single breakpoint for narrow viewports:

```css
@media (max-width: 768px) {
  .arch-grid { grid-template-columns: 1fr; }
  .pipeline { flex-wrap: wrap; gap: 8px; }
  .pipeline__arrow { display: none; }
  body { padding: 16px; }
}
```

## Badges and Tags

```css
.tag {
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 500;
  padding: 2px 7px;
  border-radius: 4px;
  background: var(--node-a-dim);
  color: var(--node-a);
}
```

## Lists Inside Nodes

```css
.node-list {
  list-style: none;
  padding: 0;
  margin: 0;
  font-size: 14px;
  line-height: 1.8;
}

.node-list li {
  padding-left: 14px;
  position: relative;
}

.node-list li::before {
  content: '›';
  color: var(--text-dim);
  font-weight: 600;
  position: absolute;
  left: 0;
}

.node-list code {
  font-family: var(--font-mono);
  font-size: 11px;
  background: var(--accent-dim);
  color: var(--accent);
  padding: 1px 5px;
  border-radius: 3px;
}
```

## KPI / Metric Cards

```css
.kpi-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 16px;
}

.kpi-card {
  background: var(--surface-elevated);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.kpi-card__value {
  font-size: 36px;
  font-weight: 700;
  letter-spacing: -1px;
  line-height: 1.1;
  font-variant-numeric: tabular-nums;
}

.kpi-card__label {
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  color: var(--text-dim);
  margin-top: 6px;
}

.kpi-card__trend {
  font-family: var(--font-mono);
  font-size: 12px;
  margin-top: 4px;
}

.kpi-card__trend--up { color: var(--node-b, #059669); }
.kpi-card__trend--down { color: var(--red, #ef4444); }
```

```html
<div class="kpi-row">
  <div class="kpi-card">
    <div class="kpi-card__value">247</div>
    <div class="kpi-card__label">Lines Added</div>
    <div class="kpi-card__trend kpi-card__trend--up">+34%</div>
  </div>
</div>
```

## Before / After Panels

```css
.diff-panels {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0;
  border: 1px solid var(--border);
  border-radius: 10px;
  overflow: hidden;
}

.diff-panels > * { min-width: 0; overflow-wrap: break-word; }

.diff-panel__header {
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
  padding: 10px 16px;
}

.diff-panel__header--before {
  background: var(--red-dim, rgba(239, 68, 68, 0.08));
  color: var(--red, #ef4444);
  border-bottom: 2px solid var(--red, #ef4444);
}

.diff-panel__header--after {
  background: var(--green-dim, rgba(5, 150, 105, 0.08));
  color: var(--green, #059669);
  border-bottom: 2px solid var(--green, #059669);
}

.diff-panel__body {
  padding: 16px;
  background: var(--surface);
  font-size: 15px;
  line-height: 1.6;
}

.diff-changed {
  background: var(--accent-dim);
  border-radius: 3px;
  padding: 0 3px;
}

@media (max-width: 768px) {
  .diff-panels { grid-template-columns: 1fr; }
}
```

## Collapsible Sections

Native `<details>/<summary>` with styled disclosure. Zero JS, accessible. For lower-priority content: file maps, decision logs, reference sections.

```css
details.collapsible {
  border: 1px solid var(--border);
  border-radius: 10px;
  overflow: hidden;
}

details.collapsible summary {
  padding: 14px 20px;
  background: var(--surface);
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  list-style: none;
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--text);
  transition: background 0.15s ease;
}

details.collapsible summary:hover {
  background: var(--surface-elevated, var(--surface));
}

details.collapsible summary::-webkit-details-marker { display: none; }

/* Chevron indicator */
details.collapsible summary::before {
  content: '▸';
  font-size: 11px;
  color: var(--text-dim);
  transition: transform 0.15s ease;
}

details.collapsible[open] summary::before {
  transform: rotate(90deg);
}

details.collapsible .collapsible__body {
  padding: 16px 20px;
  border-top: 1px solid var(--border);
  font-size: 15px;
  line-height: 1.6;
}
```

```html
<details class="collapsible">
  <summary>File Map (14 files changed)</summary>
  <div class="collapsible__body">
    <!-- content here -->
  </div>
</details>
```

## Prose Page Elements

Patterns for documentation, articles, blog posts, and reading-first content. Optimize for sustained reading, not scanning.

### Body Text Settings

```css
.prose {
  font-size: clamp(17px, 1.1vw + 14px, 19px);
  line-height: 1.7;
  max-width: 65ch;
  text-wrap: pretty;
}

.prose p {
  margin-bottom: 1.5em;
}

.prose--narrow {
  max-width: 60ch;
  line-height: 1.8;
}

.prose--wide {
  max-width: 75ch;
  line-height: 1.6;
}
```

### Lead Paragraph

```css
.lead {
  font-size: 20px;
  line-height: 1.6;
  color: var(--text-bright);
  margin-bottom: 32px;
}

.lead--dropcap::first-letter {
  float: left;
  font-family: var(--font-display);
  font-size: 64px;
  font-weight: 600;
  line-height: 0.85;
  padding-right: 12px;
  padding-top: 6px;
  color: var(--accent);
}
```

### Pull Quotes

```css
/* Border left — most versatile */
.pullquote {
  margin: 48px 0;
  padding-left: 24px;
  border-left: 3px solid var(--accent);
}
.pullquote p {
  font-size: 22px;
  font-style: italic;
  line-height: 1.4;
  color: var(--text-bright);
  margin: 0;
}

/* Centered with quotation mark */
.pullquote--centered {
  margin: 56px 0;
  padding: 32px 40px;
  border-top: 1px solid var(--border);
  border-bottom: 1px solid var(--border);
  text-align: center;
  position: relative;
}
.pullquote--centered::before {
  content: '"';
  position: absolute;
  top: -12px;
  left: 50%;
  transform: translateX(-50%);
  background: var(--bg);
  padding: 0 16px;
  font-size: 48px;
  color: var(--accent);
  line-height: 1;
}
```

### Callout Boxes

```css
.callout {
  padding: 16px 20px;
  border-radius: 8px;
  border-left: 4px solid var(--callout-border);
  background: var(--callout-bg);
  margin: 24px 0;
}

.callout--info {
  --callout-border: var(--accent);
  --callout-bg: color-mix(in srgb, var(--accent) 10%, transparent);
}

.callout--warning {
  --callout-border: var(--amber);
  --callout-bg: color-mix(in srgb, var(--amber) 10%, transparent);
}

.callout--success {
  --callout-border: var(--green);
  --callout-bg: color-mix(in srgb, var(--green) 10%, transparent);
}

.callout__title {
  font-weight: 600;
  margin-bottom: 8px;
  color: var(--callout-border);
}

/* Lists inside callouts need padding fix */
.callout ul, .callout ol {
  padding-left: 1.5em;
  margin: 8px 0 0 0;
}
```

### Theme Toggle

```css
:root, [data-theme="light"] {
  --bg: #fafaf9;
  --surface: #ffffff;
  --text: #1c1917;
  --text-dim: #78716c;
  --border: #e7e5e4;
  --accent: #0d9488;
}

[data-theme="dark"] {
  --bg: #0c0a09;
  --surface: #1c1917;
  --text: #fafaf9;
  --text-dim: #a8a29e;
  --border: #292524;
  --accent: #14b8a6;
}
```

```javascript
// Random initial theme
const themes = ['light', 'dark'];
document.documentElement.setAttribute('data-theme', themes[Math.floor(Math.random() * 2)]);

// Toggle
function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  document.documentElement.setAttribute('data-theme', current === 'light' ? 'dark' : 'light');
}
```

### Prose Anti-Patterns

Avoid in reading-first content:
- Body text smaller than 16px
- Line-height below 1.5
- Measure wider than 75ch
- Pull quotes every other paragraph
- Busy background patterns behind text

## Generated Images

For AI-generated illustrations embedded as base64 data URIs. Use `/ck:ai-multimodal` skill for image generation if available.

### Hero Banner

```css
.hero-img-wrap {
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 24px;
}

.hero-img-wrap img {
  width: 100%;
  height: 240px;
  object-fit: cover;
  display: block;
}

/* Gradient fade into page background */
.hero-img-wrap::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 50%;
  background: linear-gradient(to top, var(--bg), transparent);
  pointer-events: none;
}
```

```html
<div class="hero-img-wrap">
  <img src="data:image/png;base64,..." alt="Descriptive alt text">
</div>
```

### Inline Illustration

```css
.illus {
  text-align: center;
  margin: 24px 0;
}

.illus img {
  max-width: 480px;
  width: 100%;
  border-radius: 10px;
  border: 1px solid var(--border);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.illus figcaption {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--text-dim);
  margin-top: 8px;
}
```

### Side Accent

```css
.accent-img {
  float: right;
  max-width: 200px;
  margin: 0 0 16px 24px;
  border-radius: 10px;
  border: 1px solid var(--border);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

@media (max-width: 768px) {
  .accent-img {
    float: none;
    max-width: 100%;
    margin: 0 0 16px 0;
  }
}
```
