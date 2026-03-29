# Antigravity Rules — Plane.so (SHBVN)

> All AI agents MUST read and comply with these rules. Non-negotiable.
> Always read `docs/codebase-summary.md` and `docs/code-standards.md` before implementing features.

## Project Overview

- **Product:** Plane.so Community Edition — customized for Shinhan Bank Vietnam
- **Type:** Full-stack monorepo (React + Django + WebSocket)
- **Monorepo:** pnpm 10.24+ with Turborepo 2.6+
- **Version:** v1.2.4
- **Team:** 4 developers, org: `shbvn`

---

## Monorepo Structure

```
plane.so/
├── apps/
│   ├── web/          # Main React SPA (React 18, MobX, 38 stores)
│   ├── admin/        # Instance admin dashboard (God Mode, 8 stores)
│   ├── space/        # Public sharing portal (SSR enabled)
│   ├── live/         # Real-time WebSocket (Express + Hocuspocus/Y.js)
│   ├── api/          # Django REST API backend
│   └── proxy/        # Caddy reverse proxy
├── packages/
│   ├── types/        # @plane/types — TypeScript definitions (116 files)
│   ├── constants/    # @plane/constants — Enums, config values
│   ├── utils/        # @plane/utils — String, array, color, date, file, cn()
│   ├── services/     # @plane/services — Axios wrapper, per-domain API layer
│   ├── hooks/        # @plane/hooks — useHashScroll, useLocalStorage, etc.
│   ├── propel/       # @plane/propel — Modern UI components (386 files, USE THIS)
│   ├── ui/           # @plane/ui — Legacy UI components (DO NOT use for new code)
│   ├── editor/       # @plane/editor — Tiptap + Y.js rich text editor
│   ├── i18n/         # @plane/i18n — 19 languages, MobX + intl-messageformat
│   ├── tailwind-config/  # Shared Tailwind CSS v4 config with CSS variables
│   ├── typescript-config/ # Shared TypeScript configs
│   └── eslint-config/    # Shared ESLint rules (v9 flat config)
├── docs/             # Developer documentation (MUST READ)
└── plans/            # Implementation plans
```

### Frontend App Structure

```
apps/[app]/
├── app/              # React Router v7 app directory (routes, entry)
│   └── routes/
│       ├── core.ts       # Core routes (DO NOT modify for CE)
│       └── extended.ts   # CE-specific routes (add here)
├── core/             # Upstream shared — DO NOT modify for CE
│   ├── store/        # MobX stores (domain models)
│   ├── components/   # Reusable components
│   ├── hooks/        # Custom React hooks
│   ├── services/     # API service layer
│   ├── layouts/      # Layout components
│   └── lib/          # Utility functions
├── ce/               # Community Edition overrides (CE features go HERE)
│   ├── store/        # CE stores (extend CoreRootStore)
│   ├── components/   # CE components
│   ├── hooks/        # CE hooks
│   └── services/     # CE services (CE prefix: CEMyService)
└── styles/           # Global CSS
```

### Import Aliases (CRITICAL)

- `@/*` → `apps/web/core/*` (core imports)
- `@/plane-web/*` → `apps/web/ce/*` (CE imports)

### Backend Structure (Django)

```
apps/api/plane/
├── settings/         # Django configuration
├── middleware/        # Global middleware
├── authentication/   # OAuth + magic link + Swing SSO
├── app/              # Legacy v0 API endpoints
│   ├── views/        # ViewSets (inherit BaseViewSet/BaseAPIView)
│   ├── serializers/  # DRF serializers
│   ├── permissions/  # @allow_permission, ROLE
│   └── urls/         # URL routing
├── api/              # New v1 API endpoints
├── db/
│   ├── models/       # 39 model files
│   └── migrations/   # 163+ migrations
├── bgtasks/          # 36+ Celery background tasks
├── license/          # Instance admin features (God Mode API)
│   └── api/views/    # Inherit BaseAPIView from plane.license.api.views
└── utils/            # Utilities
```

### API Versions

- `/api/` and `/api/v0/` — Legacy endpoints (under `plane.app`)
- `/api/v1/` — New endpoints (under `plane.api`)
- `/api/public/` — Public/shared space APIs
- `/auth/` — Authentication endpoints
- `/god-mode/instances/` — Admin instance endpoints

---

## Architecture

### Frontend Stack

