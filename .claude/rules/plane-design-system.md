# Plane Frontend Design System & Architecture Rules

**MANDATORY**: Read `./docs/design-guidelines.md`, `./docs/code-standards.md`, and this rule before implementing ANY frontend changes.

## Tech Stack

| Layer     | Technology                                                           |
| --------- | -------------------------------------------------------------------- |
| Framework | React 18 + React Router v7 (SSR disabled for web, enabled for space) |
| Build     | Vite + TypeScript (strict mode)                                      |
| State     | MobX (33+ stores via `observer` pattern)                             |
| Styling   | Tailwind CSS v4                                                      |
| Forms     | react-hook-form                                                      |
| i18n      | @plane/i18n (`useTranslation`, ICU MessageFormat)                    |
| Icons     | Lucide React (primary) + Material Symbols Rounded                    |
| Monorepo  | pnpm + Turborepo                                                     |

## Monorepo Structure

```
apps/
├── web/          # Main SPA (React Router v7 + Vite)
├── admin/        # Instance admin dashboard
├── space/        # Public sharing portal (SSR enabled)
├── live/         # Real-time WebSocket server (Express + Hocuspocus)
├── api/          # Django backend
└── proxy/        # Caddy reverse proxy

packages/         # Shared libraries (imported as @plane/*)
├── propel/       # Modern design system components
├── ui/           # Legacy UI components (being migrated to propel)
├── types/        # TypeScript interfaces & types
├── utils/        # Shared utilities (cn(), date helpers, etc.)
├── constants/    # Shared constants
├── hooks/        # Shared React hooks
├── i18n/         # Internationalization
├── editor/       # Rich text editor
├── tailwind-config/ # Shared Tailwind config + CSS variables
├── services/     # Shared API service utilities
├── shared-state/ # Shared MobX state
└── ...
```

## CE Override Pattern — CRITICAL

The codebase uses a **CE (Community Edition) override** pattern:

```
apps/web/
├── core/         # Core shared code (stores, hooks, components, services)
├── ce/           # CE-specific overrides
│   ├── store/    # CE root store extends CoreRootStore
│   ├── hooks/    # CE hook overrides
│   ├── components/ # CE component overrides
│   └── types/    # CE type overrides
```

**Path alias**: `@/plane-web/*` → `./ce/*` (defined in tsconfig.json)

```typescript
// Core imports (shared)
import { CoreRootStore } from "@/store/root.store";

// CE-specific imports (override layer)
import { RootStore } from "@/plane-web/store/root.store"; // → ce/store/root.store.ts

// CE root store EXTENDS core:
export class RootStore extends CoreRootStore {
  // Add CE-specific stores here
}
```

**Rule**: New features for CE go in `ce/` directory, NOT in `core/`. Core is shared upstream.

## Component Libraries

Plane uses two UI libraries. Choose correctly:

### @plane/propel (Primary — use for new code)

Modern design system. **Import from specific subpath**:

```typescript
// ✅ Correct — subpath imports
import { Button } from "@plane/propel/button";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { Dialog } from "@plane/propel/dialog";
import { Input } from "@plane/propel/input";
import { Tooltip } from "@plane/propel/tooltip";
import { Avatar } from "@plane/propel/avatar";
import { Badge } from "@plane/propel/badge";
```

Available: `accordion`, `animated-counter`, `avatar`, `badge`, `banner`, `button`, `calendar`, `card`, `charts`, `collapsible`, `combobox`, `command`, `context-menu`, `dialog`, `emoji-icon-picker`, `emoji-reaction`, `empty-state`, `icon-button`, `icons`, `input`, `menu`, `pill`, `popover`, `portal`, `scrollarea`, `separator`, `skeleton`, `spinners`, `switch`, `tab-navigation`, `table`, `tabs`, `toast`, `toolbar`, `tooltip`

### @plane/ui (Legacy — use ONLY when propel has no equivalent)

Components that exist ONLY in @plane/ui:
`auth-form`, `breadcrumbs`, `color-picker`, `content-wrapper`, `control-link`, `drag-handle`, `drop-indicator`, `dropdown`, `dropdowns`, `favorite-star`, `form-fields`, `header`, `link`, `loader`, `modals`, `oauth`, `popovers`, `progress`, `row`, `sortable`, `tables`, `tag`, `typography`

```typescript
// ✅ OK — component only exists in @plane/ui
import { ToggleSwitch } from "@plane/ui";
import { Breadcrumbs } from "@plane/ui";
import { ContentWrapper } from "@plane/ui";
```

### Overlapping Components (exist in both — ALWAYS use propel)

`avatar`, `badge`, `button`, `card`, `collapsible`, `spinners`, `tabs`, `tooltip`, `utils`

