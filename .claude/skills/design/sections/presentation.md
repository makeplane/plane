# /design — presentation mode

Build strategic, persuasive decks — HTML or Marp — with a strategy brain
(15 deck structures, copywriting formulas), a contextual slide engine
(BM25 search over 8 CSVs), and two renderers: a zero-dependency HTML
template with vendored Chart.js, and Marp with 7 bundled themes.

Merged from the former `slides`, `design-system` (slide engine),
`frontend-slides`, and `marp-slide` skills.

## When you use it (entry triggers)

User asks for slides / deck / pitch / presentation, or "make a deck",
"investor pitch", "create slides for X", "convert this PPT to a deck",
"style my deck" (theme → route to `theme` mode instead).

Dispatch: the request lands here after the orchestrator's `Consult` phase
has established (or adopted) the design language in
`design/DESIGN.md` and, for brand-bearing decks,
`design/brand-guidelines.md` + `brand-voice-guidelines.md`.

## Where on the spine

Presentation runs the full spine:

- **Consult** — design language first (already done by the orchestrator).
  Also settle the deck's **strategy** here: pick one of the 15 deck
  structures, its slide count, and its emotion arc (see Mechanics 1).
- **Explore** — direction-finding: generate **2–3 deck variants**
  (`v1`, `v2`, …) that differ in **layout system, color temperature, and
  typography** (per the anti-convergence rule in `references/taste-gate.md`).
  Compare on `design/state/board.html`, iterate, pick one.
- **Build** — produce the chosen deck at `design/<deck>/v1.html`
  (or `.md` for Marp), verify, settle.

## Output layout (D17 + D19)

Everything lands under **`design/`** — never `<harness-config-dir>/designs/`,
never `planning/mockups/`, and **never** `assets/designs/slides/` (the
old `slides`/`design-system` output location is abolished — the slide
scripts now default to `design/slides/`, see Mechanics 5).

```
design/<deck>/
├── v1.html  v2.html …     ← variants while exploring
└── <deck>.html             ← settled deck (version suffix dropped)
design/state/board.html   ← Explore comparison board
```

Marble route: `design/<deck>/<deck>.md` is the source; the
rendered HTML/PDF/PPTX goes next to it. Versioned `v1.md`, settled by
dropping the suffix. Never `final`/`finalized`.

## Mechanics

### 1. Deck script (strategy + emotion arc)

Pick the strategy that matches the audience and goal. Structures and
emotion arcs are searchable, but the 15 known strategies are:

| Strategy | Slides | Goal | Audience |
|---|---|---|---|
| YC Seed Deck | 10-12 | Raise seed funding | VCs |
| Guy Kawasaki | 10 | Pitch in 20 min | Investors |
| Series A | 12-15 | Raise Series A | Growth VCs |
| Product Demo | 5-8 | Demonstrate value | Prospects |
| Sales Pitch | 7-10 | Close deal | Qualified leads |
| Nancy Duarte Sparkline | varies | Transform perspective | Any |
| Problem-Solution-Benefit | 3-5 | Quick persuasion | Time-pressed |
| QBR | 10-15 | Update stakeholders | Leadership |
| Team All-Hands | 8-12 | Align team | Employees |
| Conference Talk | 15-25 | Thought leadership | Attendees |
| Workshop | 20-40 | Teach skills | Learners |
| Case Study | 8-12 | Prove value | Prospects |
| Competitive Analysis | 6-10 | Strategic decisions | Internal |
| Board Meeting | 15-20 | Update board | Directors |
| Webinar | 20-30 | Generate leads | Registrants |

Example skeletons (folded from the source knowledge base):

- **YC Seed Deck (10):** Title/Hook · Problem · Solution · Traction ·
  Market · Product · Business Model · Team · Financials · The Ask.
  Arc: `curiosity→frustration→hope→confidence→trust→urgency`.
- **Sales Pitch (9):** Personalized Hook · Their Problem · Cost of Inaction ·
  Your Solution · Proof/Case Studies · Differentiators · Pricing/ROI ·
  Objection Handling · CTA + Next Steps.
  Arc: `connection→frustration→fear→hope→trust→confidence→urgency`.
- **Product Demo (6):** Hook/Problem · Solution Overview · Live Demo ·
  Key Features · Benefits/Pricing · CTA.
  Arc: `curiosity→frustration→hope→confidence→urgency`.

