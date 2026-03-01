# Plane.so Architecture Verification Report

**Date**: 2026-03-01
**Version**: v1.2.0 (current on `develop` branch)
**Source**: Direct codebase inspection — `pnpm-workspace.yaml`, `package.json`, source files

---

## 1. Frontend Tech Stack

### React

**VERIFIED**: React `18.3.1` (catalog pin in `pnpm-workspace.yaml`)

```yaml
react: 18.3.1
react-dom: 18.3.1
```

### Routing

**VERIFIED**: React Router v7 — `react-router: 7.12.0`, `@react-router/dev: 7.9.5`
Dev scripts: `react-router dev`, `react-router build`, `react-router typegen`
File-based routes via `@react-router/dev` conventions.

### State Management (MobX)

**VERIFIED**: MobX `6.12.0`, `mobx-react: 9.1.1`, `mobx-utils: 6.0.8`
**Pattern**: `makeObservable` (explicit annotation) — used **exclusively** across all stores.
`makeAutoObservable` is **NOT used** in application code (only present in compiled `node_modules`).
CoreRootStore has ~30 stores (not "33+" as docs claim — counted 30 in constructor).

### Build Tool

**VERIFIED**: Vite `7.1.11` (catalog pin)
Web app scripts: `react-router dev` wraps Vite under the hood. Env vars use `VITE_` prefix confirming Vite.

### Styling

**VERIFIED**: Tailwind CSS `4.1.17` (via `@tailwindcss/postcss: 4.1.17` in tailwind-config devDeps)
Confirms Tailwind v4, NOT v3. Uses `@import "tailwindcss"` syntax (v4 style).

---

## 2. Component Libraries

### @plane/propel (primary)

**VERIFIED**: Subpath imports enforced via `exports` map in `packages/propel/package.json`.
No barrel export from `"@plane/propel"` root — only subpaths like `"./button"`, `"./toast"`, etc.

Available subpaths (from `exports` map):
`accordion`, `animated-counter`, `avatar`, `badge`, `banner`, `button`, `calendar`, `card`, `charts/*` (6 chart types), `collapsible`, `combobox`, `command`, `context-menu`, `dialog`, `emoji-icon-picker`, `emoji-reaction`, `empty-state`, `icon-button`, `icons`, `input`, `menu`, `pill`, `popover`, `portal`, `scrollarea`, `skeleton`, `switch`, `tab-navigation`, `table`, `tabs`, `toast`, `toolbar`, `tooltip`, `utils`

**Missing from docs rule**: `separator` is NOT in propel exports map. Docs rule lists `separator` as available — **unverified/incorrect**.

### @plane/ui (legacy)

**VERIFIED**: Still actively used in core codebase. Confirmed imports include:

- `Breadcrumbs`, `Header`, `ContentWrapper` — layout
- `Avatar`, `Spinner`, `Loader` — overlapping with propel (some components exist in both)
- `CustomMenu`, `CustomSearchSelect`, `ToggleSwitch` — unique to `@plane/ui`
- `AlertModalCore`, `ModalCore`, `EModalPosition`, `EModalWidth`
- `OAuthOptions`, `Checkbox`, `Sortable`

**IMPORTANT NOTE**: Docs rule says "Avatar" only in propel — but actual code uses `Avatar` from `@plane/ui` in multiple files (`applied-filters/members.tsx`, `use-editor-mention.tsx`, `users-insight-table.tsx`, etc.). Mixed usage exists in practice.

---

## 3. Color / Theming System

### Semantic CSS Variables

**VERIFIED**: Fully confirmed. Semantic tokens defined in `packages/tailwind-config/variables.css`.

Layer:

1. Raw primitive tokens (`--neutral-*`, `--extended-color-*`, `--alpha-black-*`)
2. Semantic role vars (`--bg-canvas`, `--bg-surface-1`, `--bg-layer-1`, etc.)
3. Tailwind theme map via `@theme inline { --background-color-canvas: var(--bg-canvas); ... }`

Key confirmed tokens:

