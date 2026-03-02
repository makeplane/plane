---
paths:
  - apps/web/**
  - apps/admin/**
  - apps/space/**
---

# Frontend Implementation Checklist

**MANDATORY**: After implementing ANY frontend feature, review ALL files against this checklist before considering the task complete.

## Quick Scan (run mentally on EVERY file you create/modify)

### 1. i18n — Zero Hardcoded Strings

- [ ] ALL visible text uses `t()` from `@plane/i18n`
- [ ] Includes: button labels, titles, descriptions, placeholders, toasts, empty states, error messages, loading text
- [ ] Translation keys added to ALL 3 language files (en, ko, vi)
- [ ] Toast messages use `t()` for BOTH `title` and `message`

### 2. Color Tokens — Correct Naming

- [ ] Text tokens use `text-color-*` prefix (NOT `text-tertiary`, must be `text-color-tertiary`)
- [ ] Border tokens use `border-color-*` prefix (NOT `border-subtle`, must be `border-color-subtle`)
- [ ] Background tokens use `bg-*` WITHOUT `color-` (e.g., `bg-surface-1`, `bg-layer-2`)
- [ ] Zero hardcoded colors (`bg-white`, `bg-gray-*`, `text-gray-*`, `#hex`)

### 3. Input/Form Backgrounds

- [ ] ALL inputs, selects, textareas, date pickers use `bg-layer-2` (NOT `bg-surface-1`)
- [ ] List containers inside modals use `bg-layer-2`
- [ ] This applies everywhere: modals, config panels, forms, inline editors

### 4. Component Usage

- [ ] Buttons from `@plane/propel/button` (NOT custom `<button>` for actions)
- [ ] Inputs from `@plane/propel/input` (NOT raw `<input>` for text fields)
- [ ] Dropdowns/menus from `CustomMenu` (`@plane/ui`) or `Menu` (`@plane/propel/menu`)
- [ ] No custom hover-based dropdown menus
- [ ] Toasts from `@plane/propel/toast`
- [ ] Dialogs match the app: Propel Dialog (admin), ModalCore (web)

### 5. Layout Pattern

- [ ] Feature section has `layout.tsx` with `AppHeader` + `ContentWrapper` + `Outlet`
- [ ] No inline headers in `page.tsx` files
- [ ] Breadcrumbs use `@plane/ui` `Breadcrumbs` component (not custom)
- [ ] `PageHead` component used for page title

### 6. File Quality

- [ ] File under 200 lines (components under 150)
- [ ] `observer()` wraps all components reading MobX stores
- [ ] `import type` for type-only imports
- [ ] `void` before `handleSubmit(handler)(e)` in form onSubmit

## When to Use This Checklist

- After creating new components or pages
- After modifying existing UI code
- Before marking a frontend task as complete
- During code review of frontend changes

## Common Traps That Cause Repeated Mistakes

| Trap                  | Why It Happens                                | Prevention                                                |
| --------------------- | --------------------------------------------- | --------------------------------------------------------- |
| Hardcoded strings     | AI generates English text naturally           | Search for quoted strings in JSX — every one needs `t()`  |
| Wrong token prefix    | `text-tertiary` looks correct                 | Always use full form: `text-color-tertiary`               |
| `bg-surface-1` inputs | Looks fine in light mode                      | Always use `bg-layer-2` for input-like elements           |
| Custom dropdown       | Seems faster than finding the right component | Always use `CustomMenu` or `Menu` from existing libraries |
| Inline page headers   | Seems simpler than layout.tsx pattern         | Always create/update layout.tsx with `AppHeader`          |
