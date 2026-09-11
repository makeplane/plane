# /design — design-system mode

**Mode:** design tokens / CSS variables / component specs. Build output is `design/design-tokens.json` + `design-tokens.css` (plus optional Tailwind config and component spec docs).

## When to use

"Set up design tokens", "make a token system", "define CSS variables for the app", "write component specs for our buttons", "turn this brand into tokens", "generate a Tailwind theme". Systematic design as code: the layer between a design language and every screen. This mode does **not** run the Explore variants loop — tokens are derived, not brainstormed; see the spine.

## Workflow — mapped onto the universal spine

### 1. Consult — pin the token source of truth

1. **Adopt the language.** Read `design/DESIGN.md` if it exists — its colors, type, spacing, radius, shadows, and motion are the *primitive* inputs. Brand-bearing work reads `design/brand-guidelines.md` + voice guidelines first. If no design language exists, run the Consult phase of the spine (propose + write DESIGN.md) before producing tokens — tokens without a language are invented values.
2. **Brand → tokens sync.** When brand guidelines exist, run the pipeline that keeps them in one direction:
   ```bash
   node scripts/tokens/sync-brand-to-tokens.cjs            # brand-guidelines.md colors → tokens.json → tokens.css
   node scripts/tokens/sync-brand-to-tokens.cjs --dry-run
   node scripts/tokens/inject-brand-context.cjs [path-to-guidelines]   # extract brand context for prompts
   ```
   `extract-colors.cjs <image>` extracts dominant colors from a supplied image (pure Node, no external deps) to compare against the brand palette — for when brand values come from an asset rather than a document.
3. **Choose the token source file.** Copy the starter template and build up:
   ```bash
   cp templates/design-tokens-starter.json design/design-tokens.json
   ```

### 2. Build — three-layer architecture

The system is three layers, each referencing the one below (never raw values in components):

```
Primitive (raw values)          --color-blue-600: #2563EB;
        ↓
Semantic (purpose aliases)      --color-primary: var(--color-blue-600);
        ↓
Component (component-specific)  --button-bg: var(--color-primary);
```

**Starter template structure** (`templates/design-tokens-starter.json`) gives the full skeleton:

| Layer | Blocks | Example |
|---|---|---|
| `primitive` | `color` (gray scale 50–950, blue, red, green, yellow, white), `spacing` (0–16 rem), `fontSize` (xs–4xl), `radius` (none→full), `shadow` (none–lg), `duration` (fast 150ms / normal 200ms / slow 300ms) | `"gray.600": { "$value": "#4B5563", "$type": "color" }` |
| `semantic` | `color` (background, foreground, primary, primary-hover, primary-foreground, secondary, muted, destructive, border, ring), `spacing` (component, section) | `"primary": { "$value": "{primitive.color.blue.600}" }` |
| `component` | `button` (bg, fg, hover-bg, padding-x/y, radius, font-size), `input`, `card` | `"button.bg": { "$value": "{semantic.color.primary}" }` |
| `dark.semantic` | `color` overrides (background→gray.950, foreground→gray.50, secondary/muted/border→gray.800) | `"background": { "$value": "{primitive.color.gray.950}" }` |

**Generate CSS + Tailwind:**

```bash
node scripts/tokens/generate-tokens.cjs --config design/design-tokens.json -o design/design-tokens.css
node scripts/tokens/generate-tokens.cjs --config design/design-tokens.json --format tailwind   # colors map → tailwind.config
```

Output CSS has four blocks — `:root` primitives, `:root` semantic, `:root` component, and `.dark` semantic overrides. Use **HSL (or tokenized rgb) for opacity control**, and keep a `$type` on every token. The Tailwind format emits `module.exports = { colors: { primary: 'var(--color-primary)', … } }` for `theme.extend.colors` — drop it into `tailwind.config` (or use `scripts/tailwind_config_gen.py` to scaffold the whole config from the token values).

**Embed for standalone files** (slides, infographics, single-file HTML — needs a tokens.css present):

```bash
node scripts/tokens/embed-tokens.cjs            # full token set
node scripts/tokens/embed-tokens.cjs --minimal    # spacing/fontSize/radius/shadow/color-*/card- only
node scripts/tokens/embed-tokens.cjs --style      # wrapped in <style> tags
```

**Component specs** — document each component's states as a table:

| Property | Default | Hover | Active | Disabled |
|---|---|---|---|---|
| Background | primary | primary-dark | primary-darker | muted |
| Text | white | white | white | muted-fg |
| Border | none | none | none | muted-border |
| Shadow | sm | md | none | none |

Component tokens (button/input/card) live in the `component` layer so they can be customized per component without touching semantic values. Spec docs pair each table with the token names, so a developer reads the component-layer tokens off without digging through the JSON.

**Design-to-code handoff:** the token spine is the handoff artifact. The intelligence engine can propose a whole system for a product type first, persisted to the design folder:

```bash
python scripts/search/search.py "<product> <industry>" --design-system -p "Name" -o design
```

That persists a system design (`MASTER.md` + design system files) under `design/design-system/` (or a named subfolder), and with `--page <n>` one of its pages; `-o` overrides the default output root.

**Best practices folded from the design-system skill:** keep a single source of truth — tokens are generated, never hand-edited in CSS; name by purpose, not presentation (`--color-primary`, never `--color-blue`); keep aliases to a maximum of two layers; define motion tokens (duration/easing) and spacing tokens so components don't invent their own; ship semantic colors for states (primary/primary-hover/primary-foreground, secondary, muted, destructive, border, ring) explicitly — don't derive them with filters downstream; pair each primitive with a `$type` so consumers know what they hold. The dark theme is a **semantic override**, not a hue-inversion pass — dark colors are chosen, re-verified for contrast, not computed.