- `bg-canvas`, `bg-surface-1`, `bg-surface-2`, `bg-layer-1` through `bg-layer-3`
- `bg-accent-primary`, `bg-accent-subtle`
- `bg-success-primary/subtle`, `bg-warning-primary/subtle`, `bg-danger-primary`
- Text: `text-color-primary` → `text-primary` utility (confirmed in `index.css`: `body { @apply font-body bg-canvas text-primary; }`)
- Border: `border-color-subtle`, `border-color-strong`, etc.

### Dark Mode

**VERIFIED**: Uses `data-theme` attribute, NOT `.dark` class.

```css
@custom-variant dark (&:where([data-theme*="dark"], [data-theme*="dark"] *));
@custom-variant dark-high-contrast (&:where([data-theme="dark-contrast"], [data-theme="dark-contrast"] *));
@custom-variant light-high-contrast (&:where([data-theme="light-contrast"], [data-theme="light-contrast"] *));
```

Supported themes: `light`, `dark`, `light-contrast`, `dark-contrast`
Dark mode semantic token overrides applied via attribute selector, auto-handled by semantic tokens.

### Layout Constants

**VERIFIED** (in `@theme` block):

```css
--height-header: 3.25rem; /* 52px */
--padding-page: 1.35rem;
--padding-page-x: 1.35rem;
--padding-page-y: 1.35rem;
```

---

## 4. Backend

### Django + DRF

**VERIFIED** (from `apps/api/requirements/base.txt`):

- Django `4.2.28`
- djangorestframework `3.15.2`
- psycopg `3.3.0` (psycopg3, not psycopg2)

### Model Hierarchy

**VERIFIED**:

```
TimeAuditModel (created_at, updated_at)
UserAuditModel (created_by, updated_by — via crum)
SoftDeleteModel (deleted_at, SoftDeletionManager, all_objects)
  └─ AuditModel(TimeAuditModel, UserAuditModel, SoftDeleteModel)
       └─ BaseModel (id=UUID, auto-set created_by/updated_by in save())
            └─ ProjectBaseModel (project FK, workspace FK, auto-sets workspace from project.workspace)
```

Confirmed `SoftDeletionManager` excludes `deleted_at IS NOT NULL`.
`all_objects = models.Manager()` is the unfiltered manager.

### Issue Custom Managers

**VERIFIED** (`plane/db/models/issue.py`):

- `Issue.issue_objects` = `IssueManager` — excludes: `state__group=TRIAGE`, `archived_at IS NOT NULL`, `project__archived_at IS NOT NULL`, `is_draft=True`
- `Issue.objects` = inherited `SoftDeletionManager` — excludes soft-deleted only
- `Issue.all_objects` = base `models.Manager` — includes everything

**Important nuance**: docs say `Issue.all_objects` exists but the `Issue` model doesn't explicitly redefine it — it inherits from `SoftDeleteModel` which defines `all_objects = models.Manager()`. Functionally same, but worth noting.

### Permission System

**VERIFIED** (`plane/app/permissions/base.py`):

- `allow_permission(allowed_roles, level="PROJECT", creator=False, model=None)` — function decorator
- `ROLE` enum: `ADMIN=20`, `MEMBER=15`, `GUEST=5`
- Workspace-level: checks `WorkspaceMember` with `role__in`
- Project-level: checks `ProjectMember`, also bypasses for workspace admins on any project they're a member of
- `creator=True` shortcircuits if `model.objects.filter(id=pk, created_by=request.user).exists()`

---

## 5. CE Override Pattern

**VERIFIED**:

- `apps/web/core/` — shared core code (stores, hooks, components, services)
- `apps/web/ce/` — CE overrides (store, hooks, components, services, types)
- Path alias in `tsconfig.json`: `"@/plane-web/*": ["./ce/*"]`
- `CoreRootStore` in `core/store/root.store.ts`
- `RootStore extends CoreRootStore` in `ce/store/root.store.ts`

CE `RootStore` adds: `timelineStore`, `worklog`, `customDashboard` (DashboardStore for dashboard v2).

---

## 6. i18n

**VERIFIED**:

- Hook name: `useTranslation` (singular) — exported from `@plane/i18n`
- Located at `packages/i18n/src/hooks/use-translation.ts`
- Signature: `export function useTranslation(): TTranslationStore`
- Returns: `{ t, currentLocale, changeLanguage, languages }`

