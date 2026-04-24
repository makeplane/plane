# Redesign Audit Checklist

Use when upgrading an existing project. Follow Scan → Diagnose → Fix in order.

## Workflow

1. **Scan** — Read the codebase. Identify framework, styling method (Tailwind, vanilla CSS, styled-components), and current design patterns.
2. **Diagnose** — Run through each category below. List every generic pattern, weak point, and missing state.
3. **Fix** — Apply targeted upgrades working with the existing stack. Do not rewrite from scratch.

**Rules:**
- Work with the existing tech stack. Do not migrate frameworks.
- Do not break existing functionality. Test after every change.
- Check `package.json` before adding any new dependency.
- Keep changes focused and reviewable — small targeted improvements over big rewrites.

---

## Audit Categories

### 1. Typography
- [ ] Browser default fonts or Inter everywhere → replace with `Geist`, `Outfit`, `Cabinet Grotesk`, or `Satoshi`
- [ ] Headlines lack presence → tighten tracking, reduce line-height, increase display size
- [ ] Body text too wide → limit to ~65ch, increase line-height
- [ ] Only 400 + 700 weights → introduce 500/600 for subtler hierarchy
- [ ] Numbers in proportional font → use monospace or `font-variant-numeric: tabular-nums`
- [ ] All-caps subheaders everywhere → try lowercase italic or sentence case
- [ ] Orphaned last words → fix with `text-wrap: balance` or `text-wrap: pretty`
- [ ] Serif fonts on dashboard UI → use high-end sans-serif pairs only

### 2. Color and Surfaces
- [ ] Pure `#000000` → replace with off-black or tinted dark
- [ ] Oversaturated accents → desaturate below 80%
- [ ] More than one accent color → reduce to one
- [ ] Mixing warm and cool grays → pick one family, stay consistent
- [ ] Purple/blue AI gradient aesthetic → replace with neutral base + singular accent
- [ ] Generic `box-shadow` → tint shadows to background hue
- [ ] Flat surfaces with zero texture → add subtle noise/grain overlay
- [ ] Perfectly even linear gradients → use radial, mesh, or noise-overlaid gradients
- [ ] Random dark section in light-mode page (or vice versa) → commit to consistent tone or use slightly darker shade of same palette

### 3. Layout
- [ ] Everything centered and symmetrical → break with offset margins, mixed aspect ratios
- [ ] Three equal card columns as feature row → use 2-col zig-zag, asymmetric grid, or horizontal scroll
- [ ] `h-screen` / `height: 100vh` → replace with `min-height: 100dvh`
- [ ] Complex flexbox `calc()` math → replace with CSS Grid
- [ ] No max-width container → add 1200-1440px constraint with auto margins
- [ ] Uniform border-radius everywhere → vary inner/outer elements
- [ ] No overlap or depth → use negative margins for layering
- [ ] Dashboard always has left sidebar → consider top nav, command menu, or collapsible panel
- [ ] Buttons not bottom-aligned in card groups → pin CTAs to card bottom
- [ ] Missing whitespace on marketing pages → double spacing, let design breathe

### 4. Interactivity and States
- [ ] No hover states on buttons → add background shift, scale, or translate
- [ ] No active/pressed feedback → add `scale(0.98)` or `translateY(1px)` on press
- [ ] Instant transitions → add 200-300ms smooth transitions
- [ ] Missing focus ring → visible focus indicator (accessibility requirement)
- [ ] Generic circular spinner → replace with skeleton loader matching layout shape
- [ ] No empty state → design a composed "getting started" view
- [ ] No error state → inline error messages on forms (no `window.alert()`)
- [ ] Dead links (`href="#"`) → link real destinations or visually disable
- [ ] No current-page indicator in nav → style active link distinctly
- [ ] Scroll jumping on anchor links → add `scroll-behavior: smooth`
- [ ] Animations using `top`/`left`/`width`/`height` → switch to `transform` + `opacity`

### 5. Content
- [ ] Generic placeholder names → use diverse, realistic names
- [ ] Round fake numbers → use organic messy data
- [ ] AI copywriting clichés → plain, specific language
- [ ] Lorem Ipsum → real draft copy
- [ ] Exclamation marks in success states → remove
- [ ] Title Case On Every Header → use sentence case
- [ ] Same avatar for multiple users → unique assets per person
- [ ] Blog post dates all identical → randomize

### 6. Components and Code
- [ ] Generic card (border + shadow + white bg) at high density → use spacing/dividers
- [ ] Always one filled + one ghost button → add text links, reduce visual noise
- [ ] Lucide/Feather icons only → try Phosphor or Heroicons for differentiation
- [ ] Cliché icon metaphors (rocketship, shield) → less obvious alternatives
- [ ] Div soup → use semantic HTML: `nav`, `main`, `article`, `aside`, `section`
- [ ] Inline styles mixed with CSS classes → move all styling to the project's system
- [ ] Arbitrary z-index values (`z-[9999]`) → establish a clean z-index scale
- [ ] Missing alt text on meaningful images → describe content for screen readers
- [ ] Missing meta tags → add `title`, `description`, `og:image`

---

## Fix Priority Order

Apply in this order for maximum impact with minimum risk:

1. **Font swap** — biggest instant improvement, lowest risk
2. **Color cleanup** — remove clashing or oversaturated colors
3. **Hover and active states** — makes interface feel alive
4. **Layout and spacing** — proper grid, max-width, consistent padding
5. **Replace generic components** — swap cliché patterns for modern alternatives
6. **Add loading, empty, error states** — makes it feel finished
7. **Polish typography scale** — the premium final touch

---

## Strategic Omissions (What AI Typically Forgets)

These are rarely in AI-generated output. Check explicitly:

- **No legal links** → add privacy policy + terms in footer
- **No "back" navigation** → every page needs a way back
- **No custom 404 page** → design a helpful branded "not found" experience
- **No form validation** → client-side validation for emails, required fields, formats
- **No "skip to content" link** → essential for keyboard users
- **No favicon** → always include a branded favicon
- **No social sharing meta** → `og:image`, `og:title`, `twitter:card`