**What belongs in which layer** (keeps the system readable at any size):

| Layer | Holds | Never holds |
|---|---|---|
| `primitive` | raw hex/rgb, base spacing steps, type scale, radii, shadows, durations, easing | anything named after a purpose |
| `semantic` | purpose aliases: background, foreground, primary, border, ring, component/section spacing | component-specific values |
| `component` | button/input/card/… named slots that read semantic aliases | raw values |
| `dark.semantic` | dark overrides of semantic colors | a second copy of the whole system |

If a value is referenced once and belongs to a component, it is a component token; if it is shared across two components, it graduates to semantic; if it is a raw coordinate (a hex, a rem), it stays primitive. Dangling references (`{primitive.color.x}` that resolves to nothing) are a hard fail in the gate — `generate-tokens.cjs` flattens and resolves; inspect the emitted CSS for leftovers.

**Test before handoff.** Walk a real screen against the tokens before calling it done: every styled element resolves to a `var()`, states (hover/active/disabled/focus) all have defined tokens, dark mode flips as one class and passes contrast independently, spacing on components comes from spacing tokens, motion comes from duration/easing tokens. If a developer would have to invent a value to finish a component, the system has a gap — close it by adding the token, not by letting the component hardcode.

### 3. Verify — token compliance gate

1. **Structural validation of the config** (`validate-tokens.cjs` scans code, not the config — run it against the codebase):
   ```bash
   node scripts/tokens/validate-tokens.cjs --dir src/
   ```
   Catches hardcoded hex (`#RGB`/`#RRGGBB`), hardcoded RGB, 2+-digit px values, and rem values in `.css/.scss/.tsx/.jsx/.ts/.js/.vue/.svelte` (skips `tailwind.config`, `globals.css`, token files, minified). Offers suggestions; exits 1 on violations. Black/white hexes are exempt.
2. **HTML asset compliance** (`html-token-validator.py`) — for any HTML that should carry tokens (mockups, decks, infographics): `python scripts/tokens/html-token-validator.py [path|--type slides|infographics]`. Requires the `design-tokens.css` import, flags hardcoded colors/fonts in `<style>`/inline style, allows brand rgba + external-exception contexts (pexels/unsplash/youtube/google fonts — informational only, never fetched at runtime), warns on low `var()` usage (<5 references). `slide-token-validator.py` is a legacy wrapper that delegates to it (`--type slides`).
3. **Asset compliance** (marketing/print assets): `node scripts/tokens/validate-asset.cjs <asset-path>` — naming pattern, dimensions, size, metadata; pair with `extract-colors.cjs` for color validation.
4. **Correct vs wrong usage** in downstream code:
   ```css
   /* CORRECT */ background: var(--color-surface); color: var(--color-foreground);
   /* WRONG    */ background: #0D0D0D;             color: #FF6B6B;
   ```

## Verification / quality gate

- Every generated token resolves (no dangling `{primitive.…}` references — `generate-tokens.cjs` flattens and resolves them; inspect the CSS output for unresolved values).
- Every semantic token has an explicit purpose; nothing uses raw hex/px in components downstream.
- Dark mode is a semantic override, not a hue-inversion pass — contrast re-verified independently.
- The token file and generated CSS live at `design/design-tokens.{json,css}` (durable, not under `state/`).
- If a deck/HTML artifact claims token compliance, it passes `html-token-validator.py`.
- Same-role surfaces share tokens: a primary button and a primary link both read `--color-primary`, so changing the brand changes one value, everywhere.

## Scripts & references

| Asset | Path | Use |
|---|---|---|
| Starter tokens | `templates/design-tokens-starter.json` | three-layer skeleton (primitive/semantic/component/dark) |
| Token generator | `scripts/tokens/generate-tokens.cjs` | `--config tokens.json -o tokens.css` or `--format tailwind` |
| Token validator | `scripts/tokens/validate-tokens.cjs` | hardcoded-value scan of `--dir` |
| Embed tokens | `scripts/tokens/embed-tokens.cjs` | standalone-HTML inline CSS (`--minimal`, `--style`) |
| HTML validator | `scripts/tokens/html-token-validator.py` | compliance of mockups/decks/infographics (`--type slides\|infographics`, `--fix`) |
| Slide validator (legacy) | `scripts/tokens/slide-token-validator.py` | delegates to html-token-validator.py |
| Brand sync | `scripts/tokens/sync-brand-to-tokens.cjs` | brand → tokens → css pipeline |
| Token architecture | `references/design-system/token-architecture.md` | three-layer model + rationale |
| Token dictionaries | `references/design-system/{primitive,semantic,component}-tokens.md` | full scales: gray/blue/status, spacing 0–24, radius, shadows, durations, z-index, component token blocks |
| Component specs | `references/design-system/component-specs.md` | per-component variants/sizes/states/anatomy |
| States & variants | `references/design-system/states-and-variants.md` | state priority, focus ring, disabled/loading/error, ARIA, contrast |
| Tailwind integration | `references/design-system/tailwind-integration.md` | HSL opacity modifiers, config, `@apply`, dark toggle |
| Brand context | `scripts/tokens/inject-brand-context.cjs` | extract brand hex/context for prompts |
| Color extraction | `scripts/tokens/extract-colors.cjs` | dominant colors from an image vs brand palette |
| Asset validation | `scripts/tokens/validate-asset.cjs` | naming/dimensions/size/metadata checks |
| Intelligence | `scripts/search/search.py` | `--design-system` to seed a system from product type (`-o design`, `--page`) |
