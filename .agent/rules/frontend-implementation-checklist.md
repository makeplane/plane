<!-- Scope: apps/web/**, apps/admin/**, apps/space/** -->

# Frontend Implementation Checklist

**MANDATORY**: Covers BOTH pre-implementation and post-implementation steps.

## Pre-Implementation — Search Before You Build (MANDATORY)

**BEFORE creating ANY new component, hook, or UI element:**

1. **Search for existing components:**
   ```bash
   grep -r "ComponentName" packages/propel/ packages/ui/ apps/web/core/components/ apps/web/ce/components/
   grep -r "MemberDropdown\|DateRange\|CustomMenu" apps/web/ --include="*.tsx" -l
   ```
2. **Check @plane/propel exports** — `packages/propel/package.json` `exports` field
3. **Check @plane/ui exports** — `packages/ui/src/index.ts`
4. **Check existing dropdowns** — `apps/web/core/components/dropdowns/`
5. **Check existing hooks** — `apps/web/core/hooks/` and `apps/web/ce/hooks/`

| What You Need                           | Where To Look First                         |
| --------------------------------------- | ------------------------------------------- |
| Button, Input, Dialog, Toast            | `@plane/propel/*` (subpath import)          |
| Breadcrumbs, ContentWrapper, CustomMenu | `@plane/ui`                                 |
| Member/Date/Project/State picker        | `apps/web/core/components/dropdowns/`       |
| Existing page patterns                  | grep similar pages in `apps/web/app/(all)/` |

**Rule: If a component exists, USE IT. Do NOT recreate.**

---

## Post-Implementation Scan (EVERY file you create/modify)

### 1. i18n — Zero Hardcoded Strings

- [ ] ALL visible text uses `t()` from `@plane/i18n`
- [ ] Includes: buttons, titles, placeholders, toasts, empty states, errors
- [ ] Translation keys in ALL 3 files (en, ko, vi)

### 2. Color Tokens — Correct Naming

- [ ] Text: `text-*` (NOT `text-color-tertiary` → use `text-tertiary`)
- [ ] Border: `border-*` (NOT `border-color-subtle` → use `border-subtle`)
- [ ] Background: `bg-*` WITHOUT `color-` (`bg-surface-1`, `bg-layer-2`)
- [ ] Zero hardcoded colors (`bg-white`, `bg-gray-*`, `#hex`)

### 3. Input/Form Backgrounds

- [ ] ALL inputs/selects/textareas use `bg-layer-2` (NOT `bg-surface-1`)

### 4. Component Usage

- [ ] Buttons: `@plane/propel/button`, Inputs: `@plane/propel/input`
- [ ] Dropdowns: `CustomMenu` (`@plane/ui`) or `Menu` (`@plane/propel/menu`)
- [ ] Toasts: `@plane/propel/toast`, Dialogs: Propel (admin) / ModalCore (web)

### 5. Layout Pattern

- [ ] `layout.tsx` with `AppHeader` + `ContentWrapper` + `Outlet`
- [ ] No inline headers in `page.tsx`, `PageHead` for page title

### 6. File Quality

- [ ] File <200L (components <150), `observer()` on MobX components
- [ ] `import type` for type-only, `void` before `handleSubmit(handler)(e)`

## Completion Gate — MANDATORY Re-Read

Before marking ANY page/component complete:

1. Re-read this checklist file
2. Run grep for common violations:
   ```bash
   grep -n '"[A-Z][a-z].*"' <file>.tsx | grep -v 'import\|className\|//\|console'
   grep -n 'text-color-tertiary\|text-color-secondary\|border-color-subtle\|bg-surface-1' <file>.tsx
   ```

## Common Traps

| Trap                  | Prevention                                          |
| --------------------- | --------------------------------------------------- |
| Recreating components | ALWAYS grep before creating new                     |
| Hardcoded strings     | Every quoted string in JSX needs `t()`              |
| Wrong token prefix    | Always `text-tertiary`, never `text-color-tertiary` |
| `bg-surface-1` inputs | Always `bg-layer-2` for input-like elements         |
| Custom dropdown       | Always use `CustomMenu` or `Menu`                   |
| Inline page headers   | Always use layout.tsx with `AppHeader`              |
