# /design — handoff mode

Generate comprehensive developer handoff documentation from a finished
design — a spec sheet covering layout, design tokens, component props,
interaction states, responsive breakpoints, edge cases, animation details,
and accessibility. Merged from the former `design-handoff` skill.

## When you use it (entry triggers)

A design is **ready for engineering** and the user wants a spec sheet:
"hand this off to engineering", "spec for the developers", "write the
handoff for this screen". Works from a Figma URL, a screenshot, or a
description of the design.

Distinct from `to-code` (which generates actual React code from Figma) —
handoff produces **documentation, never code**.

## Where on the spine

**No Explore** — a handoff spec is a single artifact, not a design
decision.

- **Consult** — read `design/DESIGN.md` and the design tokens
  (`design-tokens.json` / `design-tokens.css`) so the spec references
  tokens by name; check for an existing mockup/deck in `design/`
  that embodies the screen being handed off.
- **Build** — write the spec from the design (measurements, tokens,
  states, edge cases) using the template below.
- **Verify** — completeness check: no unspecified gaps, every state
  covered, tokens referenced by name not raw value.

## Output layout (D17 + D19)

```
design/<screen>/
├── handoff-v1.md        ← while drafting
└── handoff.md           ← settled spec (version suffix dropped)
```

Never `final`/`finalized`. One spec file per screen/feature; if a request
spans screens, produce one file per screen.

## Mechanics

### What to include

**Visual specifications** — exact measurements (padding, margins, widths);
design token references (colors, typography, spacing); responsive
breakpoints and behavior; component variants and states.

**Interaction specifications** — click/tap behavior; hover states;
transitions and animations (duration, easing); gesture support (swipe,
pinch, long-press).

**Content specifications** — character limits; truncation behavior; empty
states; loading states; error states.

**Edge cases** — minimum/maximum content; international text (longer
strings); slow connections; missing data.

**Accessibility** — focus order; ARIA labels and roles; keyboard
interactions; screen-reader announcements.

### Principles

1. **Don't assume** — if it's not specified, the developer will guess.
   Specify everything.
2. **Use tokens, not values** — reference `spacing-md`, not `16px`.
3. **Show all states** — default, hover, active, disabled, loading, error.
4. **Describe the why** — "This collapses on mobile because users
   primarily use one-handed" helps developers make good judgment calls.

### Output template

```markdown
## Handoff Spec: [Feature/Screen Name]

### Overview
[What this screen/feature does, user context]

### Layout
[Grid system, breakpoints, responsive behavior]

### Design Tokens Used
| Token | Value | Usage |
|-------|-------|-------|
| `color-primary` | #[hex] | CTA buttons, links |
| `spacing-md` | [X]px | Between sections |
| `font-heading-lg` | [size/weight/family] | Page title |

### Components
| Component | Variant | Props | Notes |
|-----------|---------|-------|-------|
| [Component] | [Variant] | [Props] | [Special behavior] |

### States and Interactions
| Element | State | Behavior |
|---------|-------|----------|
| [CTA Button] | Hover | [Background darken 10%] |
| [CTA Button] | Loading | [Spinner, disabled] |
| [Form] | Error | [Red border, error message below] |

### Responsive Behavior
| Breakpoint | Changes |
|------------|---------|
| Desktop (>1024px) | [Default layout] |
| Tablet (768–1024px) | [What changes] |
| Mobile (<768px) | [What changes] |

### Edge Cases
- **Empty state**: [What to show when no data]
- **Long text**: [Truncation rules]
- **Loading**: [Skeleton or spinner]
- **Error**: [Error state appearance]

### Animation / Motion
| Element | Trigger | Animation | Duration | Easing |
|---------|---------|-----------|----------|--------|
| [Element] | [Trigger] | [Description] | [ms] | [easing] |

### Accessibility Notes
- [Focus order]
- [ARIA labels needed]
- [Keyboard interactions]
```

### Worked example (folded from the source skill)

For a dashboard screen with a CTA, a list, and a form:

- **Overview**: "Team dashboard — shows active projects; the CTA opens the
  new-project flow. Users arrive here daily; it is the primary landing
  view."
- **Tokens used**: `color-primary` → CTA buttons/links; `spacing-md` →
  between sections; `font-heading-lg` → page title; `color-surface` →
  card backgrounds; `shadow-md` → card elevation.
- **States and interactions**: CTA hover → background darken 10%;
  CTA loading → spinner + disabled; form error → red border + message
  below the field; list item hover → subtle background shift.
- **Responsive**: Desktop (>1024px) → 3-column grid; tablet (768–1024px)
  → 2 columns; mobile (<768px) → single column, CTA pinned to bottom.
- **Edge cases**: empty state ("No projects yet"); long text (truncate at
  2 lines with ellipsis); loading skeleton per card; error banner if the
  data fetch fails.
- **Accessibility**: focus order = sidebar → content → CTA; CTA needs an
  aria-label when icon-only; keyboard: Enter activates, Esc closes modal.

Source token names/values from `design-tokens.json` (semantic layer
preferred — `color-primary`, `spacing-md`, `font-heading-lg` — not raw
primitive hex). When a mockup exists at
`design/<screen>/<screen>.html`, extract exact measurements and
states from it.

### Working from Figma / screenshots

- Figma URL or screenshot provided → pull the design (exact measurements,
  tokens, component specs) from what is visible. If only a description is
  given, state the assumptions at the top of the spec.
- No runtime fetching: a Figma URL is opened by the user (or read by a
  design-tool connector the user configures), never fetched by this skill.
- If a **project tracker** connector is available (user-configured), the
  spec can be linked to an implementation ticket with sub-tasks per spec
  section — optional, external, and never required.

## Tips

1. **Share the Figma link** — the design can be read for exact
   measurements, tokens, and component info.
2. **Mention edge cases** — "What happens with 100 items?" helps spec
   boundary conditions instead of guessing.
3. **Specify the tech stack** — "We use React + Tailwind" yields relevant
   implementation notes in the spec.

## Verify

1. **No assumptions left unmarked** — every unspecified value is either
   specified or explicitly flagged as an assumption.
2. **Token names resolve** — every `token-name` in the spec exists in
   `design-tokens.json`.
3. **All states covered** — each interactive element lists default, hover,
   active/disabled, loading, and error.
4. **Edge cases present** — empty, long text, loading, error all have
   entries.
5. **Settle** — delete the `handoff-v1.md` draft, rename the survivor
   `handoff.md`.

## Inputs

`[Figma URL or design description or path to a design artifact]`
— plus optionally: tech stack ("React + Tailwind"), known edge cases
("what happens with 100 items?"), platform guidelines.
