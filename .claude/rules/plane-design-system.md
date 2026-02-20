# Plane Design System Compliance

**MANDATORY**: Read `./docs/design-guidelines.md` and this rule before implementing ANY UI changes.

## Component Libraries

Plane uses two UI libraries. Choose correctly:

### @plane/propel (Primary — use for new code)

Modern design system with 38+ components:
`accordion`, `animated-counter`, `avatar`, `badge`, `banner`, `button`, `calendar`, `card`, `charts`, `collapsible`, `combobox`, `command`, `context-menu`, `dialog`, `emoji-icon-picker`, `emoji-reaction`, `empty-state`, `icon-button`, `icons`, `input`, `menu`, `pill`, `popover`, `portal`, `scrollarea`, `separator`, `skeleton`, `spinners`, `switch`, `tab-navigation`, `table`, `tabs`, `toast`, `toolbar`, `tooltip`

```typescript
// ✅ Correct — import from specific subpath
import { Button } from "@plane/propel/button";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { Dialog } from "@plane/propel/dialog";
import { Input } from "@plane/propel/input";
import { Tooltip } from "@plane/propel/tooltip";
```

### @plane/ui (Legacy — use ONLY when propel has no equivalent)

Components that exist ONLY in @plane/ui (not yet in propel):
`auth-form`, `breadcrumbs`, `color-picker`, `content-wrapper`, `control-link`, `drag-handle`, `drop-indicator`, `dropdown`, `dropdowns`, `favorite-star`, `form-fields`, `header`, `link`, `loader`, `modals`, `oauth`, `popovers`, `progress`, `row`, `sortable`, `tables`, `tag`, `typography`

```typescript
// ✅ OK — component only exists in @plane/ui
import { ToggleSwitch } from "@plane/ui";
import { Breadcrumbs } from "@plane/ui";
import { ContentWrapper } from "@plane/ui";

// ❌ WRONG — these exist in propel, never import from @plane/ui
import { Button } from "@plane/ui"; // → use @plane/propel/button
import { Tooltip } from "@plane/ui"; // → use @plane/propel/tooltip
import { Avatar } from "@plane/ui"; // → use @plane/propel/avatar
```

### Overlapping Components (exist in both — ALWAYS use propel)

`avatar`, `badge`, `button`, `card`, `collapsible`, `spinners`, `tabs`, `tooltip`, `utils`

## Semantic Color System

**NEVER hardcode colors.** Use Plane's semantic CSS variables via Tailwind:

### Backgrounds

| Token                                      | Usage                                   |
| ------------------------------------------ | --------------------------------------- |
| `bg-canvas`                                | Page canvas background                  |
| `bg-surface-1`                             | Primary surface (cards, panels)         |
| `bg-surface-2`                             | Secondary surface                       |
| `bg-layer-1`                               | Layer 1 (rows, list items)              |
| `bg-layer-1-hover`                         | Layer 1 hover state                     |
| `bg-layer-2`                               | Layer 2 (nested containers)             |
| `bg-accent-primary`                        | Primary accent (buttons, active states) |
| `bg-accent-subtle`                         | Subtle accent                           |
| `bg-success-primary` / `bg-success-subtle` | Success states                          |
| `bg-warning-primary` / `bg-warning-subtle` | Warning states                          |
| `bg-danger-primary` / `bg-danger-subtle`   | Danger/error states                     |

### Text Colors

| Token                        | Usage                       |
| ---------------------------- | --------------------------- |
| `text-color-primary`         | Primary text                |
| `text-color-secondary`       | Secondary/muted text        |
| `text-color-tertiary`        | Tertiary/hint text          |
| `text-color-placeholder`     | Placeholder text            |
| `text-color-disabled`        | Disabled text               |
| `text-color-accent-primary`  | Accent/link text            |
| `text-color-on-color`        | Text on colored backgrounds |
| `text-color-success-primary` | Success text                |
| `text-color-warning-primary` | Warning text                |
| `text-color-danger-primary`  | Danger/error text           |

### Borders

| Token                        | Usage                 |
| ---------------------------- | --------------------- |
| `border-color-subtle`        | Default subtle border |
| `border-color-strong`        | Prominent border      |
| `border-color-accent-strong` | Accent border         |
| `border-color-danger-strong` | Danger border         |

