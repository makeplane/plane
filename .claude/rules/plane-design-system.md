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

**Path aliases** (tsconfig.json):

```
@/*           → apps/web/core/*     (upstream shared, DO NOT modify for CE features)
@/plane-web/* → apps/web/ce/*       (CE override layer, add CE features here)
@/app/*       → apps/web/app/*      (routes and pages)
```

### Registering a CE store:

```typescript
// ce/store/root.store.ts — CE root store EXTENDS core
import { CoreRootStore } from "@/store/root.store";
import { MyFeatureStore, type IMyFeatureStore } from "./my-feature.store";

export class RootStore extends CoreRootStore {
  myFeature: IMyFeatureStore;

  constructor() {
    super();
    this.myFeature = new MyFeatureStore(this);
  }
}
```

### CE hook accessing CE-only store:

```typescript
// ce/hooks/store/use-my-feature.ts
import { useContext } from "react";
import { StoreContext } from "@/lib/store-context";
import type { IMyFeatureStore } from "@/plane-web/store/my-feature.store";

export const useMyFeature = (): IMyFeatureStore => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useMyFeature must be used within StoreProvider");
  // Cast needed because StoreContext is typed as CoreRootStore
  return (context as any).myFeature;
};
```

**Rules**:

- New features for CE go in `ce/` directory, NOT in `core/`. Core is shared upstream.
- Services: `ce/services/` for CE-specific, `core/services/` for shared
- Components: `ce/components/` for CE-specific features
- Never modify `core/store/root.store.ts` — extend via `ce/store/root.store.ts`

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

Available (from `package.json` exports): `accordion`, `animated-counter`, `avatar`, `badge`, `banner`, `button`, `calendar`, `card`, `charts/*` (area-chart, bar-chart, line-chart, pie-chart, radar-chart, scatter-chart, tree-map), `collapsible`, `combobox`, `command`, `context-menu`, `dialog`, `emoji-icon-picker`, `emoji-reaction`, `empty-state`, `icon-button`, `icons`, `input`, `menu`, `pill`, `popover`, `portal`, `scrollarea`, `skeleton`, `switch`, `tab-navigation`, `table`, `tabs`, `toast`, `toolbar`, `tooltip`, `utils`

**Button variants**: `primary`, `secondary`, `tertiary`, `ghost`, `link`, `error-fill`, `error-outline`
**Button sizes**: `sm`, `base`, `lg`, `xl`

**Propel is built on**: `@base-ui-components/react` + `class-variance-authority` (CVA) + `recharts` (charts)

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

`avatar`, `badge`, `button`, `card`, `collapsible`, `tabs`, `tooltip`, `utils`

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

## Dialog (Compound Component Pattern)

Propel Dialog is built on `@base-ui-components/react` using compound pattern:

```typescript
import { Dialog, EDialogWidth } from "@plane/propel/dialog";

<Dialog open={isOpen} onClose={handleClose} modal>
  <Dialog.Panel width={EDialogWidth.LG}>
    <Dialog.Title>Create Feature</Dialog.Title>
    <div className="p-5 space-y-4">{/* form content */}</div>
    <div className="flex justify-end gap-2 p-4 border-t border-color-subtle">
      <Button variant="secondary" onClick={handleClose}>
        Cancel
      </Button>
      <Button variant="primary" onClick={handleSubmit}>
        Create
      </Button>
    </div>
  </Dialog.Panel>
</Dialog>;
```

Widths: `SM`, `MD`, `LG`, `XL`, `XXL`, `XXXL` via `EDialogWidth` enum.

## Toast Pattern

```typescript
import { TOAST_TYPE, setToast, setPromiseToast } from "@plane/propel/toast";

// Simple toast
setToast({ type: TOAST_TYPE.SUCCESS, title: "Saved!", message: "Optional detail." });
setToast({ type: TOAST_TYPE.ERROR, title: "Failed to save" });

// Promise-driven (auto loading → success/error)
setPromiseToast(myPromise, {
  loading: "Saving...",
  success: { title: "Saved!" },
  error: { title: "Failed!" },
});
```

Types: `SUCCESS`, `ERROR`, `INFO`, `WARNING`, `LOADING`

## Form Pattern (react-hook-form + Controller)

```typescript
import { useForm, Controller } from "react-hook-form";
import { Button } from "@plane/propel/button";
import { Input } from "@plane/propel/input";

const {
  control,
  handleSubmit,
  formState: { errors },
  reset,
  watch,
} = useForm<FormData>({
  defaultValues: { name: "" },
});

// Submit pattern — void to suppress floating-promise warning
<form onSubmit={(e) => void handleSubmit(onSubmit)(e)}>
  <Controller
    name="name"
    control={control}
    rules={{ required: "Name is required" }}
    render={({ field }) => <Input {...field} error={errors.name?.message} />}
  />
  <Button type="submit" variant="primary" loading={isSubmitting}>
    Save
  </Button>
</form>;
```

## Optimistic Update Pattern

```typescript
// In store action — save original, apply optimistic, rollback on error
updateItem = async (id: string, data: Partial<IMyModel>) => {
  const original = { ...this.dataMap[id] };
  // Optimistic update
  runInAction(() => {
    Object.assign(this.dataMap[id], data);
  });
  try {
    await this.service.update(id, data);
  } catch (error) {
    // Rollback
    runInAction(() => {
      this.dataMap[id] = original;
    });
    throw error;
  }
};
```