- **Framework:** React 18 + React Router v7 (SPA, SSR disabled for web/admin; SSR enabled for space)
- **Build:** Vite + TypeScript
- **State:** MobX (38 stores in web app)
- **Styling:** Tailwind CSS v4
- **UI Library:** `@plane/propel` for new code (subpath imports only!), `@plane/ui` for legacy
- **Tables:** TanStack React Table (`@tanstack/react-table` 8.21.3)
- **Charts:** Recharts 2.12.7 (donut: `innerRadius="45%"`, 8-color palette)
- **Forms:** React Hook Form 7.51.5 (`useForm`, `Controller`)
- **DnD:** @atlaskit/pragmatic-drag-and-drop
- **Dates:** date-fns 4.1.0
- **Icons:** Lucide React (primary), Material Symbols Rounded (secondary), `@plane/propel/icons` (Plane-specific)
- **Rich Text:** Tiptap + Y.js for CRDT collaborative editing
- **Classnames:** `cn()` from `@plane/utils` for conditional classes

### Backend Stack

- **Framework:** Django 4.2 + DRF 3.15
- **Database:** PostgreSQL 15.7 (primary) + MongoDB 4.6 (activity logs)
- **Async:** Celery 5.4.0 + RabbitMQ (message broker)
- **Cache:** Redis/Valkey (sessions, computed results, rate limiters)
- **Storage:** MinIO (S3-compatible) via boto3
- **Real-time:** Express.js + Hocuspocus (Y.js CRDT) + Redis pub-sub

### Authentication & Authorization

**Auth methods:** Session cookie (Redis-backed), Bearer token (JWT/API key), OAuth (Google/GitHub/GitLab/Gitea), Magic link, Swing SSO

**RBAC roles (numeric values):**

| Role   | Value | Access                                                    |
| ------ | ----- | --------------------------------------------------------- |
| Owner  | 20    | Full control                                              |
| Admin  | 20    | Manage members, projects                                  |
| Member | 15    | Create/edit issues                                        |
| Guest  | 5     | Read-only (own issues if `guest_view_all_features=False`) |

- **Implementation:** `@allow_permission([ROLE.ADMIN, ROLE.MEMBER])` decorator
- **Instance admin:** `InstanceAdminPermission` (user.role >= 15)
- **HO access:** Instance Admin sees all workspaces; Dept Manager sees managed depts (BFS hierarchy)

---

## Critical Rules

### CE Pattern (NON-NEGOTIABLE)

- New features go in `ce/` directories — **NEVER modify `core/` or `packages/ui/`**
- Frontend CE: `apps/web/ce/` (stores, components, hooks, routes, services)
- CE routes: `app/routes/extended.ts`, NOT `core.ts` — route nesting MUST mirror `core.ts` layout tree
- CE services use `CE` prefix: `CEProjectWorklogService`, `CEMyFeatureService`
- CE stores extend base: `class RootStore extends CoreRootStore` in `ce/store/root.store.ts`
- Import aliases: `@/*` → core, `@/plane-web/*` → ce
- If `core/` needs changes → escalate to team lead

### MANDATORY: Search Before Build

**BEFORE creating ANY new component, hook, or UI element:**

```bash
grep -r "ComponentName" packages/propel/ packages/ui/ apps/web/core/components/ apps/web/ce/components/
```

**Existing dropdowns** (USE THEM): `MemberDropdown`, `DateRangeDropdown`, `ProjectDropdown`, `PriorityDropdown`, `StateDropdown`, `LabelDropdown` in `apps/web/core/components/dropdowns/`

### Common Mistakes to Avoid

