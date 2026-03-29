# Web App — Agent Rules

> Frontend rules for `apps/web/`. Read root `AGENTS.md` first for universal rules.

## Stack

React 18 + React Router v7 (CSR, no SSR loaders) + Vite + MobX (38 stores) + Tailwind CSS v4

## Import Aliases

- `@/*` → `apps/web/core/*` (upstream shared — DO NOT modify for CE)
- `@/plane-web/*` → `apps/web/ce/*` (CE features go here)

## Canonical Imports

| Package           | Import                                                      | Note                                 |
| ----------------- | ----------------------------------------------------------- | ------------------------------------ |
| `mobx`            | `makeObservable, observable, action, computed, runInAction` | Store definitions                    |
| `mobx-react`      | `observer`                                                  | NOT mobx-react-lite                  |
| `mobx-utils`      | `computedFn`                                                | Parameterized computed               |
| `lodash-es`       | `set`                                                       | Dynamic record keys (NOT MobX `set`) |
| `swr`             | `useSWR`                                                    | Read-only data fetching              |
| `@plane/i18n`     | `useTranslation`                                            | i18n (web ONLY, NOT admin)           |
| `@plane/propel/*` | Subpath imports                                             | New UI components                    |
| `@plane/ui`       | Named imports                                               | Legacy only                          |
| `@plane/utils`    | `cn`                                                        | Conditional classnames               |
| `react-router`    | `Outlet, useParams, useNavigate`                            | Routing                              |
| `./+types/page`   | `Route` type                                                | Type-safe route params               |

**Import order:** React/external → `import type` → @plane/\* → @/ → relative

## MobX Store Pattern

```typescript
import { makeObservable, observable, action, computed, runInAction } from "mobx";
import { computedFn } from "mobx-utils";
import { set } from "lodash-es";

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

  getItemById = computedFn((id: string) => this.dataMap[id] ?? null);
  get currentItems() {
    return Object.values(this.dataMap);
  }

  fetchItems = async (workspaceSlug: string) => {
    this.loader = true;
    try {
      const data = await myService.list(workspaceSlug);
      runInAction(() => {
        data.forEach((item) => set(this.dataMap, item.id, item));
      });
      return data;
    } finally {
      runInAction(() => {
        this.loader = false;
      });
    }
  };
}
```

- CE stores in `ce/store/`, registered in `ce/store/root.store.ts` (extends `CoreRootStore`)
- **SWR vs Store:** `useSWR` for read-only cache; `store.fetchX()` for mutations + shared state. Never mix.
- Optimistic updates: save original → mutate → rollback on error

## Routing & Layout

```
./(all)/layout.tsx                                ← auth gate
  ./(all)/[workspaceSlug]/layout.tsx              ← workspace data
    ./(all)/[workspaceSlug]/(projects)/layout.tsx  ← sidebar + nav
      feature/layout.tsx                           ← AppHeader + ContentWrapper + Outlet
        page.tsx                                   ← PageHead + content
```

**Layout pattern (MANDATORY):**

```typescript
import { AppHeader } from "@/components/core/app-header";
import { ContentWrapper } from "@plane/ui";
import { Outlet } from "react-router";

export default function MyLayout() {
  return (
    <>
      <AppHeader header={<MyHeader />} />
      <ContentWrapper>
        <Outlet />
      </ContentWrapper>
    </>
  );
}
```

- CE routes in `app/routes/extended.ts` — nesting MUST mirror `core.ts` layout tree
- Route groups `()` affect nesting, NOT URL
- CSR data: `useEffect` + store or `useSWR`, NOT SSR loaders
- NEVER inline headers in `page.tsx` — use layout.tsx
- `PageHead` for page title, `Breadcrumbs` from `@plane/ui`

## Semantic Color Tokens

**Backgrounds:** `bg-canvas`, `bg-surface-1`, `bg-surface-2`, `bg-layer-1`, `bg-layer-1-hover`, `bg-layer-2` (inputs!), `bg-accent-primary`, `bg-accent-subtle`, `bg-success-*`, `bg-warning-*`, `bg-danger-*`
**Text:** `text-primary`, `text-secondary`, `text-tertiary`, `text-placeholder`, `text-disabled`, `text-accent-primary`, `text-on-color`
**Borders:** `border-subtle`, `border-strong`, `border-accent-strong`, `border-danger-strong`
**Layout:** `--height-header: 3.25rem`, `--padding-page: 1.35rem`

❌ NEVER `dark:` variants. ❌ NEVER `text-color-*` / `border-color-*`. ❌ NEVER `bg-surface-1` for inputs (use `bg-layer-2`).

## Component Libraries

**Search before build!** `grep -r "ComponentName" packages/propel/ packages/ui/ apps/web/core/components/`

**@plane/propel (new code):** `button`, `input`, `toast`, `dialog`, `tooltip`, `popover`, `avatar`, `badge`, `icons`, `menu`, `tabs`, `table`, `skeleton`, `switch`, `combobox`, `command`, `context-menu`, `emoji-icon-picker`, `empty-state`, `scrollarea`

- Button variants: `primary`, `secondary`, `tertiary`, `ghost`, `link`, `error-fill`, `error-outline`
- Button sizes: `sm`, `base`, `lg`, `xl`
- Input: add `className="w-full"` (no built-in width)

**@plane/ui (legacy only):** `breadcrumbs`, `content-wrapper`, `dropdowns`, `modals`, `loader`, `tables`
**Existing dropdowns:** `MemberDropdown`, `DateRangeDropdown`, `ProjectDropdown`, `PriorityDropdown`, `StateDropdown`, `LabelDropdown` in `core/components/dropdowns/`

**Dialogs (web app):**

- `@headlessui/react` — `show` + `onClose` (core components)
- `ModalCore` from `@plane/ui` — `isOpen` + `handleClose` (legacy)
- `CustomMenu` from `@plane/ui` for action menus

**Toast:** `import { TOAST_TYPE, setToast, setPromiseToast } from "@plane/propel/toast"`
Types: `SUCCESS`, `ERROR`, `INFO`, `WARNING`, `LOADING`

## i18n (MANDATORY in apps/web)

- `useTranslation()` from `@plane/i18n` — ALL visible text must use `t()`
- Buttons, titles, placeholders, toasts, empty states, errors, aria-labels
- Translation files: `.ts` modules at `packages/i18n/src/locales/{lang}/translations.ts`
- ICU MessageFormat for pluralization
- Add keys to ALL 3 files: en, ko, vi

## Forms

```typescript
// void prevents floating-promise ESLint warning
<form onSubmit={(e) => void handleSubmit(onSubmit)(e)}>
  <Controller name="name" control={control} render={({ field }) => <Input {...field} className="w-full" />} />
</form>
```

ALL inputs/selects/textareas: `bg-layer-2` (NOT `bg-surface-1`)

## Frontend Service Pattern

```typescript
export class MyService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }
  async list(slug: string) {
    return this.get(`/api/workspaces/${slug}/my-models/`)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }
}
```

CE services in `ce/services/` with `CE` prefix.

## TypeScript

- `strict: true`, no `any`, `export type` for interfaces
- Interfaces for object shapes (not `type` aliases)
- `strictNullChecks` enabled
