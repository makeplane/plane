---
paths:
  - apps/web/**/*.tsx
  - apps/web/**/*.css
  - apps/admin/**/*.tsx
  - apps/space/**/*.tsx
  - packages/tailwind-config/**
---

# Semantic Color Tokens & Dark Mode

**NEVER hardcode colors.** Use Plane's semantic CSS variables via Tailwind.

## Token Naming Convention — CRITICAL

- Text: `text-color-*` (WITH `color-` infix) → `text-color-primary`, `text-color-tertiary`
- Border: `border-color-*` (WITH `color-` infix) → `border-color-subtle`, `border-color-strong`
- Background: `bg-*` (WITHOUT `color-`) → `bg-surface-1`, `bg-layer-2`

**Common mistake:** `text-tertiary` is WRONG → must be `text-color-tertiary`

## Tailwind v4 Infrastructure Naming — CRITICAL

To ensure Tailwind v4 generates utility classes with the `color-` infix, CSS variables in `variables.css` MUST use a double-namespace:

| Desired Utility  | Required CSS Var Structure | Example                             |
| :--------------- | :------------------------- | :---------------------------------- |
| `text-color-*`   | `--text-color-color-*`     | `--text-color-color-danger-primary` |
| `border-color-*` | `--border-color-color-*`   | `--border-color-color-subtle`       |

**Why?** Tailwind v4 strips the prefix. `--text-color-danger` becomes `text-danger`. To get `text-color-danger`, the variable MUST be `--text-color-color-danger`.

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

| Token                                                                                     | Usage                       |
| ----------------------------------------------------------------------------------------- | --------------------------- |
| `text-color-primary`                                                                      | Primary text                |
| `text-color-secondary`                                                                    | Secondary/muted text        |
| `text-color-tertiary`                                                                     | Tertiary/hint text          |
| `text-color-placeholder` / `text-color-disabled`                                          | Placeholder/disabled        |
| `text-color-accent-primary`                                                               | Accent/link text            |
| `text-color-on-color`                                                                     | Text on colored backgrounds |
| `text-color-success-primary` / `text-color-warning-primary` / `text-color-danger-primary` | Status text                 |

## Borders

| Token                                                       | Usage                 |
| ----------------------------------------------------------- | --------------------- |
| `border-color-subtle`                                       | Default subtle border |
| `border-color-strong`                                       | Prominent border      |
| `border-color-accent-strong` / `border-color-danger-strong` | Accent/danger border  |

## Input/Form Backgrounds — CRITICAL

ALL inputs, selects, textareas, date pickers use `bg-layer-2` (NOT `bg-surface-1`):

```tsx
// ✅ CORRECT
<input className="bg-layer-2 border-[0.5px] border-subtle-1 ..." />
// ❌ WRONG — bg-surface-1 for inputs
<input className="bg-surface-1 ..." />
```

## Dark Mode

Plane uses `data-theme` attribute. Semantic tokens auto-adapt. **NEVER use `dark:` variants.**

```tsx
// ✅ Correct — semantic tokens handle dark mode
<div className="bg-surface-1 text-color-primary border-color-subtle">
// ❌ WRONG — manual dark mode
<div className="bg-white dark:bg-slate-900 text-black dark:text-white">
```

Themes: `light`, `dark`, `light-contrast`, `dark-contrast`

## Layout Constants

| Variable          | Value          | Usage                |
| ----------------- | -------------- | -------------------- |
| `--height-header` | 3.25rem (52px) | Top header height    |
| `--padding-page`  | 1.35rem        | Page content padding |