| Bad                                     | Good                                                          |
| --------------------------------------- | ------------------------------------------------------------- |
| `bg-white`, `text-gray-500` (hardcoded) | `bg-surface-1`, `text-primary` (semantic)                     |
| `bg-surface-1` for inputs               | `bg-layer-2` for ALL inputs/selects/textareas                 |
| `@plane/propel` (barrel import)         | `@plane/propel/button` (subpath)                              |
| `@plane/ui` Button in new code          | `@plane/propel/button` in new code                            |
| `makeAutoObservable`                    | `makeObservable` with explicit fields                         |
| CE code in `core/`                      | CE code in `ce/` directory                                    |
| Missing `observer()` wrapper            | Always wrap MobX-connected components                         |
| `observer` from `mobx-react-lite`       | `observer` from `mobx-react`                                  |
| `set()` from MobX                       | `set()` from `lodash-es`                                      |
| `Issue.objects` for user queries        | `Issue.issue_objects`                                         |
| Missing `workspace__slug` filter        | Always filter by workspace (data leak!)                       |
| Missing `setToast()` after mutations    | `setToast({ type: TOAST_TYPE.SUCCESS, ... })`                 |
| `import { X } from "y"` for types       | `import type { X } from "y"`                                  |
| `text-color-primary` (legacy)           | `text-primary` (no `-color-` prefix)                          |
| `border-color-subtle` (legacy)          | `border-subtle` (no `-color-` prefix)                         |
| `dark:bg-slate-900` (manual dark)       | Semantic tokens auto-adapt (no `dark:` variants!)             |
| Missing `is_favorite` annotation        | Annotate `Exists(UserFavorite...)` on list queries            |
| Missing `issue_activity.delay()`        | Always fire after issue mutations                             |
| Raw SQL strings                         | Parameterized queries only                                    |
| Prop spreading `{...props}`             | Explicit props always                                         |
| Inline headers in page.tsx              | Use layout.tsx with `AppHeader` + `ContentWrapper` + `Outlet` |
| Recreating existing component           | Search existing components first                              |
| Hardcoded English strings               | `t()` from `@plane/i18n` for ALL visible text                 |
| `handleSubmit(handler)(e)`              | `void handleSubmit(handler)(e)` (avoids floating-promise)     |
| BaseViewSet for God Mode                | `BaseAPIView` from `plane.license.api.views`                  |
| `@allow_permission` for God Mode        | `InstanceAdminPermission`                                     |

---

## TypeScript Standards

### General Rules

- **Strict mode:** `strict: true` in `tsconfig.json`
- **No `any`:** Use explicit types; `// @ts-ignore` only as last resort
- **Type exports:** Always `export type` for interfaces/types (enables tree-shaking)
- **Null safety:** `strictNullChecks` enabled, handle null/undefined explicitly
- **Interfaces** for object shapes (not `type` aliases)

### File Naming

| Type             | Convention                  | Example                  |
| ---------------- | --------------------------- | ------------------------ |
| React Components | PascalCase                  | `WorkspaceSettings.tsx`  |
| Custom Hooks     | kebab-case + prefix         | `use-workspace-store.ts` |
| Utils/Services   | kebab-case                  | `api-service.ts`         |
| Constants        | UPPER_SNAKE_CASE            | `WORKSPACE_ROLES.ts`     |
| Types/Interfaces | PascalCase + interface file | `workspace-types.ts`     |
| Store files      | kebab-case.store.ts         | `workspace.store.ts`     |

### Import Order (mandatory sequence)

```typescript
// 1. React & external libraries
import React, { useState } from "react";
import { observer } from "mobx-react";

// 2. Type imports (separate with `import type`)
import type { IWorkspace } from "@plane/types";

// 3. @plane/* packages (subpath imports for propel)
import { Button } from "@plane/propel/button";
import { cn } from "@plane/utils";

// 4. Internal absolute imports (@/ = core, @/plane-web/ = ce)
import { useWorkspace } from "@/hooks/store/use-workspace";

// 5. Local relative imports
import { WorkspaceHeader } from "./workspace-header";
```

### Canonical Imports — Prevent Hallucination

