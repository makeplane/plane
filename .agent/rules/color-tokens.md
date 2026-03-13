<!-- Scope: apps/web/**/*.tsx, apps/web/**/*.css, apps/admin/**/*.tsx, apps/space/**/*.tsx, packages/tailwind-config/** -->

# Semantic Color Tokens & Dark Mode

**NEVER hardcode colors.** Use Plane's semantic CSS variables via Tailwind.

## Token Naming Convention — CRITICAL

- Text: `text-*` (WITHOUT `color-` infix) → `text-primary`, `text-secondary`, `text-tertiary`
- Border: `border-*` (WITHOUT `color-` infix) → `border-subtle`, `border-strong`
- Background: `bg-*` (WITHOUT `color-`) → `bg-surface-1`, `bg-layer-2`

WRONG (legacy, do NOT use): `text-color-tertiary`, `border-color-subtle`
CORRECT: `text-tertiary`, `border-subtle`

## Backgrounds

| Token                                           | Usage                                                         |
| ----------------------------------------------- | ------------------------------------------------------------- |
| `bg-canvas`                                     | Page canvas background                                        |
| `bg-surface-1`                                  | Primary surface (cards, panels)                               |
| `bg-surface-2`                                  | Secondary surface                                             |
| `bg-layer-1` / `bg-layer-1-hover`               | Layer 1 (rows, list items)                                    |
| `bg-layer-2`                                    | Layer 2 (nested containers, **ALL inputs/selects/textareas**) |
| `bg-accent-primary` / `bg-accent-subtle`        | Accent states                                                 |
| `bg-success-*` / `bg-warning-*` / `bg-danger-*` | Status states                                                 |

## Text Colors

| Token                                                                   | Usage                       |
| ----------------------------------------------------------------------- | --------------------------- |
| `text-primary`                                                          | Primary text                |
| `text-secondary`                                                        | Secondary/muted text        |
| `text-tertiary`                                                         | Tertiary/hint text          |
| `text-placeholder` / `text-disabled`                                    | Placeholder/disabled        |
| `text-accent-primary`                                                   | Accent/link text            |
| `text-on-color`                                                         | Text on colored backgrounds |
| `text-success-primary` / `text-warning-primary` / `text-danger-primary` | Status text                 |

## Borders

| Token                                           | Usage                 |
| ----------------------------------------------- | --------------------- |
| `border-subtle`                                 | Default subtle border |
| `border-strong`                                 | Prominent border      |
| `border-accent-strong` / `border-danger-strong` | Accent/danger border  |

## Input/Form Backgrounds — CRITICAL

ALL inputs, selects, textareas, date pickers use `bg-layer-2` (NOT `bg-surface-1`):

```tsx
// ✅ CORRECT
<input className="bg-layer-2 border-[0.5px] border-subtle ..." />
// ❌ WRONG — bg-surface-1 for inputs
<input className="bg-surface-1 ..." />
```

## Dark Mode

Plane uses `data-theme` attribute. Semantic tokens auto-adapt. **NEVER use `dark:` variants.**

```tsx
// ✅ Correct — semantic tokens handle dark mode
<div className="bg-surface-1 text-primary border-subtle">
// ❌ WRONG — manual dark mode
<div className="bg-white dark:bg-slate-900 text-black dark:text-white">
```

Themes: `light`, `dark`, `light-contrast`, `dark-contrast`

## Layout Constants

| Variable          | Value          | Usage                |
| ----------------- | -------------- | -------------------- |
| `--height-header` | 3.25rem (52px) | Top header height    |
| `--padding-page`  | 1.35rem        | Page content padding |