**Duarte Sparkline (pattern breaking).** Alternate "What Is" (current pain)
↔ "What Could Be" (better future) — `What Is → What Could Be → What Is →
What Could Be → New Bliss`. Insert pattern breaks (contrasting layouts /
full-bleed emotional slides) at the 1/3 and 2/3 positions; the slide engine
flags them automatically.

### 2. Copywriting formulas (per-slide copy)

Every content slide maps to a formula and an emotion:

| Slide type | Primary formula | Emotion |
|---|---|---|
| Title/Hook | AIDA, Hook | curiosity |
| Problem | PAS, Agitate | frustration |
| Cost/Risk | Cost of Inaction | fear |
| Solution | FAB, BAB | hope |
| Features | FAB | confidence |
| Traction | Proof Stack | trust |
| Social Proof | Testimonial | trust |
| Pricing | Value Stack | confidence |
| CTA | AIDA, Urgency | urgency |

**PAS — Problem-Agitate-Solution** (problem slides):
`"[Pain point]? Every [time frame], [consequence]. [Solution] fixes this."`

**AIDA — Attention-Interest-Desire-Action** (CTAs, closing):
`"[Bold statement]. [Benefit detail]. [Social proof]. [CTA]."`

**FAB — Features-Advantages-Benefits** (features):
`"[Feature] lets you [advantage], so you can [benefit]."`

**Cost of Inaction** (agitation, urgency): `"Without [solution], you're
losing [amount] every [timeframe]."`

**Before-After-Bridge** (transformation, case studies): `"[Pain point
before]. [Desired state after]. [Your solution] is the bridge."`

