# God Mode Frontend Structure Research

## File Organization

**Admin app structure:**

```
apps/admin/
├── app/
│   ├── (all)/
│   │   ├── (home)/           # Auth pages (sign-in, setup)
│   │   └── (dashboard)/      # Protected dashboard routes
│   │       ├── email/        # Email configuration
│   │       ├── authentication/
│   │       ├── workspace/
│   │       ├── users/
│   │       ├── general/
│   │       ├── ai/
│   │       └── image/
│   ├── routes.ts            # Flat route configuration
│   ├── compat/next/         # Next.js compatibility layer
│   └── components/
├── store/                   # MobX stores (no CE pattern override)
├── components/              # Shared components
├── providers/               # React providers
├── hooks/                   # Custom hooks (useInstance, useUser, etc)
└── styles/
```

## Routing Pattern

Uses **React Router v7 with flat route configuration**:

- File: `app/routes.ts`
- Config: `layout()`, `route()`, `index()` from `@react-router/dev/routes`
- Structure: Two layouts - (home) for auth, (dashboard) for protected pages
- Route naming: Kebab-case paths map directly to file structure
- **No URL-based admin roles check** (permission checking at API level)

## Component Patterns

**Page Components:**

- Wrap with `observer()` (MobX observable pattern)
- Use React Router v7 `Route.ComponentProps` type
- Export `meta` function for page title
- Pattern: `observer(function PageName() { ... })`

**Settings Form Components:**

- Examples: `email-config-form.tsx`, `intercom.tsx`
- Separate form component from page wrapper
- Page (`page.tsx`) handles data fetch & state, form handles submission

**UI Libraries:**

- `@plane/propel/*` for primary UI (Button, Toast, Icons, Tooltip)
- `@plane/ui` for secondary UI (Input, ToggleSwitch, Loader, CustomSelect)
- No editor component used in admin yet

## API & State Management

**Pattern: MobX Store + SWR**

- Stores: `InstanceStore`, `UserStore`, `WorkspaceStore` (in `/store`)
- Service layer: `InstanceService` from `@plane/services`
- Page-level data fetch: `useSWR()` hook + store method
- Hooks: `useInstance()`, `useUser()` (from `@/hooks/store`)

**Store implementation:**

- `makeObservable()` explicit (not auto)
- `runInAction()` for state updates post-API call
- `computed` for derived values (e.g., formattedConfig)
- Service instantiated in constructor

**Email store example:**

```typescript
// fetch
const { isLoading } = useSWR("INSTANCE_CONFIGURATIONS",
  () => fetchInstanceConfigurations());
// mutate
await updateInstanceConfigurations(data);
// computed config transformation
get formattedConfig() {
  return reduce(...) // {key: value} format
}
```

## Key Files to Extend

**Email feature (email template mgmt):**

- Page: `apps/admin/app/(all)/(dashboard)/email/page.tsx`
- Form: `apps/admin/app/(all)/(dashboard)/email/email-config-form.tsx`
- Store method: Add to `InstanceStore` in `store/instance.store.ts`
- Service: Use `@plane/services/InstanceService`

**No separate email template routes exist yet** — entire email config on single page.

## State Update Pattern

When form submits:

1. Call store action (e.g., `updateInstanceConfigurations(data)`)
2. Store calls service API
3. Store updates observable state via `runInAction()`
4. Component re-renders via MobX observer
5. Toast notification for success/error

## Notes

- **No environment-based config** — admin app is standalone (uses API auth)
- **Single layout pattern** — all dashboard pages under same (dashboard) layout
- **No CE override** — admin is unified, no ce/ pattern needed
- **Token limit** — 200 lines code files (components <150)