```typescript
// ❌ WRONG — these exist in propel
import { Button } from "@plane/ui";
import { Tooltip } from "@plane/ui";

// ✅ RIGHT — use propel
import { Button } from "@plane/propel/button";
import { Tooltip } from "@plane/propel/tooltip";
```

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
</div>
```

## Dark Mode

Plane uses `data-theme` attribute with custom Tailwind variants. Semantic tokens auto-adapt.

```tsx
// ✅ Correct — semantic tokens handle dark mode automatically
<div className="bg-surface-1 text-color-primary border-color-subtle">

// ❌ WRONG — manual dark mode
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

## TypeScript Standards

### Strict mode enabled. Key rules:

- **No `any`** — use explicit types; suppress with eslint-disable only with justification
- **`export type`** for interfaces/types (tree-shaking)
- Types in `@plane/types` package, import with `import type`

### File naming:

| Type             | Convention               | Example                  |
| ---------------- | ------------------------ | ------------------------ |
| React Components | PascalCase               | `WorkspaceSettings.tsx`  |
| Custom Hooks     | kebab-case + use- prefix | `use-workspace-store.ts` |
| Utils/Services   | kebab-case               | `api-service.ts`         |
| Constants        | UPPER_SNAKE_CASE file    | `WORKSPACE_ROLES.ts`     |
| Store files      | kebab-case.store.ts      | `workspace.store.ts`     |

### Import order:

```typescript
// 1. React & external libraries
import React, { useState } from "react";
import { observer } from "mobx-react";

// 2. Type imports (separate with `import type`)
import type { IWorkspace } from "@plane/types";

// 3. @plane/* packages
import { Button } from "@plane/propel/button";
import { cn } from "@plane/utils";

// 4. Internal absolute imports (@/)
import { useWorkspace } from "@/hooks/store/use-workspace";

// 5. Local relative imports
import { WorkspaceHeader } from "./workspace-header";
```

### Component pattern:

```typescript
interface MyComponentProps {
  value: string;
  onSelect: (id: string) => void;
  disabled?: boolean;
}

export const MyComponent: React.FC<MyComponentProps> = observer(({ value, onSelect, disabled = false }) => {
  const { t } = useTranslation();
  // ...
});
```

## MobX Store Pattern

### Architecture:

```
CoreRootStore (core/store/root.store.ts)
├── cycle: CycleStore
├── project: ProjectStore
├── issue: IssueRootStore
├── label: LabelStore
├── ... (33+ stores)
└── (CE extends via RootStore in ce/store/root.store.ts)
```

### Store structure:

```typescript
import { makeObservable, observable, action, computed, runInAction } from "mobx";
import { computedFn } from "mobx-utils";

export interface IMyStore {
  // observables
  dataMap: Record<string, IMyModel>;
  loader: boolean;
  // computed
  currentItems: IMyModel[] | null;
  // computed actions (with params)
  getItemById: (id: string) => IMyModel | null;
  // actions
  fetchItems: (workspaceSlug: string) => Promise<IMyModel[]>;
  createItem: (workspaceSlug: string, data: Partial<IMyModel>) => Promise<IMyModel>;
}

export class MyStore implements IMyStore {
  dataMap: Record<string, IMyModel> = {};
  loader = false;

  constructor(private rootStore: CoreRootStore) {
    makeObservable(this, {
      dataMap: observable,
      loader: observable,
      currentItems: computed,
      fetchItems: action,
      createItem: action,
    });
  }

  // computedFn for parameterized computed values
  getItemById = computedFn((id: string) => this.dataMap[id] ?? null);

  get currentItems() { ... }

  fetchItems = async (workspaceSlug: string) => {
    this.loader = true;
    try {
      const response = await myService.list(workspaceSlug);
      runInAction(() => {
        response.forEach((item) => { this.dataMap[item.id] = item; });
      });
      return response;
    } finally {
      runInAction(() => { this.loader = false; });
    }
  };
}
```

### Hook wrapper pattern:

```typescript
// hooks/store/use-my-store.ts
import { useContext } from "react";
import { StoreContext } from "@/lib/store-context";
import type { IMyStore } from "@/plane-web/store/my.store";

export const useMyStore = (): IMyStore => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useMyStore must be used within StoreProvider");
  return context.myStore;
};
```

### Usage in components:

```typescript
import { observer } from "mobx-react";
import { useMyStore } from "@/hooks/store/use-my-store";

export const MyComponent = observer(() => {
  const { currentItems, fetchItems } = useMyStore();
  // ...
});
```

## API Service Pattern