Headline patterns: power words ("Stop [bad thing]", "Get [result] in
[timeframe]", "The [adj] way to [action]", "Why [audience] choose
[product]", "[Number] ways to [goal]"); contrast ("[Old way] is dead.
Meet [new way].", "Don't [bad]. Instead, [good]."); social proof
("[Number]+ [users] trust [product]", "Join [notable] and [notable]").

### 3. Slide engine — search the knowledge base

The engine is a BM25 search over 8 CSVs plus a contextual decision layer.
Run from the project root:

```bash
python <this skill's own deployed folder>/scripts/slides/search-slides.py "investor pitch"              # auto-detect domain
python <this skill's own deployed folder>/scripts/slides/search-slides.py "problem agitation" -d copy
python <this skill's own deployed folder>/scripts/slides/search-slides.py "revenue growth" -d chart
python <this skill's own deployed folder>/scripts/slides/search-slides.py "two column" -d layout
python <this skill's own deployed folder>/scripts/slides/search-slides.py "startup funding" --all
python <this skill's own deployed folder>/scripts/slides/search-slides.py "problem slide" --context --position 2 --total 9
python <this skill's own deployed folder>/scripts/slides/search-slides.py "cta" --context --position 9 --prev-emotion frustration
```

Domains: `strategy` (deck structures + arcs), `layout` (25 layouts),
`copy` (25 copywriting formulas), `chart` (25 chart types + Chart.js
configs). Decision CSVs feed the `--context` mode: `slide-layout-logic.csv`
(goal → layout + `break_pattern`), `slide-typography.csv` (content type →
type scale), `slide-color-logic.csv` (emotion → color treatment),
`slide-backgrounds.csv` (slide type → image category + overlay).

Per-slide decision flow (used when you hand-build):

```
1. slide goal            → slide-layout-logic.csv → layout + break pattern
2. emotion to trigger    → slide-color-logic.csv  → color treatment
3. content type          → slide-typography.csv   → type scale
4. pattern break?        → position 1/3 or 2/3 → full-bleed / contrast
5. background needed?    → local asset only (see "Backgrounds" below)
6. animation class       → animate-* class from the template
```

### 4. Layout patterns

Pick the layout from the use-case list, then apply its CSS.

| Layout | Use case | Animation |
|---|---|---|
| Title Slide | Opening / first impression | `animate-fade-up` |
| Problem Statement | Establish pain point | `animate-stagger` |
| Solution Overview | Introduce solution | `animate-scale` |
| Feature Grid | Capabilities (3-6 cards) | `animate-stagger` |
| Metrics Dashboard | KPIs (3-4 metrics) | `animate-stagger-scale` |
| Comparison Table | Compare options | `animate-fade-up` |
| Timeline Flow | Show progression | `animate-stagger` |
| Team Grid | Introduce people | `animate-stagger` |
| Quote Testimonial | Customer endorsement | `animate-fade-up` |
| Two Column Split | Compare / contrast | `animate-fade-up` |
| Big Number Hero | Single powerful metric | `animate-count` |
| Product Screenshot | Show product UI | `animate-scale` |
| Pricing Cards | Present tiers | `animate-stagger` |
| CTA Closing | Drive action | `animate-pulse` |

Core CSS skeletons (grids):

```css
.slide-split { display: grid; grid-template-columns: 1fr 1fr; gap: 48px; align-items: center; }
@media (max-width: 768px) { .slide-split { grid-template-columns: 1fr; gap: 24px; } }

.slide-features { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
@media (max-width: 768px) { .slide-features { grid-template-columns: repeat(2, 1fr); gap: 16px; } }
@media (max-width: 480px) { .slide-features { grid-template-columns: 1fr; } }

.slide-metrics { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
@media (max-width: 768px) { .slide-metrics { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 480px) { .slide-metrics { grid-template-columns: 1fr; } }
```

Card variants: `.card-icon-left` (features with icons), `.card-accent-bar`
(highlighted), `.card-metric` (numbers), `.card-avatar` (team),
`.card-pricing` (tiers). Metric styles: `gradient-number`, `oversized`,
`sparkline`, `funnel-numbers`. Visual treatments: `gradient-glow`,
`subtle-border`, `icon-top`, `screenshot-shadow`, `popular-highlight`,
`bg-overlay`, `contrast-pair`, `logo-grayscale`.

### 5. HTML template (zero-dependency renderer)

One self-contained HTML file per deck — inline CSS/JS, no CDN at runtime.
Base skeleton (adapted from the reference template; the full version stays
in `references/slides-html-template.md`):

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Deck</title>
<script src="<skill-root>/assets/chart/chart.umd.js"></script>
<style>
* { margin:0; padding:0; box-sizing:border-box; }
body { background: var(--color-background,#0D0D0D); color:#fff;
       font-family: var(--typography-font-body,'Inter',sans-serif); overflow:hidden; }
.slide-deck { position:relative; width:100vw; height:100vh; overflow:hidden; }
@media (min-width:769px) {
  .slide-deck { max-width:calc(100vh * 16 / 9); max-height:calc(100vw * 9 / 16);
                margin:auto; position:absolute; inset:0; }
}
.slide { position:absolute; width:100%; height:100%; display:flex;
         flex-direction:column; justify-content:center; align-items:center;
         text-align:center; padding:60px; opacity:0; visibility:hidden;
         transition:opacity .4s; overflow:hidden; }
.slide.active { opacity:1; visibility:visible; }
.slide-content { width:100%; max-width:100%; max-height:100%; overflow:hidden;
                 display:flex; flex-direction:column; justify-content:center;
                 align-items:center; gap:16px; }
.slide-title { font-size:clamp(32px,6vw,80px); line-height:1.1;
               background: var(--gradient-primary,linear-gradient(135deg,#FF6B6B,#FF8E53));
               -webkit-background-clip:text; -webkit-text-fill-color:transparent; }
.progress-bar { position:fixed; top:0; left:0; height:3px; background:var(--color-primary);
                transition:width .3s; z-index:1000; }
.nav-controls { position:fixed; bottom:30px; left:50%; transform:translateX(-50%);
                display:flex; align-items:center; gap:20px; z-index:1000; }
@media (max-width:768px) { .slide{padding:32px 24px} .slide-title{font-size:clamp(28px,5vw,48px)} }
@media (max-width:480px) { .slide{padding:24px 16px} .nav-controls{bottom:16px} }
</style>
</head>
<body>
<div class="progress-bar" id="progressBar"></div>
<div class="slide-deck">
  <div class="slide active"><div class="slide-content">
    <h1 class="slide-title">Title</h1><p>Subtitle</p>
  </div></div>
  <!-- more .slide blocks; always wrap content in .slide-content -->
</div>
<div class="nav-controls">
  <button class="nav-btn" onclick="prevSlide()">←</button>
  <span class="slide-counter"><span id="current">1</span> / <span id="total">9</span></span>
  <button class="nav-btn" onclick="nextSlide()">→</button>
</div>
<script>
let current=1; const total=document.querySelectorAll('.slide').length;
document.getElementById('total').textContent=total;
function showSlide(n){ if(n<1)n=1; if(n>total)n=total; current=n;
  document.querySelectorAll('.slide').forEach((s,i)=>s.classList.toggle('active',i===n-1));
  document.getElementById('current').textContent=n;
  document.getElementById('progressBar').style.width=(n/total*100)+'%'; }
function nextSlide(){ showSlide(current+1); } function prevSlide(){ showSlide(current-1); }
document.addEventListener('keydown',e=>{ if(e.key==='ArrowRight'||e.key===' '){e.preventDefault();nextSlide();} if(e.key==='ArrowLeft'){e.preventDefault();prevSlide();} });
document.addEventListener('click',e=>{ if(!e.target.closest('.nav-controls')) nextSlide(); });
showSlide(1);
</script>
</body>
</html>
```

**Chart.js is an opt-in data-viz layer.** Reference the **vendored** copy
locally — never a CDN URL. The `<script src>` above points from
`design/<deck>/` up to the deployed skill's
`assets/chart/chart.umd.js`; for a self-contained deck, copy that file
next to the deck and reference it relatively. `assets/pretext/pretext.js`
is the vendored text-layout option (same rule) if you want it.

```js
new Chart(document.getElementById('revenueChart'), {
  type:'line', data:{ labels:['Sep','Oct','Nov','Dec'], datasets:[{
    label:'MRR ($K)', data:[5,12,28,45],
    borderColor:'#FF6B6B', backgroundColor:'rgba(255,107,107,.1)',
    borderWidth:3, fill:true, tension:0.4 }] },
  options:{ responsive:true, maintainAspectRatio:false,
    plugins:{ legend:{display:false} },
    scales:{ x:{grid:{color:'rgba(255,255,255,.05)'}}, y:{grid:{color:'rgba(255,255,255,.05)'}} } }
});
```

Token compliance — **ALL values come from design tokens** (from
`design-tokens.css` embedded in the deck): `background: var(--slide-bg)`,
`color: var(--color-primary)`, `font-family: var(--typography-font-heading)`.
Never hardcode hex, raw fonts, or spacing. Run
`scripts/tokens/slide-token-validator.py` over the HTML to verify.

Animation classes (inline CSS, folded from the template):

```css
.animate-fade-up{animation:fadeUp .6s ease-out forwards;opacity:0}
@keyframes fadeUp{from{opacity:0;transform:translateY(30px)}to{opacity:1;transform:translateY(0)}}
.animate-scale{animation:scaleIn .5s ease-out forwards}
@keyframes scaleIn{from{opacity:0;transform:scale(.9)}to{opacity:1;transform:scale(1)}}
.animate-stagger>*{opacity:0;animation:fadeUp .5s ease-out forwards}
.animate-stagger>*:nth-child(1){animation-delay:.1s}
.animate-stagger>*:nth-child(2){animation-delay:.2s}
.animate-stagger>*:nth-child(3){animation-delay:.3s}
.animate-stagger>*:nth-child(4){animation-delay:.4s}
```

### 6. Background images — local only

Background imagery must come from **local files** (a `design/`
asset, a user-supplied image, or a vendored asset) — never a hardcoded
remote URL. The engine's old curated-Pexels-URL list is **disabled**:
if the search suggests a background, render an overlay treatment over a
local image instead (gradient-dark / gradient-brand overlays work with
any image):

```html
<div class="slide slide-with-bg" style="background-image:url('assets/hero.jpg')">
  <div class="overlay" style="background:linear-gradient(135deg, rgba(13,13,13,.9), rgba(13,13,13,.7))"></div>
  <div class="content" style="position:relative; z-index:1"><!-- slide content --></div>
</div>
```

### 7. Marp route (Markdown decks, 7 bundled themes)

Use Marp for text-forward lecture/business decks. Themes live in
`templates/marp/` (`template-*.md` with embedded CSS + `theme-*.css`):

| Theme | Colors | Use for |
|---|---|---|
| `default` | beige bg, navy text, blue headings | general seminars, training |
| `minimal` | white bg, gray text, black headings | content-focused, academic |
| `colorful` | pink gradient, multi accents | youth events, creative |
| `dark` | black bg, cyan/purple accents | tech, evening talks |
| `gradient` | purple→pink→blue→green per slide | visual-focused, creative |
| `tech` | GitHub-dark, blue/green, code font | programming, dev meetups |
| `business` | white bg, navy headings, blue accents | proposals, reports |

Selection decision flow: content → theme (technical→`tech`/`dark`;
business→`business`; creative→`colorful`/`gradient`; academic→`minimal`;
unsure→`default`).

Minimal content rules: title slide `<!-- _class: lead -->`, titles
concise (≈5-7 chars), 3-5 bullets per slide, ≤15-25 chars per line, one
message per slide, 16:9 `size`. Slide count: 5 min → 5-8, 10 min →
10-15, 20 min → 15-25.

Marp syntax (summary — full: `references/marp/`):

```markdown
---
marp: true
theme: business
size: 16:9
paginate: true
header: 'Deck'
---
<!-- _class: lead -->
# Title
Presenter · Date
---
## Section title
- Point 1
- Point 2
- Point 3
```

Per-slide overrides use `<!-- _key: value -->` (underscore = current slide
only). Images: `![bg right:40%](img.png)` side image,
`![bg cover](img.png)` full background, `![w:600px](img.png)` sized,
`![bg blur:5px brightness:0.7](bg.png)` filter. Image paths are relative
to the `.md` file — keep images next to the deck in `design/`.

Export via Marp CLI (external tool, user-installed; run from the deck
folder):

```bash
marp design/<deck>/v1.md -o design/<deck>/v1.html
marp design/<deck>/v1.md --pdf --allow-local-files
marp design/<deck>/v1.md --pptx
marp design/<deck>/v1.md --images png
```

Every theme/template in `templates/marp/` originally imported its fonts
from Google Fonts — **replace** that `@import url(...)` with the local
font kit (`assets/fonts/`, bundled OFL TTF families via `@font-face`) or a
system stack, so a rendered deck makes zero runtime network calls.

### 8. generate-slide.py — programmatic token-driven decks

`scripts/slides/generate-slide.py` renders slides from JSON using the
token layer (all styles use `var(--…)`; no hardcoded colors/fonts).
Slide types: `title`, `problem` (PAS), `solution` (FAB), `metrics` /
`traction` (big numbers), `chart` (CSS bars), `testimonial`, `cta` /
`closing`. Feed it JSON:

```json
{ "title": "Pitch", "slides": [
  { "type": "title", "title": "Acme", "subtitle": "The AI marketing team", "badge": "Investor Deck" },
  { "type": "problem", "headline": "Teams are drowning",
    "pain_1_title": "Overload", "pain_1_desc": "10x content, same headcount" },
  { "type": "metrics", "headline": "Early traction",
    "metrics": [ {"value":"500+","label":"Beta users"}, {"value":"85%","label":"WAU"} ] },
  { "type": "cta", "headline": "Ready?", "cta": "Join the waitlist" }
] }
```

```bash
python scripts/slides/generate-slide.py --json design/<deck>/slides.json \
  --output design/<deck>/v1.html
python scripts/slides/generate-slide.py --demo   # demo deck only; never commit
```

The script's built-in default output directory is `design/slides/`
(D17) — pass `--output design/<deck>/…` to name the deck folder.

### 9. PPTX → HTML route

To turn an existing PowerPoint into a web deck: extract per-slide
content/structure from the `.pptx` first, then re-express each slide in
the chosen style using the HTML template (or Marp). No dependency on
PowerPoint binaries is assumed — text/image extraction is done by reading
the file directly.

### 10. Export & share (optional)

- **PDF** — HTML decks: browser print-to-PDF (Ctrl/Cmd+P, "Save as PDF",
  background graphics on) or a headless browser (`playwright`/Chrome CLI
  `--print-to-pdf`). Marp decks: `marp --pdf` (external tool,
  user-installed). No bundled export script — standard package managers
  only.
- **Deploy** — optional; e.g. `vercel` for sharing. Standard package
  managers, never a hardcoded URL.

## Verify (every deck, before settle)

1. **Token gate** — run `scripts/tokens/slide-token-validator.py` on the
   HTML; fix any hardcoded hex / font / spacing.
2. **D20 gate** — no CDN `<script src>`; the only `<script>` is the
   vendored `assets/chart/chart.umd.js` (optional) and deck inline JS.
   No `@import` of remote fonts.
3. **Copy gate** — each slide carries the formula matched to its goal
   (PAS on problem, FAB on solution, AIDA/urgency on the CTA).
4. **Pattern/arc** — emotion arc from the strategy table; pattern breaks
   present at ~1/3 and ~2/3.
5. **Navigation** — keyboard arrows + click + progress bar all work.
6. **Responsive check** — deck at 16:9 on desktop, stacks on mobile.
7. **Taste gate** — anti-slop blacklist + anti-convergence (see
   `references/taste-gate.md`); screenshots the settled deck.
8. **Settle** — delete losing `v*` files, rename the survivor
   `<deck>.html` (drop the version suffix).

## Inputs

`[deck topic] [slide count or strategy] [audience] [purpose] [style/aesthetic
hint]` — e.g. "10-slide investor pitch for Acme, seed round, VCs, dark
modern". Optional: an existing `.pptx`, a user image for the cover.