| Package           | Import                                                      | Usage                                   |
| ----------------- | ----------------------------------------------------------- | --------------------------------------- |
| `mobx`            | `makeObservable, observable, action, computed, runInAction` | Store definitions                       |
| `mobx-react`      | `observer`                                                  | Component wrapper (NOT mobx-react-lite) |
| `mobx-utils`      | `computedFn`                                                | Parameterized computed values           |
| `lodash-es`       | `set`                                                       | Dynamic record key updates in stores    |
| `swr`             | `useSWR`                                                    | Read-only data fetching                 |
| `@plane/i18n`     | `useTranslation`                                            | i18n (apps/web ONLY, not admin)         |
| `@plane/propel/*` | Subpath imports                                             | New UI components                       |
| `@plane/ui`       | Named imports                                               | Legacy components (don't add new usage) |
| `@plane/utils`    | `cn`                                                        | Conditional classnames                  |
| `react-router`    | `Outlet, useParams, useNavigate`                            | Routing                                 |
| `./+types/page`   | `Route` type                                                | Type-safe route params                  |

### Component Patterns

- Functional components with explicit props interface
- No prop spreading — be explicit
- Always wrap MobX-connected components with `observer()`

```typescript
interface WorkspaceSelectorProps {
  value: string;
  onSelect: (id: string) => void;
  disabled?: boolean;
}

export const WorkspaceSelector: React.FC<WorkspaceSelectorProps> = observer(({ value, onSelect, disabled = false }) => {
  // Implementation
});
```

### Error Handling

```typescript
try {
  const data = await api.post("/issues/", payload);
  return data;
} catch (error) {
  if (error instanceof AxiosError) {
    console.error("API error:", error.message);
    throw new Error("Failed to create issue");
  }
  throw error;
}
```

---

## MobX State Management

### Store Pattern (ALWAYS use explicit `makeObservable`)

```typescript
import { makeObservable, observable, action, computed, runInAction } from "mobx";
import { computedFn } from "mobx-utils";
import { set } from "lodash-es"; // NOT from MobX!
import type { CoreRootStore } from "@/store/root.store";

export class MyStore implements IMyStore {
  dataMap: Record<string, IMyModel> = {};
  loader = false;

  constructor(private rootStore: CoreRootStore) {
    makeObservable(this, {
      dataMap: observable,
      loader: observable,
      currentItems: computed,
      fetchItems: action,
    });
  }

  // Parameterized computed (use computedFn, NOT regular computed)
  getItemById = computedFn((id: string) => this.dataMap[id] ?? null);

  get currentItems() {
    return Object.values(this.dataMap);
  }

  fetchItems = async (workspaceSlug: string) => {
    this.loader = true;
    try {
      const data = await myService.list(workspaceSlug);
      runInAction(() => {
        data.forEach((item) => {
          set(this.dataMap, item.id, item); // lodash-es set() for dynamic keys
        });
      });
      return data;
    } finally {
      runInAction(() => {
        this.loader = false;
      });
    }
  };

  // Optimistic update with rollback
  updateItem = async (id: string, data: Partial<IMyModel>) => {
    const original = { ...this.dataMap[id] };
    runInAction(() => {
      Object.assign(this.dataMap[id], data);
    });
    try {
      await this.service.update(id, data);
    } catch (error) {
      runInAction(() => {
        this.dataMap[id] = original;
      }); // rollback
      throw error;
    }
  };
}
```

### CE Store Registration

```typescript
// ce/store/root.store.ts — extends CoreRootStore
import { CoreRootStore } from "@/store/root.store";
export class RootStore extends CoreRootStore {
  myFeature: IMyFeatureStore;
  constructor() {
    super();
    this.myFeature = new MyFeatureStore(this);
  }
}
```

### SWR vs Store — Choose One Per Data Domain

- **`useSWR`** — Read-only display, benefit from cache/revalidation, component-local data
- **`store.fetchX()`** — Mutations + shared state across components
- **Rule:** Never mix — don't put SWR data into MobX stores

### Using Stores in Components

```typescript
import { observer } from "mobx-react"; // NOT mobx-react-lite

export const WorkspaceList = observer(() => {
  const { currentWorkspaces, loader } = useWorkspace();
  return (
    <div>
      {loader && <LoadingSpinner />}
      {currentWorkspaces.map((ws) => (
        <WorkspaceItem key={ws.id} workspace={ws} />
      ))}
    </div>
  );
});
```

---

## Routing & Layout Patterns (React Router v7)

### Layout Hierarchy (MANDATORY for every feature)

```
./(all)/layout.tsx                               ← auth gate
  ./(all)/[workspaceSlug]/layout.tsx             ← loads workspace data
    ./(all)/[workspaceSlug]/(projects)/layout.tsx ← sidebar + nav
      ./(all)/[workspaceSlug]/(projects)/my-feature/layout.tsx ← feature layout
        page.tsx                                  ← actual content
```

### Layout Component Pattern

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

### Page Component Pattern

```typescript
import type { Route } from "./+types/page";
import { observer } from "mobx-react";
import { useTranslation } from "@plane/i18n";

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

### Route Rules

- CE routes in `app/routes/extended.ts` — MUST mirror `core.ts` layout tree nesting
- Route groups `()` affect nesting but NOT the URL
- `apps/web` and `apps/admin` = CSR (no SSR loaders). `apps/space` = SSR (has loaders)
- CSR data fetching: `useEffect` + `store.fetchX()` or `useSWR`, NOT loaders
- NEVER build inline headers in `page.tsx` — use layout.tsx pattern
- `PageHead` component for page title in every route page
- Breadcrumbs from `@plane/ui` `Breadcrumbs` component

---

## Design System & Theming

### Theme System

- 4 themes via `data-theme` attribute: `light`, `dark`, `light-contrast`, `dark-contrast`
- Semantic tokens auto-adapt — **NEVER use `dark:` variants**

### Semantic Color Tokens (Tailwind v4)

**Backgrounds:**

| Token                                           | Usage                                                         |
| ----------------------------------------------- | ------------------------------------------------------------- |
| `bg-canvas`                                     | Page canvas background                                        |
| `bg-surface-1`                                  | Primary surface (cards, panels)                               |
| `bg-surface-2`                                  | Secondary surface                                             |
| `bg-layer-1` / `bg-layer-1-hover`               | Layer 1 (rows, list items)                                    |
| `bg-layer-2`                                    | Layer 2 (nested containers, **ALL inputs/selects/textareas**) |
| `bg-accent-primary` / `bg-accent-subtle`        | Accent states                                                 |
| `bg-success-*` / `bg-warning-*` / `bg-danger-*` | Status states                                                 |

**Text (short form — NO `text-color-*` prefix):**

| Token                                                                   | Usage                       |
| ----------------------------------------------------------------------- | --------------------------- |
| `text-primary`                                                          | Primary text                |
| `text-secondary`                                                        | Secondary/muted             |
| `text-tertiary`                                                         | Hint text                   |
| `text-placeholder` / `text-disabled`                                    | Placeholder/disabled        |
| `text-accent-primary`                                                   | Accent/link text            |
| `text-on-color`                                                         | Text on colored backgrounds |
| `text-success-primary` / `text-warning-primary` / `text-danger-primary` | Status text                 |

**Borders (short form — NO `border-color-*` prefix):**

- `border-subtle` — Default subtle border
- `border-strong` — Prominent border
- `border-accent-strong` / `border-danger-strong` — Accent/danger

**Layout Constants:**

- `--height-header`: 3.25rem (52px) — Top header height
- `--padding-page`: 1.35rem — Page content padding

### Tailwind Class Ordering

```
1. Layout (flex, grid, display)  2. Sizing (w, h)  3. Spacing (m, p)
4. Borders & radius  5. Colors (bg, text, border)  6. Effects (shadow, opacity)
7. Transforms & animations  8. Responsive variants
```

### Component Libraries

**@plane/propel (Primary — use for new code):**

Available exports: `accordion`, `animated-counter`, `avatar`, `badge`, `banner`, `button`, `calendar`, `card`, `charts/*`, `collapsible`, `combobox`, `command`, `context-menu`, `dialog`, `emoji-icon-picker`, `emoji-reaction`, `empty-state`, `icon-button`, `icons`, `input`, `menu`, `pill`, `popover`, `portal`, `scrollarea`, `skeleton`, `switch`, `tab-navigation`, `table`, `tabs`, `toast`, `toolbar`, `tooltip`, `utils`

```typescript
import { Button } from "@plane/propel/button";
import { Input } from "@plane/propel/input";
import { Dialog, EDialogWidth } from "@plane/propel/dialog";
import { Tooltip } from "@plane/propel/tooltip";
import { TOAST_TYPE, setToast, setPromiseToast } from "@plane/propel/toast";
import { PlaneLogo, GlobeIcon } from "@plane/propel/icons";
```

**Button variants:** `primary`, `secondary`, `tertiary`, `ghost`, `link`, `error-fill`, `error-outline`
**Button sizes:** `sm`, `base`, `lg`, `xl`
**Toast types:** `SUCCESS`, `ERROR`, `INFO`, `WARNING`, `LOADING`
**Input modes:** `primary`, `transparent`, `true-transparent` — Input has NO width, always add `className="w-full"`

**@plane/ui (Legacy — only when propel has no equivalent):**
Components ONLY in @plane/ui: `breadcrumbs`, `content-wrapper`, `control-link`, `drag-handle`, `drop-indicator`, `dropdown`, `dropdowns`, `favorite-star`, `form-fields`, `header`, `link`, `loader`, `modals`, `progress`, `sortable`, `tables`, `typography`

**Menus & Dropdowns:**

| Component     | Import                       | Use When                  |
| ------------- | ---------------------------- | ------------------------- |
| `CustomMenu`  | `@plane/ui`                  | Action menus in web app   |
| `Menu`        | `@plane/propel/menu`         | Action menus in admin app |
| `ContextMenu` | `@plane/propel/context-menu` | Right-click context menus |

### 3 Dialog Systems — Choose Based on App

| System                       | Used In              | Props                               |
| ---------------------------- | -------------------- | ----------------------------------- |
| `@plane/propel/dialog`       | `apps/admin/`        | `open`, `onOpenChange`              |
| `@headlessui/react`          | `apps/web/core/`     | `show` (Transition.Root), `onClose` |
| `ModalCore` from `@plane/ui` | `apps/web/` (legacy) | `isOpen`, `handleClose`             |

**Rule:** Admin = Propel Dialog. Web core = Headlessui. Don't mix.

### Typography

- Font: System font stack (`-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, ...`)
- Code: `"IBM Plex Mono", "Courier New", monospace`
- Sizes: `text-xs` (12px), `text-sm` (14px), `text-13` (Propel dialogs), `text-base` (16px), `text-lg` (18px)
- Weights: Regular (400), Medium (500), Semibold (600), Bold (700)

### Accessibility (WCAG 2.1 AA)

- Color contrast: 4.5:1 minimum for normal text
- Keyboard navigation: All interactive elements (Tab/Enter/Space/Arrow)
- ARIA labels on complex components (`aria-label`, `aria-labelledby`)
- Focus indicators visible (`focus:ring-2`)
- Semantic HTML (`<button>` not `<div onClick>`)

---

## Forms & Inputs

### react-hook-form + Controller

```typescript
import { useForm, Controller } from "react-hook-form";
import { Button } from "@plane/propel/button";
import { Input } from "@plane/propel/input";

const {
  control,
  handleSubmit,
  formState: { errors },
  reset,
} = useForm<FormData>({
  defaultValues: { name: "" },
});

// void prevents floating-promise ESLint warning
<form onSubmit={(e) => void handleSubmit(onSubmit)(e)}>
  <Controller
    name="name"
    control={control}
    rules={{ required: "Name is required" }}
    render={({ field }) => <Input {...field} className="w-full" error={errors.name?.message} />}
  />
  <Button type="submit" variant="primary" loading={isSubmitting}>
    Save
  </Button>
</form>;
```

### Input Backgrounds (CRITICAL)

ALL inputs, selects, textareas, date pickers use `bg-layer-2` (NOT `bg-surface-1`):

```tsx
// ✅ CORRECT
<input className="bg-layer-2 border-[0.5px] border-subtle ..." />
// ❌ WRONG
<input className="bg-surface-1 ..." />
```

---

## Internationalization (i18n)

- **Scope:** `apps/web` ONLY — do NOT use i18n in `apps/admin`
- **Import:** `useTranslation()` from `@plane/i18n`
- **Languages:** 19 supported (EN, KO, VI primary)
- **Translation files:** `.ts` modules (NOT JSON) at `packages/i18n/src/locales/{lang}/translations.ts`
- **What must use `t()`:** Buttons, titles, placeholders, toasts (title AND message), empty states, errors, aria-labels
- **Pluralization:** ICU MessageFormat (`{count, plural, one {item} other {items}}`)
- **Must add keys to ALL 3 files:** en, ko, vi (use English as placeholder)

```typescript
import { useTranslation } from "@plane/i18n";
const { t } = useTranslation();

// ✅ CORRECT
setToast({ type: TOAST_TYPE.SUCCESS, title: t("dashboard.created") });
<Button>{t("common.save")}</Button>
<p>{t("dashboard.empty_state")}</p>

// ❌ WRONG — hardcoded English
setToast({ type: TOAST_TYPE.SUCCESS, title: "Success!" });
<Button>Cancel</Button>
```

---

## API Service Pattern (Frontend)

```typescript
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
}
```

**Rules:** CE services in `ce/services/`, core in `core/services/`. Always include `.catch`. Always `setToast()` after mutations.

---

## Python/Django Standards

### Model Hierarchy

```python
TimeAuditModel → created_at, updated_at (auto)
UserAuditModel → created_by, updated_by (auto via crum)
SoftDeleteModel → deleted_at, objects (SoftDeletionManager)
AuditModel = TimeAuditModel + UserAuditModel + SoftDeleteModel
BaseModel(AuditModel) → id: UUID primary key
ProjectBaseModel(BaseModel) → project FK + workspace FK (auto-set from project)
```

- **`BaseModel`** — workspace-level entities (Department, StaffProfile)
- **`ProjectBaseModel`** — project-scoped (Issue, State, Label, Cycle, Module). Auto-sets `workspace = project.workspace`

### Custom Managers (CRITICAL)

```python
Issue.objects          # SoftDeletionManager — excludes deleted_at only
Issue.issue_objects    # IssueManager — excludes deleted + triage + archived + draft
Issue.all_objects      # Default — includes everything
State.objects          # StateManager — excludes deleted + triage
State.triage_objects   # Only triage states
```

**Rule:** `Issue.issue_objects` for user-facing queries. `Issue.objects` only when you need archived/draft/triage.

### ViewSet Pattern

Two base classes from `plane.app.views.base`:

- **`BaseViewSet`** — standard CRUD (inherits ModelViewSet + BasePaginator)
- **`BaseAPIView`** — custom endpoints (no CRUD)

Both provide: `self.workspace_slug`, `self.project_id`, `self.fields`, `self.expand`

```python
class IssueViewSet(BaseViewSet):
    model = Issue
    webhook_event = "issue"

    def get_queryset(self):
        return Issue.issue_objects.filter(
            project_id=self.kwargs.get("project_id"),
            workspace__slug=self.kwargs.get("slug"),
        ).distinct()

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])
    def list(self, request, slug, project_id):
        filters = issue_filters(request.query_params, "GET")
        return self.paginate(request=request, queryset=self.get_queryset().filter(**filters))
```

### God Mode / Instance Admin Views

```python
from plane.license.api.views import BaseAPIView  # NOT plane.app.views
from plane.license.api.permissions import InstanceAdminPermission

class MyInstanceView(BaseAPIView):
    permission_classes = [InstanceAdminPermission]
    # No workspace_slug, no project_id, no @allow_permission
```

### Post-Mutation Requirements

1. `issue_activity.delay()` — activity log + push notifications
2. `model_activity.delay()` — webhook events to external consumers
3. `recent_visited_task.delay()` — on retrieve for recent visit tracking
4. For `partial_update`: capture `current_instance` BEFORE update for activity diff

### URL Registration (3 places to update)

1. Create `plane/app/urls/my_domain.py`
2. Import in `plane/app/urls/__init__.py`
3. Add to combined urlpatterns

URL rules: workspace scope `workspaces/<str:slug>/...`, project scope `workspaces/<str:slug>/projects/<uuid:project_id>/...`, kebab-case segments, `<uuid:pk>` for entity IDs.

### Celery Tasks

```python
@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def my_task(self, model_id):
    try:
        obj = MyModel.objects.get(id=model_id)
        # process...
    except MyModel.DoesNotExist:
        return  # Skip silently
    except Exception as e:
        log_exception(e)
        self.retry(exc=e)
```

Tasks auto-discovered via `autodiscover_tasks()`. Always `str()` for UUID when passing to tasks. Scheduled tasks in `plane/celery.py` `beat_schedule`.

---

## ESLint & Prettier

### ESLint (v9 flat config at `/eslint.config.mjs`)

| Rule                                      | Level | Purpose                                |
| ----------------------------------------- | ----- | -------------------------------------- |
| `@typescript-eslint/no-explicit-any`      | warn  | Prevent `any` types                    |
| `@typescript-eslint/no-floating-promises` | warn  | Catch unhandled promises               |
| `react-hooks/rules-of-hooks`              | error | Enforce hooks rules                    |
| `import/prefer-type-imports`              | warn  | Use type imports                       |
| `@plane/no-legacy-tokens`                 | error | Block `text-color-*`, `border-color-*` |

**Custom plugin:** `eslint-plugin-plane` with `no-legacy-tokens` rule.

### Prettier (`.prettierrc`)

- **Print width: 120** (NOT 80 or 100)
- Tab width: 2 spaces
- Semicolons: required (default)
- **Trailing commas: es5** (arrays, objects — NOT function params)
- Quotes: double (default)
- Plugin: `@prettier/plugin-oxc`
- Override: `packages/codemods/**` uses 80-char width

### Pre-commit (Husky)

1. Prettier auto-formats staged files
2. ESLint checks with `--max-warnings=0`

---

## Git Safety (NON-NEGOTIABLE)

- **Origin:** `github.com/shbvn/plane.git`
- **Default branch:** `preview` | **Staging:** `develop`
- **Branch naming:** `{username}/{type}/{description}` (e.g., `duonglx/feat/time-tracking`)
- **Flow:** feature branch → develop (squash merge, PR) → preview (PR, team lead approve)
- **Hotfix:** branch from preview → PR to preview → sync back to develop
- **Branch protection:** Both `preview` and `develop` require 1 PR review, no force push, stale reviews dismissed
- NEVER pull/merge/rebase from upstream (`makeplane/plane`)
- NEVER force push to `preview` or `develop`
- NEVER push directly to `preview` or `develop` — PR required, 1 review minimum
- NEVER commit secrets (.env, API keys, credentials, database URLs)
- **Commit format:** `feat(scope):`, `fix(scope):`, `docs:`, `refactor:`, `chore:`, `test:`, `ci:`
- No AI references in commit messages

---

## Build & Quality Commands

| Command                              | Purpose                    |
| ------------------------------------ | -------------------------- |
| `pnpm install`                       | Install all dependencies   |
| `pnpm build`                         | Build all packages         |
| `pnpm dev`                           | Start dev servers          |
| `pnpm check:lint`                    | Run ESLint across monorepo |
| `pnpm fix:lint`                      | Auto-fix lint issues       |
| `pnpm check:format`                  | Check Prettier formatting  |
| `pnpm format`                        | Auto-fix formatting        |
| `pnpm test`                          | Run tests (Vitest)         |
| `cd apps/api && python run_tests.py` | Run backend tests          |

---

## Security

- **Workspace isolation:** ALWAYS filter by `workspace__slug` — prevent cross-workspace data leaks
- **Permissions:** `@allow_permission` on workspace/project endpoints; `InstanceAdminPermission` for God Mode
- **Input validation:** Server-side with DRF serializers; frontend with Zod schemas
- **No secrets:** Never expose internal IDs, stack traces, or credentials
- **SQL safety:** Parameterized queries only — no raw SQL string interpolation
- **HTML sanitization:** `nh3` library
- **Rate limiting:** Per user/IP throttling
- **CSRF:** Tokens required for session auth
- **CORS:** Whitelist only allowed origins

---

## Key Features (v1.2.4)

### Task Categories

Instance-level 2-tier: `MainTaskCategory → SubTaskCategory`. Optional FK fields on Issue. Admin CRUD at `/task-categories/`. Workspace read-only at `/workspaces/<slug>/task-categories/`.

### Head Office (HO) API

Cross-workspace issue management. Instance Admins see all; Dept Managers see managed depts (BFS). Endpoints: `/api/ho/issues/`, `/api/ho/category-summary/`.

### Time Tracking / Worklogs

`IssueWorkLog`: `duration_minutes` (1–720), `logged_at` (no future, 7-day edit window), ADMIN-only edit/delete. Flag: `Project.is_time_tracking_enabled`. Celery: daily reminder, async export.

### Workflow Enforcement

5 models: `ProjectWorkflow` (toggle), `WorkflowStateConfig`, `WorkflowTransition`, `WorkflowTransitionApprover`, `WorkflowActivity`. HTTP 403 unauthorized transition, 400 restricted state creation.

### Department & Staff

Hierarchical tree (max 6 levels). God-mode admin. `StaffProfile` 1:1 User per workspace. Statuses: active/probation/resigned/suspended/transferred. Auto-join: `sync_department_workspace_members`.

### Priority System

4 levels: `urgent`, `high`, `medium`, `low`. Default: `medium`. "none" removed. API rejects `priority=none` with 400.

### UserFavorite Pattern

Polymorphic. Backend annotates `is_favorite=Exists(...)`. Optimistic updates with rollback.

### Swing SSO

Enterprise auth. Keys: `IS_SWING_SSO_ENABLED`, `SWING_SSO_URL`, `SWING_SSO_CLIENT_ID`, `SWING_SSO_CLIENT_SECRET`, `SWING_SSO_COMPANY_CODE`. Two flows: staff ID or token redirect.

---

## Code Quality

### File Size Limits

- TypeScript: <200 lines | Components: <150 lines | Hooks: <100 lines | Services: <200 lines | Django views: <150 lines

### Principles

- **YAGNI / KISS / DRY**
- Files: kebab-case, descriptive names
- Do NOT create "enhanced" copies — update existing files directly

---

## Documentation

All project docs in `./docs/` — **always read before implementing:**

| Document                       | Purpose                                         |
| ------------------------------ | ----------------------------------------------- |
| `docs/codebase-summary.md`     | Monorepo structure, module map, feature details |
| `docs/code-standards.md`       | TypeScript/Python coding conventions, patterns  |
| `docs/design-guidelines.md`    | UI/UX standards, theming, accessibility         |
| `docs/system-architecture.md`  | System design, data models, auth, deployment    |
| `docs/project-overview-pdr.md` | Product requirements                            |
| `docs/deployment-guide.md`     | Deploy procedures                               |