```typescript
// services/my-model.service.ts
import { API_BASE_URL } from "@plane/constants";
import { APIService } from "@/services/api.service";

export class MyModelService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async list(workspaceSlug: string): Promise<IMyModel[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/my-models/`)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async create(workspaceSlug: string, data: Partial<IMyModel>): Promise<IMyModel> {
    return this.post(`/api/workspaces/${workspaceSlug}/my-models/`, data)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async update(workspaceSlug: string, id: string, data: Partial<IMyModel>): Promise<IMyModel> {
    return this.patch(`/api/workspaces/${workspaceSlug}/my-models/${id}/`, data)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async delete(workspaceSlug: string, id: string): Promise<void> {
    return this.delete(`/api/workspaces/${workspaceSlug}/my-models/${id}/`)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }
}
```

**URL pattern**: Frontend `/api/workspaces/${slug}/...` → Backend `workspaces/<str:slug>/...` (Django prepends `/api/`)

## Routing (React Router v7)

File-based routes defined in `app/routes/core.ts`:

```typescript
import { index, layout, route } from "@react-router/dev/routes";

export const coreRoutes = [
  // Workspace-scoped
  layout("./(all)/[workspaceSlug]/layout.tsx", [
    // Project-scoped
    layout("./(all)/[workspaceSlug]/(projects)/layout.tsx", [
      route(":workspaceSlug/projects/:projectId/issues", "./(all)/[workspaceSlug]/(projects)/issues/page.tsx"),
    ]),
  ]),
];
```

## i18n (Internationalization)

### Always use translations for user-facing strings:

```typescript
import { useTranslation } from "@plane/i18n";

export const MyComponent = observer(() => {
  const { t } = useTranslation();
  return <Button>{t("common.save")}</Button>;
});
```

### Translation files: `packages/i18n/src/locales/{lang}/translations.json`

### Format: Nested JSON + ICU MessageFormat for pluralization:

```json
{
  "issue": {
    "label": "Work item",
    "count": "{count, plural, one {Work item} other {Work items}}"
  }
}
```

When adding new strings: add key to ALL language files (use English as placeholder).

## Icons

- **Primary**: Lucide React (`lucide-react`)
- **Secondary**: Material Symbols Rounded
- **Plane-specific**: `@plane/propel/icons`

```typescript
import { Plus, Trash2, Settings } from "lucide-react";
```

## Utility Functions

```typescript
// cn() for conditional classnames (from @plane/utils)
import { cn } from "@plane/utils";
<div className={cn("bg-surface-1 p-4", isActive && "bg-accent-subtle")} />

// observer() for MobX reactivity (ALWAYS wrap components reading stores)
import { observer } from "mobx-react";
export const MyComponent = observer(() => { ... });
```

## ESLint & Prettier

### Key ESLint rules:

| Rule                                      | Level | Purpose                  |
| ----------------------------------------- | ----- | ------------------------ |
| `@typescript-eslint/no-explicit-any`      | warn  | Prevent `any` types      |
| `@typescript-eslint/no-floating-promises` | warn  | Catch unhandled promises |
| `react-hooks/rules-of-hooks`              | error | Enforce hooks rules      |
| `import/prefer-type-imports`              | warn  | Use `import type`        |

### Commands:

```bash
pnpm check:lint      # Check lint errors
pnpm fix:lint        # Auto-fix
pnpm check:format    # Check Prettier formatting
pnpm format          # Auto-format
```

### Prettier: 100 char width, 2 spaces, double quotes, semicolons, trailing commas (ES5+)

## File Size Limits

- TypeScript files: <200 lines
- React components: <150 lines
- Custom hooks: <100 lines
- Django views: <150 lines per view class

When exceeding: split into sub-components, extract hooks, create utils.

## Adding a New Frontend Feature — Checklist

1. **Types**: Add TypeScript interfaces in `packages/types/src/`
2. **Service**: Create API service in `apps/web/core/services/` extending `APIService`
3. **Store**: Create MobX store in `apps/web/ce/store/` (CE layer), register in `ce/store/root.store.ts`
4. **Hook**: Create store hook in `apps/web/ce/hooks/store/` or `core/hooks/store/`
5. **Components**: Build in `apps/web/ce/components/` using propel components + semantic tokens
6. **Routes**: Add route in `app/routes/core.ts` or `app/routes/extended.ts`
7. **Translations**: Add keys to ALL language files in `packages/i18n/src/locales/`

## Common Mistakes to Avoid

- ❌ Creating custom Button/Input/Dialog when Propel has them
- ❌ Using `bg-white`, `bg-gray-*`, `text-gray-*` instead of semantic tokens
- ❌ Adding `dark:` variants manually when semantic tokens already handle it
- ❌ Hardcoding strings instead of using `t()` translations
- ❌ Forgetting `observer` wrapper for components reading MobX stores
- ❌ Using inline styles instead of Tailwind classes
- ❌ Importing overlapping components from `@plane/ui` instead of `@plane/propel`
- ❌ Barrel imports from propel (`@plane/propel`) — use subpath (`@plane/propel/button`)
- ❌ Putting CE-specific code in `core/` instead of `ce/` directory
- ❌ Using `any` type without eslint-disable justification
- ❌ Not using `import type` for type-only imports
- ❌ Exceeding file size limits (150 lines for components)
- ❌ Not wrapping API URLs with correct `/api/workspaces/${slug}/` prefix
- ❌ Missing error handling in service methods (`.catch((err) => { throw err?.response?.data; })`)
- ❌ Direct store access without `useContext` hook wrapper
- ❌ Forgetting `runInAction` when updating observables in async actions
