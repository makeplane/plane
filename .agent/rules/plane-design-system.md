<!-- Scope: apps/web/**, apps/admin/**, apps/space/**, packages/propel/**, packages/ui/**, packages/i18n/** -->

# Plane Frontend Design System — Quick Reference

> Detailed rules in domain-specific files. This is a compact index with critical rules.

## Tech Stack

React 18 + Router v7 + Vite | MobX (33+ stores) | Tailwind v4 (semantic tokens) | react-hook-form | @plane/i18n (ICU)

## Monorepo

`apps/web/` Main | `apps/admin/` Admin | `apps/space/` Public | `packages/` Shared (@plane/\*)

## CE Override Pattern

- `apps/web/core/` → upstream shared (DO NOT modify for CE)
- `apps/web/ce/` → CE overrides (stores, hooks, components, services)
- `@/*` → core, `@/plane-web/*` → ce
- CE root store extends `CoreRootStore` in `ce/store/root.store.ts`

## Top 10 Critical Rules

1. **Search before build** — ALWAYS grep existing components (→ `component-libraries.md`)
2. **Semantic tokens only** — NEVER hardcode colors (→ `color-tokens.md`)
3. **`text-*` short form** — `text-color-tertiary` LEGACY → use `text-tertiary` (→ `color-tokens.md`)
4. **`bg-layer-2` for inputs** — NOT `bg-surface-1` (→ `forms-inputs.md`)
5. **`observer()` always** — wrap MobX-reading components (→ `mobx-stores.md`)
6. **`t()` for all strings** — never hardcode text (→ `i18n-rules.md`)
7. **`AppHeader` + `ContentWrapper`** — layout pattern, never inline headers (→ `routing-layouts.md`)
8. **Propel subpath imports** — `@plane/propel/button`, NOT barrel (→ `component-libraries.md`)
9. **`setToast()` after mutations** — always show feedback (→ `dialogs-modals.md`)
10. **Re-read checklist** — always re-read `frontend-implementation-checklist.md`

## Modular Rule Files (path-scoped, loaded on demand)

| Rule File                              | Content                                  |
| -------------------------------------- | ---------------------------------------- |
| `color-tokens.md`                      | Semantic colors, dark mode, token naming |
| `component-libraries.md`               | Propel vs UI, search-before-build        |
| `mobx-stores.md`                       | Store pattern, makeObservable, CE stores |
| `routing-layouts.md`                   | Router, layout hierarchy, PageHead       |
| `dialogs-modals.md`                    | 3 dialog systems, toast pattern          |
| `forms-inputs.md`                      | react-hook-form, Input, bg-layer-2       |
| `i18n-rules.md`                        | Translation files, t() usage             |
| `api-services.md`                      | Service class pattern, URL convention    |
| `frontend-implementation-checklist.md` | Pre/post implementation checklist        |

## Standards

- No `any` — explicit types, `export type` / `import type`
- Types in `@plane/types`, Import order: React → type → @plane → @/ → relative
- Components: PascalCase.tsx | Hooks: use-_.ts | Stores: _.store.ts
- Files <200L, components <150L, hooks <100L

## Rule Maintenance

If you encounter code that contradicts these rules:

1. **Grep to verify** which pattern is dominant (count occurrences)
2. **Follow the majority** pattern (the rule may be outdated)
3. **Flag the discrepancy** in your output so rules can be updated