**Note**: Translation files are `.ts` (TypeScript modules), NOT `.json` as docs imply.
Locales: `en`, `ko`, `vi` (confirmed from `packages/i18n/src/locales/`)
Each locale has: `translations.ts`, `core.ts`, `editor.ts`, `empty-state.ts`, `accessibility.ts`

---

## 7. Monorepo Structure

**VERIFIED**:

- Package manager: `pnpm@10.24.0` (from `packageManager` field in root `package.json`)
- Build system: `turbo@2.6.3` (Turborepo)
- Workspace config: `pnpm-workspace.yaml` with `catalog:` for centralized dependency versions
- Node engine: `>=22.18.0`

Apps in monorepo: `web`, `admin`, `space`, `live`, `api`, `proxy`
Packages: `propel`, `ui`, `types`, `utils`, `constants`, `hooks`, `i18n`, `editor`, `tailwind-config`, `services`, `shared-state`, `logger`, `codemods`, `decorators`, `eslint-config`, `typescript-config`

---

## Summary: Verified vs Inaccurate Claims in CLAUDE.md Rules

| Claim in Rules                                             | Status           | Actual                                          |
| ---------------------------------------------------------- | ---------------- | ----------------------------------------------- |
| React 18                                                   | CORRECT          | 18.3.1                                          |
| React Router v7 (SSR disabled for web)                     | CORRECT          | v7.12.0                                         |
| MobX via `observer` pattern                                | CORRECT          | mobx-react 9.1.1                                |
| `makeObservable` (not makeAutoObservable)                  | CORRECT          | exclusively makeObservable                      |
| Vite build                                                 | CORRECT          | vite 7.1.11                                     |
| Tailwind CSS v4                                            | CORRECT          | 4.1.17                                          |
| pnpm + Turborepo                                           | CORRECT          | pnpm 10.24.0, turbo 2.6.3                       |
| `@plane/propel/button` subpath imports                     | CORRECT          | confirmed from exports map                      |
| No barrel import from `@plane/propel` root                 | CORRECT          | no `"."` export entry                           |
| `bg-canvas`, `bg-surface-1` semantic tokens                | CORRECT          | confirmed in variables.css                      |
| `data-theme` for dark mode                                 | CORRECT          | custom-variant uses `[data-theme*="dark"]`      |
| Themes: `light`, `dark`, `light-contrast`, `dark-contrast` | CORRECT          | confirmed                                       |
| Layout vars `--height-header: 3.25rem`                     | CORRECT          | confirmed                                       |
| Django 4.2 + DRF 3.15                                      | CORRECT          | 4.2.28 + 3.15.2                                 |
| `BaseModel` → `ProjectBaseModel` hierarchy                 | CORRECT          | confirmed                                       |
| `@allow_permission` decorator                              | CORRECT          | confirmed                                       |
| `Issue.issue_objects` custom manager                       | CORRECT          | confirmed — excludes triage/archived/draft      |
| `core/` vs `ce/` structure                                 | CORRECT          | confirmed                                       |
| `@/plane-web/*` → `./ce/*`                                 | CORRECT          | confirmed in tsconfig.json                      |
| `useTranslation` hook name                                 | CORRECT          | confirmed (singular, not plural)                |
| 33+ stores in CoreRootStore                                | MINOR INACCURACY | counted ~30 stores                              |
| `separator` in propel                                      | NOT VERIFIED     | not in propel exports map                       |
| Translation files as JSON                                  | INACCURATE       | files are `.ts` modules, not `.json`            |
| Avatar only in propel (not ui)                             | INACCURATE       | Avatar imported from `@plane/ui` in actual code |

---

## Unresolved Questions

1. Does `@plane/propel` have a `separator` component not yet in exports? (may be unreleased or renamed)
2. Are translation `.ts` files compiled to a specific format at build time, or consumed directly as TypeScript modules?
3. EE (Enterprise Edition) layer — is there an `ee/` directory counterpart to `ce/`? Not visible in local repo.
4. The `worklog` store in CE RootStore has `?: IWorklogStore` (optional) — under what conditions is it initialized?