## Dynamic Observable Keys

Use `set()` from MobX for reactive key assignment on observable records:

```typescript
import { set } from "mobx";
// CORRECT — reactive
set(this.dataMap, itemId, response);
// WRONG — not reactive for new keys
this.dataMap[itemId] = response;
```

## Routing (React Router v7)

- **`app/routes/core.ts`** — core routes (upstream shared, avoid modifying)
- **`app/routes/extended.ts`** — CE-specific routes (add CE features here)

```typescript
import { index, layout, route } from "@react-router/dev/routes";

export const coreRoutes = [
  layout("./(all)/[workspaceSlug]/layout.tsx", [
    layout("./(all)/[workspaceSlug]/(projects)/layout.tsx", [
      route(":workspaceSlug/projects/:projectId/issues", "./(all)/[workspaceSlug]/(projects)/issues/page.tsx"),
    ]),
  ]),
];
```

### Layout hierarchy (outer → inner):

```
./(all)/layout.tsx                               ← auth gate
  ./(all)/[workspaceSlug]/layout.tsx             ← loads workspace data
    ./(all)/[workspaceSlug]/(projects)/layout.tsx ← sidebar + nav
      ./(all)/[workspaceSlug]/(projects)/my-feature/layout.tsx ← feature layout
        page.tsx                                  ← actual content
```

### Page component pattern:

```typescript
import type { Route } from "./+types/page";

function MyFeaturePage({ params }: Route.ComponentProps) {
  const { workspaceSlug } = params;
  const { t } = useTranslation();
  return (
    <>
      <PageHead title={t("my_feature.label")} />
      <div className="h-full w-full">{/* content */}</div>
    </>
  );
}
export default observer(MyFeaturePage);
```

### Layout component pattern:

```typescript
import { AppHeader } from "@/components/core/app-header";
import { ContentWrapper } from "@plane/ui";
import { Outlet } from "react-router";

export default function MyFeatureLayout() {
  return (
    <>
      <AppHeader header={<MyFeatureHeader />} />
      <ContentWrapper>
        <Outlet />
      </ContentWrapper>
    </>
  );
}
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

### Translation files: `packages/i18n/src/locales/{lang}/translations.ts` (TypeScript modules, NOT JSON)

### Format: Nested TypeScript object + ICU MessageFormat for pluralization:

```typescript
// packages/i18n/src/locales/en/translations.ts
export default {
  issue: {
    label: "Work item",
    count: "{count, plural, one {Work item} other {Work items}}",
  },
  my_feature: {
    label: "My Feature",
    create: "Create {name}",
    delete_confirm: "Are you sure you want to delete <strong>{name}</strong>?",
  },
};
```

When adding new strings: add key to all 3 language `.ts` files — en, ko, vi (use English as placeholder).

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

## Adding a New CE Feature — End-to-End Checklist

| Step | What                   | Where                                                            | Pattern                                              |
| ---- | ---------------------- | ---------------------------------------------------------------- | ---------------------------------------------------- |
| 1    | TypeScript interfaces  | `packages/types/src/`                                            | `export interface IMyModel { ... }`                  |
| 2    | API service class      | `apps/web/ce/services/my-feature.service.ts`                     | Extends `APIService`, `.then(r=>r?.data).catch(...)` |
| 3    | MobX store + interface | `apps/web/ce/store/my-feature/my-feature.store.ts`               | `makeObservable` explicit, `runInAction`, `set()`    |
| 4    | Register in CE root    | `apps/web/ce/store/root.store.ts`                                | Add property + instantiate in constructor            |
| 5    | Store hook             | `apps/web/ce/hooks/store/use-my-feature.ts`                      | `useContext(StoreContext)` + cast                    |
| 6    | Components             | `apps/web/ce/components/my-feature/`                             | `observer()`, propel components, semantic tokens     |
| 7    | Layout + Page          | `apps/web/app/(all)/[workspaceSlug]/.../layout.tsx` + `page.tsx` | `AppHeader` + `ContentWrapper` + `Outlet`            |
| 8    | Route config           | `apps/web/app/routes/extended.ts`                                | `layout()` + `route()` for CE routes                 |
| 9    | Translations           | `packages/i18n/src/locales/{en,ko,vi}/translations.ts`           | Add keys to ALL 3 language files                     |

**IMPORTANT**:

- CE features ALWAYS in `ce/` directory, NEVER in `core/`
- Use `observer()` on ALL components that read from MobX stores
- Use `setToast()` for success/error feedback after mutations
- Use `useTranslation()` for ALL user-facing strings
- Use semantic color tokens, NEVER hardcoded colors

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
- ❌ Using `makeAutoObservable` — always use `makeObservable` with explicit field declarations
- ❌ Direct key assignment on observable records (`this.map[id] = x`) — use `set()` from MobX
- ❌ Missing `void` before `handleSubmit(handler)(e)` in form onSubmit (causes floating-promise warning)
- ❌ Using `next-themes` or `class` for dark mode — Plane uses `data-theme` attribute
- ❌ Creating JSON translation files — translation files are TypeScript `.ts` modules
- ❌ Modifying `core/store/root.store.ts` for CE features — extend via `ce/store/root.store.ts`
- ❌ Adding routes to `core.ts` for CE features — use `extended.ts`
- ❌ Forgetting `PageHead` component for page title in route pages
- ❌ Not using `setToast()` for success/error feedback after API mutations