### Examples

```tsx
// ✅ Correct — uses semantic tokens
<div className="bg-surface-1 border border-color-subtle rounded-lg p-4">
  <h3 className="text-color-primary text-base font-medium">Title</h3>
  <p className="text-color-secondary text-sm">Description</p>
</div>

// ❌ WRONG — hardcoded colors
<div className="bg-white border border-gray-200 rounded-lg p-4">
  <h3 className="text-gray-900 text-base font-medium">Title</h3>
  <p className="text-gray-500 text-sm">Description</p>
</div>
```

## Dark Mode

Plane uses `data-theme` attribute with custom Tailwind variants. The semantic color tokens automatically adapt — **do NOT add manual dark: variants when using semantic tokens.**

```tsx
// ✅ Correct — semantic tokens handle dark mode automatically
<div className="bg-surface-1 text-color-primary border-color-subtle">

// ❌ WRONG — manual dark mode with hardcoded colors
<div className="bg-white dark:bg-slate-900 text-black dark:text-white">
```

Themes: `light`, `dark`, `light-contrast`, `dark-contrast`

## Layout Constants

| Variable           | Value          | Usage                   |
| ------------------ | -------------- | ----------------------- |
| `--height-header`  | 3.25rem (52px) | Top header height       |
| `--padding-page`   | 1.35rem        | Page content padding    |
| `--padding-page-x` | 1.35rem        | Horizontal page padding |
| `--padding-page-y` | 1.35rem        | Vertical page padding   |

## Icons

- **Primary**: Lucide React (`lucide-react`)
- **Secondary**: Material Symbols Rounded (for specific design system needs)
- **Plane-specific**: `@plane/propel/icons`

```typescript
import { Plus, Trash, Settings, ChevronDown } from "lucide-react";
```

## Core Tech Stack (for UI code)

| Layer     | Technology                                    |
| --------- | --------------------------------------------- |
| Framework | React 18 + React Router v7                    |
| State     | MobX (observer pattern)                       |
| Styling   | Tailwind CSS v4                               |
| Forms     | react-hook-form                               |
| i18n      | @plane/i18n (useTranslation)                  |
| Types     | @plane/types                                  |
| Utils     | @plane/utils (includes `cn()` for classnames) |

## Component Patterns to Follow

### Use `observer` for MobX reactivity

```typescript
import { observer } from "mobx-react";
export const MyComponent = observer(() => { ... });
```

### Use `useTranslation` for all user-facing text

```typescript
import { useTranslation } from "@plane/i18n";
const { t } = useTranslation();
<Button>{t("common.save")}</Button>;
```

### Use `cn()` for conditional classnames

```typescript
import { cn } from "@plane/utils";
<div className={cn("bg-surface-1 p-4", isActive && "bg-accent-subtle")} />;
```

### Use react-hook-form for forms

```typescript
import { useForm, FormProvider } from "react-hook-form";
```

## Before Writing UI Code — Checklist

1. **Read** `./docs/design-guidelines.md` for component API details
2. **Search** existing core components for similar patterns (`core/components/issues/`, `core/components/cycles/`)
3. **Check** if the component exists in `@plane/propel` before creating custom
4. **Use** semantic color tokens — never hardcode `bg-white`, `text-gray-*`, `border-gray-*`
5. **Wrap** components with `observer` if they read MobX stores
6. **Add** translations via `@plane/i18n` for all user-facing strings
7. **Test** dark mode works (semantic tokens handle it, but verify)
8. **Match** spacing/sizing with existing Plane pages (header 3.25rem, page padding 1.35rem)

## Common Mistakes to Avoid

- ❌ Creating custom Button/Input/Dialog when Propel has them
- ❌ Using `bg-white`, `bg-gray-*`, `text-gray-*` instead of semantic tokens
- ❌ Adding `dark:` variants manually when semantic tokens already handle it
- ❌ Hardcoding strings instead of using `t()` translations
- ❌ Forgetting `observer` wrapper for components that use MobX stores
- ❌ Using inline styles instead of Tailwind classes
- ❌ Importing overlapping components from `@plane/ui` instead of `@plane/propel`
